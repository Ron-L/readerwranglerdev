# TODO

## Prioritized Roadmap (By Priority & Complexity)

_Based on user requirements + Claude.ai independent review (CLAUDE-AI-REVIEW.md)_

### 🔥 Priority 1: Critical Documentation & Onboarding (HIGH Priority, LOW-MEDIUM Complexity)

0. **🔧 Dev/Prod Dual-Repo Workflow** - HIGH/LOW (in progress)
   - Set up readerwranglerdev repo for testing changes on GitHub Pages without affecting production
   - Three bookmarklets: LOCAL (localhost), DEV (readerwranglerdev), PROD (readerwrangler.com)
   - Enables testing bookmarklet-nav-hub.js and install pages before pushing to production
   - Status: Step 0 complete (installer pages updated), Step 1 pending (create GitHub repo)

1. **📖 Quick Start Video & Written Guide** - HIGH/LOW (2-4 hours)
   - **Production Plan**: See [VIDEO-PRODUCTION-PLAN.md](VIDEO-PRODUCTION-PLAN.md) for complete details
   - **TTS Service Selected**: Google Cloud Text-to-Speech (Journey voices, 1M chars/month free)
   - **Video Series Planned**: 6 short videos (2-4 minutes each) covering:
     1. Quick Start (2-3 min) - High priority, replaces 10-minute walkthrough
     2. Installing the Bookmarklet (1-2 min)
     3. Fetching Your Library (2-3 min)
     4. Fetching Collections (1-2 min)
     5. Organizing Your Books (3-4 min) - includes double-click detail view
     6. Advanced Features (2-3 min)
   - Written "First 5 Minutes" guide
   - Problem: Users bounce if forced to watch 10-minute video; missing double-click feature demo
   - Impact: Reduces onboarding friction significantly; consistent voice across all videos

2. **📚 Comprehensive Documentation Hub** - HIGH/MEDIUM (8-12 hours)
   - Troubleshooting guide (What if scrape fails partway? How to recover?)
   - FAQ (Multiple Amazon accounts? Kindle Unlimited books? Mobile support?)
   - Keyboard shortcuts reference
   - Data management guide (backup, export, import, JSON format)
   - Technical details (How bookmarklet handles anti-scraping)
   - Problem: Users get stuck, have questions, can't find answers
   - Impact: Reduces support burden, improves user confidence

3. **📱 Mobile Support Clarity** - HIGH/LOW (1 hour)
   - Document whether app works on mobile devices
   - Add to FAQ and main page
   - Problem: Major omission for users who browse libraries on phones/tablets
   - Impact: Sets correct expectations

4. **📋 Changelog Visibility** - MEDIUM/LOW (30 minutes)
   - Link version display (e.g., "v3.6.0") to CHANGELOG.md
   - Problem: Users see version numbers but no context
   - Impact: Transparency about what changed

5. **✅ Fill in Missing Sections in USER-GUIDE.md** - MEDIUM/LOW (2-3 hours)
   - Complete placeholder sections
   - Add screenshots/examples
   - Problem: Partial documentation confuses users
   - Impact: Complete feature documentation

### 🎯 Priority 2: UX Polish & Error Handling (HIGH Priority, LOW-MEDIUM Complexity)

6. **⏱️ Enhanced Progress Feedback During Extraction** - HIGH/MEDIUM (4-6 hours)
   - Real-time progress bars ("Extracting book 847 of 2,322...")
   - Estimated time remaining ("~15 minutes for your library size")
   - Pause/resume capability for long extractions
   - Clear error messages with recovery options
   - Problem: Users get impatient/confused during lengthy initial extraction
   - Impact: Reduces abandonment during first-time setup
   - Note: Console already has progress, need UI overlay

7. **🔄 Extraction Error Recovery** - HIGH/MEDIUM (3-4 hours)
   - "Extraction interrupted. Click to resume from book 847."
   - Handle partial failures gracefully
   - Save extraction state to localStorage
   - Problem: Network issues or browser closes lose all progress
   - Impact: Prevents data loss, improves reliability

8. **🐛 Collections Filter Bug Fix** - HIGH/LOW (30m-1h)
   - Collections dropdown still shows old collection names after Clear Everything
   - Problem: UI state not fully cleared
   - Impact: Confusing UX after reset

8b. **🐛 Invalid File Selection Causes Status Timeout** - MEDIUM/LOW (30m-1h)
   - When user selects wrong JSON file in Load Library dialog, status check hangs
   - Eventually times out with "Library loaded but status check timed out" message
   - Problem: File picker error doesn't cancel the status check operation
   - Impact: Minor UX issue - confusing timeout instead of immediate error

9. **✨ UX Quick Wins** - MEDIUM/LOW (1-3 hours each)
   - Tooltips for control buttons (Backup, Restore, Reset, Clear)
   - First-run Welcome dialog explaining what ReaderWrangler is
   - Column name filtering (search by column name)
   - Title & author text under book covers
   - Make status dialog draggable/movable (modal → draggable)

### 🔍 Priority 3: Advanced Organization Features (MEDIUM Priority, MEDIUM Complexity)

10. **🔀 Column Sorting** - MEDIUM-HIGH/MEDIUM (4-6 hours)
    - Sort books within columns by: acquisitionDate, seriesPosition, rating, title, author
    - Permanent re-ordering (like Excel sort, persists to IndexedDB)
    - Multi-column selection: apply same sort to each column independently
    - Users can manually adjust positions after sorting (not locked)
    - Problem: After organizing books into columns, can't fine-tune order by meaningful criteria
    - Impact: Completes organization workflow - get books into columns, then order optimally within each

11. **🔎 Advanced Filtering** - MEDIUM/MEDIUM (6-8 hours)
    - Filter by genre/category
    - Filter by rating
    - Filter by acquisition date range
    - Filter by read/unread status (if available from Amazon)
    - Filter by series
    - Problem: Hard to find specific subsets in 2,300+ book library
    - Impact: Improves discoverability for power users

12. **🏷️ Color-Coding/Tagging System** - MEDIUM/MEDIUM (8-10 hours)
    - Visual distinction beyond columns
    - Tag-based organization
    - Problem: Columns alone may not capture all organizational needs
    - Impact: More flexible organization

13. **📚 Collections Integration - UI Features** - MEDIUM/MEDIUM (4-8 hours)
    - Visual indicators (badges/icons) for collections on book covers
    - Metadata display showing which collections each book belongs to
    - Filtering by collection name
    - Filtering by read status (READ/UNREAD/UNKNOWN)
    - "Uncollected" pseudo-collection
    - Status: Data merged ✅, UI incomplete
    - Problem: Collections data fetched but not visible in UI
    - Impact: Leverage existing Amazon collections in organizer

14. **📖 Enhanced Series Management** - MEDIUM/MEDIUM (6-10 hours)
    - Expand current "Collect Series Books" button
    - Automatic series detection
    - Series reading order visualization
    - Missing book detection ("You have books 1, 2, and 4 of this series")
    - Problem: Series books scattered across library
    - Impact: Better management for series readers

### 📊 Priority 4: Analytics & Export (MEDIUM Priority, LOW-MEDIUM Complexity)

15. **📈 Reading Stats Dashboard** - MEDIUM/MEDIUM (8-12 hours)
    - Books acquired by month/year
    - Genre distribution pie chart
    - Average rating of collection
    - "Time to read" estimates based on page counts
    - Problem: No insights into library composition
    - Impact: Interesting for users, helps rediscover forgotten books

16. **💾 Enhanced Export Options** - MEDIUM/LOW (2-4 hours)
    - Export organization to CSV (already has JSON)
    - Print-friendly reading list
    - Privacy-respecting share feature
    - Problem: Limited backup/sharing options
    - Impact: Portability and sharing

