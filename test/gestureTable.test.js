// Function tests for gestureTable.js — "the one table" (docs/design/ONE-TABLE.md). Run: node test/gestureTable.test.js
// tags: delete, gestures, folders, tier 1
// covers: gestureTable.js
// 7.28.1: the Delete rows (TODO id 20261014-1030ay). Like bookFields.js's table: every combination must have a row, so a
// new kind of place can't be added without saying what Delete does there. The screen side: test/ui/test_delete_key.py.
// 7.28.1-alpha.2: books AND folders selected → Delete takes both (Ron, 2026-11-12, review queue Q-013) — TABLE-003, 009, 010.
// 7.30.0 (sprint 4, TODO id 20261106-1237): the move / copy / paste rows and their words — TABLE-011–020 (ONE-TABLE.md
// §4–§6; the screen side: test/ui/test_cells.py, CELL-001–058).
const assert = require('assert');
const t = require('../gestureTable.js');
const { test, done } = require('./harness');

console.log('gestureTable tests:');

const PLACE_IDS = {          // one real id per kind — the ids the app uses
    'folder': 'f-scifi', 'inbox': '__inbox__', 'all-books': '__all__', 'folders-view': '__library__',
    'searches-view': '__views__', 'book-lists-view': '__booklists__', 'book-list': '__booklist_bl-1__',
    'search': '__view_ss-1__', 'trash': '__trash__',
};
const ACTS = ['remove-from-folder', 'trash', 'remove-from-list', 'delete-forever', 'delete-folders', 'delete-highlighted',
    'delete-books-and-folders', 'say', 'nothing'];

test('TABLE-001', 'every kind of place has an id example here, and placeKind maps each back to its kind', () => {
    assert.deepStrictEqual(Object.keys(PLACE_IDS).sort(), [...t.PLACE_KINDS].sort(),
        'a kind of place was added to the table without an example here — add it');
    for (const [kind, id] of Object.entries(PLACE_IDS)) assert.strictEqual(t.placeKind(id), kind, id);
});

test('TABLE-002', 'every Delete combination (what × place × focus) has a row with a known act — no gaps', () => {
    const missing = [];
    for (const what of t.DELETE_WHATS) for (const kind of t.PLACE_KINDS) for (const focus of t.FOCUSES) {
        let row = null;
        try { row = t.decide('delete', what, { placeId: PLACE_IDS[kind], focus }); } catch (e) { missing.push(`${what}/${kind}/${focus}: ${e.message}`); continue; }
        if (!ACTS.includes(row.act)) missing.push(`${what}/${kind}/${focus}: unknown act ${row.act}`);
        if (row.act === 'say' && !row.words) missing.push(`${what}/${kind}/${focus}: 'say' with no words`);
        if (row.act === 'nothing' && !row.why) missing.push(`${what}/${kind}/${focus}: 'nothing' must say why`);
    }
    assert.deepStrictEqual(missing, []);
});

test('TABLE-003', 'the decided order: books and folders → both; books alone; folders alone; else nothing', () => {
    assert.strictEqual(t.selectionWhat(2, 3), 'both', 'books AND folders selected: Delete takes both (Ron, 2026-11-12, Q-013)');
    assert.strictEqual(t.selectionWhat(2, 0), 'books');
    assert.strictEqual(t.selectionWhat(0, 3), 'folders');
    assert.strictEqual(t.selectionWhat(0, 0), 'nothing');
});

test('TABLE-004', 'the bug this table fixes: with folders selected, Delete acts on THEM, wherever you are', () => {
    for (const kind of t.PLACE_KINDS) for (const focus of t.FOCUSES)
        assert.strictEqual(t.decide('delete', 'folders', { placeId: PLACE_IDS[kind], focus }).act, 'delete-folders', `${kind}/${focus}`);
});

