// ReaderWrangler Bookmarklet Navigation Hub v1.1.2
// Universal navigator and data fetcher dialog
//
// This script creates a navigation dialog when invoked by a bookmarklet.
// The TARGET_ENV is injected by the bookmarklet via window._READERWRANGLER_TARGET_ENV
// before this script loads.
//
// Expected values for window._READERWRANGLER_TARGET_ENV:
// 'LOCAL' → localhost:8000 (for local development)
// 'DEV'   → ron-l.github.io/readerwranglerdev (for testing on GitHub Pages)
// 'PROD'  → readerwrangler.com or ron-l.github.io/readerwrangler (for production)

(function() {
    'use strict';

    const NAV_HUB_VERSION = 'v1.1.2';

    // Read TARGET_ENV from window (injected by bookmarklet)
    // Default to 'PROD' for backwards compatibility with old bookmarklets
    const TARGET_ENV = window._READERWRANGLER_TARGET_ENV || 'PROD';

    const currentUrl = window.location.href;

    // Calculate baseUrl from TARGET_ENV
    const baseUrl = TARGET_ENV === 'LOCAL'
        ? 'http://localhost:8000/'
        : TARGET_ENV === 'DEV'
            ? 'https://ron-l.github.io/readerwranglerdev/'
            : 'https://ron-l.github.io/readerwrangler/';

    // For PROD, prefer readerwrangler.com if user is already on custom domain
    const finalBaseUrl = TARGET_ENV === 'PROD' && window.location.hostname === 'readerwrangler.com'
        ? 'https://readerwrangler.com/'
        : baseUrl;

    // Cache-busting for non-PROD environments (developers get fresh code)
    const IS_DEV_MODE = TARGET_ENV !== 'PROD';

    // Debug logging
    console.log(`📚 ReaderWrangler Nav Hub ${NAV_HUB_VERSION}`);
    console.log(`   TARGET_ENV: ${TARGET_ENV} (from ${window._READERWRANGLER_TARGET_ENV ? 'bookmarklet' : 'default'})`);
    console.log(`   baseUrl: ${finalBaseUrl}`);
    console.log(`   Cache-busting: ${IS_DEV_MODE}`);

    // Detect current page type
    const onLibraryPage = currentUrl.includes('amazon.com/yourbooks') ||
                          currentUrl.includes('amazon.com/kindle/library');
    const onCollectionsPage = currentUrl.includes('amazon.com/hz/mycd/digital-console');

    // Create intro dialog
    const dialog = document.createElement('div');
    dialog.style.cssText = `
        position: fixed;
        top: 50%;
        left: 50%;
        transform: translate(-50%, -50%);
        background: white;
        border-radius: 12px;
        box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
        padding: 30px;
        padding-top: 40px;
        z-index: 10000;
        font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
        max-width: 550px;
        text-align: center;
    `;

    const buttonStyle = `
        border: none;
        padding: 12px 24px;
        border-radius: 8px;
        font-size: 14px;
        font-weight: bold;
        cursor: pointer;
        margin: 5px;
        transition: all 0.2s;
    `;

    const primaryButtonStyle = buttonStyle + `
        background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        color: white;
    `;

    const secondaryButtonStyle = buttonStyle + `
        background: #f8f9fa;
        color: #333;
        border: 1px solid #ddd;
    `;

    // Build universal navigator dialog
    let dialogContent = `
        <button style="
            position: absolute;
            top: 10px;
            right: 10px;
            background: none;
            border: none;
            font-size: 24px;
            color: #999;
            cursor: pointer;
            padding: 5px 10px;
            line-height: 1;
            transition: color 0.2s;
        " onmouseover="this.style.color='#333'" onmouseout="this.style.color='#999'" onclick="this.parentElement.remove()">✕</button>
        <div style="font-size: 48px; margin-bottom: 15px;">📚</div>
        <div style="font-size: 20px; font-weight: bold; color: #333; margin-bottom: 25px;">
            ReaderWrangler
        </div>
    `;

    // Add context-specific fetcher buttons
    if (onLibraryPage) {
        dialogContent += `
            <button id="runLibrary" style="${primaryButtonStyle} width: 100%; margin-bottom: 10px;">
                📖 Fetch Library Data
            </button>
        `;
    } else {
        dialogContent += `
            <button id="goLibrary" style="${primaryButtonStyle} width: 100%; margin-bottom: 10px;">
                📖 Go to Library Fetcher Amazon Page
            </button>
        `;
    }

    if (onCollectionsPage) {
        dialogContent += `
            <button id="runCollections" style="${primaryButtonStyle} width: 100%; margin-bottom: 10px;">
                📚 Fetch Collections Data
            </button>
        `;
    } else {
        dialogContent += `
            <button id="goCollections" style="${primaryButtonStyle} width: 100%; margin-bottom: 10px;">
                📚 Go to Collections Fetcher Amazon Page
            </button>
        `;
    }

    // Add universal navigation buttons
    dialogContent += `
        <button id="launchApp" style="${primaryButtonStyle} width: 100%; margin-bottom: 10px;">
            🎯 Launch App
        </button>
        <button id="launchIntro" style="${primaryButtonStyle} width: 100%;">
            ℹ️ Launch Intro for Help
        </button>
    `;

    dialog.innerHTML = dialogContent;
    document.body.appendChild(dialog);

    // Helper function to load script
    function loadScript(scriptName, description) {
        dialog.remove();
        console.log(`📚 ReaderWrangler: Loading ${description}...`);
        const script = document.createElement('script');

        // Cache-busting in dev environments for fresh code
        const cacheBuster = IS_DEV_MODE ? '?v=' + Date.now() : '';
        script.src = finalBaseUrl + scriptName + cacheBuster;

        console.log(`   Loading from: ${script.src}`);
        console.log(`   Cache-busting enabled: ${IS_DEV_MODE}`);

        script.onerror = function() {
            alert(`❌ Failed to load ${description}. Please check your internet connection.`);
        };
        document.body.appendChild(script);
    }

    // Event handlers
    const runLibraryBtn = dialog.querySelector('#runLibrary');
    if (runLibraryBtn) {
        runLibraryBtn.onclick = () => loadScript('amazon-library-fetcher.js', 'library fetcher');
    }

    const runCollectionsBtn = dialog.querySelector('#runCollections');
    if (runCollectionsBtn) {
        runCollectionsBtn.onclick = () => loadScript('amazon-collections-fetcher.js', 'collections fetcher');
    }

    const goLibraryBtn = dialog.querySelector('#goLibrary');
    if (goLibraryBtn) {
        goLibraryBtn.onclick = () => {
            dialog.remove();
            // Show reminder before navigation
            setTimeout(() => {
                alert('📚 Navigating to your library page...\n\nOnce the page loads, click the bookmarklet in your toolbar to fetch your books.');
            }, 100);
            setTimeout(() => {
                window.location.href = 'https://www.amazon.com/yourbooks';
            }, 200);
        };
    }

    const goCollectionsBtn = dialog.querySelector('#goCollections');
    if (goCollectionsBtn) {
        goCollectionsBtn.onclick = () => {
            dialog.remove();
            // Show reminder before navigation
            setTimeout(() => {
                alert('📚 Navigating to collections page...\n\nOnce the page loads, click the bookmarklet in your toolbar to fetch your collections.');
            }, 100);
            setTimeout(() => {
                window.location.href = 'https://www.amazon.com/hz/mycd/digital-console/contentlist/booksAll/dateDsc/';
            }, 200);
        };
    }

    const launchAppBtn = dialog.querySelector('#launchApp');
    if (launchAppBtn) {
        launchAppBtn.onclick = () => {
            dialog.remove();
            window.location.href = finalBaseUrl + 'readerwrangler.html';
        };
    }

    const launchIntroBtn = dialog.querySelector('#launchIntro');
    if (launchIntroBtn) {
        launchIntroBtn.onclick = () => {
            dialog.remove();
            window.location.href = finalBaseUrl + 'index.html';
        };
    }

    // Add version footer to dialog
    const versionFooter = document.createElement('div');
    versionFooter.style.cssText = 'text-align: center; margin-top: 20px; color: #999; font-size: 11px;';
    versionFooter.textContent = NAV_HUB_VERSION;
    dialog.appendChild(versionFooter);

    // Hover effects
    dialog.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            this.style.transform = 'translateY(-2px)';
            this.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)';
        });
        btn.addEventListener('mouseleave', function() {
            this.style.transform = 'translateY(0)';
            this.style.boxShadow = 'none';
        });
    });

})();
