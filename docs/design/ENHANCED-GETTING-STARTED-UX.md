# Enhanced Getting Started UX Design Document

**Feature**: Enhanced Getting Started UX (v3.5.1)
**Status**: Planned (after Project Rename Release 1)
**Created**: 2025-11-24

---

## Goal

Improve onboarding experience for new users with better help navigation and empty state guidance.

---

## Changes

### 1. Help Menu Links (5 min)

- Add "Getting Started Guide" → README.md#quick-start
- Add "About ReaderWrangler" → README.md

### 2. Enhanced Empty Library State (30 min)

**Trigger**: No library in IndexedDB on load

**Display**: Helpful banner in library status area

**Content**:
```
No library loaded yet. [Install Bookmarklet & Get Started →] [Load Existing JSON]
```

**Behavior**:
- Link to README#quick-start for new users
- Existing file picker for returning users

---

## Workflow

1. Create feature branch (after Release 1 complete)
2. Add Help menu links
3. Enhance empty library state
4. Test with empty and populated libraries
5. Commit, merge, tag v3.5.1
6. Done

---

## Related

- Part of Project Rename Plan (Release 2)
- Depends on Release 1 completion (repository rename)
