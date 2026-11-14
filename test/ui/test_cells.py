# Screen test: every cell of the one table's move / copy / paste rows (docs/design/ONE-TABLE.md §4–§5), tried with real
# keys, clicks and drags — what each gesture does to the library, the words it says, and one Ctrl+Z.
# tags: move, copy, paste, folders, booklists, trash, undo, keyboard, drag, tier 2
# covers: readerwrangler.js
# Run: py tools/run_tests.py --id CELL-001     (or --tier 2; or directly with the venv's Python)
#
# Sprint 4, step 2 (Ron, 2026-11-13): "A screen test that tries every cell of §4–§5 and records today's answer" — the
# LOGGING.md pattern, PASTE-001–009 its first slice. Each cell asserts the DECIDED behavior (ONE-TABLE.md §4–§6; TODO
# "Move and copy books anywhere" decisions 1–11), so it fails today wherever today differs and passes once the table is
# built (test-first). A cell that differs today has its measured words in the TODAY table below (differs_today in
# harness.py): it is reported, not failed — and it FAILS if it starts passing (drop its line) or fails some other way.
# RW_CELLS=CELL-005,CELL-019 runs just those cells (while building a row).
# A cell whose decided behavior isn't written anywhere records TODAY's behavior instead, and says so in its name
# ("today's, not decided") — those are listed in the sprint's report for Ron, never guessed.
#
# What each cell checks, in one AssertionError listing every difference:
#   1. membership — what changed in every folder, Book List and the Trash, against the decided change;
#   2. the words — the receipt (or refusal) holds the decided words (quotes normalized: "x" and 'x' read the same);
#   3. one Ctrl+Z puts the library back EXACTLY (each folder's books in their order, the lists, the Trash, every folder's
#      parent) — and a second Ctrl+Z finds nothing more of this gesture to undo ("one undo step per gesture, always").
#      A cell that decides "nothing changes" still presses Ctrl+Z once: it must not change anything either.
# Between cells: Esc (clears the selection and both clipboards); a cell that left the library different from the
# fixture restores the fixture (which also empties the undo history).
#
# The fixture (test/fixtures/make-small-fixture.js) — books by ASIN number (TST00000NN → NN):
#   Inbox: 22 New Arrival One, 23 New Arrival Two        Fantasy (pinned): 5 Good Omens; ⊃ The Test Saga: 1 2 4 3
#   Science Fiction: 17 A Hidden Book, 18 A Book With No Description, 5 Good Omens; ⊃ Space Opera (no books)
#     ⊃ Old Favorites: 20 Deep in the Folders, 19 A Book With a Note
#   Every Ownership Kind: 6–16; An Empty Folder; Book Lists: Read Next 3 20 16, An Empty Book List
#   Trash: 21 A Book in the Trash (was in Science Fiction). Searches: The Saga ("Test Saga"), Tagged Read.
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, differs_today, done, test   # noqa: E402
from rw import FIXTURE, App                            # noqa: E402

ND = "A Book With No Description"     # 18 — Science Fiction only
GO = "Good Omens"                     # 5 — Fantasy AND Science Fiction
S1 = "The Test Saga, Book One"        # 1 — The Test Saga only
S3 = "The Test Saga, Book Three"      # 3 — The Test Saga, and on Read Next
NA1 = "New Arrival One"               # 22 — the Inbox only
TR = "A Book in the Trash"            # 21
FOLDER_IDS = {"Fantasy": "f-fantasy", "The Test Saga": "f-saga", "Science Fiction": "f-scifi", "Space Opera": "f-space",
              "Old Favorites": "f-old", "Every Ownership Kind": "f-kinds", "An Empty Folder": "f-empty"}

STATE_JS = """() => {
    let org = {};
    try { org = JSON.parse(localStorage.getItem('readerwrangler-state') || '{}').organization || {}; } catch (e) {}
    return {
        folders: window.folders.map(f => ({ id: f.id, name: f.name, parent: f.parentId || null, books: [...(f.bookIds || [])] })),
        lists: (org.bookLists || []).map(l => ({ id: l.id, name: l.name, books: [...(l.bookIds || [])] })),
        trashed: window.books.filter(b => b.isDeleted).map(b => b.id).sort(),
    };
}"""


def short(asin):
    return int(asin[3:]) if asin.startswith("TST") else asin


def norm(text):
    return re.sub(r"[\"“”‘’]", "'", text or "")


def delta(a, b):
    """What changed from state a to state b, in words keyed by place: {'Science Fiction': '-18', 'Fantasy': '+18',
    'Space Opera ⇒': 'Fantasy', 'new Space Opera (Copy)': 'in Fantasy', 'Trash': '-21'}. Order isn't a change here."""
    out = {}

    def ids(x, y):   # every book in the fixture is TST…, so short() is always a number
        plus = sorted(short(i) for i in set(y) - set(x))
        minus = sorted(short(i) for i in set(x) - set(y))
        return " ".join([f"+{i}" for i in plus] + [f"-{i}" for i in minus])
    fa, fb = {f["id"]: f for f in a["folders"]}, {f["id"]: f for f in b["folders"]}
    pname = lambda fs, pid: fs[pid]["name"] if pid in fs else "top level"   # noqa: E731
    for fid in fa.keys() & fb.keys():
        if set(fa[fid]["books"]) != set(fb[fid]["books"]):
            out[fb[fid]["name"]] = ids(fa[fid]["books"], fb[fid]["books"])
        if fa[fid]["parent"] != fb[fid]["parent"]:
            out[fb[fid]["name"] + " ⇒"] = pname(fb, fb[fid]["parent"])
    for fid in fb.keys() - fa.keys():
        f = fb[fid]
        books = " ".join(str(short(i)) for i in sorted(f["books"]))
        out["new " + f["name"]] = f"in {pname(fb, f['parent'])}" + (f": {books}" if books else "")
    for fid in fa.keys() - fb.keys():
        out["gone " + fa[fid]["name"]] = ""
    la, lb = {x["id"]: x for x in a["lists"]}, {x["id"]: x for x in b["lists"]}
    for lid in la.keys() | lb.keys():
        x, y = la.get(lid, {"books": []}), lb.get(lid, {"books": []})
        if set(x["books"]) != set(y["books"]):
            out[(lb.get(lid) or la.get(lid))["name"]] = ids(x["books"], y["books"])
    if a["trashed"] != b["trashed"]:
        out["Trash"] = ids(a["trashed"], b["trashed"])
    return out


