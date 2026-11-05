"""
test/ui/rw.py — the shared setup every screen test uses (docs/design/TESTING.md §2, §5, §7; 2026-11-04).

    with App() as app:                      # serve.py on a free port + a fresh, throwaway Edge profile
        app.restore(FIXTURE)                # File → Restore Backup… through the real menu and file box
        app.left_count("All Books")         # the count the left pane shows for an entry
        app.unexpected_console()            # console errors / warnings / crashes not on the known-noise list
        app.violations                      # requests to a relay or to Amazon — the tests must make none
        app.shot("name")                    # a screenshot in the artifacts folder

    with App(relay=True) as app:            # the same, plus a LOCAL relay and a throwaway test channel (Cloud Sync on)
        app.upload_fetch(items)             # send books as the library fetcher does (one "books" run)
        app.import_from_relay()             # File → Import from Relay, through the real menu

Rules it enforces (TESTING.md §5, §7): a fresh browser profile every time (Playwright's default — nothing of Ron's);
serve.py stopped by its exact process (Law 5); GoatCounter answered with an empty reply (tests never touch the usage
statistics); any request to a relay or to Amazon recorded as a violation; a data file carrying a Cloud Sync Key
refused. RW_HEADED=1 shows the browser (slowed down) for watching a test. Screenshots go to RW_TEST_ARTIFACTS, else
%TEMP%\\rw-test-artifacts.

The local relay (LocalRelay, 2026-11-05) is Cloudflare's own emulator (`wrangler dev --local`) running relay-worker.js
on this PC with an empty store made for the run and deleted after — never the dev or production relay, which the
request detector still catches. Its process tree is stopped by its exact id (Law 5).
"""
import gzip
import json
import os
import re
import shutil
import socket
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request

from playwright.sync_api import sync_playwright

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
FIXTURE = os.path.join(ROOT, "test", "fixtures", "small-fixture.json")
DEMO = os.path.join(ROOT, "readerwrangler-demo-library-ORGANIZED.json")
LARGE = os.path.join(ROOT, ".private", "test", "large-sample-private.json.gz")
ARTIFACTS = os.environ.get("RW_TEST_ARTIFACTS") or os.path.join(tempfile.gettempdir(), "rw-test-artifacts")

# Console messages that are expected today — each with its reason. Anything else fails a test. These three go away
# with "Faster loading: build the app ahead of time" (the in-browser compiler and style builder leave).
KNOWN_NOISE = [
    (r"cdn\.tailwindcss\.com should not be used in production", "the in-browser style builder — leaves with the precompile"),
    (r"You are using the in-browser Babel transformer", "the in-browser compiler — leaves with the precompile"),
    (r"\[BABEL\] Note: The code generator has deoptimised the styling",
     "Babel's note on a file over 500 KB — leaves with the precompile"),
    (r"goatcounter: not counting because of: localhost", "GoatCounter declining localhost"),
    (r"status of 404 \(Not Found\) \[http://127\.0\.0\.1:\d+/(pointer|status)/",
     "a new, empty channel has no saved copy or status yet — the relay answers 404 and the browser itself prints it "
     "(not our code; every new user sees it today)"),
]
FORBIDDEN_HOSTS = re.compile(r"workers\.dev|amazon\.|media-amazon|ssl-images-amazon")
APP_TIMEOUT_MS = 180_000     # the in-browser compile takes ~50 s on a cold profile today

# The local relay: wrangler from relay/node_modules (relay/package.json), and a made-up channel that exists only in the
# run's throwaway store. Credentials are planted at run time, never in a data file (test data never carries a key).
RELAY_DIR = os.path.join(ROOT, "relay")
WRANGLER = os.path.join(RELAY_DIR, "node_modules", "wrangler", "bin", "wrangler.js")
TEST_CHANNEL = "44444444-5555-4666-8777-888888888888"
TEST_PASSPHRASE = "screen-test-passphrase"
RELAY_START_S = 60


def _free_port():
    s = socket.socket()
    s.bind(("127.0.0.1", 0))
    port = s.getsockname()[1]
    s.close()
    return port


