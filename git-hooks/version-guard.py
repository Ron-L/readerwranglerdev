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
  any file a page loads with a literal stamp (src="X?v=…" / href="X?v=…": modules, readerwrangler.css,
  dist/tailwind.css) -> that stamp in EVERY page that loads it (2026-11-11: the pages are read, not listed — the
                         reset page's stamps were never checked while only readerwrangler.html was)
  APP_VERSION change  -> docs/design/SUPPORT-KB.md's stamp says "through release <that version>" (a release must
                         sweep the help notes; 2026-10-20)

readerwrangler.js and mobile.js are the exceptions: they're loaded with APP_VERSION as their stamp (frozen during
alpha testing), so they carry an INTERNAL const that bumps every alpha instead.

Deliberate exception (Ron's call only, per CLAUDE.md): git commit --no-verify.
"""
import datetime
import subprocess
import sys
import re

HTML = "readerwrangler.html"


# A page's local, stamped reference: src="storage.js?v=…", href="dist/tailwind.css?v=…" (an outside address has a ":").
STAMPED_REF = re.compile(r'(?:src|href)="([A-Za-z0-9_./-]+)\?v=')


def pages():
    """{page: its staged text} for every page at the repo root — the pages are READ, never listed (2026-11-11: a list of
    one page, readerwrangler.html, left the reset page's stamps unchecked; 2026-11-08: a hand-kept module list had
    missed logger.js)."""
    out = subprocess.run(["git", "ls-files", "--", "*.html"], capture_output=True, text=True).stdout or ""
    result = {}
    for page in (p for p in out.split() if "/" not in p):
        r = subprocess.run(["git", "show", ":" + page], capture_output=True)
        if r.returncode == 0:
            result[page] = r.stdout.decode("utf-8", "replace")
    return result


def stamp_problems(staged, page_texts, added):
    """Every staged file must have its `file?v=` stamp moved in EVERY page that loads it with one. staged: repo-relative
    paths; page_texts: {page: text}; added(page): that page's added lines. (readerwrangler.js and mobile.js are stamped
    by APP_VERSION at run time — no literal stamp — and keep their own rule below.)"""
    problems = []
    for page, text in sorted(page_texts.items()):
        for ref in sorted(set(STAMPED_REF.findall(text))):
            if ref in staged and not any(re.search(re.escape(ref) + r"\?v=", ln) for ln in added(page)):
                problems.append(f"{ref} is staged but its `{ref}?v=` cache-stamp in {page} was not moved.")
    return problems


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

    # every page that loads a staged file with a literal stamp — modules, stylesheets, the built styles (2026-11-11)
    errors += stamp_problems(files, pages(), added_lines)

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
