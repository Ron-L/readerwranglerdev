#!/usr/bin/env python3
"""
time_load.py — how long ReaderWrangler takes to open: from the page starting to load until the app replaces the
splash screen ("Faster loading", TODO; 2026-11-10). Uses the screen-test driver (test/ui/rw.py): a throwaway Chrome
profile on this PC, the page served by serve.py, nothing sent anywhere.

    .venv\\Scripts\\python tools/time_load.py            the test library (23 books), 5 loads
    .venv\\Scripts\\python tools/time_load.py --large    Ron's 3,270-book library (the private repo's test copy)
    .venv\\Scripts\\python tools/time_load.py --runs 3

The first load after the restore is reported apart (a fresh profile has nothing cached); the average is over the
loads after it — what a person opening the app again sees.
"""
import argparse
import os
import statistics
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "test", "ui"))
from rw import FIXTURE, APP_TIMEOUT_MS, App   # noqa: E402

LARGE = os.path.join(ROOT, ".private", "test", "large-sample-private.json.gz")

# Before the page's scripts, on every load: note the moment the splash leaves (the app has replaced it), and the moment
# the left pane's "All Books (N)" shows a number above 0 (the library itself loaded — whatever view opens; a folder can
# show only subfolders, so a book row isn't a reliable sign).
MARK = """(function () {
    function booksShown() {
        var el = document.evaluate("//*[text()[normalize-space()='All Books']]", document, null, 9, null).singleNodeValue;
        for (var p = el && el.parentElement, i = 0; p && i < 4; p = p.parentElement, i++) {
            var m = /\\((\\d[\\d,]*)\\)/.exec(p.textContent);
            if (m) return parseInt(m[1].replace(/,/g, ''), 10) > 0;
        }
        return false;
    }
    new MutationObserver(function (_, obs) {
        if (window.__rwSplashGone === undefined && document.readyState !== 'loading' && !document.getElementById('splash'))
            window.__rwSplashGone = performance.now();
        if (window.__rwSplashGone !== undefined && booksShown()) { window.__rwBooksShown = performance.now(); obs.disconnect(); }
    }).observe(document, { childList: true, subtree: true, characterData: true });
})();"""


def one_load(app):
    """(seconds until the app replaced the splash, seconds until the first book was on screen)"""
    app.page.reload()
    app.page.wait_for_selector("#splash", state="detached", timeout=APP_TIMEOUT_MS)
    app.page.wait_for_function("window.__rwBooksShown !== undefined", timeout=APP_TIMEOUT_MS)
    return app.page.evaluate("[window.__rwSplashGone / 1000, window.__rwBooksShown / 1000]")


def main():
    ap = argparse.ArgumentParser(description=__doc__.split("\n\n")[0])
    ap.add_argument("--large", action="store_true", help="Ron's 3,270-book library instead of the test library")
    ap.add_argument("--runs", type=int, default=5)
    a = ap.parse_args()
    library = LARGE if a.large else FIXTURE
    if not os.path.exists(library):
        sys.exit(f"time_load: {library} isn't here (the large library lives in the private repo's test/ folder)")
    with App(log=None) as app:                       # the page's own defaults: what a person runs
        app.restore(library)
        app.ctx.add_init_script(MARK)
        first = one_load(app)
        times = [one_load(app) for _ in range(a.runs)]
    name = "3,270-book library" if a.large else "test library"
    for k, what in ((0, "app on screen"), (1, "books on screen")):
        print(f"{name}, {what}: first load {first[k]:.1f} s; then {', '.join(f'{t[k]:.1f}' for t in times)} s — "
              f"average {statistics.mean(t[k] for t in times):.1f} s")


if __name__ == "__main__":
    main()
