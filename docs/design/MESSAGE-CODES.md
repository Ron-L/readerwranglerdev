# Message codes — generated, do not edit

_Written by `py tools/message_codes.py` from every `rwLog.log(…)` call in the code (docs/design/LOGGING.md §6). The commit check refuses a commit whose copy is out of date. Support: find the code a user reports; the level says how serious it is._

10 numbered codes. (1 general line — info and debug, coded by their area alone — not listed.)

| Code | Level | Message | File |
|---|---|---|---|
| INTEG-01 | error | The integrity check itself crashed: … | readerwrangler.js |
| INTEG-02 | error | Library repair on load: … issue… fixed — see Data Status | readerwrangler.js |
| INTEG-03 | error | The integrity check found … problem(s) it couldn't fix (on load) | readerwrangler.js |
| INTEG-04 | error | Library repair: … issue… fixed — see Data Status | readerwrangler.js |
| INTEG-05 | error | The integrity check found … problem(s) it couldn't fix (after an Import or Restore) | readerwrangler.js |
| INTEG-06 | error | Library repair while loading an Import or Restore: … kind(s) of problem fixed | readerwrangler.js |
| INTEG-07 | warning | Could not save the integrity check's results (storage full?) | integrity.js |
| UI-02 | error | A logging call was malformed: … | logger.js |
| UI-03 | error | Uncaught error: … | logger.js |
| UI-04 | error | A failed promise nobody handled: … | logger.js |
