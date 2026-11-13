// Unit tests for the logging module (logkit/logger.js) with ReaderWrangler's settings (logkit-settings.js) — run:
// node test/logger.test.js
// tags: logging, tier 1
// covers: logkit/logger.js, logkit-settings.js, logkit/diagnostics-window.js, mobile.js, reportProblem.js, readerwrangler.js, readerwrangler.html, reset.html, index.html, features.html, tutorials.html, changelog.html, security.html
// (from mobile.js on, for LOG-044: no shipped script or page keeps its own clipboard copy — Law 22)
// The logging module (docs/design/LOGGING.md §1, §2, §2b, §6 — Ron + Claude, 2026-11-05/07): one call
// rwLog.log(level, code, text, data, { test }), five levels, codes 'AREA' or 'AREA-NN' (numbered required for warning and
// above), the kept log (info and up, the last 500, repeats counted, batched saves, page loads), the scrubber, test
// messages marked -!TEST!, and "ours only" for uncaught errors. Written BEFORE the module (TESTING.md §6).
'use strict';
const assert = require('assert');
const { test, done } = require('./harness');
// 7.28.0 - the module moved into logkit/ and knows nothing of ReaderWrangler; RW's settings (areas, storage names, the
// Channel ID's short form, the product) come from logkit-settings.js — combined here exactly as the pages combine them,
// so every assertion below is unchanged.
const K = require('../logkit/logger.js');
const S = require('../logkit-settings.js');
const L = {
    createLogger: (o) => K.createLogger({ ...S.settings, ...o }),
    scrub: (text, secrets) => K.scrub(text, secrets, S.settings),
    TEST_MARK: K.TEST_MARK,
    LOG_LEVELS: K.LOG_LEVELS,
    LOG_AREAS: S.LOG_AREAS,
    shortChannelId: S.shortChannelId,
};

// A fake world: a console that records, a storage that records writes, a clock and a timer queue we drive by hand.
function world(opts = {}) {
    const out = [];
    const con = {};
    for (const m of ['debug', 'info', 'warn', 'error', 'log']) con[m] = (...a) => out.push([m, a.map(String).join(' ')]);
    const store = new Map(opts.stored ? [['readerwrangler-log', opts.stored]] : []);
    const writes = [];
    const storage = opts.storage || {
        getItem: k => (store.has(k) ? store.get(k) : null),
        setItem: (k, v) => { writes.push(k); store.set(k, String(v)); },
    };
    let t = 1_800_000_000_000;
    const timers = [];
    const log = L.createLogger({
        console: con, storage, now: () => t, schedule: (fn, ms) => { timers.push({ fn, ms }); return timers.length; },
        secrets: () => opts.secrets || [], ...opts.extra,
    });
    return { log, out, store, writes, timers, tick: ms => { t += ms; }, runTimers: () => timers.splice(0).forEach(x => x.fn()) };
}
const last = (w) => w.log.entries()[w.log.entries().length - 1];

console.log('logger tests:');

test('LOG-001', 'each level goes to its own console method, as "level · CODE · text" (with extra detail on)', () => {
    const w = world();
    w.log.setSwitch('logDetail', true);   // (debug is recorded — and so printed — only with extra detail on, LOG-016/017)
    w.log.log('debug', 'STORE', 'saved 3 books');
    w.log.log('info', 'IMPORT', 'Library updated: 26 books');
    w.log.log('warning', 'IMPORT-01', 'An Import is already running');
    w.log.log('error', 'INTEG-06', 'repaired 3 books');
    w.log.log('critical', 'STORE-01', 'the book store could not be read');
    assert.deepStrictEqual(w.out.map(o => o[0]), ['debug', 'info', 'warn', 'error', 'error']);
    assert.strictEqual(w.out[2][1], 'warning · IMPORT-01 · An Import is already running');
    assert.strictEqual(w.out[4][1], 'critical · STORE-01 · the book store could not be read');
});

test('LOG-002', 'info and above are kept; debug is not (by default)', () => {
    const w = world();
    w.log.log('debug', 'STORE', 'detail');
    w.log.log('info', 'BOOT', 'started');
    w.log.log('warning', 'SYNC-02', 'relay unreachable');
    assert.deepStrictEqual(w.log.entries().map(e => e.level), ['info', 'warning']);
    const e = w.log.entries()[1];
    assert.strictEqual(e.code, 'SYNC-02');
    assert.strictEqual(e.area, 'SYNC', 'the area is the code\'s front half');
    assert.strictEqual(typeof e.time, 'number');
});

