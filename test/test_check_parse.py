# Tests for git-hooks/check-parse.py — the commit check that refuses any staged script that doesn't parse.
# tags: commit-checks, tier 1
# covers: git-hooks/check-parse.py, git-hooks/parse-js.js
# Run: python test/test_check_parse.py
#
# One table, a row per kind of file the check must handle; each row says whether it must pass or be refused.
import importlib.util
import os
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # print ✓ even when piped (2026-11-12; as harness.py)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("check_parse", os.path.join(ROOT, "git-hooks", "check-parse.py"))
check_parse = importlib.util.module_from_spec(spec)
spec.loader.exec_module(check_parse)

# (id, path, source, should parse)
ROWS = [
    ("PARSE-001", "plain.js", "function f(a) { return a + 1; }\n", True),
    ("PARSE-002", "app.js", "const App = () => <div className=\"x\">{1}</div>;\n", True),          # JSX (the app, phone)
    ("PARSE-003", "worker.js", "export default { fetch() { return 1; } };\n", True),                 # module (relay worker)
    ("PARSE-004", "test.mjs", "import fs from 'fs';\nconsole.log(fs);\n", True),
    ("PARSE-005", "broken.js", "function f(a) { return a + 1;\n", False),                             # missing brace
    ("PARSE-006", "mangled.js", "const s = 'it\\'s fine';\nconst t = 'broken\n';\n", False),          # an escape gone wrong
    ("PARSE-007", "badjsx.js", "const A = () => <div>;\n", False),
    ("PARSE-008", "tool.py", "def f(a):\n    return a + 1\n", True),
    ("PARSE-009", "broken.py", "def f(a)\n    return a\n", False),
    ("PARSE-010", "nul.js", "const a = 1;\x00\n", False),                                            # a null byte
]

failures = 0
errors = check_parse.syntax_errors([(path, src.encode("utf-8")) for _, path, src, _ in ROWS])
for tid, path, _, ok in ROWS:
    refused = [e for e in errors if e.startswith(path + ":")]
    if ok and refused:
        failures += 1
        print(f"  ✗ {tid} {path}: should parse, was refused: {refused[0]}")
    elif not ok and not refused:
        failures += 1
        print(f"  ✗ {tid} {path}: should be refused, passed")
    else:
        print(f"  ✓ {tid} {path}" + (f" — {refused[0]}" if refused else ""))

# Every refusal names its file — a refusal for a file not in the table means a row's path leaked or got mangled.
paths = {path for _, path, _, _ in ROWS}
stray = [e for e in errors if e.split(":", 1)[0] not in paths]
if stray:
    failures += 1
    print(f"  ✗ PARSE-099 refusals that name no known file: {stray}")

print(f"{len(ROWS) - failures if failures <= len(ROWS) else 0} passed, {failures} failed")
sys.exit(1 if failures else 0)
