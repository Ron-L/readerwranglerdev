// reset.js - Emergency reset functionality for ReaderWrangler
// Clears all app data (localStorage + IndexedDB) and redirects to main app
// v5.0.10

// LocalStorage keys to clear (from uiHelpers.js)
const STORAGE_KEYS = [
    'readerwrangler-state',
    'readerwrangler-enriched-cache',
    'readerwrangler-settings',
    'readerwrangler-status',
    'readerwrangler-filters',
    'readerwrangler-explorer',
    'readerwrangler-folders'
];

// The book store is deleted by storage.js's deleteBookStore (7.25.1 — loaded before this file by reset.html): the one
// delete every reset uses. This page used to treat a delete another tab blocks as done; now it waits, saying why.
function showBlockedNotice() {
    if (document.getElementById('resetBlocked')) return;
    const box = document.createElement('div');
    box.id = 'resetBlocked';
    box.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
    box.innerHTML = `<div class="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
        <div class="text-5xl mb-4">⏳</div>
        <p class="text-gray-800 font-medium"></p></div>`;
    box.querySelector('p').textContent = BOOK_STORE_TEXT.blocked;
    document.body.appendChild(box);
}

// Clear all localStorage keys
function clearLocalStorage() {
    let clearedCount = 0;

    STORAGE_KEYS.forEach(key => {
        if (localStorage.getItem(key) !== null) {
            localStorage.removeItem(key);
            rwLog.log('debug', 'STORE', `Emergency reset: cleared ${key}`);
            clearedCount++;
        }
    });

    rwLog.log('info', 'STORE', `Emergency reset: cleared ${clearedCount} saved settings`);
}

// Main reset function
async function performReset() {
    try {
        rwLog.log('info', 'STORE', 'Emergency reset started (the reset page)');

        // Clear localStorage
        clearLocalStorage();

        // Clear IndexedDB
        await deleteBookStore({ onBlocked: showBlockedNotice });
        const blockedBox = document.getElementById('resetBlocked');
        if (blockedBox) blockedBox.remove();

        rwLog.log('info', 'STORE', 'Emergency reset complete');

        // Show success message
        const successDiv = document.createElement('div');
        successDiv.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
        successDiv.innerHTML = `
            <div class="bg-white rounded-lg shadow-2xl p-8 max-w-md text-center">
                <div class="text-6xl mb-4">✅</div>
                <h2 class="text-2xl font-bold text-green-600 mb-4">Reset Complete!</h2>
                <p class="text-gray-700 mb-6">All app data has been cleared. Redirecting to the main app...</p>
                <a href="readerwrangler.html" class="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors">
                    Go to App Now
                </a>
            </div>
        `;
        document.body.appendChild(successDiv);

        // Auto-redirect after 3 seconds
        setTimeout(() => {
            window.location.href = 'readerwrangler.html';
        }, 3000);

    } catch (error) {
        rwLog.log('error', 'STORE-12', `The emergency reset failed: ${error && error.message}`, { stack: error && error.stack });
        alert(`Reset failed: ${error.message}\n\nPlease close all ReaderWrangler tabs and try again, or manually clear your browser data.`);
    }
}

// Attach event listener when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const resetButton = document.getElementById('resetButton');

    resetButton.addEventListener('click', () => {
        // Browser confirmation dialog
        const confirmed = confirm(
            // 7.27.1 - the reset messages' shared sentences, word for word (test/test_reset_words.py — change them there first)
            '⚠️ This will clear your books, folders and settings from this browser.\n\n' +
            'Your saved backup files are not touched.\n' +
            'To get everything back afterwards: File → Restore Backup… with your backup file.\n\n' +
            'Continue with reset?'
        );

        if (confirmed) {
            performReset();
        } else {
            rwLog.log('debug', 'STORE', 'Emergency reset cancelled');
        }
    });
});
