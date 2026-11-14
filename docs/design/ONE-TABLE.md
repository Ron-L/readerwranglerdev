# The one table — what each gesture does in each place

_Status: **design, approved** (written 2026-11-12, autonomous-mode trial; Ron read and approved it, review queue Q-019;
its last open questions decided 2026-11-13, §6). Two TODO tasks meet here: "One table
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
`test/gestureTable.test.js` like `bookFields.js`. The table **decides**; the existing operations **do**
(`reparentFolder`, `softDeleteBooks`, `permanentlyDeleteBooks`, `deleteFolders`, `removeBooksFromBookList`; since
7.30.0-alpha.1 the paste's `placeItems` → `planBookPlacement` (was `pasteBooksIntoFolder` / `pasteBooksIntoBookList`),
`planReparent`, `planFolderCopy`; since alpha.2 the menus and drags too, through `placeByTable` / `dropItems` — `moveItems`
is gone). A function test fails when any combination has no row, so a new kind of
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
| Ctrl+X, then Ctrl+V or the menu's Paste | move | [code] ~5464, `pasteClipboard` ~2114; [measured] CELL-001–017 |
| Ctrl+C, then paste | copy | [code] ~5484; [measured] CELL-034–040 |
| right-click **Move to >** | move | [measured] CELL-018–023 — book menu → `moveItems`; folders only, greyed in All Books |
| right-click **Copy to >** | copy | [measured] CELL-041–043 → `moveItems(…, {isCopy})` |
| right-click **Add to Book List >** | copy (to a list) | [measured] CELL-044–046 → `addBooksToBookList` |
| right-click **Remove from list** / the Delete item in a Book List | remove from list | [code] → `removeBooksFromBookList` (7.28.1: one removal, was three copies) |
| right-click **Delete** / **Delete Folder** | delete (§3) | [code] |
| plain drag | move within one kind (folder → folder, list → list); **copy** across kinds (decided "Move and copy books anywhere" 6) | [measured] folders: plain = move, Ctrl = copy (`ctrlKeyRef`) — CELL-024–026; Book List entry: copy unless the source is another list — CELL-027, 028; a Book List's book dropped on a folder: added, the list keeps it — CELL-030 |
| Shift-drag | move, always (decided 7) | [survey] Shift is never read today |
| Ctrl-drag | copy, always (decided 7) | [measured] books: a copy (CELL-025, 029); **a folder: moved** (CELL-055, §5) |
| drag onto the Trash | delete (= the Delete key's book rows) | [measured] CELL-032 → `softDeleteBooks` (the place you're in = its source) |
| drag out of the Trash / Restore | restore | [code] `moveItems` ~4031 (any move out of the Trash restores); [measured] CELL-031 — but Ctrl+X / Ctrl+C then paste does NOT restore (CELL-014, 040) |
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
| Books and folders selected | the books | **7.28.1-alpha.2: both** — one confirmation naming both ("Delete 1 book and 1 folder from "Science Fiction"? • 'Good Omens' • "Space Opera" — 2 books, 1 subfolder …"), one receipt (alpha.1: the books only) | DELKEY-009 |
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
| Book right-click → Delete / Remove from list / Delete Permanently | ~20250–20277, ~19222 | unchanged ops (the table's book acts); Remove now `removeBooksFromBookList`. **With folders selected too: since 7.30.0-alpha.2 one item "Delete 2 Books and 1 Folder"** in the book menu and the folder menu (`deleteBothItem` → `runDeleteRow`, the key's own runner) — §6 item 9 |
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
| **Trash** | a **restore** into that folder (decided, §6 item 6) | restore + add (§6 item 6: "for every gesture") | refuse | — |
| **the same place** | nothing changes, and says so: "Nothing moved — those books are already in 'Sci-Fi'" (decided, §6 item 7.5) | same, "on the list" | — | — |

