<!-- TOC -->

- [TODO](#todo)
  - [🔝 Up next](#up-next)
    - [High priority](#high-priority)
      - [Reset App: a Save Backup… button where the box says to save a backup](#reset-app-a-save-backup-button-where-the-box-says-to-save-a-backup)
      - [When the app can't open: Copy diagnostics and Report this problem, right there](#when-the-app-cant-open-copy-diagnostics-and-report-this-problem-right-there)
      - [Help → Report a problem… and Known problems (the GitHub issues)](#help--report-a-problem-and-known-problems-the-github-issues)
      - [One table for every move, copy, paste and delete: what each gesture does in each place](#one-table-for-every-move-copy-paste-and-delete-what-each-gesture-does-in-each-place)
      - [Relay worker: one release of changes (backup alerter, clearer daily email, strict ID check)](#relay-worker-one-release-of-changes-backup-alerter-clearer-daily-email-strict-id-check)
      - [Outside reviews before building: launch risks, security, data safety, a newcomer's first look](#outside-reviews-before-building-launch-risks-security-data-safety-a-newcomers-first-look)
      - [Generated test libraries: made-up books at any size, with their own covers](#generated-test-libraries-made-up-books-at-any-size-with-their-own-covers)
      - [Receipts reach the screen: one screen test per area, not only the log](#receipts-reach-the-screen-one-screen-test-per-area-not-only-the-log)
      - [Turn more of our working rules into automatic checks (my tooling)](#turn-more-of-our-working-rules-into-automatic-checks-my-tooling)
      - [One starter for every process our tools start: a list of their ids, leftovers shown loudly](#one-starter-for-every-process-our-tools-start-a-list-of-their-ids-leftovers-shown-loudly)
      - [Trim the always-loaded rules: one home per rule, history out, a lean memory index](#trim-the-always-loaded-rules-one-home-per-rule-history-out-a-lean-memory-index)
      - [Rebuild the old-style message boxes as standard dialogs](#rebuild-the-old-style-message-boxes-as-standard-dialogs)
      - [Drag any dialog out of the way](#drag-any-dialog-out-of-the-way)
      - [Search improvements](#search-improvements)
        - [Find a book by its ASIN in the search box](#find-a-book-by-its-asin-in-the-search-box)
        - [Search everywhere without leaving the current folder](#search-everywhere-without-leaving-the-current-folder)
      - [Dark theme: fix the unreadable bar and the light strips](#dark-theme-fix-the-unreadable-bar-and-the-light-strips)
      - [Series positions: one Position dialog, and one book at several positions (omnibus)](#series-positions-one-position-dialog-and-one-book-at-several-positions-omnibus)
      - [Phone: show which test build is running](#phone-show-which-test-build-is-running)
      - [Drag a box to select covers](#drag-a-box-to-select-covers)
      - [Fetcher work, in build order](#fetcher-work-in-build-order)
        - [Fetcher odds and ends (progress figure, frozen timer, request pacing)](#fetcher-odds-and-ends-progress-figure-frozen-timer-request-pacing)
        - [The fetchers' own logging: levels and codes, a log on Amazon's site, problems shown in Diagnostics](#the-fetchers-own-logging-levels-and-codes-a-log-on-amazons-site-problems-shown-in-diagnostics)
        - [Stop cleanly when Amazon asks for a human check mid-fetch](#stop-cleanly-when-amazon-asks-for-a-human-check-mid-fetch)
        - [A fetch made with the demo filter on says so, and never marks books as gone](#a-fetch-made-with-the-demo-filter-on-says-so-and-never-marks-books-as-gone)
        - [Faster fetches that report exactly how your library compares with Amazon](#faster-fetches-that-report-exactly-how-your-library-compares-with-amazon)
        - [Fetcher: give the library filter one name, in one place](#fetcher-give-the-library-filter-one-name-in-one-place)
        - [Fetcher: refresh ratings with the price check (books you might buy)](#fetcher-refresh-ratings-with-the-price-check-books-you-might-buy)
        - [Wishlist: record the real format when a book is added](#wishlist-record-the-real-format-when-a-book-is-added)
        - [A long fetch resumes after an interruption (a first fetch, or a full refresh)](#a-long-fetch-resumes-after-an-interruption-a-first-fetch-or-a-full-refresh)
        - [Refresh all books from Amazon — a choice in the fetcher, which the app can pre-select](#refresh-all-books-from-amazon--a-choice-in-the-fetcher-which-the-app-can-pre-select)
        - [A fetch from someone else's Amazon account stops before mixing two libraries](#a-fetch-from-someone-elses-amazon-account-stops-before-mixing-two-libraries)
      - [Honest ownership changes: buying, samples, loans](#honest-ownership-changes-buying-samples-loans)
        - [Fetch should update books it already knows, not skip them](#fetch-should-update-books-it-already-knows-not-skip-them)
        - [Buying a book that's in the Trash should bring it back](#buying-a-book-thats-in-the-trash-should-bring-it-back)
        - [Fetch summary should report books you bought](#fetch-summary-should-report-books-you-bought)
        - [Import summary: every ownership change by kind, kept in the message history](#import-summary-every-ownership-change-by-kind-kept-in-the-message-history)
      - [The left pane, one release](#the-left-pane-one-release)
        - [Book Lists and Searches: pin and sort them like Folders](#book-lists-and-searches-pin-and-sort-them-like-folders)
        - [A type-to-filter box for the left pane](#a-type-to-filter-box-for-the-left-pane)
        - [Jump-to-top / bottom buttons by the scrollbar, in both panes](#jump-to-top--bottom-buttons-by-the-scrollbar-in-both-panes)
      - [Everyday organizing](#everyday-organizing)
        - [Folder dragging: where you drop decides pinned, and the level](#folder-dragging-where-you-drop-decides-pinned-and-the-level)
        - [Stray double spaces in author names create duplicate authors](#stray-double-spaces-in-author-names-create-duplicate-authors)
      - [Tag from Collections, round 2: clearer window, safer tags (decided 2026-10-20)](#tag-from-collections-round-2-clearer-window-safer-tags-decided-2026-10-20)
      - [Restore dialog calls yesterday's backup "today"](#restore-dialog-calls-yesterdays-backup-today)
      - [One safe way to read saved settings — a damaged one can blank the phone app today](#one-safe-way-to-read-saved-settings--a-damaged-one-can-blank-the-phone-app-today)
    - [Polish](#polish)
      - [Buttons name their action: replace the remaining OK, Yes and No buttons](#buttons-name-their-action-replace-the-remaining-ok-yes-and-no-buttons)
      - [Move and copy books anywhere — folders, Book Lists, All Books, Searches](#move-and-copy-books-anywhere--folders-book-lists-all-books-searches)
      - [Retire two leftover book fields: the hidden "seen" flag and the old price-goal field](#retire-two-leftover-book-fields-the-hidden-seen-flag-and-the-old-price-goal-field)
      - [Remove code left over from older versions (hiding single copies, phone tag shelves, unused functions)](#remove-code-left-over-from-older-versions-hiding-single-copies-phone-tag-shelves-unused-functions)
      - [Moving and selecting](#moving-and-selecting)
        - [Delete a book from All Books (removes it everywhere)](#delete-a-book-from-all-books-removes-it-everywhere)
        - [Open one book's details without losing a multi-selection](#open-one-books-details-without-losing-a-multi-selection)
        - [Restore the previous selection after a stray click or Select All](#restore-the-previous-selection-after-a-stray-click-or-select-all)
      - [A folder or Book List you just created stays visible under filters](#a-folder-or-book-list-you-just-created-stays-visible-under-filters)
      - [Book details window: one Save — nothing changes until you click it, and nothing is lost without asking](#book-details-window-one-save--nothing-changes-until-you-click-it-and-nothing-is-lost-without-asking)
      - [Tag lists and long lists, one release](#tag-lists-and-long-lists-one-release)
        - [Long lists keep their actions in view (Manage…, Select All) while you scroll](#long-lists-keep-their-actions-in-view-manage-select-all-while-you-scroll)
        - [One shared tag picker: show all tags in your order (the right-click one silently stops at 10)](#one-shared-tag-picker-show-all-tags-in-your-order-the-right-click-one-silently-stops-at-10)
        - [The "Save results" menu runs off the screen with many Book Lists](#the-save-results-menu-runs-off-the-screen-with-many-book-lists)
        - [Arrow keys should move through every type-ahead list](#arrow-keys-should-move-through-every-type-ahead-list)
      - [Finish keyboard accessibility](#finish-keyboard-accessibility)
      - [Removing a recent search should offer Undo](#removing-a-recent-search-should-offer-undo)
      - ["Bake this order into Manual" for a folder's books and a Book List, from the Sort menu](#bake-this-order-into-manual-for-a-folders-books-and-a-book-list-from-the-sort-menu)
      - [Small fixes](#small-fixes)
        - [What a reset clears: four resets, four different lists](#what-a-reset-clears-four-resets-four-different-lists)
        - [Tidy up the notes](#tidy-up-the-notes)
        - [Leave the affiliate tag off Amazon links on the test rig](#leave-the-affiliate-tag-off-amazon-links-on-the-test-rig)
        - [Switch the affiliate tag to "readerwrangler-20"](#switch-the-affiliate-tag-to-readerwrangler-20)
        - [Tooltips where they help: icon-only, disabled, non-obvious, cut-off](#tooltips-where-they-help-icon-only-disabled-non-obvious-cut-off)
        - [Menus keep their items in place: disable, don't hide](#menus-keep-their-items-in-place-disable-dont-hide)
        - [A book's hover popup stays up after the book is deleted](#a-books-hover-popup-stays-up-after-the-book-is-deleted)
        - [The Trash ignores the search and filters](#the-trash-ignores-the-search-and-filters)
        - [Show only hidden books](#show-only-hidden-books)
        - [Right-click: add "Copy ASINs" below Copy Titles / Copy Authors](#right-click-add-copy-asins-below-copy-titles--copy-authors)
        - [Bulk Edit hints that read like "you can type several values"](#bulk-edit-hints-that-read-like-you-can-type-several-values)
        - [With a filter on, the right pane still shows subfolders with no matching books](#with-a-filter-on-the-right-pane-still-shows-subfolders-with-no-matching-books)
        - [A missing book description: one quiet line, on the computer and the phone](#a-missing-book-description-one-quiet-line-on-the-computer-and-the-phone)
        - [Remove the old version 4 app from the site — it shares your library's storage](#remove-the-old-version-4-app-from-the-site--it-shares-your-librarys-storage)
        - [Every edit rewrites the whole library in storage](#every-edit-rewrites-the-whole-library-in-storage)
        - [The phone's cover copies: still worth it? And why wasn't the browser's own cache enough?](#the-phones-cover-copies-still-worth-it-and-why-wasnt-the-browsers-own-cache-enough)
        - [Relay Setup's Test connection always checks the production relay](#relay-setups-test-connection-always-checks-the-production-relay)
      - [Auto-Organize: Shift-click ranges should follow what you see](#auto-organize-shift-click-ranges-should-follow-what-you-see)
      - [Folder right-click menu: add Auto-Organize](#folder-right-click-menu-add-auto-organize)
      - [Redo should work after copying a folder](#redo-should-work-after-copying-a-folder)
      - [The "open" shortcut: start serve.py if needed and open the app](#the-open-shortcut-start-servepy-if-needed-and-open-the-app)
      - [Working-process safety net: three small follow-ups](#working-process-safety-net-three-small-follow-ups)
  - [🚦 Before public launch](#before-public-launch)
    - [Help, docs and onboarding](#help-docs-and-onboarding)
      - [Site pages use the shared named colors, so all four themes work (the security page's high-contrast light first)](#site-pages-use-the-shared-named-colors-so-all-four-themes-work-the-security-pages-high-contrast-light-first)
      - [Landing page: "Open My Library" for returning users, and "Always free · No ads · No account needed" under the start button](#landing-page-open-my-library-for-returning-users-and-always-free--no-ads--no-account-needed-under-the-start-button)
      - [Say plainly what ReaderWrangler works with: US Amazon, Kindle, English, Chrome](#say-plainly-what-readerwrangler-works-with-us-amazon-kindle-english-chrome)
      - [User Guide: rewrite it around Searches, Book Lists and Folders, as a page you can reach from Help](#user-guide-rewrite-it-around-searches-book-lists-and-folders-as-a-page-you-can-reach-from-help)
      - [A public demo library from Amazon's best-seller lists (nothing personal)](#a-public-demo-library-from-amazons-best-seller-lists-nothing-personal)
      - [Screen capture pass: the sizzle reel, the landing page's before / after, README's old video](#screen-capture-pass-the-sizzle-reel-the-landing-pages-before--after-readmes-old-video)
      - [Build the support assistant (custom GPT)](#build-the-support-assistant-custom-gpt)
    - [Cloud Sync](#cloud-sync)
      - [Cloud Sync: rename Relay, show one Cloud Sync Key, and 'make a new key' retires the old one](#cloud-sync-rename-relay-show-one-cloud-sync-key-and-make-a-new-key-retires-the-old-one)
      - [Relay Setup: smoother sections and clearer Esc / Help behavior](#relay-setup-smoother-sections-and-clearer-esc--help-behavior)
      - [Relay Setup's connection test checks the wrong relay on dev](#relay-setups-connection-test-checks-the-wrong-relay-on-dev)
      - [Relay Setup: disconnect, or reset credentials](#relay-setup-disconnect-or-reset-credentials)
      - [Reset App: one honest message in all four places (what's cleared, what's kept, how to come back)](#reset-app-one-honest-message-in-all-four-places-whats-cleared-whats-kept-how-to-come-back)
    - [Safety and data protection](#safety-and-data-protection)
      - [All the pre-launch data tests pass](#all-the-pre-launch-data-tests-pass)
      - [Outside code libraries: exact versions, integrity checks, and a policy that keeps the page from sending your key anywhere](#outside-code-libraries-exact-versions-integrity-checks-and-a-policy-that-keeps-the-page-from-sending-your-key-anywhere)
      - [Keep your tabs and browsers in step: catch up quietly, never overwrite newer changes](#keep-your-tabs-and-browsers-in-step-catch-up-quietly-never-overwrite-newer-changes)
      - [Lock the Cloud Sync Key in backups with an optional key password](#lock-the-cloud-sync-key-in-backups-with-an-optional-key-password)
      - [Remind me when my last backup is getting old](#remind-me-when-my-last-backup-is-getting-old)
      - [Restore from Cloud Sync: your books and organization back from the cloud copy, no backup file needed](#restore-from-cloud-sync-your-books-and-organization-back-from-the-cloud-copy-no-backup-file-needed)
      - [Restore checks every book, folder and list inside a backup — skip a bad one and say so](#restore-checks-every-book-folder-and-list-inside-a-backup--skip-a-bad-one-and-say-so)
      - [One backup writer: Save Backup and the copy sent to the relay are built twice and already differ](#one-backup-writer-save-backup-and-the-copy-sent-to-the-relay-are-built-twice-and-already-differ)
    - [Costs](#costs)
      - [Move to Cloudflare's $5/month plan around launch](#move-to-cloudflares-5month-plan-around-launch)
  - [🗄️ After launch](#after-launch)
    - [Speed](#speed)
      - [Clicking between books lags slightly while a filter is on](#clicking-between-books-lags-slightly-while-a-filter-is-on)
    - [Relay and sync](#relay-and-sync)
      - [Edit Kindle collections from ReaderWrangler](#edit-kindle-collections-from-readerwrangler)
      - [Smaller organization syncs (send only what changed in your folders, tags and lists)](#smaller-organization-syncs-send-only-what-changed-in-your-folders-tags-and-lists)
      - [Bookmarklet: when your key no longer works, say so plainly — and never show the Channel ID in an error](#bookmarklet-when-your-key-no-longer-works-say-so-plainly--and-never-show-the-channel-id-in-an-error)
    - [Features](#features)
      - ["Read in Kindle": open a book in the Kindle app or Cloud Reader](#read-in-kindle-open-a-book-in-the-kindle-app-or-cloud-reader)
      - [Amazon's official catalog API: prices, titles and covers without a bookmarklet, once eligible](#amazons-official-catalog-api-prices-titles-and-covers-without-a-bookmarklet-once-eligible)
      - [Book recommendations: similar books you own, and ones you don't have yet](#book-recommendations-similar-books-you-own-and-ones-you-dont-have-yet)
      - [Show who a book is shared with (Family Library)](#show-who-a-book-is-shared-with-family-library)
      - [Two-pane split view](#two-pane-split-view)
      - [Library statistics: your unread pile, books per year, top authors and series](#library-statistics-your-unread-pile-books-per-year-top-authors-and-series)
      - [Import book details from a list or spreadsheet; Goodreads / StoryGraph files in and out](#import-book-details-from-a-list-or-spreadsheet-goodreads--storygraph-files-in-and-out)
      - [Capture book ideas from your phone (Share → ReaderWrangler)](#capture-book-ideas-from-your-phone-share--readerwrangler)
      - [Notice when a Kindle edition appears for a print-only book](#notice-when-a-kindle-edition-appears-for-a-print-only-book)
    - [Technical clean-up](#technical-clean-up)
      - [Split the main code file into modules](#split-the-main-code-file-into-modules)
      - [Test on Safari and iPhone](#test-on-safari-and-iphone)
  - [👀 Watching](#watching)
    - [Undo history sometimes empties by itself](#undo-history-sometimes-empties-by-itself)
    - [Find out why some books end up in no folder](#find-out-why-some-books-end-up-in-no-folder)
    - [A screen test that failed once: the File menu not found after the start-up test](#a-screen-test-that-failed-once-the-file-menu-not-found-after-the-start-up-test)
  - [🧊 Someday](#someday)
    - [Formats other than Kindle: undo my Kindle-only preference](#formats-other-than-kindle-undo-my-kindle-only-preference)
    - [Find out whether reading progress can be fetched from Amazon](#find-out-whether-reading-progress-can-be-fetched-from-amazon)
    - [Support stores besides Amazon](#support-stores-besides-amazon)
    - [Several people on one installation](#several-people-on-one-installation)
    - [Animated drag-and-drop](#animated-drag-and-drop)
    - [Share a filtered, read-only copy of your library](#share-a-filtered-read-only-copy-of-your-library)

<!-- /TOC -->


# TODO

> **This file is FUTURE work only.** Each task is a header in short, plain words, so the table of contents above
> reads as the whole list. The first line under a header says why it matters; the details follow. A task being worked on gets
> 🚧 and sits at the top of its section (after any ✅ ones). When a task is
> done, put ✅ at the front of its header; **delete every ✅ section at each release** (after the CHANGELOG sweep).
> The past lives in **CHANGELOG.md**, design rationale in **docs/design/**, retrospectives in **post-mortems/**.
>
> When you promote/descope a task, **move** its section — never leave a stub. When you agree a bug/task mid-session,
> add a section (header + one line) before moving on. The table of contents is rebuilt by the VS Code extension
> "Auto Markdown TOC" when the file is saved in VS Code; a pre-commit check refuses a stale one
> (`git-hooks/check-toc.js`). Headers: about 80 characters, 132 at most, no internal names.

---

## 🔝 Up next

_Formerly: 🔝 TOP OF STACK (Ron 2026-09-09/10; stack state updated 2026-09-16)_

**The order is the order below — the top task in High priority is next**, then down the list; **High priority**, then
**Polish**. The table of contents shows it (Ron, 2026-11-10: the table of contents is how the order is read, so the
tasks themselves sit in that order; the numbered "order of work" list that used to sit here was a second copy, and it
drifted). To change the order, move the task.

### High priority

#### Reset App: a Save Backup… button where the box says to save a backup
<!-- id 20261111-1104 -->

_Why it matters:_ The Reset App box says "Before you reset, save a backup: File → Save Backup." — something the person
can do that instant, so it should be a button there (Law 20: hand them the action, not directions — Ron, 2026-11-11).

**Decided** (Ron + Claude, 2026-11-11)
1. A **Save Backup…** button in the Reset App box's tip — the same save File → Save Backup runs; the box stays open so
   they can then reset (or cancel).
2. "To get everything back afterwards: File → Restore Backup…" stays as directions: it can't be done from this box (a
   restore now would replace the library, and the box is gone after the reset). Its button belongs to the after-reset
   choice ("Restore from Cloud Sync…", item 6).
3. Keep test/test_reset_words.py passing (the shared sentence stays word for word).

#### When the app can't open: Copy diagnostics and Report this problem, right there
<!-- id 20261111-1104a -->

_Why it matters:_ A person whose app won't start sees "Something went wrong" and a Reset App button — nothing about
telling us. The red banner with Copy shows only with "Show a banner when something goes wrong" turned on, and the
error text only on a local server, so on readerwrangler.com they get neither (Ron, 2026-11-11; Law 20).

**Decided** (Ron + Claude, 2026-11-11)
1. **The emergency screen** ("Something went wrong") gets a **Copy diagnostics** button and a **Report this problem**
   link (GitHub issues, as the status bar's Feedback link). The Diagnostics window can't open there — it's part of the
   app that failed — but the logging module loads first and survives, so Copy works (`rwLog.diagnosticsText`).
2. **Not on its "Erase and Reset" confirmation** — one place, offered before anyone reaches the reset.
3. **The reset page** (reset.html) gets the same two — it loads the logging module too, and it's where people land when
   the app won't open at all.
4. Checked 2026-11-11: **no reset clears the kept log** (its key is in none of the four resets' lists, nothing clears
   all storage) — so a copy made after a reset still has the record; offering it before is still the right moment.
5. A screen test with the load made to fail on purpose (the driver serves a broken copy of the app's code — how
   7.27.1's screenshots were taken): the button copies a text with the build line and the error.

#### Help → Report a problem… and Known problems (the GitHub issues)
<!-- id 20261111-1104b -->

_Why it matters:_ The Help menu has nothing for reporting a problem or seeing known ones; only the status bar's small
"Feedback" link reaches GitHub issues (Ron, 2026-11-11).

**Decided** (Ron + Claude, 2026-11-11)
1. **Help → Report a problem…** copies the diagnostics (as Diagnostics' Copy does), then opens a new GitHub issue —
   telling the person the diagnostics are on the clipboard to paste in.
2. **Help → Known problems** opens the issue list.
3. **Open question (Ron, when built):** GitHub needs an account to report, and many readers won't have one — also
   offer email (contact@readerwrangler.com), or GitHub only?

#### One table for every move, copy, paste and delete: what each gesture does in each place
<!-- id 20261106-1237 -->

_Why it matters:_ "Where can books be pasted?" was answered by four lists in the code that disagreed (2026-11-06): Ctrl+V
refused the Inbox while the menu allowed it, and a cut pasted into a Book List or the Trash took the book out of its
folder and put it nowhere, then said "Pasted". Law 4 (Ron, 2026-11-06): the 2nd related break means a missing structure
— one table, read by one function every gesture calls, not a fifth list.

**Status (2026-11-12):** the design is written and **approved by Ron** — `docs/design/ONE-TABLE.md` (the whole matrix;
each "today" cell marked measured, read in the code, or from the survey). Its first rows, the Delete key's, are built
(7.28.1: `gestureTable.js`). Left for this task: the move / copy / paste rows — including three harmful cells found
while building Delete (ONE-TABLE.md §4–5; Ron: "part of the table work"): (1) Ctrl+X then Ctrl+V back into the folder
the books came from leaves them in NO folder while saying "Pasted…"; (2) Ctrl+X / Ctrl+C with books selected also puts
the folder you're in on a separate folder clipboard; (3) F2 on a folder selected in the Folders view does nothing.
Also ONE-TABLE.md §6 item 9: the right-click Delete with books and folders both selected still acts on one kind.

**Decided** (Ron + Claude, 2026-11-06)
1. **Two small tables, one function** — `decide(gesture, what, from, to)`:
   - **gesture → verb:** Ctrl+X then paste = move, Ctrl+C then paste = copy, Shift-drag = move, Ctrl-drag = copy, a
     plain drag = move within one kind / copy across kinds ("Move and copy books anywhere" decisions 6–7), right-click
     Move to / Copy to / Add to Book List >, Delete;
   - **verb × what's moved × from × to → outcome:** do it, with its effects (add / take out of the source / re-file /
     last folder → Inbox) and its receipt; refuse, **with the reason's words in the table**; or ask.
2. **The table drives everything that answers "can I do this here?":** the keys and drags; the right-click menus' enabled
   / greyed items and their "why" tooltips (Law 16); the drag's live label; the tests — a function test fails if any
   combination has no row (like bookMerge.js's ownership registry), and screen tests check each gesture goes through it.
   A pure module, node-tested (the bookFields.js precedent). The work itself goes through the existing operations
   (`moveItems`, the delete operation) — the table decides, it doesn't do.
3. **Delete joins it** — what Del does depends on what's selected and where you are. "The Delete key deletes the folder
   you're in…" (above) is the table's **first user**.
4. **Design doc first, for Ron's red pen:** the whole matrix as readable tables (rows = from, columns = to, one table
   per verb and per kind of thing moved), with **today's behavior** beside the decided one — today's measured by a
   screen test that tries every cell (the LOGGING.md pattern; the 2026-11-06 paste probe was its first slice).

**The survey — at a minimum** (Ron asked, 2026-11-06)
- **Every gesture:** Ctrl+X / Ctrl+C / Ctrl+V; drag — plain, Shift, Ctrl — in the right pane, the left pane and between
  them; right-click Move to / Copy to / **Add to Book List >** / Remove from list / Delete; the Delete key; Restore from
  the Trash; the left pane's own drags (a folder onto a folder, onto a Book List, between two Book List entries — "Move
  and copy books anywhere" decision 10); reordering (folders, pins, Book Lists, books in Manual order); the phone's
  gestures (mobile.js), if any reach the same operations; the keyboard in the left pane.
- **What's moved:** one book, several, books and folders together; a folder (with subfolders); a Book List; a Search.
- **From / to — every kind of place:** a folder (top level, subfolder, pinned), the Inbox, All Books, the library view,
  a Search, a Book List, the Trash, the Removed books review, the section headers (Searches / Book Lists / Folders), a
  left-pane position between entries, the place itself (pasting where it came from).
- **The book's situation:** in one folder or several (last folder → Inbox), already in the destination, hidden, in the
  Trash, a wishlist / sample / owned book, filtered out of view.
- **Each cell's outcome:** do / refuse / ask; the receipt or refusal wording; one undo step; what the menu shows there.
- **Where the code answers today** (the site map — two independent searches, Law 5): the four paste lists (see "Move
  and copy books anywhere" → How), Ctrl+X's refusal list (~5223), every `isSpecialFolder` variant, each menu's
  enable / disable condition, the drop-target highlighting ("no fake drop signals", its decision 11), the integrity
  check's repair (books in no folder → Inbox). **Also found 2026-11-06:** a SECOND keyboard handler (readerwrangler.js,
  "Keyboard shortcuts for folder operations", ~5390) answers Ctrl+X / C / V too, on a separate folder clipboard — one
  Ctrl+C on a selected book was seen copying the current folder as well (timing-dependent; no harm reproduced); and the
  main keyboard listener's dependency list omits the clipboard (stale-closure risk — paste now reads it through a ref).
  And a receipt that claims what didn't happen: Ctrl+V of a book into a folder it's already in changes nothing but says
  *"Pasted 'Written Together' into 'Fantasy'"* (seen 2026-11-06) — an "already there" row needs its own words.
- **Built ahead of the table, in 7.25.1** (the stopgap it replaces — the operations stay): one paste for Ctrl+V and the
  menu (`pasteClipboard`), one answer to "can books be pasted here?" (`pasteRefusal`: a real folder — the Inbox included
  — or a Book List), and the Book List paste (`pasteBooksIntoBookList`: copy adds; cut moves, last folder → Inbox, one
  undo step `PASTE_TO_BOOKLIST_CUT`). Tests PASTE-001–009 — the start of this table's paste rows.

**Related:** "Move and copy books anywhere" (Polish) holds the move / copy semantics this table encodes; its decisions
become rows. 7.25.1 fixes Ctrl+V's harmful cells by those decisions ahead of the table (the stopgap the table replaces).

#### Relay worker: one release of changes (backup alerter, clearer daily email, strict ID check)
<!-- id 20261024-1045 -->

_Why it matters:_ Every relay change is a separate deploy, each needing Ron's yes; gathering them makes one worker
release. And two of them close real gaps today: the relay accepts IDs in a form that silently opens an empty
mailbox, and the Danger zone's wipe may not reach the full copies, which never expire (Ron, 2026-10-24: "I want to
close this out").

**Order of work:** where it sits in High priority — the order of the tasks is the one home for the order.

**What's in it**
1. **C — a shared notepad** for both relays (no user data) — the last step of the relay storage work (7.21.1–7.23.0):
   - dev becomes a **backup alerter** — it sends "[Dev] backup alert" if a limit crossing it has seen for over an
     hour has no production alert recorded;
   - a **"production is alive" check** — alert if production's daily summary is more than 26 hours old.
2. **The daily email counts copies, not just keys.** Today "library generations 4, device-state generations 12" are
   *key* counts — each copy's parts plus its manifest (`groupKeys`, relay-worker.js ~1236) — and device-state has no
   expected count. Say e.g. "library copies 2 (4 parts), device-state copies 4 (12 parts) — at most 2 per channel is
   expected". (Found 2026-10-24; the health judgment was right all along — the cleanup applies keep-2 to real copies.)
   **And no 🚨 on the routine summary** (Ron, 2026-10-30): today every email's subject gets it (`sendAlert`, relay-worker.js
   ~887, "🚨 Daily usage summary - …"), so a normal morning looks like an alarm — red in Gmail's web page. Keep 🚨 for
   real alerts only (threshold, auto-block, cron error); the summary becomes e.g. "Daily usage summary - 2026-10-29".
   **And every "Deleted" line gives the copy's time and age** (e.g. "…dc38, saved 14:27 UTC, 11 min old") — so the
   10-minute rule for unfinished copies can be checked from the email. Today it shows the date only (2026-10-30: Ron
   closed the tab ~5 s after an import; the push that closing triggers was torn after its first part, and the on-demand
   summary ~10 minutes later deleted it — correct, but unprovable from the email).
   **And how recently the cloud copies were used** (Ron, 2026-11-04 — from item 9's last-used date): one line, e.g.
   *"Cloud copies: 2 — used in the last day 1 · week 1 · month 2 · year 2 · idle over a month 0 · idle over a year 0
   (deleted tonight: 0)"* ("idle for a day" is just "not used in the last day" — not shown twice). Dev's test channels
   skew its counts; the dev email already marks test data.
3. **Strict ID check** — moved from the Cloud Sync task (item 4) because it's safe now and closes a gap today: the
   relay's one ID check ignores case while storage doesn't, so an ID in the wrong form opens a separate, empty mailbox.
   Drop the case-insensitive flag (`UUID_REGEX`, relay-worker.js ~45). Every real ID passes, and so does the test
   rig's `22222222-…`.
4. **The nightly email names mailboxes by 6 characters, not 4** (`shortId`, relay-worker.js ~1211) — moved from the
   Cloud Sync task (item 3); it becomes the support code that task shows beside the key. **One way everywhere:** today
   the email names a channel two ways — the last 4 characters (`…21fc`, `shortId`) and the FIRST 8 in the "Kept / not
   judged" and budget lines (`41e0e16f…`, `ch.slice(0, 8)`, ~1287 / ~1304). Use the 6-character support code in every
   line (found 2026-10-30).
5. **The test scripts clean up after themselves:** `relay/test-phase1.mjs` leaves one unimported run on the
   `22222222…` test channel each run (19 now; they expire after 90 days). And since 7.25.0 every run of
   `relay/test-signed-writes.mjs` / the harness leaves small PERMANENT keys for its throwaway channels — a write key, a
   block record, a proof, a first-used record (dev 2026-10-31: 8 write keys, 10 blocked channels, mostly tests). Let
   revoke also delete the channel's write key (the block record is enough), and keep the rest out of the way.
   **Run the tests locally by default** (`cd relay && npx wrangler dev --env dev --local`; `RELAY_URL=…`) and on dev only
   as a final check — the 10-31 release day's dev runs used 23.6% of the account's daily writes.
6. **Once:** compare dev's storage figure in the daily email with the Cloudflare dashboard (open since 2026-10-15).
7. **The daily summaries also go to a dedicated inbox Claude can read** (Resend Inboxes, through MCP), so Ron stops
   pasting them — and Claude reaches only that mail, not Ron's whole mailbox. Until then Claude reads them from Ron's
   Gmail, filtered to `from:alerts@readerwrangler.com subject:"Daily usage summary"` only (Ron, 2026-10-30 — "ReaderWrangler
   Relay - Daily Summary" is the body's first line, not the subject; if item 2 drops the 🚨, the filter still matches).
   Check Inboxes' pricing
   and whether it's still beta when building.
8. **A small "request" note per channel** for "Refresh all books from Amazon…" (High → "Fetcher work, in build order"): a route to write, read and
   delete one encrypted note (the app requests a full refresh; the fetcher reads it at start and deletes it after a
   successful refresh). Idle until the app + fetcher part ships; the signed-writes gate covers its writes. Name the new
   key kind in the daily email.
9. **Delete a cloud copy nobody has used for a year** (Ron + Claude, 2026-11-04). Today a cloud copy whose key was
   lost (so it can't be revoked) keeps its books forever — encrypted, harmless, but storage. The nightly cleanup deletes
   a channel's copies after a year with no activity. **Say so** in the app, on the security page and in the help notes:
   *"A cloud copy nobody uses for a year is deleted. Your library stays safe in your browser and in your backups, and
   the next time you use ReaderWrangler it fills a cloud copy again."* **The app must refill, never mistake "gone" for
   "your library is empty"** (the naming review's "silent empty mailbox" trap) — a returning user's next fetch and next
   change repopulate it. (Considered and rejected: emailing owners of idle copies — it would collect personal data,
   the "encrypted" address would be readable by the server anyway, and deletion-warning emails train users for
   phishing; "Remind me when my last backup is getting old" guards the real disaster instead.)
   **How "used" is known — a last-used date per channel** (Ron + Claude, 2026-11-04), unencrypted, beside the existing
   first-used record (`lifecycle:{id}:used`, relay-worker.js ~473/706): `lifecycle:{id}:last`, a date.
   - **Reading counts as use**, not just writing — someone who only browses on the phone for months must not lose the
     copy they're using.
   - **Written at most once a day per channel** (only when the stored date isn't today) — writes are the free plan's
     tight limit; a read costs only the cheap check.
   - **The year-old cleanup reads it, and also deletes the channel's other permanent leftovers** (its first-used and
     last-used records and its write key), or those pile up forever.
   - **Disclosed with GoatCounter, in the same places** (Ron): the security page's analytics bullet (security.html
     ~113) and the planned privacy policy (outside review 1) — e.g. *"The sync server records the date your cloud copy
     was last used — never what's in it."*

**Watch out**
- One `WORKER_VERSION`; dev first, then production — **Ron's yes before each deploy**; alphas deploy from the branch,
  and both relays are redeployed from main at the release.
- **Never test with a temporary schedule** — Cloudflare's schedule incidents (2026-10-12/13/14) delayed changes by
  hours and a replaced test schedule kept mailing. Test with the on-demand summary instead (PowerShell; one email each;
  Resend allows 100 a day):
  `$k = Read-Host "TEST_ALERT_KEY"; Invoke-RestMethod -Method Post -Uri ("https://readerwrangler-relay-dev.readerwrangler.workers.dev/run-summary?key=" + [uri]::EscapeDataString($k))`
- Leave production channel `58c1bfd7…` alone — another user's data; it expires Dec 7.
- Relay tests: `node relay/test-signed-writes.mjs` and `RELAY_URL=… node relay/test-phase1.mjs` — both run against a
  local relay first (`cd relay && npx wrangler dev --env dev --local`), then dev; both refuse production.
- Inventory tool: `analyze-relay-keys.js` in the TODO notes' folder (key dumps hold channel IDs — credentials — delete
  them after use).
- The shared-numbers commit check must still pass (items 2 and 9 touch the cleanup's rules only if they change keep-2
  or the grace — they shouldn't). (The old item "the wipe reaches everything" was already true — checked 2026-10-31 in
  `handleRevoke`; removed 2026-11-04.)
- Relay tasks that are **app-side, not worker** stay where they are: "Relay Setup's connection test checks the wrong
  relay on dev" and "Relay Setup: disconnect, or reset credentials" (Before launch → Cloud Sync), "Bookmarklet: when
  your key no longer works, say so plainly…" (After launch), "Keep your tabs and browsers in step…" (Before launch), the
  Cloudflare $5 plan (Costs, around launch). The Cloud Sync task keeps its app-side work and the "make a new key" order.
- Tool survey 2026-11-03 (docs/design/TOOL-SURVEY.md): Cloudflare's official skills (`cloudflare/skills`) — the skills only, not the remote
  server with access to the Cloudflare account; the local Workers Vitest plugin for tests; `wrangler telemetry disable`.
- **Channel IDs in the emails in the app's short form** (2026-11-09): the daily summary says "channel 22222222…" (first
  8 only — relay-worker.js ~1383, ~1400); the app's log and Relay Setup now show `41e0e16f...726c` (first 8 … last 4,
  logger.js `shortChannelId`, Ron) so old and new keys read differently. The emails should match.

#### Outside reviews before building: launch risks, security, data safety, a newcomer's first look
<!-- id 20261023-1239 -->

_Why it matters:_ The one outside review we ran (Cloud Sync naming, 2026-10-23) broke our convergence on a weaker name,
predicted a checksum gap the test then confirmed, designed the safe order for retiring a key, and caught two false
claims of mine. Decisions made inside our long conversation can't see their own anchoring — and these five are the
expensive ones to get wrong after launch, so they go ahead of nearly all other work (Ron, 2026-10-23).

**The reviews, one at a time, in this order** (an earlier one can change what a later one should look at)
1. **Launch risks we haven't thought of** — first, because it could reorder the backlog. Seeds: Amazon's terms for a
   tool that reads your Amazon pages (**start from the existing terms-and-strategy note — see TODO notes**; it predates
   the relay, so the review weighs it against today's architecture; and other companies that connect to people's
   Kindle libraries are precedent worth studying — see TODO notes; and **writing back** — "Edit Kindle collections from
   ReaderWrangler" would be the first feature to change a user's Amazon account, a bigger step than reading: weigh it
   explicitly); the Amazon Associates rules for the affiliate tag (a visible disclosure is
   required; self-purchases are a known pitfall); a privacy policy (including GoatCounter and the sync server's
   last-used date per cloud copy — disclosed together, Ron 2026-11-04); Cloudflare's free-tier
   limits as users grow; **book covers on camera** (the sizzle reel and screenshots show real covers — Ron: fair use as
   he sees it, risk accepted, 2026-11-04); **iPhone at launch, or not** (every iPhone browser is Safari underneath — "Test on Safari and
   iPhone", 2026-11-04); support load with one person — including **a support inbox** (Resend Inboxes, announced
   2026-10: an address on our own domain, threads, agents connect through MCP; free up to 3 inboxes) that Claude
   sorts, drafts replies in for Ron to approve and send, and mines into the help notes. Needs web research.
2. **Security and privacy as a whole** — the relay design, the security page's claims, revoke / wipe, the
   bookmarklet's trust in Amazon's page. Two weaknesses turned up by accident during a rename; a dedicated look will
   likely find more.
3. **Data safety: "can a user ever lose their organization?"** — Save / Restore, merging, integrity repairs, undo.
   The pre-launch data tests check what we thought of; this attacks what we didn't.
4. **A newcomer's first look** — the landing page (including the hero button's words and the line under it — Before
   launch task "Landing page: 'Open My Library'…"), the setup steps, the User Guide's *outline* (its text gets a second
   look when it's written). The nearest substitute for the cold testers we don't have. **Weigh our setup against
   one-step imports** (2026-10-30): Readwise Books (an ebook store + reading app, invite-only beta Oct 2026) imports a
   Kindle library with "Connect your Kindle account"; RW needs a bookmarklet dragged to the bar plus Cloud Sync setup.
   We won't copy their way (it needs a server and accounts — our no-account design is deliberate), but a newcomer will
   compare: find the steps we can remove or merge. **Also try Impeccable** (2026-10-31; pbakaus/impeccable — design
   commands plus a 62-check detector for the tell-tale signs of AI-built pages): run its `critique` and `audit` on the
   site pages (index, features, tutorials) and judge it by what it finds; not its "bolder / delight / overdrive"
   commands — Ron is the designer. Read any skill fully before installing it (a skill is instructions that run with
   Claude's permissions).
5. **The big designs decided in conversation, before they're built** — "Move and copy books anywhere". (The Delete
   key was dropped 2026-11-04: it's built before the reviews — its task sits above this one — it's small and well
   decided, and the browser driver tests it.)

**How each runs** (decided Ron + Claude, 2026-10-23)
1. **I write a brief for a cold reader** — background, problems, constraints, questions; none of my verdicts. (Model:
   docs/design/CLOUD-SYNC-NAMING.md as first written.)
2. **A fresh agent, model Fable 5.1 at the highest effort** (Ron: "or whatever is the highest model and mode for
   toughest challenges"), its only input the brief, in **two phases**: (a) a cold answer from the brief alone, written
   down first; (b) then a check against the code and docs — each claim verified, and what changed in its view and why.
   Phase (a) keeps the independence that made the outside review valuable; (b) fixes the reviewer's blind spot (all four
   of Claude.ai's errors were facts about our code it couldn't see).
3. **Its report is saved as a file beside the brief** — Amazon-related parts in the TODO notes, not the public repo.
4. **I spot-check its code claims, then bring Ron a digest with my verdicts.** Ron decides; decided items get the
   anti-bounce rule (only evidence — a real user's misreading, a failing test — reopens them).
5. Claude.ai stays an option for a second opinion from outside our tools, when a verdict looks too comfortable.

#### Generated test libraries: made-up books at any size, with their own covers
<!-- id 20261104-1613a -->

_Why it matters:_ Test data with nothing personal can be committed and backed up anywhere, is identical every run (a
failure always reproduces), plants the awkward cases on purpose, and comes in any size — so the tests stop leaning on
Ron's real library (Ron, 2026-11-04: "it would be nice to migrate away").

**Decided** (Ron + Claude, 2026-11-04 — Claude's call, Ron's ideas)
1. **Generated, not real**, for tests: one generator (today's `test/fixtures/make-small-fixture.js`, grown) with a
   **size setting** — 23 books for exact checks, ~3,000 for scale, 10,000 for stress — and **seeded**, so the same
   "random" library every run.
2. **Titles from a little title machine** (Ron's rules): *The [X] of [Y]*, *Adjective + Noun*, *A [Court] of
   [Starlight] and [Shadow]* (fantasy), *-ing* openers, *Hook: subtitle* (nonfiction) — word lists per category,
   picked by the seeded random ("A Kingdom of Teacups and Regret"). **Lorem-ipsum descriptions.** Cases a test depends on
   keep fixed names (the series a Search looks for, the folder names).
3. **Organization generated too:** folders by author with series subfolders, Book Lists by Amazon tags, some books in
   the Trash, hidden, wishlisted with goals, every ownership kind — the planted cases, at scale.
4. **Covers generated, served by the repo itself** — no website: a small **SVG** per cover (a solid background by genre,
   the title on top — a tiny text file, no image library needed) in `test/fixtures/covers/`, which serve.py already
   serves to the tests on Ron's PC: no internet, nothing test-related on readerwrangler.com or the home server, identical
   every run. The scale library reuses a pool of ~50 rather than committing thousands. (The one path that built an
   Amazon image link from the ASIN — the old CSV loader — was dead code, deleted in 7.26.0-alpha.1; nothing in the
   app's code builds one now, checked 2026-11-05. The screen tests' request detector would catch a new one.)
5. **Ron's library snapshot stays, used rarely** (`.private/test/`): only for "does real data have a quirk we never
   thought to generate" checks — real data catches what nobody imagined.

**How (technical)**
- Packed with the app's own book packer (bookFields.js `packBook`), as the small fixture is. TESTING.md §5 gains the
  sizes and the covers when built.
- **First user — a load-time test at scale** (the 7.27.0 post-mortem's "bug no test would have caught"): Ron's books
  took ~7 s to show on 7.27.0-alpha.1 while every screen test (23 books, no cover copies) said under a second. With a
  generated ~3,000-book library committed, a LOAD test can time "folders on screen" at that scale with a full cover
  cache (as tools/time_load.py does with the private copy) and fail on a regression — with a bound loose enough that a
  slow moment can't fail it.

#### Receipts reach the screen: one screen test per area, not only the log
<!-- id 20261110-1021 -->

_Why it matters:_ Since 7.26.0 every toast goes through the log (`rwLog.log(…, { toast: true })`). If an edit drops the
`{ toast: true }`, the log still records the line, and no check notices that the person no longer sees it. That
happened once in 7.26.0, to the tag-delete receipt: it was found and fixed during the build, but not by any test (the
post-mortem's "bug no test would have caught").

**Done already (2026-11-10, Ron's yes):** `test/ui/test_tags.py` — TAGS-001 (delete one tag) and TAGS-002 (delete
two ticked tags) check that the receipt is on screen, on top and readable. Both were seen to fail with the receipts'
`{ toast: true }` removed.

**The rest — the class:** one such check for each area's main confirmation (ORG: create, rename, delete a folder, Book
List or Search; EDIT: a book's details saved, Bulk Edit; MOVE: a move's receipt; UNDO: Undo / Redo; BACKUP: Save Backup;
SYNC: Import from Relay's summary; AUTO; SHARE…), through the same helper (a toast holding the words, reached by the
pointer). **When:** after "Faster loading" (each screen test then starts in about a second instead of ~35).

#### Turn more of our working rules into automatic checks (my tooling)
<!-- id 20260922-0000c -->

_Why it matters:_ Rules that depend on memory keep failing; automatic checks don't. This affects only how I work, not the app.

**Already done**
- The pre-build checklist watches all app code (2026-10-08); a bounce refuses the whole batch of edits, so none goes
  missing (2026-10-16).
- Since then, more checks run on every commit: the undefined-names check, the version stamps (now incl. the relay worker), and the TODO table of contents.

**Left**
- Item 1 below, and the rule-by-rule sort of PRINCIPLES.md (items 3 and 4: ✅ 2026-11-12, in `main-prime` for review).

**The idea** (Ron, 2026-09-22, after "assuming bit us again")
- Go through docs/PRINCIPLES.md rule by rule and sort each one:
  - **Can become an automatic check** that blocks a commit or release — for example: run the tests before a commit; search for leftover TODO / REMOVE markers before release; version bumped when code changed; cache-busters match.
  - **Judgment only** (never assume, model the legal states, UX first). A hook can only *remind*, and reminders fade into rubber stamps. Give these teeth with a required artifact instead: e.g. every design doc must have an **"Assumptions (and how each was verified)"** section, which a hook can check exists when a design doc is written — catching assumptions at design time, not just at edit time.
- Guard against reminder bloat — the pre-build checklist is already 11 points.

**Open items**
1. **My code safety check can be skipped by accident** (7.19.0 post-mortem). The checklist only fires for my normal editing tool; edits made with a find-and-replace command skip it. Make it fire for those too. Small.
2. ✅ **The version check reads only readerwrangler.html's cache-busters** (found 2026-11-09, 7.26.0-alpha.20) — done
   in 7.27.0: every page's `?v=` stamps are read from the page itself (test/test_version_guard.py, VG-001–005).
3. ✅ **The relay tests start and stop their own local relay** (7.28.0 post-mortem) — done 2026-11-12 (autonomous
   trial): `tools/local_relay.py`; `run_tests.py --tier 3` with no `--relay-url` starts wrangler's local emulator on a
   free port, stops each process it proves it started (by exact id, never `/T`), and checks every port is free
   (RUN-016–021). Follow-up: the screen tests' own relay starter (`test/ui/rw.py` `LocalRelay`) should use it too.
4. ✅ **A release run counts "skipped" as failed** (7.28.0 post-mortem) — done 2026-11-12: `run_tests.py --release`
   fails on any skipped file, naming it and why (RUN-022–024). The release checklist's line in CLAUDE.md names it
   (Ron, 2026-11-12).
5. **A test file can be set aside on purpose — a `skip:` line naming its TODO** (Ron, 2026-11-12: "a good idea, used
   judiciously"). TESTING.md §7 says a flaky test is fixed or set aside, with a TODO, the same day — today there's no
   way to set one aside that the runner understands. A `skip: <TODO id> — why` line in a test file's header: the runner
   skips it and prints why; a release run (`--release`) refuses it (so a set-aside test blocks the next release until
   fixed); the TODO id must exist. Small.

**How (technical)**
- Item 1: the gate hooks only Edit / Write. Add a PreToolUse hook on Bash that spots `sed -i` or redirects onto a root `.js` or the relay worker, and runs the same once-per-turn checklist (reuse `is_app_source()`).

#### One starter for every process our tools start: a list of their ids, leftovers shown loudly
<!-- id 20261112-1240 -->

_Why it matters:_ The tools start processes — a local relay, the screen tests' web server and their own relay — and a
crashed or interrupted run can leave them running, unnoticed (2026-11-11: a hand-stopped relay left four processes on
its port). Stopping by name or pattern risks stopping something that isn't ours (Law 5). (Ron, 2026-11-12 — review
queue Q-020, Q-022, Q-024.)

**Decided** (Ron + Claude, 2026-11-12)
1. **One starter** (grown from `tools/local_relay.py`) for everything our tools launch: the relay tests' relay (done in
   7.28.1's tooling), the screen tests' own relay (`test/ui/rw.py` `LocalRelay`) and their web server.
2. **A list in a file** of every process it started — its id, its start time, what it is, which run started it; an
   entry leaves the list only when the process is confirmed gone (Ron: "keep a list of IDs as you create them, delete
   from list when confirmed dead"). The file outlives a crashed run; the start time means a reused id is never taken
   for ours (Windows has no real process label). Stopping: by exact id, never `/T`, never by name.
3. **Leftovers are shown loudly** — not a line lost in a slew of output (Ron: "draw my attention to it"): at the end of
   the run that left them, at the START of the next run (a banner, with the exact command to stop each), and in
   Claude's "needs your attention" list when reporting to Ron. Something on our port that the list doesn't name is
   reported, never stopped (it isn't provably ours).

#### Trim the always-loaded rules: one home per rule, history out, a lean memory index
<!-- id 20261021-1332 -->

_Why it matters:_ The more always-on text there is, the less each rule stands out — and a rule kept in two or three
files drifts (the single-source lesson behind the gate's design).

**Baseline** (measured 2026-10-21) — loaded into EVERY turn: the Projects-root CLAUDE.md 11.5 K chars + ReaderWrangler's
CLAUDE.md 10.8 K + the memory index (MEMORY.md) 12.4 K = **~35 K chars ≈ 9 K tokens**. On demand only: the gate
checklist 3.5 K (first app edit of a turn), 68 memory files (388 KB, read when relevant), PRINCIPLES 43 K, TODO 154 K.
Tokens aren't the problem (well under what crowds out work); **weight and duplication are.**

**Targets** (Ron + UX, 2026-10-21)
1. **The memory index** (a third of the always-loaded text): its 26-line "Releases" list is history (6.12 → 7.24),
   not how to work — keep the last ~3, move the rest to an "older releases" index file; make every index line the
   one short hook the format calls for (several are paragraphs).
2. **Both CLAUDE.md files:** move history and rationale ("earned when…", "retired in alpha.43…") to PRINCIPLES / the
   docs; CLAUDE.md states the rule and points.
3. **One home per rule:** find rules that live in two or three of root CLAUDE.md, RW CLAUDE.md, PRINCIPLES and memory;
   keep each in one place and point from the others.

**Safety rule:** every removed line is either **moved to its one home** or **listed as deliberately retired, with Ron's
yes** — never silently dropped. Publish the before / after list of moved and retired lines before committing; re-measure
after.

#### Rebuild the old-style message boxes as standard dialogs
<!-- id 20261014-1030ak -->

_Why it matters:_ "Drag any dialog out of the way" (next) must work for these boxes too — done after it, dragging gets
built and maintained twice (Law 5); done first, once, for everything. And every dialog gets one look.

**What's there** (counted 2026-11-02)
- The message boxes — OK/Cancel, type-a-name, progress, choice, "Owned Book" — are hand-built page elements, used in
  about 47 places (info 19, confirm 16, type-a-name 8, progress 5, choice 3, delete-warning 2).
- Since 7.18.0 they behave like every other dialog (Esc, ✕, key blocking), but keep their own hand-built look.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review — moved up from After launch / Dialog look)
1. **Option A:** one shared piece shows each request as a standard dialog; the ~47 call sites stay unchanged; removes
   about 300 lines of hand-built code. Costs a visual check of all 47 — the browser driver can open each and screenshot it.
2. **Before "Drag any dialog out of the way"**, and before the new boxes being designed (the Cloud Sync task's "Make a
   new Cloud Sync Key?", the Disconnect window, the Reset App message) — so they're standard dialogs from day one.
3. When it ships, update CLAUDE.md's dialog rule (it calls this "a low-priority TODO").

**How (technical)**
- `showInfoDialog`, `showConfirmDialog`, `showInputDialog`, `showProgressDialog`, `showChoiceDialog`, `showDeleteWarningDialog`, rendered as `<Dialog>`s by a React "dialog service"; callers keep `await showConfirmDialog(…)`.

#### Drag any dialog out of the way
<!-- id 20260928-0000 -->

_Why it matters:_ Dialogs sometimes cover what you need to see; dragging them aside is a habit from Quicken.

**Order:** after "Rebuild the old-style message boxes as standard dialogs" (above) — so dragging is built once, for
every dialog (2026-11-02).

**What you'd get**
- Drag any dialog by grabbing it anywhere except its controls (buttons, fields, links, lists). The pointer turns into a move cursor to show it.
- Folder Properties used to be draggable on its own; it lost that in 7.18.0 and gets it back here.

**Decided** (Ron, 2026-09-28 and 2026-10-14)
1. **Stays on screen.** By default you can't drag a dialog so far that you lose it; a strip you can grab always stays visible. A dialog can opt in to dragging fully off the window (as Quicken's Search Results and Reconciliation do); prove that with one dialog.
2. **Where dialogs open:**
   - A first dialog opens centered in the window.
   - A dialog opened from another dialog opens centered over the one that opened it, wherever you dragged it. If you moved a dialog aside to read the app, what it opens appears beside it too.
   - Never "wherever it was last time".
3. **Dialogs underneath are frozen for use.** Their buttons and fields do nothing until the top dialog closes, because the top one may be mid-change.
4. **But every dialog can be dragged, including the ones underneath.** Moving a window changes nothing, so it's always safe. Windows doesn't allow this: you have to close back down, move the first window, and rebuild the stack.
5. **Clicking a frozen dialog does nothing.** Above all, it must not close the top dialog. Only a click on empty background closes it. A brief flash of the top dialog is an optional hint.
6. **Where you can grab it: anywhere that isn't a control or text you might select** (Ron left this to me, 2026-10-16). Pressing on text and moving the mouse must keep selecting text — you copy from descriptions, reviews and notes. So you drag by the title bar, headings, labels, margins and empty space; the move cursor shows only there.
7. **Points 4 and 5 are built together:** a click on the background layer first checks whether a dialog lies under the pointer — if so it's a drag (on its grab areas) or nothing, never a close. Dialogs underneath show the move cursor on the same grab areas as the top one.
8. **Stays on screen when the window shrinks too:** a dialog left off screen is pulled back so its grab strip shows.
9. **Computer only.** On the phone dialogs fill the screen, so no dragging there.

**Watch out**
- "Every dialog" covers two kinds: the standard dialogs, and the older message boxes (OK/Cancel, type-a-name, progress; about 45 places use them), which are built differently. Drag must work in both — or, as decided, the message boxes are rebuilt as standard dialogs first ("Rebuild the old-style message boxes as standard dialogs", just above), so drag is built once.
- Today a click anywhere outside the top dialog closes it, including on a dialog showing through underneath. Point 5 changes that rule, so test it carefully.

**How (technical)**
- Build drag once in the shared `<Dialog>` (readerwrangler.js ~61) so every dialog gets it at once. The old per-dialog drag code (`dialogDrag`) is already gone.
- Names from the 2026-09-28 decisions: a `cursor:move` affordance; the off-window opt-in is a `dragBounds:'free'` option.
- Message boxes share their window chrome in `attachDialogDismiss` (readerwrangler.js ~237); add drag there.
- A click on a lower dialog actually lands on the top dialog's full-window background layer (readerwrangler.js ~69–71). The background-click close must ignore clicks that fall over another dialog (`document.elementsFromPoint` under the layer).
- "Not selectable text" (point 6) reuses the 7.19 Ctrl+A area marks: `data-select-text` (text) and `data-select-items` (checklists) — readerwrangler.js ~55–60 — plus inputs, buttons, links, lists. No second list to keep in step.
- New user feature, so it gets its own branch and release.

#### Search improvements

The right pane's search box: one shared matching rule (incl. ASIN), and searching everywhere without losing your place. Build both parts together — they answer the same question: "is this book in my library?"

##### Find a book by its ASIN in the search box
<!-- id 20261012-0000 -->

_Why it matters:_ Handy for checking whether one specific book is in your library.

**What you'd get**
- Type a book's ASIN (e.g. `B08P52K2PZ`) into the search box at the top of the right pane, and it finds the book. Today the box matches only title, author and series.
- The box's placeholder and tooltip say what it searches: "Title, author, series, notes, tags or ASIN".

**Decided** (Ron, 2026-10-16)
1. **One shared matching rule everywhere** — the search box and saved Searches, on the computer and the phone.
2. **It matches title, author, series, your notes and tag names** (as the phone's search box already does), **plus an exact ASIN**: only a complete 10-character ASIN, any case. No partial ASINs — almost every Kindle ASIN starts with "B0", so "B0" would match nearly everything.
3. Known side effect, accepted: an existing saved Search may pick up a few extra books whose notes or tag names contain its word.
4. **Build together with "Search everywhere without leaving the current folder"** (next task): a complete ASIN searches Everywhere automatically.

**Bug this fixes** (found 2026-10-16): the rule exists in **four** copies that disagree — computer search box and saved Searches: title/author/series; phone saved Searches: title/author only (**no series**); phone search box: title/author/series/notes/tags. So a saved Search for a series name finds the books on the computer and nothing on the phone.

**Status:** Ron, 2026-10-12 (came up testing removed books). Small.

**How (technical)**
- Copies: readerwrangler.js ~10020 (live filter), `bookMatchesFilters` ~2269 (saved Searches), mobile.js ~343 (`bookMatchesFilters`, saved Searches), mobile.js ~2287 (search box).
- One `bookMatchesText(book, term, tagLabel)` in uiHelpers (tag names need the tag list — pass a lookup); ASIN = exact match of a 10-character term, case-insensitive.

##### Search everywhere without leaving the current folder
<!-- id 20260829-0000a; merged 20261014-1030an -->

_Why it matters:_ Answers "is this book in my library?" without losing your place.

**What you'd get** (Ron, 2026-08-29)
- The search box still searches the current folder by default. While searching, a toggle shows: **This folder | Everywhere** (as in Finder / Explorer).
- "Everywhere" shows matches from the whole library in the right pane, temporarily. Clearing the search returns you to the folder, scroll position untouched.
- **Discoverability:** when nothing matches, offer *"No matches in ‹folder› — Search everywhere?"* as a one-click link (as Gmail and Amazon do).
- Results work with the existing "where does this book live" popup, so the answer arrives with locations.

**Decided** (Ron + UX, 2026-10-16) — moved here from "Everyday organizing"
- **Build together with "Find a book by its ASIN in the search box"** (above): both answer "is this book in my library?"
- **A complete ASIN searches Everywhere automatically** — an ASIN is unique, so "this folder only" is never what you mean. The toggle shows **Everywhere** so you can see why.

**A third way in: "More by ‹author›"** (Ron + UX, 2026-10-21 — merged from "See an author's other books without
leaving your spot": "Today it takes All Books + a filter + finding your way back")
1. **Right-click a book → More by ‹author›** fills the search with the book's **whole author text** and switches to
   **Everywhere**; clearing it returns you to your spot, scroll untouched (the step above). Author text is **never
   parsed** (AUTO-ORGANIZE-UNIFIED.md): from "Jodi Taylor" it also finds her co-authored books (the search matches text
   anywhere in the field); from "Larry Niven, Jerry Pournelle" it finds that combination — type "Niven" for just him.
2. **Right-click a folder → More by ‹author›** when the author comes from data, not a guess: the folder's **name exactly
   matches an author** in the library (Auto-Organize's author folders, e.g. "Jodi Taylor"), or **every book in it shares
   one author** (a series folder like "Time Police"). Answers "what else of hers do I have outside this folder?" —
   Inbox, wishlist, other folders.
3. **Always in the folder menu, in the same place — disabled, not hidden, when it doesn't apply**: then it reads
   **More by this author**, with the tooltip *"This folder holds books by several authors — right-click one of its
   books."* (the menu rule: "Menus keep their items in place", Polish → Small fixes). On a book's menu it's always
   enabled.

**How (technical)**
- Reuse the view-folder filter-stash plumbing for the temporary view.
- Folder case: the "common author" check Auto-Organize already uses when naming.

#### Dark theme: fix the unreadable bar and the light strips
<!-- id 20261007-0000a; merged 20261014-1030ab -->

_Why it matters:_ Some parts of the screen stay light in Dark mode, and one bar's text is unreadable.

**What you see** (View → Theme → Dark)
1. The bar under the menu bar reading **"📡 New library data available (uploaded …)"** keeps its light blue/purple background while its text turns near-white — unreadable.
2. A light strip shows under the **"🔍 Active: Search …"** bar, and wherever there's a gap between sections.
3. Not yet seen by you, same cause: light boxes in the Auto-Organize preview, and likely more.

**Why** (verified)
- Dark mode works by swapping a specific list of colors. Anything colored outside that list stays light.
- The relay bar's background is a fixed light gradient; the app's outer background is a gradient style that isn't on the list.

**Decided** (Ron, 2026-10-16)
1. **Four themes, two screens.** The computer and the phone both have Light, Dark, High-contrast light and High-contrast dark. A fixed light color breaks High-contrast dark exactly like Dark — check Dark **and** High-contrast dark, on the computer **and** the phone.
2. **The commit-time check comes first and produces the list.** Run once over today's code, it lists every fixed color (15 hard-coded backgrounds/gradients in readerwrangler.js alone, plus color classes the dark theme doesn't cover) — that list *is* the sweep. Fix everything on it; from then on the same check refuses new ones. It covers the app's own screens only: the bookmarklet's panels run on Amazon's pages, outside our themes, so their fixed colors are right.
3. **Fix by naming colors, not by adding override rules** ("excellent idea" — Ron). Today Dark overrides a list of 76 specific style classes, and anything missing from the list silently stays light; that list only grows. Instead, each color gets a name defined once per theme ("surface background", "info bar"...) and the screens use the name. A name missing from a theme then shows up in every theme as soon as it's used (no background at all), not just in Dark — and the commit check can verify that every name used is defined in all four themes.
4. **Shadows the same way — a few named levels** (Ron + Claude, 2026-11-04 — merged from "Leftover desktop polish: one
   shadow direction", whose origin was lost): e.g. menu, dialog, floating card, each defined once per theme, so the
   direction can't drift and the dark themes soften them in one place (a dark-on-dark shadow looks muddy). Today: ~57
   from Tailwind's ready-made set (all straight down — not the problem) and ~49 hand-written (26 in readerwrangler.js,
   23 in readerwrangler.css) — the commit check lists the hand-written ones as it does fixed colors.

**How (technical)**
- Dark remaps Tailwind classes in readerwrangler.css (`[data-theme="dark"] .bg-white {…}` etc.).
- Relay bar: inline `linear-gradient(135deg, #dbeafe, #ede9fe)` with `color: var(--text-primary)` (readerwrangler.js ~9360).
- Outer container: `bg-gradient-to-br from-blue-50 to-blue-100` (~8992) — gradient classes aren't remapped; the Active bar's `mb-4` gap shows it.
- Auto-Organize preview: `#f1f3f5`, `#fafafa`, `#e5e7eb` (~12009 / 12018 / 12046).
- The check (beside `git-hooks/check-names.js`, run from `git-hooks/pre-commit`): flag inline `background: '#…'`, light `linear-gradient`, `from-*/to-*` classes and Tailwind color classes with no theme mapping, in readerwrangler.js / mobile.js / readerwrangler.css and the site pages (index, features, tutorials, security,
  changelog, reset — decided 2026-10-22; NOT the fetchers / nav hub); and flag any `var(--name)` that isn't defined for all four `[data-theme]` values. Move each hit to a CSS variable (e.g. `var(--bg-surface)`); retire remap rules as their classes go.
- Themes: readerwrangler.css `[data-theme="dark"|"hc-light"|"hc-dark"]`; phone adds its own variables at mobile.js ~57–59.

#### Series positions: one Position dialog, and one book at several positions (omnibus)
<!-- id 20260915-0000 -->

_Why it matters:_ Three menu items do nearly the same job under different names (Ron couldn't find the one he needed), and a collection should appear at each place it belongs in its series.

**Today's confusion** (found 2026-10-16) — the book right-click menu's **Edit ▸** submenu has **Position...** (one number for every selected book), **Number by current order...** (1, 2, 3… in the order shown, plus an optional series name) and, three items further down, **Set numbers (13, 13.5, 14…)...** (a comma list, one number per book). Ron tried "1, 4" and "1-3" in **Position...** and the box blocked the comma and dash — while its hint text reads "e.g., 1, 1.5", which looks like a list. Each feature was added at a different time as a new menu item; nobody looked at the whole submenu.

**Decided — one Position dialog** (Ron + UX, 2026-10-16)
1. **Edit ▸ Position... is the only one.** Number by current order... and Set numbers... leave the menu; Edit ▸ becomes Author..., Series..., Position..., Format...
2. **It takes a list; each item maps to one selected book, in the order shown.** `13, 13.5, 14` = three books, one number each. A range `7-15` = 9 items (7, 8 … 15), one per book. **Brackets put several positions on one book:** `(4-6)` = an omnibus. Example: `1,2,3,4,(4-6),7-15` = 14 items for 14 books, the 5th being the omnibus. The same number on two books is fine (Ron owns #4 alone *and* the 4–6 omnibus, bought on sale).
3. **Live preview in the dialog:** each selected book by title with the number(s) it will get, updated as you type. A count mismatch is said plainly ("14 numbers for 15 books — one short") and **Apply** stays off until the counts match.
4. **"Fill 1, 2, 3… in the order shown"** is a button in the dialog that writes `1-N` into the box, ready to edit — not a separate feature.
5. **One book selected:** whatever you type is that book's positions — `1-3` is the omnibus — and `(1-3)` works too (Ron: don't punish what the multi-book form taught you). **The book details window's Position field uses the same rule** — one parser everywhere.
6. **One number with several books selected** (`3`, 5 books) gives them all that number, as today; the preview shows "All 5 books → 3".
7. **No series name in this dialog** (Ron + UX): Series... sits right beside it. If the selected books have no series name, the preview adds one line: "These books have no series name — set it with Edit ▸ Series...".
8. **All of it ships together, omnibus included** (Ron): no in-between version to learn.
9. **Showing an omnibus in a series sort: one entry per unbroken run.** `7-9` shows once, labeled "7–9", at 7 — not three identical covers. `1, 4` shows at 1 **and** 4. `1-3, 5` shows twice ("1–3", "5"). *Side Jobs* `2.5, 4.5, 4.6, 5.5` → three entries ("2.5", "4.5–4.6", "5.5"), each between the right volumes.

**Watch out**
- Amazon's fetch also writes series and position. A hand-entered list (`7-9`) must survive later fetches — the "your edit beats Amazon's" protection hand-edited fields have — or the next library refresh quietly undoes it. Verify when built.
- Until this ships, the Position... hint "e.g., 1, 1.5" keeps inviting a list it blocks (readerwrangler.js ~13365).

**What you'd get**
- **One** book record holding **several** series positions, shown once at **each** position when sorted by series.
- An omnibus that **is** volumes 1–3 (`1-3` or `1,2,3`; today's Raj Whitehall "789" workaround).
- An anthology whose stories fall between volumes (`2.5, 4.5, 4.6, 5.5` — the Dresden *Side Jobs* pattern; today you file it at its first position with the story map in the Note).
- A visible cue on the repeats ("also at 4.5", or a ⟳ badge) — deliberate duplication must look intentional.
- **A folder's manual order shows the book once** (manual positions are per book; repeats belong to series-sorted
  views). **A Book List is different — revised 2026-10-21 (Ron):** it's a reading order, so it holds **one entry per
  run** (*"Side Jobs — 2.5"*, *"Side Jobs — 4.5"*), created when a series sort is baked into it — see "Bake this order
  into Manual…" (Polish), which is built after this task.

**Extension: several series in one book** (MegaPacks, Ron 2026-09-20)
- A public-domain MegaPack can hold scattered volumes of several series at once (e.g. Skylark 1, 4 + Lensman 2, 4), possibly by several authors.
- **Keep the common case simple:** one series → the existing Series field plus a numbers field that takes ranges and lists (`1-3, 5`). A **"+ add series"** link reveals a multi-row editor (series + numbers per row) only for the rare multi-series book.
- Filtering matches if **any** of its series match; sorting uses the lowest position.

**Decided**
- **No duplicate book records**, and no fake ASIN-suffixed books (rejected 2026-09-15): they'd fight ASIN-keyed merging, the removed-books scan would flag them every fetch, and duplicate detection, upgrades and CSV would all need special cases.
- **Per-story notes: out of scope** — you already tag notes free-form.
- The rule "no duplicates in a folder" is untouched.

**Open**
- To spec: CSV export (one row, the list in the column). (Settled 2026-10-16 above: how runs display, and "Number by current order" / "Set numbers" folding into the Position dialog.)
- Multi-author MegaPacks: the compound-author problem is separate and pre-existing — not solved here.

**How (technical)**
- `seriesPosition` becomes a parseable list / range, expanded at sort time into display instances (the `_instanceId` render-layer idea — not duplicate records).
- Generalized: `seriesMemberships: [{series, positions:[…]}]` — a normal book is one entry with one position (uniform data; the UI compacts it).
- Ratified direction 2026-09-15.

#### Phone: show which test build is running
<!-- id 20260922-0000 -->

_Why it matters:_ During testing you can't tell from the phone which build it's on.

**What you see**
- The phone's About shows "App v…" — the last **released** version, which by design doesn't change during testing — and "Mobile v…".
- The desktop shows the live test build (e.g. 7.16.0-alpha.6). The phone can't, since it's a different file. The mobile number does change with each test build, but the "App v" line looks stale.

**The real gap** (found 2026-10-16): the phone's "Mobile v…" moves only when the phone's own file changes, but the phone also runs the shared pieces (date presets, storage, sync). A test build that changes only those leaves **both** phone numbers unchanged — 7.21.2's alpha.1 → .3 all showed "Mobile v1.10.1-alpha.1".

**Decided** (Ron, 2026-10-16)
1. **One live build number for both screens, defined once** — a "Build" stamp in readerwrangler.html, which both load. Both About boxes show it the same way: "Version 7.21.3 · Build 7.22.0-alpha.2".
2. **The commit check refuses any app-code commit that doesn't move it**, so it can't go stale. It retires two hand-kept stamps: the desktop's own build number (`ORGANIZER_VERSION`) and the rule that the phone number copies the desktop's "-alpha.N" ending. "Mobile v" can stay as a plain release number, or go. Update CLAUDE.md's versioning section when this ships.
3. **Tell the installs apart on the home screen** (Ron, 2026-10-15): production keeps its icon and name; the **dev** install gets the icon with a red "DEV" overlay and the name "RW Dev"; and plan now for a **local** install (the PC's server over home Wi-Fi — not used yet, but don't close it off): its own overlay ("LOCAL") and name "RW Local".

**How (technical)**
- `APP_VERSION` (released, frozen during alphas) vs `ORGANIZER_VERSION` (live, desktop only) vs `MOBILE_VERSION` (moves per alpha).
- Home-screen icon + name come from the **web app manifest** (`manifest.json`, linked at readerwrangler.html ~14);
  Android wraps it into a "WebAPK" on install. The dev site serves the SAME files as production, so the manifest
  must be picked at run time: `manifest-dev.json` and `manifest-local.json` (own icon + name each) and a line in the
  startup script that points the `<link rel="manifest">` at the right one via `isDevSite()` / `isLocalServer()`
  (readerwrangler.html ~190). Needs the icon images made (192/512 px, DEV and LOCAL). Reinstall after the change for
  the new icon to appear. Watch out: a local install's address is the PC's home-network address, which can change.
- Build stamp: the version-guard (`git-hooks/version-guard.py`) already knows which staged files are app code
  (`shipped_code_staged`) — require the Build stamp line to change whenever that's true, narrowed to what the app
  itself loads (not pages like security.html or the fetchers, which have their own versions).

#### Drag a box to select covers
<!-- id 20261014-1030q -->

_Why it matters:_ Faster than clicking covers one by one.

**What you'd get**
- In cover view, drag a box to select the covers inside it — the way Windows Explorer does.

**Decided** (Ron + UX, 2026-10-16)
1. **Start the box on empty space only** — the gaps between covers, the margins, below the last row. Pressing on a cover and dragging still moves the book, exactly as today.
2. **Plain drag replaces the selection; Ctrl+drag adds to it** (the same split as click vs Ctrl+click).
3. **Live:** covers highlight as the box passes over them. **Esc** cancels the box and puts back the selection you had before.
4. **Auto-scroll:** dragging past the top or bottom edge scrolls the library, so a box can cover more than one screen.
5. **A rectangle, no lasso.** It can span group headers (e.g. two series groups). Computer only — on the phone, dragging is scrolling.
6. **Looks like Explorer's:** a see-through light-blue fill with a thin **solid** border — never dashed (a dashed outline is the "marching ants" on cut books). Its colors are named per theme (see the Dark theme task): in Dark / High-contrast dark, a brighter see-through blue that stays visible.

**How (technical)**
- Extends `explorerSelectedItems`.
- The library hides off-screen rows during a drag to stay fast with 10,000+ books (drag virtualization, readerwrangler.js ~1530) — so work out which books the box covers from the grid's layout (row/column positions), not from what's drawn; otherwise auto-scroll misses books.

#### Fetcher work, in build order

The fetchers (the bookmarklet's scripts on Amazon's pages) had about a dozen tasks spread over five
sections, though they depend on each other — the human-check stop needs the shared request wrapper, faster fetches
and the ownership batch share one completion window, resume and refresh are the same long run. Gathered 2026-11-04
(TODO scan, Ron + Claude) like the worker release: one build order, and fewer separate test rounds on Amazon (each
one a chance to trip its human check).

**Build order**
1. The shared Amazon request wrapper — "Fetcher odds and ends…", item 3; then "The fetchers' own logging…" (its comb
   then sorts one wrapper's lines instead of many copies, and every later fetcher change leaves a trace).
2. "Stop cleanly when Amazon asks for a human check mid-fetch" — lives in that wrapper.
3. The "partial fetch" label — "A fetch made with the demo filter on says so…" (resume's stages use it too).
4. "Faster fetches that report exactly how your library compares with Amazon", with its riders: odds-and-ends items
   1–2, "Fetcher: give the library filter one name…", "Fetcher: refresh ratings with the price check…",
   "Wishlist: record the real format…".
5. "Honest ownership changes: buying, samples, loans" (the group right after this one) — its fetch summary shares
   step 4's completion window.
6. "A long fetch resumes after an interruption", then "Refresh all books from Amazon" (the same long run; its
   request note is in "Relay worker: one release…", item 8).
7. "A fetch from someone else's Amazon account stops before mixing two libraries".
- Stays elsewhere: "Bookmarklet: when your key no longer works…" (After launch).


##### Fetcher odds and ends (progress figure, frozen timer, request pacing)
<!-- id 20260903-0000a -->

_Why it matters:_ Small fetcher fixes that are each too minor to stand alone.

**The list**
1. Fix the "772%" figure in the details-filled ratio.
2. The elapsed time freezes during the "Checking Relay" (both lines) and "Recovering" phases — it only repaints when the phase or progress changes. (Ron, 2026-09-03, twice.)
3. **One shared Amazon request wrapper for every fetcher** (corrected 2026-11-04 in the TODO scan — the pacing itself
   already exists: since 7.0.1 (2026-08-27) `amazonFetch` keeps a minimum gap of ~350 ms between request STARTS,
   set just below the measured round trip so it costs nothing today. But it's **copied into 3 fetchers** (library,
   collections, series), and the **bibliography fetcher bypasses it** with direct requests (`win.fetch`,
   author-bibliography-fetcher.js ~361 / ~396); the wishlist fetcher reads the page and makes none.) What's left —
   the decisions of 2026-10-22 (Ron + UX), still standing:
   1. **One copy, in one shared file the bookmarklet hub loads before any fetcher**; every fetcher uses it — a start
      gap across EVERY request to Amazon, whichever fetcher sends it.
   2. **Make bypassing it impossible:** inside OUR fetcher scripts `fetch` / `XMLHttpRequest` are shadowed by a local
      that throws *"Requests to Amazon go through amazonFetch"*; `amazonFetch` keeps the real one. **Never override the
      page's own `window.fetch`** (the page is Amazon's). Plus **a commit check** refusing a direct request in the
      fetcher files (it also catches an explicit `window.fetch`, and paths a test run never reached).
   3. **Visible if the floor ever waits** (Ron: "an excellent addition") — Amazon got faster than when we measured:
      say so in the fetch summary or console ("paced N requests to the safe rate").
   4. **Re-measure the floor** in one normal full fetch and write where the number came from beside the constant.
   5. It's also where the human-check stop lives ("Stop cleanly when Amazon asks for a human check mid-fetch").
4. **The collections fetcher's finish message names a file it no longer writes** (found 2026-11-11 by a sweep for
   amazon-library.json): it uploads to the relay (its console says so), then shows *"Updated amazon-library.json with N
   books' collections"* (amazon-collections-fetcher.js ~866, its `FILENAME` constant; the header comment's steps
   describe the old file too). Say what happened: the collections were sent to Cloud Sync. The wishlist and series
   fetchers only define the old name (`LIBRARY_FILENAME`, never used) — remove it ("Remove code left over…").

**Decided** (Ron + UX, 2026-10-22): items 1–2 as listed (the "772%" ratio can't exceed 100% — fix the formula; the
elapsed time redraws on a one-second tick while a fetch runs). **Item 3 comes first in "Fetcher work, in build
order"**; items 1–2 ride with "Faster fetches…" — same file, same test, and that task already rebuilds the timing
table.

**How (technical)**
- Item 3: `MIN_REQUEST_INTERVAL_MS` + `amazonFetch` (amazon-library-fetcher.js ~41–49; copies in the collections and
  series fetchers ~31); the collections fetcher still carries an unused `FETCH_DELAY_MS = 0` (~51). (Two items moved out 2026-10-20: the live ownership-upgrade test is now in "Fetch should
  update books it already knows", un-trash on upgrade is "Buying a book that's in the Trash should bring it back".)

##### The fetchers' own logging: levels and codes, a log on Amazon's site, problems shown in Diagnostics
<!-- id 20261110-1043 -->

_Why it matters:_ Since 7.26.0 every message in the app has a level, an area and a code, and lands in a kept log that
the Diagnostics window shows. The fetchers and the bookmarklet menu still print plain console lines on Amazon's pages,
where nobody is looking — so a fetch that went wrong leaves no trace support can read.

**Decided** (Ron + Claude, 2026-11-05 / 11-09 — moved here from "One logging module…", item 10, when the module
shipped; design of record docs/design/LOGGING.md §2b and §5 step 5.5)
1. **Their own comb**, like the app's: the fetchers' and bookmarklet menu's ~140 error and ~18 warning lines (counted
   2026-11-04) each get a level, an area and (warning and above) a code — or go as noise. **Published for Ron's red
   pen before any is switched.** Their ~430 progress lines stay: the step-by-step trail of a fetch support needs.
2. **The same two switches, stored on Amazon's site** (whose storage is separate from ours): set from the console, or
   a toggle in the bookmarklet menu's developer mode.
3. **Two logs, never the relay** (LOGGING.md §2b): the fetchers keep theirs on amazon.com; a fetch's warnings and
   errors ride inside its existing upload (no extra relay writes), and the app's Diagnostics window shows them as
   their own group, *"From your last fetch (date)"* — not mixed in by time, so two computers' clocks never need to
   agree (2026-11-09).
4. **The same cleaning:** no full Channel ID or passphrase in anything kept or shown — the app's form is logger.js
   `shortChannelId` (first 8 … last 4). The fetchers don't load logger.js (they do load relay-client.js), so how they
   share that one function is open — decide it with "Bookmarklet: when your key no longer works…", which needs it too.

**When:** right after the shared Amazon request wrapper (this group's build order, step 1).

##### Stop cleanly when Amazon asks for a human check mid-fetch
<!-- id 20261014-1030au -->

_Why it matters:_ Today it shows confusing errors instead of saying what to do.

**What you'd get**
- When Amazon interrupts a fetch with an "are you human?" check, the fetcher stops and says: *"Amazon is asking you to
  confirm you're human. Open any Amazon page, complete the check, then run the bookmarklet again. Nothing in your
  library was changed."* (wording revised 2026-11-02 — "nothing was changed" is what a worried person needs most).
- That last clause is literally true since 7.0: an unfinished run is never committed.

**Status**
- The start of a fetch is already guarded; this covers a check appearing **partway through**. Never seen yet — cheap insurance before launch. (From an outside review, item 7.)

**Decided** (Ron + Claude, 2026-11-02, in the TODO review)
1. **Detect it in the ONE Amazon wrapper**, `amazonFetch` ("Fetcher odds and ends (progress figure, frozen timer,
   request pacing)", item 3 — every Amazon request goes through it, the fetcher scripts' own `fetch` disabled) — not in
   each fetcher's retry path. Every fetcher gets it, including later ones. Built right after that wrapper (this
   group's step 2).
2. **The long runs are the likeliest to trip it** — a new user's first big fetch, and "Refresh all books from Amazon".
   Seen 2026-11-03: Ron got a check after a few quick searches in Amazon's own search bar (not from our requests) — the
   first one he's ever had; quick repeated requests are what trips it, so pacing in `amazonFetch` matters.
   Once "A long fetch resumes after an interruption" exists, the message becomes "…then run it
   again — it continues where it stopped".

**How (technical)**
- In `amazonFetch`, recognize check-shaped answers: HTML where JSON was expected, a validate-captcha redirect, a robot-check 503.

##### A fetch made with the demo filter on says so, and never marks books as gone
<!-- id 20261014-1030be -->

_Why it matters:_ A demo filter left on (it's used to record tutorials) makes a fetch send only a few dozen books.
Since 7.19 a fetch missing books flags them "no longer in your Amazon library" — so a forgotten filter would flag
~3,200 books as gone from Amazon and ask you to review them. Nothing is lost (Keep exists), but it's alarming and
wrong.

**What it does today** (checked 2026-11-01)
- The demo filter is a browser setting on Amazon's site (`readerwrangler-demo-whitelist-enabled` + its list), turned
  on by `tools/demo-library/demo-whitelist-loader.js` (moved from `tutorials/work-products/demo-library/` 2026-11-02); the library and collections fetchers then send
  only the listed books. Nothing in the shipped code turns it on — the old "no demo setting can ship" guarantee already
  holds by construction.

**Decided** (Ron + Claude, 2026-11-01, in the TODO review — Law 18: a stopping prompt is a block in a polite coat)
1. **The fetcher labels a filtered fetch** ("demo fetch" — a partial fetch). The app then never concludes from it that
   books left Amazon, and the import receipt says so: *"Demo fetch: 40 books (the demo filter is on) — nothing else
   changed."* A fact, not a guess from the size.
2. **A banner you can't miss in the fetcher while the filter is on** (the point of effect, Law 16).
3. **No "much smaller upload — are you sure?" confirmation.** For the demo case the label is better; for any other
   shrunken fetch (Amazon returning half a library), the 7.19 removed-books review is already the safety net — nothing
   is deleted, you're asked.
4. Build it with, or before, the screen capture pass (Before launch) — that's when the demo filter gets used.
5. **The label is shared** with "A long fetch resumes after an interruption" (its stages are partial fetches too) —
   one "partial fetch" label, one rule in the app: never infer removals from a fetch that says it's partial.

**How (technical)**
- Old review item 6f; the demo setting is the "demo whitelist" (amazon-library-fetcher.js ~104 / ~995 / ~1662;
  amazon-collections-fetcher.js ~56). The "no longer in your Amazon library" inference: readerwrangler.js ~194 / ~5670
  (docs/design/ORPHAN-CLEANUP.md §2).

##### Faster fetches that report exactly how your library compares with Amazon
<!-- id 20260919-0000a; merged 20260903-0000 -->

_Why it matters:_ Every fetch makes you wait about a minute before you can import, even to grab one new book — most of it a full-library scan that runs twice. And the fetch still can't honestly say "your library matches Amazon exactly", or list the differences.

_Merged 2026-10-20 (Ron + UX) with "Fetch: report exactly how your library compares with Amazon" (spec'd 2026-09-03): the
same full-library pass gives both the speed and the report — one task, two build steps, in order._

**What you see** (Ron, 2026-09-19, patching $0.99 series holes: buy → download → import, again and again)
- Each fetch takes ~1 minute before its books are uploaded, then keeps going with the removed-books check.

**Why** (measured 2026-10-16 from Ron's fetch log: 3,251 books in ReaderWrangler, 2,860 in Amazon's library)
1. **The timing table hides most of the wait.** Its steps add to 14 s (prices 9 s, genres 3 s, the rest ~1 s); the total is 1 min 6 s. The missing ~52 s is the **"🩹 Recovery sweep"** — a full scan of the Amazon library (~96 pages), **before** the upload, not in the table.
2. **The sweep runs on every fetch by mistake.** It should fire only when ReaderWrangler's book count differs from Amazon's, but the count includes wishlist books, which Amazon's library list never has (3,251 vs 2,860) — so they never match.
3. **The removed-books check then scans the same full library again**, after the upload. Every fetch reads the whole library twice. (The code's own comment: "ideally folded into the orphan scan, which already does a full pass.")
- The fetcher already keeps "new books" apart from the rest: new titles are incremental, details only for new books + the few still missing a description, genres only where missing, prices only for books whose price matters.

**Step 1 — one pass, at most once a day: the speed** (decided Ron, 2026-10-16)
1. **One full-library pass instead of two, after the upload.** One scan answers both questions: books Amazon has that we're missing (recover them) and books we have that Amazon no longer lists (removed books). Your new books are uploaded before it starts — the wait before you can import drops from ~1 minute to ~15 seconds.
2. **It compares sets of books, not counts** (the count-based sweep compared things that can never be equal — retire it):
   - on Amazon but not here → missing books → fetch them by ASIN, upload as a small follow-up run;
   - here but not on Amazon → **candidates** for "removed" → re-check just those before flagging.
3. **Then at most once a day** for that pass and the wishlist re-pricing. A day matches when prices start showing as stale (KB §16), so price-watching doesn't suffer. **Always:** new books and their details (series, cover, description) — you need them to file the books.
4. **When it skips, it says so** in the fetch's completion window, with one click to run them anyway: *"Skipped the full refresh (prices, removed-books check) — already done today. Do it now?"*
5. **The timing table lists every step**, the full-library pass included — it hid 52 of 66 seconds.
6. **No Shift/Alt-click shortcut** for this — Windows reports those keys unreliably on clicks, and nobody would discover it.

**Step 2 — the honest report, built on that pass** (spec'd 2026-09-03 by live investigation)
- **The goal:** your library matches Amazon **exactly** — 2,801 = 2,801 unique owned books — once both sides are counted the same way.
1. **Same scope on both sides, unique books.** ReaderWrangler's side excludes the wishlist (337). Amazon's side is de-duplicated: Amazon's total counts **purchase records**, not books (15 sample-then-buy pairs in your data), so use it only as a progress estimate.
2. **Keep Amazon's standard filters everywhere.** Log the filtered-vs-unfiltered difference each fetch (13 today) as an early warning if Amazon reclassifies things.
3. **What you see** (in the same completion window as step 1): a two-way "Removed-books check" report — each direction hidden when it's 0, no "orphan" jargon, an ℹ️ note that they're "still safe in ReaderWrangler". When both are 0: *"Your library matches Amazon exactly."*

**Already done** (toward the report)
- 7.7.0 (2026-09-04) stopped the false alarms: 13 "removed" books were physical items (maps, a DVD, "Shoes") the scan wouldn't count.
- The false-orphan bug itself was fixed in fetcher v5.2.7.
- Two other suspects were checked and ruled out (see TODO notes).

**Also**
- Build together with "Fetch summary should report books you bought" (in "Honest ownership changes", below) — same
  completion window.
- When shipped, update SUPPORT-KB §16: "prices are as fresh as your last fetch" and "every wishlist book is re-priced each run" stop being true.

**How (technical)**
- Recovery sweep: amazon-library-fetcher.js ~1728–1790 (`shouldSweep` compares `existingBooks.length + newBooks.length`, wishlist included, with `stats.libraryTotalCount`). Orphan scan (Phase 5): ~2780. Fold the sweep into Phase 5: one ASIN listing → recover (Amazon has, we don't) + orphans (we have, Amazon doesn't). Recovered books then go in the follow-up run Phase 5 already sends.
- Timing: add the full-library pass to `stats.timing` and the ⏱️ TIMING table.
- Remember `lastFullPassAt` in the relay (shared by all your computers), not browser storage.
- A fetcher (bookmarklet) change, same for all three bookmarklets.
- Comparison details (filters, totals): see TODO notes.

##### Fetcher: give the library filter one name, in one place
<!-- id 20261014-1030u -->

_Why it matters:_ An unexplained code string is repeated in four places; one named setting is safer to change.

**Background** (checked 2026-10-14)
- An old fetcher fix (`ee6d83c`, June 2026) had two parts. Both were lost when the fetcher was later rewritten.
  1. **A notice for books Amazon has delisted — done.** Since fetcher v4.11.0, the end of a fetch shows a banner:
     "recovered N previously-missing book(s); M unavailable/delisted (see console)".
  2. **Name and explain the library filter — still missing.** This task.

**Removed vs. delisted — two different cases**
- **Removed books** have **left** your Amazon library: a returned loan, a sample you deleted. They're no longer in the
  list Amazon sends. These are what **Tools → Removed books** (7.19.0) handles.
- **Delisted books** were withdrawn from Amazon's **catalog**, but you still own them. They're **still in** your Amazon
  library list, just with no title, author or cover attached. The removed-books check deliberately counts them as
  present, so they never reach the Removed books dialog. A delisted book that can't be filled in at all is what the
  end-of-fetch banner (part 1 above) reports.

**What the filter is**
- When the fetcher asks for your library it applies the same default filter Amazon's own Your Books page applies.
  Today that filter is a long code string pasted into **4 places** in the fetcher (re-counted 2026-10-22) — changing
  it means editing all 4 identically, with nothing saying what it is. What it hides: see TODO notes.

**To do** (Ron + UX, 2026-10-22 — per the notes rule: the code keeps what it needs, explanations stay private)
- Put the whole filter in **one** named constant, used in all 4 places. No change in behavior. Small.
- **Its code comment stays neutral** — e.g. "the default filter Amazon's own Your Books page applies" — the meaning of
  each part lives in Amazon-Reference.md (shipped code is public; the 2026-10-14 draft comment explained Amazon's tags).

**How (technical)**
- The 4 queries: amazon-library-fetcher.js ~1040 (start-up test), ~1449 (main fetch), ~1748 (recovery sweep),
  ~2805 (removed-books check).
- Delisted = "product-null" in the code: the removed-books check adds those ASINs as present (~2869–2878).
- A fetcher change: bump `FETCHER_VERSION`.

##### Fetcher: refresh ratings with the price check (books you might buy)
<!-- id 20261014-1030af -->

_Why it matters:_ Ratings are frozen at a book's first fetch — fine for owned books, a little stale for buying
decisions.

**Decided** (Ron + Claude, 2026-11-03, in the TODO review — was "Now and then, refresh ratings for books you might buy",
After launch → Prices; moved here as a small fetcher change to ride along with the next one)
- **Ride along with the price check — no schedule.** The price step already asks Amazon about exactly these books on
  every fetch (books you could still buy, new books, owned books with a price goal — 30 per request, since 5.1). Add the
  rating and review count to that same request: ratings stay fresh on every fetch with **no extra requests** — no
  monthly sweep, no every-Nth-fetch counter. Safe to interrupt for free (the same run).
- Not the outside review's per-book adaptive timing — a fine solution to a scale problem we don't have.

**How (technical)**
- amazon-library-fetcher.js price step (`qvGetMediaMatrixProductsQuickView`, ~2316): add `customerReviewsSummary
  { rating { value } count { displayString } }` (as the enrichment request already asks, ~1482); store `rating` /
  `reviewCount` as the first fetch does (~1617). Bump FETCHER_VERSION. (Outside review item 3.)

##### Wishlist: record the real format when a book is added
<!-- id 20261014-1030bf -->

_Why it matters:_ Today the format is only known after the book's details are filled in.

**Already done** (checked 2026-10-22)
- 6.12.0: adding a single book from its page records the format.
- 7.21.3: **Add Bibliography to Wishlist** takes Kindle books only and records "Kindle Edition" on each
  (author-bibliography-fetcher.js ~462).

**Left — one line** (Ron + UX, 2026-10-22)
- **Add Series to Wishlist** asks Amazon for Kindle editions only, so every book it adds is Kindle — but it never writes
  that onto the book (series-page-fetcher.js, the book built ~464), so the app falls back to its default. Set the
  format to **"Kindle Edition"** (FORMAT-POLICY's spelling, as the bibliography fetcher does).
- A fetcher change shared by all three bookmarklets: dev and prod together.

##### A long fetch resumes after an interruption (a first fetch, or a full refresh)
<!-- id 20260821-0000 -->

_Why it matters:_ A 3,000-book fetch that dies near the end starts over from scratch — a new user's first fetch, and
now also every "Refresh all books from Amazon" run, the likeliest to trip Amazon's human check partway through.

**What happens**
- A long fetch fills in details for ~3,000 books with no resume point. If it dies at book 2,800, it starts over.

**What you'd get**
- The fetch sends its progress in stages, so a re-run skips what's already done. 7.0's upload design makes this natural.

**Status**
- (From the 2026-08-21 outside review, item 1.) Priority raised 2026-11-02 — it no longer "hits each user exactly
  once": "Refresh all books" makes long runs repeatable, and the human-check stop's message ("…it continues where it
  stopped") depends on this.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review)
1. **Each stage says it's partial** — the same "partial fetch" label as "A fetch made with the demo filter on says so,
   and never marks books as gone". One concept, one label: a fetch that knows it's incomplete says so, and the app never
   concludes from it that books left Amazon. The final stage completes the set.
2. **Mind the write budget:** progress saved every few hundred books (≈ 6–8 stages for 3,000), not per book — every
   stage costs relay writes against the account's shared 1,000 a day.
3. **One cluster:** this, "Refresh all books from Amazon", and "Stop cleanly when Amazon asks for a human check
   mid-fetch" — all built on the `amazonFetch` wrapper — built together or back to back.

**How (technical)**
- Send enrichment progress as mailbox letters in stages, so a resumed run's skip-hint already knows what's done.

##### Refresh all books from Amazon — a choice in the fetcher, which the app can pre-select
<!-- id 20261014-1030 -->

_Why it matters:_ Fetches are incremental — they build on the books the cloud copy already holds, and only re-read
deeper when the counts disagree with Amazon. So book details that went stale or wrong (a cover, rating, description,
series Amazon later corrected — or a damaged record) are never re-read. Today the only way out is clearing the cloud
copy with the browser's developer tools. (Not a clean restart — that's Tools → Reset App, plus the Danger zone wipe for
the cloud copy.)

**Decided** (Ron + Claude, 2026-11-01, in the TODO review)
1. **Name:** "Refresh all books from Amazon" — plain and exact. Not "integrity" (the app's integrity check is a
   different thing) and not "scan and fix" (it touches only book details from Amazon, never folders, tags or anything
   you organized).
2. **Delete nothing first.** The run re-reads every book (ignoring what the fetcher already knows) and imports like any
   fetch; a refresh that fails halfway leaves the old copy intact. (Law 18's explicit-verb rule — not destroy-then-
   rebuild.)
3. **The control lives in the fetcher; the app can pre-select it** (Ron): under "Send Library to ReaderWrangler", **☐
   Refresh every book (slower)** with a tooltip on when to use it ("if book details look wrong or out of date"). From
   the app, **Tools → Refresh all books from Amazon…** explains it and *requests* the refresh — the next fetch's box then
   starts ticked, with "requested in ReaderWrangler on <date>". Either side can override.
4. **When the request clears:** only after a refresh **finishes successfully** — a failure keeps it pending. Unticking
   in the fetcher means "not this time" (it says "Full refresh still pending — it'll be offered next time"); cancelling
   for good is done in the app (Cancel request).
5. **The pending state is never invisible** (Law 16): while waiting, the menu item reads "Refresh all books from
   Amazon… (requested — runs on your next fetch)". If a fetch arrives after the request and it's still pending, the app
   says so — "Your last fetch (<date>) didn't include the full refresh — it's still pending" (unticked, or an older
   bookmarklet). The import's fetch date is the evidence; no second "the fetcher knows this feature" flag needed.
6. **How they talk** — the app and the fetcher run on different sites and share no browser data; they share the cloud
   copy. The request is a **small note on the relay**: written by the app (encrypted with the key, a signed write),
   read by the fetcher at its start (one small extra read), deleted by the fetcher after a successful refresh (signed).
   Not inside the library copy (re-uploading it to flip a flag), not in device-state (~17 MB to read one flag), not a
   mailbox upload (those flow bookmarklet → app). **Build it as the general "requests from the app to the bookmarklet"
   channel** (2026-11-02) — this refresh request is its first user; "Edit Kindle collections from ReaderWrangler" (if it
   ever happens) would be another. One mechanism, not two.
7. **Ships in two independent parts** (Ron): the relay's small note route goes early — in "Relay worker: one release of
   changes" (idle until used; the signed-writes gate covers it). Then the app + fetcher together (they go out in the
   same push anyway); each fails safe — a fetcher that can't read the note just fetches normally, an app that can't
   write it says the refresh isn't available yet.
8. The library fetch only — collections are re-read in full each time (confirm when building). Same Amazon pacing
   (`amazonFetch`). **Pair it with "A long fetch resumes after an interruption"** — a full refresh of
   3,000+ books is that same long run.

**How (technical)**
- Old review item 6g. The fetcher's incremental start: `loadKnownBooks` (relay-client.js); the automatic fuller pass
  when counts disagree: SUPPORT-KB §14 item 3.

##### A fetch from someone else's Amazon account stops before mixing two libraries
<!-- id 20261103-1525 -->

_Why it matters:_ Nothing checks whose Amazon account a fetch comes from. On a shared computer, someone signed in to
*their* Amazon account who clicks *your* bookmarklet (it carries your Cloud Sync key) sends their books into your
library — and the fetch, comparing your library with "their" Amazon account, can flag your books as removed. Undo
doesn't reach that.

**Decided** (Ron + Claude, 2026-11-03, in the TODO review — split out of "Several people on one installation")
1. **The library remembers which Amazon account it belongs to** (set on its first fetch). Amazon's pages already ask for
   the signed-in account's name, so the fetcher reads it with no extra request (Amazon's side: see TODO notes).
2. **A fetch from a different account stops before sending anything** and says plainly: *"You're signed in to Amazon as
   Dana, but this library belongs to Ron. Fetching would mix two people's books."* — with an escape for the rare real
   case: **"It's the same person — continue"**. A stopping prompt, which Law 18 normally rules out — justified here
   because the damage can't be undone (Ron, 2026-11-03).
3. **Same rule as the demo-filter task above:** a fetch that didn't see your real library never marks books as gone.
4. The better answer for a household: one browser profile per person (see "Several people on one installation").
5. **The same account name can guard Restore** (2026-11-04): a backup carrying "belongs to Dana" lets Restore say
   *"This backup belongs to Dana — restoring replaces your library."* before replacing anything.

#### Honest ownership changes: buying, samples, loans
<!-- id 20261014-1700 -->

_Why it matters:_ When a book changes kind — bought, a sample, a loan, a book in the Trash — ReaderWrangler should notice, tell you, and never lose your settings.

**What this is**
- One batch, ratified 2026-09-04 (formerly its own section, "⏸️ On hold: honest ownership changes"). **Status: queued**
  (Ron, 2026-10-20 — no longer on hold). Its tasks are below, **in build order**: the rules doc and the foundation
  first, then the data fixes, then the summaries (the polish end — there's nothing honest to report until the fetch
  notices changes). **"Fetch should update books it already knows" goes first.**

**Already shipped from this batch**
- 7.7.2 (2026-09-07): Imports reclaim old upload storage. Its outstanding proof is **settled**: 7.21.1 reclaims on every
  save, and since 7.23.0 (2026-10-20) production's nightly storage check confirms nothing is left over.
- 7.8.0 (2026-09-08): the ownership dialog redesign, the undo fence, undo messages that name what they undo.
- 7.9.0: one unified Auto-Organize. Two pieces were deferred on purpose: "Auto-Organize: Shift-click ranges should
  follow what you see" (a task, Polish) and "let a misfiled book go back to the Inbox" (dropped 2026-10-22 — right-click
  → Move to → Inbox and Ctrl+Z already cover it).
- 7.10.0: Save as Spreadsheet (CSV) — the user who asked for it was sent a reply (no response).
- 7.11.0: item 11. (Item 12 was made unnecessary by the Auto-Organize rework.)

##### Fetch should update books it already knows, not skip them
<!-- id 20260904-0000a; merged 20261014-1030ac -->

_Why it matters:_ A sample or loan of a wishlisted book is thrown away, so the change never shows.

_The foundation — the summaries below depend on it._

**What happens**
- The fetcher skips any record whose ASIN it already knows. On 2026-09-04 a sample record for the wishlisted *Oath of Honor* was thrown away.
- For loans it's invisible **forever** — there's no other path that would catch it.
- **Live case (Ron, 2026-10-14/15):** three *Time Traveler's Passport* stories wishlisted months ago, then borrowed
  through **Prime** — a fresh fetch + Import still shows them as **Wishlist**. The Prime records are skipped as
  "🔁 Duplicate ASIN detected … (skipping)". (Fixed by hand with a console snippet for now.)
- Why buying is different: the price check's "you bought this on ‹date›" backstop catches purchases every run; a
  borrow has no such evidence, only the library record — the one that's skipped.

**Decided** (Ron, 2026-10-15) — **one place for every ownership rule**
- Today the rules are scattered: wishlist → owned lives in the price check, "never downgrade Owned" in the Import
  merge, the list of temporary kinds in a third spot. Put the **whole transition matrix** (OWNERSHIP-MODEL.md §3) in
  **one function** — "given what we have and Amazon's new evidence, what is the book now?" — called by every path
  (the library walk, the purchase backstop, the Import merge), with tests locking it in (like the book-merge tests).
- The ranking it implements: **Wishlist** (bottom — any real Amazon record replaces it) < the **temporary kinds**
  (sample, Prime, Kindle Unlimited, borrowed, library loan, Audible Plus — peers: the **newest record wins**) <
  **Owned** (top — a fetch never downgrades it). Manual Owned / Wishlist choices stay protected. A loan that ends is
  Removed books' job (7.19.0).
- A manual "Other… (Prime, KU…)" choice in the book window was considered and **not** wanted: once the fetch notices
  these on its own, Amazon's facts arrive by themselves — revisit only if cases remain after the fix.
- Details of the rules (merged 2026-10-20 from this task's old "Rules" list): **never downgrade Owned** — full fetches
  include old sample records; "newest record wins" compares the record's date with the **stored** purchase date; your
  own edits are respected. Refreshing the purchase date also fixes a re-walk quirk in how the fetcher remembers where it
  stopped. The existing "past purchase" upgrade becomes just a backstop.
- **Absorbs the old task "Let library loans and Audible Plus books upgrade to owned"** (Ron + UX, 2026-10-20): today
  those two kinds can never become Owned, even after you buy the book — the fetcher's list of temporary kinds
  (`TEMP_OWNERSHIP`, amazon-library-fetcher.js ~2277; written for fetcher 4.11.8, never updated for the kinds added in
  5.2.0; verified still missing 2026-10-14) lacks them, so a bought library loan never upgrades, and loans without a
  price goal are skipped by the price check. The one function, with library loan and Audible Plus in its temporary
  rank, replaces that list — fixing it separately would patch a list this task deletes.

**What you'd get**
- A known book's record becomes an **update**: refresh its kind (owned / sample / loan…), purchase date and format from the record.
- wishlist → sample / loan becomes visible; a library loan or Audible Plus book you then buy becomes Owned.

**How it's tested** (added 2026-10-20 — Ron's live case was fixed by hand, so it's gone)
- **Automated:** the one function gets a test for every row of the transition matrix (OWNERSHIP-MODEL.md §3).
- **Live:** the next real sample or borrow of a wishlisted book should show its new kind after one fetch + Import —
  wait for one, or arrange one (borrow a wishlisted Prime / Kindle Unlimited book).

**How (technical)**
- amazon-library-fetcher.js (~1422–1425 when filed): `seenASINs` is seeded with every known ASIN, so known records are dup-skipped.
- Fields: `ownershipType`, `acquisitionDate`, binding; respect `userEdited`. The watermark re-walk quirk heals with the date refresh. `pastPurchase` demoted to backstop.

##### Buying a book that's in the Trash should bring it back
<!-- id 20261014-1030j -->

_Why it matters:_ A book you just bought shouldn't stay hidden in the Trash.

**What you'd get**
- When a book in the Trash becomes owned, it comes out of the Trash automatically. (Ron: "YES! Include it.")

**Decided** (Ron + UX, 2026-10-20)
1. **Built right after "Fetch should update books it already knows", on the same path:** once one function decides
   "this book is now Owned", leaving the Trash is what follows from that answer — every route to Owned (library walk,
   purchase backstop, Import merge) gets it, with nothing extra to remember.
2. **It goes back where it lived before the Trash** — what Trash → Restore already does (since 7.11) — and the
   fetch / Import summary says so: *"1 book you bought was in the Trash — restored to 'Sci-Fi'"* (see the two summary
   tasks below).
3. **Not the emptied-Trash case:** a book permanently deleted and then bought again is the permanent-delete rule's job
   (docs/design/TOMBSTONE-DELETE.md: it comes back if the new purchase is later than the deletion).

**How (technical)**
- Lives in storage.js (the Import merge), via the one ownership function.

##### Fetch summary should report books you bought
<!-- id 20261014-1030t -->

_Why it matters:_ After buying 4 wishlist books, the summary says "0 new" — the upgrades only show in the developer console.

_Polish end of the batch; after "Fetch should update books it already knows". Build together with "Faster fetches that
report exactly how your library compares with Amazon" — same completion window._

**What you'd get**
- The fetch's completion window lists **every ownership change, by kind** — not only upgrades to Owned: e.g.
  "3 wishlist → owned, 1 wishlist → sample, 1 wishlist → Prime loan" (once the fetch notices samples and loans).
- **One count for both summaries** (Ron + UX, 2026-10-20): this window and the app's Import summary describe the same
  changes at two moments; both come from the one ownership function ("Fetch should update books it already knows"),
  so they can never disagree.

**How (technical)**
- Today the upgrades are only logged as ⬆️ in the console.

##### Import summary: every ownership change by kind, kept in the message history
<!-- id 20260904-0000b; merged 20260904-0000c, 20261014-1030z -->

_Why it matters:_ Sample → owned upgrades are missed, wishlist → sample could be mislabeled as owned, and the summary
disappears on refresh, leaving no record of what changed — including which books kept their price goals.

_Polish end of the batch; after "Fetch should update books it already knows". Merged 2026-10-20 (Ron + UX) from three
tasks: "Import summary: count every ownership change, by kind", "Keep the Import summary in the message history",
"Keep price goals when a book is bought, and say so"._

**What you'd get**
1. **Every change counted by kind**, labeled by where the book ended up — e.g. "3 wishlist → owned", "1 wishlist →
   sample" — from the one ownership function (the same count as the fetch's window). The console line names the books
   (a missing title blocked a diagnosis on 2026-09-04).
2. **The whole summary is also recorded in the 🕐 message history**, including its "N kept their price goals" line,
   **naming which books** — so a refresh doesn't erase what changed. (Today only "Cleared N price goals" is logged, and
   only after the click.)

**Already done** (the price-goal part)
- Goals are kept when a book is bought — the rule stands: never silently destroy (Ron, 2026-09-04). Bought books
  already need a visit to All Books to file them, so clearing goals rides along on a trip you make anyway.
- 7.1.0: the Import summary says "N kept their price goals — clear if no longer wanted".
- 7.19.0: "Clear those N goals" clears them in one click (undoable).

**How (technical)**
- Since 6.17.2 the summary reports "N now owned", but it's keyed on the wishlist flag flipping. Key it on
  `ownershipType` transitions instead (the one function's result).

#### The left pane, one release

Pins and sorting for Book Lists and Searches, a type-to-filter box, and the jump buttons all change
the left pane's chrome — decided as one release (2026-10-16 / 10-22) so it's designed once. Gathered here 2026-11-04
(TODO scan); the jump buttons came from Small fixes (and gained the right pane 2026-11-06, one shared component). Its
keyboard part is item 4 of "Finish keyboard accessibility".


##### Book Lists and Searches: pin and sort them like Folders
<!-- id 20260910-0000a; merged 20261014-1030b -->

_Why it matters:_ A long Book Lists column is hard to search; Folders already have pins and a Name / Manual sort.

**What you'd get**
- Book Lists and Searches in the left pane get **the same controls and words as Folders** (7.6.0): pins (a top tier) and a header sort control, **Manual ↔ Name**. No second ordering system three inches from the first.
- Pinning can be undone (list reordering already can, since 7.10.1-alpha.6).

**How you'd use it** (Ron, 2026-09-10)
- **Name to find** a list, then back to **Manual** for priority.
- Your top tier is the `New To Read - *` work lists (Prime clearing first); series To-Read lists below.
- Today you hunt with Ctrl+F, which costs a switch of thought.

**Decided** (Ron, 2026-10-16)
- **Build together with "A type-to-filter box for the left pane"** (next task) as one left-pane release: pins for **priority**, the filter box for **finding** (it fixes the Ctrl+F hunt more directly than a Name sort), Name / Manual sort for scanning.
- The old "queued behind the book details window rework" line is dropped — no known dependency (Ron).

**Last step: one shared section overview for Searches AND Book Lists** (Ron + UX, 2026-10-21 — merged from "A
management view for Book Lists", spec docs/design/FOLDER-ORDERING.md: clicking a section's name shows its items as
rows in the right pane — name, book count — sortable and reorderable, the way a folder parent shows its folders).
- **One shared piece, same look and abilities for both** (Ron: "make it common code that works for both").
- **Book Lists: clicking "Book Lists" does nothing today** — a dead click (Law 16); this is its fix. It's also the roomy
  place for actions on several lists (delete, rename).
- **Searches: the overview exists but is broken** (Ron's screenshot, 2026-10-21): the header still says "Views" (the
  old name); 3 of the 5 rows have **blank names**; **every count is 0** (the left pane shows 42 / 1742 / 971 / 27); the
  rows wear 🏷️ tag icons and only "Prime" shows a name. Unverified guess: it still uses the pre-6.12 model where a view
  was a tag (looks the name up as a tag — only "Prime" exists as one — and counts that tag's books). Confirm when
  building.

##### A type-to-filter box for the left pane
<!-- id 20260910-0000 -->

_Why it matters:_ With many folders, Book Lists and Searches, typing a few letters is the fastest way to find one.

**What you'd get**
- One box that narrows **Folders + Book Lists + Searches** by name — the strongest pure "find" at scale. The bigger sibling of the pin/sort task above.

**Decided** (Ron + UX, 2026-10-16) — built together with the pin/sort task above
1. **Where:** one box at the top of the left pane, filtering Folders, Book Lists and Searches at once; matches stay under their own section headings (you don't always know which section a name is in).
2. **Collapsed sections:** while filtering, a section with a match opens and a section with none hides; clearing the box puts every section back as you had it.
3. **Keyboard:** **/** jumps into the box, **Esc** clears it. Ctrl+F stays the browser's own find.
4. **It doesn't clear when you navigate** (find one list, open it, then the next) — but while active it stays **visible**: the box shows your text with a ✕, so a narrowed pane never looks like missing lists (the same rule as the right pane's filters).
5. **A matching nested folder shows with its parent folders** (dimmed), so you see where it lives.

**Status:** Ron, 2026-09-10; design settled 2026-10-16.

##### Jump-to-top / bottom buttons by the scrollbar, in both panes
<!-- id 20261014-1030aa -->

_Why it matters:_ They sit at the bottom left today, not where you'd look for them, and the right pane, the long
list of books, has none.

**What you see**
- Both jump buttons (to top / to bottom) sit at the bottom-left of the left pane. You expected top-at-top and bottom-at-bottom, by the scrollbar.
- They're pinned to the window, not to the folder list (readerwrangler.js ~18117, `fixed left-2 bottom-8`): they show
  on the Welcome screen, where there is no folder list, and their height above the status bar is a guess (checked
  2026-11-06, with the 7.25.1 status-bar fix; Law 19's corollary).
- The right pane (the books) has no jump buttons at all.

**Decided**
- No per-section jumps (Searches / Book Lists / Folders) — collapsing sections already handles that.
- (Ron + UX, 2026-10-22) **▲ at the top, ▼ at the bottom, both at the right edge by the scrollbar** — where scroll
  controls live everywhere else (Ron's own expectation). Not the single "back to top" option: the pane is long at both
  ends.
- **Floating over the pane's edge**, so they never push the list: ▲ shows when you're not at the top, ▼ when you're not
  at the bottom, neither when the pane doesn't scroll. (Not the menu rule's case — a floating helper shifts nothing,
  and a scroll button with nothing to scroll is clutter.)
- **Home / End do the same jumps** — overlaps "Finish keyboard accessibility" (Polish).
- (Ron, 2026-11-06) **The right pane gets them too**, by the same rules — it's the long list (3,270 books in Ron's
  library). There, ▲ sits just below the column headings (List View) and ▼ just above the horizontal scrollbar.
- **One floating component for any scroll area** (Claude, 2026-11-06): the left and right panes share one implementation
  and one placement rule, each button positioned inside its own pane (never against the window), so it appears only
  with that pane and never depends on the status bar's height.
- **Tests:** a layout test (`test/ui/test_layout.py`, with the driver's `covered_scroll_boxes()`): the buttons never
  cover a scrollbar or the column headings, at two zooms; ▲ / ▼ show and hide by scroll position; none on the Welcome
  screen.
- **Build with the left-pane release** (pins + the filter box + the section overview — "Book Lists and Searches: pin
  and sort them like Folders"), so the pane's chrome is decided once and the filter box and ▲ don't collide.

#### Everyday organizing

Things that trip you up while working through the Inbox backlog.

##### Folder dragging: where you drop decides pinned, and the level
<!-- id 20260803-0000 -->

_Why it matters:_ Folders land somewhere other than where the guide line showed, and sorting reshuffles folders you arranged by hand.

**What you see** (Ron, 2026-10-14)
1. **Wrong level at an expanded folder's edge.** Drag a folder to just above a top-level folder that sits below an
   *expanded* folder: it lands **inside** the expanded folder (after its last subfolder), not at the top level.
2. **Dropped into the pins, placed below them.** Drag a folder (a subfolder of a pinned folder, or an unpinned
   top-level folder) into the pinned area: it lands **below** the pinned folders, unpinned. _(That's the August
   "wall" rule working as designed — now reversed, see Decided.)_
3. **Sorting reorders a pinned folder's subfolders.** Switch to Name A→Z / Z→A: subfolders inside a pinned folder
   re-sort. And they show no 📌, so you can't tell whether they're pinned.

**Decided** (Ron + UX, 2026-10-14 — design of record: docs/design/FOLDER-ORDERING.md, "drag decides pinning")
1. **Where you drop decides.** Dropping among the pins **pins** it (at that spot); dragging a pinned folder below
   the pins **unpins** it. A **divider** under the last pinned folder marks the edge; the guide line shows a **📌** in
   the pinned zone; **one undo** and a message ("Pinned 'X'"). Right-click Pin / Unpin stays.
2. **Sorted mode, dragged out of the pins:** lands at its sorted position; its manual position becomes the **top,
   just below the pins** (the existing rule for every new arrival).
3. **Pinned means hand-arranged, all the way down.** A pinned folder's subfolders (and theirs) keep their manual
   order in every sort mode; new or dropped subfolders inside are placed by hand (new ones at the top). Each shows a
   **faded, non-clickable 📌** with the tooltip "Kept in manual order because 'X' is pinned". The parent's 📌 stays
   the real, clickable control.
4. **The level at an expanded folder's edge:** top half of the next top-level row → **top level** (full-width guide
   line); bottom half of the last subfolder row → **inside** (indented guide line). If nesting is deeper there, add
   horizontal pointer position to pick the level (the outliner convention).
5. **Existing pins inside a pinned folder** (Ron + UX, 2026-10-16): a subfolder that already has its own real pin
   inside a pinned folder becomes **faded like its siblings**, and today's order is kept as its manual order — nothing
   moves on screen. One real pin per branch is the control.
6. **The drop always decides, never memory** (Ron): drag a subfolder to the top level's pinned area → it gets a real
   pin; drag a top-level folder into a pinned folder → it gets the faded pin. No folder remembers an earlier pin
   setting — "where you drop decides" stays the one rule.

**History**
- Replaces "Dragging a subfolder to the top level drops it in the wrong place" (2026-08-03): Ron suspects that one is
  fixed (7.6.0 moved new folders to the top); case 1 above is what's left.

**How (technical)**
- Pins are per level today: `f.pinned` on any folder; each parent's children are pins-first, then the global sort
  (readerwrangler.js ~3052–3087). Rule 3 changes that for children of a pinned ancestor; existing per-child pins
  there migrate per Decided 5 (clear the child's `pinned`, keep its current order as its manual position).
- Drag-to-pin / unpin needs the drop handlers to stop snapping at the boundary (the "wall"), and the drop position to
  set or clear `pinned` as one undo step.
- Check how the drop target's level is computed today before changing it (case 1 suggests row halves are ignored
  at that edge).

##### Stray double spaces in author names create duplicate authors
<!-- id 20261014-1030av -->

_Why it matters:_ An author can split in two, making a series look incomplete.

**What happened**
- "Jodi  Taylor" (two spaces) and "Jodi Taylor" became two authors: 2 of 7 Time Police books were mis-authored, and the series looked incomplete in the Auto-Organize preview.

**Decided** (Ron + UX, 2026-10-16)
- Collapse repeated spaces and trim author names **once, in the shared book clean-up every book passes through on load and arrival** (`normalizeBook` in uiHelpers.js — the same step that fixes "Kindle" → "Kindle Edition"). One line covers fetch, Import, edit, Restore and the phone.
- That also makes the **one-time cleanup** automatic: existing books are fixed the next time they load — no separate tool.
- Only spaces are tidied — a name is never split or reordered (the "never parse authors" rule stands).

#### Tag from Collections, round 2: clearer window, safer tags (decided 2026-10-20)
<!-- id 20261020-1409 -->

_Why it matters:_ 7.24.0 fixed the confusing window; testing it surfaced smaller rough edges — and one real gap: a tag
the tool added stays the tool's even after you remove and re-add it by hand.

**Where it stands:** 7.24.0 shipped the redesigned window (all changes at once, exact-text tag names app-wide, removals
opt-in, undo removes a created tag). Ron's test round on it produced ten topics, all decided 2026-10-20. The decisions
and their reasoning are the **build list** at the top of docs/design/TAG-FROM-COLLECTIONS.md (items 1–10) — read it
before building; this task is the plan. One concern per alpha (Law 6), smallest reach first:

1. **The window** (build list items 1–5) — Select All | Some | None into the left pane's header, both checkboxes into
   the right pane's header; the "No tags to remove…" answer in the status line; checkbox wording ("Remove tags from
   books that left the collection on Kindle" / "Show books already tagged" — no "Also", no "wizard"); **↻ Read** (added
   by Tag from Collections) vs **✓ Read** (yours); how to see only the removals. **When the labels change, update
   everything that quotes them, together** (Ron, 2026-10-21): the greyed-collection tooltip ("tick 'Also show books
   that already have their tag'…", readerwrangler.js ~13066), the two code comments naming the label (~1292, ~12895),
   and the help notes §9 — or the tooltip names a checkbox that no longer exists.
2. **One shared sort, here AND in the list view** (item 6) — click / again reverses / third click off; Shift-click adds
   up to 3 keys; tag columns sort by mark. Changes the list view too (third click turns a sort off).
3. **The checkbox tree + undo inside the window** (item 7) — unchecking a collection clears its skips; a partial box
   (▬) while some are skipped; Ctrl+Z / Ctrl+Y undo the window's choices; the status line names what a bulk click
   erased.
4. **Tag changes confirm themselves; touching a tag by hand makes it yours** (items 8–9) — one shared tag-change
   function shows the confirmation from the same text as its undo (*Created tag "zzz" and added it to 'Title'*); any
   hand change of a tag drops it from the tool's record. Touches every tag change in the app: run the class-of-sites
   comb and publish the list first. **Built with "Tag lists and long lists, one release"** (Polish).
5. **Retire the hidden "seen" field** (item 10) — moved 2026-10-20/21 into the Polish task "Retire two leftover book
   fields: the hidden 'seen' flag and the old price-goal field" (one data round for both).

#### Restore dialog calls yesterday's backup "today"
<!-- id 20260922-0000a -->

_Why it matters:_ A wrong date label can lead you to restore the wrong backup.

**What you see**
- A backup from 9/21 6:54 PM was labeled **"— today"** on 9/22. Not a time-zone effect: it was yesterday everywhere.

**Verified in code** (2026-10-20): the age is counted in 24-hour blocks — `Math.floor((now − backup) / 86400000)`,
readerwrangler.js ~12228 — so a backup from 6:54 PM yesterday reads "today" until 6:54 PM today. The class (every
day-count in the app): the restore dialog = **the bug**; `formatRelativeTime` in uiHelpers.js has the same bug but
**nothing calls it** (dead code); `getRelativeTime` ("3h ago", "2d ago") and the freshness thresholds are elapsed time,
not calendar words — fine.

**Decided** (Ron + UX, 2026-10-20) — a 7.24.x fix on its own `fix/` branch, not done during the review (Ron: "let's not
fall for the quickie trap again")
1. **Calendar days, local time.** Ron: *at 12:01 AM, a backup from 2 minutes earlier (11:59 PM) is "yesterday".*
2. **One shared helper in uiHelpers.js** that counts local calendar days between two dates (through local midnights, so
   a 23- or 25-hour day at a clock change doesn't miscount) and gives the label: today / yesterday / N days ago / N
   weeks ago. The restore dialog calls it.
3. **Delete the dead `formatRelativeTime`** so nobody reuses the buggy copy.
4. **An automated test** across midnight (11:59 PM vs 12:01 AM) and a daylight-saving date. Ron's check: any backup
   file saved yesterday reads "yesterday".

#### One safe way to read saved settings — a damaged one can blank the phone app today
<!-- id 20261109-0912 -->

_Why it matters:_ Both apps read about 20 saved settings and notes from the browser, each with its own hand-written
guard — or none. On the phone, one damaged settings note blanks the whole app (it's read on every redraw of the main
screen); a guard that isn't there can't be noticed until it bites. Medium-high (Ron, 2026-11-09).

**Found** (2026-11-09, the logging switch's BOOT area — a sweep of every `JSON.parse` of a saved value; line numbers
approximate)
1. **Unprotected on the phone** (mobile.js): the phone settings (`MOBILE_PREFS_KEY`, ~2466 — read at the top of the main
   screen on every redraw: damaged = a blank app); the same note when you change the sort or the shelves (~2472, ~2490,
   ~2554 — that tap fails).
2. **Unprotected on the desktop:** the old-format folders and Book Lists (readerwrangler.js ~4624, ~4635 — only
   pre-2026 installs; "Remove code left over from older versions…" (Polish) removes them). The library status and the
   view settings (~4533, ~4547) got their own guard in 7.26.0 (BOOT-02/03), because a damaged one stopped the library
   from loading.
3. **Protected by hand** (each its own try/catch, ~12 on the phone, ~8 on the desktop): filters, search history, the
   Auto-Organize wizard, the organization, the cover cache, the Cloud Sync credentials, the phone's collapsed sections
   and navigation.
4. **Past damage:** a note that reads fine but holds the wrong kind of value (column widths saved as text, say) gets
   past every one of these guards.

**How (Claude's proposal)**
1. **One shared reader** in uiHelpers.js (both apps load it): `readSaved(name, fallback, rightKind)` — the saved value
   when it reads and is the right kind, else the fallback and ONE warning naming the note (STORE area). Function tests
   first.
2. **Every read above becomes a one-line call**, the hand-written guards included — a new setting gets the guard for
   free. Publish the before / after list (each site's fallback) for Ron's red pen.
3. Then a commit check could refuse a bare `JSON.parse(localStorage.getItem(` — the way the logging check refuses a
   stray code.
4. Not the phone's startup load (books + organization, ~2627, no guard at all): that's the phone's "your library didn't
   load", done in the logging switch's PHONE area (7.26.0).

### Polish

#### Buttons name their action: replace the remaining OK, Yes and No buttons
<!-- id 20261112-1241 -->

_Why it matters:_ "OK" under "Delete these 3 folders?" makes you read the question again to know what OK will do; a
button that says **Delete** doesn't. Law 21 (Ron, 2026-11-12): a button names what it does — never OK, Yes or No;
Cancel stays.

**To do**
1. **The comb first** (Law 5): every confirm / choice / info box and `<Dialog>` with an OK / Yes / No button — the
   imperative boxes (`showConfirmDialog`, `showChoiceDialog`, `showInfoDialog`, the delete warning) and their default
   button words included; publish the site map (file:line, today's words, the proposed verb) for Ron's red pen.
2. **Then one change:** the confirm routines take the action's word as a required argument (no "OK" default), so a new
   box can't be born with one — the mechanism, not a sweep that drifts back.
3. An information-only box (nothing to decide) may keep a single "OK"/"Got it" — say which in the site map.

#### Move and copy books anywhere — folders, Book Lists, All Books, Searches
<!-- id 20261014-1030ad; merged 20260808-0000, 20260829-0000 -->

_Why it matters:_ Today a cut from a Book List or Search quietly copies instead of moving, and Book Lists were going to
block moves altogether — the app enforcing its internal model instead of doing what you asked.

**The principle** (Ron, 2026-10-21): **don't block the user — honor the intent.** "Not all users will share the same
mental model, nor use RW the same way… there is no wrong way." An icon is an icon: if you move it from here to there,
or duplicate it, across the folder / Book List boundary, do it. Merged from "Ctrl+X from a Book List or Search quietly
copies instead of cutting" and **reverses** "Book List menu: remove Move / Copy, and block dragging onto folders"
(2026-08). That task's evidence — the 2026-08-08 "move" that left books in the Inbox, a folder AND the list — was a
half-done move, not a bad gesture: the cure is complete moves, not forbidding them.

**Decided** (Ron + UX, 2026-10-21)
1. **A move is a true move:** out of the source, into the destination, exactly once, one undo step — every gesture
   (right-click Move to / Copy to, drag / Ctrl-drag, Ctrl+X / Ctrl+C + paste).
2. **A cut takes the book out of the container it was cut from:**
   - from a **folder** → it leaves that folder;
   - from a **Book List** → it leaves that list;
   - from **All Books or a Search** (no container) → pasted into a **folder** it is *re-filed*: it leaves its other
     folders (ask first, listing them, if there are 2+); pasted into a **Book List** it is just added (lists don't file
     books). Book Lists are never touched by a move — only Delete reaches them.
3. **A book that leaves its last folder goes to the Inbox** — "every book is in at least one folder" is a design rule
   the app enforces (integrity.js: books with no folder are repaired into the Inbox), and the Inbox means "not filed
   yet". No dialog; the receipt says it: *"Moved 'Dune' from 'Fantasy' to 'Beach Reads'. It wasn't in any other folder,
   so it went to the Inbox."* (wording Ron + Claude 2026-11-06 — "no folder… in the Inbox" contradicted itself: the
   Inbox IS a folder). Undo if you didn't want that. **Re-checked 2026-11-06** (Ron asked, with the least-astonishment principle in mind:
   refuse instead?): keep it. Cut says "take it out of here", so leaving the folder is what the user predicted; the
   Inbox step can't be avoided, only made manual (Add to Book List >, then remove from the folder → the same Inbox);
   a command that doesn't do what it says is the bigger astonishment; and Ctrl+X is an explicit verb (Law 18 corollary
   4), unlike a plain drag. Only the LAST folder sends a book to the Inbox — a book filed elsewhere just leaves.
4. **Copy works everywhere** — it only adds the book to the destination. Book Lists keep **Move to** and **Copy to** in
   their right-click menu.
5. **One rule, asked by every gesture** (menu, drag, keyboard) — a class of sites: list them with two independent
   searches before building, so a fourth gesture can't drift.

**Dragging** (Ron + UX, 2026-10-21 — File Explorer's convention: a plain drag moves on the same drive and copies to a
different one; Ctrl always copies, Shift always moves)
6. **A plain drag within the same kind moves** (folder → folder, Book List → Book List); **a plain drag between a
   folder and a Book List copies — both directions.** Why copy across kinds: dropping "Sci-Fi" (300 books) on a list as
   a move would empty the folder tree and send its only-there books to the Inbox — users would be SURPRISED; and when
   the intent is ambiguous (file a book from "To Read" — done with it on the list, or not?), the default should lose
   nothing (Del in a Book List removes it from that list in one key).
7. **Shift-drag = move, Ctrl-drag = copy, always.** So nothing is blocked: a move across kinds is one key away (Ron:
   "SHIFT drag solves that. Yay!"). The verbs that SAY move still move — Ctrl+X → paste, right-click **Move to**,
   Shift-drag — with decisions 2–3 (a move leaves its source container; last folder → Inbox). Explicit verbs do what
   they say; only a plain drag guesses, and it guesses safe.
8. **The drag says what it will do, live:** the drag label reads *"Copy to 'Sci-Fi' — hold Shift to move"* /
   *"Move to 'Sci-Fi'"* and switches as you press Shift / Ctrl (Explorer's "+ Copy to" / "→ Move to"; Law 16) — the
   default is a visible choice, not a hidden one. (Ron: "the labels are a great idea. I think that seals the deal.")
9. **The receipts:** a Book List moved onto a folder (Shift-drag): *"Moved 12 books from 'Beach Reads' to 'Sci-Fi' (3
   were already there). 'Beach Reads' is now empty."* — several lists: *"…from 3 Book Lists…"*; the emptied list stays
   (deleting a list is its own act); "removed from", never "deleted from" (deleted = the Trash). A plain drag (copy):
   *"Added 12 books from 'Beach Reads' to 'Sci-Fi' (3 were already there)."* No duplicates in the destination.

**From "Drag between Folders and Book Lists"** (merged in 2026-10-21; spec docs/design/CROSS-SECTION-DRAG.md, decided
2026-08-29, its rules 2–3 revised 2026-10-21 to match the above)
10. **Two new drag gestures** (still as decided): drop a folder **on** a Book List's entry in the left pane → adds the
    folder's books to that list; drop a folder or books **between** two Book List entries in the left pane → creates a
    new list there, named "‹folder name› - To Read" for a folder, or by the naming engine for books (e.g. "Beach
    Reads"). Right-click → New also falls back to the current folder's name. (Spec rules 4–7 and its naming rule.)
11. **Honesty fixes:** say what happened (Moved for a move, Added for a copy — was "always say Added from a list
    view"); **no fake "you can drop here" signals** — a target that won't take the drop must not light up (Law 18
    leaves far fewer such targets), including the left pane's blanket drop handling; fix the over-count in the
    message and the leak into the Trash; make Book List reordering undoable. _Verify these three against today's code
    when building — reordering the Book Lists themselves has been undoable since 7.10.1 (`REORDER_BOOKLISTS`), so the
    last may be done._
12. **On ship:** update SUPPORT-KB §8 and §6 (they describe today's behavior).

**The one table** (Ron + Claude, 2026-11-06): every gesture's move / copy / paste rule becomes a row of ONE table —
see "One table for every move, copy, paste and delete…" (High, after the Delete key task). These decisions are its
rows.

**How (technical)**
- **Where "can books be pasted here?" is answered today — four lists that disagree** (found 2026-11-06, the logging
  comb's finding F1): Ctrl+V refuses All Books, the library view AND the Inbox (readerwrangler.js ~5255, and silently —
  only a console line); the book right-click menu's Paste refuses only All Books and the library view (~18936 — its
  comment: "v6.0.0-alpha.53 - Inbox is a real folder, allow Cut/Move/Paste", which Ctrl+V missed); two more lists at
  ~5404 (adds the Searches header) and ~18406 (adds `__my__`). None names a Book List, a Search or the Trash. Ctrl+V's
  paste is also hand-written (its own `setFolders`), not `moveItems` — the one move/copy operation the menu and drag use.
- Today: Ctrl+X is refused only in All Books / the library view (readerwrangler.js ~5223); in a Book List or Search it
  records the view as the source, but paste-cut only removes from **folders**, so the book stays in the list. (Still
  true for a cut from a Book List pasted into a FOLDER after 7.25.1; a cut from a Book List pasted into another Book List
  now leaves the first list — 7.25.1's Book List paste.) Found in
  7.10.1-alpha.7, filed not fixed.

#### Retire two leftover book fields: the hidden "seen" flag and the old price-goal field
<!-- id 20261012-0000b -->

_Why it matters:_ Clearing a price goal doesn't fully clear it everywhere, and every save, backup and sync still carries
a hidden field nothing uses any more.

_One data-layer round for both (Ron + UX, 2026-10-21) — the same mechanism and the same kind of test. Merged from
"Clearing a price goal doesn't fully clear it everywhere" and step 5 of "Tag from Collections, round 2"._

**1. The old price-goal field** (`targetPrice`; today's is `priceTrigger`)
- A few places treat a book as "has a goal" if **either** field is set: the Import's "kept their price goals" count
  (storage.js ~176), the fetcher's goal check (amazon-library-fetcher.js ~2286) and the spreadsheet export
  (`priceTrigger ?? targetPrice`, readerwrangler.js ~6305); plus its row in bookFields.js. Clearing a goal clears only
  today's field, so a book still carrying the old one keeps "having a goal" there. Found 2026-10-12; readers
  re-verified 2026-10-20.
- **Counted 2026-10-21 (Ron's library): 0 books carry the old field** (and 0 without a current goal). Keep the one-line
  move-across anyway (an old backup could still carry it): in the shared book clean-up, a book with the old field and
  no current goal gets it moved across once; then the old field is dropped.

**2. The hidden "seen" flag** (`collectionTagSeen`)
- Tag from Collections' "New books only" used it; unused since 7.24.0 removed that option. Every save, backup and sync
  still carries it. Design of record: docs/design/TAG-FROM-COLLECTIONS.md (§2.8, round 2 build list item 10).

**How (both)**
1. **Strip in the shared book clean-up** (`normalizeBook`, on every load and arrival — fetch, Import, Restore, the
   phone), not with a one-off snippet: a returning user or an old backup would bring them back.
2. **Remove both rows from the field table** (bookFields.js), so saves, backups and syncs stop carrying them; then the
   readers above drop them, and test/bookFields.test.js's round-trip cases (which assert both fields survive) change
   to assert they're gone.
3. **Order for the fetcher:** it reads books as stored on the relay, where old copies keep the old goal field until
   their next save — the app's clean-up ships first, the fetcher's `targetPrice` check is removed after.
4. Its own test round (data layer).

#### Remove code left over from older versions (hiding single copies, phone tag shelves, unused functions)
<!-- id 20261108-1800 -->

_Why it matters:_ Code nothing can reach still has to be read, kept working and tested around — and some of it is
still written into every save, backup and sync. Less code, nothing for a person to see.

**Found** (2026-11-08, a survey of the live files for the logging work; each claim re-checked by grep). Line numbers
are approximate (readerwrangler.js unless named).
1. **Certainly dead:**
   1. **Hiding a single copy of a book** (v4): `hiddenInstances` + `book._instanceId` + the `HIDE_COPIES` undo / redo
      cases (state ~1536; set ~4657, ~7961, ~8520; read ~17059, ~17216, ~17679, ~17820; label ~7403) and mobile.js
      (~106, ~2429, ~2639). Nothing assigns `_instanceId` and nothing records `HIDE_COPIES`; hiding today is
      `book.isHidden` (a book field, so a restore brings it back). **Written into saved data** — the saved
      organization (~4798), the relay copy (~6206), Save Backup (~6314) — always empty: every backup of Ron's from
      2026-09-01 to 2026-11-06 holds `hiddenInstances: []`.
   2. **Pinned tag folders on the phone** (`pinnedTagFolders`, the `__tag_…__` shelves): mobile.js ~108, ~678,
      ~853-869, ~1517, ~1640-1660, ~1846-1875, ~2426, ~2636, ~3117, ~3177, ~3209. The desktop dropped it on purpose
      and never sends it; none of Ron's backups carry it (the old demo library has an empty one).
   3. **A drag value set but never read:** `explorerDragBookId` (~1562, 20 setters).
   4. **The startup collections merge** (`mergeCollectionsIntoBooks` ~6508, called once ~4680): it runs once at startup,
      before `collectionsData` can be set, so it always returns the books unchanged.
   5. **Never called:** `clearLibrary` (~6446), `getBooksInUserFolders` (~1896), `getRelativeTime` (~4507),
      `renderStatusIndicator` (~8948), `FolderIconSVG` (~6107), `coverRow` (~12459), mobile.js `IconFolderLarge`
      (~175); uiHelpers.js `SETTINGS_KEY` (~8; its key string stays in the reset lists).
2. **Obsolete by Ron's rule** (2026-11-08: "if my oldest backup doesn't contain these fields, consider them obsolete" —
   none of his backups do):
   1. `dataSource` and `lastSyncTime` — set and saved with the organization (and the phone's copy), never read.
   2. The three single-choice filters from v3.8 (`collectionFilter`, `ratingFilter`, `seriesFilter`; state ~1353,
      ~1411, ~1414; logic ~2565-2583, ~10229-10294; chips ~10859-10873): nothing on screen sets them; only a v3/v4-era
      saved filter could.
   3. The old cover cache (`CACHE_KEY` "enriched-cache", read ~6973): never written.
   4. The one-time moves from the pre-2026 storage (`FOLDERS_KEY` / `BOOKLISTS_KEY` reads ~4623, ~4634, mobile.js
      ~135) — first a console check that Ron's browser holds neither old key.
3. **Checked and alive** (don't remove): the refusal of very old files (`amazonData`, `type: 'collections'`), the
   `isHidden` backfill (uiHelpers.js ~95), `__views__`, the phone's own covers / list setting.

**How**
1. **With "One backup writer…"** (Before launch → Safety and data protection), not before: three of these
   (`hiddenInstances`, `dataSource`, `lastSyncTime`) are written by both copies of the backup writer — one writer,
   then one change.
2. **Readers stay tolerant:** an old backup or a phone's old copy may still carry them — ignored, never an error (the
   backup check, 7.26.0, already ignores parts it doesn't know).
3. The test fixture (test/fixtures/make-small-fixture.js, small-fixture.json) mentions some of them — regenerate it.
4. Beside "Retire two leftover book fields…" (just above): the same clean-up, at the book level.

#### Moving and selecting

##### Delete a book from All Books (removes it everywhere)
<!-- id 20261014-1030p -->

_Why it matters:_ Today you have to remove a book from each folder and list separately.

**Already done**
- 7.11.0: Delete works from All Books (DEL or right-click) — removes the book from every folder and puts it in the Trash; restoring puts it back in its folders. (Re-confirmed by Ron 2026-10-21 — "can't delete from All Books" had outlived its fix in memory.)

**Left**
- The confirmation doesn't say where the book lives.
- Book Lists aren't in the restore snapshot — their entries are only hidden while the book is deleted.

**What you'd get** (Ron, 2026-10-21: "The intent when I delete from All Books is to delete all copies")
- Delete from All Books moves the book to the Trash, removing it from **every** folder and Book List at once.
- **The confirmation lists every place it lives** (folders and Book Lists).
- **One operation:** a single Undo restores every instance, Book Lists included.

**How (technical)**
- Reuse the membership snapshot, so restoring puts it back everywhere.

##### Open one book's details without losing a multi-selection
<!-- id 20261014-1030ah -->

_Why it matters:_ Lets you identify a book mid-scan and carry on with your selection.

**What you see** (checked in code 2026-10-21)
- The book's right-click menu offers **Edit…** (opens its details) with one book selected; with several, the same spot
  becomes **Edit ▶** (bulk edit). So there's no way to just *look at* one book while several are selected — and a
  plain click on it replaces the selection with that one book.

**Decided** (Ron + UX, 2026-10-21)
1. **A "Details…" item on the book menu** opens **the book you right-clicked**, in the normal view (not edit mode), and
   **leaves the selection exactly as it was**. "Details" matches the window's name (the book details window).
2. **Always there, in the same place** — one book or many selected — so the menu doesn't shift (the rule in "Menus
   keep their items in place").
3. **‹ › inside steps through your selection** when the right-clicked book is part of it — today's "shelf", no longer
   forced.
4. **Pairs with "Restore the previous selection"** (below): this is the safe way to look; that one is the safety net
   when a click wipes the selection anyway.
5. Verify when building (not before): how a double-click on a cover treats a multi-selection today — the old note
   "opening from a multi-selection opens the whole selection as a shelf you step through" came from that.

##### Restore the previous selection after a stray click or Select All
<!-- id 20261020-1239 -->

_Why it matters:_ A careful multi-selection (Ctrl-click by Ctrl-click) is lost to one stray click, Ctrl+A, Esc or a
folder switch — and nothing brings it back.

**What you'd get** (Ron + UX, 2026-10-20)
1. **Restore previous selection** — brings back the selection you had just before it was replaced or cleared. One
   level (the one just lost), like Photoshop's **Select → Reselect**.
2. Reachable from the right-click menu and a keyboard shortcut (pick one that's free when built).
3. **Not part of Undo.** Ctrl+Z stays for changes to your library; selection is view state, and putting every click
   into undo would make Ctrl+Z step through clicks before reaching a real change — the ratified rule in
   docs/design/UNDO-MODEL.md ("view state … not undoable").

**Why now** (2026-10-20): Tag from Collections gets undo for its own choices in its round 2 (its checkboxes are a
draft of what Apply will do — docs/design/TAG-FROM-COLLECTIONS.md, build list item 7; it did not ship in 7.24.0). Ron asked for the same safety "everywhere
(in a folder for instance)" — this is that, in the convention that fits a selection.

#### A folder or Book List you just created stays visible under filters
<!-- id 20261014-1030a -->

_Why it matters:_ With filters on, a new folder is hidden the moment you create it (it has no matching books) — the
app filtering something you obviously didn't mean to filter.

**What you see**
- With filters active, create a folder. A notice says the filters are hiding it and it won't appear in the left pane.
  The notice has no Cancel, so the folder stays, hidden — and its rename box can open on a row you can't see.

**Decided** (Ron + UX, 2026-10-21 — replaces the 7.14.2 decision: a 4-button notice now, "warn before creating"
later; both added an interruption around a rule that shouldn't apply — Law 18)
1. **A folder you just created stays visible, whatever the filters, until the filters change** (Excel's rule: a row you
   just added stays visible under a filter until you re-apply it). It appears where you made it, rename box open as
   usual.
2. **A quiet marker explains it** when its count is 0 — e.g. *"new — no matches for your filters"* (Law 16).
3. As soon as you change or clear the filters, it follows the normal rule.
4. **No notice, no buttons, nothing to cancel** — Ctrl+Z undoes the creation, as for any folder. The old notice
   (`newFolderHiddenAlert`) goes.
5. **The same for a Book List you just created** — the left pane hides Book Lists under filters by the same rule
   (`blHiding`, readerwrangler.js ~14719). When building, list every "just created, then hidden" path (two independent
   searches) before claiming coverage.

**How (technical)**
- The notice is raised from 3 places (search `setNewFolderHiddenAlert`); remove them with it.
- Keep a "just created" id set that the filtered folder / Book List lists always include; clear it when the filters
  change.

#### Book details window: one Save — nothing changes until you click it, and nothing is lost without asking
<!-- id 20260910-0000b; merged 20261015-1644, 20261014-1030ba -->

_Why it matters:_ Today some fields save instantly and others wait for Save; Save is enabled even when nothing changed;
and every way out of edit mode throws your changes away without a word. One rule makes the window predictable, with
one undo per Save. (Public promise: README's Coming Soon — "A calmer book editor".)

_Merged 2026-10-21 (Ron + UX) from "Book details window: changes happen only when you click Save" (ratified
2026-09-10) and "…Save only when something changed; offer Save before closing with unsaved changes" (2026-10-15) —
they share one "what changed?" check. Two steps, in order: step 1 is smaller and works on today's fields._

**Step 1 — Save only when something changed; ask before losing changes** (decided Ron + UX, 2026-10-15)

What you see (Ron, 2026-10-15):
1. Open a book → **Edit**: **Save** is enabled even though nothing has changed.
2. Change something, then **Cancel** — or Esc, ✕, or a click on the background (all four do the same): the changes are
   gone, with no warning.

Decided:
1. **Save is disabled until something changes**, with a tooltip "No changes to save". Enter with nothing changed just
   leaves edit mode.
2. **With unsaved changes, every exit asks** — Cancel, Esc, ✕, background click, ◀ ▶ to another book, closing:
   > **Save your changes to "‹title›"?**  **[Save]** · [Discard changes] · [Keep editing]
   1. **Save is the default** (Enter) — the common case is an accidental exit, and a saved edit can be undone;
      discarded changes can't.
   2. "**Discard changes**", never the default, so no keystroke picks it by accident.
   3. **Esc in this dialog = Keep editing** (back out of the question).
   4. Only when something changed — otherwise exits just close, as now.
   5. The same one dialog for the explicit Cancel button too (uniform beats two variants).
3. **One "what changed?" check** drives both — the comparison Save already makes. Step 2's fields join it.
4. (2026-10-21, gate item 13) The exit question passes Law 18 — a confirmation for a genuinely destructive case (losing
   unsaved edits), with Save as the default guessing the likely intent.

**Step 2 — changes happen only when you click Save** (ratified 2026-09-10)
1. In the book details window, **Edit → Save is the only way anything changes** — one undo per Save. Cancel throws
   away everything you changed (after step 1's question).
2. Rating, price goal and tags stop being instant controls: they're saved with everything else. A new tag is created at
   Save.
3. **Click-to-edit, so no click is dead** (2026-10-21 — the 2026-09-10 decision said "read-only in view mode", which
   predates Laws 16 and 18: a star you can't click would be a dead control refusing a clear intent). **Clicking any field
   in view mode switches to edit mode right there:** the 4th star → edit mode with 4 stars staged; the price goal →
   edit mode with its box focused. Still nothing saved until Save.
4. **Commands stay live in both modes:** Share, the Amazon link, Status History, ◀ ▶ (previous/next book).
5. Outside the window, changes stay instant (one undo each).
6. **Quick access** (replaces the instant controls): in list view, click the Price Goal or My Rating cell to set it in
   place (preset goals / custom amount, or a row of stars). Decide during the build: should right-clicking a cover also
   offer a My Rating submenu?
7. **First, classify every control** in the window as a field (saved by Save) or a command (acts now) — **with a
   tooltip column**: each control's tooltip wording where it isn't self-explanatory (e.g. Collections: "Read-only:
   comes from your Kindle collections on Amazon"). Merged 2026-10-21 from "Tooltips in the book details window" — one
   pass through the window covers behavior and wording. Publish the table for Ron's red pen **before** any code. Its own branch; version number assigned when the work starts (the old
   "7.14.0" label is stale).

**How (technical)**
- `enterEditMode` / `cancelEditMode` / `saveEditMode` (readerwrangler.js ~7022–7160 on 2026-10-21); `saveEditMode`
  already diffs `editBookFields` against `modalBook` — extract that into one `bookEditChanges()` used by Save's enabled
  state and by the exit guard. The dialog's onClose in edit mode routes to `cancelEditMode`.
- The confirmation is a `<Dialog>` (overlay system) — not a hand-built box.
- Step 2: rating / price goal / tags join `editBookFields` as staged fields; Save folds them into the one `EDIT_BOOK`
  undo step. Completes the edit-in-place pattern in OWNERSHIP-MODEL §4. Rationale and Ron's context-keying principle:
  UNDO-MODEL.md, section "fully transactional".

#### Tag lists and long lists, one release

The tag picker, the Tags filter, the "Save results" menu and every type-ahead list all sit on one
shared scrolling list — decided as one build, one test round (2026-10-22). Gathered here 2026-11-04 (TODO scan) from
Polish and Small fixes, in build order: the shared list first, then what moves onto it. "Tag from Collections, round
2" step 4 (High priority) — the shared tag-change function — is built with it.


##### Long lists keep their actions in view (Manage…, Select All) while you scroll
<!-- id 20261019-2015 -->

_Why it matters:_ An action at the end of a long list scrolls out of sight — it looks missing, so it's never used.

**What you see** (Ron, 2026-10-19)
1. The **Tags** filter in the bar above the books: "Manage Tags…" seemed to be missing. It's there — at the very
   bottom; the whole menu scrolls as one piece, so with a dozen tags it sits below the cut-off. "Select All / Clear
   All" at the top scrolls away the same way.
2. Right-click a book → **Tags** does it right: only the tag rows scroll; "Manage Tags…" stays put below them.

**The rule** (Ron + UX, 2026-10-19) — sort what sits at the top or bottom of a list into three kinds:
1. **Actions on the whole list** ("Manage Tags…", "Create…", Select All / Clear All): **always visible** — fixed
   above or below the scrolling part.
2. **Notes about the list** ("No tags to remove…"): **not** pinned — a fixed note costs a line forever and stops
   being read. Put it where people look for status (e.g. a window's status line).
3. **Ordinary rows** that happen to be first or last: scroll normally.

**The mechanism, not a cleanup:** ONE shared scrolling list with a fixed top slot and a fixed bottom slot. Fixing
each list by hand doesn't stop the next new list from repeating it; with one shared piece, every new list gets it.
1. **Build the piece**, then move every list with top/bottom actions onto it.
2. **Known places so far** (found 2026-10-19 — a start, not the full list):
   1. **The Tags filter** (bar above the books) — **broken:** the whole menu scrolls as one piece (capped at 300px,
      readerwrangler.js ~9868–9877), taking "Select All / Clear All" (top, ~9906) and "Manage Tags…" (bottom, ~9977)
      out of sight. It also has two copies of the "Manage Tags…" link (no tags ~9900 / some tags ~9977) — make one.
   2. **Right-click a book → Tags** — **already right, the model:** only the tag rows scroll (~19857); "Manage Tags…"
      sits below them (~19933).
   3. **Tag from Collections' "No tags to remove…" note** — handled in "Tag from Collections, round 2" (its design's
      build list item 2), not here: it's a note, so it moves to the window's status line rather than being pinned.
   4. **Auto-Organize's preview — "File under… / Choose folder"** (Ron, 2026-10-22) — **broken:** it sits at the
      bottom of the scrolling preview, so you scroll to the end to find it ("not discoverable"). It's an action on the
      selection → pin it below the scrolling part.
3. **Find the rest with the comb** — two independent searches (lists that scroll; trailing "Manage…" / "Create…" / "…"
   items) plus a walk of every menu, right-click menu, dropdown and dialog list. Publish the list of places before
   calling it done. **Include menus that list your own items** (Book Lists, folders) and **run off the screen** —
   moved here 2026-10-21 from "The 'Save results' menu runs off the screen", whose menu is the piece's first user
   after the tag lists; the piece also owns fit-to-the-roomier-side.
4. **Pair it with "One shared tag picker"** (this group, next) so both tag lists move onto the piece together.

**Related:** "The 'Save results' menu runs off the screen" (this group — the same list carries its fit-and-scroll
fix) and "One shared tag picker" (this group — it sits on this piece). Deferred from 7.22.1 by Ron, 2026-10-19
(no regression; scrolling down is the workaround).

##### One shared tag picker: show all tags in your order (the right-click one silently stops at 10)
<!-- id 20261015-1717 -->

_Why it matters:_ A tag you use constantly ("Read", 964 books) can be missing from the list with no hint why — and the two tag pickers disagree on what to show.

**What you see** (Ron, 2026-10-15)
1. Right-click a book → **Tags**: "Read" isn't in the dropdown. Typing "Read" in "Type to search or create…" finds it,
   with 964 books.

**Why** (verified in code)
1. There are **two separate tag pickers** that have drifted apart:
   1. **Right-click → Tags** shows only the **first 10** tags, in your custom order from Manage Tags — a silent cut-off
      (the code even says `// Limit to 10`). "Read" is past the 10th, so it's hidden until you type.
   2. **The book details window → Tags** shows **all** tags, but **A→Z** — ignoring your custom order — in a short
      scrolling box.
2. Same class as the three copies of the search rule ("Find a book by its ASIN"): one control, copied, drifting.

**Decided** (Ron + UX, 2026-10-15)
1. **One shared tag picker**, used in both places (and anywhere else tags are picked) — one implementation.
2. It shows **all** tags, in **your custom tag order** (Manage Tags), in a scrolling list.
3. The search box stays at the top to narrow it ("Type to search or create…"), as the "Move to" submenu's filter box does.
4. **No silent limit.** If a cap is ever needed, it says so: "…23 more — type to filter".
5. Keeps what both have today: tags already on the book(s) aren't offered again (re-confirmed 2026-10-20, Tag from
   Collections round 2 topic 8); **"Create ‹name›" appears unless a tag with EXACTLY that name exists** — capitals
   count since 7.24.0 — with the capitals prompt for a near-twin ("A similar tag exists"). Don't rebuild the old
   capital-blind check.

**Decided — tag order everywhere follows Manage Tags** (Ron + UX, 2026-10-18; recorded in
docs/design/TAG-FROM-COLLECTIONS.md §7 as "added to this task" but it never arrived — added 2026-10-22). Ron's alpha.3
note: the Tags filter and right-click → Tags aren't in Manage Tags order (book details is A→Z).
1. Manage Tags' hidden header-click order cycle becomes a visible **Order: A→Z | Most used | Manual**.
2. **Every tag list follows it:** the Tags filter (bar above the books), right-click → Tags, book details → Tags.
3. Drag handles appear only in **Manual**, and the manual order changes only in Manual — viewing A→Z never touches a
   saved manual order.

**Build as one "tag lists" release** (Ron + UX, 2026-10-22) with the tasks that change the same lists — one build,
one test round of them instead of four: "Long lists keep their actions in view" (the shared scrolling list; pins
"Manage Tags…"; fixes the Tags filter), "Arrow keys should move through every type-ahead list" (the picker's search
box), and "Tag from Collections, round 2" step 4 (the shared tag-change function: confirmations, "touching a tag by
hand makes it yours").

**Workaround until then:** Tools → Manage Tags → drag "Read" into your top 10.

**How (technical)**
- Right-click picker: readerwrangler.js ~19890–19898 (`tagOrderIdx` sort, `.slice(0, 10)`, multi-book aware via
  `tagsOnAllBooks`). Book window picker: ~14104–14115 (`localeCompare` A→Z, single book). Extract one component taking
  the selected book ids; both call sites become thin. `tagOrderedNames()` is the order source.
- Build it on the overlay system's list popup if it opens as a popup.

##### The "Save results" menu runs off the screen with many Book Lists
<!-- id 20261006-0000b -->

_Why it matters:_ With 20+ Book Lists, the lower ones are cut off and can't be reached.

**What you see**
- With a search or filter active, click the **💾 N results · Save ▾** button in the bar above the books.
- The menu lists every Book List. With about 20 or more, it's taller than the window and the bottom ones are cut off, with no way to scroll. A long flat list is also slow to scan.

**What you'd get**
- The menu opens on whichever side of its button (above or below) has more room, fits that space, and scrolls — the usual approach in modern menus.
- With more than ~10 lists, a filter box at the top — reuse the one the book right-click menu's "Move to" submenu already has.

**Watch out**
- This must **not** apply to right-click menus with fly-out submenus (Move to / Copy to): a scrolling menu would clip its own fly-outs.

**Status:** designed and deferred by Ron 2026-10-06.

**Build on the shared scrolling list** (Ron + UX, 2026-10-21) — the one from "Long lists keep their actions in view"
(this group's first task): its **top slot** holds the filter box (always visible while the list scrolls), the **middle** scrolls your
Book Lists, its **bottom slot** an action like "New Book List…"; and the **fit-to-the-roomier-side** behavior lives in
that shared piece, so every long list gets it. This menu is its first user after the tag lists. The filter box is one
more type-ahead list for "Arrow keys should move through every type-ahead list". (The old line "check other menus
that list your own items" moved to the long-lists task's sweep.)

**How (technical)**
- In the shared list piece (a `<Popover>` option for button dropdowns): when it can't fit below, pick the roomier side,
  cap the height, scroll.
- Today it pins to the top of the window and hangs off the bottom. The fly-out rule is CursorPopup's "never add overflow".

##### Arrow keys should move through every type-ahead list
<!-- id 20260929-0000 -->

_Why it matters:_ You can't pick a series from the list with the keyboard — Down scrolls the window instead — and the
same is likely true of most of the app's type-ahead lists.

**What you see**
- In both Series fields — the book details window's edit mode (✏️), and Bulk Edit → Series… — open the list (type a letter or click ▼) and press Down.
- Nothing moves through the list. In the book details window, Down scrolls the whole window instead.
- Enter takes what you typed, not a highlighted row.

**What you'd get** (the standard pattern)
- Down / Up move a highlight through the list while the cursor **stays in the text field**, so you can keep typing.
- Enter picks the highlighted series. Esc closes the list (already works).
- While the list is open, Down / Up never scroll the window.

**The model already exists**
- The search box's "Recent searches" list works exactly this way today. Extract that and use **one implementation for
  every type-ahead list**.

**Every type-ahead list, not three** (Ron + UX, 2026-10-21) — "Down moves, Enter picks" must work in all of them, or
people learn it works in some places and stop trying. Found 2026-10-21 by their prompt text (a start, not proof):
recent searches (the search box, ~1170 — the working model); Series in book details (~13825) and in Bulk Edit
(~13475); Tags "Type to search or create" in book details (~14162) and right-click → Tags (~19790); "Type to filter
your folders" (~12734); "Filter authors by name…" (~12064); and the planned filter box in the "Save results" menu.
**When building, find them with two independent searches**
(by prompt text and by the shared list popup) and publish the list before claiming coverage. **Build together with
"One shared tag picker"** (this group) — it sits on this behavior; one pass covers both tag lists.

**Status:** deferred by Ron 2026-10-06 (minor accessibility fix).

**How (technical)**
- Build it once in the shared list popup (`<Popover kind="list">` — both Series lists became that in 7.18.0-alpha.54), not per field —
  the same arrow-key handler the right-click menus get in "Finish keyboard accessibility" (one handler for every
  `<Popover>` kind; whichever task is built first builds it).
- The working model is the `SearchInput` component's Down/Up/Enter/Esc handling. Stable copy "as it was": `git show 46a0cf6:readerwrangler.js`, search for `const SearchInput`.

#### Finish keyboard accessibility
<!-- id 20261014-1030v -->

_Why it matters:_ Everything should be usable without a mouse. Today Tab walks out of an open window into the library
behind it, you can't see where the keyboard is, and right-click menus have no arrow keys.

**Left** (checked 2026-11-03)
1. **Keep focus inside an open window** — every window says it's modal, but nothing keeps Tab inside it.
2. **A visible focus outline** for keyboard users — today only the note editor has a focus style.
3. **Keyboard access to the right-click menus** — Down / Up move, Enter runs, Esc closes (Esc already works).
4. **Keyboard navigation in the left pane** (moved here 2026-11-03 from "Leftover desktop polish") — including Home /
   End for its jumps to top and bottom ("Jump-to-top / bottom buttons by the scrollbar, in both panes").

**Decided** (Ron + Claude, 2026-11-03, in the TODO review)
1. **Moved up from After launch to Polish** — since 7.18 it's small: every window goes through one `<Dialog>`, every menu
   and list through one `<Popover>`, the old-style message boxes through `attachDialogDismiss` — so items 1 and 3 are
   each one change in the shared piece, not a sweep; item 2 is one style rule. Tab escaping a window is a defect, not a
   nicety (Rule 0); outside review 4 (a newcomer's first look) would flag it.
2. **One arrow-key handler for every `<Popover>` kind** — the menus here and the type-ahead lists in "Arrow keys should
   move through every type-ahead list" share it; whichever is built first builds it.
3. **Tested with the browser driver:** open a window, press Tab twenty times — focus never leaves it; right-click a
   book, Down, Down, Enter — the right item runs; the focus outline shows on Tab, not on a mouse click.
- Screen-reader labels for icon-only buttons come with the tooltips task ("Tooltips where they help…").

**How (technical)**
- Focus trap in `<Dialog>` and `attachDialogDismiss` (focus the first control on open, return focus on close);
  `:focus-visible` (outline on keyboard focus only); arrow keys in `<Popover>` (menu, list).
- **After "Rebuild the old-style message boxes as standard dialogs"** (High priority), the focus trap is one change in
  `<Dialog>` only — so build this after it.
- Tool survey 2026-11-03 (docs/design/TOOL-SURVEY.md): axe-core (`@axe-core/playwright`), run from the browser driver, checks contrast and
  labels automatically; focus order still needs scripted Tab walks.

#### Removing a recent search should offer Undo
<!-- id 20261007-0000b -->

_Why it matters:_ One click deletes a recent search with no message and no way back.

**What you see**
- Click into the search box so "Recent searches" appears; click the × on a row.
- It's gone instantly: no message, no Undo, nothing in the 🕐 message history.
- By contrast, deleting a **saved** Search (left pane → SEARCHES → right-click → Delete Search) confirms, shows a message, and can be undone.

**Decided** (Ron + UX pass, 2026-10-07; re-checked 2026-10-21 — still true in code: `removeRecent` just filters and
saves; passes Laws 16 and 18)
- Same treatment as a saved Search, **minus the confirmation**: remove at once, show a message that names it —
  *"Removed 'jodi taylor' from recent searches · Undo"* — and log it in the 🕐 history.
- No "Are you sure?" — recents are automatic history, and a question per row would nag.
- Route it through the shared undo/message path (the one tag and Search deletes use since 7.11.0), not a one-off.

#### "Bake this order into Manual" for a folder's books and a Book List, from the Sort menu
<!-- id 20261014-1030g -->

_Why it matters:_ Put a folder or a Book List in series (or any) order once, then adjust it by hand — today that's only
possible for the folder tree, from a menu you wouldn't look in.

**What you see** (Ron, 2026-10-21): the command exists — **"Bake this order into Manual…"** — but only in the left
pane's **FOLDERS → Name ▾** menu, and it orders the folder **tree**, not the books in a folder. Ron looked for it in the
right pane's Sort menu ("I'd expect it in the Sort menu") and couldn't find it. It also **appears only when the sort
isn't Manual** (readerwrangler.js `bakeOrderToManual`, ~3595; menu ~15947).

**Decided** (Ron + UX, 2026-10-21 — widened from "Book Lists: arrange by series number")
1. **One shared "Bake this order into Manual…" in the right pane's Sort menu**, for whatever the pane shows — a
   folder's books or a Book List. Arranging a Book List by series is then: sort by series, Bake.
2. **Always in the menu, in the same place; disabled (with a tooltip) when the sort is already Manual** — the menu rule
   ("Menus keep their items in place"). The left pane's existing one gets the same disabled-not-hidden fix.
3. **A multi-position book in a Book List gets one entry per run** (Ron: a Book List "is my reading order"): baking a
   series sort creates them, labeled with the run — *"Side Jobs — 2.5"*, *"Side Jobs — 4.5"* (the same "one entry per
   unbroken run" rule as series sorting); after that each moves independently; removing one entry removes only that
   occurrence. **Folders keep "once"** (manual order there is where a book is placed). These are list entries, not
   duplicate book records. This revises one line of "Series positions…" (High priority) — **build after it.**

**Not to confuse with:** "Number by current order", which sets each book's series **number** (it folds into the one
Position dialog — see "Series positions…").

#### Small fixes

##### What a reset clears: four resets, four different lists
<!-- id 20261106-1715 -->

_Why it matters:_ "Reset" should mean the same thing everywhere. The app has four resets and each clears its own hand-kept
list of saved settings — so an Emergency Reset can leave things a Reset App clears, and old Book Lists may come back
(Law 4: four answers to one question = one missing list). Found 2026-11-06 while fixing F3 (all four now share ONE
delete of the book store, storage.js `deleteBookStore` — 7.25.1).

**What each clears today** (besides the book store; checked 2026-11-06)

| Saved setting | Tools → Reset App | "Erase and Reset" (app won't load) | Emergency Reset page | Phone's Reset |
|---|---|---|---|---|
| library state, cache, status, filters, view, folders | ✅ | ✅ | ✅ | ✅ |
| **Book Lists** (`readerwrangler-booklists`) | ✅ | ❌ | ❌ | ❌ |
| settings (`readerwrangler-settings`) | ❌ | ✅ | ✅ | ✅ |
| theme, phone preferences | ❌ | ✅ | ❌ | ✅ |
| Cloud Sync credentials + status | ❌ (kept) | ❌ (kept) | ❌ (kept) | ✅ (says so in its confirm) |
| wizard settings, search history, phone navigation, desktop mode | mixed — see the four lists |

- **Likely bug:** the library load falls back to the separate Book Lists entry when no saved organization exists
  (readerwrangler.js ~4489) — so after any reset but Reset App, the old Book Lists may reappear. Check with a test.
- Where: readerwrangler.js `confirmReset` (~6400); readerwrangler.html (the inline emergency reset, ~372); reset.js
  `STORAGE_KEYS`; mobile.js `handleReset` (~2815).

**To decide (Ron):** what a reset clears — everything, or everything but the Cloud Sync Key (the desktop keeps it, the
phone clears it — deliberate?) — then ONE list (with the delete, in storage.js), every reset calls it, and a test
compares the browser's storage after each reset.

**Test gaps from 7.25.1** (filed per TESTING.md §6): RESET-001–005 cover Tools → Reset App only. The emergency "Erase
and Reset" (needs the app made to fail its load), the phone's Reset (the phone page) and the Emergency Reset page each
use the shared delete but have no test of their own — including the "Close your other tabs" wait. Build them with this
task's storage-comparison test.

##### Tidy up the notes
<!-- id 20261020-1448 -->

_Why it matters:_ Housekeeping — a few notes are in the wrong place. Details: see TODO notes.

##### Leave the affiliate tag off Amazon links on the test rig
<!-- id 20261021-1401 -->

_Why it matters:_ Ron's own testing clicks — and any purchase through them — count against RW's affiliate account,
muddying the stats, and Associates doesn't pay on your own purchases (repeated ones can draw a warning).

**What you see** (2026-10-21): every "View on Amazon" / Share link carries the tag on every build, localhost included
(`getAmazonUrl` in uiHelpers.js). The Associates dashboard showed 6 orders, 0 shipped, $0 — click spikes on Oct
12–16 match Ron's test sessions.

**Decided** (Ron + Claude, 2026-10-21)
- **Ask the existing central check — don't re-read the address:** leave the tag off when **`isTestingTraffic()`**
  is true (readerwrangler.html, 7.21.0: contributor mode — local server AND this browser's `readerwrangler-contributor`
  flag — or the dev site). Plain localhost is NOT enough: a self-hoster is localhost too and gets production behavior,
  tag included (the same split contributor mode already makes for the relay and the usage statistics).
- One place: `getAmazonUrl` asks it; nothing else builds a tagged link (verify with a search when building — the
  phone app and Share included).

##### Switch the affiliate tag to "readerwrangler-20"
<!-- id 20261021-1401a -->

_Why it matters:_ A tracking ID just for the app (created by Ron 2026-10-21) separates ReaderWrangler's clicks and
sales from Ron's WordPress articles in the Associates reports (today they're combined).

**To do**
- Change the one definition: `AMAZON_AFFILIATE_TAG` in uiHelpers.js (verified 2026-10-21: the only place in the code;
  the old tag `rclewent-20` stays on the WordPress articles). Bump uiHelpers.js's cache-buster.
- Update the examples in docs/design/SHARE-BOOK-FEATURE.md (they show the old tag); post-mortems stay as history.
- Pairs with "Leave the affiliate tag off Amazon links on the test rig" — same function, build together.

##### Tooltips where they help: icon-only, disabled, non-obvious, cut-off
<!-- id 20261021-1608; merged 20261014-1030az -->

_Why it matters:_ A control that doesn't explain itself gets skipped or misused — but a tooltip on every control is
noise that teaches people to ignore the ones that matter.

**The rule** (Ron + UX, 2026-10-21 — not "every control": a Save button whose tooltip says "Save" is noise; ~190
tooltips exist today). A tooltip is **required** on:
1. **Every icon-only control** (✕, 💾, 🗑, ⚙ …) — no words at all; it also needs a screen-reader label (overlaps
   "Finish keyboard accessibility", Polish).
2. **Every disabled control — saying why** (the rule in "Menus keep their items in place").
3. **Any control whose effect isn't obvious from its label** (Collections is read-only; "Bake this order into Manual").
4. **Text that gets cut off** — the tooltip shows it in full.
Everything else: no tooltip, deliberately.

**To do**
1. **First, a commit check for rule 1** (mechanical, so it can't decay): refuse an icon-only button with no tooltip or
   screen-reader label.
2. **Then the sweep** for rules 2–4 (judgment): two independent searches plus a walk of every dialog and menu; publish
   the list of places first.
- Absorbs "Tooltip review: Tag from Collections wizard" (After launch, one line — "Make sure every control explains
  itself"); that window's new tooltips (the ↻ / ✓ legend) are also written in its round 2. The book details window's
  tooltips are a column in "Book details window: one Save…" step 2.

##### Menus keep their items in place: disable, don't hide
<!-- id 20261021-1131 -->

_Why it matters:_ People find menu items by position as much as by word — an item that appears and disappears shifts
everything below it, and the click lands on the wrong thing (Ron, 2026-10-21: "menus that shift around [are]
confusing. Often I go by position almost as much as the word").

**The rule** (Ron + UX, 2026-10-21 — PRINCIPLES Law 16)
1. An item that **can** apply to this kind of thing stays in its place, **disabled** when it doesn't apply right now,
   with a tooltip saying why.
2. An item that can **never** apply to this kind of thing isn't in that menu at all (a book's menu has no "Empty
   Trash") — no shifting, because that menu always has the same items.
3. The test is "can this kind of object ever use it?", not "does it apply this moment?"

**To do:** check every menu (the menu bar's menus, every right-click menu, dropdowns) for items that come and go by
the current situation; make each one stay and disable instead. Publish the list of places first (two independent
searches, plus a walk of every menu). New items follow the rule from now on (e.g. "More by ‹author›" on a folder).

##### A book's hover popup stays up after the book is deleted
<!-- id 20261021-1026 -->

_Why it matters:_ It goes on describing a book that's gone — and could describe the wrong book.

**What you see** (Ron, 2026-10-21)
- In All Books, hover a book (the popup shows its folder), press **Del**: the book goes to the Trash and the covers
  shift over one, but the popup stays, now saying "Was in (before Trash): Folder X · Found in Trash". Moving the mouse
  slightly brings up the new book's popup.

**Decided** (Ron + UX)
- The popup closes when its book leaves the view. It's tied to the cursor's position, not to the book still being
  there; being right about the deleted book is luck — a shift could put a different book under the cursor.
- "Moved from Folder X" belongs in the Trash receipt instead: name the folder there.

##### The Trash ignores the search and filters
<!-- id 20261021-1026a -->

_Why it matters:_ With a filter on, every other place narrows to the matches — the Trash doesn't, which surprises.

**What you see** (Ron, 2026-10-21)
- With a filter on, the left pane shows Inbox as "0/956" (matching / total) but Trash as "(36)" — all of it. Opening
  the Trash shows every trashed book, not the matches.

**Decided** (Ron + UX)
1. **Inbox and Trash stay visible at 0 matches** — they're landmarks; fixed entries appearing and disappearing as you
   type is disorienting.
2. **The Trash follows the filter like Inbox:** its count reads matching / total ("0/36"), and opening it shows only the
   matching books.

**How (technical)**
- `trashCount` counts every deleted book with no filter (readerwrangler.js ~2492). No recorded reason found — an
  oversight. Check whether the Trash's *contents* skip the filter by design when building.

##### Show only hidden books
<!-- id 20260903-0000c -->

_Why it matters:_ Answers "what have I hidden?" — today you have to hunt for them.

**What you'd get** (ratified 2026-09-03)
- "Show Hidden" becomes three choices: **Hide hidden** / **Show all** / **Only hidden**.
- Today it only shows or hides them, so finding the 2 hidden books among 337 is impractical.

**Decided** (Ron + UX, 2026-10-21 — still a plain on/off in code: `showHidden`)
1. **A "Hidden ▾" filter button like its neighbors** (Read Status ▾, Tags ▾, Ownership ▾) instead of the checkbox:
   nothing new to learn, it lights up when not at the default, and its list shows the count — **"Only hidden (2)"**.
2. **Saved Searches keep working:** they store the old on/off (`filters.showHidden`, readerwrangler.js ~4057) — *off*
   becomes **Hide hidden**, *on* becomes **Show all**. The phone app has its own Show Hidden (mobile.js
   `filterBooks`): it gets the three choices too, or at least reads them.
3. **Settle the real default:** the app starts with hidden books hidden, but one place says
   `showHidden: true, // Default to showing all books` (~6688). Decide which is right so a new user isn't surprised.
   **Evidence (2026-11-04, the first screen test):** a fresh browser shows **"Show Hidden" ticked** — hidden books are
   shown by default.


##### Right-click: add "Copy ASINs" below Copy Titles / Copy Authors
<!-- id 20261015-1710 -->

_Why it matters:_ Getting the ASINs of several books today means opening each one; the list view's ASIN column can't be selected or copied.

**What you see** (Ron, 2026-10-15 — gathering ASINs to hand to Claude)
1. Add the ASIN column in list view: the values can't be selected, and Ctrl+C copies the books themselves (for
   pasting into folders), not text.
2. The book right-click menu already has **📝 Copy Title(s)** and **👤 Copy Author(s)** for a selection.

**What you'd get**
- **Copy ASIN(s)** right below them: the selected books' ASINs, one per line, in display order (same pattern).

**Decided** (Ron + UX, 2026-10-22)
1. **Flat, right after Copy Author(s), always present** (every book has an ASIN); receipt *"3 ASINs copied"*. Not a
   "Copy ▸" submenu — Copy Title is used often, and a submenu adds a hop to every use.
2. **One shared copy action:** Copy Title(s) and Copy Author(s) are near-duplicates today (build text → clipboard →
   receipt → close menu); a third copy is the moment to make one small helper — "copy these values, with this
   receipt" — so all three are one line each (Authors keeps its de-duplication). Same commit, under 20 lines.
3. **The receipt says "copied" only when it was:** today both items announce "Title copied!" without waiting for the
   clipboard, which a browser can refuse (Law 12). The helper waits; on refusal: *"Couldn't copy — your browser
   blocked the clipboard."* Fixes all three at once.

**How (technical)**
- Next to Copy Title(s) / Copy Author(s) in the book context menu (readerwrangler.js ~19535–19568 on 2026-10-22):
  `navigator.clipboard.writeText(...)` returns a promise — await it (catch the rejection) before the receipt.

##### Bulk Edit hints that read like "you can type several values"
<!-- id 20261015-1219 -->

_Why it matters:_ Two hints in the multi-book Edit boxes are easy to misread as "type more than one value here".

**What you see** (Ron, 2026-10-15)
1. Select 2 books with **different** series → right-click → Edit ▸ → **Series…**: the box shows **"Mixed (2 values)"**.
   It means "these books currently have 2 different series", but it reads like "enter 2 values" — Ron took it that way
   while looking for the "2, 4" feature (which is Edit ▸ → "Set numbers…").
2. The same "Mixed (N values)" appears in **Author…**, **Position…** and **Format…** — but only when the selected books
   currently differ. Ron's 2 books had the same position, so Position showed its normal hint instead…
3. …**"e.g., 1, 1.5"** — two example numbers separated by a comma, which looks like "a list is allowed". The box takes
   only **one** number (it applies the same position to every selected book).
4. (For reference: the book details window's Position also takes one number — a book has one position until
   "Series positions: one Position dialog, and one book at several positions" is built.)

**Decided** (Ron + UX, 2026-10-22 — the Position half is overtaken: the next day "Series positions…" (High priority)
made Position take a list (`13, 13.5, 14`, ranges) with a live preview, and removes "Set numbers…" from the menu — so
"e.g., 1, 1.5" becomes accurate, and that task already covers the hint until it ships)
1. **"Mixed" says what it means:** e.g. *"2 different series now — type one to use for all"* — in Author…, Series…,
   Format… (and Position… until the new dialog's preview replaces it).
2. **Show which values, not just how many:** a tooltip on the box — *"Now: Dune · Foundation"* — knowing which ones
   are mixed is usually the point of looking (Law 16).

**How (technical)**
- `Mixed (${uniqueValues.size} values)` in the bulk-edit dialog (readerwrangler.js ~13396), shared by Author / Series /
  Position / Format.

##### With a filter on, the right pane still shows subfolders with no matching books
<!-- id 20261103-1651 -->

_Why it matters:_ The hiding was written but has never run — the left pane hides folders with no matches, the right
pane's subfolder list doesn't. Found 2026-11-03 by the precompile load test ("Faster loading: build the app ahead of
time").

**Why it happens**
- The right pane's subfolder list (readerwrangler.js ~3318, `explorerVisibleFolders`) asks "is a filter on?"
  (`hasActiveFilters`) — a name declared ~5,400 lines later (~8760). Modern JavaScript refuses that (the precompiled
  page crashed: "Cannot access 'hasActiveFilters' before initialization"); the browser's compiler turns `const` into the
  older `var`, where the read quietly gives `undefined` — so the answer is always "no filter".

**Decided** (Ron + Claude, 2026-11-03)
1. Fix it by moving the declaration above its first use (or computing it there).
2. **The chokepoint — a commit check:** the name lists at the end of `useMemo` / `useEffect` / `useCallback` blocks
   (`}, [a, b, c]);`) are read as the screen is drawn, so any name in one that is declared further down is this bug,
   guaranteed. Scan for exactly that (the same family as the name check); publish what it finds before fixing — there
   may be more.
3. **Build together with "A folder or Book List you just created stays visible under filters"** — once the right pane
   really hides empty folders, a new folder hides there too.
4. Test step: turn on a filter, open a folder with subfolders — only subfolders with matching books (or "show all
   folders") appear.
5. **Then drop the `const` / `let` → `var` conversion in the build** (moved here from "Faster loading", decided item 3,
   when 7.27.0 shipped it): `@babel/plugin-transform-block-scoping` in tools/build/compile.js — once item 2's check is
   clean, so the next such bug is a visible crash, not a silent "undefined".
- Tool survey 2026-11-03 (docs/design/TOOL-SURVEY.md): ESLint's `no-use-before-define` (+ `eslint-plugin-react-hooks`) in a commit check is
  the ready-made form of item 2 — expect tuning, since it also flags reads inside functions that only run later.

##### A missing book description: one quiet line, on the computer and the phone
<!-- id 20261014-1030ap -->

_Why it matters:_ So a missing description reads as known, not broken — and the phone says the same as the computer
(Ron, 2026-10-15: "Phone should match").

**Today** (checked 2026-11-04)
- The **computer**'s book details window shows a yellow ⚠️ box: "Description not available — This book may not have a
  description in Amazon's database, or the description wasn't captured during the library fetch." (readerwrangler.js
  ~14308; since v3.5).
- The **phone** hides the section entirely (mobile.js ~2236).

**Decided** (Ron + Claude, 2026-11-04, in the TODO review — moved here from After launch → Technical clean-up)
1. **A quiet, muted line, not a warning box** (Law 12 — many books simply have no description on Amazon; that's
   normal): *"No description from Amazon for this book."*
2. **A remedy only when there is one:** add *"A full refresh from Amazon may fill it in"* once "Refresh all books from
   Amazon…" exists; until then, just the plain line.
3. **Written once, used by both:** the wording lives in one shared place (uiHelpers) that the computer and the phone
   both use, so they can't drift apart again.

##### Remove the old version 4 app from the site — it shares your library's storage
<!-- id 20261104-1254 -->

_Why it matters:_ The old app is still live at readerwrangler.com/v4/readerwrangler.html (checked 2026-11-04: it
answers). Browsers keep storage per **site**, not per folder, so it shares the **same storage as the real library** —
anyone who opens it (a stray bookmark, a search result) runs old code against current library data. It's also simply
confusing.

**Decided** (Ron + Claude, 2026-11-04, in the TODO review — replaces the 2026-02-05 decision to keep it online "as
historical reference", docs/design/archive/V4-REMOVAL-PLAN.md)
1. Delete the `v4/` folder; git history keeps it forever (every release tag up to `v7.25.0` still contains it).
2. Drop `v4/` from the version guard's not-shipped list (git-hooks/version-guard.py); add a note to the removal plan.
3. Nothing links to it (checked 2026-11-04: only a code comment and archived design notes mention it).
4. Closed at the same time: "Check nothing was lost between versions 4 and 5" — nine months and 20+ releases of daily
   use since 5.0, the book-field table's round-trip check guards the data, and outside review 4 looks at today's
   features fresh.

##### Every edit rewrites the whole library in storage
<!-- id 20261110-1734 -->

_Why it matters:_ Changing one book — a tag, a rating, a move — saves all 3,270 books again (the book store is cleared
and refilled each time, ~0.9 s on Ron's PC): slow work after every change, and a full rewrite is a needless chance
for something to go wrong. Found 2026-11-10 while fixing the load's save ("Faster loading").

**What to look into**
1. `saveBooksToIndexedDB(updated)` is called from more than 60 places with the whole list; it clears the store and
   adds every book (storage.js). The class needs a site map first.
2. Likely shape: one save that writes only the books that changed (the store keys books by id) — the same "compare
   with what's stored" idea as the load's `saveBooksIfChanged`, or the callers say which books they changed.
3. Keep the write lock and the one-transaction safety (no moment where a reader sees half a library).
4. **Discussed 2026-11-10 (Ron + Claude):** the save finds the delta itself — a changed book is a new copy (the app
   doesn't edit books in place), so "not the same copy as last saved" costs ~1 ms for 3,270; only those are written,
   removed ones deleted, in one transaction. Ron: **also change the 60 places once to call one common function** —
   most repeat the same pattern (`setBooks(prev => { const updated = …; saveBooksToIndexedDB(updated); return
   updated; })`), so one `updateBooks(change)` (the state update + the save, the delta inside it) is the chokepoint,
   and a new call site can't forget the save. Claude agrees: both together. First the site map (does every site make
   new copies?), a contributor-mode guard that compares by content now and then, and a test that edits and reloads.

##### The phone's cover copies: still worth it? And why wasn't the browser's own cache enough?
<!-- id 20261110-1734a -->

_Why it matters:_ The desktop dropped its cover copies in 7.27.0 (it hadn't drawn from them since 5.0.0, and reading
them held every load back by seconds). The phone still reads every cover copy into memory at start — maybe the same
cost for little gain.

**What to look into**
1. Time the phone's start with and without its copies (mobile.js's load reads them before showing covers?).
2. Ron (2026-11-10): the copies were added in 4.14.0 for speed — "we were seeing speed issues and the cache helped" —
   and nobody remembers why the browser's own image cache wasn't enough then. Find out before removing them: the
   browser's cache is shared with every site and can drop images; Amazon's image server may ask the browser to check
   back; 3,270 images requested at once may have been the real cost.

##### Relay Setup's Test connection always checks the production relay
<!-- id 20261102-1503 -->

_Why it matters:_ In contributor mode (Ron's localhost, which uses the dev relay) **Test connection** asks the
production relay instead — so a revoked channel or an outage on dev can show the wrong answer (found 2026-11-02 in
the TODO review, not yet tested).

**Restored 2026-11-10:** filed 2026-11-02 15:03 and lost 27 minutes later — deleted by accident inside a large TODO
edit (commit dedc3ca, the two-tab tasks merge), with no word in its message; never fixed (checked 2026-11-10: the
address is still hard-coded). Found by the backlog report's audit of "dropped" tasks.

**How (technical)**
- readerwrangler.js ~1998 (the `'test'` case) fetches a hard-coded production worker address before calling
  `RWRelay.getDeviceState()`; use the one place that answers which relay this copy talks to (relay-client's
  `workerUrl()`) — comb for other hard-coded relay addresses in the same pass.

#### Auto-Organize: Shift-click ranges should follow what you see
<!-- id 20261014-1030d -->

_Why it matters:_ Shift-click selects by a hidden internal order that can differ from the order on screen.

**What you see**
- In Auto-Organize, Shift-click a range. In series mode, and in the grouped "Already filed" list, the selected range doesn't match the books between your two clicks on screen.
- **Confirmed still broken in "Already filed"** (Ron, 2026-10-14).

**How to make a test case**
- A normal Inbox has few or no "Already filed" books. To get a useful list: **copy several books from organized folders into the Inbox** (books from more than one series), then open Auto-Organize on the Inbox.
- Click a book in the "Already filed" section, then Shift-click one further down in it: only the books between them on screen should toggle.

**How (technical)**
- 6.16.0 rebuilt the range to follow display order (`getPreviewOrderedBooks`, readerwrangler.js ~9213–9246) — correct for the books being moved, but it pushes the **already-filed** books in their stored order (`preview.alreadyFiled`), not their on-screen grouping. Also check series mode against what's drawn. Deferred from 7.9.0.
- **One shared rule, not an Auto-Organize-only fix** (Ron + UX, 2026-10-22): "a Shift-click range = what's between
  your two clicks on screen" for every list with Shift-click — the main view, Tag from Collections, Removed books.
  When building, check they all use the same on-screen-order helper, so this bug can't live in one list but not another.

#### Folder right-click menu: add Auto-Organize
<!-- id 20261014-1714 -->

_Why it matters:_ Auto-Organize works on a folder, so right-clicking the folder is a natural place to look for it.

**What you see**
- Auto-Organize… is on the right-click menu of a **book** and of the **Inbox**, but not of an ordinary folder.

**What you'd get**
- "✨ Auto-Organize…" on the folder right-click menu, in its "where things go" group (Move to / Top / Bottom / Pin).
  It opens the preview for that folder.
- **Always there, in the same place** (the menu rule, 2026-10-22): in an empty folder it's disabled, with the tooltip
  *"Nothing to organize — this folder has no books."*

**Status:** Ron, 2026-10-14 (noticed while comparing right-click menus with the menu bar); re-confirmed 2026-10-22
("I thought I could right-click a folder and AO. I can't").

**How (technical)**
- Folder menu: readerwrangler.js ~18443 (`folderContextMenu`). The Inbox menu's entry (~18348) and the book menu's
  (~19292) show how to open it scoped to a folder.

#### Redo should work after copying a folder
<!-- id 20261014-1030w -->

_Why it matters:_ Ctrl+Y after undoing a folder copy shows an error instead of redoing it — and a redo that refuses
teaches you not to trust redo.

**What you see** (checked in code 2026-10-22): copy a folder, Ctrl+Z, Ctrl+Y → the error toast *"Cannot redo copy
operation"* (readerwrangler.js ~8321, the `COPY_PASTE_FOLDER` redo case).

**Rewritten 2026-10-22** (Ron + UX) from "Finish routing every change through one shared path, with undo": the rest
of it was done in 6.13.1 and 7.11.0 (tag and Search deletes, the rename family, Search save/delete, folder and book
moves — see CHANGELOG); its "Why" and a second "Left" list still named those. Removing a recent search has its own task.

**How (technical)**
- The redo case of `COPY_PASTE_FOLDER` (~8316–8321); the undo case ~7768. Shared operations: `deleteFolder`,
  `moveItems`, `reparentFolder`. Design: docs/design/OPERATIONS-REFACTOR.md.
- Note for whoever next touches this code: fold the folder-move part of `moveItems` into the one folder-move
  operation (`reparentFolder`) — no visible change, but one path instead of two doing the same job.

#### The "open" shortcut: start serve.py if needed and open the app
<!-- id 20261104-1540 -->

_Why it matters:_ A convenience — one click opens ReaderWrangler locally, starting the server first if it isn't running.
Split out 2026-11-04 from "Carry over the utilities project's improvements…" (Ron: "the shortcut part can wait").

**Decided** (Ron + Claude, 2026-10-31)
- **`tools/shortcuts.py`** writes the shortcut(s); the shortcut opens the page, starting `serve.py` first if it isn't
  running. The open half only — no restart or shutdown: `serve.py` only serves files and rarely changes, and it listens
  on the home network on purpose, so an off switch any device there could press gains nothing (the utilities
  project's decision). Source: `C:\Users\Ron\Projects\Hsv-Utilities-App\tools\shortcuts.py`.

#### Working-process safety net: three small follow-ups
<!-- id 20261015-1917 -->

_Why it matters:_ Closes the last gaps left after "Save our working process in git" (done 2026-10-15).

**Decided** (Ron + UX, 2026-10-22)
1. **Warn loudly when a copy of the project isn't set up for the commit checks** (`core.hooksPath` isn't `git-hooks`
   — a local git setting a clone never brings, which is the real "install" step; the session hooks themselves travel
   with the repo). **In serve.py first** — every contributor runs it to test locally, including people who don't use
   Claude Code (Ron runs it at logon) — and in the session-start hook for Claude's sessions.
2. **Back up the global settings file** (`~/.claude/settings.json` — it wires the timestamp hook; no secrets, but
   personal paths and project names) **into the Projects repo**, next to `stamp.py` and CLAUDE-TOOLING.md. That repo
   (Ron-L/projects-root, renamed from homelab-notes 2026-10-22) is **private** — Ron confirmed 2026-10-22. Add the
   file to its `.gitignore` allow-list, or git never sees it.
3. **Memory backs itself up at every release:** a small script copies memory into the private repo's
   `claude-backup/memory/` (and the global settings into the Projects repo), commits and pushes — run as a
   **release-checklist step**, so the backup is never more than one release behind. Not a per-turn hook (a commit per
   turn is noise). Why: the by-hand backup slipped a week (Oct 15 → 22: 56 files backed up of 68, 18 differing) —
   refreshed by hand 2026-10-22 (private repo `f785de3`).

**How (technical)**
- Item 1: serve.py's start-up and the SessionStart hook (beside `gate-reset.py`) check `git config core.hooksPath`
  and print a loud warning when it isn't `git-hooks`.
- Item 3: what it copies today by hand — `~/.claude/projects/c--Users-Ron-Projects-ReaderWrangler/memory/*.md` into
  `claude-backup/memory/`, plus `.claude/settings.local.json` (see that folder's README; update its "whether to
  automate" line when built). A Python script (pytools `keepopen`), like the other tools.

## 🚦 Before public launch

_Formerly: 🚦 Pre-Launch (must-do before public launch)_

### Help, docs and onboarding

_Formerly: Docs & onboarding_

#### Site pages use the shared named colors, so all four themes work (the security page's high-contrast light first)
<!-- id 20260909-0000 -->

_Why it matters:_ The site pages are a reader's first look at RW. Today each one fixes its themes with its own override
rules, so any color it misses stays wrong in some theme — and two pages have no themes at all.

**Done already** (2026-09-09)
- The security page's wrong statements were fixed, plus its navigation, and its Dark / High-contrast dark themes.

**Decided** (Ron, 2026-10-22, in the TODO review)
1. **Fix by naming colors, not by adding override rules** — the same decision as "Dark theme: fix the unreadable bar
   and the light strips" (Decided 3). The security page's High-contrast light is the first page done this way, not
   another override.
2. **All four themes on every site page** (Light, Dark, High-contrast light, High-contrast dark), computer and phone.
3. **The Dark theme task's commit-time color check covers the site pages too**, so a new fixed color on a site page
   is refused just like one in the app.

**What's there today** (checked 2026-10-22)
- index, features and tutorials: all four themes, each through its own page's override rules.
- security: Dark and High-contrast dark only (override rules); High-contrast light is missing.
- changelog and reset: no themes at all — they always show Light.

**How (technical)**
- Each page has its own inline `[data-theme=…]` rules and its own copy of the theme-picking script (reads
  `readerwrangler-theme`, falls back to the system's dark setting). Move both into one shared file the pages load:
  the named colors, defined once per theme, plus the one script. Each page then keeps only its layout.
- Whether that shared file is readerwrangler.css's color names or a small site file built from the same names:
  decide when building — the names must be the same ones the app uses.
- Pages: index, features, tutorials, security, changelog, reset (readerwrangler.html is the app — the Dark theme
  task).
- **Then write RW's own `DESIGN.md`** (2026-10-31, from the awesome-design-md idea — RW's own look, never another
  brand's): the named colors for each of the four themes, typography, components, do's and don'ts — one source for
  Claude, the outside reviewers and any future contributor. Keep it in step with the named colors (the commit check
  that verifies every name is defined in all four themes can verify DESIGN.md lists them too).

#### Landing page: "Open My Library" for returning users, and "Always free · No ads · No account needed" under the start button
<!-- id 20261030-1036 -->

_Why it matters:_ A returning user arriving at readerwrangler.com sees "Get Started — It's Free!", a sign-up-style
button, and has to hunt for the way in (the top bar's "Launch ReaderWrangler" is easy to miss — Ron: "My attention is
drawn to the center"). And what makes RW different — always free, no ads, no account — sits in a row further down.

**Decided** (Ron + UX, 2026-10-30)
1. **One adaptive hero button:** a returning user sees **"Open My Library →"**, a new visitor **"Get Started"**. Both
   go to the same app — only the words change, so nobody needs a way to "get" the other one (starting over is Tools →
   Reset App, not this button).
2. **How it knows:** the app writes a small "this browser has a library" marker when it loads one; the landing page
   checks only that the marker exists — locally, nothing sent, the same way it already picks your theme. It never looks
   at the Cloud Sync Key.
3. **Never redirect** a returning user into the app — some come back to read the page or share it (Ron: it "breaks our
   rules"). The top bar's "Launch ReaderWrangler" stays for both.
4. **One quiet line under the button:** "Always free · No ads · No account needed" — the button names the action;
   benefits read better beneath it.
5. **"Always free" is safe** (Ron, 2026-10-30): charging would mean a different product — RW runs in the user's
   browser, has no accounts to bill, and anyone can host it themselves. If hosting costs ever grow, the levers are fair
   limits on cloud storage, donations or hosting your own copy — never a paywall. Say so once in the FAQ.
6. **"No ads" stays honest** because the affiliate support stays disclosed (the "100% free" item's tooltip: "Supported
   by Amazon affiliate links"). That disclosure is also Amazon's requirement — see outside review 1.
7. **Align the trust row** below: "100% free" → "Always free", and consider a "No ads" item, so the two places say the
   same thing in the same words.
8. **Both buttons' tooltips** today read "The app walks you through setup — relay, bookmarklet, and first import":
   wrong for a returning user, and "relay" is a retired word. Give the returning-user button its own tooltip; the
   Cloud Sync task's commit check catches "relay".

**How (technical)**
- Buttons: index.html ~1278 (top bar) and ~1325 (hero, `.cta-buttons`); the trust row ~1424. The theme check near the
  top of index.html shows the pattern for reading the app's local setting. The marker: written by the app when a
  library loads (readerwrangler.js) — a tiny app change, so an alpha + version bump.

#### Say plainly what ReaderWrangler works with: US Amazon, Kindle, English, Chrome
<!-- id 20261018-1422b -->

_Why it matters:_ Assumptions baked into the product are nowhere stated — a UK reader, or someone expecting paperbacks, finds out only by failing.

**The facts** (each verified in the code or docs, 2026-10-16; facts 4–5 corrected 2026-11-01)
1. **Amazon's US store only.** Every fetcher talks to amazon.com only, and prices are read as US dollars (details: see
   TODO notes).
2. **Formats** — the library fetch brings in **everything** in your Amazon library, every format (Kindle purchases, samples, Prime, Kindle Unlimited, loans — and print, audio, even a DVD bought on Amazon); series and author adds take Kindle editions only; **the one-book Add Book to Wishlist takes any format** (deliberately — a paperback can hold a place until a Kindle edition exists). Undoing the Kindle-only preference: Someday task "Formats other than Kindle".
3. **The app is in English.** The books can be in any language.
4. **Browsers:** tested on **Chrome**. **Edge** should work (it's built on the same engine as Chrome) — and once the
   browser driver exists (High priority; it runs Edge) it becomes "tested by the automated tests" for real; say so
   then. **Firefox** was confirmed working once, long ago, but isn't regularly tested. Safari is untested. _(Today the
   docs contradict each other — and two of them are false: README / features page "Tested: Chrome, Edge, Firefox"
   (neither Edge nor Firefox is tested), User Guide "Firefox is also fully supported"; SUPPORT-KB "We only test
   Chrome" is right. Fix them all in ONE pass with this task — Ron, 2026-11-01: not a partial fix ahead of it; with
   essentially no visitors yet, nobody is relying on the claim.)_
5. **Fetching and organizing need a computer** (the bookmarklet runs on Amazon's site in a desktop browser). **The
   phone is read-only**: it shows your library and never writes changes (SUPPORT-KB "What is the mobile app?" —
   checked 2026-11-01; the old wording "the phone views and organizes" was wrong).

**Where it goes** (Ron, 2026-10-16; 2 and 5 revised 2026-11-01)
1. A short **"What ReaderWrangler works with"** section in the User Guide (written in the User Guide task, below).
2. **On the landing page, folded into the existing sub-tagline** — e.g. "Import your Kindle library from
   **Amazon.com** in minutes…" — not a new line: the "Open My Library" landing task already adds "Always free · No
   ads · No account needed" under the button, and a third line would crowd the hero. The features page says it once.
3. One question in SUPPORT-KB.
4. A developer list in docs/reference/ARCHITECTURE.md — every spot a future change (another country, another app language) would touch.
5. **Say it at the moment it matters (Law 16)** — when the bookmarklet runs on any Amazon site other than amazon.com,
   it says "ReaderWrangler works with Amazon.com (the US store) only, for now" instead of offering to send the user to
   amazon.com's library page (today's dead end for a UK account — details: see TODO notes). The docs explain it; the
   message catches the person who never read them. The same change for all three bookmarklets → dev and prod together.

Ron's word on the wording first.

#### User Guide: rewrite it around Searches, Book Lists and Folders, as a page you can reach from Help
<!-- id 20260910-0000c; merged 20261014-1030bd, 20261014-1030o, 20261014-1030bg -->

_Why it matters:_ The guide never mentions Book Lists (checked 2026-10-22: 0 times in 455 lines), and no reader can
find it — it's on the site only as GitHub's plain, unthemed, unlinked copy (`readerwrangler.com/USER-GUIDE.html`); the
Help menu has How To Use, Watch Tutorials and Keyboard Shortcuts, but no guide. The same file is what the support
assistant will read, so it has to be complete and stay current.

**Decided** (Ron, 2026-10-22, in the TODO review — "go with your ideas all the way")
1. **One file: USER-GUIDE.md, for people, the support assistant and anyone pasting it into their own chatbot.** It
   stays Markdown: well-headed, self-contained sections suit the assistant (an HTML page would mix menus and theme code
   into what it reads).
2. **A themed page shows it:** `guide.html` loads USER-GUIDE.md and displays it, using the site pages' shared named
   colors (the task above), so all four themes work. Linked as **Help → User Guide** in the app, and from the site
   pages' links and README. How To Use stays as the short first-run version and links to the guide for more.
3. **One FAQ, inside the guide** — not a separate faq.html (merged the "Create a FAQ page" task). Sections: Security /
   Privacy, Data / Backup, Troubleshooting, Library, General; question-shaped entries (what users actually type). The
   footers and README link straight to it. Two FAQs would drift apart, as the browser claims already have.
4. **Every feature is covered — by a check, not by memory.** Every place a user reaches a feature carries a **guide
   section name** pointing at the guide (e.g. `guide="move-books"`) — a name, never text, so nothing is written twice:
   menu-bar items (20), popups including right-click menus (76), dialogs (40), the confirm-style boxes (~19), and the
   keyboard-shortcut list. A commit check refuses (a) any of those without a guide name — a place that truly needs
   none says so with a reason (e.g. a picker inside a dialog) — and (b) any guide name with no matching section in
   USER-GUIDE.md. It also reports guide sections nothing points at (a removed feature's leftovers). Counts from
   2026-10-22.
5. **The first run of that check is the sweep:** the list of places with no guide name is the rewrite's outline.
6. **A "?" in each dialog** opens the guide at its section — cheap once the names exist; real help where you are.
7. **Behavior with nothing to click** (a book leaving its last folder goes to the Inbox; the drag rules) can't be caught
   by the check. When the new guide ships, add to the release checklist: the help-notes comb also covers the guide —
   every CHANGELOG line gets a guide check.
8. **Build it last in Before launch** — it describes behavior still being decided or built. Wait for: "Cloud Sync:
   rename Relay, show one Cloud Sync Key, and 'make a new key' retires the old one" (so the new names land once), "Move and copy
   books anywhere — folders, Book Lists, All Books, Searches", and "The Delete key deletes the folder you're in — not
   the folders you selected".

**What it should cover**
- The four places: All Books / Searches / Book Lists / Folders — what each is for, and "when to use which".
- **"One book, many places"** (merged the "Wording pass: explain Book List shortcuts and Linked Copies" task): the
  same book can be in several folders and Book Lists — not a duplicate; **All Books and Searches are views** (Ron:
  nothing is put into or taken out of them); folders file books, Book Lists are free-form. Draft text and the facts
  behind it: docs/design/TERMINOLOGY.md. **No "shortcut", no "Linked Copies"** — both retired 2026-10-22 (why: same
  doc); the screens already say "Remove from this list", and stay as they are.
- **The Book List ↔ Folder pattern:** structure lives in Folders; to-read queues live in Book Lists.
- "Getting books out of the Inbox → use a folder, not a Book List."
- **Fields you can't filter by:** show the other way, e.g. List view → add that column → sort (merged task).
- **"What ReaderWrangler works with"** (from the "Say plainly…" task above).
- **Starting over** (Ron, 2026-10-30): Tools → Reset App — when to use it, what it clears and what it keeps; switching
  to a different Amazon account; clearing all books and organization to start from scratch. The old guide has a
  Reset App section and an FAQ entry; keep them, corrected.
- A glossary and a "what ReaderWrangler doesn't do (yet)" section (the support assistant plan's two best defenses
  against made-up answers).
- **FAQ: "How is ReaderWrangler different from Readwise Books, Goodreads or StoryGraph?"** (Ron, 2026-10-30). They are
  for *reading* (where you read, track sessions, rate, buy — Readwise Books sells ebooks); ReaderWrangler **organizes
  the Kindle library you already own** — nested folders, series, Book Lists, tags, Auto-Organize, wishlist prices — and
  never sells or displays books. No account; it runs in your browser. They can be used together. Also a line for the
  "doesn't do" section: RW doesn't open or read books.

**Sources**
- Examples of taming a backlog: docs/design/WORKFLOW-PATTERNS.md.
- Facts and FAQ: docs/design/SUPPORT-KB.md (mined 2026-09-10 from every session back to May, and kept current at each release).

**How (technical)**
- "Holds vs. points at" = the custodial vs. supplemental model.
- The live site serves the raw `USER-GUIDE.md` (checked 2026-10-22: `text/markdown`), so `guide.html` can fetch and
  display it with a Markdown library from a CDN (exact version, integrity check, inside the page's security policy —
  see "Outside code libraries: exact versions, integrity checks, and a policy…"). Prove that works on dev before
  relying on it. Decide then whether GitHub's automatic
  `USER-GUIDE.html` copy should be hidden or point at guide.html.
- The guide-name check sits beside `git-hooks/check-names.js`, run from `git-hooks/pre-commit`; the guide name is a
  prop on `MenuBarItem` / `<Dialog>` / `<Popover>`, an argument to the confirm-style boxes, and a field in the
  shortcut list. Section names = the guide's headings' anchors.

#### A public demo library from Amazon's best-seller lists (nothing personal)
<!-- id 20261104-1613 -->

_Why it matters:_ The sizzle reel, the landing page's pictures and the User Guide's screenshots need believable books.
Today's demo library is made from Ron's own purchases — public by his choice, but it shows what he owns. Best sellers
and classics are recognizable, show off Auto-Organize (real series, authors with many books), and are nobody's
library.

**Decided** (Ron + Claude, 2026-11-04)
1. **Read the lists from the page Ron is viewing:** Amazon's best-seller pages (the NYT 2026 list — 7 pages — Kindle and
   Classics categories) carry each book's ASIN, title and author in the page itself. Ron opens a page and runs one
   **read-only console snippet** that collects them — no extra requests; next page, run again. (No saving pages.)
2. **Depth: "More like this"** (the recommendations request probed 2026-11-03) turns each book into ten more — together
   with the NYT pages, toward **~3,000 books** (Ron): also a selling point on camera ("your whole library, organized").
3. **Details in one paced run:** the fetcher's own batch lookup (30 books per request) fills in covers, descriptions and
   ratings; the snippet writes a file. Paced, with the human-check stop in mind — every request read-only, of a kind
   the fetcher already makes. Request details: see TODO notes when building.
4. **A generator on Claude's side** packs it into a demo backup — folders by author and series, Book Lists, a few books
   in the Trash and hidden — the same way the test libraries are generated.
   - **It must pass Restore's backup check** (backupCheck.js, 7.26.0; Ron's rules, 2026-11-08): Restore replaces
     everything but the Cloud Sync credentials (merged only after asking), so a part that's missing or empty becomes
     empty, and a backup is refused only when that leaves the library unusable. Required, each the right kind: the
     backup marker (`isBackup: true`), a `2.x` version stamp, the list of books (`books.items`, a list), and the tag
     list (`tagRegistry`, a table) whenever any book has a tag. Folders, Book Lists and Searches: write them (an empty
     list is fine) — a missing one restores as none (with no folders, every book lands in the Inbox). Any part that's
     written must be the right kind (collections' `items` a list, the view settings a table).
   - **Write every part today's Save Backup writes**, and none of the obsolete ones ("Remove code left over from older
     versions…", Polish: no `hiddenInstances`, `pinnedTagFolders`, `dataSource`, `lastSyncTime`).
   - **No Cloud Sync credentials** in the file (the private-values commit check refuses them; the old demo files' were
     revoked 2026-10-31).
   - **Each book**: what "Restore checks every book, folder and list inside a backup…" (Before launch → Safety and data
     protection) will require — an ASIN, unique; each folder an ID, a name, a parent and a list of books.
   - **Test it the way a person would:** a screen test restores the generated file and checks the counts and folders.
5. **It replaces the demo library made from Ron's purchases** (`readerwrangler-demo-library*.json` and the demo filter's
   list in `tools/demo-library/`) — retire those once the reel no longer needs them.
6. **Covers:** real ones from Amazon on camera — thumbnails, plus one or two full size in a book window. Ron's call
   (2026-11-04): fair use as he sees it, and he accepts the risk of a cease-and-desist; listed for outside review 1 so
   it sees the whole picture.
- **Built before "Screen capture pass…"** (just below), which records with it.

#### Screen capture pass: the sizzle reel, the landing page's before / after, README's old video
<!-- id 20261014-1030bc; merged 20261014-1030al -->

_Why it matters:_ What the public sees of the app is stale: the landing page's before / after pictures predate the
redesign, and README links a walkthrough video (39 MB) of the old way of organizing. The sizzle reel (DEMO-LIBRARY-PLAN.md,
"Video 0": 20–30 s, rapid cuts, music, no voiceover) was planned but **never made** — Ron: "I think the sizzle reel
will be a seller."

**Decided** (Ron + UX, 2026-10-23, in the TODO review; merged "Refresh the landing page's before / after screenshot")
1. **One pass, one sitting:** the sizzle reel, the before / after pictures, the preview thumbnail — same demo library,
   same build. The User Guide's screenshots come from the same pass.
2. **Last in Before launch, with the User Guide** — nearly everything on screen is about to change (Cloud Sync names,
   drag labels, site-page themes, the Send buttons); recording sooner means recording twice.
3. **If the outside newcomer review runs** ("Outside reviews before building", review 4), write the reel's script after
   it — it may change what the landing page needs to say, and the reel is the landing page's opening.
4. **README's old walkthrough video: remove it** (link and file), not replace it.
5. **Use the public demo library** — "A public demo library from Amazon's best-seller lists" (just above), built
   first; Ron's real library never appears on screen. (Until then: today's demo library and the fetcher's demo filter.)
6. **Keep the reel in the plan** — though Ron dreads making it (the tutorials were "super tedious", which is why they
   were cancelled; the support assistant replaces tutorials 2–8).

**Approach note** (Ron + Claude, 2026-11-03 — discussed, to confirm when this comes up; the answer to Ron's dread of
the tedious part)
1. **Scripted takes:** the browser driver ("Carry over the utilities project's improvements…") plays the shot list on
   the demo library — real clicks, drags and menus, identical every time; a UI change means re-running, not re-shooting.
   This tips that task's "Playwright or copy `drive_page.mjs`?" toward **Playwright**, which records video itself.
2. **Assembly by Claude:** FFmpeg (cuts, joins, fades, titles, captions, even sound levels) — or Remotion (video built
   from the same kind of code as the app, so title cards can use its real look). Claude can't watch video or hear
   sound directly, but can check cuts frame by frame as pictures.
3. **Sound placement: Earshot** (github.com/Leonxlnx/earshot, MIT, runs on the PC) turns audio into text Claude can
   read — what a sound is, exactly when events happen, whether sound lines up with picture — plus a bank of 201 sound
   effects. Its own limits: no taste, no licensing judgments. **Before using:** it was version 0.1.0 on 2026-11-03 and
   connects to Claude as a tool server — read it and pin an exact version (our outside-code rules); leave its optional
   critique (sends audio to Google's Gemini) off.
4. **Taste stays Ron's:** he watches drafts and says what's wrong.
5. **To decide then:** this mostly replaces DaVinci Resolve for assembly (Claude can't drive Resolve's screens).

**Spec:** docs/design/DEMO-LIBRARY-PLAN.md (Video 0 shot list, the demo library, the fetcher's demo filter);
docs/design/VIDEO-PRODUCTION-GUIDE.md (tools); the demo prep scripts: `tools/demo-library/`.
**Video work stays outside the repo** (e.g. `Documents\ReaderWrangler-video\`; decided 2026-11-02 when the old
`tutorials/` work files — 200+ MB of clips, narration, Resolve projects and a saved Amazon page with account details —
were deleted as out of date): one stray `git add` must never be able to commit them.
**Tool survey 2026-11-03** (docs/design/TOOL-SURVEY.md): takes with Playwright for Python's `page.screencast` (chapter cards, a visible
cursor, drives the installed Edge); assembly with FFmpeg or Remotion (free for individuals; render from the command
line — browser-side rendering reports usage); Earshot only after vetting and pinning a commit.

#### Build the support assistant (custom GPT)
<!-- id 20261014-1030i -->

_Why it matters:_ Lets users get answers without waiting for you.

**What you'd get**
- A custom GPT that answers ReaderWrangler questions, linked from the Help menu.

**Decided** (Ron, 2026-10-22)
- **It reads USER-GUIDE.md — the same file people read** (the User Guide task above); no separate manual.
- **The uploaded copy is the one thing that can drift.** A custom GPT keeps its own copy (believed not to re-read our
  site by itself — confirm when building). So: the guide carries an "up to date through release X" stamp, the
  assistant is told to quote it when asked, and the release checklist gets "re-upload the guide to the assistant".

**Decided** (Ron + Claude, 2026-11-01, in the TODO review)
1. **Choose the platform when building, from current facts** — the custom-GPT choice dates from July (Ron's ~$20/mo
   authoring seat; users need a ChatGPT account; free-account limits change). Compare then: a custom GPT, a Claude
   equivalent (the spec's own "evaluate" line), an assistant on our own site through an API (per-use cost, no outside
   account). Prices and limits move monthly — no recommendation ahead of time.
2. **It never asks for, or accepts, the Cloud Sync Key.** Support chats are where people paste secrets. Its
   instructions say never to request it, and to tell anyone who pastes it to make a new key; the User Guide's
   troubleshooting says "nobody needs your key to help you".
3. **A way out when it can't answer:** the support inbox, if launch-risk review 1 brings one ("email support@…"), else
   a link to report an issue — never a dead end.
4. (Not a change — the "one file" decision applied:) the help notes (SUPPORT-KB) aren't uploaded separately; their
   troubleshooting answers flow into the User Guide's FAQ and troubleshooting when the guide is written.

**Spec:** docs/design/SUPPORT-GPT.md.

### Cloud Sync

One pass through the setup window and the words around it (gathered 2026-11-04 in the TODO scan from Help, Polish
and Safety — each of these already said "touch the window once"). Build order: the rename first, then the rest in
its new words.


#### Cloud Sync: rename Relay, show one Cloud Sync Key, and 'make a new key' retires the old one
<!-- id 20260828-0000a -->

_Why it matters:_ "Relay", "Credentials", "Channel ID" and "Passphrase" are engineering words, and users juggle two
values that are really one secret. And today making new credentials doesn't retire the old ones: whoever holds an old
key can still read the full cloud copy (it never expires) and write to or wipe it. Renaming is free before launch and
expensive after.

**The record: docs/design/CLOUD-SYNC-NAMING.md** — everything decided, why, what was rejected, and the check-character
test. Decided 2026-10-23 (Ron + UX, three outside-review rounds). **Anti-bounce rule:** only a real user's misreading
reopens a name, never a new argument.

**What you'd get** (details in the record)
1. **The words:** Cloud Sync · Cloud Sync Setup · Import from Cloud Sync · **Cloud Sync Key** (one key; "Credentials",
   "Channel ID", "Passphrase" leave the screens) · Save Key · Make a new key · the bookmarklet's buttons **Send Library
   to ReaderWrangler** / **Send Collections to ReaderWrangler** · "the sync server" on the security page. Data Status
   and "bookmarklet" stay. About 80+ places (app ~52, phone 3, bookmarklet screens ~22, site pages ~13), plus README,
   help notes and the User Guide.
2. **The name defined once, and a commit check** that refuses retired words in anything users see — a general
   "words we don't show users" list (Relay, "Sync now", and CLAUDE.md's jargon list), word boundaries, an exclusion
   list by path. Old CHANGELOG entries, post-mortems and design records keep "Relay".
3. **One Cloud Sync Key:** `RW1-` + 13 groups of 5, Crockford's alphabet (no I, L, O, U; O read as 0, I/L as 1), the
   ID's 32 hex digits + a 31-character secret + 2 check characters (ISO 7064 pure, radix 32, modulus 1021). A 6-character
   support code beside it (the relay's nightly email moving to 6 is done in "Relay worker: one release…").
4. **One tidy step is the only way in** (strip, fold, check, split, rebuild the ID exactly as stored); the key-making
   code refuses anything else; **the relay refuses an untidy ID** (its one check made strict — done earlier, in "Relay
   worker: one release…"); a decrypt failure says
   "this key doesn't match", never "no data".
5. **Make a new key = change the locks:** save the new key and park the old one as "pending revoke" in one write, then
   block and delete the old mailbox (including the full copies and pointer — the relay's wipe is fixed earlier, in
   "Relay worker: one release…"), retry at next launch if that fails;
   backups carry the pending slot; an old backup's replaced key is named as such. The confirmation adds "Your books
   and folders stay as they are."
6. **Honest wording:** fix the "syncs automatically" message; the bar says what is true ("…ready — Import"); the help
   line about the bookmarklet containing the key; the security notes' statements (the record, "What we tell users").
7. **Tests:** the round-trip (ID → key → ID, byte for byte) and the check-character test kept as permanent checks.
8. **The log hides the key by its shape** (Ron, 2026-11-11, building 7.28.0): the logging kit's cleaner finds a secret
   only by its exact value — today the current passphrase — so an OLD key (from before a "Make a new key") or one pasted
   into any text would reach the log and Copy diagnostics. With the key's shape fixed, add "secret patterns" to the kit
   (`logkit/logger.js`: a list of patterns, each match replaced by the secret label), with a test that fails first, and
   give it the `RW1-` pattern in `logkit-settings.js`; its label becomes the key's word ("[passphrase]" today).

**Build together**
- With "Relay Setup: smoother sections and clearer Esc / Help behavior" (below, this section) — the same window,
  touched and re-tested once.
- Reconcile with "Relay Setup: disconnect, or reset credentials" (below, this section): its 6.9.0 "Danger zone → Revoke
  credentials & wipe relay" is what "Make a new key" reuses; its gentle Disconnect stays its own item.
- The User Guide rewrite (below) waits for this, so the new names land once.

**Watch out**
- **Your key:** today's passphrases use another alphabet and there's no legacy path (one user). After the build, make
  a new key once — then re-drag the bookmarklet (LOCAL, and the DEV and PROD ones) and re-pair the phone.
- **The relay changes** (strict ID check, nightly email's 6 characters, the wipe reaching the full copies) **moved
  2026-10-24 to "Relay worker: one release…"** (High priority), which ships first. Anything the key work still needs
  from the relay is a worker change — Ron's yes before every deploy; dev first.
- The bookmarklet's screens change the same way for all three bookmarklets → dev and prod together.
- When this ships, update the CLAUDE.md vocabulary rule to the new names (it describes today's screens until then;
  both trace to the 2026-08-28 decision).
- Sizing: a small feature (the key format and its tidy step, the change-the-locks order) plus a worker change plus an
  80-place rename — not a rename alone.

#### Relay Setup: smoother sections and clearer Esc / Help behavior
<!-- id 20260928-0000a -->

_Why it matters:_ Its sections jump open so abruptly they look like new windows, and Esc behaves differently in a way you can't see.

**What you see** (File → Relay Setup)
1. **Sections jump.** Opening "Credentials" / "Enter Credentials Manually" or "Bookmarklet" / "Pairing" shoves everything up and down so hard it reads as "a new window appeared".
2. **A hidden level.** "Enter Credentials Manually" secretly counts as a level of its own: Esc backs out of it first instead of closing Relay Setup. Nothing shows you that.
3. **Help looks like a replacement.** Help opens exactly on top of Relay Setup, so it doesn't read as stacked on it.

**Decided** (Ron + UX, 2026-10-21)
1. **Animate the sections opening and closing** (~150–200 ms), so the eye can follow what moved; respect the system's
   "reduce motion" setting.
2. **Drop the hidden level: Esc closes Relay Setup**, like a background click — a section folding open isn't a layer
   (the overlay system's Esc closes the innermost *layer*). If the manual-credentials fields hold typed-but-unsaved
   text, closing asks the same *Save / Discard / Keep editing* question as the book details window — ideally the same
   shared piece, so "ask before losing what you typed" works alike in every window with a form.
3. **Open Help slightly offset** (~24 px down and right, like stacked windows) so it reads as on top of Relay Setup,
   not replacing it; "Drag any dialog out of the way" (High priority) adds the full fix later.

**Status:** noted 2026-09-28 during the overlay work; a separate, focused redesign pass. **Build it together with
"Cloud Sync: rename Relay, show one Cloud Sync Key, and 'make a new key' retires the old one"** (Before launch) — that
task changes this window's name, wording and key display; one pass touches and re-tests the window once.

**How (technical)**
- Item 2 is the `onClose` branch that handles `reason === 'esc'` specially in the Relay Setup dialog (readerwrangler.js
  ~11371 on 2026-10-21: `reason === 'esc' && relayManualCreds` closes only the section).

#### Relay Setup's connection test checks the wrong relay on dev
<!-- id 20261012-0000a -->

_Why it matters:_ On your local copy or the dev site it tests production, so its answer can be wrong.

**What you see**
- On your local copy or the dev site: File → Relay Setup → the connection test reports on the **production** relay, not the dev relay your copy actually uses. So "connected" / "revoked" there can be wrong for dev.

**Why it happened** (checked 2026-10-22): relay-client.js already has the wrapper — `relayFetch(path)` builds the
address from the one "which relay" answer — but it doesn't offer it to the app (not in `window.RWRelay`), so the test
called the browser's request function directly with a hard-written production address (readerwrangler.js ~1838). The
relay's addresses are written in **five** places: production in relay-client.js:13 (the default) and the buggy ~1838;
dev in readerwrangler.js:130, mobile.js:31 and bookmarklet-nav-hub.js:52.

**Decided — relay requests go only through relay-client** (Ron + UX, 2026-10-22)
1. **relay-client offers what the app needs** — a named `testConnection(channelId)` (better than exposing raw paths),
   so the app never builds relay addresses; the test uses it. This fixes the dev bug.
2. **Both addresses are written once, in relay-client.js.** The app, phone and bookmarklet hub only answer "am I on
   dev?" (each detects it its own way) — **callers never pass Dev or Prod**: a caller that chooses can choose wrong
   (that's this bug). The relay's own test scripts in `relay/` run outside the app and don't use this.
3. **Make bypassing it impossible** (Ron): the app page is ours, so its `window.fetch` gets a guard that **throws**
   for a request to a relay address not coming from relay-client (*"Relay requests go through RWRelay"*);
   everything else passes untouched. relay-client keeps the real one. An honest error, not a silent substitute.
4. **A commit check refuses a relay address written outside relay-client.js** (app, phone, bookmarklet files).
5. Test step: on localhost, Relay Setup's connection test names the **dev** relay.
6. **Say when the channel is empty** (Ron + Claude, 2026-11-05): today the test reports **connected** for a channel
   with nothing on it — and a mistyped Channel ID IS an empty channel, so a typo shows green at the very moment it
   should be caught. Report *"Connected — nothing sent with these credentials yet"* instead (the same two causes Import's
   "Nothing is on the relay for these credentials yet" names, 7.26.0-alpha.2). A screen test on the local relay
   (`test/ui/rw.py` `App(relay=True)`): an empty channel's test says so. The Cloud Sync Key's check characters later
   catch the typo as it's entered.

#### Relay Setup: disconnect, or reset credentials
<!-- id 20261014-1030am -->

_Why it matters:_ A clean way to stop syncing, or to start over with new credentials.

**Already done**
- 6.9.0: Relay Setup's "Danger zone → Revoke credentials & wipe relay" — clears the keys and reopens the step that makes new ones.

**Left**
- A gentle **Disconnect** that just stops syncing on this device, without revoking or wiping anything on the relay.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review)
1. **The danger is losing the key, not data** — the key IS the access to the cloud copy. The Disconnect window shows
   the key with a **Copy** button before you confirm: *"You'll need this key to reconnect — it's also in any backup
   you've saved (File → Save Backup), locked with your key password if you set one. Your bookmarklet and other devices
   keep syncing."* (Ron: backups carry it — true since 6.0.0; the lock: "Lock the Cloud Sync Key in backups…", Safety.) The one explicit, irreversible verb, with the remedy one click away inside it — not a guessing
   prompt (Law 18).
2. **Say exactly what stays:** this device's library — untouched; the cloud copy — untouched; other devices and the
   bookmarklet — unaffected (the bookmarklet carries its own copy of the key, so the next fetch still reaches the
   cloud; this device just won't import until you reconnect).
3. **In the Cloud Sync words when they ship:** "Disconnect this device from Cloud Sync"; "key", not "credentials".
4. **Build it in one pass through the setup window** with "Cloud Sync: rename Relay, show one Cloud Sync Key…" and
   "Relay Setup: smoother sections and clearer Esc / Help behavior" — touched and tested once.

#### Reset App: one honest message in all four places (what's cleared, what's kept, how to come back)
<!-- id 20261030-1039 -->

_Why it matters:_ Every reset message was written before Cloud Sync, so they talk about "files on disk" a user today
may never have had, point at a button that doesn't exist, and leave out the main way back — the copy in the cloud.
Someone resetting is often already having a bad day (Ron, 2026-10-30, noticed the Tools → Reset App wording).

**The four places** (found 2026-10-30 — a class of sites)
1. **Tools → Reset App** (readerwrangler.js ~11784): "Your library/collections files on disk will NOT be deleted. You
   can reload them anytime." and **"💡 Tip: Use the Export button first"** — there is no Export button, and "Export"
   is retired (Save / Restore).
2. **The reset page's confirmation** (reset.js ~106): "Import backup file → Books + organization; Import
   amazon-library.json → Books only" — that file no longer exists for anyone setting up today.
3. **The emergency reset** (readerwrangler.html ~342 / ~361 — shown when the app can't start): "Your files on disk are
   safe — import your backup file after the reset…".
4. **The reset page's own text** (reset.html ~60): "Good news: … Your files on disk are safe. What you can recover:
   Import backup file → Restore EVERYTHING…".

**Decided** (Ron + UX, 2026-10-30)
1. **One message, defined once, used by all four** — so they can't drift again.
2. It says, in plain words:
   - **what's cleared:** everything ReaderWrangler keeps in **this browser** (books, folders, tags, settings);
   - **what's kept:** files you saved on your computer — backups (File → Save) and spreadsheets (File → Save
     Spreadsheet) — and **your copy in the cloud**;
   - **how to come back:** restore a backup, or reconnect Cloud Sync and import.
   Ron's starting wording: "Your library/collections files on disk (backups, CSV files) will NOT be deleted. You can
   reload backups anytime."
3. **Build with "Cloud Sync: rename Relay…"** (just above) — the recovery words (Cloud Sync Key, Import from Cloud
   Sync) change there, so this is written once, in the new words.
4. **Verify before writing:** does Reset also clear the stored Cloud Sync Key? If it does, "reconnect" needs the key
   from a backup or another device — and the message must say so ("you'll need your Cloud Sync Key").
5. Then the help notes and the User Guide's "Starting over" section (User Guide task) say the same thing.
6. **Updates (2026-11-09):** the reset page's dead "Import amazon-library.json → Books only" bullet was deleted in
   7.26.0 (the library file was replaced by the relay in 6.0), and its other bullet says "Restore backup file"; checked —
   the emergency reset does NOT clear the stored Cloud Sync Key (item 4). Until "Restore from Cloud Sync…" (Before launch
   → Safety and data protection) is built, the one way back offered is the backup file (Ron); once it is, offer that as
   the second.
7. **Update (2026-11-11, Ron found it):** item 6's fix reached only place 2 (reset.js's confirmation box) — place 4,
   the reset page's own panel, still offered "Import amazon-library.json" and "File → Export Backup" (fixed in
   7.27.0's branch: "Restore backup file → Books + organization", "File → Save Backup"). A sweep for
   amazon-library.json found nothing else a person sees in the app. Still open here: place 1 ("files on disk… reload
   them anytime", "Use the Export button") and place 3 ("Your files on disk are safe"), and the one shared message.

### Safety and data protection

_Formerly: Safety / data-integrity guards_

#### All the pre-launch data tests pass
<!-- id 20260904-0000 -->

_Why it matters:_ The core data rules must be proven before strangers rely on them.

**Already done**
- Suite 1 (merging and edit protection) exists: test/bookMerge.test.js ("the pre-launch gate for the import merge") and test/bookFields.test.js.

**Left**
- Suites 2 (Import mapping), 3 (permanent-delete markers) and 4 (load guards) from PRELAUNCH-TEST-GATE.md.
- One command that runs them all.

**What it means**
- The test suites in docs/design/PRELAUNCH-TEST-GATE.md exist and pass: merging and edit protection, Import mapping, permanent-delete markers, load guards, relay behavior.
- Specified 2026-09-04 while those bugs were fresh. About 2–4 sessions when the time comes.
- **Blocks launch; blocks nothing else.**

**Decided** (Ron + Claude, 2026-11-01, in the TODO review)
0. **Part of the regression library** (docs/design/TESTING.md, 2026-11-04): these suites are its pre-launch data gate,
   run by the same runner and tiers.
1. **Outside review 3 (data safety) comes first** — it attacks what we didn't think of; its findings become test cases,
   rather than writing suites 2–4 now and patching them after ("Outside reviews before building", High priority).
2. **The relay suite half-exists:** `relay/test-phase1.mjs` (59 checks: torn saves, fallback, cleanup guards…) and
   `relay/test-signed-writes.mjs` (22: signatures) count toward "relay behavior"; add only what's still uncovered.
3. **One command, in Python** (Ron's scripts rule) — e.g. `tools/run_tests.py`: the unit suites, then a LOCAL relay
   (`npx wrangler dev --env dev --local`) and both relay tests against it, then stop the relay by its exact process
   id (Law 5). Dev only as a final check (it spends the account's shared write limit).
4. **The fast suites become a commit check:** a commit staging `bookMerge.js`, `bookFields.js` or `organizeEngine.js`
   (and so on, module → its test file) runs that module's tests and refuses on a failure — seconds, every time; a
   suite that runs only when remembered is discipline, not a mechanism.
5. Option, not a requirement: once the browser driver exists (High priority), flows like Restore and Import mapping
   can also be tested through the real screens, not only the functions underneath.

#### Outside code libraries: exact versions, integrity checks, and a policy that keeps the page from sending your key anywhere
<!-- id 20261014-1030ai -->

_Why it matters:_ Every outside script runs inside the page that holds your Cloud Sync Key — the key that, since
7.25.0, protects your cloud copy. An unannounced update could break the app overnight; a tampered or malicious copy
could read the key and send it away.

**What's loaded today** (checked 2026-11-01 — six of nine unpinned)
| Library | Where | Pinned? |
|---|---|---|
| React, ReactDOM | the app (readerwrangler.html ~128–129) | `@18` — any 18.x |
| marked | changelog.html | no version at all — always the newest, even a new major |
| img-comparison-slider (script + style) | index.html | `@8` — any 8.x |
| Tailwind | the app, reset.html, security.html | unversioned (Tailwind's docs: this CDN isn't for production) |
| Babel 7.29.7, qrcodejs 1.0.0, html5-qrcode 2.3.8 (phone, on demand — mobile.js ~2415) | the app, the phone | yes |

**Decided** (Ron + Claude, 2026-11-01/02, in the TODO review)
1. **Exact versions** for all six (Tailwind's CDN takes an exact version in its address). Its lasting fix stays the
   "Faster loading: build the app ahead of time" task (Before launch, right below — moved up 2026-11-03).
2. **Integrity checks** (`integrity` + `crossorigin` on every outside script and stylesheet, and on the phone's
   on-demand loader): the browser refuses any copy that differs from the one we checked. What they DON'T do (Ron): they
   can't prove the checked copy is safe — they protect against tampering *after* we pin (e.g. the 2024 polyfill.io
   takeover, which served malicious code to 100,000+ sites that had trusted that CDN for years).
3. **For the first copy** — the practical limit of what can be known: prefer old, widely used versions; check each
   exact version's security advisories; verify the copy matches the release npm recorded.
4. **A content security policy on our pages — the real fix for "a bad copy steals the key"** (a `<meta>` policy tag;
   GitHub Pages can't send headers): the page may contact ONLY the servers we list — our two relays, GoatCounter,
   Amazon's image servers, and the library CDNs — so a malicious library could read the key but couldn't send it
   anywhere (background requests, images, beacons, form posts are all refused). Tested with the browser driver
   (violations show in the console) so nothing legitimate breaks.
   - Its honest limits: while Babel compiles our code in the browser, the policy can't fully restrict which scripts
     run; and no policy stops a script from replacing the whole page with an outside address carrying the key — the
     `navigate-to` rule for that was dropped from the standard in 2022 and no browser supports it (Chrome had it only
     behind an experimental flag, then removed the code — checked 2026-11-02; so it's not included: it would do
     nothing). That attack is visible — the user sees ReaderWrangler vanish — a much worse deal for a thief than
     silent theft.
   - The bookmarklet (on Amazon's pages) can't use our policy — Amazon's page sets its own — but it loads only our own
     three scripts, no outside libraries. The relay uses no libraries (one self-contained file; `wrangler` is a deploy
     tool), serves data not pages, and never receives the passphrase.
5. **A commit check:** refuse an outside script or stylesheet without an exact version and an integrity hash, and a
   page without the policy — so a new page can't quietly regress.
6. **No self-hosting** (considered and dropped, Ron 2026-11-02): it protects against later tampering no better than
   integrity checks; its gains — the app keeps loading if a CDN is down, and a CDN doesn't see visitors — are
   availability and privacy, not security, and don't justify maintaining copies of other people's files.
7. Show all of it to **outside review 2 (security)**.

**How (technical)**
- Old review item 6h. The servers the app talks to: both relay workers (`readerwrangler-relay*.readerwrangler.workers.dev`),
  GoatCounter (its script + endpoint), Amazon's image hosts (covers) — list them from the code when building, not from
  memory.

#### Keep your tabs and browsers in step: catch up quietly, never overwrite newer changes
<!-- id 20260830-0000; merged 20260922-0000d -->

_Why it matters:_ A copy of ReaderWrangler working from an old state overwrites newer work — today, in two ways. Two
**tabs** share one browser's storage, and one innocent edit in an out-of-date tab writes its whole old organization
over everything done since it loaded (a real data-loss risk). Two **browsers or computers** on one Cloud Sync each
keep their own folders, which drift apart while nobody is told — and whichever sends last overwrites the cloud copy
the phone shows. At launch the second case is ordinary, not a clever-user trick: plenty of people have a laptop and
a desktop.

**What you'd get**
- Every tab and every browser stays editable and keeps up with your latest changes on its own. Come back to one that
  is behind and it catches up: *"Caught up with changes from your other tab / browser"*, with **Undo**.
- Nothing ever overwrites a newer change. In the rare case both copies changed since they last matched, a banner (not
  a window — you keep working) offers **Use the other one's** / **Keep this one's**.

**Status**
- **Before launch — the tab half is "Tier 0", the real data-loss risk;** the cross-browser half comes second within
  this task. Its priority is weighed by outside review 3 (data safety) — it may move ahead of other Before-launch work.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review — merged from "Protect against editing in two tabs at once"
and "Warn when another browser has newer changes"; both earlier designs re-read through Law 18)
1. **One problem, one mechanism.** The four states are the same everywhere — in sync, behind, ahead, both changed:
   1. Each saved copy of the organization carries a version stamp (the saved organization already carries
      `savedAt`).
   2. **Compare before you overwrite**, at both places it's written: this browser's storage and the cloud copy. A
      write says "I'm replacing the version I last saw"; if it has changed since, the write is refused.
   3. A refused write, or a newer copy noticed, gets the same responses everywhere: **behind with no changes of its
      own → catch up silently + toast + Undo; ahead or in sync → nothing; both changed → the banner**, and this copy
      sends nothing to the cloud until you choose.
2. **Only two things differ by place:**
   - **Tabs** hear at once, for free — the browser tells every other tab when stored data changes, and the app saves
     the organization on every change — and catch up by reloading from storage.
   - **Browsers** hear when you come back to one (one small read of the cloud copy's version — the phone's freshness
     check already makes it) or when the cloud refuses a send, and catch up by taking the cloud copy, which writes
     their storage — which brings their other tabs along. The layers stack.
3. **This retires both earlier designs' gatekeepers** — the read-only second tab (with "Edit here instead") and the
   cross-browser "soft lease" with its 15–30-second check. Neither blocks you any more, and the lease's record would
   have cost a cloud write every 15–30 seconds per active user (about 120 an hour, against ~1,000 a day on
   Cloudflare's free plan). Compare-before-overwrite costs no extra writes.
4. **Kept from the tab design: ❄ Freeze.** A tab can be frozen as a reference snapshot ("Frozen at 6:04 PM") — it
   stops catching up, and a frozen tab doesn't edit or send. Resume = catch up.
5. **Duplicate sends:** a tab sends to the cloud only when the stored version differs from the last one sent (recorded
   in the shared storage), so two in-step tabs don't both send as you leave them.
6. **Taking the cloud copy is the real work** — the desktop has never applied one; today it reads the cloud
   organization only in the connection test (readerwrangler.js ~1845).
7. **Tested with the browser driver:** two real tabs (edit in A; B catches up with the toast; Undo; nothing lost; one
   send), then two throwaway browsers on one test channel (edit in A, return to B → caught up; edit both → banner,
   and no overwrite either way).
8. **Not a goal: live two-way sync** (two machines editing at once, merged) — rejected 2026-09-22: it needs push
   infrastructure and a merge engine for folders, the case where a merge bug silently corrupts everything. One person
   moves between machines; catching up at the switch is the need.

**Still to decide when building**
1. **Undo after catching up:** the tab's older undo steps refer to the state before the other copy's changes — undoing
   one then must not bring old state back. Lean: catching up starts a fresh undo history in that tab, with the
   catch-up itself as its one step. Check against docs/design/UNDO-MODEL.md first.
2. **Mid-gesture:** a tab in the middle of a drag, or with the book details window open, catches up when that ends.
3. **Books live in a second store** (written whole, apart from the organization): the compare must cover it too, or
   one stamp covers both.
4. **Dragging between tabs** stops being dangerous (both tabs are current) — allow it or not? Decided in "Two-pane split
   view" (2026-11-03): try two windows side by side first, including drag between them; build the in-app split only if
   that falls short.

**How (technical)**
- Tabs: the `storage` event (or BroadcastChannel) for the notice; a compare against the stored `savedAt` before each
  organization write. Cloud: an optional "expect" generation on the device-state pointer flip
  (relay/relay-worker.js `handlePutPointer`, ~812) — the worker refuses with 409 if the pointer has moved; the
  return check reads `getDeviceStatePointerGen`. Cloudflare's storage takes up to about a minute to agree everywhere,
  so this is a guard for one person moving between machines, not a lock. The worker part rides a relay release (Ron's
  yes before each deploy).
- Model the four states as one state machine, not flags.
- Design: docs/design/MULTI-INSTANCE.md §4 (rewritten 2026-11-02; the old §6 folded into it).

#### Lock the Cloud Sync Key in backups with an optional key password
<!-- id 20261104-1024 -->

_Why it matters:_ Every backup carries your Cloud Sync Key, and since 7.25 that key also signs changes — so whoever you
share a backup file with ("send your brother your ReaderWrangler file") can change or delete your cloud copy. A family
member forwarding a file is far likelier than any attacker.

**Decided** (Ron + Claude, 2026-11-04)
1. **An optional "key password" locks only the key inside the backup** — books, folders and notes stay readable, so
   forgetting it costs a re-setup, never data. Not stored only in the browser instead: the backup exists for the day
   the PC dies (Ron). Words: **lock** (not "scramble" — sounds undoable by anyone; not "encrypt" — that's Cloud Sync's
   word) and **key password** (not "backup password", which reads as "protects the backup" or "a spare password").
2. **One optional line in the save step, never a pop-up (Law 18):** *"Lock the Cloud Sync Key in this backup with a
   password (optional) [______]  Why?"* + "Don't ask again". Shown only when Cloud Sync is set up. **Remembered in
   this browser**, so later backups lock automatically; **File → Key Password…** sets, changes or removes it.
3. **Why? / help text:** sharing an unlocked backup shares access to your cloud copy (the recipient could change or
   delete your library and organization; you could recover from your last backup and make a new key); a password,
   even a simple one, makes sharing a backup harmless — *"but feel free to use a strong password and a password
   manager. We highly recommend password managers."* And: *"To look at someone else's backup, use a separate browser
   profile — never swap backups in your own."*
4. **The backup carries a "key locked" flag.** On restore, the wording adapts:
   - this browser already has a key: *"This backup's Cloud Sync Key is locked. Enter your key password to restore it
     too — or skip to keep using this browser's key (the usual case, if you haven't made a new one)."*
   - no key here (e.g. a new PC): *"…Enter your key password to reconnect Cloud Sync — or skip: you can enter your key
     later, or make a new one."*
5. **Restore never blocks:** a skipped or wrong password restores everything else, then says *"Cloud Sync wasn't
   reconnected — enter your Cloud Sync Key, or make a new one if you don't want to keep using your current cloud copy
   (a new key means a new cloud copy)."*
6. **Under the hood:** the same password-to-key method the relay already uses (relay-crypto), on one field of the
   backup. A weak password can be guessed by someone determined with the file — accepted for this threat (Ron).
7. **Ripples:** the Disconnect wording ("Relay Setup: disconnect…", Before launch → Cloud Sync) says the key is in your backups "locked
   with your key password, if you set one"; the private-values commit check still refuses an unlocked key in a
   backup-shaped file (a locked one holds only scrambled text).

#### Remind me when my last backup is getting old
<!-- id 20261104-1024a -->

_Why it matters:_ The one real disaster is a lost or wiped PC with no recent backup — and nothing reminds you today
(checked 2026-11-04). The cloud copy isn't a full backup yet (see "Keep your tabs and browsers in step…").

**Decided** (Ron + Claude, 2026-11-04 — instead of emailing users about idle cloud copies, which would have ended the
"the server holds nothing readable about you" promise)
1. When your last saved backup is more than about a month old, the status area shows a quiet note: *"Last backup: 47
   days ago — Save Backup"* — one click; never a pop-up (Law 18).
2. The app records when you last saved a backup (this browser); a Restore counts too.

#### Restore from Cloud Sync: your books and organization back from the cloud copy, no backup file needed
<!-- id 20261109-1700 -->

_Why it matters:_ The worst case — a lost or wiped computer and no recent backup file — already has its cure sitting in
the cloud. With Cloud Sync on, the computer sends the relay the phone's copy (the code's "device-state") a few seconds
after each change: the whole library AND the organization (folders, Book Lists, Searches, tags), in a backup's shape. But
nothing on the computer reads it back; Import from Relay merges only the books the fetcher sent.

**Decided** (Ron + Claude, 2026-11-09)
1. **One restore, two readers.** A file reader and a relay reader each turn their source into the same backup-shaped
   data; from there ONE path — the backup check (backupCheck.js), the "restore?" box, the restore itself
   (performRestore / loadLibrary) — that can't tell where the data came from.
2. **Credentials:** the relay's copy carries none, and needs none — reaching the relay already took yours. The restore
   keeps the current ones (as a backup file without credentials does).
3. **The new computer:** once built, the app tells the person that any backup FILE made since their current credentials
   were created brings them back — File → Relay Setup → Credentials → "Load credentials from backup file" (the label says
   "backup file" since 7.26.0, so it can't be mistaken for this).
4. **Two computers on one Cloud Sync:** the restore brings back whichever sent last — expected, no special handling
   (Ron).
5. **Until this is built, every recovery message offers only the backup file** (Ron: one option until then). When it's
   built, "Reset App: one honest message in all four places" (Before launch → Cloud Sync) offers it as the second way
   back. The menu: one item, "Restore…", asking "from a backup file / from Cloud Sync" only when Cloud Sync is set up —
   otherwise straight to the file box (Claude's UX verdict; Ron to confirm when it's built).
- How current: as of the last send (seconds); a change made in the moments before a crash may be missing — say so in
  the "restore?" box ("your cloud copy from 2 minutes ago").
6. **After a reset: one choice, and the cloud copy held until it's made** (Ron + Claude, 2026-11-11, building
   7.27.1's reset words). What happens today, checked in the code: the reset itself sends nothing, and nothing is sent
   while the library is empty (the device-state push skips `books.length === 0`) — but as soon as books are back (a
   fetch + Import from Relay, which brings books without folders) any change sends a **full** copy (no deltas: every
   push is a whole new generation) that replaces the cloud's copy with the folders; the relay keeps two, so one more
   push and the old organization is gone from the cloud. Decided:
   - **The first time the app opens after ANY reset** (Tools → Reset App, the emergency screen, the reset page, the
     phone — each sets one "just reset" mark), it asks once: *"You've reset ReaderWrangler. Bring your library back?
     [Restore from Cloud Sync] [Restore backup file…] [Start fresh]"* — the natural moment ("what next?"), part of the
     person's own action; "Start fresh" covers the early-days restart.
   - **Until a choice is made, nothing is sent to the cloud** — so the cloud copy is guaranteed intact when they choose
     to restore from it. Closing the box keeps the hold and asks again next time.
   - **Ships with this task**, not before (Ron): until a restore from the cloud exists, the cloud copy isn't a way back,
     so there's nothing to hold for — and a hold with no cloud restore to offer is a confusing mode. (The
     backup-file-only version of the choice could ship earlier on its own — Ron: wait; logged here.)
   - **Turned down:** a "last chance" prompt at the first push that would overwrite the cloud (it interrupts 60 s after
     an unrelated change or on leaving the tab — "a stopping prompt is still a block", Law 18 — and asks about a reset
     that may be an hour old).

#### Restore checks every book, folder and list inside a backup — skip a bad one and say so
<!-- id 20261108-1800a -->

_Why it matters:_ Since 7.26.0 Restore checks that a backup has every part it needs, each of the right kind — but not
what's inside them. One book with no ID, a folder with no list of books, or a Search with no position can still crash
the restore part-way or leave a broken library.

**Found** (2026-11-08): each book needs an ID (its ASIN — the app's book ID is the ASIN; a book without one, or two
with the same, break the folders that hold them); each folder an ID, a name, a parent and a list of books; each Book
List an ID, a name and a list of books; each Search an ID and a number position (the restore computes
`Math.max` over the positions — a missing one makes it NaN); each tag-list entry a name.

**To decide first:** skip or refuse. Law 18 (don't block the user) says one bad book out of 3,000 shouldn't refuse
the whole backup. Claude's verdict: restore everything else, skip the bad items and say so with their titles —
*"Restored 3,295 books; skipped 1 that had no ID: 'Title'"* — and let the folders' integrity check tidy after it;
refuse only when what's left is unusable (Ron's rule for the parts, 2026-11-08: "if that makes it unusable, we reject
it"). The skipped items go in the log (BACKUP area), so support can see them.

**How:** the same one checking function as the parts check (backupCheck.js, 7.26.0), extended to the items, with its
function tests written first.

#### One backup writer: Save Backup and the copy sent to the relay are built twice and already differ
<!-- id 20261108-1800b -->

_Why it matters:_ The backup file and the copy sent to the relay and the phone hold the same library, but each is put
together by its own code — and they already disagree: the relay copy carries the folder-list order (Manual / Name;
`folderListSort`) and when it was saved; the backup has neither, so a restore onto a new computer can't bring the
folder order back. Every new field has to be remembered twice (Law 4: two answers to one question).

**Found** (2026-11-08): `buildDeviceStatePayload` (readerwrangler.js ~6146, the relay and phone copy) and Save
Backup's own builder (~6271) each write `books`, `organization`, `collections`; a comment says the first is "shared
with exportBackup", but Save Backup builds its own. Differences: the relay copy has `savedAt` and
`explorerSettings.folderListSort`; Save Backup has `exportDate`, `theme`, `appVersion` and the Cloud Sync
credentials.

**How**
1. One builder; Save Backup adds only what a file needs (the credentials, the save date) and the relay copy only what
   it needs (`savedAt`).
2. The folder-list order joins the view settings it belongs to (a restore onto a computer with books keeps the view
   here — Ron, 2026-11-08: "restore changes organization, not views").
3. Then "Remove code left over from older versions…" (Polish) drops the dead parts from the one writer.
4. Test: a Save Backup → Restore round trip and a relay round trip produce the same organization.
5. **Build the backup from storage, not the screen** (medium — Ron, 2026-11-09). Save Backup reads the books from the
   book store but the folders, Book Lists and tags from what's on screen. When the start fails AFTER the books are
   readable (the organization store is never written by a failed start — F1), the screen is empty but storage still
   holds the whole library: a backup built from storage would be complete, one from the screen is missing its folders
   — and since 7.26.0 a restore from it gives exactly that. 7.26.0 refuses Save Backup until the library has loaded
   (the guard); with this, "save a backup now" becomes safe advice even after a failed start, and BOOT-01's critical box
   can say so again. Normally the screen and storage agree (the organization is saved on every change) — check that
   nothing pending is lost (a change still on its way to storage).

### Costs

_Formerly: Launch economics_

#### Move to Cloudflare's $5/month plan around launch
<!-- id 20260828-0000 -->

_Why it matters:_ The free plan supports only a handful of users.

**What we know** (RELAY-ECONOMICS.md, 2026-08-28)
- After 7.5.0's savings, the flat $5 plan covers about 250 users like you; the free plan about 6–10 — and it's shared between production and dev.
- So this is now just the act of upgrading at the right moment, at or shortly before launch.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review — the nightly trend file now gives real numbers)
1. **Upgrade at launch, or earlier when the numbers say so — whichever comes first:** the relay's threshold alerts
   (25/50/75/90%) already email; "the writes alert at 50% fires on two days in a week" is the trigger. Writes, not
   storage, are the binding limit (1,000 a day for the whole account).
2. **Re-check the "≈250 users on $5, 6–10 on free" estimate against the trend file** (`relay-trend.csv`, kept with
   the TODO notes, nightly since 2026-10-20) before upgrading — the August model predates the nightly cleanup's deletes,
   signed writes (one registration write per channel, a few extra reads) and "Refresh all books" (a heavy day).
3. **Dev shares the free limits** — release day 2026-10-31, the tests on dev used 23.6% of the account's daily writes in
   an afternoon; a test day plus a busy user day could hit the cap and stop production syncing for everyone. Until the
   upgrade, "run the relay tests locally by default" ("Relay worker: one release…", item 5) is what protects
   production.
4. **Check Cloudflare's current prices and limits when upgrading** — not the August numbers.

---

## 🗄️ After launch

_Formerly: 🗄️ Backlog (post-launch)_

### Speed

_Formerly: Responsiveness_

#### Clicking between books lags slightly while a filter is on
<!-- id 20261006-0000 -->

_Why it matters:_ A small but noticeable delay on every click while searching or filtering.

**What you see** (Ron, 2026-10-06)
- With any filter or search active — even inside a small folder — click from one book to another. There's a short delay before the old book un-highlights and the new one highlights.
- With no filter, it's instant.
- Chrome's console sometimes shows "[Violation] 'click' handler took ~270ms" (not reproducible on demand after a refresh).
- Mild — "live with it on All Books" is acceptable.

**Likely cause** (a guess, not verified)
- The filtered list itself is already remembered, so it isn't re-filtered on a click.
- The extra cost is probably the **active-filter bar**: it redraws on every click and recounts "💾 N results · Save ▾", the "✓ Search: …" check and the chips.

**To do**
1. Measure one click with Chrome's performance tool, filter on vs. off. **Decided 2026-11-02: Claude does this with
   the browser driver** (High priority) on a throwaway copy of Ron's library (his backup, minus credentials) — a few
   hundred book-to-book clicks with a filter on and off, the browser's own timing for each — so it's numbers, and it
   either reproduces or it doesn't (the utilities project's Law 18: reproduce with real input before explaining). A
   natural second job for the driver, after the Delete key fix; the fix itself stays here (mild).
2. Remember whatever that bar recalculates.

**Note**
- Your first theory — "filter the current folder, not the whole library" — can't explain a lag on **selecting** (filtering doesn't re-run then). Still worth checking for the first filter's cost.

**How (technical)**
- The cached list is `explorerDisplayItems` (a useMemo); profile with DevTools Performance.

### Relay and sync

_Formerly: Relay / data robustness_

#### Edit Kindle collections from ReaderWrangler
<!-- id 20261014-1030r -->

_Why it matters:_ Change your Kindle collections without going to Amazon.

**Status: a big MAYBE** (Ron, 2026-11-02): it would be the first — maybe the only — feature that writes BACK to
Amazon.com. "Just from that perspective, maybe a no. Is it worth that to add 1 feature? TBD." And ReaderWrangler's undo
can't reach Amazon: a bug or an Amazon change could rearrange a user's real Kindle collections, beyond our reach to
put back. Decide only after outside review 1 (launch risks — Amazon's terms) has weighed writing vs. reading, and
only if users ask for it after launch; Tag from Collections already brings collections into RW, one way.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review)
1. **Amazon's side lives in the TODO notes** — the spec's captured API (§4, incl. a real collection id of Ron's) and the
   Amazon names in §5–§9 were moved there 2026-11-02; the public spec keeps the design.
2. **One mechanism for "the app asks the bookmarklet to do something"** — the spec's `collection-pending` queue and
   "Refresh all books from Amazon"'s request note are the same direction and shape: build one small "requests from the
   app to the bookmarklet" channel on the relay; the refresh request is its first user, collection edits a later one
   (signed writes, `amazonFetch`'s pacing and the human-check stop then apply for free).
3. **A "Read next" collection kept from ReaderWrangler is a use case, not a reason** (2026-11-02, from the "Read in
   Kindle" review — it's the one way to put a book a tap away on a Paperwhite). Ron keeps one by hand today;
   automating it saves a few clicks.

**Spec:** docs/design/COLLECTION-EDITING.md (Amazon's side: see TODO notes).

#### Smaller organization syncs (send only what changed in your folders, tags and lists)
<!-- id 20261014-1030k -->

_Why it matters:_ Optional. Every push of your organization (device-state) sends the whole thing — roughly 17 MB per
copy by the 2026-10-15 measurements — when you leave the tab after a change, or after a minute idle; the phone
downloads the whole thing on every refresh.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review)
1. **The library half is already done** — since 7.0 the bookmarklet sends each fetch and each wishlist add as its own
   small upload (a mailbox letter) and the app folds them in at import: the spec's delta model, for library changes.
   What's still sent in full is the organization.
2. **Remeasure first** (Ron: "Remeasure first."): how big a device-state push really is for Ron's library today, how
   often one happens in a normal session, and how long the phone's download takes — from the trend file and a browser
   driver session.
3. **Decide from the numbers:** build it only if pushes or the phone's download are noticeably slow; otherwise close
   it. The cost isn't money (a 17 MB push is one or two writes — writes are the binding free limit, and cheap on the $5
   plan); it's upload time and the phone's download, against real complexity (merge logic in the app AND the phone, plus
   occasional compaction).

**Spec:** docs/design/RELAY-DELTA.md (written before 7.0 — its library half is superseded by the mailbox).

#### Bookmarklet: when your key no longer works, say so plainly — and never show the Channel ID in an error
<!-- id 20261018-1422 -->

_Why it matters:_ When a bookmarklet's key has been replaced or revoked, the fetch stops with a raw technical error that
also prints the full Channel ID on screen — exactly the kind of error people screenshot for support.

**What happens today** (checked 2026-11-02)
- **The timing is already right:** the fetcher's first step ("Checking Library") reads the pending uploads from the
  relay; on a revoked channel that read is refused, so the fetch stops before any Amazon request. (The library read
  before it quietly treats a refusal as "no library yet"; the mailbox read is the one that stops it.)
- **The words aren't:** the user sees e.g. `Relay GET /mail/<the full Channel ID>/list failed: HTTP 403
  {"error":"Channel revoked"}` — every relay error is built in one place (`relayFetch`, relay-client.js), so this
  affects the app too.

**Decided** (Ron + Claude, 2026-11-02, in the TODO review)
1. **A plain message for a revoked channel:** *"This bookmarklet's Cloud Sync Key no longer works — it was replaced or
   revoked. In ReaderWrangler, open Cloud Sync Setup and drag the new bookmarklet."* The same plain path covers 7.25.0's
   "this channel is claimed by a different key" refusal.
2. **No error message ever contains the Channel ID** — removed in the one place every relay error is built, so the app
   and the bookmarklet are fixed at once. The private-values commit check can't see runtime messages, so a test asserts
   it (a refused request's error text must not contain the id).
3. **No extra "ping before fetching"** (the old idea: `/status/{channelId}` first) — the existing first read already is
   the ping. Less code, not more.
4. **(Note added 2026-11-10) One short form for a Channel ID already exists** (7.26.0): logger.js `shortChannelId` — first 8 … last 4, as Relay
   Setup shows it — and the log's cleaner (`scrub`). Use that one function here, not a second copy; the fetchers' own
   logging needs it too ("The fetchers' own logging…", in "Fetcher work").

(Left over from "Ask before restoring when relay credentials don't match", shipped 7.14.3; Ron filed it on its own
2026-10-16. docs/design/RELAY-CRED-MISMATCH.md "Future" — superseded by the above.)

### Features

_Formerly: Features_

#### "Read in Kindle": open a book in the Kindle app or Cloud Reader
<!-- id 20260919-0000 -->

_Why it matters:_ Jump straight from ReaderWrangler to reading the book — for people who read in the Kindle app or Cloud Reader.

**Placed here** (Ron, 2026-10-16): moved from High priority — it does nothing for Paperwhite reading, but it's the natural button for app / Cloud Reader readers.

**What you'd get** (decided Ron + Claude, 2026-11-02, in the TODO review)
1. **A "Read in Kindle" button, chosen by the device you're on** (the browser tells the app which platform it's on):
   - **Android:** opens the book in the Kindle app; with no app installed, the book's Amazon page.
   - **Computers, iPhone and iPad:** opens the book in Kindle Cloud Reader, in the browser (tooltip: "Read in Cloud
     Reader").
   - Not "Read" alone — ReaderWrangler already has a Read / Unread status, and a bare "Read" looks like "mark as read".
2. **Where:** next to **View on Amazon** — in the book details window, the book's right-click menu, and the phone's
   book card.
3. **Greyed out, not hidden** (Law 16), with a tooltip: wishlist books and samples — *"You don't own this book yet"*;
   an owned print-only book — *"No Kindle edition"*. A title Cloud Reader can't show can't be known in advance; it
   opens and Amazon's page says so.
4. **Not** a built-in reader.

**Tested** (Ron, 2026-09-19 and 2026-11-02 — details: see TODO notes)
1. **The Cloud Reader link opens the book** — from a cold start, in a private window (after signing in), and for a book
   never opened anywhere.
2. **The Kindle app on a computer can't be pointed at a book** — its link opens the app's library, not the book. Not
   offered.
3. **A Paperwhite can't be reached.** Nothing — not reading the book in the phone app, nor Amazon's own "Deliver to
   device" — opens a book on it or moves a downloaded book to the top of its list. Paperwhite-only readers gain
   nothing from this task; that's settled, not pending.

**Limits**
- The Android link is unofficial — Amazon could change it; it falls back to the book's Amazon page, and is tested per
  app version.
- Needs the book's Kindle edition. iPhone / iPad use Cloud Reader (no app link there is tested).
- Countries: not this task's problem — ReaderWrangler as a whole is US-store only today (see "Say plainly what ReaderWrangler works with").

**How (technical)**
- One helper picks the link from the platform (`navigator.userAgentData` / user agent) and the book's ownership and
  format; the desktop, the right-click menu and the phone call it. The links and what we learned about them: see TODO
  notes.

#### Amazon's official catalog API: prices, titles and covers without a bookmarklet, once eligible
<!-- id 20261021-1349 -->

_Why it matters:_ An official API can't be broken by a page redesign — a sturdier source for the prices behind price
goals. And it closes, for catalog facts, the gap that "the app can't ask Amazon for anything — only a bookmarklet on
Amazon's page can" keeps opening.

**What it is** (Ron + Claude, 2026-10-21): the **Creators API**, the successor to Amazon's Product Advertising API
(PA-API 5, retired). A **catalog** API — what Amazon sells (titles, prices, images by ASIN), never what *you* own — so
it can never replace the library fetch. RW never used PA-API (checked 2026-10-21), so nothing is broken today.

**What it would take**
1. **Eligibility:** an Amazon Associates account — RW already has one (its "View on Amazon" / Share links carry the
   affiliate tag) — with **10 qualifying sales in the past 30 days** (2026-10-21: 6 ordered, 0 shipped, $0 earned —
   none qualifying yet).
2. **A server for the credentials** — already there: the relay worker can hold them, look prices up 10 per request,
   and keep them only as long as Amazon allows.
3. **Only the generic catalog facts move.** Account-specific signals — "you bought this on ‹date›", Prime / Kindle
   Unlimited status — stay in the signed-in fetch.
4. **Signed lookups, with a daily cap** (2026-11-03): a relay that looks up Amazon prices is a new kind of service —
   unprotected, anyone could use it as a free price lookup and burn our Amazon allowance. Lookups take the same signed
   requests as writes (7.25) — only a real Cloud Sync channel can ask — plus a per-channel daily cap.

**Placed above the tasks that will use it** (Ron, 2026-11-03) — moved here from Prices. Both work without it, and are
better with it (title, price and cover by book number, asked by the relay, no bookmarklet):
- "Book recommendations…" — the book window for books you don't have yet (instead of prefetching their details);
- "Capture book ideas from your phone…" — a shared link becomes a complete wishlist entry on its own.

Details: see TODO notes.

#### Book recommendations: similar books you own, and ones you don't have yet
<!-- id 20261014-1030h -->

_Why it matters:_ "Unbury your next great read" — when you finish a book, see the similar ones already in your library
(unread first), and the ones you don't have yet. Amazon's own page mixes these together and doesn't know your
wishlist; ReaderWrangler can separate them.

**Found 2026-11-03** (Ron + Claude; details and the evidence: see TODO notes)
1. **The library fetch's Amazon-tags request can also return Amazon's "more like this" list** (10 per book, more with
   paging) at no extra request — but **Amazon already leaves out the books you own** (proven: a book shown in Amazon's
   web carousel as one you bought was missing from the list). Pre-orders do come through. Nothing we found brings your own
   books back.
2. **Amazon tags are rich but rare in your library:** each tagged book has ~15–18 (Coraline's run from "Magical
   Realism" to "Spine-Chilling Horror") — but only **27 of Ron's 2,799 books have them** (09-02 backup): the fetch adds
   Amazon tags to just 10 books per run.
3. The old spec's claim that the list was "already fetched, just discarded" was wrong — the request asks for Amazon tags
   only today.

**Decided** (Ron + Claude, 2026-11-03, in the TODO review) — in build order
1. **Amazon-tag coverage first.** Every part below depends on it (and so would anything else built on Amazon tags).
   Decide how coverage catches up: more books per fetch (paced, with the human-check stop), catching up over several
   fetches, or as part of "Refresh all books from Amazon".
2. **"Similar books you own" — worked out in the app, no request to Amazon:** the books in your library sharing the
   most Amazon tags with this one, unread first. "Amazon tags" throughout — never confused with your own ReaderWrangler
   tags.
3. **"Books like this you don't have yet" — Amazon's list,** badged with what ReaderWrangler knows and Amazon's list
   doesn't show: **On your wishlist**, **Pre-ordered** (one shared helper badges any ownership kind, so nothing is
   special-cased).
4. **A click opens the book window either way** (Ron) — one experience regardless of ownership; the title and picture
   go to Amazon as they do today. **To decide in this task: prefetch the details of books you don't have, or not.** The
   app can't ask Amazon for anything itself (only the bookmarklet, on Amazon's site, can), so the window needs stored
   details. If prefetched:
   - the details include the **description** (Ron: the reviews are what make entries big — leave those out);
   - fetched as the fetcher's **last, optional step**, after the upload — like today's removed-books check ("Already
     saved — safe to close this tab"), so closing the tab only skips it;
   - a book recommended for many of yours is stored once;
   - the window then offers **Add to Wishlist** in one click (the price comes with the next wishlist price fetch).
   If not prefetched: books you don't have open their Amazon page instead — or, once eligible, the window is built from
   "Amazon's official catalog API…" (the task above), with no prefetching at all.
5. **Store book numbers for the lists**, not copies of the books.

**Spec:** docs/design/BOOK-RECOMMENDATIONS.md (its UI design predates these findings — revise it in this task; Amazon's
side: see TODO notes).

#### Show who a book is shared with (Family Library)
<!-- id 20261014-1030ar -->

_Why it matters:_ See sharing at a glance in the book window. Ron shares books with two family members through Amazon's
Family Library (2026-11-03), and today nothing in ReaderWrangler says which.

**Decided** (Ron + Claude, 2026-11-03, in the TODO review)
1. **Cheap, and researched** (2026-01-08; Amazon's side: see TODO notes): two requests in the collections fetcher —
   your household, then the sharing of your **whole library** in one. Re-check them before building — the research is
   10 months old and predates Ron's second family member; its test script no longer exists.
2. **Books you shared out:** a **"Shared with: <name>"** line in the book window. No badge on covers (too noisy); a
   "Shared" filter only if asked.
3. **Books shared to you** already arrive with the library fetch, labeled **"Borrowed"** — but a Family Library book
   doesn't expire like a loan. Relabel them, e.g. **"Shared with you (Family Library)"**, in this task.
4. **Privacy — this stores other people's names** (in backups, which are plain files, and Cloud Sync, which is
   encrypted). The names **never go into anything you send out** (Share by Email, the Copy… outputs): the book-field
   table marks the field "never in shared text", so it's enforced in one place, not remembered.
5. **Sharing or unsharing from ReaderWrangler is out** — it would write to your Amazon account (the same big MAYBE as
   "Edit Kindle collections from ReaderWrangler").

#### Two-pane split view
<!-- id 20261014-1030bb -->

_Why it matters:_ Work with two folders side by side — the "10% case": put a book at an exact spot in another folder
without dropping it at the top and moving it again.

**Decided** (Ron + Claude, 2026-11-03, in the TODO review)
1. **Two windows side by side comes first, nearly free:** once "Keep your tabs and browsers in step…" ships, every tab
   stays editable and current — open two windows, one folder each (the spec's option B, as a by-product). Copy and paste
   between them works.
2. **Then check dragging between the two windows.** The spec's "drag-and-drop does NOT work across browser tabs" isn't
   right in general: ReaderWrangler's drags use the browser's own drag-and-drop, which can cross windows. Unknown: whether
   a drop has enough to finish a move that started in another window (the app may hold the dragged books in its own
   memory, not in the drag). This is the tabs task's open question "Dragging between tabs — allow it or not?".
3. **Build the in-app split view (the spec's option A, 8–12 hours) only if that falls short** for the 10% case.

**Spec:** docs/design/archive/DUAL-PANE-SPLIT.md (options A and B; its decision note points here).

#### Library statistics: your unread pile, books per year, top authors and series
<!-- id 20261014-1030aj -->

_Why it matters:_ "Unbury your next great read" in numbers — how big your unread pile is, how old its oldest book is,
which series you started and never finished. (Was "Reading statistics".)

**Decided** (Ron + Claude, 2026-11-03, in the TODO review)
1. **Library statistics, not reading statistics:** there's no reading data beyond Read / Unread (no dates read — see
   "Find out whether reading progress can be fetched from Amazon", Someday). The library data is rich and all local, no
   request to Amazon: when each book was acquired, ownership kind, authors, series and positions, formats, Read /
   Unread, your rating and Amazon's, wishlist prices. (Not the price you paid — ReaderWrangler doesn't have it.)
2. **Candidates:** the unread pile (how many, the oldest still waiting); books acquired per year and how many of each
   year's are still unread; top authors and series, and series started but not finished; the ownership mix.
3. **Every number is clickable** — "412 unread" opens a Search showing those 412. That's what makes it a tool, not
   trivia.
4. **First step: Ron picks the 3–5 numbers he'd actually look at** — not a sprawling dashboard.

#### Import book details from a list or spreadsheet; Goodreads / StoryGraph files in and out
<!-- id 20261014-1030y; merged 20261014-1030n -->

_Why it matters:_ A way to bring in information from outside Amazon — and to share your library with the reading sites
people already use.

**What you'd get**
- Paste a list or load a spreadsheet (CSV); ReaderWrangler matches the rows to your books (by title or ASIN, with a
  review step — never applied blind).
- **Goodreads / StoryGraph exports in:** read status, your ratings, shelves as tags — the same shape as the spec's CSV
  tier.
- **Your library out, in Goodreads' spreadsheet format,** so Goodreads or StoryGraph can import your Kindle library in
  one go — a column layout for the existing Save as Spreadsheet (7.10), not a new feature.

**Decided** (Ron + Claude, 2026-11-03, in the TODO review — merged "Connect with Goodreads / StoryGraph")
- **Files, not a live connection:** Goodreads stopped giving out access to its connection service in December 2020 and
  has none today; StoryGraph has none either — both trade files (StoryGraph reads Goodreads' format).

**Spec:** docs/design/Metadata-Import.md.

#### Capture book ideas from your phone (Share → ReaderWrangler)
<!-- id 20261015-1714 -->

_Why it matters:_ Recommendations you meet on your phone (a Claude.ai answer, a review) can't reach ReaderWrangler until you're back at the desktop — today you email yourself.

**What you see** (Ron, 2026-10-15)
- Reading in bed, Claude.ai suggested books like *Cronus* (P. Djèlí Clark); nothing on the phone could add them to the
  wishlist or a Book List. A bookmarklet on phone Chrome technically works but is far too clumsy for a dozen links.

**What you'd get**
1. **Share → ReaderWrangler** in Android's share sheet (the phone version installed to the home screen registers as a
   share target): one tap from Claude.ai, the Amazon app, an article.
2. What you share — a link, an ASIN, or plain text — travels through the **relay** like a wishlist add, and the desktop
   shows it in a short **"To look up"** list on the next Import. Links and ASINs show with **Open on Amazon**, where the
   Add Book to Wishlist bookmarklet does the full add; plain text you resolve with a click (search Amazon, add, put in a
   Book List). (Corrected 2026-11-03: a link can't become a complete wishlist entry by itself — neither the app nor
   the phone can ask Amazon for a title or price; only a bookmarklet on Amazon's page can. Later, the planned "requests
   from the app to the bookmarklet" channel — the one "Refresh all books from Amazon" uses — could fill them all in on
   the next fetch; or, once eligible, "Amazon's official catalog API…" (Features) completes each one as it arrives.)
3. A whole Claude answer can be shared at once and worked through on the desktop. Picking titles out of free text
   automatically stays human — too unreliable.

**Caveats**
- **The phone would write to the cloud for the first time** (2026-11-03). Today it only reads — "Reads the relay, never
  writes it" is a stated rule (MULTI-INSTANCE.md §1). Since 7.25 every write is signed with the key made from the
  passphrase; the phone already holds it (it decrypts), so it signs with the same signer as the desktop. Update the
  stated rule when this is built. The relay needs nothing new (it already takes single signed letters).
- Android / Chrome only (iPhone doesn't support web-app share targets). Plain-text items carry no book details until
  resolved. Medium-sized: a phone capture screen, a new relay letter kind, a desktop list.

**Status:** after launch (Ron, 2026-10-15: "there comes a time in every project where you have to shoot the engineer
and release it").

**How (technical)**
- Web Share Target (`share_target` in the phone app's manifest); a single-letter mailbox run (as the wishlist fetcher
  sends) carrying `{url|asin|text}`; the desktop's Import routes those letters to the "To look up" list.

#### Notice when a Kindle edition appears for a print-only book
<!-- id 20261014-1030ae -->

_Why it matters:_ So you can switch to the Kindle edition without losing its folders, lists and tags.

**What you'd get**
- A print book you're waiting on can be marked "watch for Kindle".
- An occasional slow check notices when a Kindle edition appears, and **offers** (never forces) to swap to it, carrying over its folders, Book Lists, tags and price goal — a cousin of the wishlist → owned upgrade.

**Low priority, because most cases are already covered**
- Amazon's author-follow emails announce new formats (e.g. Heinlein).
- For Kindle books Amazon withdrew, the price **reappearing** in the normal price check is itself the signal (The Destroyer's 18 withdrawn titles).
- The only uncovered gap: a print placeholder → a new Kindle edition.

**Check first**
- Does the batch lookup report other editions of a print ASIN, or does this need a product-page visit per book?

**How (technical)**
- `formatWatch: 'kindle'` on print placeholders. The "slow refresh" it was to share became "Fetcher: refresh ratings with
  the price check" (Polish, 2026-11-03) — if the batch request reports other editions, this check can ride the price
  check the same way, with no schedule. (Outside review item 6.)

### Technical clean-up

_Formerly: Tech / performance_

#### Split the main code file into modules
<!-- id 20261014-1030at -->

_Why it matters:_ One very large file is harder to work in safely — and the real problem is inside it: one giant
component.

**Re-assessed 2026-11-03** (Ron + Claude, in the TODO review)
- The spec (August) describes a 3,862-line file and a 4–6 hour split. The file is now **20,455 lines** (1.65 MB), ~200
  pieces of state, most of it inside **one component** thousands of lines long. That's where bugs hide: "With a
  filter on, the right pane still shows subfolders…" (Small fixes) is a name used 5,400 lines before it's declared,
  in the same function. Splitting the file without splitting the component would only move the problem.

**Decided**
1. **No big-bang project** (the ground rule: refactor while you work; don't plan refactoring projects). Instead:
   - **A short map of the natural seams** — the left pane, the right pane, each big dialog, the menus — the pieces to
     lift out, each as its own component and file, **whenever work touches them anyway**. Write the map first (in
     the spec, replacing its old table).
2. **After "Faster loading: build the app ahead of time"** — with a build step, files can properly include each other
   instead of sharing global names; splitting is cleaner and safer then.
3. **Optional, decide when building — a ratchet so it can't creep back:** a commit check that refuses a *new* large
   component added to the main file (it goes in its own file). A ratchet, not a project.

**Spec:** docs/design/MODULE-SPLIT.md (superseded by this task until the seam map replaces it).
**Tool survey 2026-11-03** (docs/design/TOOL-SURVEY.md): the official typescript-lsp plugin (go-to-definition and find-references across
the big file) and ast-grep (structural search-and-replace) when lifting pieces out.

#### Test on Safari and iPhone
<!-- id 20261014-1030ax -->

_Why it matters:_ **Every browser on an iPhone is Safari underneath** (Apple requires it — Chrome on iPhone is Safari's
engine), so "works with Chrome" means "not on iPhone", phone view included — and many US Kindle readers carry
iPhones. Some Safari differences could break storage, installing as a phone app, or layout.

**Decided** (Ron + Claude, 2026-11-04, in the TODO review — moved up from Someday)
1. **First pass, cheap: run the browser driver's tests under Safari's engine on Windows** (Playwright's WebKit — not a
   real iPhone, but it catches most engine differences: storage, layout, the phone view). Once the driver exists.
2. **Outside review 1 (launch risks) weighs "iPhone at launch, or not"** — what we promise, and to whom; its answer
   sets the honest line in "Say plainly what ReaderWrangler works with…".
3. **Then a real iPhone check** — Ron has access to one (2026-11-04): the phone view, installing to the home screen,
   storage surviving a few days, Cloud Reader for "Read in Kindle".

**Risks to check**
- The browser's book storage (IndexedDB) — Safari clears a site's stored data after 7 days of Safari use without a
  visit to it, but exempts apps installed to the home screen (to verify when testing; it would make installing the
  phone view the recommended way on iPhone) — installing as a phone app (PWA), and styling.

---

## 👀 Watching

Not work to do — conditions to watch for. Each says what to check if it happens again. (Ron, 2026-10-15)

### Undo history sometimes empties by itself
<!-- id 20260807-0000 -->

_Why it matters:_ Losing undo mid-session is alarming; the cause is still unknown.

**What happened**
- Twice (2026-08-07 and 08), the undo history emptied with no undo or redo by you.

**What we know** (2026-09-01)
- No code path clears it — it lives only in memory and only drops its oldest steps at the limit. So **some invisible page reload** is the only explanation.
- Suspect: the TinySuspender extension discarding and restoring the tab. Your settings argue against it for those two times (60-minute idle timeout; you were actively switching tabs). A forgotten manual reload is the other possibility.

**Next time it happens**
- Check the console history and Data Status's "last checked" — a discarded tab clears both.
- **Read the kept diagnostics log** (since 7.26.0: Help → Diagnostics…, or Copy diagnostics): it records every page load
  with the browser's own answer to "was this tab discarded and reloaded?" (`document.wasDiscarded`) — which settles the
  TinySuspender question without guesswork (added 2026-11-04).

**Done 2026-11-04** (Ron): localhost and readerwrangler.com whitelisted in TinySuspender (a suspended ReaderWrangler
tab can also tear an upload when you leave it).

### Find out why some books end up in no folder
<!-- id 20260903-0000b -->

_Why it matters:_ Rare reports of books in no folder at all; watch whether it still happens.

**What we know**
- One real user event on 6.11.5, and two more on 2026-09-03: books in the browser's book store that no folder refers to.
- 7.7.0 removed the leading suspect: a cold start reading an out-of-date folder list that didn't yet know the newest books.

**Next step**
- **Watch** for the event after releases before spending a session on it.
- **First, the Import-order fix** (2026-11-04, Ron + Claude): "Import files new books once, before the integrity
  check…" (✅ done in 7.26.0, removed from this list at release): an Import now files its new books before the check, so any
  homeless book reported after it is a real one — and the logging module (7.26.0) makes it noticeable (the "auto-fixed
  during restore" message is an error). Watch from 7.26.0 on.

**How (technical)**
- The event is `integrity-homeless`; the suspect was a stale `FOLDERS_KEY`.

### A screen test that failed once: the File menu not found after the start-up test
<!-- id 20261111-1825 -->

_Why it matters:_ A test that fails now and then teaches everyone to ignore failures (TESTING.md §7) — so one that
failed once is watched, not forgotten. (Moved here from "Logging as its own module" at its release, 7.28.0 — Ron.)

**What happened**
- Once (2026-11-09): test_boot.py stopped outside any test — the browser driver couldn't find the File menu button
  (30 s) when restoring the test library right after BOOT-001. Not reproduced in the next 3 runs, nor in the 8 full
  screen-test runs of 2026-11-11.

**Next time it happens**
- **Read it before fixing it** (TESTING.md §7): what was on screen (the failure screenshot) — was the menu bar covered,
  or not yet drawn?
- **Set it aside the same day** (with a TODO) rather than re-run past it.

---

## 🧊 Someday

_Formerly: 🧊 Icebox (no timeline)_

### Formats other than Kindle: undo my Kindle-only preference
<!-- id 20261018-1422a -->

_Why it matters:_ "Kindle only" is Ron's own preference baked into the series and author adds (Ron, 2026-10-16: "We took MY preference and baked it in") — other readers may want paperbacks, hardcovers or audiobooks; and the library fetch has no way to keep out formats you don't track.

**Placed here** (Ron, 2026-11-03): very speculative, low priority — the basic features come first, and for user 1
there's no drive (Kindle books and a handful of PDFs). **What's already in your library** (the ~80 gift items below):
sort All Books by Format and scroll past Kindle; if that proves insufficient, a Format filter in the right pane
(item 3) is the first piece to build, on its own.

**Today**
- The **series** and **author** adds take Kindle editions only; the **one-book Add Book to Wishlist** takes whatever format the page shows — keep that exception either way (Ron adds a paperback as a placeholder when there's no Kindle edition yet).
- **The library fetch already brings in EVERY format** (confirmed 2026-10-16 from Ron's library, Format column): ~80 non-Kindle items — 47 Board Book, ~12 Paperback, ~12 Mass Market Paperback, 4 Map, 2 Audio CD, 1 each CD-ROM, DVD, Product Bundle, Spiral-bound, and one "Shoes" (a board book Amazon mislabels). Mostly gifts Ron's wife bought. _(Corrected twice today: I first claimed Amazon's library was Kindle-only — it isn't; its default filter hides other things, not formats — see "Fetcher: give the library filter one name, in one place" and TODO notes.)_
- So the library has the **opposite** problem: things you don't track (gifts, a DVD) come in with no way to keep them out.

**Shape** (Ron + UX, 2026-10-16) — **someday, only if users ask**
1. **One "Formats I track" setting** — checkboxes (☑ Kindle ☐ Paperback ☐ Hardcover ☐ Audiobook …), saved with your sync settings so every fetcher obeys it. It works **both ways**: series / author adds bring in the formats you track (not just Kindle), and the library fetch leaves out the ones you don't (your gift board books, the DVD).
2. The author and series panels show it pre-checked; you can change it for that one run.
3. **A Format filter in ReaderWrangler's right pane** — books already carry a format (the editable Format field), so it has something to work from. Today the only way to see them is the Format column + sorting.
4. To decide when built: the default for new users, and what happens to already-fetched books in formats you then untick (hide them? leave them?).

**Watch out**
- **Author add — settled 2026-10-16: print works exactly like Kindle**, and "All languages" can be one request (a small
  win for the shipped fetcher). Details: AMAZON-AUTHOR-PAGES.md.
- Format words seen: `kindle`, `paperback` (author filter); Amazon's library filter lists Kindle Edition, Paperback, Hardcover, Board Book, Audible Audiobook.
- The series add asks Amazon for `binding=kindle_edition` (series-page-fetcher.js ~319).

### Find out whether reading progress can be fetched from Amazon
<!-- id 20261014-1030aq -->

_Why it matters:_ "See how far along you are" — in the book window and as a list column — is only possible if Amazon
shows a book's reading position somewhere ReaderWrangler can read it. Today nothing does: the only reading data we get
is Read / Unread, from your Kindle collections (checked 2026-11-03: no reading position in the book fields, the
fetchers or our Amazon notes).

**Decided** (Ron + Claude, 2026-11-03, in the TODO review — was "Show reading progress")
1. **This is research first:** find out whether Amazon shows reading position (the place the Paperwhite, the app and
   Cloud Reader resume from) anywhere the fetcher already reads, or could read with a request like the ones it already
   makes. Findings go in the TODO notes.
2. **Then decide:** a source found → a cheap build (a list column plus a line in the book window; it comes back out of
   Someday as its own task). None → close it.
3. **Off the public "Future Features" list** (README, features page) until a source is found — it promised something we
   don't know we can build.

### Support stores besides Amazon
<!-- id 20261014-1030aw -->

_Why it matters:_ For readers who buy elsewhere too.

**Placed here** (Ron + Claude, 2026-11-03, in the TODO review) — someday, only if users ask:
1. The formats decision again, only bigger: the basics come first, and user 1 has no need. Each store means its own
   fetchers, page changes, human checks and terms question.
2. ReaderWrangler is a Kindle library organizer — the bookmarklets, the Paperwhite workflow, "Read in Kindle", and the
   plain statement of what it works with ("Say plainly what ReaderWrangler works with…").
3. Nothing is lost by waiting: the spec's one structural idea — store-first file names (`amazon-library-fetcher.js`) —
   is already how the fetchers are named. Not on any public list (checked 2026-11-03).

**Spec:** docs/reference/MULTI-STORE-ARCHITECTURE.md.

### Several people on one installation
<!-- id 20261014-1030ao -->

_Why it matters:_ Separate libraries for several people in one copy of the app.

**Placed here** (Ron + Claude, 2026-11-03, in the TODO review): the workaround is better than this feature — **one
browser profile per person** (or another browser). Each profile is its own world: its own library, its own Cloud Sync
key, nothing shared (help notes, "One working tab…"). Swapping libraries with Save / Restore Backup, the old
workaround, is clumsy and easy to get wrong. The real hazard — someone else's Amazon account fetched into your library —
is its own task: "A fetch from someone else's Amazon account stops before mixing two libraries" (Before launch).

**Spec:** docs/design/archive/MULTI-USER-DESIGN.md.

### Animated drag-and-drop
<!-- id 20261014-1030c -->

_Why it matters:_ Books slide aside live to show where a drop will land.

**Placed here** (Ron + Claude, 2026-11-03, in the TODO review) — only if the drop line proves hard to see:
1. Today a **line** marks where a drop lands — the standard, honest signal ("no fake drop signals", Law 18).
2. **The known trap:** books sliding aside move the spot under the pointer, so the target changes and they slide back —
   jitter at the edges between books. Solvable, but real work for polish. (Cost is not the worry: during a drag the
   app already hides rows out of view, so only the visible books would move.)
3. **Try first:** a bolder line or a small gap.

### Share a filtered, read-only copy of your library
<!-- id 20261104-1024b -->

_Why it matters:_ People may want to show someone their books — but a backup is the wrong thing to send: it carries the
whole organization and notes (and, unlocked, the Cloud Sync Key), and **Restore replaces the recipient's own library**.

**Placed here** (Ron + Claude, 2026-11-04) — someday, only if users ask; no real-world case yet (it came from exploring
how a key could leak — "Lock the Cloud Sync Key in backups…").
- **What it would be:** "Share a read-only copy" of the **current view** (e.g. All Books with the "Spicy" or "Political"
  tag filtered out), never with the key; the recipient **opens it as a separate guest view** that leaves their own
  library alone. A spreadsheet is a poor substitute (no covers, lists, tags, reviews — Ron).
- **Until then — profiles, not backup-swapping** (Ron): the brother-in-law who wants to browse your books opens your
  backup in **a separate browser profile** (its own key, its own library), picks the ones to borrow, and emails you —
  never restoring someone else's backup into his own and then restoring his own back. (With the key password, even a
  restore can't take over your cloud copy — he can't unlock your key.)
