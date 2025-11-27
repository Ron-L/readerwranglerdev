---
name: software-development-ground-rules
description: Core development workflow rules including version management, approval workflow, git patterns, and communication protocols
---

# Software Development Ground Rules

## HOW TO USE THIS FILE

**Execution Protocol:**

```
WHEN user provides input:
  1. Evaluate all TRIGGERS in ## TRIGGERS section
  2. FOR EACH trigger where conditions match:
       a. Execute all ACTIONS listed in that trigger
       b. Find ACTION definition in ## ACTIONS section
       c. Follow ACTION steps sequentially
       d. IF step references XXX-REF:
            - Look up XXX-REF in ## REFERENCE DATA section
            - Use that data to complete the step
       e. IF executing ACTION changes state (token %, git status, file changes, etc.):
            - Re-evaluate ALL TRIGGERS with new state
            - Execute any newly-matched triggers
            - Repeat until no new triggers match
  3. Continue with user request
```

**Example Flow:**
```
User input received
  → RESPONSE-START-TRIGGER fires (always matches)
      → Executes READ-MEMORY-ACTION
          → Loads lastTimestamp from .claude-memory
      → Executes UPDATE-MEMORY-ACTION
      → Executes DISPLAY-STATUS-LINE-ACTION
      → State changes: lastTokenPercent updated in memory
  → Re-evaluate triggers with new state
      → FRESH-TIMESTAMP-TRIGGER or STALE-TIMESTAMP-TRIGGER fires
          → Executes RESET-TIMESTAMP-STALE-CNT-ACTION or INCREMENT-TIMESTAMP-STALE-CNT-ACTION
      → CODE-CHANGE-TRIGGER matches (if user requests code modification)
          → Executes CHECK-VERSION-INCREMENTED-ACTION
              → References DOCUMENTATION-FILES-REF for exceptions
  → Re-evaluate triggers (no new matches)
  → Continue with user request
```

---

## TRIGGERS (Events That Activate Protocols)

### RESPONSE-START-TRIGGER
**When**: At the beginning of EVERY Claude response
**Frequency**: Every single response without exception
**Actions**:
- READ-MEMORY-ACTION
- UPDATE-MEMORY-ACTION
- DISPLAY-STATUS-LINE-ACTION

### CODE-CHANGE-TRIGGER
**When**: Before making ANY modification to code files
**Excludes**: Documentation files (see DOCUMENTATION-FILES-REF)
**Actions**:
- CHECK-VERSION-INCREMENTED-ACTION
- INCREMENT-VERSION-ACTION (if not already done)

### GIT-OPERATION-TRIGGER
**When**: Before any git command (commit, push, pull, merge, revert, tag, etc.)
**Actions**:
- CHECK-APPROVAL-ACTION
- VERIFY-APPROVAL-MATCH-ACTION

### COMMIT-TRIGGER
**When**: Before executing git commit
**Actions**:
- UPDATE-BEFORE-COMMIT-ACTION
- CHECK-DOCUMENTATION-UPDATED-ACTION

### FILE-CHANGES-COMPLETE-TRIGGER
**When**: After completing file edits but before commit
**Actions**:
- LIST-MODIFIED-FILES-ACTION
- SUMMARIZE-CHANGES-ACTION
- REQUEST-COMMIT-APPROVAL-ACTION

### VERSION-CHANGE-PROPOSAL-TRIGGER
**When**: Before proposing a version number change
**Actions**:
- STATE-CHECKING-RULE-ACTION
- QUOTE-CURRENT-VERSION-ACTION
- IDENTIFY-PATTERN-ACTION
- CALCULATE-NEXT-VERSION-ACTION
- PROPOSE-WITH-REASONING-ACTION

### RELEASE-FINALIZATION-TRIGGER
**When**: Before removing version letter (finalizing a release)
**Actions**:
- FINALIZE-RELEASE-ACTION

### POST-RELEASE-TRIGGER
**When**: After push/tag completes for a code release (project version incremented)
**Excludes**: Documentation-only changes, letter-version commits
**Actions**:
- REQUEST-POST-MORTEM-ACTION
- CONDUCT-REVIEW-ACTION
- DOCUMENT-LESSONS-ACTION
- PROPOSE-RULE-UPDATES-ACTION (if patterns emerge)

### USER-PROBLEM-REPORT-TRIGGER
**When**: User reports an issue, error, or unexpected behavior
**Includes**: Explicit reports AND implicit signals ("can you review...", "please check...")
**Actions**:
- STOP-ACTION
- ACKNOWLEDGE-PROBLEM-ACTION
- REQUEST-ANALYSIS-PERMISSION-ACTION
- PERFORM-ROOT-CAUSE-ANALYSIS-ACTION (if approved)
- PRESENT-FINDINGS-ACTION
- WAIT-FOR-DECISION-ACTION

