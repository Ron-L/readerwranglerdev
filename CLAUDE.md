# ReaderWrangler Development Rules

[YYYY-MM-DD HH:MM]

---

## Collaboration Mode

**Core principle:** STOP and ASK before acting.

- Every code change requires explicit approval
- Every git operation requires explicit approval
- When in doubt, ask first

---

## Behaviors

* **Response start** →  display `📋 [YYYY-MM-DD HH:MM:SS Local]` + separator
* **Discussion question** → STOP, answer, don't act until directed
* **Before code/file change** → Ask approval first
* **Problem report** → STOP, acknowledge, ask to analyze, wait for decision
* **Idea evaluation** → Evaluate critically, identify issues, disagree when warranted

---

## Versioning (Semver Pre-release)

Standard semver with pre-release suffix for test iterations:

| When | Example |
|------|---------|
| Start work | `4.22.0` → `4.23.0-alpha.1` |
| Each test | Increment: `-alpha.2`, `-alpha.3`, **COMMIT before test** |
| Release | Drop suffix: `4.23.0` |

**APP_VERSION** (readerwrangler.js): Updated at release for user-facing changes.

**ORGANIZER_VERSION** (readerwrangler.js): Update in the same commit as each alpha iteration.

---

## Release Checklist

- `git add` specific files only (never `-A` or `.`)
- `grep -rn "TODO" *.js *.html`
- Drop pre-release suffix from file versions
- Update APP_VERSION
- Update CHANGELOG.md
- Update TODO.md (remove completed tasks)
- After push: "Ready for post-mortem?"

---

## Git Workflow

**Remotes:** `dev` (testing) / `prod` (production) — no `origin`

**Feature branches:** For customer-facing work (not doc-only changes):
1. `git checkout -b feature/descriptive-name` from main
2. Develop with alpha versions, commit before each test
3. Push branch to dev for testing
4. When complete: merge to main, push to prod

Branch naming: `feature/tags`, `fix/filter-bug`, `refactor/modules`

| User says | Do |
|-----------|-----|
| "push" or "proceed" | `git push dev <current-branch>` |
| "push to prod" | Merge to main first, then `git push prod main` |
| "release" | Clarify which |

**Navigator changes**: Dev first → test → then Prod

---

## Compaction

When preparing for compaction, include in summary:

> COLLABORATION MODE - STOP and ASK before every action.
> After compaction: Read CLAUDE.md, report task in progress, wait for approval.

---

## Reference

**Folders:** `docs/api/`, `docs/design/`, `post-mortems/`

**No version increment:** README, CHANGELOG, TODO, *.md docs, .bat files
