#!/usr/bin/env python3
"""
backlog_report.py — where is the TODO on its hump? (Ron + Claude, 2026-10-21)

Ron's Product Acceptance lesson: if the "found" rate isn't falling toward zero, you're not close to done. Here every
TODO task counts (bugs AND the features Ron keeps wanting — Rule 0: no MVP, get it right first), so the question is:
are tasks being FINISHED faster than they ARRIVE? The backlog rises while arrivals win, peaks when they're equal, and
falls after — the hump.

What it reads (nothing is changed unless you ask for --stamp):
  * The git history of TODO.md since the one-header-per-task format began (aafe5dc, 2026-10-14). A task is any header
    whose own text has a "_Why it matters:_" line; its section (Up next / Before launch / After launch / Watching /
    Someday) says WHEN.
  * Each task's ID line, right under its header:  <!-- id 20261021-1509 -->  (date + time it was filed; a letter
    suffix only when two land in the same minute). A task that absorbed others lists them:
    <!-- id 20261021-1509; merged 20261014-0000a, 20260903-0000 -->
    Before IDs existed, a task is followed by its header text (and the RENAMES / MERGES lists below).
  * How a task ends: DONE (its header got a ✅ — that's velocity), MERGED (absorbed into another task — the backlog
    shrinks, no work done) or DROPPED (deleted without ✅ and not merged).
  * What's COUNTED: real work only — open and done tasks (2026-11-10, Ron). Merged and dropped tasks leave every count
    and chart, as if never filed (one separate number reports them, the tidying); a task that absorbed others counts
    from the earliest of them. So the open-tasks line moves by exactly arrived − done.
  * Where a ✅ is looked for: main's history AND every branch, local and on the remotes (2026-11-10). Every release is
    SQUASHED onto main, so the ✅ a task gets while its branch is built never reaches main's history — the task just
    disappears there. The branches are kept, so the ✅ is still found; a task counts as done from the moment its ✅
    first appeared anywhere. Whether a task is still OPEN is read from main alone. (Checked 2026-11-10: every release
    since the history began, 7.21.2 → 7.26.0, has its branch; the merges and deleted branches came before it.)
  * Before 2026-10-14 there's no task-by-task history, so the early part of the curve is APPROXIMATE: the tasks still
    listed on Oct 14, placed at the earliest date written in their own text, plus the CHANGELOG's shipped items per
    month. It's labeled as such on the page.

Usage:  py tools/backlog_report.py            — writes tools/backlog-report.html, opens it, prints a summary
        py tools/backlog_report.py --stamp    — adds the missing ID lines to TODO.md (the baseline; then review + commit)
        py tools/backlog_report.py --no-open  — don't open the browser
Double-clicking works too (the window stays open to show the summary).
"""
import datetime as dt
import difflib
import html
import os
import re
import subprocess
import sys
import webbrowser

REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, REPO)


def _runner():
    """pytools' keepopen (the window stays open on a double-click) — needed only when this file runs as a script, so
    the commit check and the tests can import it without pytools (2026-11-10: a fresh copy refused every TODO commit)."""
    try:
        from pytools.keepopen import run
        return run
    except ImportError:
        print("This script needs the pytools submodule. In the project folder run:\n"
              "    git submodule update --init\n"
              "then start it again.", file=sys.stderr)
        try:
            input("\nPress Enter to close this window.")
        except (EOFError, KeyboardInterrupt):
            pass
        sys.exit(1)


TODO = 'TODO.md'
FORMAT_START = 'aafe5dc'          # 2026-10-14: the TODO became one header per task
OUT = os.path.join(REPO, 'tools', 'backlog-report.html')
LAUNCH_SCOPE = ('up_next', 'before_launch')   # "done for announcing" = these two sections empty

# Renames and merges made BEFORE task IDs existed (the TODO review, 2026-10-20/21). After the ID baseline, the ID
# lines carry this information themselves and these lists need no additions.
RENAMES = {
    # 2026-10-14..18: rewordings the text-similarity check can't see (rewritten, not edited)
    'Fetcher: re-apply two lost improvements': "Fetcher: name and explain Amazon's library filter",
    'Keep the settings the app and relay share in step':
        'Numbers the app and relay must agree on: add a check that they match',
    'Dragging a subfolder to the top level drops it in the wrong place':
        'Folder dragging: where you drop decides pinned, and the level',
    'Edit Series / Position: "Mixed (2 values)" reads like "enter 2 values"':
        'Bulk Edit hints that read like "you can type several values"',
    'Faster back-to-back fetches: refresh everything at most once a day':
        'Faster fetches: read the whole library once, after your books are uploaded',
    'One book in several series positions (omnibus, anthology, MegaPack)':
        'Series positions: one Position dialog, and one book at several positions (omnibus)',
    # 2026-10-20/21: the TODO review
    'Faster fetches: read the whole library once, after your books are uploaded':
        'Faster fetches that report exactly how your library compares with Amazon',
    'Import summary: count every ownership change, by kind':
        'Import summary: every ownership change by kind, kept in the message history',
    "Clearing a price goal doesn't fully clear it everywhere":
        'Retire two leftover book fields: the hidden "seen" flag and the old price-goal field',
    'Ctrl+X from a Book List or Search quietly copies instead of cutting':
        'Move and copy books anywhere — folders, Book Lists, All Books, Searches',
    'Book details window: changes happen only when you click Save':
        'Book details window: one Save — nothing changes until you click it, and nothing is lost without asking',
    'Cancelling a new folder that a filter hides should discard it':
        'A folder or Book List you just created stays visible under filters',
    'Arrow keys should move through the Series suggestion lists':
        'Arrow keys should move through every type-ahead list',
}
MERGES = {   # absorbed task -> the task (current name) that absorbed it
    'Fetch: report exactly how your library compares with Amazon':
        'Faster fetches that report exactly how your library compares with Amazon',
    'Let library loans and Audible Plus books upgrade to owned':
        'Fetch should update books it already knows, not skip them',
    'Keep the Import summary in the message history':
        'Import summary: every ownership change by kind, kept in the message history',
    'Keep price goals when a book is bought, and say so':
        'Import summary: every ownership change by kind, kept in the message history',
    'Book List menu: remove Move / Copy, and block dragging onto folders':
        'Move and copy books anywhere — folders, Book Lists, All Books, Searches',
    'Drag between Folders and Book Lists':
        'Move and copy books anywhere — folders, Book Lists, All Books, Searches',
    "See an author's other books without leaving your spot":
        'Search everywhere without leaving the current folder',
    'Book details window: Save only when something changed; offer Save before closing with unsaved changes':
        'Book details window: one Save — nothing changes until you click it, and nothing is lost without asking',
}
DONE_WITHOUT_CHECKMARK = {   # finished and removed in a release without first getting a ✅ — CLOSED (2026-11-10): from
    # now on such a task is declared `done <id>` in the commit that removes it (git-hooks/check-removed-tasks.py)
    'Tag from Collections: clear up the checkbox vs. preview confusion',   # shipped as 7.24.0
    # shipped as 7.26.0; its two later pieces moved to their own tasks (2026-11-10)
    'One logging module: level, area and code for every message; an always-on log, a Diagnostics window',
}
# Commits whose ✅ marks RECOGNIZED work finished long before (the 2026-10-14/15 rewrite and done-ness sweep) — not
# that week's velocity. Those tasks were never really open in this history, so they're left out entirely.
RECOGNITION_COMMITS = ('34f0904', '3a40645', 'c576517', 'f925ee9', 'a09921f', '75339f3')

