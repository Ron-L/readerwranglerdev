#!/usr/bin/env python3
"""
check-saved-reads.py — refuse a commit that reads a saved value with a bare JSON.parse instead of the one reader,
uiHelpers.js readSaved (7.29.1; TODO "One safe way to read saved settings…", 20261109-0912 — decided by Ron, 2026-11-13:
"Must").

WHY: both apps read ~30 saved settings and notes from the browser, each with its own hand-written guard — or none. A
damaged phone settings note blanked the phone app; a damaged old-format folders note stopped the desktop library from
loading. One reader fixed them all (the saved value when it reads and is the right kind, else the default and one
warning in Diagnostics) — and a guard nobody wrote can't be noticed until it bites, so a new bare read is refused here,
the way the logging check refuses a stray message code.

WHAT: in the scripts that can call readSaved — readerwrangler.js, mobile.js, and every script readerwrangler.html loads
from uiHelpers.js on (read from the page, so a new module is covered the day the page loads it) — a JSON.parse of a
storage read (`.getItem(…)`, directly or through a variable) is refused unless its line, or the comment lines directly
above it, says `not-readSaved: <why>`. Checks the STAGED copies of the staged files in scope. The JavaScript is read by
git-hooks/saved-reads-js.js (Babel: the apps are JSX). Tested by test/test_check_saved_reads.py.

  python git-hooks/check-saved-reads.py          the commit check (staged files)
  python git-hooks/check-saved-reads.py --all    every script in scope, as committed + staged, with the allowed reads listed

Exit: 0 clean · 1 refused (each read named: file, line, code) · 2 setup problem — fails LOUD.
"""
import json
import os
import re
import shutil
import subprocess
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
PAGE = "readerwrangler.html"
APPS = ("readerwrangler.js", "mobile.js")          # loaded by the page at run time (as their dist/ builds), after it
READER_HOME = "uiHelpers.js"
SCRIPT_SRC = re.compile(r'<script\b[^>]*\bsrc="([^"?#]+)')


def staged_text(path):
    r = subprocess.run(["git", "show", ":" + path], capture_output=True)
    return r.stdout.decode("utf-8", "replace") if r.returncode == 0 else None


def scope(page_text):
    """The scripts that can call readSaved: the apps, plus every local script the page loads from uiHelpers.js on."""
    srcs = [s for s in SCRIPT_SRC.findall(page_text or "") if "//" not in s and s.endswith(".js")]   # local scripts only
    if READER_HOME not in srcs:
        print(f"check-saved-reads: SETUP - {PAGE} no longer loads {READER_HOME}, so the scope can't be read.", file=sys.stderr)
        raise SystemExit(2)
    after = [s for s in srcs[srcs.index(READER_HOME):] if not s.startswith("dist/")]
    return list(APPS) + [s for s in after if s not in APPS]


def find_reads(files):
    """files: [(path, text)] → {"bare": [...], "allowed": [...], "unparsed": [...]} (see saved-reads-js.js)."""
    if not files:
        return {"bare": [], "allowed": [], "unparsed": []}
    node = shutil.which("node")
    if not node:
        print("check-saved-reads: SETUP - node isn't on the PATH, so the scripts can't be read.", file=sys.stderr)
        raise SystemExit(2)
    payload = json.dumps([{"path": p, "src": s} for p, s in files])
    r = subprocess.run([node, os.path.join(HERE, "saved-reads-js.js")], input=payload.encode("utf-8"), capture_output=True)
    if r.returncode:
        sys.stderr.write(r.stderr.decode("utf-8", "replace"))
        raise SystemExit(2)
    return json.loads(r.stdout.decode("utf-8"))


def staged_in_scope():
    out = subprocess.run(["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
                         capture_output=True, text=True, encoding="utf-8", errors="replace").stdout or ""
    staged = {ln.strip() for ln in out.splitlines() if ln.strip()}
    in_scope = scope(staged_text(PAGE))
    return [(p, staged_text(p)) for p in in_scope if p in staged]


def report(found):
    if found["unparsed"]:   # the parse check names these properly; don't pass a file this check couldn't read
        for u in found["unparsed"]:
            print(f"  x {u['path']}: couldn't be read ({u['error']})", file=sys.stderr)
    if found["bare"]:
        print("\n[CHECK-SAVED-READS] commit refused - a saved value read without the one reader:", file=sys.stderr)
        for b in found["bare"]:
            print(f"  x {b['path']}:{b['line']}  {b['code']}", file=sys.stderr)
        print("\nRead it with readSaved(name, fallback, kind) from uiHelpers.js — e.g. readSaved(FILTERS_KEY, null, 'object')"
              " — which gives the default and one warning when the saved copy is damaged. If this read truly can't use it,"
              " say why on the line above: // not-readSaved: <why>\n", file=sys.stderr)
    return 1 if (found["bare"] or found["unparsed"]) else 0


def main(argv):
    for stream in (sys.stdout, sys.stderr):   # the code it quotes may hold any character (a Windows console is cp1252)
        stream.reconfigure(encoding="utf-8", errors="replace")
    if "--all" in argv:
        in_scope = scope(staged_text(PAGE))
        found = find_reads([(p, staged_text(p)) for p in in_scope if staged_text(p) is not None])
        print(f"check-saved-reads: {len(in_scope)} scripts in scope: {', '.join(in_scope)}")
        print(f"Allowed reads ({len(found['allowed'])}), each with its why:")
        for a in found["allowed"]:
            print(f"  - {a['path']}:{a['line']}  {a['why']}")
        rc = report(found)
        if not rc:
            print("No bare reads.")
        return rc
    return report(find_reads(staged_in_scope()))


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
