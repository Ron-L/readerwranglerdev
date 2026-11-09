# Screen test: Restore Backup's messages — a file we refuse on purpose is the person's file (a warning, BACKUP-07),
# never our bug (an error); a restore that works says what it brought back.
# tags: restore, backup, logging, tier 2
# covers: readerwrangler.js, logger.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-08 (7.26.0-alpha.12, the logging switch's BACKUP area): Restore's failures were three console.error lines
# each, and every failure looked the same. Now one entry each: a file the load refuses on purpose (an old Collections
# file, a damaged or pre-2.0 library) is a warning, BACKUP-07; anything else is an error, BACKUP-04, with the stack.
import json
import os
import re
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

with App() as app:
    app.page.evaluate("() => rwLog.setLevel('debug')")

    def refused_file():
        # an old Collections file, given what the file box checks for ("Not a Backup File", then every part Restore
        # needs — BACKUP-003) so it reaches the load, which refuses it
        path = os.path.join(tempfile.mkdtemp(prefix="rw-test-restore-"), "old-collections.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"isBackup": True, "schemaVersion": "2.4", "type": "collections", "books": {"items": []}}, f)
        n0 = len(app.console)
        text = app.restore(path, expect="Restore Error")
        lines = [(t, x) for t, x in app.console[n0:]]
        check("old Collections file" in text, "the box doesn't name the reason: " + text)
        check(any(re.search(r"^warning · BACKUP-07 · That file can't be restored", x) for _, x in lines),
              "no BACKUP-07 warning: " + str([x for _, x in lines][-8:]))
        errors = [x for t, x in lines if t == "error"]
        check(not errors, "a refused file was logged as an error: " + str(errors))
    test("BACKUP-001", "a file Restore refuses on purpose is one warning (BACKUP-07), never an error", refused_file)

    def restored():
        n0 = len(app.console)
        text = app.restore(FIXTURE)
        check("23 books restored" in text, "the fixture didn't restore: " + text)
        hit = [x for _, x in app.console[n0:] if re.search(r"^info · BACKUP · Backup restored: 23 books, \d+ folders", x)]
        check(hit, "no 'Backup restored' line naming the books and folders")
        check(not [x for t, x in app.console[n0:] if t == "error"], "the restore logged an error")
    test("BACKUP-002", "a restore that works logs what it brought back: the books and the folders", restored)

    # 2026-11-08 (Ron): Restore replaces everything but the Cloud Sync credentials — a missing part restores as EMPTY
    # (it used to load like an Import: merged into the library here, folders kept), and a backup is refused only when
    # that leaves the library unusable, naming every problem at once (backupCheck.js; its function tests: BCHK-001…).
    def fixture_without(edit):
        with open(FIXTURE, encoding="utf-8") as f:
            data = json.load(f)
        edit(data)
        path = os.path.join(tempfile.mkdtemp(prefix="rw-test-restore-"), "edited-fixture.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f)
        return path

    def unusable_refused():
        # no organization while books carry tags: the tags would vanish from the tag filter and the Tags menu
        path = fixture_without(lambda d: d.pop("organization"))
        before = {k: app.left_count(k) for k in ("All Books", "Inbox")}
        n0 = len(app.console)
        text = app.restore(path, expect="Restore Error")
        check("missing its tag list" in text and "Nothing was changed" in text, "the box doesn't say why: " + text)
        # every dialog logs what it showed, in the area its caller named (7.26.0-alpha.24, rwLog.dialog)
        check(any(re.search(r'^info · BACKUP · Box shown: "Restore Error" — This backup can.t be restored', x)
                  for _, x in app.console[n0:]), "the Restore Error box isn't in the log")
        check(any(re.search(r"^warning · BACKUP-02 · Refused a backup: its tag list missing", x) for _, x in app.console[n0:]),
              "no BACKUP-02 warning naming the tag list")
        after = {k: app.left_count(k) for k in ("All Books", "Inbox")}
        check(after == before, f"the library changed: {before} → {after}")
    test("BACKUP-003", "a backup a restore would leave unusable is refused — naming why — and the library is left as it was",
         unusable_refused)

    def missing_parts_restore_as_none():
        # no organization and no tags: usable — every part restores as none, and the books land in the Inbox
        def strip(d):
            d.pop("organization")
            for b in d["books"]["items"]:
                b.pop("tags", None)
        # what the library holds, from its saved organization (the screen's own state, saved a moment after a change)
        held = """() => { const o = JSON.parse(localStorage.getItem('readerwrangler-state')).organization;
                          return [o.bookLists.length, o.savedSearches.length]; }"""
        before = app.page.evaluate(held)
        check(before[0] > 0 and before[1] > 0, f"the library had no Book Lists or Searches to replace: {before}")
        n0 = len(app.console)
        text = app.restore(fixture_without(strip))
        check("23 books restored" in text, "it didn't restore: " + text)
        app.page.wait_for_timeout(2500)   # the after-restore integrity check runs once the screen settles
        check(app.page.evaluate(held) == [0, 0], f"the library kept its Book Lists / Searches: {app.page.evaluate(held)}")
        check(app.left_count("Inbox") == app.left_count("All Books"), "not every book is in the Inbox")
        lines = [x for _, x in app.console[n0:]]
        check(any(re.search(r"^info · BACKUP · Backup restored: 23 books, 1 folders, 0 Book Lists, 0 Searches", x) for x in lines),
              "no 'Backup restored' line with the counts: " + str([x for x in lines if "Backup restored" in x]))
        repairs = [x for _, x in app.console[n0:] if re.search(r"Integrity auto-fixed|Library repair", x)]
        check(not repairs, "a repair was reported: " + str(repairs))
    test("BACKUP-004", "a backup with no folders, Book Lists or Searches restores with none — every book in the Inbox, "
         "no repair reported", missing_parts_restore_as_none)

done()
