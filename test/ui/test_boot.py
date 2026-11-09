# Screen test: starting up — the build line; a damaged status note no longer stops the library; a library that can't
# be loaded is shown to EVERY user, with advice that fits, and Save Backup refuses to save half a library.
# tags: boot, logging, storage, backup, tier 2
# covers: readerwrangler.js, storage.js, logger.js, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-09 (7.26.0-alpha.15, the logging switch's BOOT area): when the library didn't load, the app printed one
# console line — the person saw an empty library and no reason. Now it's critical, BOOT-01: the logging module's box,
# for every user. Its usual advice ("save a backup now") would be harmful here: a start that fails AFTER the books
# appear has no folders on screen, and a backup made then would restore as a library with none — so BOOT-01 carries its
# own advice, and Save Backup refuses until the library has loaded. Found on the way: a damaged library-status note
# (only "how fresh is your library") stopped the whole load; now it's a warning, BOOT-02. The failures are real ones
# (the browser's book store made to fail, before the page's own scripts), not planted messages.
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

CRITICAL = "#rw-log-critical"
SAVED_ORG = "() => localStorage.getItem('readerwrangler-state')"


def since(app, n0, pattern):
    return [x for _, x in app.console[n0:] if re.search(pattern, x)]


with App() as app:
    page = app.page

    def build_line():
        check(since(app, 0, r"^info · BOOT · Desktop app \d+\.\d+\.\d+(-alpha\.\d+)? running \(page "),
              "no build line naming the app's own version")   # (the page's version: APP-005)
    test("BOOT-001", "the app says which build of its code is running (the page's version doesn't move during alphas)",
         build_line)

    app.restore(FIXTURE)

    def damaged_status_note():
        all_books = app.left_count("All Books")
        page.evaluate("() => localStorage.setItem('readerwrangler-status', '{damaged')")
        n0 = len(app.console)
        app.reload()
        page.wait_for_timeout(1500)
        check(all_books > 0 and app.left_count("All Books") == all_books,
              f"the library didn't load: All Books {app.left_count('All Books')}, was {all_books}")
        check(since(app, n0, r"^warning · BOOT-02 · "), "no BOOT-02 warning for the damaged note")
        check(not since(app, n0, r"BOOT-01"), "the damaged note still stopped the library (BOOT-01)")
        check(page.locator(CRITICAL).count() == 0, "a critical box appeared")
    test("BOOT-002", "a damaged library-status note no longer stops the library from loading — a warning (BOOT-02)",
         damaged_status_note)

    def damaged_filters_note():
        all_books = app.left_count("All Books")
        page.evaluate("() => localStorage.setItem('readerwrangler-filters', '{damaged')")
        n0 = len(app.console)
        app.reload()
        page.wait_for_timeout(1500)
        check(app.left_count("All Books") == all_books, "the library didn't load")
        check(since(app, n0, r"^warning · PREF-01 · "), "no PREF-01 warning for the damaged filters note")
    test("BOOT-005", "a damaged saved-filters note is a warning (PREF-01) and the library still loads", damaged_filters_note)

    def failed_after_the_books():
        # the start's save of the books back fails AFTER they're on screen — the folders never get there
        saved_before = page.evaluate(SAVED_ORG)
        app.ctx.add_init_script("""IDBObjectStore.prototype.clear = function () {
            throw new Error('the book store refused to save (screen test)'); };""")
        n0 = len(app.console)
        app.reload()
        page.locator(CRITICAL).wait_for(timeout=60_000)
        page.wait_for_timeout(500)
        text = page.locator(CRITICAL).inner_text()
        check("BOOT-01" in text and "couldn't be loaded" in text, f"no BOOT-01 \"couldn't be loaded\": {text!r}")
        check("Don't save a backup now" in text and "save a backup now: File" not in text,
              f"the box gives the usual 'save a backup now' advice: {text!r}")
        check(page.evaluate(SAVED_ORG) == saved_before, "the failed start changed the saved organization (F1)")
        app.click_reachable(page.locator(CRITICAL).get_by_text("OK", exact=True))
        # books on screen, so Save Backup isn't greyed out — it must refuse rather than save a library with no folders
        app.menu("File", "Save Backup").click()
        page.get_by_text("Your library isn't loaded", exact=False).wait_for(timeout=10_000)
        check(since(app, n0, r"^warning · BACKUP-08 · "), "no BACKUP-08 warning for the refused Save Backup")
    test("BOOT-003", "a start that fails after the books appear: the box says don't save a backup, and Save Backup "
         "refuses (BOOT-01, BACKUP-08); the saved organization is untouched", failed_after_the_books)

with App() as app:
    page = app.page

    def store_wont_open():
        # the first, normal start saves its organization a moment after the screen is up — wait for it, or "before" is
        # read too early and that save looks like the failed start's (measured 2026-11-09: its savedAt preceded the reload)
        page.wait_for_function("() => localStorage.getItem('readerwrangler-state') !== null", timeout=30_000)
        page.wait_for_timeout(500)
        saved_before = page.evaluate(SAVED_ORG)
        app.ctx.add_init_script("""indexedDB.open = function () {
            throw new Error('the book store refused to open (screen test)'); };""")
        app.reload()
        page.locator(CRITICAL).wait_for(timeout=60_000)
        page.wait_for_timeout(500)
        text = page.locator(CRITICAL).inner_text()
        check("BOOT-01" in text and "couldn't be loaded" in text, f"no BOOT-01 \"couldn't be loaded\": {text!r}")
        check(page.evaluate(SAVED_ORG) == saved_before, "the failed start changed the saved organization (F1)")
    test("BOOT-004", "a book store that won't open shows every user the critical box (BOOT-01), and changes nothing saved",
         store_wont_open)

done()
