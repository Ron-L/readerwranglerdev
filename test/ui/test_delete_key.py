# Screen test: the Delete key acts on what you SELECTED — never on the folder you happen to be in.
# tags: delete, folders, undo, keyboard, tier 2
# covers: readerwrangler.js, gestureTable.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# TODO "The Delete key deletes the folder you're in — not the folders you selected" (id 20261014-1030ay), and the Delete
# rows of "the one table" (docs/design/ONE-TABLE.md §3). Until 7.28.1, Delete with no BOOKS selected deleted the folder you
# were INSIDE, whatever folders you had selected — and an empty one went with no question; in the Folders view it did
# nothing at all. Decided (Ron + UX, 2026-10-22): selected books; else the folders selected in the right pane; else — only
# when the left pane has your focus — the folder highlighted there; with nothing selected, nothing. Several folders: one
# confirmation listing them, one undo for the lot. The key and the right-click Delete use one operation.
# Real keys and real clicks throughout; every row that deletes is undone with Ctrl+Z and checked back.
# The fixture (test/fixtures/make-small-fixture.js): Science Fiction (3 books) ⊃ Space Opera (no books) ⊃ Old Favorites
# (2 books); Fantasy ⊃ The Test Saga; Every Ownership Kind; An Empty Folder; the Inbox (2 books).
import json
import os
import re
import shutil
import sys
import tempfile

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

IDS = {"Science Fiction": "f-scifi", "Space Opera": "f-space", "Every Ownership Kind": "f-kinds",
       "An Empty Folder": "f-empty", "Fantasy": "f-fantasy"}


def exists(app, name):
    """Is the folder still in the left pane's tree? (Space Opera shows there: its parent is expanded.)"""
    return app.page.locator(f'[data-folder-id="{IDS[name]}"]').count() > 0


def open_left(app, name):
    """Click a folder in the left pane — it opens there, and the left pane has your focus."""
    app.click_reachable(app.page.locator(f'[data-folder-id="{IDS[name]}"]'))
    app.page.wait_for_timeout(400)


def open_folders_view(app):
    app.click_reachable(app.page.locator("span.cursor-pointer", has_text=re.compile(r"^Folders$")).first)
    app.page.wait_for_timeout(400)


def select(app, *names):
    """Click the first row in the right pane, Ctrl+click the rest — the right pane has your focus."""
    for i, n in enumerate(names):
        row = app.page.locator("tbody tr", has_text=n).first
        row.click(modifiers=["Control"] if i else None)
    app.page.wait_for_timeout(250)


def press_delete(app):
    app.page.keyboard.press("Delete")
    app.page.wait_for_timeout(500)


def box(app):
    """The confirmation's words, or None when no box is up."""
    ov = app.page.locator(".rw-imperative-overlay")
    return ov.first.inner_text() if ov.count() else None


def answer(app, label):
    app.page.locator(".rw-imperative-overlay").get_by_role("button", name=label, exact=True).click()
    app.page.wait_for_timeout(500)


def toast(app):
    """The toast's words — waiting (up to 3 s) for one to be on screen: a condition, not a fixed sleep (TESTING.md §7)."""
    t = app.page.locator(".clipboard-toast")
    try:
        t.first.wait_for(state="visible", timeout=3000)
    except Exception:   # noqa: BLE001 — no toast is an answer too ("")
        return ""
    return t.first.inner_text()


def undo(app):
    app.page.keyboard.press("Control+z")
    app.page.wait_for_timeout(600)


def right_rows(app):
    rows = app.page.locator("tbody tr")
    return [rows.nth(i).inner_text() for i in range(rows.count())]


def calm(app):
    """Between rows: close any box, clear the selection (Esc)."""
    if box(app):
        answer(app, "Cancel")
    app.page.keyboard.press("Escape")
    app.page.wait_for_timeout(200)
    # (No waiting for the last toast to run its course, on purpose: until 7.28.1 an older toast's timers hid a NEWER toast
    # early — an Undo, then a Delete a second later, and the Delete's receipt vanished. DELKEY-011 caught it.)


ALL = ["Science Fiction", "Space Opera", "Every Ownership Kind", "An Empty Folder", "Fantasy"]

