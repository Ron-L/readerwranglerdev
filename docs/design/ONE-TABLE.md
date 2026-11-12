# The one table — what each gesture does in each place

_Status: **design, for Ron's red pen** (written 2026-11-12, autonomous-mode trial). Two TODO tasks meet here: "One table
for every move, copy, paste and delete: what each gesture does in each place" (id 20261106-1237) and its first user, "The
Delete key deletes the folder you're in — not the folders you selected" (id 20261014-1030ay)._

**What 7.28.1 builds: the Delete rows only (§3).** Everything in §4–§6 (move, copy, paste, drag) is **design only**:
today's behavior, the decided behavior beside it, and the open questions. Those rows are built in their own task.

Every "today" in this doc is marked with how it is known:
- **[measured]** — a screen test drives it with real keys and clicks (test IDs given);
- **[code]** — read in readerwrangler.js by me, with the line;
- **[survey]** — from a read-only code survey (2026-11-12) I did not re-check line by line. A survey is a claim
  (Law 12): the task that builds those rows measures each cell first ("today's measured by a screen test that tries
  every cell", the TODO's decision 4).

Line numbers are readerwrangler.js on branch `fix/delete-key` (7.28.1-alpha.1); they drift.

---

## 1. The shape — two small tables, one function (decided 2026-11-06)

`decide(gesture, what, from, to)` — in **`gestureTable.js`**, a pure module (no React, no screen), function-tested in
`test/gestureTable.test.js` like `bookFields.js`. The table **decides**; the existing operations **do** (`moveItems`,
`reparentFolder`, `pasteBooksIntoFolder`, `pasteBooksIntoBookList`, `softDeleteBooks`, `permanentlyDeleteBooks`,
`deleteFolders`, `removeBooksFromBookList`). A function test fails when any combination has no row, so a new kind of
place, gesture or thing can't arrive without its answer.

1. **gesture → verb** (§2).
2. **verb × what's moved × from × to → outcome**: *do it* (its effects and its receipt), *refuse* (with the reason's words
   in the table), or *ask*. The same answer drives the key, the drag, the menu item's enabled / greyed state and its
   "why" tooltip (Law 16), and the drag's live label.

