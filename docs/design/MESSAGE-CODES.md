# Message codes — generated, do not edit

_Written by `py tools/message_codes.py` from every `rwLog.log(…)` call in the code (docs/design/LOGGING.md §6). The commit check refuses a commit whose copy is out of date. Support: find the code a user reports; the level says how serious it is._

3 numbered codes. (1 general line — info and debug, coded by their area alone — not listed.)

| Code | Level | Message | File |
|---|---|---|---|
| UI-02 | error | A logging call was malformed: … | logger.js |
| UI-03 | error | Uncaught error: … | logger.js |
| UI-04 | error | A failed promise nobody handled: … | logger.js |
