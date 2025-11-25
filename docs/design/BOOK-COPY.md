# Book Copy Feature Design Document

**Feature**: Allow same book to appear in multiple columns
**Status**: Optional/Maybe (Medium priority, Medium difficulty)
**Created**: 2025-11-24

---

## Goal

Allow users to place the same book in multiple columns simultaneously (e.g., a book can be in "Next to Read" AND "Sci-Fi" AND "Favorites").

---

## UI Design

| Action | Behavior |
|--------|----------|
| Drag | Move (current behavior, removes from previous column) |
| Ctrl+Drag | Copy (new feature, keeps in original + adds to target) |
| Right-click | Context menu: "Copy to..." vs "Move to..." |
| DEL key | Remove from current column only |

---

## Architecture (Array-Based)

Cleaner than multiple DB entries - one entry per book with arrays:

```javascript
// IndexedDB structure - ONE entry per book with arrays
{
  asin: "B0123456",
  columnIds: ["next-to-read", "sci-fi", "favorites"],  // Array of columns
  positions: [0, 5, 2]                                  // Corresponding positions
}
```

---

## Delete Operation

1. User selects book instance and presses DEL (or right-click → Delete)
2. Remove from specific column: splice out columnId and position from arrays
3. **Safety check**: If arrays would become empty, prompt user "Delete last copy?"
4. If user confirms: remove entire DB entry (book returns to unorganized)
5. If user cancels: keep the last copy

---

## Benefits

- No data duplication in library JSON (still one canonical book record per ASIN)
- Book can be in "Next to Read" AND "Sci-Fi" AND "Time Travel Books"
- Simpler DB structure than multiple entries with same ASIN
- Array indices stay synchronized (columnIds[0] corresponds to positions[0])

---

## Implementation Notes

- Library JSON unchanged (one book per ASIN)
- Only organization data in IndexedDB uses arrays
- Rendering: Loop through columnIds array, render book at positions[i] in each column
- Search/filter works same as before (still renders all instances)
