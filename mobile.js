// mobile.js — ReaderWrangler Mobile Viewer
// MOBILE_VERSION tracks mobile-specific iterations
const MOBILE_VERSION = '1.10.2'; // suffix mirrors ORGANIZER_VERSION's -alpha.N in any alpha commit touching this file (Ron, 2026-08-30: invisible changes + no build marker = guaranteed mystery)
console.log(`✅ Mobile viewer ${MOBILE_VERSION} | APP_VERSION: ${APP_VERSION}`);

// v1.7.0 - Which server is this copy talking to? Derived from the page's own address, so an
// installed app inherits the answer from wherever it was installed — which is the whole point
// (the installed-PWA-was-dev hunt, 2026-08-30). Prod stays unbadged; oddballs announce themselves.
const SERVER_ENV = (() => {
    const h = location.hostname;
    // v1.8.4 (Ron) - chip says DEV/LOCAL for BOTH non-prod builds: the reminder that localhost and
    // the dev site share one relay worker + storage (the label below still names the exact build).
    // v1.10.0 (7.21.0 contributor mode) - asks the environment answers defined once in readerwrangler.html. The chip
    // is the phone's FAIL-SAFE badge, matching the desktop: "LOCAL · CONTRIBUTOR" (dev relay) vs plain "LOCAL"
    // (a self-hoster — production relay); the dev site says "DEV". Any other address behaves like production.
    if (isContributor()) return { label: `Local copy (${h}) — contributor mode`, chip: 'LOCAL · CONTRIBUTOR' };
    if (isLocalServer()) return { label: `Local copy (${h})`, chip: 'LOCAL' };
    if (isDevSite()) return { label: 'Dev site (readerwranglerdev)', chip: 'DEV' };
    if (h === 'readerwrangler.com' || h === 'www.readerwrangler.com') return { label: 'readerwrangler.com', chip: null };
    return { label: h, chip: null };
})();

// v1.8.3 - Dev environments talk to the DEV relay worker (isolated KV namespace) — MIRRORS the
// desktop app (readerwrangler.js) and the nav-hub bookmarklet, which mobile.js had silently NOT
// mirrored: the badge above told the truth about the build while the relay underneath always read
// PROD, so a dev/localhost phone could never see dev-relay data (found 2026-09-15: dev build on
// phone still showed prod org). relay-client.js reads this override before its built-in prod URL.
// v1.10.0 (7.21.0) - contributor-based, matching the desktop: a self-hoster's phone reads the PRODUCTION relay.
(() => {
    if ((isContributor() || isDevSite()) && window._RW_RELAY_WORKER_URL === undefined) {
        window._RW_RELAY_WORKER_URL = 'https://readerwrangler-relay-dev.readerwrangler.workers.dev';
        console.log(`🔧 DEV environment: relay → dev worker (${window._RW_RELAY_WORKER_URL})`);
    }
})();
// v1.8.4 - Which relay store this build actually reads (the hidden var made visible). Dev/localhost
// share the dev worker+storage; prod reads prod. Shown on the About panel so "where is my data" is
// answerable, not deduced.
const RELAY_IS_DEV = !!window._RW_RELAY_WORKER_URL && window._RW_RELAY_WORKER_URL.includes('-dev');

// Clear emergency reset timer — app code loaded successfully
if (window._appMountTimer) { clearTimeout(window._appMountTimer); window._appMountTimer = null; }

const { useState, useEffect, useCallback, useMemo, useRef } = React;

const MOBILE_PREFS_KEY = 'readerwrangler-mobile-prefs';
const NAV_STACK_KEY = 'readerwrangler-mobile-nav';
const SHELF_LIMIT = 20;

// Inject mobile-only styles (hidden scrollbar for shelf containers, folder tile theme colors)
if (!document.getElementById('mobile-styles')) {
    const style = document.createElement('style');
    style.id = 'mobile-styles';
    style.textContent = [
        '.shelf-scroll::-webkit-scrollbar { display: none }',
        'body { overflow: auto !important; }',
        ':root { --folder-tile-bg: #fffbeb; --folder-tile-border: #fde68a; --cover-border: none; --label-bar-bg: #fffbeb; --label-bar-border: #fde68a; }',
        '[data-theme="dark"] { --folder-tile-bg: #422006; --folder-tile-border: #5c4a2a; --cover-border: 1px solid rgba(255,255,255,0.1); --label-bar-bg: #422006; --label-bar-border: #92400e; }',
        '[data-theme="hc-light"] { --folder-tile-bg: #fffbeb; --folder-tile-border: #d97706; --cover-border: none; }',
        '[data-theme="hc-dark"] { --folder-tile-bg: #451a03; --folder-tile-border: #b45309; --cover-border: 1px solid rgba(255,255,255,0.15); }'
    ].join('\n');
    document.head.appendChild(style);
}

// --- Backup import helpers ---

// v1.9.0 (one-table 7.17.0): the hand-kept mapBackupBook is GONE — mobile now deserializes wire
// items through the SAME shared unpacker as desktop: unpackBook(item, { safeDefaults: true })
// (bookFields.js, a global here). `safeDefaults` fills the fields mobile renders straight off the
// book (tags:[], userEdited:{}, coverUrl:'') so nothing hits undefined.map(). readStatus/collections
// aren't on the book wire item (they ride a separate section) — the load path defaults + merges them.
// See docs/design/BOOK-FIELDS-TABLE.md. The one wire-name mobile rendered directly (reviewCount) is
// now the desktop app-name (ratingCount); the dead priceAsOf/genresAsOf quirks are dropped.

function restoreOrganization(org, bookIds, sourceStamp, sourceGen) {
    if (!org) return;

    let folders = org.folders || [];
    const validIds = new Set(bookIds);

    if (!folders.some(f => f.id === '__inbox__')) {
        folders.push({ id: '__inbox__', name: 'Inbox', bookIds: [], parentId: null });
    }

    // v1.7.0-alpha.6 - Deny-list spread (MULTI-INSTANCE.md §3): the old allow-list field map
    // STRIPPED sortIndex (and isInbox/description/future pinned) — on a dev machine sharing the
    // address with desktop, this was the folder-order scrambler (the 2026-08-15/08-30 ghost).
    folders = folders.map(f => ({
        ...f,
        bookIds: (f.bookIds || []).filter(id => validIds.has(id))
    }));

    // v6.12.0 Phase 8 - Book Lists (curated, supplemental). Filter each list's bookIds to books
    // that actually exist, mirroring how folder bookIds are guarded above.
    const bookLists = (org.bookLists || []).map(bl => ({
        ...bl,
        bookIds: (bl.bookIds || []).filter(id => validIds.has(id))
    }));

    // v1.8.0-alpha.1 (F1 consolidation) - The blob below is the SINGLE folder store; the
    // legacy FOLDERS_KEY write is gone (readCachedFolders() falls back to it read-only
    // for caches written before this release).
    localStorage.setItem(STORAGE_KEY, JSON.stringify({
        organization: {
            folders: folders,
            tagRegistry: org.tagRegistry || {},
            hiddenInstances: org.hiddenInstances || [],
            blankImageBooks: org.blankImageBooks || [],
            pinnedTagFolders: org.pinnedTagFolders || [],
            bookLists: bookLists, // v6.12.0 Phase 8 - curated lists (rendered as shelves + drawer)
            savedSearches: org.savedSearches || [], // v6.12.0 Phase 8 - listed in drawer; results wired in 8b
            folderListSort: (org.explorerSettings && org.explorerSettings.folderListSort) || null, // v1.7.0-alpha.13 - folder-tree sort mode (order mirror)
            dataSource: 'enriched'
        },
        // v1.7.0-alpha.6 - Re-stamp with the payload's SOURCE stamp, never Date.now() (MULTI-INSTANCE.md
        // §3): a wall-clock stamp here would exceed every later payload's source stamp and freeze the
        // phone's cache. One clock lineage (the desktop's) keeps the guard comparison monotone.
        lastSyncTime: sourceStamp || Date.now(),
        savedAt: sourceStamp || Date.now(),
        // v1.7.1 - WHICH generation this cache came from: freshness is gen identity, not a
        // timestamp race (the save stamp is always older than the push's gen time by the
        // debounce gap — comparing them made the banner nag forever on a fully-synced phone)
        deviceStateGen: sourceGen || null
    }));

    return folders;
}

// v1.8.0-alpha.1 (F1 consolidation) - Single read path for the cached folder tree:
// blob first, legacy FOLDERS_KEY only as a migration fallback for pre-1.8 caches.
function readCachedFolders() {
    try {
        const org = (JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').organization) || {};
        if (Array.isArray(org.folders) && org.folders.length > 0) return org.folders;
    } catch (e) {}
    try { return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]'); } catch (e) { return []; }
}

// --- SVG Icons (inline, no external deps) ---

const IconHamburger = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="3" y1="6" x2="21" y2="6" /><line x1="3" y1="12" x2="21" y2="12" /><line x1="3" y1="18" x2="21" y2="18" />
    </svg>
);
const IconSearch = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
);
const IconDots = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="12" cy="5" r="2" /><circle cx="12" cy="12" r="2" /><circle cx="12" cy="19" r="2" />
    </svg>
);
const IconClose = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);
const IconFolder = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);
const IconCheck = () => (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IconBack = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="15 18 9 12 15 6" />
    </svg>
);
const IconFolderLarge = () => (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
    </svg>
);

// --- Star rating system ---

const STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z';

const StarDefs = () => (
    <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
            <clipPath id="m-star-clip-left"><rect x="0" y="0" width="12" height="24" /></clipPath>
            <clipPath id="m-star-clip-right"><rect x="12" y="0" width="12" height="24" /></clipPath>
        </defs>
    </svg>
);

const StarSVG = ({ type = 'full', size = 16, color = 'var(--star-color, #eab308)' }) => {
    const emptyColor = 'var(--border-strong, #cbd5e1)';
    if (type === 'half') {
        return (
            <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
                <path d={STAR_PATH} fill={color} clipPath="url(#m-star-clip-left)" />
                <path d={STAR_PATH} fill="none" stroke={emptyColor} strokeWidth="1.5" clipPath="url(#m-star-clip-right)" />
                <path d={STAR_PATH} fill="none" stroke={color} strokeWidth="0.5" clipPath="url(#m-star-clip-left)" />
            </svg>
        );
    }
    return (
        <svg width={size} height={size} viewBox="0 0 24 24" style={{ display: 'inline-block', verticalAlign: 'middle' }}>
            <path d={STAR_PATH}
                fill={type === 'full' ? color : 'none'}
                stroke={type === 'full' ? color : emptyColor}
                strokeWidth={type === 'full' ? '0.5' : '1.5'}
            />
        </svg>
    );
};

const renderStars = (rating, { size = 16, color = 'var(--star-color, #eab308)' } = {}) => {
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;
    const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
    return (
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '1px' }}>
            {Array.from({ length: fullStars }, (_, i) => <StarSVG key={`f${i}`} type="full" size={size} color={color} />)}
            {hasHalfStar && <StarSVG key="h" type="half" size={size} color={color} />}
            {Array.from({ length: emptyStars }, (_, i) => <StarSVG key={`e${i}`} type="empty" size={size} color={color} />)}
        </span>
    );
};

// --- Helper functions ---

function parseBookDate(dateStr) {
    if (!dateStr) return new Date(0);
    const ts = typeof dateStr === 'string' ? parseInt(dateStr) : dateStr;
    if (!isNaN(ts) && ts > 1000000000) {
        return new Date(ts > 9999999999 ? ts : ts * 1000);
    }
    const d = new Date(dateStr);
    return isNaN(d.getTime()) ? new Date(0) : d;
}

function filterBooks(books, { showDealsOnly, showHidden }) {
    return books.filter(book => {
        if (!showHidden && book.isHidden) return false;
        if (showDealsOnly) {
            if (book.priceTrigger == null || book.currentPrice == null) return false;
            if (book.currentPrice > book.priceTrigger) return false;
        }
        return true;
    });
}

const SORT_OPTIONS = [
    { key: 'manual', label: 'Manual Order' },
    { key: 'dateAdded', label: 'Date Added' },
    { key: 'titleAZ', label: 'Title A-Z' },
    { key: 'authorAZ', label: 'Author A-Z' },
    { key: 'rating', label: 'Rating' }
];

function sortBooks(books, sortKey) {
    if (sortKey === 'manual') return books; // Preserve folder.bookIds / bookOrder array order
    // v1.7.0-alpha.4 - Universal deterministic tiebreak, IDENTICAL to desktop's (ratified: reading
    // order beats dictionary order — a same-day batch is usually one series). Both surfaces now
    // produce byte-identical order for the same data; ties are never left to array order again.
    // (Infinity - Infinity is NaN, which is falsy, so the || chain skips it.)
    const tiebreak = (a, b) =>
        (a.author || '').localeCompare(b.author || '')
        || (a.series || '').localeCompare(b.series || '')
        || ((parseFloat(a.seriesPosition) || Infinity) - (parseFloat(b.seriesPosition) || Infinity))
        || (a.title || '').localeCompare(b.title || '')
        || (a.asin || '').localeCompare(b.asin || '');
    return [...books].sort((a, b) => {
        let c = 0;
        switch (sortKey) {
            case 'titleAZ': c = a.title.localeCompare(b.title); break;
            case 'authorAZ': c = a.author.localeCompare(b.author); break;
            case 'rating': c = (b.rating || 0) - (a.rating || 0); break;
            case 'dateAdded':
            // v1.7.0 - Date Added now MEANS date added: dateAdded first (the wire carries it as of
            // app 7.6.0), acquisition date only as fallback for stale payloads. The old
            // `acquired || dateAdded` made acquisition win under the Date Added label, and wishlist
            // books (never acquired) sank to the bottom of every date sort.
            // v1.9.0 - the addedToWishlist fallback (wishlist books never acquired) used to live in
            // mapBackupBook's dateAdded; unpackBook keeps dateAdded literal, so it moves here — the sole
            // consumer — preserving the wishlist date-added sort.
            default: c = parseBookDate(b.dateAdded || b.acquired || b.addedToWishlist) - parseBookDate(a.dateAdded || a.acquired || a.addedToWishlist);
        }
        return c || tiebreak(a, b);
    });
}

// v1.7.0-alpha.13 - Mirror of desktop's folder ordering (FOLDER-ORDERING.md: "mobile mirrors the
// app's order, pins included"): pinned folders float above the active sort in their stored manual
// order; Manual = sortIndex (root) / parent's childFolderIds (nested) with name tiebreak; Name = A-Z.
// listSort (the desktop folder-tree sort mode) rides the device-state push; default Manual.
function orderedChildFolders(allFolders, parentId, listSort) {
    const children = allFolders.filter(f => (f.parentId || null) === (parentId || null));
    const parentFolder = parentId ? allFolders.find(f => f.id === parentId) : null;
    const orderMap = new Map(((parentFolder && parentFolder.childFolderIds) || []).map((id, i) => [id, i]));
    const manualCmp = parentId
        ? (a, b) => {
            const pa = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
            const pb = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
            return pa !== pb ? pa - pb : a.name.localeCompare(b.name);
        }
        : (a, b) => {
            const ia = a.sortIndex ?? Infinity;
            const ib = b.sortIndex ?? Infinity;
            return ia !== ib ? ia - ib : a.name.localeCompare(b.name);
        };
    const pinned = children.filter(f => f.pinned).sort(manualCmp);
    const rest = children.filter(f => !f.pinned);
    if (listSort && listSort.column === 'title') {
        const dir = listSort.direction === 'desc' ? -1 : 1;
        rest.sort((a, b) => dir * a.name.localeCompare(b.name));
    } else if (listSort && listSort.column === 'count') {
        // v1.7.0-alpha.14 (wave D mirror) - Count = total incl. subfolders, same as desktop
        const byParent = new Map();
        allFolders.forEach(f => { const p = f.parentId || null; if (!byParent.has(p)) byParent.set(p, []); byParent.get(p).push(f); });
        const totals = new Map();
        const totalOf = (f) => {
            if (totals.has(f.id)) return totals.get(f.id);
            let t = (f.bookIds || []).length;
            for (const c of (byParent.get(f.id) || [])) t += totalOf(c);
            totals.set(f.id, t);
            return t;
        };
        const dir = (listSort.direction === 'asc') ? 1 : -1;
        rest.sort((a, b) => dir * (totalOf(a) - totalOf(b)) || a.name.localeCompare(b.name));
    } else {
        rest.sort(manualCmp);
    }
    return [...pinned, ...rest];
}

// v6.12.0 Phase 8b - Saved Search matcher. Ported from desktop bookMatchesFilters so a Search (saved
// filter preset) can be applied to the whole library on mobile. Mobile book objects use the same field
// names as desktop (author, acquired, series, tags, collections, ratings, ownership) after the
// collections/readStatus merge in loadAllData, so no field remapping is needed.
function bookMatchesFilters(book, filters) {
    if (!book || !filters) return false;

    if (filters.search) {
        const term = filters.search.toLowerCase();
        if (!(book.title || '').toLowerCase().includes(term) &&
            !(book.author || '').toLowerCase().includes(term)) return false;
    }
    if (filters.readStatus && book.readStatus !== filters.readStatus) return false;

    if (filters.collections?.length > 0) {
        const hasUncollected = filters.collections.includes('UNCOLLECTED');
        const otherCollections = filters.collections.filter(c => c !== 'UNCOLLECTED');
        const bookCollections = book.collections || [];
        const isInCollection = otherCollections.some(c => bookCollections.some(bc => bc.name === c));
        const isUncollected = bookCollections.length === 0;
        if (!((hasUncollected && isUncollected) || isInCollection)) return false;
    }
    if (filters.minAmazonRating &&
        (book.rating === undefined || book.rating < parseFloat(filters.minAmazonRating))) return false;
    if (filters.minMyRating) {
        if (filters.minMyRating === 'unrated') {
            if ((book.myRating || 0) !== 0) return false;
        } else {
            if ((book.myRating || 0) < parseFloat(filters.minMyRating)) return false;
        }
    }
    if (filters.ownership) {
        if (filters.ownership === 'wishlist') {
            if (!isWishlisted(book)) return false;
        } else if (filters.ownership === 'orphan') {
            if (book.orphanStatus !== 'orphan') return false;
        } else {
            if ((book.ownershipType || 'purchased') !== filters.ownership) return false;
        }
    }
    if (filters.series?.length > 0) {
        const hasNotInSeries = filters.series.includes('NOT_IN_SERIES');
        const otherSeries = filters.series.filter(s => s !== 'NOT_IN_SERIES');
        const bookSeries = book.series || '';
        const isInSeries = otherSeries.includes(bookSeries);
        const isNotInSeries = !bookSeries || bookSeries.trim() === '';
        if (!((hasNotInSeries && isNotInSeries) || isInSeries)) return false;
    }
    if (filters.datePreset || filters.dateFrom || filters.dateTo) {
        let fromDate = filters.dateFrom || '';
        let toDate = filters.dateTo || '';
        const range = datePresetRange(filters.datePreset); // v7.21.2 - the shared presets (uiHelpers.js)
        if (range) { fromDate = range.from; toDate = range.to; }
        if (fromDate || toDate) {
            if (!book.acquired) return false;
            const bookDate = parseBookDate(book.acquired).toISOString().split('T')[0];
            if (fromDate && bookDate < fromDate) return false;
            if (toDate && bookDate > toDate) return false;
        }
    }
    if (filters.deals &&
        (book.priceTrigger == null || book.currentPrice == null || book.currentPrice > book.priceTrigger)) return false;
    if (filters.tags?.length > 0 &&
        !filters.tags.some(tag => book.tags?.includes(tag))) return false;

    return true;
}

