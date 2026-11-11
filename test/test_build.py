# Tests for tools/build.py — the app built ahead of time (TODO "Faster loading").
# tags: build, tooling, tier 1
# covers: tools/build.py, tools/build/compile.js
# Run: python test/test_build.py
#
# 2026-11-10: the page compiled readerwrangler.js in the browser on every load — ~50 s on Ron's PC, the same with 23
# books or 3,270. Now tools/build.py compiles it once into dist/; serve.py rebuilds on demand; the commit check refuses
# a dist/ copy that isn't the build of the staged source.
import importlib.util
import os
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("build", os.path.join(ROOT, "tools", "build.py"))
b = importlib.util.module_from_spec(spec)
spec.loader.exec_module(b)
sys.path.insert(0, os.path.join(ROOT, "test", "ui"))
from harness import check, done, test   # noqa: E402

SAMPLE = """function Hello({ name }) {
    const greeting = 'Hi ' + name;
    let shown = <div className="x">{greeting}</div>;

    return <>
        {shown}
    </>;
}
"""


def compiles_like_the_browser():
    out = b.compile_text(SAMPLE, "sample.js")
    body = out[: -len(b.FOOTER.format(name="sample.js"))]
    check("React.createElement" in body and "<div" not in body, f"JSX became React.createElement:\n{body}")
    check("React.Fragment" in body, "a <>…</> fragment became React.Fragment")
    check("const " not in body and "let " not in body and "var greeting" in body,
          f"const / let became var, as the browser's compile did:\n{body}")
    check("import " not in body and "require(" not in body, "no imports: React is a global (the classic runtime)")
    check(body.count("\n") == SAMPLE.count("\n") - 1 or body.count("\n") == SAMPLE.count("\n"),
          "the same number of lines as the source")
    check(body.split("\n")[1].strip().startswith("var greeting"), "each statement stays on its source line (line 2)")
    check(out.endswith(b.FOOTER.format(name="sample.js")), "the footer says it's built and from what")
test("BUILD-001", "the compile turns JSX into React.createElement and const/let into var, keeping every line",
     compiles_like_the_browser)


def syntax_error_named():
    try:
        b.compile_text("function broken( {\n", "broken.js")
    except b.BuildError as e:
        check("broken.js" in str(e), f"the error names the file: {e}")
        return
    raise AssertionError("a syntax error must raise BuildError")
test("BUILD-002", "a source that doesn't compile raises BuildError, naming the file", syntax_error_named)


def staged_mismatch_refused():
    good = b.compile_text(SAMPLE, "readerwrangler.js")
    files = {"readerwrangler.js": SAMPLE, "dist/readerwrangler.js": good}
    real = b._staged, b.subprocess.run

    class Done:
        stdout = "readerwrangler.js\ndist/readerwrangler.js\n"
    try:
        b._staged = lambda p: files.get(p)
        b.subprocess.run = lambda args, **k: Done() if args[:2] == ["git", "diff"] else real[1](args, **k)
        check(b.staged_problems() == [], f"the copy IS the build: no problem — {b.staged_problems()}")
        files["readerwrangler.js"] = SAMPLE.replace("Hi ", "Hello ")              # source edited, copy not rebuilt
        p = b.staged_problems()
        check(len(p) == 1 and "isn't the build" in p[0], f"an out-of-date copy is refused: {p}")
        del files["dist/readerwrangler.js"]
        p = b.staged_problems()
        check(len(p) == 1 and "isn't in this commit" in p[0], f"a missing copy is refused: {p}")
    finally:
        b._staged, b.subprocess.run = real
test("BUILD-003", "the commit check refuses a dist/ copy that isn't the build of the staged source (or is missing)",
     staged_mismatch_refused)


