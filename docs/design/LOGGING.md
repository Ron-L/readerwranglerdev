# Logging — the module, and the sort of today's console lines

_Design of record for TODO "One logging module: level, area and code for every message…" (Ron + Claude, 2026-11-05 —
Ron's model: a severity code and text per message, a tunable display filter, everything always logged, log readers;
the same model as Linux syslog / printk / journald). Section 3 was the sort, for Ron's red pen before any line was
switched; it stays as the record._

**Status (2026-11-10):** built on `feature/logging` through 7.26.0-alpha.27 — §5 lists each step and what changed
while building. In short: one call (`rwLog.log`), 17 areas, every console line, toast and dialog through it; two
switches (the error banner, extra detail) instead of the first design's ladder of levels; the Diagnostics window
(Help → Diagnostics…, and "Full log…" in the 🕐 history); the screen tests fail on any undeclared error or critical.
Left: the fetchers' own logging and "Send a test message" (§5 step 5.5); the module as its own folder (TODO "Logging as
its own module…").

## 1. Levels

| Level | Means | Shown | Kept | Console |
|---|---|---|---|---|
| **critical** | your data may be at risk (a save failed, a store unreadable) | **to every user**, as a plain box (with its own advice when the usual "save a backup now" would be wrong) | always | `console.error` |
| **error** | "this should never happen" — a bug | the banner, when the **error banner** switch is on | always | `console.error` |
| **warning** | can legitimately happen (offline, a damaged setting, an odd file, a refused gesture) | — | always | `console.warn` |
| **info** | a normal event worth a line — including everything the user is told | — | always | `console.info` |
| **debug** | developer detail | — | only with the **extra detail** switch on | `console.debug` |

**Kept** = the always-on log on the device (the last ~500 entries; repeats counted, not stored again; page loads with
the build and "was this tab discarded?"). **Shown** = the banner (red, stays until clicked, Copy, a "Turn off this
banner" link, a debugger stop when DevTools is open; never a blocking pause). **The console prints exactly what is
kept.** **The two switches** (§5 step 5.1; they replaced the first design's ladder of levels, `?log=`, on 2026-11-09):
"Show a banner when something goes wrong" (`errorBanner`) and "Also record extra detail" (`logDetail`) — independent,
both off for an ordinary user, set in the Diagnostics window, on the address (`?errorBanner=on|off`,
`?logDetail=on|off`) or the console (`rwLog.setSwitch`). The browser driver runs with both on and fails a test on any
error or critical it didn't declare (§5 step 6).

## 2. Areas and IDs

Every message carries a **level** and a **code**: the bare area (`IMPORT` — a general line, info and debug) or the
area plus a number (`IMPORT-12` — one specific message; required for warning and above), never reused or renumbered (support can ask "what codes do you see?"; the help notes can explain each).
**The level is not part of the code** — a message's level can be re-judged later (F5's line became an error) without
its code changing. No product prefix (Ron, 2026-11-07: the log is our own, and our console lines are recognizable by
their shape). Test NAMES keep their own shape, `AREA-NNN` (three digits, e.g. the screen test `IMPORT-004`) — they
live in test files and reports, never in the log.

**Messages a test plants** (Ron + Claude, 2026-11-07). To prove an area or a level is handled right, a test feeds the
logger made-up messages — in the REAL area, with the REAL code it's exercising if it likes (no reserved numbers: a test
may plant `IMPORT-12` to test how `IMPORT-12` is handled). What marks them is explicit, never a naming trick:
1. **A `test: true` field on the entry** — the logger takes it as an argument and keeps it all the way through: the
   kept log stores it; the Diagnostics window shows a TEST badge and its filter can show or hide test entries; Copy
   diagnostics labels them; the driver's "fail on any error or critical" ignores entries a test planted on purpose (and
   still fails on real ones). Programs read the FIELD, never the text.
2. **People see a visible marker**, written into every human-facing form of the entry (the console, the Diagnostics
   window, copied text) by the one function that formats entries: `IMPORT-12-!TEST! · warning · Import skipped…`.
3. **Defined once:** the marker (`-!TEST!`) — and, if anything ever has to recognize it in text, its pattern — are
   constants in the logging module; everything else imports them. The screen tests read the kept log as structured
   entries, so they need no pattern at all.
- Also for later: a "Send a test message" button in Diagnostics (support: "do you see the banner?") plants flagged
  entries on a real device — the flag keeps them from looking like trouble.

| Area | What |
|---|---|
| **BOOT** | starting up: the build, the environment, migrations, loading the library |
| **SYNC** | Cloud Sync: polling, sending, the cloud copy, consolidation |
| **IMPORT** | Import (from Cloud Sync) and merging what arrives |
| **BACKUP** | Save / Restore Backup, Save as Spreadsheet |
| **STORE** | this browser's storage: the book store, the organization, Reset App |
| **INTEG** | the integrity check and its repairs |
| **FIELD** | the book-field table and its self-checks |
| **MOVE** | moving, copying, pasting, dropping books and folders |
| **UNDO** | undo and redo |
| **COVER** | the cover cache |
| **PREF** | saved settings (filters, the Auto-Organize wizard) |
| **PHONE** | the phone app: pairing, loading |
| **UI** | screen-level coding checks |
| **ORG** | folders, Book Lists, Searches and tags as things: create, rename, delete, pin, order (Ron, 2026-11-09 — the toast pass) |
| **EDIT** | a book's details: the book window, Bulk Edit, series numbers, price goals, tags on books, hide, duplicates |
| **AUTO** | Auto-Organize |
| **SHARE** | copying titles, authors, Amazon links, the email text |

## 2b. Where the logs live (Ron + Claude, 2026-11-05)

1. **In the browser, never the relay.** Relay writes are the free plan's tight limit (~1,000 a day for the whole
   account) — a flood would burn them; a log on the server would also be information about the user's activity
   ("the server holds nothing readable about you"); and it's end-to-end encrypted, so nobody could read it there anyway.
2. **So two logs, because a browser keeps storage per site:** the app's (and the phone's, on its own device) on
   readerwrangler.com; the fetchers' on amazon.com — the same split as the two switches (each site remembers its own).
3. **Repeats are counted in memory, not in storage.** The log is written to the browser's storage **in batches** — at
   most every few seconds, and when the tab is left — so a thousand identical messages cost one local write ("×1000")
   and never a relay write.
4. **The last fetch's problems ride in its existing upload.** At the end of a fetch the fetcher already sends one upload
   (its mailbox letter); its **warnings and errors from that run** (capped ~50, IDs removed) go inside it — **zero
   extra relay writes** — and the app's Diagnostics window shows them as their own group, *"From your last fetch
   (date)"* (2026-11-09: not interleaved by time, so two computers' clocks never need to agree), so one **Copy
   diagnostics** gives support both halves. The fetcher's full log (its ~430 progress lines included) stays on amazon.com, with a
   **Copy fetch log** in the bookmarklet menu for when the details are needed.

## 3. The sort — every console line in the app's own code (177, counted 2026-11-05)

