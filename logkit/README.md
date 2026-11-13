# logkit — logging for a web page

A small logging kit for a browser app: one call for every message, a log kept on the device, a window to read it, and a
commit check that keeps the messages well-formed and writes a support table of their codes. Written for ReaderWrangler
(7.26.0) and made a kit of its own in 7.28.0; it knows nothing of the app that uses it. Everything app-specific comes
from the host's **settings**.

## The pieces

| File | What it is | Needs |
|---|---|---|
| `logger.js` | The logger: keeps the log, cleans each message, writes to the console, logs uncaught errors, draws the error banner and the critical box, copies text to the clipboard (and says whether it did) | Nothing (plain script; also runs under Node for tests) |
| `diagnostics-window.js` | The Diagnostics window: the kept log, filtered, with the two switches, Send a test message, Clear and Copy diagnostics | React 18, a JSX build, the host's dialog component, Tailwind classes |
| `check_messages.py` | The commit check's general half: the rules every logging call must follow, and the table of numbered codes | Python 3, standard library only |

## Putting it in a page

Load order matters: the settings, then the logger (first of your scripts, so it catches errors in everything after it),
then the window (before the app that shows it), then the app.

```html
<script src="my-logkit-settings.js"></script>            <!-- sets window.LOGKIT_SETTINGS -->
<script src="logkit/logger.js"></script>                  <!-- publishes window[settings.globalName] -->
<script src="dist/logkit/diagnostics-window.js"></script> <!-- the BUILT window: window.LogkitDiagnosticsWindow -->
<script src="my-app.js"></script>
```

Without settings the logger still runs (it says so in the console) under default names: `window.logkit`, the log kept as
`logkit-log`, the two switches as `logkit-banner` / `logkit-detail`, one area (`UI`).

### The settings (`window.LOGKIT_SETTINGS`)

