---
name: readerwrangler-project
description: Project-specific context including architecture patterns, common pitfalls, file locations, and pending tasks for ReaderWrangler - a single-page React application for organizing ebook collections
---

# ReaderWrangler Project

## Project Context

**What it is:** Single-page React application for organizing ebook collections using drag-and-drop columns (like Trello). Users can load their ebook library from a JSON export (currently supports Amazon Kindle) and organize books into custom categories.

**Current Version:** v3.5.0.a (in development)

**Files:**
- `readerwrangler.html` - Main SPA (React + Tailwind CSS + IndexedDB)
- `bookmarklet-nav-hub.js` - Navigation hub dialog (loaded by bookmarklet)
- `install-bookmarklet.html` - Bookmarklet installer page (environment-aware)
- `index.html` - Landing page
- `CHANGELOG.md` - Detailed version history with Technical Notes
- `TODO.md` - Pending tasks and improvements
- `images/` - Status icons (busy.png, empty.png, fresh.png, stale.png, question-mark.png)
- User's library JSON file (not in git) - Contains full book data

## Tech Stack

- **Frontend:** React 18 (via CDN), Tailwind CSS (via CDN), Babel (via CDN)
- **Storage:** IndexedDB for book data, localStorage for UI state/settings
- **File Format:** Single HTML file (no build process)
- **Status Monitoring:** Polls manifest file every 60s to detect new books

## Key Architecture Patterns

### 1. Version Management
- Version defined in ONE place: `APP_VERSION` constant (line ~3)
- Browser title set dynamically: `document.title = \`ReaderWrangler ${APP_VERSION}\``
- No need to update title tag manually

### 2. Data Flow
- User loads library → Parse JSON → Store in IndexedDB
- UI state (columns, book positions) → localStorage
- Manifest polling → Compare totalBooks vs loaded books → Update status

### 3. Status Icons
- Pre-load ALL 5 icons in DOM simultaneously
- Toggle visibility with CSS `display: none/inline-block`
- NEVER change `src` attribute (causes 30-60s browser loading lag)
- See CHANGELOG Technical Notes for failed approaches

### 4. Terminology
- Use "load" not "sync" (user loads files, not syncing with service)
- "Library loaded" not "Last synced"
- "Load Updated Library" not "Sync Now"

## Common Pitfalls (See CHANGELOG Technical Notes)

### 1. Icon Display Lag
- ❌ Changing `src` attribute causes 30-60s lag
- ❌ Using `key` prop causes blank icon during mount/unmount
- ❌ Cache-busting on image src doesn't help
- ✅ Pre-load all icons, toggle CSS display property

### 2. Manifest Caching
- ❌ Browser caches manifest.json aggressively
- ✅ Use cache-busting query param: `amazon-manifest.json?t=${Date.now()}`
- ✅ Clear `manifestData` state in `clearEverything()`

### 3. Ground Rule Violations
- ❌ Implementing during discussion ("should we?" is NOT approval)
- ❌ Forgetting to increment version letter before changes
- ❌ Making git operations without asking first

## File Locations

- Version constant: `amazon-organizer.js` line ~3
- Status icon rendering: `amazon-organizer.js` line ~1258-1302
- Manifest fetch with cache-busting: `amazon-organizer.js` line ~254
- Clear everything function: `amazon-organizer.js` line ~683

## Git Remote Workflow (Dev/Prod Pattern)

_Consider copying this pattern to other GitHub Pages projects_

**Remotes:**
- `dev` → readerwranglerdev repo (testing on GitHub Pages)
- `prod` → readerwrangler repo (production)
- No `origin` remote exists (prevents accidental pushes)

**Safety Design:**
- `git push` without specifying remote will **fail** (no default)
- Must explicitly choose: `git push dev main` or `git push prod main`

**Workflow Rules:**
- **Default push target: DEV** (`git push dev main`)
- **NEVER push to prod without explicit approval**
- "Proceed with push" = push to DEV only
- "Release to production" or "push to prod" = push to PROD
- After pushing to DEV, wait for GitHub Pages to deploy (~1-5 min), then test

**Approval Language:**
- "push" or "proceed with push" → `git push dev main`
- "release to production" or "push to prod" → `git push prod main`
- "release" alone → Clarify which target

**Testing Flow:**
1. Make changes locally
2. Commit
3. `git push dev main` → test on ron-l.github.io/readerwranglerdev
4. When stable: `git push prod main` → live on readerwrangler.com

## Three-Environment Testing

**Environments:**
| Environment | URL | Bookmarklet | Use Case |
|-------------|-----|-------------|----------|
| LOCAL | localhost:8000 | ⚠️ LOCAL (orange) | Rapid iteration, instant feedback |
| DEV | ron-l.github.io/readerwranglerdev | 🔧 DEV (blue) | Test GitHub Pages deployment |
| PROD | readerwrangler.com | 📚 ReaderWrangler (purple) | Production users |

**Bookmarklet Behavior:**
- LOCAL bookmarklet → loads from localhost:8000
- DEV bookmarklet → loads from readerwranglerdev repo
- PROD bookmarklet → loads from readerwrangler.com (or github.io fallback)

**Why three bookmarklets?**
Bookmarklets run on Amazon.com, not our servers. They can't detect if you're a developer. Solution: Install all three from localhost installer, then choose which environment to test.

**Testing workflow:**
1. Start local server: `python -m http.server 8000`
2. Visit localhost:8000/install-bookmarklet.html (shows all 3)
3. Drag bookmarklets to toolbar
4. On Amazon, click appropriate bookmarklet to test that environment

## Pending Tasks (from TODO.md)

1. Search improvements (partially done in v3.1.0.a, uncommitted)
2. Add Column UX redesign (follows Windows File Explorer pattern)
