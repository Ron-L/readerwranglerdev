# Session Notes

This file tracks tabled discussion items, work in progress context, and open questions to maintain continuity across Claude sessions.

**Purpose:** Session state tracking only. For development rules and workflows, see SKILL-Development-Ground-Rules.md.

## Tabled Items

### Column Name Filtering Feature
- **Date**: 2025-10-17
- **Context**: User has an idea about filtering that also involves filtering column names
- **Status**: ✅ Moved to TODO.md with documented approaches (simple case, prefix syntax, smart filtering)
- **Priority**: Pending user decision on next task priority

## Current Work in Progress

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

### Three-Environment Bookmarklet Bug - RELEASED ✅
- **Started**: 2025-11-23
- **Completed**: 2025-11-23
- **Status**: Fixed and released to production

#### Problem
All three bookmarklets (LOCAL, DEV, PROD) navigated to wrong destinations due to hardcoded `TARGET_ENV = 'PROD'` in the old `bookmarklet-loader.js`.

#### Solution
1. Renamed `bookmarklet-loader.js` → `bookmarklet-nav-hub.js`
2. Bookmarklets now inject `window._READERWRANGLER_TARGET_ENV` ('LOCAL', 'DEV', or 'PROD')
3. Nav hub reads from window variable with 'PROD' fallback for backwards compatibility
4. Added `isDevRepo` detection to `index.html` (was missing, causing DEV repo to show PROD bookmarklet)
5. Added console.log version output to installer pages for debugging cache issues

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
