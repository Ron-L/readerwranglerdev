# Tests for tools/backlog_report.py — how a task's end is counted: done, merged or dropped.
# tags: backlog, tooling, tier 1
# covers: tools/backlog_report.py
# Run: python test/test_backlog_report.py
#
# 2026-11-10: every release is squashed onto main, and the ✅ a task gets while its branch is built never reaches main's
# history — on main the task just disappears, so the report counted finished work as DROPPED (7.26.0's Import-order fix:
# ✅ at alpha.3 on feature/logging, removed at release prep). The report now also reads TODO.md on every branch (the
# branches are kept): a task removed from main counts as done if a ✅ for it exists anywhere, dated when it first appeared.
# Whether a task is still OPEN is read from main only.
import datetime as dt
import importlib.util
import os
import random
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, ROOT)
spec = importlib.util.spec_from_file_location("backlog_report", os.path.join(ROOT, "tools", "backlog_report.py"))
br = importlib.util.module_from_spec(spec)
spec.loader.exec_module(br)
sys.path.insert(0, os.path.join(ROOT, "test", "ui"))
from harness import check, done, test   # noqa: E402  (the screen tests' harness: stable IDs, one summary line)


VOCAB = ['apple', 'river', 'stone', 'cloud', 'maple', 'ember', 'quartz', 'violet', 'harbor', 'lantern', 'meadow',
         'cobalt', 'falcon', 'juniper', 'saffron', 'tundra', 'willow', 'zephyr', 'orchid', 'basalt']


def todo(*tasks):
    """A TODO.md with these tasks in Up next — each (header, id, extra) where extra is e.g. '; merged 20261001-0900'."""
    out = ["# TODO", "", "## 🔝 Up next", ""]
    for header, tid, extra in tasks:
        # each body its own words: the report treats a vanished task whose text reappears under a new header as RENAMED
        # (60 words drawn by a random seeded with the task's name: two tasks' texts are ~5-10% alike, far under 60%)
        r = random.Random(header.lstrip('✅ '))
        words = " ".join(r.choice(VOCAB) for _ in range(60))
        out += [f"#### {header}", f"<!-- id {tid}{extra} -->", "", f"_Why it matters:_ {words}", ""]
    return "\n".join(out)


def at(day, hour=12):
    return dt.datetime(2026, 10, day, hour)


A = ("Task A", "20261015-1000", "")
B = ("Task B", "20261015-1100", "")
A_DONE = ("✅ Task A", "20261015-1000", "")
B_DONE = ("✅ Task B", "20261015-1100", "")


def ends(main_versions, branch_versions=()):
    """Walk main's versions with ✅ evidence from main + the branches; {header: (end, done_at, open?)}."""
    marks = br.checkmarks(list(main_versions) + list(branch_versions))
    recs, snaps, _ = br.walk(main_versions, marks)
    open_now = {r.header for r, _ in snaps[-1][1]}
    return {r.header: (r.end, r.done_at, r.header in open_now) for r in recs}


def branch_only_checkmark_counts_done():
    main = [("m1", at(15), todo(A, B)), ("m2", at(20), todo(B))]           # A disappears from main with no ✅ there
    branch = [("b1", at(17), todo(A_DONE, B))]                              # ...but got its ✅ on the branch
    r = ends(main, branch)
    check(r["Task A"][0] == "done", f"Task A should be done (✅ on its branch), got {r['Task A'][0]!r}")
    check(r["Task A"][1] == at(17), f"done when the ✅ first appeared (Oct 17), got {r['Task A'][1]}")
    check(r["Task B"][2], "Task B is still open on main")
test("BKLG-001", "a task whose ✅ exists only on a branch, removed from main, counts as done on the ✅'s date",
     branch_only_checkmark_counts_done)


def branch_checkmark_on_open_task_stays_open():
    main = [("m1", at(15), todo(A, B)), ("m2", at(20), todo(A, B))]
    branch = [("b1", at(17), todo(A_DONE, B))]                              # ✅ on a branch, then taken back / not shipped
    r = ends(main, branch)
    check(r["Task A"][2] and r["Task A"][0] is None, f"Task A is still open on main, got {r['Task A']}")
test("BKLG-002", "a ✅ on a branch doesn't close a task that main still lists open", branch_checkmark_on_open_task_stays_open)


def no_checkmark_anywhere_is_dropped():
    main = [("m1", at(15), todo(A, B)), ("m2", at(20), todo(B))]
    branch = [("b1", at(17), todo(A, B_DONE))]                              # a ✅ for B, none for A
    r = ends(main, branch)
    check(r["Task A"][0] == "dropped", f"Task A was removed with no ✅ anywhere: dropped, got {r['Task A'][0]!r}")
test("BKLG-003", "a task removed with no ✅ on any branch and not merged is dropped", no_checkmark_anywhere_is_dropped)


def merged_is_merged():
    C = ("Task C", "20261015-1200", "; merged 20261015-1000")
    main = [("m1", at(15), todo(A, B)), ("m2", at(20), todo(B, C))]
    r = ends(main)
    check(r["Task A"][0] == "merged", f"Task A was absorbed into Task C: merged, got {r['Task A'][0]!r}")