_The record of the sort Ron red-penned before any line was switched. All switched in §5 step 4 (alpha.7 … alpha.20);
where the build departed from a row, the row or §5 step 4 says so. Line numbers are as of 2026-11-05._

Files: readerwrangler.js (123), mobile.js (16), storage.js (18), relay-client.js (19), integrity.js (1); none in
the other modules or the page's inline scripts. Totals: **critical** 6, **error** 28, **warning** 37, **info** 35, **debug** 44, **remove** 8, **merge** 19 (merge = folded into the line named, so a multi-line message becomes one entry).

| # | Where | Now | Today's text (start) | Level | Area | ID / action | Note |
|---|---|---|---|---|---|---|---|
| 1 | readerwrangler.js:113 | log | `` `✅ APP_VERSION: ${APP_VERSION} (from readerwrangler.html)`); `` | remove | BOOT |  | the page-load record carries the build — **built (alpha.15) as one line once the code runs**: "Desktop app 7.26.0-alpha.15 running (page 7.25.1)" (the page-load entry is written before the code compiles, and the page's version doesn't move during alphas) |
| 2 | readerwrangler.js:131 | log | `` `🔧 DEV environment: relay → dev worker (${window._RW_RELAY_WORKER_URL})`); `` | info | BOOT |  | which relay this copy talks to |
| 3 | readerwrangler.js:965 | warn | `'[Popover] this popup\'s button is missing {...popupTrigger(isOpen)} — spread it onto the butto…` | **error** | UI | UI-01 | a coding slip (contributors only today) |
| 4 | readerwrangler.js:2769 | error | `'Integrity check failed:', e);` | **error** | INTEG | INTEG-01 | the safety check itself crashed — a bug |
| 5 | readerwrangler.js:3048 | log | `` `🗑️ Tombstone sent for ${deletedAsins.length} book(s) (merges will honor the delete)`); `` | info | SYNC |  |  |
| 6 | readerwrangler.js:3051 | warn | `'⚠️ Permanent delete succeeded locally but relay tombstone failed (will not resurrect while loc…` | warning | SYNC | SYNC-01 | the network can fail |
| 7 | readerwrangler.js:3388 | log | `` `🔄 Reordered ${bookIdsToMove.length} book(s) in folder`); `` | debug | MOVE |  | the user's own action (the toast is logged as info) |
| 8 | readerwrangler.js:3548 | log | `` `🔄 Reordered ${folderIdsToMove.length} folder(s) in parent ${parentId \|\| 'root'}`); `` | debug | MOVE |  | the user's own action |
| 9 | readerwrangler.js:3732 | log | `` `📁 Moved ${folderIds.length} folder(s) into ${newParentId \|\| 'root'}`); `` | debug | MOVE |  | the user's own action |
| 10 | readerwrangler.js:3809 | log | `` `🗑️ Deleted folder "${folder.name}"${subCount > 0 ? ` + ${subCount} subfolder(s)` : ''}${bookCo… `` | debug | MOVE |  | the user's own action |
| 11 | readerwrangler.js:4110 | error | `'Failed to load filters from localStorage:', e);` | warning | PREF | PREF-01 | a damaged saved setting; falls back |
| 12 | readerwrangler.js:4133 | warn | `'Relay status check failed:', err.message);` | warning | SYNC | SYNC-02 | the network can fail |
| 13 | readerwrangler.js:4162 | log | `` `[Relay] Poll result: ${manifest && manifest.timestamp `` | debug | SYNC |  |  |
| 14 | readerwrangler.js:4179 | warn | `'Relay poll failed:', err.message);` | warning | SYNC | SYNC-03 | background poll offline — counted, not repeated (rate limit) |
| 15 | readerwrangler.js:4189 | log | `` `[Relay] Polling for updates (${reason})...`); `` | debug | SYNC |  |  |
| 16 | readerwrangler.js:4236 | error | `'Failed to save filters to localStorage:', e);` | warning | PREF | PREF-02 | storage full? |
| 17 | readerwrangler.js:4303 | error | `'Failed to load wizard settings from localStorage:', e);` | warning | PREF | PREF-03 |  |
| 18 | readerwrangler.js:4327 | error | `'Failed to save wizard settings to localStorage:', e);` | warning | PREF | PREF-04 |  |
| 19 | readerwrangler.js:4392 | log | `'📦 Restored libraryStatus from localStorage:', statusData.libraryStatus.loadStatus);` | debug | BOOT |  |  |
| 20 | readerwrangler.js:4396 | log | `'📦 Restored collectionsStatus from localStorage:', statusData.collectionsStatus.loadStatus);` | debug | BOOT |  |  |
| 21 | readerwrangler.js:4474 | warn | `'⚠️ Organization store unreadable (continuing with fallbacks):', e); }` | **critical** | STORE | STORE-01 | your organization store is unreadable — data at risk |
| 22 | readerwrangler.js:4481 | log | `'📦 Folders migrated from the legacy standalone key (pre-blob install)');` | info | BOOT |  | a one-time migration |
| 23 | readerwrangler.js:4506 | log | `'📥 Created default Inbox folder for fresh install');` | info | BOOT |  | a fresh install |
| 24 | readerwrangler.js:4551 | log | `` `🏷️ Format migration: cleared the invented 'Kindle eBook' default on ${migrated} book(s) — blan… `` | info | BOOT |  | a one-time migration |
| 25 | readerwrangler.js:4563 | log | `` `🔧 Integrity auto-fixed on load:`, integrityResult.autoFixed.map(f => f.description)); `` | **error** | INTEG | INTEG-02 | a repair on load means something wrote bad data — a bug |
| 26 | readerwrangler.js:4567 | warn | `` `⚠️ Integrity issues need review:`, integrityResult.needsReview.map(i => i.description)); `` | **error** | INTEG | INTEG-03 | inconsistent data the check couldn't fix |
| 27 | readerwrangler.js:4587 | error | `'🧪❌ [book-fields self-check] table structure PROBLEM —\n' + _smsg);` | **error** | FIELD | FIELD-01 | contributors' self-check: a field would be dropped on Save |
| 28 | readerwrangler.js:4592 | error | `'🧪❌ [book-fields self-check] round-trip FAILED — ' + _msg);` | **error** | FIELD | FIELD-02 | contributors' self-check: a field doesn't survive a round trip |
| 29 | readerwrangler.js:4596 | log | `` `🧪✅ [book-fields self-check] table sound + ${loadedBooks.length} books round-trip clean (${ORGA… `` | debug | FIELD |  |  |
| 30 | readerwrangler.js:4600 | warn | `'[book-fields self-check] skipped:', _e && _e.message); }` | warning | FIELD | FIELD-03 | the self-check couldn't run |
| 31 | readerwrangler.js:4622 | error | `'Failed to load data:', error);` | **critical** | BOOT | BOOT-01 | the library didn't load — **built (alpha.15) with its own advice** in the critical box ("Don't save a backup now…": a start that failed after the books appeared has no folders on screen); Save Backup refuses until the load finished (BACKUP-08). Found: a damaged status note (row 19) or view settings stopped the whole load — each has its own guard now (BOOT-02/03) |
| 32 | readerwrangler.js:4659 | error | `'❌ Could not save organization:', e);` | **critical** | STORE | STORE-02 | the organization couldn't be saved (the user already gets a toast) |
| 33 | readerwrangler.js:4705 | error | `'❌ Device-state push failed:', err);` | warning | SYNC | SYNC-04 | the network can fail |
| 34 | readerwrangler.js:4744 | log | `` `🔧 Integrity auto-fixed:`, result.autoFixed.map(f => f.description)); `` | **error** | INTEG | INTEG-04 | the post-import check repaired something |
| 35 | readerwrangler.js:4747 | warn | `` `⚠️ Integrity issues need review:`, result.needsReview.map(i => i.description)); `` | **error** | INTEG | INTEG-05 |  |
| 36 | readerwrangler.js:5211 | log | `` `✅ Selected ${allIds.length} item(s) in Explorer`); `` | debug | MOVE |  |  |
| 37 | readerwrangler.js:5234 | log | `` `✂️ Cut ${bookIds.length} book(s) to clipboard (Explorer)`); `` | debug | MOVE |  |  |
| 38 | readerwrangler.js:5248 | log | `` `📋 Copied ${bookIds.length} book(s) to clipboard (Explorer)`); `` | debug | MOVE |  |  |
| 39 | readerwrangler.js:5257 | log | `'⚠️ Cannot paste into virtual folders');` | info | MOVE |  | FINDING F1 — ✅ fixed 7.25.1; this line no longer exists |
| 40 | readerwrangler.js:5305 | log | `` `📥 Pasted ${clipboard.bookIds.length} book(s) (cut) to folder`); `` | debug | MOVE |  |  |
| 41 | readerwrangler.js:5328 | log | `` `📥 Pasted ${clipboard.bookIds.length} book(s) (copy) to folder`); `` | debug | MOVE |  |  |
| 42 | readerwrangler.js:5385 | log | `'📋 Clipboard cleared');` | debug | MOVE |  |  |
| 43 | readerwrangler.js:5410 | log | `` `✂️ Cut folder "${currentFolder.name}"`); `` | debug | MOVE |  |  |
| 44 | readerwrangler.js:5417 | log | `` `📋 Copied folder "${currentFolder.name}"`); `` | debug | MOVE |  |  |
| 45 | readerwrangler.js:5487 | log | `` `📌 Pasted (copied) "${folderToPaste.name}" into "${currentFolder.name}"`); `` | debug | MOVE |  |  |
| 46 | readerwrangler.js:5504 | log | `` `✏️ F2: Renaming "${folder.name}" in right panel`); `` | remove | UI |  | noise |
| 47 | readerwrangler.js:5512 | log | `` `✏️ F2: Renaming "${currentFolder.name}" in left panel`); `` | remove | UI |  | noise |
| 48 | readerwrangler.js:5541 | warn | `'⚠️ Data operation already in progress, skipping import');` | warning | IMPORT | IMPORT-01 | FINDING F2: Import skipped SILENTLY while another operation runs |
| 49 | readerwrangler.js:5566 | log | `` `📬 ${pending.length} pending run(s) in the mailbox`); `` | debug | IMPORT |  |  |
| 50 | readerwrangler.js:5605 | log | `` `📥 Adding ${newBookIds.length} new books to Inbox`); `` | info | IMPORT |  | moved into `fileNewBooksInInbox` (7.26.0-alpha.3), beside a new line: "📥 Inbox backstop: N books … already in folders" — **info**, IMPORT |
| 51 | readerwrangler.js:5618 | log | `'✅ Relay import complete');` | info | IMPORT |  |  |
| 52 | readerwrangler.js:5629 | log | `` `📦 Canonical consolidated: generation ${manifest.gen} (${manifest.bookCount} books, ${c.absorbe… `` | info | SYNC |  |  |
| 53 | readerwrangler.js:5633 | warn | `'⚠️ Consolidation deferred (will retry on next import):', err.message);` | warning | SYNC | SYNC-05 | retried at the next import |
| 54 | readerwrangler.js:5642 | warn | `'⚠️ Absorbed-run reclamation skipped (TTL will handle it):', err.message));` | warning | SYNC | SYNC-06 | harmless — expiry cleans up |
| 55 | readerwrangler.js:5682 | error | `'❌ Relay import failed:', err);` | warning | IMPORT | IMPORT-02 | an Import failed — network or bug; split them when building |
| 56 | readerwrangler.js:5774 | log | `` `📦 Restore pushed to relay: generation ${manifest.gen} (${manifest.bookCount} books, ${absorbed… `` | info | SYNC |  |  |
| 57 | readerwrangler.js:5776 | warn | `'⚠️ Restore succeeded locally but relay push failed (the reset letter/next import will finish i…` | warning | SYNC | SYNC-07 | the network can fail; finished later |
| 58 | readerwrangler.js:5786 | warn | `'⚠️ Data operation already in progress, skipping restore');` | warning | BACKUP | BACKUP-01 | FINDING F2: Restore skipped SILENTLY while another operation runs |
| 59 | readerwrangler.js:5831 | log | `'📋 Restoring organization from backup file (keeping current view settings)');` | info | BACKUP |  |  |
| 60 | readerwrangler.js:5833 | log | `'📋 Restoring organization from backup file (full, incl. view settings)');` | info | BACKUP |  |  |
| 61 | readerwrangler.js:5836 | log | `'⚠️ Backup file has no organization section - will start fresh');` | warning | BACKUP | BACKUP-02 | an odd backup file — **built as a refusal** (alpha.13; alpha.14: every part checked at once by backupCheck.js — Ron, 2026-11-08: a missing part restores as empty, refused only when that leaves the library unusable or a part is the wrong kind; one message names every problem) |
| 62 | readerwrangler.js:5857 | error | `'⚠️ Status check timed out after 60 seconds');` | warning | BACKUP | BACKUP-03 | a restore timed out |
| 63 | readerwrangler.js:5878 | error | `'Failed to sync:', error);` | **error** | BACKUP | BACKUP-04 | Restore failed — one entry with the details (63–65) |
| 64 | readerwrangler.js:5881 | error | `'Error details:', error.message, error.stack);` | merge→63 | BACKUP |  |  |
| 65 | readerwrangler.js:5884 | error | `'Error details: Unknown error (null or no message)');` | merge→63 | BACKUP |  |  |
| 66 | readerwrangler.js:6247 | log | `'✅ Backup exported (v2.0 format with organization)');` | info | BACKUP |  |  |
| 67 | readerwrangler.js:6254 | error | `'Failed to export library:', error);` | **error** | BACKUP | BACKUP-05 | Save Backup failed |
| 68 | readerwrangler.js:6330 | error | `'Failed to save spreadsheet:', error);` | **error** | BACKUP | BACKUP-06 | Save as Spreadsheet failed |
| 69 | readerwrangler.js:6386 | log | `'✅ Cleared library - app reset to initial state');` | info | STORE |  | Reset App |
| 70 | readerwrangler.js:6389 | error | `'Failed to clear library:', error);` | **error** | STORE | STORE-03 | Reset App failed |
| 71 | readerwrangler.js:6447 | log | `'No collections data available to merge');` | debug | IMPORT |  |  |
| 72 | readerwrangler.js:6465 | log | `` `📚 Collections data merged:`); `` | info | IMPORT |  | one line instead of three (72–74) |
| 73 | readerwrangler.js:6466 | log | `` `   - ${booksWithCollections} books have collections`); `` | merge→72 | IMPORT |  |  |
| 74 | readerwrangler.js:6467 | log | `` `   - ${readBooks} READ, ${unreadBooks} UNREAD, ${mergedBooks.length - readBooks - unreadBooks}… `` | merge→72 | IMPORT |  |  |
| 75 | readerwrangler.js:6478 | error | `'❌ Wrong file type selected');` | warning | BACKUP | BACKUP-07 | the wrong kind of file — one entry (75–77). **Built (alpha.12):** the load throws a marked error and the CALLER logs it once — Restore as BACKUP-07, "That file can't be restored: …" (the load is shared with Import, which logs it as IMPORT-04) |
| 76 | readerwrangler.js:6479 | error | `'   You selected an old Collections file');` | merge→75 | BACKUP |  |  |
| 77 | readerwrangler.js:6480 | error | `'   Please select amazon-library.json instead');` | merge→75 | BACKUP |  |  |
| 78 | readerwrangler.js:6491 | error | `'❌ Invalid v2.x library format');` | warning | BACKUP | (BACKUP-07) | a damaged file — one entry (78–80); built as BACKUP-07, like 75 |
| 79 | readerwrangler.js:6492 | error | `'   Expected: {schemaVersion: "2.x", books: {items: [...]}}');` | merge→78 | BACKUP |  |  |
| 80 | readerwrangler.js:6493 | error | `'   Received:', Object.keys(parsedData));` | merge→78 | BACKUP |  |  |
| 81 | readerwrangler.js:6510 | log | `` `📋 Loaded schema ${parsedData.schemaVersion} unified file`); `` | debug | BACKUP |  | one line instead of four (81–84) |
| 82 | readerwrangler.js:6511 | log | `` `   Total books: ${metadata.totalBooks}`); `` | merge→81 | BACKUP |  |  |
| 83 | readerwrangler.js:6512 | log | `` `   Fetched: ${new Date(metadata.fetchDate).toLocaleString()}`); `` | merge→81 | BACKUP |  |  |
| 84 | readerwrangler.js:6513 | log | `` `   Fetcher version: ${metadata.fetcherVersion}`); `` | merge→81 | BACKUP |  |  |
| 85 | readerwrangler.js:6524 | log | `` `📚 Loaded embedded collections for ${collections.size} books`); `` | debug | BACKUP |  | one line (85–86) |
| 86 | readerwrangler.js:6525 | log | `` `   Collections fetched: ${new Date(parsedData.collections.fetchDate).toLocaleString()}`); `` | merge→85 | BACKUP |  |  |
| 87 | readerwrangler.js:6535 | log | `'📚 No collections data in file (run Collections Fetcher to add)');` | debug | BACKUP |  |  |
| 88 | readerwrangler.js:6549 | error | `'❌ Unsupported library file (pre-2.0 format):', Object.keys(parsedData));` | warning | BACKUP | (BACKUP-07) | a pre-2.0 file — no longer supported; built as BACKUP-07, like 75 |
| 89 | readerwrangler.js:6596 | log | `'✅ Books sorted by acquisition date (newest first)');` | remove | IMPORT |  | noise |
| 90 | readerwrangler.js:6598 | error | `'❌ Sort failed:', error);` | **error** | IMPORT | IMPORT-03 | sorting crashed — a bug; one entry (90–91) |
| 91 | readerwrangler.js:6599 | error | `'Error details:', error.message, error.stack);` | merge→90 | IMPORT |  |  |
| 92 | readerwrangler.js:6608 | log | `` `📚 Collections data merged:`); `` | info | IMPORT |  | one line (92–94) |
| 93 | readerwrangler.js:6609 | log | `` `   - ${booksWithCollections} books have collections`); `` | merge→92 | IMPORT |  |  |
| 94 | readerwrangler.js:6610 | log | `` `   - ${readBooks} READ, ${unreadBooks} UNREAD, ${processedBooks.length - readBooks - unreadBoo… `` | merge→92 | IMPORT |  |  |
| 95 | readerwrangler.js:6617 | log | `` `🏷️ User metadata imported:`); `` | debug | IMPORT |  | one line: counts only (95–97) |
| 96 | readerwrangler.js:6618 | log | `` `   - ${booksWithTags} books have tags`); `` | merge→95 | IMPORT |  |  |
| 97 | readerwrangler.js:6619 | log | `` `   - ${booksWithNotes} books have notes`); `` | merge→95 | IMPORT |  |  |
| 98 | readerwrangler.js:6622 | log | `` `   - Sample tagged: "${sampleTagged.title}" has tags:`, sampleTagged.tags); `` | remove | IMPORT |  | FINDING F4: prints a book's tags — personal; never in a copied log |
| 99 | readerwrangler.js:6626 | log | `` `   - Sample noted: "${sampleNoted.title}" has note:`, sampleNoted.userNote); `` | remove | IMPORT |  | FINDING F4: prints the text of a user's NOTE — personal; never in a copied log |
| 100 | readerwrangler.js:6653 | log | `` `🧹 Purged undo history referencing ${removedIds.length} import-removed book(s)`); `` | info | UNDO |  |  |
| 101 | readerwrangler.js:6716 | log | `'Note: Could not read localStorage organization');` | warning | STORE | STORE-04 |  |
| 102 | readerwrangler.js:6778 | log | `` `🔧 Integrity auto-fixed during restore:`, integrityResult.autoFixed.map(f => f.description)); `` | **error** | INTEG | INTEG-06 | FINDING F5: fired on EVERY Import with new books — ✅ fixed 7.26.0-alpha.3 (test IMPORT-004); now fires only for a real repair |
| 103 | readerwrangler.js:6783 | log | `` `✅ Restored ${restoredFolders.length} folders from ${orgSource}`); `` | info | BACKUP |  | built (alpha.12) as one line at the end of a restore: "Backup restored: N books, M folders" (on an Import it named this browser's saved copy — noise) |
| 104 | readerwrangler.js:6786 | log | `'📁 No folders in backup - keeping existing folder structure');` | info | BACKUP |  | an old backup |
| 105 | readerwrangler.js:6817 | log | `'📁 No explorer settings in backup - keeping existing preferences');` | debug | BACKUP |  |  |
| 106 | readerwrangler.js:6824 | log | `` `🎨 Restored theme preference: ${orgToRestore.theme}`); `` | debug | BACKUP |  |  |
| 107 | readerwrangler.js:6845 | log | `` `✅ Backup restored and synced to relay (${mergedBooks.length} books)`); `` | info | SYNC |  | built as SYNC (it reports the relay push; the restore itself is 103) |
| 108 | readerwrangler.js:6859 | warn | `'⚠️ Backup restored locally but relay sync failed:', err.message);` | warning | SYNC | SYNC-08 | the network can fail |
| 109 | readerwrangler.js:6866 | log | `` `✅ Restored organization from ${orgSource}`); `` | remove | BACKUP |  | repeats 103 |
| 110 | readerwrangler.js:6908 | error | `'Cache read error:', e);` | warning | COVER | COVER-01 |  |
| 111 | readerwrangler.js:7496 | warn | `'recordAction: no undo/redo label for action type', action.type);` | **error** | UNDO | UNDO-01 | an action with no undo label — a coding slip |
| 112 | readerwrangler.js:8084 | warn | `'Unknown action type for undo:', action.type);` | **error** | UNDO | UNDO-02 | Undo of an unknown action does NOTHING — a bug |
| 113 | readerwrangler.js:8628 | warn | `'Unknown action type for redo:', action.type);` | **error** | UNDO | UNDO-03 | Redo of an unknown action does NOTHING — a bug |
| 114 | readerwrangler.js:12237 | log | `'📋 Backup restore cancelled by user'); setRestoreConfirm(null); }}` | debug | BACKUP |  |  |
| 115 | readerwrangler.js:12270 | log | `'📋 Backup restore cancelled by user'); setRestoreConfirm(null); }}` | debug | BACKUP |  |  |
| 116 | readerwrangler.js:15023 | warn | `'Folder reparent failed:', err); }` | **error** | MOVE | MOVE-01 | a drop crashed |
| 117 | readerwrangler.js:15271 | error | `'Tag view on folder drop error:', err);` | **error** | MOVE | MOVE-02 | a drop crashed |
| 118 | readerwrangler.js:15324 | error | `'Sidebar folder drop error:', err);` | **error** | MOVE | MOVE-03 | a drop crashed |
| 119 | readerwrangler.js:15729 | error | `'Breadcrumb folder drop error:', err);` | **error** | MOVE | MOVE-04 | a drop crashed |
| 120 | readerwrangler.js:15749 | error | `'Breadcrumb book drop error:', err);` | **error** | MOVE | MOVE-05 | a drop crashed |
| 121 | readerwrangler.js:18692 | log | `` `✂️ Cut folder "${folder.name}"`); `` | debug | MOVE |  |  |
| 122 | readerwrangler.js:18708 | log | `` `📋 Copied folder "${folder.name}"`); `` | debug | MOVE |  |  |
| 123 | readerwrangler.js:18800 | log | `` `📋 Pasted (copied) "${folderToPaste.name}" into "${folder.name}"`); `` | debug | MOVE |  |  |
| 124 | mobile.js:4 | log | `` `✅ Mobile viewer ${MOBILE_VERSION} \| APP_VERSION: ${APP_VERSION}`); `` | remove | BOOT |  | built like row 1: "Phone app … running (page …)" |
| 125 | mobile.js:32 | log | `` `🔧 DEV environment: relay → dev worker (${window._RW_RELAY_WORKER_URL})`); `` | info | BOOT |  | which relay |
| 126 | mobile.js:2401 | log | `'✅ Paired via QR: channel ' + creds.channelId.slice(0, 8) + '...');` | info | PHONE |  | keeps a short channel prefix (allowed); the log's scrubber removes it on Copy |
| 127 | mobile.js:2404 | error | `'❌ Failed to parse pairing data from URL:', e);` | warning | PHONE | PHONE-01 | a bad pairing link |
| 128 | mobile.js:2539 | log | `` `[Freshness] cached gen ${blob.deviceStateGen \|\| '(none)'} vs pointed ${gen} → ${newer ? 'NEW… `` | debug | PHONE |  |  |
| 129 | mobile.js:2583 | log | `` `📡 Device-state received: ${data.books.items.length} books`); `` | info | PHONE |  |  |
| 130 | mobile.js:2613 | log | `'✅ Device-state applied to local storage');` | info | PHONE |  |  |
| 131 | mobile.js:2615 | log | `` `🛡️ Cache write skipped — local data is newer (guest guard; payload ${payloadSavedAt ? new Date… `` | info | PHONE |  | the guest guard working as designed |
| 132 | mobile.js:2619 | log | `'📡 No device-state on relay (404) — using local data');` | info | PHONE |  |  |
| 133 | mobile.js:2622 | warn | `'⚠️ Device-state pull failed, using cached data:', err.message);` | warning | PHONE | PHONE-02 | offline — uses its cache |
| 134 | mobile.js:2655 | log | `` `✅ Mobile loaded: ${loadedBooks.length} books, ${savedFolders.length} folders`); `` | info | PHONE |  |  |
| 135 | mobile.js:2692 | error | `'❌ Mobile data load failed:', err))` | **error** | PHONE | PHONE-03 | the phone couldn't load (its data isn't at risk — read-only) |
| 136 | mobile.js:2860 | error | `'❌ QR decode error:', e);` | warning | PHONE | PHONE-04 |  |
| 137 | mobile.js:2866 | error | `'❌ QR scanner failed:', e);` | warning | PHONE | PHONE-05 | camera refused? |
| 138 | mobile.js:2914 | log | `` `✅ Paired ${method}: channel ${creds.channelId.slice(0, 8)}...`); `` | info | PHONE |  |  |
| 139 | mobile.js:2922 | error | `'❌ Post-pair load failed:', err); setLoading(false); });` | **error** | PHONE | PHONE-06 |  |
| 140 | storage.js:48 | log | `` `🔄 Saving ${books.length} books to IndexedDB... (preserveUserData: ${preserveUserData})`); `` | debug | STORE |  |  |
| 141 | storage.js:83 | log | `` `📋 Preserving ${orphanWishlists.length} orphan wishlist items`); `` | debug | STORE |  |  |
| 142 | storage.js:152 | log | `` `🛡️ Preserving user-edited fields for "${previousBook.title}":`, Object.keys(ue).join(', ')); `` | debug | STORE |  | one line PER BOOK — rate limiting matters here |
| 143 | storage.js:184 | warn | `` `⚠️  Found ${duplicates.length} duplicate ASINs, owned books take priority`); `` | warning | STORE | STORE-05 | duplicate ASINs — one entry (143–144) |
| 144 | storage.js:185 | warn | `` `   Sample duplicates:`, duplicates.slice(0, 5)); `` | merge→143 | STORE |  |  |
| 145 | storage.js:189 | log | `` `🎉 ${wishlistToOwned.length} wishlist items now owned (price goals preserved)`); `` | info | STORE |  |  |
| 146 | storage.js:202 | log | `'✅ Saved', uniqueBooks.length, 'unique books to IndexedDB');` | debug | STORE |  |  |
| 147 | storage.js:207 | error | `'❌ IndexedDB save failed:', error);` | **critical** | STORE | STORE-06 | the books couldn't be saved |
| 148 | storage.js:212 | error | `'❌ IndexedDB save exception:', error);` | **critical** | STORE | STORE-07 | the books couldn't be saved |
| 149 | storage.js:230 | log | `'✅ Loaded', books.length, 'books from IndexedDB');` | debug | STORE |  |  |
| 150 | storage.js:246 | warn | `'🔎[schema] Unknown book field(s) on loaded books:', list,` | **error** | FIELD | FIELD-04 | a field nothing knows — schema drift |
| 151 | storage.js:269 | log | `'✅ Deleted IndexedDB:', DB_NAME); resolve(); };` | info | STORE |  | Reset App |
| 152 | storage.js:270 | error | `'❌ Failed to delete IndexedDB:', DB_NAME, request.error); reject(request.error); };` | **error** | STORE | STORE-08 | Reset App couldn't delete the book store |
| 153 | storage.js:271 | warn | `'⚠️ IndexedDB delete blocked — close other tabs'); resolve(); };` | warning | STORE | STORE-09 | FINDING F3 — ✅ fixed 7.25.1 (now `deleteBookStore`'s info line): blocked by another tab — the reset carried on as if done |
| 154 | storage.js:293 | log | `` `📷 Cover cache: ${Object.keys(urlMap).length}/${books.length} covers loaded from cache in ${ela… `` | debug | COVER |  |  |
| 155 | storage.js:295 | error | `'Cover cache read failed:', e);` | warning | COVER | COVER-02 |  |
| 156 | storage.js:340 | log | `` `📷 Cover cache populated: ${cached} already cached, ${fetched} newly fetched, ${failed} failed … `` | debug | COVER |  |  |
| 157 | storage.js:342 | error | `'Cover cache population failed:', e);` | warning | COVER | COVER-03 |  |
| 158 | relay-client.js:400 | warn | `'Relay cleanup failed:', await response.text());` | warning | SYNC | SYNC-09 |  |
| 159 | relay-client.js:997 | warn | `` `Bulk-run GC skipped for ${r.runId} (TTL will handle it):`, e.message); } `` | warning | SYNC | SYNC-10 | harmless — expiry cleans up |
| 160 | relay-client.js:999 | log | `` `🧹 Reclaimed ${deleted} absorbed bulk run(s)`); `` | info | SYNC |  |  |
| 161 | relay-client.js:1068 | warn | `'composeCanonical: unparseable canonical ignored:', e.message); }` | **critical** | SYNC | SYNC-11 | the cloud copy itself is unreadable — data at risk |
| 162 | relay-client.js:1074 | warn | `` `composeCanonical: unparseable run ${run.runId} ignored:`, e.message); continue; } `` | **error** | SYNC | SYNC-12 | a sent batch of books is unreadable — those books are missing |
| 163 | relay-client.js:1150 | log | `` `⏰ Age cap: oldest pending run is ${((Date.now() - oldest) / 86400000).toFixed(1)}d old — conso… `` | info | SYNC |  |  |
| 164 | relay-client.js:1159 | warn | `'Age-cap merge skipped:', e.message);` | warning | SYNC | SYNC-13 |  |
| 165 | relay-client.js:1233 | log | `'[Relay] Reading library + pending additions (read-only)...');` | debug | SYNC |  | runs in the fetchers too (see note) |
| 166 | relay-client.js:1242 | log | `` `   ✅ Library: ${data.books.items.length} books (via ${canonical.source})`); `` | debug | SYNC |  |  |
| 167 | relay-client.js:1245 | warn | `'   ⚠️ Could not parse library data:', e.message);` | **error** | SYNC | SYNC-14 | the cloud library is unreadable to the fetcher |
| 168 | relay-client.js:1248 | log | `'   ℹ️ No library on relay yet — checking pending additions only');` | info | SYNC |  |  |
| 169 | relay-client.js:1273 | log | `` `   ✅ Plus ${pendingBooks} pending book(s) not yet merged`); `` | debug | SYNC |  | one line (169–171) |
| 170 | relay-client.js:1274 | log | `` `   🗑️ Minus ${pendingDeletes} pending deletion(s)`); `` | merge→169 | SYNC |  |  |
| 171 | relay-client.js:1275 | log | `'');` | remove | SYNC |  | a blank line |
| 172 | relay-client.js:1291 | log | `'[Relay] Sending wishlist addition (atomic run)...');` | debug | SYNC |  |  |
| 173 | relay-client.js:1307 | log | `` `   ✅ Sent ${newBooks.length} book(s)${res.inline ? ' in a single write' : ` (${res.seqCount} p… `` | info | SYNC |  |  |
| 174 | relay-client.js:1310 | error | `'❌ Send failed:', relayError.message);` | warning | SYNC | SYNC-15 | the network can fail; it retries |
| 175 | relay-client.js:1327 | log | `` `📦 Age-cap consolidation done (${acm.bookCount} books)`); }) `` | info | SYNC |  |  |
| 176 | relay-client.js:1328 | warn | `'Age-cap check skipped:', e.message));` | warning | SYNC | SYNC-16 |  |
| 177 | integrity.js:107 | error | `'Failed to save integrity results:', e);` | warning | INTEG | INTEG-07 | storage full? |

## 4. Findings from the sort (not logging — things the lines revealed)

1. **F1 — a refused paste says nothing** (#39): Ctrl+V into All Books, the Inbox or another virtual folder is refused
   with only a console line; the user isn't told (Law 16). Fix: a toast saying why. ✅ **Fixed in 7.25.1** — and it
   was bigger: a cut pasted into a Book List or the Trash took the book out of its folder and put it nowhere. One paste
   (`pasteClipboard`) and one "can books be pasted here?" (`pasteRefusal`) now; the console line (#39) is gone. The
   whole class becomes TODO "One table for every move, copy, paste and delete".
2. **F2 — Import and Restore skip silently** (#48, #58) when another data operation is already running — the click
   just does nothing. Fix: say so ("Another operation is still running — try again in a moment"), or queue it.
   **Decided** (Ron + Claude, 2026-11-07): checked — no person can reach it today (every way to start Import or Restore
   is covered by the running one's progress box; the menu item is disabled during an Import), so it's a guard against a
   double start. Keep the guard; if it's ever reached, a toast names what's running (*"An Import is already running —
   it will finish in a moment."* / *"A restore is already running…"*) and it logs a **warning** (`IMPORT-01` /
   `BACKUP-01`) so we learn where from. No queueing (an Import piled after a Restore isn't what anyone clicked for).
   Built with step 4 (the IMPORT and BACKUP lines), not its own alpha; a function test of the message if cheap.
3. **F3 — Reset App can report success without deleting the book store** (#153): when another tab holds the
   store open, the delete is "blocked" and the code carries on as if done (`resolve()`). Check what the user sees; fix
   with "close your other ReaderWrangler tabs" and a real retry. ✅ **Fixed in 7.25.1** — measured worse: the reload
   could hang and the other tab wrote the old folders back. Each tab keeps one connection and lets go on request; one
   delete (`deleteBookStore`) for all four resets waits, saying why; line #153 is now an info line in that function.
4. **F4 — personal text in the console** (#98, #99): an import prints a book's tags and the full text of a user's
   NOTE. Remove them — a copied diagnostics log must never carry a note.
5. **F5 — the integrity alarm fires on every normal Import** (#102): the known false alarm (Small fixes: "Import files
   new books once, before the integrity check…"). Making it an **error** before that fix lands would raise the banner on
   every Import in diagnostics mode — so **that fix comes first, in this branch** (it's small and in the same code).
   ✅ **Fixed in 7.26.0-alpha.3** (2026-11-05), with the task's part 2 (only books in no folder go to the Inbox): one
   placement path before the integrity check; tests `IMPORT-001`–`010` on a local relay.
6. **relay-client.js also runs inside the fetchers** on Amazon's pages (#158–176): the logging module must load there
   too, or relay-client falls back to the plain console — decide when building (TODO task, item 10).

## 5. Build order (this branch, `feature/logging`)

1. ✅ The Import-order fix (F5) — first, so the integrity alarm is real before it becomes an error (7.26.0-alpha.3).
2. ✅ The module: levels, areas, codes, the kept log (repeats counted, page loads), the scrubber — function tests first
   (7.26.0-alpha.5: `logger.js` + LOG-001–015; `tools/message_codes.py` + MSG-001–013 + the commit check + the generated
   `docs/design/MESSAGE-CODES.md`).
3. ✅ The gate (`?log=`), the banner, critical shown to users — tests first (7.26.0-alpha.6: LOG-016–022, LOGUI-001–006).
   The `?log=` answer lives in `logger.js`, not beside the environment answers in readerwrangler.html as TODO decision 4
   said: the logger loads first and needs it before that script runs — still ONE place. The banner and the critical box
   are plain page elements drawn by the logger (they must work when the app has crashed); neither blocks (the critical
   box says "save a backup now", so File must stay reachable). Wording: Ron, 2026-11-07. **Later replaced:** the
   `?log=` gate by the two switches (step 5.1); "Turn off diagnostics" by "Turn off this banner".
4. ✅ Switch the 177 lines per section 3 (one commit per area); F1–F4 filed or fixed as Ron decides. Done 2026-11-09
   (7.26.0-alpha.7 … alpha.20: INTEG, STORE, SYNC + IMPORT, BACKUP, BOOT, FIELD, MOVE, UNDO, COVER + PREF + UI, PHONE).
   The app, storage.js, relay-client.js and the phone app have no console lines left; the generated table holds every
   numbered code. Departures from the sort, each recorded in its row or here: the build lines kept (the page-load entry
   can't know the code's build); BOOT-01, PHONE-03 and PHONE-06 critical with their OWN advice (the usual "save a
   backup now" is harmful or meaningless there); the failed-drop errors toast; a refused backup file is one code
   (BACKUP-07). **The sort missed reset.js** (the emergency reset page — 7 lines, now STORE, STORE-12 its failure, test
   RESET-006); the scripts on Amazon's pages (the fetchers, the bookmarklet menu) are their own item (§4 note 6).
   Then, in the same step: the one pass converting `showToast`'s callers (and its commit check), and the dialog
   routines logging what they showed — both below. Found on the way and fixed (Ron's go): the book store's save let go
   of its write lock as soon as a write started, and a failure starting it skipped its own STORE-07 (`return await`,
   alpha.22, tests STORE-001/002 — both made to happen first); a damaged library-status note or view settings stopped
   the whole load (BOOT-02/03, alpha.15); Save Backup refuses while the library hasn't loaded (BACKUP-08).
   - **The toast pass, part 1 ✅ (7.26.0-alpha.21):** the 61 toasts whose subject fits an existing area (MOVE, UNDO,
     BACKUP, SYNC, IMPORT); the red refusals kept their red as numbered errors at first (MOVE-06…09, UNDO-04 — warnings
     since alpha.22, below).
   - **Part 2 ✅ (7.26.0-alpha.23)** — Ron took the four areas (2026-11-09): the last 56 toasts are ORG, EDIT, AUTO,
     SHARE (and three "save results to a Book List" ones MOVE, like the other list adds). The commit check now refuses a
     direct `showToast(` (tools/message_codes.py; MSG-015/016) — the logger's hand-over line excepted. The red refusals
     became warnings (alpha.22, Ron: "None red is fine"). What was proposed:
   - **Part 2 waited for Ron — 56 toasts fit none of the 13 areas.** Claude's proposal (2026-11-09), four new areas:
     **ORG** — folders, Book Lists, Searches and tags as things: create, rename, delete, pin, order (~25: renames,
     creates and deletes of all four, "Saved as a Search", pins, "Manual order now matches…", the folder delete, the tag
     manager); **EDIT** — a book's details: the book window, Bulk Edit, series numbers, price goals, tags added to or
     removed from books, hide / unhide, kept-removed books, duplicates merged (~12); **AUTO** — Auto-Organize (~9);
     **SHARE** — copying titles, authors, Amazon links, the email text (~11). The smaller choice: AUTO folded into ORG
     (Auto-Organize builds folders). Then the commit check refusing a direct `showToast(`.
   - **The dialogs ✅ (7.26.0-alpha.24 — Ron, 2026-11-09, option 1):** every dialog call names its area FIRST
     (`showInfoDialog('BACKUP', title, message)`); the routine logs what it showed, and the answer for those that ask
     ("Box \"Delete Folder\" answered: Cancel"), through `rwLog.dialog(area, text)` — the one logging call whose code isn't
     written literally, so the commit check verifies each dialog call's area instead (MSG-017…019) and `rwLog.dialog`
     checks it again when it runs (UI-05, LOG-029). The boxes themselves are unchanged (thin wrappers around them).
     **Step 4 is complete.**
   - **The red refusals — decided:** "Inbox cannot be moved", "Can't move a folder into itself" are the person's
     gesture refused, not the app going wrong, so they're **warnings** (not red, no banner) — Ron, 2026-11-09: "None red
     is fine" (alpha.22).
5. The Diagnostics window (filter, Copy). **Decided** (Ron + Claude, 2026-11-09 — NOT in Data Status: many messages have
   nothing to do with the data, and the log is "a more formal and complete notification history"). Build list:
   1. **Two switches replace the ladder of levels** (the old `?log=` value did three things at once — the console's
      threshold, whether debug was recorded, whether errors raised the banner; with everything kept and the window
      filtering, only two of those matter): **"Show a banner when something goes wrong"** (`errorBanner`) and **"Also
      record extra detail (fills the log fast — turn on only while chasing a problem)"** (`logDetail`; the cap is ~500
      entries, so detail crowds out older lines). Independent — all four combinations make sense. The console prints
      whatever is recorded (its own level filter does the rest). The address takes **`?errorBanner=on|off`** and
      **`?logDetail=on|off`** (the `?contributor=` pattern: applied, remembered, removed from the address bar); `?log=`
      goes (pre-release — only Ron and the screen tests used it; an old remembered `debug` turns both on once). Tests
      rewritten FIRST: LOG-001/016–022, LOGUI-001–006, the driver ("both on").
   2. **The Channel ID form of Relay Setup** in every logged line: `41e0e16f...726c` (first 8 … last 4) — one shared
      function for the log's cleaner and Relay Setup, so old and new credentials can be told apart (Ron); the
      passphrase stays fully hidden ("[passphrase]").
   3. **The window** — its own, opened from **two doors**: a "Full log…" link at the bottom of the 🕐 history panel and
      **Help → Diagnostics…**. Newest first, one line per entry (time, level, code, text, ×count), ▸ opens the details
      (the error, the stack, the data); error and critical tinted; TEST entries badged. The filter on top: level, area,
      time, test entries. The two switches at the bottom (tooltips explain them), with **Clear** (like DevTools) and
      **Copy diagnostics** (everything kept, always — not just what the filter shows; with a header: the build, the
      browser, the date). Built on the overlay primitive (`<Dialog>`).
   4. **The phone: a Copy diagnostics button** in its menu (⋮), under Help & About — no viewer (Ron).
   - **Built:** 1 ✅ 7.26.0-alpha.25 (LOG-016–022/030, LOGUI-001–006); 2 ✅ alpha.26 (LOG-010/027/031); 3 ✅ and 4 ✅
     alpha.27 (the window: DIAG-001–007; the logger's `subscribe`, `clear`, `diagnosticsText`, `levels`: LOG-032–034;
     the phone: PHONE-003). The window's time filter starts at "Everything kept" (not "since this page loaded" — a
     problem from before a reload is exactly what support asks about).
   5. **Later, not this release:** the fetch's problems as their own group, *"From your last fetch (date)"* — not
      interleaved by time, so two computers' clocks never need to agree (rides on the fetcher's own logging, §4 note 6);
      a "Send a test message" button (plants TEST-marked entries so support can say "do you see the banner?").
6. ✅ The browser driver with both switches on, failing a test on any error or critical (2026-11-09, test/ui/rw.py):
   every session turns both switches on before the page's scripts, once per browser profile (a test that turns one off
   keeps it off; the switches' own tests opt out with `App(log=None)`), and its end fails the file on any `error ·` /
   `critical ·` line the tests didn't declare with `app.expect('CODE')` — planted lines (marked TEST) excepted. The
   first run found exactly the four failures the tests cause on purpose, and nothing hidden.

## 6. The module's shape (Ron + Claude, 2026-11-07)

1. **One call:** `rwLog.log(level, code, text, data, { test, toast, hint })` — `data` and the options are optional.
   **Where a message goes — the whole rule** (Ron + Claude, 2026-11-08; the "handlers" pattern of Python's `logging` /
   log4j's appenders: one call, each destination with its own rule):

   | Destination | Takes |
   |---|---|
   | the kept log | everything info and up (debug too with the extra-detail switch on) |
   | the console | exactly what is kept |
   | **the user (a toast)** | only messages whose call says `toast: true` (or `toast: { x, y }` — near the click); red for error and up; into the 🕐 history unless `hint: true` (a passing hint such as "Nothing to undo") |
   | the banner / the critical box | error and up when the error-banner switch is on / critical for every user (step 3), with the message's own `advice` when it has one |

   One message, one call: a failed restore is `rwLog.log('error', 'BACKUP-04', 'Restore failed: …', data, { toast: true })`
   — the user sees it, support sees its code, the error-banner switch raises the banner. The app hands its toast routine
   to the logger at startup (`rwLog.setToaster(fn)`), so the logger never depends on the app: before the app is up (or
   after it has crashed) a `toast` message still reaches the log and the console, and a critical one still gets the
   logger's own box (a critical message shows that box, not a toast). **(as built)** All of `showToast`'s callers went
   through `rwLog.log(…, { toast })` in one pass (alpha.21/23, each call given its area), and the commit check refuses a
   direct `showToast(`. **Folder names may enter the log** (Ron, 2026-11-09) — the toasts carry them (*"Pasted 3 books
   into 'Sci-Fi'"*) and support can't follow "moved to a folder"; a book's note text and its tags stay out (F4). **A
   crashed drag-and-drop toasts** *"That move didn't work."* (Ron, 2026-11-09; MOVE-01…05 — before, it did nothing,
   silently). **Dialogs are not messages** (Ron: "different animals") — info boxes, confirmations, choices, inputs and
   the progress box keep their own routines; **(as built, Ron's option 1)** each call names its area FIRST
   (`showInfoDialog('BACKUP', title, message)`) and the routine logs what it showed, and the answer, through
   `rwLog.dialog(area, text)` — so everything the user saw is in the log.
   - **level** — `'debug' | 'info' | 'warning' | 'error' | 'critical'`, written at the call site, where the message is
     written (Ron: "it is easier to define the criticality as you type the msg into the code").
   - **code** — `'IMPORT'` (the bare area: a general line) or `'IMPORT-12'` (one specific message). Warning and above
     must use the numbered form — those are what support asks about.
2. **The module is agnostic about the messages:** no table of codes or levels in it. It knows only the five levels and
   the **area names** (13 at first, 17 since the toast pass — §2), as a frozen object (JavaScript has no enums; a frozen object is the standard stand-in) — so a
   typo like `IMPRT` is caught when it happens. A malformed call (an unknown level or area, a badly shaped code, a
   warning without a number) is reported by the module itself as an error, and the message is still logged.
3. **The rules, checked at every commit** by a scan of the source (`tools/message_codes.py`): every code well-formed;
   warning and above numbered; each numbered code used at exactly ONE call (so the level has one home — the call — and
   a code always means one message); every area from the list.
4. **The support table is generated, never kept by hand** (Ron): the same scan writes `docs/design/MESSAGE-CODES.md` —
   code, level, area, the message text, file and line — sorted by area. The commit check refuses a commit whose table
   is stale ("run py tools/message_codes.py"), the TODO table-of-contents pattern. When the precompile build exists,
   the build produces it and the check stays as the safety net.
5. **Messages a test plants:** the `test` option, shown to people as `IMPORT-!TEST!` / `IMPORT-12-!TEST!` (§2); the
   marker a constant in the module.
6. **The rest as decided:** the kept log (§1: the last ~500, repeats counted, batched saves, page loads), the scrubber
   (before anything is stored or copied: Channel IDs become Relay Setup's short form `41e0e16f...726c` — one function,
   `shortChannelId`, shared with Relay Setup; the passphrase becomes "[passphrase]"), and "ours only" (our scripts'
   uncaught errors and failed promises logged as errors; extension messages ignored).
7. **Step 2 built** `logger.js` (loaded first in readerwrangler.html and reset.html), its function tests written first
   (`test/logger.test.js`), and the scan + table + commit check; the later steps are in §5.
8. **(as built) The rest of `rwLog`:** `switches()` / `setSwitch(name, on)` (the two switches); `applyAddress(search)`
   (the address switches); `dialog(area, text)` (the dialogs — its area checked when it runs, UI-05); `subscribe(fn)`,
   `clear()`, `diagnosticsText(headerLines)`, `levels` (the Diagnostics window); `shortChannelId(id)`; `entries()`,
   `flush()`, `format(entry)`, `TEST_MARK`, `setToaster(fn)`, `pageLoad()`, `installGlobalHandlers()`. A message can
   carry its own `advice` for the critical box (`{ advice }`). The commit check also refuses a direct `showToast(` and
   a dialog call without its area first.