test('LOG-003', 'a bare-area code is fine for info and debug, and no extra report is made', () => {
    const w = world();
    w.log.log('info', 'IMPORT', 'Library updated');
    assert.strictEqual(w.log.entries().length, 1);
    assert.ok(!w.log.entries().some(e => e.code === 'UI-02'));
});

test('LOG-004', 'a warning without a number is still logged — and the module reports the slip (UI-02)', () => {
    const w = world();
    w.log.log('warning', 'IMPORT', 'An Import is already running');
    const codes = w.log.entries().map(e => e.code);
    assert.ok(codes.includes('IMPORT'), 'the message itself is kept');
    const slip = w.log.entries().find(e => e.code === 'UI-02');
    assert.ok(slip && slip.level === 'error', 'UI-02 error expected: ' + JSON.stringify(codes));
    assert.ok(/number/i.test(slip.text), slip.text);
});

test('LOG-005', 'an unknown area (a typo) is reported as UI-02, naming it', () => {
    const w = world();
    w.log.log('info', 'IMPRT', 'Library updated');
    const slip = w.log.entries().find(e => e.code === 'UI-02');
    assert.ok(slip && /IMPRT/.test(slip.text), JSON.stringify(w.log.entries()));
});

test('LOG-006', 'an unknown level is logged as an error, and reported as UI-02', () => {
    const w = world();
    w.log.log('WARNNG', 'IMPORT-01', 'typo in the level');
    const kept = w.log.entries().find(e => e.code === 'IMPORT-01');
    assert.strictEqual(kept.level, 'error');
    assert.ok(w.log.entries().some(e => e.code === 'UI-02' && /WARNNG/.test(e.text)));
});

test('LOG-007', 'repeats in a row are counted, not stored again; a different message starts a new entry', () => {
    const w = world();
    for (let i = 0; i < 3; i++) w.log.log('warning', 'SYNC-02', 'relay unreachable');
    w.log.log('info', 'SYNC', 'retrying');
    w.log.log('warning', 'SYNC-02', 'relay unreachable');
    const es = w.log.entries();
    assert.strictEqual(es.length, 3);
    assert.strictEqual(es[0].count, 3);
    assert.strictEqual(es[2].count, 1);
    assert.ok(/×3/.test(w.log.format(es[0])), w.log.format(es[0]));
});

test('LOG-008', 'the kept log stops at 500 entries — the oldest go first', () => {
    const w = world();
    for (let i = 0; i < 520; i++) w.log.log('info', 'BOOT', 'line ' + i);
    const es = w.log.entries();
    assert.strictEqual(es.length, 500);
    assert.strictEqual(es[0].text, 'line 20');
    assert.strictEqual(es[499].text, 'line 519');
});

test('LOG-009', 'a test message carries test: true and shows as CODE-!TEST! (the marker defined once)', () => {
    const w = world();
    w.log.log('warning', 'IMPORT-12', 'planted by a test', null, { test: true });
    w.log.log('info', 'BACKUP', 'planted too', null, { test: true });
    const [a, b] = w.log.entries();
    assert.strictEqual(a.test, true);
    assert.strictEqual(L.TEST_MARK, '-!TEST!');
    assert.strictEqual(w.out[0][1], 'warning · IMPORT-12-!TEST! · planted by a test');
    assert.strictEqual(w.log.format(b), 'info · BACKUP-!TEST! · planted too');
    w.log.log('warning', 'IMPORT-12', 'a real one');
    assert.ok(!last(w).test, 'a real message is not marked');
});

test('LOG-010', 'the scrubber removes Channel IDs and the passphrase — from the text, the data and the console', () => {
    const id = '58c1bfd7-1234-4abc-9def-0123456789ab';
    const w = world({ secrets: ['correct horse battery'] });
    w.log.log('warning', 'SYNC-03', `channel ${id} refused; passphrase correct horse battery`, { channelId: id });
    const e = last(w);
    assert.ok(!e.text.includes(id) && e.text.includes('58c1bfd7...89ab'), e.text);   // Relay Setup's form (LOG-031)
    assert.ok(!e.text.includes('correct horse battery') && e.text.includes('[passphrase]'), e.text);
    assert.ok(!JSON.stringify(e.data).includes(id), JSON.stringify(e.data));
    assert.ok(!w.out[0][1].includes(id) && !w.out[0][1].includes('correct horse'), w.out[0][1]);
    assert.strictEqual(L.scrub('no secrets here', []), 'no secrets here');
});

