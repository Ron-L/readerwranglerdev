# Screen test: File menu items greyed out with an empty library say why (Law 16).
# tags: menus, backup, tier 2
# covers: readerwrangler.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-12 (sprint 2, found building the Reset App box's Save Backup… button): File → Save Backup… and File → Save
# Spreadsheet (CSV)… were greyed out with an empty library and said nothing about why — the Reset App box's own Save
# Backup… button already did ("Your library is empty — there are no books to back up"). A disabled item keeps its place
# and says why (PRINCIPLES Law 16).
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

EMPTY = re.compile(r"^Your library is empty — there are no books to ")

with App() as app:
    page = app.page

    def item(name):
        return app.menu("File", name)

    def greyed_saying_why():
        for name in ("Save Backup…", "Save Spreadsheet (CSV)…"):
            it = item(name)
            check(it.is_disabled(), f"File → {name} isn't greyed out with an empty library")
            title = it.get_attribute("title") or ""
            check(EMPTY.search(title), f"File → {name} doesn't say why it's greyed out: {title!r}")
            page.keyboard.press("Escape")
    test("FILEMENU-001", "with an empty library, File → Save Backup… and Save Spreadsheet (CSV)… are greyed out, saying why",
         greyed_saying_why)

    def same_words_as_reset_box():
        backup_title = item("Save Backup…").get_attribute("title")
        page.keyboard.press("Escape")
        app.menu("Tools", "Reset App").click()
        box = page.locator('[role="dialog"]', has=page.locator("#modal-reset-confirm"))
        box.wait_for(timeout=10_000)
        check(box.get_by_role("button", name="Save Backup…", exact=True).get_attribute("title") == backup_title,
              "the Reset App box's Save Backup… and File → Save Backup… say different things")
        box.get_by_role("button", name="Cancel", exact=True).click()
        box.wait_for(state="detached", timeout=5_000)
    test("FILEMENU-002", "File → Save Backup… says the same as the Reset App box's Save Backup… (one sentence)",
         same_words_as_reset_box)

    def with_books():
        app.restore(FIXTURE)
        backup, sheet = item("Save Backup…"), None
        check(backup.is_enabled(), "Save Backup… is greyed out with books")
        check(not EMPTY.search(backup.get_attribute("title") or ""), "Save Backup… still says the library is empty")
        page.keyboard.press("Escape")
        sheet = item("Save Spreadsheet (CSV)…")
        check(sheet.is_enabled(), "Save Spreadsheet is greyed out with books")
        check((sheet.get_attribute("title") or "").startswith("Your library as a spreadsheet file (CSV)"),
              f"Save Spreadsheet lost its description: {sheet.get_attribute('title')!r}")
        page.keyboard.press("Escape")
    test("FILEMENU-003", "with books, both are offered, and Save Spreadsheet keeps its description", with_books)

    test("FILEMENU-004", "no unexpected console messages",
         lambda: check(not app.unexpected_console(), app.unexpected_console()))

done()
