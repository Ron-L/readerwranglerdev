// mobile.js — ReaderWrangler Mobile Viewer
// MOBILE_VERSION tracks mobile-specific iterations
var MOBILE_VERSION = '1.12.0-alpha.1'; // suffix mirrors ORGANIZER_VERSION's -alpha.N in any alpha commit touching this file (Ron, 2026-08-30: invisible changes + no build marker = guaranteed mystery)
rwLog.log('info', 'BOOT', `Phone app ${MOBILE_VERSION} running (page ${APP_VERSION})`);

// v1.7.0 - Which server is this copy talking to? Derived from the page's own address, so an
// installed app inherits the answer from wherever it was installed — which is the whole point
// (the installed-PWA-was-dev hunt, 2026-08-30). Prod stays unbadged; oddballs announce themselves.
var SERVER_ENV = (() => {
  var h = location.hostname;
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
    rwLog.log('info', 'BOOT', `This copy uses the dev relay (${window._RW_RELAY_WORKER_URL})`);
  }
})();
// v1.8.4 - Which relay store this build actually reads (the hidden var made visible). Dev/localhost
// share the dev worker+storage; prod reads prod. Shown on the About panel so "where is my data" is
// answerable, not deduced.
var RELAY_IS_DEV = !!window._RW_RELAY_WORKER_URL && window._RW_RELAY_WORKER_URL.includes('-dev');

// Clear emergency reset timer — app code loaded successfully
if (window._appMountTimer) {clearTimeout(window._appMountTimer);window._appMountTimer = null;}

var { useState, useEffect, useCallback, useMemo, useRef } = React;

// 7.26.0 - The critical box's advice when the phone can't load its library (PHONE-03 at the start, PHONE-06 after pairing):
// the usual "save a backup now" means nothing here — the phone has no Save Backup, and its copy comes from the computer.
var PHONE_LOAD_ADVICE = "Close the app and open it again to try again. Your library on the computer isn't affected. " +
'If this keeps happening, press Copy details and send it to us through Feedback on the computer.';
var MOBILE_PREFS_KEY = 'readerwrangler-mobile-prefs';
var NAV_STACK_KEY = 'readerwrangler-mobile-nav';
var SHELF_LIMIT = 20;

// Inject mobile-only styles (hidden scrollbar for shelf containers, folder tile theme colors)
if (!document.getElementById('mobile-styles')) {
  var style = document.createElement('style');
  style.id = 'mobile-styles';
  style.textContent = [
  '.shelf-scroll::-webkit-scrollbar { display: none }',
  'body { overflow: auto !important; }',
  ':root { --folder-tile-bg: #fffbeb; --folder-tile-border: #fde68a; --cover-border: none; --label-bar-bg: #fffbeb; --label-bar-border: #fde68a; }',
  '[data-theme="dark"] { --folder-tile-bg: #422006; --folder-tile-border: #5c4a2a; --cover-border: 1px solid rgba(255,255,255,0.1); --label-bar-bg: #422006; --label-bar-border: #92400e; }',
  '[data-theme="hc-light"] { --folder-tile-bg: #fffbeb; --folder-tile-border: #d97706; --cover-border: none; }',
  '[data-theme="hc-dark"] { --folder-tile-bg: #451a03; --folder-tile-border: #b45309; --cover-border: 1px solid rgba(255,255,255,0.15); }'].
  join('\n');
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

  var folders = org.folders || [];
  var validIds = new Set(bookIds);

  if (!folders.some((f) => f.id === '__inbox__')) {
    folders.push({ id: '__inbox__', name: 'Inbox', bookIds: [], parentId: null });
  }

  // v1.7.0-alpha.6 - Deny-list spread (MULTI-INSTANCE.md §3): the old allow-list field map
  // STRIPPED sortIndex (and isInbox/description/future pinned) — on a dev machine sharing the
  // address with desktop, this was the folder-order scrambler (the 2026-08-15/08-30 ghost).
  folders = folders.map((f) => ({
    ...f,
    bookIds: (f.bookIds || []).filter((id) => validIds.has(id))
  }));

  // v6.12.0 Phase 8 - Book Lists (curated, supplemental). Filter each list's bookIds to books
  // that actually exist, mirroring how folder bookIds are guarded above.
  var bookLists = (org.bookLists || []).map((bl) => ({
    ...bl,
    bookIds: (bl.bookIds || []).filter((id) => validIds.has(id))
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
      folderListSort: org.explorerSettings && org.explorerSettings.folderListSort || null, // v1.7.0-alpha.13 - folder-tree sort mode (order mirror)
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
    var org = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').organization || {};
    if (Array.isArray(org.folders) && org.folders.length > 0) return org.folders;
  } catch (e) {}
  try {return JSON.parse(localStorage.getItem(FOLDERS_KEY) || '[]');} catch (e) {return [];}
}

// --- SVG Icons (inline, no external deps) ---

var IconHamburger = () => /*#__PURE__*/
React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }, /*#__PURE__*/
React.createElement("line", { x1: "3", y1: "6", x2: "21", y2: "6" }), /*#__PURE__*/React.createElement("line", { x1: "3", y1: "12", x2: "21", y2: "12" }), /*#__PURE__*/React.createElement("line", { x1: "3", y1: "18", x2: "21", y2: "18" })
);

var IconSearch = () => /*#__PURE__*/
React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }, /*#__PURE__*/
React.createElement("circle", { cx: "11", cy: "11", r: "8" }), /*#__PURE__*/React.createElement("line", { x1: "21", y1: "21", x2: "16.65", y2: "16.65" })
);

var IconDots = () => /*#__PURE__*/
React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "currentColor" }, /*#__PURE__*/
React.createElement("circle", { cx: "12", cy: "5", r: "2" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "12", r: "2" }), /*#__PURE__*/React.createElement("circle", { cx: "12", cy: "19", r: "2" })
);

var IconClose = () => /*#__PURE__*/
React.createElement("svg", { width: "20", height: "20", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }, /*#__PURE__*/
React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /*#__PURE__*/React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
);

var IconFolder = () => /*#__PURE__*/
React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/
React.createElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" })
);

var IconCheck = () => /*#__PURE__*/
React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/
React.createElement("polyline", { points: "20 6 9 17 4 12" })
);

var IconBack = () => /*#__PURE__*/
React.createElement("svg", { width: "22", height: "22", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/
React.createElement("polyline", { points: "15 18 9 12 15 6" })
);

var IconFolderLarge = () => /*#__PURE__*/
React.createElement("svg", { width: "36", height: "36", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "1.5", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/
React.createElement("path", { d: "M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" })
);


// --- Star rating system ---

var STAR_PATH = 'M12 2l3.09 6.26L22 9.27l-5 4.87L18.18 22 12 18.27 5.82 22 7 14.14 2 9.27l6.91-1.01L12 2z';

var StarDefs = () => /*#__PURE__*/
React.createElement("svg", { width: "0", height: "0", style: { position: 'absolute' } }, /*#__PURE__*/
React.createElement("defs", null, /*#__PURE__*/
React.createElement("clipPath", { id: "m-star-clip-left" }, /*#__PURE__*/React.createElement("rect", { x: "0", y: "0", width: "12", height: "24" })), /*#__PURE__*/
React.createElement("clipPath", { id: "m-star-clip-right" }, /*#__PURE__*/React.createElement("rect", { x: "12", y: "0", width: "12", height: "24" }))
)
);


var StarSVG = ({ type = 'full', size = 16, color = 'var(--star-color, #eab308)' }) => {
  var emptyColor = 'var(--border-strong, #cbd5e1)';
  if (type === 'half') {
    return (/*#__PURE__*/
      React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", style: { display: 'inline-block', verticalAlign: 'middle' } }, /*#__PURE__*/
      React.createElement("path", { d: STAR_PATH, fill: color, clipPath: "url(#m-star-clip-left)" }), /*#__PURE__*/
      React.createElement("path", { d: STAR_PATH, fill: "none", stroke: emptyColor, strokeWidth: "1.5", clipPath: "url(#m-star-clip-right)" }), /*#__PURE__*/
      React.createElement("path", { d: STAR_PATH, fill: "none", stroke: color, strokeWidth: "0.5", clipPath: "url(#m-star-clip-left)" })
      ));

  }
  return (/*#__PURE__*/
    React.createElement("svg", { width: size, height: size, viewBox: "0 0 24 24", style: { display: 'inline-block', verticalAlign: 'middle' } }, /*#__PURE__*/
    React.createElement("path", { d: STAR_PATH,
      fill: type === 'full' ? color : 'none',
      stroke: type === 'full' ? color : emptyColor,
      strokeWidth: type === 'full' ? '0.5' : '1.5' }
    )
    ));

};

var renderStars = (rating, { size = 16, color = 'var(--star-color, #eab308)' } = {}) => {
  var fullStars = Math.floor(rating);
  var hasHalfStar = rating % 1 >= 0.5;
  var emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
  return (/*#__PURE__*/
    React.createElement("span", { style: { display: 'inline-flex', alignItems: 'center', gap: '1px' } },
    Array.from({ length: fullStars }, (_, i) => /*#__PURE__*/React.createElement(StarSVG, { key: `f${i}`, type: "full", size: size, color: color })),
    hasHalfStar && /*#__PURE__*/React.createElement(StarSVG, { key: "h", type: "half", size: size, color: color }),
    Array.from({ length: emptyStars }, (_, i) => /*#__PURE__*/React.createElement(StarSVG, { key: `e${i}`, type: "empty", size: size, color: color }))
    ));

};

// --- Helper functions ---

function parseBookDate(dateStr) {
  if (!dateStr) return new Date(0);
  var ts = typeof dateStr === 'string' ? parseInt(dateStr) : dateStr;
  if (!isNaN(ts) && ts > 1000000000) {
    return new Date(ts > 9999999999 ? ts : ts * 1000);
  }
  var d = new Date(dateStr);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function filterBooks(books, { showDealsOnly, showHidden }) {
  return books.filter((book) => {
    if (!showHidden && book.isHidden) return false;
    if (showDealsOnly) {
      if (book.priceTrigger == null || book.currentPrice == null) return false;
      if (book.currentPrice > book.priceTrigger) return false;
    }
    return true;
  });
}

var SORT_OPTIONS = [
{ key: 'manual', label: 'Manual Order' },
{ key: 'dateAdded', label: 'Date Added' },
{ key: 'titleAZ', label: 'Title A-Z' },
{ key: 'authorAZ', label: 'Author A-Z' },
{ key: 'rating', label: 'Rating' }];


function sortBooks(books, sortKey) {
  if (sortKey === 'manual') return books; // Preserve folder.bookIds / bookOrder array order
  // v1.7.0-alpha.4 - Universal deterministic tiebreak, IDENTICAL to desktop's (ratified: reading
  // order beats dictionary order — a same-day batch is usually one series). Both surfaces now
  // produce byte-identical order for the same data; ties are never left to array order again.
  // (Infinity - Infinity is NaN, which is falsy, so the || chain skips it.)
  var tiebreak = (a, b) =>
  (a.author || '').localeCompare(b.author || '') ||
  (a.series || '').localeCompare(b.series || '') ||
  (parseFloat(a.seriesPosition) || Infinity) - (parseFloat(b.seriesPosition) || Infinity) ||
  (a.title || '').localeCompare(b.title || '') ||
  (a.asin || '').localeCompare(b.asin || '');
  return [...books].sort((a, b) => {
    var c = 0;
    switch (sortKey) {
      case 'titleAZ':c = a.title.localeCompare(b.title);break;
      case 'authorAZ':c = a.author.localeCompare(b.author);break;
      case 'rating':c = (b.rating || 0) - (a.rating || 0);break;
      case 'dateAdded':
      // v1.7.0 - Date Added now MEANS date added: dateAdded first (the wire carries it as of
      // app 7.6.0), acquisition date only as fallback for stale payloads. The old
      // `acquired || dateAdded` made acquisition win under the Date Added label, and wishlist
      // books (never acquired) sank to the bottom of every date sort.
      // v1.9.0 - the addedToWishlist fallback (wishlist books never acquired) used to live in
      // mapBackupBook's dateAdded; unpackBook keeps dateAdded literal, so it moves here — the sole
      // consumer — preserving the wishlist date-added sort.
      default:c = parseBookDate(b.dateAdded || b.acquired || b.addedToWishlist) - parseBookDate(a.dateAdded || a.acquired || a.addedToWishlist);
    }
    return c || tiebreak(a, b);
  });
}

// v1.7.0-alpha.13 - Mirror of desktop's folder ordering (FOLDER-ORDERING.md: "mobile mirrors the
// app's order, pins included"): pinned folders float above the active sort in their stored manual
// order; Manual = sortIndex (root) / parent's childFolderIds (nested) with name tiebreak; Name = A-Z.
// listSort (the desktop folder-tree sort mode) rides the device-state push; default Manual.
function orderedChildFolders(allFolders, parentId, listSort) {
  var children = allFolders.filter((f) => (f.parentId || null) === (parentId || null));
  var parentFolder = parentId ? allFolders.find((f) => f.id === parentId) : null;
  var orderMap = new Map((parentFolder && parentFolder.childFolderIds || []).map((id, i) => [id, i]));
  var manualCmp = parentId ?
  (a, b) => {
    var pa = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
    var pb = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
    return pa !== pb ? pa - pb : a.name.localeCompare(b.name);
  } :
  (a, b) => {
    var ia = a.sortIndex ?? Infinity;
    var ib = b.sortIndex ?? Infinity;
    return ia !== ib ? ia - ib : a.name.localeCompare(b.name);
  };
  var pinned = children.filter((f) => f.pinned).sort(manualCmp);
  var rest = children.filter((f) => !f.pinned);
  if (listSort && listSort.column === 'title') {
    var dir = listSort.direction === 'desc' ? -1 : 1;
    rest.sort((a, b) => dir * a.name.localeCompare(b.name));
  } else if (listSort && listSort.column === 'count') {
    // v1.7.0-alpha.14 (wave D mirror) - Count = total incl. subfolders, same as desktop
    var byParent = new Map();
    allFolders.forEach((f) => {var p = f.parentId || null;if (!byParent.has(p)) byParent.set(p, []);byParent.get(p).push(f);});
    var totals = new Map();
    var totalOf = (f) => {
      if (totals.has(f.id)) return totals.get(f.id);
      var t = (f.bookIds || []).length;
      for (var c of byParent.get(f.id) || []) t += totalOf(c);
      totals.set(f.id, t);
      return t;
    };
    var _dir = listSort.direction === 'asc' ? 1 : -1;
    rest.sort((a, b) => _dir * (totalOf(a) - totalOf(b)) || a.name.localeCompare(b.name));
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
    var term = filters.search.toLowerCase();
    if (!(book.title || '').toLowerCase().includes(term) &&
    !(book.author || '').toLowerCase().includes(term)) return false;
  }
  if (filters.readStatus && book.readStatus !== filters.readStatus) return false;

  if (filters.collections?.length > 0) {
    var hasUncollected = filters.collections.includes('UNCOLLECTED');
    var otherCollections = filters.collections.filter((c) => c !== 'UNCOLLECTED');
    var bookCollections = book.collections || [];
    var isInCollection = otherCollections.some((c) => bookCollections.some((bc) => bc.name === c));
    var isUncollected = bookCollections.length === 0;
    if (!(hasUncollected && isUncollected || isInCollection)) return false;
  }
  if (filters.minAmazonRating && (
  book.rating === undefined || book.rating < parseFloat(filters.minAmazonRating))) return false;
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
    var hasNotInSeries = filters.series.includes('NOT_IN_SERIES');
    var otherSeries = filters.series.filter((s) => s !== 'NOT_IN_SERIES');
    var bookSeries = book.series || '';
    var isInSeries = otherSeries.includes(bookSeries);
    var isNotInSeries = !bookSeries || bookSeries.trim() === '';
    if (!(hasNotInSeries && isNotInSeries || isInSeries)) return false;
  }
  if (filters.datePreset || filters.dateFrom || filters.dateTo) {
    var fromDate = filters.dateFrom || '';
    var toDate = filters.dateTo || '';
    var range = datePresetRange(filters.datePreset); // v7.21.2 - the shared presets (uiHelpers.js)
    if (range) {fromDate = range.from;toDate = range.to;}
    if (fromDate || toDate) {
      if (!book.acquired) return false;
      var bookDate = parseBookDate(book.acquired).toISOString().split('T')[0];
      if (fromDate && bookDate < fromDate) return false;
      if (toDate && bookDate > toDate) return false;
    }
  }
  if (filters.deals && (
  book.priceTrigger == null || book.currentPrice == null || book.currentPrice > book.priceTrigger)) return false;
  if (filters.tags?.length > 0 &&
  !filters.tags.some((tag) => book.tags?.includes(tag))) return false;

  return true;
}

// v6.12.0 Phase 8b - Chip label for a Search (ported from desktop filterChips/filterChipsLabel). Used to
// show a meaningful label for an unnamed Search in the drawer and as a Dashboard shelf title.
function searchChips(filters, tagRegistry) {
  var parts = [];
  if (filters.search) parts.push(`"${filters.search}"`);
  if (filters.readStatus) parts.push(filters.readStatus === 'READ' ? 'Read' : filters.readStatus === 'UNREAD' ? 'Unread' : filters.readStatus);
  if (filters.tags?.length > 0) parts.push(filters.tags.map((t) => (tagRegistry || {})[t]?.label || t).join(', '));
  if (filters.ownership) parts.push(filters.ownership === 'kindleUnlimited' ? 'KU' : filters.ownership === 'insideAmazon' ? 'Insider' : filters.ownership === 'publicLibraryLending' ? 'Library Loan' : filters.ownership === 'audiblePlus' ? 'Audible Plus' : filters.ownership.charAt(0).toUpperCase() + filters.ownership.slice(1));
  if (filters.collections?.length > 0) parts.push(filters.collections.join(', '));
  if (filters.minAmazonRating) parts.push(`${filters.minAmazonRating}+★`);
  if (filters.minMyRating) parts.push(`My ${filters.minMyRating === 'unrated' ? 'Unrated' : filters.minMyRating + '+★'}`);
  if (filters.series?.length > 0) parts.push(filters.series.map((s) => s === 'NOT_IN_SERIES' ? 'Not in series' : s).join(', '));
  if (filters.datePreset) parts.push(datePresetLabel(filters.datePreset)); // v7.21.2 - shared label (was raw "year2025")
  if (filters.deals) parts.push('Deals');
  return parts;
}
function searchChipsLabel(filters, tagRegistry) {
  var parts = searchChips(filters, tagRegistry);
  if (parts.length === 0) return 'All books';
  if (parts.length <= 2) return parts.join(' · ');
  return `${parts[0]} · +${parts.length - 1} more`;
}

function checkIfBlankImage(img, bookId, setBlankImageBooks) {
  if (img.naturalWidth < 10 || img.naturalHeight < 10) {
    setBlankImageBooks((prev) => new Set([...prev, bookId]));
  }
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  var d = parseBookDate(dateStr);
  if (d.getTime() === 0) return String(dateStr);
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
}

// Collect all bookIds from a folder and all its descendant subfolders
function collectDescendantBookIds(folderId, folders) {
  var ids = [];
  var folder = folders.find((f) => f.id === folderId);
  if (!folder) return ids;
  ids.push(...(folder.bookIds || []));
  var children = folders.filter((f) => f.parentId === folderId);
  for (var child of children) {
    ids.push(...collectDescendantBookIds(child.id, folders));
  }
  return ids;
}

// --- Sub-components ---

function DetailRow({ label, children }) {
  return (/*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', alignItems: 'flex-start', gap: '8px', marginBottom: '10px', fontSize: '14px' } }, /*#__PURE__*/
    React.createElement("span", { style: { fontWeight: 600, color: 'var(--text-secondary, #475569)', minWidth: '80px', flexShrink: 0 } },
    label, ":"
    ), /*#__PURE__*/
    React.createElement("span", { style: { color: 'var(--text-primary, #1e293b)', flex: 1 } },
    children
    )
    ));

}