# Periods that move the numbers for a reason worth remembering (Ron, 2026-11-10) — shaded and named on the charts, so a
# spike or dip explains itself later. (first day, last day, name, why). One line per event.
EVENTS = [
    (dt.date(2026, 10, 14), dt.date(2026, 11, 4), 'TODO review',
     'the TODO overhaul (Oct 14-15), then the one-by-one review: tasks filed, merged and dropped ON PURPOSE — high '
     'amber and grey bars here are the list being sorted, not new work or finished work'),
]

# Spaces around the ";" are optional (2026-10-22) — keep in step with ID_RE in git-hooks/check-toc.js.
ID_RE = re.compile(r'^<!-- id (\d{8}-\d{4}[a-z]*)(?:\s*;\s*merged\s+([0-9a-z, \-]+))? -->\s*$')
DATE_RE = re.compile(r'\b(20\d\d)-(\d\d)-(\d\d)\b')
SECTIONS = [('up_next', 'Up next'), ('before_launch', 'Before launch'), ('after_launch', 'After launch'),
            ('watching', 'Watching'), ('someday', 'Someday')]


def git(*args):
    r = subprocess.run(['git', *args], cwd=REPO, capture_output=True, text=True, encoding='utf-8', errors='replace')
    if r.returncode != 0:
        raise RuntimeError(f"git {' '.join(args)} failed: {r.stderr.strip()}")
    return r.stdout


SECTION_WORDS = [('up next', 'up_next'), ('before public launch', 'before_launch'), ('after launch', 'after_launch'),
                 ('watching', 'watching'), ('someday', 'someday')]


def section_of(title):
    t = title.lower()
    return next((key for words, key in SECTION_WORDS if words in t), 'unknown')


def norm(header):
    return re.sub(r'^[✅🚧\s]+', '', header).strip()


def parse(text):
    """The tasks in one version of TODO.md: [{header, done, section, id, merged, body, line}]."""
    L = text.split('\n')
    start = next((i for i, ln in enumerate(L) if ln.startswith('# TODO')), 0)   # skip the table of contents
    heads = [(i, len(m.group(1)), m.group(2).strip()) for i in range(start, len(L))
             if (m := re.match(r'^(#{2,5}) (.+)$', L[i]))]
    tasks, section = [], 'unknown'
    for k, (i, lv, title) in enumerate(heads):
        if lv == 2:
            section = section_of(title)
            continue
        end = heads[k + 1][0] if k + 1 < len(heads) else len(L)
        body = '\n'.join(L[i + 1:end])
        if '_Why it matters:_' not in body:
            continue                                   # a group heading, not a task
        tid, merged = None, []
        nxt = next((ln for ln in L[i + 1:end] if ln.strip()), '')
        if (m := ID_RE.match(nxt.strip())):
            tid = m.group(1)
            merged = [x.strip() for x in (m.group(2) or '').split(',') if x.strip()]
        tasks.append({'header': norm(title), 'done': title.lstrip().startswith('✅'), 'section': section,
                      'id': tid, 'merged': merged, 'body': body, 'line': i})
    return tasks


def earliest_text_date(task):
    ds = [dt.date(int(y), int(m), int(d)) for y, m, d in DATE_RE.findall(task['header'] + '\n' + task['body'])
          if 1 <= int(m) <= 12 and 1 <= int(d) <= 31]
    return min(ds) if ds else None


def id_to_dt(tid):
    return dt.datetime.strptime(tid[:13], '%Y%m%d-%H%M')


class Rec:
    """One task across its whole life."""
    def __init__(self, header, arrived, basis, section):
        self.header, self.arrived, self.basis, self.section = header, arrived, basis, section
        self.aliases = {'h:' + header}
        self.ids, self.done_at, self.end, self.end_at, self.into = set(), None, None, None, None
        self.arrival_section = section
        self.recognized = False      # its ✅ only recorded work finished before the history starts


def load_versions(main_only=True):
    """[(sha, when, text)] — every version of TODO.md since the format began, oldest first. main_only: the line of work
    this branch stands on (its first parents — what's open, when things arrived and ended). Otherwise every branch,
    local and on the remotes, and the tags: where a task's ✅ can be found (2026-11-10 — every release is SQUASHED onto
    main, so the ✅ a task got while its branch was built never reaches main's history; the branches are kept). The
    stash is left out on purpose: it holds work that was never committed."""
    if main_only:
        log = git('log', '--first-parent', '--reverse', '--format=%H\t%aI', f'{FORMAT_START}^..HEAD', '--', TODO)
    else:
        log = git('log', '--branches', '--remotes', '--tags', '--format=%H\t%aI', '--not', f'{FORMAT_START}^', '--', TODO)
    commits = [ln.split('\t') for ln in log.splitlines() if ln.strip()]
    if not commits:
        raise RuntimeError('No TODO.md history found from ' + FORMAT_START)
    return [(sha, dt.datetime.fromisoformat(iso).replace(tzinfo=None), git('show', f'{sha}:{TODO}'))
            for sha, iso in commits]