### SESSION-CHECKLIST-REQUEST-TRIGGER
**When**: User says "add to checklist", "checklist item", "session task", or provides current Session Checklist after compaction
**Actions**:
- ADD-TO-SESSION-CHECKLIST-ACTION
- MARK-CURRENT-ITEM-ACTION
- PRINT-CHECKLIST-ACTION

### TASK-COMPLETION-TRIGGER
**When**: Marking a TODO phase/task as complete
**Actions**:
- UPDATE-TODO-ACTION
- UPDATE-NOTES-ACTION
- UPDATE-CHANGELOG-ACTION (if code release)
- VERIFY-CONSISTENCY-ACTION
- REQUEST-APPROVAL-ACTION

### DISCUSSION-QUESTION-TRIGGER
**When**: User asks "should we?", "thoughts?", "what do you think?", "your thoughts?"
**Actions**:
- STOP-ACTION
- ENGAGE-DISCUSSION-ACTION
- WAIT-FOR-APPROVAL-ACTION (do NOT implement)

### FOUNDATION-ISSUE-IDENTIFIED-TRIGGER
**When**: User identifies foundational issue (rules not working, docs unclear, structure confusing)
**Actions**:
- EMBRACE-DETOUR-ACTION
- ASK-PRIORITY-DECISION-ACTION
- WAIT-FOR-EXPLICIT-DECISION-ACTION

### DATA-GAP-DETECTION-TRIGGER
**When**: >10% of expected data is missing or empty
**Actions**:
- RANDOM-SAMPLE-ACTION
- MANUAL-EXTRACTION-ACTION
- ANALYZE-RESULTS-ACTION
- DISCOVER-PATTERNS-ACTION
- IMPLEMENT-FIXES-ACTION

### API-ERROR-TRIGGER
**When**: Debugging API issues or errors
**Actions**:
- ADD-RAW-LOGGING-ACTION
- EXAMINE-STRUCTURE-ACTION
- CHECK-PARTIAL-SUCCESS-ACTION
- DOCUMENT-FINDINGS-ACTION

### START-NEW-FEATURE-TRIGGER
**When**: Beginning work on a new feature
**Actions**:
- CREATE-FEATURE-BRANCH-ACTION
- CONFIRM-TESTING-WORKFLOW-ACTION

### READY-TO-RELEASE-TRIGGER
**When**: Feature is complete, tested, and ready to merge to main
**Actions**:
- PREPARE-RELEASE-ACTION

### CREATING-COMMIT-MESSAGE-TRIGGER
**When**: Executing git commit
**Actions**:
- FORMAT-COMMIT-MESSAGE-ACTION

### PROJECT-VERSION-PROPOSAL-TRIGGER
**When**: Proposing a change to project version (README.md "Version" section)
**Actions**:
- ASSESS-PROJECT-VERSION-IMPACT-ACTION
- CALCULATE-SEMANTIC-VERSION-ACTION
- EXPLAIN-VERSION-INDEPENDENCE-ACTION

### SESSION-COMPACTION-TRIGGER
**When**: Current token percentage is GREATER than lastTokenPercent from .claude-memory (i.e., `currentTokenPercent > lastTokenPercent`)
**Where**:
- `currentTokenPercent` = (tokens_remaining / 200000) × 100 from system token budget
- `lastTokenPercent` = value from `.claude-memory` file (see FILE-PATHS-REF)
**Actions**:
- NOTIFY-COMPACTION-ACTION
- POST-COMPACTION-ACTION

### USER-SUGGESTS-IDEA-TRIGGER
**When**: User proposes new approach, feature, or solution
**Actions**:
- EVALUATE-IDEA-CRITICALLY-ACTION
- IDENTIFY-POTENTIAL-ISSUES-ACTION
- PROPOSE-ALTERNATIVES-ACTION (if warranted)
- STATE-DISAGREEMENT-ACTION (when appropriate)

### ADDING-CODE-OR-FEATURE-TRIGGER
**When**: About to add new code or functionality
**Actions**:
- CONSIDER-REMOVAL-ALTERNATIVE-ACTION
- QUESTION-NECESSITY-ACTION
- ASSESS-COMPLEXITY-COST-ACTION

### BEFORE-PROPOSING-SOLUTION-TRIGGER
**When**: About to suggest an approach or fix
**Actions**:
- REVIEW-PAST-LEARNINGS-ACTION

### DECIDING-APPROACH-TRIGGER
**When**: Choosing between quick implementation vs thorough solution
**Actions**:
- ASSESS-DATA-IMPACT-ACTION
- DETERMINE-SHIP-FAST-OR-BUILD-SOLID-ACTION
- JUSTIFY-TIME-INVESTMENT-ACTION (if Build Solid chosen)

### BEFORE-FINALIZING-VERSION-TRIGGER
**When**: Before removing version letter (finalizing any release)
**Actions**:
- UPDATE-CHANGELOG-ACTION
- REVIEW-TECHNICAL-NOTES-ACTION

### USER-SAYS-TABLE-THOUGHT-TRIGGER
**When**: User says "table that thought", "hold that thought", or similar
**Actions**:
- UPDATE-NOTES-TABLED-ITEMS-ACTION
- COMMIT-NOTES-WITH-OTHER-CHANGES-ACTION

