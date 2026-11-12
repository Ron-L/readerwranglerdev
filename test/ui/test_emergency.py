# Screen test: when the app can't open — the "Something went wrong" screen offers Copy diagnostics and Report this problem.
# tags: report, emergency, diagnostics, tier 2
# covers: readerwrangler.html, reportProblem.js, logkit/logger.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# TODO "When the app can't open: Copy diagnostics and Report this problem, right there" (id 20261111-1104a). Decided
# (Ron + Claude, 2026-11-11): the emergency screen gets a Copy diagnostics button and Report this problem (the shared
# helper, reportProblem.js: copy, then Email us / Report on GitHub — Ron, 2026-11-12); NOT on its "Erase and Reset"
# confirmation — one place, offered before anyone reaches the reset. The logging module loads first and survives a
# failed app, so the copy has the kept log; it also carries the build line and the error that stopped the load.
#
# The load is made to fail ON PURPOSE (rw.py open_broken_app: the app's code is answered with a syntax error, as
# 7.27.1's screenshots did). Nothing real is opened: window.open and the clipboard are recorders (rw.py stub_outside).
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
    page, log = app.open_broken_app()
    app.stub_outside(page)
    screen = page.locator("#splash")

    def button(name, where=None):
        return (where or screen).get_by_role("button", name=name, exact=True)

    def report_box():
        return page.locator('[role="dialog"]', has=page.get_by_text("Report a problem", exact=True))

    def offered_before_reset():
        for name in ("Copy diagnostics", "Report this problem"):
            check(button(name).count() == 1, f"the emergency screen has no {name} button")
            app.hover(button(name))   # refuses a covered or zero-size button
        reset_top = button("Reset App").bounding_box()["y"]
        for name in ("Copy diagnostics", "Report this problem"):
            check(button(name).bounding_box()["y"] < reset_top, f"{name} isn't above Reset App (offered before the reset)")
    test("EMERG-001", "the emergency screen offers Copy diagnostics and Report this problem, above Reset App",
         offered_before_reset)

    def copy_has_build_and_error():
        app.click_reachable(button("Copy diagnostics"))
        screen.get_by_text(COPIED).wait_for(timeout=5_000)
        copied = app.copied(page)
        check(len(copied) == 1, f"{len(copied)} copies, should be 1")
        text = copied[0]
        check(text.startswith("ReaderWrangler diagnostics"), f"not the diagnostics: {text[:120]!r}")
        check(re.search(r"^Desktop app didn't open \(page \d+\.\d+\.\d+", text, re.M), f"no build line: {text[:400]!r}")
        check(re.search(r"^Load error: .*SyntaxError", text, re.M), f"no load error line: {text[:400]!r}")
        check(re.search(r"error · UI-03 · Uncaught error: .*readerwrangler\.js", text), "the kept log's record of the error isn't in it")
    test("EMERG-002", "Copy diagnostics copies the build line, the error that stopped the load and the kept log — and says so",
         copy_has_build_and_error)

    def report_flow():
        n0 = len(app.copied(page))
        app.click_reachable(button("Report this problem"))
        report_box().wait_for(timeout=5_000)
        report_box().get_by_text(COPIED).wait_for(timeout=5_000)
        check(len(app.copied(page)) == n0 + 1, "Report this problem didn't copy the diagnostics first")
        o0 = len(app.opened(page))
        app.click_reachable(button("Email us", report_box()))
        url = app.opened(page)[o0][0]
        q = parse_qs(urlsplit(url).query)
        check(url.startswith("mailto:contact@readerwrangler.com?") and set(q) == {"subject"}
              and re.fullmatch(r"ReaderWrangler problem report \(\d+\.\d+\.\d+\S*\)", q["subject"][0]),
              f"not an email to us with only a subject: {url}")
        app.click_reachable(button("Report on GitHub", report_box()))
        opened = app.opened(page)[o0 + 1:]
        check(opened and opened[0][0] == "https://github.com/Ron-L/ReaderWrangler/issues/new" and opened[0][1:2] == ["_blank"],
              f"not a new GitHub issue in a new tab: {opened}")
        check(report_box().is_visible(), "the box closed after a choice — its address and reminder are gone")
        page.keyboard.press("Escape")
        report_box().wait_for(state="detached", timeout=5_000)
        app.click_reachable(button("Report this problem"))
        report_box().wait_for(timeout=5_000)
        app.click_reachable(button("Close", report_box()))
        report_box().wait_for(state="detached", timeout=5_000)
    test("EMERG-003", "Report this problem copies, then offers Email us / Report on GitHub; Esc and Close close the box",
         report_flow)

    def refused():
        app.stub_outside(page, refuse_clipboard=True)
        app.click_reachable(button("Copy diagnostics"))
        screen.get_by_text(REFUSED).wait_for(timeout=5_000)
        app.click_reachable(button("Report this problem"))
        report_box().get_by_text(REFUSED).wait_for(timeout=5_000)
        for name in ("Email us", "Report on GitHub"):
            check(button(name, report_box()).is_enabled(), f"{name} isn't offered when the copy was refused")
        app.click_reachable(button("Close", report_box()))
        report_box().wait_for(state="detached", timeout=5_000)
        app.stub_outside(page, refuse_clipboard=False)
    test("EMERG-004", "a refused clipboard is said plainly — on the screen and in the box — and the choice is still offered",
         refused)

    def not_on_the_confirmation():
        app.click_reachable(button("Reset App"))
        confirm = page.locator("#emergencyConfirm")
        confirm.wait_for(timeout=5_000)
        check(confirm.get_by_role("button", name="Erase and Reset", exact=True).count() == 1, "not the reset's confirmation")
        for name in ("Copy diagnostics", "Report this problem"):
            check(confirm.get_by_role("button", name=name, exact=True).count() == 0, f"{name} is on the Erase and Reset box")
        button("Cancel", confirm).click()
        confirm.wait_for(state="detached", timeout=5_000)
    test("EMERG-005", "the 'Erase and Reset' confirmation offers neither (one place, before the reset)", not_on_the_confirmation)

    def nothing_else_wrong():
        crashes = [x for t, x in log if t == "crash"]
        errors = [x for t, x in log if t == "error" and "UI-03" not in x]   # UI-03: the logger's record of that one crash
        check(len(crashes) == 1, f"one crash expected — the broken load's own — got {len(crashes)}: {crashes}")
        check(not errors, f"other errors: {errors}")
    test("EMERG-006", "nothing else goes wrong on the emergency screen (the broken load's own error excepted)",
         nothing_else_wrong)
    page.close()

done()
