# Multi-User (Multi-Account) Design Document

**Feature**: Multi-User Support
**Status**: Future Enhancement (documented for "Ship Fast" approach - implement single-user first, design for multi-user)
**Created**: 2025-11-21

---

## Problem Statement

What happens when multiple Amazon accounts use ReaderWrangler on the same browser/device?
- Couples sharing a computer
- User with personal + work Amazon accounts
- Testing with multiple accounts

---

## Design Decisions Made

### 1. Identifier: Amazon AccountId (NOT a GUID)

Use Amazon's native accountId as the library identifier.

**Benefits:**
- User-recognizable (they see their own account name)
- Naturally unique per Amazon account
- No need to generate/manage separate GUIDs
- Collections uses same accountId as Library (tied to same Amazon account)

### 2. Where to Find AccountId

**API Discovery (2025-11-21)** - COMPLETE ✅

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

**Final Design:**
- `primaryEmailAddress` → Internal unique key (guaranteed unique per account)
- `customerName` → Display to user (friendly, what they expect)
- Store both in manifest, keyed by email

**DOM Fallback (if needed):**
- Yourbooks page: Banner says "Ron Lewis's Books"
- Collections page: "Ron" appears in 2 places

### 3. Storage Architecture

- Fetcher writes manifest directly to IndexedDB (not separate JSON file first)
- JSON file is primary storage for book data (reviews make it too large for IndexedDB)
- Each library identified by accountId in IndexedDB
- Collections uses same accountId as Library

### 4. No "Compare" Feature Needed

- Users don't need to compare libraries across accounts
- Each account's library is independent

### 5. Clear Behavior

- Clear should clear current library only (by accountId)
- Not a global "clear all accounts" operation

### 6. Backup/Restore

- Handles the "experimenting with arrangements" use case
- User can backup their organization, try changes, restore if unhappy
- Per-account backup/restore (identified by accountId)

### 7. AccountId Mismatch Handling (Future)

What if user loads a JSON file from a different account?

**Options:**
- Warn user and ask to confirm
- Automatically segregate by accountId
- Reject mismatched files

Decision deferred to implementation time.

---

## Current Implementation (Single-User)

For the initial "Ship Fast" release:
- Assume single account per browser
- No accountId tracking yet
- Library and Collections assumed to be from same account
- No mismatch detection

---

## Future Implementation (Multi-User)

When implementing multi-user support:

1. Scrape accountId from Amazon page (DOM or API response)
2. Store accountId in manifest (IndexedDB)
3. Include accountId in JSON file metadata
4. Detect mismatched files on load
5. Per-account organization data in IndexedDB
6. Account switcher UI in status bar