test('TABLE-005', 'with nothing selected, Delete touches the folder you are in ONLY when the left pane has your focus', () => {
    assert.strictEqual(t.decide('delete', 'nothing', { placeId: 'f-empty', focus: 'right' }).act, 'nothing');
    assert.strictEqual(t.decide('delete', 'nothing', { placeId: 'f-empty', focus: 'left' }).act, 'delete-highlighted');
    const inbox = t.decide('delete', 'nothing', { placeId: '__inbox__', focus: 'left' });
    assert.strictEqual(inbox.act, 'say');
    assert.strictEqual(inbox.words, "The Inbox can't be deleted.");
});

test('TABLE-006', "the book rows keep today's behavior: a folder takes them out of it, the Trash deletes forever, a Book List removes from the list", () => {
    const act = (id) => t.decide('delete', 'books', { placeId: id, focus: 'right' }).act;
    assert.strictEqual(act('f-scifi'), 'remove-from-folder');
    assert.strictEqual(act('__inbox__'), 'remove-from-folder');
    assert.strictEqual(act('__all__'), 'trash');
    assert.strictEqual(act('__view_ss-1__'), 'trash');
    assert.strictEqual(act('__trash__'), 'delete-forever');
    assert.strictEqual(act('__booklist_bl-1__'), 'remove-from-list');
});

test('TABLE-007', 'the Inbox is never among the folders Delete takes; it is reported as kept', () => {
    assert.deepStrictEqual(t.splitDeletableFolders(['__inbox__', 'f-a', 'f-b']), { deletable: ['f-a', 'f-b'], kept: ['__inbox__'] });
    assert.deepStrictEqual(t.splitDeletableFolders(['f-a']), { deletable: ['f-a'], kept: [] });
    assert.deepStrictEqual(t.splitDeletableFolders([]), { deletable: [], kept: [] });
});

test('TABLE-008', 'a gesture with no rows yet is refused loudly, not answered with a guess', () => {
    assert.throws(() => t.decide('rename', 'books', { placeId: 'f-a', focus: 'right' }), /no rows for the gesture "rename"/);
    assert.throws(() => t.decide('move', 'nothing', { placeId: 'f-a' }, { placeId: 'f-b' }), /nothing/);
});

test('TABLE-009', 'books and folders selected where both are shown (a folder, the Inbox): Delete takes BOTH, in one act', () => {
    for (const id of ['f-scifi', '__inbox__']) for (const focus of t.FOCUSES) {
        const row = t.decide('delete', 'both', { placeId: id, focus });
        assert.strictEqual(row.act, 'delete-books-and-folders', `${id}/${focus}`);
        assert.strictEqual(row.books, 'remove-from-folder', `${id}/${focus}: the books leave this folder, as Delete on books alone does`);
    }
});

test("TABLE-010", "every 'both' row is its place's books row joined with the folders row — the two can't drift apart", () => {
    const problems = [];
    for (const kind of t.PLACE_KINDS) for (const focus of t.FOCUSES) {
        const from = { placeId: PLACE_IDS[kind], focus };
        const both = t.decide('delete', 'both', from), books = t.decide('delete', 'books', from);
        if (both.act === 'delete-books-and-folders') {
            if (both.books !== books.act) problems.push(`${kind}: the book half says ${both.books}, the books row says ${books.act}`);
            if (!['remove-from-folder', 'trash'].includes(both.books)) problems.push(`${kind}: ${both.books} can't share one undo with a folder delete`);
        } else if (books.act === 'nothing') {
            if (both.act !== 'delete-folders') problems.push(`${kind}: no books are shown there, so 'both' is the folders row — got ${both.act}`);
        } else {
            // books only: allowed where folders are never shown, and it must say why
            if (both.act !== books.act) problems.push(`${kind}: a books-only 'both' row must be the books row — got ${both.act}`);
            if (!both.why) problems.push(`${kind}: a books-only 'both' row must say why the folders are left`);
        }
    }
    assert.deepStrictEqual(problems, []);
});

// ── Move / copy / paste (sprint 4) ──────────────────────────────────────────────────────────────────────────────────
const BOOK_ACTS = ['move-books', 'refile', 'add-books', 'restore', 'already-here', 'refuse'];
const FOLDER_ACTS = ['move-folders', 'copy-folders', 'add-folder-books', 'refuse'];
const row = (verb, what, from, to, clip) => t.decide(verb, what, { placeId: from, clip }, { placeId: to });

