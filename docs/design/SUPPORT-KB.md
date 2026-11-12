# Support Knowledge Base — the questions users ask, answered

_The raw material for the USER-GUIDE and the support GPT (docs/design/SUPPORT-GPT.md: "the real
asset is the docs"). Organized by feature area; entries are phrased as the questions a user
would ask. Two source pivots: (1) the **feature surface** — every menu item, tooltip, dialog,
and page implies a question; (2) **real usage** — the working-session transcript
(2026-05-10 → present), post-mortems, and design docs. Kept current by the standing rule:
**any support-shaped answer lands here (facts/fixes) or in WORKFLOW-PATTERNS.md (usage
patterns) in the same breath as answering.** The Release Checklist backstops it._

_**Up to date as of 2026-11-12 (through release 7.28.1)** — all sections human-reviewed (§1–21).
7.28.1: the Delete key acts on what you selected — §12 gains "The Delete key acts on what you selected" (folders, books
and folders together, nothing selected, the Inbox, the right-click Delete Folders (2), "it used to delete the folder I
was in"). Comb for "Delete", "DEL", "Undo", "Redo", "Inbox", "folder": the book-delete paragraph, the Book List DEL line,
the Trash DEL line and the shortcut table's "context-aware" DEL row still hold.
7.28.0: Diagnostics gains **Send a test message** — §19's Diagnostics answer says how to use it, and a new row explains
a line or bar marked TEST (UI-07). The logging moved into its own kit behind the scenes: nothing a person sees changed
but one code (Copy diagnostics' "couldn't be copied" warning is UI-06, was SHARE-01 — the KB never quoted it). Comb for
"Diagnostics", "banner", "TEST", "SHARE", "passphrase", "Copy diagnostics": no other entry changed.
7.27.1: the reset messages reworded (none quoted here) — §19 gains "I reset the app — is my copy in the cloud safe?"
(checked in the code: the first change after books are back replaces the cloud copy). Comb for "reset", "files on disk",
"Export", "amazon-library", "Download Collections", "Import from Relay": nothing else quoted the changed words.
7.27.0: the app opens in about a second (built ahead of time) — §19's "Loading feels stuck" row rewritten (a long load now
means something's wrong); the reset page's recovery panel and the security page's note reworded. Comb for "slow",
"seconds", "unresponsive", "compil", "loading", "cover", "cache", "Export Backup", "amazon-library", "Reset App",
"security": no other entry changed (cover/list views still show covers as before; the reset messages' remaining old
words are TODO "Old words, quick win").
7.26.0: Diagnostics (Help → Diagnostics…, the 🕐's Full log…, Copy diagnostics, the two switches, the banner and the
"hit a problem" box) — §19 new Q + two rows, §13 pointer, §17 phone Q; Restore puts back exactly the backup, refuses
an unusable file with every reason, Save Backup waits for the load — §15 items 5–7. Comb for "Restore", "Import
Error", "Load credentials", "Library repair", "console", "🕐", "Help →", "Channel ID": no other wording changed (the
credentials button now says "backup file"; the KB never quoted it).
7.25.0: signed relay changes — §2's credentials answer (the passphrase also signs every change) and §14 item 6 (the
three new refusals); comb for "relay", "revoked", "credentials", "Channel ID", "passphrase": no other wording changed.
7.24.0: Tag from Collections redesigned + exact-text tag names + undo removes a created tag — §9 rewritten (new Qs:
"Read" vs "read", undo of a new tag, removing a tag from many books).
7.23.0: no user-visible wording changed (the Relay and the app delete leftover sync copies).
7.22.0: no user-visible wording changed (the Relay's daily storage report).
7.21.3: Add Bibliography to Wishlist (every author tab; Kindle only; a Language panel first) — new Q in §14 (swept
late, 2026-10-20: missed at 7.21.3's release).
7.21.2: Date Added choices (This year / Last year follow the calendar; Earlier year dropdown) — new Q in §5.
7.21.1: no user-visible wording changed (sync storage cleanup).
7.21.0: self-hosting / contributor mode — new Q in §14.
7.20.0: new Tools menu — every "File →" / "View →" path to a moved item (Auto-Organize, Removed books, Manage Tags,
Tag from Collections, Reset App) now reads "Tools →".
7.19.0 comb hits: removed books (§12 new Q, §14 pointer), undo visibility (§13), Tag from Collections
title links + per-list Select all (§9), goals cleared after import (§16), Ctrl+A areas (§18).
7.18.0 (one shared system for every window/menu/popup): comb hits updated — Preview hover popup
(§Auto-Organize), zero-match Save (§10), book-window Share ▾ (Share), Esc/Ctrl+A rows + hover
(§18). 7.17.0 was under-the-hood (no section content changed).
Earlier passes: feature-surface (140 UI strings, all menus/dialogs/pages walked) + transcript/
post-mortem mining. Scrub rule (public repo): no channel IDs, tokens, cookies, emails, or
user-identifying data — facts only._

Companion docs: **WORKFLOW-PATTERNS.md** (usage patterns & trade-offs), **TERMINOLOGY.md**,
**SUGGESTED-ORGANIZING-PRINCIPLES.md** (the suggested method, in full).

---

## 1. What is ReaderWrangler?

**What does it do?** Amazon's Your Books page lists everything you own — as one endless,
sorted scroll. You can't group books, reorder them, or make lists of them. In short: you
can't *organize* them. ReaderWrangler pulls your library — covers, series, ratings,
descriptions, prices, your Kindle collections — into a page that lives in *your* browser,
and lets you arrange it your way: folders, tags, Book Lists, saved Searches, drag-and-drop,
and an Auto-Organize that files whole author backlogs in one preview. Its reason to exist:
**unbury your next great read.**

**Do I install anything?** No. It runs entirely in your browser at readerwrangler.com — no
install, no account, no sign-up. (The one thing you drag to your bookmarks bar is a
bookmarklet used on Amazon's own pages to fetch your library.)

**Where is my data? Who can see it?** Your library lives in *your browser* on your machine.
Syncing between your devices travels through a relay in the cloud, but everything stored
there is encrypted with a key only your devices hold — the relay (and its operator) cannot
decipher your library. Details: the Security & Privacy page.

**Does it cost anything?** No.

**Does it change anything on Amazon?** No. Fetching reads your library via the same requests
Amazon's own "Your Books" page makes. Nothing you do in ReaderWrangler (folders, tags,
deletes) writes back to your Amazon account — all your organization lives in your browser,
on your computer.

**Does it work for non-Kindle books?** Its data source is your Amazon content library, which
includes print books Amazon knows you bought, samples, borrows (Prime/KU), and wishlist adds
you make via the bookmarklet from any product page — print editions included.

## 2. Getting started

**The whole path, in order** (also in the app under Help → How To Use):
1. **Set up sync** — File → Relay Setup: generate your credentials, **drag the bookmarklet to
   your bookmarks bar**, and optionally pair your phone with the QR code.
2. **Fetch** — on your Amazon Your Books page, click the bookmarklet and choose **Download Library**.
   For your Kindle collections/read status, run the bookmarklet on the Manage Your Content & Devices
   page instead and choose **Download Collections** (it offers a "Go to Amazon Collections Page"
   button). Let it finish — including the background orphan scan after "fetch complete."
3. **Import** — back in ReaderWrangler: File → Import from Relay. Your books appear in the
   **Inbox**. (A just-finished fetch can take up to a minute to arrive — if Import says
   "up to date" too soon, wait a moment and try again.)
4. **Organize** — drag books into folders, tag them, build Book Lists — or right-click →
   Auto-Organize to file whole authors at once. Repeat steps 2–3 occasionally to pick up new
   purchases.

**What's the bookmarklet, and why one?** A bookmark that runs the fetcher on Amazon's page —
it's how your (already logged-in) browser session reads your own library. Nothing to install,
no password ever given to ReaderWrangler. Your ReaderWrangler relay credentials are baked
into it when you create it — if you ever regenerate credentials, drag a fresh bookmarklet
(the app detects mismatches and offers it).

**What are my credentials?** A **Channel ID** and a **Passphrase** (File → Relay Setup). The
Channel ID is your private channel through the Cloudflare relay; the Passphrase is the key that
encrypts everything the fetcher and the app exchange on that channel — so the relay only ever
holds **encrypted** data it can't decipher. Both live only in this browser. When you make a
bookmarklet, your credentials are copied into it ("baked in") so the fetcher can encrypt your
library with your passphrase before sending it through the relay — which is why regenerating your
credentials means dragging a fresh bookmarklet. **Since 7.25.0 the passphrase also signs every change**
sent to the relay (with a separate key made from it — the passphrase itself still never leaves your
devices), and the relay refuses an unsigned change once your channel has started signing. So knowing a
Channel ID alone no longer lets anyone change or delete your synced copy. Nothing to set up: an
existing channel switches over by itself at its next save.

**Do I need an Amazon account to try it? (The Demo Library.)** No — download the demo library
(100+ classic books) from the home or Tutorials page, open ReaderWrangler, and load the file:
on a fresh install the Welcome screen offers **Restore a backup** — choose the downloaded
`readerwrangler-demo-library.json`. (Same path later: File → Restore Backup….) Every feature
works on it: folders, tags, filters, Auto-Organize.

**What's the Welcome screen telling me?** It appears when the app finds no books. If you're
genuinely new, it walks you through setup. If you're a returning user whose browser data was
cleared (or a new machine), it says so — *"Your folders and lists are intact"* — and lists
recovery options best-first: Import from Relay (your synced library is still there), Restore
a backup, or fetch fresh then import. It never means your organization is gone.

**How do I keep it current?** Buy books as usual; every so often run the bookmarklet —
Download Library, plus Download Collections when your Kindle collections or read status
have changed — then Import from Relay. Incremental fetches are quick — they stop at the
newest book ReaderWrangler already knows.

## 3. The sidebar: what all those sections are

_(Concepts below; per-feature details in their own sections.)_

- **All Books** — every unique book in your library, organized or not. A view, not a folder:
  you browse, filter, edit, and (since 7.11) delete here, but books can't be *moved* from
  here (there's no single "from").
- **Searches** — saved filter presets. Clicking one applies its filters to whatever you're
  viewing. They're live: results change as your library does.
- **Book Lists** — flat, hand-curated lists of books (the same book, not a duplicate). Adding/removing a
  book from a list never moves, tags, hides, or deletes the book itself — like a library card
  catalog: destroy the index card and the book stays on the shelf.
- **Inbox** — where newly imported books land, awaiting a decision. Drag them into folders
  (or Auto-Organize) to file them.
- **Folders** — your hierarchy; a folder is a book's *home*. Folders nest (author → series is
  the common shape) — but nothing says they must *all* be authors: mix in catch-all shelves
  (*Various Authors*, *Non-Fiction*, *Comics*), or anything your imagination suggests.
- **Trash** — deleted books, still recoverable until you empty it. Just like your computer's
  recycle bin.

**Folders vs Book Lists vs tags — which do I use?** Three tools, three textures: **a folder
is a shelf** — where the book belongs, its home. **A Book List is a stack of index cards** —
any hand-picked set: a to-read queue, all your SF, your wife's books; tear up a card and the
book stays on its shelf. **A tag is a sticky note** — a label you filter by, in any
combination with everything else, for unlimited views of your collection. (Tags are the one
tool here without a sidebar section of their own — they live in the filter bar, and under
Tools → Manage Tags.) Book Lists and tags overlap on purpose — plenty of schemes work as
either, and which carries what is *your* preference. ReaderWrangler provides the tools; the
schema is yours. Proven patterns and their trade-offs: WORKFLOW-PATTERNS.md.

## 4. Views, columns & sorting

**Cover View vs List View** (View menu or the toolbar toggle): covers for browsing by eye —
with a width slider to size them — and List for data work: sortable columns, more fields
visible at once. Each folder remembers its own sort; series-grouped displays show group
headers you can collapse (and Collapse/Expand All Groups controls).

**Columns are yours to shape** (List View): **Choose Columns** picks which show (Title,
Author, Series, #, Ownership, Format, ASIN, ratings, prices, price date, dates, Amazon
link…), drag headers to reorder, drag edges to resize. **Click a header to sort; click again
to reverse; Shift+Click another column for a secondary key** (e.g. Series, then #). This is
also the answer to "I can't filter by X" — add the column and sort.

**Badges on covers**: non-purchased ownership shows as a badge (SAMPLE, PRIME…); wishlist
books render dimmed; a cut book wears "marching ants"; hidden books dim further.

**Number by Current Order** (right-click, with books selected): stamps series positions to
match the current display order — arrange 32 unrelated Heinleins by publication date, select,
number them once.

## 5. Search box & filters

**What does the search box match?** Title, author, or series — anywhere in the field, as you
type. Recent filter combos live in its dropdown (apply, save, or remove them).

**What can I filter by?** Ownership type (Owned / Wishlist / Sample / Prime…), read status,
tags, Kindle Collections, series, Amazon rating, your rating, date added — plus **Show
Hidden** (a three-state control: hide hidden / show all / *only* hidden) and **Goal Met**
(books at or below your price goal). Filters combine.

**What are the Date Added choices?** Last 30 days, Last 90 days, Last 12 months, **This year** and **Last year**
(these two always follow the calendar — on January 1 they move on by themselves), then **Earlier year**: a small
dropdown listing only the years your library has books from, newest first. **Custom range…** takes any two dates.
"Date added" is when the book arrived in your Amazon library. A Search saved with one fixed year keeps that year.

**Why does my folder look empty?!** A filter is almost certainly active — filters *persist*
as you click between folders (that's what makes them useful), and folder counts switch to
"matching/total" (e.g. 3/41) while one is on. The Active-filters banner names what's applied;
**Clear All** restores the world. Hidden books are always counted honestly ("3134 of 3136 —
2 hidden by user").

**Can't filter by some field?** More than one way to skin a cat: List View → Choose Columns →
add the field (Format, ASIN, publication date, price date…) → sort by it.

**Do folders with no matches disappear while filtering?** They're hidden to reduce noise —
the "Show all" control at the top of the sidebar brings them back (sticky until you change
it).

## 6. Folders & organizing by hand

**How do I move books into folders?** Drag them (multi-select first if you like: click,
Ctrl+click, Shift+click for ranges, Ctrl+A for all). Plain **drag moves; Ctrl+drag copies** —
the toast confirms which happened (kept in the 🕐 message log by the status bar — see §13). Right-click → **Move to ▸ / Copy to ▸** offers the folder
tree as a menu (in your sidebar's order), including "New folder…" targets. Cut/copy/paste
works too: Ctrl+X marks books with a dashed "marching ants" border — **nothing moves until
you paste** into the destination folder (Esc cancels a pending cut from anywhere). **Pasting into a Book List**
(7.25.1): a copy adds the books to the list; a cut **moves** them — out of the folder they were cut from, onto the list —
and a book that leaves its **last** folder goes to the Inbox (every book lives in a folder; the Inbox means "not filed
yet"); the message says so, and Ctrl+Z puts it all back. Paste can't go into All Books or the Trash — it says why (to put
books in the Trash, press Delete).

**Can a book be in two folders?** Yes — a deliberate copy (Ctrl+drag or Copy to) gives it two
homes; both show the same book. Hover a cover to see everywhere it lives ("Found in… / On
Book Lists…"). But a book can't appear twice in the *same* folder — dropping it on a folder
that already holds it says "Book already in folder" rather than making a duplicate.

**How do folders themselves get organized?** Folders nest (drag one into another; a folder
can't be dropped into its own subtree, and the Inbox can't be moved). The FOLDERS list has
**one order, mirrored everywhere it appears** — sidebar, the Folders view in the right pane,
and the Move/Copy menus:
- **Sort modes**: Manual (drag to reorder), Name, or book Count — pick via the FOLDERS-header
  control (sidebar) or column headers (right pane, where clicking cycles ascending/descending).
- **Drag-reorder works only in Manual** — in a sorted mode the app says so instead of
  silently ignoring you; Move to Top / Move to Bottom likewise explain when they can't apply.
- **Your Manual order survives sort excursions**: flip to Name to find something, flip back
  to Manual and nothing has moved. Like a sorted order enough to keep it? **Bake** it — the
  sorted order becomes your new Manual order.
- **📌 Pin folders to the top** (right-click → Pin to top): pinned folders float in their own
  small hand-ordered zone above whatever sort is active — how "Various Authors / New To Read"
  stay on top of an alphabetized author list. The pin boundary is a wall for drags in both
  directions.
- **New folders land at the top** (below pins) so you can see what you just made; a batch of
  new folders (one Auto-Organize pass) lands as an alphabetized block.

**Where do subfolder books show up?** A folder's count includes its subtree; in sorted modes
a parent row shows "N matching in subfolders" when a filter matches deeper down.

**Each folder remembers its own book sort** (title, author, series, date…, or Manual), and
returning to that folder restores it. Series sorting uses series then # — Shift+Click a
column header for your own secondary key.

## 7. Auto-Organize

**What does it do?** Files books into `Author` folders (and `Author/Series` subfolders) for
you — the cure for a thousand-book Inbox. Two entry points, one engine:
- **Right-click a book → Auto-Organize ▸ By Author / By Series** — acts on the chosen
  authors' books.
- **Tools → Auto-Organize…** — the wizard: pick multiple authors at once (filter box,
  All/Some/None, minimum-books slider), then the same preview.

**The preview is the contract.** It shows *everything* by the chosen authors, wherever it
lives: books from the folder you launched in and the Inbox arrive pre-checked (they'll move);
strays living elsewhere are visible but unchecked (they stay unless you check them); books
already in their destination show small and gray, labeled **home**. **The checkboxes are the
scope** — the button counts what will actually move ("Organize 4 books"), and nothing you
left unchecked is touched. Every cover carries a caption saying where it lives now; click it
for the plain-words breakdown ("moves from Wishlist · stays in Non-Fiction") with per-folder
checkboxes for copies that should stay put.

**What's the ⚙ Options strip?** Live controls inside the preview: the series-folder threshold
(how many books a series needs before it earns its own subfolder — below it, books file
directly under the author), and related knobs. Adjust and watch the preview reorganize.

**Will it undo my existing organization?** No — two guards. Books already filed elsewhere are
never pulled without your checkbox, and Auto-Organize refuses to *flatten* an existing author
tree (running By Author on a folder that already has series subfolders won't dissolve them).

**Co-authors and name variants.** Author strings are **never parsed**: "Larry Niven, Jerry
Pournelle" is its own author, and "Kevin J Anderson" (no period) is a different author from
"Kevin J. Anderson" — variants file into separate folders until you edit the books' author
field to match. For co-author books, right-click in the preview → **File under…**: send them
to another group or pick any folder by name — creating a new folder is always an explicit
➕ choice in the picker, never the accident of a typo.

**Where does a book already live?** Rest the mouse on any cover in the preview (the grey "already
here" tray too): a popup shows its title and the folders / Book Lists it's in, and stays open while
you move onto it to read. Click the caption *under* the cover to change which copies move.
(7.18.0)

**Handy inside the preview**: multi-select covers (Ctrl/Shift/Ctrl+A) and right-click → Add
to Book List (e.g. select the unread ones → `<Series> - To Read` — the suggested name knows
the series); double-click a cover to open its book dialog; group headers take File under…
for the whole group. One Organize click = one undo.

## 8. Book Lists

**What exactly is a Book List?** A flat, hand-curated list of books. The anchor model —
**one book, many places:** a book can be in several folders and Book Lists at once, the same
book each time (change its tags or rating anywhere and every place shows it). Every book is
filed in at least one folder; the Inbox holds the ones not filed yet. **All Books and
Searches are views** — they show books wherever they're filed; nothing is put into them or
taken out of them. Removing a book from a list never moves, tags, hides, or deletes it.
(Don't call list entries "shortcuts" or folder entries "Linked Copies" — both retired
2026-10-22, docs/design/TERMINOLOGY.md.)

**When do I use one instead of a folder — or a tag?** For any hand-picked set that isn't the book's
*home*: all your SF, your wife's books, gift ideas — and the classic, *to-read queues*
(`<Series> - To Read`, a shared `New To Read`: finish a book → delete it from the list; its
folder home never churns). Folders are for where a book belongs and they nest; lists are
flat and disposable by design. Many schemes work as either a Book List or a tag — your
preference decides. Full patterns: WORKFLOW-PATTERNS.md.

**How do I make and fill one?** ➕ on the Book Lists header (name it in place — Escape keeps
the suggested name); or select books anywhere → right-click → **Add to Book List** (existing
list or "New Book List…" — the suggested name knows the series/author: `<Series> - To Read`);
or save filter results as a snapshot list; or drag books onto a list row. From the
Auto-Organize preview you can add straight to a list mid-organize.

**Drag rules**: book(s) → list row *adds* (dedup, book stays put). List → list *moves* the
book to the other list; **Ctrl+drag copies** it. Reordering the lists themselves: drag (undoable).

**Deleting**: DEL inside a list removes the selected books from *that list only*. ✕ on
the list row deletes the list (confirmation only if it isn't empty) — the books are
untouched. Both genuinely undoable: undo brings a deleted list back with its contents and
its place in the sidebar.

**Do Book Lists sync to mobile?** Yes — and since mobile can't filter, pre-filtering into
lists is *the* mobile pattern: filter on desktop, save the results as lists like `New To
Read`, `New To Read - Prime`, `New To Read - Samples`, `<Series> - To Read`, then read them
from the phone ("Book Lists as mobile filters", WORKFLOW-PATTERNS).

## 9. Tags & Tag-from-Collections

**What are tags for?** The sticky note of the toolkit (§3's triad): cross-cutting labels
that overlay your folder structure without touching it — kind/genre/mood slices (`Time
Travel`, `Non-Fiction`, `Classics`) you filter by, in any combination. A book takes any
number of sticky notes.

**How do I tag books?** Select → right-click → **Tags ▸**: check/uncheck existing tags, or
type to create a new one. Tools → **Manage Tags…** is the registry: create, rename, delete,
multi-select, and **drag to reorder** — that order drives the right-click Tags menu.

**What happens when I rename a tag?** The label changes everywhere at once — on every book,
in the filter bar, in the Tags menu. Nothing needs re-tagging, and saved Searches built on
the tag keep working (they follow the tag, not its spelling). Undoable, with a receipt.

**What happens when I delete a tag?** It's removed from every book carrying it, from the
active filter, and any saved Search that depended on it is removed too — the receipt spells
out the fallout, and one undo reverses all of it.

**Are "Read" and "read" the same tag? (7.24.0)** No — a tag's name is its exact text, capitals included, everywhere
in the app. Finding a tag as you type ignores capitals (typing "read" lists "Read"), but creating one is exact. If you
type a new name that differs from an existing tag only in capitals, ReaderWrangler asks once: *"A tag "Read" already
exists. Create "read" as a separate tag?"* — **Add "Read" instead** / **Create "read"** when tagging books (in Manage
Tags: **Cancel** / **Create**). Clicking the existing "Read" in the suggestions adds it with no question. Renaming a tag
to a name another tag already has exactly is refused. (Before 7.24.0 names were matched ignoring capitals, so "Non
fiction" and "Non-Fiction" could be mistaken for one tag.)

**I undid adding a new tag — why did the tag disappear from my tag list? (7.24.0)** Undoing an action that *created* a
tag also removes the tag, if no book carries it after the undo (redo brings it back). If you've put it on another book
meanwhile, it stays.

**How do I remove a tag from many books at once?** All Books → filter by the tag (Tags filter in the bar above the
books) → select the books (Ctrl+A) → right-click → **Tags** → click the tag to remove it from all of them. Undoable.

**What's Tag from Collections? (window redesigned in 7.24.0)** Tools → **Tag from Collections…** (or the link
*"Create tags from your Kindle collections…"* in Manage Tags) turns your Kindle Collections into tags in one reviewed
pass:
1. **Left — "Kindle collections":** tick the collections you want. **Each goes onto the tag with exactly its name;
   if there's none, a new tag is created** — every row says where it lands ("→ tag Read" or "→ new tag Comics", with a
   note if a tag differing only in capitals exists). Clicking anywhere on a row ticks it. A collection whose books all
   have the tag already is greyed out. The window opens with nothing ticked.
2. **Right — "Changes Apply will make":** one row per book, one column per ticked collection, so you see everything
   Apply will do at once. **+ Read** = will be added (click it to skip that one book — it shows struck through; click
   again to restore); **✓ Read** = already has it; **− Read** = will be removed (only if removals are on). Only books
   that would change are listed — tick **"Also show books that already have their tag"** to see the rest. Click a
   column header to bring that column's changes to the top; **click a title** for the book's details (‹ › steps through
   the list).
3. **Apply** — the button says what it will do: *"Tag 9 books from 2 collections"*. A tag is created only if at least
   one book gets it. One Ctrl+Z undoes the whole Apply, including any tag it created.
4. **Removing tags is off unless you tick "Also remove tags whose book left that collection on Kindle".** Then a tag
   *this tool added* comes off a book that has since left that collection on Kindle — shown as **− Tag** chips and in
   the left list's amber section; click a − chip to keep that one. Tags you added yourself, and tags you renamed, are
   never offered for removal. (Before 7.24.0 these removals were pre-ticked.)
5. **Ctrl+A** ticks every row of the list you're working in (collections, or the removal section).

"New books only" is gone (7.24.0): it relied on a hidden per-book memory you couldn't see or reset. Re-running the
tool now simply lists the books that would change.

**Why would I want that, if I can already filter by Collections?** Because collections are
*Amazon-side* data: read-only in ReaderWrangler, editable only on your Kindle (see §14).
Converting them to tags takes the curation you already did on the device and makes it
*yours* — editable here (add/remove books without touching the Kindle), renameable,
splittable, combinable with every other filter, and permanent even if the collection later
changes or disappears on Amazon's side. TFC is the bridge from curation you rent to curation
you own.

## 10. Saved Searches

**What is a saved Search?** A saved *filter preset*. Clicking one sets the active filters on
whatever you're currently viewing — folder, list, or All Books — exactly as if you'd pressed
the filter buttons yourself. It doesn't navigate anywhere, and it stays applied as you browse
until you clear it.

**Live, not snapshot.** A Search's results change as your library does ("Wishlist" always
means *current* wishlist). Want the frozen version? Save the results as a **Book List**
instead — the results bar offers both: *Search (live filter) or Book List (snapshot)*.
**Zero matches?** Only the Search option is available — a Book List is a fixed set of books, and
there are none to save; the menu says *"No books to save — a Search will catch future matches."* (7.18.0)

**How do I make one?** Set up filters, then Save via the results bar (name optional — an
unnamed Search shows its filter chips as its label). Hand-building the same filters later
highlights the matching saved Search automatically.

**Managing them**: rename inline (or right-click), drag to reorder, delete via hover-✕ or
right-click — "your books and tags are not affected," and it's undoable. Searches are
read-only presets: you can't drop books "into" one.

## 11. The book dialog

**What's in it?** Double-click a book (or right-click → the book's name): cover, title
(linked to Amazon), author, series & position, format, ownership, Amazon rating & reviews,
**My Rating** stars, current price with its "as of" date, **price goal** (preset "Buy at"
amounts or a custom target, plus "was $X.XX when goal set" — the price recorded the moment
you set the goal; see §16), tags, Kindle Collections, description, and your note. **◀ ▶
arrows (or ← →) walk the current folder's books** without closing the dialog — great for
reviewing a series in order.

**How do I edit?** The ✏️ pencil enters edit mode: title, author, series name & number,
format, ownership, note. **Save commits everything as one step** (one undo reverses the whole
save); Cancel discards; Enter saves, Escape cancels. _(Planned next: the dialog goes fully
transactional — rating/goal/tags will also stage until Save.)_

**Ownership — what am I allowed to change?** The dropdown shows Amazon's actual state
(*Sample (from Amazon)*, Prime, Borrowed…) and offers only what's genuinely yours to declare:
**Owned** ("I have it — Amazon's record is stale") and **Wishlist** ("I want it"). After an
override it also offers **Reset to Amazon's value (…)**. Your override is protected — future
fetches won't flip it back. And never *delete* to correct ownership (see §12).

**Why is Format editable?** Because Amazon sometimes gets it wrong (real values observed
include "shoes"). Free text with suggestions from your library's vocabulary; **blank = honest
unknown**.

**How do I copy the title or author?** Click the small 📋 chip after each — one click,
"Title copied!" / "Author copied!" (the title is a link, so drag-selecting it fights you;
the chip is the intended path). Outside the dialog: right-click → **Copy Title(s)** /
**Copy Author(s)** work in every view — authors dedupe across a selection.

**What's Share?** Copy the Amazon link (affiliate-tagged), or email a friend about a book
(up to 20 selected). In the book window it's the **Share ▾** button next to **View on Amazon**
(7.18.0; was an easy-to-miss icon); elsewhere, right-click a book. "Email a friend" opens a **Share by Email** dialog with three choices:
**Open in email app** (opens your default mail client — Outlook, etc. — prefilled), **Copy to
clipboard** (always works — paste anywhere), and **Open in Gmail (web)**. See §19 if the Gmail
option shows a "redirect error."

There's also a third Share item on some devices — **Share…** — which hands off to your
operating system's own share sheet (Windows/Mac/phone). On Windows, the share sheet's **Gmail**
tile opens Gmail *cleanly* (no redirect error), so if you're a Gmail-on-the-web user, **Share… →
Gmail** is the smoothest Gmail path — better than the in-app "Open in Gmail (web)" button. (The
OS share sheet is your operating system's window, not ReaderWrangler's — RW can't change how it
opens or closes.)

## 12. Hide, Trash & delete

**The golden rule: match the tool to the goal.**
- *"I own it but never want to see it"* (gifts bought for others, kids' books, maps) →
  **Hide**.
- *"Remove this record"* (stale wishlist entries, rejected samples — after deleting the
  sample at Amazon) → **Delete** (Trash).
- *"Amazon's label is wrong"* → **Ownership override** (§11) — never delete.

**Hide.** Right-click → Hide Book(s) (or the delete-warning's "Hide Instead"). Hidden books
dim and drop out of normal views; the **Show Hidden** filter has three states (hide them /
show all / *only* hidden — that last one is how you review what's hidden). Counts stay honest
("2 hidden by user"). Unhide from the same menu. Hide sticks across fetches — it's the right
tool for owned books precisely because deletes don't stick on them (below). A book that
appears twice (e.g. once solo and once inside a series shelf) can have a single *copy* hidden
from the dialog without hiding the book.

**Delete = Trash first.** Deleting from a **folder** removes the book from *that folder* —
it only goes to Trash if that was its last home (copies elsewhere live on). Deleting from
**All Books** or **a Search** means "delete the book": it's removed from every folder
and trashed. In a **Book List**, DEL just removes the books from that list. Deleting an
**owned** book gets a warning first — "it will reappear the next time you update your library from Amazon; consider
Hide instead"
(Hide Instead / Delete Anyway / Cancel).

**The Delete key acts on what you selected** (7.28.1). Selected **books** go as above. Selected **folders** are deleted
— one folder with books or subfolders asks first; **several** always get one question listing them; their books return
to each folder's parent (the Inbox for a top-level folder); **one Ctrl+Z** puts everything back exactly. **Books and
folders together:** both go, in one question and one Undo. **Nothing selected:** Delete does nothing — except when you
last clicked in the left pane, where it deletes the folder highlighted there. The **Inbox** can't be deleted (it says
so). Right-click **Delete Folders (2)** acts on all the selected folders. _"I pressed Delete and nothing happened"_ —
nothing was selected: click the folder (or Ctrl+click several) first. _"It used to delete the folder I was in"_ — it
did, by mistake, before 7.28.1: Delete now never deletes the folder you're in unless you're working in the left pane.

**Trash view.** Deleted books wait here, recoverable. Hover one to see **"Was in (before
Trash)"** — its former homes. **Restore** (right-click) returns it to all its former folders,
and it reappears on its Book Lists (list membership survives a trip through Trash). Dragging
a book *out* of Trash restores it to wherever you dropped it. DEL inside Trash — or
right-click the Trash row → **Empty Trash** — deletes permanently, with confirmation
("cannot be undone", Book-List fallout disclosed).

**Why did my deleted book come back?** It's owned or sampled — it's still in your Amazon
library, and a fresh fetch legitimately re-lists it. (Emptying the Trash does keep a *stale*
backup or sync from bringing a book back — but it can't overrule Amazon's live report that the
book is still yours.) Owned → Hide it. Sample → delete the
sample at Amazon first (Manage Your Content), then the truth-path sequence in
WORKFLOW-PATTERNS. **Wishlist books are the exception: their deletes stick** (they're
ReaderWrangler-native; Amazon holds no copy) — though re-*adding* one requires **Empty
Trash** first, or the add is skipped as a duplicate of the trashed copy.

**A book is "no longer in your Amazon library" — what now? (7.19.0)** The fetcher's scan (§14)
noticed a book is gone from Amazon's side — a returned loan, a sample you deleted, a delisted
book. ReaderWrangler doesn't touch it on its own: the import summary names it with a
**Review…** button, a reminder bar stays up until you decide, and **Tools → Removed books…**
lists them any time (with where each is filed; click a title for its details). Per book:
**Keep** (stays filed, never asked again — later fetches/imports don't undo it) or
**Permanently delete** (gone from RW for good — it skips the Trash). Books already in your
Trash show in their own group to finish deleting; they don't count toward the reminder (you
already decided). **Kept** books live in a collapsed **Kept** group with **Ask me again**;
their details say "🧹 No longer in your Amazon library — kept". **If a kept book comes back**
to your Amazon library (e.g. you re-sample it), the next fetch + import clears the Keep, so a
later disappearance asks again. A downloaded book generally still opens on your Kindle — this
is about what Amazon's library lists, not about the file on your device.

## 13. Undo

**What can I undo?** Everything you do to your data: moves, copies, paste, delete/restore,
hide/unhide, renames (folders, tags, Book Lists, Searches), tag edits, price goals, ratings,
edits, reorders, Search and Book List create/delete, Auto-Organize passes (one click = one
undo). **Every undo/redo toast names its target** — "Undone: Delete 'A People's History…'
from 'Folder A'" — so you always know what just reverted. **Ctrl+Z** undoes; **Ctrl+Y or
Ctrl+Shift+Z** redoes.

**Deliberately NOT undoable**: view state (sort modes, collapse/expand, filters, selection)
and explicitly-confirmed permanent deletes (Empty Trash). Cut/copy to the clipboard isn't an
action yet — the paste is. The doctrine in one line: **toasts promise truth, not
reversibility** — every data mutation is undoable and gets a receipt, but receipts also
confirm things with nothing to undo (clipboard copies, file saves, refusals).

**Missed a message?** The 🕐 button by the status bar keeps this session's messages — the last
~50 receipts and undo/redo confirmations — so a toast that faded before you read it isn't lost.
(It's a log of what happened, not a clickable undo list; use **Ctrl+Z** to undo and **Ctrl+Shift+Z**
or **Ctrl+Y** to redo.) **7.19.0:** its top line names what undo would do next — "Next undo: Clear
price goal for 7 books" — with an **Undo** link (or "Nothing to undo"). Undo is a stack, so only
that one action is next. **Ctrl+Z with nothing to undo says "Nothing to undo"** (it used to be
silent); those "nothing happened" hints show briefly but aren't kept in the log. **7.26.0:** **Full log…** at the
bottom of the 🕐 list opens **Diagnostics** — the complete record (see §19, "Something went wrong — how do I tell you
exactly what?").

**Undo in dialogs is scoped.** While any dialog is open, Ctrl+Z reaches only what happened
since it opened (rename a tag in Manage Tags, undo it right there); otherwise the app says
"Nothing to undo from this dialog — close it to undo earlier actions" rather than silently
reverting something you can't see. In the book dialog, instant controls are one step each and
an Edit-mode Save is ONE atomic step; in edit mode Ctrl+Z is native text-undo for the field
you're typing in.

**When history resets**: a backup restore clears the undo history (entries from before the
restore would lie about the state they'd return you to).

## 14. Sync, fetching & importing

**What fetching is.** ReaderWrangler never talks to Amazon itself — *you* do, through your own
logged-in browser. Fetching is a **bookmarklet** (set up in §2) that runs on your Amazon page, reads
your library the same way Amazon's own page does, **encrypts** it with your passphrase, and sends it
to the **Relay**. Back in ReaderWrangler, **Import from Relay** pulls it down and **decrypts** it with
your credentials — so the relay only ever holds encrypted data, and only *your* ReaderWrangler can
read it. A fetch brings in each book's title, author, series, cover, format, current & list price,
description, ratings & reviews, genres, and publication date.

**Two Amazon pages, one bookmarklet.** Your library comes from amazon.com/yourbooks — run the
bookmarklet there and choose **Download Library**. Your Kindle Collections (and read status) live on a
different page, Manage Your Content & Devices (amazon.com/hz/mycd/digital-console) — run the same
bookmarklet there (the bookmarklet can take you to that page) and choose **Download Collections**.
ReaderWrangler then shows your Collections alongside your library.

**Adding to your wishlist puts it on the relay right away — a new purchase reaches the relay (and so
ReaderWrangler) only through Download Library.** ReaderWrangler's
Wishlist is its own thing — *not* your Amazon wishlist (RW doesn't connect to Amazon wishlists at all).
Add a book or series with the bookmarklet on a product or series page and RW builds its own wishlist
entry, written **straight to the Relay** (invisible to Amazon) — so **Import from Relay** brings it in
with no Download Library needed. Purchases, samples, and borrows are different: those live in your Amazon
library at amazon.com/yourbooks, and **Download Library** is exactly the fetcher reading that page — so a
new purchase appears only after you Download Library and then Import. Either way, allow up to ~a minute
for a change to reach the Relay before Import can read it.

1. **After you Download your Library, it can take up to ~a minute before the Relay has it ready
   to Import** (the relay propagates gradually). If Import says "up to date" right after a fetch,
   wait a minute and try again. Not a bug.
2. **The fetcher runs in phases** (titles → enrichment → tags → prices), and after "fetch
   complete" a **full-library orphan scan** runs in the background with its own progress bar.
   Closing the tab early skips it (the dialog's ℹ️ explains). The orphan scan is what notices
   books you removed on Amazon's side — they show up in **Tools → Removed books…** (§12).
3. **Fetches are incremental** — they stop at the newest book RW already knows, since older ones
   usually haven't changed. But if the fetcher's known count doesn't match the total Amazon
   currently reports — which happens when books were removed, returned, or delisted on Amazon's
   side (an incremental pass only checks the top, so it can't see a removal deeper down), or a
   previous fetch was interrupted — it **automatically** does a fuller pass that re-reads deeper
   to find what changed and reconcile. This isn't a setting you pick; the fetcher decides.
   Withdrawn/delisted books Amazon half-reports are flagged, never silently dropped.
4. **Buying a tracked book upgrades it in place** (same ASIN): folders, tags, and price goal
   survive; the book stays where you filed it (find recent purchases via All Books sorted by
   Date Added). If the publisher re-issued under a **new ASIN**, the purchase arrives as a new
   Inbox book and your old wishlist copy remains — delete the stale copy by hand.
   **Just bought part of a series? Add-Series-to-Wishlist is still safe** — it skips books the
   Amazon page shows as owned (which includes purchases made seconds ago), so only the ones
   you don't own become wishlist entries. Order doesn't matter; one import reconciles all.
5. **The Data Status ball** (File menu / status bar) tracks freshness; it turns red when the
   relay holds newer data than you've imported.
6. **A "channel revoked" notice** means relay credentials were revoked (usually deliberately,
   in **File → Relay Setup**; see §2). Regenerate credentials and remake bookmarklets to resume
   syncing.
   **Three relay refusals new in 7.25.0** (signed changes, §2), each shown in the sync error:
   - **"This channel needs signed writes - update the app (reload the page)"** — a ReaderWrangler tab
     (or a bookmarklet run) still had the older code. Reload the page; a bookmarklet picks up the new
     code by itself within ~10 minutes.
   - **"Signature time is more than 5 minutes off - check the computer clock"** — the app corrects a
     wrong clock by itself and retries once, so this shows only if the clock keeps jumping. Fix the
     computer's date/time (set it to automatic).
   - **"This Cloud Sync channel is already claimed by a different key - make a new key in Relay
     Setup"** — the relay already knows a different key for this Channel ID (another copy of these
     credentials with a different passphrase, or someone who had the Channel ID got there first).
     Regenerate credentials in **File → Relay Setup** and remake bookmarklets.
7. **One working tab — but a second browser is fine.** The risk is a second ReaderWrangler
   **desktop tab in the same browser**: browser storage is last-writer-wins, so one edit in a
   stale second tab can overwrite everything you did in the first. Organize in one tab
   (automatic protection — every tab and browser catching up with your latest changes, never
   overwriting them — is designed but not yet built: MULTI-INSTANCE.md §4).
   **The mobile view is always safe** — it only displays your library and never writes changes
   back, so it can't overwrite your organization. **A different browser (or browser profile)
   is a separate universe** — its library lives in its own storage. Give it its **own
   credentials** and it's a completely independent organization, a deliberate way to keep two
   different setups that never affect each other. Point it at your **existing** channel instead
   and it will sync the same fetched books, but your by-hand organization won't travel between the
   two desktops (they drift apart) — so use a separate channel unless you truly want the same
   library twice. **Two people on one computer:** give each person their own browser profile
   with their own credentials — two separate libraries that never touch. Don't click someone
   else's bookmarklet while signed in to your own Amazon account: it would send your books into
   their library (a guard is planned — TODO "A fetch from someone else's Amazon account stops
   before mixing two libraries"). **To look at someone else's backup**, open it in a separate
   browser profile — never restore it into your own (Restore replaces your library). We only
   test **Chrome**; other browsers are on your own.
8. **Collections and read status come FROM the Kindle/Amazon side** — fetch Collections to
   refresh them; they're edited on your Kindle/Amazon, not in RW. Amazon's automatic "read"
   status (fires around 99%) is separate from any collection you happen to name "Read".

**How do I add all of an author's books to my wishlist? (7.21.3)** Open the author's page on Amazon (any tab of it —
All Books included), click the bookmarklet and choose **⭐ Add Bibliography to Wishlist**. A small panel asks one
question first: **Language** — only the languages that author has, plus **All languages** — and shows how many
**Kindle books** match ("… — any already in your library are skipped"). Click **Add to wishlist**. It adds **Kindle
books only** (no paperbacks, hardcovers or audiobooks) and skips books already in your library, so re-running it after
an author's new release adds just the new one. The page's own filters, scrolling and "Show More" don't matter — it asks
Amazon for the author's list directly. Like any wishlist add, the books go straight to the Relay: **Import from Relay**
brings them in. Before 7.21.3 it was greyed out on the All Books tab and could also add print, audio and
other-language editions — if an older run left those, delete them by hand.

**I run ReaderWrangler on my own computer (self-hosting) — which relay does it use? (7.21.0)** The normal one, exactly
like readerwrangler.com: a self-hosted copy behaves like the real site (badge **LOCAL** in the header, so you can tell
the tabs apart). Before 7.21.0 a self-hosted copy quietly used the developers' test relay and its phone-pairing code
pointed at the test site — if a self-hoster's sync ever "lost" data across that update, that's why. People working *on*
ReaderWrangler turn on **contributor mode** (badge **LOCAL · CONTRIBUTOR**, orange) to get the test relay and
developer checks; setup is in CONTRIBUTING.md.

## 15. Backups & spreadsheet

1. **Backups are yours — a real file you save on your computer** (File → Save Backup…). You choose
   where it goes — Documents, the Desktop, Downloads, even a USB drive — unlike your working library,
   which lives inside the browser. Restore returns you to the backup's state, guarded so nothing of
   yours is quietly lost or changed — current Book Lists/Searches, and your sync credentials (item 3
   below).
2. **Presentation settings** (cover/list view, columns, theme) are deliberately NOT part of a
   backup — restoring your books shouldn't restyle your screen.
3. **Restoring keeps your current sync credentials by default.** A backup does carry the sync
   channel it was made with, but a restore won't silently switch you to it: if the backup's
   channel differs from the one you're using, ReaderWrangler asks — **Keep current** (recommended;
   matches your installed bookmarklet) or **Use the backup's**. On a fresh install, or when the
   channels match, it just adopts the backup's silently (that's the device-migration case). (7.14.3)
4. **File → Save Spreadsheet (CSV)…** exports one row per book — tags, folder paths, and Book
   Lists included — and opens directly in Excel. Book ids are ASINs.
5. **Restore puts back exactly the backup (7.26.0).** Everything in the backup replaces what's here — books, folders,
   Book Lists, Searches, tags. A part the backup doesn't have comes back as *none* (a backup with no Book Lists leaves
   you with none; with no folders, every book lands in the Inbox) — never "keep what's here". The exceptions: your sync
   credentials (item 3) and your view settings (item 2).
6. **"This backup can't be restored: …" (7.26.0)** names everything wrong with the file at once — e.g. "it's missing
   its list of books, and its folders aren't readable" — and **nothing was changed**. Choose a backup made with
   File → Save Backup. (A backup the app saved is never refused; a hand-edited one can be.)
7. **"Your library isn't loaded, so there's nothing safe to save yet" (7.26.0)** — Save Backup waits until your
   library has finished loading: a backup made before then would be missing your folders. Reload the page.

## 16. Price goals

**How do I use price goals?** Give a book a target price: right-click → Set Price Goal
(preset amounts or a custom target), or the "Buy at" buttons in its dialog. Then **Goal
Met** (View menu / filter bar) shows every book at or below its goal — check it after a
fetch and buy. Wishlist and sample books are the natural targets: track the book, name your
price, wait.

**What's "was $X.XX when goal set"?** Setting a goal also records the book's price *at that
moment* — the price you saw when you decided to care. Amazon's advertised list prices are
often theater (a $1.99 Kindle sale "marked down" from a $17.99 *print* list price), so this
snapshot is the honest reference for what the book will likely cost once a sale ends. It
appears on the dialog's goal line with its date — so a snapshot taken mid-sale is
self-evident — and as the optional **Price When Set** column (List View → Choose Columns).
A book with no price at set time records nothing (blank, not a guess); clearing the goal
clears it. **Re-setting a goal — the same value included — refreshes the snapshot**, which
is also how you stamp goals created before the feature existed.

**Before mass-setting goals**, glance at a book's price line in its ReaderWrangler dialog: a
"(Save $0.00)" next to the list price means the book already sells at that price every day — a goal set *at* the everyday
price is "met" forever and tells you nothing. The snapshot makes this visible after the
fact too.

**How fresh are prices?** As fresh as your last fetch — every wishlist-priced book is
re-priced each run. Each price shows its "as of" date and **dims once it's stale (~24h)** so
a sale you're seeing might already be over — fetch before you buy.

**Why does this book show no price?** Usually honest: delisted from the Kindle store, or
only a non-Kindle edition (e.g. audiobook) is for sale. A **Prime/KU book showing a price**
means "free to borrow, $X to buy" — ownership says Prime, price says what buying costs.

**Do goals survive buying the book?** Yes — promotion keeps your data, snapshot included
(you'll visit the book anyway to file/queue it; clear the goal then if you like). An owned book
can legitimately keep a goal (watching for a dip to buy it as a gift). **7.19.0:** when an import
upgrades books that still carry a goal, its summary says so and offers **"Clear those N goals"** —
one click, undoable — instead of hunting them down with filters.

## 17. Mobile

**What is the mobile app?** A *read-only*, phone-sized view of your library — browse your
folders, Book Lists, and Searches; it deliberately doesn't edit or organize (that's desktop
work). **There's nothing to install from an app store** — just open **readerwrangler.com in
your phone's browser** (Safari or Chrome). You can then add it to your home screen so it opens
like an app.

**How do I set it up?** Relay Setup on desktop → pair your phone with the **QR code**. Your
desktop **publishes your organized library** — books, folders, Book Lists, Searches, and order —
to the relay (a separate push from the bookmarklet's raw fetch), and your phone **pulls that
published copy**. So the phone shows *your organization*, not raw Amazon data. The encryption key
lives only on **your own devices** — your desktop, your bookmarklets, and your phone (the QR
delivers it there when you pair) — never on the Relay, so it only ever holds data it can't
decipher. Because the QR carries that key, treat it — and any screenshot of it — like your
passphrase: anyone who has it can pair a device and read your library.

**Does it match my desktop?** Yes — books, folders, Book Lists, Searches, **and your order**,
pins included (the desktop is the ordering authority; there's no reordering on the phone).
The drawer (hamburger) is the sidebar's twin for jumping between sections; sections collapse;
color spines mark Searches / Book Lists / Folders.

**Why is my phone showing older data?** It shows the library as of the phone's last refresh — a
banner nudges when the relay holds something newer; refresh to pull it. Desktop-side changes
reach the relay shortly after you make them.

**How do I filter on mobile?** You don't — you *pre-filter on desktop into Book Lists* and
read the lists on the phone ("Book Lists as mobile filters", WORKFLOW-PATTERNS). Sorting
within a shelf cycles like the desktop's sorts; hidden-book counts can be tapped to reveal.

**Something's wrong on the phone — how do I tell you?** (7.26.0) Menu (⋮) → under Help & About, **Copy
diagnostics** — it copies the phone's own record of what happened; paste it into your message. If the phone can't
load your library it now says so ("Your library couldn't be loaded on this phone") instead of staying empty: close the
app and open it again — your library on the computer isn't affected.

## 18. Keyboard shortcuts & mouse tricks

ReaderWrangler uses the **standard shortcuts your operating system already knows** — the same
Ctrl+Z, Ctrl+C, and so on you use everywhere else — so there's little RW-specific to memorize; it
just recognizes them. On a **Mac**, use **⌘ (Command)** wherever the table shows **Ctrl** — RW
accepts both.

The app's own list: Help → **Keyboard Shortcuts**. The core set:

| Keys | Action |
|---|---|
| Ctrl+Z / Ctrl+Y (or Ctrl+Shift+Z) | Undo / Redo (toasts name the target) |
| Ctrl+A | Select all in the current view · **in a window (7.19.0): acts on the part you last clicked** — a title or paragraph → just that text; a checkbox list → checks that whole list (= its Select all); nothing clicked yet → the main text. Button labels are never selected. · in a hover popup you've clicked: select its text |
| Ctrl+X / Ctrl+C / Ctrl+V | Cut (marks) / Copy / Paste books into the current folder or Book List |
| Ctrl+Click / Shift+Click | Multi-select / range-select |
| DEL | Delete selection (context-aware — see §12) |
| Esc | Close the innermost menu or window (one press per layer — closing a menu keeps your selection) · otherwise cancel pending cut · clear selection |
| ← → (book dialog) | Previous / next book |
| Alt+← / Alt+→ | Back / Forward through your navigation history |
| F2 | Rename the selected folder |

Mouse tricks worth knowing: **Ctrl+drag = copy**; Shift+Click a column header = secondary
sort key; rest on a cover = a "where does this book live" popup (it stays while you move onto it) whose folders and Book Lists are **clickable — click one to jump straight there**; double-click = open the book;
right-click *everything* — books, folders, lists, Searches, tags, blank space, even the Trash
row — the menus are where the power hides.

## 19. Troubleshooting (symptom → explanation → fix)

**Something went wrong — how do I tell you exactly what?** (7.26.0) **Help → Diagnostics…** (or **Full log…** at the
bottom of the 🕐 list) shows ReaderWrangler's record of what it did and what went wrong — the last ~500 lines, kept in
your browser, newest first. Filter it by kind, area and time; lines with more information show **details ▸**.
**Copy diagnostics** copies the whole record — paste it into your message to us (Feedback, at the bottom of the
window). Nothing in it leaves your computer unless you copy it; your Passphrase is never in it, and Channel IDs appear
only shortened (as Relay Setup shows them). **Chasing a problem?** At the bottom of Diagnostics: **Clear** to start
fresh, then turn on **Show a banner when something goes wrong** (a red bar at the top of the page the moment anything
fails, with Copy) and, if we ask, **Also record extra detail** (many more lines — it fills the record fast, so turn
it off afterwards). We may send you a link that turns both on (`?errorBanner=on&logDetail=on`). **Is it working?**
(7.28.0) Press **Send a test message** at the bottom of Diagnostics: one line marked TEST appears at the top — "A test
message from Diagnostics — not a real problem" (code UI-07) — and the red bar shows it too when **Show a banner when
something goes wrong** is on (if it's off, a note says so). Then **Copy diagnostics** and send it: the line proves the
record, the banner and the copy all work.

| Symptom | Explanation | Fix |
|---|---|---|
| A line or red bar marked TEST: "A test message from Diagnostics — not a real problem" (UI-07-!TEST!) (7.28.0) | Someone pressed **Send a test message** in Help → Diagnostics — to check the record works. Nothing went wrong | Nothing to fix; **Dismiss** the bar. Lines marked TEST can be hidden with the **test entries** box at the top of Diagnostics |
| A red bar at the top of the page with a code ("error · MOVE-03 · …") (7.26.0) | **Show a banner when something goes wrong** is on (Help → Diagnostics), and something failed | **Copy** it and send it to us; **Turn off this banner** if you don't want them |
| A box: "ReaderWrangler hit a problem that may affect your library" (7.26.0) | Something that may put your data at risk — a save failed, the library couldn't be read; shown to everyone | Do what the box says (usually: save a backup, then reload; when the library didn't load: *don't* save a backup — reload). **Copy details** and send them to us |
| Deleted book reappeared after a fetch | It's owned/sampled — Amazon still lists it; revive-on-sighting is by design | Hide it (owned), or delete the sample at Amazon first (truth path) |
| New purchase missing after import | Import raced the fetch — give the Relay ~1 min to catch up, or it was an *upgrade* of a tracked book (didn't count as "new", stayed in its folder) | Re-import and check the **Inbox** (where new purchases land); an upgrade of a tracked book stays in its folder — find it via All Books sorted by Date Added |
| Found a book (via search or All Books) but don't know where it's filed | Column and cover views don't show a book's folder/list membership | **Hover its cover** — the "Found in" folders and "On Book Lists" are clickable; click one to jump there |
| Can't re-add a deleted wishlist book | Trash copy still holds the ASIN | Empty Trash, then add |
| Folder looks empty / counts look wrong | A filter (or Show Hidden) is active | Clear filters |
| Same book twice, one wishlist one owned | Publisher re-issued under a new ASIN | Delete the stale wishlist copy |
| Series mixes Sample and Wishlist states | Historical accretion (sampled before adopting the wishlist habit) | Override to Wishlist, or the truth path; then keep one habit |
| App shows an old version after update | Browser cache | Hard refresh (Ctrl+Shift+R); verify in Help → About |
| "Open in Gmail (web)" shows ERR_TOO_MANY_REDIRECTS | A browser boundary: navigating to Gmail from another site withholds some Google auth cookies, so Gmail loops trying to re-auth (can't be fixed from a link) | Best on Windows: use **Share… → Gmail** (the OS share sheet's Gmail tile opens cleanly). Or, in the looping tab, click the address bar and press **Enter** — a top-level navigation composes cleanly. Or use **Open in email app** / **Copy to clipboard**. |
| Share "email a friend" doesn't open my mail app | No default mail app / mailto handler set (or it points at the browser) | Set your default mail app: Windows Settings → Apps → Default apps → MAILTO → choose your client (e.g. Outlook); then "Open in email app" opens it prefilled |
| Loading takes more than a few seconds | Since 7.27.0 the app opens in about a second — a long wait means something went wrong | Reload (Ctrl+Shift+R); if it happens again, open Help → Diagnostics and press Copy diagnostics for us |
| "Sync data check failed / checksum mismatch" | A Relay write was interrupted (rare since v7's sealed-packet sync) | Follow the dialog: full fetch rebuilds, then import — local data is intact |
| Slow first "Checking pending additions" | First fetch after new relay data does extra accounting | Let it run; later fetches are quick |
| "ReaderWrangler was reset in another tab. This tab's contents are out of date." (7.25.1) | Reset App ran in another tab of the same browser; this tab still shows the library from before, and stopped saving so it can't bring that library back | Press **Reload** |
| Reset App says "Close your other ReaderWrangler tabs to finish the reset" (7.25.1) | Another tab still holds the library open (usually one running an older version) | Close the other ReaderWrangler tabs — the reset finishes by itself |
| "I reset the app — is my copy in the cloud safe?" (7.27.1) | The reset itself doesn't change it, and nothing is sent while the library is empty. But once books are back (for example via File → Import from Relay, which brings books without folders), your first change sends the reduced library and replaces the cloud copy | Restore your backup file **before** changing anything after a reset (File → Restore Backup…) |
| Bookmarklet fetches the wrong library / mismatch warning | Bookmarklet carries older credentials than the app | Recreate the bookmarklet from Relay Setup |
| Import from Relay says "Nothing is on the relay for these credentials yet" (7.26.0) | Either nothing has been sent yet, or the app and the bookmarklet use different credentials — the Relay can't tell the two apart (a mistyped Channel ID is simply an empty channel) | New: on the Amazon library page, bookmarklet → **Download Library** (then **Download Collections**), then Import. Already sent: File → Relay Setup — check the credentials, then update the bookmarklet |

## 20. A suggested way to organize (one of many)

The full method is **SUGGESTED-ORGANIZING-PRINCIPLES.md**; the patterns and trade-offs are
**WORKFLOW-PATTERNS.md**. The one-paragraph version:

> Give every book a stable **folder home** (author folders, series subfolders — Auto-Organize
> builds these for you; a catch-all like *Various Authors* for one-offs). Track *what's left
> to read* on **Book Lists** you delete from as you finish (`<Series> - To Read`, a shared
> `New To Read` for one-offs). Home wishlist books immediately in their future folders —
> purchase day is then zero work. Slice by kind with **tags**; keep self-maintaining views
> (Wishlist, Read/Unread) as **saved Searches**, never hand-maintained lists. There's no
> single right way — these are compositions of the same primitives.

## 21. Meta

- **Add here** when an answer is a *fact or fix*; add to **WORKFLOW-PATTERNS.md** when it's a
  *way of using RW*. Distill both into USER-GUIDE at launch; the GPT is loaded from these
  files.
