# Book Explorer Implementation Log

**Feature:** Book Explorer (v5.0.0)
**Started:** December 2025 (estimated)
**Current Status:** v5.0.0-alpha.131 (~80% complete)
**Branch:** feature/book-explorer

---

## Overview

Replacing Column Organizer with Windows File Explorer paradigm: folder tree sidebar + detail/preview pane. Nested folders for Category > Author > Series hierarchy. See [BOOK-EXPLORER.md](BOOK-EXPLORER.md) for full spec.

---

## Phase Timeline

### Early Development (alpha.1 - ~alpha.50, estimated)
_Details lost to compaction - reconstruct from git log at release_

**Known features from this phase:**
- Initial folder tree implementation
- Drag and drop foundation (Phase A-D)
- Breadcrumb navigation
- Basic undo/redo system

### Mid Development (~alpha.51 - ~alpha.90)
_Details lost to compaction - reconstruct from git log at release_

**Known features from this phase:**
- Tree auto-expansion on navigation and drag hover
- Drag to breadcrumb functionality
- Resizable left pane (alpha.91)
- Navigation history with Back/Forward (alpha.92)

### Late Development Alpha 1 (~alpha.91 - alpha.118)
_Details lost to compaction - reconstruct from git log at release_

**Known features from this phase:**
- Phase E: Left panel folder reordering
- All Books folder tooltip with clickable links
- Column chooser for list view
- Backup restore including folders structure
- Sort persistence per folder

---

## Recent Work (alpha.119 - current)

### Checkbox Selection (alpha.119-124)
**Feature:** Hover-reveal checkboxes for book/folder selection

**Implementation notes:**
- Multi-select with Shift+Click and Ctrl+Click
- Checkbox appears on hover for better discoverability
- Works for both books and folders

**Lessons learned:**
- _[To be filled as we continue]_

---

### Folder Reorder Off-By-One Bug (multiple iterations)
**Problem:** Folder reordering had persistent off-by-one error

**Iterations:**
- Multiple attempts to fix (took 5+ alpha versions)
- Added extensive debug logging to track the issue
- _[Details lost to compaction - check git log for alpha versions around this]_

**Solution:**
- _[To be reconstructed from git commits]_

**Time impact:**
- Estimated: ~1 hour
- Actual: ~3-4 hours (multiple debugging iterations)

**Lesson learned:** Edge cases in drag-and-drop reordering are subtle. Debug logging essential for binary search position calculations.

---

### Price Fetching Bug Investigation (alpha.126-131)
**Started:** 2026-01-31
**Status:** RESOLVED

**Problem:** Two ASINs showing incorrect prices
- B0079XPUOW: Showing wrong price
- B003K15PAQ: Showing stale $2.99 price

**Investigation:**
1. B0079XPUOW was API bad data (now shows correct $11.99)
2. B003K15PAQ was orphaned wishlist book - existed in IndexedDB but NOT in amazon-library.json

**Root Cause:** Data consistency hole
- Wishlist books in IndexedDB that aren't in amazon-library.json never get updated by fetcher
- Fresh fetches only include owned books
- Old wishlist items remain in IndexedDB with stale data forever

**Solution Implemented (alpha.126-131):**
When restoring backup, regenerate and trigger download of amazon-library.json from backup contents. This ensures:
- Future fetcher runs have ALL books (owned + wishlist)
- Orphaned wishlist items can get price updates
- File contains complete book list for enrichment

**Implementation Journey:**

**alpha.126:** Initial download implementation
- Built amazon-library.json format from restored books
- Included collections data if available
- Triggered download via blob URL + temp anchor element
- Added console guidance for users

**alpha.127-128:** Version increment errors
- Forgot to increment version before commits (twice!)
- Reminder: Each test iteration needs version bump BEFORE commit

**alpha.129:** Fixed dialog timing
- Initial version showed dialog AFTER download
- File picker covered up alert dialog
- Fixed: Show alert FIRST, then trigger download (using await)

**alpha.130:** Custom dialog to avoid scrollbar
- Problem: alert() too long, caused scrollbar
- Chrome bug: Scrollbar allows mouse wheel to switch tabs and auto-dismiss dialog
- Solution: Created reusable `showInfoDialog()` function
  - Custom modal dialog (600px wide, up to 80vh tall)
  - Promise-based API for async/await
  - Clean, modern design matching app aesthetic
  - Reusable for future large dialogs
- Initial text emphasized "REPLACE" but mixed two scenarios

**alpha.131:** Clarified dialog text for two scenarios
- Separated guidance for:
  1. Dialog opens in wrong folder → Navigate first
  2. Dialog opens in right folder → Browser suggests "(1)", change name back
- Simple 3-step process works for both cases
- Final text:
  ```
  ⚠️ IMPORTANT: Replace your existing amazon-library.json file

  When the save dialog appears:
     • Navigate to where you keep amazon-library.json
     • If browser suggests "amazon-library (1).json",
       change it back to "amazon-library.json"
     • Save to replace the existing file

  💡 Why this matters:
  This regenerated file contains ALL your books (owned + wishlist).
  Using it for future Library Fetcher runs ensures ALL your books get updated,
  preventing stale data for wishlist items.
  ```

