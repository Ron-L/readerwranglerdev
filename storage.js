// storage.js - IndexedDB and Cache API operations
// Extracted from readerwrangler.js for reuse by Book Explorer
// v6.3.0 - Added write mutex and atomic transactions
// Depends on: uiHelpers.js (normalizeBook)

// ===== IndexedDB Constants =====
const DB_NAME = "ReaderWranglerDB";
const DB_VERSION = 1;
const BOOKS_STORE = "books";

// ===== Cover Cache Constants =====
const COVER_CACHE_NAME = 'rw-covers';

// ===== IndexedDB Helper Functions =====
// 7.25.1 - ONE connection per tab, released when another tab asks. Every load and save used to open a NEW connection and
// none was ever closed, and no tab listened for another tab deleting the store — so Reset App with a second tab open was
// blocked (and said "done" anyway), the reset tab's reload could hang behind the pending delete, and the other tab's next
// save wrote the old library back (a reset half undone). Now, when another tab deletes (or upgrades) the store, this tab
// closes its connection at once, stops saving — openDB refuses, because its in-memory library is out of date — and tells
// the page (onBookStoreGone), which says so. Tests: RESET-001–005 (test/ui/test_reset.py).
// The tab's relation to the store, one state (Law 17): 'ready' (normal) · 'deleting' (THIS tab is deleting it — its own
// connection closing isn't news) · 'reset' / 'upgraded' (ANOTHER tab took it away — final; only a reload leaves it).
let _storeState = 'ready';
let _dbPromise = null;            // this tab's one connection (opened on first use)
const _goneListeners = [];
const _storeGone = () => _storeState === 'reset' || _storeState === 'upgraded';
// The words every page shows (the desktop app, the phone page, the reset page, the emergency reset) — one source.
const BOOK_STORE_TEXT = {
    goneTitle: (state) => `ReaderWrangler was ${state === 'upgraded' ? 'updated' : 'reset'} in another tab.`,
    goneBody: "This tab's contents are out of date. Reload it to continue.", // Ron's words, 2026-11-06
    blocked: 'Close your other ReaderWrangler tabs to finish the reset.'
};
// Subscribe to "another tab took the store away" (called with 'reset' or 'upgraded'); returns the unsubscribe.
// Fires at once if it already happened.
const onBookStoreGone = (fn) => {
    _goneListeners.push(fn);
    if (_storeGone()) fn(_storeState);
    return () => { const i = _goneListeners.indexOf(fn); if (i >= 0) _goneListeners.splice(i, 1); };
};

const openDB = () => {
    if (_storeGone()) return Promise.reject(new Error(BOOK_STORE_TEXT.goneTitle(_storeState) + ' ' + BOOK_STORE_TEXT.goneBody));
    if (_dbPromise) return _dbPromise;
    _dbPromise = new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => { _dbPromise = null; reject(request.error); };
        request.onsuccess = () => {
            const db = request.result;
            db.onversionchange = (event) => {
                db.close();
                _dbPromise = null;
                if (_storeState !== 'ready') return;   // this tab is the one deleting, or already gone
                _storeState = event.newVersion === null ? 'reset' : 'upgraded';
                rwLog.log('info', 'STORE', `${BOOK_STORE_TEXT.goneTitle(_storeState)} This tab let go of the book store and stopped saving.`);
                _goneListeners.slice().forEach(fn => {
                    try { fn(_storeState); } catch (e) { rwLog.log('error', 'STORE-11', `A "reset in another tab" listener failed: ${e && e.message}`, { stack: e && e.stack }); }
                });
            };
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(BOOKS_STORE)) {
                db.createObjectStore(BOOKS_STORE, { keyPath: 'id' });
            }
        };
    });
    return _dbPromise;
};

