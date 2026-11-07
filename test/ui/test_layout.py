# Screen test: nothing covers a scroll area or its scrollbar — at any zoom, whatever the status bar holds.
# tags: layout, statusbar, tier 2
# covers: readerwrangler.js, readerwrangler.css, readerwrangler.html
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-06 (Ron): the right pane's horizontal scrollbar was a sliver at 125% browser zoom and gone at 150% — the status
# bar floated over the window's bottom edge, the panes left a fixed 24 px for it, and with Cloud Sync on its icon makes the
# bar 33 px tall, so it covered the panes' bottom 9 px (where the scrollbar is). The rows: zoom x the bar as it is / as
# tall as the Cloud Sync icon makes it, in List View (the wide table, so there is a horizontal scrollbar) and Cover View.
# A window of 1000 x 900 screen pixels, so the table is wider than the pane at every zoom here. On a failure the picture
# with every layer outlined (rw.show_boxes, PRINCIPLES Law 19) is saved and named.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import FIXTURE, App              # noqa: E402

RIGHT_PANE = ".overflow-auto.pb-16"      # the right pane's scroll area (readerwrangler.js, the dragVirtScrollRef box)


def nothing_covered(app, label):
    problems = app.covered_scroll_boxes()
    if problems:
        pic = app.show_boxes(app.page.locator(RIGHT_PANE).first, "LAYOUT-" + label)
        check(False, "\n".join(problems[:4]) + f"\n(every layer outlined: {pic})")


# Written out, so  run_tests.py --id LAYOUT-005  finds them: (list, list with a tall bar, cover view, console) per zoom.
IDS = {1.0: ["LAYOUT-001", "LAYOUT-002", "LAYOUT-003", "LAYOUT-004"], 1.25: ["LAYOUT-005", "LAYOUT-006", None, "LAYOUT-007"]}
for zoom in (1.0, 1.25):
    ids = IDS[zoom]
    pct = f"{round(zoom * 100)}%"
    with App(zoom=zoom, size=(1000, 900)) as app:
        app.restore(FIXTURE)
        app.menu("View", "List View").click()
        app.page.locator(RIGHT_PANE).first.wait_for()
        test(ids[0], f"List View at {pct}: nothing covers a scroll area or its scrollbar",
             lambda: nothing_covered(app, f"list-{pct}"))

        untall = app.status_bar_taller(24)
        app.page.wait_for_timeout(300)
        test(ids[1], f"List View at {pct}, the status bar as tall as the Cloud Sync icon makes it: still nothing covered",
             lambda: nothing_covered(app, f"list-tall-{pct}"))
        untall()

        if zoom == 1.0:
            app.menu("View", "Cover View").click()
            app.page.wait_for_timeout(500)
            test(ids[2], "Cover View at 100%: nothing covers a scroll area or its scrollbar",
                 lambda: nothing_covered(app, "covers-100%"))

        test(ids[3], f"no unexpected console messages at {pct}",
             lambda: check(not app.unexpected_console(), app.unexpected_console()))

done()
