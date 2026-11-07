# PRINCIPLES — the distilled laws of this project

_Every principle below was paid for. Sources: all 107 release post-mortems (2025-11-11 → 2026-09-04),
distilled 2026-09-04 so the archive never needs re-reading. The archive remains the depth; this is the law._

**The meta-principle that governs this file** (proven by the archive itself): *documenting a lesson does not
prevent its recurrence — only a mechanism does.* Version confusion was documented five times in the v3 era
and recurred ~11 more times anyway; one PM even records the lesson being read and **inverted** (a
"Mistakes Made" entry internalized as the correct pattern). So every Law below names its **enforcement**:
the rule, checklist item, memory file, or code pattern that makes it mechanical. A principle without an
enforcement is a wish.

**The newest and most literal mechanism (2026-09-17): the pre-build gate.** A `PreToolUse` hook
(`.claude/hooks/gate-check.py`) denies the *first* edit of shipped code (any root `.js` + the relay worker) each turn and
presents an 11-point checklist; a `Stop`/`SessionStart` hook re-arms it per turn. It exists because of a
sharper form of the meta-principle, paid for the same week it was written: **invoking a rule's name is not
running it.** A "new dialog checklist" added to CLAUDE.md was skipped the same session it was authored, and a
class-of-sites "comb" was performed *by eye* (missing a 5th broken overlay) while its name was invoked — the
mechanical two-pivot grep found what the impression missed. A written rule gets *performed*; a gate *fires*
whether it's remembered or not. The points (live source: the **GATE-CHECKLIST block** just below, which the hook now prints verbatim — edit it there and the gate auto-syncs): (1) extending a spaghetti
section → restructure; (2) adding state → represent *legal* states (FSM / cooperating FSMs / reducer), not
loose flags [Law 17]; (3) reinventing a React/DOM wheel?; (4) can the relationship live in a *structure*
(containment) not a hand-synced list?; (5) call the existing closer/accessor, don't hand-roll a partial;
(6) less code, not cleverer?; (7) class of sites → run `/sitemap` (two pivots, publish the table before
claiming coverage) [Law 5]; (8) grounded in the code, not a hazy memory? [Law 2]; (9) delivering less than
asked → name + FILE the gap; (10) build-grade or explore-quality?; (11) did Ron approve *this* change? [Law
1]. It is a trial (`.claude/settings.local.json`). The *structural* version for overlays — a self-registering
`<Dialog>`/`<Popover>` layer registry (**DIALOG-DISMISSAL-AUDIT.md**) — **SHIPPED in 7.18.0** and retired the
hand-run dialog checklist outright: nothing is left for a human to remember. (Gate gap found in the 7.18.0 PM:
it watched only `readerwrangler.js`/`mobile.js`, so an edit to another shipped module skipped it — WIDENED the
same day to a rule: any root `.js` + `relay/relay-worker.js`.)

<!-- The block below is the SINGLE SOURCE for .claude/hooks/gate-check.py. The hook prints everything
between the two checklist markers, verbatim, on the first app-source edit of a turn. Edit the checklist
HERE and the gate auto-syncs — no duplication to drift. If the hook cannot read this block (file moved,
markers removed, path broken) it prints a LOUD failure instead, so a broken reference announces itself
rather than silently degrading. Keep each marker on its own line. -->
<!-- GATE-CHECKLIST-START -->
[PRE-BUILD GATE] (not a real denial -- a once-per-turn checkpoint).
This is your first app-source edit this turn. Run the checklist; if the edit still
stands, RE-SEND EVERY app-code edit from this batch (all of them were refused) -- the next
batch proceeds.

STRUCTURE -- is this the right shape?
 1. Extending a spaghetti section? Adding another flag/branch/case to a pile of
    conditionals or a hand-written dispatch means the STRUCTURE is missing -- restructure,
    don't pile on.
 2. Adding state? Model the cluster's LEGAL states (FSM / cooperating FSMs / reducer) so
    illegal combinations are unrepresentable and each new state is enumerable -- not loose
    booleans that fail open the moment you add the next flag. [Law 17]
 3. Reinventing a wheel React/the DOM already turns? Reach for the component tree, context,
    event bubbling, refs, portals before hand-rolling registries/listeners/coordination.
 4. Can the relationship live in a STRUCTURE, not a procedure? Prefer containment (nest/chain
    so the tree carries parent<->child) over an external list/stack you sync by hand.
 5. Is there already a function/accessor for this? Call the encapsulated closer/accessor;
    don't hand-roll a partial copy (that is exactly how the Esc close-drift orphan happened).
    Don't scatter raw state access.
 6. Is the elegant version LESS code, not cleverer code? If you're adding machinery, ask
    whether the right move deletes machinery instead.

COMPLETENESS -- did you get all of it?
 7. Changing a class of sites? (the same edit in 2+ places, or a task worded
    all/every/everywhere/always) -> run /sitemap: two independent pivots, diff them, post the
    file:line table BEFORE claiming coverage. Then ask whether the N sites collapse to one
    chokepoint. [Law 5]

