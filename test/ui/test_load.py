# Screen test: the app opens fast because it's built ahead of time — no compiler in the browser.
# tags: build, load, tier 2
# covers: readerwrangler.html, tools/build.py, serve.py
# Run: py tools/run_tests.py --tier 2     (or directly with the venv's Python)
#
# 2026-11-10 (TODO "Faster loading"): the page compiled readerwrangler.js in the browser on every load (Babel from a
# CDN) — ~50 s on Ron's PC, with 23 books or 3,270. Now it loads dist/readerwrangler.js, built by tools/build.py
# (serve.py rebuilds it when the source changes). Measured with tools/time_load.py: 0.7 s to the app, 1.3 s to Ron's
# 3,270 books. These tests fail if the page ever compiles in the browser again.
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from harness import check, done, test   # noqa: E402
from rw import App                       # noqa: E402

with App() as app:
    page = app.page
    asked = []
    page.on("request", lambda r: asked.append(r.url))
    app.reload()
    seconds = page.evaluate("performance.now() / 1000")   # since this load began: the app has replaced the splash

    def built_copy_no_compiler():
        app_scripts = [u for u in asked if "readerwrangler.js" in u]
        check(any("/dist/readerwrangler.js" in u for u in app_scripts),
              f"the page loads the BUILT copy (dist/readerwrangler.js): {app_scripts}")
        check(not any("/readerwrangler.js" in u and "/dist/" not in u for u in app_scripts),
              f"…and never the source: {app_scripts}")
        compilers = [u for u in asked if "babel" in u.lower()]
        check(not compilers, f"no in-browser compiler is fetched: {compilers}")
        check(page.evaluate("typeof window.Babel") == "undefined", "no Babel on the page")
    test("LOAD-001", "the page runs the built copy from dist/ — no in-browser compiler", built_copy_no_compiler)

    # step 2 (2026-11-11): the styles, built ahead of time — three pages loaded Tailwind's in-browser builder
    # (cdn.tailwindcss.com) and wrote them on every load. A comparison of every element's computed style, with the
    # builder and with the built stylesheet, found no difference (8 app screens, the phone, the reset and security pages).
    def built_styles_no_builder():
        for pg in ("readerwrangler.html", "reset.html", "security.html"):
            asked.clear()
            if pg == "readerwrangler.html":
                app.reload()
            else:
                page.goto(f"http://localhost:{app.port}/{pg}")
                page.wait_for_load_state("load")
            check(any("/dist/tailwind.css" in u for u in asked), f"{pg} loads the built stylesheet (dist/tailwind.css)")
            builder = [u for u in asked if "tailwindcss.com" in u]
            check(not builder, f"{pg} fetches no in-browser style builder: {builder}")
            check(page.evaluate("typeof window.tailwind") == "undefined", f"{pg}: no Tailwind builder on the page")
            check(page.evaluate("getComputedStyle(document.body).margin") == "0px",
                  f"{pg}: the built stylesheet is applied (its base reset sets the body's margin to 0)")
    test("LOAD-003", "the app, the reset page and the security page use the built stylesheet — no in-browser builder",
         built_styles_no_builder)

    def opens_fast():
        check(seconds < 10, f"the app opened in {seconds:.1f} s — compiling in the browser took ~50 s (the bound is 10 s, "
                            "far above today's ~0.5 s, so a slow moment can't fail it)")
    test("LOAD-002", "the app is on screen within 10 seconds of a reload", opens_fast)

done()
