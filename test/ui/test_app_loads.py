# Screen test: the app opens, and the made-up library restores and shows correctly (the base every screen test uses).
# tags: app, restore, driver, tier 2
# covers: readerwrangler.html, readerwrangler.js, storage.js, bookFields.js, integrity.js, logkit/logger.js, logkit-settings.js
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

    # The fixture's shape (test/fixtures/make-small-fixture.js): 22 live books + 1 in the Trash; "Good Omens" is filed in
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

    def logger_is_up():
        # 7.26.0 - the logging module (logger.js, loaded first): window.rwLog exists, and the page load was kept with
        # this page's build (the page defines APP_VERSION after logger.js loads — the entry waits for it)
        got = app.page.evaluate("""() => {
            if (!window.rwLog) return { missing: true };
            const loads = window.rwLog.entries().filter(e => e.code === 'BOOT' && e.text.startsWith('Page loaded'));
            return { build: typeof APP_VERSION !== 'undefined' ? APP_VERSION : null,
                     last: loads.length ? loads[loads.length - 1].text : null };
        }""")
        check(not got.get("missing"), "window.rwLog is missing")
        check(got["last"] and got["build"] and got["build"] in got["last"], f"page-load entry: {got}")
    test("APP-005", "the logging module is running: window.rwLog, and the page load kept with this build", logger_is_up)

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

    # 7.27.0 post-mortem (2026-11-11): the driver only RECORDED requests to Amazon and real relays — so timing a load
    # with Ron's library fetched its covers from Amazon's image server. Now it blocks them: a cover gets a stand-in image
    # (the app's cover handling still runs), anything else is refused. This test makes both requests on purpose.
    def amazon_is_blocked():
        got = app.page.evaluate("""async () => {
            const out = {};
            try { const r = await fetch('https://m.media-amazon.com/images/I/drv-test.jpg');
                  out.cover = r.status + ' ' + r.headers.get('content-type') + ' ' + (await r.arrayBuffer()).byteLength; }
            catch (e) { out.cover = 'refused'; }
            try { await fetch('https://www.amazon.com/drv-test'); out.page = 'reached'; }
            catch (e) { out.page = 'refused'; }
            return out; }""")
        check(got["cover"] == f"200 image/png {len(App.STAND_IN_COVER)}",
              f"a cover from Amazon's image server gets the driver's stand-in image: {got['cover']!r}")
        check(got["page"] == "refused", f"a request to amazon.com is refused: {got['page']!r}")
        check(any("media-amazon" in u for u in app.violations) and any("amazon.com" in u for u in app.violations),
              f"and both are still recorded, so a 'no requests' test sees them: {app.violations[-2:]}")
    test("DRV-004", "requests to Amazon are blocked, not just recorded: a cover gets a stand-in, a page is refused",
         amazon_is_blocked)

done()
