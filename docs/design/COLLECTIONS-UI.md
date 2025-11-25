# Collections UI Design Document

**Feature**: Collections Integration - UI Features
**Status**: Pending (data merge complete, UI incomplete)
**Created**: 2025-11-24

---

## Goal

Display Amazon collection membership and read status in the organizer UI.

---

## Current State

**Data Merge Complete:**
- Collections fetcher successfully extracts collection data
- Data merged into organizer on load
- Console shows: "📚 Collections data merged: 1163 books have collections"
- Read status tracked: 642 READ, 1 UNREAD, 1700 UNKNOWN

---

## Pending UI Features

1. **Visual indicators (badges/icons)** for collections on book covers
2. **Metadata display** showing which collections each book belongs to
3. **Filtering by collection name**
4. **Filtering by read status** (READ/UNREAD/UNKNOWN)
5. **"Uncollected" pseudo-collection** (books with no collections)

---

## Design Decisions

### Data Architecture

- **Two separate JSON files**: `amazon-library.json` + `amazon-collections.json`
- **Collections JSON includes ALL books** (even with no collections) for "Uncollected" support
- **Output format**: `{asin, title, readStatus, collections: [{id, name}]}`
- **"Uncollected" = computed pseudo-collection** (books with `collections: []`)

### Edge Cases

| Scenario | Behavior |
|----------|----------|
| Books in collections but not library | Show dialog after full scan |
| Books in library but not collections | Normal, no collections/readStatus |
| Missing collections.json | App works, no collection features |
| Schema mismatch | Handle gracefully |

---

## Implementation Notes

- Collections data is merged into book objects at load time
- No changes to library JSON structure required
- UI components will read from merged book objects
