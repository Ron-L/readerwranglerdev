---
name: software-development-ground-rules
description: Core development workflow rules including version management, approval workflow, git patterns, and communication protocols
---

<!-- TOC -->

- [Software Development Ground Rules](#software-development-ground-rules)
    - [HOW TO USE THIS FILE](#how-to-use-this-file)
    - [TRIGGERS Events That Activate Protocols](#triggers-events-that-activate-protocols)
        - [Meta & System Triggers](#meta--system-triggers)
            - [RESPONSE-START-TRIGGER](#response-start-trigger)
            - [SESSION-COMPACTION-TRIGGER](#session-compaction-trigger)
            - [SESSION-CHECKLIST-REQUEST-TRIGGER](#session-checklist-request-trigger)
        - [Code Development Workflow](#code-development-workflow)
            - [CODE-CHANGE-TRIGGER](#code-change-trigger)
            - [VERSION-CHANGE-PROPOSAL-TRIGGER](#version-change-proposal-trigger)
            - [FILE-CHANGES-COMPLETE-TRIGGER](#file-changes-complete-trigger)
        - [Decision & Planning Triggers](#decision--planning-triggers)
            - [DECIDING-APPROACH-TRIGGER](#deciding-approach-trigger)
            - [BEFORE-PROPOSING-SOLUTION-TRIGGER](#before-proposing-solution-trigger)
            - [ADDING-CODE-OR-FEATURE-TRIGGER](#adding-code-or-feature-trigger)
            - [USER-SUGGESTS-IDEA-TRIGGER](#user-suggests-idea-trigger)
        - [User Interaction Triggers](#user-interaction-triggers)
            - [WHEN-TO-STOP-AND-ASK-TRIGGER](#when-to-stop-and-ask-trigger)
            - [DISCUSSION-QUESTION-TRIGGER](#discussion-question-trigger)
            - [USER-PROBLEM-REPORT-TRIGGER](#user-problem-report-trigger)
            - [IMPLICIT-PROBLEM-SIGNAL-TRIGGER](#implicit-problem-signal-trigger)
            - [FOUNDATION-ISSUE-IDENTIFIED-TRIGGER](#foundation-issue-identified-trigger)
        - [Git Operations](#git-operations)
            - [GIT-OPERATION-TRIGGER](#git-operation-trigger)
            - [COMMIT-TRIGGER](#commit-trigger)
            - [CREATING-COMMIT-MESSAGE-TRIGGER](#creating-commit-message-trigger)
        - [Feature Development Lifecycle](#feature-development-lifecycle)
            - [START-NEW-FEATURE-TRIGGER](#start-new-feature-trigger)
            - [READY-TO-RELEASE-TRIGGER](#ready-to-release-trigger)
            - [RELEASE-FINALIZATION-TRIGGER](#release-finalization-trigger)
            - [POST-RELEASE-TRIGGER](#post-release-trigger)
        - [Task & Documentation Management](#task--documentation-management)
            - [TASK-COMPLETION-TRIGGER](#task-completion-trigger)
            - [PROJECT-VERSION-PROPOSAL-TRIGGER](#project-version-proposal-trigger)
            - [SKILL-FILE-MODIFIED-TRIGGER](#skill-file-modified-trigger)
            - [USER-SAYS-TABLE-THOUGHT-TRIGGER](#user-says-table-thought-trigger)
        - [Domain-Specific Patterns](#domain-specific-patterns)
            - [DATA-GAP-DETECTION-TRIGGER](#data-gap-detection-trigger)
            - [API-ERROR-TRIGGER](#api-error-trigger)
            - [CREATE-DIAGNOSTIC-SCRIPT-TRIGGER](#create-diagnostic-script-trigger)
            - [STALE-TIMESTAMP-TRIGGER](#stale-timestamp-trigger)
            - [FRESH-TIMESTAMP-TRIGGER](#fresh-timestamp-trigger)
    - [ACTIONS Protocol Implementations](#actions-protocol-implementations)
        - [Meta & System Actions](#meta--system-actions)
            - [READ-MEMORY-ACTION](#read-memory-action)
            - [INCREMENT-TIMESTAMP-STALE-CNT-ACTION](#increment-timestamp-stale-cnt-action)
            - [RESET-TIMESTAMP-STALE-CNT-ACTION](#reset-timestamp-stale-cnt-action)
            - [UPDATE-MEMORY-ACTION](#update-memory-action)
            - [DISPLAY-STATUS-LINE-ACTION](#display-status-line-action)
            - [NOTIFY-COMPACTION-ACTION](#notify-compaction-action)
            - [POST-COMPACTION-ACTION](#post-compaction-action)
        - [Code Development Workflow Actions](#code-development-workflow-actions)
            - [CHECK-VERSION-INCREMENTED-ACTION](#check-version-incremented-action)
            - [INCREMENT-VERSION-ACTION](#increment-version-action)
            - [STATE-CHECKING-RULE-ACTION](#state-checking-rule-action)
            - [QUOTE-CURRENT-VERSION-ACTION](#quote-current-version-action)
            - [IDENTIFY-PATTERN-ACTION](#identify-pattern-action)
            - [CALCULATE-NEXT-VERSION-ACTION](#calculate-next-version-action)
            - [PROPOSE-WITH-REASONING-ACTION](#propose-with-reasoning-action)
            - [LIST-MODIFIED-FILES-ACTION](#list-modified-files-action)
            - [SUMMARIZE-CHANGES-ACTION](#summarize-changes-action)
            - [REQUEST-COMMIT-APPROVAL-ACTION](#request-commit-approval-action)
        - [Decision & Planning Actions](#decision--planning-actions)
            - [ASSESS-DATA-IMPACT-ACTION](#assess-data-impact-action)
            - [DETERMINE-SHIP-FAST-OR-BUILD-SOLID-ACTION](#determine-ship-fast-or-build-solid-action)
            - [JUSTIFY-TIME-INVESTMENT-ACTION](#justify-time-investment-action)
            - [REVIEW-PAST-LEARNINGS-ACTION](#review-past-learnings-action)
            - [CONSIDER-REMOVAL-ALTERNATIVE-ACTION](#consider-removal-alternative-action)
            - [QUESTION-NECESSITY-ACTION](#question-necessity-action)
            - [ASSESS-COMPLEXITY-COST-ACTION](#assess-complexity-cost-action)
            - [EVALUATE-IDEA-CRITICALLY-ACTION](#evaluate-idea-critically-action)
            - [IDENTIFY-POTENTIAL-ISSUES-ACTION](#identify-potential-issues-action)
            - [PROPOSE-ALTERNATIVES-ACTION](#propose-alternatives-action)
            - [STATE-DISAGREEMENT-ACTION](#state-disagreement-action)
        - [User Interaction Actions](#user-interaction-actions)
            - [STOP-ACTION](#stop-action)
            - [ASK-FOR-APPROVAL-ACTION](#ask-for-approval-action)
            - [WAIT-FOR-EXPLICIT-CONFIRMATION-ACTION](#wait-for-explicit-confirmation-action)
            - [ENGAGE-DISCUSSION-ACTION](#engage-discussion-action)
            - [WAIT-FOR-APPROVAL-ACTION](#wait-for-approval-action)
            - [ACKNOWLEDGE-PROBLEM-ACTION](#acknowledge-problem-action)
            - [REQUEST-ANALYSIS-PERMISSION-ACTION](#request-analysis-permission-action)
            - [PERFORM-ROOT-CAUSE-ANALYSIS-ACTION](#perform-root-cause-analysis-action)
            - [PRESENT-FINDINGS-ACTION](#present-findings-action)
            - [WAIT-FOR-DECISION-ACTION](#wait-for-decision-action)
            - [STOP-AND-SELF-ASSESS-ACTION](#stop-and-self-assess-action)
            - [REVIEW-COMPLETION-PROTOCOL-ACTION](#review-completion-protocol-action)
            - [ACKNOWLEDGE-IF-GAP-FOUND-ACTION](#acknowledge-if-gap-found-action)
            - [ROOT-CAUSE-ANALYSIS-ACTION](#root-cause-analysis-action)
            - [EMBRACE-DETOUR-ACTION](#embrace-detour-action)
            - [ASK-PRIORITY-DECISION-ACTION](#ask-priority-decision-action)
            - [WAIT-FOR-EXPLICIT-DECISION-ACTION](#wait-for-explicit-decision-action)
        - [Git Operations Actions](#git-operations-actions)
            - [CHECK-APPROVAL-ACTION](#check-approval-action)
            - [VERIFY-APPROVAL-MATCH-ACTION](#verify-approval-match-action)
            - [UPDATE-BEFORE-COMMIT-ACTION](#update-before-commit-action)
            - [CHECK-DOCUMENTATION-UPDATED-ACTION](#check-documentation-updated-action)
            - [FORMAT-COMMIT-MESSAGE-ACTION](#format-commit-message-action)
        - [Feature Development Lifecycle Actions](#feature-development-lifecycle-actions)
            - [CREATE-FEATURE-BRANCH-ACTION](#create-feature-branch-action)
            - [CONFIRM-TESTING-WORKFLOW-ACTION](#confirm-testing-workflow-action)
            - [PREPARE-RELEASE-ACTION](#prepare-release-action)
            - [UPDATE-CHANGELOG-ACTION](#update-changelog-action)
            - [REVIEW-TECHNICAL-NOTES-ACTION](#review-technical-notes-action)
            - [REVIEW-CODE-TODOS-ACTION](#review-code-todos-action)
            - [VERIFY-RELEASE-DOCS-ACTION](#verify-release-docs-action)
            - [FINALIZE-RELEASE-TAG-ACTION](#finalize-release-tag-action)
            - [REQUEST-POST-MORTEM-ACTION](#request-post-mortem-action)
            - [CONDUCT-REVIEW-ACTION](#conduct-review-action)
            - [DOCUMENT-LESSONS-ACTION](#document-lessons-action)
            - [PROPOSE-RULE-UPDATES-ACTION](#propose-rule-updates-action)
        - [Task & Documentation Management Actions](#task--documentation-management-actions)
            - [ADD-TO-SESSION-CHECKLIST-ACTION](#add-to-session-checklist-action)
            - [MARK-CURRENT-ITEM-ACTION](#mark-current-item-action)
            - [PRINT-CHECKLIST-ACTION](#print-checklist-action)
            - [PRINT-SESSION-CHECKLIST-ACTION](#print-session-checklist-action)
            - [UPDATE-TODO-ACTION](#update-todo-action)
            - [UPDATE-LOG-ACTION](#update-log-action)
            - [VERIFY-CONSISTENCY-ACTION](#verify-consistency-action)
            - [ASSESS-PROJECT-VERSION-IMPACT-ACTION](#assess-project-version-impact-action)
            - [CALCULATE-SEMANTIC-VERSION-ACTION](#calculate-semantic-version-action)
            - [EXPLAIN-VERSION-INDEPENDENCE-ACTION](#explain-version-independence-action)
            - [DOCUMENT-GROUND-RULES-CHANGES-ACTION](#document-ground-rules-changes-action)
            - [ADD-TABLED-ITEM-ACTION](#add-tabled-item-action)
            - [COMMIT-LOG-WITH-OTHER-CHANGES-ACTION](#commit-log-with-other-changes-action)
        - [Domain-Specific Pattern Actions](#domain-specific-pattern-actions)
            - [RANDOM-SAMPLE-ACTION](#random-sample-action)
            - [MANUAL-EXTRACTION-ACTION](#manual-extraction-action)
            - [ANALYZE-RESULTS-ACTION](#analyze-results-action)
            - [DISCOVER-PATTERNS-ACTION](#discover-patterns-action)
            - [IMPLEMENT-FIXES-ACTION](#implement-fixes-action)
            - [ADD-RAW-LOGGING-ACTION](#add-raw-logging-action)
            - [EXAMINE-STRUCTURE-ACTION](#examine-structure-action)
            - [CHECK-PARTIAL-SUCCESS-ACTION](#check-partial-success-action)
            - [DOCUMENT-FINDINGS-ACTION](#document-findings-action)
            - [APPLY-NAMING-CONVENTION-ACTION](#apply-naming-convention-action)
            - [PRINT-FILENAME-IN-OUTPUT-ACTION](#print-filename-in-output-action)
    - [REFERENCE DATA](#reference-data)
        - [FILE-PATHS-REF](#file-paths-ref)
        - [DOCUMENTATION-FILES-REF](#documentation-files-ref)
        - [SESSION-CHECKLIST-FORMAT-REF](#session-checklist-format-ref)

<!-- /TOC -->

# Software Development Ground Rules

⚠️ **EXECUTION REQUIRED**: Do not just read these rules - EXECUTE them.
Every response MUST fire RESPONSE-START-TRIGGER and display the status line.

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

**Debug Tracing:**

When `debugLevel` in `.claude-memory` is set:
- **Level 1** (triggers only): Log each matched TRIGGER
- **Level 2** (full): Log each matched TRIGGER and each executed ACTION

Log format: `[timestamp] TRIGGER: <name>` or `[timestamp] ACTION: <name>`
- Use timestamp from `.claude-timestamp` file
- Append to `SKILL-Development-Ground-Rules-Log.md`
- If `debugLevel` is `0`, `false`, or absent: no logging

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

### Meta & System Triggers

#### RESPONSE-START-TRIGGER
**When**: At the beginning of EVERY Claude response
**Frequency**: Every single response without exception
**Actions**:
- READ-MEMORY-ACTION
- UPDATE-MEMORY-ACTION
- DISPLAY-STATUS-LINE-ACTION

#### SESSION-COMPACTION-TRIGGER
**When**: Current token percentage is GREATER than lastTokenPercent from .claude-memory (i.e., `currentTokenPercent > lastTokenPercent`)
**Where**:
- `currentTokenPercent` = (tokens_remaining / 200000) × 100 from system token budget
- `lastTokenPercent` = value from `.claude-memory` file (see FILE-PATHS-REF)
**Actions**:
- NOTIFY-COMPACTION-ACTION
- POST-COMPACTION-ACTION

#### SESSION-CHECKLIST-REQUEST-TRIGGER
**When**: User says "add to checklist", "checklist item", "session task", or provides current Session Checklist after compaction
**Actions**:
- ADD-TO-SESSION-CHECKLIST-ACTION
- MARK-CURRENT-ITEM-ACTION
- PRINT-CHECKLIST-ACTION

### Code Development Workflow

#### CODE-CHANGE-TRIGGER
**When**: Before making ANY modification to code files
**Excludes**: Documentation files (see DOCUMENTATION-FILES-REF)
**Actions**:
- CHECK-VERSION-INCREMENTED-ACTION
- INCREMENT-VERSION-ACTION (if not already done)

#### VERSION-CHANGE-PROPOSAL-TRIGGER
**When**: Before proposing a version number change
**Actions**:
- STATE-CHECKING-RULE-ACTION
- QUOTE-CURRENT-VERSION-ACTION
- IDENTIFY-PATTERN-ACTION
- CALCULATE-NEXT-VERSION-ACTION
- PROPOSE-WITH-REASONING-ACTION

#### FILE-CHANGES-COMPLETE-TRIGGER
**When**: After you finish making file changes and before proposing a commit
**Actions**:
- LIST-MODIFIED-FILES-ACTION
- SUMMARIZE-CHANGES-ACTION
- REQUEST-COMMIT-APPROVAL-ACTION

### Decision & Planning Triggers

#### DECIDING-APPROACH-TRIGGER
**When**: When evaluating how to implement a bug fix or feature
**Actions**:
- ASSESS-DATA-IMPACT-ACTION
- DETERMINE-SHIP-FAST-OR-BUILD-SOLID-ACTION
- JUSTIFY-TIME-INVESTMENT-ACTION (if Build Solid chosen)

#### BEFORE-PROPOSING-SOLUTION-TRIGGER
**When**: Before proposing any approach, fix, or solution to user
**Actions**:
- REVIEW-PAST-LEARNINGS-ACTION

#### ADDING-CODE-OR-FEATURE-TRIGGER
**When**: Before proposing or implementing new code or functionality
**Actions**:
- CONSIDER-REMOVAL-ALTERNATIVE-ACTION
- QUESTION-NECESSITY-ACTION
- ASSESS-COMPLEXITY-COST-ACTION

#### USER-SUGGESTS-IDEA-TRIGGER
**When**: User proposes new approach, feature, or solution
**Actions**:
- EVALUATE-IDEA-CRITICALLY-ACTION
- IDENTIFY-POTENTIAL-ISSUES-ACTION
- PROPOSE-ALTERNATIVES-ACTION (if warranted)
- STATE-DISAGREEMENT-ACTION (when appropriate)

### User Interaction Triggers

#### WHEN-TO-STOP-AND-ASK-TRIGGER
**When**: Before implementing any code change, git operation, or file creation/modification, OR when uncertain about approach
**Actions**:
- STOP-ACTION
- ASK-FOR-APPROVAL-ACTION
- WAIT-FOR-EXPLICIT-CONFIRMATION-ACTION

#### DISCUSSION-QUESTION-TRIGGER
**When**: User asks "should we?", "thoughts?", "what do you think?", "your thoughts?"
**Actions**:
- STOP-ACTION
- ENGAGE-DISCUSSION-ACTION
- WAIT-FOR-APPROVAL-ACTION (do NOT implement)

#### USER-PROBLEM-REPORT-TRIGGER
**When**: User reports an issue, error, or unexpected behavior
**Includes**: Explicit reports AND implicit signals ("can you review...", "please check...")
**Actions**:
- STOP-ACTION
- ACKNOWLEDGE-PROBLEM-ACTION
- REQUEST-ANALYSIS-PERMISSION-ACTION
- PERFORM-ROOT-CAUSE-ANALYSIS-ACTION (if approved)
- PRESENT-FINDINGS-ACTION
- WAIT-FOR-DECISION-ACTION

#### IMPLICIT-PROBLEM-SIGNAL-TRIGGER
**When**: User asks to "review", "check", or "verify" work you JUST completed
**Red Flags**: "Can you review [files you just worked with]?", "I think [statement about your work] - is that right?", "Please check if [something you should have done]"
**Actions**:
- STOP-AND-SELF-ASSESS-ACTION
- REVIEW-COMPLETION-PROTOCOL-ACTION
- ACKNOWLEDGE-IF-GAP-FOUND-ACTION
- ROOT-CAUSE-ANALYSIS-ACTION (without being asked)

#### FOUNDATION-ISSUE-IDENTIFIED-TRIGGER
**When**: User identifies foundational issue (rules not working, docs unclear, structure confusing)
**Actions**:
- EMBRACE-DETOUR-ACTION
- ASK-PRIORITY-DECISION-ACTION
- WAIT-FOR-EXPLICIT-DECISION-ACTION

### Git Operations

#### GIT-OPERATION-TRIGGER
**When**: Before any git command (commit, push, pull, merge, revert, tag, etc.)
**Actions**:
- CHECK-APPROVAL-ACTION
- VERIFY-APPROVAL-MATCH-ACTION

#### COMMIT-TRIGGER
**When**: Before executing git commit
**Actions**:
- UPDATE-BEFORE-COMMIT-ACTION
- CHECK-DOCUMENTATION-UPDATED-ACTION

#### CREATING-COMMIT-MESSAGE-TRIGGER
**When**: Executing git commit
**Actions**:
- FORMAT-COMMIT-MESSAGE-ACTION

### Feature Development Lifecycle

#### START-NEW-FEATURE-TRIGGER
**When**: After user approves starting a new feature and before making any code changes
**Actions**:
- CREATE-FEATURE-BRANCH-ACTION
- CONFIRM-TESTING-WORKFLOW-ACTION

#### READY-TO-RELEASE-TRIGGER
**When**: After user confirms feature is ready to merge to main
**Actions**:
- PREPARE-RELEASE-ACTION

#### RELEASE-FINALIZATION-TRIGGER
**When**: Before removing version letter (finalizing a release)
**Actions**:
- UPDATE-CHANGELOG-ACTION
- REVIEW-TECHNICAL-NOTES-ACTION
- REVIEW-CODE-TODOS-ACTION
- VERIFY-RELEASE-DOCS-ACTION
- FINALIZE-RELEASE-TAG-ACTION

#### POST-RELEASE-TRIGGER
**When**: After push/tag completes for a code release (project version incremented)
**Excludes**: Documentation-only changes, letter-version commits
**Actions**:
- REQUEST-POST-MORTEM-ACTION
- CONDUCT-REVIEW-ACTION
- DOCUMENT-LESSONS-ACTION
- PROPOSE-RULE-UPDATES-ACTION (if patterns emerge)

### Task & Documentation Management

#### TASK-COMPLETION-TRIGGER
**When**: After you mark any TODO.md item as complete [x]
**Actions**:
- UPDATE-TODO-ACTION
- UPDATE-LOG-ACTION
- UPDATE-CHANGELOG-ACTION (if code release)
- VERIFY-CONSISTENCY-ACTION
- REQUEST-APPROVAL-ACTION

#### PROJECT-VERSION-PROPOSAL-TRIGGER
**When**: Proposing a change to project version (README.md "Version" section)
**Actions**:
- ASSESS-PROJECT-VERSION-IMPACT-ACTION
- CALCULATE-SEMANTIC-VERSION-ACTION
- EXPLAIN-VERSION-INDEPENDENCE-ACTION

#### SKILL-FILE-MODIFIED-TRIGGER
**When**: After modifying any SKILL-*.md file (ground rules, project-specific skills)
**Actions**:
- DOCUMENT-GROUND-RULES-CHANGES-ACTION

#### USER-SAYS-TABLE-THOUGHT-TRIGGER
**When**: User says "table that thought", "hold that thought", or similar
**Actions**:
- ADD-TABLED-ITEM-ACTION
- COMMIT-LOG-WITH-OTHER-CHANGES-ACTION

### Domain-Specific Patterns

#### DATA-GAP-DETECTION-TRIGGER
**When**: >10% of expected data is missing or empty
**Actions**:
- RANDOM-SAMPLE-ACTION
- MANUAL-EXTRACTION-ACTION
- ANALYZE-RESULTS-ACTION
- DISCOVER-PATTERNS-ACTION
- IMPLEMENT-FIXES-ACTION

#### API-ERROR-TRIGGER
**When**: When encountering API errors or investigating API behavior issues
**Actions**:
- ADD-RAW-LOGGING-ACTION
- EXAMINE-STRUCTURE-ACTION
- CHECK-PARTIAL-SUCCESS-ACTION
- DOCUMENT-FINDINGS-ACTION

#### CREATE-DIAGNOSTIC-SCRIPT-TRIGGER
**When**: Creating temporary diagnostic, test, or output files
**Actions**:
- APPLY-NAMING-CONVENTION-ACTION
- PRINT-FILENAME-IN-OUTPUT-ACTION

#### STALE-TIMESTAMP-TRIGGER
**When**: Read the file `.claude-timestamp` (project root - see FILE-PATHS-REF for path) and it matches `lastTimestamp` from memory
**Actions**:
- INCREMENT-TIMESTAMP-STALE-CNT-ACTION

#### FRESH-TIMESTAMP-TRIGGER
**When**: Read the file `.claude-timestamp` (project root - see FILE-PATHS-REF for path) and it does not match `lastTimestamp` from memory
**Actions**:
- RESET-TIMESTAMP-STALE-CNT-ACTION

---

## ACTIONS (Protocol Implementations)

### Meta & System Actions

#### READ-MEMORY-ACTION
**Purpose**: Load persistent state from .claude-memory file
**Steps**:
1. Read `.claude-memory` (project root - see FILE-PATHS-REF for path)
2. Parse JSON
3. Extract: `lastTokenPercent`, `lastTimestamp`, `timestampStaleCount`

#### INCREMENT-TIMESTAMP-STALE-CNT-ACTION
**Purpose**: Increment the count of how long it has been since the timestamp updated
**Steps**:
1. Increment `timestampStaleCount`

#### RESET-TIMESTAMP-STALE-CNT-ACTION
**Purpose**: Reset the count of how long it has been since the timestamp updated
**Steps**:
1. Reset `timestampStaleCount` to 0

#### UPDATE-MEMORY-ACTION
**Purpose**: Persist current state to .claude-memory
**Steps**:
1. Write JSON to `.claude-memory`:
   ```json
   {
     "lastTokenPercent": <currentPercent>,
     "lastTimestamp": "<timestamp from reading the file .claude-timestamp>",
     "timestampStaleCount": <calculated value>
   }
   ```

#### DISPLAY-STATUS-LINE-ACTION
**Purpose**: Show current session status
**Format**:
```
📋 Ground Rules Active [YYYY-MM-DD HH:MM:SS] | ████░ XX% left 🟢
---
```

**Components**:
- Timestamp: Read the file `.claude-timestamp`
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

#### NOTIFY-COMPACTION-ACTION
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

#### POST-COMPACTION-ACTION
**Purpose**: Ensure ground rules persist across session compaction
**CRITICAL**: When creating compaction summary, include these directives at the VERY BEGINNING:

**Steps:**

1. **Include execution directive** in compaction summary (IMPERATIVE - NOT OPTIONAL):
   ```
   🚨 EXECUTE THESE STEPS IMMEDIATELY BEFORE YOUR FIRST RESPONSE 🚨

   STEP 1: Read and EXECUTE ground rules file
     → Read and EXECUTE SKILL-Development-Ground-Rules.md in full

   STEP 2: Read and EXECUTE project skills file
     → Read and EXECUTE SKILL-ReaderWrangler.md in full

   STEP 3: Read decision frameworks (reference, not rules)
     → Read CONTRIBUTING.md for guidance on Ship Fast vs Build Solid decisions

   STEP 4: EXECUTE RESPONSE-START-TRIGGER
     → Read .claude-memory file (READ-MEMORY-ACTION)
     → Calculate current token percentage
     → Write updated .claude-memory (UPDATE-MEMORY-ACTION)
     → Display status line at TOP of first response (DISPLAY-STATUS-LINE-ACTION)

   STEP 5: THEN respond to user

   STATUS LINE FORMAT (from DISPLAY-STATUS-LINE-ACTION):
   📋 Ground Rules Active [YYYY-MM-DD HH:MM:SS] | ████░ XX% left 🟢
   ---

   DO NOT use old format: "📋 Ground Rules Active - Full rules in..."
   USE ONLY the format above with progress bars and percentage.
   ```

2. **Include standard summary content**: current work status, completed work, and next steps.

**Why This Matters:**
- Compaction summary is the ONLY way to pass behavioral requirements across session boundaries
- Without explicit file read directives, ground rules are forgotten
- Without EXECUTE command, protocols are not applied
- Without the protocol reminder, status line display disappears
- Loss of these protocols causes rule violations
- Debug tracing (if enabled) will automatically log this trigger/action via the Execution Protocol

### Code Development Workflow Actions

#### CHECK-VERSION-INCREMENTED-ACTION
**Purpose**: Verify version was incremented before code changes
**Steps**:
1. State: "**Checking Ground Rule #1 (Version Management)...**"
2. Check if version was incremented in current session
3. If yes: Display verification, proceed
4. If no: STOP, execute INCREMENT-VERSION-ACTION first

#### INCREMENT-VERSION-ACTION
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

#### STATE-CHECKING-RULE-ACTION
**Purpose**: Make rule verification visible
**Steps**:
1. Print: "**Checking Ground Rule #X (Rule Name)...**"

#### QUOTE-CURRENT-VERSION-ACTION
**Purpose**: Show current version state
**Steps**:
1. Print: "Current version: vX.Y.Z"

#### IDENTIFY-PATTERN-ACTION
**Purpose**: Determine which versioning pattern applies
**Steps**:
1. Print: "Action: [description]"
2. Print: "Pattern: [starting new work / iterating / releasing]"

#### CALCULATE-NEXT-VERSION-ACTION
**Purpose**: Compute the next version number
**Steps**:
1. Apply pattern logic
2. Print: "Next version: vX.Y.Z"

#### PROPOSE-WITH-REASONING-ACTION
**Purpose**: Present version change with justification
**Steps**:
1. Show calculation
2. Explain why this pattern was chosen

#### LIST-MODIFIED-FILES-ACTION
**Purpose**: Show user what files were changed
**Steps**:
1. State: "**Documentation/code changes complete**"
2. List all modified/created files

#### SUMMARIZE-CHANGES-ACTION
**Purpose**: Explain what changed in each file
**Steps**:
1. For each modified file, summarize the nature of changes

#### REQUEST-COMMIT-APPROVAL-ACTION
**Purpose**: Get explicit permission to commit
**Steps**:
1. Ask: "Should I proceed with committing these changes?"
2. STOP and wait for response

### Decision & Planning Actions

#### ASSESS-DATA-IMPACT-ACTION
**Purpose**: Determine if data correctness/completeness affected
**Key Question**: "Does this affect data correctness or completeness?"
**Steps**:
1. Check if change involves: data integrity, core functionality, API contracts, state management, error handling
2. If YES → data is affected → Build Solid required
3. If NO → cosmetic/polish → Ship Fast acceptable

#### DETERMINE-SHIP-FAST-OR-BUILD-SOLID-ACTION
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

#### JUSTIFY-TIME-INVESTMENT-ACTION
**Purpose**: Explain why thorough approach is worth it
**When**: Build Solid approach chosen
**Steps**:
1. Explain impact: "This affects data correctness/completeness"
2. Justify time: "Spending X days to achieve Y% coverage"
3. Document learning: "Investigation discovered Z patterns/behaviors"
4. Frame positively: "Red herrings are learning - we gained understanding of [system]"

**See CONTRIBUTING.md for detailed examples**

#### REVIEW-PAST-LEARNINGS-ACTION
**Purpose**: Avoid common mistakes and failed approaches before proposing solutions
**Steps**:
1. Read CHANGELOG.md Technical Notes section
2. Check if proposed approach was already tried and failed
3. If found, warn user and explain why it didn't work
4. Check if solution adds unnecessary complexity for rare operations
5. For dev/testing/maintenance features used infrequently (< weekly), prefer simple solutions over complex UIs
6. Propose alternative that hasn't been exhausted and is appropriately scoped

#### CONSIDER-REMOVAL-ALTERNATIVE-ACTION
**Purpose**: Simplify by removing rather than adding
**Steps**:
1. Ask: "Can we achieve this by REMOVING code instead?"
2. Identify code that could be deleted
3. Propose simplification if viable

#### QUESTION-NECESSITY-ACTION
**Purpose**: Challenge scope creep
**Steps**:
1. Ask: "Is this feature truly necessary?"
2. Distinguish between nice-to-have and must-have
3. Consider: Will this be used? Does it add complexity? Is there a simpler alternative?

#### ASSESS-COMPLEXITY-COST-ACTION
**Purpose**: Evaluate if complexity is justified
**Steps**:
1. Estimate implementation complexity
2. Estimate maintenance burden
3. Compare cost vs benefit
4. Recommend simpler approach if cost > benefit

#### EVALUATE-IDEA-CRITICALLY-ACTION
**Purpose**: Apply critical thinking to user suggestions
**Steps**:
1. Don't automatically agree - evaluate objectively
2. Consider edge cases and potential issues
3. Assess feasibility and maintainability

#### IDENTIFY-POTENTIAL-ISSUES-ACTION
**Purpose**: Surface problems before implementation
**Steps**:
1. Check for: security vulnerabilities, performance impacts, breaking changes
2. Consider: edge cases, error handling, backwards compatibility
3. Flag concerns explicitly

#### PROPOSE-ALTERNATIVES-ACTION
**Purpose**: Offer better approaches when identified
**Steps**:
1. Present alternative approach with reasoning
2. Compare tradeoffs clearly
3. Recommend preferred option with justification

#### STATE-DISAGREEMENT-ACTION
**Purpose**: Express professional disagreement when warranted
**Steps**:
1. Say "I disagree because..." (not "you're wrong")
2. Explain reasoning clearly
3. Propose alternative
4. Accept user's final decision

### User Interaction Actions

#### STOP-ACTION
**Purpose**: Halt current work and await direction
**Steps**:
1. Do not proceed with any operations
2. Wait for user input

#### ASK-FOR-APPROVAL-ACTION
**Purpose**: Request explicit permission before operations
**Steps**:
1. Clearly state what operation you want to perform
2. Wait for explicit "yes", "go ahead", "please proceed", or similar
3. Questions like "should we?" are requests for DISCUSSION, NOT approval

#### WAIT-FOR-EXPLICIT-CONFIRMATION-ACTION
**Purpose**: Ensure approval is clear and unambiguous
**Approval Language**:
- "Proceed with edits" = Make file edits ONLY, then STOP
- "Proceed with commit" = Commit ONLY, then STOP
- "Proceed with push" = Push ONLY, then STOP
- "Proceed with testing" = Make edits, commit, push (if GitHub Pages workflow), then STOP
- "Proceed with X and Y" = Do both X and Y, then STOP
- "Proceed" alone = Clarify what to proceed with
- When in doubt, do ONE operation and STOP

#### ENGAGE-DISCUSSION-ACTION
**Purpose**: Participate in discussion without implementing
**Steps**:
1. Provide thoughts, suggestions, or alternatives
2. Do NOT execute any operations

#### WAIT-FOR-APPROVAL-ACTION
**Purpose**: Hold until user gives explicit approval
**Steps**:
1. Do not implement suggested changes
2. Wait for "yes", "go ahead", "proceed", or similar

#### ACKNOWLEDGE-PROBLEM-ACTION
**Purpose**: Confirm understanding of reported issue
**Steps**:
1. Print: "You're right, the [thing] failed/didn't work."

#### REQUEST-ANALYSIS-PERMISSION-ACTION
**Purpose**: Ask permission to investigate before fixing
**Steps**:
1. Ask: "Should I investigate the root cause before proposing a fix?"

#### PERFORM-ROOT-CAUSE-ANALYSIS-ACTION
**Purpose**: Structured problem investigation
**Steps**:
1. What happened? (the symptom)
2. Why did it happen? (the direct cause)
3. Why didn't I detect it? (the detection failure)
4. What systemic issues allowed this? (the underlying pattern)

#### PRESENT-FINDINGS-ACTION
**Purpose**: Share analysis results before proposing solutions
**Steps**:
1. Display root cause analysis findings
2. Do NOT propose fixes yet

#### WAIT-FOR-DECISION-ACTION
**Purpose**: Get user direction on next steps
**Steps**:
1. Ask: "Should I fix now or continue with analysis?"
2. Wait for response

#### STOP-AND-SELF-ASSESS-ACTION
**Purpose**: Detect implicit problem signals and review work
**Steps**:
1. Ask: "Did I complete this work correctly?"
2. Review what you did vs. what should have been done
3. Check relevant protocols (e.g., Phase Completion Protocol)
4. If gap found, proceed to ACKNOWLEDGE-IF-GAP-FOUND-ACTION

#### REVIEW-COMPLETION-PROTOCOL-ACTION
**Purpose**: Verify all completion steps were executed
**Steps**:
1. Check if TODO.md was updated (tasks marked complete)
2. Check if LOG.md was updated (phase moved from "IN PROGRESS")
3. Check if CHANGELOG.md was updated (if code release)
4. Check documentation consistency

#### ACKNOWLEDGE-IF-GAP-FOUND-ACTION
**Purpose**: Admit mistakes when protocol steps were missed
**Steps**:
1. State explicitly: "You're right, I missed updating [files]"
2. Do NOT make excuses
3. Proceed to ROOT-CAUSE-ANALYSIS-ACTION

#### ROOT-CAUSE-ANALYSIS-ACTION
**Purpose**: Understand why error occurred and how to prevent recurrence
**Steps**:
1. What happened? (the symptom)
2. Why did it happen? (the direct cause)
3. Why didn't I detect it? (the detection failure)
4. What systemic issues allowed this? (the underlying pattern)
5. Present findings BEFORE proposing solutions

#### EMBRACE-DETOUR-ACTION
**Purpose**: Accept foundation work as primary track
**Steps**:
1. Don't apologize for "going off track"
2. Acknowledge this IS the track

#### ASK-PRIORITY-DECISION-ACTION
**Purpose**: Get user decision on foundation vs feature work
**Steps**:
1. Ask: "Should we fix this foundation issue before continuing with [original task]?"

#### WAIT-FOR-EXPLICIT-DECISION-ACTION
**Purpose**: Hold for clear direction
**Steps**:
1. Wait for user to choose: continue with foundation OR return to feature

### Git Operations Actions

#### CHECK-APPROVAL-ACTION
**Purpose**: Verify user has given explicit approval for git operation
**Steps**:
1. State: "**Checking Ground Rule #2 (Approval Workflow)...**"
2. Quote user's approval (exact words)
3. Identify the operation being requested

#### VERIFY-APPROVAL-MATCH-ACTION
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

#### UPDATE-BEFORE-COMMIT-ACTION
**Purpose**: Ensure local repo is current before committing
**Steps**:
1. State: "**Checking Ground Rule #3 (Update Before Commit)...**"
2. Run: `git fetch`
3. Check for upstream changes
4. If conflicts exist: Resolve before proceeding

#### CHECK-DOCUMENTATION-UPDATED-ACTION
**Purpose**: Verify documentation reflects current state
**Steps**:
1. Check if CHANGELOG.md needs updating (for code releases only)
2. Check if LOG.md needs updating (if work context changed)
3. Check if TODO.md needs updating (mark completed tasks)

#### FORMAT-COMMIT-MESSAGE-ACTION
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

### Feature Development Lifecycle Actions

#### CREATE-FEATURE-BRANCH-ACTION
**Purpose**: Start new feature development on isolated branch
**Steps**:
1. Create feature branch from main: `git checkout -b feature-name`
2. Explain workflow:
   - Make incremental commits with letter versions (v3.1.0.a, v3.1.0.b, etc.)
   - Push to GitHub when using GitHub Pages testing workflow
   - When ready to release, use READY-TO-RELEASE-TRIGGER

#### CONFIRM-TESTING-WORKFLOW-ACTION
**Purpose**: Clarify which testing approach to use
**Steps**:
1. Ask user: "Which testing workflow?"
   - **Option A: Local Development** - Test on localhost:8000 (no push required during iterations)
   - **Option B: GitHub Pages Testing** - Push feature branch, configure repo settings, test on github.io
2. Document choice for session

#### PREPARE-RELEASE-ACTION
**Purpose**: Complete all steps to finalize and release a feature
**Steps**:
1. (Optional) Squash all letter-versioned commits into one
2. Update to release version (remove letter, e.g., v3.1.0.c → v3.1.0)
3. Merge to main: `git checkout main && git merge feature-name`
4. Tag the release: `git tag vX.Y.Z` (use actual version)
5. Push with tags: `git push origin main --tags`

#### UPDATE-CHANGELOG-ACTION
**Purpose**: Document version changes and approaches in CHANGELOG.md
**Steps**:
1. Update CHANGELOG.md before finalizing any version
2. Include Technical Notes section for:
   - Approaches that didn't work (blind alleys)
   - Why they failed
   - What finally worked
3. This prevents revisiting failed approaches in future sessions

#### REVIEW-TECHNICAL-NOTES-ACTION
**Purpose**: Check if approach was previously attempted and failed
**Steps**:
1. Read CHANGELOG.md Technical Notes section
2. Look for similar approaches
3. Warn if approach was already tried
4. Reference what didn't work and why

#### REVIEW-CODE-TODOS-ACTION
**Purpose**: Check for temporary TODO comments before release
**Steps**:
1. Run: `grep -rn "TODO" *.js *.html 2>/dev/null | grep -v "node_modules"`
2. If found: Display results with file names and line numbers
3. Ask user: "Fix these TODOs or proceed with release?"
4. If user says "fix": STOP and abort release
5. If user says "proceed": Continue to next action

#### VERIFY-RELEASE-DOCS-ACTION
**Purpose**: Verify all required documentation is updated
**Steps**:
1. Check CHANGELOG.md updated with version entry (STOP if missing)
2. Check LOG.md marked as RELEASED ✅ (STOP if missing)
3. Check TODO.md tasks marked complete (STOP if missing)
4. Check README.md project version updated (STOP if missing)
5. If all verified: Continue to next action
6. If any missing: STOP and report which item failed

#### FINALIZE-RELEASE-TAG-ACTION
**Purpose**: Remove version letter and create git tag
**Steps**:
1. Remove letter from version (e.g., v3.2.1.c → v3.2.1)
2. Create git tag: `git tag vX.Y.Z`

#### REQUEST-POST-MORTEM-ACTION
**Purpose**: Initiate post-release review
**Steps**:
1. Ask: "Release vX.Y.Z complete. Ready for post-mortem?"

#### CONDUCT-REVIEW-ACTION
**Purpose**: Perform structured review
**Questions**:
- What worked well?
- What mistakes were made?
- What lessons learned?
- Any ground rules need updating?

#### DOCUMENT-LESSONS-ACTION
**Purpose**: Capture insights for future reference
**Steps**:
1. Add findings to LOG.md under release entry

#### PROPOSE-RULE-UPDATES-ACTION
**Purpose**: Suggest ground rules improvements based on patterns
**Steps**:
1. If patterns emerge from review, propose specific rule changes

### Task & Documentation Management Actions

#### ADD-TO-SESSION-CHECKLIST-ACTION
**Purpose**: Track subtasks within current conversation
**Steps**:
1. Add item to numbered list format
2. Assign status icon (✅ ⬜ ⏳)
3. Indent subtasks appropriately

#### MARK-CURRENT-ITEM-ACTION
**Purpose**: Show which task is active
**Steps**:
1. Add `← CURRENT` marker to active item

#### PRINT-CHECKLIST-ACTION
**Purpose**: Display session checklist
**Steps**:
1. Print complete checklist after each task completion

#### PRINT-SESSION-CHECKLIST-ACTION
**Purpose**: Display current session task progress in consistent format
**Steps**:
1. Use format from SESSION-CHECKLIST-FORMAT-REF
2. Print all tasks with status icons (✅ ⬜ ⏳)
3. Mark current task with ← CURRENT

#### UPDATE-TODO-ACTION
**Purpose**: Mark tasks complete in TODO.md
**Steps**:
1. Mark checkboxes [x]
2. Update phase status to "COMPLETE" or add completion date
3. Add commit reference if applicable

#### UPDATE-LOG-ACTION
**Purpose**: Update session state in LOG.md
**Steps**:
1. Move phase from "IN PROGRESS" to completed section
2. Add completion date and commit reference
3. Document lessons learned or findings

#### VERIFY-CONSISTENCY-ACTION
**Purpose**: Ensure documentation files are synchronized
**Steps**:
1. Check that TODO.md, LOG.md, and CHANGELOG.md tell same story
2. Ensure no orphaned references to "in progress" work

#### ASSESS-PROJECT-VERSION-IMPACT-ACTION
**Purpose**: Determine user impact of changes for semantic versioning
**Steps**:
1. Ask: "Does this affect data correctness or completeness?"
2. Ask: "Does this fix a bug users experience?" → Patch
3. Ask: "Does this add new functionality users can use?" → Minor
4. Ask: "Does this break existing functionality or require migration?" → Major
5. Ask: "Is this documentation/meta-work only?" → No increment

#### CALCULATE-SEMANTIC-VERSION-ACTION
**Purpose**: Compute next project version based on impact
**Steps**:
1. Check current project version in README.md (NOT file versions)
2. Apply semantic versioning rule:
   - **Patch (Z)**: Bug fixes, minor improvements (e.g., v3.1.2 → v3.1.3)
   - **Minor (Y)**: New features, significant improvements (e.g., v3.1.3 → v3.2.0)
   - **Major (X)**: Breaking changes, major rewrites (e.g., v3.2.0 → v4.0.0)
3. State reasoning explicitly

#### EXPLAIN-VERSION-INDEPENDENCE-ACTION
**Purpose**: Clarify that project version ≠ file versions
**Key Principle**: Project version and file versions are INDEPENDENT

**Explanation**:
- **Project Version** (README.md): User-facing, tracks releases that change user experience
- **File Versions** (APP_VERSION, FETCHER_VERSION, etc.): Developer-facing, track individual file changes
- **Common Mistake**: Assuming project version should match file versions
- **Reality**: File version v3.2.1 might release as project version v3.1.3 (patch fix)

#### DOCUMENT-GROUND-RULES-CHANGES-ACTION
**Purpose**: Track changes to SKILL-*.md files for future reference
**Steps**:
1. Add entry to LOG.md with @RULES tag
2. Include: Date, what changed, why it changed, commit hash
3. Skip CHANGELOG.md (not user-facing product changes)
4. Format:
   ```
   **[YYYY-MM-DD] Brief Title**
   - Changes made (bullet list)
   - Rationale: Why this change
   - Commits: [hash]
   ```

#### ADD-TABLED-ITEM-ACTION
**Purpose**: Record discussion items for future sessions
**Steps**:
1. Add item to TODO.md under "Tabled Items" section
2. Include context about WHY it was tabled
3. Include date and any relevant context

#### COMMIT-LOG-WITH-OTHER-CHANGES-ACTION
**Purpose**: Ensure LOG.md is backed up with commits
**Steps**:
1. Always include LOG.md in commits (even if only other files changed)
2. This ensures session state is preserved in git history

### Domain-Specific Pattern Actions

#### RANDOM-SAMPLE-ACTION
**Purpose**: Select representative subset for manual testing
**Steps**:
1. Select 10-20 items from missing data set

#### MANUAL-EXTRACTION-ACTION
**Purpose**: Test items individually to find patterns
**Steps**:
1. Test each sampled item manually

#### ANALYZE-RESULTS-ACTION
**Purpose**: Determine if issue is extraction vs availability
**Steps**:
1. If sample succeeds → Extraction logic incomplete
2. If sample fails → Investigate API/data availability

#### DISCOVER-PATTERNS-ACTION
**Purpose**: Identify common patterns in successful extractions
**Steps**:
1. Examine successful extractions
2. Document patterns

#### IMPLEMENT-FIXES-ACTION
**Purpose**: Add missing extraction patterns to code
**Steps**:
1. Add discovered patterns to production code

#### ADD-RAW-LOGGING-ACTION
**Purpose**: Capture complete API response for debugging
**Steps**:
1. Add: `console.log(JSON.stringify(rawResponse, null, 2))`
2. Mark as TEMPORARY - remove after issue resolved

#### EXAMINE-STRUCTURE-ACTION
**Purpose**: Understand actual API response format
**Steps**:
1. Examine raw response data
2. Don't assume structure based on error presence

#### CHECK-PARTIAL-SUCCESS-ACTION
**Purpose**: Identify if API returned both data and errors
**Steps**:
1. Check for data presence despite errors
2. Log partial errors for monitoring
3. Only fail if truly no data present

#### DOCUMENT-FINDINGS-ACTION
**Purpose**: Record API behavior for future reference
**Steps**:
1. Update GraphQL-API-Reference.md or similar docs
2. Document partial error patterns

#### APPLY-NAMING-CONVENTION-ACTION
**Purpose**: Use consistent naming for temporary files
**Naming Patterns**:
- **Diagnostic Scripts**: `diag-NN-description.js` (NN = 01, 02, 03...)
- **Test Scripts**: `test-NN-description.js`
- **Output Files**: `output-NN-description.txt` or `.json`
**Steps**:
1. Use two-digit incrementing counter
2. Use descriptive filename
3. Follow pattern consistently

#### PRINT-FILENAME-IN-OUTPUT-ACTION
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
- **Ground rules debug log**: `SKILL-Development-Ground-Rules-Log.md` (project root)

### DOCUMENTATION-FILES-REF

- README.md
- CHANGELOG.md
- TODO.md
- LOG.md
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

