# TODO

## Current Priorities (Active Development)

_What we're actively working on right now_

### 1. README Enrichment Failures Documentation - PENDING

- [ ] **Document enrichment failures in README.md** - LOW priority (15 min)
  - Explain that a small number of books (~0.1-0.2%) may fail enrichment due to Amazon API quirks
  - Frame as Amazon-side limitation we accept (not a bug)
  - Optional: Mention Phase 3 retry logic may be added in future to recover missing enrichments on subsequent fetches
  - Context: Phase 2.6 investigation found partial GraphQL errors affect ~3-5 books per 2600+ library

### 2. Development Process Improvements

- [ ] Consider adding "grep for TODO comments in code files" to release procedure in ground rules
  - Review all in-code TODOs before finalizing release
  - Ensures temporary code doesn't become permanent

### 3. Status Bar Redesign (v3.7.0) - IN PROGRESS

**Goal**: Simplify status display with user-first urgency indicators based on Load state only

**Design Document**: [docs/design/STATUS-BAR-REDESIGN.md](docs/design/STATUS-BAR-REDESIGN.md) - Full rationale, architecture, and 25-state matrix

**Implementation Tasks**:

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
- [x] Remove version from status bar header (v3.7.0.o)
- [ ] Single-line: "Data Status: ✅" (or ⚠️ or 🛑 or ❓)
- [ ] Tooltip shows summary
- [ ] Click opens status dialog with full 25-state details

---

## Prioritized Roadmap (By Priority & Complexity)

_Based on user requirements + Claude.ai independent review (CLAUDE-AI-REVIEW.md)_

### 🔥 Priority 1: Critical Documentation & Onboarding (HIGH Priority, LOW-MEDIUM Complexity)

1. **🚀 Speed Up Enrichment Fetching** #FetcherImprovements - HIGH/MEDIUM (4-6 hours)
    - Problem: Current 1-ASIN-per-call + 2-second delay = 2+ hours for 2000+ books (showstopper for adoption)
    - Solution: Fetch 30 ASINs per call like Amazon yourbooks page does
    - Investigation tasks:
      - Analyze yourbooks page network traffic (verify 30 books = 1 API call)
      - Measure safe timing between batch calls
      - Identify Amazon's throttling patterns
    - Implementation:
      - Update GraphQL query to accept ASIN array
      - Batch ASINs into groups of 30
      - Adjust delay based on yourbooks behavior analysis
      - Add exponential backoff for rate limit handling
    - Expected impact: 13-33x speedup (2+ hours → 5-10 minutes)
    - Context: Must address before creating training videos/USER-GUIDE updates

2. **📖 Quick Start Video & Written Guide** - HIGH/LOW (2-4 hours) - See [docs/design/VIDEO-PRODUCTION-PLAN.md](docs/design/VIDEO-PRODUCTION-PLAN.md)

3. **📚 Comprehensive Documentation Hub** - HIGH/MEDIUM (8-12 hours)
   - Troubleshooting guide (What if scrape fails partway? How to recover?)
   - FAQ (Multiple Amazon accounts? Kindle Unlimited books? Mobile support?)
   - Keyboard shortcuts reference
   - Data management guide (backup, export, import, JSON format)
   - Technical details (How bookmarklet handles anti-scraping)
   - Problem: Users get stuck, have questions, can't find answers
   - Impact: Reduces support burden, improves user confidence

4. **📱 Mobile Support Clarity** - HIGH/LOW (1 hour)
   - Document whether app works on mobile devices
   - Add to FAQ and main page
   - Problem: Major omission for users who browse libraries on phones/tablets
   - Impact: Sets correct expectations

5. **📋 Changelog Visibility** - MEDIUM/LOW (30 minutes)
   - Link version display (e.g., "v3.6.0") to CHANGELOG.md
   - Problem: Users see version numbers but no context
   - Impact: Transparency about what changed

6. **✅ Fill in Missing Sections in USER-GUIDE.md** - MEDIUM/LOW (2-3 hours)
   - Complete placeholder sections
   - Add screenshots/examples
   - Problem: Partial documentation confuses users
   - Impact: Complete feature documentation

7. **Enhanced Getting Started UX** #Architecture - See [docs/design/ENHANCED-GETTING-STARTED-UX.md](docs/design/ENHANCED-GETTING-STARTED-UX.md)
    - Status: Planned (post-rename enhancement)
    - Help menu links, enhanced empty library state

### 🎯 Priority 2: UX Polish & Error Handling (HIGH Priority, LOW-MEDIUM Complexity)