def _stop_tree(proc):
    """Stop a process we started, and everything it started, by its exact id (Law 5) — never by name or pattern."""
    if proc.poll() is None:
        if os.name == "nt":
            subprocess.run(["taskkill", "/PID", str(proc.pid), "/T", "/F"], capture_output=True)
        else:
            proc.terminate()
    try:
        proc.wait(10)
    except subprocess.TimeoutExpired:
        proc.kill()


class LocalRelay:
    """relay-worker.js in Cloudflare's emulator on this PC, accepting requests from `origin` (the test app's address —
    the worker allows only listed pages; --var sets that for this run without touching wrangler.toml)."""

    def __init__(self, origin):
        self.origin = origin

    def __enter__(self):
        node = shutil.which("node")
        if not node or not os.path.exists(WRANGLER):
            raise RuntimeError("the local relay needs node and wrangler — run  npm install  in the relay folder")
        self.port = _free_port()
        self.store = tempfile.mkdtemp(prefix="rw-test-relay-")
        self.log_path = os.path.join(self.store, "wrangler.log")
        self._log = open(self.log_path, "w", encoding="utf-8")
        self.proc = subprocess.Popen(
            [node, WRANGLER, "dev", "--env", "dev", "--local", "--ip", "127.0.0.1", "--port", str(self.port),
             "--inspector-port", str(_free_port()), "--persist-to", os.path.join(self.store, "state"),
             "--var", f"ALLOWED_ORIGINS:{self.origin}", "--show-interactive-dev-session=false", "--log-level", "warn"],
            cwd=RELAY_DIR, stdout=self._log, stderr=subprocess.STDOUT)
        self.url = f"http://127.0.0.1:{self.port}"
        deadline = time.time() + RELAY_START_S
        while time.time() < deadline:
            if self.proc.poll() is not None:
                break
            try:
                urllib.request.urlopen(urllib.request.Request(self.url + "/", method="OPTIONS",
                                                              headers={"Origin": self.origin}), timeout=2)
                return self
            except urllib.error.HTTPError:
                return self                     # it answered — any answer means it's up
            except OSError:
                time.sleep(0.1)
        tail = self.read_log()[-1500:]
        self.__exit__()
        raise RuntimeError(f"the local relay didn't start within {RELAY_START_S} s:\n{tail}")

    def read_log(self):
        try:
            self._log.flush()
            return open(self.log_path, encoding="utf-8", errors="replace").read()
        except OSError:
            return ""

    def __exit__(self, *exc):
        try:
            _stop_tree(self.proc)
        finally:
            self._log.close()
            shutil.rmtree(self.store, ignore_errors=True)


