# Tests for git-hooks/version-guard.py — cache-stamps (`?v=`) move with the files they stamp, in EVERY page.
# tags: commit-checks, build, tier 1
# covers: git-hooks/version-guard.py
# Run: python test/test_version_guard.py
#
# 2026-11-11 ("Faster loading", step 2 — the styles built ahead of time into dist/tailwind.css, linked from three
# pages): the guard checked stamps only in readerwrangler.html, so the reset page's copies of storage.js / logger.js,
# and reset.js (loaded nowhere else), were never checked — 7.27.0-alpha.3/4 moved reset.html's storage.js stamp by hand.
# Now every page's local `file?v=` references are read from the page itself: a staged file must have its stamp moved in
# every page that loads it.
import importlib.util
import os
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("version_guard", os.path.join(ROOT, "git-hooks", "version-guard.py"))
vg = importlib.util.module_from_spec(spec)
spec.loader.exec_module(vg)
sys.path.insert(0, os.path.join(ROOT, "test", "ui"))
from harness import check, done, test   # noqa: E402

PAGES = {
    "readerwrangler.html": '<script src="storage.js?v=1"></script>\n<link rel="stylesheet" href="dist/tailwind.css?v=1">\n'
                           '<script src="https://unpkg.com/react@18/umd/react.production.min.js"></script>\n'
                           "script.src = 'dist/' + 'readerwrangler.js' + '?v=' + APP_VERSION;\n",
    "reset.html": '<script src="storage.js?v=1"></script>\n<script src="reset.js?v=1"></script>\n'
                  '<link rel="stylesheet" href="dist/tailwind.css?v=1">\n',
}


def problems(staged, bumped):
    """bumped: {page: [added lines]}"""
    return vg.stamp_problems(set(staged), PAGES, lambda page: bumped.get(page, []))


def every_page_must_move_it():
    p = problems({"storage.js"}, {"readerwrangler.html": ['<script src="storage.js?v=2"></script>']})
    check(len(p) == 1 and "reset.html" in p[0] and "storage.js" in p[0], f"reset.html's storage.js stamp didn't move: {p}")
    p = problems({"storage.js"}, {"readerwrangler.html": ['<script src="storage.js?v=2"></script>'],
                                  "reset.html": ['<script src="storage.js?v=2"></script>']})
    check(p == [], f"moved in both pages: no problem — {p}")
test("VG-001", "a staged file's stamp must move in EVERY page that loads it (the reset page included)",
     every_page_must_move_it)


def a_page_only_file():
    p = problems({"reset.js"}, {})
    check(len(p) == 1 and "reset.js" in p[0] and "reset.html" in p[0], f"reset.js is loaded only by reset.html: {p}")
test("VG-002", "a file only one page loads (reset.js) is checked in that page", a_page_only_file)


def built_stylesheet():
    p = problems({"dist/tailwind.css"}, {"readerwrangler.html": ['<link rel="stylesheet" href="dist/tailwind.css?v=2">']})
    check(len(p) == 1 and "reset.html" in p[0] and "dist/tailwind.css" in p[0], f"the built stylesheet, every page: {p}")
test("VG-003", "the built stylesheet (dist/tailwind.css) is checked in every page that links it", built_stylesheet)


def not_ours_or_not_stamped_here():
    p = problems({"readerwrangler.js", "dist/readerwrangler.js", "index.html"}, {})
    check(p == [], f"the app script (stamped by APP_VERSION at run time), a page, an unlinked file: no problem — {p}")
test("VG-004", "outside addresses and files no page stamps with a literal ?v= are left alone", not_ours_or_not_stamped_here)

done()
