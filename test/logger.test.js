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

test('LOG-001', 'each level goes to its own console method, as "level · CODE · text"', () => {
    const w = world();
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

test('LOG-015', 'the vocabulary: five levels in order, and the 13 areas as a frozen list', () => {
    assert.deepStrictEqual(L.LOG_LEVELS, ['debug', 'info', 'warning', 'error', 'critical']);
    assert.deepStrictEqual(Object.keys(L.LOG_AREAS).sort(), ['BACKUP', 'BOOT', 'COVER', 'FIELD', 'IMPORT', 'INTEG', 'MOVE',
        'PHONE', 'PREF', 'STORE', 'SYNC', 'UI', 'UNDO']);
    assert.ok(Object.isFrozen(L.LOG_AREAS));
});

done();
