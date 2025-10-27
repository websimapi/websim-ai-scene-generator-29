import { startAssetPlaceholderAnimation, stopAssetPlaceholderAnimation } from './promptAnimator.js';

export function initializePanelManager() {
    const appContainer = document.getElementById('app-container');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const mobileToggleLeft = document.getElementById('mobile-toggle-left');
    const mobileToggleRight = document.getElementById('mobile-toggle-right');
    const toggleLeftPanelBtn = document.getElementById('toggle-left-panel');
    const toggleRightPanelBtn = document.getElementById('toggle-right-panel');

    const togglePanel = (panel) => {
        const isVisible = panel.classList.contains('visible');
        // Hide all panels first
        document.querySelectorAll('#left-panel, #right-panel').forEach(p => p.classList.remove('visible'));
        // Then show the target panel if it wasn't already visible
        if (!isVisible) {
            panel.classList.add('visible');
        }

        // Add/remove class on app-container for dynamic height adjustment
        if (leftPanel.classList.contains('visible') || rightPanel.classList.contains('visible')) {
            appContainer.classList.add('panel-visible');
        } else {
            appContainer.classList.remove('panel-visible');
            // Reset styles when panels are hidden
            appContainer.style.height = '';
            leftPanel.style.height = '';
            rightPanel.style.height = '';
        }

        // Handle asset placeholder animation on mobile
        if ('ontouchstart' in window) {
            if (leftPanel.classList.contains('visible')) {
                startAssetPlaceholderAnimation();
            } else {
                stopAssetPlaceholderAnimation();
            }
        }
    };

    mobileToggleLeft.addEventListener('click', () => togglePanel(leftPanel));
    mobileToggleRight.addEventListener('click', () => togglePanel(rightPanel));
    toggleLeftPanelBtn.addEventListener('click', () => leftPanel.classList.remove('visible'));
    toggleRightPanelBtn.addEventListener('click', () => rightPanel.classList.remove('visible'));

    // --- Mobile Panel Resizing Logic ---
    let isResizing = false;
    let lastY = 0;
    let resizingPanel = null;
    const toolbarHeight = 60; // From CSS

    const startResize = (e, panel) => {
        e.preventDefault();
        isResizing = true;
        resizingPanel = panel;
        lastY = e.touches[0].clientY;
        document.body.style.userSelect = 'none'; // Prevent text selection
    };

    const doResize = (e) => {
        if (!isResizing || !resizingPanel) return;

        const currentY = e.touches[0].clientY;
        const deltaY = lastY - currentY; // Dragging up is a positive delta
        lastY = currentY;

        const panelHeight = resizingPanel.offsetHeight;
        const appContainerHeight = appContainer.offsetHeight;
        
        // Calculate new heights
        let newPanelHeight = panelHeight + deltaY;
        let newAppContainerHeight = appContainerHeight - deltaY;

        // Apply constraints
        const minHeight = 100; // Min height for both panel and canvas
        const maxHeight = window.innerHeight - toolbarHeight - minHeight;
        
        newPanelHeight = Math.max(minHeight, Math.min(newPanelHeight, maxHeight));
        newAppContainerHeight = window.innerHeight - toolbarHeight - newPanelHeight;

        // Apply styles
        resizingPanel.style.height = `${newPanelHeight}px`;
        appContainer.style.height = `${newAppContainerHeight}px`;
    };

    const stopResize = () => {
        if (!isResizing) return;
        isResizing = false;
        resizingPanel = null;
        document.body.style.userSelect = '';
    };

    document.querySelectorAll('.mobile-resize-handle').forEach(handle => {
        handle.addEventListener('touchstart', (e) => startResize(e, handle.closest('#left-panel, #right-panel')), { passive: false });
    });
    
    window.addEventListener('touchmove', doResize);
    window.addEventListener('touchend', stopResize);
    window.addEventListener('touchcancel', stopResize);
}

