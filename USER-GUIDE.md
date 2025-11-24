# ReaderWrangler User Guide

Complete guide to getting the most out of ReaderWrangler.

---

## Table of Contents

1. [Video Walkthrough](#video-walkthrough)
2. [Using ReaderWrangler on Multiple Devices](#using-readerwrangler-on-multiple-devices)
3. [Power User Tips](#power-user-tips)
4. [Advanced Workflows](#advanced-workflows)
5. [Troubleshooting](#troubleshooting)
6. [FAQ](#faq)

---

## Video Walkthrough

> **Coming Soon**: Comprehensive video tutorial showing the complete workflow from installation to organization.

<!-- Video will be embedded here once created -->

**What the video covers**:
- Installing the bookmarklet
- Extracting your library and collections data
- Creating your first custom columns
- Organizing books with drag-and-drop
- Using multi-select for bulk operations
- Backing up your organization
- Tips and tricks for power users

---

## Mobile & Tablet Support

### Desktop First (Recommended)

ReaderWrangler is designed for desktop/laptop use because organizing hundreds or thousands of books requires:
- **Screen space** to see multiple columns side-by-side
- **Mouse precision** for drag-and-drop operations
- **Keyboard shortcuts** (Ctrl+Click, Shift+Click for multi-select)
- **Horizontal space** for creating and managing columns

### Mobile as a Reference Tool (Useful!)

**Perfect use case**: You're in bed, just finished a book, and want to check what's next in your "Next to Read" column without getting up.

The app loads on mobile devices and you can:
- ✅ **View your organized columns** (one at a time on phone screens)
- ✅ **See what's in your "Next to Read" column**
- ✅ **Browse your book organization**
- ✅ **Double-click books to see full details** (title, author, rating, description, reviews)
- ✅ **Use search to find specific books**
- ✅ **Check if you own a book** before buying

**What doesn't work well on mobile:**
- ❌ **Drag-and-drop organization** (clunky on touch, no precision)
- ❌ **Multi-select operations** (Ctrl/Shift+Click don't exist on mobile)
- ❌ **Creating/renaming columns** (touch typing in small dialogs is frustrating)
- ❌ **Seeing multiple columns side-by-side** (phone screens too narrow)

**Bottom line**: Use your phone to *reference* your organization (check what to read next, verify you own a book), but do the actual *organizing* on desktop where you have a mouse and screen space.

### Tablets (10+ inches)

**iPad/Android tablets** work better than phones due to larger screens:
- Touch drag-and-drop is acceptable on tablets (though still less precise than mouse)
- You can see more content at once
- Creating columns and basic organization is feasible

**Verdict**: Tablets are usable but desktop is still the optimal experience. If you only have a tablet, it will work - just be patient with touch-based drag operations.

---

## Using ReaderWrangler on Multiple Devices

Your library organization is stored locally in your browser, but you can easily sync it across devices using the Backup and Restore features.

### Cross-Device Workflow

**Scenario**: You organize your library on your desktop, but want to access it on your laptop while traveling.

**Setup** (One-time):
1. On your **desktop**, click **Backup** in ReaderWrangler
2. Save the backup file to a cloud storage service (Dropbox, Google Drive, OneDrive, etc.)
3. On your **laptop**, click **Restore** and select the backup file from your cloud storage synced folder
4. Your complete organization loads on the laptop

**Ongoing Sync**:
- **Before switching devices**: Backup your current organization to cloud storage
- **On the other device**: Restore from the latest backup
- **Continue organizing**: Your columns, book positions, and all organization are preserved

**Pro Tips**:
- Name backups with dates: `readerwrangler-backup-2025-11-18.json`
- Keep the backup file in a dedicated cloud folder for easy access
- Always Backup before switching devices to avoid losing recent changes
- Your library data (books, covers, ratings, reviews) stays current across devices automatically

**How It Works**:
- **Backup** saves your complete organization (columns, book positions, custom groups) to a JSON file
- Your cloud storage service syncs this file across your devices automatically
- **Restore** loads the organization from the synced file on your other device
- The library data itself (books, covers, ratings) is already in the JSON files from your initial extraction

---

## Power User Tips

### Keyboard Shortcuts

**Multi-Select**:
- **Click** - Select a single book (replaces current selection)
- **Ctrl+Click** - Toggle selection (add/remove individual books)
- **Shift+Click** - Range selection (select all books between last click and current click, within same column)
- **ESC** - Clear all selections

**Bulk Operations**:
- **Drag any selected book** - Moves all selected books together
- **Right-click on selected book** - Quick menu to move all selected books to another column
- **Selection count indicator** - Bottom-right shows "{N} books selected" with Clear button

**Modal Navigation**:
- **Double-click book cover** - Open book detail modal
- **Arrow keys** - Navigate between books in modal view (preserves filters)
- **ESC** - Close modal

### Search Tips

**Search across title and author**:
- Search box filters both title and author fields simultaneously
- Search is case-insensitive
- Results update instantly as you type

**Finding books quickly**:
- Use author last name for quick filtering
- Search for series names to find all books in a series
- Clear search with X button to return to full view

### Column Organization Strategies

**Common Column Patterns**:

1. **Status-Based Columns**:
   - "Next to Read" (5-10 books)
   - "Currently Reading" (2-3 books)
   - "Read" (completed books)
   - "Want to Read Eventually"

2. **Genre-Based Columns**:
   - "Sci-Fi"
   - "Fantasy"
   - "Mystery/Thriller"
   - "Non-Fiction"

3. **Rating-Based Columns**:
   - "Favorites ⭐" (4.5+ stars only)
   - "Highly Rated" (4.0+ stars)
   - "To Try" (new books, unrated)

4. **Time-Based Columns**:
   - "Recent Purchases" (last 3 months)
   - "Backlist" (older books to rediscover)

5. **Series Columns**:
   - Create a column for each series you're reading
   - Keep books in reading order within the column

**Pro Tip**: Each book can only be in one column at a time. When you drag a book to a new column, it moves from its previous location.

### Renaming Columns

- **Double-click column name** to rename
- Or **hover over column name** to see pencil icon (✏️), then click to rename
- Use descriptive names that make sense to you

---

## Advanced Workflows

### Managing Large Libraries (1000+ Books)

**Strategy 1: Triage Approach**
1. Start with an "Unorganized" column (default when loading library)
2. Create 2-3 initial columns ("Want to Read", "Maybe Later", "Not Interested")
3. Quickly sort through "Unorganized" using multi-select
4. Once triaged, create more specific genre/theme columns

**Strategy 2: Top-Down Organization**
1. Start with broad categories (Fiction, Non-Fiction, Reference)
2. Within each category, create sub-columns by genre
3. Use search to find books by author or keyword
4. Drag results to appropriate columns

**Strategy 3: Search-Driven Organization**
1. Search for a specific author or series
2. Create a column for that author/series
3. Multi-select all results and drag to new column
4. Repeat for other authors/series you want to track

### Series Organization

**Keeping Series Together**:
1. Create a column named after the series
2. Search for series name (if in book titles)
3. Multi-select all books in series
4. Drag to series column
5. Manually arrange in reading order (drag books up/down within column)

**Pro Tip**: Series books often have numbers in titles. Use search to find "Book 1", "Book 2", etc.

### Reading Queue Management

**Dynamic "Next to Read" Column**:
1. Keep column limited to 5-10 books max
2. When you finish a book, remove it from the column
3. Add a new book from your "Want to Read" column
4. Reorder books in priority order (top = next)

**Seasonal/Mood-Based Reading**:
- Create temporary columns like "Summer Reads", "Cozy Winter Books"
- Populate with books that fit the mood
- Delete column when season ends

### Collection Integration

**Using Collections Data**:
- Books fetched with the Collections Fetcher include reading status (READ/UNREAD)
- Use the built-in filter to show only READ or UNREAD books
- Create columns like "Finished" and "In Progress" based on reading status

**Pro Tip**: Combine collection filters with search for powerful queries (e.g., show all READ books by a specific author)

---

## Troubleshooting

### Common Issues

**Problem: Books not appearing after loading library**
- **Solution**: Check browser console for errors (F12)
- Ensure JSON file is from latest fetcher version
- Try clearing browser cache and reloading

**Problem: Organization not persisting between sessions**
- **Solution**: Check browser settings - ensure IndexedDB is enabled
- Don't use private/incognito mode (IndexedDB doesn't persist)
- Use Backup feature to save organization externally

**Problem: Drag-and-drop not working**
- **Solution**: Ensure you're dragging the book cover itself (not empty space)
- For multi-select drag, ensure all books are selected (blue outline + checkmark)
- Try refreshing the page

**Problem: Can't find specific books**
- **Solution**: Use search box (top of page)
- Check if filters are active (collection filter might be hiding books)
- Verify book is actually in your library JSON file

**Problem: Bookmarklet not working on Amazon**
- **Solution**: Ensure you're on the correct Amazon page
- Check browser console for CORS errors
- Try refreshing the Amazon page and clicking bookmarklet again
- Verify you're logged into Amazon

### Browser Compatibility

**Recommended Browsers**:
- Chrome/Edge (Chromium-based): Full support
- Firefox: Full support
- Safari: Full support (macOS/iOS)

**Known Issues**:
- Private/incognito mode: IndexedDB may not persist (use Backup/Restore instead)
- Very old browsers: May not support modern JavaScript features

---

## FAQ

### General Questions

**Q: Is my data private?**
A: Yes! ReaderWrangler processes everything in your browser. Your library data and organization never leave your computer. No servers, no uploads, no tracking.

**Q: Do I need to install anything?**
A: No installation required. Just drag the bookmarklet to your bookmarks bar and you're ready to go.

**Q: Can I use ReaderWrangler on mobile?**
A: The fetcher bookmarklet works best on desktop (Amazon's mobile site is different). However, once you've extracted your library, you can use the organizer on any device with a modern browser.

**Q: How often should I update my library?**
A: Whenever you buy new books! The fetcher will only fetch new additions, and your organization will be preserved.

### Library Extraction

**Q: How long does the initial extraction take?**
A: Depends on library size. Roughly ~1.5 minutes per 1000 books for library data. Collections take a bit longer.

**Q: What if the extraction fails partway through?**
A: The fetcher includes retry logic. If it fails, wait a moment and try again. Amazon's servers can be temperamental.

**Q: Can I extract from multiple Amazon accounts?**
A: Yes! Extract from each account separately and you'll get separate JSON files. You can load multiple libraries into the organizer (books will be tagged by store).

### Organization

**Q: Can the same book appear in multiple columns?**
A: Yes! A book can be in as many columns as you want. For example, a book can be in both "Next to Read" and "Sci-Fi" columns.

**Q: What happens if I accidentally delete a column?**
A: The books aren't deleted - they return to the main library. If you had recent Backup, you can Restore to get the column back.

**Q: Can I export my organization?**
A: Yes! Use the Backup button to export your complete organization as JSON. You can import this on other devices or keep as backup.

**Q: Is there a limit to how many columns I can create?**
A: No hard limit, but we recommend keeping it manageable (10-20 columns max) for usability.

### Multi-Device Usage

**Q: Can I use ReaderWrangler on both my desktop and laptop?**
A: Yes! See [Using ReaderWrangler on Multiple Devices](#using-readerwrangler-on-multiple-devices) above.

**Q: Do I need to re-extract my library on each device?**
A: No. Extract once, save the JSON files to cloud storage, and access them from any device.

**Q: What happens if I organize on two devices simultaneously?**
A: The organization is stored per-device (in IndexedDB). Use Backup/Restore workflow to sync changes between devices. Last restore wins.

**Q: Can I maintain separate organizational states (e.g., demo vs. actual collection)?**
A: Yes! Use the Backup/Restore workflow to swap between different organizational states:
1. **Setup**: Organize your actual collection normally
2. **Before demo**: Click **Backup** to save your current organization (e.g., `my-organization.json`)
3. **Demo mode**: Click **Clear Library**, then organize for demo/testing purposes
4. **Return to your organization**: Click **Restore** and select your backup file (`my-organization.json`)

This lets you maintain multiple "versions" of your organization without complex multi-user support. Perfect for:
- Testing new organization strategies without losing your actual setup
- Creating demo states to show friends/family
- Experimenting with different column structures
- Maintaining separate organizations for different purposes

**Pro Tip**: Name your backups descriptively (e.g., `actual-collection.json`, `demo-state.json`, `testing-layout.json`) so you always know which one to restore.

### Technical

**Q: Where is my data stored?**
A: Your organization is stored in your browser's IndexedDB. The library data is in JSON files you download from Amazon. Nothing is stored on external servers.

**Q: Can I see the JSON file format?**
A: Yes! The JSON files are human-readable. Open them in any text editor to see the structure.

**Q: Does ReaderWrangler work offline?**
A: The organizer works offline once you've loaded your library. The fetcher requires internet connection (needs to access Amazon).

**Q: Is this open source?**
A: Yes! Check out the [GitHub repository](https://github.com/Ron-L/ReaderWrangler) to see the code and contribute.

---

## Getting Help

**Still have questions?**

- Check the [README](README.md) for basic usage
- Review [CONTRIBUTING.md](CONTRIBUTING.md) for development info
- [Open an issue on GitHub](https://github.com/Ron-L/ReaderWrangler/issues) for bug reports or feature requests

---

## Tips from the Community

> **Coming Soon**: As users share their workflows and tips, we'll add them here!

**Have a tip to share?** [Open a discussion on GitHub](https://github.com/Ron-L/ReaderWrangler/discussions) and we'll add it to this guide.

---

**Version**: Guide last updated 2025-11-18
