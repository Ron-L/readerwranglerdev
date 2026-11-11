# ReaderWrangler — Project-Specific Rules

> **Generic dev ground rules live in `../CLAUDE.md`** (the Projects root), auto-loaded *before* this
> file. This file holds only what's specific to ReaderWrangler — mechanics, file names, remotes, and
> its concrete checklists. Don't restate the generic rules here; add RW specifics and let the
> Projects-root file carry the rest. RW's distilled laws + war-stories: **`docs/PRINCIPLES.md`**.

**Rule 0 — this is a retirement project, not a commercial product. There is no MVP.** Get it right before announcing
it; never trade quality for speed to launch (Ron, 2026-10-21).

---

## New dialog/modal/popup → build it on the overlay primitive (RW mechanism)

**Every new dialog, modal, menu or popup is built with `<Dialog>` (modal) or `<Popover>` (menu/popup;
add `fence` if it must block library keys; `anchorRef` for a button dropdown).** Esc (innermost-first,
consumed), the ✕ / backdrop / outside-click dismissal, the keystroke + undo fence, and stacking are then
STRUCTURAL — the overlay self-registers in `overlayRegistry.js`. **Never hand-roll a scrim, an Esc
listener, or a fence flag.** The imperative `showConfirmDialog`-style boxes (confirm / info / input / choice /
delete-warning / progress) keep their hand-built look but are layers in the SAME stack (since 7.18.0-alpha.68):
Esc, ✕, background click (press must start on it) and the fence come from their shared chrome
**`attachDialogDismiss`** (the progress box calls `pushLayer` + `onBackdropClick` itself). They register
**`detached: true`** — a box opened from a menu item sits above that menu and must survive the menu closing
(alpha.69). A new imperative box MUST go through `attachDialogDismiss`; better, build it as a `<Dialog>`
(rebuilding these as `<Dialog>`s is a low-priority TODO). `imperativeDialogsUp()` still detects them by DOM class.
**Popup buttons:** every button that opens a popup spreads **`{...popupTrigger(isOpen)}`** (optionally
`popupTrigger(isOpen, 'listbox' | 'dialog')`) — one bundle carrying the `data-popover-trigger` marker (a click on it
while ANY other popup is open switches in ONE click instead of the usual "an outside click only closes") plus the
accessibility pair (aria-haspopup / aria-expanded). Never hand-write those attributes. Ron, 2026-10-07/08; a dev-server
console warning flags an anchored popup whose button lacks it.

(History: earned 2026-09-16 when the Share dialog shipped with only Cancel+backdrop. The old hand-run
4-step checklist — register in `anyDialogOpen`, add to `handleModalEsc`, ✕, backdrop — was retired in
7.18.0-alpha.43 when both of those lists were deleted; design of record:
`docs/design/DIALOG-DISMISSAL-AUDIT.md`.)

---

## RW terminology & copy

