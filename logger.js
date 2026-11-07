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
    MOVE: 'MOVE', UNDO: 'UNDO', COVER: 'COVER', PREF: 'PREF', PHONE: 'PHONE', UI: 'UI'
});
const TEST_MARK = '-!TEST!';                          // written after the code of a planted test message — defined ONCE
const LOG_STORAGE_KEY = 'readerwrangler-log';
const CODE_RE = /^([A-Z]+)(?:-(\d{2}))?$/;            // 'IMPORT' or 'IMPORT-12'
const CHANNEL_ID_RE = /\b([0-9a-f]{8})-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi;
const EXTENSION_SCRIPT_RE = /^(chrome|moz|safari-web|ms-browser)-extension:\/\//;
const CONSOLE_METHOD = { debug: 'debug', info: 'info', warning: 'warn', error: 'error', critical: 'error' };
const rank = (level) => LOG_LEVELS.indexOf(level);

// Channel IDs keep their first 8 characters (enough to tell channels apart); a secret becomes "[passphrase]".
function scrub(text, secrets) {
    let s = String(text).replace(CHANNEL_ID_RE, '$1…');
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

    let entries = (() => {
        try {
            const saved = storage && storage.getItem(key);
            const list = saved ? JSON.parse(saved) : [];
            return Array.isArray(list) ? list.slice(-cap) : [];
        } catch (e) { return []; }
    })();
    let saveScheduled = false;

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

    const record = (level, code, text, data, isTest) => {
        let secrets = [];
        try { secrets = getSecrets() || []; } catch (e) { /* none */ }
        const entry = { time: now(), level, code, area: code.split('-')[0], text: scrub(asText(text), secrets), count: 1 };
        if (data != null) entry.data = scrubData(data, secrets);
        if (isTest) entry.test = true;
        try {
            const write = con[CONSOLE_METHOD[level]] || con.log;
            if (entry.data !== undefined) write.call(con, format(entry), entry.data); else write.call(con, format(entry));
        } catch (e) { /* no console */ }
        if (rank(level) < keepRank) return;
        const prev = entries[entries.length - 1];
        if (prev && prev.level === level && prev.code === code && prev.text === entry.text && !!prev.test === !!isTest) {
            prev.count = (prev.count || 1) + 1;   // repeats counted, not stored again
            prev.time = entry.time;
        } else {
            entries.push(entry);
            if (entries.length > cap) entries.splice(0, entries.length - cap);
        }
        scheduleSave();
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
            record(lv, cd || '?', text, data, !!(options && options.test === true));
            // (through log() itself, like every message — so the code scan sees UI-02; a well-formed call, so no loop)
            if (problems.length) log('error', 'UI-02', `A logging call was malformed: ${problems.join('; ')}`);
        } catch (e) { /* logging must never break the app */ }
    };

    return {
        log,
        format,
        entries: () => entries.map(e => ({ ...e })),
        flush: save,
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
    const rwLog = createLogger({ console: window.console, storage: pageStorage, secrets: relaySecrets });
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
    module.exports = { createLogger, scrub, LOG_LEVELS, LOG_AREAS, TEST_MARK, LOG_STORAGE_KEY };
}
})();
