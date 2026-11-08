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
        # an old Collections file, marked as a backup and given an (empty) organization so it gets past the file box's
        # own checks ("Not a Backup File", BACKUP-003's) to the load, which refuses it
        path = os.path.join(tempfile.mkdtemp(prefix="rw-test-restore-"), "old-collections.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump({"isBackup": True, "type": "collections", "organization": {}}, f)
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

    # 2026-11-08 (Ron): a backup with no organization section (no folders or lists) is refused. It used to load like an
    # Import — merged into the library here, folders kept — breaking Restore's "exactly the backup" promise; no file
    # today's app saves lacks it, so the only way to get one is to cut it out by hand.
    def no_organization_refused():
        with open(FIXTURE, encoding="utf-8") as f:
            data = json.load(f)
        del data["organization"]
        path = os.path.join(tempfile.mkdtemp(prefix="rw-test-restore-"), "no-organization.json")
        with open(path, "w", encoding="utf-8") as f:
            json.dump(data, f)
        before = {k: app.left_count(k) for k in ("All Books", "Inbox")}
        n0 = len(app.console)
        text = app.restore(path, expect="Restore Error")
        check("no folders or lists" in text, "the box doesn't say why: " + text)
        check(any(re.search(r"^warning · BACKUP-02 · ", x) for _, x in app.console[n0:]), "no BACKUP-02 warning")
        after = {k: app.left_count(k) for k in ("All Books", "Inbox")}
        check(after == before, f"the library changed: {before} → {after}")
    test("BACKUP-003", "a backup with no folders or lists is refused, and the library is left as it was",
         no_organization_refused)

done()
