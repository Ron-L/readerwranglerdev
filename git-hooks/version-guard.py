#!/usr/bin/env python3
"""
version-guard.py — RW pre-commit chokepoint for version stamps. Called by git-hooks/pre-commit (run by git; saved in
the repo since 2026-10-15 — it used to live in the unsaved .claude/hooks/).

WHY: nothing enforced the "every runtime change gets a version bump" rule. The pre-build
gate (gate-check.py) is only an 11-point CHECKLIST — it never verifies the version actually
moved — so a bump could be silently forgotten (7.18.0-alpha.19 shipped without one; the
on-screen build marker lagged at alpha.18 until Ron caught it). This makes the bump STRUCTURAL:
a commit that touches shipped code but forgets its version stamp is refused.

RULE — for each STAGED code file, its version stamp must ALSO change in the same commit:

  readerwrangler.js   -> ORGANIZER_VERSION  (internal const, same file)
  mobile.js           -> MOBILE_VERSION      (internal const, same file)
  relay/relay-worker.js -> WORKER_VERSION    (internal const, same file — shown in the relay's emails)
  <module>.js         -> its  <module>.js?v=  cache-buster line in readerwrangler.html
  readerwrangler.css  -> its  readerwrangler.css?v=  cache-buster line in readerwrangler.html
  APP_VERSION change  -> docs/design/SUPPORT-KB.md's stamp says "through release <that version>" (a release must
                         sweep the help notes; 2026-10-20)

<module>.js are the local scripts readerwrangler.html loads with a ?v= buster. readerwrangler.js
and mobile.js are the exceptions: their HTML buster is APP_VERSION (frozen during alpha testing),
so they carry an INTERNAL const that bumps every alpha instead.

Deliberate exception (Ron's call only, per CLAUDE.md): git commit --no-verify.
"""
import datetime
import subprocess
import sys
import re

HTML = "readerwrangler.html"


def html_modules():
    """The local module scripts readerwrangler.html loads with a ?v= cache-buster — DERIVED from the page (2026-11-08), so
    a new module is covered without anyone editing this file. The hand-kept list it replaces had missed logger.js, whose
    buster then never moved. (readerwrangler.js and mobile.js load another way and keep their own version rules.)"""
    staged = subprocess.run(["git", "show", ":" + HTML], capture_output=True)
    if staged.returncode == 0:
        text = staged.stdout.decode("utf-8", "replace")
    else:
        try:
            with open(HTML, encoding="utf-8") as f:
                text = f.read()
        except OSError:
            return []
    return sorted(set(re.findall(r'<script src="([A-Za-z0-9_.-]+)\.js\?v=', text)))


def staged_files():
    out = subprocess.run(
        ["git", "diff", "--cached", "--name-only", "--diff-filter=ACM"],
        capture_output=True, text=True, encoding="utf-8", errors="replace").stdout or ""
    # git reports paths repo-relative with forward slashes; we match on basename anyway.
    return set(line.strip() for line in out.splitlines() if line.strip())


def added_lines(path):
    """The '+' side of the staged diff for `path` (new/changed lines only)."""
    out = subprocess.run(
        ["git", "diff", "--cached", "--unified=0", "--", path],
        capture_output=True, text=True, encoding="utf-8", errors="replace").stdout or ""
    return [ln[1:] for ln in out.splitlines()
            if ln.startswith("+") and not ln.startswith("+++")]


def const_bumped(path, const_name):
    pat = re.compile(re.escape(const_name) + r"\s*=")
    return any(pat.search(ln) for ln in added_lines(path))


def html_buster_bumped(basename):
    """A '+' line in the staged HTML diff that sets  basename?v=..."""
    pat = re.compile(re.escape(basename) + r"\?v=")
    return any(pat.search(ln) for ln in added_lines(HTML))


NOT_SHIPPED_DIRS = ("git-hooks/", "test/", "docs/", "v4/", "tools/", ".claude/", "pytools/", "post-mortems/")  # tools/ (dev tools, incl. the demo library prep) replaced tutorials/ 2026-11-02


def shipped_code_staged(files):
    """Any staged .js / .html / .css that is part of the product (the app, phone app, modules, fetchers, worker, pages)."""
    return any(f.endswith((".js", ".html", ".css")) and not f.startswith(NOT_SHIPPED_DIRS) for f in files)


