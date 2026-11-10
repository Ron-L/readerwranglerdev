#!/usr/bin/env python3
"""
serve.py — ReaderWrangler's local development server (2026-10-15).

Python's standard web server, with the one difference that matters: it serves only what the real site serves.
Production (GitHub Pages) publishes exactly the files in git and never lists folders, so this server refuses:

  1. any path with a part starting with a dot   (.private/ — secrets; .git/; .claude/; .vscode/ …)
  2. anything git ignores                       (readerwrangler-backup-*.json — they hold relay credentials; scratch files)
  3. folder listings                            (a folder with an index.html still shows that page)

Refused paths get a plain 404, as if they didn't exist.

It also BUILDS on demand (2026-11-10, TODO "Faster loading"): the page loads the app compiled ahead of time from
dist/; a request for a compiled copy whose source changed rebuilds it first (tools/build.py). A source that doesn't
compile is served as a script that throws the compiler's message, so the page's error screen shows it.

It listens on the whole home network ON PURPOSE (a phone tests your local copy over Wi-Fi) — which is exactly why it
must not hand out private files to every device on that network. Same address and port as before
(http://localhost:8000), so everything the browser stores for ReaderWrangler stays put.

Usage:  py serve.py [port]        (default 8000; Windows: double-click it if .py files open with Python, and a
                                   shortcut to it in the Startup folder — Win+R -> shell:startup — starts it at logon)
        python serve.py [port]    (elsewhere)
Needs git on the PATH (it asks git what's ignored); exits with a clear message if git isn't there.
"""
import functools
import http.server
import importlib.util
import io
import json
import os
import posixpath
import subprocess
import sys
import urllib.parse

ROOT = os.path.dirname(os.path.abspath(__file__))
PORT = int(sys.argv[1]) if len(sys.argv) > 1 else 8000

# 2026-11-10 (TODO "Faster loading"): the page loads the app BUILT ahead of time (dist/). A request for a built copy
# whose source is newer gets a fresh build first (~2 s), so the loop stays edit → refresh. tools/build.py is the one
# place that knows how to build.
_spec = importlib.util.spec_from_file_location("rw_build", os.path.join(ROOT, "tools", "build.py"))
build = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(build)
BUILT = {f"{build.OUT_DIR}/{name}": name for name in build.SOURCES}


def git_available():
    try:
        r = subprocess.run(["git", "rev-parse", "--is-inside-work-tree"], cwd=ROOT,
                           capture_output=True, text=True, timeout=10)
        return r.returncode == 0 and r.stdout.strip() == "true"
    except (OSError, subprocess.TimeoutExpired):
        return False


@functools.lru_cache(maxsize=4096)
def git_ignores(rel_path):
    """True if git ignores this repo-relative path. Cached: a page load asks about the same ~30 files repeatedly."""
    r = subprocess.run(["git", "check-ignore", "-q", "--", rel_path], cwd=ROOT,
                       capture_output=True, timeout=10)
    return r.returncode == 0  # 0 = ignored, 1 = not ignored


def refusal_reason(url_path):
    """Why this request must be refused, or None if it may be served."""
    path = urllib.parse.unquote(urllib.parse.urlsplit(url_path).path)
    norm = posixpath.normpath("/" + path.lstrip("/"))       # collapses ./ and ../ before we judge it
    parts = [p for p in norm.split("/") if p]
    if any(p.startswith(".") for p in parts):
        return "private (dot) folder or file"
    rel = "/".join(parts)
    if rel and git_ignores(rel):
        return "kept out of git (not part of the site)"
    return None


class Server(http.server.ThreadingHTTPServer):
    # Python's server turns on "reuse address" — on Windows that lets a SECOND server open the same port silently
    # (found 2026-10-15: a double-click while one was running would split requests between two servers). Elsewhere
    # it only allows a quick restart, so keep it there.
    allow_reuse_address = os.name != "nt"


class Handler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def send_head(self):
        reason = refusal_reason(self.path)
        if reason:
            self.log_message("REFUSED %s - %s", self.path, reason)  # plain hyphen: a Windows console garbles "—"
            self.send_error(404, "File not found")
            return None
        rel = urllib.parse.unquote(urllib.parse.urlsplit(self.path).path).lstrip("/")
        if rel in BUILT:
            try:
                if build.build_if_stale(BUILT[rel]):
                    self.log_message("built %s (its source changed)", rel)
            except build.BuildError as e:
                return self.send_script_error(f"ReaderWrangler build failed - {e}")
        return super().send_head()

    def send_script_error(self, message):
        """A source that doesn't compile: serve a one-line script that throws the compiler's message, so the page's
        load-error screen shows it (never a stale copy that hides the mistake)."""
        self.log_message("BUILD FAILED %s", message.replace("\n", " | ")[:300])
        body = f"throw new Error({json.dumps(message)});\n".encode("utf-8")
        self.send_response(200)
        self.send_header("Content-Type", "text/javascript; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        return io.BytesIO(body)

    def list_directory(self, path):
        # Production never lists folders; a folder with an index.html never gets here (send_head serves the page).
        self.send_error(404, "File not found")
        return None


def main():
    if not git_available():
        sys.exit("serve.py: git isn't available here, so it can't tell which files are private.\n"
                 "Install git (or run this from inside the cloned repo) and start it again.")
    try:
        server = Server(("", PORT), Handler)
    except OSError as e:
        sys.exit(f"serve.py: can't start on port {PORT} - {e}\n"
                 f"Usually another server (an older one?) is already using port {PORT}: close it, then start this again.")
    print(f"ReaderWrangler local server: http://localhost:{PORT}/readerwrangler.html")
    print("Serving only what the real site serves (no dot-folders, nothing git ignores, no folder listings).")
    print("Close this window (or press Ctrl+C) to stop.")
    server.serve_forever()


if __name__ == "__main__":
    # keepopen (the pytools submodule, 2026-10-16) keeps a double-clicked window open when startup fails, so the
    # message can be read — never inside a terminal or under another program; Ctrl+C stops quietly.
    try:
        from pytools.keepopen import run
    except ImportError:
        print("serve.py needs the pytools submodule. In the project folder run:\n"
              "    git submodule update --init\n"
              "then start it again.", file=sys.stderr)
        try:
            input("\nPress Enter to close this window.")
        except (EOFError, KeyboardInterrupt):   # no keyboard (run by another tool) — just exit
            pass
        sys.exit(1)
    run(main)