// 7.25.1 - THE way to delete the book store: Reset App, the "Erase and Reset" offered when the app won't load, the
// Emergency Reset page and the phone's Reset all call it. It resolves only when the store is really gone. If a tab that
// doesn't let go (an older build) blocks it, onBlocked() runs — say BOOK_STORE_TEXT.blocked — and the promise keeps
// waiting: the delete finishes by itself once those tabs close. (Every caller used to treat "blocked" as done.)
const deleteBookStore = ({ onBlocked } = {}) => new Promise((resolve, reject) => {
    const own = _dbPromise;
    _dbPromise = null;
    if (_storeState === 'ready') _storeState = 'deleting';
    const settle = () => { if (_storeState === 'deleting') _storeState = 'ready'; };
    const go = () => {
        const request = indexedDB.deleteDatabase(DB_NAME);
        request.onsuccess = () => { settle(); rwLog.log('info', 'STORE', 'The book store was deleted (a reset)'); resolve(); };
        request.onerror = () => {
            settle();
            rwLog.log('error', 'STORE-08', `A reset couldn't delete the book store: ${request.error && request.error.message}`);
            reject(request.error);
        };
        request.onblocked = () => {
            rwLog.log('warning', 'STORE-09', 'The book store is held open by another tab — the reset waits for it to close');
            if (onBlocked) onBlocked();
        };
    };
    // close this tab's own connection first — it would block its own delete
    if (own) own.then(db => db.close(), () => {}).then(go); else go();
});

// v6.3.0 - Write serialization mutex: queues concurrent saveBooksToIndexedDB calls
// so each completes before the next starts (prevents interleaving clear+add)
let _dbWriteQueue = Promise.resolve();

