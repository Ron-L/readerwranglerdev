#!/usr/bin/env python3
"""
run_tests.py — the one test runner (docs/design/TESTING.md §4; Ron + Claude, 2026-11-04).

Finds every test file, reads its header, picks the ones asked for, runs each, and prints one summary.

    py tools/run_tests.py                     tier 1 (the default): the fast function tests
    py tools/run_tests.py --tier all          everything (tier 3 starts its own local relay — see below)
    py tools/run_tests.py --tier all --release   the release run: a SKIPPED file fails it, named with why
    py tools/run_tests.py --tag merge         by area
    py tools/run_tests.py --id MERGE-012      the file(s) holding that test ID
    py tools/run_tests.py --changed           the tests covering what changed (staged + unstaged) — the commit hook
    py tools/run_tests.py --list              show what would run, run nothing

Test files and their tiers:
    test/*.test.js        function tests (Node; test/harness.js)          tier from the header (normally 1)
    test/test_*.py        function tests in Python                         tier from the header (normally 1)
    test/ui/test_*.py     screen tests (the browser driver)                tier 2
    relay/test-*.mjs      relay tests                                      tier 3

Tier 3 starts its OWN local relay (tools/local_relay.py, 2026-11-12): relay-worker.js in wrangler's local emulator on a
free port with an empty, throwaway store; the relay files run against it; then every process it started is stopped by
exact id and CHECKED gone, and its ports checked free — anything left fails the run, named by id. Never the dev or
production relay. --relay-url <address> uses a relay you started instead (no start, no stop).

Every test file declares, in its first lines:   tags: <areas>, tier N     and     covers: <source files it tests>
A file without them is a failure ("headers are required") — the covers: lines are the one source for --changed.

Double-clicked, the window stays open to show the results (pytools keepopen). Exit: 0 all passed · 1 a failure.
"""
import argparse
import glob
import os
import re
import shutil
import subprocess
import sys

if os.path.dirname(os.path.abspath(__file__)) not in sys.path:
    sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import local_relay  # noqa: E402 — tools/local_relay.py, next to this file

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
# Screen tests (tier 2) need Playwright, which lives in the project's venv (requirements-dev.txt) — never the system
# Python. Everything else runs with the Python that runs this script (the commit hook needs no venv).
VENV_PY = os.path.join(ROOT, ".venv", "Scripts" if os.name == "nt" else "bin", "python.exe" if os.name == "nt" else "python")
VENV_SETUP = "py -m venv .venv   then   .venv\\Scripts\\pip install -r requirements-dev.txt   (in the project folder)"
PATTERNS = ["test/*.test.js", "test/test_*.py", "test/ui/test_*.py", "relay/test-*.mjs"]
HEADER_LINES = 15


def read_header(path):
    """{'tags': [...], 'tier': int|None, 'covers': [...], 'problem': str|None} from the file's first lines."""
    tags, tier, covers = None, None, None
    try:
        with open(path, encoding="utf-8", errors="replace") as f:
            head = [next(f, "") for _ in range(HEADER_LINES)]
    except OSError as e:
        return {"tags": [], "tier": None, "covers": [], "problem": f"can't read it: {e}"}
    for line in head:
        text = re.sub(r"^\s*(//+|#+|\*|/\*\*?)\s?", "", line).strip()
        m = re.match(r"tags:\s*(.*)$", text)
        if m:
            parts = [p.strip() for p in m.group(1).split(",") if p.strip()]
            tags = [p for p in parts if not re.fullmatch(r"tier\s*\d", p)]
            t = [int(re.search(r"\d", p).group()) for p in parts if re.fullmatch(r"tier\s*\d", p)]
            tier = t[0] if t else None
        m = re.match(r"covers:\s*(.*)$", text)
        if m:
            covers = [p.strip() for p in m.group(1).split(",") if p.strip()]
    problem = None
    if tags is None or covers is None:
        problem = "no header — every test file needs 'tags: <areas>, tier N' and 'covers: <files>' in its first lines"
    elif tier is None:
        problem = "its tags: line names no tier ('tier 1', 'tier 2' or 'tier 3')"
    return {"tags": tags or [], "tier": tier, "covers": covers or [], "problem": problem}


