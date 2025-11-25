# ReaderWrangler Video Production Plan

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

#### 3. Fetching Your Library (2-3 minutes)
**Goal**: Navigate Amazon, run fetcher, understand progress

#### 4. Fetching Collections (1-2 minutes)
**Goal**: Quick walkthrough of collections fetch process

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

In the next two minutes... you'll extract your entire Kindle library from Amazon... and organize it however you want.

Let's get started.

---

**[SCENE 2: Install Bookmarklet - 0:20-0:45]**

First... visit ReadyWrangler dot com and click "Get Started."

You'll see a button that says "ReaderWrangler Navigator."

Just drag it to your bookmarks bar.

That's it. Installation done.

This bookmarklet is your control panel... for everything that follows.

---

**[SCENE 3: Fetch Library - 0:45-1:30]**

Now click the bookmarklet.

A menu appears. Select "Go to Library Fetcher Amazon Page."

You're now on Amazon's "Your Books" page.

Click the bookmarklet again... and select "Fetch Library Data."

The bookmarklet starts extracting your books... covers... ratings... reviews... everything.

The browser console shows progress as it works.

For a smaller library... this goes pretty quickly.

For larger libraries with hundreds or thousands of books... grab a coffee. It takes time to extract everything properly.

When it's done... a JSON file downloads automatically to your computer.

That's your entire library... ready to organize.

---

**[SCENE 4: Fetch Collections - 1:30-1:50]**

One more quick step.

Click the bookmarklet... and select "Go to Collections Fetcher Amazon Page."

Click the bookmarklet again... and select "Fetch Collections Data."

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

### Character Count
**Total Characters**: ~1,875 characters (updated after timing corrections)
**Estimated Narration Time**: ~2:45 at 0.9x speed (perfect for 2-3 minute target)

### Screen Direction

**[SCENE 1: Landing Page - 0:00-0:20]**
- Start on readerwrangler.com landing page
- Scroll slowly to show "Before/After" slider
- Pause on hero section with sticky note

**[SCENE 2: Install Bookmarklet - 0:20-0:45]**
- Click "Get Started" button (navigates to install-bookmarklet.html)
- Mouse hovers over "ReaderWrangler Navigator" button
- **Slow motion**: Drag button to bookmarks bar
- Button appears in bookmarks bar (highlight with circle/arrow animation)

**[SCENE 3: Fetch Library - 0:45-1:30]**
- Click bookmarklet in bookmarks bar
- Navigator menu appears (highlight with zoom)
- Click "Go to Library Fetcher Amazon Page"
- Amazon "Your Books" page loads (show recognizable book covers)
- Click bookmarklet again
- Click "Fetch Library Data" in menu
- **Show console opening** (F12 or right-click > Inspect)
- Console shows progress messages scrolling (zoom in on console output)
- Speed up footage with time-lapse effect (show progress messages jumping)
- **Text overlay**: "For large libraries, this can take a while - perfect time for a coffee break!"
- Final console message showing completion
- Downloads folder opens showing JSON file (highlight filename)

**[SCENE 4: Fetch Collections - 1:30-1:50]**
- Click bookmarklet
- Click "Go to Collections Fetcher Amazon Page"
- Amazon Collections page loads
- Click bookmarklet again
- Click "Fetch Collections Data"
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
| 1:00 | "starts extracting your books" | Console opens, progress messages start |
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
- **Extraction time**: Currently ~1 hour per 1,000 books (not optimized yet)
- Video script intentionally vague ("grab a coffee" / "takes time") to avoid locking in specific numbers
- **TODO Items to Complete Before Final Video**:
  - Priority 2 #6: Enhanced Progress Feedback (visual progress bars, time estimates)
  - Performance optimization to speed up extraction
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

## Video 3: Fetching Your Library

### Target Length
2-3 minutes

### Scene Prep
TBD

### Script
[TO BE WRITTEN]

### Screen Direction
[TO BE DEFINED]

---

## Video 4: Fetching Collections

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
