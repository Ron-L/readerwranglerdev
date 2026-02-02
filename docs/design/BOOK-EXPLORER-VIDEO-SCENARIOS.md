# Book Explorer Video Scenarios

**Version:** v5.0.0-alpha.169.12
**Last Updated:** 2026-02-02
**Status:** Active documentation for Book Explorer training videos

---

## Overview

Book Explorer introduces a Windows File Explorer paradigm to ReaderWrangler: folder tree sidebar + detail/preview pane. This document outlines training scenarios for video production, organized by feature area.

**Key Paradigm Shift:**
- **Old (Columns):** Horizontal columns with drag-drop
- **New (Book Explorer):** Folder tree (left) + content pane (right), nested hierarchy, File Explorer UX patterns

---

## Left Panel Context Menu (v5.0.0-alpha.133-145)

**Implementation:** 16.5 hours, 7 operations, 5 keyboard shortcuts
**Completed:** 2026-01-31

### Scenario 1: Basic Folder Operations

**Goal:** Navigate and manage folders using context menu

**Steps:**
1. Right-click any folder in left panel tree
2. Visual context menu appears with 7 operations
3. Click "Open" to navigate into folder (same as double-click)
4. Right-click folder → "Rename" → Edit name inline
5. Right-click folder → "Create Subfolder" → New child appears in rename mode
6. Type new name, press Enter to save

**Expected Result:**
- Menu appears at cursor position (viewport-aware, never off-screen)
- Operations execute immediately
- Menu auto-closes after action
- Visual feedback for each operation

**Tips:**
- **F2 is faster than right-click → Rename** (show keyboard shortcut in menu)
- Esc cancels rename and reverts to original name
- Context menu shows keyboard shortcuts on right side

**Visual Highlights:**
- Menu styling: White background, border, shadow, hover states
- Icons on left, shortcuts on right (e.g., "Rename F2")
- Red text for destructive actions (Delete Folder)
- Menu dividers separate operation groups

---

### Scenario 2: Move To Submenu

**Goal:** Reorganize folder hierarchy using Move to submenu

**Steps:**
1. Right-click folder "Science Fiction" in left panel
2. Click "Move to >" → Submenu opens showing folder tree
3. Tree shows indented hierarchy with current parent checkmarked
4. Click target folder "Fiction" to move
5. Folder moves immediately, tree updates

