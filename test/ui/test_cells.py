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
# 7.30.0-alpha.4: the menus take the whole selection — books and folders (§6 item 17) — CELL-070–080, 086, 087; a mixed
# drop on the "Folders" crumb says a drag's words (CELL-081); the Trash's "New…" boxes say "restore" (CELL-082–084).
# 7.30.0-alpha.5: the left pane's dead drop branches removed — CELL-085 guards the Inbox's restore (now the table's).
# 7.30.0-alpha.6: one drop = one answer — a drag carrying books goes into a right-pane folder row wherever it lands
# (CELL-088–091); a left-pane folder dropped on the folder path asks the table (CELL-092–096).
# 7.30.0-alpha.7: the left pane's own folder drops ask the table — the Folders header, the Inbox, a folder's middle and
# its edge under another parent, its position kept (CELL-099–104); a right-pane drag onto the Folders header (CELL-105,
# 106); books dragged onto "Book Lists" in the folder path say a drag's words (CELL-107).
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
        # Open when its left-pane entry shows it (bg-blue-100) — the same render that fills the right pane (nothing there is
        # deferred), so its rows are the new place's. A condition, not the fixed 400 ms it was (7.30.0-alpha.3: ~30 s a run).
        target.first.wait_for(state="attached")
        page.wait_for_function("el => !!el.closest('.bg-blue-100')", arg=target.first.element_handle(), timeout=3000)
        page.wait_for_timeout(50)

    def select(*titles):
        """Click the first row, Ctrl+click the rest; wait until the screen shows them selected. (Until 7.30.0 also 250 ms
        more for the key listeners to catch up — they re-registered after the selection rendered; since 7.30.0-alpha.1 the
        keys read the selection through refs, set in that same render, so a short moment is enough.)"""
        for i, t in enumerate(titles):
            page.locator("tbody tr", has_text=t).first.click(modifiers=["Control"] if i else None)
        page.wait_for_function(f"() => document.querySelectorAll('tbody tr.bg-blue-50').length === {len(titles)}",
                               timeout=3000)
        page.wait_for_timeout(50)

    def pick(place, *titles):
        go(place)
        select(*titles)

    def key(k):
        """Ctrl+<k>. A cut or copy says what it took (a MOVE line) — wait for that, up to 1 s (nothing selected says
        nothing); a paste's words are waited for by words(). (Was a fixed 300 ms after every key.)"""
        n0 = len(app.console)
        page.keyboard.press(f"Control+{k}")
        if k in ("x", "c"):
            for _ in range(20):
                if any(re.search(r" · MOVE(?:-\d+)? · ", x) for _, x in app.console[n0:]):
                    break
                page.wait_for_timeout(50)
            page.wait_for_timeout(50)

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
        """Ctrl+Z; returns what it said it undid ('' = nothing). Every Ctrl+Z says what it did — "Undone: …" or "Nothing to
        undo" (an UNDO line) — so wait for that line (up to 3 s), not a fixed 500 ms; the checks after it read state(),
        which waits for the screen to settle."""
        n0 = len(app.console)
        page.keyboard.press("Control+z")
        for _ in range(60):
            if any(" · UNDO · " in x for _, x in app.console[n0:]):
                break
            page.wait_for_timeout(50)
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
    # decided — their lines are gone. 7.30.0-alpha.2 (the menus and today's drags ask the table): CELL-018–022, 024–026,
    # 028, 030, 033, 041–043, 045, 046, 057 too — no cell differs from the design any more. (Their measured words, for
    # the record: Move to / a drag said "Moved 'X' to 'Fantasy'" and Copy to / a Ctrl-drag "Copied…", with no source and
    # no "already there"; Move to the folder it's in said "Book already in folder"; Move to from a Book List and a plain
    # drag Book List → folder left the book on the list; Move to was greyed in All Books ("Cannot move books from virtual
    # folders"); a list → list drag's Ctrl+Z put the book LAST on its list; Add to Book List said "(1 already there)" /
    # "All 1 book already in 'Read Next'"; a book + folder drag said "Moved folder 'Space Opera' + 'X' to 'Fantasy'".)
    TODAY = {}

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

    # ── 7.30.0-alpha.2: the book menu follows the table where it used to hide or grey (§6 item 6, item 18; Law 16) ──────
    def menu_item(label):
        """The open book menu's item whose own label is exactly `label` (its row: the label's parent)."""
        return page.get_by_role("menu", name="Book options").get_by_text(label, exact=True).first.locator("xpath=..")

    def trash_menu_offers():
        try:
            pick("Trash", TR)
            key("c")                                        # a copy out of the Trash on the clipboard: Paste is then refused
            page.locator("tbody tr", has_text=TR).first.click(button="right")
            page.get_by_role("menu", name="Book options").wait_for(timeout=3000)
            for label in ("Move to", "Copy to", "Add to Book List", "Cut", "Copy"):
                row = menu_item(label)
                check(row.count(), f"the Trash's book menu doesn't offer {label!r} (it was hidden there before 7.30.0)")
                check(row.get_attribute("aria-disabled") != "true", f"{label!r} is greyed in the Trash")
            paste = menu_item("Paste")
            check(paste.count(), "no Paste item in the Trash's book menu")
            check("Can't paste into the Trash" in (paste.get_attribute("title") or ""),
                  f"Paste in the Trash should be greyed with the table's words — its title: {paste.get_attribute('title')!r}")
        finally:
            clean_up()
    add("CELL-064", "the Trash's book menu offers Move to / Copy to / Add to Book List / Cut / Copy (out of the Trash every "
        "verb restores, §6 item 6); Paste is there, greyed with the table's words (Law 16)", trash_menu_offers)
    add("CELL-065", "Move to › out of the Trash: a RESTORE into that folder; \"Restored … from the Trash into 'Fantasy'\"",
        cell(lambda: (pick("Trash", TR), book_menu(TR, "Move to", "Move to folder", "Fantasy")),
             {"Trash": "-21", "Fantasy": "+21"}, ["Restored", "from the Trash", "into 'Fantasy'"]))
    add("CELL-066", "Add to Book List › out of the Trash: restored (back in the folder it was in) and added to the list",
        cell(lambda: (pick("Trash", TR), book_menu(TR, "Add to Book List", "Add to Book List", "Read Next")),
             {"Trash": "-21", "Read Next": "+21", "Science Fiction": "+21"}, ["Restored", "added it to 'Read Next'"]))

    def menu_cut_in_all_books():
        pick("All Books", S1)
        page.locator("tbody tr", has_text=S1).first.click(button="right")
        row = menu_item("Cut")
        row.wait_for(timeout=3000)
        check(row.get_attribute("aria-disabled") != "true", f"Cut is greyed in All Books (title {row.get_attribute('title')!r})")
        app.click_reachable(row)
        page.wait_for_timeout(300)
        paste_key("Inbox")
    add("CELL-067", "the book menu's Cut in All Books (was greyed: \"Cannot cut books from virtual folders\") → Ctrl+V in a "
        "folder: re-filed, as Ctrl+X there (§6 item 18)",
        cell(menu_cut_in_all_books, {"The Test Saga": "-1", "Inbox": "+1"}, ["Moved"]))

    def new_container(trigger, submenu, entry, name):
        """Right-click the selected row → a submenu → its "New …" entry → type a name → Enter."""
        def gesture(title):
            page.locator("tbody tr", has_text=title).first.click(button="right")
            menu = page.get_by_role("menu", name="Book options")
            menu.wait_for(timeout=3000)
            app.hover(menu.locator(".submenu-trigger", has_text=trigger).first)
            sub = page.locator(f'[aria-label="{submenu}"]')
            sub.wait_for(timeout=3000)
            app.click_reachable(sub.get_by_text(entry, exact=True).first)
            box = page.locator(".rw-imperative-overlay input").first
            box.wait_for(timeout=3000)
            box.fill(name)
            mark()
            box.press("Enter")
        return gesture
    new_folder = new_container("Move to", "Move to folder", "New folder here…", "Beach Reads")
    add("CELL-068", "Move to › New folder here… from a Book List: a true move — off the list, into the new folder (was: the "
        "list kept it); one Ctrl+Z takes back both the folder and the move",
        cell(lambda: (pick("Read Next", S3), new_folder(S3)),
             {"Read Next": "-3", "new Beach Reads": "in top level: 3"}, ["Moved", "from 'Read Next'", "to 'Beach Reads'"]))
    new_list = new_container("Add to Book List", "Add to Book List", "New Book List…", "Beach Reads")

    def list_count():
        return len(state()["lists"])

    def new_list_from_trash():
        try:
            before, n0 = state(), list_count()
            pick("Trash", TR)
            new_list(TR)
            said = words()
            got = delta(before, state())
            check(got == {"Trash": "-21", "Science Fiction": "+21", "Beach Reads": "+21"}, f"changed {got}")
            check("Restored" in said and "added it to 'Beach Reads'" in norm(said), f"said: {said!r}")
            undone = undo_once()
            back = not_exactly(before, state())
            check(not back and list_count() == n0, f"one Ctrl+Z ({undone or 'nothing to undo'}) left: {back}; "
                                                   f"{list_count() - n0} new list(s) still there")
        finally:
            clean_up()
    add("CELL-069", "Add to Book List › New Book List… out of the Trash: the new list, the book restored onto it — one "
        "Ctrl+Z takes back the list and the restore", new_list_from_trash)

    # ── 7.30.0-alpha.4: the menus take the WHOLE selection — books and folders both (§6 item 17, "for every gesture") ────
    # Was: with a book and a folder selected, the book menu's Move to › / Copy to › / Add to Book List › / Cut / Copy took
    # the books only (its header "1 book selected"); the folder menu's Move to › / Cut / Copy the right-clicked folder only.
    MIXED = ("Science Fiction", "Space Opera", ND)            # a folder and a book, selected in Science Fiction
    BOTH_MOVED = {"Science Fiction": "-18", "Fantasy": "+18", "Space Opera ⇒": "Fantasy"}
    BOTH_WORDS = ["Moved 'Space Opera' and 'A Book With No Description' from 'Science Fiction' to 'Fantasy'"]
    BOTH_COPIED = {"Fantasy": "+18", **COPY_TREE}
    COPY_WORDS = ["Added 'A Book With No Description' to 'Fantasy'", "Copied 'Space Opera' (2 books, 1 subfolder)"]

    def mixed_book_menu_header():
        try:
            pick(*MIXED)
            page.locator("tbody tr", has_text=ND).first.click(button="right")
            menu = page.get_by_role("menu", name="Book options")
            menu.wait_for(timeout=3000)
            head = menu.locator("div").first.inner_text().strip()
            check(head == "1 book and 1 folder selected", f"the book menu's header says {head!r}")
        finally:
            clean_up()
    add("CELL-070", "a book and a folder selected: the book menu's header says \"1 book and 1 folder selected\" (was \"1 "
        "book selected\")", mixed_book_menu_header)
    add("CELL-071", "a book and a folder selected, the book menu's Move to › a folder: BOTH move; one receipt; one Ctrl+Z",
        cell(lambda: (pick(*MIXED), book_menu(ND, "Move to", "Move to folder", "Fantasy")), BOTH_MOVED, BOTH_WORDS))
    add("CELL-072", "… the book menu's Copy to ›: the book added, the folder's whole tree copied",
        cell(lambda: (pick(*MIXED), book_menu(ND, "Copy to", "Copy to folder", "Fantasy")), BOTH_COPIED, COPY_WORDS))
    add("CELL-073", "… the book menu's Add to Book List ›: the book AND the folder's books (its subfolders' too) go on the "
        "list (§6 item 8)",
        cell(lambda: (pick(*MIXED), book_menu(ND, "Add to Book List", "Add to Book List", "Read Next")),
             {"Read Next": "+18 +19"}, ["Added 2 books to 'Read Next' (1 was already there)"]))

    def book_menu_item(title, label):
        page.locator("tbody tr", has_text=title).first.click(button="right")
        menu = page.get_by_role("menu", name="Book options")
        menu.wait_for(timeout=3000)
        app.click_reachable(menu.get_by_text(label, exact=True).first)
        page.wait_for_timeout(200)
    add("CELL-074", "… the book menu's Cut → Ctrl+V: both move (as Ctrl+X)",
        cell(lambda: (pick(*MIXED), book_menu_item(ND, "Cut"), paste_key("Fantasy")), BOTH_MOVED, BOTH_WORDS))
    add("CELL-075", "… the book menu's Copy → Ctrl+V: both copied (as Ctrl+C)",
        cell(lambda: (pick(*MIXED), book_menu_item(ND, "Copy"), paste_key("Fantasy")), BOTH_COPIED, COPY_WORDS))

    def right_folder_menu(folder, item, target=None):
        """Right-click a folder ROW in the right pane (the selection stays) → an item, or Move to › a target."""
        page.locator("tbody tr", has_text=folder).first.click(button="right")
        menu = page.get_by_role("menu", name="Folder options")
        menu.wait_for(timeout=3000)
        if target is None:
            app.click_reachable(menu.get_by_text(item, exact=True).first)
            page.wait_for_timeout(200)
            return
        app.hover(menu.locator(".submenu-trigger", has_text=item).first)
        sub = page.locator('[aria-label="Move to folder"]')
        sub.wait_for(timeout=3000)
        mark()
        app.click_reachable(sub.get_by_text(target, exact=True).first)

    def folders_view():
        """Open the Folders header (the right pane lists the Inbox and the top-level folders)."""
        page.mouse.move(900, 600)
        app.click_reachable(page.locator("[data-left-pane] span.cursor-pointer", has_text=re.compile(r"^Folders$")).first)
        page.locator("tbody tr", has_text="An Empty Folder").first.wait_for(timeout=3000)
        page.wait_for_timeout(100)
    add("CELL-076", "a book and a folder selected, the FOLDER's menu (right pane) Move to ›: both move — one answer with "
        "the book menu",
        cell(lambda: (pick(*MIXED), right_folder_menu("Space Opera", "Move to", "Fantasy")), BOTH_MOVED, BOTH_WORDS))
    add("CELL-077", "… the folder menu's Cut → Ctrl+V: both move",
        cell(lambda: (pick(*MIXED), right_folder_menu("Space Opera", "Cut"), paste_key("Fantasy")), BOTH_MOVED, BOTH_WORDS))
    add("CELL-078", "… the folder menu's Copy → Ctrl+V: both copied",
        cell(lambda: (pick(*MIXED), right_folder_menu("Space Opera", "Copy"), paste_key("Fantasy")), BOTH_COPIED,
             COPY_WORDS))
    add("CELL-079", "two folders selected (the Folders view), the folder menu's Move to ›: both folders move (was: the "
        "right-clicked one only — as Pin and Delete already took the selection)",
        cell(lambda: (folders_view(), select("Every Ownership Kind", "An Empty Folder"),
                      right_folder_menu("An Empty Folder", "Move to", "Fantasy")),
             {"Every Ownership Kind ⇒": "Fantasy", "An Empty Folder ⇒": "Fantasy"}, ["Moved 2 folders", "to 'Fantasy'"]))

    def greyed_targets():
        """Law 16: a target the gesture can't take is greyed with the reason — never offered and then refused."""
        try:
            pick(*MIXED)
            page.locator("tbody tr", has_text=ND).first.click(button="right")
            menu = page.get_by_role("menu", name="Book options")
            menu.wait_for(timeout=3000)
            app.hover(menu.locator(".submenu-trigger", has_text="Move to").first)
            sub = page.locator('[aria-label="Move to folder"]')
            sub.wait_for(timeout=3000)
            # a folder can't go into itself: the selected Space Opera (a subfolder — found with the filter box) is greyed
            sub.locator("input").first.fill("Space")
            space = sub.get_by_role("menuitem").filter(has_text="Space Opera").first
            space.wait_for(timeout=3000)
            check(space.get_attribute("aria-disabled") == "true" and "into itself" in (space.get_attribute("title") or ""),
                  f"the selected folder should be greyed in Move to › with the reason — aria-disabled "
                  f"{space.get_attribute('aria-disabled')!r}, title {space.get_attribute('title')!r}")
            page.keyboard.press("Escape")
            page.wait_for_timeout(200)
            clean_up()
            pick(*MIXED)
            page.locator("tbody tr", has_text="Space Opera").first.click(button="right")
            fmenu = page.get_by_role("menu", name="Folder options")
            fmenu.wait_for(timeout=3000)
            app.hover(fmenu.locator(".submenu-trigger", has_text="Move to").first)
            fsub = page.locator('[aria-label="Move to folder"]')
            fsub.wait_for(timeout=3000)
            root = fsub.get_by_text("Root", exact=True).first.locator("xpath=..")
            check(root.get_attribute("aria-disabled") == "true"
                  and "top level" in (root.get_attribute("title") or ""),
                  f"with a book selected too, Root should be greyed with the reason — aria-disabled "
                  f"{root.get_attribute('aria-disabled')!r}, title {root.get_attribute('title')!r}")
        finally:
            clean_up()
    add("CELL-080", "a book and a folder selected: Move to › greys what can't take them, with the reason (Law 16) — the "
        "selected folder itself (into itself), and the folder menu's Root (books can't go to the top level)",
        greyed_targets)

    def mixed_drop_on_folders_crumb():
        pick(*MIXED)
        crumb = page.locator("button", has_text=re.compile(r"^Folders$")).first
        mark()
        page.locator("tbody tr", has_text=ND).first.drag_to(crumb, timeout=10_000)
    add("CELL-081", "a book and a folder dragged onto \"Folders\" in the folder path above the right pane: nothing moves, "
        "in a drag's words — not the paste's (\"Open a folder or Book List to paste into it\")",
        cell(mixed_drop_on_folders_crumb, {}, ["Nothing moved", "books can't go to the top level"]))

    def new_box_words(trigger, submenu, entry, wanted):
        def run():
            try:
                pick("Trash", TR)
                page.locator("tbody tr", has_text=TR).first.click(button="right")
                menu = page.get_by_role("menu", name="Book options")
                menu.wait_for(timeout=3000)
                app.hover(menu.locator(".submenu-trigger", has_text=trigger).first)
                sub = page.locator(f'[aria-label="{submenu}"]')
                sub.wait_for(timeout=3000)
                app.click_reachable(sub.get_by_text(entry, exact=True).first)
                ov = page.locator(".rw-imperative-overlay")
                ov.first.wait_for(timeout=3000)
                said = ov.first.inner_text()
                check(wanted in said and not re.search(r"\b(copy|move)\b", said, re.I),
                      f"in the Trash the box should say {wanted!r} (it restores) — it says {said!r}")
            finally:
                clean_up()
        return run
    add("CELL-082", "Move to › New folder here… in the Trash: the box says it RESTORES (was \"…and move 1 book into it\")",
        new_box_words("Move to", "Move to folder", "New folder here…",
                      "Create a folder and restore 1 book from the Trash into it."))
    add("CELL-083", "Copy to › New folder here… in the Trash: the box says it restores (was \"…and copy 1 book into it\")",
        new_box_words("Copy to", "Copy to folder", "New folder here…",
                      "Create a folder and restore 1 book from the Trash into it."))
    add("CELL-084", "Add to Book List › New Book List… in the Trash: the box says it restores",
        new_box_words("Add to Book List", "Add to Book List", "New Book List…",
                      "Restore 1 book from the Trash and add it to a new Book List."))
    add("CELL-086", "a book and a folder selected, Move to › New folder here…: the new folder (in Science Fiction) gets "
        "both; one receipt naming it; one Ctrl+Z takes back the folder and the move",
        cell(lambda: (pick(*MIXED), new_folder(ND)),
             {"Science Fiction": "-18", "new Beach Reads": "in Science Fiction: 18", "Space Opera ⇒": "Beach Reads"},
             ["Moved 'Space Opera' and 'A Book With No Description' from 'Science Fiction' to 'Beach Reads'"]))
    new_folder_copy = new_container("Copy to", "Copy to folder", "New folder here…", "Beach Reads")
    add("CELL-087", "… Copy to › New folder here…: the book added to the new folder, the folder's tree copied into it",
        cell(lambda: (pick(*MIXED), new_folder_copy(ND)),
             {"new Beach Reads": "in Science Fiction: 18", "new Space Opera (Copy)": "in Beach Reads",
              "new Old Favorites (Copy)": "in Space Opera (Copy): 19 20"},
             ["Added 'A Book With No Description' to 'Beach Reads'", "Copied 'Space Opera' (2 books, 1 subfolder)"]))
    add("CELL-085", "drag out of the Trash onto the Inbox (left pane): a restore — the one table's (the Inbox's own restore "
        "copy is gone, 7.30.0-alpha.5)",
        cell(lambda: (go("Trash"), drag(TR, "Inbox")), {"Trash": "-21", "Inbox": "+21"},
             ["Restored", "from the Trash into 'Inbox'"]))

    # ── 7.30.0-alpha.6: one drop = one answer from the table (Law 22) ───────────────────────────────────────────────────
    # 1. The right pane's folder rows: a drag that carries books goes INTO the folder wherever it lands on the row — as a
    #    drag of books alone always did, and as the left pane takes a mixed drag; a row's top / bottom quarter reorders
    #    only a drag of folders alone. Was: a book and a folder dropped on a row's edge reordered the folder AND dropped the
    #    book into that row's folder — two undo steps from one drop.
    def two_subfolders():
        """Science Fiction with two subfolders: An Empty Folder moved in by the folder menu's Move to › (it lands first,
        above Space Opera) — one undo step of its own, before the drop."""
        folder_menu("An Empty Folder", "Move to", "Science Fiction")
        words()
        go("Science Fiction")
        page.locator("tbody tr", has_text="An Empty Folder").first.wait_for(timeout=3000)

    def row_edge_drop(titles, edge, decided, says=(), reorders=False):
        """Select `titles` in Science Fiction, drag the last one onto An Empty Folder's row, `edge` = its top or bottom
        quarter. Then: what changed (and, reorders=True, that Science Fiction's subfolder order changed — nothing else);
        one Ctrl+Z puts it all back, folder order included; the next Ctrl+Z is the setup's (the drop was ONE step)."""
        def run():
            try:
                two_subfolders()
                select(*titles)
                before, order = state(), page.evaluate(ORDER_JS)
                dst = page.locator("tbody tr", has_text="An Empty Folder").first
                h = dst.bounding_box()["height"]
                mark()
                page.locator("tbody tr", has_text=titles[-1]).first.drag_to(
                    dst, target_position={"x": 120, "y": 2 if edge == "top" else h - 2}, timeout=10_000)
                said = words()
                got = delta(before, state())
                check(got == decided, f"changed {got}; decided {decided} — said {said!r}")
                for s in says:
                    check(norm(s) in norm(said), f"the words should say {s!r} — said {said!r}")
                kids = {f["name"]: f["kids"] for f in page.evaluate(ORDER_JS)}
                was = {f["name"]: f["kids"] for f in order}
                if reorders:
                    check(kids["Science Fiction"] != was["Science Fiction"],
                          f"a folder alone on a row's {edge} quarter should reorder: {kids['Science Fiction']}")
                undone = undo_once()
                back = not_exactly(before, state())
                check(not back and page.evaluate(ORDER_JS) == order,
                      f"one Ctrl+Z ({undone or 'nothing to undo'}) left: {back}; the folder order back: "
                      f"{page.evaluate(ORDER_JS) == order} — said {said!r}")
                more = undo_once()
                check("An Empty Folder" in more, f"the second Ctrl+Z should undo the setup's Move to (one drop = one undo "
                                                 f"step) — it undid {more!r}")
            finally:
                clean_up()
        return run
    INTO_EMPTY = {"Science Fiction": "-18", "An Empty Folder": "+18", "Space Opera ⇒": "An Empty Folder"}

    def cover_edge_drop():
        """The Cover View twin of CELL-088: the selection made in List View, then the Space Opera tile dragged onto An
        Empty Folder's tile, its top quarter."""
        try:
            two_subfolders()
            select("Space Opera", ND)
            before, order = state(), page.evaluate(ORDER_JS)
            app.menu("View", "Cover View").click()
            tile = lambda name: page.locator('div[class*="hover:opacity-80"]', has_text=name).first   # noqa: E731
            tile("An Empty Folder").wait_for(timeout=3000)
            check(page.locator('div[class*="ring-blue-400"]').count() >= 1, "the selection didn't survive the switch")
            mark()
            tile("Space Opera").drag_to(tile("An Empty Folder"), target_position={"x": 20, "y": 3}, timeout=10_000)
            said = words()
            got = delta(before, state())
            check(got == INTO_EMPTY, f"changed {got}; decided {INTO_EMPTY} — said {said!r}")
            undone = undo_once()
            check(not not_exactly(before, state()) and page.evaluate(ORDER_JS) == order,
                  f"one Ctrl+Z ({undone or 'nothing'}) didn't put it all back: {not_exactly(before, state())}")
            more = undo_once()
            check("An Empty Folder" in more, f"the second Ctrl+Z should undo the setup's Move to — it undid {more!r}")
        finally:
            app.menu("View", "List View").click()
            clean_up()
    add("CELL-088", "a book and a folder dragged onto a folder ROW's top quarter (right pane): both go INTO that folder — "
        "no reorder; one receipt; one Ctrl+Z (was: the folder reordered AND the book dropped — two undo steps)",
        row_edge_drop(("Space Opera", ND), "top", INTO_EMPTY,
                      ["Moved 'Space Opera' and 'A Book With No Description' from 'Science Fiction' to 'An Empty Folder'"]))
    add("CELL-089", "… on the row's bottom quarter: the same — into the folder",
        row_edge_drop(("Space Opera", ND), "bottom", INTO_EMPTY, ["to 'An Empty Folder'"]))
    add("CELL-090", "a book alone on a folder row's top quarter: into the folder (as always — the rule the mixed drag "
        "now follows)",
        row_edge_drop((ND,), "top", {"Science Fiction": "-18", "An Empty Folder": "+18"},
                      ["Moved", "to 'An Empty Folder'"]))
    add("CELL-091", "a folder alone on a folder row's top quarter: a REORDER (Manual order) — nothing moves in or out; "
        "one Ctrl+Z", row_edge_drop(("Space Opera",), "top", {}, reorders=True))
    add("CELL-097", "Cover View: a book and a folder dragged onto a folder tile's top quarter — into that folder, one Ctrl+Z "
        "(the list view's twin)", cover_edge_drop)

    def left_folder_onto_row():
        go("Science Fiction")
        src = page.locator(f'[data-folder-id="{FOLDER_IDS["An Empty Folder"]}"]').first
        dst = page.locator("tbody tr", has_text="Space Opera").first
        mark()
        src.drag_to(dst, target_position={"x": 120, "y": dst.bounding_box()["height"] / 2}, timeout=10_000)
    add("CELL-098", "a left-pane folder dropped on the MIDDLE of a right-pane folder row: moved into it — the table's "
        "answer (was reparentFolder on its own)",
        cell(left_folder_onto_row, {"An Empty Folder ⇒": "Space Opera"}, ["Moved 'An Empty Folder' to 'Space Opera'"]))

    # 2. The folder path above the right pane: a folder dragged from the LEFT pane onto a crumb asks the table (was
    #    reparentFolder with the crumb's id — on "Book Lists" that gave the folder a parent that isn't a folder, and it
    #    dropped out of the tree).
    def crumb(name):
        return page.locator(f"xpath=//button[normalize-space()=\"{name}\"][not(ancestor::*[@data-left-pane])]").first

    def left_folder_onto_crumb(place, folder, to):
        if place == "Old Favorites":                   # not shown in the left pane (Space Opera is closed there): open it
            go("Space Opera")                          # from the right pane — the path: Folders › Science Fiction ›
            page.locator("tbody tr", has_text="Old Favorites").first.dblclick()   # Space Opera › Old Favorites
            crumb("Space Opera").wait_for(timeout=3000)
        else:
            go(place)
        src = page.locator(f'[data-folder-id="{FOLDER_IDS[folder]}"]').first
        crumb(to).wait_for(timeout=3000)
        mark()
        src.drag_to(crumb(to), timeout=10_000)
    add("CELL-092", "a left-pane folder dragged onto \"Book Lists\" in the folder path (a Book List open): refused, in a "
        "drag's words — nothing changes (was: the folder's parent became Book Lists and it dropped out of the tree)",
        cell(lambda: left_folder_onto_crumb("Read Next", "Space Opera", "Book Lists"), {},
             ["Nothing moved", "folders can't go into Book Lists"]))
    add("CELL-093", "a left-pane folder dragged onto a folder's crumb: moved into it — the table's words; one Ctrl+Z",
        cell(lambda: left_folder_onto_crumb("Old Favorites", "An Empty Folder", "Science Fiction"),
             {"An Empty Folder ⇒": "Science Fiction"}, ["Moved 'An Empty Folder' to 'Science Fiction'"]))
    add("CELL-094", "a left-pane folder dragged onto \"Folders\" in the folder path: to the top level",
        cell(lambda: left_folder_onto_crumb("Old Favorites", "Space Opera", "Folders"),
             {"Space Opera ⇒": "top level"}, ["Moved 'Space Opera' from 'Science Fiction' to the top level"]))
    add("CELL-095", "a top-level folder dragged onto \"Folders\": already there — nothing changes, and the words say so "
        "(§6 item 7; was: moved to the top of the list, saying \"Moved\")",
        cell(lambda: left_folder_onto_crumb("Old Favorites", "An Empty Folder", "Folders"), {},
             ["Nothing moved", "'An Empty Folder' is already in the top level"]))
    add("CELL-096", "a left-pane folder dragged onto its own subfolder's crumb: refused (never into itself or below)",
        cell(lambda: left_folder_onto_crumb("Old Favorites", "Science Fiction", "Space Opera"), {},
             ["Can't move a folder into itself"]))

    # ── 7.30.0-alpha.7: the left pane's own folder drops ask the table too (were reparentFolder on their own) ───────────
    # The Folders header, the Inbox and a folder's middle: one answer, one undo step, the table's words — "already there"
    # included (§6 item 7). A folder's top / bottom quarter from ANOTHER parent still places it at that position (the
    # table's move, with the position); within one parent it is a reorder, outside the table.
    def folders_header():
        # the FOLDERS section header (its word is the drop target) — not the pane's own "Folders" title above it
        return page.locator('[data-left-pane] span[title^="Your personal organization"]').first

    def left_row(name):
        return page.locator(f'[data-folder-id="{FOLDER_IDS[name]}"]').first

    def left_folder_onto(folder, to, edge=None):
        """Drag a left-pane folder onto `to` in the left pane — "Folders" (the header), "Inbox", or a folder (its middle;
        edge='top' / 'bottom': that quarter)."""
        go("Fantasy")
        src = left_row(folder)
        if to == "Folders":
            dst, pos = folders_header(), None
        elif to == "Inbox":
            dst, pos = page.locator("[data-left-pane]").get_by_text("Inbox", exact=True).locator("xpath=..").first, None
        else:
            dst = left_row(to)
            h = dst.bounding_box()["height"]
            pos = {"x": 60, "y": 2 if edge == "top" else h - 2 if edge == "bottom" else h / 2}
        mark()
        src.drag_to(dst, target_position=pos, timeout=10_000) if pos else src.drag_to(dst, timeout=10_000)
    add("CELL-099", "a top-level folder dragged onto the left pane's \"Folders\" header: already there — nothing changes, "
        "and the words say so (§6 item 7; was: re-placed at the top, saying \"Moved\")",
        cell(lambda: left_folder_onto("An Empty Folder", "Folders"), {},
             ["Nothing moved", "'An Empty Folder' is already in the top level"]))
    add("CELL-100", "a subfolder dragged onto the left pane's \"Folders\" header: to the top level, the table's words",
        cell(lambda: left_folder_onto("Space Opera", "Folders"), {"Space Opera ⇒": "top level"},
             ["Moved 'Space Opera' from 'Science Fiction' to the top level"]))
    add("CELL-101", "a left-pane folder dragged onto the Inbox: into the Inbox, the table's words; one Ctrl+Z",
        cell(lambda: left_folder_onto("An Empty Folder", "Inbox"), {"An Empty Folder ⇒": "Inbox"},
             ["Moved 'An Empty Folder' to 'Inbox'"]))
    add("CELL-102", "a left-pane folder dragged onto the middle of the folder it's already in: nothing changes, and the "
        "words say so (§6 item 7; was: re-placed at the top of it, saying \"Moved\")",
        cell(lambda: left_folder_onto("Space Opera", "Science Fiction"), {},
             ["Nothing moved", "'Space Opera' is already in 'Science Fiction'"]))
    add("CELL-103", "a left-pane folder dragged onto the middle of another left-pane folder: moved into it; one Ctrl+Z",
        cell(lambda: left_folder_onto("An Empty Folder", "Fantasy"), {"An Empty Folder ⇒": "Fantasy"},
             ["Moved 'An Empty Folder' to 'Fantasy'"]))

    LEFT_ORDER_JS = """() => [...document.querySelectorAll('[data-left-pane] [data-folder-id]')].map(e => e.dataset.folderId)"""

    def edge_across_parents():
        """Space Opera (in Science Fiction) dragged onto Science Fiction's BOTTOM quarter (a top-level folder — Space
        Opera's parent, so another parent than its own): it moves to the top level AT that position — just below Science
        Fiction (without the position it would land at the top, just under the pinned Fantasy); one receipt; one Ctrl+Z
        puts every order field back. (The target is above the source on purpose: a hovered left-pane row shows its + / ×
        buttons and can wrap, shifting every row BELOW it — see go().)"""
        try:
            go("Fantasy")
            before, order = state(), page.evaluate(ORDER_JS)
            left_folder_onto("Space Opera", "Science Fiction", edge="bottom")
            said = words()
            got = delta(before, state())
            check(got == {"Space Opera ⇒": "top level"}, f"changed {got} — said {said!r}")
            check(norm("Moved 'Space Opera' from 'Science Fiction' to the top level") in norm(said), f"said {said!r}")
            # the top-level folders as the left pane shows them (a subfolder row in between doesn't count: Space Opera's
            # own Old Favorites shows under it when the drag's hover opened it)
            top = {f["id"] for f in page.evaluate(ORDER_JS) if f["parent"] is None}
            shown = [i for i in page.evaluate(LEFT_ORDER_JS) if i in top]
            check("f-space" in shown and "f-scifi" in shown and shown.index("f-space") == shown.index("f-scifi") + 1,
                  f"Space Opera should sit just below Science Fiction among the top-level folders: {shown}")
            undone = undo_once()
            check(not not_exactly(before, state()) and page.evaluate(ORDER_JS) == order,
                  f"one Ctrl+Z ({undone or 'nothing'}) didn't put it all back: {not_exactly(before, state())}")
            check(not undo_once(), "a second Ctrl+Z still undid something (one drop = one undo step)")
        finally:
            clean_up()
    add("CELL-104", "a left-pane folder dragged onto the bottom quarter of a folder under ANOTHER parent: moved to that "
        "parent, at that position (just below it — not at the top); one Ctrl+Z puts the order back", edge_across_parents)

    def right_onto_folders_header(*titles):
        pick("Science Fiction", *titles)
        mark()
        page.locator("tbody tr", has_text=titles[-1]).first.drag_to(folders_header(), timeout=10_000)
    add("CELL-105", "a book and a folder dragged from the right pane onto the left pane's \"Folders\" header: nothing moves, "
        "in a drag's words (was: the folder went to the top level and the book was dropped silently)",
        cell(lambda: right_onto_folders_header("Space Opera", ND), {}, ["Nothing moved", "books can't go to the top level"]))
    add("CELL-106", "a folder alone dragged from the right pane onto the left pane's \"Folders\" header: to the top level",
        cell(lambda: right_onto_folders_header("Space Opera"), {"Space Opera ⇒": "top level"},
             ["Moved 'Space Opera' from 'Science Fiction' to the top level"]))

    def books_onto_book_lists_crumb():
        pick("Read Next", S3)
        crumb("Book Lists").wait_for(timeout=3000)
        mark()
        page.locator("tbody tr", has_text=S3).first.drag_to(crumb("Book Lists"), timeout=10_000)
    add("CELL-107", "a book dragged onto \"Book Lists\" in the folder path (a Book List open): nothing moves, in a drag's "
        "words (was the paste's: \"Open a folder or Book List to paste into it\")",
        cell(books_onto_book_lists_crumb, {}, ["Nothing moved", "Book Lists heading", "Drop them on one in the left pane"]))

    # ── §6 item 6: a warning looks like a warning — amber, and it stays where it appeared ~4 s (others 1.5 s) ────────────
    TOAST_JS = """el => {
        const probe = document.createElement('div');
        probe.style.backgroundColor = 'var(--toast-warning-bg)';
        document.body.appendChild(probe);
        const amber = getComputedStyle(probe).backgroundColor;
        probe.remove();
        return { cls: el.className, bg: getComputedStyle(el).backgroundColor, amber };
    }"""

    def toast_look(place, title, k, warning):
        def run():
            try:
                pick(place, title)
                pressed = page.evaluate("() => performance.now()")
                page.keyboard.press(f"Control+{k}")
                t = page.locator(".clipboard-toast").first
                t.wait_for(state="visible", timeout=3000)
                look = t.evaluate(TOAST_JS)
                if warning:
                    check("warning" in look["cls"] and look["bg"] == look["amber"],
                          f"a warning toast should be amber — its class {look['cls']!r}, background {look['bg']} "
                          f"(amber: {look['amber']})")
                    r, g, b = [int(x) for x in re.findall(r"\d+", look["amber"])[:3]]
                    check(r >= g > b and r - b > 40, f"the warning color {look['amber']} isn't amber (red ≥ green > blue)")
                else:
                    check("warning" not in look["cls"] and look["bg"] != look["amber"],
                          f"an ordinary toast looks like a warning: {look}")
                # 3 s after the key (a toast shows at once): a warning is still where it appeared; an ordinary one left at 1.5 s
                page.wait_for_timeout(max(0, 3000 - (page.evaluate("() => performance.now()") - pressed)))
                still = page.locator(".clipboard-toast:not(.animating)").count() > 0
                check(still == warning, f"~3 s after it appeared, the toast is {'still' if still else 'no longer'} there "
                                        f"(a warning stays ~4 s, others 1.5 s)")
            finally:
                clean_up()
        return run
    add("TOAST-001", "a warning toast (Ctrl+C in the Trash: \"pasting will restore\") is amber and still where it appeared "
        "~3 s later", toast_look("Trash", TR, "c", warning=True))
    add("TOAST-002", "an ordinary toast (Ctrl+C in a folder) is not amber, and is gone from where it appeared by ~3 s",
        toast_look("Science Fiction", ND, "c", warning=False))

    # Warnings on purpose: CELL-053's refusal (MOVE-06); CELL-039's "a paste will restore" (MOVE-10, §6 item 6)
    DELIBERATE = ("MOVE-06", "MOVE-10")
    if not ONLY:
        test("CELL-058", "no unexpected console messages (the warnings MOVE-06 and MOVE-10 are on purpose)",
             lambda: check(not [x for x in app.unexpected_console() if not any(c in x for c in DELIBERATE)],
                           [x for x in app.unexpected_console() if not any(c in x for c in DELIBERATE)]))

done()
