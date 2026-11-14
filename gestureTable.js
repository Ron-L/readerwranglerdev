// gestureTable.js — "the one table": what each gesture does in each place (docs/design/ONE-TABLE.md).
// 7.30.0 (sprint 4): the move / copy / paste rows, and every word they say (below the Delete rows).
// 7.28.1: its FIRST rows — the Delete key (TODO "The Delete key deletes the folder you're in — not the folders you
// selected", id 20261014-1030ay). 7.28.1-alpha.2: books AND folders selected → both go, in one confirmation and one undo
// (Ron, 2026-11-12, review queue Q-013 — as File Explorer does; was: the books only). 7.30.0: the move / copy / paste
// rows (TODO "One table for every move, copy, paste and delete…", id 20261106-1237; ONE-TABLE.md §4–§6). 7.30.0-alpha.6:
// a drag's words for folders refused at the Book Lists / Searches headers; reparentProblem + intoItself (planReparent's
// checks, pure — a folder's new parent is a real folder or the top level). 7.30.0-alpha.7: a drag's words for books
// dropped on the Book Lists header (DRAG_BOOK_WORDS, beside DRAG_FOLDER_WORDS).
//
// Pure — no React, no DOM, no app state — so the rules are function-tested (test/gestureTable.test.js) and every
// combination must have a row. Loaded as a classic script before readerwrangler.js (browser); required by the test
// (Node). The table DECIDES; the app's existing operations DO (softDeleteBooks, permanentlyDeleteBooks, the Book List
// removal, deleteFolders, deleteBooksAndFolders; for move / copy / paste: placeItems → planBookPlacement, planReparent,
// planFolderCopy).

