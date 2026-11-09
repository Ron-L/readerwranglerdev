// backupCheck.js — 7.26.0
// What Restore needs from a backup file — checked all at once, so the message names EVERY problem (Ron, 2026-11-08:
// never refuse at the first one and make the person fix them one at a time). Ron's rules: Restore replaces everything
// but the Cloud Sync credentials (those merge only after asking); a part that's missing or empty restores as EMPTY,
// never as "keep what's here"; a backup is refused only when that would leave the library unusable, or when a part is
// there but isn't the right kind. Checks the parts, not the items inside them (TODO "Restore checks every book, folder
// and list inside a backup…"). Pure: loaded as a classic <script> (functions become global, like uiHelpers.js) and
// require()-able in Node for unit tests (test/backupCheck.test.js).

const _isTable = (v) => v !== null && typeof v === 'object' && !Array.isArray(v);
const _absent = (v) => v === undefined || v === null;
const _org = (f) => (_isTable(f.organization) ? f.organization : {});
const _booksCarryTags = (f) => {
    const items = f.books && f.books.items;
    return Array.isArray(items) && items.some(b => b && Array.isArray(b.tags) && b.tags.length > 0);
};

// THE list of a backup's parts. `words`: what a person reads. `needed(file)`: a missing one is a problem. `orgKey` +
// `empty`: an organization part that restores as `empty` when the backup doesn't have it.
const BACKUP_PARTS = [
    { words: 'its version stamp', get: f => f.schemaVersion, ok: v => typeof v === 'string' && v.startsWith('2.'),
      needed: () => true },
    { words: 'its list of books', get: f => (_isTable(f.books) ? f.books.items : undefined), ok: Array.isArray,
      needed: () => true },
    { words: 'its organization', get: f => f.organization, ok: _isTable },
    { words: 'its folders', orgKey: 'folders', empty: () => [], ok: Array.isArray },
    { words: 'its Book Lists', orgKey: 'bookLists', empty: () => [], ok: Array.isArray },
    { words: 'its Searches', orgKey: 'savedSearches', empty: () => [], ok: Array.isArray },
    // without it, the books' tags vanish from the tag filter and the right-click Tags menu (both are built from it)
    { words: 'its tag list', orgKey: 'tagRegistry', empty: () => ({}), ok: _isTable, needed: _booksCarryTags },
    { words: 'its list of blank covers', orgKey: 'blankImageBooks', empty: () => [], ok: Array.isArray },
    { words: 'its view settings', orgKey: 'explorerSettings', ok: _isTable },
    { words: 'its collections', get: f => f.collections, ok: v => _isTable(v) && Array.isArray(v.items) },
    { words: 'its Cloud Sync credentials', get: f => f.relay, ok: _isTable },
];
const _value = (part, f) => (part.orgKey ? _org(f)[part.orgKey] : part.get(f));

// Every problem with a parsed backup, in the list's order: [{ words, issue: 'missing' | 'unreadable' }] ([] = fine).
const backupProblems = (file) => {
    const f = _isTable(file) ? file : {};
    const problems = [];
    for (const part of BACKUP_PARTS) {
        const v = _value(part, f);
        if (_absent(v)) {
            if (part.needed && part.needed(f)) problems.push({ words: part.words, issue: 'missing' });
        } else if (!part.ok(v)) {
            problems.push({ words: part.words, issue: 'unreadable' });
        }
    }
    return problems;
};

// The organization a restore applies: the backup's own, with every missing part as its empty value. A new object —
// the file is never changed; parts the list doesn't know are kept as they are.
const backupOrganization = (file) => {
    const org = { ..._org(_isTable(file) ? file : {}) };
    for (const part of BACKUP_PARTS) {
        if (part.orgKey && part.empty && _absent(org[part.orgKey])) org[part.orgKey] = part.empty();
    }
    return org;
};

// "a", "a and b", "a, b and c"
const _listWords = (ws) => (ws.length <= 1 ? ws.join('') : `${ws.slice(0, -1).join(', ')} and ${ws[ws.length - 1]}`);

// The refusal a person reads — every problem named at once.
const backupRefusalText = (problems) => {
    const missing = problems.filter(p => p.issue === 'missing').map(p => p.words);
    const unreadable = problems.filter(p => p.issue === 'unreadable').map(p => p.words);
    const clauses = [];
    if (missing.length) clauses.push(`it's missing ${_listWords(missing)}`);
    if (unreadable.length) clauses.push(`${_listWords(unreadable)} ${unreadable.length > 1 ? "aren't" : "isn't"} readable`);
    return `This backup can't be restored: ${clauses.join(', and ')}. Nothing was changed.\n\nChoose a backup made with File → Save Backup.`;
};

// Node export for unit tests (no-op in the browser classic-script context).
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { BACKUP_PARTS, backupProblems, backupOrganization, backupRefusalText };
}