* Backup terminology: **"Save/Restore"**, not "Import/Export".
* **"Toast"** = small floating text near the status bar, not an overlay dialog.
* Sync vocabulary exposed to users: **Relay, Credentials, Channel ID, Passphrase, bookmarklet,
  Import from Relay, Download Library/Collections, Data Status** — mirror these exact words on their named
  surfaces (don't invent "Cloud Storage"). Plain "cloud" is fine in ordinary prose ("syncs through the cloud") — the
  2026-08-28 vocabulary rule (7.0.1–7.4.0 PM). Pre-launch, these names become "Cloud Sync" and one "Cloud Sync Key" (TODO:
  "Cloud Sync: rename Relay, show one Cloud Sync Key…"; decided in docs/design/CLOUD-SYNC-NAMING.md) — update this rule
  when that ships.

---

## Versioning — RW's constants

Follows the generic semver+alpha rules in `../CLAUDE.md`. RW's specific stamps:

- **ORGANIZER_VERSION** (`readerwrangler.js`) — bump in the same commit as each alpha iteration.
- **APP_VERSION** (`readerwrangler.html`) — the cache-buster; updated at release. Defined ONCE in
  HTML, read by JS via query param (no duplication). Does NOT bump during alphas (test alphas
  locally via http.server, never against readerwrangler.com).
- **MOBILE_VERSION** (`mobile.js`) — own X.Y.Z scheme, but any alpha commit that modifies mobile.js
  appends the SAME `-alpha.N` suffix as that commit's ORGANIZER_VERSION. Drop the suffix at release.
- **WORKER_VERSION** (`relay/relay-worker.js`) — the relay worker's own stamp, same X.Y.Z-alpha.N scheme; printed in
  every relay email so an email shows which deploy sent it. Bump with every worker change (the version-guard enforces it).
- **CSS cache-buster** (`readerwrangler.html`): `readerwrangler.css?v=X.Y.Z` must match
  ORGANIZER_VERSION on every commit that modifies `readerwrangler.css`.
- **index.html** Schema.org `softwareVersion` — update to match APP_VERSION at release.
- **COPYRIGHT_YEARS** (`readerwrangler.html`) — every year the code changed, as a list: `"2025, 2026"` (About shows it
  as is). A list, not a range — a skipped year isn't claimed. The version-guard refuses the first shipped-code commit
  of a new year until that year is appended, so the claim grows only when the code does (Ron, 2026-10-16).

---

## Release Checklist (RW-specific — the generic discipline is in `../CLAUDE.md`)

- `git add` specific files only.
- `grep -rn "TODO" *.js *.html`.
- Drop the pre-release suffix from all file versions; update **APP_VERSION** and index.html
  **softwareVersion**.
- Update **CHANGELOG.md** (Ron's "word" on the copy first), **README.md** (and its mirror index.html)
  "Recent Features" / "Coming Soon"; **sync those two lists into features.html**.
- Re-align "Coming Soon" with the actual TODO priorities (public promises track the real queue).
- **Sweep support-shaped material** into `docs/design/SUPPORT-KB.md` (facts/fixes) and
  `WORKFLOW-PATTERNS.md` (usage patterns). The sweep is a COMB: grep the KB for every term the
  release touched (renamed labels, changed behaviors, new UI) and update each hit; bump the KB's
  "up to date as of" stamp.
- **Tests** (docs/design/TESTING.md): every tier passes; every task in the release has promoted its tests and filed its
  gaps; the post-mortem names any bug no test would have caught — and that test gets written.
- **TODO.md**: delete every ✅ section (done tasks — now recorded in CHANGELOG) — TODO is future-only.
- **Backlog report:** run `py tools/backlog_report.py` (after the ✅ sweep is committed) and republish its page — where
  the backlog is on its hump, arrivals vs completions, the launch-scope burn-down (Ron, 2026-10-21).
- (Then the generic: PM always → update PRINCIPLES.md + memory, per `../CLAUDE.md`.)

---

## Git Workflow — RW specifics

Follows the always-branch → squash → tag `vX.Y.Z` → keep-branch pattern in `../CLAUDE.md`. RW's
particulars:

- **Remotes:** `dev` (testing) / `prod` (production) — no `origin`.
- **Bookmarklet changes that differ per environment** (anything tied to the repo address — what the LOCAL, DEV and
  PROD bookmarklets do differently): Dev first → test on GitHub Pages → then Prod. A change that's the same for all
  three (e.g. a fetcher fix, tested with the LOCAL bookmarklet) goes to dev and prod together (Ron, 2026-10-16).
  Otherwise, don't push to dev for routine local testing (test locally first).

| User says | Do |
|-----------|-----|
| "push" or "proceed" | Ask: navigator changes or ready to share? |
| "push to prod" | Squash-merge to main, tag `vX.Y.Z`, then `git push prod main --tags` **and** `git push dev main --tags` — prod always means dev too, don't ask (Ron 2026-10-08) (keep the branch) |
| "release" | Clarify which |

---

## RW session tooling (`.claude/`, saved in the repo; only `settings.local.json` is gitignored)

- **Pre-build gate** — a `PreToolUse` hook (`.claude/hooks/gate-check.py`) denies the first edit of shipped
  code each turn — **any `.js` at the repo root, plus `relay/relay-worker.js`** (a rule, so new modules are covered;
  widened 2026-10-08 from just readerwrangler.js/mobile.js) — with a checklist (mechanism, not memory). Consider it, then
  re-send EVERY app edit from that batch (the whole batch is refused; PostToolBatch clears it for the next one).
  `Stop`/`SessionStart` re-arm it per turn. The checklist is the **single source** in
  `docs/PRINCIPLES.md` (the `GATE-CHECKLIST` block); the hook just pulls + prints it and **fails LOUD** if
  it can't reach it. Full local tooling + the pattern: **`docs/design/SESSION-TOOLING.md`**.
- **`/sitemap`** (`.claude/commands/sitemap.md`) — mechanizes the class-of-sites comb.
- **Timestamp stamp hook is GLOBAL, not RW-local** — it is `C:/Users/Ron/Projects/stamp.py`, wired in
  `~/.claude/settings.json` (`UserPromptSubmit`), injecting the live time each turn for **all** projects.
  See the Projects-root **`CLAUDE-TOOLING.md`**. (Corrected 2026-09-30 — the old `.claude/hooks/stamp.py`
  path was wrong and cost a chase; its absence there is *not* a sign it's missing.)

## Commit checks (`git-hooks/` — run BY GIT, saved in the repo)

Every check runs from **`git-hooks/pre-commit`**. One-time setup per copy of the project:
**`git config core.hooksPath git-hooks`** (moved here from the unsaved `.git/hooks` + `.claude/hooks` on 2026-10-15).
Bypass (Ron's call only): `git commit --no-verify`.

- **Version-guard** (`git-hooks/version-guard.py`) refuses a commit that stages shipped code without moving its
  version stamp — and a release commit (one that moves `APP_VERSION`) unless the help notes' stamp
  (`docs/design/SUPPORT-KB.md`) says "through release <that version>" (2026-10-20).
- **Name check** (`git-hooks/check-names.js`), whenever a `.js`/`.html`
  is staged: refuses app code that uses a name nothing defines (a syntax check can't see that — 7.18.0-alpha.55's
  "shareBtnRef is not defined" crash), and any `readerwrangler.html` inline script that doesn't parse. Page-level
  names are derived from `readerwrangler.html`'s scripts, so new modules need no upkeep. Needs
  `npm i --no-save @babel/core @babel/preset-react` (fails loud if missing).
- **Shared-numbers check** (`git-hooks/check-shared-numbers.js`), when `relay-client.js` or `relay/relay-worker.js` is
  staged: refuses a commit where the app and the worker disagree on the 90-day upload life, keep-2, the unfinished-copy
  grace, or the id-time format — the worker's nightly cleanup deletes by those rules (7.23.0; decided Ron 2026-10-14).
- **Private-values check** (`git-hooks/check-private.py` + `git-hooks/commit-msg`, one shared check
  `git-hooks/private_values.py`), on every commit: refuses added lines or a commit message holding a value from the
  private secrets note, and Cloud Sync credentials by their shape — a `.json` with `relay.channelId` + `passphrase` (a
  backup, or a demo file made from one), a pasted bookmarklet, the Copy text's passphrase. Names where, never prints a
  value. `python git-hooks/private_values.py --list` shows what it refuses (masked); `--scan-history` scans every
  commit (2026-10-31: one find — the organized demo library carried a credential pair from 2026-07-03; revoked on both
  relays and removed).
- **Parse check** (`git-hooks/check-parse.py` → `parse-js.js`), whenever a `.js`/`.mjs`/`.py` is staged: refuses a staged
  script that doesn't parse — the fetchers, the bookmarklet menu, the relay worker and every Python file included
  (2026-11-04; tests: `test/test_check_parse.py`).
- **Tier-1 tests for what changed** (`tools/run_tests.py --changed`, pre-commit step 7): the function tests whose
  `covers:` header names a changed file run on every commit; silent when none apply. The whole library:
  `py tools/run_tests.py --tier all` (docs/design/TESTING.md).
- **Logging rules + the message-code table** (`tools/message_codes.py --check`, pre-commit step 8), when an app script
  or the table is staged: every `rwLog.log(level, code, text…)` call has a known level, a code `AREA` or `AREA-NN` from
  logger.js's areas, a numbered code for warning and above, each numbered code at ONE call — and
  `docs/design/MESSAGE-CODES.md` (generated, never edited) matches the code. Fix: `py tools/message_codes.py` and stage
  the table (2026-11-07; docs/design/LOGGING.md §6). It also refuses a direct `showToast(` (a toast is
  `rwLog.log(…, { toast: true })`, so it reaches the log with its area) and a dialog call without its area FIRST
  (`showInfoDialog('BACKUP', title, message)` — the dialog logs what it showed there) (2026-11-09).
- **TODO table-of-contents check** (`git-hooks/check-toc.js`), when
  `TODO.md` is staged: refuses a table of contents that doesn't match the headers. The table is built by the VS Code
  extension "Auto Markdown TOC" only on a VS Code save — edits made any other way leave it stale. Fix: Ron saves the
  file in VS Code, or Claude corrects the listed entries. TODO format: one header per task (plain words, ~80 chars,
  132 max), a "why it matters" first line, ✅ in front when done (Ron, 2026-10-14), 🚧 in front while in progress —
  kept at the top of its section, after any ✅ ones (Ron, 2026-10-15). **Every task has an ID line right under its
  header** — `<!-- id YYYYMMDD-HHMM -->`, the time it was filed (the stamp hook's time; a letter suffix only when that
  minute is taken) — and a task that absorbs others lists them: `<!-- id … ; merged <id>, <id> -->`. The same check
  refuses a missing or repeated ID; `tools/backlog_report.py` follows tasks by them (Ron, 2026-10-21).
- **The built app** (`tools/build.py --check-staged`, pre-commit step 9; 7.27.0): the page loads `dist/readerwrangler.js`
  and `dist/mobile.js`, compiled ahead of time by `tools/build.py` (Babel 7.29.7 pinned in `tools/build/`; once:
  `cd tools/build && npm ci`), and the app, reset and security pages link `dist/tailwind.css` — the styles built from every
  tracked root page and script (Tailwind 3.4.17, what the in-browser builder served). When a source, a page, a script or a
  built copy is staged, the staged copy must be exactly the build of the staged files. `serve.py` rebuilds on demand, so
  the local loop is still edit → refresh. **Never edit `dist/`.** A changed `dist/tailwind.css` moves its `?v=` stamp in
  every page that links it (the version guard reads the pages).
  Load time: `.venv\Scripts\python tools/time_load.py [--large]` (was ~50 s; 0.7 s to the app, 1.3 s to 3,270 books).
- **No task leaves TODO.md silently** (`git-hooks/check-removed-tasks.py`, from `git-hooks/commit-msg` — it needs the
  message): a commit that removes a task must show why — it had a ✅, another task lists it as merged
  (`<!-- id … ; merged <id> -->`), or the message says **`done <id>`** (finished, shipped without a ✅ — the backlog
  report counts it done) or **`dropped <id>`** (and why). Squash and merge commits are skipped (each branch commit was
  checked). Earned 2026-11-10: a task filed 11-02 was deleted by accident 27 minutes later inside a big TODO edit.
  The backlog report also finds a task's ✅ on any branch (squashes hide it from main).

---

## Reference

**Folders:** `docs/design/`, `post-mortems/`. **Notes — check before fetcher changes:** `Amazon-Reference.md`
(library), `AMAZON-AUTHOR-PAGES.md` (author pages / bibliography fetcher) and the **TODO notes** (details behind TODO
tasks). That kind of detail goes in those notes, not in this repo's files (Ron, 2026-10-16/20).

**`docs/PRINCIPLES.md`** — the distilled laws from all RW post-mortems (with enforcements). Consult
when debugging stalls, before refactors/releases, and when a lesson feels familiar. New principles
land there same-day via the post-mortem → memory step.

**No version increment:** README, CHANGELOG, TODO, `*.md` docs, `.bat` files.