// v4.18.0.a - Merge logic: preserve orphan wishlist items on import
// v7.8.0 (item 0) - Wishlist decisions use isWishlisted() (uiHelpers.js, loads first) —
// ownershipType is the only decision source; onWishlist is copied through as wire baggage only.
// v5.0.0-alpha.173.1 - Add preserveUserData param to control merge behavior
const saveBooksToIndexedDB = async (books, preserveUserData = false) => {
    // Acquire write lock: queue behind any in-flight write
    let releaseLock;
    const myTurn = new Promise(r => { releaseLock = r; });
    const waitForPrev = _dbWriteQueue;
    _dbWriteQueue = myTurn;
    await waitForPrev;

    try {
        rwLog.log('debug', 'STORE', `Saving ${books.length} books to the book store (merging with what's there: ${preserveUserData})`);

        const db = await openDB();

        let existingByAsin = new Map();
        let allBooks = books;

        // Only merge with existing data during imports, not React saves
        if (preserveUserData) {
            // Step 1: Load existing books BEFORE clearing (to preserve orphan wishlists)
            const existingBooks = await new Promise((resolve, reject) => {
                const readTxn = db.transaction([BOOKS_STORE], 'readonly');
                const readStore = readTxn.objectStore(BOOKS_STORE);
                const request = readStore.getAll();
                request.onsuccess = () => resolve(request.result || []);
                request.onerror = () => reject(request.error);
            });

            // Build map of existing books by ASIN (normalize to handle legacy isWishlist field)
            for (const book of existingBooks) {
                existingByAsin.set(book.asin, normalizeBook(book));
            }

            // Build set of ASINs in the new import
            const newAsins = new Set(books.map(b => b.asin));

            // Step 2: Find orphan wishlist items (in existing but not in new import)
            const orphanWishlists = [];
            for (const [asin, existingBook] of existingByAsin) {
                if (!newAsins.has(asin) && isWishlisted(existingBook)) {
                    orphanWishlists.push(existingBook);
                }
            }

            if (orphanWishlists.length > 0) {
                rwLog.log('debug', 'STORE', `Keeping ${orphanWishlists.length} wishlist books the incoming copy doesn't have`);
            }

            // Step 3: Combine new books with orphan wishlists
            allBooks = [...books, ...orphanWishlists];
        }

        // Step 4: Deduplicate by ASIN (owned books take priority, preserve user metadata)
        const booksByAsin = new Map();
        const duplicates = [];
        const wishlistToOwned = [];

        for (const book of allBooks) {
            const existing = booksByAsin.get(book.asin);
            if (existing) {
                duplicates.push(book.asin);
                // Owned books (not wishlisted) take priority over wishlist
                if (isWishlisted(existing) && !isWishlisted(book)) {
                    // New book is owned, replace wishlist entry
                    // Preserve user metadata from wishlist entry (column assignment preserved via localStorage)
                    wishlistToOwned.push(book.asin);
                    // v7.14.4 - Same-payload wishlist→owned dedup: the wishlist entry (existing) is LOCAL,
                    // the owned entry (book) is INCOMING. mergeBookFields keeps the wishlist entry's price
                    // goal / rating / tags / note (local wins) and, absent a manual onWishlist edit, adopts
                    // the owned ownership — the "preserve the goal across the transition" behavior, now data-
                    // driven. (Previously this branch omitted tags/userNote/isHidden entirely — a latent
                    // resurrection gap of the same class, closed here.)
                    booksByAsin.set(book.asin, mergeBookFields(existing, book));
                } else if (!isWishlisted(existing) && isWishlisted(book)) {
                    // Existing is owned, new is wishlist → keep the OWNED record (authoritative).
                    // DELIBERATELY NOT routed through mergeBookFields (reviewed 2026-09-21, decided against
                    // unifying — see PM v7.15.x / TODO):
                    //   (1) mergeBookFields is INCOMING-as-base; this branch needs LOCAL(owned)-as-base — the
                    //       owned record carries full library metadata, while the incoming wishlist duplicate is
                    //       product-page-scraped and often LESS complete (e.g. "Kindle" vs "Kindle Edition").
                    //       Basing on the wishlist dup could pull worse metadata in this rare same-payload dedup.
                    //   (2) The user-owned cluster is ALREADY registry-driven here via assignUserOwnedFields, so a
                    //       cleared goal/rating/tag/note on the owned book isn't resurrected by a stale wishlist
                    //       dup — the "no field list outside the registry" goal is already met. Unifying would
                    //       need a whole LOCAL-as-base merge mode in mergeBookFields for near-zero gain, and would
                    //       add rare-path regression risk. Left as-is on purpose.
                    booksByAsin.set(book.asin, assignUserOwnedFields({
                        ...existing,
                        addedToWishlist: book.addedToWishlist ?? existing.addedToWishlist,
                    }, existing));
                }
                // If both same ownership status, keep first occurrence (existing)
            } else {
                // Check if this ASIN existed before in IndexedDB (only during imports)
                const previousBook = preserveUserData ? existingByAsin.get(book.asin) : null;
                if (previousBook) {
                    // Track wishlist → owned transitions
                    if (isWishlisted(previousBook) && !isWishlisted(book)) {
                        wishlistToOwned.push(book.asin);
                    }
                    // v5.0.0-alpha.169.7 - Prefer incoming values, fall back to IndexedDB if null
                    // v5.0.0-alpha.173.1 - Only during imports (preserveUserData = true)
                    // v5.0.0-alpha.175.7 - Preserve tags, notes, hidden status
                    // v6.12.0 - Per-field userEdited merge (replaces the old "incoming has userEdited ⇒ it's a
                    // backup, apply its values wholesale" heuristic). Genuine backup restores never reach this
                    // branch — they call saveBooksToIndexedDB with preserveUserData=false and save as-is. So
                    // incoming data here is ALWAYS relay/Amazon, which the app itself may have re-uploaded WITH
                    // userEdited (e.g. after permanent delete). Treating that as a backup let stale relay values
                    // clobber local edits — a cleared series reappearing on import (bug #4).
                    // Rule per field: if the LOCAL copy edited it, keep local; otherwise take the incoming value
                    // (which already carries another device's edit, if any). Union the flags so an edit-marker
                    // propagates across devices in both directions. Same-field two-device conflict → local wins.
                    const ue = previousBook.userEdited || {};
                    if (Object.keys(ue).length > 0) {
                        rwLog.log('debug', 'STORE', `Keeping your edits to "${previousBook.title}": ${Object.keys(ue).join(', ')}`);
                    }
                    // v7.14.4 (one-table v7.17.0) - Data-driven merge (bookMerge.js). Every field's behavior —
                    // user-owned fields (local wins so a deliberate CLEAR survives import), user-overridable fields
                    // (userEdited flag decides), and Amazon-owned metadata (incoming wins) — is declared ONCE in
                    // the BOOK_FIELDS table (bookFields.js, `merge` column) and applied by mergeBookFields. Replaces the hand-listed
                    // field block that (a) resurrected cleared goals/ratings/tags via `incoming ?? local`
                    // and (b) preserved a phantom `note` while the real field is userNote (Ron 2026-09-20).
                    booksByAsin.set(book.asin, mergeBookFields(previousBook, book));
                } else {
                    // React saves: just save as-is, no merge
                    booksByAsin.set(book.asin, book);
                }
            }
        }

        const uniqueBooks = Array.from(booksByAsin.values());
        // v6.17.1 - Surface the ownership-upgrade count (wishlist/sample → owned this import) so the import
        // summary can report it separately — upgrades don't change the total, so "N new" alone hid them.
        uniqueBooks.wishlistToOwnedCount = wishlistToOwned.length;
        // v7.1.0 - Of those upgrades, how many still carry a price goal (deliberately preserved since v5):
        // the import summary nudges the user to clear goals on books they've now bought.
        uniqueBooks.wishlistToOwnedGoalCount = wishlistToOwned.filter(asin => {
            const b = booksByAsin.get(asin);
            return b && (b.targetPrice != null || b.priceTrigger != null);
        }).length;
        // v7.19.0-alpha.11 (Ron) - WHICH upgraded books still carry a visible goal (priceTrigger — what the app's Clear
        // clears), so the import summary can offer one-click "Clear N goals" instead of a manual hunt.
        uniqueBooks.wishlistToOwnedGoalIds = wishlistToOwned.map(asin => booksByAsin.get(asin))
            .filter(b => b && b.priceTrigger != null).map(b => b.id);

        if (duplicates.length > 0) {
            rwLog.log('warning', 'STORE-05', `${duplicates.length} books arrived twice (the same ASIN) — the owned copy was kept`,
                { sample: duplicates.slice(0, 5) });
        }

        if (wishlistToOwned.length > 0) {
            rwLog.log('info', 'STORE', `${wishlistToOwned.length} wishlist books are now owned (their price goals kept)`);
        }

        // v6.3.0 - Atomic clear+add in single transaction (prevents race where
        // a concurrent read sees empty store between separate clear and add txns)
        return new Promise((resolve, reject) => {
            const txn = db.transaction([BOOKS_STORE], 'readwrite');
            const store = txn.objectStore(BOOKS_STORE);
            store.clear();
            for (const book of uniqueBooks) {
                store.add(book);
            }
            txn.oncomplete = () => {
                rwLog.log('debug', 'STORE', `Saved ${uniqueBooks.length} books to the book store`);
                resolve(uniqueBooks);
            };
            txn.onerror = () => {
                const error = txn.error || new Error('IndexedDB transaction failed');
                rwLog.log('critical', 'STORE-06', 'Your books could not be saved in this browser.', { error: String(error) });
                reject(error);
            };
        });
    } catch (error) {
        // a tab that's out of date (reset in another tab) refuses to save ON PURPOSE — not a failure to alarm about
        if (_storeGone()) rwLog.log('info', 'STORE', 'Not saved: this tab is out of date (ReaderWrangler was reset in another tab)');
        else rwLog.log('critical', 'STORE-07', 'Your books could not be saved in this browser.', { error: String(error) });
        throw error || new Error('IndexedDB save failed');
    } finally {
        releaseLock();
    }
};