// v6.12.0 Phase 8b - Chip label for a Search (ported from desktop filterChips/filterChipsLabel). Used to
// show a meaningful label for an unnamed Search in the drawer and as a Dashboard shelf title.
function searchChips(filters, tagRegistry) {
    const parts = [];
    if (filters.search) parts.push(`"${filters.search}"`);
    if (filters.readStatus) parts.push(filters.readStatus === 'READ' ? 'Read' : filters.readStatus === 'UNREAD' ? 'Unread' : filters.readStatus);
    if (filters.tags?.length > 0) parts.push(filters.tags.map(t => (tagRegistry || {})[t]?.label || t).join(', '));
    if (filters.ownership) parts.push(filters.ownership === 'kindleUnlimited' ? 'KU' : filters.ownership === 'insideAmazon' ? 'Insider' : filters.ownership === 'publicLibraryLending' ? 'Library Loan' : filters.ownership === 'audiblePlus' ? 'Audible Plus' : filters.ownership.charAt(0).toUpperCase() + filters.ownership.slice(1));
    if (filters.collections?.length > 0) parts.push(filters.collections.join(', '));
    if (filters.minAmazonRating) parts.push(`${filters.minAmazonRating}+★`);
    if (filters.minMyRating) parts.push(`My ${filters.minMyRating === 'unrated' ? 'Unrated' : filters.minMyRating + '+★'}`);
    if (filters.series?.length > 0) parts.push(filters.series.map(s => s === 'NOT_IN_SERIES' ? 'Not in series' : s).join(', '));
    if (filters.datePreset) parts.push(datePresetLabel(filters.datePreset)); // v7.21.2 - shared label (was raw "year2025")
    if (filters.deals) parts.push('Deals');
    return parts;
}
function searchChipsLabel(filters, tagRegistry) {
    const parts = searchChips(filters, tagRegistry);
    if (parts.length === 0) return 'All books';
    if (parts.length <= 2) return parts.join(' · ');
    return `${parts[0]} · +${parts.length - 1} more`;
}

function checkIfBlankImage(img, bookId, setBlankImageBooks) {
    if (img.naturalWidth < 10 || img.naturalHeight < 10) {
        setBlankImageBooks(prev => new Set([...prev, bookId]));
    }
}

function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = parseBookDate(dateStr);
    if (d.getTime() === 0) return String(dateStr);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Collect all bookIds from a folder and all its descendant subfolders
function collectDescendantBookIds(folderId, folders) {
    const ids = [];
    const folder = folders.find(f => f.id === folderId);
    if (!folder) return ids;
    ids.push(...(folder.bookIds || []));
    const children = folders.filter(f => f.parentId === folderId);
    for (const child of children) {
        ids.push(...collectDescendantBookIds(child.id, folders));
    }
    return ids;
}

// --- Sub-components ---

function DetailRow({ label, children }) {
    return (
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', fontSize: '14px' }}>
            <span style={{ fontWeight: 600, color: 'var(--text-secondary, #475569)', minWidth: '80px', flexShrink: 0 }}>
                {label}:
            </span>
            <span style={{ color: 'var(--text-primary, #1e293b)', flex: 1 }}>
                {children}
            </span>
        </div>
    );
}

