# Contributing to ReaderWrangler

This guide provides a comprehensive overview of the project architecture, access methods, and development workflows for both end users and developers.

---

## What is ReaderWrangler?

ReaderWrangler is a browser-based tool for organizing your ebook library. It consists of:

1. **Landing Page** ([index.html](index.html)) - Entry point with:
   - Quick Start instructions (4 simple steps)
   - Link to [install-bookmarklet.html](install-bookmarklet.html) - Install the data fetcher
   - Link to [readerwrangler.html](readerwrangler.html) - Launch the organizer (if bookmarklet already installed)

2. **Bookmarklet Installer** ([install-bookmarklet.html](install-bookmarklet.html)) - Installs the data fetching bookmarklet

3. **Organizer Application** ([readerwrangler.html](readerwrangler.html)) - Main drag-and-drop organization interface

4. **Data Fetchers** - Bookmarklet scripts that extract library data from Amazon

All processing happens in your browser - your data never leaves your computer.

---

## Where to Access ReaderWrangler

ReaderWrangler is available at three locations:

### Production (For End Users)

**Start here:** Visit the landing page at one of these URLs:

1. **Custom Domain:** https://readerwrangler.com (primary)
   - Landing page: https://readerwrangler.com/index.html (or just https://readerwrangler.com/)
   - Optimized for performance with browser caching
   - Serves latest stable release from GitHub Pages

2. **GitHub Pages:** https://ron-l.github.io/readerwrangler/
   - Landing page: https://ron-l.github.io/readerwrangler/index.html
   - Backup production URL
   - Same content as readerwrangler.com

The landing page provides Quick Start instructions and links to:
- Bookmarklet installer (install-bookmarklet.html)
- Organizer app (readerwrangler.html)

### Development (For Contributors)

3. **Localhost:** http://localhost:8000
   - Landing page: http://localhost:8000/index.html
   - Optional local development environment
   - For testing changes before deploying to production
   - Requires running a local HTTP server (see Development Setup below)

---

## For End Users: Getting Started

### 1. Install the Bookmarklet

Visit the bookmarklet installer:
- **Production:** https://readerwrangler.com/install-bookmarklet.html
- **Or:** https://ron-l.github.io/readerwrangler/install-bookmarklet.html

Drag the **📚 ReaderWrangler** button to your bookmarks bar.

### 2. Fetch Your Library Data

1. Navigate to your Amazon library page: https://www.amazon.com/yourbooks
2. Click the **📚 ReaderWrangler** bookmarklet in your toolbar
3. Choose "Fetch Book List" or "Fetch Collections"
4. Wait for the download to complete (saved to your Downloads folder)

### 3. Open the Organizer

Visit the ReaderWrangler app:
- **Production:** https://readerwrangler.com/readerwrangler.html
- **Or:** https://ron-l.github.io/readerwrangler/readerwrangler.html

Click the status line at the top and load your downloaded JSON file.

### 4. Organize Your Books

- Create custom columns (e.g., "Next to Read", "Favorites")
- Drag books between columns
- Double-click covers for details
- Your organization is saved automatically in your browser

---

## For Developers: Contributing to ReaderWrangler

There are three development workflows available, depending on your testing needs.

### Development Option A: Local Testing (Recommended)

**Best for:** Rapid iteration, instant feedback, testing bookmarklet changes

**Workflow:**
1. Clone the repository
2. Make your code changes
3. Start local HTTP server
4. Test immediately in browser
5. When satisfied, commit and push to GitHub

**Setup:**

1. **Start a local HTTP server** in the project directory:
   ```bash
   python -m http.server 8000
   ```
   Or with Python 2:
   ```bash
   python -m SimpleHTTPServer 8000
   ```

2. **Access your local instance:**
   - Landing page: http://localhost:8000/index.html
   - Installer: http://localhost:8000/install-bookmarklet.html
   - Organizer: http://localhost:8000/readerwrangler.html

3. **Why a local server?**

   Browsers block JavaScript from loading local files (like your library JSON) when opening HTML files directly (`file://` protocol). Running a local HTTP server (`http://localhost`) allows the application to access these files securely.

### Development Option B: GitHub Pages DEV Testing

**Best for:** Testing GitHub Pages deployment without affecting production, verifying bookmarklet loading from remote server

