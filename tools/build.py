#!/usr/bin/env python3
"""
build.py — build the app ahead of time (TODO "Faster loading", 2026-11-10).

The page used to compile readerwrangler.js (and mobile.js) in the browser on EVERY load — about 50 seconds on Ron's PC,
the same with 23 books or 3,270. Now each is compiled once, here, into dist/, and the page loads the compiled copy as a
plain script. Nothing to remember — two chokepoints:
  1. serve.py rebuilds on demand: a request for dist/X.js whose source is newer gets a fresh build first, so the loop
     stays edit → refresh;
  2. the commit check (git-hooks/pre-commit) refuses a commit whose dist/ copy isn't the build of the staged source —
     the built files are committed, so GitHub Pages serves them with no build job to keep.

The compile itself: tools/build/compile.js (Babel 7.29.7 pinned — the version the page ran in the browser). Each
statement keeps its source line, so an error's line number is the source's. Set up once: cd tools/build && npm ci

Usage:  py tools/build.py                 build both (double-clicking works too)
        py tools/build.py --check-staged  the commit check: the staged dist/ copies are the build of the staged sources
Tested by test/test_build.py.
"""
import os
import subprocess
import sys
import threading

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SOURCES = ("readerwrangler.js", "mobile.js")       # the scripts the page used to compile in the browser
OUT_DIR = "dist"
COMPILER = os.path.join(ROOT, "tools", "build", "compile.js")
FOOTER = "\n// Built from {name} by tools/build.py: edit {name}, never this copy (TODO \"Faster loading\").\n"
_lock = threading.Lock()


class BuildError(Exception):
    pass


def out_path(name):
    return os.path.join(ROOT, OUT_DIR, name)


def compile_text(text, name):
    """The built copy of one source's text (its footer included). BuildError with the compiler's message if it fails."""
    if not os.path.isdir(os.path.join(ROOT, "tools", "build", "node_modules")):
        raise BuildError("the build tools aren't installed. Once, in the project folder:  cd tools/build && npm ci")
    r = subprocess.run(["node", COMPILER], input=text.replace("\r\n", "\n"), capture_output=True, text=True,
                       encoding="utf-8", cwd=os.path.join(ROOT, "tools", "build"))
    if r.returncode != 0:
        raise BuildError(f"{name}: {r.stderr.strip()}")
    return r.stdout + FOOTER.format(name=name)


def build(name):
    """Compile one source into dist/ (written whole, then swapped in — never half a file)."""
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        built = compile_text(f.read(), name)
    os.makedirs(os.path.join(ROOT, OUT_DIR), exist_ok=True)
    tmp = out_path(name) + ".tmp"
    with open(tmp, "w", encoding="utf-8", newline="\n") as f:
        f.write(built)
    os.replace(tmp, out_path(name))


def build_if_stale(name):
    """serve.py's rebuild on demand: build when the copy is missing or older than its source. True if it built."""
    with _lock:                                            # two requests at once build once
        src, out = os.path.join(ROOT, name), out_path(name)
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            return False
        build(name)
        return True


def _staged(path):
    r = subprocess.run(["git", "show", f":{path}"], cwd=ROOT, capture_output=True, text=True, encoding="utf-8")
    return r.stdout.replace("\r\n", "\n") if r.returncode == 0 else None


def staged_problems():
    """For the commit check: each staged source whose staged dist/ copy isn't its build. Checked whenever a source or its
    copy is staged (comparing contents, not times: what's committed is what's served)."""
    r = subprocess.run(["git", "diff", "--cached", "--name-only"], cwd=ROOT, capture_output=True, text=True)
    staged = set(r.stdout.split())
    problems = []
    for name in SOURCES:
        if name not in staged and f"{OUT_DIR}/{name}" not in staged:
            continue
        src, out = _staged(name), _staged(f"{OUT_DIR}/{name}")
        try:
            want = compile_text(src, name)
        except BuildError as e:
            problems.append(f"  {name} doesn't compile: {e}")
            continue
        if out is None:
            problems.append(f"  {OUT_DIR}/{name} isn't in this commit")
        elif out != want:
            problems.append(f"  {OUT_DIR}/{name} isn't the build of the {name} being committed")
    return problems


def main():
    if "--check-staged" in sys.argv:
        problems = staged_problems()
        if problems:
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
            print("build: the built copy doesn't match its source:\n" + "\n".join(problems) +
                  "\n  Fix: py tools/build.py, then stage dist/ with the source.", file=sys.stderr)
            return 1
        return 0
    for name in SOURCES:
        build(name)
        print(f"built {OUT_DIR}/{name}")
    return 0


if __name__ == "__main__":
    if "--check-staged" in sys.argv:
        sys.exit(main())
    try:
        from pytools.keepopen import run      # a double-clicked window stays open on failure
    except ImportError:
        sys.exit(main())
    run(main)