DECLARED_RE = re.compile(r'\b(done|dropped)\s+(\d{8}-\d{4}[a-z]*(?:\s*,\s*\d{8}-\d{4}[a-z]*)*)', re.I)


def declared(message):
    """{id: 'done' | 'dropped'} — what a commit message says about tasks it removes: `done <id>` (finished, shipped
    without a ✅) or `dropped <id>`; a list works too. Required by git-hooks/check-removed-tasks.py (2026-11-10)."""
    out = {}
    for verb, ids in DECLARED_RE.findall(message):
        for tid in re.findall(r'\d{8}-\d{4}[a-z]*', ids):
            out[tid] = verb.lower()
    return out


def declared_done(messages):
    """{'id:<id>': when} for every task a commit message declared `done <id>` — [(sha, when, message)], any order.
    Replaces growing DONE_WITHOUT_CHECKMARK by hand: a task shipped without a ✅ is declared where it's removed."""
    first = {}
    for sha, when, message in messages:
        for tid, verb in declared(message).items():
            if verb == 'done' and ('id:' + tid not in first or when < first['id:' + tid]):
                first['id:' + tid] = when
    return first


def load_messages():
    """[(sha, when, message)] for EVERY branch's commits since the format began (2026-11-12: main's alone missed them — a
    task is declared `done <id>` in a commit on the release's branch, and the release reaches main as a squash whose
    message doesn't repeat it; the same trap as the ✅ marks, the same cure — BKLG-015)."""
    log = git('log', '--branches', '--remotes', '--tags', '--format=%H%x1f%aI%x1f%B%x1e', '--not', f'{FORMAT_START}^')
    out = []
    for rec in log.split('\x1e'):
        if rec.strip():
            sha, iso, msg = rec.strip('\n').split('\x1f', 2)
            out.append((sha, dt.datetime.fromisoformat(iso).replace(tzinfo=None), msg))
    return out


def checkmarks(versions):
    """{'id:<id>' or 'h:<header>': when its ✅ first appeared} across these versions (any order). The recognition
    commits' ✅ marks only recorded work finished before the history, so they're no evidence of work done here."""
    first = {}
    for sha, when, text in versions:
        if sha.startswith(RECOGNITION_COMMITS):
            continue
        for t in parse(text):
            if t['done']:
                for key in ['h:' + t['header']] + (['id:' + t['id']] if t['id'] else []):
                    if key not in first or when < first[key]:
                        first[key] = when
    return first


def walk(versions, marks):
    """Follow every task through main's versions. A task that leaves main ends DONE (a ✅ on main, a ✅ for it on any
    branch — `marks` — or DONE_WITHOUT_CHECKMARK), MERGED or DROPPED; whether it's still open is main's word alone."""
    if not versions:
        raise RuntimeError('No TODO.md history found from ' + FORMAT_START)

    def branch_mark(r):
        hits = [marks[a] for a in r.aliases if a in marks]
        return min(hits) if hits else None

    recs, open_recs, snaps = [], [], []
    for n, (sha, when, text) in enumerate(versions):
        cur = parse(text)
        alias_of = {}
        for r in open_recs:
            for a in r.aliases:
                alias_of[a] = r
        matched, unmatched = {}, []
        for t in cur:
            r = (alias_of.get('id:' + t['id']) if t['id'] else None) or alias_of.get('h:' + t['header'])
            if r and r not in matched.values():
                matched[id(t)] = r
            else:
                unmatched.append(t)
        gone = [r for r in open_recs if r not in matched.values()]
        # renames: the known list first, then a close match of the task's text
        for r in list(gone):
            if r.header in DONE_WITHOUT_CHECKMARK or r.done_at or branch_mark(r):
                continue
            target = RENAMES.get(r.header)
            cand = next((t for t in unmatched if t['header'] == target), None) if target else None
            if not cand and r.header not in MERGES:
                best, score = None, 0.0
                for t in unmatched:
                    s = difflib.SequenceMatcher(None, r.last_body[:1500], t['body'][:1500]).ratio()
                    if s > score:
                        best, score = t, s
                if score >= 0.6:
                    cand = best
            if cand:
                matched[id(cand)] = r
                unmatched.remove(cand)
                gone.remove(r)
        merged_ids = {mid for t in cur for mid in t['merged']}
        survivors = {}
        for t in cur:
            if id(t) in matched:
                survivors[t['header']] = matched[id(t)]
        for r in gone:
            if not r.done_at and (mark := branch_mark(r)):
                r.done_at = min(mark, when)                # its ✅ was made on a branch, then squashed away
            if r.done_at or r.header in DONE_WITHOUT_CHECKMARK:
                r.end, r.end_at = 'done', r.done_at or when
                r.done_at = r.done_at or when
            elif r.header in MERGES or (r.ids & merged_ids):
                r.end, r.end_at = 'merged', when
                into = next((t['id'] for t in cur if r.ids & set(t['merged'])), None)
                r.into = ('id:' + into) if into else ('h:' + MERGES[r.header])     # the absorbing task, by alias
            else:
                r.end, r.end_at = 'dropped', when
            open_recs.remove(r)
        for t in unmatched:
            back = next((r for r in recs if t['id'] and r.end == 'dropped' and 'id:' + t['id'] in r.aliases), None)
            if back:                                      # deleted by accident, restored under its own ID: reopen it
                back.end, back.end_at = None, None
                open_recs.append(back)
                matched[id(t)] = back
                continue
            if n == 0:
                if t['done']:
                    continue                              # finished before the history starts
                td = earliest_text_date(t)
                arrived = dt.datetime.combine(td, dt.time()) if td and td < when.date() else when
                basis = 'text date' if arrived != when else 'first seen'
            elif t['id']:
                arrived, basis = id_to_dt(t['id']), 'id'
            else:
                arrived, basis = when, 'first seen'
            r = Rec(t['header'], arrived, basis, t['section'])
            recs.append(r)
            open_recs.append(r)
            matched[id(t)] = r
        for t in cur:
            r = matched.get(id(t))
            if not r:
                continue
            r.header, r.section, r.last_body = t['header'], t['section'], t['body']
            r.aliases.add('h:' + t['header'])
            if t['id']:
                r.ids.add(t['id'])
                r.aliases.add('id:' + t['id'])
            if t['done'] and not r.done_at:
                r.done_at = when
                r.recognized = sha.startswith(RECOGNITION_COMMITS)
        snaps.append((when, [(r, r.section) for r in open_recs if not r.done_at]))
    # recognitions were never really open here: drop them from every count and every snapshot
    # A task that absorbed others counts from the earliest of them — that work existed since then (Ron, 2026-11-10).
    # In merge order, so a chain (A into B, B later into C) carries A's date all the way.
    by_alias = {a: r for r in recs for a in r.aliases}
    for m in sorted((r for r in recs if r.end == 'merged'), key=lambda r: r.end_at):
        absorber = by_alias.get(m.into)
        if absorber and m.arrived < absorber.arrived:
            absorber.arrived = m.arrived
    recs = [r for r in recs if not r.recognized]
    snaps = [(w, [(r, s) for r, s in opn if not r.recognized]) for w, opn in snaps]
    return recs, snaps, versions