def not_exactly(a, b):
    """Every way state b differs from state a — membership AND each folder's / list's order — in words."""
    out = [f"{k}: {v}" for k, v in sorted(delta(a, b).items())]
    fa, fb = {f["id"]: f for f in a["folders"]}, {f["id"]: f for f in b["folders"]}
    for fid in fa.keys() & fb.keys():
        if set(fa[fid]["books"]) == set(fb[fid]["books"]) and fa[fid]["books"] != fb[fid]["books"]:
            out.append(f"order of '{fa[fid]['name']}': {[short(i) for i in fa[fid]['books']]} → "
                       f"{[short(i) for i in fb[fid]['books']]}")
    la, lb = {x["id"]: x for x in a["lists"]}, {x["id"]: x for x in b["lists"]}
    for lid in la.keys() & lb.keys():
        if set(la[lid]["books"]) == set(lb[lid]["books"]) and la[lid]["books"] != lb[lid]["books"]:
            out.append(f"order of '{la[lid]['name']}': {[short(i) for i in la[lid]['books']]} → "
                       f"{[short(i) for i in lb[lid]['books']]}")
    return out


with App() as app:
    page = app.page

    def state():
        """The library, read once the screen has settled (two equal readings 150 ms apart — a condition, not a sleep)."""
        last = page.evaluate(STATE_JS)
        for _ in range(20):
            page.wait_for_timeout(150)
            now = page.evaluate(STATE_JS)
            if now == last:
                return now
            last = now
        return last

    def restore_fixture():
        app.restore(FIXTURE)
        app.menu("View", "List View").click()

    restore_fixture()
    BASE = state()
    _mark = [0]

    def mark():
        """The gesture's last step starts here: its words are the messages after this point."""
        _mark[0] = len(app.console)

    def go(place):
        target = (page.locator(f'[data-folder-id="{FOLDER_IDS[place]}"]') if place in FOLDER_IDS
                  else page.locator("[data-left-pane]").get_by_text(place, exact=True))
        # Park the pointer off the left pane first: a hovered subfolder row shows its + / × buttons, which wrap a long
        # name ("The Test Saga", 36 → 60 px) — moving off it shifts every row below while the click is aimed (7.30.0: seen
        # once exact undo stopped forcing a fixture restore after CELL-004; the layout jump is filed, not fixed here).
        page.mouse.move(900, 600)
        page.wait_for_timeout(100)
        app.click_reachable(target.first)
        page.wait_for_timeout(400)

    def select(*titles):
        """Click the first row, Ctrl+click the rest; wait until the screen shows them selected, then a moment for the
        key listeners to catch up (they re-register after the selection renders — a key pressed sooner can miss it)."""
        for i, t in enumerate(titles):
            page.locator("tbody tr", has_text=t).first.click(modifiers=["Control"] if i else None)
        page.wait_for_function(f"() => document.querySelectorAll('tbody tr.bg-blue-50').length === {len(titles)}",
                               timeout=3000)
        page.wait_for_timeout(250)

    def pick(place, *titles):
        go(place)
        select(*titles)

    def key(k):
        page.keyboard.press(f"Control+{k}")
        page.wait_for_timeout(300)

    def paste_key(place):
        go(place)
        mark()
        key("v")

    def paste_menu(place, row_title):
        go(place)
        page.locator("tbody tr", has_text=row_title).first.click(button="right")
        item = page.get_by_role("menu", name="Book options").get_by_text(re.compile(r"^Paste \(\d+\)$"))
        item.first.wait_for(timeout=3000)
        mark()
        app.click_reachable(item.first)

    def book_menu(title, trigger, submenu, target):
        """Right-click a (selected) row → hover a submenu → click a target in it."""
        page.locator("tbody tr", has_text=title).first.click(button="right")
        menu = page.get_by_role("menu", name="Book options")
        menu.wait_for(timeout=3000)
        app.hover(menu.locator(".submenu-trigger", has_text=trigger).first)
        sub = page.locator(f'[aria-label="{submenu}"]')
        sub.wait_for(timeout=3000)
        mark()
        app.click_reachable(sub.get_by_text(target, exact=True).first)

    def drag(title, to, ctrl=False):
        src = page.locator("tbody tr", has_text=title).first
        # A left-pane entry's label is pointer-events:none (the drop lands on its row): aim at the row, not the label.
        dst = (page.locator(f'[data-folder-id="{FOLDER_IDS[to]}"]') if to in FOLDER_IDS
               else page.locator("[data-left-pane]").get_by_text(to, exact=True).locator("xpath=..")).first
        mark()
        if ctrl:
            page.keyboard.down("Control")
        try:
            src.drag_to(dst, timeout=10_000)
        finally:
            if ctrl:
                page.keyboard.up("Control")

    def folder_menu(folder, item, target=None):
        """Right-click a folder in the left pane → an item (Cut / Copy / Paste), or Move to › a target."""
        page.locator(f'[data-folder-id="{FOLDER_IDS[folder]}"]').first.click(button="right")
        menu = page.get_by_role("menu", name="Folder options")
        menu.wait_for(timeout=3000)
        if target is None:
            mark()
            app.click_reachable(menu.get_by_text(item, exact=True).first)
        else:
            app.hover(menu.locator(".submenu-trigger", has_text=item).first)
            sub = page.locator('[aria-label="Move to folder"]')
            sub.wait_for(timeout=3000)
            mark()
            app.click_reachable(sub.get_by_text(target, exact=True).first)

    def words():
        """Every message the gesture's last step showed (toasts and boxes), joined — waiting up to 3 s for the first."""
        def lines():
            return [re.sub(r"^\w+ · [A-Z]+(?:-\d+)? · ", "", x) for _, x in app.console[_mark[0]:]
                    if re.match(r"^(info|warning|error) · ", x) and " · UNDO · " not in x]
        for _ in range(30):
            if lines() or page.locator(".rw-imperative-overlay").count():
                break
            page.wait_for_timeout(100)
        page.wait_for_timeout(300)
        box = page.locator(".rw-imperative-overlay")
        boxed = [f"[box: {box.first.inner_text().strip()}]"] if box.count() else []
        return " | ".join(lines() + boxed)

    def undo_once():
        """Ctrl+Z; returns what it said it undid ('' = nothing)."""
        n0 = len(app.console)
        page.keyboard.press("Control+z")
        page.wait_for_timeout(500)
        return " | ".join(x for _, x in app.console[n0:] if " · UNDO · Undone:" in x)

    def clean_up():
        if page.locator(".rw-imperative-overlay").count():
            btn = page.locator(".rw-imperative-overlay").get_by_role("button", name=re.compile("^(Cancel|OK)$"))
            if btn.count():
                btn.first.click()
        page.keyboard.press("Escape")
        page.wait_for_timeout(200)
        filters = page.get_by_title("Clear all active filters")
        if filters.count() and filters.first.is_visible():
            filters.first.click()
        if not_exactly(BASE, state()):
            restore_fixture()

    def cell(gesture, decided, says=(), answer=None):
        """Run one cell. gesture(): the keys / clicks / drag (calls mark() before its last step). decided: the change
        decided for it ({} = nothing changes). says: words the receipt must hold. answer: a box's button to press."""
        def run():
            problems = []
            try:
                before = state()
                gesture()
                said = words()
                if answer and page.locator(".rw-imperative-overlay").count():
                    page.locator(".rw-imperative-overlay").get_by_role("button", name=answer, exact=True).click()
                    page.wait_for_timeout(400)
                after = state()
                got = delta(before, after)
                if got != decided:
                    problems.append(f"changed {got}; decided {decided}")
                for s in says:
                    if norm(s) not in norm(said):
                        problems.append(f"the words should say {s!r}")
                undone = undo_once()
                back = not_exactly(before, state())
                if back:
                    problems.append(f"one Ctrl+Z ({undone or 'nothing to undo'}) left: {'; '.join(back)}")
                elif got:
                    more = undo_once()
                    if more:
                        problems.append(f"a second Ctrl+Z still undid something: {more}")
                if problems:
                    raise AssertionError("\n".join(problems + [f"said: {said!r}"]))
            finally:
                clean_up()
        return run

    ONLY = [x.strip() for x in os.environ.get("RW_CELLS", "").split(",") if x.strip()]   # e.g. RW_CELLS=CELL-005,CELL-019

    # TODAY — what each cell that differs from the design does today, measured 2026-11-13 (7.29.1, branch
    # feature/one-table): words its failure must contain (differs_today). When a cell starts doing what was decided, its
    # line goes; when it changes some other way, the test fails and says so.
    # 7.30.0 (sprint 4, the keys + exact undo + the folder copy): CELL-001–017, 034–040, 049–052, 055 now do what was
    # decided — their lines are gone. What's left is the menus' and drags' (the next step of the sprint).
    TODAY = {
        "CELL-018": ["said: \"Moved 'A Book With No Description' to 'Fantasy'\""],
        "CELL-019": ["said: \"Moved 'A Book With No Description' to 'Fantasy'\"", "left: Science Fiction: -5"],
        "CELL-020": ["said: 'Book already in folder'"],
        "CELL-021": ["changed {'Fantasy': '+3'}", "said: \"Moved 'The Test Saga, Book Three' to 'Fantasy'\""],
        "CELL-022": ["Move to is greyed here (tooltip 'Cannot move books from virtual folders')"],
        "CELL-024": ["said: \"Moved 'A Book With No Description' to 'Fantasy'\""],
        "CELL-025": ["said: \"Copied 'A Book With No Description' to 'Fantasy'\""],
        "CELL-026": ["said: \"Moved 'A Book With No Description' to 'Fantasy'\"", "left: Science Fiction: -5"],
        "CELL-028": ["to \"An Empty Book List\"", "order of 'Read Next': [3, 20, 16] → [20, 16, 3]"],
        "CELL-030": ["said: \"Moved 'The Test Saga, Book Three' to 'Fantasy'\""],
        "CELL-033": ["said: \"Moved 'A Book With No Description' to 'Fantasy'\""],   # decided 2026-11-13 (§6 item 16)
        "CELL-041": ["said: \"Copied 'A Book With No Description' to 'Fantasy'\""],
        "CELL-042": ["said: \"Copied 'A Book With No Description' to 'Fantasy'\""],
        "CELL-043": ["said: \"Copied 'A Book With No Description' to 'Fantasy'\""],
        "CELL-045": ["said: \"Added 1 book to 'Read Next' (1 already there)\""],
        "CELL-046": ["said: \"All 1 book already in 'Read Next'\""],
        "CELL-057": ["said: \"Moved folder 'Space Opera' + 'A Book With No Description' to 'Fantasy'\""],   # §6 items 14, 17
    }

    def add(tid, name, fn):
        if ONLY and tid not in ONLY:
            return
        (differs_today(tid, name, fn, TODAY[tid]) if tid in TODAY else test(tid, name, fn))

    # ── 4.1 Move — Ctrl+X, then Ctrl+V ─────────────────────────────────────────────────────────────────────────────
    add("CELL-001", "Ctrl+X → Ctrl+V, one book, folder → folder: out of the source, into the destination; "
        "\"Moved … from … to …\"",
        cell(lambda: (pick("Science Fiction", ND), key("x"), paste_key("Fantasy")),
             {"Science Fiction": "-18", "Fantasy": "+18"}, ["Moved", "from 'Science Fiction'", "to 'Fantasy'"]))
    add("CELL-002", "Ctrl+X → Ctrl+V, one book, folder → the Inbox",
        cell(lambda: (pick("Science Fiction", ND), key("x"), paste_key("Inbox")),
             {"Science Fiction": "-18", "Inbox": "+18"}, ["Moved", "from 'Science Fiction'", "to 'Inbox'"]))
    add("CELL-003", "Ctrl+X → Ctrl+V, one book, the Inbox → a folder",
        cell(lambda: (pick("Inbox", NA1), key("x"), paste_key("Fantasy")),
             {"Inbox": "-22", "Fantasy": "+22"}, ["Moved", "from 'Inbox'", "to 'Fantasy'"]))
    add("CELL-004", "Ctrl+X → Ctrl+V, one book, folder → a subfolder (The Test Saga)",
        cell(lambda: (pick("Science Fiction", ND), key("x"), paste_key("The Test Saga")),
             {"Science Fiction": "-18", "The Test Saga": "+18"}, ["Moved", "to 'The Test Saga'"]))
    add("CELL-005", "Ctrl+X → Ctrl+V, two books, ONE already in the destination: both leave the source, the other "
        "arrives; \"(1 was already there)\"",
        cell(lambda: (pick("Science Fiction", ND, GO), key("x"), paste_key("Fantasy")),
             {"Science Fiction": "-5 -18", "Fantasy": "+18"}, ["Moved 2 books", "(1 was already there)"]))
    add("CELL-006", "Ctrl+X → Ctrl+V, one book ALREADY in the destination: it still leaves the source; "
        "\"… already in 'Fantasy'\"",
        cell(lambda: (pick("Science Fiction", GO), key("x"), paste_key("Fantasy")),
             {"Science Fiction": "-5"}, ["out of 'Science Fiction'", "already in 'Fantasy'"]))
    add("CELL-007", "Ctrl+X → Ctrl+V back into the SAME folder: nothing changes; \"Nothing moved — … already in …\"",
        cell(lambda: (pick("Science Fiction", ND), key("x"), paste_key("Science Fiction")),
             {}, ["Nothing moved", "already in 'Science Fiction'"]))
    add("CELL-008", "Ctrl+X → Ctrl+V into All Books: refused, with the reason; nothing changes",
        cell(lambda: (pick("Science Fiction", ND), key("x"), paste_key("All Books")),
             {}, ["Every book is already in All Books"]))
    add("CELL-009", "Ctrl+X → Ctrl+V, Book List → folder: off the list, into the folder",
        cell(lambda: (pick("Read Next", S3), key("x"), paste_key("Fantasy")),
             {"Read Next": "-3", "Fantasy": "+3"}, ["Moved", "from 'Read Next'", "to 'Fantasy'"]))
    add("CELL-010", "Ctrl+X → Ctrl+V, Book List → Book List: off the first, onto the second",
        cell(lambda: (pick("Read Next", S3), key("x"), paste_key("An Empty Book List")),
             {"Read Next": "-3", "An Empty Book List": "+3"}, ["Moved", "from 'Read Next'", "to 'An Empty Book List'"]))
    add("CELL-011", "Ctrl+X → Ctrl+V back into the SAME Book List: nothing changes; \"Nothing moved — … on 'Read Next'\"",
        cell(lambda: (pick("Read Next", S3), key("x"), paste_key("Read Next")),
             {}, ["Nothing moved", "on 'Read Next'"]))
    add("CELL-012", "Ctrl+X in All Books → Ctrl+V in a folder: re-filed (out of its one folder, into this one)",
        cell(lambda: (pick("All Books", S1), key("x"), paste_key("Inbox")),
             {"The Test Saga": "-1", "Inbox": "+1"}, ["Moved"]))

    def from_a_search():
        go("All Books")
        app.click_reachable(page.locator("[data-left-pane]").get_by_text("The Saga", exact=True).first)
        page.wait_for_timeout(500)
        select(S1)
        key("x")
        page.get_by_title("Clear all active filters").first.click()
        paste_key("Inbox")
    add("CELL-013", "Ctrl+X with a Search applied (All Books, \"The Saga\") → Ctrl+V in a folder: re-filed, as from All "
        "Books", cell(from_a_search, {"The Test Saga": "-1", "Inbox": "+1"}, ["Moved"]))
    add("CELL-014", "Ctrl+X in the Trash → Ctrl+V in a folder: a RESTORE into that folder; \"Restored … from the Trash "
        "into 'Fantasy'\"",
        cell(lambda: (pick("Trash", TR), key("x"), paste_key("Fantasy")),
             {"Trash": "-21", "Fantasy": "+21"}, ["Restored", "from the Trash", "into 'Fantasy'"]))
    add("CELL-015", "Ctrl+X → the right-click menu's Paste (no second keyboard listener): the same as Ctrl+V",
        cell(lambda: (pick("Science Fiction", ND), key("x"), paste_menu("Fantasy", GO)),
             {"Science Fiction": "-18", "Fantasy": "+18"}, ["Moved", "from 'Science Fiction'", "to 'Fantasy'"]))

    def second_paste():
        pick("Science Fiction", ND)
        key("x")
        paste_key("Fantasy")
        words()
        mark()
        paste_key("Every Ownership Kind")             # a cut pastes once: this Ctrl+V has nothing to paste
    add("CELL-016", "after a cut book is pasted, a SECOND Ctrl+V elsewhere does nothing (a cut pastes once; the keys "
        "read the selection — never the folder you were in)",
        cell(second_paste, {"Science Fiction": "-18", "Fantasy": "+18"}))

    def nothing_selected_cut():
        go("Science Fiction")
        page.mouse.click(900, 600)                     # the right pane's empty area: nothing selected
        page.wait_for_timeout(250)
        key("x")
        paste_key("Every Ownership Kind")
    add("CELL-017", "Ctrl+X with NOTHING selected in a folder, then Ctrl+V elsewhere: nothing happens (the keys read "
        "the selection — never the folder you're in)", cell(nothing_selected_cut, {}))

    # ── 4.1 Move — right-click Move to › ──────────────────────────────────────────────────────────────────────────
    add("CELL-018", "Move to ›, one book, folder → folder",
        cell(lambda: (pick("Science Fiction", ND), book_menu(ND, "Move to", "Move to folder", "Fantasy")),
             {"Science Fiction": "-18", "Fantasy": "+18"}, ["Moved", "from 'Science Fiction'", "to 'Fantasy'"]))
    add("CELL-019", "Move to ›, two books, one already in the destination: both leave the source; \"(1 was already "
        "there)\"; one Ctrl+Z puts BOTH back",
        cell(lambda: (pick("Science Fiction", ND, GO), book_menu(ND, "Move to", "Move to folder", "Fantasy")),
             {"Science Fiction": "-5 -18", "Fantasy": "+18"}, ["Moved 2 books", "(1 was already there)"]))
    add("CELL-020", "Move to › the folder it's already in: nothing changes; \"Nothing moved — … already in …\"",
        cell(lambda: (pick("Science Fiction", ND), book_menu(ND, "Move to", "Move to folder", "Science Fiction")),
             {}, ["Nothing moved", "already in 'Science Fiction'"]))
    add("CELL-021", "Move to ›, Book List → folder: off the list, into the folder",
        cell(lambda: (pick("Read Next", S3), book_menu(S3, "Move to", "Move to folder", "Fantasy")),
             {"Read Next": "-3", "Fantasy": "+3"}, ["Moved", "from 'Read Next'", "to 'Fantasy'"]))

    def move_to_offers(place, title, wanted, offered=True):
        """Move to › is enabled here, and lists `wanted` (offered=False: does NOT list it)."""
        def run():
            try:
                pick(place, title)
                page.locator("tbody tr", has_text=title).first.click(button="right")
                menu = page.get_by_role("menu", name="Book options")
                menu.wait_for(timeout=3000)
                trig = menu.get_by_role("menuitem").filter(has_text=re.compile(r"Move to")).first
                disabled = trig.get_attribute("aria-disabled") == "true"
                check(not disabled, f"Move to is greyed here (tooltip {trig.get_attribute('title')!r})")
                app.hover(trig)
                sub = page.locator('[aria-label="Move to folder"]')
                sub.wait_for(timeout=3000)
                found = sub.get_by_text(wanted, exact=True).count()
                if offered:
                    check(found, f"Move to › doesn't offer {wanted!r} (it lists: {sub.inner_text()[:200]!r})")
                else:
                    check(not found, f"Move to › offers {wanted!r} (it lists: {sub.inner_text()[:200]!r})")
            finally:
                clean_up()
        return run
    add("CELL-022", "Move to › in All Books: offered (a move from All Books re-files the book)",
        move_to_offers("All Books", ND, "Fantasy"))
    add("CELL-023", "Move to › stays folders only — it doesn't list the Book Lists (\"Add to Book List ›\" puts books on a "
        "list; §6 item 19, decided 2026-11-13)",
        move_to_offers("Science Fiction", ND, "Read Next", offered=False))

    # ── 4.1 / 4.2 — today's drags ───────────────────────────────────────────────────────────────────────────────────
    add("CELL-024", "plain drag, folder → folder (the left pane): a move",
        cell(lambda: (go("Science Fiction"), drag(ND, "Fantasy")),
             {"Science Fiction": "-18", "Fantasy": "+18"}, ["Moved", "from 'Science Fiction'", "to 'Fantasy'"]))
    add("CELL-025", "Ctrl-drag, folder → folder: a copy (\"Added\")",
        cell(lambda: (go("Science Fiction"), drag(ND, "Fantasy", ctrl=True)),
             {"Fantasy": "+18"}, ["Added", "to 'Fantasy'"]))
    add("CELL-026", "plain drag, two books with one already there, folder → folder: both leave; \"(1 was already "
        "there)\"; one Ctrl+Z puts both back",
        cell(lambda: (pick("Science Fiction", ND, GO), drag(ND, "Fantasy")),
             {"Science Fiction": "-5 -18", "Fantasy": "+18"}, ["Moved 2 books", "(1 was already there)"]))
    add("CELL-027", "plain drag, folder → a Book List (across kinds): a COPY — onto the list, the folder keeps it",
        cell(lambda: (go("Science Fiction"), drag(ND, "Read Next")),
             {"Read Next": "+18"}, ["Added", "to 'Read Next'"]))
    add("CELL-028", "plain drag, Book List → Book List (one kind): a move",
        cell(lambda: (go("Read Next"), drag(S3, "An Empty Book List")),
             {"Read Next": "-3", "An Empty Book List": "+3"}, ["Moved", "from 'Read Next'", "to 'An Empty Book List'"]))
    add("CELL-029", "Ctrl-drag, Book List → Book List: a copy",
        cell(lambda: (go("Read Next"), drag(S3, "An Empty Book List", ctrl=True)),
             {"An Empty Book List": "+3"}, ["Added", "to 'An Empty Book List'"]))
    add("CELL-030", "plain drag, Book List → folder (across kinds): a COPY — \"Added\", the list keeps it",
        cell(lambda: (go("Read Next"), drag(S3, "Fantasy")),
             {"Fantasy": "+3"}, ["Added", "to 'Fantasy'"]))
    add("CELL-031", "drag out of the Trash onto a folder: a restore into that folder",
        cell(lambda: (go("Trash"), drag(TR, "Fantasy")),
             {"Trash": "-21", "Fantasy": "+21"}, ["Restored", "'Fantasy'"]))
    add("CELL-032", "drag onto the Trash = the Delete key's books row: a book in another folder too just leaves this one",
        cell(lambda: (go("Science Fiction"), drag(GO, "Trash")),
             {"Science Fiction": "-5"}, ["Removed", "'Science Fiction'"]))
    add("CELL-033", "plain drag from All Books onto a folder = a COPY: it only adds, and says \"Added\" (a plain drag "
        "guesses safe; §6 item 16, decided 2026-11-13)",
        cell(lambda: (go("All Books"), drag(ND, "Fantasy")),
             {"Fantasy": "+18"}, ["Added", "to 'Fantasy'"]))

    # ── 4.2 Copy ────────────────────────────────────────────────────────────────────────────────────────────────────
    add("CELL-034", "Ctrl+C → Ctrl+V, one book, folder → folder: added; the source keeps it; \"Added …\"",
        cell(lambda: (pick("Science Fiction", ND), key("c"), paste_key("Fantasy")),
             {"Fantasy": "+18"}, ["Added", "to 'Fantasy'"]))
    add("CELL-035", "Ctrl+C → Ctrl+V, two books, one already there: the other is added; \"(1 was already there)\"",
        cell(lambda: (pick("Science Fiction", ND, GO), key("c"), paste_key("Fantasy")),
             {"Fantasy": "+18"}, ["Added", "(1 was already there)"]))
    add("CELL-036", "Ctrl+C → Ctrl+V, one book ALREADY there: nothing changes, \"'Good Omens' is already in 'Fantasy'\" — "
        "and Ctrl+Z after it changes nothing",
        cell(lambda: (pick("Science Fiction", GO), key("c"), paste_key("Fantasy")),
             {}, ["'Good Omens' is already in 'Fantasy'"]))
    add("CELL-037", "Ctrl+C → Ctrl+V into the SAME folder: nothing changes, \"… is already in 'Science Fiction'\"",
        cell(lambda: (pick("Science Fiction", ND), key("c"), paste_key("Science Fiction")),
             {}, ["is already in 'Science Fiction'"]))
    add("CELL-038", "Ctrl+C → Ctrl+V, Book List → folder: added to the folder; the list keeps it",
        cell(lambda: (pick("Read Next", S3), key("c"), paste_key("Fantasy")),
             {"Fantasy": "+3"}, ["Added", "to 'Fantasy'"]))

    def copy_in_trash():
        pick("Trash", TR)
        mark()
        key("c")
    add("CELL-039", "Ctrl+C in the Trash warns: \"Copied … from the Trash. Pasting it will restore it\"",
        cell(copy_in_trash, {}, ["from the Trash", "will restore"]))
    add("CELL-040", "Ctrl+C in the Trash → Ctrl+V in a folder: a RESTORE into it; \"Restored … from the Trash into "
        "'Fantasy'\"",
        cell(lambda: (pick("Trash", TR), key("c"), paste_key("Fantasy")),
             {"Trash": "-21", "Fantasy": "+21"}, ["Restored", "from the Trash", "into 'Fantasy'"]))
    add("CELL-041", "Copy to ›, one book, folder → folder: added; \"Added …\"",
        cell(lambda: (pick("Science Fiction", ND), book_menu(ND, "Copy to", "Copy to folder", "Fantasy")),
             {"Fantasy": "+18"}, ["Added", "to 'Fantasy'"]))
    add("CELL-042", "Copy to ›, two books, one already there: \"(1 was already there)\"; Ctrl+Z leaves the one that was "
        "there",
        cell(lambda: (pick("Science Fiction", ND, GO), book_menu(ND, "Copy to", "Copy to folder", "Fantasy")),
             {"Fantasy": "+18"}, ["Added", "(1 was already there)"]))
    add("CELL-043", "Copy to › from All Books: added",
        cell(lambda: (pick("All Books", ND), book_menu(ND, "Copy to", "Copy to folder", "Fantasy")),
             {"Fantasy": "+18"}, ["Added", "to 'Fantasy'"]))
    add("CELL-044", "Add to Book List ›, one book: onto the list; the folder keeps it",
        cell(lambda: (pick("Science Fiction", ND), book_menu(ND, "Add to Book List", "Add to Book List", "Read Next")),
             {"Read Next": "+18"}, ["Added", "to 'Read Next'"]))
    add("CELL-045", "Add to Book List ›, two books, one already on it: \"(1 was already there)\"",
        cell(lambda: (pick("All Books", S3, ND), book_menu(ND, "Add to Book List", "Add to Book List", "Read Next")),
             {"Read Next": "+18"}, ["Added", "(1 was already there)"]))
    add("CELL-046", "Add to Book List ›, one book already on it: nothing changes; \"… is already on 'Read Next'\"",
        cell(lambda: (pick("All Books", S3), book_menu(S3, "Add to Book List", "Add to Book List", "Read Next")),
             {}, ["is already on 'Read Next'"]))

    # ── 5. Folders ──────────────────────────────────────────────────────────────────────────────────────────────────
    add("CELL-047", "folder menu Move to ›: the folder (and what's in it) goes under the destination",
        cell(lambda: folder_menu("Space Opera", "Move to", "Fantasy"),
             {"Space Opera ⇒": "Fantasy"}, ["Moved", "Space Opera", "Fantasy"]))
    add("CELL-048", "folder menu Cut → Paste on another folder: moved, and says so",
        cell(lambda: (folder_menu("Space Opera", "Cut"), folder_menu("Fantasy", "Paste")),
             {"Space Opera ⇒": "Fantasy"}, ["Moved", "Space Opera", "Fantasy"]))
    COPY_TREE = {"new Space Opera (Copy)": "in Fantasy", "new Old Favorites (Copy)": "in Space Opera (Copy): 19 20"}
    add("CELL-049", "folder menu Copy → Paste: the whole tree copied as \"Space Opera (Copy)\", its books filed in the "
        "copy too; \"Copied 'Space Opera' (2 books, 1 subfolder) as 'Space Opera (Copy)'\"",
        cell(lambda: (folder_menu("Space Opera", "Copy"), folder_menu("Fantasy", "Paste")),
             COPY_TREE, ["Copied 'Space Opera'", "as 'Space Opera (Copy)'"]))
    add("CELL-050", "Ctrl+X on a folder SELECTED in the right pane → Ctrl+V in another folder: the SELECTED folder moves",
        cell(lambda: (pick("Science Fiction", "Space Opera"), key("x"), paste_key("Fantasy")),
             {"Space Opera ⇒": "Fantasy"}, ["Moved", "Space Opera"]))
    add("CELL-051", "Ctrl+C on a folder selected in the right pane → Ctrl+V: the SELECTED folder's tree is copied",
        cell(lambda: (pick("Science Fiction", "Space Opera"), key("c"), paste_key("Fantasy")),
             COPY_TREE, ["Copied 'Space Opera'", "as 'Space Opera (Copy)'"]))
    add("CELL-052", "folder menu Copy → Paste into its OWN subfolder: refused, nothing changes (never into itself or below)",
        cell(lambda: (folder_menu("Science Fiction", "Copy"), folder_menu("Space Opera", "Paste")),
             {}, ["Can"]))
    add("CELL-053", "folder menu Cut → Paste into its own subfolder: refused, nothing changes",
        cell(lambda: (folder_menu("Science Fiction", "Cut"), folder_menu("Space Opera", "Paste")),
             {}, ["Can't move"]))
    add("CELL-054", "plain drag of a folder (right pane) onto a folder (left pane): moved",
        cell(lambda: (go("Science Fiction"), drag("Space Opera", "Fantasy")),
             {"Space Opera ⇒": "Fantasy"}, ["Moved", "Space Opera", "Fantasy"]))
    add("CELL-055", "Ctrl-drag of a folder: a COPY of its tree (the original stays); \"Copied … as 'Space Opera (Copy)'\"",
        cell(lambda: (go("Science Fiction"), drag("Space Opera", "Fantasy", ctrl=True)),
             COPY_TREE, ["Copied 'Space Opera'", "as 'Space Opera (Copy)'"]))

    # ── Books and folders selected together: both, for every gesture (§6 item 17, decided 2026-11-13) ────────────────
    add("CELL-056", "Ctrl+X with a book AND a folder selected → Ctrl+V: BOTH move (as Delete takes both); one receipt; "
        "one exact Ctrl+Z",
        cell(lambda: (pick("Science Fiction", "Space Opera", ND), key("x"), paste_key("Fantasy")),
             {"Science Fiction": "-18", "Fantasy": "+18", "Space Opera ⇒": "Fantasy"},
             ["Moved 'Space Opera' and 'A Book With No Description' from 'Science Fiction' to 'Fantasy'"]))
    add("CELL-057", "plain drag of a book AND a folder together: both move, in the one wording (§6 items 14, 17)",
        cell(lambda: (pick("Science Fiction", "Space Opera", ND), drag(ND, "Fantasy")),
             {"Science Fiction": "-18", "Fantasy": "+18", "Space Opera ⇒": "Fantasy"},
             ["Moved", "'Space Opera'", "from 'Science Fiction'", "to 'Fantasy'"]))

    # ── The re-file question (§6 item 18): a cut from All Books pasted into a folder, the book in 2+ other folders ─────
    REFILE_Q = ["Move 'Good Omens' to 'Inbox'?",
                "It's also in 'Fantasy' and 'Science Fiction' — moving takes it out of them."]
    add("CELL-059", "Ctrl+X in All Books → Ctrl+V in a folder, the book in 2 other folders: Ron's question first; [Move] "
        "re-files it — out of both, into this one; one Ctrl+Z",
        cell(lambda: (pick("All Books", GO), key("x"), paste_key("Inbox")),
             {"Fantasy": "-5", "Science Fiction": "-5", "Inbox": "+5"}, REFILE_Q, answer="Move"))
    add("CELL-060", "… [Just add it]: only added — its other folders keep it",
        cell(lambda: (pick("All Books", GO), key("x"), paste_key("Inbox")), {"Inbox": "+5"}, REFILE_Q, answer="Just add it"))
    add("CELL-061", "… [Cancel]: nothing changes",
        cell(lambda: (pick("All Books", GO), key("x"), paste_key("Inbox")), {}, REFILE_Q, answer="Cancel"))

    # ── §6 item 15: a copied folder's subfolders belong to the COPY — its own list of subfolders (the manual order) names
    # the copies, never the originals; Ctrl+Z puts every order field back; Ctrl+Y makes the same copy again ──────────────
    ORDER_JS = """() => window.folders.map(f => ({ id: f.id, name: f.name, parent: f.parentId || null,
        kids: f.childFolderIds ? [...f.childFolderIds] : null, sortIndex: f.sortIndex ?? null }))"""

    def copy_keeps_its_own_subfolders():
        try:
            before = page.evaluate(ORDER_JS)
            folder_menu("Space Opera", "Copy")
            folder_menu("Fantasy", "Paste")
            page.wait_for_timeout(400)
            after = {f["name"]: f for f in page.evaluate(ORDER_JS)}
            top, sub = after.get("Space Opera (Copy)"), after.get("Old Favorites (Copy)")
            check(top and sub, f"no copy made: {sorted(after)}")
            check(top["kids"] == [sub["id"]], f"the copy's subfolders are {top['kids']} — should be its own copy {sub['id']} "
                                              f"(not the original 'f-old')")
            check(sub["parent"] == top["id"], "the subfolder copy isn't inside the copy")
            check(top["id"] in (after["Fantasy"]["kids"] or []),
                  f"Fantasy's subfolders don't list the copy: {after['Fantasy']['kids']}")
            undo_once()
            check(page.evaluate(ORDER_JS) == before, "one Ctrl+Z didn't put every folder (and its order fields) back exactly")
            page.keyboard.press("Control+y")
            page.wait_for_timeout(500)
            again = {f["name"]: f for f in page.evaluate(ORDER_JS)}
            check(again.get("Space Opera (Copy)") == top and again.get("Old Favorites (Copy)") == sub,
                  "Ctrl+Y didn't make the same copy again (it used to say 'Cannot redo copy operation')")
            undo_once()
            check(page.evaluate(ORDER_JS) == before, "Ctrl+Z after Ctrl+Y didn't put it back")
        finally:
            clean_up()
    add("CELL-062", "a copied folder's subfolders belong to the COPY (its own subfolder list names the copies); Ctrl+Z puts "
        "every order field back; Ctrl+Y copies it again (§6 item 15)", copy_keeps_its_own_subfolders)

    def copy_from_trash_pasted_twice():
        try:
            before = state()
            pick("Trash", TR)
            key("c")
            paste_key("Fantasy")
            first = words()
            paste_key("Inbox")                         # the copy is still on the clipboard; the book is restored now
            second = words()
            check("Restored" in first, f"the first paste should restore: {first!r}")
            check("Added 'A Book in the Trash' to 'Inbox'" in norm(second) and "Restored" not in second,
                  f"the second paste only adds (the book left the Trash at the first): {second!r}")
            got = delta(before, state())
            check(got == {"Trash": "-21", "Fantasy": "+21", "Inbox": "+21"}, f"changed {got}")
            undo_once()
            undo_once()
            back = not_exactly(before, state())
            check(not back, f"two Ctrl+Z left: {back}")
        finally:
            clean_up()
    add("CELL-063", "a copy out of the Trash pasted twice: the first paste restores, the second only adds (\"Added\", "
        "not \"Restored\"); two Ctrl+Z put it all back", copy_from_trash_pasted_twice)

    # Warnings on purpose: CELL-053's refusal (MOVE-06); CELL-039's "a paste will restore" (MOVE-10, §6 item 6)
    DELIBERATE = ("MOVE-06", "MOVE-10")
    if not ONLY:
        test("CELL-058", "no unexpected console messages (the warnings MOVE-06 and MOVE-10 are on purpose)",
             lambda: check(not [x for x in app.unexpected_console() if not any(c in x for c in DELIBERATE)],
                           [x for x in app.unexpected_console() if not any(c in x for c in DELIBERATE)]))

done()
