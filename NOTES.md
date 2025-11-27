# Session Notes

This file tracks tabled discussion items, work in progress context, and open questions to maintain continuity across Claude sessions.

**Purpose:** Session state tracking only. For development rules and workflows, see SKILL-Development-Ground-Rules.md.

## Ground Rules Evolution

### SKILL-Development-Ground-Rules.md Changes

**[2025-11-26] Release Process Protocol Improvements**
- Split FINALIZE-RELEASE-ACTION into 3 discrete actions:
  - REVIEW-CODE-TODOS-ACTION (manual review with user decision: fix or proceed)
  - VERIFY-RELEASE-DOCS-ACTION (automated hard stops for missing docs)
  - FINALIZE-RELEASE-TAG-ACTION (git tagging)
- Updated RELEASE-FINALIZATION-TRIGGER to call all 3 actions in sequence
- Deleted RELEASE-CHECKLIST-REF (consolidated into VERIFY-RELEASE-DOCS-ACTION steps)
- Rationale: Old approach was ambiguous - unclear what "verify" meant (automated vs manual check)
- User insight: TODO check should run FIRST (may trigger more work, aborting remaining checks)
- Implements TODO.md item: "grep for TODO comments in code files"
- Commits: 044695b (REFERENCE DATA optimization), 83abc5e (release process split)

**[2025-11-26] REFERENCE DATA Section Optimization**
- Deleted 3 orphaned REFs not referenced by any TRIGGER/ACTION:
  - COMMIT-MESSAGE-FORMAT-REF (format kept inline in FORMAT-COMMIT-MESSAGE-ACTION)
  - TOKEN-BUDGET-REF (values hardcoded in SESSION-COMPACTION-TRIGGER and DISPLAY-STATUS-LINE-ACTION)
  - CLAUDE-SKILLS-MANAGEMENT-REF (git hook handles automatically, no Claude involvement)
- Created 2 new ACTIONS:
  - PRINT-SESSION-CHECKLIST-ACTION (references SESSION-CHECKLIST-FORMAT-REF)
  - FINALIZE-RELEASE-ACTION (consolidated 6 verification actions, references RELEASE-CHECKLIST-REF) [NOTE: Later split into 3 actions]
- Removed all Purpose statements from remaining REFs (calling contexts make them clear):
  - FILE-PATHS-REF, DOCUMENTATION-FILES-REF, SESSION-CHECKLIST-FORMAT-REF, RELEASE-CHECKLIST-REF
- Token savings: ~400 tokens total
- Architecture improvement: Event-driven pattern (TRIGGERS → ACTIONS → REFERENCE DATA) fully enforced with forward-only references
- Commits: 044695b