(() => {
// Every kind of place the right pane can show — the one map from a place's id to its kind.
const PLACE_KINDS = ['folder', 'inbox', 'all-books', 'folders-view', 'searches-view', 'book-lists-view', 'book-list',
    'search', 'trash'];

const placeKind = (placeId) => {
    if (placeId === '__inbox__') return 'inbox';
    if (placeId === '__all__') return 'all-books';
    if (placeId === '__library__') return 'folders-view';      // the "Folders" header: the Inbox + top-level folders
    if (placeId === '__views__') return 'searches-view';
    if (placeId === '__booklists__') return 'book-lists-view';
    if (placeId === '__trash__') return 'trash';
    if (typeof placeId === 'string' && placeId.startsWith('__booklist_') && placeId.endsWith('__')) return 'book-list';
    if (typeof placeId === 'string' && placeId.startsWith('__view_') && placeId.endsWith('__')) return 'search';
    return 'folder';
};

// What Delete can act on (Ron + UX, 2026-10-22; 'both' Ron 2026-11-12): what's selected in the right pane — books and
// folders both, books, or folders; with nothing selected, only when the left pane has your focus, the entry highlighted
// there; otherwise nothing.
const DELETE_WHATS = ['both', 'books', 'folders', 'nothing'];
const FOCUSES = ['right', 'left'];

// The words the Delete rows say (one home; the app shows them as written).
const DELETE_WORDS = {
    inboxCantDelete: "The Inbox can't be deleted.",
    inboxStays: "The Inbox stays — it can't be deleted.",
};

// The acts (what the app then runs):
//   remove-from-folder  — out of this folder; a book in no other folder goes to the Trash (softDeleteBooks)
//   trash               — out of every folder, into the Trash (softDeleteBooks in a view with no single folder)
//   remove-from-list    — off this Book List only; the books themselves stay
//   delete-forever      — permanently, after a confirmation (permanentlyDeleteBooks)
//   delete-folders      — the selected folders (deleteFolders: one folder as before; several = one confirmation listing
//                         them, one undo; the Inbox is never deleted — it stays, and the words say so)
//   delete-highlighted  — the folder highlighted in the left pane (deleteFolders with that one folder)
//   delete-books-and-folders — the selected folders AND the selected books: one confirmation naming both, one undo step.
//                         `books` names the book half — always the place's own books row (TABLE-010), so the books go
//                         exactly as Delete on books alone sends them. The folders go first, then the books from what's
//                         left: a selected book that was also inside a selected folder then really leaves (books first,
//                         the folder's delete would put it straight back into this folder).
//   say                 — nothing changes; the row's words say why (Law 16: a key never fails silently when the person
//                         clearly aimed it at something)
//   nothing             — nothing changes, nothing said (nothing was aimed at — Finder / File Explorer do the same)
// `why` on a 'nothing' row: the reason the cell can't be reached or does nothing (for the design doc and the tests).
const NO_BOOKS_SHOWN = 'no books are shown there';
const NO_FOLDERS_SHOWN = 'no folders are shown there, so none can be selected with the books';
const DELETE_ROWS = {
    // Books and folders selected together (Ron, 2026-11-12, Q-013). Both can be shown — and so selected — only in a
    // folder and the Inbox; the other cells can't be reached, and each says what it would do if one ever were.
    both: {
        'folder': { act: 'delete-books-and-folders', books: 'remove-from-folder' },
        'inbox': { act: 'delete-books-and-folders', books: 'remove-from-folder' },
        'all-books': { act: 'delete-books-and-folders', books: 'trash' },
        'search': { act: 'delete-books-and-folders', books: 'trash' },
        // no books are shown in the three headers: what's selected there is folders — the folders row
        'folders-view': { act: 'delete-folders' },
        'searches-view': { act: 'delete-folders' },
        'book-lists-view': { act: 'delete-folders' },
        // the books only: a Book List and the Trash show no folders; and the Trash deletes books forever, which can't
        // share an undo step with a folder delete
        'book-list': { act: 'remove-from-list', why: NO_FOLDERS_SHOWN },
        'trash': { act: 'delete-forever', why: NO_FOLDERS_SHOWN + "; and a delete forever can't be undone, so it can't share one undo with a folder delete" },
    },
    books: {
        'folder': { act: 'remove-from-folder' },
        'inbox': { act: 'remove-from-folder' },
        'all-books': { act: 'trash' },
        'folders-view': { act: 'nothing', why: NO_BOOKS_SHOWN },
        'searches-view': { act: 'nothing', why: NO_BOOKS_SHOWN },
        'book-lists-view': { act: 'nothing', why: NO_BOOKS_SHOWN },
        'book-list': { act: 'remove-from-list' },
        'search': { act: 'trash' },
        'trash': { act: 'delete-forever' },
    },
    // Folders are shown (and so selectable) in a folder, the Inbox and the Folders view; elsewhere the cell can't be
    // reached, and if it ever were, deleting what's selected is still what the person asked.
    folders: Object.fromEntries(PLACE_KINDS.map(k => [k, { act: 'delete-folders' }])),
    'nothing:right': Object.fromEntries(PLACE_KINDS.map(k => [k, { act: 'nothing', why: 'nothing is selected' }])),
    'nothing:left': {
        'folder': { act: 'delete-highlighted' },
        'inbox': { act: 'say', words: DELETE_WORDS.inboxCantDelete },
        'all-books': { act: 'nothing', why: 'All Books is not a thing that can be deleted' },
        'folders-view': { act: 'nothing', why: 'a section header, not a thing that can be deleted' },
        'searches-view': { act: 'nothing', why: 'a section header, not a thing that can be deleted' },
        'book-lists-view': { act: 'nothing', why: 'a section header, not a thing that can be deleted' },
        // Design only (ONE-TABLE.md §3, for Ron): Delete on a highlighted Book List could delete it, as its right-click
        // Delete does. Not built in 7.28.1 — the decided rule names folders.
        'book-list': { act: 'nothing', why: 'not built: the decided rule names folders (a Book List row is proposed)' },
        // A Search is never "highlighted": clicking one applies its filters where you are.
        'search': { act: 'nothing', why: 'a Search is never the highlighted place (clicking one applies its filters)' },
        'trash': { act: 'nothing', why: 'the Trash is not a thing that can be deleted' },
    },
};

// ── Move / copy / paste (sprint 4 — ONE-TABLE.md §4–§6, decided 2026-11-13) ─────────────────────────────────────────
// What's moved: books, folders, or both (§6 item 17: "a book and a folder selected together: both, for every gesture").
const MOVE_WHATS = ['books', 'folders', 'both'];
const VERBS = ['move', 'copy'];

// The words a refusal says — one home (the keys' toast and, later, the menus' greyed items' "why" read them).
const MOVE_WORDS = {
    intoTrash: "Can't paste into the Trash. To put books in the Trash, press Delete.",
    intoAllBooks: 'Every book is already in All Books. Open a folder or Book List to paste into it.',
    openAPlace: 'Open a folder or Book List to paste into it.',
    foldersOpenAFolder: 'Open a folder to paste folders into it.',
    foldersIntoTrash: "Can't paste folders into the Trash. To delete folders, press Delete.",
    folderOntoList: "A folder can't be moved onto a Book List. To add its books to the list, copy the folder instead.",
    inboxCantMove: "The Inbox can't be moved.",
    copyIntoItself: "Can't copy a folder into itself or its subfolder.",
    moveIntoItself: "Can't move a folder into itself or its subfolder.",
    // 7.30.0-alpha.4: books aimed at the top level (the Folders header) by a menu or a drag — the words name the place; the
    // paste keeps openAPlace's / intoAllBooks' words (it is about pasting)
    booksNotTopLevel: "Books can't go to the top level — only folders can.",
    dragBothNotTopLevel: "Nothing moved — books can't go to the top level, only folders. Drop them on a folder, or drag the folders on their own.",
    // 7.30.0-alpha.6: folders dragged onto "Book Lists" / "Searches" in the folder path above the right pane — a drag's
    // words, naming the place (the paste keeps foldersOpenAFolder)
    dragFoldersNotIntoBookLists: "Nothing moved — folders can't go into Book Lists, only into another folder or the top level.",
    dragFoldersNotIntoSearches: "Nothing moved — folders can't go into Searches, only into another folder or the top level.",
    // 7.30.0-alpha.7: books dragged onto "Book Lists" in the folder path (a Book List open) — a drag's words, naming the
    // place (was the paste's "Open a folder or Book List to paste into it"). "Searches" takes no book drag (its crumb
    // doesn't accept one), so it has no such words.
    dragBooksNotOntoBookLists: "Nothing moved — books can't go onto the Book Lists heading, only onto a Book List. Drop them on one in the left pane.",
    // 7.30.0-alpha.6: planReparent's guard (reparentProblem) — a caller that asked for a parent that isn't a folder; the
    // table refuses such a gesture first, so a person sees this only if a gesture skipped the table (a bug)
    parentNotAFolder: 'Nothing moved — a folder can only go into another folder or the top level.',
};
// a drag's words for folders / books refused at a header (the act is the row's — only the words fit the drag)
const DRAG_FOLDER_WORDS = { 'book-lists-view': MOVE_WORDS.dragFoldersNotIntoBookLists, 'searches-view': MOVE_WORDS.dragFoldersNotIntoSearches };
const DRAG_BOOK_WORDS = { 'book-lists-view': MOVE_WORDS.dragBooksNotOntoBookLists };

// The acts (what the app then runs — the table decides, the operations do):
//   books:   move-books   — out of the folder or Book List they came from, into the destination; a book leaving its LAST
//                           folder for a Book List goes to the Inbox, and the words say so ("Move and copy books
//                           anywhere" decision 3)
//            refile       — from All Books / a Search (no container) into a folder: out of every other folder, into this
//                           one; asked first when a book is in 2+ other folders (§6 item 18)
//            add-books    — only adds (a copy; and a move from no container onto a Book List — lists don't file books)
//            restore      — out of the Trash into the destination: for every gesture, a copy too (§6 item 6)
//            already-here — a move into the place it came from: nothing changes, and the words say so (§6 item 7.5)
//   folders: move-folders — under the destination (a folder, the Inbox; the Folders view = the top level); never into
//                           itself or below (the operation's own check); the Inbox itself never moves
//            copy-folders — the whole tree as "X (Copy)", every book filed in the copy too (§6 items 8, 15)
//            add-folder-books — a copy onto a Book List: the folders' books, every subfolder's too (decision 10 of
//                           "Move and copy books anywhere", for the keys)
//   both:    { act: 'both', books, folders } — each half by its own row; a half that refuses refuses the whole
//   refuse   — nothing changes; `words` say why (Law 16). `why` on a row nobody decided: it says so, for Ron.
const refuse = (words, why) => (why ? { act: 'refuse', words, why } : { act: 'refuse', words });
// One row = the answer for each place it can go to, in PLACE_KINDS' order (folder, inbox, all-books, folders-view,
// searches-view, book-lists-view, book-list, search, trash).
const toEach = (...answers) => {
    if (answers.length !== PLACE_KINDS.length) throw new Error('gestureTable: a row needs one answer per kind of place');
    return Object.fromEntries(PLACE_KINDS.map((k, i) => [k, typeof answers[i] === 'string' ? { act: answers[i] } : answers[i]]));
};
const W = MOVE_WORDS;
const ALL = refuse(W.intoAllBooks), OPEN = refuse(W.openAPlace), TRASH = refuse(W.intoTrash);
// a move from a container (a folder, the Inbox, a Book List)
const FROM_CONTAINER = toEach('move-books', 'move-books', ALL, ALL, OPEN, OPEN, 'move-books', OPEN, TRASH);
// a move from no container (All Books, a Search; and the three headers, which show no books — that cell can't be reached)
const FROM_NOWHERE = toEach('refile', 'refile', ALL, ALL, OPEN, OPEN, 'add-books', OPEN, TRASH);
const FROM_TRASH = toEach('restore', 'restore', ALL, ALL, OPEN, OPEN, 'restore', OPEN, TRASH);
const COPY = toEach('add-books', 'add-books', ALL, ALL, OPEN, OPEN, 'add-books', OPEN, TRASH);
const BOOK_ROWS = {
    move: {
        'folder': FROM_CONTAINER, 'inbox': FROM_CONTAINER, 'book-list': FROM_CONTAINER,
        'all-books': FROM_NOWHERE, 'search': FROM_NOWHERE,
        'folders-view': FROM_NOWHERE, 'searches-view': FROM_NOWHERE, 'book-lists-view': FROM_NOWHERE,
        'trash': FROM_TRASH,
    },
    copy: Object.fromEntries(PLACE_KINDS.map(k => [k, k === 'trash' ? FROM_TRASH : COPY])),
};
// Folders: the same wherever they came from (they can be selected in a folder, the Inbox and the Folders view).
const F_OPEN = refuse(W.foldersOpenAFolder), F_TRASH = refuse(W.foldersIntoTrash);
const FOLDER_ROWS = {
    move: toEach('move-folders', 'move-folders', F_OPEN, 'move-folders', F_OPEN, F_OPEN,
        refuse(W.folderOntoList, 'not decided — a folder MOVED onto a Book List (a copy adds its books); for Ron'), F_OPEN, F_TRASH),
    copy: toEach('copy-folders', 'copy-folders', F_OPEN, 'copy-folders', F_OPEN, F_OPEN, 'add-folder-books', F_OPEN, F_TRASH),
};
const CONTAINER_KINDS = ['folder', 'inbox', 'book-list'];

// Today's drags — gesture → verb (§2; "Move and copy books anywhere" decisions 6–7, File Explorer's convention). Ctrl
// always copies. A plain drag MOVES within one kind of place — folder → folder (the Inbox and the Folders header are
// folders too), Book List → Book List — and COPIES across kinds: a folder ↔ a Book List, both ways (dropping a 300-book
// folder on a list as a move would empty the tree — decision 6), and All Books or a Search → anywhere (§6 item 16: it
// only adds; a plain drag guesses safe — a re-file is Shift-drag, the drag task's). Out of the Trash, either verb is a
// restore (§6 item 6 — the rows say so). (Shift-drag = move, always: not built — the drag task.)
const DRAG_KINDS = { 'folder': 'folders', 'inbox': 'folders', 'folders-view': 'folders', 'book-list': 'book-lists' };
const dragVerb = (fromPlaceId, toPlaceId, ctrl) => {
    if (ctrl) return 'copy';
    const a = DRAG_KINDS[placeKind(fromPlaceId)], b = DRAG_KINDS[placeKind(toPlaceId)];
    return a && a === b ? 'move' : 'copy';
};

// decide(gesture, what, from, to) → { act, books?, folders?, words?, why? }
//   'delete': what 'both' | 'books' | 'folders' | 'nothing'; from { placeId, focus: 'right' | 'left' } (§3)
//   'move' | 'copy': what 'books' | 'folders' | 'both'; from { placeId } (where they came from); to { placeId } — also
//                    the book menu's Move to › / Copy to › (copy) / Add to Book List › (copy)
//   'paste': the clipboard's verb — from { placeId, clip: 'cut' | 'copy' } (a cut moves, a copy copies)
//   'drag': the drag's verb (dragVerb) — from { placeId, ctrl } (Ctrl held at the drop)
const decide = (gesture, what, from, to) => {
    if (gesture === 'delete') {
        const kind = placeKind(from && from.placeId);
        const key = what === 'nothing' ? `nothing:${from && from.focus === 'left' ? 'left' : 'right'}` : what;
        const row = DELETE_ROWS[key] && DELETE_ROWS[key][kind];
        if (!row) throw new Error(`gestureTable: no Delete row for ${key} in ${kind}`);
        return row;
    }
    const verb = gesture === 'paste' ? (from && from.clip === 'cut' ? 'move' : 'copy')
        : gesture === 'drag' ? dragVerb(from && from.placeId, to && to.placeId, !!(from && from.ctrl)) : gesture;
    if (!VERBS.includes(verb)) throw new Error(`gestureTable: no rows for the gesture "${gesture}" yet`);
    if (!MOVE_WHATS.includes(what)) throw new Error(`gestureTable: a ${verb} of "${what}" — nothing to ${verb}`);
    const fromKind = placeKind(from && from.placeId), toKind = placeKind(to && to.placeId);
    // A refusal's words fit the gesture (7.30.0-alpha.4): the rows' words are the paste's ("Open a folder or Book List to
    // paste into it"); books aimed at the top level (the Folders header) by a menu or a drag are told about the place
    // instead — a drop of books and folders on "Folders" in the folder path, the folder menu's Root. The act never differs.
    const fit = (r) => (r.act === 'refuse' && toKind === 'folders-view' && gesture !== 'paste'
        ? refuse(gesture === 'drag' && what === 'both' ? W.dragBothNotTopLevel : W.booksNotTopLevel) : r);
    const fitDrag = (r, words) => (r.act === 'refuse' && gesture === 'drag' && words[toKind] ? refuse(words[toKind]) : r);
    const books = () => (verb === 'move' && from.placeId === to.placeId && CONTAINER_KINDS.includes(toKind)
        ? { act: 'already-here' } : fitDrag(fit(BOOK_ROWS[verb][fromKind][toKind]), DRAG_BOOK_WORDS));
    const folders = () => fitDrag(FOLDER_ROWS[verb][toKind], DRAG_FOLDER_WORDS);
    if (what === 'books') return books();
    if (what === 'folders') return folders();
    const b = books(), f = folders();
    if (b.act === 'refuse') return b;
    if (f.act === 'refuse') return f;
    return { act: 'both', books: b.act, folders: f.act };
};

// What's selected — books and folders both, books, folders, or nothing — in one place, for every gesture (Delete since
// 7.28.1-alpha.2; the clipboard keys since 7.30.0). bookCount / folderCount: how many of each are selected.
const selectionWhat = (bookCount, folderCount) =>
    (bookCount > 0 && folderCount > 0 ? 'both' : bookCount > 0 ? 'books' : folderCount > 0 ? 'folders' : 'nothing');

// Which selected folders a cut / copy may take: a cut never takes the Inbox (it never moves) — `kept` is what the words
// must mention; a copy may take it (a copy of the Inbox is an ordinary folder holding its books).
const clipFolders = (type, folderIds) => {
    const taken = [], kept = [];
    (folderIds || []).forEach(id => (type === 'cut' && id === '__inbox__' ? kept : taken).push(id));
    return { taken, kept };
};

// ── The words (§6 items 6, 7, 8, 14, 18) — pure, so each sentence is function-tested word for word ────────────────────
const q = (s) => `'${s}'`;
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const bookWhat = (n, title) => (n === 1 && title ? q(title) : plural(n, 'book'));
const folderWhat = (names) => (names.length === 1 ? q(names[0]) : plural(names.length, 'folder'));
const wereThere = (k) => `${k} ${k === 1 ? 'was' : 'were'} already there`;
const nameList = (names) => (names.length <= 1 ? names.map(q).join('')
    : `${names.slice(0, -1).map(q).join(', ')} and ${q(names[names.length - 1])}`);
const fromFolders = (names) => (names.length <= 2 ? nameList(names) : plural(names.length, 'folder'));
const place = (name) => (name ? q(name) : 'the top level');

// One half's sentence. books: { act, n, title (when n is 1), moved, added, addedTitle, already, from: [names], to,
// toList, sentToInbox }. folders: { act, names, already: [names], from, to (null = the top level), books, subfolders } —
// for add-folder-books: { names, n, added, already, to, toList }.
const bookSentence = (b) => {
    const inOn = b.toList ? 'on' : 'in';
    const there = b.already ? ` (${wereThere(b.already)})` : '';
    if (b.act === 'already-here' || (b.act !== 'add-books' && b.act !== 'restore' && !b.moved && !b.added)) {
        return b.n === 1 ? `Nothing moved — ${q(b.title)} is already ${inOn} ${q(b.to)}.` : `Nothing moved — those books are already ${inOn} ${q(b.to)}.`;
    }
    if (b.act === 'restore') {
        return b.toList ? `Restored ${bookWhat(b.n, b.title)} from the Trash and added ${b.n === 1 ? 'it' : 'them'} to ${q(b.to)}.`
            : `Restored ${bookWhat(b.n, b.title)} from the Trash into ${q(b.to)}.`;
    }
    if (b.act === 'add-books') {
        if (!b.added) return b.n === 1 ? `${q(b.title)} is already ${inOn} ${q(b.to)}.` : `Nothing to add — all ${b.n} are already ${inOn} ${q(b.to)}.`;
        const from = b.from && b.from.length ? ` from ${fromFolders(b.from)}` : '';
        return `Added ${bookWhat(b.added, b.addedTitle)}${from} to ${q(b.to)}${there}.`;
    }
    // move-books / refile
    const from = b.from || [];
    if (!b.added) {
        return b.n === 1 ? `Moved ${q(b.title)} out of ${fromFolders(from)} — it was already ${inOn} ${q(b.to)}.`
            : `Moved ${b.n} books out of ${fromFolders(from)} — all ${b.n} were already ${inOn} ${q(b.to)}.`;
    }
    const k = b.sentToInbox || 0;
    const inbox = k === 0 ? '' : b.n === 1 ? " It wasn't in any other folder, so it went to the Inbox."
        : k === 1 ? " 1 wasn't in any other folder, so it went to the Inbox." : ` ${k} weren't in any other folder, so they went to the Inbox.`;
    return `Moved ${bookWhat(b.n, b.title)}${from.length ? ` from ${fromFolders(from)}` : ''} to ${q(b.to)}${there}.${inbox}`;
};
const folderSentence = (f) => {
    if (f.act === 'add-folder-books') return bookSentence({ act: 'add-books', n: f.n, added: f.added, already: f.already, from: f.names, to: f.to, toList: f.toList, title: f.names[0] });
    if (f.act === 'copy-folders') {
        const parts = [f.books ? plural(f.books, 'book') : '', f.subfolders ? plural(f.subfolders, 'subfolder') : ''].filter(Boolean);
        const counts = parts.length ? ` (${parts.join(', ')})` : '';
        return f.names.length === 1 ? `Copied ${q(f.names[0])}${counts} as ${q(`${f.names[0]} (Copy)`)}.`
            : `Copied ${plural(f.names.length, 'folder')}${counts} ${f.to ? 'into' : 'to'} ${place(f.to)}.`;
    }
    // move-folders
    if (!f.names.length) {
        const al = f.already || [];
        return al.length === 1 ? `Nothing moved — ${q(al[0])} is already in ${place(f.to)}.` : `Nothing moved — those folders are already in ${place(f.to)}.`;
    }
    return `Moved ${folderWhat(f.names)}${f.from ? ` from ${q(f.from)}` : ''} to ${place(f.to)}.`;
};
// The receipt of a move / copy / paste: one sentence per half — or ONE sentence when books and folders went plainly from
// the same place to the same place ("Moved 'Space Opera' and 'Dune' from 'Science Fiction' to 'Fantasy'.").
const placeWords = ({ books, folders }) => {
    if (books && folders && books.act === 'move-books' && folders.act === 'move-folders' && books.added && !books.already
        && !books.sentToInbox && folders.names.length && !(folders.already || []).length && folders.to === books.to
        && (books.from || []).length === 1 && folders.from === books.from[0]) {
        return `Moved ${folderWhat(folders.names)} and ${bookWhat(books.n, books.title)} from ${q(folders.from)} to ${q(books.to)}.`;
    }
    return [books && bookSentence(books), folders && folderSentence(folders)].filter(Boolean).join(' ');
};

// What Ctrl+X / Ctrl+C say. A copy out of the Trash warns where you decide (§6 item 6): a paste will restore.
// counts: { books, title (one book's), folders, folderName (one folder's), fromTrash }
const clipWords = (type, { books = 0, title, folders = 0, folderName, fromTrash } = {}) => {
    if (type === 'copy' && fromTrash && books && !folders) {
        return books === 1 ? `Copied ${q(title)} from the Trash. Pasting it will restore it — it'll leave the Trash.`
            : `Copied ${books} books from the Trash. Pasting them will restore them — they'll leave the Trash.`;
    }
    const what = books && folders ? `${plural(books, 'book')} and ${plural(folders, 'folder')}`
        : books ? bookWhat(books, title) : folders === 1 && folderName ? q(folderName) : plural(folders, 'folder');
    return `${type === 'cut' ? 'Cut' : 'Copied'} ${what}`;
};

// The book menu's header (7.30.0-alpha.4): what's selected — the books, and the folders with them ("2 books and 1 folder
// selected"; was the books only — the menu now acts on both, §6 item 17).
const selectedWords = (books, folders) => `${folders ? `${plural(books, 'book')} and ${plural(folders, 'folder')}` : plural(books, 'book')} selected`;

// What the menus' "New folder here…" / "New Book List…" boxes say they will do — from the table's act for what's selected
// (7.30.0-alpha.4: in the Trash it is a restore, never "copy" / "move", §6 item 6). act: the book half's act (refile /
// move-books → move; add-books → copy; restore); books / folders: how many are selected; toList: a new Book List (else a
// folder); inside: the new folder goes inside the one you're in; existing: the suggested list name is an existing list's.
const newPlaceWords = ({ act, books = 0, folders = 0, toList = false, inside = false, existing } = {}) => {
    const restore = act === 'restore';
    const them = books + folders === 1 ? 'it' : 'them';
    const what = [books ? plural(books, 'book') : '',
        folders ? (toList ? `the books in ${plural(folders, 'folder')}` : plural(folders, 'folder')) : ''].filter(Boolean).join(' and ');
    if (toList) {
        if (existing) {
            return `A Book List named “${existing}” already exists — press OK to ${restore ? `restore ${what} from the Trash and add ${them} to that list`
                : `add ${what} to it`}, or type a different name to create a new list.`;
        }
        return restore ? `Restore ${what} from the Trash and add ${them} to a new Book List.` : `Add ${what} to a new Book List.`;
    }
    const verb = restore ? 'restore' : act === 'add-books' ? 'copy' : 'move';
    return `Create a folder${inside ? ' inside this one' : ''} and ${verb} ${what}${restore ? ' from the Trash' : ''} into it.`;
};

// The re-file question (§6 item 18): a cut from All Books (or with a Search applied) pasted into a folder, when a book is
// in 2+ other folders. One book: Ron's words; several: the same shape (Claude's, 2026-11-13 — goes to Ron with the
// release's new words). others: the other folders' names (one book); inOthers: how many of the books are in other folders.
const REFILE_BUTTONS = { move: 'Move', add: 'Just add it', cancel: 'Cancel' };
const refileAsks = (otherFoldersPerBook) => (otherFoldersPerBook || []).some(o => o.length >= 2);
const refileQuestion = ({ n, title, to, others, inOthers }) => (n === 1
    ? { title: `Move ${q(title)} to ${q(to)}?`, message: `It's also in ${nameList(others)} — moving takes it out of them.` }
    : { title: `Move ${n} books to ${q(to)}?`, message: `${inOthers} of them ${inOthers === 1 ? 'is' : 'are'} also in other folders — moving takes ${inOthers === 1 ? 'it' : 'them'} out.` });

// "Would this put a folder into itself or below it?" — the ONE check (7.30.0-alpha.4; pure since alpha.6): a folder move,
// a folder copy, the menus' greyed targets. Walks UP from the target through folderList ({ id, parentId }), so a
// destination a gesture is making ("New folder here…") is checked too. target null = the top level.
const intoItself = (folderIds, target, folderList) => {
    const parentOf = new Map((folderList || []).map(f => [f.id, f.parentId ?? null]));
    const above = new Set();
    for (let p = target; p && !above.has(p); p = parentOf.get(p)) above.add(p);
    return (folderIds || []).some(id => above.has(id));
};
// planReparent's guard (7.30.0-alpha.6) — under the table, so no caller can corrupt the tree: a folder's new parent is a
// real folder (the Inbox is one) or the top level (null / undefined) — never a header, a Book List, a Search, All Books,
// the Trash or a folder that's gone (was: a left-pane folder dropped on "Book Lists" in the folder path got that id as
// its parent and dropped out of the tree); never into itself or below; the Inbox never moves. Returns 'not-a-folder' |
// 'into-itself' | 'inbox' | null (fine) — the app says each in its own words.
const reparentProblem = (folderIds, newParentId, folderList) => {
    if (newParentId != null && !(folderList || []).some(f => f.id === newParentId)) return 'not-a-folder';
    for (const id of folderIds || []) {
        if (intoItself([id], newParentId, folderList)) return 'into-itself';
        if (id === '__inbox__') return 'inbox';
    }
    return null;
};

// Which selected folders a Delete may take: never the Inbox (nor any place that isn't a real folder). Returns
// { deletable: [...], kept: [...] } — `kept` is what the words must mention.
const splitDeletableFolders = (folderIds) => {
    const deletable = [], kept = [];
    (folderIds || []).forEach(id => (placeKind(id) === 'folder' ? deletable : kept).push(id));
    return { deletable, kept };
};

// The right-click Delete with books AND folders selected (§6 item 9 — the Delete key's 'both' row): one item, in the book
// menu and the folder menu, naming both — "Delete 2 Books and 1 Folder" (Ron's words, 2026-11-13).
const cap = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;
const deleteBothLabel = (books, folders) => `Delete ${cap(books, 'Book')} and ${cap(folders, 'Folder')}`;

const api = { PLACE_KINDS, DELETE_WHATS, FOCUSES, DELETE_WORDS, DELETE_ROWS, placeKind, decide, selectionWhat,
    splitDeletableFolders, MOVE_WHATS, VERBS, MOVE_WORDS, BOOK_ROWS, FOLDER_ROWS, clipFolders, placeWords, clipWords,
    REFILE_BUTTONS, refileAsks, refileQuestion, dragVerb, deleteBothLabel, selectedWords, newPlaceWords, intoItself,
    reparentProblem };
if (typeof window !== 'undefined') window.gestureTable = api;
if (typeof module !== 'undefined' && module.exports) module.exports = api;
})();
