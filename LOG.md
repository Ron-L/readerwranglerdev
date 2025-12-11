# Development Log

Historical record of completed work. As top-level items in TODO.md are completed and released, they are moved here in chronological order (newest first).

For current work, see TODO.md. For development rules, see SKILL-Development-Ground-Rules.md.

**Tags**: Use `@RULES` for ground rules changes, `@ARCH` for architecture decisions. Search with grep.

**Commit Policy**: Always commit with other changes (backup).

---

## [2025-12-11] @RULES Trigger Reorganization for Better Compliance

Reorganized TRIGGERS section into two categories to improve protocol compliance:

**Always-Evaluate Triggers** (scan user message every response):
- Added "Keyword Checklist" at top of section for explicit scanning
- Includes: DISCUSSION-QUESTION-TRIGGER, USER-SAYS-TABLE-THOUGHT-TRIGGER, SESSION-CHECKLIST-REQUEST-TRIGGER, USER-PROBLEM-REPORT-TRIGGER, IMPLICIT-PROBLEM-SIGNAL-TRIGGER, USER-SUGGESTS-IDEA-TRIGGER, FOUNDATION-ISSUE-IDENTIFIED-TRIGGER

**State-Dependent Triggers** (evaluate when context applies):
- System State Triggers (RESPONSE-START, SESSION-COMPACTION, STALE/FRESH-TIMESTAMP)
- Before Code Changes, Before Decisions, Before Git Operations
- Feature Development Lifecycle, Task and Documentation Management
- Domain-Specific Patterns

**Rationale**: Claude was missing keyword-based triggers because they weren't being systematically scanned. The new structure makes explicit that user-message triggers must be checked EVERY response.

**Commits**: [pending]

---

## [2025-11-27] Status Bar Redesign (v3.7.0) - COMPLETE

**Goal**: Simplify status display with user-first urgency indicators based on Load state only

**Design Document**: [docs/design/STATUS-BAR-REDESIGN.md](docs/design/STATUS-BAR-REDESIGN.md)

**Phases Completed**:
1. Phase 1: Add GUID + fetchDate to fetchers (library v3.4.0.a, collections v1.1.0)
2. Phase 2: Fetcher writes manifest to IndexedDB (both fetchers)
3. Phase 3: App reads from IndexedDB (v3.6.1)
4. Phase 4: Remove old polling code (v3.6.1, v3.7.0.m)
5. Phase 5: New status bar UI (v3.7.0)

**Key Features**:
- Single-line "Data Status:" with emoji indicator
- Click opens status dialog with full details
- GUID-based matching between JSON files and IndexedDB manifests
- Status persists to localStorage across page refresh

**Post-mortem**: [post-mortems/v3.7.0-2025-11-27.md](post-mortems/v3.7.0-2025-11-27.md)

---

## [2025-11-26] @RULES Release Process Protocol Improvements

Split FINALIZE-RELEASE-ACTION into 3 discrete actions:
- REVIEW-CODE-TODOS-ACTION (manual review with user decision: fix or proceed)
- VERIFY-RELEASE-DOCS-ACTION (automated hard stops for missing docs)
- FINALIZE-RELEASE-TAG-ACTION (git tagging)

Updated RELEASE-FINALIZATION-TRIGGER to call all 3 actions in sequence. User insight: TODO check should run FIRST (may trigger more work, aborting remaining checks).

**Commits**: 044695b, 83abc5e

---

## [2025-11-26] @RULES REFERENCE DATA Section Optimization

Deleted 3 orphaned REFs not referenced by any TRIGGER/ACTION:
- COMMIT-MESSAGE-FORMAT-REF (format kept inline in FORMAT-COMMIT-MESSAGE-ACTION)
- TOKEN-BUDGET-REF (values hardcoded in SESSION-COMPACTION-TRIGGER and DISPLAY-STATUS-LINE-ACTION)
- CLAUDE-SKILLS-MANAGEMENT-REF (git hook handles automatically)

Created 2 new ACTIONS:
- PRINT-SESSION-CHECKLIST-ACTION (references SESSION-CHECKLIST-FORMAT-REF)
- FINALIZE-RELEASE-ACTION (later split into 3 actions)

Token savings: ~400 tokens total. Architecture improvement: Event-driven pattern fully enforced.

**Commits**: 044695b

---

## [2025-11-26] @RULES Ground Rules Change Documentation Protocol

Added SKILL-FILE-MODIFIED-TRIGGER and DOCUMENT-GROUND-RULES-CHANGES-ACTION.

Protocol: Track SKILL-*.md changes in LOG.md with @RULES tag, skip CHANGELOG.md (not user-facing).