### WHEN-TO-STOP-AND-ASK-TRIGGER
**When**: About to implement code change, git operation, create/modify files, or uncertain about approach
**Actions**:
- STOP-ACTION
- ASK-FOR-APPROVAL-ACTION
- WAIT-FOR-EXPLICIT-CONFIRMATION-ACTION

### IMPLICIT-PROBLEM-SIGNAL-TRIGGER
**When**: User asks to "review", "check", or "verify" work you JUST completed
**Red Flags**: "Can you review [files you just worked with]?", "I think [statement about your work] - is that right?", "Please check if [something you should have done]"
**Actions**:
- STOP-AND-SELF-ASSESS-ACTION
- REVIEW-COMPLETION-PROTOCOL-ACTION
- ACKNOWLEDGE-IF-GAP-FOUND-ACTION
- ROOT-CAUSE-ANALYSIS-ACTION (without being asked)

### CREATE-DIAGNOSTIC-SCRIPT-TRIGGER
**When**: Creating temporary diagnostic, test, or output files
**Actions**:
- APPLY-NAMING-CONVENTION-ACTION
- PRINT-FILENAME-IN-OUTPUT-ACTION

### STALE-TIMESTAMP-TRIGGER
**When**: `.claude-timestamp` (project root - see FILE-PATHS-REF for path) matches `lastTimestamp` from memory
**Actions**:
- INCREMENT-TIMESTAMP-STALE-CNT-ACTION

### FRESH-TIMESTAMP-TRIGGER
**When**: `.claude-timestamp` (project root - see FILE-PATHS-REF for path) does not match `lastTimestamp` from memory
**Actions**:
- RESET-TIMESTAMP-STALE-CNT-ACTION

---

## ACTIONS (Protocol Implementations)

### READ-MEMORY-ACTION
**Purpose**: Load persistent state from .claude-memory file
**Steps**:
1. Read `.claude-memory` (project root - see FILE-PATHS-REF for path)
2. Parse JSON
3. Extract: `lastTokenPercent`, `lastTimestamp`, `timestampStaleCount`

### INCREMENT-TIMESTAMP-STALE-CNT-ACTION
**Purpose**: Increment the count of how long it has been since the timestamp updated
**Steps**:
1. Increment `timestampStaleCount`

### RESET-TIMESTAMP-STALE-CNT-ACTION
**Purpose**: Reset the count of how long it has been since the timestamp updated
**Steps**:
1. Reset `timestampStaleCount` to 0

### UPDATE-MEMORY-ACTION
**Purpose**: Persist current state to .claude-memory
**Steps**:
1. Write JSON to `.claude-memory`:
   ```json
   {
     "lastTokenPercent": <currentPercent>,
     "lastTimestamp": "<timestamp from .claude-timestamp>",
     "timestampStaleCount": <calculated value>
   }
   ```

### DISPLAY-STATUS-LINE-ACTION
**Purpose**: Show current session status
**Format**:
```
📋 Ground Rules Active [YYYY-MM-DD HH:MM:SS] | ████░ XX% left 🟢
---
```

**Components**:
- Timestamp from `.claude-timestamp`
- Progress bar based on token percentage (█ = filled, ░ = empty)
  - █████ = 100-80% remaining
  - ████░ = 79-60% remaining
  - ███░░ = 59-40% remaining
  - ██░░░ = 39-20% remaining
  - █░░░░ = 19-0% remaining
- Exact percentage: Calculate as `(tokens_remaining ÷ total_tokens) × 100`
  - Example: System reports "135323 remaining / 200000 total"
  - Calculate: (135323 ÷ 200000) × 100 = 67.66% remaining
  - Display: `████░ 67% left`
- Freshness indicator:
  - 🟢 Fresh (updated in last 2 responses)
  - 🟡 Recent (2-4 responses ago)
  - 🟠 Stale (5-7 responses ago)
  - 🔴 Ancient (8+ responses ago)

**Conditional additions**:
- If `timestampStaleCount >= 3`: Append warning
  ```
  ⚠️ Timestamp service may be stopped - run: python update-timestamp.py
  ```

**Exception**: Only skip if user explicitly requests it be turned off

### NOTIFY-COMPACTION-ACTION
**Purpose**: Inform user of detected compaction and request logging permission
**Format**:
```
🔄 COMPACTION DETECTED: Tokens jumped from XX% → YY%

📝 Ready to log: [YYYY-MM-DD HH:MM] Compaction

🔔 **Permission to write to Compaction-log.md?**
- "yes" = Write this one entry
- "yes to all" = Write all future compaction entries automatically (this session only)
- "no" = Skip this entry
```

**Approval handling**:
- "yes": Write entry, continue
- "yes to all": Set session flag, write entry, continue
- "no": Skip logging, continue

