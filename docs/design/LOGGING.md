# Logging — the module, and the sort of today's console lines

_Design of record for TODO "One logging module: severity, area and ID for every message…" (Ron + Claude, 2026-11-05 —
Ron's model: a severity code and text per message, a tunable display filter, everything always logged, log readers;
the same model as Linux syslog / printk / journald). **Section 3 is for Ron's red pen**: change any level, area, ID or
action in its row; nothing in the code changes until it's agreed._

## 1. Levels

| Level | Means | Shown | Kept | Console |
|---|---|---|---|---|
| **critical** | your data may be at risk (a save failed, a store unreadable) | **to every user**, as a plain message; the banner in diagnostics | always | `console.error` |
| **error** | "this should never happen" — a bug | the banner, in diagnostics mode (`?log=` error or lower) | always | `console.error` |
| **warning** | can legitimately happen (offline, a damaged setting, an odd file) | — | always | `console.warn` |
| **info** | a normal event worth a line — including everything the user is told | — | always | `console.info` |
| **debug** | developer detail | — | only at `?log=debug` | `console.debug` |

**Kept** = the always-on log on the device (the last ~500 entries; repeats counted, not stored again; page loads with
the build and "was this tab discarded?"). **Shown** = the banner (red, stays until clicked, Copy, a "Turn off" link,
a debugger stop when DevTools is open; never a blocking pause). The browser driver runs at `?log=debug` and fails a test
on any error or critical.

## 2. Areas and IDs

Every message carries an **area**; warning and above also carry a **stable ID** — `AREA-NNN`, never reused or
renumbered (support can ask "what codes do you see?"; the help notes can explain each). The area codes don't
collide with the test-ID areas (APP, DRV, ORG, MERGE, …).

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

## 3. The sort — every console line in the app's own code (177, counted 2026-11-05)

Files: readerwrangler.js (123), mobile.js (16), storage.js (18), relay-client.js (19), integrity.js (1); none in
the other modules or the page's inline scripts. Totals: **critical** 6, **error** 28, **warning** 37, **info** 35, **debug** 44, **remove** 8, **merge** 19 (merge = folded into the line named, so a multi-line message becomes one entry).