class TestFile:
    def __init__(self, path):
        self.path = os.path.abspath(path)
        self.__dict__.update(read_header(self.path))
        if self.path.endswith(".mjs") and self.tier is None:
            self.tier = 3

    def rel(self, base=ROOT):
        return os.path.relpath(self.path, base).replace("\\", "/")


def discover(root=ROOT):
    paths = sorted({p for pat in PATTERNS for p in glob.glob(os.path.join(root, pat))})
    return [TestFile(p) for p in paths]


def select(files, tier=None, tags=None, ids=None, changed=None, base=ROOT):
    """The files to run. tier: an int or 'all' (None = all); tags / ids: any match; changed: repo-relative paths —
    a file is picked when it covers one of them or is one of them."""
    out = []
    for f in files:
        if tier not in (None, "all") and f.tier != tier:
            continue
        if tags and not set(tags) & set(f.tags):
            continue
        if ids:
            try:
                text = open(f.path, encoding="utf-8", errors="replace").read()
            except OSError:
                continue
            if not any(re.search(r"\b" + re.escape(i) + r"\b", text) for i in ids):
                continue
        if changed is not None:
            ch = {c.replace("\\", "/") for c in changed}
            if not (set(f.covers) & ch or f.rel(base) in ch):
                continue
        out.append(f)
    return out


def skip_reason(tf):
    """Why this file won't run here — None = it runs. The ONE place a skip is decided. Nothing skips today: tier 3 brings
    its own relay (2026-11-12) and a missing tool fails loud (RUN-015). A reason added here is reported as skipped — and
    fails a --release run (7.28.0: "31 passed, 2 skipped" read as a pass)."""
    return None


def run_file(tf, relay_url=None, timeout=600):
    """(passed?, output) — runs one test file from the repo root."""
    if tf.path.endswith(".py") and tf.tier == 2:
        if not os.path.exists(VENV_PY):
            return False, f"screen tests need the project's venv (Playwright) — not found at {VENV_PY}.\n  Set it up: {VENV_SETUP}"
        cmd = [VENV_PY, tf.path]
    elif tf.path.endswith(".py"):
        cmd = [sys.executable, tf.path]
    else:
        node = shutil.which("node")
        if not node:
            return False, "node isn't on the PATH"
        cmd = [node, tf.path]
    env = dict(os.environ, PYTHONIOENCODING="utf-8")
    if relay_url:
        env["RELAY_URL"] = relay_url
    try:
        r = subprocess.run(cmd, cwd=ROOT, env=env, capture_output=True, timeout=timeout)
    except subprocess.TimeoutExpired:
        return False, f"timed out after {timeout} s"
    out = (r.stdout + r.stderr).decode("utf-8", "replace")
    return r.returncode == 0, out


def changed_files():
    names = set()
    for args in (["git", "diff", "--cached", "--name-only"], ["git", "diff", "--name-only"]):
        out = subprocess.run(args, cwd=ROOT, capture_output=True, text=True, encoding="utf-8").stdout or ""
        names |= {ln.strip() for ln in out.splitlines() if ln.strip()}
    return sorted(names)


