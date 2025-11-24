---
name: software-development-ground-rules
description: Core development workflow rules including version management, approval workflow, git patterns, and communication protocols
---

# Software Development Ground Rules

## Core Rules (NEVER violate these)

### 0. Status Line Display (Unbreakable)
**At the start of EVERY response**, display:
```
📋 Ground Rules Active - Full rules in SKILL-Development-Ground-Rules.md [YYYY-MM-DD HH:MM:SS Local] | ██░░░ 25% left 🟡
```

**Components:**
- **Timestamp**: User's local time in ISO 8601
- **Progress bars** (████░): Visual token level
  - █████ = 100-80% (5 blocks)
  - ████░ = 79-60% (4 blocks)
  - ███░░ = 59-40% (3 blocks)
  - ██░░░ = 39-20% (2 blocks)
  - █░░░░ = 19-0% (1 block)
- **Percentage**: Exact tokens remaining
- **Freshness indicator**: 🟢 Fresh (last 2 responses) | 🟡 Recent (2-4) | 🟠 Stale (5-7) | 🔴 Ancient (8+)

**Exception**: Skip only if user explicitly requests it be turned off.

### 1. Version Management
- **BEFORE** making ANY code change, increment the version letter
- **Exception**: Documentation and meta files do NOT require version increment:
  - README.md, CHANGELOG.md, TODO.md, NOTES.md
  - SKILL-*.md files
  - Build scripts (.bat files)
  - .gitignore
- Violation of this rule is a "cardinal sin"

#### Version Patterns
- **Starting new work**: Increment version number AND add letter (e.g., v3.2.0 → v3.2.1.a)
- **Iterating on work**: Increment letter only (e.g., v3.2.1.a → v3.2.1.b → v3.2.1.c)
- **Releasing to main**: Remove letter (e.g., v3.2.1.c → v3.2.1)

#### File-Specific Versioning
- Only increment versions in files that are actually being modified
- If changing library-fetcher.js, update FETCHER_VERSION only
- If changing amazon-organizer.js, update APP_VERSION only
- Project version in README.md increments independently (see Project Versioning below)

### 2. Approval Workflow
- **STOP and ASK** before making any code changes, commits, reverts, or git operations
- Questions like "should we?", "thoughts?", "what do you think?" are requests for **DISCUSSION**, NOT approval
- Wait for explicit "yes", "go ahead", "please proceed", or similar confirmation
- **NEVER** "get ahead of yourself" by implementing during discussion

#### Approval Language Interpretation
- "Proceed with edits" = Make file edits ONLY, then STOP
- "Proceed with commit" = Commit ONLY, then STOP
- "Proceed with push" = Push ONLY, then STOP
- "Proceed with testing" = Make edits, commit, and (if using GitHub Pages workflow) push to enable server testing, then STOP
- "Proceed with X and Y" = Do both X and Y, then STOP
- "Proceed" alone = Clarify what to proceed with
- When in doubt, do ONE operation and STOP

### 3. Update Before Commit
- Always run git pull/fetch before committing to ensure local is current
- Check for conflicts and resolve before pushing

---

## Rule Enforcement Protocol

When taking rule-sensitive actions, Claude MUST explicitly check the relevant rule:

### Before Proposing a Version Change:
```
Checking Ground Rule #1 (Version Management)...
Current version: v3.2.0
Action: Starting new work (improving book dialog)
Pattern: Increment version number AND add letter
Next version: v3.2.1.a
```

### Before Any Git Operation:
```
Checking Ground Rule #2 (Approval Workflow)...
User approval: "yes, proceed with commit"
Operation: git commit
Match: ✓ Approved operation
Proceeding with commit...
```

### Before Any Commit:
1. State: "**Checking Ground Rule #3 (Update Before Commit)...**"
2. Run: `git fetch`
3. Check for upstream changes
4. If conflicts exist, resolve before proceeding

### Before Modifying Any Code File:
1. Verify version was already incremented in this session
2. If not incremented yet, STOP and increment first

### After Completing File Changes:
1. List all modified/created files
2. Summarize what changed in each
3. Ask: "Should I proceed with committing these changes?"
4. STOP and wait for explicit approval

---

## Git Workflow Patterns

### Feature Development
1. Create feature branch from main: `git checkout -b feature-name`
2. Make incremental commits with letter versions (v3.1.0.a, v3.1.0.b, etc.)
3. Push to GitHub when using GitHub Pages testing workflow
4. When ready to release, squash all letter-versioned commits into one
5. Update to release version (e.g., v3.1.0), merge to main
6. Tag the release: `git tag v3.1.0`
7. Push with tags: `git push origin main --tags`