test('TABLE-011', 'every move / copy / paste combination (verb × what × from × to) has a row with a known act — no gaps', () => {
    const missing = [];
    const gestures = [['move'], ['copy'], ['paste', 'cut'], ['paste', 'copy']];
    for (const [g, clip] of gestures) for (const what of t.MOVE_WHATS) for (const fk of t.PLACE_KINDS) for (const tk of t.PLACE_KINDS) {
        const at = `${g}${clip ? '/' + clip : ''} ${what} ${fk} → ${tk}`;
        let r;
        try { r = row(g, what, PLACE_IDS[fk], PLACE_IDS[tk], clip); } catch (e) { missing.push(`${at}: ${e.message}`); continue; }
        const acts = what === 'books' ? BOOK_ACTS : what === 'folders' ? FOLDER_ACTS : ['both', 'refuse'];
        if (!acts.includes(r.act)) missing.push(`${at}: unknown act ${r.act}`);
        if (r.act === 'refuse' && !r.words) missing.push(`${at}: a refusal with no words`);
        if (r.act === 'both' && (!BOOK_ACTS.includes(r.books) || !FOLDER_ACTS.includes(r.folders))) missing.push(`${at}: a 'both' row without its halves`);
    }
    // the same place, by a move: "nothing changes, and says so" (§4.1's last row)
    for (const fk of ['folder', 'inbox', 'book-list'])
        if (row('move', 'books', PLACE_IDS[fk], PLACE_IDS[fk]).act !== 'already-here') missing.push(`move books ${fk} → the same ${fk}: not 'already-here'`);
    assert.deepStrictEqual(missing, []);
});

test('TABLE-012', 'the decided book rows (§4.1, §4.2; §6 items 6, 18): what a move / copy does from each place to each place', () => {
    const act = (verb, from, to) => row(verb, 'books', from, to).act;
    // move
    assert.strictEqual(act('move', 'f-scifi', 'f-fantasy'), 'move-books');
    assert.strictEqual(act('move', 'f-scifi', '__inbox__'), 'move-books');
    assert.strictEqual(act('move', 'f-scifi', '__booklist_bl-1__'), 'move-books', 'onto the list, out of the folder');
    assert.strictEqual(act('move', '__booklist_bl-1__', 'f-fantasy'), 'move-books', 'off the list, into the folder');
    assert.strictEqual(act('move', '__booklist_bl-1__', '__booklist_bl-2__'), 'move-books');
    assert.strictEqual(act('move', '__all__', 'f-fantasy'), 'refile', 'cut from All Books, pasted into a folder = re-file (item 18)');
    assert.strictEqual(act('move', '__view_ss-1__', '__inbox__'), 'refile');
    assert.strictEqual(act('move', '__all__', '__booklist_bl-1__'), 'add-books', "lists don't file books: just added");
    assert.strictEqual(act('move', '__trash__', 'f-fantasy'), 'restore', 'out of the Trash = a restore (item 6)');
    assert.strictEqual(act('move', '__trash__', '__booklist_bl-1__'), 'restore');
    assert.strictEqual(act('move', 'f-scifi', 'f-scifi'), 'already-here');
    assert.strictEqual(act('move', '__booklist_bl-1__', '__booklist_bl-1__'), 'already-here');
    // copy — only adds; out of the Trash it is still a restore (a book can't be both thrown away and filed)
    for (const from of ['f-scifi', '__inbox__', '__all__', '__view_ss-1__', '__booklist_bl-1__']) {
        assert.strictEqual(act('copy', from, 'f-fantasy'), 'add-books', from);
        assert.strictEqual(act('copy', from, '__booklist_bl-2__'), 'add-books', from);
    }
    assert.strictEqual(act('copy', 'f-scifi', 'f-scifi'), 'add-books', 'a copy into its own folder adds nothing — its words say so');
    assert.strictEqual(act('copy', '__trash__', 'f-fantasy'), 'restore');
    // refusals, with the reason's words (Law 16)
    for (const verb of ['move', 'copy']) {
        assert.strictEqual(row(verb, 'books', 'f-scifi', '__all__').words, t.MOVE_WORDS.intoAllBooks);
        assert.strictEqual(row(verb, 'books', 'f-scifi', '__library__').words, t.MOVE_WORDS.intoAllBooks);
        assert.strictEqual(row(verb, 'books', 'f-scifi', '__trash__').words, t.MOVE_WORDS.intoTrash);
        assert.strictEqual(row(verb, 'books', 'f-scifi', '__booklists__').words, t.MOVE_WORDS.openAPlace);
    }
    assert.strictEqual(t.MOVE_WORDS.intoTrash, "Can't paste into the Trash. To put books in the Trash, press Delete.");
});