// v4.18.0.a - Apply normalizeBook to handle legacy isWishlist/isOwned fields
const loadBooksFromIndexedDB = async () => {
    const db = await openDB();
    const transaction = db.transaction([BOOKS_STORE], 'readonly');
    const store = transaction.objectStore(BOOKS_STORE);
    const request = store.getAll();

    return new Promise((resolve, reject) => {
        request.onsuccess = () => {
            // Normalize all books to handle any legacy field formats
            const books = (request.result || []).map(normalizeBook);
            rwLog.log('debug', 'STORE', `Loaded ${books.length} books from the book store`);
            // v7.15.3 (1B) - DEV-ONLY schema check: WARN (never throw) if any loaded book carries a key that
            // isn't a known legitimate field (KNOWN_BOOK_FIELDS in bookFields.js) — a phantom / misnamed /
            // wire-alias field that leaked onto a stored book (the note/userNote, hidden/isHidden class).
            // Dev/local only so production is never affected; first run on a real library also calibrates the
            // allow-list (a warn = add the field to KNOWN_BOOK_FIELDS if legit, else a real phantom to fix).
            try {
                // v7.21.0 - asks the environment answers (readerwrangler.html): the check runs for a CONTRIBUTOR or on the
                // dev site; a self-hoster on localhost is a real user → silent, like production. (typeof guards: Node/tests.)
                const _contributor = typeof isContributor === 'function' && isContributor();
                const isDevEnv = _contributor || (typeof isDevSite === 'function' && isDevSite());
                if (isDevEnv && typeof unknownBookFields === 'function') {
                    const seen = new Set();
                    for (const b of books) for (const k of unknownBookFields(b)) seen.add(k);
                    if (seen.size > 0) {
                        const list = [...seen].sort().join(', ');
                        console.warn('🔎[schema] Unknown book field(s) on loaded books:', list,
                            '— add to KNOWN_BOOK_FIELDS (bookFields.js) if legitimate, else a phantom/misnamed field leaked in.');
                        // v7.15.3 - LOCALHOST dev only: a loud popup so a real phantom can't be missed in the
                        // console. (Not on the dev repo or prod — console.warn covers the dev repo; prod is silent.)
                        // v7.21.0 - contributors only (a self-hoster must never get a dev popup).
                        if (_contributor && typeof window.alert === 'function') {
                            window.alert('⚠ ReaderWrangler dev — book-field schema check\n\n' +
                                'Unknown field(s) found on loaded books:\n    ' + list + '\n\n' +
                                'Either add them to KNOWN_BOOK_FIELDS in bookFields.js (if legitimate), or investigate a ' +
                                'phantom / misnamed field that leaked onto a stored book.\n\n(This popup shows only in contributor mode.)');
                        }
                    }
                }
            } catch (e) { /* a validator must never break a library load */ }
            resolve(books);
        };
        request.onerror = () => reject(request.error);
    });
};

