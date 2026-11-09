#!/usr/bin/env python3
"""
message_codes.py — the logging rules, checked from the code itself, and the support table generated from it
(docs/design/LOGGING.md §6; Ron + Claude, 2026-11-07).

    py tools/message_codes.py           check the rules and write docs/design/MESSAGE-CODES.md
    py tools/message_codes.py --check   check the rules and that the saved table is current (the commit hook) — exit 1
                                        with the reasons if not

It finds every rwLog.log(level, code, text…) call in the app's scripts (and the logging module's own calls) and checks:
  - the level and the code are written as plain quoted words (so they can be checked at all);
  - the level is one of the five; the code is AREA or AREA-NN, with AREA one of the areas logger.js lists;
  - warning and above use a numbered code (AREA-NN) — those are what support asks about;
  - each numbered code is used at exactly ONE call (so its level has one home, and a code always means one message).
The table lists every numbered code — code, level, message, file — sorted by area. Nobody edits it; nothing to keep in
sync. (No line numbers: they shift with every unrelated edit and would make the table stale on almost every commit.)
"""
import argparse
import os
import re
import subprocess
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
TABLE = "docs/design/MESSAGE-CODES.md"
LOGGER = "logger.js"
LEVELS = ["debug", "info", "warning", "error", "critical"]
CODE_RE = re.compile(r"^([A-Z]+)(?:-(\d{2}))?$")
CALL_ANYWHERE = re.compile(r"rwLog\.log\(")
CALL_IN_LOGGER = re.compile(r"(?<![\w.])log\(\s*(?=['\"`])")   # the module's own log('error', 'UI-02', …) calls


def areas_from_logger(text):
    """The areas, read from logger.js's LOG_AREAS — the one list (never a copy here)."""
    m = re.search(r"LOG_AREAS\s*=\s*Object\.freeze\(\{(.*?)\}\)", text, re.S)
    return set(re.findall(r"\b([A-Z]+)\s*:", m.group(1))) if m else set()


def _read_literal(src, i):
    """A quoted literal starting at src[i] ('…', "…" or `…`) → (its text, index after it), or (None, i)."""
    if i >= len(src) or src[i] not in "'\"`":
        return None, i
    q, j, out = src[i], i + 1, []
    while j < len(src) and src[j] != q:
        if src[j] == "\\" and j + 1 < len(src):
            out.append(src[j + 1])
            j += 2
            continue
        if q == "`" and src.startswith("${", j):          # a template's ${ … } may hold quotes, even another template
            depth, k = 1, j + 2
            while k < len(src) and depth:
                if src[k] in "'\"`":
                    _, k = _read_literal(src, k)
                    continue
                depth += {"{": 1, "}": -1}.get(src[k], 0)
                k += 1
            out.append(src[j:k])
            j = k
            continue
        out.append(src[j])
        j += 1
    return "".join(out), j + 1


def _read_expression(src, i):
    """An argument that isn't a literal: up to the comma or closing parenthesis at its own depth."""
    depth, j = 0, i
    while j < len(src):
        c = src[j]
        if c in "([{":
            depth += 1
        elif c in ")]}":
            if depth == 0:
                break
            depth -= 1
        elif c == "," and depth == 0:
            break
        elif c in "'\"`":
            _, j = _read_literal(src, j)
            continue
        j += 1
    return src[i:j].strip(), j


def _skip(src, i):
    while i < len(src) and src[i] in " \t\r\n":
        i += 1
    return i


def _in_comment(src, pos):
    """Is src[pos] inside a // line comment or a /* … */ block? (Good enough for our code: a '//' inside a string on the
    same line before the call would hide it — the commit check would then miss a call, never invent one.)"""
    line_start = src.rfind("\n", 0, pos) + 1
    if "//" in src[line_start:pos]:
        return True
    return src.rfind("/*", 0, pos) > src.rfind("*/", 0, pos)


def find_calls(path, src):
    """[(path, line, level or None, code or None, text)] for every logging call in one file."""
    pattern = CALL_IN_LOGGER if os.path.basename(path) == LOGGER else CALL_ANYWHERE
    calls = []
    for m in pattern.finditer(src):
        if _in_comment(src, m.start()):      # a comment that mentions rwLog.log(…) isn't a call
            continue
        i = _skip(src, m.end())
        level, i = _read_literal(src, i)
        i = _skip(src, i)
        if i < len(src) and src[i] == ",":
            i = _skip(src, i + 1)
        code, i = _read_literal(src, i)
        i = _skip(src, i)
        if i < len(src) and src[i] == ",":
            i = _skip(src, i + 1)
        text, _ = _read_literal(src, i)
        if text is None:
            text, _ = _read_expression(src, i)
        calls.append((path, src.count("\n", 0, m.start()) + 1, level, code, text))
    return calls


