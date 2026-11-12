// gestureTable.js — "the one table": what each gesture does in each place (docs/design/ONE-TABLE.md).
// 7.28.1: its FIRST rows — the Delete key (TODO "The Delete key deletes the folder you're in — not the folders you
// selected", id 20261014-1030ay). 7.28.1-alpha.2: books AND folders selected → both go, in one confirmation and one undo
// (Ron, 2026-11-12, review queue Q-013 — as File Explorer does; was: the books only). The move / copy / paste rows are
// designed in ONE-TABLE.md and follow in their own task (TODO "One table for every move, copy, paste and delete…",
// id 20261106-1237).
//
// Pure — no React, no DOM, no app state — so the rules are function-tested (test/gestureTable.test.js) and every
// combination must have a row. Loaded as a classic script before readerwrangler.js (browser); required by the test
// (Node). The table DECIDES; the app's existing operations DO (softDeleteBooks, permanentlyDeleteBooks, the Book List
// removal, deleteFolders, deleteBooksAndFolders).

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

// decide(gesture, what, from) → { act, books?, words?, why? }. Only 'delete' has rows today.
//   what: 'both' | 'books' | 'folders' | 'nothing'
//   from: { placeId, focus: 'right' | 'left' }
const decide = (gesture, what, from) => {
    if (gesture !== 'delete') throw new Error(`gestureTable: no rows for the gesture "${gesture}" yet`);
    const kind = placeKind(from && from.placeId);
    const key = what === 'nothing' ? `nothing:${from && from.focus === 'left' ? 'left' : 'right'}` : what;
    const row = DELETE_ROWS[key] && DELETE_ROWS[key][kind];
    if (!row) throw new Error(`gestureTable: no Delete row for ${key} in ${kind}`);
    return row;
};

// What Delete acts on, given the selection — in one place. bookCount / folderCount: how many of each are selected in the
// right pane. (Until 7.28.1-alpha.2, books and folders together meant the books only.)
const deleteWhat = (bookCount, folderCount) =>
    (bookCount > 0 && folderCount > 0 ? 'both' : bookCount > 0 ? 'books' : folderCount > 0 ? 'folders' : 'nothing');

// Which selected folders a Delete may take: never the Inbox (nor any place that isn't a real folder). Returns
// { deletable: [...], kept: [...] } — `kept` is what the words must mention.
const splitDeletableFolders = (folderIds) => {
    const deletable = [], kept = [];
    (folderIds || []).forEach(id => (placeKind(id) === 'folder' ? deletable : kept).push(id));
    return { deletable, kept };
};

if (typeof window !== 'undefined') {
    window.gestureTable = { PLACE_KINDS, DELETE_WHATS, FOCUSES, DELETE_WORDS, DELETE_ROWS, placeKind, decide, deleteWhat,
        splitDeletableFolders };
}
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { PLACE_KINDS, DELETE_WHATS, FOCUSES, DELETE_WORDS, DELETE_ROWS, placeKind, decide, deleteWhat,
        splitDeletableFolders };
}
})();
