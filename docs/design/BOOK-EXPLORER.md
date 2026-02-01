# Book Explorer UI

## Overview

A Windows File Explorer-style interface for organizing books. Uses a familiar two-pane layout with a folder tree sidebar and a detail/preview pane. Supports nested folders for hierarchical organization (Category > Author > Series).

**Replaces:** DESKTOP-FOLDERS.md (virtual desktop approach), COLUMN-ARRANGER.md, COLUMN-CAROUSEL.md

---

## Problem Statement

With 20+ columns and 2700+ books, the current horizontal column layout becomes unwieldy:
1. **Visual clutter**: Too many columns overwhelm the workspace
2. **Navigation friction**: Finding and comparing distant columns is tedious
3. **No hierarchy**: Flat column structure can't represent Category > Author > Series
4. **Limited sorting**: Cover-only view doesn't support sorting by author, rating, etc.

---

## Core Metaphor

Windows File Explorer (and similar OS file managers):
- **Left pane**: Folder tree with expandable hierarchy
- **Right pane**: Contents of selected folder (list or cover view)
- **Nested folders**: Category > Author > Series (or any user-defined hierarchy)
- **Familiar interactions**: Drag-and-drop, right-click menus, keyboard navigation

---

## Layout

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Filter Bar]                                      [Search: ________] [?]   │
├──────────────────┬──────────────────────────────────────────────────────────┤
│ 📁 All Books     │  Title              │ Author        │ Rating │ Series   │
│ 📁 Unorganized   │─────────────────────┼───────────────┼────────┼──────────│
│ ▼ 📁 Sci-Fi      │  📖 Mistborn #1     │ Sanderson     │ ★★★★★  │ Mistborn │
│   ▼ 📁 Sanderson │  📖 Mistborn #2     │ Sanderson     │ ★★★★★  │ Mistborn │
│     📁 Mistborn  │  📖 Mistborn #3     │ Sanderson     │ ★★★★☆  │ Mistborn │
│     📁 Stormlight│  📖 Elantris        │ Sanderson     │ ★★★★☆  │ -        │
│   📁 Scalzi      │                     │               │        │          │
│ ▼ 📁 Mystery     │                     │               │        │          │
│   📁 Connelly    │                     │               │        │          │
│ 📁 Next Reads    │                     │               │        │          │
└──────────────────┴──────────────────────────────────────────────────────────┘
```

### Left Pane: Folder Tree
- Expandable/collapsible folder hierarchy
- Shows book count per folder (e.g., "Mistborn (3)")
- Drag-and-drop target for moving books
- Right-click context menu for folder operations

### Right Pane: Content View
- **List View**: Sortable columns (title, author, rating, series, etc.)
- **Cover View**: Grid of book covers (like current app)
- Toggle between views with button/keyboard shortcut

---

## Folder Hierarchy

### Structure
```
📁 Category (e.g., Sci-Fi, Mystery, Thriller)
   📁 Author (e.g., Sanderson, Scalzi)
      📁 Series (e.g., Mistborn, Stormlight)
         📖 Books (ordered by user or series position)