class App:
    def __init__(self, headed=None, relay=False):
        self.headed = os.environ.get("RW_HEADED") == "1" if headed is None else headed
        self.want_relay = relay
        self.relay = None
        self.console, self.crashes, self.violations = [], [], []

    # --- start / stop -------------------------------------------------------------------------------------------
    def __enter__(self):
        self.port = _free_port()
        self.server = subprocess.Popen([sys.executable, "serve.py", str(self.port)], cwd=ROOT,
                                       stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
        for _ in range(100):
            try:
                socket.create_connection(("127.0.0.1", self.port), 0.2).close()
                break
            except OSError:
                time.sleep(0.1)
        else:
            self._stop_server()
            raise RuntimeError("serve.py didn't start")
        try:
            return self._start_browser()
        except BaseException:
            self.__exit__()
            raise

    def _start_browser(self):
        if self.want_relay:
            self.relay = LocalRelay(f"http://localhost:{self.port}").__enter__()
        self.pw = sync_playwright().start()
        self.browser = self.pw.chromium.launch(channel="msedge", headless=not self.headed,
                                               slow_mo=250 if self.headed else 0)
        self.ctx = self.browser.new_context(viewport={"width": 1400, "height": 900})
        self.ctx.route(lambda u: "goatcounter" in u or "gc.zgo.at" in u,
                       lambda r: r.fulfill(status=204, body=""))
        if self.relay:
            # Before the app's own scripts on every load: point it at the local relay, and give a fresh profile the test
            # channel (only when none is set, so a reload keeps whatever the app has done since).
            creds = json.dumps({"channelId": TEST_CHANNEL, "passphrase": TEST_PASSPHRASE})
            self.ctx.add_init_script(f"""window._RW_RELAY_WORKER_URL = {json.dumps(self.relay.url)};
                try {{ if (!localStorage.getItem('readerwrangler-relay'))
                           localStorage.setItem('readerwrangler-relay', {json.dumps(creds)}); }} catch (e) {{}}""")
        self.page = self.ctx.new_page()
        self.page.on("console", self._record_console)
        self.page.on("pageerror", lambda e: self.crashes.append(str(e)))
        self.page.on("request", self._watch_request)
        self.page.goto(f"http://localhost:{self.port}/readerwrangler.html")
        self.page.wait_for_selector("#splash", state="detached", timeout=APP_TIMEOUT_MS)
        return self

    def __exit__(self, *exc):
        try:
            if getattr(self, "browser", None):
                self.browser.close()
            if getattr(self, "pw", None):
                self.pw.stop()
        finally:
            try:
                if self.relay:
                    self.relay.__exit__()
            finally:
                self._stop_server()

    def _stop_server(self):
        self.server.terminate()          # the exact process we started (Law 5) — never a pattern
        try:
            self.server.wait(10)
        except subprocess.TimeoutExpired:
            self.server.kill()

    def _record_console(self, m):
        # A "Failed to load resource" line names no address in its text — add the one the browser reports, so a
        # failure says which request it was.
        url = (m.location or {}).get("url", "") if m.text.startswith("Failed to load resource") else ""
        self.console.append((m.type, m.text + (f" [{url.split('?')[0]}]" if url else "")))

    def _watch_request(self, req):
        host = req.url.split("/")[2] if "://" in req.url else ""
        if FORBIDDEN_HOSTS.search(host):
            self.violations.append(req.url.split("?")[0])

    # --- actions ------------------------------------------------------------------------------------------------
    def menu(self, top, item):
        """Click a menu-bar menu, then one of its items (by the start of its words)."""
        self.page.get_by_role("button", name=re.compile(r"^\s*" + re.escape(top))).first.click()
        return self.page.get_by_role("button", name=re.compile(re.escape(item))).first

    def restore(self, path):
        """File → Restore Backup… with this file, through the real menu and file box. Refuses a file carrying a key.
        Returns the confirmation's text and closes it."""
        raw = gzip.open(path).read() if path.endswith(".gz") else open(path, "rb").read()
        relay = json.loads(raw).get("relay") or {}
        if relay.get("channelId") or relay.get("passphrase"):
            raise RuntimeError(f"{os.path.basename(path)} carries a Cloud Sync Key — test data never may")
        item = self.menu("File", "Restore Backup")
        with self.page.expect_file_chooser() as fc:
            item.click()
        name = os.path.basename(path)[:-3] if path.endswith(".gz") else os.path.basename(path)
        fc.value.set_files(files=[{"name": name, "mimeType": "application/json", "buffer": raw}])
        dialog = self.page.get_by_text("Backup Restored", exact=True)
        dialog.wait_for(timeout=120_000)
        box = dialog.locator("xpath=ancestor::*[.//button][1]")
        text = box.inner_text()
        box.get_by_role("button", name="OK").click()
        return text

    def wait_console(self, pattern, timeout_s=60):
        """Wait until a console line matching `pattern` has appeared (a condition, never a fixed sleep — §7)."""
        deadline = time.time() + timeout_s
        while time.time() < deadline:
            hit = next((x for _, x in self.console if re.search(pattern, x)), None)
            if hit:
                return hit
            self.page.wait_for_timeout(100)
        raise AssertionError(f"no console line matching {pattern!r} within {timeout_s} s")

    def console_matching(self, pattern):
        return [x for _, x in self.console if re.search(pattern, x)]

    # --- Cloud Sync, against the local relay (App(relay=True)) --------------------------------------------------------
    def upload_fetch(self, items):
        """Send books to the cloud copy exactly as the library fetcher does: one "books" run through the page's own
        relay-client (amazon-library-fetcher.js's writeRun call), with the fetcher's payload shape."""
        if not self.relay:
            raise RuntimeError("upload_fetch needs App(relay=True)")
        return self.page.evaluate("""async (items) => {
            const payload = { schemaVersion: '2.3', books: { fetchDate: new Date().toISOString(),
                              fetcherVersion: 'screen-test', totalBooks: items.length, items } };
            const res = await window.RWRelay.writeRun(JSON.stringify(payload), 'books', () => {});
            return { runId: res.runId, parts: res.seqCount };
        }""", items)

    def import_from_relay(self):
        """File → Import from Relay through the real menu; returns the finished dialog's text and closes it."""
        self.menu("File", "Import from Relay").click()
        # The progress box (readerwrangler.js showProgressDialog) gains its OK button only when the import has finished.
        ok = self.page.locator(".rw-imperative-overlay").get_by_role("button", name="OK", exact=True)
        ok.wait_for(timeout=120_000)
        text = ok.locator("xpath=ancestor::div[contains(@class, 'rw-imperative-overlay')]").inner_text()
        ok.click()
        return text

    # --- reaching things the way a person would (PRINCIPLES Law 8, from the utilities project's Law 21) -------------
    class Unreachable(Exception):
        """A target a person couldn't reach: covered by something else, or with no size."""

    def hover(self, target):
        """Move the REAL pointer to the middle of `target` (a locator) and report what is actually under it:
        {'under': description, 'title': its tooltip, 'width', 'height'}. Refuses (App.Unreachable) a target with no
        size, or one covered by something else — naming what covers it. Reading an attribute proves a thing exists,
        not that anyone can get to it."""
        target.scroll_into_view_if_needed(timeout=10_000)
        box = target.bounding_box()
        if not box or box["width"] < 1 or box["height"] < 1:
            raise App.Unreachable(f"the target has no size ({box}) — nobody can point at it")
        x, y = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
        self.page.mouse.move(x, y)
        info = target.evaluate("""(el, pt) => {
            const top = document.elementFromPoint(pt.x, pt.y);
            const say = (e) => !e ? 'nothing' : e.tagName.toLowerCase() + (e.id ? '#' + e.id : '') +
                (e.className && typeof e.className === 'string' ? '.' + e.className.trim().split(/\\s+/).slice(0, 2).join('.') : '') +
                (e.textContent ? ' "' + e.textContent.trim().slice(0, 40) + '"' : '');
            // Reached: the pointer lands on the target, inside it, or on the element that CONTAINS it — a click-through
            // label (pointer-events:none) passes the click to its row, which is the real target. A cover laid over
            // the page never contains the target, so it's still caught (DRV-002).
            return { reached: !!top && (top === el || el.contains(top) || top.contains(el)), under: say(top), self: say(el),
                     title: el.getAttribute('title') || '' };
        }""", {"x": x, "y": y})
        if not info["reached"]:
            raise App.Unreachable(f"{info['self']} is covered — the pointer lands on {info['under']}")
        return {"under": info["under"], "title": info["title"], "width": box["width"], "height": box["height"]}

    def click_reachable(self, target):
        """hover() first (refusing a covered or zero-size target), then a real click where the pointer is."""
        info = self.hover(target)
        self.page.mouse.down()
        self.page.mouse.up()
        return info

    # --- reading the screen -------------------------------------------------------------------------------------
    def left_count(self, label):
        """The (N) the left pane shows beside an entry, e.g. left_count("Inbox") → 2."""
        row = self.page.get_by_text(label, exact=True).first.locator("xpath=ancestor::*[contains(., '(')][1]")
        m = re.search(r"\((\d+)\)", row.inner_text())
        return int(m.group(1)) if m else None

    def unexpected_console(self):
        """Console errors and warnings not on KNOWN_NOISE, plus page crashes."""
        out = [f"{t}: {x[:200]}" for t, x in self.console
               if t in ("error", "warning") and not any(re.search(p, x) for p, _ in KNOWN_NOISE)]
        return out + [f"crash: {c[:200]}" for c in self.crashes]

    def shot(self, name):
        os.makedirs(ARTIFACTS, exist_ok=True)
        p = os.path.join(ARTIFACTS, name + ".png")
        self.page.screenshot(path=p)
        return p
