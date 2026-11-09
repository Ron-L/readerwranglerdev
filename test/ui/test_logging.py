# Screen test: the logging module's gate and alerts in the real page — ?log=…, the banner, critical shown to everyone.
# tags: logging, tier 2
# covers: logger.js, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# Build step 3 (docs/design/LOGGING.md §1, TODO decisions 3-4; Ron + Claude, 2026-11-05/07). ?log=debug on the address
# turns diagnostics mode on — remembered, and taken out of the address bar. In diagnostics mode an error raises the red
# banner (the details, Copy, Dismiss, "Turn off diagnostics"); a critical message is shown to EVERY user, diagnostics or
# not. Both are drawn by the logging module in plain page elements, so they still work if the app has crashed. The
# messages here are planted by the test, marked test (-!TEST!) — which the driver's console check ignores.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import APP_TIMEOUT_MS, App       # noqa: E402

BANNER, CRITICAL = "#rw-log-banner", "#rw-log-critical"


def plant(app, level, code, text):
    app.page.evaluate("([l, c, t]) => window.rwLog.log(l, c, t, null, { test: true })", [level, code, text])


with App(log=None) as app:     # the gate's own tests: the page's default level, not the driver's ?log=debug
    page = app.page

    def address_sets_diagnostics():
        page.goto(f"http://localhost:{app.port}/readerwrangler.html?log=debug")
        page.wait_for_selector("#splash", state="detached", timeout=APP_TIMEOUT_MS)
        check("log=" not in page.evaluate("() => location.search"), "?log= is still in the address")
        check(page.evaluate("() => window.rwLog.level()") == "debug", "the level isn't debug")
        page.reload()
        page.wait_for_selector("#splash", state="detached", timeout=APP_TIMEOUT_MS)
        check(page.evaluate("() => window.rwLog.diagnostics()"), "diagnostics mode wasn't remembered across a reload")
    test("LOGUI-001", "?log=debug turns diagnostics on, is remembered, and leaves the address bar", address_sets_diagnostics)

    def banner_shows():
        plant(app, "error", "UI-03", "a planted error")
        page.locator(BANNER).wait_for(timeout=5000)
        text = page.locator(BANNER).inner_text()
        check("UI-03-!TEST!" in text and "a planted error" in text, f"the banner says: {text!r}")
        for label in ("Copy", "Dismiss", "Turn off diagnostics"):
            check(page.locator(BANNER).get_by_text(label, exact=True).count() == 1, f"the banner has no {label!r}: {text!r}")
    test("LOGUI-002", "in diagnostics mode an error raises the banner: the code, the text, Copy, Dismiss, Turn off", banner_shows)

    def dismiss_and_return():
        app.click_reachable(page.locator(BANNER).get_by_text("Dismiss", exact=True))
        page.locator(BANNER).wait_for(state="detached", timeout=5000)
        plant(app, "error", "UI-04", "a second planted error")
        page.locator(BANNER).wait_for(timeout=5000)
        check("UI-04" in page.locator(BANNER).inner_text(), "the banner didn't show the new error")
    test("LOGUI-003", "Dismiss hides the banner; the next error brings it back", dismiss_and_return)

    def turn_off():
        app.click_reachable(page.locator(BANNER).get_by_text("Turn off diagnostics", exact=True))
        page.locator(BANNER).wait_for(state="detached", timeout=5000)
        check(not page.evaluate("() => window.rwLog.diagnostics()"), "diagnostics still on")
        plant(app, "error", "UI-03", "an error after turning off")
        page.wait_for_timeout(800)
        check(page.locator(BANNER).count() == 0, "a banner appeared with diagnostics off")
    test("LOGUI-004", "Turn off diagnostics: no banner for later errors (an ordinary user's view)", turn_off)

    def critical_for_everyone():
        plant(app, "critical", "STORE-02", "your library could not be saved")
        page.locator(CRITICAL).wait_for(timeout=5000)
        text = page.locator(CRITICAL).inner_text()
        check("STORE-02-!TEST!" in text and "your library could not be saved" in text, f"the message says: {text!r}")
        check(page.locator(CRITICAL).get_by_text("Copy details", exact=True).count() == 1, f"no Copy details: {text!r}")
        app.click_reachable(page.locator(CRITICAL).get_by_text("OK", exact=True))
        page.locator(CRITICAL).wait_for(state="detached", timeout=5000)
    test("LOGUI-005", "a critical message is shown to every user (diagnostics off), with Copy details; OK closes it",
         critical_for_everyone)

    test("LOGUI-006", "no unexpected console messages (the planted ones excepted)",
         lambda: check(not app.unexpected_console(), app.unexpected_console()))

done()