**[2025-11-26] Ground Rules Change Documentation Protocol**
- Added SKILL-FILE-MODIFIED-TRIGGER (fires after modifying SKILL-*.md files)
- Added DOCUMENT-GROUND-RULES-CHANGES-ACTION (documents changes in NOTES.md)
- Protocol: Track SKILL-*.md changes in NOTES.md "Ground Rules Evolution", skip CHANGELOG.md (not user-facing)
- Rationale: Ground rules are executable code (programs Claude's behavior), needs change tracking like code
- Commits: 83abc5e

**[2025-11-26] Trigger Language Improvements - Active vs Passive**
- Updated TASK-COMPLETION-TRIGGER: "Marking a TODO phase/task as complete" → "After you mark any TODO.md item as complete [x]"
- Updated 8 passive triggers with explicit, active language:
  - FILE-CHANGES-COMPLETE-TRIGGER: "After completing file edits" → "After you finish making file changes and before proposing a commit"
  - API-ERROR-TRIGGER: "Debugging API issues" → "When encountering API errors or investigating API behavior issues"
  - START-NEW-FEATURE-TRIGGER: "Beginning work on a new feature" → "After user approves starting a new feature and before making any code changes"
  - READY-TO-RELEASE-TRIGGER: "Feature is complete, tested, and ready" → "After user confirms feature is ready to merge to main"
  - ADDING-CODE-OR-FEATURE-TRIGGER: "About to add new code" → "Before proposing or implementing new code or functionality"
  - BEFORE-PROPOSING-SOLUTION-TRIGGER: "About to suggest an approach" → "Before proposing any approach, fix, or solution to user"
  - DECIDING-APPROACH-TRIGGER: "Choosing between quick implementation vs thorough" → "When evaluating how to implement a bug fix or feature"
  - WHEN-TO-STOP-AND-ASK-TRIGGER: "About to implement code change" → "Before implementing any code change, git operation, or file creation/modification, OR when uncertain about approach"
- Consolidated duplicate triggers:
  - Merged BEFORE-FINALIZING-VERSION-TRIGGER into RELEASE-FINALIZATION-TRIGGER (both fired "before removing version letter")
  - Combined actions: UPDATE-CHANGELOG-ACTION, REVIEW-TECHNICAL-NOTES-ACTION, REVIEW-CODE-TODOS-ACTION, VERIFY-RELEASE-DOCS-ACTION, FINALIZE-RELEASE-TAG-ACTION
- Rationale: Passive language like "about to", "choosing", "debugging" requires manual recognition. Active language like "after you", "when encountering", "before proposing" fires automatically at clear trigger points.
- User insight: TASK-COMPLETION-TRIGGER didn't fire because "marking a task as complete" was too passive
- Commits: 51e37cb

## Tabled Items

### Column Name Filtering Feature
- **Date**: 2025-10-17
- **Context**: User has an idea about filtering that also involves filtering column names
- **Status**: ✅ Moved to TODO.md with documented approaches (simple case, prefix syntax, smart filtering)
- **Priority**: Pending user decision on next task priority

## Current Work in Progress

### Timestamp & Token Monitoring System - COMPLETE ✅
- **Started**: 2025-11-25
- **Completed**: 2025-11-25
- **Status**: System tested and operational
- **Goal**: Implement reliable timestamp and token usage tracking for Rule #0 status line

**Key Findings**:
1. **Claude's internal timestamp is unreliable** - Cannot be trusted for accurate time display
2. **Claude's token usage updates sporadically** - Not refreshed on every response
3. **Python script solution** - Created `update-timestamp.py` to write accurate timestamps to `.claude-timestamp` every 60 seconds
4. **Staleness detection** - Added rules to detect if timestamper script stops running (3+ unchanged reads triggers warning)
5. **Compaction detection** - Token percentage jumps (e.g., 25% → 78%) indicate context compaction occurred
6. **Persistent memory** - `.claude-memory` JSON file stores state across compaction:
   - `timestampStaleCount` and `lastTimestamp` - Detect if timestamper script running
   - `lastTokenPercent` - Detect compactions by comparing current vs last percentage

**Files Created**:
- `update-timestamp.py` - Background service writing timestamps every 60 seconds with precise timing algorithm
- `.claude-timestamp` - Plain text file with current timestamp (updated by Python script)
- `.claude-memory` - JSON file with persistent state (survives compaction)

**Rule #0 Enhancements**:
- Status line now displays accurate timestamp from file (not Claude's unreliable internal timestamp)
- Token percentage, progress bar, and freshness indicator
- Staleness warning when timestamp unchanged for 3+ responses
- Compaction notification with 🔔 bell emoji for visibility

**Testing Results**:
- ✅ Post-compaction protocol verified (token jump from ~17% → 83% detected correctly)
- ✅ Staleness detection working (warning triggered after 3 unchanged reads)
- ✅ Memory persistence across compaction confirmed
- ✅ Timestamp file reading working (displays actual file contents, not cached values)

### Landing Page & UX Tweaks - RELEASED ✅
- **Started**: 2025-11-15
- **Released**: 2025-11-16
- **Branch**: `feature-ux-landing-page-tweaks`
- **Status**: Complete - tested successfully on localhost and Amazon pages
- **Goal**: Add professional landing page for custom domain and miscellaneous UX improvements
- **Completed**:
  1. ✅ Created index.html landing page with README content
  2. ✅ Updated amazon-collections-fetcher.js progress message (1 hour → 1½ minutes per 1000 books)
  3. ✅ Added X buttons to all dialogs (bookmarklet v1.0.2.c, collections v1.0.2.b, library v3.3.3.a)
  4. ✅ Added localhost detection to bookmarklet for local testing
  5. ✅ Removed "Refresh page to cancel" from dialogs (kept in console output)
  6. ✅ Environment-aware bookmarklet installer (v1.0.2.d)
     - Detects installer environment (localhost vs production)
     - Localhost: Shows BOTH bookmarklets (dev + prod) side-by-side
     - Production: Shows ONLY production bookmarklet
     - Dev bookmarklet: ⚠️ DEV ReaderWrangler (orange, points to localhost:8000)
     - Prod bookmarklet: 📚 ReaderWrangler (purple, points to GitHub Pages/readerwrangler.com)
  7. ✅ Restructured CONTRIBUTING.md with logical flow
  8. ✅ Removed version numbers from Files Overview
- **Testing**: All scenarios tested successfully (localhost installer, dev/prod bookmarklets, Amazon pages)

### GitHub Pages Distribution - RELEASED ✅
- **Started**: 2025-11-12
- **Released**: 2025-11-13
- **Branch**: `feature-bookmarklet-distribution`
- **Status**: Complete - deployed to GitHub Pages
- **Goal**: Deploy Amazon Book Organizer to GitHub Pages with bookmarklet for easy user access
- **Completed**:
  1. ✅ POC: bookmarklet-poc.js v1.0.0.b (archived)
  2. ✅ Smart bookmarklet: bookmarklet-nav-hub.js v1.1.2.b (intro dialog + page detection + navigation)
  3. ✅ Install page: install-bookmarklet.html v1.0.0 (drag-and-drop with instructions)
  4. ✅ Progress UI: library-fetcher.js (Option C - minimal overlay with phase updates)
  5. ✅ Progress UI: collections-fetcher.js (same pattern as library-fetcher)
  6. ✅ README: Added Quick Start section with installer link
  7. ✅ 5 UX Fixes: URLs corrected, navigation alerts added, time warnings added, button colors fixed
  8. ✅ Version displays: Added to installer and bookmarklet loader
  9. ✅ Tested on GitHub Pages server
  10. ✅ Fixed versioning bugs (bookmarklet v1.1.0 → v1.0.0)
  11. ✅ Documentation updated (CHANGELOG, TODO, NOTES)
- **Context**: GitHub Pages enabled at https://ron-l.github.io/readerwrangler/
- **Specification**: See future/SPEC-Distribution-GitHub-Pages.md
- **Pending Name Change (User Sleeping On Decision)**:
  - **Current**: Amazon Book Organizer
  - **Proposed**: My Library Organizer
  - **Tagline**: "Organize your Amazon book collection"
  - **Rationale**: Avoids trademark issues (Amazon, Kindle), future-proof for other platforms, clearly third-party
  - **Impact**: Minimal - just find/replace in files, GitHub repo rename (redirects work automatically)
  - **Timing**: Before public launch
- **Lesson Learned - Don't Reinvent the Wheel in Test/Diagnostic Code** (2025-11-12):
  - **Issue**: POC v1.0.0.a invented new CSRF token detection method (`input[name="anti-csrftoken-a2z"]`) instead of using proven production method
  - **Actual method**: `querySelector('meta[name="anti-csrftoken-a2z"]')` with `.getAttribute('content')` (library-fetcher.js lines 429-436)
  - **Why this matters**:
    1. Proven production methods are already tested and known to work
    2. Avoids introducing confounding variables (new method vs. actual issue)
    3. Test code should be a subset of production workflow when building up to it
  - **Action**: Always check production code for existing working methods before creating test/diagnostic code

### Phase 2.6 Partial Error Investigation - RELEASED ✅
- **Started**: 2025-11-05
- **Completed**: 2025-11-11 (v3.3.2)
- **Solution Implemented**: v3.3.2.b (partial error handling + statistics)
- **Validation**: Overnight fetch SUCCESSFUL - descriptions recovered for all 5 partial-error books
- **Root Cause**: GraphQL partial errors - Amazon returns valid description data + errors for customerReviewsTop field
- **Fix**: Check for data despite errors, only fail if no data returned
- **Status**: Complete and released as v3.3.2

### Dev/Prod Dual-Repo Workflow - COMPLETE ✅
- **Started**: 2025-11-23
- **Completed**: 2025-11-23
- **Status**: Complete - three-environment workflow operational

#### Setup
- Created `readerwranglerdev` repository for testing changes on GitHub Pages without affecting production
- Three bookmarklets: LOCAL (localhost), DEV (readerwranglerdev), PROD (readerwrangler.com)
- Enables testing bookmarklet-nav-hub.js and install pages before pushing to production

#### Three-Environment Bookmarklet Bug - Fixed
**Problem**: All three bookmarklets (LOCAL, DEV, PROD) navigated to wrong destinations due to hardcoded `TARGET_ENV = 'PROD'` in the old `bookmarklet-loader.js`.

**Solution**:
1. Renamed `bookmarklet-loader.js` → `bookmarklet-nav-hub.js`
2. Bookmarklets now inject `window._READERWRANGLER_TARGET_ENV` ('LOCAL', 'DEV', or 'PROD')
3. Nav hub reads from window variable with 'PROD' fallback for backwards compatibility
4. Added `isDevRepo` detection to `index.html` (was missing, causing DEV repo to show PROD bookmarklet)
5. Added console.log version output to installer pages for debugging cache issues

### Project Rename to ReaderWrangler - COMPLETE ✅
- **Started**: 2025-11-17
- **Completed**: 2025-11-24
- **Status**: Repository renamed, all files updated, deployed to production
- **New Name**: ReaderWrangler™
- **New GitHub URL**: https://ron-l.github.io/readerwrangler/

#### Rename Strategy
Two-phase approach for safety:
1. **Release 1 (v3.5.0)**: Repository rename + file updates
2. **Release 2 (v3.5.1)**: Enhanced getting started UX (see [docs/design/ENHANCED-GETTING-STARTED-UX.md](docs/design/ENHANCED-GETTING-STARTED-UX.md))

#### Files Changed
- `amazon-organizer.html` → `readerwrangler.html`
- `amazon-organizer.js`, `amazon-organizer.css` - Updated product name and generic descriptions
- `bookmarklet-nav-hub.js`, `install-bookmarklet.html` - Updated GitHub Pages URLs
- `SKILL-Amazon-Book-Organizer.md` → `SKILL-ReaderWrangler.md`
- `amazon-book-organizer.code-workspace` → `readerwrangler.code-workspace`
- README.md, CONTRIBUTING.md, TODO.md, NOTES.md - Updated project references

#### Rename Ground Rules Applied
- **KEPT Amazon references**: Legal/trademark notices, platform-specific features, historical CHANGELOG entries, technical instructions, Amazon-specific file functionality
- **CHANGED to generic**: Product descriptions, feature descriptions, UI text, file names, URLs

---

## Completed Work History

*Moved from TODO.md on 2025-11-24 during cleanup*

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

### Stable ASIN-Based IDs - COMPLETED (2025-11-24)

*Moved from TODO.md on 2025-11-24 during cleanup*

**Goal**: Fix book organization persistence by using stable ASIN-based IDs instead of sequential book-N IDs

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
- [x] Test that all 2343 books load correctly
- [x] Test that organization persists across reloads
- [x] Verify purchase date ordering is correct

### Fetcher Improvements - Phase 2 (Description Tracking & Reporting) - COMPLETED

*Moved from TODO.md on 2025-11-24 during cleanup*

**Goal**: Add comprehensive tracking and reporting for books without descriptions

**Status**: Completed and committed (commit e058725)

**Schema v3.0.0 Changes**:
- [x] Add metadata section to amazon-library.json (fetchDate, totalBooks, booksWithoutDescriptions)
- [x] Schema version "3.0.0"
- [x] booksWithoutDescriptions array: [{asin, title, authors}]

**Library Fetcher Enhancements**:
- [x] Track missing descriptions during Pass 2
- [x] Add end-of-run summary to console

**Organizer Support**:
- [x] Handle new JSON schema v3.0.0 (validates {metadata, books} structure)

**Collections Fetcher**:
- [x] Added named function wrapper for reusability (fetchAmazonCollections())

### Fetcher Improvements - Phase 2.5 (Description Investigation) - COMPLETED

*Moved from TODO.md on 2025-11-24 during cleanup*

**Goal**: Investigate why some books lack descriptions and explore alternative extraction methods

**Status**: ✅ COMPLETED - 99.91% description recovery achieved

- [x] Created 6 throwaway investigation/recovery scripts
- [x] Discovered 3 new extraction patterns (paragraph wrappers, AI summaries, recursive fragments)
- [x] Recovered 1,526 out of 1,528 missing descriptions
- [x] Updated library-fetcher.js v3.2.0 with all discovered patterns
- [x] Documented complete investigation in DESCRIPTION-RECOVERY-SUMMARY.md

**Results**:
- Traditional descriptions: 1,517 recovered
- AI summaries: 7 recovered
- Recursive extractions: 2 recovered
- Only 2 books genuinely lack descriptions on Amazon (verified manually)

### Fetcher Improvements - Phase 2.6 (Partial Error Investigation) - COMPLETED (2025-11-11)

*Moved from TODO.md on 2025-11-24 during cleanup*

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
- [x] Update CHANGELOG.md with v3.3.2 release - DONE
- [x] Archive diagnostic scripts - DONE (60 files in archived-investigations/phase-2.6-partial-errors/)

**See also**: archived-investigations/phase-2.6-partial-errors/ for investigation scripts and documentation

### Release v3.3.2 - COMPLETED (2025-11-11)

*Moved from TODO.md on 2025-11-24 during cleanup*

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

**Note**: This release followed the "Build Solid Foundation" approach - spent 6 days investigating 3/2666 failures (0.15%) because library management requires 100% data coverage

### Bugs Fixed - COMPLETED (various dates)

*Moved from TODO.md on 2025-11-24 during cleanup*

- [x] **Description fetching is broken** - FIXED in v3.1.2 - Description extraction now works correctly
- [x] **Missing books in organizer UI** - FIXED in v3.3.0.c - Switched to stable ASIN-based IDs
- [x] **"Clear Library" feature** - FIXED in v3.3.2.m - Simplified from complex dialog to single button
  - Replaced "Reset Organization" and "Clear Everything" dialog with single "Clear Library" button
  - Based on proven v3.2.1 clearEverything pattern
  - Complete reset: unloads library, removes columns, clears organization, resets to pristine state
  - Simple confirm() dialog explains what will be cleared
  - User tested and confirmed: "works exactly as expected!"

### Fetcher Improvements - Phase 4 (Reliability & Data Quality) - COMPLETED

*Moved from TODO.md on 2025-11-24 during cleanup*

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

- [x] **Add timing information to fetcher output**: ✅ COMPLETED in v3.3.0
  - Track start time for each phase (Phase 0, Pass 1, Pass 2, Merge, Manifest)
  - Comprehensive timing breakdown in final statistics output
  - Shows phase-by-phase duration with formatted times (e.g., "1h 23m 45s")
  - Helps users understand performance and estimate future fetches

### Collections Integration - Data Merge COMPLETED

*Moved from TODO.md on 2025-11-24 during cleanup*

**Status**: Collections data successfully merged into organizer

- [x] Build collections fetcher script (collections-fetcher.js v1.0.0)
- [x] Test collections fetcher (successfully fetched 2,280 books in 3m 56s)
- [x] Generate amazon-collections.json with all collection data
- [x] HTML refactor complete (v3.2.0) - modular structure ready for integration
- [x] Merge v3.2.0 refactor to main
- [x] Pull refactored main into feature-collection-read-status-exploration
- [x] Load and merge collections data with library data in organizer
  - Console shows: "📚 Collections data merged: 1163 books have collections"
  - Read status tracked: 642 READ, 1 UNREAD, 1700 UNKNOWN

### README Refactor Plan - COMPLETED

*Moved from TODO.md on 2025-11-24 during cleanup*

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

**Status**: Completed

---

### Review Data Analysis & GraphQL API Investigation - IN PROGRESS 🔄
- **Started**: 2025-11-10
- **Goal**: Investigate missing review text (topReviews) and test alternative GraphQL root fields
- **Context**:
  - Overnight fetch succeeded but 31/2344 books (1.3%) have `reviewCount > 0` but `topReviews: []` (empty array)
  - All 31 books DO have reviews on Amazon - this is a data retrieval issue, not lack of reviews
  - Amazon's GraphQL API has multiple root fields that might retrieve reviews differently
- **Analysis Complete**:
  - Created `analyze-review-data.js` to scan library for missing review data
  - 31 books (1.3%) missing topReviews despite having reviews
  - NO CORRELATION between high review count and missing data
  - Only 2 books with 500+ reviews missing data (0.1%)
  - Median reviewCount for size-mismatch books: 5 reviews
- **Test Scripts Created** (browser console):
  1. `test-04-getProduct-failure.js` - Reproduce getProduct (singular) partial error
  2. `test-04-getProductByAsin-hybrid.js` - Test getProductByAsin on modern endpoint
  3. `test-04-compare-all-root-fields.js` - Side-by-side comparison of all three root fields
  4. `test-amazon-popup-api.js` - Earlier script testing Amazon's popup query structure
- **GraphQL Root Fields to Test**:
  1. `getProducts` (plural) - current library-fetcher method with `x-client-id: your-books`
  2. `getProduct` (singular) - Amazon popup method with `x-client-id: quickview`
  3. `getProductByAsin` - old endpoint method, testing on modern endpoint
- **Top 3 Test Books** (highest review counts with missing topReviews):
  1. Lethal Code (B00J9P2EMO): 1,674 reviews, 0 topReviews
  2. Cats (B0085HN8N6): 621 reviews, 0 topReviews
  3. Queen's Ransom (0684862670): 83 reviews, 0 topReviews
- **Phase 3 Retry Proposal**: After test results, implement v3.4.0 feature to retry missing reviews during refresh
- **Next Steps**:
  1. ✅ Create GraphQL-API-Reference.md documenting findings
  2. ✅ Update TODO.md with Phase 3 retry logic for v3.4.0
  3. ✅ Implement Clear Everything dialog (v3.3.2.a)
  4. 🐛 Fixed bug in Clear Everything: library clear now properly clears organization too
  5. ⏳ Test Clear Everything dialog fixes
  6. ⏳ Release v3.3.2

---

#### **The 3 Problematic Books:**

1. **Cats** - Position 2019 (87% through, ~144 minutes):
   - Title: "99 Reasons to Hate Cats: Cartoons for Ca..."
   - ASIN: **B0085HN8N6** (Kindle Edition)
   - Error: "Customer Id or Marketplace Id is invalid."

2. **Queen's Ransom** - Position 2321 (final 1%):
   - ASIN: **0684862670** (10-digit ISBN format)
   - Error: "Customer Id or Marketplace Id is invalid."

3. **To Ruin A Queen** - Position 2322 (final 1%):
   - ASIN: **0684862689** (10-digit ISBN format)
   - Error: "Customer Id or Marketplace Id is invalid."

---

#### **ALL Theories Tested & Results:**

| Theory | Test Method | Result | Status |
|--------|-------------|--------|--------|
| **Token Staleness** | Diagnostic used fetcher's 2.5-hour-old token | All 3 books **SUCCEEDED** with stale token | ❌ DISPROVEN |
| **Single Book Repetition** | Queen's Ransom 2500x in 19 minutes | 2500/2500 **SUCCEEDED** | ❌ DISPROVEN |
| **2-Book Variety** | Kindle + Queen alternating 2500x in 19 minutes | 2500/2500 **SUCCEEDED** | ❌ DISPROVEN |
| **High Variety (Fast)** | 2344 different books in 37 minutes | 4688 requests **SUCCEEDED** | ❌ DISPROVEN |
| **Time (144 min)** | 1744 books over 144 min, then Cats | Cats **SUCCEEDED** after 144 min | ❌ DISPROVEN |
| **ISBN Format Issues** | All tests used ISBN books | ISBNs work perfectly | ❌ DISPROVEN |
| **Position-Based** | Inserted 2 copies of first book at start | Failures shifted by +2 positions | ❌ DISPROVEN |
| **Fresh Token Retry** | Full fetch with auto token refresh on failure | Token unchanged, fresh token FAILS with same error | ❌ DISPROVEN |
| **Sequence-Dependent** | Shuffle books 0-2037, fetch in shuffled order | Cats still FAILED at position 2038 | ❌ DISPROVEN (for sequential) ⚠️ MATTERS for alternating |

---

#### **What We Know:**

✅ **Failures are deterministic** - Same 3 books fail at consistent positions (87%, 100%, 100%)
✅ **Position shift confirmed** - Inserting 2 books at start shifted failures by exactly +2 positions
✅ **Error is book-specific** - Not token, time, variety, or position alone
✅ **Books work individually** - All diagnostic tests succeed when books tested in isolation
✅ **Fast recovery** - Diagnostic succeeds 35 seconds after fetcher fails
✅ **Not ISBN-related** - Kindle book (Cats) fails too, ISBN books succeed in all isolated tests

❓ **Still Unknown:**
- Why do these specific books fail during full fetch but succeed in isolation?
- Why does the error say "Customer Id or Marketplace Id is invalid" (suggests auth/session issue)?
- Is it a combination of: time + variety + specific book sequence + server-side state?
- Is the failure non-deterministic (Amazon server state varies)?

---

#### **Test History:**

**Test 1 - Queen Repetition (diag-02-queen-repetition-test.js)**
- Pattern: Queen's Ransom 2500 consecutive times
- Duration: 19 minutes
- Result: 2500/2500 succeeded
- Conclusion: Single book repetition is NOT the issue

**Test 2 - Alternating 2 Books (diag-03-alternating-test.js)**
- Pattern: Kindle book + Queen's Ransom alternating (2500 total requests)
- Duration: 19 minutes
- Result: 2500/2500 succeeded
- Conclusion: 2-book variety is NOT the issue

**Test 3 - Full Library Fast (diag-04-full-library-alternating.js)**
- Pattern: All 2344 library books alternating with Queen's Ransom
- Duration: 37 minutes
- Result: 4688 requests (2344 library + 2344 Queen) succeeded
- Conclusion: High variety at fast speed is NOT the issue

**Test 4 - Time-Based Slow (diag-05-time-based-cats-test.js)**
- Pattern: 1744 books with 4.5s delays (144 min), then Cats book
- Duration: 144 minutes
- Result: Cats succeeded with 939 char description
- Conclusion: TIME alone (144 min) is NOT the issue

**Test 5 - Token Staleness**
- Pattern: Diagnostic used fetcher's 2.5-hour-old CSRF token
- Duration: 30 seconds
- Result: All 3 books (Cats + 2 Queens) succeeded with stale token
- Conclusion: Token staleness is NOT the issue

**Test 6 - Fresh Token Retry (v3.3.1.c)**
- Pattern: Full library fetch with auto token refresh on failure
- Duration: 2h 39m (2323 books)
- Result: 5 failures at same positions (2322, 2323 = Queens)
- Token comparison: IDENTICAL (tokens don't change during session)
- Fresh token retry: FAILS with same "Customer Id or Marketplace Id is invalid"
- Conclusion: Token refresh does NOT solve the problem
- **Key Finding**: Even with fresh token, same books fail with same error

**Test 7 - Shuffle Sequence (diag-06-shuffle-test.js)**
- Pattern: Shuffle books 0-2018, keep 2019+ in original order, fetch in shuffled order
- Duration: ~2 hours (2344 books)
- Result: Cats FAILED at position 2038 (18 positions later than expected due to shuffle)
- **Key Finding**: Cats still failed even with shuffled sequence before it
- Conclusion: Sequence does NOT matter - failure is about cumulative properties
- **IMPORTANT**: Test 3 (alternating with Queen) showed sequence CAN matter when alternating with known-good books keeps cache fresh
- **Summary**: Two distinct behaviors observed:
  1. **Alternating pattern**: Interleaving failing books with others prevents failures (keeps cache fresh)
  2. **Sequential pattern**: Processing ~2000+ different books (any order) triggers failures

---

#### **Test 8 - Reverse Binary Search (COMPLETED WITH CAVEAT)**

**Test 8a - Apoc Toxic Test (diag-08a-apoc-toxic-test.js)**
- Pattern: Fetch "Exponential Apocalypse" (position 2036), then Cats (position 2037)
- Duration: ~6 seconds
- Result: Both SUCCEEDED
- Conclusion: Position 2036 is NOT the poison for Cats

**Test 8b - Reverse Walk to Find Poison (diag-08b-apoc-reverse-walk.js)**
- Pattern: Walk backwards from Cats to find its poison
- Result: Created but superseded by Test 9

**Test 9 - Toxic Book Test (diag-09-toxic-book-test.js)**
- Pattern: Test if "Exponential Apocalypse" poisons Cats, Queen 1, Queen 2
- Duration: ~30 seconds
- Result: All victims SUCCEEDED
- Conclusion: Apoc is NOT universally toxic

---

#### **Test 10-12 - Queens Reverse Binary Search (COMPLETED - FLAWED BUT VALUABLE)**

**CRITICAL NOTE**: Tests 10-12 were flawed due to context compaction error:
- **Intended target**: Position 2037 (Cats - "99 Reasons to Hate Cats", ASIN B0085HN8N6)
- **Actual target**: Position 2321 (Wrong "Queen" - searched for "Queen" in title instead of using known victim ASIN)
- **ASIN used**: 0425197484 (Undead and Unemployed - Queen Betsy Book 2) - NOT a known victim
- **Result**: Tests completed successfully but targeted wrong book
- **Value**: Despite flaw, Test 12 revealed 4 consistently unenrichable books

**Test 10 - Queens Reverse Binary Search (diag-10-queens-reverse-binary-search.js)**
- Pattern: Exponential growth backwards (1, 2, 4, 8... books before "Queen")
- Duration: Created but not run (superseded by Test 11/12)
- Status: Preserved as-is (flawed but produced valuable clues)

**Test 11 - Queens Reverse with File Output (diag-11-queens-reverse-with-file-output.js)**
- Pattern: Same as Test 10 but with per-iteration file downloads
- Problem: Caused dialog spam (file picker for each iteration)
- Status: Superseded by Test 12

**Test 12 - Queens Reverse Sparse Output (diag-12-queens-reverse-sparse-output.js)** ✅
- Pattern: Same logic as Test 10/11, sparse console output, single file at end
- Duration: ~7 hours (148 minutes active fetching)
- Total books processed: 2322 across 13 iterations
- Results saved to:
  - `test-12-console-results.txt` (2472 lines)
  - `test-12-final-results.json` (downloaded)
  - `window.queensReverseBinarySearchResults` (backup)

**Test 12 Results Summary:**

| Iteration | Books Fetched | Range | Duration | Failures | Failed Positions |
|-----------|--------------|-------|----------|----------|------------------|
| 1-9 | 2-257 | Various | 0-14 min | 0 | None |
| 10 | 513 | [1809, 2321] | 30 min | 1 | 2037 (Cats) |
| 11 | 1025 | [1297, 2321] | 63 min | 3 | 1649, 1784, 2037 |
| 12 | 2049 | [273, 2321] | 121 min | 3 | 1649, 1784, 2037 |
| 13 | 2322 | [0, 2321] | 148 min | 4 | 1251, 1649, 1784, 2037 |

**Four Books Consistently Failed (NOT the original 3 victims):**
1. Position 1251: "Property of a Lady Faire" (ASIN B00G3L6L3U)
2. Position 1649: "By Tooth and Claw" (ASIN B00URTZQHG)
3. Position 1784: "Lethal Code" (ASIN B00J9P2EMO)
4. Position 2037: "99 Reasons to Hate Cats" (ASIN B0085HN8N6) ← Original victim

**Key Findings:**
- ✅ Failures are 100% reproducible and position-based
- ✅ Same 4 books fail EVERY time they're included in the range
- ✅ Failures NOT dependent on cumulative fetch count or iteration number
- ✅ "Queen" (position 2321, ASIN 0425197484) NEVER failed in any iteration
- ⚠️ **CRITICAL**: These 4 books ARE successfully enriched in full library fetch
- ⚠️ They only fail in Test 12 due to cumulative poison from earlier books
- 📊 Iteration 9 vs 10 shows clear threshold: 257 books → success, 513 books → failure

**Implications:**
- Original hypothesis (position 2037 poisons Queens) was WRONG
- Test 12's flawed target accidentally revealed cumulative poison pattern
- Position 2037 (Cats) is a VICTIM, not inherently unenrichable
- Failure threshold exists between 257 and 513 books before Cats

---

#### **Test 13 - Binary Search for Minimum Poison Threshold - IN PROGRESS**

**Goal**: Find MINIMUM number of books needed to make position 2037 (Cats) fail

**Method**: Multiplicative range adjustment (×0.5 on failure, ×1.5 on success)
- Initial discovery: Step 2A found range [2001, 2037] = 37 books causes failure
- Current status: Testing smaller ranges to find minimum threshold

**Step 0 - Baseline Confirmation (diag-13-binary-search-step-0.js)** - SKIPPED
- Reason: Superseded by Step 2A discovery

**Step 1 - First Binary Search (diag-13-binary-search-step-1.js)** - COMPLETED
- Range: [1937, 2321] = 385 books
- Duration: ~23 minutes
- Result: Cats FAILED
- Note: Used flawed midpoint approach, replaced by multiplicative method

**Step 2 - Second Binary Search (diag-13-binary-search-step-2.js)** - COMPLETED
- Range: [2001, 2321] = 321 books
- Duration: ~19 minutes
- Result: Cats FAILED
- Note: Still using flawed approach

**Step 2A - Verbose Diagnostic (diag-13-binary-search-step-2a.js)** - CRITICAL DISCOVERY ✅
- Intended range: [2001, 2321] = 321 books
- Actual range tested: [2001, 2037] = 37 books (stopped at victim)
- Duration: ~2 minutes
- Result: Cats FAILED
- **Key finding**: Only 37 books needed to reproduce error!
- Change: Added per-fetch output, discovered timing (0.2s fetch + 3s delay)

**Step 3 - Corrected Binary Search (diag-13-binary-search-step-3.js)** - SUPERSEDED
- Range: [2161, 2321] = 161 books
- Status: Created but never run due to approach change

**Step 3 - Multiplicative Approach (diag-13-binary-search-step-3a.js)** - COMPLETED ✅
- Previous: [2001, 2037] = 37 books → FAILED
- Current: [2020, 2037] = 18 books (37 × 0.5)
- Duration: ~1 minute (57 seconds)
- Result: **Cats FAILED (100% reproducible across 3 test runs)**
- Error: "Customer Id or Marketplace Id is invalid."
- **Achievement**: Can reproduce poison in just 1 minute with 18 books!
- Note: Initially named step-3a.js (variant of Step 3 range attempt)
- Next: [2029, 2037] = 9 books (18 × 0.5)

**Step 4 - Further Reduction (diag-13-binary-search-step-4.js)** - COMPLETED ✅
- Range: [2029, 2037] = 9 books (18 × 0.5)
- Duration: ~30 seconds actual
- Result: **Cats FAILED (100% reproducible across 3 test runs)**
- Error: "Customer Id or Marketplace Id is invalid."
- **Achievement**: Can reproduce poison in just 30 seconds with 9 books!
- Next: [2033, 2037] = 5 books (9 × 0.5 = 4.5 → 5)

**Step 5 - Minimal Range (diag-13-binary-search-step-5.js)** - READY
- Range: [2033, 2037] = 5 books (9 × 0.5 = 4.5 → 5)
- Duration: ~15 seconds estimated
- Status: Script ready for execution

**Antidote Discovery:**
When full fetch fails (Cats + 2 Queens fail), running the 5-book diagnostic test (`test-isbn-enrichment.js`) immediately after causes victims to recover and succeed. This test uses a different API endpoint and query structure that appears to clear the poisoned state.

**Key Differences in Antidote Test (test-isbn-enrichment.js):**
1. **Different API endpoint**: `/digital-graphql/v1` vs `/kindle-reader-api`
2. **Shorter delay**: 1.5s vs 3s between requests
3. **Different query**: Uses `getProductByAsin` with variables vs `getProducts` with inline ASIN
4. **No CSRF token**: Uses only `credentials: 'include'`, no CSRF token required
5. **Total duration**: ~7.5 seconds (5 books × 1.5s delay)

**Antidote Theories:**
1. **Different endpoint resets state**: Switching between `/digital-graphql/v1` and `/kindle-reader-api` clears corruption
2. **Time-based recovery**: 7.5 second duration allows API to recover from poisoned state
3. **Query structure bypass**: Different GraphQL schema (`getProductByAsin` vs `getProducts`) hits different code path that bypasses corrupted cache

---

#### **Test 14 - Antidote Phase Tests (Nov 9, 2025) - BREAKTHROUGH DISCOVERY ✅**

**CRITICAL DISCOVERY**: The entire investigation was based on a false premise. The "failures" were actually **PARTIAL ERRORS** - Amazon successfully returned descriptions but also returned errors for the `customerReviewsTop` field.

**Phase 0 - Null Antidote Tests:**
- **Phase 0** (`antidote-test-00-null.js`): Test if repeated fetches with varying delays clear failure state
- **Phase 0a** (`antidote-test-00a-null.js`): Same but hardcoded for Cats book specifically
- **Result**: All fetches failed as expected - confirmed failure is sticky
- **Purpose**: Establish baseline that timing alone doesn't fix the issue

**Phase 1 - Alternative Endpoint Tests:**
- **Phase 1** (`antidote-test-01-endpoint.js`): Test if `/digital-graphql/v1` endpoint works
- **Phase 1a** (`antidote-test-01a-endpoint-debug.js`): Test multiple endpoint URL variations
- **Result**: ALL FAILED - `/digital-graphql/v1` endpoint returns 404 (NO LONGER EXISTS)
- **Critical Finding**: Amazon deprecated this endpoint between Nov 5-9, 2025
- **Impact**: `test-isbn-enrichment.js` worked on Nov 5 but fails today - endpoint gone
- **This explains**: Why our "antidote" no longer works - the endpoint itself was removed

**Phase 2 - Amazon's Own Method (SUCCESSFUL SOLUTION) ✅:**
- **Investigation**: Inspected Network tab when clicking Cats book on amazon.com/yourbooks
- **Discovery**: Amazon's own page DOES get description successfully!
- **Key Finding**: Only `customerReviewsTop` field fails with "Customer Id or Marketplace Id is invalid"
- **Amazon's Query Differences**:
  1. Uses `getProduct` (singular) not `getProducts` (plural)
  2. Uses `x-client-id: quickview` not `x-client-id: your-books`
  3. Requests `customerReviewsSummary` (count/rating) instead of `customerReviewsTop` (individual review text)
  4. Description succeeds even when reviews section has errors

**Phase 2 Test Scripts:**
- **Phase 2** (`antidote-test-02-amazon-method.js`): Mimic Amazon's exact query structure
- **Phase 2a** (`antidote-test-02a-debug-response.js`): Debug why description was undefined
- **Discovery**: `content` field structure varies - can be string OR object with `.text` property
- **Fix Applied**: Updated extraction to handle both cases:
  ```javascript
  const descSection = product.description?.sections?.[0]?.content;
  let description = '';
  if (typeof descSection === 'string') {
      description = descSection;
  } else if (descSection?.text) {
      description = descSection.text;
  }
  ```
- **Result**: ✅ SUCCESS - Got 939-character description for Cats with ZERO errors!
- **Test Results**:
  - Title: 99 Reasons to Hate Cats: Cartoons for Cat Lovers
  - Author: Tom Briscoe
  - Description: 939 characters (full text)
  - Review Count: 621 reviews
  - Rating: 4.1 stars
  - Duration: 0.15 seconds
  - Errors: NONE

**Root Cause Analysis:**

The problem was NOT with the books themselves. The problem was with our error handling:

1. **Amazon's Response**: GraphQL can return BOTH data AND errors (partial errors)
   ```json
   {
     "data": {
       "getProducts": [{
         "description": { "sections": [...] },  // ✅ SUCCESS
         "customerReviewsTop": null              // ❌ FAILED
       }]
     },
     "errors": [{
       "message": "Customer Id or Marketplace Id is invalid.",
       "path": ["getProducts", 0, "customerReviewsTop", "reviews"]
     }]
   }
   ```

2. **Our Code** (library-fetcher.js line 1237-1240):
   ```javascript
   if (data.errors) {
       const errorMsg = data.errors[0]?.message || 'Unknown GraphQL error';
       return { apiError: true, errorMessage: errorMsg };
   }
   // Never reaches here to extract description from data.data!
   ```

3. **The Mistake**: We rejected the ENTIRE response if `data.errors` existed, even though `data.data.getProducts[0].description` contained valid description data

4. **Why Test 3 Worked (Alternating)**: Interleaving with other books kept cache/state fresh, preventing the `customerReviewsTop` error from occurring

5. **Why Individual Tests Worked**: Single book fetches or small sequences didn't trigger whatever server-side condition causes the `customerReviewsTop` failure

**The Solution:**

**Option A: Partial Error Handling** (RECOMMENDED)
- Change error handling to check if we got data despite errors
- Extract description from `data.data` even if `data.errors` exists
- Only fail if both no data AND errors present
- Simplest fix - just 5 lines of code changed
- Preserves existing `getProducts` query structure
- Will still log errors for debugging but won't discard valid descriptions

**Implementation**:
```javascript
if (data.errors) {
    // Check if we still got data despite errors (partial error)
    if (data.data?.getProducts?.[0]) {
        console.log(`   ⚠️ Partial error: ${data.errors[0]?.message || 'Unknown'}`);
        console.log(`   📦 But got data anyway - continuing...`);
        // Continue to extract description from data.data
    } else {
        // Total failure - no data at all
        return { apiError: true, errorMessage: errorMsg };
    }
}
```

**Worrying Observations:**

1. **Sequence Dependency**: Some diagnostic tests showed sequence-dependent errors - same books succeeded individually but failed when preceded by certain book sequences. This behavior is confusing and suggests server-side state management issues.

2. **Endpoint Deprecation**: `/digital-graphql/v1` endpoint worked on Nov 5 but returns 404 on Nov 9. Amazon can deprecate endpoints without warning, breaking our code. This is EXTREMELY worrying for long-term maintenance.

3. **Cumulative State**: The "poison" behavior suggests Amazon's API maintains some kind of cumulative state across requests that can cause failures. The exact mechanism is unknown and could change at any time.

**Lessons Learned:**

1. **🚨 CRITICAL LESSON - Investigate Raw Response First**: We spent DAYS trying to quantify and narrow down the error through elaborate binary search and diagnostic tests. If we had simply inspected the raw GraphQL response dump from `getProducts`, we would have immediately seen it was a partial error with valid description data present. Always examine raw API responses before building complex reproduction scenarios.

2. **Improve Error Logging**: The fetcher code needs to dump the raw error message AND indicate whether data was still returned. Current error handling is too binary (error = total failure). Need to distinguish:
   - Total failure (no data at all)
   - Partial error (some fields failed but others succeeded)
   - This would have revealed the issue immediately

3. **Check Network Tab Early**: Browser Network tab inspection should be done EARLY in investigation, not as "last resort". It shows exactly what Amazon's own page does and can reveal successful patterns we should mimic.

4. **Don't Assume Binary Outcomes**: GraphQL supports partial errors by design. Our code assumed "errors = total failure" when GraphQL explicitly allows "errors + data = partial success".

5. **Document Endpoint Dependencies**: When code relies on external APIs, document the endpoints and monitor for deprecation. The `/digital-graphql/v1` deprecation broke our "antidote" without warning.

**Phase 3 - Validate Option A (ALL 3 VICTIMS) ✅:**
- **Test**: `antidote-test-03-three-victims.js` - Test all 3 problem books with original `getProducts` query
- **Books tested**: Cats (B0085HN8N6), Queen's Ransom (0684862670), To Ruin A Queen (0684862689)
- **Result**: ALL 3 books had partial errors (errors + data)
  - Cats: 939 chars description ✅, partial error (customerReviewsTop failed)
  - Queen's Ransom: 0 chars extracted (has `fragments` structure), partial error (customerReviewsTop failed)
  - To Ruin A Queen: 230 chars description ✅, partial error (customerReviewsTop failed)
- **Key Finding**: Queen's Ransom description exists but uses `fragments` array - library-fetcher already handles this with `extractTextFromFragments()`
- **Conclusion**: Option A CONFIRMED - all 3 victims return descriptions despite customerReviewsTop errors

**Implementation - library-fetcher.js v3.3.2.b:**
- ✅ v3.3.2.a: Implemented partial error handling at enrichment query
- ✅ v3.3.2.a: Enhanced error logging with raw response dumps for ALL error paths
- ✅ v3.3.2.a: Distinguishes partial errors (data + errors) from total failures (errors only)
- ✅ v3.3.2.a: Logs error path and raw error details for debugging
- ✅ v3.3.2.b: Added statistics tracking for partial errors
- ✅ v3.3.2.b: Added final summary reporting section for partial errors
- ✅ v3.3.2.b: Shows position, title, ASIN, error message, and error path for each partial error
- **Status**: READY FOR TESTING - Run full library fetch overnight (~3 hours)

**Next Steps:**

1. ✅ Update NOTES.md with Phase 3 findings
2. ✅ Implement Option A in library-fetcher.js v3.3.2.b
3. 🔄 Run full library fetch overnight (~3 hours)
4. Extract investigation into separate NOTES-AMAZON-FETCH-ISSUE.md file
5. Update CHANGELOG.md with v3.3.2.a changes

**Missteps and Corrections:**
1. **Initial binary search logic**: Tried to find midpoint between start positions instead of halving range size
2. **Upper/lower bounds confusion**: Terminology was confusing, simplified to previous/current/next
3. **Progress calculation error**: Was using absolute position instead of relative position in range
4. **Time estimation error**: Conservative estimate was way off, added actual timing measurement
5. **Binary search approach**: Switched from traditional midpoint to multiplicative range adjustment (×0.5/×1.5)

**Protocol**:
1. Fresh page refresh before each test
2. Manual execution (paste script in console)
3. Report success/failure to get next range
4. Each test takes ~30 seconds to 2 minutes

---

#### **Files & Scripts:**

**Diagnostic Scripts (Browser Console):**
- `diag-01-isbn-enrichment.js` - Tests 5 books with complete extraction logic
- `diag-02-queen-repetition-test.js` - Queen only 2500x (Test 1)
- `diag-03-alternating-test.js` - 2-book alternating 2500x (Test 2)
- `diag-04-full-library-alternating.js` - Full library fast (Test 3)
- `diag-05-time-based-cats-test.js` - Time-based slow fetch (Test 4)
- `diag-06-shuffle-test.js` - Shuffle sequence test (Test 7)
- `diag-08a-apoc-toxic-test.js` - Tests if position 2036 poisons Cats (Test 8a)
- `diag-08b-apoc-reverse-walk.js` - Walk backwards from Cats (superseded by Test 9)
- `diag-09-toxic-book-test.js` - Tests if Apoc poisons Cats/Queens (Test 9)
- `diag-10-queens-reverse-binary-search.js` - Reverse binary search (flawed target)
- `diag-11-queens-reverse-with-file-output.js` - With file output (dialog spam issue)
- `diag-12-queens-reverse-sparse-output.js` - Sparse output, single file (Test 12) ✅
- `diag-13-binary-search-step-0.js` - Baseline confirmation (skipped)
- `diag-13-binary-search-step-1.js` - Binary search [1937, 2321] = 385 books (completed, flawed approach)
- `diag-13-binary-search-step-2.js` - Binary search [2001, 2321] = 321 books (completed, flawed approach)
- `diag-13-binary-search-step-2a.js` - Verbose [2001, 2037] = 37 books (completed, key discovery) ✅
- `diag-13-binary-search-step-3.js` - Binary search [2161, 2321] = 161 books (superseded)
- `diag-13-binary-search-step-3a.js` - Step 3 [2020, 2037] = 18 books (completed, 1-min repro) ✅
- `diag-13-binary-search-step-4.js` - Step 4 [2029, 2037] = 9 books (completed, 30-sec repro) ✅
- `diag-13-binary-search-step-5.js` - Step 5 [2033, 2037] = 5 books (ready)

**Antidote Test Scripts (Browser Console):**
- `antidote-test-00-null.js` - Phase 0: Null antidote (repeated fetches with varying delays)
- `antidote-test-00a-null.js` - Phase 0a: Null antidote hardcoded for Cats
- `antidote-test-01-endpoint.js` - Phase 1: Test `/digital-graphql/v1` endpoint (FAILED - 404)
- `antidote-test-01a-endpoint-debug.js` - Phase 1a: Test multiple endpoint variations (all 404)
- `antidote-test-02-amazon-method.js` - Phase 2: Mimic Amazon's `getProduct` query (SUCCESS!) ✅
- `antidote-test-02a-debug-response.js` - Phase 2a: Debug response structure
- `antidote-test-03-three-victims.js` - Phase 3: Validate Option A with all 3 victims (CONFIRMED!) ✅

**Test Result Files:**
- `test-12-console-results.txt` - Test 12 console output (2472 lines)
- `test-12-final-results.json` - Test 12 structured results (downloaded)

**Instruction Files:**
- `output-01-diagnostic-fetch-instructions.txt` - 5-book diagnostic test
- `output-02-queen-test-instructions.txt` - Queen repetition test (Test 1)
- `output-03-alternating-test-instructions.txt` - 2-book alternating (Test 2)
- `output-04-full-library-instructions.txt` - Full library fast (Test 3)
- `output-05-time-test-instructions.txt` - Time-based slow (Test 4)
- `output-06-shuffle-test-instructions.txt` - Shuffle sequence (Test 7)

**Investigation/Analysis Scripts (Node.js):**
- `test-isbn-enrichment.js` - "Antidote" test (5 books, different API endpoint, succeeds after full fetch fails)
- `analyze-library.js` - Library analysis utility
- `check-duplicate-asins.js` - ASIN duplicate checker
- `diff-libraries.js` - Library comparison tool
- `verify-fetch.js` - Fetch verification utility

**Main Fetcher:**
- `library-fetcher.js` v3.3.2.a - Partial error handling (handles GraphQL errors + data responses correctly)

### Stable ASIN-Based IDs - IN PROGRESS
- **Started**: 2025-11-05
- **Status**: Testing stable ID implementation (v3.3.0.c)
- **Goal**: Fix book organization persistence and restore purchase date ordering
- **Problem Discovered**:
  - Books were using sequential IDs (`book-0`, `book-1`, etc.)
  - When library reloaded in different order, IDs changed
  - localStorage had 2325 books (book-0 to book-2337), but current library had 2343 books
  - 5 books at end of library weren't rendering (IDs didn't match saved organization)
- **Solution**:
  - Use ASIN as stable book ID (persists across reloads)
  - Sort by acquisition date (newest first) to restore familiar ordering
  - Clear IndexedDB and localStorage to start fresh
  - Opted against migration (99% still unorganized, simpler to start clean)
- **Changes Made**:
  - ID generation: `book-${i}` → `item.asin`
  - Added purchase date sort with robust invalid date handling
  - Removed complex migration logic
  - Version: v3.3.0.c
- **Next Steps**: Test library loading, verify all 2343 books appear, confirm organization persists

### Phase 2.5 - Description Investigation - RELEASED ✅
- **Started**: 2025-11-03
- **Completed**: 2025-11-04
- **Status**: ✅ COMPLETE - 99.91% description recovery achieved
- **Goal**: Understand why some books lack descriptions
- **Approach**:
  1. Created 6 throwaway investigation/recovery scripts
  2. Discovered 3 new extraction patterns (paragraph wrappers, AI summaries, recursive fragments)
  3. Recovered 1,526 out of 1,528 missing descriptions
  4. Updated library-fetcher.js v3.2.0 with all discovered patterns
  5. Documented complete investigation in DESCRIPTION-RECOVERY-SUMMARY.md
- **Results**:
  - Traditional descriptions: 1,517 recovered
  - AI summaries: 7 recovered
  - Recursive extractions: 2 recovered
  - Only 2 books genuinely lack descriptions on Amazon (verified manually)

### Phase 2 - Schema v3.0.0 & Description Tracking - RELEASED ✅
- **Started**: 2025-11-03
- **Completed**: 2025-11-03
- **Committed**: commit e058725
- **Changes Made**:
  - **Library Fetcher v3.1.3.b**: Tracks books without descriptions, outputs schema v3.0.0 with metadata
  - **Organizer v3.3.0.a**: Validates schema v3.0.0, extracts and logs metadata
  - **Collections Fetcher v1.0.1.a**: Added named function wrapper for reusability
  - **Documentation**: Updated CHANGELOG.md with Unreleased section, updated TODO.md
- **Schema v3.0.0**: `{metadata: {...}, books: [...]}`
  - Metadata includes: schemaVersion, fetcherVersion, fetchDate, totalBooks, booksWithoutDescriptions
  - Tracks detailed list of books missing descriptions
- **Testing**: Successfully tested with user's library (5 new books, 2 without descriptions)
- **Status**: Complete and committed, ready for release

### Multi-Select with Ctrl/Shift Clicking - RELEASED ✅
- **Started**: 2025-11-12
- **Released**: 2025-11-12 (v3.4.0)
- **Status**: ✅ COMPLETE - All features working as expected
- **Features Implemented**:
  - Single-click: Select book (replaces selection)
  - Ctrl+Click: Toggle selection (add/remove from multi-select)
  - Shift+Click: Range selection (within same column)
  - Double-click: Open book detail modal
  - Bulk drag-and-drop: Move all selected books together
  - Right-click context menu: Quick bulk move to other columns
  - Visual feedback: Blue outline, checkmark badge, selection count indicator
  - ESC key and click empty space: Clear selection
- **Key Technical Fixes**:
  - Modified handleMouseDown to skip drag initiation when modifier keys pressed
  - Fixed selectBookRange to correctly compare book IDs (was comparing objects)
- **User Tested**: All features confirmed working

### Collections & Read Status Integration - DATA MERGED ✅, UI PENDING
- **Started**: 2025-10-19
- **Branch**: feature-collection-read-status-exploration
- **Status**: Collections data successfully merged into organizer, UI features incomplete
- **Completed Steps**:
  1. ✅ HTML refactor complete (v3.2.0 released)
  2. ✅ Pulled refactored main into collections branch
  3. ✅ Integrated collections data into organizer (merge by ASIN)
     - Console output: "📚 Collections data merged: 1163 books have collections"
     - Read status tracked: 642 READ, 1 UNREAD, 1700 UNKNOWN
- **Next Steps**:
  1. Add visual indicators (badges/icons) for collections on book covers
  2. Add metadata display showing which collections each book belongs to
  3. Add filtering by collection name and read status
  4. Implement "Uncollected" pseudo-collection

**Background:**
- User marks finished books as "Read" in Amazon collections
- Collections fetcher complete: `collections-fetcher.js` v1.0.0
- Generated `amazon-collections.json` (505 KB) with 2,280 books
- Amazon FIONA API: `https://www.amazon.com/hz/mycd/digital-console/ajax`

**Integration Plan:**
1. Load and merge collections data with library data (merge by ASIN)
2. Visual indicators on book covers (badge/icon for collections)
3. Metadata display for each book (show which collections)
4. Filterable attribute (filter by collection/read status)
5. "Uncollected" pseudo-collection (books with `collections: []`)

**Collections Stats:**
- Total books: 2,280 (fetched in 3m 56s)
- Books with collections: 1,399 (61%)
- Books without collections: 881 (39%)
- Read status: 722 READ, 1 UNREAD, 1,557 UNKNOWN

### v3.2.1 - Book Dialog UX Fix - RELEASED ✅
- **Started**: 2025-11-01
- **Completed**: 2025-11-01
- **Released**: 2025-11-01
- **Branch**: main (no feature branch - simple fix)
- **Changes Made**:
  - Removed misleading "Fetch Description & Reviews" button from book dialog
  - Replaced with honest "Description not available" warning message
  - Removed dead `fetchBookDescription()` function (28 lines)
  - Net: -34 lines, cleaner and more honest code
- **Status**: Successfully released as project v3.1.3

### v3.2.0 - HTML Refactor - RELEASED ✅
- **Started**: 2025-10-19
- **Completed**: 2025-10-19
- **Released**: 2025-10-19
- **Branch**: feature-html-refactor (merged to main)
- **Changes Made**:
  - Split monolithic HTML (2,032 lines) into modular structure:
    - amazon-organizer.css (97 lines)
    - amazon-organizer.js (1,916 lines)
    - amazon-organizer.html (17 lines)
  - Enhanced version management:
    - Query string cache busting (?v=3.2.0)
    - Footer version display (bottom-right corner)
    - Version comments in all files
  - Implemented git pre-commit hook for automatic SKILL zip rebuilding
  - Updated README.md and CHANGELOG.md
- **Status**: Successfully merged to main, tagged as v3.2.0, and pushed to GitHub

### v3.1.2 - RELEASED ✅
- **Started**: 2025-10-18
- **Completed**: 2025-10-18
- **Released**: 2025-10-18
- **Branch**: feature-improve-error-messages (merged to main)
- **Changes Made**:
  - Improved console fetcher Phase 0 error messages with actionable recovery steps
  - Authentication/session expiration errors now tell users exactly what to do
  - No functional changes, only improved user guidance
- **Status**: Successfully merged to main, tagged as v3.1.2, and pushed to GitHub

### v3.1.1 - RELEASED ✅
- **Started**: 2025-10-17
- **Completed**: 2025-10-17
- **Released**: 2025-10-17
- **Branch**: feature-column-rename-trigger (merged to main)
- **Changes Made**:
  - Added pencil icon (✏️) that appears on hover over column names
  - Icon fades in smoothly to indicate editability
  - Double-click functionality already existed, this improves discoverability
- **Status**: Successfully merged to main, tagged as v3.1.1, and pushed to GitHub
- **Lesson Learned**: During this session, Claude violated BOTH Core Ground Rules:
  - Rule #1 (Version Management): Made code changes BEFORE incrementing version - must increment BEFORE any code edit
  - Rule #2 (Approval Workflow): Made multiple changes without waiting for explicit "yes"/"go ahead"/"proceed" approval
  - After being called out and re-reading BOTH SKILL files, behavior significantly improved
  - Root cause: Not thoroughly processing the SKILL files before starting work
  - **For future sessions**: The startup checklist at the top of this file is mandatory

### v3.1.0 - RELEASED ✅
- **Started**: 2025-10-17
- **Completed**: 2025-10-17
- **Released**: 2025-10-17
- **Branch**: feature-ux-improvements (merged to main)
- **Changes Made**:
  - Dynamic title management (title auto-updates from APP_VERSION constant)
  - Search bar improvements (magnifying glass icon, better placeholder)
  - Add Column UX redesign (button creates "New Column" with cursor ready)
  - README updates (server documentation, Skills documentation)
  - Created Claude Skills infrastructure (SKILL-*.md files, build scripts)
  - Created NOTES.md for session continuity
  - Established README.md as source of truth for git tags
- **Status**: Successfully merged to main, tagged as v3.1.0, and pushed to GitHub

## Open Questions

None at this time.

---

## Notes About This File

- **Purpose**: Maintains context across Claude sessions, especially for "tabled" discussion items
- **Commit Policy**: Always commit NOTES.md with any other changes (for backup)
- **Version Control**: Tracked in git but does NOT trigger app version increments
- **Update Frequency**: Update whenever items are tabled or work context changes significantly