| Setting | What it decides | Default |
|---|---|---|
| `product` | The app's name — first line of a copied report, the critical box's fallback title | `This app` |
| `globalName` | The logger's global (`window.<name>`) | `logkit` |
| `elementIdPrefix` | The alerts' element ids: `<prefix>-banner`, `<prefix>-critical` | `logkit` |
| `areas` | The areas a code may start with, as `{ NAME: 'NAME' }`. **Must include `UI`** (the kit's own codes) | `{ UI: 'UI' }` |
| `pageLoadArea` | The area of the "Page loaded — build …" line | `UI` |
| `storageKey` | Where the log is kept (local storage) | `logkit-log` |
| `switchKeys` | Where the two switches are remembered: `{ errorBanner, logDetail }` | `logkit-banner`, `logkit-detail` |
| `oldLevelKey` | An older single "log level" setting to move to the switches once, then remove | none |
| `idPattern`, `shortId` | IDs to shorten in every message: a global regular expression, and the function that shortens one | none |
| `secrets` | A function returning strings never to show, asked at every message; each is found by its exact value (4 characters or more) | none |
| `secretLabel` | What a hidden secret shows as | `[hidden]` |
| `build` | A function returning the app's build, for the page-load line and reports | none |
| `critical` | The critical box's words: `{ title, advice }` | a plain "hit a problem" |
| `extraApi` | The host's own helpers, added to the logger object | none |

A global the logger publishes under a computed name can be declared for a name check with a comment where the name is
chosen: `/* page-global: myLog */`.

## Logging a message

```js
myLog.log(level, code, text, data, { test, toast, hint, advice })
```

- **level** — `debug`, `info`, `warning`, `error` or `critical`, written at the call.
- **code** — `AREA` for a general line (`IMPORT`), or `AREA-NN` for one specific message (`IMPORT-12`). Warning and above
  must be numbered, and each numbered code is used at **one** call — that's what support asks about.
- **data** — optional details, shown under "details ▸" and in a copied report.
- **options** — `test: true` marks a message a test planted (shown as `IMPORT-12-!TEST!`); `toast` shows the text to the
  person through the host's toast routine (`setToaster`); `hint` keeps such a toast out of the host's history; `advice`
  replaces the critical box's usual advice for this message.

What happens to a message: it is cleaned (IDs shortened, secrets removed); written to the console method of its level;
kept on the device (info and up — debug too while "extra detail" is on — the last 500, repeats counted, saved in batches);
an **error** raises the red banner when that switch is on; a **critical** message shows the critical box to everyone. The
logger never throws.

### The logger's other calls

| Call | Use |
|---|---|
| `entries()` | A copy of the kept log, oldest first |
| `subscribe(fn)` | Be told of every kept entry; returns the unsubscribe |
| `clear()` | Empty the kept log (saved at once) |
| `diagnosticsText(headerLines)` | The full report: the app's name and the time, the host's lines (e.g. the build), the browser, the switches, then every kept entry |
| `switches()`, `setSwitch(name, on)` | The two switches: `errorBanner` (an error raises the banner) and `logDetail` (debug lines are kept too); remembered in this browser |
| `applyAddress(search)` | `?errorBanner=on` / `?logDetail=on` on the page's address (the page does this itself) |
| `dialog(area, text)` | A dialog logs what it showed, in the area its caller named (an unknown area is UI-05) |
| `copyText(text, { what, where, toast, next })` | **The** copy: resolves `true` only when the clipboard took the text, `false` when it refused — a page with no clipboard (an insecure address) counts as refused. Never rejects. Logs either way: "<what> copied (<where>)" at info, or UI-06 with the browser's reason; `toast` shows that line to the person too, `next` follows a copy's line. Call it from the click itself. The banner, the critical box and the Diagnostics window copy through it — and so should the host |
| `setToaster(fn)` | The host hands over its toast routine: `fn(text, { level, x, y, hint })` |
| `format(entry)`, `levels`, `TEST_MARK`, `flush()` | One line as text; the five levels in order; the test mark; save now |

### The kit's own codes

The host's areas must include `UI` for these:

| Code | Level | Message |
|---|---|---|
| UI-02 | error | A logging call was malformed (the message is still kept) |
| UI-03 | error | An uncaught error (a browser extension's are ignored) |
| UI-04 | error | A failed promise nobody handled |
| UI-05 | error | A dialog named an unknown area |
| UI-06 | warning | A copy the clipboard refused (`copyText` — any copy, the host's included) |
| UI-07 | error | Send a test message (always marked TEST) |

## The Diagnostics window

```jsx
<LogkitDiagnosticsWindow log={myLog} Dialog={MyDialog} onClose={close} copyHeader={[`My app ${VERSION}`]} />
```

- **log** — the logger.
- **Dialog** — the host's modal window component, called as `<Dialog onClose title maxWidthClassName>…</Dialog>`, so the
  window closes, stacks and blocks keys like every other window of the host.
- **copyHeader** — lines Copy diagnostics puts under its first line.

It is JSX, so it is built ahead of time (the source here; the page loads the built copy). Its look is Tailwind classes, so
the host's stylesheet must be built from this file too. The `data-select-text` / `data-dialog-body` marks tell a host's
Ctrl+A what to select; elsewhere they do nothing.

**Send a test message** records one error marked TEST (UI-07): the banner shows it when its switch is on; when the switch
is off, a note says so. Support can ask a person to press it, then Copy diagnostics — the log, the banner and the copy
are shown to work without a real failure. It never shows the critical box.

## The commit check

`check_messages.py` holds the general rules and the table; the host's own checker sits on top. The host decides which
files to scan, what its code calls the logger, where its areas are listed and where the table lives, adds any rules of
its own, and calls:

```python
calls, problems = check_messages.check(files, areas, logger="myLog", areas_from="my-logkit-settings.js")
#   files: [(path, source text)]   areas: the host's areas   problems: [] when every call follows the rules
text = check_messages.table(calls, intro="_Written by … — find the code a user reports._")
```

The rules, for every `myLog.log(…)` call (and the kit's own calls in its folder): the level and the code are plain quoted
words; the level is one of the five; the code is `AREA` or `AREA-NN` with a known area; warning and above are numbered;
each numbered code is used at one call. The table lists every numbered code — code, level, message, file — sorted by
area; a template's `${…}` parts show as "…". The readers a host's own rules may need are public: `read_literal`,
`read_expression`, `skip`, `in_comment`, `line_of`.

## ReaderWrangler: the worked example

| Piece | In ReaderWrangler |
|---|---|
| Settings | `logkit-settings.js` (beside the pages): 17 areas, the logger as `rwLog`, the Channel ID's short form, the Cloud Sync passphrase as the secret, the critical box's words |
| Pages | `readerwrangler.html` loads the settings, the logger and the built window; `reset.html` the settings and the logger |
| Window | `tools/build.py` builds it into `dist/logkit/`; the app shows it with its own `<Dialog>` and its build line |
| Commit check | `tools/message_codes.py` — every shipped script as staged, `rwLog`, two rules of its own (a toast goes through the logger; a dialog call names its area first) — writes `docs/design/MESSAGE-CODES.md` |
| Tests | `test/logger.test.js` (LOG-), `test/test_message_codes.py` (MSG-), `test/ui/test_logging.py` (LOGUI-), `test/ui/test_diagnostics.py` (DIAG-) |
| Design | `docs/design/LOGGING.md` |
