# Fetcher Improvements Design Document

**Feature**: Fetcher Improvements - Pending Items
**Status**: Various (some pending, some in progress)
**Created**: 2025-11-24

---

## Phase 3: UI Error Handling (Pending)

**Goal**: Improve error messaging in organizer for missing descriptions

### Completed
- [x] Handle new JSON schema v3.0.0 - COMPLETED in Phase 2
- [x] Improve book dialog error messaging - COMPLETED in v3.2.1

### Pending

**Warning Banner on Library Load**:
- Dismissible banner if books missing descriptions
- Store dismissed state in localStorage

**"View Books Missing Descriptions" Feature**:
- Button/menu to view list anytime
- Table with title, author, ASIN
- Link to book dialog

---

## Distribution: GitHub Pages + Bookmarklets

**Goal**: Make ReaderWrangler easy for others to use

**Documentation**: See [DISTRIBUTION.md](../../DISTRIBUTION.md) for complete guide

**Summary**:
- Host organizer app on GitHub Pages (free, HTTPS, auto-deploy)
- Provide bookmarklet that loads fetcher scripts from GitHub Pages
- Users: One-click bookmark → fetch → organize
- Zero installation, always latest version, data stays local

**Approaches Documented**:
1. GitHub Pages + Bookmarklet (recommended for end users)
2. GitHub Gist + Bookmarklet (alternative)
3. Local HTTP Server (development only)

**See DISTRIBUTION.md for**:
- GitHub Pages setup instructions
- Bookmarklet code templates
- User workflow documentation
- Deployment checklist
- Custom domain setup (optional)

---

## Minor Improvements (Pending)

- [ ] Remove 30-second timeout from file selection
- [ ] Improve "WORKING DIRECTORY" messaging throughout
- [ ] Match opening/closing dialog terminology

---

## Completed Phases (Reference)

For completed phases, see NOTES.md:
- Phase 2: Description Tracking & Reporting - COMPLETED
- Phase 2.5: Description Investigation - COMPLETED
- Phase 2.6: Partial Error Investigation - COMPLETED
- Phase 4: Reliability & Data Quality - COMPLETED
