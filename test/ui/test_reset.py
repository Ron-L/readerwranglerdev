# Screen test: Reset App with other ReaderWrangler tabs open — it finishes for real, and no other tab undoes it.
# tags: reset, storage, tabs, tier 2
# covers: readerwrangler.js, storage.js, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-06 (the logging comb's finding F3, then measured with two tabs): no tab ever let go of the browser's book
# store, so with a second tab open (1) Reset's delete was BLOCKED and Reset said it was done anyway; (2) reloading the
# reset tab hung on the loading screen until the other tab closed; (3) the other tab, still holding the old library,
# wrote its folders back at its next save — the reset came back half undone ("Your folders and lists are intact").
# The fix (7.25.1): each tab keeps one connection and lets go when another tab deletes the store; a tab that hears
# "reset in another tab" stops saving and says "This tab's contents are out of date. Reload it to continue." (Ron's
# words); and a delete that is
# still blocked (a tab that won't let go — an older build) makes Reset WAIT with "Close your other ReaderWrangler tabs
# to finish the reset", then finish.
import os
import re
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

RELOAD_LIMIT_MS = 120_000   # a normal reload recompiles in the browser (~15-50 s); a hang never ends
INTACT = "Your folders and lists are intact"
OUT_OF_DATE = "ReaderWrangler was reset in another tab."
CLOSE_OTHERS = "Close your other ReaderWrangler tabs to finish the reset"


def reset_app(app):
    app.menu("Tools", "Reset App").click()
    app.page.get_by_role("button", name="Reset App", exact=True).last.click()


with App() as app:
    A = app.page
    app.restore(FIXTURE)
    B, logB = app.open_tab()
    n0 = len(app.console)
    reset_app(app)
    A.get_by_text("Welcome to ReaderWrangler").wait_for(timeout=30_000)
    A.wait_for_timeout(1000)

    test("RESET-001", "with another tab open, Reset App's delete isn't blocked (it said 'done' while it was)",
         lambda: check(not app.console_matching(r"IndexedDB delete blocked|deletion blocked"),
                       "Reset was blocked: " + str(app.console_matching(r"blocked"))))

    def other_tab_told():
        B.get_by_text(OUT_OF_DATE).wait_for(timeout=10_000)
        text = B.get_by_text(OUT_OF_DATE).locator("xpath=ancestor::*[.//button][1]").inner_text()
        check("This tab's contents are out of date. Reload it to continue." in text, text)
    test("RESET-002", "the other tab says it's out of date, with one Reload button", other_tab_told)

    def click_label(page, label):
        """A real mouse click where the label is — if a dialog covers it, the click lands on the dialog, as a person's would."""
        box = page.get_by_text(label, exact=True).first.bounding_box()
        page.mouse.click(box["x"] + box["width"] / 2, box["y"] + box["height"] / 2)
        page.wait_for_timeout(500)

    def reset_holds():
        # The other tab tries a change that saves (copy a book in Fantasy, paste it into An Empty Folder) — its old
        # library must not come back. (2026-11-06: with a real save, the reset tab's reload hung and the folders returned.)
        click_label(B, "Fantasy")
        click_label(B, "Written Together")
        B.keyboard.press("Control+c")
        click_label(B, "An Empty Folder")
        B.keyboard.press("Control+v")
        B.wait_for_timeout(2500)
        t0 = time.time()
        A.reload()
        A.wait_for_selector("#splash", state="detached", timeout=RELOAD_LIMIT_MS)
        A.get_by_text("Welcome to ReaderWrangler").wait_for(timeout=30_000)
        A.wait_for_timeout(1000)
        check(A.get_by_text(INTACT).count() == 0,
              "the reset came back half undone: the Welcome screen says the folders and lists are intact")
        print(f"      (the reset tab reloaded in {time.time() - t0:.0f} s)")
    test("RESET-003", "the reset tab reloads normally (it hung) and stays reset (the other tab's folders came back)",
         reset_holds)
    B.close()

    def blocked_reset_waits():
        app.restore(FIXTURE)
        # A tab that holds the store and won't let go (as an older build does): a raw connection with no listener.
        C, _ = app.open_tab("security.html", wait_for_app=False)
        C.evaluate("""() => new Promise(r => { const q = indexedDB.open('ReaderWranglerDB');
                                               q.onsuccess = () => { window._held = q.result; r(); }; })""")
        reset_app(app)
        A.get_by_text(CLOSE_OTHERS).wait_for(timeout=10_000)
        check(A.get_by_text("Welcome to ReaderWrangler").count() == 0 or A.get_by_text(CLOSE_OTHERS).count() > 0,
              "Reset carried on as if done")
        C.close()
        A.get_by_text(CLOSE_OTHERS).wait_for(state="detached", timeout=15_000)
        A.get_by_text("Welcome to ReaderWrangler").wait_for(timeout=30_000)
    test("RESET-004", "a tab that won't let go makes Reset wait and say so; closing it lets the reset finish",
         blocked_reset_waits)

    # RESET-004 holds the store open ON PURPOSE, so its STORE-09 warning ("held open by another tab") is expected here.
    test("RESET-005", "no unexpected console messages in the reset tab (RESET-004's deliberate STORE-09 excepted)",
         lambda: check(not [x for x in app.unexpected_console() if "STORE-09" not in x],
                       [x for x in app.unexpected_console() if "STORE-09" not in x]))

    # 2026-11-09 (7.26.0-alpha.20): the emergency reset page (reset.html) logs through the logging module too — the
    # original sort of the console lines had missed reset.js. Its log lines are the record that a reset ran.
    def emergency_reset_logged():
        app.restore(FIXTURE)
        R, log = app.open_tab("reset.html", wait_for_app=False)
        R.on("dialog", lambda d: d.accept())
        R.locator("#resetButton").click()
        R.get_by_text("Reset Complete!").wait_for(timeout=30_000)
        lines = [x for _, x in log]
        check([x for x in lines if re.search(r"^info · STORE · Emergency reset: cleared \d+ saved settings", x)],
              "no line saying what the emergency reset cleared: " + str(lines[-6:]))
        check([x for x in lines if re.search(r"^info · STORE · Emergency reset complete", x)], "no 'complete' line")
        R.close()
    test("RESET-006", "the emergency reset page records what it did in the log (STORE)", emergency_reset_logged)

done()