// (7.25.1 - clearIndexedDB, which treated a blocked delete as done, is replaced by deleteBookStore above.)

// ===== Cover Image Caching (v4.13.0) =====

// Build URL map from cached covers (synchronous lookup after async init)
const buildCoverUrlMap = async (books) => {
    const startTime = performance.now();
    const urlMap = {};
    try {
        const cache = await caches.open(COVER_CACHE_NAME);
        for (const book of books) {
            if (book.coverUrl) {
                const cached = await cache.match(book.coverUrl);
                if (cached) {
                    const blob = await cached.blob();
                    urlMap[book.coverUrl] = URL.createObjectURL(blob);
                }
            }
        }
        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`📷 Cover cache: ${Object.keys(urlMap).length}/${books.length} covers loaded from cache in ${elapsed}s`);
    } catch (e) {
        console.error('Cover cache read failed:', e);
    }
    return urlMap;
};

// Populate cache in background (non-blocking) with parallel fetching
const populateCoverCache = async (books) => {
    const CONCURRENCY = 20; // Number of parallel fetches
    const startTime = performance.now();
    try {
        const cache = await caches.open(COVER_CACHE_NAME);
        let cached = 0, fetched = 0, failed = 0;

        // First pass: identify uncached books
        const uncachedBooks = [];
        for (const book of books) {
            if (!book.coverUrl) continue;
            const existing = await cache.match(book.coverUrl);
            if (existing) {
                cached++;
            } else {
                uncachedBooks.push(book);
            }
        }

        // Second pass: fetch uncached in parallel batches
        for (let i = 0; i < uncachedBooks.length; i += CONCURRENCY) {
            const batch = uncachedBooks.slice(i, i + CONCURRENCY);
            const results = await Promise.allSettled(
                batch.map(async (book) => {
                    const response = await fetch(book.coverUrl);
                    if (response.ok) {
                        await cache.put(book.coverUrl, response);
                        return 'fetched';
                    }
                    return 'failed';
                })
            );
            results.forEach(r => {
                if (r.status === 'fulfilled' && r.value === 'fetched') fetched++;
                else failed++;
            });
        }

        const elapsed = ((performance.now() - startTime) / 1000).toFixed(2);
        console.log(`📷 Cover cache populated: ${cached} already cached, ${fetched} newly fetched, ${failed} failed in ${elapsed}s`);
    } catch (e) {
        console.error('Cover cache population failed:', e);
    }
};
