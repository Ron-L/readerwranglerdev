# Folder Drag & Drop - Full Implementation

## Overview

Two distinct drag operations for folders in the right pane:

| Operation | Target Zone | Visual | Action |
|-----------|-------------|--------|--------|
| **Reorder** | Edge (top/bottom 25%) | Insertion line | Change position among siblings |
| **Reparent** | Center (middle 50%) | Background highlight | Move folder INTO target |

---

## Mode/View Conceptual Model

Understanding **why** operations are allowed requires distinguishing between VIEWs and MODEs:

### Virtual Views (Read-Only)
**All Books** and **My Library** are virtual VIEWS, not containers:
- Always sorted (clicking column headers changes sort)
- Cannot enter "custom mode" — no manual reordering
- All Books: Shows all books across all folders (flat list)
- My Library: Shows organizational structure (folders only)

### User Folders (Two Modes)
User-created folders can operate in two modes:

| Mode | How to Enter | Column Header Click | Drag to Reorder | Visual Indicator |
|------|--------------|---------------------|-----------------|------------------|
| **Sorted View** | Click any column header | Changes sort direction | Disabled | ▲/▼ shown |
| **Custom Mode** | Click "Custom" or cancel sort | Reorders permanently | Enabled | No ▲/▼ |

**Mode persists** across List ↔ Cover view toggle.

### Implications for Folder Drag/Drop

| Context | Why Reorder Allowed? | Why Reparent Allowed? |
|---------|----------------------|-----------------------|
| All Books | ❌ Virtual view, no container | ❌ Can't modify virtual view |
| My Library | ❌ Virtual view of root folders | ✅ Can change folder's parent |
| User folder (sorted) | ❌ Sort defines order | ✅ Moving folder doesn't affect sort |
| User folder (custom) | ✅ User controls order | ✅ Full control |

**Key principle**: Dragging is always allowed (except Inbox/All Books). The DROP determines operation validity based on current mode.

---

## Detection Logic

For each folder element during dragOver, calculate mouse position relative to element:

```javascript
const rect = element.getBoundingClientRect();
const y = e.clientY - rect.top;
const height = rect.height;
const edgeZone = height * 0.25; // 25% top/bottom for reorder

if (y < edgeZone) {
    // Top edge → reorder BEFORE this folder
    setDragTarget({ type: 'reorder', index, position: 'before' });
} else if (y > height - edgeZone) {
    // Bottom edge → reorder AFTER this folder
    setDragTarget({ type: 'reorder', index, position: 'after' });
} else {
    // Center → reparent INTO this folder
    setDragTarget({ type: 'reparent', folderId: folder.id });
}
```

---

## Visual Feedback

### List View
| Zone | Visual |
|------|--------|
| Top edge | `borderTop: 3px solid #3b82f6` |
| Center | `backgroundColor: #dbeafe` (blue-100) |
| Bottom edge | `borderBottom: 3px solid #3b82f6` |

### Cover View
| Zone | Visual |
|------|--------|
| Top edge | `borderTop: 3px solid #3b82f6` on tile |
| Center | `ring-2 ring-blue-500 bg-blue-100` |
| Bottom edge | `borderBottom: 3px solid #3b82f6` on tile |

---

## State Variables

```javascript
// Replace single reorder target with unified drag target
const [explorerFolderDragTarget, setExplorerFolderDragTarget] = useState(null);
// Shape: null | { type: 'reorder', index, position: 'before'|'after' }
//             | { type: 'reparent', folderId }
```

---

## Where Operations Are Allowed

| Context | Draggable | Reorder | Reparent |
|---------|-----------|---------|----------|
| My Library | ✅ (except Inbox) | ❌ | ✅ |
| User folder (custom mode) | ✅ | ✅ | ✅ |
| User folder (sorted mode) | ✅ | ❌ | ✅ |
| All Books | ❌ | ❌ | ❌ |

**Key insight**: Dragging is always allowed (except Inbox/All Books). Where you DROP determines the operation.

---

## Functions Needed

### 1. `reparentFolder(folderId, newParentId)`
Move folder to become child of newParentId.

```javascript
const reparentFolder = (folderId, newParentId) => {
    // Prevent circular: can't move folder into itself or its descendants
    const isDescendant = (parentId, targetId) => {
        if (parentId === targetId) return true;
        const parent = folders.find(f => f.id === parentId);
        if (!parent?.parentId) return false;
        return isDescendant(parent.parentId, targetId);
    };

    if (folderId === newParentId || isDescendant(newParentId, folderId)) {
        showToast("Can't move folder into itself");
        return;
    }

    setFolders(prev => prev.map(folder => {
        if (folder.id === folderId) {
            return { ...folder, parentId: newParentId };
        }
        return folder;
    }));

    // TODO: Add undo support
    console.log(`📁 Moved folder ${folderId} into ${newParentId || 'root'}`);
};
```

### 2. Modified `onDragOver`
Detect zone and set appropriate target.

### 3. Modified `onDrop`
Call reorder or reparent based on target type.

---

## Implementation Phases

### Phase A: Enable folder dragging everywhere (except Inbox/All Books)
- Remove `canReorderFolders` restriction on draggability
- All folders become draggable regardless of sort mode or My Library

### Phase B: Add two-target detection
- Replace `explorerFolderReorderTarget` with `explorerFolderDragTarget`
- Add zone detection in `onDragOver`

### Phase C: Visual feedback for both targets
- Update styling to show insertion line OR highlight based on target type

### Phase D: Handle drop actions
- Create `reparentFolder` function
- In `onDrop`: check target type, call appropriate function
- Reorder only allowed in custom mode (show toast otherwise)
- Reparent always allowed

### Phase E: Left panel reordering
- Apply same logic to folder tree sidebar
- Drag between siblings = reorder
- Drag onto folder = reparent (already works via tree drop)

---

## Edge Cases

1. **Circular prevention**: Can't drop folder into its own descendant
2. **Inbox**: Never draggable (pinned)
3. **All Books**: No dragging (virtual folder)
4. **Root level**: Reparent to `null` parentId
5. **Sorted mode**: Reorder disabled, reparent allowed

---

## Files to Modify

- `readerwrangler.js`:
  - Add `explorerFolderDragTarget` state
  - Add `reparentFolder` function
  - Update folder row/tile drag handlers
  - Update left panel folder drag handlers

---

## Estimated Effort

| Phase | Effort |
|-------|--------|
| A: Enable dragging | 30 min |
| B: Two-target detection | 45 min |
| C: Visual feedback | 30 min |
| D: Drop actions | 45 min |
| E: Left panel | 30 min |
| **Total** | ~3 hours |