function ReviewCard({ review }) {
    const stars = review.stars || 0;
    const title = review.title || '';
    const text = review.text || '';
    const reviewer = review.reviewer || '';
    return (
        <div style={{ padding: '12px', borderRadius: '8px', marginBottom: '10px',
            backgroundColor: 'var(--bg-surface-alt, #f8fafc)',
            border: '1px solid var(--border-default, #e2e8f0)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <span style={{ color: 'var(--star-color, #eab308)', fontSize: '13px' }}>
                    {'★'.repeat(Math.min(stars, 5))}{'☆'.repeat(Math.max(0, 5 - stars))}
                </span>
                {title && <span style={{ fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' }}>{title}</span>}
            </div>
            {reviewer && <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' }}>by {reviewer}</p>}
            {text && <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 }}>{text}</p>}
        </div>
    );
}

function FolderTile({ folder, onTap }) {
    const count = (folder.bookIds || []).length;
    return (
        <div onClick={onTap} style={{ width: '100%', touchAction: 'manipulation', cursor: 'pointer' }}>
            <div style={{
                aspectRatio: '2/3', borderRadius: '4px', overflow: 'hidden',
                backgroundColor: 'var(--folder-tile-bg, #fffbeb)',
                border: '1px solid var(--folder-tile-border, #fde68a)',
                display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center',
                padding: '8px', gap: '4px',
                boxShadow: '4px 4px 8px 2px rgba(128,128,128,0.5)',
                containerType: 'inline-size'
            }}>
                <span style={{ fontSize: '50cqw', lineHeight: 1 }}>📁</span>
                <span style={{
                    fontSize: '12px', fontWeight: 600, textAlign: 'center',
                    color: 'var(--text-primary, #1e293b)',
                    display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    overflow: 'hidden', lineHeight: 1.3
                }}>
                    {folder.name}
                </span>
                <span style={{ fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>({count})</span>
            </div>
        </div>
    );
}

// --- Header component ---

function Header({ currentNav, navStack, folders, books, tagRegistry, bookLists, savedSearches, onGoBack, onToggleDrawer, onToggleMenu, hasExpandedShelves, onCollapseAll, onOpenSearch, searchQuery, onSearchQueryChange }) {
    const isDashboard = currentNav.view === 'dashboard';
    const isSearch = currentNav.view === 'search';
    const showBack = !isDashboard;

    // Determine center text — just current context name, not full breadcrumb
    const folderName = (id) => {
        if (id === '__recent__') return 'All Books';
        if (id?.startsWith('__tag_') && id?.endsWith('__')) {
            const tagId = id.slice(6, -2);
            return tagRegistry[tagId]?.label || 'Tag View';
        }
        if (id?.startsWith('__booklist_') && id?.endsWith('__')) {
            const blId = id.slice(11, -2);
            const bl = (bookLists || []).find(b => b.id === blId);
            return bl ? bl.name : 'Book List';
        }
        if (id?.startsWith('__search_') && id?.endsWith('__')) {
            const sId = id.slice(9, -2);
            const sv = (savedSearches || []).find(s => s.id === sId);
            if (!sv) return 'Search';
            return (sv.name && sv.name.trim()) ? sv.name : searchChipsLabel(sv.filters, tagRegistry);
        }
        const f = folders.find(fl => fl.id === id);
        return f ? f.name : 'Library';
    };
    let centerText = 'ReaderWrangler';
    if (currentNav.view === 'folder') {
        centerText = folderName(currentNav.folderId);
    } else if (currentNav.view === 'detail') {
        const prev = navStack.length >= 2 ? navStack[navStack.length - 2] : null;
        if (prev && prev.view === 'folder') {
            centerText = folderName(prev.folderId);
        } else if (prev && prev.view === 'search') {
            centerText = 'Search';
        } else {
            centerText = 'Library';
        }
    }

    // Search mode header
    if (isSearch) {
        return (
            <div className="fixed top-0 left-0 right-0 flex items-center gap-2 px-3 z-40"
                style={{
                    height: '48px',
                    background: 'var(--bg-surface, #ffffff)',
                    borderBottom: '1px solid var(--border-default, #e2e8f0)',
                    color: 'var(--text-primary, #1e293b)'
                }}>
                <button onClick={onGoBack} className="p-2 -ml-1 flex-shrink-0" style={{ touchAction: 'manipulation' }} title="Back" aria-label="Back">
                    <IconBack />
                </button>
                <div style={{
                    flex: 1, position: 'relative', display: 'flex', alignItems: 'center'
                }}>
                    <input
                        ref={(el) => { if (el && !el._focused) { el.focus(); el._focused = true; } }}
                        type="text"
                        value={searchQuery || ''}
                        onChange={(e) => onSearchQueryChange(e.target.value)}
                        placeholder={currentNav.folderId ? `Search in ${folderName(currentNav.folderId)}...` : 'Search all books...'}
                        style={{
                            width: '100%', padding: '6px 32px 6px 12px',
                            fontSize: '15px', border: '1px solid var(--border-default, #e2e8f0)',
                            borderRadius: '8px', outline: 'none',
                            background: 'var(--bg-page, #f8fafc)',
                            color: 'var(--text-primary, #1e293b)'
                        }}
                    />
                    {searchQuery && (
                        <button onClick={() => onSearchQueryChange('')}
                            className="flex-shrink-0"
                            style={{
                                position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
                                padding: '2px', touchAction: 'manipulation',
                                color: 'var(--text-muted, #64748b)', background: 'none', border: 'none'
                            }}
                            title="Clear search"
                            aria-label="Clear search">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                            </svg>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className="fixed top-0 left-0 right-0 flex items-center justify-between px-3 z-40"
            style={{
                height: '48px',
                background: 'var(--bg-surface, #ffffff)',
                borderBottom: '1px solid var(--border-default, #e2e8f0)',
                color: 'var(--text-primary, #1e293b)'
            }}>
            <div className="flex items-center">
                <button onClick={onToggleDrawer} className="p-2 -ml-1" style={{ touchAction: 'manipulation' }} title="Folders" aria-label="Folders">
                    <IconHamburger />
                </button>
                {showBack && (
                    <button onClick={onGoBack} className="p-2" style={{ touchAction: 'manipulation' }} title="Back" aria-label="Back">
                        <IconBack />
                    </button>
                )}
            </div>
            <span className="truncate" style={{
                fontFamily: isDashboard ? "'Libre Baskerville', Georgia, serif" : 'var(--font-body)',
                fontSize: isDashboard ? '16px' : '15px',
                fontWeight: isDashboard ? 700 : 600,
                flex: 1, textAlign: 'center', padding: '0 8px'
            }}>
                {/* v1.7.0 - Non-prod copies wear a chip (mobile twin of the desktop LOCAL badge) */}
                {SERVER_ENV.chip && (
                    <span style={{
                        fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px',
                        padding: '1px 5px', borderRadius: '4px', marginRight: '6px',
                        // v1.10.0 - contributor mode in ORANGE, matching the desktop badge (the fail-safe color)
                        background: isContributor() ? '#ea580c' : '#6366f1', color: '#ffffff', verticalAlign: 'middle'
                    }}>{SERVER_ENV.chip}</span>
                )}
                {centerText}
            </span>
            <div className="flex items-center gap-1">
                {isDashboard && (
                    <button onClick={hasExpandedShelves ? onCollapseAll : undefined}
                        className="p-2"
                        style={{ touchAction: 'manipulation', opacity: hasExpandedShelves ? 1 : 0, pointerEvents: hasExpandedShelves ? 'auto' : 'none' }}
                        title="Collapse All">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="18 15 12 9 6 15" />
                        </svg>
                    </button>
                )}
                <button onClick={onOpenSearch} className="p-2" style={{ touchAction: 'manipulation' }} title="Search books" aria-label="Search books">
                    <IconSearch />
                </button>
                <button onClick={onToggleMenu} className="p-2 -mr-1" style={{ touchAction: 'manipulation' }} title="Menu" aria-label="Menu">
                    <IconDots />
                </button>
            </div>
        </div>
    );
}

// --- Backdrop ---

function Backdrop({ onClick }) {
    return (
        <div onClick={onClick} className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.4)' }} />
    );
}

// --- Folder Drawer ---

function FolderDrawer({ folders, books, pinnedTagFolders, tagRegistry, bookLists, savedSearches, showHidden, folderListSort, onSelectFolder, onSelectSearch, onClose, collapsed, toggleSection }) {
    const inbox = folders.find(f => f.id === '__inbox__');
    const inboxCount = inbox ? (inbox.bookIds || []).length : 0;
    // User folders: top-level (parentId === null), excluding Inbox
    // v1.7.0-alpha.13 - Desktop's order (pins + sortIndex/Name), not raw array order
    const topLevel = orderedChildFolders(folders, null, folderListSort).filter(f => f.id !== '__inbox__');
    const childrenOf = (parentId) => orderedChildFolders(folders, parentId, folderListSort);

    // v1.6.9 - per-folder collapse in the drawer tree (drawer-local, persisted)
    const [collapsedFolders, setCollapsedFolders] = useState(() => {
        try { return JSON.parse(localStorage.getItem('rw_mobile_folders_collapsed')) || {}; } catch (e) { return {}; }
    });
    const toggleFolder = (id) => setCollapsedFolders(prev => {
        const next = { ...prev, [id]: !prev[id] };
        try { localStorage.setItem('rw_mobile_folders_collapsed', JSON.stringify(next)); } catch (e) {}
        return next;
    });
    // v1.6.10 - collapse/expand ALL subfolders at once (matches the desktop left pane's collapse-all)
    const foldersWithChildren = folders.filter(f => childrenOf(f.id).length > 0).map(f => f.id);
    const anyFolderExpanded = foldersWithChildren.some(id => !collapsedFolders[id]);
    const collapseAllFolders = () => {
        const next = {};
        foldersWithChildren.forEach(id => { next[id] = anyFolderExpanded; });
        setCollapsedFolders(next);
        try { localStorage.setItem('rw_mobile_folders_collapsed', JSON.stringify(next)); } catch (e) {}
    };

    // v6.12.0 Phase 8 - section header to match desktop's Searches / Book Lists / Folders dividers
    // v1.5.0 - now a collapse toggle (leading chevron + label), matching all three sections
    const SectionHeading = ({ label, sectionKey, extra }) => (
        <div onClick={() => toggleSection(sectionKey)} style={{
            padding: '10px 12px 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
            textTransform: 'uppercase', color: 'var(--text-muted, #64748b)',
            borderTop: '1px solid var(--border-default, #e2e8f0)', marginTop: '4px',
            display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', touchAction: 'manipulation'
        }} role="button" aria-expanded={!collapsed[sectionKey]} aria-label={`${collapsed[sectionKey] ? 'Expand' : 'Collapse'} ${label}`}>
            <span style={{ fontSize: '13px', width: '14px', color: 'var(--text-secondary, #475569)' }}>{collapsed[sectionKey] ? '▶' : '▼'}</span>
            <span>{label}</span>
            {extra && <span style={{ marginLeft: 'auto' }} onClick={(e) => e.stopPropagation()}>{extra}</span>}
        </div>
    );

    const renderFolder = (folder, depth = 0) => {
        const count = (folder.bookIds || []).length;
        const children = childrenOf(folder.id);
        const hasChildren = children.length > 0;
        const isCollapsed = !!collapsedFolders[folder.id];
        return (
            <div key={folder.id}>
                <div className="w-full flex items-center" style={{ paddingLeft: `${12 + depth * 16}px` }}>
                    {hasChildren ? (
                        <span onClick={(e) => { e.stopPropagation(); toggleFolder(folder.id); }}
                            role="button" aria-label={isCollapsed ? 'Expand subfolders' : 'Collapse subfolders'}
                            style={{ width: '22px', flexShrink: 0, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted, #64748b)', cursor: 'pointer', padding: '8px 0', touchAction: 'manipulation' }}>
                            {isCollapsed ? '▸' : '▾'}
                        </span>
                    ) : (
                        <span style={{ width: '22px', flexShrink: 0 }} />
                    )}
                    <button
                        onClick={() => onSelectFolder(folder.id)}
                        className="flex-1 text-left py-2 pr-3 flex items-center gap-2 text-sm"
                        style={{ color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' }}
                    >
                        <IconFolder />
                        <span className="flex-1 truncate">{folder.name}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>({count})</span>
                    </button>
                </div>
                {hasChildren && !isCollapsed && children.map(child => renderFolder(child, depth + 1))}
            </div>
        );
    };

    return (
        <div className="fixed top-0 left-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{
                width: '250px',
                background: 'var(--bg-surface, #ffffff)',
                borderRight: '1px solid var(--border-default, #e2e8f0)',
                color: 'var(--text-primary, #1e293b)'
            }}>
            {/* Drawer header — Dashboard navigates home */}
            <div onClick={() => onSelectFolder('__all__')} className="flex items-center justify-between px-3 flex-shrink-0"
                style={{ height: '48px', borderBottom: '1px solid var(--border-default, #e2e8f0)', cursor: 'pointer', touchAction: 'manipulation' }}>
                <span className="font-semibold text-sm">Dashboard</span>
                <span className="p-2" onClick={(e) => { e.stopPropagation(); onClose(); }} title="Close" role="button" aria-label="Close"><IconClose /></span>
            </div>

            {/* All Books — navigates to all-books grid view */}
            <button
                onClick={() => onSelectFolder('__recent__')}
                className="w-full text-left py-2 px-3 flex items-center gap-2 text-sm"
                style={{ paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' }}
            >
                <span style={{ fontSize: '16px' }}>📚</span>
                <span className="flex-1">All Books</span>
                {/* v1.7.0 - Count honesty: this raw count silently disagreed with the (hidden-filtered) grid view */}
                {(() => {
                    const hidden = showHidden ? 0 : books.filter(b => b.isHidden).length;
                    const shown = books.length - hidden;
                    return (
                        <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}
                            title={hidden > 0 ? `${hidden} book${hidden !== 1 ? 's' : ''} hidden by user` : undefined}>
                            ({shown.toLocaleString()}{hidden > 0 ? ` of ${books.length.toLocaleString()}` : ''})
                        </span>
                    );
                })()}
            </button>

            {/* Searches — saved filter presets, applied to All Books. v1.6.6 - left spine matches the Dashboard. */}
            {savedSearches && savedSearches.length > 0 && (
            <div style={{ borderLeft: '4px solid var(--section-accent-search)', background: 'var(--section-tint-search)' }}>
            <SectionHeading label="Searches" sectionKey="searches" />
            {!collapsed.searches && (savedSearches || []).map(s => {
                const label = (s.name && s.name.trim()) ? s.name : searchChipsLabel(s.filters, tagRegistry);
                const count = books.filter(b => bookMatchesFilters(b, s.filters)).length;
                return (
                    <button key={`search-${s.id}`}
                        onClick={() => onSelectSearch && onSelectSearch(s.id)}
                        className="w-full text-left py-2 px-3 flex items-center gap-2 text-sm"
                        style={{ paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' }}
                    >
                        <span style={{ fontSize: '16px' }}>🔍</span>
                        <span className="flex-1 truncate">{label}</span>
                        <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>({count})</span>
                    </button>
                );
            })}
            </div>
            )}

            {/* Book Lists — curated, supplemental */}
            {bookLists && bookLists.length > 0 && (
            <div style={{ borderLeft: '4px solid var(--section-accent-booklist)', background: 'var(--section-tint-booklist)' }}>
            <SectionHeading label="Book Lists" sectionKey="bookLists" />
            {!collapsed.bookLists && (bookLists || []).map(bl => (
                <button key={`bl-${bl.id}`}
                    onClick={() => onSelectFolder(`__booklist_${bl.id}__`)}
                    className="w-full text-left py-2 px-3 flex items-center gap-2 text-sm"
                    style={{ paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' }}
                >
                    <span style={{ fontSize: '16px' }}>📋</span>
                    <span className="flex-1 truncate">{bl.name}</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>({(bl.bookIds || []).length})</span>
                </button>
            ))}
            </div>
            )}

            {/* Folders */}
            <div style={{ borderLeft: '4px solid var(--section-accent-folder)', background: 'var(--section-tint-folder)' }}>
            <SectionHeading label="Folders" sectionKey="folders" extra={
                !collapsed.folders && foldersWithChildren.length > 0 ? (
                    <span onClick={collapseAllFolders} role="button"
                        aria-label={anyFolderExpanded ? 'Collapse all subfolders' : 'Expand all subfolders'}
                        title={anyFolderExpanded ? 'Collapse all subfolders' : 'Expand all subfolders'}
                        style={{ fontSize: '15px', lineHeight: 1, color: 'var(--text-muted, #64748b)', cursor: 'pointer', padding: '0 4px' }}>
                        {anyFolderExpanded ? '⊟' : '⊞'}
                    </span>
                ) : null
            } />
            {!collapsed.folders && <>
            {/* Inbox — unorganized books */}
            <button
                onClick={() => onSelectFolder('__inbox__')}
                className="w-full text-left py-2 px-3 flex items-center gap-2 text-sm"
                style={{ paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' }}
            >
                <span style={{ fontSize: '16px' }}>📥</span>
                <span className="flex-1">Inbox</span>
                <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>({inboxCount})</span>
            </button>

            {/* Pinned tag views (legacy — normally empty after desktop redesign) */}
            {pinnedTagFolders.length > 0 && [...pinnedTagFolders]
                .sort((a, b) => (a.position ?? 0) - (b.position ?? 0))
                .map((ptf) => {
                    const tagLabel = tagRegistry[ptf.tagId]?.label || ptf.tagId;
                    const tagCount = books.filter(b => (b.tags || []).includes(ptf.tagId)).length;
                    return (
                        <button key={`tag-${ptf.tagId}`}
                            onClick={() => onSelectFolder(`__tag_${ptf.tagId}__`)}
                            className="w-full text-left py-2 px-3 flex items-center gap-2 text-sm"
                            style={{ paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' }}
                        >
                            <span style={{ fontSize: '16px' }}>🏷️</span>
                            <span className="flex-1 truncate">{tagLabel}</span>
                            <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>({tagCount})</span>
                        </button>
                    );
                })
            }

            {/* User folder tree */}
            <div className="py-1">
                {topLevel.length > 0 ? (
                    topLevel.map(f => renderFolder(f))
                ) : (
                    <p className="px-3 py-4 text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>
                        No folders yet. Pair with desktop to sync your library.
                    </p>
                )}
            </div>
            </>}
            </div>
        </div>
    );
}

// --- App Menu ---

function AppMenu({ themePreference, viewMode, showDealsOnly, showHidden, onApplyTheme, onToggleViewMode, onToggleDeals, onToggleHidden, onDesktopMode, onUnpair, onPair, onReset, relayCreds, libraryAsOf, onClose }) {
    const themeLabels = { auto: 'Auto', light: 'Light', dark: 'Dark' };
    const nextTheme = { auto: 'light', light: 'dark', dark: 'auto' };
    const [showCreds, setShowCreds] = useState(false);

    return (
        <div className="fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto"
            style={{
                width: '250px',
                background: 'var(--bg-surface, #ffffff)',
                borderLeft: '1px solid var(--border-default, #e2e8f0)',
                color: 'var(--text-primary, #1e293b)'
            }}>
            {/* Menu header — entire row tappable to close */}
            <div onClick={onClose} className="flex items-center justify-between px-3 flex-shrink-0"
                style={{ height: '48px', borderBottom: '1px solid var(--border-default, #e2e8f0)', cursor: 'pointer', touchAction: 'manipulation' }}>
                <span className="font-semibold text-sm">Menu</span>
                <span className="p-2" title="Close" role="button" aria-label="Close"><IconClose /></span>
            </div>

            <div className="py-1">
                <button onClick={onToggleViewMode}
                    className="w-full text-left py-3 px-4 text-sm flex items-center justify-between"
                    style={{ touchAction: 'manipulation' }}>
                    <span>View</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>
                        {viewMode === 'covers' ? 'Covers' : 'List'}
                    </span>
                </button>

                {/* Theme */}
                <button onClick={() => onApplyTheme(nextTheme[themePreference] || 'auto')}
                    className="w-full text-left py-3 px-4 text-sm flex items-center justify-between"
                    style={{ touchAction: 'manipulation' }}>
                    <span>Theme</span>
                    <span className="text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>
                        {themeLabels[themePreference] || 'Auto'}
                    </span>
                </button>

                {/* Deals Only */}
                <button onClick={onToggleDeals}
                    className="w-full text-left py-3 px-4 text-sm flex items-center justify-between"
                    style={{ touchAction: 'manipulation' }}>
                    <span>Goal Met</span>
                    {showDealsOnly && <IconCheck />}
                </button>

                {/* Show Hidden */}
                <button onClick={onToggleHidden}
                    className="w-full text-left py-3 px-4 text-sm flex items-center justify-between"
                    style={{ touchAction: 'manipulation' }}>
                    <span>Show Hidden</span>
                    {showHidden && <IconCheck />}
                </button>

                {/* Desktop Mode */}
                <button onClick={onDesktopMode}
                    className="w-full text-left py-3 px-4 text-sm"
                    style={{ touchAction: 'manipulation' }}>
                    Desktop Mode
                </button>

                {/* Separator */}
                <div style={{ borderTop: '1px solid var(--border-default, #e2e8f0)', margin: '4px 12px' }} />

                {/* v6.0.0 Phase 2 - Sync / Pairing section */}
                <div className="py-3 px-4 text-sm">
                    <p className="font-semibold mb-2" style={{ color: 'var(--text-primary, #1e293b)' }}>Sync</p>
                    {relayCreds ? (
                        <div>
                            <div className="flex items-center mb-2" style={{ color: 'var(--text-secondary, #475569)', fontSize: '0.85em' }}>
                                <span style={{ color: '#16a34a', marginRight: '6px' }}>●</span>
                                Paired with desktop
                            </div>
                            <button onClick={() => setShowCreds(prev => !prev)}
                                className="w-full text-left mb-2"
                                style={{ fontSize: '0.8em', color: 'var(--text-muted, #64748b)', touchAction: 'manipulation' }}>
                                {showCreds ? '▾ Hide credentials' : '▸ Show credentials'}
                            </button>
                            {showCreds && (
                                <div style={{ fontSize: '0.75em', fontFamily: 'monospace', background: 'var(--bg-muted, #f1f5f9)', padding: '8px', borderRadius: '6px', marginBottom: '8px', wordBreak: 'break-all', lineHeight: 1.5 }}>
                                    <div><span style={{ color: 'var(--text-muted, #64748b)' }}>Channel:</span><br />{relayCreds.channelId}</div>
                                    <div style={{ marginTop: '4px' }}><span style={{ color: 'var(--text-muted, #64748b)' }}>Passphrase:</span><br />{relayCreds.passphrase}</div>
                                    <button onClick={() => {
                                        const text = 'Channel ID: ' + relayCreds.channelId + '\nPassphrase: ' + relayCreds.passphrase;
                                        navigator.clipboard.writeText(text).catch(() => {});
                                    }} style={{
                                        marginTop: '6px', padding: '4px 10px', fontSize: '0.9em',
                                        background: 'var(--bg-surface, #ffffff)', border: '1px solid var(--border-default, #e2e8f0)',
                                        borderRadius: '4px', cursor: 'pointer', touchAction: 'manipulation'
                                    }}>Copy</button>
                                </div>
                            )}
                            <button onClick={() => {
                                const data = JSON.stringify({ channelId: relayCreds.channelId, passphrase: relayCreds.passphrase }, null, 2);
                                const blob = new Blob([data], { type: 'application/json' });
                                const url = URL.createObjectURL(blob);
                                const a = document.createElement('a');
                                a.href = url;
                                a.download = 'readerwrangler-credentials.json';
                                a.click();
                                URL.revokeObjectURL(url);
                            }} style={{
                                width: '100%', padding: '8px', fontSize: '0.85em', marginBottom: '8px',
                                background: 'var(--bg-muted, #f1f5f9)', border: '1px solid var(--border-default, #e2e8f0)', borderRadius: '6px',
                                color: 'var(--text-primary, #1e293b)', cursor: 'pointer', touchAction: 'manipulation'
                            }}>
                                Save Credentials to File
                            </button>
                            <button onClick={() => { onClose(); onUnpair(); }}
                                style={{
                                    width: '100%', padding: '8px', fontSize: '0.85em',
                                    background: 'none', border: '1px solid #dc2626', borderRadius: '6px',
                                    color: '#dc2626', cursor: 'pointer', touchAction: 'manipulation'
                                }}>
                                Unpair
                            </button>
                        </div>
                    ) : (
                        <>
                            <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.85em', marginBottom: '8px' }}>
                                Not paired with desktop.
                            </div>
                            <button onClick={() => { onClose(); onPair(); }}
                                style={{
                                    width: '100%', padding: '8px', fontSize: '0.85em',
                                    background: 'var(--bg-accent, #3b82f6)', border: 'none', borderRadius: '6px',
                                    color: '#ffffff', cursor: 'pointer', touchAction: 'manipulation'
                                }}>
                                Pair with Desktop
                            </button>
                        </>
                    )}
                </div>

                {/* Separator */}
                <div style={{ borderTop: '1px solid var(--border-default, #e2e8f0)', margin: '4px 12px' }} />

                {/* Reset App */}
                <button onClick={() => { onClose(); onReset(); }}
                    className="w-full text-left py-3 px-4 text-sm"
                    style={{ color: '#dc2626', touchAction: 'manipulation' }}>
                    Reset App
                </button>

                {/* Separator */}
                <div style={{ borderTop: '1px solid var(--border-default, #e2e8f0)', margin: '4px 12px' }} />

                {/* Help & About */}
                <div className="py-3 px-4 text-xs" style={{ color: 'var(--text-muted, #64748b)' }}>
                    <p className="font-semibold mb-1" style={{ color: 'var(--text-primary, #1e293b)' }}>Help &amp; About</p>
                    <p><a href="changelog.html" style={{ color: 'var(--text-link, #2563eb)', textDecoration: 'none' }}>App v{APP_VERSION}</a></p>
                    <p>Mobile v{MOBILE_VERSION}</p>
                    <p>Server: {SERVER_ENV.label}</p>
                    {RELAY_IS_DEV && <p>Relay: Dev relay worker + storage</p>}
                    {libraryAsOf && <p>Library as of {new Date(libraryAsOf).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}{(() => { try { const g = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').deviceStateGen; return g ? ` (copy …${String(g).slice(-4)})` : ''; } catch (e) { return ''; } })()}</p>}
                </div>
            </div>
        </div>
    );
}

// --- CoverCard component ---

function CoverCard({ book, coverUrlMap, blankImageBooks, setBlankImageBooks, onTap, fillWidth }) {
    const isBlank = blankImageBooks.has(book.id);
    const imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;

    return (
        <div onClick={() => onTap && onTap(book.id)}
            style={{ width: fillWidth ? '100%' : '105px', flexShrink: 0, touchAction: 'manipulation', cursor: onTap ? 'pointer' : 'default' }}>
            <div style={{
                position: 'relative',
                aspectRatio: '2/3',
                borderRadius: '4px',
                overflow: 'hidden',
                boxShadow: '4px 4px 8px 2px rgba(128,128,128,0.5)',
                border: 'var(--cover-border, none)'
            }}>
                {isBlank || !book.coverUrl ? (
                    <div style={{
                        width: '100%', height: '100%',
                        backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        padding: '8px',
                        opacity: (isWishlisted(book) || book.isHidden) ? 0.4 : 1
                    }}>
                        <div style={{
                            textAlign: 'center',
                            fontFamily: 'var(--font-heading)',
                            fontWeight: 700,
                            fontSize: '0.6em',
                            lineHeight: 1.2,
                            color: 'var(--text-primary, #1e293b)',
                            overflow: 'hidden',
                            display: '-webkit-box',
                            WebkitLineClamp: 4,
                            WebkitBoxOrient: 'vertical'
                        }}>
                            {book.title}
                        </div>
                    </div>
                ) : (
                    <img
                        src={imgSrc}
                        alt=""
                        loading="lazy"
                        style={{ width: '100%', height: '100%', objectFit: 'cover',
                            opacity: (isWishlisted(book) || book.isHidden) ? 0.4 : 1 }}
                        onError={() => setBlankImageBooks(prev => new Set([...prev, book.id]))}
                        onLoad={(e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks)}
                    />
                )}
                {book.isHidden && (
                    <div style={{
                        position: 'absolute', inset: 0,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        pointerEvents: 'none'
                    }}>
                        <svg viewBox="0 0 100 100" style={{ width: '85%', height: 'auto' }}>
                            <circle cx="50" cy="50" r="39" fill="none" stroke="#dc2626" strokeWidth="12" />
                            <line x1="22" y1="22" x2="78" y2="78" stroke="#dc2626" strokeWidth="12" strokeLinecap="round" />
                        </svg>
                    </div>
                )}
                {/* v1.0.2 - Cover badges (ported from desktop v5.6.7) */}
                {/* Top-right: Rating badge */}
                {book.rating > 0 && (
                    <div style={{
                        position: 'absolute', top: '3px', right: '3px',
                        backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: '3px',
                        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
                        color: '#facc15', whiteSpace: 'nowrap'
                    }}>
                        ★ {book.rating.toFixed(1)}
                    </div>
                )}
                {/* Bottom-right: Read status checkmark */}
                {book.readStatus === 'READ' && (
                    <div style={{
                        position: 'absolute', bottom: '3px', right: '3px',
                        backgroundColor: '#16a34a', borderRadius: '50%',
                        width: '18px', height: '18px',
                        display: 'flex', alignItems: 'center', justifyContent: 'center'
                    }} title="Read">
                        <svg viewBox="0 0 20 20" fill="white" style={{ width: '12px', height: '12px' }}>
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                        </svg>
                    </div>
                )}
                {/* Top-left: Collections count or Wishlist heart (no selection on mobile) */}
                {book.collections && book.collections.length > 0 ? (
                    <div style={{
                        position: 'absolute', top: '3px', left: '3px',
                        backgroundColor: 'rgba(55,65,81,0.75)', borderRadius: '3px',
                        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
                        color: 'white', whiteSpace: 'nowrap'
                    }}>
                        📁 {book.collections.length}
                    </div>
                ) : isWishlisted(book) && (
                    <div style={{
                        position: 'absolute', top: '3px', left: '3px',
                        backgroundColor: 'rgba(219,39,119,0.85)', borderRadius: '3px',
                        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
                        color: 'white', letterSpacing: '1px', whiteSpace: 'nowrap'
                    }}>
                        ♡+
                    </div>
                )}
                {/* Bottom-left: Price tag (wishlist) or Ownership badge */}
                {isWishlisted(book) && book.currentPrice != null ? (
                    <div style={{
                        position: 'absolute', bottom: '3px', left: '3px',
                        backgroundColor: book.priceTrigger && book.currentPrice <= book.priceTrigger ? '#22c55e' : '#6b7280',
                        opacity: 0.9, borderRadius: '3px',
                        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
                        color: 'white', whiteSpace: 'nowrap'
                    }}
                        title={book.priceTrigger ? `Goal: $${book.priceTrigger.toFixed(2)} or less` : 'Current price'}
                    >
                        ${book.currentPrice.toFixed(2)}
                    </div>
                ) : book.ownershipType && book.ownershipType !== 'purchased' && (() => {
                    const badgeConfig = {
                        sample: { bg: '#f59e0b', text: 'SAMPLE' },
                        borrowed: { bg: '#14b8a6', text: 'BORROWED' },
                        prime: { bg: '#a855f7', text: 'PRIME' },
                        kindleUnlimited: { bg: '#a855f7', text: 'KU' },
                        koll: { bg: '#a855f7', text: 'KOLL' },
                        comixology: { bg: '#a855f7', text: 'COMIX' },
                        insideAmazon: { bg: '#a855f7', text: 'INSIDER' },
                        publicLibraryLending: { bg: '#14b8a6', text: 'LIBRARY' }, // v1.8.0-alpha.4 - field telemetry 2026-09-03
                        audiblePlus: { bg: '#a855f7', text: 'AUDIBLE+' },
                        unknown: { bg: '#6b7280', text: '?' }
                    };
                    const config = badgeConfig[book.ownershipType];
                    return config ? (
                        <div style={{
                            position: 'absolute', bottom: '3px', left: '3px',
                            backgroundColor: config.bg, opacity: 0.9, borderRadius: '3px',
                            padding: '1px 5px', fontSize: '10px', fontWeight: 700,
                            color: 'white', whiteSpace: 'nowrap'
                        }}>
                            {config.text}
                        </div>
                    ) : null;
                })()}
            </div>
            <div className="truncate" style={{
                marginTop: '4px', fontSize: '12px', fontWeight: 600,
                lineHeight: 1.3, color: 'var(--text-primary, #1e293b)'
            }}>
                {book.title}
            </div>
            <div className="truncate" style={{
                fontSize: '11px', lineHeight: 1.3,
                color: 'var(--text-secondary, #475569)'
            }}>
                {book.author}
            </div>
        </div>
    );
}

// --- Shelf component ---

function Shelf({ title, count, sections, isCapped, isExpanded, coverUrlMap, blankImageBooks, setBlankImageBooks, onTapTitle, onTapBook, onTapSeries, onTapShowAll, onShowLess, isShelfCollapsed, onToggleShelf }) {
    const scrollRef = useRef(null);
    const [labelBars, setLabelBars] = useState([]);
    const [scrollMetrics, setScrollMetrics] = useState({ thumbWidth: 0, thumbLeft: 0, trackWidth: 0, visible: false });
    const trackRef = useRef(null);
    const hasSeries = sections.some(s => s.type === 'series');

    // Track scroll to update floating series label bar positions
    useEffect(() => {
        if (!hasSeries) return;
        const container = scrollRef.current;
        if (!container) return;

        const updateLabels = () => {
            const containerRect = container.getBoundingClientRect();
            const bars = [];

            // Find all series sections by data attribute
            const seriesEls = container.querySelectorAll('[data-series-id]');
            seriesEls.forEach(el => {
                const seriesId = el.dataset.seriesId;
                const seriesName = el.dataset.seriesName;
                const seriesCount = el.dataset.seriesCount;
                const seriesFolderId = el.dataset.seriesFolderId;

                // Get all items (folder tile + books) in this series
                const items = container.querySelectorAll(`[data-section="${seriesId}"]`);
                if (items.length === 0) return;

                // Find leftmost and rightmost visible items
                let leftMost = Infinity, rightMost = -Infinity;
                let anyVisible = false;

                items.forEach(item => {
                    const r = item.getBoundingClientRect();
                    const itemLeft = r.left - containerRect.left;
                    const itemRight = r.right - containerRect.left;

                    // Check if item is at least partially visible in the container
                    if (r.right > containerRect.left && r.left < containerRect.right) {
                        anyVisible = true;
                        leftMost = Math.min(leftMost, Math.max(0, itemLeft));
                        rightMost = Math.max(rightMost, Math.min(containerRect.width, itemRight));
                    }
                });

                if (anyVisible && rightMost > leftMost) {
                    bars.push({ id: seriesId, folderId: seriesFolderId, name: seriesName, count: seriesCount, left: leftMost, width: rightMost - leftMost });
                }
            });

            setLabelBars(bars);
        };

        updateLabels();
        container.addEventListener('scroll', updateLabels);
        window.addEventListener('resize', updateLabels);
        // Also update after images load (may shift layout)
        const rafId = requestAnimationFrame(updateLabels);

        return () => {
            container.removeEventListener('scroll', updateLabels);
            window.removeEventListener('resize', updateLabels);
            cancelAnimationFrame(rafId);
        };
    }, [hasSeries, sections]);

    // v6.12.0 Phase 8b - Custom scrollbar metrics: show the slider whenever the row overflows the screen,
    // not only when expanded. Gives a visible scrub affordance + "there's more →" cue on every long shelf.
    useEffect(() => {
        const container = scrollRef.current;
        if (!container) return;

        const update = () => {
            const { scrollLeft, scrollWidth, clientWidth } = container;
            if (scrollWidth <= clientWidth + 1) {
                setScrollMetrics(prev => ({ ...prev, visible: false }));
                return;
            }
            const trackWidth = clientWidth - 32; // 16px padding each side
            const ratio = clientWidth / scrollWidth;
            const thumbWidth = Math.max(30, trackWidth * ratio);
            const scrollRange = scrollWidth - clientWidth;
            const thumbRange = trackWidth - thumbWidth;
            const thumbLeft = scrollRange > 0 ? (scrollLeft / scrollRange) * thumbRange : 0;
            setScrollMetrics({ thumbWidth, thumbLeft: thumbLeft + 16, trackWidth, visible: true });
        };

        update();
        container.addEventListener('scroll', update);
        window.addEventListener('resize', update);
        const raf = requestAnimationFrame(update);
        return () => {
            container.removeEventListener('scroll', update);
            window.removeEventListener('resize', update);
            cancelAnimationFrame(raf);
        };
    }, [isExpanded, sections]);

    // Custom scrollbar touch drag handler
    const handleThumbDrag = useCallback((startEvent) => {
        startEvent.preventDefault();
        const container = scrollRef.current;
        const track = trackRef.current;
        if (!container || !track) return;

        const trackRect = track.getBoundingClientRect();
        const { scrollWidth, clientWidth } = container;
        const scrollRange = scrollWidth - clientWidth;
        const trackWidth = trackRect.width;
        const thumbWidth = Math.max(30, trackWidth * (clientWidth / scrollWidth));
        const thumbRange = trackWidth - thumbWidth;

        const startX = startEvent.touches[0].clientX;
        const startScrollLeft = container.scrollLeft;

        const onMove = (e) => {
            const dx = e.touches[0].clientX - startX;
            const scrollDelta = thumbRange > 0 ? (dx / thumbRange) * scrollRange : 0;
            container.scrollLeft = Math.max(0, Math.min(scrollRange, startScrollLeft + scrollDelta));
        };
        const onEnd = () => {
            document.removeEventListener('touchmove', onMove);
            document.removeEventListener('touchend', onEnd);
        };
        document.addEventListener('touchmove', onMove, { passive: false });
        document.addEventListener('touchend', onEnd);
    }, []);

    const totalBooks = sections.reduce((sum, s) => sum + s.books.length, 0);
    if (totalBooks === 0) return null;

    // Build flat list of items for the scroll row
    // v6.12.0 Phase 8b - series no longer get a redundant folder tile: the tile and the floating label bar
    // both just opened the sub-folder, and the books showed inline anyway. The tappable label bar (with a
    // chevron) is the single "open this series" affordance now. Marker stays for label-bar tracking.
    const items = [];
    sections.forEach((section, si) => {
        if (section.type === 'series') {
            items.push({ type: 'series-marker', section, sectionIndex: si });
        }
        section.books.forEach(book => {
            items.push({ type: 'book', book, section, sectionIndex: si });
        });
    });
    // v6.12.0 Phase 8b - Show All / Show Less moved to the shelf header (no more in-row end cards).

    return (
        <div style={{ marginBottom: '24px' }}>
            <div className="flex items-center justify-between"
                onClick={onTapTitle}
                style={{ padding: '0 16px', marginBottom: '8px', cursor: onTapTitle ? 'pointer' : 'default', touchAction: 'manipulation' }}>
                <span style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '15px', fontWeight: 700,
                    color: 'var(--text-primary, #1e293b)'
                }}>
                    {onToggleShelf && (
                        <span onClick={(e) => { e.stopPropagation(); onToggleShelf(); }}
                            role="button" aria-label={isShelfCollapsed ? 'Expand shelf' : 'Collapse shelf'}
                            style={{ display: 'inline-block', width: '14px', marginRight: '4px', fontSize: '12px', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer' }}>
                            {isShelfCollapsed ? '▸' : '▾'}
                        </span>
                    )}
                    {title}
                    {onTapTitle && <span style={{ marginLeft: '6px', color: 'var(--text-secondary)', display: 'inline-flex', verticalAlign: 'middle' }}>
                            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor" stroke="none">
                                <rect x="3" y="3" width="6" height="6" rx="1" />
                                <rect x="12" y="3" width="6" height="6" rx="1" />
                                <rect x="3" y="12" width="6" height="6" rx="1" />
                                <rect x="12" y="12" width="6" height="6" rx="1" />
                            </svg>
                        </span>}
                </span>
                <span style={{ display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 }}>
                    {(isCapped || isExpanded) && (onTapShowAll || onShowLess) && (
                        <button
                            onClick={(e) => { e.stopPropagation(); if (isExpanded) { onShowLess && onShowLess(); } else { onTapShowAll && onTapShowAll(); } }}
                            style={{
                                fontSize: '12px', fontWeight: 600, color: 'var(--text-accent, #3b82f6)',
                                background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                touchAction: 'manipulation', whiteSpace: 'nowrap'
                            }}>
                            {isExpanded ? 'Show less' : 'Show all'}
                        </button>
                    )}
                    <span style={{ fontSize: '13px', color: 'var(--text-muted, #94a3b8)' }}>({count})</span>
                </span>
            </div>
            {!isShelfCollapsed && (
            <div>
              <div style={{ position: 'relative' }}>
                <div ref={scrollRef} className="shelf-scroll" style={{
                    display: 'flex', gap: '12px',
                    overflowX: 'auto',
                    paddingLeft: '16px', paddingRight: '16px',
                    paddingBottom: hasSeries ? '32px' : '12px',
                    WebkitOverflowScrolling: 'touch',
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none'
                }}>
                    {items.map((item, idx) => {
                        if (item.type === 'series-marker') {
                            // Hidden zero-width marker for label bar tracking
                            return <div key={`marker-${item.section.folder.id}`}
                                data-series-id={item.section.folder.id}
                                data-series-name={item.section.folder.name}
                                data-series-count={item.section.totalBooks}
                                data-series-folder-id={item.section.folder.id}
                                style={{ width: 0, flexShrink: 0 }} />;
                        }
                        if (item.type === 'book') {
                            return <div key={item.book.id}
                                data-section={item.section.type === 'series' ? item.section.folder.id : undefined}>
                                <CoverCard
                                    book={item.book}
                                    coverUrlMap={coverUrlMap}
                                    blankImageBooks={blankImageBooks}
                                    setBlankImageBooks={setBlankImageBooks}
                                    onTap={onTapBook}
                                />
                            </div>;
                        }
                        return null;
                    })}
                </div>
                {/* Floating series label bars — warm amber. Tappable (chevron) → opens the series.
                    Anchored to the bottom of the scroll row so the slider zone below never overlaps them. */}
                {labelBars.map(bar => (
                    <div key={`label-${bar.id}`}
                        onClick={() => onTapSeries && onTapSeries(bar.folderId)}
                        style={{
                            position: 'absolute',
                            bottom: '0px',
                            left: `${bar.left}px`,
                            width: `${bar.width}px`,
                            height: '22px',
                            backgroundColor: 'var(--label-bar-bg, #fffbeb)',
                            borderTop: '1px solid var(--label-bar-border, #fde68a)',
                            borderRadius: '2px',
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '0 8px',
                            fontSize: '11px',
                            color: 'var(--text-secondary, #475569)',
                            cursor: 'pointer', touchAction: 'manipulation',
                            overflow: 'hidden', whiteSpace: 'nowrap',
                            pointerEvents: 'auto'
                        }}>
                        <span style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>{bar.name}</span>
                        <span style={{ flexShrink: 0, marginLeft: '6px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted, #94a3b8)' }}>
                            ({bar.count})
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor" stroke="none" style={{ opacity: 0.85 }}><rect x="3" y="3" width="6" height="6" rx="1" /><rect x="12" y="3" width="6" height="6" rx="1" /><rect x="3" y="12" width="6" height="6" rx="1" /><rect x="12" y="12" width="6" height="6" rx="1" /></svg>
                        </span>
                    </div>
                ))}
              </div>
              {/* Always-on horizontal scrollbar (when the row overflows). Its own zone below the row, so it
                  never collides with the floating series label bar. */}
              {scrollMetrics.visible && (
                <div ref={trackRef} onClick={(e) => {
                    const container = scrollRef.current;
                    const track = trackRef.current;
                    if (!container || !track) return;
                    const trackRect = track.getBoundingClientRect();
                    const ratio = (e.clientX - trackRect.left) / trackRect.width;
                    container.scrollLeft = ratio * (container.scrollWidth - container.clientWidth);
                }} style={{
                    position: 'relative',
                    height: '8px',
                    margin: '6px 16px 0',
                    borderRadius: '4px',
                    background: 'var(--border-default, #e2e8f0)',
                    touchAction: 'none',
                    cursor: 'pointer'
                }}>
                    <div
                        onTouchStart={handleThumbDrag}
                        style={{
                            position: 'absolute',
                            top: '0px',
                            left: `${scrollMetrics.thumbLeft - 16}px`,
                            width: `${scrollMetrics.thumbWidth}px`,
                            height: '8px',
                            borderRadius: '4px',
                            background: 'var(--text-secondary, #64748b)',
                            cursor: 'grab',
                            touchAction: 'none'
                        }}
                    />
                </div>
              )}
            </div>
            )}
        </div>
    );
}

// --- Dashboard component ---

function Dashboard({ books, folders, pinnedTagFolders, tagRegistry, bookLists, savedSearches, showDealsOnly, showHidden, folderListSort, libraryAsOf, coverUrlMap, blankImageBooks, setBlankImageBooks, onTapBook, onTapFolderTitle, onTapSeries, expandedShelves, setExpandedShelves, collapsed, toggleSection }) {
    // v1.6.10 - per-shelf collapse on the Dashboard (folder shelves), Dashboard-local + persisted
    const [collapsedShelves, setCollapsedShelves] = useState(() => {
        try { return JSON.parse(localStorage.getItem('rw_mobile_shelves_collapsed')) || {}; } catch (e) { return {}; }
    });
    const toggleShelf = (id) => setCollapsedShelves(prev => {
        const next = { ...prev, [id]: !prev[id] };
        try { localStorage.setItem('rw_mobile_shelves_collapsed', JSON.stringify(next)); } catch (e) {}
        return next;
    });
    // v1.7.2-alpha.1 - Section-wide shelf collapse (desktop's ⊟/⊞ concept): one tap turns a whole
    // section into a names-only list — scanning 40 folder names stops meaning paging through ten
    // screens of cover rows (Ron; the drawer also does names-only, but Murphy says 10% won't find it).
    const setAllShelves = (ids, collapse) => setCollapsedShelves(prev => {
        const next = { ...prev };
        ids.forEach(id => { next[id] = collapse; });
        try { localStorage.setItem('rw_mobile_shelves_collapsed', JSON.stringify(next)); } catch (e) {}
        return next;
    });

    const filteredBooks = useMemo(() => {
        return filterBooks(books, { showDealsOnly, showHidden });
    }, [books, showDealsOnly, showHidden]);

    const bookMap = useMemo(() => {
        const map = {};
        for (const book of filteredBooks) map[book.id] = book;
        return map;
    }, [filteredBooks]);

    const filteredBookIds = useMemo(() => {
        return new Set(filteredBooks.map(b => b.id));
    }, [filteredBooks]);

    const shelves = useMemo(() => {
        const result = [];

        // All Books shelf (newest first, expandable)
        // v1.7.0-alpha.4 - Consolidated onto sortBooks so the shelf, the grid view, and desktop
        // all share one Date Added ordering (incl. the universal tiebreak).
        const allByDate = sortBooks(filteredBooks, 'dateAdded');

        if (allByDate.length > 0) {
            const isExpanded = expandedShelves.has('__recent__');
            const effectiveLimit = isExpanded ? Infinity
                : (allByDate.length <= SHELF_LIMIT + 1 ? allByDate.length : SHELF_LIMIT);
            const capped = effectiveLimit === Infinity ? allByDate : allByDate.slice(0, effectiveLimit);
            result.push({
                title: 'All Books',
                count: allByDate.length,
                sections: [{ type: 'standalone', books: capped }],
                folderId: '__recent__',
                section: 'allbooks',
                isCapped: !isExpanded && capped.length < allByDate.length
            });
        }

        // v6.12.0 Phase 8b - Search shelves (saved filter presets applied to All Books), above Book Lists.
        // A Search is a dynamic list: its books are everything matching the saved filter.
        for (const sv of (savedSearches || [])) {
            const matched = filteredBooks.filter(b => bookMatchesFilters(b, sv.filters));
            if (matched.length === 0) continue;
            const folderId = `__search_${sv.id}__`;
            const title = (sv.name && sv.name.trim()) ? sv.name : searchChipsLabel(sv.filters, tagRegistry);
            const isExpanded = expandedShelves.has(folderId);
            const effectiveLimit = isExpanded ? Infinity
                : (matched.length <= SHELF_LIMIT + 1 ? matched.length : SHELF_LIMIT);
            const capped = effectiveLimit === Infinity ? matched : matched.slice(0, effectiveLimit);
            result.push({
                title,
                count: matched.length,
                sections: [{ type: 'standalone', books: capped }],
                folderId,
                section: 'search',
                isCapped: !isExpanded && capped.length < matched.length
            });
        }

        // v6.12.0 Phase 8 - Book List shelves (curated, supplemental), above Folders.
        // Books shown in the list's curated order; tapping the title opens the sortable list view.
        for (const bl of (bookLists || [])) {
            const listBooks = (bl.bookIds || [])
                .filter(id => filteredBookIds.has(id))
                .map(id => bookMap[id])
                .filter(Boolean);
            if (listBooks.length === 0) continue;
            const folderId = `__booklist_${bl.id}__`;
            const isExpanded = expandedShelves.has(folderId);
            const effectiveLimit = isExpanded ? Infinity
                : (listBooks.length <= SHELF_LIMIT + 1 ? listBooks.length : SHELF_LIMIT);
            const capped = effectiveLimit === Infinity ? listBooks : listBooks.slice(0, effectiveLimit);
            result.push({
                title: bl.name,
                count: listBooks.length,
                sections: [{ type: 'standalone', books: capped }],
                folderId,
                section: 'booklist',
                isCapped: !isExpanded && capped.length < listBooks.length
            });
        }

        // Inbox shelf (second row, after Recently Added)
        const inboxFolder = folders.find(f => f.id === '__inbox__');
        if (inboxFolder) {
            const inboxBookIds = (inboxFolder.bookIds || []).filter(id => filteredBookIds.has(id));
            const inboxBooks = inboxBookIds.map(id => bookMap[id]).filter(Boolean);
            if (inboxBooks.length > 0) {
                const isExpanded = expandedShelves.has('__inbox__');
                const effectiveLimit = isExpanded ? Infinity
                    : (inboxBooks.length <= SHELF_LIMIT + 1 ? inboxBooks.length : SHELF_LIMIT);
                const capped = effectiveLimit === Infinity ? inboxBooks : inboxBooks.slice(0, effectiveLimit);
                result.push({
                    title: 'Inbox',
                    count: inboxBooks.length,
                    sections: [{ type: 'standalone', books: capped }],
                    folderId: '__inbox__',
                    section: 'folder',
                    isCapped: !isExpanded && capped.length < inboxBooks.length
                });
            }
        }

        // Tag view shelves (pinned tags, positioned between Inbox and folders)
        const sortedTagViews = [...(pinnedTagFolders || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));
        for (const ptf of sortedTagViews) {
            const tagId = ptf.tagId;
            const tagLabel = tagRegistry[tagId]?.label || tagId;
            const folderId = `__tag_${tagId}__`;
            const taggedBooks = filteredBooks.filter(b => (b.tags || []).includes(tagId));
            if (taggedBooks.length === 0) continue;

            // Respect manual bookOrder if present
            let orderedBooks;
            const bookOrder = ptf.bookOrder || [];
            if (bookOrder.length > 0) {
                const orderedSet = new Set(bookOrder);
                const ordered = bookOrder.filter(id => filteredBookIds.has(id)).map(id => bookMap[id]).filter(Boolean);
                const unordered = taggedBooks.filter(b => !orderedSet.has(b.id));
                orderedBooks = [...ordered, ...unordered];
            } else {
                orderedBooks = taggedBooks;
            }

            const isExpanded = expandedShelves.has(folderId);
            const effectiveLimit = isExpanded ? Infinity
                : (orderedBooks.length <= SHELF_LIMIT + 1 ? orderedBooks.length : SHELF_LIMIT);
            const capped = effectiveLimit === Infinity ? orderedBooks : orderedBooks.slice(0, effectiveLimit);
            result.push({
                title: tagLabel,
                count: orderedBooks.length,
                sections: [{ type: 'standalone', books: capped }],
                folderId,
                section: 'folder',
                isCapped: !isExpanded && capped.length < orderedBooks.length
            });
        }

        // Folder shelves with sections (standalone books + series subfolders)
        // v1.7.0-alpha.13 - Desktop's order (pins + sortIndex/Name), not raw array order
        const topLevelFolders = orderedChildFolders(folders, null, folderListSort).filter(f => f.id !== '__inbox__');

        for (const folder of topLevelFolders) {
            const sections = [];
            const isExpanded = expandedShelves.has(folder.id);
            // Count total books first so we can avoid "Show All" for just 1 extra book
            const allBookIds = collectDescendantBookIds(folder.id, folders);
            const totalFiltered = allBookIds.filter(id => filteredBookIds.has(id)).length;
            const effectiveLimit = isExpanded ? Infinity
                : (totalFiltered <= SHELF_LIMIT + 1 ? totalFiltered : SHELF_LIMIT);
            let remaining = effectiveLimit;

            // Standalone books (direct children, not in any subfolder)
            const standaloneBooks = (folder.bookIds || [])
                .filter(id => filteredBookIds.has(id))
                .map(id => bookMap[id])
                .filter(Boolean);

            if (standaloneBooks.length > 0) {
                const capped = remaining === Infinity ? standaloneBooks : standaloneBooks.slice(0, remaining);
                sections.push({ type: 'standalone', books: capped });
                remaining -= capped.length;
            }

            // v1.7.0-alpha.13 - Series subfolders in desktop's full order (pins + manual/Name mirror)
            const childFolders = orderedChildFolders(folders, folder.id, folderListSort);

            for (const child of childFolders) {
                if (remaining <= 0) break;
                const allChildBookIds = collectDescendantBookIds(child.id, folders);
                const seriesBooks = allChildBookIds
                    .filter(id => filteredBookIds.has(id))
                    .map(id => bookMap[id])
                    .filter(Boolean);

                if (seriesBooks.length > 0) {
                    const capped = remaining === Infinity ? seriesBooks : seriesBooks.slice(0, remaining);
                    sections.push({ type: 'series', folder: child, books: capped, totalBooks: seriesBooks.length });
                    remaining -= capped.length;
                }
            }

            if (sections.length > 0) {
                const displayedBooks = sections.reduce((sum, s) => sum + s.books.length, 0);
                result.push({
                    title: folder.name,
                    count: totalFiltered,
                    sections,
                    folderId: folder.id,
                    section: 'folder',
                    isCapped: !isExpanded && displayedBooks < totalFiltered
                });
            }
        }

        return result;
    }, [filteredBooks, filteredBookIds, bookMap, folders, pinnedTagFolders, tagRegistry, bookLists, savedSearches, expandedShelves]);

    if (shelves.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center px-6 text-center"
                 style={{ minHeight: 'calc(100vh - 48px)' }}>
                <p className="text-sm" style={{ color: 'var(--text-muted, #94a3b8)' }}>
                    No books match the current filters.
                </p>
            </div>
        );
    }

    // v6.12.0 Phase 8b - category dividers between shelf groups, mirroring the drawer + desktop sidebar
    // (All Books standalone, then Searches / Book Lists / Folders). Heading shown before the first shelf
    // of each section that has one; All Books has no heading.
    const SECTION_LABELS = { search: 'Searches', booklist: 'Book Lists', folder: 'Folders' };
    // v1.6.0 - subtle per-section hue so each group is identifiable at a glance on the long overview.
    // Translucent overlays (work on any theme bg): blue = Searches, green = Book Lists, amber = Folders.
    const SECTION_TINT = { search: 'var(--section-tint-search)', booklist: 'var(--section-tint-booklist)', folder: 'var(--section-tint-folder)' };
    // v1.6.2 - icon per section (mirrors the drawer) = a color-independent identifier
    const SECTION_ICON = { search: '🔍', booklist: '📋', folder: '📁' };
    // v1.6.3 - solid accent per section = a pinned left "spine" so you know the section on every row
    // v1.6.5 - theme-aware CSS vars (softened; coordinated with the tint per theme, esp. dark)
    const SECTION_ACCENT = { search: 'var(--section-accent-search)', booklist: 'var(--section-accent-booklist)', folder: 'var(--section-accent-folder)' };
    // v1.6.8 - map Dashboard section ids to the shared collapse keys (drawer uses these), so collapse syncs both ways
    const SECTION_KEY = { search: 'searches', booklist: 'bookLists', folder: 'folders' };
    // v1.6.1 - Group consecutive shelves by section so each renders as ONE solid tinted band (no white
    // between rows), with breathing room between sections.
    const groups = [];
    shelves.forEach(shelf => {
        const last = groups[groups.length - 1];
        if (last && last.section === shelf.section) last.shelves.push(shelf);
        else groups.push({ section: shelf.section, shelves: [shelf] });
    });
    const rows = groups.map((group, gi) => {
        const label = SECTION_LABELS[group.section];
        const tint = SECTION_TINT[group.section];
        const secKey = SECTION_KEY[group.section];        // v1.6.8 - shared collapse key (matches the drawer)
        const isCollapsed = secKey && collapsed[secKey];
        return (
            <div key={`grp-${group.section}-${gi}`} style={{
                background: tint || 'transparent',
                paddingBottom: isCollapsed ? '8px' : (tint ? '44px' : '12px'),
                borderLeft: SECTION_ACCENT[group.section] ? `5px solid ${SECTION_ACCENT[group.section]}` : 'none'
            }}>
                {label && (
                    <div onClick={() => toggleSection(secKey)} style={{
                        padding: '7px 16px', borderTop: '1px solid var(--border-default, #e2e8f0)',
                        background: 'var(--section-heading-bg)',
                        fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700,
                        textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary, #475569)',
                        display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
                    }} role="button" aria-expanded={!isCollapsed}>
                        <span style={{ fontSize: '11px', width: '10px' }}>{isCollapsed ? '▶' : '▼'}</span>
                        <span style={{ fontSize: '15px' }}>{SECTION_ICON[group.section]}</span>
                        <span>{label}</span>
                        {/* v1.7.2-alpha.1 - ⊟/⊞: collapse/expand every shelf in this section (names-only browsing) */}
                        {!isCollapsed && (group.section === 'folder' || group.section === 'booklist') && (() => {
                            const ids = group.shelves.map(s => s.folderId).filter(Boolean);
                            if (!ids.length) return null;
                            const anyOpen = ids.some(id => !collapsedShelves[id]);
                            return (
                                <span
                                    onClick={(e) => { e.stopPropagation(); setAllShelves(ids, anyOpen); }}
                                    style={{ marginLeft: 'auto', padding: '2px 8px', fontSize: '15px', color: 'var(--text-muted, #94a3b8)', touchAction: 'manipulation' }}
                                    role="button"
                                    aria-label={anyOpen ? 'Collapse all shelves — names only' : 'Expand all shelves'}
                                    title={anyOpen ? 'Collapse all — names only' : 'Expand all'}>
                                    {anyOpen ? '⊟' : '⊞'}
                                </span>
                            );
                        })()}
                    </div>
                )}
                {!isCollapsed && group.shelves.map((shelf, si) => (
                    <Shelf
                        key={shelf.title + '-' + si}
                        title={shelf.title}
                        count={shelf.count}
                        sections={shelf.sections}
                        isCapped={shelf.isCapped}
                        isExpanded={shelf.folderId ? expandedShelves.has(shelf.folderId) : false}
                        coverUrlMap={coverUrlMap}
                        blankImageBooks={blankImageBooks}
                        setBlankImageBooks={setBlankImageBooks}
                        onTapTitle={shelf.folderId ? () => onTapFolderTitle(shelf.folderId) : null}
                        onTapBook={onTapBook}
                        onTapSeries={onTapSeries}
                        onTapShowAll={shelf.folderId ? () => setExpandedShelves(prev => { const next = new Set(prev); next.add(shelf.folderId); return next; }) : null}
                        onShowLess={shelf.folderId ? () => setExpandedShelves(prev => { const next = new Set(prev); next.delete(shelf.folderId); return next; }) : null}
                        isShelfCollapsed={shelf.folderId ? !!collapsedShelves[shelf.folderId] : false}
                        onToggleShelf={shelf.folderId ? () => toggleShelf(shelf.folderId) : null}
                    />
                ))}
            </div>
        );
    });

    return (
        <div style={{ paddingTop: '12px', paddingBottom: '24px' }}>
            {rows}
            {/* v1.7.0-alpha.24 - Staleness made legible (freshness nudge layer 1) */}
            {libraryAsOf && (
                <div style={{ textAlign: 'center', padding: '16px 0 4px', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' }}>
                    Library as of {new Date(libraryAsOf).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                </div>
            )}
        </div>
    );
}

// --- FolderView component ---

function FolderView({ folderId, books, folders, pinnedTagFolders, tagRegistry, bookLists, savedSearches, showDealsOnly, showHidden, onToggleHidden, folderListSort, sortOption, onCycleSort, viewMode,
                      coverUrlMap, blankImageBooks, setBlankImageBooks, onTapBook, onTapSubfolder }) {
    const isAllBooks = folderId === '__recent__';
    const isTagView = folderId?.startsWith('__tag_') && folderId?.endsWith('__');
    const isBookList = folderId?.startsWith('__booklist_') && folderId?.endsWith('__');
    const isSearch = folderId?.startsWith('__search_') && folderId?.endsWith('__');
    const folder = (isAllBooks || isTagView || isBookList || isSearch) ? null : folders.find(f => f.id === folderId);

    const subfolders = useMemo(() => {
        if (isAllBooks || isTagView || isBookList || isSearch) return [];
        return orderedChildFolders(folders, folderId, folderListSort); // v1.7.0-alpha.13 - desktop's order, not alphabetical
    }, [folders, folderId, isAllBooks, isTagView, isBookList, isSearch]);

    const folderBooks = useMemo(() => {
        const filtered = filterBooks(books, { showDealsOnly, showHidden });
        let result;
        if (isAllBooks) {
            result = filtered;
        } else if (isTagView) {
            const tagId = folderId.slice(6, -2);
            const taggedBooks = filtered.filter(b => (b.tags || []).includes(tagId));
            // Respect manual bookOrder if present
            const pinnedEntry = (pinnedTagFolders || []).find(p => p.tagId === tagId);
            const bookOrder = pinnedEntry?.bookOrder || [];
            if (bookOrder.length > 0) {
                const filteredIds = new Set(taggedBooks.map(b => b.id));
                const orderedSet = new Set(bookOrder);
                const ordered = bookOrder.filter(id => filteredIds.has(id)).map(id => taggedBooks.find(b => b.id === id)).filter(Boolean);
                const unordered = taggedBooks.filter(b => !orderedSet.has(b.id));
                result = [...ordered, ...unordered];
            } else {
                result = taggedBooks;
            }
        } else if (isBookList) {
            // v6.12.0 Phase 8 - curated list: preserve the list's bookIds order (matches desktop)
            const blId = folderId.slice(11, -2);
            const bl = (bookLists || []).find(b => b.id === blId);
            const filteredSet = new Set(filtered.map(b => b.id));
            const bookMap = new Map(filtered.map(b => [b.id, b]));
            result = (bl?.bookIds || []).filter(id => filteredSet.has(id)).map(id => bookMap.get(id)).filter(Boolean);
        } else if (isSearch) {
            // v6.12.0 Phase 8b - dynamic list: every book matching the saved Search's filter
            const sId = folderId.slice(9, -2);
            const sv = (savedSearches || []).find(s => s.id === sId);
            result = sv ? filtered.filter(b => bookMatchesFilters(b, sv.filters)) : [];
        } else if (!folder) {
            return [];
        } else {
            // v1.0.2 - Preserve folder.bookIds order for manual sort (matches desktop getFolderBookIds)
            const filteredSet = new Set(filtered.map(b => b.id));
            const bookMap = new Map(filtered.map(b => [b.id, b]));
            result = (folder.bookIds || []).filter(id => filteredSet.has(id)).map(id => bookMap.get(id));
        }
        return sortBooks(result, sortOption);
    }, [folder, books, pinnedTagFolders, bookLists, savedSearches, showDealsOnly, showHidden, isAllBooks, isTagView, isBookList, isSearch, folderId, sortOption]);

    const sortLabel = SORT_OPTIONS.find(o => o.key === sortOption)?.label || 'Date Added';

    if (!isAllBooks && !isTagView && !isBookList && !isSearch && !folder) {
        return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Folder not found</div>;
    }

    return (
        <div style={{ padding: '12px 16px 24px' }}>
            {subfolders.length > 0 && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 105px)', gap: '16px 12px', justifyContent: 'center', marginBottom: '16px' }}>
                    {subfolders.map(sub => (
                        <FolderTile key={sub.id} folder={sub} onTap={() => onTapSubfolder(sub.id)} />
                    ))}
                </div>
            )}

            {folderBooks.length > 0 && (
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary, #475569)'
                }}>
                    {/* v1.7.0 - Count honesty: in All Books, admit hidden books and name the cause.
                        v1.7.0-alpha.4 - Symmetric: the clause exists whenever hidden-flagged books exist,
                        names the current truth, and is always the toggle (show <-> re-hide). */}
                    {(() => {
                        const hiddenCount = (isAllBooks && !showDealsOnly)
                            ? books.filter(b => b.isHidden).length : 0;
                        if (hiddenCount === 0) {
                            return <span>{folderBooks.length.toLocaleString()} book{folderBooks.length !== 1 ? 's' : ''}</span>;
                        }
                        const clauseBtn = (text, title) => (
                            <button onClick={onToggleHidden} title={title}
                                style={{
                                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                                    color: 'var(--text-link, #2563eb)', fontSize: 'inherit',
                                    touchAction: 'manipulation', textDecoration: 'underline dotted'
                                }}>{text}</button>
                        );
                        const plural = hiddenCount !== 1 ? 's' : '';
                        if (!showHidden) {
                            const total = folderBooks.length + hiddenCount;
                            return (
                                <span>
                                    {folderBooks.length.toLocaleString()} of {total.toLocaleString()} books{' '}
                                    {clauseBtn(`(${hiddenCount} hidden by user)`, `${hiddenCount} book${plural} hidden by user — tap to show`)}
                                </span>
                            );
                        }
                        return (
                            <span>
                                {folderBooks.length.toLocaleString()} books{' '}
                                {clauseBtn(`(including ${hiddenCount} hidden by user)`, `Tap to hide ${hiddenCount === 1 ? 'it' : 'them'} again`)}
                            </span>
                        );
                    })()}
                    <button onClick={onCycleSort} title="Tap to change sort order" style={{
                        display: 'flex', alignItems: 'center', gap: '4px',
                        padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-default, #e2e8f0)',
                        background: 'var(--bg-surface, #ffffff)', color: 'var(--text-secondary, #475569)',
                        fontSize: '12px', fontWeight: 500, touchAction: 'manipulation', cursor: 'pointer'
                    }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                            <path d="M7 15l5 5 5-5M7 9l5-5 5 5" />
                        </svg>
                        {sortLabel}
                    </button>
                </div>
            )}

            {folderBooks.length > 0 ? (
                viewMode === 'list' ? (
                    <div>
                        {folderBooks.map(book => {
                            const imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;
                            const isBlank = blankImageBooks.has(book.id);
                            return (
                                <div key={book.id}
                                    onClick={() => onTapBook(book.id)}
                                    style={{
                                        display: 'flex', gap: '12px', padding: '8px 0',
                                        borderBottom: '1px solid var(--border-default, #e2e8f0)',
                                        cursor: 'pointer', touchAction: 'manipulation'
                                    }}>
                                    <div style={{
                                        width: '40px', flexShrink: 0,
                                        aspectRatio: '2/3', borderRadius: '3px', overflow: 'hidden',
                                        boxShadow: '2px 2px 4px 1px rgba(128,128,128,0.4)',
                                        opacity: isWishlisted(book) ? 0.4 : 1
                                    }}>
                                        {isBlank || !book.coverUrl ? (
                                            <div style={{
                                                width: '100%', height: '100%',
                                                backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                padding: '2px'
                                            }}>
                                                <div style={{
                                                    textAlign: 'center', fontFamily: 'var(--font-heading)',
                                                    fontWeight: 700, fontSize: '0.35em', lineHeight: 1.2,
                                                    color: 'var(--text-primary, #1e293b)',
                                                    overflow: 'hidden', display: '-webkit-box',
                                                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                                                }}>{book.title}</div>
                                            </div>
                                        ) : (
                                            <img src={imgSrc} alt="" loading="lazy"
                                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                                onError={() => setBlankImageBooks(prev => new Set([...prev, book.id]))}
                                                onLoad={(e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks)}
                                            />
                                        )}
                                    </div>
                                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1px' }}>
                                        <div className="truncate" style={{
                                            fontSize: '14px', fontWeight: 600,
                                            color: 'var(--text-primary, #1e293b)'
                                        }}>{book.title}</div>
                                        <div className="truncate" style={{
                                            fontSize: '12px',
                                            color: 'var(--text-secondary, #475569)'
                                        }}>{book.author}</div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 105px)', gap: '16px 12px', justifyContent: 'center' }}>
                        {folderBooks.map(book => (
                            <CoverCard
                                key={book.id} book={book}
                                coverUrlMap={coverUrlMap} blankImageBooks={blankImageBooks}
                                setBlankImageBooks={setBlankImageBooks}
                                onTap={onTapBook}
                            />
                        ))}
                    </div>
                )
            ) : (
                <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    {isSearch ? 'No books match this search.' : isBookList ? 'No books in this list.' : 'No books in this folder.'}
                </div>
            )}

            {subfolders.length > 0 && (
                <div style={{
                    padding: '10px 16px', fontSize: '13px', textAlign: 'center', marginTop: '16px',
                    color: 'var(--text-secondary, #475569)',
                    borderTop: '1px solid var(--border-default, #e2e8f0)'
                }}>
                    {subfolders.length} subfolder{subfolders.length !== 1 ? 's' : ''}
                </div>
            )}
        </div>
    );
}

// --- BookDetailView component ---

function BookDetailView({ bookId, books, coverUrlMap, blankImageBooks, setBlankImageBooks, tagRegistry }) {
    const book = books.find(b => b.id === bookId);
    if (!book) {
        return <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-muted)' }}>Book not found</div>;
    }

    const imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;
    const isBlank = blankImageBooks.has(book.id);

    return (
        <div style={{ padding: '16px 16px 32px' }}>
            <StarDefs />

            {/* Large cover — v5.6.6: links to Amazon */}
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                <a href={getAmazonUrl(book.asin)} target="_blank" rel="noopener noreferrer">
                {isBlank || !book.coverUrl ? (
                    <div style={{
                        width: '180px', aspectRatio: '2/3', borderRadius: '6px',
                        backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
                    }}>
                        <div style={{ textAlign: 'center', fontFamily: 'var(--font-heading)',
                            fontWeight: 700, fontSize: '14px', lineHeight: 1.3, color: 'var(--text-primary)' }}>
                            {book.title}
                        </div>
                    </div>
                ) : (
                    <img src={imgSrc} alt="" loading="lazy"
                        style={{ width: '180px', aspectRatio: '2/3', objectFit: 'cover',
                            borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' }}
                        onError={() => setBlankImageBooks(prev => new Set([...prev, book.id]))}
                        onLoad={(e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks)}
                    />
                )}
                </a>
            </div>

            {/* Title & Author — v5.6.6: title links to Amazon */}
            <a href={getAmazonUrl(book.asin)} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700,
                    color: 'var(--text-primary)', textAlign: 'center', marginBottom: '4px', lineHeight: 1.3,
                    display: 'block', textDecoration: 'none' }}>
                {book.title}
            </a>
            <p style={{ fontSize: '16px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' }}>
                by {book.author}
            </p>

            {/* Wishlist badge + View on Amazon — v5.6.6: button for all books */}
            <div style={{ textAlign: 'center', marginBottom: '12px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' }}>
                {isWishlisted(book) && (
                    <span style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
                        fontSize: '12px', fontWeight: 600,
                        backgroundColor: 'var(--bg-selected, #dbeafe)', color: 'var(--text-accent, #2563eb)' }}>
                        Wishlist Item
                    </span>
                )}
                {(() => {
                    const atGoal = book.priceTrigger != null && book.currentPrice != null && book.currentPrice <= book.priceTrigger;
                    return (
                        <a href={getAmazonUrl(book.asin)} target="_blank" rel="noopener noreferrer"
                            style={{ display: 'inline-block', padding: '4px 12px', borderRadius: '6px',
                                fontSize: '12px', fontWeight: 600, textDecoration: 'none', color: 'white',
                                backgroundColor: atGoal ? '#22c55e' : '#f97316' }}>
                            View on Amazon {atGoal ? `— $${book.currentPrice.toFixed(2)}` : '→'}
                        </a>
                    );
                })()}
            </div>

            <div style={{ borderTop: '1px solid var(--border-default)', margin: '0 0 16px' }} />

            {/* Rating */}
            {book.rating > 0 && (
                <DetailRow label="Rating">
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                        {renderStars(book.rating)}
                        <span style={{ fontWeight: 700, fontSize: '14px' }}>{book.rating.toFixed(1)}</span>
                        {book.ratingCount && (
                            <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>({book.ratingCount})</span>
                        )}
                    </span>
                </DetailRow>
            )}

            {/* My Rating — v5.6.6: always show */}
            <DetailRow label="My Rating">
                {book.myRating > 0
                    ? renderStars(book.myRating, { color: 'var(--border-focus, #3b82f6)' })
                    : <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Not rated</span>
                }
            </DetailRow>

            {/* Series */}
            {book.series && (
                <DetailRow label="Series">
                    <span style={{ color: 'var(--text-series, #6366f1)' }}>
                        {book.seriesPosition ? `Book ${book.seriesPosition}: ${book.series}` : book.series}
                    </span>
                </DetailRow>
            )}

            {/* Format */}
            {book.binding && <DetailRow label="Format">{book.binding}</DetailRow>}

            {/* Acquired */}
            {book.acquired && <DetailRow label="Acquired">{formatDate(book.acquired)}</DetailRow>}

            {/* Tags */}
            {book.tags && book.tags.length > 0 && (
                <DetailRow label="Tags">
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                        {book.tags.map(tagId => (
                            <span key={tagId} style={{
                                padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
                                backgroundColor: 'var(--bg-selected, #dbeafe)', color: 'var(--text-accent, #1e40af)'
                            }}>
                                {tagRegistry[tagId]?.label || tagId}
                            </span>
                        ))}
                    </div>
                </DetailRow>
            )}

            {/* Collections — v5.6.6: always show */}
            <DetailRow label="Collections">
                {book.collections && book.collections.length > 0
                    ? book.collections.map(c => c.name).join(', ')
                    : <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' }}>No collections</span>
                }
            </DetailRow>

            {/* Notes */}
            {book.userNote && (
                <div style={{ margin: '16px 0', padding: '12px', borderRadius: '8px',
                    backgroundColor: 'var(--bg-surface-alt, #f8fafc)',
                    border: '1px solid var(--border-default, #e2e8f0)' }}>
                    <span style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)',
                        display: 'block', marginBottom: '6px' }}>Notes</span>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>
                        {book.userNote}
                    </p>
                </div>
            )}

            {/* Price */}
            {(book.currentPrice != null || book.priceTrigger != null) && (
                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '12px', marginTop: '12px' }}>
                    {book.currentPrice != null && (
                        <DetailRow label="Price">
                            <span style={{ fontWeight: 700,
                                color: (book.priceTrigger != null && book.currentPrice <= book.priceTrigger)
                                    ? 'var(--text-success, #16a34a)' : 'var(--text-primary)' }}>
                                ${book.currentPrice.toFixed(2)}
                            </span>
                            {book.listPrice && book.listPrice > book.currentPrice && (
                                <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' }}>
                                    <span style={{ textDecoration: 'line-through' }}>${book.listPrice.toFixed(2)}</span>
                                </span>
                            )}
                        </DetailRow>
                    )}
                    {book.priceTrigger != null && (
                        <DetailRow label="Goal">
                            <span style={{ color: 'var(--text-success, #16a34a)' }}>
                                ${book.priceTrigger.toFixed(2)} or less
                            </span>
                        </DetailRow>
                    )}
                </div>
            )}

            {/* Description */}
            {book.description && (
                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '16px', marginTop: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                        Description
                    </h3>
                    <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                        {book.description}
                    </p>
                </div>
            )}

            {/* Top Reviews */}
            {book.topReviews && book.topReviews.length > 0 && (
                <div style={{ borderTop: '1px solid var(--border-default)', paddingTop: '16px', marginTop: '16px' }}>
                    <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' }}>
                        Top Reviews
                    </h3>
                    {book.topReviews.slice(0, 3).map((review, idx) => (
                        <ReviewCard key={idx} review={review} />
                    ))}
                </div>
            )}
        </div>
    );
}

// --- SearchView component ---

function SearchView({ books, folders, folderId, showDealsOnly, showHidden, sortOption, coverUrlMap, blankImageBooks, setBlankImageBooks, tagRegistry, onTapBook, query }) {

    // Collect all bookIds in folder + subfolders recursively
    const scopeBookIds = React.useMemo(() => {
        if (!folderId) return null; // global search
        const ids = new Set();
        const collectIds = (fid) => {
            const folder = folders.find(f => f.id === fid);
            if (folder) {
                (folder.bookIds || []).forEach(id => ids.add(id));
                folders.filter(f => f.parentId === fid).forEach(sub => collectIds(sub.id));
            }
        };
        collectIds(folderId);
        return ids;
    }, [folderId, folders]);

    const results = React.useMemo(() => {
        const q = (query || '').trim().toLowerCase();
        if (!q) return [];
        let filtered = filterBooks(books, { showDealsOnly, showHidden });
        if (scopeBookIds) filtered = filtered.filter(b => scopeBookIds.has(b.id));
        const matched = filtered.filter(book => {
            if (book.title.toLowerCase().includes(q)) return true;
            if (book.author.toLowerCase().includes(q)) return true;
            if (book.series && book.series.toLowerCase().includes(q)) return true;
            if (book.userNote && book.userNote.toLowerCase().includes(q)) return true;
            if (book.tags && book.tags.some(tagId => {
                const label = tagRegistry[tagId]?.label || tagId;
                return label.toLowerCase().includes(q);
            })) return true;
            return false;
        });
        return sortBooks(matched, sortOption);
    }, [query, books, showDealsOnly, showHidden, tagRegistry, sortOption]);

    return (
        <div style={{ paddingTop: '8px' }}>
            {!query || query.trim() === '' ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                    Search by title, author, series, tags, or notes
                </div>
            ) : results.length === 0 ? (
                <div style={{ padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted, #64748b)' }}>
                    No results for "{query.trim()}"
                </div>
            ) : (
                <div>
                    <div style={{ padding: '4px 16px 8px', fontSize: '12px', color: 'var(--text-muted, #64748b)' }}>
                        {results.length} result{results.length !== 1 ? 's' : ''}
                    </div>
                    {results.map(book => {
                        const imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;
                        const isBlank = blankImageBooks.has(book.id);
                        return (
                            <div key={book.id}
                                onClick={() => onTapBook(book.id)}
                                style={{
                                    display: 'flex', gap: '12px', padding: '8px 16px',
                                    borderBottom: '1px solid var(--border-default, #e2e8f0)',
                                    cursor: 'pointer', touchAction: 'manipulation'
                                }}>
                                <div style={{
                                    width: '48px', flexShrink: 0,
                                    aspectRatio: '2/3', borderRadius: '3px', overflow: 'hidden',
                                    boxShadow: '2px 2px 4px 1px rgba(128,128,128,0.4)',
                                    opacity: isWishlisted(book) ? 0.4 : 1
                                }}>
                                    {isBlank || !book.coverUrl ? (
                                        <div style={{
                                            width: '100%', height: '100%',
                                            backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
                                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                                            padding: '4px'
                                        }}>
                                            <div style={{
                                                textAlign: 'center', fontFamily: 'var(--font-heading)',
                                                fontWeight: 700, fontSize: '0.4em', lineHeight: 1.2,
                                                color: 'var(--text-primary, #1e293b)',
                                                overflow: 'hidden', display: '-webkit-box',
                                                WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
                                            }}>{book.title}</div>
                                        </div>
                                    ) : (
                                        <img src={imgSrc} alt="" loading="lazy"
                                            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                                            onError={() => setBlankImageBooks(prev => new Set([...prev, book.id]))}
                                            onLoad={(e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks)}
                                        />
                                    )}
                                </div>
                                <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' }}>
                                    <div className="truncate" style={{
                                        fontSize: '14px', fontWeight: 600,
                                        color: 'var(--text-primary, #1e293b)'
                                    }}>{book.title}</div>
                                    <div className="truncate" style={{
                                        fontSize: '12px',
                                        color: 'var(--text-secondary, #475569)'
                                    }}>{book.author}</div>
                                    {book.rating > 0 && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            {renderStars(book.rating, { size: 12 })}
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted, #64748b)' }}>
                                                {book.rating.toFixed(1)}
                                            </span>
                                        </div>
                                    )}
                                    {book.series && (
                                        <div className="truncate" style={{
                                            fontSize: '11px', fontStyle: 'italic',
                                            color: 'var(--text-muted, #64748b)'
                                        }}>{book.series}{book.seriesPosition ? ` #${book.seriesPosition}` : ''}</div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

// --- Main app ---

// v6.0.0 Phase 2 - Check for #pair= hash fragment and store credentials
// Runs once before React mounts — credentials are available by the time MobileApp initializes
(function checkPairingHash() {
    const hash = window.location.hash;
    if (!hash.startsWith('#pair=')) return;
    try {
        const b64 = hash.slice(6); // strip '#pair='
        const json = atob(b64);
        const creds = JSON.parse(json);
        if (creds.channelId && creds.passphrase) {
            localStorage.setItem(RELAY_KEY, JSON.stringify(creds));
            console.log('✅ Paired via QR: channel ' + creds.channelId.slice(0, 8) + '...');
        }
    } catch (e) {
        console.error('❌ Failed to parse pairing data from URL:', e);
    }
    // Clear hash fragment (don't leave credentials in URL)
    history.replaceState(null, '', window.location.pathname + window.location.search);
})();

// v6.0.0 Phase 2 - Load html5-qrcode scanner library on demand
function loadQRScanner() {
    return new Promise((resolve, reject) => {
        if (window.Html5Qrcode) { resolve(); return; }
        const script = document.createElement('script');
        script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
        script.onload = resolve;
        script.onerror = () => reject(new Error('Failed to load QR scanner library'));
        document.head.appendChild(script);
    });
}

function MobileApp() {
    const [books, setBooks] = useState([]);
    const [folders, setFolders] = useState([]);
    const [tagRegistry, setTagRegistry] = useState({});
    const [pinnedTagFolders, setPinnedTagFolders] = useState([]);
    const [bookLists, setBookLists] = useState([]); // v6.12.0 Phase 8 - curated, supplemental lists
    const [savedSearches, setSavedSearches] = useState([]); // v6.12.0 Phase 8 - saved filter presets (drawer; results 8b)
    const [hiddenInstances, setHiddenInstances] = useState(new Set());
    const [coverUrlMap, setCoverUrlMap] = useState({});
    const [blankImageBooks, setBlankImageBooks] = useState(new Set());
    const [searchQuery, setSearchQuery] = useState('');
    const [loading, setLoading] = useState(true);
    const [loadingMessage, setLoadingMessage] = useState('Loading...'); // v6.0.0 Phase 2 - dynamic loading text
    // v6.0.0 Phase 2 - Pairing state
    const [pairingScreen, setPairingScreen] = useState(() => {
        // Show pairing screen if no relay credentials AND no local books
        const hasCreds = (() => { try { const r = JSON.parse(localStorage.getItem(RELAY_KEY)); return r && r.channelId; } catch { return false; } })();
        if (hasCreds) return null; // Already paired
        return 'prompt'; // 'prompt' | 'scanning' | 'success' | 'error'
    });
    const [pairingError, setPairingError] = useState(null);
    const [pairChannel, setPairChannel] = useState('');
    const [pairPassphrase, setPairPassphrase] = useState('');
    const qrScannerRef = useRef(null);
    const [activeOverlay, setActiveOverlay] = useState(null);
    // iOS "Add to Home Screen" hint banner
    const [showA2HS, setShowA2HS] = useState(() => {
        if (localStorage.getItem('readerwrangler-mobile-a2hs-dismissed')) return false;
        const ua = navigator.userAgent;
        const isIOS = /iPhone|iPad|iPod/.test(ua);
        const isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
        return isIOS && !isStandalone;
    });
    const [navStack, setNavStack] = useState(() => {
        try {
            const saved = JSON.parse(localStorage.getItem(NAV_STACK_KEY));
            if (Array.isArray(saved) && saved.length > 0 && saved[0]?.view === 'dashboard') {
                return saved.map(entry => ({ ...entry, scrollY: 0, shelfScrolls: undefined }));
            }
        } catch {}
        return [{ view: 'dashboard', scrollY: 0 }];
    });
    const scrollRestoreRef = useRef(null);
    // Persisted preferences
    const savedPrefs = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
    const [sortOption, setSortOptionRaw] = useState(() => savedPrefs.sortOption || 'dateAdded');
    const cycleSortOption = useCallback(() => {
        setSortOptionRaw(prev => {
            const idx = SORT_OPTIONS.findIndex(o => o.key === prev);
            const next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key;
            const current = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
            localStorage.setItem(MOBILE_PREFS_KEY, JSON.stringify({ ...current, sortOption: next }));
            return next;
        });
    }, []);
    const [expandedShelves, setExpandedShelvesRaw] = useState(() => new Set(savedPrefs.expandedShelves || []));
    // v1.6.8 - collapsed sections lifted here so the drawer AND Dashboard stay in sync (persisted per-device)
    const [drawerCollapsed, setDrawerCollapsed] = useState(() => {
        try { return JSON.parse(localStorage.getItem('rw_mobile_drawer_collapsed')) || {}; } catch (e) { return {}; }
    });
    const toggleSection = (key) => setDrawerCollapsed(prev => {
        const next = { ...prev, [key]: !prev[key] };
        try { localStorage.setItem('rw_mobile_drawer_collapsed', JSON.stringify(next)); } catch (e) {}
        return next;
    });
    const setExpandedShelves = useCallback((updater) => {
        setExpandedShelvesRaw(prev => {
            const next = typeof updater === 'function' ? updater(prev) : updater;
            const current = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
            localStorage.setItem(MOBILE_PREFS_KEY, JSON.stringify({ ...current, expandedShelves: [...next] }));
            return next;
        });
    }, []);
    const [themePreference, setThemePreference] = useState(
        () => localStorage.getItem(THEME_KEY) || 'auto'
    );
    const [viewMode, setViewMode] = useState(savedPrefs.viewMode || 'covers');
    const [showDealsOnly, setShowDealsOnly] = useState(savedPrefs.showDealsOnly || false);
    const [showHidden, setShowHidden] = useState(savedPrefs.showHidden || false);
    const [folderListSort, setFolderListSort] = useState(null); // v1.7.0-alpha.13 - desktop folder-tree sort mode (order mirror)
    // v1.7.0-alpha.24 - Freshness nudge state:
    // libraryAsOf = the cached payload's source stamp (staleness made legible);
    // newerAvailable = pointer gen newer than the cache → banner; dismissible per-gen.
    const [libraryAsOf, setLibraryAsOf] = useState(null);
    const [newerAvailable, setNewerAvailable] = useState(null);
    const dismissedGenRef = useRef(null);
    const lastFreshCheckRef = useRef(0);

    // v1.7.0-alpha.24 - Freshness check: on load + every tab-return (60s dedupe), ONE KV read of
    // the device-state pointer; the gen id's prefix is its commit time, compared against the
    // cache's source stamp (same clock lineage as the guest guard — on a dev machine the local
    // cache is always fresh, so the banner correctly never fires there).
    // v1.7.0-alpha.25 - MOVED here with the other top-level hooks: it originally sat below the
    // component's conditional early-returns, varying the hook count between the loading render
    // and the loaded one — React #310 crash on any reload (found by TinySuspender, of all things).
    useEffect(() => {
        const check = async () => {
            try {
                const creds = JSON.parse(localStorage.getItem(RELAY_KEY) || 'null');
                if (!creds || !creds.channelId || !window.RWRelay) return;
                if (Date.now() - lastFreshCheckRef.current < 60000) return;
                lastFreshCheckRef.current = Date.now();
                window.RWRelay.initFromStorage();
                const gen = await window.RWRelay.getDeviceStatePointerGen?.();
                if (!gen) return;
                // v1.7.1 - Freshness = GENERATION IDENTITY: is the pointed gen the one this cache
                // came from? The old timestamp compare raced the save stamp against the push time —
                // always ~a debounce apart — so a fully-synced phone nagged forever. Caches that
                // predate the gen record fall back to timestamps with a WIDE margin (15 min).
                const blob = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'); } catch (e) { return {}; } })();
                let newer;
                if (blob.deviceStateGen) {
                    newer = gen !== blob.deviceStateGen;
                } else {
                    const genTime = (window.RWRelay.genTimestamp?.(gen)) || 0;
                    newer = genTime > (blob.savedAt || 0) + 15 * 60 * 1000;
                }
                console.log(`[Freshness] cached gen ${blob.deviceStateGen || '(none)'} vs pointed ${gen} → ${newer ? 'NEWER available' : 'current'}`); // v1.7.2-alpha.3
                if (newer && gen !== dismissedGenRef.current) {
                    setNewerAvailable(gen);
                } else if (!newer) {
                    setNewerAvailable(null);
                }
            } catch (e) { /* freshness is best-effort */ }
        };
        const t = setTimeout(check, 3000); // after the initial load settles
        const onVis = () => { if (document.visibilityState === 'visible') check(); };
        document.addEventListener('visibilitychange', onVis);
        return () => { clearTimeout(t); document.removeEventListener('visibilitychange', onVis); };
    }, []);

    const savePrefs = (updates) => {
        const current = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
        localStorage.setItem(MOBILE_PREFS_KEY, JSON.stringify({ ...current, ...updates }));
    };

    const applyTheme = (pref) => {
        setThemePreference(pref);
        localStorage.setItem(THEME_KEY, pref);
        let effective = pref;
        if (pref === 'auto') {
            effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
        }
        if (effective === 'light') {
            delete document.documentElement.dataset.theme;
        } else {
            document.documentElement.dataset.theme = effective;
        }
    };

    const loadAllData = async () => {
        // v6.0.0 Phase 2 - Pull device-state from relay before loading local data
        const hasCreds = (() => { try { const r = JSON.parse(localStorage.getItem(RELAY_KEY)); return r && r.channelId; } catch { return false; } })();
        if (hasCreds && window.RWRelay) {
            try {
                setLoadingMessage('Syncing with desktop...');
                window.RWRelay.initFromStorage();
                const jsonString = await window.RWRelay.getDeviceState();
                if (jsonString) {
                    const data = JSON.parse(jsonString);
                    if (data.isBackup && data.books?.items?.length) {
                        console.log(`📡 Device-state received: ${data.books.items.length} books`);
                        setLoadingMessage(`Loading ${data.books.items.length.toLocaleString()} books...`);
                        // v1.9.0 (one-table 7.17.0) - deserialize wire items through the shared unpacker
                        // (bookFields.js), with mobile safe-defaults so rendering never hits undefined.
                        const mappedBooks = data.books.items.map(item => unpackBook(item, { safeDefaults: true }));
                        // v6.12.0 Phase 8b - Read Status + Collections ride in a separate collections section
                        // (set together on the Kindle), keyed by asin. They're NOT on the book wire item, so
                        // unpackBook doesn't set them — default them for EVERY book (READ badge / collection
                        // count / Search matcher / filters all read these), then override from the section.
                        const collById = {};
                        (data.collections?.items || []).forEach(c => { collById[c.asin] = c; });
                        mappedBooks.forEach(b => {
                            const c = collById[b.asin];
                            b.readStatus = (c && c.readStatus) || 'UNKNOWN';
                            b.collections = (c && c.collections) || [];
                        });
                        // v1.7.0-alpha.6 - Guest guard (MULTI-INSTANCE.md §3): cache the payload (org keys
                        // AND IndexedDB books — gated together) only when it's NEWER than this browser's
                        // own organization blob. Phone: mobile is the only resident, a fresh push always
                        // wins — unchanged. Dev machine sharing the address with desktop: local truth is
                        // newer, the write would clobber it (the folder-order scrambler). Mobile renders
                        // from the cache either way, so a skip DISPLAYS the fresher local data.
                        // Transition: unstamped payload (pre-alpha.6 push) = stamp 0 → never overwrites an
                        // existing blob; a truly empty universe (new phone pairing) accepts it anyway.
                        const localSavedAt = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').savedAt || 0; } catch { return 0; } })();
                        const payloadSavedAt = data.organization?.savedAt || 0;
                        if (payloadSavedAt > localSavedAt || !localSavedAt) {
                            await saveBooksToIndexedDB(mappedBooks, false);
                            restoreOrganization(data.organization, mappedBooks.map(b => b.id), payloadSavedAt,
                                window.RWRelay.lastDeviceStateGen ? window.RWRelay.lastDeviceStateGen() : null); // v1.7.1
                            console.log('✅ Device-state applied to local storage');
                        } else {
                            console.log(`🛡️ Cache write skipped — local data is newer (guest guard; payload ${payloadSavedAt ? new Date(payloadSavedAt).toLocaleString() : 'unstamped'} vs local ${new Date(localSavedAt).toLocaleString()})`);
                        }
                    }
                } else {
                    console.log('📡 No device-state on relay (404) — using local data');
                }
            } catch (err) {
                console.warn('⚠️ Device-state pull failed, using cached data:', err.message);
            }
        }
        setLoadingMessage('Loading...');

        const loadedBooks = await loadBooksFromIndexedDB();
        setBooks(loadedBooks);

        const savedFolders = readCachedFolders(); // v1.8.0-alpha.1 (F1) - blob-first
        setFolders(savedFolders);

        const orgState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
        const org = orgState.organization || {};
        setTagRegistry(org.tagRegistry || {});
        setPinnedTagFolders(org.pinnedTagFolders || []);
        setBookLists(org.bookLists || []); // v6.12.0 Phase 8
        setSavedSearches(org.savedSearches || []); // v6.12.0 Phase 8
        setHiddenInstances(new Set(org.hiddenInstances || []));
        setBlankImageBooks(new Set(org.blankImageBooks || []));
        // v1.7.0-alpha.13 - Folder-tree sort mode for the order mirror: cached org (phone) ->
        // same-origin EXPLORER_KEY (dev machine, where the guest guard skips the cache and the
        // freshest value is the desktop's own) -> default Manual (null).
        let fls = org.folderListSort || null;
        if (!fls) { try { fls = JSON.parse(localStorage.getItem(EXPLORER_KEY) || '{}').folderListSort || null; } catch (e) {} }
        setFolderListSort(fls);
        setLibraryAsOf(orgState.savedAt || null); // v1.7.0-alpha.24 - the cache's source stamp

        if (loadedBooks.length > 0) {
            const urlMap = await buildCoverUrlMap(loadedBooks);
            setCoverUrlMap(urlMap);
            populateCoverCache(loadedBooks);
        }

        console.log(`✅ Mobile loaded: ${loadedBooks.length} books, ${savedFolders.length} folders`);
        return loadedBooks;
    };

    useEffect(() => {
        loadAllData()
            .then(loadedBooks => {
                // Validate persisted navStack against loaded data
                setNavStack(prev => {
                    if (prev.length <= 1) return prev;
                    const bookIds = new Set(loadedBooks.map(b => b.id));
                    const folderIds = new Set(readCachedFolders().map(f => f.id)); // v1.8.0-alpha.1 (F1) - blob-first
                    for (let i = 1; i < prev.length; i++) {
                        const entry = prev[i];
                        if (entry.view === 'search') {
                            const reset = prev.slice(0, i);
                            persistNavStack(reset);
                            return reset;
                        }
                        if (entry.view === 'folder' && entry.folderId !== '__recent__'
                            && !(entry.folderId?.startsWith('__tag_') && entry.folderId?.endsWith('__'))
                            && !(entry.folderId?.startsWith('__booklist_') && entry.folderId?.endsWith('__'))
                            && !(entry.folderId?.startsWith('__search_') && entry.folderId?.endsWith('__'))
                            && !folderIds.has(entry.folderId)) {
                            const reset = [{ view: 'dashboard', scrollY: 0 }];
                            persistNavStack(reset);
                            return reset;
                        }
                        if (entry.view === 'detail' && !bookIds.has(entry.bookId)) {
                            const reset = [{ view: 'dashboard', scrollY: 0 }];
                            persistNavStack(reset);
                            return reset;
                        }
                    }
                    return prev;
                });
            })
            .catch(err => console.error('❌ Mobile data load failed:', err))
            .finally(() => setLoading(false));
    }, []);

    // Navigation
    const currentNav = navStack[navStack.length - 1];

    const persistNavStack = useCallback((stack) => {
        const stripped = stack.map(({ scrollY, shelfScrolls, ...rest }) => rest);
        localStorage.setItem(NAV_STACK_KEY, JSON.stringify(stripped));
    }, []);

    const navigateTo = useCallback((view, params = {}) => {
        const shelfScrolls = Array.from(document.querySelectorAll('.shelf-scroll')).map(el => el.scrollLeft);
        const scrollY = window.scrollY || document.documentElement.scrollTop || 0;
        setNavStack(prev => {
            const updated = [...prev];
            updated[updated.length - 1] = { ...updated[updated.length - 1], scrollY, shelfScrolls };
            const newStack = [...updated, { view, scrollY: 0, ...params }];
            persistNavStack(newStack);
            return newStack;
        });
        window.scrollTo(0, 0);
    }, [persistNavStack]);

    const goBack = useCallback(() => {
        setNavStack(prev => {
            if (prev.length <= 1) return prev;
            const newStack = prev.slice(0, -1);
            const target = newStack[newStack.length - 1];
            scrollRestoreRef.current = {
                scrollY: target.scrollY || 0,
                shelfScrolls: target.shelfScrolls || []
            };
            persistNavStack(newStack);
            return newStack;
        });
    }, [persistNavStack]);

    // Browser back button support — use hash-based navigation
    useEffect(() => {
        const depth = navStack.length;
        const expectedHash = depth > 1 ? `#nav-${depth}` : '';
        if (window.location.hash !== expectedHash) {
            if (depth > 1) {
                window.location.hash = expectedHash;
            } else if (window.location.hash) {
                history.replaceState(null, '', window.location.pathname + window.location.search);
            }
        }
    }, [navStack.length]);

    useEffect(() => {
        const handleHashChange = () => {
            const hash = window.location.hash;
            const match = hash.match(/^#nav-(\d+)$/);
            const hashDepth = match ? parseInt(match[1], 10) : 1;
            if (hashDepth < navStack.length) {
                goBack();
            }
        };
        window.addEventListener('hashchange', handleHashChange);
        return () => window.removeEventListener('hashchange', handleHashChange);
    }, [navStack.length, goBack]);

    // Restore scroll position after view re-renders on goBack
    useEffect(() => {
        const restore = scrollRestoreRef.current;
        if (!restore) return;
        scrollRestoreRef.current = null;
        requestAnimationFrame(() => {
            window.scrollTo(0, restore.scrollY);
            const shelves = document.querySelectorAll('.shelf-scroll');
            restore.shelfScrolls.forEach((left, i) => {
                if (shelves[i]) shelves[i].scrollLeft = left;
            });
        });
    });

    // Overlay handlers
    const toggleDrawer = () => setActiveOverlay(prev => prev === 'drawer' ? null : 'drawer');
    const toggleMenu = () => setActiveOverlay(prev => prev === 'menu' ? null : 'menu');
    const closeOverlay = () => setActiveOverlay(null);

    // Menu action handlers
    const handleToggleViewMode = () => {
        const next = viewMode === 'covers' ? 'list' : 'covers';
        setViewMode(next);
        savePrefs({ viewMode: next });
    };
    const handleToggleDeals = () => {
        const next = !showDealsOnly;
        setShowDealsOnly(next);
        savePrefs({ showDealsOnly: next });
    };
    const handleToggleHidden = () => {
        const next = !showHidden;
        setShowHidden(next);
        savePrefs({ showHidden: next });
    };
    const handleDesktopMode = () => {
        localStorage.setItem('readerwrangler-desktopMode', 'true');
        location.reload();
    };

    // v6.0.0 Phase 2 - Unpair: clear relay credentials and return to pairing screen
    const handleUnpair = () => {
        if (!confirm('Unpair from desktop? Your local library data will be kept.')) return;
        localStorage.removeItem(RELAY_KEY);
        setPairingScreen('prompt');
    };

    // 1.10.2 (7.25.1) - the book store and other tabs (storage.js): a notice that covers the page — "reset in another
    // tab, this tab's contents are out of date" (with Reload), or "close your other tabs" while a reset waits for them.
    // null | { title, body, reload }. Words from storage.js BOOK_STORE_TEXT.
    const [storeNotice, setStoreNotice] = useState(null);
    useEffect(() => onBookStoreGone((state) => setStoreNotice({
        title: BOOK_STORE_TEXT.goneTitle(state), body: BOOK_STORE_TEXT.goneBody, reload: true
    })), []);

    // Reset App: clear all data and return to pairing screen
    const handleReset = () => {
        if (!confirm('This will clear all ReaderWrangler data from this device, including your pairing credentials.\n\nYou will need to re-pair with your desktop (scan QR code or enter credentials manually) to restore your library.\n\nTip: Use Save Credentials in the Sync section before resetting.\n\nContinue?')) return;
        const keys = ['readerwrangler-state', 'readerwrangler-enriched-cache', 'readerwrangler-settings', 'readerwrangler-status', 'readerwrangler-filters', 'readerwrangler-explorer', 'readerwrangler-folders', 'readerwrangler-mobile-prefs', 'readerwrangler-theme', 'readerwrangler-relay', 'readerwrangler-mobile-nav'];
        keys.forEach(k => localStorage.removeItem(k));
        // 1.10.2 (7.25.1) - the one delete: a delete another tab blocks is WAITED for, saying why (reloading on
        // "blocked" hung the reload behind the pending delete)
        const reload = () => location.reload();
        deleteBookStore({ onBlocked: () => setStoreNotice({ title: '', body: BOOK_STORE_TEXT.blocked, reload: false }) })
            .then(reload, reload);
    };
    const handleSelectFolder = (folderId) => {
        if (folderId === '__all__') {
            const resetStack = [{ view: 'dashboard', scrollY: 0 }];
            setNavStack(resetStack);
            persistNavStack(resetStack);
        } else {
            navigateTo('folder', { folderId });
        }
        closeOverlay();
    };
    // v6.12.0 Phase 8b - Tapping a Search applies its preset to All Books and shows the matches as a
    // results view (reuses the folder view path with a __search_<id>__ id).
    const handleSelectSearch = (searchId) => {
        navigateTo('folder', { folderId: `__search_${searchId}__` });
        closeOverlay();
    };

    // v6.0.0 Phase 2 - QR scanner controls
    const startQRScanner = async () => {
        setPairingScreen('scanning');
        setPairingError(null);
        try {
            await loadQRScanner();
            // Small delay to let React render the scanner container div
            await new Promise(r => setTimeout(r, 100));
            const scanner = new window.Html5Qrcode('qr-reader');
            qrScannerRef.current = scanner;
            await scanner.start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 250, height: 250 } },
                (decodedText) => {
                    // Parse the URL and extract credentials from hash fragment
                    try {
                        const url = new URL(decodedText);
                        const hash = url.hash;
                        if (!hash.startsWith('#pair=')) throw new Error('Not a pairing QR code');
                        const b64 = hash.slice(6);
                        const creds = JSON.parse(atob(b64));
                        if (!creds.channelId || !creds.passphrase) throw new Error('Invalid credentials');
                        // Stop scanner and populate fields for user review
                        scanner.stop().catch(() => {});
                        qrScannerRef.current = null;
                        setPairChannel(creds.channelId);
                        setPairPassphrase(creds.passphrase);

                        setPairingError(null);
                        setPairingScreen('prompt');
                    } catch (e) {
                        console.error('❌ QR decode error:', e);
                        setPairingError('Not a valid ReaderWrangler pairing code. Try again.');
                    }
                }
            );
        } catch (e) {
            console.error('❌ QR scanner failed:', e);
            setPairingError(e.message || 'Could not start camera. Check permissions.');
            setPairingScreen('prompt');
        }
    };

    const stopQRScanner = () => {
        if (qrScannerRef.current) {
            qrScannerRef.current.stop().catch(() => {});
            qrScannerRef.current = null;
        }
        setPairingScreen('prompt');
    };

    // v6.0.0 Phase 2 - Manual credential entry for pairing
    const handleManualPairing = () => {
        const ch = pairChannel.trim();
        const pp = pairPassphrase.trim();
        if (!ch || !pp) { setPairingError('Both Channel ID and Passphrase are required.'); return; }
        completePairing({ channelId: ch, passphrase: pp }, 'manually');
    };

    // v6.0.0 Phase 2 - Import credentials from saved file → populate fields
    const handleFileCredentials = () => {
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.json';
        input.onchange = async (e) => {
            const file = e.target.files?.[0];
            if (!file) return;
            try {
                const text = await file.text();
                const creds = JSON.parse(text);
                if (!creds.channelId || !creds.passphrase) throw new Error('Missing channelId or passphrase');
                setPairChannel(creds.channelId);
                setPairPassphrase(creds.passphrase);
                setPairingError(null);
            } catch (err) {
                setPairingError('Invalid credentials file. Expected JSON with channelId and passphrase.');
            }
        };
        input.click();
    };

    // Shared pairing completion: store creds → success → load
    const completePairing = (creds, method) => {
        localStorage.setItem(RELAY_KEY, JSON.stringify({ channelId: creds.channelId, passphrase: creds.passphrase }));
        if (window.RWRelay) window.RWRelay.initFromStorage();
        console.log(`✅ Paired ${method}: channel ${creds.channelId.slice(0, 8)}...`);
        setPairingError(null);
        setPairingScreen('success');
        setLoading(true);
        setTimeout(() => {
            setPairingScreen(null);
            loadAllData()
                .then(() => setLoading(false))
                .catch(err => { console.error('❌ Post-pair load failed:', err); setLoading(false); });
        }, 1000);
    };

    // v6.0.0 Phase 2 - Pairing screen (shown when no credentials)
    if (pairingScreen) {
        return (
            <div id="splash" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'var(--bg-page, #ffffff)' }}>
                <img src="icons/logo-transparent.png" alt="" style={{ width: '64px', height: '64px', marginBottom: '16px' }} />
                <div style={{ fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '1.5em', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '8px' }}>ReaderWrangler™</div>

                {pairingScreen === 'success' && (
                    <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <div style={{ fontSize: '3em', marginBottom: '12px' }}>✅</div>
                        <div style={{ fontSize: '1.1em', fontWeight: 600, color: 'var(--text-primary, #1e293b)' }}>Paired successfully!</div>
                        <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9em', marginTop: '8px' }}>Loading your library...</div>
                    </div>
                )}

                {pairingScreen === 'scanning' && (
                    <div style={{ width: '100%', maxWidth: '400px', marginTop: '16px' }}>
                        <div style={{ textAlign: 'center', marginBottom: '12px', color: 'var(--text-secondary, #475569)', fontSize: '0.95em' }}>
                            Point your camera at the QR code on your desktop
                        </div>
                        <div id="qr-reader" style={{ width: '100%', borderRadius: '12px', overflow: 'hidden' }}></div>
                        {pairingError && (
                            <div style={{ color: '#dc2626', fontSize: '0.85em', textAlign: 'center', marginTop: '12px' }}>{pairingError}</div>
                        )}
                        <button onClick={stopQRScanner} style={{
                            display: 'block', width: '100%', marginTop: '16px', padding: '14px',
                            background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-primary, #1e293b)',
                            border: '1px solid var(--border-default, #e2e8f0)', borderRadius: '12px',
                            fontSize: '1em', cursor: 'pointer'
                        }}>Cancel</button>
                    </div>
                )}

                {pairingScreen === 'prompt' && (
                    <div style={{ width: '100%', maxWidth: '360px', marginTop: '24px' }}>
                        <div style={{ textAlign: 'center', color: 'var(--text-secondary, #475569)', fontSize: '0.95em', lineHeight: 1.6, marginBottom: '24px' }}>
                            Pair with your desktop to sync your library.
                        </div>

                        {/* Primary: Scan QR */}
                        <button onClick={startQRScanner} style={{
                            display: 'block', width: '100%', padding: '16px', marginBottom: '6px',
                            background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
                            border: 'none', borderRadius: '12px', fontSize: '1.05em', fontWeight: 600, cursor: 'pointer'
                        }}>Scan QR Code</button>
                        <div style={{ textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8em', lineHeight: 1.4, marginBottom: '16px' }}>
                            On your computer, open <strong>File → Relay Setup</strong> to display the QR code.
                        </div>

                        {/* Secondary: Import from file */}
                        <button onClick={handleFileCredentials} style={{
                            display: 'block', width: '100%', padding: '14px', marginBottom: '16px',
                            background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-primary, #1e293b)',
                            border: '1px solid var(--border-default, #e2e8f0)', borderRadius: '12px',
                            fontSize: '0.95em', cursor: 'pointer'
                        }}>Import Credentials from File</button>

                        {pairingError && (
                            <div style={{ color: '#dc2626', fontSize: '0.85em', textAlign: 'center', marginTop: '4px', marginBottom: '4px' }}>{pairingError}</div>
                        )}

                        {/* Credential fields — populated by scan, file import, or manual typing */}
                        <div style={{ marginTop: '4px' }}>
                            <input value={pairChannel} onChange={(e) => setPairChannel(e.target.value)} type="text" placeholder="Channel ID"
                                style={{ width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '8px', border: '1px solid var(--border-default, #e2e8f0)', background: 'var(--bg-surface, #fff)', color: 'var(--text-primary, #1e293b)', fontFamily: 'monospace', fontSize: '0.85em', boxSizing: 'border-box' }} />
                            <input value={pairPassphrase} onChange={(e) => setPairPassphrase(e.target.value)} type="text" placeholder="Passphrase"
                                style={{ width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid var(--border-default, #e2e8f0)', background: 'var(--bg-surface, #fff)', color: 'var(--text-primary, #1e293b)', fontFamily: 'monospace', fontSize: '0.85em', boxSizing: 'border-box' }} />
                            <button onClick={handleManualPairing} disabled={!pairChannel.trim() || !pairPassphrase.trim()} style={{
                                display: 'block', width: '100%', padding: '14px',
                                background: (!pairChannel.trim() || !pairPassphrase.trim()) ? 'var(--bg-muted, #e2e8f0)' : 'var(--bg-accent, #3b82f6)',
                                color: (!pairChannel.trim() || !pairPassphrase.trim()) ? 'var(--text-muted, #94a3b8)' : '#ffffff',
                                border: 'none', borderRadius: '12px',
                                fontSize: '1em', fontWeight: 600, cursor: (!pairChannel.trim() || !pairPassphrase.trim()) ? 'default' : 'pointer'
                            }}>Pair using these credentials</button>
                            <div style={{ textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.78em', lineHeight: 1.4, marginTop: '10px' }}>
                                Save your credentials on your phone so you can re-pair without your computer if you ever need to reset the app.
                            </div>
                        </div>

                        {/* Skip */}
                        <div style={{ textAlign: 'center', marginTop: '24px' }}>
                            <button onClick={() => setPairingScreen(null)} style={{
                                background: 'none', border: 'none', color: 'var(--text-muted, #64748b)',
                                fontSize: '0.85em', cursor: 'pointer', textDecoration: 'underline'
                            }}>Skip — use local data only</button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    if (loading) {
        return (
            <div id="splash" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-page, #ffffff)' }}>
                <img src="icons/logo-transparent.png" alt="" style={{ width: '80px', height: '80px', marginBottom: '20px' }} />
                <div style={{ fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '1.8em', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '8px' }}>ReaderWrangler™</div>
                <div style={{ color: 'var(--text-muted, #64748b)', fontSize: '0.9em', marginBottom: '24px' }}>{loadingMessage}</div>
                <div className="splash-spinner" />
            </div>
        );
    }

    const hasBooks = books.length > 0;

    return (
        <div className="min-h-screen" style={{ background: 'var(--bg-page, #ffffff)', color: 'var(--text-primary, #1e293b)' }}>
            {/* 1.10.2 (7.25.1) - the book-store notice covers everything: nothing behind it may be edited */}
            {storeNotice && (
                <div style={{ position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' }}>
                    <div style={{ background: 'var(--bg-surface, #fff)', borderRadius: '12px', padding: '20px', maxWidth: '360px', width: '100%' }}>
                        {storeNotice.title && <div style={{ fontWeight: 600, marginBottom: '8px' }}>{storeNotice.title}</div>}
                        <div style={{ fontSize: '14px', marginBottom: storeNotice.reload ? '16px' : 0 }}>{storeNotice.body}</div>
                        {storeNotice.reload && (
                            <div style={{ textAlign: 'right' }}>
                                <button onClick={() => location.reload()} style={{ background: '#2563eb', color: '#fff', border: 'none',
                                    borderRadius: '8px', padding: '8px 16px', fontSize: '14px', touchAction: 'manipulation' }}>Reload</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
            {/* v1.7.0-alpha.24 - Freshness banner (mobile twin of desktop's 📡 strip) */}
            {newerAvailable && (
                <div onClick={() => location.reload()} style={{
                    position: 'fixed', top: '48px', left: 0, right: 0, zIndex: 35,
                    background: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
                    borderBottom: '1px solid var(--border-default, #e2e8f0)',
                    padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    fontSize: '13px', cursor: 'pointer', touchAction: 'manipulation'
                }}>
                    {/* v1.7.1 - Both timestamps (Ron, from the nudge's first real-world firing):
                        information, not accusation — judge whether the delta matters before reloading.
                        v1.7.2-alpha.3 - Gen-id suffixes (Ron's call: identity IN the display, pre-launch)
                        + seconds when both stamps share a minute (no more "6:01 newer than 6:01"). */}
                    <span style={{ color: '#1e293b' }}>
                        {(() => {
                            const newerTime = (window.RWRelay && window.RWRelay.genTimestamp) ? window.RWRelay.genTimestamp(newerAvailable) : 0;
                            if (!libraryAsOf || !newerTime) return '📡 Newer library available — tap to refresh';
                            const minuteOf = (t) => Math.floor(t / 60000);
                            const withSeconds = minuteOf(libraryAsOf) === minuteOf(newerTime);
                            const fmt = (t) => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}) });
                            const sfx = (g) => g ? ` (…${String(g).slice(-4)})` : '';
                            const cachedGen = (() => { try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').deviceStateGen || null; } catch (e) { return null; } })();
                            return `📡 Your library is from ${fmt(libraryAsOf)}${sfx(cachedGen)} — a newer one from ${fmt(newerTime)}${sfx(newerAvailable)} is available. Tap to refresh.`;
                        })()}
                    </span>
                    <button onClick={(e) => { e.stopPropagation(); dismissedGenRef.current = newerAvailable; setNewerAvailable(null); }}
                        style={{ background: 'none', border: 'none', color: '#64748b', fontSize: '16px', cursor: 'pointer', padding: '0 4px', touchAction: 'manipulation' }}
                        aria-label="Dismiss">✕</button>
                </div>
            )}
            {/* Header */}
            <Header
                currentNav={currentNav} navStack={navStack} folders={folders} books={books} tagRegistry={tagRegistry} bookLists={bookLists} savedSearches={savedSearches}
                onGoBack={goBack} onToggleDrawer={toggleDrawer} onToggleMenu={toggleMenu}
                hasExpandedShelves={expandedShelves.size > 0}
                onCollapseAll={() => setExpandedShelves(new Set())}
                onOpenSearch={() => {
                    setSearchQuery('');
                    const folderId = currentNav.view === 'folder' ? currentNav.folderId : null;
                    navigateTo('search', folderId ? { folderId } : {});
                }}
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
            />

            {/* Backdrop */}
            {activeOverlay && <Backdrop onClick={closeOverlay} />}

            {/* Folder Drawer */}
            {activeOverlay === 'drawer' && (
                <FolderDrawer
                    collapsed={drawerCollapsed}
                    toggleSection={toggleSection}
                    folders={folders}
                    books={books}
                    showHidden={showHidden}
                    folderListSort={folderListSort}
                    pinnedTagFolders={pinnedTagFolders}
                    tagRegistry={tagRegistry}
                    bookLists={bookLists}
                    savedSearches={savedSearches}
                    onSelectFolder={handleSelectFolder}
                    onSelectSearch={handleSelectSearch}
                    onClose={closeOverlay}
                />
            )}

            {/* App Menu */}
            {activeOverlay === 'menu' && (
                <AppMenu
                    themePreference={themePreference}
                    viewMode={viewMode}
                    showDealsOnly={showDealsOnly}
                    showHidden={showHidden}
                    onApplyTheme={applyTheme}
                    onToggleViewMode={handleToggleViewMode}
                    onToggleDeals={handleToggleDeals}
                    onToggleHidden={handleToggleHidden}
                    onDesktopMode={handleDesktopMode}
                    onUnpair={handleUnpair}
                    onPair={() => setPairingScreen('prompt')}
                    onReset={handleReset}
                    relayCreds={(() => { try { return JSON.parse(localStorage.getItem(RELAY_KEY)); } catch { return null; } })()}
                    libraryAsOf={libraryAsOf}
                    onClose={closeOverlay}
                />
            )}

            {/* Content area (below fixed header) */}
            <div style={{ paddingTop: '48px' }}>
                {!hasBooks ? (
                    <div className="flex flex-col items-center justify-center px-6 text-center" style={{ minHeight: 'calc(100vh - 48px)' }}>
                        <img src="icons/logo-transparent.png" alt="" className="w-20 h-20 mb-4" />
                        <p className="text-lg font-semibold mb-2">
                            Welcome to ReaderWrangler Mobile
                        </p>
                        <p className="text-sm mb-5" style={{ color: 'var(--text-muted, #64748b)' }}>
                            This is the mobile companion to the desktop organizer.
                        </p>

                        <div className="text-sm text-left mb-6 space-y-2 max-w-sm">
                            <p><span className="font-semibold">1.</span> Open ReaderWrangler on your computer</p>
                            <p><span className="font-semibold">2.</span> Go to <strong>File &rarr; Relay Setup</strong></p>
                            <p><span className="font-semibold">3.</span> Scan the QR code to pair</p>
                        </div>

                        <button
                            onClick={() => setPairingScreen('prompt')}
                            className="w-full max-w-sm py-3 px-4 rounded-lg text-white font-semibold text-base"
                            style={{ background: 'var(--bg-accent, #3b82f6)' }}
                        >
                            Pair with Desktop
                        </button>
                    </div>
                ) : currentNav.view === 'folder' ? (
                    <FolderView
                        folderId={currentNav.folderId}
                        books={books} folders={folders} pinnedTagFolders={pinnedTagFolders} tagRegistry={tagRegistry} bookLists={bookLists} savedSearches={savedSearches}
                        showDealsOnly={showDealsOnly} showHidden={showHidden} onToggleHidden={handleToggleHidden} folderListSort={folderListSort}
                        sortOption={sortOption} onCycleSort={cycleSortOption}
                        viewMode={viewMode}
                        coverUrlMap={coverUrlMap} blankImageBooks={blankImageBooks}
                        setBlankImageBooks={setBlankImageBooks}
                        onTapBook={(bookId) => navigateTo('detail', { bookId })}
                        onTapSubfolder={(folderId) => navigateTo('folder', { folderId })}
                    />
                ) : currentNav.view === 'detail' ? (
                    <BookDetailView
                        bookId={currentNav.bookId}
                        books={books}
                        coverUrlMap={coverUrlMap} blankImageBooks={blankImageBooks}
                        setBlankImageBooks={setBlankImageBooks}
                        tagRegistry={tagRegistry}
                    />
                ) : currentNav.view === 'search' ? (
                    <SearchView
                        books={books} folders={folders}
                        folderId={currentNav.folderId || null}
                        showDealsOnly={showDealsOnly} showHidden={showHidden}
                        sortOption={sortOption}
                        coverUrlMap={coverUrlMap} blankImageBooks={blankImageBooks}
                        setBlankImageBooks={setBlankImageBooks}
                        tagRegistry={tagRegistry}
                        onTapBook={(bookId) => navigateTo('detail', { bookId })}
                        query={searchQuery}
                    />
                ) : (
                    <Dashboard
                        collapsed={drawerCollapsed} toggleSection={toggleSection}
                        books={books} folders={folders} pinnedTagFolders={pinnedTagFolders} tagRegistry={tagRegistry} bookLists={bookLists} savedSearches={savedSearches}
                        showDealsOnly={showDealsOnly} showHidden={showHidden} folderListSort={folderListSort} libraryAsOf={libraryAsOf}
                        coverUrlMap={coverUrlMap} blankImageBooks={blankImageBooks}
                        setBlankImageBooks={setBlankImageBooks}
                        onTapBook={(bookId) => navigateTo('detail', { bookId })}
                        onTapFolderTitle={(folderId) => navigateTo('folder', { folderId })}
                        onTapSeries={(folderId) => navigateTo('folder', { folderId })}
                        expandedShelves={expandedShelves}
                        setExpandedShelves={setExpandedShelves}
                    />
                )}
            </div>

            {/* iOS "Add to Home Screen" hint banner */}
            {showA2HS && (
                <div style={{
                    position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 8000,
                    background: 'var(--bg-card, #f0f7ff)', borderTop: '1px solid var(--border-color, #e2e8f0)',
                    padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
                    boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
                }}>
                    <div style={{ flex: 1, fontSize: '0.85em', lineHeight: 1.4, color: 'var(--text-primary, #1e293b)' }}>
                        <strong>Add to Home Screen</strong> for a full-screen app experience.
                        Tap <span style={{ fontSize: '1.1em' }}>⎙</span> then "Add to Home Screen."
                    </div>
                    <button
                        onClick={() => {
                            localStorage.setItem('readerwrangler-mobile-a2hs-dismissed', '1');
                            setShowA2HS(false);
                        }}
                        style={{
                            background: 'none', border: 'none', fontSize: '1.3em', cursor: 'pointer',
                            color: 'var(--text-muted, #64748b)', padding: '4px 8px', flexShrink: 0
                        }}
                        aria-label="Dismiss"
                    >✕</button>
                </div>
            )}
        </div>
    );
}

ReactDOM.render(<MobileApp />, document.getElementById('root'));
