# Screen test: every Copy button in the app says truthfully what happened — "copied" only when the clipboard took it, and
# a refusal said plainly.
# tags: copy, share, logging, tier 2
# covers: readerwrangler.js, logkit/logger.js
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python). Starts its own LOCAL relay (rw.LocalRelay)
# — Cloud Sync is on, so Relay Setup shows the credentials and their Copy button.
#
# 7.29.1 (sprint 3 item 4; Ron, 2026-11-13: "ONE copy routine in the whole app" — Law 22): readerwrangler.js's own Copy
# buttons wrote the clipboard themselves and said "Title copied!" without waiting to hear — a refused clipboard (a denied
# permission, an insecure address) still said copied, and the refusal surfaced only as an uncaught error in the console.
# Now each goes through the logging kit's one copy routine (rwLog.copyText): its receipt when the clipboard took it, else
# "<what> couldn't be copied — the browser refused the clipboard" (a toast), or "Couldn't copy" on a button that answers
# in place. A representative set: the book window's Copy title chip and Share ▾ → Copy Amazon Link, Share by Email's Copy
# to clipboard, the right-click menu's Copy Titles, and Relay Setup's credentials Copy. LOG-044 (test/logger.test.js)
# proves the rest: no script but the logging kit writes the clipboard at all.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

BOOK = "Good Omens"          # test/fixtures/make-small-fixture.js — ASIN TST0000005
SECOND = "A Book With No Description"
REFUSED = " couldn't be copied — the browser refused the clipboard"


def toast_says(app, words):
    """Wait for the toast to show `words` (a new toast replaces the last one's text) and return its full text."""
    toast = app.page.locator(".clipboard-toast", has_text=words).first
    toast.wait_for(timeout=5000)
    return toast.inner_text().strip()


def refusal_logged(app, n0, what, where=""):
    """The refusal reached the log, at warning, as UI-06 — the logging kit's one copy routine said it."""
    line = f"warning · UI-06 · {what} couldn't be copied{f' ({where})' if where else ''} — the browser refused the clipboard"
    check([x for _, x in app.console[n0:] if x.startswith(line)], f"no {line!r} in the console: {app.console[n0:][-6:]}")


def refused_then_copied(app, press, what, copied_check, success_words):
    """Press a Copy button twice: the browser refusing, then accepting. The refusal says so and copies nothing; the copy
    says its receipt (no "!") and the clipboard holds the text."""
    app.stub_outside(refuse_clipboard=True)
    n0, c0 = len(app.console), len(app.copied())
    press()
    said = toast_says(app, what + REFUSED)
    check(said == what + REFUSED, f"the refusal toast says {said!r}")
    check(len(app.copied()) == c0, "something reached the clipboard while it refused")
    refusal_logged(app, n0, what)
    app.stub_outside(refuse_clipboard=False)
    press()
    said = toast_says(app, success_words)
    check(said == success_words, f"the receipt says {said!r}, expected {success_words!r}")
    check(len(app.copied()) == c0 + 1, f"the copy didn't reach the clipboard: {app.copied()[c0:]}")
    copied_check(app.copied()[-1])


