// test/fixtures/make-small-fixture.js — builds small-fixture.json, the made-up test library (docs/design/TESTING.md §5).
//
// Run: node test/fixtures/make-small-fixture.js     (re-run whenever the backup format or the cases change)
//
// Built with the APP'S OWN book packer (bookFields.js packBook — what File → Save Backup uses), and the organization in
// the exact shape Save Backup writes (schema 2.4: folders with sortIndex / pinned / childFolderIds and the "__inbox__"
// folder, Book Lists with position, the tag registry, saved Searches), so the fixture can't drift from the real format.
//
// It holds LEGITIMATE states only — every way a healthy library can look, the awkward ones on purpose. Damaged states
// (a book in no folder, a doubled space in an author) belong in separate fixtures for the tests that repair them, so
// loading this one never triggers a repair. No Cloud Sync Key, no cover images (coverUrl empty — the tests never fetch
// from Amazon), nothing personal: every ASIN starts "TST".
//
// Cases to add as features land: a book at several series positions (omnibus — "Series positions…"), a Book List
// entry per series run ("Bake this order into Manual…").
'use strict';
const fs = require('fs');
const path = require('path');
const { packBook } = require('../../bookFields.js');

const DAY = 86400000;
const NOW = Date.UTC(2026, 10, 1, 12);               // fixed "now" — 2026-11-01 — so dates never drift
const ms = (daysAgo) => String(NOW - daysAgo * DAY);

let n = 0;
const book = (fields) => {
    n++;
    return {
        asin: 'TST' + String(n).padStart(7, '0'),
        title: 'Test Book ' + n,
        author: 'Avery Testwriter',
        series: '', seriesPosition: '',
        ownershipType: 'purchased',
        acquired: ms(400 - n * 10),
        description: 'A made-up book for ReaderWrangler\'s tests (#' + n + ').',
        rating: 4.2, ratingCount: '1,234',
        coverUrl: '',
        tags: [], myRating: 0, isHidden: false, isDeleted: false,
        ...fields,
    };
};

// Every ownership kind the fetcher knows (amazon-library-fetcher.js resolveOwnershipType) — "test the class": one book
// per kind, so a filter or rule that mishandles any kind has a book to show it.
const OWNERSHIP_KINDS = ['purchased', 'sample', 'borrowed', 'prime', 'kindleUnlimited', 'koll', 'comixology',
    'insideAmazon', 'publicLibraryLending', 'audiblePlus', 'wishlist'];

const B = {};
// A series in reading order, filed in a pinned folder's subfolder.
B.saga1 = book({ title: 'The Test Saga, Book One', series: 'The Test Saga', seriesPosition: '1', tags: ['read'], myRating: 5 });
B.saga2 = book({ title: 'The Test Saga, Book Two', series: 'The Test Saga', seriesPosition: '2', tags: ['read'] });
B.saga3 = book({ title: 'The Test Saga, Book Three', series: 'The Test Saga', seriesPosition: '3' });
B.saga25 = book({ title: 'The Test Saga: Between the Books', series: 'The Test Saga', seriesPosition: '2.5' });
// Two authors on one book (never parsed — the whole text is the author).
B.coauthored = book({ title: 'Good Omens', author: 'Avery Testwriter, Blake Coauthor' }); // filed in TWO folders (Fantasy, Science Fiction): a move out of one isn't its last folder
// One book per ownership kind (the wishlist one carries a price goal).
for (const kind of OWNERSHIP_KINDS) {
    B['own_' + kind] = book({
        title: 'Owned as ' + kind, author: 'Casey Kinds', ownershipType: kind,
        ...(kind === 'wishlist' ? { onWishlist: true, priceTrigger: 2.99, currentPrice: 4.99, addedToWishlist: ms(20) } : {}),
    });
}
// A sample of a wishlisted book's series-mate, a hidden book, a book with no description, notes and stars.
B.hidden = book({ title: 'A Hidden Book', isHidden: true });
B.nodesc = book({ title: 'A Book With No Description', description: '' });
B.noted = book({ title: 'A Book With a Note', userNote: 'Lend to Pat after the holidays.', myRating: 3, tags: ['favorites'] });
// Deep nesting.
B.deep = book({ title: 'Deep in the Folders', author: 'Drew Nested', tags: ['to-read'] });
// In the Trash (it came from the Science Fiction folder).
B.trashed = book({ title: 'A Book in the Trash', isDeleted: true, deletedAt: NOW - 3 * DAY, deletedFromFolderIds: ['f-scifi'] });
// New arrivals waiting in the Inbox.
B.inbox1 = book({ title: 'New Arrival One', acquired: ms(2) });
B.inbox2 = book({ title: 'New Arrival Two', acquired: ms(1) });

