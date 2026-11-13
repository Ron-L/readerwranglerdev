# Screen test: the phone app's start — its build line, and a library it can't load is shown to the person, not hidden.
# tags: phone, boot, logging, tier 2
# covers: mobile.js, logkit/logger.js, logkit-settings.js, storage.js, readerwrangler.html
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
        app.stub_outside()      # the driver's one clipboard recorder (7.29.1: was a hand-written stub of its own)
        page.get_by_role("button", name="Menu").first.click()
        page.locator("[data-copy-diagnostics]").click()
        page.wait_for_function("() => window._copied.length > 0", timeout=5000)
        text = app.copied()[-1]
        check(text.startswith("ReaderWrangler diagnostics — "), text[:80])
        check(re.search(r"Phone app \d+\.\d+\.\d+(-alpha\.\d+)? \(page ", text), "no phone build line in the header")
        check("Phone app" in text and "running" in text, "the phone's own log lines aren't in the copy")
        page.locator("[data-copy-diagnostics]").get_by_text("Copied").wait_for(timeout=3000)
    test("PHONE-003", "the phone's menu has Copy diagnostics: the phone's log, under a header with its build", copy_diagnostics)

    # 7.29.1 (TODO 20261112-1755 "Copy buttons tell the truth"): a phone on the home network reaching a self-hosted copy
    # is on an insecure address — the page has NO clipboard — and Copy diagnostics said "Copied". Now: "Couldn't copy".
    def copy_without_clipboard():
        diag = page.locator("[data-copy-diagnostics]")
        diag.get_by_text("Copy diagnostics").wait_for(timeout=5000)   # PHONE-003's "Copied" has gone back
        page.evaluate("() => Object.defineProperty(navigator, 'clipboard', { configurable: true, value: undefined })")
        n0 = len(app.console)
        diag.click()
        diag.get_by_text("Couldn't copy").wait_for(timeout=3000)
        check([x for _, x in app.console[n0:] if x.startswith("warning · UI-06 · Diagnostics couldn't be copied (the phone)")],
              "the refusal isn't logged (UI-06)")
        diag.get_by_text("Copy diagnostics").wait_for(timeout=5000)
    test("PHONE-004", "Copy diagnostics on a phone page with no clipboard says Couldn't copy — never Copied", copy_without_clipboard)

    # Its neighbour in the same menu, the credentials' Copy (Law 22 — the same one copy routine): it said nothing at all,
    # copied or refused. Now its button says Copied / Couldn't copy, as Copy diagnostics does.
    def credentials_copy():
        app.stub_outside(refuse_clipboard=False)
        page.get_by_text("Show credentials").click()
        copy = page.get_by_role("button", name="Copy", exact=True)
        copy.click()
        page.get_by_role("button", name="Copied", exact=True).wait_for(timeout=3000)
        check(app.copied() and app.copied()[-1].startswith("Channel ID: "), f"the credentials weren't copied: {app.copied()[-1:]}")
        copy.wait_for(timeout=5000)                                  # back to its label
        app.stub_outside(refuse_clipboard=True)
        copy.click()
        page.get_by_role("button", name="Couldn't copy", exact=True).wait_for(timeout=3000)
        copy.wait_for(timeout=5000)
        page.get_by_text("Hide credentials").click()
        app.stub_outside(refuse_clipboard=False)
    test("PHONE-005", "the credentials' Copy says Copied when it copied, and Couldn't copy when the browser refused",
         credentials_copy)

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
