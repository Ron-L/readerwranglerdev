# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [7.29.0] - 2026-11-12

### Added
- **Report a problem, wherever you are.** Help → Report a problem… copies your diagnostics and lets you email us or
  open a report on GitHub; Help → Known problems lists the ones already reported. If ReaderWrangler can't open, the
  "Something went wrong" screen and the reset page offer Copy diagnostics and Report this problem right there.
- **Reset App: a Save Backup… button right in the box**, so you can save a backup before you reset.

### Fixed
- File → Save Backup… and Save Spreadsheet… say why they're greyed out when your library is empty.
- The backup's failure message says "Backup Error" (it said "Export Error").

## [7.28.1] - 2026-11-12

### Fixed
- **The Delete key now deletes what you selected — never the folder you're in.** Several folders: one question listing
  them, one Undo. Books and folders selected together: both go, with one question and one Undo. With nothing selected,
  Delete does nothing. The right-click Delete acts on all the selected folders.
- **Undo after deleting a folder puts things back exactly as they were** — and Redo after an Undo does exactly that
  delete again.
- **A message that follows another quickly no longer disappears early.**

## [7.28.0] - 2026-11-11

### Added
- **Send a test message**, in **Help → Diagnostics…**. Press it to check that the Diagnostics record is working: it
  adds one line, marked TEST, saying it's "not a real problem". If **Show a banner when something goes wrong** is on,
  the red banner shows it too. If we ever ask you to check that things are working, press it, then **Copy
  diagnostics** and send that to us.

### Changed
- Behind the scenes, the parts that keep and show the Diagnostics record are gathered into one self-contained piece.
  Nothing you see changes.

## [7.27.1] - 2026-11-11

### Fixed
- **The reset messages tell the truth.** Tools → Reset App, the "Something went wrong" screen and the emergency reset
  page no longer mention "files on disk", "Import amazon-library.json", or an Export button that doesn't exist. They now
  say what each reset removes, that your saved backup files are not touched, and how to get everything back: **File →
  Restore Backup…** with your backup file.
- **Download Collections' finish message** says your collections were sent to the Relay, and to choose **File → Import
  from Relay**. It named a library file it no longer writes.

## [7.27.0] - 2026-11-11

### Changed
- **ReaderWrangler opens in about a second.** It used to prepare its own code in your browser every time you opened it
  — about 15 to 50 seconds, sometimes with your browser asking whether to keep waiting. That work is now done once,
  before the app reaches you: the app appears in about half a second, and a 3,000-book library is on screen in about two.
- **Your folders appear sooner too.** Opening the app no longer reads every book cover into memory, or saves your whole
  library again, before showing your folders.
- **Covers on the computer come straight from the browser's own cache**, as the cover view and list already did. The
  extra copies this browser kept are removed once, freeing space. (The phone keeps its own.)

### Fixed
- **The emergency reset page** no longer suggests "Import amazon-library.json", and its tip points to **File → Save
  Backup** (it named a menu item that no longer exists).
- **The security page's** note about outside code is up to date.

## [7.26.0] - 2026-11-10

### Added
- **Diagnostics — a record of what ReaderWrangler did and what went wrong**, kept in your browser (the last ~500
  lines). Open it from **Help → Diagnostics…**, or **Full log…** at the bottom of the 🕐 recent-messages list. Newest
  first, filter by kind, area and time; lines with more information show **details ▸**. **Copy diagnostics** copies
  the whole record for a message to us; **Clear** starts fresh before you reproduce a problem. Nothing in it leaves your
  computer unless you copy it; your Passphrase is never in it, and Channel IDs appear only shortened (as Relay Setup
  shows them).
- **Two switches for chasing a problem**, at the bottom of the Diagnostics window: **Show a banner when something goes
  wrong** (a red bar at the top of the page, with Copy) and **Also record extra detail**. Both are off normally. If we
  ask, you can turn both on with a link (`?errorBanner=on&logDetail=on`).
- **On the phone: Copy diagnostics** in the menu (⋮), under Help & About.

### Changed
- **Every message you see is also recorded** in Diagnostics — each toast and each box, and your answer to the boxes
  that ask — so the record reads as one timeline of what you saw and what happened underneath.
- **A refused move is no longer shown in red** ("Inbox cannot be moved") — it's your gesture being declined, not
  something going wrong.
- **Relay Setup says "Load credentials from backup file"**, to make clear it reads a file.

### Fixed
- **Import no longer reports a false "Library repair".** There were two causes, both fixed. First, every Import with
  new books ran the library's safety check before filing those books into the Inbox, so it "repaired" brand-new books.
  Then, once that was fixed, a second check showed up: an Import that found nothing to bring in (a brand-new channel,
  for example) left a follow-up check waiting, and it misfired during your next Restore or Import — reporting
  "Library repair: 22 issues fixed" for books that were fine. Real repairs are still found and reported.
- **Restore puts back exactly the backup.** A backup missing a part — its Book Lists, say — used to leave your current
  ones in place beside the backup's books, even though the "restore?" box had just said they'd be removed. Now a
  missing part restores as none (with no folders, every book lands in the Inbox). Your Cloud Sync credentials are the
  one exception, as before: a restore never switches them without asking. Your view settings stay as they are.
- **A backup that can't be restored says everything that's wrong at once** — *"This backup can't be restored: it's
  missing its list of books, and its folders aren't readable. Nothing was changed."* — before anything changes,
  instead of failing part-way or naming one problem at a time.
- **Restore's messages say "Restore", not "Import".**
- **If your library can't be loaded, you're told** — a box says so, with what to do, instead of an empty library and
  no reason. Until it has loaded, Save Backup waits: a backup made then would be missing your folders.
- **A damaged library-status note no longer stops your library from loading.** (It only holds how fresh your library
  is; it now shows as unknown until the next fetch.)
- **On the phone, if your library can't be loaded, you're told** — before, the app just stayed empty.
- **A drag-and-drop that fails says "That move didn't work."** — before, it silently did nothing.
- **Two saves of your books started at the same moment now take turns** — before, the second could begin while the
  first was still writing.
- **The emergency reset page no longer suggests "Import amazon-library.json"**, a way back that hasn't existed since
  Cloud Sync replaced the library file; it offers restoring a backup file.

## [7.25.1] - 2026-11-06

### Fixed
- **Pasting into a Book List works.** Copy a book (Ctrl+C) and paste it into a Book List (Ctrl+V, or right-click →
  Paste) to add it. Cut (Ctrl+X) and paste *moves* it: out of the folder you cut it from and onto the list — and if
  that was its only folder, it goes to the Inbox, and the message says so. One Ctrl+Z puts everything back. Before,
  a cut pasted into a Book List or the Trash took the book out of its folder and put it nowhere.
- **Ctrl+V pastes into the Inbox**, as right-click → Paste always did. Where a paste can't go — All Books, the Trash —
  it now says why instead of doing nothing.
- **Messages after a cut and paste were blank.** They show what happened now.
- **The right pane's sideways scrollbar is always usable.** With Cloud Sync on, the status bar along the bottom covered
  it — at some zoom levels it was a thin sliver or disappeared entirely.
- **Reset App with other ReaderWrangler tabs open.** The reset could stop halfway while saying it was done, the page
  could hang on reload, and another open tab could bring your old folders back. Now the other tabs say *"ReaderWrangler
  was reset in another tab. This tab's contents are out of date. Reload it to continue."* and stop saving, and if a tab
  still holds on, Reset waits and asks you to close it.

### Behind the scenes — no change for you
- **Automatic tests in a real browser.** Changes are now checked by tests that drive the app in Chrome the way a person
  does — clicking, typing, pasting, opening two tabs — with a made-up library, before each release. Every fix above
  started with a test that showed the problem.

## [7.25.0] - 2026-10-31

### Security
- **Only you can change your synced copy.** Until now the Relay accepted a change to your synced library from anyone
  who knew your Channel ID. Now every change is signed with a key made from your passphrase — which still never leaves
  your devices — and the Relay refuses anything unsigned, signed by the wrong key, or more than 5 minutes old. Nothing
  to set up: your channel switches over by itself the next time you save.
- **A finished copy can't be altered, and a damaged one is never used.** Once a copy of your library is saved, its parts
  can't be overwritten; and a copy that fails its integrity check is skipped in favour of the previous good one.
- **Revoking now needs your passphrase, too** — someone with only your Channel ID can no longer lock you out of it.
- **Fixed:** the sample "organized" demo library file had sync credentials saved inside it. They have been removed,
  and that channel has been retired on the Relay.

## [7.24.0] - 2026-10-20

### Changed
- **Tag from Collections shows everything Apply will do, at once.** Tick the Kindle collections you want on the left;
  the right lists every book that will change, one column per collection: **+** = the tag will be added (click it to
  skip that book), **✓** = the book already has it. Each collection says which tag it will go onto — an existing tag
  with exactly its name, or a new one — and the button says the total: *"Tag 9 books from 2 collections"*.
- **Removing tags is now your choice, not the default.** Tags this tool added come off a book that left its collection
  on Kindle only if you tick **"Also remove tags whose book left that collection on Kindle"** — and tags you added or
  renamed yourself are never touched. They used to be pre-selected.
- **No more empty tags.** A collection's tag is created only if at least one book gets it.
- **"New books only" is gone.** It relied on a hidden memory you couldn't see or reset; the window now simply lists
  the books that would change, and opens with nothing ticked.

### Fixed
- **"Read" and "read" are two different tags, everywhere.** A tag's name is its exact text, capitals included. Before,
  names were matched ignoring capitals, so a Kindle collection "Non fiction" could have been put onto your own
  "Non-Fiction" tag. Typing a new name that differs from an existing tag only in capitals now asks once, so a Caps Lock
  slip can't make a near-twin by accident. Renaming a tag to a name that's already taken is refused.
- **Undoing a new tag removes it.** Undo of an action that created a tag also takes the tag off your tag list, if no
  book carries it any more.

## [7.23.0] - 2026-10-20

### Behind the scenes — no change for you
This release keeps sync storage tidy. Nothing you see changes, and there's nothing for you to do.
- **The Relay now cleans up after itself every night.** Leftovers from interrupted or replaced saves are deleted
  automatically — even for a library whose app is never opened again. (The last release only reported them.)
- **The app cleans up sooner when it saves.** It keeps the two newest copies of your library and deletes older ones
  right away, instead of waiting an hour — so a busy session of fetches no longer piles up copies.

## [7.22.0] - 2026-10-18

### Behind the scenes — no change for you
This release updates only the **Relay**, the service that carries your data between Amazon, your computer and your
phone. Nothing in the app changes, and there's nothing for you to do.
- **The Relay now checks its storage every day** and reports anything left over from interrupted or replaced saves.
  For now it only reports — nothing is deleted. The next release turns the cleanup on.
- **The daily usage report shows the real total** across the live and test Relays, so storage limits are watched
  accurately.

## [7.21.3] - 2026-10-16

### Fixed
- **Add Bibliography to Wishlist works from every tab of an author's page.** It was greyed out on the All Books tab.
- **It adds Kindle books only, and in the language you choose.** A small panel asks first: **Language** (only the
  languages that author has, or All languages), shows how many Kindle books match, then **Add to wishlist**.
  Previously it could also add paperbacks, hardcovers and audiobooks, and other-language editions.
- **It no longer depends on what's showing on the page.** It asks Amazon for the author's list directly, so there's
  no scrolling, no "Show More", and no need to set the page's own filters first.

## [7.21.2] - 2026-10-16

### Fixed
- **The Date Added filter keeps up with the calendar.** **This year** and **Last year** now always mean this year
  and last year. The menu's years were typed in by hand, so they would have gone out of date every January 1.
- **Any earlier year your library has is one click away.** A short **Earlier year** dropdown lists only the years
  you have books from, newest first. Previously the menu offered just 2023 and 2024; any other year took a custom range.
- **Searches that use a year show it plainly**: "2025", not "year2025", on both the computer and the phone.

## [7.21.1] - 2026-10-13

### Fixed
- **Restoring a backup no longer leaves a large leftover copy in sync storage.** Each Restore used to leave its full upload behind for up to 90 days; now every sync save cleans up what it has absorbed — including leftovers from earlier saves.

## [7.21.0] - 2026-10-13

### Running ReaderWrangler on your own computer
- **A copy you run yourself now behaves like the real site.** If you serve ReaderWrangler from your own computer (self-hosting), it uses the normal sync relay and shows no developer messages. Previously a self-hosted copy quietly used the developers' test relay, and its phone-pairing code pointed at the test site.
- **Contributor mode** — for people working *on* ReaderWrangler — turns on the developer behavior instead, once per browser. The header badge shows **LOCAL · CONTRIBUTOR** when it's on, plain **LOCAL** when it isn't. Setup is in CONTRIBUTING.md.

### Under the hood
- **Usage statistics now separate real use from testing**, so the numbers the project uses to decide what to improve reflect actual readers.

## [7.20.0] - 2026-10-13

### A new Tools menu
- **The menus are now organized by what you're doing.** **File** is your data coming in and going out — Data Status, Import from Relay, Relay Setup, Restore Backup, Save Backup, and Save Spreadsheet. **View** is how things look. The new **Tools** menu holds what you do *to* your library — Auto-Organize, Removed books, Manage Tags, Tag from Collections, and Reset App (alone at the bottom, in red).
- **What moved:** Auto-Organize, Removed books, Tag from Collections, and Reset App moved from **File** to **Tools**; Manage Tags moved from **View** to **Tools**. Tooltips and help text point to the new places.

## [7.19.0] - 2026-10-12

### Books that leave your Amazon library
- **ReaderWrangler now tells you when a book disappears from your Amazon library** — a returned loan, a sample you deleted, a book Amazon delisted. Until now those books simply stayed in ReaderWrangler looking exactly as before, with nothing to say they were no longer in your Amazon library.
- **File → Removed books…** lists them, with where each one is filed. For each book you choose: **Keep** (it stays filed, and you won't be asked about it again — later fetches and imports won't undo that) or **Permanently delete**. Click a title to see the book's details before you decide.
- **You'll hear about it when it happens:** an Import from Relay names any removed books and offers **Review…**, and a reminder bar stays up until you've decided (**Not now** hides it until next time).
- **Every book you've kept** is listed in a collapsed **Kept** group, with **Ask me again** if you change your mind; book details also say *"No longer in your Amazon library"* — kept, in your Trash, or waiting for review.
- **If a kept book comes back** to your Amazon library, ReaderWrangler clears the Keep — so if it ever disappears again, you'll be asked again.

### Select all that means what you're doing
- **Ctrl+A acts on the part of a window you last clicked in.** Click a title or a paragraph and Ctrl+A selects just that text; click in a list of checkboxes and Ctrl+A checks that whole list. Book details is divided into its title, facts, note, description, and each review. Button labels are never caught up in a selection, so copying window text gets just the content.
- **Checklist sections have a Select all / Clear link** in their header — including Tag from Collections' book list and its "Removed from Kindle" section.
- **Tag from Collections:** click a book's title to open its details before deciding.

### Undo you can see
- **The 🕐 message history shows what undo would do next**, with an **Undo** link right there.
- **Ctrl+Z with nothing to undo now says so**, instead of silently doing nothing.
- **Fixed:** in a long session, actions taken inside a window could become impossible to undo from that window.

### Smaller improvements
- **Click a book's title to see its details** in Removed books and Tag from Collections — decide with the facts in front of you. The details open on top, and ◀ ▶ steps through the list.
- **"Clear those N goals" after an import** — when books you've just bought still carry a price goal, one click clears them (undoable).

## [7.18.0] - 2026-10-08

### Windows, menus and popups all behave the same way
- **Esc, ✕, and clicking outside now work everywhere, the same way.** Every window, menu, dropdown and confirmation box in ReaderWrangler now runs on one shared system. **Esc** closes the innermost thing first: a menu inside a window closes before the window does. Windows and confirmation boxes close with their **✕** or a click on the dimmed background, and menus close when you click anywhere else. A few places that used to ignore Esc (Bulk Edit, the **💾 Save ▾** menu) now respond to it, and Folder Properties gained a ✕.
- **Closing a menu never costs you your selection.** Pressing Esc or clicking away to dismiss a right-click menu or dropdown used to clear your selected books, or click whatever was underneath. Now the click only closes the menu; your selection stays put.
- **One click switches between dropdowns.** With one toolbar dropdown open, clicking another dropdown's button opens it straight away. You no longer need one click to close and a second to open.
- **Keyboard shortcuts can't reach the books behind an open menu or window.** With a menu or window open, Ctrl+A, Delete, Ctrl+X and similar shortcuts no longer act on the library behind it. Inside a window, **Ctrl+A** selects that window's text (handy for copying), never the whole page.
- **Confirmation boxes close like everything else.** The small yes/no boxes (Bake Order, naming a new Book List, error messages, and so on) now close on a background click, the same as Esc and ✕, and always count it as **Cancel**.
- **Stacked windows no longer darken the screen twice.** A window opened on top of another, such as Relay Setup's help, keeps the dimming at its normal level.

### Hover popups you can actually use
- **The "where does this book live" popup in Auto-Organize's Preview stays open.** Before, it vanished the moment you moved toward it. Now it waits until your mouse rests on a cover, stays open while you're on it, and scrolls if the list is long. It's headed by the book's title, replacing the second tooltip that used to pile on top. The smaller covers in the grey "already here" tray show it too.
- **Hover popups stay out of the way while a menu or panel is open,** so they never cover the thing you're working in.
- **Ctrl+A in a hover popup selects its text,** once you've clicked or selected text in it.

### Smaller improvements
- **Book window: a labeled "Share ▾" button** now sits next to **View on Amazon**, instead of an easy-to-miss icon. Share now uses the familiar three-connected-dots icon everywhere.
- **Clicking empty space in the book list clears your selection.**
- **Ctrl+A in the Auto-Organize wizard checks every author**, the same as its Select All button.
- **Save ▾ with no matching books** now explains itself: *"No books to save — a Search will catch future matches."*
- **Series suggestion lists** (book editing, Bulk Edit) close when you Tab to the next field, and stay attached to their field when you scroll.
- **More panel:** the Series filter gets a wider column.

### Changed
- **Folder Properties can no longer be dragged around the screen.** Moving windows is coming back as a feature for *every* window at once, instead of just this one.

## [7.17.1] - 2026-09-28

