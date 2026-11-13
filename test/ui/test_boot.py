# Screen test: starting up — the build line; a damaged status note no longer stops the library; a library that can't
# be loaded is shown to EVERY user, with advice that fits, and Save Backup refuses to save half a library.
# tags: boot, logging, storage, backup, tier 2
# covers: readerwrangler.js, uiHelpers.js, storage.js, logkit/logger.js, logkit-settings.js, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-09 (7.26.0-alpha.15, the logging switch's BOOT area): when the library didn't load, the app printed one
# console line — the person saw an empty library and no reason. Now it's critical, BOOT-01: the logging module's box,
# for every user. Its usual advice ("save a backup now") would be harmful here: a start that fails AFTER the books
# appear has no folders on screen, and a backup made then would restore as a library with none — so BOOT-01 carries its
# own advice, and Save Backup refuses until the library has loaded. Found on the way: a damaged library-status note
# (only "how fresh is your library") stopped the whole load; now it's a warning, BOOT-02 (7.29.1: the one reader's
# STORE-13). The failures are real ones
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
        check(since(app, n0, r'^warning · STORE-13 · The saved "readerwrangler-status" couldn.t be read'),
              "no STORE-13 warning naming the damaged note")
        check(not since(app, n0, r"BOOT-01"), "the damaged note still stopped the library (BOOT-01)")
        check(page.locator(CRITICAL).count() == 0, "a critical box appeared")
    test("BOOT-002", "a damaged library-status note no longer stops the library from loading — one warning naming it "
         "(STORE-13, the one reader; was BOOT-02)", damaged_status_note)

    def damaged_filters_note():
        all_books = app.left_count("All Books")
        page.evaluate("() => localStorage.setItem('readerwrangler-filters', '{damaged')")
        n0 = len(app.console)
        app.reload()
        page.wait_for_timeout(1500)
        check(app.left_count("All Books") == all_books, "the library didn't load")
        check(since(app, n0, r'^warning · STORE-13 · The saved "readerwrangler-filters" couldn.t be read'),
              "no STORE-13 warning naming the damaged filters note")
    test("BOOT-005", "a damaged saved-filters note is one warning naming it (STORE-13; was PREF-01) and the library still "
         "loads", damaged_filters_note)

    def failed_after_the_books():
        # caused on purpose (the end-of-session log check lets exactly these through): the failed save says so itself
        # (STORE-07 — since alpha.22's fix; before, only BOOT-01), then the start does
        app.expect("BOOT-01", "STORE-07")
        # the start's save of the books back fails AFTER they're on screen — the folders never get there. Since 7.27.0
        # the start saves only when its clean-up changed a book, so give it one to change (a stored book still wearing
        # the old invented 'Kindle eBook' format, as STORE-004 does)
        page.evaluate("""async () => {
            const db = await openDB();
            const all = await new Promise(r => { const q = db.transaction([BOOKS_STORE]).objectStore(BOOKS_STORE).getAll();
                                                  q.onsuccess = () => r(q.result); });
            const b = all.find(b => !(b.userEdited && b.userEdited.binding));
            b.binding = 'Kindle eBook';
            await new Promise(r => { const t = db.transaction([BOOKS_STORE], 'readwrite'); t.objectStore(BOOKS_STORE).put(b);
                                     t.oncomplete = r; }); }""")
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

    # 7.29.1 (TODO "One safe way to read saved settings…", 20261109-0912): the old-format folders and Book Lists notes
    # (read once on a pre-2026 install, when the saved organization has no folders) had no guard at all — damaged, they
    # stopped the whole library from loading (BOOT-01). Now through the one reader: none + one warning each.
    def damaged_old_format_notes():
        page.evaluate("""() => { localStorage.removeItem('readerwrangler-state');            // as on a pre-2026 install
            localStorage.setItem('readerwrangler-folders', '[{"id": "f1", "name": "Sci');
            localStorage.setItem('readerwrangler-booklists', '{"not": "a list"}'); }""")
        n0 = len(app.console)
        app.reload()
        for _ in range(300):   # this start's own line (the session's first start logged one too) — a condition, not a sleep
            if since(app, n0, r"^info · BOOT · A fresh start: created the Inbox|BOOT-01"):
                break
            page.wait_for_timeout(100)
        check(not since(app, n0, r"BOOT-01"), "a damaged old-format note stopped the library from loading (BOOT-01)")
        for note in ("readerwrangler-folders", "readerwrangler-booklists"):
            check(len(since(app, n0, rf'^warning · STORE-13 · The saved "{note}" couldn.t be read')) == 1,
                  f"not one STORE-13 warning naming {note}")
        check(page.locator(CRITICAL).count() == 0, "a critical box appeared")
        page.evaluate("() => { localStorage.removeItem('readerwrangler-folders'); localStorage.removeItem('readerwrangler-booklists'); }")
    test("BOOT-006", "damaged old-format folders / Book Lists notes no longer stop the library from loading — one warning "
         "each (STORE-13)", damaged_old_format_notes)

    def store_wont_open():
        app.expect("BOOT-01")   # caused on purpose
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