function ReviewCard({ review }) {
  var stars = review.stars || 0;
  var title = review.title || '';
  var text = review.text || '';
  var reviewer = review.reviewer || '';
  return (/*#__PURE__*/
    React.createElement("div", { style: { padding: '12px', borderRadius: '8px', marginBottom: '10px',
        backgroundColor: 'var(--bg-surface-alt, #f8fafc)',
        border: '1px solid var(--border-default, #e2e8f0)' } }, /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' } }, /*#__PURE__*/
    React.createElement("span", { style: { color: 'var(--star-color, #eab308)', fontSize: '13px' } },
    '★'.repeat(Math.min(stars, 5)), '☆'.repeat(Math.max(0, 5 - stars))
    ),
    title && /*#__PURE__*/React.createElement("span", { style: { fontWeight: 600, fontSize: '13px', color: 'var(--text-primary)' } }, title)
    ),
    reviewer && /*#__PURE__*/React.createElement("p", { style: { fontSize: '12px', color: 'var(--text-muted)', marginBottom: '6px' } }, "by ", reviewer),
    text && /*#__PURE__*/React.createElement("p", { style: { fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5 } }, text)
    ));

}

function FolderTile({ folder, onTap }) {
  var count = (folder.bookIds || []).length;
  return (/*#__PURE__*/
    React.createElement("div", { onClick: onTap, style: { width: '100%', touchAction: 'manipulation', cursor: 'pointer' } }, /*#__PURE__*/
    React.createElement("div", { style: {
        aspectRatio: '2/3', borderRadius: '4px', overflow: 'hidden',
        backgroundColor: 'var(--folder-tile-bg, #fffbeb)',
        border: '1px solid var(--folder-tile-border, #fde68a)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        padding: '8px', gap: '4px',
        boxShadow: '4px 4px 8px 2px rgba(128,128,128,0.5)',
        containerType: 'inline-size'
      } }, /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '50cqw', lineHeight: 1 } }, "\uD83D\uDCC1"), /*#__PURE__*/
    React.createElement("span", { style: {
        fontSize: '12px', fontWeight: 600, textAlign: 'center',
        color: 'var(--text-primary, #1e293b)',
        display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
        overflow: 'hidden', lineHeight: 1.3
      } },
    folder.name
    ), /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '11px', color: 'var(--text-muted, #94a3b8)' } }, "(", count, ")")
    )
    ));

}

// --- Header component ---

function Header({ currentNav, navStack, folders, books, tagRegistry, bookLists, savedSearches, onGoBack, onToggleDrawer, onToggleMenu, hasExpandedShelves, onCollapseAll, onOpenSearch, searchQuery, onSearchQueryChange }) {
  var isDashboard = currentNav.view === 'dashboard';
  var isSearch = currentNav.view === 'search';
  var showBack = !isDashboard;

  // Determine center text — just current context name, not full breadcrumb
  var folderName = (id) => {
    if (id === '__recent__') return 'All Books';
    if (id?.startsWith('__tag_') && id?.endsWith('__')) {
      var tagId = id.slice(6, -2);
      return tagRegistry[tagId]?.label || 'Tag View';
    }
    if (id?.startsWith('__booklist_') && id?.endsWith('__')) {
      var blId = id.slice(11, -2);
      var bl = (bookLists || []).find((b) => b.id === blId);
      return bl ? bl.name : 'Book List';
    }
    if (id?.startsWith('__search_') && id?.endsWith('__')) {
      var sId = id.slice(9, -2);
      var sv = (savedSearches || []).find((s) => s.id === sId);
      if (!sv) return 'Search';
      return sv.name && sv.name.trim() ? sv.name : searchChipsLabel(sv.filters, tagRegistry);
    }
    var f = folders.find((fl) => fl.id === id);
    return f ? f.name : 'Library';
  };
  var centerText = 'ReaderWrangler';
  if (currentNav.view === 'folder') {
    centerText = folderName(currentNav.folderId);
  } else if (currentNav.view === 'detail') {
    var prev = navStack.length >= 2 ? navStack[navStack.length - 2] : null;
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
    return (/*#__PURE__*/
      React.createElement("div", { className: "fixed top-0 left-0 right-0 flex items-center gap-2 px-3 z-40",
        style: {
          height: '48px',
          background: 'var(--bg-surface, #ffffff)',
          borderBottom: '1px solid var(--border-default, #e2e8f0)',
          color: 'var(--text-primary, #1e293b)'
        } }, /*#__PURE__*/
      React.createElement("button", { onClick: onGoBack, className: "p-2 -ml-1 flex-shrink-0", style: { touchAction: 'manipulation' }, title: "Back", "aria-label": "Back" }, /*#__PURE__*/
      React.createElement(IconBack, null)
      ), /*#__PURE__*/
      React.createElement("div", { style: {
          flex: 1, position: 'relative', display: 'flex', alignItems: 'center'
        } }, /*#__PURE__*/
      React.createElement("input", {
        ref: (el) => {if (el && !el._focused) {el.focus();el._focused = true;}},
        type: "text",
        value: searchQuery || '',
        onChange: (e) => onSearchQueryChange(e.target.value),
        placeholder: currentNav.folderId ? `Search in ${folderName(currentNav.folderId)}...` : 'Search all books...',
        style: {
          width: '100%', padding: '6px 32px 6px 12px',
          fontSize: '15px', border: '1px solid var(--border-default, #e2e8f0)',
          borderRadius: '8px', outline: 'none',
          background: 'var(--bg-page, #f8fafc)',
          color: 'var(--text-primary, #1e293b)'
        } }
      ),
      searchQuery && /*#__PURE__*/
      React.createElement("button", { onClick: () => onSearchQueryChange(''),
        className: "flex-shrink-0",
        style: {
          position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
          padding: '2px', touchAction: 'manipulation',
          color: 'var(--text-muted, #64748b)', background: 'none', border: 'none'
        },
        title: "Clear search",
        "aria-label": "Clear search" }, /*#__PURE__*/
      React.createElement("svg", { width: "16", height: "16", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round" }, /*#__PURE__*/
      React.createElement("line", { x1: "18", y1: "6", x2: "6", y2: "18" }), /*#__PURE__*/React.createElement("line", { x1: "6", y1: "6", x2: "18", y2: "18" })
      )
      )

      )
      ));

  }

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed top-0 left-0 right-0 flex items-center justify-between px-3 z-40",
      style: {
        height: '48px',
        background: 'var(--bg-surface, #ffffff)',
        borderBottom: '1px solid var(--border-default, #e2e8f0)',
        color: 'var(--text-primary, #1e293b)'
      } }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center" }, /*#__PURE__*/
    React.createElement("button", { onClick: onToggleDrawer, className: "p-2 -ml-1", style: { touchAction: 'manipulation' }, title: "Folders", "aria-label": "Folders" }, /*#__PURE__*/
    React.createElement(IconHamburger, null)
    ),
    showBack && /*#__PURE__*/
    React.createElement("button", { onClick: onGoBack, className: "p-2", style: { touchAction: 'manipulation' }, title: "Back", "aria-label": "Back" }, /*#__PURE__*/
    React.createElement(IconBack, null)
    )

    ), /*#__PURE__*/
    React.createElement("span", { className: "truncate", style: {
        fontFamily: isDashboard ? "'Libre Baskerville', Georgia, serif" : 'var(--font-body)',
        fontSize: isDashboard ? '16px' : '15px',
        fontWeight: isDashboard ? 700 : 600,
        flex: 1, textAlign: 'center', padding: '0 8px'
      } },

    SERVER_ENV.chip && /*#__PURE__*/
    React.createElement("span", { style: {
        fontSize: '9px', fontWeight: 700, letterSpacing: '0.5px',
        padding: '1px 5px', borderRadius: '4px', marginRight: '6px',
        // v1.10.0 - contributor mode in ORANGE, matching the desktop badge (the fail-safe color)
        background: isContributor() ? '#ea580c' : '#6366f1', color: '#ffffff', verticalAlign: 'middle'
      } }, SERVER_ENV.chip),

    centerText
    ), /*#__PURE__*/
    React.createElement("div", { className: "flex items-center gap-1" },
    isDashboard && /*#__PURE__*/
    React.createElement("button", { onClick: hasExpandedShelves ? onCollapseAll : undefined,
      className: "p-2",
      style: { touchAction: 'manipulation', opacity: hasExpandedShelves ? 1 : 0, pointerEvents: hasExpandedShelves ? 'auto' : 'none' },
      title: "Collapse All" }, /*#__PURE__*/
    React.createElement("svg", { width: "18", height: "18", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2.5", strokeLinecap: "round", strokeLinejoin: "round" }, /*#__PURE__*/
    React.createElement("polyline", { points: "18 15 12 9 6 15" })
    )
    ), /*#__PURE__*/

    React.createElement("button", { onClick: onOpenSearch, className: "p-2", style: { touchAction: 'manipulation' }, title: "Search books", "aria-label": "Search books" }, /*#__PURE__*/
    React.createElement(IconSearch, null)
    ), /*#__PURE__*/
    React.createElement("button", { onClick: onToggleMenu, className: "p-2 -mr-1", style: { touchAction: 'manipulation' }, title: "Menu", "aria-label": "Menu" }, /*#__PURE__*/
    React.createElement(IconDots, null)
    )
    )
    ));

}

// --- Backdrop ---

function Backdrop({ onClick }) {
  return (/*#__PURE__*/
    React.createElement("div", { onClick: onClick, className: "fixed inset-0 z-40",
      style: { background: 'rgba(0,0,0,0.4)' } }));

}

// --- Folder Drawer ---

