# Screen test: the book-field checks a contributor sees — a field nothing knows on a stored book (FIELD-04), and the
# once-per-build round-trip self-check.
# tags: fields, logging, contributor, tier 2
# covers: readerwrangler.js, storage.js, bookFields.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-09 (7.26.0-alpha.16, the logging switch's FIELD area): these checks run only in contributor mode (Ron's
# localhost with the contributor flag) or on the dev site — a real user never sees them. They were console lines with
# their own prefixes; now they're FIELD messages (an unknown field is an error — schema drift — so diagnostics raises
# the banner), and the contributor's popup stays (dialogs are not messages).
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

PHANTOM = "phantomTestField"

with App() as app:
    page = app.page
    app.restore(FIXTURE)
    page.evaluate("""() => { localStorage.setItem('readerwrangler-contributor', 'on');
                             localStorage.removeItem('rw-serialization-selftest'); rwLog.setLevel('debug'); }""")
    # one stored book gets a field nothing knows — straight into the book store (a restore would drop it)
    page.evaluate("""(name) => new Promise((resolve, reject) => {
        const r = indexedDB.open('ReaderWranglerDB');
        r.onerror = () => reject(r.error);
        r.onsuccess = () => {
            const db = r.result, tx = db.transaction(['books'], 'readwrite'), store = tx.objectStore('books');
            const all = store.getAll();
            all.onsuccess = () => { const b = all.result[0]; b[name] = 1; store.put(b); };
            tx.oncomplete = () => { db.close(); resolve(); };
            tx.onerror = () => reject(tx.error);
        };
    })""", PHANTOM)
    dialogs = []
    page.on("dialog", lambda d: (dialogs.append(d.message), d.accept()))
    n0 = len(app.console)
    app.reload()
    app.wait_console(r"FIELD · .*round-trip", timeout_s=60)

    def unknown_field():
        hit = [x for _, x in app.console[n0:] if re.search(r"^error · FIELD-04 · .*" + PHANTOM, x)]
        check(hit, "no FIELD-04 error naming the unknown field")
        check(any(PHANTOM in m for m in dialogs), "the contributor's popup didn't name the field: " + str(dialogs))
    test("FIELD-001", "a field nothing knows on a stored book is an error, FIELD-04, naming it (contributor mode)",
         unknown_field)

    def self_check_ran():
        check([x for _, x in app.console[n0:] if re.search(r"^debug · FIELD · .*round-trip clean", x)],
              "no line from the once-per-build round-trip self-check")
    test("FIELD-002", "the once-per-build book-field self-check runs for a contributor and says the library is clean",
         self_check_ran)

done()
