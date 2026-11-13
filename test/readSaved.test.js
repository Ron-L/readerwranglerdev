// Unit tests for the ONE reader of saved settings (uiHelpers.js readSaved, 7.29.1) — run: node test/readSaved.test.js
// tags: storage, settings, logging, tier 1
// covers: uiHelpers.js
//
// TODO "One safe way to read saved settings — a damaged one can blank the phone app today" (20261109-0912). Both apps
// read ~30 saved notes from the browser, each with its own hand-written guard — or none (a damaged phone settings note
// blanked the phone app). Decided (Ron, 2026-11-13): one reader — the saved value when it reads and is the right kind,
// else the fallback, quietly, and ONE warning in Diagnostics naming the setting; nothing on screen.
// The browser's storage and the logger are stand-ins here (the reader asks for them by their page names when it runs).
const assert = require('assert');
const { test: t, done } = require('./harness');

const saved = {};
const logged = [];
global.localStorage = { getItem: (k) => (k in saved ? saved[k] : null) };
global.rwLog = { log: (...args) => logged.push(args) };
const { readSaved, SAVED_KINDS } = require('../uiHelpers.js');

const warningsAbout = (name) => logged.filter(([, , text]) => String(text).includes(`"${name}"`));

console.log('readSaved');

t('SAVED-001', 'a good value of the right kind comes back exactly as saved — no warning', () => {
    saved['t-good'] = JSON.stringify({ sortOption: 'title', showHidden: true });
    assert.deepStrictEqual(readSaved('t-good', {}, 'object'), { sortOption: 'title', showHidden: true });
    saved['t-list'] = JSON.stringify([1, 2]);
    assert.deepStrictEqual(readSaved('t-list', [], 'array'), [1, 2]);
    assert.strictEqual(warningsAbout('t-good').length + warningsAbout('t-list').length, 0);
});

t('SAVED-002', 'missing (never saved) → the fallback, quietly', () => {
    const fallback = { viewMode: 'covers' };
    assert.strictEqual(readSaved('t-missing', fallback, 'object'), fallback);
    assert.strictEqual(warningsAbout('t-missing').length, 0, 'a setting never saved is not damage');
});

t('SAVED-003', 'unreadable text → the fallback, and ONE warning naming the setting (a numbered STORE code)', () => {
    saved['t-broken'] = '{"sortOption": "title"';            // cut off mid-write
    assert.deepStrictEqual(readSaved('t-broken', { d: 1 }, 'object'), { d: 1 });
    const w = warningsAbout('t-broken');
    assert.strictEqual(w.length, 1, 'one warning');
    const [level, code, text] = w[0];
    assert.strictEqual(level, 'warning');
    assert.match(code, /^STORE-\d+$/);
    assert.match(text, /couldn't be read/);
});

t('SAVED-004', 'readable, but the wrong kind (an array where settings belong) → the fallback, and one warning saying so', () => {
    saved['t-kind'] = JSON.stringify(['not', 'settings']);
    assert.deepStrictEqual(readSaved('t-kind', {}, 'object'), {});
    const w = warningsAbout('t-kind');
    assert.strictEqual(w.length, 1);
    assert.match(w[0][2], /array/, 'the warning names what was found');
    saved['t-kind2'] = '"just text"';
    assert.deepStrictEqual(readSaved('t-kind2', [], 'array'), []);
    assert.strictEqual(warningsAbout('t-kind2').length, 1);
});

t('SAVED-005', 'the same damaged setting read again (the phone reads its settings on every redraw) → still ONE warning', () => {
    saved['t-again'] = 'garbage';
    for (let i = 0; i < 5; i++) assert.deepStrictEqual(readSaved('t-again', {}, 'object'), {});
    assert.strictEqual(warningsAbout('t-again').length, 1);
});

t('SAVED-006', 'a saved "null" means nothing saved → the fallback, quietly', () => {
    saved['t-null'] = 'null';
    assert.strictEqual(readSaved('t-null', null, 'object'), null);
    assert.deepStrictEqual(readSaved('t-null', [], 'array'), []);
    assert.strictEqual(warningsAbout('t-null').length, 0);
});

t('SAVED-007', 'storage that refuses to be read (a locked-down browser) → the fallback and one warning', () => {
    const refusing = { getItem: () => { throw new Error('SecurityError: access denied'); } };
    assert.deepStrictEqual(readSaved('t-refused', { d: 2 }, 'object', { storage: refusing }), { d: 2 });
    assert.strictEqual(warningsAbout('t-refused').length, 1);
});

t('SAVED-008', 'onDamaged: data that is not a setting (the organization) reports its own damage — instead of the warning', () => {
    saved['t-org'] = '{"organization": ';
    const reports = [];
    assert.strictEqual(readSaved('t-org', null, 'object', { onDamaged: (problem) => reports.push(problem) }), null);
    assert.strictEqual(reports.length, 1);
    assert.match(reports[0], /not readable/);
    assert.strictEqual(warningsAbout('t-org').length, 0, 'the caller reported it — no second message');
    readSaved('t-org', null, 'object', { onDamaged: (problem) => reports.push(problem) });
    assert.strictEqual(reports.length, 2, 'the caller hears about it every time it asks');
});

t('SAVED-009', 'reads the storage it is handed (the tab-only storage, say)', () => {
    const tabOnly = { getItem: (k) => (k === 't-tab' ? '[3]' : null) };
    assert.deepStrictEqual(readSaved('t-tab', [], 'array', { storage: tabOnly }), [3]);
});

t('SAVED-010', 'a kind nothing knows (a typo) fails at once — never a quiet fallback for every read', () => {
    saved['t-typo'] = '{}';
    assert.throws(() => readSaved('t-typo', {}, 'objcet'), /kind/);
});

// One row per kind the reader knows (SAVED_KINDS — the list the code uses), each with what it must accept and refuse.
// A kind added without a row here fails this test (docs/design/TESTING.md §1).
const KIND_ROWS = {
    object:  { accepts: [{}, { a: 1 }],    refuses: [[], 'x', 1, true] },
    array:   { accepts: [[], [1, 'a']],    refuses: [{}, 'x', 1, true] },
    string:  { accepts: ['', 'covers'],    refuses: [{}, [], 1, true] },
    number:  { accepts: [0, 3.5],          refuses: [{}, [], '1', true] },
    boolean: { accepts: [true, false],     refuses: [{}, [], 'true', 0] },
};
t('SAVED-011', 'every kind the reader knows accepts its own and refuses the rest (one row per kind, from its list)', () => {
    const kinds = Object.keys(SAVED_KINDS);
    const missing = kinds.filter(k => !KIND_ROWS[k]);
    assert.deepStrictEqual(missing, [], `kinds with no expected result written: ${missing.join(', ')}`);
    for (const kind of kinds) {
        KIND_ROWS[kind].accepts.forEach((v, i) => {
            saved[`t-${kind}-ok${i}`] = JSON.stringify(v);
            assert.deepStrictEqual(readSaved(`t-${kind}-ok${i}`, 'FALLBACK', kind), v, `${kind} should accept ${JSON.stringify(v)}`);
        });
        KIND_ROWS[kind].refuses.forEach((v, i) => {
            saved[`t-${kind}-no${i}`] = JSON.stringify(v);
            assert.strictEqual(readSaved(`t-${kind}-no${i}`, 'FALLBACK', kind), 'FALLBACK', `${kind} should refuse ${JSON.stringify(v)}`);
        });
    }
});

done();
