# Tests for tools/message_codes.py — the logging rules checked from the code, and the generated support table.
# tags: logging, commit-checks, tier 1
# covers: tools/message_codes.py, logger.js
# Run: python test/test_message_codes.py
#
# One table, a row per rule (docs/design/LOGGING.md §6): each sample file must pass or be refused for the right reason.
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("message_codes", os.path.join(ROOT, "tools", "message_codes.py"))
mc = importlib.util.module_from_spec(spec)
spec.loader.exec_module(mc)

AREAS = mc.areas_from_logger(open(os.path.join(ROOT, "logger.js"), encoding="utf-8").read())

# (id, what, source, refusal it must give — None = must pass)
ROWS = [
    ("MSG-001", "a general info line", "rwLog.log('info', 'IMPORT', 'Library updated: 26 books');", None),
    ("MSG-002", "a numbered warning", "rwLog.log('warning', 'IMPORT-01', `An Import of ${n} books is running`, { n });", None),
    ("MSG-003", "a warning with a bare area", "rwLog.log('warning', 'IMPORT', 'x');", "needs a numbered code"),
    ("MSG-004", "an unknown area (a typo)", "rwLog.log('info', 'IMPRT', 'x');", "unknown area \"IMPRT\""),
    ("MSG-005", "an unknown level", "rwLog.log('WARNNG', 'IMPORT-02', 'x');", "unknown level \"WARNNG\""),
    ("MSG-006", "a badly shaped code", "rwLog.log('info', 'IMPORT-1', 'x');", "badly shaped code"),
    ("MSG-007", "the level not written as a quoted word", "rwLog.log(lvl, 'IMPORT', 'x');", "plain quoted words"),
    ("MSG-008", "one numbered code at two calls",
     "rwLog.log('warning', 'SYNC-03', 'a');\nrwLog.log('error', 'SYNC-03', 'b');", "already used at"),
    ("MSG-014", "a comment that mentions rwLog.log(…) is not a call",
     "// the toaster: rwLog.log(…, { toast }) shows it\n/* also rwLog.log(level, code) here */\nrwLog.log('info', 'UI', 'real');", None),
    ("MSG-009", "a call split over lines, double quotes",
     "rwLog.log(\n    \"error\",\n    \"STORE-04\",\n    \"the book store could not be read\"\n);", None),
    # 2026-11-09 (the toast pass): every toast goes through rwLog.log(…, { toast }) so it reaches the log with its area;
    # the one line that hands showToast to the logger, and comments, are allowed
    ("MSG-015", "a direct showToast( call is refused — toasts go through rwLog.log(…, { toast })",
     "showToast('Saved');", "showToast"),
    ("MSG-016", "the logger's hand-over line and a comment mentioning showToast( are allowed",
     "window.rwLog.setToaster((text, o) => showToast(text, o.x, o.y));\n// (was: showToast('x'))\nconst showToast = (message) => {};",
     None),
]

failures = 0
for tid, what, src, refusal in ROWS:
    calls, problems = mc.check([("sample.js", src)], AREAS)
    ok = (not problems) if refusal is None else any(refusal in p for p in problems)
    if not ok:
        failures += 1
        why = (f"should pass, refused: {problems}" if refusal is None
               else f"should be refused with \"{refusal}\", got: {problems or 'nothing'}")
        print(f"  ✗ {tid} {what}: {why}")
    else:
        print(f"  ✓ {tid} {what}")


def check(tid, what, cond, detail=""):
    global failures
    if cond:
        print(f"  ✓ {tid} {what}")
    else:
        failures += 1
        print(f"  ✗ {tid} {what}: {detail}")


# The table: numbered codes only, sorted by area then code, with level, message and file; general lines counted.
calls, _ = mc.check([("b.js", "rwLog.log('warning', 'SYNC-02', 'relay unreachable');\nrwLog.log('info', 'SYNC', 'retrying');"),
                     ("a.js", "rwLog.log('error', 'BACKUP-03', 'a | pipe');")], AREAS)
t = mc.table(calls)
rows = [ln for ln in t.splitlines() if ln.startswith("| ") and not ln.startswith("| Code")]
check("MSG-010", "the table lists numbered codes sorted by area, escapes |, counts general lines",
      rows == ["| BACKUP-03 | error | a \\| pipe | a.js |", "| SYNC-02 | warning | relay unreachable | b.js |"]
      and "1 general line" in t, t)
check("MSG-011", "the areas come from logger.js's own list (17)",
      len(AREAS) == 17 and "IMPORT" in AREAS and "SHARE" in AREAS, sorted(AREAS))
logger_calls = mc.find_calls("logger.js", open(os.path.join(ROOT, "logger.js"), encoding="utf-8").read())
check("MSG-012", "the logging module's own calls are found (UI-02, UI-03, UI-04, the page-load line)",
      {"UI-02", "UI-03", "UI-04", "BOOT"} <= {c[3] for c in logger_calls}, [c[3] for c in logger_calls])

lt = mc.table(logger_calls)
check("MSG-013", "a template's details (even a nested template) show as one \"…\" in the table",
      "| UI-03 | error | Uncaught error: … | logger.js |" in lt and "${" not in lt, lt)

print(f"{len(ROWS) + 4 - failures} passed, {failures} failed")
sys.exit(1 if failures else 0)
