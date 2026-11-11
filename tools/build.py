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
import tempfile
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
        _write(out_path(name), compile_text(f.read(), name))


def build_if_stale(name):
    """serve.py's rebuild on demand: build when the copy is missing or older than its source. True if it built."""
    with _lock:                                            # two requests at once build once
        src, out = os.path.join(ROOT, name), out_path(name)
        if os.path.exists(out) and os.path.getmtime(out) >= os.path.getmtime(src):
            return False
        build(name)
        return True


# ----- step 2 (2026-11-11): the styles. Three pages loaded Tailwind's in-browser builder (cdn.tailwindcss.com, 3.4.17),
# which wrote the styles on every load. Now: dist/tailwind.css, built here with the same Tailwind (tools/build/).
STYLES = "tailwind.css"
TW = os.path.join(ROOT, "tools", "build")
STYLE_INPUTS = (os.path.join(TW, "tailwind.config.js"), os.path.join(TW, "tailwind.input.css"))


def style_sources(paths):
    """The files the styles are read from: every page and script at the project root (never dist/, never other folders)."""
    return sorted(p for p in paths if "/" not in p and p.endswith((".html", ".js")))


def _tracked(including_new=False):
    """git's list of files (what's staged); including_new adds files not yet added but not ignored (a new module)."""
    args = ["git", "ls-files", "--cached"] + (["--others", "--exclude-standard"] if including_new else [])
    return subprocess.run(args, cwd=ROOT, capture_output=True, text=True).stdout.split()


def compile_css(paths):
    """The stylesheet for these files' class names (Tailwind 3.4.17, default settings, minified)."""
    if not os.path.isdir(os.path.join(TW, "node_modules", "tailwindcss")):
        raise BuildError("the build tools aren't installed. Once, in the project folder:  cd tools/build && npm ci")
    with tempfile.TemporaryDirectory() as tmp:
        out = os.path.join(tmp, STYLES)
        env = dict(os.environ, RW_TW_FILES="\n".join(os.path.abspath(p).replace("\\", "/") for p in paths))
        r = subprocess.run(["node", os.path.join(TW, "node_modules", "tailwindcss", "lib", "cli.js"),
                            "-c", STYLE_INPUTS[0], "-i", STYLE_INPUTS[1], "-o", out, "--minify"],
                           cwd=TW, env=env, capture_output=True, text=True, encoding="utf-8")
        if r.returncode != 0 or not os.path.exists(out):
            raise BuildError(f"{STYLES}: {r.stderr.strip()}")
        with open(out, encoding="utf-8") as f:
            return f.read()


def compile_css_texts(texts):
    """compile_css for {name: text} — the commit check's staged copies, written to a scratch folder first."""
    with tempfile.TemporaryDirectory() as tmp:
        paths = []
        for name, text in texts.items():
            paths.append(os.path.join(tmp, name))
            with open(paths[-1], "w", encoding="utf-8", newline="\n") as f:
                f.write(text or "")
        return compile_css(paths)


def build_styles():
    _write(out_path(STYLES), compile_css([os.path.join(ROOT, p) for p in style_sources(_tracked(including_new=True))]))


def styles_if_stale():
    """serve.py's rebuild on demand for the stylesheet: when it's missing or older than any page, script or setting."""
    with _lock:
        out = out_path(STYLES)
        srcs = [os.path.join(ROOT, p) for p in style_sources(_tracked(including_new=True))] + list(STYLE_INPUTS)
        if os.path.exists(out) and os.path.getmtime(out) >= max(os.path.getmtime(p) for p in srcs if os.path.exists(p)):
            return False
        build_styles()
        return True


def _write(path, text):
    """Written whole, then swapped in — never half a file."""
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path + ".tmp", "w", encoding="utf-8", newline="\n") as f:
        f.write(text)
    os.replace(path + ".tmp", path)


def _staged_paths():
    r = subprocess.run(["git", "diff", "--cached", "--name-only"], cwd=ROOT, capture_output=True, text=True)
    return set(r.stdout.split())


def staged_style_problems():
    """For the commit check: when a page, a script, the stylesheet or its settings is staged, the staged stylesheet must
    be exactly the build of the staged pages and scripts."""
    sources = style_sources(_tracked())
    touched = _staged_paths() & (set(sources) | {f"{OUT_DIR}/{STYLES}", "tools/build/tailwind.config.js",
                                                 "tools/build/tailwind.input.css"})
    if not touched:
        return []
    try:
        want = compile_css_texts({p: _staged(p) for p in sources})
    except BuildError as e:
        return [f"  the stylesheet doesn't build: {e}"]
    have = _staged(f"{OUT_DIR}/{STYLES}")
    if have is None:
        return [f"  {OUT_DIR}/{STYLES} isn't in this commit"]
    return [] if have == want else [f"  {OUT_DIR}/{STYLES} isn't the build of the pages and scripts being committed"]


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
        problems = staged_problems() + staged_style_problems()
        if problems:
            sys.stderr.reconfigure(encoding="utf-8", errors="replace")
            print("build: the built copy doesn't match its source:\n" + "\n".join(problems) +
                  "\n  Fix: py tools/build.py, then stage dist/ with the source.", file=sys.stderr)
            return 1
        return 0
    for name in SOURCES:
        build(name)
        print(f"built {OUT_DIR}/{name}")
    build_styles()
    print(f"built {OUT_DIR}/{STYLES}")
    return 0


if __name__ == "__main__":
    if "--check-staged" in sys.argv:
        sys.exit(main())
    try:
        from pytools.keepopen import run      # a double-clicked window stays open on failure
    except ImportError:
        sys.exit(main())
    run(main)
