# ReaderWrangler - Pending Review & Tasks

This file tracks documentation changes ready for review, pending image assets, and next steps before deployment.

**Last Updated**: 2025-11-17

---

## Files Ready for Review

These files have been modified and are awaiting your review before commit:

### Documentation Files (Modified)

1. **index.html** (v1.0.1)
   - Restored tagline: "Wrangle your reader chaos - Your books, your order"
   - Added "online" before "Amazon Kindle library" throughout
   - Changed "automatic" → "one-click/when you click" pattern
   - Added tagline to SEO keywords
   - Increased container max-width to 1400px (for 4-column feature grid)
   - Added 4th feature box "Amazon Kindle Extraction" as FIRST box
   - Added FreeDNS thank-you in footer
   - Added "What Makes ReaderWrangler Different?" section before footer
   - Added OG meta tags pointing to icons/og-image.png
   - Restored localhost detection (was temporarily forced to production)

2. **install-bookmarklet.html** (v1.0.4)
   - Updated version from v1.0.3 → v1.0.4
   - Added full tagline to subtitle
   - Added "online" qualifier before "Amazon Kindle library"
   - Changed "automatically extracts" → "extracts...when you click it"
   - Added OG meta tags pointing to icons/og-image.png

3. **README.md** (no version)
   - Restored tagline as H2 subtitle
   - Added "online" before "Amazon Kindle library" throughout (8 locations)
   - Changed "automatically extracts" → "extracts...with...one-click bookmarklet"
   - Updated section heading: "Online Amazon Kindle Library Extraction"
   - Added "What Makes ReaderWrangler Different?" section with competitive positioning
   - Added COMPETITIVE-ANALYSIS.md to documentation section

4. **COMPETITIVE-ANALYSIS.md**
   - Renamed from "E-book library management app comparison - Claude.md"
   - Comprehensive comparison with 6 other ebook management tools
   - Referenced in README documentation section

5. **bookmarklet-nav-hub.js** (v1.1.2.b)
   - Renamed from bookmarklet-loader.js (better reflects purpose)
   - Now reads TARGET_ENV from window variable (injected by bookmarklet)

### Key Changes Summary

**Competitive Positioning Added:**
- Only tool for Amazon Kindle libraries (vs local file managers)
- Zero installation (bookmarklet + webpage vs Docker/CLI/desktop)
- 100% client-side privacy (no servers or uploads)
- No technical knowledge needed
- Complementary to file-based tools (not competitive)

**Messaging Improvements:**
- Restored beloved tagline across all files
- Changed "automatic" language to user-controlled "when you click" pattern
- Added "online Amazon Kindle library" qualifiers for clarity

**Social Media:**
- OG meta tags added to index.html and install-bookmarklet.html
- Points to icons/og-image.png (1200x630px social preview image)

---

## Image Assets Status

### ✅ Completed