### CHECK-VERSION-INCREMENTED-ACTION
**Purpose**: Verify version was incremented before code changes
**Steps**:
1. State: "**Checking Ground Rule #1 (Version Management)...**"
2. Check if version was incremented in current session
3. If yes: Display verification, proceed
4. If no: STOP, execute INCREMENT-VERSION-ACTION first

### INCREMENT-VERSION-ACTION
**Purpose**: Update version number in modified files
**Steps**:
1. Identify which files are being modified
2. Apply version pattern:
   - **Starting new work**: Increment version number AND add letter (e.g., v3.2.0 → v3.2.1.a)
   - **Iterating on work**: Increment letter only (e.g., v3.2.1.a → v3.2.1.b)
   - **Releasing to main**: Remove letter (e.g., v3.2.1.c → v3.2.1)
3. Only increment versions in files actually being modified
   - library-fetcher.js → update FETCHER_VERSION only
   - amazon-organizer.js → update APP_VERSION only

### CHECK-APPROVAL-ACTION
**Purpose**: Verify user has given explicit approval for git operation
**Steps**:
1. State: "**Checking Ground Rule #2 (Approval Workflow)...**"
2. Quote user's approval (exact words)
3. Identify the operation being requested

### VERIFY-APPROVAL-MATCH-ACTION
**Purpose**: Ensure git operation matches what user approved
**Steps**:
1. Compare operation with approval language:
   - "Proceed with edits" = Make file edits ONLY, then STOP
   - "Proceed with commit" = Commit ONLY, then STOP
   - "Proceed with push" = Push ONLY, then STOP
   - "Proceed with testing" = Edits + commit + push (for GitHub Pages), then STOP
   - "Proceed with X and Y" = Do both X and Y, then STOP
   - "Proceed" alone = Clarify what to proceed with
2. If match: Continue
3. If unclear: Ask for clarification
4. When in doubt: Do ONE operation and STOP

### UPDATE-BEFORE-COMMIT-ACTION
**Purpose**: Ensure local repo is current before committing
**Steps**:
1. State: "**Checking Ground Rule #3 (Update Before Commit)...**"
2. Run: `git fetch`
3. Check for upstream changes
4. If conflicts exist: Resolve before proceeding

### LIST-MODIFIED-FILES-ACTION
**Purpose**: Show user what files were changed
**Steps**:
1. State: "**Documentation/code changes complete**"
2. List all modified/created files

### SUMMARIZE-CHANGES-ACTION
**Purpose**: Explain what changed in each file
**Steps**:
1. For each modified file, summarize the nature of changes

### REQUEST-COMMIT-APPROVAL-ACTION
**Purpose**: Get explicit permission to commit
**Steps**:
1. Ask: "Should I proceed with committing these changes?"
2. STOP and wait for response

### STATE-CHECKING-RULE-ACTION
**Purpose**: Make rule verification visible
**Steps**:
1. Print: "**Checking Ground Rule #X (Rule Name)...**"

### QUOTE-CURRENT-VERSION-ACTION
**Purpose**: Show current version state
**Steps**:
1. Print: "Current version: vX.Y.Z"

### IDENTIFY-PATTERN-ACTION
**Purpose**: Determine which versioning pattern applies
**Steps**:
1. Print: "Action: [description]"
2. Print: "Pattern: [starting new work / iterating / releasing]"

### CALCULATE-NEXT-VERSION-ACTION
**Purpose**: Compute the next version number
**Steps**:
1. Apply pattern logic
2. Print: "Next version: vX.Y.Z"

### PROPOSE-WITH-REASONING-ACTION
**Purpose**: Present version change with justification
**Steps**:
1. Show calculation
2. Explain why this pattern was chosen

### REMOVE-LETTER-AND-TAG-ACTION
**Purpose**: Finalize version and create git tag
**Steps**:
1. Remove letter from version (e.g., v3.2.1.c → v3.2.1)
2. Create git tag: `git tag vX.Y.Z`

### FINALIZE-RELEASE-ACTION
**Purpose**: Complete all release verification and tagging
**Steps**:
1. Verify all items in RELEASE-CHECKLIST-REF
2. If all verified, remove letter and tag release
3. If any verification fails, STOP and report which item failed

### REQUEST-POST-MORTEM-ACTION
**Purpose**: Initiate post-release review
**Steps**:
1. Ask: "Release vX.Y.Z complete. Ready for post-mortem?"

### CONDUCT-REVIEW-ACTION
**Purpose**: Perform structured review
**Questions**:
- What worked well?
- What mistakes were made?
- What lessons learned?
- Any ground rules need updating?

### DOCUMENT-LESSONS-ACTION
**Purpose**: Capture insights for future reference
**Steps**:
1. Add findings to NOTES.md under release entry

### PROPOSE-RULE-UPDATES-ACTION
**Purpose**: Suggest ground rules improvements based on patterns
**Steps**:
1. If patterns emerge from review, propose specific rule changes

### STOP-ACTION
**Purpose**: Halt current work and await direction
**Steps**:
1. Do not proceed with any operations
2. Wait for user input