| # | Where | Now | Today's text (start) | Level | Area | ID / action | Note |
|---|---|---|---|---|---|---|---|
| 1 | readerwrangler.js:113 | log | `` `✅ APP_VERSION: ${APP_VERSION} (from readerwrangler.html)`); `` | remove | BOOT |  | the page-load record carries the build |
| 2 | readerwrangler.js:131 | log | `` `🔧 DEV environment: relay → dev worker (${window._RW_RELAY_WORKER_URL})`); `` | info | BOOT |  | which relay this copy talks to |
| 3 | readerwrangler.js:965 | warn | `'[Popover] this popup\'s button is missing {...popupTrigger(isOpen)} — spread it onto the butto…` | **error** | UI | UI-001 | a coding slip (contributors only today) |
| 4 | readerwrangler.js:2769 | error | `'Integrity check failed:', e);` | **error** | INTEG | INTEG-001 | the safety check itself crashed — a bug |
| 5 | readerwrangler.js:3048 | log | `` `🗑️ Tombstone sent for ${deletedAsins.length} book(s) (merges will honor the delete)`); `` | info | SYNC |  |  |
| 6 | readerwrangler.js:3051 | warn | `'⚠️ Permanent delete succeeded locally but relay tombstone failed (will not resurrect while loc…` | warning | SYNC | SYNC-001 | the network can fail |
| 7 | readerwrangler.js:3388 | log | `` `🔄 Reordered ${bookIdsToMove.length} book(s) in folder`); `` | debug | MOVE |  | the user's own action (the toast is logged as info) |
| 8 | readerwrangler.js:3548 | log | `` `🔄 Reordered ${folderIdsToMove.length} folder(s) in parent ${parentId \|\| 'root'}`); `` | debug | MOVE |  | the user's own action |
| 9 | readerwrangler.js:3732 | log | `` `📁 Moved ${folderIds.length} folder(s) into ${newParentId \|\| 'root'}`); `` | debug | MOVE |  | the user's own action |
| 10 | readerwrangler.js:3809 | log | `` `🗑️ Deleted folder "${folder.name}"${subCount > 0 ? ` + ${subCount} subfolder(s)` : ''}${bookCo… `` | debug | MOVE |  | the user's own action |
| 11 | readerwrangler.js:4110 | error | `'Failed to load filters from localStorage:', e);` | warning | PREF | PREF-001 | a damaged saved setting; falls back |
| 12 | readerwrangler.js:4133 | warn | `'Relay status check failed:', err.message);` | warning | SYNC | SYNC-002 | the network can fail |
| 13 | readerwrangler.js:4162 | log | `` `[Relay] Poll result: ${manifest && manifest.timestamp `` | debug | SYNC |  |  |
| 14 | readerwrangler.js:4179 | warn | `'Relay poll failed:', err.message);` | warning | SYNC | SYNC-003 | background poll offline — counted, not repeated (rate limit) |
| 15 | readerwrangler.js:4189 | log | `` `[Relay] Polling for updates (${reason})...`); `` | debug | SYNC |  |  |
| 16 | readerwrangler.js:4236 | error | `'Failed to save filters to localStorage:', e);` | warning | PREF | PREF-002 | storage full? |
| 17 | readerwrangler.js:4303 | error | `'Failed to load wizard settings from localStorage:', e);` | warning | PREF | PREF-003 |  |
| 18 | readerwrangler.js:4327 | error | `'Failed to save wizard settings to localStorage:', e);` | warning | PREF | PREF-004 |  |
| 19 | readerwrangler.js:4392 | log | `'📦 Restored libraryStatus from localStorage:', statusData.libraryStatus.loadStatus);` | debug | BOOT |  |  |
| 20 | readerwrangler.js:4396 | log | `'📦 Restored collectionsStatus from localStorage:', statusData.collectionsStatus.loadStatus);` | debug | BOOT |  |  |
| 21 | readerwrangler.js:4474 | warn | `'⚠️ Organization store unreadable (continuing with fallbacks):', e); }` | **critical** | STORE | STORE-001 | your organization store is unreadable — data at risk |
| 22 | readerwrangler.js:4481 | log | `'📦 Folders migrated from the legacy standalone key (pre-blob install)');` | info | BOOT |  | a one-time migration |
| 23 | readerwrangler.js:4506 | log | `'📥 Created default Inbox folder for fresh install');` | info | BOOT |  | a fresh install |
| 24 | readerwrangler.js:4551 | log | `` `🏷️ Format migration: cleared the invented 'Kindle eBook' default on ${migrated} book(s) — blan… `` | info | BOOT |  | a one-time migration |
| 25 | readerwrangler.js:4563 | log | `` `🔧 Integrity auto-fixed on load:`, integrityResult.autoFixed.map(f => f.description)); `` | **error** | INTEG | INTEG-002 | a repair on load means something wrote bad data — a bug |
| 26 | readerwrangler.js:4567 | warn | `` `⚠️ Integrity issues need review:`, integrityResult.needsReview.map(i => i.description)); `` | **error** | INTEG | INTEG-003 | inconsistent data the check couldn't fix |
| 27 | readerwrangler.js:4587 | error | `'🧪❌ [book-fields self-check] table structure PROBLEM —\n' + _smsg);` | **error** | FIELD | FIELD-001 | contributors' self-check: a field would be dropped on Save |
| 28 | readerwrangler.js:4592 | error | `'🧪❌ [book-fields self-check] round-trip FAILED — ' + _msg);` | **error** | FIELD | FIELD-002 | contributors' self-check: a field doesn't survive a round trip |
| 29 | readerwrangler.js:4596 | log | `` `🧪✅ [book-fields self-check] table sound + ${loadedBooks.length} books round-trip clean (${ORGA… `` | debug | FIELD |  |  |
| 30 | readerwrangler.js:4600 | warn | `'[book-fields self-check] skipped:', _e && _e.message); }` | warning | FIELD | FIELD-003 | the self-check couldn't run |
| 31 | readerwrangler.js:4622 | error | `'Failed to load data:', error);` | **critical** | BOOT | BOOT-001 | the library didn't load |
| 32 | readerwrangler.js:4659 | error | `'❌ Could not save organization:', e);` | **critical** | STORE | STORE-002 | the organization couldn't be saved (the user already gets a toast) |
| 33 | readerwrangler.js:4705 | error | `'❌ Device-state push failed:', err);` | warning | SYNC | SYNC-004 | the network can fail |
| 34 | readerwrangler.js:4744 | log | `` `🔧 Integrity auto-fixed:`, result.autoFixed.map(f => f.description)); `` | **error** | INTEG | INTEG-004 | the post-import check repaired something |
| 35 | readerwrangler.js:4747 | warn | `` `⚠️ Integrity issues need review:`, result.needsReview.map(i => i.description)); `` | **error** | INTEG | INTEG-005 |  |
| 36 | readerwrangler.js:5211 | log | `` `✅ Selected ${allIds.length} item(s) in Explorer`); `` | debug | MOVE |  |  |
| 37 | readerwrangler.js:5234 | log | `` `✂️ Cut ${bookIds.length} book(s) to clipboard (Explorer)`); `` | debug | MOVE |  |  |
| 38 | readerwrangler.js:5248 | log | `` `📋 Copied ${bookIds.length} book(s) to clipboard (Explorer)`); `` | debug | MOVE |  |  |
| 39 | readerwrangler.js:5257 | log | `'⚠️ Cannot paste into virtual folders');` | info | MOVE |  | FINDING F1: the paste is refused SILENTLY — the user isn't told |
| 40 | readerwrangler.js:5305 | log | `` `📥 Pasted ${clipboard.bookIds.length} book(s) (cut) to folder`); `` | debug | MOVE |  |  |
| 41 | readerwrangler.js:5328 | log | `` `📥 Pasted ${clipboard.bookIds.length} book(s) (copy) to folder`); `` | debug | MOVE |  |  |
| 42 | readerwrangler.js:5385 | log | `'📋 Clipboard cleared');` | debug | MOVE |  |  |
| 43 | readerwrangler.js:5410 | log | `` `✂️ Cut folder "${currentFolder.name}"`); `` | debug | MOVE |  |  |
| 44 | readerwrangler.js:5417 | log | `` `📋 Copied folder "${currentFolder.name}"`); `` | debug | MOVE |  |  |
| 45 | readerwrangler.js:5487 | log | `` `📌 Pasted (copied) "${folderToPaste.name}" into "${currentFolder.name}"`); `` | debug | MOVE |  |  |
| 46 | readerwrangler.js:5504 | log | `` `✏️ F2: Renaming "${folder.name}" in right panel`); `` | remove | UI |  | noise |
| 47 | readerwrangler.js:5512 | log | `` `✏️ F2: Renaming "${currentFolder.name}" in left panel`); `` | remove | UI |  | noise |
| 48 | readerwrangler.js:5541 | warn | `'⚠️ Data operation already in progress, skipping import');` | warning | IMPORT | IMPORT-001 | FINDING F2: Import skipped SILENTLY while another operation runs |
| 49 | readerwrangler.js:5566 | log | `` `📬 ${pending.length} pending run(s) in the mailbox`); `` | debug | IMPORT |  |  |
| 50 | readerwrangler.js:5605 | log | `` `📥 Adding ${newBookIds.length} new books to Inbox`); `` | info | IMPORT |  |  |
| 51 | readerwrangler.js:5618 | log | `'✅ Relay import complete');` | info | IMPORT |  |  |
| 52 | readerwrangler.js:5629 | log | `` `📦 Canonical consolidated: generation ${manifest.gen} (${manifest.bookCount} books, ${c.absorbe… `` | info | SYNC |  |  |
| 53 | readerwrangler.js:5633 | warn | `'⚠️ Consolidation deferred (will retry on next import):', err.message);` | warning | SYNC | SYNC-005 | retried at the next import |
| 54 | readerwrangler.js:5642 | warn | `'⚠️ Absorbed-run reclamation skipped (TTL will handle it):', err.message));` | warning | SYNC | SYNC-006 | harmless — expiry cleans up |
| 55 | readerwrangler.js:5682 | error | `'❌ Relay import failed:', err);` | warning | IMPORT | IMPORT-002 | an Import failed — network or bug; split them when building |
| 56 | readerwrangler.js:5774 | log | `` `📦 Restore pushed to relay: generation ${manifest.gen} (${manifest.bookCount} books, ${absorbed… `` | info | SYNC |  |  |
| 57 | readerwrangler.js:5776 | warn | `'⚠️ Restore succeeded locally but relay push failed (the reset letter/next import will finish i…` | warning | SYNC | SYNC-007 | the network can fail; finished later |
| 58 | readerwrangler.js:5786 | warn | `'⚠️ Data operation already in progress, skipping restore');` | warning | BACKUP | BACKUP-001 | FINDING F2: Restore skipped SILENTLY while another operation runs |
| 59 | readerwrangler.js:5831 | log | `'📋 Restoring organization from backup file (keeping current view settings)');` | info | BACKUP |  |  |
| 60 | readerwrangler.js:5833 | log | `'📋 Restoring organization from backup file (full, incl. view settings)');` | info | BACKUP |  |  |
| 61 | readerwrangler.js:5836 | log | `'⚠️ Backup file has no organization section - will start fresh');` | warning | BACKUP | BACKUP-002 | an odd backup file |
| 62 | readerwrangler.js:5857 | error | `'⚠️ Status check timed out after 60 seconds');` | warning | BACKUP | BACKUP-003 | a restore timed out |
| 63 | readerwrangler.js:5878 | error | `'Failed to sync:', error);` | **error** | BACKUP | BACKUP-004 | Restore failed — one entry with the details (63–65) |
| 64 | readerwrangler.js:5881 | error | `'Error details:', error.message, error.stack);` | merge→63 | BACKUP |  |  |
| 65 | readerwrangler.js:5884 | error | `'Error details: Unknown error (null or no message)');` | merge→63 | BACKUP |  |  |
| 66 | readerwrangler.js:6247 | log | `'✅ Backup exported (v2.0 format with organization)');` | info | BACKUP |  |  |
| 67 | readerwrangler.js:6254 | error | `'Failed to export library:', error);` | **error** | BACKUP | BACKUP-005 | Save Backup failed |
| 68 | readerwrangler.js:6330 | error | `'Failed to save spreadsheet:', error);` | **error** | BACKUP | BACKUP-006 | Save as Spreadsheet failed |
| 69 | readerwrangler.js:6386 | log | `'✅ Cleared library - app reset to initial state');` | info | STORE |  | Reset App |
| 70 | readerwrangler.js:6389 | error | `'Failed to clear library:', error);` | **error** | STORE | STORE-003 | Reset App failed |
| 71 | readerwrangler.js:6447 | log | `'No collections data available to merge');` | debug | IMPORT |  |  |
| 72 | readerwrangler.js:6465 | log | `` `📚 Collections data merged:`); `` | info | IMPORT |  | one line instead of three (72–74) |
| 73 | readerwrangler.js:6466 | log | `` `   - ${booksWithCollections} books have collections`); `` | merge→72 | IMPORT |  |  |
| 74 | readerwrangler.js:6467 | log | `` `   - ${readBooks} READ, ${unreadBooks} UNREAD, ${mergedBooks.length - readBooks - unreadBooks}… `` | merge→72 | IMPORT |  |  |
| 75 | readerwrangler.js:6478 | error | `'❌ Wrong file type selected');` | warning | BACKUP | BACKUP-007 | the wrong kind of file — one entry (75–77) |
| 76 | readerwrangler.js:6479 | error | `'   You selected an old Collections file');` | merge→75 | BACKUP |  |  |
| 77 | readerwrangler.js:6480 | error | `'   Please select amazon-library.json instead');` | merge→75 | BACKUP |  |  |
| 78 | readerwrangler.js:6491 | error | `'❌ Invalid v2.x library format');` | warning | BACKUP | BACKUP-008 | a damaged file — one entry (78–80) |
| 79 | readerwrangler.js:6492 | error | `'   Expected: {schemaVersion: "2.x", books: {items: [...]}}');` | merge→78 | BACKUP |  |  |
| 80 | readerwrangler.js:6493 | error | `'   Received:', Object.keys(parsedData));` | merge→78 | BACKUP |  |  |
| 81 | readerwrangler.js:6510 | log | `` `📋 Loaded schema ${parsedData.schemaVersion} unified file`); `` | debug | BACKUP |  | one line instead of four (81–84) |
| 82 | readerwrangler.js:6511 | log | `` `   Total books: ${metadata.totalBooks}`); `` | merge→81 | BACKUP |  |  |
| 83 | readerwrangler.js:6512 | log | `` `   Fetched: ${new Date(metadata.fetchDate).toLocaleString()}`); `` | merge→81 | BACKUP |  |  |
| 84 | readerwrangler.js:6513 | log | `` `   Fetcher version: ${metadata.fetcherVersion}`); `` | merge→81 | BACKUP |  |  |
| 85 | readerwrangler.js:6524 | log | `` `📚 Loaded embedded collections for ${collections.size} books`); `` | debug | BACKUP |  | one line (85–86) |
| 86 | readerwrangler.js:6525 | log | `` `   Collections fetched: ${new Date(parsedData.collections.fetchDate).toLocaleString()}`); `` | merge→85 | BACKUP |  |  |
| 87 | readerwrangler.js:6535 | log | `'📚 No collections data in file (run Collections Fetcher to add)');` | debug | BACKUP |  |  |
| 88 | readerwrangler.js:6549 | error | `'❌ Unsupported library file (pre-2.0 format):', Object.keys(parsedData));` | warning | BACKUP | BACKUP-009 | a pre-2.0 file — no longer supported |
| 89 | readerwrangler.js:6596 | log | `'✅ Books sorted by acquisition date (newest first)');` | remove | IMPORT |  | noise |
| 90 | readerwrangler.js:6598 | error | `'❌ Sort failed:', error);` | **error** | IMPORT | IMPORT-003 | sorting crashed — a bug; one entry (90–91) |
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
| 101 | readerwrangler.js:6716 | log | `'Note: Could not read localStorage organization');` | warning | STORE | STORE-004 |  |
| 102 | readerwrangler.js:6778 | log | `` `🔧 Integrity auto-fixed during restore:`, integrityResult.autoFixed.map(f => f.description)); `` | **error** | INTEG | INTEG-006 | FINDING F5: fires on EVERY Import with new books today (the Import-order task) |
| 103 | readerwrangler.js:6783 | log | `` `✅ Restored ${restoredFolders.length} folders from ${orgSource}`); `` | info | BACKUP |  |  |
| 104 | readerwrangler.js:6786 | log | `'📁 No folders in backup - keeping existing folder structure');` | info | BACKUP |  | an old backup |
| 105 | readerwrangler.js:6817 | log | `'📁 No explorer settings in backup - keeping existing preferences');` | debug | BACKUP |  |  |
| 106 | readerwrangler.js:6824 | log | `` `🎨 Restored theme preference: ${orgToRestore.theme}`); `` | debug | BACKUP |  |  |
| 107 | readerwrangler.js:6845 | log | `` `✅ Backup restored and synced to relay (${mergedBooks.length} books)`); `` | info | BACKUP |  |  |
| 108 | readerwrangler.js:6859 | warn | `'⚠️ Backup restored locally but relay sync failed:', err.message);` | warning | SYNC | SYNC-008 | the network can fail |
| 109 | readerwrangler.js:6866 | log | `` `✅ Restored organization from ${orgSource}`); `` | debug | BACKUP |  | repeats 103 |
| 110 | readerwrangler.js:6908 | error | `'Cache read error:', e);` | warning | COVER | COVER-001 |  |
| 111 | readerwrangler.js:7496 | warn | `'recordAction: no undo/redo label for action type', action.type);` | **error** | UNDO | UNDO-001 | an action with no undo label — a coding slip |
| 112 | readerwrangler.js:8084 | warn | `'Unknown action type for undo:', action.type);` | **error** | UNDO | UNDO-002 | Undo of an unknown action does NOTHING — a bug |
| 113 | readerwrangler.js:8628 | warn | `'Unknown action type for redo:', action.type);` | **error** | UNDO | UNDO-003 | Redo of an unknown action does NOTHING — a bug |
| 114 | readerwrangler.js:12237 | log | `'📋 Backup restore cancelled by user'); setRestoreConfirm(null); }}` | debug | BACKUP |  |  |
| 115 | readerwrangler.js:12270 | log | `'📋 Backup restore cancelled by user'); setRestoreConfirm(null); }}` | debug | BACKUP |  |  |
| 116 | readerwrangler.js:15023 | warn | `'Folder reparent failed:', err); }` | **error** | MOVE | MOVE-001 | a drop crashed |
| 117 | readerwrangler.js:15271 | error | `'Tag view on folder drop error:', err);` | **error** | MOVE | MOVE-002 | a drop crashed |
| 118 | readerwrangler.js:15324 | error | `'Sidebar folder drop error:', err);` | **error** | MOVE | MOVE-003 | a drop crashed |
| 119 | readerwrangler.js:15729 | error | `'Breadcrumb folder drop error:', err);` | **error** | MOVE | MOVE-004 | a drop crashed |
| 120 | readerwrangler.js:15749 | error | `'Breadcrumb book drop error:', err);` | **error** | MOVE | MOVE-005 | a drop crashed |
| 121 | readerwrangler.js:18692 | log | `` `✂️ Cut folder "${folder.name}"`); `` | debug | MOVE |  |  |
| 122 | readerwrangler.js:18708 | log | `` `📋 Copied folder "${folder.name}"`); `` | debug | MOVE |  |  |
| 123 | readerwrangler.js:18800 | log | `` `📋 Pasted (copied) "${folderToPaste.name}" into "${folder.name}"`); `` | debug | MOVE |  |  |
| 124 | mobile.js:4 | log | `` `✅ Mobile viewer ${MOBILE_VERSION} \| APP_VERSION: ${APP_VERSION}`); `` | remove | BOOT |  | the page-load record carries the build |
| 125 | mobile.js:32 | log | `` `🔧 DEV environment: relay → dev worker (${window._RW_RELAY_WORKER_URL})`); `` | info | BOOT |  | which relay |
| 126 | mobile.js:2401 | log | `'✅ Paired via QR: channel ' + creds.channelId.slice(0, 8) + '...');` | info | PHONE |  | keeps a short channel prefix (allowed); the log's scrubber removes it on Copy |
| 127 | mobile.js:2404 | error | `'❌ Failed to parse pairing data from URL:', e);` | warning | PHONE | PHONE-001 | a bad pairing link |
| 128 | mobile.js:2539 | log | `` `[Freshness] cached gen ${blob.deviceStateGen \|\| '(none)'} vs pointed ${gen} → ${newer ? 'NEW… `` | debug | PHONE |  |  |
| 129 | mobile.js:2583 | log | `` `📡 Device-state received: ${data.books.items.length} books`); `` | info | PHONE |  |  |
| 130 | mobile.js:2613 | log | `'✅ Device-state applied to local storage');` | info | PHONE |  |  |
| 131 | mobile.js:2615 | log | `` `🛡️ Cache write skipped — local data is newer (guest guard; payload ${payloadSavedAt ? new Date… `` | info | PHONE |  | the guest guard working as designed |
| 132 | mobile.js:2619 | log | `'📡 No device-state on relay (404) — using local data');` | info | PHONE |  |  |
| 133 | mobile.js:2622 | warn | `'⚠️ Device-state pull failed, using cached data:', err.message);` | warning | PHONE | PHONE-002 | offline — uses its cache |
| 134 | mobile.js:2655 | log | `` `✅ Mobile loaded: ${loadedBooks.length} books, ${savedFolders.length} folders`); `` | info | PHONE |  |  |
| 135 | mobile.js:2692 | error | `'❌ Mobile data load failed:', err))` | **error** | PHONE | PHONE-003 | the phone couldn't load (its data isn't at risk — read-only) |
| 136 | mobile.js:2860 | error | `'❌ QR decode error:', e);` | warning | PHONE | PHONE-004 |  |
| 137 | mobile.js:2866 | error | `'❌ QR scanner failed:', e);` | warning | PHONE | PHONE-005 | camera refused? |
| 138 | mobile.js:2914 | log | `` `✅ Paired ${method}: channel ${creds.channelId.slice(0, 8)}...`); `` | info | PHONE |  |  |
| 139 | mobile.js:2922 | error | `'❌ Post-pair load failed:', err); setLoading(false); });` | **error** | PHONE | PHONE-006 |  |
| 140 | storage.js:48 | log | `` `🔄 Saving ${books.length} books to IndexedDB... (preserveUserData: ${preserveUserData})`); `` | debug | STORE |  |  |
| 141 | storage.js:83 | log | `` `📋 Preserving ${orphanWishlists.length} orphan wishlist items`); `` | debug | STORE |  |  |
| 142 | storage.js:152 | log | `` `🛡️ Preserving user-edited fields for "${previousBook.title}":`, Object.keys(ue).join(', ')); `` | debug | STORE |  | one line PER BOOK — rate limiting matters here |
| 143 | storage.js:184 | warn | `` `⚠️  Found ${duplicates.length} duplicate ASINs, owned books take priority`); `` | warning | STORE | STORE-005 | duplicate ASINs — one entry (143–144) |
| 144 | storage.js:185 | warn | `` `   Sample duplicates:`, duplicates.slice(0, 5)); `` | merge→143 | STORE |  |  |
| 145 | storage.js:189 | log | `` `🎉 ${wishlistToOwned.length} wishlist items now owned (price goals preserved)`); `` | info | STORE |  |  |
| 146 | storage.js:202 | log | `'✅ Saved', uniqueBooks.length, 'unique books to IndexedDB');` | debug | STORE |  |  |
| 147 | storage.js:207 | error | `'❌ IndexedDB save failed:', error);` | **critical** | STORE | STORE-006 | the books couldn't be saved |
| 148 | storage.js:212 | error | `'❌ IndexedDB save exception:', error);` | **critical** | STORE | STORE-007 | the books couldn't be saved |
| 149 | storage.js:230 | log | `'✅ Loaded', books.length, 'books from IndexedDB');` | debug | STORE |  |  |
| 150 | storage.js:246 | warn | `'🔎[schema] Unknown book field(s) on loaded books:', list,` | **error** | FIELD | FIELD-004 | a field nothing knows — schema drift |
| 151 | storage.js:269 | log | `'✅ Deleted IndexedDB:', DB_NAME); resolve(); };` | info | STORE |  | Reset App |
| 152 | storage.js:270 | error | `'❌ Failed to delete IndexedDB:', DB_NAME, request.error); reject(request.error); };` | **error** | STORE | STORE-008 | Reset App couldn't delete the book store |
| 153 | storage.js:271 | warn | `'⚠️ IndexedDB delete blocked — close other tabs'); resolve(); };` | warning | STORE | STORE-009 | FINDING F3: blocked by another tab — the reset carries on as if done |
| 154 | storage.js:293 | log | `` `📷 Cover cache: ${Object.keys(urlMap).length}/${books.length} covers loaded from cache in ${ela… `` | debug | COVER |  |  |
| 155 | storage.js:295 | error | `'Cover cache read failed:', e);` | warning | COVER | COVER-002 |  |
| 156 | storage.js:340 | log | `` `📷 Cover cache populated: ${cached} already cached, ${fetched} newly fetched, ${failed} failed … `` | debug | COVER |  |  |
| 157 | storage.js:342 | error | `'Cover cache population failed:', e);` | warning | COVER | COVER-003 |  |
| 158 | relay-client.js:400 | warn | `'Relay cleanup failed:', await response.text());` | warning | SYNC | SYNC-009 |  |
| 159 | relay-client.js:997 | warn | `` `Bulk-run GC skipped for ${r.runId} (TTL will handle it):`, e.message); } `` | warning | SYNC | SYNC-010 | harmless — expiry cleans up |
| 160 | relay-client.js:999 | log | `` `🧹 Reclaimed ${deleted} absorbed bulk run(s)`); `` | info | SYNC |  |  |
| 161 | relay-client.js:1068 | warn | `'composeCanonical: unparseable canonical ignored:', e.message); }` | **critical** | SYNC | SYNC-011 | the cloud copy itself is unreadable — data at risk |
| 162 | relay-client.js:1074 | warn | `` `composeCanonical: unparseable run ${run.runId} ignored:`, e.message); continue; } `` | **error** | SYNC | SYNC-012 | a sent batch of books is unreadable — those books are missing |
| 163 | relay-client.js:1150 | log | `` `⏰ Age cap: oldest pending run is ${((Date.now() - oldest) / 86400000).toFixed(1)}d old — conso… `` | info | SYNC |  |  |
| 164 | relay-client.js:1159 | warn | `'Age-cap merge skipped:', e.message);` | warning | SYNC | SYNC-013 |  |
| 165 | relay-client.js:1233 | log | `'[Relay] Reading library + pending additions (read-only)...');` | debug | SYNC |  | runs in the fetchers too (see note) |
| 166 | relay-client.js:1242 | log | `` `   ✅ Library: ${data.books.items.length} books (via ${canonical.source})`); `` | debug | SYNC |  |  |
| 167 | relay-client.js:1245 | warn | `'   ⚠️ Could not parse library data:', e.message);` | **error** | SYNC | SYNC-014 | the cloud library is unreadable to the fetcher |
| 168 | relay-client.js:1248 | log | `'   ℹ️ No library on relay yet — checking pending additions only');` | info | SYNC |  |  |
| 169 | relay-client.js:1273 | log | `` `   ✅ Plus ${pendingBooks} pending book(s) not yet merged`); `` | debug | SYNC |  | one line (169–171) |
| 170 | relay-client.js:1274 | log | `` `   🗑️ Minus ${pendingDeletes} pending deletion(s)`); `` | merge→169 | SYNC |  |  |
| 171 | relay-client.js:1275 | log | `'');` | remove | SYNC |  | a blank line |
| 172 | relay-client.js:1291 | log | `'[Relay] Sending wishlist addition (atomic run)...');` | debug | SYNC |  |  |
| 173 | relay-client.js:1307 | log | `` `   ✅ Sent ${newBooks.length} book(s)${res.inline ? ' in a single write' : ` (${res.seqCount} p… `` | info | SYNC |  |  |
| 174 | relay-client.js:1310 | error | `'❌ Send failed:', relayError.message);` | warning | SYNC | SYNC-015 | the network can fail; it retries |
| 175 | relay-client.js:1327 | log | `` `📦 Age-cap consolidation done (${acm.bookCount} books)`); }) `` | info | SYNC |  |  |
| 176 | relay-client.js:1328 | warn | `'Age-cap check skipped:', e.message));` | warning | SYNC | SYNC-016 |  |
| 177 | integrity.js:107 | error | `'Failed to save integrity results:', e);` | warning | INTEG | INTEG-007 | storage full? |

