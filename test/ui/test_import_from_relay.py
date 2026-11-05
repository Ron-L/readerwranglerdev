# Screen test: File → Import from Relay brings a fetch's new books in — filed in the Inbox, with no false "repair".
# tags: import, sync, relay, integrity, tier 2
# covers: readerwrangler.js, relay-client.js, integrity.js, relay/relay-worker.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python). Starts its own LOCAL relay (rw.LocalRelay)
# with a throwaway test channel — never the dev or production relay.
#
# IMPORT-004 is TODO "Import files new books once, before the integrity check…" part 1 (LOGGING.md finding F5): today
# Import's library load runs the integrity check while the new books are in no folder yet, so it "repairs" them into the
# Inbox and logs a repair on every normal Import. Written to fail before the fix (Ron's rule: a bug fix starts with a
# failing test). IMPORT-006 runs first, while the channel is still empty.
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

# Three books a fetch has just found — the library fetcher's own fields (amazon-library-fetcher.js, the book it builds),
# newer than everything in the fixture. A real fetch sends the whole library; Import composes the fetch with the copy the
# Restore put there (all 23 fixture books), so these three alone compose to the same library.
NOW_MS = int(time.time() * 1000)
NEW_BOOKS = [{
    "asin": f"TST000090{i}", "onWishlist": False, "ownershipType": "purchased",
    "title": f"A Brand-New Arrival, Part {i}", "authors": "Quinn Newcomer",
    "coverUrl": "", "coverUrlHiRes": "", "rating": 4.0, "reviewCount": "12",
    "series": "", "seriesPosition": "", "acquisitionDate": str(NOW_MS - i * 60_000), "binding": "Kindle Edition",
    "description": f"A made-up book for ReaderWrangler's tests (new arrival {i}).", "topReviews": [],
} for i in (1, 2, 3)]

REPAIR = r"Integrity auto-fixed|Library repair"

with App(relay=True) as app:
    # First, while the channel is still empty: nothing sent yet, OR credentials that don't match the bookmarklet's — the
    # relay can't tell the two apart (a mistyped Channel ID is an empty channel), so the message names both (Ron,
    # 2026-11-05).
    def empty_channel_says_what_to_do():
        text = app.import_from_relay()
        for words in ("Nothing is on the relay for these credentials yet.", "New here?", "Download Library",
                      "Already did that?", "different credentials", "File → Relay Setup"):
            check(words in text, f"missing {words!r} in: {text}")
    test("IMPORT-006", "Import on an empty channel says what to do: send your library, or check the credentials",
         empty_channel_says_what_to_do)

    def restore_reaches_relay():
        check("23 books restored" in app.restore(FIXTURE), "the fixture didn't restore")
        line = app.wait_console(r"Restore pushed to relay|relay push failed")
        check("Restore pushed to relay" in line, line)
    test("IMPORT-001", "with Cloud Sync on (a local relay), Restore sends its copy to the relay", restore_reaches_relay)

    before = {k: app.left_count(k) for k in ("All Books", "Inbox")}
    repairs_before = len(app.console_matching(REPAIR))
    imported = {}

    def import_brings_new_books():
        app.upload_fetch(NEW_BOOKS)
        imported["text"] = app.import_from_relay()
        check("3 new" in imported["text"], "the Import's report: " + imported["text"])
    test("IMPORT-002", "a fetch sends 3 new books; File → Import from Relay reports them (\"3 new\")",
         import_brings_new_books)

    def new_books_in_inbox():
        after = {k: app.left_count(k) for k in ("All Books", "Inbox")}
        check(after == {"All Books": before["All Books"] + 3, "Inbox": before["Inbox"] + 3},
              f"left pane before {before}, after {after} — expected 3 more in each")
    test("IMPORT-003", "the 3 new books are in All Books and in the Inbox", new_books_in_inbox)

    test("IMPORT-004", "a normal Import reports no library repair (TODO \"Import files new books once…\", F5)",
         lambda: check(len(app.console_matching(REPAIR)) == repairs_before,
                       "a repair was reported for the normal path: " + str(app.console_matching(REPAIR)[repairs_before:])))

    test("IMPORT-005", "no unexpected console messages, and no requests to a real relay or Amazon",
         lambda: (check(not app.unexpected_console(), app.unexpected_console()),
                  check(not app.violations, app.violations)))

    print("    screenshot:", app.shot("IMPORT-after"))

done()