test("BKLG-004", "a task absorbed into another (its ID in a 'merged' list) is merged", merged_is_merged)


def checkmark_on_main_still_counts():
    main = [("m1", at(15), todo(A, B)), ("m2", at(18), todo(A_DONE, B)), ("m3", at(20), todo(B))]
    r = ends(main)
    check(r["Task A"][0] == "done" and r["Task A"][1] == at(18), f"✅ on main: done on Oct 18, got {r['Task A']}")
    # a ✅ task stays listed until the release sweep removes it — from its ✅ on, it no longer counts as open
    _, snaps, _ = br.walk(main, br.checkmarks(main))
    open_on_18 = {rec.header for rec, _ in snaps[1][1]}
    check("Task A" not in open_on_18, f"on Oct 18 Task A has its ✅ — not open; open then: {sorted(open_on_18)}")
test("BKLG-005", "a ✅ made on main counts from its date — the task stops counting as open while still listed",
     checkmark_on_main_still_counts)


def restored_task_reopens():
    main = [("m1", at(15), todo(A, B)), ("m2", at(17), todo(B)), ("m3", at(20), todo(A, B))]   # lost, then restored
    recs, snaps, _ = br.walk(main, br.checkmarks(main))
    mine = [r for r in recs if r.header == "Task A"]
    check(len(mine) == 1, f"a task restored under its own ID is ONE task, not two arrivals: {len(mine)} records")
    check(mine[0].end is None, f"restored, it's open again — not dropped: {mine[0].end!r}")
    check("Task A" in {r.header for r, _ in snaps[-1][1]}, "the restored task counts as open")
test("BKLG-007", "a task deleted by accident and restored under its own ID reopens — one arrival, not dropped",
     restored_task_reopens)


def open_on(main, branch, day):
    """The open-tasks line's value on Oct `day` — the page's own series."""
    marks = br.checkmarks(list(main) + list(branch))
    recs, snaps, _ = br.walk(main, marks)
    _, measured = br.daily_series(recs, snaps)
    return {d.day: n for d, n, _ in measured}[day]


# 2026-11-10 (Ron: "the line's delta is 15, the bars say 40?"): the line read main's clock, so tasks filed on a branch
# appeared only at the release squash — 7.26.0's Nov 8-9 tasks made a jump on Nov 10. The line now follows each task's
# own dates: open from its ID's time until it's done (✅ anywhere), merged or dropped.
C = ("Task C", "20261017-0900", "")


def branch_filed_counts_from_its_date():
    main = [("m1", at(15), todo(A, B)), ("m2", at(20), todo(A, B, C))]      # C filed Oct 17 on a branch, on main Oct 20
    n = open_on(main, (), 18)
    check(n == 3, f"on Oct 18 Task C (filed Oct 17 on its branch) is open: expected 3, the line says {n}")
test("BKLG-008", "a task filed on a branch counts as open from its own date, not from the release squash",
     branch_filed_counts_from_its_date)


def branch_done_closes_on_its_date():
    main = [("m1", at(15), todo(A, B)), ("m2", at(20), todo(B))]
    n = open_on(main, [("b1", at(17), todo(A_DONE, B))], 18)
    check(n == 1, f"Task A got its ✅ on Oct 17 (on its branch): on Oct 18 only Task B is open, the line says {n}")
test("BKLG-009", "a task finished on a branch stops counting as open on its ✅'s date", branch_done_closes_on_its_date)


def last_day_matches_main():
    marks = br.checkmarks(br.load_versions(main_only=False))
    recs, snaps, _ = br.walk(br.load_versions(main_only=True), marks)
    _, measured = br.daily_series(recs, snaps)
    check(measured[-1][1] == len(snaps[-1][1]),
          f"the line's last day ({measured[-1][1]}) must equal the tasks open on main now ({len(snaps[-1][1])})")
test("BKLG-010", "the real history: the line's last day equals the tasks open on main today", last_day_matches_main)


def events_and_releases_drawn():
    ev = [(dt.date(2026, 10, 14), dt.date(2026, 11, 4), "TODO review", "tasks filed and merged on purpose")]
    rel = [(dt.date(2026, 11, 10), "7.26.0")]
    line = br.svg_line([("x", "--accent", False, [(dt.date(2026, 10, 1), 5), (dt.date(2026, 11, 12), 9)])],
                       bands=ev, ticks=rel)
    check('class="band"' in line and "TODO review" in line, "the line chart shades the TODO review, with its name")
    check('class="release"' in line and "7.26.0" in line, "the line chart marks the 7.26.0 release")
    rows = [("Oct 12", {"a": 1}), ("Nov 09", {"a": 2})]
    bars = br.svg_bars(rows, [("a", "--arrive")], shade=["TODO review: tasks filed and merged on purpose", None])
    check(bars.count('class="band"') == 1 and "TODO review" in bars, "the weekly bars shade the review's week only")
test("BKLG-011", "the TODO review is shaded and named on the charts; releases are marked on the line",
     events_and_releases_drawn)