8. **⏱️ Enhanced Progress Feedback During Extraction** - HIGH/LOW-MEDIUM (1-2 hours)
   - Progress counter during enrichment: "847 of 2,322 books (36%)" - 30 min
   - Visual progress bar with smooth updates - 1 hour
   - Problem: Users get impatient/confused during lengthy initial extraction (especially enrichment phase)
   - Impact: Reduces abandonment during first-time setup
   - Note: Pause/Resume + Recovery moved to Phase 3 Retry Logic (item #23)

9. **🔄 Extraction Error Recovery** - SHOULD MOVE TO PHASE 3 RETRY LOGIC
   - Note: This overlaps significantly with Phase 3 Retry Logic (item #23)
   - Recovery, Pause/Resume, and state persistence all belong together
   - Recommend consolidating into item #23 for cohesive implementation

10. **🐛 Collections Filter Bug Fix** - HIGH/LOW (30m-1h)
   - Collections dropdown still shows old collection names after Clear Everything
   - Problem: UI state not fully cleared
   - Impact: Confusing UX after reset

11. **🐛 Invalid File Selection Causes Status Timeout** - MEDIUM/LOW (30m-1h)
   - When user selects wrong JSON file in Load Library dialog, status check hangs
   - Eventually times out with "Library loaded but status check timed out" message
   - Problem: File picker error doesn't cancel the status check operation
   - Impact: Minor UX issue - confusing timeout instead of immediate error

12. **✨ UX Quick Wins** - MEDIUM/LOW (1-3 hours each)
   - Tooltips for control buttons (Backup, Restore, Reset, Clear)
   - First-run Welcome dialog explaining what ReaderWrangler is
   - Column name filtering (search by column name)
   - Make status dialog draggable/movable (modal → draggable)

### 🔍 Priority 3: Advanced Organization Features (MEDIUM Priority, MEDIUM Complexity)

13. **🔀 Column Sorting** - MEDIUM-HIGH/MEDIUM (4-6 hours)
    - Sort books within columns by: acquisitionDate, seriesPosition, rating, title, author
    - Permanent re-ordering (like Excel sort, persists to IndexedDB)
    - Multi-column selection: apply same sort to each column independently
    - Users can manually adjust positions after sorting (not locked)
    - Problem: After organizing books into columns, can't fine-tune order by meaningful criteria
    - Impact: Completes organization workflow - get books into columns, then order optimally within each

14. **🔎 Advanced Filtering** - MEDIUM/MEDIUM (6-8 hours)
    - Filter by genre/category
    - Filter by rating
    - Filter by acquisition date range
    - Filter by read/unread status (if available from Amazon)
    - Filter by series
    - Problem: Hard to find specific subsets in 2,300+ book library
    - Impact: Improves discoverability for power users

15. **🏷️ Color-Coding/Tagging System** - MEDIUM/MEDIUM (8-10 hours)
    - Visual distinction beyond columns
    - Tag-based organization
    - Problem: Columns alone may not capture all organizational needs
    - Impact: More flexible organization

16. **📚 Collections Integration - UI Features** - MEDIUM/MEDIUM (4-8 hours)
    - Visual indicators (badges/icons) for collections on book covers
    - Metadata display showing which collections each book belongs to
    - Filtering by collection name
    - Filtering by read status (READ/UNREAD/UNKNOWN)
    - "Uncollected" pseudo-collection
    - Status: Data merged ✅, UI incomplete
    - Problem: Collections data fetched but not visible in UI
    - Impact: Leverage existing Amazon collections in organizer

17. **📖 Reading Progress Visualization** - MEDIUM/HIGH (6-10 hours)
    - Show reading progress percentage/position for each book
    - Implementation guidance: [Amazon Organizer Reading Progress conversation](https://claude.ai/chat/6e6f23c8-b84e-4900-8c64-fecb6a6e0bd1)
    - Note: Collections data already merged (line 452 NOTES.md), this adds progress visualization
    - Problem: Users can't see reading progress in organizer
    - Impact: Better tracking of currently-reading books

18. **📖 Enhanced Series Management** - MEDIUM/MEDIUM (6-10 hours)
    - Expand current "Collect Series Books" button
    - Automatic series detection
    - Series reading order visualization
    - Missing book detection ("You have books 1, 2, and 4 of this series")
    - Problem: Series books scattered across library
    - Impact: Better management for series readers

### 📊 Priority 4: Analytics & Export (MEDIUM Priority, LOW-MEDIUM Complexity)

19. **📈 Reading Stats Dashboard** - MEDIUM/MEDIUM (8-12 hours)
    - Books acquired by month/year
    - Genre distribution pie chart
    - Average rating of collection
    - "Time to read" estimates based on page counts
    - Problem: No insights into library composition
    - Impact: Interesting for users, helps rediscover forgotten books

20. **💾 Enhanced Export Options** - MEDIUM/LOW (2-4 hours)
    - Export organization to CSV (already has JSON)
    - Print-friendly reading list
    - Privacy-respecting share feature
    - Problem: Limited backup/sharing options
    - Impact: Portability and sharing

### 🔧 Priority 5: Technical Improvements (MEDIUM-LOW Priority, MEDIUM-HIGH Complexity)

21. **Phase 3: UI Error Handling** #FetcherImprovements - MEDIUM/LOW (2-3 hours)
    - Warning banners for missing descriptions
    - "View Missing Descriptions" feature
    - Problem: Users unaware of missing enrichment data
    - Impact: Transparency about data quality

22. **Minor Fetcher Improvements** #FetcherImprovements - LOW/LOW (1-2 hours)
    - Timeout removal, messaging improvements, terminology consistency
    - Problem: Minor UX issues in fetcher scripts
    - Impact: Polish and consistency

23. **🔄 Phase 3 Retry Logic + Recovery + Pause/Resume** - MEDIUM/HIGH (12-16 hours, optional)
    - See [docs/design/PHASE-3-RETRY-LOGIC.md](docs/design/PHASE-3-RETRY-LOGIC.md) for full spec
    - Retry logic for failed enrichments (~1.3% failure rate)
    - Pause/Resume capability with global flag + button UI
    - Recovery: Save extraction state to localStorage, resume from interruption
    - State persistence: Track progress, allow resumption after browser close/refresh
    - Problem: Random enrichment failures, long extractions without pause, lost progress on interruption
    - Impact: Data quality improvement (99.8%+ expected), better UX for long extractions, prevents data loss

24. **🗂️ Nested Groups/Hierarchies** #Optional - LOW/HIGH (15-20 hours)
    - "Science Fiction" → "Space Opera" → "Culture Series"
    - Significant UI rework required
    - Problem: Flat column structure limits deep organization
    - Impact: Better for very large libraries (1000+ books)

25. **🤖 Smart Collections (Rule-Based)** #Optional - LOW/HIGH (12-16 hours)
    - "All unread books rated 4.5+"
    - Requires complex rule engine
    - Problem: Manual organization is tedious
    - Impact: Automation for power users

### 🌐 Priority 6: Integrations & Advanced Features (LOW Priority, HIGH-VERY HIGH Complexity)

26. **🔗 Third-Party Integrations** - LOW/HIGH (20-30 hours)
    - Goodreads sync (import ratings, mark as read)
    - StoryGraph integration
    - Export recommendations to Amazon wishlist
    - Problem: Complex API work, authentication, rate limits
    - Impact: Niche feature for users of these services

27. **☁️ Multi-Device Sync** #Architecture - LOW/VERY HIGH (40-60 hours)
    - Cloud storage option (self-hosted or encrypted)
    - Sync organization across devices
    - Problem: Major architectural change, privacy implications
    - Impact: Convenience for multi-device users

28. **🧠 Smart Recommendations** - LOW/HIGH (30-40 hours)
    - "You own these similar books you haven't read yet"
    - "Others who loved [this book] also read [these books] from your library"
    - Highlight forgotten purchases based on high ratings
    - Problem: Requires recommendation engine, ML/AI complexity
    - Impact: Book discovery from existing library

29. **Book Copy Feature** #Optional - MEDIUM/MEDIUM (8-10 hours)
    - Allow same book to appear in multiple columns
    - See [docs/design/BOOK-COPY.md](docs/design/BOOK-COPY.md) for full spec
    - Array-based architecture, Ctrl+Drag UI, delete operation
    - Problem: Can't organize same book multiple ways
    - Impact: More flexible organization

30. **Live reflow drag-and-drop animation** #Optional - LOW/MEDIUM (4-6 hours)
    - Smooth visual feedback during drag operations
    - Problem: Current drag-and-drop feels abrupt
    - Impact: Polish and visual appeal

31. **2D matrix layout** #Optional - LOW/VERY HIGH (50-80 hours)
    - Major refactor to grid-based layout
    - Problem: Current column-only layout limiting
    - Impact: Alternative organization paradigm

32. **Groups/series containers** #Optional - MEDIUM/HIGH (15-20 hours)
    - Nested containers for related books
    - Problem: Related books scattered across columns
    - Impact: Better grouping for series/themes

33. **Multi-User Support** #Architecture - LOW/VERY HIGH (40-60 hours)
    - See [docs/design/MULTI-USER-DESIGN.md](docs/design/MULTI-USER-DESIGN.md) for full spec
    - Status: Future enhancement (single-user first, multi-user later)
    - Covers: AccountId identification, storage architecture, mismatch handling
    - Problem: Multiple Amazon accounts on same device
    - Impact: Household/family sharing
    - **Workaround Available**: See [USER-GUIDE.md FAQ](USER-GUIDE.md#faq) "Can I maintain separate organizational states?" for Backup/Restore method to swap between different organizational states (demo vs. actual collection, testing vs. production, etc.)

34. **Multi-Store Architecture** #Architecture - LOW/VERY HIGH (60-80 hours)
    - See [docs/design/MULTI-STORE-ARCHITECTURE.md](docs/design/MULTI-STORE-ARCHITECTURE.md) for full spec
    - Status: Future enhancement (Amazon first, other stores later)
    - Covers: File naming, bookmarklet detection, data structure, migration path
    - Problem: Only works with Amazon
    - Impact: Support for other ebook platforms