**Today, against it** (measured 2026-11-13 by `test/ui/test_cells.py`, CELL-001–058 — every cell asserts the decided
behavior; where today differs, the file's TODAY table holds what was measured):
1. folder → folder by Ctrl+X → paste: moves, saying *"Pasted 'X' into 'Fantasy' — moved from the original folder"*
   [measured CELL-001–004, 015 — the Inbox and a subfolder alike]; **into the folder it came from, it takes the books
   OUT and puts them nowhere** while saying "Pasted…" [measured CELL-007 — a harmful cell].
2. folder → Book List: cut → paste moves, last folder → Inbox (7.25.1) [measured PASTE-002/003]; a plain drag copies
   [measured CELL-027]; the book menu's Move to lists folders only [measured CELL-023].
3. All Books → anywhere: Ctrl+X refuses there ("Can't cut from this view…"), so a paste afterwards does nothing
   [measured CELL-012]; Move to is greyed ("Cannot move books from virtual folders") [measured CELL-022]; menu Cut is
   greyed [code ~19612]; a **drag** from All Books goes through `moveItems`, adds to the target and says "Moved" —
   really a copy [measured CELL-033].
4. Book List → folder: Cut [measured CELL-009], Move to [measured CELL-021] and a plain drag [measured CELL-030] remove
   nothing from the list yet say "Pasted… — moved" / "Moved" (for the drag, a copy IS the decided result — only its
   word is wrong). **Corrected — a Search is not a place:** clicking one applies its filter where you are (§1); with a
   Search applied in All Books, Ctrl+X is refused exactly as in All Books [measured CELL-013].
5. Trash → elsewhere: a drag restores (*"Restored 'A Book in the Trash' to 'Fantasy'"*) [measured CELL-031]; Ctrl+X /
   Ctrl+C work in the Trash although the menu hides Cut / Copy there [code ~19467]; Ctrl+C says only *"Copied 'X'"*
   [measured CELL-039], and a paste files the book while it stays in the Trash [measured CELL-014 cut, CELL-040 copy].
6. Shift is never read for a drag; there is no live "Copy to… — hold Shift to move" label [survey — the new drag
   gestures, "Move and copy books anywhere"].
7. **Found by the measurement (2026-11-13) — not in the design above; for Ron before anything is built on them:**
   1. **A book already in the destination, moved:** the move is right (it leaves the source), but the **Ctrl+Z is
      wrong both ways** — after Ctrl+X → paste, Ctrl+Z takes the book OUT of the destination it was in before
      (Fantasy loses Good Omens) [measured CELL-005, 006]; after Move to or a plain drag, Ctrl+Z doesn't put it back in
      the source (Science Fiction loses Good Omens) [measured CELL-019, 026]. No receipt mentions "already there".
   2. **Ctrl+Z of a move loses the book's place:** a cut → paste's Ctrl+Z puts the book back FIRST in the folder it
      came from (Science Fiction 17 18 5 → 18 17 5) [measured CELL-001, 002, 004, 015]; a Book List → Book List move's
      (cut or drag) puts it LAST on the list it came from [measured CELL-010, 028]. Move to's and the drag's Ctrl+Z
      between folders put it back in place [measured CELL-018, 024].
   3. **The second keyboard listener, measured:** after a cut book is pasted, a second Ctrl+V elsewhere moves the
      FOLDER the book was cut from (*"Moved "Science Fiction" into "Every Ownership Kind""*) [measured CELL-016];
      Ctrl+X with nothing selected cuts the folder you're in, and Ctrl+V moves it [measured CELL-017]. **And a race:**
      Ctrl+X pressed right after clicking a book (before the click's selection reaches the key listener) cuts the
      FOLDER instead of the book, and the next Ctrl+V moves the whole folder — seen in one 2026-11-13 probe run (a
      click, then Ctrl+X at once; another such run cut the book). The tests wait for the selection to settle, so they
      don't hit it; no test reproduces the race itself.
   4. **Receipts:** no move receipt names its source except the Book List paste's (7.25.1) and the Book List cut's;
      a copy says "Pasted" (keys) or "Copied" (Copy to, Ctrl-drag) — "Added" only onto a Book List; "already there"
      reads *"Book already in folder"* (Move to the same folder, CELL-020), *"Already on 'Read Next'"* (a list's cut
      pasted back, CELL-011), *"Added 1 book to 'Read Next' (1 already there)"* / *"All 1 book already in 'Read Next'"*
      (Add to Book List, CELL-045, 046); drag receipts onto a Book List put its name in double quotes.

### 4.2 Copy (Ctrl+C → paste; Copy to >; Add to Book List >; Ctrl-drag; a plain drag across kinds)

Copy only adds — the source never changes. Into All Books or the Trash: refuse, with words [measured PASTE-005, 007].
**Already there:** its own words ("'Good Omens' is already in 'Fantasy'") — today it says "Pasted 'Good Omens' into
'Fantasy'" and changes nothing [measured CELL-036; the TODO's finding 2026-11-06].

**Today, against it** (measured 2026-11-13): a copy adds and the source keeps the book, by every gesture — Ctrl+C →
paste [CELL-034, 038], Copy to [CELL-041–043], Add to Book List [CELL-044], Ctrl-drag [CELL-025, 029]; the words are
the receipts item of §4.1 item 7. **Found by the measurement — not in the design; for Ron:** a copy-paste's Ctrl+Z
takes EVERY pasted book out of the destination, including the ones that were already there: Ctrl+C → Ctrl+V of Good
Omens into Fantasy (where it already was) changes nothing, but the Ctrl+Z after it takes Good Omens out of Fantasy
[measured CELL-035, 036]; pasted back into the folder it was copied from, the Ctrl+Z after it leaves the book in NO
folder [measured CELL-037 — a harmful cell]. (Copy to's Ctrl+Z is right: it takes back only what it added, CELL-042.)

## 5. FOLDERS moved, copied, pasted — DESIGN ONLY

| Gesture | Decided / proposed | Today |
|---|---|---|
| Move a folder (Move to >, drag, Ctrl+X → Ctrl+V on the folder clipboard) | reparent; never into itself or below itself; the Inbox never moves | moves, by Move to [measured CELL-047], the folder menu's Cut → Paste [measured CELL-048] and a drag [measured CELL-054]; `reparentFolder` refuses a folder into its own subfolder (*"Can't move folder into itself or its subfolder"*) [measured CELL-053] and the Inbox [code]; `moveItems` can set a folder's parent to `__inbox__` or `__library__` on a mixed drag [survey]; a book and a folder dragged together both move [measured CELL-057 — no decided row] |
| Copy a folder | DECIDED (§6 item 8): the whole tree as "X (Copy)", every book filed in the copy too | the folder menu's Copy → Paste copies the tree with each folder's books — the decided result — but says nothing [measured CELL-049]; a **Ctrl-drag moves** the folder and says *"Copied folder 'Space Opera' to 'Fantasy'"* [measured CELL-055] |
| A folder onto a Book List entry (left pane) | adds the folder's books to the list (decided 10) | not accepted [survey] |
| Between two Book List entries | a new list there (decided 10) | not built |
| **The two keyboard listeners** | ONE: the keys read the selection, not "the folder you're in" — as Delete now does | Ctrl+X / Ctrl+C with books selected ALSO put the folder you're in on a separate folder clipboard, and a later Ctrl+V can paste that folder too [code ~5579–5662; the TODO's finding 2026-11-06; measured CELL-016, 017 and §4.1 item 7.3]. With a FOLDER selected in the right pane, Ctrl+X / Ctrl+C take the folder you're IN: Ctrl+X → Ctrl+V moved Science Fiction (not the selected Space Opera) into Fantasy [measured CELL-050]; Ctrl+C → Ctrl+V copied all of Science Fiction, books and subfolders, as "Science Fiction (Copy)", saying nothing [measured CELL-051]. A book and a folder selected: Ctrl+X → Ctrl+V moves the book only [measured CELL-056 — no decided row]. The screen test DELKEY-008 builds its setup from a file for exactly this reason. |
| Receipts | every move / copy says what happened | **Corrected:** a folder's cut → paste says *"Moved "Space Opera" into "Fantasy""* (`reparentFolder`'s receipt) [measured CELL-048]; a folder copy → paste says nothing — menu or keys [measured CELL-049, 051] |
| "Into itself or below" checks | one check | the folder menu's Paste walks down instead of up and lets a folder be copied into its own subfolder: Copy Science Fiction → Paste on Space Opera made "Science Fiction (Copy)" inside Space Opera, with its books and copies of its subfolders, saying nothing [measured CELL-052]; the folder menu's Cut → Paste there is refused [measured CELL-053]; the key refuses it [code ~5745] |

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

**Decided (Ron + Claude, 2026-11-13) — the move / copy / paste rows (§4–§5) and the right-click Delete:**

6. **Out of the Trash = a restore into the destination, for every gesture** — a copy too (a book can't be both thrown
   away and filed). Because a copy that turns into a restore is unexpected, it's said at **both ends**:
   - at **Ctrl+C in the Trash** (where you decide, and where you're looking): *"Copied 2 books from the Trash. Pasting
     them will restore them — they'll leave the Trash."*;
   - at the **paste**, the receipt's verb changes: *"Restored 2 books from the Trash into 'Fantasy'"* — never "Pasted";
   - **a warning looks like a warning**, app-wide: amber, and it stays where it appeared ~4 s (was 1.5 s) before flying
     to the status bar. The logger already tells the app each message's level; the app's hookup
     (`setToaster`, readerwrangler.js ~3002) folded warning into normal — 14 warning toasts were drawn as ordinary ones.
   No confirmation box (it would stop you to approve the only sensible result — Law 18), no refusal; Ctrl+Z undoes.
7. **Already there — nothing changes for that book, and the words say so; never a refusal.** A selection often mixes
   books already in the destination with books that aren't (books live in several folders):
   1. copy, some there: *"Added 2 books to 'Fantasy' (1 was already there)."*;
   2. copy, all there: *"Nothing to add — all 3 are already in 'Fantasy'."* (one book: *"'Dune' is already in
      'Fantasy'."*);
   3. move from 'Sci-Fi', some there: all leave Sci-Fi — *"Moved 3 books from 'Sci-Fi' to 'Fantasy' (1 was already
      there)."*;
   4. move, all there: they still leave the source — *"Moved 3 books out of 'Sci-Fi' — all 3 were already in
      'Fantasy'."*;
   5. cut, then paste back into the same folder: *"Nothing moved — those books are already in 'Sci-Fi'."* (today: the
      books end up in NO folder — §4.1 item 1);
   6. into a Book List: the same pattern, "on the list".
   The drags' "(3 were already there)" (decision 9 of "Move and copy books anywhere") is the same pattern.
8. **ANY operation on a folder includes its books and subfolders, recursively** (Ron: a rule, not just the copy's
   answer). Copying a folder copies the whole tree as "X (Copy)", and every book in it is filed in the copy too (a book
   gains a folder; it is never duplicated). Receipt: *"Copied 'Sci-Fi' (12 books, 2 subfolders) as 'Sci-Fi (Copy)'."*
   A Ctrl-drag of a folder that moves it while saying "Copied" (§5) is fixed by its row.
9. **The right-click Delete with books AND folders selected:** one item, *"Delete 2 Books and 1 Folder"*, in both the
   book and the folder menu, through the same operation as the key (File Explorer's right-click Delete takes the whole
   selection).

**Example titles** in this doc, the TODO and every message: real-looking titles ("Dune"). The test library's co-authored
book, "Written Together", read as something the app did (Ron, 2026-11-13) — renamed "Good Omens" in sprint 4.

**Decided after the measurement (Ron, 2026-11-13 18:07: "1-10 all agreed")** — what CELL-001–058 found that this doc
hadn't listed, and the cells whose answer wasn't clear:

10. **Ctrl+Z takes back exactly what the gesture changed — nothing more.** A book that was already in the destination
    stays there after Ctrl+Z (CELL-005, 006, 035, 036); a copy pasted back where it already was leaves it there
    (CELL-037 — today: in no folder); Move to › and a plain drag put the book back in its source (CELL-019, 026). As the
    folder delete already does (§3.1, 7.28.1).
11. **Ctrl+Z puts a book back in its old place** — its position in the folder, or on the Book List (CELL-001, 002, 004,
    010, 015, 028); as a restore from the Trash already does.
12. **The keyboard race** (one Ctrl+X cut the whole folder) goes with the second keyboard listener — "one keyboard
    listener" (§5); nothing else to decide.
13. **Ctrl+X / Ctrl+C act on what's selected** — a folder selected in the right pane is the one cut or copied, never
    the folder you're in (CELL-050, 051); the Delete key's rule.
14. **One wording for every gesture:** *"Moved 'Dune' from 'Sci-Fi' to 'Fantasy'"*; a copy says *"Added…"*; "already
    there" always in §6 item 7's pattern; single quotes.
15. **A copied folder's subfolders belong to the copy** (the code copies the original's `childFolderIds` — to confirm
    and fix with §6 item 8). The drop cursor over a Search that takes nothing is filed with "no fake drop signals" in
    "Move and copy books anywhere".
16. **A plain drag from All Books onto a folder = a copy:** it only adds, and says "Added" (a plain drag guesses safe;
    a re-file is Shift-drag, in the drag task) (CELL-033).
17. **A book and a folder selected together: both, for every gesture** — as Delete (Q-013, File Explorer) (CELL-056,
    057).
18. **Cut from All Books (or with a Search applied), pasted into a folder = re-file** — and when the book is in 2+ other
    folders, one question first:
    > **Move 'Dune' to 'Fantasy'?** It's also in 'Sci-Fi' and 'Beach Reads' — moving takes it out of them.
    > [Move] [Just add it] [Cancel]
    (Several books: "Move 3 books to 'Fantasy'? 2 of them are also in other folders — moving takes them out." — the
    same three buttons — that form is mine, following his; it goes to Ron with the release's new words.) Ctrl+X is no
    longer refused in All Books (CELL-012, 013).
19. **Right-click Move to › stays folders only** — "Add to Book List ›" covers putting books on a list (CELL-023: its
    expectation changes to today's).

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

**The table's own task — sprint 4 (Ron, 2026-11-13: "Word!"):**
1. The test library's "Written Together" → "Good Omens" (the fixture, its screen tests, these notes). — done.
2. A screen test that tries every cell of §4–§5 and records today's answer (the LOGGING.md pattern; PASTE-001–009 were
   its first slice) — turning every [survey] above into [measured]. **A cell that works differently from this design,
   beyond what's already listed here, goes to Ron for discussion before anything is built on it** (Ron, 2026-11-13).
   — done: `test/ui/test_cells.py`, CELL-001–058 (each asserts the decided behavior; today's differences are its TODAY
   table, reported by `differs_today` in test/ui/harness.py — so the file passes until a row is built, and FAILS when a
   cell changes in any other way). Left [survey]: Shift-drag and the left pane's own drags (the new gestures — "Move and
   copy books anywhere"), a mixed drag setting a folder's parent to the Inbox, the phone. The differences found beyond
   this design: §4.1 item 7, §4.2's "Found by the measurement".
3. ~~Ron's red pen on §4–§6~~ — done: Q-019 (read and approved), §6 items 6–9 decided 2026-11-13.
4. `decide('move' | 'copy' | 'paste', …)` rows; every gesture that exists today asks them — the keys, the menus (their
   greyed items and "why" tooltips), today's drags.
   — **7.30.0-alpha.1, the rows and the keys — built:** `gestureTable.js` — `BOOK_ROWS` / `FOLDER_ROWS` (verb × what's
   moved × from × to; 'both' = the two halves joined, a refusing half refuses the whole), `decide('paste', …)` = the
   clipboard's verb, `selectionWhat` (was `deleteWhat` — one answer to "what's selected" for Delete and the keys), every
   word the rows say (`MOVE_WORDS`, `placeWords`, `clipWords`, `refileQuestion`) — TABLE-011–020.
   — **7.30.0-alpha.2, the menus and today's drags — built:** `decide('drag', what, { placeId, ctrl }, to)` = the drag's
   verb (`dragVerb`: Ctrl copies; a plain drag moves within one kind — folder → folder, list → list — and copies across
   kinds, All Books / a Search → a folder included, §6 item 16) — TABLE-021. ONE entry point in the app,
   **`placeByTable(gesture, books, folders, from, to)`** (the table's row, then `placeItems`): the book menu's Move to › /
   Copy to › / Add to Book List › and their "New folder here…" / "New Book List…" (their making is part of the ONE undo
   step — `placeItems`' `create`), and **`dropItems`** for every drop. **`moveItems` is gone** (its book half was the
   second copy of the placement; its MOVE_ITEMS step, and the dead MOVE_ / COPY_BOOKS_FOLDER steps, with it). The book
   menu offers Move to / Copy to / Add to Book List / Cut / Copy / Paste wherever books are shown — All Books (was: Move to
   and Cut greyed) and the Trash (was: hidden) — each target greyed only when the table refuses it, with its words (Law 16);
   Paste as before (`pasteRefusal`). Measured: CELL-018–022, 024–026, 028, 030, 033, 041–043, 045, 046, 057 do what was
   decided — **no cell differs any more**; new CELL-064–069 (the Trash's menu, Move to / Add to Book List out of the Trash,
   Cut in All Books, the two "New…" entries).

   **The site map (Law 5 — two searches: every call of a move / copy operation, and every `onDrop` / menu handler):**

   | Where | Before alpha.2 | Now |
   |---|---|---|
   | Left pane: a folder's drop (~15396, its book fallback ~15500) | `moveItems` | `dropItems` |
   | Left pane: the Inbox's drop (~15121, ~15187) | `moveItems`; a fallback with its own restore | `dropItems` (the fallback's restore is unreachable — every right-pane drag carries `x-rw-items` — and is left) |
   | Left pane: a Book List entry's drop (~14900) | its own list move (COMPOUND of BOOKLIST_ADD + _REMOVE) / `addBooksToBookList` | `dropItems` (books only — a folder dropped there is the drag task's) |
   | Left pane: the Trash's drop (~15763) | `softDeleteBooks` | unchanged (§6 Q5) |
   | Left pane: the Folders header's drop (~14979) | `reparentFolder(…, null)` (folders only) | unchanged |
   | The folder path above the right pane (~15825, ~15855) | `moveItems` (a mixed drop on "Folders" made it a folder's parent) | `dropItems` (books onto "Folders": refused) |
   | Right pane: a folder row's drop, list view (~16778, ~16824) and cover view (~17525, ~17570) | `moveItems` | `dropItems` |
   | Right pane: a book row's drop (~17115, ~17738) | reorder (Manual order) | unchanged — outside the table |
   | Book menu: Move to › / Copy to › (~18996) | `moveItems` | `placeByTable('move' / 'copy')` |
   | Book menu: Add to Book List › (~19004) | `addBooksToBookList` + its own words | `placeByTable('copy', …, list)` |
   | Book menu: "New folder here…" / "New Book List…" (~19040, ~19005) | their own folder copy (MOVE_ / COPY_BOOKS_FOLDER) / `createBookList` | `placeByTable` with `create` |
   | Book menu: Cut / Copy / Paste; folder menu: Cut / Copy / Paste | `putOnClipboard` / `pasteClipboard` (alpha.1) | unchanged; the book menu's now shown in the Trash and enabled in All Books |
   | Folder menu: Move to › (~18537) | `reparentFolder` (folders only) | unchanged (the folder's own row; CELL-047) |
   | The keys (Ctrl+X / C / V, Delete) | alpha.1 | unchanged |
   | Other `addBooksToBookList` callers (Auto-Organize's "add to list", the filter bar's "add shown books") | — | not book / folder gestures of this table — unchanged |
5. One keyboard listener for the clipboard keys (§5); the harmful cells (§4.1 items 1, 3, 4, 5) fixed by their rows.
   — **7.30.0-alpha.1 — built:** the second listener and its folder clipboard are gone; ONE clipboard
   `{ type, bookIds, folderIds, from }` filled by `putOnClipboard` (Ctrl+X / Ctrl+C on the selection — books, folders or
   both, never "the folder you're in"; the book and folder menus' Cut / Copy) and pasted by `pasteClipboard(target)`
   (Ctrl+V, both menus' Paste), through refs (the keyboard race). The work: `placeItems` → `planBookPlacement` (THE
   book placement — move, copy, re-file, restore; replaces `pasteBooksIntoFolder` / `pasteBooksIntoBookList`),
   `planReparent` (reparentFolder's working-out), `planFolderCopy` (THE folder copy — was two copies, plus a Ctrl-drag that
   moved). Each records ONE undo step whose doing IS its redo: `PLACE_BOOKS` (each book's old and new position — exact
   Ctrl+Z, §6 items 10, 11) and `COPY_FOLDERS` (the new folders + the order fields; Ctrl+Y works now — it said "Cannot
   redo copy operation"). Retired: PASTE_BOOKS_CUT / _COPY, PASTE_TO_BOOKLIST_CUT, COPY_PASTE_FOLDER (UNDO-04).
   Measured: CELL-001–017, 034–040, 049–052, 055, 056 do what was decided; new CELL-059–061 (the re-file question),
   062 (a copy's subfolders are its own), 063 (a Trash copy pasted twice).
6. §6 item 6's words and the amber warning look; item 7's "already there" words; item 8 (folders recursive); item 9.
   — **7.30.0-alpha.1:** item 6's words (MOVE-10, a warning — the amber look is the next step), items 7, 8, 14, 15, 17,
   18 built; item 19: CELL-023 asserts it. `tools/run_tests.py --release` refuses while any test still differs from what
   was decided, naming each (RUN-033, 034).
   — **7.30.0-alpha.2 — item 9 built:** `gestureTable.deleteBothLabel` ("Delete 2 Books and 1 Folder", TABLE-022); the
   book menu and the folder menu (right-clicked in the right pane among the selection) show ONE such item with its key
   (Del), and it runs the key's own row (`runDeleteRow`, split out of `pressDelete`) — DELKEY-017, 018.
   — **7.30.0-alpha.3 — item 6's look built:** the app's hookup to the logger (`rwLog.setToaster`) passes 'warning' on (it
   folded it into normal); a warning toast is amber (`.clipboard-toast.warning`; its colors are tokens in
   readerwrangler.css, one set per theme — `--toast-warning-bg / -text / -border`) and stays where it appeared 4 s (others
   1.5 s; `TOAST_HOLD_MS`) before flying to the status bar. App-wide: every warning toast (MOVE-06, 07, 10; BACKUP-01…).
   TOAST-001 (amber, still there at 3 s — seen failing without the change, and with the hold set back to 1.5 s), TOAST-002 (an
   ordinary one isn't, and is gone).

**Later, in "Move and copy books anywhere" (its own sprint):** the NEW drag gestures — Shift-drag to move, the live
"Copy to 'Sci-Fi' — hold Shift to move" label, a folder dropped on a Book List entry, a drop between two Book List
entries making a new list. They read the same table.