### ACKNOWLEDGE-PROBLEM-ACTION
**Purpose**: Confirm understanding of reported issue
**Steps**:
1. Print: "You're right, the [thing] failed/didn't work."

### REQUEST-ANALYSIS-PERMISSION-ACTION
**Purpose**: Ask permission to investigate before fixing
**Steps**:
1. Ask: "Should I investigate the root cause before proposing a fix?"

### PERFORM-ROOT-CAUSE-ANALYSIS-ACTION
**Purpose**: Structured problem investigation
**Steps**:
1. What happened? (the symptom)
2. Why did it happen? (the direct cause)
3. Why didn't I detect it? (the detection failure)
4. What systemic issues allowed this? (the underlying pattern)

### PRESENT-FINDINGS-ACTION
**Purpose**: Share analysis results before proposing solutions
**Steps**:
1. Display root cause analysis findings
2. Do NOT propose fixes yet

### WAIT-FOR-DECISION-ACTION
**Purpose**: Get user direction on next steps
**Steps**:
1. Ask: "Should I fix now or continue with analysis?"
2. Wait for response

### ADD-TO-SESSION-CHECKLIST-ACTION
**Purpose**: Track subtasks within current conversation
**Steps**:
1. Add item to numbered list format
2. Assign status icon (✅ ⬜ ⏳)
3. Indent subtasks appropriately

### MARK-CURRENT-ITEM-ACTION
**Purpose**: Show which task is active
**Steps**:
1. Add `← CURRENT` marker to active item

### PRINT-CHECKLIST-ACTION
**Purpose**: Display session checklist
**Steps**:
1. Print complete checklist after each task completion

### PRINT-SESSION-CHECKLIST-ACTION
**Purpose**: Display current session task progress in consistent format
**Steps**:
1. Use format from SESSION-CHECKLIST-FORMAT-REF
2. Print all tasks with status icons (✅ ⬜ ⏳)
3. Mark current task with ← CURRENT

### UPDATE-TODO-ACTION
**Purpose**: Mark tasks complete in TODO.md
**Steps**:
1. Mark checkboxes [x]
2. Update phase status to "COMPLETE" or add completion date
3. Add commit reference if applicable

### UPDATE-NOTES-ACTION
**Purpose**: Update session state in NOTES.md
**Steps**:
1. Move phase from "IN PROGRESS" to completed section
2. Add completion date and commit reference
3. Document lessons learned or findings

### UPDATE-CHANGELOG-ACTION
**Purpose**: Record changes in CHANGELOG.md
**Steps**:
1. Add entry to Unreleased or new version section
2. Include technical notes if applicable

### VERIFY-CONSISTENCY-ACTION
**Purpose**: Ensure documentation files are synchronized
**Steps**:
1. Check that TODO.md, NOTES.md, and CHANGELOG.md tell same story
2. Ensure no orphaned references to "in progress" work

### ENGAGE-DISCUSSION-ACTION
**Purpose**: Participate in discussion without implementing
**Steps**:
1. Provide thoughts, suggestions, or alternatives
2. Do NOT execute any operations

### WAIT-FOR-APPROVAL-ACTION
**Purpose**: Hold until user gives explicit approval
**Steps**:
1. Do not implement suggested changes
2. Wait for "yes", "go ahead", "proceed", or similar

### EMBRACE-DETOUR-ACTION
**Purpose**: Accept foundation work as primary track
**Steps**:
1. Don't apologize for "going off track"
2. Acknowledge this IS the track

### ASK-PRIORITY-DECISION-ACTION
**Purpose**: Get user decision on foundation vs feature work
**Steps**:
1. Ask: "Should we fix this foundation issue before continuing with [original task]?"

### WAIT-FOR-EXPLICIT-DECISION-ACTION
**Purpose**: Hold for clear direction
**Steps**:
1. Wait for user to choose: continue with foundation OR return to feature

### CHECK-DOCUMENTATION-UPDATED-ACTION
**Purpose**: Verify documentation reflects current state
**Steps**:
1. Check if CHANGELOG.md needs updating (for code releases only)
2. Check if NOTES.md needs updating (if work context changed)
3. Check if TODO.md needs updating (mark completed tasks)

### RANDOM-SAMPLE-ACTION
**Purpose**: Select representative subset for manual testing
**Steps**:
1. Select 10-20 items from missing data set

### MANUAL-EXTRACTION-ACTION
**Purpose**: Test items individually to find patterns
**Steps**:
1. Test each sampled item manually

### ANALYZE-RESULTS-ACTION
**Purpose**: Determine if issue is extraction vs availability
**Steps**:
1. If sample succeeds → Extraction logic incomplete
2. If sample fails → Investigate API/data availability

### DISCOVER-PATTERNS-ACTION
**Purpose**: Identify common patterns in successful extractions
**Steps**:
1. Examine successful extractions
2. Document patterns

### IMPLEMENT-FIXES-ACTION
**Purpose**: Add missing extraction patterns to code
**Steps**:
1. Add discovered patterns to production code

