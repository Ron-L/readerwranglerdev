// logkit/diagnostics-window.js — the logging kit's Diagnostics window: the kept log, readable (moved here from
// readerwrangler.js in 7.28.0, "Logging as its own module"; designed in 7.26.0 — LOGGING.md §5 step 5.3, Ron + Claude,
// 2026-11-09). Its own window (not part of any status screen — many messages have nothing to do with the data). Newest
// first, one line per entry, "details ▸" for an entry's details; errors tinted; TEST entries badged. The filter on top;
// the two switches, Clear and Copy diagnostics at the bottom. Updates live (log.subscribe). Copy diagnostics copies
// EVERYTHING kept, whatever the filter shows — through the logger's copyText, which says whether it really copied.
//
// It knows nothing of the app that shows it. The host hands it, as props:
//   log        — the logger (logkit/logger.js's createLogger object)
//   Dialog     — the host's modal window ({ onClose, title, maxWidthClassName, children }), so Esc, ✕, a click outside
//                and stacking work as in every other window of the host
//   copyHeader — lines Copy diagnostics puts under its first line (e.g. the build)
//   onClose
// JSX: built ahead of time like the app (tools/build.py → dist/logkit/diagnostics-window.js, loaded by the page after
// logkit/logger.js and before the app). Its look is Tailwind classes, so the host's stylesheet must be built from this
// file too. The data-select-text / data-dialog-body marks tell a host's Ctrl+A what to select (inert elsewhere).
// Published as window.LogkitDiagnosticsWindow.
(function () {
'use strict';
const { useState, useEffect } = React;

const LEVELS = [['all', 'All levels'], ['info', 'Info and up'], ['warning', 'Warnings and up'], ['error', 'Errors and up']];
const TIMES = [['all', 'Everything kept'], ['page', 'Since this page loaded'], ['hour', 'The last hour'], ['day', 'The last day']];
const SWITCHES = [
    ['errorBanner', 'Show a banner when something goes wrong',
        'A red bar at the top of the page for every error — with Copy, so you can send it to us right away'],
    ['logDetail', 'Also record extra detail',
        'Records many more lines (every save, every sync check) — it fills the log fast and pushes older lines out, so turn it on only while chasing a problem'],
];

const DiagnosticsWindow = ({ log, Dialog, onClose, copyHeader }) => {
    const [entries, setEntries] = useState(() => log.entries());
    useEffect(() => log.subscribe(() => setEntries(log.entries())), []);
    const [level, setLevel] = useState('all');
    const [area, setArea] = useState('all');
    const [time, setTime] = useState('all');
    const [showTest, setShowTest] = useState(true);
    const [opened, setOpened] = useState(() => new Set());
    const [sw, setSw] = useState(() => log.switches());
    const rank = (lv) => log.levels.indexOf(lv);
    const since = { all: 0, page: performance.timeOrigin || 0, hour: Date.now() - 3600e3, day: Date.now() - 86400e3 }[time];
    const areas = [...new Set(entries.map(e => e.area))].sort();
    const shown = entries.filter(e => (level === 'all' || rank(e.level) >= rank(level)) && (area === 'all' || e.area === area)
        && e.time >= since && (showTest || !e.test)).reverse();
    const today = new Date().toDateString();
    const when = (t) => { const d = new Date(t); return (d.toDateString() === today ? '' : d.toLocaleDateString([], { month: 'short', day: 'numeric' }) + ' ')
        + d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', second: '2-digit' }); };
    // the logger's one copy routine (7.29.1): a page with no clipboard is a refusal, not "copied"; it logs and toasts either way
    const copy = () => log.copyText(log.diagnosticsText(copyHeader || []),
        { what: 'Diagnostics', toast: true, next: 'paste them into your message to us' });
    // 7.28.0 (Ron, 2026-11-11) - support can ask a person to press this, then Copy diagnostics: one error marked TEST goes
    // down the real path (the log; the banner when its switch is on). Never the critical box — alarming on purpose. With
    // the banner off, a note says so and names the switch, which is right here in this window.
    const sendTest = () => {
        log.log('error', 'UI-07', 'A test message from Diagnostics — not a real problem', null, { test: true });
        if (!log.switches().errorBanner) {
            const bannerSwitch = SWITCHES.find(([name]) => name === 'errorBanner')[1];
            log.log('info', 'UI', `Test message recorded — the banner is off. To see one, tick “${bannerSwitch}” at the bottom of this window.`,
                null, { test: true, toast: true });
        }
    };
    const select = 'border border-gray-300 rounded px-2 py-1 text-sm bg-white';
    return (
        <Dialog onClose={onClose} title="Diagnostics" maxWidthClassName="max-w-4xl">
            <div data-diagnostics className="flex flex-col" style={{ maxHeight: '75vh' }}>
                <div className="flex flex-wrap items-center gap-2 px-4 py-2 border-b border-gray-200 text-sm">
                    <span className="text-gray-600">Show:</span>
                    <select data-diag-level className={select} value={level} onChange={e => setLevel(e.target.value)}>
                        {LEVELS.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                    <select data-diag-area className={select} value={area} onChange={e => setArea(e.target.value)}>
                        <option value="all">All areas</option>
                        {areas.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                    <select data-diag-time className={select} value={time} onChange={e => setTime(e.target.value)}>
                        {TIMES.map(([k, label]) => <option key={k} value={k}>{label}</option>)}
                    </select>
                    <label className="flex items-center gap-1 text-gray-600" title="Entries a test or a support check planted on purpose (marked TEST)">
                        <input data-diag-test type="checkbox" checked={showTest} onChange={e => setShowTest(e.target.checked)} /> test entries
                    </label>
                    <span className="ml-auto text-gray-500">{shown.length} of {entries.length}</span>
                </div>
                <div data-select-text data-dialog-body className="overflow-y-auto font-mono text-xs" style={{ minHeight: 160 }}>
                    {shown.length === 0 && <div className="px-4 py-3 text-gray-400 font-sans text-sm">Nothing to show.</div>}
                    {/* Ron, 2026-11-10: a bare ▸ on only some lines read as "missing" — say what it means, once */}
                    {shown.some(e => e.data !== undefined) && (
                        <div className="px-4 py-1 text-gray-500 font-sans text-xs border-b border-gray-100">Lines with more information show “details ▸” — click it to open them.</div>
                    )}
                    {shown.map((e, i) => {
                        const id = `${e.time}|${e.code}|${i}`;
                        const bad = e.level === 'error' || e.level === 'critical';
                        return (
                            <div key={id} data-diag-row className={`px-4 py-1 border-b border-gray-100 ${bad ? 'bg-red-50 text-red-800' : e.level === 'warning' ? 'text-amber-800' : 'text-gray-800'}`}>
                                <div className="flex gap-2 items-baseline">
                                    {/* a fixed-width time column (Ron, 2026-11-10): an earlier day's date must not push the
                                        columns after it out of line — "Nov 10 12:00:00 PM" is the longest */}
                                    <span className="text-gray-400 flex-shrink-0" style={{ width: '19ch' }}>{when(e.time)}</span>
                                    <span className="flex-shrink-0 w-16">{e.level}</span>
                                    <span data-diag-code className="flex-shrink-0 w-20 font-semibold">{e.code}</span>
                                    {e.test && <span className="flex-shrink-0 px-1 rounded bg-gray-200 text-gray-700">TEST</span>}
                                    <span className="min-w-0" style={{ overflowWrap: 'anywhere' }}>{e.text}{e.count > 1 ? ` (×${e.count})` : ''}</span>
                                    {e.data !== undefined && (
                                        <button type="button" aria-label="Show details" title="Show details"
                                            className="ml-auto flex-shrink-0 text-blue-600 hover:underline"
                                            onClick={() => setOpened(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; })}>
                                            {opened.has(id) ? 'details ▾' : 'details ▸'}</button>
                                    )}
                                </div>
                                {opened.has(id) && <pre className="mt-1 ml-4 p-2 bg-gray-50 text-gray-700 whitespace-pre-wrap" style={{ overflowWrap: 'anywhere' }}>{JSON.stringify(e.data, null, 2)}</pre>}
                            </div>
                        );
                    })}
                </div>
                <div className="flex flex-wrap items-center gap-3 px-4 py-2 border-t border-gray-200 text-sm">
                    {SWITCHES.map(([name, label, tip]) => (
                        <label key={name} className="flex items-center gap-1 text-gray-700" title={tip}>
                            <input data-diag-switch={name} type="checkbox" title={tip} checked={!!sw[name]}
                                onChange={e => { log.setSwitch(name, e.target.checked); setSw(log.switches()); }} /> {label}
                        </label>
                    ))}
                    <span className="ml-auto flex gap-2">
                        <button type="button" className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                            title="Record a test error (marked TEST) — to check that the log, the banner and Copy diagnostics work" onClick={sendTest}>Send a test message</button>
                        <button type="button" className="px-3 py-1 rounded border border-gray-300 hover:bg-gray-100"
                            title="Empty the log (like DevTools' Clear) — a good start before you reproduce a problem" onClick={() => log.clear()}>Clear</button>
                        <button type="button" className="px-3 py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
                            title="Copy everything kept, for a message to us — whatever the filter shows" onClick={copy}>Copy diagnostics</button>
                    </span>
                </div>
            </div>
        </Dialog>
    );
};

window.LogkitDiagnosticsWindow = DiagnosticsWindow;
})();