---

## Filtered Folder View

### Overview

When filters are active and users have hundreds of top-level folders, the left panel becomes difficult to navigate due to long scroll distances between folders containing matching books. This feature automatically hides empty folders and expands folders with matches to improve filtering UX.

### Core Behavior

**When filter is active:**
1. **Auto-hide folders** with zero matching books
2. **Auto-expand folders** containing matching books (recursively up to root)
3. **Show X/Y counts** on all visible folders (matching books / total books)
4. **Display indicator** at top of folder tree: `"Showing X of Y folders • Show all"`
5. **"Show all" link** reveals all folders (overrides auto-hide until filter changes)

**When filter is cleared:**
- Restore normal folder tree view
- Remove X/Y counts
- Hide indicator
- Reset expansion state to user's previous state

### Implementation Details

#### 1. Trigger Condition
- Any active filter in the filter panel (title, author, rating, price, etc.)
- Multiple filters combine with AND logic (as existing)
- Filter state tracked by existing filter state management

#### 2. Folder Visibility Logic
For each folder in the tree:
```javascript
const matchingCount = countBooksMatchingFilter(folder);
const totalCount = countTotalBooks(folder);
const isVisible = matchingCount > 0 || showAllFoldersOverride;
```

#### 3. Auto-Expansion Logic
- Expand folders where `matchingCount > 0`
- Recursively expand all parent folders up to root
- Collapse folders where `matchingCount === 0` (unless "Show all" is active)
- Preserve user's manual expand/collapse state when filter is cleared

#### 4. Count Display Format
- Normal state: `(N)` where N = total books
- Filtered state: `(X/Y)` where X = matching, Y = total
- Color coding (optional):
  - Green text when X > 0
  - Gray text when X = 0 (if shown via "Show all")

#### 5. Indicator Component
Location: Top of left panel folder tree, below "Folders" header

Format: `"Showing X of Y folders • Show all"`
- X = number of visible folders (non-zero counts)
- Y = total number of folders
- "Show all" is clickable link
- Entire indicator only visible when filter is active

Clicking "Show all":
- Sets `showAllFoldersOverride = true`
- Reveals all folders (with 0/Y counts shown dimmed)
- Link changes to "Hide empty" to toggle back
- Override resets when filter changes

#### 6. Edge Cases

**Nested folders:**
- Parent with no direct books but children with matches → Show parent, expand to reveal children
- Parent with matches but all children empty → Show parent, hide children

**Special folders:**
- "All Books" → No change (already shows all books)
- "My Library" → Apply filtering to folder tree
- "Inbox" → Apply filtering like any other folder

**Empty filter results:**
- If NO folders have matches, show indicator: "No folders match filter"
- Keep all folders visible but dimmed
- Suggest clearing filter or adjusting criteria

**Performance:**
- Cache filtered book lists per folder
- Invalidate cache when filter changes
- Lazy calculation (only compute visible folders)

### Files to Modify

- **readerwrangler.js**:
  - Add `showAllFoldersOverride` state
  - Add `filteredFolderCounts` state (Map of folderId → {matching, total})
  - Update folder tree rendering to conditionally hide/show folders
  - Add indicator component at top of folder tree
  - Update folder count display logic (N vs X/Y format)
  - Add auto-expansion logic when filter changes

### UX Considerations

**Why auto-hide instead of manual:**
- Solves problem immediately when user applies filter (zero clicks)
- Natural behavior: filtering should filter everywhere
- "Show all" override available if context needed

**Why "Show all" instead of persistent toggle:**
- Most common use case: filter → find → navigate → clear filter
- Persistent toggle adds state to remember/manage
- Temporary override is simpler mental model

**Visual feedback:**
- Indicator makes it clear folders are hidden
- X/Y counts show filter effectiveness per folder
- "Show all" link provides easy escape hatch

### Estimated Effort

| Task | Effort |
|------|--------|
| Count calculation logic | 1 hour |
| Folder visibility filtering | 1 hour |
| Auto-expansion logic | 1 hour |
| Indicator component | 30 min |
| "Show all" toggle | 30 min |
| Testing & edge cases | 1 hour |
| **Total** | ~5 hours |

---

## Series Columns & Multi-Column Sorting

### Overview

Users with book series need to organize and view books in reading order. Series information (name and position) should be displayed in columns and sortable, with support for multi-column sorting to group by series then order by position.

**Key requirements:**
- Display series name and position in separate columns
- Support fractional positions (e.g., 3.5 for anthology stories between novels)
- Populate from Amazon API where available, allow manual entry/override
- Enable sorting by multiple columns with clear visual indicators
- Both columns optional (hideable via column chooser)

### Data Model

Add two new optional fields to book object:

```javascript
book: {
  ...existing fields,
  series: "Dresden Files",           // String, can be null
  seriesPosition: 3.5,               // Decimal number, can be null
}
```

**Data sources:**
1. **Amazon API** - Primary source via fetcher (not 100% reliable)
2. **Manual entry** - User can set/override in edit modal
3. **Default** - null (empty cells for non-series books)

### Column Design

**Two new columns:**

| Column | Type | Width | Sortable | Default Visible |
|--------|------|-------|----------|-----------------|
| **Series** | Text | 150px | Yes | Yes |
| **#** | Decimal | 60px | Yes | Yes |

**Display format:**
- Series: Plain text (e.g., "Dresden Files", "Hardy Boys")
- #: Decimal with up to 2 places (e.g., "1", "3.5", "10")
- Empty cells for non-series books (null values)

**Column chooser integration:**
- Both columns available in column chooser
- Can be hidden independently
- Width resizable like existing columns

### Edit Modal Additions

Add two new fields in book edit modal:

**Series Name field:**
- Label: "Series"
- Type: Text input
- Pre-populated from API if available
- Placeholder: "e.g., Dresden Files"
- Optional (can be empty)

**Series Position field:**
- Label: "Series #"
- Type: Number input (accepts decimals)
- Pre-populated from API if available
- Placeholder: "e.g., 1 or 3.5"
- Step: 0.1 (allows fractional input)
- Optional (can be empty)

**Layout suggestion:**
```
┌─ Edit Book ──────────────────────┐
│ Title: [________________]         │
│ Author: [________________]        │
│ Series: [________________]        │
│ Series #: [____]                  │
│ ...other fields...                │
└───────────────────────────────────┘
```

### Multi-Column Sorting

#### UX Pattern: Hybrid Approach

**Three ways to sort:**

1. **Click column header** (existing behavior)
   - Sorts by that column (replaces any existing sort)
   - Shows ↑ or ↓ indicator

