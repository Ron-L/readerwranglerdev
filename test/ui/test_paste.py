# Screen test: pasting books — Ctrl+V and the right-click menu's Paste — in every kind of place.
# tags: paste, move, booklists, undo, tier 2
# covers: readerwrangler.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-06 (the logging comb's finding F1, then a probe of every place): Ctrl+V refused the Inbox (the menu allowed
# it), and a cut pasted into a Book List or the Trash took the book out of its folder and put it NOWHERE, then said
# "Pasted 'X' into 'folder'" — two hand-kept copies of one paste that knew only folders. 7.25.1-alpha.2: one paste
# (pasteClipboard) and one answer to "can books be pasted here?" (pasteRefusal). The decided behavior ("Move and copy
# books anywhere", decisions 2-4, re-checked 2026-11-06): a copy into a Book List adds; a cut MOVES (out of the folder
# it came from, onto the list), and a book leaving its LAST folder goes to the Inbox, which the receipt says.
# Each paste row is undone with Ctrl+Z and checked back — so every row also tests its undo, and rows stay independent.
# The fixture: "A Book With No Description" is filed only in Science Fiction; "Good Omens" in Fantasy AND Science
# Fiction (test/fixtures/make-small-fixture.js).
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

PLACES = ["All Books", "Inbox", "Fantasy", "Science Fiction", "Read Next", "Trash"]
ONLY_SCIFI = "A Book With No Description"
TWO_FOLDERS = "Good Omens"


def open_(app, label):
    app.click_reachable(app.page.get_by_text(label, exact=True).first)
    app.page.wait_for_timeout(500)


def counts(app):
    open_(app, "All Books")
    return {k: app.left_count(k) for k in PLACES}


def changed(before, after):
    return {k: (before[k], after[k]) for k in PLACES if before[k] != after[k]}


def take(app, title, folder, key):
    """Select a book in a folder and press Ctrl+C or Ctrl+X."""
    open_(app, folder)
    app.page.locator("tbody tr", has_text=title).first.click()
    app.page.wait_for_timeout(150)
    app.page.keyboard.press(f"Control+{key}")
    app.page.wait_for_timeout(250)


def paste_in(app, place):
    """Open a place, press Ctrl+V, return the toast's words."""
    open_(app, place)
    app.page.keyboard.press("Control+v")
    toast = app.page.locator(".clipboard-toast").first
    toast.wait_for(timeout=5000)
    return toast.inner_text()


def undo(app):
    app.page.keyboard.press("Control+z")
    app.page.wait_for_timeout(600)


with App() as app:
    app.restore(FIXTURE)
    app.menu("View", "List View").click()
    BASE = counts(app)

    def row(key, title, folder, place, expect_change, says, undoes=True):
        def run():
            undone = False
            try:
                take(app, title, folder, key)
                words = paste_in(app, place)
                after = counts(app)
                check(changed(BASE, after) == expect_change,
                      f"counts changed {changed(BASE, after)}, expected {expect_change} (toast: {words!r})")
                for s in says:
                    check(s in words, f"the toast should say {s!r}; it said {words!r}")
                if undoes and expect_change:
                    undo(app)
                    undone = True
                    back = counts(app)
                    check(back == BASE, f"Ctrl+Z didn't put it back: {changed(BASE, back)}")
            finally:
                # a failed row must not leave its change for the next row to trip on
                if not undone and counts(app) != BASE:
                    undo(app)
                app.page.keyboard.press("Escape")   # clear the selection and the clipboard between rows
        return run

    test("PASTE-001", "copy → a Book List adds the book; the folder keeps it; Ctrl+Z takes it off",
         row("c", TWO_FOLDERS, "Fantasy", "Read Next", {"Read Next": (3, 4)},
             ["Added 'Good Omens' to 'Read Next'"]))
    test("PASTE-002", "cut → a Book List moves a book out of its LAST folder: onto the list, into the Inbox — and says so",
         row("x", ONLY_SCIFI, "Science Fiction", "Read Next",
             {"Inbox": (2, 3), "Science Fiction": (5, 4), "Read Next": (3, 4)},
             ["Moved 'A Book With No Description' from 'Science Fiction' to 'Read Next'.",
              "It wasn't in any other folder, so it went to the Inbox."]))
    test("PASTE-003", "cut → a Book List from one of a book's TWO folders: it leaves that folder only, no Inbox",
         row("x", TWO_FOLDERS, "Fantasy", "Read Next", {"Fantasy": (5, 4), "Read Next": (3, 4)},
             ["Moved 'Good Omens' from 'Fantasy' to 'Read Next'."]))
    test("PASTE-004", "cut → the Trash changes nothing and says why (was: the book left its folder for nowhere)",
         row("x", ONLY_SCIFI, "Science Fiction", "Trash", {},
             ["Can't paste into the Trash. To put books in the Trash, press Delete."]))
    test("PASTE-005", "copy → the Trash changes nothing and says why",
         row("c", ONLY_SCIFI, "Science Fiction", "Trash", {}, ["Can't paste into the Trash"]))
    test("PASTE-006", "copy → the Inbox pastes (a real folder; Ctrl+V refused it silently before)",
         row("c", ONLY_SCIFI, "Science Fiction", "Inbox", {"Inbox": (2, 3)}, ["Pasted 'A Book With No Description' into 'Inbox'"]))
    test("PASTE-007", "Ctrl+V in All Books changes nothing and says why (was: silent)",
         row("c", ONLY_SCIFI, "Science Fiction", "All Books", {}, ["Every book is already in All Books"]))

    def menu_paste_matches_key():
        take(app, TWO_FOLDERS, "Fantasy", "c")
        open_(app, "All Books")
        app.page.locator("tbody tr", has_text=ONLY_SCIFI).first.click(button="right")
        item = app.page.get_by_text("Paste", exact=True).first
        item.wait_for(timeout=5000)
        tip = item.locator("xpath=..").get_attribute("title") or ""
        check("Every book is already in All Books" in tip, f"the greyed Paste's tooltip: {tip!r}")
        app.page.keyboard.press("Escape")
        open_(app, "Read Next")
        app.page.locator("tbody tr").first.click(button="right")
        app.page.get_by_text("Paste (1)", exact=True).first.click()
        after = counts(app)
        check(changed(BASE, after) == {"Read Next": (3, 4)}, f"the menu's Paste: {changed(BASE, after)}")
        undo(app)
        check(counts(app) == BASE, "Ctrl+Z after the menu's Paste didn't put it back")
        app.page.keyboard.press("Escape")
    test("PASTE-008", "the right-click Paste uses the same rule: greyed in All Books with the reason; pastes into a Book List",
         menu_paste_matches_key)

    test("PASTE-009", "no unexpected console messages",
         lambda: check(not app.unexpected_console(), app.unexpected_console()))

done()