test('LOG-011', 'saves in batches: no write per message, one write when the timer fires, flush() writes now', () => {
    const w = world();
    for (let i = 0; i < 50; i++) w.log.log('info', 'BOOT', 'line ' + i);
    assert.strictEqual(w.writes.length, 0, 'no write per message');
    assert.strictEqual(w.timers.length, 1, 'one save scheduled for the batch');
    w.runTimers();
    assert.strictEqual(w.writes.length, 1);
    const saved = JSON.parse(w.store.get('readerwrangler-log'));
    assert.strictEqual(saved.length, 50);
    w.log.log('info', 'BOOT', 'one more');
    w.log.flush();
    assert.strictEqual(w.writes.length, 2, 'flush() writes at once (for leaving the page)');
});

test('LOG-012', 'a new logger keeps the previous log and adds a page-load entry (build, discarded)', () => {
    const before = world();
    before.log.log('warning', 'SYNC-02', 'relay unreachable');
    before.log.flush();
    const w = world({ stored: before.store.get('readerwrangler-log') });
    w.log.pageLoad({ build: '7.26.0-alpha.5', discarded: true });
    const es = w.log.entries();
    assert.strictEqual(es[0].code, 'SYNC-02', 'the previous entry is still there');
    const pl = es[es.length - 1];
    assert.strictEqual(pl.code, 'BOOT');
    assert.ok(/7\.26\.0-alpha\.5/.test(pl.text) && /discarded/i.test(pl.text), pl.text);
});

test('LOG-013', 'logging never throws — not when storage refuses, not on a strange argument', () => {
    const broken = { getItem: () => { throw new Error('denied'); }, setItem: () => { throw new Error('full'); } };
    const w = world({ storage: broken });
    w.log.log('info', 'BOOT', 'still works');
    w.log.flush();
    w.log.log('info', 'BOOT', { not: 'a string' });
    w.log.log();
    assert.ok(w.log.entries().length >= 2);
});

test('LOG-014', 'ours only: an uncaught error from our page is UI-03, a failed promise UI-04; an extension\'s is ignored', () => {
    const w = world();
    const handlers = {};
    const win = { addEventListener: (ev, fn) => { handlers[ev] = fn; } };
    w.log.installGlobalHandlers(win, 'http://localhost:8000');
    handlers.error({ message: 'x is not defined', filename: 'http://localhost:8000/readerwrangler.js', lineno: 12 });
    handlers.error({ message: 'Could not establish connection', filename: 'chrome-extension://abc/content.js' });
    handlers.unhandledrejection({ reason: new Error('fetch failed') });
    const codes = w.log.entries().map(e => e.code);
    assert.deepStrictEqual(codes, ['UI-03', 'UI-04'], JSON.stringify(w.log.entries()));
    assert.strictEqual(w.log.entries()[0].level, 'error');
    assert.ok(/x is not defined/.test(w.log.entries()[0].text));
});

test('LOG-015', 'the vocabulary: five levels in order, and the 17 areas as a frozen list', () => {
    assert.deepStrictEqual(L.LOG_LEVELS, ['debug', 'info', 'warning', 'error', 'critical']);
    // 13 from the sort (2026-11-07) + ORG, EDIT, AUTO, SHARE for the toasts none of them fit (Ron, 2026-11-09)
    assert.deepStrictEqual(Object.keys(L.LOG_AREAS).sort(), ['AUTO', 'BACKUP', 'BOOT', 'COVER', 'EDIT', 'FIELD', 'IMPORT',
        'INTEG', 'MOVE', 'ORG', 'PHONE', 'PREF', 'SHARE', 'STORE', 'SYNC', 'UI', 'UNDO']);
    assert.ok(Object.isFrozen(L.LOG_AREAS));
});

// ---- The two switches (LOGGING.md §5 step 5.1 — Ron, 2026-11-09; they replace step 3's ladder of levels) ----
// errorBanner: an error raises the banner. logDetail: debug lines are recorded (and so printed). Independent; both off
// for an ordinary user. Info and up are ALWAYS recorded; the console prints exactly what is recorded; critical is shown
// to EVERY user. Each is remembered in this browser; the address can set them (?errorBanner=on|off, ?logDetail=on|off).
// The logger decides; a thin renderer draws (onAlert).
function alertWorld(opts = {}) {
    const alerts = [];
    const w = world({ ...opts, extra: { onAlert: (kind, e) => alerts.push([kind, e.code]), ...(opts.extra || {}) } });
    return { ...w, alerts };
}

