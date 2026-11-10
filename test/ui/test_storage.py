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

    # 2026-11-10 (TODO "Every load saves the whole library back to storage, even when nothing changed"; "Faster
    # loading"): every load rewrote all the books right after reading them (~0.9 s for 3,270, before the folders could
    # appear). Now a load saves only when what it would save differs from what it read — any change, from any of the
    # load's own clean-ups (no list of them to keep), counts.
    SAVING = re.compile(r"^debug · STORE · Saving \d+ books")

    def load_and_watch():
        n0 = len(app.console)
        app.reload()
        app.wait_console(r"^debug · STORE · Loaded \d+ books")
        page.wait_for_timeout(2500)
        return [x for _, x in app.console[n0:] if SAVING.match(x)]

    def unchanged_load_doesnt_save():
        load_and_watch()                       # the first load after a restore may settle something (collections)
        saves = load_and_watch()
        check(not saves, f"a load that changed nothing saved anyway: {saves}")
    test("STORE-003", "a load that changes nothing doesn't rewrite the books", unchanged_load_doesnt_save)

    def changed_load_saves():
        asin = page.evaluate("""async () => {          // a stored book still wearing the old invented 'Kindle eBook'
            const db = await openDB();
            const all = await new Promise(r => { const q = db.transaction([BOOKS_STORE]).objectStore(BOOKS_STORE).getAll();
                                                  q.onsuccess = () => r(q.result); });
            const b = all.find(b => !(b.userEdited && b.userEdited.binding));
            b.binding = 'Kindle eBook';
            await new Promise(r => { const t = db.transaction([BOOKS_STORE], 'readwrite'); t.objectStore(BOOKS_STORE).put(b);
                                     t.oncomplete = r; });
            return b.asin; }""")
        saves = load_and_watch()
        check(saves, "the load's own clean-up changed a book (the 'Kindle eBook' fix) — it must be saved")
        stored = page.evaluate("""async (asin) => { const db = await openDB();
            return await new Promise(r => { const q = db.transaction([BOOKS_STORE]).objectStore(BOOKS_STORE).getAll();
                                            q.onsuccess = () => r((q.result.find(b => b.asin === asin) || {}).binding || null); }); }""",
                               asin)
        check(stored is None, f"the clean-up reached storage: the book's format is {stored!r}, should be blank")
        check(not load_and_watch(), "and the next load, with nothing left to change, doesn't save")
    test("STORE-004", "a load whose clean-up changes a book saves it — once", changed_load_saves)

done()