with App(relay=True) as app:
    page = app.page
    app.restore(FIXTURE)
    app.menu("View", "List View").click()
    app.click_reachable(page.get_by_text("All Books", exact=True).first)
    page.wait_for_timeout(500)

    def open_book():
        page.locator("tbody tr", has_text=BOOK).first.dblclick()
        page.get_by_role("button", name="Copy title").wait_for(timeout=5000)

    def close_book():
        page.keyboard.press("Escape")
        page.get_by_role("button", name="Copy title").wait_for(state="detached", timeout=5000)

    def title_chip():
        open_book()
        try:
            refused_then_copied(app, lambda: app.click_reachable(page.get_by_role("button", name="Copy title")),
                                "Title", lambda t: check(t == BOOK, f"copied {t!r}"), "Title copied")
        finally:
            close_book()
    test("COPY-001", "the book window's Copy title chip: a refused clipboard says so (never \"copied\"); a copy says "
         "\"Title copied\"", title_chip)

    def amazon_link():
        open_book()
        share = page.get_by_title("Share this book")

        def press():
            app.click_reachable(share)
            app.click_reachable(page.get_by_role("menuitem").filter(has_text="Copy Amazon Link").first)
        try:
            refused_then_copied(app, press, "Link", lambda t: check("TST0000005" in t and t.startswith("http"), f"copied {t!r}"),
                                "Link copied")
        finally:
            close_book()
    test("COPY-002", "the book window's Share ▾ → Copy Amazon Link: a refusal says so; a copy says \"Link copied\"",
         amazon_link)

    def share_by_email():
        open_book()
        window = page.get_by_role("heading", name="Share by Email")
        copy = page.get_by_role("button", name="Copy to clipboard")

        def open_share_email():
            app.click_reachable(page.get_by_title("Share this book"))
            app.click_reachable(page.get_by_role("menuitem").filter(has_text="Email to a Friend").first)
            window.wait_for(timeout=5000)
        try:
            app.stub_outside(refuse_clipboard=True)
            n0, c0 = len(app.console), len(app.copied())
            open_share_email()
            app.click_reachable(copy)
            said = toast_says(app, "Email content" + REFUSED)
            check(said == "Email content" + REFUSED, f"the refusal toast says {said!r}")
            check(len(app.copied()) == c0, "something reached the clipboard while it refused")
            refusal_logged(app, n0, "Email content")
            check(window.is_visible(), "Share by Email closed after a refusal — its other ways out went with it")
            app.stub_outside(refuse_clipboard=False)
            app.click_reachable(copy)
            said = toast_says(app, "Email content copied")
            check(said == "Email content copied — paste into your email app", f"the receipt says {said!r}")
            check(len(app.copied()) == c0 + 1 and app.copied()[-1].startswith("Subject: "), f"copied {app.copied()[c0:]}")
            window.wait_for(state="detached", timeout=5000)
        finally:
            if window.count():
                page.keyboard.press("Escape")
            close_book()
    test("COPY-003", "Share by Email's Copy to clipboard: a refusal says so and the window stays open; a copy says so "
         "and closes it", share_by_email)

    def menu_copy_titles():
        page.locator("tbody tr", has_text=BOOK).first.click()
        page.locator("tbody tr", has_text=SECOND).first.click(modifiers=["Control"])

        def press():
            page.locator("tbody tr", has_text=BOOK).first.click(button="right")
            app.click_reachable(page.get_by_role("menuitem").filter(has_text="Copy Titles").first)
        try:
            refused_then_copied(app, press, "2 titles",
                                lambda t: check(sorted(t.split("\n")) == sorted([BOOK, SECOND]), f"copied {t!r}"),
                                "2 titles copied")
        finally:
            page.keyboard.press("Escape")
    test("COPY-004", "the right-click Copy Titles (2 books): a refusal says so; a copy says \"2 titles copied\"",
         menu_copy_titles)

    def relay_setup_copy():
        app.menu("File", "Relay Setup").click()
        app.click_reachable(page.get_by_text("Mobile Pairing (Optional)", exact=True).first)
        btn = page.locator("#relay-copy-creds-btn")
        btn.wait_for(timeout=5000)
        page.wait_for_timeout(500)          # the section's opening slide
        try:
            app.stub_outside(refuse_clipboard=True)
            n0, c0 = len(app.console), len(app.copied())
            app.click_reachable(btn)
            page.wait_for_function("() => document.getElementById('relay-copy-creds-btn').textContent === \"Couldn't copy\"",
                                   timeout=5000)
            check(len(app.copied()) == c0, "something reached the clipboard while it refused")
            refusal_logged(app, n0, "Credentials", "Relay Setup")
            page.wait_for_function("() => document.getElementById('relay-copy-creds-btn').textContent === 'Copy'",
                                   timeout=5000)
            app.stub_outside(refuse_clipboard=False)
            app.click_reachable(btn)
            page.wait_for_function("() => document.getElementById('relay-copy-creds-btn').textContent === 'Copied'",
                                   timeout=5000)
            check(len(app.copied()) == c0 + 1 and app.copied()[-1].startswith("Channel ID: "), "the credentials weren't copied")
        finally:
            page.keyboard.press("Escape")
    test("COPY-005", "Relay Setup's credentials Copy answers on the button: \"Couldn't copy\" on a refusal, \"Copied\" "
         "on a copy", relay_setup_copy)

    test("COPY-006", "no unexpected console messages (the refusals planted above are UI-06 warnings, expected)",
         lambda: check(not [x for x in app.unexpected_console() if "UI-06" not in x],
                       [x for x in app.unexpected_console() if "UI-06" not in x]))

done()
