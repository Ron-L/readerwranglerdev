# Tests for the reset messages' shared words — five places, the same sentences.
# tags: reset, words, tier 1
# covers: readerwrangler.js, readerwrangler.html, reset.html, reset.js
# Run: python test/test_reset_words.py
#
# 2026-11-11 (Ron): the reset messages live in five places, and 7.26.0 fixed one of them while the others kept "Import
# amazon-library.json", "files on disk" and an Export button that doesn't exist. The places keep their own framing and
# their own "what's cleared" line (the resets don't clear the same things yet — TODO "What a reset clears"), but the
# sentences they share are written word for word the same, so one search finds every copy.
#
# TO CHANGE THESE WORDS: change them HERE first, then run this test — it names every place still saying the old ones.
import html
import os
import re
import sys

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.insert(0, os.path.join(ROOT, "test", "ui"))
from harness import check, done, test   # noqa: E402

# (Ron, 2026-11-11: "and your copy in the cloud" was dropped — true at the moment of the reset, but once books are back
# any change sends a full copy that replaces it, and it isn't a way back until "Restore from Cloud Sync…" exists)
KEPT = "Your saved backup files are not touched."
BACK = "To get everything back afterwards: File → Restore Backup… with your backup file."
TIP = "Before you reset, save a backup: File → Save Backup."

# file → how many times each sentence must appear there (the places: Tools → Reset App in readerwrangler.js; the
# emergency screen and its "Erase and Reset" confirmation in readerwrangler.html; the reset page's own text in
# reset.html and its confirmation box in reset.js). No tip where the app didn't load: a backup can't be saved then.
EXPECTED = {
    "readerwrangler.js": {KEPT: 1, BACK: 1, TIP: 1},
    "readerwrangler.html": {KEPT: 2, BACK: 2, TIP: 0},   # the emergency screen (with its hint under the button) + its confirm
    "reset.html": {KEPT: 1, BACK: 1, TIP: 1},
    "reset.js": {KEPT: 1, BACK: 1, TIP: 0},
}
# Words from before Cloud Sync that must not come back in these files.
OLD = ["files on disk", "amazon-library.json", "Export button", "Export Backup", "Unload library and collections",
       "import your backup file", "reload them anytime", "copy in the cloud are not touched"]


def text_of(name):
    with open(os.path.join(ROOT, name), encoding="utf-8") as f:
        raw = f.read()
    # as a person reads it: HTML entities decoded, JSX/HTML tags and "\n" line breaks in strings ignored
    return html.unescape(re.sub(r"\\n", " ", raw))


def shared_sentences_everywhere():
    wrong = []                                   # every place at once — the list of what's left to change
    for name, want in EXPECTED.items():
        text = text_of(name)
        for sentence, n in want.items():
            got = text.count(sentence)
            if got != n:
                wrong.append(f"{name}: {sentence!r} appears {got} time(s), should be {n}")
    for w in wrong:
        print("      - " + w)              # all of them (the harness shows only a failure's first lines)
    check(not wrong, f"{len(wrong)} place(s) still to change — listed above")
test("RWORDS-001", "the shared reset sentences appear word for word in every place that says them", shared_sentences_everywhere)


def old_words_gone():
    left = [f"{name} still says: {[w for w in OLD if w.lower() in text_of(name).lower()]}" for name in EXPECTED
            if any(w.lower() in text_of(name).lower() for w in OLD)]
    for w in left:
        print("      - " + w)
    check(not left, f"{len(left)} file(s) still say old words — listed above")
test("RWORDS-002", "no reset message still says the words from before Cloud Sync", old_words_gone)

done()
