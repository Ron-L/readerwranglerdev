        // ARCHITECTURE: See docs/design/ARCHITECTURE.md for Version Management, Status Icons, Cache-Busting patterns
        const { useState, useEffect, useRef } = React;
        const APP_VERSION = "4.27.0";  // Release version shown to users
        const ORGANIZER_VERSION = "5.0.0-alpha.144";  // Build version for this file
        document.title = "ReaderWrangler";
        // Constants and helper functions moved to uiHelpers.js and storage.js (v5.0.0)
        // saveBooksToIndexedDB, loadBooksFromIndexedDB, clearIndexedDB - see storage.js
        // normalizeBook, parsePrice, getAmazonUrl, calculateFreshness, formatRelativeTime - see uiHelpers.js
        // buildCoverUrlMap, populateCoverCache - see storage.js

        // v5.0.0-alpha.130: Reusable info dialog for large messages (avoids alert() scrollbar issues)
        function showInfoDialog(title, message) {
            return new Promise((resolve) => {
                // Create overlay
                const overlay = document.createElement('div');
                overlay.style.cssText = `
                    position: fixed;
                    top: 0;
                    left: 0;
                    right: 0;
                    bottom: 0;
                    background: rgba(0, 0, 0, 0.5);
                    display: flex;
                    align-items: center;
                    justify-content: center;
                    z-index: 10000;
                `;

                // Create dialog
                const dialog = document.createElement('div');
                dialog.style.cssText = `
                    background: white;
                    border-radius: 8px;
                    padding: 24px;
                    max-width: 600px;
                    width: 90%;
                    max-height: 80vh;
                    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                `;

                // Create title
                const titleEl = document.createElement('h2');
                titleEl.textContent = title;
                titleEl.style.cssText = `
                    margin: 0 0 16px 0;
                    font-size: 20px;
                    font-weight: 600;
                    color: #333;
                `;

                // Create message
                const messageEl = document.createElement('div');
                messageEl.style.cssText = `
                    margin-bottom: 24px;
                    font-size: 14px;
                    line-height: 1.6;
                    color: #555;
                    white-space: pre-line;
                `;
                messageEl.textContent = message;

                // Create OK button
                const button = document.createElement('button');
                button.textContent = 'OK';
                button.style.cssText = `
                    background: #007bff;
                    color: white;
                    border: none;
                    border-radius: 4px;
                    padding: 10px 24px;
                    font-size: 14px;
                    font-weight: 500;
                    cursor: pointer;
                    float: right;
                `;
                button.onmouseover = () => button.style.background = '#0056b3';
                button.onmouseout = () => button.style.background = '#007bff';

                button.onclick = () => {
                    document.body.removeChild(overlay);
                    resolve();
                };

                // Assemble dialog
                dialog.appendChild(titleEl);
                dialog.appendChild(messageEl);
                dialog.appendChild(button);
                overlay.appendChild(dialog);

                // Show dialog
                document.body.appendChild(overlay);
            });
        }

        function ReaderWrangler() {
            const [books, setBooks] = useState([]);
            const [columns, setColumns] = useState([{ id: 'unorganized', name: 'Unorganized', books: [] }]);
            const [searchTerm, setSearchTerm] = useState('');
            const [draggedBook, setDraggedBook] = useState(null);
            const [draggedFromColumn, setDraggedFromColumn] = useState(null);
            const [draggedBookIndex, setDraggedBookIndex] = useState(null); // v4.16.0.d - Track dragged book's index
            const [draggedColumn, setDraggedColumn] = useState(null);
            const [columnDropTarget, setColumnDropTarget] = useState(null);
            const [modalBook, setModalBook] = useState(null);
            const [modalColumnId, setModalColumnId] = useState(null);
            const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
            const [dragCurrentPos, setDragCurrentPos] = useState({ x: 0, y: 0 });
            const [isDragging, setIsDragging] = useState(false);
            const [isDraggingColumn, setIsDraggingColumn] = useState(false);
            // v3.14.0.w - dropTarget moved to ref (dropTargetRef) to avoid React re-renders
            const [dataSource, setDataSource] = useState('none');
            const [blankImageBooks, setBlankImageBooks] = useState(new Set());
            const [editingColumn, setEditingColumn] = useState(null);
            const [editingName, setEditingName] = useState('');
            const [sortMenuOpen, setSortMenuOpen] = useState(null);
            const [columnMenuOpen, setColumnMenuOpen] = useState(null); // v3.11.0 - Unified column dropdown menu
            const [editingDivider, setEditingDivider] = useState(null); // v3.11.0 - {columnId, dividerId}
            const [editingDividerLabel, setEditingDividerLabel] = useState(''); // v3.11.0
            const [insertDividerOpen, setInsertDividerOpen] = useState(null); // v3.11.0 - columnId for Insert Divider modal
            const [newDividerLabel, setNewDividerLabel] = useState(''); // v3.11.0
            const [hoveringDivider, setHoveringDivider] = useState(null); // v3.11.0 - {columnId, dividerId}
            const [helpOpen, setHelpOpen] = useState(false);
            const [settingsOpen, setSettingsOpen] = useState(false);
            const [deleteDialogOpen, setDeleteDialogOpen] = useState(null);
            const [deleteDestination, setDeleteDestination] = useState('');
            // v4.16.0.aq - State for "last copy" delete warning dialog
            const [lastCopyDialogData, setLastCopyDialogData] = useState(null); // {lastCopyEntries: [...], deletableEntries: [...], deletedCount: number}
            const [showAllReviews, setShowAllReviews] = useState(false);
            const [customPriceInput, setCustomPriceInput] = useState(''); // v4.17.0 - custom price trigger input
            const [showCustomPriceInput, setShowCustomPriceInput] = useState(false); // v4.17.0
            const [showBulkPriceModal, setShowBulkPriceModal] = useState(false); // v4.20.0.a - bulk price goal modal
            const [bulkPriceInput, setBulkPriceInput] = useState(''); // v4.20.0.a - bulk price goal input
            const [isEditingNote, setIsEditingNote] = useState(false); // v4.21.0.a - book note edit mode
            const [noteEditContent, setNoteEditContent] = useState(''); // v4.21.0.a - book note editor content
            const [tagInputValue, setTagInputValue] = useState(''); // v4.27.0 - tag input autocomplete value
            const [dividerContextMenu, setDividerContextMenu] = useState(null); // v4.27.0 - {x, y, columnId, dividerId, divider}
            const [dividerTagEditorOpen, setDividerTagEditorOpen] = useState(null); // v4.27.0 - {columnId, dividerId} for editing div tags
            const [tagManagementOpen, setTagManagementOpen] = useState(false); // v4.27.0 Phase 3 - Tag management modal
            const [editingTagId, setEditingTagId] = useState(null); // v4.27.0 Phase 3 - Currently renaming tag
            const [collectSeriesOpen, setCollectSeriesOpen] = useState(false);
            const [seriesBooks, setSeriesBooks] = useState({ current: [], other: [] });
            const [syncStatus, setSyncStatusInternal] = useState('loading'); // 'loading', 'fresh', 'stale', 'none', 'unknown'
            const [lastSyncTime, setLastSyncTime] = useState(null);
            // manifestData state removed in v3.7.0.m - replaced by libraryStatus/collectionsStatus
            const [statusModalOpen, setStatusModalOpen] = useState(false);
            const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
            const [collectionsData, setCollectionsData] = useState(null); // Map of ASIN -> {readStatus, collections[]}
            const [collectionFilter, setCollectionFilter] = useState(''); // Filter by collection name or special values
            const [selectedBooks, setSelectedBooks] = useState(new Set()); // Multi-select state
            const [lastClickedBook, setLastClickedBook] = useState(null); // For shift+click range selection
            // v4.8.0 - Undo/Redo state
            const [undoStack, setUndoStack] = useState([]); // Array of action records
            const [redoStack, setRedoStack] = useState([]); // Array of action records
            const undoStackRef = useRef(undoStack); // Ref to avoid stale closure in keyboard handler
            const redoStackRef = useRef(redoStack);
            const modalBookRef = useRef(modalBook); // v4.21.0.g - Ref to check modal state in keyboard handler
            const [selectedDivider, setSelectedDivider] = useState(null); // v3.13.0 - Selected divider {columnId, dividerId}
            const [activeColumnId, setActiveColumnId] = useState(null); // Track which column has focus for Ctrl+A
            const [contextMenu, setContextMenu] = useState(null); // {x, y, bookId, columnId}
            const [contextSubmenu, setContextSubmenu] = useState(null); // v4.16.0.ba - 'move' | 'copyTo' | 'priceGoal' | null for submenu hover
            const [readStatusFilter, setReadStatusFilter] = useState(''); // Filter by READ/UNREAD/UNKNOWN
            const [ratingFilter, setRatingFilter] = useState(''); // Filter by minimum rating (NEW v3.8.0)
            const [wishlistFilter, setWishlistFilter] = useState(''); // Filter by wishlist status: '' | 'owned' | 'wishlist' (NEW v3.8.0)
            const [dealsFilterActive, setDealsFilterActive] = useState(false); // v4.17.0.j - Deals filter toggle
            const [ownershipFilter, setOwnershipFilter] = useState(''); // Filter by ownership type (NEW v4.9.0)
            const [seriesFilter, setSeriesFilter] = useState(''); // Filter by series name or "NOT_IN_SERIES" (NEW v3.8.0.k)
            const [dateFrom, setDateFrom] = useState(''); // Filter by acquisition date from (YYYY-MM-DD) (NEW v3.8.0.k)
            const [dateTo, setDateTo] = useState(''); // Filter by acquisition date to (YYYY-MM-DD) (NEW v3.8.0.k)
            const [datePreset, setDatePreset] = useState(''); // Date filter preset: '' | 'last30' | 'last90' | 'lastYear' | '2025' | '2024' | '2023' | 'custom' (NEW v4.15.6)
            const [tagFilter, setTagFilter] = useState([]); // v4.27.0 - Filter by tags (array of tag names, OR logic)
            const [tagRegistry, setTagRegistry] = useState({}); // v4.27.0 - Central tag registry {tagName: {label, count}}
            const [filterPanelOpen, setFilterPanelOpen] = useState(false); // Collapsible filter panel state (NEW v3.8.0)
            const [showAdvancedFilters, setShowAdvancedFilters] = useState(false); // Show advanced filters section (NEW v4.14.0.a, v4.14.0.b - no persistence, resets when panel closes)
            const [showHidden, setShowHidden] = useState(false); // Show hidden books toggle (NEW v4.1.0.d)
            const [, forceUpdate] = useState({});
            const [coverUrlMap, setCoverUrlMap] = useState({}); // Cover image cache URL map (v4.13.0)
            // v4.16.0 - Clipboard state for Cut/Copy/Paste
            const [clipboard, setClipboard] = useState(null); // {type: 'cut'|'copy', bookIds: [], sourcePositions: []}
            // v4.16.0.g - Clipboard status message for footer
            const [clipboardMessage, setClipboardMessage] = useState(null); // "3 books cut" or "5 books copied"
            // v4.16.0.l - Toast animation state
            const [toastVisible, setToastVisible] = useState(false);
            const [toastAnimating, setToastAnimating] = useState(false);
            // v4.16.0.m - Track position of last selected book for toast placement
            const [toastPosition, setToastPosition] = useState({ x: 0, y: 0 });
            // v4.16.0.o - Footer clipboard text only visible after toast lands
            const [footerClipboardVisible, setFooterClipboardVisible] = useState(false);
            // v4.16.0.s - Per-instance hidden state (Set of instanceIds)
            const [hiddenInstances, setHiddenInstances] = useState(new Set());

            // v5.0.0 - Book Explorer state
            const [viewMode, setViewMode] = useState('columns'); // 'columns' | 'explorer'
            const [folders, setFolders] = useState([]); // User-created folders
            const [selectedFolderId, setSelectedFolderId] = useState('__all__'); // Current folder
            const [explorerSort, setExplorerSort] = useState({ column: 'dateAdded', direction: 'desc' }); // 'custom' | 'title' | 'author' | 'rating' | 'dateAdded'
            const [folderSortSettings, setFolderSortSettings] = useState({}); // v5.0.0-alpha.100 - Per-folder sort settings map {folderId: {column, direction}}
            const [explorerView, setExplorerView] = useState('list'); // 'list' | 'covers'
            const [explorerCoverCols, setExplorerCoverCols] = useState(56); // Slider value (4-60), actual cols = 64-value
            const [editingFolderId, setEditingFolderId] = useState(null); // Folder being renamed
            const [editingFolderName, setEditingFolderName] = useState(''); // Folder rename input
            const [isPlaceholderMode, setIsPlaceholderMode] = useState(false); // v5.0.0-alpha.134 - Placeholder text mode for new folder rename
            const [explorerDragBookId, setExplorerDragBookId] = useState(null); // Book being dragged in Explorer
            const [explorerDropTargetId, setExplorerDropTargetId] = useState(null); // Folder being dragged over
            const [explorerSelectedBooks, setExplorerSelectedBooks] = useState(new Set()); // Multi-select in Explorer
            const [explorerSelectedFolders, setExplorerSelectedFolders] = useState(new Set()); // v5.0.0-alpha.54 - Folder selection in right pane
            const [explorerSelectionAnchor, setExplorerSelectionAnchor] = useState(null); // Anchor index for Shift+click range select
            const [explorerReorderTarget, setExplorerReorderTarget] = useState(null); // Index for reorder drop target
            const [explorerFolderDragTarget, setExplorerFolderDragTarget] = useState(null); // v5.0.0-alpha.69 - { type: 'reorder'|'reparent', index?, position?, folderId? }
            const [explorerIsCopyDrag, setExplorerIsCopyDrag] = useState(false); // Ctrl key pressed during drag
            const [explorerDragData, setExplorerDragData] = useState(null); // { sourceFolder, bookIds } for drag validity checks
            const [breadcrumbDropTargetId, setBreadcrumbDropTargetId] = useState(null); // v5.0.0-alpha.83 - Breadcrumb folder being dragged over
            const [sidebarFolderDragTarget, setSidebarFolderDragTarget] = useState(null); // v5.0.0-alpha.86 - { type: 'reorder'|'reparent', folderId, position? }
            const [showMigrationDialog, setShowMigrationDialog] = useState(false); // v5.0.0 - Migration prompt
            const [leftPaneWidth, setLeftPaneWidth] = useState(256); // v5.0.0-alpha.91 - Resizable left pane width (px)
            const [isResizingPane, setIsResizingPane] = useState(false); // v5.0.0-alpha.91 - Pane resize in progress
            const [navHistory, setNavHistory] = useState(['__all__']); // v5.0.0-alpha.92 - Navigation history stack
            const [navHistoryIndex, setNavHistoryIndex] = useState(0); // v5.0.0-alpha.92 - Current position in history
            const [bookTooltip, setBookTooltip] = useState(null); // v5.0.0-alpha.98 - Tooltip for All Books view { bookId, x, y }
            const [folderContextMenu, setFolderContextMenu] = useState(null); // v5.0.0-alpha.133 - Folder context menu { folderId, x, y }
            const [submenuExpandedFolders, setSubmenuExpandedFolders] = useState(new Set()); // v5.0.0-alpha.138 - Expanded folders in Move to submenu
            const [folderClipboard, setFolderClipboard] = useState({ items: [], operation: null }); // v5.0.0-alpha.141 - Clipboard for cut/copy/paste
            const [folderPropertiesDialog, setFolderPropertiesDialog] = useState(null); // v5.0.0-alpha.142 - Folder properties dialog { folderId }
            const [folderPropertiesEditedName, setFolderPropertiesEditedName] = useState(''); // v5.0.0-alpha.143 - Edited name in properties dialog
            const [dialogDrag, setDialogDrag] = useState(null); // v5.0.0-alpha.144 - Dragging state { isDragging, offsetX, offsetY, dialogX, dialogY }
            const [visibleColumns, setVisibleColumns] = useState({ // v5.0.0-alpha.104 - Column visibility (Name always visible)
                author: true,
                rating: true,
                dateAdded: true,
                price: true,
                priceGoal: true,
                delta: true
            });
            const [explorerColumnMenuOpen, setExplorerColumnMenuOpen] = useState(false); // v5.0.0-alpha.104 - Explorer column chooser menu
            const [explorerColumnMenuPos, setExplorerColumnMenuPos] = useState(null); // v5.0.0-alpha.107 - Context menu position { x, y } or null
            const [columnWidths, setColumnWidths] = useState({ // v5.0.0-alpha.109 - Column widths (px)
                title: 200,
                author: 150,
                rating: 96,
                dateAdded: 112,
                price: 80,
                priceGoal: 80,
                delta: 80
            });
            const [resizingColumn, setResizingColumn] = useState(null); // v5.0.0-alpha.109 - { columnId, startX, startWidth }

            // v5.0.0 - Special folders
            const FOLDER_ALL_BOOKS = { id: '__all__', name: 'All Books', virtual: true, icon: '📚' };
            const FOLDER_LIBRARY = { id: '__library__', name: 'My Library', virtual: true, icon: '📚' }; // v5.0.0-alpha.63
            const FOLDER_INBOX = { id: '__inbox__', name: 'Inbox', virtual: false, icon: '📥', isInbox: true };

            // v4.16.0.s - Helper to extract bookId from column entry (handles legacy string and new object format)
            // Entry types: string (legacy bookId), {type:'divider',...}, {instanceId, bookId} (new format)
            const getBookIdFromEntry = (entry) => {
                if (typeof entry === 'string') return entry;  // Legacy format
                if (entry && entry.type === 'divider') return null;  // Divider
                if (entry && entry.bookId) return entry.bookId;  // New instance format
                return null;
            };

            // v4.16.0.s - Helper to get instanceId from entry (null for legacy entries)
            const getInstanceId = (entry) => {
                if (typeof entry === 'string') return null;  // Legacy format has no instanceId
                if (entry && entry.instanceId) return entry.instanceId;
                return null;
            };

            // v4.16.0.s - Generate UUID for new instances
            const generateInstanceId = () => {
                return 'inst-' + crypto.randomUUID();
            };

            // v4.16.0.s - Helper to check if a column contains a specific bookId
            const columnHasBook = (columnBooks, bookId) => {
                return columnBooks.some(entry => getBookIdFromEntry(entry) === bookId);
            };

            // v4.27.0 - Get inherited tags for a book based on its position in columns
            // Books inherit tags from the divider above them (until next divider)
            const getInheritedTags = (bookId, columnId) => {
                const column = columns.find(c => c.id === columnId);
                if (!column) return [];

                let currentDivTags = [];
                for (const entry of column.books) {
                    if (entry && entry.type === 'divider') {
                        currentDivTags = entry.tags || [];
                    } else {
                        const entryBookId = getBookIdFromEntry(entry);
                        if (entryBookId === bookId) {
                            return currentDivTags;
                        }
                    }
                }
                return [];
            };

            // v4.16.0.s - Helper to find index of bookId in column (first occurrence)
            const findBookIndexInColumn = (columnBooks, bookId) => {
                return columnBooks.findIndex(entry => getBookIdFromEntry(entry) === bookId);
            };

            // v5.0.0 - Book Explorer folder helpers
            // Get all book IDs that are in any user folder (not Inbox)
            const getBooksInUserFolders = () => {
                const inFolders = new Set();
                folders.forEach(folder => {
                    if (folder.id !== '__inbox__') {
                        (folder.bookIds || []).forEach(id => inFolders.add(id));
                    }
                });
                return inFolders;
            };

            // Get the Inbox folder from folders array
            const getInboxFolder = () => folders.find(f => f.id === '__inbox__');

            // Get books for a folder (handles All Books and My Library virtual folders)
            const getFolderBookIds = (folderId) => {
                if (folderId === '__all__') return [...books.map(b => b.id)].reverse(); // Newest first
                if (folderId === '__library__') return []; // v5.0.0-alpha.63 - My Library shows folders, not books
                const folder = folders.find(f => f.id === folderId);
                return folder?.bookIds || [];
            };

            // Filter a single book for Explorer view (applies all active filters)
            const filterBookForExplorer = (book) => {
                if (!book) return false;

                // Text search filter
                const matchesSearch = !searchTerm ||
                    book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    book.author.toLowerCase().includes(searchTerm.toLowerCase());

                // Read status filter
                const matchesReadStatus = !readStatusFilter || book.readStatus === readStatusFilter;

                // Collection filter
                let matchesCollection = true;
                if (collectionFilter) {
                    if (collectionFilter === 'UNCOLLECTED') {
                        matchesCollection = !book.collections || book.collections.length === 0;
                    } else {
                        matchesCollection = book.collections &&
                            book.collections.some(c => c.name === collectionFilter);
                    }
                }

                // Rating filter
                const matchesRating = !ratingFilter || (book.rating >= parseFloat(ratingFilter));

                // Wishlist filter
                const matchesWishlist = !wishlistFilter ||
                    (wishlistFilter === 'wishlist' && book.onWishlist) ||
                    (wishlistFilter === 'owned' && !book.onWishlist);

                // Ownership type filter
                const matchesOwnership = !ownershipFilter ||
                    (book.ownershipType || 'purchased') === ownershipFilter;

                // Hidden filter (book-level for Explorer)
                const matchesHidden = showHidden || !book.isHidden;

                // Series filter
                let matchesSeries = true;
                if (seriesFilter) {
                    if (seriesFilter === 'NOT_IN_SERIES') {
                        matchesSeries = !book.series || book.series.trim() === '';
                    } else {
                        matchesSeries = book.series && book.series === seriesFilter;
                    }
                }

                // Date range filter
                let matchesDateRange = true;
                if (dateFrom || dateTo) {
                    if (book.acquired) {
                        const bookDate = new Date(parseInt(book.acquired)).toISOString().split('T')[0];
                        const fromDate = dateFrom || '0000-01-01';
                        const toDate = dateTo || new Date().toISOString().split('T')[0];
                        if (bookDate < fromDate || bookDate > toDate) {
                            matchesDateRange = false;
                        }
                    } else {
                        matchesDateRange = false;
                    }
                }

                // Deals filter
                const matchesDeals = !dealsFilterActive ||
                    (book.onWishlist && book.priceTrigger != null && book.currentPrice != null && book.currentPrice <= book.priceTrigger);

                // Tag filter
                const matchesTags = !tagFilter || tagFilter.length === 0 ||
                    (book.tags && book.tags.some(tag => tagFilter.includes(tag)));

                return matchesSearch && matchesReadStatus && matchesCollection && matchesRating &&
                    matchesWishlist && matchesOwnership && matchesHidden && matchesSeries &&
                    matchesDateRange && matchesDeals && matchesTags;
            };

            // Get folder by ID (handles All Books and My Library virtual folders)
            const getFolderById = (folderId) => {
                if (folderId === '__all__') return FOLDER_ALL_BOOKS;
                if (folderId === '__library__') return FOLDER_LIBRARY; // v5.0.0-alpha.63
                const folder = folders.find(f => f.id === folderId);
                if (folder?.id === '__inbox__') return { ...folder, ...FOLDER_INBOX };
                return folder;
            };

            // v5.0.0-alpha.80 - Get folder path (breadcrumb) from root to current folder
            const getFolderPath = (folderId) => {
                if (folderId === '__all__') return [FOLDER_ALL_BOOKS];
                if (folderId === '__library__') return [FOLDER_LIBRARY];

                const path = [];
                let current = getFolderById(folderId);
                while (current) {
                    path.unshift(current);
                    if (current.parentId === null || current.parentId === undefined) {
                        // At root level, prepend My Library
                        path.unshift(FOLDER_LIBRARY);
                        break;
                    }
                    current = getFolderById(current.parentId);
                }
                return path;
            };

            // v5.0.0-alpha.98 - Get all folders containing a book (for All Books tooltip)
            const getFoldersContainingBook = (bookId) => {
                return folders.filter(f => {
                    // Skip virtual folders
                    if (f.id === '__all__' || f.id === '__library__') return false;
                    // Check if folder's bookIds includes this book
                    return (f.bookIds || []).includes(bookId);
                });
            };

            // v5.0.0 - Toast notification helper (reusable for all feedback messages)
            // Shows toast at position, animates to footer, persists 10s, then fades
            const showToast = (message, x, y) => {
                setClipboardMessage(message);
                setToastPosition({ x, y });
                setFooterClipboardVisible(false);
                setToastVisible(true);
                setToastAnimating(false);
                setTimeout(() => {
                    setToastAnimating(true);
                    setTimeout(() => {
                        setToastVisible(false);
                        setToastAnimating(false);
                        setFooterClipboardVisible(true);
                        // Fade out footer after 10 seconds
                        setTimeout(() => {
                            setFooterClipboardVisible(false);
                        }, 10000);
                    }, 1000); // Animation duration
                }, 1500); // Wait before animating
            };

            // Get child folders of a parent (null = root level)
            // v5.0.0-alpha.66 - Respects custom order from parent's childFolderIds or sortIndex
            const getChildFolders = (parentId) => {
                const children = folders.filter(f => f.parentId === parentId);

                if (parentId === null) {
                    // Root level folders - use sortIndex property if available
                    const hasSortIndex = children.some(f => f.sortIndex !== undefined);
                    if (hasSortIndex) {
                        return [...children].sort((a, b) => {
                            const idxA = a.sortIndex ?? Infinity;
                            const idxB = b.sortIndex ?? Infinity;
                            if (idxA !== idxB) return idxA - idxB;
                            return a.name.localeCompare(b.name);
                        });
                    }
                } else {
                    // Nested folders - use parent's childFolderIds
                    const parentFolder = folders.find(f => f.id === parentId);
                    const customOrder = parentFolder?.childFolderIds || [];

                    if (customOrder.length > 0) {
                        const orderMap = new Map(customOrder.map((id, i) => [id, i]));
                        return [...children].sort((a, b) => {
                            const posA = orderMap.has(a.id) ? orderMap.get(a.id) : Infinity;
                            const posB = orderMap.has(b.id) ? orderMap.get(b.id) : Infinity;
                            if (posA !== posB) return posA - posB;
                            return a.name.localeCompare(b.name);
                        });
                    }
                }

                return children; // No custom order, return as-is (will be sorted alphabetically later)
            };

            // v5.0.0 - Get total book count for a folder including all subfolders recursively
            const getFolderTotalCount = (folderId) => {
                const folder = folders.find(f => f.id === folderId);
                if (!folder) return { direct: 0, subfolder: 0, total: 0 };

                const direct = (folder.bookIds || []).length;
                let subfolder = 0;

                const countChildren = (parentId) => {
                    const children = folders.filter(f => f.parentId === parentId);
                    children.forEach(child => {
                        subfolder += (child.bookIds || []).length;
                        countChildren(child.id); // Recurse
                    });
                };
                countChildren(folderId);

                return { direct, subfolder, total: direct + subfolder };
            };

            // Reorder a book within a folder's bookIds array
            // Reorder books within a folder (supports single or multiple books)
            // v5.0.0-alpha.46 - Added undo support
            const reorderBooksInFolder = (folderId, bookIdsToMove, targetIndex) => {
                // Capture fromIndices BEFORE modifying state (for undo)
                const currentFolder = folders.find(f => f.id === folderId);
                const currentBookIds = currentFolder?.bookIds || [];
                const fromIndices = bookIdsToMove.map(id => currentBookIds.indexOf(id));

                setFolders(prev => prev.map(folder => {
                    if (folder.id !== folderId) return folder;
                    const bookIds = [...(folder.bookIds || [])];
                    const moveSet = new Set(bookIdsToMove);

                    // Find the minimum current index of books being moved
                    const minCurrentIndex = Math.min(...bookIdsToMove.map(id => bookIds.indexOf(id)).filter(i => i >= 0));

                    // Remove all books being moved
                    const remaining = bookIds.filter(id => !moveSet.has(id));

                    // Adjust target index based on how many items were removed before it
                    const removedBefore = bookIds.slice(0, targetIndex).filter(id => moveSet.has(id)).length;
                    const adjustedIndex = targetIndex - removedBefore;

                    // Insert all books at target position (maintaining their relative order)
                    const orderedBooksToMove = bookIdsToMove.filter(id => bookIds.includes(id));
                    remaining.splice(adjustedIndex, 0, ...orderedBooksToMove);

                    return { ...folder, bookIds: remaining };
                }));

                // Record action for undo
                recordAction({
                    type: 'REORDER_BOOKS_FOLDER',
                    folderId: folderId,
                    bookIds: bookIdsToMove,
                    fromIndices: fromIndices,
                    toIndex: targetIndex
                });
                console.log(`🔄 Reordered ${bookIdsToMove.length} book(s) in folder`);
            };

            // v5.0.0-alpha.79 - Reorder folders within their parent (with undo)
            // Updates parent's childFolderIds array to persist custom order
            // v5.0.0-alpha.90 - Changed to use targetFolderId + position instead of index
            // This fixes off-by-one issues when display order differs from getChildFolders order
            const reorderFoldersInParent = (parentId, folderIdsToMove, targetFolderId, position) => {
                // Get current child folders in their current order
                const currentChildren = getChildFolders(parentId);
                const currentOrder = currentChildren.map(f => f.id);

                // Find target index based on folder ID (not visual index)
                let targetIndex = currentOrder.indexOf(targetFolderId);
                if (targetIndex === -1) return; // Target not found
                if (position === 'after') targetIndex++;

                // Capture fromIndices BEFORE modifying (for undo)
                const fromIndices = folderIdsToMove.map(id => currentOrder.indexOf(id));

                // Build new order
                const moveSet = new Set(folderIdsToMove);
                const remaining = currentOrder.filter(id => !moveSet.has(id));

                // Adjust target index based on how many items were removed before it
                const removedBefore = currentOrder.slice(0, targetIndex).filter(id => moveSet.has(id)).length;
                const adjustedIndex = targetIndex - removedBefore;

                // Insert at target position (maintaining relative order of moved items)
                const orderedToMove = folderIdsToMove.filter(id => currentOrder.includes(id));
                remaining.splice(adjustedIndex, 0, ...orderedToMove);

                // Update parent's childFolderIds (or create virtual parent tracking for root level)
                if (parentId) {
                    setFolders(prev => prev.map(folder => {
                        if (folder.id !== parentId) return folder;
                        return { ...folder, childFolderIds: remaining };
                    }));
                } else {
                    // Root level folders - store order in a special way
                    // For now, we'll store this in localStorage as root folder order
                    // Actually, we need to update each folder's parentId order somehow...
                    // Simpler: Add a "rootFolderOrder" to explorer state
                    // For now, let's update folders to include a sort index
                    setFolders(prev => {
                        const updated = [...prev];
                        remaining.forEach((folderId, idx) => {
                            const folderIdx = updated.findIndex(f => f.id === folderId);
                            if (folderIdx >= 0) {
                                updated[folderIdx] = { ...updated[folderIdx], sortIndex: idx };
                            }
                        });
                        return updated;
                    });
                }

                // Record for undo
                const folderNames = folderIdsToMove.map(id => folders.find(f => f.id === id)?.name || id).join(', ');
                recordAction({
                    type: 'REORDER_FOLDER',
                    parentId,
                    folderIds: folderIdsToMove,
                    fromIndices,
                    toIndex: adjustedIndex,
                    oldOrder: currentOrder,
                    newOrder: remaining,
                    description: `Reorder "${folderNames}"`
                });

                console.log(`🔄 Reordered ${folderIdsToMove.length} folder(s) in parent ${parentId || 'root'}`);
            };

            // v5.0.0-alpha.78 - Phase D: Reparent folder (move into another folder) with undo
            const reparentFolder = (folderIds, newParentId) => {
                // Helper: Check if targetId is a descendant of folderId
                const isDescendant = (folderId, targetId) => {
                    if (folderId === targetId) return true;
                    const children = folders.filter(f => f.parentId === folderId);
                    return children.some(child => isDescendant(child.id, targetId));
                };

                // Validate: can't move folder into itself or its descendants
                for (const folderId of folderIds) {
                    if (folderId === newParentId || isDescendant(folderId, newParentId)) {
                        showToast("Can't move folder into itself or its subfolder", 'error');
                        return false;
                    }
                    // Can't reparent Inbox
                    if (folderId === '__inbox__') {
                        showToast("Inbox cannot be moved", 'error');
                        return false;
                    }
                }

                // Can't move into Inbox
                if (newParentId === '__inbox__') {
                    showToast("Can't move folders into Inbox", 'error');
                    return false;
                }

                // Save old parentIds for undo
                const oldParentIds = folderIds.map(id => {
                    const folder = folders.find(f => f.id === id);
                    return { folderId: id, oldParentId: folder?.parentId };
                });

                setFolders(prev => prev.map(folder => {
                    if (folderIds.includes(folder.id)) {
                        return { ...folder, parentId: newParentId };
                    }
                    return folder;
                }));

                // Record for undo
                const folderNames = folderIds.map(id => folders.find(f => f.id === id)?.name || id).join(', ');
                const targetName = newParentId ? folders.find(f => f.id === newParentId)?.name : 'root';
                recordAction({
                    type: 'REPARENT_FOLDER',
                    folderIds,
                    oldParentIds,
                    newParentId,
                    description: `Move "${folderNames}" into "${targetName}"`
                });

                showToast(`Moved "${folderNames}" into "${targetName}"`, 'success');
                console.log(`📁 Moved ${folderIds.length} folder(s) into ${newParentId || 'root'}`);
                return true;
            };

            // v5.0.0 - Migrate columns/dividers to folders
            // Columns become root folders, dividers become subfolders
            const migrateColumnsToFolders = () => {
                const newFolders = [];

                console.log('📁 Migration starting. Columns:', columns.length);

                columns.forEach(column => {
                    // Skip empty columns
                    const hasContent = column.books && column.books.length > 0;
                    if (!hasContent) {
                        console.log(`📁 Skipping empty column: ${column.name}`);
                        return;
                    }

                    console.log(`📁 Processing column: ${column.name} with ${column.books.length} entries`);
                    // DEBUG: Log first few entries to see format
                    console.log(`📁 First 3 entries:`, column.books.slice(0, 3));

                    // Create root folder for this column
                    const rootFolderId = `folder-${column.id}`;
                    const rootFolder = {
                        id: rootFolderId,
                        name: column.name,
                        parentId: null,
                        bookIds: [],
                        collapsed: false
                    };

                    let currentFolder = rootFolder;

                    column.books.forEach((entry, idx) => {
                        if (entry && entry.type === 'divider') {
                            // Divider becomes a subfolder
                            // First, push current folder if it has books
                            if (currentFolder.bookIds.length > 0 || currentFolder === rootFolder) {
                                // Only add root folder once
                                if (!newFolders.find(f => f.id === rootFolder.id)) {
                                    newFolders.push(rootFolder);
                                }
                            }

                            // Create subfolder for divider (dividers use 'label' not 'name')
                            const subfolder = {
                                id: `folder-${entry.id}`,
                                name: entry.label || 'Untitled',
                                parentId: rootFolderId,
                                bookIds: [],
                                collapsed: false
                            };
                            newFolders.push(subfolder);
                            currentFolder = subfolder;
                            console.log(`📁 Created subfolder: ${entry.label}`);
                        } else {
                            // Book entry - add to current folder
                            const bookId = getBookIdFromEntry(entry);
                            if (bookId) {
                                currentFolder.bookIds.push(bookId);
                            } else if (idx < 5) {
                                // DEBUG: Log entries that don't yield bookIds
                                console.log(`📁 Entry ${idx} yielded no bookId:`, entry);
                            }
                        }
                    });

                    // Ensure root folder is added (even if no dividers)
                    if (!newFolders.find(f => f.id === rootFolder.id)) {
                        newFolders.push(rootFolder);
                    }

                    console.log(`📁 Column ${column.name} → folder with ${rootFolder.bookIds.length} books`);
                });

                // Add Inbox folder at the end
                newFolders.push({
                    id: '__inbox__',
                    name: 'Inbox',
                    parentId: null,
                    bookIds: [],
                    collapsed: false
                });

                console.log('📁 Migration complete. Folders created:', newFolders.map(f => `${f.name}(${f.bookIds.length})`));
                setFolders(newFolders);
                setShowMigrationDialog(false);
                setViewMode('explorer'); // Switch to explorer view to show result
                setSelectedFolderId('__all__'); // Start with All Books
                console.log(`📁 Migrated ${columns.length} columns to ${newFolders.length} folders`);
            };

            // v3.11.0.d - Ref for column menu click-outside detection
            const columnMenuRef = useRef(null);

            // v3.14.0.h - Track previous dropTarget for debug logging
            const prevDropTargetRef = useRef(null);

            // v3.14.0.w - Use refs instead of state for dropTarget to avoid React re-renders
            const dropTargetRef = useRef(null);
            const indicatorRef = useRef(null);

            // v3.14.0.x - Use refs for ghost position to eliminate ALL React re-renders during drag
            const dragGhostRef = useRef(null);
            const dragPosRef = useRef({ x: 0, y: 0 });

            // v4.16.0.au - Copy-drag tracking (Ctrl+Drag to copy instead of move)
            const isCopyDragRef = useRef(false);
            const dragTooltipRef = useRef(null);

            // v5.0.0-alpha.132 - Tooltip hide delay (prevents tooltip from disappearing when moving cursor to it)
            const tooltipHideTimeoutRef = useRef(null);

            // v3.14.0.r - Row-based grid index for O(log R) drop position lookup
            // Structure: { columnId: { rowBoundaries: [y1, y2, ...], rows: [{type, startIndex, items, top, bottom}, ...], columnRect } }
            const columnIndexRef = useRef({});

            // v4.0.1 - Ref to hold current filteredBooks function for Ctrl+A handler
            const filteredBooksRef = useRef(null);

            // v3.12.0 - Auto-scroll during drag
            const [autoScrollInterval, setAutoScrollInterval] = useState(null);

            // Status bar state (v3.9.0 - Load-state-only, 4 states)
            const [libraryStatus, setLibraryStatus] = useState({
                loadStatus: 'empty',     // empty, fresh, stale, obsolete
                loadDate: null           // ISO date string from loaded JSON metadata.fetchDate
            });
            const [collectionsStatus, setCollectionsStatus] = useState({
                loadStatus: 'empty',
                loadDate: null
            });

            // Wrapper for setSyncStatus
            const setSyncStatus = (newStatus) => {
                setSyncStatusInternal(newStatus);
            };
            const [settings, setSettings] = useState({
                cacheExpirationDays: 30
            });
            const dragThreshold = 50;

            // v5.0.0-alpha.92 - Navigation history functions
            const navigateToFolder = (folderId, addToHistory = true) => {
                setSelectedFolderId(folderId);
                if (addToHistory) {
                    // Truncate forward history and add new entry
                    setNavHistory(prev => [...prev.slice(0, navHistoryIndex + 1), folderId]);
                    setNavHistoryIndex(prev => prev + 1);
                }
            };

            const canGoBack = navHistoryIndex > 0;
            const canGoForward = navHistoryIndex < navHistory.length - 1;

            const goBack = () => {
                if (canGoBack) {
                    const newIndex = navHistoryIndex - 1;
                    setNavHistoryIndex(newIndex);
                    setSelectedFolderId(navHistory[newIndex]);
                }
            };

            const goForward = () => {
                if (canGoForward) {
                    const newIndex = navHistoryIndex + 1;
                    setNavHistoryIndex(newIndex);
                    setSelectedFolderId(navHistory[newIndex]);
                }
            };

            // v4.15.6: Track initial mount to prevent save effect from overwriting loaded values
            const filtersLoadedRef = useRef(false);

            // v5.0.0-alpha.82 - Timeout for auto-expanding folder on drag hover
            const dragHoverExpandTimeoutRef = useRef(null);

            // Load saved filters from localStorage on mount (v3.8.0.f, updated v3.8.0.k, v4.15.6)
            React.useEffect(() => {
                try {
                    const savedFilters = localStorage.getItem(FILTERS_KEY);
                    if (savedFilters) {
                        const filters = JSON.parse(savedFilters);
                        if (filters.searchTerm !== undefined) setSearchTerm(filters.searchTerm);
                        if (filters.readStatusFilter !== undefined) setReadStatusFilter(filters.readStatusFilter);
                        if (filters.collectionFilter !== undefined) setCollectionFilter(filters.collectionFilter);
                        if (filters.ratingFilter !== undefined) setRatingFilter(filters.ratingFilter);
                        if (filters.wishlistFilter !== undefined) setWishlistFilter(filters.wishlistFilter);
                        if (filters.ownershipFilter !== undefined) setOwnershipFilter(filters.ownershipFilter);
                        if (filters.seriesFilter !== undefined) setSeriesFilter(filters.seriesFilter);
                        if (filters.showHidden !== undefined) setShowHidden(filters.showHidden);

                        // v4.15.6: Load datePreset, with migration from old dateFrom/dateTo format
                        if (filters.datePreset) {
                            // New format: datePreset controls the filter
                            setDatePreset(filters.datePreset);
                            if (filters.datePreset === 'custom') {
                                // Custom preset: also restore the manual dates
                                if (filters.dateFrom) setDateFrom(filters.dateFrom);
                                if (filters.dateTo) setDateTo(filters.dateTo);
                            }
                            // For non-custom presets, the useEffect will compute dateFrom/dateTo
                        } else if (filters.dateFrom || filters.dateTo) {
                            // Migration: old format had dateFrom/dateTo but no datePreset
                            // Treat as custom date range
                            setDatePreset('custom');
                            if (filters.dateFrom) setDateFrom(filters.dateFrom);
                            if (filters.dateTo) setDateTo(filters.dateTo);
                        }
                        // v4.27.0: Load tag filter
                        if (filters.tagFilter && Array.isArray(filters.tagFilter)) {
                            setTagFilter(filters.tagFilter);
                        }
                    }
                } catch (e) {
                    console.error('Failed to load filters from localStorage:', e);
                }
                // v4.15.6: Mark filters as loaded after a small delay to let React batch state updates
                setTimeout(() => {
                    filtersLoadedRef.current = true;
                }, 100);
            }, []); // Empty dependency array = run once on mount

            // Save filters to localStorage whenever they change (v3.8.0.f, updated v3.8.0.k, v4.1.0.d, v4.15.6)
            React.useEffect(() => {
                // v4.15.6: Skip save during initial load to prevent overwriting
                if (!filtersLoadedRef.current) return;
                try {
                    const filters = {
                        searchTerm,
                        readStatusFilter,
                        collectionFilter,
                        ratingFilter,
                        wishlistFilter,
                        ownershipFilter,
                        seriesFilter,
                        datePreset,  // v4.15.6: Save preset instead of raw dates (except for custom)
                        dateFrom: datePreset === 'custom' ? dateFrom : '',  // Only save dates for custom preset
                        dateTo: datePreset === 'custom' ? dateTo : '',
                        showHidden,
                        tagFilter  // v4.27.0 - Tag filter
                    };
                    localStorage.setItem(FILTERS_KEY, JSON.stringify(filters));
                } catch (e) {
                    console.error('Failed to save filters to localStorage:', e);
                }
            }, [searchTerm, readStatusFilter, collectionFilter, ratingFilter, wishlistFilter, ownershipFilter, seriesFilter, datePreset, dateFrom, dateTo, showHidden, tagFilter]);

            // Compute dateFrom/dateTo from datePreset selection (v4.15.6)
            React.useEffect(() => {
                // Skip during initial load - the load effect will set dateFrom/dateTo directly
                if (!filtersLoadedRef.current) return;
                if (!datePreset || datePreset === 'custom') {
                    // 'custom' uses manual dateFrom/dateTo, don't override
                    // '' (All Dates) clears the date filter
                    if (datePreset === '') {
                        setDateFrom('');
                        setDateTo('');
                    }
                    return;
                }

                const today = new Date();
                const formatDate = (d) => d.toISOString().split('T')[0]; // YYYY-MM-DD

                let from = '';
                let to = formatDate(today);

                if (datePreset === 'last30') {
                    const d = new Date(today);
                    d.setDate(d.getDate() - 30);
                    from = formatDate(d);
                } else if (datePreset === 'last90') {
                    const d = new Date(today);
                    d.setDate(d.getDate() - 90);
                    from = formatDate(d);
                } else if (datePreset === 'lastYear') {
                    const d = new Date(today);
                    d.setFullYear(d.getFullYear() - 1);
                    from = formatDate(d);
                } else if (datePreset.startsWith('year')) {
                    // Year preset: yearYYYY format
                    const year = parseInt(datePreset.substring(4));
                    from = `${year}-01-01`;
                    to = `${year}-12-31`;
                }

                setDateFrom(from);
                setDateTo(to);
            }, [datePreset]);

            const formatAcquisitionDate = (timestamp) => {
                if (!timestamp) return '';
                const ts = typeof timestamp === 'string' ? parseInt(timestamp) : timestamp;
                const date = new Date(ts > 9999999999 ? ts : ts * 1000);
                if (isNaN(date.getTime())) return timestamp;
                return date.toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'short', 
                    day: 'numeric' 
                });
            };

            const getRelativeTime = (timestamp) => {
                if (!timestamp) return '';
                const now = Date.now();
                const diff = now - timestamp;
                const minutes = Math.floor(diff / 60000);
                const hours = Math.floor(diff / 3600000);
                const days = Math.floor(diff / 86400000);
                
                if (minutes < 1) return 'just now';
                if (minutes < 60) return `${minutes}m ago`;
                if (hours < 24) return `${hours}h ago`;
                return `${days}d ago`;
            };

            // checkManifest function removed in v3.6.1 - replaced with IndexedDB manifests
            // Status is now computed from libraryStatus and collectionsStatus state

            // Initial load from IndexedDB
            useEffect(() => {
                const loadData = async () => {
                    try {
                        // Load settings
                        const savedSettings = localStorage.getItem(SETTINGS_KEY);
                        if (savedSettings) {
                            setSettings(JSON.parse(savedSettings));
                        }

                        // Restore libraryStatus and collectionsStatus from localStorage (v3.7.0.n)
                        const savedStatus = localStorage.getItem(STATUS_KEY);
                        if (savedStatus) {
                            const statusData = JSON.parse(savedStatus);
                            if (statusData.libraryStatus) {
                                setLibraryStatus(statusData.libraryStatus);
                                console.log('📦 Restored libraryStatus from localStorage:', statusData.libraryStatus.loadStatus);
                            }
                            if (statusData.collectionsStatus) {
                                setCollectionsStatus(statusData.collectionsStatus);
                                console.log('📦 Restored collectionsStatus from localStorage:', statusData.collectionsStatus.loadStatus);
                            }
                        }

                        // v5.0.0 - Load Explorer settings
                        const savedExplorer = localStorage.getItem(EXPLORER_KEY);
                        if (savedExplorer) {
                            const explorerData = JSON.parse(savedExplorer);
                            if (explorerData.viewMode) setViewMode(explorerData.viewMode);
                            if (explorerData.selectedFolderId) setSelectedFolderId(explorerData.selectedFolderId);
                            if (explorerData.explorerView) setExplorerView(explorerData.explorerView);
                            if (explorerData.explorerSort) setExplorerSort(explorerData.explorerSort);
                            if (explorerData.explorerCoverCols) setExplorerCoverCols(explorerData.explorerCoverCols);
                            if (explorerData.leftPaneWidth) setLeftPaneWidth(explorerData.leftPaneWidth); // v5.0.0-alpha.91
                            if (explorerData.folderSortSettings) setFolderSortSettings(explorerData.folderSortSettings); // v5.0.0-alpha.100
                            if (explorerData.visibleColumns) setVisibleColumns(explorerData.visibleColumns); // v5.0.0-alpha.104
                            if (explorerData.columnWidths) setColumnWidths(explorerData.columnWidths); // v5.0.0-alpha.109
                            console.log('📁 Restored Explorer settings from localStorage');
                        }

                        // v5.0.0 - Load folders
                        const savedFolders = localStorage.getItem(FOLDERS_KEY);
                        if (savedFolders) {
                            setFolders(JSON.parse(savedFolders));
                            console.log('📁 Restored folders from localStorage');
                        }

                        // Load books from IndexedDB
                        let loadedBooks = await loadBooksFromIndexedDB();

                        // Merge collections data into loaded books
                        if (loadedBooks.length > 0) {
                            loadedBooks = await mergeCollectionsIntoBooks(loadedBooks);
                            setBooks(loadedBooks);
                            // Update IndexedDB with merged data
                            await saveBooksToIndexedDB(loadedBooks);

                            // v4.13.0: Initialize cover cache
                            // Build URL map from cache for immediate use
                            const urlMap = await buildCoverUrlMap(loadedBooks);
                            setCoverUrlMap(urlMap);
                            // Populate cache in background for uncached images
                            populateCoverCache(loadedBooks); // Don't await - runs in background
                        }

                        let effectiveLastSync = null;

                        if (loadedBooks.length > 0) {
                            
                            // Load organization from localStorage
                            const saved = localStorage.getItem(STORAGE_KEY);
                            if (saved) {
                                const state = JSON.parse(saved);
                                if (state.organization?.columns) {
                                    const restoredColumns = state.organization.columns.map(col => ({
                                        id: col.id,
                                        name: col.name,
                                        books: col.bookIds || col.books
                                    }));
                                    setColumns(restoredColumns);
                                    setBlankImageBooks(new Set(state.organization.blankImageBooks || []));
                                    setHiddenInstances(new Set(state.organization.hiddenInstances || [])); // v4.16.0.z
                                    setTagRegistry(state.organization.tagRegistry || {}); // v4.27.0
                                    setFolders(state.organization.folders || []); // v5.0.0
                                    setDataSource(state.organization.dataSource || 'enriched');
                                    effectiveLastSync = state.lastSyncTime || Date.now();
                                    setLastSyncTime(effectiveLastSync);
                                    console.log('✅ Restored organization from localStorage');
                                } else {
                                    // No organization saved, put all books in first column
                                    setColumns([{ id: 'unorganized', name: 'Unorganized', books: loadedBooks.map(b => b.id) }]);
                                    setDataSource('enriched');
                                    effectiveLastSync = Date.now();
                                    setLastSyncTime(effectiveLastSync);
                                }
                            } else {
                                // No saved state, put all books in first column
                                setColumns([{ id: 'unorganized', name: 'Unorganized', books: loadedBooks.map(b => b.id) }]);
                                setDataSource('enriched');
                                effectiveLastSync = Date.now();
                                setLastSyncTime(effectiveLastSync);
                            }
                        }


                        // Loading complete - set syncStatus to indicate we're done loading
                        // Actual status display now comes from libraryStatus/collectionsStatus
                        setSyncStatus('none');
                    } catch (error) {
                        console.error('Failed to load data:', error);
                        setSyncStatus('none');
                    }
                };
                
                loadData();
            }, []);

            // v5.0.0 - Auto-detect migration opportunity (columns → folders)
            // Trigger: columns have content, but folders are empty or just Inbox
            useEffect(() => {
                if (syncStatus === 'loading') return;
                if (books.length === 0) return; // No data loaded yet

                // Check if columns have meaningful content
                const columnsHaveContent = columns.some(col => {
                    if (!col.books || col.books.length === 0) return false;
                    // Check for actual books or dividers (not just empty)
                    return col.books.some(entry => {
                        if (entry && entry.type === 'divider') return true;
                        return getBookIdFromEntry(entry) !== null;
                    });
                });

                // Check if no user-created folders exist (Inbox doesn't count - it's auto-created)
                // Inbox may have books from auto-sync, but that's not user organization
                const noUserFolders = !folders.some(f => f.id !== '__inbox__');

                // Show migration dialog if columns have content but no user folders exist
                if (columnsHaveContent && noUserFolders && !showMigrationDialog) {
                    console.log('📁 Migration opportunity detected: columns have content, folders empty');
                    setShowMigrationDialog(true);
                }
            }, [syncStatus, books.length, columns, folders]);

            // v5.0.0-alpha.132 - Cleanup tooltip timeout on unmount
            useEffect(() => {
                return () => {
                    if (tooltipHideTimeoutRef.current) {
                        clearTimeout(tooltipHideTimeoutRef.current);
                    }
                };
            }, []);

            // Auto-save organization
            // v4.16.0.ab - Guard: Skip save while loading to prevent race condition
            useEffect(() => {
                if (syncStatus === 'loading') return;
                if (books.length > 0 && columns.length > 0) {
                    try {
                        const state = {
                            organization: {
                                columns: columns.map(col => ({
                                    id: col.id,
                                    name: col.name,
                                    bookIds: col.books
                                })),
                                folders,  // v5.0.0 - Book Explorer folders
                                dataSource,
                                blankImageBooks: Array.from(blankImageBooks),
                                hiddenInstances: Array.from(hiddenInstances), // v4.16.0.z
                                tagRegistry  // v4.27.0 - Tag registry
                            },
                            lastSyncTime: lastSyncTime || Date.now(),
                            savedAt: Date.now()
                        };
                        localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
                    } catch (e) {
                        console.warn('Could not auto-save organization:', e);
                    }
                }
            }, [syncStatus, columns, folders, blankImageBooks, dataSource, lastSyncTime, hiddenInstances, tagRegistry]);

            // v5.0.0 - Sync Inbox folder: add books not in ANY folder to Inbox
            // Note: Only adds, doesn't remove (removal happens via move drop handler)
            useEffect(() => {
                if (syncStatus === 'loading' || books.length === 0) return;

                const inbox = getInboxFolder();
                // Get all book IDs in ANY folder (including Inbox)
                const booksInAnyFolder = new Set();
                folders.forEach(folder => {
                    (folder.bookIds || []).forEach(id => booksInAnyFolder.add(id));
                });
                const booksNotInAnyFolder = books.map(b => b.id).filter(id => !booksInAnyFolder.has(id));

                if (!inbox) {
                    // Create Inbox with all books not in any folder (newest first)
                    console.log('📥 Creating Inbox folder with', booksNotInAnyFolder.length, 'books');
                    setFolders(prev => [{
                        id: '__inbox__',
                        name: 'Inbox',
                        parentId: null,
                        bookIds: [...booksNotInAnyFolder].reverse(),
                        childFolderIds: [],
                        collapsed: false,
                        isInbox: true
                    }, ...prev]);
                } else if (booksNotInAnyFolder.length > 0) {
                    // Add new books to Inbox (books imported that aren't in any folder yet)
                    console.log('📥 Adding', booksNotInAnyFolder.length, 'new books to Inbox');
                    setFolders(prev => prev.map(f => {
                        if (f.id !== '__inbox__') return f;
                        return { ...f, bookIds: [...booksNotInAnyFolder.reverse(), ...(f.bookIds || [])] };
                    }));
                }
            }, [books, folders, syncStatus]);

            useEffect(() => {
                localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
            }, [settings]);

            // Save libraryStatus and collectionsStatus to localStorage (v3.7.0.n)
            useEffect(() => {
                const statusData = { libraryStatus, collectionsStatus };
                localStorage.setItem(STATUS_KEY, JSON.stringify(statusData));
            }, [libraryStatus, collectionsStatus]);

            // v5.0.0 - Save Explorer settings to localStorage
            useEffect(() => {
                const explorerData = {
                    viewMode,
                    selectedFolderId,
                    explorerView,
                    explorerSort,
                    explorerCoverCols,
                    leftPaneWidth, // v5.0.0-alpha.91
                    folderSortSettings, // v5.0.0-alpha.100 - Per-folder sort settings
                    visibleColumns, // v5.0.0-alpha.104 - Column visibility
                    columnWidths // v5.0.0-alpha.109 - Column widths
                };
                localStorage.setItem(EXPLORER_KEY, JSON.stringify(explorerData));
            }, [viewMode, selectedFolderId, explorerView, explorerSort, explorerCoverCols, leftPaneWidth, folderSortSettings, visibleColumns, columnWidths]);

            // v5.0.0 - Save folders to localStorage
            useEffect(() => {
                localStorage.setItem(FOLDERS_KEY, JSON.stringify(folders));
            }, [folders]);

            // v5.0.0-alpha.100 - Restore per-folder sort when folder changes
            useEffect(() => {
                // Check if we have saved sort for this folder
                const savedSort = folderSortSettings[selectedFolderId];

                if (savedSort) {
                    // Restore saved sort for this folder
                    setExplorerSort(savedSort);
                } else {
                    // No saved sort - use sensible defaults
                    if (selectedFolderId === '__all__') {
                        // All Books: dateAdded desc (no manual order available)
                        setExplorerSort({ column: 'dateAdded', direction: 'desc' });
                    } else if (selectedFolderId === '__library__') {
                        // My Library: title asc (folder view)
                        setExplorerSort({ column: 'title', direction: 'asc' });
                    } else {
                        // User folders: custom (manual order)
                        setExplorerSort({ column: 'custom', direction: 'asc' });
                    }
                }
                // eslint-disable-next-line react-hooks/exhaustive-deps
            }, [selectedFolderId]); // Only re-run when folder changes, not when settings change

            // v5.0.0-alpha.100 - Save sort settings for current folder when sort changes
            useEffect(() => {
                // Only save if sort is different from what's saved for this folder
                const savedSort = folderSortSettings[selectedFolderId];
                const sortChanged = !savedSort ||
                    savedSort.column !== explorerSort.column ||
                    savedSort.direction !== explorerSort.direction;

                if (sortChanged) {
                    setFolderSortSettings(prev => ({
                        ...prev,
                        [selectedFolderId]: { ...explorerSort }
                    }));
                }
            }, [explorerSort, selectedFolderId]);

            // v5.0.0-alpha.104 - Close Explorer column menu when clicking outside
            useEffect(() => {
                if (!explorerColumnMenuOpen) return;

                const handleClickOutside = (e) => {
                    // Close menu if clicking outside (not on the gear button or menu)
                    if (!e.target.closest('.column-chooser-menu') && !e.target.closest('.column-chooser-button')) {
                        setExplorerColumnMenuOpen(false);
                        setExplorerColumnMenuPos(null); // v5.0.0-alpha.107 - Clear context menu position
                    }
                };

                document.addEventListener('mousedown', handleClickOutside);
                return () => document.removeEventListener('mousedown', handleClickOutside);
            }, [explorerColumnMenuOpen]);

            // v5.0.0-alpha.82 - Auto-expand tree to show selected folder
            useEffect(() => {
                // Skip virtual folders (All Books, My Library)
                if (!selectedFolderId || selectedFolderId === '__all__' || selectedFolderId === '__library__') return;

                // Get path from root to selected folder
                const path = getFolderPath(selectedFolderId);
                // Extract ancestor IDs (skip virtual root and current folder - only expand parents)
                const ancestorIds = path
                    .filter(f => f.id !== '__library__' && f.id !== selectedFolderId)
                    .map(f => f.id);

                if (ancestorIds.length > 0) {
                    setFolders(prev => prev.map(f =>
                        ancestorIds.includes(f.id) ? { ...f, collapsed: false } : f
                    ));
                }
            }, [selectedFolderId]);

            // Expose books to window for debugging
            useEffect(() => {
                window.books = books;
            }, [books]);

            // Expose folders to window for debugging
            useEffect(() => {
                window.folders = folders;
                window.setFolders = setFolders;
            }, [folders]);

            // ESC key to clear selection, Ctrl+A to select all in active column
            useEffect(() => {
                const handleKeyDown = (e) => {
                    if (e.key === 'Escape') {
                        clearSelection();
                        setContextMenu(null);
                        // v4.16.0 - Also clear clipboard on Escape
                        setClipboard(null);
                        // v4.16.0.g - Clear clipboard message on Escape
                        setClipboardMessage(null);
                        // v4.16.0.l - Clear toast state on Escape
                        setToastVisible(false);
                        setToastAnimating(false);
                        // v4.16.0.o - Clear footer clipboard visibility
                        setFooterClipboardVisible(false);
                    }

                    // v4.21.1.a - Let browser handle Ctrl+A/C/X natively when input/textarea focused
                    const isInputFocused = ['INPUT', 'TEXTAREA'].includes(document.activeElement?.tagName);
                    if (isInputFocused && (e.ctrlKey || e.metaKey) && ['a', 'c', 'x'].includes(e.key)) {
                        return; // Don't preventDefault, let browser handle
                    }

                    // v4.21.1.b - Let browser handle Ctrl+C if text is selected (user wants to copy text, not books)
                    const hasTextSelection = window.getSelection()?.toString().length > 0;
                    if (hasTextSelection && (e.ctrlKey || e.metaKey) && e.key === 'c') {
                        return; // Let browser copy selected text
                    }

                    // v4.21.1.c - Disable Ctrl+A when modal is open (prevent selecting entire page)
                    if (modalBookRef.current && (e.ctrlKey || e.metaKey) && e.key === 'a') {
                        e.preventDefault(); // Don't select entire page or books
                        return;
                    }

                    // v5.0.0-alpha.92 - Alt+Left: Back, Alt+Right: Forward (only in Explorer view)
                    if (viewMode === 'explorer' && e.altKey && e.key === 'ArrowLeft') {
                        e.preventDefault();
                        goBack();
                    }
                    if (viewMode === 'explorer' && e.altKey && e.key === 'ArrowRight') {
                        e.preventDefault();
                        goForward();
                    }

                    // v4.8.0 - Ctrl+Z: Undo (v4.21.0.g - use ref to check modal state, consume keystroke)
                    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                        e.preventDefault();
                        if (!modalBookRef.current) undo();
                    }
                    // v4.8.0 - Ctrl+Y or Ctrl+Shift+Z: Redo (v4.21.0.g - use ref to check modal state, consume keystroke)
                    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey))) {
                        e.preventDefault();
                        if (!modalBookRef.current) redo();
                    }

                    // Ctrl+A: Select all items in active column (v4.0.1 - use ref to get current filtered view)
                    // v4.19.1 - Now includes dividers in selection
                    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && activeColumnId) {
                        e.preventDefault(); // Prevent browser's select-all
                        const column = columns.find(col => col.id === activeColumnId);
                        if (column) {
                            // Select ALL items including dividers (use raw column.books for simplicity)
                            const compositeKeys = [];
                            let firstDividerId = null;
                            column.books.forEach((item, index) => {
                                if (!item) return;
                                if (typeof item === 'object' && item.type === 'divider') {
                                    // Divider: use special key format
                                    compositeKeys.push(`${activeColumnId}:divider:${item.id}:${index}`);
                                    if (!firstDividerId) firstDividerId = item.id;
                                } else {
                                    // Book: use standard composite key
                                    const bookId = getBookIdFromEntry(item);
                                    if (bookId) compositeKeys.push(`${activeColumnId}:${bookId}:${index}`);
                                }
                            });
                            setSelectedBooks(new Set(compositeKeys));
                            // Set selectedDivider for visual consistency if any dividers selected
                            if (firstDividerId) {
                                setSelectedDivider({ columnId: activeColumnId, dividerId: firstDividerId });
                            }
                        }
                    }

                    // v5.0.0-alpha.102 - Ctrl+A in Explorer view: Select all visible books/folders
                    // v5.0.0-alpha.103 - Fixed: Check viewMode first (activeColumnId is set even in Explorer view)
                    if ((e.ctrlKey || e.metaKey) && e.key === 'a' && viewMode === 'explorer') {
                        e.preventDefault(); // Prevent browser's select-all

                        // Determine what to select based on current view
                        if (selectedFolderId === '__all__' || (selectedFolderId !== '__library__' && getFolderBookIds(selectedFolderId).length > 0)) {
                            // Viewing books - select all visible (filtered) books
                            const allVisibleBookIds = getFolderBookIds(selectedFolderId)
                                .map(id => books.find(b => b.id === id))
                                .filter(book => filterBookForExplorer(book))
                                .map(book => book.id);

                            setExplorerSelectedBooks(new Set(allVisibleBookIds));
                            setExplorerSelectedFolders(new Set()); // Clear folder selection
                            console.log(`✅ Selected ${allVisibleBookIds.length} book(s) in Explorer`);
                        } else {
                            // Viewing folders (My Library or folder with subfolders) - select all visible folders
                            const childFolders = selectedFolderId === '__library__'
                                ? [getInboxFolder(), ...getChildFolders(null).filter(f => f.id !== '__inbox__')].filter(Boolean)
                                : getChildFolders(selectedFolderId);

                            const allVisibleFolderIds = childFolders.map(f => f.id);

                            setExplorerSelectedFolders(new Set(allVisibleFolderIds));
                            setExplorerSelectedBooks(new Set()); // Clear book selection
                            console.log(`✅ Selected ${allVisibleFolderIds.length} folder(s) in Explorer`);
                        }
                    }

                    // v4.16.0 - Ctrl+X: Cut selected books
                    // v4.16.0.d - Parse composite keys "columnId:bookId:index" from selection
                    if ((e.ctrlKey || e.metaKey) && e.key === 'x' && selectedBooks.size > 0) {
                        e.preventDefault();
                        // Build source positions from composite keys
                        const sourcePositions = [];
                        const bookIds = [];
                        for (const key of selectedBooks) {
                            const [columnId, bookId, indexStr] = key.split(':');
                            const index = parseInt(indexStr, 10);
                            sourcePositions.push({ columnId, index, bookId });
                            bookIds.push(bookId);
                        }
                        setClipboard({ type: 'cut', bookIds, sourcePositions });
                        // v4.16.0.g - Set clipboard status message
                        const message = `${bookIds.length} book${bookIds.length !== 1 ? 's' : ''} cut`;
                        setClipboardMessage(message);
                        // v4.16.0.l - Show toast and animate to footer
                        // v4.16.0.m - Slower animation (1.0s instead of 0.5s)
                        // v4.16.0.o - Hide footer text until toast lands
                        setFooterClipboardVisible(false);
                        setToastVisible(true);
                        setToastAnimating(false);
                        setTimeout(() => {
                            setToastAnimating(true);
                            setTimeout(() => {
                                setToastVisible(false);
                                setToastAnimating(false);
                                setFooterClipboardVisible(true); // Show footer text when toast lands
                            }, 1000); // Animation duration (2x slower)
                        }, 1500); // Wait before animating
                        console.log(`✂️ Cut ${bookIds.length} book(s) to clipboard`);
                    }

                    // v4.16.0 - Ctrl+C: Copy selected books
                    // v4.16.0.d - Parse composite keys "columnId:bookId:index" from selection
                    if ((e.ctrlKey || e.metaKey) && e.key === 'c' && selectedBooks.size > 0) {
                        e.preventDefault();
                        const sourcePositions = [];
                        const bookIds = [];
                        for (const key of selectedBooks) {
                            const [columnId, bookId, indexStr] = key.split(':');
                            const index = parseInt(indexStr, 10);
                            // v4.16.0.ap - Capture instanceId for hidden state copying
                            // v4.16.0.be - Also capture isHidden for legacy entries
                            const column = columns.find(c => c.id === columnId);
                            const entry = column?.books[index];
                            const instanceId = entry ? getInstanceId(entry) : null;
                            // v4.16.0.be - Determine hidden state: GUID uses hiddenInstances, legacy uses book.isHidden
                            const book = books.find(b => b.id === bookId);
                            const isHidden = instanceId
                                ? hiddenInstances.has(instanceId)
                                : (book?.isHidden || false);
                            sourcePositions.push({ columnId, index, bookId, instanceId, isHidden });
                            bookIds.push(bookId);
                        }
                        setClipboard({ type: 'copy', bookIds, sourcePositions });
                        // v4.16.0.g - Set clipboard status message
                        const message = `${bookIds.length} book${bookIds.length !== 1 ? 's' : ''} copied`;
                        setClipboardMessage(message);
                        // v4.16.0.l - Show toast and animate to footer
                        // v4.16.0.m - Slower animation (1.0s instead of 0.5s)
                        // v4.16.0.o - Hide footer text until toast lands
                        setFooterClipboardVisible(false);
                        setToastVisible(true);
                        setToastAnimating(false);
                        setTimeout(() => {
                            setToastAnimating(true);
                            setTimeout(() => {
                                setToastVisible(false);
                                setToastAnimating(false);
                                setFooterClipboardVisible(true); // Show footer text when toast lands
                            }, 1000); // Animation duration (2x slower)
                        }, 1500); // Wait before animating
                        console.log(`📋 Copied ${bookIds.length} book(s) to clipboard`);
                    }

                    // v4.16.0 - Ctrl+V: Paste to active column
                    if ((e.ctrlKey || e.metaKey) && e.key === 'v' && clipboard && clipboard.bookIds.length > 0) {
                        e.preventDefault();
                        if (!activeColumnId) {
                            console.log('⚠️ No active column - click a column first');
                            return;
                        }

                        const targetColumn = columns.find(col => col.id === activeColumnId);
                        if (!targetColumn) return;

                        // v4.16.0.ao - Calculate paste index: before selected book, or top if no selection
                        const selectedInTarget = getSelectedEntries().filter(sel => sel.columnId === activeColumnId);
                        const pasteIndex = selectedInTarget.length > 0
                            ? Math.min(...selectedInTarget.map(sel => sel.index))
                            : 0;

                        if (clipboard.type === 'cut') {
                            // Cut: Remove from source columns, add to target
                            // v4.16.0.k - Use sourcePositions to remove only specific instances
                            // v4.16.0.u - Preserve original entries (don't create new GUIDs for moves)
                            setColumns(prevColumns => {
                                // First pass: collect entries being removed (preserving original format)
                                const entriesToMove = [];
                                clipboard.sourcePositions.forEach(pos => {
                                    const sourceCol = prevColumns.find(c => c.id === pos.columnId);
                                    if (sourceCol && sourceCol.books[pos.index]) {
                                        entriesToMove.push(sourceCol.books[pos.index]);
                                    }
                                });

                                // v4.16.0.ao - Count how many items are being removed from target column BEFORE pasteIndex
                                const indicesToRemoveFromTarget = clipboard.sourcePositions
                                    .filter(pos => pos.columnId === activeColumnId && pos.index < pasteIndex)
                                    .length;
                                const adjustedPasteIndex = pasteIndex - indicesToRemoveFromTarget;

                                const newColumns = prevColumns.map(col => {
                                    // Build a set of indices to remove for this column
                                    const indicesToRemove = new Set();
                                    clipboard.sourcePositions.forEach(pos => {
                                        if (pos.columnId === col.id) {
                                            indicesToRemove.add(pos.index);
                                        }
                                    });

                                    return {
                                        ...col,
                                        books: col.books.filter((item, idx) => {
                                            if (typeof item === 'object' && item.type === 'divider') return true;
                                            return !indicesToRemove.has(idx);
                                        })
                                    };
                                });
                                // v4.16.0.ao - Add entries at adjusted paste index (before selected book)
                                const targetIdx = newColumns.findIndex(col => col.id === activeColumnId);
                                if (targetIdx !== -1) {
                                    const newBooks = [...newColumns[targetIdx].books];
                                    newBooks.splice(adjustedPasteIndex, 0, ...entriesToMove);
                                    newColumns[targetIdx] = {
                                        ...newColumns[targetIdx],
                                        books: newBooks
                                    };
                                }
                                return newColumns;
                            });
                            console.log(`✂️ Pasted (moved) ${clipboard.bookIds.length} book(s) to ${targetColumn.name}`);
                            // Clear clipboard after cut+paste
                            setClipboard(null);
                            // v4.16.0.g - Clear clipboard message after cut+paste
                            setClipboardMessage(null);
                            // v4.16.0.l - Clear toast state after cut+paste
                            setToastVisible(false);
                            setToastAnimating(false);
                            // v4.16.0.o - Clear footer clipboard visibility
                            setFooterClipboardVisible(false);
                            clearSelection();
                        } else {
                            // Copy: Add to target column (keep source)
                            // v4.16.0.s - Create new GUID-based entries for copied books
                            // v4.16.0.ao - Insert at paste index (before selected book)
                            // v4.16.0.ap - Copy hidden state from source instances
                            // v4.16.0.be - Use isHidden captured at copy time (supports legacy entries)
                            const newEntries = clipboard.sourcePositions.map(pos => ({
                                instanceId: generateInstanceId(),
                                bookId: pos.bookId,
                                sourceIsHidden: pos.isHidden // v4.16.0.be - Use captured hidden state
                            }));

                            // v4.16.0.ap - Copy hidden state for instances that were hidden
                            // v4.16.0.be - Use sourceIsHidden (captured at copy time) instead of checking hiddenInstances
                            const newHiddenInstanceIds = newEntries
                                .filter(entry => entry.sourceIsHidden)
                                .map(entry => entry.instanceId);

                            if (newHiddenInstanceIds.length > 0) {
                                setHiddenInstances(prev => {
                                    const updated = new Set(prev);
                                    newHiddenInstanceIds.forEach(id => updated.add(id));
                                    return updated;
                                });
                            }

                            // Clean entries before storing (remove sourceInstanceId)
                            const cleanEntries = newEntries.map(({ instanceId, bookId }) => ({ instanceId, bookId }));

                            setColumns(prevColumns => {
                                return prevColumns.map(col => {
                                    if (col.id === activeColumnId) {
                                        const newBooks = [...col.books];
                                        newBooks.splice(pasteIndex, 0, ...cleanEntries);
                                        return {
                                            ...col,
                                            books: newBooks
                                        };
                                    }
                                    return col;
                                });
                            });
                            console.log(`📋 Pasted (copied) ${clipboard.bookIds.length} book(s) to ${targetColumn.name}`);
                            // Keep clipboard for copy (can paste again)
                            // v4.16.0.g - Keep message for copy (can paste again)
                        }
                    }

                    // v5.0.0-alpha.46 - DEL key in Explorer: Remove selected books from current folder
                    if (e.key === 'Delete' && viewMode === 'explorer' && explorerSelectedBooks.size > 0) {
                        e.preventDefault();
                        // Can't remove from All Books (view-only) or Inbox
                        if (selectedFolderId === '__all__' || selectedFolderId === '__inbox__') {
                            console.log('🚫 Cannot remove books from All Books or Inbox');
                            return;
                        }
                        const folder = folders.find(f => f.id === selectedFolderId);
                        if (!folder) return;

                        const bookIdsToRemove = [...explorerSelectedBooks];
                        const fromIndices = bookIdsToRemove.map(id => (folder.bookIds || []).indexOf(id));

                        // Remove books from folder
                        setFolders(prev => prev.map(f => {
                            if (f.id === selectedFolderId) {
                                return { ...f, bookIds: (f.bookIds || []).filter(id => !explorerSelectedBooks.has(id)) };
                            }
                            return f;
                        }));

                        // Record for undo
                        recordAction({
                            type: 'REMOVE_BOOKS_FOLDER',
                            folderId: selectedFolderId,
                            bookIds: bookIdsToRemove,
                            fromIndices: fromIndices
                        });

                        console.log(`🗑️ Removed ${bookIdsToRemove.length} book(s) from "${folder.name}"`);
                        setExplorerSelectedBooks(new Set());
                        return; // Don't fall through to column delete
                    }

                    // v4.16.0.bd - DEL key: Delete selected books (with last-copy protection)
                    if (e.key === 'Delete' && selectedBooks.size > 0) {
                        e.preventDefault();
                        const selectedEntries = getSelectedEntries();
                        if (selectedEntries.length === 0) return;

                        // Count total copies of each bookId across ALL columns
                        const bookIdCounts = {};
                        columns.forEach(col => {
                            col.books.forEach(entry => {
                                const bookId = getBookIdFromEntry(entry);
                                if (bookId) {
                                    bookIdCounts[bookId] = (bookIdCounts[bookId] || 0) + 1;
                                }
                            });
                        });

                        // v4.16.0.bd - Count how many of each bookId are selected for deletion
                        const selectedCounts = {};
                        selectedEntries.forEach(sel => {
                            selectedCounts[sel.bookId] = (selectedCounts[sel.bookId] || 0) + 1;
                        });

                        // Categorize selected entries: last-copy vs deletable
                        // v4.16.0.bd - "last copy" = deleting would leave zero copies in library
                        const lastCopyEntries = [];
                        const deletableEntries = [];
                        selectedEntries.forEach(sel => {
                            const remainingAfterDelete = bookIdCounts[sel.bookId] - selectedCounts[sel.bookId];
                            if (remainingAfterDelete === 0) {
                                lastCopyEntries.push(sel);
                            } else {
                                deletableEntries.push(sel);
                            }
                        });

                        // Delete the deletable entries immediately
                        if (deletableEntries.length > 0) {
                            setColumns(prevColumns => {
                                // Build map of columnId -> indices to remove
                                const indicesToRemoveByColumn = {};
                                deletableEntries.forEach(sel => {
                                    if (!indicesToRemoveByColumn[sel.columnId]) {
                                        indicesToRemoveByColumn[sel.columnId] = new Set();
                                    }
                                    indicesToRemoveByColumn[sel.columnId].add(sel.index);
                                });

                                return prevColumns.map(col => {
                                    const indicesToRemove = indicesToRemoveByColumn[col.id];
                                    if (!indicesToRemove) return col;
                                    return {
                                        ...col,
                                        books: col.books.filter((_, idx) => !indicesToRemove.has(idx))
                                    };
                                });
                            });
                            console.log(`🗑️ Deleted ${deletableEntries.length} book(s)`);
                            clearSelection();
                        }

                        // Show dialog for last-copy entries (if any)
                        if (lastCopyEntries.length > 0) {
                            setLastCopyDialogData({
                                lastCopyEntries,
                                deletedCount: deletableEntries.length
                            });
                        }
                    }
                };

                window.addEventListener('keydown', handleKeyDown);
                return () => window.removeEventListener('keydown', handleKeyDown);
            }, [activeColumnId, columns, selectedBooks, clipboard, hiddenInstances, viewMode, explorerSelectedBooks, selectedFolderId, folders]);

            // Initialize activeColumnId to first column when columns are loaded
            useEffect(() => {
                if (columns.length > 0 && !activeColumnId) {
                    setActiveColumnId(columns[0].id);
                }
            }, [columns, activeColumnId]);

            // Close context menu on click
            // v4.16.0.az - Also clear submenu state
            useEffect(() => {
                const handleClick = () => {
                    setContextMenu(null);
                    setContextSubmenu(null);
                };
                if (contextMenu) {
                    window.addEventListener('click', handleClick);
                    return () => window.removeEventListener('click', handleClick);
                }
            }, [contextMenu]);

            // v4.27.0 - Close divider context menu on click
            useEffect(() => {
                const handleClick = () => setDividerContextMenu(null);
                if (dividerContextMenu) {
                    window.addEventListener('click', handleClick);
                    return () => window.removeEventListener('click', handleClick);
                }
            }, [dividerContextMenu]);

            // v3.11.0.d - Close column menu and sort submenu on ESC key
            useEffect(() => {
                const handleEsc = (e) => {
                    if (e.key === 'Escape') {
                        if (sortMenuOpen !== null) {
                            setSortMenuOpen(null);
                        } else if (columnMenuOpen !== null) {
                            setColumnMenuOpen(null);
                        }
                    }
                };
                window.addEventListener('keydown', handleEsc);
                return () => window.removeEventListener('keydown', handleEsc);
            }, [columnMenuOpen, sortMenuOpen]);

            // v3.11.0.d - Close column menu on click outside
            useEffect(() => {
                const handleClickOutside = (e) => {
                    if (columnMenuOpen !== null && columnMenuRef.current && !columnMenuRef.current.contains(e.target)) {
                        setColumnMenuOpen(null);
                        setSortMenuOpen(null);
                    }
                };
                if (columnMenuOpen !== null) {
                    document.addEventListener('mousedown', handleClickOutside);
                    return () => document.removeEventListener('mousedown', handleClickOutside);
                }
            }, [columnMenuOpen]);

            // v5.0.0-alpha.133 - Close folder context menu on Esc key
            useEffect(() => {
                const handleEsc = (e) => {
                    if (e.key === 'Escape' && folderContextMenu) {
                        setFolderContextMenu(null);
                    }
                };
                window.addEventListener('keydown', handleEsc);
                return () => window.removeEventListener('keydown', handleEsc);
            }, [folderContextMenu]);

            // v5.0.0-alpha.141 - Clear clipboard on Esc
            useEffect(() => {
                const handleEsc = (e) => {
                    if (e.key === 'Escape' && folderClipboard.items.length > 0) {
                        setFolderClipboard({ items: [], operation: null });
                        console.log('📋 Clipboard cleared');
                    }
                };
                window.addEventListener('keydown', handleEsc);
                return () => window.removeEventListener('keydown', handleEsc);
            }, [folderClipboard]);

            // v5.0.0-alpha.144 - Handle dialog dragging
            useEffect(() => {
                if (!dialogDrag?.isDragging) return;

                const handleMouseMove = (e) => {
                    setDialogDrag(prev => ({
                        ...prev,
                        dialogX: e.clientX - prev.offsetX,
                        dialogY: e.clientY - prev.offsetY
                    }));
                };

                const handleMouseUp = () => {
                    setDialogDrag(prev => ({ ...prev, isDragging: false }));
                };

                window.addEventListener('mousemove', handleMouseMove);
                window.addEventListener('mouseup', handleMouseUp);
                return () => {
                    window.removeEventListener('mousemove', handleMouseMove);
                    window.removeEventListener('mouseup', handleMouseUp);
                };
            }, [dialogDrag?.isDragging]);

            // v5.0.0-alpha.133 - Close folder context menu on click outside
            useEffect(() => {
                const handleClickOutside = (e) => {
                    if (folderContextMenu && !e.target.closest('.fixed')) {
                        setFolderContextMenu(null);
                    }
                };
                if (folderContextMenu) {
                    document.addEventListener('mousedown', handleClickOutside);
                    return () => document.removeEventListener('mousedown', handleClickOutside);
                }
            }, [folderContextMenu]);

            const saveSettings = (newSettings) => {
                setSettings(newSettings);
                setSettingsOpen(false);
            };

            const importLibrary = async () => {
                // Close the dialog immediately when file picker opens
                setStatusModalOpen(false);

                const input = document.createElement('input');
                input.type = 'file';
                input.accept = '.json';
                input.onchange = async (e) => {
                    const file = e.target.files[0];
                    if (file) {
                        try {
                            const text = await file.text();
                            const parsedData = JSON.parse(text);

                            // v4.0.0.b: Detect backup vs library file
                            let organizationFromFile = null;
                            if (parsedData.isBackup === true) {
                                // Backup file - prompt user before restoring
                                const confirmed = window.confirm(
                                    'Restore backup?\n\nThis will replace your current organization with the organization from the backup file.'
                                );
                                if (!confirmed) {
                                    console.log('📋 Backup restore cancelled by user');
                                    return;
                                }
                                // Extract organization from backup file
                                if (parsedData.organization) {
                                    organizationFromFile = parsedData.organization;
                                    console.log('📋 Restoring organization from backup file');
                                } else {
                                    console.log('⚠️ Backup file has no organization section - will start fresh');
                                }
                            } else {
                                // Library file - keep current organization, ignore any org in file
                                console.log('📋 Loading library file - keeping current organization');
                            }

                            const syncTime = Date.now();
                            setLastSyncTime(syncTime);

                            // Show loading status while waiting
                            setSyncStatus('loading');

                            let timeoutId;
                            let callbackFired = false;

                            // Setup timeout (60 seconds for large libraries)
                            timeoutId = setTimeout(() => {
                                if (!callbackFired) {
                                    console.error('⚠️ Status check timed out after 60 seconds');
                                    setSyncStatus('unknown');
                                    alert('Library loaded but status check timed out. Please refresh the page.');
                                }
                            }, 60000);

                            // Load data with callback (pass organization for backup restore)
                            await loadLibrary(text, () => {
                                callbackFired = true;
                                clearTimeout(timeoutId);
                                // checkManifest removed in v3.6.1 - status updated in loadLibrary
                            }, organizationFromFile);

                            new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/file-imported';
                        } catch (error) {
                            console.error('Failed to sync:', error);
                            setSyncStatus('none'); // Clear loading spinner (v3.9.0.l)
                            if (error && error.message) {
                                console.error('Error details:', error.message, error.stack);
                                alert(`Failed to load library file: ${error.message}`);
                            } else {
                                console.error('Error details: Unknown error (null or no message)');
                                alert('Failed to load library file: Unknown error');
                            }
                        }
                    }
                };
                input.click();
            };

            const openCollectSeriesDialog = () => {
                if (!modalBook || !modalBook.series || !modalColumnId) return;
                
                const currentColumn = columns.find(c => c.id === modalColumnId);
                if (!currentColumn) return;
                
                const allSeriesBooks = books.filter(b => 
                    b.series && b.series === modalBook.series && b.id !== modalBook.id
                );
                
                // v4.16.0.s - Use helper for both legacy and new entry formats
                const inCurrentColumn = allSeriesBooks.filter(b =>
                    columnHasBook(currentColumn.books, b.id)
                );

                const inOtherColumns = allSeriesBooks.filter(b =>
                    !columnHasBook(currentColumn.books, b.id)
                ).map(b => {
                    const col = columns.find(c => columnHasBook(c.books, b.id));
                    return { ...b, columnName: col?.name || 'Unknown' };
                });
                
                const sortByPosition = (a, b) => {
                    const posA = parseInt(a.seriesPosition) || 999;
                    const posB = parseInt(b.seriesPosition) || 999;
                    return posA - posB;
                };
                
                inCurrentColumn.sort(sortByPosition);
                inOtherColumns.sort(sortByPosition);
                
                setSeriesBooks({
                    current: inCurrentColumn,
                    other: inOtherColumns
                });
                
                setCollectSeriesOpen(true);
            };

            const collectSeriesBooks = (includeAllColumns) => {
                if (!modalBook || !modalColumnId) return;
                
                const targetColumn = columns.find(c => c.id === modalColumnId);
                if (!targetColumn) return;
                
                const booksToCollect = includeAllColumns 
                    ? [...seriesBooks.current, ...seriesBooks.other]
                    : seriesBooks.current;
                
                if (booksToCollect.length === 0) {
                    setCollectSeriesOpen(false);
                    return;
                }
                
                const allBooksInSeries = [modalBook, ...booksToCollect].sort((a, b) => {
                    const posA = parseInt(a.seriesPosition) || 999;
                    const posB = parseInt(b.seriesPosition) || 999;
                    return posA - posB;
                });
                
                // v4.16.0.s - Use helper for index lookup with both entry formats
                const currentBookIndexInTarget = findBookIndexInColumn(targetColumn.books, modalBook.id);

                const newColumns = columns.map(col => {
                    if (col.id === modalColumnId) {
                        // v4.16.0.s - Filter using helper, create new GUID entries
                        let newBooks = col.books.filter(entry => {
                            const entryBookId = getBookIdFromEntry(entry);
                            return !allBooksInSeries.find(b => b.id === entryBookId);
                        });

                        const insertIndex = Math.min(currentBookIndexInTarget, newBooks.length);
                        // v4.16.0.s - Create new GUID entries for collected series books
                        const newEntries = allBooksInSeries.map(b => ({
                            instanceId: generateInstanceId(),
                            bookId: b.id
                        }));
                        newBooks.splice(insertIndex, 0, ...newEntries);

                        return { ...col, books: newBooks };
                    } else if (includeAllColumns) {
                        return {
                            ...col,
                            // v4.16.0.s - Filter using helper
                            books: col.books.filter(entry => {
                                const entryBookId = getBookIdFromEntry(entry);
                                return !allBooksInSeries.find(b => b.id === entryBookId);
                            })
                        };
                    }
                    return col;
                });
                
                setColumns(newColumns);
                setCollectSeriesOpen(false);
            };

            const renderStars = (rating) => {
                const fullStars = Math.floor(rating);
                const hasHalfStar = rating % 1 >= 0.5;
                const emptyStars = 5 - fullStars - (hasHalfStar ? 1 : 0);
                
                return (
                    <span className="text-yellow-500 text-2xl">
                        {'★'.repeat(fullStars)}
                        {hasHalfStar && '½'}
                        {'☆'.repeat(emptyStars)}
                    </span>
                );
            };

            // Schema v2.0: Export unified file with organization
            const exportLibrary = async () => {
                try {
                    const allBooks = await loadBooksFromIndexedDB();

                    // Convert app book format back to fetcher format for books.items
                    // v4.18.0.a - Export uses onWishlist + ownershipType (new format)
                    // v4.18.0.d - Export includes price data, genres, targetPrice (user metadata)
                    const bookItems = allBooks.map(book => ({
                        asin: book.asin,
                        onWishlist: book.onWishlist || false,
                        ownershipType: book.ownershipType || 'purchased',
                        isHidden: book.isHidden || false,
                        addedToWishlist: book.addedToWishlist || '',
                        title: book.title,
                        authors: book.author,
                        coverUrl: book.coverUrl,
                        rating: book.rating,
                        reviewCount: book.ratingCount,
                        series: book.series,
                        seriesPosition: book.seriesPosition,
                        acquisitionDate: book.acquired,
                        description: book.description,
                        topReviews: book.topReviews,
                        binding: book.binding,
                        // v4.18.0.d - Price data and user metadata
                        currentPrice: book.currentPrice,
                        listPrice: book.listPrice,
                        priceAsOf: book.priceAsOf,
                        targetPrice: book.targetPrice,
                        genres: book.genres,
                        genresAsOf: book.genresAsOf
                    }));

                    // Build collections.items from books that have collection data
                    const collectionItems = allBooks
                        .filter(book => book.collections || book.readStatus)
                        .map(book => ({
                            asin: book.asin,
                            readStatus: book.readStatus || 'UNKNOWN',
                            collections: book.collections || []
                        }));

                    // v4.0.0.b: Build v2.x backup format with isBackup flag
                    // v4.15.1.b: Only include collections section if we have real collections data
                    const hasRealCollections = collectionsStatus.loadStatus !== 'empty' && collectionsStatus.loadDate;
                    const exportData = {
                        schemaVersion: "2.3",
                        isBackup: true,
                        books: {
                            fetchDate: libraryStatus.loadDate || new Date().toISOString(),
                            fetcherVersion: "app-export",
                            totalBooks: bookItems.length,
                            items: bookItems
                        },
                        organization: {
                            columns: columns.map(col => ({
                                id: col.id,
                                name: col.name,
                                items: col.books  // Array of book IDs and divider IDs
                            })),
                            columnOrder: columns.map(col => col.id),
                            blankImageBooks: Array.from(blankImageBooks),
                            // v5.0.0-alpha.99 - Include folder organization for Explorer view
                            folders: folders.map(folder => ({
                                id: folder.id,
                                name: folder.name,
                                bookIds: folder.bookIds || [],
                                parentId: folder.parentId,
                                collapsed: folder.collapsed,
                                childFolderIds: folder.childFolderIds
                            })),
                            // v5.0.0-alpha.101 - Include Explorer view settings
                            explorerSettings: {
                                viewMode,
                                folderSortSettings,
                                explorerView,
                                explorerCoverCols,
                                leftPaneWidth,
                                visibleColumns, // v5.0.0-alpha.109
                                columnWidths // v5.0.0-alpha.109
                            },
                            exportDate: new Date().toISOString(),
                            appVersion: ORGANIZER_VERSION
                        }
                    };

                    // v4.15.1.b: Only add collections section if we have real data (fix 0-A bug)
                    if (hasRealCollections) {
                        exportData.collections = {
                            fetchDate: collectionsStatus.loadDate,
                            fetcherVersion: "app-export",
                            totalBooksScanned: collectionItems.length,
                            booksWithCollections: collectionItems.filter(b => b.collections.length > 0).length,
                            items: collectionItems
                        };
                    }

                    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    // v4.15.7: Backup filename with local date and time (fixes UTC date bug after 6pm)
                    const now = new Date();
                    const dateStr = `${now.getFullYear()}-${String(now.getMonth()+1).padStart(2,'0')}-${String(now.getDate()).padStart(2,'0')} ${String(now.getHours()).padStart(2,'0')}.${String(now.getMinutes()).padStart(2,'0')}`;
                    a.download = `readerwrangler-backup-${dateStr}.json`;
                    a.click();
                    URL.revokeObjectURL(url);
                    console.log('✅ Backup exported (v2.0 format with organization)');
                    new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/file-exported';
                } catch (error) {
                    console.error('Failed to export library:', error);
                    alert('Failed to export library');
                }
            };

            const clearLibrary = () => {
                setResetConfirmOpen(true);
            };

            const confirmReset = async () => {
                setResetConfirmOpen(false);
                try {
                    await clearIndexedDB();
                    localStorage.removeItem(STORAGE_KEY);
                    localStorage.removeItem(CACHE_KEY);
                    localStorage.removeItem(STATUS_KEY); // v3.7.0.n - clear saved status
                    localStorage.removeItem(FILTERS_KEY); // v3.8.0.h - clear saved filters
                    localStorage.removeItem(EXPLORER_KEY); // v5.0.0-alpha.99 - clear Explorer view settings
                    localStorage.removeItem(FOLDERS_KEY); // v5.0.0-alpha.99 - clear folder organization

                    // Reset all filters (v3.8.0.h, updated v3.8.0.k, v4.1.0.d)
                    setSearchTerm('');
                    setReadStatusFilter('');
                    setCollectionFilter('');
                    setRatingFilter('');
                    setWishlistFilter('');
                    setSeriesFilter('');
                    setDateFrom('');
                    setDateTo('');
                    setShowHidden(true); // v4.8.0 - Default to showing all books on reset

                    setBooks([]);
                    setColumns([{ id: 'unorganized', name: 'Unorganized', books: [] }]);
                    setDataSource('none');
                    setBlankImageBooks(new Set());
                    setLastSyncTime(null);
                    setSyncStatus('none');
                    // Reset v3.9.0 status bar state (Load-state-only)
                    setLibraryStatus({
                        loadStatus: 'empty',
                        loadDate: null
                    });
                    setCollectionsStatus({
                        loadStatus: 'empty',
                        loadDate: null
                    });

                    // v5.0.0-alpha.99 - Reset Explorer view state (folders and view settings)
                    setFolders([{ id: '__inbox__', name: 'Inbox', bookIds: [], parentId: null }]);
                    setSelectedFolderId('__all__');
                    setExplorerSort({ column: 'dateAdded', direction: 'desc' });
                    setFolderSortSettings({}); // v5.0.0-alpha.100 - Clear per-folder sort settings
                    setExplorerView('list');
                    setViewMode('columns'); // Reset to Columns view

                    console.log('✅ Cleared library - app reset to initial state');
                    new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/app-reset';
                } catch (error) {
                    console.error('Failed to clear library:', error);
                    alert('Failed to clear library data');
                }
            };

            const handleFileUpload = async (e) => {
                const file = e.target.files[0];
                if (!file) return;
                
                const text = await file.text();
                
                if (file.name.endsWith('.json')) {
                    await loadLibrary(text);
                } else if (file.name.endsWith('.csv')) {
                    loadBooksFromCSV(text);
                }
                new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/file-imported';
            };

            const loadBooksFromCSV = (csvContent) => {
                const lines = csvContent.split('\n');
                const parsedBooks = [];
                
                const startLine = lines[0].includes('ASIN') ? 1 : 0;
                
                for (let i = startLine; i < lines.length && parsedBooks.length < 100; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const parts = line.split(',');
                    let asin = parts[0]?.trim().replace(/[="']/g, '');
                    
                    if (asin && asin.length < 10 && /^[0-9]+$/.test(asin)) {
                        asin = asin.padStart(10, '0');
                    }
                    
                    if (asin && asin.length === 10) {
                        parsedBooks.push({
                            id: asin,  // Use ASIN as stable ID instead of sequential number
                            asin: asin,
                            title: parts[6] || 'Unknown',
                            author: parts[13] || 'Unknown',
                            acquired: parts[2] || '',
                            series: parts[12] || '',
                            coverUrl: `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`,
                            hasEnrichedData: false
                        });
                    }
                }
                
                setBooks(parsedBooks);
                setColumns([{ id: 'unorganized', name: 'Unorganized', books: parsedBooks.map(b => b.id) }]);
                setDataSource('csv');
            };

            const mergeCollectionsIntoBooks = async (booksToMerge) => {
                // Only use collections data if user has loaded it via File Picker (v3.9.0)
                const collections = collectionsData;
                if (!collections) {
                    console.log('No collections data available to merge');
                    return booksToMerge;
                }

                // Merge collections into each book
                const mergedBooks = booksToMerge.map(book => {
                    const bookCollections = collections.get(book.asin) || { readStatus: 'UNKNOWN', collections: [] };
                    return {
                        ...book,
                        readStatus: bookCollections.readStatus,
                        collections: bookCollections.collections
                    };
                });

                // Log results
                const booksWithCollections = mergedBooks.filter(b => b.collections.length > 0).length;
                const readBooks = mergedBooks.filter(b => b.readStatus === 'READ').length;
                const unreadBooks = mergedBooks.filter(b => b.readStatus === 'UNREAD').length;
                console.log(`📚 Collections data merged:`);
                console.log(`   - ${booksWithCollections} books have collections`);
                console.log(`   - ${readBooks} READ, ${unreadBooks} UNREAD, ${mergedBooks.length - readBooks - unreadBooks} UNKNOWN`);

                return mergedBooks;
            };

            const loadLibrary = async (content, onComplete = null, organizationFromFile = null) => {
                const parsedData = JSON.parse(content);

                // Check if user selected legacy collections file (v3.9.0.k)
                if (parsedData.type === 'collections') {
                    console.error('❌ Wrong file type selected');
                    console.error('   You selected an old Collections file');
                    console.error('   Please select amazon-library.json instead');
                    throw new Error('You selected an old Collections file. Please select amazon-library.json instead.');
                }

                let data;           // Array of book items
                let metadata;       // Books metadata (fetchDate, fetcherVersion, etc.)
                let collections;    // Collections map (ASIN -> {readStatus, collections})

                // Schema v2.x - unified format with books.items and collections.items
                if (parsedData.schemaVersion?.startsWith('2.')) {
                    if (!parsedData.books || !parsedData.books.items) {
                        console.error('❌ Invalid v2.x library format');
                        console.error('   Expected: {schemaVersion: "2.x", books: {items: [...]}}');
                        console.error('   Received:', Object.keys(parsedData));
                        throw new Error('Invalid v2.x library format - please re-fetch your library using the latest fetcher');
                    }

                    data = parsedData.books.items;
                    metadata = {
                        schemaVersion: parsedData.schemaVersion,
                        fetchDate: parsedData.books.fetchDate,
                        fetcherVersion: parsedData.books.fetcherVersion,
                        totalBooks: parsedData.books.totalBooks || data.length
                    };

                    console.log(`📋 Loaded schema ${parsedData.schemaVersion} unified file`);
                    console.log(`   Total books: ${metadata.totalBooks}`);
                    console.log(`   Fetched: ${new Date(metadata.fetchDate).toLocaleString()}`);
                    console.log(`   Fetcher version: ${metadata.fetcherVersion}`);

                    // Extract embedded collections from v2.0 file
                    if (parsedData.collections && parsedData.collections.items) {
                        collections = new Map();
                        parsedData.collections.items.forEach(book => {
                            collections.set(book.asin, {
                                readStatus: book.readStatus,
                                collections: book.collections || []
                            });
                        });
                        console.log(`📚 Loaded embedded collections for ${collections.size} books`);
                        console.log(`   Collections fetched: ${new Date(parsedData.collections.fetchDate).toLocaleString()}`);

                        // Update collections status
                        const collectionsLoadStatus = parsedData.collections.fetchDate ? calculateFreshness(parsedData.collections.fetchDate) : 'unknown';
                        setCollectionsStatus({
                            loadStatus: collectionsLoadStatus,
                            loadDate: parsedData.collections.fetchDate || null
                        });
                        setCollectionsData(collections);
                    } else {
                        console.log('📚 No collections data in file (run Collections Fetcher to add)');
                        collections = null;
                        // Reset collections status when no collections in file (v4.15.1 - bug fix 0-A)
                        setCollectionsStatus({
                            loadStatus: 'empty',
                            loadDate: null
                        });
                    }
                }
                // Legacy v1.x format - object with metadata and books array
                else if (parsedData.metadata && parsedData.books) {
                    data = parsedData.books;
                    metadata = parsedData.metadata;

                    console.log(`📋 Loaded legacy schema ${metadata.schemaVersion}`);
                    console.log(`   Total books: ${metadata.totalBooks}`);
                    console.log(`   Fetched: ${new Date(metadata.fetchDate).toLocaleString()}`);
                    console.log(`   Fetcher version: ${metadata.fetcherVersion}`);
                    console.log(`   ⚠️  Note: Re-run fetchers to upgrade to v2.0 format`);

                    // Legacy format - collections loaded separately (use existing collectionsData state)
                    collections = collectionsData || null;
                }
                else {
                    console.error('❌ Invalid library JSON format');
                    console.error('   Expected: v2.0 unified or legacy {metadata, books}');
                    console.error('   Received:', Object.keys(parsedData));
                    throw new Error('Invalid library JSON format - please re-fetch your library using the latest fetcher');
                }

                // Update library status from loaded JSON metadata
                const loadStatus = metadata.fetchDate ? calculateFreshness(metadata.fetchDate) : 'unknown';

                setLibraryStatus({
                    loadStatus,
                    loadDate: metadata.fetchDate || null
                });

                const extractDescription = (descData) => {
                    if (!descData?.sections?.[0]?.content) return '';
                    
                    const content = descData.sections[0].content;
                    
                    if (content.text) return content.text;
                    
                    if (content.fragments) {
                        const texts = [];
                        content.fragments.forEach(frag => {
                            if (frag.text) {
                                texts.push(frag.text);
                            } else if (frag.semanticContent?.content?.text) {
                                texts.push(frag.semanticContent.content.text);
                            } else if (frag.semanticContent?.content?.fragments) {
                                frag.semanticContent.content.fragments.forEach(subfrag => {
                                    if (subfrag.text) texts.push(subfrag.text);
                                    if (subfrag.semanticContent?.content?.text) {
                                        texts.push(subfrag.semanticContent.content.text);
                                    }
                                });
                            }
                        });
                        return texts.join(' ').trim();
                    }
                    
                    return '';
                };
                
                const processedBooks = data.map((item) => {
                    const isNewFormat = !item.amazonData;

                    // Get collections data for this book (if available)
                    const bookCollections = collections?.get(item.asin) || { readStatus: 'UNKNOWN', collections: [] };

                    if (isNewFormat) {
                        // v4.18.0.a - Use normalizeBook to handle legacy isOwned/isWishlist fields
                        const normalized = normalizeBook(item);
                        return {
                            id: item.asin,  // Use ASIN as stable ID instead of sequential number
                            asin: item.asin,
                            title: item.title || 'Unknown',
                            author: item.authors || 'Unknown',
                            acquired: item.acquisitionDate || '',
                            series: item.series || '',
                            seriesPosition: item.seriesPosition || '',
                            seriesTotal: '',
                            rating: item.rating || 0,
                            ratingCount: item.reviewCount || '',
                            description: item.description || '',
                            topReviews: item.topReviews || [],
                            binding: item.binding || 'Kindle eBook',
                            coverUrl: item.coverUrl,
                            publicationDate: item.publicationDate || '',
                            hasEnrichedData: true,
                            store: "Amazon",
                            // v4.18.0.a - onWishlist replaces isWishlist (normalized handles legacy)
                            onWishlist: normalized.onWishlist,
                            isHidden: item.isHidden || false,
                            addedToWishlist: item.addedToWishlist || '',
                            // Ownership type (v4.9.0, v4.18.0.a - normalized handles 'wishlist' type)
                            ownershipType: normalized.ownershipType,
                            // Collections data
                            readStatus: bookCollections.readStatus,
                            collections: bookCollections.collections,
                            // Price data (v4.17.0.a, v4.18.0.a - parse string prices to numbers)
                            currentPrice: parsePrice(item.currentPrice),
                            listPrice: parsePrice(item.listPrice),
                            priceFetchedAt: item.priceFetchedAt || null,
                            priceTrigger: item.priceTrigger ?? null,
                            // Genre data (v4.17.0.a)
                            genres: item.genres || []
                        };
                    } else {
                        // Legacy format with amazonData (v1.x format)
                        const amazonData = item.amazonData?.data?.getProduct;
                        const imageData = amazonData?.images?.images?.[0]?.hiRes;

                        let asin = item.asin;
                        if (asin && asin.length < 10 && /^[0-9]+$/.test(asin)) {
                            asin = asin.padStart(10, '0');
                        }

                        let coverUrl = `https://images-na.ssl-images-amazon.com/images/P/${asin}.01.LZZZZZZZ.jpg`;
                        if (imageData?.physicalId) {
                            coverUrl = `https://images-na.ssl-images-amazon.com/images/I/${imageData.physicalId}.${imageData.extension}`;
                        }

                        // v4.18.0.a - Use normalizeBook to handle legacy isOwned/isWishlist fields
                        const normalized = normalizeBook(item);

                        return {
                            id: asin,  // Use ASIN as stable ID instead of sequential number
                            asin: asin,
                            title: amazonData?.title?.displayString || item.title || 'Unknown',
                            author: amazonData?.byLine?.contributors?.[0]?.contributor?.author?.profile?.displayName || item.author || 'Unknown',
                            acquired: amazonData?.pastPurchase?.purchaseHistory?.lastOrderDate || item.acquired || '',
                            series: amazonData?.bookSeries?.singleBookView?.series?.title || '',
                            seriesPosition: amazonData?.bookSeries?.singleBookView?.series?.position || '',
                            seriesTotal: amazonData?.bookSeries?.singleBookView?.series?.numberOfBooks || '',
                            rating: amazonData?.customerReviewsSummary?.rating?.value || 0,
                            ratingCount: amazonData?.customerReviewsSummary?.count?.displayString || '',
                            description: extractDescription(amazonData?.description),
                            topReviews: amazonData?.customerReviewsTop?.reviews || [],
                            binding: amazonData?.bindingInformation?.binding?.displayString || 'Kindle eBook',
                            coverUrl: coverUrl,
                            publicationDate: '', // Legacy format doesn't have publication date
                            hasEnrichedData: true,
                            store: "Amazon",
                            // v4.18.0.a - onWishlist replaces isWishlist (normalized handles legacy)
                            onWishlist: normalized.onWishlist,
                            isHidden: item.isHidden || false,
                            addedToWishlist: item.addedToWishlist || '',
                            // Ownership type (v4.9.0, v4.18.0.a - normalized handles 'wishlist' type)
                            ownershipType: normalized.ownershipType,
                            // Collections data
                            readStatus: bookCollections.readStatus,
                            collections: bookCollections.collections,
                            // Price data (v4.17.0.a, v4.18.0.a - parse string prices to numbers)
                            currentPrice: parsePrice(item.currentPrice),
                            listPrice: parsePrice(item.listPrice),
                            priceFetchedAt: item.priceFetchedAt || null,
                            priceTrigger: item.priceTrigger ?? null,
                            // Genre data (v4.17.0.a)
                            genres: item.genres || []
                        };
                    }
                });

                // Sort books by acquisition date (newest first) to maintain original order
                try {
                    processedBooks.sort((a, b) => {
                        // Handle missing dates - put them at the end
                        if (!a.acquired && !b.acquired) return 0;
                        if (!a.acquired) return 1;
                        if (!b.acquired) return -1;

                        // Parse dates safely
                        const dateA = new Date(a.acquired);
                        const dateB = new Date(b.acquired);

                        // Handle invalid dates
                        const isValidA = !isNaN(dateA.getTime());
                        const isValidB = !isNaN(dateB.getTime());

                        if (!isValidA && !isValidB) return 0;
                        if (!isValidA) return 1;
                        if (!isValidB) return -1;

                        // Compare dates (descending - newest first)
                        return dateB - dateA;
                    });
                    console.log('✅ Books sorted by acquisition date (newest first)');
                } catch (error) {
                    console.error('❌ Sort failed:', error);
                    console.error('Error details:', error.message, error.stack);
                    // Continue without sorting if sort fails
                }

                // Log collections merge results
                if (collections) {
                    const booksWithCollections = processedBooks.filter(b => b.collections.length > 0).length;
                    const readBooks = processedBooks.filter(b => b.readStatus === 'READ').length;
                    const unreadBooks = processedBooks.filter(b => b.readStatus === 'UNREAD').length;
                    console.log(`📚 Collections data merged:`);
                    console.log(`   - ${booksWithCollections} books have collections`);
                    console.log(`   - ${readBooks} READ, ${unreadBooks} UNREAD, ${processedBooks.length - readBooks - unreadBooks} UNKNOWN`);
                }

                // Save to IndexedDB (returns merged books including preserved orphan wishlists)
                const mergedBooks = await saveBooksToIndexedDB(processedBooks);
                setBooks(mergedBooks);

                // v5.0.0-alpha.126: When restoring backup, trigger download of amazon-library.json
                // This ensures future fetcher runs can update all books (fixes orphaned wishlist data hole)
                if (organizationFromFile !== null) {
                    // Build amazon-library.json format from restored books
                    const libraryData = {
                        schemaVersion: "2.3",
                        books: {
                            fetchDate: metadata.fetchDate || new Date().toISOString(),
                            fetcherVersion: metadata.fetcherVersion || "backup-restore",
                            totalBooks: mergedBooks.length,
                            items: mergedBooks.map(book => ({
                                asin: book.asin,
                                onWishlist: book.onWishlist || false,
                                ownershipType: book.ownershipType || 'purchased',
                                isHidden: book.isHidden || false,
                                addedToWishlist: book.addedToWishlist || '',
                                title: book.title,
                                authors: book.author,
                                coverUrl: book.coverUrl,
                                rating: book.rating,
                                reviewCount: book.ratingCount,
                                series: book.series,
                                seriesPosition: book.seriesPosition,
                                acquisitionDate: book.acquired,
                                description: book.description,
                                topReviews: book.topReviews,
                                binding: book.binding,
                                currentPrice: book.currentPrice,
                                listPrice: book.listPrice,
                                priceFetchedAt: book.priceFetchedAt,
                                targetPrice: book.targetPrice,
                                priceTrigger: book.priceTrigger,
                                genres: book.genres
                            }))
                        }
                    };

                    // Add collections if available
                    if (collections && collections.size > 0) {
                        const collectionItems = mergedBooks
                            .filter(book => book.collections || book.readStatus)
                            .map(book => ({
                                asin: book.asin,
                                readStatus: book.readStatus || 'UNKNOWN',
                                collections: book.collections || []
                            }));

                        libraryData.collections = {
                            fetchDate: parsedData.collections?.fetchDate || new Date().toISOString(),
                            fetcherVersion: parsedData.collections?.fetcherVersion || "backup-restore",
                            totalBooksScanned: collectionItems.length,
                            booksWithCollections: collectionItems.filter(b => b.collections.length > 0).length,
                            items: collectionItems
                        };
                    }

                    // Show GUI notification FIRST (before file picker appears) - v5.0.0-alpha.130
                    await showInfoDialog(
                        '✅ Backup Restored!',
                        `📥 Library file regenerated (${mergedBooks.length} books)\n\n` +
                        `⚠️ IMPORTANT: Replace your existing amazon-library.json file\n\n` +
                        `When the save dialog appears:\n` +
                        `   • Navigate to where you keep amazon-library.json\n` +
                        `   • If browser suggests "amazon-library (1).json",\n` +
                        `     change it back to "amazon-library.json"\n` +
                        `   • Save to replace the existing file\n\n` +
                        `💡 Why this matters:\n\n` +
                        `This regenerated file contains ALL your books (owned + wishlist). ` +
                        `Using it for future Library Fetcher runs ensures ALL your books get updated, ` +
                        `preventing stale data for wishlist items.`
                    );

                    // Trigger download AFTER user acknowledges
                    const blob = new Blob([JSON.stringify(libraryData, null, 2)], { type: 'application/json' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = 'amazon-library.json';
                    a.click();
                    URL.revokeObjectURL(url);

                    // Show helpful guidance (console backup)
                    console.log('\n========================================');
                    console.log('📥 LIBRARY FILE REGENERATED');
                    console.log('========================================');
                    console.log(`   ✅ amazon-library.json (${mergedBooks.length} books)`);
                    console.log('');
                    console.log('👉 Next steps:');
                    console.log('   1. Find amazon-library.json in your Downloads folder');
                    console.log('   2. Keep it somewhere you can find it (Desktop, Documents, etc.)');
                    console.log('   3. Use this file for future Library Fetcher runs');
                    console.log('');
                    console.log('💡 Why this file matters:');
                    console.log('   - Ensures future fetcher runs update ALL your books');
                    console.log('   - Includes wishlist books that may not be in fresh fetches');
                    console.log('   - Prevents stale price data for orphaned wishlist items');
                    console.log('========================================\n');
                }

                // Reset all filters when loading new library (v3.8.0.g, updated v3.8.0.k)
                setSearchTerm('');
                setReadStatusFilter('');
                setCollectionFilter('');
                setRatingFilter('');
                setWishlistFilter('');
                setOwnershipFilter('');
                setSeriesFilter('');
                setDateFrom('');
                setDateTo('');
                setShowHidden(true); // v4.8.0 - Default to showing all books on load
                localStorage.setItem(FILTERS_KEY, JSON.stringify({
                    searchTerm: '',
                    readStatusFilter: '',
                    collectionFilter: '',
                    ratingFilter: '',
                    wishlistFilter: '',
                    ownershipFilter: '',
                    seriesFilter: '',
                    dateFrom: '',
                    dateTo: '',
                    showHidden: true // v4.8.0 - Default to showing all books
                }));
                console.log('🔍 Filters cleared for new library');

                // v4.0.0.b: Check organization source - backup file takes priority, then localStorage
                let orgToRestore = null;
                let orgSource = null;

                if (organizationFromFile) {
                    // Backup restore - use organization from file
                    orgToRestore = organizationFromFile;
                    orgSource = 'backup file';
                } else {
                    // Library file - try to restore from localStorage
                    try {
                        const saved = localStorage.getItem(STORAGE_KEY);
                        if (saved) {
                            const state = JSON.parse(saved);
                            if (state.organization?.columns) {
                                orgToRestore = state.organization;
                                orgSource = 'localStorage';
                            }
                        }
                    } catch (e) {
                        console.log('Note: Could not read localStorage organization');
                    }
                }

                if (orgToRestore?.columns) {
                    const restoredColumns = orgToRestore.columns.map(col => ({
                        id: col.id,
                        name: col.name,
                        books: col.bookIds || col.books || col.items || []  // v4.0.0.c: support items from backup export
                    }));

                    // v4.0.0.d: Find new books not in any column and add to Unorganized
                    const allColumnBookIds = new Set(restoredColumns.flatMap(col => col.books));
                    const allLibraryBookIds = processedBooks.map(b => b.id);
                    const orphanedBooks = allLibraryBookIds.filter(id => !allColumnBookIds.has(id));

                    if (orphanedBooks.length > 0) {
                        // Find or create Unorganized column
                        let unorganizedCol = restoredColumns.find(col => col.id === 'unorganized');
                        if (unorganizedCol) {
                            // Prepend new books to Unorganized (newest first)
                            unorganizedCol.books = [...orphanedBooks, ...unorganizedCol.books];
                        } else {
                            // Create Unorganized column with orphaned books
                            restoredColumns.unshift({ id: 'unorganized', name: 'Unorganized', books: orphanedBooks });
                        }
                        console.log(`📚 Added ${orphanedBooks.length} new book${orphanedBooks.length === 1 ? '' : 's'} to Unorganized`);
                    }

                    setColumns(restoredColumns);
                    setBlankImageBooks(new Set(orgToRestore.blankImageBooks || []));

                    // v5.0.0-alpha.99 - Restore folders from backup (if present)
                    if (orgToRestore.folders && Array.isArray(orgToRestore.folders)) {
                        const restoredFolders = orgToRestore.folders.map(folder => ({
                            id: folder.id,
                            name: folder.name,
                            bookIds: folder.bookIds || [],
                            parentId: folder.parentId,
                            collapsed: folder.collapsed,
                            childFolderIds: folder.childFolderIds
                        }));

                        // Ensure Inbox exists (for backward compatibility with old backups)
                        const hasInbox = restoredFolders.some(f => f.id === '__inbox__');
                        if (!hasInbox) {
                            restoredFolders.push({
                                id: '__inbox__',
                                name: 'Inbox',
                                bookIds: [],
                                parentId: null
                            });
                        }

                        setFolders(restoredFolders);
                        localStorage.setItem(FOLDERS_KEY, JSON.stringify(restoredFolders));
                        console.log(`✅ Restored ${restoredFolders.length} folders from ${orgSource}`);
                    } else {
                        // No folders in backup - preserve existing folders from localStorage (backward compatibility)
                        console.log('📁 No folders in backup - keeping existing folder structure');
                    }

                    // v5.0.0-alpha.101 - Restore Explorer settings from backup (if present)
                    if (orgToRestore.explorerSettings) {
                        const settings = orgToRestore.explorerSettings;
                        if (settings.viewMode) setViewMode(settings.viewMode);
                        if (settings.folderSortSettings) setFolderSortSettings(settings.folderSortSettings);
                        if (settings.explorerView) setExplorerView(settings.explorerView);
                        if (settings.explorerCoverCols) setExplorerCoverCols(settings.explorerCoverCols);
                        if (settings.leftPaneWidth) setLeftPaneWidth(settings.leftPaneWidth);
                        if (settings.visibleColumns) setVisibleColumns(settings.visibleColumns); // v5.0.0-alpha.109
                        if (settings.columnWidths) setColumnWidths(settings.columnWidths); // v5.0.0-alpha.109
                        console.log('✅ Restored Explorer view settings from backup');
                    } else {
                        // No explorer settings in backup - preserve existing from localStorage (backward compatibility)
                        console.log('📁 No explorer settings in backup - keeping existing preferences');
                    }

                    console.log(`✅ Restored organization from ${orgSource}`);
                    setDataSource('enriched');
                    setLastSyncTime(Date.now());
                    setSyncStatus('fresh');
                    if (onComplete) setTimeout(() => onComplete(metadata.totalBooks), 0);
                    return;
                }

                // No organization found, start fresh
                setColumns([{ id: 'unorganized', name: 'Unorganized', books: processedBooks.map(b => b.id) }]);
                setDataSource('enriched');
                setLastSyncTime(Date.now());
                setSyncStatus('fresh');
                if (onComplete) setTimeout(() => onComplete(metadata.totalBooks), 0);
            };

            const addColumn = () => {
                const newId = `col-${Date.now()}`;
                setColumns([...columns, { id: newId, name: 'New Column', books: [] }]);
                // Set this column to edit mode immediately
                setTimeout(() => setEditingColumn(newId), 0);
                new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/column-created';
            };

            // v4.12.0 - Insert column before or after a reference column
            const insertColumn = (referenceColumnId, position) => {
                const newId = `col-${Date.now()}`;
                const newColumn = { id: newId, name: 'New Column', books: [] };
                const refIndex = columns.findIndex(c => c.id === referenceColumnId);
                if (refIndex === -1) return;

                const insertIndex = position === 'before' ? refIndex : refIndex + 1;
                const newColumns = [...columns];
                newColumns.splice(insertIndex, 0, newColumn);
                setColumns(newColumns);

                // Set this column to edit mode immediately
                setTimeout(() => setEditingColumn(newId), 0);
                new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/column-created';
            };

            const startEditingColumn = (columnId, currentName) => {
                setEditingColumn(columnId);
                setEditingName(currentName);
            };

            const finishEditingColumn = (columnId) => {
                if (editingName.trim()) {
                    setColumns(columns.map(col => 
                        col.id === columnId ? { ...col, name: editingName.trim() } : col
                    ));
                }
                setEditingColumn(null);
                setEditingName('');
            };

            const sortColumn = (columnId, sortType) => {
                // Check for publication date availability when sorting by published
                if (sortType === 'published-desc' || sortType === 'published-asc') {
                    const column = columns.find(c => c.id === columnId);
                    if (column) {
                        const columnBooks = column.books.map(id => books.find(b => b.id === id)).filter(Boolean);
                        const booksWithPubDate = columnBooks.filter(b => b.publicationDate);
                        if (booksWithPubDate.length === 0) {
                            alert('No publication dates found in this column.\n\nTo add publication dates:\n1. Re-run the Library Fetcher on Amazon\n2. Import the updated library file\n\nYour organization will be preserved - only metadata is updated.');
                            return;
                        }
                    }
                }

                setColumns(columns.map(col => {
                    if (col.id !== columnId) return col;

                    const sortedBookIds = [...col.books].sort((aId, bId) => {
                        const a = books.find(b => b.id === aId);
                        const b = books.find(b => b.id === bId);
                        if (!a || !b) return 0;
                        
                        switch(sortType) {
                            case 'title-asc':
                                return a.title.localeCompare(b.title);
                            case 'title-desc':
                                return b.title.localeCompare(a.title);
                            case 'author-asc':
                                return a.author.localeCompare(b.author);
                            case 'author-desc':
                                return b.author.localeCompare(a.author);
                            case 'rating-desc':
                                return (b.rating || 0) - (a.rating || 0);
                            case 'rating-asc':
                                return (a.rating || 0) - (b.rating || 0);
                            case 'acquired-desc':
                                return (b.acquired || '').localeCompare(a.acquired || '');
                            case 'acquired-asc':
                                return (a.acquired || '').localeCompare(b.acquired || '');
                            case 'published-desc':
                                // Books without publication date go to end
                                if (!a.publicationDate && !b.publicationDate) return 0;
                                if (!a.publicationDate) return 1;
                                if (!b.publicationDate) return -1;
                                return b.publicationDate.localeCompare(a.publicationDate);
                            case 'published-asc':
                                // Books without publication date go to end
                                if (!a.publicationDate && !b.publicationDate) return 0;
                                if (!a.publicationDate) return 1;
                                if (!b.publicationDate) return -1;
                                return a.publicationDate.localeCompare(b.publicationDate);
                            case 'series-pos-asc':
                                // v3.11.0.e - Books without series go to end, books with series but no position go last in their series
                                const aHasSeriesAsc = a.series;
                                const bHasSeriesAsc = b.series;

                                if (!aHasSeriesAsc && !bHasSeriesAsc) return 0; // Both have no series, keep original order
                                if (!aHasSeriesAsc) return 1; // a has no series, goes after b
                                if (!bHasSeriesAsc) return -1; // b has no series, goes after a

                                // Primary sort: group by series name (alphabetical)
                                const seriesCompareAsc = a.series.localeCompare(b.series);
                                if (seriesCompareAsc !== 0) return seriesCompareAsc;

                                // Secondary sort: position within same series (books without position go last)
                                return (parseInt(a.seriesPosition) || 999) - (parseInt(b.seriesPosition) || 999);
                            case 'series-pos-desc':
                                // v3.11.0.e - Books without series go to end, books with series but no position go last in their series
                                const aHasSeriesDesc = a.series;
                                const bHasSeriesDesc = b.series;

                                if (!aHasSeriesDesc && !bHasSeriesDesc) return 0; // Both have no series, keep original order
                                if (!aHasSeriesDesc) return 1; // a has no series, goes after b
                                if (!bHasSeriesDesc) return -1; // b has no series, goes after a

                                // Primary sort: group by series name (alphabetical)
                                const seriesCompareDesc = a.series.localeCompare(b.series);
                                if (seriesCompareDesc !== 0) return seriesCompareDesc;

                                // Secondary sort: position within same series (REVERSED, books without position go last)
                                return (parseInt(b.seriesPosition) || 999) - (parseInt(a.seriesPosition) || 999);
                            default:
                                return 0;
                        }
                    });
                    
                    return { ...col, books: sortedBookIds };
                }));
                setSortMenuOpen(null);
                setColumnMenuOpen(null); // v3.11.0 - Also close parent menu
            };

            const checkIfBlankImage = (img, bookId) => {
                if (img.naturalWidth === 1 && img.naturalHeight === 1) {
                    setBlankImageBooks(prev => new Set([...prev, bookId]));
                }
            };

            const openDeleteDialog = (columnId) => {
                const col = columns.find(c => c.id === columnId);

                if (col && col.books.length === 0) {
                    // v4.8.0 - Record action for undo (empty column)
                    const columnIndex = columns.findIndex(c => c.id === columnId);
                    recordAction({
                        type: 'DELETE_COLUMN',
                        columnId: col.id,
                        columnName: col.name,
                        columnIndex: columnIndex,
                        books: [],
                        destinationColId: null
                    });
                    setColumns(columns.filter(c => c.id !== columnId));
                    return;
                }

                const otherColumns = columns.filter(c => c.id !== columnId);
                if (otherColumns.length > 0) {
                    setDeleteDialogOpen(columnId);
                    setDeleteDestination(otherColumns[0].id);
                }
            };

            const confirmDeleteColumn = () => {
                const columnToDelete = columns.find(c => c.id === deleteDialogOpen);
                const destinationColumn = columns.find(c => c.id === deleteDestination);

                if (!columnToDelete || !destinationColumn) return;

                // v4.8.0 - Record action for undo (column with books)
                const columnIndex = columns.findIndex(c => c.id === deleteDialogOpen);
                recordAction({
                    type: 'DELETE_COLUMN',
                    columnId: columnToDelete.id,
                    columnName: columnToDelete.name,
                    columnIndex: columnIndex,
                    books: [...columnToDelete.books],
                    destinationColId: deleteDestination
                });

                setColumns(columns.filter(c => c.id !== deleteDialogOpen).map(c =>
                    c.id === deleteDestination ? { ...c, books: [...c.books, ...columnToDelete.books] } : c
                ));

                setDeleteDialogOpen(null);
                setDeleteDestination('');
            };

            // v3.11.0 - Divider Functions
            const insertDivider = (columnId) => {
                if (!newDividerLabel.trim()) return;

                const dividerId = `divider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                const divider = {
                    type: 'divider',
                    id: dividerId,
                    label: newDividerLabel.trim()
                };

                setColumns(columns.map(col => {
                    if (col.id !== columnId) return col;

                    // Find insertion position: before first selected book, or at top if no selection
                    let insertIndex = 0; // Default to top
                    if (selectedBooks.size > 0) {
                        // Find first selected book in this column
                        // v4.16.0.d - Check composite keys with indices for this column
                        let minIndex = Infinity;
                        for (const key of selectedBooks) {
                            const [keyColumnId, bookId, indexStr] = key.split(':');
                            if (keyColumnId === columnId) {
                                const index = parseInt(indexStr, 10);
                                if (index < minIndex) {
                                    minIndex = index;
                                }
                            }
                        }
                        if (minIndex !== Infinity) {
                            insertIndex = minIndex;
                        }
                    }

                    const newBooks = [...col.books];
                    newBooks.splice(insertIndex, 0, divider);
                    return { ...col, books: newBooks };
                }));

                setInsertDividerOpen(null);
                setNewDividerLabel('');
                setColumnMenuOpen(null);
                new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/divider-created';
            };

            const startEditingDivider = (columnId, dividerId, currentLabel) => {
                setEditingDivider({ columnId, dividerId });
                setEditingDividerLabel(currentLabel);
            };

            const finishEditingDivider = () => {
                if (!editingDivider) return;

                const { columnId, dividerId } = editingDivider;
                const newLabel = editingDividerLabel.trim();

                if (!newLabel) {
                    setEditingDivider(null);
                    setEditingDividerLabel('');
                    return;
                }

                setColumns(columns.map(col =>
                    col.id === columnId
                        ? {
                            ...col,
                            books: col.books.map(item =>
                                (typeof item === 'object' && item.type === 'divider' && item.id === dividerId)
                                    ? { ...item, label: newLabel }
                                    : item
                            )
                        }
                        : col
                ));

                setEditingDivider(null);
                setEditingDividerLabel('');
            };

            const deleteDivider = (columnId, dividerId) => {
                // v4.8.0 - Capture divider info for undo before deleting
                const col = columns.find(c => c.id === columnId);
                const dividerIndex = col.books.findIndex(item =>
                    typeof item === 'object' && item.type === 'divider' && item.id === dividerId
                );
                const dividerObj = col.books[dividerIndex];

                setColumns(columns.map(c =>
                    c.id === columnId
                        ? {
                            ...c,
                            books: c.books.filter(item =>
                                !(typeof item === 'object' && item.type === 'divider' && item.id === dividerId)
                            )
                        }
                        : c
                ));

                // v4.8.0 - Record action for undo
                if (dividerObj) {
                    recordAction({
                        type: 'DELETE_DIVIDER',
                        columnId: columnId,
                        divider: { ...dividerObj },
                        dividerIndex: dividerIndex
                    });
                }
            };

            const autoDivideBySeries = (columnId) => {
                const column = columns.find(c => c.id === columnId);
                if (!column) return;

                // Get actual book objects (not dividers)
                const bookItems = column.books.filter(item => typeof item === 'string');
                const bookObjects = bookItems.map(id => books.find(b => b.id === id)).filter(Boolean);

                if (bookObjects.length === 0) return;

                // Group books by series (books without series stay at end)
                const seriesGroups = {};
                const noSeriesBooks = [];

                bookObjects.forEach(book => {
                    if (book.series) {
                        if (!seriesGroups[book.series]) {
                            seriesGroups[book.series] = [];
                        }
                        seriesGroups[book.series].push(book.id);
                    } else {
                        noSeriesBooks.push(book.id);
                    }
                });

                // Sort series names alphabetically
                const sortedSeriesNames = Object.keys(seriesGroups).sort((a, b) => a.localeCompare(b));

                // v3.11.0.f - Sort books within each series by position
                sortedSeriesNames.forEach(seriesName => {
                    const bookIds = seriesGroups[seriesName];
                    const seriesBookObjects = bookIds.map(id => books.find(b => b.id === id)).filter(Boolean);

                    // Sort by seriesPosition (books without position go last)
                    seriesBookObjects.sort((a, b) => {
                        return (parseInt(a.seriesPosition) || 999) - (parseInt(b.seriesPosition) || 999);
                    });

                    // Update the group with sorted IDs
                    seriesGroups[seriesName] = seriesBookObjects.map(book => book.id);
                });

                // Build new books array with dividers
                const newBooks = [];
                sortedSeriesNames.forEach(seriesName => {
                    const dividerId = `divider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    newBooks.push({
                        type: 'divider',
                        id: dividerId,
                        label: seriesName
                    });
                    newBooks.push(...seriesGroups[seriesName]);
                });

                // v3.11.0.e - Add "Miscellaneous" divider for books without series
                if (noSeriesBooks.length > 0) {
                    const dividerId = `divider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                    newBooks.push({
                        type: 'divider',
                        id: dividerId,
                        label: 'Miscellaneous'
                    });
                    newBooks.push(...noSeriesBooks);
                }

                setColumns(columns.map(col =>
                    col.id === columnId ? { ...col, books: newBooks } : col
                ));

                setColumnMenuOpen(null);
                new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/auto-divide-by-series';
            };

            const autoDivideByRating = (columnId) => {
                const column = columns.find(c => c.id === columnId);
                if (!column) return;

                // Get actual book objects (not dividers)
                const bookItems = column.books.filter(item => typeof item === 'string');
                const bookObjects = bookItems.map(id => books.find(b => b.id === id)).filter(Boolean);

                if (bookObjects.length === 0) return;

                // Group books by rating tier
                const ratingTiers = {
                    '5 Stars': [],
                    '4 Stars': [],
                    '3 Stars': [],
                    '2 Stars': [],
                    '1 Star': [],
                    'No Rating': []
                };

                bookObjects.forEach(book => {
                    if (!book.rating || book.rating === 0) {
                        ratingTiers['No Rating'].push(book.id);
                    } else if (book.rating >= 4.5) {
                        ratingTiers['5 Stars'].push(book.id);
                    } else if (book.rating >= 3.5) {
                        ratingTiers['4 Stars'].push(book.id);
                    } else if (book.rating >= 2.5) {
                        ratingTiers['3 Stars'].push(book.id);
                    } else if (book.rating >= 1.5) {
                        ratingTiers['2 Stars'].push(book.id);
                    } else {
                        ratingTiers['1 Star'].push(book.id);
                    }
                });

                // Build new books array with dividers (only for non-empty tiers)
                const tierOrder = ['5 Stars', '4 Stars', '3 Stars', '2 Stars', '1 Star', 'No Rating'];
                const newBooks = [];

                tierOrder.forEach(tier => {
                    if (ratingTiers[tier].length > 0) {
                        const dividerId = `divider-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
                        newBooks.push({
                            type: 'divider',
                            id: dividerId,
                            label: tier
                        });
                        newBooks.push(...ratingTiers[tier]);
                    }
                });

                setColumns(columns.map(col =>
                    col.id === columnId ? { ...col, books: newBooks } : col
                ));

                setColumnMenuOpen(null);
            };

            const openBookModal = (book, columnId) => {
                try {
                    const cache = localStorage.getItem(CACHE_KEY);
                    if (cache) {
                        const cacheData = JSON.parse(cache);
                        if (cacheData[book.asin]) {
                            const cached = cacheData[book.asin];
                            book = {
                                ...book,
                                description: cached.description || book.description,
                                rating: cached.rating || book.rating,
                                ratingCount: cached.ratingCount || book.ratingCount,
                                topReviews: cached.topReviews || book.topReviews
                            };
                        }
                    }
                } catch (e) {
                    console.error('Cache read error:', e);
                }
                
                setModalBook(book);
                setModalColumnId(columnId);
                setShowAllReviews(false);
            };

            const closeBookModal = () => {
                setModalBook(null);
                setModalColumnId(null);
                setIsEditingNote(false); // v4.21.0.a - reset note editor state
                // v4.27.0 - reset tag input state
                if (contextSubmenu === 'addTagModal') setContextSubmenu(null);
                setTagInputValue('');
                setNoteEditContent(''); // v4.21.0.a
            };

            // Multi-select helper functions
            // v4.16.0.c - Selection now uses composite keys "columnId:bookId:index" to support selecting individual instances
            // v4.16.0.d - Added index to support multiple copies of same book in same column
            const toggleBookSelection = (bookId, columnId, index) => {
                const key = `${columnId}:${bookId}:${index}`;
                setSelectedBooks(prev => {
                    const newSet = new Set(prev);
                    if (newSet.has(key)) {
                        newSet.delete(key);
                    } else {
                        newSet.add(key);
                    }
                    return newSet;
                });
            };

            // v4.19.1 - Now includes dividers in range selection
            const selectBookRange = (startBookId, endBookId, columnId, startIndex, endIndex) => {
                // Only select within the same column
                const column = columns.find(col => col.id === columnId);
                if (!column) return;

                // Use raw indices directly - simpler and works with dividers
                const [min, max] = [Math.min(startIndex, endIndex), Math.max(startIndex, endIndex)];

                // Build composite keys for all items in range (books AND dividers)
                const rangeKeys = [];
                for (let i = min; i <= max; i++) {
                    const item = column.books[i];
                    if (!item) continue;

                    if (typeof item === 'object' && item.type === 'divider') {
                        // Divider: use special key format
                        rangeKeys.push(`${columnId}:divider:${item.id}:${i}`);
                    } else {
                        // Book: use standard composite key
                        const bookId = getBookIdFromEntry(item);
                        if (bookId) rangeKeys.push(`${columnId}:${bookId}:${i}`);
                    }
                }

                setSelectedBooks(new Set(rangeKeys));

                // Also set selectedDivider if any dividers are in range (for visual consistency)
                const firstDividerInRange = column.books.slice(min, max + 1).find(
                    item => typeof item === 'object' && item.type === 'divider'
                );
                if (firstDividerInRange) {
                    setSelectedDivider({ columnId, dividerId: firstDividerInRange.id });
                }
            };

            const clearSelection = () => {
                setSelectedBooks(new Set());
                setLastClickedBook(null);
                setSelectedDivider(null); // v3.13.0 - Clear divider selection too
            };

            // v4.16.0.c - Helper to get book IDs from composite selection keys
            const getSelectedBookIds = () => {
                return Array.from(selectedBooks).map(key => key.split(':')[1]);
            };

            // v4.16.0.c - Helper to get book objects from composite selection keys
            const getSelectedBooksList = () => {
                return getSelectedBookIds().map(id => books.find(b => b.id === id)).filter(Boolean);
            };

            // v4.16.0.w - Helper to get full entry info from composite selection keys
            // Returns array of {columnId, index, entry, bookId, instanceId} for each selection
            const getSelectedEntries = () => {
                return Array.from(selectedBooks).map(key => {
                    const [columnId, bookId, indexStr] = key.split(':');
                    const index = parseInt(indexStr, 10);
                    const column = columns.find(c => c.id === columnId);
                    if (!column) return null;
                    const entry = column.books[index];
                    if (!entry) return null;
                    return {
                        columnId,
                        index,
                        entry,
                        bookId: getBookIdFromEntry(entry),
                        instanceId: getInstanceId(entry)
                    };
                }).filter(Boolean);
            };

            // v4.8.0 - Undo/Redo core functions
            const MAX_UNDO = 50;

            // Keep refs in sync with state (fixes stale closure in keyboard handler)
            useEffect(() => {
                undoStackRef.current = undoStack;
            }, [undoStack]);
            useEffect(() => {
                redoStackRef.current = redoStack;
            }, [redoStack]);
            useEffect(() => {
                modalBookRef.current = modalBook;
            }, [modalBook]);

            const recordAction = (action) => {
                setUndoStack(prev => {
                    const newStack = [...prev, { ...action, timestamp: Date.now() }];
                    if (newStack.length > MAX_UNDO) newStack.shift();
                    return newStack;
                });
                setRedoStack([]); // Clear redo on new action
            };

            // TODO - Delete verbose console.log statements in executeUndo/executeRedo before release
            const executeUndo = (action) => {
                switch (action.type) {
                    case 'MOVE_BOOKS':
                        // Move books back to source column at original positions
                        console.log('[UNDO MOVE_BOOKS] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => {
                            console.log('[UNDO MOVE_BOOKS] Processing columns...');
                            // v4.16.0.aj - Use entries if available, fallback to bookIds for legacy actions
                            const entriesToRestore = action.entries || action.bookIds;
                            return cols.map(col => {
                                if (col.id === action.toColId) {
                                    // v4.16.0.aj - Remove from target by matching entries or bookIds
                                    const beforeCount = col.books.length;
                                    let filtered;
                                    if (action.entries) {
                                        // New format: remove specific entries by instanceId or exact match
                                        const instanceIdsToRemove = new Set(
                                            action.entries
                                                .filter(e => e && typeof e === 'object' && e.instanceId)
                                                .map(e => e.instanceId)
                                        );
                                        const bookIdsToRemove = action.entries
                                            .filter(e => typeof e === 'string')
                                            .concat(action.entries.filter(e => e && typeof e === 'object' && !e.instanceId).map(e => e.bookId || e));
                                        filtered = col.books.filter(entry => {
                                            if (typeof entry === 'object' && entry.instanceId) {
                                                return !instanceIdsToRemove.has(entry.instanceId);
                                            }
                                            const entryBookId = getBookIdFromEntry(entry);
                                            return !bookIdsToRemove.includes(entryBookId);
                                        });
                                    } else {
                                        // Legacy format: filter by bookId
                                        filtered = col.books.filter(entry => {
                                            const entryBookId = getBookIdFromEntry(entry);
                                            return !action.bookIds.includes(entryBookId);
                                        });
                                    }
                                    console.log(`[UNDO MOVE_BOOKS] Target col "${col.name}": ${beforeCount} -> ${filtered.length} books (removed ${beforeCount - filtered.length})`);
                                    return { ...col, books: filtered };
                                }
                                if (col.id === action.fromColId) {
                                    // Re-insert entries at original positions
                                    const newBooks = [...col.books];
                                    console.log(`[UNDO MOVE_BOOKS] Source col "${col.name}" before insert: ${newBooks.length} books`);
                                    console.log(`[UNDO MOVE_BOOKS] Entries to insert: ${entriesToRestore.length}, at indices: ${action.fromIndices}`);
                                    // v4.16.0.aj - Sort by fromIndices ascending, use actual entries
                                    const sortedPairs = entriesToRestore
                                        .map((entry, i) => ({ entry, index: action.fromIndices[i] }))
                                        .sort((a, b) => a.index - b.index);
                                    console.log('[UNDO MOVE_BOOKS] Sorted pairs count:', sortedPairs.length);
                                    sortedPairs.forEach(({ entry, index }) => {
                                        console.log(`[UNDO MOVE_BOOKS] Splicing entry at index ${index}, array length: ${newBooks.length}`);
                                        newBooks.splice(index, 0, entry);
                                    });
                                    console.log(`[UNDO MOVE_BOOKS] Source col "${col.name}" after insert: ${newBooks.length} books`);
                                    return { ...col, books: newBooks };
                                }
                                return col;
                            });
                        });
                        break;
                    case 'COPY_BOOKS':
                        // v4.16.0.au - Undo copy: just remove the copied entries from target column
                        console.log('[UNDO COPY_BOOKS] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => {
                            return cols.map(col => {
                                if (col.id === action.toColId) {
                                    const instanceIdsToRemove = new Set(
                                        action.entries
                                            .filter(e => e && typeof e === 'object' && e.instanceId)
                                            .map(e => e.instanceId)
                                    );
                                    const filtered = col.books.filter(entry => {
                                        if (typeof entry === 'object' && entry.instanceId) {
                                            return !instanceIdsToRemove.has(entry.instanceId);
                                        }
                                        return true;
                                    });
                                    console.log(`[UNDO COPY_BOOKS] Removed ${col.books.length - filtered.length} copied entries from "${col.name}"`);
                                    return { ...col, books: filtered };
                                }
                                return col;
                            });
                        });
                        break;
                    case 'REORDER_BOOKS':
                        // Move books back to original positions within same column
                        console.log('[UNDO REORDER_BOOKS] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => {
                            console.log('[UNDO REORDER_BOOKS] Processing columns...');
                            // v4.16.0.aj - Use entries if available, fallback to bookIds for legacy actions
                            const entriesToRestore = action.entries || action.bookIds;
                            return cols.map(col => {
                                if (col.id === action.colId) {
                                    const newBooks = [...col.books];
                                    console.log(`[UNDO REORDER_BOOKS] Col "${col.name}" before: ${newBooks.length} books`);
                                    // v4.16.0.aj - Remove entries by instanceId or bookId
                                    if (action.entries) {
                                        // New format: find and remove specific entries
                                        action.entries.forEach(entry => {
                                            let idx = -1;
                                            if (typeof entry === 'object' && entry.instanceId) {
                                                idx = newBooks.findIndex(e => e && typeof e === 'object' && e.instanceId === entry.instanceId);
                                            } else {
                                                const bookId = getBookIdFromEntry(entry);
                                                idx = newBooks.findIndex(e => getBookIdFromEntry(e) === bookId);
                                            }
                                            if (idx !== -1) newBooks.splice(idx, 1);
                                        });
                                    } else {
                                        // Legacy format: remove by bookId
                                        action.bookIds.forEach(bookId => {
                                            const idx = newBooks.findIndex(e => getBookIdFromEntry(e) === bookId);
                                            if (idx !== -1) newBooks.splice(idx, 1);
                                        });
                                    }
                                    console.log(`[UNDO REORDER_BOOKS] After removal: ${newBooks.length} books`);
                                    // Then insert them back at their original positions (sorted ascending)
                                    // v4.16.0.aj - Use actual entries instead of bookIds
                                    const sortedPairs = entriesToRestore
                                        .map((entry, i) => ({ entry, index: action.fromIndices[i] }))
                                        .sort((a, b) => a.index - b.index);
                                    console.log('[UNDO REORDER_BOOKS] Sorted pairs count:', sortedPairs.length);
                                    sortedPairs.forEach(({ entry, index }) => {
                                        console.log(`[UNDO REORDER_BOOKS] Splicing entry at index ${index}, array length: ${newBooks.length}`);
                                        newBooks.splice(index, 0, entry);
                                    });
                                    console.log(`[UNDO REORDER_BOOKS] After insert: ${newBooks.length} books`);
                                    return { ...col, books: newBooks };
                                }
                                return col;
                            });
                        });
                        break;
                    case 'TOGGLE_HIDE':
                        // v4.8.0 - Restore each book's previous hidden state
                        console.log('[UNDO TOGGLE_HIDE] Action:', JSON.stringify(action, null, 2));
                        setBooks(prevBooks => {
                            const updatedBooks = prevBooks.map(book => {
                                if (action.bookIds.includes(book.id)) {
                                    const prevState = action.previousStates[book.id];
                                    console.log(`[UNDO TOGGLE_HIDE] Restoring "${book.title}" isHidden: ${book.isHidden} -> ${prevState}`);
                                    return { ...book, isHidden: prevState };
                                }
                                return book;
                            });
                            saveBooksToIndexedDB(updatedBooks);
                            return updatedBooks;
                        });
                        break;
                    case 'DELETE_COLUMN':
                        // v4.8.0 - Restore deleted column with its books
                        console.log('[UNDO DELETE_COLUMN] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => {
                            // Remove books from destination column (if any were moved)
                            let updatedCols = cols;
                            if (action.books.length > 0 && action.destinationColId) {
                                updatedCols = cols.map(col => {
                                    if (col.id === action.destinationColId) {
                                        return { ...col, books: col.books.filter(id => !action.books.includes(id)) };
                                    }
                                    return col;
                                });
                            }
                            // Re-insert the column at its original position
                            const restoredColumn = {
                                id: action.columnId,
                                name: action.columnName,
                                books: [...action.books]
                            };
                            const newCols = [...updatedCols];
                            newCols.splice(action.columnIndex, 0, restoredColumn);
                            console.log(`[UNDO DELETE_COLUMN] Restored column "${action.columnName}" at index ${action.columnIndex} with ${action.books.length} books`);
                            return newCols;
                        });
                        break;
                    case 'REORDER_COLUMNS':
                        // v4.8.0 - Move column back to original position
                        console.log('[UNDO REORDER_COLUMNS] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => {
                            const currentIndex = cols.findIndex(c => c.id === action.columnId);
                            if (currentIndex === -1) return cols;
                            const newCols = [...cols];
                            const [movedColumn] = newCols.splice(currentIndex, 1);
                            newCols.splice(action.fromIndex, 0, movedColumn);
                            console.log(`[UNDO REORDER_COLUMNS] Moved column from index ${currentIndex} back to ${action.fromIndex}`);
                            return newCols;
                        });
                        break;
                    case 'DELETE_DIVIDER':
                        // v4.8.0 - Restore deleted divider at original position
                        console.log('[UNDO DELETE_DIVIDER] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => cols.map(col => {
                            if (col.id === action.columnId) {
                                const newBooks = [...col.books];
                                newBooks.splice(action.dividerIndex, 0, { ...action.divider });
                                console.log(`[UNDO DELETE_DIVIDER] Restored divider "${action.divider.label}" at index ${action.dividerIndex}`);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));
                        break;
                    case 'REORDER_DIVIDER':
                        // v4.8.0 - Move divider back to original position
                        console.log('[UNDO REORDER_DIVIDER] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => cols.map(col => {
                            if (col.id === action.colId) {
                                const newBooks = [...col.books];
                                // Find and remove divider from current position
                                const currentIdx = newBooks.findIndex(b =>
                                    typeof b === 'object' && b.type === 'divider' && b.id === action.dividerId
                                );
                                if (currentIdx === -1) return col;
                                const [divider] = newBooks.splice(currentIdx, 1);
                                // Insert at original position
                                newBooks.splice(action.fromIndex, 0, divider);
                                console.log(`[UNDO REORDER_DIVIDER] Moved divider "${action.dividerLabel}" from index ${currentIdx} back to ${action.fromIndex}`);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));
                        break;
                    // v5.0.0-alpha.46 - Explorer folder operations
                    case 'MOVE_BOOKS_FOLDER':
                        // Undo move: remove from target folder, add back to source folder
                        console.log('[UNDO MOVE_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.toFolderId) {
                                // Remove books from target
                                return { ...folder, bookIds: (folder.bookIds || []).filter(id => !action.bookIds.includes(id)) };
                            }
                            if (folder.id === action.fromFolderId) {
                                // Re-insert at original positions
                                const newBookIds = [...(folder.bookIds || [])];
                                const sortedPairs = action.bookIds
                                    .map((id, i) => ({ id, index: action.fromIndices[i] }))
                                    .sort((a, b) => a.index - b.index);
                                sortedPairs.forEach(({ id, index }) => {
                                    newBookIds.splice(index, 0, id);
                                });
                                return { ...folder, bookIds: newBookIds };
                            }
                            return folder;
                        }));
                        break;
                    case 'COPY_BOOKS_FOLDER':
                        // Undo copy: just remove from target folder
                        console.log('[UNDO COPY_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.toFolderId) {
                                return { ...folder, bookIds: (folder.bookIds || []).filter(id => !action.bookIds.includes(id)) };
                            }
                            return folder;
                        }));
                        break;
                    case 'REMOVE_BOOKS_FOLDER':
                        // Undo remove: add books back to folder at original positions
                        console.log('[UNDO REMOVE_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                const newBookIds = [...(folder.bookIds || [])];
                                const sortedPairs = action.bookIds
                                    .map((id, i) => ({ id, index: action.fromIndices[i] }))
                                    .sort((a, b) => a.index - b.index);
                                sortedPairs.forEach(({ id, index }) => {
                                    newBookIds.splice(index, 0, id);
                                });
                                return { ...folder, bookIds: newBookIds };
                            }
                            return folder;
                        }));
                        break;
                    case 'REORDER_BOOKS_FOLDER':
                        // Undo reorder: restore original positions
                        console.log('[UNDO REORDER_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                const newBookIds = [...(folder.bookIds || [])];
                                // Remove the moved books
                                action.bookIds.forEach(id => {
                                    const idx = newBookIds.indexOf(id);
                                    if (idx !== -1) newBookIds.splice(idx, 1);
                                });
                                // Re-insert at original positions (sorted ascending)
                                const sortedPairs = action.bookIds
                                    .map((id, i) => ({ id, index: action.fromIndices[i] }))
                                    .sort((a, b) => a.index - b.index);
                                sortedPairs.forEach(({ id, index }) => {
                                    newBookIds.splice(index, 0, id);
                                });
                                return { ...folder, bookIds: newBookIds };
                            }
                            return folder;
                        }));
                        break;
                    case 'DELETE_FOLDERS':
                        // Undo delete: restore folders with their bookIds and hierarchy
                        // v5.0.0-alpha.56 - Also remove orphaned books from destination and restore selection
                        console.log('[UNDO DELETE_FOLDERS] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => {
                            let newFolders = [...prev];

                            // Remove orphaned books from destination folder (if any were moved)
                            if (action.orphanedBooks?.length > 0 && action.orphanDestination) {
                                const orphanedSet = new Set(action.orphanedBooks);
                                newFolders = newFolders.map(f => {
                                    if (f.id === action.orphanDestination) {
                                        return { ...f, bookIds: (f.bookIds || []).filter(id => !orphanedSet.has(id)) };
                                    }
                                    return f;
                                });
                            }

                            // Re-insert folders at their original indices (sorted ascending)
                            const sortedFolders = action.deletedFolders
                                .map((f, i) => ({ folder: f, index: action.folderIndices[i] }))
                                .sort((a, b) => a.index - b.index);
                            sortedFolders.forEach(({ folder, index }) => {
                                newFolders.splice(index, 0, folder);
                            });
                            return newFolders;
                        });
                        // Restore selection to first restored folder
                        if (action.deletedFolders?.length > 0) {
                            setSelectedFolderId(action.deletedFolders[0].id);
                        }
                        break;
                    case 'CREATE_FOLDER':
                        // v5.0.0-alpha.51 - Undo folder creation: remove the created folder
                        console.log('[UNDO CREATE_FOLDER] Removing folder:', action.folderId);
                        setFolders(prev => prev.filter(f => f.id !== action.folderId));
                        if (selectedFolderId === action.folderId) {
                            setSelectedFolderId(action.parentId || '__all__');
                        }
                        break;
                    case 'REPARENT_FOLDER':
                        // v5.0.0-alpha.78 - Undo reparent: restore old parentIds
                        console.log('[UNDO REPARENT_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            const oldData = action.oldParentIds.find(o => o.folderId === folder.id);
                            if (oldData) {
                                return { ...folder, parentId: oldData.oldParentId };
                            }
                            return folder;
                        }));
                        showToast(`Undo: ${action.description}`, 'info');
                        break;
                    case 'MOVE_FOLDER':
                        // v5.0.0-alpha.135 - Undo single folder move: restore old parent
                        console.log('[UNDO MOVE_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                return { ...folder, parentId: action.oldParentId };
                            }
                            return folder;
                        }));
                        break;
                    case 'CUT_PASTE_FOLDER':
                        // v5.0.0-alpha.141 - Undo cut/paste: restore old parent
                        console.log('[UNDO CUT_PASTE_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                return { ...folder, parentId: action.oldParentId };
                            }
                            return folder;
                        }));
                        break;
                    case 'COPY_PASTE_FOLDER':
                        // v5.0.0-alpha.141 - Undo copy/paste: delete copied folders
                        console.log('[UNDO COPY_PASTE_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.filter(folder => !action.newFolderIds.includes(folder.id)));
                        break;
                    case 'REORDER_FOLDER':
                        // v5.0.0-alpha.79 - Undo folder reorder: restore old order
                        console.log('[UNDO REORDER_FOLDER] Action:', JSON.stringify(action, null, 2));
                        if (action.parentId) {
                            setFolders(prev => prev.map(folder => {
                                if (folder.id === action.parentId) {
                                    return { ...folder, childFolderIds: action.oldOrder };
                                }
                                return folder;
                            }));
                        } else {
                            // Root level - restore sortIndex
                            setFolders(prev => {
                                const updated = [...prev];
                                action.oldOrder.forEach((folderId, idx) => {
                                    const folderIdx = updated.findIndex(f => f.id === folderId);
                                    if (folderIdx >= 0) {
                                        updated[folderIdx] = { ...updated[folderIdx], sortIndex: idx };
                                    }
                                });
                                return updated;
                            });
                        }
                        showToast(`Undo: ${action.description}`, 'info');
                        break;
                    default:
                        console.warn('Unknown action type for undo:', action.type);
                }
            };

            const executeRedo = (action) => {
                switch (action.type) {
                    case 'MOVE_BOOKS':
                        // v4.16.0.ak - Move books to target column (use entries for GUID support)
                        setColumns(cols => cols.map(col => {
                            if (col.id === action.fromColId) {
                                // v4.16.0.ak - Remove by instanceId if entries available, else by bookId
                                if (action.entries) {
                                    const instanceIdsToRemove = new Set(
                                        action.entries
                                            .filter(e => e && typeof e === 'object' && e.instanceId)
                                            .map(e => e.instanceId)
                                    );
                                    const bookIdsToRemove = new Set(
                                        action.entries
                                            .filter(e => typeof e === 'string')
                                            .concat(action.entries.filter(e => e && typeof e === 'object' && !e.instanceId).map(e => e.bookId || e))
                                    );
                                    return { ...col, books: col.books.filter((entry, idx) => {
                                        if (typeof entry === 'object' && entry.instanceId) {
                                            return !instanceIdsToRemove.has(entry.instanceId);
                                        }
                                        // For legacy string entries, check if this index matches fromIndices
                                        if (typeof entry === 'string' && action.fromIndices) {
                                            return !action.fromIndices.includes(idx);
                                        }
                                        return !bookIdsToRemove.has(entry);
                                    }) };
                                }
                                return { ...col, books: col.books.filter(id => !action.bookIds.includes(id)) };
                            }
                            if (col.id === action.toColId) {
                                const newBooks = [...col.books];
                                // v4.16.0.ak - Insert entries if available, else bookIds
                                const entriesToInsert = action.entries || action.bookIds;
                                newBooks.splice(action.toIndex, 0, ...entriesToInsert);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));
                        break;
                    case 'COPY_BOOKS':
                        // v4.16.0.au - Redo copy: re-add the copied entries to target column
                        setColumns(cols => cols.map(col => {
                            if (col.id === action.toColId) {
                                const newBooks = [...col.books];
                                newBooks.splice(action.toIndex, 0, ...action.entries);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));
                        break;
                    case 'REORDER_BOOKS':
                        // v4.16.0.ak - Re-apply the reorder (use entries for GUID support)
                        setColumns(cols => cols.map(col => {
                            if (col.id === action.colId) {
                                const newBooks = [...col.books];
                                // v4.16.0.ak - Remove by index (fromIndices) for precise targeting
                                // Sort indices descending to remove from end first
                                const sortedIndices = [...action.fromIndices].sort((a, b) => b - a);
                                sortedIndices.forEach(idx => {
                                    if (idx >= 0 && idx < newBooks.length) {
                                        newBooks.splice(idx, 1);
                                    }
                                });
                                // Calculate adjusted insert index (same logic as original reorder)
                                let adjustedIndex = action.toIndex;
                                action.fromIndices.forEach(origIdx => {
                                    if (origIdx < action.toIndex) adjustedIndex--;
                                });
                                // v4.16.0.ak - Insert entries if available, else bookIds
                                const entriesToInsert = action.entries || action.bookIds;
                                newBooks.splice(adjustedIndex, 0, ...entriesToInsert);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));
                        break;
                    case 'TOGGLE_HIDE':
                        // v4.8.0 - Re-apply the hide/unhide action
                        console.log('[REDO TOGGLE_HIDE] Action:', JSON.stringify(action, null, 2));
                        setBooks(prevBooks => {
                            const updatedBooks = prevBooks.map(book => {
                                if (action.bookIds.includes(book.id)) {
                                    console.log(`[REDO TOGGLE_HIDE] Setting "${book.title}" isHidden: ${book.isHidden} -> ${action.newState}`);
                                    return { ...book, isHidden: action.newState };
                                }
                                return book;
                            });
                            saveBooksToIndexedDB(updatedBooks);
                            return updatedBooks;
                        });
                        break;
                    case 'DELETE_COLUMN':
                        // v4.8.0 - Re-delete the column
                        console.log('[REDO DELETE_COLUMN] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => {
                            // Move books to destination column (if any)
                            let updatedCols = cols;
                            if (action.books.length > 0 && action.destinationColId) {
                                updatedCols = cols.map(col => {
                                    if (col.id === action.destinationColId) {
                                        return { ...col, books: [...col.books, ...action.books] };
                                    }
                                    return col;
                                });
                            }
                            // Remove the column
                            console.log(`[REDO DELETE_COLUMN] Deleting column "${action.columnName}"`);
                            return updatedCols.filter(col => col.id !== action.columnId);
                        });
                        break;
                    case 'REORDER_COLUMNS':
                        // v4.8.0 - Move column back to target position
                        console.log('[REDO REORDER_COLUMNS] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => {
                            const currentIndex = cols.findIndex(c => c.id === action.columnId);
                            if (currentIndex === -1) return cols;
                            const newCols = [...cols];
                            const [movedColumn] = newCols.splice(currentIndex, 1);
                            newCols.splice(action.toIndex, 0, movedColumn);
                            console.log(`[REDO REORDER_COLUMNS] Moved column from index ${currentIndex} to ${action.toIndex}`);
                            return newCols;
                        });
                        break;
                    case 'DELETE_DIVIDER':
                        // v4.8.0 - Re-delete the divider
                        console.log('[REDO DELETE_DIVIDER] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => cols.map(col => {
                            if (col.id === action.columnId) {
                                console.log(`[REDO DELETE_DIVIDER] Deleting divider "${action.divider.label}"`);
                                return {
                                    ...col,
                                    books: col.books.filter(item =>
                                        !(typeof item === 'object' && item.type === 'divider' && item.id === action.divider.id)
                                    )
                                };
                            }
                            return col;
                        }));
                        break;
                    case 'REORDER_DIVIDER':
                        // v4.8.0 - Move divider to target position
                        console.log('[REDO REORDER_DIVIDER] Action:', JSON.stringify(action, null, 2));
                        setColumns(cols => cols.map(col => {
                            if (col.id === action.colId) {
                                const newBooks = [...col.books];
                                // Find and remove divider from current position
                                const currentIdx = newBooks.findIndex(b =>
                                    typeof b === 'object' && b.type === 'divider' && b.id === action.dividerId
                                );
                                if (currentIdx === -1) return col;
                                const [divider] = newBooks.splice(currentIdx, 1);
                                // Calculate adjusted target index (same logic as original reorder)
                                let adjustedIndex = action.toIndex;
                                if (action.fromIndex < action.toIndex) adjustedIndex--;
                                // Insert at target position
                                newBooks.splice(adjustedIndex, 0, divider);
                                console.log(`[REDO REORDER_DIVIDER] Moved divider "${action.dividerLabel}" from index ${currentIdx} to ${adjustedIndex}`);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));
                        break;
                    // v5.0.0-alpha.46 - Explorer folder operations
                    case 'MOVE_BOOKS_FOLDER':
                        // Redo move: remove from source, add to target
                        console.log('[REDO MOVE_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.fromFolderId) {
                                return { ...folder, bookIds: (folder.bookIds || []).filter(id => !action.bookIds.includes(id)) };
                            }
                            if (folder.id === action.toFolderId) {
                                const newBookIds = [...(folder.bookIds || [])];
                                newBookIds.splice(action.toIndex, 0, ...action.bookIds);
                                return { ...folder, bookIds: newBookIds };
                            }
                            return folder;
                        }));
                        break;
                    case 'COPY_BOOKS_FOLDER':
                        // Redo copy: add to target folder
                        console.log('[REDO COPY_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.toFolderId) {
                                const newBookIds = [...(folder.bookIds || [])];
                                newBookIds.splice(action.toIndex, 0, ...action.bookIds);
                                return { ...folder, bookIds: newBookIds };
                            }
                            return folder;
                        }));
                        break;
                    case 'REMOVE_BOOKS_FOLDER':
                        // Redo remove: remove books from folder
                        console.log('[REDO REMOVE_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                return { ...folder, bookIds: (folder.bookIds || []).filter(id => !action.bookIds.includes(id)) };
                            }
                            return folder;
                        }));
                        break;
                    case 'REORDER_BOOKS_FOLDER':
                        // Redo reorder: apply the reorder again
                        console.log('[REDO REORDER_BOOKS_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                const newBookIds = [...(folder.bookIds || [])];
                                // Remove by indices (descending to maintain positions)
                                const sortedIndices = [...action.fromIndices].sort((a, b) => b - a);
                                sortedIndices.forEach(idx => {
                                    if (idx >= 0 && idx < newBookIds.length) newBookIds.splice(idx, 1);
                                });
                                // Calculate adjusted insert index
                                let adjustedIndex = action.toIndex;
                                action.fromIndices.forEach(origIdx => {
                                    if (origIdx < action.toIndex) adjustedIndex--;
                                });
                                // Insert books at target position
                                newBookIds.splice(adjustedIndex, 0, ...action.bookIds);
                                return { ...folder, bookIds: newBookIds };
                            }
                            return folder;
                        }));
                        break;
                    case 'DELETE_FOLDERS':
                        // Redo delete: move orphaned books to destination, then remove folders
                        // v5.0.0-alpha.56 - Handle orphaned books on redo and update selection
                        console.log('[REDO DELETE_FOLDERS] Action:', JSON.stringify(action, null, 2));
                        const folderIdsToDeleteRedo = new Set(action.deletedFolders.map(f => f.id));
                        setFolders(prev => {
                            let updated = prev;
                            // Move orphaned books to destination (if any)
                            if (action.orphanedBooks?.length > 0 && action.orphanDestination) {
                                updated = updated.map(f => {
                                    if (f.id === action.orphanDestination) {
                                        const existingIds = new Set(f.bookIds || []);
                                        const newBookIds = action.orphanedBooks.filter(id => !existingIds.has(id));
                                        return { ...f, bookIds: [...newBookIds, ...(f.bookIds || [])] };
                                    }
                                    return f;
                                });
                            }
                            // Remove deleted folders
                            return updated.filter(f => !folderIdsToDeleteRedo.has(f.id));
                        });
                        // v5.0.0-alpha.58 - Navigate to parent folder instead of All Books
                        if (folderIdsToDeleteRedo.has(selectedFolderId)) {
                            setSelectedFolderId(action.orphanDestination || '__all__');
                        }
                        break;
                    case 'CREATE_FOLDER':
                        // v5.0.0-alpha.51 - Redo folder creation: re-add the folder
                        console.log('[REDO CREATE_FOLDER] Re-adding folder:', action.folder.name);
                        setFolders(prev => [...prev, { ...action.folder }]);
                        setSelectedFolderId(action.folderId);
                        break;
                    case 'REPARENT_FOLDER':
                        // v5.0.0-alpha.78 - Redo reparent: apply the new parentId again
                        console.log('[REDO REPARENT_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (action.folderIds.includes(folder.id)) {
                                return { ...folder, parentId: action.newParentId };
                            }
                            return folder;
                        }));
                        showToast(`Redo: ${action.description}`, 'info');
                        break;
                    case 'MOVE_FOLDER':
                        // v5.0.0-alpha.135 - Redo single folder move: apply new parent
                        console.log('[REDO MOVE_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                return { ...folder, parentId: action.newParentId };
                            }
                            return folder;
                        }));
                        break;
                    case 'CUT_PASTE_FOLDER':
                        // v5.0.0-alpha.141 - Redo cut/paste: apply new parent
                        console.log('[REDO CUT_PASTE_FOLDER] Action:', JSON.stringify(action, null, 2));
                        setFolders(prev => prev.map(folder => {
                            if (folder.id === action.folderId) {
                                return { ...folder, parentId: action.newParentId };
                            }
                            return folder;
                        }));
                        break;
                    case 'COPY_PASTE_FOLDER':
                        // v5.0.0-alpha.141 - Redo copy/paste: re-add copied folders
                        console.log('[REDO COPY_PASTE_FOLDER] Action:', JSON.stringify(action, null, 2));
                        // Note: We need to store the copied folders in the action to redo properly
                        // For now, this is a limitation - we can't redo copy operations
                        // TODO: Store copied folder data in action for proper redo
                        showToast('Cannot redo copy operation', 'warning');
                        break;
                    case 'REORDER_FOLDER':
                        // v5.0.0-alpha.79 - Redo folder reorder: apply new order
                        console.log('[REDO REORDER_FOLDER] Action:', JSON.stringify(action, null, 2));
                        if (action.parentId) {
                            setFolders(prev => prev.map(folder => {
                                if (folder.id === action.parentId) {
                                    return { ...folder, childFolderIds: action.newOrder };
                                }
                                return folder;
                            }));
                        } else {
                            // Root level - apply new sortIndex
                            setFolders(prev => {
                                const updated = [...prev];
                                action.newOrder.forEach((folderId, idx) => {
                                    const folderIdx = updated.findIndex(f => f.id === folderId);
                                    if (folderIdx >= 0) {
                                        updated[folderIdx] = { ...updated[folderIdx], sortIndex: idx };
                                    }
                                });
                                return updated;
                            });
                        }
                        showToast(`Redo: ${action.description}`, 'info');
                        break;
                    default:
                        console.warn('Unknown action type for redo:', action.type);
                }
            };

            const undo = () => {
                // Use ref to get current stack (avoids stale closure from keyboard handler)
                const currentStack = undoStackRef.current;
                if (currentStack.length === 0) return;
                const action = currentStack[currentStack.length - 1];
                executeUndo(action);
                setUndoStack(prev => prev.slice(0, -1));
                setRedoStack(prev => [...prev, action]);
            };

            const redo = () => {
                // Use ref to get current stack (avoids stale closure from keyboard handler)
                const currentStack = redoStackRef.current;
                if (currentStack.length === 0) return;
                const action = currentStack[currentStack.length - 1];
                executeRedo(action);
                setRedoStack(prev => prev.slice(0, -1));
                setUndoStack(prev => [...prev, action]);
            };

            // v3.13.0 - Select divider and all books in its group
            // v4.19.1 - Fixed to use composite keys for books, include divider in selection
            const selectDividerGroup = (columnId, dividerId) => {
                const column = columns.find(col => col.id === columnId);
                if (!column) return;

                // Find divider index
                const dividerIndex = column.books.findIndex(item =>
                    typeof item === 'object' && item.type === 'divider' && item.id === dividerId
                );
                if (dividerIndex === -1) return;

                // Build composite keys for divider + all books until next divider
                const selectionKeys = [];

                // Add the divider itself (special key format: columnId:divider:dividerId:index)
                selectionKeys.push(`${columnId}:divider:${dividerId}:${dividerIndex}`);

                // Add books from this divider until next divider (or end of column)
                for (let i = dividerIndex + 1; i < column.books.length; i++) {
                    const item = column.books[i];
                    // Stop at next divider
                    if (typeof item === 'object' && item.type === 'divider') break;
                    // Add book with composite key (columnId:bookId:index)
                    const bookId = getBookIdFromEntry(item);
                    if (bookId) selectionKeys.push(`${columnId}:${bookId}:${i}`);
                }

                // Select all items in this group
                setSelectedBooks(new Set(selectionKeys));
                setSelectedDivider({ columnId, dividerId });
                setActiveColumnId(columnId);

                // Set anchor for shift+click (use first book after divider, or divider position if no books)
                if (selectionKeys.length > 1) {
                    const firstBookKey = selectionKeys[1]; // Skip divider key
                    const [, bookId, indexStr] = firstBookKey.split(':');
                    setLastClickedBook({ id: bookId, columnId, index: parseInt(indexStr, 10) });
                } else {
                    // No books under divider - set anchor at divider position
                    setLastClickedBook({ id: dividerId, columnId, index: dividerIndex, isDivider: true });
                }
            };

            const navigateBook = (direction) => {
                if (!modalBook || !modalColumnId) return;
                
                const column = columns.find(c => c.id === modalColumnId);
                if (!column) return;
                
                const visibleBooks = filteredBooks(column.books);
                const currentIndex = visibleBooks.findIndex(b => b.id === modalBook.id);
                if (currentIndex === -1) return;
                
                let newIndex = direction === 'prev' ? currentIndex - 1 : currentIndex + 1;
                
                if (newIndex < 0 || newIndex >= visibleBooks.length) return;
                
                const newBook = visibleBooks[newIndex];
                
                if (newBook) {
                    setModalBook(newBook);
                }
            };

            const getBookPosition = () => {
                if (!modalBook || !modalColumnId) return { current: 0, total: 0 };
                
                const column = columns.find(c => c.id === modalColumnId);
                if (!column) return { current: 0, total: 0 };
                
                const visibleBooks = filteredBooks(column.books);
                const currentIndex = visibleBooks.findIndex(b => b.id === modalBook.id);
                
                if (currentIndex === -1) return { current: 0, total: 0 };
                
                return {
                    current: currentIndex + 1,
                    total: visibleBooks.length,
                    hasPrev: currentIndex > 0,
                    hasNext: currentIndex < visibleBooks.length - 1
                };
            };

            const handleColumnDragStart = (e, columnId) => {
                e.stopPropagation();
                e.preventDefault();  // Prevent text selection during column drag
                setDragStartPos({ x: e.clientX, y: e.clientY });
                setDragCurrentPos({ x: e.clientX, y: e.clientY });
                setDraggedColumn(columnId);
                setIsDraggingColumn(false);
            };

            const calculateColumnDropPosition = (e) => {
                const columnsContainer = document.querySelector('.columns-container');
                if (!columnsContainer) return null;

                const columnElements = Array.from(columnsContainer.querySelectorAll('[data-column-id]'));
                const mouseX = e.clientX;

                for (let i = 0; i < columnElements.length; i++) {
                    const rect = columnElements[i].getBoundingClientRect();
                    const midpoint = rect.left + rect.width / 2;
                    
                    if (mouseX < midpoint) {
                        return i;
                    }
                }

                return columnElements.length;
            };

            const handleMouseDown = (e, book, columnId, bookIndex) => {
                // v4.16.0.bc - Block Shift for range selection (handled by onClick)
                if (e.shiftKey) {
                    return;
                }

                // v4.16.0.bc - Track Ctrl state for potential copy-drag
                const isCtrlHeld = e.ctrlKey || e.metaKey;
                isCopyDragRef.current = isCtrlHeld;

                // v4.16.0.bc - Always preventDefault to enable drag, but don't clear selection for Ctrl
                // Ctrl+Click multi-select is handled by onClick; Ctrl+Drag copy needs drag to work
                e.preventDefault();

                // v4.16.0.bc - Only clear selection for non-Ctrl clicks on unselected books
                // For Ctrl+Click, onClick will toggle selection; for Ctrl+Drag, we keep current selection
                if (!isCtrlHeld) {
                    // If clicking a book that's not in the selection, clear selection first
                    // v4.16.0.d - Use composite key with index for selection check
                    if (selectedBooks.size > 0 && !selectedBooks.has(`${columnId}:${book.id}:${bookIndex}`)) {
                        clearSelection();
                    }
                }

                setDragStartPos({ x: e.clientX, y: e.clientY });
                // v3.14.0.x - Initialize position ref for ghost
                dragPosRef.current = { x: e.clientX, y: e.clientY };
                setDraggedBook(book);
                setDraggedFromColumn(columnId);
                setDraggedBookIndex(bookIndex); // v4.16.0.d - Remember dragged book's index
                setIsDragging(false);
                // v3.14.0.w - Use ref instead of state
                dropTargetRef.current = null;
            };

            // v3.11.0 - Handle divider dragging
            const handleDividerMouseDown = (e, divider, columnId) => {
                e.preventDefault();
                e.stopPropagation();

                setDragStartPos({ x: e.clientX, y: e.clientY });
                // v3.14.0.x - Initialize position ref for ghost
                dragPosRef.current = { x: e.clientX, y: e.clientY };
                setDraggedBook(divider); // Reuse draggedBook state for dividers
                setDraggedFromColumn(columnId);
                setIsDragging(false);
                // v3.14.0.w - Use ref instead of state
                dropTargetRef.current = null;
            };

            // v3.14.0.r - Build row-based index for a column (called at drag start only)
            // v3.14.0.u - Store scrollTop to calculate offset instead of rebuilding on scroll
            // Groups elements into rows based on Y position, enabling O(log R) lookup instead of O(N)
            const buildColumnIndex = (columnId) => {
                const column = columns.find(c => c.id === columnId);
                if (!column) return null;

                const columnElement = document.querySelector(`[data-column-id="${columnId}"] .book-grid`);
                if (!columnElement) return null;

                // v3.14.0.u - Get scrollable container and store its scrollTop
                const scrollContainer = columnElement.closest('.overflow-y-auto');
                const initialScrollTop = scrollContainer ? scrollContainer.scrollTop : 0;

                const columnRect = columnElement.getBoundingClientRect();

                // Get all book and divider elements with their positions
                const bookElements = Array.from(columnElement.querySelectorAll('.book-item'));
                const dividerElements = Array.from(columnElement.querySelectorAll('.divider-item'));

                // Build array of all elements with their rect and metadata
                const allItems = [];

                bookElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const bookId = el.dataset.bookId;
                    // v4.16.0.al - Use data-index attribute for accurate index (supports GUID entries)
                    const actualIndex = el.dataset.index !== undefined ? parseInt(el.dataset.index, 10) : column.books.indexOf(bookId);
                    if (actualIndex !== -1 && !isNaN(actualIndex)) {
                        allItems.push({
                            type: 'book',
                            id: bookId,
                            index: actualIndex,
                            rect,
                            top: rect.top,
                            bottom: rect.bottom,
                            left: rect.left,
                            right: rect.right,
                            centerY: rect.top + rect.height / 2
                        });
                    }
                });

                dividerElements.forEach(el => {
                    const rect = el.getBoundingClientRect();
                    const dividerId = el.dataset.dividerId;
                    const actualIndex = column.books.findIndex(item =>
                        typeof item === 'object' && item.type === 'divider' && item.id === dividerId
                    );
                    if (actualIndex !== -1) {
                        allItems.push({
                            type: 'divider',
                            id: dividerId,
                            index: actualIndex,
                            rect,
                            top: rect.top,
                            bottom: rect.bottom,
                            left: rect.left,
                            right: rect.right,
                            centerY: rect.top + rect.height / 2
                        });
                    }
                });

                // Sort by index to ensure correct order
                allItems.sort((a, b) => a.index - b.index);

                // Group into rows based on Y position (items with same top are in same row)
                const rows = [];
                let currentRow = null;
                const ROW_TOLERANCE = 5; // pixels - items within this Y distance are same row

                allItems.forEach(item => {
                    if (!currentRow || Math.abs(item.top - currentRow.top) > ROW_TOLERANCE) {
                        // Start a new row
                        currentRow = {
                            type: item.type === 'divider' ? 'divider' : 'books',
                            top: item.top,
                            bottom: item.bottom,
                            startIndex: item.index,
                            items: [item]
                        };
                        rows.push(currentRow);
                    } else {
                        // Add to current row
                        currentRow.items.push(item);
                        currentRow.bottom = Math.max(currentRow.bottom, item.bottom);
                        // If any item in row is divider, row type is divider
                        if (item.type === 'divider') {
                            currentRow.type = 'divider';
                        }
                    }
                });

                // Sort items within each row by X position (left to right)
                rows.forEach(row => {
                    row.items.sort((a, b) => a.left - b.left);
                });

                // Build row boundaries array for binary search
                const rowBoundaries = rows.map(row => row.top);

                const index = {
                    columnId,
                    columnRect,
                    rows,
                    rowBoundaries,
                    totalItems: column.books.length,
                    initialScrollTop,  // v3.14.0.u - for scroll offset calculation
                    scrollContainer    // v3.14.0.u - reference to get current scrollTop
                };

                columnIndexRef.current[columnId] = index;
                return index;
            };

            // v3.14.0.r - Build index for all visible columns
            const buildAllColumnIndexes = () => {
                columns.forEach(column => {
                    buildColumnIndex(column.id);
                });
            };

            // v3.14.0.r - Binary search to find row containing Y coordinate
            const findRowByY = (rows, rowBoundaries, mouseY) => {
                if (rows.length === 0) return null;

                // Binary search for the row containing mouseY
                let low = 0;
                let high = rows.length - 1;

                // If mouse is above first row, return first row
                if (mouseY < rowBoundaries[0]) {
                    return { row: rows[0], rowIndex: 0, position: 'above' };
                }

                // If mouse is below last row, return last row
                if (mouseY > rows[rows.length - 1].bottom) {
                    return { row: rows[rows.length - 1], rowIndex: rows.length - 1, position: 'below' };
                }

                while (low <= high) {
                    const mid = Math.floor((low + high) / 2);
                    const row = rows[mid];

                    if (mouseY >= row.top && mouseY <= row.bottom) {
                        // Found the row containing mouseY
                        return { row, rowIndex: mid, position: 'within' };
                    } else if (mouseY < row.top) {
                        high = mid - 1;
                    } else {
                        low = mid + 1;
                    }
                }

                // Mouse is in gap between rows - find closest row
                // low now points to the row after the gap
                if (low < rows.length && low > 0) {
                    const prevRow = rows[low - 1];
                    const nextRow = rows[low];
                    const distToPrev = mouseY - prevRow.bottom;
                    const distToNext = nextRow.top - mouseY;
                    if (distToPrev <= distToNext) {
                        return { row: prevRow, rowIndex: low - 1, position: 'below' };
                    } else {
                        return { row: nextRow, rowIndex: low, position: 'above' };
                    }
                }

                // Fallback
                return { row: rows[0], rowIndex: 0, position: 'within' };
            };

            const calculateDropPosition = (e, columnId) => {
                const column = columns.find(c => c.id === columnId);
                if (!column) return null;

                // v3.14.0.r - Use cached column index for O(log R) lookup
                let colIndex = columnIndexRef.current[columnId];

                // If no index exists (shouldn't happen, but fallback), build it now
                if (!colIndex) {
                    colIndex = buildColumnIndex(columnId);
                }

                if (!colIndex || colIndex.rows.length === 0) {
                    // Empty column
                    return { columnId, index: 0 };
                }

                const mouseX = e.clientX;
                let mouseY = e.clientY;

                // v3.14.0.u - Adjust mouseY for scroll offset
                // The index was built with positions relative to the viewport at initialScrollTop.
                // If the column has scrolled since then, we need to transform mouseY to match
                // the original coordinate space by adding the scroll delta.
                if (colIndex.scrollContainer && colIndex.initialScrollTop !== undefined) {
                    const currentScrollTop = colIndex.scrollContainer.scrollTop;
                    const scrollDelta = currentScrollTop - colIndex.initialScrollTop;
                    mouseY += scrollDelta; // Adjust mouse position to original coordinate space
                }

                // Binary search to find the row
                const result = findRowByY(colIndex.rows, colIndex.rowBoundaries, mouseY);
                if (!result) {
                    return { columnId, index: 0 };
                }

                const { row, position } = result;

                // Handle position above/below row
                if (position === 'above') {
                    // Insert before the first item in this row
                    return { columnId, index: row.startIndex };
                }
                if (position === 'below') {
                    // Insert after the last item in this row
                    const lastItem = row.items[row.items.length - 1];
                    return { columnId, index: lastItem.index + 1 };
                }

                // Position is 'within' the row - determine exact position
                if (row.type === 'divider') {
                    // Divider row: use top/bottom half
                    const dividerItem = row.items[0];
                    const centerY = dividerItem.centerY;
                    const isBelowCenter = mouseY > centerY;
                    return { columnId, index: isBelowCenter ? dividerItem.index + 1 : dividerItem.index };
                }

                // Books row: use X position to find which book, then top/bottom half
                // Find which book the mouse is over (or closest to)
                let targetItem = row.items[0];
                for (const item of row.items) {
                    if (mouseX >= item.left && mouseX <= item.right) {
                        targetItem = item;
                        break;
                    }
                    // If mouse is to the right of this item but left of next, use this item
                    if (mouseX > item.right) {
                        targetItem = item;
                    }
                }

                // Use quadrant logic for books: right-of OR below-center = insert after
                const centerX = targetItem.left + (targetItem.right - targetItem.left) / 2;
                const centerY = targetItem.centerY;
                const isRightOfBook = mouseX > centerX;
                const isBelowBook = mouseY > centerY;

                const insertAfter = isRightOfBook || (!isRightOfBook && isBelowBook);
                return { columnId, index: insertAfter ? targetItem.index + 1 : targetItem.index };
            };

            // v3.14.0.w - Update indicator position directly via DOM (no React re-render)
            const updateIndicatorPosition = () => {
                const target = dropTargetRef.current;
                const indicator = indicatorRef.current;

                if (!indicator) return;

                if (!target || !isDragging) {
                    indicator.style.display = 'none';
                    return;
                }

                const colIndex = columnIndexRef.current[target.columnId];
                if (!colIndex) {
                    indicator.style.display = 'none';
                    return;
                }

                const { rows, columnRect, totalItems } = colIndex;
                const targetIndex = target.index;

                // v3.14.0.u - Calculate scroll delta to transform stored coordinates back to viewport
                let scrollDelta = 0;
                if (colIndex.scrollContainer && colIndex.initialScrollTop !== undefined) {
                    const currentScrollTop = colIndex.scrollContainer.scrollTop;
                    scrollDelta = currentScrollTop - colIndex.initialScrollTop;
                }

                // Default to full column width for divider-style indicators
                let left = columnRect.left;
                let width = columnRect.width;
                let top = columnRect.top - scrollDelta; // Adjust for scroll

                // Empty column case
                if (rows.length === 0 || totalItems === 0) {
                    // Apply styles directly
                    indicator.style.display = 'block';
                    indicator.style.top = (columnRect.top - scrollDelta - 3) + 'px';
                    indicator.style.left = left + 'px';
                    indicator.style.width = width + 'px';
                    return;
                }

                // Find the row and item at/before the target index
                let targetRow = null;
                let targetItem = null;
                let insertBefore = true; // Are we inserting before or after this item?

                for (const row of rows) {
                    for (const item of row.items) {
                        if (item.index === targetIndex) {
                            // Insert before this item
                            targetRow = row;
                            targetItem = item;
                            insertBefore = true;
                            break;
                        } else if (item.index === targetIndex - 1) {
                            // Insert after this item
                            targetRow = row;
                            targetItem = item;
                            insertBefore = false;
                        }
                    }
                    if (targetItem && insertBefore) break; // Found exact match
                }

                // Start of column (index 0, before first item)
                if (targetIndex === 0 && rows.length > 0) {
                    const firstRow = rows[0];
                    top = firstRow.top - scrollDelta; // Adjust for scroll
                    if (firstRow.type === 'books' && firstRow.items.length > 0) {
                        // Use first book's width
                        const firstItem = firstRow.items[0];
                        left = firstItem.left;
                        width = firstItem.right - firstItem.left;
                    }
                    indicator.style.display = 'block';
                    indicator.style.top = (top - 3) + 'px';
                    indicator.style.left = left + 'px';
                    indicator.style.width = width + 'px';
                    return;
                }

                // End of column (after last item)
                if (targetIndex >= totalItems) {
                    const lastRow = rows[rows.length - 1];
                    top = lastRow.bottom - scrollDelta; // Adjust for scroll
                    if (lastRow.type === 'books' && lastRow.items.length > 0) {
                        const lastItem = lastRow.items[lastRow.items.length - 1];
                        left = lastItem.left;
                        width = lastItem.right - lastItem.left;
                    }
                    indicator.style.display = 'block';
                    indicator.style.top = (top - 3) + 'px';
                    indicator.style.left = left + 'px';
                    indicator.style.width = width + 'px';
                    return;
                }

                // Normal case: between items
                if (targetRow && targetItem) {
                    if (insertBefore) {
                        top = targetItem.top - scrollDelta; // Adjust for scroll
                    } else {
                        top = targetItem.bottom - scrollDelta; // Adjust for scroll
                    }

                    // For books, use the item's width; for dividers, use full width
                    if (targetRow.type === 'books') {
                        left = targetItem.left;
                        width = targetItem.right - targetItem.left;
                    }
                    indicator.style.display = 'block';
                    indicator.style.top = (top - 3) + 'px';
                    indicator.style.left = left + 'px';
                    indicator.style.width = width + 'px';
                    return;
                }

                // Fallback: position at column top
                indicator.style.display = 'block';
                indicator.style.top = (columnRect.top - scrollDelta - 3) + 'px';
                indicator.style.left = left + 'px';
                indicator.style.width = width + 'px';
            };

            // v3.14.0.x - Update ghost position via DOM (no React re-render)
            const updateGhostPosition = (x, y) => {
                dragPosRef.current = { x, y };
                const ghost = dragGhostRef.current;
                if (ghost) {
                    ghost.style.left = (x - 50) + 'px';
                    ghost.style.top = (y - 75) + 'px';
                }
                // v4.16.0.au - Update tooltip position (below ghost)
                // v4.16.0.ax - Measure actual ghost height to position tooltip correctly
                const tooltip = dragTooltipRef.current;
                if (tooltip && ghost) {
                    const ghostHeight = ghost.offsetHeight || 150;  // Fallback to 150 if not measured yet
                    const tooltipGap = 8;  // Gap between ghost bottom and tooltip
                    tooltip.style.left = (x - 50) + 'px';
                    tooltip.style.top = (y - 75 + ghostHeight + tooltipGap) + 'px';
                }
            };

            // v4.16.0.au - Update drag tooltip text based on copy mode and target column
            // v4.16.0.ay - Added isInvalid parameter for invalid drop targets
            const updateDragTooltip = (isCopy, targetColumnId, isInvalid = false) => {
                const tooltip = dragTooltipRef.current;
                if (!tooltip) return;

                if (isInvalid) {
                    tooltip.textContent = `🚫 Can't drop here`;
                    tooltip.style.display = 'block';
                    return;
                }

                const targetColumn = columns.find(c => c.id === targetColumnId);
                const columnName = targetColumn ? targetColumn.name : '';  // v4.16.0.aw - Fix: columns use .name not .title

                if (columnName) {
                    tooltip.textContent = isCopy ? `+ Copy to ${columnName}` : `→ Move to ${columnName}`;
                    tooltip.style.display = 'block';
                } else {
                    tooltip.style.display = 'none';
                }
            };

            const handleMouseMove = (e) => {
                // v5.0.0-alpha.111 - Handle column resizing (min width 35px, table-layout fixed)
                if (resizingColumn) {
                    const deltaX = e.clientX - resizingColumn.startX;
                    const newWidth = Math.max(35, resizingColumn.startWidth + deltaX);

                    // Update CSS custom property directly (no React re-render)
                    document.documentElement.style.setProperty(`--col-${resizingColumn.columnId}`, `${newWidth}px`);

                    // Store current width for mouseup commit
                    resizingColumn.currentWidth = newWidth;
                    return;
                }

                // v5.0.0-alpha.91 - Handle pane resizing
                if (isResizingPane) {
                    const newWidth = Math.max(200, Math.min(600, e.clientX));
                    setLeftPaneWidth(newWidth);
                    return;
                }

                if (draggedColumn) {
                    setDragCurrentPos({ x: e.clientX, y: e.clientY }); // Column drag still uses state (low volume)

                    const deltaX = e.clientX - dragStartPos.x;
                    const deltaY = e.clientY - dragStartPos.y;
                    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                    if (distance > dragThreshold) {
                        if (!isDraggingColumn) {
                            setIsDraggingColumn(true);
                        }
                        const dropPos = calculateColumnDropPosition(e);
                        setColumnDropTarget(dropPos);
                    }
                    return;
                }

                if (!draggedBook) return;

                // v3.14.0.x - Update ghost position via DOM (no React re-render)
                updateGhostPosition(e.clientX, e.clientY);

                const deltaX = e.clientX - dragStartPos.x;
                const deltaY = e.clientY - dragStartPos.y;
                const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);

                if (distance > dragThreshold) {
                    if (!isDragging) {
                        setIsDragging(true);
                        // v3.14.0.r - Build column indexes once at drag start for O(log R) lookup
                        buildAllColumnIndexes();
                    }

                    // v4.16.0.au - Track Ctrl state during drag for copy mode
                    isCopyDragRef.current = e.ctrlKey || e.metaKey;

                    const target = e.target.closest('[data-column-id]');
                    if (target) {
                        const columnId = target.dataset.columnId;
                        // v3.14.0.g - Use cursor position for drop detection (matches ghost center)
                        const dropPos = calculateDropPosition(e, columnId);

                        // v3.14.0.w - Update ref instead of state to avoid React re-renders
                        dropTargetRef.current = dropPos;
                        updateIndicatorPosition();

                        // v4.16.0.au - Update drag tooltip with copy/move and target column
                        updateDragTooltip(isCopyDragRef.current, columnId);

                        // v3.14.0.h - Debug logging when drop target changes
                        const prevDropTarget = prevDropTargetRef.current;
                        const dropTargetChanged = !prevDropTarget ||
                            prevDropTarget.columnId !== dropPos.columnId ||
                            prevDropTarget.index !== dropPos.index;

                        if (dropTargetChanged) {
                            prevDropTargetRef.current = dropPos;
                        }

                        // v3.12.0.c - Auto-scroll when dragging near column edges
                        // Use dragged book position (center of ghost) instead of cursor position
                        // Scroll speed proportional to proximity (closer = faster)
                        const columnElement = target.querySelector('.overflow-y-auto');
                        if (columnElement) {
                            const rect = columnElement.getBoundingClientRect();
                            const edgeThreshold = 100; // pixels from top/bottom to trigger scroll
                            const minScrollSpeed = 2; // pixels per interval at threshold edge
                            const maxScrollSpeed = 20; // pixels per interval at column edge
                            const scrollInterval = 50; // milliseconds

                            // Calculate dragged book's center position (ghost is at dragPosRef.current.y - 75, with height ~150px)
                            // v3.14.0.x - Use ref instead of state
                            const draggedBookCenterY = dragPosRef.current.y;

                            const distanceFromTop = draggedBookCenterY - rect.top;
                            const distanceFromBottom = rect.bottom - draggedBookCenterY;

                            // Clear existing auto-scroll interval
                            if (autoScrollInterval) {
                                clearInterval(autoScrollInterval);
                                setAutoScrollInterval(null);
                            }

                            // Start scrolling up if book center near top edge
                            if (distanceFromTop < edgeThreshold && distanceFromTop > 0) {
                                // Calculate proportional speed: closer to edge = faster
                                // distanceFromTop: 0px (at edge) → 100px (threshold edge)
                                // speed: maxScrollSpeed (at edge) → minScrollSpeed (threshold edge)
                                const proximity = 1 - (distanceFromTop / edgeThreshold); // 1.0 at edge, 0.0 at threshold
                                const scrollSpeed = minScrollSpeed + (proximity * (maxScrollSpeed - minScrollSpeed));

                                const interval = setInterval(() => {
                                    columnElement.scrollTop = Math.max(0, columnElement.scrollTop - scrollSpeed);
                                    // v3.14.0.u - No longer rebuild index; scroll offset calculated dynamically
                                }, scrollInterval);
                                setAutoScrollInterval(interval);
                            }
                            // Start scrolling down if book center near bottom edge
                            else if (distanceFromBottom < edgeThreshold && distanceFromBottom > 0) {
                                // Calculate proportional speed: closer to edge = faster
                                const proximity = 1 - (distanceFromBottom / edgeThreshold);
                                const scrollSpeed = minScrollSpeed + (proximity * (maxScrollSpeed - minScrollSpeed));

                                const interval = setInterval(() => {
                                    columnElement.scrollTop = Math.min(
                                        columnElement.scrollHeight - columnElement.clientHeight,
                                        columnElement.scrollTop + scrollSpeed
                                    );
                                    // v3.14.0.u - No longer rebuild index; scroll offset calculated dynamically
                                }, scrollInterval);
                                setAutoScrollInterval(interval);
                            }
                        }
                    } else {
                        // v3.14.0.w - Clear ref and hide indicator
                        dropTargetRef.current = null;
                        updateIndicatorPosition();
                        // v4.16.0.ay - Show invalid drop target tooltip
                        updateDragTooltip(false, null, true);
                        // Clear auto-scroll if mouse leaves column
                        if (autoScrollInterval) {
                            clearInterval(autoScrollInterval);
                            setAutoScrollInterval(null);
                        }
                    }
                }
            };

            const handleMouseUp = (e) => {
                // v5.0.0-alpha.110 - Stop column resizing and commit final width
                if (resizingColumn) {
                    // Commit final width to React state
                    if (resizingColumn.currentWidth !== undefined) {
                        setColumnWidths(prev => ({
                            ...prev,
                            [resizingColumn.columnId]: resizingColumn.currentWidth
                        }));
                    }

                    // Clear CSS custom property
                    document.documentElement.style.removeProperty(`--col-${resizingColumn.columnId}`);

                    setResizingColumn(null);
                    return;
                }

                // v5.0.0-alpha.91 - Stop pane resizing
                if (isResizingPane) {
                    setIsResizingPane(false);
                    return;
                }

                // v3.12.0 - Clear auto-scroll interval when drag ends
                if (autoScrollInterval) {
                    clearInterval(autoScrollInterval);
                    setAutoScrollInterval(null);
                }

                if (isDraggingColumn && draggedColumn && columnDropTarget !== null) {
                    const currentIndex = columns.findIndex(c => c.id === draggedColumn);
                    if (currentIndex !== -1 && currentIndex !== columnDropTarget) {
                        const newColumns = [...columns];
                        const [movedColumn] = newColumns.splice(currentIndex, 1);
                        const adjustedIndex = currentIndex < columnDropTarget ? columnDropTarget - 1 : columnDropTarget;
                        newColumns.splice(adjustedIndex, 0, movedColumn);
                        setColumns(newColumns);
                        // v4.8.0 - Record action for undo
                        recordAction({
                            type: 'REORDER_COLUMNS',
                            columnId: draggedColumn,
                            fromIndex: currentIndex,
                            toIndex: adjustedIndex
                        });
                    }

                    setDraggedColumn(null);
                    setIsDraggingColumn(false);
                    setColumnDropTarget(null);
                    return;
                }

                // v3.14.0.w - Read from ref instead of state
                const dropTarget = dropTargetRef.current;

                if (!isDragging || !draggedBook || !dropTarget) {
                    setDraggedBook(null);
                    setDraggedFromColumn(null);
                    setIsDragging(false);
                    dropTargetRef.current = null;
                    updateIndicatorPosition();
                    setDraggedColumn(null);
                    setIsDraggingColumn(false);
                    setColumnDropTarget(null);
                    return;
                }

                const sourceColumn = columns.find(c => c.id === draggedFromColumn);
                const targetColumn = columns.find(c => c.id === dropTarget.columnId);

                if (!sourceColumn || !targetColumn) {
                    console.error('Invalid source or target column');
                    setDraggedBook(null);
                    setDraggedFromColumn(null);
                    setIsDragging(false);
                    dropTargetRef.current = null;
                    updateIndicatorPosition();
                    clearSelection();
                    return;
                }

                // v3.13.0 - Handle dividers (can move with their book group if selected)
                const isDivider = typeof draggedBook === 'object' && draggedBook.type === 'divider';

                // v4.16.0.ae/af - Determine which items to move using indices (not bookIds)
                // This fixes bug where dragging one instance of a duplicated book affected all copies
                // v4.16.0.af - Include columnId to support multi-column selection
                let itemsToMoveInfo; // Array of {columnId, index, entry, bookId} or divider objects
                let isDraggingSelection = false;

                if (isDivider) {
                    // v3.13.0 - If divider is selected, move divider + all books in its group
                    if (selectedDivider && selectedDivider.dividerId === draggedBook.id) {
                        // Build array: divider + selected entries
                        const selectedEntries = getSelectedEntries();
                        itemsToMoveInfo = [
                            { isDivider: true, divider: draggedBook, columnId: draggedFromColumn },
                            ...selectedEntries.map(sel => ({ columnId: sel.columnId, index: sel.index, entry: sel.entry, bookId: sel.bookId }))
                        ];
                        isDraggingSelection = true;
                    } else {
                        // Divider not selected: move alone
                        itemsToMoveInfo = [{ isDivider: true, divider: draggedBook, columnId: draggedFromColumn }];
                    }
                } else {
                    // Regular book: move selection or just this book
                    // v4.16.0.d - Use composite key with index for selection check
                    const isInSelection = selectedBooks.size > 0 && selectedBooks.has(`${draggedFromColumn}:${draggedBook.id}:${draggedBookIndex}`);
                    if (isInSelection) {
                        // Move all selected books - use getSelectedEntries for accurate indices
                        // v4.16.0.af - Include columnId for multi-column selection support
                        const selectedEntries = getSelectedEntries();
                        itemsToMoveInfo = selectedEntries.map(sel => ({ columnId: sel.columnId, index: sel.index, entry: sel.entry, bookId: sel.bookId }));
                        isDraggingSelection = true;
                    } else {
                        // Move just the dragged book - use draggedBookIndex
                        const sourceCol = columns.find(c => c.id === draggedFromColumn);
                        itemsToMoveInfo = [{
                            columnId: draggedFromColumn,
                            index: draggedBookIndex,
                            entry: sourceCol.books[draggedBookIndex],
                            bookId: draggedBook.id
                        }];
                    }
                }

                if (draggedFromColumn === dropTarget.columnId) {
                    // Same column: reorder or copy
                    // v4.16.0.ae - Extract indices and entries from itemsToMoveInfo
                    const bookEntries = itemsToMoveInfo.filter(item => !item.isDivider);
                    const dividerEntry = itemsToMoveInfo.find(item => item.isDivider);
                    const fromIndicesReorder = bookEntries.map(item => item.index);
                    const bookIdsToMove = bookEntries.map(item => item.bookId);

                    // v4.16.0.au - Check if this is a copy operation (Ctrl held) - books only, not dividers
                    const isCopyOperation = isCopyDragRef.current && !isDivider;

                    if (isCopyOperation && bookEntries.length > 0) {
                        // v4.16.0.au - COPY within same column: Create new GUID entries at drop position
                        // v4.16.0.be - Capture isHidden for both GUID and legacy entries
                        const newEntries = bookEntries.map(item => {
                            const sourceInstanceId = typeof item.entry === 'object' && item.entry.instanceId ? item.entry.instanceId : null;
                            const book = books.find(b => b.id === item.bookId);
                            // v4.16.0.be - Determine hidden state: GUID uses hiddenInstances, legacy uses book.isHidden
                            const sourceIsHidden = sourceInstanceId
                                ? hiddenInstances.has(sourceInstanceId)
                                : (book?.isHidden || false);
                            return {
                                instanceId: generateInstanceId(),
                                bookId: item.bookId,
                                sourceIsHidden
                            };
                        });

                        // Copy hidden state for instances that were hidden
                        // v4.16.0.be - Use sourceIsHidden (supports legacy entries)
                        const newHiddenInstanceIds = newEntries
                            .filter(entry => entry.sourceIsHidden)
                            .map(entry => entry.instanceId);

                        if (newHiddenInstanceIds.length > 0) {
                            setHiddenInstances(prev => {
                                const updated = new Set(prev);
                                newHiddenInstanceIds.forEach(id => updated.add(id));
                                return updated;
                            });
                        }

                        // Clean entries before storing
                        const cleanEntries = newEntries.map(({ instanceId, bookId }) => ({ instanceId, bookId }));

                        const currentCol = columns.find(c => c.id === draggedFromColumn);
                        setColumns(columns.map(col => {
                            if (col.id === draggedFromColumn) {
                                const newBooks = [...col.books];
                                const insertIndex = Math.min(dropTarget.index, newBooks.length);
                                newBooks.splice(insertIndex, 0, ...cleanEntries);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));

                        // Record COPY_BOOKS action for undo
                        recordAction({
                            type: 'COPY_BOOKS',
                            bookIds: [...bookIdsToMove],
                            entries: [...cleanEntries],
                            toColId: draggedFromColumn,
                            toIndex: dropTarget.index
                        });

                        console.log(`📋 Copied ${cleanEntries.length} book(s) within ${currentCol.title}`);
                    } else {
                        // v4.8.0 - Capture divider's original index for undo
                        const currentCol = columns.find(c => c.id === draggedFromColumn);
                        const dividerFromIndex = isDivider ? currentCol.books.findIndex(b =>
                            typeof b === 'object' && b.type === 'divider' && b.id === draggedBook.id
                        ) : -1;

                        setColumns(columns.map(col => {
                            if (col.id === draggedFromColumn) {
                                const newBooks = [...col.books];

                                // v4.16.0.ae - Collect indices to remove (divider index + book indices)
                                const indicesToRemove = new Set(fromIndicesReorder);
                                if (dividerEntry && dividerFromIndex !== -1) {
                                    indicesToRemove.add(dividerFromIndex);
                                }

                                // v4.16.0.ae - Remove entries by index, preserving them for re-insertion
                                // Sort indices descending so we can splice without affecting other indices
                                const sortedIndices = Array.from(indicesToRemove).sort((a, b) => b - a);
                                const removedEntries = [];
                                sortedIndices.forEach(idx => {
                                    removedEntries.unshift(newBooks[idx]); // unshift to maintain order
                                    newBooks.splice(idx, 1);
                                });

                                // Calculate adjusted insert index
                                let adjustedIndex = dropTarget.index;
                                sortedIndices.forEach(idx => {
                                    if (idx < dropTarget.index) {
                                        adjustedIndex--;
                                    }
                                });

                                // Insert all items at the target position (preserving original format)
                                newBooks.splice(adjustedIndex, 0, ...removedEntries);

                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));

                        // v4.8.0 - Record REORDER_BOOKS action (only for books, not dividers)
                        // v4.16.0.aj - Store entries for proper undo with GUID support
                        if (bookIdsToMove.length > 0 && !isDivider) {
                            recordAction({
                                type: 'REORDER_BOOKS',
                                bookIds: [...bookIdsToMove],
                                entries: bookEntries.map(item => item.entry), // v4.16.0.aj
                                colId: draggedFromColumn,
                                fromIndices: fromIndicesReorder,
                                toIndex: dropTarget.index
                            });
                        }
                        // v4.8.0 - Record REORDER_DIVIDER action
                        if (isDivider && dividerFromIndex !== -1) {
                            recordAction({
                                type: 'REORDER_DIVIDER',
                                dividerId: draggedBook.id,
                                dividerLabel: draggedBook.label,
                                colId: draggedFromColumn,
                                fromIndex: dividerFromIndex,
                                toIndex: dropTarget.index
                            });
                        }
                    }
                } else {
                    // Cross-column: move or copy items (dividers can only move within same column)
                    if (isDivider) {
                        console.log('Dividers cannot be moved between columns');
                        setDraggedBook(null);
                        setDraggedFromColumn(null);
                        setIsDragging(false);
                        dropTargetRef.current = null;
                        updateIndicatorPosition();
                        return;
                    }

                    // v4.16.0.au - Check if this is a copy operation (Ctrl held)
                    const isCopyOperation = isCopyDragRef.current;

                    // v4.16.0.af - Group items by source column to handle multi-column selection
                    const targetCol = columns.find(c => c.id === dropTarget.columnId);
                    const bookIdsToMove = itemsToMoveInfo.map(item => item.bookId);
                    const actualToIndex = Math.min(dropTarget.index, targetCol.books.length);

                    if (isCopyOperation) {
                        // v4.16.0.au - COPY: Create new GUID entries, don't remove from source
                        // v4.16.0.be - Capture isHidden for both GUID and legacy entries
                        const newEntries = itemsToMoveInfo.map(item => {
                            const sourceInstanceId = typeof item.entry === 'object' && item.entry.instanceId ? item.entry.instanceId : null;
                            const book = books.find(b => b.id === item.bookId);
                            // v4.16.0.be - Determine hidden state: GUID uses hiddenInstances, legacy uses book.isHidden
                            const sourceIsHidden = sourceInstanceId
                                ? hiddenInstances.has(sourceInstanceId)
                                : (book?.isHidden || false);
                            return {
                                instanceId: generateInstanceId(),
                                bookId: item.bookId,
                                sourceIsHidden
                            };
                        });

                        // Copy hidden state for instances that were hidden
                        // v4.16.0.be - Use sourceIsHidden (supports legacy entries)
                        const newHiddenInstanceIds = newEntries
                            .filter(entry => entry.sourceIsHidden)
                            .map(entry => entry.instanceId);

                        if (newHiddenInstanceIds.length > 0) {
                            setHiddenInstances(prev => {
                                const updated = new Set(prev);
                                newHiddenInstanceIds.forEach(id => updated.add(id));
                                return updated;
                            });
                        }

                        // Clean entries before storing (remove sourceInstanceId)
                        const cleanEntries = newEntries.map(({ instanceId, bookId }) => ({ instanceId, bookId }));

                        setColumns(columns.map(col => {
                            if (col.id === dropTarget.columnId) {
                                const newBooks = [...col.books];
                                const insertIndex = Math.min(dropTarget.index, newBooks.length);
                                newBooks.splice(insertIndex, 0, ...cleanEntries);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));

                        // Record COPY_BOOKS action for undo
                        recordAction({
                            type: 'COPY_BOOKS',
                            bookIds: [...bookIdsToMove],
                            entries: [...cleanEntries],
                            toColId: dropTarget.columnId,
                            toIndex: actualToIndex
                        });

                        console.log(`📋 Copied ${cleanEntries.length} book(s) to ${targetCol.title}`);
                    } else {
                        // v4.16.0.af - MOVE: Remove from source, add to target
                        const entriesToMove = itemsToMoveInfo.map(item => item.entry);

                        // Build map of columnId -> Set of indices to remove
                        const indicesToRemoveByColumn = new Map();
                        itemsToMoveInfo.forEach(item => {
                            if (!indicesToRemoveByColumn.has(item.columnId)) {
                                indicesToRemoveByColumn.set(item.columnId, new Set());
                            }
                            indicesToRemoveByColumn.get(item.columnId).add(item.index);
                        });

                        // For undo, capture fromIndices from the primary drag column
                        const fromIndices = itemsToMoveInfo
                            .filter(item => item.columnId === draggedFromColumn)
                            .map(item => item.index);

                        setColumns(columns.map(col => {
                            // Check if this column has items to remove
                            const indicesToRemove = indicesToRemoveByColumn.get(col.id);
                            if (indicesToRemove && indicesToRemove.size > 0) {
                                // Remove by index from this source column
                                const filteredBooks = col.books.filter((_, idx) => !indicesToRemove.has(idx));
                                // If this is also the target, add entries
                                if (col.id === dropTarget.columnId) {
                                    const newBooks = [...filteredBooks];
                                    const insertIndex = Math.min(dropTarget.index, newBooks.length);
                                    newBooks.splice(insertIndex, 0, ...entriesToMove);
                                    return { ...col, books: newBooks };
                                }
                                return { ...col, books: filteredBooks };
                            }
                            if (col.id === dropTarget.columnId) {
                                // Add original entries to target column (preserving format)
                                const newBooks = [...col.books];
                                const insertIndex = Math.min(dropTarget.index, newBooks.length);
                                newBooks.splice(insertIndex, 0, ...entriesToMove);
                                return { ...col, books: newBooks };
                            }
                            return col;
                        }));

                        // v4.8.0 - Record action for undo
                        // v4.16.0.aj - Store entries for proper undo with GUID support
                        recordAction({
                            type: 'MOVE_BOOKS',
                            bookIds: [...bookIdsToMove],
                            entries: [...entriesToMove],
                            fromColId: draggedFromColumn,
                            toColId: dropTarget.columnId,
                            fromIndices,
                            toIndex: actualToIndex
                        });
                    }
                }

                new Image().src = 'https://readerwrangler.goatcounter.com/count?p=/event/book-dragged';
                setDraggedBook(null);
                setDraggedFromColumn(null);
                setIsDragging(false);
                dropTargetRef.current = null;
                updateIndicatorPosition();
                clearSelection();
            };

            const getAllCollectionNames = () => {
                const collectionNames = new Set();
                books.forEach(book => {
                    if (book.collections && book.collections.length > 0) {
                        book.collections.forEach(c => collectionNames.add(c.name));
                    }
                });
                return Array.from(collectionNames).sort();
            };

            const getAllSeriesNames = () => {
                const seriesNames = new Set();
                books.forEach(book => {
                    if (book.series && book.series.trim() !== '') {
                        seriesNames.add(book.series);
                    }
                });
                return Array.from(seriesNames).sort();
            };

            const filteredBooks = (bookIds) => {
                // Check if any filter is active (needed inside function scope for divider hiding)
                const filtersActive = !!(searchTerm || readStatusFilter || collectionFilter ||
                    ratingFilter || wishlistFilter || ownershipFilter || seriesFilter || dateFrom || dateTo || dealsFilterActive ||
                    (tagFilter && tagFilter.length > 0));

                // v4.27.0 - Track current divider tags for inheritance during map
                let currentDivTags = [];
                const result = bookIds.map(item => {
                    // v3.11.0 - Handle dividers (pass through as-is, but track their tags)
                    if (typeof item === 'object' && item.type === 'divider') {
                        currentDivTags = item.tags || [];  // v4.27.0 - track for inheritance
                        return item;
                    }
                    // v4.16.0.s - Handle both legacy string and new {instanceId, bookId} format
                    const bookId = getBookIdFromEntry(item);
                    const instanceId = getInstanceId(item);
                    const book = books.find(b => b.id === bookId);
                    // Attach instanceId to book for per-instance hidden check
                    // v4.27.0 - Also attach inherited tags from current divider
                    if (book) {
                        return { ...book, _instanceId: instanceId, _inheritedTags: currentDivTags };
                    }
                    return book;
                }).filter(book => {
                    // v3.11.0 - Dividers always pass through filters (will be post-processed below)
                    if (typeof book === 'object' && book.type === 'divider') return true;

                    if (!book) return false;

                    // Text search filter
                    const matchesSearch = !searchTerm ||
                        book.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                        book.author.toLowerCase().includes(searchTerm.toLowerCase());

                    // Read status filter
                    const matchesReadStatus = !readStatusFilter || book.readStatus === readStatusFilter;

                    // Collection filter
                    let matchesCollection = true;
                    if (collectionFilter) {
                        if (collectionFilter === 'UNCOLLECTED') {
                            matchesCollection = !book.collections || book.collections.length === 0;
                        } else {
                            matchesCollection = book.collections &&
                                book.collections.some(c => c.name === collectionFilter);
                        }
                    }

                    // Rating filter (NEW v3.8.0)
                    const matchesRating = !ratingFilter || (book.rating >= parseFloat(ratingFilter));

                    // Wishlist filter (NEW v3.8.0, v4.18.0.a - onWishlist replaces isWishlist)
                    const matchesWishlist = !wishlistFilter ||
                        (wishlistFilter === 'wishlist' && book.onWishlist) ||
                        (wishlistFilter === 'owned' && !book.onWishlist);

                    // Ownership type filter (NEW v4.9.0)
                    const matchesOwnership = !ownershipFilter ||
                        (book.ownershipType || 'purchased') === ownershipFilter;

                    // Hidden filter (v4.1.0.d, v4.16.0.s - per-instance hidden support)
                    // New format: check hiddenInstances Set by instanceId
                    // Legacy format: check book.isHidden flag
                    let matchesHidden = true;
                    if (!showHidden) {
                        if (book._instanceId) {
                            // New format - check per-instance hidden
                            matchesHidden = !hiddenInstances.has(book._instanceId);
                        } else {
                            // Legacy format - check book-level hidden
                            matchesHidden = !book.isHidden;
                        }
                    }

                    // Series filter (NEW v3.8.0.k)
                    let matchesSeries = true;
                    if (seriesFilter) {
                        if (seriesFilter === 'NOT_IN_SERIES') {
                            matchesSeries = !book.series || book.series.trim() === '';
                        } else {
                            matchesSeries = book.series && book.series === seriesFilter;
                        }
                    }

                    // Date range filter (NEW v3.8.0.k, fixed v3.8.0.l for epoch milliseconds and field name)
                    let matchesDateRange = true;
                    if (dateFrom || dateTo) {
                        if (book.acquired) {
                            // Convert epoch milliseconds to YYYY-MM-DD
                            const bookDate = new Date(parseInt(book.acquired)).toISOString().split('T')[0];
                            const fromDate = dateFrom || '0000-01-01'; // Default to earliest date if From is empty
                            const toDate = dateTo || new Date().toISOString().split('T')[0]; // Default to today if To is empty

                            if (bookDate < fromDate || bookDate > toDate) {
                                matchesDateRange = false;
                            }
                        } else {
                            matchesDateRange = false; // Exclude books without acquisition dates when filter is active
                        }
                    }

                    // Deals filter (v4.17.0.j, v4.18.0.a - onWishlist replaces isWishlist)
                    const matchesDeals = !dealsFilterActive ||
                        (book.onWishlist && book.priceTrigger != null && book.currentPrice != null && book.currentPrice <= book.priceTrigger);

                    // Tag filter (v4.27.0 - OR logic: book matches if it has ANY of the selected tags)
                    // Check both explicit tags and inherited tags from dividers
                    const explicitMatch = book.tags && book.tags.some(tag => tagFilter.includes(tag));
                    const inheritedMatch = book._inheritedTags && book._inheritedTags.some(tag => tagFilter.includes(tag));
                    const matchesTags = !tagFilter || tagFilter.length === 0 || explicitMatch || inheritedMatch;

                    return matchesSearch && matchesReadStatus && matchesCollection && matchesRating && matchesWishlist && matchesOwnership && matchesHidden && matchesSeries && matchesDateRange && matchesDeals && matchesTags;
                });

                // v4.15.3 - Post-process: hide dividers with no books under them when filters active
                if (!filtersActive) return result;

                // Walk backwards through array, tracking if we've seen a book since last divider
                // A divider is kept only if there's at least one book between it and the next divider (or end)
                // v4.15.4.a - Also keep divider if its label matches searchTerm
                let hasBookAfter = false;
                const keepDivider = new Set();
                for (let i = result.length - 1; i >= 0; i--) {
                    const item = result[i];
                    if (item && item.type === 'divider') {
                        if (hasBookAfter) {
                            keepDivider.add(item.id);
                        }
                        // v4.15.4.a - Keep divider if its label matches search term
                        if (searchTerm && item.label && item.label.toLowerCase().includes(searchTerm.toLowerCase())) {
                            keepDivider.add(item.id);
                        }
                        hasBookAfter = false; // Reset for next divider section
                    } else if (item) {
                        hasBookAfter = true;
                    }
                }

                return result.filter(item => {
                    if (item && item.type === 'divider') {
                        return keepDivider.has(item.id);
                    }
                    return true;
                });
            };

            // v4.0.1 - Keep filteredBooksRef updated for Ctrl+A handler
            filteredBooksRef.current = filteredBooks;

            // v4.16.0.a - Check if any filter is active (for hiding empty columns/dividers)
            const hasActiveFilters = !!(searchTerm || readStatusFilter || collectionFilter ||
                ratingFilter || wishlistFilter || ownershipFilter || seriesFilter || dateFrom || dateTo ||
                (tagFilter && tagFilter.length > 0));

            // Calculate combined urgency from Library and Collections status
            // Urgency is based ONLY on Load status (what's in the app right now)
            const getUrgencyInfo = () => {
                const libLoad = libraryStatus.loadStatus;
                const colLoad = collectionsStatus.loadStatus;

                // Priority: empty/obsolete > stale > unknown > fresh
                const urgencyOrder = { empty: 4, obsolete: 3, stale: 2, unknown: 1, fresh: 0 };
                const worstStatus = urgencyOrder[libLoad] >= urgencyOrder[colLoad] ? libLoad : colLoad;

                const urgencyMap = {
                    empty: { icon: '🛑', text: 'Must act', color: 'text-red-600', tooltip: 'Please click to see required action(s)' },
                    obsolete: { icon: '🛑', text: 'Obsolete', color: 'text-red-600', tooltip: 'Please click to see required action(s)' },
                    stale: { icon: '⚠️', text: 'Stale', color: 'text-orange-600', tooltip: 'Please click to see suggested action(s)' },
                    unknown: { icon: '❓', text: 'Unknown', color: 'text-gray-500', tooltip: 'Please click to see available info' },
                    fresh: { icon: '✅', text: 'Fresh', color: 'text-green-700', tooltip: 'No actions required' }
                };

                return urgencyMap[worstStatus] || urgencyMap.unknown;
            };

            const renderStatusIndicator = () => {
                const urgency = getUrgencyInfo();
                const isLoading = syncStatus === 'loading';

                if (isLoading) {
                    return (
                        <span className="text-sm text-gray-500">
                            <span className="inline-block animate-spin mr-1">⏳</span>
                            Loading...
                        </span>
                    );
                }

                return (
                    <span
                        className={`text-sm ${urgency.color} status-indicator`}
                        onClick={() => setStatusModalOpen(true)}
                        title={urgency.tooltip}
                    >
                        <span className="mr-1">{urgency.icon}</span>
                        Data Status: {urgency.text}
                    </span>
                );
            };

            return (
                <div className="h-screen flex flex-col bg-gradient-to-br from-blue-50 to-blue-100 text-gray-900"
                     onMouseMove={handleMouseMove}
                     onMouseUp={handleMouseUp}>
                    {/* v4.16.0.l - CSS for toast animation */}
                    {/* v4.16.0.m - 1.0s ease-in animation for gravity-like falling */}
                    {/* v4.16.0.p - Gray bg with dark text (was light blue) */}
                    <style>{`
                        .clipboard-toast {
                            position: fixed;
                            background: #f3f4f6;
                            color: #374151;
                            padding: 12px 24px;
                            border-radius: 8px;
                            font-size: 14px;
                            font-weight: 500;
                            box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
                            z-index: 9999;
                            transition: all 1.0s ease-in;
                        }

                        .clipboard-toast.animating {
                            background: transparent;
                            color: #6b7280;
                            box-shadow: none;
                            font-size: 12px;
                            padding: 0;
                        }
                    `}</style>
                    <div className="bg-white border-b border-gray-300 p-4 shadow-sm">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-start gap-3">
                                <img src="icons/ReaderWranglerWordlessXparent.png" alt="" style={{ width: '84px', height: 'auto', marginTop: '2px' }} />
                                <div>
                                    <h1 className="app-title">
                                        <a href="index.html" style={{ color: 'inherit', textDecoration: 'none' }} title="Wrangle your reader chaos">
                                            ReaderWrangler™
                                        </a>
                                        <span style={{ fontFamily: "'Lato', sans-serif", fontWeight: 300, color: '#64748b', fontSize: '0.875rem', marginLeft: '0.75rem' }}>v{APP_VERSION}</span>
                                    </h1>
                                    <p className="attribution">A product of Alloid Labs™</p>
                                    <p className="tagline">Your books, your order</p>
                                </div>
                            </div>
                            <div className="flex gap-2 items-center">
                                {renderStatusIndicator()}
                                <span className="text-gray-300 mx-1">|</span>
                                {/* v5.0.0 - View mode toggle */}
                                <button
                                    onClick={() => setViewMode(viewMode === 'columns' ? 'explorer' : 'columns')}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium ${viewMode === 'explorer'
                                        ? 'bg-blue-500 text-white border border-blue-600'
                                        : 'bg-white hover:bg-gray-50 text-blue-700 border border-blue-300'}`}
                                    title={viewMode === 'columns' ? 'Switch to Explorer view (folder tree)' : 'Switch to Columns view'}>
                                    {viewMode === 'columns' ? '📁 Explorer' : '📊 Columns'}
                                </button>
                                {/* v4.16.0.q - Subtle button styling (Option 3) */}
                                <button onClick={importLibrary}
                                        className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium"
                                        title="Import library file - merges with existing books, preserving your organization. Also restores from backup files.">
                                    📥 Import
                                </button>
                                <button onClick={exportLibrary}
                                        className="px-3 py-2 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 rounded-lg text-sm font-medium"
                                        disabled={books.length === 0}
                                        title="Save backup with your organization">
                                    💾 Export
                                </button>
                                <button onClick={clearLibrary}
                                        className="px-3 py-2 bg-white hover:bg-gray-50 text-red-700 border border-gray-300 rounded-lg text-sm font-medium"
                                        title="Click for details about what will be reset">
                                    🗑️ Reset App
                                </button>
                                <button 
                                    onClick={() => setSettingsOpen(!settingsOpen)}
                                    className="text-gray-600 hover:text-gray-700 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full bg-gray-200 hover:bg-gray-300"
                                    title="Settings">
                                    ⚙️
                                </button>
                                <button 
                                    onClick={() => setHelpOpen(!helpOpen)}
                                    className="text-blue-700 hover:text-blue-800 text-2xl font-bold w-8 h-8 flex items-center justify-center rounded-full bg-blue-100 hover:bg-blue-200"
                                    title="Help & Instructions">
                                    ?
                                </button>
                            </div>
                        </div>

                        {/* Filter Panel (v4.15.5.e - Three-state toggle: Filters → More Filters → Hide) */}
                        <div className="flex flex-wrap gap-2 items-start mb-4">
                            {/* Three-State Filter Toggle Button - fixed width to prevent jumping */}
                            <button
                                onClick={() => {
                                    // v4.15.5.e - Three-state cycle: closed → primary → advanced → closed
                                    if (!filterPanelOpen) {
                                        setFilterPanelOpen(true);
                                        setShowAdvancedFilters(false);
                                    } else if (!showAdvancedFilters) {
                                        setShowAdvancedFilters(true);
                                    } else {
                                        setFilterPanelOpen(false);
                                        setShowAdvancedFilters(false);
                                    }
                                }}
                                className={`px-4 py-2 border rounded-lg flex items-center justify-start gap-2 min-w-[150px] ${
                                    (searchTerm || readStatusFilter || collectionFilter || ratingFilter || wishlistFilter || seriesFilter || dateFrom || dateTo || (tagFilter && tagFilter.length > 0))
                                    ? `border-blue-500 text-blue-700 font-semibold ${!filterPanelOpen ? 'filter-button-active' : ''}`
                                    : 'border-gray-300 text-gray-700'
                                }`}
                                title={!filterPanelOpen ? 'Show filters' : !showAdvancedFilters ? 'Show more filters' : 'Hide filters'}>
                                🔍 {!filterPanelOpen ? 'Filters' : !showAdvancedFilters ? 'More Filters' : 'Hide'}
                                {/* v4.15.6.g: Use datePreset for count instead of dateFrom/dateTo, v4.27.0: add tagFilter */}
                                {(searchTerm || readStatusFilter || collectionFilter || ratingFilter || wishlistFilter || seriesFilter || datePreset || (tagFilter && tagFilter.length > 0)) &&
                                    ` (${[searchTerm, readStatusFilter, collectionFilter, ratingFilter, wishlistFilter, seriesFilter, datePreset, tagFilter?.length > 0].filter(Boolean).length})`}
                            </button>

                            {/* Book count + Show Hidden + Show Deals - always visible when panel closed (v4.22.0.a, v5.0.0) */}
                            {books.length > 0 && !filterPanelOpen && (
                                <div className="flex items-center gap-4 py-2">
                                    <span className="text-sm text-gray-600">
                                        {(() => {
                                            // Calculate filtered count (same logic as expanded view)
                                            const filteredResults = columns.flatMap(col =>
                                                filteredBooks(col.books).filter(item => !(item && item.type === 'divider'))
                                            );
                                            const filteredBookIds = new Set(filteredResults.map(book => book.id));
                                            const filteredUniqueCount = filteredBookIds.size;
                                            return `Showing: ${filteredUniqueCount} of ${books.length}`;
                                        })()}
                                    </span>
                                    <label className="flex items-center gap-2 cursor-pointer text-sm">
                                        <input
                                            type="checkbox"
                                            checked={showHidden}
                                            onChange={(e) => setShowHidden(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                                        />
                                        <span className="text-gray-600">Show Hidden</span>
                                    </label>
                                    {/* v5.0.0 - Show Deals checkbox (moved from header) */}
                                    <label className="flex items-center gap-2 cursor-pointer text-sm" title="Show only wishlist books at or below your target price">
                                        <input
                                            type="checkbox"
                                            checked={dealsFilterActive}
                                            onChange={(e) => setDealsFilterActive(e.target.checked)}
                                            className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                        />
                                        <span className={`${dealsFilterActive ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                            Show Deals ({books.filter(b => b.onWishlist && b.priceTrigger != null && b.currentPrice != null && b.currentPrice <= b.priceTrigger).length})
                                        </span>
                                    </label>
                                </div>
                            )}

                            {/* FILTER TABLE - v4.15.5.j - HTML table with tuned column widths */}
                            {filterPanelOpen && (
                                <table className="border-collapse" style={{borderSpacing: '4px'}}>
                                    <colgroup>
                                        <col /> {/* Column 1: Search/Rating - auto width */}
                                        <col style={{width: '148px'}} /> {/* Column 2: Status/Series */}
                                        <col style={{width: '188px'}} /> {/* Column 3: Collection/Wishlist */}
                                        <col style={{width: '140px'}} /> {/* Column 4: Type */}
                                        <col /> {/* Column 5: Date From - auto */}
                                        <col /> {/* Column 6: Date To - auto */}
                                    </colgroup>
                                    <tbody>
                                        {/* ROW 1: Primary Filters */}
                                        <tr className="align-middle">
                                            {/* Search with icon - 50px left padding to align box with Rating below */}
                                            <td className="pr-2 py-1" style={{paddingLeft: '50px'}}>
                                                <div className="relative flex items-center">
                                                    <span className="absolute left-3 text-gray-400" title="Search for Title, Author, Column or Divider">🔍</span>
                                                    <input type="text"
                                                           placeholder="Title or author..."
                                                           value={searchTerm}
                                                           onChange={(e) => setSearchTerm(e.target.value)}
                                                           title="Search for Title, Author, Column or Divider"
                                                           aria-label="Search by title, author, column or divider"
                                                           className="w-full pl-10 pr-8 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm" />
                                                    {searchTerm && (
                                                        <button
                                                            onClick={() => setSearchTerm('')}
                                                            className="absolute right-2 text-gray-400 hover:text-gray-600 text-lg"
                                                            title="Clear search">
                                                            ×
                                                        </button>
                                                    )}
                                                </div>
                                            </td>

                                            {/* Read Status */}
                                            <td className="px-2 py-1">
                                                <div className="flex items-center gap-1">
                                                    <span title="Read Status">📖</span>
                                                    <select
                                                        value={readStatusFilter}
                                                        onChange={(e) => setReadStatusFilter(e.target.value)}
                                                        aria-label="Filter by read status"
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                        <option value="">All Status</option>
                                                        <option value="READ">✓ Read</option>
                                                        <option value="UNREAD">○ Unread</option>
                                                        <option value="UNKNOWN">? Unknown</option>
                                                    </select>
                                                </div>
                                            </td>

                                            {/* Collection */}
                                            <td className="px-2 py-1">
                                                <div className="flex items-center gap-1">
                                                    <span title="Collection">🗂️</span>
                                                    <select
                                                        value={collectionFilter}
                                                        onChange={(e) => setCollectionFilter(e.target.value)}
                                                        aria-label="Filter by collection"
                                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                        <option value="">All Collections</option>
                                                        <option value="UNCOLLECTED">📚 Uncollected</option>
                                                        {getAllCollectionNames().map(name => (
                                                            <option key={name} value={name}>{name}</option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </td>

                                            {/* Tag filter - v4.27.0 */}
                                            <td className="px-2 py-1">
                                                {Object.keys(tagRegistry).length > 0 && (
                                                    <div className="flex items-center gap-1 relative">
                                                        <span title="Tags">🏷️</span>
                                                        <div className="relative">
                                                            <button
                                                                onClick={() => setContextSubmenu(contextSubmenu === 'tagFilter' ? null : 'tagFilter')}
                                                                className={`w-full px-3 py-2 bg-white border rounded-lg text-sm text-left flex items-center justify-between gap-2 ${
                                                                    tagFilter.length > 0 ? 'border-blue-500 text-blue-700' : 'border-gray-300 text-gray-700'
                                                                }`}
                                                                style={{minWidth: '120px'}}>
                                                                <span>{tagFilter.length > 0 ? `${tagFilter.length} tag${tagFilter.length > 1 ? 's' : ''}` : 'All Tags'}</span>
                                                                <span className="text-gray-400">▼</span>
                                                            </button>
                                                            {contextSubmenu === 'tagFilter' && (
                                                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[180px] max-h-[300px] overflow-y-auto">
                                                                    {Object.entries(tagRegistry).sort((a, b) => a[1].label.localeCompare(b[1].label)).map(([tagId, tagData]) => (
                                                                        <label key={tagId} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-100 cursor-pointer">
                                                                            <input
                                                                                type="checkbox"
                                                                                checked={tagFilter.includes(tagId)}
                                                                                onChange={() => {
                                                                                    setTagFilter(prev =>
                                                                                        prev.includes(tagId)
                                                                                            ? prev.filter(t => t !== tagId)
                                                                                            : [...prev, tagId]
                                                                                    );
                                                                                }}
                                                                                className="w-4 h-4 rounded border-gray-300 text-blue-600"
                                                                            />
                                                                            <span className="text-sm">{tagData.label} ({tagData.count})</span>
                                                                        </label>
                                                                    ))}
                                                                    {tagFilter.length > 0 && (
                                                                        <>
                                                                            <div className="border-t border-gray-200 my-1"></div>
                                                                            <button
                                                                                onClick={() => setTagFilter([])}
                                                                                className="w-full px-3 py-2 text-sm text-blue-600 hover:bg-gray-100 text-left">
                                                                                Clear All
                                                                            </button>
                                                                        </>
                                                                    )}
                                                                    <div className="border-t border-gray-200 my-1"></div>
                                                                    <button
                                                                        onClick={() => { setTagManagementOpen(true); setContextSubmenu(null); }}
                                                                        className="w-full px-3 py-2 text-sm text-gray-600 hover:bg-gray-100 text-left flex items-center gap-2">
                                                                        ⚙️ Manage Tags...
                                                                    </button>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </td>
                                            {/* Empty cells for columns 5-6 in row 1 */}
                                            <td></td>
                                            <td></td>
                                        </tr>

                                        {/* ROW 2: Advanced Filters (only shown when expanded) */}
                                        {showAdvancedFilters && (
                                            <tr className="align-middle">
                                                {/* Rating - left padding to match Search above */}
                                                <td className="pr-2 py-1 pl-6">
                                                    <div className="flex items-center gap-1">
                                                        <span title="Rating">⭐</span>
                                                        <select
                                                            value={ratingFilter}
                                                            onChange={(e) => setRatingFilter(e.target.value)}
                                                            aria-label="Filter by rating"
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                            <option value="">All Ratings</option>
                                                            <option value="5">5★</option>
                                                            <option value="4">4+★</option>
                                                            <option value="3">3+★</option>
                                                            <option value="2">2+★</option>
                                                            <option value="1">1+★</option>
                                                        </select>
                                                    </div>
                                                </td>

                                                {/* Series */}
                                                <td className="px-2 py-1">
                                                    <div className="flex items-center gap-1">
                                                        <span title="Series">📚</span>
                                                        <select
                                                            value={seriesFilter}
                                                            onChange={(e) => setSeriesFilter(e.target.value)}
                                                            aria-label="Filter by series"
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                            <option value="">All Series</option>
                                                            <option value="NOT_IN_SERIES">📖 Not in Series</option>
                                                            {getAllSeriesNames().map(name => (
                                                                <option key={name} value={name}>{name}</option>
                                                            ))}
                                                        </select>
                                                    </div>
                                                </td>

                                                {/* Wishlist */}
                                                <td className="px-2 py-1">
                                                    <div className="flex items-center gap-1">
                                                        <span title="Wishlist">❤️</span>
                                                        <select
                                                            value={wishlistFilter}
                                                            onChange={(e) => setWishlistFilter(e.target.value)}
                                                            aria-label="Filter by wishlist status"
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                            <option value="">All Books</option>
                                                            <option value="owned">Owned Only</option>
                                                            <option value="wishlist">Wishlist Only</option>
                                                        </select>
                                                    </div>
                                                </td>

                                                {/* Ownership Type */}
                                                <td className="px-2 py-1">
                                                    <div className="flex items-center gap-1">
                                                        <span title="Ownership">🏷️</span>
                                                        <select
                                                            value={ownershipFilter}
                                                            onChange={(e) => setOwnershipFilter(e.target.value)}
                                                            aria-label="Filter by ownership type"
                                                            className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                            <option value="">All Types</option>
                                                            <option value="purchased">Purchased</option>
                                                            <option value="sample">Sample</option>
                                                            <option value="borrowed">Borrowed</option>
                                                            <option value="prime">Prime</option>
                                                            <option value="kindleUnlimited">Kindle Unlimited</option>
                                                            <option value="koll">KOLL</option>
                                                            <option value="comixology">Comixology</option>
                                                        </select>
                                                    </div>
                                                </td>

                                                {/* Date Preset with Clear button (v4.15.6.c) */}
                                                <td className="px-2 py-1" colSpan="2">
                                                    <div className="flex items-center gap-2">
                                                        <span title="Acquisition Date">📅</span>
                                                        <select
                                                            value={datePreset}
                                                            onChange={(e) => {
                                                                const newPreset = e.target.value;
                                                                // v4.15.6.g: Clear dates when switching to Custom (fresh start)
                                                                if (newPreset === 'custom') {
                                                                    setDateFrom('');
                                                                    setDateTo('');
                                                                }
                                                                setDatePreset(newPreset);
                                                            }}
                                                            aria-label="Filter by acquisition date"
                                                            style={{maxWidth: '150px'}}
                                                            className="px-3 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm">
                                                            <option value="">All Dates</option>
                                                            <option value="last30">Last 30 Days</option>
                                                            <option value="last90">Last 90 Days</option>
                                                            <option value="lastYear">Last 12 Months</option>
                                                            {/* Dynamic year options: current year and 2 previous years (v4.15.6.d) */}
                                                            {[0, 1, 2].map(offset => {
                                                                const year = new Date().getFullYear() - offset;
                                                                return <option key={year} value={`year${year}`}>{year}</option>;
                                                            })}
                                                            <option value="custom">Custom...</option>
                                                        </select>
                                                        {datePreset && (
                                                            <button
                                                                onClick={() => {
                                                                    setDatePreset('');
                                                                    setDateFrom('');
                                                                    setDateTo('');
                                                                }}
                                                                className="text-blue-700 hover:text-blue-900 font-semibold text-sm whitespace-nowrap"
                                                                title="Clear date filter">
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        )}

                                        {/* ROW 3: Showing count, Show Hidden, and Custom date pickers (v4.15.6.c) */}
                                        {/* v4.16.0.bf - Show unique books + copies count */}
                                        <tr className="align-middle">
                                            {/* Showing - 50px left padding to align with boxes above */}
                                            <td className="pr-2 py-1" style={{paddingLeft: '50px'}}>
                                                <span className="text-sm text-gray-600">
                                                    {(() => {
                                                        // v4.16.0.bf - Calculate unique books and copies for filtered and total
                                                        // v4.16.0.bg - Fix: filteredBooks() returns enriched book objects with .id, not raw entries
                                                        const filteredResults = columns.flatMap(col =>
                                                            filteredBooks(col.books).filter(item => !(item && item.type === 'divider'))
                                                        );
                                                        // Use book.id for filtered results (enriched book objects)
                                                        const filteredBookIds = new Set(filteredResults.map(book => book.id));
                                                        const filteredUniqueCount = filteredBookIds.size;
                                                        const filteredCopyCount = filteredResults.length - filteredUniqueCount;

                                                        // Use getBookIdFromEntry for raw column entries
                                                        const allEntries = columns.flatMap(col =>
                                                            col.books.filter(item => !(item && item.type === 'divider'))
                                                        );
                                                        const allBookIds = new Set(allEntries.map(entry => getBookIdFromEntry(entry)));
                                                        const totalCopyCount = allEntries.length - allBookIds.size;

                                                        const filteredCopyText = filteredCopyCount > 0
                                                            ? ` (+${filteredCopyCount} ${filteredCopyCount === 1 ? 'copy' : 'copies'})`
                                                            : '';
                                                        const totalCopyText = totalCopyCount > 0
                                                            ? ` (+${totalCopyCount} ${totalCopyCount === 1 ? 'copy' : 'copies'})`
                                                            : '';

                                                        return `Showing: ${filteredUniqueCount}${filteredCopyText} of ${books.length}${totalCopyText} books`;
                                                    })()}
                                                </span>
                                            </td>
                                            <td className="px-2 py-1">
                                                <label className="flex items-center gap-2 cursor-pointer text-sm">
                                                    <input
                                                        type="checkbox"
                                                        checked={showHidden}
                                                        onChange={(e) => setShowHidden(e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-300 text-blue-700 focus:ring-blue-500"
                                                    />
                                                    <span className="text-gray-600">Show Hidden</span>
                                                </label>
                                            </td>
                                            <td className="px-2 py-1">
                                                {/* v5.0.0 - Show Deals checkbox */}
                                                <label className="flex items-center gap-2 cursor-pointer text-sm" title="Show only wishlist books at or below your target price">
                                                    <input
                                                        type="checkbox"
                                                        checked={dealsFilterActive}
                                                        onChange={(e) => setDealsFilterActive(e.target.checked)}
                                                        className="w-4 h-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                                                    />
                                                    <span className={`${dealsFilterActive ? 'text-green-600 font-medium' : 'text-gray-600'}`}>
                                                        Show Deals ({books.filter(b => b.onWishlist && b.priceTrigger != null && b.currentPrice != null && b.currentPrice <= b.priceTrigger).length})
                                                    </span>
                                                </label>
                                            </td>
                                            {/* Custom date pickers - only when Custom preset selected (columns 3-6) */}
                                            {showAdvancedFilters && datePreset === 'custom' ? (
                                                <>
                                                    <td></td>
                                                    <td></td>
                                                    <td className="px-2 py-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm text-gray-500">From:</span>
                                                            <input
                                                                type="date"
                                                                value={dateFrom}
                                                                onChange={(e) => setDateFrom(e.target.value)}
                                                                aria-label="Acquisition date from"
                                                                className="px-2 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            />
                                                        </div>
                                                    </td>
                                                    <td className="pl-2 py-1">
                                                        <div className="flex items-center gap-1">
                                                            <span className="text-sm text-gray-500">To:</span>
                                                            <input
                                                                type="date"
                                                                value={dateTo}
                                                                onChange={(e) => setDateTo(e.target.value)}
                                                                aria-label="Acquisition date to"
                                                                className="px-2 py-2 bg-white border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                                                            />
                                                        </div>
                                                    </td>
                                                </>
                                            ) : (
                                                <>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                    <td></td>
                                                </>
                                            )}
                                        </tr>
                                    </tbody>
                                </table>
                            )}
                        </div>

                        {/* Active Filters Banner (v3.8.0.k - moved below Filter Panel, v4.15.6.m - use datePreset, v4.27.0 - add tagFilter) */}
                        {(searchTerm || readStatusFilter || collectionFilter || ratingFilter || wishlistFilter || ownershipFilter || seriesFilter || datePreset || (tagFilter && tagFilter.length > 0)) && (
                            <div className="bg-blue-100 border border-blue-300 rounded-lg px-4 py-2 mb-4 flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap text-sm">
                                    <span className="font-semibold">🔍 Active:</span>
                                    {searchTerm && <span>Search: "{searchTerm}"</span>}
                                    {searchTerm && (readStatusFilter || collectionFilter || ratingFilter || wishlistFilter || seriesFilter || datePreset || tagFilter?.length > 0) && <span>|</span>}
                                    {readStatusFilter && <span>Read: {readStatusFilter}</span>}
                                    {readStatusFilter && (collectionFilter || ratingFilter || wishlistFilter || seriesFilter || datePreset || tagFilter?.length > 0) && <span>|</span>}
                                    {collectionFilter && <span>Collection: {collectionFilter === 'UNCOLLECTED' ? 'Uncollected' : collectionFilter}</span>}
                                    {collectionFilter && (ratingFilter || wishlistFilter || seriesFilter || datePreset || tagFilter?.length > 0) && <span>|</span>}
                                    {ratingFilter && <span>Rating: {ratingFilter}+★</span>}
                                    {ratingFilter && (wishlistFilter || seriesFilter || datePreset || tagFilter?.length > 0) && <span>|</span>}
                                    {wishlistFilter && <span>Wishlist: {wishlistFilter === 'owned' ? 'Owned Only' : 'Wishlist Only'}</span>}
                                    {wishlistFilter && (ownershipFilter || seriesFilter || datePreset || tagFilter?.length > 0) && <span>|</span>}
                                    {ownershipFilter && <span>Ownership: {ownershipFilter === 'kindleUnlimited' ? 'Kindle Unlimited' : ownershipFilter.charAt(0).toUpperCase() + ownershipFilter.slice(1)}</span>}
                                    {ownershipFilter && (seriesFilter || datePreset || tagFilter?.length > 0) && <span>|</span>}
                                    {seriesFilter && <span>Series: {seriesFilter === 'NOT_IN_SERIES' ? 'Not in Series' : seriesFilter}</span>}
                                    {seriesFilter && (datePreset || tagFilter?.length > 0) && <span>|</span>}
                                    {datePreset && <span>Date: {
                                        datePreset === 'custom' ? `${dateFrom || '...'} to ${dateTo || '...'}` :
                                        datePreset === 'last30' ? 'Last 30 Days' :
                                        datePreset === 'last90' ? 'Last 90 Days' :
                                        datePreset === 'lastYear' ? 'Last 12 Months' :
                                        datePreset.startsWith('year') ? datePreset.substring(4) :
                                        datePreset
                                    }</span>}
                                    {datePreset && tagFilter?.length > 0 && <span>|</span>}
                                    {tagFilter && tagFilter.length > 0 && <span>Tags: {tagFilter.map(t => tagRegistry[t]?.label || t).join(', ')}</span>}
                                </div>
                                <button
                                    onClick={() => {
                                        setSearchTerm('');
                                        setReadStatusFilter('');
                                        setCollectionFilter('');
                                        setRatingFilter('');
                                        setWishlistFilter('');
                                        setOwnershipFilter('');
                                        setSeriesFilter('');
                                        setDatePreset('');
                                        setDateFrom('');
                                        setDateTo('');
                                        setTagFilter([]);
                                    }}
                                    className="text-blue-700 hover:text-blue-900 font-semibold text-sm whitespace-nowrap">
                                    Clear All ×
                                </button>
                            </div>
                        )}
                    </div>

                    {statusModalOpen && (() => {
                        // Schema v2.0: Simplified informational modal (no action buttons)
                        // Count dividers in columns - dividers are stored as objects {type: 'divider', id, label}
                        const dividerCount = columns.reduce((count, col) =>
                            count + col.books.filter(item => typeof item === 'object' && item.type === 'divider').length, 0);
                        const booksWithCollections = books.filter(b => b.collections && b.collections.length > 0).length;

                        return (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setStatusModalOpen(false)}>
                            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                                {/* Header */}
                                <div className="flex justify-between items-start p-4 bg-gray-200 rounded-t-lg border-b border-gray-300">
                                    <h2 className="text-xl font-bold text-gray-900">Data Status</h2>
                                    <button onClick={() => setStatusModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl leading-none">×</button>
                                </div>

                                {/* Content - informational only */}
                                <div className="p-6 space-y-4">
                                    {/* Library info - v4.15.1.c: Red text for non-fresh status */}
                                    <div className="border-b border-gray-200 pb-3">
                                        <p className="text-sm text-gray-700">
                                            📚 <strong>Library:</strong> {books.length > 0
                                                ? `${books.length} books`
                                                : <span className="text-red-600 font-medium">Not loaded</span>}
                                        </p>
                                        {libraryStatus.loadDate && (
                                            <p className={`text-xs mt-1 ${libraryStatus.loadStatus === 'fresh' ? 'text-gray-500' : libraryStatus.loadStatus === 'stale' ? 'text-orange-500' : 'text-red-500'}`}>
                                                Fetched: {new Date(libraryStatus.loadDate).toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Collections info - v4.15.1.c: Red text for non-fresh status */}
                                    <div className="border-b border-gray-200 pb-3">
                                        <p className="text-sm text-gray-700">
                                            📁 <strong>Collections:</strong> {booksWithCollections > 0
                                                ? `${booksWithCollections} books with collection data`
                                                : <span className="text-red-600 font-medium">Not loaded</span>}
                                        </p>
                                        {collectionsStatus.loadDate && (
                                            <p className={`text-xs mt-1 ${collectionsStatus.loadStatus === 'fresh' ? 'text-gray-500' : collectionsStatus.loadStatus === 'stale' ? 'text-orange-500' : 'text-red-500'}`}>
                                                Fetched: {new Date(collectionsStatus.loadDate).toLocaleString()}
                                            </p>
                                        )}
                                    </div>

                                    {/* Organization stats */}
                                    <div>
                                        <p className="text-sm text-gray-700">
                                            📊 <strong>Organization:</strong> {columns.length} column{columns.length !== 1 ? 's' : ''}, {dividerCount} divider{dividerCount !== 1 ? 's' : ''}
                                        </p>
                                    </div>

                                    {/* Help text */}
                                    {books.length === 0 && (
                                        <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
                                            <p>Use the <strong>Import</strong> button to load your library file.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        );
                    })()}

                    {resetConfirmOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setResetConfirmOpen(false)}>
                            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start p-4 bg-gray-200 rounded-t-lg border-b border-gray-300">
                                    <h2 className="text-xl font-bold text-gray-900">Reset App Confirmation</h2>
                                    <button onClick={() => setResetConfirmOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-gray-800 font-semibold">This will completely reset the app to its initial unused state.</p>
                                    <div className="text-gray-700">
                                        <p className="font-semibold mb-2">This will:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Unload library and collections</li>
                                            <li>Remove all columns and organization</li>
                                            <li>Reset all filters</li>
                                        </ul>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
                                        <p className="mb-2">Your library/collections files on disk will NOT be deleted. You can reload them anytime.</p>
                                    </div>
                                    <div className="bg-yellow-50 border border-yellow-300 rounded p-3 text-sm">
                                        <p className="font-semibold text-gray-800">💡 Tip: Use the Export button first to save your organization before resetting.</p>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <button
                                            onClick={() => setResetConfirmOpen(false)}
                                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={confirmReset}
                                            className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium">
                                            Reset App
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* v5.0.0 - Migration Dialog */}
                    {showMigrationDialog && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setShowMigrationDialog(false)}>
                            <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start p-4 bg-blue-600 rounded-t-lg">
                                    <h2 className="text-xl font-bold text-white">📁 Import Column Organization?</h2>
                                    <button onClick={() => setShowMigrationDialog(false)} className="text-white hover:text-gray-200 text-2xl font-bold">×</button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <p className="text-gray-800">
                                        You have books organized in <strong>{columns.length} columns</strong> with dividers.
                                        Would you like to import this organization into the new Book Explorer?
                                    </p>
                                    <div className="bg-gray-50 border border-gray-200 rounded p-4 text-sm text-gray-700">
                                        <p className="font-semibold mb-2">Migration will:</p>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li>Convert each <strong>column</strong> → folder</li>
                                            <li>Convert each <strong>divider</strong> → subfolder</li>
                                            <li>Preserve book order within each folder</li>
                                        </ul>
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
                                        <p>Your original column organization will remain intact. You can switch between Column View and Explorer View anytime.</p>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <button
                                            onClick={() => setShowMigrationDialog(false)}
                                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium">
                                            Not Now
                                        </button>
                                        <button
                                            onClick={migrateColumnsToFolders}
                                            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium">
                                            Import to Explorer
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {insertDividerOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setInsertDividerOpen(null)}>
                            <div className="bg-white rounded-lg shadow-2xl max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start p-4 bg-gray-200 rounded-t-lg border-b border-gray-300">
                                    <h2 className="text-xl font-bold text-gray-900">Insert Divider</h2>
                                    <button onClick={() => setInsertDividerOpen(null)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold">×</button>
                                </div>
                                <div className="p-6 space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">Divider Label</label>
                                        <input
                                            type="text"
                                            value={newDividerLabel}
                                            onChange={(e) => setNewDividerLabel(e.target.value)}
                                            onKeyPress={(e) => { if (e.key === 'Enter') insertDivider(insertDividerOpen); }}
                                            placeholder="e.g., Jerry Mitchell, Read Books, 5 Stars"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="bg-blue-50 border border-blue-200 rounded p-3 text-sm text-gray-700">
                                        <p>The divider will appear at the bottom of the column. You can drag it to any position.</p>
                                    </div>
                                    <div className="flex gap-3 justify-end pt-2">
                                        <button
                                            onClick={() => setInsertDividerOpen(null)}
                                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg font-medium">
                                            Cancel
                                        </button>
                                        <button
                                            onClick={() => insertDivider(insertDividerOpen)}
                                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg font-medium"
                                            disabled={!newDividerLabel.trim()}>
                                            Insert
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {settingsOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setSettingsOpen(false)}>
                            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md w-full" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">Settings</h2>
                                    <button onClick={() => setSettingsOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                                            Cache Expiration for Ratings/Reviews (days)
                                        </label>
                                        <p className="text-xs text-gray-600 mb-2">
                                            Descriptions are cached forever. Ratings and reviews expire after this many days to stay fresh.
                                        </p>
                                        <input 
                                            type="number"
                                            min="1"
                                            max="365"
                                            value={settings.cacheExpirationDays}
                                            onChange={(e) => setSettings({...settings, cacheExpirationDays: parseInt(e.target.value) || 30})}
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                        <p className="text-xs text-gray-500 mt-1">
                                            Current: {settings.cacheExpirationDays} days
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2 justify-end mt-6">
                                    <button 
                                        onClick={() => setSettingsOpen(false)}
                                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg">
                                        Cancel
                                    </button>
                                    <button 
                                        onClick={() => saveSettings(settings)}
                                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
                                        Save
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {helpOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" onClick={() => setHelpOpen(false)}>
                            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="flex justify-between items-start mb-4">
                                    <h2 className="text-xl font-bold text-gray-900">How to Use</h2>
                                    <button onClick={() => setHelpOpen(false)} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                                </div>
                                <div className="space-y-4 text-sm text-gray-700">
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">📚 Getting Your Books</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><strong>Install Bookmarklet:</strong> Visit the installer page (see README) and drag the bookmarklet to your toolbar</li>
                                            <li><strong>Run Fetcher:</strong> Go to your online library page and click the bookmarklet</li>
                                            <li><strong>Auto-saves:</strong> Fetcher creates library JSON in your Downloads</li>
                                            <li><strong>First Load:</strong> Click status indicator to load library</li>
                                            <li><strong>Updates:</strong> Run fetcher again, then sync when you see Stale indicator</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">Status Indicator</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><strong>Fresh:</strong> Your library is up to date</li>
                                            <li><strong>Stale:</strong> New books available - click to load updated library</li>
                                            <li><strong>Click here to load library:</strong> Click to load your first library</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">📚 Organizing Books</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><strong>View Details:</strong> Click a book cover to see full details</li>
                                            <li><strong>Move/Reorder:</strong> Drag a book to move it to another column or reorder within same column</li>
                                            <li><strong>Navigate:</strong> Use ← → arrows in book details to browse prev/next books</li>
                                            <li><strong>Group Series:</strong> Click "📚 Group Series Books" in book details</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">📋 Managing Columns</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><strong>Create:</strong> Type name in field and click ➕ (or press Enter)</li>
                                            <li><strong>Rename:</strong> Double-click any column name to edit</li>
                                            <li><strong>Reorder:</strong> Drag any column header left/right</li>
                                            <li><strong>Sort:</strong> Click ⬆ button to sort books</li>
                                            <li><strong>Delete:</strong> Click ⌫ and choose where to move the books</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">💾 Data Management</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><strong>Auto-saves:</strong> Everything persists automatically in your browser</li>
                                            <li><strong>Export:</strong> Download complete backup for safekeeping</li>
                                            <li><strong>Import:</strong> Merges library file with existing books, preserving organization. Also restores backups.</li>
                                            <li><strong>Reset App:</strong> Complete app reset to initial state (files on disk not affected)</li>
                                        </ul>
                                    </div>
                                    <div>
                                        <h3 className="font-semibold text-gray-900 mb-1">💰 Affiliate Links</h3>
                                        <ul className="list-disc list-inside space-y-1 ml-2">
                                            <li><strong>Amazon links:</strong> All "Open in Amazon" links use affiliate tracking</li>
                                            <li><strong>Supports development:</strong> If you purchase anything within 24 hours, it helps fund ReaderWrangler</li>
                                            <li><strong>No cost to you:</strong> Same prices, just helps keep the app free</li>
                                        </ul>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}

                    {deleteDialogOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Delete Column</h2>
                                <p className="text-sm text-gray-700 mb-4">
                                    Where should the {columns.find(c => c.id === deleteDialogOpen)?.books.length || 0} books from 
                                    "<strong>{columns.find(c => c.id === deleteDialogOpen)?.name}</strong>" be moved?
                                </p>
                                <select 
                                    value={deleteDestination}
                                    onChange={(e) => setDeleteDestination(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-blue-500">
                                    {columns.filter(c => c.id !== deleteDialogOpen).map(col => (
                                        <option key={col.id} value={col.id}>{col.name}</option>
                                    ))}
                                </select>
                                <div className="flex gap-2 justify-end">
                                    <button 
                                        onClick={() => { setDeleteDialogOpen(null); setDeleteDestination(''); }}
                                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg">
                                        Cancel
                                    </button>
                                    <button
                                        onClick={confirmDeleteColumn}
                                        className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg">
                                        Delete Column
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* v4.20.0.a - Bulk price goal modal */}
                    {showBulkPriceModal && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                             onClick={() => { setShowBulkPriceModal(false); setBulkPriceInput(''); }}>
                            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-sm" onClick={(e) => e.stopPropagation()}>
                                <h2 className="text-lg font-bold text-gray-900 mb-4">Set Custom Price Goal</h2>
                                <p className="text-sm text-gray-600 mb-4">
                                    Set price goal for {selectedBooks.size} selected book{selectedBooks.size !== 1 ? 's' : ''}
                                </p>
                                <form
                                    onSubmit={async (e) => {
                                        e.preventDefault();
                                        const price = parseFloat(bulkPriceInput);
                                        if (!isNaN(price) && price > 0) {
                                            const selectedBookIds = getSelectedBookIds();
                                            const count = selectedBookIds.length;
                                            setBooks(prev => {
                                                const updated = prev.map(b =>
                                                    selectedBookIds.includes(b.id) ? { ...b, priceTrigger: price } : b
                                                );
                                                saveBooksToIndexedDB(updated);
                                                return updated;
                                            });
                                            // Toast feedback
                                            setClipboardMessage(`Price goal set to $${price.toFixed(2)} for ${count} book${count !== 1 ? 's' : ''}`);
                                            setFooterClipboardVisible(false);
                                            setToastVisible(true);
                                            setToastAnimating(false);
                                            setTimeout(() => {
                                                setToastAnimating(true);
                                                setTimeout(() => {
                                                    setToastVisible(false);
                                                    setToastAnimating(false);
                                                    setFooterClipboardVisible(true);
                                                }, 1000);
                                            }, 1500);
                                        }
                                        setShowBulkPriceModal(false);
                                        setBulkPriceInput('');
                                    }}
                                    className="flex flex-col gap-4"
                                >
                                    <div className="flex items-center gap-2">
                                        <span className="text-lg text-gray-700">$</span>
                                        <input
                                            type="number"
                                            step="0.01"
                                            min="0.01"
                                            value={bulkPriceInput}
                                            onChange={(e) => setBulkPriceInput(e.target.value)}
                                            className="flex-1 px-3 py-2 text-lg border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="0.00"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="flex justify-end gap-2">
                                        <button
                                            type="button"
                                            onClick={() => { setShowBulkPriceModal(false); setBulkPriceInput(''); }}
                                            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg"
                                        >
                                            Cancel
                                        </button>
                                        <button
                                            type="submit"
                                            className="px-4 py-2 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-lg"
                                        >
                                            Set Goal
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    )}

                    {/* v4.16.0.aq - Last copy warning dialog */}
                    {/* v4.16.0.ar - Handle already-hidden entries separately */}
                    {lastCopyDialogData && (() => {
                        // Partition entries into already-hidden vs can-hide
                        const alreadyHidden = lastCopyDialogData.lastCopyEntries.filter(sel => {
                            if (sel.instanceId) {
                                return hiddenInstances.has(sel.instanceId);
                            } else {
                                const book = books.find(b => b.id === sel.bookId);
                                return book?.isHidden;
                            }
                        });
                        const canHide = lastCopyDialogData.lastCopyEntries.filter(sel => {
                            if (sel.instanceId) {
                                return !hiddenInstances.has(sel.instanceId);
                            } else {
                                const book = books.find(b => b.id === sel.bookId);
                                return !book?.isHidden;
                            }
                        });
                        const totalLastCopy = lastCopyDialogData.lastCopyEntries.length;

                        return (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                                <div className="bg-white rounded-lg shadow-2xl p-6 max-w-md" onClick={(e) => e.stopPropagation()}>
                                    <h2 className="text-xl font-bold text-gray-900 mb-4">Cannot Delete</h2>
                                    <p className="text-sm text-gray-700 mb-4">
                                        {totalLastCopy === 1 ? (
                                            <>
                                                <strong>"{books.find(b => b.id === lastCopyDialogData.lastCopyEntries[0].bookId)?.title || 'This book'}"</strong> is the only copy in your library and cannot be deleted.
                                            </>
                                        ) : (
                                            <>
                                                <strong>{totalLastCopy} books</strong> are the only copies in your library and cannot be deleted.
                                            </>
                                        )}
                                    </p>
                                    {lastCopyDialogData.deletedCount > 0 && (
                                        <p className="text-sm text-gray-500 mb-4">
                                            ({lastCopyDialogData.deletedCount} other book{lastCopyDialogData.deletedCount !== 1 ? 's were' : ' was'} deleted.)
                                        </p>
                                    )}
                                    {/* v4.16.0.ar - Adaptive messaging based on hidden state */}
                                    {/* v4.16.0.as - Improved wording with "These X books" */}
                                    {alreadyHidden.length === totalLastCopy ? (
                                        // All are already hidden
                                        <p className="text-sm text-gray-700 mb-4">
                                            {totalLastCopy === 1 ? 'This book is' : `These ${totalLastCopy} books are`} already hidden.
                                        </p>
                                    ) : alreadyHidden.length > 0 ? (
                                        // Mixed: some hidden, some not
                                        <p className="text-sm text-gray-700 mb-4">
                                            {alreadyHidden.length === 1 ? '1 is' : `These ${alreadyHidden.length} are`} already hidden. Would you like to hide the other {canHide.length}?
                                        </p>
                                    ) : (
                                        // None hidden
                                        <p className="text-sm text-gray-700 mb-4">
                                            Would you like to hide {totalLastCopy === 1 ? 'it' : 'them'} instead?
                                        </p>
                                    )}
                                    <div className="flex gap-2 justify-end">
                                        <button
                                            onClick={() => {
                                                setLastCopyDialogData(null);
                                                clearSelection();
                                            }}
                                            className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg">
                                            {alreadyHidden.length === totalLastCopy ? 'OK' : 'Cancel'}
                                        </button>
                                        {canHide.length > 0 && (
                                            <button
                                                onClick={() => {
                                                    // Hide only the canHide entries
                                                    const guidEntries = canHide.filter(sel => sel.instanceId);
                                                    const legacyEntries = canHide.filter(sel => !sel.instanceId);

                                                    // Handle GUID entries: add to hiddenInstances
                                                    if (guidEntries.length > 0) {
                                                        setHiddenInstances(prev => {
                                                            const next = new Set(prev);
                                                            guidEntries.forEach(sel => next.add(sel.instanceId));
                                                            return next;
                                                        });
                                                    }

                                                    // Handle legacy entries: update book.isHidden
                                                    if (legacyEntries.length > 0) {
                                                        const legacyBookIds = legacyEntries.map(sel => sel.bookId);
                                                        const updatedBooks = books.map(book => {
                                                            if (legacyBookIds.includes(book.id)) {
                                                                return { ...book, isHidden: true };
                                                            }
                                                            return book;
                                                        });
                                                        setBooks(updatedBooks);
                                                        saveBooksToIndexedDB(updatedBooks);
                                                    }

                                                    console.log(`👁️ Hid ${canHide.length} last-copy book(s)`);
                                                    setLastCopyDialogData(null);
                                                    clearSelection();
                                                }}
                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
                                                Hide{canHide.length > 1 ? ` ${canHide.length}` : ''}
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>
                        );
                    })()}

                    {collectSeriesOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]" onClick={() => setCollectSeriesOpen(false)}>
                            <div className="bg-white rounded-lg shadow-2xl p-6 max-w-2xl max-h-[80vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <h2 className="text-xl font-bold text-gray-900 mb-4">Group Series Books</h2>
                                
                                {modalBook && (
                                    <p className="text-sm text-gray-700 mb-4">
                                        Collecting books from: <strong style={{ color: '#621e31' }}>{modalBook.series}</strong>
                                    </p>
                                )}
                                
                                {seriesBooks.current.length > 0 && (
                                    <div className="mb-4">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                            Found in this column ({seriesBooks.current.length}):
                                        </h3>
                                        <ul className="space-y-1 ml-4">
                                            {seriesBooks.current.map(book => (
                                                <li key={book.id} className="text-sm text-gray-700">
                                                    • {book.seriesPosition ? `Book ${book.seriesPosition}: ` : ''}{book.title}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {seriesBooks.other.length > 0 && (
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-900 mb-2">
                                            Found in other columns ({seriesBooks.other.length}):
                                        </h3>
                                        <ul className="space-y-1 ml-4">
                                            {seriesBooks.other.map(book => (
                                                <li key={book.id} className="text-sm text-gray-700">
                                                    • {book.seriesPosition ? `Book ${book.seriesPosition}: ` : ''}{book.title} 
                                                    <span className="text-gray-500 ml-2">({book.columnName})</span>
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                                
                                {seriesBooks.current.length === 0 && seriesBooks.other.length === 0 && (
                                    <p className="text-sm text-gray-600 mb-6 italic">
                                        No other books from this series found in your library.
                                    </p>
                                )}
                                
                                <div className="flex gap-2 justify-end">
                                    <button 
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setCollectSeriesOpen(false);
                                        }}
                                        className="px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg">
                                        Cancel
                                    </button>
                                    {seriesBooks.current.length > 0 && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                collectSeriesBooks(false);
                                            }}
                                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
                                            This Column Only
                                        </button>
                                    )}
                                    {seriesBooks.other.length > 0 && (
                                        <button 
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                collectSeriesBooks(true);
                                            }}
                                            className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg">
                                            All Columns
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {modalBook && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4" onClick={closeBookModal}>
                            <div className="bg-white rounded-lg shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
                                <div className="sticky top-0 bg-white border-b border-gray-200 p-4 flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <button 
                                            onClick={() => navigateBook('prev')}
                                            disabled={!getBookPosition().hasPrev}
                                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Previous book">
                                            ← 
                                        </button>
                                        <span className="text-sm text-gray-600">
                                            Book {getBookPosition().current} of {getBookPosition().total}
                                        </span>
                                        <button 
                                            onClick={() => navigateBook('next')}
                                            disabled={!getBookPosition().hasNext}
                                            className="p-2 hover:bg-gray-100 rounded disabled:opacity-30 disabled:cursor-not-allowed"
                                            title="Next book">
                                            →
                                        </button>
                                    </div>
                                    <button onClick={closeBookModal} className="text-gray-500 hover:text-gray-700 text-2xl">×</button>
                                </div>
                                
                                <div className="p-6">
                                    <div className="flex gap-6 mb-6">
                                        {blankImageBooks.has(modalBook.id) ? (
                                            <div className="w-48 h-72 rounded shadow-lg overflow-hidden flex flex-col flex-shrink-0" 
                                                 style={{ backgroundColor: '#d4c5a9' }}>
                                                <div className="flex-1 flex items-center justify-center px-4">
                                                    <div className="text-center">
                                                        <div className="text-sm font-serif font-bold text-gray-800 leading-tight mb-3">
                                                            {modalBook.title}
                                                        </div>
                                                        <div className="text-xs text-gray-600 mt-3">KINDLE EDITION</div>
                                                    </div>
                                                </div>
                                            </div>
                                        ) : (
                                            <img src={coverUrlMap[modalBook.coverUrl] || modalBook.coverUrl}
                                                 alt={modalBook.title}
                                                 className="w-48 h-72 object-cover rounded shadow-lg flex-shrink-0"
                                                 onError={(e) => e.target.src = 'https://via.placeholder.com/192x288/4f46e5/fff?text=No+Cover'} />
                                        )}
                                        <div className="flex-1">
                                            <h2 className="text-3xl font-bold text-gray-900 mb-3">{modalBook.title}</h2>
                                            {modalBook.onWishlist && (
                                                <div className="mb-3 flex items-center gap-3">
                                                    <span className="inline-flex items-center bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                                                        ⭐ Wishlist Item
                                                    </span>
                                                    {/* v4.17.0.k - Green styling when at goal price */}
                                                    {(() => {
                                                        const atGoal = modalBook.priceTrigger != null && modalBook.currentPrice != null && modalBook.currentPrice <= modalBook.priceTrigger;
                                                        return (
                                                            <button
                                                                onClick={() => window.open(getAmazonUrl(modalBook.asin), '_blank')}
                                                                className={`px-3 py-1 ${atGoal ? 'bg-green-500 hover:bg-green-600' : 'bg-orange-500 hover:bg-orange-600'} text-white rounded text-sm font-medium`}
                                                                title="Opens Amazon with affiliate link">
                                                                View on Amazon {atGoal ? `— $${modalBook.currentPrice.toFixed(2)}` : '→'}
                                                            </button>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                            <p className="text-xl text-gray-700 mb-4">by {modalBook.author}</p>
                                            
                                            {modalBook.rating > 0 && (
                                                <div className="flex items-center gap-3 mb-4">
                                                    {renderStars(modalBook.rating)}
                                                    <span className="text-xl font-bold text-gray-700">{modalBook.rating.toFixed(1)}</span>
                                                    {modalBook.ratingCount && (
                                                        <span className="text-sm text-gray-500">({modalBook.ratingCount} ratings)</span>
                                                    )}
                                                </div>
                                            )}
                                            
                                            {modalBook.series && (
                                                <div className="mb-3">
                                                    <p className="text-lg mb-2" style={{ color: '#621e31' }}>
                                                        {(modalBook.seriesPosition && modalBook.seriesTotal)
                                                            ? `Book ${modalBook.seriesPosition} of ${modalBook.seriesTotal}: ${modalBook.series}`
                                                            : modalBook.seriesPosition 
                                                                ? `Book ${modalBook.seriesPosition}: ${modalBook.series}`
                                                                : modalBook.series
                                                        }
                                                    </p>
                                                    <button
                                                        onClick={openCollectSeriesDialog}
                                                        className="px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm font-medium flex items-center gap-2">
                                                        📚 Group Series Books
                                                    </button>
                                                </div>
                                            )}
                                            
                                            <div className="space-y-2 text-sm">
                                                {modalBook.binding && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-700">Format:</span>
                                                        <span className="text-gray-600">{modalBook.binding}</span>
                                                    </div>
                                                )}
                                                {modalBook.acquired && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-700">Acquired:</span>
                                                        <span className="text-gray-600">{formatAcquisitionDate(modalBook.acquired)}</span>
                                                    </div>
                                                )}
                                                {modalBook.publicationDate && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-700">Published:</span>
                                                        <span className="text-gray-600">{new Date(modalBook.publicationDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</span>
                                                    </div>
                                                )}
                                                {modalBook.asin && (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-700">ASIN:</span>
                                                        <span className="text-gray-600 font-mono text-xs">{modalBook.asin}</span>
                                                    </div>
                                                )}
                                                {/* Collections metadata (NEW v3.8.0.k) */}
                                                {modalBook.collections && modalBook.collections.length > 0 ? (
                                                    <div className="flex items-start gap-2">
                                                        <span className="font-semibold text-gray-700">Collections:</span>
                                                        <span className="text-gray-600 flex-1">
                                                            {modalBook.collections.map(c => c.name).join(', ')}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2">
                                                        <span className="font-semibold text-gray-700">Collections:</span>
                                                        <span className="text-gray-400 italic">No collections</span>
                                                    </div>
                                                )}
                                                {/* Tags (v4.27.0) */}
                                                <div className="flex items-start gap-2">
                                                    <span className="font-semibold text-gray-700">Tags:</span>
                                                    <div className="flex-1 flex flex-wrap items-center gap-1">
                                                        {(() => {
                                                            // v4.27.0 Phase 2 - Show explicit (bold) and inherited (faded) tags
                                                            const explicitTags = modalBook.tags || [];
                                                            const inheritedTags = modalColumnId ? getInheritedTags(modalBook.id, modalColumnId) : [];
                                                            // Filter out inherited tags that are also explicit (to avoid duplicates)
                                                            const uniqueInheritedTags = inheritedTags.filter(t => !explicitTags.includes(t));
                                                            const hasAnyTags = explicitTags.length > 0 || uniqueInheritedTags.length > 0;

                                                            if (!hasAnyTags) {
                                                                return <span className="text-gray-400 italic text-sm">No tags</span>;
                                                            }

                                                            return (
                                                                <>
                                                                    {/* Explicit tags - bold, with remove button */}
                                                                    {explicitTags.map(tagId => (
                                                                        <span key={`explicit-${tagId}`}
                                                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-bold"
                                                                            title="Explicit tag (assigned to this book)">
                                                                            {tagRegistry[tagId]?.label || tagId}
                                                                            <button
                                                                                onClick={() => {
                                                                                    const newTags = modalBook.tags.filter(t => t !== tagId);
                                                                                    setBooks(prev => {
                                                                                        const updated = prev.map(b =>
                                                                                            b.id === modalBook.id ? { ...b, tags: newTags } : b
                                                                                        );
                                                                                        saveBooksToIndexedDB(updated);
                                                                                        return updated;
                                                                                    });
                                                                                    setModalBook(prev => ({ ...prev, tags: newTags }));
                                                                                    setTagRegistry(prev => {
                                                                                        const updated = { ...prev };
                                                                                        if (updated[tagId]) {
                                                                                            updated[tagId] = { ...updated[tagId], count: Math.max(0, updated[tagId].count - 1) };
                                                                                        }
                                                                                        return updated;
                                                                                    });
                                                                                }}
                                                                                className="text-blue-600 hover:text-blue-800 font-bold"
                                                                                title="Remove tag">×</button>
                                                                        </span>
                                                                    ))}
                                                                    {/* Inherited tags - faded, no remove button */}
                                                                    {uniqueInheritedTags.map(tagId => (
                                                                        <span key={`inherited-${tagId}`}
                                                                            className="inline-flex items-center gap-1 px-2 py-0.5 bg-gray-100 text-gray-500 rounded-full text-xs"
                                                                            title="Inherited from divider (move book to remove)">
                                                                            {tagRegistry[tagId]?.label || tagId}
                                                                        </span>
                                                                    ))}
                                                                </>
                                                            );
                                                        })()}
                                                        <div className="relative inline-block">
                                                            <button
                                                                onClick={() => {
                                                                    if (contextSubmenu !== 'addTagModal') {
                                                                        setTagInputValue('');
                                                                    }
                                                                    setContextSubmenu(contextSubmenu === 'addTagModal' ? null : 'addTagModal');
                                                                }}
                                                                className="text-blue-600 hover:text-blue-800 text-xs font-medium px-2 py-0.5 border border-blue-300 rounded-full hover:bg-blue-50">
                                                                + Add tag
                                                            </button>
                                                            {contextSubmenu === 'addTagModal' && (
                                                                <div className="absolute top-full left-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 min-w-[200px]"
                                                                    onClick={(e) => e.stopPropagation()}>
                                                                    <div className="p-2 flex items-center gap-2">
                                                                        <input
                                                                            type="text"
                                                                            value={tagInputValue}
                                                                            placeholder="Type tag name..."
                                                                            className="flex-1 px-2 py-1 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                                            autoFocus
                                                                            onKeyDown={(e) => {
                                                                                e.stopPropagation();
                                                                                if (e.key === 'Escape') {
                                                                                    setContextSubmenu(null);
                                                                                    setTagInputValue('');
                                                                                } else if (e.key === 'Enter') {
                                                                                    // v4.27.0-alpha.5 - Enter selects top match or creates new tag
                                                                                    const inputValue = tagInputValue.toLowerCase().trim();
                                                                                    if (!inputValue) return;
                                                                                    const allTagsExactMatch = Object.entries(tagRegistry)
                                                                                        .find(([id, data]) => data.label.toLowerCase() === inputValue);
                                                                                    const existingTags = Object.entries(tagRegistry)
                                                                                        .filter(([id, data]) =>
                                                                                            data.label.toLowerCase().includes(inputValue) &&
                                                                                            !(modalBook.tags || []).includes(id)
                                                                                        )
                                                                                        .sort((a, b) => a[1].label.localeCompare(b[1].label));

                                                                                    if (existingTags.length > 0) {
                                                                                        // Select top match
                                                                                        const [tagId, tagData] = existingTags[0];
                                                                                        const newTags = [...(modalBook.tags || []), tagId];
                                                                                        setBooks(prev => {
                                                                                            const updated = prev.map(b =>
                                                                                                b.id === modalBook.id ? { ...b, tags: newTags } : b
                                                                                            );
                                                                                            saveBooksToIndexedDB(updated);
                                                                                            return updated;
                                                                                        });
                                                                                        setModalBook(prev => ({ ...prev, tags: newTags }));
                                                                                        setTagRegistry(prev => ({
                                                                                            ...prev,
                                                                                            [tagId]: { ...prev[tagId], count: prev[tagId].count + 1 }
                                                                                        }));
                                                                                        setContextSubmenu(null);
                                                                                        setTagInputValue('');
                                                                                    } else if (!allTagsExactMatch) {
                                                                                        // Create new tag
                                                                                        const newTagId = inputValue.replace(/\s+/g, '-');
                                                                                        const newTagLabel = tagInputValue.trim();
                                                                                        setTagRegistry(prev => ({
                                                                                            ...prev,
                                                                                            [newTagId]: { label: newTagLabel, count: 1 }
                                                                                        }));
                                                                                        const newTags = [...(modalBook.tags || []), newTagId];
                                                                                        setBooks(prev => {
                                                                                            const updated = prev.map(b =>
                                                                                                b.id === modalBook.id ? { ...b, tags: newTags } : b
                                                                                            );
                                                                                            saveBooksToIndexedDB(updated);
                                                                                            return updated;
                                                                                        });
                                                                                        setModalBook(prev => ({ ...prev, tags: newTags }));
                                                                                        setContextSubmenu(null);
                                                                                        setTagInputValue('');
                                                                                    }
                                                                                    // If tag already on book, do nothing
                                                                                }
                                                                            }}
                                                                            onChange={(e) => setTagInputValue(e.target.value)}
                                                                        />
                                                                        <button
                                                                            onClick={() => {
                                                                                setContextSubmenu(null);
                                                                                setTagInputValue('');
                                                                            }}
                                                                            className="text-gray-400 hover:text-gray-600 text-lg font-bold"
                                                                            title="Close">×</button>
                                                                    </div>
                                                                    <div className="max-h-[200px] overflow-y-auto border-t border-gray-200">
                                                                        {(() => {
                                                                            const inputValue = tagInputValue.toLowerCase().trim();
                                                                            // Check ALL tags for exact match (not just filtered), to prevent duplicates
                                                                            const allTagsExactMatch = Object.entries(tagRegistry)
                                                                                .find(([id, data]) => data.label.toLowerCase() === inputValue);
                                                                            // Filter to tags matching input AND not already on this book
                                                                            const existingTags = Object.entries(tagRegistry)
                                                                                .filter(([id, data]) =>
                                                                                    (!inputValue || data.label.toLowerCase().includes(inputValue)) &&
                                                                                    !(modalBook.tags || []).includes(id)
                                                                                )
                                                                                .sort((a, b) => a[1].label.localeCompare(b[1].label));
                                                                            // Only show Create if no exact match exists in registry at all
                                                                            const showCreate = inputValue && !allTagsExactMatch;
                                                                            // Check if exact match exists but book already has it
                                                                            const tagAlreadyOnBook = allTagsExactMatch && (modalBook.tags || []).includes(allTagsExactMatch[0]);

                                                                            return (
                                                                                <>
                                                                                    {showCreate && (
                                                                                        <button
                                                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-600 flex items-center gap-2"
                                                                                            onClick={() => {
                                                                                                const newTagId = inputValue.replace(/\s+/g, '-');
                                                                                                const newTagLabel = tagInputValue.trim();
                                                                                                // Add to tag registry
                                                                                                setTagRegistry(prev => ({
                                                                                                    ...prev,
                                                                                                    [newTagId]: { label: newTagLabel, count: 1 }
                                                                                                }));
                                                                                                // Add to book
                                                                                                const newTags = [...(modalBook.tags || []), newTagId];
                                                                                                setBooks(prev => {
                                                                                                    const updated = prev.map(b =>
                                                                                                        b.id === modalBook.id ? { ...b, tags: newTags } : b
                                                                                                    );
                                                                                                    saveBooksToIndexedDB(updated);
                                                                                                    return updated;
                                                                                                });
                                                                                                setModalBook(prev => ({ ...prev, tags: newTags }));
                                                                                                setContextSubmenu(null);
                                                                                                setTagInputValue('');
                                                                                            }}>
                                                                                            <span>➕</span> Create "{tagInputValue.trim()}"
                                                                                        </button>
                                                                                    )}
                                                                                    {existingTags.map(([tagId, tagData]) => (
                                                                                        <button
                                                                                            key={tagId}
                                                                                            className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 flex items-center justify-between"
                                                                                            onClick={() => {
                                                                                                // Add existing tag to book
                                                                                                const newTags = [...(modalBook.tags || []), tagId];
                                                                                                setBooks(prev => {
                                                                                                    const updated = prev.map(b =>
                                                                                                        b.id === modalBook.id ? { ...b, tags: newTags } : b
                                                                                                    );
                                                                                                    saveBooksToIndexedDB(updated);
                                                                                                    return updated;
                                                                                                });
                                                                                                setModalBook(prev => ({ ...prev, tags: newTags }));
                                                                                                // Update tag registry count
                                                                                                setTagRegistry(prev => ({
                                                                                                    ...prev,
                                                                                                    [tagId]: { ...prev[tagId], count: prev[tagId].count + 1 }
                                                                                                }));
                                                                                                setContextSubmenu(null);
                                                                                                setTagInputValue('');
                                                                                            }}>
                                                                                            <span>{tagData.label}</span>
                                                                                            <span className="text-gray-400 text-xs">({tagData.count})</span>
                                                                                        </button>
                                                                                    ))}
                                                                                    {existingTags.length === 0 && !showCreate && (
                                                                                        <div className="px-3 py-2 text-sm text-gray-400">
                                                                                            {tagAlreadyOnBook
                                                                                                ? `"${allTagsExactMatch[1].label}" already added`
                                                                                                : inputValue
                                                                                                    ? 'No matching tags'
                                                                                                    : 'Type to search or create'}
                                                                                        </div>
                                                                                    )}
                                                                                </>
                                                                            );
                                                                        })()}
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Price section for wishlist books (v4.17.0, v4.18.0.b - show for all wishlist, not just those with price) */}
                                            {modalBook.onWishlist && (
                                                <div className="mt-4 pt-4 border-t border-gray-200">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <span className="font-semibold text-gray-700">Current Price:</span>
                                                        {modalBook.currentPrice != null ? (
                                                            <>
                                                                <span className={`text-lg font-bold ${modalBook.priceTrigger && modalBook.currentPrice <= modalBook.priceTrigger ? 'text-green-600' : 'text-gray-900'}`}>
                                                                    ${modalBook.currentPrice.toFixed(2)}
                                                                </span>
                                                                {modalBook.listPrice && modalBook.listPrice > modalBook.currentPrice && (
                                                                    <span className="text-sm text-gray-500">
                                                                        <span className="line-through">${modalBook.listPrice.toFixed(2)}</span>
                                                                        {' '}(Save ${(modalBook.listPrice - modalBook.currentPrice).toFixed(2)})
                                                                    </span>
                                                                )}
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400 italic">Unknown (run library fetch to get prices)</span>
                                                        )}
                                                    </div>

                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm text-gray-600">Buy at:</span>
                                                        {[0.99, 1.99, 2.99, 3.99, 4.99].map(price => (
                                                            <button
                                                                key={price}
                                                                onClick={() => {
                                                                    setBooks(prev => {
                                                                        const updated = prev.map(b =>
                                                                            b.id === modalBook.id ? { ...b, priceTrigger: price } : b
                                                                        );
                                                                        saveBooksToIndexedDB(updated);
                                                                        return updated;
                                                                    });
                                                                    setModalBook(prev => ({ ...prev, priceTrigger: price }));
                                                                }}
                                                                className={`px-2 py-1 text-sm rounded ${modalBook.priceTrigger === price ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                                            >
                                                                ${price.toFixed(2)}
                                                            </button>
                                                        ))}
                                                        {!showCustomPriceInput ? (
                                                            <button
                                                                onClick={() => setShowCustomPriceInput(true)}
                                                                className={`px-2 py-1 text-sm rounded ${modalBook.priceTrigger && ![0.99, 1.99, 2.99, 3.99, 4.99].includes(modalBook.priceTrigger) ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'}`}
                                                            >
                                                                Custom...
                                                            </button>
                                                        ) : (
                                                            <form
                                                                onSubmit={(e) => {
                                                                    e.preventDefault();
                                                                    const price = parseFloat(customPriceInput);
                                                                    if (!isNaN(price) && price > 0) {
                                                                        setBooks(prev => {
                                                                            const updated = prev.map(b =>
                                                                                b.id === modalBook.id ? { ...b, priceTrigger: price } : b
                                                                            );
                                                                            saveBooksToIndexedDB(updated);
                                                                            return updated;
                                                                        });
                                                                        setModalBook(prev => ({ ...prev, priceTrigger: price }));
                                                                    }
                                                                    setShowCustomPriceInput(false);
                                                                    setCustomPriceInput('');
                                                                }}
                                                                className="flex items-center gap-1"
                                                            >
                                                                <span className="text-sm text-gray-600">$</span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0.01"
                                                                    value={customPriceInput}
                                                                    onChange={(e) => setCustomPriceInput(e.target.value)}
                                                                    className="w-16 px-1 py-1 text-sm border rounded"
                                                                    placeholder="0.00"
                                                                    autoFocus
                                                                />
                                                                <button type="submit" className="px-2 py-1 text-sm bg-blue-600 text-white rounded">Set</button>
                                                                <button type="button" onClick={() => { setShowCustomPriceInput(false); setCustomPriceInput(''); }} className="px-1 py-1 text-sm text-gray-500">×</button>
                                                            </form>
                                                        )}
                                                        {/* v4.20.0.a - More visible Clear button for consistency with bulk menu */}
                                                        {modalBook.priceTrigger && (
                                                            <button
                                                                onClick={() => {
                                                                    setBooks(prev => {
                                                                        const updated = prev.map(b =>
                                                                            b.id === modalBook.id ? { ...b, priceTrigger: null } : b
                                                                        );
                                                                        saveBooksToIndexedDB(updated);
                                                                        return updated;
                                                                    });
                                                                    setModalBook(prev => ({ ...prev, priceTrigger: null }));
                                                                }}
                                                                className="px-2 py-1 text-sm rounded bg-red-100 hover:bg-red-200 text-red-700"
                                                                title="Clear price goal"
                                                            >
                                                                Clear
                                                            </button>
                                                        )}
                                                    </div>

                                                    {modalBook.priceTrigger && (
                                                        <p className="mt-2 text-sm text-green-600">
                                                            ✓ Goal: {'$'}{modalBook.priceTrigger.toFixed(2)} or less
                                                        </p>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* v4.21.0.a - Book Notes section */}
                                    <div className="mb-6 pb-6 border-b border-gray-200">
                                        {isEditingNote ? (
                                            // Edit mode - show textarea
                                            <div>
                                                <h3 className="text-lg font-semibold text-gray-900 mb-3">Note</h3>
                                                <textarea
                                                    className="book-note-editor"
                                                    value={noteEditContent}
                                                    onChange={(e) => setNoteEditContent(e.target.value)}
                                                    placeholder="Add a personal note about this book..."
                                                    autoFocus
                                                    onKeyDown={(e) => {
                                                        // Stop all key events from propagating to prevent
                                                        // DEL from deleting books, etc.
                                                        e.stopPropagation();
                                                        if (e.key === 'Escape') {
                                                            setIsEditingNote(false);
                                                            setNoteEditContent('');
                                                        }
                                                    }}
                                                />
                                                <div className="flex gap-2 mt-2">
                                                    <button
                                                        onClick={() => {
                                                            const trimmedNote = noteEditContent.trim();
                                                            const newNote = trimmedNote || undefined;
                                                            // Save note (or clear if empty) - no undo support for notes
                                                            setBooks(prev => {
                                                                const updated = prev.map(b =>
                                                                    b.id === modalBook.id
                                                                        ? { ...b, userNote: newNote }
                                                                        : b
                                                                );
                                                                saveBooksToIndexedDB(updated);
                                                                return updated;
                                                            });
                                                            setModalBook(prev => ({
                                                                ...prev,
                                                                userNote: newNote
                                                            }));
                                                            setIsEditingNote(false);
                                                            setNoteEditContent('');
                                                        }}
                                                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            setIsEditingNote(false);
                                                            setNoteEditContent('');
                                                        }}
                                                        className="px-3 py-1 text-sm text-gray-600 hover:text-gray-800"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            </div>
                                        ) : modalBook.userNote ? (
                                            // Display mode - show sticky note
                                            <div className="book-note">
                                                <div className="book-note-text">{modalBook.userNote}</div>
                                                <button
                                                    className="book-note-edit-btn"
                                                    onClick={() => {
                                                        setNoteEditContent(modalBook.userNote);
                                                        setIsEditingNote(true);
                                                    }}
                                                    title="Edit note"
                                                >
                                                    ✏️
                                                </button>
                                            </div>
                                        ) : (
                                            // No note - show Add Note button
                                            <button
                                                onClick={() => {
                                                    setNoteEditContent('');
                                                    setIsEditingNote(true);
                                                }}
                                                className="px-3 py-1.5 text-sm text-gray-600 border border-gray-300 rounded hover:bg-gray-50 hover:border-gray-400"
                                            >
                                                + Add Note
                                            </button>
                                        )}
                                    </div>

                                    {!modalBook.description && (
                                        <div className="mb-6 pb-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <p className="text-sm text-gray-700">
                                                    ⚠️ <strong>Description not available</strong>
                                                </p>
                                                <p className="text-xs text-gray-600 mt-2">
                                                    This book may not have a description in Amazon's database, or the description wasn't captured during the library fetch.
                                                </p>
                                            </div>
                                        </div>
                                    )}
                                    
                                    {modalBook.description && (
                                        <div className="mb-6 pb-6 border-b border-gray-200">
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Description</h3>
                                            <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                                                {modalBook.description}
                                            </p>
                                        </div>
                                    )}
                                    
                                    {modalBook.topReviews && modalBook.topReviews.length > 0 && (
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900 mb-3">Top Reviews</h3>
                                            <div className="space-y-4">
                                                {modalBook.topReviews.slice(0, showAllReviews ? modalBook.topReviews.length : 3).map((review, idx) => {
                                                    const stars = review.stars || 0;
                                                    const title = review.title || '';
                                                    const text = review.text || review.contentAbstract?.textAbstract || '';
                                                    const reviewer = review.reviewer || review.contributor?.publicProfile?.publicProfile?.publicName?.displayString || '';
                                                    
                                                    return (
                                                        <div key={idx} className="bg-gray-50 rounded-lg p-4">
                                                            <div className="flex items-center gap-3 mb-2">
                                                                <span className="text-yellow-500 text-lg">{'★'.repeat(stars)}</span>
                                                                {title && (
                                                                    <span className="font-semibold text-gray-900">{title}</span>
                                                                )}
                                                            </div>
                                                            {reviewer && (
                                                                <p className="text-sm text-gray-600 mb-2">
                                                                    by {reviewer}
                                                                </p>
                                                            )}
                                                            {text && (
                                                                <p className="text-sm text-gray-700 leading-relaxed">
                                                                    {text}
                                                                </p>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            {!showAllReviews && modalBook.topReviews.length > 3 && (
                                                <button 
                                                    onClick={() => setShowAllReviews(true)}
                                                    className="mt-4 px-4 py-2 bg-blue-700 hover:bg-blue-800 text-white rounded-lg text-sm">
                                                    Show More Reviews ({modalBook.topReviews.length - 3} more)
                                                </button>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* v5.0.0 - Conditional rendering: Columns view or Explorer view */}
                    {viewMode === 'columns' && (
                    <div className="flex-1 min-h-0 overflow-x-scroll overflow-y-hidden mb-6 columns-scroll-container" onClick={(e) => {
                        // Clear selection if clicking on empty space (not on books or columns)
                        if (e.target === e.currentTarget || e.target.classList.contains('columns-container')) {
                            clearSelection();
                        }
                    }}>
                        <div className="flex h-full p-4 gap-4 columns-container" style={{ minWidth: 'fit-content' }} onClick={(e) => {
                            // Clear selection if clicking between columns
                            if (e.target === e.currentTarget) {
                                clearSelection();
                            }
                        }}>
                            {/* v4.16.0.e - Compute filtered books once per column for performance */}
                            {columns.map(column => ({
                                column,
                                filteredBooks: filteredBooks(column.books)
                            })).filter(({ column, filteredBooks: colFilteredBooks }) => {
                                // v4.16.0.am - Show truly empty columns (never had books) even with filters
                                const bookEntries = column.books.filter(item => !(item && item.type === 'divider'));
                                if (bookEntries.length === 0) return true;
                                // v4.16.0.an - Hide columns with only hidden books when Show Hidden is off
                                const hasVisibleBooks = colFilteredBooks.some(item => !(item && item.type === 'divider'));
                                if (!showHidden && !hasVisibleBooks) return false;
                                // v4.15.3 - Hide empty columns when filters are active
                                if (!hasActiveFilters) return true;
                                // v4.15.4.a - Show column if its name matches search term
                                if (searchTerm && column.name.toLowerCase().includes(searchTerm.toLowerCase())) return true;
                                // v4.15.4.b - Show column if any divider label matches search term
                                if (searchTerm && column.books.some(item =>
                                    item && item.type === 'divider' && item.label &&
                                    item.label.toLowerCase().includes(searchTerm.toLowerCase())
                                )) return true;
                                // Otherwise, show column if it has visible books (hide if filtered-empty)
                                return colFilteredBooks.some(item => !(item && item.type === 'divider'));
                            }).map(({ column, filteredBooks: colFilteredBooks }, colIndex) => (
                                <div key={column.id}
                                     data-column-id={column.id}
                                     onClick={() => setActiveColumnId(column.id)}
                                     className={`flex-shrink-0 w-96 bg-white rounded-lg flex flex-col relative ${draggedColumn === column.id && isDraggingColumn ? 'column-dragging' : ''}`}
                                     style={activeColumnId === column.id ? {
                                         boxShadow: 'inset 0 2px 4px rgba(64, 64, 64, 0.4), inset 0 -2px 4px rgba(64, 64, 64, 0.4), inset 2px 0 4px rgba(64, 64, 64, 0.4), inset -2px 0 4px rgba(64, 64, 64, 0.4), 0 1px 3px rgba(0, 0, 0, 0.12)',
                                         border: '2px solid rgb(96, 96, 96)'
                                     } : { boxShadow: '0 1px 3px rgba(0, 0, 0, 0.12), 0 1px 2px rgba(0, 0, 0, 0.24)' }}>
                                    {isDraggingColumn && columnDropTarget === colIndex && draggedColumn !== column.id && (
                                        <div className="column-drop-indicator" style={{ left: '-8px' }} />
                                    )}
                                    <div className="p-4 border-b border-gray-200 flex items-center justify-between"
                                         onMouseDown={(e) => handleColumnDragStart(e, column.id)}
                                         style={{ cursor: 'grab' }}>
                                        <div className="flex items-center gap-2 flex-1">
                                            <span className="text-gray-400">⋮⋮</span>
                                            {editingColumn === column.id ? (
                                                <input
                                                    type="text"
                                                    value={editingName}
                                                    onChange={(e) => setEditingName(e.target.value)}
                                                    onBlur={() => finishEditingColumn(column.id)}
                                                    onKeyPress={(e) => e.key === 'Enter' && finishEditingColumn(column.id)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Escape') {
                                                            setEditingColumn(null);
                                                            setEditingName('');
                                                        }
                                                    }}
                                                    className="text-lg font-semibold text-gray-900 border-2 border-blue-500 rounded px-2 py-1"
                                                    autoFocus
                                                />
                                            ) : (
                                                <div className="flex items-center gap-1 editable-title-container">
                                                    <h2
                                                        className="text-lg font-semibold text-gray-900 editable-title"
                                                        onDoubleClick={() => startEditingColumn(column.id, column.name)}
                                                        title="Double-click to rename"
                                                    >
                                                        {column.name}
                                                    </h2>
                                                    <span className="pencil-icon text-gray-400 text-sm">✏️</span>
                                                </div>
                                            )}
                                            {/* v4.16.0.e - Use pre-computed colFilteredBooks for performance */}
                                            <span className="text-sm text-gray-500">({colFilteredBooks.filter(item => !(item && item.type === 'divider')).length})</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <div className="relative" ref={columnMenuOpen === column.id ? columnMenuRef : null}>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); setColumnMenuOpen(columnMenuOpen === column.id ? null : column.id); }}
                                                    className="p-1 hover:bg-gray-100 rounded text-lg"
                                                    title="Column options">
                                                    ⋮
                                                </button>
                                                {columnMenuOpen === column.id && (
                                                    <div className="absolute right-0 top-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50 w-56"
                                                         onClick={(e) => e.stopPropagation()}>
                                                        <div className="p-2">
                                                            {/* Sort submenu */}
                                                            <div className="relative">
                                                                <button
                                                                    onClick={(e) => { e.stopPropagation(); setSortMenuOpen(sortMenuOpen === column.id ? null : column.id); }}
                                                                    className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm flex items-center justify-between">
                                                                    Sort Column
                                                                    <span>▸</span>
                                                                </button>
                                                                {sortMenuOpen === column.id && (
                                                                    <div className="absolute left-full top-0 ml-1 bg-white border border-gray-300 rounded-lg shadow-lg w-48 z-50">
                                                                        <div className="p-2">
                                                                            <button onClick={() => sortColumn(column.id, 'title-asc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Title (A→Z)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'title-desc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Title (Z→A)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'author-asc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Author (A→Z)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'author-desc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Author (Z→A)</button>
                                                                            {dataSource === 'enriched' && (
                                                                                <>
                                                                                    <button onClick={() => sortColumn(column.id, 'rating-desc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Rating (High→Low)</button>
                                                                                    <button onClick={() => sortColumn(column.id, 'rating-asc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Rating (Low→High)</button>
                                                                                </>
                                                                            )}
                                                                            <button onClick={() => sortColumn(column.id, 'acquired-desc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Acquired (Newest)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'acquired-asc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Acquired (Oldest)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'published-desc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Published (Newest)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'published-asc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Published (Oldest)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'series-pos-asc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Series (1→99)</button>
                                                                            <button onClick={() => sortColumn(column.id, 'series-pos-desc')} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Series (99→1)</button>
                                                                        </div>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            <div className="border-t border-gray-200 my-1"></div>

                                                            {/* Auto-divide options */}
                                                            <button onClick={() => autoDivideBySeries(column.id)} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Auto-Divide by Series</button>
                                                            {dataSource === 'enriched' && (
                                                                <button onClick={() => autoDivideByRating(column.id)} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Auto-Divide by Rating</button>
                                                            )}

                                                            <div className="border-t border-gray-200 my-1"></div>

                                                            {/* Insert Divider */}
                                                            <button onClick={() => { setInsertDividerOpen(column.id); setNewDividerLabel(''); }} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Insert Divider</button>

                                                            <div className="border-t border-gray-200 my-1"></div>

                                                            {/* v4.12.0 - Insert Column Before/After */}
                                                            <button onClick={() => { insertColumn(column.id, 'before'); setColumnMenuOpen(null); }} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Insert Column Before</button>
                                                            <button onClick={() => { insertColumn(column.id, 'after'); setColumnMenuOpen(null); }} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Insert Column After</button>

                                                            <div className="border-t border-gray-200 my-1"></div>

                                                            {/* Rename and Delete */}
                                                            <button onClick={() => { startEditingColumn(column.id, column.name); setColumnMenuOpen(null); }} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm">Rename Column</button>
                                                            {columns.length > 1 && (
                                                                <button onClick={() => { openDeleteDialog(column.id); setColumnMenuOpen(null); }} className="w-full text-left px-2 py-1 hover:bg-gray-100 rounded text-sm text-red-600">Delete Column</button>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex-1 overflow-y-auto p-4" onClick={(e) => {
                                        // v3.14.0.y - Clear selection when clicking empty space in scrollable area
                                        if (e.target === e.currentTarget) {
                                            clearSelection();
                                        }
                                    }}>
                                        <div className="grid grid-cols-3 gap-3 relative book-grid" onClick={(e) => {
                                            // v3.14.0.y - Clear selection when clicking empty grid cells
                                            if (e.target === e.currentTarget) {
                                                clearSelection();
                                            }
                                        }}>
                                            {/* v3.14.0.v - Old start-of-column indicator removed; overlay handles it */}
                                            {/* v4.16.0.d - Added filteredIndex for instance-based selection */}
                                            {/* v4.16.0.e - Use pre-computed colFilteredBooks for performance */}
                                            {colFilteredBooks.map((item, filteredIndex) => {
                                                // v3.11.0 - Handle dividers
                                                if (typeof item === 'object' && item.type === 'divider') {
                                                    const isHovering = hoveringDivider && hoveringDivider.columnId === column.id && hoveringDivider.dividerId === item.id;
                                                    const isEditing = editingDivider && editingDivider.columnId === column.id && editingDivider.dividerId === item.id;
                                                    // v4.19.1 - Check both selectedDivider AND selectedBooks for divider selection
                                                    const dividerActualIndex = column.books.findIndex(b => b && b.type === 'divider' && b.id === item.id);
                                                    const dividerKey = `${column.id}:divider:${item.id}:${dividerActualIndex}`;
                                                    const isSelected = (selectedDivider && selectedDivider.columnId === column.id && selectedDivider.dividerId === item.id) ||
                                                                       selectedBooks.has(dividerKey);

                                                    // v3.14.0.v - Old divider indicator code removed; overlay handles it

                                                    return (
                                                        <div key={item.id} className="col-span-3 relative">
                                                            <div className={`flex items-center gap-2 py-2 px-3 my-1 rounded cursor-pointer divider-item ${isSelected ? 'ring-2 ring-blue-500' : ''}`}
                                                                 data-divider-id={item.id}
                                                                 style={{ backgroundColor: isSelected ? '#dbeafe' : '#f3f4f6' }}
                                                                 onClick={(e) => {
                                                                     if (!isEditing) {
                                                                         e.stopPropagation();
                                                                         selectDividerGroup(column.id, item.id);
                                                                     }
                                                                 }}
                                                                 onContextMenu={(e) => {
                                                                     e.preventDefault();
                                                                     e.stopPropagation();
                                                                     setDividerContextMenu({
                                                                         x: e.clientX,
                                                                         y: e.clientY,
                                                                         columnId: column.id,
                                                                         dividerId: item.id,
                                                                         divider: item
                                                                     });
                                                                 }}
                                                                 onMouseEnter={() => setHoveringDivider({ columnId: column.id, dividerId: item.id })}
                                                                 onMouseLeave={() => setHoveringDivider(null)}>
                                                                {isHovering && (
                                                                <span
                                                                    className="text-gray-400 cursor-grab text-lg"
                                                                    onMouseDown={(e) => handleDividerMouseDown(e, item, column.id)}
                                                                    style={{ cursor: 'grab' }}>
                                                                    ⋮
                                                                </span>
                                                            )}
                                                            <div className="flex-1 text-center">
                                                                {isEditing ? (
                                                                    <input
                                                                        type="text"
                                                                        value={editingDividerLabel}
                                                                        onChange={(e) => setEditingDividerLabel(e.target.value)}
                                                                        onBlur={finishEditingDivider}
                                                                        onKeyPress={(e) => {
                                                                            if (e.key === 'Enter') finishEditingDivider();
                                                                        }}
                                                                        onKeyDown={(e) => {
                                                                            if (e.key === 'Escape') {
                                                                                setEditingDivider(null);
                                                                                setEditingDividerLabel('');
                                                                            }
                                                                        }}
                                                                        className="text-sm font-semibold text-gray-700 border-2 border-blue-500 rounded px-2 py-1 text-center"
                                                                        autoFocus
                                                                        onClick={(e) => e.stopPropagation()}
                                                                    />
                                                                ) : (
                                                                    <span
                                                                        className="text-sm font-semibold text-gray-700 cursor-pointer select-none"
                                                                        onDoubleClick={() => startEditingDivider(column.id, item.id, item.label)}
                                                                        title="Double-click to rename">
                                                                        ═══ {item.label} ═══
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {isHovering && (
                                                                <button
                                                                    onClick={() => deleteDivider(column.id, item.id)}
                                                                    className="text-gray-400 hover:text-red-600 font-bold text-lg"
                                                                    title="Delete divider">
                                                                    ✕
                                                                </button>
                                                            )}
                                                            </div>
                                                            {/* v3.14.0.v - Old divider bottom indicator removed; overlay handles it */}
                                                        </div>
                                                    );
                                                }

                                                // Regular book rendering
                                                const book = item;
                                                // v4.16.0.d - Find actual index in column.books for instance-based selection
                                                // v4.16.0.e - Use pre-computed colFilteredBooks for performance
                                                // Need to find which occurrence this is (in case of duplicates in same column)
                                                const filteredBooksBeforeThis = colFilteredBooks.slice(0, filteredIndex);
                                                const sameBookCountBefore = filteredBooksBeforeThis.filter(b => b && b.id === book.id).length;
                                                // Find the Nth occurrence of this bookId in column.books
                                                // v4.16.0.y - Use getBookIdFromEntry to handle both legacy strings and GUID objects
                                                let occurrenceCount = 0;
                                                let actualIndex = -1;
                                                for (let i = 0; i < column.books.length; i++) {
                                                    if (getBookIdFromEntry(column.books[i]) === book.id) {
                                                        if (occurrenceCount === sameBookCountBefore) {
                                                            actualIndex = i;
                                                            break;
                                                        }
                                                        occurrenceCount++;
                                                    }
                                                }

                                                // v4.16.0.x - Per-instance hidden check
                                                // GUID entries: check hiddenInstances Set using _instanceId from filteredBooks
                                                // Legacy entries: check book.isHidden
                                                const isInstanceHidden = book._instanceId
                                                    ? hiddenInstances.has(book._instanceId)
                                                    : book.isHidden;

                                                return (
                                                    <div key={`${book.id}-${actualIndex}`} className="relative book-item" data-book-id={book.id} data-index={actualIndex}>
                                                        {/* v4.16.0.d - Use composite key with index for selection check */}
                                                        {/* v4.16.0.f - Check clipboard sourcePositions for instance-specific visual */}
                                                        {/* v4.16.0.x - Use isInstanceHidden for per-instance opacity */}
                                                        {/* v4.16.0.ag - Dragging visual now instance-specific using column+index */}
                                                        <div className={`book-clickable ${selectedBooks.has(`${column.id}:${book.id}:${actualIndex}`) ? 'selected' : ''} ${draggedBook?.id === book.id && isDragging && draggedFromColumn === column.id && draggedBookIndex === actualIndex ? 'dragging' : ''} ${book.onWishlist || isInstanceHidden ? 'opacity-40' : ''} ${clipboard?.sourcePositions?.some(pos => pos.columnId === column.id && pos.index === actualIndex && pos.bookId === book.id) ? (clipboard.type === 'cut' ? 'cut-pending' : 'copy-pending') : ''}`}
                                                             onMouseDown={(e) => handleMouseDown(e, book, column.id, actualIndex)}
                                                             onClick={(e) => {
                                                                 e.stopPropagation();

                                                                 if (isDragging) return;

                                                                 // Always set active column when clicking a book
                                                                 setActiveColumnId(column.id);

                                                                 // v4.16.0.m - Capture book position for toast placement
                                                                 const rect = e.currentTarget.getBoundingClientRect();
                                                                 setToastPosition({
                                                                     x: rect.left + rect.width / 2,
                                                                     y: rect.top
                                                                 });

                                                                 if (e.ctrlKey || e.metaKey) {
                                                                     // Ctrl+Click: Toggle selection
                                                                     // v4.16.0.d - Pass actualIndex for instance-based selection
                                                                     toggleBookSelection(book.id, column.id, actualIndex);
                                                                     setLastClickedBook({ id: book.id, columnId: column.id, index: actualIndex });
                                                                 } else if (e.shiftKey) {
                                                                     // Shift+Click: Range selection
                                                                     if (lastClickedBook && lastClickedBook.columnId === column.id) {
                                                                         // Range from last clicked book to this book (same column)
                                                                         selectBookRange(lastClickedBook.id, book.id, column.id, lastClickedBook.index, actualIndex);
                                                                     } else {
                                                                         // No anchor point or different column: treat as single click
                                                                         clearSelection();
                                                                         toggleBookSelection(book.id, column.id, actualIndex);
                                                                         setLastClickedBook({ id: book.id, columnId: column.id, index: actualIndex });
                                                                     }
                                                                 } else {
                                                                     // Single click: Select this book (replace selection)
                                                                     clearSelection();
                                                                     toggleBookSelection(book.id, column.id, actualIndex);
                                                                     setLastClickedBook({ id: book.id, columnId: column.id, index: actualIndex });
                                                                 }
                                                             }}
                                                             onDoubleClick={(e) => {
                                                                 e.stopPropagation();
                                                                 // Double-click: Open modal for all books
                                                                 openBookModal(book, column.id);
                                                             }}
                                                             onContextMenu={(e) => {
                                                                 e.preventDefault();
                                                                 // Right-click: If book not in selection, select it first
                                                                 // v4.16.0.d - Use composite key with index for selection check
                                                                 if (!selectedBooks.has(`${column.id}:${book.id}:${actualIndex}`)) {
                                                                     clearSelection();
                                                                     toggleBookSelection(book.id, column.id, actualIndex);
                                                                 }
                                                                 // Show context menu
                                                                 setContextMenu({
                                                                     x: e.clientX,
                                                                     y: e.clientY,
                                                                     bookId: book.id,
                                                                     columnId: column.id
                                                                 });
                                                             }}
                                                             title={book.collections && book.collections.length > 0
                                                                ? `Collections:\n${book.collections.map(c => c.name).join('\n')}`
                                                                : '📭 No collections'}>
                                                            <div className="relative">
                                                                {blankImageBooks.has(book.id) ? (
                                                                    <div className="w-full aspect-[2/3] rounded shadow-lg overflow-hidden flex flex-col" 
                                                                         style={{ backgroundColor: '#d4c5a9' }}>
                                                                        <div className="flex-1 flex items-center justify-center px-4">
                                                                            <div className="text-center">
                                                                                <div className="text-xs font-serif font-bold text-gray-800 leading-tight mb-2">
                                                                                    {book.title.length > 40 ? book.title.substring(0, 40) + '...' : book.title}
                                                                                </div>
                                                                                <div className="text-xs text-gray-600 mt-2">KINDLE EDITION</div>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                ) : (
                                                                    <img src={coverUrlMap[book.coverUrl] || book.coverUrl}
                                                                         alt={book.title}
                                                                         className="w-full rounded shadow-lg"
                                                                         onLoad={(e) => checkIfBlankImage(e.target, book.id)}
                                                                         onError={(e) => e.target.src = 'https://via.placeholder.com/128x192/4f46e5/fff?text=No+Cover'} />
                                                                )}
                                                                {/* Top-right: Rating badge */}
                                                                {book.rating > 0 && (
                                                                    <div className="absolute top-1 right-1 bg-black bg-opacity-75 rounded px-1.5 py-0.5 text-xs font-bold text-yellow-400">
                                                                        ★ {book.rating.toFixed(1)}
                                                                    </div>
                                                                )}
                                                                {/* Bottom-right: Read status checkmark */}
                                                                {book.readStatus === 'READ' && (
                                                                    <div className="absolute bottom-1 right-1 bg-green-600 rounded-full w-6 h-6 flex items-center justify-center" title="Read">
                                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                                        </svg>
                                                                    </div>
                                                                )}
                                                                {/* Bottom-left: Price tag (wishlist) or Ownership badge (non-purchased owned) */}
                                                                {book.onWishlist && book.currentPrice != null ? (
                                                                    <div
                                                                        className={`absolute bottom-1 left-1 ${book.priceTrigger && book.currentPrice <= book.priceTrigger ? 'bg-green-500' : 'bg-gray-500'} bg-opacity-90 text-xs font-bold text-white`}
                                                                        style={{
                                                                            clipPath: 'polygon(0% 0%, 85% 0%, 100% 50%, 85% 100%, 0% 100%)',
                                                                            padding: '3px 14px 3px 6px'
                                                                        }}
                                                                        title={book.priceTrigger ? `Goal: $${book.priceTrigger.toFixed(2)} or less` : 'Current price'}
                                                                    >
                                                                        ${book.currentPrice.toFixed(2)}
                                                                    </div>
                                                                ) : book.ownershipType && book.ownershipType !== 'purchased' && (() => {
                                                                    const badgeConfig = {
                                                                        sample: { bg: 'bg-amber-500', text: 'SAMPLE' },
                                                                        borrowed: { bg: 'bg-teal-500', text: 'BORROWED' },
                                                                        prime: { bg: 'bg-purple-500', text: 'PRIME' },
                                                                        kindleUnlimited: { bg: 'bg-purple-500', text: 'KU' },
                                                                        koll: { bg: 'bg-purple-500', text: 'KOLL' },
                                                                        comixology: { bg: 'bg-purple-500', text: 'COMIX' },
                                                                        unknown: { bg: 'bg-gray-500', text: '?' }
                                                                    };
                                                                    const config = badgeConfig[book.ownershipType];
                                                                    return config ? (
                                                                        <div className={`absolute bottom-1 left-1 ${config.bg} bg-opacity-90 rounded px-1.5 py-0.5 text-xs font-bold text-white`}>
                                                                            {config.text}
                                                                        </div>
                                                                    ) : null;
                                                                })()}
                                                                {/* Top-left: Selection or Collections badge */}
                                                                {/* v4.16.0.d - Use composite key with index for selection check */}
                                                                {selectedBooks.has(`${column.id}:${book.id}:${actualIndex}`) ? (
                                                                    <div className="absolute top-1 left-1 bg-blue-700 rounded-full w-6 h-6 flex items-center justify-center z-10">
                                                                        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                                                                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                                                                        </svg>
                                                                    </div>
                                                                ) : book.collections && book.collections.length > 0 && (
                                                                    <div className="absolute top-1 left-1 bg-gray-700 bg-opacity-75 rounded px-1.5 py-0.5 text-xs font-bold text-white">
                                                                        📁 {book.collections.length}
                                                                    </div>
                                                                )}
                                                                {/* Hidden book overlay (v4.1.0.d, v4.1.0.e larger, v4.16.0.x per-instance) */}
                                                                {isInstanceHidden && showHidden && (
                                                                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                                                                        <span style={{ fontSize: '90px', filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.5))' }}>🚫</span>
                                                                    </div>
                                                                )}
                                                            </div>
                                                            <div className="mt-2 text-xs">
                                                                <div className="font-medium text-gray-800 leading-tight line-clamp-2" title={book.title}>
                                                                    {book.title}
                                                                </div>
                                                                <div className="text-gray-600 mt-1 leading-tight line-clamp-1" title={book.author}>
                                                                    {book.author}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                            {/* v3.14.0.v - Old fallback indicator removed; overlay handles all cases */}
                                        </div>
                                    </div>
                                    {isDraggingColumn && columnDropTarget === colIndex + 1 && draggedColumn !== column.id && (
                                        <div className="column-drop-indicator" style={{ right: '-8px' }} />
                                    )}
                                </div>
                            ))}
                            {/* v4.12.0.b - Floating Add Column button removed; use column dropdown menu instead */}
                        </div>
                    </div>
                    )}

                    {/* v5.0.0 - Book Explorer view */}
                    {viewMode === 'explorer' && (
                        <div className="flex-1 min-h-0 flex mb-6">
                            {/* Left pane: Folder tree */}
                            {/* v5.0.0-alpha.49 - onDragOver prevents browser "split view" prompt */}
                            {/* v5.0.0-alpha.91 - Resizable left pane */}
                            {/* v5.0.0-alpha.95 - Sticky header and virtual folders */}
                            <div className="bg-white border-r border-gray-200 flex flex-col flex-shrink-0"
                                style={{ width: `${leftPaneWidth}px` }}
                                onDragOver={(e) => e.preventDefault()}>
                                {/* Sticky section: Header + virtual folders */}
                                {/* v5.0.0-alpha.97 - Border-bottom separates sticky from scrollable */}
                                <div className="sticky top-0 bg-white z-10 border-b border-gray-300">
                                <div className="p-3 border-b border-gray-200 font-medium text-gray-700 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <span>Folders</span>
                                        {/* v5.0.0-alpha.125 - Navigation buttons with proper chevron icons */}
                                        <div className="flex gap-1 border-x border-gray-300 px-2">
                                            <button
                                                onClick={goBack}
                                                disabled={!canGoBack}
                                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${
                                                    canGoBack
                                                        ? 'text-gray-700 hover:bg-blue-50 hover:border-blue-300 border-gray-300'
                                                        : 'text-gray-300 cursor-not-allowed border-gray-200'
                                                }`}
                                                title="Back (Alt+Left)">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={canGoBack ? '' : 'opacity-40'}>
                                                    <path d="M7.5 2L3.5 6L7.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                            <button
                                                onClick={goForward}
                                                disabled={!canGoForward}
                                                className={`w-6 h-6 rounded flex items-center justify-center transition-colors border ${
                                                    canGoForward
                                                        ? 'text-gray-700 hover:bg-blue-50 hover:border-blue-300 border-gray-300'
                                                        : 'text-gray-300 cursor-not-allowed border-gray-200'
                                                }`}
                                                title="Forward (Alt+Right)">
                                                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className={canGoForward ? '' : 'opacity-40'}>
                                                    <path d="M4.5 2L8.5 6L4.5 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                        </div>
                                    </div>
                                    {/* Expand/Collapse All toggle */}
                                    <button
                                        onClick={() => {
                                            // Check if any folder is expanded
                                            const anyExpanded = folders.some(f => !f.collapsed && getChildFolders(f.id).length > 0);
                                            // Toggle all: if any expanded, collapse all; else expand all
                                            setFolders(prev => prev.map(f => ({ ...f, collapsed: anyExpanded })));
                                        }}
                                        className="text-gray-400 hover:text-gray-600 text-sm px-1"
                                        title={folders.some(f => !f.collapsed && getChildFolders(f.id).length > 0) ? 'Collapse all folders' : 'Expand all folders'}>
                                        {folders.some(f => !f.collapsed && getChildFolders(f.id).length > 0) ? '▼' : '▶'}
                                    </button>
                                </div>
                                <div className="p-2">
                                    {/* All Books (virtual, view-only) - v5.0.0-alpha.52 added "+" for new root folder */}
                                    <div
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer group ${selectedFolderId === '__all__' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                                        onClick={() => navigateToFolder('__all__')}>
                                        <span className="pointer-events-none">{FOLDER_ALL_BOOKS.icon}</span>
                                        <span className="flex-1 pointer-events-none">{FOLDER_ALL_BOOKS.name}</span>
                                        <span className="text-xs text-gray-500 pointer-events-none">({books.length})</span>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                const newFolder = {
                                                    id: `folder-${Date.now()}`,
                                                    name: 'New Folder',
                                                    parentId: null,
                                                    bookIds: [],
                                                    childFolderIds: [],
                                                    collapsed: false
                                                };
                                                recordAction({
                                                    type: 'CREATE_FOLDER',
                                                    folderId: newFolder.id,
                                                    parentId: null,
                                                    folder: { ...newFolder }
                                                });
                                                setFolders(prev => [...prev, newFolder]);
                                                navigateToFolder(newFolder.id);
                                                setEditingFolderId(newFolder.id);
                                                setEditingFolderName('New Folder');
                                            }}
                                            className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 px-1"
                                            title="New folder">
                                            +
                                        </button>
                                    </div>
                                    {/* Divider line to separate All Books from folders */}
                                    <div className="border-b border-gray-200 my-1 mx-2"></div>
                                    {/* v5.0.0-alpha.63 - My Library (organizational root container) */}
                                    <div
                                        className={`w-full flex items-center gap-2 px-2 py-1.5 rounded cursor-pointer ${selectedFolderId === '__library__' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'}`}
                                        onClick={() => navigateToFolder('__library__')}>
                                        <span className="pointer-events-none">{FOLDER_LIBRARY.icon}</span>
                                        <span className="flex-1 pointer-events-none">{FOLDER_LIBRARY.name}</span>
                                        <span className="text-xs text-gray-500 pointer-events-none">
                                            ({getChildFolders(null).length} folders)
                                        </span>
                                    </div>
                                    {/* Inbox - indented as part of folder hierarchy */}
                                    <div
                                        className={`w-full flex items-center gap-2 pl-4 pr-2 py-1.5 rounded cursor-pointer ${selectedFolderId === '__inbox__' ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'} ${explorerDropTargetId === '__inbox__' ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                                        onClick={() => navigateToFolder('__inbox__')}
                                        onDragOver={(e) => {
                                            e.preventDefault();
                                            e.dataTransfer.dropEffect = 'move';
                                            setExplorerDropTargetId('__inbox__');
                                        }}
                                        onDragLeave={(e) => {
                                            // Only clear if actually leaving container, not moving to child element
                                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                                setExplorerDropTargetId(null);
                                            }
                                        }}
                                        onDrop={(e) => {
                                            e.preventDefault();
                                            const dragData = JSON.parse(e.dataTransfer.getData('application/x-readerwrangler'));
                                            const { sourceFolder, bookIds } = dragData;

                                            // Check if dragging from All Books (view-only)
                                            if (sourceFolder === '__all__') {
                                                setClipboardMessage('All Books is view-only. Organize from folders.');
                                                setToastPosition({ x: e.clientX, y: e.clientY });
                                                setFooterClipboardVisible(false);
                                                setToastVisible(true);
                                                setToastAnimating(false);
                                                setTimeout(() => {
                                                    setToastAnimating(true);
                                                    setTimeout(() => {
                                                        setToastVisible(false);
                                                        setToastAnimating(false);
                                                    }, 1000);
                                                }, 1500);
                                                setExplorerDropTargetId(null);
                                                setExplorerSelectedBooks(new Set());
                                                return;
                                            }

                                            // Remove these books from all user folders
                                            setFolders(prev => prev.map(folder => ({
                                                ...folder,
                                                bookIds: (folder.bookIds || []).filter(id => !bookIds.includes(id))
                                            })));
                                            setExplorerDropTargetId(null);
                                            setExplorerSelectedBooks(new Set());
                                        }}>
                                        <span className="pointer-events-none">{FOLDER_INBOX.icon}</span>
                                        <span className="flex-1 pointer-events-none">{FOLDER_INBOX.name}</span>
                                        <span className="text-xs text-gray-500 pointer-events-none">({getFolderBookIds('__inbox__').length})</span>
                                    </div>
                                </div>
                                </div>
                                {/* Scrollable section: User folders */}
                                <div className="flex-1 overflow-y-auto p-2">
                                    {/* User folders with recursive subfolder rendering */}
                                    {(() => {
                                        // Recursive folder renderer
                                        const renderFolder = (folder, depth = 0) => {
                                            const children = getChildFolders(folder.id);
                                            const hasChildren = children.length > 0;
                                            const isExpanded = !folder.collapsed;

                                            return (
                                                <React.Fragment key={folder.id}>
                                                    <div
                                                        className={`w-full flex items-center gap-1 pr-2 py-1.5 rounded cursor-pointer group ${selectedFolderId === folder.id ? 'bg-blue-100 text-blue-800' : 'hover:bg-gray-100'} ${explorerDropTargetId === folder.id || (sidebarFolderDragTarget?.type === 'reparent' && sidebarFolderDragTarget?.folderId === folder.id) ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                                                        style={{
                                                            paddingLeft: `${16 + depth * 16}px`,
                                                            // v5.0.0-alpha.86 - Visual feedback for folder reorder
                                                            ...(sidebarFolderDragTarget?.type === 'reorder' && sidebarFolderDragTarget?.folderId === folder.id
                                                                ? sidebarFolderDragTarget.position === 'before'
                                                                    ? { borderTop: '3px solid #3b82f6' }
                                                                    : { borderBottom: '3px solid #3b82f6' }
                                                                : {}),
                                                            // v5.0.0-alpha.141 - Dim cut folders
                                                            ...(folderClipboard.operation === 'cut' && folderClipboard.items.includes(folder.id)
                                                                ? { opacity: 0.5 }
                                                                : {})
                                                        }}
                                                        draggable={true}
                                                        onDragStart={(e) => {
                                                            // v5.0.0-alpha.86 - Enable folder dragging in sidebar
                                                            e.dataTransfer.effectAllowed = 'move';
                                                            e.dataTransfer.setData('application/x-folder-reorder', JSON.stringify({
                                                                folderIds: [folder.id],
                                                                sourceFolderId: selectedFolderId
                                                            }));
                                                        }}
                                                        onDragEnd={() => {
                                                            setSidebarFolderDragTarget(null);
                                                            setBreadcrumbDropTargetId(null);
                                                        }}
                                                        onClick={() => navigateToFolder(folder.id)}
                                                        onDoubleClick={() => {
                                                            setEditingFolderId(folder.id);
                                                            setEditingFolderName(folder.name);
                                                        }}
                                                        onDragOver={(e) => {
                                                            e.preventDefault();
                                                            const types = Array.from(e.dataTransfer.types);
                                                            const isFolderDrag = types.includes('application/x-folder-reorder');
                                                            const isBookDrag = types.includes('application/x-readerwrangler');

                                                            if (isBookDrag) {
                                                                // Book drag - existing behavior
                                                                const isCopy = e.ctrlKey;
                                                                setExplorerIsCopyDrag(isCopy);
                                                                e.dataTransfer.dropEffect = isCopy ? 'copy' : 'move';
                                                                setExplorerDropTargetId(folder.id);
                                                            } else if (isFolderDrag) {
                                                                // v5.0.0-alpha.86 - Folder drag with zone detection
                                                                e.dataTransfer.dropEffect = 'move';
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                const y = e.clientY - rect.top;
                                                                const height = rect.height;
                                                                const edgeZone = height * 0.25;

                                                                let newTarget;
                                                                if (y < edgeZone) {
                                                                    newTarget = { type: 'reorder', folderId: folder.id, position: 'before' };
                                                                } else if (y > height - edgeZone) {
                                                                    newTarget = { type: 'reorder', folderId: folder.id, position: 'after' };
                                                                } else {
                                                                    newTarget = { type: 'reparent', folderId: folder.id };
                                                                }
                                                                // Only update if changed
                                                                const current = sidebarFolderDragTarget;
                                                                if (!current || current.type !== newTarget.type ||
                                                                    current.folderId !== newTarget.folderId ||
                                                                    current.position !== newTarget.position) {
                                                                    setSidebarFolderDragTarget(newTarget);
                                                                }
                                                            }

                                                            // v5.0.0-alpha.82 - Auto-expand collapsed folder after 500ms hover
                                                            if (hasChildren && folder.collapsed) {
                                                                if (!dragHoverExpandTimeoutRef.current) {
                                                                    dragHoverExpandTimeoutRef.current = setTimeout(() => {
                                                                        setFolders(prev => prev.map(f =>
                                                                            f.id === folder.id ? { ...f, collapsed: false } : f
                                                                        ));
                                                                        dragHoverExpandTimeoutRef.current = null;
                                                                    }, 500);
                                                                }
                                                            }
                                                        }}
                                                        onDragLeave={(e) => {
                                                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                                                setExplorerDropTargetId(null);
                                                                setSidebarFolderDragTarget(null);
                                                                // v5.0.0-alpha.82 - Clear auto-expand timeout
                                                                if (dragHoverExpandTimeoutRef.current) {
                                                                    clearTimeout(dragHoverExpandTimeoutRef.current);
                                                                    dragHoverExpandTimeoutRef.current = null;
                                                                }
                                                            }
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            // v5.0.0-alpha.82 - Clear auto-expand timeout on drop
                                                            if (dragHoverExpandTimeoutRef.current) {
                                                                clearTimeout(dragHoverExpandTimeoutRef.current);
                                                                dragHoverExpandTimeoutRef.current = null;
                                                            }

                                                            // v5.0.0-alpha.86 - Handle folder drops first
                                                            const folderData = e.dataTransfer.getData('application/x-folder-reorder');
                                                            if (folderData) {
                                                                try {
                                                                    const { folderIds } = JSON.parse(folderData);
                                                                    const target = sidebarFolderDragTarget;
                                                                    setSidebarFolderDragTarget(null);

                                                                    if (target?.type === 'reparent') {
                                                                        reparentFolder(folderIds, folder.id);
                                                                    } else if (target?.type === 'reorder') {
                                                                        // Reorder among siblings
                                                                        const draggedFolder = folders.find(f => f.id === folderIds[0]);
                                                                        if (!draggedFolder) return;

                                                                        // Only reorder if same parent level
                                                                        if (draggedFolder.parentId !== folder.parentId) {
                                                                            // Different parent - reparent to this folder's parent first
                                                                            reparentFolder(folderIds, folder.parentId);
                                                                        }

                                                                        // Get siblings at this level
                                                                        const siblings = getChildFolders(folder.parentId);
                                                                        const fromIndex = siblings.findIndex(f => f.id === folderIds[0]);
                                                                        let toIndex = siblings.findIndex(f => f.id === folder.id);
                                                                        if (target.position === 'after') toIndex++;
                                                                        if (fromIndex < toIndex) toIndex--;

                                                                        if (fromIndex !== -1 && fromIndex !== toIndex) {
                                                                            // Build new order
                                                                            const newOrder = siblings.filter(f => f.id !== folderIds[0]);
                                                                            newOrder.splice(toIndex, 0, draggedFolder);

                                                                            // Update sortIndex or childFolderIds
                                                                            if (folder.parentId === null) {
                                                                                // Root level - update sortIndex
                                                                                setFolders(prev => prev.map(f => {
                                                                                    const idx = newOrder.findIndex(s => s.id === f.id);
                                                                                    if (idx !== -1) {
                                                                                        return { ...f, sortIndex: idx };
                                                                                    }
                                                                                    return f;
                                                                                }));
                                                                            } else {
                                                                                // Nested - update parent's childFolderIds
                                                                                const newChildIds = newOrder.map(f => f.id);
                                                                                setFolders(prev => prev.map(f =>
                                                                                    f.id === folder.parentId
                                                                                        ? { ...f, childFolderIds: newChildIds }
                                                                                        : f
                                                                                ));
                                                                            }

                                                                            recordAction({
                                                                                type: 'REORDER_FOLDER',
                                                                                folderId: folderIds[0],
                                                                                fromIndex,
                                                                                toIndex,
                                                                                parentId: folder.parentId
                                                                            });
                                                                            console.log(`📁 Reordered folder in sidebar`);
                                                                        }
                                                                    }
                                                                } catch (err) {
                                                                    console.error('Sidebar folder drop error:', err);
                                                                }
                                                                return;
                                                            }

                                                            // Book drop - existing behavior
                                                            const bookDataStr = e.dataTransfer.getData('application/x-readerwrangler');
                                                            if (!bookDataStr) return;
                                                            const dragData = JSON.parse(bookDataStr);
                                                            const { sourceFolder, bookIds } = dragData;

                                                            const showToastLocal = (msg) => {
                                                                setClipboardMessage(msg);
                                                                setToastPosition({ x: e.clientX, y: e.clientY });
                                                                setFooterClipboardVisible(false);
                                                                setToastVisible(true);
                                                                setToastAnimating(false);
                                                                setTimeout(() => {
                                                                    setToastAnimating(true);
                                                                    setTimeout(() => {
                                                                        setToastVisible(false);
                                                                        setToastAnimating(false);
                                                                    }, 1000);
                                                                }, 1500);
                                                            };

                                                            if (sourceFolder === '__all__') {
                                                                showToastLocal('All Books is view-only. Organize from folders.');
                                                                setExplorerDropTargetId(null);
                                                                setExplorerSelectedBooks(new Set());
                                                                return;
                                                            }

                                                            const existing = new Set(folder.bookIds || []);
                                                            const newBookIds = bookIds.filter(id => !existing.has(id));
                                                            if (newBookIds.length === 0) {
                                                                showToastLocal(bookIds.length === 1 ? 'Book already in folder' : 'Books already in folder');
                                                            } else {
                                                                // v5.0.0-alpha.46 - Capture fromIndices for undo before modifying
                                                                const sourceFolderObj = folders.find(f => f.id === sourceFolder);
                                                                const fromIndices = bookIds.map(id => (sourceFolderObj?.bookIds || []).indexOf(id));

                                                                setFolders(prev => prev.map(f => {
                                                                    if (f.id === folder.id) {
                                                                        return { ...f, bookIds: [...newBookIds, ...(f.bookIds || [])] };
                                                                    }
                                                                    if (!explorerIsCopyDrag && f.id === sourceFolder) {
                                                                        return { ...f, bookIds: (f.bookIds || []).filter(id => !bookIds.includes(id)) };
                                                                    }
                                                                    return f;
                                                                }));

                                                                // v5.0.0-alpha.46 - Record action for undo
                                                                if (explorerIsCopyDrag) {
                                                                    recordAction({
                                                                        type: 'COPY_BOOKS_FOLDER',
                                                                        toFolderId: folder.id,
                                                                        bookIds: newBookIds,
                                                                        toIndex: 0 // Prepended to start
                                                                    });
                                                                    console.log(`📋 Copied ${newBookIds.length} book(s) to "${folder.name}"`);
                                                                } else {
                                                                    recordAction({
                                                                        type: 'MOVE_BOOKS_FOLDER',
                                                                        fromFolderId: sourceFolder,
                                                                        toFolderId: folder.id,
                                                                        bookIds: bookIds,
                                                                        fromIndices: fromIndices,
                                                                        toIndex: 0 // Prepended to start
                                                                    });
                                                                    console.log(`📦 Moved ${bookIds.length} book(s) to "${folder.name}"`);
                                                                }
                                                            }
                                                            setExplorerDropTargetId(null);
                                                            setExplorerSelectedBooks(new Set());
                                                            setExplorerIsCopyDrag(false);
                                                        }}
                                                        onContextMenu={(e) => {
                                                            // v5.0.0-alpha.133 - Show visual context menu (replaces prompt)
                                                            e.preventDefault();
                                                            setFolderContextMenu({
                                                                folderId: folder.id,
                                                                x: e.clientX,
                                                                y: e.clientY
                                                            });
                                                        }}>
                                                        {/* Expand/collapse chevron for folders with children */}
                                                        {hasChildren ? (
                                                            <span
                                                                className="text-gray-400 hover:text-gray-600 cursor-pointer w-4 text-center"
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setFolders(prev => prev.map(f =>
                                                                        f.id === folder.id ? { ...f, collapsed: !f.collapsed } : f
                                                                    ));
                                                                }}>
                                                                {isExpanded ? '▼' : '▶'}
                                                            </span>
                                                        ) : (
                                                            <span className="w-4"></span>
                                                        )}
                                                        <span className="pointer-events-none">📁</span>
                                                        {editingFolderId === folder.id ? (
                                                            <input
                                                                type="text"
                                                                value={editingFolderName}
                                                                onChange={(e) => setEditingFolderName(e.target.value)}
                                                                onBlur={() => {
                                                                    // v5.0.0-alpha.134 - Keep placeholder text if user didn't type
                                                                    const finalName = (isPlaceholderMode || !editingFolderName.trim())
                                                                        ? editingFolderName
                                                                        : editingFolderName.trim();
                                                                    if (finalName) {
                                                                        setFolders(prev => prev.map(f =>
                                                                            f.id === folder.id ? { ...f, name: finalName } : f
                                                                        ));
                                                                    }
                                                                    setEditingFolderId(null);
                                                                    setEditingFolderName('');
                                                                    setIsPlaceholderMode(false);
                                                                }}
                                                                onKeyDown={(e) => {
                                                                    // v5.0.0-alpha.134 - Clear placeholder on first character typed
                                                                    if (isPlaceholderMode && e.key.length === 1) {
                                                                        // Printable character typed - clear placeholder first
                                                                        setEditingFolderName('');
                                                                        setIsPlaceholderMode(false);
                                                                        // Let the character be inserted by default behavior
                                                                        return;
                                                                    }

                                                                    if (e.key === 'Enter') {
                                                                        // v5.0.0-alpha.134 - Keep placeholder text if user didn't type
                                                                        const finalName = (isPlaceholderMode || !editingFolderName.trim())
                                                                            ? editingFolderName
                                                                            : editingFolderName.trim();
                                                                        if (finalName) {
                                                                            setFolders(prev => prev.map(f =>
                                                                                f.id === folder.id ? { ...f, name: finalName } : f
                                                                            ));
                                                                        }
                                                                        setEditingFolderId(null);
                                                                        setEditingFolderName('');
                                                                        setIsPlaceholderMode(false);
                                                                    } else if (e.key === 'Escape') {
                                                                        setEditingFolderId(null);
                                                                        setEditingFolderName('');
                                                                        setIsPlaceholderMode(false);
                                                                    }
                                                                }}
                                                                onFocus={(e) => {
                                                                    // v5.0.0-alpha.134 - Position cursor at start in placeholder mode
                                                                    if (isPlaceholderMode) {
                                                                        e.target.setSelectionRange(0, 0);
                                                                    }
                                                                }}
                                                                onClick={(e) => e.stopPropagation()}
                                                                autoFocus
                                                                className={`flex-1 px-1 py-0.5 text-sm border border-blue-400 rounded outline-none ${isPlaceholderMode ? 'text-gray-400' : ''}`}
                                                            />
                                                        ) : (
                                                            <>
                                                                <span className="flex-1 pointer-events-none">{folder.name}</span>
                                                                {(() => {
                                                                    const counts = getFolderTotalCount(folder.id);
                                                                    const tooltip = counts.subfolder > 0
                                                                        ? `${counts.direct} direct • ${counts.subfolder} in subfolders`
                                                                        : `${counts.direct} books`;
                                                                    return (
                                                                        <span
                                                                            className="text-xs text-gray-500 pointer-events-none"
                                                                            title={tooltip}>
                                                                            ({counts.total})
                                                                        </span>
                                                                    );
                                                                })()}
                                                                {/* v5.0.0-alpha.52 - New subfolder button */}
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        const newFolder = {
                                                                            id: `folder-${Date.now()}`,
                                                                            name: 'New Subfolder',
                                                                            parentId: folder.id,
                                                                            bookIds: [],
                                                                            childFolderIds: [],
                                                                            collapsed: false
                                                                        };
                                                                        recordAction({
                                                                            type: 'CREATE_FOLDER',
                                                                            folderId: newFolder.id,
                                                                            parentId: folder.id,
                                                                            folder: { ...newFolder }
                                                                        });
                                                                        // Expand parent and add subfolder in single update
                                                                        setFolders(prev => [
                                                                            ...prev.map(f => f.id === folder.id ? { ...f, collapsed: false } : f),
                                                                            newFolder
                                                                        ]);
                                                                        navigateToFolder(newFolder.id);
                                                                        setEditingFolderId(newFolder.id);
                                                                        setEditingFolderName('New Subfolder');
                                                                        setIsPlaceholderMode(true); // v5.0.0-alpha.134 - Show as placeholder
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 text-blue-500 hover:text-blue-700 px-1"
                                                                    title="New subfolder">
                                                                    +
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (window.confirm(`Delete folder "${folder.name}"?`)) {
                                                                            // v5.0.0-alpha.55 - Move orphaned books up one level before deleting
                                                                            const getAllDescendants = (folderId, allFolders) => {
                                                                                const children = allFolders.filter(f => f.parentId === folderId);
                                                                                let descendants = [...children];
                                                                                children.forEach(child => {
                                                                                    descendants = [...descendants, ...getAllDescendants(child.id, allFolders)];
                                                                                });
                                                                                return descendants;
                                                                            };
                                                                            const descendants = getAllDescendants(folder.id, folders);
                                                                            const foldersToDelete = [folder, ...descendants];
                                                                            const folderIdsToDelete = new Set(foldersToDelete.map(f => f.id));
                                                                            const folderIndices = foldersToDelete.map(f => folders.findIndex(x => x.id === f.id));

                                                                            // Determine destination for orphaned books: parent folder or Inbox
                                                                            const destinationId = folder.parentId || '__inbox__';
                                                                            const destinationFolder = folders.find(f => f.id === destinationId);
                                                                            const destinationName = destinationFolder?.name || 'Inbox';

                                                                            // Collect all books from folders being deleted
                                                                            const allOrphanedBookIds = foldersToDelete.flatMap(f => f.bookIds || []);
                                                                            const uniqueOrphanedBookIds = [...new Set(allOrphanedBookIds)];

                                                                            // Record action for undo (includes orphan relocation info)
                                                                            recordAction({
                                                                                type: 'DELETE_FOLDERS',
                                                                                deletedFolders: foldersToDelete.map(f => ({ ...f })),
                                                                                folderIndices: folderIndices,
                                                                                orphanedBooks: uniqueOrphanedBookIds,
                                                                                orphanDestination: destinationId
                                                                            });

                                                                            // Move orphaned books to destination, then delete folders
                                                                            setFolders(prev => {
                                                                                let updated = prev.map(f => {
                                                                                    if (f.id === destinationId && uniqueOrphanedBookIds.length > 0) {
                                                                                        const existingIds = new Set(f.bookIds || []);
                                                                                        const newBookIds = uniqueOrphanedBookIds.filter(id => !existingIds.has(id));
                                                                                        return { ...f, bookIds: [...newBookIds, ...(f.bookIds || [])] };
                                                                                    }
                                                                                    return f;
                                                                                });
                                                                                return updated.filter(f => !folderIdsToDelete.has(f.id));
                                                                            });

                                                                            // v5.0.0-alpha.58 - Navigate to parent folder instead of All Books
                                                                            if (selectedFolderId === folder.id || folderIdsToDelete.has(selectedFolderId)) {
                                                                                setSelectedFolderId(destinationId);
                                                                            }

                                                                            // Show toast with result
                                                                            if (uniqueOrphanedBookIds.length > 0) {
                                                                                const bookWord = uniqueOrphanedBookIds.length === 1 ? 'book' : 'books';
                                                                                showToast(`Deleted "${folder.name}" — ${uniqueOrphanedBookIds.length} ${bookWord} moved to ${destinationName}`, window.innerWidth / 2, 100);
                                                                            } else {
                                                                                showToast(`Deleted "${folder.name}"`, window.innerWidth / 2, 100);
                                                                            }
                                                                            console.log(`🗑️ Deleted folder "${folder.name}"${descendants.length > 0 ? ` and ${descendants.length} subfolder(s)` : ''}${uniqueOrphanedBookIds.length > 0 ? `, moved ${uniqueOrphanedBookIds.length} books to ${destinationName}` : ''}`);
                                                                        }
                                                                    }}
                                                                    className="opacity-0 group-hover:opacity-100 text-red-500 hover:text-red-700 px-1"
                                                                    title="Delete folder">
                                                                    ×
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                    {/* Render children if expanded */}
                                                    {hasChildren && isExpanded && children.map(child => renderFolder(child, depth + 1))}
                                                </React.Fragment>
                                            );
                                        };

                                        // Render root folders (parentId: null, excluding Inbox)
                                        return getChildFolders(null).filter(f => f.id !== '__inbox__').map(folder => renderFolder(folder, 0));
                                    })()}
                                    {/* v5.0.0-alpha.52 - Removed bottom "New Folder" button; use "+" on All Books or folder rows instead */}
                                </div>
                            </div>

                            {/* v5.0.0-alpha.91 - Resizable divider */}
                            <div
                                className={`w-1 bg-gray-200 hover:bg-blue-400 cursor-col-resize transition-colors ${isResizingPane ? 'bg-blue-500' : ''}`}
                                onMouseDown={(e) => {
                                    e.preventDefault();
                                    setIsResizingPane(true);
                                }}
                                title="Drag to resize sidebar"
                            />

                            {/* Right pane: Book list */}
                            <div className="flex-1 bg-white overflow-hidden flex flex-col">
                                <div className="p-3 border-b border-gray-200 flex items-center justify-between">
                                    <div className="font-medium text-gray-700 flex items-center">
                                        {/* v5.0.0-alpha.80 - Breadcrumb navigation, v5.0.0-alpha.83 - Drop target for folder reparenting */}
                                        {getFolderPath(selectedFolderId).map((folder, idx, arr) => (
                                            <span key={folder.id} className="flex items-center">
                                                {idx > 0 && <span className="mx-1 text-gray-400">›</span>}
                                                {idx === arr.length - 1 ? (
                                                    <span>{folder.name}</span>
                                                ) : (
                                                    <button
                                                        onClick={() => navigateToFolder(folder.id)}
                                                        className={`text-blue-600 hover:text-blue-800 hover:underline px-1 rounded ${breadcrumbDropTargetId === folder.id ? 'ring-2 ring-blue-400 bg-blue-50' : ''}`}
                                                        onDragOver={(e) => {
                                                            // v5.0.0-alpha.85 - Accept folder drags and book drags (but not books on My Library)
                                                            const types = Array.from(e.dataTransfer.types);
                                                            const isFolderDrag = types.includes('application/x-folder-reorder');
                                                            const isBookDrag = types.includes('application/x-readerwrangler');
                                                            // Books can't go to root level (My Library)
                                                            if (isFolderDrag || (isBookDrag && folder.id !== '__library__')) {
                                                                e.preventDefault();
                                                                e.dataTransfer.dropEffect = 'move';
                                                                setBreadcrumbDropTargetId(folder.id);
                                                            }
                                                        }}
                                                        onDragLeave={(e) => {
                                                            if (!e.currentTarget.contains(e.relatedTarget)) {
                                                                setBreadcrumbDropTargetId(null);
                                                            }
                                                        }}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            setBreadcrumbDropTargetId(null);

                                                            // Try folder drag first
                                                            const folderData = e.dataTransfer.getData('application/x-folder-reorder');
                                                            if (folderData) {
                                                                try {
                                                                    const { folderIds } = JSON.parse(folderData);
                                                                    const newParentId = folder.id === '__library__' ? null : folder.id;
                                                                    reparentFolder(folderIds, newParentId);
                                                                } catch (err) {
                                                                    console.error('Breadcrumb folder drop error:', err);
                                                                }
                                                                return;
                                                            }

                                                            // Try book drag
                                                            const bookData = e.dataTransfer.getData('application/x-readerwrangler');
                                                            if (bookData && folder.id !== '__library__') {
                                                                try {
                                                                    const { sourceFolder, bookIds } = JSON.parse(bookData);
                                                                    const targetFolder = folders.find(f => f.id === folder.id);
                                                                    if (!targetFolder) return;

                                                                    const existing = new Set(targetFolder.bookIds || []);
                                                                    const newBookIds = bookIds.filter(id => !existing.has(id));

                                                                    if (newBookIds.length === 0) {
                                                                        showToast(bookIds.length === 1 ? 'Book already in folder' : 'Books already in folder', e.clientX, e.clientY);
                                                                    } else {
                                                                        // Move books: add to target, remove from source
                                                                        const sourceFolderObj = folders.find(f => f.id === sourceFolder);
                                                                        const fromIndices = bookIds.map(id => (sourceFolderObj?.bookIds || []).indexOf(id));

                                                                        setFolders(prev => prev.map(f => {
                                                                            if (f.id === folder.id) {
                                                                                return { ...f, bookIds: [...newBookIds, ...(f.bookIds || [])] };
                                                                            }
                                                                            if (f.id === sourceFolder) {
                                                                                return { ...f, bookIds: (f.bookIds || []).filter(id => !bookIds.includes(id)) };
                                                                            }
                                                                            return f;
                                                                        }));

                                                                        recordAction({
                                                                            type: 'MOVE_BOOKS_FOLDER',
                                                                            fromFolderId: sourceFolder,
                                                                            toFolderId: folder.id,
                                                                            bookIds: bookIds,
                                                                            fromIndices: fromIndices,
                                                                            toIndex: 0
                                                                        });
                                                                        console.log(`📦 Moved ${bookIds.length} book(s) to "${folder.name}" via breadcrumb`);
                                                                    }
                                                                    setExplorerSelectedBooks(new Set());
                                                                } catch (err) {
                                                                    console.error('Breadcrumb book drop error:', err);
                                                                }
                                                            }
                                                        }}
                                                    >
                                                        {folder.name}
                                                    </button>
                                                )}
                                            </span>
                                        ))}
                                        <span className="text-sm text-gray-500 ml-2 font-normal">
                                            {(() => {
                                                // v5.0.0-alpha.54 - Show folder count + book count
                                                // v5.0.0-alpha.63 - Handle My Library folder count
                                                const childFolders = selectedFolderId === '__all__'
                                                    ? []
                                                    : selectedFolderId === '__library__'
                                                        ? [getInboxFolder(), ...getChildFolders(null).filter(f => f.id !== '__inbox__')].filter(Boolean)
                                                        : getChildFolders(selectedFolderId);
                                                const folderCount = childFolders.length;
                                                const allBookIds = getFolderBookIds(selectedFolderId);
                                                const filteredCount = allBookIds
                                                    .map(id => books.find(b => b.id === id))
                                                    .filter(book => filterBookForExplorer(book))
                                                    .length;
                                                const totalCount = allBookIds.length;
                                                // v5.0.0-alpha.63 - My Library shows only folders, no books
                                                if (selectedFolderId === '__library__') {
                                                    return `(${folderCount} folders)`;
                                                }
                                                const bookPart = filteredCount === totalCount
                                                    ? `${totalCount} books`
                                                    : `${filteredCount} of ${totalCount} books`;
                                                return folderCount > 0
                                                    ? `(${folderCount} folders, ${bookPart})`
                                                    : `(${bookPart})`;
                                            })()}
                                        </span>
                                        {selectedFolderId === '__all__' && (
                                            <span className="text-xs text-gray-400 ml-2 italic">
                                                — view only, organize from folders
                                            </span>
                                        )}
                                        {selectedFolderId === '__library__' && (
                                            <span className="text-xs text-gray-400 ml-2 italic">
                                                — double-click to open folder
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex gap-4 items-center">
                                        {/* View toggle - styled to match Columns/Explorer button */}
                                        <div className="flex gap-1">
                                            <button
                                                onClick={() => setExplorerView('list')}
                                                className={`px-2 py-1 text-sm rounded border ${explorerView === 'list'
                                                    ? 'bg-blue-500 text-white border-blue-600'
                                                    : 'bg-white hover:bg-gray-50 text-blue-700 border-blue-300'}`}>
                                                List
                                            </button>
                                            <button
                                                onClick={() => setExplorerView('covers')}
                                                className={`px-2 py-1 text-sm rounded border ${explorerView === 'covers'
                                                    ? 'bg-blue-500 text-white border-blue-600'
                                                    : 'bg-white hover:bg-gray-50 text-blue-700 border-blue-300'}`}>
                                                Covers
                                            </button>
                                        </div>
                                        {/* Cover size slider (only in cover view) */}
                                        {explorerView === 'covers' && (
                                            <div className="flex items-center gap-2 border-l pl-4">
                                                <span className="text-xs text-gray-500">Size:</span>
                                                <input
                                                    type="range"
                                                    min="4"
                                                    max="60"
                                                    value={explorerCoverCols}
                                                    onChange={(e) => setExplorerCoverCols(parseInt(e.target.value))}
                                                    className="w-24 h-1 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                                                    title={`${64 - explorerCoverCols} columns`}
                                                />
                                            </div>
                                        )}
                                        {/* Sort status display (in both views) */}
                                        <div className="flex items-center gap-1 border-l pl-4 text-sm">
                                            <span className="text-gray-500">Sort:</span>
                                            <span className="text-gray-700">
                                                {explorerSort.column === 'custom' ? 'Manual Order' :
                                                 explorerSort.column === 'title' ? 'Name' :
                                                 explorerSort.column === 'author' ? 'Author' :
                                                 explorerSort.column === 'rating' ? 'Rating' :
                                                 explorerSort.column === 'dateAdded' ? 'Date Added' :
                                                 explorerSort.column === 'price' ? 'Price' :
                                                 explorerSort.column === 'priceGoal' ? 'Goal' :
                                                 explorerSort.column === 'delta' ? 'Under' : explorerSort.column}
                                            </span>
                                            {explorerSort.column !== 'custom' && (
                                                <>
                                                    <span className="text-gray-600 text-base">{explorerSort.direction === 'asc' ? '▲' : '▼'}</span>
                                                    {selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && (
                                                        <button
                                                            onClick={() => setExplorerSort({ column: 'custom', direction: 'asc' })}
                                                            className="ml-1 text-gray-500 hover:text-red-500 text-base font-bold"
                                                            title="Return to Manual Order">
                                                            ✕
                                                        </button>
                                                    )}
                                                </>
                                            )}
                                        </div>
                                        {/* v5.0.0-alpha.104 - Column chooser gear icon */}
                                        {explorerView === 'list' && (
                                            <div className="relative ml-4">
                                                <button
                                                    onClick={() => {
                                                        setExplorerColumnMenuOpen(!explorerColumnMenuOpen);
                                                        setExplorerColumnMenuPos(null); // v5.0.0-alpha.107 - Clear context menu position when using gear
                                                    }}
                                                    className="column-chooser-button text-gray-500 hover:text-gray-700 text-lg"
                                                    title="Choose columns">
                                                    ⚙️
                                                </button>
                                                {/* Column chooser dropdown */}
                                                {explorerColumnMenuOpen && (
                                                    <div
                                                        className={`column-chooser-menu bg-white border border-gray-300 rounded shadow-lg p-3 z-50 min-w-[200px] ${
                                                            explorerColumnMenuPos ? 'fixed' : 'absolute right-0 mt-2'
                                                        }`}
                                                        style={explorerColumnMenuPos ? { left: `${explorerColumnMenuPos.x}px`, top: `${explorerColumnMenuPos.y}px` } : {}}>
                                                        <div className="flex justify-between items-center mb-2">
                                                            <div className="text-sm font-semibold text-gray-700">Show Columns</div>
                                                            <button
                                                                onClick={() => {
                                                                    setExplorerColumnMenuOpen(false);
                                                                    setExplorerColumnMenuPos(null); // v5.0.0-alpha.107
                                                                }}
                                                                className="text-gray-500 hover:text-gray-700 font-bold text-lg leading-none"
                                                                title="Close">
                                                                ✕
                                                            </button>
                                                        </div>
                                                        <div className="flex flex-col gap-1.5">
                                                            <label className="flex items-center gap-2 text-sm text-gray-600 cursor-not-allowed opacity-50">
                                                                <input type="checkbox" checked={true} disabled className="cursor-not-allowed" />
                                                                Name (always visible)
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={visibleColumns.author}
                                                                    onChange={() => setVisibleColumns(prev => ({ ...prev, author: !prev.author }))}
                                                                    className="cursor-pointer"
                                                                />
                                                                Author
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={visibleColumns.rating}
                                                                    onChange={() => setVisibleColumns(prev => ({ ...prev, rating: !prev.rating }))}
                                                                    className="cursor-pointer"
                                                                />
                                                                Rating
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={visibleColumns.dateAdded}
                                                                    onChange={() => setVisibleColumns(prev => ({ ...prev, dateAdded: !prev.dateAdded }))}
                                                                    className="cursor-pointer"
                                                                />
                                                                Date Added
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={visibleColumns.price}
                                                                    onChange={() => setVisibleColumns(prev => ({ ...prev, price: !prev.price }))}
                                                                    className="cursor-pointer"
                                                                />
                                                                Price
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={visibleColumns.priceGoal}
                                                                    onChange={() => setVisibleColumns(prev => ({ ...prev, priceGoal: !prev.priceGoal }))}
                                                                    className="cursor-pointer"
                                                                />
                                                                Goal
                                                            </label>
                                                            <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer hover:bg-gray-50 px-1 rounded">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={visibleColumns.delta}
                                                                    onChange={() => setVisibleColumns(prev => ({ ...prev, delta: !prev.delta }))}
                                                                    className="cursor-pointer"
                                                                />
                                                                Under
                                                            </label>
                                                        </div>
                                                        <div className="mt-3 pt-2 border-t border-gray-200">
                                                            <button
                                                                onClick={() => {
                                                                    setVisibleColumns({
                                                                        author: true,
                                                                        rating: true,
                                                                        dateAdded: true,
                                                                        price: true,
                                                                        priceGoal: true,
                                                                        delta: true
                                                                    });
                                                                }}
                                                                className="text-xs text-blue-600 hover:text-blue-800">
                                                                Show All
                                                            </button>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="flex-1 overflow-auto px-4 pb-4">
                                    {explorerView === 'list' ? (
                                        <table className="text-sm" style={{
                                            tableLayout: 'fixed',
                                            width: `${72 + columnWidths.title +
                                                (visibleColumns.author ? columnWidths.author : 0) +
                                                (visibleColumns.rating ? columnWidths.rating : 0) +
                                                (visibleColumns.dateAdded ? columnWidths.dateAdded : 0) +
                                                (visibleColumns.price ? columnWidths.price : 0) +
                                                (visibleColumns.priceGoal ? columnWidths.priceGoal : 0) +
                                                (visibleColumns.delta ? columnWidths.delta : 0)}px`
                                        }}>
                                            <thead className="sticky top-0 bg-gray-50 z-10 border-b border-gray-200">
                                                <tr className="text-left text-gray-600"
                                                    onContextMenu={(e) => {
                                                        e.preventDefault();
                                                        // v5.0.0-alpha.108 - Smart positioning to avoid viewport overflow
                                                        const menuWidth = 200;
                                                        const menuHeight = 300;
                                                        let x = e.clientX;
                                                        let y = e.clientY;

                                                        // Adjust if menu would overflow right edge
                                                        if (x + menuWidth > window.innerWidth) {
                                                            x = e.clientX - menuWidth;
                                                        }

                                                        // Adjust if menu would overflow bottom edge
                                                        if (y + menuHeight > window.innerHeight) {
                                                            y = e.clientY - menuHeight;
                                                        }

                                                        setExplorerColumnMenuPos({ x, y });
                                                        setExplorerColumnMenuOpen(true);
                                                    }}>
                                                    {/* v5.0.0-alpha.121 - Checkbox column (styled div, not input) */}
                                                    <th className="p-2" style={{ width: '24px' }}></th>
                                                    <th className="p-2 w-12"></th>
                                                    <th className="p-2 cursor-pointer hover:bg-gray-100 relative" style={{ width: `var(--col-title, ${columnWidths.title}px)` }} onClick={() => setExplorerSort(prev => ({ column: 'title', direction: prev.column === 'title' && prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                                        Name {explorerSort.column === 'title' && (<>{explorerSort.direction === 'asc' ? '▲' : '▼'}{selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && <button onClick={(e) => { e.stopPropagation(); setExplorerSort({ column: 'custom', direction: 'asc' }); }} className="ml-2 text-gray-500 hover:text-red-500 font-bold" title="Return to Manual Order">✕</button>}</>)}
                                                        <div
                                                            className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-400 cursor-col-resize ${resizingColumn?.columnId === 'title' ? 'bg-blue-500' : 'bg-transparent'}`}
                                                            onMouseDown={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setResizingColumn({ columnId: 'title', startX: e.clientX, startWidth: columnWidths.title });
                                                            }}
                                                            title="Drag to resize"
                                                        />
                                                    </th>
                                                    {visibleColumns.author && (
                                                        <th className="p-2 cursor-pointer hover:bg-gray-100 relative" style={{ width: `var(--col-author, ${columnWidths.author}px)` }} onClick={() => setExplorerSort(prev => ({ column: 'author', direction: prev.column === 'author' && prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                                            Author {explorerSort.column === 'author' && (<>{explorerSort.direction === 'asc' ? '▲' : '▼'}{selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && <button onClick={(e) => { e.stopPropagation(); setExplorerSort({ column: 'custom', direction: 'asc' }); }} className="ml-2 text-gray-500 hover:text-red-500 font-bold" title="Return to Manual Order">✕</button>}</>)}
                                                            <div
                                                                className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-400 cursor-col-resize ${resizingColumn?.columnId === 'author' ? 'bg-blue-500' : 'bg-transparent'}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setResizingColumn({ columnId: 'author', startX: e.clientX, startWidth: columnWidths.author });
                                                                }}
                                                                title="Drag to resize"
                                                            />
                                                        </th>
                                                    )}
                                                    {visibleColumns.rating && (
                                                        <th className="p-2 cursor-pointer hover:bg-gray-100 relative" style={{ width: `var(--col-rating, ${columnWidths.rating}px)` }} onClick={() => setExplorerSort(prev => ({ column: 'rating', direction: prev.column === 'rating' && prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                                            Rating {explorerSort.column === 'rating' && (<>{explorerSort.direction === 'asc' ? '▲' : '▼'}{selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && <button onClick={(e) => { e.stopPropagation(); setExplorerSort({ column: 'custom', direction: 'asc' }); }} className="ml-2 text-gray-500 hover:text-red-500 font-bold" title="Return to Manual Order">✕</button>}</>)}
                                                            <div
                                                                className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-400 cursor-col-resize ${resizingColumn?.columnId === 'rating' ? 'bg-blue-500' : 'bg-transparent'}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setResizingColumn({ columnId: 'rating', startX: e.clientX, startWidth: columnWidths.rating });
                                                                }}
                                                                title="Drag to resize"
                                                            />
                                                        </th>
                                                    )}
                                                    {visibleColumns.dateAdded && (
                                                        <th className="p-2 cursor-pointer hover:bg-gray-100 relative" style={{ width: `var(--col-dateAdded, ${columnWidths.dateAdded}px)` }} onClick={() => setExplorerSort(prev => ({ column: 'dateAdded', direction: prev.column === 'dateAdded' && prev.direction === 'desc' ? 'asc' : 'desc' }))}>
                                                            Date Added {explorerSort.column === 'dateAdded' && (<>{explorerSort.direction === 'asc' ? '▲' : '▼'}{selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && <button onClick={(e) => { e.stopPropagation(); setExplorerSort({ column: 'custom', direction: 'asc' }); }} className="ml-2 text-gray-500 hover:text-red-500 font-bold" title="Return to Manual Order">✕</button>}</>)}
                                                            <div
                                                                className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-400 cursor-col-resize ${resizingColumn?.columnId === 'dateAdded' ? 'bg-blue-500' : 'bg-transparent'}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setResizingColumn({ columnId: 'dateAdded', startX: e.clientX, startWidth: columnWidths.dateAdded });
                                                                }}
                                                                title="Drag to resize"
                                                            />
                                                        </th>
                                                    )}
                                                    {visibleColumns.price && (
                                                        <th className="p-2 cursor-pointer hover:bg-gray-100 relative" style={{ width: `var(--col-price, ${columnWidths.price}px)` }} onClick={() => setExplorerSort(prev => ({ column: 'price', direction: prev.column === 'price' && prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                                            Price {explorerSort.column === 'price' && (<>{explorerSort.direction === 'asc' ? '▲' : '▼'}{selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && <button onClick={(e) => { e.stopPropagation(); setExplorerSort({ column: 'custom', direction: 'asc' }); }} className="ml-2 text-gray-500 hover:text-red-500 font-bold" title="Return to Manual Order">✕</button>}</>)}
                                                            <div
                                                                className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-400 cursor-col-resize ${resizingColumn?.columnId === 'price' ? 'bg-blue-500' : 'bg-transparent'}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setResizingColumn({ columnId: 'price', startX: e.clientX, startWidth: columnWidths.price });
                                                                }}
                                                                title="Drag to resize"
                                                            />
                                                        </th>
                                                    )}
                                                    {visibleColumns.priceGoal && (
                                                        <th className="p-2 cursor-pointer hover:bg-gray-100 relative" style={{ width: `var(--col-priceGoal, ${columnWidths.priceGoal}px)` }} onClick={() => setExplorerSort(prev => ({ column: 'priceGoal', direction: prev.column === 'priceGoal' && prev.direction === 'asc' ? 'desc' : 'asc' }))}>
                                                            Goal {explorerSort.column === 'priceGoal' && (<>{explorerSort.direction === 'asc' ? '▲' : '▼'}{selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && <button onClick={(e) => { e.stopPropagation(); setExplorerSort({ column: 'custom', direction: 'asc' }); }} className="ml-2 text-gray-500 hover:text-red-500 font-bold" title="Return to Manual Order">✕</button>}</>)}
                                                            <div
                                                                className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-400 cursor-col-resize ${resizingColumn?.columnId === 'priceGoal' ? 'bg-blue-500' : 'bg-transparent'}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setResizingColumn({ columnId: 'priceGoal', startX: e.clientX, startWidth: columnWidths.priceGoal });
                                                                }}
                                                                title="Drag to resize"
                                                            />
                                                        </th>
                                                    )}
                                                    {visibleColumns.delta && (
                                                        <th className="p-2 cursor-pointer hover:bg-gray-100 relative" style={{ width: `var(--col-delta, ${columnWidths.delta}px)` }} onClick={() => setExplorerSort(prev => ({ column: 'delta', direction: prev.column === 'delta' && prev.direction === 'desc' ? 'asc' : 'desc' }))}>
                                                            Under {explorerSort.column === 'delta' && (<>{explorerSort.direction === 'asc' ? '▲' : '▼'}{selectedFolderId !== '__all__' && selectedFolderId !== '__library__' && <button onClick={(e) => { e.stopPropagation(); setExplorerSort({ column: 'custom', direction: 'asc' }); }} className="ml-2 text-gray-500 hover:text-red-500 font-bold" title="Return to Manual Order">✕</button>}</>)}
                                                            <div
                                                                className={`absolute right-0 top-0 bottom-0 w-1 hover:bg-blue-400 cursor-col-resize ${resizingColumn?.columnId === 'delta' ? 'bg-blue-500' : 'bg-transparent'}`}
                                                                onMouseDown={(e) => {
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    setResizingColumn({ columnId: 'delta', startX: e.clientX, startWidth: columnWidths.delta });
                                                                }}
                                                                title="Drag to resize"
                                                            />
                                                        </th>
                                                    )}
                                                    {/* v5.0.0-alpha.113 - Spacer column to absorb extra space */}
                                                    <th className="p-2"></th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {/* v5.0.0-alpha.54 - Folder rows (before books) */}
                                                {(() => {
                                                    // Get child folders (only for user folders, not All Books)
                                                    if (selectedFolderId === '__all__') return null;
                                                    // v5.0.0-alpha.63 - My Library shows Inbox + root folders
                                                    const childFolders = selectedFolderId === '__library__'
                                                        ? [getInboxFolder(), ...getChildFolders(null).filter(f => f.id !== '__inbox__')].filter(Boolean)
                                                        : getChildFolders(selectedFolderId);
                                                    if (childFolders.length === 0) return null;

                                                    // v5.0.0-alpha.66 - In custom mode, use getChildFolders order (respects custom order)
                                                    // In sorted mode, sort alphabetically
                                                    const dir = explorerSort.column === 'title' && explorerSort.direction === 'desc' ? -1 : 1;
                                                    let sortedFolders;
                                                    if (selectedFolderId === '__library__') {
                                                        // My Library: Inbox first (pinned), then alphabetical or custom
                                                        const inbox = childFolders.find(f => f.id === '__inbox__');
                                                        const others = childFolders.filter(f => f.id !== '__inbox__');
                                                        // In custom mode, use order from getChildFolders; otherwise sort alphabetically
                                                        const sortedOthers = explorerSort.column === 'custom'
                                                            ? others
                                                            : [...others].sort((a, b) => dir * a.name.localeCompare(b.name));
                                                        sortedFolders = [inbox, ...sortedOthers].filter(Boolean);
                                                    } else {
                                                        // Regular folder view
                                                        sortedFolders = explorerSort.column === 'custom'
                                                            ? childFolders // Already in custom order from getChildFolders
                                                            : [...childFolders].sort((a, b) => dir * a.name.localeCompare(b.name));
                                                    }

                                                    // v5.0.0-alpha.88 - Allow folder reordering in My Library (Inbox protected by isDraggable=false)
                                                    const canReorderFolders = explorerSort.column === 'custom' &&
                                                        selectedFolderId !== '__all__';
                                                    const parentForReorder = selectedFolderId === '__library__' ? null : selectedFolderId;

                                                    // v5.0.0-alpha.65 - Use flatMap to add separator after Inbox in My Library view
                                                    return sortedFolders.flatMap((folder, folderIndex) => {
                                                        // v5.0.0-alpha.67 - Phase A: Enable dragging everywhere (drop determines validity)
                                                        const isDraggable = folder.id !== '__inbox__';

                                                        const row = (
                                                            <tr
                                                                key={`folder-${folder.id}`}
                                                                className={`group cursor-pointer border-b border-gray-100 ${explorerSelectedFolders.has(folder.id) ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                                                                style={(() => {
                                                                    // v5.0.0-alpha.73 - Phase C: Visual feedback (blue=valid, red=invalid)
                                                                    if (!explorerFolderDragTarget) return {};
                                                                    if (explorerFolderDragTarget.type === 'reorder' && explorerFolderDragTarget.index === folderIndex) {
                                                                        // Reorder: blue if allowed (custom mode), red if not
                                                                        const color = canReorderFolders ? '#3b82f6' : '#ef4444';
                                                                        return explorerFolderDragTarget.position === 'before'
                                                                            ? { borderTop: `3px solid ${color}` }
                                                                            : { borderBottom: `3px solid ${color}` };
                                                                    }
                                                                    if (explorerFolderDragTarget.type === 'reparent' && explorerFolderDragTarget.folderId === folder.id) {
                                                                        return { backgroundColor: '#dbeafe' }; // blue-100 (reparent always valid)
                                                                    }
                                                                    return {};
                                                                })()}
                                                                draggable={isDraggable}
                                                                onDragStart={isDraggable ? (e) => {
                                                                    e.stopPropagation();
                                                                    e.dataTransfer.effectAllowed = 'move';
                                                                    e.dataTransfer.setData('application/x-folder-reorder', JSON.stringify({
                                                                        folderIds: explorerSelectedFolders.has(folder.id) && explorerSelectedFolders.size > 1
                                                                            ? [...explorerSelectedFolders]
                                                                            : [folder.id],
                                                                        parentId: parentForReorder
                                                                    }));
                                                                    if (!explorerSelectedFolders.has(folder.id)) {
                                                                        setExplorerSelectedFolders(new Set([folder.id]));
                                                                    }
                                                                } : undefined}
                                                                onDragOver={(e) => {
                                                                    // v5.0.0-alpha.70 - Phase B: Two-target zone detection (optimized)
                                                                    e.preventDefault();
                                                                    e.dataTransfer.dropEffect = 'move';
                                                                    const rect = e.currentTarget.getBoundingClientRect();
                                                                    const y = e.clientY - rect.top;
                                                                    const height = rect.height;
                                                                    const edgeZone = height * 0.25;

                                                                    let newTarget;
                                                                    if (y < edgeZone) {
                                                                        newTarget = { type: 'reorder', index: folderIndex, position: 'before' };
                                                                    } else if (y > height - edgeZone) {
                                                                        newTarget = { type: 'reorder', index: folderIndex, position: 'after' };
                                                                    } else {
                                                                        newTarget = { type: 'reparent', folderId: folder.id };
                                                                    }
                                                                    // Only update state if target changed
                                                                    const current = explorerFolderDragTarget;
                                                                    if (!current || current.type !== newTarget.type ||
                                                                        current.index !== newTarget.index ||
                                                                        current.position !== newTarget.position ||
                                                                        current.folderId !== newTarget.folderId) {
                                                                        setExplorerFolderDragTarget(newTarget);
                                                                    }
                                                                }}
                                                                onDragLeave={() => setExplorerFolderDragTarget(null)}
                                                                onDrop={(e) => {
                                                                    // v5.0.0-alpha.76 - Phase D: Handle reorder and reparent
                                                                    e.preventDefault();
                                                                    e.stopPropagation();
                                                                    try {
                                                                        const dragData = JSON.parse(e.dataTransfer.getData('application/x-folder-reorder'));
                                                                        const target = explorerFolderDragTarget;

                                                                        if (target?.type === 'reparent') {
                                                                            // Move folder(s) INTO target folder
                                                                            reparentFolder(dragData.folderIds, target.folderId);
                                                                        } else if (target?.type === 'reorder') {
                                                                            // Reorder within same parent
                                                                            if (canReorderFolders) {
                                                                                if (dragData.parentId === parentForReorder) {
                                                                                    // v5.0.0-alpha.90 - Pass folder.id and position (not visual index)
                                                                                    reorderFoldersInParent(parentForReorder, dragData.folderIds, folder.id, target.position);
                                                                                }
                                                                            } else {
                                                                                showToast("Switch to Manual Order to reorder folders", e.clientX, e.clientY);
                                                                            }
                                                                        }
                                                                    } catch (err) {
                                                                        // Not a folder drag
                                                                    }
                                                                    setExplorerFolderDragTarget(null);
                                                                }}
                                                                onDragEnd={() => {
                                                                    setExplorerFolderDragTarget(null);
                                                                    setBreadcrumbDropTargetId(null); // v5.0.0-alpha.83
                                                                }}
                                                                onClick={(e) => {
                                                                    // Clear book selection when selecting folder
                                                                    setExplorerSelectedBooks(new Set());
                                                                    if (e.ctrlKey || e.metaKey) {
                                                                        setExplorerSelectedFolders(prev => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(folder.id)) next.delete(folder.id);
                                                                            else next.add(folder.id);
                                                                            return next;
                                                                        });
                                                                    } else {
                                                                        setExplorerSelectedFolders(new Set([folder.id]));
                                                                    }
                                                                }}
                                                                onDoubleClick={() => {
                                                                    // Navigate into folder
                                                                    navigateToFolder(folder.id);
                                                                    // Expand parent if collapsed
                                                                    setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, collapsed: false } : f));
                                                                    // Clear selections
                                                                    setExplorerSelectedFolders(new Set());
                                                                    setExplorerSelectedBooks(new Set());
                                                                }}>
                                                                {/* v5.0.0-alpha.123 - Clickable checkbox */}
                                                                <td
                                                                    className="p-2 text-center cursor-pointer"
                                                                    style={{ width: '24px' }}
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        setExplorerSelectedFolders(prev => {
                                                                            const next = new Set(prev);
                                                                            if (next.has(folder.id)) next.delete(folder.id);
                                                                            else next.add(folder.id);
                                                                            return next;
                                                                        });
                                                                        setExplorerSelectedBooks(new Set());
                                                                    }}>
                                                                    <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center text-xs ${
                                                                        explorerSelectedFolders.has(folder.id)
                                                                            ? 'opacity-100 bg-blue-500 border-blue-500 text-white'
                                                                            : 'opacity-0 group-hover:opacity-100 border-gray-400'
                                                                    }`}>
                                                                        {explorerSelectedFolders.has(folder.id) && '✓'}
                                                                    </div>
                                                                </td>
                                                                <td className="p-2 text-center text-xl">{folder.id === '__inbox__' ? '📥' : '📁'}</td>
                                                                <td className="p-2 font-medium" style={{ width: `var(--col-title, ${columnWidths.title}px)` }}>{folder.name}</td>
                                                                {visibleColumns.author && <td className="p-2 text-gray-400" style={{ width: `var(--col-author, ${columnWidths.author}px)` }}>—</td>}
                                                                {visibleColumns.rating && <td className="p-2 text-gray-400" style={{ width: `var(--col-rating, ${columnWidths.rating}px)` }}>—</td>}
                                                                {visibleColumns.dateAdded && <td className="p-2 text-gray-400" style={{ width: `var(--col-dateAdded, ${columnWidths.dateAdded}px)` }}>—</td>}
                                                                {visibleColumns.price && <td className="p-2 text-gray-400" style={{ width: `var(--col-price, ${columnWidths.price}px)` }}>—</td>}
                                                                {visibleColumns.priceGoal && <td className="p-2 text-gray-400" style={{ width: `var(--col-priceGoal, ${columnWidths.priceGoal}px)` }}>—</td>}
                                                                {visibleColumns.delta && <td className="p-2 text-gray-400" style={{ width: `var(--col-delta, ${columnWidths.delta}px)` }}>—</td>}
                                                                <td className="p-2"></td>
                                                            </tr>
                                                        );
                                                        // Add separator line after Inbox when in My Library view
                                                        if (selectedFolderId === '__library__' && folder.id === '__inbox__') {
                                                            return [row, (
                                                                <tr key="inbox-separator" className="h-0">
                                                                    <td colSpan="8" className="p-0"><div className="border-b-2 border-gray-300 my-1"></div></td>
                                                                </tr>
                                                            )];
                                                        }
                                                        return [row];
                                                    });
                                                })()}
                                                {/* Book rows */}
                                                {(() => {
                                                    // Build sorted book list for range selection (with filtering)
                                                    const sortedBooks = getFolderBookIds(selectedFolderId)
                                                        .map(id => books.find(b => b.id === id))
                                                        .filter(book => filterBookForExplorer(book))
                                                        .sort((a, b) => {
                                                            if (explorerSort.column === 'custom') return 0;
                                                            const dir = explorerSort.direction === 'asc' ? 1 : -1;
                                                            if (explorerSort.column === 'title') return dir * (a.title || '').localeCompare(b.title || '');
                                                            if (explorerSort.column === 'author') return dir * (a.author || '').localeCompare(b.author || '');
                                                            if (explorerSort.column === 'rating') return dir * ((a.rating || 0) - (b.rating || 0));
                                                            if (explorerSort.column === 'dateAdded') {
                                                                const dateA = a.acquired || a.addedToWishlist || '';
                                                                const dateB = b.acquired || b.addedToWishlist || '';
                                                                return dir * dateA.localeCompare(dateB);
                                                            }
                                                            if (explorerSort.column === 'price') {
                                                                const priceA = a.currentPrice ?? Infinity;
                                                                const priceB = b.currentPrice ?? Infinity;
                                                                return dir * (priceA - priceB);
                                                            }
                                                            if (explorerSort.column === 'priceGoal') {
                                                                const goalA = a.priceTrigger ?? Infinity;
                                                                const goalB = b.priceTrigger ?? Infinity;
                                                                return dir * (goalA - goalB);
                                                            }
                                                            if (explorerSort.column === 'delta') {
                                                                // Delta = goal - price (positive = under goal, negative = over goal)
                                                                const deltaA = (a.priceTrigger != null && a.currentPrice != null) ? (a.priceTrigger - a.currentPrice) : -Infinity;
                                                                const deltaB = (b.priceTrigger != null && b.currentPrice != null) ? (b.priceTrigger - b.currentPrice) : -Infinity;
                                                                return dir * (deltaA - deltaB);
                                                            }
                                                            return 0;
                                                        });
                                                    return sortedBooks.map((book, index) => (
                                                        <tr
                                                            key={book.id}
                                                            className={`group cursor-pointer border-b border-gray-100 ${explorerSelectedBooks.has(book.id) ? 'bg-blue-50' : 'hover:bg-gray-100'}`}
                                                            style={explorerReorderTarget === index ? { borderTop: `3px solid ${explorerSort.column === 'custom' && selectedFolderId !== '__all__' ? '#3b82f6' : '#f87171'}` } : {}}
                                                            draggable="true"
                                                            onMouseEnter={selectedFolderId === '__all__' ? (e) => {
                                                                // Clear any pending hide timeout
                                                                if (tooltipHideTimeoutRef.current) {
                                                                    clearTimeout(tooltipHideTimeoutRef.current);
                                                                    tooltipHideTimeoutRef.current = null;
                                                                }
                                                                const rect = e.currentTarget.getBoundingClientRect();
                                                                setBookTooltip({ bookId: book.id, x: rect.left, y: rect.top });
                                                            } : undefined}
                                                            onMouseLeave={selectedFolderId === '__all__' ? () => {
                                                                // v5.0.0-alpha.132 - Delay hide to allow cursor to reach tooltip
                                                                tooltipHideTimeoutRef.current = setTimeout(() => {
                                                                    setBookTooltip(null);
                                                                }, 150);
                                                            } : undefined}
                                                            onDragStart={(e) => {
                                                                e.stopPropagation();
                                                                e.dataTransfer.effectAllowed = 'copyMove';
                                                                const dragData = {
                                                                    sourceFolder: selectedFolderId, // '__all__' for All Books
                                                                    bookIds: explorerSelectedBooks.has(book.id) && explorerSelectedBooks.size > 1
                                                                        ? [...explorerSelectedBooks]
                                                                        : [book.id]
                                                                };
                                                                e.dataTransfer.setData('application/x-readerwrangler', JSON.stringify(dragData));
                                                                setExplorerDragData(dragData); // Store for validity checks
                                                                if (!explorerSelectedBooks.has(book.id)) {
                                                                    setExplorerSelectedBooks(new Set([book.id]));
                                                                }
                                                                setExplorerDragBookId(book.id);
                                                            }}
                                                            onDragOver={(e) => {
                                                                e.preventDefault(); // Allow drop event to fire
                                                                e.dataTransfer.dropEffect = 'move'; // Must be 'move' for onDrop to fire
                                                                setExplorerReorderTarget(index); // Always show target (styled by allowed state)
                                                            }}
                                                            onDragLeave={() => setExplorerReorderTarget(null)}
                                                            onDrop={(e) => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                if (explorerSort.column === 'custom' && selectedFolderId !== '__all__') {
                                                                    const dragData = JSON.parse(e.dataTransfer.getData('application/x-readerwrangler'));
                                                                    if (dragData.sourceFolder === selectedFolderId) {
                                                                        reorderBooksInFolder(selectedFolderId, dragData.bookIds, index);
                                                                    }
                                                                } else if (selectedFolderId === '__all__') {
                                                                    showToast('Cannot reorder in All Books', e.clientX, e.clientY);
                                                                } else if (explorerSort.column !== 'custom') {
                                                                    showToast('Clear sort to reorder', e.clientX, e.clientY);
                                                                }
                                                                setExplorerReorderTarget(null);
                                                                setExplorerDragBookId(null);
                                                            }}
                                                            onDragEnd={() => {
                                                                setExplorerDragBookId(null);
                                                                setExplorerDropTargetId(null);
                                                                setExplorerReorderTarget(null);
                                                                setExplorerDragData(null);
                                                            }}
                                                            onClick={(e) => {
                                                                // v5.0.0-alpha.124 - Clear folder selection when selecting book (matches folder row behavior)
                                                                setExplorerSelectedFolders(new Set());
                                                                if (e.shiftKey && explorerSelectionAnchor !== null) {
                                                                    // Shift-click: select range from anchor to current
                                                                    const start = Math.min(explorerSelectionAnchor, index);
                                                                    const end = Math.max(explorerSelectionAnchor, index);
                                                                    const rangeIds = sortedBooks.slice(start, end + 1).map(b => b.id);
                                                                    setExplorerSelectedBooks(new Set(rangeIds));
                                                                } else if (e.ctrlKey || e.metaKey) {
                                                                    // Ctrl/Cmd-click: toggle selection, update anchor
                                                                    setExplorerSelectedBooks(prev => {
                                                                        const next = new Set(prev);
                                                                        if (next.has(book.id)) next.delete(book.id);
                                                                        else next.add(book.id);
                                                                        return next;
                                                                    });
                                                                    setExplorerSelectionAnchor(index);
                                                                } else {
                                                                    // Regular click: select just this book, set anchor
                                                                    setExplorerSelectedBooks(new Set([book.id]));
                                                                    setExplorerSelectionAnchor(index);
                                                                }
                                                            }}
                                                            onDoubleClick={() => openBookModal(book, null)}>
                                                            {/* v5.0.0-alpha.123 - Clickable checkbox */}
                                                            <td
                                                                className="p-2 text-center cursor-pointer"
                                                                style={{ width: '24px' }}
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    setExplorerSelectedBooks(prev => {
                                                                        const next = new Set(prev);
                                                                        if (next.has(book.id)) next.delete(book.id);
                                                                        else next.add(book.id);
                                                                        return next;
                                                                    });
                                                                    setExplorerSelectedFolders(new Set());
                                                                }}>
                                                                <div className={`w-3.5 h-3.5 border rounded flex items-center justify-center text-xs ${
                                                                    explorerSelectedBooks.has(book.id)
                                                                        ? 'opacity-100 bg-blue-500 border-blue-500 text-white'
                                                                        : 'opacity-0 group-hover:opacity-100 border-gray-400'
                                                                }`}>
                                                                    {explorerSelectedBooks.has(book.id) && '✓'}
                                                                </div>
                                                            </td>
                                                            <td className="p-2">
                                                                <img src={book.coverUrl} alt="" className={`w-8 h-12 object-cover rounded ${book.onWishlist ? 'opacity-40' : ''}`} />
                                                            </td>
                                                            <td className="p-2 font-medium" style={{ width: `var(--col-title, ${columnWidths.title}px)` }}>{book.title}</td>
                                                            {visibleColumns.author && (
                                                                <td className="p-2 text-gray-600" style={{ width: `var(--col-author, ${columnWidths.author}px)` }}>{book.author}</td>
                                                            )}
                                                            {visibleColumns.rating && (
                                                                <td className="p-2" style={{ width: `var(--col-rating, ${columnWidths.rating}px)` }}>
                                                                    {book.rating ? `${'★'.repeat(Math.floor(book.rating))}${'☆'.repeat(5 - Math.floor(book.rating))}` : '-'}
                                                                </td>
                                                            )}
                                                            {visibleColumns.dateAdded && (
                                                                <td className="p-2 text-gray-500 text-xs" style={{ width: `var(--col-dateAdded, ${columnWidths.dateAdded}px)` }}>
                                                                    {(() => {
                                                                        const dateStr = book.acquired || book.addedToWishlist;
                                                                        if (!dateStr) return '-';
                                                                        const date = /^\d{8,}$/.test(dateStr) ? new Date(Number(dateStr)) : new Date(dateStr);
                                                                        return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
                                                                    })()}
                                                                </td>
                                                            )}
                                                            {visibleColumns.price && (
                                                                <td className={`p-2 text-xs ${book.priceTrigger && book.currentPrice <= book.priceTrigger ? 'text-green-600 font-semibold' : 'text-gray-600'}`} style={{ width: `var(--col-price, ${columnWidths.price}px)` }}>
                                                                    {book.currentPrice != null ? `$${book.currentPrice.toFixed(2)}` : '-'}
                                                                </td>
                                                            )}
                                                            {visibleColumns.priceGoal && (
                                                                <td className="p-2 text-gray-500 text-xs" style={{ width: `var(--col-priceGoal, ${columnWidths.priceGoal}px)` }}>
                                                                    {book.priceTrigger != null ? `$${book.priceTrigger.toFixed(2)}` : '-'}
                                                                </td>
                                                            )}
                                                            {visibleColumns.delta && (
                                                                <td className="p-2 text-xs" style={{ width: `var(--col-delta, ${columnWidths.delta}px)` }}>
                                                                    {(() => {
                                                                        if (book.priceTrigger == null || book.currentPrice == null) return '-';
                                                                        const delta = book.priceTrigger - book.currentPrice;
                                                                        const isUnder = delta >= 0;
                                                                        return (
                                                                            <span className={isUnder ? 'text-green-600 font-semibold' : 'text-orange-500'}>
                                                                                {isUnder ? `$${delta.toFixed(2)}` : `-$${Math.abs(delta).toFixed(2)}`}
                                                                            </span>
                                                                        );
                                                                    })()}
                                                                </td>
                                                            )}
                                                            <td className="p-2"></td>
                                                        </tr>
                                                    ));
                                                })()}
                                            </tbody>
                                        </table>
                                    ) : (
                                        <div className="grid gap-4 pt-1" style={{ gridTemplateColumns: `repeat(${64 - explorerCoverCols}, minmax(40px, 1fr))` }}>
                                            {/* v5.0.0-alpha.54 - Folder tiles (before books) */}
                                            {(() => {
                                                if (selectedFolderId === '__all__') return null;
                                                // v5.0.0-alpha.63 - My Library shows Inbox + root folders
                                                const childFolders = selectedFolderId === '__library__'
                                                    ? [getInboxFolder(), ...getChildFolders(null).filter(f => f.id !== '__inbox__')].filter(Boolean)
                                                    : getChildFolders(selectedFolderId);
                                                if (childFolders.length === 0) return null;

                                                // v5.0.0-alpha.66 - In custom mode, use getChildFolders order (respects custom order)
                                                const dir = explorerSort.column === 'title' && explorerSort.direction === 'desc' ? -1 : 1;
                                                let sortedFolders;
                                                if (selectedFolderId === '__library__') {
                                                    const inbox = childFolders.find(f => f.id === '__inbox__');
                                                    const others = childFolders.filter(f => f.id !== '__inbox__');
                                                    const sortedOthers = explorerSort.column === 'custom'
                                                        ? others
                                                        : [...others].sort((a, b) => dir * a.name.localeCompare(b.name));
                                                    sortedFolders = [inbox, ...sortedOthers].filter(Boolean);
                                                } else {
                                                    sortedFolders = explorerSort.column === 'custom'
                                                        ? childFolders
                                                        : [...childFolders].sort((a, b) => dir * a.name.localeCompare(b.name));
                                                }

                                                // v5.0.0-alpha.88 - Allow folder reordering in My Library (Inbox protected by isDraggable=false)
                                                const canReorderFolders = explorerSort.column === 'custom' &&
                                                    selectedFolderId !== '__all__';
                                                const parentForReorder = selectedFolderId === '__library__' ? null : selectedFolderId;

                                                // v5.0.0-alpha.62 - Scale folder icon responsively with container
                                                return sortedFolders.map((folder, folderIndex) => {
                                                    // v5.0.0-alpha.67 - Phase A: Enable dragging everywhere (drop determines validity)
                                                    const isDraggable = folder.id !== '__inbox__';

                                                    return (
                                                    <div
                                                        key={`folder-${folder.id}`}
                                                        className={`cursor-pointer hover:opacity-80 ${!isDraggable ? 'select-none' : ''} ${explorerSelectedFolders.has(folder.id) ? 'ring-2 ring-blue-400' : ''}`}
                                                        style={(() => {
                                                            // v5.0.0-alpha.73 - Phase C: Visual feedback (blue=valid, red=invalid)
                                                            if (!explorerFolderDragTarget) return {};
                                                            if (explorerFolderDragTarget.type === 'reorder' && explorerFolderDragTarget.index === folderIndex) {
                                                                // Reorder: blue if allowed (custom mode), red if not
                                                                const color = canReorderFolders ? '#3b82f6' : '#ef4444';
                                                                return explorerFolderDragTarget.position === 'before'
                                                                    ? { outline: `3px solid ${color}`, outlineOffset: '2px', borderTop: `3px solid ${color}` }
                                                                    : { outline: `3px solid ${color}`, outlineOffset: '2px', borderBottom: `3px solid ${color}` };
                                                            }
                                                            if (explorerFolderDragTarget.type === 'reparent' && explorerFolderDragTarget.folderId === folder.id) {
                                                                return { outline: '3px solid #3b82f6', outlineOffset: '2px', backgroundColor: '#dbeafe' }; // reparent always valid
                                                            }
                                                            return {};
                                                        })()}
                                                        draggable={isDraggable}
                                                        onDragStart={isDraggable ? (e) => {
                                                            e.stopPropagation();
                                                            e.dataTransfer.effectAllowed = 'move';
                                                            e.dataTransfer.setData('application/x-folder-reorder', JSON.stringify({
                                                                folderIds: explorerSelectedFolders.has(folder.id) && explorerSelectedFolders.size > 1
                                                                    ? [...explorerSelectedFolders]
                                                                    : [folder.id],
                                                                parentId: parentForReorder
                                                            }));
                                                            if (!explorerSelectedFolders.has(folder.id)) {
                                                                setExplorerSelectedFolders(new Set([folder.id]));
                                                            }
                                                        } : undefined}
                                                        onDragOver={(e) => {
                                                            // v5.0.0-alpha.70 - Phase B: Two-target zone detection (optimized)
                                                            e.preventDefault();
                                                            e.dataTransfer.dropEffect = 'move';
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            const y = e.clientY - rect.top;
                                                            const height = rect.height;
                                                            const edgeZone = height * 0.25;

                                                            let newTarget;
                                                            if (y < edgeZone) {
                                                                newTarget = { type: 'reorder', index: folderIndex, position: 'before' };
                                                            } else if (y > height - edgeZone) {
                                                                newTarget = { type: 'reorder', index: folderIndex, position: 'after' };
                                                            } else {
                                                                newTarget = { type: 'reparent', folderId: folder.id };
                                                            }
                                                            // Only update state if target changed
                                                            const current = explorerFolderDragTarget;
                                                            if (!current || current.type !== newTarget.type ||
                                                                current.index !== newTarget.index ||
                                                                current.position !== newTarget.position ||
                                                                current.folderId !== newTarget.folderId) {
                                                                setExplorerFolderDragTarget(newTarget);
                                                            }
                                                        }}
                                                        onDragLeave={() => setExplorerFolderDragTarget(null)}
                                                        onDrop={(e) => {
                                                            // v5.0.0-alpha.76 - Phase D: Handle reorder and reparent
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            try {
                                                                const dragData = JSON.parse(e.dataTransfer.getData('application/x-folder-reorder'));
                                                                const target = explorerFolderDragTarget;

                                                                if (target?.type === 'reparent') {
                                                                    // Move folder(s) INTO target folder
                                                                    reparentFolder(dragData.folderIds, target.folderId);
                                                                } else if (target?.type === 'reorder') {
                                                                    // Reorder within same parent
                                                                    if (canReorderFolders) {
                                                                        if (dragData.parentId === parentForReorder) {
                                                                            // v5.0.0-alpha.90 - Pass folder.id and position (not visual index)
                                                                            reorderFoldersInParent(parentForReorder, dragData.folderIds, folder.id, target.position);
                                                                        }
                                                                    } else {
                                                                        showToast("Switch to Manual Order to reorder folders", e.clientX, e.clientY);
                                                                    }
                                                                }
                                                            } catch (err) {
                                                                // Not a folder drag
                                                            }
                                                            setExplorerFolderDragTarget(null);
                                                        }}
                                                        onDragEnd={() => {
                                                            setExplorerFolderDragTarget(null);
                                                            setBreadcrumbDropTargetId(null); // v5.0.0-alpha.83
                                                        }}
                                                        onClick={(e) => {
                                                            setExplorerSelectedBooks(new Set());
                                                            if (e.ctrlKey || e.metaKey) {
                                                                setExplorerSelectedFolders(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(folder.id)) next.delete(folder.id);
                                                                    else next.add(folder.id);
                                                                    return next;
                                                                });
                                                            } else {
                                                                setExplorerSelectedFolders(new Set([folder.id]));
                                                            }
                                                        }}
                                                        onDoubleClick={() => {
                                                            navigateToFolder(folder.id);
                                                            setFolders(prev => prev.map(f => f.id === folder.id ? { ...f, collapsed: false } : f));
                                                            setExplorerSelectedFolders(new Set());
                                                            setExplorerSelectedBooks(new Set());
                                                        }}>
                                                        <div className={`aspect-[2/3] ${folder.id === '__inbox__' ? 'bg-blue-50 border-blue-200' : 'bg-amber-50 border-amber-200'} border-2 rounded shadow flex items-center justify-center relative`} style={{ containerType: 'inline-size' }}>
                                                            {/* v5.0.0-alpha.65 - Pin icon for Inbox in My Library view */}
                                                            {selectedFolderId === '__library__' && folder.id === '__inbox__' && (
                                                                <span className="absolute top-1 right-1 text-xs">📌</span>
                                                            )}
                                                            <span style={{ fontSize: '50cqw' }}>{folder.id === '__inbox__' ? '📥' : '📁'}</span>
                                                        </div>
                                                        <div className="mt-1 text-xs text-gray-700 truncate text-center">{folder.name}</div>
                                                    </div>
                                                    );
                                                });
                                            })()}
                                            {/* Book tiles */}
                                            {(() => {
                                                const sortedBooks = getFolderBookIds(selectedFolderId)
                                                    .map(id => books.find(b => b.id === id))
                                                    .filter(book => filterBookForExplorer(book))
                                                    .sort((a, b) => {
                                                        if (explorerSort.column === 'custom') return 0;
                                                        const dir = explorerSort.direction === 'asc' ? 1 : -1;
                                                        if (explorerSort.column === 'title') return dir * (a.title || '').localeCompare(b.title || '');
                                                        if (explorerSort.column === 'author') return dir * (a.author || '').localeCompare(b.author || '');
                                                        if (explorerSort.column === 'rating') return dir * ((a.rating || 0) - (b.rating || 0));
                                                        if (explorerSort.column === 'dateAdded') {
                                                            const dateA = a.acquired || a.addedToWishlist || '';
                                                            const dateB = b.acquired || b.addedToWishlist || '';
                                                            return dir * dateA.localeCompare(dateB);
                                                        }
                                                        if (explorerSort.column === 'price') {
                                                            const priceA = a.currentPrice ?? Infinity;
                                                            const priceB = b.currentPrice ?? Infinity;
                                                            return dir * (priceA - priceB);
                                                        }
                                                        if (explorerSort.column === 'priceGoal') {
                                                            const goalA = a.priceTrigger ?? Infinity;
                                                            const goalB = b.priceTrigger ?? Infinity;
                                                            return dir * (goalA - goalB);
                                                        }
                                                        if (explorerSort.column === 'delta') {
                                                            const deltaA = (a.priceTrigger != null && a.currentPrice != null) ? (a.priceTrigger - a.currentPrice) : -Infinity;
                                                            const deltaB = (b.priceTrigger != null && b.currentPrice != null) ? (b.priceTrigger - b.currentPrice) : -Infinity;
                                                            return dir * (deltaA - deltaB);
                                                        }
                                                        return 0;
                                                    });
                                                return sortedBooks.map((book, index) => (
                                                    <div
                                                        key={book.id}
                                                        className={`cursor-pointer hover:opacity-80 ${explorerSelectedBooks.has(book.id) ? 'ring-2 ring-blue-400' : ''}`}
                                                        style={explorerReorderTarget === index ? { outline: `3px solid ${explorerSort.column === 'custom' && selectedFolderId !== '__all__' ? '#3b82f6' : '#f87171'}`, outlineOffset: '2px' } : {}}
                                                        draggable="true"
                                                        onMouseEnter={selectedFolderId === '__all__' ? (e) => {
                                                            // Clear any pending hide timeout
                                                            if (tooltipHideTimeoutRef.current) {
                                                                clearTimeout(tooltipHideTimeoutRef.current);
                                                                tooltipHideTimeoutRef.current = null;
                                                            }
                                                            const rect = e.currentTarget.getBoundingClientRect();
                                                            setBookTooltip({ bookId: book.id, x: rect.left, y: rect.top });
                                                        } : undefined}
                                                        onMouseLeave={selectedFolderId === '__all__' ? () => {
                                                            // v5.0.0-alpha.132 - Delay hide to allow cursor to reach tooltip
                                                            tooltipHideTimeoutRef.current = setTimeout(() => {
                                                                setBookTooltip(null);
                                                            }, 150);
                                                        } : undefined}
                                                        onDragStart={(e) => {
                                                            e.stopPropagation();
                                                            e.dataTransfer.effectAllowed = 'copyMove';
                                                            const dragData = {
                                                                sourceFolder: selectedFolderId, // '__all__' for All Books
                                                                bookIds: explorerSelectedBooks.has(book.id) && explorerSelectedBooks.size > 1
                                                                    ? [...explorerSelectedBooks]
                                                                    : [book.id]
                                                            };
                                                            e.dataTransfer.setData('application/x-readerwrangler', JSON.stringify(dragData));
                                                            setExplorerDragData(dragData); // Store for validity checks in dragOver
                                                            if (!explorerSelectedBooks.has(book.id)) {
                                                                setExplorerSelectedBooks(new Set([book.id]));
                                                            }
                                                            setExplorerDragBookId(book.id);
                                                        }}
                                                        onDragOver={(e) => {
                                                            e.preventDefault(); // Allow drop event to fire
                                                            e.dataTransfer.dropEffect = 'move'; // Must be 'move' for onDrop to fire
                                                            setExplorerReorderTarget(index); // Always show target (styled red if not allowed)
                                                        }}
                                                        onDragLeave={() => setExplorerReorderTarget(null)}
                                                        onDrop={(e) => {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            if (explorerSort.column === 'custom' && selectedFolderId !== '__all__') {
                                                                const dragData = JSON.parse(e.dataTransfer.getData('application/x-readerwrangler'));
                                                                if (dragData.sourceFolder === selectedFolderId) {
                                                                    reorderBooksInFolder(selectedFolderId, dragData.bookIds, index);
                                                                }
                                                            } else if (selectedFolderId === '__all__') {
                                                                showToast('Cannot reorder in All Books', e.clientX, e.clientY);
                                                            } else if (explorerSort.column !== 'custom') {
                                                                showToast('Clear sort to reorder', e.clientX, e.clientY);
                                                            }
                                                            setExplorerReorderTarget(null);
                                                            setExplorerDragBookId(null);
                                                        }}
                                                        onDragEnd={() => {
                                                            setExplorerDragBookId(null);
                                                            setExplorerDropTargetId(null);
                                                            setExplorerReorderTarget(null);
                                                            setExplorerDragData(null);
                                                        }}
                                                        onClick={(e) => {
                                                            if (e.shiftKey && explorerSelectionAnchor !== null) {
                                                                const start = Math.min(explorerSelectionAnchor, index);
                                                                const end = Math.max(explorerSelectionAnchor, index);
                                                                const rangeIds = sortedBooks.slice(start, end + 1).map(b => b.id);
                                                                setExplorerSelectedBooks(new Set(rangeIds));
                                                            } else if (e.ctrlKey || e.metaKey) {
                                                                setExplorerSelectedBooks(prev => {
                                                                    const next = new Set(prev);
                                                                    if (next.has(book.id)) next.delete(book.id);
                                                                    else next.add(book.id);
                                                                    return next;
                                                                });
                                                                setExplorerSelectionAnchor(index);
                                                            } else {
                                                                setExplorerSelectedBooks(new Set([book.id]));
                                                                setExplorerSelectionAnchor(index);
                                                            }
                                                        }}
                                                        onDoubleClick={() => openBookModal(book, null)}>
                                                        <img src={book.coverUrl} alt={book.title} className={`w-full h-auto rounded shadow ${book.onWishlist ? 'opacity-40' : ''}`} />
                                                        <div className="mt-1 text-xs text-gray-700 truncate">{book.title}</div>
                                                    </div>
                                                ));
                                            })()}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* v4.16.0.n - Removed floating selection box, now shown in footer */}

                    {/* v4.16.0.az - Context menu with submenus for Move to / Copy to */}
                    {contextMenu && (() => {
                        // v4.1.0.e - Calculate menu position to avoid going off-screen
                        const menuHeight = 400; // Increased for new items
                        const menuWidth = 220;
                        const submenuWidth = 200;
                        const viewportHeight = window.innerHeight;
                        const viewportWidth = window.innerWidth;

                        // Flip up if menu would go below viewport
                        const top = contextMenu.y + menuHeight > viewportHeight
                            ? Math.max(10, contextMenu.y - menuHeight)
                            : contextMenu.y;
                        // Flip left if menu would go past right edge
                        const left = contextMenu.x + menuWidth > viewportWidth
                            ? Math.max(10, contextMenu.x - menuWidth)
                            : contextMenu.x;

                        // v4.16.0.az - Determine submenu position (left or right of main menu)
                        const submenuOnLeft = left + menuWidth + submenuWidth > viewportWidth;

                        // Get other columns for submenus
                        const otherColumns = columns.filter(col => col.id !== contextMenu.columnId);

                        // v4.16.0.az - Helper to handle move operation
                        const handleMoveToColumn = (targetColId) => {
                            const selectedEntries = getSelectedEntries();
                            const toIndex = 0;
                            const entriesToMove = selectedEntries.map(sel => sel.entry);
                            const fromIndices = selectedEntries.map(sel => sel.index);
                            const booksToMove = selectedEntries.map(sel => sel.bookId);
                            const indicesToRemove = new Set(fromIndices);

                            setColumns(columns.map(column => {
                                if (column.id === contextMenu.columnId) {
                                    return { ...column, books: column.books.filter((item, idx) => !indicesToRemove.has(idx)) };
                                }
                                if (column.id === targetColId) {
                                    return { ...column, books: [...entriesToMove, ...column.books] };
                                }
                                return column;
                            }));
                            recordAction({
                                type: 'MOVE_BOOKS',
                                bookIds: booksToMove,
                                entries: entriesToMove,
                                fromColId: contextMenu.columnId,
                                toColId: targetColId,
                                fromIndices: fromIndices,
                                toIndex: toIndex
                            });
                            clearSelection();
                            setContextMenu(null);
                            setContextSubmenu(null);
                        };

                        // v4.16.0.az - Helper to handle copy operation
                        // v4.16.0.be - Capture isHidden for both GUID and legacy entries
                        const handleCopyToColumn = (targetColId) => {
                            const selectedEntries = getSelectedEntries();
                            const toIndex = 0;

                            // Create new GUID-based entries for copied books
                            // v4.16.0.be - Capture hidden state at copy time
                            const newEntries = selectedEntries.map(sel => {
                                const book = books.find(b => b.id === sel.bookId);
                                // v4.16.0.be - Determine hidden state: GUID uses hiddenInstances, legacy uses book.isHidden
                                const sourceIsHidden = sel.instanceId
                                    ? hiddenInstances.has(sel.instanceId)
                                    : (book?.isHidden || false);
                                return {
                                    instanceId: generateInstanceId(),
                                    bookId: sel.bookId,
                                    sourceIsHidden
                                };
                            });

                            // Copy hidden state for instances that were hidden
                            // v4.16.0.be - Use sourceIsHidden (supports legacy entries)
                            const newHiddenInstanceIds = newEntries
                                .filter(entry => entry.sourceIsHidden)
                                .map(entry => entry.instanceId);

                            if (newHiddenInstanceIds.length > 0) {
                                setHiddenInstances(prev => {
                                    const updated = new Set(prev);
                                    newHiddenInstanceIds.forEach(id => updated.add(id));
                                    return updated;
                                });
                            }

                            // Clean entries before storing
                            const cleanEntries = newEntries.map(({ instanceId, bookId }) => ({ instanceId, bookId }));

                            setColumns(columns.map(column => {
                                if (column.id === targetColId) {
                                    return { ...column, books: [...cleanEntries, ...column.books] };
                                }
                                return column;
                            }));
                            recordAction({
                                type: 'COPY_BOOKS',
                                bookIds: selectedEntries.map(sel => sel.bookId),
                                entries: cleanEntries,
                                toColId: targetColId,
                                toIndex: toIndex
                            });
                            clearSelection();
                            setContextMenu(null);
                            setContextSubmenu(null);
                        };

                        // v4.16.0.az - Helper for Cut operation (same as Ctrl+X)
                        const handleCut = () => {
                            const sourcePositions = [];
                            const bookIds = [];
                            for (const key of selectedBooks) {
                                const [columnId, bookId, indexStr] = key.split(':');
                                const index = parseInt(indexStr, 10);
                                sourcePositions.push({ columnId, index, bookId });
                                bookIds.push(bookId);
                            }
                            setClipboard({ type: 'cut', bookIds, sourcePositions });
                            const message = `${bookIds.length} book${bookIds.length !== 1 ? 's' : ''} cut`;
                            setClipboardMessage(message);
                            setFooterClipboardVisible(false);
                            setToastVisible(true);
                            setToastAnimating(false);
                            setTimeout(() => {
                                setToastAnimating(true);
                                setTimeout(() => {
                                    setToastVisible(false);
                                    setToastAnimating(false);
                                    setFooterClipboardVisible(true);
                                }, 1000);
                            }, 1500);
                            setContextMenu(null);
                            setContextSubmenu(null);
                        };

                        // v4.16.0.az - Helper for Copy operation (same as Ctrl+C)
                        // v4.16.0.be - Also capture isHidden for legacy entries
                        const handleCopy = () => {
                            const sourcePositions = [];
                            const bookIds = [];
                            for (const key of selectedBooks) {
                                const [columnId, bookId, indexStr] = key.split(':');
                                const index = parseInt(indexStr, 10);
                                const column = columns.find(c => c.id === columnId);
                                const entry = column?.books[index];
                                const instanceId = entry ? getInstanceId(entry) : null;
                                // v4.16.0.be - Determine hidden state: GUID uses hiddenInstances, legacy uses book.isHidden
                                const book = books.find(b => b.id === bookId);
                                const isHidden = instanceId
                                    ? hiddenInstances.has(instanceId)
                                    : (book?.isHidden || false);
                                sourcePositions.push({ columnId, index, bookId, instanceId, isHidden });
                                bookIds.push(bookId);
                            }
                            setClipboard({ type: 'copy', bookIds, sourcePositions });
                            const message = `${bookIds.length} book${bookIds.length !== 1 ? 's' : ''} copied`;
                            setClipboardMessage(message);
                            setFooterClipboardVisible(false);
                            setToastVisible(true);
                            setToastAnimating(false);
                            setTimeout(() => {
                                setToastAnimating(true);
                                setTimeout(() => {
                                    setToastVisible(false);
                                    setToastAnimating(false);
                                    setFooterClipboardVisible(true);
                                }, 1000);
                            }, 1500);
                            setContextMenu(null);
                            setContextSubmenu(null);
                        };

                        // v4.16.0.az - Helper for Paste operation (same as Ctrl+V)
                        const handlePaste = () => {
                            if (!clipboard || clipboard.bookIds.length === 0) return;

                            const targetColumnId = contextMenu.columnId;
                            const targetColumn = columns.find(col => col.id === targetColumnId);
                            if (!targetColumn) return;

                            const selectedInTarget = getSelectedEntries().filter(sel => sel.columnId === targetColumnId);
                            const pasteIndex = selectedInTarget.length > 0
                                ? Math.min(...selectedInTarget.map(sel => sel.index))
                                : 0;

                            if (clipboard.type === 'cut') {
                                setColumns(prevColumns => {
                                    const entriesToMove = [];
                                    clipboard.sourcePositions.forEach(pos => {
                                        const sourceCol = prevColumns.find(c => c.id === pos.columnId);
                                        if (sourceCol && sourceCol.books[pos.index]) {
                                            entriesToMove.push(sourceCol.books[pos.index]);
                                        }
                                    });

                                    const indicesToRemoveFromTarget = clipboard.sourcePositions
                                        .filter(pos => pos.columnId === targetColumnId && pos.index < pasteIndex)
                                        .length;
                                    const adjustedPasteIndex = pasteIndex - indicesToRemoveFromTarget;

                                    const newColumns = prevColumns.map(col => {
                                        const indicesToRemove = new Set();
                                        clipboard.sourcePositions.forEach(pos => {
                                            if (pos.columnId === col.id) {
                                                indicesToRemove.add(pos.index);
                                            }
                                        });
                                        return {
                                            ...col,
                                            books: col.books.filter((item, idx) => {
                                                if (typeof item === 'object' && item.type === 'divider') return true;
                                                return !indicesToRemove.has(idx);
                                            })
                                        };
                                    });
                                    const targetIdx = newColumns.findIndex(col => col.id === targetColumnId);
                                    if (targetIdx !== -1) {
                                        const newBooks = [...newColumns[targetIdx].books];
                                        newBooks.splice(adjustedPasteIndex, 0, ...entriesToMove);
                                        newColumns[targetIdx] = { ...newColumns[targetIdx], books: newBooks };
                                    }
                                    return newColumns;
                                });
                                setClipboard(null);
                                setClipboardMessage(null);
                                setToastVisible(false);
                                setToastAnimating(false);
                                setFooterClipboardVisible(false);
                                clearSelection();
                            } else {
                                // Copy: create new entries
                                // v4.16.0.be - Use isHidden captured at copy time (supports legacy entries)
                                const newEntries = clipboard.sourcePositions.map(pos => ({
                                    instanceId: generateInstanceId(),
                                    bookId: pos.bookId,
                                    sourceIsHidden: pos.isHidden // v4.16.0.be - Use captured hidden state
                                }));

                                // v4.16.0.be - Use sourceIsHidden (captured at copy time) instead of checking hiddenInstances
                                const newHiddenInstanceIds = newEntries
                                    .filter(entry => entry.sourceIsHidden)
                                    .map(entry => entry.instanceId);

                                if (newHiddenInstanceIds.length > 0) {
                                    setHiddenInstances(prev => {
                                        const updated = new Set(prev);
                                        newHiddenInstanceIds.forEach(id => updated.add(id));
                                        return updated;
                                    });
                                }

                                const cleanEntries = newEntries.map(({ instanceId, bookId }) => ({ instanceId, bookId }));

                                setColumns(prevColumns => {
                                    return prevColumns.map(col => {
                                        if (col.id === targetColumnId) {
                                            const newBooks = [...col.books];
                                            newBooks.splice(pasteIndex, 0, ...cleanEntries);
                                            return { ...col, books: newBooks };
                                        }
                                        return col;
                                    });
                                });
                                recordAction({
                                    type: 'COPY_BOOKS',
                                    bookIds: clipboard.bookIds,
                                    entries: cleanEntries,
                                    toColId: targetColumnId,
                                    toIndex: pasteIndex
                                });
                            }
                            setContextMenu(null);
                            setContextSubmenu(null);
                        };

                        return (
                        <div className="fixed bg-white border border-gray-300 rounded-lg shadow-xl z-[60] py-1 min-w-[200px]"
                             style={{
                                 left: `${left}px`,
                                 top: `${top}px`
                             }}
                             onClick={(e) => e.stopPropagation()}>
                            {/* Header */}
                            <div className="px-3 py-1.5 text-xs font-semibold text-gray-500 border-b border-gray-200">
                                {selectedBooks.size} book{selectedBooks.size !== 1 ? 's' : ''} selected
                            </div>

                            {/* Move to submenu trigger */}
                            <div className="relative"
                                 onMouseEnter={() => setContextSubmenu('move')}
                                 onMouseLeave={() => setContextSubmenu(null)}>
                                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center justify-between">
                                    <span className="flex items-center gap-2">📁 Move to</span>
                                    <span className="text-gray-400">▶</span>
                                </button>
                                {/* Move to submenu */}
                                {contextSubmenu === 'move' && otherColumns.length > 0 && (
                                    <div className="absolute bg-white border border-gray-300 rounded-lg shadow-xl py-1 min-w-[180px] max-h-[300px] overflow-y-auto"
                                         style={{
                                             top: 0,
                                             [submenuOnLeft ? 'right' : 'left']: '100%'
                                         }}>
                                        {otherColumns.map(col => (
                                            <button
                                                key={col.id}
                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 truncate"
                                                onClick={() => handleMoveToColumn(col.id)}>
                                                {col.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Copy to submenu trigger */}
                            <div className="relative"
                                 onMouseEnter={() => setContextSubmenu('copyTo')}
                                 onMouseLeave={() => setContextSubmenu(null)}>
                                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center justify-between">
                                    <span className="flex items-center gap-2">⧉ Copy to</span>
                                    <span className="text-gray-400">▶</span>
                                </button>
                                {/* Copy to submenu */}
                                {contextSubmenu === 'copyTo' && otherColumns.length > 0 && (
                                    <div className="absolute bg-white border border-gray-300 rounded-lg shadow-xl py-1 min-w-[180px] max-h-[300px] overflow-y-auto"
                                         style={{
                                             top: 0,
                                             [submenuOnLeft ? 'right' : 'left']: '100%'
                                         }}>
                                        {otherColumns.map(col => (
                                            <button
                                                key={col.id}
                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 truncate"
                                                onClick={() => handleCopyToColumn(col.id)}>
                                                {col.name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 my-1"></div>

                            {/* Open in Amazon */}
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                onClick={() => {
                                    const selectedBooksList = getSelectedBooksList();
                                    const count = selectedBooksList.length;
                                    if (count > 10) {
                                        alert('Too many books selected. Please select 10 or fewer to open in Amazon.');
                                    } else if (count > 3) {
                                        if (window.confirm(`Open ${count} tabs in Amazon?`)) {
                                            selectedBooksList.forEach(book => {
                                                window.open(getAmazonUrl(book.asin), '_blank');
                                            });
                                        }
                                    } else {
                                        selectedBooksList.forEach(book => {
                                            window.open(getAmazonUrl(book.asin), '_blank');
                                        });
                                    }
                                    setContextMenu(null);
                                    setContextSubmenu(null);
                                }}>
                                🔗 Open in Amazon
                            </button>

                            {/* Copy Title(s) */}
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                onClick={() => {
                                    const selectedBooksList = getSelectedBooksList();
                                    const titles = selectedBooksList.map(book => book.title).join('\n');
                                    navigator.clipboard.writeText(titles);
                                    setContextMenu(null);
                                    setContextSubmenu(null);
                                }}>
                                📝 Copy Title{selectedBooks.size !== 1 ? 's' : ''}
                            </button>

                            {/* v4.21.0.a - Add/Edit Note (single book only) */}
                            {selectedBooks.size === 1 && (() => {
                                const selectedBooksList = getSelectedBooksList();
                                const book = selectedBooksList[0];
                                const hasNote = book?.userNote;
                                return (
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                        onClick={() => {
                                            // Open modal with note editor
                                            const [colId] = [...selectedBooks][0].split(':');
                                            openBookModal(book, colId);
                                            // Set up note editing
                                            setNoteEditContent(book.userNote || '');
                                            setIsEditingNote(true);
                                            setContextMenu(null);
                                            setContextSubmenu(null);
                                        }}>
                                        {hasNote ? '✏️ Edit Note' : '📝 Add Note'}
                                    </button>
                                );
                            })()}

                            {/* v4.20.0.a - Set Price Goal submenu */}
                            <div className="relative"
                                 onMouseEnter={() => setContextSubmenu('priceGoal')}
                                 onMouseLeave={() => setContextSubmenu(null)}>
                                <button className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center justify-between">
                                    <span className="flex items-center gap-2">💰 Set Price Goal</span>
                                    <span className="text-gray-400">▶</span>
                                </button>
                                {/* Price Goal submenu */}
                                {contextSubmenu === 'priceGoal' && (
                                    <div className="absolute bg-white border border-gray-300 rounded-lg shadow-xl py-1 min-w-[140px]"
                                         style={{
                                             top: 0,
                                             [submenuOnLeft ? 'right' : 'left']: '100%'
                                         }}>
                                        {[0.99, 1.99, 2.99, 3.99, 4.99].map(price => (
                                            <button
                                                key={price}
                                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700"
                                                onClick={async () => {
                                                    const selectedBookIds = getSelectedBookIds();
                                                    const count = selectedBookIds.length;
                                                    setBooks(prev => {
                                                        const updated = prev.map(b =>
                                                            selectedBookIds.includes(b.id) ? { ...b, priceTrigger: price } : b
                                                        );
                                                        saveBooksToIndexedDB(updated);
                                                        return updated;
                                                    });
                                                    // Toast feedback
                                                    setClipboardMessage(`Price goal set to $${price.toFixed(2)} for ${count} book${count !== 1 ? 's' : ''}`);
                                                    setFooterClipboardVisible(false);
                                                    setToastVisible(true);
                                                    setToastAnimating(false);
                                                    setTimeout(() => {
                                                        setToastAnimating(true);
                                                        setTimeout(() => {
                                                            setToastVisible(false);
                                                            setToastAnimating(false);
                                                            setFooterClipboardVisible(true);
                                                        }, 1000);
                                                    }, 1500);
                                                    setContextMenu(null);
                                                    setContextSubmenu(null);
                                                }}>
                                                ${price.toFixed(2)}
                                            </button>
                                        ))}
                                        <button
                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700"
                                            onClick={() => {
                                                setShowBulkPriceModal(true);
                                                setContextMenu(null);
                                                setContextSubmenu(null);
                                            }}>
                                            Custom...
                                        </button>
                                        <div className="border-t border-gray-200 my-1"></div>
                                        <button
                                            className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-red-600"
                                            onClick={async () => {
                                                const selectedBookIds = getSelectedBookIds();
                                                const count = selectedBookIds.length;
                                                setBooks(prev => {
                                                    const updated = prev.map(b =>
                                                        selectedBookIds.includes(b.id) ? { ...b, priceTrigger: null } : b
                                                    );
                                                    saveBooksToIndexedDB(updated);
                                                    return updated;
                                                });
                                                // Toast feedback
                                                setClipboardMessage(`Price goal cleared for ${count} book${count !== 1 ? 's' : ''}`);
                                                setFooterClipboardVisible(false);
                                                setToastVisible(true);
                                                setToastAnimating(false);
                                                setTimeout(() => {
                                                    setToastAnimating(true);
                                                    setTimeout(() => {
                                                        setToastVisible(false);
                                                        setToastAnimating(false);
                                                        setFooterClipboardVisible(true);
                                                    }, 1000);
                                                }, 1500);
                                                setContextMenu(null);
                                                setContextSubmenu(null);
                                            }}>
                                            Clear
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="border-t border-gray-200 my-1"></div>

                            {/* v4.16.0.az - Cut/Copy/Paste with keyboard shortcuts */}
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center justify-between"
                                onClick={handleCut}>
                                <span className="flex items-center gap-2">✂️ Cut</span>
                                <span className="text-xs text-gray-400">Ctrl+X</span>
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center justify-between"
                                onClick={handleCopy}>
                                <span className="flex items-center gap-2">📑 Copy</span>
                                <span className="text-xs text-gray-400">Ctrl+C</span>
                            </button>
                            <button
                                className={`w-full text-left px-4 py-2 text-sm flex items-center justify-between ${clipboard && clipboard.bookIds.length > 0 ? 'hover:bg-blue-50 text-gray-700' : 'text-gray-300 cursor-not-allowed'}`}
                                onClick={handlePaste}
                                disabled={!clipboard || clipboard.bookIds.length === 0}>
                                <span className="flex items-center gap-2">📋 Paste</span>
                                <span className="text-xs text-gray-400">Ctrl+V</span>
                            </button>

                            <div className="border-t border-gray-200 my-1"></div>

                            {/* Hide/Unhide Book(s) */}
                            {(() => {
                                const selectedEntries = getSelectedEntries();
                                const allHidden = selectedEntries.every(sel => {
                                    if (sel.instanceId) {
                                        return hiddenInstances.has(sel.instanceId);
                                    } else {
                                        const book = books.find(b => b.id === sel.bookId);
                                        return book?.isHidden;
                                    }
                                });

                                return (
                                    <button
                                        className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                        onClick={async () => {
                                            const newHiddenState = !allHidden;
                                            const guidEntries = selectedEntries.filter(sel => sel.instanceId);
                                            const legacyEntries = selectedEntries.filter(sel => !sel.instanceId);

                                            if (guidEntries.length > 0) {
                                                setHiddenInstances(prev => {
                                                    const next = new Set(prev);
                                                    guidEntries.forEach(sel => {
                                                        if (newHiddenState) {
                                                            next.add(sel.instanceId);
                                                        } else {
                                                            next.delete(sel.instanceId);
                                                        }
                                                    });
                                                    return next;
                                                });
                                            }

                                            if (legacyEntries.length > 0) {
                                                const legacyBookIds = legacyEntries.map(sel => sel.bookId);
                                                const updatedBooks = books.map(book => {
                                                    if (legacyBookIds.includes(book.id)) {
                                                        return { ...book, isHidden: newHiddenState };
                                                    }
                                                    return book;
                                                });
                                                setBooks(updatedBooks);
                                                await saveBooksToIndexedDB(updatedBooks);
                                            }

                                            if (legacyEntries.length > 0) {
                                                const previousStates = {};
                                                legacyEntries.forEach(sel => {
                                                    const book = books.find(b => b.id === sel.bookId);
                                                    previousStates[sel.bookId] = book?.isHidden || false;
                                                });
                                                recordAction({
                                                    type: 'TOGGLE_HIDE',
                                                    bookIds: legacyEntries.map(sel => sel.bookId),
                                                    previousStates: previousStates,
                                                    newState: newHiddenState
                                                });
                                            }

                                            clearSelection();
                                            setContextMenu(null);
                                            setContextSubmenu(null);
                                        }}>
                                        {allHidden ? '👁️' : '🚫'} {allHidden ? 'Unhide' : 'Hide'} Book{selectedBooks.size !== 1 ? 's' : ''}
                                    </button>
                                );
                            })()}

                            <div className="border-t border-gray-200 my-1"></div>

                            {/* Delete */}
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
                                onClick={() => {
                                    const selectedEntries = getSelectedEntries();
                                    if (selectedEntries.length === 0) {
                                        setContextMenu(null);
                                        setContextSubmenu(null);
                                        return;
                                    }

                                    const bookIdCounts = {};
                                    columns.forEach(col => {
                                        col.books.forEach(entry => {
                                            const bookId = getBookIdFromEntry(entry);
                                            if (bookId) {
                                                bookIdCounts[bookId] = (bookIdCounts[bookId] || 0) + 1;
                                            }
                                        });
                                    });

                                    // v4.16.0.bd - Count how many of each bookId are selected for deletion
                                    const selectedCounts = {};
                                    selectedEntries.forEach(sel => {
                                        selectedCounts[sel.bookId] = (selectedCounts[sel.bookId] || 0) + 1;
                                    });

                                    // v4.16.0.bd - "last copy" = deleting would leave zero copies in library
                                    const lastCopyEntries = [];
                                    const deletableEntries = [];
                                    selectedEntries.forEach(sel => {
                                        const remainingAfterDelete = bookIdCounts[sel.bookId] - selectedCounts[sel.bookId];
                                        if (remainingAfterDelete === 0) {
                                            lastCopyEntries.push(sel);
                                        } else {
                                            deletableEntries.push(sel);
                                        }
                                    });

                                    if (deletableEntries.length > 0) {
                                        const indicesToRemoveByColumn = {};
                                        deletableEntries.forEach(sel => {
                                            if (!indicesToRemoveByColumn[sel.columnId]) {
                                                indicesToRemoveByColumn[sel.columnId] = new Set();
                                            }
                                            indicesToRemoveByColumn[sel.columnId].add(sel.index);
                                        });

                                        setColumns(prevColumns => {
                                            return prevColumns.map(col => {
                                                const indicesToRemove = indicesToRemoveByColumn[col.id];
                                                if (!indicesToRemove) return col;
                                                return {
                                                    ...col,
                                                    books: col.books.filter((_, idx) => !indicesToRemove.has(idx))
                                                };
                                            });
                                        });
                                        clearSelection();
                                    }

                                    if (lastCopyEntries.length > 0) {
                                        setLastCopyDialogData({
                                            lastCopyEntries,
                                            deletedCount: deletableEntries.length
                                        });
                                    }

                                    setContextMenu(null);
                                    setContextSubmenu(null);
                                }}>
                                🗑️ Delete Book{selectedBooks.size !== 1 ? 's' : ''}
                            </button>
                        </div>
                        );
                    })()}

                    {/* v4.27.0 - Divider context menu for tag operations */}
                    {dividerContextMenu && (
                        <div
                            className="fixed bg-white border border-gray-300 rounded-lg shadow-xl py-1 z-50"
                            style={{ left: dividerContextMenu.x, top: dividerContextMenu.y, minWidth: '180px' }}
                            onClick={(e) => e.stopPropagation()}>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                onClick={() => {
                                    startEditingDivider(dividerContextMenu.columnId, dividerContextMenu.dividerId, dividerContextMenu.divider.label);
                                    setDividerContextMenu(null);
                                }}>
                                ✏️ Rename
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                onClick={() => {
                                    setDividerTagEditorOpen({
                                        columnId: dividerContextMenu.columnId,
                                        dividerId: dividerContextMenu.dividerId
                                    });
                                    setTagInputValue('');
                                    setDividerContextMenu(null);
                                }}>
                                🏷️ Edit Tags {dividerContextMenu.divider.tags?.length > 0 && `(${dividerContextMenu.divider.tags.length})`}
                            </button>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-blue-50 text-sm text-gray-700 flex items-center gap-2"
                                onClick={() => {
                                    // Add divider's tags to all books under this divider
                                    const column = columns.find(c => c.id === dividerContextMenu.columnId);
                                    if (!column) return;
                                    const divTags = dividerContextMenu.divider.tags || [];
                                    if (divTags.length === 0) {
                                        alert('This divider has no tags to add.');
                                        setDividerContextMenu(null);
                                        return;
                                    }
                                    // Find books under this divider (until next divider)
                                    let foundDivider = false;
                                    const booksToTag = [];
                                    for (const entry of column.books) {
                                        if (entry && entry.type === 'divider') {
                                            if (entry.id === dividerContextMenu.dividerId) {
                                                foundDivider = true;
                                            } else if (foundDivider) {
                                                break; // Next divider reached
                                            }
                                        } else if (foundDivider) {
                                            const bookId = getBookIdFromEntry(entry);
                                            if (bookId) booksToTag.push(bookId);
                                        }
                                    }
                                    if (booksToTag.length === 0) {
                                        alert('No books under this divider.');
                                        setDividerContextMenu(null);
                                        return;
                                    }
                                    // Add tags to books
                                    setBooks(prev => {
                                        const updated = prev.map(book => {
                                            if (booksToTag.includes(book.id)) {
                                                const existingTags = book.tags || [];
                                                const newTags = [...new Set([...existingTags, ...divTags])];
                                                return { ...book, tags: newTags };
                                            }
                                            return book;
                                        });
                                        saveBooksToIndexedDB(updated);
                                        return updated;
                                    });
                                    // Update tag registry counts
                                    setTagRegistry(prev => {
                                        const updated = { ...prev };
                                        divTags.forEach(tagId => {
                                            if (updated[tagId]) {
                                                updated[tagId] = { ...updated[tagId], count: updated[tagId].count + booksToTag.length };
                                            }
                                        });
                                        return updated;
                                    });
                                    alert(`Added ${divTags.length} tag(s) to ${booksToTag.length} book(s).`);
                                    setDividerContextMenu(null);
                                }}>
                                📚 Add Tags to All Books
                            </button>
                            <div className="border-t border-gray-200 my-1"></div>
                            <button
                                className="w-full text-left px-4 py-2 hover:bg-red-50 text-sm text-red-600 flex items-center gap-2"
                                onClick={() => {
                                    deleteDivider(dividerContextMenu.columnId, dividerContextMenu.dividerId);
                                    setDividerContextMenu(null);
                                }}>
                                🗑️ Delete Divider
                            </button>
                        </div>
                    )}

                    {/* v4.27.0 - Divider tag editor modal */}
                    {dividerTagEditorOpen && (() => {
                        const column = columns.find(c => c.id === dividerTagEditorOpen.columnId);
                        const divider = column?.books.find(b => b && b.type === 'divider' && b.id === dividerTagEditorOpen.dividerId);
                        if (!divider) return null;
                        const divTags = divider.tags || [];

                        return (
                            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                                 onClick={() => { setDividerTagEditorOpen(null); setTagInputValue(''); }}>
                                <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md"
                                     onClick={(e) => e.stopPropagation()}>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="text-lg font-semibold">Edit Tags for "{divider.label}"</h3>
                                        <button onClick={() => { setDividerTagEditorOpen(null); setTagInputValue(''); }}
                                                className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                                    </div>
                                    <div className="mb-4">
                                        <div className="flex flex-wrap gap-2 mb-3 min-h-[32px]">
                                            {divTags.length > 0 ? divTags.map(tagId => (
                                                <span key={tagId}
                                                      className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-sm">
                                                    {tagRegistry[tagId]?.label || tagId}
                                                    <button onClick={() => {
                                                        // Remove tag from divider
                                                        setColumns(prev => prev.map(col => {
                                                            if (col.id !== dividerTagEditorOpen.columnId) return col;
                                                            return {
                                                                ...col,
                                                                books: col.books.map(b => {
                                                                    if (b && b.type === 'divider' && b.id === dividerTagEditorOpen.dividerId) {
                                                                        return { ...b, tags: (b.tags || []).filter(t => t !== tagId) };
                                                                    }
                                                                    return b;
                                                                })
                                                            };
                                                        }));
                                                    }}
                                                            className="text-blue-600 hover:text-blue-800 font-bold">×</button>
                                                </span>
                                            )) : <span className="text-gray-400 italic">No tags</span>}
                                        </div>
                                        <div className="relative">
                                            <input
                                                type="text"
                                                value={tagInputValue}
                                                onChange={(e) => setTagInputValue(e.target.value)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Escape') {
                                                        setDividerTagEditorOpen(null);
                                                        setTagInputValue('');
                                                    } else if (e.key === 'Enter') {
                                                        // v4.27.0-alpha.5 - Enter selects top match or creates new tag
                                                        const input = tagInputValue.toLowerCase().trim();
                                                        if (!input) return;
                                                        const allTagsExactMatch = Object.entries(tagRegistry)
                                                            .find(([id, data]) => data.label.toLowerCase() === input);
                                                        const existingTags = Object.entries(tagRegistry)
                                                            .filter(([id, data]) =>
                                                                data.label.toLowerCase().includes(input) && !divTags.includes(id)
                                                            )
                                                            .sort((a, b) => a[1].label.localeCompare(b[1].label));

                                                        if (existingTags.length > 0) {
                                                            // Select top match
                                                            const [tagId] = existingTags[0];
                                                            setColumns(prev => prev.map(col => {
                                                                if (col.id !== dividerTagEditorOpen.columnId) return col;
                                                                return {
                                                                    ...col,
                                                                    books: col.books.map(b => {
                                                                        if (b && b.type === 'divider' && b.id === dividerTagEditorOpen.dividerId) {
                                                                            return { ...b, tags: [...(b.tags || []), tagId] };
                                                                        }
                                                                        return b;
                                                                    })
                                                                };
                                                            }));
                                                            setTagInputValue('');
                                                        } else if (!allTagsExactMatch) {
                                                            // Create new tag
                                                            const newTagId = input.replace(/\s+/g, '-');
                                                            const newTagLabel = tagInputValue.trim();
                                                            setTagRegistry(prev => ({
                                                                ...prev,
                                                                [newTagId]: { label: newTagLabel, count: 0 }
                                                            }));
                                                            setColumns(prev => prev.map(col => {
                                                                if (col.id !== dividerTagEditorOpen.columnId) return col;
                                                                return {
                                                                    ...col,
                                                                    books: col.books.map(b => {
                                                                        if (b && b.type === 'divider' && b.id === dividerTagEditorOpen.dividerId) {
                                                                            return { ...b, tags: [...(b.tags || []), newTagId] };
                                                                        }
                                                                        return b;
                                                                    })
                                                                };
                                                            }));
                                                            setTagInputValue('');
                                                        }
                                                        // If tag already on divider, do nothing
                                                    }
                                                }}
                                                placeholder="Type to add tag..."
                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm"
                                                autoFocus
                                            />
                                            {tagInputValue && (
                                                <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-[200px] overflow-y-auto z-10">
                                                    {(() => {
                                                        const input = tagInputValue.toLowerCase().trim();
                                                        const allTagsExactMatch = Object.entries(tagRegistry)
                                                            .find(([id, data]) => data.label.toLowerCase() === input);
                                                        const existingTags = Object.entries(tagRegistry)
                                                            .filter(([id, data]) =>
                                                                data.label.toLowerCase().includes(input) && !divTags.includes(id)
                                                            )
                                                            .sort((a, b) => a[1].label.localeCompare(b[1].label));
                                                        const showCreate = input && !allTagsExactMatch;
                                                        const tagAlreadyOnDiv = allTagsExactMatch && divTags.includes(allTagsExactMatch[0]);

                                                        return (
                                                            <>
                                                                {showCreate && (
                                                                    <button
                                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-blue-50 text-blue-600"
                                                                        onClick={() => {
                                                                            const newTagId = input.replace(/\s+/g, '-');
                                                                            const newTagLabel = tagInputValue.trim();
                                                                            setTagRegistry(prev => ({
                                                                                ...prev,
                                                                                [newTagId]: { label: newTagLabel, count: 0 }
                                                                            }));
                                                                            setColumns(prev => prev.map(col => {
                                                                                if (col.id !== dividerTagEditorOpen.columnId) return col;
                                                                                return {
                                                                                    ...col,
                                                                                    books: col.books.map(b => {
                                                                                        if (b && b.type === 'divider' && b.id === dividerTagEditorOpen.dividerId) {
                                                                                            return { ...b, tags: [...(b.tags || []), newTagId] };
                                                                                        }
                                                                                        return b;
                                                                                    })
                                                                                };
                                                                            }));
                                                                            setTagInputValue('');
                                                                        }}>
                                                                        ➕ Create "{tagInputValue.trim()}"
                                                                    </button>
                                                                )}
                                                                {existingTags.map(([tagId, tagData]) => (
                                                                    <button
                                                                        key={tagId}
                                                                        className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100"
                                                                        onClick={() => {
                                                                            setColumns(prev => prev.map(col => {
                                                                                if (col.id !== dividerTagEditorOpen.columnId) return col;
                                                                                return {
                                                                                    ...col,
                                                                                    books: col.books.map(b => {
                                                                                        if (b && b.type === 'divider' && b.id === dividerTagEditorOpen.dividerId) {
                                                                                            return { ...b, tags: [...(b.tags || []), tagId] };
                                                                                        }
                                                                                        return b;
                                                                                    })
                                                                                };
                                                                            }));
                                                                            setTagInputValue('');
                                                                        }}>
                                                                        {tagData.label} ({tagData.count})
                                                                    </button>
                                                                ))}
                                                                {existingTags.length === 0 && !showCreate && (
                                                                    <div className="px-3 py-2 text-sm text-gray-400">
                                                                        {tagAlreadyOnDiv ? `"${allTagsExactMatch[1].label}" already added` : 'No matching tags'}
                                                                    </div>
                                                                )}
                                                            </>
                                                        );
                                                    })()}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <p className="text-xs text-gray-500">
                                        Books under this divider will inherit these tags when filtering.
                                    </p>
                                </div>
                            </div>
                        );
                    })()}

                    {/* v4.27.0 Phase 3 - Tag Management Modal */}
                    {tagManagementOpen && (
                        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
                             onClick={() => { setTagManagementOpen(false); setEditingTagId(null); }}>
                            <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[80vh] flex flex-col"
                                 onClick={(e) => e.stopPropagation()}>
                                <div className="flex items-center justify-between p-4 border-b border-gray-200">
                                    <h2 className="text-xl font-semibold">Manage Tags</h2>
                                    <button onClick={() => { setTagManagementOpen(false); setEditingTagId(null); }}
                                            className="text-gray-400 hover:text-gray-600 text-2xl">×</button>
                                </div>
                                <div className="flex-1 overflow-y-auto p-4">
                                    {Object.keys(tagRegistry).length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">No tags created yet.</p>
                                    ) : (() => {
                                        const sortedTags = Object.entries(tagRegistry).sort((a, b) => a[1].label.localeCompare(b[1].label));
                                        const activeTags = sortedTags.filter(([, data]) => data.count > 0);
                                        const orphanedTags = sortedTags.filter(([, data]) => data.count === 0);

                                        return (
                                            <>
                                                <table className="w-full text-sm">
                                                    <thead>
                                                        <tr className="text-left border-b border-gray-200">
                                                            <th className="py-2 font-semibold">Tag</th>
                                                            <th className="py-2 font-semibold text-center w-20">Books</th>
                                                            <th className="py-2 font-semibold text-right w-32">Actions</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {activeTags.map(([tagId, tagData]) => (
                                                            <tr key={tagId} className="border-b border-gray-100 hover:bg-gray-50">
                                                                <td className="py-2">
                                                                    {editingTagId === tagId ? (
                                                                        <input
                                                                            type="text"
                                                                            defaultValue={tagData.label}
                                                                            autoFocus
                                                                            className="px-2 py-1 border border-blue-500 rounded text-sm w-full"
                                                                            onKeyDown={(e) => {
                                                                                if (e.key === 'Escape') {
                                                                                    setEditingTagId(null);
                                                                                } else if (e.key === 'Enter') {
                                                                                    const newLabel = e.target.value.trim();
                                                                                    if (newLabel && newLabel !== tagData.label) {
                                                                                        // Rename tag - update registry label only (ID stays the same)
                                                                                        setTagRegistry(prev => ({
                                                                                            ...prev,
                                                                                            [tagId]: { ...prev[tagId], label: newLabel }
                                                                                        }));
                                                                                    }
                                                                                    setEditingTagId(null);
                                                                                }
                                                                            }}
                                                                            onBlur={(e) => {
                                                                                const newLabel = e.target.value.trim();
                                                                                if (newLabel && newLabel !== tagData.label) {
                                                                                    setTagRegistry(prev => ({
                                                                                        ...prev,
                                                                                        [tagId]: { ...prev[tagId], label: newLabel }
                                                                                    }));
                                                                                }
                                                                                setEditingTagId(null);
                                                                            }}
                                                                        />
                                                                    ) : (
                                                                        <span>{tagData.label}</span>
                                                                    )}
                                                                </td>
                                                                <td className="py-2 text-center text-gray-500">{tagData.count}</td>
                                                                <td className="py-2 text-right">
                                                                    <button
                                                                        onClick={() => setEditingTagId(tagId)}
                                                                        className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded mr-1">
                                                                        Rename
                                                                    </button>
                                                                    <button
                                                                        onClick={() => {
                                                                            if (confirm(`Delete tag "${tagData.label}"? This will remove it from ${tagData.count} book${tagData.count !== 1 ? 's' : ''}.`)) {
                                                                                // Remove tag from all books
                                                                                setBooks(prev => {
                                                                                    const updated = prev.map(b => {
                                                                                        if (b.tags && b.tags.includes(tagId)) {
                                                                                            return { ...b, tags: b.tags.filter(t => t !== tagId) };
                                                                                        }
                                                                                        return b;
                                                                                    });
                                                                                    saveBooksToIndexedDB(updated);
                                                                                    return updated;
                                                                                });
                                                                                // Remove tag from all dividers
                                                                                setColumns(prev => prev.map(col => ({
                                                                                    ...col,
                                                                                    books: col.books.map(b => {
                                                                                        if (b && b.type === 'divider' && b.tags?.includes(tagId)) {
                                                                                            return { ...b, tags: b.tags.filter(t => t !== tagId) };
                                                                                        }
                                                                                        return b;
                                                                                    })
                                                                                })));
                                                                                // Remove from registry
                                                                                setTagRegistry(prev => {
                                                                                    const updated = { ...prev };
                                                                                    delete updated[tagId];
                                                                                    return updated;
                                                                                });
                                                                                // Remove from active filter if present
                                                                                setTagFilter(prev => prev.filter(t => t !== tagId));
                                                                            }
                                                                        }}
                                                                        className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
                                                                        Delete
                                                                    </button>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                                {orphanedTags.length > 0 && (
                                                    <>
                                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                                            <h3 className="text-sm font-semibold text-gray-500 mb-2">Orphaned tags (0 books)</h3>
                                                            <table className="w-full text-sm">
                                                                <tbody>
                                                                    {orphanedTags.map(([tagId, tagData]) => (
                                                                        <tr key={tagId} className="border-b border-gray-100 hover:bg-gray-50">
                                                                            <td className="py-2 text-gray-400">{tagData.label}</td>
                                                                            <td className="py-2 text-center text-gray-400 w-20">0</td>
                                                                            <td className="py-2 text-right w-32">
                                                                                <button
                                                                                    onClick={() => {
                                                                                        setTagRegistry(prev => {
                                                                                            const updated = { ...prev };
                                                                                            delete updated[tagId];
                                                                                            return updated;
                                                                                        });
                                                                                    }}
                                                                                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded">
                                                                                    Delete
                                                                                </button>
                                                                            </td>
                                                                        </tr>
                                                                    ))}
                                                                </tbody>
                                                            </table>
                                                        </div>
                                                        <button
                                                            onClick={() => {
                                                                setTagRegistry(prev => {
                                                                    const updated = { ...prev };
                                                                    orphanedTags.forEach(([tagId]) => delete updated[tagId]);
                                                                    return updated;
                                                                });
                                                            }}
                                                            className="mt-2 px-3 py-1 text-xs text-red-600 hover:bg-red-50 rounded border border-red-200">
                                                            Delete all orphaned tags
                                                        </button>
                                                    </>
                                                )}
                                            </>
                                        );
                                    })()}
                                </div>
                            </div>
                        </div>
                    )}

                    {/* v3.14.0.x - Ghost position controlled via ref in updateGhostPosition */}
                    {isDragging && draggedBook && (
                        <div className="drag-ghost"
                             ref={dragGhostRef}
                             style={{
                                 left: dragPosRef.current.x - 50,
                                 top: dragPosRef.current.y - 75,
                                 width: '100px'
                             }}>
                            {/* Show stacked effect if dragging multiple books */}
                            {/* v4.16.0.d - Use composite key with index for selection check */}
                            {selectedBooks.size > 1 && selectedBooks.has(`${draggedFromColumn}:${draggedBook.id}:${draggedBookIndex}`) && (
                                <>
                                    <div className="absolute" style={{ left: '8px', top: '8px', opacity: 0.4 }}>
                                        <div className="w-full aspect-[2/3] rounded drag-ghost-border bg-blue-100" style={{ width: '100px' }}></div>
                                    </div>
                                    <div className="absolute" style={{ left: '4px', top: '4px', opacity: 0.6 }}>
                                        <div className="w-full aspect-[2/3] rounded drag-ghost-border bg-blue-200" style={{ width: '100px' }}></div>
                                    </div>
                                </>
                            )}
                            {/* Main dragged book */}
                            <div className="relative">
                                {blankImageBooks.has(draggedBook.id) ? (
                                    <div className="w-full aspect-[2/3] rounded drag-ghost-border"
                                         style={{ backgroundColor: '#d4c5a9' }}>
                                        <div className="flex items-center justify-center h-full px-1">
                                            <div className="text-xs font-serif font-bold text-gray-800 text-center leading-tight">
                                                {draggedBook.title.length > 20 ? draggedBook.title.substring(0, 20) + '...' : draggedBook.title}
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <img src={coverUrlMap[draggedBook.coverUrl] || draggedBook.coverUrl}
                                         alt={draggedBook.title}
                                         className="w-full rounded drag-ghost-border" />
                                )}
                                {/* Count badge for multiple books */}
                                {/* v4.16.0.d - Use composite key with index for selection check */}
                                {selectedBooks.size > 1 && selectedBooks.has(`${draggedFromColumn}:${draggedBook.id}:${draggedBookIndex}`) && (
                                    <div className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold border-2 border-white">
                                        {selectedBooks.size}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {/* v4.16.0.au - Drag tooltip showing "Move to X" or "+ Copy to X" */}
                    {isDragging && draggedBook && (
                        <div
                            ref={dragTooltipRef}
                            style={{
                                position: 'fixed',
                                left: dragPosRef.current.x - 50,
                                top: dragPosRef.current.y + 80,
                                display: 'none',
                                backgroundColor: 'rgba(0, 0, 0, 0.8)',
                                color: 'white',
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '12px',
                                whiteSpace: 'nowrap',
                                pointerEvents: 'none',
                                zIndex: 10001
                            }}
                        />
                    )}

                    {/* v3.14.0.w - Overlay drop indicator using ref for direct DOM updates */}
                    <div
                        ref={indicatorRef}
                        className="drop-indicator-overlay"
                        style={{
                            display: 'none',
                            position: 'fixed',
                            height: '6px',
                            pointerEvents: 'none',
                            zIndex: 9998
                        }}
                    >
                        <div className="drop-indicator-line" style={{
                            position: 'absolute',
                            top: '2px',
                            left: 0,
                            right: 0,
                            height: '2px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '1px'
                        }} />
                        <div className="drop-indicator-dot" style={{
                            position: 'absolute',
                            top: 0,
                            left: '-3px',
                            width: '6px',
                            height: '6px',
                            backgroundColor: '#3b82f6',
                            borderRadius: '50%'
                        }} />
                    </div>

                    {/* v4.16.0.l - Toast notification that animates to footer */}
                    {/* v4.16.0.m - Position above last clicked book, ease-in animation */}
                    {toastVisible && (
                        <div className={`clipboard-toast ${toastAnimating ? 'animating' : ''}`}
                             style={toastAnimating ? {
                                 left: '16px',
                                 top: 'calc(100vh - 22px)',
                                 transform: 'none'
                             } : {
                                 left: `${toastPosition.x}px`,
                                 top: `${toastPosition.y - 40}px`,
                                 transform: 'translateX(-50%)'
                             }}>
                            {clipboardMessage}
                        </div>
                    )}

                    {/* v5.0.0-alpha.98 - Book folder tooltip (All Books view only) */}
                    {bookTooltip && selectedFolderId === '__all__' && (() => {
                        const containingFolders = getFoldersContainingBook(bookTooltip.bookId);
                        if (containingFolders.length === 0) return null;

                        return (
                            <div
                                className="fixed bg-white border border-gray-300 shadow-lg rounded px-3 py-2 text-sm z-50"
                                style={{
                                    left: `${bookTooltip.x + 220}px`,
                                    top: `${bookTooltip.y}px`,
                                    maxWidth: '300px'
                                }}
                                onMouseEnter={() => {
                                    // v5.0.0-alpha.132 - Cancel hide timeout when cursor enters tooltip
                                    if (tooltipHideTimeoutRef.current) {
                                        clearTimeout(tooltipHideTimeoutRef.current);
                                        tooltipHideTimeoutRef.current = null;
                                    }
                                }}
                                onMouseLeave={() => {
                                    // v5.0.0-alpha.132 - Hide immediately when leaving tooltip
                                    if (tooltipHideTimeoutRef.current) {
                                        clearTimeout(tooltipHideTimeoutRef.current);
                                        tooltipHideTimeoutRef.current = null;
                                    }
                                    setBookTooltip(null);
                                }}>
                                <div className="font-semibold text-gray-700 mb-1">Found in:</div>
                                <div className="flex flex-col gap-1">
                                    {containingFolders.map(folder => (
                                        <button
                                            key={folder.id}
                                            onClick={() => {
                                                navigateToFolder(folder.id);
                                                setBookTooltip(null);
                                            }}
                                            className="text-left text-blue-600 hover:text-blue-800 hover:underline">
                                            {folder.id === '__inbox__' ? '📥 ' : '📁 '}{folder.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        );
                    })()}

                    {/* v5.0.0-alpha.133 - Folder context menu (left panel) */}
                    {folderContextMenu && (() => {
                        const folder = folders.find(f => f.id === folderContextMenu.folderId);
                        if (!folder) return null;

                        const isSpecialFolder = ['__all__', '__inbox__', '__my__'].includes(folder.id);
                        const hasChildren = folders.some(f => f.parentId === folder.id);
                        const hasBooks = folder.bookIds && folder.bookIds.length > 0;

                        // v5.0.0-alpha.135 - Helper: Check if targetId is a descendant of folderId
                        const isDescendantOf = (targetId, ancestorId) => {
                            if (!targetId || !ancestorId) return false;
                            let current = folders.find(f => f.id === targetId);
                            while (current) {
                                if (current.id === ancestorId) return true;
                                current = folders.find(f => f.id === current.parentId);
                            }
                            return false;
                        };

                        // v5.0.0-alpha.135 - Helper: Move folder to new parent
                        const moveFolder = (folderId, targetParentId) => {
                            const folderToMove = folders.find(f => f.id === folderId);
                            if (!folderToMove) return;

                            // Prevent circular reference
                            if (targetParentId && (targetParentId === folderId || isDescendantOf(targetParentId, folderId))) {
                                alert("Cannot move folder into itself or its descendants");
                                return;
                            }

                            // Check for large moves
                            const getAllDescendants = (fid) => {
                                const children = folders.filter(f => f.parentId === fid);
                                let descendants = [...children];
                                children.forEach(child => {
                                    descendants = [...descendants, ...getAllDescendants(child.id)];
                                });
                                return descendants;
                            };
                            const descendants = getAllDescendants(folderId);
                            if (descendants.length > 20) {
                                if (!window.confirm(`Move folder with ${descendants.length} subfolders?`)) {
                                    return;
                                }
                            }

                            const oldParentId = folderToMove.parentId;

                            // Record undo
                            recordAction({
                                type: 'MOVE_FOLDER',
                                folderId: folderId,
                                oldParentId: oldParentId,
                                newParentId: targetParentId
                            });

                            // Update folder's parent
                            setFolders(prev => prev.map(f =>
                                f.id === folderId ? { ...f, parentId: targetParentId } : f
                            ));

                            setFolderContextMenu(null);
                            setContextSubmenu(null);

                            const targetFolder = folders.find(f => f.id === targetParentId);
                            const targetName = targetFolder?.name || 'Root';
                            console.log(`📁 Moved "${folderToMove.name}" to "${targetName}"`);
                        };

                        // v5.0.0-alpha.144 - Viewport-aware positioning
                        const menuWidth = 200;
                        const menuHeight = 400; // Approximate max height
                        let menuX = folderContextMenu.x;
                        let menuY = folderContextMenu.y;

                        // Adjust if off-screen right
                        if (menuX + menuWidth > window.innerWidth) {
                            menuX = window.innerWidth - menuWidth - 10;
                        }

                        // Adjust if off-screen bottom
                        if (menuY + menuHeight > window.innerHeight) {
                            menuY = window.innerHeight - menuHeight - 10;
                        }

                        // Ensure not off-screen left/top
                        menuX = Math.max(10, menuX);
                        menuY = Math.max(10, menuY);

                        return (
                            <div
                                className="fixed bg-white border border-gray-300 shadow-lg rounded z-50 py-1 min-w-[200px]"
                                style={{
                                    left: `${menuX}px`,
                                    top: `${menuY}px`
                                }}
                                onClick={(e) => e.stopPropagation()}>

                                {/* Open */}
                                <div
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                    onClick={() => {
                                        navigateToFolder(folder.id);
                                        setFolderContextMenu(null);
                                    }}>
                                    <span>📂</span>
                                    <span>Open</span>
                                </div>

                                {/* Rename */}
                                {!isSpecialFolder && (
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                        onClick={() => {
                                            setEditingFolderId(folder.id);
                                            setEditingFolderName(folder.name);
                                            setFolderContextMenu(null);
                                        }}>
                                        <span>✏️</span>
                                        <span>Rename</span>
                                        <span className="ml-auto text-gray-400 text-xs">F2</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 my-1"></div>

                                {/* Move to - v5.0.0-alpha.137 */}
                                {!isSpecialFolder && (
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3 relative"
                                        onMouseEnter={() => setContextSubmenu('move-to')}
                                        onMouseLeave={(e) => {
                                            // v5.0.0-alpha.140 - Increased timeout to 600ms for slower mouse movement
                                            setTimeout(() => {
                                                const activeElement = document.querySelector('.context-submenu:hover');
                                                if (!activeElement) {
                                                    setContextSubmenu(null);
                                                }
                                            }, 600);
                                        }}>
                                        <span>➡️</span>
                                        <span>Move to</span>
                                        <span className="ml-auto">▶</span>

                                        {/* Submenu */}
                                        {contextSubmenu === 'move-to' && (() => {
                                            // v5.0.0-alpha.138 - Use top-level state for expanded folders
                                            const toggleExpand = (folderId, e) => {
                                                e.stopPropagation();
                                                setSubmenuExpandedFolders(prev => {
                                                    const next = new Set(prev);
                                                    if (next.has(folderId)) {
                                                        next.delete(folderId);
                                                    } else {
                                                        next.add(folderId);
                                                    }
                                                    return next;
                                                });
                                            };

                                            // Build folder tree with collapse/expand
                                            const buildFolderTree = (parentId, depth = 0) => {
                                                return folders
                                                    .filter(f => f.parentId === parentId && f.id !== folder.id && !isDescendantOf(f.id, folder.id))
                                                    .map(f => {
                                                        const hasChildren = folders.some(child =>
                                                            child.parentId === f.id &&
                                                            child.id !== folder.id &&
                                                            !isDescendantOf(child.id, folder.id)
                                                        );
                                                        const isExpanded = submenuExpandedFolders.has(f.id);

                                                        return (
                                                            <React.Fragment key={f.id}>
                                                                <div
                                                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                                                    style={{ paddingLeft: `${8 + depth * 16}px` }}>
                                                                    {/* Chevron */}
                                                                    <span
                                                                        className="w-4 text-center cursor-pointer select-none"
                                                                        onClick={(e) => hasChildren && toggleExpand(f.id, e)}>
                                                                        {hasChildren ? (isExpanded ? '▼' : '▶') : ' '}
                                                                    </span>
                                                                    {/* Folder icon and name */}
                                                                    <div
                                                                        className="flex items-center gap-2 flex-1"
                                                                        onClick={(e) => {
                                                                            e.stopPropagation();
                                                                            moveFolder(folder.id, f.id);
                                                                        }}>
                                                                        <span>{f.id === folder.parentId ? '✓' : '📁'}</span>
                                                                        <span>{f.name}</span>
                                                                    </div>
                                                                </div>
                                                                {/* Children only if expanded */}
                                                                {hasChildren && isExpanded && buildFolderTree(f.id, depth + 1)}
                                                            </React.Fragment>
                                                        );
                                                    });
                                            };

                                            // v5.0.0-alpha.139 - Removed hooks (useRef/useEffect) from conditional render
                                            // TODO: Add viewport boundary detection properly later
                                            return (
                                                <div
                                                    className="context-submenu absolute left-full top-0 ml-1 bg-white border border-gray-300 shadow-lg rounded py-1 min-w-[400px] max-h-[400px] overflow-y-auto"
                                                    onMouseEnter={() => setContextSubmenu('move-to')}
                                                    onMouseLeave={() => setContextSubmenu(null)}
                                                    onClick={(e) => e.stopPropagation()}>

                                                    {/* Root option */}
                                                    <div
                                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            moveFolder(folder.id, null);
                                                        }}>
                                                        <span className="w-4"></span>
                                                        <span>{folder.parentId === null ? '✓' : '📁'}</span>
                                                        <span>Root</span>
                                                    </div>

                                                    {/* Folder tree */}
                                                    {buildFolderTree(null)}
                                                </div>
                                            );
                                        })()}
                                    </div>
                                )}

                                {/* Create Subfolder */}
                                <div
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                    onClick={() => {
                                        const newFolder = {
                                            id: `folder-${Date.now()}`,
                                            name: 'New Subfolder',
                                            parentId: folder.id,
                                            bookIds: [],
                                            childFolderIds: [],
                                            collapsed: false
                                        };
                                        recordAction({
                                            type: 'CREATE_FOLDER',
                                            folderId: newFolder.id,
                                            parentId: folder.id,
                                            folder: { ...newFolder }
                                        });
                                        setFolders(prev => [
                                            ...prev.map(f => f.id === folder.id ? { ...f, collapsed: false } : f),
                                            newFolder
                                        ]);
                                        navigateToFolder(newFolder.id);
                                        setEditingFolderId(newFolder.id);
                                        setEditingFolderName('New Subfolder');
                                        setIsPlaceholderMode(true); // v5.0.0-alpha.134 - Show as placeholder
                                        setFolderContextMenu(null);
                                    }}>
                                    <span>➕</span>
                                    <span>Create Subfolder</span>
                                </div>

                                <div className="border-t border-gray-200 my-1"></div>

                                {/* Cut - v5.0.0-alpha.141 */}
                                {!isSpecialFolder && (
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                        onClick={() => {
                                            setFolderClipboard({ items: [folder.id], operation: 'cut' });
                                            setFolderContextMenu(null);
                                            console.log(`✂️ Cut folder "${folder.name}"`);
                                        }}>
                                        <span>✂️</span>
                                        <span>Cut</span>
                                        <span className="ml-auto text-xs">Ctrl+X</span>
                                    </div>
                                )}

                                {/* Copy - v5.0.0-alpha.141 */}
                                {!isSpecialFolder && (
                                    <div
                                        className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                        onClick={() => {
                                            setFolderClipboard({ items: [folder.id], operation: 'copy' });
                                            setFolderContextMenu(null);
                                            console.log(`📋 Copied folder "${folder.name}"`);
                                        }}>
                                        <span>📋</span>
                                        <span>Copy</span>
                                        <span className="ml-auto text-xs">Ctrl+C</span>
                                    </div>
                                )}

                                {/* Paste - v5.0.0-alpha.141 */}
                                {!isSpecialFolder && (
                                    <div
                                        className={`px-4 py-2 flex items-center gap-3 ${
                                            folderClipboard.items.length > 0
                                                ? 'hover:bg-gray-100 cursor-pointer'
                                                : 'text-gray-400 cursor-not-allowed'
                                        }`}
                                        onClick={() => {
                                            if (folderClipboard.items.length === 0) return;

                                            const folderId = folderClipboard.items[0];
                                            const folderToPaste = folders.find(f => f.id === folderId);
                                            if (!folderToPaste) {
                                                setFolderClipboard({ items: [], operation: null });
                                                setFolderContextMenu(null);
                                                return;
                                            }

                                            // Prevent circular reference
                                            const isDescendantOf = (targetId, ancestorId) => {
                                                if (!targetId || !ancestorId) return false;
                                                let current = folders.find(f => f.id === targetId);
                                                while (current) {
                                                    if (current.id === ancestorId) return true;
                                                    current = folders.find(f => f.parentId === current.id);
                                                }
                                                return false;
                                            };
                                            if (folder.id === folderId || isDescendantOf(folder.id, folderId)) {
                                                alert("Cannot paste folder into itself or its descendants");
                                                setFolderContextMenu(null);
                                                return;
                                            }

                                            if (folderClipboard.operation === 'cut') {
                                                // Move folder
                                                const oldParentId = folderToPaste.parentId;
                                                recordAction({
                                                    type: 'CUT_PASTE_FOLDER',
                                                    folderId: folderId,
                                                    oldParentId: oldParentId,
                                                    newParentId: folder.id
                                                });
                                                setFolders(prev => prev.map(f =>
                                                    f.id === folderId ? { ...f, parentId: folder.id } : f
                                                ));
                                                setFolderClipboard({ items: [], operation: null });
                                                console.log(`📌 Pasted (moved) "${folderToPaste.name}" into "${folder.name}"`);
                                            } else if (folderClipboard.operation === 'copy') {
                                                // Copy folder with deep copy
                                                const copyFolderRecursive = (sourceFolderId, newParentId) => {
                                                    const sourceFolder = folders.find(f => f.id === sourceFolderId);
                                                    if (!sourceFolder) return null;

                                                    // Create copy with new ID
                                                    const newId = '__folder__' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                                                    const newFolder = {
                                                        ...sourceFolder,
                                                        id: newId,
                                                        name: sourceFolder.name + ' (Copy)',
                                                        parentId: newParentId,
                                                        created: Date.now()
                                                    };

                                                    // Find children and copy recursively
                                                    const children = folders.filter(f => f.parentId === sourceFolderId);
                                                    return { folder: newFolder, children: children.map(child => copyFolderRecursive(child.id, newId)) };
                                                };

                                                const copyTree = copyFolderRecursive(folderId, folder.id);
                                                if (copyTree) {
                                                    const flattenCopyTree = (tree) => {
                                                        const result = [tree.folder];
                                                        tree.children.forEach(child => {
                                                            if (child) result.push(...flattenCopyTree(child));
                                                        });
                                                        return result;
                                                    };
                                                    const newFolders = flattenCopyTree(copyTree);

                                                    recordAction({
                                                        type: 'COPY_PASTE_FOLDER',
                                                        newFolderIds: newFolders.map(f => f.id),
                                                        parentId: folder.id
                                                    });

                                                    setFolders(prev => [...prev, ...newFolders]);
                                                    console.log(`📋 Pasted (copied) "${folderToPaste.name}" into "${folder.name}"`);
                                                }
                                            }
                                            setFolderContextMenu(null);
                                        }}>
                                        <span>📌</span>
                                        <span>Paste</span>
                                        <span className="ml-auto text-xs">Ctrl+V</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 my-1"></div>

                                {/* Delete Folder */}
                                {!isSpecialFolder && (
                                    <div
                                        className="px-4 py-2 hover:bg-red-50 cursor-pointer flex items-center gap-3 text-red-600"
                                        onClick={() => {
                                            setFolderContextMenu(null);
                                            if (window.confirm(`Delete folder "${folder.name}"?`)) {
                                                const getAllDescendants = (folderId, allFolders) => {
                                                    const children = allFolders.filter(f => f.parentId === folderId);
                                                    let descendants = [...children];
                                                    children.forEach(child => {
                                                        descendants = [...descendants, ...getAllDescendants(child.id, allFolders)];
                                                    });
                                                    return descendants;
                                                };
                                                const descendants = getAllDescendants(folder.id, folders);
                                                const foldersToDelete = [folder, ...descendants];
                                                const folderIdsToDelete = new Set(foldersToDelete.map(f => f.id));
                                                const folderIndices = foldersToDelete.map(f => folders.findIndex(x => x.id === f.id));

                                                const destinationId = folder.parentId || '__inbox__';
                                                const destinationFolder = folders.find(f => f.id === destinationId);
                                                const destinationName = destinationFolder?.name || 'Inbox';

                                                const allOrphanedBookIds = foldersToDelete.flatMap(f => f.bookIds || []);
                                                const uniqueOrphanedBookIds = [...new Set(allOrphanedBookIds)];

                                                recordAction({
                                                    type: 'DELETE_FOLDERS',
                                                    deletedFolders: foldersToDelete.map(f => ({ ...f })),
                                                    folderIndices: folderIndices,
                                                    movedBooks: uniqueOrphanedBookIds.map(bookId => ({
                                                        bookId,
                                                        fromFolderId: foldersToDelete.find(f => f.bookIds?.includes(bookId))?.id,
                                                        toFolderId: destinationId
                                                    }))
                                                });

                                                setFolders(prev => prev
                                                    .filter(f => !folderIdsToDelete.has(f.id))
                                                    .map(f => {
                                                        if (f.id === destinationId) {
                                                            return {
                                                                ...f,
                                                                bookIds: [...(f.bookIds || []), ...uniqueOrphanedBookIds]
                                                            };
                                                        }
                                                        return f;
                                                    })
                                                );

                                                if (selectedFolderId && folderIdsToDelete.has(selectedFolderId)) {
                                                    navigateToFolder(destinationId);
                                                }

                                                console.log(`🗑️ Deleted "${folder.name}" and ${descendants.length} descendant(s), moved ${uniqueOrphanedBookIds.length} book(s) to "${destinationName}"`);
                                            }
                                        }}>
                                        <span>🗑️</span>
                                        <span>Delete Folder</span>
                                    </div>
                                )}

                                <div className="border-t border-gray-200 my-1"></div>

                                {/* Folder Properties - v5.0.0-alpha.142 */}
                                <div
                                    className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-3"
                                    onClick={() => {
                                        setFolderPropertiesEditedName(folder.name); // v5.0.0-alpha.143 - Initialize edited name
                                        setFolderPropertiesDialog({ folderId: folder.id });
                                        // v5.0.0-alpha.144 - Initialize dialog position (centered)
                                        setDialogDrag({
                                            isDragging: false,
                                            offsetX: 0,
                                            offsetY: 0,
                                            dialogX: window.innerWidth / 2 - 224, // 224 = half of max-w-md (448px)
                                            dialogY: window.innerHeight / 2 - 200 // Approximate half height
                                        });
                                        setFolderContextMenu(null);
                                    }}>
                                    <span>ℹ️</span>
                                    <span>Folder Properties</span>
                                </div>
                            </div>
                        );
                    })()}

                    {/* Folder Properties Dialog - v5.0.0-alpha.142 */}
                    {folderPropertiesDialog && (() => {
                        const folder = folders.find(f => f.id === folderPropertiesDialog.folderId);
                        if (!folder) return null;

                        const isSpecialFolder = ['__all__', '__inbox__', '__library__'].includes(folder.id);

                        // Calculate folder statistics
                        const getAllDescendantIds = (folderId) => {
                            const children = folders.filter(f => f.parentId === folderId);
                            let allIds = children.map(c => c.id);
                            children.forEach(child => {
                                allIds = [...allIds, ...getAllDescendantIds(child.id)];
                            });
                            return allIds;
                        };

                        // v5.0.0-alpha.144 - Fix: Use folder.bookIds, not b.folderIds
                        const getAllBooksInFolder = (folderId) => {
                            const bookIds = getFolderBookIds(folderId);
                            return books.filter(b => bookIds.includes(b.id));
                        };

                        const directChildren = folders.filter(f => f.parentId === folder.id);
                        const allDescendantIds = getAllDescendantIds(folder.id);
                        const directBooks = getAllBooksInFolder(folder.id);
                        const totalBooks = directBooks.length;
                        const ownedBooks = directBooks.filter(b => !b.onWishlist).length;
                        const wishlistBooks = directBooks.filter(b => b.onWishlist).length;

                        // Calculate recursive total
                        const recursiveBookIds = new Set();
                        [folder.id, ...allDescendantIds].forEach(fid => {
                            getAllBooksInFolder(fid).forEach(b => recursiveBookIds.add(b.id));
                        });
                        const recursiveTotalBooks = recursiveBookIds.size;

                        // v5.0.0-alpha.143 - Use top-level state for edited name to avoid hooks violation
                        const handleSave = () => {
                            if (!folderPropertiesEditedName.trim()) {
                                alert('Folder name cannot be empty');
                                return;
                            }

                            // Check for duplicate names at same level
                            const siblings = folders.filter(f => f.parentId === folder.parentId && f.id !== folder.id);
                            if (siblings.some(f => f.name === folderPropertiesEditedName.trim())) {
                                alert('A folder with this name already exists at this level');
                                return;
                            }

                            // Update folder - v5.0.0-alpha.144: Removed modified timestamp (not tracked)
                            setFolders(prev => prev.map(f =>
                                f.id === folder.id ? { ...f, name: folderPropertiesEditedName.trim() } : f
                            ));

                            setFolderPropertiesDialog(null);
                            console.log(`💾 Updated folder "${folder.name}" → "${folderPropertiesEditedName.trim()}"`);
                        };

                        return (
                            <>
                                {/* Backdrop */}
                                <div
                                    className="fixed inset-0 bg-black bg-opacity-50 z-50"
                                    onClick={() => setFolderPropertiesDialog(null)}
                                />

                                {/* Dialog - v5.0.0-alpha.144: Draggable */}
                                <div
                                    className="bg-white rounded-lg shadow-xl w-full max-w-md pointer-events-auto fixed z-50"
                                    style={{
                                        left: `${dialogDrag?.dialogX || 0}px`,
                                        top: `${dialogDrag?.dialogY || 0}px`,
                                        cursor: dialogDrag?.isDragging ? 'grabbing' : 'default'
                                    }}
                                    onClick={(e) => e.stopPropagation()}>
                                    <h2
                                        className="text-xl font-semibold mb-4 p-6 pb-0 cursor-grab active:cursor-grabbing select-none"
                                        onMouseDown={(e) => {
                                            const rect = e.currentTarget.parentElement.getBoundingClientRect();
                                            setDialogDrag({
                                                isDragging: true,
                                                offsetX: e.clientX - rect.left,
                                                offsetY: e.clientY - rect.top,
                                                dialogX: rect.left,
                                                dialogY: rect.top
                                            });
                                        }}>
                                        Folder Properties
                                    </h2>
                                    <div className="px-6 pb-6">

                                        {/* Name */}
                                        <div className="mb-4">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                                            {isSpecialFolder ? (
                                                <div className="px-3 py-2 bg-gray-100 border border-gray-300 rounded text-gray-700">
                                                    {folder.name}
                                                    <span className="ml-2 text-xs text-gray-500">(System folder)</span>
                                                </div>
                                            ) : (
                                                <input
                                                    type="text"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                                                    value={folderPropertiesEditedName}
                                                    onChange={(e) => setFolderPropertiesEditedName(e.target.value)}
                                                    autoFocus
                                                />
                                            )}
                                        </div>

                                        {/* Statistics - v5.0.0-alpha.144: Removed created/modified dates */}
                                        <div className="border-t border-gray-200 pt-4 mb-4 space-y-2 text-sm">
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Books:</span>
                                                <span className="text-gray-900">
                                                    {totalBooks} total ({ownedBooks} owned, {wishlistBooks} wishlist)
                                                </span>
                                            </div>
                                            <div className="flex justify-between">
                                                <span className="text-gray-600">Subfolders:</span>
                                                <span className="text-gray-900">{directChildren.length}</span>
                                            </div>
                                            {allDescendantIds.length > 0 && (
                                                <div className="flex justify-between">
                                                    <span className="text-gray-600">Total books (recursive):</span>
                                                    <span className="text-gray-900">{recursiveTotalBooks}</span>
                                                </div>
                                            )}
                                        </div>

                                        {/* Buttons */}
                                        <div className="flex gap-2 justify-end">
                                            <button
                                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-100"
                                                onClick={() => setFolderPropertiesDialog(null)}>
                                                Cancel
                                            </button>
                                            {!isSpecialFolder && (
                                                <button
                                                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                                                    onClick={handleSave}>
                                                    Save
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </>
                        );
                    })()}

                    {/* Affiliate Disclosure Footer (v4.4.0) */}
                    {/* v4.16.0.j - Restructured to include clipboard message on left */}
                    <div className="fixed bottom-0 left-0 right-0 bg-gray-100 border-t border-gray-200 py-1 px-4 text-xs text-gray-500 z-40 flex items-center justify-between">
                        {/* Left: Clipboard and Selection status (v4.16.0.n - clipboard first for toast target) */}
                        <div className="text-left flex items-center gap-3">
                            {/* Clipboard (always leftmost for toast animation target) */}
                            {/* v4.16.0.o - Only show when footerClipboardVisible (after toast lands) */}
                            {clipboardMessage && footerClipboardVisible && (
                                <span className="flex items-center gap-1">
                                    {clipboardMessage}
                                    <button
                                        onClick={() => {
                                            setClipboard(null);
                                            setClipboardMessage(null);
                                            setToastVisible(false);
                                            setToastAnimating(false);
                                            setFooterClipboardVisible(false);
                                        }}
                                        className="ml-1 text-gray-400 hover:text-gray-600"
                                        title="Clear clipboard (or press Escape)"
                                        style={{ fontSize: '14px', lineHeight: '1' }}
                                    >✕</button>
                                </span>
                            )}
                            {/* Separator when both present */}
                            {clipboardMessage && footerClipboardVisible && selectedBooks.size > 0 && <span className="text-gray-400">•</span>}
                            {/* Selection count */}
                            {selectedBooks.size > 0 && (
                                <span className="flex items-center gap-1">
                                    {selectedBooks.size} book{selectedBooks.size !== 1 ? 's' : ''} selected
                                    <button
                                        onClick={() => clearSelection()}
                                        className="ml-1 text-gray-400 hover:text-gray-600"
                                        title="Clear selection (or press Escape)"
                                        style={{ fontSize: '14px', lineHeight: '1' }}
                                    >✕</button>
                                </span>
                            )}
                            {/* Non-breaking space when both empty to maintain layout */}
                            {!clipboardMessage && selectedBooks.size === 0 && '\u00A0'}
                        </div>
                        {/* Center: Affiliate disclosure */}
                        <div className="text-center flex-1">
                            As an Amazon Associate, I earn from qualifying purchases. | <a href="https://github.com/Ron-L/ReaderWrangler/issues" target="_blank" rel="noopener noreferrer" className="hover:text-gray-700" title="Report issues or request features">Feedback</a> | <a href="security.html" className="hover:text-gray-700" title="Security & Privacy information">Security</a>
                        </div>
                        {/* Right: Build version */}
                        <div className="text-right">
                            Build v{ORGANIZER_VERSION}
                        </div>
                    </div>
                </div>
            );
        }

        ReactDOM.render(<ReaderWrangler />, document.getElementById('root'));