Rationale: Ground rules are executable code (programs Claude's behavior), needs change tracking like code.

**Commits**: 83abc5e

---

## [2025-11-26] @RULES TRIGGERS Section Reorganization

Added 8 sub-header groups to organize 27 triggers by workflow phase:
- **Meta & System Triggers** (3)
- **Code Development Workflow** (3)
- **Decision & Planning Triggers** (4)
- **User Interaction Triggers** (5)
- **Git Operations** (3)
- **Feature Development Lifecycle** (4)
- **Task & Documentation Management** (4)
- **Domain-Specific Patterns** (5)

Benefits: Easy scanning by category, conceptual clarity, prevents duplication, better onboarding.

**Commits**: c333330

---

## [2025-11-26] @RULES Trigger Language Improvements

Updated TASK-COMPLETION-TRIGGER and 8 passive triggers with explicit, active language.

Example: "Marking a TODO phase/task as complete" -> "After you mark any TODO.md item as complete [x]"

Consolidated duplicate triggers: Merged BEFORE-FINALIZING-VERSION-TRIGGER into RELEASE-FINALIZATION-TRIGGER.

Rationale: Passive language requires manual recognition. Active language fires automatically at clear trigger points.

**Commits**: 51e37cb

---

## [2025-11-25] Timestamp & Token Monitoring System - COMPLETE

**Goal**: Implement reliable timestamp and token usage tracking for Rule #0 status line

**Key Findings**:
1. Claude's internal timestamp is unreliable
2. Claude's token usage updates sporadically
3. Python script solution: `update-timestamp.py` writes to `.claude-timestamp` every 60 seconds
4. Staleness detection: 3+ unchanged reads triggers warning
5. Compaction detection: Token percentage jumps indicate context compaction
6. Persistent memory: `.claude-memory` JSON file stores state across compaction

**Files Created**:
- `update-timestamp.py` - Background service
- `.claude-timestamp` - Plain text timestamp file
- `.claude-memory` - JSON persistent state

---

## [2025-11-24] Project Rename to ReaderWrangler - COMPLETE

**New Name**: ReaderWrangler
**New GitHub URL**: https://ron-l.github.io/readerwrangler/

**Files Changed**:
- `amazon-organizer.html` -> `readerwrangler.html`
- `SKILL-Amazon-Book-Organizer.md` -> `SKILL-ReaderWrangler.md`
- `amazon-book-organizer.code-workspace` -> `readerwrangler.code-workspace`
- All documentation updated

**Rename Ground Rules Applied**:
- KEPT Amazon references: Legal/trademark notices, platform-specific features, historical CHANGELOG entries
- CHANGED to generic: Product descriptions, UI text, file names, URLs

---

## [2025-11-24] Stable ASIN-Based IDs - COMPLETE

**Goal**: Fix book organization persistence by using stable ASIN-based IDs

**Problem**: Books used sequential IDs (`book-0`, `book-1`) that changed when library reloaded in different order.

**Solution**:
- Use ASIN as stable book ID (persists across reloads)
- Sort by acquisition date (newest first)
- Clear IndexedDB and localStorage for fresh start

**Changes**: ID generation from `book-${i}` to `item.asin`

---

## [2025-11-23] Dev/Prod Dual-Repo Workflow - COMPLETE

Created `readerwranglerdev` repository for testing on GitHub Pages without affecting production.

**Three-Environment Bookmarklet Setup**:
- LOCAL bookmarklet -> localhost:8000
- DEV bookmarklet -> readerwranglerdev repo
- PROD bookmarklet -> readerwrangler.com

**Bug Fixed**: All three bookmarklets navigated to wrong destinations due to hardcoded `TARGET_ENV = 'PROD'`. Solution: Bookmarklets inject `window._READERWRANGLER_TARGET_ENV`.

---

## [2025-11-19] Shift-Click Range Selection Bug - CRITICAL FIX

**Severity**: CRITICAL - Caused massive unintended selections

**Problem**: User filtered on "Ayres" (10 books), shift-clicked first->last, moved all 1437 unfiltered books.

**Root Cause**: Shift-click calculated range on underlying array instead of filtered/visible results.

**Fix**: Changed line 1119 in readerwrangler.js from `const visibleBooks = column.books;` to `const visibleBooks = filteredBooks(column.books);`

**Branch**: `bugfix/shift-click-filtered-selection`
**Commits**: 61738c8 (fix), 3965fc5 (version bump)

---

## [2025-11-18] Documentation Accuracy & SEO Setup - COMPLETE

**Major Changes**:
- Bookmarklet evolution: Now shows navigation menu instead of auto-running scripts
- "One-Click" false advertising fixes: Updated 15+ locations
- README.md structure aligned with index.html
- SEO: sitemap.xml, robots.txt, Schema.org structured data, OG meta tags
- Launch strategy: REDDIT-LAUNCH-POST.md, PRODUCTHUNT-LAUNCH-CHECKLIST.md

---

## [2025-11-16] Landing Page & UX Tweaks - RELEASED

- Created index.html landing page for custom domain
- Environment-aware bookmarklet installer (v1.0.2.d)
- Added X buttons to all dialogs
- Updated progress messages in fetchers

---

## [2025-11-13] GitHub Pages Distribution - RELEASED

**Goal**: Deploy to GitHub Pages with bookmarklet for easy user access

**Completed**:
- Smart bookmarklet: bookmarklet-nav-hub.js (intro dialog + page detection + navigation)
- Install page: install-bookmarklet.html
- Progress UI overlays for fetchers
- README Quick Start section

**Context**: GitHub Pages enabled at https://ron-l.github.io/readerwrangler/

---

## [2025-11-12] Multi-Select with Ctrl/Shift Clicking - RELEASED (v3.4.0)

**Features**:
- Single-click: Select book (replaces selection)
- Ctrl+Click: Toggle selection
- Shift+Click: Range selection (within same column)
- Bulk drag-and-drop: Move all selected books together
- Right-click context menu: Quick bulk move
- Visual feedback: Blue outline, checkmark badge, selection count

---

## [2025-11-11] Phase 2.6 Partial Error Investigation - COMPLETE (v3.3.2)

**Problem**: 3/2666 books failed during full library fetch with "Customer Id or Marketplace Id is invalid"

**Root Cause**: GraphQL partial errors - Amazon returns valid description data + errors for customerReviewsTop field. Our code rejected entire response if `data.errors` existed.

**Solution**: Check for data despite errors, only fail if no data returned.

**Validation**: Overnight fetch SUCCESSFUL - descriptions recovered for all 5 partial-error books.

**Investigation archived**: [archived-investigations/graphql-api-investigation-2025-11.md](archived-investigations/graphql-api-investigation-2025-11.md)

**Post-mortem**: [post-mortems/v3.3.2-2025-11-11.md](post-mortems/v3.3.2-2025-11-11.md)

---

## [2025-11-04] Phase 2.5 Description Investigation - COMPLETE

**Goal**: Understand why some books lack descriptions

**Results**: 99.91% description recovery achieved
- Traditional descriptions: 1,517 recovered
- AI summaries: 7 recovered
- Recursive extractions: 2 recovered
- Only 2 books genuinely lack descriptions on Amazon

**Changes**: library-fetcher.js v3.2.0 with all discovered patterns

---

## [2025-11-03] Phase 2 Schema v3.0.0 & Description Tracking - COMPLETE

**Schema v3.0.0**: `{metadata: {...}, books: [...]}`
- Metadata includes: schemaVersion, fetcherVersion, fetchDate, totalBooks, booksWithoutDescriptions

**Commit**: e058725

---

## [2025-11-01] v3.2.1 Book Dialog UX Fix - RELEASED

Removed misleading "Fetch Description & Reviews" button from book dialog. Replaced with honest "Description not available" warning.

---

## [2025-10-19] v3.2.0 HTML Refactor - RELEASED

Split monolithic HTML (2,032 lines) into modular structure:
- amazon-organizer.css (97 lines)
- amazon-organizer.js (1,916 lines)
- amazon-organizer.html (17 lines)

Added version management: query string cache busting, footer version display.

Implemented git pre-commit hook for automatic SKILL zip rebuilding.

---

## [2025-10-19] Collections Integration - DATA MERGED

Collections data successfully merged into organizer (merge by ASIN).
- Console output: "Collections data merged: 1163 books have collections"
- Read status tracked: 642 READ, 1 UNREAD, 1700 UNKNOWN

**Branch**: feature-collection-read-status-exploration
**UI features**: Incomplete (badges, filtering pending)

---

## [2025-10-18] v3.1.2 - Error Message Improvements - RELEASED

Improved console fetcher Phase 0 error messages with actionable recovery steps.

---

## [2025-10-17] v3.1.1 - Column Rename Trigger - RELEASED

Added pencil icon that appears on hover over column names. Double-click functionality existed but wasn't discoverable.

**Lesson Learned**: During this session, Claude violated BOTH Core Ground Rules:
- Rule #1: Made code changes BEFORE incrementing version
- Rule #2: Made multiple changes without waiting for explicit approval
Root cause: Not thoroughly processing SKILL files before starting work.

---

## [2025-10-17] v3.1.0 - UX Improvements - RELEASED

- Dynamic title management
- Search bar improvements (magnifying glass icon)
- Add Column UX redesign
- Created Claude Skills infrastructure (SKILL-*.md files, build scripts)
- Created NOTES.md for session continuity
- Established README.md as source of truth for git tags

---

## Earlier Work (Pre-October 2025)

- Project setup and organization
- Phase 0 API Testing - Validate queries before fetching
- Custom status icons - PNG images (busy, empty, fresh, stale, question-mark)
- Status icon display lag fix - Pre-load all icons, toggle with CSS
- Terminology consistency - "load" not "sync"
- Collections fetcher - collections-fetcher.js v1.0.0
- Fetcher Improvements Phase 4 - Retry logic, statistics, non-book filter