def rebuild_only_when_stale():
    calls, real_build, real_root = [], b.build, b.ROOT
    with tempfile.TemporaryDirectory() as tmp:
        try:
            b.ROOT, b.build = tmp, lambda name: (calls.append(name),
                                                  open(os.path.join(tmp, "dist", name), "w").write("built"))
            os.makedirs(os.path.join(tmp, "dist"))
            src = os.path.join(tmp, "app.js")
            open(src, "w").write("x")
            check(b.build_if_stale("app.js") and calls == ["app.js"], "no copy yet: built")
            check(not b.build_if_stale("app.js") and calls == ["app.js"], "copy newer than the source: not rebuilt")
            later = time.time() + 5
            os.utime(src, (later, later))                                        # the source edited after the build
            check(b.build_if_stale("app.js") and calls == ["app.js", "app.js"], "source newer: rebuilt")
        finally:
            b.ROOT, b.build = real_root, real_build
test("BUILD-004", "serve.py's rebuild on demand builds only when the copy is missing or older than its source",
     rebuild_only_when_stale)


# Step 2 (2026-11-11): the styles. Three pages loaded Tailwind's in-browser builder (cdn.tailwindcss.com → 3.4.17), which
# wrote the styles on every load; now tools/build.py builds dist/tailwind.css with the same Tailwind.
def styles_for_the_classes_used():
    with tempfile.TemporaryDirectory() as tmp:
        page = os.path.join(tmp, "page.html")
        open(page, "w").write('<div class="p-4 text-blue-600 hover:underline md:flex">x</div>')
        script = os.path.join(tmp, "app.js")
        open(script, "w").write("const c = isOpen ? 'bg-red-50' : 'rounded-lg';")
        css = b.compile_css([page, script])
    for rule in (".p-4", ".text-blue-600", ".hover\\:underline:hover", ".bg-red-50", ".rounded-lg", ".md\\:flex"):
        check(rule in css, f"the styles for {rule} are built")
    check(".p-5" not in css and ".text-green-700" not in css, "and no styles for classes nothing uses")
    check("box-sizing:border-box" in css.replace(" ", ""), "with the base reset the in-browser builder put first")
test("BUILD-005", "the stylesheet has the styles for the classes the pages and scripts use, and no others",
     styles_for_the_classes_used)


def reads_root_pages_and_scripts():
    tracked = ["readerwrangler.html", "reset.html", "storage.js", "dist/readerwrangler.js", "test/ui/rw.py",
               "v4/readerwrangler.html", "docs/x.md", "readerwrangler.css", "tools/build.py"]
    got = b.style_sources(tracked)
    check(got == ["readerwrangler.html", "reset.html", "storage.js"],
          f"only the pages and scripts at the project root (never the built copies, never other folders): {got}")
test("BUILD-006", "the stylesheet is built from the tracked pages and scripts at the project root, nothing else",
     reads_root_pages_and_scripts)


def stale_stylesheet_refused():
    files = {"readerwrangler.html": '<div class="p-4">x</div>', "storage.js": "",
             "dist/tailwind.css": None}
    files["dist/tailwind.css"] = b.compile_css_texts({k: v for k, v in files.items() if not k.startswith("dist/")})
    real = b._staged, b._tracked, b._staged_paths
    try:
        b._staged = lambda p: files.get(p)
        b._tracked = lambda: [k for k in files if files[k] is not None]
        b._staged_paths = lambda: {"readerwrangler.html"}
        check(b.staged_style_problems() == [], f"the stylesheet IS the build: no problem — {b.staged_style_problems()}")
        files["readerwrangler.html"] = '<div class="p-4 text-red-700">x</div>'   # a new class, stylesheet not rebuilt
        p = b.staged_style_problems()
        check(len(p) == 1 and "tailwind.css" in p[0], f"an out-of-date stylesheet is refused: {p}")
    finally:
        b._staged, b._tracked, b._staged_paths = real
test("BUILD-007", "the commit check refuses a dist/tailwind.css that isn't the build of the staged pages and scripts",
     stale_stylesheet_refused)

done()