#### og-image.png (1200x630px)
- **Status**: Created in PowerPoint, saved to icons/og-image.png
- **Design**:
  - 3D metallic gradient "ReaderWrangler™" text (purple #667eea to blue #764ba2)
  - Chaotic "Reader" letters → neat "Wrangler™" letters
  - Golden-brown lasso rope (solid line for better visibility at thumbnail size)
  - Tagline: "Your books, your order"
  - White background
- **Usage**: Social media previews (Twitter, Facebook, LinkedIn)
- **Meta Tags**: Added to index.html and install-bookmarklet.html

#### Existing Icons
- **favicon.ico** - Located at icons/favicon.ico
- **favicon.png** (32x32px) - Located at icons/favicon.png
- **apple-touch-icon.png** (180x180px) - Located at icons/apple-touch-icon.png

### ⏳ Pending: App Screenshots

Need to create before/after screenshots showing the organizer's power:

**BEFORE Screenshot:**
- Current view showing "2322 books in Unorganized"
- Demonstrates the problem: overwhelming chaos
- ✅ Already captured

**AFTER Screenshot:**
- Same library organized into compelling columns
- Demonstrates the solution: order and control
- ⏳ **Needs to be created after organizing library**

---

## Screenshot Strategy Guide

### Recommended Column Configuration

Create 4-5 columns with these themes (left to right):

#### Column 1: "Next to Read" (8-10 books)
- Eye of Time (Adrian Cousins) - 4.4★
- 1984 (Jason Ayres) - 4.6★
- From Chef to Crafter (Gabriel Rathweg) - 4.4★
- Operation Paperclip (Annie Jacobsen) - 4.7★
- Middle Falls Time Favorites - 4.8★
- Things My Son Needs to Know (Backman) - 4.5★

#### Column 2: "Time Travel" (6-8 books)
- Eye of Time
- 1984: A Year in the Life of Nobby Clarke
- Middle Falls Time Favorites
- (Add other time travel themed books from your library)

#### Column 3: "Thrillers" (8-10 books)
- The Enemy Within (Larry Bond)
- Necroscope: Avengers (Brian Lumley) - 4.4★
- Operation Paperclip
- Failure Is Not an Option (Gene Kranz)

#### Column 4: "Favorites ⭐" (5-7 books)
**Only books rated 4.5★ or higher:**
- Middle Falls - 4.8★
- Operation Paperclip - 4.7★
- 1984 - 4.6★
- Things My Son Needs to Know - 4.5★

#### Column 5: "Currently Reading" (2-3 books)
- Pick 2-3 books you're actively reading
- Keep this column small for realism

### Why This Configuration Works

✅ **Shows power**: Multiple organization methods (genre, status, rating)
✅ **Shows flexibility**: Same book can appear in multiple columns
✅ **Shows scale**: "2322 books" → organized into manageable groups
✅ **Visual appeal**: Mix of colorful covers across columns
✅ **Emotional impact**: Chaos → Control

### Screenshot Capture Tips

**Zoom Level** - Adjust so you can see:
- The ReaderWrangler header (logo, search, buttons)
- 4-5 columns visible horizontally
- At least 2-3 rows of books per column
- Enough books to show the scale

**What Makes It Compelling:**
- Empty or nearly-empty "Unorganized" column (shows completion)
- Multiple populated columns (shows different org methods)
- Visible book ratings with yellow stars
- Clean, organized appearance vs chaos of 2322 unsorted books

### Where to Use Each Image

| Image Type | Usage | Notes |
|------------|-------|-------|
| **Before screenshot** | Documentation, blog posts | Shows the problem |
| **After screenshot** | README.md hero, index.html hero, GitHub social preview | Shows the solution |
| **og-image.png** | Social media previews (Twitter, Facebook, LinkedIn) | Current logo design |
| **Logo/Favicon** | Site branding | Existing icons |

---

## GitHub Settings

### ✅ Already Updated
- Repository description: "Wrangle your reader chaos - Your books, your order"
- Website: https://readerwrangler.com

### ⏳ Optional Topics to Add
- `kindle`
- `ebook-organizer`
- `amazon-kindle`
- `book-management`
- `drag-and-drop`
- `bookmarklet`
- `client-side`
- `privacy-focused`

---

## Version Management

### Current Versions
- **Project Version**: v3.5.0 (major rebranding complete)
- **index.html**: v1.0.1
- **install-bookmarklet.html**: v1.0.4
- **bookmarklet-nav-hub.js**: v1.1.2.b

### Next Version
- Project version should remain **v3.5.0** (recent rebranding release)
- Individual component versions track separately

---

## Workflow: Next Steps

### Step 1: Review Documentation Changes ⏳
1. Review all modified files listed above
2. Review OG meta tag implementation
3. Confirm messaging changes align with brand
4. Decide whether to add OG tags to readerwrangler.html (optional)

### Step 2: Organize Library & Capture Screenshot ⏳
1. Organize books into column structure (see screenshot guide above)
2. Capture AFTER screenshot
3. Save both BEFORE and AFTER to images/ folder
4. Optionally update README/index.html to use new screenshots

### Step 3: Test OG Tags (After Push) ⏳
Test with social media validators:
- Facebook debugger: https://developers.facebook.com/tools/debug/
- Twitter validator: https://cards-dev.twitter.com/validator
- LinkedIn inspector: https://www.linkedin.com/post-inspector/

### Step 4: Commit Documentation Changes ⏳
**Ground Rule Check**: Documentation-only changes can commit directly to main

**Files to commit:**
- README.md
- index.html
- install-bookmarklet.html
- COMPETITIVE-ANALYSIS.md
- bookmarklet-nav-hub.js

**Commit message:**
```
Docs: Add competitive positioning, OG tags, restore localhost detection

- Add "What Makes ReaderWrangler Different?" section to README and index.html
- Add OG meta tags to index.html and install-bookmarklet.html for social sharing
- Restore localhost detection in index.html (was temporarily forced to production)
- Point OG tags to icons/og-image.png (1200x630px social preview image)
- Update install-bookmarklet.html to v1.0.4
- Create COMPETITIVE-ANALYSIS.md with detailed tool comparison
```

**Git workflow:**
1. Git pull before commit to ensure local is current
2. Stage and commit files
3. **Requires explicit approval before commit**

### Step 5: Commit Screenshot Images (After Creation) ⏳
- Add BEFORE/AFTER screenshots to images/ folder
- Update documentation to reference new screenshots (if desired)
- Commit with message: "Assets: Add before/after app screenshots"
- **Requires explicit approval before commit**

### Step 6: Push to GitHub ⏳
- Push all commits to GitHub
- Verify deployment on GitHub Pages
- Test OG tags with social media validators
- **Requires explicit approval before push**

---

## Temporary Files to Clean Up

### Can Delete Now
- **logo-test.html** - CSS logo variations test page (decided to keep simple text headers, Option C)

### Can Delete After Full Review
- **TODO-Files Ready for Review Tomorrow.md** (merged into this file)
- **TODO-Images-and-Pending-Review.md** (merged into this file)

---

## Files NOT Modified

- All code files (readerwrangler.html, readerwrangler.js, readerwrangler.css, fetcher scripts)
- CHANGELOG.md - remains unchanged
- CONTRIBUTING.md - remains unchanged
- Main TODO.md - remains unchanged (project roadmap)

---

## Notes

- All documentation changes are uncommitted and ready for review
- OG image (logo) is complete and saved in icons/og-image.png
- App screenshots are blocked until library is organized per column configuration
- All commits require explicit approval per Ground Rule #2
- Documentation commits go directly to main branch (no feature branch needed)
- CSS logo attempts didn't work - keeping simple text headers (Option C)