# 2026-11-10 (Ron): a merged task was never separate work (it lives on in the task that absorbed it), and a dropped one
# turned out not to be work — so the charts count REAL work only: merged and dropped tasks leave every count, as if never
# filed, and the line moves by exactly arrived − done. A task that absorbed others counts from the earliest of them.
D = ("Task D", "20261016-0900", "")


def tidied_tasks_leave_every_count():
    main = [("m1", at(15), todo(A, B)), ("m2", at(16), todo(A, B, D)),
            ("m3", at(18), todo(("Task B", "20261015-1100", "; merged 20261016-0900"))),   # D merged into B, A dropped
            ("m4", at(20), todo(("Task B", "20261015-1100", "; merged 20261016-0900"), C))]
    recs, snaps, _ = br.walk(main, br.checkmarks(main))
    real = br.real_work(recs)
    check({r.header for r in real} == {"Task B", "Task C"}, f"only real work counts: {sorted(r.header for r in real)}")
    _, measured = br.daily_series(real, snaps)
    line = {d.day: n for d, n, _ in measured}
    check(line[15] == 1 and line[17] == 2 and line[20] == 2,
          f"the line counts B from the start and C from Oct 17 — never A or D: {line}")
    s = br.summarize(real, snaps)
    check(s["arrived"] == 1 and s["done"] == 0, f"arrived 1 (C), done 0: {s['arrived']}, {s['done']}")
    check(line[20] - line[15] == s["arrived"] - s["done"], "the line moves by exactly arrived − done")
test("BKLG-012", "merged and dropped tasks leave every count; the line moves by exactly arrived − done",
     tidied_tasks_leave_every_count)


def absorber_counts_from_earliest():
    E_ABS = ("Task E", "20261019-0900", "; merged 20261017-0900")       # E (filed Oct 19) absorbs C (filed Oct 17)
    main = [("m1", at(15), todo(A)), ("m2", at(18), todo(A, C)), ("m3", at(20), todo(A, E_ABS))]
    recs, _, _ = br.walk(main, br.checkmarks(main))
    e = next(r for r in recs if r.header == "Task E")
    check(e.arrived == dt.datetime(2026, 10, 17, 9, 0), f"Task E absorbed C (filed Oct 17): it counts from then, got {e.arrived}")
test("BKLG-013", "a task that absorbed others counts from the earliest of them", absorber_counts_from_earliest)


def real_history_line_is_arrived_minus_done():
    marks = br.checkmarks(br.load_versions(main_only=False))
    recs, snaps, _ = br.walk(br.load_versions(main_only=True), marks)
    real = br.real_work(recs)
    s = br.summarize(real, snaps)
    _, measured = br.daily_series(real, snaps)
    start = sum(1 for r in real if r.arrived <= s["base"] and not (r.done_at and r.done_at <= s["base"]))
    check(measured[-1][1] - start == s["arrived"] - s["done"],
          f"the real history: line {start} → {measured[-1][1]} must move by arrived − done = {s['arrived'] - s['done']}")
    check(measured[-1][1] == len(snaps[-1][1]), "and still end at main's open count")
test("BKLG-014", "the real history: the line's change equals arrived − done, ending at main's open count",
     real_history_line_is_arrived_minus_done)


def real_history_import_order_fix():
    recs, _, _ = br.walk(br.load_versions(main_only=True), br.checkmarks(br.load_versions(main_only=False)))
    name = "Import files new books once, before the integrity check — and only books in no folder"
    r = next((r for r in recs if r.header == name), None)
    check(r is not None, "the Import-order task isn't in the history")
    check(r.end == "done", f"7.26.0's Import-order fix (✅ on feature/logging at alpha.3) should be done, got {r.end!r}")
    check(r.done_at.date() == dt.date(2026, 11, 5), f"its ✅ came on 2026-11-05, got {r.done_at}")
test("BKLG-006", "the real case: 7.26.0's Import-order fix counts as done (its ✅ was on the branch, 2026-11-05)",
     real_history_import_order_fix)


# 2026-11-12: a task finished without a ✅ is declared `done <id>` in the commit that removes it — but that commit is on
# the release's branch, and the release reaches main as a squash whose message doesn't repeat it. The report read the
# declarations from main's own commits only, so three finished tasks counted as DROPPED (found when "done" went DOWN,
# 14 → 13, the day two tasks were finished). The same trap as the ✅ marks (BKLG-001), the same cure: every branch.
def real_history_done_declared_on_a_branch():
    recs, _, _ = br.walk(br.load_versions(main_only=True), br.all_marks())
    for tid, what in (("20261110-0908", "7.28.0's logging kit (declared on feature/logkit)"),
                      ("20261014-1030ay", "7.28.1's Delete key (declared on main-prime)"),
                      ("20261112-0757", "every repository's own .gitignore (declared on main-prime)")):
        r = next((r for r in recs if "id:" + tid in r.aliases), None)
        check(r is not None, f"{what}: not in the history")
        check(r.end == "done", f"{what}: should be done, got {r.end!r}")
test("BKLG-015", "the real case: a task declared `done <id>` on a release's branch counts as done, not dropped",
     real_history_done_declared_on_a_branch)

done()