```

### No Depth Limit
- Users can create as many levels as needed
- Sweet spot is 2-3 levels; deeper nesting gets unwieldy
- UI naturally discourages excessive depth (tree width, indentation)

### Special Folders
- **All Books**: Virtual folder showing entire library (read-only, can't move books into it)
- **Unorganized**: Default folder for newly imported books without a home

### Folder Properties
| Property | Description |
|----------|-------------|
| `id` | Unique identifier |
| `name` | Display name |
| `parentId` | Parent folder ID (null for root-level) |
| `bookIds` | Ordered array of book IDs in this folder |
| `childFolderIds` | Ordered array of child folder IDs |
| `collapsed` | Whether folder is collapsed in tree view |

---

## Book Placement

### Books Can Exist in Multiple Folders
- Same book ID can appear in multiple folders (like current column app)
- Not copies of data - just references to the same book in IndexedDB
- Use case: "Next Reads" folder + genre folder + author folder

### Manual Ordering
- Users can drag to reorder books within a folder
- Order is persisted per folder
- When dropping into a collapsed folder: book goes to top
- Override Amazon's series position when needed (e.g., novella between #3 and #4)

### Moving Books
| Action | Result |
|--------|--------|
| Drag from list to folder in tree | Move book to that folder |
| Drag from list to path breadcrumb | Move book to that folder |
| Ctrl+drag | Copy (add to destination, keep in source) |
| Right-click > Move to... | Folder picker dialog |
| Cut/Copy + Paste | Standard clipboard operations |

---

## Views

### List View (Default)
Sortable table with configurable columns.

**Default Columns:**
| Column | Sortable | Notes |
|--------|----------|-------|
| Cover (thumbnail) | No | Small thumbnail, ~40px |
| Title | Yes | Primary sort |
| Author | Yes | |
| Rating | Yes | Star display |
| Series | Yes | Series name + position |
| Pages | Yes | |
| Acquisition Date | Yes | When added to library |

**Column Chooser:**
- Right-click column header to show/hide columns
- Drag columns to reorder
- Available columns: Cover, Title, Author, Rating, Series, Series Position, Pages, Acquisition Date, Collections, Read Status, Price, Review Count

### Cover View
Grid of book covers, similar to current column app.

**Behavior:**
- Books reflow to fill pane width
- Configurable cover size (small/medium/large)
- Hover shows title/author tooltip
- Same selection and drag behavior as list view

### View Toggle
- Button in toolbar: [List] [Covers]
- Keyboard shortcut: Ctrl+1 (list), Ctrl+2 (covers)
- View preference persisted per folder (optional) or global

### Sorting vs. Custom Order

Two distinct modes with different behaviors:

| Mode | Column Header Click | Drag to Reorder | Use Case |
|------|---------------------|-----------------|----------|
| **Sorted View** (Title, Author, Rating, etc.) | Changes sort direction | Disabled | Quick browsing, finding books |
| **Custom View** | **Reorders books permanently** | Enabled | Organizing, manual arrangement |

**Custom View workflow:**
1. Open folder (shows custom order - typically acquisition date initially)
2. Click column header (e.g., "Series Position") → books reorder permanently
3. Drag to adjust (e.g., insert omnibus at position 1, move anthology between #3 and #4)
4. Undo captures reorder operations

**Benefits:**
- Immediate visual feedback when reordering
- Consistent mental model: Custom = editable workspace, Sorted = read-only lens
- One-step operation (no separate "Apply" action)
- Column headers are already interactive and discoverable

**Visual cues:**
- Tooltip on Custom view headers: "Click to reorder"
- Animation when reordering so user sees change
- Sort indicator (▲/▼) only shown in Sorted views, not Custom

### Right Pane Content (Folders + Books)

The right pane shows **both subfolders and books** for the selected folder, following OS file explorer conventions.

**Display order:** Subfolders first, then books (standard Windows/macOS behavior)

**List View:**
```
│ Type │ Title              │ Author        │ Rating │ Series   │
│──────┼────────────────────┼───────────────┼────────┼──────────│
│ 📁   │ Dresden Files      │               │        │          │
│ 📁   │ Codex Alera        │               │        │          │
│ 📁   │ Miscellaneous      │               │        │          │
│ 📖   │ Standalone Novel 1 │ Jim Butcher   │ ★★★★☆  │ -        │
│ 📖   │ Standalone Novel 2 │ Jim Butcher   │ ★★★★★  │ -        │
```

**Cover View:**
- Folder tiles: 📁 icon with folder name below
- Book tiles: Cover image with title below
- Folders appear first in grid, then books

**Interactions:**
| Action | On Folder | On Book |
|--------|-----------|---------|
| Single-click | Select (highlight) | Select (highlight) |
| Double-click | Navigate into folder, sync tree selection | Open book detail modal |
| Drag | Move folder (future) | Move book to another folder |

**Benefits:**
- Empty parent folders (e.g., "Jim Butcher" with 0 direct books) show subfolders instead of blank pane
- Consistent with OS file explorer mental model
- Enables navigation without using the tree

---

## Search vs. Filter

Two distinct modes with different purposes:

### Filter (Reduce View)
- Located in filter bar at top
- Hides non-matching items from current view
- Same filters as current app: author, title, rating, read status, etc.
- Folder tree shows filtered counts: "Sanderson (3/12)"
- Empty folders grayed out but not hidden

### Search (Jump To)
- Located in search box at top-right
- Type to see dropdown of top 10 matches (folders and books)
- Matches against: folder names, book titles, author names
- Select result to navigate directly to that item
- Keyboard-driven: type, arrow keys, Enter to select

```
┌─────────────────────────────────┐
│ Search: sand                    │
├─────────────────────────────────┤
│ 📁 Sanderson                    │
│ 📖 Sandman Vol. 1 - Gaiman      │
│ 📖 Sands of Dune - Herbert      │
│ 📖 The Sandcastle - Murdoch     │
└─────────────────────────────────┘
```

---

## Drag and Drop

### Within Right Pane
- Drag to reorder books within folder
- Shift+click for range select, Ctrl+click for multi-select
- Drag selection to move all selected books

### From Right Pane to Tree
- Drag book(s) to any folder in tree
- Folder highlights as drop target
- Drop into collapsed folder: books go to top
- Ctrl+drag: copy instead of move

### Within Tree
- Drag folders to reorder at same level
- Drag folder onto another folder to make it a child
- Drag folder to root area to make it top-level

### Visual Feedback
- Drop target folder highlights
- Insertion line shows where item will land
- Cursor indicates move vs. copy

---

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Ctrl+1` | Switch to list view |
| `Ctrl+2` | Switch to cover view |
| `Ctrl+F` | Focus filter bar |
| `Ctrl+Shift+F` | Focus search box |
| `Enter` | Open selected book (detail modal) |
| `Delete` | Remove selected book(s) from folder (not from library) |
| `Ctrl+C` | Copy selected book(s) |
| `Ctrl+X` | Cut selected book(s) |
| `Ctrl+V` | Paste book(s) into current folder |
| `F2` | Rename selected folder |
| `Ctrl+Shift+N` | New folder |
| `Left/Right` | Collapse/expand folder in tree |
| `Up/Down` | Navigate tree or list |