function FolderDrawer({ folders, books, pinnedTagFolders, tagRegistry, bookLists, savedSearches, showHidden, folderListSort, onSelectFolder, onSelectSearch, onClose, collapsed, toggleSection }) {
  var inbox = folders.find((f) => f.id === '__inbox__');
  var inboxCount = inbox ? (inbox.bookIds || []).length : 0;
  // User folders: top-level (parentId === null), excluding Inbox
  // v1.7.0-alpha.13 - Desktop's order (pins + sortIndex/Name), not raw array order
  var topLevel = orderedChildFolders(folders, null, folderListSort).filter((f) => f.id !== '__inbox__');
  var childrenOf = (parentId) => orderedChildFolders(folders, parentId, folderListSort);

  // v1.6.9 - per-folder collapse in the drawer tree (drawer-local, persisted)
  var [collapsedFolders, setCollapsedFolders] = useState(() => {
    try {return JSON.parse(localStorage.getItem('rw_mobile_folders_collapsed')) || {};} catch (e) {return {};}
  });
  var toggleFolder = (id) => setCollapsedFolders((prev) => {
    var next = { ...prev, [id]: !prev[id] };
    try {localStorage.setItem('rw_mobile_folders_collapsed', JSON.stringify(next));} catch (e) {}
    return next;
  });
  // v1.6.10 - collapse/expand ALL subfolders at once (matches the desktop left pane's collapse-all)
  var foldersWithChildren = folders.filter((f) => childrenOf(f.id).length > 0).map((f) => f.id);
  var anyFolderExpanded = foldersWithChildren.some((id) => !collapsedFolders[id]);
  var collapseAllFolders = () => {
    var next = {};
    foldersWithChildren.forEach((id) => {next[id] = anyFolderExpanded;});
    setCollapsedFolders(next);
    try {localStorage.setItem('rw_mobile_folders_collapsed', JSON.stringify(next));} catch (e) {}
  };

  // v6.12.0 Phase 8 - section header to match desktop's Searches / Book Lists / Folders dividers
  // v1.5.0 - now a collapse toggle (leading chevron + label), matching all three sections
  var SectionHeading = ({ label, sectionKey, extra }) => /*#__PURE__*/
  React.createElement("div", { onClick: () => toggleSection(sectionKey), style: {
      padding: '10px 12px 4px', fontSize: '11px', fontWeight: 700, letterSpacing: '0.05em',
      textTransform: 'uppercase', color: 'var(--text-muted, #64748b)',
      borderTop: '1px solid var(--border-default, #e2e8f0)', marginTop: '4px',
      display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', touchAction: 'manipulation'
    }, role: "button", "aria-expanded": !collapsed[sectionKey], "aria-label": `${collapsed[sectionKey] ? 'Expand' : 'Collapse'} ${label}` }, /*#__PURE__*/
  React.createElement("span", { style: { fontSize: '13px', width: '14px', color: 'var(--text-secondary, #475569)' } }, collapsed[sectionKey] ? '▶' : '▼'), /*#__PURE__*/
  React.createElement("span", null, label),
  extra && /*#__PURE__*/React.createElement("span", { style: { marginLeft: 'auto' }, onClick: (e) => e.stopPropagation() }, extra)
  );


  var renderFolder = (folder, depth = 0) => {
    var count = (folder.bookIds || []).length;
    var children = childrenOf(folder.id);
    var hasChildren = children.length > 0;
    var isCollapsed = !!collapsedFolders[folder.id];
    return (/*#__PURE__*/
      React.createElement("div", { key: folder.id }, /*#__PURE__*/
      React.createElement("div", { className: "w-full flex items-center", style: { paddingLeft: `${12 + depth * 16}px` } },
      hasChildren ? /*#__PURE__*/
      React.createElement("span", { onClick: (e) => {e.stopPropagation();toggleFolder(folder.id);},
        role: "button", "aria-label": isCollapsed ? 'Expand subfolders' : 'Collapse subfolders',
        style: { width: '22px', flexShrink: 0, textAlign: 'center', fontSize: '11px', color: 'var(--text-muted, #64748b)', cursor: 'pointer', padding: '8px 0', touchAction: 'manipulation' } },
      isCollapsed ? '▸' : '▾'
      ) : /*#__PURE__*/

      React.createElement("span", { style: { width: '22px', flexShrink: 0 } }), /*#__PURE__*/

      React.createElement("button", {
        onClick: () => onSelectFolder(folder.id),
        className: "flex-1 text-left py-2 pr-3 flex items-center gap-2 text-sm",
        style: { color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' } }, /*#__PURE__*/

      React.createElement(IconFolder, null), /*#__PURE__*/
      React.createElement("span", { className: "flex-1 truncate" }, folder.name), /*#__PURE__*/
      React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' } }, "(", count, ")")
      )
      ),
      hasChildren && !isCollapsed && children.map((child) => renderFolder(child, depth + 1))
      ));

  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed top-0 left-0 h-full z-50 flex flex-col overflow-y-auto",
      style: {
        width: '250px',
        background: 'var(--bg-surface, #ffffff)',
        borderRight: '1px solid var(--border-default, #e2e8f0)',
        color: 'var(--text-primary, #1e293b)'
      } }, /*#__PURE__*/

    React.createElement("div", { onClick: () => onSelectFolder('__all__'), className: "flex items-center justify-between px-3 flex-shrink-0",
      style: { height: '48px', borderBottom: '1px solid var(--border-default, #e2e8f0)', cursor: 'pointer', touchAction: 'manipulation' } }, /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-sm" }, "Dashboard"), /*#__PURE__*/
    React.createElement("span", { className: "p-2", onClick: (e) => {e.stopPropagation();onClose();}, title: "Close", role: "button", "aria-label": "Close" }, /*#__PURE__*/React.createElement(IconClose, null))
    ), /*#__PURE__*/


    React.createElement("button", {
      onClick: () => onSelectFolder('__recent__'),
      className: "w-full text-left py-2 px-3 flex items-center gap-2 text-sm",
      style: { paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' } }, /*#__PURE__*/

    React.createElement("span", { style: { fontSize: '16px' } }, "\uD83D\uDCDA"), /*#__PURE__*/
    React.createElement("span", { className: "flex-1" }, "All Books"),

    (() => {
      var hidden = showHidden ? 0 : books.filter((b) => b.isHidden).length;
      var shown = books.length - hidden;
      return (/*#__PURE__*/
        React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' },
          title: hidden > 0 ? `${hidden} book${hidden !== 1 ? 's' : ''} hidden by user` : undefined }, "(",
        shown.toLocaleString(), hidden > 0 ? ` of ${books.length.toLocaleString()}` : '', ")"
        ));

    })()
    ),


    savedSearches && savedSearches.length > 0 && /*#__PURE__*/
    React.createElement("div", { style: { borderLeft: '4px solid var(--section-accent-search)', background: 'var(--section-tint-search)' } }, /*#__PURE__*/
    React.createElement(SectionHeading, { label: "Searches", sectionKey: "searches" }),
    !collapsed.searches && (savedSearches || []).map((s) => {
      var label = s.name && s.name.trim() ? s.name : searchChipsLabel(s.filters, tagRegistry);
      var count = books.filter((b) => bookMatchesFilters(b, s.filters)).length;
      return (/*#__PURE__*/
        React.createElement("button", { key: `search-${s.id}`,
          onClick: () => onSelectSearch && onSelectSearch(s.id),
          className: "w-full text-left py-2 px-3 flex items-center gap-2 text-sm",
          style: { paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' } }, /*#__PURE__*/

        React.createElement("span", { style: { fontSize: '16px' } }, "\uD83D\uDD0D"), /*#__PURE__*/
        React.createElement("span", { className: "flex-1 truncate" }, label), /*#__PURE__*/
        React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' } }, "(", count, ")")
        ));

    })
    ),



    bookLists && bookLists.length > 0 && /*#__PURE__*/
    React.createElement("div", { style: { borderLeft: '4px solid var(--section-accent-booklist)', background: 'var(--section-tint-booklist)' } }, /*#__PURE__*/
    React.createElement(SectionHeading, { label: "Book Lists", sectionKey: "bookLists" }),
    !collapsed.bookLists && (bookLists || []).map((bl) => /*#__PURE__*/
    React.createElement("button", { key: `bl-${bl.id}`,
      onClick: () => onSelectFolder(`__booklist_${bl.id}__`),
      className: "w-full text-left py-2 px-3 flex items-center gap-2 text-sm",
      style: { paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' } }, /*#__PURE__*/

    React.createElement("span", { style: { fontSize: '16px' } }, "\uD83D\uDCCB"), /*#__PURE__*/
    React.createElement("span", { className: "flex-1 truncate" }, bl.name), /*#__PURE__*/
    React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' } }, "(", (bl.bookIds || []).length, ")")
    )
    )
    ), /*#__PURE__*/



    React.createElement("div", { style: { borderLeft: '4px solid var(--section-accent-folder)', background: 'var(--section-tint-folder)' } }, /*#__PURE__*/
    React.createElement(SectionHeading, { label: "Folders", sectionKey: "folders", extra:
      !collapsed.folders && foldersWithChildren.length > 0 ? /*#__PURE__*/
      React.createElement("span", { onClick: collapseAllFolders, role: "button",
        "aria-label": anyFolderExpanded ? 'Collapse all subfolders' : 'Expand all subfolders',
        title: anyFolderExpanded ? 'Collapse all subfolders' : 'Expand all subfolders',
        style: { fontSize: '15px', lineHeight: 1, color: 'var(--text-muted, #64748b)', cursor: 'pointer', padding: '0 4px' } },
      anyFolderExpanded ? '⊟' : '⊞'
      ) :
      null }
    ),
    !collapsed.folders && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/

    React.createElement("button", {
      onClick: () => onSelectFolder('__inbox__'),
      className: "w-full text-left py-2 px-3 flex items-center gap-2 text-sm",
      style: { paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' } }, /*#__PURE__*/

    React.createElement("span", { style: { fontSize: '16px' } }, "\uD83D\uDCE5"), /*#__PURE__*/
    React.createElement("span", { className: "flex-1" }, "Inbox"), /*#__PURE__*/
    React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' } }, "(", inboxCount, ")")
    ),


    pinnedTagFolders.length > 0 && [...pinnedTagFolders].
    sort((a, b) => (a.position ?? 0) - (b.position ?? 0)).
    map((ptf) => {
      var tagLabel = tagRegistry[ptf.tagId]?.label || ptf.tagId;
      var tagCount = books.filter((b) => (b.tags || []).includes(ptf.tagId)).length;
      return (/*#__PURE__*/
        React.createElement("button", { key: `tag-${ptf.tagId}`,
          onClick: () => onSelectFolder(`__tag_${ptf.tagId}__`),
          className: "w-full text-left py-2 px-3 flex items-center gap-2 text-sm",
          style: { paddingLeft: '12px', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' } }, /*#__PURE__*/

        React.createElement("span", { style: { fontSize: '16px' } }, "\uD83C\uDFF7\uFE0F"), /*#__PURE__*/
        React.createElement("span", { className: "flex-1 truncate" }, tagLabel), /*#__PURE__*/
        React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' } }, "(", tagCount, ")")
        ));

    }), /*#__PURE__*/



    React.createElement("div", { className: "py-1" },
    topLevel.length > 0 ?
    topLevel.map((f) => renderFolder(f)) : /*#__PURE__*/

    React.createElement("p", { className: "px-3 py-4 text-xs", style: { color: 'var(--text-muted, #64748b)' } }, "No folders yet. Pair with desktop to sync your library."

    )

    )
    )
    )
    ));

}

// --- App Menu ---

function AppMenu({ themePreference, viewMode, showDealsOnly, showHidden, onApplyTheme, onToggleViewMode, onToggleDeals, onToggleHidden, onDesktopMode, onUnpair, onPair, onReset, relayCreds, libraryAsOf, onClose }) {
  var themeLabels = { auto: 'Auto', light: 'Light', dark: 'Dark' };
  var nextTheme = { auto: 'light', light: 'dark', dark: 'auto' };
  var [showCreds, setShowCreds] = useState(false);
  // 7.26.0 (LOGGING.md §5 step 5.4 — Ron: just a Copy button on the phone, no viewer) - the phone's log, for a message to us
  var [diagCopied, setDiagCopied] = useState(null); // null | 'copied' | 'failed'
  var copyDiagnostics = () => {
    var text = rwLog.diagnosticsText([`Phone app ${MOBILE_VERSION} (page ${APP_VERSION})`]);
    Promise.resolve(navigator.clipboard && navigator.clipboard.writeText(text)).then(
      () => setDiagCopied('copied'),
      () => {rwLog.log('warning', 'PHONE-07', "Diagnostics couldn't be copied (the browser refused the clipboard)");setDiagCopied('failed');});
    setTimeout(() => setDiagCopied(null), 2000);
  };

  return (/*#__PURE__*/
    React.createElement("div", { className: "fixed top-0 right-0 h-full z-50 flex flex-col overflow-y-auto",
      style: {
        width: '250px',
        background: 'var(--bg-surface, #ffffff)',
        borderLeft: '1px solid var(--border-default, #e2e8f0)',
        color: 'var(--text-primary, #1e293b)'
      } }, /*#__PURE__*/

    React.createElement("div", { onClick: onClose, className: "flex items-center justify-between px-3 flex-shrink-0",
      style: { height: '48px', borderBottom: '1px solid var(--border-default, #e2e8f0)', cursor: 'pointer', touchAction: 'manipulation' } }, /*#__PURE__*/
    React.createElement("span", { className: "font-semibold text-sm" }, "Menu"), /*#__PURE__*/
    React.createElement("span", { className: "p-2", title: "Close", role: "button", "aria-label": "Close" }, /*#__PURE__*/React.createElement(IconClose, null))
    ), /*#__PURE__*/

    React.createElement("div", { className: "py-1" }, /*#__PURE__*/
    React.createElement("button", { onClick: onToggleViewMode,
      className: "w-full text-left py-3 px-4 text-sm flex items-center justify-between",
      style: { touchAction: 'manipulation' } }, /*#__PURE__*/
    React.createElement("span", null, "View"), /*#__PURE__*/
    React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' } },
    viewMode === 'covers' ? 'Covers' : 'List'
    )
    ), /*#__PURE__*/


    React.createElement("button", { onClick: () => onApplyTheme(nextTheme[themePreference] || 'auto'),
      className: "w-full text-left py-3 px-4 text-sm flex items-center justify-between",
      style: { touchAction: 'manipulation' } }, /*#__PURE__*/
    React.createElement("span", null, "Theme"), /*#__PURE__*/
    React.createElement("span", { className: "text-xs", style: { color: 'var(--text-muted, #64748b)' } },
    themeLabels[themePreference] || 'Auto'
    )
    ), /*#__PURE__*/


    React.createElement("button", { onClick: onToggleDeals,
      className: "w-full text-left py-3 px-4 text-sm flex items-center justify-between",
      style: { touchAction: 'manipulation' } }, /*#__PURE__*/
    React.createElement("span", null, "Goal Met"),
    showDealsOnly && /*#__PURE__*/React.createElement(IconCheck, null)
    ), /*#__PURE__*/


    React.createElement("button", { onClick: onToggleHidden,
      className: "w-full text-left py-3 px-4 text-sm flex items-center justify-between",
      style: { touchAction: 'manipulation' } }, /*#__PURE__*/
    React.createElement("span", null, "Show Hidden"),
    showHidden && /*#__PURE__*/React.createElement(IconCheck, null)
    ), /*#__PURE__*/


    React.createElement("button", { onClick: onDesktopMode,
      className: "w-full text-left py-3 px-4 text-sm",
      style: { touchAction: 'manipulation' } }, "Desktop Mode"

    ), /*#__PURE__*/


    React.createElement("div", { style: { borderTop: '1px solid var(--border-default, #e2e8f0)', margin: '4px 12px' } }), /*#__PURE__*/


    React.createElement("div", { className: "py-3 px-4 text-sm" }, /*#__PURE__*/
    React.createElement("p", { className: "font-semibold mb-2", style: { color: 'var(--text-primary, #1e293b)' } }, "Sync"),
    relayCreds ? /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center mb-2", style: { color: 'var(--text-secondary, #475569)', fontSize: '0.85em' } }, /*#__PURE__*/
    React.createElement("span", { style: { color: '#16a34a', marginRight: '6px' } }, "\u25CF"), "Paired with desktop"

    ), /*#__PURE__*/
    React.createElement("button", { onClick: () => setShowCreds((prev) => !prev),
      className: "w-full text-left mb-2",
      style: { fontSize: '0.8em', color: 'var(--text-muted, #64748b)', touchAction: 'manipulation' } },
    showCreds ? '▾ Hide credentials' : '▸ Show credentials'
    ),
    showCreds && /*#__PURE__*/
    React.createElement("div", { style: { fontSize: '0.75em', fontFamily: 'monospace', background: 'var(--bg-muted, #f1f5f9)', padding: '8px', borderRadius: '6px', marginBottom: '8px', wordBreak: 'break-all', lineHeight: 1.5 } }, /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/React.createElement("span", { style: { color: 'var(--text-muted, #64748b)' } }, "Channel:"), /*#__PURE__*/React.createElement("br", null), relayCreds.channelId), /*#__PURE__*/
    React.createElement("div", { style: { marginTop: '4px' } }, /*#__PURE__*/React.createElement("span", { style: { color: 'var(--text-muted, #64748b)' } }, "Passphrase:"), /*#__PURE__*/React.createElement("br", null), relayCreds.passphrase), /*#__PURE__*/
    React.createElement("button", { onClick: () => {
        var text = 'Channel ID: ' + relayCreds.channelId + '\nPassphrase: ' + relayCreds.passphrase;
        navigator.clipboard.writeText(text).catch(() => {});
      }, style: {
        marginTop: '6px', padding: '4px 10px', fontSize: '0.9em',
        background: 'var(--bg-surface, #ffffff)', border: '1px solid var(--border-default, #e2e8f0)',
        borderRadius: '4px', cursor: 'pointer', touchAction: 'manipulation'
      } }, "Copy")
    ), /*#__PURE__*/

    React.createElement("button", { onClick: () => {
        var data = JSON.stringify({ channelId: relayCreds.channelId, passphrase: relayCreds.passphrase }, null, 2);
        var blob = new Blob([data], { type: 'application/json' });
        var url = URL.createObjectURL(blob);
        var a = document.createElement('a');
        a.href = url;
        a.download = 'readerwrangler-credentials.json';
        a.click();
        URL.revokeObjectURL(url);
      }, style: {
        width: '100%', padding: '8px', fontSize: '0.85em', marginBottom: '8px',
        background: 'var(--bg-muted, #f1f5f9)', border: '1px solid var(--border-default, #e2e8f0)', borderRadius: '6px',
        color: 'var(--text-primary, #1e293b)', cursor: 'pointer', touchAction: 'manipulation'
      } }, "Save Credentials to File"

    ), /*#__PURE__*/
    React.createElement("button", { onClick: () => {onClose();onUnpair();},
      style: {
        width: '100%', padding: '8px', fontSize: '0.85em',
        background: 'none', border: '1px solid #dc2626', borderRadius: '6px',
        color: '#dc2626', cursor: 'pointer', touchAction: 'manipulation'
      } }, "Unpair"

    )
    ) : /*#__PURE__*/

    React.createElement(React.Fragment, null, /*#__PURE__*/
    React.createElement("div", { style: { color: 'var(--text-muted, #64748b)', fontSize: '0.85em', marginBottom: '8px' } }, "Not paired with desktop."

    ), /*#__PURE__*/
    React.createElement("button", { onClick: () => {onClose();onPair();},
      style: {
        width: '100%', padding: '8px', fontSize: '0.85em',
        background: 'var(--bg-accent, #3b82f6)', border: 'none', borderRadius: '6px',
        color: '#ffffff', cursor: 'pointer', touchAction: 'manipulation'
      } }, "Pair with Desktop"

    )
    )

    ), /*#__PURE__*/


    React.createElement("div", { style: { borderTop: '1px solid var(--border-default, #e2e8f0)', margin: '4px 12px' } }), /*#__PURE__*/


    React.createElement("button", { onClick: () => {onClose();onReset();},
      className: "w-full text-left py-3 px-4 text-sm",
      style: { color: '#dc2626', touchAction: 'manipulation' } }, "Reset App"

    ), /*#__PURE__*/


    React.createElement("div", { style: { borderTop: '1px solid var(--border-default, #e2e8f0)', margin: '4px 12px' } }), /*#__PURE__*/


    React.createElement("div", { className: "py-3 px-4 text-xs", style: { color: 'var(--text-muted, #64748b)' } }, /*#__PURE__*/
    React.createElement("p", { className: "font-semibold mb-1", style: { color: 'var(--text-primary, #1e293b)' } }, "Help & About"), /*#__PURE__*/
    React.createElement("p", null, /*#__PURE__*/React.createElement("a", { href: "changelog.html", style: { color: 'var(--text-link, #2563eb)', textDecoration: 'none' } }, "App v", APP_VERSION)), /*#__PURE__*/
    React.createElement("p", null, "Mobile v", MOBILE_VERSION), /*#__PURE__*/
    React.createElement("p", null, "Server: ", SERVER_ENV.label),
    RELAY_IS_DEV && /*#__PURE__*/React.createElement("p", null, "Relay: Dev relay worker + storage"),
    libraryAsOf && /*#__PURE__*/React.createElement("p", null, "Library as of ", new Date(libraryAsOf).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }), (() => {try {var g = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').deviceStateGen;return g ? ` (copy …${String(g).slice(-4)})` : '';} catch (e) {return '';}})()), /*#__PURE__*/
    React.createElement("button", { type: "button", "data-copy-diagnostics": true, onClick: copyDiagnostics,
      className: "mt-2 py-1 px-3 rounded text-xs",
      style: { border: '1px solid var(--border-default, #e2e8f0)', color: 'var(--text-primary, #1e293b)', touchAction: 'manipulation' } },
    diagCopied === 'copied' ? 'Copied' : diagCopied === 'failed' ? "Couldn't copy" : 'Copy diagnostics'
    )
    )
    )
    ));

}

// --- CoverCard component ---

function CoverCard({ book, coverUrlMap, blankImageBooks, setBlankImageBooks, onTap, fillWidth }) {
  var isBlank = blankImageBooks.has(book.id);
  var imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;

  return (/*#__PURE__*/
    React.createElement("div", { onClick: () => onTap && onTap(book.id),
      style: { width: fillWidth ? '100%' : '105px', flexShrink: 0, touchAction: 'manipulation', cursor: onTap ? 'pointer' : 'default' } }, /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'relative',
        aspectRatio: '2/3',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '4px 4px 8px 2px rgba(128,128,128,0.5)',
        border: 'var(--cover-border, none)'
      } },
    isBlank || !book.coverUrl ? /*#__PURE__*/
    React.createElement("div", { style: {
        width: '100%', height: '100%',
        backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: '8px',
        opacity: isWishlisted(book) || book.isHidden ? 0.4 : 1
      } }, /*#__PURE__*/
    React.createElement("div", { style: {
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
      } },
    book.title
    )
    ) : /*#__PURE__*/

    React.createElement("img", {
      src: imgSrc,
      alt: "",
      loading: "lazy",
      style: { width: '100%', height: '100%', objectFit: 'cover',
        opacity: isWishlisted(book) || book.isHidden ? 0.4 : 1 },
      onError: () => setBlankImageBooks((prev) => new Set([...prev, book.id])),
      onLoad: (e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks) }
    ),

    book.isHidden && /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'absolute', inset: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        pointerEvents: 'none'
      } }, /*#__PURE__*/
    React.createElement("svg", { viewBox: "0 0 100 100", style: { width: '85%', height: 'auto' } }, /*#__PURE__*/
    React.createElement("circle", { cx: "50", cy: "50", r: "39", fill: "none", stroke: "#dc2626", strokeWidth: "12" }), /*#__PURE__*/
    React.createElement("line", { x1: "22", y1: "22", x2: "78", y2: "78", stroke: "#dc2626", strokeWidth: "12", strokeLinecap: "round" })
    )
    ),



    book.rating > 0 && /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'absolute', top: '3px', right: '3px',
        backgroundColor: 'rgba(0,0,0,0.75)', borderRadius: '3px',
        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
        color: '#facc15', whiteSpace: 'nowrap'
      } }, "\u2605 ",
    book.rating.toFixed(1)
    ),


    book.readStatus === 'READ' && /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'absolute', bottom: '3px', right: '3px',
        backgroundColor: '#16a34a', borderRadius: '50%',
        width: '18px', height: '18px',
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }, title: "Read" }, /*#__PURE__*/
    React.createElement("svg", { viewBox: "0 0 20 20", fill: "white", style: { width: '12px', height: '12px' } }, /*#__PURE__*/
    React.createElement("path", { fillRule: "evenodd", d: "M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z", clipRule: "evenodd" })
    )
    ),


    book.collections && book.collections.length > 0 ? /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'absolute', top: '3px', left: '3px',
        backgroundColor: 'rgba(55,65,81,0.75)', borderRadius: '3px',
        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
        color: 'white', whiteSpace: 'nowrap'
      } }, "\uD83D\uDCC1 ",
    book.collections.length
    ) :
    isWishlisted(book) && /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'absolute', top: '3px', left: '3px',
        backgroundColor: 'rgba(219,39,119,0.85)', borderRadius: '3px',
        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
        color: 'white', letterSpacing: '1px', whiteSpace: 'nowrap'
      } }, "\u2661+"

    ),


    isWishlisted(book) && book.currentPrice != null ? /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'absolute', bottom: '3px', left: '3px',
        backgroundColor: book.priceTrigger && book.currentPrice <= book.priceTrigger ? '#22c55e' : '#6b7280',
        opacity: 0.9, borderRadius: '3px',
        padding: '1px 5px', fontSize: '10px', fontWeight: 700,
        color: 'white', whiteSpace: 'nowrap'
      },
      title: book.priceTrigger ? `Goal: $${book.priceTrigger.toFixed(2)} or less` : 'Current price' },
    "$",
    book.currentPrice.toFixed(2)
    ) :
    book.ownershipType && book.ownershipType !== 'purchased' && (() => {
      var badgeConfig = {
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
      var config = badgeConfig[book.ownershipType];
      return config ? /*#__PURE__*/
      React.createElement("div", { style: {
          position: 'absolute', bottom: '3px', left: '3px',
          backgroundColor: config.bg, opacity: 0.9, borderRadius: '3px',
          padding: '1px 5px', fontSize: '10px', fontWeight: 700,
          color: 'white', whiteSpace: 'nowrap'
        } },
      config.text
      ) :
      null;
    })()
    ), /*#__PURE__*/
    React.createElement("div", { className: "truncate", style: {
        marginTop: '4px', fontSize: '12px', fontWeight: 600,
        lineHeight: 1.3, color: 'var(--text-primary, #1e293b)'
      } },
    book.title
    ), /*#__PURE__*/
    React.createElement("div", { className: "truncate", style: {
        fontSize: '11px', lineHeight: 1.3,
        color: 'var(--text-secondary, #475569)'
      } },
    book.author
    )
    ));

}

// --- Shelf component ---

