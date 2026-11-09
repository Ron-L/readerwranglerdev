// Unit tests for logger.js — run: node test/logger.test.js
// tags: logging, tier 1
// covers: logger.js
// The logging module (docs/design/LOGGING.md §1, §2, §2b, §6 — Ron + Claude, 2026-11-05/07): one call
// rwLog.log(level, code, text, data, { test }), five levels, codes 'AREA' or 'AREA-NN' (numbered required for warning and
// above), the kept log (info and up, the last 500, repeats counted, batched saves, page loads), the scrubber, test
// messages marked -!TEST!, and "ours only" for uncaught errors. Written BEFORE the module (TESTING.md §6).
'use strict';
const assert = require('assert');
const { test, done } = require('./harness');
const L = require('../logger.js');

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

test('LOG-001', 'each level goes to its own console method, as "level · CODE · text" (at ?log=debug)', () => {
    const w = world();
    w.log.setLevel('debug');   // (debug reaches the console only at debug — LOG-016)
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
    assert.ok(!e.text.includes(id) && e.text.includes('58c1bfd7…'), e.text);
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

// ---- Step 3 (LOGGING.md §1, TODO decisions 3-4): the one tunable gate, diagnostics mode, the alerts ----
// The setting: none (an ordinary user) or a level chosen with ?log=… (diagnostics mode). The console shows the chosen
// level and up (info and up when none is chosen); debug is kept only at debug. In diagnostics mode, error and above
// raise the banner; critical is shown to EVERY user. The logger decides; a thin renderer draws (onAlert).
function alertWorld(opts = {}) {
    const alerts = [];
    const w = world({ ...opts, extra: { onAlert: (kind, e) => alerts.push([kind, e.code]), ...(opts.extra || {}) } });
    return { ...w, alerts };
}

test('LOG-016', 'no setting (an ordinary user): the console shows info and up; no diagnostics', () => {
    const w = alertWorld();
    w.log.log('debug', 'STORE', 'detail');
    w.log.log('info', 'BOOT', 'started');
    assert.deepStrictEqual(w.out.map(o => o[0]), ['info'], 'debug stays out of the console');
    assert.strictEqual(w.log.diagnostics(), false);
    assert.strictEqual(w.log.level(), 'info');
});

test('LOG-017', 'setLevel("debug"): debug shows and is kept, diagnostics on, and the choice is remembered', () => {
    const w = alertWorld();
    w.log.setLevel('debug');
    w.log.log('debug', 'STORE', 'detail');
    assert.ok(w.out.some(o => o[0] === 'debug'), 'debug printed');
    assert.ok(w.log.entries().some(e => e.level === 'debug'), 'debug kept at debug');
    assert.strictEqual(w.log.diagnostics(), true);
    assert.strictEqual(w.store.get('readerwrangler-log-level'), 'debug', 'remembered');
    const again = alertWorld({ storage: { getItem: k => w.store.get(k) ?? null, setItem: () => {} } });
    assert.strictEqual(again.log.level(), 'debug', 'a new page keeps it');
});

test('LOG-018', 'a higher setting hides lower lines from the console — but info and up are still KEPT', () => {
    const w = alertWorld();
    w.log.setLevel('warning');
    w.log.log('info', 'BOOT', 'started');
    assert.strictEqual(w.out.length, 0, 'info not printed at warning');
    assert.ok(w.log.entries().some(e => e.text === 'started'), 'but kept');
});

test('LOG-019', 'an error raises the banner only in diagnostics mode', () => {
    const w = alertWorld();
    w.log.log('error', 'INTEG-06', 'repaired 3 books');
    assert.deepStrictEqual(w.alerts, [], 'no banner for an ordinary user');
    w.log.setLevel('error');
    w.log.log('error', 'INTEG-06', 'repaired 3 books again');
    assert.deepStrictEqual(w.alerts, [['banner', 'INTEG-06']]);
});

test('LOG-020', 'a critical message is shown to EVERY user — diagnostics or not', () => {
    const w = alertWorld();
    w.log.log('critical', 'STORE-02', 'the library could not be saved');
    assert.deepStrictEqual(w.alerts, [['critical', 'STORE-02']]);
    w.log.setLevel('debug');
    w.log.log('critical', 'STORE-02', 'again');
    assert.deepStrictEqual(w.alerts[1], ['critical', 'STORE-02'], 'one alert kind for critical, also in diagnostics');
});

test('LOG-021', '?log=… on the address: applied, remembered, and taken OUT of the address; ?log=off clears it', () => {
    const w = alertWorld();
    assert.strictEqual(w.log.applyAddress('?log=debug&x=1'), '?x=1');
    assert.strictEqual(w.log.level(), 'debug');
    assert.strictEqual(w.log.applyAddress('?log=debug'), '', 'the only parameter: nothing left');
    assert.strictEqual(w.log.applyAddress('?x=1'), null, 'no ?log= — leave the address alone');
    assert.strictEqual(w.log.applyAddress('?log=off'), '');
    assert.strictEqual(w.log.diagnostics(), false);
    assert.strictEqual(w.log.level(), 'info');
    assert.strictEqual(w.log.applyAddress('?log=loud'), '', 'an unknown value is still removed…');
    assert.strictEqual(w.log.diagnostics(), false, '…and changes nothing');
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
    assert.ok(!w.toasts[0][0].includes('1234-4abc') && w.toasts[0][0].includes('58c1bfd7…'), w.toasts[0][0]);
    assert.strictEqual(w.toasts[0][1].level, 'error');
});

test('LOG-022','a planted test error raises the banner too (so the banner can be tested), marked as a test', () => {
    const w = alertWorld();
    w.log.setLevel('debug');
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

done();