**Workflow:**
1. Make your code changes locally
2. Commit changes
3. Push to DEV: `git push dev main`
4. Wait 1-5 minutes for GitHub Pages to rebuild
5. Test at https://ron-l.github.io/readerwranglerdev/

**Setup:**

This project uses a dual-repo pattern with separate DEV and PROD remotes:
- `dev` → readerwranglerdev repo (testing)
- `prod` → readerwrangler repo (production)
- No `origin` remote (prevents accidental pushes)

**Testing your changes:**
- Visit https://ron-l.github.io/readerwranglerdev/
- Use the 🔧 DEV bookmarklet to test fetchers from DEV repo
- Cache may be stale - use hard refresh (Ctrl+Shift+R)

**Note:** GitHub Pages caching is aggressive. During development, you may need to:
- Hard refresh browser (Ctrl+Shift+R or Cmd+Shift+R)
- Clear browser cache
- Use incognito/private browsing mode
- Wait a few minutes for GitHub's CDN to update

### Development Option C: GitHub Pages Production Deployment

**Best for:** Final release to production

**Workflow:**
1. Test thoroughly on LOCAL and/or DEV first
2. When stable: `git push prod main`
3. Wait 1-5 minutes for GitHub Pages to rebuild
4. Verify at https://readerwrangler.com/ or https://ron-l.github.io/readerwrangler/

**Safety:** Always test on DEV before pushing to PROD. The dual-repo pattern ensures you can't accidentally push to production.

### Bookmarklet Development and Testing

The bookmarklet installer ([install-bookmarklet.html](install-bookmarklet.html)) is **environment-aware** and adapts to where it's running:

#### For End Users (Production)
When users visit the installer on **readerwrangler.com** or **GitHub Pages prod repo**, they see a single production bookmarklet:
- **📚 ReaderWrangler** (purple gradient)
- Points to production servers (readerwrangler.com or GitHub Pages)
- Optimized for performance with browser caching

#### For End Users (DEV repo)
When users visit the installer on **ron-l.github.io/readerwranglerdev**, they see the DEV bookmarklet:
- **🔧 DEV ReaderWrangler** (blue gradient)
- Points to the DEV GitHub Pages repo
- For testing purposes only

#### For Developers (Localhost)
When you run the installer on **localhost:8000**, it automatically shows **ALL THREE** bookmarklets:

1. **⚠️ LOCAL ReaderWrangler** (orange gradient)
   - Points exclusively to `localhost:8000`
   - Always loads fresh code (cache-busting enabled)
   - Use this when testing local changes on Amazon pages

2. **🔧 DEV ReaderWrangler** (blue gradient)
   - Points to `ron-l.github.io/readerwranglerdev`
   - Tests GitHub Pages deployment without affecting production
   - Use this to verify changes work on GitHub Pages

3. **📚 ReaderWrangler** (purple gradient)
   - Points to production servers (readerwrangler.com/GitHub Pages)
   - Use this to compare production behavior vs your changes

**Why three bookmarklets for developers?**

The bookmarklet runs *on Amazon's website*, not on our pages. When you click a bookmarklet on `amazon.com/yourbooks`, the JavaScript has no way to know if you're a developer with a local server running. It only sees Amazon's hostname.

Solution: Install all three bookmarklets from the localhost installer. Now you can:
- Click **⚠️ LOCAL** to test your local changes (instant feedback)
- Click **🔧 DEV** to test GitHub Pages deployment (after `git push dev main`)
- Click **📚 PROD** to verify production behavior
- Easily switch between environments while testing on Amazon

**Testing workflow:**
1. Start local server: `python -m http.server 8000`
2. Visit `http://localhost:8000/install-bookmarklet.html`
3. Drag all three bookmarklets to your bookmarks bar
4. Navigate to Amazon library page
5. Click appropriate bookmarklet to test that environment

The installer detects its own environment using `window.location.hostname` and generates appropriate bookmarklet code dynamically.

### Files Overview

**User-Facing Files:**
- `index.html` - Landing page with project introduction
- `install-bookmarklet.html` - Bookmarklet installer page
- `readerwrangler.html` - Main application HTML shell
- `readerwrangler.js` - Application JavaScript
- `readerwrangler.css` - Application styles

**Data Fetchers:**
- `bookmarklet-nav-hub.js` - Navigation hub dialog (loaded by bookmarklet, shows menu)
- `amazon-library-fetcher.js` - Amazon library data fetching utility
- `amazon-collections-fetcher.js` - Amazon collections data fetching utility

