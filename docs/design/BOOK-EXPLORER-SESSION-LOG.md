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

### Right Panel Book Context Menu (v5.0.0-alpha.167.6 - 168.4)
**Status:** ✅ COMPLETE
**Reference:** [FOLDER-DRAG-DROP.md](FOLDER-DRAG-DROP.md#right-click-context-menus) lines 1069-1073
**Time Spent:** ~8 hours (estimated 14 hours, actual faster due to code reuse)

**Goal:** Add right-click context menu for books in Book Explorer right panel (list and cover views), matching Columns App functionality.

---

#### Implementation Journey

**Alpha 167.6: Phase 1 - Basic Menu Structure**
- Copied context menu component from Columns App
- Added `explorerBookContextMenu` state
- Added right-click handlers to book rows (list view) and tiles (cover view)
- Selection logic: right-click on selected book keeps selection, right-click on unselected book selects it
- Viewport-aware positioning (adjusts near edges)

**Alpha 167.7: Phase 2 - Move to / Copy to Submenus**
- Replaced column list submenus with folder tree submenus
- Reused `FolderTreeSubmenu` component from left panel context menu
- Implemented `handleMoveToFolder()` and `handleCopyToFolder()` functions
- Added undo support for move/copy operations

**Alpha 167.8: Phase 3 - Other Menu Items**
- **Open in Amazon**: Initially allowed multiple books (with confirmation for >3, max 10)
  - **Problem discovered**: Popup blockers prevent opening multiple tabs
  - **Solution (alpha.167.9)**: Limit to single book only, added clipboard fallback for URL
  - **Alternative solution**: Added "Amazon" column to list view for quick single-book access
- **Copy Titles**: Copies selected book titles to clipboard
- **Add Note**: Opens note editor for single book (disabled for multi-select)
- **Set Price Goal**: Submenu with presets ($0.99-$4.99), Custom, Clear

**Alpha 168.1-168.4: Phase 4 - Cut/Copy/Paste & Hide/Remove**

**Cut/Copy/Paste Implementation:**
- Added menu items with keyboard shortcut hints (Ctrl+X/C/V)
- Keyboard handlers in Explorer view (lines 1467-1596)
- Visual feedback: 50% opacity for cut books in both List and Cover views
- Clipboard state: `{ type: 'cut'|'copy', bookIds: [], sourcePositions: [] }`
- sourcePositions for Explorer: `{ bookId, folderId }` (simpler than Columns App)

**Undo/Redo for Paste Operations:**
- Added PASTE_BOOKS_CUT and PASTE_BOOKS_COPY action types
- Implemented handlers in `executeUndo()` (lines 4174-4207)
- Implemented handlers in `executeRedo()` (lines 4560-4593)
- Cut-paste undo: moves books back to source folder
- Copy-paste undo: removes books from destination folder

**Hide Book:**
- Smart toggle: "Hide" if all selected books visible, "Unhide" if all hidden
- Works with both GUID-based entries and legacy books
- Uses existing `toggleHideBooks()` function

**Remove from Folder:**
- Removes selected books from current folder only (book stays in library)
- Disabled in All Books (virtual folder, no actual removal)
- Disabled in Inbox (special folder)
- Matches DEL key behavior

---

#### Bug Fixes During Implementation

**1. Keyboard Fall-Through Bug (alpha.168.2)**
- **Symptom**: Ctrl+V created duplicate books in destination folder
- **Cause**: Explorer keyboard handler for Ctrl+V didn't `return`, so Columns App handler also executed
- **Fix**: Added `return;` at end of all Explorer keyboard handlers (Ctrl+X, Ctrl+C, Ctrl+V)

**2. Undo Not Working for Cut-Paste (alpha.168.2)**
- **Symptom**: Ctrl+Z did not reverse cut-paste operations
- **Cause**: Recorded undo actions but never implemented the handlers
- **Fix**: Added case handlers for PASTE_BOOKS_CUT and PASTE_BOOKS_COPY in both `executeUndo()` and `executeRedo()` switch statements

**3. Menu Organization (alpha.168.3-168.4)**
- Multiple iterations to match user's desired layout
- Final structure matches Columns App with logical groupings:
  1. Move to / Copy to (folder operations)
  2. Cut / Copy / Paste (clipboard operations) with separator
  3. Open in Amazon / Copy Titles
  4. Add Note / Set Price Goal
  5. Hide Book / Remove from Folder

---

#### Code Locations

| Feature | Lines | Notes |
|---------|-------|-------|
| Explorer keyboard handlers (Ctrl+X/C/V) | 1467-1596 | With `return` statements |
| PASTE_BOOKS_CUT/COPY undo handlers | 4174-4207 | In `executeUndo()` |
| PASTE_BOOKS_CUT/COPY redo handlers | 4560-4593 | In `executeRedo()` |
| Cut book opacity (List view) | 9527-9539 | Inline style IIFE |
| Cut book opacity (Cover view) | 9922-9935 | Inline style IIFE |
| Context menu (Cut/Copy/Paste section) | 12296-12456 | After Move to/Copy to |
| Context menu (Hide/Remove section) | 12629-12685 | At end of menu |
| Amazon column visibility | 230-237 | `visibleColumns` state |
| Amazon column width | 240-248 | `columnWidths` state |

---

#### Final Menu Structure

```
Move to           →  [folder tree submenu]
Copy to           →  [folder tree submenu]
─────────────────────────────────────────
Cut               Ctrl+X
Copy              Ctrl+C
Paste             Ctrl+V     (grayed if clipboard empty)
─────────────────────────────────────────
Open in Amazon               (single book only)
Copy Title(s)
─────────────────────────────────────────
Add Note                     (single book only)
Set Price Goal    →  [preset submenu]
─────────────────────────────────────────
Hide Book                    (or "Unhide Book")
Remove from Folder           (disabled in All Books/Inbox)
```

---

#### Lessons Learned

1. **Return statements in keyboard handlers**: When extending keyboard handling to new views, always `return` after handling to prevent fall-through to other handlers.

2. **Undo/redo requires both directions**: When adding new action types, must implement both `executeUndo()` and `executeRedo()` handlers - easy to forget the redo side.

3. **Popup blockers defeat multi-tab opens**: Browser security prevents opening multiple tabs from a single click. Alternative approaches needed (clipboard URL, new column).

4. **Menu organization matters**: Users have strong opinions about menu layout. Match existing patterns (like Columns App) and iterate based on feedback.

5. **sourcePositions simplification**: Explorer uses `{ bookId, folderId }` vs Columns App's `{ columnId, index }`. Simpler because folder membership is boolean, not positional.

---

#### Design Decision: Remove from Folder vs Delete

**Implemented:** "Remove from Folder" only
- Removes book from current folder's `bookIds` array
- Book remains in library and other folders
- Safe operation, no confirmation needed
- Disabled in All Books (virtual view) and Inbox (special folder)

**Not Implemented:** "Delete from Library"
- Would permanently remove book from all folders and IndexedDB
- Decided this was too dangerous for v5.0.0
- Users can still hide books if they don't want to see them
- May add in future with strong confirmation dialog

---

### Bug Fixes (v5.0.0-alpha.169.7 - 169.12)
**Status:** ✅ COMPLETE

#### Price Goal & Storage Fixes (alpha.169.7-169.8)

**1. Price Goal Merge Direction Bug (alpha.169.7)**
- **Symptom**: Setting price goal on wishlist book didn't persist after import
- **Cause**: storage.js merge logic used `previousBook.priceTrigger ?? book.priceTrigger`
- **Fix**: Changed to `book.priceTrigger ?? previousBook.priceTrigger` - incoming values take precedence

**2. Custom Price Goal Applied to All Books (alpha.169.8)**
- **Symptom**: Right-click → Set Price Goal → Custom... applied to ALL books, not just selected
- **Cause**: Bulk price modal used `getSelectedBookIds()` (Columns App selection) not `explorerSelectedBooks`
- **Fix**: Added `bulkPriceBookIds` state, stored selection when modal opens

**3. Submenu Viewport Positioning (alpha.169.8-169.9)**
- **Symptom**: Move to, Copy to, Set Price Goal submenus went off-screen
- **Fix**: Added `submenuOnLeft` calculation, submenus flip left when near right edge
- **Fix**: Added vertical positioning for Price Goal submenu (flips up when near bottom)
- **Fix**: Increased main menu height estimate from 300 to 480px

#### Sort Persistence Race Condition (alpha.169.10-169.12)

**1. Sort Column Not Persisting on Refresh**
- **Symptom**: "Under" (delta) sort reverted to "Date Added" after page refresh
- **Root Cause**: React state updates are async - RESTORE EFFECT ran with stale `folderSortSettings = {}` before `setFolderSortSettings` propagated
- **Debug approach**: Added console logging to trace load/restore/save order

**Attempted fixes:**
- alpha.169.10: Added `explorerSettingsLoadedRef` to skip defaults during load (insufficient)
- alpha.169.11: Load per-folder sort directly in LOAD effect (still had race)
- alpha.169.12: Skip RESTORE EFFECT when `folderSortSettings` is empty ✓

**Final fix:**
```javascript
// v5.0.0-alpha.169.12 - Skip if folderSortSettings is still empty (initial state)
if (Object.keys(folderSortSettings).length === 0) {
    return;
}
```

**Lesson Learned:** React effects can run with stale closure values. Check for initial/empty state explicitly rather than relying on refs or timing.

---

### Book Context Menu Tagging (v5.0.0-alpha.170 - 170.1)
**Status:** ✅ COMPLETE
**Reference:** [FOLDER-DRAG-DROP.md](FOLDER-DRAG-DROP.md) line 1514

**Goal:** Add tag management to right-click book context menu (was missing from initial implementation).

---

#### Implementation (alpha.170)

**Tags Submenu Features:**
- Shows count of unique tags across selected books in menu item: `Tags (3)`
- **Current Tags section**: Lists tags on selected books with × to remove
  - Shows partial coverage: `(2/5)` when tag is only on some selected books
- **Add Tag section**: Search/create input field
  - Type to filter existing tags
  - Enter to add matching tag or create new
  - Click tag to add to all selected books
- **Manage Tags...** link: Opens tag management modal

**Multi-book Operations:**
- Add tag: Adds to all selected books that don't have it
- Remove tag: Removes from all selected books that have it
- Tag counts updated in registry automatically

**Viewport Positioning:**
- `tagsItemOffset` (360px) for vertical overflow detection
- `tagsSubmenuOverflows` flips submenu up when near bottom edge
- `submenuOnLeft` flips submenu left when near right edge
- Menu height increased from 480 to 530px for new item

---

#### UX Refinement (alpha.170.1)

**Menu Reorganization:**
- Moved Tags between Add Note and Set Price Goal
- Rationale: Group "annotation" items together (Note, Tags, Price Goal)
- Updated `tagsItemOffset` from 440 to 360 for new position

**Final Menu Structure:**
```
Move to           →
Copy to           →
─────────────────────
Cut / Copy / Paste
─────────────────────
Open in Amazon
Copy Titles
─────────────────────
Add Note              ← annotation (freeform)
Tags              →   ← annotation (enumerated)
Set Price Goal    →   ← annotation (purchase tracking)
─────────────────────
Hide Book             ← removal (soft delete)
Remove from Folder    ← removal (from location)
```

**UX Principle:** Tags and Notes are both user-applied characteristics (enumerated vs freeform), so they belong together. Hide/Remove are both "make it go away" actions, so they stay grouped.

---

#### Code Locations

| Feature | Lines | Notes |
|---------|-------|-------|
| Tags submenu | ~12783-13100 | After Add Note |
| `tagsItemOffset` | ~12327 | Viewport calculation |
| `tagsSubmenuOverflows` | ~12329 | Vertical flip logic |
| Menu height | ~12305 | 530px for all items |

---

### Series Columns (v5.0.0-alpha.171)
**Status:** ✅ COMPLETE
**Reference:** [FOLDER-DRAG-DROP.md](FOLDER-DRAG-DROP.md) line 1515

**Goal:** Add "Series" (text) and "#" (decimal position) columns to Book Explorer list view.

---

#### Implementation

**New Columns:**
- **Series** - Text column showing `book.series`, 150px default width, sortable A-Z
- **#** - Numeric column showing `book.seriesPosition`, 50px default width, center-aligned, sortable with decimal support (3.5, 1.1)

**Column Features:**
- Hidden by default (opt-in via column chooser right-click menu)
- Column order: Name → Author → **Series** → **#** → Rating → Date Added → Price → Goal → Under → Amazon
- Resizable via drag handle on header
- Included in "Show All" button

**Sorting:**
- Series: Alphabetical via `localeCompare`
- #: Numeric via `parseFloat()` - books without position sort to end (`Infinity`)

**Data Source:**
- `book.series` - Series name from Amazon API
- `book.seriesPosition` - Position in series from Amazon API (supports decimals like 3.5)

---

#### Code Locations

| Feature | Lines | Notes |
|---------|-------|-------|
| `visibleColumns` state | ~235-236 | `series: false, seriesNum: false` |
| `columnWidths` state | ~250-251 | `series: 150, seriesNum: 50` |
| Column chooser checkboxes | ~9399-9416 | After Author |
| Table headers | ~9563-9588 | With sort and resize |
| Table cells | ~10157-10162 | `book.series`, `book.seriesPosition` |
| Sorting logic (list) | ~9988-9993 | After author sort |
| Sorting logic (cover) | ~10418-10423 | After author sort |
| Sort label display | ~9319-9320 | "Series" and "#" |

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
- Multi-column sorting
- Column reordering
- Search (jump-to)

_See Session Checklist in FOLDER-DRAG-DROP.md for full list_

---

**Last Updated:** 2026-02-02 (alpha.171)
**Next Update:** As features are completed or significant issues encountered