---

## Context Menus

**See [FOLDER-DRAG-DROP.md - Right-Click Context Menus section](FOLDER-DRAG-DROP.md#right-click-context-menus) for complete specifications.**

### Summary

**Book context menu** (right-click on book):
- Move to, Copy to, Open in Amazon, Copy Title, Add Note, Set Price Goal
- Cut/Copy/Paste (Ctrl+X/C/V)
- Hide Book, Delete Book

**Folder context menu** (right-click on folder):
- **Left panel:** Navigation & organization (Open, Rename, Move to, Create Subfolder, Cut/Copy/Paste, Delete, Properties)
- **Right panel:** Full parity with left panel + bulk operations (Open Books in Amazon, Copy Book Titles, Set Price Goal for Books, Hide/Delete Books in Folder)

**Column header context menu** (list view):
- Sort Ascending / Descending
- Show/Hide Columns submenu
- Reset Column Widths

---

## State Persistence

| State | Persisted | Location |
|-------|-----------|----------|
| Folder structure | Yes | localStorage |
| Book-to-folder assignments | Yes | localStorage |
| Book order within folders | Yes | localStorage |
| Folder collapse states | Yes | localStorage |
| Current folder selection | Optional | sessionStorage |
| Column widths/order | Yes | localStorage |
| View mode (list/cover) | Yes | localStorage |
| Sort column and direction | Yes | localStorage |

---

## Migration from Columns App

### Data Transformation

| Current | Book Explorer | Transformation |
|---------|---------------|----------------|
| Column | Folder (root level) | Direct mapping |
| Divider | Subfolder | Becomes child of column's folder |
| Book in column | Book in folder | bookIds array |
| Book order | Book order | Preserved |

### Migration Steps
1. Detect old format (columns without `parentId`)
2. For each column:
   - Create root-level folder
   - For each divider:
     - Create subfolder
     - Move books under divider into subfolder
   - Remaining books stay in parent folder
3. Save in new format

### Post-Migration User Actions
- Create category folders (Sci-Fi, Mystery, etc.)
- Drag author folders into appropriate categories
- Reorganize as desired

### Migration Code
- Can be console script (single-user case)
- Or auto-detect on load with confirmation dialog
- Put migration code in separate file (`migration-v5.js`) to avoid legacy drag

---

## Integration with Tags

Tags (P1-T3 in roadmap) complement folders:

| Folders | Tags |
|---------|------|
| Where book "lives" | Cross-cutting themes |
| Hierarchical | Flat |
| Single location per copy | Multiple tags per book |
| Category > Author > Series | Time Travel, Military SF, Cozy |

Books can be:
- In folder: `Sci-Fi > Sanderson > Mistborn`
- Tagged: `#epic-fantasy`, `#magic-system`, `#favorite`

Filter by tag shows matching books across all folders.

---

## Implementation Phases

### Phase 1: Core Tree and List View (MVP)
- Folder tree with expand/collapse
- List view with basic columns (title, author, rating)
- Drag books to folders
- Basic folder operations (create, rename, delete)

### Phase 2: Enhanced Features
- Show subfolders in right panel (folders + books view)
- Resizable left pane (drag divider)
- Cover view toggle
- Column chooser
- Search (jump-to)
- Keyboard navigation
- Cut/copy/paste
- All Books: Hover tooltip showing folder location(s) with links that navigate to book in that folder

### Phase 3: Polish
- Drag to reorder folders
- Nested folder creation via drag
- Sort persistence per folder
- Mobile/responsive layout

### Phase 4: Migration
- Auto-detect old format
- Migration dialog
- Transformation script

---

## Alternatives Considered

### Virtual Desktop (DESKTOP-FOLDERS.md)
- Zoomable desktop with folder icons
- **Rejected**: Requires learning new interaction model (zoom/pan); File Explorer is universally familiar

### Flat Folders Only
- No nesting, just rename folders for hierarchy
- **Rejected**: Can't represent Category > Author > Series naturally; power users need hierarchy

### Dual-Pane Split
- Two folder views side by side
- **Deferred to v2**: Tree + drag-to-folder covers 90% of use cases
- **Design options:** See [DUAL-PANE-SPLIT.md](DUAL-PANE-SPLIT.md) for full analysis
  - Option A: Built-in split pane (8-12 hours, native drag works)
  - Option B: BroadcastChannel sync for two browser tabs (4-6 hours, copy/paste only)

---

## Related Documents

- `WIZARD-MODE.md` - Auto-organize by author/series (Phase 5)
- `TAGS.md` - Tag system design (complementary feature)
- `DUAL-PANE-SPLIT.md` - V2 dual-pane design options (deferred)
- `TODO.md` - Priority 1 task list
- `DESKTOP-FOLDERS.md` - Previous virtual desktop design (superseded)
- `COLUMN-ARRANGER.md` - Previous split-pane design (superseded)
- `COLUMN-CAROUSEL.md` - Previous carousel design (superseded)