function Shelf({ title, count, sections, isCapped, isExpanded, coverUrlMap, blankImageBooks, setBlankImageBooks, onTapTitle, onTapBook, onTapSeries, onTapShowAll, onShowLess, isShelfCollapsed, onToggleShelf }) {
  var scrollRef = useRef(null);
  var [labelBars, setLabelBars] = useState([]);
  var [scrollMetrics, setScrollMetrics] = useState({ thumbWidth: 0, thumbLeft: 0, trackWidth: 0, visible: false });
  var trackRef = useRef(null);
  var hasSeries = sections.some((s) => s.type === 'series');

  // Track scroll to update floating series label bar positions
  useEffect(() => {
    if (!hasSeries) return;
    var container = scrollRef.current;
    if (!container) return;

    var updateLabels = () => {
      var containerRect = container.getBoundingClientRect();
      var bars = [];

      // Find all series sections by data attribute
      var seriesEls = container.querySelectorAll('[data-series-id]');
      seriesEls.forEach((el) => {
        var seriesId = el.dataset.seriesId;
        var seriesName = el.dataset.seriesName;
        var seriesCount = el.dataset.seriesCount;
        var seriesFolderId = el.dataset.seriesFolderId;

        // Get all items (folder tile + books) in this series
        var items = container.querySelectorAll(`[data-section="${seriesId}"]`);
        if (items.length === 0) return;

        // Find leftmost and rightmost visible items
        var leftMost = Infinity,rightMost = -Infinity;
        var anyVisible = false;

        items.forEach((item) => {
          var r = item.getBoundingClientRect();
          var itemLeft = r.left - containerRect.left;
          var itemRight = r.right - containerRect.left;

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
    var rafId = requestAnimationFrame(updateLabels);

    return () => {
      container.removeEventListener('scroll', updateLabels);
      window.removeEventListener('resize', updateLabels);
      cancelAnimationFrame(rafId);
    };
  }, [hasSeries, sections]);

  // v6.12.0 Phase 8b - Custom scrollbar metrics: show the slider whenever the row overflows the screen,
  // not only when expanded. Gives a visible scrub affordance + "there's more →" cue on every long shelf.
  useEffect(() => {
    var container = scrollRef.current;
    if (!container) return;

    var update = () => {
      var { scrollLeft, scrollWidth, clientWidth } = container;
      if (scrollWidth <= clientWidth + 1) {
        setScrollMetrics((prev) => ({ ...prev, visible: false }));
        return;
      }
      var trackWidth = clientWidth - 32; // 16px padding each side
      var ratio = clientWidth / scrollWidth;
      var thumbWidth = Math.max(30, trackWidth * ratio);
      var scrollRange = scrollWidth - clientWidth;
      var thumbRange = trackWidth - thumbWidth;
      var thumbLeft = scrollRange > 0 ? scrollLeft / scrollRange * thumbRange : 0;
      setScrollMetrics({ thumbWidth, thumbLeft: thumbLeft + 16, trackWidth, visible: true });
    };

    update();
    container.addEventListener('scroll', update);
    window.addEventListener('resize', update);
    var raf = requestAnimationFrame(update);
    return () => {
      container.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(raf);
    };
  }, [isExpanded, sections]);

  // Custom scrollbar touch drag handler
  var handleThumbDrag = useCallback((startEvent) => {
    startEvent.preventDefault();
    var container = scrollRef.current;
    var track = trackRef.current;
    if (!container || !track) return;

    var trackRect = track.getBoundingClientRect();
    var { scrollWidth, clientWidth } = container;
    var scrollRange = scrollWidth - clientWidth;
    var trackWidth = trackRect.width;
    var thumbWidth = Math.max(30, trackWidth * (clientWidth / scrollWidth));
    var thumbRange = trackWidth - thumbWidth;

    var startX = startEvent.touches[0].clientX;
    var startScrollLeft = container.scrollLeft;

    var onMove = (e) => {
      var dx = e.touches[0].clientX - startX;
      var scrollDelta = thumbRange > 0 ? dx / thumbRange * scrollRange : 0;
      container.scrollLeft = Math.max(0, Math.min(scrollRange, startScrollLeft + scrollDelta));
    };
    var onEnd = () => {
      document.removeEventListener('touchmove', onMove);
      document.removeEventListener('touchend', onEnd);
    };
    document.addEventListener('touchmove', onMove, { passive: false });
    document.addEventListener('touchend', onEnd);
  }, []);

  var totalBooks = sections.reduce((sum, s) => sum + s.books.length, 0);
  if (totalBooks === 0) return null;

  // Build flat list of items for the scroll row
  // v6.12.0 Phase 8b - series no longer get a redundant folder tile: the tile and the floating label bar
  // both just opened the sub-folder, and the books showed inline anyway. The tappable label bar (with a
  // chevron) is the single "open this series" affordance now. Marker stays for label-bar tracking.
  var items = [];
  sections.forEach((section, si) => {
    if (section.type === 'series') {
      items.push({ type: 'series-marker', section, sectionIndex: si });
    }
    section.books.forEach((book) => {
      items.push({ type: 'book', book, section, sectionIndex: si });
    });
  });
  // v6.12.0 Phase 8b - Show All / Show Less moved to the shelf header (no more in-row end cards).

  return (/*#__PURE__*/
    React.createElement("div", { style: { marginBottom: '24px' } }, /*#__PURE__*/
    React.createElement("div", { className: "flex items-center justify-between",
      onClick: onTapTitle,
      style: { padding: '0 16px', marginBottom: '8px', cursor: onTapTitle ? 'pointer' : 'default', touchAction: 'manipulation' } }, /*#__PURE__*/
    React.createElement("span", { style: {
        fontFamily: 'var(--font-heading)',
        fontSize: '15px', fontWeight: 700,
        color: 'var(--text-primary, #1e293b)'
      } },
    onToggleShelf && /*#__PURE__*/
    React.createElement("span", { onClick: (e) => {e.stopPropagation();onToggleShelf();},
      role: "button", "aria-label": isShelfCollapsed ? 'Expand shelf' : 'Collapse shelf',
      style: { display: 'inline-block', width: '14px', marginRight: '4px', fontSize: '12px', color: 'var(--text-muted, #94a3b8)', cursor: 'pointer' } },
    isShelfCollapsed ? '▸' : '▾'
    ),

    title,
    onTapTitle && /*#__PURE__*/React.createElement("span", { style: { marginLeft: '6px', color: 'var(--text-secondary)', display: 'inline-flex', verticalAlign: 'middle' } }, /*#__PURE__*/
    React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "currentColor", stroke: "none" }, /*#__PURE__*/
    React.createElement("rect", { x: "3", y: "3", width: "6", height: "6", rx: "1" }), /*#__PURE__*/
    React.createElement("rect", { x: "12", y: "3", width: "6", height: "6", rx: "1" }), /*#__PURE__*/
    React.createElement("rect", { x: "3", y: "12", width: "6", height: "6", rx: "1" }), /*#__PURE__*/
    React.createElement("rect", { x: "12", y: "12", width: "6", height: "6", rx: "1" })
    )
    )
    ), /*#__PURE__*/
    React.createElement("span", { style: { display: 'flex', alignItems: 'center', gap: '10px', flexShrink: 0 } },
    (isCapped || isExpanded) && (onTapShowAll || onShowLess) && /*#__PURE__*/
    React.createElement("button", {
      onClick: (e) => {e.stopPropagation();if (isExpanded) {onShowLess && onShowLess();} else {onTapShowAll && onTapShowAll();}},
      style: {
        fontSize: '12px', fontWeight: 600, color: 'var(--text-accent, #3b82f6)',
        background: 'none', border: 'none', padding: 0, cursor: 'pointer',
        touchAction: 'manipulation', whiteSpace: 'nowrap'
      } },
    isExpanded ? 'Show less' : 'Show all'
    ), /*#__PURE__*/

    React.createElement("span", { style: { fontSize: '13px', color: 'var(--text-muted, #94a3b8)' } }, "(", count, ")")
    )
    ),
    !isShelfCollapsed && /*#__PURE__*/
    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { style: { position: 'relative' } }, /*#__PURE__*/
    React.createElement("div", { ref: scrollRef, className: "shelf-scroll", style: {
        display: 'flex', gap: '12px',
        overflowX: 'auto',
        paddingLeft: '16px', paddingRight: '16px',
        paddingBottom: hasSeries ? '32px' : '12px',
        WebkitOverflowScrolling: 'touch',
        scrollbarWidth: 'none',
        msOverflowStyle: 'none'
      } },
    items.map((item, idx) => {
      if (item.type === 'series-marker') {
        // Hidden zero-width marker for label bar tracking
        return /*#__PURE__*/React.createElement("div", { key: `marker-${item.section.folder.id}`,
          "data-series-id": item.section.folder.id,
          "data-series-name": item.section.folder.name,
          "data-series-count": item.section.totalBooks,
          "data-series-folder-id": item.section.folder.id,
          style: { width: 0, flexShrink: 0 } });
      }
      if (item.type === 'book') {
        return /*#__PURE__*/React.createElement("div", { key: item.book.id,
          "data-section": item.section.type === 'series' ? item.section.folder.id : undefined }, /*#__PURE__*/
        React.createElement(CoverCard, {
          book: item.book,
          coverUrlMap: coverUrlMap,
          blankImageBooks: blankImageBooks,
          setBlankImageBooks: setBlankImageBooks,
          onTap: onTapBook }
        )
        );
      }
      return null;
    })
    ),


    labelBars.map((bar) => /*#__PURE__*/
    React.createElement("div", { key: `label-${bar.id}`,
      onClick: () => onTapSeries && onTapSeries(bar.folderId),
      style: {
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
      } }, /*#__PURE__*/
    React.createElement("span", { style: { fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' } }, bar.name), /*#__PURE__*/
    React.createElement("span", { style: { flexShrink: 0, marginLeft: '6px', display: 'flex', alignItems: 'center', gap: '3px', color: 'var(--text-muted, #94a3b8)' } }, "(",
    bar.count, ")", /*#__PURE__*/
    React.createElement("svg", { width: "11", height: "11", viewBox: "0 0 24 24", fill: "currentColor", stroke: "none", style: { opacity: 0.85 } }, /*#__PURE__*/React.createElement("rect", { x: "3", y: "3", width: "6", height: "6", rx: "1" }), /*#__PURE__*/React.createElement("rect", { x: "12", y: "3", width: "6", height: "6", rx: "1" }), /*#__PURE__*/React.createElement("rect", { x: "3", y: "12", width: "6", height: "6", rx: "1" }), /*#__PURE__*/React.createElement("rect", { x: "12", y: "12", width: "6", height: "6", rx: "1" }))
    )
    )
    )
    ),


    scrollMetrics.visible && /*#__PURE__*/
    React.createElement("div", { ref: trackRef, onClick: (e) => {
        var container = scrollRef.current;
        var track = trackRef.current;
        if (!container || !track) return;
        var trackRect = track.getBoundingClientRect();
        var ratio = (e.clientX - trackRect.left) / trackRect.width;
        container.scrollLeft = ratio * (container.scrollWidth - container.clientWidth);
      }, style: {
        position: 'relative',
        height: '8px',
        margin: '6px 16px 0',
        borderRadius: '4px',
        background: 'var(--border-default, #e2e8f0)',
        touchAction: 'none',
        cursor: 'pointer'
      } }, /*#__PURE__*/
    React.createElement("div", {
      onTouchStart: handleThumbDrag,
      style: {
        position: 'absolute',
        top: '0px',
        left: `${scrollMetrics.thumbLeft - 16}px`,
        width: `${scrollMetrics.thumbWidth}px`,
        height: '8px',
        borderRadius: '4px',
        background: 'var(--text-secondary, #64748b)',
        cursor: 'grab',
        touchAction: 'none'
      } }
    )
    )

    )

    ));

}

// --- Dashboard component ---

function Dashboard({ books, folders, pinnedTagFolders, tagRegistry, bookLists, savedSearches, showDealsOnly, showHidden, folderListSort, libraryAsOf, coverUrlMap, blankImageBooks, setBlankImageBooks, onTapBook, onTapFolderTitle, onTapSeries, expandedShelves, setExpandedShelves, collapsed, toggleSection }) {
  // v1.6.10 - per-shelf collapse on the Dashboard (folder shelves), Dashboard-local + persisted
  var [collapsedShelves, setCollapsedShelves] = useState(() => {
    try {return JSON.parse(localStorage.getItem('rw_mobile_shelves_collapsed')) || {};} catch (e) {return {};}
  });
  var toggleShelf = (id) => setCollapsedShelves((prev) => {
    var next = { ...prev, [id]: !prev[id] };
    try {localStorage.setItem('rw_mobile_shelves_collapsed', JSON.stringify(next));} catch (e) {}
    return next;
  });
  // v1.7.2-alpha.1 - Section-wide shelf collapse (desktop's ⊟/⊞ concept): one tap turns a whole
  // section into a names-only list — scanning 40 folder names stops meaning paging through ten
  // screens of cover rows (Ron; the drawer also does names-only, but Murphy says 10% won't find it).
  var setAllShelves = (ids, collapse) => setCollapsedShelves((prev) => {
    var next = { ...prev };
    ids.forEach((id) => {next[id] = collapse;});
    try {localStorage.setItem('rw_mobile_shelves_collapsed', JSON.stringify(next));} catch (e) {}
    return next;
  });

  var filteredBooks = useMemo(() => {
    return filterBooks(books, { showDealsOnly, showHidden });
  }, [books, showDealsOnly, showHidden]);

  var bookMap = useMemo(() => {
    var map = {};
    for (var book of filteredBooks) map[book.id] = book;
    return map;
  }, [filteredBooks]);

  var filteredBookIds = useMemo(() => {
    return new Set(filteredBooks.map((b) => b.id));
  }, [filteredBooks]);

  var shelves = useMemo(() => {
    var result = [];

    // All Books shelf (newest first, expandable)
    // v1.7.0-alpha.4 - Consolidated onto sortBooks so the shelf, the grid view, and desktop
    // all share one Date Added ordering (incl. the universal tiebreak).
    var allByDate = sortBooks(filteredBooks, 'dateAdded');

    if (allByDate.length > 0) {
      var isExpanded = expandedShelves.has('__recent__');
      var effectiveLimit = isExpanded ? Infinity :
      allByDate.length <= SHELF_LIMIT + 1 ? allByDate.length : SHELF_LIMIT;
      var capped = effectiveLimit === Infinity ? allByDate : allByDate.slice(0, effectiveLimit);
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
    var _loop = function (sv) {
      var matched = filteredBooks.filter((b) => bookMatchesFilters(b, sv.filters));
      if (matched.length === 0) return 1; // continue
      var folderId = `__search_${sv.id}__`;
      var title = sv.name && sv.name.trim() ? sv.name : searchChipsLabel(sv.filters, tagRegistry);
      var isExpanded = expandedShelves.has(folderId);
      var effectiveLimit = isExpanded ? Infinity :
      matched.length <= SHELF_LIMIT + 1 ? matched.length : SHELF_LIMIT;
      var capped = effectiveLimit === Infinity ? matched : matched.slice(0, effectiveLimit);
      result.push({
        title,
        count: matched.length,
        sections: [{ type: 'standalone', books: capped }],
        folderId,
        section: 'search',
        isCapped: !isExpanded && capped.length < matched.length
      });
    };for (var sv of savedSearches || []) {if (_loop(sv)) continue;}

    // v6.12.0 Phase 8 - Book List shelves (curated, supplemental), above Folders.
    // Books shown in the list's curated order; tapping the title opens the sortable list view.
    for (var bl of bookLists || []) {
      var listBooks = (bl.bookIds || []).
      filter((id) => filteredBookIds.has(id)).
      map((id) => bookMap[id]).
      filter(Boolean);
      if (listBooks.length === 0) continue;
      var folderId = `__booklist_${bl.id}__`;
      var _isExpanded = expandedShelves.has(folderId);
      var _effectiveLimit = _isExpanded ? Infinity :
      listBooks.length <= SHELF_LIMIT + 1 ? listBooks.length : SHELF_LIMIT;
      var _capped = _effectiveLimit === Infinity ? listBooks : listBooks.slice(0, _effectiveLimit);
      result.push({
        title: bl.name,
        count: listBooks.length,
        sections: [{ type: 'standalone', books: _capped }],
        folderId,
        section: 'booklist',
        isCapped: !_isExpanded && _capped.length < listBooks.length
      });
    }

    // Inbox shelf (second row, after Recently Added)
    var inboxFolder = folders.find((f) => f.id === '__inbox__');
    if (inboxFolder) {
      var inboxBookIds = (inboxFolder.bookIds || []).filter((id) => filteredBookIds.has(id));
      var inboxBooks = inboxBookIds.map((id) => bookMap[id]).filter(Boolean);
      if (inboxBooks.length > 0) {
        var _isExpanded2 = expandedShelves.has('__inbox__');
        var _effectiveLimit2 = _isExpanded2 ? Infinity :
        inboxBooks.length <= SHELF_LIMIT + 1 ? inboxBooks.length : SHELF_LIMIT;
        var _capped2 = _effectiveLimit2 === Infinity ? inboxBooks : inboxBooks.slice(0, _effectiveLimit2);
        result.push({
          title: 'Inbox',
          count: inboxBooks.length,
          sections: [{ type: 'standalone', books: _capped2 }],
          folderId: '__inbox__',
          section: 'folder',
          isCapped: !_isExpanded2 && _capped2.length < inboxBooks.length
        });
      }
    }

    // Tag view shelves (pinned tags, positioned between Inbox and folders)
    var sortedTagViews = [...(pinnedTagFolders || [])].sort((a, b) => (a.position ?? 0) - (b.position ?? 0));var _loop2 = function ()
    {
      var tagId = ptf.tagId;
      var tagLabel = tagRegistry[tagId]?.label || tagId;
      var folderId = `__tag_${tagId}__`;
      var taggedBooks = filteredBooks.filter((b) => (b.tags || []).includes(tagId));
      if (taggedBooks.length === 0) return 1; // continue

      // Respect manual bookOrder if present
      var orderedBooks;
      var bookOrder = ptf.bookOrder || [];
      if (bookOrder.length > 0) {
        var orderedSet = new Set(bookOrder);
        var ordered = bookOrder.filter((id) => filteredBookIds.has(id)).map((id) => bookMap[id]).filter(Boolean);
        var unordered = taggedBooks.filter((b) => !orderedSet.has(b.id));
        orderedBooks = [...ordered, ...unordered];
      } else {
        orderedBooks = taggedBooks;
      }

      var isExpanded = expandedShelves.has(folderId);
      var effectiveLimit = isExpanded ? Infinity :
      orderedBooks.length <= SHELF_LIMIT + 1 ? orderedBooks.length : SHELF_LIMIT;
      var capped = effectiveLimit === Infinity ? orderedBooks : orderedBooks.slice(0, effectiveLimit);
      result.push({
        title: tagLabel,
        count: orderedBooks.length,
        sections: [{ type: 'standalone', books: capped }],
        folderId,
        section: 'folder',
        isCapped: !isExpanded && capped.length < orderedBooks.length
      });
    };for (var ptf of sortedTagViews) {if (_loop2()) continue;}

    // Folder shelves with sections (standalone books + series subfolders)
    // v1.7.0-alpha.13 - Desktop's order (pins + sortIndex/Name), not raw array order
    var topLevelFolders = orderedChildFolders(folders, null, folderListSort).filter((f) => f.id !== '__inbox__');

    for (var folder of topLevelFolders) {
      var sections = [];
      var _isExpanded3 = expandedShelves.has(folder.id);
      // Count total books first so we can avoid "Show All" for just 1 extra book
      var allBookIds = collectDescendantBookIds(folder.id, folders);
      var totalFiltered = allBookIds.filter((id) => filteredBookIds.has(id)).length;
      var _effectiveLimit3 = _isExpanded3 ? Infinity :
      totalFiltered <= SHELF_LIMIT + 1 ? totalFiltered : SHELF_LIMIT;
      var remaining = _effectiveLimit3;

      // Standalone books (direct children, not in any subfolder)
      var standaloneBooks = (folder.bookIds || []).
      filter((id) => filteredBookIds.has(id)).
      map((id) => bookMap[id]).
      filter(Boolean);

      if (standaloneBooks.length > 0) {
        var _capped3 = remaining === Infinity ? standaloneBooks : standaloneBooks.slice(0, remaining);
        sections.push({ type: 'standalone', books: _capped3 });
        remaining -= _capped3.length;
      }

      // v1.7.0-alpha.13 - Series subfolders in desktop's full order (pins + manual/Name mirror)
      var childFolders = orderedChildFolders(folders, folder.id, folderListSort);

      for (var child of childFolders) {
        if (remaining <= 0) break;
        var allChildBookIds = collectDescendantBookIds(child.id, folders);
        var seriesBooks = allChildBookIds.
        filter((id) => filteredBookIds.has(id)).
        map((id) => bookMap[id]).
        filter(Boolean);

        if (seriesBooks.length > 0) {
          var _capped4 = remaining === Infinity ? seriesBooks : seriesBooks.slice(0, remaining);
          sections.push({ type: 'series', folder: child, books: _capped4, totalBooks: seriesBooks.length });
          remaining -= _capped4.length;
        }
      }

      if (sections.length > 0) {
        var displayedBooks = sections.reduce((sum, s) => sum + s.books.length, 0);
        result.push({
          title: folder.name,
          count: totalFiltered,
          sections,
          folderId: folder.id,
          section: 'folder',
          isCapped: !_isExpanded3 && displayedBooks < totalFiltered
        });
      }
    }

    return result;
  }, [filteredBooks, filteredBookIds, bookMap, folders, pinnedTagFolders, tagRegistry, bookLists, savedSearches, expandedShelves]);

  if (shelves.length === 0) {
    return (/*#__PURE__*/
      React.createElement("div", { className: "flex flex-col items-center justify-center px-6 text-center",
        style: { minHeight: 'calc(100vh - 48px)' } }, /*#__PURE__*/
      React.createElement("p", { className: "text-sm", style: { color: 'var(--text-muted, #94a3b8)' } }, "No books match the current filters."

      )
      ));

  }

  // v6.12.0 Phase 8b - category dividers between shelf groups, mirroring the drawer + desktop sidebar
  // (All Books standalone, then Searches / Book Lists / Folders). Heading shown before the first shelf
  // of each section that has one; All Books has no heading.
  var SECTION_LABELS = { search: 'Searches', booklist: 'Book Lists', folder: 'Folders' };
  // v1.6.0 - subtle per-section hue so each group is identifiable at a glance on the long overview.
  // Translucent overlays (work on any theme bg): blue = Searches, green = Book Lists, amber = Folders.
  var SECTION_TINT = { search: 'var(--section-tint-search)', booklist: 'var(--section-tint-booklist)', folder: 'var(--section-tint-folder)' };
  // v1.6.2 - icon per section (mirrors the drawer) = a color-independent identifier
  var SECTION_ICON = { search: '🔍', booklist: '📋', folder: '📁' };
  // v1.6.3 - solid accent per section = a pinned left "spine" so you know the section on every row
  // v1.6.5 - theme-aware CSS vars (softened; coordinated with the tint per theme, esp. dark)
  var SECTION_ACCENT = { search: 'var(--section-accent-search)', booklist: 'var(--section-accent-booklist)', folder: 'var(--section-accent-folder)' };
  // v1.6.8 - map Dashboard section ids to the shared collapse keys (drawer uses these), so collapse syncs both ways
  var SECTION_KEY = { search: 'searches', booklist: 'bookLists', folder: 'folders' };
  // v1.6.1 - Group consecutive shelves by section so each renders as ONE solid tinted band (no white
  // between rows), with breathing room between sections.
  var groups = [];
  shelves.forEach((shelf) => {
    var last = groups[groups.length - 1];
    if (last && last.section === shelf.section) last.shelves.push(shelf);else
    groups.push({ section: shelf.section, shelves: [shelf] });
  });
  var rows = groups.map((group, gi) => {
    var label = SECTION_LABELS[group.section];
    var tint = SECTION_TINT[group.section];
    var secKey = SECTION_KEY[group.section]; // v1.6.8 - shared collapse key (matches the drawer)
    var isCollapsed = secKey && collapsed[secKey];
    return (/*#__PURE__*/
      React.createElement("div", { key: `grp-${group.section}-${gi}`, style: {
          background: tint || 'transparent',
          paddingBottom: isCollapsed ? '8px' : tint ? '44px' : '12px',
          borderLeft: SECTION_ACCENT[group.section] ? `5px solid ${SECTION_ACCENT[group.section]}` : 'none'
        } },
      label && /*#__PURE__*/
      React.createElement("div", { onClick: () => toggleSection(secKey), style: {
          padding: '7px 16px', borderTop: '1px solid var(--border-default, #e2e8f0)',
          background: 'var(--section-heading-bg)',
          fontFamily: 'var(--font-heading)', fontSize: '13px', fontWeight: 700,
          textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-secondary, #475569)',
          display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer'
        }, role: "button", "aria-expanded": !isCollapsed }, /*#__PURE__*/
      React.createElement("span", { style: { fontSize: '11px', width: '10px' } }, isCollapsed ? '▶' : '▼'), /*#__PURE__*/
      React.createElement("span", { style: { fontSize: '15px' } }, SECTION_ICON[group.section]), /*#__PURE__*/
      React.createElement("span", null, label),

      !isCollapsed && (group.section === 'folder' || group.section === 'booklist') && (() => {
        var ids = group.shelves.map((s) => s.folderId).filter(Boolean);
        if (!ids.length) return null;
        var anyOpen = ids.some((id) => !collapsedShelves[id]);
        return (/*#__PURE__*/
          React.createElement("span", {
            onClick: (e) => {e.stopPropagation();setAllShelves(ids, anyOpen);},
            style: { marginLeft: 'auto', padding: '2px 8px', fontSize: '15px', color: 'var(--text-muted, #94a3b8)', touchAction: 'manipulation' },
            role: "button",
            "aria-label": anyOpen ? 'Collapse all shelves — names only' : 'Expand all shelves',
            title: anyOpen ? 'Collapse all — names only' : 'Expand all' },
          anyOpen ? '⊟' : '⊞'
          ));

      })()
      ),

      !isCollapsed && group.shelves.map((shelf, si) => /*#__PURE__*/
      React.createElement(Shelf, {
        key: shelf.title + '-' + si,
        title: shelf.title,
        count: shelf.count,
        sections: shelf.sections,
        isCapped: shelf.isCapped,
        isExpanded: shelf.folderId ? expandedShelves.has(shelf.folderId) : false,
        coverUrlMap: coverUrlMap,
        blankImageBooks: blankImageBooks,
        setBlankImageBooks: setBlankImageBooks,
        onTapTitle: shelf.folderId ? () => onTapFolderTitle(shelf.folderId) : null,
        onTapBook: onTapBook,
        onTapSeries: onTapSeries,
        onTapShowAll: shelf.folderId ? () => setExpandedShelves((prev) => {var next = new Set(prev);next.add(shelf.folderId);return next;}) : null,
        onShowLess: shelf.folderId ? () => setExpandedShelves((prev) => {var next = new Set(prev);next.delete(shelf.folderId);return next;}) : null,
        isShelfCollapsed: shelf.folderId ? !!collapsedShelves[shelf.folderId] : false,
        onToggleShelf: shelf.folderId ? () => toggleShelf(shelf.folderId) : null }
      )
      )
      ));

  });

  return (/*#__PURE__*/
    React.createElement("div", { style: { paddingTop: '12px', paddingBottom: '24px' } },
    rows,

    libraryAsOf && /*#__PURE__*/
    React.createElement("div", { style: { textAlign: 'center', padding: '16px 0 4px', fontSize: '11px', color: 'var(--text-muted, #94a3b8)' } }, "Library as of ",
    new Date(libraryAsOf).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })
    )

    ));

}

// --- FolderView component ---

function FolderView({ folderId, books, folders, pinnedTagFolders, tagRegistry, bookLists, savedSearches, showDealsOnly, showHidden, onToggleHidden, folderListSort, sortOption, onCycleSort, viewMode,
  coverUrlMap, blankImageBooks, setBlankImageBooks, onTapBook, onTapSubfolder }) {
  var isAllBooks = folderId === '__recent__';
  var isTagView = folderId?.startsWith('__tag_') && folderId?.endsWith('__');
  var isBookList = folderId?.startsWith('__booklist_') && folderId?.endsWith('__');
  var isSearch = folderId?.startsWith('__search_') && folderId?.endsWith('__');
  var folder = isAllBooks || isTagView || isBookList || isSearch ? null : folders.find((f) => f.id === folderId);

  var subfolders = useMemo(() => {
    if (isAllBooks || isTagView || isBookList || isSearch) return [];
    return orderedChildFolders(folders, folderId, folderListSort); // v1.7.0-alpha.13 - desktop's order, not alphabetical
  }, [folders, folderId, isAllBooks, isTagView, isBookList, isSearch]);

  var folderBooks = useMemo(() => {
    var filtered = filterBooks(books, { showDealsOnly, showHidden });
    var result;
    if (isAllBooks) {
      result = filtered;
    } else if (isTagView) {
      var tagId = folderId.slice(6, -2);
      var taggedBooks = filtered.filter((b) => (b.tags || []).includes(tagId));
      // Respect manual bookOrder if present
      var pinnedEntry = (pinnedTagFolders || []).find((p) => p.tagId === tagId);
      var bookOrder = pinnedEntry?.bookOrder || [];
      if (bookOrder.length > 0) {
        var filteredIds = new Set(taggedBooks.map((b) => b.id));
        var orderedSet = new Set(bookOrder);
        var ordered = bookOrder.filter((id) => filteredIds.has(id)).map((id) => taggedBooks.find((b) => b.id === id)).filter(Boolean);
        var unordered = taggedBooks.filter((b) => !orderedSet.has(b.id));
        result = [...ordered, ...unordered];
      } else {
        result = taggedBooks;
      }
    } else if (isBookList) {
      // v6.12.0 Phase 8 - curated list: preserve the list's bookIds order (matches desktop)
      var blId = folderId.slice(11, -2);
      var bl = (bookLists || []).find((b) => b.id === blId);
      var filteredSet = new Set(filtered.map((b) => b.id));
      var bookMap = new Map(filtered.map((b) => [b.id, b]));
      result = (bl?.bookIds || []).filter((id) => filteredSet.has(id)).map((id) => bookMap.get(id)).filter(Boolean);
    } else if (isSearch) {
      // v6.12.0 Phase 8b - dynamic list: every book matching the saved Search's filter
      var sId = folderId.slice(9, -2);
      var sv = (savedSearches || []).find((s) => s.id === sId);
      result = sv ? filtered.filter((b) => bookMatchesFilters(b, sv.filters)) : [];
    } else if (!folder) {
      return [];
    } else {
      // v1.0.2 - Preserve folder.bookIds order for manual sort (matches desktop getFolderBookIds)
      var _filteredSet = new Set(filtered.map((b) => b.id));
      var _bookMap = new Map(filtered.map((b) => [b.id, b]));
      result = (folder.bookIds || []).filter((id) => _filteredSet.has(id)).map((id) => _bookMap.get(id));
    }
    return sortBooks(result, sortOption);
  }, [folder, books, pinnedTagFolders, bookLists, savedSearches, showDealsOnly, showHidden, isAllBooks, isTagView, isBookList, isSearch, folderId, sortOption]);

  var sortLabel = SORT_OPTIONS.find((o) => o.key === sortOption)?.label || 'Date Added';

  if (!isAllBooks && !isTagView && !isBookList && !isSearch && !folder) {
    return /*#__PURE__*/React.createElement("div", { style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)' } }, "Folder not found");
  }

  return (/*#__PURE__*/
    React.createElement("div", { style: { padding: '12px 16px 24px' } },
    subfolders.length > 0 && /*#__PURE__*/
    React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 105px)', gap: '16px 12px', justifyContent: 'center', marginBottom: '16px' } },
    subfolders.map((sub) => /*#__PURE__*/
    React.createElement(FolderTile, { key: sub.id, folder: sub, onTap: () => onTapSubfolder(sub.id) })
    )
    ),


    folderBooks.length > 0 && /*#__PURE__*/
    React.createElement("div", { style: {
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        marginBottom: '10px', fontSize: '13px', color: 'var(--text-secondary, #475569)'
      } },



    (() => {
      var hiddenCount = isAllBooks && !showDealsOnly ?
      books.filter((b) => b.isHidden).length : 0;
      if (hiddenCount === 0) {
        return /*#__PURE__*/React.createElement("span", null, folderBooks.length.toLocaleString(), " book", folderBooks.length !== 1 ? 's' : '');
      }
      var clauseBtn = (text, title) => /*#__PURE__*/
      React.createElement("button", { onClick: onToggleHidden, title: title,
        style: {
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          color: 'var(--text-link, #2563eb)', fontSize: 'inherit',
          touchAction: 'manipulation', textDecoration: 'underline dotted'
        } }, text);

      var plural = hiddenCount !== 1 ? 's' : '';
      if (!showHidden) {
        var total = folderBooks.length + hiddenCount;
        return (/*#__PURE__*/
          React.createElement("span", null,
          folderBooks.length.toLocaleString(), " of ", total.toLocaleString(), " books", ' ',
          clauseBtn(`(${hiddenCount} hidden by user)`, `${hiddenCount} book${plural} hidden by user — tap to show`)
          ));

      }
      return (/*#__PURE__*/
        React.createElement("span", null,
        folderBooks.length.toLocaleString(), " books", ' ',
        clauseBtn(`(including ${hiddenCount} hidden by user)`, `Tap to hide ${hiddenCount === 1 ? 'it' : 'them'} again`)
        ));

    })(), /*#__PURE__*/
    React.createElement("button", { onClick: onCycleSort, title: "Tap to change sort order", style: {
        display: 'flex', alignItems: 'center', gap: '4px',
        padding: '4px 10px', borderRadius: '6px', border: '1px solid var(--border-default, #e2e8f0)',
        background: 'var(--bg-surface, #ffffff)', color: 'var(--text-secondary, #475569)',
        fontSize: '12px', fontWeight: 500, touchAction: 'manipulation', cursor: 'pointer'
      } }, /*#__PURE__*/
    React.createElement("svg", { width: "14", height: "14", viewBox: "0 0 24 24", fill: "none", stroke: "currentColor", strokeWidth: "2", strokeLinecap: "round" }, /*#__PURE__*/
    React.createElement("path", { d: "M7 15l5 5 5-5M7 9l5-5 5 5" })
    ),
    sortLabel
    )
    ),


    folderBooks.length > 0 ?
    viewMode === 'list' ? /*#__PURE__*/
    React.createElement("div", null,
    folderBooks.map((book) => {
      var imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;
      var isBlank = blankImageBooks.has(book.id);
      return (/*#__PURE__*/
        React.createElement("div", { key: book.id,
          onClick: () => onTapBook(book.id),
          style: {
            display: 'flex', gap: '12px', padding: '8px 0',
            borderBottom: '1px solid var(--border-default, #e2e8f0)',
            cursor: 'pointer', touchAction: 'manipulation'
          } }, /*#__PURE__*/
        React.createElement("div", { style: {
            width: '40px', flexShrink: 0,
            aspectRatio: '2/3', borderRadius: '3px', overflow: 'hidden',
            boxShadow: '2px 2px 4px 1px rgba(128,128,128,0.4)',
            opacity: isWishlisted(book) ? 0.4 : 1
          } },
        isBlank || !book.coverUrl ? /*#__PURE__*/
        React.createElement("div", { style: {
            width: '100%', height: '100%',
            backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '2px'
          } }, /*#__PURE__*/
        React.createElement("div", { style: {
            textAlign: 'center', fontFamily: 'var(--font-heading)',
            fontWeight: 700, fontSize: '0.35em', lineHeight: 1.2,
            color: 'var(--text-primary, #1e293b)',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
          } }, book.title)
        ) : /*#__PURE__*/

        React.createElement("img", { src: imgSrc, alt: "", loading: "lazy",
          style: { width: '100%', height: '100%', objectFit: 'cover' },
          onError: () => setBlankImageBooks((prev) => new Set([...prev, book.id])),
          onLoad: (e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks) }
        )

        ), /*#__PURE__*/
        React.createElement("div", { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '1px' } }, /*#__PURE__*/
        React.createElement("div", { className: "truncate", style: {
            fontSize: '14px', fontWeight: 600,
            color: 'var(--text-primary, #1e293b)'
          } }, book.title), /*#__PURE__*/
        React.createElement("div", { className: "truncate", style: {
            fontSize: '12px',
            color: 'var(--text-secondary, #475569)'
          } }, book.author)
        )
        ));

    })
    ) : /*#__PURE__*/

    React.createElement("div", { style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, 105px)', gap: '16px 12px', justifyContent: 'center' } },
    folderBooks.map((book) => /*#__PURE__*/
    React.createElement(CoverCard, {
      key: book.id, book: book,
      coverUrlMap: coverUrlMap, blankImageBooks: blankImageBooks,
      setBlankImageBooks: setBlankImageBooks,
      onTap: onTapBook }
    )
    )
    ) : /*#__PURE__*/


    React.createElement("div", { style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)' } },
    isSearch ? 'No books match this search.' : isBookList ? 'No books in this list.' : 'No books in this folder.'
    ),


    subfolders.length > 0 && /*#__PURE__*/
    React.createElement("div", { style: {
        padding: '10px 16px', fontSize: '13px', textAlign: 'center', marginTop: '16px',
        color: 'var(--text-secondary, #475569)',
        borderTop: '1px solid var(--border-default, #e2e8f0)'
      } },
    subfolders.length, " subfolder", subfolders.length !== 1 ? 's' : ''
    )

    ));

}

// --- BookDetailView component ---

function BookDetailView({ bookId, books, coverUrlMap, blankImageBooks, setBlankImageBooks, tagRegistry }) {
  var book = books.find((b) => b.id === bookId);
  if (!book) {
    return /*#__PURE__*/React.createElement("div", { style: { padding: '24px', textAlign: 'center', color: 'var(--text-muted)' } }, "Book not found");
  }

  var imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;
  var isBlank = blankImageBooks.has(book.id);

  return (/*#__PURE__*/
    React.createElement("div", { style: { padding: '16px 16px 32px' } }, /*#__PURE__*/
    React.createElement(StarDefs, null), /*#__PURE__*/


    React.createElement("div", { style: { display: 'flex', justifyContent: 'center', marginBottom: '20px' } }, /*#__PURE__*/
    React.createElement("a", { href: getAmazonUrl(book.asin), target: "_blank", rel: "noopener noreferrer" },
    isBlank || !book.coverUrl ? /*#__PURE__*/
    React.createElement("div", { style: {
        width: '180px', aspectRatio: '2/3', borderRadius: '6px',
        backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
      } }, /*#__PURE__*/
    React.createElement("div", { style: { textAlign: 'center', fontFamily: 'var(--font-heading)',
        fontWeight: 700, fontSize: '14px', lineHeight: 1.3, color: 'var(--text-primary)' } },
    book.title
    )
    ) : /*#__PURE__*/

    React.createElement("img", { src: imgSrc, alt: "", loading: "lazy",
      style: { width: '180px', aspectRatio: '2/3', objectFit: 'cover',
        borderRadius: '6px', boxShadow: '0 4px 12px rgba(0,0,0,0.15)' },
      onError: () => setBlankImageBooks((prev) => new Set([...prev, book.id])),
      onLoad: (e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks) }
    )

    )
    ), /*#__PURE__*/


    React.createElement("a", { href: getAmazonUrl(book.asin), target: "_blank", rel: "noopener noreferrer",
      style: { fontFamily: 'var(--font-heading)', fontSize: '20px', fontWeight: 700,
        color: 'var(--text-primary)', textAlign: 'center', marginBottom: '4px', lineHeight: 1.3,
        display: 'block', textDecoration: 'none' } },
    book.title
    ), /*#__PURE__*/
    React.createElement("p", { style: { fontSize: '16px', color: 'var(--text-secondary)', textAlign: 'center', marginBottom: '16px' } }, "by ",
    book.author
    ), /*#__PURE__*/


    React.createElement("div", { style: { textAlign: 'center', marginBottom: '12px', display: 'flex', justifyContent: 'center', gap: '8px', flexWrap: 'wrap' } },
    isWishlisted(book) && /*#__PURE__*/
    React.createElement("span", { style: { display: 'inline-block', padding: '4px 12px', borderRadius: '999px',
        fontSize: '12px', fontWeight: 600,
        backgroundColor: 'var(--bg-selected, #dbeafe)', color: 'var(--text-accent, #2563eb)' } }, "Wishlist Item"

    ),

    (() => {
      var atGoal = book.priceTrigger != null && book.currentPrice != null && book.currentPrice <= book.priceTrigger;
      return (/*#__PURE__*/
        React.createElement("a", { href: getAmazonUrl(book.asin), target: "_blank", rel: "noopener noreferrer",
          style: { display: 'inline-block', padding: '4px 12px', borderRadius: '6px',
            fontSize: '12px', fontWeight: 600, textDecoration: 'none', color: 'white',
            backgroundColor: atGoal ? '#22c55e' : '#f97316' } }, "View on Amazon ",
        atGoal ? `— $${book.currentPrice.toFixed(2)}` : '→'
        ));

    })()
    ), /*#__PURE__*/

    React.createElement("div", { style: { borderTop: '1px solid var(--border-default)', margin: '0 0 16px' } }),


    book.rating > 0 && /*#__PURE__*/
    React.createElement(DetailRow, { label: "Rating" }, /*#__PURE__*/
    React.createElement("span", { style: { display: 'inline-flex', alignItems: 'center', gap: '8px' } },
    renderStars(book.rating), /*#__PURE__*/
    React.createElement("span", { style: { fontWeight: 700, fontSize: '14px' } }, book.rating.toFixed(1)),
    book.ratingCount && /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '12px', color: 'var(--text-muted)' } }, "(", book.ratingCount, ")")

    )
    ), /*#__PURE__*/



    React.createElement(DetailRow, { label: "My Rating" },
    book.myRating > 0 ?
    renderStars(book.myRating, { color: 'var(--border-focus, #3b82f6)' }) : /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' } }, "Not rated")

    ),


    book.series && /*#__PURE__*/
    React.createElement(DetailRow, { label: "Series" }, /*#__PURE__*/
    React.createElement("span", { style: { color: 'var(--text-series, #6366f1)' } },
    book.seriesPosition ? `Book ${book.seriesPosition}: ${book.series}` : book.series
    )
    ),



    book.binding && /*#__PURE__*/React.createElement(DetailRow, { label: "Format" }, book.binding),


    book.acquired && /*#__PURE__*/React.createElement(DetailRow, { label: "Acquired" }, formatDate(book.acquired)),


    book.tags && book.tags.length > 0 && /*#__PURE__*/
    React.createElement(DetailRow, { label: "Tags" }, /*#__PURE__*/
    React.createElement("div", { style: { display: 'flex', flexWrap: 'wrap', gap: '6px' } },
    book.tags.map((tagId) => /*#__PURE__*/
    React.createElement("span", { key: tagId, style: {
        padding: '2px 10px', borderRadius: '999px', fontSize: '12px', fontWeight: 600,
        backgroundColor: 'var(--bg-selected, #dbeafe)', color: 'var(--text-accent, #1e40af)'
      } },
    tagRegistry[tagId]?.label || tagId
    )
    )
    )
    ), /*#__PURE__*/



    React.createElement(DetailRow, { label: "Collections" },
    book.collections && book.collections.length > 0 ?
    book.collections.map((c) => c.name).join(', ') : /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '13px', color: 'var(--text-muted)', fontStyle: 'italic' } }, "No collections")

    ),


    book.userNote && /*#__PURE__*/
    React.createElement("div", { style: { margin: '16px 0', padding: '12px', borderRadius: '8px',
        backgroundColor: 'var(--bg-surface-alt, #f8fafc)',
        border: '1px solid var(--border-default, #e2e8f0)' } }, /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)',
        display: 'block', marginBottom: '6px' } }, "Notes"), /*#__PURE__*/
    React.createElement("p", { style: { fontSize: '14px', color: 'var(--text-primary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' } },
    book.userNote
    )
    ),



    (book.currentPrice != null || book.priceTrigger != null) && /*#__PURE__*/
    React.createElement("div", { style: { borderTop: '1px solid var(--border-default)', paddingTop: '12px', marginTop: '12px' } },
    book.currentPrice != null && /*#__PURE__*/
    React.createElement(DetailRow, { label: "Price" }, /*#__PURE__*/
    React.createElement("span", { style: { fontWeight: 700,
        color: book.priceTrigger != null && book.currentPrice <= book.priceTrigger ?
        'var(--text-success, #16a34a)' : 'var(--text-primary)' } }, "$",
    book.currentPrice.toFixed(2)
    ),
    book.listPrice && book.listPrice > book.currentPrice && /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '12px', color: 'var(--text-muted)', marginLeft: '8px' } }, /*#__PURE__*/
    React.createElement("span", { style: { textDecoration: 'line-through' } }, "$", book.listPrice.toFixed(2))
    )

    ),

    book.priceTrigger != null && /*#__PURE__*/
    React.createElement(DetailRow, { label: "Goal" }, /*#__PURE__*/
    React.createElement("span", { style: { color: 'var(--text-success, #16a34a)' } }, "$",
    book.priceTrigger.toFixed(2), " or less"
    )
    )

    ),



    book.description && /*#__PURE__*/
    React.createElement("div", { style: { borderTop: '1px solid var(--border-default)', paddingTop: '16px', marginTop: '16px' } }, /*#__PURE__*/
    React.createElement("h3", { style: { fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' } }, "Description"

    ), /*#__PURE__*/
    React.createElement("p", { style: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' } },
    book.description
    )
    ),



    book.topReviews && book.topReviews.length > 0 && /*#__PURE__*/
    React.createElement("div", { style: { borderTop: '1px solid var(--border-default)', paddingTop: '16px', marginTop: '16px' } }, /*#__PURE__*/
    React.createElement("h3", { style: { fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '12px' } }, "Top Reviews"

    ),
    book.topReviews.slice(0, 3).map((review, idx) => /*#__PURE__*/
    React.createElement(ReviewCard, { key: idx, review: review })
    )
    )

    ));

}

