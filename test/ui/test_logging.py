# Screen test: the logging module's switches and alerts in the real page — the address, the banner, critical for everyone.
# tags: logging, tier 2
# covers: logger.js, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# Build step 3 (docs/design/LOGGING.md §1; Ron + Claude, 2026-11-05/07), reworked by step 5.1 (Ron, 2026-11-09): two
# independent switches replace the ladder of levels — errorBanner (an error raises the red banner: the details, Copy,
# Dismiss, "Turn off this banner") and logDetail (developer detail is recorded too). ?errorBanner=on / ?logDetail=on on
# the address set them — remembered, and taken out of the address bar. A critical message is shown to EVERY user,
# whatever the switches. Both alerts are drawn by the logging module in plain page elements, so they still work if the
# app has crashed. The messages here are planted by the test, marked test (-!TEST!) — which the driver's checks ignore.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import APP_TIMEOUT_MS, App       # noqa: E402

BANNER, CRITICAL = "#rw-log-banner", "#rw-log-critical"
SWITCHES = "() => window.rwLog.switches()"


def plant(app, level, code, text):
    app.page.evaluate("([l, c, t]) => window.rwLog.log(l, c, t, null, { test: true })", [level, code, text])


with App(log=None) as app:     # the switches' own tests: the page's defaults (both off), not the driver's "both on"
    page = app.page

    def address_sets_switches():
        check(page.evaluate(SWITCHES) == {"errorBanner": False, "logDetail": False}, "a new browser didn't start with both off")
        page.goto(f"http://localhost:{app.port}/readerwrangler.html?errorBanner=on&logDetail=on")
        page.wait_for_selector("#splash", state="detached", timeout=APP_TIMEOUT_MS)
        search = page.evaluate("() => location.search")
        check("errorBanner" not in search and "logDetail" not in search, f"the switches are still in the address: {search}")
        check(page.evaluate(SWITCHES) == {"errorBanner": True, "logDetail": True}, "the address didn't turn both on")
        page.reload()
        page.wait_for_selector("#splash", state="detached", timeout=APP_TIMEOUT_MS)
        check(page.evaluate(SWITCHES) == {"errorBanner": True, "logDetail": True}, "the switches weren't remembered")
    test("LOGUI-001", "?errorBanner=on&logDetail=on turns both on, is remembered, and leaves the address bar",
         address_sets_switches)

    def banner_shows():
        plant(app, "error", "UI-03", "a planted error")
        page.locator(BANNER).wait_for(timeout=5000)
        text = page.locator(BANNER).inner_text()
        check("UI-03-!TEST!" in text and "a planted error" in text, f"the banner says: {text!r}")
        for label in ("Copy", "Dismiss", "Turn off this banner"):
            check(page.locator(BANNER).get_by_text(label, exact=True).count() == 1, f"the banner has no {label!r}: {text!r}")
    test("LOGUI-002", "with the banner switch on, an error raises it: the code, the text, Copy, Dismiss, Turn off",
         banner_shows)

    def dismiss_and_return():
        app.click_reachable(page.locator(BANNER).get_by_text("Dismiss", exact=True))
        page.locator(BANNER).wait_for(state="detached", timeout=5000)
        plant(app, "error", "UI-04", "a second planted error")
        page.locator(BANNER).wait_for(timeout=5000)
        check("UI-04" in page.locator(BANNER).inner_text(), "the banner didn't show the new error")
    test("LOGUI-003", "Dismiss hides the banner; the next error brings it back", dismiss_and_return)

    def turn_off():
        app.click_reachable(page.locator(BANNER).get_by_text("Turn off this banner", exact=True))
        page.locator(BANNER).wait_for(state="detached", timeout=5000)
        check(page.evaluate(SWITCHES) == {"errorBanner": False, "logDetail": True},
              f"turning off the banner should leave extra detail alone: {page.evaluate(SWITCHES)}")
        plant(app, "error", "UI-03", "an error after turning off")
        page.wait_for_timeout(800)
        check(page.locator(BANNER).count() == 0, "a banner appeared with the banner switch off")
    test("LOGUI-004", "Turn off this banner: no banner for later errors — and the other switch is untouched", turn_off)

    def critical_for_everyone():
        plant(app, "critical", "STORE-02", "your library could not be saved")
        page.locator(CRITICAL).wait_for(timeout=5000)
        text = page.locator(CRITICAL).inner_text()
        check("STORE-02-!TEST!" in text and "your library could not be saved" in text, f"the message says: {text!r}")
        check(page.locator(CRITICAL).get_by_text("Copy details", exact=True).count() == 1, f"no Copy details: {text!r}")
        app.click_reachable(page.locator(CRITICAL).get_by_text("OK", exact=True))
        page.locator(CRITICAL).wait_for(state="detached", timeout=5000)
    test("LOGUI-005", "a critical message is shown to every user (the banner switch off), with Copy details; OK closes it",
         critical_for_everyone)

    test("LOGUI-006", "no unexpected console messages (the planted ones excepted)",
         lambda: check(not app.unexpected_console(), app.unexpected_console()))

done()
