# Tests for git-hooks/check-saved-reads.py — the commit check that refuses a saved value read with a bare JSON.parse
# instead of the one reader, uiHelpers.js readSaved (7.29.1; TODO 20261109-0912, decided "Must" by Ron).
# tags: commit-checks, storage, tier 1
# covers: git-hooks/check-saved-reads.py, git-hooks/saved-reads-js.js, readerwrangler.html, readerwrangler.js, mobile.js
# Run: python test/test_check_saved_reads.py
#
# One table, a row per shape of read the check must refuse or let through; then the page-derived scope, the real
# scripts as they stand, and a bare read planted in the real mobile.js.
import importlib.util
import os
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("check_saved_reads", os.path.join(ROOT, "git-hooks", "check-saved-reads.py"))
check = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check)

# (id, what, source, refused?)
ROWS = [
    ("BARE-001", "a direct read", "const f = JSON.parse(localStorage.getItem('rw-filters'));\n", True),
    ("BARE-002", "a direct read with a fallback text", "const f = JSON.parse(localStorage.getItem(KEY) || '{}');\n", True),
    ("BARE-003", "through a variable", "const s = localStorage.getItem(KEY);\nif (s) { const f = JSON.parse(s); }\n", True),
    ("BARE-004", "through a variable given the read later", "let s;\ns = localStorage.getItem(KEY);\nJSON.parse(s);\n", True),
    ("BARE-005", "the tab-only storage", "JSON.parse(sessionStorage.getItem('k'));\n", True),
    ("BARE-006", "window.localStorage", "JSON.parse(window.localStorage.getItem('k') || 'null');\n", True),
    ("BARE-007", "inside a hand-written guard (still not the one reader)",
     "let c = null;\ntry { c = JSON.parse(localStorage.getItem(K)); } catch (e) { c = null; }\n", True),
    ("BARE-008", "inside JSX (the apps)", "const A = () => <p>{JSON.parse(localStorage.getItem(K) || '{}').gen}</p>;\n", True),
    ("BARE-009", "a ?: around the read", "const s = localStorage.getItem(K);\nconst v = s ? JSON.parse(s) : null;\n", True),
    ("BARE-010", "the one reader", "const f = readSaved(FILTERS_KEY, null, 'object');\n", False),
    ("BARE-011", "a file's text, drag data, a server's answer — not saved values",
     "async function f(e) {\nJSON.parse(fileText);\nJSON.parse(e.dataTransfer.getData('x'));\nconst r = await fetch(u);\n"
     "JSON.parse(await r.text());\n}\n", False),
    ("BARE-012", "a value merely computed from a saved one (an address built from a saved id)",
     "let id = null;\nid = localStorage.getItem(K);\nasync function f() {\nconst r = await fetch(`/mail/${id}`);\n"
     "JSON.parse(await r.text());\n}\n", False),
    ("BARE-013", "allowed with its why on the line above",
     "// not-readSaved: runs on Amazon's page, where uiHelpers.js isn't loaded\nJSON.parse(localStorage.getItem(K));\n", False),
    ("BARE-014", "allowed with its why on the same line",
     "const v = JSON.parse(localStorage.getItem(K));   // not-readSaved: this IS the reader\n", False),
    ("BARE-015", "a marker with no why is no marker", "// not-readSaved:\nJSON.parse(localStorage.getItem(K));\n", True),
    ("BARE-016", "a marker two code lines up doesn't count",
     "// not-readSaved: the read below this one\nconst a = 1;\nJSON.parse(localStorage.getItem(K));\n", True),
]

failures = 0
passed = 0


def row(tid, ok, msg):
    global failures, passed
    if ok:
        passed += 1
        print(f"  ✓ {tid} {msg}")
    else:
        failures += 1
        print(f"  ✗ {tid} {msg}")


found = check.find_reads([(f"{tid}.js", src) for tid, _, src, _ in ROWS])
for tid, what, _, refused in ROWS:
    hits = [b for b in found["bare"] if b["path"] == f"{tid}.js"]
    if refused:
        row(tid, bool(hits), f"{what}: refused" + (f" (line {hits[0]['line']})" if hits else " — PASSED, should be refused"))
    else:
        row(tid, not hits, f"{what}: passes" + (f" — REFUSED: {hits[0]['code']}" if hits else ""))
row("BARE-017", not found["unparsed"], f"every row parsed {found['unparsed'] or ''}")

# The scope is read from the page: the apps, plus every local script it loads from uiHelpers.js on — not the logging kit
# (loaded before it, and it knows nothing of ReaderWrangler), not the fetchers (they run on Amazon's page).
with open(os.path.join(ROOT, "readerwrangler.html"), encoding="utf-8") as f:
    in_scope = check.scope(f.read())
must = {"readerwrangler.js", "mobile.js", "uiHelpers.js", "integrity.js", "storage.js", "relay-client.js"}
never = {"logkit-settings.js", "logkit/logger.js", "dist/logkit/diagnostics-window.js", "amazon-library-fetcher.js"}
row("BARE-018", must <= set(in_scope) and not (never & set(in_scope)),
    f"the scope comes from the page: {len(in_scope)} scripts — missing {sorted(must - set(in_scope))}, "
    f"wrongly in {sorted(never & set(in_scope))}")

# The scripts as they stand: no bare read, and the allowed ones each say why.
files = []
for p in in_scope:
    with open(os.path.join(ROOT, p), encoding="utf-8") as f:
        files.append((p, f.read()))
now = check.find_reads(files)
bare_now = [(b["path"], b["line"]) for b in now["bare"]]
row("BARE-019", not bare_now and not now["unparsed"],
    "the scripts in scope have no bare read today" + (f" — found {bare_now}" if bare_now else "")
    + (f" — unparsed {now['unparsed']}" if now["unparsed"] else ""))

# A bare read planted in the real phone app is refused, naming the file and the line.
mobile = dict(files)["mobile.js"]
planted = mobile + ("\nfunction plantedForTest() {\n"
                    "    return JSON.parse(localStorage.getItem('readerwrangler-mobile-prefs') || '{}');\n}\n")
hits = check.find_reads([("mobile.js", planted)])["bare"]
last = planted.rstrip("\n").count("\n")   # the read is the planted function's middle line
row("BARE-020", [h["line"] for h in hits] == [last], f"a bare read planted in mobile.js is refused at line {last}: {hits}")

print(f"{passed} passed, {failures} failed")
sys.exit(1 if failures else 0)
