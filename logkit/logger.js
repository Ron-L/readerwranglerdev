// logkit/logger.js — a logging module for a web page (written for ReaderWrangler 7.26.0, made its own module in 7.28.0;
// design: docs/design/LOGGING.md, the README beside this file — Ron + Claude, 2026-11-05/07/11).
//
// One call for every message:   log.log(level, code, text, data, { test, toast, hint, advice })
//   level — 'debug' | 'info' | 'warning' | 'error' | 'critical', written at the call, where the message is written
//   code  — 'IMPORT' (the bare area: a general line) or 'IMPORT-12' (one specific message — required for warning and
//           above, each used at ONE call: the kit's commit check, check_messages.py beside this file — called by the
//           host's own checker — checks it and writes the support table)
//   data  — optional details; `test: true` marks a message a test planted (shown to people as IMPORT-12-!TEST!)
//
// The module knows nothing of the app that uses it. Everything the app decides — its areas, where the log is kept, the
// switches' storage names, what to clean out (secrets, and IDs to shorten), the product's name, the critical box's
// words, the build — comes from the host's SETTINGS (in ReaderWrangler: logkit-settings.js, loaded just before this file,
// as window.LOGKIT_SETTINGS). The host's areas must include UI: the module's own codes are UI-02 (a malformed logging
// call), UI-03 (an uncaught error), UI-04 (a failed promise nobody handled), UI-05 (a dialog naming an unknown area),
// UI-06 (a copy the clipboard refused — copyText, below: the one copy routine, for the kit and the app that uses it).
//
// It keeps a log on the device (info and up, the last 500, repeats counted, saved in batches), cleans every message,
// sends each to the console method of its level, logs uncaught errors and failed promises, and draws two alerts in plain
// page elements (they must work when the app has crashed). It never throws — logging must never break the app.
// Tests: test/logger.test.js (LOG-001…), test/ui/test_logging.py.
//
// Wrapped in a function: a classic script's top-level names are shared by the whole page, and a second script declaring
// the same name (`rank`, `scrub`…) would stop the page loading. Only the logger's global (settings.globalName) and
// Node's exports leave this file.
(function () {
'use strict';

const LOG_LEVELS = ['debug', 'info', 'warning', 'error', 'critical'];
const TEST_MARK = '-!TEST!';                          // written after the code of a planted test message — defined ONCE
const CODE_RE = /^([A-Z]+)(?:-(\d{2}))?$/;            // 'IMPORT' or 'IMPORT-12'
const EXTENSION_SCRIPT_RE = /^(chrome|moz|safari-web|ms-browser)-extension:\/\//;
const CONSOLE_METHOD = { debug: 'debug', info: 'info', warning: 'warn', error: 'error', critical: 'error' };
const rank = (level) => LOG_LEVELS.indexOf(level);

// The cleaner: IDs matching the host's idPattern become the host's short form (shortId); each secret (found by its exact
// value — the host's secrets()) becomes the host's secretLabel, "[hidden]" if it names none, none of it shown. (In
// ReaderWrangler: Channel IDs, first 8 … last 4; the Cloud Sync passphrase, shown as "[passphrase]".)
function scrub(text, secrets, settings) {
    let s = String(text);
    if (settings && settings.idPattern && typeof settings.shortId === 'function') {
        s = s.replace(settings.idPattern, (id) => settings.shortId(id));
    }
    const label = (settings && typeof settings.secretLabel === 'string') ? settings.secretLabel : '[hidden]';
    for (const secret of secrets || []) {
        if (typeof secret === 'string' && secret.length >= 4) s = s.split(secret).join(label);
    }
    return s;
}
function scrubData(data, secrets, settings) {
    try { return JSON.parse(scrub(JSON.stringify(data), secrets, settings)); } catch (e) { return scrub(String(data), secrets, settings); }
}
function asText(value) {
    if (typeof value === 'string') return value;
    try { return JSON.stringify(value); } catch (e) { return String(value); }
}

// opts: the host's settings (areas, storageKey, oldLevelKey, switchKeys, idPattern, shortId, product, extraApi) plus the
// environment (console, storage, now, schedule, secrets, cap, keepLevel, saveDelayMs, onAlert, clipboard).
function createLogger(opts = {}) {
    const AREAS = opts.areas || { UI: 'UI' };            // the host's areas (must include UI — the module's own codes)
    const SWITCH_KEYS = opts.switchKeys || { errorBanner: 'logkit-banner', logDetail: 'logkit-detail' };
    const OLD_LEVEL_KEY = opts.oldLevelKey || null;      // a host's old single "level" setting, moved to the switches once
    const product = opts.product || 'Diagnostics';
    const con = opts.console || console;
    const storage = opts.storage || null;
    const key = opts.storageKey || 'logkit-log';
    const now = opts.now || (() => Date.now());
    const schedule = opts.schedule || ((fn, ms) => setTimeout(fn, ms));
    const getSecrets = opts.secrets || (() => []);
    const cap = opts.cap || 500;
    const keepRank = rank(opts.keepLevel || 'info');
    const saveDelayMs = opts.saveDelayMs != null ? opts.saveDelayMs : 3000;
    const onAlert = opts.onAlert || null;      // (kind 'banner' | 'critical', entry) — the page draws it
    // the page's clipboard, asked at each copy (absent on an insecure address); tests hand in a stand-in
    const getClipboard = opts.clipboard || (() => (typeof navigator !== 'undefined' ? navigator.clipboard : undefined));
    // The two switches (LOGGING.md §5 step 5.1 — Ron, 2026-11-09; they replace the ladder of levels): errorBanner — an
    // error raises the banner; logDetail — debug lines are recorded too. Independent (all four combinations make sense);
    // both off for an ordinary user. Set in the Diagnostics window, on the address (?errorBanner= / ?logDetail=) or the
    // console (rwLog.setSwitch), and remembered in this browser.
    const readSwitch = (name) => { try { return !!storage && storage.getItem(SWITCH_KEYS[name]) === 'on'; } catch (e) { return false; } };
    const writeSwitch = (name, on) => {
        try {
            if (!storage) return;
            if (on) storage.setItem(SWITCH_KEYS[name], 'on');
            else if (storage.removeItem) storage.removeItem(SWITCH_KEYS[name]);
            else storage.setItem(SWITCH_KEYS[name], '');
        } catch (e) { /* not remembered: still applies to this page */ }
    };
    const switches = { errorBanner: readSwitch('errorBanner'), logDetail: readSwitch('logDetail') };
    // the old ladder's remembered level becomes the switches once (debug: both on; any other level: the banner)
    try {
        const old = OLD_LEVEL_KEY && storage && storage.getItem(OLD_LEVEL_KEY);
        if (old) {
            if (LOG_LEVELS.includes(old)) {
                switches.errorBanner = true; writeSwitch('errorBanner', true);
                if (old === 'debug') { switches.logDetail = true; writeSwitch('logDetail', true); }
            }
            if (storage.removeItem) storage.removeItem(OLD_LEVEL_KEY); else storage.setItem(OLD_LEVEL_KEY, '');
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
        const entry = { time: now(), level, code, area: code.split('-')[0], text: scrub(asText(text), secrets, opts), count: 1 };
        if (data != null) entry.data = scrubData(data, secrets, opts);
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
            else if (!AREAS[m[1]]) problems.push(`unknown area "${m[1]}"`);
            else if (rank(lv) >= rank('warning') && !m[2]) problems.push(`a ${lv} needs a numbered code (${m[1]}-NN)`);
            record(lv, cd || '?', text, data, !!(options && options.test === true), options);
            // (through log() itself, like every message — so the code scan sees UI-02; a well-formed call, so no loop)
            if (problems.length) log('error', 'UI-02', `A logging call was malformed: ${problems.join('; ')}`);
        } catch (e) { /* logging must never break the app */ }
    };

    // 7.29.1 (TODO 20261112-1755 "Copy buttons tell the truth"; Ron, 2026-11-13: ONE copy routine in the whole app, the
    // kit's — Law 22) - THE copy: copies `text` and says truthfully what happened. Resolves true only when the clipboard
    // took the text; false when it refused — and a page with NO clipboard (an insecure address) counts as refused. Never
    // rejects, never throws. Both outcomes are logged HERE, the one place: "<what> copied (<where>)" at info, or UI-06
    // with the browser's reason in its details. `toast` shows that line to the person too; `next` follows a copy's line
    // ("— paste them into your message to us"). Call it from the click itself: browsers allow the clipboard only then.
    const copyText = (text, { what = 'Text', where, toast, next } = {}) => {
        const place = where ? ` (${where})` : '';
        let attempt;
        try {
            const clip = getClipboard();
            attempt = clip && typeof clip.writeText === 'function' ? clip.writeText(String(text))
                : Promise.reject(new Error('this page has no clipboard (an insecure address?)'));
        } catch (e) { attempt = Promise.reject(e); }
        return Promise.resolve(attempt).then(
            () => { log('info', 'UI', `${what} copied${place}${next ? ` — ${next}` : ''}`, null, { toast }); return true; },
            (e) => {
                log('warning', 'UI-06', `${what} couldn't be copied${place} — the browser refused the clipboard`,
                    { reason: String((e && e.message) || e) }, { toast });
                return false;
            });
    };

    // One switch on or off, remembered; an unknown name changes nothing.
    const setSwitch = (name, on) => {
        if (!Object.prototype.hasOwnProperty.call(SWITCH_KEYS, name)) return;
        switches[name] = !!on;
        writeSwitch(name, !!on);
    };

    const api = {
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
            const lines = [`${product} diagnostics — ${new Date(now()).toISOString()}`, ...(headerLines || []),
                `Browser: ${browser}`,
                `Switches: error banner ${switches.errorBanner ? 'on' : 'off'}, extra detail ${switches.logDetail ? 'on' : 'off'}`,
                `${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} kept`, ''];
            for (const e of entries) {
                lines.push(`${new Date(e.time).toISOString()}  ${format(e)}`);
                if (e.data !== undefined) { try { lines.push(`    ${JSON.stringify(e.data)}`); } catch (x) { lines.push('    (details not shown)'); } }
            }
            return lines.join('\n');
        },
        switches: () => ({ ...switches }),
        setSwitch,
        copyText,
        // The app hands over its toast routine: fn(text, { level, x, y, hint }). Until then (or if the app has crashed) a
        // { toast } message still reaches the log and the console.
        setToaster: (fn) => { toaster = typeof fn === 'function' ? fn : null; },
        // ?errorBanner=on|off and ?logDetail=on|off on the page's address (the ?contributor= pattern): applied, remembered,
        // and taken out of the address (so they aren't bookmarked or shared). Returns the address's remaining query ('' if
        // none), or null if neither was there (leave the address alone). An unknown value changes nothing but is removed.
        applyAddress: (search) => {
            const params = new URLSearchParams(search || '');
            const named = Object.keys(SWITCH_KEYS).filter(n => params.has(n));
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
                const known = typeof area === 'string' && AREAS[area] ? area : null;
                if (!known) log('error', 'UI-05', `A dialog named an unknown area "${area}" (a coding slip)`);
                record('info', known || 'UI', text, null, false, null);
            } catch (e) { /* logging must never break the app */ }
        },
        // A page-load entry: the build, and whether the browser had discarded the tab (LOGGING.md §1) — in the host's
        // start-up area (RW: BOOT), UI if it names none or an unknown one. (Through record(), like dialog(): its area comes
        // from the settings, not a quoted word at the call — and an info line needs no number.)
        pageLoad: ({ build, discarded } = {}) => {
            try {
                const area = typeof opts.pageLoadArea === 'string' && AREAS[opts.pageLoadArea] ? opts.pageLoadArea : 'UI';
                record('info', area, `Page loaded — build ${build || 'unknown'}${discarded ? '; the browser had discarded this tab and reloaded it' : ''}`,
                    null, false, null);
            } catch (e) { /* logging must never break the app */ }
        },
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
    return Object.assign(api, opts.extraApi || {});   // a host's own helpers on the logger (RW: shortChannelId)
}

// Browser: one logger for the page, built from the host's settings (window.LOGKIT_SETTINGS — in ReaderWrangler,
// logkit-settings.js, loaded just before this file) and published as window[settings.globalName].
if (typeof window !== 'undefined' && typeof document !== 'undefined') {
    const S = window.LOGKIT_SETTINGS || {};
    if (!window.LOGKIT_SETTINGS) {
        try { console.error('logkit: no settings (window.LOGKIT_SETTINGS) — load the host\'s settings file before logkit/logger.js'); } catch (e) { /* none */ }
    }
    const product = S.product || 'This app';
    const idPrefix = S.elementIdPrefix || 'logkit';
    const buildOf = () => { try { return typeof S.build === 'function' ? S.build() : undefined; } catch (e) { return undefined; } };
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
        `${product} diagnostics — build ${buildOf() || 'unknown'} — ${new Date().toISOString()}`,
        ...list.map(e => `${new Date(e.time).toISOString()}  ${pageLog.format(e)}`),
        '', 'Recent log:', ...pageLog.entries().slice(-50).map(e => `${new Date(e.time).toISOString()}  ${pageLog.format(e)}`)
    ].join('\n');
    // The alerts' copy buttons, through the one copy routine (copyText): the button says what happened — "Copied", or
    // "Couldn't copy" when the browser refused (7.29.1: a refusal said nothing at all) — then its own label again.
    const copyInto = (btn, list, label, where) => {
        pageLog.copyText(report(list), { what: 'Diagnostics', where }).then((ok) => {
            btn.textContent = ok ? 'Copied' : "Couldn't copy";
            setTimeout(() => { btn.textContent = label; }, 1500);
        });
    };
    const showBanner = (entry) => whenBody(() => {
        shown.banner.push(entry);
        let bar = document.getElementById(`${idPrefix}-banner`);
        if (!bar) { bar = el('div', BANNER_CSS); bar.id = `${idPrefix}-banner`; bar.setAttribute('role', 'alert'); document.body.appendChild(bar); }
        bar.textContent = '';
        const msg = el('span', 'flex:1;min-width:0;overflow-wrap:anywhere', '🐞 ');
        msg.appendChild(el('strong', '', `${entry.level} · ${codeOf(entry)}`));
        msg.appendChild(document.createTextNode(` · ${entry.text}`));
        if (shown.banner.length > 1) msg.appendChild(el('em', 'margin-left:8px;opacity:.85', `(+${shown.banner.length - 1} more)`));
        const close = () => { shown.banner = []; bar.remove(); };
        const copyBtn = button('Copy', BANNER_BTN, () => copyInto(copyBtn, shown.banner, 'Copy', 'the error banner'));
        bar.append(msg, copyBtn, button('Dismiss', BANNER_BTN, close),
            button('Turn off this banner', BANNER_LINK, () => { pageLog.setSwitch('errorBanner', false); close(); }));
        debugger; // eslint-disable-line no-debugger -- stops here only when DevTools is open (TODO decision 3)
    });
    const showCritical = (entry) => whenBody(() => {
        shown.critical.push(entry);
        let box = document.getElementById(`${idPrefix}-critical`);
        if (!box) { box = el('div', CRITICAL_CSS); box.id = `${idPrefix}-critical`; box.setAttribute('role', 'alert'); document.body.appendChild(box); }
        box.textContent = '';
        // a message's own advice outranks the usual words — kept while it's among those shown (a later message without
        // advice must not bring "save a backup now" back over a "don't")
        const advised = shown.critical.slice().reverse().find(e => e.advice);
        box.append(
            el('div', 'font-weight:700;font-size:15px;margin-bottom:6px', (S.critical && S.critical.title) || `${product} hit a problem.`),
            el('div', 'margin-bottom:8px', `${entry.text} (code ${codeOf(entry)})`),
            el('div', 'margin-bottom:12px;color:var(--text-secondary,#475569)', advised ? advised.advice
                : ((S.critical && S.critical.advice) || 'If this keeps happening, press Copy details and send it to us.')));
        if (shown.critical.length > 1) box.append(el('div', 'margin-bottom:8px;font-style:italic', `and ${shown.critical.length - 1} more`));
        const row = el('div', 'text-align:right');
        const copyBtn = button('Copy details', CRITICAL_BTN, () => copyInto(copyBtn, shown.critical, 'Copy details', 'the critical box'));
        row.append(copyBtn, button('OK', CRITICAL_OK, () => { shown.critical = []; box.remove(); }));
        box.append(row);
    });

    const pageLog = createLogger({ ...S, console: window.console, storage: pageStorage,
        secrets: typeof S.secrets === 'function' ? S.secrets : () => [],
        onAlert: (kind, entry) => (kind === 'critical' ? showCritical(entry) : showBanner(entry)) });
    // ?errorBanner= / ?logDetail= on the address: applied, remembered, and removed from the address bar
    const remaining = pageLog.applyAddress(window.location.search);
    if (remaining !== null) {
        try { window.history.replaceState(window.history.state, '', window.location.pathname + remaining + window.location.hash); }
        catch (e) { /* the address stays; the choice still applies */ }
    }
    pageLog.installGlobalHandlers(window);
    window.addEventListener('pagehide', () => pageLog.flush());
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') pageLog.flush(); });
    // This file loads first (to catch errors from everything after it), before the page defines its build — so the
    // page-load entry waits until the page has been read.
    const recordPageLoad = () => pageLog.pageLoad({ build: buildOf(), discarded: !!document.wasDiscarded });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', recordPageLoad, { once: true });
    else recordPageLoad();
    window[S.globalName || 'logkit'] = pageLog;
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = { createLogger, scrub, LOG_LEVELS, TEST_MARK };
}
})();