def check(files, areas):
    """files = [(path, source)] → (calls, problems)."""
    calls, problems, seen = [], [], {}
    for path, src in files:
        calls.extend(find_calls(path, src))
    for path, line, level, code, text in calls:
        where = f"{path}:{line}"
        if level is None or code is None:
            problems.append(f"{where}: write the level and the code as plain quoted words, so they can be checked")
            continue
        if level not in LEVELS:
            problems.append(f"{where}: unknown level \"{level}\" (one of {', '.join(LEVELS)})")
        m = CODE_RE.match(code)
        if not m:
            problems.append(f"{where}: badly shaped code \"{code}\" — use AREA or AREA-NN")
            continue
        if m.group(1) not in areas:
            problems.append(f"{where}: unknown area \"{m.group(1)}\" — the areas are logger.js's LOG_AREAS")
        if level in LEVELS and LEVELS.index(level) >= LEVELS.index("warning") and not m.group(2):
            problems.append(f"{where}: a {level} needs a numbered code ({m.group(1)}-NN)")
        if m.group(2):
            if code in seen:
                problems.append(f"{where}: {code} is already used at {seen[code]} — each numbered code at ONE call")
            else:
                seen[code] = where
    # 2026-11-09 (the toast pass): every toast goes through rwLog.log(…, { toast }) so it reaches the log with its area.
    # Allowed: the one line that hands showToast to the logger (rwLog.setToaster), and comments.
    for path, src in files:
        for m in re.finditer(r"\bshowToast\(", src):
            if _in_comment(src, m.start()):
                continue
            ls = src.rfind("\n", 0, m.start()) + 1
            le = src.find("\n", m.start())
            if "setToaster" in src[ls:le if le >= 0 else len(src)]:
                continue
            problems.append(f"{path}:{src.count(chr(10), 0, m.start()) + 1}: a direct showToast( call — use "
                            "rwLog.log(level, code, text, null, { toast: true }) so the toast reaches the log with its area")
    return calls, problems


def _placeholders(text):
    """A template's ${ … } parts are one occurrence's details (counts, names) — shown as "…": support needs the
    message's meaning. Nested braces and quotes inside a ${ … } are skipped as a whole."""
    out, i = [], 0
    while i < len(text):
        if text.startswith("${", i):
            depth, k = 1, i + 2
            while k < len(text) and depth:
                if text[k] in "'\"`":
                    _, k = _read_literal(text, k)
                    continue
                depth += {"{": 1, "}": -1}.get(text[k], 0)
                k += 1
            if not out or out[-1] != "…":           # details side by side read as one "…"
                out.append("…")
            i = k
            continue
        out.append(text[i])
        i += 1
    return "".join(out)


def table(calls):
    numbered = sorted({(c[3], c[2], c[4], c[0]) for c in calls if c[3] and CODE_RE.match(c[3]) and CODE_RE.match(c[3]).group(2)},
                      key=lambda r: (r[0].split("-")[0], r[0]))
    general = sum(1 for c in calls if c[3] and CODE_RE.match(c[3]) and not CODE_RE.match(c[3]).group(2))

    def cell(s):
        return _placeholders(str(s)).replace("|", "\\|").replace("\n", " ")
    lines = [
        "# Message codes — generated, do not edit",
        "",
        "_Written by `py tools/message_codes.py` from every `rwLog.log(…)` call in the code (docs/design/LOGGING.md §6). "
        "The commit check refuses a commit whose copy is out of date. Support: find the code a user reports; the level "
        "says how serious it is._",
        "",
        f"{len(numbered)} numbered code{'s' if len(numbered) != 1 else ''}. ({general} general line{'s' if general != 1 else ''}"
        " — info and debug, coded by their area alone — not listed.)",
        "",
        "| Code | Level | Message | File |",
        "|---|---|---|---|",
    ]
    lines += [f"| {cell(code)} | {cell(level)} | {cell(text)} | {cell(path)} |" for code, level, text, path in numbered]
    return "\n".join(lines) + "\n"


def _git(*args):
    r = subprocess.run(["git", *args], cwd=ROOT, capture_output=True)
    return r.stdout.decode("utf-8", "replace") if r.returncode == 0 else None


def app_scripts(staged):
    """The app's scripts at the repo root — as staged (the commit hook) or on disk."""
    names = sorted(n for n in os.listdir(ROOT) if n.endswith(".js"))
    out = []
    for n in names:
        src = _git("show", ":" + n) if staged else None
        if src is None:
            with open(os.path.join(ROOT, n), encoding="utf-8", errors="replace") as f:
                src = f.read()
        out.append((n, src))
    return out


def main(argv=None):
    try:
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    except Exception:
        pass
    a = argparse.ArgumentParser(description="Check the logging rules and write the message-code table.")
    a.add_argument("--check", action="store_true", help="check only; fail if the saved table is out of date (commit hook)")
    args = a.parse_args(argv)
    files = app_scripts(staged=args.check)
    logger_src = dict(files).get(LOGGER, "")
    calls, problems = check(files, areas_from_logger(logger_src))
    wanted = table(calls)
    if problems:
        print("message codes: the logging rules are broken —")
        for p in problems:
            print("  " + p)
        return 1
    if args.check:
        saved = _git("show", ":" + TABLE)
        if saved is None and os.path.exists(os.path.join(ROOT, TABLE)):
            saved = open(os.path.join(ROOT, TABLE), encoding="utf-8").read()
        if (saved or "").replace("\r\n", "\n") != wanted:
            print(f"message codes: {TABLE} is out of date — run  py tools/message_codes.py  and stage it")
            return 1
        return 0
    with open(os.path.join(ROOT, TABLE), "w", encoding="utf-8", newline="\n") as f:
        f.write(wanted)
    rows = [ln for ln in wanted.splitlines() if ln.startswith("| ") and not ln.startswith("| Code")]
    print(f"wrote {TABLE}: {len(rows)} numbered codes")
    return 0


if __name__ == "__main__":
    if ROOT not in sys.path:
        sys.path.insert(0, ROOT)
    try:
        from pytools.keepopen import run
    except ImportError:
        sys.exit(main())
    run(main)
