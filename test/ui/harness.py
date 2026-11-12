"""
test/ui/harness.py — the Python twin of test/harness.js for screen tests: stable IDs (AREA-NNN), a failure is counted
and the file carries on, done() prints the summary and exits 1 if anything failed (tools/run_tests.py reads both).
"""
import re
import sys
import traceback

# Print UTF-8 whatever the output is (2026-11-12): run piped or redirected on Windows, Python used the old code page and
# crashed on the first "✓" — every test had to be run with PYTHONIOENCODING=utf-8 set by hand. Here for every test that
# prints through the harness; the three that print on their own (test_check_parse, test_message_codes, test_run_tests)
# set it the same way.
for _stream in (sys.stdout, sys.stderr):
    try:
        _stream.reconfigure(encoding="utf-8", errors="replace")
    except (AttributeError, ValueError):
        pass

_passed = 0
_failures = []
_seen = set()


def test(tid, name, fn):
    global _passed
    if not re.fullmatch(r"[A-Z][A-Z0-9]*-\d{3}", tid) or tid in _seen:
        _failures.append(tid)
        print(f"  ✗ {tid} {name}\n      bad or repeated test ID — use AREA-NNN", flush=True)
        return
    _seen.add(tid)
    try:
        fn()
        _passed += 1
        print(f"  ✓ {tid} {name}", flush=True)
    except Exception as e:   # noqa: BLE001 — every failure is reported, then the file carries on
        _failures.append(tid)
        msg = str(e) or traceback.format_exc(limit=1)
        print(f"  ✗ {tid} {name}\n      " + "\n      ".join(msg.splitlines()[:6]), flush=True)


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def fail_after(label, msg):
    """A failure found after the tests ran (the driver's end-of-session log check — LOGGING.md §5 step 6): counted like
    any failed test, printed under `label` (not a test ID — it belongs to the whole file)."""
    _failures.append(label)
    print(f"  ✗ {label}\n      " + "\n      ".join(str(msg).splitlines()[:12]), flush=True)


def done():
    print(f"{_passed} passed, {len(_failures)} failed", flush=True)
    sys.exit(1 if _failures else 0)
