// reportProblem.js — THE "report a problem" helper (7.29.0; TODO 20261111-1104a "When the app can't open…" and 1104b
// "Help → Report a problem…"; Ron, 2026-11-12: both email and GitHub, ONE shared helper).
//
// Three places use it: the "Something went wrong" screen (readerwrangler.html — the app failed to load, so no React),
// the reset page (reset.html — no React either) and Help → Report a problem… in the app (its own <Dialog>, built from
// the words and calls here). So it is a plain script, loaded by both pages right after the logging module, and
// published as window.RWReport.
//
// What it does: copies the diagnostics (the logging kit's rwLog.diagnosticsText, with the caller's build line, through
// the kit's one copy routine rwLog.copyText), then
// offers the choice — Email us (their mail program, to our address, with a subject line; never the diagnostics in the
// body: a mail link cuts long text off) or Report on GitHub (a new issue) — telling them the diagnostics are on the
// clipboard to paste in. A refused clipboard is said plainly, and the choice is still offered (Law 16: never silent).
// The box stays open after a choice: the address and the paste reminder stay in view if no mail program opens.
//
// Tests: test/reportProblem.test.js (RPTFN-), test/ui/test_report_problem.py (RPT-), test/ui/test_emergency.py
// (EMERG-), test/ui/test_reset_page.py (RESETPG-).
(function () {
'use strict';

const EMAIL = 'contact@readerwrangler.com';
const ISSUES_URL = 'https://github.com/Ron-L/ReaderWrangler/issues';   // also the status bar's Feedback link
const NEW_ISSUE_URL = ISSUES_URL + '/new';
const SUBJECT = 'ReaderWrangler problem report';

// The words people see — ONE copy, read by the plain pages' box below and by the app's Report a problem window.
const TEXT = Object.freeze({
    title: 'Report a problem',
    pleaseTell: 'Please tell us what went wrong, so we can fix it.',   // the emergency screen and the reset page
    copyButton: 'Copy diagnostics',
    reportButton: 'Report this problem',
    copying: 'Copying the diagnostics…',
    copied: 'Diagnostics copied — paste them into your message to us.',
    refused: "Diagnostics couldn't be copied — the browser refused the clipboard.",
    tryAgain: 'Try again',
    ask: 'Tell us what happened. How would you like to send it?',
    email: 'Email us',
    github: 'Report on GitHub',
    explain: `Email us opens your mail program, addressed to ${EMAIL}. Report on GitHub opens a new report on GitHub `
        + '(it needs a free GitHub account).',
    close: 'Close',
});

// The email link: our address and a subject (with the build, when known) — nothing else.
function mailtoUrl(build) {
    return `mailto:${EMAIL}?subject=${encodeURIComponent(SUBJECT + (build ? ` (${build})` : ''))}`;
}

// --- the browser half -------------------------------------------------------------------------------------------
const page = typeof window !== 'undefined' ? window : null;
// The logger (logkit/logger.js, loaded before this file) — absent only if it failed to load. Its calls below are written
// out as rwLog.log(…) so the commit check reads each one (tools/message_codes.py; the table of codes).
const hasLog = () => typeof rwLog !== 'undefined' && !!rwLog && typeof rwLog.log === 'function';   // eslint-disable-line no-undef

// Copies the diagnostics — the logger's own report (everything kept), with the caller's lines under its first line —
// through the logging kit's ONE copy routine (rwLog.copyText; 7.29.1, Law 22: this file's own copy is gone). Resolves true
// (copied) or false (refused: the kit logs it, UI-06 — or the kit itself didn't load, so nothing can be copied). Call it
// from the click itself: browsers allow the clipboard only during a person's click. `where` names the place for the log.
function copyDiagnostics({ headerLines, where } = {}) {
    if (!hasLog() || typeof rwLog.copyText !== 'function') return Promise.resolve(false);   // eslint-disable-line no-undef
    return rwLog.copyText(rwLog.diagnosticsText(headerLines || []),   // eslint-disable-line no-undef
        { what: 'Diagnostics', where: where || 'a problem report' });
}

// The three ways out. The email in a new context (as Share by Email's "Open in email app" — the page is never replaced);
// GitHub in a new tab.
function openEmail(build) {
    if (hasLog()) rwLog.log('info', 'SHARE', 'Report a problem: opened an email to us');   // eslint-disable-line no-undef
    page.open(mailtoUrl(build));
}
function openGitHub() {
    if (hasLog()) rwLog.log('info', 'SHARE', 'Report a problem: opened a new report on GitHub');   // eslint-disable-line no-undef
    page.open(NEW_ISSUE_URL, '_blank', 'noopener');
}
function openKnownProblems() {
    if (hasLog()) rwLog.log('info', 'SHARE', 'Opened Known problems (the GitHub issue list)');   // eslint-disable-line no-undef
    page.open(ISSUES_URL, '_blank', 'noopener');
}

// --- the plain pages (the emergency screen, the reset page): no React there, so plain page elements ------------------
const el = (tag, css, text) => { const n = document.createElement(tag); if (css) n.style.cssText = css; if (text != null) n.textContent = text; return n; };
const btn = (label, css, onClick) => { const b = el('button', css, label); b.type = 'button'; b.addEventListener('click', onClick); return b; };
const BTN = 'padding:9px 16px;border-radius:8px;font-size:.9em;font-weight:600;cursor:pointer;font-family:inherit;';
const PRIMARY = BTN + 'background:#2563eb;color:#fff;border:none;';
const SECONDARY = BTN + 'background:var(--bg-surface,#fff);color:var(--text-primary,#334155);border:1px solid var(--border-default,#cbd5e1);';
const LINK = 'background:none;border:none;padding:0;margin-left:6px;color:#2563eb;text-decoration:underline;cursor:pointer;font:inherit;';
const statusLine = (node, state) => {
    node.textContent = state === 'copying' ? TEXT.copying : state === 'copied' ? `✓ ${TEXT.copied}` : `⚠ ${TEXT.refused}`;
    node.style.color = state === 'refused' ? '#b45309' : state === 'copied' ? '#15803d' : 'var(--text-muted,#64748b)';
};

// The Report a problem box for the plain pages: the copy's result (with Try again when refused), the choice, Close.
// Esc, Close and a click on the dimmed background close it (the app's own window does the same through <Dialog>).
function showReportBox(opts, firstCopy) {
    const old = document.getElementById('rwReportBox');
    if (old) old.rwClose();                          // one box at a time — closed properly (its Esc listener too)
    const ov = el('div', 'position:fixed;inset:0;background:rgba(0,0,0,.5);display:flex;align-items:center;'
        + 'justify-content:center;z-index:10002;');
    ov.id = 'rwReportBox';
    const panel = el('div', 'background:var(--bg-surface,#fff);color:var(--text-primary,#1e293b);border-radius:12px;'
        + 'box-shadow:0 20px 60px rgba(0,0,0,.3);padding:22px 26px;max-width:440px;width:90%;text-align:left;'
        + 'font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;font-size:15px;line-height:1.5;');
    panel.setAttribute('role', 'dialog');
    panel.setAttribute('aria-modal', 'true');
    panel.setAttribute('aria-label', TEXT.title);
    const status = el('div', 'font-size:.9em;margin:0 0 12px;');
    status.setAttribute('role', 'status');
    const statusText = el('span');
    status.append(statusText);
    const show = (state) => {
        statusLine(statusText, state);
        const retry = status.querySelector('button');
        if (retry) retry.remove();
        if (state === 'refused') status.append(btn(TEXT.tryAgain, LINK, () => { show('copying'); copyDiagnostics(opts).then(ok => show(ok ? 'copied' : 'refused')); }));
    };
    const close = () => { ov.remove(); document.removeEventListener('keydown', onKey, true); };
    ov.rwClose = close;
    const onKey = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); close(); } };
    const choices = el('div', 'display:flex;gap:8px;margin:0 0 10px;');
    const emailBtn = btn(TEXT.email, PRIMARY + 'flex:1;', () => openEmail(opts.build));
    choices.append(emailBtn, btn(TEXT.github, SECONDARY + 'flex:1;', openGitHub));
    const foot = el('div', 'text-align:right;');
    foot.append(btn(TEXT.close, SECONDARY, close));
    panel.append(el('div', 'font-size:1.1em;font-weight:700;margin-bottom:10px;', TEXT.title), status,
        el('div', 'font-size:.9em;margin:0 0 12px;', TEXT.ask), choices,
        el('div', 'font-size:.8em;color:var(--text-muted,#64748b);margin:0 0 16px;', TEXT.explain), foot);
    ov.append(panel);
    let downOnScrim = false;   // a drag that starts inside the box and ends outside doesn't close it
    ov.addEventListener('mousedown', (e) => { downOnScrim = e.target === ov; });
    ov.addEventListener('click', (e) => { if (e.target === ov && downOnScrim) close(); downOnScrim = false; });
    document.addEventListener('keydown', onKey, true);
    document.body.append(ov);
    show('copying');
    firstCopy.then(ok => { if (ov.isConnected) show(ok ? 'copied' : 'refused'); });
    emailBtn.focus();
}

