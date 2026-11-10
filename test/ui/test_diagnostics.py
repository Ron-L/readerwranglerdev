# Screen test: the Diagnostics window — the log you can read, filter, copy and clear, opened from Help and from the 🕐.
# tags: logging, diagnostics, tier 2
# covers: readerwrangler.js, logger.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-09 (7.26.0-alpha.27, LOGGING.md §5 step 5.3 — Ron + Claude): its own window, NOT in Data Status (many messages
# have nothing to do with the data; the log is "a more formal and complete notification history"). Two doors: Help →
# Diagnostics… and "Full log…" at the bottom of the 🕐 history panel. Newest first, one line per entry, ▸ for its details,
# errors tinted, TEST entries badged; the filter on top (level, area, time, test entries); the two switches, Clear and
# Copy diagnostics at the bottom. Messages here are planted by the test, marked TEST.
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import App                       # noqa: E402

WINDOW = "[data-diagnostics]"
ROWS = "[data-diag-row]"


def plant(app, level, code, text, data=None):
    app.page.evaluate("([l, c, t, d]) => window.rwLog.log(l, c, t, d, { test: true })", [level, code, text, data])


def rows(app):
    return app.page.locator(ROWS).all_inner_texts()


with App() as app:
    page = app.page

    def open_from_help():
        app.menu("Help", "Diagnostics").click()
        page.locator(WINDOW).wait_for(timeout=10_000)
        texts = rows(app)
        check(any("Page loaded" in t for t in texts), "the page-load line isn't in the window")
        built = next(i for i, t in enumerate(texts) if "Desktop app" in t)
        loaded = next(i for i, t in enumerate(texts) if "Page loaded" in t)
        check(built < loaded, "not newest first: the build line (written later) is below the page-load line")
    test("DIAG-001", "Help → Diagnostics… opens the window: the kept log, newest first", open_from_help)

    def live_and_details():
        plant(app, "warning", "PREF-02", "a planted warning", {"error": "quota"})
        page.locator(ROWS).filter(has_text="a planted warning").wait_for(timeout=5000)   # the open window updates itself
        row = page.locator(ROWS).filter(has_text="a planted warning").first
        check("TEST" in row.inner_text(), "a planted entry has no TEST badge: " + row.inner_text())
        row.get_by_role("button", name=re.compile("details", re.I)).click()
        page.get_by_text('"error": "quota"').wait_for(timeout=5000)
    test("DIAG-002", "the open window shows a new entry at once; ▸ opens its details; a planted one is badged TEST",
         live_and_details)

    def filters():
        plant(app, "error", "UI-03", "a planted error")
        page.locator(ROWS).filter(has_text="a planted error").wait_for(timeout=5000)
        page.locator("[data-diag-level]").select_option("error")
        texts = rows(app)
        check(any("a planted error" in t for t in texts) and not any("Page loaded" in t for t in texts),
              "Errors and up still shows info lines (or lost the error)")
        page.locator("[data-diag-test]").uncheck()
        check(not any("a planted error" in t for t in rows(app)), "unchecking test entries didn't hide the planted error")
        page.locator("[data-diag-test]").check()
        page.locator("[data-diag-level]").select_option("all")
        page.locator("[data-diag-area]").select_option("BOOT")
        texts = rows(app)
        check(texts and all("BOOT" in t for t in texts), "the area filter let other areas through")
        page.locator("[data-diag-area]").select_option("all")
    test("DIAG-003", "the filters: level (errors and up), test entries hidden or shown, area", filters)

    def copies_everything():
        page.evaluate("() => { window._copied = null; navigator.clipboard.writeText = (t) => { window._copied = t; return Promise.resolve(); }; }")
        page.locator("[data-diag-level]").select_option("error")     # a filter must NOT narrow the copy
        page.locator(WINDOW).get_by_role("button", name="Copy diagnostics").click()
        page.wait_for_function("() => window._copied !== null", timeout=5000)
        text = page.evaluate("() => window._copied")
        check(text.startswith("ReaderWrangler diagnostics — "), text[:80])
        check(re.search(r"Desktop app \d+\.\d+\.\d+(-alpha\.\d+)? \(page ", text), "no build line in the header")
        check("Page loaded" in text and "a planted warning" in text, "the copy isn't everything kept (an info line is missing)")
        page.locator("[data-diag-level]").select_option("all")
    test("DIAG-004", "Copy diagnostics copies EVERYTHING kept (whatever the filter), under a header with the build",
         copies_everything)

    def switches():
        banner, detail = page.locator("[data-diag-switch=errorBanner]"), page.locator("[data-diag-switch=logDetail]")
        check(banner.is_checked() and detail.is_checked(), "the switches don't show the driver's 'both on'")
        banner.uncheck()
        check(page.evaluate("() => window.rwLog.switches()") == {"errorBanner": False, "logDetail": True},
              "unchecking the banner switch didn't turn it (only it) off")
        banner.check()
        check(banner.get_attribute("title") and detail.get_attribute("title"), "a switch has no tooltip")
    test("DIAG-005", "the two switches show and set the logging switches (each with a tooltip)", switches)

    def clears():
        page.locator(WINDOW).get_by_role("button", name="Clear").click()
        check(len(rows(app)) == 0, f"Clear left {len(rows(app))} lines")
        check(page.evaluate("() => window.rwLog.entries().length") == 0, "the kept log wasn't emptied")
        page.keyboard.press("Escape")
        page.locator(WINDOW).wait_for(state="detached", timeout=5000)
    test("DIAG-006", "Clear empties the window and the kept log (like DevTools); Esc closes the window", clears)

    def from_history():
        page.get_by_role("button", name="Recent messages").click()
        page.get_by_role("button", name="Full log…").click()
        page.locator(WINDOW).wait_for(timeout=5000)
        page.keyboard.press("Escape")
    test("DIAG-007", "\"Full log…\" at the bottom of the 🕐 history opens the same window", from_history)

done()
