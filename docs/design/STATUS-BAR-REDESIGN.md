# Status Bar Redesign - Design Document

**Feature**: Status Bar Redesign (v3.7.0)
**Status**: In Progress
**Created**: 2025-11-21

## Goal

Simplify status display with user-first urgency indicators based on Load state only.

---

## Critical Design Rationale

### Design Decision: 25 States (Fetch x Load) with Graceful Degradation

We use a 25-state matrix (5 Fetch statuses x 5 Load statuses) to provide rich status information. When Fetch state is unavailable (DB cleared, GUID mismatch), the system gracefully degrades to Load-state-only behavior.

---

## Why Manifest Polling (Original Design) Was Broken

### Original Implementation:
```javascript
// App polled manifest every 60 seconds
fetch(`amazon-manifest.json?t=${Date.now()}`)
```

### Fatal Flaw Discovered (2025-11-21):
1. This is a **relative URL fetch** - resolves relative to where app is served
2. For **GitHub Pages users**: resolves to `https://ron-l.github.io/readerwrangler/amazon-manifest.json`
3. **Users can't write files to GitHub!** The manifest would need to be in the repo
4. Result: Fetch always fails (404), silently falls back to age-based staleness
5. **We never noticed** because localhost testing worked (manifest in served directory)

**The current manifest polling has been broken for all GitHub Pages users since launch.**

---

## Why Manifest Must Live in IndexedDB (Not JSON File Polling)

**Option 1: Poll JSON manifest file** - BROKEN
- Can't poll files on user's local disk (browser security)
- Can't poll GitHub-hosted files (users can't write to GitHub)
- Local dev masked this - worked on localhost, failed in production

**Option 2: Manifest only in library JSON file** - LOSES FETCH STATE
- JSON file is self-describing (has `metadata.fetchDate`)
- But app can't know about unfetched files on disk
- No way to detect "you have a fresh file waiting"
- Would reduce to Load-state-only (5 states, not 25)

**Option 3: Fetcher writes manifest to IndexedDB** - CHOSEN
- Fetcher runs on Amazon page, writes manifest directly to IndexedDB
- App reads IndexedDB to get Fetch state
- Works regardless of where app is hosted
- Requires GUID to match manifest to correct JSON file

---

## Why GUID is Required

### Problem: Multiple JSON files, one DB
1. User fetches Library A -> manifest A written to DB
2. User fetches Library B -> manifest B overwrites manifest A
3. User loads Library A -> DB has manifest B, mismatch!

### Solution: GUID ties manifest to specific JSON file
- Fetcher generates GUID, stores in:
  - JSON file: `metadata.guid`
  - IndexedDB: manifest record keyed by GUID
- On load: App checks if loaded JSON's GUID matches any DB manifest
- Match -> use DB manifest for Fetch state
- No match -> fallback to Load-state-only (graceful degradation)

---

## The 25-State Matrix

### Per Data Type (Library, Collections):

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

**Combined = 5 x 5 = 25 states** (see [state-matrix.html](../../state-matrix.html) for full table)

---

## Urgency Icon Logic

**Status bar shows single urgency icon based on Load status (user-first design):**
- Green checkmark if Load is Fresh
- Warning if Load is Stale
- Question mark if Load is Unknown (legacy file without fetchDate)
- Stop sign if Load is Empty or Obsolete

**Key insight:** "Urgency is based ONLY on Load status" because that's what affects the user's experience NOW. Fetch status is informational (shown in dialog).

**Combined urgency across Library + Collections:** worst-case wins

---

## Graceful Degradation (Load-State-Only Fallback)

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

## Data Storage Architecture

### JSON Files (user's disk):
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

### IndexedDB (browser storage):
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

## Backward Compatibility

### Legacy JSON files (pre-GUID):
- No `metadata.guid` field
- App can't match to DB manifest
- Falls back to Load-state-only
- Shows question mark Unknown for Fetch state in dialog
- Dialog: "This file predates status tracking. Re-fetch to enable."

**No breaking changes** - old files work, just with degraded status display.

---

## Groundwork for Multi-User (Optional, Future)

When we implement multi-user support:
- Add `accountId` to JSON metadata (email from GetPFMDetails API)
- Store `accountId` in IndexedDB manifest
- On load: warn if JSON's accountId doesn't match expected account
- See [MULTI-USER-DESIGN.md](MULTI-USER-DESIGN.md) for full plan