2. **Shift+Click column header** (NEW - power user)
   - Adds column to sort chain as secondary/tertiary sort
   - Shows priority indicators: ↑₁ ↑₂ ↑₃
   - Tooltip: "Click to sort • Shift+Click to add to sort"

3. **Column menu** (NEW - discoverability)
   - Small ⋮ icon on each column header
   - Click opens dropdown menu:
     - "Sort A→Z" (primary, replaces existing)
     - "Sort Z→A" (primary, replaces existing)
     - "Add to sort ↑" (adds as next level)
     - "Add to sort ↓" (adds as next level)
     - "Remove from sort" (if currently in sort chain)
     - "Clear all sorting"

#### Visual Indicators

**Priority numbers:**
- Show on sorted columns: ↑₁ ↑₂ ↑₃
- Subscript style for compactness
- Clear visual hierarchy

**Example:**
```
| Series ↑₁ ⋮ | # ↑₂ ⋮ | Title ⋮ | Author ⋮ |
```

**Status feedback:**
- Optional: Show in header bar "Sorted by Series ↑, then # ↑"
- Clickable to clear all sorting

#### Sort Logic

**Single column sort (existing):**
```javascript
books.sort((a, b) => {
  if (sortColumn === 'series') return a.series?.localeCompare(b.series || '');
  if (sortColumn === 'seriesPosition') return (a.seriesPosition || 0) - (b.seriesPosition || 0);
  // ...other columns
});
```

**Multi-column sort (NEW):**
```javascript
const sortLevels = [
  { column: 'series', direction: 'asc' },
  { column: 'seriesPosition', direction: 'asc' }
];

books.sort((a, b) => {
  for (const level of sortLevels) {
    const result = compareValues(a[level.column], b[level.column], level.direction);
    if (result !== 0) return result;
  }
  return 0;
});
```

**Null handling:**
- null series/position values sort to end (after non-null values)
- Empty strings sort alphabetically

#### State Management

Add to folder state:

```javascript
folder: {
  ...existing,
  sortLevels: [                      // Array of sort levels (replaces single sort)
    { column: 'series', direction: 'asc' },
    { column: 'seriesPosition', direction: 'asc' }
  ]
}
```

**Backward compatibility:**
- Migrate existing `sort: { column, direction }` to `sortLevels: [{ column, direction }]`
- Single-column sort is just array with one element

### Implementation Details

#### 1. Column Registration

Add to column definitions:

```javascript
const columns = {
  ...existing,
  series: {
    label: 'Series',
    width: 150,
    sortable: true,
    visible: true,
    getValue: (book) => book.series || '',
    render: (book) => book.series || '',
  },
  seriesPosition: {
    label: '#',
    width: 60,
    sortable: true,
    visible: true,
    getValue: (book) => book.seriesPosition,
    render: (book) => book.seriesPosition != null ? book.seriesPosition.toString() : '',
  }
};
```

#### 2. Header Rendering

Update column header to include:
- Sort indicator with priority number (↑₁)
- ⋮ menu button
- Hover tooltip
- Click and Shift+Click handlers

```javascript
<th onClick={(e) => handleHeaderClick(column, e.shiftKey)}>
  {column.label}
  {sortIndicator(column)} {/* ↑₁ */}
  <button className="column-menu" onClick={(e) => showColumnMenu(column, e)}>⋮</button>
</th>
```

#### 3. Sort Handler

```javascript
const handleHeaderClick = (column, isShiftKey) => {
  if (isShiftKey) {
    // Add to sort chain
    addSortLevel(column);
  } else {
    // Replace sort with single column
    setSortLevels([{ column, direction: 'asc' }]);
  }
};
```

#### 4. Column Menu Component

Dropdown menu that appears on ⋮ click:

```javascript
const ColumnMenu = ({ column, sortLevels, onSort, onClear }) => {
  const currentSort = sortLevels.find(s => s.column === column);
  const isInSort = !!currentSort;

  return (
    <div className="column-menu-dropdown">
      <div onClick={() => onSort(column, 'asc', false)}>Sort A→Z</div>
      <div onClick={() => onSort(column, 'desc', false)}>Sort Z→A</div>
      <div onClick={() => onSort(column, 'asc', true)}>Add to sort ↑</div>
      <div onClick={() => onSort(column, 'desc', true)}>Add to sort ↓</div>
      {isInSort && <div onClick={() => removeFromSort(column)}>Remove from sort</div>}
      <div onClick={onClear}>Clear all sorting</div>
    </div>
  );
};
```

### Edge Cases

