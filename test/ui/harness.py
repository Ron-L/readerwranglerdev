"""
test/ui/harness.py — the Python twin of test/harness.js for screen tests: stable IDs (AREA-NNN), a failure is counted
and the file carries on, done() prints the summary and exits 1 if anything failed (tools/run_tests.py reads both).
differs_today() — a test of decided behavior the app doesn't have yet, with what it does today (2026-11-13, CELL-…).
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


_differ = []


def differs_today(tid, name, fn, today):
    """A test that asserts the DECIDED behavior where the app is known to differ today (test-first, before the build —
    sprint 4 of docs/design/ONE-TABLE.md). `today` is what was measured: text (or a list of texts) that the failure's
    words must contain. Three outcomes, so a mark can't hide a new problem or outlive its fix:
      - it fails AND its words hold every `today` text → the known difference: reported, not counted as a failure;
      - it fails with other words → a FAILURE (the app changed, or the test broke — read it);
      - it passes → a FAILURE: the app now does what was decided — drop the mark (call test() instead)."""
    if not re.fullmatch(r"[A-Z][A-Z0-9]*-\d{3}", tid) or tid in _seen:
        _failures.append(tid)
        print(f"  ✗ {tid} {name}\n      bad or repeated test ID — use AREA-NNN", flush=True)
        return
    _seen.add(tid)
    marks = [today] if isinstance(today, str) else list(today)
    try:
        fn()
    except Exception as e:   # noqa: BLE001
        msg = str(e) or traceback.format_exc(limit=1)
        if isinstance(e, AssertionError) and all(m in msg for m in marks):
            _differ.append(tid)
            print(f"  ~ {tid} {name}\n      differs today, as measured:\n      "
                  + "\n      ".join(msg.splitlines()[:8]), flush=True)
            return
        _failures.append(tid)
        print(f"  ✗ {tid} {name}\n      not the difference measured (expected words: {marks}):\n      "
              + "\n      ".join(msg.splitlines()[:8]), flush=True)
        return
    _failures.append(tid)
    print(f"  ✗ {tid} {name}\n      now does what was decided — drop its 'differs today' mark", flush=True)


def check(cond, msg):
    if not cond:
        raise AssertionError(msg)


def fail_after(label, msg):
    """A failure found after the tests ran (the driver's end-of-session log check — LOGGING.md §5 step 6): counted like
    any failed test, printed under `label` (not a test ID — it belongs to the whole file)."""
    _failures.append(label)
    print(f"  ✗ {label}\n      " + "\n      ".join(str(msg).splitlines()[:12]), flush=True)


def done():
    print(f"{_passed} passed, {len(_failures)} failed" + (f", {len(_differ)} differ today (as measured)" if _differ else ""),
          flush=True)
    sys.exit(1 if _failures else 0)