test('LOG-016', 'both switches off (an ordinary user): info and up recorded and printed; debug neither; no banner', () => {
    const w = alertWorld();
    w.log.log('debug', 'STORE', 'detail');
    w.log.log('info', 'BOOT', 'started');
    w.log.log('warning', 'PREF-02', 'not saved');
    assert.deepStrictEqual(w.out.map(o => o[0]), ['info', 'warn'], 'debug stays out of the console');
    assert.ok(!w.log.entries().some(e => e.level === 'debug'), 'and out of the log');
    assert.deepStrictEqual(w.log.switches(), { errorBanner: false, logDetail: false });
});

test('LOG-017', 'logDetail on: debug is recorded and printed, the choice is remembered — and it doesn\'t turn the banner on', () => {
    const w = alertWorld();
    w.log.setSwitch('logDetail', true);
    w.log.log('debug', 'STORE', 'detail');
    assert.ok(w.out.some(o => o[0] === 'debug'), 'debug printed');
    assert.ok(w.log.entries().some(e => e.level === 'debug'), 'debug recorded');
    assert.strictEqual(w.store.get('readerwrangler-log-detail'), 'on', 'remembered');
    const again = alertWorld({ storage: { getItem: k => w.store.get(k) ?? null, setItem: () => {} } });
    assert.deepStrictEqual(again.log.switches(), { errorBanner: false, logDetail: true }, 'a new page keeps it');
    w.log.log('error', 'INTEG-06', 'repaired');
    assert.deepStrictEqual(w.alerts, [], 'no banner: the switches are independent');
});

test('LOG-018', 'the console prints exactly what is recorded — no threshold of its own', () => {
    const w = alertWorld();
    w.log.setSwitch('errorBanner', true);
    w.log.log('info', 'BOOT', 'started');
    assert.strictEqual(w.out.length, 1, 'info printed with the banner on, too');
    assert.ok(w.log.entries().some(e => e.text === 'started'), 'and recorded');
});

test('LOG-019', 'errorBanner on: an error raises the banner; off again: no banner; remembered either way', () => {
    const w = alertWorld();
    w.log.log('error', 'INTEG-06', 'repaired 3 books');
    assert.deepStrictEqual(w.alerts, [], 'no banner for an ordinary user');
    w.log.setSwitch('errorBanner', true);
    w.log.log('error', 'INTEG-06', 'repaired 3 books again');
    assert.deepStrictEqual(w.alerts, [['banner', 'INTEG-06']]);
    assert.strictEqual(w.store.get('readerwrangler-log-banner'), 'on');
    w.log.setSwitch('errorBanner', false);
    w.log.log('error', 'INTEG-06', 'a third time');
    assert.strictEqual(w.alerts.length, 1, 'off again: no banner');
    assert.notStrictEqual(w.store.get('readerwrangler-log-banner'), 'on', 'off remembered');
    w.log.setSwitch('loud', true);
    assert.deepStrictEqual(w.log.switches(), { errorBanner: false, logDetail: false }, 'an unknown switch changes nothing');
});

test('LOG-020', 'a critical message is shown to EVERY user — whatever the switches', () => {
    const w = alertWorld();
    w.log.log('critical', 'STORE-02', 'the library could not be saved');
    assert.deepStrictEqual(w.alerts, [['critical', 'STORE-02']]);
    w.log.setSwitch('errorBanner', true);
    w.log.setSwitch('logDetail', true);
    w.log.log('critical', 'STORE-02', 'again');
    assert.deepStrictEqual(w.alerts[1], ['critical', 'STORE-02'], 'one alert kind for critical, either way');
});

test('LOG-021', 'the address: ?errorBanner= and ?logDetail= applied, remembered, and taken OUT of the address', () => {
    const w = alertWorld();
    assert.strictEqual(w.log.applyAddress('?errorBanner=on&logDetail=on&x=1'), '?x=1');
    assert.deepStrictEqual(w.log.switches(), { errorBanner: true, logDetail: true });
    assert.strictEqual(w.log.applyAddress('?logDetail=off'), '', 'the only parameter: nothing left');
    assert.deepStrictEqual(w.log.switches(), { errorBanner: true, logDetail: false }, 'one at a time');
    assert.strictEqual(w.log.applyAddress('?x=1'), null, 'neither — leave the address alone');
    assert.strictEqual(w.log.applyAddress('?errorBanner=loud'), '', 'an unknown value is still removed…');
    assert.deepStrictEqual(w.log.switches(), { errorBanner: true, logDetail: false }, '…and changes nothing');
    assert.strictEqual(w.log.applyAddress('?log=debug'), null, 'the old ?log= is no longer read');
});