### 🔧 Priority 5: Technical Improvements (MEDIUM-LOW Priority, MEDIUM-HIGH Complexity)

17. **🔄 Phase 3 Retry Logic** - MEDIUM/HIGH (8-12 hours, optional)
    - Retry books with missing review data using same API
    - Progressive data completeness improvement
    - Expected improvement: 99.79% → 99.95%+ success rate
    - Problem: Some books randomly fail review fetch
    - Impact: Incremental data quality improvement

18. **🗂️ Nested Groups/Hierarchies** - LOW/HIGH (15-20 hours)
    - "Science Fiction" → "Space Opera" → "Culture Series"
    - Significant UI rework required
    - Problem: Flat column structure limits deep organization
    - Impact: Better for very large libraries (1000+ books)

19. **🤖 Smart Collections (Rule-Based)** - LOW/HIGH (12-16 hours)
    - "All unread books rated 4.5+"
    - Requires complex rule engine
    - Problem: Manual organization is tedious
    - Impact: Automation for power users

### 🌐 Priority 6: Integrations & Advanced Features (LOW Priority, HIGH-VERY HIGH Complexity)

20. **🔗 Third-Party Integrations** - LOW/HIGH (20-30 hours)
    - Goodreads sync (import ratings, mark as read)
    - StoryGraph integration
    - Export recommendations to Amazon wishlist
    - Problem: Complex API work, authentication, rate limits
    - Impact: Niche feature for users of these services

21. **☁️ Multi-Device Sync** - LOW/VERY HIGH (40-60 hours)
    - Cloud storage option (self-hosted or encrypted)
    - Sync organization across devices
    - Problem: Major architectural change, privacy implications
    - Impact: Convenience for multi-device users

22. **🧠 Smart Recommendations** - LOW/HIGH (30-40 hours)
    - "You own these similar books you haven't read yet"
    - "Others who loved [this book] also read [these books] from your library"
    - Highlight forgotten purchases based on high ratings
    - Problem: Requires recommendation engine, ML/AI complexity
    - Impact: Book discovery from existing library

---

## Current Priorities (Active Development)

_Subset of above roadmap currently being worked on_

### Status Bar Redesign (v3.7.0) - IN PROGRESS

**Goal**: Simplify status display with user-first urgency indicators based on Load state only

**Design Document**: [state-matrix.html](state-matrix.html) - Complete 25-state matrix with dialog mockups

---

#### CRITICAL DESIGN RATIONALE (2025-11-21)

**Design Decision: 25 States (Fetch × Load) with Graceful Degradation**

We use a 25-state matrix (5 Fetch statuses × 5 Load statuses) to provide rich status information. When Fetch state is unavailable (DB cleared, GUID mismatch), the system gracefully degrades to Load-state-only behavior.

---

#### Why Manifest Polling (Original Design) Was Broken

**Original Implementation:**
```javascript
// App polled manifest every 60 seconds
fetch(`amazon-manifest.json?t=${Date.now()}`)
```

**Fatal Flaw Discovered (2025-11-21):**
1. This is a **relative URL fetch** - resolves relative to where app is served
2. For **GitHub Pages users**: resolves to `https://ron-l.github.io/readerwrangler/amazon-manifest.json`
3. **Users can't write files to GitHub!** The manifest would need to be in the repo
4. Result: Fetch always fails (404), silently falls back to age-based staleness
5. **We never noticed** because localhost testing worked (manifest in served directory)

**The current manifest polling has been broken for all GitHub Pages users since launch.**

---

#### Why Manifest Must Live in IndexedDB (Not JSON File Polling)

**Option 1: Poll JSON manifest file** ❌ BROKEN
- Can't poll files on user's local disk (browser security)
- Can't poll GitHub-hosted files (users can't write to GitHub)
- Local dev masked this - worked on localhost, failed in production

**Option 2: Manifest only in library JSON file** ❌ LOSES FETCH STATE
- JSON file is self-describing (has `metadata.fetchDate`)
- But app can't know about unfetched files on disk
- No way to detect "you have a fresh file waiting"
- Would reduce to Load-state-only (5 states, not 25)

**Option 3: Fetcher writes manifest to IndexedDB** ✅ CHOSEN
- Fetcher runs on Amazon page, writes manifest directly to IndexedDB
- App reads IndexedDB to get Fetch state
- Works regardless of where app is hosted
- Requires GUID to match manifest to correct JSON file

---

#### Why GUID is Required

**Problem: Multiple JSON files, one DB**
1. User fetches Library A → manifest A written to DB
2. User fetches Library B → manifest B overwrites manifest A
3. User loads Library A → DB has manifest B, mismatch!

**Solution: GUID ties manifest to specific JSON file**
- Fetcher generates GUID, stores in:
  - JSON file: `metadata.guid`
  - IndexedDB: manifest record keyed by GUID
- On load: App checks if loaded JSON's GUID matches any DB manifest
- Match → use DB manifest for Fetch state
- No match → fallback to Load-state-only (graceful degradation)

---

#### The 25-State Matrix

**Per Data Type (Library, Collections):**

**Fetch Statuses** (from IndexedDB manifest):
| Status | Condition | Meaning |
|--------|-----------|---------|
| Unknown | No manifest in DB OR GUID mismatch | Can't determine fetch state |
| Empty | Manifest exists with no fetchDate | Never fetched (or DB cleared) |
| Fresh | fetchDate < 7 days | Recent fetch available |
| Stale | fetchDate 7-30 days | Fetch getting old |
| Obsolete | fetchDate > 30 days | Very old fetch |