### ADD-RAW-LOGGING-ACTION
**Purpose**: Capture complete API response for debugging
**Steps**:
1. Add: `console.log(JSON.stringify(rawResponse, null, 2))`
2. Mark as TEMPORARY - remove after issue resolved

### EXAMINE-STRUCTURE-ACTION
**Purpose**: Understand actual API response format
**Steps**:
1. Examine raw response data
2. Don't assume structure based on error presence

### CHECK-PARTIAL-SUCCESS-ACTION
**Purpose**: Identify if API returned both data and errors
**Steps**:
1. Check for data presence despite errors
2. Log partial errors for monitoring
3. Only fail if truly no data present

### DOCUMENT-FINDINGS-ACTION
**Purpose**: Record API behavior for future reference
**Steps**:
1. Update GraphQL-API-Reference.md or similar docs
2. Document partial error patterns

### CREATE-FEATURE-BRANCH-ACTION
**Purpose**: Start new feature development on isolated branch
**Steps**:
1. Create feature branch from main: `git checkout -b feature-name`
2. Explain workflow:
   - Make incremental commits with letter versions (v3.1.0.a, v3.1.0.b, etc.)
   - Push to GitHub when using GitHub Pages testing workflow
   - When ready to release, use READY-TO-RELEASE-TRIGGER

### CONFIRM-TESTING-WORKFLOW-ACTION
**Purpose**: Clarify which testing approach to use
**Steps**:
1. Ask user: "Which testing workflow?"
   - **Option A: Local Development** - Test on localhost:8000 (no push required during iterations)
   - **Option B: GitHub Pages Testing** - Push feature branch, configure repo settings, test on github.io
2. Document choice for session

### PREPARE-RELEASE-ACTION
**Purpose**: Complete all steps to finalize and release a feature
**Steps**:
1. (Optional) Squash all letter-versioned commits into one
2. Update to release version (remove letter, e.g., v3.1.0.c → v3.1.0)
3. Merge to main: `git checkout main && git merge feature-name`
4. Tag the release: `git tag vX.Y.Z` (use actual version)
5. Push with tags: `git push origin main --tags`

### FORMAT-COMMIT-MESSAGE-ACTION
**Purpose**: Create properly formatted commit message
**Format**:
```
Type: Brief description vX.Y.Z.letter

Detailed body explaining WHY, not just what.

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

**Types**: Feat, Fix, Update, Refactor, Docs, Test, Chore, Rename

**Steps**:
1. Identify change type
2. Include version in subject line
3. Write body explaining WHY
4. Add Claude attribution

### ASSESS-PROJECT-VERSION-IMPACT-ACTION
**Purpose**: Determine user impact of changes for semantic versioning
**Steps**:
1. Ask: "Does this affect data correctness or completeness?"
2. Ask: "Does this fix a bug users experience?" → Patch
3. Ask: "Does this add new functionality users can use?" → Minor
4. Ask: "Does this break existing functionality or require migration?" → Major
5. Ask: "Is this documentation/meta-work only?" → No increment

### CALCULATE-SEMANTIC-VERSION-ACTION
**Purpose**: Compute next project version based on impact
**Steps**:
1. Check current project version in README.md (NOT file versions)
2. Apply semantic versioning rule:
   - **Patch (Z)**: Bug fixes, minor improvements (e.g., v3.1.2 → v3.1.3)
   - **Minor (Y)**: New features, significant improvements (e.g., v3.1.3 → v3.2.0)
   - **Major (X)**: Breaking changes, major rewrites (e.g., v3.2.0 → v4.0.0)
3. State reasoning explicitly

### EXPLAIN-VERSION-INDEPENDENCE-ACTION
**Purpose**: Clarify that project version ≠ file versions
**Key Principle**: Project version and file versions are INDEPENDENT

**Explanation**:
- **Project Version** (README.md): User-facing, tracks releases that change user experience
- **File Versions** (APP_VERSION, FETCHER_VERSION, etc.): Developer-facing, track individual file changes
- **Common Mistake**: Assuming project version should match file versions
- **Reality**: File version v3.2.1 might release as project version v3.1.3 (patch fix)

### POST-COMPACTION-ACTION
**Purpose**: Ensure ground rules persist across session compaction
**CRITICAL**: When creating compaction summary, include these directives at the VERY BEGINNING:

**1. Ground Rules File Access Directive:**
```
IMMEDIATELY after reading this summary, BEFORE your first response:
1. Read SKILL-Development-Ground-Rules.md in full
2. Read SKILL-ReaderWrangler.md in full
3. Read CONTRIBUTING.md for decision frameworks
4. These files contain critical behavioral requirements:
   - Version management protocol
   - Approval workflow requirements
   - Ship Fast vs. Build Solid decision framework
   - Response start protocols (reading memory files, displaying status line)
