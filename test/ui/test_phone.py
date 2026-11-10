# Screen test: the phone app's start — its build line, and a library it can't load is shown to the person, not hidden.
# tags: phone, boot, logging, tier 2
# covers: mobile.js, logger.js, storage.js, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-09 (7.26.0-alpha.20, the logging switch's PHONE area): a phone-width window loads the phone app (mobile.js;
# readerwrangler.html picks it at 767 px and under). When the phone couldn't load its library, it printed one console
# line and showed an empty app — the phone's version of the desktop's BOOT-01. Now it's critical, PHONE-03: the logging
# module's box, with the phone's own advice (it has no Save Backup; the computer's library isn't affected). The failure
# is a real one: the browser's book store refuses to open, set up before the page's own scripts.
import os
import re
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import App                       # noqa: E402

CRITICAL = "#rw-log-critical"

# with test credentials and the local relay: without credentials the phone shows its pairing screen (which reuses the
# loading screen's id, so the app never looks "up")
with App(relay=True, size=(390, 844)) as app:
    page = app.page

    def build_line():
        check([x for _, x in app.console if re.search(r"^info · BOOT · Phone app \d+\.\d+\.\d+(-alpha\.\d+)? running \(page ", x)],
              "no line naming the phone app's build — did the phone app load?")
    test("PHONE-001", "a phone-width window runs the phone app, and it says which build", build_line)

    def copy_diagnostics():
        # LOGGING.md §5 step 5.4 (Ron): the phone gets a Copy diagnostics button, no viewer
        page.evaluate("() => { window._copied = null; navigator.clipboard.writeText = (t) => { window._copied = t; return Promise.resolve(); }; }")
        page.get_by_role("button", name="Menu").first.click()
        page.locator("[data-copy-diagnostics]").click()
        page.wait_for_function("() => window._copied !== null", timeout=5000)
        text = page.evaluate("() => window._copied")
        check(text.startswith("ReaderWrangler diagnostics — "), text[:80])
        check(re.search(r"Phone app \d+\.\d+\.\d+(-alpha\.\d+)? \(page ", text), "no phone build line in the header")
        check("Phone app" in text and "running" in text, "the phone's own log lines aren't in the copy")
        page.locator("[data-copy-diagnostics]").get_by_text("Copied").wait_for(timeout=3000)
    test("PHONE-003", "the phone's menu has Copy diagnostics: the phone's log, under a header with its build", copy_diagnostics)

    def library_unreadable():
        app.expect("PHONE-03")   # caused on purpose
        app.ctx.add_init_script("""indexedDB.open = function () {
            throw new Error('the book store refused to open (screen test)'); };""")
        app.reload()
        page.locator(CRITICAL).wait_for(timeout=60_000)
        text = page.locator(CRITICAL).inner_text()
        check("PHONE-03" in text, f"the box doesn't carry PHONE-03: {text!r}")
        check("couldn't be loaded on this phone" in text, f"the box doesn't say the phone couldn't load: {text!r}")
        check("Save Backup" not in text, f"the phone's box gives the desktop's backup advice: {text!r}")
    test("PHONE-002", "a library the phone can't load shows the critical box (PHONE-03) with the phone's own advice",
         library_unreadable)

done()