def main(argv=None, files=None, relay=None):
    """files: the test files to choose from (None = every one in the repo); relay: makes the local relay for tier 3
    (None = the real one) — both for the runner's own tests (test/test_run_tests.py)."""
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    ap = argparse.ArgumentParser(description="Run ReaderWrangler's tests (docs/design/TESTING.md).")
    ap.add_argument("--tier", default="1", choices=["1", "2", "3", "all"])
    ap.add_argument("--tag", action="append", default=[])
    ap.add_argument("--id", action="append", default=[])
    ap.add_argument("--changed", action="store_true", help="only tests covering what changed (staged + unstaged)")
    ap.add_argument("--relay-url", default=os.environ.get("RELAY_URL"),
                    help="a relay you started, for tier 3 (default: the runner starts and stops its own local relay)")
    ap.add_argument("--list", action="store_true", help="show what would run, run nothing")
    ap.add_argument("--quiet", action="store_true", help="print only failures and the summary (the commit hook)")
    ap.add_argument("--release", action="store_true",
                    help="a release run: a skipped file FAILS the run (the release checklist: py tools/run_tests.py "
                         "--tier all --release)")
    a = ap.parse_args(argv)

    tier = "all" if a.tier == "all" else int(a.tier)
    files = discover() if files is None else files
    broken = [f for f in files if f.problem]
    chosen = select([f for f in files if not f.problem], tier=tier, tags=a.tag or None, ids=a.id or None,
                    changed=changed_files() if a.changed else None)

    if a.list:
        for f in chosen:
            print(f"  tier {f.tier}  {f.rel():40}  tags: {', '.join(f.tags)}")
        for f in broken:
            print(f"  ✗ {f.rel()}: {f.problem}")
        print(f"{len(chosen)} file(s) would run")
        return 0

    count = {"passed": 0, "failed": 0}
    for f in broken:
        count["failed"] += 1
        print(f"✗ {f.rel()}: {f.problem}")
    if not chosen and not broken:
        if not a.quiet:   # the commit hook stays silent when no test covers the change (Law 12: no noise on the normal path)
            print("No tests cover these changes." if a.changed else "No tests match.")
        return 0
    skipped = [(f, why) for f, why in ((f, skip_reason(f)) for f in chosen) if why]
    chosen = [f for f in chosen if not any(f is s for s, _ in skipped)]
    if not a.quiet or a.release:
        for f, why in skipped:
            print(f"- {f.rel()}: skipped — {why}")

    def run_and_report(f, relay_url):
        ok, out = run_file(f, relay_url=relay_url)
        summary = next((ln for ln in reversed(out.splitlines()) if re.search(r"\bpassed\b", ln)), "")
        if ok:
            count["passed"] += 1
            if not a.quiet:
                print(f"✓ {f.rel()}  {summary.strip()}")
        else:
            count["failed"] += 1
            print(f"✗ {f.rel()}  {summary.strip()}")
            for ln in out.splitlines():
                if "✗" in ln or "Error" in ln or "FAIL" in ln or ln.startswith("      "):
                    print("    " + ln)

    # Tier 3 with no --relay-url: the runner starts its OWN local relay around the relay files, then stops it and checks
    # everything it started is gone and its ports are free (local_relay.py). A given --relay-url is used as is.
    own_relay = [f for f in chosen if f.tier == 3] if not a.relay_url else []
    for f in chosen:
        if f not in own_relay:
            run_and_report(f, a.relay_url)
    if own_relay:
        r = (relay or local_relay.LocalRelay)()
        if not a.quiet:
            print("· starting a local relay for the relay tests (wrangler dev --local, on a free port)…")
        try:
            url = r.start()
        except local_relay.RelayError as e:
            count["failed"] += 1
            print(f"✗ local relay: {e}\n    not run: " + ", ".join(f.rel() for f in own_relay))
        else:
            try:
                for f in own_relay:
                    run_and_report(f, url)
            finally:
                left = r.stop()
            if left:
                count["failed"] += 1
                print("✗ local relay: not everything it started was stopped —\n    " + "\n    ".join(left))
            elif not a.quiet:
                print(f"✓ local relay stopped — every process it started is gone, ports {', '.join(map(str, r.ports))} free")
    print(f"Tests: {count['passed']} file(s) passed, {count['failed']} failed"
          + (f", {len(skipped)} skipped" if skipped else ""))
    if a.release and skipped:    # a release needs every file to have RUN — skipped is not passed (7.28.0)
        print(f"✗ release run: {len(skipped)} file(s) skipped — a release needs every file to run:\n    "
              + "\n    ".join(f"{f.rel()} — {why}" for f, why in skipped))
        return 1
    return 1 if count["failed"] else 0


if __name__ == "__main__":
    if ROOT not in sys.path:
        sys.path.insert(0, ROOT)   # the pytools submodule lives at the repo root
    try:
        from pytools.keepopen import run
    except ImportError:
        sys.exit(main())
    run(main, pause="always")
