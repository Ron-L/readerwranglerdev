// uiHelpers.js - UI helper functions and constants
// Extracted from readerwrangler.js for reuse by Book Explorer
// v5.0.0-alpha.1

// ===== Storage Keys =====
const STORAGE_KEY = "readerwrangler-state";
const CACHE_KEY = "readerwrangler-enriched-cache";
const SETTINGS_KEY = "readerwrangler-settings";
const STATUS_KEY = "readerwrangler-status";
const FILTERS_KEY = "readerwrangler-filters";
const EXPLORER_KEY = "readerwrangler-explorer"; // v5.0.0 - Explorer view settings
const FOLDERS_KEY = "readerwrangler-folders"; // v5.0.0 - User folder organization
const BOOKLISTS_KEY = "readerwrangler-booklists"; // v6.12.0 - Book Lists (curated, supplemental bookId sets)
const WIZARD_KEY = "readerwrangler-wizard"; // v5.1.0-alpha.23 - Wizard settings
const SEARCH_HISTORY_KEY = "readerwrangler-search-history"; // v5.4.9 - Search history
const THEME_KEY = "readerwrangler-theme"; // v5.5.7 - Theme preference
const RELAY_KEY = "readerwrangler-relay"; // v6.0.0 - Relay credentials (channelId, passphrase)
const RELAY_STATUS_KEY = "readerwrangler-relay-status"; // v6.9.0 - Persisted relay key status ('ok'|'revoked'|null)
const DESKTOP_COVERS_CLEARED_KEY = "readerwrangler-desktop-covers-cleared"; // 7.27.0 - the desktop's old cover copies removed (once)

// ===== Amazon =====
const AMAZON_AFFILIATE_TAG = 'rclewent-20';

// Build Amazon URL with affiliate tag (v4.4.0)
const getAmazonUrl = (asin) => `https://www.amazon.com/dp/${asin}?tag=${AMAZON_AFFILIATE_TAG}`;

// ===== Price Parsing =====
// Parse price string (e.g., "$5.99") to number, returns null if invalid
const parsePrice = (price) => {
    if (price == null) return null;
    if (typeof price === 'number') return price;
    if (typeof price === 'string') {
        const cleaned = price.replace(/[$,\s]/g, '');
        const num = parseFloat(cleaned);
        return isNaN(num) ? null : num;
    }
    return null;
};

// ===== Ownership =====
// v7.8.0 (onWishlist retirement, batch item 0) - THE wishlist-truth accessor, shared by the app
// and storage.js (uiHelpers loads first). ownershipType is the ONLY decision source fleet-wide;
// the onWishlist flag is legacy wire baggage kept for old backups/letters/bookmarklets. The
// fallback clause is the read-side backstop for stored books that predate ownershipType and
// never flow through normalizeBook again — the one place in this page allowed to read the flag.
// Invariant (ratified 2026-09-04): the pair never legitimately diverged; the flag was pure trap.
const isWishlisted = (book) => book.ownershipType === 'wishlist' || (!book.ownershipType && book.onWishlist === true);

