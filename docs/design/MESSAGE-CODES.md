# Message codes — generated, do not edit

_Written by `py tools/message_codes.py` from every `rwLog.log(…)` call in the code (docs/design/LOGGING.md §6). The commit check refuses a commit whose copy is out of date. Support: find the code a user reports; the level says how serious it is._

21 numbered codes. (11 general lines — info and debug, coded by their area alone — not listed.)

| Code | Level | Message | File |
|---|---|---|---|
| INTEG-01 | error | The integrity check itself crashed: … | readerwrangler.js |
| INTEG-02 | error | Library repair on load: … issue… fixed — see Data Status | readerwrangler.js |
| INTEG-03 | error | The integrity check found … problem(s) it couldn't fix (on load) | readerwrangler.js |
| INTEG-04 | error | Library repair: … issue… fixed — see Data Status | readerwrangler.js |
| INTEG-05 | error | The integrity check found … problem(s) it couldn't fix (after an Import or Restore) | readerwrangler.js |
| INTEG-06 | error | Library repair while loading an Import or Restore: … kind(s) of problem fixed | readerwrangler.js |
| INTEG-07 | warning | Could not save the integrity check's results (storage full?) | integrity.js |
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
| UI-02 | error | A logging call was malformed: … | logger.js |
| UI-03 | error | Uncaught error: … | logger.js |
| UI-04 | error | A failed promise nobody handled: … | logger.js |
