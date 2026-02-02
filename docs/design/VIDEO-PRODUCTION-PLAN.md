# ReaderWrangler Video Production Plan

## Content Update Tracker

**Last Updated**: 2026-02-02

Before producing/updating videos, review this list of changes since the plan was written:

### Images Out of Date (v4.5.0+ styling changes)
- [ ] `images/bookmarklet-install.gif` - Shows old styling, now blue gradient with new logo
- [ ] `images/before.png` / `images/after.png` - "See the Difference" screenshots show old header design
- [ ] `images/walkthrough-preview.png` - Video thumbnail shows old styling

### 10-Minute Walkthrough Video Missing Features
- [ ] Book description view (double-click detail modal) - noted but never shown
- [ ] **Wishlist** (v4.1.0) - Add books from Amazon product/series pages
- [ ] **Hide books** (v4.1.0) - Right-click context menu to soft-delete
- [ ] **Context menu** (v4.1.0) - "Open in Amazon", "Copy Title(s)" options
- [ ] Progress bars during import (v4.1.0)
- [ ] **Sort by Published** (v4.7.0) - Sort columns by publication date
- [ ] **Undo/Redo** (v4.8.0) - Ctrl+Z to undo, Ctrl+Y to redo
- [ ] **Ownership Badges** (v4.9.0) - Visual badges on book covers (Sample, Borrowed, Prime/KU/KOLL/Comixology)
- [ ] **Ownership Filter** (v4.9.0) - Filter by ownership type in filter panel
- [ ] **Cut/Copy/Paste** (v4.16.0) - Ctrl+X/C/V for books, Ctrl+Drag to copy, book copies in multiple columns
- [ ] **Delete key** (v4.16.0) - DEL removes selected books with last-copy protection
- [ ] **Enhanced context menu** (v4.16.0) - Move to/Copy to submenus, Cut/Copy/Paste with shortcuts
- [ ] **Wishlist Price Display** (v4.17.0) - Price tags on covers, price goals, Deals filter, green View on Amazon button
- [ ] **Series Page Bulk Import** (v4.21.0) - One-click import of entire book series to wishlist with gap detection
- [ ] **Author Bibliography Import** (v4.23.0) - One-click import of all Kindle books by an author to wishlist. **Tip**: Set page filters to "English" and "Kindle" before importing.
- [ ] **Bulk Set Price Goal** (v4.24.0) - Right-click selected books → "Set Price Goal" submenu with presets ($0.99-$4.99), Custom, or Clear

### Quick Start Script Updates Needed
When re-recording, add mentions of:
- [ ] Wishlist feature (for tracking books you want to buy)
- [ ] Hide books feature (for removing unwanted items)
- [ ] Context menu (right-click for quick actions)

