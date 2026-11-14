# Message codes — generated, do not edit

_Written by `py tools/message_codes.py` from every `rwLog.log(…)` call in the code (docs/design/LOGGING.md §6). The commit check refuses a commit whose copy is out of date. Support: find the code a user reports; the level says how serious it is._

83 numbered codes. (169 general lines — info and debug, coded by their area alone — not listed.)

| Code | Level | Message | File |
|---|---|---|---|
| BACKUP-01 | warning | … is already running — it will finish in a moment. | readerwrangler.js |
| BACKUP-02 | warning | Refused a backup: … — nothing was changed | readerwrangler.js |
| BACKUP-03 | warning | The restore took longer than 60 seconds to finish — asked the person to reload the page | readerwrangler.js |
| BACKUP-04 | error | Restore failed: … | readerwrangler.js |
| BACKUP-05 | error | Save Backup failed: … | readerwrangler.js |
| BACKUP-06 | error | Save as Spreadsheet failed: … | readerwrangler.js |
| BACKUP-07 | warning | That file can't be restored: … | readerwrangler.js |
| BACKUP-08 | warning | Save Backup refused: the library hasn't finished loading | readerwrangler.js |
| BOOT-01 | critical | Your library couldn't be loaded. | readerwrangler.js |
| BOOT-03 | warning | A saved view setting had the wrong shape — the defaults are used for the rest | readerwrangler.js |
| COVER-02 | warning | The cover cache couldn't be read — covers load from Amazon instead | storage.js |
| COVER-03 | warning | Saving covers in this browser's cache failed — they load from Amazon each time instead | storage.js |
| COVER-04 | warning | The old cover copies couldn't be removed — they only take storage space | storage.js |
| FIELD-01 | error | The book-field table's self-check found a problem — a field would be dropped on Save: … | readerwrangler.js |
| FIELD-02 | error | A book field doesn't survive a save and load (the round-trip self-check): … | readerwrangler.js |
| FIELD-03 | warning | The book-field self-check couldn't run: … | readerwrangler.js |
| FIELD-04 | error | Book field(s) nothing knows are on stored books: … — add to KNOWN_BOOK_FIELDS (bookFields.js) if legitimate, else a phantom or misnamed field leaked in | storage.js |
| IMPORT-01 | warning | … is already running — it will finish in a moment. | readerwrangler.js |
| IMPORT-02 | warning | Import from Relay failed — the relay couldn't be reached: … | readerwrangler.js |
| IMPORT-03 | error | Sorting the books by date added crashed: … | readerwrangler.js |
| IMPORT-04 | error | Import from Relay failed unexpectedly: … | readerwrangler.js |
| IMPORT-05 | error | The relay's copy failed its integrity check — the recovery steps were shown (this device's library is safe): … | readerwrangler.js |
| INTEG-01 | error | The integrity check itself crashed: … | readerwrangler.js |
| INTEG-02 | error | Library repair on load: … issue… fixed — see Data Status | readerwrangler.js |
| INTEG-03 | error | The integrity check found … problem(s) it couldn't fix (on load) | readerwrangler.js |
| INTEG-04 | error | Library repair: … issue… fixed — see Data Status | readerwrangler.js |
| INTEG-05 | error | The integrity check found … problem(s) it couldn't fix (after an Import or Restore) | readerwrangler.js |
| INTEG-06 | error | Library repair while loading an Import or Restore: … kind(s) of problem fixed | readerwrangler.js |
| INTEG-07 | warning | Could not save the integrity check's results (storage full?) | integrity.js |
| MOVE-01 | error | That move didn't work. | readerwrangler.js |
| MOVE-02 | error | That move didn't work. | readerwrangler.js |
| MOVE-03 | error | That move didn't work. | readerwrangler.js |
| MOVE-04 | error | That move didn't work. | readerwrangler.js |
| MOVE-06 | warning | … | readerwrangler.js |
| MOVE-07 | warning | Inbox cannot be moved | readerwrangler.js |
| MOVE-10 | warning | … | readerwrangler.js |
| PHONE-01 | warning | The pairing link couldn't be read — pair again from the computer | mobile.js |
| PHONE-02 | warning | Couldn't get the library from the relay — showing what's on this phone: … | mobile.js |
| PHONE-03 | critical | Your library couldn't be loaded on this phone. | mobile.js |
| PHONE-04 | warning | The scanned code isn't a ReaderWrangler pairing code | mobile.js |
| PHONE-05 | warning | The camera couldn't start for scanning (permission refused?): … | mobile.js |
| PHONE-06 | critical | Your library couldn't be loaded on this phone after pairing. | mobile.js |
| PREF-02 | warning | Your filters couldn't be saved (is the browser's storage full?) | readerwrangler.js |
| PREF-04 | warning | Your Auto-Organize settings couldn't be saved (is the browser's storage full?) | readerwrangler.js |
| STORE-01 | critical | Your saved organization could not be read — ReaderWrangler is using a fallback copy. | readerwrangler.js |
| STORE-02 | critical | Your library organization could not be saved — browser storage may be full. | readerwrangler.js |
| STORE-03 | error | Reset App failed: … | readerwrangler.js |
| STORE-04 | warning | Could not read the saved organization while loading a library — the folders were left as they are | readerwrangler.js |
| STORE-05 | warning | … books arrived twice (the same ASIN) — the owned copy was kept | storage.js |
| STORE-06 | critical | Your books could not be saved in this browser. | storage.js |
| STORE-07 | critical | Your books could not be saved in this browser. | storage.js |
| STORE-08 | error | A reset couldn't delete the book store: … | storage.js |
| STORE-09 | warning | The book store is held open by another tab — the reset waits for it to close | storage.js |
| STORE-10 | error | Your library organization still can't be saved | readerwrangler.js |
| STORE-11 | error | A "reset in another tab" listener failed: … | storage.js |
| STORE-12 | error | The emergency reset failed: … | reset.js |
| STORE-13 | warning | The saved "…" couldn't be read (…) — the default is used | uiHelpers.js |
| SYNC-01 | warning | A permanent delete worked here, but telling the relay failed — if the book comes back after a fetch, delete it again | readerwrangler.js |
| SYNC-02 | warning | Couldn't check the relay for news: … | readerwrangler.js |
| SYNC-03 | warning | The background relay poll failed: … | readerwrangler.js |
| SYNC-04 | warning | Couldn't send your organization to the relay (it retries at the next change): … | readerwrangler.js |
| SYNC-05 | warning | Combining the relay's copy was put off (it retries at the next Import): … | readerwrangler.js |
| SYNC-06 | warning | Clearing already-imported batches off the relay was skipped (they expire on their own): … | readerwrangler.js |
| SYNC-07 | warning | Restore worked here, but the relay push failed — the next Import finishes it: … | readerwrangler.js |
| SYNC-08 | warning | A backup restored here, but sending your organization to the relay failed: … | readerwrangler.js |
| SYNC-09 | warning | Relay cleanup failed | relay-client.js |
| SYNC-10 | warning | Clearing an imported batch off the relay was skipped (it expires on its own): … | relay-client.js |
| SYNC-11 | critical | The relay's saved copy of your library could not be read — it was skipped. | relay-client.js |
| SYNC-12 | error | A batch of books on the relay could not be read — it was skipped: … | relay-client.js |
| SYNC-13 | warning | Combining the relay's copy (for an old batch) was skipped: … | relay-client.js |
| SYNC-14 | error | The relay's library could not be read: … | relay-client.js |
| SYNC-15 | warning | Sending to the relay failed (it can be retried): … | relay-client.js |
| SYNC-16 | warning | Checking for old batches on the relay was skipped: … | relay-client.js |
| UI-01 | error | A popup's button is missing {...popupTrigger(isOpen)} — spread it onto the button so other popups switch to it in one click (a coding slip) | readerwrangler.js |
| UI-02 | error | A logging call was malformed: … | logkit/logger.js |
| UI-03 | error | Uncaught error: … | logkit/logger.js |
| UI-04 | error | A failed promise nobody handled: … | logkit/logger.js |
| UI-05 | error | A dialog named an unknown area "…" (a coding slip) | logkit/logger.js |
| UI-06 | warning | … couldn't be copied… — the browser refused the clipboard | logkit/logger.js |
| UI-07 | error | A test message from Diagnostics — not a real problem | logkit/diagnostics-window.js |
| UNDO-01 | error | An action has no undo / redo label (a coding slip): … | readerwrangler.js |
| UNDO-02 | error | Undo did nothing — this code doesn't know the action (a coding slip): … | readerwrangler.js |
| UNDO-03 | error | Redo did nothing — this code doesn't know the action (a coding slip): … | readerwrangler.js |