test('LOG-031', 'one short form for a Channel ID — first 8 … last 4, as Relay Setup shows it — so old and new keys differ', () => {
    // (Ron, 2026-11-09: "if the issue is 'I changed my credentials…', distinguishing which use the old credentials and
    // which the new will be crucial" — the first 8 alone can't promise that; Relay Setup already shows this form)
    assert.strictEqual(L.shortChannelId('41e0e16f-1234-4abc-9def-01234567726c'), '41e0e16f...726c');
    const w = world();
    assert.strictEqual(w.log.shortChannelId('41e0e16f-1234-4abc-9def-01234567726c'), '41e0e16f...726c', 'on rwLog too');
    w.log.log('info', 'SYNC', 'old 41e0e16f-1234-4abc-9def-01234567726c, new 41e0e16f-9999-4abc-9def-012345671111');
    assert.ok(last(w).text.includes('41e0e16f...726c') && last(w).text.includes('41e0e16f...1111'),
              'two keys that share their first 8 still read differently: ' + last(w).text);
    assert.strictEqual(L.shortChannelId(''), '', 'nothing in, nothing out');
    assert.strictEqual(L.shortChannelId(null), '');
});

// ---- For the Diagnostics window (LOGGING.md §5 step 5.3): live updates, Clear, Copy diagnostics ----
test('LOG-032', 'subscribe(fn): told when an entry is kept or a repeat counted — not for one that isn\'t kept; unsubscribe', () => {
    const w = world();
    let calls = 0;
    const off = w.log.subscribe(() => { calls++; });
    w.log.log('info', 'BOOT', 'one');
    w.log.log('info', 'BOOT', 'one');       // a repeat, counted
    w.log.log('debug', 'STORE', 'detail');  // not kept (extra detail off)
    assert.strictEqual(calls, 2);
    off();
    w.log.log('info', 'BOOT', 'two');
    assert.strictEqual(calls, 2, 'unsubscribed');
});

test('LOG-033', 'clear(): the kept log empties now (saved at once), and the window is told', () => {
    const w = world();
    let calls = 0;
    w.log.subscribe(() => { calls++; });
    w.log.log('info', 'BOOT', 'one');
    w.log.clear();
    assert.deepStrictEqual(w.log.entries(), []);
    assert.strictEqual(w.store.get('readerwrangler-log'), '[]', 'saved at once — a reload must not bring it back');
    assert.strictEqual(calls, 2);
});

test('LOG-034', 'diagnosticsText: a header (time, the caller\'s lines, the switches), then EVERY kept entry, oldest first, with details', () => {
    const w = world();
    w.log.setSwitch('errorBanner', true);
    w.log.log('info', 'BOOT', 'first');
    w.log.log('warning', 'PREF-02', 'second', { error: 'quota' });
    w.log.log('info', 'MOVE', 'planted', null, { test: true });
    const text = w.log.diagnosticsText(['Desktop app 7.26.0-alpha.27 (page 7.25.1)']);
    const lines = text.split('\n');
    assert.ok(lines[0].startsWith('ReaderWrangler diagnostics — '), lines[0]);
    assert.ok(text.includes('Desktop app 7.26.0-alpha.27 (page 7.25.1)'), 'the caller\'s header line');
    assert.ok(text.includes('Switches: error banner on, extra detail off'), 'the switches');
    const first = lines.findIndex(l => l.includes('info · BOOT · first')), second = lines.findIndex(l => l.includes('PREF-02 · second'));
    assert.ok(first > 0 && second > first, 'oldest first');
    assert.ok(lines[second + 1].includes('"error":"quota"'), 'the details on the next line: ' + lines[second + 1]);
    assert.ok(text.includes('MOVE-!TEST! · planted'), 'a planted entry keeps its TEST marker');
});

test('LOG-030', 'an old remembered level (the ladder, before 2026-11-09) becomes the switches once, then is gone', () => {
    const store = new Map([['readerwrangler-log-level', 'debug']]);
    const storage = { getItem: k => (store.has(k) ? store.get(k) : null), setItem: (k, v) => store.set(k, String(v)),
                      removeItem: k => store.delete(k) };
    const w = world({ storage });
    assert.deepStrictEqual(w.log.switches(), { errorBanner: true, logDetail: true }, 'debug: both on');
    assert.ok(!store.has('readerwrangler-log-level'), 'the old setting removed');
    store.set('readerwrangler-log-level', 'error');
    store.delete('readerwrangler-log-banner'); store.delete('readerwrangler-log-detail');
    assert.deepStrictEqual(world({ storage }).log.switches(), { errorBanner: true, logDetail: false }, 'any other level: the banner');
});

