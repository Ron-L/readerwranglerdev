// Amazon Library Fetcher
// Fetches library books and enriches them with descriptions, reviews, tags, and prices
//
// Phases:
// - Phase 1: Fetch book titles/metadata (incremental - stops at overlap)
// - Phase 2: Enrich with descriptions & reviews (new books + gap-fill)
// - Phase 3: Fetch tags/genres (incremental - 10 books per run)
// - Phase 4: Fetch prices for wishlist books (all wishlist every run)
//
// Instructions:
// 1. Go to https://www.amazon.com/yourbooks (must be logged in)
// 2. Open DevTools Console (F12 → Console tab)
// 3. Paste this ENTIRE script and press Enter
// 4. If you have existing data, select amazon-library.json when prompted
//    (If no existing file, just cancel the dialog - will fetch ALL books)
// 5. Wait for completion
// 6. Downloads amazon-library.json
// 7. Upload library file to organizer!
//
// Re-run: After pasting once, you can re-run with: fetchAmazonLibrary()

async function fetchAmazonLibrary() {
    const PAGE_TITLE = document.title;
    const FETCHER_VERSION = 'v4.9.0-alpha.2';
    const SCHEMA_VERSION = '2.1';

    console.log('========================================');
    console.log(`Amazon Library Fetcher ${FETCHER_VERSION}`);
    console.log(`📄 Page: ${PAGE_TITLE}`);
    console.log('Phase 1 (titles) + Phase 2 (enrichment) + Phase 3 (tags) + Phase 4 (prices)');
    console.log('========================================\n');

    // Verify we're on the right page
    if (!window.location.href.includes('amazon.com/yourbooks')) {
        console.error('❌ ERROR: Wrong page!');
        console.error('   Please run this on: https://www.amazon.com/yourbooks');
        return;
    }

    const PAGE_SIZE = 30;
    const FETCH_DELAY_MS = 0; // No delay - network RTT provides natural throttling
    const ENRICH_DELAY_MS = 0; // No delay - network RTT provides natural throttling
    const ENRICH_BATCH_SIZE = 30; // Max ASINs per getProducts call (Amazon limit)
    const LIBRARY_FILENAME = 'amazon-library.json';
    const startTime = Date.now();

    // Retry configuration for API errors
    const MAX_RETRIES = 3;
    const RETRY_DELAYS_MS = [5000, 10000, 20000]; // Exponential backoff: 5s, 10s, 20s

    // CSRF token (initialized later, but declared here for scope access in fetchWithRetry)
    let csrfToken = null;

    // Book-only bindings (filter out non-book items)
    const BOOK_BINDINGS = [
        'Kindle Edition',
        'Paperback',
        'Hardcover',
        'Mass Market Paperback',
        'Board book',
        'Unknown Binding',
        'Audible Audiobook',
        'Kindle Edition with Audio/Video'
    ];

    // Global tracking for statistics
    const stats = {
        timing: {
            phase0Start: 0,
            phase0End: 0,
            pass1Start: 0,
            pass1End: 0,
            pass2Start: 0,
            pass2End: 0,
            phase3Start: 0,
            phase3End: 0,
            phase4Start: 0,
            phase4End: 0,
            mergeStart: 0,
            mergeEnd: 0
        },
        apiCalls: {
            total: 0,
            firstTry: 0,
            retry1: 0,
            retry2: 0,
            retry3: 0,
            failed: 0
        },
        nonBooksFiltered: [],
        booksWithoutAuthors: [],
        aiSummariesUsed: [],
        apiErrorBooks: [],
        partialErrorBooks: [],  // Track books with partial errors (got data anyway)
        duplicatesFound: [],  // Track duplicate ASINs
        errorCategories: {
            amazonTimeout: 0,      // 504.1 / Backend Future timed out
            customerMarketplace: 0, // Customer Id or Marketplace Id invalid
            other: 0               // Unrecognized errors
        },
        ownershipTypes: {
            purchased: 0,    // count only (most common)
            sample: 0,
            borrowed: 0,     // Family Library sharing
            prime: 0,        // Prime Reading
            kindleUnlimited: 0, // Kindle Unlimited (KU)
            koll: 0,         // Kindle Owners' Lending Library
            comixology: 0,   // Comixology Unlimited
            unknown: []      // { asin, title, rawType } - for investigation
        }
    };

    // Helper function to format time (used in multiple places)
    const formatTime = (ms) => {
        const totalSeconds = Math.floor(ms / 1000);
        const hours = Math.floor(totalSeconds / 3600);
        const minutes = Math.floor((totalSeconds % 3600) / 60);
        const seconds = totalSeconds % 60;

        if (hours > 0) return `${hours}h ${minutes}m ${seconds}s`;
        else if (minutes > 0) return `${minutes}m ${seconds}s`;
        else return `${seconds}s`;
    };

    // Helper function to format friendly error messages from Amazon API errors
    // Returns { message, category } for both display and stats tracking
    const formatApiError = (errorMsg) => {
        // 504.1 timeout - Amazon backend service timeout
        if (errorMsg.includes('504.1') || errorMsg.includes('Backend Future timed out')) {
            return {
                message: 'Amazon server timeout (504.1) - temporary issue, data still retrieved',
                category: 'amazonTimeout'
            };
        }
        // Customer/Marketplace ID error - benign internal error
        if (errorMsg.includes('Customer Id or Marketplace Id is invalid')) {
            return {
                message: 'Amazon internal error (Customer/Marketplace ID) - data still retrieved',
                category: 'customerMarketplace'
            };
        }
        // Return original if no match (truncate if very long)
        const truncatedMsg = errorMsg.length > 100 ? errorMsg.substring(0, 100) + '...' : errorMsg;
        return {
            message: truncatedMsg,
            category: 'other'
        };
    };


    // ============================================================================
    // Progress Overlay UI (Option C - Minimal + Progress Bar + Abort)
    // ============================================================================
    const progressUI = (() => {
        let overlay = null;
        let phaseElement = null;
        let detailElement = null;
        let progressBarFill = null;
        let progressText = null;
        let timerElement = null;
        let phaseStartTime = null;
        let abortRequested = false;

        function create() {
            overlay = document.createElement('div');
            overlay.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                background: white;
                border-radius: 12px;
                box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
                padding: 20px;
                padding-top: 35px;
                z-index: 10000;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
                min-width: 300px;
                max-width: 400px;
            `;

            overlay.innerHTML = `
                <button id="closeBtn" style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #999;
                    cursor: pointer;
                    padding: 4px 8px;
                    line-height: 1;
                " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#999'">✕</button>
                <div style="font-size: 18px; font-weight: bold; color: #333; margin-bottom: 10px;">
                    📚 Library Download ${FETCHER_VERSION}
                </div>
                <div id="progressPhase" style="font-size: 14px; color: #667eea; margin-bottom: 8px; font-weight: 500;">
                    Starting...
                </div>
                <div id="progressDetail" style="font-size: 13px; color: #666; margin-bottom: 8px;">
                    Initializing
                </div>
                <div id="progressBarContainer" style="display: none; margin-bottom: 8px;">
                    <div style="background: #e0e0e0; border-radius: 4px; height: 8px; overflow: hidden;">
                        <div id="progressBarFill" style="background: linear-gradient(90deg, #667eea, #764ba2); height: 100%; width: 0%; transition: width 0.3s ease;"></div>
                    </div>
                    <div id="progressText" style="font-size: 12px; color: #666; margin-top: 4px; text-align: center;"></div>
                </div>
                <div id="timerDisplay" style="font-size: 12px; color: #999; text-align: center; padding-top: 8px; border-top: 1px solid #eee;">
                    ⏱️ Elapsed: 0s
                </div>
            `;

            phaseElement = overlay.querySelector('#progressPhase');
            detailElement = overlay.querySelector('#progressDetail');
            progressBarFill = overlay.querySelector('#progressBarFill');
            progressText = overlay.querySelector('#progressText');
            timerElement = overlay.querySelector('#timerDisplay');

            // Add click handler for X button - sets abort flag and removes overlay
            const closeBtn = overlay.querySelector('#closeBtn');
            if (closeBtn) {
                closeBtn.onclick = () => {
                    abortRequested = true;
                    console.log('⚠️ Abort requested by user - will stop after current operation');
                    overlay.remove();
                };
            }

            document.body.appendChild(overlay);
        }

        function isAborted() {
            return abortRequested;
        }

        function updatePhase(phase, detail = '') {
            if (!overlay) create();
            if (phaseElement) phaseElement.textContent = phase;
            if (detailElement) detailElement.textContent = detail;
            // Reset timer when phase changes
            phaseStartTime = Date.now();
            updateTimer();
        }

        function updateTimer() {
            if (!overlay || !phaseStartTime) return;
            const elapsed = Date.now() - phaseStartTime;
            const seconds = Math.floor(elapsed / 1000);
            const minutes = Math.floor(seconds / 60);
            const remainingSeconds = seconds % 60;
            const timeStr = minutes > 0 ? `${minutes}m ${remainingSeconds}s` : `${seconds}s`;
            if (timerElement) timerElement.textContent = `⏱️ Elapsed: ${timeStr}`;
        }

        function updateProgress(current, total) {
            if (!overlay) create();
            const container = overlay.querySelector('#progressBarContainer');
            if (container) container.style.display = 'block';

            const percent = Math.round((current / total) * 100);
            if (progressBarFill) progressBarFill.style.width = `${percent}%`;
            if (progressText) progressText.textContent = `${current.toLocaleString()} of ${total.toLocaleString()} books (${percent}%)`;
            updateTimer(); // Update elapsed time with each progress update
        }

        function updateDetail(detail) {
            if (!overlay) create();
            if (detailElement) detailElement.textContent = detail;
            updateTimer(); // Update elapsed time
        }

        function remove() {
            if (overlay && overlay.parentElement) {
                overlay.style.transition = 'opacity 0.3s';
                overlay.style.opacity = '0';
                setTimeout(() => overlay.remove(), 300);
            }
        }

        function showComplete(message) {
            if (!overlay) return;
            overlay.innerHTML = `
                <button style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #999;
                    cursor: pointer;
                    padding: 4px 8px;
                    line-height: 1;
                " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#999'" onclick="this.parentElement.remove()">✕</button>
                <div style="font-size: 18px; font-weight: bold; color: #2e7d32; margin-bottom: 10px;">
                    ✅ Complete!
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
                    ${message}
                </div>
                <button style="
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                " onclick="this.parentElement.remove()">
                    Close
                </button>
            `;
            // Auto-dismiss after 30 seconds
            setTimeout(remove, 30000);
        }

        function showError(message) {
            if (!overlay) create();
            overlay.innerHTML = `
                <button style="
                    position: absolute;
                    top: 8px;
                    right: 8px;
                    background: none;
                    border: none;
                    font-size: 20px;
                    color: #999;
                    cursor: pointer;
                    padding: 4px 8px;
                    line-height: 1;
                " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#999'" onclick="this.parentElement.remove()">✕</button>
                <div style="font-size: 18px; font-weight: bold; color: #c62828; margin-bottom: 10px;">
                    ❌ Error
                </div>
                <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
                    ${message}
                </div>
                <div style="font-size: 12px; color: #999; border-top: 1px solid #eee; padding-top: 10px;">
                    Check console for details
                </div>
                <button style="
                    background: #f44336;
                    color: white;
                    border: none;
                    padding: 10px 20px;
                    border-radius: 8px;
                    font-size: 14px;
                    font-weight: bold;
                    cursor: pointer;
                    width: 100%;
                    margin-top: 10px;
                " onclick="this.parentElement.remove()">
                    Close
                </button>
            `;
        }

        // Show save button and return Promise that resolves with 'save' or 'cancel'.
        // WHY THIS EXISTS: showSaveFilePicker() requires an active "user gesture" (click/keypress).
        // After a 3+ minute fetch, the original gesture from pasting the script has expired.
        // This button provides a fresh user gesture immediately before calling showSaveFilePicker.
        // Without this, Chrome throws: "SecurityError: Must be handling a user gesture to show a file picker"
        // See: https://developer.mozilla.org/en-US/docs/Web/API/Window/showSaveFilePicker
        function showSaveButton(bookCount) {
            return new Promise((resolve) => {
                if (!overlay) create();
                overlay.innerHTML = `
                    <div style="font-size: 18px; font-weight: bold; color: #2e7d32; margin-bottom: 10px;">
                        ✅ Download Complete!
                    </div>
                    <div style="font-size: 14px; color: #666; margin-bottom: 15px;">
                        ${bookCount.toLocaleString()} books ready to save
                    </div>
                    <button id="saveLibraryBtn" style="
                        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                        color: white;
                        border: none;
                        padding: 12px 20px;
                        border-radius: 8px;
                        font-size: 16px;
                        font-weight: bold;
                        cursor: pointer;
                        width: 100%;
                        transition: transform 0.1s;
                    ">
                        💾 Save Library File
                    </button>
                    <div style="font-size: 12px; color: #999; margin-top: 10px; text-align: center;">
                        Click to choose save location
                    </div>
                    <button id="cancelSaveBtn" title="Discard downloaded data" style="
                        background: transparent;
                        color: #999;
                        border: 1px solid #ccc;
                        padding: 6px 16px;
                        border-radius: 4px;
                        font-size: 12px;
                        cursor: pointer;
                        margin-top: 15px;
                    ">
                        Cancel
                    </button>
                `;
                const saveBtn = overlay.querySelector('#saveLibraryBtn');
                saveBtn.onmouseover = () => saveBtn.style.transform = 'scale(1.02)';
                saveBtn.onmouseout = () => saveBtn.style.transform = 'scale(1)';
                saveBtn.onclick = () => {
                    resolve('save');
                };
                const cancelBtn = overlay.querySelector('#cancelSaveBtn');
                cancelBtn.onmouseover = () => { cancelBtn.style.borderColor = '#999'; cancelBtn.style.color = '#666'; };
                cancelBtn.onmouseout = () => { cancelBtn.style.borderColor = '#ccc'; cancelBtn.style.color = '#999'; };
                cancelBtn.onclick = () => {
                    resolve('cancel');
                };
            });
        }

        return { create, updatePhase, updateDetail, updateProgress, remove, showComplete, showError, isAborted, showSaveButton };
    })();

    // Initialize progress UI
    progressUI.create();

    // ============================================================================
    // Shared Extraction Functions
    // These ensure Phase 0, Pass 1, and Pass 2 all extract data identically
    // ============================================================================

    // RECURSIVE fragment extractor - handles arbitrarily deep nesting
    const extractTextFromFragments = (fragments) => {
        if (!fragments || !Array.isArray(fragments)) return '';

        const textParts = [];

        for (const frag of fragments) {
            // Direct text
            if (frag.text) {
                textParts.push(frag.text);
            }

            // Text in paragraph
            if (frag.paragraph?.text) {
                textParts.push(frag.paragraph.text);
            }

            // Fragments in paragraph (RECURSIVE)
            if (frag.paragraph?.fragments) {
                textParts.push(extractTextFromFragments(frag.paragraph.fragments));
            }

            // Text in semanticContent
            if (frag.semanticContent?.content?.text) {
                textParts.push(frag.semanticContent.content.text);
            }

            // Nested fragments in semanticContent (RECURSIVE!)
            if (frag.semanticContent?.content?.fragments) {
                textParts.push(extractTextFromFragments(frag.semanticContent.content.fragments));
            }

            // Paragraph in semanticContent
            if (frag.semanticContent?.content?.paragraph?.text) {
                textParts.push(frag.semanticContent.content.paragraph.text);
            }

            // Fragments in paragraph in semanticContent (RECURSIVE)
            if (frag.semanticContent?.content?.paragraph?.fragments) {
                textParts.push(extractTextFromFragments(frag.semanticContent.content.paragraph.fragments));
            }
        }

        return textParts.join('');
    };

    const extractDescription = (product) => {
        const descSection = product.description?.sections?.[0];
        const descContent = descSection?.content;

        if (!descContent) return '';

        // Simple string
        if (typeof descContent === 'string') {
            return descContent;
        }

        // Direct text
        if (descContent.text) {
            return descContent.text;
        }

        // Paragraph with text
        if (descContent.paragraph?.text) {
            return descContent.paragraph.text;
        }

        // Paragraph with fragments
        if (descContent.paragraph?.fragments) {
            return extractTextFromFragments(descContent.paragraph.fragments).trim();
        }

        // Direct fragments (most common case)
        if (descContent.fragments) {
            return extractTextFromFragments(descContent.fragments).trim();
        }

        // semanticContent with nested fragments
        if (descContent.semanticContent?.content?.fragments) {
            return extractTextFromFragments(descContent.semanticContent.content.fragments).trim();
        }

        // semanticContent with text
        if (descContent.semanticContent?.content?.text) {
            return descContent.semanticContent.content.text;
        }

        return '';
    };

    const extractAISummary = (product) => {
        const recommendations = product.auxiliaryStoreRecommendations?.recommendations || [];

        for (const rec of recommendations) {
            if (rec.recommendationType === 'AI_SUMMARIES' && rec.sharedContent?.length > 0) {
                return rec.sharedContent[0].contentAbstract?.textAbstract || '';
            }
        }

        return '';
    };

    const extractAuthors = (product) => {
        return product.byLine?.contributors
            ?.map(c => c.name || c.contributor?.author?.profile?.displayName)
            .filter(Boolean)
            .join(', ') || 'Unknown Author';
    };

    const extractCoverUrls = (product) => {
        const images = product.images?.images?.[0];
        const hiResUrl = (images?.hiRes?.physicalId && images?.hiRes?.extension)
            ? `https://images-na.ssl-images-amazon.com/images/I/${images.hiRes.physicalId}.${images.hiRes.extension}`
            : null;
        const lowResUrl = (images?.lowRes?.physicalId && images?.lowRes?.extension)
            ? `https://images-na.ssl-images-amazon.com/images/I/${images.lowRes.physicalId}.${images.lowRes.extension}`
            : null;
        const fallbackUrl = `https://images-na.ssl-images-amazon.com/images/P/${product.asin}.01.LZZZZZZZ.jpg`;

        // coverUrl: prefer lowRes for smaller file size (311x500 vs 1594x2560)
        // coverUrlHiRes: archive hiRes for future use (zoom, print, etc.)
        return {
            coverUrl: lowResUrl || hiResUrl || fallbackUrl,
            coverUrlHiRes: hiResUrl
        };
    };

    const extractReviews = (product) => {
        return product.customerReviewsTop?.reviews?.map(review => ({
            stars: review.stars,
            title: review.title,
            text: review.contentAbstract?.textAbstract || '',
            reviewer: review.contributor?.publicProfile?.publicProfile?.publicName?.displayString || 'Anonymous'
        })) || [];
    };

    const extractPublicationDate = (product) => {
        // Search overview.sectionGroups for book_details-publication_date
        // Date appears in 3 section groups (TechSpec, DetailBullets, RichProductInfo) - use first match
        const sectionGroups = product.overview?.sectionGroups || [];

        for (const group of sectionGroups) {
            for (const section of (group.sections || [])) {
                for (const attr of (section.attributes || [])) {
                    if (attr.label?.id === 'book_details-publication_date') {
                        const displayContent = attr.granularizedValue?.displayContent;
                        if (!displayContent) continue;

                        // displayContent is now a raw Object - could be structured or simple
                        let dateText = null;

                        // Try fragments[0].text first (original structure)
                        if (displayContent.fragments?.[0]?.text) {
                            dateText = displayContent.fragments[0].text;
                        }
                        // Try direct string if displayContent is just text
                        else if (typeof displayContent === 'string') {
                            dateText = displayContent;
                        }
                        // Try text property directly
                        else if (displayContent.text) {
                            dateText = displayContent.text;
                        }

                        if (dateText) {
                            // Parse human-readable date (e.g., "August 26, 2014") to ISO format
                            try {
                                const parsed = new Date(dateText);
                                if (!isNaN(parsed.getTime())) {
                                    return parsed.toISOString().split('T')[0]; // "2014-08-26"
                                }
                            } catch (e) {
                                // Fall back to raw text if parsing fails
                            }
                            return dateText; // Return raw text if parsing failed
                        }
                    }
                }
            }
        }
        return '';
    };

    // ============================================================================
    // Retry Helper Function
    // ============================================================================

    /**
     * Fetch with exponential backoff retry logic
     * @param {Function} fetchFn - Async function that performs the fetch
     * @param {string} bookTitle - Book title for logging
     * @param {number} maxRetries - Maximum retry attempts
     * @returns {Promise<Object>} - Response data or throws error
     */
    const fetchWithRetry = async (fetchFn, context, maxRetries = MAX_RETRIES) => {
        let lastError = null;
        stats.apiCalls.total++;

        for (let attempt = 0; attempt <= maxRetries; attempt++) {
            try {
                const result = await fetchFn();

                // Check for HTTP errors
                if (result.httpError) {
                    throw new Error(`HTTP ${result.httpStatus}`);
                }

                // Check for API errors
                if (result.apiError) {
                    // ⚠️ DIAGNOSTIC: Include actual error message in exception
                    const errorMsg = result.errorMessage || 'API error';
                    throw new Error(errorMsg);
                }

                // Check for missing data
                if (result.noData) {
                    throw new Error('No data returned');
                }

                // Success! Track which attempt succeeded
                if (attempt === 0) {
                    stats.apiCalls.firstTry++;
                } else if (attempt === 1) {
                    stats.apiCalls.retry1++;
                } else if (attempt === 2) {
                    stats.apiCalls.retry2++;
                } else if (attempt === 3) {
                    stats.apiCalls.retry3++;
                }

                return result;

            } catch (error) {
                lastError = error;

                // If this was the last attempt, try ONE MORE TIME with fresh token
                if (attempt === maxRetries) {
                    console.log(`   🔄 All retries failed. Trying with FRESH token...`);

                    try {
                        // Get fresh CSRF token from page
                        const freshCsrfMeta = document.querySelector('meta[name="anti-csrftoken-a2z"]');
                        if (freshCsrfMeta) {
                            const freshToken = freshCsrfMeta.getAttribute('content');
                            const oldToken = csrfToken;

                            // Compare tokens
                            if (freshToken === oldToken) {
                                console.log(`   🔍 Token comparison: IDENTICAL (token has not changed)`);
                                console.log(`      Old: ${oldToken.substring(0, 20)}...`);
                                console.log(`      New: ${freshToken.substring(0, 20)}...`);
                            } else {
                                console.log(`   🔍 Token comparison: DIFFERENT (token has been refreshed)`);
                                console.log(`      Old: ${oldToken.substring(0, 20)}...`);
                                console.log(`      New: ${freshToken.substring(0, 20)}...`);
                            }

                            // Update global token for subsequent requests
                            csrfToken = freshToken;

                            // Retry with fresh token
                            const freshResult = await fetchFn();

                            // Check for errors with fresh token
                            if (freshResult.httpError) {
                                console.log(`   ❌ Fresh token failed with HTTP ${freshResult.httpStatus}`);
                                csrfToken = oldToken; // Restore old token
                                break;
                            }

                            if (freshResult.apiError) {
                                console.log(`   ❌ Fresh token failed with API error: ${freshResult.errorMessage}`);
                                csrfToken = oldToken; // Restore old token
                                break;
                            }

                            if (freshResult.noData) {
                                console.log(`   ❌ Fresh token returned no data`);
                                csrfToken = oldToken; // Restore old token
                                break;
                            }

                            // SUCCESS WITH FRESH TOKEN!
                            console.log(`   ✅ SUCCESS with fresh token! Continuing with refreshed token.`);
                            stats.apiCalls.retry3++; // Count as successful retry
                            return freshResult;
                        } else {
                            console.log(`   ⚠️  Could not find fresh token on page`);
                        }
                    } catch (freshError) {
                        console.log(`   ❌ Fresh token attempt failed: ${freshError.message}`);
                    }

                    break; // Give up after fresh token attempt
                }

                // Otherwise, wait and retry
                const delay = RETRY_DELAYS_MS[attempt];
                console.log(`   ⏳ Retry ${attempt + 1}/${maxRetries} after ${delay/1000}s...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }

        // All retries exhausted - track failure
        stats.apiCalls.failed++;
        throw lastError;
    };

    // ============================================================================

    try {
        // Step 1: Load existing data (if any)
        console.log('[1/7] Checking for existing library data...');
        progressUI.updatePhase('Checking Library Data', 'Select existing library file or cancel to download all books');
        console.log('');
        console.log('   📂 A file picker dialog will open...');
        console.log('');
        console.log('   • If you have amazon-library.json: SELECT IT');
        console.log('   • If this is your first run: CLICK CANCEL');
        console.log('');
        console.log('   (Dialog may be hidden behind other windows - check taskbar!)\n');

        let existingBooks = [];
        let existingCollections = null; // Preserve collections section if present
        let mostRecentDate = null;
        let fileHandle = null; // File System Access API handle for writing back to same file

        // Check if File System Access API is available (Chrome/Edge)
        const hasFileSystemAccess = 'showOpenFilePicker' in window;

        let file = null;
        if (hasFileSystemAccess) {
            // Use File System Access API - allows writing back to same file
            try {
                const [handle] = await window.showOpenFilePicker({
                    types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }]
                });
                fileHandle = handle;
                file = await handle.getFile();
            } catch (e) {
                if (e.name === 'AbortError') {
                    // User cancelled - first run, no existing file
                    file = null;
                } else {
                    throw e;
                }
            }
        } else {
            // Fallback for Firefox/Safari - uses traditional file input
            console.log('   ⚠️  Note: Your browser doesn\'t support File System Access API');
            console.log('   File will be downloaded separately - you must manually replace the old file\n');

            const fileInput = document.createElement('input');
            fileInput.type = 'file';
            fileInput.accept = '.json';

            file = await new Promise((resolve) => {
                fileInput.onchange = (e) => {
                    resolve(e.target.files[0]);
                };
                fileInput.oncancel = () => resolve(null);
                fileInput.click();
            });
        }

        if (file) {
            const fileText = await file.text();
            const parsedData = JSON.parse(fileText);

            // Reject backup files - fetchers should only work with library files
            if (parsedData.isBackup === true) {
                console.error('   ❌ This is a backup file');
                console.error('   Fetchers cannot update backup files');
                console.error('   Please select a library file instead');
                progressUI.showError('This is a backup file. Please select a library file instead.');
                throw new Error('Backup file selected - fetchers require a library file');
            }

            // Schema v2.x format: { schemaVersion: "2.x", books: { items: [...] }, ... }
            if (parsedData.schemaVersion?.startsWith('2.')) {
                if (!parsedData.books || !parsedData.books.items) {
                    console.error('   ❌ Invalid v2.x file - Missing books.items');
                    console.error('   Received:', Object.keys(parsedData));
                    throw new Error('Invalid v2.x file - Missing books.items');
                }
                existingBooks = parsedData.books.items;
                console.log(`   📋 Loaded ${parsedData.schemaVersion} unified file (${existingBooks.length} books)`);
                // Preserve collections section if present
                if (parsedData.collections) {
                    existingCollections = parsedData.collections;
                    console.log(`   📋 Preserving existing collections data`);
                }
            }
            // Legacy v1.x format: { type: "library", metadata: {...}, books: [...] }
            else if (parsedData.type) {
                // Validate type value
                if (parsedData.type === "library") {
                    // Verify library structure
                    if (!parsedData.metadata || !parsedData.books) {
                        console.error('   ❌ Invalid library file - Missing metadata or books array');
                        console.error('   Received:', Object.keys(parsedData));
                        throw new Error('Invalid library file - Missing metadata or books array');
                    }
                    existingBooks = parsedData.books;
                    console.log(`   📋 Loaded legacy ${parsedData.type} file (${existingBooks.length} books)`);
                    console.log(`   ⚠️  Note: Will upgrade to v2.0 format on save`);
                } else if (parsedData.type === "collections") {
                    console.error('   ❌ Wrong file type - This is a collections file');
                    console.error('   Please select a library file instead');
                    throw new Error('Wrong file type - This is a collections file. Please select a library file.');
                } else {
                    console.error(`   ❌ Unknown file type: "${parsedData.type}"`);
                    console.error('   Expected: "library" or v2.0 unified format');
                    throw new Error(`Unknown file type: "${parsedData.type}". Expected "library" or v2.0 unified format.`);
                }
            } else {
                console.error('   ❌ Invalid file format - Missing schemaVersion or type field');
                console.error('   Received:', Object.keys(parsedData));
                throw new Error('Invalid file format - Missing schemaVersion or type field');
            }

            // Find most recent acquisition date
            for (const book of existingBooks) {
                if (book.acquisitionDate) {
                    const bookDate = parseInt(book.acquisitionDate);
                    if (!mostRecentDate || bookDate > mostRecentDate) {
                        mostRecentDate = bookDate;
                    }
                }
            }

            console.log(`✅ Loaded ${existingBooks.length} existing books`);
            if (mostRecentDate) {
                const date = new Date(mostRecentDate);
                console.log(`   Most recent: ${date.toLocaleDateString()}`);
            }
        } else {
            console.log('📂 No existing file - will fetch ALL books');
        }
        console.log('');

        // Step 2: Find CSRF token
        console.log('[2/7] Getting CSRF token...');
        progressUI.updatePhase('Getting CSRF Token', 'Authenticating with Amazon API');
        const csrfMeta = document.querySelector('meta[name="anti-csrftoken-a2z"]');

        if (!csrfMeta) {
            throw new Error('❌ CSRF token not found. Make sure you are logged in.');
        }

        csrfToken = csrfMeta.getAttribute('content'); // Assign to existing variable (declared at top)
        console.log(`✅ Found CSRF token: ${csrfToken.substring(0, 10)}...\n`);

        // Phase 0: Validate API endpoints before fetching
        console.log('[Phase 0] Validating Amazon API endpoints...');
        progressUI.updatePhase('Validating APIs', 'Testing Amazon endpoints and extraction logic');
        stats.timing.phase0Start = Date.now();
        console.log('   Testing library query...');

        // Test library query with minimal request (1 book)
        const testLibraryQuery = `query ccGetCustomerLibraryBooks {
            getCustomerLibrary {
                books(after: "", first: 1, sortBy: {sortField: ACQUISITION_DATE, sortOrder: DESCENDING}, selectionCriteria: {tags: [], query: "NOT (222711ade9d0f22714af93d1c8afec60 OR 858f501de8e2d7ece33f768936463ac8)"}, groupBySeries: false) {
                    pageInfo {
                        hasNextPage
                        endCursor
                    }
                    totalCount {
                        number
                        relation
                    }
                    edges {
                        node {
                            asin
                            product {
                                asin
                                title {
                                    displayString
                                }
                            }
                        }
                    }
                    __typename
                }
            }
        }`;

        try {
            const result = await fetchWithRetry(async () => {
                const testLibraryResponse = await fetch('https://www.amazon.com/kindle-reader-api', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'content-type': 'application/json',
                        'anti-csrftoken-a2z': csrfToken,
                        'x-client-id': 'your-books'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        query: testLibraryQuery,
                        operationName: 'ccGetCustomerLibraryBooks'
                    })
                });

                if (!testLibraryResponse.ok) {
                    return { httpError: true, httpStatus: testLibraryResponse.status };
                }

                const testLibraryData = await testLibraryResponse.json();

                if (testLibraryData.errors) {
                    return { apiError: true, errors: testLibraryData.errors };
                }

                const testLibrary = testLibraryData?.data?.getCustomerLibrary?.books;

                if (!testLibrary || !testLibrary.edges) {
                    return { noData: true };
                }

                // Success
                return { library: testLibrary };
            }, 'Phase 0 library test');

            const testLibrary = result.library;
            console.log(`   ✅ Library API working (found ${testLibrary.totalCount?.number || 0} books)`);

        } catch (error) {
            console.error('\n❌ LIBRARY API VALIDATION FAILED');
            console.error('========================================');
            console.error('The library query failed. This usually means:');
            console.error('1. You are not logged into Amazon - Log in and try again');
            console.error('2. Your session has expired - Refresh the page and try again');
            console.error('3. Amazon API structure has changed - Report this issue');
            console.error('4. Network/firewall issues - Check your connection');
            console.error('');
            console.error('Technical details:');
            console.error(error.message);
            console.error('========================================\n');
            throw error;
        }

        // Test enrichment query with a sample ASIN
        console.log('   Testing enrichment query...');

        // Get a test ASIN from the library test result
        let testAsin = 'B000FC0U6Q'; // Default fallback ASIN

        try {
            const testLibraryResponse = await fetch('https://www.amazon.com/kindle-reader-api', {
                method: 'POST',
                headers: {
                    'accept': 'application/json, text/plain, */*',
                    'content-type': 'application/json',
                    'anti-csrftoken-a2z': csrfToken,
                    'x-client-id': 'your-books'
                },
                credentials: 'include',
                body: JSON.stringify({
                    query: testLibraryQuery,
                    operationName: 'ccGetCustomerLibraryBooks'
                })
            });

            const testLibraryData = await testLibraryResponse.json();
            const firstBook = testLibraryData?.data?.getCustomerLibrary?.books?.edges?.[0];
            if (firstBook?.node?.product?.asin) {
                testAsin = firstBook.node.product.asin;
            }
        } catch {
            // Use fallback ASIN if we can't get one from library
        }

        const testEnrichQuery = `query enrichBook {
            getProducts(input: [{asin: "${testAsin}"}]) {
                asin
                title {
                    displayString
                }
                byLine {
                    contributors {
                        name
                        contributor {
                            author {
                                profile {
                                    displayName
                                }
                            }
                        }
                    }
                }
                images {
                    images {
                        hiRes {
                            physicalId
                            extension
                        }
                        lowRes {
                            physicalId
                            extension
                        }
                    }
                }
                customerReviewsSummary {
                    count {
                        displayString
                    }
                    rating {
                        value
                    }
                }
                bookSeries {
                    singleBookView {
                        series {
                            title
                            position
                        }
                    }
                }
                bindingInformation {
                    binding {
                        displayString
                    }
                }
                description {
                    sections(filter: {types: PRODUCT_DESCRIPTION}) {
                        content
                    }
                }
                auxiliaryStoreRecommendations(
                    recommendationTypes: ["AI_SUMMARIES"]
                ) {
                    recommendations {
                        recommendationType
                        sharedContent {
                            contentAbstract {
                                textAbstract
                            }
                        }
                    }
                }
                customerReviewsTop {
                    reviews {
                        contentAbstract {
                            textAbstract
                        }
                        contributor {
                            publicProfile {
                                publicProfile {
                                    publicName {
                                        displayString
                                    }
                                }
                            }
                        }
                        title
                        stars
                    }
                }
            }
        }`;

        try {
            const enrichResult = await fetchWithRetry(async () => {
                const testEnrichResponse = await fetch('https://www.amazon.com/kindle-reader-api', {
                    method: 'POST',
                    headers: {
                        'accept': 'application/json, text/plain, */*',
                        'content-type': 'application/json',
                        'anti-csrftoken-a2z': csrfToken,
                        'x-client-id': 'your-books'
                    },
                    credentials: 'include',
                    body: JSON.stringify({
                        query: testEnrichQuery,
                        operationName: 'enrichBook'
                    })
                });

                if (!testEnrichResponse.ok) {
                    return { httpError: true, httpStatus: testEnrichResponse.status };
                }

                const testEnrichData = await testEnrichResponse.json();

                if (testEnrichData.errors) {
                    return { apiError: true, errors: testEnrichData.errors };
                }

                const testProduct = testEnrichData?.data?.getProducts?.[0];

                if (!testProduct) {
                    return { noData: true };
                }

                // Success
                return { product: testProduct };
            }, `Phase 0 enrichment test (${testAsin})`);

            const testProduct = enrichResult.product;
            console.log(`   ✅ Enrichment API working (tested ASIN: ${testAsin})`);

            // Now validate that we can actually extract ALL the data
            console.log('   Testing data extraction...');

            const extractionResults = [];

            // Test title extraction (Pass 1)
            const testTitle = testProduct.title?.displayString;
            if (testTitle) {
                extractionResults.push(`✅ Title: "${testTitle.substring(0, 40)}${testTitle.length > 40 ? '...' : ''}"`);
            } else {
                extractionResults.push(`❌ Title: FAILED`);
            }

            // Test author extraction (Pass 1) - using shared function
            const testAuthors = extractAuthors(testProduct);
            if (testAuthors && testAuthors !== 'Unknown Author') {
                extractionResults.push(`✅ Author: "${testAuthors}"`);
            } else {
                extractionResults.push(`⚠️  Author: empty (may be unavailable)`);
            }

            // Test cover URL extraction (Pass 1) - using shared function
            const testCoverUrls = extractCoverUrls(testProduct);
            const testImages = testProduct.images?.images?.[0];
            if (testImages?.lowRes?.physicalId) {
                extractionResults.push(`✅ Cover: lowRes (primary)`);
            } else if (testImages?.hiRes?.physicalId) {
                extractionResults.push(`✅ Cover: hiRes (fallback)`);
            } else {
                extractionResults.push(`⚠️  Cover: fallback URL (no image data)`);
            }
            if (testCoverUrls.coverUrlHiRes) {
                extractionResults.push(`✅ Cover HiRes: available`);
            }

            // Test rating extraction (Pass 1)
            const testRating = testProduct.customerReviewsSummary?.rating?.value;
            const testReviewCount = testProduct.customerReviewsSummary?.count?.displayString;
            if (testRating) {
                extractionResults.push(`✅ Rating: ${testRating} (${testReviewCount || '0'} reviews)`);
            } else {
                extractionResults.push(`⚠️  Rating: none (may be unavailable)`);
            }

            // Test series extraction (Pass 1)
            const testSeriesData = testProduct.bookSeries?.singleBookView?.series;
            if (testSeriesData?.title) {
                extractionResults.push(`✅ Series: "${testSeriesData.title}" #${testSeriesData.position || '?'}`);
            } else {
                extractionResults.push(`⚠️  Series: none (may not be in series)`);
            }

            // Test binding extraction (Pass 1)
            const testBinding = testProduct.bindingInformation?.binding?.displayString;
            if (testBinding) {
                extractionResults.push(`✅ Binding: ${testBinding}`);
            } else {
                extractionResults.push(`⚠️  Binding: empty (may be unavailable)`);
            }

            // Test description extraction (Pass 2) - using shared function
            const testDescription = extractDescription(testProduct);

            if (testDescription) {
                extractionResults.push(`✅ Description: ${testDescription.length} characters`);
            } else {
                extractionResults.push(`❌ Description: FAILED (empty)`);
                const testDescSection = testProduct.description?.sections?.[0];
                if (testDescSection) {
                    console.log(`      Structure: ${JSON.stringify(testDescSection).substring(0, 200)}...`);
                }
            }

            // Test reviews extraction (Pass 2) - using shared function
            const testReviews = extractReviews(testProduct);

            if (testReviews.length > 0) {
                extractionResults.push(`✅ Reviews: ${testReviews.length} top reviews`);
            } else {
                extractionResults.push(`⚠️  Reviews: none (may be unavailable)`);
            }

            // Report all extraction results
            console.log('');
            console.log('   📊 Field Extraction Results:');
            extractionResults.forEach(result => console.log(`      ${result}`));

            console.log('');
            stats.timing.phase0End = Date.now();
            console.log('✅ Phase 0 complete: All API endpoints and extraction logic validated\n');

        } catch (error) {
            console.error('\n❌ ENRICHMENT API VALIDATION FAILED');
            console.error('========================================');
            console.error('The enrichment query failed. This usually means:');
            console.error('1. Amazon API structure has changed');
            console.error('2. The test ASIN is invalid or restricted');
            console.error('3. Network/firewall issues');
            console.error('4. Rate limiting (unlikely on first request)');
            console.error('');
            console.error('Technical details:');
            console.error(error.message);
            console.error('');
            console.error('⚠️  You can continue, but enrichment may fail.');
            console.error('   Basic book data should still work.');
            console.error('========================================\n');

            // Don't throw - allow continuation with warning
            console.log('⚠️  Continuing without enrichment validation...\n');
        }

        // Step 3: Fetch new books (Phase 1)
        stats.timing.pass1Start = Date.now();
        console.log('[3/7] Fetching new books from library...');
        progressUI.updatePhase('Downloading Titles', 'Retrieving books from your library');
        console.log('   Will stop when we reach existing books\n');

        const newBooks = [];
        const seenASINs = new Map();  // Track ASINs to detect duplicates
        let cursor = "";
        let pageNum = 0;
        let hasMore = true;
        let foundOverlap = false;
        
        while (hasMore && !foundOverlap) {
            // Check for user abort
            if (progressUI.isAborted()) {
                console.log('⚠️ Fetch aborted by user during Pass 1');
                return;
            }

            pageNum++;
            console.log(`📖 Fetching page ${pageNum}...`);
            
            const query = `query ccGetCustomerLibraryBooks {
                getCustomerLibrary {
                    books(after: "${cursor}", first: ${PAGE_SIZE}, sortBy: {sortField: ACQUISITION_DATE, sortOrder: DESCENDING}, selectionCriteria: {tags: [], query: "NOT (222711ade9d0f22714af93d1c8afec60 OR 858f501de8e2d7ece33f768936463ac8)"}, groupBySeries: false) {
                        pageInfo {
                            hasNextPage
                            endCursor
                        }
                        totalCount {
                            number
                            relation
                        }
                        edges {
                            node {
                                asin
                                relationshipType
                                relationshipSubType
                                relationshipCreationDate
                                __typename
                                product {
                                    asin
                                    title {
                                        displayString
                                    }
                                    images {
                                        images {
                                            hiRes {
                                                physicalId
                                                extension
                                            }
                                            lowRes {
                                                physicalId
                                                extension
                                            }
                                        }
                                    }
                                    customerReviewsSummary {
                                        count {
                                            displayString
                                        }
                                        rating {
                                            fullStarCount
                                            hasHalfStar
                                            value
                                        }
                                    }
                                    byLine {
                                        contributors {
                                            name
                                            contributor {
                                                author {
                                                    profile {
                                                        displayName
                                                        contributorPage {
                                                            url
                                                        }
                                                    }
                                                }
                                            }
                                        }
                                    }
                                    bindingInformation {
                                        binding {
                                            displayString
                                            symbol
                                        }
                                    }
                                    bookSeries {
                                        singleBookView {
                                            series {
                                                title
                                                position
                                                link {
                                                    url
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                        __typename
                    }
                }
            }`;
            
            try {
                const result = await fetchWithRetry(async () => {
                    const response = await fetch('https://www.amazon.com/kindle-reader-api', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'content-type': 'application/json',
                            'anti-csrftoken-a2z': csrfToken,
                            'x-client-id': 'your-books'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            query: query,
                            operationName: 'ccGetCustomerLibraryBooks'
                        })
                    });

                    if (!response.ok) {
                        return { httpError: true, httpStatus: response.status };
                    }

                    const data = await response.json();

                    if (data.errors) {
                        return { apiError: true, errors: data.errors };
                    }

                    const library = data?.data?.getCustomerLibrary?.books;

                    if (!library || !library.edges) {
                        return { noData: true };
                    }

                    // Success
                    return { library };
                }, `Pass 1 page ${pageNum}`);

                const library = result.library;
                
                const books = library.edges;
                
                // Process each book and check for overlap
                for (const edge of books) {
                    const node = edge.node;
                    const product = node.product;
                    
                    if (!product) continue;
                    
                    // Use relationshipCreationDate (always present in the node)
                    const acquisitionDate = node.relationshipCreationDate || null;
                    
                    // Check if this book already exists (by ASIN and date)
                    if (mostRecentDate && acquisitionDate) {
                        const bookDate = parseInt(acquisitionDate);
                        if (bookDate <= mostRecentDate) {
                            // Found overlap - stop fetching
                            console.log(`   🔍 Found overlap at ASIN ${product.asin}`);
                            foundOverlap = true;
                            break;
                        }
                    }
                    
                    // Extract book data - using shared functions
                    const title = product.title?.displayString || 'Unknown Title';
                    const authors = extractAuthors(product);
                    const { coverUrl, coverUrlHiRes } = extractCoverUrls(product);

                    const rating = product.customerReviewsSummary?.rating?.value || null;
                    const reviewCount = product.customerReviewsSummary?.count?.displayString || null;

                    const seriesData = product.bookSeries?.singleBookView?.series;
                    const series = seriesData?.title || null;
                    const seriesPosition = seriesData?.position || null;

                    const binding = product.bindingInformation?.binding?.displayString || null;

                    // Filter out non-book items (DVDs, CDs, Maps, Shoes, etc.)
                    if (binding && !BOOK_BINDINGS.includes(binding)) {
                        stats.nonBooksFiltered.push({ title, asin: product.asin, binding });
                        console.log(`   ⏭️  Skipping non-book: ${title} (${binding})`);
                        continue;
                    }

                    // Track books without authors
                    if (!authors || authors === 'Unknown Author') {
                        stats.booksWithoutAuthors.push({ title, asin: product.asin });
                    }

                    // Check for duplicate ASIN
                    if (seenASINs.has(product.asin)) {
                        const firstIndex = seenASINs.get(product.asin);
                        stats.duplicatesFound.push({
                            asin: product.asin,
                            title,
                            binding,
                            firstIndex,
                            secondIndex: newBooks.length
                        });
                        console.log(`   🔁 Duplicate ASIN detected: ${product.asin} - "${title}" (skipping)`);
                        continue;  // Skip this duplicate
                    }

                    // Extract ownership type from relationshipSubType
                    // Known values: Purchase, Sample, Sharing, Prime, KindleUnlimited, KOLL, Comixology
                    const rawOwnershipType = node.relationshipSubType?.[0] || 'Purchase';
                    let ownershipType = 'purchased'; // default

                    switch (rawOwnershipType) {
                        case 'Purchase':
                            ownershipType = 'purchased';
                            stats.ownershipTypes.purchased++;
                            break;
                        case 'Sample':
                            ownershipType = 'sample';
                            stats.ownershipTypes.sample++;
                            break;
                        case 'Sharing':
                            ownershipType = 'borrowed';
                            stats.ownershipTypes.borrowed++;
                            break;
                        case 'Prime':
                            ownershipType = 'prime';
                            stats.ownershipTypes.prime++;
                            break;
                        case 'KindleUnlimited':
                            ownershipType = 'kindleUnlimited';
                            stats.ownershipTypes.kindleUnlimited++;
                            break;
                        case 'KOLL':
                            ownershipType = 'koll';
                            stats.ownershipTypes.koll++;
                            break;
                        case 'Comixology':
                            ownershipType = 'comixology';
                            stats.ownershipTypes.comixology++;
                            break;
                        default:
                            // Unknown type - track for bug report
                            ownershipType = 'unknown';
                            stats.ownershipTypes.unknown.push({ asin: product.asin, title, rawType: rawOwnershipType });
                    }

                    // Add book and track ASIN
                    seenASINs.set(product.asin, newBooks.length);
                    newBooks.push({
                        asin: product.asin,
                        // v4.8.0.a - onWishlist replaces isOwned (false = owned library book)
                        onWishlist: false,
                        ownershipType, // 'purchased', 'sample', 'borrowed', or 'unknown'
                        title,
                        authors,
                        coverUrl,
                        coverUrlHiRes,
                        rating,
                        reviewCount,
                        series,
                        seriesPosition,
                        acquisitionDate,
                        binding,
                        description: null, // Will be enriched in Pass 2
                        topReviews: []
                    });
                }
                
                if (foundOverlap) {
                    console.log(`   ✅ Stopped at overlap - found ${newBooks.length} new books\n`);
                    break;
                }
                
                console.log(`   ✅ Page ${pageNum}: ${books.length} books (${newBooks.length} total new)`);
                progressUI.updateDetail(`Retrieved ${newBooks.length.toLocaleString()} titles`);
                
                // Check pagination
                hasMore = library.pageInfo?.hasNextPage || false;
                cursor = library.pageInfo?.endCursor || "";
                
                if (hasMore && !foundOverlap) {
                    await new Promise(resolve => setTimeout(resolve, FETCH_DELAY_MS));
                }
                
            } catch (error) {
                console.error(`   ❌ Error on page ${pageNum}:`, error.message);
                break;
            }
        }
        
        stats.timing.pass1End = Date.now();

        if (newBooks.length === 0) {
            console.log('✅ No new books to fetch - checking tags & prices...\n');
        } else {
            console.log(`\n✅ Phase 1 complete: Found ${newBooks.length} new books\n`);
        }

        // Step 4: Enrich books (Phase 2) - BATCH MODE
        // Enriches: new books + existing books missing descriptions (gap-fill)
        stats.timing.pass2Start = Date.now();

        // Find existing books needing enrichment (gap-fill for past glitches)
        const existingBooksNeedingEnrichment = existingBooks.filter(b => !b.description);
        const booksToEnrich = [...newBooks, ...existingBooksNeedingEnrichment];

        // Track Phase 2 results (declared outside else block for use in output file)
        const booksWithoutDescriptions = [];
        let enrichedCount = 0;
        let errorCount = 0;

        if (booksToEnrich.length === 0) {
            console.log('[4/7] Skipping enrichment (no books need enrichment)\n');
            stats.timing.pass2End = Date.now();
        } else {
            const newCount = newBooks.length;
            const gapFillCount = existingBooksNeedingEnrichment.length;
            console.log(`[4/7] Enriching books with descriptions & reviews...`);
            console.log(`   ${newCount} new books + ${gapFillCount} existing books needing gap-fill`);
        progressUI.updatePhase('Enriching Data', `Downloading descriptions & reviews for ${booksToEnrich.length} books`);

        const totalBatches = Math.ceil(booksToEnrich.length / ENRICH_BATCH_SIZE);
        console.log(`   Batch mode: ${ENRICH_BATCH_SIZE} books per request, ${totalBatches} batches total\n`);

        // Process books in batches
        for (let batchNum = 0; batchNum < totalBatches; batchNum++) {
            // Check for user abort
            if (progressUI.isAborted()) {
                console.log('⚠️ Fetch aborted by user during Pass 2 (enrichment)');
                return;
            }

            const batchStart = batchNum * ENRICH_BATCH_SIZE;
            const batchEnd = Math.min(batchStart + ENRICH_BATCH_SIZE, booksToEnrich.length);
            const batchBooks = booksToEnrich.slice(batchStart, batchEnd);
            const percent = Math.round((batchStart / booksToEnrich.length) * 100);
            const progressBar = '█'.repeat(Math.floor(percent / 2)) + '░'.repeat(50 - Math.floor(percent / 2));

            console.log(`[Batch ${batchNum + 1}/${totalBatches}] [${progressBar}] ${percent}% - ${batchBooks.length} books...`);

            // Update visual progress bar
            progressUI.updateProgress(batchStart, booksToEnrich.length);

            try {
                // Build GraphQL-compatible input: [{asin: "X"}, {asin: "Y"}, ...]
                const inputStr = '[' + batchBooks.map(book => `{asin: "${book.asin}"}`).join(', ') + ']';

                // Wrap fetch logic in retry function
                const result = await fetchWithRetry(async () => {
                    const query = `query enrichBook {
                        getProducts(input: ${inputStr}) {
                            asin
                            description {
                                sections(filter: {types: PRODUCT_DESCRIPTION}) {
                                    content
                                }
                            }
                            auxiliaryStoreRecommendations(
                                recommendationTypes: ["AI_SUMMARIES"]
                            ) {
                                recommendations {
                                    recommendationType
                                    sharedContent {
                                        contentAbstract {
                                            textAbstract
                                        }
                                    }
                                }
                            }
                            customerReviewsSummary {
                                count {
                                    displayString
                                }
                                rating {
                                    value
                                }
                            }
                            customerReviewsTop {
                                reviews {
                                    contentAbstract {
                                        textAbstract
                                    }
                                    contributor {
                                        publicProfile {
                                            publicProfile {
                                                publicName {
                                                    displayString
                                                }
                                            }
                                        }
                                    }
                                    title
                                    stars
                                }
                            }
                            overview {
                                sectionGroups {
                                    name { id }
                                    sections {
                                        attributes {
                                            label { id }
                                            granularizedValue {
                                                displayContent
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }`;

                    const response = await fetch('https://www.amazon.com/kindle-reader-api', {
                        method: 'POST',
                        headers: {
                            'accept': 'application/json, text/plain, */*',
                            'content-type': 'application/json',
                            'anti-csrftoken-a2z': csrfToken,
                            'x-client-id': 'your-books'
                        },
                        credentials: 'include',
                        body: JSON.stringify({
                            query: query,
                            operationName: 'enrichBook'
                        })
                    });

                    // Return structured result for retry logic
                    if (!response.ok) {
                        return { httpError: true, httpStatus: response.status };
                    }

                    const data = await response.json();

                    // Check for GraphQL errors - but don't fail immediately
                    if (data.errors) {
                        const errorMsg = data.errors[0]?.message || 'Unknown GraphQL error';
                        const products = data?.data?.getProducts || [];

                        if (products.length > 0) {
                            // PARTIAL ERROR: We got errors BUT also got some data
                            const { message: friendlyError, category: errorCategory } = formatApiError(errorMsg);
                            console.log(`   ⚠️  Partial error: ${friendlyError}`);
                            console.log(`   📦 Got ${products.length}/${batchBooks.length} products - continuing...`);

                            // Track partial errors (store friendly version)
                            stats.partialErrorBooks.push({
                                batch: batchNum + 1,
                                errorMessage: friendlyError,
                                errorCategory: errorCategory,
                                productsReturned: products.length,
                                productsRequested: batchBooks.length
                            });

                            // Increment error category counter
                            stats.errorCategories[errorCategory]++;

                            return { products, partialError: true };
                        } else {
                            // TOTAL FAILURE: Errors and NO data
                            console.log(`   ❌ Total failure: ${errorMsg}`);
                            return { apiError: true, errorMessage: errorMsg };
                        }
                    }

                    const products = data?.data?.getProducts || [];

                    if (products.length === 0) {
                        console.log(`   ⚠️  No products in response`);
                        return { noData: true };
                    }

                    // Success - return all products
                    return { products };
                }, `Batch ${batchNum + 1}`);

                // Process each product in the batch
                const products = result.products || [];

                // Create ASIN lookup map for efficient matching
                const productMap = new Map();
                for (const product of products) {
                    if (product.asin) {
                        productMap.set(product.asin, product);
                    }
                }

                // Match products back to books and extract data
                let batchEnriched = 0;
                for (const book of batchBooks) {
                    const product = productMap.get(book.asin);

                    if (!product) {
                        console.log(`   ⚠️  No data for: ${book.title.substring(0, 40)}...`);
                        errorCount++;
                        continue;
                    }

                    // Extract data - using shared functions
                    let description = extractDescription(product);

                    // Fallback to AI summary if no traditional description
                    if (!description) {
                        description = extractAISummary(product);
                        if (description) {
                            stats.aiSummariesUsed.push({ title: book.title, asin: book.asin });
                        }
                    }

                    const topReviews = extractReviews(product);
                    const publicationDate = extractPublicationDate(product);

                    // Track books without descriptions
                    if (!description) {
                        booksWithoutDescriptions.push({
                            asin: book.asin,
                            title: book.title,
                            authors: book.authors
                        });
                    }

                    // Update book directly (batchBooks contains references to actual objects)
                    book.description = description;
                    book.topReviews = topReviews;
                    book.publicationDate = publicationDate;

                    // Update rating if fresher
                    if (product.customerReviewsSummary?.rating?.value) {
                        book.rating = product.customerReviewsSummary.rating.value;
                        book.reviewCount = product.customerReviewsSummary.count?.displayString || null;
                    }

                    batchEnriched++;
                    enrichedCount++;
                }

                console.log(`   ✅ Enriched ${batchEnriched}/${batchBooks.length} books in batch`);

            } catch (error) {
                // Batch failed - log all books in batch as errors
                for (const book of batchBooks) {
                    stats.apiErrorBooks.push({ title: book.title, asin: book.asin });
                }
                console.log(`   ❌ Batch failed after ${MAX_RETRIES} retries: ${error.message}`);
                errorCount += batchBooks.length;
            }

            // Delay between batches (if configured)
            if (batchNum < totalBatches - 1 && ENRICH_DELAY_MS > 0) {
                await new Promise(resolve => setTimeout(resolve, ENRICH_DELAY_MS));
            }
        }
        
            stats.timing.pass2End = Date.now();
            progressUI.updateProgress(booksToEnrich.length, booksToEnrich.length); // Show 100%
            console.log(`\n✅ Phase 2 complete: Enriched ${enrichedCount}/${booksToEnrich.length} books`);
            if (errorCount > 0) {
                console.log(`   ⚠️  ${errorCount} errors (books will have basic info only)`);
            }
            // v4.8.0.b - Log books without descriptions to console (moved from JSON output)
            if (booksWithoutDescriptions.length > 0) {
                console.log(`   📋 Books without descriptions (${booksWithoutDescriptions.length}):`);
                booksWithoutDescriptions.forEach(b => {
                    console.log(`      - ${b.asin}: ${b.title} by ${b.authors}`);
                });
            }
            console.log('');
        } // End of Phase 2 else block (when booksToEnrich.length > 0)

        // ============================================================================
        // Phase 3: Tags/Genres (incremental - only books without genres array)
        // ============================================================================
        // Tags are static, so we only fetch once per book. Cap at 10 per run to limit time.
        stats.timing.phase3Start = Date.now();
        console.log('[5/7] Fetching tags/genres for books...');

        // Combine new books with existing books to find all books needing tags
        const allBooksForTags = [...newBooks, ...existingBooks];
        const booksNeedingTags = allBooksForTags.filter(book => !book.genres);
        const TAGS_CAP = 10; // Cap per run to limit time (1-at-a-time API)
        const booksToFetchTags = booksNeedingTags.slice(0, TAGS_CAP);

        if (booksToFetchTags.length === 0) {
            console.log('   ✅ All books already have tags\n');
        } else {
            console.log(`   Found ${booksNeedingTags.length} books needing tags (processing ${booksToFetchTags.length} this run)`);
            progressUI.updatePhase('Fetching Tags', `Processing ${booksToFetchTags.length} books`);

            let tagsSuccessCount = 0;
            let tagsErrorCount = 0;

            for (let i = 0; i < booksToFetchTags.length; i++) {
                // Check for user abort
                if (progressUI.isAborted()) {
                    console.log('⚠️ Fetch aborted by user during Phase 3 (tags)');
                    return;
                }

                const book = booksToFetchTags[i];
                progressUI.updateProgress(i, booksToFetchTags.length);
                progressUI.updateDetail(`${book.title.substring(0, 40)}...`);

                try {
                    const tagsQuery = `query qvGetSingleItemRecommendation {
                        getCustomerLibrary {
                            bookRecommendations(
                                after: ""
                                first: 10
                                asin: "${book.asin}"
                                selectionCriteria: {tags: []}
                                libraryType: OWNED
                            ) {
                                tags {
                                    tag {
                                        id
                                        name
                                        rank
                                    }
                                }
                            }
                        }
                    }`;

                    const result = await fetchWithRetry(async () => {
                        const response = await fetch('https://www.amazon.com/kindle-reader-api', {
                            method: 'POST',
                            headers: {
                                'accept': 'application/json, text/plain, */*',
                                'content-type': 'application/json',
                                'anti-csrftoken-a2z': csrfToken,
                                'x-client-id': 'your-books'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                query: tagsQuery,
                                operationName: 'qvGetSingleItemRecommendation'
                            })
                        });

                        if (!response.ok) {
                            return { httpError: true, httpStatus: response.status };
                        }

                        const data = await response.json();

                        if (data.errors) {
                            return { apiError: true, errorMessage: data.errors[0]?.message || 'API error' };
                        }

                        const recommendations = data?.data?.getCustomerLibrary?.bookRecommendations;
                        if (!recommendations) {
                            return { noData: true };
                        }

                        return { recommendations };
                    }, `Tags for ${book.asin}`);

                    // Extract tag names
                    const tags = result.recommendations?.tags || [];
                    const genreNames = tags.map(t => t.tag?.name).filter(Boolean);

                    // Update the book (find it in the appropriate array)
                    book.genres = genreNames;
                    tagsSuccessCount++;

                    console.log(`   ✅ ${i + 1}/${booksToFetchTags.length}: ${book.title.substring(0, 40)}... (${genreNames.length} tags)`);

                } catch (error) {
                    console.log(`   ❌ ${i + 1}/${booksToFetchTags.length}: ${book.title.substring(0, 40)}... - ${error.message}`);
                    tagsErrorCount++;
                }
            }

            progressUI.updateProgress(booksToFetchTags.length, booksToFetchTags.length);
            console.log(`\n✅ Phase 3 complete: ${tagsSuccessCount}/${booksToFetchTags.length} books tagged`);
            if (booksNeedingTags.length > TAGS_CAP) {
                console.log(`   ℹ️  ${booksNeedingTags.length - TAGS_CAP} more books need tags (will process next run)`);
            }
            console.log('');
        }
        stats.timing.phase3End = Date.now();

        // ============================================================================
        // Phase 4: Prices (all books every run - prices change frequently)
        // ============================================================================
        stats.timing.phase4Start = Date.now();
        console.log('[6/7] Fetching prices for all books...');

        // Combine new books with existing to get all books
        const allBooksForPrices = [...newBooks, ...existingBooks];
        const PRICE_BATCH_SIZE = 30; // Same as enrichment batch size

        if (allBooksForPrices.length === 0) {
            console.log('   ✅ No books to price\n');
        } else {
            console.log(`   Found ${allBooksForPrices.length} books`);
            progressUI.updatePhase('Fetching Prices', `Processing ${allBooksForPrices.length} books`);

            const priceBatches = Math.ceil(allBooksForPrices.length / PRICE_BATCH_SIZE);
            let pricesSuccessCount = 0;
            let pricesErrorCount = 0;

            for (let batchNum = 0; batchNum < priceBatches; batchNum++) {
                // Check for user abort
                if (progressUI.isAborted()) {
                    console.log('⚠️ Fetch aborted by user during Phase 4 (prices)');
                    return;
                }

                const batchStart = batchNum * PRICE_BATCH_SIZE;
                const batchEnd = Math.min(batchStart + PRICE_BATCH_SIZE, allBooksForPrices.length);
                const batchBooks = allBooksForPrices.slice(batchStart, batchEnd);

                progressUI.updateProgress(batchStart, allBooksForPrices.length);

                try {
                    // Build GraphQL-compatible input
                    const inputStr = '[' + batchBooks.map(book => `{asin: "${book.asin}"}`).join(', ') + ']';

                    const priceQuery = `query qvGetMediaMatrixProductsQuickView {
                        getProducts(input: ${inputStr}) {
                            asin
                            buyingOptions {
                                options {
                                    type
                                    price {
                                        basisPrice {
                                            moneyValueOrRange {
                                                value {
                                                    amount
                                                }
                                            }
                                        }
                                        priceToPay {
                                            moneyValueOrRange {
                                                value {
                                                    amount
                                                }
                                            }
                                        }
                                    }
                                }
                            }
                        }
                    }`;

                    const result = await fetchWithRetry(async () => {
                        const response = await fetch('https://www.amazon.com/kindle-reader-api', {
                            method: 'POST',
                            headers: {
                                'accept': 'application/json, text/plain, */*',
                                'content-type': 'application/json',
                                'anti-csrftoken-a2z': csrfToken,
                                'x-client-id': 'your-books'
                            },
                            credentials: 'include',
                            body: JSON.stringify({
                                query: priceQuery,
                                operationName: 'qvGetMediaMatrixProductsQuickView'
                            })
                        });

                        if (!response.ok) {
                            return { httpError: true, httpStatus: response.status };
                        }

                        const data = await response.json();

                        if (data.errors && !data.data?.getProducts?.length) {
                            return { apiError: true, errorMessage: data.errors[0]?.message || 'API error' };
                        }

                        const products = data?.data?.getProducts || [];
                        if (products.length === 0) {
                            return { noData: true };
                        }

                        return { products };
                    }, `Prices batch ${batchNum + 1}`);

                    // Create ASIN lookup map
                    const productMap = new Map();
                    for (const product of result.products) {
                        if (product.asin) {
                            productMap.set(product.asin, product);
                        }
                    }

                    // Update each book with price data
                    const now = new Date().toISOString();

                    for (const book of batchBooks) {
                        const product = productMap.get(book.asin);
                        if (product) {
                            // Find Kindle buying option
                            const kindleOption = product.buyingOptions?.options?.find(
                                opt => opt.type === 'KINDLE_ALC' || opt.type === 'KINDLE'
                            ) || product.buyingOptions?.options?.[0];

                            if (kindleOption?.price) {
                                book.currentPrice = kindleOption.price.priceToPay?.moneyValueOrRange?.value?.amount ?? null;
                                book.listPrice = kindleOption.price.basisPrice?.moneyValueOrRange?.value?.amount ?? null;
                                book.priceFetchedAt = now;
                                pricesSuccessCount++;
                            }
                        }
                    }

                    console.log(`   ✅ Batch ${batchNum + 1}/${priceBatches}: ${result.products.length} prices fetched`);

                } catch (error) {
                    console.log(`   ❌ Batch ${batchNum + 1}/${priceBatches}: ${error.message}`);
                    pricesErrorCount += batchBooks.length;
                }
            }

            progressUI.updateProgress(allBooksForPrices.length, allBooksForPrices.length);
            console.log(`\n✅ Phase 4 complete: ${pricesSuccessCount}/${allBooksForPrices.length} prices updated`);
            console.log('');
        }
        stats.timing.phase4End = Date.now();

        // Step 7: Merge and save library
        stats.timing.mergeStart = Date.now();
        console.log('[7/7] Merging with existing data and saving library...');
        progressUI.updatePhase('Saving Library', 'Merging and downloading library file');

        // Prepend new books (most recent first), keeping existing books with their updates
        const finalBooks = [...newBooks, ...existingBooks];

        // Summary of what changed
        if (newBooks.length > 0) {
            console.log(`   📚 Found ${newBooks.length} new book${newBooks.length === 1 ? '' : 's'} to add`);
        } else {
            console.log('   📚 No new books (existing library updated with tags/prices/enrichment)');
        }

        // Create output in Schema v2.0 unified format
        // Library Fetcher owns: schemaVersion, books
        // Preserves any existing collections section from input file
        // v4.8.0.b - Removed booksWithoutDescriptionsDetails from JSON (now console-only)
        const outputData = {
            schemaVersion: SCHEMA_VERSION,
            books: {
                fetchDate: new Date().toISOString(),
                fetcherVersion: FETCHER_VERSION,
                totalBooks: finalBooks.length,
                items: finalBooks
            }
        };
        // Preserve existing collections section if present
        if (existingCollections) {
            outputData.collections = existingCollections;
        }

        const jsonData = JSON.stringify(outputData, null, 2);

        // Mark merge phase complete (before save - merge/prep is done)
        stats.timing.mergeEnd = Date.now();

        // Calculate and print timing summary BEFORE save (so devs can see it even if they cancel)
        const phase0Duration = stats.timing.phase0End - stats.timing.phase0Start;
        const phase1Duration = stats.timing.pass1End - stats.timing.pass1Start;
        const phase2Duration = stats.timing.pass2End - stats.timing.pass2Start;
        const phase3Duration = stats.timing.phase3End - stats.timing.phase3Start;
        const phase4Duration = stats.timing.phase4End - stats.timing.phase4Start;
        const mergeDuration = stats.timing.mergeEnd - stats.timing.mergeStart;
        const totalDuration = Date.now() - startTime;

        console.log('\n========================================');
        console.log('✅ FETCH COMPLETE - READY TO SAVE');
        console.log('========================================\n');

        console.log('⏱️  TIMING');
        console.log(`   Phase 0 (Validation):        ${formatTime(phase0Duration)}`);
        console.log(`   Phase 1 (Fetch titles):      ${formatTime(phase1Duration)}`);
        console.log(`   Phase 2 (Enrich):            ${formatTime(phase2Duration)}`);
        console.log(`   Phase 3 (Tags):              ${formatTime(phase3Duration)}`);
        console.log(`   Phase 4 (Prices):            ${formatTime(phase4Duration)}`);
        console.log(`   Merge & Save:                ${formatTime(mergeDuration)}`);
        console.log(`   ${'─'.repeat(37)}`);
        console.log(`   Total time:                  ${formatTime(totalDuration)}\n`);

        // Ownership type summary (for new books only) - shown before save so user sees it even if cancelled
        console.log('🏷️  OWNERSHIP TYPES (new books)');
        console.log(`   Purchased:                    ${stats.ownershipTypes.purchased}`);
        if (stats.ownershipTypes.sample > 0) {
            console.log(`   Sample:                       ${stats.ownershipTypes.sample}`);
        }
        if (stats.ownershipTypes.borrowed > 0) {
            console.log(`   Borrowed (Family):            ${stats.ownershipTypes.borrowed}`);
        }
        if (stats.ownershipTypes.prime > 0) {
            console.log(`   Prime Reading:                ${stats.ownershipTypes.prime}`);
        }
        if (stats.ownershipTypes.kindleUnlimited > 0) {
            console.log(`   Kindle Unlimited:             ${stats.ownershipTypes.kindleUnlimited}`);
        }
        if (stats.ownershipTypes.koll > 0) {
            console.log(`   KOLL:                         ${stats.ownershipTypes.koll}`);
        }
        if (stats.ownershipTypes.comixology > 0) {
            console.log(`   Comixology:                   ${stats.ownershipTypes.comixology}`);
        }
        if (stats.ownershipTypes.unknown.length > 0) {
            console.log(`   Unknown:                      ${stats.ownershipTypes.unknown.length}`);
            console.log('');
            console.log('⚠️  UNKNOWN OWNERSHIP TYPES FOUND');

            // Send telemetry for each unique unknown type (helps discover new ownership types)
            const uniqueUnknownTypes = [...new Set(stats.ownershipTypes.unknown.map(item => item.rawType))];
            uniqueUnknownTypes.forEach(rawType => {
                new Image().src = `https://readerwrangler.goatcounter.com/count?p=/event/newOwnershipType=${encodeURIComponent(rawType)}`;
            });
            console.log('   (Note: Unknown types still import normally - this info helps improve future versions)');
            console.log('   Please report these at: https://github.com/Ron-L/readerwrangler/issues/new');
            console.log('');
            console.log('   Copy everything below this line and paste into a new issue:');
            console.log('   ─────────────────────────────────────────────────────────');
            console.log('   **Bug Report: Unknown Ownership Types**');
            console.log('');
            console.log(`   Fetcher Version: ${FETCHER_VERSION}`);
            console.log(`   Date: ${new Date().toISOString().split('T')[0]}`);
            console.log('');
            console.log('   Unknown types found:');
            stats.ownershipTypes.unknown.forEach(item => {
                console.log(`   - \`${item.rawType}\` | ${item.asin} | ${item.title}`);
            });
            console.log('   ─────────────────────────────────────────────────────────');
        }
        console.log('');

        // Save using File System Access API if we have a file handle, otherwise prompt user
        let saveSucceeded = false;
        if (fileHandle) {
            // Re-run case: Show save button to get fresh user gesture before writing
            // Chrome requires an active "user gesture" for createWritable() - the original
            // gesture from file selection has expired after fetching library data
            const userChoice = await progressUI.showSaveButton(finalBooks.length);
            if (userChoice === 'cancel') {
                console.error('   ❌ Save cancelled by user - data discarded');
                progressUI.showError('Cancelled - your downloaded data was discarded');
                return;
            }

            // Now we have a fresh user gesture from the button click
            try {
                console.log(`   💾 Saving to original file location...`);
                const writable = await fileHandle.createWritable();
                await writable.write(jsonData);
                await writable.close();
                console.log(`✅ Updated library file in place`);
                saveSucceeded = true;
            } catch (e) {
                console.error('   ❌ Failed to save file:', e.message);
                progressUI.showError(`Failed to save: ${e.message}`);
                return;
            }
        } else if (hasFileSystemAccess) {
            // Full fetch case: Need user click for fresh gesture before showSaveFilePicker
            // Show save button and wait for user choice (provides fresh user gesture)
            const userChoice = await progressUI.showSaveButton(finalBooks.length);
            if (userChoice === 'cancel') {
                console.error('   ❌ Save cancelled by user - data discarded');
                progressUI.showError('Cancelled - your downloaded data was discarded');
                return;
            }

            try {
                const saveHandle = await window.showSaveFilePicker({
                    suggestedName: LIBRARY_FILENAME,
                    types: [{ description: 'JSON files', accept: { 'application/json': ['.json'] } }]
                });
                const writable = await saveHandle.createWritable();
                await writable.write(jsonData);
                await writable.close();
                console.log(`✅ Saved library file: ${LIBRARY_FILENAME}`);
                saveSucceeded = true;
            } catch (e) {
                if (e.name === 'AbortError') {
                    console.error('   ❌ Save cancelled by user');
                    progressUI.showError('Save cancelled - your data was not saved!');
                    return;
                }
                throw e;
            }
        } else {
            // Fallback for Firefox/Safari - traditional download
            console.log(`   ⚠️  IMPORTANT: Save this file as "${LIBRARY_FILENAME}", replacing your existing file!`);
            console.log(`   (Your browser may save it as "${LIBRARY_FILENAME.replace('.json', '')}(1).json" - rename it manually)\n`);

            const blob = new Blob([jsonData], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = LIBRARY_FILENAME;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);

            console.log(`✅ Downloaded library file: ${LIBRARY_FILENAME}`);
            saveSucceeded = true;
        }

        // Only show completion summary if file was actually saved
        if (!saveSucceeded) {
            console.error('   ❌ File was not saved');
            progressUI.showError('File was not saved - please try again');
            return;
        }

        const totalFetched = newBooks.length + stats.nonBooksFiltered.length;
        console.log('📊 FETCH RESULTS');
        console.log(`   Total books fetched:          ${totalFetched}`);
        if (stats.nonBooksFiltered.length > 0) {
            console.log(`   Non-books filtered:           ${stats.nonBooksFiltered.length}`);
            stats.nonBooksFiltered.slice(0, 3).forEach(item => {
                console.log(`      • ${item.title.substring(0, 50)} (${item.binding})`);
            });
            if (stats.nonBooksFiltered.length > 3) {
                console.log(`      • ... and ${stats.nonBooksFiltered.length - 3} more`);
            }
        }
        console.log(`   Books kept:                   ${newBooks.length}\n`);

        console.log('🔄 API RELIABILITY');
        console.log(`   Total API calls:              ${stats.apiCalls.total}`);
        const firstTryPct = ((stats.apiCalls.firstTry / stats.apiCalls.total) * 100).toFixed(1);
        console.log(`   Succeeded first try:          ${stats.apiCalls.firstTry} (${firstTryPct}%)`);
        if (stats.apiCalls.retry1 > 0) {
            const retry1Pct = ((stats.apiCalls.retry1 / stats.apiCalls.total) * 100).toFixed(1);
            console.log(`   Needed 1 retry:               ${stats.apiCalls.retry1} (${retry1Pct}%)`);
        }
        if (stats.apiCalls.retry2 > 0) {
            const retry2Pct = ((stats.apiCalls.retry2 / stats.apiCalls.total) * 100).toFixed(1);
            console.log(`   Needed 2 retries:             ${stats.apiCalls.retry2} (${retry2Pct}%)`);
        }
        if (stats.apiCalls.retry3 > 0) {
            const retry3Pct = ((stats.apiCalls.retry3 / stats.apiCalls.total) * 100).toFixed(1);
            console.log(`   Needed 3 retries:             ${stats.apiCalls.retry3} (${retry3Pct}%)`);
        }
        if (stats.apiCalls.failed > 0) {
            const failedPct = ((stats.apiCalls.failed / stats.apiCalls.total) * 100).toFixed(1);
            console.log(`   Failed after 3 retries:       ${stats.apiCalls.failed} (${failedPct}%)`);
        }
        console.log('');

        const successRate = ((enrichedCount / newBooks.length) * 100).toFixed(2);
        console.log('📝 ENRICHMENT RESULTS');
        console.log(`   Successfully enriched:        ${enrichedCount}/${newBooks.length} (${successRate}%)`);
        if (stats.apiErrorBooks.length > 0) {
            console.log(`   Failed after retries:         ${stats.apiErrorBooks.length}`);
            stats.apiErrorBooks.slice(0, 3).forEach(item => {
                console.log(`      • ${item.title.substring(0, 50)}`);
            });
            if (stats.apiErrorBooks.length > 3) {
                console.log(`      • ... and ${stats.apiErrorBooks.length - 3} more`);
            }
        }
        console.log('');

        if (stats.duplicatesFound.length > 0) {
            console.log('🔁 DUPLICATES REMOVED');
            console.log(`   Duplicate ASINs found:        ${stats.duplicatesFound.length}`);
            stats.duplicatesFound.slice(0, 3).forEach(item => {
                console.log(`      • ${item.title.substring(0, 50)} (ASIN: ${item.asin})`);
            });
            if (stats.duplicatesFound.length > 3) {
                console.log(`      • ... and ${stats.duplicatesFound.length - 3} more`);
            }
            console.log('');
        }

        if (stats.partialErrorBooks.length > 0) {
            console.log('⚠️  PARTIAL ERRORS (Got data anyway)');
            console.log(`   Batches with partial errors:  ${stats.partialErrorBooks.length}`);
            // Show category breakdown
            if (stats.errorCategories.amazonTimeout > 0) {
                console.log(`   └ Amazon timeouts (504.1):    ${stats.errorCategories.amazonTimeout}`);
            }
            if (stats.errorCategories.customerMarketplace > 0) {
                console.log(`   └ Customer/Marketplace:       ${stats.errorCategories.customerMarketplace}`);
            }
            if (stats.errorCategories.other > 0) {
                console.log(`   └ Other errors:               ${stats.errorCategories.other}`);
            }
            // Show batch details
            stats.partialErrorBooks.forEach(item => {
                console.log(`      • Batch ${item.batch}: ${item.productsReturned}/${item.productsRequested} products returned`);
                console.log(`        Error: ${item.errorMessage}`);
            });
            console.log('');
        }

        console.log('⚠️  DATA QUALITY NOTES');
        console.log(`   Books without descriptions:   ${booksWithoutDescriptions.length}`);
        booksWithoutDescriptions.slice(0, 3).forEach(item => {
            console.log(`      • ${item.title} (ASIN: ${item.asin})`);
        });
        if (booksWithoutDescriptions.length > 3) {
            console.log(`      • ... and ${booksWithoutDescriptions.length - 3} more`);
        }
        console.log('');

        if (stats.booksWithoutAuthors.length > 0) {
            console.log(`   Books without authors:        ${stats.booksWithoutAuthors.length}`);
            stats.booksWithoutAuthors.slice(0, 3).forEach(item => {
                console.log(`      • ${item.title.substring(0, 50)} (ASIN: ${item.asin})`);
            });
            if (stats.booksWithoutAuthors.length > 3) {
                console.log(`      • ... and ${stats.booksWithoutAuthors.length - 3} more`);
            }
            console.log('');
        }

        if (stats.aiSummariesUsed.length > 0) {
            console.log(`   AI summaries used:            ${stats.aiSummariesUsed.length}`);
            stats.aiSummariesUsed.slice(0, 3).forEach(item => {
                console.log(`      • ${item.title.substring(0, 50)} (ASIN: ${item.asin})`);
            });
            if (stats.aiSummariesUsed.length > 3) {
                console.log(`      • ... and ${stats.aiSummariesUsed.length - 3} more`);
            }
            console.log('');
        }

        console.log('💾 FILE SAVED');
        console.log(`   ✅ ${LIBRARY_FILENAME} (${finalBooks.length} books)`);
        console.log('========================================\n');
        console.log('👉 Next steps:');
        console.log('   1. Find the library file in your Downloads folder');
        console.log('   2. Keep it somewhere you can find it later (Desktop, Documents, etc.)');
        console.log('   3. Open ReaderWrangler and load your library file to start organizing!');
        console.log('   4. Status bar will show your data is fresh\n');
        console.log('💡 Next time you run this script:');
        console.log('   - Select amazon-library.json when prompted');
        console.log('   - Only NEW books will be fetched & enriched');
        console.log('   - Library file will be updated automatically');
        console.log('   - Status bar will reflect the new fetch');
        console.log('========================================\n');

        // Show completion UI with delta info
        progressUI.showComplete(`Added ${newBooks.length} new book${newBooks.length === 1 ? '' : 's'} (${finalBooks.length} total)`);
        new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/library-fetcher-completed';

    } catch (error) {
        console.error('\n========================================');
        console.error('❌ FATAL ERROR');
        console.error('========================================');
        console.error(error);
        console.error('========================================\n');

        // Show error UI
        progressUI.showError(error.message || 'An unknown error occurred');
    }
}

// Auto-run on first paste
fetchAmazonLibrary();