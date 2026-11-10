#!/usr/bin/env python3
"""
time_load.py — how long ReaderWrangler takes to open ("Faster loading", TODO; 2026-11-10). Three moments, each from the
page starting to load:
  app on screen      — the app has replaced the splash
  books in           — the left pane's "All Books (N)" shows a number (the library's data is loaded)
  folders on screen  — one of the library's own top-level folders is in the left pane (the load set the folders —
                       what a person sees as "loaded"; the word "Inbox" is drawn before that, so it can't tell)
Uses the screen-test driver (test/ui/rw.py): a throwaway Chrome profile on this PC, the page served by serve.py; the
driver blocks Amazon (covers get a stand-in image) and real relays.

    .venv\\Scripts\\python tools/time_load.py            the test library (23 books), 5 loads
    .venv\\Scripts\\python tools/time_load.py --large    Ron's 3,270-book library (the private repo's test copy)
    .venv\\Scripts\\python tools/time_load.py --runs 3

Before timing, it lets the app fill its cover cache the way a person's browser already has it (2026-11-10: an empty
cache hid seconds Ron could count). The first timed load is reported apart; the average is over the loads after it.
"""
import argparse
import gzip
import json
import os
import statistics
import sys
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "test", "ui"))
from rw import FIXTURE, APP_TIMEOUT_MS, App   # noqa: E402

LARGE = os.path.join(ROOT, ".private", "test", "large-sample-private.json.gz")
MOMENTS = ("app on screen", "books in", "folders on screen")

# Before the page's scripts, on every load: note each moment (see the top). Text checks, so any view works.
# FOLDER is replaced by a top-level folder name from the library being timed (JSON-quoted).
MARK = """(function () {
    var FOLDER_NAME = FOLDER;
    function el(text) {
        return document.evaluate("//*[text()[normalize-space()='" + text + "']]", document, null, 9, null).singleNodeValue;
    }
    function booksIn() {
        for (var p = el('All Books'), p = p && p.parentElement, i = 0; p && i < 4; p = p.parentElement, i++) {
            var m = /\\((\\d[\\d,]*)\\)/.exec(p.textContent);
            if (m) return parseInt(m[1].replace(/,/g, ''), 10) > 0;
        }
        return false;
    }
    new MutationObserver(function (_, obs) {
        var now = performance.now();
        if (window.__rwSplashGone === undefined && document.readyState !== 'loading' && !document.getElementById('splash'))
            window.__rwSplashGone = now;
        if (window.__rwSplashGone === undefined) return;
        if (window.__rwBooksIn === undefined && booksIn()) window.__rwBooksIn = now;
        if (window.__rwFoldersShown === undefined && el(FOLDER_NAME)) window.__rwFoldersShown = now;
        if (window.__rwBooksIn !== undefined && window.__rwFoldersShown !== undefined) obs.disconnect();
    }).observe(document, { childList: true, subtree: true, characterData: true });
})();"""


def a_top_folder(library):
    """A top-level folder's name from the backup file (not the Inbox; none with a quote, which the text check can't
    hold). Read in memory only — never printed."""
    raw = gzip.open(library).read() if library.endswith(".gz") else open(library, "rb").read()
    folders = (json.loads(raw).get("organization") or {}).get("folders") or []
    return next(f["name"] for f in folders
                if f.get("parentId") is None and f.get("name") not in (None, "Inbox") and "'" not in f["name"])


def one_load(app):
    """Seconds to each of MOMENTS."""
    app.page.reload()
    app.page.wait_for_selector("#splash", state="detached", timeout=APP_TIMEOUT_MS)
    app.page.wait_for_function("window.__rwBooksIn !== undefined && window.__rwFoldersShown !== undefined",
                               timeout=APP_TIMEOUT_MS)
    return app.page.evaluate("[window.__rwSplashGone, window.__rwBooksIn, window.__rwFoldersShown].map(t => t / 1000)")


def fill_cover_cache(app):
    """Load once, then wait until the app's cover cache stops growing (or 3 minutes) — a person's browser has it full."""
    app.reload()
    count = lambda: app.page.evaluate("caches.open('rw-covers').then(c => c.keys()).then(k => k.length)")  # noqa: E731
    last, steady, deadline = -1, 0, time.time() + 180
    while steady < 2 and time.time() < deadline:
        n = count()
        steady = steady + 1 if n == last else 0
        last = n
        app.page.wait_for_timeout(2000)
    return last


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
        cached = fill_cover_cache(app)
        app.ctx.add_init_script(MARK.replace("FOLDER;", json.dumps(a_top_folder(library)) + ";", 1))
        first = one_load(app)
        times = [one_load(app) for _ in range(a.runs)]
    name = "3,270-book library" if a.large else "test library"
    print(f"{name} (covers in the app's cache: {cached})")
    for k, what in enumerate(MOMENTS):
        print(f"  {what:18}: first load {first[k]:.1f} s; then {', '.join(f'{t[k]:.1f}' for t in times)} s — "
              f"average {statistics.mean(t[k] for t in times):.1f} s")


if __name__ == "__main__":
    main()