### Visual Changes to Reflect
- Header: New Libre Baskerville font, version display, "Your books, your order" tagline
- Colors: Blue gradient (#3b82f6 → #2563eb → #1d4ed8) with new logo branding
- Layout: Book count moved to filters row, Data Status next to Import/Export/Reset
- Logo: New ReaderWrangler icon in app header (84px) and landing page hero (160px)
- **Filter Panel** (v4.15.5): Compact inline layout with three-state toggle (Filters/More Filters/Hide)
- **Date Filter** (v4.15.6): Simplified preset dropdown replaces two date pickers
- **Mobile Landing Page** (v4.15.8): Hero scrolls on mobile, mobile-specific sync instructions

### Book Explorer (v5.0.0) - NEW Paradigm

**Major Interface Change:** Columns app → Book Explorer (File Explorer paradigm)

**Training Scenarios Documented:** [BOOK-EXPLORER-VIDEO-SCENARIOS.md](BOOK-EXPLORER-VIDEO-SCENARIOS.md)

**Completed Features:**
- [x] **Left Panel Context Menu** (alpha.133-145, ~18 hours)
  - Right-click operations: Open, Rename, Move to, Create Subfolder, Cut/Copy/Paste, Delete, Properties
  - Keyboard shortcuts: F2, Ctrl+X/C/V, Delete, Esc
  - Edge cases: Circular reference prevention, special folders protection, viewport-aware positioning
  - 7 comprehensive training scenarios documented

- [x] **Right Panel Context Menu** (alpha.167.6-168.4, ~8 hours)
  - Right-click operations: Move to, Copy to, Cut/Copy/Paste, Open in Amazon, Copy Titles, Add Note, Set Price Goal, Hide Book, Remove from Folder
  - Keyboard shortcuts: Ctrl+X/C/V for books
  - Visual feedback: 50% opacity for cut books (list and cover views)
  - Undo/redo support for paste operations
  - Amazon column added for quick single-book access (popup blocker workaround)
  - Menu layout matches Columns App grouping conventions

**Pending Features:**
- [ ] Filtered Folder View - Auto-hide empty, auto-expand matches
- [ ] Series Columns - Metadata in list view

**Video Recommendations:**
- Video 1: "Book Explorer - Context Menu Basics" (2-3 min)
- Video 2: "Book Explorer - Moving & Organizing" (2-3 min)
- Video 3: "Book Explorer - Power User Tips" (2 min)

See [BOOK-EXPLORER-VIDEO-SCENARIOS.md](BOOK-EXPLORER-VIDEO-SCENARIOS.md) for complete scenario details, visual highlights, voiceover guidelines, and scene prep checklists.

---

## Text-to-Speech Service Selection

### Services Evaluated
- **ElevenLabs**: 10K chars/month free (natural, professional, limited free tier)
- **Microsoft Azure TTS**: 500K chars/month free (very natural Neural voices)
- **TTSMaker**: Unlimited free (surprisingly good, no signup)
- **Google Cloud TTS**: 1M chars/month free (Neural2/Journey voices)

### Selected Service: Google Cloud Text-to-Speech

**Reasons for Selection:**
1. **Free tier covers production needs**: 1M characters/month = 5+ hours of narration
2. **Professional quality**: Neural2 and Journey voices are indistinguishable from human
3. **Voice consistency**: Same voice guaranteed across all videos forever
4. **Journey voices**: Specifically designed for long-form tutorial narration
5. **Service stability**: Google isn't going anywhere
6. **Scalability**: Very affordable if we exceed free tier ($16 per 1M additional characters)

**Recommended Voices:**
- `en-US-Journey-D` (male, warm, conversational)
- `en-US-Journey-F` (female, friendly, clear)

**Demo/Testing:**
- Try voices at: https://cloud.google.com/text-to-speech#demo
- Production access: Create free Google Cloud account

---

## Video Series Plan

### Target Audience Needs
- **Problem**: Users bounce if forced to watch 10-minute walkthrough
- **Solution**: Multiple short, focused tutorials (2-3 minutes each)
- **Budget**: ~1 hour total narration in first month (well within 5+ hour free tier)

### Planned Videos

#### 1. Quick Start (2-3 minutes)
**Goal**: Get users from zero to organized library in under 3 minutes
**Status**: High priority - replaces 10-minute walkthrough for initial onboarding

#### 2. Installing the Bookmarklet (1-2 minutes)
**Goal**: Show exactly how to install and what to expect

#### 3. Importing Your Library (2-3 minutes)
**Goal**: Navigate Amazon, run import, understand progress

#### 4. Importing Collections (1-2 minutes)
**Goal**: Quick walkthrough of collections import process

#### 5. Organizing Your Books (3-4 minutes)
**Goal**: Creating columns, drag-drop, multi-select, searching
**Note**: Should cover double-click detail view (missing from 10-minute video)

#### 6. Advanced Features (2-3 minutes)
**Goal**: Filtering, backup/restore, keyboard shortcuts

---

## Video Production Workflow

### Per-Video Structure

Each video needs:
1. **Script** - Formatted for TTS (conversational, proper pauses)
2. **Screen Direction** - Exact actions to perform on screen
3. **Scene Prep** - Required state before recording (clear library, specific books loaded, etc.)
4. **Timing Notes** - Sync narration with screen actions

### Script Formatting for TTS

**Best Practices:**
- Use periods for natural pauses (not commas only)
- Add `...` for longer dramatic pauses
- Use contractions ("you'll" not "you will")
- Break long sentences into shorter ones
- Add phonetic spellings in parentheses if needed
- Speed: 0.9x for instructional content (slower = clearer)

---

## Video 1: Quick Start (HIGH PRIORITY)

### Target Length
2-3 minutes

### Audience
Brand new users who need to get started fast

### Goal
Take user from "I just found ReaderWrangler" to "I have my organized library"

### Scene Prep

**Before Recording:**
- Clear browser downloads folder (or note existing files to avoid confusion)
- Have Amazon account ready (logged in)
- Browser: Chrome/Edge with bookmarks bar visible
- Have install-bookmarklet.html page ready to open
- Clear any existing ReaderWrangler data in browser (fresh start)

**Test Library State:**
- Use real Amazon account with at least 50-100 books for demonstration
- Ensure library includes mix of genres, ratings, and authors
- Should have some recognizable titles viewers might relate to

### Script (TTS-Optimized)

**[SCENE 1: Landing Page - 0:00-0:20]**

Have hundreds of Kindle books... but can never find what to read next?

Amazon shows you all your books... but won't let you organize them.

ReaderWrangler fixes that.

In the next two minutes... you'll import your entire Kindle library from Amazon... and organize it however you want.

Let's get started.

---

**[SCENE 2: Install Bookmarklet - 0:20-0:45]**

First... visit ReadyWrangler dot com and click "Get Started."

You'll see a button that says "ReaderWrangler Navigator."

Just drag it to your bookmarks bar.

That's it. Installation done.

This bookmarklet is your control panel... for everything that follows.

---

**[SCENE 3: Import Library - 0:45-1:30]**

Now click the bookmarklet.

A menu appears. Select "Go to Library Page."

You're now on Amazon's "Your Books" page.

Click the bookmarklet again... and select "Import Library."

The bookmarklet starts importing your books... covers... ratings... reviews... everything.

The browser console shows progress as it works.

For a smaller library... this goes pretty quickly.

For larger libraries with hundreds or thousands of books... grab a coffee. It takes time to import everything properly.

When it's done... a JSON file downloads automatically to your computer.

That's your entire library... ready to organize.

---

**[SCENE 4: Import Collections - 1:30-1:50]**

One more quick step.

Click the bookmarklet... and select "Go to Collections Page."

Click the bookmarklet again... and select "Import Collections."

This grabs your reading status... which books you've finished... which ones are in progress.

Another JSON file downloads.

Now you have everything.

---

**[SCENE 5: Launch App & Organize - 1:50-2:45]**

Click the bookmarklet one last time... and select "Launch App."

Click the gray "No Library" text at the top... and load the JSON file you just downloaded.

Boom. There's your entire library.

Now the fun part.

Create a column by clicking "New Column." Name it "Next to Read."

Drag books into it.

Create another column. "Finished Books."

Drag some more.

Use search to find a specific author... then drag all their books to a new "Favorite Authors" column.

Click any book to see full details... ratings... reviews... descriptions.

Everything from Amazon... now organized your way.

---

**[SCENE 6: Wrap Up - 2:45-3:00]**

That's it.

Your books... your order... finally.

Everything runs in your browser. Your data never leaves your computer.

Start wrangling your reading chaos... today.

---

### Screen Direction

**[SCENE 1: Landing Page - 0:00-0:20]**
- Open browser to ReaderWrangler.com landing page
- Hero section visible with tagline
- Slow pan/zoom on hero image showing organized library

**[SCENE 2: Install Bookmarklet - 0:20-0:45]**
- Click "Get Started" button (highlight with circle effect)
- install-bookmarklet.html page opens
- Zoom in on "ReaderWrangler Navigator" button
- **Slow motion capture**: Drag button to bookmarks bar
- Show button appearing in bookmarks bar (highlight new bookmarklet)

**[SCENE 3: Import Library - 0:45-1:30]**
- Click bookmarklet in toolbar
- Navigator menu appears (zoom in to show options)
- Click "Go to Library Page" in menu
- Amazon Your Books page loads (show Amazon logo briefly for context)
- Click bookmarklet again
- Click "Import Library" in menu
- **Show console opening** (F12 or right-click > Inspect)
- Console shows progress messages scrolling (zoom in on console output)
- Speed up footage with time-lapse effect (show progress messages jumping)
- **Text overlay**: "For large libraries, this can take a while - perfect time for a coffee break!"
- Final console message showing completion
- Downloads folder opens showing JSON file (highlight filename)

**[SCENE 4: Import Collections - 1:30-1:50]**
- Click bookmarklet
- Click "Go to Collections Page"
- Amazon Collections page loads
- Click bookmarklet again
- Click "Import Collections"
- Progress indicator (faster, fewer items)
- Second JSON file appears in Downloads folder

**[SCENE 5: Launch App & Organize - 1:50-2:45]**
- Click bookmarklet
- Click "Launch App"
- ReaderWrangler organizer opens (empty state)
- Click "No Library" text in status bar
- File picker opens
- Select library JSON file
- Books populate in "Unorganized" column (animation of books appearing)
- Click "New Column" button
- Dialog appears, type "Next to Read"
- New empty column appears
- **Drag 3-4 books** from Unorganized to Next to Read (show smooth drag animation)
- Click "New Column" again, type "Finished Books"
- Drag a few books to Finished Books
- Type "Brandon Sanderson" in search box (example author)
- Books filter to show only Sanderson books
- Multi-select with Ctrl+Click (show checkmarks appearing)
- Drag selected books to new column "Favorite Authors"
- Clear search
- Double-click a book cover
- Detail modal opens (show rating, description, reviews)
- Close modal

**[SCENE 6: Wrap Up - 2:45-3:00]**
- Zoom out to show full organized library (3-4 columns with books)
- Fade to landing page logo
- End card: "ReaderWrangler.com - Start organizing today"

### Timing Notes

**Narration Pacing:**
- Use ellipses (...) for 0.5-second pauses
- Period at end of sentence = 0.3-second pause
- Speed: 0.9x for clarity (instructional content)

**Visual Sync Points:**
| Timestamp | Narration Cue | Visual Action |
|-----------|---------------|---------------|
| 0:20 | "Let's get started" | Transition to install page |
| 0:25 | "drag it to your bookmarks bar" | Begin drag animation (slow mo) |
| 0:45 | "Now click the bookmarklet" | Mouse moves to bookmarklet |
| 1:00 | "starts importing your books" | Console opens, progress messages start |
| 1:10 | "The browser console shows progress" | Zoom in on console output |
| 1:15 | "grab a coffee" | Time-lapse of console messages |
| 1:50 | "Launch App" | App opens (empty state) |
| 2:05 | "Boom. There's your entire library" | Books populate animation |
| 2:15 | "Drag books into it" | First drag operation |
| 2:35 | "Click any book to see full details" | Modal opens |

### Production Notes

**Voice Selection Test:**
- Record this script with both Journey-D and Journey-F
- Listen for natural conversational flow
- Pick voice that sounds enthusiastic but not overly energetic
- Document choice below once decided

**Selected Voice**: [TBD after testing]

**Animation Highlights Needed:**
- Circle/arrow to highlight bookmarklet button
- Zoom on navigator menu when it appears
- Highlight on JSON files in Downloads folder
- Smooth drag animation (not jerky mouse movement)
- Visual indicator for multi-select (checkmarks)

**Potential Issues:**
- Amazon page load time (may need to cut/edit waiting)
- Console progress messages speed varies by library size (adjust time-lapse accordingly)
- Downloads folder appearance varies by OS (record on Windows/Mac/Linux?)

**Known Limitations (Current State of App):**
- **No visual progress indicator yet** - Script shows console output as workaround
- **Import time**: Currently ~1 hour per 1,000 books (not optimized yet)
- Video script intentionally vague ("grab a coffee" / "takes time") to avoid locking in specific numbers
- **TODO Items to Complete Before Final Video**:
  - Priority 2 #6: Enhanced Progress Feedback (visual progress bars, time estimates)
  - Performance optimization to speed up import
  - Once these are done, update script with specific timing guidance

### Follow-Up Video Ideas

Based on what we skip in Quick Start:
- **Video 2**: Deep dive on bookmarklet navigator (all menu options explained)
- **Video 3**: Advanced organization (multi-select, bulk operations, keyboard shortcuts)
- **Video 4**: Book detail modal features (navigation, filtering while in modal)
- **Video 5**: Backup/Restore and multi-device workflow
- **Video 6**: Collections integration and reading status tracking

---

## Video 2: Installing the Bookmarklet

### Target Length
1-2 minutes

### Scene Prep
TBD

### Script
[TO BE WRITTEN]

### Screen Direction
[TO BE DEFINED]

---

## Video 3: Importing Your Library

### Target Length
2-3 minutes

### Scene Prep
TBD

### Script
[TO BE WRITTEN]

### Screen Direction
[TO BE DEFINED]

---

## Video 4: Importing Collections

### Target Length
1-2 minutes

### Scene Prep
TBD

### Script
[TO BE WRITTEN]

### Screen Direction
[TO BE DEFINED]

---

## Video 5: Organizing Your Books

### Target Length
3-4 minutes

### Key Topics to Cover
- Creating custom columns
- Drag-and-drop to organize
- Multi-select (Ctrl+Click, Shift+Click)
- Double-click to view book details (MISSING from 10-minute video)
- Using search/filter

### Scene Prep
TBD

### Script
[TO BE WRITTEN]

### Screen Direction
[TO BE DEFINED]

---

## Video 6: Advanced Features

### Target Length
2-3 minutes

### Scene Prep
TBD

### Script
[TO BE WRITTEN]

### Screen Direction
[TO BE DEFINED]

---

## Production Notes

### Voice Selection
- Test both Journey-D and Journey-F with first script
- Pick one voice and use consistently across ALL videos
- Record voice preference here once decided: [TBD]

### Character Count Tracking
- Video 1: ~1,875 characters ✅ SCRIPT COMPLETE (v2 - corrected timing)
- Video 2: [TBD characters]
- Video 3: [TBD characters]
- Video 4: [TBD characters]
- Video 5: [TBD characters]
- Video 6: [TBD characters]
- **Total**: ~1,875 / 1,000,000 free tier limit (0.2% used)

### File Organization
- Scripts: `/video-scripts/`
- Narration audio: `/video-audio/`
- Final videos: `/videos/`

---

## Prerequisites

### Screenshot Capture - PENDING

Before recording videos, capture AFTER screenshot showing organized library:

**Setup:**
- Organize library into column structure with 4-5 columns:
  - "Next to Read"
  - "Time Travel"
  - "Thrillers"
  - "Favorites ⭐"
  - "Currently Reading"
- Demonstrates the solution: order and control (vs chaos of 2322 unsorted books)

**Capture:**
- Show ReaderWrangler header with multiple populated columns
- Empty or nearly-empty "Unorganized" column (shows completion)
- Save to images/ folder alongside existing BEFORE screenshot

**Usage:**
- Use in video thumbnails
- Use in landing page hero section
- Use in README.md documentation

---

## Next Steps

1. **Complete screenshot capture** (BEFORE video recording)
2. Draft script for Video 1: Quick Start
3. Test script with both Journey-D and Journey-F voices
4. Select voice and document decision
5. Define screen direction and scene prep for Video 1
6. Record Video 1
7. Iterate on remaining videos based on learnings