const ids = (...keys) => keys.map(k => B[k].asin);
const kindIds = OWNERSHIP_KINDS.map(k => B['own_' + k].asin);

const folders = [
    { id: '__inbox__', name: 'Inbox', bookIds: ids('inbox1', 'inbox2'), parentId: null, collapsed: false, sortIndex: 0 },
    { id: 'f-fantasy', name: 'Fantasy', bookIds: ids('coauthored'), parentId: null, collapsed: false, sortIndex: 1,
      pinned: true, childFolderIds: ['f-saga'] },
    { id: 'f-saga', name: 'The Test Saga', bookIds: ids('saga1', 'saga2', 'saga25', 'saga3'), parentId: 'f-fantasy',
      collapsed: false, sortIndex: 0 },
    { id: 'f-scifi', name: 'Science Fiction', bookIds: ids('hidden', 'nodesc', 'coauthored'), parentId: null, collapsed: false,
      sortIndex: 2, childFolderIds: ['f-space'] },
    { id: 'f-space', name: 'Space Opera', bookIds: [], parentId: 'f-scifi', collapsed: true, sortIndex: 0,
      childFolderIds: ['f-old'] },
    { id: 'f-old', name: 'Old Favorites', bookIds: ids('deep', 'noted'), parentId: 'f-space', collapsed: false, sortIndex: 0 },
    { id: 'f-kinds', name: 'Every Ownership Kind', bookIds: kindIds, parentId: null, collapsed: false, sortIndex: 3 },
    { id: 'f-empty', name: 'An Empty Folder', bookIds: [], parentId: null, collapsed: false, sortIndex: 4 },
];

const bookLists = [
    { id: 'bl-next', name: 'Read Next', bookIds: ids('saga3', 'deep', 'own_wishlist'), position: 0 },
    { id: 'bl-empty', name: 'An Empty Book List', bookIds: [], position: 1 },
];

const tagCounts = {};
for (const b of Object.values(B)) for (const t of b.tags) tagCounts[t] = (tagCounts[t] || 0) + 1;
const tagRegistry = {
    'read': { label: 'Read', count: tagCounts['read'] || 0, order: 0 },
    'favorites': { label: 'Favorites', count: tagCounts['favorites'] || 0, order: 1 },
    'to-read': { label: 'To Read', count: tagCounts['to-read'] || 0, order: 2 },
};

const savedSearches = [
    { id: 'ss-saga', name: 'The Saga', filters: { search: 'Test Saga' }, position: 0 },
    { id: 'ss-read', name: 'Tagged Read', filters: { tags: ['read'] }, position: 1 },
];

const items = Object.values(B).map(packBook);
const fixture = {
    schemaVersion: '2.4',
    isBackup: true,
    books: { fetchDate: new Date(NOW).toISOString(), fetcherVersion: 'test-fixture', totalBooks: items.length, items },
    organization: {
        savedAt: NOW,
        blankImageBooks: [],
        folders,
        bookLists,
        explorerSettings: {},
        exportDate: new Date(NOW).toISOString(),
        tagRegistry,
        savedSearches,
        hiddenInstances: [],
        appVersion: 'test-fixture',
    },
    relay: {},
    collections: {
        fetchDate: new Date(NOW).toISOString(), fetcherVersion: 'test-fixture',
        totalBooksScanned: 3, booksWithCollections: 2,
        items: [
            { asin: B.saga1.asin, readStatus: 'READ', collections: ['Favorites'] },
            { asin: B.saga2.asin, readStatus: 'READ', collections: [] },
            { asin: B.saga3.asin, readStatus: 'UNREAD', collections: ['To Read Soon'] },
        ],
    },
};

// Every filed book is in exactly the folders above; every live book is somewhere (a legitimate library).
const filed = new Set(folders.flatMap(f => f.bookIds));
const homeless = Object.values(B).filter(b => !b.isDeleted && !filed.has(b.asin)).map(b => b.title);
if (homeless.length) throw new Error('fixture has books in no folder (a damaged state): ' + homeless.join(', '));

const out = path.join(__dirname, 'small-fixture.json');
fs.writeFileSync(out, JSON.stringify(fixture, null, 1) + '\n');
console.log(`small-fixture.json: ${items.length} books, ${folders.length} folders, ${bookLists.length} Book Lists, ` +
    `${savedSearches.length} Searches, ${Object.keys(tagRegistry).length} tags`);