def changelog_monthly():
    txt = open(os.path.join(REPO, 'CHANGELOG.md'), encoding='utf-8').read()
    parts = re.split(r'^## \[[^\]]+\] - (\d{4}-\d{2}-\d{2})', txt, flags=re.M)
    out = {}
    for i in range(1, len(parts), 2):
        month = parts[i][:7]
        out[month] = out.get(month, 0) + sum(1 for ln in parts[i + 1].splitlines() if ln.startswith('- '))
    return dict(sorted(out.items()))


# ---------- numbers ----------

def real_work(recs):
    """The tasks every count and chart is made of: open or done. A MERGED task was never separate work (it lives on in
    the task that absorbed it, which counts from its date); a DROPPED one turned out not to be work. Both leave every
    count, as if never filed — so the line moves by exactly arrived − done (Ron, 2026-11-10). They're reported as one
    separate number, the tidying."""
    return [r for r in recs if r.end not in ('merged', 'dropped')]


def summarize(recs, snaps, tidied=()):
    base = snaps[0][0]
    now = snaps[-1][0]
    days = max((now - base).total_seconds() / 86400, 1)
    weeks = days / 7
    after = [r for r in recs if r.arrived > base]
    open_now = [r for r, _ in snaps[-1][1]]
    s = {
        'base': base, 'now': now, 'weeks': weeks,
        'open': len(open_now),
        'by_section': {k: sum(1 for r in open_now if r.section == k) for k, _ in SECTIONS},
        'arrived': len(after),
        'done': len([r for r in recs if r.done_at and r.done_at > base]),
        'merged': sum(1 for r in tidied if r.end == 'merged'),      # not counted anywhere else — the tidying
        'dropped': sum(1 for r in tidied if r.end == 'dropped'),
    }
    s['arrive_rate'] = s['arrived'] / weeks
    s['done_rate'] = s['done'] / weeks
    scope_open = sum(s['by_section'][k] for k in LAUNCH_SCOPE)
    scope_arr = len([r for r in after if r.arrival_section in LAUNCH_SCOPE]) / weeks
    scope_done = len([r for r in recs if r.done_at and r.done_at > base and r.section in LAUNCH_SCOPE]) / weeks
    s.update(scope_open=scope_open, scope_arr=scope_arr, scope_done=scope_done)
    net = scope_done - scope_arr
    s['scope_weeks'] = scope_open / net if net > 0 else None
    s['scope_weeks_no_new'] = scope_open / scope_done if scope_done > 0 else None   # if nothing new arrived
    s['pre_dated'] = sum(1 for r in recs if r.arrived < base)
    s['pre_undated'] = sum(1 for r in recs if r.arrived == base)
    total_net = s['done_rate'] - s['arrive_rate']
    s['hump'] = ('past the peak — shrinking' if total_net > 0.25 else
                 'near the peak — about level' if total_net > -0.25 else 'still climbing')
    return s


def daily_series(recs, snaps):
    """Open tasks per day: approximate before the history starts, then measured."""
    base = snaps[0][0]
    pre_recs = [r for r in recs if r.arrived <= base]
    first = min((r.arrived.date() for r in pre_recs), default=base.date())
    approx, day = [], first
    while day < base.date():
        approx.append((day, sum(1 for r in pre_recs if r.arrived.date() <= day)))
        day += dt.timedelta(days=1)
    # Measured: each task by its OWN dates (2026-11-10) — open from its ID's time (or the start, for tasks already
    # listed) until it's done (its ✅, wherever it was made), merged or dropped. Main's clock alone would show a
    # branch's tasks arriving all at once at the release squash. The section comes from main's latest version that
    # lists the task, else the section it arrived in.
    secs, by_day = {}, {}
    for when, opn in snaps:
        by_day[when.date()] = {id(r): sec for r, sec in opn}

    def is_open(r, day):
        if max(r.arrived, base).date() > day:
            return False
        if r.done_at and r.done_at.date() <= day:
            return False
        return not (r.end in ('merged', 'dropped') and r.end_at.date() <= day)
    measured, day = [], base.date()
    while day <= snaps[-1][0].date():
        secs.update(by_day.get(day, {}))
        now_open = [r for r in recs if is_open(r, day)]
        scope = sum(1 for r in now_open if secs.get(id(r), r.arrival_section) in LAUNCH_SCOPE)
        measured.append((day, len(now_open), scope))
        day += dt.timedelta(days=1)
    return approx, measured


