# Testing — the regression library, and how it grows

_Decided 2026-11-04 (Ron + Claude). The umbrella over every test in ReaderWrangler: what kinds there are, when each
runs, how the library grows task by task, and the rules that keep it trustworthy. Supersedes the "out of scope —
permanently" line of PRELAUNCH-TEST-GATE.md for screens, dialogs, drag-and-drop and menus: the browser driver makes
them testable, and with Claude writing the tests the cost that justified skipping them is gone. That doc's suites stay
the pre-launch data gate (task "All the pre-launch data tests pass")._

---

## 1. The rule

> **"If you don't have a test case, you can't prove you fixed it."** — Ron

The regression library is built **gradually, from the work** — never written all up front. Each task adds the tests
that prove it; each bug fix adds the test that would have caught it. Over time the library becomes the guarantee that
nothing that once worked silently stops working.

**When a test covers one case of a class** (one ownership kind, one filter), **it covers the whole class if that's
cheap** — one test with a row per case, the rows taken from **the same list the code uses**, so a new case is tested
the day it's added. Each row needs its expected result; **a case with no expected result written fails the test**
(a default "missing — write its expectation" failure), so nobody can add an ownership kind or a filter without saying
how it should behave. (Ron + Claude, 2026-11-04 — the fetcher's hand-kept list once missed library loans and Audible
Plus for exactly want of this.)

## 2. Two levels — test at the lowest one that can catch the problem

1. **Function tests** — fast, sturdy, most of the library. For logic: merging, the book-field table, the ownership
   rules, date labels, the key format and its check characters, Auto-Organize, the overlay stack. Plain Node files in
   `test/` (the five that exist today).