**Places** (one map from a place's id to its kind — `placeKind()` in gestureTable.js):

| Kind | What it is | Its id |
|---|---|---|
| folder | a folder you made (top level, subfolder, pinned) | its own id |
| inbox | the Inbox — a real folder, never deleted or moved | `__inbox__` |
| all-books | All Books | `__all__` |
| folders-view | the **Folders** header: the right pane lists the Inbox and the top-level folders | `__library__` |
| searches-view | the **Searches** header | `__views__` |
| book-lists-view | the **Book Lists** header | `__booklists__` |
| book-list | one Book List | `__booklist_<id>__` |
| search | one Search (clicking a Search applies its filters where you are; it is never the place you're in) | `__view_<id>__` |
| trash | the Trash | `__trash__` |

Not places: windows (Removed books, Tag from Collections…) — while any window is open, Delete and the clipboard keys
belong to it (`dialogUp()`, readerwrangler.js ~5425) [code]. The phone (mobile.js) has no move, copy, paste or delete
gesture [survey].

## 2. Gestures → verbs

| Gesture | Verb | Today |
|---|---|---|
| **Delete key** | delete (§3) | **built 7.28.1** |
| Ctrl+X, then Ctrl+V or the menu's Paste | move | [code] ~5464, `pasteClipboard` ~2114 |
| Ctrl+C, then paste | copy | [code] ~5484 |
| right-click **Move to >** | move | [survey] book menu ~19364 → `moveItems` |
| right-click **Copy to >** | copy | [survey] ~19417 → `moveItems(…, {isCopy})` |
| right-click **Add to Book List >** | copy (to a list) | [survey] ~19455 → `addBooksToBookList` |
| right-click **Remove from list** / the Delete item in a Book List | remove from list | [code] → `removeBooksFromBookList` (7.28.1: one removal, was three copies) |
| right-click **Delete** / **Delete Folder** | delete (§3) | [code] |
| plain drag | move within one kind (folder → folder, list → list); **copy** across kinds (decided "Move and copy books anywhere" 6) | [survey] folders: plain = move, Ctrl = copy (`ctrlKeyRef`); Book List entry: copy unless the source is another list |
| Shift-drag | move, always (decided 7) | [survey] Shift is never read today |
| Ctrl-drag | copy, always (decided 7) | [survey] |
| drag onto the Trash | delete (= the Delete key's book rows) | [survey] ~15860 → `softDeleteBooks` |
| drag out of the Trash / Restore | restore | [code] `moveItems` ~4031 (any move out of the Trash restores) |
| left-pane drags (folder onto folder, onto a Book List, between Book List entries) | move folder / add to list / new list (decided 10) | [survey] onto a Book List entry: not accepted today |
| reordering (folders, pins, Book Lists, Manual order) | reorder — not a membership change; stays outside the table | |

## 3. Delete — BUILT in 7.28.1

**The rule (Ron + UX, 2026-10-22; books and folders together: Ron, 2026-11-12, review queue Q-013), in one sentence:**
Delete acts on what's selected where you're working — the books and folders selected in the right pane (both, when both
are: one confirmation naming both, one undo — as File Explorer does); with nothing selected, only when the left pane has
your focus, the folder highlighted there; otherwise nothing. Several folders get one confirmation listing them and one
undo for the lot.

**"The left pane has your focus"** = your last click (or keyboard focus) was inside the left pane (`focusPaneRef`, read at
the click; `data-left-pane` on the pane). A click anywhere else — the right pane, the toolbar, a menu — moves it away.

### 3.1 The rows (`DELETE_ROWS` in gestureTable.js)

What's selected → what Delete does, per place. "—" = the cell can't be reached (nothing of that kind is shown there);
the table still holds a row for it, saying so.

| What's selected | folder / inbox | all-books / search | folders-view | searches-view / book-lists-view | book-list | trash |
|---|---|---|---|---|---|---|
| **books and folders** (7.28.1-alpha.2) | **both**: one confirmation naming the books and the folders, one undo. The folders go first (their books to the folder you're in), then the books by this place's books row — so a selected book that was also in a selected folder really leaves. Owned books bound for the Trash: Hide Instead is a button in the same box | (both, the books by this place's books row — can't be reached: no folders shown) | (the folders row — no books shown) | (the folders row — no books shown) | (the books only — no folders shown) | (the books only — no folders shown; and a delete forever can't share one undo with a folder delete) |
| **books** (no folders) | out of this folder; a book in no other folder goes to the Trash (owned books: the hide-instead question) | out of every folder, into the Trash | — | — | off this list only | delete forever, after a confirmation |
| **folders** (no books) | delete those folders | — | delete those folders | — | — | — |
| **nothing**, focus in the right pane | nothing | nothing | nothing | nothing | nothing | nothing |
| **nothing**, focus in the left pane | delete the folder highlighted there; **the Inbox: says "The Inbox can't be deleted."** | nothing | nothing (a header) | nothing (a header) | nothing — **proposed: delete the Book List** (Q3) | nothing |

**Deleting folders** (`deleteFolders`, one operation for the key, the folder menu's Delete and the left pane's ×):
1. **One folder:** as before — a confirmation only when it holds books or subfolders ("Delete "Space Opera", its 2
   books, and 1 subfolder? The books return to "Science Fiction"."); an empty one goes with no question (nothing to
   lose; Ctrl+Z; the receipt says it). The confirm button now says **Delete** (was OK).
2. **Several folders:** one confirmation, always, listing them —
   *"Delete these 2 folders? • "Every Ownership Kind" — 11 books • "An Empty Folder" Their books return to the Inbox."* —
   and **one** Ctrl+Z brings them all back.
3. **Books go to each folder's parent** (the Inbox for a top-level folder) — only the ones not already there are added,
   and only those come back out on undo.
4. **The Inbox is never deleted.** Selected with others, they go and the words add "The Inbox stays — it can't be
   deleted."; alone, a toast says "The Inbox can't be deleted." (Law 16: a key aimed at something never fails silently.)
5. **Undo returns you to where you were** (was: into the first restored folder — right only when Delete always took
   the folder you were in).
6. **The right-click Delete is selection-aware**, as Pin already was: right-click one of several selected folders →
   "Delete Folders (2)", the same confirmation as the key.

### 3.2 Today (before 7.28.1) vs now — measured

| Case | Before 7.28.1 | 7.28.1 | Test |
|---|---|---|---|
| A subfolder selected in the right pane, Delete | deleted the folder you were IN ("Delete "Science Fiction", its 5 books, and 2 subfolders?") | deletes the selected subfolder | DELKEY-001 |
| Nothing selected, inside an empty folder, last click in the right pane | that folder deleted, no question | nothing | DELKEY-002 |
| Nothing selected, left pane clicked | the highlighted folder | the same (the rule's left-pane row) | DELKEY-003 |
| Several folders selected in the Folders view | nothing at all (the handler needed a real folder to be "in") | one confirmation, all deleted, one undo | DELKEY-004, 005 |
| The Inbox selected | nothing, silently | says it can't be deleted; others still go | DELKEY-006 |
| Right-click Delete on one of several selected folders | only the clicked one | all the selected ones | DELKEY-007 |
| Ctrl+Z after deleting a subfolder whose book is also in its parent | the book left the parent too | the parent is as it was | DELKEY-008 |
| Books and folders selected | the books | **7.28.1-alpha.2: both** — one confirmation naming both ("Delete 1 book and 1 folder from "Science Fiction"? • 'Written Together' • "Space Opera" — 2 books, 1 subfolder …"), one receipt (alpha.1: the books only) | DELKEY-009 |
| … Cancel at that confirmation | — | nothing changes | DELKEY-012 |
| … then Ctrl+Z, Ctrl+Y | — | one Ctrl+Z puts it all back exactly (the books where they were, the folders with their books, nothing extra); Ctrl+Y does it all again | DELKEY-013 |
| … a selected book also inside the selected folder, in no other folder | — | the folder goes, then the book — to the Trash (books first, the folder's delete would have put it back); the box says it's owned, with Hide Instead; one Ctrl+Z | DELKEY-014, 015 |
| Ctrl+Y after undoing a book deleted from one folder | took the book out of **every** folder (it lost its others) | out of that folder only, as the delete did | DELKEY-016 |
| Delete in a Book List | off the list, **silently** | off the list, with a receipt | DELKEY-011 |
| A toast shown within ~2.5 s of another | hidden after ~0.8 s by the older toast's timers | shows its full time | DELKEY-011 |

The rows themselves: TABLE-001–010 (every combination has a row; the order; the Inbox is never taken; the 'both' rows take
both where both are shown, and each 'both' row's book half IS that place's books row — the two can't drift).

### 3.3 The Delete site map (Law 5 — two searches: every `'Delete'` key test, and every call of a delete operation)

| Where | readerwrangler.js | Now |
|---|---|---|
| The Delete key | ~5582 → `pressDelete` ~5362 | the table; books and folders together → `deleteBooksAndFolders` (alpha.2: `planFolderDelete` + `planBookDelete` / `applyBookDelete`, the same working-out `deleteFolders` and `softDeleteBooks` use; one COMPOUND undo step of their own steps) |
| (the second keyboard listener's Delete — "the folder you're in") | was ~5687 | **removed** — the bug |
| Folder right-click → Delete Folder | ~19047 | `deleteFolders(menuTargets)` — selection-aware |
| Left pane × on a folder | ~15805 | `deleteFolders([id])` |
| Book right-click → Delete / Remove from list / Delete Permanently | ~20250–20277, ~19222 | unchanged ops (the table's book acts); Remove now `removeBooksFromBookList`. **With folders selected too, still the books only** (its words say "Delete 2 Books") — §6 item 9 |
| Drag onto the Trash | ~15884 | `softDeleteBooks` — unchanged (§6 Q5) |
| Trash: Empty Trash; Removed books: delete | ~16049, ~11415 | unchanged — explicit, confirmed, outside the key |
| Book List delete (×, menu); Search delete | ~15055, ~18483; ~14894, ~19128 | unchanged — no key reaches them (Q3) |
| Tag Manager's delete | ~18277 | not a book / folder gesture — outside the table |

## 4. Move and copy BOOKS — DESIGN ONLY (built in the table's own task)

The decided behavior is "Move and copy books anywhere" (TODO, decisions 1–11, 2026-10-21). Rows = where the book is
**from**; columns = where it goes **to**. One undo step per gesture, always.

### 4.1 Move (Ctrl+X → paste; Move to >; Shift-drag; a plain drag within one kind)

| from \ to | folder / Inbox | Book List | All Books | Trash |
|---|---|---|---|---|
| **folder / Inbox** | out of the source, into the destination | onto the list, out of the folder; a book leaving its LAST folder goes to the Inbox and the receipt says so | refuse: "Every book is already in All Books…" | refuse: "Can't paste into the Trash. To put books in the Trash, press Delete." (a drag there = Delete) |
| **All Books / a Search** (no container) | **re-filed:** leaves its other folders (ask first, listing them, when 2+) | just added (lists don't file books) | refuse (as above) | as above |
| **Book List** | off the list, into the folder | off the first list, onto the second | refuse | as above |
| **Trash** | a **restore** into that folder (proposed — Q6) | proposed: restore + add | refuse | — |
| **the same place** | proposed: nothing changes, and says "already here" (Q7) | same | — | — |

**Today, against it:**
1. folder → folder by Ctrl+X → paste: moves [code ~2132]; **into the folder it came from, it takes the books OUT and puts
   them nowhere** while saying "Pasted…" [code — the source branch runs first, the target branch never; a harmful cell].
2. folder → Book List: cut → paste moves, last folder → Inbox (7.25.1) [measured PASTE-002/003]; a plain drag copies;
   the book menu's Move to lists folders only [survey].
3. All Books → anywhere: Ctrl+X and menu Cut / Move to refuse there [code ~5468]; a **drag** from All Books goes through
   `moveItems`, adds to the target and says "Moved" — really a copy [survey].
4. Book List / Search → folder: Cut, Move to and drag remove nothing from the list yet say "moved" [survey; the TODO's
   own finding 2026-11-06].
5. Trash → elsewhere: a drag restores [code ~4031]; Ctrl+X / Ctrl+C work in the Trash although the menu hides Cut /
   Copy there, and a paste files the book while it stays in the Trash [survey].
6. Shift is never read for a drag; there is no live "Copy to… — hold Shift to move" label [survey].

### 4.2 Copy (Ctrl+C → paste; Copy to >; Add to Book List >; Ctrl-drag; a plain drag across kinds)

Copy only adds — the source never changes. Into All Books or the Trash: refuse, with words. **Already there:** its own
words ("'Written Together' is already in 'Fantasy'") — today it says "Pasted 'Written Together' into 'Fantasy'" and
changes nothing [the TODO's finding 2026-11-06].

## 5. FOLDERS moved, copied, pasted — DESIGN ONLY

| Gesture | Decided / proposed | Today |
|---|---|---|
| Move a folder (Move to >, drag, Ctrl+X → Ctrl+V on the folder clipboard) | reparent; never into itself or below itself; the Inbox never moves | `reparentFolder` refuses both [survey]; `moveItems` can set a folder's parent to `__inbox__` or `__library__` on a mixed drag [survey] |
| Copy a folder | proposed: a deep copy named "X (Copy)" — **do the books get copied into it, or only the folders?** (Q8) | the folder clipboard's copy keeps each folder's books [survey]; a **Ctrl-drag moves** the folder but the receipt and undo say "Copied" [survey] |
| A folder onto a Book List entry (left pane) | adds the folder's books to the list (decided 10) | not accepted [survey] |
| Between two Book List entries | a new list there (decided 10) | not built |
| **The two keyboard listeners** | ONE: the keys read the selection, not "the folder you're in" — as Delete now does | Ctrl+X / Ctrl+C with books selected ALSO put the folder you're in on a separate folder clipboard, and a later Ctrl+V can paste that folder too [code ~5579–5662; the TODO's finding 2026-11-06]. The screen test DELKEY-008 builds its setup from a file for exactly this reason. |
| Receipts | every move / copy says what happened | folder cut / copy / copy-paste say nothing [survey] |
| "Into itself or below" checks | one check | the folder menu's Paste walks down instead of up and lets a folder be copied into its own subfolder; the key refuses it [survey] |

## 6. Questions for Ron (the review queue holds the same, with costs)

Decided in 7.28.1 without asking (autonomous mode — each is cheap to reverse):
1. **Nothing selected → nothing, and no message.** Your words: "With nothing selected, Delete does nothing." A hint
   ("Select books or folders, then press Delete") was considered for people used to the old behavior; not added.
2. **The Inbox gets words** when Delete is aimed at it — alone ("can't be deleted"), or among others ("stays").
3. **A Book List highlighted in the left pane + Delete: nothing** (the decided rule names folders). Proposed: delete it,
   as its right-click Delete does (asks first when it has books; Ctrl+Z).
4. **Books and folders selected together — DECIDED (Ron, 2026-11-12, review queue Q-013): both, in one confirmation and
   one undo — what File Explorer does.** Built in 7.28.1-alpha.2 (alpha.1 deleted the books only). Decided with it,
   without asking (each cheap to reverse): the folders go first, then the books (so a selected book that was also inside
   a selected folder really leaves); owned books bound for the Trash get Hide Instead as a button in that one box (not
   a second box); the cells where both can't be shown say what they'd do (§3.1 — the Trash and a Book List: the books
   only).
5. **Drag onto the Trash** keeps today's book-only behavior; a folder dragged onto the Trash is not accepted.

Open for the move / copy / paste rows (§4–§5):

6. A move OUT of the Trash = a restore into the destination, for every gesture (today only a drag does)?
7. Pasting where the books already are: nothing, with "already here" words — or refuse?
8. Copying a folder: copies its books' memberships too (today's folder clipboard), or only the folder tree?

Open for the Delete rows (7.28.1-alpha.2):

9. **The right-click Delete with books AND folders selected.** The key now takes both; the book menu's Delete ("Delete 2
   Books", showing "Del" as its key) still takes the books only, and the folder menu's "Delete Folders (2)" the folders
   only. Each item's words say what it acts on, so neither misleads — but the book item's "Del" promises the key's
   behavior. Proposed: when both are selected, one item "Delete 2 Books and 1 Folder" in both menus, through the same
   operation as the key (File Explorer's right-click Delete takes the whole selection).

## 7. Build list

**7.28.1 (this fix) — built:**
1. `gestureTable.js` — the place kinds, `decide('delete', …)`, the Delete rows, the decided order, the Inbox rule.
2. The Delete key reads the table (`pressDelete`); the second listener's Delete branch is gone.
3. `deleteFolders` — one / several folders, one confirmation, one undo, the Inbox stays; the key, the folder menu
   (selection-aware) and the left pane's × use it.
4. The undo of a folder delete takes back only what it added, and returns you where you were.
5. `removeBooksFromBookList` — one removal (key + two menu items), with a receipt.
6. A newer toast is no longer hidden by an older toast's timers.
7. Tests: TABLE-001–008 (tier 1), DELKEY-001–011 (tier 2).

**7.28.1-alpha.2 — books and folders together (Ron, 2026-11-12, Q-013) — built:**
1. `gestureTable.js` — the 'both' rows (`delete-books-and-folders`, its book half = the place's books row); `deleteWhat`
   answers 'both'.
2. `deleteBooksAndFolders` — one confirmation naming both (Hide Instead in it when owned books would go to the Trash),
   one COMPOUND undo step; `deleteFolders` and `softDeleteBooks` split into a plan and an apply it shares.
3. Redo of a book delete takes the books out of the folders they left only (was: every folder).
4. Tests: TABLE-003 (changed), 009, 010; DELKEY-009 (changed), 012–016.

**The table's own task — next:**
1. A screen test that tries every cell of §4–§5 and records today's answer (the LOGGING.md pattern; PASTE-001–009 were
   its first slice) — turning every [survey] above into [measured].
2. Ron's red pen on §4–§6.
3. `decide('move' | 'copy' | 'paste', …)` rows; every gesture in §2 asks them; the menus' greyed items and tooltips and
   the drag label read them.
4. One keyboard listener for the clipboard keys (§5); the harmful cells (§4.1 items 1, 3, 4, 5) fixed by their rows.
