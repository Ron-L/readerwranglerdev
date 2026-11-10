# Screen test: the browser's book store — saves take turns, and a save that fails says so.
# tags: storage, logging, tier 2
# covers: storage.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-09 (7.26.0-alpha.22): saveBooksToIndexedDB queues its saves behind a write lock — but it did
# `return new Promise(…)` inside its try, so the finally released the lock as soon as the write STARTED, not when it
# finished (a second save could start mid-write), and a failure while starting the write skipped the save's own
# message (STORE-07) — the try never saw it. Found by the logging switch (step 6's first run: BOOT-003 showed BOOT-01
# without STORE-07). Both made to happen here, on purpose, through the page's own storage.js.
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

with App() as app:      # (the driver turns extra detail on, so the store's own "Saving… / Saved…" lines are on)
    page = app.page
    app.restore(FIXTURE)
    page.wait_for_timeout(1500)

    def saves_take_turns():
        n0 = len(app.console)
        page.evaluate("""async () => { const books = await loadBooksFromIndexedDB();
                                       await Promise.all([saveBooksToIndexedDB(books), saveBooksToIndexedDB(books)]); }""")
        order = [("start" if "· Saving" in x else "end") for _, x in app.console[n0:]
                 if re.match(r"^debug · STORE · (Saving \d+ books|Saved \d+ books)", x)]
        check(order == ["start", "end", "start", "end"],
              f"two saves overlapped — the second started before the first finished: {order}")
    test("STORE-001", "two saves started together run one after the other (the write lock holds until the write ends)",
         saves_take_turns)

    def failed_save_says_so():
        app.expect("STORE-07")   # caused on purpose
        n0 = len(app.console)
        result = page.evaluate("""async () => {
            const books = await loadBooksFromIndexedDB();
            const clear = IDBObjectStore.prototype.clear;
            IDBObjectStore.prototype.clear = function () { throw new Error('the book store refused to save (screen test)'); };
            try { await saveBooksToIndexedDB(books); return 'saved'; }
            catch (e) { return 'refused: ' + e.message; }
            finally { IDBObjectStore.prototype.clear = clear; } }""")
        check(result.startswith("refused"), f"the save didn't fail as set up: {result}")
        check([x for _, x in app.console[n0:] if re.match(r"^critical · STORE-07 · ", x)],
              "a save that failed while starting its write said nothing (no STORE-07)")
    test("STORE-002", "a save that fails while starting its write logs STORE-07 (critical, shown to the person)",
         failed_save_says_so)

done()