// ===== Book Normalization =====
// TODO: DEPRECATION 2026-07-20 - Remove legacy isOwned/isWishlist field handling after 6 months
// Legacy format: isOwned: true/false (from fetcher), isWishlist: 0/1 (internal derived)
// New format: onWishlist: true/false, ownershipType includes 'wishlist' for wishlist-only items
const normalizeBook = (book) => {
    const normalized = { ...book };

    // Handle legacy isOwned field from JSON files
    if ('isOwned' in book) {
        if (book.isOwned === false) {
            // Legacy wishlist item
            normalized.onWishlist = true;
            normalized.ownershipType = normalized.ownershipType || 'wishlist';
        } else {
            // Legacy owned item
            normalized.onWishlist = book.onWishlist ?? false;
        }
        delete normalized.isOwned;
    }

    // Handle legacy isWishlist field (internal format)
    if ('isWishlist' in book) {
        normalized.onWishlist = !!book.isWishlist;
        delete normalized.isWishlist;
    }

    // v7.8.0 (item 0) - THE inbound normalization: a book arriving with only the legacy flag
    // gets the real type stamped BEFORE the purchased default below. Old backups and old
    // fetcher letters present the flag indefinitely — this line is kept forever.
    if (normalized.onWishlist && !normalized.ownershipType) normalized.ownershipType = 'wishlist';

    // v7.12.0 (FORMAT-POLICY) - format-synonym normalization: pre-v2.1.0 wishlist records carry
    // the product page's swatch vocabulary ("Kindle") where the library API says "Kindle
    // Edition" — one format, two spellings, split sort buckets. Map the ONE observed synonym,
    // and never a hand-edited format (the user's word beats vocabulary hygiene).
    if (normalized.binding === 'Kindle' && !normalized.userEdited?.binding) {
        normalized.binding = 'Kindle Edition';
    }

    // Ensure defaults
    normalized.onWishlist = normalized.onWishlist ?? false;
    normalized.ownershipType = normalized.ownershipType || 'purchased';

    // v6.12.0 - F4 backfill: a hidden book is always user-hidden (no auto-hide path exists), so ensure
    // it carries the userEdited.isHidden flag. Without this, a book hidden before isHidden became a
    // tracked userEdited field has no flag, and the import merge silently un-hides it. normalizeBook
    // runs both on load and when building previousBook for the merge, so this protects historical hides.
    if (normalized.isHidden && !(normalized.userEdited && normalized.userEdited.isHidden)) {
        normalized.userEdited = { ...(normalized.userEdited || {}), isHidden: true };
    }

    return normalized;
};

// ===== Date/Time Formatting =====
// Calculate freshness status from fetchDate
const calculateFreshness = (fetchDate) => {
    if (!fetchDate) return 'unknown';

    const now = new Date();
    const fetchTime = new Date(fetchDate);
    const daysSinceFetch = (now - fetchTime) / (1000 * 60 * 60 * 24);

    if (daysSinceFetch < 7) return 'fresh';
    if (daysSinceFetch <= 30) return 'stale';
    return 'obsolete';
};

// 7.29.1 (TODO "Restore dialog calls yesterday's backup 'today'", 20260922-0000a) - THE day words, for every place that
// turns a date into "today" / "yesterday" / "… ago" (today: the Restore Backup box). CALENDAR days in local time (Ron: at
// 12:01 AM, a backup from 11:59 PM is "yesterday") — never 24-hour blocks, which called a 6:54 PM backup "today" until
// 6:54 PM the next day. Each date becomes its local calendar day's number (its local year / month / day, counted as if
// in UTC), so a 23- or 25-hour day at a clock change counts as one day. Replaces the restore box's own arithmetic and
// the unused formatRelativeTime, which had the same 24-hour bug. Tests: test/dayWords.test.js (DAYS-).
const localDayNumber = (d) => Math.floor(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) / 86400000);

// Whole local calendar days from `earlier` to `later` (Date, date string or milliseconds): 0 = the same day.
const calendarDaysBetween = (earlier, later) => localDayNumber(new Date(later)) - localDayNumber(new Date(earlier));

// The words (Ron, 2026-11-13): today / yesterday / 2–6 days ago / 1 week ago (7–13 days) / N weeks ago. A date after
// now (another computer's clock) reads "today"; no date or an unreadable one gives '' (the caller shows no words).
const daysAgoWords = (date, now = new Date()) => {
    if (date == null || isNaN(new Date(date).getTime())) return '';
    const days = calendarDaysBetween(date, now);
    if (days <= 0) return 'today';
    if (days === 1) return 'yesterday';
    if (days < 7) return `${days} days ago`;
    const weeks = Math.floor(days / 7);
    return weeks === 1 ? '1 week ago' : `${weeks} weeks ago`;
};