## 4. Findings from the sort (not logging — things the lines revealed)

1. **F1 — a refused paste says nothing** (#39): Ctrl+V into All Books, the Inbox or another virtual folder is refused
   with only a console line; the user isn't told (Law 16). Fix: a toast saying why.
2. **F2 — Import and Restore skip silently** (#48, #58) when another data operation is already running — the click
   just does nothing. Fix: say so ("Another operation is still running — try again in a moment"), or queue it.
3. **F3 — Reset App can report success without deleting the book store** (#153): when another tab holds the
   store open, the delete is "blocked" and the code carries on as if done (`resolve()`). Check what the user sees; fix
   with "close your other ReaderWrangler tabs" and a real retry.
4. **F4 — personal text in the console** (#98, #99): an import prints a book's tags and the full text of a user's
   NOTE. Remove them — a copied diagnostics log must never carry a note.
5. **F5 — the integrity alarm fires on every normal Import** (#102): the known false alarm (Small fixes: "Import files
   new books once, before the integrity check…"). Making it an **error** before that fix lands would raise the banner on
   every Import in diagnostics mode — so **that fix comes first, in this branch** (it's small and in the same code).
6. **relay-client.js also runs inside the fetchers** on Amazon's pages (#158–176): the logging module must load there
   too, or relay-client falls back to the plain console — decide when building (TODO task, item 10).

## 5. Build order (this branch, `feature/logging`)

1. The Import-order fix (F5) — first, so the integrity alarm is real before it becomes an error.
2. The module: levels, areas, IDs, the kept log (rate limiting, page loads), the scrubber — function tests first.
3. The gate (`?log=`), the banner, critical shown to users — screen tests first.
4. Switch the 177 lines per section 3 (one commit per area); F1–F4 filed or fixed as Ron decides.
5. The Diagnostics view in Data Status (filter, Copy).
6. The browser driver at `?log=debug`, failing a test on any error or critical.
