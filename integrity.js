// integrity.js - Data integrity checks for ReaderWrangler
// v6.3.0 - Initial implementation
// Depends on: nothing (pure functions + localStorage)

const INTEGRITY_KEY = 'readerwrangler-integrity';

// Run all integrity checks against current books + folders.
// Pure function — no side effects, no state access.
// Returns:
//   correctedFolders: updated folder array with auto-fixable issues applied
//   autoFixed:        array of { type, description, books: [{id, title}] }
//   needsReview:      array of { type, description, ... }
//   checkedAt:        timestamp (ms)
const checkDataIntegrity = (books, folders) => {
    const autoFixed = [];
    const needsReview = [];

    // Deep-copy folder array so we can mutate safely
    let correctedFolders = folders.map(f => ({ ...f, bookIds: [...(f.bookIds || [])] }));

    // Build map of active (non-deleted) books
    const activeBookMap = new Map(
        books.filter(b => !b.isDeleted).map(b => [b.id, b])
    );

    // ── Check 1: Ghost folder references ─────────────────────────────────────
    // bookIds in folders that point to non-existent or deleted books
    let ghostTotal = 0;
    correctedFolders = correctedFolders.map(folder => {
        const valid = folder.bookIds.filter(id => activeBookMap.has(id));
        const removed = folder.bookIds.length - valid.length;
        if (removed > 0) {
            ghostTotal += removed;
            return { ...folder, bookIds: valid };
        }
        return folder;
    });
    if (ghostTotal > 0) {
        autoFixed.push({
            type: 'ghost-ref',
            description: `${ghostTotal} missing book reference${ghostTotal !== 1 ? 's' : ''} removed from folders`,
            books: []
        });
    }

    // ── Check 2: Duplicate bookId refs within a single folder ─────────────────
    let dupeRefTotal = 0;
    correctedFolders = correctedFolders.map(folder => {
        const seen = new Set();
        const deduped = folder.bookIds.filter(id => {
            if (seen.has(id)) { dupeRefTotal++; return false; }
            seen.add(id);
            return true;
        });
        return deduped.length !== folder.bookIds.length ? { ...folder, bookIds: deduped } : folder;
    });
    if (dupeRefTotal > 0) {
        autoFixed.push({
            type: 'duplicate-ref',
            description: `${dupeRefTotal} duplicate folder reference${dupeRefTotal !== 1 ? 's' : ''} removed`,
            books: []
        });
    }

    // ── Check 3: Homeless books ───────────────────────────────────────────────
    // Non-deleted books with no folder membership (design invariant: always in ≥1 folder)
    const referencedIds = new Set(correctedFolders.flatMap(f => f.bookIds));
    const homeless = [...activeBookMap.values()].filter(b => !referencedIds.has(b.id));
    if (homeless.length > 0) {
        const inboxIdx = correctedFolders.findIndex(f => f.id === '__inbox__');
        if (inboxIdx !== -1) {
            const homelessIds = homeless.map(b => b.id);
            correctedFolders[inboxIdx] = {
                ...correctedFolders[inboxIdx],
                bookIds: [...homelessIds, ...correctedFolders[inboxIdx].bookIds]
            };
        }
        autoFixed.push({
            type: 'homeless',
            description: `${homeless.length} book${homeless.length !== 1 ? 's' : ''} with no folder — placed in Inbox`,
            books: homeless.map(b => ({ id: b.id, title: b.title, author: b.author || '' }))
        });
    }

    // ── Check 4: Corrupted book objects (missing required fields) ─────────────
    // Cannot auto-fix — surface for review
    const corrupted = books.filter(b => !b.id || !b.asin || !b.title);
    if (corrupted.length > 0) {
        needsReview.push({
            type: 'corrupted',
            description: `${corrupted.length} book record${corrupted.length !== 1 ? 's' : ''} with missing required fields`,
            books: corrupted.map(b => ({ id: b.id || '(none)', title: b.title || '(no title)' }))
        });
    }

    // Note: duplicate ASINs (same book, multiple objects) are already detected and
    // surfaced by the existing Duplicates section in Data Status. Not duplicated here.

    return { correctedFolders, autoFixed, needsReview, checkedAt: Date.now() };
};

// Persist integrity results to localStorage (replaces previous results entirely)
const saveIntegrityResults = ({ autoFixed, needsReview, checkedAt }) => {
    try {
        localStorage.setItem(INTEGRITY_KEY, JSON.stringify({ autoFixed, needsReview, checkedAt }));
    } catch (e) {
        rwLog.log('warning', 'INTEG-07', 'Could not save the integrity check\'s results (storage full?)', { error: String(e) });
    }
};

// Load persisted integrity results. Returns null if none saved or parse fails.
// Caller should NOT clear previous results on check failure (per design).
const loadIntegrityResults = () => {
    try {
        const saved = localStorage.getItem(INTEGRITY_KEY);
        return saved ? JSON.parse(saved) : null;
    } catch (e) {
        return null;
    }
};
