# Contributing to ReaderWrangler

This guide is for people working **on** ReaderWrangler: how the pieces fit, how to run and test a local copy, and how
we work. **Using** ReaderWrangler? Start with [README.md](README.md) and the [User Guide](USER-GUIDE.md).

_Rewritten 2026-10-15 — the previous version still described the pre-6.0.0 download-a-file flow and the retired
Claude Skills files._

---

## What ReaderWrangler is

A browser app for organizing an Amazon Kindle library: folders, Book Lists, saved Searches, tags, price goals, a phone
view.

1. **The app** — [readerwrangler.html](readerwrangler.html) loads the desktop app (`readerwrangler.js`) or, on a
   phone-width screen, the phone app (`mobile.js`). Your library lives **in your browser** (books in IndexedDB,
   organization in browser storage).
2. **The bookmarklet fetchers** — small scripts that run **on Amazon's pages** (your library, collections, wishlist,
   an author's bibliography, a series page) and read what's there.
3. **The relay** — a Cloudflare worker (`relay/`) that carries data between the fetchers, the desktop app and the
   phone. Everything is **encrypted in your browser** before it's sent; the relay only stores ciphertext.

Data flow: bookmarklet on Amazon → relay → **File → Import from Relay** in the app; the desktop sends your
organization back through the relay for the phone to read.

---

## Where it runs

1. **Production:** https://readerwrangler.com (the same site as https://ron-l.github.io/readerwrangler/).
2. **Dev site:** https://ron-l.github.io/readerwranglerdev/ — for testing; it runs changes before production does.
3. **Your local copy:** http://localhost:8000 (see "Getting set up").

Each has its own relay: production uses the production relay; the dev site and a local copy in contributor mode use
the **dev** relay, so testing never touches real data.

---

## Getting set up

### 1. Clone (with its submodule), then turn on the commit checks (one time)

```bash
git clone --recurse-submodules <repo-url>
cd <the cloned folder>
git config core.hooksPath git-hooks
```

