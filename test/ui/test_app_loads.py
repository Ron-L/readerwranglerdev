# Screen test: the app opens, and the made-up library restores and shows correctly (the base every screen test uses).
# tags: app, restore, driver, tier 2
# covers: readerwrangler.html, readerwrangler.js, storage.js, bookFields.js, integrity.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

with App() as app:
    test("APP-001", "a fresh app opens cleanly — no unexpected console messages, no requests to a relay or Amazon",
         lambda: (check(not app.unexpected_console(), app.unexpected_console()),
                  check(not app.violations, app.violations)))

    restored = {}

    def restore_fixture():
        restored["text"] = app.restore(FIXTURE)
        check("23 books restored" in restored["text"], restored["text"])
    test("APP-002", "File → Restore Backup… restores the made-up library (23 books)", restore_fixture)

    # The fixture's shape (test/fixtures/make-small-fixture.js): 22 live books + 1 in the Trash; "Written Together" is filed in
    # two folders (Fantasy and Science Fiction — 2026-11-06, for the paste tests).
    EXPECTED = {"All Books": 22, "Inbox": 2, "Fantasy": 5, "The Test Saga": 4, "Science Fiction": 5,
                "Space Opera": 2, "Every Ownership Kind": 11, "An Empty Folder": 0, "Trash": 1,
                "The Saga": 4, "Tagged Read": 2, "Read Next": 3, "An Empty Book List": 0}

    def counts_match():
        got = {k: app.left_count(k) for k in EXPECTED}
        wrong = {k: (got[k], v) for k, v in EXPECTED.items() if got[k] != v}
        check(not wrong, "left pane (shown, expected): " + str(wrong))
    test("APP-003", "the left pane shows every folder, Book List and Search with the right counts", counts_match)

    test("APP-004", "after the restore: still no unexpected console messages and no requests to a relay or Amazon",
         lambda: (check(not app.unexpected_console(), app.unexpected_console()),
                  check(not app.violations, app.violations)))

    print("    screenshot:", app.shot("APP-restored"))

    # The driver's own reachability checks (PRINCIPLES Law 8: test what a person reaches, the way they would).
    def hover_reports_target():
        info = app.hover(app.page.get_by_role("button", name="Restore Backup").or_(
            app.page.get_by_text("All Books", exact=True)).first)
        check(info["width"] > 0 and info["height"] > 0 and info["under"], str(info))
    test("DRV-001", "hover() moves the real pointer and reports what's under it, with its size", hover_reports_target)

    def covered_is_refused():
        app.page.evaluate("""() => { const d = document.createElement('div'); d.id = 'drv-cover';
            Object.assign(d.style, {position: 'fixed', inset: '0', zIndex: 99999, background: 'transparent'});
            document.body.appendChild(d); }""")
        try:
            try:
                app.hover(app.page.get_by_text("All Books", exact=True).first)
                raise AssertionError("hover over a covered target was NOT refused")
            except app.Unreachable as e:
                check("drv-cover" in str(e), "the refusal doesn't name what covers it: " + str(e))
        finally:
            app.page.evaluate("() => document.getElementById('drv-cover').remove()")
    test("DRV-002", "a covered target is refused, naming what covers it", covered_is_refused)

    def zero_size_is_refused():
        app.page.evaluate("""() => { const s = document.createElement('span'); s.id = 'drv-zero';
            Object.assign(s.style, {display: 'inline-block', width: '0', height: '0'}); document.body.appendChild(s); }""")
        try:
            try:
                app.hover(app.page.locator("#drv-zero"))
                raise AssertionError("hover over a zero-size target was NOT refused")
            except app.Unreachable as e:
                check("no size" in str(e), str(e))
        finally:
            app.page.evaluate("() => document.getElementById('drv-zero').remove()")
    test("DRV-003", "a target with no size is refused", zero_size_is_refused)

done()