// --- SearchView component ---

function SearchView({ books, folders, folderId, showDealsOnly, showHidden, sortOption, coverUrlMap, blankImageBooks, setBlankImageBooks, tagRegistry, onTapBook, query }) {

  // Collect all bookIds in folder + subfolders recursively
  var scopeBookIds = React.useMemo(() => {
    if (!folderId) return null; // global search
    var ids = new Set();
    var collectIds = (fid) => {
      var folder = folders.find((f) => f.id === fid);
      if (folder) {
        (folder.bookIds || []).forEach((id) => ids.add(id));
        folders.filter((f) => f.parentId === fid).forEach((sub) => collectIds(sub.id));
      }
    };
    collectIds(folderId);
    return ids;
  }, [folderId, folders]);

  var results = React.useMemo(() => {
    var q = (query || '').trim().toLowerCase();
    if (!q) return [];
    var filtered = filterBooks(books, { showDealsOnly, showHidden });
    if (scopeBookIds) filtered = filtered.filter((b) => scopeBookIds.has(b.id));
    var matched = filtered.filter((book) => {
      if (book.title.toLowerCase().includes(q)) return true;
      if (book.author.toLowerCase().includes(q)) return true;
      if (book.series && book.series.toLowerCase().includes(q)) return true;
      if (book.userNote && book.userNote.toLowerCase().includes(q)) return true;
      if (book.tags && book.tags.some((tagId) => {
        var label = tagRegistry[tagId]?.label || tagId;
        return label.toLowerCase().includes(q);
      })) return true;
      return false;
    });
    return sortBooks(matched, sortOption);
  }, [query, books, showDealsOnly, showHidden, tagRegistry, sortOption]);

  return (/*#__PURE__*/
    React.createElement("div", { style: { paddingTop: '8px' } },
    !query || query.trim() === '' ? /*#__PURE__*/
    React.createElement("div", { style: { padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted, #64748b)' } }, "Search by title, author, series, tags, or notes"

    ) :
    results.length === 0 ? /*#__PURE__*/
    React.createElement("div", { style: { padding: '48px 24px', textAlign: 'center', color: 'var(--text-muted, #64748b)' } }, "No results for \"",
    query.trim(), "\""
    ) : /*#__PURE__*/

    React.createElement("div", null, /*#__PURE__*/
    React.createElement("div", { style: { padding: '4px 16px 8px', fontSize: '12px', color: 'var(--text-muted, #64748b)' } },
    results.length, " result", results.length !== 1 ? 's' : ''
    ),
    results.map((book) => {
      var imgSrc = coverUrlMap[book.coverUrl] || book.coverUrl;
      var isBlank = blankImageBooks.has(book.id);
      return (/*#__PURE__*/
        React.createElement("div", { key: book.id,
          onClick: () => onTapBook(book.id),
          style: {
            display: 'flex', gap: '12px', padding: '8px 16px',
            borderBottom: '1px solid var(--border-default, #e2e8f0)',
            cursor: 'pointer', touchAction: 'manipulation'
          } }, /*#__PURE__*/
        React.createElement("div", { style: {
            width: '48px', flexShrink: 0,
            aspectRatio: '2/3', borderRadius: '3px', overflow: 'hidden',
            boxShadow: '2px 2px 4px 1px rgba(128,128,128,0.4)',
            opacity: isWishlisted(book) ? 0.4 : 1
          } },
        isBlank || !book.coverUrl ? /*#__PURE__*/
        React.createElement("div", { style: {
            width: '100%', height: '100%',
            backgroundColor: 'var(--bg-book-placeholder, #d4c5a9)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '4px'
          } }, /*#__PURE__*/
        React.createElement("div", { style: {
            textAlign: 'center', fontFamily: 'var(--font-heading)',
            fontWeight: 700, fontSize: '0.4em', lineHeight: 1.2,
            color: 'var(--text-primary, #1e293b)',
            overflow: 'hidden', display: '-webkit-box',
            WebkitLineClamp: 3, WebkitBoxOrient: 'vertical'
          } }, book.title)
        ) : /*#__PURE__*/

        React.createElement("img", { src: imgSrc, alt: "", loading: "lazy",
          style: { width: '100%', height: '100%', objectFit: 'cover' },
          onError: () => setBlankImageBooks((prev) => new Set([...prev, book.id])),
          onLoad: (e) => checkIfBlankImage(e.target, book.id, setBlankImageBooks) }
        )

        ), /*#__PURE__*/
        React.createElement("div", { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: '2px' } }, /*#__PURE__*/
        React.createElement("div", { className: "truncate", style: {
            fontSize: '14px', fontWeight: 600,
            color: 'var(--text-primary, #1e293b)'
          } }, book.title), /*#__PURE__*/
        React.createElement("div", { className: "truncate", style: {
            fontSize: '12px',
            color: 'var(--text-secondary, #475569)'
          } }, book.author),
        book.rating > 0 && /*#__PURE__*/
        React.createElement("div", { style: { display: 'flex', alignItems: 'center', gap: '4px' } },
        renderStars(book.rating, { size: 12 }), /*#__PURE__*/
        React.createElement("span", { style: { fontSize: '11px', color: 'var(--text-muted, #64748b)' } },
        book.rating.toFixed(1)
        )
        ),

        book.series && /*#__PURE__*/
        React.createElement("div", { className: "truncate", style: {
            fontSize: '11px', fontStyle: 'italic',
            color: 'var(--text-muted, #64748b)'
          } }, book.series, book.seriesPosition ? ` #${book.seriesPosition}` : '')

        )
        ));

    })
    )

    ));

}

// --- Main app ---

// v6.0.0 Phase 2 - Check for #pair= hash fragment and store credentials
// Runs once before React mounts — credentials are available by the time MobileApp initializes
(function checkPairingHash() {
  var hash = window.location.hash;
  if (!hash.startsWith('#pair=')) return;
  try {
    var b64 = hash.slice(6); // strip '#pair='
    var json = atob(b64);
    var creds = JSON.parse(json);
    if (creds.channelId && creds.passphrase) {
      localStorage.setItem(RELAY_KEY, JSON.stringify(creds));
      rwLog.log('info', 'PHONE', `Paired from the QR link: channel ${rwLog.shortChannelId(creds.channelId)}`);
    }
  } catch (e) {
    rwLog.log('warning', 'PHONE-01', "The pairing link couldn't be read — pair again from the computer", { error: String(e) });
  }
  // Clear hash fragment (don't leave credentials in URL)
  history.replaceState(null, '', window.location.pathname + window.location.search);
})();

// v6.0.0 Phase 2 - Load html5-qrcode scanner library on demand
function loadQRScanner() {
  return new Promise((resolve, reject) => {
    if (window.Html5Qrcode) {resolve();return;}
    var script = document.createElement('script');
    script.src = 'https://unpkg.com/html5-qrcode@2.3.8/html5-qrcode.min.js';
    script.onload = resolve;
    script.onerror = () => reject(new Error('Failed to load QR scanner library'));
    document.head.appendChild(script);
  });
}

function MobileApp() {
  var [books, setBooks] = useState([]);
  var [folders, setFolders] = useState([]);
  var [tagRegistry, setTagRegistry] = useState({});
  var [pinnedTagFolders, setPinnedTagFolders] = useState([]);
  var [bookLists, setBookLists] = useState([]); // v6.12.0 Phase 8 - curated, supplemental lists
  var [savedSearches, setSavedSearches] = useState([]); // v6.12.0 Phase 8 - saved filter presets (drawer; results 8b)
  var [hiddenInstances, setHiddenInstances] = useState(new Set());
  var [coverUrlMap, setCoverUrlMap] = useState({});
  var [blankImageBooks, setBlankImageBooks] = useState(new Set());
  var [searchQuery, setSearchQuery] = useState('');
  var [loading, setLoading] = useState(true);
  var [loadingMessage, setLoadingMessage] = useState('Loading...'); // v6.0.0 Phase 2 - dynamic loading text
  // v6.0.0 Phase 2 - Pairing state
  var [pairingScreen, setPairingScreen] = useState(() => {
    // Show pairing screen if no relay credentials AND no local books
    var hasCreds = (() => {try {var r = JSON.parse(localStorage.getItem(RELAY_KEY));return r && r.channelId;} catch {return false;}})();
    if (hasCreds) return null; // Already paired
    return 'prompt'; // 'prompt' | 'scanning' | 'success' | 'error'
  });
  var [pairingError, setPairingError] = useState(null);
  var [pairChannel, setPairChannel] = useState('');
  var [pairPassphrase, setPairPassphrase] = useState('');
  var qrScannerRef = useRef(null);
  var [activeOverlay, setActiveOverlay] = useState(null);
  // iOS "Add to Home Screen" hint banner
  var [showA2HS, setShowA2HS] = useState(() => {
    if (localStorage.getItem('readerwrangler-mobile-a2hs-dismissed')) return false;
    var ua = navigator.userAgent;
    var isIOS = /iPhone|iPad|iPod/.test(ua);
    var isStandalone = window.navigator.standalone === true || window.matchMedia('(display-mode: standalone)').matches;
    return isIOS && !isStandalone;
  });
  var [navStack, setNavStack] = useState(() => {
    try {
      var saved = JSON.parse(localStorage.getItem(NAV_STACK_KEY));
      if (Array.isArray(saved) && saved.length > 0 && saved[0]?.view === 'dashboard') {
        return saved.map((entry) => ({ ...entry, scrollY: 0, shelfScrolls: undefined }));
      }
    } catch {}
    return [{ view: 'dashboard', scrollY: 0 }];
  });
  var scrollRestoreRef = useRef(null);
  // Persisted preferences
  var savedPrefs = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
  var [sortOption, setSortOptionRaw] = useState(() => savedPrefs.sortOption || 'dateAdded');
  var cycleSortOption = useCallback(() => {
    setSortOptionRaw((prev) => {
      var idx = SORT_OPTIONS.findIndex((o) => o.key === prev);
      var next = SORT_OPTIONS[(idx + 1) % SORT_OPTIONS.length].key;
      var current = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
      localStorage.setItem(MOBILE_PREFS_KEY, JSON.stringify({ ...current, sortOption: next }));
      return next;
    });
  }, []);
  var [expandedShelves, setExpandedShelvesRaw] = useState(() => new Set(savedPrefs.expandedShelves || []));
  // v1.6.8 - collapsed sections lifted here so the drawer AND Dashboard stay in sync (persisted per-device)
  var [drawerCollapsed, setDrawerCollapsed] = useState(() => {
    try {return JSON.parse(localStorage.getItem('rw_mobile_drawer_collapsed')) || {};} catch (e) {return {};}
  });
  var toggleSection = (key) => setDrawerCollapsed((prev) => {
    var next = { ...prev, [key]: !prev[key] };
    try {localStorage.setItem('rw_mobile_drawer_collapsed', JSON.stringify(next));} catch (e) {}
    return next;
  });
  var setExpandedShelves = useCallback((updater) => {
    setExpandedShelvesRaw((prev) => {
      var next = typeof updater === 'function' ? updater(prev) : updater;
      var current = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
      localStorage.setItem(MOBILE_PREFS_KEY, JSON.stringify({ ...current, expandedShelves: [...next] }));
      return next;
    });
  }, []);
  var [themePreference, setThemePreference] = useState(
    () => localStorage.getItem(THEME_KEY) || 'auto'
  );
  var [viewMode, setViewMode] = useState(savedPrefs.viewMode || 'covers');
  var [showDealsOnly, setShowDealsOnly] = useState(savedPrefs.showDealsOnly || false);
  var [showHidden, setShowHidden] = useState(savedPrefs.showHidden || false);
  var [folderListSort, setFolderListSort] = useState(null); // v1.7.0-alpha.13 - desktop folder-tree sort mode (order mirror)
  // v1.7.0-alpha.24 - Freshness nudge state:
  // libraryAsOf = the cached payload's source stamp (staleness made legible);
  // newerAvailable = pointer gen newer than the cache → banner; dismissible per-gen.
  var [libraryAsOf, setLibraryAsOf] = useState(null);
  var [newerAvailable, setNewerAvailable] = useState(null);
  var dismissedGenRef = useRef(null);
  var lastFreshCheckRef = useRef(0);

  // v1.7.0-alpha.24 - Freshness check: on load + every tab-return (60s dedupe), ONE KV read of
  // the device-state pointer; the gen id's prefix is its commit time, compared against the
  // cache's source stamp (same clock lineage as the guest guard — on a dev machine the local
  // cache is always fresh, so the banner correctly never fires there).
  // v1.7.0-alpha.25 - MOVED here with the other top-level hooks: it originally sat below the
  // component's conditional early-returns, varying the hook count between the loading render
  // and the loaded one — React #310 crash on any reload (found by TinySuspender, of all things).
  useEffect(() => {
    var check = async () => {
      try {
        var creds = JSON.parse(localStorage.getItem(RELAY_KEY) || 'null');
        if (!creds || !creds.channelId || !window.RWRelay) return;
        if (Date.now() - lastFreshCheckRef.current < 60000) return;
        lastFreshCheckRef.current = Date.now();
        window.RWRelay.initFromStorage();
        var gen = await window.RWRelay.getDeviceStatePointerGen?.();
        if (!gen) return;
        // v1.7.1 - Freshness = GENERATION IDENTITY: is the pointed gen the one this cache
        // came from? The old timestamp compare raced the save stamp against the push time —
        // always ~a debounce apart — so a fully-synced phone nagged forever. Caches that
        // predate the gen record fall back to timestamps with a WIDE margin (15 min).
        var blob = (() => {try {return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');} catch (e) {return {};}})();
        var newer;
        if (blob.deviceStateGen) {
          newer = gen !== blob.deviceStateGen;
        } else {
          var genTime = window.RWRelay.genTimestamp?.(gen) || 0;
          newer = genTime > (blob.savedAt || 0) + 15 * 60 * 1000;
        }
        rwLog.log('debug', 'PHONE', `Freshness: this phone has generation ${blob.deviceStateGen || '(none)'}, the relay points to ${gen} — ${newer ? 'a newer one is available' : 'current'}`); // v1.7.2-alpha.3
        if (newer && gen !== dismissedGenRef.current) {
          setNewerAvailable(gen);
        } else if (!newer) {
          setNewerAvailable(null);
        }
      } catch (e) {/* freshness is best-effort */}
    };
    var t = setTimeout(check, 3000); // after the initial load settles
    var onVis = () => {if (document.visibilityState === 'visible') check();};
    document.addEventListener('visibilitychange', onVis);
    return () => {clearTimeout(t);document.removeEventListener('visibilitychange', onVis);};
  }, []);

  var savePrefs = (updates) => {
    var current = JSON.parse(localStorage.getItem(MOBILE_PREFS_KEY) || '{}');
    localStorage.setItem(MOBILE_PREFS_KEY, JSON.stringify({ ...current, ...updates }));
  };

  var applyTheme = (pref) => {
    setThemePreference(pref);
    localStorage.setItem(THEME_KEY, pref);
    var effective = pref;
    if (pref === 'auto') {
      effective = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    if (effective === 'light') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = effective;
    }
  };

  var loadAllData = async () => {
    // v6.0.0 Phase 2 - Pull device-state from relay before loading local data
    var hasCreds = (() => {try {var r = JSON.parse(localStorage.getItem(RELAY_KEY));return r && r.channelId;} catch {return false;}})();
    if (hasCreds && window.RWRelay) {
      try {
        setLoadingMessage('Syncing with desktop...');
        window.RWRelay.initFromStorage();
        var jsonString = await window.RWRelay.getDeviceState();
        if (jsonString) {
          var data = JSON.parse(jsonString);
          if (data.isBackup && data.books?.items?.length) {
            rwLog.log('info', 'PHONE', `Got the library from the relay: ${data.books.items.length} books`);
            setLoadingMessage(`Loading ${data.books.items.length.toLocaleString()} books...`);
            // v1.9.0 (one-table 7.17.0) - deserialize wire items through the shared unpacker
            // (bookFields.js), with mobile safe-defaults so rendering never hits undefined.
            var mappedBooks = data.books.items.map((item) => unpackBook(item, { safeDefaults: true }));
            // v6.12.0 Phase 8b - Read Status + Collections ride in a separate collections section
            // (set together on the Kindle), keyed by asin. They're NOT on the book wire item, so
            // unpackBook doesn't set them — default them for EVERY book (READ badge / collection
            // count / Search matcher / filters all read these), then override from the section.
            var collById = {};
            (data.collections?.items || []).forEach((c) => {collById[c.asin] = c;});
            mappedBooks.forEach((b) => {
              var c = collById[b.asin];
              b.readStatus = c && c.readStatus || 'UNKNOWN';
              b.collections = c && c.collections || [];
            });
            // v1.7.0-alpha.6 - Guest guard (MULTI-INSTANCE.md §3): cache the payload (org keys
            // AND IndexedDB books — gated together) only when it's NEWER than this browser's
            // own organization blob. Phone: mobile is the only resident, a fresh push always
            // wins — unchanged. Dev machine sharing the address with desktop: local truth is
            // newer, the write would clobber it (the folder-order scrambler). Mobile renders
            // from the cache either way, so a skip DISPLAYS the fresher local data.
            // Transition: unstamped payload (pre-alpha.6 push) = stamp 0 → never overwrites an
            // existing blob; a truly empty universe (new phone pairing) accepts it anyway.
            var localSavedAt = (() => {try {return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').savedAt || 0;} catch {return 0;}})();
            var payloadSavedAt = data.organization?.savedAt || 0;
            if (payloadSavedAt > localSavedAt || !localSavedAt) {
              await saveBooksToIndexedDB(mappedBooks, false);
              restoreOrganization(data.organization, mappedBooks.map((b) => b.id), payloadSavedAt,
              window.RWRelay.lastDeviceStateGen ? window.RWRelay.lastDeviceStateGen() : null); // v1.7.1
              rwLog.log('info', 'PHONE', "Saved the relay's copy on this phone");
            } else {
              rwLog.log('info', 'PHONE', `Kept this browser's copy — it's newer than the relay's (the guest guard; relay ${payloadSavedAt ? new Date(payloadSavedAt).toLocaleString() : 'unstamped'}, here ${new Date(localSavedAt).toLocaleString()})`);
            }
          }
        } else {
          rwLog.log('info', 'PHONE', "No library on the relay yet — showing what's on this phone");
        }
      } catch (err) {
        rwLog.log('warning', 'PHONE-02', `Couldn't get the library from the relay — showing what's on this phone: ${err && err.message}`);
      }
    }
    setLoadingMessage('Loading...');

    var loadedBooks = await loadBooksFromIndexedDB();
    setBooks(loadedBooks);

    var savedFolders = readCachedFolders(); // v1.8.0-alpha.1 (F1) - blob-first
    setFolders(savedFolders);

    var orgState = JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}');
    var org = orgState.organization || {};
    setTagRegistry(org.tagRegistry || {});
    setPinnedTagFolders(org.pinnedTagFolders || []);
    setBookLists(org.bookLists || []); // v6.12.0 Phase 8
    setSavedSearches(org.savedSearches || []); // v6.12.0 Phase 8
    setHiddenInstances(new Set(org.hiddenInstances || []));
    setBlankImageBooks(new Set(org.blankImageBooks || []));
    // v1.7.0-alpha.13 - Folder-tree sort mode for the order mirror: cached org (phone) ->
    // same-origin EXPLORER_KEY (dev machine, where the guest guard skips the cache and the
    // freshest value is the desktop's own) -> default Manual (null).
    var fls = org.folderListSort || null;
    if (!fls) {try {fls = JSON.parse(localStorage.getItem(EXPLORER_KEY) || '{}').folderListSort || null;} catch (e) {}}
    setFolderListSort(fls);
    setLibraryAsOf(orgState.savedAt || null); // v1.7.0-alpha.24 - the cache's source stamp

    if (loadedBooks.length > 0) {
      var urlMap = await buildCoverUrlMap(loadedBooks);
      setCoverUrlMap(urlMap);
      populateCoverCache(loadedBooks);
    }

    rwLog.log('info', 'PHONE', `Phone app loaded: ${loadedBooks.length} books, ${savedFolders.length} folders`);
    return loadedBooks;
  };

  useEffect(() => {
    loadAllData().
    then((loadedBooks) => {
      // Validate persisted navStack against loaded data
      setNavStack((prev) => {
        if (prev.length <= 1) return prev;
        var bookIds = new Set(loadedBooks.map((b) => b.id));
        var folderIds = new Set(readCachedFolders().map((f) => f.id)); // v1.8.0-alpha.1 (F1) - blob-first
        for (var i = 1; i < prev.length; i++) {
          var entry = prev[i];
          if (entry.view === 'search') {
            var reset = prev.slice(0, i);
            persistNavStack(reset);
            return reset;
          }
          if (entry.view === 'folder' && entry.folderId !== '__recent__' &&
          !(entry.folderId?.startsWith('__tag_') && entry.folderId?.endsWith('__')) &&
          !(entry.folderId?.startsWith('__booklist_') && entry.folderId?.endsWith('__')) &&
          !(entry.folderId?.startsWith('__search_') && entry.folderId?.endsWith('__')) &&
          !folderIds.has(entry.folderId)) {
            var _reset = [{ view: 'dashboard', scrollY: 0 }];
            persistNavStack(_reset);
            return _reset;
          }
          if (entry.view === 'detail' && !bookIds.has(entry.bookId)) {
            var _reset2 = [{ view: 'dashboard', scrollY: 0 }];
            persistNavStack(_reset2);
            return _reset2;
          }
        }
        return prev;
      });
    }).
    catch((err) => rwLog.log('critical', 'PHONE-03', "Your library couldn't be loaded on this phone.",
    { error: String(err && err.message || err), stack: err && err.stack }, { advice: PHONE_LOAD_ADVICE })).
    finally(() => setLoading(false));
  }, []);

  // Navigation
  var currentNav = navStack[navStack.length - 1];

  var persistNavStack = useCallback((stack) => {
    var stripped = stack.map(({ scrollY, shelfScrolls, ...rest }) => rest);
    localStorage.setItem(NAV_STACK_KEY, JSON.stringify(stripped));
  }, []);

  var navigateTo = useCallback((view, params = {}) => {
    var shelfScrolls = Array.from(document.querySelectorAll('.shelf-scroll')).map((el) => el.scrollLeft);
    var scrollY = window.scrollY || document.documentElement.scrollTop || 0;
    setNavStack((prev) => {
      var updated = [...prev];
      updated[updated.length - 1] = { ...updated[updated.length - 1], scrollY, shelfScrolls };
      var newStack = [...updated, { view, scrollY: 0, ...params }];
      persistNavStack(newStack);
      return newStack;
    });
    window.scrollTo(0, 0);
  }, [persistNavStack]);

  var goBack = useCallback(() => {
    setNavStack((prev) => {
      if (prev.length <= 1) return prev;
      var newStack = prev.slice(0, -1);
      var target = newStack[newStack.length - 1];
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
    var depth = navStack.length;
    var expectedHash = depth > 1 ? `#nav-${depth}` : '';
    if (window.location.hash !== expectedHash) {
      if (depth > 1) {
        window.location.hash = expectedHash;
      } else if (window.location.hash) {
        history.replaceState(null, '', window.location.pathname + window.location.search);
      }
    }
  }, [navStack.length]);

  useEffect(() => {
    var handleHashChange = () => {
      var hash = window.location.hash;
      var match = hash.match(/^#nav-(\d+)$/);
      var hashDepth = match ? parseInt(match[1], 10) : 1;
      if (hashDepth < navStack.length) {
        goBack();
      }
    };
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [navStack.length, goBack]);

  // Restore scroll position after view re-renders on goBack
  useEffect(() => {
    var restore = scrollRestoreRef.current;
    if (!restore) return;
    scrollRestoreRef.current = null;
    requestAnimationFrame(() => {
      window.scrollTo(0, restore.scrollY);
      var shelves = document.querySelectorAll('.shelf-scroll');
      restore.shelfScrolls.forEach((left, i) => {
        if (shelves[i]) shelves[i].scrollLeft = left;
      });
    });
  });

  // Overlay handlers
  var toggleDrawer = () => setActiveOverlay((prev) => prev === 'drawer' ? null : 'drawer');
  var toggleMenu = () => setActiveOverlay((prev) => prev === 'menu' ? null : 'menu');
  var closeOverlay = () => setActiveOverlay(null);

  // Menu action handlers
  var handleToggleViewMode = () => {
    var next = viewMode === 'covers' ? 'list' : 'covers';
    setViewMode(next);
    savePrefs({ viewMode: next });
  };
  var handleToggleDeals = () => {
    var next = !showDealsOnly;
    setShowDealsOnly(next);
    savePrefs({ showDealsOnly: next });
  };
  var handleToggleHidden = () => {
    var next = !showHidden;
    setShowHidden(next);
    savePrefs({ showHidden: next });
  };
  var handleDesktopMode = () => {
    localStorage.setItem('readerwrangler-desktopMode', 'true');
    location.reload();
  };

  // v6.0.0 Phase 2 - Unpair: clear relay credentials and return to pairing screen
  var handleUnpair = () => {
    if (!confirm('Unpair from desktop? Your local library data will be kept.')) return;
    localStorage.removeItem(RELAY_KEY);
    setPairingScreen('prompt');
  };

  // 1.10.2 (7.25.1) - the book store and other tabs (storage.js): a notice that covers the page — "reset in another
  // tab, this tab's contents are out of date" (with Reload), or "close your other tabs" while a reset waits for them.
  // null | { title, body, reload }. Words from storage.js BOOK_STORE_TEXT.
  var [storeNotice, setStoreNotice] = useState(null);
  useEffect(() => onBookStoreGone((state) => setStoreNotice({
    title: BOOK_STORE_TEXT.goneTitle(state), body: BOOK_STORE_TEXT.goneBody, reload: true
  })), []);

  // Reset App: clear all data and return to pairing screen
  var handleReset = () => {
    if (!confirm('This will clear all ReaderWrangler data from this device, including your pairing credentials.\n\nYou will need to re-pair with your desktop (scan QR code or enter credentials manually) to restore your library.\n\nTip: Use Save Credentials in the Sync section before resetting.\n\nContinue?')) return;
    var keys = ['readerwrangler-state', 'readerwrangler-enriched-cache', 'readerwrangler-settings', 'readerwrangler-status', 'readerwrangler-filters', 'readerwrangler-explorer', 'readerwrangler-folders', 'readerwrangler-mobile-prefs', 'readerwrangler-theme', 'readerwrangler-relay', 'readerwrangler-mobile-nav'];
    keys.forEach((k) => localStorage.removeItem(k));
    // 1.10.2 (7.25.1) - the one delete: a delete another tab blocks is WAITED for, saying why (reloading on
    // "blocked" hung the reload behind the pending delete)
    var reload = () => location.reload();
    deleteBookStore({ onBlocked: () => setStoreNotice({ title: '', body: BOOK_STORE_TEXT.blocked, reload: false }) }).
    then(reload, reload);
  };
  var handleSelectFolder = (folderId) => {
    if (folderId === '__all__') {
      var resetStack = [{ view: 'dashboard', scrollY: 0 }];
      setNavStack(resetStack);
      persistNavStack(resetStack);
    } else {
      navigateTo('folder', { folderId });
    }
    closeOverlay();
  };
  // v6.12.0 Phase 8b - Tapping a Search applies its preset to All Books and shows the matches as a
  // results view (reuses the folder view path with a __search_<id>__ id).
  var handleSelectSearch = (searchId) => {
    navigateTo('folder', { folderId: `__search_${searchId}__` });
    closeOverlay();
  };

  // v6.0.0 Phase 2 - QR scanner controls
  var startQRScanner = async () => {
    setPairingScreen('scanning');
    setPairingError(null);
    try {
      await loadQRScanner();
      // Small delay to let React render the scanner container div
      await new Promise((r) => setTimeout(r, 100));
      var scanner = new window.Html5Qrcode('qr-reader');
      qrScannerRef.current = scanner;
      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 250, height: 250 } },
        (decodedText) => {
          // Parse the URL and extract credentials from hash fragment
          try {
            var url = new URL(decodedText);
            var hash = url.hash;
            if (!hash.startsWith('#pair=')) throw new Error('Not a pairing QR code');
            var b64 = hash.slice(6);
            var creds = JSON.parse(atob(b64));
            if (!creds.channelId || !creds.passphrase) throw new Error('Invalid credentials');
            // Stop scanner and populate fields for user review
            scanner.stop().catch(() => {});
            qrScannerRef.current = null;
            setPairChannel(creds.channelId);
            setPairPassphrase(creds.passphrase);

            setPairingError(null);
            setPairingScreen('prompt');
          } catch (e) {
            rwLog.log('warning', 'PHONE-04', "The scanned code isn't a ReaderWrangler pairing code", { error: String(e) });
            setPairingError('Not a valid ReaderWrangler pairing code. Try again.');
          }
        }
      );
    } catch (e) {
      rwLog.log('warning', 'PHONE-05', `The camera couldn't start for scanning (permission refused?): ${e && e.message}`);
      setPairingError(e.message || 'Could not start camera. Check permissions.');
      setPairingScreen('prompt');
    }
  };

  var stopQRScanner = () => {
    if (qrScannerRef.current) {
      qrScannerRef.current.stop().catch(() => {});
      qrScannerRef.current = null;
    }
    setPairingScreen('prompt');
  };

  // v6.0.0 Phase 2 - Manual credential entry for pairing
  var handleManualPairing = () => {
    var ch = pairChannel.trim();
    var pp = pairPassphrase.trim();
    if (!ch || !pp) {setPairingError('Both Channel ID and Passphrase are required.');return;}
    completePairing({ channelId: ch, passphrase: pp }, 'manually');
  };

  // v6.0.0 Phase 2 - Import credentials from saved file → populate fields
  var handleFileCredentials = () => {
    var input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      var file = e.target.files?.[0];
      if (!file) return;
      try {
        var text = await file.text();
        var creds = JSON.parse(text);
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
  var completePairing = (creds, method) => {
    localStorage.setItem(RELAY_KEY, JSON.stringify({ channelId: creds.channelId, passphrase: creds.passphrase }));
    if (window.RWRelay) window.RWRelay.initFromStorage();
    rwLog.log('info', 'PHONE', `Paired ${method}: channel ${rwLog.shortChannelId(creds.channelId)}`);
    setPairingError(null);
    setPairingScreen('success');
    setLoading(true);
    setTimeout(() => {
      setPairingScreen(null);
      loadAllData().
      then(() => setLoading(false)).
      catch((err) => {
        rwLog.log('critical', 'PHONE-06', "Your library couldn't be loaded on this phone after pairing.",
        { error: String(err && err.message || err), stack: err && err.stack }, { advice: PHONE_LOAD_ADVICE });
        setLoading(false);
      });
    }, 1000);
  };

  // v6.0.0 Phase 2 - Pairing screen (shown when no credentials)
  if (pairingScreen) {
    return (/*#__PURE__*/
      React.createElement("div", { id: "splash", style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', padding: '24px', background: 'var(--bg-page, #ffffff)' } }, /*#__PURE__*/
      React.createElement("img", { src: "icons/logo-transparent.png", alt: "", style: { width: '64px', height: '64px', marginBottom: '16px' } }), /*#__PURE__*/
      React.createElement("div", { style: { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '1.5em', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '8px' } }, "ReaderWrangler\u2122"),

      pairingScreen === 'success' && /*#__PURE__*/
      React.createElement("div", { style: { textAlign: 'center', marginTop: '24px' } }, /*#__PURE__*/
      React.createElement("div", { style: { fontSize: '3em', marginBottom: '12px' } }, "\u2705"), /*#__PURE__*/
      React.createElement("div", { style: { fontSize: '1.1em', fontWeight: 600, color: 'var(--text-primary, #1e293b)' } }, "Paired successfully!"), /*#__PURE__*/
      React.createElement("div", { style: { color: 'var(--text-muted, #64748b)', fontSize: '0.9em', marginTop: '8px' } }, "Loading your library...")
      ),


      pairingScreen === 'scanning' && /*#__PURE__*/
      React.createElement("div", { style: { width: '100%', maxWidth: '400px', marginTop: '16px' } }, /*#__PURE__*/
      React.createElement("div", { style: { textAlign: 'center', marginBottom: '12px', color: 'var(--text-secondary, #475569)', fontSize: '0.95em' } }, "Point your camera at the QR code on your desktop"

      ), /*#__PURE__*/
      React.createElement("div", { id: "qr-reader", style: { width: '100%', borderRadius: '12px', overflow: 'hidden' } }),
      pairingError && /*#__PURE__*/
      React.createElement("div", { style: { color: '#dc2626', fontSize: '0.85em', textAlign: 'center', marginTop: '12px' } }, pairingError), /*#__PURE__*/

      React.createElement("button", { onClick: stopQRScanner, style: {
          display: 'block', width: '100%', marginTop: '16px', padding: '14px',
          background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-primary, #1e293b)',
          border: '1px solid var(--border-default, #e2e8f0)', borderRadius: '12px',
          fontSize: '1em', cursor: 'pointer'
        } }, "Cancel")
      ),


      pairingScreen === 'prompt' && /*#__PURE__*/
      React.createElement("div", { style: { width: '100%', maxWidth: '360px', marginTop: '24px' } }, /*#__PURE__*/
      React.createElement("div", { style: { textAlign: 'center', color: 'var(--text-secondary, #475569)', fontSize: '0.95em', lineHeight: 1.6, marginBottom: '24px' } }, "Pair with your desktop to sync your library."

      ), /*#__PURE__*/


      React.createElement("button", { onClick: startQRScanner, style: {
          display: 'block', width: '100%', padding: '16px', marginBottom: '6px',
          background: 'linear-gradient(135deg, #667eea, #764ba2)', color: 'white',
          border: 'none', borderRadius: '12px', fontSize: '1.05em', fontWeight: 600, cursor: 'pointer'
        } }, "Scan QR Code"), /*#__PURE__*/
      React.createElement("div", { style: { textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.8em', lineHeight: 1.4, marginBottom: '16px' } }, "On your computer, open ", /*#__PURE__*/
      React.createElement("strong", null, "File \u2192 Relay Setup"), " to display the QR code."
      ), /*#__PURE__*/


      React.createElement("button", { onClick: handleFileCredentials, style: {
          display: 'block', width: '100%', padding: '14px', marginBottom: '16px',
          background: 'var(--bg-muted, #f1f5f9)', color: 'var(--text-primary, #1e293b)',
          border: '1px solid var(--border-default, #e2e8f0)', borderRadius: '12px',
          fontSize: '0.95em', cursor: 'pointer'
        } }, "Import Credentials from File"),

      pairingError && /*#__PURE__*/
      React.createElement("div", { style: { color: '#dc2626', fontSize: '0.85em', textAlign: 'center', marginTop: '4px', marginBottom: '4px' } }, pairingError), /*#__PURE__*/



      React.createElement("div", { style: { marginTop: '4px' } }, /*#__PURE__*/
      React.createElement("input", { value: pairChannel, onChange: (e) => setPairChannel(e.target.value), type: "text", placeholder: "Channel ID",
        style: { width: '100%', padding: '12px', marginBottom: '8px', borderRadius: '8px', border: '1px solid var(--border-default, #e2e8f0)', background: 'var(--bg-surface, #fff)', color: 'var(--text-primary, #1e293b)', fontFamily: 'monospace', fontSize: '0.85em', boxSizing: 'border-box' } }), /*#__PURE__*/
      React.createElement("input", { value: pairPassphrase, onChange: (e) => setPairPassphrase(e.target.value), type: "text", placeholder: "Passphrase",
        style: { width: '100%', padding: '12px', marginBottom: '12px', borderRadius: '8px', border: '1px solid var(--border-default, #e2e8f0)', background: 'var(--bg-surface, #fff)', color: 'var(--text-primary, #1e293b)', fontFamily: 'monospace', fontSize: '0.85em', boxSizing: 'border-box' } }), /*#__PURE__*/
      React.createElement("button", { onClick: handleManualPairing, disabled: !pairChannel.trim() || !pairPassphrase.trim(), style: {
          display: 'block', width: '100%', padding: '14px',
          background: !pairChannel.trim() || !pairPassphrase.trim() ? 'var(--bg-muted, #e2e8f0)' : 'var(--bg-accent, #3b82f6)',
          color: !pairChannel.trim() || !pairPassphrase.trim() ? 'var(--text-muted, #94a3b8)' : '#ffffff',
          border: 'none', borderRadius: '12px',
          fontSize: '1em', fontWeight: 600, cursor: !pairChannel.trim() || !pairPassphrase.trim() ? 'default' : 'pointer'
        } }, "Pair using these credentials"), /*#__PURE__*/
      React.createElement("div", { style: { textAlign: 'center', color: 'var(--text-muted, #64748b)', fontSize: '0.78em', lineHeight: 1.4, marginTop: '10px' } }, "Save your credentials on your phone so you can re-pair without your computer if you ever need to reset the app."

      )
      ), /*#__PURE__*/


      React.createElement("div", { style: { textAlign: 'center', marginTop: '24px' } }, /*#__PURE__*/
      React.createElement("button", { onClick: () => setPairingScreen(null), style: {
          background: 'none', border: 'none', color: 'var(--text-muted, #64748b)',
          fontSize: '0.85em', cursor: 'pointer', textDecoration: 'underline'
        } }, "Skip \u2014 use local data only")
      )
      )

      ));

  }

  if (loading) {
    return (/*#__PURE__*/
      React.createElement("div", { id: "splash", style: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: 'var(--bg-page, #ffffff)' } }, /*#__PURE__*/
      React.createElement("img", { src: "icons/logo-transparent.png", alt: "", style: { width: '80px', height: '80px', marginBottom: '20px' } }), /*#__PURE__*/
      React.createElement("div", { style: { fontFamily: "'Libre Baskerville',Georgia,serif", fontSize: '1.8em', fontWeight: 700, color: 'var(--text-primary, #1e293b)', marginBottom: '8px' } }, "ReaderWrangler\u2122"), /*#__PURE__*/
      React.createElement("div", { style: { color: 'var(--text-muted, #64748b)', fontSize: '0.9em', marginBottom: '24px' } }, loadingMessage), /*#__PURE__*/
      React.createElement("div", { className: "splash-spinner" })
      ));

  }

  var hasBooks = books.length > 0;

  return (/*#__PURE__*/
    React.createElement("div", { className: "min-h-screen", style: { background: 'var(--bg-page, #ffffff)', color: 'var(--text-primary, #1e293b)' } },

    storeNotice && /*#__PURE__*/
    React.createElement("div", { style: { position: 'fixed', inset: 0, zIndex: 9000, background: 'rgba(0,0,0,0.5)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px' } }, /*#__PURE__*/
    React.createElement("div", { style: { background: 'var(--bg-surface, #fff)', borderRadius: '12px', padding: '20px', maxWidth: '360px', width: '100%' } },
    storeNotice.title && /*#__PURE__*/React.createElement("div", { style: { fontWeight: 600, marginBottom: '8px' } }, storeNotice.title), /*#__PURE__*/
    React.createElement("div", { style: { fontSize: '14px', marginBottom: storeNotice.reload ? '16px' : 0 } }, storeNotice.body),
    storeNotice.reload && /*#__PURE__*/
    React.createElement("div", { style: { textAlign: 'right' } }, /*#__PURE__*/
    React.createElement("button", { onClick: () => location.reload(), style: { background: '#2563eb', color: '#fff', border: 'none',
        borderRadius: '8px', padding: '8px 16px', fontSize: '14px', touchAction: 'manipulation' } }, "Reload")
    )

    )
    ),


    newerAvailable && /*#__PURE__*/
    React.createElement("div", { onClick: () => location.reload(), style: {
        position: 'fixed', top: '48px', left: 0, right: 0, zIndex: 35,
        background: 'linear-gradient(135deg, #dbeafe, #ede9fe)',
        borderBottom: '1px solid var(--border-default, #e2e8f0)',
        padding: '8px 12px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        fontSize: '13px', cursor: 'pointer', touchAction: 'manipulation'
      } }, /*#__PURE__*/




    React.createElement("span", { style: { color: '#1e293b' } },
    (() => {
      var newerTime = window.RWRelay && window.RWRelay.genTimestamp ? window.RWRelay.genTimestamp(newerAvailable) : 0;
      if (!libraryAsOf || !newerTime) return '📡 Newer library available — tap to refresh';
      var minuteOf = (t) => Math.floor(t / 60000);
      var withSeconds = minuteOf(libraryAsOf) === minuteOf(newerTime);
      var fmt = (t) => new Date(t).toLocaleString([], { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', ...(withSeconds ? { second: '2-digit' } : {}) });
      var sfx = (g) => g ? ` (…${String(g).slice(-4)})` : '';
      var cachedGen = (() => {try {return JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}').deviceStateGen || null;} catch (e) {return null;}})();
      return `📡 Your library is from ${fmt(libraryAsOf)}${sfx(cachedGen)} — a newer one from ${fmt(newerTime)}${sfx(newerAvailable)} is available. Tap to refresh.`;
    })()
    ), /*#__PURE__*/
    React.createElement("button", { onClick: (e) => {e.stopPropagation();dismissedGenRef.current = newerAvailable;setNewerAvailable(null);},
      style: { background: 'none', border: 'none', color: '#64748b', fontSize: '16px', cursor: 'pointer', padding: '0 4px', touchAction: 'manipulation' },
      "aria-label": "Dismiss" }, "\u2715")
    ), /*#__PURE__*/


    React.createElement(Header, {
      currentNav: currentNav, navStack: navStack, folders: folders, books: books, tagRegistry: tagRegistry, bookLists: bookLists, savedSearches: savedSearches,
      onGoBack: goBack, onToggleDrawer: toggleDrawer, onToggleMenu: toggleMenu,
      hasExpandedShelves: expandedShelves.size > 0,
      onCollapseAll: () => setExpandedShelves(new Set()),
      onOpenSearch: () => {
        setSearchQuery('');
        var folderId = currentNav.view === 'folder' ? currentNav.folderId : null;
        navigateTo('search', folderId ? { folderId } : {});
      },
      searchQuery: searchQuery,
      onSearchQueryChange: setSearchQuery }
    ),


    activeOverlay && /*#__PURE__*/React.createElement(Backdrop, { onClick: closeOverlay }),


    activeOverlay === 'drawer' && /*#__PURE__*/
    React.createElement(FolderDrawer, {
      collapsed: drawerCollapsed,
      toggleSection: toggleSection,
      folders: folders,
      books: books,
      showHidden: showHidden,
      folderListSort: folderListSort,
      pinnedTagFolders: pinnedTagFolders,
      tagRegistry: tagRegistry,
      bookLists: bookLists,
      savedSearches: savedSearches,
      onSelectFolder: handleSelectFolder,
      onSelectSearch: handleSelectSearch,
      onClose: closeOverlay }
    ),



    activeOverlay === 'menu' && /*#__PURE__*/
    React.createElement(AppMenu, {
      themePreference: themePreference,
      viewMode: viewMode,
      showDealsOnly: showDealsOnly,
      showHidden: showHidden,
      onApplyTheme: applyTheme,
      onToggleViewMode: handleToggleViewMode,
      onToggleDeals: handleToggleDeals,
      onToggleHidden: handleToggleHidden,
      onDesktopMode: handleDesktopMode,
      onUnpair: handleUnpair,
      onPair: () => setPairingScreen('prompt'),
      onReset: handleReset,
      relayCreds: (() => {try {return JSON.parse(localStorage.getItem(RELAY_KEY));} catch {return null;}})(),
      libraryAsOf: libraryAsOf,
      onClose: closeOverlay }
    ), /*#__PURE__*/



    React.createElement("div", { style: { paddingTop: '48px' } },
    !hasBooks ? /*#__PURE__*/
    React.createElement("div", { className: "flex flex-col items-center justify-center px-6 text-center", style: { minHeight: 'calc(100vh - 48px)' } }, /*#__PURE__*/
    React.createElement("img", { src: "icons/logo-transparent.png", alt: "", className: "w-20 h-20 mb-4" }), /*#__PURE__*/
    React.createElement("p", { className: "text-lg font-semibold mb-2" }, "Welcome to ReaderWrangler Mobile"

    ), /*#__PURE__*/
    React.createElement("p", { className: "text-sm mb-5", style: { color: 'var(--text-muted, #64748b)' } }, "This is the mobile companion to the desktop organizer."

    ), /*#__PURE__*/

    React.createElement("div", { className: "text-sm text-left mb-6 space-y-2 max-w-sm" }, /*#__PURE__*/
    React.createElement("p", null, /*#__PURE__*/React.createElement("span", { className: "font-semibold" }, "1."), " Open ReaderWrangler on your computer"), /*#__PURE__*/
    React.createElement("p", null, /*#__PURE__*/React.createElement("span", { className: "font-semibold" }, "2."), " Go to ", /*#__PURE__*/React.createElement("strong", null, "File \u2192 Relay Setup")), /*#__PURE__*/
    React.createElement("p", null, /*#__PURE__*/React.createElement("span", { className: "font-semibold" }, "3."), " Scan the QR code to pair")
    ), /*#__PURE__*/

    React.createElement("button", {
      onClick: () => setPairingScreen('prompt'),
      className: "w-full max-w-sm py-3 px-4 rounded-lg text-white font-semibold text-base",
      style: { background: 'var(--bg-accent, #3b82f6)' } },
    "Pair with Desktop"

    )
    ) :
    currentNav.view === 'folder' ? /*#__PURE__*/
    React.createElement(FolderView, {
      folderId: currentNav.folderId,
      books: books, folders: folders, pinnedTagFolders: pinnedTagFolders, tagRegistry: tagRegistry, bookLists: bookLists, savedSearches: savedSearches,
      showDealsOnly: showDealsOnly, showHidden: showHidden, onToggleHidden: handleToggleHidden, folderListSort: folderListSort,
      sortOption: sortOption, onCycleSort: cycleSortOption,
      viewMode: viewMode,
      coverUrlMap: coverUrlMap, blankImageBooks: blankImageBooks,
      setBlankImageBooks: setBlankImageBooks,
      onTapBook: (bookId) => navigateTo('detail', { bookId }),
      onTapSubfolder: (folderId) => navigateTo('folder', { folderId }) }
    ) :
    currentNav.view === 'detail' ? /*#__PURE__*/
    React.createElement(BookDetailView, {
      bookId: currentNav.bookId,
      books: books,
      coverUrlMap: coverUrlMap, blankImageBooks: blankImageBooks,
      setBlankImageBooks: setBlankImageBooks,
      tagRegistry: tagRegistry }
    ) :
    currentNav.view === 'search' ? /*#__PURE__*/
    React.createElement(SearchView, {
      books: books, folders: folders,
      folderId: currentNav.folderId || null,
      showDealsOnly: showDealsOnly, showHidden: showHidden,
      sortOption: sortOption,
      coverUrlMap: coverUrlMap, blankImageBooks: blankImageBooks,
      setBlankImageBooks: setBlankImageBooks,
      tagRegistry: tagRegistry,
      onTapBook: (bookId) => navigateTo('detail', { bookId }),
      query: searchQuery }
    ) : /*#__PURE__*/

    React.createElement(Dashboard, {
      collapsed: drawerCollapsed, toggleSection: toggleSection,
      books: books, folders: folders, pinnedTagFolders: pinnedTagFolders, tagRegistry: tagRegistry, bookLists: bookLists, savedSearches: savedSearches,
      showDealsOnly: showDealsOnly, showHidden: showHidden, folderListSort: folderListSort, libraryAsOf: libraryAsOf,
      coverUrlMap: coverUrlMap, blankImageBooks: blankImageBooks,
      setBlankImageBooks: setBlankImageBooks,
      onTapBook: (bookId) => navigateTo('detail', { bookId }),
      onTapFolderTitle: (folderId) => navigateTo('folder', { folderId }),
      onTapSeries: (folderId) => navigateTo('folder', { folderId }),
      expandedShelves: expandedShelves,
      setExpandedShelves: setExpandedShelves }
    )

    ),


    showA2HS && /*#__PURE__*/
    React.createElement("div", { style: {
        position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 8000,
        background: 'var(--bg-card, #f0f7ff)', borderTop: '1px solid var(--border-color, #e2e8f0)',
        padding: '12px 16px', display: 'flex', alignItems: 'center', gap: '12px',
        boxShadow: '0 -2px 8px rgba(0,0,0,0.1)'
      } }, /*#__PURE__*/
    React.createElement("div", { style: { flex: 1, fontSize: '0.85em', lineHeight: 1.4, color: 'var(--text-primary, #1e293b)' } }, /*#__PURE__*/
    React.createElement("strong", null, "Add to Home Screen"), " for a full-screen app experience. Tap ", /*#__PURE__*/
    React.createElement("span", { style: { fontSize: '1.1em' } }, "\u2399"), " then \"Add to Home Screen.\""
    ), /*#__PURE__*/
    React.createElement("button", {
      onClick: () => {
        localStorage.setItem('readerwrangler-mobile-a2hs-dismissed', '1');
        setShowA2HS(false);
      },
      style: {
        background: 'none', border: 'none', fontSize: '1.3em', cursor: 'pointer',
        color: 'var(--text-muted, #64748b)', padding: '4px 8px', flexShrink: 0
      },
      "aria-label": "Dismiss" },
    "\u2715")
    )

    ));

}

ReactDOM.render(/*#__PURE__*/React.createElement(MobileApp, null), document.getElementById('root'));
// Built from mobile.js by tools/build.py: edit mobile.js, never this copy (TODO "Faster loading").