with App() as app:
    app.restore(FIXTURE)
    app.menu("View", "List View").click()

    def baseline():
        check(all(exists(app, n) for n in ALL), f"setup: a folder is missing before the row: "
                                                f"{[n for n in ALL if not exists(app, n)]}")

    def one_subfolder():
        try:
            baseline()
            open_left(app, "Science Fiction")
            select(app, "Space Opera")
            press_delete(app)
            words = box(app)
            check(words is not None, "no confirmation came up for a folder with a subfolder and books")
            check('Delete "Space Opera"' in words and 'Delete "Science Fiction"' not in words,
                  f"the confirmation should name the SELECTED folder, Space Opera — it said: {words!r}")
            answer(app, "Delete")
            check(not exists(app, "Space Opera"), "Space Opera is still there after Delete")
            check(exists(app, "Science Fiction"), "Science Fiction — the folder you were in — was deleted")
            rows = right_rows(app)
            check(any("Deep in the Folders" in r for r in rows),
                  "Old Favorites' books should have returned to Science Fiction (the folder you're in)")
            undo(app)
            check(exists(app, "Space Opera"), "Ctrl+Z didn't bring Space Opera back")
        finally:
            calm(app)
    test("DELKEY-001", "one subfolder selected in the right pane: the confirmation names IT (not the folder you're in); "
         "Delete removes only it, its books return to the folder you're in; Ctrl+Z brings it back", one_subfolder)

    def nothing_selected():
        try:
            baseline()
            open_left(app, "An Empty Folder")
            app.page.mouse.click(900, 600)        # a click in the right pane's empty area: your focus is there now
            app.page.wait_for_timeout(200)
            press_delete(app)
            check(box(app) is None, f"a box came up with nothing selected: {box(app)!r}")
            check(exists(app, "An Empty Folder"),
                  "the empty folder you were IN was deleted with no question — nothing was selected")
        finally:
            if not exists(app, "An Empty Folder"):
                undo(app)
            calm(app)
    test("DELKEY-002", "nothing selected, focus in the right pane: Delete does nothing — not even to the empty folder "
         "you're in (was: deleted with no question)", nothing_selected)

    def left_focus():
        try:
            baseline()
            open_left(app, "An Empty Folder")      # the left pane has your focus; the folder is highlighted there
            press_delete(app)
            check(box(app) is None, f"an empty folder asks nothing (nothing to lose; Ctrl+Z): {box(app)!r}")
            check(not exists(app, "An Empty Folder"), "Delete with the left pane's focus didn't delete its folder")
            check('Deleted "An Empty Folder"' in toast(app), f"the receipt: {toast(app)!r}")
            undo(app)
            check(exists(app, "An Empty Folder"), "Ctrl+Z didn't bring it back")
        finally:
            if not exists(app, "An Empty Folder"):
                undo(app)
            calm(app)
    test("DELKEY-003", "the left pane has your focus: Delete deletes the folder highlighted there (an empty one with no "
         "question, and says so); Ctrl+Z brings it back", left_focus)

    def several():
        try:
            baseline()
            open_folders_view(app)
            select(app, "Every Ownership Kind", "An Empty Folder")
            press_delete(app)
            words = box(app)
            check(words is not None, "no confirmation for several folders (in the Folders view Delete did nothing)")
            check("Every Ownership Kind" in words and "An Empty Folder" in words,
                  f"the confirmation should list both folders: {words!r}")
            answer(app, "Delete")
            check(not exists(app, "Every Ownership Kind") and not exists(app, "An Empty Folder"),
                  "both folders should be gone")
            check(exists(app, "Fantasy") and exists(app, "Science Fiction"), "an unselected folder went too")
            undo(app)                              # ONE Ctrl+Z for the lot
            check(exists(app, "Every Ownership Kind") and exists(app, "An Empty Folder"),
                  "one Ctrl+Z should bring BOTH folders back")
        finally:
            for _ in range(2):
                if not (exists(app, "Every Ownership Kind") and exists(app, "An Empty Folder")):
                    undo(app)
            calm(app)
    test("DELKEY-004", "several folders selected (the Folders view): one confirmation listing them, Delete removes them "
         "all, one Ctrl+Z brings them all back", several)

    def cancel():
        try:
            baseline()
            open_folders_view(app)
            select(app, "Every Ownership Kind", "An Empty Folder")
            press_delete(app)
            check(box(app) is not None, "no confirmation came up")
            answer(app, "Cancel")
            check(all(exists(app, n) for n in ALL), "Cancel still deleted something")
        finally:
            calm(app)
    test("DELKEY-005", "Cancel at the confirmation changes nothing", cancel)

    def inbox():
        try:
            baseline()
            open_folders_view(app)
            select(app, "Inbox")
            press_delete(app)
            check(box(app) is None, f"a box came up for the Inbox: {box(app)!r}")
            check("The Inbox can't be deleted" in toast(app), f"the Inbox alone: the toast should say why — {toast(app)!r}")
            calm(app)
            select(app, "Inbox", "An Empty Folder")
            press_delete(app)
            check(not exists(app, "An Empty Folder"), "the folder selected with the Inbox wasn't deleted")
            check(any("Inbox" in r for r in right_rows(app)), "the Inbox is gone from the Folders view")
            check("The Inbox stays" in toast(app), f"the receipt should say the Inbox stays: {toast(app)!r}")
            undo(app)
            check(exists(app, "An Empty Folder"), "Ctrl+Z didn't bring it back")
        finally:
            if not exists(app, "An Empty Folder"):
                undo(app)
            calm(app)
    test("DELKEY-006", "the Inbox is never deleted: alone, Delete says why; with a folder, the folder goes and the "
         "receipt says the Inbox stays", inbox)

    def menu_delete():
        try:
            baseline()
            open_folders_view(app)
            select(app, "Every Ownership Kind", "An Empty Folder")
            app.page.locator("tbody tr", has_text="An Empty Folder").first.click(button="right")
            item = app.page.get_by_role("menuitem", name=re.compile(r"Delete Folder"))
            item.first.wait_for(timeout=5000)
            label = item.first.inner_text()
            check("(2)" in label, f"the menu item should say it acts on the 2 selected folders: {label!r}")
            item.first.click()
            app.page.wait_for_timeout(400)
            words = box(app)
            check(words and "Every Ownership Kind" in words and "An Empty Folder" in words,
                  f"the menu's Delete should ask about BOTH selected folders, as the key does: {words!r}")
            answer(app, "Delete")
            check(not exists(app, "Every Ownership Kind") and not exists(app, "An Empty Folder"), "not both deleted")
            undo(app)
            check(exists(app, "Every Ownership Kind") and exists(app, "An Empty Folder"), "one Ctrl+Z, both back")
        finally:
            for _ in range(2):
                if not (exists(app, "Every Ownership Kind") and exists(app, "An Empty Folder")):
                    undo(app)
            calm(app)
    test("DELKEY-007", "the right-click Delete on one of several selected folders acts on all of them, through the same "
         "confirmation as the key (one operation for every way in)", menu_delete)

    def undo_keeps_parent_books():
        try:
            # A variant of the fixture where "A Book With No Description" is in Space Opera too — it is already in Science
            # Fiction, Space Opera's parent. (Restored from a file: a copy-paste would also trip the second keyboard
            # handler's folder clipboard — TODO "One table…", the survey's 2026-11-06 finding.)
            data = json.load(open(FIXTURE, encoding="utf-8"))
            space = next(f for f in data["organization"]["folders"] if f["id"] == "f-space")
            space["bookIds"] = ["TST0000018"]
            folder = tempfile.mkdtemp(prefix="rw-delkey-")
            variant = os.path.join(folder, "delkey-variant.json")
            with open(variant, "w", encoding="utf-8") as fh:
                json.dump(data, fh)
            try:
                app.restore(variant)
            finally:
                shutil.rmtree(folder, ignore_errors=True)
            app.menu("View", "List View").click()
            baseline()
            open_left(app, "Space Opera")
            check(any("A Book With No Description" in r for r in right_rows(app)), "setup: the book in Space Opera")
            open_left(app, "Science Fiction")
            check(any("A Book With No Description" in r for r in right_rows(app)), "setup: the book in Science Fiction")
            select(app, "Space Opera")
            press_delete(app)
            answer(app, "Delete")
            undo(app)
            check(exists(app, "Space Opera"), "Ctrl+Z didn't bring Space Opera back")
            open_left(app, "Science Fiction")
            check(any("A Book With No Description" in r for r in right_rows(app)),
                  "after Ctrl+Z the book left Science Fiction — it was there BEFORE the delete (the undo took out every "
                  "book the deleted folder held, not just the ones the delete had added)")
        finally:
            calm(app)
            app.restore(FIXTURE)                   # back to the plain fixture for the rows after
            app.menu("View", "List View").click()
    test("DELKEY-008", "Ctrl+Z after deleting a subfolder leaves the folder you're in as it was — a book that was in "
         "both stays", undo_keeps_parent_books)

    def books_first():
        try:
            baseline()
            open_left(app, "Science Fiction")
            # "Written Together" is in Fantasy too, so leaving Science Fiction isn't its last folder (no Trash, no box)
            select(app, "Space Opera", "Written Together")
            press_delete(app)
            check(box(app) is None, f"a box came up: {box(app)!r}")
            check(exists(app, "Space Opera"), "the folder went too — with books selected, Delete acts on the books")
            check(not any("Written Together" in r for r in right_rows(app)),
                  "the selected book didn't leave the folder")
            undo(app)
            check(any("Written Together" in r for r in right_rows(app)), "Ctrl+Z didn't put the book back")
        finally:
            calm(app)
    test("DELKEY-009", "books and folders selected: Delete acts on the books (decided order: books first), the folders "
         "stay", books_first)

    def book_list():
        try:
            app.click_reachable(app.page.get_by_text("Read Next", exact=True).first)
            app.page.wait_for_timeout(400)
            before = right_rows(app)
            check(len(before) > 0, "setup: Read Next has books")
            title = before[0].split("\n")[1] if "\n" in before[0] else before[0]
            app.page.locator("tbody tr").first.click()
            app.page.wait_for_timeout(200)
            press_delete(app)
            check(len(right_rows(app)) == len(before) - 1, "the book didn't leave the Book List")
            said = toast(app)
            check("Removed" in said and "Read Next" in said,
                  f"Delete in a Book List should say what it did, as the menu's Remove does: {said!r} "
                  f"(log: {app.console_matching(r' · (MOVE|ORG) · ')[-2:]})")
            undo(app)
            check(len(right_rows(app)) == len(before), f"Ctrl+Z didn't put {title!r} back on the list")
        finally:
            calm(app)
    test("DELKEY-011", "Delete in a Book List takes the book off that list only, says so (was: silent), Ctrl+Z puts it back",
         book_list)

    test("DELKEY-010", "no unexpected console messages",
         lambda: check(not app.unexpected_console(), app.unexpected_console()))

done()