def staged_copyright_year():
    """The LAST year in COPYRIGHT_YEARS ("2025, 2026") from the STAGED readerwrangler.html (so a commit that appends
    the new year passes). None if the constant is missing."""
    out = subprocess.run(["git", "show", ":" + HTML], capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stdout or ""
    m = re.search(r"const\s+COPYRIGHT_YEARS\s*=\s*[\"']([^\"']*)[\"']", out)
    years = [int(y) for y in re.findall(r"\d{4}", m.group(1))] if m else []
    return years[-1] if years else None


KB = "docs/design/SUPPORT-KB.md"


def staged_app_version():
    """The new APP_VERSION if this commit changes it (a '+' line in the staged HTML diff), else None."""
    for ln in added_lines(HTML):
        m = re.search(r"const\s+APP_VERSION\s*=\s*[\"']([^\"']+)[\"']", ln)
        if m:
            return m.group(1)
    return None


def kb_stamp_names(version):
    """True if the STAGED help notes' "up to date" stamp says "through release <version>"."""
    out = subprocess.run(["git", "show", ":" + KB], capture_output=True, text=True,
                         encoding="utf-8", errors="replace").stdout or ""
    return re.search(r"through release " + re.escape(version) + r"\b", out) is not None


def main():
    files = staged_files()
    # Match on basename so the guard is location-agnostic.
    names = set(f.split("/")[-1] for f in files)
    html_staged = HTML in names
    errors = []

    if "readerwrangler.js" in names and not const_bumped("readerwrangler.js", "ORGANIZER_VERSION"):
        errors.append("readerwrangler.js is staged but ORGANIZER_VERSION was not bumped.")

    if "mobile.js" in names and not const_bumped("mobile.js", "MOBILE_VERSION"):
        errors.append("mobile.js is staged but MOBILE_VERSION was not bumped.")

    # The relay worker carries its own stamp (7.22.0, Ron 2026-10-14) — printed in every summary email, so an email
    # shows which deploy sent it. Same X.Y.Z-alpha.N scheme as the app.
    if "relay-worker.js" in names and not const_bumped("relay/relay-worker.js", "WORKER_VERSION"):
        errors.append("relay/relay-worker.js is staged but WORKER_VERSION was not bumped.")

    for m in html_modules():
        fn = m + ".js"
        if fn in names and not (html_staged and html_buster_bumped(fn)):
            errors.append(f"{fn} is staged but its `{fn}?v=` cache-buster in {HTML} was not bumped.")

    if "readerwrangler.css" in names and not (html_staged and html_buster_bumped("readerwrangler.css")):
        errors.append(f"readerwrangler.css is staged but its `readerwrangler.css?v=` cache-buster in {HTML} was not bumped.")

    # v7.21.2 (Ron, 2026-10-16) - COPYRIGHT_YEARS (readerwrangler.html) lists every year the code changed ("2025, 2026");
    # About shows it as is. A list, not a range: skipped years aren't claimed. The first commit of shipped code in a new
    # year must append that year — so the claim grows only when the code really changes.
    if shipped_code_staged(files):
        year_now = datetime.date.today().year
        year_last = staged_copyright_year()
        if year_last is None:
            errors.append(f'COPYRIGHT_YEARS not found in the staged {HTML} (expected `const COPYRIGHT_YEARS = "2025, 2026";`).')
        elif year_now > year_last:
            errors.append(f"shipped code changed in {year_now}, but COPYRIGHT_YEARS in {HTML} ends at {year_last} "
                          f'- append ", {year_now}" in this commit.')

    # 7.23.0 (Ron, 2026-10-20) - a RELEASE (APP_VERSION moves only at release) must sweep the help notes: the commit is
    # refused unless SUPPORT-KB's "up to date" stamp says "through release <that version>". The stamp alone was a
    # promise nothing checked — 7.21.3's Bibliography change went unswept for 4 days while it said "through 7.21.2".
    app_version = staged_app_version() if html_staged else None
    if app_version and not kb_stamp_names(app_version):
        errors.append(f"APP_VERSION moves to {app_version} (a release), but {KB}'s stamp doesn't say "
                      f'"through release {app_version}" - sweep the help notes for this release, then update the stamp.')

    if errors:
        sys.stderr.write("\n[VERSION-GUARD] commit blocked - a runtime change needs its version stamp moved:\n")
        for e in errors:
            sys.stderr.write("  x " + e + "\n")
        sys.stderr.write("\nFix: bump the stamp in the SAME commit. Deliberate exception: git commit --no-verify.\n\n")
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