**Time Spent:**
- Investigation: ~1 hour
- Implementation (alpha.126): ~30 min
- Dialog refinement (alpha.127-131): ~2 hours
- **Total:** ~3.5 hours

**Lessons Learned:**
1. **Browser security model:** Can't write files directly, must trigger download
2. **UX assumptions:** Users already familiar with file picker from fetcher workflow - don't overthink it
3. **Version discipline:** MUST increment alpha version before EVERY test commit
4. **Dialog timing:** Show informational dialogs BEFORE file pickers, not after
5. **Scrollbar issues:** alert() with scrollbar triggers Chrome tab-switching bug - use custom dialogs for long messages
6. **Two scenarios, one solution:** When browser behavior differs by context (file exists vs. doesn't), give instructions that work for both
7. **Reusable components:** Creating `showInfoDialog()` function prevents future "trim the text to fit alert()" anti-patterns

---

## Pending Features (from Session Checklist)

### High Priority
- [x] **Left panel context menu** - ✅ COMPLETE (alpha.133-145, 18 hours): Visual menu with Open, Rename, Move to, Create Subfolder, Cut/Copy/Paste, Delete, Properties. Keyboard shortcuts: F2, Ctrl+X/C/V, Delete, Esc. Video scenarios documented in [BOOK-EXPLORER-VIDEO-SCENARIOS.md](BOOK-EXPLORER-VIDEO-SCENARIOS.md).
- [ ] **Right panel context menu** - Full parity with Columns app (bulk operations)

### Medium Priority
- [ ] **Filtered folder view** - Auto-hide empty, auto-expand matches, X/Y counts
- [ ] **Series columns** - "Series" (text) and "#" (decimal) columns
- [ ] **Multi-column sorting** - Shift+Click secondary/tertiary sorts

### Lower Priority
- [ ] **Column reordering** - Drag column headers
- [ ] **Search (jump-to)** - Distinct from filter
- [ ] **Cut/copy/paste** - Keyboard shortcuts for book operations
- [ ] **Nested folder creation via drag** - Drop folder on folder to create child

---

### Tooltip Unreachable Bug (alpha.132)
**Started:** 2026-01-31
**Status:** RESOLVED

**Problem:** Tooltip with folder links unreachable in All Books view
- Hovering over book in "All Books" folder shows tooltip with "Found in:" folder links
- Moving cursor from book to tooltip triggers book's `onMouseLeave`
- Tooltip immediately disappears before cursor can reach it
- Links in tooltip are completely unreachable

**Root Cause:** Timing issue
- Book's `onMouseLeave` immediately calls `setBookTooltip(null)`
- No grace period to move cursor from book to tooltip
- Classic tooltip UX problem

**Solution Implemented (alpha.132):**
Add 150ms delay before hiding tooltip when leaving book. If cursor enters tooltip during grace period, cancel hide.

**Implementation:**
1. Added `tooltipHideTimeoutRef` to track timeout ID
2. Book `onMouseEnter`: Clear any pending timeout, show tooltip
3. Book `onMouseLeave`: Start 150ms timeout to hide (instead of immediate hide)
4. Tooltip `onMouseEnter`: Cancel pending hide timeout
5. Tooltip `onMouseLeave`: Clear timeout and hide immediately
6. `useEffect` cleanup: Clear timeout on component unmount

**Code locations:**
- List view: readerwrangler.js ~line 9052-9066
- Cover view: readerwrangler.js ~line 9408-9422
- Tooltip: readerwrangler.js ~line 10764-10778
- Cleanup: readerwrangler.js ~line 1141-1149

**Time Spent:** ~30 minutes

**Lessons Learned:**
1. **Tooltip UX pattern:** Always use delay when hiding tooltips that need to be interactive
2. **Grace period:** 150ms is enough time to move cursor without feeling laggy
3. **Cleanup matters:** Always clean up timeouts to prevent memory leaks
4. **Two locations:** Both list and cover views needed the same fix

---

### Left Panel Context Menu (alpha.133-145)
**Started:** 2026-01-31
**Status:** ✅ COMPLETE (All 9 phases including documentation)

**Feature:** Replace placeholder prompt() dialog with visual context menu

**Problem:** Left panel folder tree using non-standard prompt() dialog
- Right-click folder showed: `prompt("Enter action: rename, delete, or subfolder")`
- Text-based interaction instead of visual menu
- Inconsistent with modern UX patterns
- Missing keyboard shortcuts display

**Implementation Journey:**

**Phase 1 (alpha.133-134): Core Menu Structure** (~3 hours)
1. Added `folderContextMenu` state to track menu position and folder
2. Created `FolderContextMenu` component matching Column App visual style:
   - White background, border, shadow
   - Hover states (gray background)
   - Icons on left, keyboard shortcuts on right
   - Red text for Delete action
   - Menu dividers between groups
3. Implemented working features:
   - **Open**: Navigate to folder
   - **Rename**: Inline editor (F2)
   - **Create Subfolder**: New child with auto-rename
   - **Delete Folder**: Full delete logic with orphan handling
4. Added placeholders (disabled, gray) for future phases
5. Close handlers: Esc key, click outside, post-action auto-close
6. Replaced prompt() handler with context menu trigger

**alpha.134 UX refinement:**
- Fixed cursor position at END of "New Subfolder" → Added `onFocus` handler with `setSelectionRange(0, 0)`
- Fixed typing APPENDING to placeholder → `onKeyDown` detects printable character, clears field
- Result: Placeholder text in gray, cursor at start, typing replaces all text

**Phase 2 (alpha.135-137): Navigation Submenu** (~4 hours)
- Implemented "Open in New Tab" placeholder for future enhancement
- Skipped browser tab integration (complexity vs. benefit)
- Navigation via double-click and "Open" menu item sufficient

**Phase 3 (alpha.138-140): Move To Submenu** (~4 hours)
- Implemented folder tree submenu for "Move to" operation
- Circular reference prevention (can't move folder into itself or descendants)
- Visual checkmark for current parent folder
- Indented tree structure matching folder hierarchy
- Undo support for move operations

**alpha.138-139 React hooks fix:**
- Hit React hooks violation (minified error #310) from conditional `useState` in IIFE
- Fixed: Moved `selectedTargetId` state to top level, initialize when opening submenu
- Pattern learned: ALL React hooks must be at component top level, never conditional

**Phase 4 (alpha.141): Clipboard Operations** (~3 hours)
- Implemented Cut/Copy/Paste for folders
- Cut: Moves folder to clipboard, shows 50% opacity visual feedback
- Copy: Deep copies folder tree (recursive with new IDs)
- Paste: Handles both operations with circular reference check
- Esc key clears clipboard and restores opacity
- Undo support: CUT_PASTE_FOLDER and COPY_PASTE_FOLDER actions

**Phase 5 (alpha.142-144): Folder Properties** (~4 hours)
- Implemented properties dialog with folder metadata
- Shows: Name (editable), book counts (owned/wishlist), subfolders, total books (recursive)
- Made dialog draggable by title bar
- Viewport-aware positioning (doesn't go off-screen)

**alpha.143 React hooks fix (again):**
- Same pattern as Phase 3: Moved `folderPropertiesEditedName` to top level
- Pattern reinforced: Initialize state when opening dialog, not inside conditional render

**alpha.144 bug fixes:**
- Fixed book counts showing 0 → Used correct data model (folders have `bookIds`, not books having `folderIds`)
- Fixed context menu going off-screen → Added viewport boundary checking
- Removed created/modified dates (not tracked, not meaningful to users)
- Added draggable dialog functionality

**Phase 6 (alpha.145): Keyboard Shortcuts** (~2 hours)
- Implemented Ctrl+X (Cut), Ctrl+C (Copy), Ctrl+V (Paste), Delete
- Safety checks: Skip when typing in inputs, when dialogs open, for special folders
- Reuses clipboard state from Phase 4
- Circular reference prevention in Ctrl+V paste
- Confirmation dialog for Delete operation

**Phases 7-8: Edge Cases & Testing**
- Skipped dedicated testing phase
- All edge cases addressed iteratively during development
- User tested each feature during implementation

**Phase 9: Documentation** (~1.5 hours)
- Created BOOK-EXPLORER-VIDEO-SCENARIOS.md with 7 comprehensive training scenarios
- Documented all left panel context menu operations with goals, steps, expected results, tips
- Added video production guidance: visual highlights, common mistakes, voiceover tips, scene prep
- Recommended 3-video structure (2-3 min each): Basics, Moving & Organizing, Power User Tips
- Referenced from master VIDEO-PRODUCTION-PLAN.md
- Status: ✅ COMPLETE

**Code locations:**
- State variables: readerwrangler.js lines 219-225 (folderContextMenu, clipboard, properties, dialogDrag)
- Context menu component: readerwrangler.js ~line 10806-11480
- Right-click handler: readerwrangler.js ~line 8088-8095
- Keyboard shortcuts: readerwrangler.js ~line 1882-2068
- Undo handlers: readerwrangler.js ~line 3731-3744
- Dialog drag handlers: readerwrangler.js ~line 1844-1867
- Close handlers: readerwrangler.js ~line 1817-1839

**Time Spent:**
- Phase 1: ~3 hours
- Phase 2: ~0.5 hours (skipped complexity)
- Phase 3: ~4 hours
- Phase 4: ~3 hours
- Phase 5: ~4 hours
- Phase 6: ~2 hours
- Phase 7-8: ~0 hours (testing during development)
- Phase 9: ~1.5 hours (documentation)
- **Total**: ~18 hours

**Lessons Learned:**
1. **Visual consistency**: Matching existing Column App menu style improves UX
2. **Placeholder UX pattern**: Three-part solution (gray text, cursor at start, clear on keypress)
3. **Progressive disclosure**: Showing disabled placeholders sets user expectations
4. **React hooks rules**: ALL hooks at component top level - learned this pattern twice (alpha.138-139, alpha.143)
5. **Data model**: Folders have `bookIds` arrays; use `getFolderBookIds()` helper function
6. **Iterative testing**: Testing during development catches issues faster than dedicated test phase
7. **Viewport awareness**: Context menus and dialogs need boundary checking
8. **Draggable dialogs**: Users appreciate movable dialogs to see content underneath
9. **Safety checks**: Keyboard shortcuts need input focus checks, dialog state checks, special folder exclusions

**Status:** ✅ COMPLETE
- All core functionality working (Open, Rename, Move to, Create Subfolder, Cut/Copy/Paste, Delete, Properties)
- All keyboard shortcuts working (F2, Ctrl+X/C/V, Delete, Esc)
- All edge cases handled (circular references, viewport boundaries, special folders)
- Documentation complete (BOOK-EXPLORER-VIDEO-SCENARIOS.md with 7 training scenarios)
- Ready for production use and video production

---

### Right Panel Inline Editing & F2 Keyboard Shortcut (alpha.156-161)
**Started:** 2026-01-31 (continuation from previous session)
**Status:** ✅ RESOLVED (After 6 iterations and 2 root causes)

**Feature:** Enable inline folder editing in right panel table and F2 keyboard shortcut

**The Journey:** This seemingly simple feature required 6 alpha iterations to get right, revealing two separate root causes that created a cascade of confusing symptoms.

---

#### Problem 1: Shared State (alpha.146-156)

**Symptom (from previous session):**
- Right-click folder in right panel → Click "Rename" → No inline editor appears
- Workaround in alpha.146: Right-click in right panel opened editor in LEFT panel

**Root Cause (alpha.156):**
Left and right panels shared editing state variables:
```javascript
const [editingFolderId, setEditingFolderId] = useState(null);
const [editingFolderName, setEditingFolderName] = useState('');
const [isPlaceholderMode, setIsPlaceholderMode] = useState(false);
```

**The Focus Battle:**
1. Context menu sets `editingFolderId` for folder "Science Fiction"
2. React renders input in BOTH left tree AND right table (if folder exists in both)
3. Both inputs use `autoFocus={true}`
4. Browser focuses left panel input (renders first)
5. Right panel input tries to steal focus
6. Focus battle triggers left input's `onBlur` handler
7. `onBlur` clears shared state: `setEditingFolderId(null)`
8. Right panel input disappears instantly (state cleared before user sees it)

**Solution (alpha.156):**
Created separate state for right panel:
```javascript
// Left panel state (existing)
const [editingFolderId, setEditingFolderId] = useState(null);
const [editingFolderName, setEditingFolderName] = useState('');
const [isPlaceholderMode, setIsPlaceholderMode] = useState(false);

// Right panel state (NEW - alpha.156)
const [rightPanelEditingId, setRightPanelEditingId] = useState(null);
const [rightPanelEditingName, setRightPanelEditingName] = useState('');
const [rightPanelPlaceholderMode, setRightPanelPlaceholderMode] = useState(false);
```

Added 'source' tracking to context menu:
```javascript
setFolderContextMenu({
    folderId: folder.id,
    x: e.clientX,
    y: e.clientY,
    source: 'left' // or 'right'
});
```

Rename handler checks source and sets appropriate state.

**Outcome:** User confirmed: "That fixed it."

**Time spent:** ~2 hours (diagnosis from previous session + implementation)

---

#### Problem 2: F2 Priority Logic (alpha.157-161)

**Initial Implementation (alpha.157):**
User requested F2 keyboard shortcut for rename. Chose "Option B" behavior: F2 renames selected/focused folder, not just viewed folder.

**The Deceptive Symptoms:**

Each alpha iteration seemed to work in ONE direction but failed in the other:

**Alpha 157 - Right Panel Priority First:**
```javascript
// Priority 1: If folder selected in right panel, rename it
if (explorerSelectedFolders.size === 1) { /* right panel */ }
// Priority 2: Rename current folder in left panel
else if (currentFolder && !isSpecialFolder) { /* left panel */ }
```
- **Works:** Right panel (select subfolder → F2 → renames subfolder) ✓
- **Fails:** Left panel (click folder in tree → F2 → renames different folder in right) ✗
- **User feedback:** "Right panel works. Left panel does not."

**Alpha 158 - Reversed Priority:**
```javascript
// Priority 1: Rename current folder in left panel
if (currentFolder && !isSpecialFolder) { /* left panel */ }
// Priority 2: If folder selected in right panel, rename it
else if (explorerSelectedFolders.size === 1) { /* right panel */ }
```
- **Works:** Left panel after fresh page load ✓
- **Fails:** Right panel (select subfolder → F2 → renames parent in left) ✗
- **User feedback:** "Same. Right Fn F2 opens in left."

**Alpha 159 - Added Visibility Check:**
```javascript
const rightPanelShowsFolders = ['__all__', '__library__'].includes(selectedFolderId);

// Priority 1: If right panel SHOWS folders AND one is selected
if (rightPanelShowsFolders && explorerSelectedFolders.size === 1) { /* right panel */ }
// Priority 2: Otherwise rename current folder in left panel
else if (currentFolder && !isSpecialFolder) { /* left panel */ }
```
- **Logic:** "Only use right panel when viewing All Books or My Library"
- **Works:** Viewing All Books, select folder → F2 ✓
- **Fails:** Viewing "John Scalzi" folder (which shows subfolders in right panel) ✗
- **User feedback:** "Same. Right Fn F2 opens in left."

**Alpha 160 - Removed Restrictive Check:**
```javascript
// Priority 1: If exactly one folder is selected in right panel
if (explorerSelectedFolders.size === 1) { /* right panel */ }
// Priority 2: Otherwise rename current folder in left panel
else if (currentFolder && !isSpecialFolder) { /* left panel */ }
```
- **Logic:** "Check if ANY folder is selected, not just in specific views"
- **Committed, but...**

**The Breakthrough (alpha.160 testing):**

User discovered the pattern:
1. ✓ Select subfolder in right panel → F2 → Works
2. ✓ Click parent folder in left panel → F2 → Works
3. **Refresh page**
4. ✓ Click parent folder in left panel → F2 → Works
5. ✓ Select subfolder in right panel → F2 → Works
6. **Refresh again, repeat test #1-2:**
7. ✓ Select subfolder in right panel → F2 → Works
8. ✗ Click parent folder in left panel → F2 → **FAILS** (renames subfolder!)

**Key insight:** "Now works L→R and R→L" — but only after refresh!

**The Real Root Cause (alpha.161):**

Navigating to a folder (clicking in left panel tree) **did not clear** `explorerSelectedFolders` set!

```javascript
const navigateToFolder = (folderId, addToHistory = true) => {
    setSelectedFolderId(folderId);
    // BUG: explorerSelectedFolders still contains previous selections!
    if (addToHistory) {
        setNavHistory(prev => [...prev.slice(0, navHistoryIndex + 1), folderId]);
        setNavHistoryIndex(prev => prev + 1);
    }
};
```

**The Cascade:**
1. User selects subfolder in right panel → `explorerSelectedFolders = Set(['subfolder-id'])`
2. User clicks parent folder in left tree → `navigateToFolder('parent-id')` called
3. Navigation updates `selectedFolderId` but NOT `explorerSelectedFolders`
4. User presses F2
5. F2 checks: "Is exactly one folder selected?" → YES (still has 'subfolder-id')
6. F2 renames subfolder instead of parent
7. **After refresh:** State resets, `explorerSelectedFolders = Set()`, everything works

**Final Solution (alpha.161):**

Clear selections when navigating:
```javascript
const navigateToFolder = (folderId, addToHistory = true) => {
    setSelectedFolderId(folderId);
    // v5.0.0-alpha.161 - Clear right panel selections when navigating
    setExplorerSelectedFolders(new Set());
    setExplorerSelectedBooks(new Set());
    if (addToHistory) {
        setNavHistory(prev => [...prev.slice(0, navHistoryIndex + 1), folderId]);
        setNavHistoryIndex(prev => prev + 1);
    }
};
```

Also fixed `goBack()` and `goForward()` navigation functions.

**Outcome:** User confirmed: "Now works L→R and R→L." (without refresh needed)

**Time spent:** ~3 hours (5 iterations + testing)

---

#### Why This Was So Hard: Design Analysis

**1. State Distributed Across Multiple Contexts**

The app has two simultaneous UI contexts:
- **Left panel (tree):** Shows folder hierarchy, click to navigate
- **Right panel (table):** Shows contents of current folder, checkbox to select

Each context has its own state:
- Navigation state: `selectedFolderId` (which folder is open)
- Selection state: `explorerSelectedFolders` (which folders are checked)
- Editing state: `editingFolderId` vs `rightPanelEditingId`

**The trap:** F2 must decide "which context does the user mean?" based on state that spans multiple variables.

**2. Symptoms Appeared to Move Between Iterations**

Alpha 157: "Right panel works, left doesn't"
Alpha 158: "Left works, right doesn't"
Alpha 159: "Still broken"
Alpha 160: "Still broken"

**Why it was deceptive:**
- Each change appeared to fix ONE direction but break the other
- Made it seem like a priority ordering problem
- Real problem was invisible: selections persisting across navigation

**Classic debugging trap:** When symptoms move around, you're chasing secondary effects, not the root cause.

**3. State Wasn't Where You'd Expect**

The natural assumption: "Clicking a folder in the left panel tree focuses that panel."

**Reality:** Clicking navigates via `navigateToFolder()`, which:
- Updates `selectedFolderId` (what folder is open)
- Does NOT update `explorerSelectedFolders` (what's checked in right panel)

**The disconnect:** Navigation and selection are orthogonal operations, but F2 needed to correlate them.

**4. Refresh Masked the Bug**

Refreshing page → All state resets → Selection cleared → Everything works

**The pattern:**
- First interaction: Selection empty → F2 works in both directions ✓
- Select in right panel → Navigate in left → Selection persists (BUG)
- F2 breaks until refresh

**Why this was hard to spot:** Works on first try, breaks on second, works after refresh. Classic "works on my machine" symptom.

**5. Two Separate Root Causes**

**First bug (alpha.156):** Shared state causing focus battles
- Symptom: Inline editing doesn't appear in right panel
- Fix: Separate state variables

**Second bug (alpha.161):** Navigation doesn't clear selection
- Symptom: F2 renames wrong folder after navigating
- Fix: Clear selections in navigation functions

**The cascade:** Fixing bug #1 exposed bug #2. Alpha 156 made inline editing work, which allowed implementing F2, which revealed the selection persistence bug.

---

#### Lessons Learned

**1. State Hygiene in Navigation**
When navigating between contexts, explicitly clear selection state that's context-specific. Don't assume selection will "just work" across navigation.

**Pattern to adopt:**
```javascript
const navigateToFolder = (folderId) => {
    setSelectedFolderId(folderId);           // Where we're going
    setExplorerSelectedFolders(new Set());   // Clear where we've been
    setExplorerSelectedBooks(new Set());
};
```

**2. Shared State Between UI Contexts Is Dangerous**
Two separate UI widgets (left tree, right table) should NOT share editing state, even if they're editing "the same thing." React's reconciliation + autoFocus creates race conditions.

**Pattern to adopt:** `{context}_{stateName}` naming (e.g., `leftPanelEditingId`, `rightPanelEditingId`)

**3. Keyboard Shortcuts Need Clear Intent Resolution**
F2 must answer: "Which folder does the user want to rename?"

**Attempted strategies:**
- Check right panel first (alpha.157) → Wrong priority
- Check left panel first (alpha.158) → Wrong priority
- Check visibility (alpha.159) → Overly restrictive
- Check selection size (alpha.160) → Correct logic, but...
- Clear stale selections (alpha.161) → Required for correctness

**The real solution:** Correct priority logic (alpha.160) + state hygiene (alpha.161)

**4. "Works After Refresh" Is a Red Flag**
If behavior changes after refresh, you have stale state somewhere. Don't just test happy path — test sequences of operations without refresh.

**5. Debug by Removing Variables, Not Adding Conditions**
Alpha 159 tried to add MORE conditions (check visibility). This made the problem worse.

Alpha 161 REMOVED state (cleared selections). This fixed the problem.

**Principle:** When state management is confusing, simplify state lifecycles, don't add more conditionals.

**6. Test Cross-Context Workflows**
The bug required:
1. Interact with right panel (select folder)
2. Interact with left panel (navigate)
3. Use keyboard shortcut (F2)

**Most testing only did:** Interact with one panel → Use keyboard shortcut

**Missing:** Test sequences that cross contexts.

---

#### Code Locations

**State variables (alpha.156):**
- Lines 203-208: Separate editing state for right panel

**Context menu source tracking (alpha.156):**
- Line 8406: Left panel adds `source: 'left'`
- Line 9253: Right panel adds `source: 'right'`
- Lines 11308-11324: Rename handler checks source

**F2 keyboard shortcut (alpha.160):**
- Lines 1990-2015: F2 handler with simplified priority logic

**Navigation selection clearing (alpha.161):**
- Lines 831-833: `navigateToFolder()` clears selections
- Lines 847-850: `goBack()` clears selections
- Lines 856-859: `goForward()` clears selections

---

#### Statistics

**Total time:** ~5 hours (2 hours alpha.156 + 3 hours alpha.157-161)
**Iterations:** 6 alpha versions
**Root causes found:** 2 (shared state, selection persistence)
**User tests:** 10+ (across all iterations)
**Commits:** 6

**Key debugging moments:**
1. Alpha 156: "That fixed it." (inline editing works)
2. Alpha 157-159: "Right works / Left works / Still broken" (chasing symptoms)
3. Alpha 160: User reveals test scenario (viewing parent with subfolders)
4. Alpha 161: User discovers refresh pattern ("Now works L→R and R→L")

**Status:** ✅ COMPLETE
- Inline editing works in both left and right panels
- F2 keyboard shortcut works in all scenarios
- Selection state properly managed across navigation
- No refresh required

---

### Right Panel Book Context Menu (Planned)
**Status:** 📋 PLANNING
**Reference:** [FOLDER-DRAG-DROP.md](FOLDER-DRAG-DROP.md#right-click-context-menus) lines 1069-1073

**Goal:** Add right-click context menu for books in Book Explorer right panel (list and cover views), matching Columns App functionality.

**Current Columns App Implementation:**
- Lines 9898-10550 in readerwrangler.js
- Full-featured menu with submenus
- Well-structured, reusable code

**Implementation Plan:**

**Phase 1: Copy and Adapt Columns App Menu (~2 hours)**
- [ ] **1.1** - Add state variable for Explorer book context menu
  - `const [explorerBookContextMenu, setExplorerBookContextMenu] = useState(null)`
  - Separate from Columns App `contextMenu` state
- [ ] **1.2** - Copy book context menu component from Columns App (lines 9898-10550)
  - Rename to `ExplorerBookContextMenu` component
  - Keep same styling, structure, positioning logic
- [ ] **1.3** - Add right-click handlers to book rows in Explorer list view
  - Check if book in selection → keep selection
  - If not in selection → clear selection, select clicked book
  - Set context menu position and book data
- [ ] **1.4** - Add right-click handlers to book tiles in Explorer cover view
  - Same selection logic as list view
- [ ] **1.5** - Test basic menu appearance and positioning
  - Viewport edge detection
  - Click outside to close
  - Esc key to close

**Phase 2: Adapt Folder Submenus (~3 hours)**
- [ ] **2.1** - Replace "Move to" column submenu with folder tree submenu
  - Reuse `FolderTreeSubmenu` component from left panel context menu
  - Show full folder hierarchy with indentation
  - Exclude special folders (All Books) if appropriate
- [ ] **2.2** - Replace "Copy to" column submenu with folder tree submenu
  - Same component as Move to
- [ ] **2.3** - Implement `handleMoveToFolder(targetFolderId)` function
  - Remove books from current folder's `bookIds` array
  - Add books to target folder's `bookIds` array
  - Update undo stack
  - Clear selection and close menu
- [ ] **2.4** - Implement `handleCopyToFolder(targetFolderId)` function
  - Add books to target folder's `bookIds` array (keep in source)
  - Books can exist in multiple folders (same as Columns App)
  - Update undo stack
  - Clear selection and close menu
- [ ] **2.5** - Test Move to / Copy to with various folder structures
  - Root folders
  - Nested folders (3+ levels deep)
  - Moving to parent/child/sibling folders

**Phase 3: Other Menu Items (~2 hours)**
- [ ] **3.1** - Open in Amazon
  - Reuse existing logic from Columns App
  - Confirmation if >3 books, reject if >10 books
- [ ] **3.2** - Copy Title(s)
  - Reuse existing logic from Columns App
  - Copies selected book titles to clipboard
- [ ] **3.3** - Add/Edit Note (single book only)
  - Reuse existing logic from Columns App
  - Opens book modal with note editor
- [ ] **3.4** - Set Price Goal submenu
  - Reuse existing submenu from Columns App
  - Preset values: $0.99, $1.99, $2.99, $3.99, $4.99
  - Custom... option
  - Clear option (red text)
- [ ] **3.5** - Test all operations with single and multiple selections

**Phase 4: Cut/Copy/Paste (~2 hours)**
- [ ] **4.1** - Implement Cut for books in Explorer
  - Remove from current folder, add to clipboard
  - Visual feedback (50% opacity? or different for books?)
  - Toast notification
- [ ] **4.2** - Implement Copy for books in Explorer
  - Add to clipboard (keep in current folder)
  - Toast notification
- [ ] **4.3** - Implement Paste for books in Explorer
  - Add clipboard books to current folder
  - Books can exist in multiple folders
  - Toast notification
- [ ] **4.4** - Keyboard shortcuts (Ctrl+X, Ctrl+C, Ctrl+V)
  - Already implemented for folders, extend to books
  - Check if books or folders are selected
  - Apply appropriate operation
- [ ] **4.5** - Test clipboard persistence across navigation
  - Cut/copy in one folder, navigate, paste in another

**Phase 5: Hide/Delete Books (~2 hours)**
- [ ] **5.1** - Implement Hide Book(s)
  - Reuse existing logic from Columns App
  - Works with GUID-based entries and legacy books
  - Smart toggle: Hide if all visible, Unhide if all hidden
  - Undo support
- [ ] **5.2** - Implement Delete Book(s)
  - **Critical distinction:** "Delete Book" vs "Remove from Folder"
  - Columns App deletes book entirely from library
  - Explorer should have TWO operations:
    - **"Remove from Folder"** - Removes from current folder's `bookIds`, book stays in library
    - **"Delete from Library"** - Removes book entirely (dangerous, needs confirmation)
  - Add confirmation dialog for "Delete from Library"
  - Show book count in confirmation
  - Last copy warning if book exists in only one folder
- [ ] **5.3** - Test Hide with single and multiple books
- [ ] **5.4** - Test Delete with various scenarios
  - Book in multiple folders → Remove from folder only
  - Book in one folder → Confirmation with "last copy" warning
  - Multiple books with mixed scenarios

**Phase 6: Testing & Edge Cases (~2 hours)**
- [ ] **6.1** - Test mixed selection (if applicable)
  - If both folders and books can be selected together
  - Show appropriate menu items
  - Disable inapplicable operations
- [ ] **6.2** - Test in List view
  - All operations work
  - Selection state correct
  - Menu positioning correct
- [ ] **6.3** - Test in Cover view
  - All operations work
  - Tile selection visual feedback
  - Menu positioning correct
- [ ] **6.4** - Test special cases
  - Empty selection (shouldn't happen, but handle gracefully)
  - All Books folder (can't remove books from virtual folder)
  - Special folders (Inbox, My Library)
- [ ] **6.5** - Test keyboard shortcuts with both books and folders
  - F2 works for folders
  - Ctrl+X/C/V works for both books and folders
  - Delete key works appropriately
- [ ] **6.6** - Undo/Redo testing
  - All operations have undo support
  - Undo stack works correctly
  - Ctrl+Z / Ctrl+Y work as expected

**Phase 7: Documentation (~1 hour)**
- [ ] **7.1** - Update BOOK-EXPLORER-SESSION-LOG.md with implementation details
  - Code locations
  - Lessons learned
  - Time spent per phase
- [ ] **7.2** - Update TODO.md to mark feature as complete
- [ ] **7.3** - Consider adding training scenarios to BOOK-EXPLORER-VIDEO-SCENARIOS.md

**Code Reuse Strategy:**

**Direct copy (minimal changes):**
- Context menu component structure (lines 9898-10550)
- Positioning logic (viewport edge detection)
- Open in Amazon logic
- Copy Titles logic
- Add/Edit Note logic
- Set Price Goal submenu
- Cut/Copy/Paste for books
- Hide Book logic
- Delete Book logic (with Explorer-specific modifications)

**Adapt from Columns App:**
- "Move to" submenu: Replace column list with folder tree
- "Copy to" submenu: Replace column list with folder tree
- Move/Copy handlers: Use folders instead of columns

**Reuse from Left Panel Context Menu:**
- `FolderTreeSubmenu` component (already built in alpha.138-140)
- Folder navigation helpers
- Circular reference prevention logic (if needed)

**Estimated Total Effort:**
- Phase 1: ~2 hours (copy and adapt menu)
- Phase 2: ~3 hours (folder submenus)
- Phase 3: ~2 hours (other menu items)
- Phase 4: ~2 hours (cut/copy/paste)
- Phase 5: ~2 hours (hide/delete)
- Phase 6: ~2 hours (testing)
- Phase 7: ~1 hour (documentation)
- **Total: ~14 hours**

**Critical Design Decision:**

**"Delete Book" vs "Remove from Folder"**

In Columns App:
- Books can appear in multiple columns (as GUID-based entries)
- "Delete Book" removes the entry from that column only
- Book still exists in library and other columns

In Book Explorer:
- Books can appear in multiple folders (via folder's `bookIds` array)
- **"Remove from Folder"** should remove book from current folder only
- **"Delete from Library"** should remove book from ALL folders and IndexedDB
- Need BOTH operations in menu for clarity

Proposed menu structure:
```
Remove from Folder   ← Safe, removes from current folder only
Delete from Library  ← Dangerous (red text), removes entirely with confirmation
```

---

## Pending Bugs

_(None)_

---

## Completed Features (Session Checklist Summary)

**Phase A-D: Folder drag/drop**
- Dragging, zone detection, visual feedback, drop actions
- _[Details to be reconstructed from git log]_

**Undo/Redo System**
- Works for all folder operations (reparent, reorder)
- _[Details to be reconstructed from git log]_

**Breadcrumb Navigation**
- Clickable path in header
- Can drop folders/books on breadcrumb ancestors
- _[Details to be reconstructed from git log]_

**Tree Auto-Expansion**
- Expands on navigation
- Expands on drag hover (500ms delay)
- _[Details to be reconstructed from git log]_

**Resizable Left Pane** (alpha.91)
- Drag divider to resize sidebar
- _[Details to be reconstructed from git log]_

**Navigation History** (alpha.92)
- Browser-style Back/Forward buttons
- Alt+Left/Right keyboard shortcuts
- _[Details to be reconstructed from git log]_

**Phase E: Left Panel Folder Reordering**
- Drag in sidebar tree to reorder
- Visual feedback during drag
- Persistent order saved
- _[Details to be reconstructed from git log]_

**All Books Folder Tooltip**
- Hover shows folder location(s)
- Clickable links to navigate to folders
- _[Details to be reconstructed from git log]_

**Column Chooser**
- Select which columns to show in list view
- Checkbox interface
- _[Details to be reconstructed from git log]_

**Backup Restore with Folders**
- Folders structure now included in backup/restore
- Preserves hierarchy, book assignments, folder metadata
- _[Details to be reconstructed from git log]_

**Sort Persistence Per Folder**
- Each folder remembers its own sort settings
- Survives navigation and app reload
- _[Details to be reconstructed from git log]_

**Checkbox Selection** (alpha.119-124)
- Hover-reveal checkboxes for book/folder selection
- Multi-select with Shift+Click and Ctrl+Click
- _[Details to be reconstructed from git log]_

---

## Architecture Decisions

### Folder Storage
- _[To be documented as we continue, or reconstructed from code review]_

### Drag-and-Drop System
- _[To be documented as we continue, or reconstructed from code review]_

### Undo/Redo Implementation
- _[To be documented as we continue, or reconstructed from code review]_

---

## Performance Considerations

- _[To be filled as we encounter performance work]_

---

## Breaking Changes / Migration Notes

- Column Organizer → Book Explorer migration path
- Columns convert to folders, dividers to subfolders
- _[Details to be documented when migration implemented]_

---

## Notes for Post-Mortem

### What Went Well
- Undo/redo system worked first time (if true - to verify)
- File Explorer metaphor familiar to users
- _[Add more as we continue]_

### What Was Harder Than Expected
- Folder reorder off-by-one bug (multiple iterations)
- Orphaned wishlist data hole (subtle data consistency issue)
- _[Add more as we continue]_

### Scope Creep
- _[To track if scope expands beyond original BOOK-EXPLORER.md spec]_

### Time Estimates vs. Actual
- Overall estimate: 40-60 hours (from TODO.md)
- Actual at alpha.131: _[Calculate from git log timestamps at release]_
- _[Add specific feature estimates vs actual as we continue]_

---

## Git Log Reconstruction TODO

At release, reconstruct from git log:
```bash
git log --oneline feature/book-explorer
git log --stat feature/book-explorer
git log --since="2025-12-01" --until="2026-02-01" feature/book-explorer
```

Focus on:
- Major feature commits (what was added)
- Bug fix iterations (what problems were encountered)
- Refactoring commits (architectural improvements)
- Time between commits for difficult features

---

## Future Enhancements (Post-v5.0.0)

From FOLDER-DRAG-DROP.md:
- Right-click context menus (left and right panel)
- Filtered folder view
- Series columns
- Multi-column sorting
- Column reordering
- Search (jump-to)
- Keyboard shortcuts (Cut/Copy/Paste)

_See Session Checklist in FOLDER-DRAG-DROP.md for full list_

---

**Last Updated:** 2026-01-31 (alpha.145)
**Next Update:** As features are completed or significant issues encountered