// ---- Where a message goes: the user, with { toast } (LOGGING.md §6, 2026-11-08) ----
function toastWorld() {
    const toasts = [];
    const w = alertWorld();
    w.log.setToaster((text, o) => toasts.push([text, o]));
    return { ...w, toasts };
}

test('LOG-023', '{ toast: true } shows the message to the user through the app\'s toaster — and logs it too', () => {
    const w = toastWorld();
    w.log.log('info', 'MOVE', 'Moved 3 books to Fantasy', null, { toast: true });
    assert.strictEqual(w.toasts.length, 1);
    assert.strictEqual(w.toasts[0][0], 'Moved 3 books to Fantasy');
    assert.strictEqual(w.toasts[0][1].level, 'info');
    assert.ok(w.log.entries().some(e => e.text === 'Moved 3 books to Fantasy'), 'logged');
    assert.ok(w.out.some(o => o[1].includes('Moved 3 books')), 'and in the console');
});

test('LOG-024', '{ toast: { x, y } } carries where to show it; { hint: true } marks a passing hint', () => {
    const w = toastWorld();
    w.log.log('info', 'UNDO', 'Nothing to undo', null, { toast: { x: 10, y: 20 }, hint: true });
    assert.deepStrictEqual(w.toasts[0][1], { level: 'info', x: 10, y: 20, hint: true });
});

test('LOG-025', 'a message without { toast } never reaches the user — not even an error', () => {
    const w = toastWorld();
    w.log.log('error', 'INTEG-06', 'repaired 3 books');
    w.log.log('info', 'BOOT', 'started');
    assert.strictEqual(w.toasts.length, 0);
    // (and both were logged — "no toast" alone is also what a crash looks like)
    assert.deepStrictEqual(w.log.entries().map(e => e.code), ['INTEG-06', 'BOOT']);
});

test('LOG-026', 'no toaster yet (the app not up, or crashed): a { toast } message is still logged, nothing throws', () => {
    const w = alertWorld();
    w.log.log('warning', 'SYNC-02', 'relay unreachable', null, { toast: true });
    assert.ok(w.log.entries().some(e => e.code === 'SYNC-02'));
});

test('LOG-027', 'a critical message shows the critical box, not a toast; the toast text is scrubbed like the log', () => {
    const w = toastWorld();
    w.log.log('critical', 'STORE-02', 'the library could not be saved', null, { toast: true });
    assert.strictEqual(w.toasts.length, 0, 'no toast for critical');
    assert.deepStrictEqual(w.alerts, [['critical', 'STORE-02']]);
    w.log.log('error', 'SYNC-04', 'channel 58c1bfd7-1234-4abc-9def-0123456789ab refused', null, { toast: true });
    assert.ok(!w.toasts[0][0].includes('1234-4abc') && w.toasts[0][0].includes('58c1bfd7...89ab'), w.toasts[0][0]);
    assert.strictEqual(w.toasts[0][1].level, 'error');
});

test('LOG-022','a planted test error raises the banner too (so the banner can be tested), marked as a test', () => {
    const w = alertWorld();
    w.log.setSwitch('errorBanner', true);
    w.log.log('error', 'UI-03', 'planted', null, { test: true });
    assert.deepStrictEqual(w.alerts, [['banner', 'UI-03']]);
    assert.strictEqual(last(w).test, true);
});

test('LOG-028', 'a critical message can carry its own advice for the box (BOOT-01: "don\'t save a backup now"); kept with it', () => {
    const seen = [];
    const w = world({ extra: { onAlert: (kind, e) => seen.push(e) } });
    w.log.log('critical', 'BOOT-01', "Your library couldn't be loaded", null, { advice: "Don't save a backup now." });
    assert.strictEqual(seen.length, 1);
    assert.strictEqual(seen[0].advice, "Don't save a backup now.");
    assert.strictEqual(last(w).advice, "Don't save a backup now.", 'kept in the log with the message');
    w.log.log('critical', 'STORE-02', 'the library could not be saved');
    assert.strictEqual(seen[1].advice, undefined, 'no advice given → none (the box shows its usual words)');
    w.log.log('critical', 'STORE-06', 'x', null, { advice: 42 });
    assert.strictEqual(seen[2].advice, undefined, 'only words count as advice');
});

test('LOG-029', 'rwLog.dialog(area, text): a dialog logs what it showed, at info, in its area; an unknown area is UI-05', () => {
    const w = world();
    w.log.dialog('BACKUP', 'Shown: "Restore Error" — that file can\'t be restored');
    assert.deepStrictEqual([last(w).level, last(w).code], ['info', 'BACKUP']);
    assert.ok(last(w).text.includes('Restore Error'));
    w.log.dialog('BAKUP', 'Shown: "x"');
    const codes = w.log.entries().map(e => e.code);
    assert.ok(codes.includes('UI-05'), 'a mistyped area is reported (UI-05)');
    assert.ok(w.log.entries().some(e => e.text === 'Shown: "x"'), 'and the dialog is still logged');
});