def weekly_flows(recs, base, now):
    weeks = []
    start = base.date() - dt.timedelta(days=base.weekday())
    while start <= now.date():
        end = start + dt.timedelta(days=7)

        def in_week(d, start=start, end=end):
            return d is not None and start <= d.date() < end and d > base
        weeks.append((start, sum(1 for r in recs if in_week(r.arrived)), sum(1 for r in recs if in_week(r.done_at)),
                      sum(1 for r in recs if r.end in ('merged', 'dropped') and in_week(r.end_at))))
        start = end
    return weeks


# ---------- the page ----------

def releases():
    """[(date, 'X.Y.Z')] — every release tag (vX.Y.Z), from git: no list to keep."""
    out = []
    for ln in git('for-each-ref', '--format=%(refname:short)\t%(creatordate:short)', 'refs/tags/v*').splitlines():
        name, _, day = ln.partition('\t')
        if re.fullmatch(r'v\d+\.\d+\.\d+', name) and day:
            out.append((dt.date.fromisoformat(day), name[1:]))
    return sorted(out)


def week_shade(start, events=EVENTS):
    """The tooltip for a week that overlaps an event ('TODO review: why…'), else None."""
    end = start + dt.timedelta(days=6)
    hits = [f'{name}: {why}' for first, last, name, why in events if start <= last and end >= first]
    return '; '.join(hits) or None


