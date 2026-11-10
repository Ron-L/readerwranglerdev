// logger.js — THE logging module (7.26.0; design: docs/design/LOGGING.md §1, §2, §2b, §6 — Ron + Claude, 2026-11-05/07).
//
// One call for every message:   rwLog.log(level, code, text, data, { test: true })
//   level — 'debug' | 'info' | 'warning' | 'error' | 'critical', written at the call, where the message is written
//   code  — 'IMPORT' (the bare area: a general line) or 'IMPORT-12' (one specific message — required for warning and
//           above, each used at ONE call: tools/message_codes.py checks it at every commit and writes the support table,
//           docs/design/MESSAGE-CODES.md, from the calls themselves)
//   data  — optional details; `test: true` marks a message a test planted (shown to people as IMPORT-12-!TEST!)
//
// The module is agnostic about the messages: it knows only the five levels and the 13 areas. It keeps a log on the
// device (info and up, the last 500, repeats counted, saved in batches), scrubs Channel IDs and the passphrase out of
// everything, sends each message to the console method of its level, and logs uncaught errors and failed promises.
// It never throws — logging must never break the app. Its own codes: UI-02 (a malformed logging call), UI-03 (an
// uncaught error), UI-04 (a failed promise nobody handled). Tests: test/logger.test.js (LOG-001…).
//
// Wrapped in a function: a classic script's top-level names are shared by the whole page, and a second script declaring
// the same name (`rank`, `scrub`…) would stop the page loading. Only window.rwLog (and Node's exports) leave this file.
(function () {
'use strict';

const LOG_LEVELS = ['debug', 'info', 'warning', 'error', 'critical'];
// The areas (LOGGING.md §2). JavaScript has no enums; a frozen object is the standard stand-in.
const LOG_AREAS = Object.freeze({
    BOOT: 'BOOT', SYNC: 'SYNC', IMPORT: 'IMPORT', BACKUP: 'BACKUP', STORE: 'STORE', INTEG: 'INTEG', FIELD: 'FIELD',
    MOVE: 'MOVE', UNDO: 'UNDO', COVER: 'COVER', PREF: 'PREF', PHONE: 'PHONE', UI: 'UI',
    // 2026-11-09 (Ron) - for the toasts none of the 13 fit: folders, Book Lists, Searches and tags as things (ORG); a
    // book's details (EDIT); Auto-Organize (AUTO); copying titles, authors, links, the email text (SHARE)
    ORG: 'ORG', EDIT: 'EDIT', AUTO: 'AUTO', SHARE: 'SHARE'
});
const TEST_MARK = '-!TEST!';                          // written after the code of a planted test message — defined ONCE
const LOG_STORAGE_KEY = 'readerwrangler-log';
const LOG_LEVEL_KEY = 'readerwrangler-log-level';     // the OLD remembered ?log= level (before 2026-11-09) — read once, then removed
// The two switches (LOGGING.md §5 step 5.1 — Ron, 2026-11-09): remembered in this browser as 'on'; absent = off.
const LOG_SWITCH_KEYS = Object.freeze({ errorBanner: 'readerwrangler-log-banner', logDetail: 'readerwrangler-log-detail' });
const CODE_RE = /^([A-Z]+)(?:-(\d{2}))?$/;            // 'IMPORT' or 'IMPORT-12'
const CHANNEL_ID_RE = /\b([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const EXTENSION_SCRIPT_RE = /^(chrome|moz|safari-web|ms-browser)-extension:\/\//;
const CONSOLE_METHOD = { debug: 'debug', info: 'info', warning: 'warn', error: 'error', critical: 'error' };
const rank = (level) => LOG_LEVELS.indexOf(level);

// THE short form of a Channel ID — first 8 … last 4, as Relay Setup shows it — used by the log's cleaner AND Relay Setup
// (rwLog.shortChannelId), so the two can never show one channel two ways, and two keys that share their first 8 still
// read differently (Ron, 2026-11-09: telling old credentials from new matters most when they've just changed).
function shortChannelId(id) {
    const s = id == null ? '' : String(id);
    return s.length > 12 ? `${s.slice(0, 8)}...${s.slice(-4)}` : s;
}

// Channel IDs become their short form (above); a secret (the passphrase) becomes "[passphrase]", none of it shown.
function scrub(text, secrets) {
    let s = String(text).replace(CHANNEL_ID_RE, (id) => shortChannelId(id));
    for (const secret of secrets || []) {
        if (typeof secret === 'string' && secret.length >= 4) s = s.split(secret).join('[passphrase]');
    }
    return s;
}
function scrubData(data, secrets) {
    try { return JSON.parse(scrub(JSON.stringify(data), secrets)); } catch (e) { return scrub(String(data), secrets); }
}
function asText(value) {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch (e) { return String(value); }
}

function createLogger(opts = {}) {
    const con = opts.console || console;
    const storage = opts.storage || null;
    const key = opts.storageKey || LOG_STORAGE_KEY;
    const now = opts.now || (() => Date.now());
    const schedule = opts.schedule || ((fn, ms) => setTimeout(fn, ms));
    const getSecrets = opts.secrets || (() => []);
    const cap = opts.cap || 500;
    const keepRank = rank(opts.keepLevel || 'info');
    const saveDelayMs = opts.saveDelayMs != null ? opts.saveDelayMs : 3000;
    const onAlert = opts.onAlert || null;      // (kind 'banner' | 'critical', entry) — the page draws it
    // The two switches (LOGGING.md §5 step 5.1 — Ron, 2026-11-09; they replace the ladder of levels): errorBanner — an
    // error raises the banner; logDetail — debug lines are recorded too. Independent (all four combinations make sense);
    // both off for an ordinary user. Set in the Diagnostics window, on the address (?errorBanner= / ?logDetail=) or the
    // console (rwLog.setSwitch), and remembered in this browser.
    const readSwitch = (name) => { try { return !!storage && storage.getItem(LOG_SWITCH_KEYS[name]) === 'on'; } catch (e) { return false; } };
    const writeSwitch = (name, on) => {
        try {
            if (!storage) return;
            if (on) storage.setItem(LOG_SWITCH_KEYS[name], 'on');
            else if (storage.removeItem) storage.removeItem(LOG_SWITCH_KEYS[name]);
            else storage.setItem(LOG_SWITCH_KEYS[name], '');
        } catch (e) { /* not remembered: still applies to this page */ }
    };
    const switches = { errorBanner: readSwitch('errorBanner'), logDetail: readSwitch('logDetail') };
    // the old ladder's remembered level becomes the switches once (debug: both on; any other level: the banner)
    try {
        const old = storage && storage.getItem(LOG_LEVEL_KEY);
        if (old) {
            if (LOG_LEVELS.includes(old)) {
                switches.errorBanner = true; writeSwitch('errorBanner', true);
                if (old === 'debug') { switches.logDetail = true; writeSwitch('logDetail', true); }
            }
            if (storage.removeItem) storage.removeItem(LOG_LEVEL_KEY); else storage.setItem(LOG_LEVEL_KEY, '');
        }
    } catch (e) { /* storage refused: nothing to move */ }
    const recorded = (level) => rank(level) >= (switches.logDetail ? rank('debug') : keepRank);

    let entries = (() => {
        try {
            const saved = storage && storage.getItem(key);
            const list = saved ? JSON.parse(saved) : [];
            return Array.isArray(list) ? list.slice(-cap) : [];
        } catch (e) { return []; }
    })();
    let saveScheduled = false;
    let toaster = null;    // the app's toast routine, handed over at startup (setToaster) — the logger never depends on the app
    // The Diagnostics window listens (subscribe) so it updates live; a listener's failure never breaks logging.
    const listeners = new Set();
    const notify = () => { for (const fn of listeners) { try { fn(); } catch (e) { /* the window's problem */ } } };

    const save = () => {
        saveScheduled = false;
        try { if (storage) storage.setItem(key, JSON.stringify(entries)); } catch (e) { /* full or refused: kept in memory */ }
    };
    const scheduleSave = () => {
        if (saveScheduled) return;
        saveScheduled = true;
        try { schedule(save, saveDelayMs); } catch (e) { saveScheduled = false; }
    };

    const format = (e) => `${e.level} · ${e.code}${e.test ? TEST_MARK : ''} · ${e.text}${e.count > 1 ? ` (×${e.count})` : ''}`;

    const record = (level, code, text, data, isTest, toastOptions) => {
        let secrets = [];
        try { secrets = getSecrets() || []; } catch (e) { /* none */ }
        const entry = { time: now(), level, code, area: code.split('-')[0], text: scrub(asText(text), secrets), count: 1 };
        if (data != null) entry.data = scrubData(data, secrets);
        if (isTest) entry.test = true;
        // a message's own advice for the critical box, in place of the usual words (BOOT-01: "don't save a backup now")
        if (toastOptions && typeof toastOptions.advice === 'string') entry.advice = toastOptions.advice;
        if (recorded(level)) {   // the console prints exactly what is recorded (its own level filter does the rest)
            try {
                const write = con[CONSOLE_METHOD[level]] || con.log;
                if (entry.data !== undefined) write.call(con, format(entry), entry.data); else write.call(con, format(entry));
            } catch (e) { /* no console */ }
        }
        // the alerts: critical for EVERY user; an error raises the banner when that switch is on
        if (onAlert && (level === 'critical' || (level === 'error' && switches.errorBanner))) {
            try { onAlert(level === 'critical' ? 'critical' : 'banner', entry); } catch (e) { /* drawing must not break logging */ }
        }
        // the user: only when the call says { toast } — a critical message shows its box instead (LOGGING.md §6)
        if (toastOptions && toastOptions.toast && level !== 'critical' && toaster) {
            const where = typeof toastOptions.toast === 'object' ? toastOptions.toast : {};
            try { toaster(entry.text, { level, x: where.x, y: where.y, hint: !!toastOptions.hint }); } catch (e) { /* the app's problem */ }
        }
        if (!recorded(level)) return;   // debug is recorded only with extra detail on (logDetail)
        const prev = entries[entries.length - 1];
        if (prev && prev.level === level && prev.code === code && prev.text === entry.text && !!prev.test === !!isTest) {
            prev.count = (prev.count || 1) + 1;   // repeats counted, not stored again
            prev.time = entry.time;
        } else {
            entries.push(entry);
            if (entries.length > cap) entries.splice(0, entries.length - cap);
        }
        scheduleSave();
        notify();
    };

    // The one call. Checks the call's shape and reports a slip as UI-02 — the message itself is always kept.
    const log = (level, code, text, data, options) => {
        try {
            const problems = [];
            let lv = String(level);
            if (!LOG_LEVELS.includes(lv)) { problems.push(`unknown level "${level}"`); lv = 'error'; }
            const cd = typeof code === 'string' ? code : '';
            const m = CODE_RE.exec(cd);
            if (!m) problems.push(`badly shaped code "${code}" — use AREA or AREA-NN`);
            else if (!LOG_AREAS[m[1]]) problems.push(`unknown area "${m[1]}"`);
            else if (rank(lv) >= rank('warning') && !m[2]) problems.push(`a ${lv} needs a numbered code (${m[1]}-NN)`);
            record(lv, cd || '?', text, data, !!(options && options.test === true), options);
            // (through log() itself, like every message — so the code scan sees UI-02; a well-formed call, so no loop)
            if (problems.length) log('error', 'UI-02', `A logging call was malformed: ${problems.join('; ')}`);
        } catch (e) { /* logging must never break the app */ }
    };

    // One switch on or off, remembered; an unknown name changes nothing.
    const setSwitch = (name, on) => {
        if (!Object.prototype.hasOwnProperty.call(LOG_SWITCH_KEYS, name)) return;
        switches[name] = !!on;
        writeSwitch(name, !!on);
    };

    return {
        log,
        format,
        TEST_MARK,
        levels: LOG_LEVELS,   // the order, lowest first — the Diagnostics window's level filter reads it (never a copy)
        entries: () => entries.map(e => ({ ...e })),
        flush: save,
        // The Diagnostics window (LOGGING.md §5 step 5.3): told of every kept entry; returns the unsubscribe.
        subscribe: (fn) => { if (typeof fn === 'function') listeners.add(fn); return () => listeners.delete(fn); },
        // Clear (like DevTools): the kept log empties and is saved at once, so a reload can't bring it back.
        clear: () => { entries = []; save(); notify(); },
        // Copy diagnostics: a header (the time, the caller's lines — the app's build —, the browser, the switches), then
        // EVERY kept entry, oldest first, each entry's details on the line below it. Already cleaned (scrub) when recorded.
        diagnosticsText: (headerLines) => {
            const browser = typeof navigator !== 'undefined' && navigator.userAgent ? navigator.userAgent : 'unknown';
            const lines = [`ReaderWrangler diagnostics — ${new Date(now()).toISOString()}`, ...(headerLines || []),
                `Browser: ${browser}`,
                `Switches: error banner ${switches.errorBanner ? 'on' : 'off'}, extra detail ${switches.logDetail ? 'on' : 'off'}`,
                `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} kept`, ''];
            for (const e of entries) {
                lines.push(`${new Date(e.time).toISOString()}  ${format(e)}`);
                if (e.data !== undefined) { try { lines.push(`    ${JSON.stringify(e.data)}`); } catch (x) { lines.push('    (details not shown)'); } }
            }
            return lines.join('\n');
        },
        shortChannelId,
        switches: () => ({ ...switches }),
        setSwitch,
        // The app hands over its toast routine: fn(text, { level, x, y, hint }). Until then (or if the app has crashed) a
        // { toast } message still reaches the log and the console.
        setToaster: (fn) => { toaster = typeof fn === 'function' ? fn : null; },
        // ?errorBanner=on|off and ?logDetail=on|off on the page's address (the ?contributor= pattern): applied, remembered,
        // and taken out of the address (so they aren't bookmarked or shared). Returns the address's remaining query ('' if
        // none), or null if neither was there (leave the address alone). An unknown value changes nothing but is removed.
        applyAddress: (search) => {
            const params = new URLSearchParams(search || '');
            const named = Object.keys(LOG_SWITCH_KEYS).filter(n => params.has(n));
            if (named.length === 0) return null;
            for (const n of named) {
                const v = params.get(n);
                if (v === 'on' || v === 'off') setSwitch(n, v === 'on');
                params.delete(n);
            }
            const rest = params.toString();
            return rest ? '?' + rest : '';
        },
        // 2026-11-09 (Ron, option 1) - A dialog logs what it showed, at info, in the area its CALLER named — the one place a
        // code isn't written literally, so the commit check verifies each dialog call's area instead (LOGGING.md §6), and
        // this checks it again when it runs. A mistyped area is UI-05; the dialog is still logged (as UI).
        dialog: (area, text) => {
            try {
                const known = typeof area === 'string' && LOG_AREAS[area] ? area : null;
                if (!known) log('error', 'UI-05', `A dialog named an unknown area "${area}" (a coding slip)`);
                record('info', known || 'UI', text, null, false, null);
            } catch (e) { /* logging must never break the app */ }
        },
        // A page-load entry: the build, and whether the browser had discarded the tab (LOGGING.md §1).
        pageLoad: ({ build, discarded } = {}) => log('info', 'BOOT',
            `Page loaded — build ${build || 'unknown'}${discarded ? '; the browser had discarded this tab and reloaded it' : ''}`),
        // Uncaught errors and failed promises (UI-03 / UI-04). Everything is logged — a crash inside React or another
        // library we load included — except an error whose source is a browser extension's script.
        installGlobalHandlers: (target) => {
            target.addEventListener('error', (ev) => {
                const file = (ev && ev.filename) || '';
                if (EXTENSION_SCRIPT_RE.test(file)) return;
                log('error', 'UI-03', `Uncaught error: ${(ev && ev.message) || 'unknown'}${file ? ` (${file.split('/').pop()}:${ev.lineno || '?'})` : ''}`);
            });
            target.addEventListener('unhandledrejection', (ev) => {
                const r = ev && ev.reason;
                log('error', 'UI-04', `A failed promise nobody handled: ${(r && r.message) || asText(r)}`);
            });
        },
    };
}

// Browser: one logger for the page, as window.rwLog. It reads the Cloud Sync passphrase only to scrub it out.
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const relaySecrets = () => {
        try { const r = JSON.parse(window.localStorage.getItem('readerwrangler-relay') || 'null'); return r && r.passphrase ? [r.passphrase] : []; }
        catch (e) { return []; }
    };
    let pageStorage = null;
    try { pageStorage = window.localStorage; } catch (e) { /* storage blocked: the log lives in memory */ }

    // The two alerts (wording: Ron, 2026-11-07), drawn in plain page elements — not React — so they still work if the app
    // has crashed. Neither blocks: the critical box says "save a backup now: File → Save Backup", so the menu must stay
    // reachable. Tests: test/ui/test_logging.py (LOGUI-001…).
    const BANNER_CSS = 'position:fixed;top:34px;left:0;right:0;z-index:2147483000;display:flex;align-items:center;gap:10px;'
        + 'padding:6px 12px;background:#b91c1c;color:#fff;font:13px/1.4 -apple-system,"Segoe UI",Roboto,sans-serif;'
        + 'box-shadow:0 2px 6px rgba(0,0,0,.3)';
    const BANNER_BTN = 'background:#fff;color:#b91c1c;border:0;border-radius:4px;padding:3px 10px;font:inherit;font-weight:600;'
        + 'cursor:pointer;flex-shrink:0';
    const BANNER_LINK = 'background:none;border:0;color:#fff;text-decoration:underline;font:inherit;cursor:pointer;flex-shrink:0';
    const CRITICAL_CSS = 'position:fixed;top:80px;left:50%;transform:translateX(-50%);z-index:2147483001;'
        + 'width:min(560px,calc(100vw - 32px));box-sizing:border-box;background:var(--bg-surface,#fff);'
        + 'color:var(--text-primary,#1e293b);border:2px solid #b91c1c;border-radius:10px;box-shadow:0 10px 30px rgba(0,0,0,.3);'
        + 'padding:16px 18px;font:14px/1.5 -apple-system,"Segoe UI",Roboto,sans-serif';
    const CRITICAL_BTN = 'background:var(--bg-elevated,#f1f5f9);color:inherit;border:1px solid var(--border-strong,#cbd5e1);'
        + 'border-radius:6px;padding:6px 14px;margin-right:8px;font:inherit;cursor:pointer';
    const CRITICAL_OK = 'background:#b91c1c;color:#fff;border:0;border-radius:6px;padding:6px 18px;font:inherit;font-weight:600;cursor:pointer';
    const shown = { banner: [], critical: [] };     // the entries each alert has shown since it appeared
    const whenBody = (fn) => { if (document.body) fn(); else document.addEventListener('DOMContentLoaded', fn, { once: true }); };
    const el = (tag, css, text) => { const n = document.createElement(tag); if (css) n.style.cssText = css; if (text != null) n.textContent = text; return n; };
    const button = (label, css, onClick) => { const b = el('button', css, label); b.type = 'button'; b.addEventListener('click', onClick); return b; };
    const codeOf = (e) => `${e.code}${e.test ? TEST_MARK : ''}`;
    const report = (list) => [
        `ReaderWrangler diagnostics — build ${typeof APP_VERSION !== 'undefined' ? APP_VERSION : 'unknown'} — ${new Date().toISOString()}`,
        ...list.map(e => `${new Date(e.time).toISOString()}  ${rwLog.format(e)}`),
        '', 'Recent log:', ...rwLog.entries().slice(-50).map(e => `${new Date(e.time).toISOString()}  ${rwLog.format(e)}`)
    ].join('\n');
    const copyInto = (btn, list, label) => {
        try {
            navigator.clipboard.writeText(report(list)).then(() => {
                btn.textContent = 'Copied'; setTimeout(() => { btn.textContent = label; }, 1500);
            }, () => {});
        } catch (e) { /* no clipboard */ }
    };
    const showBanner = (entry) => whenBody(() => {
        shown.banner.push(entry);
        let bar = document.getElementById('rw-log-banner');
        if (!bar) { bar = el('div', BANNER_CSS); bar.id = 'rw-log-banner'; bar.setAttribute('role', 'alert'); document.body.appendChild(bar); }
        bar.textContent = '';
        const msg = el('span', 'flex:1;min-width:0;overflow-wrap:anywhere', '🐞 ');
        msg.appendChild(el('strong', '', `${entry.level} · ${codeOf(entry)}`));
        msg.appendChild(document.createTextNode(` · ${entry.text}`));
        if (shown.banner.length > 1) msg.appendChild(el('em', 'margin-left:8px;opacity:.85', `(+${shown.banner.length - 1} more)`));
        const close = () => { shown.banner = []; bar.remove(); };
        const copyBtn = button('Copy', BANNER_BTN, () => copyInto(copyBtn, shown.banner, 'Copy'));
        bar.append(msg, copyBtn, button('Dismiss', BANNER_BTN, close),
            button('Turn off this banner', BANNER_LINK, () => { rwLog.setSwitch('errorBanner', false); close(); }));
        debugger; // eslint-disable-line no-debugger -- stops here only when DevTools is open (TODO decision 3)
    });
    const showCritical = (entry) => whenBody(() => {
        shown.critical.push(entry);
        let box = document.getElementById('rw-log-critical');
        if (!box) { box = el('div', CRITICAL_CSS); box.id = 'rw-log-critical'; box.setAttribute('role', 'alert'); document.body.appendChild(box); }
        box.textContent = '';
        // a message's own advice outranks the usual words — kept while it's among those shown (a later message without
        // advice must not bring "save a backup now" back over a "don't")
        const advised = shown.critical.slice().reverse().find(e => e.advice);
        box.append(
            el('div', 'font-weight:700;font-size:15px;margin-bottom:6px', 'ReaderWrangler hit a problem that may affect your library.'),
            el('div', 'margin-bottom:8px', `${entry.text} (code ${codeOf(entry)})`),
            el('div', 'margin-bottom:12px;color:var(--text-secondary,#475569)', advised ? advised.advice
                : 'To be safe, save a backup now: File → Save Backup. If ReaderWrangler stops responding, reload the page. '
                + 'If this keeps happening, press Copy details and send it to us through Feedback at the bottom of the window.'));
        if (shown.critical.length > 1) box.append(el('div', 'margin-bottom:8px;font-style:italic', `and ${shown.critical.length - 1} more`));
        const row = el('div', 'text-align:right');
        const copyBtn = button('Copy details', CRITICAL_BTN, () => copyInto(copyBtn, shown.critical, 'Copy details'));
        row.append(copyBtn, button('OK', CRITICAL_OK, () => { shown.critical = []; box.remove(); }));
        box.append(row);
    });

    const rwLog = createLogger({ console: window.console, storage: pageStorage, secrets: relaySecrets,
        onAlert: (kind, entry) => (kind === 'critical' ? showCritical(entry) : showBanner(entry)) });
    // ?errorBanner= / ?logDetail= on the address: applied, remembered, and removed from the address bar
    const remaining = rwLog.applyAddress(window.location.search);
    if (remaining !== null) {
        try { window.history.replaceState(window.history.state, '', window.location.pathname + remaining + window.location.hash); }
        catch (e) { /* the address stays; the choice still applies */ }
    }
    rwLog.installGlobalHandlers(window);
    window.addEventListener('pagehide', () => rwLog.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') rwLog.flush(); });
    // This file loads first (to catch errors from everything after it), before the page defines APP_VERSION — so the
    // page-load entry waits until the page has been read.
    const recordPageLoad = () => rwLog.pageLoad({
        build: typeof APP_VERSION !== 'undefined' ? APP_VERSION : undefined, discarded: !!document.wasDiscarded });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', recordPageLoad, { once: true });
    else recordPageLoad();
    window.rwLog = rwLog;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createLogger, scrub, shortChannelId, LOG_LEVELS, LOG_AREAS, TEST_MARK, LOG_STORAGE_KEY, LOG_LEVEL_KEY, LOG_SWITCH_KEYS };
}
})();
