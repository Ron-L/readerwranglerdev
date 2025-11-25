# Phase 3 Retry Logic - Design Document

**Feature**: Fetcher Improvements - Phase 3 (v3.4.0)
**Status**: Approved, Not Started
**Created**: 2025-11-24

## Goal

Progressive data completeness improvement through retry logic for books with missing review data.

---

## Problem Statement

Amazon's GraphQL API randomly fails to return review data for some books. This is an intermittent backend issue on Amazon's side, not a bug in our code.

**Current Statistics**:
- 31/2344 books (1.3%) missing topReviews
- 3 books consistently fail (Cats + 2 Queens) - Amazon backend permanently broken
- ~28 books fail intermittently - should resolve on retry
- Expected final success rate after Phase 3: ~99.8% (2,341/2,344 books)
- Only 2 books with 500+ reviews missing data (0.1%) - not correlated with review count

---

## Design

### When to Retry

1. **After Phase 2 enrichment completes** (fresh fetch) - immediate retry opportunity
2. **When user refreshes existing library** - progressive improvement over time

### How It Works

1. **Scan library** for books with `reviewCount > 0` but `topReviews.length === 0`
2. **Retry using SAME configuration** (`getProducts + your-books`):
   - Wait 5-10 minutes after initial fetch (allow Amazon backend state to change)
   - Retry same ASIN up to 3 times total
   - Track retry statistics in book metadata:
     - `reviewFetchAttempts`
     - `reviewFetchStatus`
     - `lastReviewFetchAttempt`
3. **Merge successful review data** back into library
4. **Update metadata** with retry statistics

### Why NOT Use Alternative APIs

Test results (test-06) conclusively show:
- **ONLY `getProducts` works** for review data
- `getProduct` (singular) is broken/deprecated
- `getProductByAsin` is broken/deprecated
- Alternative methods fail even on books that work with `getProducts`

See [GraphQL-API-Reference.md](../../GraphQL-API-Reference.md) for complete test results.

---

## Benefits

| Scenario | Benefit |
|----------|---------|
| Fresh fetch | Immediate retry - servers might succeed on 2nd attempt due to randomness |
| Refresh | Progressive improvement - Amazon's server state changes over time |
| User expectation | Loading library file should update missing data if possible |

---

## Implementation Notes

- Reuses existing `getProducts` query infrastructure
- No new API endpoints or authentication required
- Metadata tracking enables future reporting on retry effectiveness
- Graceful degradation - if retries fail, data quality is no worse than before