**Load Statuses** (from loaded JSON's metadata):
| Status | Condition | Meaning |
|--------|-----------|---------|
| Unknown | No fetchDate in metadata | Legacy JSON file (pre-GUID) |
| Empty | No data loaded | App has no library data |
| Fresh | fetchDate < 7 days | Recently loaded data |
| Stale | fetchDate 7-30 days | Loaded data getting old |
| Obsolete | fetchDate > 30 days | Very old loaded data |

**Combined = 5 × 5 = 25 states** (see state-matrix.html for full table)

---

#### Urgency Icon Logic

**Status bar shows single urgency icon based on Load status (user-first design):**
- ✅ if Load is Fresh
- ⚠️ if Load is Stale
- ❓ if Load is Unknown (legacy file without fetchDate)
- 🛑 if Load is Empty or Obsolete

**Key insight:** "Urgency is based ONLY on Load status" because that's what affects the user's experience NOW. Fetch status is informational (shown in dialog).

**Combined urgency across Library + Collections:** worst-case wins

---

#### Graceful Degradation (Load-State-Only Fallback)

**When Fetch state is unavailable:**
| Situation | Fetch State | Behavior |
|-----------|-------------|----------|
| DB cleared (user hit Reset) | Unknown | Use Load state only |
| GUID mismatch (loaded different file) | Ignored | Use Load state only |
| First-time user | Unknown | Use Load state only |
| Legacy JSON (no GUID) | Unknown | Use Load state only |

**Fallback behavior:**
- App shows Load-state-based urgency icon
- Dialog shows "Fetch status unknown" for that data type
- User can still use app normally
- Suggests re-fetching to enable full status tracking

**This is acceptable because:**
- Load state alone gives user enough info to take action
- "Your data is 15 days old" is actionable without knowing Fetch state
- User who just ran bookmarklet knows they have a fresh file

---

#### Data Storage Architecture

**JSON Files (user's disk):**
```javascript
// amazon-library.json
{
  metadata: {
    guid: "abc123-...",           // NEW: ties to DB manifest
    fetchDate: "2025-11-21T...",  // When fetched
    totalBooks: 2322,
    schemaVersion: "3.0.0",
    accountId: "user@email.com"   // FUTURE: multi-user
  },
  books: [...]
}

// amazon-collections.json
{
  metadata: {
    guid: "def456-...",           // NEW: ties to DB manifest
    fetchDate: "2025-11-21T...",  // NEW: add this
    // ... other fields
  },
  books: [...]
}
```

**IndexedDB (browser storage):**
```javascript
// Manifest store - keyed by GUID
{
  guid: "abc123-...",
  type: "library",                // or "collections"
  fetchDate: "2025-11-21T...",
  totalBooks: 2322,
  accountId: "user@email.com"     // FUTURE: multi-user
}
```

---

#### Backward Compatibility

**Legacy JSON files (pre-GUID):**
- No `metadata.guid` field
- App can't match to DB manifest
- Falls back to Load-state-only
- Shows ❓ Unknown for Fetch state in dialog
- Dialog: "This file predates status tracking. Re-fetch to enable."

**No breaking changes** - old files work, just with degraded status display.

---

#### Implementation Tasks

**Phase 1: Add GUID + fetchDate to fetchers**
- [x] Generate GUID in library-fetcher.js, add to JSON metadata (v3.4.0.a)
- [ ] Generate GUID in collections-fetcher.js, add to JSON metadata
- [ ] Add `metadata.fetchDate` to Collections JSON (currently missing)

**Phase 2: Fetcher writes manifest to IndexedDB**
- [x] Library fetcher: write manifest to IndexedDB after generating JSON (v3.4.0.a)
- [ ] Collections fetcher: write manifest to IndexedDB after generating JSON
- [x] Use same IndexedDB database as organizer app (ReaderWranglerManifests)

**Phase 3: App reads from IndexedDB**
- [ ] On app load: read manifests from IndexedDB
- [ ] On JSON load: match GUID to find corresponding manifest
- [ ] Calculate Fetch state from manifest, Load state from JSON metadata
- [ ] Handle missing/mismatched GUID gracefully

**Phase 4: Remove old polling code**
- [ ] Delete `amazon-manifest.json` file generation
- [ ] Remove `checkManifest()` function and 60-second timer
- [ ] Remove `manifestData` React state
- [ ] Remove `MANIFEST_CHECK_INTERVAL` constant

**Phase 5: New status bar UI**
- [x] Remove version from status bar header (v3.7.0.o) - clarifies "Data Status:" is about data freshness, not app version
- [ ] Single-line: "Data Status: ✅" (or ⚠️ or 🛑 or ❓)
- [ ] Tooltip shows summary
- [ ] Click opens status dialog with full 25-state details

---

#### Groundwork for Multi-User (Optional, Future)

When we implement multi-user support:
- Add `accountId` to JSON metadata (email from GetPFMDetails API)
- Store `accountId` in IndexedDB manifest
- On load: warn if JSON's accountId doesn't match expected account
- See "Multi-User Design Notes" section below for full plan

---

### Other Active Items

1. 🐛 **Collections Filter Bug Fix** - 30m-1h
2. 📚 **Collections Integration - UI Features** - 4-8 hours
3. 🔄 **Phase 3 Retry Logic** - 8-12 hours (optional)
4. ✨ **UX Quick Wins** - 1-3 hours each

---

## In Progress

### Pending: Screenshot Capture
- [ ] **Organize library into column structure** (see TODO-PENDING-REVIEW.md for configuration guide)
  - Create 4-5 columns: "Next to Read", "Time Travel", "Thrillers", "Favorites ⭐", "Currently Reading"
  - Demonstrates the solution: order and control (vs chaos of 2322 unsorted books)
- [ ] **Capture AFTER screenshot** showing organized library
  - Show ReaderWrangler header with multiple populated columns
  - Empty or nearly-empty "Unorganized" column (shows completion)
  - Save to images/ folder alongside existing BEFORE screenshot
- [ ] **Optionally update documentation** with new screenshots
  - Consider adding to README.md hero section
  - Consider adding to index.html hero section

### Pending: Documentation
- [ ] **Fill in missing sections in USER-GUIDE.md**
  - Complete any placeholder sections or TODO markers
  - Ensure all features are documented
  - Add screenshots/examples where helpful

## Completed

### CRITICAL: Shift-Click Range Selection Bug - COMPLETED (2025-11-19)
- [x] **Fixed critical data corruption bug** (v3.5.1)
  - **Severity**: CRITICAL - Caused massive unintended selections
  - **Impact**: User selected 10 filtered books, actually moved 1437 unfiltered books
  - **Root Cause**: Shift-click calculated range on underlying array instead of filtered/visible results
  - **User Report**: Filtered on "Ayres" (10 books), shift-clicked first→last, moved all 1437 books to "Time Travel" column
  - **Fix**: Changed line 1119 in readerwrangler.js from `const visibleBooks = column.books;` to `const visibleBooks = filteredBooks(column.books);`
  - **Branch**: `bugfix/shift-click-filtered-selection` (merged to main)
  - **Commits**: 61738c8 (fix), 3965fc5 (version bump)

### Project Rename to ReaderWrangler - COMPLETED (2025-11-18)
- [x] **Repository Rename** - Changed from "amazon-book-organizer" to "readerwrangler"
- [x] **Custom Domain Setup** - readerwrangler.com configured with FreeDNS and GitHub Pages
- [x] **File Updates** - All references updated throughout codebase
- [x] **Landing Page** - index.html created for custom domain
- [x] **Bookmarklet Navigation Hub** - Transformed from script runner to multi-step navigation system
- [x] **Documentation** - README.md, USER-GUIDE.md, "Coming Soon!" section added
- [x] **SEO Infrastructure** - sitemap.xml, robots.txt, Schema.org structured data
- [x] **Launch Strategy** - REDDIT-LAUNCH-POST.md, PRODUCTHUNT-LAUNCH-CHECKLIST.md

### Documentation Accuracy & SEO Setup - COMPLETED (2025-11-18)
- [x] **Bookmarklet Evolution to Navigation Hub**
  - Conceptual shift: Bookmarklet now shows navigation menu instead of auto-running scripts
  - Multi-step workflow: Navigate → Fetch → Launch (not "one-click" as originally advertised)
  - Installation now available from both index.html and install-bookmarklet.html
  - Added DEV_MODE_VIEW_OF_PROD_BUTTONS toggle for localhost testing
- [x] **"One-Click" False Advertising Fixes**
  - Replaced "one-click extraction" with accurate "easy extraction with bookmarklet"
  - Updated 15+ locations across index.html, install-bookmarklet.html, README.md
  - User expectations now match reality
- [x] **Documentation Accuracy**
  - "How It Works" section rewritten to explicitly mention navigation menu
  - Standardized to "when you click the bookmarklet" throughout
  - Changed "One-Time Setup" → "Initial Setup" (more accurate)
  - Fixed typo: "canvase for your" → "canvas for you"
  - Removed old commented code for previous bookmarklet order
- [x] **README.md Structure Alignment**
  - Added missing section title: "Extract and Organize Your Online Amazon Kindle Library Easily"
  - Reordered all sections to match index.html exactly
  - Fixed GIF placement (moved below 2nd paragraph)
  - Fixed Quick Start formatting (each step on separate line)
  - Converted sections to 2x2 table format (matches index.html)
  - Added "How It Works" section matching index.html
  - Word-for-word verification: All matching content now identical
  - Added FreeDNS credit in Notice section
- [x] **SEO Infrastructure**
  - Created sitemap.xml for Google indexing
  - Created robots.txt for crawler guidance
  - Added Schema.org structured data (JSON-LD) to index.html
  - Optimized meta tags with "scrape", "visually", "extract" keywords
  - Added OG meta tags for social media sharing
- [x] **Launch Strategy Documentation**
  - Created REDDIT-LAUNCH-POST.md for r/kindle launch (200k+ subscribers)
  - Created PRODUCTHUNT-LAUNCH-CHECKLIST.md with complete launch guide
  - Documented best posting times, expected Q&A, success metrics

### Landing Page & UX Tweaks - RELEASED (2025-11-16)
- [x] Created index.html landing page for custom domain (readerwrangler.com)
- [x] Updated amazon-collections-fetcher.js progress message (1½ minutes per 1000 books)
- [x] Added X buttons to all dialogs (bookmarklet, library fetcher, collections fetcher)
- [x] Added localhost detection to bookmarklet for local testing
- [x] Removed "Refresh page to cancel" from dialogs (kept in console)
- [x] Environment-aware bookmarklet installer (v1.0.2.d)
  - Production: Shows single bookmarklet (📚 ReaderWrangler)
  - Localhost: Shows BOTH dev and prod bookmarklets side-by-side
  - Dev bookmarklet: ⚠️ DEV ReaderWrangler (orange, localhost only)
  - Prod bookmarklet: 📚 ReaderWrangler (purple, GitHub/readerwrangler.com)
  - Tested successfully on localhost and Amazon pages
- [x] Restructured CONTRIBUTING.md with logical flow
- [x] Removed version numbers from Files Overview (maintenance burden)
- [x] Initialize git repository
- [x] Setup GitHub remote
- [x] Create project documentation
- [x] Repository setup and organization
- [x] Project renamed from Kindle Library Organizer to Amazon Book Organizer
- [x] Phase 0 API Testing - Validate BOTH library and enrichment queries before fetching (fail fast with diagnostics)
- [x] Improved file save location messaging (browser's save location vs Downloads folder)
- [x] Rename "Empty (No Library Loaded)" text → "Click here to load library"
- [x] Custom status icons - Replace Unicode with PNG images (busy, empty, fresh, stale, question-mark)
- [x] Fix status icon display lag - Pre-load all icons and toggle with CSS
- [x] Grammar fix - Singular/plural for "1 new book" vs "N new books"
- [x] Dialog behavior fix - Close immediately when file picker opens
- [x] Fix manifest caching issue - Add cache-busting to fetch
- [x] Fix stale status after "Clear Everything" - Clear manifestData
- [x] Improve button labels - "Sync Now" → "Load Updated Library"
- [x] Terminology consistency - Replace "sync" with "load" throughout UI
- [x] Dynamic title management - Browser title updates from APP_VERSION constant
- [x] Search bar improvements - Add magnifying glass icon and better placeholder
- [x] Add Column UX redesign - Button creates "New Column" with cursor ready to rename
- [x] Claude Skills infrastructure - Created SKILL-*.md files and build scripts
- [x] Session continuity - Created NOTES.md for tabled items and work context
- [x] Project version management - README.md as source of truth for git tags
- [x] Documentation updates - README with server setup, Skills workflow, NOTES.md
- [x] Improve column rename discoverability - Added hover pencil icon (feature was working via double-click but not obvious to users)
- [x] Improve library fetcher error messages - Added actionable recovery steps for auth failures
- [x] HTML refactoring - Split monolithic HTML into separate CSS/JS files (v3.2.0)
- [x] Version management enhancements - Query string cache busting, footer display, version comments
- [x] Git pre-commit hook - Automatic SKILL zip rebuilding on commit
- [x] Collections fetcher - Built collections-fetcher.js to extract collection membership and read status (v1.0.0)
- [x] Multi-select with Ctrl/Shift clicking - Standard file-manager style multi-select (v3.4.0, released 2025-11-12)
- [x] GitHub Pages Distribution - Bookmarklet-based deployment for zero-installation access (released 2025-11-13)
  - [x] bookmarklet-loader.js v1.0.0 - Smart loader with page detection and navigation
  - [x] install-bookmarklet.html v1.0.0 - Drag-and-drop installer page
  - [x] Progress UI overlays for library-fetcher.js and collections-fetcher.js
  - [x] README Quick Start section with installer link

## Stable ASIN-Based IDs - IN PROGRESS

**Goal**: Fix book organization persistence by using stable ASIN-based IDs instead of sequential book-N IDs

**Status**: Testing stable ID implementation with purchase date sorting

**Problem**: Books were using sequential IDs (`book-0`, `book-1`, etc.) that changed when library was reloaded in different order, causing:
- Books with mismatched IDs not appearing in organizer UI
- Organization data becoming out of sync with library
- Missing books at end of library (5 books hidden after reload)

**Solution**:
- Use ASIN as stable book ID (IDs persist across reloads regardless of order)
- Sort books by acquisition date (newest first) to maintain familiar display order
- Clear IndexedDB and localStorage to start fresh with new ID system

**Changes Made**:
- [x] Changed ID generation from `book-${i}` to `item.asin` in organizer
- [x] Added purchase date sorting (newest first) to restore original ordering
- [x] Removed complex migration logic (opted for clean start instead)
- [x] Updated version to v3.3.0.c for testing
- [ ] Test that all 2343 books load correctly
- [ ] Test that organization persists across reloads
- [ ] Verify purchase date ordering is correct

## Collections Integration - DATA MERGED ✅, UI INCOMPLETE

**Status**: Collections data successfully merged into organizer, UI features pending

**Completed**:
- [x] Build collections fetcher script (collections-fetcher.js v1.0.0)
- [x] Test collections fetcher (successfully fetched 2,280 books in 3m 56s)
- [x] Generate amazon-collections.json with all collection data
- [x] HTML refactor complete (v3.2.0) - modular structure ready for integration
- [x] Merge v3.2.0 refactor to main
- [x] Pull refactored main into feature-collection-read-status-exploration
- [x] Load and merge collections data with library data in organizer
  - Console shows: "📚 Collections data merged: 1163 books have collections"
  - Read status tracked: 642 READ, 1 UNREAD, 1700 UNKNOWN

**TODO - UI Features**:
- [ ] Add visual indicators (badges/icons) for collections on book covers
- [ ] Add metadata display showing which collections each book belongs to
- [ ] Add filtering by collection name
- [ ] Add filtering by read status (READ/UNREAD/UNKNOWN)
- [ ] Implement "Uncollected" pseudo-collection (books with no collections)

**Design Decisions:**
- **Two separate JSON files**: `amazon-library.json` + `amazon-collections.json`
- **Collections JSON includes ALL books** (even with no collections) for "Uncollected" support
- **Output format**: `{asin, title, readStatus, collections: [{id, name}]}`
- **"Uncollected" = computed pseudo-collection** (books with `collections: []`)
- **Edge cases**:
  - Books in collections but not library → Show dialog after full scan
  - Books in library but not collections → Normal, no collections/readStatus
  - Missing collections.json → App works, no collection features
  - Schema mismatch → Handle gracefully

## Bugs - High Priority

- [x] **Description fetching is broken** - FIXED in v3.1.2 - Description extraction now works correctly
- [x] **Missing books in organizer UI** - FIXED in v3.3.0.c - Switched to stable ASIN-based IDs
- [ ] **Collections filter not cleared by "Clear Everything"** - Collections dropdown still shows old collection names after Clear Everything is clicked (deferred to future release)
- [x] **"Clear Library" feature** - FIXED in v3.3.2.m - Simplified from complex dialog to single button
  - Replaced "Reset Organization" and "Clear Everything" dialog with single "Clear Library" button
  - Based on proven v3.2.1 clearEverything pattern
  - Complete reset: unloads library, removes columns, clears organization, resets to pristine state
  - Simple confirm() dialog explains what will be cleared
  - User tested and confirmed: "works exactly as expected!"

## Fetcher Improvements - Phase 2 (Description Tracking & Reporting) ✅ COMPLETE

**Goal**: Add comprehensive tracking and reporting for books without descriptions

**Status**: Completed and committed (commit e058725)

### Schema v3.0.0 Changes ✅
- [x] **Add metadata section to amazon-library.json**:
  - `metadata.fetchDate`, `metadata.totalBooks`, `metadata.booksWithoutDescriptions`
  - `metadata.schemaVersion = "3.0.0"`
  - `booksWithoutDescriptions` array: `[{asin, title, authors}]`

### Library Fetcher Enhancements ✅
- [x] **Track missing descriptions during Pass 2**:
  - Build `booksWithoutDescriptions` array for books where `extractDescription()` returns empty
  - Add metadata section to output JSON
  - Include schema version in metadata

- [x] **Add end-of-run summary to console**:
  - Show total books, books with complete data, books missing descriptions
  - List all books without descriptions (ASIN, title, author)

### Organizer Support ✅
- [x] **Handle new JSON schema v3.0.0**:
  - Validates `{metadata, books}` structure
  - Extracts and logs metadata information
  - Throws helpful error for invalid schemas

### Collections Fetcher ✅
- [x] Added named function wrapper for reusability (`fetchAmazonCollections()`)

## Fetcher Improvements - Phase 2.5 (Description Investigation) ✅ COMPLETE

**Goal**: Investigate why some books lack descriptions and explore alternative extraction methods

**Status**: ✅ COMPLETED - 99.91% description recovery achieved

- [x] **Investigation and recovery**:
  - Created 6 throwaway investigation/recovery scripts
  - Discovered 3 new extraction patterns (paragraph wrappers, AI summaries, recursive fragments)
  - Recovered 1,526 out of 1,528 missing descriptions
  - Updated library-fetcher.js v3.2.0 with all discovered patterns
  - Documented complete investigation in DESCRIPTION-RECOVERY-SUMMARY.md

**Results**:
- Traditional descriptions: 1,517 recovered
- AI summaries: 7 recovered
- Recursive extractions: 2 recovered
- Only 2 books genuinely lack descriptions on Amazon (verified manually)

**Throwaway Files** (moved to recovery-scripts/ directory - can be deleted after fresh fetch succeeds):
- All description-*.js scripts
- All recovered-*.json data files
- books-without-descriptions*.json files
- Library backup copies

## Fetcher Improvements - Phase 2.6 (Partial Error Investigation) ✅ COMPLETE

**Goal**: Fix 3/2666 enrichment failures caused by partial GraphQL errors

**Status**: ✅ COMPLETED - Solution validated in overnight fetch (v3.3.2.b)

**Problem**: 3 books failed during full library fetch with "Customer Id or Marketplace Id is invalid" error
- Cats (position 2037, ASIN B0085HN8N6)
- Queen's Ransom (position 2321, ASIN 0684862670)
- To Ruin A Queen (position 2322, ASIN 0684862689)

**Root Cause Discovered**: GraphQL partial errors
- Amazon returns BOTH `data` (with valid description) AND `errors` (customerReviewsTop failed)
- Our code rejected entire response if `data.errors` existed
- Lost valid description data by treating partial errors as total failures

**Solution Implemented** (v3.3.2.b):
- [x] Partial error handling - check for data despite errors
- [x] Enhanced error logging with raw response dumps
- [x] Statistics tracking for partial errors (position, title, ASIN, error message, error path)
- [x] Final summary section showing all partial errors

**Validation Results**:
- [x] Run overnight full library fetch validation (~3 hours) - SUCCESSFUL
- [x] Verify all 3 books now have descriptions - CONFIRMED
- [x] Review partial error statistics - 5 books had partial errors, all recovered
- [ ] Update CHANGELOG.md with v3.3.2 release - IN PROGRESS
- [ ] Archive diagnostic scripts (post-release cleanup)

**See also**: NOTES.md "Phase 2 Enrichment Failures Investigation" for complete investigation timeline

## Cleanup After Phase 2.6 Investigation

**Goal**: Archive diagnostic scripts and restructure NOTES.md after validation completes

**Prerequisites**:
- ✅ Overnight fetch validation successful
- ✅ Confirmed 3 books recovered
- ✅ No new partial errors discovered

**Tasks**:
- [ ] **Archive diagnostic scripts to recovery-scripts/**:
  - Move all `diag-*.js` files (13 scripts)
  - Move all `antidote-test-*.js` files (7 scripts)
  - Move all `check-*.js`, `analyze-*.js`, `diff-*.js`, `verify-*.js` files
  - Move all `output-*.txt` instruction files
  - Move all test result files (`test-*-console-results.txt`, `test-*-final-results.json`)
  - Keep `library-fetcher.js`, `amazon-organizer.js`, `amazon-organizer.html` in root

- [ ] **Restructure NOTES.md**:
  - Extract "Phase 2 Enrichment Failures Investigation" section to separate file: `NOTES-PHASE-2.6-INVESTIGATION.md`
  - Keep only active work and tabled items in NOTES.md
  - Archive completed investigation details
  - Update references to point to archived file

- [ ] **Update documentation**:
  - Verify CHANGELOG.md has v3.3.2 entry
  - Verify README.md file versions are current
  - Review CONTRIBUTING.md for any needed updates

## Release v3.3.2 ✅ COMPLETE

**Released**: 2025-11-11
**Tag**: [v3.3.2](https://github.com/Ron-L/amazon-book-organizer/releases/tag/v3.3.2)

**Completed**:
- ✅ Overnight fetch validation successful (all 3 problem books recovered)
- ✅ Clear Library feature implemented and tested (v3.3.2.m → v3.3.2)
- ✅ Load Library instruction text improved (v3.3.2.n → v3.3.2)
- ✅ Version Management: library-fetcher.js v3.3.2, amazon-organizer.js v3.3.2
- ✅ Documentation: CHANGELOG.md updated with complete v3.3.2 entry
- ✅ Git Workflow: Committed, tagged v3.3.2, pushed with tags
- ✅ Post-Release Review: Comprehensive post-mortem completed
  - Created [post-mortems/v3.3.2-2025-11-11.md](post-mortems/v3.3.2-2025-11-11.md)
  - Extracted 3 actionable patterns to Ground Rules
  - Documented what worked well, mistakes made, lessons learned
- ✅ Post-Release Cleanup: 77 investigation files archived
  - Created `/future` directory for specification documents (2 files)
  - Organized `archived-investigations/phase-2.0-description-recovery/` (17 files)
  - Organized `archived-investigations/phase-2.6-partial-errors/` (60 files)
  - Root directory: 100% cleanup of investigation artifacts
- ✅ GraphQL Quick Reference: Created concise 1-page reference document

**Key Achievements**:
- Fixed partial GraphQL error handling (recovered 5/5 books with partial errors)
- Simplified Clear Library feature (based on v3.2.1 working pattern)
- Improved load library instructions for first-time users
- 100% data coverage achieved (all 2666+ books enriched successfully)

**Lessons Learned**: See [post-mortems/v3.3.2-2025-11-11.md](post-mortems/v3.3.2-2025-11-11.md)

**Note**: This release followed the "Build Solid Foundation" approach - spent 6 days investigating 3/2666 failures (0.15%) because library management requires 100% data coverage (see CONTRIBUTING.md "Ship Fast vs. Build Solid" framework)

## Fetcher Improvements - Phase 3 (UI Error Handling)

**Goal**: Improve error messaging in organizer for missing descriptions

### Organizer Updates
- [x] **Handle new JSON schema v3.0.0** - COMPLETED in Phase 2
  - Load and parse `metadata` and `booksWithoutDescriptions`
  - No backward compatibility (requires fetcher v3.1.3+)

- [x] **Improve book dialog error messaging** - COMPLETED in v3.2.1
  - ~~If empty + in `booksWithoutDescriptions`: "⚠️ Description not available from Amazon"~~
  - ~~If empty + NOT in array: "❌ Error: Description should exist but wasn't found"~~
  - ~~Remove "📥 Fetch Description & Reviews" manual fetch button~~
  - **Simple implementation:** Removed misleading button, added honest "Description not available" message
  - **Note:** Schema-aware messaging (booksWithoutDescriptions) deferred to Phase 3

- [ ] **Add warning banner on library load**:
  - Dismissible banner if books missing descriptions
  - Store dismissed state in localStorage

- [ ] **Add "View Books Missing Descriptions" feature**:
  - Button/menu to view list anytime
  - Table with title, author, ASIN
  - Link to book dialog

## Fetcher Improvements - Phase 4 (Reliability & Data Quality) ✅ COMPLETE

**Goal**: Improve fetch reliability, filter out non-book items, and add comprehensive statistics

**Status**: ✅ COMPLETED - library-fetcher.js v3.3.0

- [x] **Retry logic with exponential backoff**:
  - Applied to Phase 0 validation (library + enrichment tests)
  - Applied to Pass 1 library page fetching
  - Applied to Pass 2 individual book enrichment (already had retry logic)
  - Retries up to 3 times with 5s, 10s, 20s delays between attempts
  - Prevents data loss from temporary network issues (fixes 5 API errors seen in v3.2.0 fresh fetch)
  - Console shows `⏳ Retry X/3 after Ys...` during retry attempts
  - Only marks as failed after all retries exhausted
  - Expected improvement: 99.79% → 99.95%+ success rate

- [x] **Comprehensive statistics output**:
  - ⏱️ TIMING: phase-by-phase duration breakdown (Phase 0, Pass 1, Pass 2, Merge, Manifest)
  - 🔄 API RELIABILITY: retry histogram showing % of calls succeeding on first try vs. requiring retries
  - 📊 FETCH RESULTS: total fetched, non-books filtered, books kept
  - 📝 ENRICHMENT RESULTS: success rate with list of failed books after retries
  - ⚠️ DATA QUALITY NOTES: books without descriptions, authors, AI summaries used
  - 💾 FILES SAVED: confirmation of output files
  - Statistics shown even when no new books found (validation-only mode)

- [x] **Non-book item filter**:
  - Automatically excludes non-book items during Pass 1 (DVDs, Audio CDs, CD-ROMs, Maps, Shoes, Product Bundles, Misc.)
  - Only includes: Kindle Edition, Paperback, Hardcover, Mass Market Paperback, Board book, Unknown Binding, Audible Audiobook, Library Binding
  - Console shows `⏭️  Skipping non-book: [title] ([binding])` when item filtered
  - Statistics show how many non-books filtered with examples
  - Removes 12 non-book items from future fetches

- [x] **Early exit bug fix**:
  - Fixed bug where statistics were not shown when library is up-to-date
  - Now shows validation timing, API reliability, and library status even with no new books

- [x] **Backward compatibility code cleanup**:
  - Removed temporary schema v2.0 → v3.0.0 migration code (lines 221-234)
  - Codebase now only supports schema v3.0.0+
  - Simplified and cleaner implementation

## Fetcher Improvements - Other

- [x] **Add timing information to fetcher output**: ✅ COMPLETED in v3.3.0
  - Track start time for each phase (Phase 0, Pass 1, Pass 2, Merge, Manifest)
  - Comprehensive timing breakdown in final statistics output
  - Shows phase-by-phase duration with formatted times (e.g., "1h 23m 45s")
  - Helps users understand performance and estimate future fetches

- [ ] **Distribution: GitHub Pages + Bookmarklets**
  - **Goal**: Make ReaderWrangler easy for others to use
  - **Documentation**: See [DISTRIBUTION.md](DISTRIBUTION.md) for complete guide
  - **Summary**:
    - Host organizer app on GitHub Pages (free, HTTPS, auto-deploy)
    - Provide bookmarklet that loads fetcher scripts from GitHub Pages
    - Users: One-click bookmark → fetch → organize
    - Zero installation, always latest version, data stays local
  - **Approaches Documented**:
    1. GitHub Pages + Bookmarklet (recommended for end users)
    2. GitHub Gist + Bookmarklet (alternative)
    3. Local HTTP Server (development only)
  - **See DISTRIBUTION.md for**:
    - GitHub Pages setup instructions
    - Bookmarklet code templates
    - User workflow documentation
    - Deployment checklist
    - Custom domain setup (optional)

- [ ] Remove 30-second timeout from file selection
- [ ] Improve "WORKING DIRECTORY" messaging throughout
- [ ] Match opening/closing dialog terminology

## Development Process Improvements

- [ ] Consider adding "grep for TODO comments in code files" to release procedure in ground rules
  - Review all in-code TODOs before finalizing release
  - Ensures temporary code doesn't become permanent

## Features - Approved

- [ ] **Phase 3 Retry Logic** (v3.4.0) - Progressive data completeness improvement
  - **Goal**: Retry books with missing review data using same API configuration (Amazon backend issues are random/intermittent)
  - **When**: After Phase 2 enrichment completes (fresh fetch) OR when user refreshes existing library
  - **How**:
    1. Scan library for books with `reviewCount > 0` but `topReviews.length === 0`
    2. Retry using SAME configuration (`getProducts + your-books`):
       - Wait 5-10 minutes after initial fetch (allow Amazon backend state to change)
       - Retry same ASIN up to 3 times total
       - Track retry statistics in book metadata (`reviewFetchAttempts`, `reviewFetchStatus`, `lastReviewFetchAttempt`)
    3. Merge successful review data back into library
    4. Update metadata with retry statistics
  - **Why NOT Use Alternative APIs**:
    - Test results (test-06) show ONLY `getProducts` works
    - `getProduct` (singular) and `getProductByAsin` are broken/deprecated
    - Alternative methods fail even on books that work with `getProducts`
    - See [GraphQL-API-Reference.md](GraphQL-API-Reference.md) for complete test results
  - **Benefits**:
    - Fresh fetch: Immediate retry (servers might succeed on 2nd attempt due to randomness)
    - Refresh: Progressive improvement over time (Amazon's server state changes)
    - User expectation: Loading library file should update missing data if possible
  - **Statistics**:
    - Current analysis: 31/2344 books (1.3%) missing topReviews
    - 3 books consistently fail (Cats + 2 Queens) - Amazon backend permanently broken
    - ~28 books fail intermittently - should resolve on retry
    - Expected final success rate: ~99.8% (2,341/2,344 books)
  - **Note**: Only 2 books with 500+ reviews missing data (0.1%) - not correlated with review count

- [ ] **Tooltips for control buttons** - Add helpful tooltips for Backup, Restore, Reset, Clear Everything buttons explaining what each does
- [ ] **First-run Welcome dialog** - Show welcome dialog on first run (or after Clear Everything) that:
  - Explains what ReaderWrangler is and why it exists
  - Points to the help icon ("?") for detailed usage instructions
  - Dismisses permanently (or until next clear)
  - Should run only once per fresh start
- [ ] Column name filtering - Extend search to filter by column names (anticipating 100s of columns with 2336 books)
  - **Approach to try first**: Simple case - search filters title, author, AND column name simultaneously
  - **Fallback options if simple case is confusing**:
    - Option #2: Prefix syntax (e.g., `column:sci-fi`, `author:smith`) - no UI chrome, power user friendly
    - Option #4: Smart filtering - if search matches column name exactly, prioritize that column
- [ ] Add title & author text under book covers (~5-8K tokens)
- [ ] Multi-select with Ctrl/Shift clicking (~15-25K tokens)

## Project Rename Plan (Priority #1) - IN PROGRESS

**New Name**: ReaderWrangler™

**Strategy**: Two separate releases for safety

### Release 1: Repository Rename + File Updates (v3.5.0)

**Branch**: `feature-rename-to-readerwrangler`

**Rename Ground Rules**:

**KEEP Amazon/Kindle references when:**
- Legal/trademark notices (required)
- Platform-specific features ("Current Support: Amazon Kindle™ Library")
- Historical CHANGELOG entries (history never changes)
- Specific technical instructions ("Navigate to Amazon library page")
- Amazon-specific file functionality (library-fetcher.js fetches from Amazon API)

**CHANGE Amazon references when:**
- Generic product descriptions ("Amazon library" → "ebook library")
- Generic feature descriptions ("organize your Amazon books" → "organize your ebooks")
- Non-specific UI text (app title, headers)
- File names and URLs that are product-branded

**File Changes Required**:
- [ ] Rename `amazon-organizer.html` → `readerwrangler.html`
- [ ] Update `amazon-organizer.js` - product name, browser title, generic descriptions
- [ ] Update `amazon-organizer.css` - any Amazon-specific references
- [ ] Keep `library-fetcher.js` name (Amazon-specific, will have `barnes-noble-fetcher.js` later)
- [ ] Keep `collections-fetcher.js` name (same reasoning)
- [ ] Update `bookmarklet-loader.js` - GitHub Pages URLs, product name
- [ ] Update `install-bookmarklet.html` - GitHub Pages URLs, product name
- [ ] Update README.md - Already done (generalized to ebook library)
- [ ] Update CONTRIBUTING.md - Title, project references, file names
- [ ] Rename `SKILL-Amazon-Book-Organizer.md` → `SKILL-ReaderWrangler.md`
- [ ] Update SKILL-ReaderWrangler.md - Internal project references
- [ ] Rename `amazon-book-organizer.code-workspace` → `readerwrangler.code-workspace`
- [ ] Update TODO.md - Project name references (not historical changelog items)
- [ ] Update NOTES.md - Current project name (not historical entries)
- [ ] CHANGELOG.md - Add new v3.5.0 entry, DO NOT change historical entries

**GitHub URLs to Update**:
- All instances of `https://ron-l.github.io/amazon-book-organizer/` → `https://ron-l.github.io/readerwrangler/`
- Internal links in README, CONTRIBUTING, etc.

**Workflow**:
1. Create feature branch
2. Update all files with renamed references
3. Test locally with http server
4. Commit changes
5. Merge to main
6. **User renames GitHub repository** (amazon-book-organizer → readerwrangler)
7. Update local git remote URL
8. Test GitHub Pages with new URL
9. Tag v3.5.0
10. Push with tags

**Testing**:
- [ ] Bookmarklet loads from new GitHub Pages URL
- [ ] App works at new URL
- [ ] All internal links resolve correctly
- [ ] GitHub auto-redirects old URLs

### Release 2: Enhanced Getting Started UX (v3.5.1)

**Branch**: `feature-getting-started-ux`

**Changes**:
1. **Help Menu Links** (5 min)
   - Add "Getting Started Guide" → README.md#quick-start
   - Add "About ReaderWrangler" → README.md

2. **Enhanced Empty Library State** (30 min)
   - Detect: No library in IndexedDB on load
   - Show: Helpful banner in library status area
   - Content: "No library loaded yet. [Install Bookmarklet & Get Started →] [Load Existing JSON]"
   - Link to README#quick-start for new users
   - Existing file picker for returning users

**Workflow**:
1. Create feature branch (after Release 1 complete)
2. Add Help menu links
3. Enhance empty library state
4. Test with empty and populated libraries
5. Commit, merge, tag v3.5.1
6. Done

---

## Multi-User (Multi-Account) Design Notes

**Status**: Future Enhancement (documented for "Ship Fast" approach - implement single-user first, design for multi-user)

**Problem Statement**:
What happens when multiple Amazon accounts use ReaderWrangler on the same browser/device?
- Couples sharing a computer
- User with personal + work Amazon accounts
- Testing with multiple accounts

### Design Decisions Made

**1. Identifier: Amazon AccountId (NOT a GUID)**
- Use Amazon's native accountId as the library identifier
- Benefits:
  - User-recognizable (they see their own account name)
  - Naturally unique per Amazon account
  - No need to generate/manage separate GUIDs
  - Collections uses same accountId as Library (tied to same Amazon account)

**2. Where to Find AccountId**
- **API Discovery (2025-11-21)** - COMPLETE ✅
  ```
  POST https://www.amazon.com/hz/mycd/ajax
  Payload: {"param":{"GetPFMDetails":{}}}

  Response includes:
    customerName: "Ron Lewis"           // Friendly display name
    primaryEmailAddress: "user@example.com"  // Unique key
  ```
  - Call happens automatically on BOTH pages:
    - Collections page load (ajax call #13)
    - Yourbooks page load (confirmed 2025-11-21)
  - Same endpoint, same response on both pages
- **Final Design:**
  - `primaryEmailAddress` → Internal unique key (guaranteed unique per account)
  - `customerName` → Display to user (friendly, what they expect)
  - Store both in manifest, keyed by email
- **DOM Fallback (if needed):**
  - Yourbooks page: Banner says "Ron Lewis's Books"
  - Collections page: "Ron" appears in 2 places

**3. Storage Architecture**
- Fetcher writes manifest directly to IndexedDB (not separate JSON file first)
- JSON file is primary storage for book data (reviews make it too large for IndexedDB)
- Each library identified by accountId in IndexedDB
- Collections uses same accountId as Library

**4. No "Compare" Feature Needed**
- Users don't need to compare libraries across accounts
- Each account's library is independent

**5. Clear Behavior**
- Clear should clear current library only (by accountId)
- Not a global "clear all accounts" operation

**6. Backup/Restore**
- Handles the "experimenting with arrangements" use case
- User can backup their organization, try changes, restore if unhappy
- Per-account backup/restore (identified by accountId)

**7. AccountId Mismatch Handling (Future)**
- What if user loads a JSON file from a different account?
- Options:
  - Warn user and ask to confirm
  - Automatically segregate by accountId
  - Reject mismatched files
- Decision deferred to implementation time

### Current Implementation (Single-User)

For the initial "Ship Fast" release:
- Assume single account per browser
- No accountId tracking yet
- Library and Collections assumed to be from same account
- No mismatch detection

### Future Implementation (Multi-User)

When implementing multi-user support:
1. Scrape accountId from Amazon page (DOM or API response)
2. Store accountId in manifest (IndexedDB)
3. Include accountId in JSON file metadata
4. Detect mismatched files on load
5. Per-account organization data in IndexedDB
6. Account switcher UI in status bar

---

## Multi-Store Architecture Plan

**Goal**: Support multiple ebook stores (Amazon, Barnes & Noble, Kobo, etc.) while maintaining clean separation between platform-specific and generic code.

### File Naming Convention: Store-First

**Fetcher Scripts** (platform-specific):
- `amazon-library-fetcher.js` - Fetches Amazon library data
- `amazon-collections-fetcher.js` - Fetches Amazon collections/read status
- `bn-library-fetcher.js` - Future: Barnes & Noble library fetcher
- `kobo-library-fetcher.js` - Future: Kobo library fetcher

**Data Files** (store-specific):
- `amazon-library.json` - Amazon library data (books with `store: "Amazon"` field)
- `amazon-collections.json` - Amazon collections/read status data
- `amazon-manifest.json` - Amazon library metadata (total books, last updated)
- `bn-library.json` - Future: B&N library data (books with `store: "BarnesNoble"` field)
- `bn-manifest.json` - Future: B&N library metadata

**Organizer App** (store-agnostic):
- `readerwrangler.html` - Main app shell
- `readerwrangler.js` - Generic organizer logic (works with any store)
- `readerwrangler.css` - Generic styles
- App merges all loaded library files using `store` field to identify source

### Bookmarklet Smart Detection

**Current Implementation** (Amazon-only):
```javascript
const onLibraryPage = currentUrl.includes('amazon.com/yourbooks') ||
                      currentUrl.includes('amazon.com/kindle/library');
const onCollectionsPage = currentUrl.includes('amazon.com/hz/mycd/digital-console');
```

**Future Multi-Store Implementation**:
- Detect current store from URL (amazon.com, barnesandnoble.com, etc.)
- **On store library page**: Offer to fetch library OR navigate to collections page
- **On store collections page**: Offer to fetch collections OR navigate to library page
- **On non-store page**: Present menu of all supported stores to navigate to
- Each store loads its platform-specific fetcher script

**Bookmarklet Dialog Behavior**:
1. **On amazon.com/yourbooks**:
   - Primary: "📖 Fetch Your Amazon Books" → loads `amazon-library-fetcher.js`
   - Secondary: "📚 Go to Amazon Collections Page" → navigates to collections

2. **On amazon.com/hz/mycd/digital-console**:
   - Primary: "📚 Fetch Your Amazon Collections" → loads `amazon-collections-fetcher.js`
   - Secondary: "📖 Go to Amazon Library Page" → navigates to library

3. **On barnesandnoble.com/nook/library** (future):
   - Primary: "📖 Fetch Your B&N Books" → loads `bn-library-fetcher.js`
   - Secondary: "📚 Go to B&N Collections Page" (if applicable)

4. **On random page**:
   - "Choose your ebook store:"
   - Button: "📖 Amazon Kindle" → navigates to amazon.com/yourbooks
   - Button: "📖 Barnes & Noble" → navigates to bn.com/nook/library
   - Button: "📖 Kobo" → navigates to kobo.com/library

### Data Structure

**Book Object** (all stores):
```javascript
{
    id: "B00ABCD123",           // Store-specific ID
    asin: "B00ABCD123",         // Amazon-specific (present for Amazon books only)
    title: "Book Title",
    author: "Author Name",
    store: "Amazon",            // NEW FIELD - identifies source store
    coverUrl: "...",            // Store-specific CDN URL
    // ... other fields
}
```

**App Loading Behavior**:
1. User clicks "Load Library" → file picker opens
2. User can select multiple JSON files: `amazon-library.json`, `bn-library.json`, etc.
3. App loads all files, merges into single library using `store` field
4. Books can be filtered/searched by store if needed
5. Each book retains its store identity for proper cover URLs, links, etc.

### Migration Path

**Phase 1: Amazon Rename** (v3.5.0) - Current Release
- Add `store: "Amazon"` field to all Amazon books ✅
- Use store-specific filenames (`amazon-library.json`, `amazon-collections.json`) ✅
- Keep bookmarklet Amazon-only (no multi-store detection yet)

**Phase 2: Multi-Store Foundation** (future v3.6.0)
- Update bookmarklet with multi-store URL detection
- Add store selection menu for non-store pages
- Update organizer to handle multiple loaded libraries

**Phase 3: Additional Stores** (future v3.7.0+)
- Implement `bn-library-fetcher.js` for Barnes & Noble
- Add B&N URL patterns to bookmarklet
- Test with multi-store library (Amazon + B&N books in same organizer)

**Phase 4: Store-Specific Features** (future)
- Add store icons/badges in UI
- Filter by store
- Store-specific help text
- Handle store-specific data fields (collections might differ)

### Benefits of This Architecture

1. **Clean Separation**: Generic organizer code never knows about specific stores
2. **Easy Testing**: Can develop B&N fetcher without touching organizer
3. **Scalable**: Adding new stores = new fetcher script + URL patterns
4. **User Flexibility**: Users can fetch/organize from multiple stores
5. **No Conflicts**: Store-specific filenames prevent overwrites
6. **Future-Proof**: `store` field enables per-store filtering/features later

---

## README Refactor Plan - ✅ COMPLETED

**Goal**: Split README into user-facing and developer-facing content

**Rationale**: Now serving app via GitHub Pages, need clear separation of audiences

**Plan**:
1. **README.md** → User-facing product page
   - What: Project description, features overview
   - How: Quick Start with bookmarklet installer link
   - Why: Privacy note, technology stack (brief)
   - Delete obsolete "Getting Started" (local server setup)
   - Keep: Project Version, License
   - Remove: Documentation Guide, Skills Setup, all developer content

2. **CONTRIBUTING.md** → Expand with developer content
   - Move "Documentation Guide" from README
   - Move "Claude Skills Setup" from README
   - Move "Getting Started" local development setup
   - Already has: Git workflow, commit patterns, decision frameworks

3. **Benefits**:
   - Clear audience separation
   - Professional product page for end users
   - Complete developer guide in standard location (CONTRIBUTING.md)
   - Less confusing for casual users discovering via GitHub Pages

**Status**: Documented, awaiting completion of bookmarklet testing

## Features - Optional/Maybe

- [ ] **Book Copy Feature** - Allow same book to appear in multiple columns (Medium priority, Medium difficulty)
  - **UI**:
    - Drag = Move (current behavior, removes from previous column)
    - Ctrl+Drag = Copy (new feature, keeps in original column + adds to target column)
    - Right-click context menu: "Copy to..." vs "Move to..."
    - DEL key or right-click "Delete" = Remove from current column only
  - **Architecture** (array-based, cleaner than multiple DB entries):
    ```javascript
    // IndexedDB structure - ONE entry per book with arrays
    {
      asin: "B0123456",
      columnIds: ["next-to-read", "sci-fi", "favorites"],  // Array of columns
      positions: [0, 5, 2]                                  // Corresponding positions
    }
    ```
  - **Delete Operation**:
    - User selects book instance and presses DEL (or right-click → Delete)
    - Remove from specific column: splice out columnId and position from arrays
    - Safety check: If arrays would become empty, prompt user "Delete last copy?"
    - If user confirms: remove entire DB entry (book returns to unorganized)
    - If user cancels: keep the last copy
  - **Benefits**:
    - No data duplication in library JSON (still one canonical book record per ASIN)
    - Book can be in "Next to Read" AND "Sci-Fi" AND "Time Travel Books"
    - Simpler DB structure than multiple entries with same ASIN
    - Array indices stay synchronized (columnIds[0] corresponds to positions[0])
  - **Implementation Notes**:
    - Library JSON unchanged (one book per ASIN)
    - Only organization data in IndexedDB uses arrays
    - Rendering: Loop through columnIds array, render book at positions[i] in each column
    - Search/filter works same as before (still renders all instances)

- [ ] Explore read.amazon.com/kindle-library - Collections info & reading progress
- [ ] **Reading Progress tracking for each book** (Medium-Low priority, High difficulty)
  - Show reading progress percentage/position for each book
  - Implementation guidance: [Amazon Organizer Reading Progress conversation](https://claude.ai/chat/6e6f23c8-b84e-4900-8c64-fecb6a6e0bd1)
- [ ] Live reflow drag-and-drop animation (~12-18K tokens)
- [ ] 2D matrix layout (~50-80K tokens) - major refactor
- [ ] Groups/series containers (~35-55K tokens)