**Development:**
- `readerwrangler.code-workspace` - VS Code workspace configuration
- `.git/hooks/pre-commit` - Auto-rebuilds SKILL zips on commit

---

## Documentation Overview

### For All Contributors

#### README.md
**Purpose:** User-facing project overview and quick start guide
**Audience:** End users discovering the project via GitHub Pages or GitHub
**Key Sections:**
- Quick Start with bookmarklet installer link
- Features overview (library management, organization, privacy)
- Technology stack (brief)
- App access methods (Production at readerwrangler.com, DEV at readerwranglerdev for testing)
- Project version (source of truth for git tags)

**When to Update:** When adding user-facing features or incrementing project version

**Note:** Development setup has been moved to CONTRIBUTING.md (this file). The DEV repo (readerwranglerdev) is for developer testing only and should not be promoted to end users.

#### CHANGELOG.md
**Purpose:** Detailed version history with technical notes
**Audience:** Developers and maintainers
**Key Sections:**
- Version entries with dates and changes
- Technical Notes documenting failed approaches (prevents revisiting blind alleys)
- Release notes for each version

**When to Update:** Before finalizing any code release (not for documentation-only changes)

**Special Note:** Technical Notes section is critical - documents WHY certain approaches failed so future sessions don't revisit them

#### TODO.md
**Purpose:** Current tasks, pending features, and improvement ideas
**Audience:** Developers and project planners
**Key Sections:**
- Completed tasks (checked off)
- In-progress work with status
- Planned features (approved and optional)
- Bug tracking

**When to Update:** When completing tasks, discovering new work, or planning features

### For Claude Development Sessions

#### SKILL-Development-Ground-Rules.md
**Purpose:** Core development workflow rules and protocols
**Audience:** Claude agents in development sessions
**Key Sections:**
- Core Rules (Version Management, Approval Workflow, Update Before Commit)
- Rule Enforcement Protocol (how to actively apply rules)
- Git Workflow Patterns (feature branches, commits, tagging)
- Documentation Standards
- Communication Protocol (Foundation-First Principle, Project Context Assessment)

**When to Update:** When improving development processes, adding new protocols, or fixing rule compliance issues

**Special Note:** This is the single source of truth for development rules. Must start with YAML frontmatter for Claude Skills format.

#### SKILL-ReaderWrangler.md
**Purpose:** Project-specific context, architecture patterns, and common pitfalls
**Audience:** Claude agents working on this project
**Key Sections:**
- Project context and tech stack
- Key architecture patterns (version management, data flow, status icons)
- Common pitfalls with solutions (documented from CHANGELOG Technical Notes)
- File locations for key code sections
- Pending tasks summary

**When to Update:** When discovering new patterns, documenting new pitfalls, or changing architecture

**Special Note:** Must start with YAML frontmatter for Claude Skills format. References CHANGELOG Technical Notes.

#### NOTES.md
**Purpose:** Session continuity tracking for work-in-progress and tabled discussions
**Audience:** Claude agents across sessions
**Key Sections:**
- Tabled Items (discussions postponed for later)
- Current Work in Progress (detailed context for active work)
- Open Questions

**When to Update:**
- When user says "table that thought" or "hold that thought until..."
- When starting/completing major work (update Current Work in Progress)
- When finalizing versions (mark as RELEASED ✅)
- Always commit NOTES.md with any other commits (for backup)

**Special Note:** This file tracks SESSION STATE, not rules. Rules live in SKILL files.