**Fractional positions:**
- Input validation: Accept decimals (e.g., 3.5, 12.1)
- Display: Show as entered (don't round)
- Sorting: Numeric comparison (3.5 sorts between 3 and 4)

**Non-series books:**
- series = null, seriesPosition = null
- Show empty cells
- Sort to end when sorting by series columns

**Mixed series in folder:**
- Sort by Series groups books together
- Then sort by # orders within each series
- This is the primary use case for multi-column sort

**Series without position:**
- series = "Dresden Files", seriesPosition = null
- Shows series name but empty # cell
- Sorts by series name, null position sorts to end

**Position without series:**
- series = null, seriesPosition = 3
- Shows # but no series name
- Edge case, but allowed

### Files to Modify

**readerwrangler.js:**
- Add `series` and `seriesPosition` to book data model
- Add column definitions for new columns
- Update edit modal with series fields
- Add multi-column sort state (sortLevels array)
- Update header rendering (add ⋮ menu, priority indicators)
- Update sort logic to support multi-level sorting
- Add Shift+Click handler for headers
- Add column menu component
- Update column chooser to include new columns
- Migrate existing single-column sort to sortLevels array

**storage.js:**
- Series fields automatically included in book object (no special handling needed)
- Ensure `series` and `seriesPosition` included in backup export JSON
- Ensure `series` and `seriesPosition` imported on restore
- Both fields optional, default to null if missing in imported data

**Fetcher (if modified):**
- Extract series and seriesPosition from Amazon API response
- Map to book object fields

**Backup/Restore:**
- Export: Include `series` and `seriesPosition` in book data (already part of book object)
- Import: Read `series` and `seriesPosition` from imported books
- Backward compatibility: Books without these fields default to null
- Multi-sort state: Include `sortLevels` in folder export/import (part of folder state)

### UX Considerations

**Why two columns instead of combined:**
- Separate sorting: Can sort by series name or position independently
- Flexibility: Can hide Series column if organizing by folder (1 series per folder)
- Clarity: Clear distinction between name and position

**Why Shift+Click:**
- Standard pattern (Excel, Gmail, Google Sheets)
- Fast for power users
- No UI clutter

**Why also add menu:**
- Discoverability for new users
- Self-documenting (menu items explain multi-sort)
- No hidden keyboard shortcuts

**Why priority indicators:**
- Clear visual feedback of sort order
- Shows which columns are in sort chain
- Indicates sort priority (primary, secondary, tertiary)

### Estimated Effort

| Task | Effort |
|------|--------|
| Add series fields to data model | 30 min |
| Add column definitions | 30 min |
| Update edit modal UI | 1 hour |
| Multi-sort state management | 1 hour |
| Header menu component | 1 hour |
| Sort logic (multi-level) | 1.5 hours |
| Visual indicators (↑₁ ↑₂) | 30 min |
| Shift+Click handler | 30 min |
| Testing & edge cases | 1 hour |
| **Total** | ~7.5 hours |

---

## Column Reordering

### Overview

Users should be able to customize their table layout by dragging column headers left or right to reorder them. This provides flexibility in organizing information according to user preference without conflicts with existing header interactions (click to sort, edge drag to resize).

**Key requirements:**
- Drag column headers to reorder horizontally
- Visual feedback during drag (ghost preview, drop indicator)
- No conflicts with click-to-sort or edge-resize
- Persist column order per folder
- Include in backup/export

### Interaction Model

**Three distinct header interactions:**

| Interaction | Hit Zone | Action | Visual Cue |
|-------------|----------|--------|------------|
| **Click** | Anywhere on header | Sort by column | ↑ or ↓ indicator |
| **Shift+Click** | Anywhere on header | Add to multi-sort | ↑₁ ↑₂ ↑₃ indicators |
| **Drag** | Center area (not edge) | Reorder column | Cursor changes to grab (👊) |
| **Drag edge** | 5-10px at column boundary | Resize width | Cursor changes to ↔ |
| **Click ⋮** | Menu icon | Column menu | Dropdown appears |

**No conflicts because:**
- Click vs Drag are inherently different gestures (browser distinguishes)
- Edge resize has specific 5-10px hit zone with different cursor
- This matches Excel, Google Sheets, Airtable patterns

### Visual Feedback

**Cursor changes:**
- **Default**: Standard pointer on header
- **Hover header center**: Grab hand (👊) to indicate draggable
- **Hover edge**: Resize arrows (↔) to indicate resizable
- **During drag**: Grabbing hand (✊)

**During drag:**
1. **Ghost preview**: Semi-transparent copy of column header follows cursor
2. **Drop indicator**: Blue vertical line (3px wide) shows drop position
3. **Source column**: Slightly dimmed or outlined to show original position
4. **Other columns**: Shift left/right to preview final layout (optional)

**Visual example:**
```
Before drag:
| Title | Series | # | Author | Rating |

During drag (dragging "Series" right):
| Title | [Series] | # | │ Author | Rating |
           ↑           ↑   ↑
         Ghost      Current  Drop
         (dragging)  pos     line

After drop:
| Title | # | Author | Series | Rating |
```

### State Management

**Column order stored per folder:**

```javascript
folder: {
  ...existing,
  columnOrder: ['title', 'series', 'seriesPosition', 'author', 'rating', 'price'],
  // Default order if not specified: natural order from column definitions
}
```

**Global default order:**
- Stored in settings or column definitions
- Used when no folder-specific order exists
- User can "Reset to default" via column menu

### Implementation Details

#### 1. Drag Detection

Distinguish between click and drag:

```javascript
let dragStartX, dragStartY;
let isDragging = false;
const DRAG_THRESHOLD = 5; // pixels

onMouseDown = (e, column) => {
  // Ignore if clicking on resize handle (edge detection)
  if (isNearColumnEdge(e, 10)) return;

  dragStartX = e.clientX;
  dragStartY = e.clientY;
  isDragging = false;

  // Attach mousemove listener
  document.addEventListener('mousemove', onMouseMove);
  document.addEventListener('mouseup', onMouseUp);
};

onMouseMove = (e) => {
  const dx = Math.abs(e.clientX - dragStartX);
  const dy = Math.abs(e.clientY - dragStartY);

  if (!isDragging && (dx > DRAG_THRESHOLD || dy > DRAG_THRESHOLD)) {
    isDragging = true;
    startColumnDrag(column);
  }

  if (isDragging) {
    updateDragPreview(e);
    updateDropIndicator(e);
  }
};

onMouseUp = (e) => {
  document.removeEventListener('mousemove', onMouseMove);
  document.removeEventListener('mouseup', onMouseUp);

  if (isDragging) {
    completeColumnDrag(e);
  } else {
    // Was a click, handle sort
    handleSort(column, e.shiftKey);
  }
};
```

#### 2. Drop Position Calculation

Determine where to drop based on mouse position:

```javascript
const getDropPosition = (e) => {
  const headers = document.querySelectorAll('th');

  for (let i = 0; i < headers.length; i++) {
    const rect = headers[i].getBoundingClientRect();
    const midpoint = rect.left + rect.width / 2;

    if (e.clientX < midpoint) {
      return { index: i, position: 'before' };
    }
  }

  return { index: headers.length - 1, position: 'after' };
};
```

#### 3. Reorder Logic

Update column order array:

```javascript
const reorderColumns = (fromIndex, toIndex) => {
  const newOrder = [...columnOrder];
  const [movedColumn] = newOrder.splice(fromIndex, 1);
  newOrder.splice(toIndex, 0, movedColumn);

  setColumnOrder(newOrder);
  saveFolderSettings({ ...folder, columnOrder: newOrder });
};
```

#### 4. Rendering Columns in Order

Render table based on columnOrder:

```javascript
const renderHeaders = () => {
  return columnOrder.map((columnKey) => {
    const column = columns[columnKey];
    return (
      <th key={columnKey}
          onMouseDown={(e) => handleHeaderMouseDown(e, columnKey)}
          style={{ cursor: isNearEdge ? 'col-resize' : 'grab' }}>
        {column.label}
        {sortIndicator(columnKey)}
        <button onClick={() => showMenu(columnKey)}>⋮</button>
        <div className="resize-handle" />
      </th>
    );
  });
};
```

### Edge Cases

**Dragging sorted column:**
- Reordering doesn't affect sort
- Sort indicator moves with column
- Multi-sort priority numbers stay with their columns

**Dragging while multi-sorted:**
- All sort indicators (↑₁ ↑₂) move with columns
- Sort logic unaffected (sorts by column key, not position)

**Fixed columns:**
- Checkbox column (if exists) stays at left (not draggable/reorderable)
- Could add `fixed: true` property to column definition

**Resize after reorder:**
- Column widths stay with columns (stored by column key, not position)

**Reset to default:**
- Add "Reset column order" to column menu or settings
- Clears custom order, uses default from column definitions

**Undo support:**
- Optional: Add undo/redo for column reordering
- Lower priority than other undo operations

### Persistence

**Folder state:**
```javascript
folder: {
  ...existing,
  columnOrder: ['title', 'series', 'seriesPosition', 'author'],
}
```

**Backup/Export:**
- Include `columnOrder` in folder export
- Import restores column order per folder
- Backward compatibility: Default to natural order if missing

**Local storage:**
- Saved automatically on reorder
- Loaded on app start
- Per-folder basis (different orders for different folders)

### Files to Modify

**readerwrangler.js:**
- Add `columnOrder` to folder state (array of column keys)
- Add drag detection logic (mousedown, mousemove, mouseup)
- Add ghost preview rendering (portal/absolute positioned element)
- Add drop indicator rendering (blue line between columns)
- Add reorder logic (splice and update array)
- Update header rendering to use columnOrder
- Update cursor styles (grab, grabbing, col-resize based on position)
- Add "Reset column order" to column menu
- Save columnOrder to folder settings on change

**storage.js:**
- Include columnOrder in backup export (part of folder object)
- Import columnOrder on restore
- Default to null/undefined if missing (use natural order)

### UX Considerations

**Why drag anywhere on header (not just drag handle):**
- Simpler UX, less UI clutter
- Matches familiar patterns (Excel, Sheets)
- No conflict with existing interactions (click vs drag are distinct)

**Why per-folder instead of global:**
- Different folders may have different optimal layouts
- User may want Series columns first in series folders, hidden elsewhere
- Matches existing pattern (sort, column visibility per folder)

**Why ghost preview + drop line:**
- Ghost shows what's being moved
- Drop line shows exactly where it will land
- Standard drag-and-drop visual language

**Why allow during sort:**
- User might want to reorder after sorting
- No technical reason to prevent it
- Keeps UI permissive and flexible

### Estimated Effort

| Task | Effort |
|------|--------|
| Drag detection logic (click vs drag) | 1 hour |
| Edge detection (resize handle zone) | 30 min |
| Ghost preview rendering | 1 hour |
| Drop indicator rendering | 30 min |
| Reorder logic and state management | 1 hour |
| Cursor styling (grab, grabbing, resize) | 30 min |
| Persistence (folder state, backup) | 30 min |
| Testing & edge cases | 1 hour |
| **Total** | ~6 hours |

---

## Right-Click Context Menus

### Overview

Users need quick access to folder and book operations via right-click context menus. Two separate contexts require different menu structures:

1. **Left Panel (Folder Tree)**: Navigation and folder organization
2. **Right Panel (Explorer View)**: Full feature parity with Columns app, including bulk book operations

**Current state:**
- Left panel has a placeholder "type action" dialog (prompt("Enter action: rename, delete, or subfolder"))
- This placeholder is non-standard UX and should be replaced with proper visual context menu
- Right panel currently has no context menu (needs to be added)

### Left Panel vs Right Panel Menus

| Feature | Left Panel (Tree) | Right Panel (Explorer) | Rationale |
|---------|-------------------|------------------------|-----------|
| **Open** | ✅ Yes | ✅ Yes | Navigate into folder |
| **Rename** | ✅ Yes | ✅ Yes | Both locations need rename |
| **Move to** | ✅ Yes | ✅ Yes | Change parent folder |
| **Copy to** | ❌ No | ✅ Yes | Redundant with Cut/Copy/Paste in tree |
| **Create Subfolder** | ✅ Yes | ✅ Yes | Both locations need subfolder creation |
| **Open Books in Amazon** | ❌ No | ✅ Yes | Need to see books first (right pane) |
| **Copy Book Titles** | ❌ No | ✅ Yes | Bulk operation better in right pane |
| **Set Price Goal** | ❌ No | ✅ Yes | Bulk operation better in right pane |
| **Cut/Copy/Paste** | ✅ Yes | ✅ Yes | Both locations support clipboard |
| **Hide Books in Folder** | ❌ No | ✅ Yes | Bulk operation better in right pane |
| **Delete Books in Folder** | ❌ No | ✅ Yes | Bulk operation better in right pane |
| **Delete Folder** | ✅ Yes | ✅ Yes | Both locations need delete |
| **Folder Properties** | ✅ Yes | ✅ Yes | Useful in both locations |

**Design principle:**
- **Left panel = Navigation & Organization**: Lightweight menu for folder structure management
- **Right panel = Selection & Bulk Operations**: Full menu for working with visible content

### Left Panel Context Menu (Folder Tree)

**Menu structure:**

```
┌─────────────────────────────┐
│ Open                        │  ← Navigate into folder
│ Rename                      │  ← F2 inline edit
├─────────────────────────────┤
│ Move to >                   │  ← Change parent
│ Create Subfolder            │  ← New child folder
├─────────────────────────────┤
│ Cut                         │  ← Clipboard (Ctrl+X)
│ Copy                        │  ← Clipboard (Ctrl+C)
│ Paste                       │  ← Clipboard (Ctrl+V)
├─────────────────────────────┤
│ Delete Folder               │  ← Remove (with confirmation)
├─────────────────────────────┤
│ Folder Properties           │  ← Metadata dialog
└─────────────────────────────┘
```

**Replaces:** Current placeholder `prompt("Enter action: rename, delete, or subfolder")` dialog

**Implementation notes:**
- Reuses same components as right panel menu (MenuItem, MenuDivider, FolderTreeSubmenu)
- Just shows subset of menu items
- Same keyboard shortcuts work in both contexts
- Shares clipboard state with right panel

### Right Panel Context Menu (Explorer View)

**Full feature parity with Columns app.**

**Folder context menu** (right-click on folder in Explorer view):

```
┌─────────────────────────────┐
│ Open                        │  <- Navigate into folder
│ Rename                      │  <- Edit folder name
├─────────────────────────────┤
│ Move to >                   │  <- Submenu of target folders
│ Copy to >                   │  <- Submenu (copy folder + contents)
│ Create Subfolder            │  <- New child folder
├─────────────────────────────┤
│ Open Books in Amazon        │  <- Opens all books as tabs (confirm if >10)
│ Copy Book Titles            │  <- Clipboard: all book titles in folder
│ Set Price Goal for Books... │  <- Opens price goal dialog (filter to wishlist)
├─────────────────────────────┤
│ Cut                         │  <- Clipboard: move folder
│ Copy                        │  <- Clipboard: copy folder
│ Paste                       │  <- Paste books/folders from clipboard
├─────────────────────────────┤
│ Hide Books in Folder        │  <- Bulk hide all books
│ Delete Books in Folder      │  <- Bulk delete all books (confirm)
│ Delete Folder               │  <- Remove folder (confirm if has children/books)
├─────────────────────────────┤
│ Folder Properties           │  <- Shows count, created date, metadata
└─────────────────────────────┘
```

**Book context menu** (right-click on books - EXISTING, included for completeness):
- Already implemented in Columns app
- Same menu should work in Explorer view
- Items: Move to, Copy to, Open in Amazon, Copy Titles, Set Price Goal, Cut, Copy, Hide Books, Delete Books

**Mixed selection handling:**
- If folders + books selected, show combined menu
- Folder operations apply to folders, book operations apply to books
- Disabled items shown dimmed with tooltip explaining why

### Core Behavior

#### 1. Open (folders only)
- **Action**: Navigate into folder (same as double-click)
- **Shortcut**: Enter key
- **Disabled**: Never (always available for folders)

#### 2. Rename (folders only)
- **Action**: Open inline rename editor (like File Explorer F2)
- **Shortcut**: F2 key
- **Validation**: No empty names, no duplicates at same level
- **Cancel**: Esc key

#### 3. Move to > (folders and books)
- **Action**: Opens submenu showing folder tree
- **Submenu**: Indented tree structure with checkmarks for current location
- **Behavior**: Moves selected folder(s) to chosen parent
- **Disabled**: If target would create circular reference
- **Confirmation**: If moving folder with many descendants (>20)

#### 4. Copy to > (folders and books)
- **Action**: Opens submenu showing folder tree
- **Submenu**: Same structure as "Move to"
- **Behavior**: Creates copy of folder + all contents at target
- **Naming**: Appends " (Copy)" to avoid conflicts
- **Deep copy**: Recursively copies all child folders and books

#### 5. Create Subfolder (folders only)
- **Action**: Creates new empty folder as child
- **Naming**: "New Folder" with auto-increment if conflicts
- **Focus**: Enters rename mode immediately
- **Cancel**: Esc deletes the empty folder

#### 6. Open Books in Amazon (folders and books)
- **Action**: Opens all books in folder as Amazon tabs
- **Filtering**: Respects current Explorer filters
- **Confirmation**: If >10 books, show "Open 23 books in Amazon?"
- **Limit**: Cap at 50 tabs (browser stability)
- **Indicator**: Toast showing "Opening 23 books..." with progress

#### 7. Copy Book Titles (folders and books)
- **Action**: Copies all book titles to clipboard
- **Format**: Plain text, one per line, optionally with author
- **Options**: Dialog with format choices:
  - "Title" (simple list)
  - "Title by Author"
  - "Title (Author, Year)"
  - Custom format template
- **Filtering**: Respects current Explorer filters
- **Feedback**: Toast showing "Copied 23 book titles"

#### 8. Set Price Goal for Books... (folders and books)
- **Action**: Opens price goal dialog for bulk setting
- **Workflow**:
  1. Click "Set Price Goal for Books..."
  2. Dialog opens showing all books in folder
  3. **Filter controls**: Wishlist only (checkbox), other filters
  4. **Bulk inputs**: Target price ($), Price trigger (dropdown: "Below", "Any drop", "Specific")
  5. **Preview**: Shows which books will be affected
  6. Click "Apply to X books"
- **Use case**: Filter to wishlist → Set $2.99 target → Daily bargain hunting
- **Disabled**: If no books in selection/folder
- **Persistence**: Price goals saved per book, checked on enrichment

**Price goal dialog mockup:**
```
┌─ Set Price Goal ─────────────────────┐
│                                       │
│ ☑ Wishlist items only                │
│ ☐ Books without existing price goal  │
│                                       │
│ Target Price: [$2.99___]             │
│ Trigger: [Below target ▼]            │
│                                       │
│ Preview: 12 books will be updated    │
│                                       │
│ [Cancel]  [Apply to 12 books]        │
└───────────────────────────────────────┘
```

#### 9. Cut / Copy / Paste (folders and books)
- **Cut**: Moves selected items to clipboard, shows dimmed
- **Copy**: Copies selected items to clipboard
- **Paste**: Inserts clipboard items into current folder
- **Clipboard state**: Persists across folder navigation
- **Visual**: Cut items shown with 50% opacity
- **Cancel cut**: Esc key clears clipboard and restores opacity
- **Shortcuts**: Ctrl+X, Ctrl+C, Ctrl+V

#### 10. Hide Books in Folder (books only, or folder→books)
- **Action**: Sets `hidden: true` on all books in folder
- **Filtering**: Respects current Explorer filters
- **Confirmation**: "Hide 23 books?"
- **Undo**: Single undo operation for entire bulk action
- **Visibility**: Hidden books don't show unless "Show hidden" filter enabled

#### 11. Delete Books in Folder (books only, or folder→books)
- **Action**: Permanently deletes all books in folder
- **Filtering**: Respects current Explorer filters
- **Confirmation**: "Delete 23 books? This cannot be undone."
- **Undo**: Not supported (deletion is permanent)
- **Distinction**: Different from "Delete Folder" (which only removes container)

#### 12. Delete Folder (folders only)
- **Action**: Removes folder from hierarchy
- **Behavior options**:
  - **Empty folder**: Delete immediately (with confirmation)
  - **Folder with books**: "Delete folder and move books to parent?"
  - **Folder with subfolders**: "Delete folder and all 5 subfolders?"
- **Confirmation**: Required, shows impact clearly
- **Undo**: Single undo operation (restores folder + structure)
- **Disabled**: For special folders (Inbox, All Books, My Library)

#### 13. Folder Properties (folders only)
- **Action**: Opens modal showing folder metadata
- **Contents**:
  - Name (editable)
  - Created date
  - Last modified
  - Book count (total / wishlist / owned)
  - Subfolder count
  - Total size (sum of book counts recursively)
  - Custom fields (future: tags, notes)
- **Save**: Changes persist immediately

**Properties dialog mockup:**
```
┌─ Folder Properties ──────────────────┐
│                                       │
│ Name: [Dresden Files_________]       │
│                                       │
│ Created: 2025-12-15                   │
│ Modified: 2026-01-30                  │
│                                       │
│ Books: 15 (12 owned, 3 wishlist)     │
│ Subfolders: 2                         │
│ Total books (recursive): 23           │
│                                       │
│ [Cancel]  [Save]                      │
└───────────────────────────────────────┘
```

### Implementation Details

#### 1. Context Menu Component

**Trigger:**
- Right-click on folder row (List view)
- Right-click on folder tile (Cover view)
- Long-press on touch devices (500ms)

**Positioning:**
- Appears at mouse cursor position
- Constrained to viewport (flip if near edge)
- z-index above all other content

**Rendering:**
```javascript
const FolderContextMenu = ({ folder, position, onClose }) => {
  const hasBooks = getFolderBookIds(folder.id).length > 0;
  const hasSubfolders = folders.some(f => f.parentId === folder.id);
  const canPaste = clipboardState.items.length > 0;

  return (
    <div className="context-menu" style={{ top: position.y, left: position.x }}>
      <MenuItem icon="📂" onClick={() => navigateToFolder(folder.id)}>Open</MenuItem>
      <MenuItem icon="✏️" onClick={() => startRename(folder.id)}>Rename</MenuItem>
      <MenuDivider />
      <SubMenuItem icon="➡️" label="Move to">
        <FolderTreeSubmenu onSelect={(targetId) => moveFolder(folder.id, targetId)} />
      </SubMenuItem>
      <SubMenuItem icon="📋" label="Copy to">
        <FolderTreeSubmenu onSelect={(targetId) => copyFolder(folder.id, targetId)} />
      </SubMenuItem>
      <MenuItem icon="➕" onClick={() => createSubfolder(folder.id)}>Create Subfolder</MenuItem>
      <MenuDivider />
      <MenuItem icon="🌐" onClick={() => openBooksInAmazon(folder.id)} disabled={!hasBooks}>
        Open Books in Amazon
      </MenuItem>
      <MenuItem icon="📄" onClick={() => copyBookTitles(folder.id)} disabled={!hasBooks}>
        Copy Book Titles
      </MenuItem>
      <MenuItem icon="💰" onClick={() => setPriceGoalDialog(folder.id)} disabled={!hasBooks}>
        Set Price Goal for Books...
      </MenuItem>
      <MenuDivider />
      <MenuItem icon="✂️" onClick={() => cutFolder(folder.id)}>Cut</MenuItem>
      <MenuItem icon="📋" onClick={() => copyFolder(folder.id)}>Copy</MenuItem>
      <MenuItem icon="📌" onClick={() => paste(folder.id)} disabled={!canPaste}>Paste</MenuItem>
      <MenuDivider />
      <MenuItem icon="👁️" onClick={() => hideBooksInFolder(folder.id)} disabled={!hasBooks}>
        Hide Books in Folder
      </MenuItem>
      <MenuItem icon="🗑️" onClick={() => deleteBooksInFolder(folder.id)} disabled={!hasBooks} className="danger">
        Delete Books in Folder
      </MenuItem>
      <MenuItem icon="🗑️" onClick={() => deleteFolder(folder.id)} className="danger">
        Delete Folder
      </MenuItem>
      <MenuDivider />
      <MenuItem icon="ℹ️" onClick={() => showFolderProperties(folder.id)}>Folder Properties</MenuItem>
    </div>
  );
};
```

#### 2. Folder Tree Submenu Component

For "Move to" and "Copy to":

```javascript
const FolderTreeSubmenu = ({ currentFolderId, onSelect }) => {
  // Build recursive tree, exclude current folder and descendants
  const buildTree = (parentId, depth = 0) => {
    return folders
      .filter(f => f.parentId === parentId && !isDescendantOf(f.id, currentFolderId))
      .map(f => (
        <div key={f.id}>
          <MenuItem
            style={{ paddingLeft: depth * 16 }}
            onClick={() => onSelect(f.id)}
            icon={f.parentId === currentFolderId ? "✓" : "📁"}>
            {f.name}
          </MenuItem>
          {buildTree(f.id, depth + 1)}
        </div>
      ));
  };

  return (
    <div className="folder-tree-submenu">
      <MenuItem onClick={() => onSelect(null)} icon={currentFolderId === null ? "✓" : "📁"}>
        Root
      </MenuItem>
      {buildTree(null)}
    </div>
  );
};
```

#### 3. Price Goal Dialog

```javascript
const PriceGoalDialog = ({ folderId, onClose }) => {
  const [wishlistOnly, setWishlistOnly] = useState(true);
  const [targetPrice, setTargetPrice] = useState('');
  const [trigger, setTrigger] = useState('below');

  const bookIds = getFolderBookIds(folderId);
  const books = bookIds.map(id => state.books.find(b => b.id === id));
  const filteredBooks = books.filter(b => {
    if (wishlistOnly && !b.onWishlist) return false;
    return filterBookForExplorer(b); // Respect current filters
  });

  const handleApply = () => {
    const priceNum = parseFloat(targetPrice);
    if (isNaN(priceNum)) {
      showToast('Invalid price');
      return;
    }

    // Bulk update all filtered books
    const updatedBooks = filteredBooks.map(b => ({
      ...b,
      targetPrice: priceNum,
      priceTrigger: trigger
    }));

    // Save to state and IndexedDB
    updateBooks(updatedBooks);
    showToast(`Price goal set for ${updatedBooks.length} books`);
    onClose();
  };

  return (
    <Dialog title="Set Price Goal" onClose={onClose}>
      <Checkbox checked={wishlistOnly} onChange={setWishlistOnly}>
        Wishlist items only
      </Checkbox>
      <Input label="Target Price" value={targetPrice} onChange={setTargetPrice} prefix="$" />
      <Select label="Trigger" value={trigger} onChange={setTrigger} options={[
        { value: 'below', label: 'Below target' },
        { value: 'any', label: 'Any price drop' },
        { value: 'specific', label: 'Specific price' }
      ]} />
      <div className="preview">
        Preview: {filteredBooks.length} books will be updated
      </div>
      <div className="dialog-buttons">
        <Button onClick={onClose}>Cancel</Button>
        <Button onClick={handleApply} primary>Apply to {filteredBooks.length} books</Button>
      </div>
    </Dialog>
  );
};
```

### Edge Cases

**Right-click on empty space:**
- Show context menu with folder-level operations (Create Subfolder, Paste, Folder Properties)
- "Folder Properties" shows current folder properties

**Right-click on selected items:**
- If clicking on selected item, show menu for all selected items
- If clicking on unselected item, clear selection and show menu for clicked item only
- Matches File Explorer behavior

**Circular reference prevention:**
- "Move to" submenu grays out folder and all descendants
- Shows tooltip: "Can't move folder into itself"

**Special folders:**
- Inbox, All Books, My Library: Disable rename, delete, cut
- Show "(System folder)" in properties

**Empty clipboard:**
- "Paste" menu item disabled (grayed out)
- Tooltip: "Nothing to paste"

**Large operations:**
- Opening >10 Amazon tabs: Confirmation dialog
- Deleting >20 books: Confirmation with count
- Copying folder with >50 books: Progress indicator

**Filter interaction:**
- "Delete Books in Folder" respects current filters
- Confirmation shows: "Delete 12 visible books? (23 total books in folder)"
- User can choose: "Delete visible only" or "Delete all in folder"

### Files to Modify

**readerwrangler.js:**
- Add `FolderContextMenu` component (shared by left and right panels)
- Add `PriceGoalDialog` component
- Add `FolderPropertiesDialog` component
- Add `FolderTreeSubmenu` component
- **Left panel**: Replace `prompt()` placeholder with visual context menu on folder right-click
- **Right panel**: Add right-click handlers to folder rows/tiles in Explorer view
- Add clipboard state management (cut/copy/paste)
- Add bulk operation functions:
  - `openBooksInAmazon(folderId)`
  - `copyBookTitles(folderId)`
  - `setPriceGoalBulk(folderId, targetPrice, trigger)`
  - `hideBooksInFolder(folderId)`
  - `deleteBooksInFolder(folderId)`
  - `deleteFolder(folderId)`
- Add folder operations:
  - `renameFolder(folderId, newName)`
  - `createSubfolder(parentId)`
  - `copyFolderTo(folderId, targetParentId)`
- Update keyboard shortcuts (Ctrl+X, Ctrl+C, Ctrl+V, F2, Delete)

**storage.js:**
- No changes needed (price goals already part of book object)
- Clipboard state is transient (not persisted)

**uiHelpers.js:**
- Add `formatBookTitleList(books, format)` for clipboard export
- Add `validateFolderName(name, parentId, excludeId)` for rename

### UX Considerations

**Why full parity instead of subset:**
- Users expect consistency across app interfaces
- Power-user workflows (wishlist + price goals) enabled
- No feature discoverability issues (all options visible)
- No "why can't I do X here?" frustration

**Why context menu instead of just toolbar:**
- Context menus are faster (right-click on target)
- No need to select first, then find toolbar button
- Natural pattern for folder operations (File Explorer, Finder)
- Toolbar still useful for frequent operations

**Why "Set Price Goal" in context menu:**
- Enables critical workflow: filter wishlist → bulk set $2.99
- Already proven valuable in Columns app
- Context menu makes it discoverable in Explorer view
- Natural bulk operation (apply to all books in folder)

**Why include folder properties:**
- Provides metadata at a glance
- Useful for auditing organization (book counts)
- Future extensibility (tags, notes, custom fields)
- Matches File Explorer pattern (right-click → Properties)

### Estimated Effort

| Task | Effort |
|------|--------|
| Context menu component (basic structure, shared) | 1 hour |
| Left panel: Replace placeholder with visual menu | 1 hour |
| Right panel: Add context menu to folder rows/tiles | 1 hour |
| Folder tree submenu (Move to / Copy to) | 1.5 hours |
| Price goal dialog | 2 hours |
| Folder properties dialog | 1 hour |
| Bulk operations (open Amazon, copy titles, hide, delete) | 2 hours |
| Clipboard state (cut/copy/paste, shared) | 1.5 hours |
| Keyboard shortcuts (F2, Ctrl+X/C/V, Delete) | 1 hour |
| Rename inline editing | 1 hour |
| Confirmation dialogs | 1 hour |
| Testing & edge cases (both panels) | 2 hours |
| **Total** | ~16 hours |

---

## Session Checklist (Accumulated Items)

### Completed This Session
- [x] **Phase A-D: Folder drag/drop** - Dragging, zone detection, visual feedback, drop actions
- [x] **Undo for all folder operations** - Reparent and reorder both have undo/redo
- [x] **Breadcrumb navigation** - Clickable path in header
- [x] **Tree auto-expansion** - On navigation + drag hover (500ms delay)
- [x] **Drag to breadcrumb** - Move folder/books to ancestor by dropping on breadcrumb
- [x] **Resizable left pane** - Drag divider to resize sidebar (v5.0.0-alpha.91)
- [x] **Navigation history (Back/Forward)** - Browser-style navigation with Alt+Left/Right (v5.0.0-alpha.92)
- [x] **Phase E: Left panel folder reordering** - Drag in sidebar tree
- [x] **All Books folder tooltip** - Hover shows folder location(s) with clickable links
- [x] **Column chooser** - Select which columns to show in list view
- [x] **Backup restore: Include folders structure** - Folders now included in backup/restore
- [x] **Sort persistence per folder** - Remember sort settings per folder
- [x] **Checkbox selection** - Hover-reveal checkboxes for book/folder selection (v5.0.0-alpha.119-124)

### Pending - Bugs
- [x] **Library Fetcher fetched bad price** - RESOLVED: B0079XPUOW was API bad data (now correct), B003K15PAQ was orphaned wishlist book (stale data). Fixed by triggering amazon-library.json download when restoring backup (v5.0.0-alpha.126)
- [ ] **Right panel tooltip unreachable** - When user moves cursor over tooltip with link, tooltip disappears

### Pending - Features
- [ ] **Left panel context menu** - Replace placeholder "type action" dialog with proper visual context menu. Items: Open, Rename, Move to, Create Subfolder, Cut/Copy/Paste, Delete Folder, Properties.
- [ ] **Right panel context menu** - Full parity with Columns app: Move to, Copy to, Open in Amazon, Copy Titles, Set Price Goal, Cut/Copy/Paste, Hide/Delete Books, Delete Folder, Properties. Enables wishlist filtering + bulk price goal workflow.
- [ ] **Filtered folder view** - When filter active: auto-hide empty folders, auto-expand matches, show X/Y counts, "Showing X of Y folders • Show all" indicator
- [ ] **Series columns** - Add "Series" (text) and "#" (decimal) columns, populated from API or manual entry, supports fractional positions (3.5)
- [ ] **Multi-column sorting** - Shift+Click to add secondary/tertiary sorts, visual indicators (↑₁ ↑₂), column menu for discoverability
- [ ] **Column reordering** - Drag column headers to reorder, ghost preview and drop indicator, persists per folder
- [ ] **Search (jump-to)** - Jump to book/folder by name (distinct from filter)
- [ ] **Cut/copy/paste** - Keyboard shortcuts for book operations (integrated with context menu)
- [ ] **Nested folder creation via drag** - Drag folder onto another to create as child

### Pending - Other
- [ ] **Ctrl+A select all in right pane** - Bug: selects books in mixed folder even if current selection is a folder
- [ ] **Mobile/responsive layout** - Adapt for smaller screens

### Principle
> **Undo should be part of basic implementation** - Every new operation should include undo support