test('TABLE-013', "a paste is the clipboard's verb: a cut moves, a copy copies — from the place the clipboard was filled", () => {
    for (const [fk, tk] of [['folder', 'folder'], ['all-books', 'folder'], ['book-list', 'folder'], ['trash', 'inbox'], ['folder', 'book-list']])
        for (const what of t.MOVE_WHATS) {
            assert.deepStrictEqual(row('paste', what, PLACE_IDS[fk], PLACE_IDS[tk], 'cut'), row('move', what, PLACE_IDS[fk], PLACE_IDS[tk]), `cut ${what} ${fk} → ${tk}`);
            assert.deepStrictEqual(row('paste', what, PLACE_IDS[fk], PLACE_IDS[tk], 'copy'), row('copy', what, PLACE_IDS[fk], PLACE_IDS[tk]), `copy ${what} ${fk} → ${tk}`);
        }
});

test('TABLE-014', 'the folder rows (§5, §6 item 8): a move reparents, a copy copies the tree, onto a Book List a copy adds its books', () => {
    const act = (verb, to) => row(verb, 'folders', 'f-scifi', to).act;
    assert.strictEqual(act('move', 'f-fantasy'), 'move-folders');
    assert.strictEqual(act('move', '__inbox__'), 'move-folders', 'the Inbox is a real folder (Move to › lists it today)');
    assert.strictEqual(act('move', '__library__'), 'move-folders', 'the Folders view = the top level');
    assert.strictEqual(act('copy', 'f-fantasy'), 'copy-folders');
    assert.strictEqual(act('copy', '__library__'), 'copy-folders');
    assert.strictEqual(act('copy', '__booklist_bl-1__'), 'add-folder-books', '"Move and copy books anywhere" decision 10, by the keys');
    const ontoList = row('move', 'folders', 'f-scifi', '__booklist_bl-1__');
    assert.strictEqual(ontoList.act, 'refuse', 'a folder MOVED onto a Book List is not decided — refused with words, for Ron');
    assert.ok(ontoList.why && /not decided/.test(ontoList.why), 'an undecided row says so');
    for (const verb of ['move', 'copy']) for (const to of ['__all__', '__views__', '__booklists__', '__view_ss-1__', '__trash__'])
        assert.strictEqual(act(verb, to), 'refuse', `${verb} folders → ${to}`);
});

test('TABLE-015', 'books and folders together (§6 item 17): both — each half is its own row; a half that refuses refuses the whole, with its words', () => {
    assert.deepStrictEqual(row('move', 'both', 'f-scifi', 'f-fantasy'), { act: 'both', books: 'move-books', folders: 'move-folders' });
    assert.deepStrictEqual(row('copy', 'both', 'f-scifi', '__booklist_bl-1__'), { act: 'both', books: 'add-books', folders: 'add-folder-books' });
    const ontoList = row('move', 'both', 'f-scifi', '__booklist_bl-1__');
    assert.strictEqual(ontoList.act, 'refuse');
    assert.strictEqual(ontoList.words, t.MOVE_WORDS.folderOntoList);
    assert.strictEqual(row('move', 'both', 'f-scifi', '__trash__').words, t.MOVE_WORDS.intoTrash, "the books' refusal first");
});