HONESTY -- are you being straight about it?
 8. NEVER ASSUME -- verified in the actual source, or leaning on a fragment of memory/context?
    A belief you have not checked (a compaction fragment, "just cosmetic", "redundant", "should be
    fine", "safe to remove", "I'm sure") is NOT a fact. Re-read the source / grep the consumers /
    run the probe, or ask Ron -- don't reconstruct from recall. Over-confirm: that cost is always
    smaller than a mistake built on incomplete memory. (Your assumptions, docs, vendor semantics
    all count. 7.15.0: "just cosmetic" dropped a CSS class a live handler depended on.) [Law 2]
 9. Quietly delivering less than the words asked? Name the gap and FILE the remainder in the
    same breath -- never silent scope narrowing.
10. Build-grade, or explore-quality you shouldn't ship? Say which phase you're in.
11. Did Ron approve THIS specific change? Discussion is not approval. [Law 1]

DEBUGGING -- are you chasing it in the right place?
12. Fixing a reported bug and this is the 3rd+ change chasing the SAME symptom -- or the 2nd RELATED thing you've
    found broken (two answers to one question that disagree)? STOP -- question the abstraction: a missing structure
    (one table / one function), not two bugs. Otherwise: is the bug even IN the layer you keep patching? Re-derive from a different angle -- go
    to the TRUE source (the raw event/state/inputs, not a value handed downstream); try a second pivot.
    Tell: a logged value that stays CONSTANT while the input varies means you're measuring downstream.
    (Earned 7.18.0: 5 alphas "fixing" CursorPopup while the bug was a hardcoded pre-clamp in the trigger
    -- the click x never changed as Ron clicked different spots, and that tell sat in every debug dump. 2026-11-06:
    four disagreeing "where can books be pasted?" lists.) [Laws 3, 4]

STALENESS -- is the plan still right?
13. Building from a TODO or design decision? Check its date against PRINCIPLES: does a law written since
    then apply? Re-read the decision through it first (2026-10-21: a Book List move block, a filter notice
    and a hidden menu item all predated Laws 16/18 and fell to them in review). [Laws 2, 18]
<!-- GATE-CHECKLIST-END -->

**Era note (Ron, 2026-09-04)**: some recurrence counts below are partly artifacts of earlier AI model
generations, not process gaps — early models fought the versioning rules, couldn't reliably evaluate the
old trigger-based rule system (abandoned for that reason), and drifted from instructions in ways current
models (Fable 5 era) simply don't. The enforcement mechanisms remain valuable — but "execution failures
against adequate rules" largely healed with better models, which was outside our control and happily
happened. Read the pre-2026-08 war stories with that lens; keep the mechanisms anyway.

---

## THE LAWS

### 1. STOP and ASK — discussion is not approval; wait for the answer
The single most-repeated collaboration failure (10+ recurrences, including "You went off the reservation"
and three violations in one release). Questions asked without waiting are monologue. After any confusion or
correction: state the conclusion, then WAIT — the 10-second pause prevents the 10-minute fix.
Two amendments (Ron, 2026-09-04): **if in doubt of the user's intention, ask and clarify** — a wrong guess
executed is worse than a question; and **honest pushback is always welcome** — a standing invitation, not a
risk. The record backs both: every pushback that shipped (title-tiebreak veto, backwards-controls catch,
auto-mode-switch rejection) improved the product.
**Enforcement**: CLAUDE.md Collaboration Mode; `feedback_wait_for_answer` memory; "discussion mode" protocol
with explicit enter/exit.

### 2. NEVER ASSUME — verify it or ask; a belief you haven't checked is not a fact (Ron: "the biggest rule")
The most-recurrent technical failure (12+ PMs): asserting from a hazy model instead of reading. A hazy
mental model — or a fragment of a compaction summary — is the *signal* to re-read, not license to guess.
Page-vs-API claims require a captured request. Sub-agent output is intermediate, not settled. The
costliest case: an entire durability argument built on confusing RW-Wishlist with the Amazon wishlist —
corrected twice before "go read the code." **The tell that catches an assumption in flight — the words
_just / only / redundant / cosmetic / should be / safe to / probably / I'm sure / I think_** — each marks
a belief about to be acted on unchecked; stop and verify before the next keystroke (7.15.0: "*just*
cosmetic" dropped a CSS class a live handler matched on — the assuming, not the class, made the mistake).
The assumption can be about a **solution**, not just a fact: "this mechanism prevents X" is a claim to
verify before selling it — check the mechanism actually *enforces* what you promise (7.15.3: "field-name
constants everywhere" was pitched as killing the name-mismatch class, but plain-JS constants return
`undefined` on a typo, enforcing nothing — a runtime validator was the real tool). **Read the path that
actually runs**, not the one that looks right: 7.21.3's fetcher had a strict Kindle check on its *backup* path
and a computed-but-unused one on its main path ("we'll check later" — nothing did), so "Kindle-only is built
in" was false and paperbacks got in. A comment promising later work is not code. **A plan written days ago is an assumption at execution
time** (7.22.0): "resolve the doc conflicts in main's favor" would have dropped the branch's own CLAUDE.md
rule — re-check each step against the files as they are now, not as they were when the plan was written.
(7.23.0: the plan's "CHANGELOG: backend only" was false by release — `relay-client.js` is app code and its rule changed.)
**Ron's standing trade (2026-09-21): OVER-confirm — spend the tokens and the time; that cost is always
smaller than a mistake built on incomplete memory or an assumption. He would rather wait.**
**Enforcement**: `feedback_verify_dont_assume` + `feedback_wait_for_answer` memory; the pre-build gate's
item 8; the NEVER-ASSUME rule atop `../CLAUDE.md` (loaded every turn); cheap read-only probes as the
default first move.

### 3. Instrument → prove the theory → fix → prove the fix (Ron's doctrine)
Fix-then-test just *moves* the problem; testing only the old symptom lets it go. Prove where the time/bug
actually is before touching code, and let the same instrumentation certify the fix. Twin failure mode:
**confidence before evidence** — never present a theory as a verdict; present it with the probe that would
falsify it. (v5.5.4 spent ~10 alphas optimizing React renders; the diagnostic showed 2 renders in a
44-second drag — it was browser paint.)
**7.16.0 reprise (Ron re-drove it):** shipping a *fix* before *reproducing* the bug leaves you with no
known-good test case — you cannot certify the fix. The collectionTags-wipe fix went out on code-reading
alone; Ron: *"It is ALWAYS worth verifying a bug before fixing so we KNOW we have a good test case."*
Thereafter every fix ran **repro → fix → verify** with console probes against the real IndexedDB — and
that discipline caught the `genresAsOf` slip before it could ship.
**7.18.0 reprise (the deepest cut):** instrumentation only tells the truth if it measures the SOURCE.
Chasing a right-click-menu gap, I logged the coordinate the *component received* — but the trigger had
already clamped it — so the probe "confirmed" the innocent layer for **five alphas**. Instrument the raw
event/state, NOT a value handed downstream. And the tell that would have ended it on day one: **a logged
input that stays CONSTANT while the real input varies means you're measuring downstream — go upstream.**
(The click `x` read `1186` in every dump while Ron clicked all over the right edge.)
**7.22.0 reprise — the test suite must include the case the fix exists for.** The gate's batch-by-message fix
was simulated in six cases (same batch, other batch, timer both ways…) and all passed — but none was "a
re-send", the very case the fix was for. A re-send is the FIRST call of a new message, which the probe had
already shown isn't in the transcript yet; the fix refused it on its first real use. List the motivating
scenario as test case #1 before writing any others.
**A test that fails because the protection works is not a bug to silence — read it first** (7.25.0: after signed
writes, the relay test "failed" 7 times; its deliberately broken states were unsigned writes on a now-registered
channel — the fix was to sign the test's raw writes through the one signer, not to loosen the relay). And a test
must be able to fail: sign with independent code, accept a hand-made correct case, keep a control beside the refusal.
**Reproduce a reported problem with real input before explaining it** (from the utilities project, its Law 18 —
carried over 2026-11-04). Ron's screen is the fact; a reading of the code is a theory. Drive the page with real mouse
and keyboard input, read the state after each step, then report. (Paid for there: two wrong explanations of an Esc /
Ctrl+click report, each with fixes proposed, before the first real-input run.) In RW the reproduction becomes the
fix's first test: **a bug fix starts with a failing test** (docs/design/TESTING.md §6).
**Enforcement**: `feedback_debugging` Rule 1b; two-rounds-of-theory stop rule; pre-build gate item 12; the browser
driver (`test/ui/rw.py` — real input through Edge) and the regression library's routine (TESTING.md).

### 4. After 3 iterations, or the 2nd related break, question the abstraction
**Two related things broken together are one missing structure** (a rule written in several places), not two bugs:
stop patching, name the structure, build it once (Ron, 2026-11-06 — the same spell as the 3-iteration rule, counted
across sites instead of over time). Paid for the same day: Ctrl+V refused a paste into the Inbox while the right-click
menu's Paste allowed it, and "where can books be pasted?" was answered by four lists that disagreed — the cure is ONE
table (gesture → verb; verb × what's moved × from × to → outcome) read by one function every gesture calls (TODO "Move
and copy books anywhere", with Delete), not a fifth list.
Proposed 2025-11-11; ignored through 26 alphas (v3.14.0 drag-drop) and 9 alphas (v6.11.2 — where one
question, "why aren't these just items?", replaced all nine). If each fix adds a special case instead of
removing one, the design is wrong: stop, list the edge cases, ask "are these actually different things?",
propose Plan Mode. 15 minutes of design beats 3 hours of patches, every measured time. **7.18.0: five
alphas "fixing" CursorPopup for a menu-position gap while the bug was a hardcoded pre-clamp in the
*trigger* — I never asked whether the component I kept patching was even the right layer.** The wider
question ("is the bug here at all?") is the net; provenance-of-the-input is one thing it catches.
**Enforcement**: `feedback_debugging` Rule 2; **pre-build gate item 12** (fires on every app-source edit —
the wide net, because passive memory did NOT fire during those five alphas).

### 5. Enumerate ALL instances of a class — including copies, setters, and siblings
Fixing only the reported instance is the default failure ("Claude doesn't naturally do this" — v3, 2025;
still true in v7 until made mechanical). The class includes: sibling fetchers (the same user-gesture bug
fixed in 5 files across 4 releases), all registrations of a listener (a second keydown handler hid for 16
alphas), every modal close path, every render path, `foo` AND `setFoo`, and **inline duplicates of a
structure you extend** (the alpha.13 crash lived in a copy of `enterEditMode`). **And the remote
consumers of an element's markup**: when you change a DOM element's class / attributes / structure,
grep for what *else* keys on it — `.closest('.x')`, `querySelector`, class/attr hooks — because a
markup change can silently break a handler elsewhere in the file. 7.15.0: a menu refactor moved
`position:fixed` from the `fixed` CSS **class** to an inline style and dropped the class; the
close-on-outside handler matched `e.target.closest('.fixed')`, so every menu item's click died on
mousedown — **no console error, 6 alphas to find.** A class/attribute an element wears may be
load-bearing for code that never appears in the diff. **The opposite failure — a blanket replace — judges no
instance at all** (7.24.0: `s/7.22.1/7.24.0/` was right for 28 code comments but also rewrote the design doc's
history to claim alphas "7.24.0-alpha.1–3" that never existed; caught on review). Enumerate first, then decide each.
A blanket *stop* is the same failure: 7.25.0 stopped a local test server by matching process command lines and took
14 processes — the shells that launched it and the stop command itself. **Act on exact identities (a process id, a
path), never on a pattern.** **And a secret is a class too — find it by its shape, not a list:** a demo library made
from a backup carried a full Cloud Sync credential pair publicly for four months (2026-07-03 → 10-31); no list of
known values could have caught it — a check for "a .json whose `relay` holds a channel id and a passphrase" does
(`git-hooks/private_values.py`, every commit; the history scan found only that file).
**Enforcement**: `feedback_investigate_completely` memory; grep-the-class before declaring done —
for a markup change, grep the class/attr name across the file for remote matchers *before* editing.

### 6. Commit before every test; one concern per alpha; build markers on every surface
What keeps 25-alpha runs bisectable and revertible, and what makes "which build am I running?" answerable
(invisible changes + no build marker = guaranteed mystery). Alphas are tested locally or on dev — never
against prod (APP_VERSION doesn't bump during alphas, so prod serves stale JS no matter how hard you reload).
**Switching branches changes what localhost serves** (7.24.0: Ron's "silent read → Read" was the 7.23.0 relay branch,
which predates the capitals prompt — Claude had switched branches for the relay work). After any branch switch, say
which build localhost now serves; on a surprising result, check the build marker first.
**A "quick" task gets a scope checkpoint at its second alpha**: ship what works and file the rest? (7.24.0: a TODO-review
"quickie" grew to 3 alphas and a 10-topic round over 3 days before Ron asked; v2 had been shippable since alpha.3.)
**Enforcement**: CLAUDE.md versioning workflow; `feedback_alpha_testing` memory.

### 7. Version discipline: file version ≠ app version; bump the number, then suffix
The most-repeated single mistake in project history (documented 5×, recurred ~11× more before becoming
mechanical). Feature = minor, fix = patch; bump first, then `-alpha.N`; drop the suffix at release without
re-incrementing; every runtime change gets a bump ("we HOPE it acts the same but can never be sure");
cache-busters (`storage.js?v=`, CSS) update in the same commit as the file (one sat at 5.0.0 while the app
shipped 5.4.7 — a full investigation chased code the browser never loaded).
**Enforcement**: CLAUDE.md versioning table + release checklist.

### 8. Real data, real scale, real hands — one minute of real use beats a day of review
Single-item testing validates the implementation; multi-item real data validates the design (five series
sorts looked perfect until Larry Bond). Ron's first minute with a feature has caught something in nearly
every release; ship rough for feel-testing rather than polishing a private model. Corollaries: test where
the *behavior* lives (touch tooltips on a phone, Ctrl+Drag on Windows, ask-where-to-save on AND off), and
know the **dev-machine blind spots** — paths whose correct local behavior is "never runs" are untested by
construction; say so before shipping. **A list built from the user's data has the user's range** — "only the years
your library has" ran back to 2001 on Ron's library (7.21.2): size every data-driven list for the biggest real library,
not the test one.
**Test what a person reaches by going there the way they would** (from the utilities project, its Law 21 — carried over
2026-11-04). Move the real pointer along their path, check what is actually under it (`document.elementFromPoint`) and
that it has a size. Reading an attribute proves a thing exists, not that anyone can get to it. (Paid for there: a
tooltip passed a test that read its `title`, but leaving the chart switched the panel away before anyone could see it.)
**Enforcement**: the alpha cadence itself; test instructions with precise expected values — magnitude AND
shape (`feedback_debugging` Rule 4); the driver's `hover()` / `click_reachable()` (`test/ui/rw.py`) move the real pointer
and refuse a covered target (naming what covers it) or one with no size.

### 9. Guarded persistence — every irreplaceable datum gets a load-gated writer
An unguarded save-effect stamps defaults over saved data on mount; a restore gated on the wrong condition
falls back to a stale second store. This class ate 24 Book Lists (cold-boot race), scrambled folder order
for weeks (field-stripping cache write), and hid behind an audit note that said "it's a trap… OK for now"
— **a trap rated OK-for-now is a latent incident.** The cures: single guarded source of truth, writers
gated on load-complete, guest guards on read-mostly instances, atomic generational commits for multi-key
writes, and loud (never silent) save failures.
**Enforcement**: F1 consolidation shipped; the pattern is now the codebase's standing shape.

### 10. Any field that enters export travels everywhere — "app-side-only" data isn't
Backups carry it, restores push it to the relay, imports bring it home again. A migration that clears a
value **must** pair with an inbound filter while any source of truth still carries it, or the value
resurrects on every import (the 'Kindle eBook' token did exactly this, silently zeroing a backfill).
A **user's deliberate clear is the same shape as a migration's clear**: a cleared field is `null`, and
`incoming ?? local` reads `null` as "absent — use incoming", so the stale value comes back. Fields the
user owns and the fetcher never sets must be **local-wins**, not `??` (7.14.4: cleared goals/ratings/tags/
notes resurrected on import for exactly this reason). Declare each field's ownership in **one registry**
(now `bookFields.js` `BOOK_FIELDS`, the `merge` column) and drive the merge from it — a field can't be
missed and its behavior lives in one place.
**Corollary — a merge must never invent a field name.** The same file preserved a phantom `note` (real
field `userNote`) and once a phantom `hidden` (`isHidden`): the wrong name is silently created, the real
one silently dropped, and JS never complains. The mechanism is a test invariant: **the merge output may
not contain a key absent from both inputs** (that is exactly what a phantom target name looks like),
paired with a per-user-field clear-survives round-trip. Both would have caught both phantoms on sight.
A once-proposed "field-name **constants** everywhere" cure was **REJECTED** (7.15.3): in plain JS a typo'd
constant access returns `undefined` *silently* — the very failure it was meant to prevent — so it's
large-scope + real-risk with no compile-time safety. The tool instead is a **runtime field-schema
validator**: `KNOWN_BOOK_FIELDS` + `unknownBookFields()` flag any book key outside the known set
(dev-gated: `console.warn` + a localhost popup), generalizing the no-invented-keys invariant from the
merge to whole loaded books.
**7.16.0 — the drift was structural, so the cure is too.** The lesson generalized from the merge to the
WIRE: two *duplicate serializers* (`exportBackup` vs `buildDeviceStatePayload`) had drifted 8 fields
apart, and the packer wrote fields the unpacker ignored (and vice-versa) — Save/Restore silently dropped
both classes. Fix: ONE `WIRE_FIELDS` list drives ONE `packBook` + ONE `unpackBook` (`serialization.js`),
plus a **build-time cross-check** asserting the wire list and `KNOWN_BOOK_FIELDS` agree BOTH directions
(turning the runtime validator's catch into a gate) and a localhost self-check that round-trips the real
library. (And: a stale code *comment* — "shared with exportBackup" — is not a fact; that comment
sent the first fix to the wrong serializer. Law 2.)
**7.17.0 — the endgame shipped.** `BOOK_FIELD_OWNERSHIP` + `WIRE_FIELDS` are now ONE per-field table
(`bookFields.js` `BOOK_FIELDS`): one row per field, columns for BOTH merge class and wire mapping, so a
field can't live in one and not the other — drift is *unrepresentable*, the strongest form of this law
(structure over discipline, applied to the thing itself, not just tested for). `serialization.js` retired
into `bookFields.js`; mobile's hand-kept `mapBackupBook` folded onto the shared
`unpackBook(item, {safeDefaults})`, so desktop AND phone deserialize through the ONE table (two mappers →
one). The build-time cross-check became `schemaSelfCheck()` — a pure function run in the Node gate AND the
localhost in-app self-check. See BOOK-FIELDS-TABLE.md.
**Enforcement**: FORMAT-POLICY.md; the migration+filter pair as the standard shape; `bookFields.js`
`BOOK_FIELDS` (the one table) + `test/bookFields.test.js` (one packer/unpacker, round-trip, `schemaSelfCheck`
structural gate, mobile-safeDefaults) + `test/bookMerge.test.js` (no-invented-keys / clear-survives /
merge-completeness gates + `KNOWN_BOOK_FIELDS` / `unknownBookFields` validator).

### 11. Design-doc-first for anything architectural — then check yourself against it
The single most consistent predictor of smooth execution across all eras (11+ PMs; the four cleanest
releases in the archive were plan-mode-with-line-numbers). Writing the doc *before* code exposed real holes
in already-agreed designs, twice. For risky designs: epistemic tags (`[verified in code]` / `[assumption]`)
plus an adversarial cold review — 7.0.0's review found two correctness-critical flaws on paper. Record
**rejected** options with reasons (re-litigation cost thereafter: zero — see MULTI-INSTANCE, FORMAT-POLICY).
**Enforcement**: the design-doc culture in docs/design/; never-relitigate docs for settled facts.

### 12. Mechanical honesty — every display, ritual, and receipt needs a mechanism that can actually know
"Saved" must mean saved (picker before toast), "newer" must mean a different generation (not a timestamp
race), a commit message must describe what's in the commit (one claimed 8 edits and contained none), and
timestamps come from the tool, never extrapolation — a fabricated header drifted 4½ hours and corrupted an
analysis. When a compliance ritual gets easy to fake, that's the moment it's about to matter. **Tie related events
by an identity, not a time window** — the gate's "same batch = within 5 s" refused a fast re-send on its first real
use (7.21.2); the batch's shared message id is what actually knows. **Write a result after it happens,
not before** (7.22.0: "redeployed to both relays" went into the TODO ahead of the deploys — caught pre-push).
**A stamp nothing checks is a promise, not a mechanism** (7.23.0: the help notes' "up to date through 7.21.2" sat
while 7.21.3 and 7.22.0 shipped — 7.21.3's Bibliography change had no entry for four days; visible, and unread).
**An alarm that fires on the normal path is noise** — it must be able to tell normal from broken (7.25.0: every
import with new books logs an integrity "repair", because the check runs before the import files them; a genuine
orphan would hide among them. Ron caught it; filed).
**Enforcement**: `feedback_mechanical_honesty` memory; the heredoc ban (three-for-three earned a ban, not a
caution); receipts-and-honesty as a feature genre.

### 13. Post-compaction (or post-gap) state is fragments plus assumptions — re-read, never remember
The "Runaway Robot" law: after compaction, rules must be re-read with the Read tool (a claimed reading was
once caught with a line-count quiz), permissions do not carry over, and design details do not survive
summarization (a dialog was once built entirely wrong from a summary — "You did not get the plan": ask for
the design again instead). **A summary keeps the decisions but loses the argument** (2026-10-19): the first reply
after a mid-discussion compaction recorded Ron's new idea, gave no opinion and committed unasked — the pushback it
skipped was the valuable part; and an instruction said only aloud ("fix the 2 tag things in this task") drifted.
**Enforcement**: CLAUDE.md compaction protocol (since 2026-10-19 it carries the DISCUSSION IN FLIGHT: each open topic,
my position, Ron's pushback); a release's **build list at the top of its design doc** — a topic closes only when its
line is written (`feedback_build_list_in_design_doc`); persistent files (CLAUDE.md, design docs, memory) as the
only state that survives.

### 14. Look backward before inventing forward; investigate before estimating
"What did we do before?" precedes "what should we do next?" — the archive's oldest law. `git show` is a
design tool; the feature estimated at 4-6 hours took 15 minutes because 5 of its 8 capabilities already
existed. Simplicity wins; don't over-engineer rare operations; "leave it as-is" is a valid design decision.
**Enforcement**: habit + this file. (The unfixed cousin: optimistic scope framing — "minor" keeps becoming
"major." Budget accordingly.)

### 15. Chase every alarming number until it has a name
Deferred mysteries return as unreproducible field issues at ten times the price (Ron's doctrine). The
13-orphans day is the proof: three convincing wrong answers survived until every number was named —
wishlist, sample-pair, husk, echo, token — "and once everything had a name, there was nothing left to
fear." Beware the **numerology trap**: unrelated sets of similar size masquerade as each other; name all of
them in one table. Never bare "not worth chasing" — chase it or log it with the evidence for a scheduled chase.
**Enforcement**: `feedback_debugging` Rule 1c; telemetry tripwires instead of speculation (the
`newOwnershipType` instrument paid off twice with zero user friction).

### 16. Perceivable at the point of effect — absence, position, and silence are not communication channels
(2026-09-07→09, the invisible-control purge — ten instances in one cycle, see the v7.8.0-7.9.0 PM's table.)
A control styled as a display, a keystroke consumed silently, a stored rule firing invisibly, meaning encoded
in a caption's ABSENCE, a capped list wearing a scrollbar, primary nav that hides until scrolled — each one
survived until the sole user (who BUILT several of them) failed to perceive them within minutes of real use.
State changes must be visible where they happen; every offered action must visibly act or visibly explain;
hidden standing rules need a surface where they can be seen and revoked, or they don't ship (the alias
rejection, the Reset-flag rejection). **Position is part of how a menu is read** (Ron, 2026-10-21: "Often I go by
position almost as much as the word"): an item that can apply to this kind of object stays in its place, **disabled**
with a tooltip saying why when it doesn't apply right now; only an item that can never apply to that kind of object is
left out. Items that come and go shift everything below them and misdirect the click.
**Enforcement**: the design question at review time — "does the control announce itself where the need
arises, and does its effect show where the eye already is?" Ron's field test catches these today; at launch
that instrument is gone and only this question remains.

### 17. Represent legal states, not loose flags — make illegal states unrepresentable (Ron's doctrine)
N independent booleans for one feature permit 2ⁿ combinations, including the nonsensical ones — the
Auto-Organize orphan was exactly an illegal combo a flag allowed ("preview closed, child popup still open").
Two failure modes compound: a *new* flag must be threaded into every existing decision point or it **fails
open** (the one branch you forget is a silent bug), whereas an FSM's states are **enumerable**, so a new
state is a thing you're forced to consider. Related-but-*independent* dimensions aren't an excuse for flags:
model them as one FSM over the reachable combinations (`None, A, AB, B`) or as **cooperating / orthogonal
FSMs** that coordinate by event — both make illegal states unrepresentable without a 2ⁿ transition table. The
tell that the structure is missing: a close/reset function that hand-clears 3+ related states (and the day
one path clears a subset, you have an orphan). Pairs with the containment law — push the relationship into a
structure so the procedure shrinks to nothing.
**Enforcement**: pre-build gate checklist item 2; the overlay-registry design (DIALOG-DISMISSAL-AUDIT.md) as
the worked example; `project_714_release` memory.

### 18. THE PRIME DIRECTIVE: don't block the user — honor the intent behind the gesture (Ron's doctrine)
_Alias by Ron, 2026-10-21. Fitting: Starfleet's Prime Directive is non-interference — here, the app doesn't
interfere with what the user is clearly trying to do._
When a user's gesture is clear, do it; don't refuse it because the app's *internal* model is different from theirs.
"Not all users will share the same mental model, nor use RW the same way… there is no wrong way" (Ron, 2026-10-21) —
an icon is an icon, and moving it across the folder / Book List boundary is a move. Three corollaries: (1) **a past
incident is rarely evidence for a block** — the 2026-08-08 "move" that left a book in three places was a *half-done*
move; the cure is complete moves (out of the source, into the destination, once, one undo), not forbidding the
gesture; (2) **a prompt that stops the gesture is a block in a polite coat** — when the result needs a fix-up, apply
the app's existing rule and say so (a book cut out of its last folder goes to the Inbox, and the receipt says it),
and let Undo be the escape hatch; (3) **a block teaches people to stop trying, and the lesson outlives the fix** —
Ron kept avoiding "Delete from All Books" long after 7.11.0 made it work; (4) **explicit verbs do what they say; a
guess picks the safe option** — when one gesture can mean two things (a plain drag between a folder and a Book List:
move or copy?), default to the one that loses nothing, offer the other one key away (Shift = move, Ctrl = copy —
File Explorer's convention), and label the drag live ("Copy to 'Sci-Fi' — hold Shift to move") so the default is a
visible choice. Allowing everything isn't the same as guessing aggressively: a 300-book folder emptied by a plain drag
would SURPRISE (Ron, 2026-10-21). Pairs with Law 16 (perceivable at the point of effect): allow it, and make what
happened visible.
**Enforcement**: `feedback_dont_block_the_user` memory; the TODO "Move and copy books anywhere" (reverses the
2026-08 "block Book List moves" decision) as the worked example.

### 19. When the screen looks wrong, make the boxes visible before theorizing (Ron's idea)
Outline every box at the broken spot, each layer in its own color, and ask the page what is actually on top there
(`document.elementFromPoint`). **Outline, not border:** a border takes space and moves the very edges you're looking
at. One picture shows which box runs under which; a theory about styling can't. (Paid for 2026-11-06: a scrollbar
"thin at 125% zoom, invisible at 150%" was first blamed on a `thin` scrollbar style that turned out to be used
nowhere. The cause: the status bar floated over the window's bottom edge, the panes left a fixed 24 px for it, and
with Cloud Sync on, its 24 px icon made the bar 33 px tall, so it covered the panes' bottom 9 px, where the scrollbar
is. Measuring the layers showed it at once. Fixed in 7.25.1 by making the bar a row of the layout.) Corollary: **a
fixed gap that guesses another element's size is a bug waiting for that element to change**. Let the layout carry the
relationship (Law 17's spirit: structure, not a hand-kept number).
**Enforcement**: the driver's `show_boxes()` (test/ui/rw.py) outlines a target and every box around it, labels
where each ends, and saves the picture; a failing layout test attaches it (`test/ui/test_layout.py`, LAYOUT-001–007:
nothing covers a scroll area or its scrollbar, at two zooms, with the status bar as it is and as tall as the Cloud
Sync icon makes it). The driver shows scrollbars: Playwright hides them in a hidden browser by default, which hid
this very bug.

---

## SECOND TIER — by theme (the best of the rest)

**Debugging**
- Log the raw response before theorizing; GraphQL returns data AND errors together — only fail when there's
  truly no data. Scary vendor errors are often benign.
- Trust an unexpected test result over the mental model, immediately ("no console output" once broke the
  wrong model — the refactored handlers were dead fallbacks; `feedback_verify_live_handler`).
- Compare working vs non-working sibling paths; trace data across every transformation boundary (field-name
  mismatches fail silently — `acquisitionDate` vs `acquired` once blanked a whole filter).
- Some "bugs" are expectations (cockpit error); verify intended behavior before declaring a defect.

**Architecture**
- **Fence on identity, not on a count.** A "since this point" marker must be a monotonic id (a sequence number),
  never a collection's length — lengths stop growing at a cap and shrink when entries are pruned. 7.19.0: the
  in-window undo fence compared undo-stack lengths, so at the 50-step cap (shift + push) or after a permanent delete
  pruned history, actions taken inside a window became un-undoable there. Found by reading, latent since 7.8/7.10.
- **A design's "reachable via Y" must point at a Y that exists.** ORPHAN-CLEANUP §5 said kept books were findable
  "via the normal filters" — none existed; the gap surfaced only when Ron asked "how do I see all Kept books?"
- Extract logic into a pure, node-tested engine before wiring UI — but remember engine tests validate LOGIC,
  not INTEGRATION (8/8 green while undo was broken).
- References not copies for multi-membership; signals in the data (`userEdited`) beat out-of-band params;
  single source of truth for config (parallel label maps rot); sentinels beat booleans for "unset vs cleared."
- Every `{entityId: value}` map needs a paired cleanup on entity delete.
- **Order is not ownership.** A structure that INFERS a relationship from position (a stack where "above" means
  "child", so removing a layer closes everything above it) breaks silently when a new kind of member joins. Let
  the member state the relationship. 7.18.0-alpha.68→69: confirm boxes joined the overlay stack, a menu item
  opened one above the still-open menu, and the menu's unmount cascade-closed it before it painted (no console
  output). Fix: `detached` — an independent overlay is nobody's child. Test the new member's REAL lifecycle
  (push-before-parent-unmount), not just the structure's rules.
- **Policy as a pure function.** Rules that accumulate one at a time (7.18.0's seven outside-click rules) belong
  in one pure, Node-tested decision function, not branches inside an event handler — each later rule change is
  then a one-line, test-first edit (`overlayRegistry.outsideClickAction`).
- React: never read a ref inside a state updater (the deferred-updater trap — cost two releases); hooks
  above conditionals (Babel can't catch #310); refs + direct DOM for 60fps work; global key handlers need
  escape hatches (input focus, modal open) — and there may be TWO of them.

**Release engineering**
- **A comb over PROSE needs a pivot per separator and format.** 7.20.0's menu-path comb: "File → X", then every
  arrow style (→ > › `&rsaquo;` `&rarr;`), then bold-wrapped paths (`File → **X**`) — each pivot found hits the
  previous missed. Law 5's two pivots are a floor, not a ceiling, when the class is human-written text.
- **Move markup with a boundary-asserting script, not by hand.** Assert the exact text at every boundary line, then
  splice ranges bottom-up; a shifted file fails loudly instead of corrupting JSX (7.20.0: two big menu moves,
  parse-clean first time).
- **Every step of a test plan has side effects — verify each step's WRITES before handing it over.** 7.19.0's plan
  said "restore the clean backup before the real import"; a Restore sends a relay *reset* run, which supersedes every
  older run — it would have erased the one-shot test data. Caught by re-checking relay semantics first. Console fakes
  likewise: save then `location.reload()` at once (the app's in-memory copy overwrites IndexedDB in any gap).
- **Test steps name the real control and say why.** "Use your dev bookmarklet" (meaning "one that sends to the dev
  relay") read as "the DEV one" and implied a fetcher change that didn't exist; Ron's default is localhost + the
  LOCAL bookmarklet (`user_test_setup` memory).
- Divergence pre-flight (`git log branch..main`) before drafting merge steps — prod accumulates hotfixes;
  `--ff-only` fails loudly; **never force-push**.
- Small independent branches; a git worktree when a second branch must not disturb the serving tree.
- `git add` specific files only (the `-A` rule was earned three times); `git status` before the release commit.
- **"Push to prod" always pushes dev too** (`git push prod main --tags` then `git push dev main --tags`; Ron,
  2026-10-08) — keeps the two lineages matched (the 7.17.0 divergence cost a reconcile).
- **Claims about a shipped version are checked against its tag** — `git show vX.Y.Z:file` — not memory and not a
  revert. 7.18.0's CHANGELOG "stacked windows no longer darken twice" was proven in two greps of `v7.17.1`.
- **A syntax check can't see an undefined name.** 7.18.0-alpha.55 crashed on `shareBtnRef is not defined` (a
  line break swallowed by an edit joined the declaration into a comment; it parsed fine). Enforcement:
  `git-hooks/check-names.js` in the pre-commit hook — Babel scope analysis refuses any name nothing defines.
- **A pre-build-gate bounce hidden in a parallel batch ships a half-fix** (7.18.0-alpha.62: the CSS rule landed,
  the class it targets didn't). Discipline for now (`feedback_gate_bounce_batches`: first app edit ALONE; grep
  every intended change before committing) — a mechanism is still owed (Principle-to-hook audit TODO).
- Big-bang refactors leak features for weeks (v5.0.0: 175 alphas, then 8 hotfixes in 48 hours) — the
  **feature-parity checklist** it needed was recommended four times and never built; build one next time.

**UX & copy**
- UX-hat analysis before implementing — consistently better outcomes across ~10 PMs; the user's workflow
  beats the assistant's consistency instinct; the user is often the better designer (3-state toggle, HTML
  tables, sliding windows all theirs).
- Convert symptom-lists into invariants with the user; invariant specs implement in one pass.
- Symbols make promises the clicks must keep; visual feedback IS the feature; error copy states the
  constraint, the why, and the alternative; behavior over category ("you can't move books out of here — use
  folders"); name the actor; positive framing; an ellipsis promises a dialog.
- Handle gracefully, don't forbid (flexible tool = escape hatches, not guards). Match platform mental
  models (Trash, File Explorer). Labels on environments — indistinguishable instances invite
  cross-environment mistakes.

**Platform facts worth their scars** (details live in the referenced docs)
- Amazon API: `getProducts` max 30 ASINs; only the plural endpoint works; partial errors are normal; the
  full library-API map (records vs titles, NOT-hash filters, pagination exonerated, 2801=2801) lives in
  **FORMAT-POLICY.md**; author-string parsing is a settled NO.
- Cloudflare KV: per-value atomicity only; ~60s list lag; ~1 write/sec/key; quotas are account-wide;
  permanent keys compound (the 678 MB lesson) — sweep orphans.
- Browser: drag events lie about modifier keys on Windows; `title` doesn't render on touch; `aria-label`
  overrides visible text; user gestures expire during long async work (`showSaveFilePicker` first);
  localStorage beats useState defaults; IndexedDB is domain-isolated; null in persisted state becomes
  `"nullpx"`; **suppressing the native context menu via `preventDefault` is intermittently NOT honored**
  (7.15.2: a left-pane container `preventDefault` had no reliable effect, and the native menu leaked even
  on elements with working custom menus — browser-level, not a handler-coverage gap; accept it, don't
  chase). Status icons (v3.5 PNG era): swapping an `<img>` `src` to change an icon caused a
  30-60s load lag, and a React `key` prop blanked it during mount — the fix was pre-load ALL icon
  variants and toggle CSS `display`, never touch `src` (salvaged 2026-09-18 from the retired
  `readerwrangler-project` skill; verify whether it still bites the current SVG icons before relying
  on it).

---

## THE GRAVEYARD — good ideas the archive proposed and nobody adopted (until now)

| Proposal | Proposed | Fate |
|---|---|---|
| PATTERNS.md / pattern library | v3.3.2 (2025-11-11) | **This file**, ten months later |
| Complexity budget (>3 iterations → review) | v3.3.2 (2025-11-11) | `feedback_debugging` Rule 2 (2026-08-30) |
| Feature-parity checklist for big refactors | v5.0.x (4 recommendations) | Still unbuilt — required for the next big-bang |
| Field-mapping reference doc | v3.8.0 (2025-12-20) | Superseded 2026-09-04: the test gate's import-mapping snapshot suite IS the field map, enforced |
| Automated test suite | v4.16.0, v5.0.0 | Deliberately deferred → **pre-launch test gate** (data paths only; PRELAUNCH-TEST-GATE.md) |
| Domain-boundary checklist (cross-component comms) | v3.8.0 (2025-12-20) | Superseded: Law 2 + the platform-facts section + MULTI-INSTANCE.md's universe model |
| Release-criteria checkpoint before dropping the suffix | v3.8.0 (2025-12-20) | Superseded: the CLAUDE.md release checklist + the CHANGELOG-past-Ron ("word") ritual |
| Trigger-based rule system | v3.x era | Abandoned — early models couldn't evaluate triggers reliably; replaced by CLAUDE.md behaviors + memory rules, which current models follow |
| Pre-build structural checklist / gate | implicit across many PMs | **Built 2026-09-17** — a `PreToolUse` hook fires an 11-point checklist on the first app edit each turn (the meta-principle made literal); `/sitemap` command mechanizes the class-of-sites comb |
| Overlay dismissal redesign (`<Dialog>`/`<Popover>` layer registry) | 2026-09-16 | **Designed** (DIALOG-DISMISSAL-AUDIT.md), deferred to its own branch; the audit found the defect is a *class* (~40 overlays, 3 Esc regimes); stopgap shipped 7.14.2, the class-fix awaits the primitive |

The pattern in the graveyard is the meta-principle again: proposals became real only when they became
mechanisms (a file that loads, a rule that fires, a checklist line). When adding to this document, add the
enforcement or expect the graveyard.

---

*Maintenance: when a post-mortem earns a new principle, add it here with its enforcement, same day. The
release checklist's "post-mortem → memory" step is where this file gets its updates.*