// The two buttons for a plain page, with a line saying what the copy did: Copy diagnostics, and Report this problem
// (copy, then the box). opts: { lead, headerLines, build, where }.
function addButtons(container, opts) {
    const wrap = el('div', 'margin:0 0 20px;');
    wrap.id = 'rwReportButtons';
    if (opts.lead) wrap.append(el('div', 'font-size:.95em;margin:0 0 10px;color:var(--text-secondary,#475569);', opts.lead));
    const row = el('div', 'display:flex;gap:8px;justify-content:center;flex-wrap:wrap;');
    const status = el('div', 'font-size:.85em;margin-top:8px;min-height:1.3em;');
    status.setAttribute('role', 'status');
    row.append(
        btn(TEXT.copyButton, SECONDARY, () => {
            statusLine(status, 'copying');
            copyDiagnostics(opts).then(ok => statusLine(status, ok ? 'copied' : 'refused'));
        }),
        btn(TEXT.reportButton, SECONDARY, () => { status.textContent = ''; showReportBox(opts, copyDiagnostics(opts)); }));
    wrap.append(row, status);
    container.append(wrap);
    return wrap;
}

const api = Object.freeze({ EMAIL, ISSUES_URL, NEW_ISSUE_URL, TEXT, mailtoUrl, copyDiagnostics, openEmail,
    openGitHub, openKnownProblems, showReportBox, addButtons });
if (typeof window !== 'undefined') window.RWReport = api;   // written out: the name check reads `window.X =` (check-names.js)
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
