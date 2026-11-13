// test/harness.js — the one shared helper for the function tests (docs/design/TESTING.md, 2026-11-04).
//
// Replaces the four copies of a `test(name, fn)` one-liner that each file carried. Two things the copies got wrong:
// the first failure threw and stopped the file (later tests never ran, so you couldn't see how much broke), and a test
// had no stable ID. Here every test has an ID (`AREA-NNN`), a failure is reported and counted and the file carries on,
// and done() prints the summary and sets the exit code (1 if anything failed) for tools/run_tests.py.
//
// A test may return a promise (7.29.1 — the copy routine answers later): it is waited for, and its failure counted. done()
// prints the summary once every test has finished; a test whose promise never settles fails the file, by name (RUN-030–032).
//
// Usage in a test file:
//   const { test, done } = require('./harness');
//   test('MERGE-001', 'never invents a key absent from both inputs', () => { … });
//   test('LOG-039', 'a later answer', async () => { … });
//   done();
'use strict';

let passed = 0;
const failures = [];
const seenIds = new Set();
const unfinished = new Map();   // id → name, for each test whose promise hasn't settled yet
const waiting = [];

function test(id, name, fn) {
    if (!/^[A-Z][A-Z0-9]*-\d{3}$/.test(id)) {
        failures.push({ id: String(id), name, error: `bad test ID "${id}" — use AREA-NNN, e.g. MERGE-012` });
        console.log(`  ✗ ${id} ${name}\n      bad test ID — use AREA-NNN`);
        return;
    }
    if (seenIds.has(id)) {
        failures.push({ id, name, error: `duplicate test ID ${id}` });
        console.log(`  ✗ ${id} ${name}\n      duplicate test ID`);
        return;
    }
    seenIds.add(id);
    const pass = () => { passed++; console.log(`  ✓ ${id} ${name}`); };
    const fail = (e) => {
        failures.push({ id, name, error: e });
        const msg = String((e && e.message) || e).split('\n').slice(0, 6).join('\n      ');
        console.log(`  ✗ ${id} ${name}\n      ${msg}`);
    };
    let result;
    try { result = fn(); } catch (e) { fail(e); return; }
    if (result && typeof result.then === 'function') {
        unfinished.set(id, name);
        waiting.push(Promise.resolve(result).then(pass, fail).then(() => unfinished.delete(id)));
    } else pass();
}

function done() {
    // Until every test has finished, the file counts as failed: a promise that never settles lets Node exit with
    // nothing left to run — that must not read as a pass.
    process.exitCode = 1;
    process.once('beforeExit', () => {
        if (!unfinished.size) return;
        for (const [id, name] of unfinished) {
            failures.push({ id, name, error: 'never finished' });
            console.log(`  ✗ ${id} ${name}\n      never finished (its promise never settled)`);
        }
        unfinished.clear();
        console.log(`${passed} passed, ${failures.length} failed`);
    });
    return Promise.all(waiting).then(() => {
        console.log(`${passed} passed, ${failures.length} failed`);
        process.exitCode = failures.length ? 1 : 0;
    });
}

module.exports = { test, done };