// ---- 7.28.0: the module in logkit/, RW's settings beside it ----
test('LOG-035', 'the page-global the name check is told about is the logger\'s real name (settings.globalName)', () => {
    const src = require('fs').readFileSync(require('path').join(__dirname, '..', 'logkit-settings.js'), 'utf8');
    const declared = [...src.matchAll(/\/\*\s*page-global:\s*([A-Za-z_$][\w$]*)\s*\*\//g)].map(m => m[1]);
    assert.deepStrictEqual(declared, [S.settings.globalName], 'declared: ' + JSON.stringify(declared));
});

// A kit file's CODE (comments may say where it came from — whole-line ones, and a trailing "  // …" after code)
const kitCode = (file) => require('fs').readFileSync(require('path').join(__dirname, '..', 'logkit', file), 'utf8')
    .split('\n').filter(l => !/^\s*\/\//.test(l)).map(l => l.replace(/\s+\/\/\s.*$/, '')).join('\n');
const RW_WORDS = ['readerwrangler-', 'ReaderWrangler', 'rwLog', 'APP_VERSION', 'ORGANIZER_VERSION', 'Channel', 'BACKUP',
    "'BOOT'", "'SHARE", 'Desktop app', 'passphrase'];

test('LOG-036', 'the module knows nothing of ReaderWrangler: no product name, storage key, area list or Channel ID in it', () => {
    const code = kitCode('logger.js');
    for (const word of RW_WORDS) assert.ok(!code.includes(word), `logkit/logger.js's code still mentions ${word}`);
});

// 2026-11-11 (Ron): what a hidden secret becomes is the host's word — the kit's own is "[hidden]"; ours stays "[passphrase]"
test('LOG-038', 'a hidden secret becomes the host\'s label (secretLabel) — "[hidden]" when the host names none', () => {
    assert.strictEqual(K.scrub('key: open sesame!', ['open sesame'], {}), 'key: [hidden]!');
    assert.strictEqual(K.scrub('key: open sesame!', ['open sesame'], { secretLabel: '[token]' }), 'key: [token]!');
    assert.strictEqual(L.scrub('key: open sesame!', ['open sesame']), 'key: [passphrase]!', 'ReaderWrangler\'s settings keep its word');
    const lines = [];
    const log = K.createLogger({ console: { error: (t) => lines.push(t), warn: () => {}, info: () => {}, debug: () => {}, log: () => {} },
        secrets: () => ['open sesame'] });
    log.log('error', 'UI-02', 'it said open sesame');
    assert.ok(log.entries()[0].text.endsWith('[hidden]') && !lines[0].includes('open sesame'), log.entries()[0].text);
});

test('LOG-037','the Diagnostics window knows nothing of ReaderWrangler: the logger, the dialog and the copy header are handed in', () => {
    const code = kitCode('diagnostics-window.js');
    for (const word of RW_WORDS) assert.ok(!code.includes(word), `logkit/diagnostics-window.js's code still mentions ${word}`);
});

// 7.29.1 (TODO 20261112-1755 "Copy buttons tell the truth"; Ron, 2026-11-13: ONE copy routine in the whole app, the kit's
// — Law 22). log.copyText(text, { what, where, toast, next }) copies and says truthfully what happened: true only when
// the clipboard accepted the text; a page with NO clipboard (an insecure address) is a refusal; a refusal is logged
// (UI-06, the one place), never swallowed. A stand-in clipboard: accepts, refuses, or isn't there at all.
const clipboards = {
    accepts: (got) => ({ writeText: async (t) => { got.push(t); } }),
    refuses: () => ({ writeText: async () => { throw new Error('Write permission denied.'); } }),
    throws: () => ({ writeText: () => { throw new Error('Document is not focused.'); } }),
};
const copyWorld = (clip, extra) => world({ extra: { clipboard: () => clip, ...extra } });

test('LOG-039', 'copyText: a clipboard that takes the text → true, the text on it, "copied" logged at info (UI)', async () => {
    const got = [];
    const w = copyWorld(clipboards.accepts(got));
    const ok = await w.log.copyText('the report', { what: 'Diagnostics', where: 'the phone' });
    assert.strictEqual(ok, true);
    assert.deepStrictEqual(got, ['the report']);
    assert.deepStrictEqual([last(w).level, last(w).code, last(w).text], ['info', 'UI', 'Diagnostics copied (the phone)']);
});

test('LOG-040', 'copyText: a clipboard that refuses → false (never a throw), UI-06 warning with the browser\'s reason', async () => {
    for (const clip of [clipboards.refuses(), clipboards.throws()]) {
        const w = copyWorld(clip);
        const ok = await w.log.copyText('the report', { what: 'Diagnostics', where: 'the error banner' });
        assert.strictEqual(ok, false);
        const e = last(w);
        assert.deepStrictEqual([e.level, e.code], ['warning', 'UI-06']);
        assert.strictEqual(e.text, "Diagnostics couldn't be copied (the error banner) — the browser refused the clipboard");
        assert.ok(/permission denied|not focused/.test(e.data.reason), JSON.stringify(e.data));
    }
});

test('LOG-041', 'copyText: a page with NO clipboard (an insecure address) is a refusal — never "copied"', async () => {
    for (const clip of [undefined, null, {}]) {
        const w = copyWorld(clip);
        const ok = await w.log.copyText('the report', { what: 'Diagnostics' });
        assert.strictEqual(ok, false, `no clipboard (${JSON.stringify(clip)}) said copied`);
        assert.deepStrictEqual([last(w).code, last(w).text], ['UI-06', "Diagnostics couldn't be copied — the browser refused the clipboard"]);
        assert.ok(/no clipboard/.test(last(w).data.reason), JSON.stringify(last(w).data));
    }
});

test('LOG-042', 'copyText { toast }: the person is told either way — "next" follows a copy; nothing told without it', async () => {
    const toasts = [];
    const got = [];
    let w = copyWorld(clipboards.accepts(got));
    w.log.setToaster((text, o) => toasts.push([text, o.level]));
    await w.log.copyText('x', { what: 'Diagnostics', toast: true, next: 'paste them into your message to us' });
    w = copyWorld(undefined);
    w.log.setToaster((text, o) => toasts.push([text, o.level]));
    await w.log.copyText('x', { what: 'Diagnostics', toast: true });
    await w.log.copyText('x', { what: 'Diagnostics' });
    assert.deepStrictEqual(toasts, [['Diagnostics copied — paste them into your message to us', 'info'],
        ["Diagnostics couldn't be copied — the browser refused the clipboard", 'warning']]);
});

test('LOG-043', 'copyText with no "what" still says something true ("Text copied"), and the copy is the text as given', async () => {
    const got = [];
    const w = copyWorld(clipboards.accepts(got));
    assert.strictEqual(await w.log.copyText(42), true);
    assert.deepStrictEqual([got, last(w).text], [['42'], 'Text copied']);
});

// Law 22 as a check, not a promise: the clipboard is written in ONE place — copyText in logkit/logger.js. Every other
// shipped script, and every page's own inline script, calls it. (7.29.1-alpha.1 let readerwrangler.js keep its 11 Copy
// buttons for a while; alpha.4 moved them all — the allowance is gone: 0, anywhere but the kit.)
test('LOG-044', 'the clipboard is written in ONE place (logkit/logger.js copyText) — no shipped script or page keeps its own copy', () => {
    const fs = require('fs');
    const path = require('path');
    const root = path.join(__dirname, '..');
    const scripts = [...fs.readdirSync(root).filter(f => f.endsWith('.js') || f.endsWith('.html')),
        ...fs.readdirSync(path.join(root, 'logkit')).filter(f => f.endsWith('.js')).map(f => `logkit/${f}`)];
    const WRITE = /\bwriteText\s*\(|\bexecCommand\(\s*['"]copy|\bClipboardItem\b|\bclipboard\.write\s*\(/g;
    const found = [];
    for (const file of scripts) {
        const code = fs.readFileSync(path.join(root, file), 'utf8').split('\n')
            .filter(l => !/^\s*(\/\/|\*)/.test(l)).map(l => l.replace(/\s+\/\/\s.*$/, '')).join('\n');
        const n = (code.match(WRITE) || []).length;
        const allowed = file === 'logkit/logger.js' ? 1 : 0;
        if (n > allowed) found.push(`${file}: ${n} clipboard write(s) of its own (allowed ${allowed}) — call rwLog.copyText`);
    }
    assert.ok(['reportProblem.js', 'mobile.js', 'readerwrangler.js', 'readerwrangler.html', 'reset.html'].every(f => scripts.includes(f)),
        `the scan missed the app's scripts or pages: ${scripts}`);
    assert.deepStrictEqual(found, []);
});

done();
