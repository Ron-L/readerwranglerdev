/**
 * ReaderWrangler Relay Client
 * Upload/download orchestration for the Cloudflare relay.
 * Used by both the bookmarklet (amazon.com) and the app (readerwrangler.com).
 *
 * Dependencies: window.RWCrypto, window.RWCompress
 * Global: window.RWRelay
 */

(function() {
  'use strict';

  // 7.26.0 - Logging (docs/design/LOGGING.md §6): the page's logger when there is one (the app). On Amazon's pages (the
  // fetchers) and in the relay's Node tests there isn't — the fetchers' own log is LOGGING.md item 10 — so the same call
  // prints to the console in the logger's format instead. Calls stay rwLog.log(level, code, text, data), so the commit's
  // code scan still checks every one.
  const rwLog = (typeof window !== 'undefined' && window.rwLog) || {
    log: (level, code, text, data) => {
      const method = { debug: 'debug', info: 'info', warning: 'warn', error: 'error', critical: 'error' }[level] || 'log';
      const line = `${level} · ${code} · ${text}`;
      if (data !== undefined) console[method](line, data); else console[method](line);
    }
  };

  const WORKER_URL = 'https://readerwrangler-relay.readerwrangler.workers.dev';
  const CHUNK_SIZE = 20 * 1024 * 1024; // 20 MB per chunk (under 25 MB KV limit)
  const RELAY_STORAGE_KEY = 'readerwrangler-relay';

  // v6.17.1 - Recovery steps surfaced when the synced (relay) copy fails its integrity check (almost always a
  // browser tab closed mid-sync). SINGLE SOURCE OF TRUTH: the checksum error carries this text (so a fetcher's
  // error overlay shows it), and the app reads window.RW_RECOVERY_STEPS to render a dialog with a Copy button.
  const RECOVERY_NUMBERED =
    '1. SAVE A BACKUP — in your ReaderWrangler tab: File → Save Backup…\n' +
    '2. DOWNLOAD LIBRARY — in a NEW browser tab, click your ReaderWrangler bookmarklet →\n' +
    '   “Go to Amazon Library Page”, then the bookmarklet again → “Download Library”.\n' +
    '3. DOWNLOAD COLLECTIONS — in that tab (or a second new one), click the bookmarklet →\n' +
    '   “Go to Amazon Collections Page”, then → “Download Collections”.\n' +
    '   (Separate step; the library download doesn’t include collections.)\n' +
    '4. IMPORT — back in your ReaderWrangler tab, the File menu turns red (“Update available”)\n' +
    '   → File → Import from Relay.';
  const RECOVERY_STEPS =
    'Your library is safe on the ReaderWrangler device — this only affects the synced (cloud) copy.\n' +
    'Keep your ReaderWrangler tab open (it’s slow to reload). Do ALL of these, in order:\n\n' + RECOVERY_NUMBERED;
  if (typeof window !== 'undefined') {
    window.RW_RECOVERY_STEPS = RECOVERY_STEPS;       // full text — fetcher overlay + the Copy button
    window.RW_RECOVERY_NUMBERED = RECOVERY_NUMBERED; // just the steps — app dialog block (reassurance shown above it)
  }

  let _channelId = null;
  let _passphrase = null;
  let _cryptoKey = null; // Cached after first derivation
  let _lastDstateGen = null; // v7.6.1 - generation getDeviceState last SERVED (freshness = gen identity, not timestamps)

  // Worker URL override for dev/testing (set window._RW_RELAY_WORKER_URL before load/use).
  function workerUrl() {
    return (typeof window !== 'undefined' && window._RW_RELAY_WORKER_URL) || WORKER_URL;
  }

  // --- Signed writes (7.25.0 — docs/design/RELAY-SECURITY-PLAN.md, Phase 3) ---
  // The Channel ID only ADDRESSES a mailbox; every write and delete is signed with a write key derived from the
  // passphrase (never the encryption key). ONE signer — signedFetch — that every non-GET request goes through.
  const SIG_VERSION = 'RW-SIG-1';     // must match relay/relay-worker.js (git-hooks/check-shared-numbers.js)
  // Big encrypted parts are signed by SIZE (their bytes: the signed manifest's SHA-256 + AES-GCM); the rest by SHA-256.
  const PART_ROUTE = /^\/(?:upload\/[^/]+\/chunk\/\d+|(?:gen|dstate)\/[^/]+\/[^/]+\/chunk\/\d+|mail\/[^/]+\/[^/]+\/letter\/\d+|mail\/[^/]+\/letter)$/;
  let _writeKeyHex = null;  // derived once per set of credentials
  let _registered = false;  // this session has told the relay its write key (or the relay predates signed writes)
  let _clockOffsetMs = 0;   // the relay's clock minus ours, learned from a "time is off" refusal

  const toHex = buf => Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
  const hexBytes = hex => new Uint8Array(hex.match(/../g).map(h => parseInt(h, 16)));
  const bodyBytes = body => body == null ? new Uint8Array(0)
    : typeof body === 'string' ? new TextEncoder().encode(body)
    : ArrayBuffer.isView(body) ? new Uint8Array(body.buffer, body.byteOffset, body.byteLength)
    : new Uint8Array(body);

  /** Credentials changed (or were cleared): every key derived from them must be derived again. */
  function forgetDerivedKeys() {
    _cryptoKey = null;
    _writeKeyHex = null;
    _registered = false;
  }

  async function writeKeyHex() {
    if (!_writeKeyHex) {
      if (!_channelId || !_passphrase) throw new Error('Relay not configured');
      const base = await crypto.subtle.importKey('raw', new TextEncoder().encode(_passphrase), 'PBKDF2', false, ['deriveBits']);
      const bits = await crypto.subtle.deriveBits(
        { name: 'PBKDF2', salt: new TextEncoder().encode('rw-write-key:' + _channelId), iterations: 100000, hash: 'SHA-256' },
        base, 256);
      _writeKeyHex = toHex(bits);
    }
    return _writeKeyHex;
  }

  /** Tell the relay this channel's write key, once per session. 404 = a relay from before signed writes. */
  async function ensureRegistered() {
    if (_registered) return;
    const r = await fetch(`${workerUrl()}/auth/${_channelId}/register`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ key: await writeKeyHex() })
    });
    if (r.status === 409) {
      const err = new Error('This Cloud Sync channel is already claimed by a different key - make a new key in Relay Setup.');
      err.status = 409;
      throw err;
    }
    if (r.ok || r.status === 404) _registered = true; // anything else: try again next write; the write reports its own result
  }

  /** fetch() for the relay: GETs as they are; every other method signed (t + sig in the address). */
  async function signedFetch(path, options) {
    const opts = options || {};
    const method = (opts.method || 'GET').toUpperCase();
    if (method === 'GET' || !_channelId || !_passphrase) return fetch(`${workerUrl()}${path}`, opts);
    await ensureRegistered();
    const keyHex = await writeKeyHex();
    const send = async () => {
      const url = new URL(`${workerUrl()}${path}`);
      const t = String(Date.now() + _clockOffsetMs);
      const bytes = bodyBytes(opts.body);
      const contents = PART_ROUTE.test(url.pathname) ? `size:${bytes.byteLength}` : toHex(await crypto.subtle.digest('SHA-256', bytes));
      const q = new URLSearchParams(url.search);
      q.delete('t'); q.delete('sig');
      const qs = q.toString();
      const text = [SIG_VERSION, method, url.pathname + (qs ? '?' + qs : ''), t, contents].join('\n');
      const key = await crypto.subtle.importKey('raw', hexBytes(keyHex), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
      url.searchParams.set('t', t);
      url.searchParams.set('sig', toHex(await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(text))));
      return fetch(url.toString(), opts);
    };
    let res = await send();
    if (res.status === 401) {   // a PC clock that's off: learn the relay's time and retry once
      const info = await res.clone().json().catch(() => null);
      if (info && typeof info.serverTime === 'number' && Math.abs(info.serverTime - (Date.now() + _clockOffsetMs)) > 60000) {
        _clockOffsetMs = info.serverTime - Date.now();
        res = await send();
      }
    }
    return res;
  }

  // --- Shared packing pipeline (legacy + Phase 1 paths) ---

  async function checksumOf(bufferOrView) {
    const buf = bufferOrView instanceof ArrayBuffer ? bufferOrView : bufferOrView.buffer;
    const hashArray = new Uint8Array(await crypto.subtle.digest('SHA-256', buf));
    return 'sha256:' + Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 7.25.0 (signed writes, design item 8) - a copy minted from this date on MUST carry its checksum: its manifest is
  // signed, so nobody could have stripped it — a missing one means something is wrong, and the reader falls back.
  // Older copies are grandfathered (the check stays optional for them). Decided by the copy's own minted time.
  // Every redesign-format writer has included the checksum since afcd004 (2026-08-14), so any copy minted on or after
  // the day this was built already has one — a missing one is never a normal copy.
  const CHECKSUM_REQUIRED_FROM = Date.UTC(2026, 9, 31); // 2026-10-31 00:00 UTC

  /** THE integrity rule for every redesign-format read (generation, device-state, mailbox run, inline letter). The
   *  pre-redesign single-copy download() keeps its optional check — it predates minted ids. */
  async function verifyChecksum(bytes, checksum, mintedId) {
    if (!checksum) {
      if (idTimestamp(mintedId) >= CHECKSUM_REQUIRED_FROM) throw new Error('checksum missing');
      return;
    }
    if (await checksumOf(bytes) !== checksum) throw new Error('checksum mismatch');
  }

  /** compress → encrypt; returns Uint8Array of encrypted bytes */
  async function pack(jsonString, notify) {
    (notify || (() => {}))('compressing', 'Compressing data...');
    const compressed = await window.RWCompress.compress(jsonString);
    (notify || (() => {}))('encrypting', 'Encrypting...');
    const key = await getKey();
    const encrypted = await window.RWCrypto.encryptPacked(key, compressed);
    return { bytes: new Uint8Array(encrypted), compressedBytes: compressed.byteLength };
  }

  /** decrypt → decompress; takes ArrayBuffer/Uint8Array of encrypted bytes, returns string */
  async function unpack(encrypted, notify) {
    (notify || (() => {}))('decrypting', 'Decrypting...');
    const key = await getKey();
    const buf = encrypted instanceof ArrayBuffer ? encrypted : encrypted.buffer;
    const compressed = await window.RWCrypto.decryptPacked(key, buf);
    (notify || (() => {}))('decompressing', 'Decompressing...');
    return window.RWCompress.decompress(compressed);
  }

  /**
   * Initialize from bookmarklet globals (amazon.com context).
   * Bookmarklet sets window._RW_RELAY_CHANNEL and window._RW_RELAY_PASSPHRASE.
   */
  function initFromGlobals() {
    _channelId = window._RW_RELAY_CHANNEL || null;
    _passphrase = window._RW_RELAY_PASSPHRASE || null;
    forgetDerivedKeys();
  }

  /**
   * Initialize from localStorage (app context).
   * Reads channelId and passphrase from the relay storage key.
   */
  function initFromStorage() {
    try {
      // not-readSaved: this module also runs on Amazon's page (the bookmarklets), where uiHelpers.js isn't loaded
      const stored = JSON.parse(localStorage.getItem(RELAY_STORAGE_KEY));
      if (stored) {
        _channelId = stored.channelId || null;
        _passphrase = stored.passphrase || null;
      }
    } catch {
      _channelId = null;
      _passphrase = null;
    }
    forgetDerivedKeys();
  }

  /**
   * Check if relay credentials are configured.
   */
  function isConfigured() {
    return !!_channelId && !!_passphrase;
  }

  /**
   * Get the current channel ID (for UI display).
   */
  function getChannelId() {
    return _channelId;
  }

  /**
   * Get or derive the crypto key (cached after first call).
   */
  async function getKey() {
    if (!_cryptoKey) {
      if (!_channelId || !_passphrase) throw new Error('Relay not configured');
      _cryptoKey = await window.RWCrypto.deriveKey(_passphrase, _channelId);
    }
    return _cryptoKey;
  }

  /**
   * Upload library JSON to relay.
   * Compresses, encrypts, chunks, and uploads to the Worker.
   * @param {string} jsonString - The library JSON string to upload
   * @param {function} onProgress - Optional callback: (phase, detail) => void
   * @returns {object} The manifest object
   */
  async function upload(jsonString, onProgress) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const notify = onProgress || (() => {});

    // Count books for manifest
    let bookCount = 0;
    try {
      const parsed = JSON.parse(jsonString);
      // Handle both array format and object-with-bookItems format
      if (Array.isArray(parsed)) {
        bookCount = parsed.length;
      } else if (parsed.bookItems) {
        bookCount = parsed.bookItems.length;
      } else if (parsed.library && parsed.library.bookItems) {
        bookCount = parsed.library.bookItems.length;
      }
    } catch { /* ignore parse errors for count */ }

    const totalBytes = new TextEncoder().encode(jsonString).length;

    // Steps 1-2: Compress + encrypt (shared pipeline)
    const packed = await pack(jsonString, notify);
    const compressedBytes = packed.compressedBytes;

    // Step 3: Chunk and upload
    const encryptedArray = packed.bytes;
    const chunkCount = Math.ceil(encryptedArray.length / CHUNK_SIZE);

    for (let i = 0; i < chunkCount; i++) {
      const start = i * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, encryptedArray.length);
      const chunk = encryptedArray.slice(start, end);

      notify('uploading', `Uploading chunk ${i + 1} of ${chunkCount}...`);

      const response = await signedFetch(`/upload/${_channelId}/chunk/${i}`, {
        method: 'POST',
        body: chunk.buffer
      });

      if (!response.ok) {
        const err = await response.text();
        throw new Error(`Chunk ${i} upload failed: ${err}`);
      }
    }

    // Step 4: Compute checksum of encrypted data
    const checksum = await checksumOf(encryptedArray);

    // Step 5: Upload manifest (plaintext — app reads without decrypting)
    const manifest = {
      channelId: _channelId,
      chunkCount: chunkCount,
      totalBytes: totalBytes,
      compressedBytes: compressedBytes,
      encryptedBytes: encryptedArray.length,
      timestamp: new Date().toISOString(),
      checksum: checksum,
      encrypted: true,
      bookCount: bookCount
    };

    notify('finalizing', 'Uploading manifest...');

    const manifestResponse = await signedFetch(`/upload/${_channelId}/manifest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest)
    });

    if (!manifestResponse.ok) {
      throw new Error('Manifest upload failed: ' + await manifestResponse.text());
    }

    notify('complete', `Uploaded ${bookCount} books`);
    return manifest;
  }

  /**
   * Check if library data is available on the relay.
   * @returns {object|null} The manifest if data is available, null otherwise
   */
  async function checkStatus() {
    if (!isConfigured()) return null;

    const response = await fetch(`${workerUrl()}/status/${_channelId}`);
    if (response.status === 404) return null;
    if (!response.ok) {
      const err = new Error(response.status === 403 ? 'Channel revoked' : 'Status check failed');
      err.status = response.status;
      throw err;
    }

    return response.json();
  }

  /**
   * Download library JSON from relay.
   * Downloads chunks, reassembles, decrypts, and decompresses.
   * @param {function} onProgress - Optional callback: (phase, detail) => void
   * @returns {string} The library JSON string
   */
  async function download(onProgress) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const notify = onProgress || (() => {});

    // Step 1: Get manifest
    notify('checking', 'Checking relay...');
    const manifestResponse = await fetch(`${workerUrl()}/status/${_channelId}`);
    if (manifestResponse.status === 404) throw new Error('No data available on relay');
    if (!manifestResponse.ok) throw new Error('Failed to get manifest');

    const manifest = await manifestResponse.json();

    // Step 2: Download chunks
    const chunks = [];
    for (let i = 0; i < manifest.chunkCount; i++) {
      notify('downloading', `Downloading chunk ${i + 1} of ${manifest.chunkCount}...`);

      const chunkResponse = await fetch(`${workerUrl()}/download/${_channelId}/chunk/${i}`);
      if (!chunkResponse.ok) throw new Error(`Chunk ${i} download failed`);

      chunks.push(await chunkResponse.arrayBuffer());
    }

    // Step 3: Reassemble
    const totalLength = chunks.reduce((sum, c) => sum + c.byteLength, 0);
    const encrypted = new Uint8Array(totalLength);
    let offset = 0;
    for (const chunk of chunks) {
      encrypted.set(new Uint8Array(chunk), offset);
      offset += chunk.byteLength;
    }

    // Step 4: Verify checksum
    if (manifest.checksum) {
      notify('verifying', 'Verifying integrity...');
      const computed = await checksumOf(encrypted);

      if (computed !== manifest.checksum) {
        // v6.17.1 - Carry the recovery steps on the error so any display (fetcher overlay, app) shows what to do;
        // isCorruption lets the app catch it specifically and render the dialog + Copy button.
        const err = new Error('Sync data check failed (checksum mismatch) — the synced copy may be corrupted.\n\n' + RECOVERY_STEPS);
        err.isCorruption = true;
        throw err;
      }
    }

    // Steps 5-6: Decrypt + decompress (shared pipeline)
    const jsonString = await unpack(encrypted, notify);

    notify('complete', `Downloaded ${manifest.bookCount || '?'} books`);
    return jsonString;
  }

  /**
   * Delete ephemeral data (manifest + chunks) from relay after successful import.
   */
  async function cleanup() {
    if (!isConfigured()) return;

    const response = await signedFetch(`/cleanup/${_channelId}`, {
      method: 'DELETE'
    });

    if (!response.ok) {
      rwLog.log('warning', 'SYNC-09', 'Relay cleanup failed', { response: await response.text() });
    }
  }

  /**
   * Get device state from relay (used by mobile on open).
   * v7.2.0 (Phase 1b) - DUAL-FORMAT READER, shipped before any writer switches: try the
   * chunked journal first (pointer → newest complete generation), fall back to the legacy
   * single key. Mobile needs zero code changes — it calls this and becomes bilingual.
   * @returns {string|null} Decrypted JSON string or null if none exists
   */
  async function getDeviceState() {
    if (!isConfigured()) return null;

    // 1. Journal format: pointer → generation → parts → verify (self-heals via list fallback)
    const tryDstateGen = async (gen) => {
      const manifest = await (await relayFetch(`/dstate/${_channelId}/${gen}/manifest`)).json();
      const parts = [];
      for (let i = 0; i < manifest.chunkCount; i++) {
        const r = await fetch(`${workerUrl()}/dstate/${_channelId}/${gen}/chunk/${i}`);
        if (!r.ok) throw new Error(`chunk ${i} missing`);
        parts.push(new Uint8Array(await r.arrayBuffer()));
      }
      const total = parts.reduce((s, p) => s + p.length, 0);
      const bytes = new Uint8Array(total);
      let off = 0;
      for (const p of parts) { bytes.set(p, off); off += p.length; }
      await verifyChecksum(bytes, manifest.checksum, gen);
      return unpack(bytes);
    };
    let pointedGen = null;
    try {
      const p = await fetch(`${workerUrl()}/dstate-pointer/${_channelId}`);
      if (p.ok) pointedGen = (await p.json()).gen;
    } catch { /* fall through */ }
    if (pointedGen) {
      try { const out = await tryDstateGen(pointedGen); _lastDstateGen = pointedGen; return out; }
      catch { /* corrupt/missing — try list fallback */ }
    }
    try {
      const gens = (await (await relayFetch(`/dstate/${_channelId}/list`)).json()).gens
        .sort((a, b) => idTimestamp(b) - idTimestamp(a));
      for (const gen of gens) {
        if (gen === pointedGen) continue;
        try { const out = await tryDstateGen(gen); _lastDstateGen = gen; return out; }
        catch { /* next-newest */ }
      }
    } catch { /* fall through to legacy */ }

    _lastDstateGen = null; // v7.6.1 - legacy path serves no generation
    // 2. Legacy single key (pre-journal pushes)
    const response = await fetch(`${workerUrl()}/device-state/${_channelId}`);
    if (response.status === 404) return null;
    if (!response.ok) throw new Error('Failed to get device state');

    const encrypted = await response.arrayBuffer();
    const key = await getKey();
    const compressed = await window.RWCrypto.decryptPacked(key, encrypted);
    return window.RWCompress.decompress(compressed);
  }

  /**
   * v7.2.0 (Phase 1b) - Journaled device-state writer: the same commit pattern as the
   * canonical (chunks → manifest-last → pointer flip → keep-2 GC), under the dstate
   * keyspace with 90d TTLs. Removes the 25 MB single-value ceiling (measured 67.9% full
   * at 3,119 books). Present-but-unused until the writer-switch release; putDeviceState
   * still writes the legacy key.
   * @param {string} jsonString - full device-state payload
   * @returns {object} the generation manifest
   */
  async function putDeviceStateJournal(jsonString, onProgress, opts) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const notify = onProgress || (() => {});
    const chunkSize = (opts && opts.chunkSize) || CHUNK_SIZE;

    const mint = await relayFetch(`/dstate/${_channelId}/begin?device=${deviceId()}`, { method: 'POST' });
    const gen = (await mint.json()).gen;

    const packed = (opts && opts.prePacked) || await pack(jsonString, notify);
    const chunkCount = Math.ceil(packed.bytes.length / chunkSize);
    for (let i = 0; i < chunkCount; i++) {
      notify('uploading', `Uploading to the cloud — part ${i + 1} of ${chunkCount}...`);
      const part = packed.bytes.slice(i * chunkSize, Math.min((i + 1) * chunkSize, packed.bytes.length));
      await relayFetch(`/dstate/${_channelId}/${gen}/chunk/${i}`, { method: 'POST', body: part.buffer });
    }

    const manifest = {
      gen, chunkCount,
      checksum: await checksumOf(packed.bytes),
      totalBytes: new TextEncoder().encode(jsonString).length,
      encryptedBytes: packed.bytes.length,
      timestamp: new Date().toISOString()
    };
    await relayFetch(`/dstate/${_channelId}/${gen}/manifest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest)
    });
    await relayFetch(`/dstate-pointer/${_channelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gen })
    });

    // GC: keep-2 (incl. this one), never the pointed gen (server guards too); older finished copies go now (v7.23.0 —
    // no grace, see KEEP_GENS). Best-effort; TTL is the ultimate backstop for dstate.
    try {
      const graceMs = (opts && opts.gcGraceMs != null) ? opts.gcGraceMs : ORPHAN_GRACE_MS; // unfinished copies only
      const listedJson = await (await relayFetch(`/dstate/${_channelId}/list`)).json();
      const gens = Array.from(new Set([gen, ...listedJson.gens]))
        .sort((a, b) => idTimestamp(b) - idTimestamp(a));
      for (const old of gens.slice(KEEP_GENS)) {
        if (old === gen) continue;
        try { await relayFetch(`/dstate/${_channelId}/${old}`, { method: 'DELETE' }); } catch { /* pointed or racing */ }
      }
      // v7.5.1 - Orphan sweep: torn pushes (tab killed between chunk and manifest) leave
      // manifest-less chunks that no reader sees and keep-2 never listed — they leaked
      // forever. The worker now reports them; reap past-grace ones (grace covers a push
      // legitimately in flight right now).
      for (const orphan of (listedJson.orphans || [])) {
        if (orphan === gen) continue;
        if (Date.now() - idTimestamp(orphan) < graceMs) continue;
        try { await relayFetch(`/dstate/${_channelId}/${orphan}`, { method: 'DELETE' }); } catch { /* racing */ }
      }
    } catch { /* GC is best-effort */ }

    return manifest;
  }

  /**
   * Update device state on relay (used by app after successful import).
   * v7.3.0 made the JOURNAL the primary write (chunked generations + atomic pointer
   * commit, no 25 MB ceiling) with a transition double-write of the legacy single key.
   * v7.5.0 drops the double-write: every reader has been journal-literate since 7.2.0
   * and the cached-session window has passed — the old key now just TTLs away (90d).
   * Saves one full-payload KV write (~17 MB at current library size) per push.
   * @param {string} jsonString - Full library state as JSON string
   */
  async function putDeviceState(jsonString, onProgress) {
    if (!isConfigured()) throw new Error('Relay not configured');
    return putDeviceStateJournal(jsonString, onProgress);
  }

  /**
   * v7.6.0 - Freshness probe (mobile's "newer library available" nudge): ONE KV read of the
   * device-state pointer. Returns the pointed generation id — its prefix embeds the commit
   * time (see idTimestamp) — or null (no pointer / not configured / fetch failed).
   */
  async function getDeviceStatePointerGen() {
    if (!isConfigured()) return null;
    try {
      const res = await relayFetch(`/dstate-pointer/${_channelId}`);
      if (!res.ok) return null;
      return (await res.json()).gen || null;
    } catch { return null; }
  }

  /** Legacy single-key writer — kept ONLY as a harness/test helper (exercises the
   *  dual-reader's fallback path); no production caller since v7.5.0. */
  async function putDeviceStateLegacy(jsonString) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const packed = await pack(jsonString);
    const response = await signedFetch(`/device-state/${_channelId}`, {
      method: 'PUT',
      body: packed.bytes.buffer
    });
    if (!response.ok) {
      const err = new Error(response.status === 403 ? 'Channel revoked' : 'Failed to update device state');
      err.status = response.status;
      throw err;
    }
  }

  /**
   * Revoke the current channel — permanently deletes all relay data and blocklists the channelId.
   * Computes SHA-256(passphrase + channelId) as proof of ownership.
   * Clears local credentials after successful revocation.
   */
  async function revokeChannel() {
    if (!isConfigured()) throw new Error('Relay not configured');

    // Compute proof: SHA-256(passphrase + channelId)
    const proofData = new TextEncoder().encode(_passphrase + _channelId);
    const hashBuffer = await crypto.subtle.digest('SHA-256', proofData);
    const proof = Array.from(new Uint8Array(hashBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');

    const response = await signedFetch(`/revoke/${_channelId}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ proof })
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Revocation failed: ${err}`);
    }

    // Clear local state
    _channelId = null;
    _passphrase = null;
    forgetDerivedKeys();
    localStorage.removeItem(RELAY_STORAGE_KEY);
  }

  // === Relay write redesign Phase 1: mailbox + generations + pointer ===
  // See docs/design/RELAY-WRITE-REDESIGN.md. Client-side halves of the invariants:
  //   - a run/generation is COMPLETE only if its manifest exists AND every part GETs AND
  //     the whole-payload checksum verifies (never trust a list — KV has no cross-key ordering)
  //   - the generation manifest carries absorbedRuns (a SET, never a scalar watermark)
  //   - readers take the pointer; on any failure fall back to newest complete generation,
  //     then to the legacy single-generation format
  //   - GC keeps the 2 newest complete generations, never the pointed one; older ones go at once (unfinished: 10-min grace)

  const LETTER_SIZE = 5 * 1024 * 1024;      // 5 MB per letter (batching rule — design H3)
  const INLINE_LETTER_MAX = 1 * 1024 * 1024; // encrypted payloads under this go as ONE self-committing letter
  // v7.23.0 (Ron, 2026-10-15) - THE cleanup rule, mirrored by the worker's nightly cleanup (relay-worker.js SWEEP_*; the
  // commit check git-hooks/check-shared-numbers.js refuses a commit where the two differ):
  //   - keep the KEEP_GENS newest FINISHED copies (+ never the pointed one); older ones go IMMEDIATELY — no grace. Nothing
  //     needs copy 3+: a reader whose copy vanishes mid-download falls back to the newest complete one (readCanonical),
  //     and the old 1-hour grace made copies unlimited during a burst of saves (each ~35 MB; 2026-10-15: 3 extra).
  //   - an UNFINISHED copy (no manifest yet) keeps ORPHAN_GRACE_MS — it may be another tab's save in progress.
  const KEEP_GENS = 2;
  const ORPHAN_GRACE_MS = 10 * 60 * 1000;
  const LETTER_TTL_MS = 90 * 24 * 60 * 60 * 1000; // mirrors the worker's 90d letter TTL (absorbed-set pruning horizon)
  const DEVICE_KEY = 'readerwrangler-relay-device';

  /** Stable per-browser device id (persisted where storage exists; ephemeral otherwise). */
  function deviceId() {
    let id = null;
    try { id = localStorage.getItem(DEVICE_KEY); } catch { /* no storage (rare) */ }
    if (!id) {
      id = 'd' + Array.from(crypto.getRandomValues(new Uint8Array(4)))
        .map(b => b.toString(16).padStart(2, '0')).join('');
      try { localStorage.setItem(DEVICE_KEY, id); } catch { /* ephemeral is fine */ }
    }
    return id;
  }

  function idTimestamp(mintedId) {
    return parseInt(String(mintedId).split('-')[0], 10) || 0;
  }

  function bytesToB64(bytes) {
    let bin = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      bin += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(bin);
  }

  function b64ToBytes(b64) {
    const bin = atob(b64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    return bytes;
  }

  async function relayFetch(path, options) {
    const response = await signedFetch(path, options);
    if (!response.ok) {
      const err = new Error(`Relay ${options && options.method || 'GET'} ${path} failed: HTTP ${response.status} ${await response.text()}`);
      err.status = response.status;
      throw err;
    }
    return response;
  }

  /**
   * Write one run to the mailbox: pack the payload, split into ≤5MB letters, commit with a
   * run-manifest written LAST. Small payloads collapse to ONE self-committing inline letter.
   * @param {string} jsonString - the run's content (full book objects — never ASIN-only)
   * @param {string} kind - 'books' | 'collections' | 'wishlist-add' | 'tombstone' | 'reset'
   * @returns {object} { runId, seqCount, inline }
   */
  async function writeRun(jsonString, kind, onProgress, opts) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const notify = onProgress || (() => {});
    const letterSize = (opts && opts.letterSize) || LETTER_SIZE;
    const inlineMax = (opts && opts.inlineMax != null) ? opts.inlineMax : INLINE_LETTER_MAX;
    const fetchDate = new Date().toISOString();

    const packed = await pack(jsonString, notify);
    const checksum = await checksumOf(packed.bytes);

    // Small payload → single self-committing letter (one atomic write, complete by definition)
    if (packed.bytes.length <= inlineMax) {
      notify('uploading', 'Sending...');
      const body = JSON.stringify({
        inline: true, kind, seqCount: 1, checksum, fetchDate,
        encryptedBytes: packed.bytes.length,
        payload: bytesToB64(packed.bytes)
      });
      const res = await relayFetch(`/mail/${_channelId}/letter?device=${deviceId()}`, { method: 'POST', body });
      const json = await res.json();
      notify('complete', 'Sent');
      return { runId: json.runId, seqCount: 1, inline: true };
    }

    // Multi-letter run: mint id, letters, manifest LAST (the commit)
    const mint = await relayFetch(`/mail/${_channelId}/run?device=${deviceId()}`, { method: 'POST' });
    const runId = (await mint.json()).runId;

    const seqCount = Math.ceil(packed.bytes.length / letterSize);
    for (let i = 0; i < seqCount; i++) {
      notify('uploading', `Sending part ${i + 1} of ${seqCount}...`);
      const part = packed.bytes.slice(i * letterSize, Math.min((i + 1) * letterSize, packed.bytes.length));
      await relayFetch(`/mail/${_channelId}/${runId}/letter/${i}`, { method: 'POST', body: part.buffer });
    }

    notify('finalizing', 'Committing...');
    await relayFetch(`/mail/${_channelId}/${runId}/manifest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ runId, kind, seqCount, checksum, fetchDate, encryptedBytes: packed.bytes.length })
    });

    notify('complete', 'Sent');
    return { runId, seqCount, inline: false };
  }

  /**
   * Read the whole mailbox. Returns complete runs (decrypted) + ids of incomplete ones.
   * Completeness is proven by GETting every part — a run seen incomplete is "retry later",
   * NEVER "broken" (its producer may still be writing, or KV is still propagating).
   * @param {object} opts - optional { skipRunIds: Set } — runs already absorbed by the live
   *   generation are skipped BEFORE any letter download (their run ids are visible in the
   *   listing keys; no need to fetch/decrypt letters the ledger says to ignore).
   * @returns {object} { runs: [{runId, kind, fetchDate, timestamp, parts, jsonString}], incomplete: [runId],
   *   absorbedPresent: [{runId, parts}] } — absorbedPresent lists skipped (ledger-absorbed) runs whose
   *   letters still occupy KV: reclamation candidates (v7.7.2 — reclamation used to get exactly one
   *   attempt, in the fire-and-forget consolidation of the import that absorbed a run; a tab closed
   *   early stranded ~17MB per bulk run until its 90d TTL).
   */
  async function readMailbox(onProgress, opts) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const notify = onProgress || (() => {});
    const skip = (opts && opts.skipRunIds) || null;

    notify('checking', 'Checking mailbox...');
    const listRes = await relayFetch(`/mail/${_channelId}/list`);
    const keys = (await listRes.json()).keys; // "{runId}:{seq}" or "{runId}:manifest"

    const byRun = new Map();
    const skippedParts = new Map(); // runId -> letter-key count (absorbed but still in KV)
    for (const k of keys) {
      const sep = k.lastIndexOf(':');
      const runId = k.slice(0, sep), part = k.slice(sep + 1);
      if (skip && skip.has(runId)) { // absorbed — the ledger says to ignore it (but it still occupies storage)
        skippedParts.set(runId, (skippedParts.get(runId) || 0) + (part === 'manifest' ? 0 : 1));
        continue;
      }
      if (!byRun.has(runId)) byRun.set(runId, { seqs: new Set(), hasManifest: false });
      if (part === 'manifest') byRun.get(runId).hasManifest = true;
      else byRun.get(runId).seqs.add(parseInt(part, 10));
    }

    const runs = [], incomplete = [];
    for (const [runId, info] of byRun) {
      try {
        if (info.hasManifest) {
          // Multi-letter run: manifest → parts → verify → unpack
          const manifest = await (await relayFetch(`/mail/${_channelId}/${runId}/manifest`)).json();
          const parts = [];
          for (let i = 0; i < manifest.seqCount; i++) {
            const r = await fetch(`${workerUrl()}/mail/${_channelId}/${runId}/letter/${i}`);
            if (!r.ok) throw new Error('part missing');
            parts.push(new Uint8Array(await r.arrayBuffer()));
          }
          const total = parts.reduce((s, p) => s + p.length, 0);
          const bytes = new Uint8Array(total);
          let off = 0;
          for (const p of parts) { bytes.set(p, off); off += p.length; }
          await verifyChecksum(bytes, manifest.checksum, runId);
          runs.push({ runId, kind: manifest.kind, fetchDate: manifest.fetchDate, parts: manifest.seqCount,
                      timestamp: idTimestamp(runId), jsonString: await unpack(bytes) });
        } else if (info.seqs.has(0) && info.seqs.size === 1) {
          // Possible inline single letter (self-committing; stored as JSON at seq 0)
          const r = await fetch(`${workerUrl()}/mail/${_channelId}/${runId}/letter/0`);
          if (!r.ok) throw new Error('letter missing');
          const letter = JSON.parse(await r.text());
          if (!letter.inline) throw new Error('not inline'); // letters of an uncommitted multi-run
          const bytes = b64ToBytes(letter.payload);
          await verifyChecksum(bytes, letter.checksum, runId);
          runs.push({ runId, kind: letter.kind, fetchDate: letter.fetchDate, parts: 1,
                      timestamp: idTimestamp(runId), jsonString: await unpack(bytes) });
        } else {
          throw new Error('no manifest'); // letters exist but run not committed
        }
      } catch {
        incomplete.push(runId); // retry on a later read — never mark dead
      }
    }

    runs.sort((a, b) => a.timestamp - b.timestamp); // oldest first (merge in arrival order)
    notify('complete', `${runs.length} run${runs.length !== 1 ? 's' : ''} in mailbox`);
    const absorbedPresent = Array.from(skippedParts, ([runId, parts]) => ({ runId, parts }));
    return { runs, incomplete, absorbedPresent };
  }

  /** Filter mailbox runs down to those NOT absorbed by the given generation manifest. */
  function unabsorbedRuns(runs, genManifest) {
    const absorbed = new Set((genManifest && genManifest.absorbedRuns) || []);
    return runs.filter(r => !absorbed.has(r.runId));
  }

  /**
   * Read the current canonical library.
   * Pointer → verify → fall back to newest complete generation → fall back to legacy format.
   * @returns {object|null} { jsonString, gen, manifest, source } — source: 'pointer'|'fallback'|'legacy';
   *   null when the channel has no canonical at all (cold start).
   */
  async function readCanonical(onProgress) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const notify = onProgress || (() => {});

    const tryGen = async (gen) => {
      const manifest = await (await relayFetch(`/gen/${_channelId}/${gen}/manifest`)).json();
      const parts = [];
      for (let i = 0; i < manifest.chunkCount; i++) {
        notify('downloading', `Downloading part ${i + 1} of ${manifest.chunkCount}...`);
        const r = await fetch(`${workerUrl()}/gen/${_channelId}/${gen}/chunk/${i}`);
        if (!r.ok) throw new Error(`chunk ${i} missing`);
        parts.push(new Uint8Array(await r.arrayBuffer()));
      }
      const total = parts.reduce((s, p) => s + p.length, 0);
      const bytes = new Uint8Array(total);
      let off = 0;
      for (const p of parts) { bytes.set(p, off); off += p.length; }
      notify('verifying', 'Verifying integrity...');
      await verifyChecksum(bytes, manifest.checksum, gen);
      return { jsonString: await unpack(bytes, notify), gen, manifest };
    };

    // 1. Pointer (the hot path — no list op)
    notify('checking', 'Checking relay...');
    let pointedGen = null;
    try {
      const p = await fetch(`${workerUrl()}/pointer/${_channelId}`);
      if (p.ok) pointedGen = (await p.json()).gen;
    } catch { /* fall through */ }
    if (pointedGen) {
      try { return { ...await tryGen(pointedGen), source: 'pointer' }; }
      catch { /* corrupt/missing — self-heal via fallback */ }
    }

    // 2. Newest complete generation (list fallback)
    try {
      const gens = (await (await relayFetch(`/gen/${_channelId}/list`)).json()).gens
        .sort((a, b) => idTimestamp(b) - idTimestamp(a));
      for (const gen of gens) {
        if (gen === pointedGen) continue; // already failed above
        try { return { ...await tryGen(gen), source: 'fallback' }; }
        catch { /* try next-newest */ }
      }
    } catch { /* fall through to legacy */ }

    // 3. Legacy single-generation format (pre-redesign uploads)
    try {
      const jsonString = await download(notify);
      return { jsonString, gen: null, manifest: null, source: 'legacy' };
    } catch { /* nothing readable */ }

    return null; // cold start — no canonical anywhere
  }

  /**
   * Commit a new canonical generation: chunks → manifest (absorbedRuns inside, the atomic
   * commit) → pointer flip → GC of old generations. Interrupt anywhere = prior gen intact.
   * @param {string} jsonString - the complete new canonical content
   * @param {string[]} absorbedRuns - runIds this generation absorbs (SET semantics)
   * @returns {object} the generation manifest
   */
  async function commitGeneration(jsonString, absorbedRuns, onProgress, opts) {
    if (!isConfigured()) throw new Error('Relay not configured');
    const notify = onProgress || (() => {});
    // v7.21.1 (design §14a F3) - absorbedRuns has SET semantics (§9d); callers could pass a duplicate (seen in a dev
    // manifest). Dedupe here, at the one place every commit passes through.
    absorbedRuns = Array.from(new Set(absorbedRuns || []));

    const mint = await relayFetch(`/gen/${_channelId}/begin?device=${deviceId()}`, { method: 'POST' });
    const gen = (await mint.json()).gen;

    const packed = await pack(jsonString, notify);
    const chunkCount = Math.ceil(packed.bytes.length / CHUNK_SIZE);
    for (let i = 0; i < chunkCount; i++) {
      notify('uploading', `Uploading part ${i + 1} of ${chunkCount}...`);
      const part = packed.bytes.slice(i * CHUNK_SIZE, Math.min((i + 1) * CHUNK_SIZE, packed.bytes.length));
      await relayFetch(`/gen/${_channelId}/${gen}/chunk/${i}`, { method: 'POST', body: part.buffer });
    }

    let bookCount = 0;
    try {
      const parsed = JSON.parse(jsonString);
      bookCount = (parsed.books && parsed.books.items && parsed.books.items.length) || 0;
    } catch { /* count is cosmetic */ }

    const manifest = {
      gen, chunkCount,
      checksum: await checksumOf(packed.bytes),
      absorbedRuns: absorbedRuns || [],
      totalBytes: new TextEncoder().encode(jsonString).length,
      encryptedBytes: packed.bytes.length,
      bookCount,
      timestamp: new Date().toISOString()
    };

    notify('finalizing', 'Committing...');
    await relayFetch(`/gen/${_channelId}/${gen}/manifest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(manifest)
    });

    await relayFetch(`/pointer/${_channelId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ gen })
    });

    // GC: keep the KEEP_GENS newest, never the pointed one (server also guards); older finished copies go now (v7.23.0 —
    // no grace, see KEEP_GENS). Best-effort — a failed GC just means the next writer sweeps more.
    try {
      const graceMs = (opts && opts.gcGraceMs != null) ? opts.gcGraceMs : ORPHAN_GRACE_MS; // unfinished copies only
      // Union the just-committed gen into the candidate set: KV list may not show it yet
      // (eventual consistency), and it must count as one of the keep-2 or a sweep right
      // after commit keeps 2 listed gens PLUS this one.
      const listedJson = await (await relayFetch(`/gen/${_channelId}/list`)).json();
      const gens = Array.from(new Set([gen, ...listedJson.gens]))
        .sort((a, b) => idTimestamp(b) - idTimestamp(a));
      for (const old of gens.slice(KEEP_GENS)) {
        if (old === gen) continue;
        try { await relayFetch(`/gen/${_channelId}/${old}`, { method: 'DELETE' }); } catch { /* pointed or racing */ }
      }
      // v7.5.1 - Orphan sweep (see the dstate GC twin): reap past-grace manifest-less
      // generations. Canonical gens have NO TTL, so without this a torn merge's chunks
      // were permanent.
      for (const orphan of (listedJson.orphans || [])) {
        if (orphan === gen) continue;
        if (Date.now() - idTimestamp(orphan) < graceMs) continue;
        try { await relayFetch(`/gen/${_channelId}/${orphan}`, { method: 'DELETE' }); } catch { /* racing */ }
      }
    } catch { /* GC is best-effort */ }

    // v7.21.1 (design §14a fix 1) - reclaim absorbed bulk runs HERE, inside every commit — Import, Restore, the fetchers'
    // merge alike. Restore never called it (each Restore left its ~18 MB reset run for 90 days, F1), and on a channel
    // that never imports (prod) nothing ever retried. Uses the manifest's full absorbedRuns, so leftovers from EARLIER
    // commits are retried too. Safe by construction: only runs this COMMITTED generation lists as absorbed.
    try { await reclaimAbsorbedRuns(manifest.absorbedRuns); } catch { /* best-effort — the TTL is the backstop */ }

    notify('complete', 'Committed');
    return manifest;
  }

  /**
   * v7.21.1 - Delete the multi-letter mailbox runs among `absorbedRunIds` that are still in storage (one mailbox list to
   * count letters per run; single-letter runs are tiny and ride their TTL). Called by commitGeneration after the pointer
   * flip — i.e. only for runs a COMMITTED generation has absorbed (the clearing invariant).
   */
  async function reclaimAbsorbedRuns(absorbedRunIds) {
    const absorbed = new Set(absorbedRunIds || []);
    if (absorbed.size === 0) return 0;
    const keys = (await (await relayFetch(`/mail/${_channelId}/list`)).json()).keys; // "{runId}:{seq}" | "{runId}:manifest"
    const letters = new Map();
    for (const k of keys) {
      const sep = k.lastIndexOf(':');
      const runId = k.slice(0, sep);
      if (!absorbed.has(runId) || k.slice(sep + 1) === 'manifest') continue;
      letters.set(runId, (letters.get(runId) || 0) + 1);
    }
    return deleteAbsorbedBulkRuns(Array.from(letters, ([runId, parts]) => ({ runId, parts })));
  }

  /**
   * Early storage reclamation for an ABSORBED bulk run (a full-fetch run holds real MBs for
   * up to 90 days otherwise). Caller responsibility: only for runs inside a COMMITTED
   * generation's absorbedRuns — unabsorbed letters are sacred (the clearing invariant).
   */
  async function deleteRun(runId) {
    if (!isConfigured()) throw new Error('Relay not configured');
    await relayFetch(`/mail/${_channelId}/${runId}`, { method: 'DELETE' });
  }

  /**
   * Early storage reclamation after a canonical commit (design §14 mitigation a): delete
   * ABSORBED multi-letter (bulk) runs — a full-fetch run holds real MBs for up to 90 days
   * otherwise. Tiny single-letter runs just ride the TTL (not worth the delete ops).
   * ONLY call with runs a COMMITTED generation has absorbed — unabsorbed letters are sacred
   * (the clearing invariant). Best-effort: a failed delete just leaves the TTL to do it.
   * A concurrent reader mid-assembly of a deleted run sees it as incomplete and skips it —
   * harmless, the data lives in the canonical it was reading toward anyway.
   * @param {Array} absorbedRuns - run objects ({ runId, parts }) from the absorbed pending set
   */
  async function deleteAbsorbedBulkRuns(absorbedRuns) {
    let deleted = 0;
    for (const r of absorbedRuns || []) {
      if ((r.parts || 1) <= 1) continue;
      try { await deleteRun(r.runId); deleted++; }
      catch (e) { rwLog.log('warning', 'SYNC-10', `Clearing an imported batch off the relay was skipped (it expires on its own): ${e.message}`, { runId: r.runId }); }
    }
    if (deleted > 0) rwLog.log('info', 'SYNC', `Cleared ${deleted} imported batch(es) off the relay`);
    return deleted;
  }

  /**
   * THE deterministic canonical merge (design §9d) — the single shared implementation for
   * every client (app AND fetchers), so any two mergers with the same inputs produce the
   * same output. Pure function: no I/O, no relay writes.
   *
   * Rules:
   *   - baseline = canonical content (books + collections + tombstones), or empty
   *   - runs apply in ascending timestamp order (readMailbox already sorts them)
   *   - 'reset' run → new baseline (backup restore); everything older is superseded
   *   - 'tombstone' run → remove those books, remember compact {asin, deletedAt} records
   *   - book-bearing runs merge by ASIN, newest fetchDate wins per book (shallow spread, so
   *     canonical-only fields like tags/note survive an Amazon-data update)
   *   - a tombstone blocks data fetched BEFORE the delete (the resurrection race); a run
   *     fetched AFTER the delete revives the book (deliberate re-add / re-scrape — the
   *     finer revival policy is TOMBSTONE-DELETE.md's, this is the deterministic default)
   *
   * @param {string|null} canonicalJsonString - current canonical content (null = cold start)
   * @param {Array} runs - complete runs from readMailbox (ascending timestamp)
   * @returns {object} { jsonString, bookCount, tombstoneCount }
   */
  function composeCanonical(canonicalJsonString, runs) {
    const booksByAsin = new Map();   // asin → book object
    const srcDate = new Map();       // asin → fetchDate that produced the current fields
    const collByAsin = new Map();    // asin → {asin, readStatus, collections}
    const tombstones = new Map();    // asin → deletedAt ISO
    let newestFetch = null;
    let newestCollFetch = null;
    const later = (a, b) => (!a ? b : (!b ? a : (a > b ? a : b)));

    const applyContent = (data, fetchDate) => {
      if (data.books && data.books.items) {
        const date = data.books.fetchDate || fetchDate || null;
        newestFetch = later(newestFetch, date);
        for (const b of data.books.items) {
          if (!b || !b.asin) continue;
          const dead = tombstones.get(b.asin);
          if (dead && (!date || date <= dead)) continue; // fetched before the delete — stays dead
          if (dead) tombstones.delete(b.asin);           // newer sighting revives
          const prev = booksByAsin.get(b.asin);
          const prevDate = srcDate.get(b.asin);
          if (!prev || !prevDate || !date || date >= prevDate) {
            booksByAsin.set(b.asin, prev ? { ...prev, ...b } : b);
            srcDate.set(b.asin, date || prevDate || null);
          }
        }
      }
      if (data.collections && data.collections.items) {
        const date = data.collections.fetchDate || fetchDate || null;
        newestCollFetch = later(newestCollFetch, date);
        for (const c of data.collections.items) {
          if (c && c.asin) collByAsin.set(c.asin, c);
        }
      }
      if (data.tombstones && data.tombstones.items) {
        for (const t of data.tombstones.items) {
          if (!t || !t.asin) continue;
          booksByAsin.delete(t.asin);
          srcDate.delete(t.asin);
          tombstones.set(t.asin, t.deletedAt || fetchDate || new Date().toISOString());
        }
      }
    };

    if (canonicalJsonString) {
      try { applyContent(JSON.parse(canonicalJsonString), null); }
      catch (e) { rwLog.log('critical', 'SYNC-11', 'The relay\'s saved copy of your library could not be read — it was skipped.', { error: e.message }); }
    }

    for (const run of runs || []) {
      let data;
      try { data = JSON.parse(run.jsonString); }
      catch (e) { rwLog.log('error', 'SYNC-12', `A batch of books on the relay could not be read — it was skipped: ${e.message}`, { runId: run.runId }); continue; }
      if (run.kind === 'reset') {
        // New baseline: everything accumulated so far is superseded by the restore
        booksByAsin.clear(); srcDate.clear(); collByAsin.clear(); tombstones.clear();
        newestFetch = null; newestCollFetch = null;
      }
      applyContent(data, run.fetchDate || null);
    }

    const items = Array.from(booksByAsin.values());
    const out = {
      schemaVersion: '2.3',
      books: {
        fetchDate: newestFetch || new Date().toISOString(),
        fetcherVersion: 'relay-merge',
        totalBooks: items.length,
        items
      }
    };
    if (collByAsin.size > 0) {
      out.collections = { fetchDate: newestCollFetch || newestFetch || new Date().toISOString(),
                          items: Array.from(collByAsin.values()) };
    }
    if (tombstones.size > 0) {
      // Compact records persist IN the canonical so later merges keep honoring them
      out.tombstones = { items: Array.from(tombstones, ([asin, deletedAt]) => ({ asin, deletedAt })) };
    }
    return { jsonString: JSON.stringify(out), bookCount: items.length, tombstoneCount: tombstones.size };
  }

  /** Drop absorbedRuns entries whose letters have provably TTL-expired (keeps the set bounded). */
  function pruneAbsorbedRuns(runIds) {
    const horizon = Date.now() - LETTER_TTL_MS;
    return (runIds || []).filter(id => idTimestamp(id) > horizon);
  }

  /** Cheap "does any canonical exist?" (pointer GET → gen list → legacy manifest). */
  async function hasCanonical() {
    if (!isConfigured()) return false;
    try {
      const p = await fetch(`${workerUrl()}/pointer/${_channelId}`);
      if (p.ok) return true;
    } catch { /* fall through */ }
    try {
      const gens = (await (await relayFetch(`/gen/${_channelId}/list`)).json()).gens;
      if (gens.length > 0) return true;
    } catch { /* fall through */ }
    try { return !!(await checkStatus()); } catch { return false; }
  }

  const AGE_CAP_MS = 3 * 24 * 60 * 60 * 1000; // design §11 rule 2: durability backstop

  /**
   * The fetchers' age-cap fallback (design §11 rule 2): if the OLDEST complete unabsorbed
   * run has waited longer than the age cap, perform a canonical merge right here — so
   * consolidation is guaranteed even if the user never opens the app. Safe concurrently
   * (unique generations + absorbed-set); a failure just leaves it for the next client.
   * @param {object} opts - optional { canonical, pendingRuns } already in hand (skips re-reads)
   * @returns {object} { merged, reason }
   */
  async function maybeAgeCapMerge(opts, onProgress) {
    if (!isConfigured()) return { merged: false, reason: 'not-configured' };
    try {
      let canonical = opts && opts.canonical !== undefined ? opts.canonical : await readCanonical(onProgress);
      let pending = opts && opts.pendingRuns;
      if (!pending) {
        const absorbed = (canonical && canonical.manifest && canonical.manifest.absorbedRuns) || [];
        const mailbox = await readMailbox(null, { skipRunIds: new Set(absorbed) });
        pending = (canonical && canonical.manifest)
          ? unabsorbedRuns(mailbox.runs, canonical.manifest)
          : mailbox.runs;
      }
      if (pending.length === 0) return { merged: false, reason: 'nothing-pending' };
      const oldest = Math.min(...pending.map(r => r.timestamp));
      if (Date.now() - oldest < AGE_CAP_MS) return { merged: false, reason: 'young' };

      rwLog.log('info', 'SYNC', `The oldest waiting batch is ${((Date.now() - oldest) / 86400000).toFixed(1)} days old — combining the relay's copy`);
      const composed = composeCanonical(canonical ? canonical.jsonString : null, pending);
      const absorbed = pruneAbsorbedRuns([
        ...((canonical && canonical.manifest && canonical.manifest.absorbedRuns) || []),
        ...pending.map(r => r.runId)
      ]);
      const manifest = await commitGeneration(composed.jsonString, absorbed, onProgress); // v7.21.1 - reclaims absorbed bulk runs itself
      return { merged: true, reason: 'age-cap', gen: manifest.gen, bookCount: manifest.bookCount };
    } catch (e) {
      rwLog.log('warning', 'SYNC-13', `Combining the relay's copy (for an old batch) was skipped: ${e.message}`);
      return { merged: false, reason: e.message };
    }
  }

  /**
   * Lightweight "is there anything to import?" check for the banner/poll.
   * New format: pending unabsorbed mailbox runs (1 list + ≤2 GETs). Falls back to the
   * legacy manifest check only when the channel has no pointer yet (pre-migration).
   * Returns a manifest-shaped object ({ timestamp, pending?, source }) or null.
   */
  async function checkForUpdates() {
    if (!isConfigured()) return null;

    // Absorbed set from the current generation (pointer → manifest; both cheap GETs)
    let absorbed = null, hasPointer = false;
    try {
      const p = await fetch(`${workerUrl()}/pointer/${_channelId}`);
      if (p.ok) {
        hasPointer = true;
        const gen = (await p.json()).gen;
        const m = await fetch(`${workerUrl()}/gen/${_channelId}/${gen}/manifest`);
        if (m.ok) absorbed = new Set((await m.json()).absorbedRuns || []);
      } else if (p.status === 403) {
        const err = new Error('Channel revoked'); err.status = 403; throw err;
      }
    } catch (e) { if (e && e.status === 403) throw e; /* else: treat as no pointer */ }

    // Any mailbox run not in the absorbed set = something to import.
    // (One KV list op — fine at solo scale; Phase 2 meters list usage in the worker.)
    try {
      const keys = (await (await relayFetch(`/mail/${_channelId}/list`)).json()).keys;
      const runIds = new Set(keys.map(k => k.slice(0, k.lastIndexOf(':'))));
      let newestTs = 0, pending = 0;
      for (const id of runIds) {
        if (absorbed && absorbed.has(id)) continue;
        pending++;
        newestTs = Math.max(newestTs, idTimestamp(id));
      }
      if (pending > 0) {
        return { timestamp: new Date(newestTs).toISOString(), pending, source: 'mailbox' };
      }
    } catch { /* list failed — fall through */ }

    // Pre-migration channels: legacy manifest is still the signal. Once a pointer exists,
    // the legacy manifest is just pre-migration residue (already absorbed) — ignore it.
    if (!hasPointer) {
      try { return await checkStatus(); } catch { return null; }
    }
    return null;
  }

  // === Shared fetcher helpers ===
  // ONE implementation of the read-dedup-send-agecap cycle the wishlist-style fetchers
  // (wishlist, series-page, author-bibliography) previously carried as three near-identical
  // copies. UI stays with the caller via callbacks; console narration lives here (it was
  // identical across the copies).

  /**
   * READ-ONLY reconstruction of what's already known: canonical library plus pending
   * (unabsorbed) mailbox runs. Used for duplicate detection — never written back.
   * A missing canonical is fine (cold start: letters are first-class; the app merges later).
   * Applies pending tombstones too (runs are oldest-first, so delete-then-re-add resolves
   * correctly): a book the user just permanently deleted must not block a deliberate re-add.
   * @param {function} onPhase - (phase, detail) => void — caller's progress UI
   * @returns {object} { byAsin: Map(asin → book), canonical, pending }
   */
  async function loadKnownBooks(onPhase) {
    if (!isConfigured()) {
      throw new Error('Relay not configured. Please reinstall the bookmarklet from Relay Setup in the app.');
    }
    const phase = onPhase || (() => {});

    phase('Checking Library', 'Downloading your library...');
    rwLog.log('debug', 'SYNC', 'Reading the library and waiting additions from the relay (read-only)');

    const byAsin = new Map();
    const canonical = await readCanonical((p, detail) => phase('Checking Library', detail));
    if (canonical) {
      try {
        const data = JSON.parse(canonical.jsonString);
        if (data.isBackup !== true && data.books && data.books.items) {
          for (const b of data.books.items) byAsin.set(b.asin, b);
          rwLog.log('debug', 'SYNC', `Library: ${data.books.items.length} books (from ${canonical.source})`);
        }
      } catch (e) {
        rwLog.log('error', 'SYNC-14', `The relay's library could not be read: ${e.message}`);
      }
    } else {
      rwLog.log('info', 'SYNC', 'No library on the relay yet — checking waiting additions only');
    }

    // Books sent by any fetcher but not yet merged into the library count as known too
    // (an add from 5 minutes ago must dedup, even though no merge has happened yet).
    // Absorbed runs are skipped BEFORE download — the ledger already retired them.
    phase('Checking Library', 'Checking recent additions...');
    const absorbed = (canonical && canonical.manifest && canonical.manifest.absorbedRuns) || [];
    const mailbox = await readMailbox(null, { skipRunIds: new Set(absorbed) });
    const pending = (canonical && canonical.manifest)
      ? unabsorbedRuns(mailbox.runs, canonical.manifest)
      : mailbox.runs;
    let pendingBooks = 0, pendingDeletes = 0;
    for (const run of pending) {
      try {
        const data = JSON.parse(run.jsonString);
        const items = (data.books && data.books.items) || [];
        for (const b of items) {
          if (b.asin && !byAsin.has(b.asin)) { byAsin.set(b.asin, b); pendingBooks++; }
        }
        for (const t of (data.tombstones && data.tombstones.items) || []) {
          if (t.asin && byAsin.delete(t.asin)) pendingDeletes++;
        }
      } catch { /* unparseable letter — not dedup material */ }
    }
    if (pendingBooks > 0 || pendingDeletes > 0) {
      rwLog.log('debug', 'SYNC', `Waiting on the relay: ${pendingBooks} book(s) not yet merged, ${pendingDeletes} deletion(s)`);
    }
    return { byAsin, canonical, pending };
  }

  /**
   * Send new wishlist book(s) as ONE mailbox run. Small payloads collapse to a single
   * self-committing letter (one atomic write) — interrupting it cannot corrupt anything,
   * and nothing here ever touches the library itself.
   * @param {Array} newBooks - full book objects
   * @param {object} meta - { schemaVersion, source, fetcherVersion, cancelMessage }
   * @param {function} onPhase - (phase, detail) => void — caller's progress UI
   * @param {function} onRetry - async (errorMessage) => 'retry'|'cancel' — caller's retry dialog
   */
  async function sendWishlistRun(newBooks, meta, onPhase, onRetry) {
    const phase = onPhase || (() => {});
    phase('Saving', 'Sending to your library...');
    rwLog.log('debug', 'SYNC', 'Sending a wishlist addition to the relay');

    const payload = JSON.stringify({
      schemaVersion: meta.schemaVersion,
      source: meta.source,
      fetcherVersion: meta.fetcherVersion,
      books: {
        fetchDate: new Date().toISOString(),
        totalBooks: newBooks.length,
        items: newBooks
      }
    });

    while (true) {
      try {
        const res = await writeRun(payload, 'wishlist-add', (p, detail) => phase('Saving', detail));
        rwLog.log('info', 'SYNC', `Sent ${newBooks.length} book(s) to the relay${res.inline ? ' in a single write' : ` (${res.seqCount} parts)`}`);
        return res;
      } catch (relayError) {
        rwLog.log('warning', 'SYNC-15', `Sending to the relay failed (it can be retried): ${relayError.message}`);
        const choice = onRetry ? await onRetry(relayError.message) : 'cancel';
        if (choice === 'cancel') {
          throw new Error(meta.cancelMessage || 'Cancelled — nothing was saved.');
        }
      }
    }
  }

  /**
   * Age-cap fallback (design §11 rule 2), fire-and-forget: if some pending run has waited
   * >3 days un-merged (the user hasn't opened the app), consolidate right here.
   * @param {object} known - the result of loadKnownBooks()
   */
  function ageCapCheck(known) {
    if (!known) return;
    maybeAgeCapMerge({ canonical: known.canonical, pendingRuns: known.pending })
      .then(acm => { if (acm.merged) rwLog.log('info', 'SYNC', `Combined the relay's copy for an old batch (${acm.bookCount} books)`); })
      .catch(e => rwLog.log('warning', 'SYNC-16', `Checking for old batches on the relay was skipped: ${e.message}`));
  }

  // Auto-detect context and initialize
  if (window._RW_RELAY_CHANNEL) {
    initFromGlobals();
  }

  // Expose as global
  window.RWRelay = {
    initFromGlobals: initFromGlobals,
    initFromStorage: initFromStorage,
    isConfigured: isConfigured,
    getChannelId: getChannelId,
    upload: upload,
    checkStatus: checkStatus,
    download: download,
    cleanup: cleanup,
    getDeviceState: getDeviceState,
    getDeviceStatePointerGen: getDeviceStatePointerGen, // v7.6.0 - mobile freshness nudge
    lastDeviceStateGen: () => _lastDstateGen, // v7.6.1 - which gen getDeviceState served (freshness identity)
    genTimestamp: idTimestamp, // v7.6.0 - commit time embedded in a minted id
    putDeviceState: putDeviceState,
    putDeviceStateJournal: putDeviceStateJournal,
    putDeviceStateLegacy: putDeviceStateLegacy,
    revokeChannel: revokeChannel,
    signedFetch: signedFetch, // 7.25.0 - the one signer; exposed for the relay test harnesses' deliberate raw writes
    // Relay write redesign Phase 1 (docs/design/RELAY-WRITE-REDESIGN.md)
    writeRun: writeRun,
    readMailbox: readMailbox,
    unabsorbedRuns: unabsorbedRuns,
    readCanonical: readCanonical,
    commitGeneration: commitGeneration,
    deleteRun: deleteRun,
    deleteAbsorbedBulkRuns: deleteAbsorbedBulkRuns,
    deviceId: deviceId,
    composeCanonical: composeCanonical,
    pruneAbsorbedRuns: pruneAbsorbedRuns,
    checkForUpdates: checkForUpdates,
    hasCanonical: hasCanonical,
    maybeAgeCapMerge: maybeAgeCapMerge,
    // Shared fetcher helpers (one copy instead of three — see the fetchers' Relay I/O sections)
    loadKnownBooks: loadKnownBooks,
    sendWishlistRun: sendWishlistRun,
    ageCapCheck: ageCapCheck
  };

})();