def svg_line(series, width=760, height=240, y_label='', bands=(), ticks=()):
    """series: [(name, css_var, dashed, [(date, value)])]; bands: [(first, last, name, why)] shaded behind the lines,
    named on hover; ticks: [(date, label)] small marks on the date axis (releases), named on hover."""
    pts = [p for _, _, _, s in series for p in s]
    if not pts:
        return ''
    x0, x1 = min(d for d, _ in pts), max(d for d, _ in pts)
    span = max((x1 - x0).days, 1)
    ymax = max(v for _, v in pts)
    step = max(1, round(ymax / 5 / 10) * 10) if ymax > 20 else max(1, round(ymax / 5))
    ytop = ((ymax // step) + 1) * step
    L, R, T, B = 44, 16, 14, 30
    W, H = width - L - R, height - T - B

    def X(d):
        return L + W * (d - x0).days / span

    def Y(v):
        return T + H - H * v / ytop
    out = [f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="{html.escape(y_label)}">']
    for first, last, name, why in bands:
        a, b = max(first, x0), min(last, x1)
        if a <= b:
            out.append(f'<rect class="band" x="{X(a):.1f}" y="{T}" width="{max(X(b) - X(a), 2):.1f}" height="{H}">'
                       f'<title>{html.escape(name)} ({first:%b %d} – {last:%b %d}): {html.escape(why)}</title></rect>'
                       f'<text class="band-name" x="{X(a) + 4:.1f}" y="{T + 12}">{html.escape(name)}</text>')
    for d, label in ticks:
        if x0 <= d <= x1:
            out.append(f'<line class="release" x1="{X(d):.1f}" x2="{X(d):.1f}" y1="{T + H - 8}" y2="{T + H}">'
                       f'<title>{html.escape(label)} released {d:%b %d}</title></line>')
    v = 0
    while v <= ytop:
        out.append(f'<line x1="{L}" x2="{width - R}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" class="grid"/>'
                   f'<text x="{L - 6}" y="{Y(v) + 4:.1f}" class="tick" text-anchor="end">{v}</text>')
        v += step
    months, d = [], dt.date(x0.year, x0.month, 1)
    while d <= x1:
        if d >= x0:
            months.append(d)
        d = dt.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
    every = max(1, len(months) // 8)
    for d in months[::every]:
        out.append(f'<text x="{X(d):.1f}" y="{height - 8}" class="tick" text-anchor="middle">{d.strftime("%b %y")}</text>')
    if len(months) < 2:
        for d in [x0, x1]:
            out.append(f'<text x="{X(d):.1f}" y="{height - 8}" class="tick" text-anchor="middle">{d.strftime("%b %d")}</text>')
    for name, var, dashed, s in series:
        if not s:
            continue
        path = ' '.join(f'{"M" if i == 0 else "L"}{X(d):.1f},{Y(val):.1f}' for i, (d, val) in enumerate(s))
        dash = ' stroke-dasharray="5 4"' if dashed else ''
        out.append(f'<path d="{path}" fill="none" stroke="var({var})" stroke-width="2.2"{dash}/>')
        d, val = s[-1]
        out.append(f'<circle cx="{X(d):.1f}" cy="{Y(val):.1f}" r="3.5" fill="var({var})"/>')
    out.append('</svg>')
    return ''.join(out)


def svg_bars(rows, keys, width=760, height=220, shade=()):
    """rows: [(label, {key: value})]; keys: [(key, css_var)] — grouped bars. shade: per row, a tooltip (that row is
    shaded and named on hover — an EVENT) or None."""
    if not rows:
        return ''
    ymax = max([1] + [v for _, d in rows for v in d.values()])
    L, R, T, B = 36, 10, 12, 30
    W, H = width - L - R, height - T - B
    gw = W / len(rows)
    bw = min(18, gw / (len(keys) + 1))
    out = [f'<svg viewBox="0 0 {width} {height}" role="img">']
    out += [f'<rect class="band" x="{L + i * gw:.1f}" y="{T}" width="{gw:.1f}" height="{H}"><title>'
            f'{html.escape(tip)}</title></rect>' for i, tip in enumerate(shade) if tip]
    for v in sorted({0, ymax // 2, ymax}):
        y = T + H - H * v / ymax
        out.append(f'<line x1="{L}" x2="{width - R}" y1="{y:.1f}" y2="{y:.1f}" class="grid"/>'
                   f'<text x="{L - 6}" y="{y + 4:.1f}" class="tick" text-anchor="end">{v}</text>')
    every = max(1, len(rows) // 12)
    for i, (label, d) in enumerate(rows):
        gx = L + i * gw + (gw - bw * len(keys)) / 2
        for j, (k, var) in enumerate(keys):
            v = d.get(k, 0)
            h = H * v / ymax
            out.append(f'<rect x="{gx + j * bw:.1f}" y="{T + H - h:.1f}" width="{bw - 2:.1f}" height="{h:.1f}" '
                       f'fill="var({var})" rx="1.5"><title>{html.escape(label)}: {v}</title></rect>')
        if i % every == 0:
            out.append(f'<text x="{L + i * gw + gw / 2:.1f}" y="{height - 8}" class="tick" '
                       f'text-anchor="middle">{html.escape(label)}</text>')
    out.append('</svg>')
    return ''.join(out)


def svg_net(rows, keys, width=760, height=230, shade=()):
    """Diverging bars around zero — rows: [(label, {key: value})]; keys: [(key, opacity)]. Above zero (green) = the
    backlog shrank that week; below (amber) = it grew. shade: as svg_bars."""
    if not rows:
        return ''
    top = max([1] + [abs(v) for _, d in rows for v in d.values()])
    L, R, T, B = 36, 10, 12, 30
    W, H = width - L - R, height - T - B

    def Y(v):
        return T + H / 2 - (H / 2) * v / top
    gw = W / len(rows)
    bw = min(22, gw / (len(keys) + 1))
    out = [f'<svg viewBox="0 0 {width} {height}" role="img" aria-label="Net velocity per week">']
    out += [f'<rect class="band" x="{L + i * gw:.1f}" y="{T}" width="{gw:.1f}" height="{H}"><title>'
            f'{html.escape(tip)}</title></rect>' for i, tip in enumerate(shade) if tip]
    for v in (top, 0, -top):
        cls = 'zero' if v == 0 else 'grid'
        out.append(f'<line x1="{L}" x2="{width - R}" y1="{Y(v):.1f}" y2="{Y(v):.1f}" class="{cls}"/>'
                   f'<text x="{L - 6}" y="{Y(v) + 4:.1f}" class="tick" text-anchor="end">{v:+d}</text>'
                   .replace('>+0<', '>0<'))
    for i, (label, d) in enumerate(rows):
        gx = L + i * gw + (gw - bw * len(keys)) / 2
        for j, (k, opacity) in enumerate(keys):
            v = d.get(k, 0)
            y0, y1 = sorted((Y(0), Y(v)))
            var = '--done' if v >= 0 else '--arrive'
            out.append(f'<rect x="{gx + j * bw:.1f}" y="{y0:.1f}" width="{bw - 2:.1f}" height="{max(y1 - y0, 1):.1f}" '
                       f'fill="var({var})" fill-opacity="{opacity}" rx="1.5"><title>{html.escape(label)}: {v:+d}'
                       f'</title></rect>')
        out.append(f'<text x="{L + i * gw + gw / 2:.1f}" y="{height - 8}" class="tick" '
                   f'text-anchor="middle">{html.escape(label)}</text>')
    out.append('</svg>')
    return ''.join(out)


def weekly_net(weeks):
    """Per week: done − arrived, signed so that ABOVE zero means the backlog shrank. With only real work counted
    (real_work), that IS the line's change — the old second bar (merges and drops included) is gone (2026-11-10)."""
    return [(start.strftime('%b %d'), {'work': done - arrived}) for start, arrived, done, _ in weeks]


PAGE = '''<title>ReaderWrangler Backlog</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="stylesheet" href="%FONTS%">
<style>
/* Layout: one reading column — the verdict first, then the hump, the flows, the launch burn-down, the pre-history. */
:root {
  --bg: #f6f7f9; --panel: #ffffff; --ink: #1d2433; --muted: #5d6779; --rule: #dde2ea;
  --accent: #2f5bd3; --arrive: #c77d14; --done: #2c8a57; --gone: #8a93a4; --approx: #9aa6bd;
  --sans: "IBM Plex Sans", "Segoe UI", system-ui, sans-serif; --mono: "IBM Plex Mono", Consolas, monospace;
}
@media (prefers-color-scheme: dark) { :root:not([data-theme="light"]) {
  --bg: #12161f; --panel: #1a202c; --ink: #e6eaf2; --muted: #9aa5b8; --rule: #2c3445;
  --accent: #7ea2ff; --arrive: #e9a647; --done: #5cc68b; --gone: #7d879a; --approx: #5e6b85; color-scheme: dark } }
:root[data-theme="dark"] {
  --bg: #12161f; --panel: #1a202c; --ink: #e6eaf2; --muted: #9aa5b8; --rule: #2c3445;
  --accent: #7ea2ff; --arrive: #e9a647; --done: #5cc68b; --gone: #7d879a; --approx: #5e6b85; color-scheme: dark }
body { background: var(--bg); color: var(--ink); font-family: var(--sans); font-size: 15px; line-height: 1.5;
  padding-left: max(16px, env(safe-area-inset-left, 0px)); padding-right: max(16px, env(safe-area-inset-right, 0px));
  padding-block: 28px 48px; }
main { max-width: 820px; margin: 0 auto; display: grid; gap: 22px; }
h1 { font-size: 26px; font-weight: 600; margin: 0; text-wrap: balance; }
h2 { font-size: 17px; font-weight: 600; margin: 0 0 4px; text-wrap: balance; }
p { margin: 0; max-width: 68ch; }
.meta { color: var(--muted); font-size: 13px; font-family: var(--mono); }
.verdict { font-size: 18px; }
.verdict b { color: var(--accent); font-weight: 600; }
.panel { background: var(--panel); border: 1px solid var(--rule); border-radius: 8px; padding: 18px;
  display: grid; gap: 10px; min-width: 0; }
.nums { display: grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap: 12px; }
.num { display: grid; gap: 2px; }
.num .v { font-family: var(--mono); font-size: 24px; font-weight: 500; font-variant-numeric: tabular-nums; }
.num .k { color: var(--muted); font-size: 12px; text-transform: uppercase; letter-spacing: .06em; }
.chart { overflow-x: auto; }
.chart svg { width: 100%; min-width: 520px; height: auto; display: block; }
.grid { stroke: var(--rule); stroke-width: 1; }
.zero { stroke: var(--muted); stroke-width: 1.2; }
.tick { fill: var(--muted); font-family: var(--mono); font-size: 11px; }
.legend { display: flex; flex-wrap: wrap; gap: 14px; color: var(--muted); font-size: 13px; }
.legend i { display: inline-block; width: 18px; height: 3px; border-radius: 2px; vertical-align: middle; margin-right: 6px; }
.note { color: var(--muted); font-size: 13px; }
table { border-collapse: collapse; width: 100%; font-size: 14px; }
td, th { text-align: left; padding: 5px 8px; border-bottom: 1px solid var(--rule); }
td.n { font-family: var(--mono); text-align: right; font-variant-numeric: tabular-nums; }
.band { fill: var(--accent); fill-opacity: .08; }
.band-name { fill: var(--muted); font-family: var(--sans); font-size: 11px; }
.release { stroke: var(--muted); stroke-width: 2; }
</style>
<main>
%BODY%
</main>
'''


def page(s, approx, measured, weeks, monthly, recs, rels=()):
    E = html.escape
    young_note = ('<p class="note">Fewer than 4 weeks of task-by-task history — read the rates as a first '
                  'impression, not a trend.</p>') if s['weeks'] < 4 else ''
    if s['scope_weeks'] is None:
        launch = ('The launch scope (Up next + Before launch) is <b>not shrinking yet</b>: tasks are arriving there '
                  'about as fast as they are finished, or faster.')
        if s['scope_weeks_no_new']:
            launch += (f' If nothing new arrived, it would take about <b>{s["scope_weeks_no_new"]:.0f} weeks</b> '
                       'at this pace.')
    else:
        eta = s['now'] + dt.timedelta(weeks=s['scope_weeks'])
        launch = (f'At this pace the launch scope empties in about <b>{s["scope_weeks"]:.0f} weeks</b> '
                  f'(around {eta:%B %Y}).')
    sec_rows = ''.join(f'<tr><td>{name}</td><td class="n">{s["by_section"][k]}</td></tr>' for k, name in SECTIONS)
    hump = svg_line([('Approximate (before Oct 14)', '--approx', True, approx),
                     ('All open tasks', '--accent', False, [(d, n) for d, n, _ in measured]),
                     ('Launch scope', '--arrive', False, [(d, n) for d, _, n in measured])], y_label='Open tasks',
                    bands=EVENTS, ticks=rels)
    flows = svg_bars([(w.strftime('%b %d'), {'a': a, 'd': d}) for w, a, d, _ in weeks],
                     [('a', '--arrive'), ('d', '--done')],
                     shade=[week_shade(w) for w, *_ in weeks])
    months = svg_bars([(m[2:].replace('-', '/'), {'c': c}) for m, c in monthly.items()], [('c', '--done')])
    week_of = {w.strftime('%b %d'): w for w, *_ in weeks}
    net_rows = weekly_net(weeks)
    net = svg_net(net_rows, [('work', 1)], shade=[week_shade(week_of[lb]) for lb, _ in net_rows])
    ev_note = ' '.join(f'<b>{E(name)}</b> ({first:%b %d} – {last:%b %d}): {E(why)}.'
                       for first, last, name, why in EVENTS)
    ev_note = (f'<p class="note">Shaded: {ev_note} Hover a shaded area for its name.</p>') if EVENTS else ''
    body = f'''
<header style="display:grid;gap:6px">
  <h1>ReaderWrangler Backlog</h1>
  <p class="meta">TODO.md · measured {s["base"]:%b %d} → {s["now"]:%b %d %Y, %H:%M} ({s["weeks"]:.1f} weeks)</p>
</header>
<section class="panel">
  <p class="verdict">The backlog is <b>{E(s["hump"])}</b>: {s["arrive_rate"]:.1f} tasks arrive per week and
  {s["done_rate"]:.1f} get done. {launch}</p>
  {young_note}
  <div class="nums">
    <div class="num"><span class="v">{s["open"]}</span><span class="k">Open tasks</span></div>
    <div class="num"><span class="v">{s["scope_open"]}</span><span class="k">Launch scope</span></div>
    <div class="num"><span class="v">{s["arrived"]}</span><span class="k">Arrived since {s["base"]:%b %d}</span></div>
    <div class="num"><span class="v">{s["done"]}</span><span class="k">Done since {s["base"]:%b %d}</span></div>
    <div class="num"><span class="v">{s["merged"] + s["dropped"]}</span><span class="k">Tidied away</span></div>
  </div>
  <p class="note">Only real work is counted: tasks still open and tasks done. <b>Tidied away</b> = {s["merged"]} merged
  into another task (that task counts from the earliest of them) and {s["dropped"]} dropped as not needed — left out of
  every number and chart here, as if never filed, so the open-tasks line moves by exactly arrived minus done.</p>
</section>
<section class="panel">
  <h2>The hump: open tasks over time</h2>
  <div class="legend"><span><i style="background:var(--accent)"></i>All open tasks</span>
    <span><i style="background:var(--arrive)"></i>Launch scope (Up next + Before launch)</span>
    <span><i style="background:var(--approx)"></i>Approximate (dashed)</span>
    <span><i style="background:var(--muted);width:2px;height:10px"></i>A release (hover for which)</span></div>
  <div class="chart">{hump}</div>
  {ev_note}
  <p class="note">Each task counts from the day it was filed until the day it was finished, merged or dropped — on its
  branch or on main — so a release doesn't show its tasks arriving or finishing all at once.</p>
  <p class="note">Before {s["base"]:%b %d} the dashed line is approximate: it counts the {s["pre_dated"]} tasks listed
  on {s["base"]:%b %d} that have a date in their own text, placed at that date. {s["pre_undated"]} more had no date and
  appear on {s["base"]:%b %d} itself (the step there is them, not a surge), and tasks finished before then aren't in it
  at all, so the real early backlog was larger.</p>
</section>
<section class="panel">
  <h2>Arrivals and completions per week</h2>
  <div class="legend"><span><i style="background:var(--arrive)"></i>Arrived</span>
    <span><i style="background:var(--done)"></i>Done (✅)</span></div>
  <div class="chart">{flows}</div>
  <p class="note">The hump turns over once green bars are taller than amber ones week after week. The line above
  moves by exactly amber minus green.</p>
</section>
<section class="panel">
  <h2>Net velocity per week (the slope)</h2>
  <div class="legend"><span><i style="background:var(--done)"></i>Above zero: the backlog shrank</span>
    <span><i style="background:var(--arrive)"></i>Below zero: it grew</span>
    <span>Done minus arrived, per week</span></div>
  <div class="chart">{net}</div>
  <p class="note">The peak of the hump is where these bars cross from below zero to above it and stay there.</p>
</section>
<section class="panel">
  <h2>Open tasks by section</h2>
  <table>{sec_rows}</table>
</section>
<section class="panel">
  <h2>Shipped items per month (CHANGELOG)</h2>
  <div class="chart">{months}</div>
  <p class="note">Every bullet in each month's release notes. The long-run picture of finished work before the TODO
  had task-by-task history.</p>
</section>'''
    fonts = ('https://fonts.googleapis.com/css2?family=IBM+Plex+Sans:wght@400;500;600'
             '&family=IBM+Plex+Mono:wght@400;500&display=swap')
    return PAGE.replace('%FONTS%', fonts).replace('%BODY%', body)


# ---------- the baseline stamp ----------

def assign_ids(recs):
    """A unique id per task: its arrival date+time, letter suffix only for later ones in the same minute."""
    used, ids = set(), {}
    for r in sorted(recs, key=lambda r: (r.arrived, r.header)):
        if r.ids:
            ids[r] = sorted(r.ids)[0]
            used.add(ids[r])
            continue
        base = r.arrived.strftime('%Y%m%d-%H%M')
        cand, n = base, 0
        while cand in used:
            n += 1
            cand, k = base, n
            suffix = ''
            while k > 0:
                k, rem = divmod(k - 1, 26)
                suffix = chr(97 + rem) + suffix
            cand = base + suffix
        used.add(cand)
        ids[r] = cand
    return ids


def stamp(recs, snaps):
    ids = assign_ids(recs)
    live = [r for r, _ in snaps[-1][1]] + [r for r in recs if r.done_at and not r.end]
    by_header = {r.header: r for r in live}
    absorbed = {}
    for r in recs:
        if r.end == 'merged' and r.into and r.into.startswith('h:'):    # by header: the merges from before IDs
            absorbed.setdefault(r.into[2:], []).append(ids[r])
    path = os.path.join(REPO, TODO)
    L = open(path, encoding='utf-8').read().split('\n')
    tasks = parse('\n'.join(L))
    added = []
    for t in sorted(tasks, key=lambda t: -t['line']):
        if t['id']:
            continue
        r = by_header.get(t['header'])
        if not r:
            print(f'  ! no history for "{t["header"]}" — skipped (give it an id by hand)')
            continue
        m = sorted(absorbed.get(t['header'], []))
        line = f'<!-- id {ids[r]}' + (f'; merged {", ".join(m)}' if m else '') + ' -->'
        L.insert(t['line'] + 1, line)
        added.append((ids[r], r.basis, t['header'], m))
    open(path, 'w', encoding='utf-8', newline='').write('\n'.join(L))
    for tid, basis, h, m in sorted(added):
        print(f'  {tid:16} {basis:10} {h[:70]}' + (f'   merged: {", ".join(m)}' if m else ''))
    print(f'\nAdded {len(added)} id lines to {TODO}. Review them, then commit.')


def all_marks():
    """Every piece of 'this task was finished' evidence, with its date: a ✅ on any branch, and a `done <id>` in any
    commit's message (one place, so the report and its tests read the same evidence)."""
    marks = checkmarks(load_versions(main_only=False))
    for key, when in declared_done(load_messages()).items():      # `done <id>` in a commit message counts as its ✅
        marks[key] = min(marks.get(key, when), when)
    return marks


def main():
    sys.stdout.reconfigure(encoding='utf-8')
    recs, snaps, _ = walk(load_versions(main_only=True), all_marks())
    if '--stamp' in sys.argv:
        stamp(recs, snaps)
        return
    real = real_work(recs)
    s = summarize(real, snaps, tidied=[r for r in recs if r not in real])
    approx, measured = daily_series(real, snaps)
    weeks = weekly_flows(real, s['base'], s['now'])
    monthly = changelog_monthly()
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(page(s, approx, measured, weeks, monthly, real, rels=releases()))
    print(f'Backlog: {s["open"]} open tasks ({s["scope_open"]} in the launch scope) — {s["hump"]}.')
    print(f'Since {s["base"]:%Y-%m-%d} ({s["weeks"]:.1f} weeks): {s["arrived"]} arrived, {s["done"]} done '
          f'(real work: the line moves by the difference). Tidied away, not counted: {s["merged"]} merged, '
          f'{s["dropped"]} dropped.')
    print(f'Per week: {s["arrive_rate"]:.1f} arrive, {s["done_rate"]:.1f} done. Launch scope: '
          + (f'empties in ~{s["scope_weeks"]:.0f} weeks.' if s['scope_weeks'] else 'not shrinking yet'
             + (f' (~{s["scope_weeks_no_new"]:.0f} weeks if nothing new arrived).' if s['scope_weeks_no_new'] else '.')))
    for k, name in SECTIONS:
        print(f'  {name:14} {s["by_section"][k]}')
    print(f'\nPage: {OUT}')
    if '--no-open' not in sys.argv:
        webbrowser.open('file:///' + OUT.replace('\\', '/'))


if __name__ == '__main__':
    _runner()(main, pause='always')
