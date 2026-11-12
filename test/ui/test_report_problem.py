# Screen test: Help → Report a problem… and Help → Known problems.
# tags: report, help, diagnostics, dialogs, tier 2
# covers: readerwrangler.js, reportProblem.js, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# TODO "Help → Report a problem… and Known problems (the GitHub issues)" (id 20261111-1104b). Decided (Ron + Claude,
# 2026-11-11/12): Report a problem… copies the diagnostics (as Diagnostics' Copy does), then a small choice — Email us
# (their mail program, to contact@readerwrangler.com, with a subject line; NOT the diagnostics in the body) or Report on
# GitHub (a new issue) — telling them the diagnostics are on the clipboard to paste in. Known problems opens the issue
# list. One shared helper (reportProblem.js) does it here, on the emergency screen and on the reset page.
#
# Nothing real is opened: the page's window.open and clipboard are recorders (rw.py stub_outside) — each test checks
# what WOULD have opened or been copied.
import os
import re
import sys
from urllib.parse import parse_qs, urlsplit

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

ISSUES = "https://github.com/Ron-L/ReaderWrangler/issues"
COPIED = "Diagnostics copied — paste them into your message to us."
REFUSED = "Diagnostics couldn't be copied — the browser refused the clipboard."

with App() as app:
    page = app.page
    app.restore(FIXTURE)
    app.stub_outside()

    def help_menu():
        page.get_by_role("button", name=re.compile(r"^\s*Help")).first.click()
        menu = page.get_by_role("menu", name="Help")
        menu.wait_for(timeout=5_000)
        return menu

    def report_box():
        return page.locator('[role="dialog"]', has=page.get_by_text("Report a problem", exact=True))

    def open_report():
        help_menu().get_by_role("button", name="Report a problem…", exact=True).click()
        report_box().wait_for(timeout=5_000)

    def items_in_place():
        menu = help_menu()
        names = [b.inner_text().strip() for b in menu.get_by_role("button").all()]
        check("Diagnostics…" in names, f"no Diagnostics… in the Help menu: {names}")
        i = names.index("Diagnostics…")
        check(names[i + 1:i + 3] == ["Report a problem…", "Known problems"],
              f"Report a problem… and Known problems should follow Diagnostics…: {names}")
        for n in ("Report a problem…", "Known problems"):
            info = app.hover(menu.get_by_role("button", name=n, exact=True))   # refuses a covered or zero-size item
            check(info["title"], f"Help → {n} has no tooltip saying what it does")
        page.keyboard.press("Escape")
        menu.wait_for(state="detached", timeout=5_000)
    test("RPT-001", "the Help menu has Report a problem… and Known problems, after Diagnostics…, each with a tooltip",
         items_in_place)

    def copies_then_offers():
        n0 = len(app.copied())
        open_report()
        page.get_by_text(COPIED).wait_for(timeout=5_000)
        copied = app.copied()[n0:]
        check(len(copied) == 1, f"{len(copied)} copies made, should be 1")
        text = copied[0]
        check(text.startswith("ReaderWrangler diagnostics"), f"not the diagnostics: {text[:120]!r}")
        check(re.search(r"^Desktop app \d+\.\d+\.\d+\S* \(page \d+\.\d+\.\d+", text, re.M), f"no build line: {text[:300]!r}")
        check("Page loaded — build" in text, "the kept log's entries aren't in the copy")
        box = report_box()
        for name in ("Email us", "Report on GitHub", "Close"):
            check(box.get_by_role("button", name=name, exact=True).count() == 1, f"the box has no {name} button")
        check("contact@readerwrangler.com" in box.inner_text(), "the box doesn't show our address (for webmail users)")
        check(app.console_matching(r"^info · SHARE · Diagnostics copied"), "the copy isn't in the log")
    test("RPT-002", "Report a problem… copies the diagnostics (with the build line), says so, and offers Email us / "
                    "Report on GitHub", copies_then_offers)

    def email_us():
        n0 = len(app.opened())
        app.click_reachable(report_box().get_by_role("button", name="Email us", exact=True))
        opened = app.opened()[n0:]
        check(len(opened) == 1, f"{len(opened)} things opened, should be 1: {opened}")
        url = opened[0][0]
        check(url.startswith("mailto:contact@readerwrangler.com?"), f"not an email to us: {url}")
        q = parse_qs(urlsplit(url).query)
        check(re.fullmatch(r"ReaderWrangler problem report \(\d+\.\d+\.\d+\S*\)", q.get("subject", [""])[0]),
              f"the subject isn't 'ReaderWrangler problem report (build)': {q}")
        check(set(q) == {"subject"}, f"the email carries more than a subject (never the diagnostics): {sorted(q)}")
        check(report_box().is_visible(), "the box closed — its address and the paste reminder are gone")
    test("RPT-003", "Email us opens an email to contact@readerwrangler.com with a subject (no body); the box stays",
         email_us)

    def github():
        n0 = len(app.opened())
        app.click_reachable(report_box().get_by_role("button", name="Report on GitHub", exact=True))
        opened = app.opened()[n0:]
        check(len(opened) == 1 and opened[0][0] == ISSUES + "/new", f"should open a new GitHub issue: {opened}")
        check(len(opened[0]) > 1 and opened[0][1] == "_blank", f"not in a new tab: {opened}")
        check(app.console_matching(r"^info · SHARE · Report a problem: opened a new report on GitHub"),
              "the choice isn't in the log")
    test("RPT-004", "Report on GitHub opens a new GitHub issue in a new tab", github)

    def close_and_esc():
        report_box().get_by_role("button", name="Close", exact=True).click()
        report_box().wait_for(state="detached", timeout=5_000)
        open_report()
        page.keyboard.press("Escape")
        report_box().wait_for(state="detached", timeout=5_000)
    test("RPT-005", "Close closes the box; Esc does too (it's a window of the overlay system)", close_and_esc)

    def refused():
        app.stub_outside(refuse_clipboard=True)
        n0 = len(app.console)
        open_report()
        page.get_by_text(REFUSED).wait_for(timeout=5_000)
        box = report_box()
        check(box.get_by_role("button", name="Email us", exact=True).is_enabled(), "Email us isn't offered")
        check(box.get_by_role("button", name="Report on GitHub", exact=True).is_enabled(), "Report on GitHub isn't offered")
        check([x for _, x in app.console[n0:] if x.startswith("warning · SHARE-01 · ")], "the refusal isn't logged (SHARE-01)")
        app.stub_outside(refuse_clipboard=False)
        n1 = len(app.copied())
        app.click_reachable(box.get_by_role("button", name="Try again", exact=True))
        page.get_by_text(COPIED).wait_for(timeout=5_000)
        check(len(app.copied()) == n1 + 1, "Try again didn't copy")
        page.keyboard.press("Escape")
        report_box().wait_for(state="detached", timeout=5_000)
    test("RPT-006", "a refused clipboard is said plainly, both choices are still offered, and Try again copies", refused)

    def known_problems():
        n0 = len(app.opened())
        help_menu().get_by_role("button", name="Known problems", exact=True).click()
        opened = app.opened()[n0:]
        check(len(opened) == 1 and opened[0][0] == ISSUES and opened[0][1:2] == ["_blank"],
              f"should open the issue list in a new tab: {opened}")
    test("RPT-007", "Known problems opens the GitHub issue list in a new tab", known_problems)

    def feedback_link():
        href = page.get_by_role("link", name="Feedback", exact=True).get_attribute("href")
        check(href == ISSUES, f"the status bar's Feedback link goes to {href}")
    test("RPT-008", "the status bar's Feedback link still opens the issue list", feedback_link)

    # RPT-006 refuses the clipboard ON PURPOSE, so its SHARE-01 warning is expected here.
    test("RPT-009", "no unexpected console messages (RPT-006's deliberate SHARE-01 excepted)",
         lambda: check(not [x for x in app.unexpected_console() if "SHARE-01" not in x],
                       [x for x in app.unexpected_console() if "SHARE-01" not in x]))

done()
