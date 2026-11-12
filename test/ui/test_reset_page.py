# Screen test: the reset page (reset.html) offers Copy diagnostics and Report this problem.
# tags: report, reset, diagnostics, tier 2
# covers: reset.html, reset.js, reportProblem.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# TODO "When the app can't open: Copy diagnostics and Report this problem, right there" (id 20261111-1104a), item 3:
# the reset page gets the same two as the emergency screen — it loads the logging module too, and it's where people
# land when the app won't open at all. Nothing real is opened: window.open and the clipboard are recorders
# (rw.py stub_outside).
import os
import re
import sys
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import App                       # noqa: E402

COPIED = "Diagnostics copied — paste them into your message to us."
REFUSED = "Diagnostics couldn't be copied — the browser refused the clipboard."

with App() as app:
    page, log = app.open_tab("reset.html", wait_for_app=False)
    page.get_by_text("Emergency Reset", exact=True).wait_for(timeout=10_000)
    app.stub_outside(page)

    def button(name, where=None):
        return (where or page).get_by_role("button", name=name, exact=True)

    def report_box():
        return page.locator('[role="dialog"]', has=page.get_by_text("Report a problem", exact=True))

    def offered():
        for name in ("Copy diagnostics", "Report this problem"):
            check(button(name).count() == 1, f"the reset page has no {name} button")
            app.hover(button(name))   # refuses a covered or zero-size button
        reset_top = button("Reset App").bounding_box()["y"]
        for name in ("Copy diagnostics", "Report this problem"):
            check(button(name).bounding_box()["y"] < reset_top, f"{name} isn't above Reset App (offered before the reset)")
    test("RESETPG-001", "the reset page offers Copy diagnostics and Report this problem, above Reset App", offered)

    def copies():
        app.click_reachable(button("Copy diagnostics"))
        page.get_by_text(COPIED).wait_for(timeout=5_000)
        copied = app.copied(page)
        check(len(copied) == 1, f"{len(copied)} copies, should be 1")
        text = copied[0]
        check(text.startswith("ReaderWrangler diagnostics"), f"not the diagnostics: {text[:120]!r}")
        check(re.search(r"^From the reset page", text, re.M), f"doesn't say where it came from: {text[:300]!r}")
        check("Page loaded — build" in text, "the kept log isn't in it (the app's own earlier loads are)")
    test("RESETPG-002", "Copy diagnostics copies the kept log, saying it came from the reset page — and says so", copies)

    def report_flow():
        app.click_reachable(button("Report this problem"))
        report_box().get_by_text(COPIED).wait_for(timeout=5_000)
        o0 = len(app.opened(page))
        app.click_reachable(button("Email us", report_box()))
        url = app.opened(page)[o0][0]
        q = parse_qs(urlsplit(url).query)
        check(url.startswith("mailto:contact@readerwrangler.com?") and set(q) == {"subject"}
              and q["subject"][0] == "ReaderWrangler problem report", f"not an email to us with only a subject: {url}")
        app.click_reachable(button("Report on GitHub", report_box()))
        opened = app.opened(page)[o0 + 1:]
        check(opened and opened[0][0] == "https://github.com/Ron-L/ReaderWrangler/issues/new", f"not a new GitHub issue: {opened}")
        app.click_reachable(button("Close", report_box()))
        report_box().wait_for(state="detached", timeout=5_000)
    test("RESETPG-003", "Report this problem copies, then Email us / Report on GitHub open what they say; Close closes",
         report_flow)

    def refused():
        app.stub_outside(page, refuse_clipboard=True)
        app.click_reachable(button("Copy diagnostics"))
        page.get_by_text(REFUSED).first.wait_for(timeout=5_000)
        app.click_reachable(button("Report this problem"))
        report_box().get_by_text(REFUSED).wait_for(timeout=5_000)
        check(button("Email us", report_box()).is_enabled() and button("Report on GitHub", report_box()).is_enabled(),
              "the choice isn't offered when the copy was refused")
        page.keyboard.press("Escape")
        report_box().wait_for(state="detached", timeout=5_000)
    test("RESETPG-004", "a refused clipboard is said plainly and the choice is still offered; Esc closes the box", refused)

    def clean():
        bad = [f"{t}: {x}" for t, x in log if t in ("error", "crash") or (t == "warning" and "SHARE-01" not in x)]
        check(not bad, bad)
    test("RESETPG-005", "nothing goes wrong on the reset page (RESETPG-004's deliberate SHARE-01 excepted)", clean)
    page.close()

done()
