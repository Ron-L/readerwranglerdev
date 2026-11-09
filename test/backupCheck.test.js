// Unit tests for Restore's backup check (backupCheck.js, 7.26.0) — run: node test/backupCheck.test.js
// tags: restore, backup, tier 1
// covers: backupCheck.js
// Ron's rules (2026-11-08): Restore replaces everything but the Cloud Sync credentials; a part that's missing or empty
// restores as empty; a backup is refused only when that would leave the library unusable, or when a part is there but
// isn't the right kind — and the message names EVERY problem at once, never one at a time.
const assert = require('assert');
const fs = require('fs');
const path = require('path');
const { backupProblems, backupOrganization, backupRefusalText } = require('../backupCheck.js');

const { test: t, done } = require('./harness');
const ROOT = path.join(__dirname, '..');
const readJson = (rel) => JSON.parse(fs.readFileSync(path.join(ROOT, rel), 'utf8'));
const words = (problems) => problems.map(p => `${p.issue}: ${p.words}`);
const book = (asin, extra) => ({ asin, title: 'A Book', ...extra });

console.log('backupCheck');

t('BCHK-001', "a backup today's Save Backup writes has no problems (the test fixture)", () => {
    assert.deepStrictEqual(backupProblems(readJson('test/fixtures/small-fixture.json')), []);
});

t('BCHK-002', 'every problem is found at once, in one list — not just the first', () => {
    assert.deepStrictEqual(words(backupProblems({ isBackup: true })),
        ['missing: its version stamp', 'missing: its list of books']);
});

t('BCHK-003', "a part that's there but not the right kind is named as unreadable, beside the missing ones", () => {
    const file = { isBackup: true, books: { items: {} },
                   organization: { folders: 'x', bookLists: 3, savedSearches: [], tagRegistry: {} } };
    assert.deepStrictEqual(words(backupProblems(file)),
        ['missing: its version stamp', 'unreadable: its list of books', 'unreadable: its folders', 'unreadable: its Book Lists']);
});

t('BCHK-004', 'the tag list is needed only when a book carries a tag (else its tags would vanish from the filter)', () => {
    const base = { isBackup: true, schemaVersion: '2.4', organization: {} };
    assert.deepStrictEqual(backupProblems({ ...base, books: { items: [book('A1'), book('A2', { tags: [] })] } }), []);
    assert.deepStrictEqual(words(backupProblems({ ...base, books: { items: [book('A1', { tags: ['sci-fi'] })] } })),
        ['missing: its tag list']);
    // a tag list that's there is checked for its kind whether or not a book has a tag
    assert.deepStrictEqual(words(backupProblems({ ...base, books: { items: [] }, organization: { tagRegistry: [] } })),
        ['unreadable: its tag list']);
});

t('BCHK-005', 'the version stamp must be a 2.x one', () => {
    const file = (v) => ({ isBackup: true, schemaVersion: v, books: { items: [] } });
    assert.deepStrictEqual(backupProblems(file('2.4')), []);
    assert.deepStrictEqual(words(backupProblems(file('1.0'))), ['unreadable: its version stamp']);
    assert.deepStrictEqual(words(backupProblems(file(2))), ['unreadable: its version stamp']);
});

t('BCHK-006', 'optional parts may be missing, but if present must be the right kind (collections, view settings, credentials)', () => {
    const base = { isBackup: true, schemaVersion: '2.4', books: { items: [] } };
    assert.deepStrictEqual(backupProblems(base), []);
    assert.deepStrictEqual(words(backupProblems({ ...base, collections: { fetchDate: 'x' } })), ['unreadable: its collections']);
    assert.deepStrictEqual(words(backupProblems({ ...base, organization: { explorerSettings: 'wide' } })),
        ['unreadable: its view settings']);
    assert.deepStrictEqual(words(backupProblems({ ...base, relay: 'abc' })), ['unreadable: its Cloud Sync credentials']);
    assert.deepStrictEqual(words(backupProblems({ ...base, organization: 'x' })), ['unreadable: its organization']);
});

t('BCHK-007', 'a missing part restores as EMPTY, never as "keep what is here" (Restore replaces; only the credentials merge)', () => {
    const org = backupOrganization({ isBackup: true, schemaVersion: '2.4', books: { items: [] } });
    assert.deepStrictEqual(org.folders, []);
    assert.deepStrictEqual(org.bookLists, []);
    assert.deepStrictEqual(org.savedSearches, []);
    assert.deepStrictEqual(org.tagRegistry, {});
    assert.deepStrictEqual(org.blankImageBooks, []);
});

t('BCHK-008', 'parts that are there are kept exactly as they are — including ones the check does not know', () => {
    const organization = { folders: [{ id: 'f1', name: 'F', bookIds: ['A1'], parentId: null }], bookLists: [],
                           theme: 'dark', exportDate: '2026-11-08', somethingNew: { x: 1 } };
    const org = backupOrganization({ isBackup: true, schemaVersion: '2.4', books: { items: [] }, organization });
    assert.deepStrictEqual(org.folders, organization.folders);
    assert.strictEqual(org.theme, 'dark');
    assert.deepStrictEqual(org.somethingNew, { x: 1 });
    assert.deepStrictEqual(org.savedSearches, []);           // (the missing one, empty)
    assert.notStrictEqual(org, organization);                 // a new object; the file is never changed
    assert.strictEqual(organization.savedSearches, undefined);
});

t('BCHK-009', 'the message names every problem in plain words, and says nothing was changed', () => {
    const text = backupRefusalText([
        { words: 'its list of books', issue: 'missing' },
        { words: 'its folders', issue: 'unreadable' },
        { words: 'its Book Lists', issue: 'unreadable' },
    ]);
    assert.strictEqual(text, "This backup can't be restored: it's missing its list of books, and its folders and its Book Lists " +
        "aren't readable. Nothing was changed.\n\nChoose a backup made with File → Save Backup.");
    assert.ok(backupRefusalText([{ words: 'a', issue: 'missing' }, { words: 'b', issue: 'missing' }, { words: 'c', issue: 'missing' }])
        .includes("it's missing a, b and c."));
    assert.ok(backupRefusalText([{ words: 'its folders', issue: 'unreadable' }]).includes("its folders isn't readable."));
});

t('BCHK-010', 'the public demo library (saved before Book Lists and Searches existed) restores — those become none', () => {
    const demo = readJson('readerwrangler-demo-library.json');
    assert.deepStrictEqual(backupProblems(demo), []);
    assert.deepStrictEqual(backupOrganization(demo).bookLists, []);
    assert.deepStrictEqual(backupOrganization(demo).savedSearches, []);
});

done();