#### CONTRIBUTING.md (this file)
**Purpose:** Comprehensive documentation guide and development workflow overview
**Audience:** New contributors and as reference material
**Key Sections:**
- Documentation overview (you're reading it!)
- Development workflow
- Skills setup
- Quick reference to Ground Rules
- Ship Fast vs. Build Solid decision framework

**When to Update:** When adding new documentation files or changing development processes

---

## Development Workflow

### Setting Up Claude Skills

This project uses Claude Skills to maintain workflow consistency across sessions. Skills are specialized context files that Claude loads before each conversation.

**Required Skills:**
1. `software-development-ground-rules` (from SKILL-Development-Ground-Rules.zip)
   - Enable globally for all development projects
2. `readerwrangler-project` (from SKILL-ReaderWrangler.zip)
   - Enable per project when working on this codebase

**How to Enable:**
1. Upload both `.zip` files to Claude's Skills interface (Settings → Skills)
2. In each conversation, manually enable both skills
3. **Important:** Skills must be enabled for EACH new conversation

**Building Skill Zips:**

Skills are automatically rebuilt by git pre-commit hook when SKILL-*.md files are committed:
```bash
# Commit SKILL-*.md changes normally
git add SKILL-Development-Ground-Rules.md
git commit -m "Docs: Update ground rules"
# Hook automatically rebuilds the .zip files
```

Manual build (if hook fails):
```bash
build-skill-ground-rules.bat
build-skill-organizer.bat
```

**Updating Skills:**
1. Modify SKILL-*.md source files
2. Commit (hook rebuilds zips automatically)
3. Upload new .zip to Claude Skills interface (will prompt to replace existing)

### Core Ground Rules (Quick Reference)

For complete details, see SKILL-Development-Ground-Rules.md. Here's a quick reference:

#### Rule #1: Version Management
- **Version BEFORE code changes** (never modify code without incrementing version first)
- Exception: Documentation and meta files (README, CHANGELOG, TODO, NOTES, SKILL-*.md, .bat, .gitignore)
- **Starting new work**: Increment version number AND add letter (v3.2.0 → v3.2.1.a)
- **Iterating**: Increment letter only (v3.2.1.a → v3.2.1.b)
- **Releasing**: Remove letter (v3.2.1.c → v3.2.1)

#### Rule #2: Approval Workflow
- **STOP and ASK** before any code changes, commits, or git operations
- "Should we?", "thoughts?", "what do you think?" = DISCUSSION (not approval)
- Wait for explicit "yes", "go ahead", "proceed" before executing
- "Proceed with edits" = Edit ONLY, then STOP
- "Proceed with commit" = Commit ONLY, then STOP
- When in doubt, do ONE operation and STOP

#### Rule #3: Update Before Commit
- Always run `git fetch` before committing
- Check for conflicts and resolve before pushing

#### Rule Enforcement Protocol
Before rule-sensitive actions, explicitly check the relevant rule:
- State: "**Checking Ground Rule #N...**"
- Quote current state and relevant pattern
- Show reasoning
- Then execute

This visible checking ensures rules are actively applied, not just available in context.

### Git Workflow

#### Feature Development
1. Create feature branch: `git checkout -b feature-name`
2. Make incremental commits with letter versions (v3.1.0.a, v3.1.0.b, etc.)
3. When ready to release, squash all letter-versioned commits into one
4. Update to release version (remove letter), merge to main
5. Tag: `git tag v3.2.1` (use actual version)
6. Push: `git push origin main --tags`

#### Documentation-Only Changes
- Can be committed directly to main (no feature branch)
- No version increment or tagging required
- Still requires approval before commit/push (Rule #2)

#### Commit Strategy: Refinement vs Exploration

**When to squash commits:**
- Refining a single approach (bug fixes, polish, incremental improvements)
- Commit messages like "Fix bug in X", "Improve Y performance"
- Final version is what matters, not the iteration path

**When to keep separate commits:**
- Exploring multiple distinct approaches (Option A, B, C)
- Each option represents a different design decision
- Commit messages like "Try Option 1: Approach X", "Implement Option 2: Approach Y"
- Design evolution history is valuable for future understanding
- Easy rollback to specific options if needed

**Rule of thumb:**
- Ask: "Is this a different *approach* or a *refinement*?"
- Different approach → Keep separate commits
- Refinement → Can squash

**Checkpoints:**
- Always create checkpoint tags before major design pivots
- Format: `checkpoint-pre-<feature-name>` or `checkpoint-option-<N>`

#### Commit Messages
Format: `Type: Brief description`

Types: Feat, Fix, Update, Refactor, Docs, Test, Chore, Rename

Include version in subject line: `Fix: Resolve manifest caching issue v3.0.0.p`

End with:
```
🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### Project Version Management

- Project version tracked in README.md (format: "Project Version: vX.Y.Z")
- Increments ONLY for code/executable changes (not documentation-only)
- Based on release nature:
  - Major (X): Breaking changes or major feature sets
  - Minor (Y): New features or significant improvements
  - Patch (Z): Bug fixes, minor improvements
- Git tags MUST match project version
- Use "v" prefix for consistency
- Tags mark released versions only (not letter versions)

### Communication Guidelines

#### Foundation-First Principle
The user prioritizes fixing foundations before building features. This is a deliberate pattern based on 40 years of experience, not a distraction.

When user identifies foundational issues:
1. Don't apologize for "going off track" - this IS the track
2. Embrace the detour as investment in future velocity
3. Ask: "Should we fix this foundation issue before continuing?"
4. Wait for explicit decision

Examples: Fix rules BEFORE implementing features, clarify docs BEFORE adding new docs, improve patterns BEFORE fixing specific bugs

#### Ship Fast vs. Build Solid: Decision Framework

When evaluating bugs or feature requests, use this decision tree to determine the appropriate approach:

**KEY QUESTION: "Does this affect data correctness or completeness?"**

**Ship Fast When:**
- UI polish issues (colors, spacing, minor UX tweaks)
- Nice-to-have features (additional sorting options, filter variations)
- Performance optimizations (unless critical to usability)
- Edge cases affecting <0.01% with NO data loss or corruption
- Cosmetic improvements that don't affect core functionality

**Build Solid Foundation When:**
- ✅ **Data integrity issues** (loss, corruption, incorrect processing)
- ✅ **Core functionality bugs** (search, filtering, display, organization)
- ✅ **API contract changes** (endpoint deprecation, schema changes)
- ✅ **State management bugs** (persistence, ID stability, synchronization)
- ✅ **Error handling gaps** (silent failures, missing validation)

**Context Considerations:**

This project requires the "Build Solid" approach because:
1. **Library management** - Users trust us with their book collection metadata
2. **Long-term use** - Not a throwaway prototype, built for ongoing use
3. **Data permanence** - Books represent purchased content, reading history
4. **Cross-session reliability** - Must work consistently over months/years
5. **Foundation compounds** - Solid patterns prevent future issues

**Comparison to Other Contexts:**
- Social media prototype: 3/2000 missing posts? Ship it.
- E-commerce recommendations: 3 products don't load? Ship it.
- Financial transactions: 3 failed transfers? NEVER ship.
- **Personal library manager: 3 missing books?** → Closer to financial than social media.

**Time Investment Criteria:**

A few days investigating to achieve:
- 100% data coverage instead of 99.85%
- Understanding of API behavior patterns
- Robust error handling for future edge cases
- Comprehensive logging for rapid future diagnosis

...is **proportional and justified** for a library management system.

**Red Herrings and Learning:**

If an investigation takes unexpected turns but yields:
- Fixed bugs (even if different than expected)
- Documented API behavior
- Improved error handling
- Transferable knowledge for future issues

...then it was **NOT wasted time** - it was education and foundation building.

**Application:**
Before starting work on any bug or feature, explicitly evaluate it against this framework and document the decision reasoning.

#### Project Context Assessment
Before starting any new project or major feature, assess:
- **Lifespan:** Weekend hack or long-term project?
- **Scope trajectory:** Fixed or likely to grow?
- **Team size:** Solo or collaborative?
- **Consequences:** Cost of bugs?
- **Certainty:** Requirements clear or being discovered?

**This project is Foundation First:**
- Long lifespan (ongoing development)
- Growing complexity (collections, tracking, features)
- Collaborative (user + Claude across sessions)
- Real consequences (managing 2666 books)
- Clear requirements, known direction

---

## Architecture Notes

### Version Management Pattern
- Single source: `APP_VERSION` constant in readerwrangler.js
- Browser title updates dynamically from constant
- Query string cache busting: `?v=3.2.0`
- Footer version display
- Version comments in all files

### Data Flow
- User loads library → Parse JSON → Store in IndexedDB
- UI state (columns, positions) → localStorage
- Manifest polling → Compare totalBooks → Update status

### Status Icons (Critical Pattern)
- Pre-load ALL 5 icons in DOM simultaneously
- Toggle visibility with CSS `display: none/inline-block`
- **NEVER change `src` attribute** (causes 30-60s browser lag)
- See CHANGELOG Technical Notes for failed approaches

### Common Pitfalls
See SKILL-ReaderWrangler.md and CHANGELOG Technical Notes for:
- Icon display lag solutions
- Manifest caching workarounds
- Ground rule violation patterns

---

## Questions?

For detailed rules and protocols, see SKILL-Development-Ground-Rules.md (the single source of truth).

For project-specific patterns and pitfalls, see SKILL-ReaderWrangler.md.

For current work status, see NOTES.md.

For version history and technical notes, see CHANGELOG.md.