2. **Screen tests** — through the browser driver (Playwright for Python, the installed Chrome — Ron's browser — a throwaway profile, scrollbars shown).
   Only for what only the screen can show: what the Delete key targets, focus staying inside a window, drag labels,
   two tabs catching up, a menu item disabled rather than missing.

A bug in a function caught by a screen test costs a hundred times the runtime and breaks whenever a button moves. When
a screen test is the only way to catch something, consider first whether the logic should be lifted into a function
that a function test can reach.

**Free with every screen test:** the logging module (7.26.0, docs/design/LOGGING.md) is switched on in the
driver's browser, so **any unexpected error fails the run** — every screen test also checks "nothing went wrong
underneath".

## 3. Tiers — when each runs

| Tier | What | When | Budget |
|---|---|---|---|
| **1** | Function tests + the commit checks (names, parse, versions, private values, TOC…) | **Every commit, automatically** — only the tests covering the staged files | seconds (≤ ~10 s) |
| **2** | Screen tests | **Before every alpha Claude hands Ron** — Ron is never the first to find a regression | a few minutes (≤ ~5 min) |
| **3** | Relay tests — against a local relay **the runner starts and stops itself** (dev only as a final check, by `--relay-url`) | When relay code changes; before any worker deploy | ~1½ min |
| **all** | Every tier — `py tools/run_tests.py --tier all --release`: **a skipped file fails a release run**, named with why | **Before every release** (release checklist step) | |

Plus a short **manual list per release** (§8) for what can't be automated.

## 4. The library — layout, IDs, tags, the runner

- **Files:** `test/*.test.js` (function, Node), `test/ui/test_*.py` (screen, Playwright for Python), `relay/test-*.mjs`
  (relay). Shared fixtures in `test/fixtures/`.
- **Every test has a stable ID** in its name — `AREA-NNN` (e.g. `MERGE-012`, `DELKEY-003`, `TABS-001`): failures,
  TODO tasks and post-mortems can name a test, and an ID never changes when its wording does.
- **Every test file declares, in its header:**
  - `tags:` — its areas (e.g. `merge, import`) and its tier;
  - `covers:` — the source files it tests (e.g. `bookMerge.js, storage.js`).
  The `covers:` lines are the **one source** for "which tests does this change need?" — tier 1 picks its tests from
  them, and nothing else keeps a separate list.
- **The runner — one command, in Python** (`tools/run_tests.py`; Ron's scripts rule): `--tier 1|2|3|all`,
  `--tag <area>`, `--id <ID>`, `--changed` (the tests covering what changed). With no `--tier`: tier 1 — except `--id`
  and `--tag`, which look in every tier (2026-11-12: a screen test's ID said "No tests match"; RUN-025–029); `--changed`
  stays tier 1. One summary at the end; a screen test's
  failure saves a screenshot and the console to Claude's scratch folder. The commit hook calls it with `--changed`.
- **Tier 3 brings its own relay** (`tools/local_relay.py`, 2026-11-12): with no `--relay-url`, the runner starts
  relay-worker.js in wrangler's local emulator (`wrangler dev --env dev --local`) on a free port with an empty,
  throwaway store, waits for its "Ready on" line (60 s, else it fails with the end of wrangler's output), runs the relay
  files against it, then stops every process it started **by exact id** (the whole tree) and **checks**: each one gone,
  both its ports no longer listening. Anything left fails the run, named by id — and is left running, since the runner
  can't show it started it. `--relay-url <address>` runs against a relay you started instead (no start, no stop). Never
  the dev or production relay by default.
- **`--release` — skipped is not passed** (2026-11-12; 7.28.0: "31 passed, 2 skipped" read as a pass): with it, any
  file that didn't run fails the run, each named with why. One function decides a skip (`skip_reason` in the runner);
  nothing skips today — tier 3 brings its own relay, and a missing tool fails loud — so this guards any skip added later.
- **The project's own Python for screen tests** (Ron, 2026-11-04): Playwright lives in a venv at the repo root
  (`.venv/`, ignored by git), pinned in `requirements-dev.txt` — set up once with `py -m venv .venv` then
  `.venv\Scripts\pip install -r requirements-dev.txt`. The runner starts tier-2 files with that Python and fails loud
  with that command if it's missing; tier 1 and the commit hook need no venv. Playwright drives the **installed Chrome**
  (`channel="chrome"`; Edge until 2026-11-06 — `RW_BROWSER=msedge` still runs it), so no browser download. Scrollbars are
  shown (Playwright hides them in a hidden browser by default, which hid a covered scrollbar); `App(zoom=, size=)`
  emulates browser zoom and window size. Claude's ad-hoc looks use Playwright's command-line tool through
  `npx @playwright/cli@<exact version>` — nothing installed system-wide.

## 5. Test data — three kinds

1. **A small, frozen, made-up library** (`test/fixtures/`, committed — no personal data). Built **on purpose to hold
   the awkward cases**: an omnibus at several positions, a sample and a loan of a wishlisted book, books in the Trash,
   deep and pinned folders, a book in no folder, a Book List with repeats, Amazon tags and your own tags, a book with no
   description. **Exact checks run against this.** It grows as tests need new cases.
2. **The demo library** (`readerwrangler-demo-library-ORGANIZED.json`, 118 books, and its unorganized twin with 119 —
   already public, keys removed by Ron on purpose): real Amazon-shaped data at a realistic small size — for tests that
   need believable books without the awkward cases spelled out.
3. **Ron's real library at scale** — `large-sample-private.json.gz` in the **private** repo's `test/` folder
   (3,270 books, from his 2026-11-04 backup; Cloud Sync Key removed and verified; compressed). For scale and speed —
   load time, drag with thousands of covers, "does it hold up" — not exact answers. **Committed in the private repo so
   it's backed up** (Ron): a test tied to that exact data set can always get it back, and made-up sets holding anything
   personal live there too (its README has the rules). The test loader refuses any file that still carries a key.

**The relay's stored data** (Ron, 2026-11-12 — review queue Q-021): every relay test run starts from a **fresh, empty
store, thrown away afterwards** (tier 3's own local relay, `tools/local_relay.py`), so a test never depends on what an
earlier run left — or it isn't repeatable. A test that NEEDS history (a mailbox with old runs, a channel mid-change) gets
it from a **frozen, labelled snapshot**: built once on purpose, saved as `relay/.wrangler/state-<what it holds>` (a
meaningful label, not a number), with an index listing each snapshot and what it's for; a run COPIES it into place, so
the frozen copy is always there for the next run. None exists yet — the first test that needs one makes it.

Screen tests never use Amazon's pages and never the real library's cloud copy: the test app has no Cloud Sync (or a
throwaway test channel on a local relay). Whatever the driver shows Claude goes to Anthropic — so the demo-style
fixture, never anything sensitive on screen.

## 6. The per-task routine

1. **A bug fix starts with a failing test** that reproduces the bug — then the fix makes it pass. (The utilities
   project's Law 18: reproduce with real input before explaining.)
2. **A feature's tests are its acceptance criteria**, written with it — the task's "What you'd get" made checkable.
   **A test that passes on its very first run is shown it can fail** — feed its check a deliberate problem (a wrong
   expected value, an injected error) and see it refuse — or it may be checking nothing (2026-11-04: APP-001–004's
   detectors were each shown a wrong count, a console error, a relay request and a crash). **For a fix's test, that
   means failing under its own bug** — remove the fix, or make the bug happen — since a wrong expected value proves
   only the assertion. **A test checks its own setup** before the outcome, and asserts after the screen settles, not
   when the call returns (7.26.0: DIAG-008's planted line was overwritten before it was read; IMPORT-004 passed with
   the fix removed; the Import tests checked "no repair" before the second check had run).
3. **At the task's end:**
   - **promote** its tests into the library (almost always — a test that passed once costs nothing to keep); a test
     left out says why;
   - **gaps** found next to it (things the task touched that nothing tests) — **finish the class** while you're in the
     area if it's cheap (the question is "are the remaining rows cheap now?", not a percentage); **file it as a TODO**
     if it's its own project (new fixtures, real time).
4. **The mechanisms (not memory):**
   - each task in work gets a short **Tests** section — the IDs it added, and gaps filed;
   - the **release checklist** asks "every task in this release: tests promoted, gaps filed?";
   - the **post-mortem** asks which bug of the release no test would have caught — and that test is written.

## 7. Trust — the flakiness rules

A test that fails sometimes teaches everyone to ignore failures (Law 12: an alarm on the normal path is noise). So:
- **fixed data** (§5.1) and **a fixed clock** where dates matter (the "today / yesterday" labels);
- **wait for conditions, never fixed sleeps** ("the toast appeared", not "wait 2 seconds");
- **a fresh browser profile** for each run; stop what a test started by its exact process id (Law 5) — **and check it
  stopped** (each process gone, its port free: Law 12, 7.28.0);
- **a flaky test is fixed — or set aside, with a TODO — the same day.** Never tolerated, never "just re-run it".
- **A failing test is read first, not fixed first** (Law 3, 7.25.0): it may be the protection working.

## 8. What stays manual (a short list per release)

- **Amazon's live pages** — the fetchers against the real site (fetcher *logic* can be tested against saved pages kept
  privately; the live run stays a release step).
- **Taste** — how it looks and reads.
- **A real phone** (Android, and an iPhone — Ron has access to one) until device testing is automated.

## 9. Where it starts

- **Before 2026-11-04:** five function-test files (~87 checks), each run by hand with `node test/<file>`, each with its
  own copy of a `test()` helper whose first failure stopped the file; the two relay scripts; nothing ran on commit.
- **Built 2026-11-04 (branch `feature/carry-over`):** the parse check (`PARSE-001`–`010`); **`test/harness.js`** — the one
  shared helper (stable IDs, a failure is counted and the file carries on); the five files moved onto it with headers
  and IDs (`BFIELD-`, `MERGE-`, `DATE-`, `ORG-`, `OVERLAY-`); **`tools/run_tests.py`** (`RUN-001`–`013`); headers on the
  relay scripts (tier 3 — skipped unless `--relay-url` names a relay: `test-phase1.mjs` defaults to the dev relay
  otherwise); **the commit hook runs tier 1 for what changed** (pre-commit step 7). 9 files, ~110 checks.
- **Step 2 of the order of work** ("Carry over the utilities project's improvements…") builds:
  1. ✅ the parse check (tier 1);
  2. ✅ `tools/run_tests.py` with tiers, tags, IDs and `--changed`; the existing files get `tags:` / `covers:` headers and
     IDs; the commit hook runs `--changed`;
  3. ✅ the browser driver (Playwright for Python + Edge) and the small fixture library's first version — `test/ui/rw.py`
     (the shared setup: serve.py on a free port, a fresh Edge profile, Restore through the real menu, console / crash /
     relay-and-Amazon request detectors, GoatCounter answered empty, and `hover()` / `click_reachable()` — the real
     pointer, refusing a covered or zero-size target and naming the cover: PRINCIPLES Law 8), `test/ui/harness.py`, the fixture
     (`test/fixtures/make-small-fixture.js` → `small-fixture.json`: 23 books, every ownership kind), and
     `APP-001`–`004` (the app opens cleanly; the fixture restores; every left-pane count; still clean after) and
     `DRV-001`–`003` (the driver's own reachability checks). ~50 s a
     run today — the in-browser compile; the precompile cuts it;
  4. the first screen tests — from anomaly reporting and the Delete key fix (step 4), each starting from a failing test.
- **Built 2026-11-05 (branch `feature/logging`):** **Cloud Sync in screen tests** — `App(relay=True)` starts a **local
  relay** (`rw.LocalRelay`: Cloudflare's own emulator, `wrangler dev --local`, running relay-worker.js with an empty
  store made for the run and deleted after; the test page's address allowed for that run only, wrangler.toml untouched;
  stopped by its exact process tree), points the app at it and gives the fresh profile a made-up test channel (planted at
  run time — never in a data file). `app.upload_fetch(items)` sends books as the library fetcher does;
  `app.import_from_relay()` runs File → Import from Relay. First use: `IMPORT-001`–`005`
  (`test/ui/test_import_from_relay.py`), whose `IMPORT-004` reproduces the Import's false "repair" (LOGGING.md F5)
  before its fix. Adds ~5 s to a run. Known noise gained one entry: a new, empty channel's two "not found" answers.
- **Built 2026-11-12 (branch `tooling/relay-tests-own-relay`):** tier 3 starts and stops its own local relay
  (`tools/local_relay.py`; §4) — no more skipping without `--relay-url`, and no more hand-stopped relays: on 2026-11-11
  ending the shell that started one left workerd and three node processes serving its port (7.28.0 post-mortem).
  `RUN-016`–`021` prove it with a stand-in relay: the files get its address; the relay AND its child are gone after and
  the port free; one that never says "ready" fails loud and is stopped; a child that escaped the tree and still holds
  the port is named by id; `--relay-url` still starts nothing; the real command is wrangler's local emulator.
- **Built 2026-11-12 (branch `tooling/release-fails-on-skip`):** `--release` (§4) — a skipped file fails a release
  run; `RUN-022`–`024` (fails it naming file and why; without the flag a skip still passes, as before; with nothing
  skipped the flag passes).
- From then on, every task follows §6.