### Fixed
- **Sharing a book now sends the whole recommendation.** When you use **Share…** (your device's share menu) to send a book, it now carries the same full message as **Email a Friend** — the title, author, rating, a short description, and the Amazon link — instead of a bare one-line snippet.

## [7.17.0] - 2026-09-25

### Under the hood — no visible change
- **Save, Restore, and phone sync now share one definition of your book details.** Version 7.16.0 fixed a set of details that Save/Restore had been quietly dropping — collection-based tags, price goals, notes, dates, trash and read status — caused by the save side and the restore side keeping separate, hand-kept lists of what each detail is called (some were stored under one name and looked for under another, or saved but never read back). 7.17.0 makes that class of bug impossible to reintroduce: desktop save/restore, phone sync, and the merge that folds in updates all now read from a single shared definition, so a detail can't be named or handled one way in one place and differently in another. Nothing changes in how the app looks or works.

## [7.16.0] - 2026-09-22

### Fixed
- **Backups are complete again.** Saving and restoring a backup no longer quietly drops parts of your library — collection-based tags, trash, price goals, read status, and more all survive a Save/Restore intact.

### Changed
- Very old backups (from a pre-2026 version) now show a clear "this file is too old to restore" message instead of importing incomplete books.
- Data-integrity hardening under the hood: the code that merges and saves your books now guarantees no field is silently lost or resurrected — guardrails against a whole class of quiet data bugs.

## [7.15.3] - 2026-09-21

### Under the hood
- Added internal safeguards that flag mislabeled book data during development, so field-naming mistakes get caught before they could affect your library. No change to how the app works for you.

## [7.15.2] - 2026-09-21

### Right-click the whole Folders header
- The "Folders" section header now responds to a right-click along its entire row, not just the word — a bigger target for its New Folder / Open menu.

## [7.15.1] - 2026-09-21

### Empty the Trash from a right-click
- Right-clicking Trash now always opens a menu — **Empty Trash (N)** when there are deleted books to clear (N shows how many), or a quiet **"Trash is empty"** when there's nothing to remove. Before, right-clicking an empty Trash did nothing.

## [7.15.0] - 2026-09-21

### Right-click menus that never run off-screen
- Right-click menus (on books, folders, Book Lists, Searches, and in the Auto-Organize preview) now measure themselves and flip or shift to stay fully on screen, however long they get — so the bottom of a menu is never cut off again. Previously a menu that had grown past a fixed size guess could open partly off the bottom of the window.

## [7.14.4] - 2026-09-20

### Cleared details stay cleared after Import
- When you cleared a price goal, star rating, tag, or note and then used Import from Relay, the cleared detail could quietly come back. Now a detail you clear stays cleared. (Notes were also never actually kept across an import — now they are.) Details you *set* are preserved as before, and updates from Amazon still flow in normally.

## [7.14.3] - 2026-09-20

### Sync setup & restore — safer, less surprising
- **Restoring a backup no longer silently changes your sync credentials.** A backup carries the sync channel it was made with, and before, restoring one could quietly switch you to it — so an old backup could point you at a stale channel without a word. Now, if the backup's channel differs from the one you're using, ReaderWrangler asks: keep your current credentials (the default — they match your installed bookmarklet) or switch to the backup's. Matching (and first-time) restores stay silent, as before.
- **Relay Setup no longer gets stuck in "enter credentials manually."** Closing the credentials screen from the manual-entry form (via ✕, clicking outside, or Done) used to leave it in that mode, so the next time you opened Relay Setup it jumped straight back to the form. It now always returns to the full Credentials view.

## [7.14.2] - 2026-09-17

### Dialogs that close when you tell them to
- **Esc, and clicking outside, now close a few dialogs that ignored them.** The backup-restore confirmation, the "new folder is hidden" notice, and the sync-recovery notice can now be dismissed with Esc or a click on the dimmed background, like every other dialog — and while any of them is open, typing shortcuts no longer slip through to the library behind.
- **Fixed a stray popup after pressing Esc in Auto-Organize.** Pressing Esc while a book's "where it lives" popup was open used to close the preview but leave that little popup stranded on an empty screen. Esc now clears everything cleanly.

_These fixes came out of a full audit of how every dialog and pop-up in ReaderWrangler handles Esc and clicking away. The audit found more to tighten than we changed here; we fixed the highest-impact cases now and are planning a deeper, do-it-once rework so every dialog behaves the same way by design (details in [docs/design/DIALOG-DISMISSAL-AUDIT.md](docs/design/DIALOG-DISMISSAL-AUDIT.md))._

## [7.14.1] - 2026-09-16

### A smoother way out of the Gmail dead end
- When "Open in Gmail (web)" hits a browser redirect error, the hint below it now offers a one-click **Share…** shortcut (where your device supports it) that hands off to your system's own sharing — which often has a working Gmail option — so you're not stuck retyping anything. The hint also spells out the manual fix more clearly: click the **new tab's** address bar and press Enter.

## [7.14.0] - 2026-09-16

### Email a friend, without the dead end
- **Sharing a book by email now asks how you want to send it.** Before, "email a friend" tried to hand off to Gmail on its own — and for anyone whose browser routes mail through Gmail on the web, that could spin into a "too many redirects" error with no way back and no way for the app to tell it had happened. Now a small **Share by Email** dialog offers three honest choices: **Open in email app** (your default mail program, prefilled), **Copy to clipboard** (always works — paste it anywhere), and **Open in Gmail (web)** for those it suits. You pick the one that works for you, instead of being dropped into whichever one your browser guessed.
- The Copy option is the safety net that never fails, so no one is stranded if their mail setup misbehaves.

## [7.13.2] - 2026-09-16

### Developer-only; invisible to users
- **The relay worker+storage a build reads is now shown, not hidden.** Dev and localhost share one relay worker (isolated KV storage); prod has its own. That routing was a hidden variable — same channel ID, silently different data store — which made "where is my data?" a guessing game. Dev builds now say so: the mobile badge reads **Dev/Local**, and both Relay Setup and Data Status name the **Dev relay worker + storage** alongside the channel. Prod stays clean (no dev jargon for real users).

## [7.13.1] - 2026-09-15

### Fixed (developer-only; invisible to users)
- The mobile viewer always talked to the **production** relay worker, even when loaded from a dev or localhost build — so a dev phone could never see dev-relay data (the desktop app and bookmarklet already route to the isolated dev worker; mobile.js hadn't mirrored that). Dev/localhost mobile now reads the dev relay, matching every other dev surface.

## [7.13.0] - 2026-09-15

### Copy without the fight
- The book dialog's title is a link — great for opening Amazon, hostile to selecting text. **The title and author lines now carry a small copy chip (📋)**: one click, "Title copied!" / "Author copied!" — built for the co-author strings that read like random passwords.
- **Copy Author(s)** joins Copy Title in the right-click menu, in every view, deduped across a selection (five books by one author paste as one line). And Copy Title finally announces itself with a receipt.

## [7.12.0] - 2026-09-15

### Price goals remember what you saw
- **"was $2.99 when goal set (9/15/2026)"** — setting a price goal now records the book's price at that moment, shown on the dialog's goal line and in an optional **Price When Set** column. Amazon's advertised list prices are theater (a $1.99 Kindle sale "marked down" from a $17.99 *print* list) — the price you saw when you decided to care is the honest guide to what a book returns to when its sale ends. The date rides along, so a snapshot taken mid-sale is self-evident. Re-setting a goal — the same value included — stamps today's price onto goals from before the feature existed.
- **Deals Only is now Goal Met** — a clearer name for what it always was: every book at or below *its own* goal. And books in the Trash no longer count toward it — a bargain you consciously binned isn't a deal waiting for you.

### One format, one spelling
- Wishlist-added Kindle books said **"Kindle"** while library-fetched ones said **"Kindle Edition"** — the same format in two Amazon vocabularies, splitting the Format column into two buckets. New wishlist adds and existing records now both speak the library's language; any format you edited by hand is never touched.

### Small fixes
- The Show Columns menu derives its labels from the column registry now — the new column briefly had a nameless checkbox because a duplicate label list existed to forget. The duplicate is gone, so the mistake can't be made twice.

## [7.11.0] - 2026-09-10

### Every action gets a receipt, and every receipt names its target
- **The other half of "toasts everywhere" lands**: moving, copying, pasting, hiding, deleting, restoring — each action now confirms itself with the book's title (*"Hid 'Red Cell'"*) or an honest count, matching the undo toasts from 7.8.0. Paste, which previously happened in silence, both announces itself and stopped being labeled "Copy" in undo.
- **Delete receipts say where from**: *"Undone: Delete 'A People's History…' from 'Folder A'"* — because "where did it go back to?" is the question you're asking when you read that toast.

### If you did it, you can undo it
- **The silent minority is gone.** Price goals, ratings, tag edits from every surface, duplicate cleanup, hiding copies, deleting tags — and the entire rename family: folders (inline in either pane *or* the Properties dialog), tags, Searches, Book Lists. Ten rename spots, all previously silent and permanent, now all undoable with receipts. Saving and deleting a Search joined too, and reordering tags, Searches, or Book Lists quietly went undoable (no toast for a drag you just watched — but Ctrl+Z puts it back).
- **Naming a just-created folder or list counts as creating it** — one undo removes the whole named thing, instead of un-renaming it first.
- Why total coverage matters: the scary scenario — Ctrl+Z reverting something *older* than you expected — only happens when your last action **wasn't** recorded. Gaps cause that surprise; coverage cures it.

### Dialogs keep their keys to themselves
- **The dangerous one**: with the Status History window open, Ctrl+X passed *through* it and cut the selected book underneath — one toast away from an unnoticed delete. Now one rule governs every dialog: **while it's open, keys apply to the dialog or to nothing.** Cut/copy/paste/delete, Ctrl+A, and Back/Forward navigation all stop at the glass — and native text copy finally works inside dialogs, because the app stopped intercepting it.
- **Undo is fenced in every dialog now**, not just the book dialog: Ctrl+Z reaches only what happened since the dialog opened (rename a tag in Tag Manager, undo it right there), and says *"close this dialog to undo earlier actions"* otherwise. Three dialogs — Relay Setup, Duplicate Review, Tags from Collections — turned out to be missing from the guard list entirely; found by audit, not by accident.
- **Every prompt can be dismissed like a dialog should**: Esc cancels and a ✕ closes on every confirmation — including the delete warning that previously only answered to its Cancel button. Esc also closes Status History, Duplicate Review, and Tags from Collections. One deliberate exception: a running import's progress box ignores Esc.
- **Esc stopped stealing on its way out**: closing a dialog with Esc no longer wipes your selection and your cut clipboard behind it.

### Trash tells the truth
- **Dragging a book out of Trash always restores it** — one drag path moved the book's folder membership while leaving it deleted: "Moved to Inbox," visible nowhere. Every path now restores properly, undoably.
- **Hover a trashed book to see where it lived** — *"Was in (before Trash): Folder A"* — exactly the question you ask before restoring.
- **Delete works from All Books now** (and My Library, and Searches): DEL key or right-click — removes the book from every folder and trashes it, since an aggregate view has no single folder to remove from. Previously the key did nothing, silently — or worse, silently half-worked.
- **Cut from All Books explains itself** instead of doing nothing: cut moves books *between folders*, so it needs a source folder — the toast now says so.

### Cut you can finally see
- **Cut books wear marching ants** — a dashed, softly pulsing border (the Excel/Photoshop convention) on cover and list view alike — until you paste or press Esc. The old treatment was 50% opacity… next to hidden books' 40%: one visual channel, two meanings, caught by the resident UX critic. A hidden book that's cut now shows both signals, unambiguously.

## [7.10.0] - 2026-09-09

### Save as Spreadsheet — the first feature a user asked for
- **File → Save Spreadsheet (CSV)…** puts your whole library in one file Excel opens directly: title, author, series and number, ownership, format, **tags, folders (full paths), and Book Lists**, ratings, prices and goals, dates, notes — one row per book, with all the cross-referencing done for you (the part that's genuinely hard to do by hand from a backup file). Requested on September 8th; shipped on the 9th. Your books were always yours — now the *list* of them is too.

## [7.9.0] - 2026-09-09

### Auto-Organize: one view, and what you check is what happens
- **The This-folder/Everywhere switch is gone** — because its own designer couldn't find it while staring at books it would have unlocked. Now one preview always shows *everything* by the chosen authors, wherever it lives: books from the folder you opened in and the Inbox arrive pre-checked, strays elsewhere sit visible-but-unchecked, and books already home appear small and gray, labeled **home**. The checkboxes are the scope.
- **Every cover says where its book lives** — a small caption under each one (`Inbox`, `2 places · 1 stays`, `home`), uniformly: a caption's absence was itself a secret code, so nothing gets to go unlabeled. Click a caption for the plain-words breakdown — *moves from Wishlist · stays in Non-Fiction* — with per-folder checkboxes for the copies that should stay put. Default: books are pulled only from the folder you opened in and the Inbox; a deliberate second home is never silently stripped.
- **File under… (right-click a cover or a group header)**: send books to another author's group, or pick any folder — a filter-as-you-type picker where **creating a new folder is always an explicit ➕ choice**, never the fruit of a typo. Made for the co-author case: "Niven, Pournelle & Barnes" filing into your *Larry Niven, Jerry Pournelle* folder in one click. (And no, the app still never parses author names — a real book credits "ARGH! Oxford".)
- **Order you can trust**: authors alphabetical, series shelves in your own folder order — never the order you happened to click books in.
- **The button never overpromises**: `Organize 4 books` counts what will actually move; the caption reconciles the rest ("6 selected — 4 will move, 2 already home").

### The website grows up a little
- Every themed page now carries the **same theme control as the app** (top-right: Auto / Light / Dark / High Contrast) — one shared setting, with Auto following your device. Dark-mode visitors no longer read about ReaderWrangler in blinding white.
- **Navigation stopped playing hide-and-seek**: every page lists every page, with "you are here" shown in place instead of vanishing from the list — and the home page's nav bar no longer waits for you to scroll half the page to reveal that Tutorials and Security exist.
- **The Security page rejoined the family**: its cloud-sync description had gone stale (fixed the moment it was noticed — a security page owes accuracy first), and it now wears the shared nav and themes like everyone else.

## [7.8.0] - 2026-09-08

### The book dialog edits where it says
- **Format and Ownership now edit in place**, in their labeled rows — no more hunting: the disguised pill and the teleporting Format box at the top of edit mode are gone. (Field-tested by the only user, who concluded ownership wasn't editable at all. The control was there — disguised as a badge. That's a UI bug even when the code works.)
- **The Ownership dropdown tells the truth**: it shows the book's actual state — *Sample (from Amazon)* — and offers only what's genuinely yours to set: **Owned** ("I have it, Amazon's record is stale") and **Wishlist** ("I want it"). No more two-option toggle wearing the wrong state on a Sample book.
- **Overrides are reversible, visibly**: manually setting ownership snapshots Amazon's value first, and the dropdown then offers *"Reset to Amazon's value (Sample)"* — instant, on-screen, no waiting for a background sync. (Full model: docs/design/OWNERSHIP-MODEL.md.)

### Undo grows up around the dialog
- **Ctrl+Z now works while the book dialog is open** — undo your just-saved edit and watch it revert in place. Previously the dialog silently ate the keystroke.
- **…but only within this book's session.** Actions from before the dialog opened — or edits to a *different* book you navigated away from — can't be popped invisibly behind the modal. When there's nothing in-session to undo, the key says so instead of playing dead. (The full three-level model — field, dialog, global — is in docs/design/UNDO-MODEL.md.)
- **Every undo/redo toast names its target**: *"Undone: Edit 'Bitter Gold Hearts'"*, *"Undid: Hide 'Red Cell'"*, bulk actions with honest counts — verified complete by a mechanical audit of every undo site.

### Under the hood
- **One source of truth for wishlist status** (`ownershipType`) across the app, mobile, storage, and all fetchers — retiring a redundant legacy flag that misled two investigations. Old backups and bookmarklets keep working via permanent inbound normalization. (Library fetcher v5.4.0, wishlist fetcher v2.0.2, Mobile 1.8.1.)
- Help/About now shows the running **build** whenever it differs from the release version — an alpha can never masquerade as its parent release.

## [7.7.2] - 2026-09-07

### Fixed: cloud cleanup no longer gets just one chance
- After a sync consolidation, the multi-megabyte upload bundles it absorbed are deleted in a background pass — but only ever by the *same* session that absorbed them. Close the tab a moment too soon and those bundles sat in the cloud untouched for their full 90-day lifetime, a few hundred MB in a heavy week. Every import now re-checks for absorbed leftovers and clears them, whichever session left them behind. First live run reclaimed 27 stranded bundles in one pass.

## [7.7.1] - 2026-09-07

### Fixed: the Auto-Organize "Already filed" wall of rows
- The preview's "Already filed" section rendered one full-width row per book — fine for the usual two or three, a skyscraper when a whole author backlog (25 Heinleins) turned up already filed. It now groups books by their home folder: one line of green folder chips with a count, covers wrapping beneath, matching the layout language of the "Will organize" section above it. Selection, hover previews, and the right-click menu all work as before.

## [7.7.0] - 2026-09-04

### One home for your organization
- **Your folders, lists, and searches now live in a single guarded store** — and load *first*, unconditionally. Before, they were kept in two places with the real copy only consulted when books were present: a boot with an empty book database silently fell back to a stale second copy (the fog behind more than one past mystery). Now the organization loads no matter what — proven by deleting the entire book database and watching 249 folders come back untouched.
- **The Welcome screen stops impersonating data loss.** If your books are gone but your organization is intact (cleared browser data, a new machine), it now says so — *"Your folders and lists are intact"* — and lists your recovery options best-first: Import from Relay (your library is still in the cloud), Restore a backup (noting it also rolls your folders back to the backup's copy), or fetch fresh and then import. Returning users no longer get the set-up-from-scratch tutorial. Oh — and the real logo replaced the generic 📚.
- **Every tab-open was quietly costing a full cloud upload.** The sync watcher treated the app's own loading as "changes" and pushed an identical ~17 MB copy on your first tab-switch, every session — likely most of the lingering "writes still a bit high." A boot is not a change anymore. (A restore's settling wave had the same disease; also cured.)

### The library that matches Amazon exactly
- **The Orphan filter can finally see.** The fetcher has flagged books that vanish from your Amazon listing since v5.0.0 — and the import has discarded those flags every single time. They now arrive, on desktop and mobile.
- **…and it stops crying wolf.** With sight restored, 13 "removed from Amazon" books turned out to be present all along: physical items (maps, a DVD, one book Amazon sincerely calls **"Shoes"**) that the scan refused to *count* because their format wasn't book-shaped. Presence checks are now format-blind — a day-long live investigation ended with every book accounted for and the library matching Amazon **exactly**, once wishlist, duplicate records, and dead entries are each counted as what they are. (The full API findings are recorded in docs/design/FORMAT-POLICY.md so none of it gets relitigated.)

### Formats tell the truth
- **No more invented "Kindle eBook."** That value was never Amazon's — it was our import default, worn by 262 books including paper maps. Blank now means honestly unknown; a one-time cleanup clears the old token everywhere (and keeps clearing it for anyone updating later).
- **Real formats arrive on their own.** The removed-books check already walks your whole Amazon listing — it now also fills blank Formats with Amazon's verbatim value at zero extra cost. The maps say *Map*. The shoe book says *Shoes*.
- **And Format is yours to edit** — in the book dialog and in bulk (right-click → Edit → Format…), free text with suggestions drawn from your own library's vocabulary. An edited Format wins over every future fetch, forever. Typical bulk move: sort All Books by Format, select the blanks, set "Kindle Edition."

### Fetcher & bookmarklet (Library fetcher v5.3.1, Nav hub v2.1.1)
- **Two new ownership types from the field**: public-library loans and Audible Plus items now classify properly (labels, badges, filters) instead of landing as "unknown" — the second payoff of the unknown-type telemetry.
- **The fetch dialog stopped fibbing**: the completion message describes the cloud upload that actually happens (the "find your file in Downloads" era ended long ago); the removed-books check says *"Already saved — safe to close this tab"* with a tap-for-details ℹ️ instead of guilt-tripping you into waiting; and both dialogs wear the logo.
- **The bookmarklet works from any regular webpage** — it always did, but its failure message on sites that block bookmarklets confidently blamed your internet connection. It now names the real cause. (Chrome's blank New Tab page blocks all bookmarklets; that one's the browser.)

### Mobile 1.8.0
- Reads folders from the same single store as the desktop, shows the new ownership badges, and inherits the format fixes through sync.

### Under the hood
- Usage alert emails (operator-facing) stopped re-announcing storage levels nightly: counters alert on crossings, storage alerts once per band change, level-worded.
- Wizard undo returns books to their original position instead of the bottom of the Inbox; a context-menu edit crash fixed; storage-band memory for alerts; FORMAT-POLICY.md.

## [7.6.2] - 2026-09-02

### Receipts and honesty
- **Toast history** 🕐 — every toast now lands in a session log (the little clock by the status bar): the messages that used to evaporate before you read them are one click away, with timestamps.
- **Save Backup finally reports back** — a save dialog up front (pick where your safety net goes), progress while it packs, and a receipt when it's really done: *"Backup saved — 3,136 books, 46.7 MB → readerwrangler-backup-….json"*. Cancel says so honestly. No more squinting at the browser's downloads bubble.
- **Names-only browsing on mobile** — the Dashboard's Folders and Book Lists headings gained the ⊟/⊞ from the desktop sidebar: one tap collapses the whole section to a clean list of names (tap a name to open just that one). Scanning for a folder stops meaning paging through screens of covers.
- **Restores no longer double-push** — the cloud upload after a restore used to fire twice (the real one, then a redundant echo a minute later), wasting a full upload and making phones report "newer" against their own sync. One push now.
- **The freshness banner names its copies** — *"Your library is from 3:04 PM (…e0af) — a newer one from 3:05 PM (…9af6)"* — with seconds shown when both stamps share a minute. Help & About shows your copy's id too.

## [7.6.1] - 2026-09-01

### Fixed: the "newer library available" banner nagging a fully-synced phone
- The freshness check compared two timestamps that are *always* about a minute apart (when the desktop **saved** vs. when it **pushed**), so after a phone synced perfectly the banner still claimed newer data existed — forever. Freshness is now judged the right way: *is the copy on my phone the exact one the cloud is pointing at?* Same copy → quiet; different copy → banner.
- The banner also says more now: *"Your library is from 3:04 PM — a newer one from 5:04 PM is available. Tap to refresh."* — information, not accusation.

## [7.6.0] - 2026-09-01

### Folders, ordered your way
- **Pin folders to the top** 📌 — right-click any folder → *Pin to top* (multi-select works). Pinned folders float above the sort in every mode, in their own hand-arranged order — so your special folders stay on top while everything else lives in alphabetical. The 📌 on a pinned row is itself the one-click unpin. Pinning is drag-proof: you can't drag your way into or out of the pinned zone, only reorder within it.
- **Sort folders by Name or Count** — and the control now reads the way it acts: the key name opens the sort menu, the arrow beside it flips the direction (so do the Name/Books column headers, and re-picking the current choice in the menu).
- **New folders finally land where you can see them** — at the top of the list (just under the pins), from every door: New Folder, Create Subfolder, paste, *and* Auto-Organize, whose new author folders now arrive as an alphabetized block at the top instead of scattering near the bottom. Plus **Move to Top / Move to Bottom** on the folder menu, and "New folder here…" now actually means *here* (inside the folder you're standing in).
- **Bake this order into Manual…** — in a sorted mode, one command makes the current order your new manual order (whole tree, undoable). With pins, you'll rarely need it — but it's there.

### Your phone finally matches (Mobile 1.7.0)
- **The same folder order as the app** — pins, manual arrangement, Name or Count mode: the drawer, the Dashboard shelves, and subfolder grids all mirror the desktop exactly.
- **Freshness you can see** — a "Library as of ‹time›" line (Dashboard foot + About), and when newer data is waiting in the cloud, a **📡 "Newer library available — tap to refresh"** banner appears on open or when you return to the tab (one featherweight check, no polling).
- **Honest counts** — "3,134 of 3,136 books (2 hidden by user)", where the hidden clause is a tap-target that flips Show Hidden (and back). Desktop's count line says the same.
- **Date Added really means date added** — the field now travels to mobile and both surfaces sort by it (desktop's column had the same subtle mislabeling); ties resolve identically everywhere: author, then series, then series number. Wishlist books no longer sink to the bottom of every date sort.
- **Which server am I on?** — About names it outright, and non-production copies wear a small DEV/LOCAL badge (the cure for the which-install-is-this mystery).

### Sync, safety & fixes
- **The folder-order scrambler is dead.** The long-unexplained "my manual order reverted!" ghost was mobile loading in the same browser as the desktop and overwriting fresher local data with a field-stripped cloud snapshot. A **guest guard** now allows a cache write only when the incoming data is genuinely newer — and nothing strips fields in transit anymore. (Full story: docs/design/MULTI-INSTANCE.md.)
- **Undo tells the truth** — permanently deleting books also removes history entries about them (no more "Undone" toasts over nothing); a backup restore starts a clean history (old entries pointed at a replaced library); imports drop entries about books they removed.
- **Restores reach your phone immediately** — the restore's cloud push now carries the restored organization with a fresh stamp, instead of a stale pre-restore snapshot that phones rightly ignored.
- **Empty Trash** is now a button in the Trash view itself — and it matters beyond tidiness: emptying the Trash is what lets a deleted book be re-added from Amazon.
- **Series fetcher v2.0.2** — books you already own now count as *present* in the series-gap check: no more false "#1 missing from Amazon's series list" for an owned first book, and real gaps above your last unowned book are detectable at last.
- Sidebar section collapse states persist across reloads; sidebar folder drag-reorder is properly undoable; the folder context menu is grouped by what each action does.

## [7.5.1] - 2026-09-01

### Fixed: a cloud-storage leak
- **Interrupted syncs no longer leave permanent debris in the cloud.** When a sync upload is cut off mid-flight (closing the tab right after leaving it, a tab suspender kicking in), the half-uploaded copy was invisible to the app — by design, no corruption — but also invisible to the cleanup that runs after every sync, so multi-megabyte fragments accumulated forever. Storage had ballooned from ~54 MB to ~678 MB. The cleanup now detects and removes these fragments once they're safely past the in-flight window; the existing backlog clears itself over the next few syncs.
- The test suite also now cleans up its own throwaway test channels instead of abandoning them (a second, smaller contributor to the pile).

## [7.5.0] - 2026-08-29

### Smarter update checks, leaner cloud usage
- **The "new library data" banner now appears the moment you return to the tab.** Instead of a fixed 10-minute timer, the app checks for updates right when the tab regains focus — exactly the moment you come back from an Amazon fetch — with a short guard against rapid tab-flipping. While you stay in the tab it heartbeats every 20 minutes (hourly if the window isn't focused), and a hidden tab doesn't check at all: nobody's there to see the banner. Faster where it matters, ~90% fewer background checks. The console logs each check and its result.
- **Mobile sync sheds its training wheels.** The classic single-copy write that rode alongside the new chunked journal during the 7.2/7.3 transition is retired — every device has read the journal for weeks. Each sync push now writes roughly half as much to the cloud.
- **Under the hood**: the cloud worker's rate-limit bookkeeping now samples its counter (1-in-5, counting by 5) instead of writing it on every request — enforcement is unchanged, at half the write cost. Together the three changes roughly double how many users fit in the cloud service's operations budget.

## [7.4.0] - 2026-08-28

### Restore, made trustworthy
- **The restore confirm now tells you everything** — the backup's date and age ("from June 20 — 5 weeks ago"), and exactly which of your current Book Lists and Searches aren't in it, by name. Never a silent removal. A new **Back up current first…** button captures today's state before you roll back — making any restore fully reversible.
- **Restore is a pure time machine.** An option to merge/keep interim work was considered and rejected — it resurrects deliberate deletions and double-places moved books; the design doc records the full reasoning.
- **Your view settings stay put on a rollback** — restoring onto a live library no longer flips your view mode, columns, or pane width (your organization rolls back; your eyes don't). A restore onto an **empty** system (new machine, after a reset) brings back everything — now including your theme.
- **Live progress** — restores narrate every step ("Restoring 3,125 books… Uploading to the cloud — part 1 of 2…") with a motion bar, instead of going silent for the long stretch.

### Also
- **Local instances are badged** — tab title "(local)" plus a small LOCAL chip — so a localhost tab can't masquerade as readerwrangler.com.
- **The emergency screen grew up**: its Reset confirm is now an app-styled dialog (no more browser "localhost says…" box), and on localhost it shows the actual load error.
- **Copy audit**: "relay" is now reserved for the named feature surfaces (Relay Setup, Relay Import); everywhere else says "cloud."
- **Price staleness display tuned** (from 7.1.0): dimmed prices are now clearly dimmed in list and cover views; the book-detail dialog relies on its orange "as of" date instead of a dim that bold text swallowed.

## [7.3.0] - 2026-08-27

### Under the hood
- **Mobile sync's size ceiling: removed.** The snapshot writer promised in 7.2.0 switches on — pushes now commit the chunked journal (atomic, no 25 MB limit) as the primary copy, while the classic single key is still written alongside during the transition so even a long-cached phone session keeps working. The classic copy retires in a later release.

## [7.2.0] - 2026-08-27

### Under the hood
- **Groundwork for unlimited mobile sync.** The mobile snapshot was measured at 68% of its hard size ceiling (16.98 of 25 MB) — a growing library would eventually hit it and mobile would silently stop updating. This release adds a chunked, atomically-committed journal format for the snapshot (same corruption-proof commit scheme as 7.0's library sync) and teaches **every reader** to understand both formats. Nothing writes the new format yet: readers first, writer next release — so no device, however stale its cached session, can ever meet a format it doesn't know.

## [7.1.0] - 2026-08-27

### Smarter price updates
- **Price checks now focus on books you might actually buy** — wishlist items, samples, borrowed/Prime/KU books, and any owned book still carrying a price goal. Owned books without a goal are no longer re-priced (their price answers a question nobody asks) — cutting each fetch's price traffic by roughly 90%.
- **Prices show their age.** A price older than 24 hours renders dimmed — sale prices can turn in a day, and an old number shouldn't look authoritative. Hover any price for the exact "as of" time; the book details dialog prints the date beside the price; and Data Status gains a **Prices: last swept** line.
- **"N kept their price goals — clear if no longer wanted"** — when an import upgrades wishlist books you've since bought, the summary now mentions any that still carry a price goal (the goal is deliberately preserved; now it's also surfaced).

## [7.0.1] - 2026-08-27

### Under the hood
- **One shared implementation of the fetchers' sync code** — the wishlist, series, and author fetchers previously carried three near-identical copies of their sync logic; it now lives in one place. No behavior change.
- **Imports skip already-merged packets before downloading them** — the sync ledger is checked first, so letters that are already in your library aren't pointlessly re-downloaded and re-decrypted on every import.
- **A minimum-spacing floor on Amazon requests** — today a no-op by construction (Amazon's own response time already provides the spacing); pure insurance so our request rate stays put even if Amazon's backend gets faster someday.

## [7.0.0] - 2026-08-17

Sync, rebuilt to be corruption-proof. Everything that writes to the cloud sync — the app and all five bookmarklet fetchers — now uses a commit-then-publish scheme: updates travel as sealed, self-contained packets, and the synced library is only ever replaced by a complete, verified new copy, never edited in place. Closing a tab mid-sync can no longer corrupt anything. *(Major version: the app and fetchers speak a new sync format. They update together automatically; old and new halves don't mix.)*

### Sync durability (the 7.0 overhaul)
- **Interruption-proof writes** — a sync that doesn't finish simply never happened; the previous good copy stays live. The "Sync data check failed" recovery procedure should now be a museum piece.
- **Fetchers never rewrite your library** — Download Library, Download Collections, and wishlist adds each send results as a sealed packet; the app combines them on Import and tidies the synced copy afterward. Fetchers running at the same time can no longer overwrite each other.
- **Deletes stay deleted** — permanently deleting a book leaves a marker the sync honors, so an in-flight fetch can't resurrect it. Deliberately re-adding it later still works (after emptying it from Trash).
- **Restores stick** — restoring a backup now resets the synced copy too; previously the next import could quietly merge pre-restore data back in.
- **Self-healing reads** — if the current synced copy is ever unreadable, the app automatically falls back to the kept previous version.
- **No more 10-day expiry** — the synced library no longer evaporates after a quiet stretch; pending additions are kept for ~90 days and consolidated automatically.

### Also
- Import summary says **"No new books found"** rather than "Library up to date" — additions made on Amazon can take up to a minute to arrive, and the new wording stays honest in that window.
- Wishlist adds are now a single, instant sync write (no more re-uploading the whole library per add).
- Dev builds (localhost / dev site) automatically use a separate test sync service — development can never touch live data.

### For developers
- Design doc `docs/design/RELAY-WRITE-REDESIGN.md` (externally reviewed, v2); Node harness `relay/test-phase1.mjs` (39 checks incl. torn-write/concurrency scenarios); dev worker environment + `relay/README.md` ops runbook.

## [6.18.0] - 2026-08-12

### Book Lists & tags
- **Adding to a Book List keeps your selection** — it no longer clears after "Add to Book List," so you can keep scanning and adding.
- **Add already-filed books to a list from Auto-Organize** — the small "already here" / "elsewhere" covers in the preview are now selectable, so a book that won't move can still ride onto a Book List (e.g. a whole series onto *"‹Author› - To Read"*).
- **Smart Book-List name everywhere** — the *"‹Series›/‹Author› - To Read"* suggestion (and "matches an existing list → OK adds to it") now shows from *any* New Book List entry point, not just Auto-Organize.
- **Select All in the Tags filter** — complements Clear All (select all, then uncheck the odd one).
- **Order your tags** — drag tags into a custom order in Manage Tags (the **Tag** header cycles A→Z / Z→A / Manual; grab the **⠿** handle to reorder). That order drives the Tags filter and the right-click **Add tag** menu; new tags land at the bottom.

## [6.17.2] - 2026-08-12

### Fixed
- **Import summary reports ownership upgrades.** When a relay import turns a wishlist/sample book you already had into an *owned* one (same ASIN), the summary now says so — e.g. *“Library updated: 512 books (1 new, 1 now owned)”* — instead of counting only the “new” additions and silently hiding the upgrade. (An upgrade-only import no longer misreads as “up to date.”)

## [6.17.1] - 2026-08-12

### Data integrity
- **Clear recovery when the synced copy is corrupted.** If the cloud (relay) copy fails its integrity check — almost always a browser tab closed mid-sync — ReaderWrangler now shows a single, reassurance-first dialog (*“your library is safe on this device”*) with step-by-step recovery (save a backup → re-download library + collections with the bookmarklet → Import from Relay) and a **Copy** button, instead of a cryptic error. The steps also travel on the error itself, so a fetcher's error overlay shows the same guidance.
- New design note: `docs/design/DATA-DURABILITY.md` — what's recoverable from Amazon vs. RW-only, why wishlist stays, and the recovery procedure.

## [6.17.0] - 2026-08-10

Auto-Organize goes library-wide. A new **Scope: This folder / Everywhere** switch lets you gather a scattered author out of every folder and the Inbox into one home — right from inside the preview — and the preview now shows the author's *whole* footprint, so nothing's hidden.

### Consolidate — organize across the whole library
- **Scope toggle (This folder / Everywhere)** — Auto-Organize from a folder or the Inbox as before, or flip to **Everywhere** to consolidate the same author(s) from all over in one pass. Flip it in place; when you're done you're still standing in the folder you started in.
- **Consolidate from All Books** — Right-click a book in All Books to gather its author from wherever the copies live into the author's home. Fixes the old "organized but left a duplicate behind" case — a book now leaves its actual folder, not the Inbox.
- **Never flattens** — Books already anywhere under the author's folder stay exactly where they are; consolidate only pulls in the strays.
- **See the whole author** — The preview shows the author's full footprint in three clear states: **movers** (being filed), **already here** (in the home, on a recessed shelf tray), and **elsewhere** (loose in the Inbox or another folder, on a dashed tray tagged with its location) — so you always see every copy, even the ones a run leaves alone.
- **Pick which copy** — For a book that lives in more than one folder, each copy shows separately (labeled by source) — pull one and keep another.

### Also
- **Filter box on Move to / Copy to / Add to Book List** — Type to find a target folder or list in a long, unordered menu instead of scrolling.
- Under the hood: a pure-engine `consolidate` mode with per-membership removal, locked in with unit tests.

## [6.16.0] - 2026-08-10

Auto-Organize grew up. The right-click and the bulk wizard now open the **same live preview**, where you see exactly where every book will land — existing folders and all — and tune the result as you go. Plus a Publication Date column, gap-friendly series numbering, and book-to-book navigation from the detail view.

### Auto-Organize — one live preview for everything
- **See the whole neighborhood, not just the target.** For each author, the preview shows the author's *entire* existing folder — every series subfolder and what's already in it — with the incoming books highlighted (*"3 new · 9 already here"*). No more organizing blind and finding surprises afterward.
- **Pick the structure in the preview, live.** A **By Author / By Series** toggle sits in the header — flip it and the folders regroup instantly. A collapsible **⚙ Options** strip tunes the series-folder threshold, the *"Miscellaneous"* folder, and ordering, all against the real result. Your choices are remembered for next time.
- **"Already filed," handled gracefully.** A book that's in the Inbox *and* already in its folder is now surfaced (with where it lives) and offered a one-click *"remove from the Inbox"* — instead of a confusing "nothing to organize."
- **Choose exactly what to organize.** A checkbox tree (section / author / series) plus click-to-toggle covers lets you include or hold back any book, series, or author — so you can file the complete series now and leave the one with gaps for later.
- **It never splits a series.** A series that already has a folder always keeps it; the threshold only decides whether to create *new* folders.
- **The bulk wizard is now just an author picker** — with a name filter — that opens the same preview, so both paths are identical.
- **Flip through a shelf** straight from the book-detail view to check publication dates and covers.

### Added
- **Publication Date column** in list view — show it, sort by it, and use it to put a series in order.
- **Set numbers…** (on a multi-book selection) — type an exact list like *"13, 13.5, 14, 14.5"* and it's applied to the selected books in the order shown, so annual specials and other gaps get the numbers you want.
- **Book-detail ‹ prev / next ›** — page through the current folder's (or a preview shelf's) books without re-opening each one; ←/→ work too.

### Changed
- The **Amazon** column cell now reads **"View ↗"** (a clear link) instead of repeating the word "Amazon".

### Fixed
- Auto-Organize no longer scatters a series across the author root when a folder for that series already exists.

## [6.15.0] - 2026-08-07

A polish pass across the book right-click menu and the left sidebar — clearer grouping, submenus that never run off-screen, and a few quality-of-life additions.

### Changed
- **Book right-click menu, reorganized** — items are grouped by what they *do*: **placement** (Move / Copy / Add to Book List / Auto-Organize) · a look-and-share group (Open in Amazon / Share / Copy Title) · **edits** (Edit / Tags / Price Goal / Number by current order) · and **Delete**, isolated at the bottom. A divider separates the actions that only *read* the book from the ones that *change* it.
- **Edit does what you expect** — right-click **one** book and **Edit…** opens its full details (including the Note and rating, which had no menu path before). Select **several** and **Edit ▸** offers just the fields that make sense in bulk (Author, Series, Position, Number-by-order, Owned/Wishlist).
- **Submenus stay on screen** — every right-click submenu now flips left or up as needed so it's never clipped near a screen edge.
- **"Purchased" is now "Owned"** — the ownership label reads *Owned* everywhere (column, filter, book details), contrasting more clearly with the *borrowed* types (Prime, Kindle Unlimited, Sample). The edit control is labelled **"Owned / Wishlist"** — the one ownership state you set by hand (the rest come from Amazon).
- **Consistent sidebar accordion** — the collapse/expand arrow now sits to the **left** of each section title (Searches / Book Lists / Folders), with +/sort buttons trailing. **Folders can now collapse to a single row**, and its subfolder control is a persistent **⊟ / ⊞** toggle — one click to collapse *or* expand all subfolders.

### Added
- **Smart Book List names** — creating a Book List from an Auto-Organize preview pre-fills the name: all one series → *"&lt;Series&gt; - To Read"*, one author → *"&lt;Author&gt; - To Read"*, otherwise blank. Just a suggestion — type over it freely.

### Removed
- **"Add Note"** from the right-click menu — the edit dialog already covers notes (and everything else), reached via **Edit…** on a single book.

## [6.14.0] - 2026-08-06

Auto-Organize now works from **any folder**, not just the Inbox.

### Changed
- **Auto-Organize files the folder you're in** — Right-click a book inside *any* folder (Collections, a "New To Read" catch-all, a Wishlist folder…) and Auto-Organize now files **that folder's** books by the same author into their Author/Series folders, moving them out of the current folder. Previously it only ever acted on unfiled (Inbox) books, so invoking it inside a folder was confusing or did nothing. Only the current folder's membership changes — a book's other folders and Book Lists are left untouched.
- **It never dis-organizes your shelves** — a built-in guard means Auto-Organize only ever moves books *into* their author/series home, never *up or out* of one. Standing inside a series subfolder and choosing "By Author" no longer flattens it; it recognizes the books are already filed. (By Series can still deepen loose author-root books into series subfolders.)
- **The confirm dialog names the folder** — the title and summary now read *"Auto-Organize "Collections" Folder — By Author"* and *"These leave the "Collections" folder"*, so it's always clear which books are affected. From the Inbox / All Books it reads "Inbox" as before.
- **Book Lists sit it out** — Auto-Organize is a folder (custodial) operation, so it no longer appears in the right-click menu when you're viewing a Book List (or Trash).
- The confirm preview now lists each author's top-level books first, then the series subfolders.

## [6.13.2] - 2026-08-06

A UX-polish release centered on **seeing where each book lives** while you organize.

### Added
- **See where a book lives** — Hover a book — now in **any folder or Book List**, not just All Books — to see every folder and Book List it belongs to. Works in both cover and list views. Answers "did I also put this somewhere else?" without leaving the shelf you're on.

### Changed
- **The "where it lives" popup is easier to reach and read** — It now grows from your cursor as its inner corner (point at a cover and it fills the space away from the library's center), always keeps a little overlap with the cover, and only appears once you hold still — so scanning across covers no longer makes a popup flicker or run away from you.
- **Deleting an *empty* folder or Book List no longer asks "are you sure?"** — there's nothing to lose, so it just deletes. (Deleting a folder or list that still holds books still confirms first.)
- **Naming a new folder keeps its buttons reachable** — while you type a new folder's name, its controls stay put, matching how Book Lists already behave.

## [6.13.1] - 2026-08-05

A reliability & consistency pass. Under the hood, each library action (delete a folder, move/copy books, move a folder, create/delete a Book List) now runs through a single shared implementation, so it behaves the same whether you use a menu, the keyboard, or drag — which fixed a batch of drift bugs and filled in missing feedback.

### Fixed
- **Deleting a folder** now tells you where the books go — the confirmation reads "…the books return to the Inbox" (or to the parent folder), and **every** delete path shows a result toast. Two underlying bugs are fixed: deleting a top-level folder from the keyboard could leave its books with no home, and undoing a folder delete could duplicate a book's folder memberships.
- **Moving books into a folder from the right-click menu** was silent — it now shows a toast, and undo puts the books back in their original spots.
- **Undo and Redo now tell you what they did** — e.g. "Undone: Move 3 books to 'Sci-Fi'", "Redone: Create Book List 'To Read'". Previously many actions undid silently.
- **Deleting a Book List** now confirms and toasts on every path; creating one with the "+" button toasts once you've named it.
- **Moving a folder to a new parent** (menu "Move to", cut-and-paste, or drag) now behaves identically everywhere — one toast, one undo step.

## [6.13.0] - 2026-08-04

Organizing straight from a book — the Auto-Organize wizard now has a fast, book-anchored companion.

### Added
- **Auto-Organize from a right-click** — Right-click any book (or a selection) in the Inbox or All Books and pick **Auto-Organize ▸ By Author…** or **By Series…** to file all of that author's unfiled books in one step. *By Author* drops them flat under an author folder; *By Series* builds author/series subfolders (non-series books sit at the author's root). A **preview** shows exactly what will happen — the actual book covers, grouped by author and series — before you commit anything.
- **Queue while you file, in the preview** — Select covers in the preview and right-click to **add them to a Book List** (e.g. a "New To Read" queue): confirm, and the books file into their series folder *and* stay on the list as shortcuts. **Hover** a cover to see which folders and Book Lists it already lives in, and **double-click** a cover to open its full details.
- **Series-folder threshold in the Auto-Organize wizard** — Choose how many books of a series you must own before it earns its own folder (default 2), so large libraries stay tidy. (The right-click flow always makes the folder, even for a single owned book.)

## [6.12.0] - 2026-08-02

The largest release yet: a ground-up rework of how you organize your library — **Searches**, **Book Lists**, and a unified **folder-ordering** model — plus a full mobile visual refresh and a batch of data-integrity fixes.

### Added
- **Searches — saved live filters** — Save any combination of filters (search text, ratings, ownership, tags, dates, deals) as a named Search. Recalling one restores that filter state *in place* on your current view — a saved lens, not a library-wide smart folder. Searches get their own sidebar section, and the sidebar now separates **All Books**, **Searches**, **Book Lists**, and **Folders**.
- **Book Lists — curated reading lists** — A new sidebar category for hand-picked sets of books, kept entirely separate from your folders — a simple flat list (no sub-lists, unlike folders and their subfolders). Adding or removing a book from a list never tags, moves, hides, or deletes the book itself. Create one from the "Save these results" control or right-click → "Add to Book List"; reorder by drag; delete and restore with undo. Book Lists also appear on mobile and on the book hover popup, which now lists every list a book is on.
- **Unified folder ordering** — Folder order is now one setting shared everywhere: the sidebar, the right-pane Folders view, and the Move/Copy trees all follow the same order (Manual, Name A→Z, or Z→A). Drag-to-reorder works in Manual mode, and Folders-view book counts are now recursive.
- **Ownership at a glance** — A new sortable **Ownership** column (hidden by default — turn it on via Show Columns) and an **Ownership** line in the book details dialog show whether a book is Purchased, a Sample, Borrowed, Prime, Kindle Unlimited, and so on. Previously this was only visible on book covers or by filtering.
- **Format and ASIN columns** — Two more optional columns in the table view.
- **Mobile visual refresh** — The mobile drawer and Dashboard color-code the three sections (Searches, Book Lists, Folders) with matching icons, spines, and subtle tints (light and dark themes). Sections and folders collapse, with the state kept in sync between the drawer and the Dashboard; the Dashboard also collapses individual shelves.
- **Faster folder creation** — An always-visible "+" New-folder button in the right pane, New folder/subfolder from a blank-space right-click, and the option to create a destination folder on the spot inside the Move/Copy submenus.

### Changed
- **Library sync writes far less often** — Changes are now batched (saved after a pause, or when you leave) instead of every few seconds, cutting write volume sharply while keeping the "synced when I walk away" feel.
- **Search matches series names** — The search box now reads "Title, author or series" and matches series as well.

### Fixed
- **Drag copying instead of moving** — After a Ctrl-drag (copy), a following plain drag could still copy, because releasing Ctrl mid-drag left it "stuck." Fixed.
- **Sort by Series** — Sorting by Series orders books by their reading position within each series; adding **#** as a secondary sort now controls the within-series direction as expected.
- **Hidden books reappearing** — Books you'd hidden could quietly un-hide after refreshing your library from Amazon. Hidden now stays hidden — including books hidden in earlier versions.
- **Folder order resetting on import** — Your custom top-level folder order no longer reverts to alphabetical after importing from the relay or restoring a backup.
- **Folder reorder in the right pane** — Dragging to reorder folders in Manual mode no longer silently fails.
- **Edited series names reverting** — Series names you changed or cleared (for example, removing a publisher's marketing "series" such as "CAEZIK Notables") no longer reappear the next time you import from Amazon.
- **Series numbering being overwritten** — Numbers you apply with "Number by current order" are now preserved across imports.
- **Column layout on unhide** — Unhiding a newly added column no longer breaks the table's column widths.
- **A book briefly showing twice** — Fixed a transient duplicate right after a sync.
- **Wishlist book format** — Wishlist items whose format Amazon doesn't report are no longer mislabeled as "Kindle eBook".
- **Redo shortcut** — Ctrl+Shift+Z now *also* redoes (previously only Ctrl+Y worked).
- **"Show hidden" filter** — The toggle now actually filters hidden books (it had no effect before).

### Removed
- Legacy "drag to save a view" and tag-view machinery, superseded by Searches and Book Lists.

### Library refresh (bookmarklet)
- More complete refreshes: blank books Amazon returns are recovered, series name and number are recovered from the title for dead editions, and true ownership is detected from purchase history. Prices now come only from a book's Kindle edition (never a hardcover/paperback fallback), and a stale "$0" is cleared when a book has no Kindle option.

## [6.11.10] - 2026-06-16

### Fixed
- **Production outage from Babel 8 (CDN dependency)** — The app loads `@babel/standalone` unpinned from unpkg, which began serving the newly-released Babel 8.0.0. Babel 8's React preset defaults to the automatic JSX runtime, emitting `import {jsx} from "react/jsx-runtime"` into the transformed output — an ES import in a non-module script, which threw "Cannot use import statement outside a module" and prevented the app from loading. Pinned Babel to `@7.29.7` (classic JSX runtime). No application code changed.

## [6.11.9] - 2026-06-08

### Added
- **Comprehensive tooltip coverage** — Systematic audit of all interactive UI elements (155 scanned) added tooltips to 19 controls that lacked them. Mobile: Back, Folders, Search, Menu, Clear search, Close, Sort cycle. Desktop: logo link, Clear All filters, Auto-Organize All/Some/None segmented control, Book Detail Wishlist/Purchased pill, series dropdown chevron, 5 price-goal chips (per-price text), Custom price button, sidebar Show all/Hide empty toggle, Tag Manager sortable headers.
- **Mobile accessibility — `aria-label` on icon buttons** — Screen readers (TalkBack on Android, VoiceOver on iOS) now announce all icon-only mobile controls. Mobile Chrome doesn't show visible `title` tooltips on touch devices, so `aria-label` is the right primitive for touch accessibility.

## [6.11.8] - 2026-06-07

### Fixed
- **Tags filter empty state** — When no tags existed, the Tags filter dropdown showed only "No tags available" with no path to create one, forcing users to navigate elsewhere to create their first tag. Now mirrors the populated-state structure with a divider and "Manage Tags..." action so users can create the first tag from the same context they'd look for one.

## [6.11.7] - 2026-06-07

### Added
- **Filter and search control tooltips** — Native `title` tooltips on Search box, Show Hidden toggle, Collections filter, and Date Added filter. Collections tooltip explains the read-only-from-Amazon situation and points to File › Tag from Collections. Long tooltips (Collections, Show Hidden) use multi-line formatting for readability.
- **Splash load reassurance banner** — Folksy explanation near the top of the splash screen sets expectations for Chrome's "Page Unresponsive" dialog that can appear during in-browser Babel compilation. Positioned at 25vh so Chrome's overlay doesn't cover it.

## [6.11.6] - 2026-06-05

### Added
- **Relay lifecycle telemetry** — Four GoatCounter events instrument the relay onboarding funnel for launch analytics: `relay-channel-created` (app, on Generate Credentials), `relay-channel-used` (worker, on first manifest upload per channel), `relay-channel-revoked` (worker, on /revoke), `relay-channel-blocked` (worker, on auto-block). New worker KV key `lifecycle:{channelId}:used` tracks first use per channel.

### Changed
- **Relay email alerts taxonomy** — User-initiated channel revocations now fire a GoatCounter event instead of an admin email (normal lifecycle event, not a security event). Auto-blocks (rate-limit abuse) still send email *and* fire `relay-channel-blocked` telemetry. SECURITY.md updated to reflect.

## [6.11.5] - 2026-05-26

### Added
- **Amazon Insider ownership type** — Fetcher now recognizes `InsideAmazon` as a known book ownership type (purple `INSIDER` badge, "Amazon Insider" filter option). Previously logged as an unknown type via GoatCounter telemetry. Treated as subscription/access alongside Prime / KU / KOLL / Comixology.

## [6.11.4] - 2026-04-03

### Added
- **Create Tag in Tag Manager** — "Create new tag..." input at the bottom of the Manage Tags dialog. Type a name, press Enter. Duplicate names are caught. Previously tags could only be created via right-click context menu or book dialog.

### Fixed
- **Right-click tag assignment** — Right-clicking a book to add/create a tag silently cleared the selection before applying, so tags were never assigned. Caused by unified selection refactor converting a "clear folder selection" call into "clear all selection." Fixed in both list and cover view context menus.

## [6.11.2] - 2026-04-01

### Changed
- **Unified item drag/drop** — Books and folders now share a single drag/drop system. Ctrl+A selects all items, drag moves everything atomically with one undo action. New `moveItems()` function replaces 4 copies of inline book-move logic. Shift+Click range selection spans across folders and books. Folders can now be moved into Inbox.

### Refactored
- **Unified selection model** — Replaced separate `explorerSelectedBooks`/`explorerSelectedFolders` state with single `explorerSelectedItems` Set. Accessor methods (`isSelected()`, `getSelectedBookIds()`, `getSelectedFolderIds()`) encapsulate type-specific access. Extracted `isDescendantFolder()` helper for reuse.

## [6.11.1] - 2026-03-31

### Fixed
- **Unified book+folder selection** — Ctrl+A now selects both books and subfolders at the current level (previously only selected one type). Ctrl+Click and Shift+Click no longer clear the other selection type, allowing mixed book+folder selection like Windows Explorer.

## [6.11.0] - 2026-03-29

### Changed
- **Views filter with active search** — Saved Views now work like folders when filters are active: only views containing matching books are shown, with counts like `(1/12)`. Clicking a view shows the intersection of your current filters and the view's criteria, rather than replacing your filters. Filter bar stays fully interactive while in a view.

### Refactored
- **Parameterized book filter** — Extracted `bookMatchesFilters(book, filters)` from the monolithic `filterBookForExplorer`. Accepts any filter criteria object, enabling reuse for view match counting and future filter-related features. Removed filter stash/restore mechanism and `applyViewFilters` — views no longer hijack filter bar state.

## [6.10.0] - 2026-03-27

### Added
- **Saved Filter Views** — Save any combination of active filters as a named View in the sidebar. Single-tag, multi-tag, or complex filter combos (tags + read status + rating + etc.) all work. Drag the handle from the Active Filters banner or Tag Manager to the Views section. Views act as an independent lens: clicking a view applies its saved filters, grays out the filter bar, and shows a purple "View:" banner. Your personal filters are stashed on entry and restored when you navigate away. Tag Manager always shows drag handles for creating combination views. Replaces the old tag-only pin system with a general-purpose saved view system.
- **Share Book** — Share book recommendations via Copy Amazon Link, Email to a Friend (with Gmail fallback), or native Web Share API. Works with single or multiple books. Accessible from right-click context menu and book detail dialog.
- **Tag from Collections** — Wizard to convert Kindle Collections into editable tags. Tracks wizard-assigned vs user-assigned tags (`collectionTags`). "Removed from Kindle" section detects when books leave a Kindle Collection and offers to remove or keep the tag. "New books only" filter for repeat imports.
- **Context menus for Inbox and All Books** — Right-click Inbox for Auto-Organize and Select All; right-click All Books for Select All. Prevents Chrome default context menu on system folders.
- **Before/after screenshot update** — New 1920x1080 screenshots with wider comparison slider (1400px) and image scaling fix.
- **Data freshness monitoring** — Two-level freshness detection: (1) age-based — status bar shows Fresh/Stale/Obsolete based on when data was last imported, (2) relay-aware — app polls the relay every 10 minutes and shows "Update available" in the status bar when newer fetched data exists. Data Status modal shows relay state with one-click Import. Dismissed notifications stay dismissed until a genuinely new fetch is available.

### Fixed
- **Saved View navigation** — Clicking a saved view reset to All Books immediately. Root cause: the folder validation logic didn't recognize `__view_*__` folder IDs as valid, resetting them on the next render cycle.
- **Backup restore merging old books** — Restoring a backup merged orphan wishlist books from the existing database instead of doing a clean replacement. Demo backup (118 books) would show 372 books (254 orphans from prior full library preserved).
- **Missing filter clearing on backup restore** — Seven filter variables (tags, collections, ratings, series, date, deals) were not cleared on restore, causing stale filters to persist.
- **Relay: smart chunk deletion on revoke** — Revoke now reads the manifest to delete only actual chunks instead of brute-force deleting 0-99. Reduces KV deletes from ~102 to ~5 per revoke (95% reduction), preventing free tier quota exhaustion.

## [6.9.0] - 2026-03-23

### Added
- **Relay: channel revocation** — Self-service credential revocation with SHA-256 cryptographic proof. Revoked channels are permanently blocklisted and all data deleted.
- **Relay: rate limiting** — Per-channel write throttle (200/hour) with automatic abuse blocking at 2,000 writes/hour. Rate-limited and auto-blocked channels trigger email alerts.
- **Relay: email alerts** — Security event notifications via Resend: channel revocations, auto-blocks, rate limit violations, and test alerts.
- **Relay: usage monitoring** — Cron-based Cloudflare free tier monitoring queries the GraphQL Analytics API every 30 minutes. Threshold alerts at 25/50/75/90% for requests, KV reads, KV writes, KV deletes, and KV storage. Daily summary email at 23:55 UTC.
- **Relay Setup: Test Connection** — Inline button verifies relay reachability; result shown as sub-label with color-coded feedback.
- **Relay Setup: verified/unverified key states** — Generated keys show immediate green verification. Loaded or manually entered keys show a question mark until tested.
- **Relay Setup: redesigned UX** — Steps are freely navigable (no sequential lock), centralized `relayOp()` gateway for credential and status changes, solid red footer for errors, grouped action buttons.
- **Relay client: `revokeChannel()`** — Client-side function computes SHA-256 proof and calls the `/revoke` endpoint.
- **Revoke & Delete button** — Added to Relay Setup for self-service credential revocation from the app.

### Changed
- **SECURITY.md** — Updated with operational security details: email alerting, rate limiting, revocation, and usage monitoring.

## [6.8.1] - 2026-03-20

### Added
- **Demo Library** — `readerwrangler-demo-library.json` (100+ classic public-domain books, all in Inbox) added to repo and linked from the landing page Get Started section as an amber callout box.

### Changed
- **"Load from backup file"** — Renamed back from "Load from credentials file"; tooltip now explains that only encryption keys are loaded, and that File → Save Backup produces a backup that includes credentials.
- **Relay Setup: removed Backup button** — Credentials-only export removed; File → Save Backup (organizational backup) already includes relay credentials, making a separate credentials file redundant.

### Fixed
- **Stale folder selection on load** — If the saved folder selection points to a deleted or missing folder, the app now resets to All Books instead of showing an empty right pane.

## [6.8.0] - 2026-03-19

### Added
- **Relay Setup redesign** — All three steps are now always accessible (no sequential lock). Steps start collapsed; user opens the step they need. Active step shown with animated left accent stripe and pulsing green tower icon when keys are configured.
- **Relay Setup: Test Connection** — Step 1 shows a "Test Connection" button when keys are set; result shown inline with color-coded feedback.
- **Relay Setup: animated accordion** — Steps open and close with a smooth CSS transition instead of snapping.
- **Relay Setup: placeholder content** — Step 2 shows guidance text when no keys exist; Step 3 explains keys are required before the QR code appears.
- **Bookmarklet error dialog** — When the nav hub script itself fails to load (server down, no internet), an inline error card appears with a Close button instead of failing silently.
- **Nav hub custom error dialog** — When a fetcher script fails to load, a styled error dialog with Retry and Close replaces the native `alert()`.
- **New folder hidden alert** — Creating a folder while active filters would hide it immediately shows a dialog: Clear Filters / Show All Folders / Leave As Is.
- **Spring-loaded "Show All" during drag** — Hovering over the amber "Show All" row while dragging books for 650 ms activates it, revealing all folders without dropping the drag.

### Changed
- **Relay Setup banner** — Updated to explain the relay's role: transfers encrypted data between fetcher, app, and mobile device; relay never reads your data.
- **"Load from backup file" renamed** — Now "Load from credentials file" to match the `readerwrangler-credentials.json` default export name and avoid confusion with full backups.
- **"Show All" row visibility** — Amber filter indicator row now only appears when filters are actually hiding folders (not whenever any filter is active).

### Fixed
- **Relay Setup relayTestStatus** — Connection test result now resets on all modal close paths (X button, backdrop click, ESC, Done).

## [6.7.0] - 2026-03-19

### Fixed
- **Orphaned folder sort settings** — Deleting a folder now removes its sort settings from storage instead of leaving them to accumulate indefinitely. Sort settings are saved in the undo record and restored if the delete is undone; redo re-removes them.

## [6.6.0] - 2026-03-19

### Fixed
- **Inbox drop handler** — Books dragged to Inbox disappeared (removed from all folders, never added). Fixed to explicitly add to Inbox, remove only from source folder (first instance only, preserving same-folder copies), and record undo.
- **Backup restore → books in Trash** — Restoring a backup after soft-deleting books caused restored books to land in Trash. Root cause: `storage.js` OR-merged `isDeleted` state from IndexedDB with backup data. Fixed: backup restores now use the backup's value for `isDeleted`, `deletedAt`, and `deletedFromFolderIds`.
- **All Books included Trash** — All Books view and count were inconsistent (count excluded deleted books, view included them). Fixed to exclude deleted books from All Books entirely — Trash is a safety net, not a parallel location.
- **Ctrl+Drag copies instead of moves** — Three layered root causes fixed: (1) `e.ctrlKey` unreliable in `onDragOver` on Windows/Chrome → global `keydown`/`keyup` listener (`ctrlKeyRef`); (2) `e.ctrlKey` unreliable in `onDrop` too → use `ctrlKeyRef` instead; (3) React `setFolders` updater runs after event handler completes, so `explorerIsCopyDragRef` was already reset to `false` → capture `const isCopy` before `setFolders` and close over the local variable.

### Added
- **Copy toast** — Ctrl+Drag now shows: *"Copied to 'Folder' — same book, two folders. Your ratings, notes, and edits apply to both."* Sets expectations about the hardlink model and shared edits.

### Changed
- **All Books tooltip** — Updated to "Every **unique** book in your library…" to clarify that copies don't inflate the count.

## [6.5.0] - 2026-03-10

### Added
- **Folder/Tag View descriptions** — Right-click any user folder or pinned tag view → Properties → Description field. Description is saved to the folder/pinnedTagFolder object and displayed as a tooltip on hover in the sidebar and right-pane rows/tiles. Empty = no tooltip. System folders (All Books, Inbox, Trash, Views label, Folders label) are excluded.
- **System sidebar tooltips** — Built-in tooltips on all five system sidebar entries:
  - *Views*: "Different ways to see the same books — not separate copies"
  - *Folders*: "Your personal organization — drag books into any folder below to arrange your library."
  - *All Books*: "Every book in your library, organized or not. You can't move books out of here — use folders to arrange them."
  - *Inbox*: "This is where ReaderWrangler puts newly imported books. Drag them into folders to organize your library."
  - *Trash*: "Deleted books that are still recoverable. Right-click to empty the trash and remove them permanently."

## [6.4.0] - 2026-03-10

### Added
- **Views / Folders sidebar split** — Left panel reorganized into two named sections: *Views* (All Books + pinned tag virtual folders, with tooltip "Different ways to see the same books — not separate copies") and *Folders* (Inbox + personal folder tree, with tooltip "Your personal organization — move books here to arrange your library"). Clicking either section label navigates to a right-pane card grid showing its children.
- **Views section collapse/expand chevron** — ▼/▶ toggle for the Views section persists in both states (unlike Folders' ▲ which disappears when expanded).
- **Single-scroll left panel** — Views and Folders sections scroll together as one unified zone, so a large Views section no longer pushes the Folders tree off screen.
- **Simplified right-pane headers for Views and Folders** — When viewing the Views or Folders section, only Name (sortable) and Books count columns are shown; irrelevant book columns (Author, Series, Rating, etc.) are hidden.

### Changed
- **My Library renamed to Folders** — The root navigation label and section header is now "Folders".
- **System folder names bolded** — All Books, Inbox, and Trash names are rendered in bold for visual hierarchy.
- **Trash divider removed** — Border above Trash Bin removed; bold text provides sufficient visual separation.

## [6.3.0] - 2026-03-10

### Added
- **Data integrity checking** — On load and after each import or restore, the app automatically detects and fixes structural issues: homeless books placed in Inbox, ghost folder references (stale book IDs) removed, and duplicate folder references deduplicated. Results shown in Data Status with a full book list for any auto-fixed items. Anonymous telemetry via goatcounter (count only, no titles).
- **Drag books to Trash** — Drag one or more selected books from any folder directly onto the Trash Bin to delete them, following the same purchased-book warning as the DEL key path.
- **Hide available in Trash view** — Right-click context menu now includes Hide/Unhide in Trash view, consistent with all other views.
- **New Folder button on My Library** — Always-visible `+` button on the My Library row creates a top-level folder instantly. Right-click My Library for a context menu with Open and New Folder.

### Fixed
- **Folder +/× buttons hidden behind book count** — Book count now hides on hover and the +/× buttons appear in its place, eliminating the overlap.
- **Race conditions in data operations** — Three-layer protection: (1) atomic IndexedDB clear+add in a single transaction, (2) write serialization mutex queuing concurrent saves, (3) operation guard preventing overlapping import/restore/delete/device-state-push.
- **Relay import Inbox placement race** — `loadLibrary` now returns new book IDs directly, eliminating the post-import IndexedDB re-read that could race with the write transaction.

### Changed
- **Relay data expiry message** — "kept for 24 hours" corrected to "kept for 10 days after each fetch" (matching actual relay TTL for library data).
- **New Folder button location** — Moved from All Books (a view, not a container) to My Library (the root folder container). All Books no longer has a `+` button.

## [6.2.0] - 2026-03-06

### Added
- **Purchased book delete warning** — When deleting purchased books to Trash, a warning dialog explains they'll reappear after the next fetch and offers Hide Instead / Delete Anyway / Cancel. Already-hidden purchased books skip the dialog.
- **Fetcher scan mode banner** — Library fetcher progress dialog now shows a persistent info banner indicating whether it's a full library scan (relay data expired) or an incremental scan (with existing book count).

### Fixed
- **DEL key firing both book and folder delete** — Pressing DEL with books selected in the right pane no longer also triggers the folder delete dialog from the left pane.

### Changed
- **Auto-Organize wizard** — Moved Select All/Some/None controls to left side near checkboxes and added "Select:" label for discoverability.

## [6.1.0] - 2026-03-06

### Added
- **Basic accessibility (ARIA)** — `role="dialog"`, `aria-modal`, `aria-labelledby` on 17 modals. `role="menu"`, `role="menuitem"`, `role="separator"` on all context menus (folder, book, tag, trash). `aria-expanded` and `aria-haspopup` on 9 filter dropdown buttons. `aria-label` on icon-only buttons (collapse, view toggles, column chooser). `aria-disabled` on disabled menu items.

### Fixed
- **About dialog logo missing** — Referenced non-existent icon file; corrected to `icons/logo-transparent.png`.
- **security.html favicon broken** — Referenced non-existent path `images/icons/favicon.png`; corrected to `icons/favicon.ico`.

## [6.0.1] - 2026-03-05

### Fixed
- **Theme-aware filled buttons** - Action buttons (blue/red/green) now adapt to Dark, HC-Light, and HC-Dark themes via CSS Tailwind overrides. Previously kept exact light-mode colors in all themes.
- **HC-Dark button text legibility** - Button text switches from white to black on bright accent backgrounds in High Contrast Dark mode (WCAG contrast fix).
- **Button variant normalization** - Standardized blue-500→blue-600, rounded→rounded-lg, and cancel button hover states across folder Properties and date filter dialogs.

## [6.0.0] - 2026-03-05

### Added
- **Relay-only data flow** - All data transfer now goes through an encrypted Cloudflare relay. No more file downloads or uploads — bookmarklet fetchers push data to the relay, and the app pulls it with one click. End-to-end encrypted with credentials baked into the bookmarklet.
- **Import from Relay** - One-click import with progress dialog, 30-second timeout, and delta count showing how many new books were added.
- **Orphan detection** - Library fetcher now runs a background scan after each fetch to identify books removed from Amazon (e.g., Prime rotation, refunds). Orphaned books are flagged and filterable via an "Orphan (removed from Amazon)" ownership filter.
- **Review gap-fill** - Library fetcher enrichment now backfills missing reviews on existing books, not just new ones.
- **Wishlist deduplication** - Wishlist fetcher prevents duplicate entries on save. Info dialog shows skip counts for already-owned and already-wishlisted books.
- **Duplicate review in Data Status** - Data Status modal detects and displays duplicate ASINs with a cleanup option.
- **Trash Bin** - Two-stage delete: soft delete moves books to Trash, permanent delete removes from library and relay. Trash Bin appears at bottom of folder tree with count badge. Right-click for Restore or Delete Permanently. DEL key support. Drag from Trash to any folder to restore. Undo/redo for delete and restore actions.
- **Collapse All button** - Replaced expand/collapse chevron pair with single Collapse All button in folder tree. Appears when any folder is expanded, disappears when all collapsed.

### Changed
- **File menu redesign** - Import from Relay is now the primary action. Import/Export renamed to Restore/Save Backup. Menu reordered for relay-first workflow.
- **All Books filters include trashed books** - Search, tags, and all filters now match trashed books in All Books view (with Trash tooltip). Other views still exclude deleted books.
- **Tag counts exclude deleted books** - Sidebar tag counts and Data Status modal counts no longer include trashed books.
- **Inbox is a real folder** - Inbox now supports Cut, Move, and Paste for books, same as any user folder.

### Fixed
- **Permanent delete relay sync** - Emptying Trash re-uploads the full library to relay in fetcher-compatible format, preventing deleted books from returning on next import.
- **Inbox useEffect collector removed** - Replaced reactive background sweep with explicit Inbox placement during import.

### Removed
- **File-based data transfer** - Removed file picker import/export for library data. Backup save/restore retained for disaster recovery.
- **Exclusion list endpoints** - Removed unused relay exclusion list infrastructure. Permanent delete uses library re-upload instead.

## [5.6.8] - 2026-02-28

### Changed
- **Ownership filter label** - Renamed "Source" dropdown to "Ownership" for better discoverability when filtering by wishlist vs. purchased books.

## [5.6.7] - 2026-02-28

### Added
- **Cover badges** - Book covers now display visual indicators: rating (top-right, gold star), read status (bottom-right, green checkmark), collections count (top-left, folder icon), wishlist heart (top-left), price tag (bottom-left, green if at goal price), and ownership badges (SAMPLE, BORROWED, KU, etc.). Selection uses a blue checkmark overlay instead of the previous ring outline. Ported from v4 Column App. Desktop and mobile (CoverCard).
- **Manual Order sort (mobile)** - "Manual Order" is now the first sort option on mobile, preserving the book arrangement you set on desktop. Previously mobile always re-sorted books, losing custom folder and tag view ordering.

## [5.6.6] - 2026-02-28

### Added
- **Amazon links on book detail modal** - Book cover and title now link directly to Amazon product page (desktop and mobile). "View on Amazon" button now shows for all books, not just wishlist items.
- **Always-show Collections & My Rating (mobile)** - Mobile book detail now always displays Collections and My Rating fields, showing "No collections" / "Not rated" when empty instead of hiding them.

## [5.6.5] - 2026-02-28

### Fixed
- **Drag crash on mismatched drop** - Three drop handlers crashed on `JSON.parse` of empty drag data when a non-matching drag type reached them. The crash prevented drag state cleanup, breaking all subsequent drags until page reload.

## [5.6.4] - 2026-02-27

### Fixed
- **Drag-to-tag toast** - Dragging a book from a folder or All Books to a tag view always showed "Already tagged" even when the tag was successfully added. Caused by React 18 deferred setState updater — toast read closure variables before they were set.

## [5.6.3] - 2026-02-27

### Fixed
- **Tag view reorder** - Newly tagged books could not be reordered within a pinned tag view. They appeared stuck at the bottom, and existing books couldn't be dragged past them. Fixed by including unordered books in the working list before splicing.

## [5.6.2] - 2026-02-27

### Fixed
- **Reset App** - Now fully deletes the IndexedDB database instead of just emptying it. Previously left an empty `ReaderWranglerDB` behind after reset.

## [5.6.1] - 2026-02-26

### Added
- **Changelog page** - Version links in About dialog (desktop) and hamburger menu (mobile) now open a rendered changelog page (`changelog.html`). Uses marked.js to render CHANGELOG.md at runtime — no maintenance needed when changelog is updated. Includes "Back to Top" footer link. Mobile navigates in-app (PWA-safe); desktop opens in new tab.

## [5.6.0] - 2026-02-26

### Added
- **Tag Virtual Folders (Desktop)** - Pin any tag as a virtual folder in the left pane alongside real folders. Drag books to tag views, manual ordering within tag views, move/copy between views. Tag Manager redesigned with SVG icons, compact rows, full-bleed headers, and orphan checkbox selection.
- **Mobile Tag Views** - Pinned tag views appear in mobile's folder drawer and dashboard shelves, respecting book order from desktop.
- **iOS Safari "Add to Home Screen" hint** - Bottom banner on iOS Safari prompts users to install as PWA. Dismisses permanently on tap.
- **Apple PWA meta tags** - `apple-mobile-web-app-capable`, status bar style, app title for proper iOS standalone mode.
- **Android maskable icons** - Icons marked `purpose: "any maskable"` so they fill the adaptive icon circle instead of floating in a white border.

### Improved
- **Android splash screen** - Background changed from white to blue (`#dbeafe`) to match icon background. Icon logo repositioned with safe-zone padding.
- **PWA theme color** - Added `theme-color` meta tag (`#dbeafe`) for Android status bar.
- **README.md & index.html** - Full content sync: replaced 8 leftover v4 "column" references with v5 "folder" terminology, added mobile viewer content throughout, added tag virtual folders to features, wordsmith pass for clarity and accuracy.

### Fixed
- **Desktop tag view rendering** - Left pane renders tag views after Inbox with proper icons, browser back/forward via History API, auto-scroll to selected folder.

## [5.5.14] - 2026-02-16

### Added
- **Shift+click folder selection** - Select a range of folders with Shift+click in both list and cover views. Previously only Ctrl/Cmd-click worked for folders.

### Fixed
- **Shift+click book selection** - Fixed ReferenceError (`sortedBooks is not defined`) that silently broke Shift+click range selection for books in both list and cover views.
- **Dark mode folder border** - Folder tiles in cover view no longer show a reddish border in dark/HC dark themes. Changed to a warm brown that matches the folder background.

## [5.5.13] - 2026-02-16

### Fixed
- **SVG star performance** - Replaced per-star `React.useId()` with single shared clipPath definitions. Eliminates thousands of unnecessary ID generations at scale.
- **List view double-click** - SVG stars no longer intercept row double-click to open book modal.

## [5.5.12] - 2026-02-16

### Improved
- **SVG star ratings** - Replaced Unicode star characters (★½☆) with inline SVG stars for consistent cross-browser rendering. Half-star ratings now display as a true half-filled star instead of the ½ fraction character. Table rating column now shows half-stars (previously rounded down). All 4 themes supported via `--star-color` CSS variable.

## [5.5.11] - 2026-02-16

### Improved
- **Splash screen** - App now shows a branded loading screen (logo + spinner) immediately while React/Babel/Tailwind download. Previously the page was blank for ~13 seconds. Respects all 4 themes.

### Fixed
- **Getting Started links** - Empty state and Help menu "Getting Started" buttons now use relative URLs pointing to the install page instead of hardcoded production URL. Works correctly in dev/localhost environments.

## [5.5.9] - 2026-02-16

### Added
- **High Contrast themes** - Two new accessibility themes: High Contrast Light (pure white/black, stronger borders, deeper accents) and High Contrast Dark (pure black backgrounds, pure white text, maximum contrast). Toggle via Help menu > Theme.

## [5.5.8] - 2026-02-15

### Fixed
- **Cover grid zoom behavior** - Covers now scale correctly with browser zoom (Ctrl+Scroll). Previously covers shrank when zooming in because the grid used a fixed column count with `1fr` units. Now uses `auto-fill` with pixel-based minimum widths so covers scale with the page like all other elements. Slider now controls cover width in pixels (60-300px) instead of column count.

## [5.5.7] - 2026-02-15

### Added
- **Dark mode** - Full dark theme with auto-detection from OS preference. Toggle via View menu > Theme (Auto/Light/Dark). 25 semantic CSS variables with light and dark palettes. All 15 modals, context menus, filter dropdowns, list/grid views, and sidebar themed.
- **Broken cover image handling** - Degenerate cover images (< 10px, failed loads) now show a styled placeholder with book title instead of broken image icons. Applies to cover grid, list view, and book detail modal.

### Improved
- **Filter dropdown UX** - Opening any filter dropdown now closes all siblings. Fixed stale closure bug preventing click-outside-to-close for More panel sub-dropdowns. Added hover feedback to Collections and Series checkbox items.
- **WCAG AA contrast** - Fixed 2 contrast ratio failures in dark mode (accent buttons, secondary text on elevated surfaces)
- **Themed dialogs** - All native alert/confirm dialogs replaced with styled custom dialogs (eliminates "localhost says" prefix)

### Fixed
- **Tags dropdown hover** - Fixed white flash on mouse leave in Tags filter dropdown items and Manage Tags link
- **Shadow typo** - Fixed `rgba(0,0,1,0.1)` → `rgba(0,0,0,0.1)` in date dropdown shadow

## [5.5.6] - 2026-02-15

### Improved
- **Backup restore UX** - Skip "replace organization" warning when system is empty (after reset or first-time users)

## [5.5.5] - 2026-02-15

### Added
- **Landing page link** - Logo and app name in the menu bar now link back to the landing page

## [5.5.4] - 2026-02-14

### Fixed
- **Drag-to-folder stuck clicks** - Dragging a book to a sidebar folder no longer leaves the right pane unclickable (source row unmount prevented dragEnd cleanup)
- **Within-folder reorder broken** - Removed pointer-events:none optimization that blocked reorder drop targets

### Improved
- **Drag performance with large libraries** - Drag virtualization hides off-screen book rows during drag, with a sliding window (100-row buffer, shifts 50 at a time) that follows scrolling. Reduces browser DOM overhead from 10K elements to ~300
- **Render cap** - Show first 200 items instantly with "Show all" button for the rest. Resets on navigation changes (sort/filter/folder switch)
- **CSS containment** - Paint isolation between left and right panes eliminates sidebar highlight lag during drag
- **Auto-expand guard** - Disabled auto-expand of collapsed folders during drag when Show All is active with many items

## [5.5.3] - 2026-02-13

### Added
- **Welcome state** for empty library - centered panel in right pane with two clear paths:
  - "Getting Started Guide" button for new users (opens landing page)
  - "Load Library File" button for returning users (opens file picker directly)
  - Disappears automatically when library is imported

## [5.5.2] - 2026-02-13

### Added
- **Getting Started link** in Help menu - opens landing page (readerwrangler.com) in new tab for users who need onboarding context

## [5.5.1] - 2026-02-13

### Improved
- **Tooltip audit** - Comprehensive tooltip coverage across the app
  - Added tooltips to all 7 toolbar filter buttons (Status, Tags, Types, More, Amazon Rating, My Rating, Series)
  - Added "Close" tooltip to all 11 modal close buttons
  - Added tooltips to search clear button and Add tag button
  - Improved cover size slider tooltip ("Cover size: X columns")
  - Improved clear rating tooltip ("Clear my rating")

## [5.5.0] - 2026-02-13

### Added
- **Sort picker dropdown** - Click "Sort: Author ▲ ▾" to open a dropdown with all sortable columns
  - Works in both cover view and list view
  - Click a column to sort by it; click current sort to toggle direction
  - Shift+click to add secondary sort (hint shown in dropdown footer)
  - "Manual Order" grayed out when viewing All Books
  - Dropdown caret (▾) signals clickability
- **Bug fix**: "My Rating" sort now displays correctly (was showing raw key name "myRating")

## [5.4.9] - 2026-02-12

### Added
- **Search history dropdown** - Search field remembers recent searches (up to 15)
  - Type to filter history, arrow keys to navigate, Enter to select
  - Per-entry remove (×) and "Clear history" option
  - Persists across sessions via localStorage
  - Terms under 3 characters are not recorded

## [5.4.8] - 2026-02-12

### Added
- **Ownership toggle** - Change book ownership between Purchased and Wishlist
  - Book dialog: Click pencil icon to edit, dropdown replaces the Wishlist Item badge
  - Bulk edit: Right-click → Edit ▶ Ownership... with Purchased/Wishlist toggle buttons
  - Changes protected from Amazon re-import overwrite via `userEdited` flags
  - Full undo/redo support

## [5.4.7] - 2026-02-12

### Added
- **Book dialog edit mode** - Click pencil icon in book dialog header to edit Title, Author, Series, Position, and Notes inline
  - ESC cancels edit mode without closing dialog; Enter saves when no field is focused
  - Series field uses combobox with dropdown of existing series (prefix filtering)
  - Layered ESC dismissal: series dropdown → series input → cancel edit mode
  - Undo/redo support for all edits
  - Replaces the standalone Edit Series modal and standalone note editing
- **Bulk edit via context menu** - Right-click selected books → Edit ▶ Author... / Series... / Position...
  - Each opens a focused modal with a single field
  - Pre-populates if all selected books share the same value; "Mixed (N values)" placeholder if different
  - Series uses combobox with dropdown (matching book dialog pattern)
  - Undo/redo support as single action per bulk edit
  - Works in both table and cover views
- **User edit protection on import** - Per-field `userEdited` flags track which fields the user has manually edited
  - Amazon re-imports preserve user-edited Title, Author, Series, and Position
  - Backup export/import preserves the flags for future Amazon imports
  - Backup restore uses its own values as-is (true snapshot restore)

### Removed
- Edit Series modal (replaced by inline editing in book dialog)
- Standalone note editing (+Add Note button, note pencil icon)

## [5.4.5] - 2026-02-11

### Added
- **Group toggle in Book Explorer** - Simple on/off toggle inserts collapsible divider rows between groups of books
  - Group key always mirrors the current sort column (sort by Author → groups by author, sort by Series → groups by series, etc.)
  - Dividers appear at value transitions in sort order — change the sort and dividers update automatically
  - Works in both table view (full-width header rows) and cover view (full-width section dividers)
  - Click chevron on any group header to collapse/expand that group
  - Expand All (▾) and Collapse All (▸) buttons in toolbar when grouping is active
  - Dates bucketed by month/year, ratings shown as "N Stars", all other columns use raw values
  - Hidden when sort is Manual Order (incompatible). Switching to Manual Order auto-disables grouping.
  - Collapsed groups reset when sort column changes (group names become invalid)
  - Group state persisted to localStorage; collapsed groups are session-only
  - Tooltip on Group button shows what it will group by (e.g., "Group by Author")

## [5.4.4] - 2026-02-11

### Fixed
- **My Library not selectable** - My Library in the left pane was unclickable due to `pointer-events-none` on inner spans with no onClick on the container div
- **My Library now accepts folder drops** - Dragging a folder onto My Library in the sidebar reparents it to the top level (book drops intentionally excluded)

## [5.4.3] - 2026-02-11

### Added
- **Drag book to subfolder in right pane** - Books can now be dragged onto subfolders in both table and cover views, with visual highlight feedback, duplicate detection, and undo support
- **Ctrl+drag to copy** - Hold Ctrl while dropping on a subfolder to copy instead of move

### Fixed
- **Cover view folder selection persists** - Clicking a book in cover view now clears folder selection ring (was already working in table view)

## [5.4.2] - 2026-02-11

### Added
- **ESC closes all dialogs** - Every dialog now responds to the Escape key with layered dismissal (innermost dialog closes first)

### Fixed
- **ESC blocked by focused text inputs** - Edit Series, Bulk Price Goal, and Folder Properties inputs no longer swallow the Escape key

## [5.4.1] - 2026-02-11

### Fixed
- **Add Tag dropdown not closing on click-away** - Clicking anywhere in the book dialog outside the tag dropdown now closes it
- **Stale Add Tag dropdown** - Opening a new book dialog no longer shows a pre-opened tag dropdown from the previous dialog
- **Dead state reference** - Removed `setModalColumnId` calls left over from Column App removal

## [5.4.0] - 2026-02-11

### Removed
- **Column App (V4) backend code** - Removed ~3,100 lines of orphaned Column App code that was superseded by Book Explorer (V5) in v5.0.2
  - Column CRUD operations, divider system, column drag-drop, column context menus
  - Column-specific undo/redo actions (MOVE_BOOKS, COPY_BOOKS, REORDER_BOOKS, DELETE_COLUMN, REORDER_COLUMNS, DELETE_DIVIDER, REORDER_DIVIDER)
  - Column persistence (save/load/export/restore)
  - Collect Series dialog, column selection system, spatial indexing
  - All related state variables, refs, and helper functions

### Improved
- **Footer selection display** now uses Explorer selection (was showing Column App selection which was always empty)
- **Data Status dialog** shows folder count instead of column/divider count
- **clearSelection()** now clears Explorer book selection

## [5.3.1] - 2026-02-10

### Improved
- **Double-click to rename tags** - Double-click a tag name in Tag Management to enter rename mode (in addition to Rename button)

## [5.3.0] - 2026-02-10

### Added
- **Manage Tags in filter dropdown** - "Manage Tags..." link at the bottom of the Tags filter dropdown (separated by divider) opens the Tag Management dialog

## [5.2.0] - 2026-02-10

### Added
- **Editable Series** - Edit series name and position from book detail modal
  - Combobox with dropdown for existing series names
  - Numeric position field with validation
  - "Remove from Series" clears fields without auto-save

### Fixed
- **Global keyboard handler leak** - DEL key in modal input fields no longer triggers book deletion or folder removal
  - Added `anyModalOpenRef` guard to both `handleKeyDown` and `handleKeyboard` window listeners
  - Added `isInputFocused` guard for DEL/arrow keys when any input/textarea has focus
  - Added `e.stopPropagation()` to 8 input fields missing protection
- **Backdrop swipe-close** - Dragging from inside a modal and releasing on the backdrop no longer closes the dialog
  - All 17 modal backdrops now require both mousedown and click on the backdrop to close
- **DEL key on Edit Series chevron** no longer triggers folder deletion
- Removed 69 verbose undo/redo debug console.log statements

## [5.1.0] - 2026-02-09

### Added
- **Auto-Organize Wizard** - Automated folder organization by author and series
  - Magic wand icon (🪄) in Folders header triggers wizard
  - Analyzes books in Inbox, groups by author with configurable minimum books threshold (1-20)
  - Detects and counts series from book metadata (series name and position)
  - Creates hierarchical folder structure: Author → Series → Books
  - **Series subfolder options:**
    - Create subfolders for each series (2+ books)
    - Sort books by series position (with dateAdded fallback)
    - Create "Miscellaneous" subfolder for standalone books
  - **Preview mode** - Visualize folder structure before organizing
    - Shows full hierarchy: Author folders → Series subfolders → Book counts
    - Summary counts: total folders, subfolders, books to be moved
    - "Organize Now" executes organization from preview
  - **Results summary dialog** - Shows what was created after organization
    - Displays: folders created, folders merged, subfolders created, books moved
  - **Smart selection controls:**
    - Sort authors by book count (default) or alphabetically
    - 3-segment selection: All / Some / None
    - Individual author checkboxes with book count and series count
  - **Bundled undo** - Single Ctrl+Z undoes entire organization operation
  - **Edge case handling:**
    - Empty Inbox detection with helpful message
    - No authors meeting threshold guidance
    - Automatic folder merging when author folders already exist
    - Invalid series position fallback to date sorting
  - **Help dialog** - Workflow tips and best practices
  - Moves organized books out of Inbox automatically
  - Options persist in localStorage across sessions

### Technical
- Phase 1 (alpha.8-19): Basic wizard with flat author folders
- Phase 2 (alpha.20-27): Series detection and subfolder creation
- Phase 3 (alpha.28-30): Preview mode, results dialog, edge case validation
- New state variables: wizardModalOpen, wizardAuthors, wizardSelectedAuthors, wizardPreviewMode, wizardResultsData, wizardSourceBooksCount
- New functions: groupBooksBySeries, calculateWizardPreview, executeWizardOrganize
- Undo system support: WIZARD_ORGANIZE action type with nested sub-actions
- Series grouping algorithm: case-insensitive normalization, position-based sorting
- Collapsed/Expand All controls moved from wizard to My Library header (UX improvement)

## [5.0.10] - 2026-02-06

### Added
- Emergency reset page (reset.html) for recovery when main app won't load
- Standalone reset functionality accessible when corrupted state blocks app initialization
- Clears all localStorage keys and IndexedDB to restore app to fresh state
- Browser-native confirm() dialog prevents accidental resets
- Success message with auto-redirect to main app after 3 seconds
- Link to reset page added to index.html footer (unintrusive, gray text)
- Clear recovery instructions explaining backup vs library file restoration paths

### Technical
- New file: reset.html - Standalone page with Tailwind CSS styling
- New file: reset.js - Reset logic (clears 7 localStorage keys + ReaderWranglerDB)
- Clears: readerwrangler-state, readerwrangler-enriched-cache, readerwrangler-settings, readerwrangler-status, readerwrangler-filters, readerwrangler-explorer, readerwrangler-folders
- IndexedDB deletion with blocked state handling (resolves when other tabs close)
- Recovery text distinguishes between importing backup (everything) vs amazon-library.json (books only)

## [5.0.9] - 2026-02-06

### Changed
- Redesigned backup restore dialog from EULA-like text to action-oriented guidance
- Dialog now appears AFTER restore completes (not before) with clear next steps
- Visual checkmarks (✓) for required actions, X marks (✗) for what NOT to do
- Three action buttons: "Why replace?" (help), "Save File", "Cancel"
- Help popup explains backup contents and dangers of skipping regeneration
- Download only triggered when user explicitly clicks "Save File"
- Updated help text: "prior data" instead of "old data" (chronologically accurate)
- Corrected help text: removed incorrect "organization will disappear" claim
- Organization description now includes "order" and "price goals" (aligns with app tagline)

### Added
- Created docs/design/BACKUP-RESTORE-FLOW.md with comprehensive data flow documentation
- Three Mermaid diagrams showing normal flow, restore flow, and account contamination danger
- Detailed explanation of storage architecture (IndexedDB vs localStorage separation)
- Account switching edge case documentation with step-by-step contamination scenario
- Added "Understanding the Codebase" section to CONTRIBUTING.md linking to architecture docs

### Technical
- New function: showBackupRestoredDialog(bookCount) returns Promise<boolean>
- Organization stored separately from book data (survives even if library file skipped)
- Danger of skipping regeneration: next fetch imports wrong books (account mixing), not data loss

## [5.0.8] - 2026-02-06

### Fixed
- Fixed folder reordering error messages in All Books and My Library for better clarity
- Enabled Manual Order mode in My Library to allow folder reordering (was incorrectly disabled, preventing folder organization)
- Fixed Reset App error "setViewMode is not defined" (removed orphaned v4 code reference)

## [5.0.7] - 2026-02-05

### Fixed
- Fixed backup import error "setWishlistFilter is not defined"
- Removed 3 remaining setWishlistFilter() calls missed in v5.0.5 cleanup
- Affects: Reset All Data, Import Backup, and Clear Filters button

## [5.0.6] - 2026-02-05

### Fixed
- Restored hidden book visual styling (lost in v5.0.0 refactoring)
- Hidden books now display with 40% opacity + centered 🚫 emoji overlay
- Works in both List view (text-2xl emoji on thumbnail) and Cover view (text-8xl emoji on full cover)
- Dual-format compatibility checks both hiddenInstances (current) and book.isHidden (legacy)

## [5.0.5] - 2026-02-05

### Changed
- Removed unused wishlistFilter code (internal cleanup)
- Removed 23 references and ~24 lines of dead code
- No behavioral changes expected - wishlistFilter UI was removed in v5.0.0, state variable never set by users

## [5.0.4] - 2026-02-05

### Added
- Added Wishlist option to Source filter dropdown (appears first in list)

### Fixed
- Fixed missing filter for wishlist books (lost in v5.0.0 menu/toolbar redesign)
- Backward compatible filtering checks both onWishlist flag and ownershipType for legacy data
- Updated DATA-SCHEMA.md to document wishlist as valid ownershipType

## [5.0.3] - 2026-02-05

### Fixed
- Fixed column overlay bug where null column widths became "nullpx" in CSS
- Enhanced column width handling to be future-proof for new columns added in future versions
- Ensured consistent sanitization pattern across load, save, export, and restore operations

## [5.0.2] - 2026-02-05

### Fixed
- Fixed production app loading v4 Column App due to localStorage persistence
- Removed viewMode entirely - app now always renders Book Explorer mode
- Deleted all v4 Column App code (~470 lines removed)
- Cleaned up viewMode references from localStorage, backup/restore, and keyboard shortcuts

## [5.0.1] - 2026-02-05

### Fixed
- Fixed app defaulting to deprecated v4 Column App on startup
- Removed migration prompt that appeared when loading production instance
- App now always starts in v5 Explorer mode
- v4 Column App code still present but inactive (full removal planned for v5.1.0)

## [5.0.0] - 2026-02-05

### Major Release: Book Explorer

**v4 → v5 Paradigm Shift:** Horizontal Columns → Windows File Explorer

ReaderWrangler v5 replaces the flat horizontal column interface with a familiar two-pane Book Explorer: folder tree (left) + content view (right). Organize your library using the same patterns you use for files on your desktop.

#### Book Explorer Features

**Folder Management:**
- Create unlimited nested folder hierarchies (Category > Author > Series)
- Right-click context menus for folders (7 operations) and books (9 operations)
- Cut/Copy/Paste with keyboard shortcuts (Ctrl+X/C/V)
- Drag-drop books and folders to organize
- Special folders: "All Books" (library-wide view), "Inbox" (new imports)
- Undo/Redo support (Ctrl+Z/Y) for all operations
- Folder properties show book counts (direct + recursive)

**List View:**
- Sortable columns: Title, Author, Rating, Series, Series #, Date Added, Pages, and more
- Multi-column sorting: Shift+Click to add secondary/tertiary sort levels (e.g., Series ▲ → # ▲)
- Column chooser: Show/hide columns, drag to reorder
- Manual sort mode for custom book ordering within folders

**Cover View:**
- Grid layout with book covers
- Same selection and organization capabilities as list view
- Toggle between List/Cover views per folder or globally

**Migration:**
- Automatic migration from v4 Columns interface
- Columns become root-level folders
- Dividers become subfolders
- All organization and book data preserved

#### Menu Bar + Toolbar (Chrome Redesign)

After implementing Book Explorer, we redesigned the header chrome to better fit the new paradigm:

**Space-Efficient Interface:**
- Menu bar (32px): File/View/Help menus with About, Keyboard Shortcuts, and How To Use dialogs
- Compact toolbar (36px): Search + integrated filters
- **68px total chrome** (down from ~100px in v4) = **32% more screen space** for books
- Removed: Hero banner, old expandable filter panel

**Advanced Filtering:**
- **Tier 1 (Toolbar):** Read Status, Tags, Source (Purchased/KU/Prime/etc.)
- **Tier 2 (More Panel):** Collections, Amazon Rating, My Rating, Series, Date ranges
- Active filter status banner with "Clear All" button
- All filters persist across sessions

**Personal Rating System:**
- Rate books 0-5 stars based on your personal opinion (separate from Amazon ratings)
- Star picker in book details dialog (blue stars vs. yellow Amazon stars)
- "My Rating" column in list view (optional, hideable)
- Sort by personal rating
- Ratings preserved in backup/restore

**Tag Management:**
- Enhanced tag system with color coding
- Computed tag counts (always accurate)
- Tag Manager dialog for organizing tags

**View Controls:**
- List/Grid view toggle in toolbar
- "Show Hidden" and "Deals" toggles with visual badges
- View menu sync (toolbar ↔ menu bar)

#### Technical

- All user metadata preserved in backup/restore (tags, notes, price triggers, ratings)
- localStorage and IndexedDB persistence
- Full keyboard shortcut support maintained
- Data migration automatic and seamless

#### Upgrade Notes

Users upgrading from v4:
- Library automatically migrates on first load (Columns → Folders)
- All books, organization, and metadata preserved
- Backup recommended before upgrade (File → Export Backup)

---

For detailed implementation history, see:
- [BOOK-EXPLORER-SESSION-LOG.md](docs/design/BOOK-EXPLORER-SESSION-LOG.md) - Folder tree implementation
- [MENUBAR-TOOLBAR-IMPLEMENTATION.md](docs/design/MENUBAR-TOOLBAR-IMPLEMENTATION.md) - Chrome redesign

## [5.0.0-alpha.174.4] - 2026-02-03

### Added
- **Book Explorer (Phase 1 Complete)** - Windows File Explorer paradigm for organizing 2500+ books
  - Folder tree sidebar with unlimited nesting depth
  - Nested folder creation via drag-and-drop
  - List view with multi-level sortable columns (shift-click for secondary sort)
  - Drag-and-drop books and folders with visual feedback
  - Breadcrumb navigation with clickable folder links
  - Context menus for books and folders (right-click)
  - Folder tooltips show full path and book count
  - Migration from Column Organizer: columns → folders, dividers → subfolders
  - Manual sort mode preserves user-defined order
  - Inbox folder for new/unsorted books
  - All Books view for library-wide operations
  - Ctrl+A select all within current folder
  - Multi-book operations: hide, move, copy, delete
  - Session log: [BOOK-EXPLORER-SESSION-LOG.md](docs/design/BOOK-EXPLORER-SESSION-LOG.md)
  - Replaces: Column Organizer, Column Carousel, Desktop & Folders designs
  - **Impact**: Scalable organization for large libraries using familiar desktop paradigm

## [4.27.0] - 2026-01-25

### Added
- **Tags** - Add tags to books and dividers for cross-library thematic organization
  - File versions: readerwrangler.js v4.27.0
  - **Explicit tags**: Assigned directly to books, persist when moved
  - **Inherited tags**: Books under tagged dividers inherit those tags positionally
  - Tag filter in filter panel (OR logic - matches any selected tag)
  - Visual distinction: explicit tags (bold blue), inherited (faded gray)
  - Autocomplete with existing tags, Enter key selects top match
  - Right-click divider → Edit Tags, Add Tags to All Books
  - Manage Tags modal: rename, delete, orphan cleanup
  - Tags persist in IndexedDB and JSON export

## [4.26.1] - 2026-01-24

### Fixed
- **Mobile URL format detection** - Navigator bookmarklet now recognizes Amazon mobile web URLs
  - File versions: bookmarklet-nav-hub.js v1.4.1
  - Added support for `/gp/aw/d/` URL pattern (mobile web product pages)
  - "Add to Wishlist" now works on links from Amazon mobile site

## [4.26.0] - 2026-01-24

### Improved
- **Show Hidden always visible** - "Show Hidden" checkbox now visible even when filter panel is collapsed
  - File versions: readerwrangler.js v4.22.0
  - Shows "Showing: X of Y" count alongside checkbox in collapsed state
  - No longer need to expand filters just to toggle hidden book visibility

## [4.25.1] - 2026-01-24

### Fixed
- **Ctrl+C/A/X in inputs and modals** - Keyboard shortcuts now work properly in input fields and modals
  - File versions: readerwrangler.js v4.21.1
  - Ctrl+C copies selected text when text is selected (was copying books instead)
  - Ctrl+A/C/X work in input fields and textareas (note editor, price goal, etc.)
  - Ctrl+A disabled when modal open to prevent selecting entire page

## [4.25.0] - 2026-01-24

### Added
- **Book Notes** - Add personal notes to any book in your library
  - File versions: readerwrangler.js v4.21.0, readerwrangler.css (new styles)
  - Double-click book → click "Add Note" → type note → Save
  - Notes display as sticky notes with yellow background and thumbtack
  - Right-click single book → "Add Note" or "Edit Note"
  - Notes persist in IndexedDB and are included in JSON export

### Changed
- **Undo/Redo disabled when modal open** - Prevents confusing undo of invisible actions

## [4.24.3] - 2026-01-24

### Fixed
- **Wishlist duplicate detection** - Wishlist fetcher now checks if book already exists before adding
  - File versions: amazon-wishlist-fetcher.js v1.4.2
  - Previously added duplicates to JSON file (App Loader deduplicated on load, but file grew)
  - Now shows "already in your library" warning if ASIN already exists

## [4.24.2] - 2026-01-24

### Fixed
- **Fetcher save errors** - Fixed same user gesture error in 3 additional fetchers
  - File versions: amazon-wishlist-fetcher.js v1.4.1, series-page-fetcher.js v1.1.1, author-bibliography-fetcher.js v1.0.1
  - Same fix as v4.24.1 applied to wishlist, series page, and author bibliography fetchers

## [4.24.1] - 2026-01-24

### Fixed
- **Library Fetcher save error** - Fixed "User activation is required" error when saving after long fetch
  - File versions: amazon-library-fetcher.js v4.8.1
  - Chrome requires fresh user gesture for file writes; original gesture expires during fetch
  - Now shows "Save Library File" button after fetch completes to provide fresh gesture
  - Prevents data loss when user navigates away during fetch

## [4.24.0] - 2026-01-24

### Added
- **Bulk Set Price Goal** - Set price goals for multiple books at once via context menu
  - File versions: readerwrangler.js v4.20.0
  - Right-click selected books → "Set Price Goal" → choose preset ($0.99-$4.99), Custom, or Clear
  - Custom option opens modal for entering any price
  - Toast feedback confirms action: "Price goal set to $X.XX for N books"
  - Clear button in single-book modal now styled consistently with presets

## [4.19.1] - 2026-01-23

### Fixed
- **Divider selection** - Fixed selection of dividers and books under dividers
  - File versions: readerwrangler.js v4.19.1
  - Clicking a divider now properly selects the divider and all books under it (visual highlight + operations work)
  - Shift+click after selecting a divider now works for range selection
  - Shift+click range selection now includes dividers in the range
  - Ctrl+A now selects all items in column including dividers
  - Root cause: v4.16.0 changed to composite keys for book selection but `selectDividerGroup` was not updated

## [4.23.0] - 2026-01-23

### Added
- **Author Bibliography Import** - One-click import of all Kindle books by an author to wishlist
  - File versions: author-bibliography-fetcher.js v1.0.0, bookmarklet-nav-hub.js v1.4.0
  - Navigate to any Amazon author "All Books" page and click "Add Bibliography to Wishlist"
  - Auto-loads all books (clicks "Show More" until complete)
  - Extracts covers, prices, ratings from page DOM
  - Skips books you already own or have on wishlist
  - Data completeness summary shows cover/price/rating stats
  - **Tip**: Set page filters to "English" and "Kindle" before importing for best results
  - Filters out Amazon navigation/footer items that could be mistakenly captured

## [4.22.0] - 2026-01-23

### Fixed
- **Wishlist price parsing** - Price data now loads correctly from JSON files
  - File versions: readerwrangler.js v4.19.0, amazon-wishlist-fetcher.js v1.4.0, series-page-fetcher.js v1.1.0
  - Fixed: Loader crashed with "toFixed is not a function" when price was string like "$5.99"
  - Added `parsePrice()` helper to convert string prices to numbers during load
  - Wishlist fetchers now capture price and description from Amazon product pages
  - Series fetcher improved price extraction with `.ebook-price-value` selector
  - Data completeness summary shows which books are missing price data

## [4.21.0] - 2026-01-22

### Added
- **Series Page Bulk Import** - One-click import of entire book series to wishlist
  - File versions: series-page-fetcher.js v1.0.0, bookmarklet-nav-hub.js v1.3.0
  - Uses Amazon's seriesAsinList API to fetch all books (up to 200) in a single request
  - Automatically skips books you already own
  - Gap detection reports missing books in series numbering (e.g., "49 books missing: #101-149")
  - Navigator automatically loads series fetcher when on a series page

## [4.20.1] - 2026-01-22

### Fixed
- **Navigator duplicate modal bug** - Clicking bookmarklet multiple times no longer opens stacked modals
  - File version: bookmarklet-nav-hub.js v1.2.3
  - Added dialog ID check to prevent duplicate creation on slow machines

## [4.20.0] - 2026-01-21

### Fixed
- **Wishlist preservation bug** - Wishlist books now display immediately after library import
  - File versions: readerwrangler.js v4.18.0, fetchers v4.8.0/v2.1.2/v1.3.0
  - Fixed: Legacy `isWishlist` field not normalized during orphan detection
  - Fixed: UI state not updated with merged books (required page refresh)

### Changed
- **Schema v2.1** - Updated schema version for new data model
  - All fetchers now output schema v2.1
  - Loaders accept any `2.x` version (forward compatible)

## [4.19.0] - 2026-01-20

### Added
- **Wishlist Persistence** - Wishlist books are preserved when importing fresh library data
  - File versions: readerwrangler.js v4.18.0, amazon-library-fetcher.js v4.8.0, amazon-wishlist-fetcher.js v1.3.0
  - Import merges new library with existing wishlist items (no more data loss)
  - Wishlist books get enriched (descriptions, reviews) during library fetch
  - Export/backup includes all metadata: price goals, genres, price data

### Changed
- **Data model cleanup** - Unified ownership flags for cleaner code
  - `onWishlist` + `ownershipType` replace legacy `isOwned`/`isWishlist` fields
  - Legacy formats auto-converted on import (6-month deprecation: 2026-07-20)
  - Diagnostic `booksWithoutDescriptionsDetails` moved from JSON to console-only

## [4.18.0] - 2026-01-19

### Changed
- **Terminology update** - "Import" renamed to "Download" across all components
  - File versions: bookmarklet-nav-hub.js v1.2.2, amazon-library-fetcher.js v4.7.1, amazon-collections-fetcher.js v2.1.2, install-bookmarklet.html v1.0.7
  - Clearer language: users download data from Amazon, not import it
- **Installer page logo** - Added ReaderWrangler logo to install-bookmarklet.html header

## [4.17.0] - 2026-01-19

### Added
- **Wishlist Price Display** - Set price goals and find deals on wishlist books
  - File version: readerwrangler.js v4.17.0
  - Price tag badge on wishlist book covers (gray normally, green when at/below goal)
  - Set price goals with preset buttons ($0.99-$4.99) or custom amount
  - "Deals (n)" filter button shows only books at or below your target price
  - Current price and savings displayed in book detail modal
  - "View on Amazon" button turns green with price when book is at goal

### Changed
- **Icons updated to new lasso logo** - All favicons, social cards, and touch icons now use lasso-around-book design
  - og-image.png (1200x630 social card with text)
  - favicon.ico, apple-touch-icon.png, ReaderWrangler180.png, ReaderWrangler192.png
  - Deleted obsolete files: og-image.pptx, favicon-full-size.png, favicon.png, favicon.svg
- **Dev tasks script** - Renamed `update-timestamp.py` to `dev-tasks.py` with backup sync feature
  - File version: dev-tasks.py v1.1.0
  - Optional backup sync to cloud folder (Dropbox, Google Drive, etc.)
  - Directory sync feature for backing up folders (e.g., .private/)
  - Configure via `dev-tasks.cfg` (see `dev-tasks.cfg.example`)
  - Auto-cleans old backups in sync folder

## [4.16.1] - 2026-01-18

### Changed
- Documentation cleanup and reorganization

## [4.16.0] - 2026-01-17

### Added
- **Cut/Copy/Paste for books (Ctrl+X/C/V)** - Flexible book organization with clipboard operations (0-E)
  - File version: readerwrangler.js v4.16.0
  - Ctrl+X cuts selected books (50% opacity + dashed border visual)
  - Ctrl+C copies selected books (normal opacity + dashed border visual)
  - Ctrl+V pastes at selected position or top of column
  - Escape cancels clipboard operation
  - Works with multi-select (Ctrl+Click, Shift+Click, Ctrl+A)
  - Footer shows clipboard status: "2 books cut - click destination and Ctrl+V"
  - Toast notification appears above pasted books

- **Book copies** - Same book can appear in multiple columns
  - Ctrl+C creates copies (new instances with unique GUIDs)
  - Ctrl+Drag copies books instead of moving them
  - Book count shows unique books + copies: "2344 (+1 copy) books"
  - Per-instance hidden state (hide one copy without hiding others)
  - Last-copy protection warns before deleting the only visible copy

- **Delete key** - DEL key removes selected books with last-copy protection
  - Also available via right-click context menu

- **Enhanced context menu** - Submenus for Move/Copy operations
  - Move to → submenu lists all columns
  - Copy to → submenu lists all columns
  - Cut/Copy/Paste options with keyboard shortcuts shown
  - Delete option with last-copy protection

### Fixed
- Undo/Redo works correctly with GUID-based book entries
- Columns with only hidden books hide when "Show Hidden" is off
- Empty columns remain visible when filters are active

## [4.15.8] - 2026-01-13

### Changed
- **Mobile-friendly landing page** - Hero section now scrolls on mobile devices (0-H)
  - File version: index.html v1.2.3
  - Portrait: Hero no longer sticky, replaced Get Started with mobile sync instructions
  - Landscape: Logo and sticky note repositioned relative to center content
  - Comparison slider scales to full width on mobile
  - Updated Recent Features with v4.14.0 Cover Image Caching

## [4.15.7] - 2026-01-13

### Fixed
- **Backup filename uses local time** - Fix UTC date bug showing wrong date after 6pm
  - File version: readerwrangler.js v4.15.7
  - Filename now includes time: `readerwrangler-backup-2026-01-13 10.51.json`
  - Allows multiple backups per day without OS renaming

## [4.15.6] - 2026-01-13

### Changed
- **Simplified date range filter** - Compact preset dropdown replaces two date pickers (0-I)
  - File version: readerwrangler.js v4.15.6
  - Preset dropdown with options: All Dates, Last 30 Days, Last 90 Days, Last 12 Months, dynamic years (YYYY, YYYY-1, YYYY-2), Custom
  - "Custom" option expands inline date pickers for manual date range selection
  - Active Filters banner shows friendly preset names
  - Filter state persists across page refresh, migrates from old dateFrom/dateTo format

## [4.15.5] - 2026-01-12

### Changed
- **Compact inline filter bar** - Saves vertical space with reorganized filter layout (0-G)
  - File version: readerwrangler.js v4.15.5
  - Three-state toggle button: Filters → More Filters → Hide
  - Primary filters (Search, Status, Collection) display inline with toggle button
  - Advanced filters (Rating, Series, Wishlist, Type, Dates) shown on second row
  - HTML table layout for natural column alignment
  - Graceful proportional shrinking on narrower viewports

## [4.15.4] - 2026-01-12

### Changed
- **Search filter includes column/divider names** - Find columns and dividers by name (0-F)
  - File version: readerwrangler.js v4.15.4
  - Title/Author search now also matches column names and divider labels
  - Column appears if its name matches search term (even with no matching books)
  - Divider appears if its label matches search term (even with no books under it)
  - Column appears if any of its divider labels match search term

## [4.15.3] - 2026-01-12

### Changed
- **Hide empty columns/dividers when filtering** - Focused view of filtered results (0-D)
  - File version: readerwrangler.js v4.15.3
  - When any filter is active, columns with no matching books are hidden
  - Dividers with no matching books under them are hidden
  - All columns/dividers reappear when filters are cleared
  - Status bar "Showing X of Y" provides context for hidden content

## [4.15.2] - 2026-01-12

### Fixed
- **Column count excludes dividers** - Fix misleading count in column headers (0-C)
  - File version: readerwrangler.js v4.15.2
  - Column header count now shows only books, not dividers
  - Filtered count also excludes dividers
  - Matches status bar behavior which already excluded dividers

## [4.15.1] - 2026-01-12

### Fixed
- **Collections Fetcher save button** - Fix SecurityError on file save (0-B)
  - File version: amazon-collections-fetcher.js v2.1.0
  - Chrome requires fresh user gesture for `createWritable()` after long operations
  - Added save button before file write to provide fresh user gesture
  - Same fix previously applied to Library Fetcher in v4.6.0

- **Data Status shows correct state when Collections empty** - Fix misleading status (0-A)
  - File version: readerwrangler.js v4.15.1
  - Export backup no longer creates fake collections section when no collections data exists
  - Import correctly resets collections status when file has no collections
  - "Not loaded" text now displays in red for visibility
  - Fetched date shows orange (stale) or red (empty/obsolete) based on status

## [4.15.0] - 2026-01-11

### Changed
- **Responsive Filter Panel** - Redesigned filter panel for better space efficiency
  - File version: readerwrangler.js v4.15.0
  - Primary/Advanced filter split: Search, Read Status, Collection always visible
  - Advanced filters (Rating, Series, Wishlist, Ownership, Date) collapsed by default
  - "More Filters" toggle with active filter count indicator
  - Inline icons (left of fields) instead of labels above
  - Max-width constraints prevent field stretching on ultrawide monitors
  - ~50% vertical space savings when collapsed vs previous design

## [4.14.0] - 2026-01-11

### Added
- **Cover Image Caching** - Local browser cache for book cover images
  - File version: readerwrangler.js v4.13.0
  - Cache API stores covers locally for instant loading on subsequent visits
  - First load: ~82s to cache ~2,300 images (parallel fetching with 20 concurrent requests)
  - Subsequent loads: ~3.5s from cache vs ~4s from network (~65% faster for filter/refresh)
  - Background caching: non-blocking - UI renders immediately while images cache
  - Completes Phase 2 of Cover Image Caching (Phase 1 was fetcher changes in v4.6.0.a)

## [4.13.0] - 2026-01-10

### Added
- **Insert Column Before/After** - New options in column dropdown menu
  - File version: readerwrangler.js v4.12.0
  - Create new columns adjacent to any existing column
  - New column enters edit mode immediately for naming

### Removed
- **Floating Add Column button** - Replaced by Insert Column menu options
  - Better UX: new column appears where you need it, not at far right
- **Version badge from README** - Single source of truth now in app

## [4.12.1] - 2026-01-09

### Fixed
- **Column drag no longer selects text** - Added preventDefault() to column drag handler
  - File version: readerwrangler.js v4.11.1

## [4.11.0] - 2026-01-09

### Added
- **Always-visible horizontal scrollbar** for columns container
  - File versions: readerwrangler.js v4.10.0, readerwrangler.css v4.6.0, readerwrangler.html v4.6.0
  - Styled scrollbar using standard CSS properties (Chrome 121+, Firefox, Safari)
  - Scrollbar visible when columns exceed viewport width

## [4.10.1] - 2026-01-08

### Fixed
- **Clear All Filters** now clears ownership filter (was missing from v4.9.0)
  - File version: readerwrangler.js v4.9.1

## [4.10.0] - 2026-01-07

### Added
- **Unknown Ownership Type Telemetry** - Automatic discovery of new ownership types
  - File version: amazon-library-fetcher.js v4.5.0
  - Sends GoatCounter event for each unique unknown ownership type encountered
  - Helps identify new Amazon ownership types (Rentals, Loans, etc.) without manual bug reports
  - Only fires for truly unknown types - known types (purchased, sample, borrowed, prime, kindleUnlimited, koll, comixology) are not tracked

## [4.9.0] - 2026-01-07

### Added
- **Ownership Type Badges** - Visual badges on book covers for non-purchased books
  - File versions: amazon-library-fetcher.js v4.4.0, readerwrangler.js v4.9.0
  - Badge types: Sample (amber), Borrowed (teal), Prime/KU/KOLL/Comixology (purple)
  - Positioned in bottom-left corner of book covers
  - Only displayed for non-purchased books (purchased books show no badge)
  - See [docs/design/BADGES.md](docs/design/BADGES.md) for full specification

- **Ownership Type Filter** - Filter library by how books were acquired
  - New dropdown in filter panel with options: All, Purchased, Sample, Borrowed, Prime, Kindle Unlimited, KOLL, Comixology
  - Integrates with Active Filters banner and Clear All functionality
  - Filter state persists to localStorage

- **Fetcher Ownership Extraction** - Library fetcher now extracts ownership type from Amazon API
  - Extracts `relationshipSubType` field from Amazon's API response
  - Maps to internal types: purchased, sample, borrowed, prime, kindleUnlimited, koll, comixology, unknown
  - Shows ownership type summary at end of fetch with counts per type
  - Includes bug report template for unknown ownership types

### Changed
- **Filter Panel Reorganization** - Filters now grouped by mental model for better UX
  - Row 1 (Discovery): Search, Read Status, Rating - "What book am I looking for?"
  - Row 2 (Organization): Collection, Series, Wishlist - "How is it organized?"
  - Row 3 (Acquisition): Ownership - "How did I get it?"
  - Rating moved from row 2 to row 1 for logical grouping

### Design Documentation
- Updated [docs/design/BADGES.md](docs/design/BADGES.md) with ownership badge specification
- Created [docs/design/ORPHAN-DETECTION-RECYCLE-BIN.md](docs/design/ORPHAN-DETECTION-RECYCLE-BIN.md) design doc for future feature

## [4.8.0] - 2026-01-06

### Added
- **Undo/Redo Support** - Ctrl+Z to undo, Ctrl+Y or Ctrl+Shift+Z to redo
  - File versions: readerwrangler.js v4.8.0
  - Undoable actions: book moves, reordering, hide/unhide toggle, column delete/reorder, divider delete/reorder
  - 50-action undo history stack with full redo support
  - Uses Command Pattern with useRef to avoid React stale closure issues in keyboard handlers

### Changed
- **Show Hidden Default** - "Show Hidden" filter now defaults to enabled on Reset App and library load
  - Ensures users see all books after reset/load operations

## [4.7.0] - 2026-01-04

### Added
- **Publication Date Support** - Books now include publication dates for better organization
  - File versions: amazon-library-fetcher.js v4.3.0, readerwrangler.js v4.7.0
  - Extracted from Amazon's `overview.sectionGroups` API field
  - Displayed in book details modal alongside acquisition date
  - New "Sort by Published" option in column sort dropdown (oldest/newest)
  - "Sort by Date" renamed to "Sort by Acquired" for clarity
  - Backwards-compatible: warns if sorting by publication date with old data

### Changed
- **Fetcher Save UX Redesign** - Improved file save experience after long fetches
  - File versions: amazon-library-fetcher.js v4.3.0
  - "Save Library File" button appears after fetch (required for browser security)
  - Cancel button with tooltip allows discarding fetched data
  - Timing summary now prints before save dialog (visible even if cancelled)
  - Debug logging removed from production output

### Fixed
- Pass 3 (Merge) timing was showing incorrect/negative values
- Save dialog "X" button incorrectly showed "FILE SAVED" message

## [4.6.0] - 2026-01-04

### Added
- **Analytics Instrumentation** - Privacy-friendly usage tracking via GoatCounter events
  - File versions: readerwrangler.js v4.6.0, amazon-library-fetcher.js v4.1.0, amazon-wishlist-fetcher.js v1.2.0
  - Tracks 10 events: fetcher completions, file import/export, app reset, book drag, column/divider creation
  - GoatCounter deduplicates by session/day (1 count per user per day)
  - No personal data collected; enables data-driven feature prioritization

### Fixed
- Stale "Manifest updated" log message in library fetcher (manifest was removed in previous version)

## [4.5.0] - 2026-01-02

### Added
- **New Logo** - ReaderWrangler brand icon added to app header and landing page hero
  - File versions: readerwrangler.js v4.5.0, index.html v1.2.0, readerwrangler.html v4.5.0
  - Transparent icon file for flexible placement
  - Icon positioned on left of landing page hero, sticky note on right

### Changed
- **Blue Color Palette** - Replaced indigo/purple scheme with fresh blue theme
  - File versions: readerwrangler.js v4.5.0, readerwrangler.css v4.5.0, index.html v1.2.0
  - Updated CSS variables (--color-primary, --gradient-hero, etc.)
  - All Tailwind indigo-* classes replaced with blue-* equivalents
- **Favicon Updates** - New logo files for browser tabs and bookmarks
  - favicon.ico, ReaderWranglerWordless16.png, ReaderWranglerWordless32.png, ReaderWrangler180.png

## [4.4.0] - 2026-01-02

### Added
- **Amazon Affiliate Links** - All "Open in Amazon" links now include affiliate tracking
  - File versions: readerwrangler.js v4.4.0, index.html v1.1.0
  - Supports ReaderWrangler development at no cost to users
  - FTC/Amazon-compliant disclosures added to app footer, Help modal, and landing page
  - Tooltip on wishlist "View on Amazon" button indicates affiliate link

### Changed
- **"Group Series Books" button** - Renamed from "Collect Series Books" to avoid confusion with wishlist/purchase actions and Amazon Collections terminology

## [4.3.0] - 2026-01-02

### Changed
- **Style Guide Applied** - Consistent indigo/purple color scheme across app and landing page
  - File versions: readerwrangler.js v4.3.0, readerwrangler.css v3.9.0, index.html v1.1.0
  - Replaced blue-* Tailwind classes with indigo-* throughout app
  - CSS variables added for theming (--color-primary, --gradient-hero, etc.)
  - Landing page hero gradient matches app styling

### Added
- **Header UX Improvements**
  - Version number displayed in header next to title (muted styling)
  - Book count moved from header to filters row for better information hierarchy
  - Browser tab title simplified (removed version number)
  - Landing page tab title shortened for better visibility in narrow tabs

## [4.2.0] - 2026-01-01

### Changed
- **Title Bar UX Redesign** - Better visual grouping and intuitive layout
  - File version: readerwrangler.js v4.2.0
  - Data Status indicator moved next to Import/Export/Reset buttons
  - Add Column button now floats with columns (scrolls horizontally with them)
  - New branding: Libre Baskerville font for title, "Your books, your order" tagline
  - Added "A product of Alloid Labs™" attribution
  - Title tooltip shows "Wrangle your reader chaos"
- **License** - Updated from MIT to MIT License with Commons Clause
  - Free for personal use, source available for learning
  - No commercial forks or competing products
  - Updated LICENSE and README.md with new terms and trademark notice

### Added
- **Analytics** - Added GoatCounter privacy-focused analytics to index.html and readerwrangler.html
  - No cookies, no personal data, no cross-site tracking
  - Basic traffic statistics only (page views, referrers)
- **Security** - Added security.html and .well-known/security.txt for responsible disclosure

## [4.1.0] - 2025-12-30

### Added
- **Wishlist Feature** - Track books you want to purchase
  - File versions: amazon-wishlist-fetcher.js v1.1.0, bookmarklet-nav-hub.js v1.2.0, readerwrangler.js v4.1.0
  - **Wishlist Fetcher v1.1.0:**
    - Add books from Amazon product pages (single book) or series pages (batch)
    - DOM scraping for book metadata (ASIN, title, author, cover, rating, series)
    - Series mode: Click "Show All" to load full series, skips books you already own
    - Merges into existing `amazon-library.json` file
    - Progress UI with abort capability
  - **Navigator v1.2.0:**
    - Context-aware "Add to Wishlist" button (detects product vs series pages)
    - Dynamic button text: "Add Book" / "Add Series" / "Add Book/Series"
    - Tooltips on all Navigator buttons
  - **App v4.1.0:**
    - Wishlist books display with 40% opacity gray-out effect
    - "Wishlist Item" indicator in detail modal
    - App Loader handles `isOwned` field (owned books override wishlist on re-fetch)
    - Import/Export preserves wishlist fields (`isOwned`, `addedToWishlist`)

- **Hide Feature** - Soft-delete books you don't want to see
  - Right-click context menu: "Hide Book" / "Unhide Book"
  - "Show Hidden" checkbox next to result count (not affected by Clear Filters)
  - Hidden books display with 40% opacity + large 🚫 overlay
  - Persists `isHidden` to IndexedDB
  - Applies to both owned and wishlist books

- **Context Menu Enhancements** - New right-click options
  - "Open in Amazon" - Opens selected books' Amazon pages (confirm if >3, error if >10)
  - "Copy Title(s)" - Copies all selected book titles to clipboard

### Fixed
- **Context Menu Positioning** - Menu now flips up/left when near viewport edges
- **Book Count Display** - Fixed count to exclude dividers (was showing filtered > total)

### Design Documentation
- Created comprehensive [docs/design/WISHLIST-FEATURE.md](docs/design/WISHLIST-FEATURE.md) design specification
  - Documents all 6 implementation phases
  - Schema changes, Navigator changes, App Loader logic
  - DOM scraping selectors for Amazon product/series pages

## [4.0.1] - 2025-12-28

### Fixed
- **Ctrl+A now respects active filters** - Previously selected ALL books in column, now correctly selects only visible/filtered books
  - File version: readerwrangler.js v4.0.1
  - Used ref pattern to ensure Ctrl+A handler always uses current filter state
  - Also excludes dividers from selection (only selects actual books)
  - Consistent with Shift+Click range selection behavior

## [4.0.0] - 2025-12-25

### Changed
- **BREAKING: Schema v2.0 Unified File Format** - Single file replaces separate library + collections files
  - File versions: readerwrangler.js v4.0.0, amazon-library-fetcher.js v4.0.0, amazon-collections-fetcher.js v2.0.0
  - **Unified File Structure:**
    - Single `amazon-library.json` contains books, collections, and organization data
    - Format: `{ schemaVersion: "2.0", books: {...}, collections: {...}, organization: {...} }`
    - `amazon-collections.json` is now obsolete
  - **Library Fetcher v4.0.0:**
    - Outputs Schema v2.0 format with `books.items` array
    - Preserves existing collections section when updating
    - Delta reporting: Shows count of new books found
    - Skips save if library is already up-to-date (0 new books)
    - Rejects backup files (`isBackup === true`)
    - File System Access API for same-file overwrite (Chrome/Edge)
    - Fallback download for Firefox/Safari with warning
  - **Collections Fetcher v2.0.0:**
    - Reads/writes unified file format
    - Merges into existing file, preserves books + organization sections
    - Rejects backup files
    - File System Access API for same-file overwrite (Chrome/Edge)
  - **App v4.0.0:**
    - Reads Schema v2.0 format (`books.items`, `collections.items`)
    - Backup/library file distinction via `isBackup` flag
    - Export creates backup with `isBackup: true` and filename `readerwrangler-backup-{date}.json`
    - Import behavior: Backup = full replace with confirmation; Library = merge books, keep organization
    - New books automatically added to Unorganized column after library import
    - Buttons renamed: Backup→Export, Restore→Import
    - Tooltips added to Import, Export, Add Column buttons
  - **Bug Fixes:**
    - Data Status modal crash fixed (dividers stored as objects, not string IDs)
    - Orphaned books after library import now correctly added to Unorganized
  - **Design Document:** See [docs/design/SCHEMA-V2-UNIFIED-FILE.md](docs/design/SCHEMA-V2-UNIFIED-FILE.md)

## [3.14.0] - 2025-12-23

### Added
- **Dividers as Drop Targets** - Complete drag-drop system overhaul
  - File version: readerwrangler.js v3.14.0
  - **Core Features:**
    - Drop books/dividers onto dividers (inserts before or after based on cursor position)
    - Visual drop indicator shows exact insertion point during drag
    - Works for all drag scenarios: books, multi-selected books, dividers
    - Click empty grid area to clear selection (standard UX pattern)
  - **Performance Optimizations:**
    - Row-Based Grid Index: O(log R) binary search instead of O(N) per-element polling
    - Built once at drag start, uses scroll offset calculation (no rebuild during scroll)
    - Overlay Indicator: Single DOM element positioned via direct manipulation
    - Refs instead of React state: Eliminates 2338 component re-renders during drag
    - Result: Smooth drag performance even with 2000+ books
  - **Technical Implementation:**
    - `buildColumnIndex()`: Creates row-based index with Y-boundaries for binary search
    - `calculateDropPosition()`: O(log R) lookup using cached index + scroll delta
    - `updateIndicatorPosition()`: Direct DOM manipulation (no React re-render)
    - `updateGhostPosition()`: Ref-based ghost positioning (no state updates)
  - **Impact:**
    - Completes the divider drag-drop experience (v3.11.0 added dividers, now fully interactive)
    - Makes reorganizing large libraries practical (was laggy/unusable before)
    - Professional-grade drag performance comparable to native desktop apps

## [3.13.0] - 2025-12-22

### Added
- **Selectable Dividers** - Click divider to select/deselect all books in that section
  - File version: readerwrangler.js v3.13.0
  - Click divider once to select all books between it and the next divider
  - Click again to deselect (toggle behavior)
  - Ctrl+click to add section to existing selection
  - Enables moving entire series/sections as a unit (divider + all books move together)
  - Solves: Previously had to drag divider and books separately (laborious for large series)
  - Fix: Prevent double drop indicators when dragging selected groups

## [3.12.0] - 2025-12-22

### Added
- **Auto-Scroll During Drag** - Automatic scrolling when dragging near column edges
  - File version: readerwrangler.js v3.12.0
  - When dragging item near top/bottom of column, container auto-scrolls
  - Scroll speed proportional to cursor proximity to edge (faster near edge)
  - Critical for columns with many books (can now drag to any position in one operation)
  - 100px trigger zone, max 15px/frame scroll speed

## [3.11.0] - 2025-12-22

### Added
- **Series Dividers Within Columns** - Visual section headers to organize books within columns
  - File version: readerwrangler.js v3.11.0
  - **Core Features:**
    - Manual dividers: Insert custom dividers via column dropdown menu → "Insert Divider"
    - Rename: Double-click divider text for inline editing (Enter to save, ESC to cancel)
    - Delete: Hover divider → click ✕ button (no confirmation)
    - Reposition: Hover divider → drag via ⋮ handle to any position in column
    - Dividers mix freely with books in drag-and-drop (treated as items in book array)
  - **Auto-Generate Helpers:**
    - "Auto-Divide by Series" - Groups books by series name (alphabetically), adds divider per series, sorts books by position within each series
    - "Auto-Divide by Rating" - Groups books by rating tiers (5★, 4★, 3★, 2★, 1★, Unrated)
    - Books without series metadata grouped under "Miscellaneous" divider
    - After generation, dividers are normal manual dividers (rename/delete/reposition freely)
  - **Unified Column Menu:**
    - Replaced separate sort/delete buttons with single ⋮ dropdown menu
    - Menu structure: Sort Column (submenu) → Auto-Divide options → Insert Divider → Rename/Delete Column
    - ESC key closes menus (submenu first, then main menu)
    - Click outside menus closes them
  - **Data Structure:**
    - Dividers stored as objects in column.books array: `{ type: 'divider', id: 'divider-...', label: 'Series Name' }`
    - Mixed array contains both book IDs (strings) and divider objects
    - Dividers persist to IndexedDB with organizational state
    - Dividers always pass through filters (always visible)
  - **Visual Design:**
    - Horizontal bar with centered text: `═══ Series Name ═══`
    - Gray background (#f3f4f6) differentiates from book covers
    - Hover state reveals drag handle (⋮ left) and delete button (✕ right)
    - Inline editing with blue border focus state
  - **Use Cases:**
    - Series grouping: "Jerry Mitchell" (books 1-6), "First Team" (books 3-4), "Miscellaneous"
    - Reading status: "Read", "Currently Reading", "To Read"
    - Rating tiers: "5 Stars", "4 Stars", "3 Stars or Below"
    - Any custom categorization user wants
  - **Impact:**
    - Solves horizontal space problem: One "Author Name" column can contain multiple series with clear visual separation
    - Efficient screen space usage for large libraries (2000+ books)
    - Series readers can visually group books without creating many columns
    - Alternative to complex nested hierarchies (simpler implementation, same organizational power)

### Fixed
- **Series Sort Logic** - Books with series but no position now sort correctly
  - Previous bug: Required both `series` AND `seriesPosition` to be truthy, treating books with series but no position as "unsortable"
  - Fix: Only check for `series` field, books without position go last in their series group (999 fallback)
  - Example: "The Javan War" (series: "The Cruel Stars Trilogy", position: null) now sorts with its series instead of ending up in wrong group
  - Impact: All books with series metadata sort with their series, regardless of position data quality

## [3.10.1] - 2025-12-22

### Fixed
- **Series Position Sort Bug** - Multi-level sorting now groups books by series before sorting by position
  - File version: readerwrangler.js v3.10.1
  - Bug: v3.10.0 sorted ALL books by position number, ignoring series membership
  - Fix: Multi-level sort - group by series name (alphabetically), then sort by position within each series
  - Example: "Jack Ryan Jr. #12" and "Different Series #1" no longer sort together
  - Edge cases: Books without both series AND seriesPosition remain in original position (unsortable)
  - Impact: Series position sort now actually useful for organizing multi-series collections
  - Users can now use one author column (e.g., "Larry Bond") and sort by series to group all series together
  - Related: TODO.md Priority 1 Task 0 (COMPLETED)

## [3.10.0] - 2025-12-22

### Added
- **Column Sorting: Series Position** - Complete column sorting functionality
  - File version: readerwrangler.js v3.10.0
  - Added "Series (1→99)" and "Series (99→1)" sort options to column sort menu
  - Sort books within columns by: acquisitionDate, seriesPosition, rating, title, author
  - Books without seriesPosition default to position 999 (sorted last)
  - Permanent re-ordering: Sorted order persists to IndexedDB automatically
  - Multi-column independent sorting: Each column tracks its own book order
  - Manual adjustment after sorting: Drag-and-drop still works (not locked)
  - Completes organization workflow: Get books into columns, then order optimally within each
  - Related: TODO.md Priority 1 Task 1 (COMPLETED)

## [3.9.2] - 2025-12-22

### Added
- **Reset App Backup Reminder** - Custom confirmation modal now reminds users to backup before resetting
  - File version: readerwrangler.js v3.9.2
  - Replaced native `confirm()` dialog with custom modal to fix Chrome scrolling bug
  - Added backup reminder: "💡 Tip: Use the Backup button first to save your organization before resetting"
  - Custom modal displays all content without scrolling (fixes Chrome extension bug where confirm() scroll interfered with tab scrolling)
  - Backup reminder highlighted in yellow box for visibility
  - Modal styled consistently with other app modals (Data Status, Settings)
  - Prevents accidental data loss by guiding users to proper workflow
  - Related: TODO.md Priority 1 Task 0 (COMPLETED)

## [3.9.1] - 2025-12-21

### Fixed
- **Read Status Tooltip** - SE corner green checkmark now shows "Read" tooltip instead of collections information
  - File version: readerwrangler.js v3.9.1
  - Added `title="Read"` attribute to read status indicator (line 2951)
  - Fixes confusing UX where hovering on read status showed unrelated collections data
  - Parent container's collections tooltip was bleeding through to child element

## [3.9.0] - 2025-12-21

### Changed
- **Architecture: Simplified to Load-State-Only Status System** - Removed broken cross-domain manifest tracking
  - File versions: readerwrangler.js v3.9.0, amazon-library-fetcher.js v3.6.0, amazon-collections-fetcher.js v1.3.0
  - **Removed manifest tracking**: Deleted all IndexedDB manifest read/write code from fetchers and organizer app
  - **Removed ReaderWranglerManifests database**: Cross-domain isolation made manifest sharing impossible between amazon.com (fetcher) and readerwrangler.com (app)
  - **Simplified status bar**: Now shows only Load state based on loaded file timestamp (removed broken fetch state tracking)
  - **Honest messaging**: App displays age of loaded data and trusts user to know their Amazon activity
  - **Architectural simplification**: 25 theoretical states (5 Fetch × 5 Load) → 6 practical states (Load-only: Empty, Fresh Both, Fresh Library, Fresh Collections, Stale Both, Obsolete Both)
  - Impact: Status system now works correctly, shows accurate information, puts responsibility on user who knows their Amazon purchase history

- **Data Status Modal UX Redesign** - Complete redesign of Data Status modal for better consistency and usability
  - File version: readerwrangler.js v3.9.0
  - **Button positioning**: Moved all Load/Reload buttons to same line as status (right-aligned) for universal left-to-right scan pattern
  - **Visual anchoring**: Added emojis (📚 Library, 📁 Collections) throughout all modal states for consistent visual cues
  - **Contextual proximity**: Action buttons now appear exactly where the problem is shown
  - **Layout improvements**:
    - States 1-2: Two-column fetch instructions for dual destinations (Library and Collections)
    - States 3-4: Single-column fetch instructions (~60% width, centered) for visual balance when only one data type needs attention
    - States 5-6: Consistent two-column layout with urgency-appropriate messaging
  - **Simplified messaging**: Replaced Yes/No branching with direct "Don't have files yet? Fetch them from Amazon:" approach
  - **Pattern consistency**: All 6 states now follow same design principles (status line + inline button + fetch instructions)
  - **Wired to File Picker API**: All Load/Reload buttons trigger browser file picker for manual file selection
  - Impact: Faster user comprehension, reduced cognitive load, consistent experience across all modal states

### Fixed
- **Redundant Status Grid** - Removed duplicate status display at bottom of Data Status modal (v3.9.0.p)
  - Modal was showing status information twice (top section + redundant grid at bottom)
  - Removed 15-line Status Grid section that duplicated information already shown inline
  - Impact: Cleaner modal UI, reduced visual clutter

### Added
- **File Type Detection** - Enhanced file loading with automatic type detection and routing (v3.9.0.l)
  - Single file picker now intelligently detects Library vs Collections JSON structure
  - Routes to appropriate loader function based on detected `type` field
  - Clear error messages when wrong file type selected ("This appears to be a Collections file, but you clicked Load Library")
  - Leverages type field validation added in v3.8.0
  - Impact: Better error handling, clearer user feedback during file loading

- **Collections Auto-Loading** - Collections file now auto-loads after successful library load (v3.9.0.n)
  - After loading library file, automatically checks for collections data in localStorage
  - Auto-loads collections if available, updating status and merging collection metadata
  - Spinner displays during auto-load with clear messaging
  - Impact: Seamless user experience, one less manual step required

- **Reset App Tooltip Fix** - Corrected Reset App button tooltip to match design specification (v3.9.0.m)
  - Previous tooltip: "Clear all data and start fresh"
  - New tooltip: "Reset app to initial state (clears organization, keeps library/collections loaded)"
  - Impact: Accurate description of what Reset App actually does

### Design Documentation
- Created comprehensive [DATA-STATUS-MODAL-STATES.md](docs/design/DATA-STATUS-MODAL-STATES.md) design specification
  - Documents all 6 modal states with ASCII mockups
  - Defines button behavior, messaging tone, and layout patterns for each state
  - Includes file type routing logic and testing scenarios
  - Serves as single source of truth for Data Status modal implementation

## [3.8.0] - 2025-12-20

### Added
- **Advanced Filtering System** - Added comprehensive filtering for organizing large libraries (Priority 1, #1: Advanced Filtering + Collections Integration UI)
  - File version: readerwrangler.js v3.8.0
  - Filter by rating (minimum star rating)
  - Filter by acquisition date range (From/To date pickers)
  - Filter by series (dropdown with all series names + "NOT_IN_SERIES" option)
  - Filter by wishlist status (Wishlist/Owned toggle)
  - Active filter count badge on filter button
  - Pulse animation on filter button when filters active
  - Collapsible filter panel (remembers state)
  - Filter state persistence to localStorage
  - Filters reset on library load and Clear Library
  - Impact: Enables quick discovery of specific book subsets in 2,300+ book libraries

- **Collection Metadata in Book Modal** - Collection names now displayed in book detail modal
  - Shows comma-separated list of all collections containing the book
  - Leverages existing Amazon collections data fetched by collections-fetcher
  - Impact: Better visibility of Amazon collection membership

- **Type Field Validation** - Both fetchers now include type field for better file validation (Priority 1, #0: File Type Field Validation)
  - Library fetcher v3.6.0: Added `"type": "library"` to JSON output
  - Collections fetcher v1.3.0: Added `"type": "collections"` to JSON output
  - Clean break validation: Requires type field, throws error if missing (no backward compatibility)
  - Better error messages for wrong file type selection
  - Example errors: "Wrong file type - This is a collections file. Please select a library file."
  - Impact: Clearer validation, better user feedback when wrong file selected

### Fixed
- **Acquisition Date Filter Field Name** - Fixed filter checking wrong field name (v3.8.0.m)
  - Filter was checking `book.acquisitionDate` but IndexedDB stores as `book.acquired`
  - Changed filter logic to use correct field name
  - Impact: Date range filter now works correctly

- **Wishlist Filter Field Mapping** - Fixed isWishlist field being dropped during JSON load (v3.8.0.n)
  - Field was not included in book object mapping at line 1086-1107
  - Added `isWishlist: item.isWishlist || 0` to field mapping
  - Impact: Wishlist filter now works correctly with manual test data

- **Library Fetcher Progress UI** - Fixed dialog hanging when library is up-to-date (no new books scenario)
  - File version: amazon-library-fetcher.js v3.6.0
  - Previous behavior: Dialog remained open showing "Fetching Titles" indefinitely
  - Root cause: Early return without updating progress UI
  - Fix: Added progressUI.showComplete() call before return
  - Impact: Better UX when no updates needed

### Notes
- **Genre Filter Not Available** - Amazon API does not provide genre/category metadata, so genre filtering cannot be implemented
  - Investigated during v3.8.0 development
  - Amazon's GraphQL API returns: title, author, rating, series, binding, description, reviews
  - No category, genre, or subject classification data available
  - Alternative: Users can leverage Amazon Collections for categorization

## [3.7.4] - 2025-12-19

### Fixed
- **Library Fetcher Error Handling** - Invalid file selection now shows error dialog instead of hanging (Priority 0, Bug #1)
  - File version: amazon-library-fetcher.js v3.5.2
  - When user selects wrong JSON file (e.g., collections JSON instead of library JSON), error dialog now appears immediately
  - Previous behavior: Dialog hung with "Checking Library Data..." message indefinitely
  - Root cause: Validation failure used `return;` instead of `throw new Error()`, preventing catch block from executing
  - Fix: Changed line 731 to throw error, ensuring progressUI.showError() displays to user
  - Impact: Better UX when file selection errors occur

## [3.7.3] - 2025-12-18

### Changed
- **Version Constant Renamed** - Renamed APP_VERSION to ORGANIZER_VERSION for clarity
  - File version: readerwrangler.js v3.7.1
  - Distinguishes organizer version from fetcher versions
- **Documentation Streamline** - Eliminated LOG.md to follow open-source standard
  - Migrated unique development insights to CHANGELOG.md
  - Follows "Keep a Changelog" standard (single source of truth)
  - Reduces duplication and maintenance burden

### Investigation
- **Collections Filter False Bug** - Investigated report that collections dropdown showed old collection names after Clear Everything
  - **Report**: Collections dropdown still shows "Uncollected" and other names after Clear Everything
  - **Investigation**: Attempted to verify by testing Clear Everything, observed "Uncollected" collection persisting in dropdown
  - **Root Cause of Confusion**: "Uncollected" is a hardcoded pseudo-collection in the HTML (always present by design), not a leftover from previous collections
  - **Actual Finding**: Clear Everything correctly clears all dynamic collections. The "Uncollected" entry is intentional, representing books not in any Amazon collection
  - **Conclusion**: No bug exists. User error during testing - mistook hardcoded "Uncollected" entry for a bug
  - **Original Report Status**: Unknown if original bug report made same mistake, or if bug was fixed at another time
  - **Time Impact**: Investigation consumed development time chasing false positive

### Development Notes
- **Conversation Recovery Insight** (2025-12-11) - When moving projects to new paths, Claude Code conversation history is path-keyed and won't follow automatically
  - Recovery: Locate conversation file in `C:\Users\Ron\.claude\projects\{path-encoded-folder}\`, update paths, set `isSideChain: false`
  - Key insight: Compaction summary metadata beyond visible text shapes behavior - cumulative corrections matter
  - "Broken in" conversations with correction history behave differently than fresh starts with identical instructions
- **Recurring Version Confusion** (2025-12-19) - Claude Code repeatedly confuses file versions (ORGANIZER_VERSION constant in readerwrangler.js) with APP/project versions (README.md badge, git tags)
  - Pattern: When discussing version updates, Claude often references wrong version type (e.g., "APP version 3.7.0" when meaning "file version v3.7.0")
  - Impact: Causes confusion during release prep, requires repeated clarification
  - Example: During v3.7.3 release, Claude confused readerwrangler.js v3.7.0 with APP version v3.7.0 (which doesn't exist - APP was at v3.7.2)
  - Mitigation: Always clarify which version type is being discussed, use explicit prefixes ("file version" vs "APP version")

## [3.7.2] - 2025-12-13

### Added
- **Progress UI Dialog** - Visual progress overlay for both fetchers (Priority 1, #2: Enhanced Progress Feedback)
  - Library fetcher v3.5.1: Timer display, progress bar, phase indicators
  - Collections fetcher v1.2.1: Timer display, progress bar, phase indicators
  - Shows elapsed time, current phase, and book count progress
  - Auto-dismiss after 30 seconds on completion
  - See: [post-mortems/v3.7.2-2025-12-13.md](post-mortems/v3.7.2-2025-12-13.md)
- **Abort on X Close** - Closing progress dialog now stops the fetch
  - Polls abort flag at start of each fetch iteration
  - Logs warning to console when abort requested
  - Prevents surprise save dialogs after user dismisses UI

### Technical Notes
- Progress UI implemented as IIFE module within fetcher functions
- Abort uses simple flag polling (Option A) - low complexity, low risk
- No AbortController needed since fetch loops are synchronous between iterations
- **Note**: Pause/Resume and Recovery features moved to Phase 3 Retry Logic (Priority 5, item #3)

## [3.7.1] - 2025-12-11

### Changed
- **Collections Fetcher Speed Optimization** - Dramatic performance improvement (Priority 1, #1: Speed Up Enrichment)
  - Released: amazon-collections-fetcher.js v1.2.0
  - Batch size increased: 200 books per request (was 25)
  - Removed artificial delays: 0ms (was 2000ms)
  - Performance: ~25 seconds for 2,300 books (was ~3+ minutes)
  - Network RTT (~400ms) provides natural throttling
  - Combined with v3.7.0 library fetcher improvements: **Achieved ~7-8x total speedup**
  - See: [post-mortems/v3.7.1-2025-12-11.md](post-mortems/v3.7.1-2025-12-11.md)

### Technical Notes
- Batch size 200 confirmed safe via diag-01-collections-rate-limit.js testing
- Collections API uses REST endpoint, not GraphQL (different from library fetcher)
- Progress UI time estimate updated to reflect new speed

## [3.7.0] - 2025-12-11

### Changed
- **Library Fetcher Speed Optimization** - Dramatic performance improvement (Priority 1, #1: Speed Up Enrichment)
  - Released: amazon-library-fetcher.js v1.1.0
  - Removed artificial delays (0ms) - network RTT provides natural throttling
  - Batch enrichment: 30 ASINs per getProducts call (was 1 per call)
  - Performance: ~25 seconds for 2,300 books (was ~2 hours)
  - See: [post-mortems/v3.7.0-2025-12-11.md](post-mortems/v3.7.0-2025-12-11.md)

### Added
- **Error Categorization** - Partial API errors now tracked by category in stats
  - `amazonTimeout` - 504.1 / Backend Future timed out errors
  - `customerMarketplace` - Customer/Marketplace ID invalid errors
  - `other` - Unrecognized errors
  - Category breakdown shown in final stats output
- **Friendly Error Messages** - Amazon API errors now display human-readable messages
  - 504.1 timeout → "Amazon server timeout (504.1) - temporary issue, data still retrieved"
  - Customer/Marketplace ID → "Amazon internal error (Customer/Marketplace ID) - data still retrieved"

### Fixed
- **Timing Stats** - Fixed missing timestamps causing incorrect duration display
  - Added `mergeEnd` timestamp after library file save
  - Added `manifestStart`/`manifestEnd` timestamps around Step 6
- **Partial Error Logging** - Fixed crash when logging batch partial errors
  - Updated to match batch structure (`batch`, `errorMessage`, `productsReturned`, `productsRequested`)

### Technical Notes
- Batch size of 30 ASINs is Amazon's limit (discovered via diag-03-batch-enrichment.js testing)
- GraphQL syntax requires unquoted keys: `{asin: "X"}` not `{"asin": "X"}`
- 504.1 errors are Amazon-side timeouts, benign when data is still returned

## [3.6.1] - 2025-11-19

### Fixed
- **Token Percentage Calculation** - Added explicit calculation formula to prevent inversion errors (2025-11-24)
  - Problem: Token percentage was intermittently calculated incorrectly (showing 35% when actually 67% remaining)
  - Root cause: Ambiguous protocol wording allowed calculating tokens USED instead of tokens REMAINING
  - Fix: Added explicit calculation formula with example: `(tokens_remaining / total_tokens) × 100`
  - Added DO NOT warning against calculating wrong metric (total - remaining) / total
  - File: SKILL-Development-Ground-Rules.md lines 274-280
- **Session Compaction Protocol** - Restored critical protocol to ground rules (2025-11-24)
  - Root cause: Protocol was removed during ground rules reorganization on 2025-11-22
  - Impact: Post-compaction sessions failed to load ground rules, causing Rule #0 violations
  - Fix: Restored Session Compaction Protocol section to SKILL-Development-Ground-Rules.md
  - Updated references from SKILL-Amazon-Book-Organizer.md → SKILL-ReaderWrangler.md
  - Removed redundant Rule #0 format duplication (now single source of truth at top of file)
  - File: SKILL-Development-Ground-Rules.md lines 205-247

### Added
- **Token Monitoring and Compaction Management Protocol** - Automated compaction detection and tracking (2025-11-24)
  - Status line progress bar (5 blocks) shows token usage visually
  - Freshness indicator (🟢🟡🟠🔴) shows data staleness
  - Threshold-based actions: Green/Yellow/Orange/Red zones with specific protocols
  - Automatic compaction detection: Triggers when token % increases (e.g., 19% → 100%)
  - **Memory file mechanism**: `.claude-token-memory` persists previous token % across sessions
    - Enables reliable compaction detection without parsing text history
    - Single number file (e.g., "48") updated at end of each response
    - Added to `.gitignore` (state file, not tracked)
  - Approval workflow: "yes" / "yes to all" / "no" for logging to Compaction-log.md
  - VS Code snippet + keybinding (Ctrl+Alt+L) for manual logging fallback
  - Purpose: Track actual token usage to validate Claude Max cost vs Pro + API
  - File: SKILL-Development-Ground-Rules.md lines 247-383
- **Wishlist Integration TODO Items** - Planned features for wishlist tracking and series gap detection (2025-11-24)
  - Item #19 (Priority 3): Basic wishlist with bookmarklet extraction and gray-out UI
  - Item #36 (Priority 6): Series gap detection with automatic missing book discovery
  - Bookmarklet saves to amazon-library.json as new top-level `wishlist` array
  - App creates special "Wishlist" column with visual distinction
  - Series gap detection requires Amazon API investigation (may be blocked by inconsistent series metadata)
  - Files: TODO.md lines 193-209 (item #19) and lines 321-342 (item #36)
- **Dev/Prod Dual-Repo Workflow** - Three-environment testing infrastructure (2025-11-23)
  - LOCAL (localhost:8000), DEV (readerwranglerdev), PROD (readerwrangler.com)
  - Environment-aware bookmarklet installer shows appropriate bookmarklets per environment
  - Console.log version output added to installer pages for debugging cache issues
  - Documentation in CONTRIBUTING.md "Bookmarklet Development and Testing" section
- **GUID-Based Status Tracking** - Library fetcher now generates unique GUIDs for status bar tracking (amazon-library-fetcher.js v3.4.0.a)
  - GUID stored in JSON file `metadata.guid` and IndexedDB manifest
  - Enables matching loaded files to their fetch manifests
  - Schema version bumped to 3.1.0
- **IndexedDB Manifest Storage** - Fetcher writes manifest directly to IndexedDB (amazon-library-fetcher.js v3.4.0.a)
  - Replaces broken manifest file polling (didn't work on GitHub Pages)
  - Uses `ReaderWranglerManifests` database with `manifests` object store
  - Enables future 25-state status tracking
- **Status Persistence** - Library and Collections status now persisted to localStorage (readerwrangler.js v3.7.0.n)
  - Status survives page refresh
  - Uses `readerwrangler-status` localStorage key
- **State Matrix Design Document** - Added state-matrix.html with complete 25-state matrix specification
  - Documents all Fetch × Load state combinations
  - Includes dialog mockups and urgency icon logic
  - User-first design principle: urgency based on Load state only

### Fixed
- **Three-Environment Bookmarklet Navigation** - All bookmarklets were navigating to wrong destinations (2025-11-23)
  - Root cause: `bookmarklet-loader.js` had `TARGET_ENV = 'PROD'` hardcoded
  - Fix: Renamed to `bookmarklet-nav-hub.js`, bookmarklets now inject `window._READERWRANGLER_TARGET_ENV`
  - Added `isDevRepo` detection to `index.html` (was missing, causing DEV repo to show PROD bookmarklet)
  - Versions: index.html v1.0.5, install-bookmarklet.html v1.0.5, bookmarklet-nav-hub.js v1.1.3
- **Status Dialog Bug** - Fixed dialog showing "No Library Loaded" when library was actually loaded (readerwrangler.js v3.7.0.n)
  - Dialog now correctly reads from persisted libraryStatus/collectionsStatus
  - Status initializes properly from localStorage on page load

### Changed
- **Status Bar UI** - Removed version number from status bar header (readerwrangler.js v3.7.0.o)
  - Version was cluttering status area meant to show data freshness
  - "Data Status:" label now clearly refers to library data freshness, not app version
  - Version remains visible in footer (bottom-right corner)
  - Per design spec in state-matrix.html line 445

## [3.6.1] - 2025-11-19

### Added
- **Sticky Note Callout** - Landing page hero section now features handwritten sticky note (index.html v1.0.5)
  - Text: "It's Not Just Organization; It's Rediscovery!"
  - Hand-drawn smiley face (eyes and smile)
  - Yellow gradient background with red thumbtack pin
  - Rotated -5 degrees counterclockwise for authentic sticky note appearance
  - Positioned to upper-right of hero section
  - Uses Gloria Hallelujah Google Font for handwritten text
  - Hidden on mobile devices (≤768px width) to prevent overlap
  - Location: [index.html:88-149](index.html#L88-L149) (CSS), [index.html:499-517](index.html#L499-L517) (HTML)

## [3.6.0] - 2025-11-19

### Added
- **Visual Assets & Marketing Content** - Enhanced landing page and documentation with interactive demonstrations
  - **Interactive Before/After Slider**: Image comparison slider on index.html showing transformation from Amazon's chaotic list to organized columns
    - Uses img-comparison-slider web component from unpkg CDN
    - Custom purple divider and handle styling for improved visibility
    - Full-bleed 1800px container for maximum visual impact
    - Screenshot assets: before.png (808 KB), after.png (1.8 MB)
  - **10-Minute Walkthrough Video**: Self-hosted video demonstration of all features
    - HTML5 video player with custom poster image
    - Compressed from 846 MB to 39 MB for web delivery (H.264/AAC)
    - 1600px container for prominent display
    - Preview frame extracted at 9:11 timestamp using FFmpeg
    - Video assets: walk-through.mp4 (39 MB), walkthrough-preview.png (1.3 MB)
  - **README.md Enhancements**: Static versions of visual content for GitHub
    - Side-by-side before/after images (49% width each)
    - Clickable video preview linking to MP4
    - Placed strategically after "Why ReaderWrangler?" section
  - **Location**: index.html comparison section and video section, README.md visual sections
  - **Purpose**: Improved conversion and user engagement through visual storytelling

### Changed
- **TODO Documentation** - Added "Fill in missing sections in USER-GUIDE.md" task

## [3.5.4] - 2025-11-19

### Fixed
- **DEV Bookmarklet Localhost Mode** - DEV bookmarklet now consistently uses localhost for all operations
  - **Global Flag Pattern**: DEV bookmarklet sets `window._READERWRANGLER_DEV_MODE=true` before loading loader
  - **Force Localhost**: Loader checks flag and forces `baseUrl = 'http://localhost:8000/'` when true
  - **Consistent Navigation**: "Launch App" and all navigation now use localhost regardless of current domain
  - **Developer Experience**: Enables testing production bookmarklet behavior while using local files
  - **Console Diagnostics**: Both DEV and PROD bookmarklets log version and loading source
  - **Locations**: [install-bookmarklet.html:222,226](install-bookmarklet.html#L222), [bookmarklet-nav-hub.js:12](bookmarklet-nav-hub.js#L12)

### Removed
- **Dead Code Cleanup** - Removed non-functional `about:blank` detection from bookmarklet and loader
  - **Browser Limitation**: Browser security completely blocks JavaScript execution on `about:blank` pages
  - **No Detection Possible**: Code never executes to show error message
  - **Documented**: This is expected browser behavior, not a bug to fix
  - **Other Blocked Pages**: Similarly blocked on `chrome://` URLs and other restricted pages

## [3.5.3] - 2025-11-19

### Added
- **Title Navigation Link** - ReaderWrangler title in app header now links back to index.html
  - **Invisible Styling**: Link maintains original visual appearance (no color change, no underline)
  - **Implementation**: Uses inline React styles `color: 'inherit'` and `textDecoration: 'none'`
  - **User Experience**: Provides easy navigation from app back to landing page
  - **Location**: App header at [readerwrangler.js:1531-1533](readerwrangler.js#L1531-L1533)

## [3.5.2] - 2025-11-19

### Added
- **Ctrl+A Column-Scoped Selection** - Select all books in active column with Ctrl+A
  - **Active Column Tracking**: Click any book or column to set it as active
  - **Visual Indicator**: Active column displays dark gray beveled border
  - **Smart Behavior**: Ctrl+A selects all filtered books in active column only
  - **Auto-Initialize**: First column automatically becomes active on load
  - **Cross-Column Safety**: Prevents accidental selection across multiple columns

### Fixed
- **Shift+Click Range Selection** - Fixed broken shift-click range selection
  - **Root Cause**: `selectBookRange` was comparing book objects to book IDs using strict equality
  - **Symptoms**: Shift-click appeared to do nothing (no books selected)
  - **Fix**: Changed comparison from `b === startBookId` to `b.id === startBookId` (lines 1138-1139)
  - **Fix**: Added `.map(book => book.id)` to extract IDs from book objects (line 1145)
  - **Impact**: Shift-click range selection now works correctly for selecting contiguous books

- **Ctrl+A Active Column Tracking** - Fixed Ctrl+A selecting from wrong column
  - **Root Cause**: Clicking book didn't update `activeColumnId`, only clicking column container did
  - **Symptoms**: After selecting book in Column B, Ctrl+A still selected from Column A
  - **Fix**: Added `setActiveColumnId(column.id)` to book click handler (line 2207)
  - **Impact**: Ctrl+A now always selects from the column containing the last clicked book

### Changed
- **Ground Rules: Simplified Compaction Management Protocol** - Streamlined token monitoring and context compaction workflow
  - **EXPERIMENT**: Compared automatic summarizer output vs manual summary template (EXAMPLE-CONTEXT-COMPACTION-PREP.md)
  - **FINDINGS**: Auto-summarizer captures all technical details, errors, decisions, and context effectively without manual prep
  - **CHANGES TO SKILL-Development-Ground-Rules.md**:
    - 🟠 Orange Zone (22-25%): Simplified from verbose manual summary to brief git status check
    - 🔴 Red Zone (<22%): Streamlined emergency protocol
    - Removed reference to manual summary template (EXAMPLE-CONTEXT-COMPACTION-PREP.md)
    - Added "Why This Works" section documenting auto-summarizer effectiveness
  - **DELETED FILES**:
    - EXAMPLE-CONTEXT-COMPACTION-PREP.md (manual summary template no longer needed)
    - ExampleAutoSummary-DELETEME.md (experimental comparison capture)
  - **TOKEN SAVINGS**: ~2-3% per compaction cycle (no longer preparing verbose manual summaries)
  - **RATIONALE**: Ground rules header (lines 1-70) with explicit triggers and required checklist ensures post-compaction success more effectively than verbose manual summaries

- **Bookmarklet Evolution to Navigation Hub** - Transformed bookmarklet from simple script runner to multi-step navigation system
  - **CONCEPT CHANGE**: Bookmarklet now shows navigation menu instead of auto-running scripts
  - **USER FLOW**: Users click bookmarklet → menu appears → select action (navigate, fetch, launch app)
  - **NAVIGATION**: Menu guides users to correct Amazon pages before fetching data
  - **MULTI-STEP WORKFLOW**: Requires 4+ clicks (not "one-click" as originally advertised)
  - **INSTALLATION**: Bookmarklet now installable from both index.html and install-bookmarklet.html
  - **DEV MODE**: Added `DEV_MODE_VIEW_OF_PROD_BUTTONS` toggle for localhost testing
    - Allows testing production URLs while running locally on http://localhost:8000/
    - Set to `false` for production deployment
    - Located in index.html and install-bookmarklet.html
  - **FILES AFFECTED**: bookmarklet-loader.js, index.html, install-bookmarklet.html

### Fixed
- **"One-Click" False Advertising** - Removed inaccurate marketing claims throughout documentation
  - **PROBLEM**: Claimed "one-click extraction" but reality is multi-step workflow via navigation menu
  - **SOLUTION**: Replaced all "one-click" language with accurate descriptions:
    - "one-click extraction" → "easy extraction with bookmarklet"
    - "with one click" → "with a simple bookmarklet"
    - "One-click bookmarklet" → "Simple bookmarklet"
    - "Just one click" → "Simple and straightforward"
  - **IMPACT**: 15+ locations updated across index.html (8 locations), install-bookmarklet.html (3 locations), README.md (5+ locations)
  - **REASONING**: User expectations now match reality - no false advertising

- **Documentation Accuracy** - Aligned all documentation with actual bookmarklet behavior
  - **"How It Works" section rewritten**: Now explicitly mentions navigation menu and multi-step process
    - Step 1: "...when you click the bookmarklet, a navigation menu appears. Select 'Go to Library Fetcher Amazon Page'..."
    - Step 3: "...click the bookmarklet, navigate to the library fetcher page using the menu, then select 'Fetch Library Data'"
  - **Standardized language**: All instances now use "when you click the bookmarklet" (not "when you click it")
  - **Terminology fix**: Changed "One-Time Setup" → "Initial Setup" (more accurate since users repeat occasionally)
  - **Typo fix**: "canvase for your" → "canvas for you" (index.html:405)
  - **Cleanup**: Removed old commented code showing previous bookmarklet order

- **README.md Structure** - Complete restructure to match index.html exactly
  - **Added missing section title**: "Extract and Organize Your Online Amazon Kindle Library Easily"
  - **Reordered sections**: Quick Start → Why ReaderWrangler? → Key Features → How It Works → Current Support → What Makes ReaderWrangler Different?
  - **Fixed GIF placement**: Moved below 2nd paragraph (was covering text)
  - **Fixed Quick Start formatting**: Each step (A, B, C, D) now on separate line
  - **Converted sections to tables**: 2x2 grid format for feature sections (matches index.html)
  - **Added "How It Works" section**: 3-step workflow matching index.html exactly
  - **Word-for-word verification**: All matching content now identical between README.md and index.html
  - **Added FreeDNS credit**: Special thanks in Notice section

### Added
- **SEO Infrastructure** - Complete search engine optimization setup
  - **sitemap.xml** - XML sitemap for Google indexing
    - Lists all 4 main pages with priority and change frequency
    - Last modified dates for freshness signals
    - Standard sitemap protocol format
  - **robots.txt** - Crawler guidance file
    - Allows all bots to crawl all pages
    - Points to sitemap.xml location
    - Disallows temp/ and test/ directories
  - **Schema.org Structured Data** - JSON-LD metadata in index.html
    - SoftwareApplication schema type
    - Feature list for rich snippets
    - Version and URL information
  - **Optimized Meta Tags** - Enhanced SEO keywords
    - Added "scrape", "visually", "extract" to target search queries
    - Goal: Rank for "tool to scrape amazon kindle books and organize visually"
    - Updated descriptions across index.html and install-bookmarklet.html
    - Added OG meta tags for social media sharing (uses icons/og-image.png)

- **Launch Strategy Documentation** - Comprehensive launch preparation
  - **REDDIT-LAUNCH-POST.md** - Reddit launch guide for r/kindle (200k+ subscribers)
    - 3 post title options (problem-focused, feature-focused, question-based)
    - Complete post body with GIF placement
    - Expected Q&A section
    - Best posting times (Tue-Thu, 9-11 AM or 6-8 PM EST)
    - Follow-up strategy for r/ebooks, r/productivity, r/selfhosted
  - **PRODUCTHUNT-LAUNCH-CHECKLIST.md** - Complete ProductHunt launch guide
    - Pre-launch timeline (2-3 weeks preparation)
    - Asset requirements (images, GIF, copy)
    - Launch day timeline (start 12:01 AM PT)
    - Maker comment template
    - Social media post templates
    - Success metrics (100-200 upvotes = great launch)

- **Landing Page (index.html)** - Professional landing page for custom domain (readerwrangler.com)
  - Hero section with tagline "Wrangle your reader chaos - Your books, your order"
  - Problem/solution narrative from README
  - Feature highlights (Library Management, Organization, Privacy)
  - Two CTAs: "Get Started" → install-bookmarklet.html, "Launch App" → readerwrangler.html
  - SEO meta tags and responsive design
  - Will auto-serve when users browse to readerwrangler.com

### Changed
- **Collections Fetcher Progress Message** (amazon-collections-fetcher.js v1.0.2.b)
  - Updated time estimate based on real-world data
  - Old: "~1 hour per 1000 books"
  - New: "~1½ minutes per 1000 books"
  - Based on actual fetch: 2287 books in 3:54 (102 seconds per 1000)
  - User-tested and confirmed accurate

### Improved
- **Dialog UX Improvements** - Added X buttons and localhost testing support
  - **Bookmarklet Loader** (v1.0.2.a)
    - Added X button to upper-right corner of intro dialog
    - Removed "🔄 Refresh page to cancel" from dialogs (kept in console output)
    - Consistent close affordance across all states
  - **Collections Fetcher** (v1.0.2.b)
    - Added X button to all dialog states (progress, complete, error)
    - Removed "🔄 Refresh page to cancel" from dialogs (kept in console output)
    - Consistent close affordance across all states
  - **Library Fetcher** (v3.3.3.a)
    - Added X button to all dialog states (progress, complete, error)
    - Removed "🔄 Refresh page to cancel" from dialogs (kept in console output)
    - Consistent close affordance across all states

## [3.5.0] - 2025-11-14

### Changed
- **Project Renamed to ReaderWrangler** - Rebranded from "Amazon Book Organizer" to "ReaderWrangler" to better reflect multi-platform vision and avoid trademark issues
  - Updated product name throughout UI, documentation, and code
  - **File Renames**:
    - `amazon-organizer.html` → `readerwrangler.html` (main app)
    - `amazon-organizer.js` → `readerwrangler.js` (generic organizer UI)
    - `amazon-organizer.css` → `readerwrangler.css` (generic styles)
    - `library-fetcher.js` → `amazon-library-fetcher.js` (Amazon-specific fetcher)
    - `collections-fetcher.js` → `amazon-collections-fetcher.js` (Amazon-specific fetcher)
    - `amazon-book-organizer.code-workspace` → `readerwrangler.code-workspace`
    - `SKILL-Amazon-Book-Organizer.md` → `SKILL-ReaderWrangler.md`
  - Updated all GitHub Pages URLs: `amazon-book-organizer` → `readerwrangler`
  - Generalized product descriptions: "Amazon library" → "ebook library"
  - Updated backup filename: `amazon-book-backup-*.json` → `readerwrangler-backup-*.json`
  - Updated React component name: `AmazonBookOrganizer` → `ReaderWrangler`
  - Kept Amazon-specific references where appropriate (data files, CDN URLs, Amazon trademark notices)
  - Updated versions:
    - Main app files: v3.5.0 (readerwrangler.html, readerwrangler.js, readerwrangler.css)
    - Distribution tools: v1.0.1 (bookmarklet-loader.js, install-bookmarklet.html)
    - Amazon fetchers: No version change (amazon-library-fetcher.js v3.3.2, amazon-collections-fetcher.js v1.0.0)

### Added
- **Store field** - Added `store: "Amazon"` field to all book records to prepare for future multi-platform support (Barnes & Noble, etc.)
  - Data structure enhancement for future integration of multiple ebook stores
  - Currently hardcoded to "Amazon" in all existing book processing

### Technical Notes
- Storage keys renamed to avoid conflicts: `amazon-book-organizer-state` → `readerwrangler-state`, `AmazonBookDB` → `ReaderWranglerDB`
- Historical references in CHANGELOG, NOTES, and TODO kept as-is per ground rules
- README already updated in previous session with generalized product messaging

### Distribution Tools

#### [bookmarklet-loader.js v1.0.0] - 2025-11-13
- Smart bookmarklet loader with intro dialog and page detection
- Detects current Amazon page (library, collections, or other)
- Offers appropriate actions based on page type
- Navigation to library or collections pages with reminder alerts
- Loads library-fetcher.js or collections-fetcher.js on demand
- Version display in dialog footer

#### [install-bookmarklet.html v1.0.0] - 2025-11-13
- Drag-and-drop bookmarklet installer page
- Installation instructions for Chrome/Edge/Firefox
- Links to Amazon library and collections pages
- Privacy note explaining browser-only processing
- Version display at bottom

## [3.4.0] - 2025-11-12

### Added
- **Multi-Select with Ctrl/Shift** - Standard file-manager style multi-select (amazon-organizer.js v3.4.0)
  - **Single-click**: Select book (replaces selection, shows blue outline + checkmark)
  - **Ctrl+Click**: Toggle selection (add/remove from multi-select)
  - **Shift+Click**: Range selection from last clicked book (within same column)
  - **Double-click**: Open book detail modal
  - **Visual feedback**: Blue outline, checkmark badge, selection count indicator
  - **Bulk drag-and-drop**: Drag any selected book to move all selected books together
  - **Stacked drag ghost**: Visual indication showing multiple books being dragged with count badge
  - **Right-click context menu**: Quick bulk move to other columns
  - **ESC key**: Clear selection
  - **Click empty space**: Clear selection
  - **Selection count indicator**: Fixed bottom-right showing "{N} books selected" with Clear button
  - **INTERACTION CHANGE**: Modal now opens on double-click instead of single-click for standard UX
  - **CSS**: Added `.book-clickable.selected` styles (amazon-organizer.css)

### Technical Notes
- Modified `handleMouseDown` to skip drag initiation when modifier keys pressed
- Fixed `selectBookRange` to correctly compare book IDs (was comparing objects)
- Range selection scoped to same column only (per design requirements)
- Selection state persists during filtering/searching
- Created checkpoint tag `checkpoint-pre-double-click` before implementing Option 3

## [3.3.2] - 2025-11-11

**Full post-mortem analysis:** [post-mortems/v3.3.2-2025-11-11.md](post-mortems/v3.3.2-2025-11-11.md)

### Fixed
- **Clear Library Feature** - Complete app reset now works correctly (amazon-organizer.js v3.3.2)
  - **REPLACED**: Complex "Clear Everything" dialog (with checkboxes) replaced with simple "Clear Library" button
  - **BASED ON**: Proven v3.2.1 clearEverything pattern (avoided reinventing, copied working code)
  - **BEHAVIOR**: Single button performs complete reset - unloads library, removes columns, clears organization, resets to pristine state
  - **UX**: Simple confirm() dialog with clear explanation of what will be cleared
  - **TESTED**: User confirmed "works exactly as expected!"
  - **LESSON**: When struggling with complex approach, look back at previous working versions

- **Partial GraphQL Errors** - Enrichment now handles partial errors correctly (library-fetcher.js v3.3.2)
  - **PROBLEM**: 3/2666 books failed during fetch with "Customer Id or Marketplace Id is invalid" error
  - **ROOT CAUSE**: Amazon's GraphQL API returns BOTH `data` (valid description) AND `errors` (customerReviewsTop failed) in same response
  - **OLD BEHAVIOR**: Rejected entire response if any errors present, discarding valid description data
  - **NEW BEHAVIOR**: Checks if product data exists despite errors, continues extraction if data present
  - **VALIDATION**: Overnight fetch successful - all 3 problem books now have descriptions
  - **IMPACT**: 5 books had partial errors during validation fetch, all recovered successfully
  - **STATISTICS**: Added comprehensive tracking for partial errors (position, title, ASIN, error details)
  - **LOGGING**: Enhanced error logging with raw response dumps for future debugging

### Improved
- **Load Library Instructions** - Better guidance for first-time users (amazon-organizer.js v3.3.2)
  - **CLARIFIED**: "If you haven't already" makes it clear fetcher script is optional when just resetting
  - **ADDED**: File location detail (Downloads folder) with instruction to move to project folder
  - **ADDED**: README reference for complete fetcher instructions
  - **TODO ADDED**: In-code comment about updating for GitHub Pages bookmarklet deployment

### Changed
- **Library Fetcher v3.3.2.b**: Statistics tracking for partial errors
  - **ADDED: Partial error tracking** - comprehensive statistics for books with partial errors
    - New stat: `stats.partialErrorBooks` array tracks all books that had partial errors
    - Each entry includes: position, title, ASIN, error message, and error path
    - Displayed in final summary before "DATA QUALITY NOTES" section
    - Shows complete list with full details for debugging and monitoring
  - **IMPROVED: Final summary reporting** - distinguishes partial errors from total failures
    - New section: "⚠️ PARTIAL ERRORS (Got data anyway)" shows all books that had errors but still got data
    - Helps user understand which books had issues during enrichment but were still successfully processed
    - Provides visibility into API behavior patterns (e.g., customerReviewsTop failures)

- **Library Fetcher v3.3.2.a**: Partial error handling for GraphQL responses
  - **FIXED: Enrichment failures** - now handles partial GraphQL errors correctly
    - GraphQL can return BOTH `data` AND `errors` in the same response (partial errors)
    - Previous behavior: Rejected entire response if any errors present, discarding valid description data
    - New behavior: Checks if product data exists despite errors, continues extraction if present
    - Only fails if errors present AND no data returned (total failure)
  - **IMPROVED: Error logging** - comprehensive debugging information
    - Logs error message, error path, and raw error details for partial errors
    - Dumps full raw response for all error paths (total failures, no data, HTTP errors)
    - Future issues can be diagnosed immediately from console logs
  - **IMPACT**: Fixes 3 books that were failing during full library fetch:
    - "99 Reasons to Hate Cats" (ASIN B0085HN8N6)
    - "Queen's Ransom" (ASIN 0684862670)
    - "To Ruin A Queen" (ASIN 0684862689)
  - These books return valid descriptions but have `customerReviewsTop` errors
  - Root cause: Amazon's API returns "Customer Id or Marketplace Id is invalid" for review field under certain cumulative load conditions
  - See NOTES.md Test 14 for detailed investigation findings

### Added
- **Schema v3.0.0 Support**: Organizer now handles new library JSON format with metadata
  - Validates incoming JSON structure (`{metadata, books}`)
  - Extracts and logs metadata information (schema version, total books, fetch date, etc.)
  - Displays books without descriptions count from metadata
  - No backward compatibility - requires library-fetcher.js v3.1.3+ to generate schema v3.0.0 files

### Changed
- **Library Fetcher v3.3.0**: Reliability, data quality, and comprehensive statistics
  - **NEW: Retry logic with exponential backoff** - automatically retries ALL API requests
    - Applied to Phase 0 validation (library + enrichment tests)
    - Applied to Pass 1 library page fetching
    - Applied to Pass 2 individual book enrichment
    - Retries up to 3 times with 5s, 10s, 20s delays between attempts
    - Prevents data loss from temporary network issues
    - Console shows `⏳ Retry X/3 after Ys...` during retry attempts
    - Only marks as failed after all retries exhausted
  - **NEW: Comprehensive statistics output** - detailed summary of fetch session
    - ⏱️ TIMING: phase-by-phase duration breakdown (Phase 0, Pass 1, Pass 2, Merge, Manifest)
    - 🔄 API RELIABILITY: retry histogram showing % of calls succeeding on first try vs. requiring retries
    - 📊 FETCH RESULTS: total fetched, non-books filtered, books kept
    - 📝 ENRICHMENT RESULTS: success rate with list of failed books after retries
    - ⚠️ DATA QUALITY NOTES: books without descriptions, authors, AI summaries used
    - 💾 FILES SAVED: confirmation of output files
    - Statistics shown even when no new books found (validation-only mode)
  - **NEW: Non-book item filter** - automatically excludes non-book items from library
    - Filters out: DVDs, Audio CDs, CD-ROMs, Maps, Shoes, Product Bundles, Misc.
    - Only includes: Kindle Edition, Paperback, Hardcover, Mass Market Paperback, Board book, Unknown Binding, Audible Audiobook, Library Binding
    - Console shows `⏭️  Skipping non-book: [title] ([binding])` when item filtered
    - Statistics show how many non-books filtered with examples
  - **FIXED: Early exit bug** - statistics now shown even when library is up-to-date
    - Previously: script exited immediately when no new books found, showing no statistics
    - Now: shows validation timing, API reliability, and library status even with no new books
  - **REMOVED: Backward compatibility code** - cleaned up temporary schema v2.0 → v3.0.0 migration code
    - Code was marked for removal after fresh fetch validates v3.0.0 schema
    - Removed lines 221-234 (schema v2.0 array format handling)
    - Simplified codebase now only supports schema v3.0.0+

- **Library Fetcher v3.2.0**: Comprehensive description extraction improvements (99.9% coverage)
  - **NEW: Recursive fragment extraction** - handles arbitrarily deep nesting (4+ levels)
  - **NEW: AI summaries fallback** - uses `auxiliaryStoreRecommendations` when traditional description missing
  - **IMPROVED: Description extraction** - added `extractTextFromFragments()` recursive function
  - Updated GraphQL queries in Phase 0 and Pass 2 to fetch AI summaries
  - Console shows `📝 Using AI summary (X chars)` when fallback is used
  - Expected description coverage: ~99.9% (only books genuinely lacking descriptions will be empty)
  - See DESCRIPTION-RECOVERY-SUMMARY.md for complete investigation details

- **Collections Fetcher v1.0.1.a**: Added named function wrapper for reusability
  - Script can now be re-run with `fetchAmazonCollections()` without re-pasting
  - Improved UX for users who need to refresh collections data

### Fixed
- **Description Recovery**: Recovered 1,526 out of 1,528 missing descriptions (99.91%)
  - Traditional descriptions: 1,517 recovered (paragraph wrappers, nested semanticContent)
  - AI summaries: 7 recovered (auxiliaryStoreRecommendations field)
  - Recursive extractions: 2 recovered (deep nested fragments)
  - Only 2 books genuinely lack descriptions on Amazon
- **API Error Resilience**: Fresh fetch with v3.2.0 had 5 API errors (0.21% error rate)
  - v3.3.0 retry logic should reduce this to near-zero failed requests
  - Improves from 99.79% success rate to expected 99.95%+ success rate

### Technical
- JavaScript version 3.3.0.a (organizer)
- Library Fetcher version 3.3.0
- Collections Fetcher version 1.0.1.a
- Schema version 3.0.0

## [3.2.1] - 2025-11-01

### Fixed
- **Book Dialog UX**: Replaced misleading "Fetch Description & Reviews" button with honest "Description not available" message
  - Changed from blue action button to yellow warning indicator
  - Updated message from "Description not loaded yet" to "Description not available"
  - Added explanation: may not be in Amazon's database or wasn't captured during fetch
  - Removed dead `fetchBookDescription()` function (28 lines)
  - Net: -34 lines, cleaner and more honest code

### Technical
- JavaScript version 3.2.1
- Rationale: Descriptions should be fetched by library-fetcher.js script, not in the UI
- The organizer is a viewer/organizer, not a data fetcher
- Honest messaging prevents user confusion and sets correct expectations

## [3.2.0] - 2025-10-19

### Changed
- **HTML Refactoring**: Split monolithic HTML file into modular structure
  - Extracted CSS to `amazon-organizer.css` (97 lines)
  - Extracted JavaScript to `amazon-organizer.js` (1,916 lines)
  - HTML reduced from 2,032 lines to 17 lines (99% reduction)
  - Improved maintainability and code organization
- **Version Management**: Enhanced version tracking and cache busting
  - Added HTML version comment for easy identification
  - Implemented query string cache busting (`?v=3.2.0`) for CSS/JS resources
  - Added version comments to CSS and JS files
  - Added footer version display (bottom-right corner) for easy verification
  - Version now displayed in: tab title, page header, and footer
- **Git Pre-Commit Hook**: Automated SKILL zip file rebuilding
  - Hook automatically detects SKILL-*.md changes on commit
  - Rebuilds corresponding .zip files using PowerShell
  - Eliminates manual rebuild steps and prevents forgetting

### Technical
- HTML shell version 3.2.0
- JavaScript version 3.2.0
- CSS version 3.2.0
- Feature branch: feature-html-refactor
- All functional behavior unchanged (refactoring only)

### Technical Notes

**HTML Refactoring Rationale**:
- Preparation for collections integration feature
- Large monolithic file becoming difficult to navigate and maintain
- Separation allows independent versioning of HTML structure, styles, and logic
- Query string versioning forces browser cache refresh when files change

**Version Display Strategy**:
- Tab title: Standard web app pattern (Amazon Book Organizer v3.2.0)
- Page header: Compact display with freshness indicator
- Footer: Small, unobtrusive corner display for quick dev verification
- HTML version comment: View source shows deployment version
- Query strings: Ensure browser loads correct CSS/JS versions

**Git Pre-Commit Hook Implementation**:
- Located at `.git/hooks/pre-commit` (repository-local, not tracked)
- Detects staged SKILL-*.md files via `git diff --cached`
- Executes PowerShell build commands for each changed file
- Provides friendly output during commit process
- Falls back to manual build scripts if hook not present (e.g., fresh clone)

**File Versions After Refactor**:
- HTML, CSS, JS all start at v3.2.0 (reflects history as part of HTML since v3.0.0+)
- Each can now evolve independently
- README.md project version remains source of truth for git tags

## [3.1.2] - 2025-10-18

### Changed
- **Improved Error Messages**: Console fetcher Phase 0 validation now provides actionable recovery steps
  - Authentication failures now include specific instructions (e.g., "Refresh the page and try again")
  - Session expiration guidance more clear and actionable
  - Each error condition includes next steps for user to resolve

### Technical
- Console fetcher version 3.1.2
- Feature branch: feature-improve-error-messages
- Changes only affect error message display, no functional changes to API logic

### Technical Notes

**Error Message Improvements**:
- User concern: What happens if auth tokens/cookies expire during fetching?
- Investigation: Tokens pulled dynamically each run, cookies sent via `credentials: 'include'`
- Current state: Phase 0 mentions session expiration but doesn't provide clear recovery steps
- Solution: Added actionable recovery instructions to each error scenario:
  - "Log in and try again"
  - "Refresh the page and try again"
  - "Report this issue"
  - "Check your connection"
- Result: Users now have clear next steps when authentication fails

## [3.1.1] - 2025-10-17

### Added
- **Column Rename Discoverability**: Pencil icon (✏️) now appears on hover over column names
  - Indicates that column names are editable
  - Fades in smoothly with 0.2s transition
  - Works alongside existing double-click rename feature
  - Addresses user confusion about how to rename columns

### Changed
- Enhanced column header UI with hover state for better editability indication

### Technical
- HTML interface version 3.1.1
- Feature branch: feature-column-rename-trigger
- Double-click rename functionality was already present but lacked discoverability

### Technical Notes

**Column Rename Feature**:
- Initial report: User believed column rename feature didn't exist
- Investigation: Feature was fully implemented via double-click with tooltip
- Root cause: Lack of visual affordance - users didn't discover the feature
- Solution: Added pencil icon that appears on hover to signal editability
- Implementation: Wrapped column name in container div, added pencil span with CSS opacity transition
- Result: Feature is now discoverable without changing the double-click interaction pattern

**Process Improvements**:
- Added Session Startup Checklist to NOTES.md to ensure ground rules are reviewed
- Documented ground rule violations (version management, approval workflow) as lessons learned
- Established pattern: documentation updates don't require version increment but still need approval

## [3.1.0] - 2025-10-17

### Added
- **Dynamic Title Management**: Browser title now automatically updates from APP_VERSION constant
  - Version only needs to be updated in one place (APP_VERSION at line 106)
  - No manual title tag updates required
- **Search Improvements**: Enhanced search bar UX
  - Added magnifying glass icon (🔍)
  - Improved placeholder: "Search by title or author..."
  - Better visual hierarchy with icon spacing
- **Add Column UX Redesign**: Simplified column creation workflow
  - Click "Add Column" button creates "New Column" immediately
  - Column name enters edit mode automatically with cursor ready
  - Follows Windows File Explorer convention (like creating new folder)
  - Removed confusing "type name + click +" pattern
- **Claude Skills Infrastructure**: Established AI assistant development workflow
  - Created SKILL-Development-Ground-Rules.md (global development practices)
  - Created SKILL-Amazon-Book-Organizer.md (project-specific context)
  - Build scripts (build-skill-*.bat) to generate Skills zip files
  - Documentation in README for Skills management
- **Session Continuity**: NOTES.md file for tracking tabled discussion items
  - Maintains context across Claude sessions
  - Tracks work in progress, tabled items, and open questions
  - Always committed with changes for backup

### Changed
- **Project Version Management**: README.md now source of truth for git tags
  - Individual code files can have their own internal versions
  - Git tags match README.md project version
  - Prevents version conflicts when updating different files
- **Documentation Updates**: Comprehensive README improvements
  - Added local HTTP server setup instructions (CORS requirement)
  - Documented Claude Skills workflow and enablement process
  - Added NOTES.md to key documents list
  - Clarified version management strategy

### Technical
- HTML interface version 3.1.0.c
- Feature branch: feature-ux-improvements
- Project version tracked in README.md

### Technical Notes

**Dynamic Title Management**:
- Initial concern: Version appeared in two places (title tag + APP_VERSION constant)
- Solution: Use JavaScript to set document.title dynamically from APP_VERSION
- Result: Single source of truth for version in code

**Add Column UX**:
- Old pattern: User types name in input field, then clicks + button
- Problem: Not intuitive, required two-step process
- New pattern: Click button → creates "New Column" → enters edit mode immediately
- Implementation: Leveraged existing setEditingColumn() functionality with setTimeout
- Removed unused newColumnName state variable

**Skills Build Process**:
- Batch files cannot be run directly by Claude due to permissions
- Solution: Claude runs PowerShell commands directly to execute build process
- Build scripts kept as documentation and for manual developer use
- Skills require YAML frontmatter (name and description in lowercase-with-hyphens)

## [3.1.0] - 2025-10-16

### Added
- **Phase 0 API Validation**: Console fetcher now tests both library and enrichment APIs before fetching
  - Validates library query (ccGetCustomerLibraryBooks) with minimal request
  - Validates enrichment query (enrichBook) with sample ASIN from user's library
  - Provides detailed diagnostic messages for common failure scenarios
  - Fails fast on library API issues, warns but continues on enrichment issues
  - Reports total book count and tested ASIN on successful validation
- **Custom Status Icons**: Replaced Unicode emojis with custom PNG icons
  - busy.png: Spinning hourglass for loading state
  - empty.png: Pulsing icon for no library loaded
  - fresh.png: Lettuce icon for fresh/synced library
  - stale.png: Carrot icon for stale/needs update
  - question-mark.png: Unknown status indicator

### Changed
- Improved file save location messaging: Changed "Downloads folder" to "browser's save location" for accuracy
- **Status Icon Rendering**: Pre-load all status icons and toggle visibility with CSS for instant updates
- **Empty State Text**: Changed "Empty (No Library Loaded)" to "Click here to load library"
- **Dialog Behavior**: Status dialog now closes immediately when file picker opens
- **Grammar Fix**: Singular/plural handling for "1 new book" vs "N new books"
- **Button Labels**: "Sync Now" → "Load Updated Library" for clarity
- **Terminology Consistency**: Replaced all "sync" references with "load" terminology throughout UI
  - "Last synced" → "Library loaded"
  - "New books to sync" → "New books to load"
  - "No data loaded" → "No library loaded"

### Fixed
- Status icon display lag: Icons now update instantly when status changes
- Dialog briefly staying open after file selection
- Manifest caching issue: Added cache-busting to manifest fetch to prevent stale data
- Stale status after "Clear Everything": Now properly clears manifest data for fresh detection

### Technical
- Console fetcher version 3.1.0
- HTML interface version 3.1.0
- All status icons pre-loaded in DOM with CSS display toggling for instant visual updates

## [3.0.0] - 2025-10-16

### Changed
- **BREAKING**: Renamed project from "Kindle Library Organizer" to "Amazon Book Organizer"
- Updated all branding and naming throughout application
- Renamed storage keys (amazon-book-* prefix)
- Renamed database (AmazonBookDB)
- Renamed file references (amazon-library.json, amazon-manifest.json)

### Technical
- HTML interface version 3.0.0
- Console fetcher version 3.0.0
- Using React, Tailwind CSS, and IndexedDB

## [2.5.0] - 2025-10-16

### Added
- Initial repository setup
- Git configuration and GitHub integration
- Project documentation (README, TODO, CHANGELOG)
- MIT License

### Technical
- HTML interface version 2.5.0
- Console fetcher version 2.0.0
- Using React, Tailwind CSS, and IndexedDB
