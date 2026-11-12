// Function tests for gestureTable.js — "the one table" (docs/design/ONE-TABLE.md). Run: node test/gestureTable.test.js
// tags: delete, gestures, folders, tier 1
// covers: gestureTable.js
// 7.28.1: the Delete rows (TODO id 20261014-1030ay). Like bookFields.js's table: every combination must have a row, so a
// new kind of place can't be added without saying what Delete does there. The screen side: test/ui/test_delete_key.py.
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
    'say', 'nothing'];

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

test('TABLE-003', 'the decided order: books first, then the selected folders, then nothing', () => {
    assert.strictEqual(t.deleteWhat(2, 3), 'books');
    assert.strictEqual(t.deleteWhat(0, 3), 'folders');
    assert.strictEqual(t.deleteWhat(0, 0), 'nothing');
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
    assert.throws(() => t.decide('paste', 'books', { placeId: 'f-a', focus: 'right' }), /no rows for the gesture "paste"/);
});

done();