// v7.21.2 - THE "Date Added" filter presets, shared by desktop + phone: the choices, their date ranges, their labels.
// Replaces 3 copies of the range math and 4 drifting label copies (two printed the raw value "year2025"), plus a
// hand-typed year menu that would have gone stale every January 1.
//   'last30' / 'last90' / 'lastYear' (= last 12 months)     — rolling windows ending today
//   'thisYear' / 'prevYear'                                   — calendar years that ROLL with the clock (Ron: "This year
//                                                               means *this* year whatever the year is")
//   'yearYYYY'                                                — one fixed year (also every saved Search from before)
//   'custom'                                                  — the caller's own dateFrom / dateTo
// Dates are 'YYYY-MM-DD' strings; books are compared on their UTC date, as before.
const isoDay = (d) => d.toISOString().split('T')[0];

const datePresetRange = (preset, today = new Date()) => {
    if (!preset || preset === 'custom') return null;
    const y = today.getFullYear();
    const back = (days) => { const d = new Date(today); d.setDate(d.getDate() - days); return isoDay(d); };
    if (preset === 'last30') return { from: back(30), to: isoDay(today) };
    if (preset === 'last90') return { from: back(90), to: isoDay(today) };
    if (preset === 'lastYear') { const d = new Date(today); d.setFullYear(y - 1); return { from: isoDay(d), to: isoDay(today) }; }
    if (preset === 'thisYear') return { from: `${y}-01-01`, to: `${y}-12-31` };
    if (preset === 'prevYear') return { from: `${y - 1}-01-01`, to: `${y - 1}-12-31` };
    const m = /^year(\d{4})$/.exec(preset);
    if (m) return { from: `${m[1]}-01-01`, to: `${m[1]}-12-31` };
    return { from: '', to: isoDay(today) }; // unknown value: as before — nothing after today
};

const datePresetLabel = (preset, today = new Date()) => {
    const y = today.getFullYear();
    if (preset === 'last30') return 'Last 30 days';
    if (preset === 'last90') return 'Last 90 days';
    if (preset === 'lastYear') return 'Last 12 months';
    if (preset === 'thisYear') return `This year (${y})`;
    if (preset === 'prevYear') return `Last year (${y - 1})`;
    if (preset === 'custom') return 'Custom range';
    const m = /^year(\d{4})$/.exec(preset || '');
    return m ? m[1] : (preset || '');
};

// The year a book was added (UTC, matching the filter's comparison), or null.
const bookAcquiredYear = (book) => {
    const ms = parseInt(book && book.acquired, 10);
    if (!Number.isFinite(ms)) return null;
    const d = new Date(ms);
    return isNaN(d) ? null : d.getUTCFullYear();
};

// The menu's main choices: rolling windows + This year / Last year (no year typed in by hand). 'custom' is the
// caller's own last entry.
const datePresetOptions = (today = new Date()) =>
    ['last30', 'last90', 'lastYear', 'thisYear', 'prevYear'].map(value => ({ value, label: datePresetLabel(value, today) }));

// v7.21.2-alpha.3 (Ron + UX) - the years BEFORE last year that the library actually has books from, newest first —
// offered in one compact "Earlier year" dropdown, not as a long list (a 2001+ library made the menu 25 lines).
const datePresetEarlierYears = (books, today = new Date()) => {
    const y = today.getFullYear();
    const years = new Set();
    for (const b of books || []) { const yr = bookAcquiredYear(b); if (yr && yr < y - 1) years.add(yr); }
    return [...years].sort((a, b) => b - a);
};

// Node export for unit tests / shared modules (no-op in the browser classic-script context,
// where these are plain globals). v7.16.0 - added so bookFields.js (the wire packer/unpacker) + its test can reach them.
if (typeof module !== 'undefined' && module.exports) {
    module.exports = {
        parsePrice, getAmazonUrl, isWishlisted, normalizeBook,
        calculateFreshness, calendarDaysBetween, daysAgoWords,
        datePresetRange, datePresetLabel, datePresetOptions, datePresetEarlierYears, bookAcquiredYear,
    };
}
