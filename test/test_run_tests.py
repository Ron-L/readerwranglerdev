# Tests for tools/run_tests.py — the one test runner (docs/design/TESTING.md §4).
# tags: test-runner, tier 1
# covers: tools/run_tests.py, tools/local_relay.py, test/harness.js
# Run: python test/test_run_tests.py
#
# Sample test files are written to a temporary folder; each row checks one thing the runner must do.
import contextlib
import importlib.util
import io
import os
import socket
import subprocess
import sys
sys.stdout.reconfigure(encoding="utf-8", errors="replace")   # print ✓ even when piped (2026-11-12; as harness.py)
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("run_tests", os.path.join(ROOT, "tools", "run_tests.py"))
rt = importlib.util.module_from_spec(spec)
spec.loader.exec_module(rt)

HARNESS = os.path.join(ROOT, "test", "harness.js").replace("\\", "/")
results = []


def row(tid, name, ok, detail=""):
    results.append((tid, name, ok, detail))
    print(f"  {'✓' if ok else '✗'} {tid} {name}" + ("" if ok else f" — {detail}"))


with tempfile.TemporaryDirectory() as d:
    def write(name, text):
        p = os.path.join(d, name)
        with open(p, "w", encoding="utf-8") as f:
            f.write(text)
        return p

    js_ok = write("a.test.js", f"""// sample
// tags: merge, import, tier 1
// covers: bookMerge.js, storage.js
const {{ test, done }} = require('{HARNESS}');
test('SAMPLE-001', 'passes', () => {{}});
done();
""")
    js_bad = write("b.test.js", f"""// sample
// tags: dates, tier 1
// covers: uiHelpers.js
const {{ test, done }} = require('{HARNESS}');
test('SAMPLE-002', 'fails', () => {{ throw new Error('boom'); }});
test('SAMPLE-003', 'still runs after a failure', () => {{}});
done();
""")
    py_ok = write("test_c.py", """# sample
# tags: commit-checks, tier 1
# covers: git-hooks/check-parse.py
print("1 passed, 0 failed")
""")
    no_header = write("d.test.js", "// no header at all\nconsole.log('hi');\n")
    ui = write("test_e.py", "# sample\n# tags: delete-key, tier 2\n# covers: readerwrangler.js\n")

    h = rt.read_header(js_ok)
    row("RUN-001", "reads tags, tier and covers from a // header",
        h["tags"] == ["merge", "import"] and h["tier"] == 1 and h["covers"] == ["bookMerge.js", "storage.js"], str(h))
    h = rt.read_header(py_ok)
    row("RUN-002", "reads a # header (Python files)",
        h["tags"] == ["commit-checks"] and h["tier"] == 1 and h["covers"] == ["git-hooks/check-parse.py"], str(h))
    h = rt.read_header(no_header)
    row("RUN-003", "a file with no header is reported as missing one (headers are required)",
        h["problem"] is not None, str(h))

    files = [rt.TestFile(p) for p in (js_ok, js_bad, py_ok, ui)]
    def pick(**kw):
        return sorted(os.path.basename(f.path) for f in rt.select(files, **kw))
    row("RUN-004", "--changed picks the tests that cover a changed file",
        pick(changed=["bookMerge.js"]) == ["a.test.js"], str(pick(changed=["bookMerge.js"])))
    row("RUN-005", "--changed picks nothing for a file no test covers",
        pick(changed=["readme.txt"]) == [], str(pick(changed=["readme.txt"])))
    own = [os.path.relpath(js_bad, d)]
    row("RUN-006", "--changed picks a test file that itself changed",
        pick(changed=own, base=d) == ["b.test.js"], str(pick(changed=own, base=d)))
    row("RUN-007", "--tag picks by area", pick(tags=["dates"]) == ["b.test.js"], str(pick(tags=["dates"])))
    row("RUN-008", "--tier 1 leaves out tier 2", pick(tier=1) == ["a.test.js", "b.test.js", "test_c.py"], str(pick(tier=1)))
    row("RUN-009", "--tier all keeps every tier", pick(tier="all") == ["a.test.js", "b.test.js", "test_c.py", "test_e.py"],
        str(pick(tier="all")))

    ok, out = rt.run_file(rt.TestFile(js_ok))
    row("RUN-010", "a passing JS file reports success", ok and "1 passed, 0 failed" in out, out[-200:])
    ok, out = rt.run_file(rt.TestFile(js_bad))
    row("RUN-011", "a failing JS file reports failure", not ok and "SAMPLE-002" in out, out[-200:])
    row("RUN-012", "a failure doesn't stop the file — the next test still ran", "SAMPLE-003" in out, out[-200:])
    ok, out = rt.run_file(rt.TestFile(py_ok))
    row("RUN-013", "a passing Python file reports success", ok, out[-200:])

    ui_py = write("test_f.py", "# sample\n# tags: screen, tier 2\n# covers: readerwrangler.js\n"
                               "import sys\nprint('ran with', sys.executable)\n")
    ok, out = rt.run_file(rt.TestFile(ui_py))
    row("RUN-014", "a screen test (tier 2) runs with the project's venv Python",
        ok and ".venv" in out.replace("\\", "/"), out[-200:])
    saved, rt.VENV_PY = rt.VENV_PY, os.path.join(d, "no-such-venv", "python.exe")
    ok, out = rt.run_file(rt.TestFile(ui_py))
    rt.VENV_PY = saved
    row("RUN-015", "no venv → the screen test fails loud with the setup command (never skipped quietly)",
        not ok and "py -m venv .venv" in out, out[-200:])

    # --- Tier 3: the runner starts and stops its own local relay (TODO "Turn more of our working rules into automatic
    # checks", item 3; 7.28.0 post-mortem: stopping a relay by hand left four processes serving its port). No real
    # wrangler here (tier 1): a stand-in "relay" — a Python script that starts a CHILD which serves the port (as wrangler's
    # workerd does), then prints wrangler's ready line. Every process it starts writes "<role> <id>" to a list, so the
    # test can check each one is gone afterwards — by its own look (tasklist), not the runner's.
    standin = write("standin_relay.py", r'''import http.server, os, socket, subprocess, sys, time
mode, port, pids = sys.argv[1], int(sys.argv[2]), sys.argv[3]
def note(role):
    with open(pids, "a") as f:
        f.write(f"{role} {os.getpid()}\n")
def me(m):
    return [sys.executable, __file__, m, str(port), pids]
def child(m):
    return subprocess.Popen(me(m), stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, stdin=subprocess.DEVNULL)
def wait_served():
    for _ in range(100):
        try:
            socket.create_connection(("127.0.0.1", port), 0.2).close()
            return
        except OSError:
            time.sleep(0.1)
    sys.exit("the stand-in's server never came up")
if mode == "serve":
    note("server")
    class H(http.server.BaseHTTPRequestHandler):
        def do_GET(self):
            self.send_response(200); self.end_headers(); self.wfile.write(b"stand-in relay")
        def log_message(self, *a):
            pass
    http.server.HTTPServer(("127.0.0.1", port), H).serve_forever()
elif mode == "middle":
    note("middle")
    child("serve")
    wait_served()                     # then exit: the server is left with no parent — it has escaped the tree
else:
    note("relay")
    if mode == "orphan":
        subprocess.run(me("middle"), stdin=subprocess.DEVNULL)
    else:
        child("serve")
    wait_served()
    if mode != "never":
        print(f"[wrangler:info] Ready on http://127.0.0.1:{port}", flush=True)
    time.sleep(600)
''')
    relay_test = write("test-relay-sample.py", "# sample\n# tags: relay, tier 3\n# covers: relay/relay-worker.js\n"
                       "import os, sys, urllib.request\nurl = os.environ.get('RELAY_URL', '')\n"
                       f"open({os.path.join(d, 'seen-url.txt')!r}, 'w').write(url)\n"
                       "print('answer:', urllib.request.urlopen(url, timeout=5).read().decode())\n")
    lr = rt.local_relay      # the runner's own copy (tools/local_relay.py), so its errors are the ones it catches

    def running():
        """The ids running now — the whole process list, read raw (not the runner's stop-and-check code). It must hold
        this test's own id, or the list is broken and "nothing left running" would prove nothing (setup check)."""
        now = set(lr.processes())
        if os.getpid() not in now:
            raise AssertionError(f"the process list doesn't show this test's own id {os.getpid()} — can't check")
        return now

    def run_main(argv, mode=None, start_s=20):
        """main() on the sample tier-3 file, with the stand-in relay in `mode`. (exit code, printed text, {role: id})"""
        pids = os.path.join(d, f"pids-{mode}.txt")
        for p in (pids, os.path.join(d, "seen-url.txt")):
            if os.path.exists(p):
                os.remove(p)
        relay = (lambda: lr.LocalRelay(command=[sys.executable, standin, mode, "{port}", pids], cwd=d, start_s=start_s,
                                       stop_s=1)) if mode else None
        buf = io.StringIO()
        with contextlib.redirect_stdout(buf):
            code = rt.main(argv, files=[rt.TestFile(relay_test)], relay=relay)
        started = {}
        if os.path.exists(pids):
            for ln in open(pids).read().split("\n"):
                if ln.strip():
                    role, pid = ln.split()
                    started[role] = int(pid)
        seen = open(os.path.join(d, "seen-url.txt")).read() if os.path.exists(os.path.join(d, "seen-url.txt")) else None
        return code, buf.getvalue(), started, seen

    code, out, started, seen = run_main(["--tier", "3"], mode="ok")
    row("RUN-016", "with no --relay-url, tier 3 runs against a local relay the runner started — the file gets its "
        "address and the relay answers there",
        code == 0 and seen is not None and seen.startswith("http://127.0.0.1:") and "relay" in started
        and "server" in started,     # the sample file passes only when the address it was given answered
        f"exit {code}, url seen {seen!r}, started {started}: {out[-400:]}")
    port = int(seen.rsplit(":", 1)[1]) if seen and seen.startswith("http://127.0.0.1:") else None
    with socket.socket() as s:
        s.settimeout(0.5)
        port_free = port is not None and s.connect_ex(("127.0.0.1", port)) != 0
    now = running()
    left = [f"{role} {pid}" for role, pid in started.items() if pid in now]
    row("RUN-017", "afterwards every process the relay started is gone — the relay AND its child — and the port is free",
        set(started) == {"relay", "server"} and not left and port_free,
        f"started {started}; still running {left}; port {port} free: {port_free}")

    code, out, started, _ = run_main(["--tier", "3"], mode="never", start_s=1.5)
    now = running()
    left = [f"{role} {pid}" for role, pid in started.items() if pid in now]
    row("RUN-018", "a relay that never says it's ready fails the run loud — and what it started is stopped",
        code == 1 and "didn't say it was ready within 1.5 s" in out and set(started) == {"relay", "server"} and not left,
        f"exit {code}, started {started}, still running {left}: {out[-400:]}")

    code, out, started, _ = run_main(["--tier", "3"], mode="orphan")
    escaped = started.get("server")
    now = running()
    row("RUN-019", "a child that escaped the tree and still serves the port fails the run, named by its id — and the "
        "runner leaves it running (not provably its own)",
        code == 1 and escaped is not None and f"process {escaped}" in out and "still in use" in out
        and escaped in now,
        f"exit {code}, started {started}: {out[-600:]}")
    for pid in started.values():      # the test's own cleanup — by exact id, processes this test started
        if pid in now:
            subprocess.run(["taskkill", "/PID", str(pid), "/F"], capture_output=True)   # one process each — never /T

    def no_relay():
        raise AssertionError("a relay was started although --relay-url named one")
    if os.path.exists(os.path.join(d, "seen-url.txt")):
        os.remove(os.path.join(d, "seen-url.txt"))      # never read the previous test's address
    given_port = lr.free_port()
    given = f"http://127.0.0.1:{given_port}"
    srv = subprocess.Popen([sys.executable, standin, "serve", str(given_port), os.path.join(d, "pids-given.txt")],
                           stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    try:
        for _ in range(100):
            try:
                socket.create_connection(("127.0.0.1", given_port), 0.2).close()
                break
            except OSError:
                time.sleep(0.1)
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                code = rt.main(["--tier", "3", "--relay-url", given], files=[rt.TestFile(relay_test)], relay=no_relay)
        except AssertionError as e:
            code = str(e)
        seen = open(os.path.join(d, "seen-url.txt")).read() if os.path.exists(os.path.join(d, "seen-url.txt")) else None
        row("RUN-020", "--relay-url given → no relay is started, and the file gets that address (as before)",
            code == 0 and seen == given, f"exit {code}, url seen {seen!r}, given {given}: {buf.getvalue()[-300:]}")
    finally:
        srv.kill()      # the one process this test started (no children here)
        srv.wait(10)

    a = lr.WRANGLER_ARGS
    row("RUN-021", "the real relay is wrangler's LOCAL emulator on 127.0.0.1 — never the dev or production relay",
        "--local" in a and a[a.index("--ip") + 1] == "127.0.0.1" and "--remote" not in a and "{port}" in a, str(a))

    # --- A release run counts "skipped" as failed (TODO "Turn more of our working rules…", item 4; 7.28.0 post-mortem:
    # "31 passed, 2 skipped" read as a pass). Nothing skips today, so the test plants a reason through the runner's one
    # place that decides a skip (skip_reason) — keeping the original to put back.
    def run_with_skip(argv):
        saved = getattr(rt, "skip_reason", None)
        rt.skip_reason = lambda f: "SAMPLE-SKIP: the sample says it can't run here" if f.path == py_ok else None
        buf = io.StringIO()
        try:
            with contextlib.redirect_stdout(buf):
                code = rt.main(argv, files=[rt.TestFile(js_ok), rt.TestFile(py_ok)])
        except SystemExit as e:          # an unknown flag: argparse exits
            code = f"SystemExit {e.code}"
        finally:
            if saved is None:
                del rt.skip_reason
            else:
                rt.skip_reason = saved
        return code, buf.getvalue()

    code, out = run_with_skip(["--tier", "1", "--release"])
    row("RUN-022", "--release: a skipped file fails the run, naming the file and why",
        code == 1 and "test_c.py" in out and "SAMPLE-SKIP: the sample says it can't run here" in out
        and "a.test.js" in out, f"exit {code}: {out[-400:]}")
    code, out = run_with_skip(["--tier", "1"])
    row("RUN-023", "without --release a skip is reported as skipped and the run still passes (as before)",
        code == 0 and "1 skipped" in out and "test_c.py: skipped" in out, f"exit {code}: {out[-400:]}")
    buf = io.StringIO()
    try:
        with contextlib.redirect_stdout(buf):
            code = rt.main(["--tier", "1", "--release"], files=[rt.TestFile(js_ok), rt.TestFile(py_ok)])
    except SystemExit as e:
        code = f"SystemExit {e.code}"
    row("RUN-024", "--release with nothing skipped passes (the flag isn't a blanket failure)",
        code == 0 and "2 file(s) passed" in buf.getvalue(), f"exit {code}: {buf.getvalue()[-300:]}")

failed = [r for r in results if not r[2]]
print(f"{len(results) - len(failed)} passed, {len(failed)} failed")
sys.exit(1 if failed else 0)