### Testing Workflows
See CONTRIBUTING.md for detailed instructions:
- **Option A: Local Development** - Test on localhost:8000 (no push required)
- **Option B: GitHub Pages Testing** - Push feature branch, configure repo settings, test on github.io

### Documentation-Only Changes
- Can be modified directly on main branch
- No feature branch required
- No version increment or tagging
- Commit directly to main with descriptive message
- Still requires approval before commit/push (Ground Rule #2)

### Commit Messages
- Use conventional commit format: `Type: Brief description`
- Types: Feat, Fix, Update, Refactor, Docs, Test, Chore, Rename
- Include version in subject line: `Fix: Resolve manifest caching issue v3.0.0.p`
- Add detailed body explaining WHY, not just what
- End with Claude attribution:
  ```
  🤖 Generated with [Claude Code](https://claude.com/claude-code)

  Co-Authored-By: Claude <noreply@anthropic.com>
  ```

### Project Versioning
- Project version tracked in README.md "Version" section
- Increments ONLY for releases that include code/executable changes
- **Documentation-only changes** do NOT increment project version or create tags
- Semantic versioning based on user impact:
  - Major (X): Breaking changes or major feature sets
  - Minor (Y): New features or significant improvements
  - Patch (Z): Bug fixes, minor improvements
- Project version is independent of individual file versions
- Git tags MUST match project version

#### Project Version vs File Version
**Key Principle:** Project version and file versions are INDEPENDENT.

- **Project Version**: User-facing, tracks releases that change user experience
- **File Versions**: Developer-facing, track individual file changes

**Common Mistake:** Assuming project version should match file versions.

---

## Documentation Standards

### CHANGELOG.md
- Update before finalizing any version
- Include Technical Notes section for approaches that didn't work
- This prevents revisiting failed approaches in future sessions

### TODO.md
- Mark completed tasks
- Add discovered tasks during implementation
- Include context about WHY tasks are needed

### NOTES.md
- Meta file for session state and tabled discussion items
- **Always commit NOTES.md** with any other commits
- **Update when**: User says "table that thought", finalizing a version, or updating CHANGELOG.md

### Claude Skills Management
- Source files: `SKILL-Development-Ground-Rules.md`, `SKILL-ReaderWrangler.md`
- **Required format**: SKILL-*.md files MUST start with YAML frontmatter
- **Automatic .zip rebuilding**: Git pre-commit hook detects SKILL-*.md changes and rebuilds zips
- Only source `.md` files are tracked in git (zips are generated locally)

### Release Checklist
Before removing version letter (finalizing release):
1. Verify: CHANGELOG.md updated with version entry
2. Verify: NOTES.md marked as RELEASED ✅
3. Verify: TODO.md tasks marked complete
4. Verify: README.md project version updated
5. Then remove letter and tag

### Post-Release Review
After EVERY code release (when project version increments):
1. Ask user: "Release v[X.Y.Z] complete. Ready for post-mortem?"
2. Review: What worked well? What mistakes? What lessons learned?
3. Document lessons in NOTES.md
4. If patterns emerge, propose ground rules updates
- Does NOT apply to documentation-only changes

### Session Compaction Protocol

**CRITICAL**: When creating a summary for session compaction (automatic or manual), you MUST include these directives at the very beginning of the summary:

1. **Ground Rules File Access** - State explicitly:
   ```
   IMMEDIATELY after reading this summary, BEFORE your first response:
   1. Read SKILL-ReaderWrangler.md in full
   2. Read CONTRIBUTING.md for decision frameworks
   3. These files are already loaded via CLAUDE.md but you must read them explicitly to ensure protocol execution
   4. Critical behavioral requirements from these files:
      - Recursive rule display (Rule #0 - see top of this file for exact format)
      - Version management protocol
      - Approval workflow requirements
      - Ship Fast vs. Build Solid decision framework
   ```

2. **Recursive Rule Display Requirement** - Reference the canonical definition:
   ```
   Follow Rule #0 (Status Line Display) as defined at the top of SKILL-Development-Ground-Rules.md.
   This includes the timestamp, progress bar, and freshness indicator.
   Display this at the start of EVERY response.
   ```

3. **Standard Summary Content**: Include current work status, completed work, and next steps as usual.

**Why This Matters**:
- The compaction summary is the ONLY way to pass behavioral requirements across session boundaries
- Without explicit file read directives, ground rules are forgotten
- Without the recursive display directive, the rule reminder disappears
- Loss of these protocols causes rule violations and workflow disruption

**Post-Compaction Checklist for Next Session**:
- [ ] Read SKILL-Development-Ground-Rules.md
- [ ] Read SKILL-ReaderWrangler.md
- [ ] Read CONTRIBUTING.md
- [ ] Display recursive rule reminder in first response
- [ ] Apply Rule #1 (Version Management) before any code changes
- [ ] Apply Rule #2 (Approval Workflow) before any operations

---

## Communication Protocol

### When to STOP and Ask
- User says: "should we", "thoughts?", "what do you think?"
- Before implementing any code change
- Before any git operation
- Before creating or modifying files
- When uncertain about approach

### Push Back Policy
- User explicitly welcomes push back on suggestions
- Challenge ideas if you see potential issues
- Propose alternative approaches with reasoning
- Say "I disagree because..." when warranted

### When User Reports a Problem
**STOP. Do NOT immediately try to fix it.**

1. **Acknowledge the problem explicitly**
2. **Ask for analysis permission**: "Should I investigate the root cause before proposing a fix?"
3. **If yes, perform root cause analysis**:
   - What happened? (symptom)
   - Why did it happen? (direct cause)
   - Why didn't I detect it? (detection failure)
   - What systemic issues allowed this? (underlying pattern)
4. **Present findings BEFORE proposing solutions**
5. **Wait for decision** on whether to fix now or continue with analysis

### Implicit Problem Signals
User asking you to "review", "check", or "verify" work you JUST completed is likely an implicit problem report.

**Red flags:**
- "Can you review [files you just worked with]?"
- "I think [statement about your work] - is that right?"
- "Please check if [something you should have done]"

**Response:** STOP and assess if you completed the work correctly before responding.

---

## Decision Frameworks

### Foundation-First Principle
The user prioritizes fixing foundations before building features. This is deliberate, not a distraction.

**When user identifies a foundational issue:**
1. Don't apologize for "going off track" - this IS the track
2. Ask: "Should we fix this foundation issue before continuing?"
3. Wait for explicit decision

### Ship Fast vs. Build Solid

**KEY QUESTION: "Does this affect data correctness or completeness?"**

**Ship Fast When:**
- UI polish issues
- Nice-to-have features
- Performance optimizations (unless critical)
- Edge cases affecting <0.01% with NO data loss

**Build Solid Foundation When:**
- Data integrity issues (loss, corruption)
- Core functionality bugs
- API contract changes
- State management bugs
- Error handling gaps

**Why This Project Requires "Build Solid":**
- Library management - Users trust us with their book collection metadata
- Long-term use - Built for ongoing use, not a throwaway prototype
- Data permanence - Books represent purchased content, reading history

See CONTRIBUTING.md for detailed examples.

---

## Session Management

### Session Checklist Protocol

**Purpose**: Track short-term subtasks within a conversation, separate from TODO.md.

**Trigger phrases**: "add to checklist", "checklist item", "session task"

**Format Rules:**
1. Use numbered top-level steps (0, 1, 2...)
2. Status icons:
   - ✅ = completed
   - ⬜ = pending (current or ready to work)
   - ⏳ = future (blocked or not yet ready)
3. Mark current item with `← CURRENT`
4. Outline format: each subtask level indented ~3 spaces per level
5. A top-level step is NOT complete until ALL its subtasks are complete
6. Print the Session Checklist after completing each task
7. When user gives multiple items, add to checklist and address ONE at a time

**Example:**
```
Session Checklist:
0   ✅ **Initial setup**
1   ✅ **Create repo on GitHub**
2   ⬜ **DEV bookmarklet verification**
         ✅ Already coded in Step 0
         ⬜ Confirm fix:
               ⬜ Test on Local ← CURRENT
               ⬜ Push to DEV and test
3   ⏳ **Document workflow**
```

---

## Debugging Protocols

### API Debugging
**Pattern:** Investigate raw responses before assuming error structures.

1. Add raw response logging FIRST
2. Examine actual data structure - Don't assume based on error presence
3. Check for partial success - API may return BOTH data AND errors
4. Document findings

### Systematic Sampling for Data Gaps
**When >10% of expected data is missing:**

1. **Random Sample**: Select 10-20 items from missing data set
2. **Manual Extraction**: Test each item individually
3. **Analysis**: If sample succeeds → extraction logic incomplete
4. **Pattern Discovery**: Examine successful extractions for common patterns
5. **Implementation**: Add missing extraction patterns

### Diagnostic Script Naming
**All temporary scripts MUST follow this pattern:**

- **Diagnostic Scripts:** `diag-NN-description.js`
- **Test Scripts:** `test-NN-description.js`
- **Output Files:** `output-NN-description.txt` or `.json`

Where NN = two-digit incrementing counter (01, 02, 03...)

Every script MUST print its filename in console output header.

---

## General Principles

- When proposing a change that adds code, consider whether the same goal can be achieved by REMOVING code instead
- Always prefer simplification over adding complexity
- Question whether new features are truly necessary
- Rare operations (dev/testing/maintenance) don't need complex UIs
- **ALWAYS** review CHANGELOG Technical Notes before suggesting approaches