test('TABLE-016', "the receipts — §6 item 7's 'already there' pattern and item 14's one wording, word for word", () => {
    const w = t.placeWords;
    // item 14
    assert.strictEqual(w({ books: { act: 'move-books', n: 1, title: 'Dune', moved: 1, added: 1, already: 0, from: ['Sci-Fi'], to: 'Fantasy' } }),
        "Moved 'Dune' from 'Sci-Fi' to 'Fantasy'.");
    // 7.1–7.2 copy
    assert.strictEqual(w({ books: { act: 'add-books', n: 3, added: 2, already: 1, to: 'Fantasy' } }), "Added 2 books to 'Fantasy' (1 was already there).");
    assert.strictEqual(w({ books: { act: 'add-books', n: 3, added: 0, already: 3, to: 'Fantasy' } }), "Nothing to add — all 3 are already in 'Fantasy'.");
    assert.strictEqual(w({ books: { act: 'add-books', n: 1, title: 'Dune', added: 0, already: 1, to: 'Fantasy' } }), "'Dune' is already in 'Fantasy'.");
    assert.strictEqual(w({ books: { act: 'add-books', n: 1, title: 'Dune', addedTitle: 'Dune', added: 1, already: 0, to: 'Fantasy' } }), "Added 'Dune' to 'Fantasy'.");
    // 7.3–7.5 move
    assert.strictEqual(w({ books: { act: 'move-books', n: 3, moved: 3, added: 2, already: 1, from: ['Sci-Fi'], to: 'Fantasy' } }),
        "Moved 3 books from 'Sci-Fi' to 'Fantasy' (1 was already there).");
    assert.strictEqual(w({ books: { act: 'move-books', n: 3, moved: 3, added: 0, already: 3, from: ['Sci-Fi'], to: 'Fantasy' } }),
        "Moved 3 books out of 'Sci-Fi' — all 3 were already in 'Fantasy'.");
    assert.strictEqual(w({ books: { act: 'move-books', n: 1, title: 'Good Omens', moved: 1, added: 0, already: 1, from: ['Science Fiction'], to: 'Fantasy' } }),
        "Moved 'Good Omens' out of 'Science Fiction' — it was already in 'Fantasy'.");
    assert.strictEqual(w({ books: { act: 'already-here', n: 3, to: 'Sci-Fi' } }), "Nothing moved — those books are already in 'Sci-Fi'.");
    assert.strictEqual(w({ books: { act: 'already-here', n: 1, title: 'Dune', to: 'Sci-Fi' } }), "Nothing moved — 'Dune' is already in 'Sci-Fi'.");
    // 7.6 a Book List: "on the list"
    assert.strictEqual(w({ books: { act: 'already-here', n: 2, to: 'Read Next', toList: true } }), "Nothing moved — those books are already on 'Read Next'.");
    assert.strictEqual(w({ books: { act: 'add-books', n: 2, added: 1, already: 1, addedTitle: 'Dune', to: 'Read Next', toList: true } }), "Added 'Dune' to 'Read Next' (1 was already there).");
    assert.strictEqual(w({ books: { act: 'add-books', n: 1, title: 'Dune', added: 0, already: 1, to: 'Read Next', toList: true } }), "'Dune' is already on 'Read Next'.");
    // a move onto a list that empties a book's last folder ("Move and copy books anywhere" 3 — the 7.25.1 words)
    assert.strictEqual(w({ books: { act: 'move-books', n: 1, title: 'Dune', moved: 1, added: 1, already: 0, from: ['Fantasy'], to: 'Beach Reads', toList: true, sentToInbox: 1 } }),
        "Moved 'Dune' from 'Fantasy' to 'Beach Reads'. It wasn't in any other folder, so it went to the Inbox.");
    assert.strictEqual(w({ books: { act: 'move-books', n: 3, moved: 3, added: 3, already: 0, from: ['Fantasy'], to: 'Beach Reads', toList: true, sentToInbox: 2 } }),
        "Moved 3 books from 'Fantasy' to 'Beach Reads'. 2 weren't in any other folder, so they went to the Inbox.");
    // a re-file names the folders the books left
    assert.strictEqual(w({ books: { act: 'refile', n: 1, title: 'Dune', moved: 1, added: 1, already: 0, from: ['Sci-Fi', 'Beach Reads'], to: 'Fantasy' } }),
        "Moved 'Dune' from 'Sci-Fi' and 'Beach Reads' to 'Fantasy'.");
    assert.strictEqual(w({ books: { act: 'refile', n: 4, moved: 4, added: 4, already: 0, from: ['A', 'B', 'C'], to: 'Fantasy' } }),
        "Moved 4 books from 3 folders to 'Fantasy'.");
    // item 6: the paste out of the Trash says Restored — never "Pasted"
    assert.strictEqual(w({ books: { act: 'restore', n: 2, to: 'Fantasy' } }), "Restored 2 books from the Trash into 'Fantasy'.");
    assert.strictEqual(w({ books: { act: 'restore', n: 1, title: 'Dune', to: 'Read Next', toList: true } }), "Restored 'Dune' from the Trash and added it to 'Read Next'.");
    // never "Pasted", never a double quote
    const s = w({ books: { act: 'move-books', n: 2, moved: 2, added: 2, already: 0, from: ['A'], to: 'B' } });
    assert.ok(!/Pasted|"/.test(s), s);
});

test('TABLE-017', "Ctrl+X / Ctrl+C say what's on the clipboard; Ctrl+C in the Trash warns that a paste restores (§6 item 6)", () => {
    const c = t.clipWords;
    assert.strictEqual(c('copy', { books: 2, fromTrash: true }), "Copied 2 books from the Trash. Pasting them will restore them — they'll leave the Trash.");
    assert.strictEqual(c('copy', { books: 1, title: 'Dune', fromTrash: true }), "Copied 'Dune' from the Trash. Pasting it will restore it — it'll leave the Trash.");
    assert.strictEqual(c('cut', { books: 1, title: 'Dune' }), "Cut 'Dune'");
    assert.strictEqual(c('copy', { books: 3 }), 'Copied 3 books');
    assert.strictEqual(c('cut', { folders: 1, folderName: 'Space Opera' }), "Cut 'Space Opera'");
    assert.strictEqual(c('copy', { folders: 2 }), 'Copied 2 folders');
    assert.strictEqual(c('cut', { books: 1, title: 'Dune', folders: 1, folderName: 'Space Opera' }), 'Cut 1 book and 1 folder');
});

test('TABLE-018', "the re-file question (§6 item 18) — Ron's words for one book; the several-book form; its three buttons", () => {
    assert.deepStrictEqual(t.refileQuestion({ n: 1, title: 'Dune', to: 'Fantasy', others: ['Sci-Fi', 'Beach Reads'] }), {
        title: "Move 'Dune' to 'Fantasy'?",
        message: "It's also in 'Sci-Fi' and 'Beach Reads' — moving takes it out of them.",
    });
    assert.strictEqual(t.refileQuestion({ n: 1, title: 'Dune', to: 'Fantasy', others: ['A', 'B', 'C'] }).message,
        "It's also in 'A', 'B' and 'C' — moving takes it out of them.");
    assert.deepStrictEqual(t.refileQuestion({ n: 3, to: 'Fantasy', inOthers: 2 }), {
        title: "Move 3 books to 'Fantasy'?",
        message: '2 of them are also in other folders — moving takes them out.',
    });
    assert.deepStrictEqual(t.REFILE_BUTTONS, { move: 'Move', add: 'Just add it', cancel: 'Cancel' });
    // asked only when a book is in 2+ OTHER folders (one other folder: re-filed without a question)
    assert.strictEqual(t.refileAsks([['Sci-Fi'], []]), false);
    assert.strictEqual(t.refileAsks([['Sci-Fi'], ['Sci-Fi', 'Beach Reads']]), true);
});

test('TABLE-019', 'folder receipts (§6 items 8, 14, 17): the copy names what it copied and its new name; a move says from / to', () => {
    const w = t.placeWords;
    assert.strictEqual(w({ folders: { act: 'copy-folders', names: ['Sci-Fi'], books: 12, subfolders: 2, to: 'Fantasy' } }),
        "Copied 'Sci-Fi' (12 books, 2 subfolders) as 'Sci-Fi (Copy)'.");
    assert.strictEqual(w({ folders: { act: 'copy-folders', names: ['Empty'], books: 0, subfolders: 0, to: 'Fantasy' } }), "Copied 'Empty' as 'Empty (Copy)'.");
    assert.strictEqual(w({ folders: { act: 'copy-folders', names: ['Space Opera'], books: 2, subfolders: 1, to: 'Fantasy' } }),
        "Copied 'Space Opera' (2 books, 1 subfolder) as 'Space Opera (Copy)'.");
    assert.strictEqual(w({ folders: { act: 'copy-folders', names: ['A', 'B'], books: 1, subfolders: 0, to: 'Fantasy' } }),
        "Copied 2 folders (1 book) into 'Fantasy'.");
    assert.strictEqual(w({ folders: { act: 'copy-folders', names: ['A', 'B'], books: 0, subfolders: 0, to: null } }),
        'Copied 2 folders to the top level.');
    assert.strictEqual(w({ folders: { act: 'move-folders', names: ['Space Opera'], from: 'Science Fiction', to: 'Fantasy' } }),
        "Moved 'Space Opera' from 'Science Fiction' to 'Fantasy'.");
    assert.strictEqual(w({ folders: { act: 'move-folders', names: ['Space Opera'], from: null, to: null } }), "Moved 'Space Opera' to the top level.");
    assert.strictEqual(w({ folders: { act: 'move-folders', names: ['A', 'B'], from: 'Science Fiction', to: 'Fantasy' } }),
        "Moved 2 folders from 'Science Fiction' to 'Fantasy'.");
    assert.strictEqual(w({ folders: { act: 'move-folders', names: [], already: ['Space Opera'], to: 'Science Fiction' } }),
        "Nothing moved — 'Space Opera' is already in 'Science Fiction'.");
    assert.strictEqual(w({ folders: { act: 'add-folder-books', names: ['Beach Reads'], n: 12, added: 9, already: 3, to: 'Sci-Fi', toList: true } }),
        "Added 9 books from 'Beach Reads' to 'Sci-Fi' (3 were already there).");
    // both: one sentence when both halves went plainly from the same place to the same place
    assert.strictEqual(w({ books: { act: 'move-books', n: 1, title: 'Dune', moved: 1, added: 1, already: 0, from: ['Science Fiction'], to: 'Fantasy' },
        folders: { act: 'move-folders', names: ['Space Opera'], from: 'Science Fiction', to: 'Fantasy' } }),
        "Moved 'Space Opera' and 'Dune' from 'Science Fiction' to 'Fantasy'.");
    // …otherwise the two sentences
    assert.strictEqual(w({ books: { act: 'add-books', n: 1, title: 'Dune', addedTitle: 'Dune', added: 1, already: 0, to: 'Fantasy' },
        folders: { act: 'copy-folders', names: ['Space Opera'], books: 0, subfolders: 0, to: 'Fantasy' } }),
        "Added 'Dune' to 'Fantasy'. Copied 'Space Opera' as 'Space Opera (Copy)'.");
});

test('TABLE-020', 'which folders a cut may take: never the Inbox (it never moves) — a copy may take it', () => {
    assert.deepStrictEqual(t.clipFolders('cut', ['__inbox__', 'f-a']), { taken: ['f-a'], kept: ['__inbox__'] });
    assert.deepStrictEqual(t.clipFolders('copy', ['__inbox__', 'f-a']), { taken: ['__inbox__', 'f-a'], kept: [] });
    assert.strictEqual(t.MOVE_WORDS.inboxCantMove, "The Inbox can't be moved.");
});

done();