```

**2. Standard Summary Content:**
Include current work status, completed work, and next steps as usual.

**Why This Matters:**
- Compaction summary is the ONLY way to pass behavioral requirements across session boundaries
- Without explicit file read directives, ground rules are forgotten
- Without the protocol reminder, status line display disappears
- Loss of these protocols causes rule violations

### EVALUATE-IDEA-CRITICALLY-ACTION
**Purpose**: Apply critical thinking to user suggestions
**Steps**:
1. Don't automatically agree - evaluate objectively
2. Consider edge cases and potential issues
3. Assess feasibility and maintainability

### IDENTIFY-POTENTIAL-ISSUES-ACTION
**Purpose**: Surface problems before implementation
**Steps**:
1. Check for: security vulnerabilities, performance impacts, breaking changes
2. Consider: edge cases, error handling, backwards compatibility
3. Flag concerns explicitly

### PROPOSE-ALTERNATIVES-ACTION
**Purpose**: Offer better approaches when identified
**Steps**:
1. Present alternative approach with reasoning
2. Compare tradeoffs clearly
3. Recommend preferred option with justification

### STATE-DISAGREEMENT-ACTION
**Purpose**: Express professional disagreement when warranted
**Steps**:
1. Say "I disagree because..." (not "you're wrong")
2. Explain reasoning clearly
3. Propose alternative
4. Accept user's final decision

### CONSIDER-REMOVAL-ALTERNATIVE-ACTION
**Purpose**: Simplify by removing rather than adding
**Steps**:
1. Ask: "Can we achieve this by REMOVING code instead?"
2. Identify code that could be deleted
3. Propose simplification if viable

### QUESTION-NECESSITY-ACTION
**Purpose**: Challenge scope creep
**Steps**:
1. Ask: "Is this feature truly necessary?"
2. Distinguish between nice-to-have and must-have
3. Consider: Will this be used? Does it add complexity? Is there a simpler alternative?

### ASSESS-COMPLEXITY-COST-ACTION
**Purpose**: Evaluate if complexity is justified
**Steps**:
1. Estimate implementation complexity
2. Estimate maintenance burden
3. Compare cost vs benefit
4. Recommend simpler approach if cost > benefit

### REVIEW-PAST-LEARNINGS-ACTION
**Purpose**: Avoid common mistakes and failed approaches before proposing solutions
**Steps**:
1. Read CHANGELOG.md Technical Notes section
2. Check if proposed approach was already tried and failed
3. If found, warn user and explain why it didn't work
4. Check if solution adds unnecessary complexity for rare operations
5. For dev/testing/maintenance features used infrequently (< weekly), prefer simple solutions over complex UIs
6. Propose alternative that hasn't been exhausted and is appropriately scoped

### ASSESS-DATA-IMPACT-ACTION
**Purpose**: Determine if data correctness/completeness affected
**Key Question**: "Does this affect data correctness or completeness?"
**Steps**:
1. Check if change involves: data integrity, core functionality, API contracts, state management, error handling
2. If YES → data is affected → Build Solid required
3. If NO → cosmetic/polish → Ship Fast acceptable

### DETERMINE-SHIP-FAST-OR-BUILD-SOLID-ACTION
**Purpose**: Choose appropriate development approach
**Decision Matrix**:

**Ship Fast When:**
- UI polish (colors, spacing, minor UX)
- Nice-to-have features
- Performance optimizations (unless critical)
- Edge cases affecting <0.01% with NO data loss
- Cosmetic improvements

**Build Solid When:**
- ✅ Data integrity issues
- ✅ Core functionality bugs
- ✅ API contract changes
- ✅ State management bugs
- ✅ Error handling gaps

**For This Project:**
- Library management → Users trust us with their book metadata
- Long-term use → Not a throwaway prototype
- Data permanence → Books = purchased content, reading history
- Cross-session reliability → Must work consistently over time

**Therefore: Default to Build Solid unless clearly cosmetic**

### JUSTIFY-TIME-INVESTMENT-ACTION
**Purpose**: Explain why thorough approach is worth it
**When**: Build Solid approach chosen
**Steps**:
1. Explain impact: "This affects data correctness/completeness"
2. Justify time: "Spending X days to achieve Y% coverage"
3. Document learning: "Investigation discovered Z patterns/behaviors"
4. Frame positively: "Red herrings are learning - we gained understanding of [system]"

**See CONTRIBUTING.md for detailed examples**

### UPDATE-CHANGELOG-ACTION
**Purpose**: Document version changes and approaches in CHANGELOG.md
**Steps**:
1. Update CHANGELOG.md before finalizing any version
2. Include Technical Notes section for:
   - Approaches that didn't work (blind alleys)
   - Why they failed
   - What finally worked
3. This prevents revisiting failed approaches in future sessions

### REVIEW-TECHNICAL-NOTES-ACTION
**Purpose**: Check if approach was previously attempted and failed
**Steps**:
1. Read CHANGELOG.md Technical Notes section
2. Look for similar approaches
3. Warn if approach was already tried
4. Reference what didn't work and why

### UPDATE-NOTES-TABLED-ITEMS-ACTION
**Purpose**: Record discussion items for future sessions
**Steps**:
1. Add item to NOTES.md under "Tabled Items" section
2. Include context about WHY it was tabled
3. Include date and any relevant context

### COMMIT-NOTES-WITH-OTHER-CHANGES-ACTION
**Purpose**: Ensure NOTES.md is backed up with commits
**Steps**:
1. Always include NOTES.md in commits (even if only other files changed)
2. This ensures session state is preserved in git history

### STOP-ACTION
**Purpose**: Halt execution and wait for user input
**Steps**:
1. Do NOT continue with implementation
2. Do NOT make assumptions about approval
3. Wait for explicit user response

### ASK-FOR-APPROVAL-ACTION
**Purpose**: Request explicit permission before operations
**Steps**:
1. Clearly state what operation you want to perform
2. Wait for explicit "yes", "go ahead", "please proceed", or similar
3. Questions like "should we?" are requests for DISCUSSION, NOT approval

### WAIT-FOR-EXPLICIT-CONFIRMATION-ACTION
**Purpose**: Ensure approval is clear and unambiguous
**Approval Language**:
- "Proceed with edits" = Make file edits ONLY, then STOP
- "Proceed with commit" = Commit ONLY, then STOP
- "Proceed with push" = Push ONLY, then STOP
- "Proceed with testing" = Make edits, commit, push (if GitHub Pages workflow), then STOP
- "Proceed with X and Y" = Do both X and Y, then STOP
- "Proceed" alone = Clarify what to proceed with
- When in doubt, do ONE operation and STOP

### STOP-AND-SELF-ASSESS-ACTION
**Purpose**: Detect implicit problem signals and review work
**Steps**:
1. Ask: "Did I complete this work correctly?"
2. Review what you did vs. what should have been done
3. Check relevant protocols (e.g., Phase Completion Protocol)
4. If gap found, proceed to ACKNOWLEDGE-IF-GAP-FOUND-ACTION

### REVIEW-COMPLETION-PROTOCOL-ACTION
**Purpose**: Verify all completion steps were executed
**Steps**:
1. Check if TODO.md was updated (tasks marked complete)
2. Check if NOTES.md was updated (phase moved from "IN PROGRESS")
3. Check if CHANGELOG.md was updated (if code release)
4. Check documentation consistency

### ACKNOWLEDGE-IF-GAP-FOUND-ACTION
**Purpose**: Admit mistakes when protocol steps were missed
**Steps**:
1. State explicitly: "You're right, I missed updating [files]"
2. Do NOT make excuses
3. Proceed to ROOT-CAUSE-ANALYSIS-ACTION

### ROOT-CAUSE-ANALYSIS-ACTION
**Purpose**: Understand why error occurred and how to prevent recurrence
**Steps**:
1. What happened? (the symptom)
2. Why did it happen? (the direct cause)
3. Why didn't I detect it? (the detection failure)
4. What systemic issues allowed this? (the underlying pattern)
5. Present findings BEFORE proposing solutions

### APPLY-NAMING-CONVENTION-ACTION
**Purpose**: Use consistent naming for temporary files
**Naming Patterns**:
- **Diagnostic Scripts**: `diag-NN-description.js` (NN = 01, 02, 03...)
- **Test Scripts**: `test-NN-description.js`
- **Output Files**: `output-NN-description.txt` or `.json`
**Steps**:
1. Use two-digit incrementing counter
2. Use descriptive filename
3. Follow pattern consistently

### PRINT-FILENAME-IN-OUTPUT-ACTION
**Purpose**: Verify correct script is running
**Steps**:
1. Print script filename in console output header
2. Format: `Script: filename.js`
3. Example:
   ```
   ========================================
   DIAGNOSTIC TOOL
   Script: diag-01-description.js
   ========================================
   ```

---

## REFERENCE DATA

**Purpose**: Constants and formats referenced by triggers and actions above.

### FILE-PATHS-REF
- **Memory file**: `.claude-memory` (project root)
- **Timestamp file**: `.claude-timestamp` (project root)
- **Compaction log**: `Compaction-log.md` (project root)

### DOCUMENTATION-FILES-REF

- README.md
- CHANGELOG.md
- TODO.md
- NOTES.md
- SKILL-*.md files
- Build scripts (.bat files)
- .gitignore

### SESSION-CHECKLIST-FORMAT-REF

**Format Rules**:
1. Numbered top-level steps (0, 1, 2...)
2. Status icons: ✅ = completed, ⬜ = pending, ⏳ = future/blocked
3. Mark current item with `← CURRENT`
4. Outline format: ~3 spaces indent per level
5. Top-level step is NOT complete until ALL subtasks are complete
6. Print checklist after completing each task
7. When user gives multiple items, add to checklist and address ONE at a time

**Example**:
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

### RELEASE-CHECKLIST-REF

1. Verify: CHANGELOG.md updated with version entry
2. Verify: NOTES.md marked as RELEASED ✅
3. Verify: TODO.md tasks marked complete
4. Verify: README.md project version updated
5. Then remove letter and tag

