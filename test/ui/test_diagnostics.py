# Screen test: the Diagnostics window — the log you can read, filter, copy and clear, opened from Help and from the 🕐.
# tags: logging, diagnostics, tier 2
# covers: readerwrangler.js, logkit/logger.js, logkit-settings.js, logkit/diagnostics-window.js
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
        app.stub_outside()      # the driver's one clipboard recorder (7.29.1: was a hand-written stub of its own)
        page.locator("[data-diag-level]").select_option("error")     # a filter must NOT narrow the copy
        page.locator(WINDOW).get_by_role("button", name="Copy diagnostics").click()
        page.wait_for_function("() => window._copied.length > 0", timeout=5000)
        text = app.copied()[-1]
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

    # 2026-11-10 (Ron, trying alpha.27): lines from an earlier day show their date, today's don't — and the columns
    # after the time didn't line up; and a bare ▸ on only some lines read as "missing", not "nothing more to see"
    def columns_line_up():
        # the older line goes in BEFORE the page's own scripts on the next load (an edit to the saved log while the page
        # is open is overwritten by the page's own save as it unloads — measured: the first form of this test passed
        # without the dated line at all)
        app.ctx.add_init_script("""try { if (!sessionStorage.getItem('rw-test-older-line')) {
            const log = JSON.parse(localStorage.getItem('readerwrangler-log') || '[]');
            log.unshift({ time: Date.now() - 3 * 86400e3, level: 'info', code: 'BOOT', area: 'BOOT', text: 'an older line', count: 1 });
            localStorage.setItem('readerwrangler-log', JSON.stringify(log)); sessionStorage.setItem('rw-test-older-line', '1'); } } catch (e) {}""")
        app.reload()
        plant(app, "info", "MOVE", "a line from today")
        app.menu("Help", "Diagnostics").click()
        page.locator(WINDOW).wait_for(timeout=10_000)
        older = page.locator(ROWS).filter(has_text="an older line")
        check(older.count() == 1, "the older line isn't in the window — the test didn't set up what it tests")
        check(re.search(r"[A-Z][a-z]{2} \d", older.first.inner_text()), "the older line shows no date: " + older.first.inner_text())
        xs = page.evaluate("() => [...document.querySelectorAll('[data-diag-code]')].map(e => Math.round(e.getBoundingClientRect().left))")
        check(len(xs) >= 2 and len(set(xs)) == 1, f"the code column starts at {sorted(set(xs))} — not one place")
    test("DIAG-008", "every line's columns line up, whether its time shows a date (an earlier day) or not (today)",
         columns_line_up)

    def details_label():
        plant(app, "warning", "PREF-02", "a line with details", {"error": "quota"})
        row = page.locator(ROWS).filter(has_text="a line with details").first
        row.wait_for(timeout=5000)
        check("details ▸" in row.inner_text(), "no visible 'details ▸' on a line that has details: " + row.inner_text())
        check("details" not in page.locator(ROWS).filter(has_text="a line from today").first.inner_text(),
              "a line without details shows the label")
        check(page.locator(WINDOW).get_by_text("show “details ▸”", exact=False).count() == 1,
              "no line telling the person what 'details ▸' means")
        page.keyboard.press("Escape")
    test("DIAG-009", "a line with details says so in words ('details ▸'), with one line explaining it; others don't",
         details_label)

    # 2026-11-11 (7.28.0, Ron): "Send a test message" — support can ask a person to press it, then Copy diagnostics, and
    # see the log, the banner and the copy work, with no real failure. One error marked TEST (UI-07); the banner shows it
    # when its switch is on; when it's off, a note says so and names the switch (in the same window). Never the critical box.
    def test_message():
        app.menu("Help", "Diagnostics").click()
        page.locator(WINDOW).wait_for(timeout=10_000)
        page.evaluate("() => { const b = document.getElementById('rw-log-banner'); if (b) b.remove(); }")
        page.locator(WINDOW).get_by_role("button", name="Send a test message").click(timeout=5000)
        row = page.locator(ROWS).filter(has_text="A test message from Diagnostics").first
        row.wait_for(timeout=5000)
        check("error" in row.inner_text() and "UI-07" in row.inner_text() and "TEST" in row.inner_text(),
              "the test message isn't an error, UI-07, badged TEST: " + row.inner_text())
        page.locator("#rw-log-banner").wait_for(timeout=5000)
        banner = page.locator("#rw-log-banner").inner_text()
        check("UI-07-!TEST!" in banner and "A test message from Diagnostics" in banner, f"the banner says: {banner!r}")
        check(page.locator("#rw-log-critical").count() == 0, "the test message raised the critical box")

        page.locator("#rw-log-banner").get_by_text("Dismiss", exact=True).click()
        page.locator("[data-diag-switch=errorBanner]").uncheck()
        page.locator(WINDOW).get_by_role("button", name="Send a test message").click()
        page.get_by_text("the banner is off", exact=False).first.wait_for(timeout=5000)
        note = page.evaluate("() => window.rwLog.entries().filter(e => /banner is off/.test(e.text)).map(e => e.text)")
        check(note and "Show a banner when something goes wrong" in note[-1], f"the note doesn't name the switch: {note}")
        check(page.locator("#rw-log-banner").count() == 0, "a banner appeared with the banner switch off")
        page.locator("[data-diag-switch=errorBanner]").check()
        page.keyboard.press("Escape")
    test("DIAG-010", "Send a test message: an error marked TEST (UI-07) — the banner shows it, or a note says the banner is off",
         test_message)

    # 7.29.1 (TODO 20261112-1755 "Copy buttons tell the truth"): on a page with NO clipboard (an insecure address — a phone
    # reaching a copy on the home network), Copy diagnostics said "Diagnostics copied" with nothing copied. Now it goes
    # through the kit's one copy routine: no clipboard is a refusal, and the person is told.
    def copy_without_clipboard():
        page.evaluate("() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })")
        check(page.evaluate("() => navigator.clipboard === undefined"), "the test didn't take the clipboard away")
        n0 = len(app.console)
        app.menu("Help", "Diagnostics").click()
        page.locator(WINDOW).wait_for(timeout=10_000)
        page.locator(WINDOW).get_by_role("button", name="Copy diagnostics").click()
        page.locator(".clipboard-toast", has_text="couldn't be copied").first.wait_for(timeout=5000)
        said = [x for _, x in app.console[n0:] if "Diagnostics co" in x]
        check(not [x for x in said if "Diagnostics copied" in x], f"it still says copied: {said}")
        check([x for x in said if x.startswith("warning · UI-06 · Diagnostics couldn't be copied")], f"no UI-06 refusal: {said}")
        page.keyboard.press("Escape")
    test("DIAG-011", "Copy diagnostics on a page with no clipboard says it couldn't be copied — never \"copied\"",
         copy_without_clipboard)

done()