`--recurse-submodules` also fetches **`pytools/`** — small shared Python helpers that live in their own repo
(https://github.com/Ron-L/pytools) and are used here as a git submodule (`serve.py` uses its `keepopen`). Already
cloned without it? Run `git submodule update --init` in the project folder. To pick up a newer pytools later:
`git submodule update --remote pytools`, then commit the new pointer.

From then on, git runs these checks on every commit and refuses the commit if one fails. The checks live in
`git-hooks/` — each script explains itself at the top; this list is only a summary:

1. **Version stamps** (`version-guard.py`) — a change to the app, the phone app, the relay worker, a shared module or
   the stylesheet must also move its version number (otherwise the browser keeps serving the old copy). A release
   (a new `APP_VERSION`) must also update the help notes' "up to date … through release X.Y.Z" line in
   `docs/design/SUPPORT-KB.md` — after sweeping them for that release.
2. **Undefined names** (`check-names.js`) — refuses app code that uses a name nothing defines (a mistake a syntax
   check can't see). Needs `npm i --no-save @babel/core @babel/preset-react` once.
3. **Numbers the app and the relay share** (`check-shared-numbers.js`) — `relay-client.js` and `relay/relay-worker.js`
   must agree on how long uploads live, how many saved copies to keep, the grace for an unfinished copy, and how a
   time is read out of an id (the relay's nightly cleanup deletes by those rules).
4. **TODO table of contents** (`check-toc.js`) — TODO.md's table of contents must match its headers, and every task
   needs its ID line (`<!-- id YYYYMMDD-HHMM -->`) right under its header.
5. **The built app** (`tools/build.py --check-staged`) — the pages load the app and its styles built ahead of time
   (`dist/`); a commit that changes `readerwrangler.js`, `mobile.js` or a page's or script's style classes must carry the
   matching build in `dist/` (run `py tools/build.py`).

To skip the checks for one deliberate commit: `git commit --no-verify`.

**The build tools, once** (Node.js needed): `cd tools/build && npm ci` — the pinned compiler (Babel 7.29.7) that turns
`readerwrangler.js` and `mobile.js` into the plain scripts in `dist/`, and the pinned Tailwind (3.4.17) that builds
`dist/tailwind.css`. The pages used to do both in the browser on every load (~50 seconds); built ahead of time, the app
opens in under a second.

### 2. Start the local server

The app must be served over `http://` — browsers block much of what it does on a `file://` page.

- **Run `serve.py`** in the project folder: `py serve.py` (Windows) or `python serve.py`. It opens a window running
  the server at http://localhost:8000; close the window (or press Ctrl+C) to stop it.
- **Windows, double-click:** if `.py` files are set to open with Python (right-click a `.py` → Open with → Python →
  Always), double-clicking `serve.py` starts it. To start it automatically at logon, put a shortcut to `serve.py` in
  your Startup folder (Win+R → `shell:startup`).

`serve.py` is Python's standard web server, except that it serves **only what the real site serves** (production
publishes exactly the files in git and never lists folders). It refuses:

1. anything inside a folder (or any file) whose name starts with a dot — `.git`, `.claude`, …;
2. anything git ignores — e.g. your backups (`readerwrangler-backup-*.json`), which hold your relay credentials;
3. folder listings.

Refused paths get a plain "not found" (each is logged as REFUSED in the server window). It still listens on the whole
home network on purpose — that's how a phone tests your local copy — which is exactly why it must not hand out anything
the real site doesn't serve (e.g. the directories beginning with a dot, git-ignored files, etc.). It needs git installed (it asks git what's ignored).

It also **builds on demand**: edit `readerwrangler.js`, `mobile.js` or any page or script and just refresh — the server
rebuilds what changed in `dist/` first (a few seconds; logged as "built"). If your edit doesn't compile, the page's error
screen shows the compiler's message (a style build that fails shows a red line across the top of the page).

Then open http://localhost:8000/readerwrangler.html.

### 3. Turn on contributor mode (once per browser)

A local copy behaves like the real site by default — that's right for anyone who simply self-hosts. For developer
behavior, open the app once with:

```
http://localhost:8000/readerwrangler.html?contributor=on
```

The setting is saved in that browser (for that address and port) and the `?contributor=on` disappears from the
address bar. `?contributor=off` turns it off. It only works on a local server — readerwrangler.com and the dev site
ignore it. A phone needs it only if it opens the app from your PC's server.

**Contributor mode means:** the app uses the **dev relay** (separate from production data); Relay Setup offers the
LOCAL and DEV bookmarklets (both send to the dev relay); developer self-check popups are on; usage statistics are
labeled `dev-` so they don't count as real use.

**The badge is your check.** With contributor mode on, the header shows **LOCAL · CONTRIBUTOR** in orange (and the
tab title says "local · contributor"). Plain **LOCAL** means it's off — you're behaving like a self-hoster.

**If the flag is ever lost** (cleared browser data, a different browser or port), symptoms: the badge loses
"CONTRIBUTOR"; fetches from the LOCAL/DEV bookmarklets seem to vanish (they still go to the dev relay, but the app
now reads production) — Import says nothing new; Import shows production data instead of your dev test data; local
test changes and test Restores sync to the **production** relay; Relay Setup shows production storage; the phone
pairing code points at readerwrangler.com; developer self-check popups go silent. Fix: open once with
`?contributor=on`.

### 4. Get the bookmarklets

Open **File → Relay Setup** in the app and drag the bookmarklet(s) it offers to your bookmarks bar. In contributor
mode it offers:

1. **LOCAL** — loads the fetcher code from your `localhost:8000` (always fresh): test your own fetcher changes.
2. **DEV** — loads it from the dev site: test what's been pushed there.

Why more than one? A bookmarklet runs **on Amazon's page**, so it can't tell which copy of ReaderWrangler you mean —
each bookmarklet is fixed to one source. Both send to the **dev** relay.

---

## Testing

### Three places to test

1. **Locally (most work):** change code → reload http://localhost:8000 → test. Use the LOCAL bookmarklet on Amazon.
2. **The dev site:** `git push dev main` → wait 1–5 minutes for GitHub Pages → test at the dev site (use the DEV
   bookmarklet; hard-refresh with Ctrl+Shift+R if you see old code). **Changes to the bookmarklet or its navigation
   go here first**, before production.
3. **Production:** only at release (see "How we work").

### Unit tests

```bash
node test/bookMerge.test.js
node test/bookFields.test.js
node test/datePresets.test.js
node test/organizeEngine.test.js
node test/overlayRegistry.test.js
```

---

## The codebase

### Key documents

1. [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md) — system design, data flow, version management.
2. [docs/reference/DATA-SCHEMA.md](docs/reference/DATA-SCHEMA.md) — the book record and its fields.
3. [docs/reference/SECURITY.md](docs/reference/SECURITY.md) — encryption, the relay's trust model, credentials.
4. [docs/PRINCIPLES.md](docs/PRINCIPLES.md) — the distilled lessons from every post-mortem. Read before big changes.
5. `docs/design/` — design documents for individual features (decisions and their reasons).
6. [CHANGELOG.md](CHANGELOG.md) (what shipped) · [TODO.md](TODO.md) (what's next) · `post-mortems/` (what we learned).

### Files

**The app**
- `readerwrangler.html` — the page; its startup script answers "where am I running?" once (local server, dev site,
  contributor mode) before any app code loads.
- `readerwrangler.js` — the desktop app (React, compiled in the browser). `readerwrangler.css` — styles.
- `mobile.js` — the phone app (loaded on phone-width screens).
- Shared modules loaded by the page: `uiHelpers.js`, `bookFields.js` (the one table of book fields), `bookMerge.js`
  (how Import merges), `storage.js`, `overlayRegistry.js` (dialogs and menus), `integrity.js`, `organizeEngine.js`
  (Auto-Organize), `relay-crypto.js`, `relay-compress.js`, `relay-client.js`.

**On Amazon's pages**
- `bookmarklet-nav-hub.js` — the menu the bookmarklet opens.
- `amazon-library-fetcher.js`, `amazon-collections-fetcher.js`, `amazon-wishlist-fetcher.js`,
  `author-bibliography-fetcher.js`, `series-page-fetcher.js` — the fetchers.

**The relay** — `relay/relay-worker.js` + `relay/wrangler.toml` (one worker, deployed twice: production and dev).

**Site pages** — `index.html` (landing), `features.html`, `tutorials.html`, `security.html`, `changelog.html`.

**Development** — `git-hooks/` (the commit checks), `test/` (unit tests), `serve.py` (the local server), `pytools/` (shared Python helpers — a git submodule), `.claude/` (Claude Code settings, hooks and commands — see below), `readerwrangler.code-workspace` (VS Code).

### Sensitive files

- **Backups** (`readerwrangler-backup-*.json`) contain your relay credentials; `.gitignore` keeps them out of git.

---

## How we work

The full rules live in **[CLAUDE.md](CLAUDE.md)** (this project's specifics) and in the maintainer's cross-project
rules (outside this repo). The essentials:

1. **Versions:** `X.Y.Z` with a test suffix — start work at `X.Y+1.0-alpha.1`, bump `-alpha.N` for each test build,
   drop the suffix at release. Every runtime change moves its version stamp (the commit check enforces it).
2. **Branches:** app changes go on a `feature/…` or `fix/…` branch; documentation-only changes may go straight to `main`.
3. **Release:** squash-merge the branch into `main` as **one** commit, tag `vX.Y.Z`, push to **both** remotes
   (`git push prod main --tags` and `git push dev main --tags`), and **keep the branch** (its alpha commits are the
   history). Then a post-mortem.
4. **Remotes:** `dev` and `prod` — deliberately **no `origin`**, so every push has to name where it goes.
5. **TODO.md:** one header per task in plain words, a "why it matters" line, ✅ when done; done tasks are deleted at
   release (after CHANGELOG records them).
6. **Build solid, not fast.** This app holds people's libraries — their purchases, organization and reading history,
   kept for years. Anything that touches data correctness (loss, corruption, wrong merges, silent failures) gets the
   careful treatment: understand it fully, fix the cause, add a check or test so it can't come back. Cosmetic polish
   can move fast. Investigations that wander but leave behind fixed bugs, documented behavior or better checks are
   not wasted time.

---

## Working with Claude Code

ReaderWrangler is developed with Claude Code. What it relies on:

1. **[CLAUDE.md](CLAUDE.md)** — loaded automatically at the start of every session (with the maintainer's
   cross-project rules).
2. **`.claude/`** (saved in this repo) — `settings.json` wires the **pre-build checklist** (`hooks/gate-check.py`
   pauses Claude's first edit of app code each turn with a checklist drawn from `docs/PRINCIPLES.md`) and
   `commands/sitemap.md` (`/sitemap`, a method for finding every instance of something before changing it). Personal
   approvals go in `.claude/settings.local.json`, which isn't saved.
3. **[docs/design/SESSION-TOOLING.md](docs/design/SESSION-TOOLING.md)** — how the hooks and checks fit together, and
   the pattern behind them.
4. Claude's memory between sessions lives in the user's own Claude profile, outside this repo.

---

## Questions?

1. How things work: [docs/reference/ARCHITECTURE.md](docs/reference/ARCHITECTURE.md).
2. How we work: [CLAUDE.md](CLAUDE.md) and [docs/PRINCIPLES.md](docs/PRINCIPLES.md).
3. What's next: [TODO.md](TODO.md). What shipped: [CHANGELOG.md](CHANGELOG.md).
