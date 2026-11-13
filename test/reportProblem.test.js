// Function tests for reportProblem.js — THE "report a problem" helper. Run: node test/reportProblem.test.js
// tags: report, diagnostics, tier 1
// covers: reportProblem.js
// 7.29.0 (TODO 20261111-1104a / 1104b; Ron, 2026-11-12: both email and GitHub, one shared helper for the emergency
// screen, the reset page and Help → Report a problem…). Its clicks, the clipboard and the boxes are screen tests:
// test/ui/test_report_problem.py (Help), test/ui/test_emergency.py (the emergency screen), test/ui/test_reset_page.py.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const r = require('../reportProblem.js');
const { test, done } = require('./harness');

console.log('reportProblem tests:');

test('RPTFN-001', 'the three addresses: our email, the GitHub issue list, and a new issue under it', () => {
    assert.strictEqual(r.EMAIL, 'contact@readerwrangler.com');
    assert.strictEqual(r.ISSUES_URL, 'https://github.com/Ron-L/ReaderWrangler/issues');
    assert.strictEqual(r.NEW_ISSUE_URL, 'https://github.com/Ron-L/ReaderWrangler/issues/new');
});

test('RPTFN-002', "the email link: to our address, a subject with the build — and NO body (a mail link cuts long text off)", () => {
    const url = r.mailtoUrl('7.29.0');
    assert.ok(url.startsWith('mailto:contact@readerwrangler.com?'), url);
    const params = new URLSearchParams(url.split('?')[1]);
    assert.strictEqual(params.get('subject'), 'ReaderWrangler problem report (7.29.0)');
    assert.deepStrictEqual([...params.keys()], ['subject'], `only a subject: ${url}`);
});

test('RPTFN-003', 'with no build known (the reset page), the subject has no empty brackets', () => {
    const params = new URLSearchParams(r.mailtoUrl(undefined).split('?')[1]);
    assert.strictEqual(params.get('subject'), 'ReaderWrangler problem report');
});

// 7.29.1 (TODO 20261112-1755; Ron, 2026-11-13: ONE copy routine in the whole app, the logging kit's — Law 22): the helper's
// own copy is gone; it hands the logger's report to the logger's copyText, which says truthfully what happened. A stand-in
// logger (the page's global rwLog) records what it was asked.
const standInLogger = (answer) => {
    const asked = { lines: null, copies: [] };
    global.rwLog = {
        log: () => {},
        diagnosticsText: (lines) => { asked.lines = lines; return 'FROM THE LOGGER\n' + lines.join('\n'); },
        copyText: (text, how) => { asked.copies.push([text, how]); return Promise.resolve(answer); },
    };
    return asked;
};

test('RPTFN-004', "the copy is the logger's own diagnostics, with the caller's lines, through the logger's copyText — its answer passed on", async () => {
    try {
        for (const answer of [true, false]) {
            const asked = standInLogger(answer);
            const ok = await r.copyDiagnostics({ headerLines: ['Desktop app 7.29.0 (page 7.28.1)'], where: 'the reset page' });
            assert.strictEqual(ok, answer);
            assert.deepStrictEqual(asked.lines, ['Desktop app 7.29.0 (page 7.28.1)']);
            assert.deepStrictEqual(asked.copies, [['FROM THE LOGGER\nDesktop app 7.29.0 (page 7.28.1)', { what: 'Diagnostics', where: 'the reset page' }]]);
        }
    } finally { delete global.rwLog; }
});

test('RPTFN-005', "without the logging kit (it didn't load) nothing can be copied — said as not copied (false), never a throw", async () => {
    delete global.rwLog;
    assert.strictEqual(await r.copyDiagnostics({ headerLines: ['x'], where: 'the reset page' }), false);
});

test('RPTFN-006', 'every button names its action — never OK, Yes or No (Law 21)', () => {
    for (const k of ['email', 'github', 'close', 'copyButton', 'reportButton', 'tryAgain']) {
        const w = r.TEXT[k];
        assert.ok(typeof w === 'string' && w.trim(), `TEXT.${k} is empty`);
        assert.ok(!/^(ok|yes|no)$/i.test(w.trim()), `TEXT.${k} is "${w}"`);
    }
});

test('RPTFN-007', "the status bar's Feedback link and the helper name the same issue list (one address, not two)", () => {
    const app = fs.readFileSync(path.join(__dirname, '..', 'readerwrangler.js'), 'utf8');
    const literal = (app.match(/https:\/\/github\.com\/Ron-L\/ReaderWrangler\/issues[^"'`\s]*/g) || []);
    assert.deepStrictEqual(literal, [], `readerwrangler.js still spells the address itself: ${literal.join(', ')} — use RWReport.ISSUES_URL`);
});

done();
