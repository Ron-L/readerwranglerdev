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

test('RPTFN-004', "the copied text is the logger's own diagnostics, with the caller's lines (the build) passed through", () => {
    let asked = null;
    const log = { diagnosticsText: (lines) => { asked = lines; return 'FROM THE LOGGER\n' + lines.join('\n'); } };
    const text = r.reportText(log, ['Desktop app 7.29.0 (page 7.28.1)'], { userAgent: 'TestBrowser' });
    assert.deepStrictEqual(asked, ['Desktop app 7.29.0 (page 7.28.1)']);
    assert.strictEqual(text, 'FROM THE LOGGER\nDesktop app 7.29.0 (page 7.28.1)');
});

test('RPTFN-005', "without the logger (it didn't load) the text still has the lines, the browser and says why the log is missing", () => {
    const text = r.reportText(undefined, ['Desktop app didn\'t open (page 7.28.1)', 'Load error: boom'], { userAgent: 'TestBrowser' });
    for (const want of ['ReaderWrangler diagnostics', "Desktop app didn't open (page 7.28.1)", 'Load error: boom',
        'Browser: TestBrowser', "The log couldn't be read"]) assert.ok(text.includes(want), `missing ${JSON.stringify(want)}:\n${text}`);
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