**Expected Result:**
- Submenu shows full folder tree (excluding circular references)
- Current parent has checkmark icon
- Descendants of source folder are grayed out (can't create loop)
- Undo available (Ctrl+Z)

**Edge Cases to Demonstrate:**
- **Circular reference prevention:** Try to move folder into its own subfolder → Disabled in submenu
- **Tooltip:** Hover over disabled folder shows "Can't move folder into itself"
- **Special folders:** All Books, Inbox, My Library don't appear in submenu (system folders)

**Tips:**
- Indentation shows depth (16px per level)
- Checkmark shows where folder currently lives
- Undo works for move operations (Ctrl+Z to undo, Ctrl+Y to redo)

---

### Scenario 3: Clipboard Operations (Cut/Copy/Paste)

**Goal:** Efficiently duplicate or reorganize folder structures

**Steps:**
1. Right-click folder "Brandon Sanderson"
2. Click "Copy" (or press Ctrl+C)
3. Navigate to target folder "Favorite Authors"
4. Right-click target folder → "Paste" (or press Ctrl+V)
5. Folder copy appears as "Brandon Sanderson (Copy)" with all contents

**Alternative: Cut (Move):**
1. Right-click folder → "Cut" (or Ctrl+X)
2. Folder shows 50% opacity (visual feedback)
3. Right-click target → "Paste" (or Ctrl+V)
4. Folder moves (not copied), opacity restored

**Expected Result:**
- **Copy:** Creates deep copy (folder + all subfolders + all books) with new IDs
- **Cut:** Shows visual feedback (50% opacity), moves on paste
- **Paste:** Disabled if clipboard empty (grayed out with tooltip)
- Undo available for both operations

**Edge Cases:**
- **Circular reference:** Cut folder, try to paste into own subfolder → Disabled
- **Cancel cut:** Press Esc → Clears clipboard, restores opacity
- **Clipboard persists:** Navigate to different folder, paste still works

**Keyboard Shortcuts:**
- **Ctrl+X:** Cut (visual: 50% opacity)
- **Ctrl+C:** Copy
- **Ctrl+V:** Paste
- **Esc:** Cancel cut (clear clipboard)

**Tips:**
- Copy creates full duplicate of entire folder tree
- Cut provides visual feedback (dimmed folder)
- Clipboard persists across folder navigation
- Esc clears clipboard and restores cut folder appearance

---

### Scenario 4: Delete Folder with Confirmation

**Goal:** Remove folders with clear understanding of impact

**Steps:**
1. Right-click empty folder "Test"
2. Click "Delete Folder" (red text)
3. Confirmation dialog: "Delete folder 'Test'?"
4. Click "Delete" → Folder removed
5. Press Ctrl+Z to undo deletion

**Folder with Books:**
1. Right-click folder "Dresden Files" (contains 15 books)
2. Click "Delete Folder"
3. Confirmation: "Delete folder 'Dresden Files' and move 15 books to parent?"
4. Click "Delete" → Folder removed, books move up one level

**Folder with Subfolders:**
1. Right-click folder "Fiction" (has 3 subfolders)
2. Click "Delete Folder"
3. Confirmation: "Delete folder 'Fiction' and all 3 subfolders?"
4. Shows total book count: "23 books will be moved to parent"

**Expected Result:**
- Clear confirmation dialogs explaining impact
- Books always preserved (moved to parent)
- Subfolders handled recursively
- Undo restores entire structure (single operation)

**Edge Cases:**
- **Special folders:** All Books, Inbox, My Library → Delete disabled, menu item grayed out
- **Orphan books:** Books in deleted folder move to immediate parent
- **Deep hierarchy:** Deleting parent with many descendants shows total count

**Keyboard Shortcut:**
- **Delete key:** Same as right-click → Delete Folder (with safety checks)

**Safety Features:**
- Must confirm every deletion
- Special folders cannot be deleted
- Skips operation when typing in input fields
- Skips when dialogs are open

---

### Scenario 5: Folder Properties Dialog

**Goal:** View folder metadata and edit folder name

**Steps:**
1. Right-click folder "Dresden Files"
2. Click "Folder Properties"
3. Dialog opens showing metadata:
   - Name: "Dresden Files" (editable text field)
   - Books: 15 (12 owned, 3 wishlist)
   - Subfolders: 2
   - Total books (recursive): 23
4. Edit name → Click "Save" → Changes persist
5. Click "Cancel" → Discards changes

**Expected Result:**
- Dialog is draggable by title bar (cursor shows grab/grabbing)
- Viewport-aware positioning (doesn't go off-screen)
- Book counts accurate (uses correct data model: folders have `bookIds`)
- Recursive count includes all descendants

**Visual Features:**
- **Draggable title bar:** Shows cursor feedback (grab cursor)
- **Mouse drag:** Click title, drag to reposition dialog
- **Viewport boundaries:** Dialog stays within 10px margin from all edges

**Tips:**
- Drag dialog by title bar to see content underneath
- Book counts update immediately when editing folder contents
- Recursive count includes all nested subfolders

**Data Shown:**
- Name (editable)
- Books: X (Y owned, Z wishlist)
- Subfolders: N
- Total books (recursive): M

**Not Shown (Intentionally):**
- Created/modified dates (not tracked, not meaningful to users)

---

### Scenario 6: Keyboard Shortcuts Workflow

**Goal:** Power user efficiency with keyboard-only operations

**Setup:** User has folder tree open, wants to reorganize

**Workflow:**
1. Click folder to select
2. Press **F2** → Inline rename (no menu needed)
3. Type new name, press Enter
4. Press **Ctrl+X** → Cut folder (shows 50% opacity)
5. Click target folder
6. Press **Ctrl+V** → Paste (folder moves)
7. Press **Ctrl+Z** → Undo move
8. Press **Delete** → Confirmation dialog appears
9. Press Esc → Cancel deletion

**Expected Result:**
- All operations work without opening context menu
- Visual feedback for each action
- Keyboard focus managed correctly
- Safety checks still apply (confirmations, special folders)

**All Keyboard Shortcuts:**
- **F2:** Rename folder (inline edit)
- **Ctrl+X:** Cut folder (50% opacity visual)
- **Ctrl+C:** Copy folder
- **Ctrl+V:** Paste folder
- **Delete:** Delete folder (with confirmation)
- **Esc:** Cancel rename / Clear clipboard / Close menu
- **Ctrl+Z:** Undo
- **Ctrl+Y:** Redo

**Safety Checks:**
- Shortcuts disabled when typing in input fields
- Shortcuts disabled when dialogs are open
- Special folders immune to Cut/Delete
- Circular reference prevention in Paste

**Tips:**
- Show keyboard shortcuts in context menu (right side)
- Demonstrate F2 as faster alternative to right-click → Rename
- Emphasize Esc as universal cancel

---

### Scenario 7: Edge Cases and Polish

**Goal:** Demonstrate robustness and UX polish

#### Context Menu Positioning
1. Right-click folder near bottom of screen
2. Menu appears ABOVE cursor (flips to stay in viewport)
3. Right-click near right edge
4. Menu appears to LEFT of cursor
5. Menu never goes off-screen (10px margin)

#### Special Folders Protection
1. Right-click "All Books" folder
2. Notice: Rename, Delete, Cut are DISABLED (grayed out)
3. Tooltip: "System folder cannot be modified"
4. Properties shows "(System folder)" label

#### Circular Reference Prevention
1. Right-click "Fiction" folder
2. Click "Move to >"
3. Notice: "Fiction" and all its subfolders are grayed out
4. Tooltip: "Can't move folder into itself"
5. Only valid targets are selectable

#### Empty Clipboard
1. Ensure clipboard is empty (press Esc if needed)
2. Right-click any folder
3. Notice: "Paste" is grayed out
4. Tooltip: "Nothing to paste"

#### Confirmation Dialogs
1. Delete folder with books → Shows count, explains behavior
2. Delete folder with subfolders → Shows subfolder count + total books
3. Each confirmation clearly states what will happen
4. Cancel button always available

**Expected Result:**
- No crashes, no off-screen menus, no data loss
- Clear feedback for every disabled action
- Confirmations prevent accidental deletions
- Special folders fully protected

---

## Training Video Structure Recommendations

### Video 1: "Book Explorer - Context Menu Basics" (2-3 min)
- Introduce right-click paradigm
- Show basic operations: Open, Rename, Create Subfolder, Delete
- Emphasize keyboard shortcuts (F2, Delete)
- **Target:** New users unfamiliar with File Explorer patterns

### Video 2: "Book Explorer - Moving & Organizing" (2-3 min)
- Move to submenu walkthrough
- Clipboard operations (Cut/Copy/Paste with Ctrl+X/C/V)
- Circular reference prevention demonstration
- **Target:** Users reorganizing existing libraries

### Video 3: "Book Explorer - Power User Tips" (2 min)
- All keyboard shortcuts in action
- Folder Properties for auditing
- Edge cases: Special folders, confirmations, undo
- **Target:** Advanced users wanting efficiency

---

## Video Production Tips

### Visual Highlights to Emphasize
1. **Context menu appearance:** Show right-click trigger, menu animation
2. **Keyboard shortcuts:** On-screen display (e.g., "Ctrl+X" overlay) when pressed
3. **Visual feedback:** 50% opacity on cut folders, checkmarks in submenu
4. **Viewport awareness:** Demonstrate menu flipping near screen edges
5. **Draggable dialog:** Show cursor change, drag motion

### Common Mistakes to Avoid in Demos
- Don't use All Books/Inbox/My Library for destructive operations (they're protected)
- Don't forget to show confirmations (users need to know they exist)
- Don't skip Undo demonstrations (critical safety feature)
- Don't assume users know File Explorer patterns (show basics)

### Voiceover Script Guidelines
- Explain WHY each feature exists (user benefit)
- Mention keyboard shortcuts explicitly ("or press F2")
- Warn about destructive operations before showing them
- Emphasize undo availability

### Scene Prep Checklist
- [ ] Folder tree with 10-15 folders (realistic hierarchy)
- [ ] Mix of empty folders and folders with books
- [ ] At least one folder with subfolders (for delete demo)
- [ ] Clipboard cleared (Esc key)
- [ ] No active dialogs or modals
- [ ] Clear browser console (no error spam)

---

## Future Scenarios (Not Yet Implemented)

### Right Panel Context Menu
- Bulk operations: Open Books in Amazon, Copy Titles, Set Price Goal
- Mixed selection: Folders + books context menu
- Filter integration: Operations respect current filters

### Filtered Folder View
- Auto-hide empty folders when filter active
- Auto-expand folders with matches
- X/Y counts in tree (e.g., "Fiction (5/23)")

### Series Columns
- Series metadata in list view
- Fractional position numbers (e.g., 3.5 for novellas)

---

## Notes for Post-Production

### Text Overlays to Add
- Keyboard shortcut indicators (e.g., "F2" when pressed)
- Feature names on first appearance (e.g., "Context Menu" label)
- Confirmation dialog text (zoom in for readability)

### Audio Cues
- Subtle click sound for menu item selection
- Success chime for completed operations
- Error sound for disabled operations (if shown)

### Pacing
- Show context menu appearance: 0.5 sec
- User reads menu items: 2-3 sec
- Operation execution: 0.5 sec
- Result verification: 1-2 sec
- Transition to next demo: 0.5 sec

---

**Last Updated:** 2026-01-31 (alpha.145)
**Next Update:** When right panel context menu implemented
