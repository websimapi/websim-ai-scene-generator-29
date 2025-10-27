import { startAssetPlaceholderAnimation, stopAssetPlaceholderAnimation } from './promptAnimator.js';
import { getSelectedAsset } from './editor.js';

export function initializePanelManager() {
    const appContainer = document.getElementById('app-container');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const mobilePanel = document.getElementById('mobile-panel');
    const mobilePanelContent = document.getElementById('mobile-panel-content');
    const mobileLeftPanelContentContainer = document.getElementById('mobile-left-panel-content');
    const mobileRightPanelContentContainer = document.getElementById('mobile-right-panel-content');

    if (window.innerWidth <= 768) {
        // Move specific content on mobile to avoid moving unwanted elements like resize handles
        const leftPanelNodes = leftPanel.querySelectorAll('.control-group, #asset-library');
        const rightPanelNodes = rightPanel.querySelectorAll('#properties-panel-content');
        
        leftPanelNodes.forEach(child => mobileLeftPanelContentContainer.appendChild(child));
        rightPanelNodes.forEach(child => mobileRightPanelContentContainer.appendChild(child));
    }

    const updateMobilePanelContent = () => {
        if (!mobilePanel || window.innerWidth > 768) return;

        const selectedAsset = getSelectedAsset();
        
        if (selectedAsset) {
            // Show properties panel content
            mobileLeftPanelContentContainer.style.display = 'none';
            mobileRightPanelContentContainer.style.display = 'block';
        } else {
            // Show asset library content
            mobileLeftPanelContentContainer.style.display = 'block';
            mobileRightPanelContentContainer.style.display = 'none';
        }
    };

    // --- Mobile Panel Logic ---
    let isResizing = false;
    let isDragging = false; // To distinguish from tap
    let startY = 0;
    let lastY = 0;
    const toolbarHeight = 60; // From CSS
    const tapThreshold = 10; // Max pixels moved for a tap
    let initialPanelHeight = 0; // Store initial height on drag start

    const startInteraction = (e) => {
        e.preventDefault();
        startY = e.touches[0].clientY;
        lastY = startY;
        isResizing = true;
        isDragging = false;
        mobilePanel.style.transition = 'transform 0.3s ease-in-out'; // Keep smooth for taps
        document.body.style.userSelect = 'none';

        // Store initial height
        const panelRect = mobilePanel.getBoundingClientRect();
        // If panel is not visible, its height is the full window height. Use a sensible default.
        if (!mobilePanel.classList.contains('visible')) {
             initialPanelHeight = window.innerHeight * 0.5; // Default to 50vh
        } else {
             initialPanelHeight = panelRect.height;
        }
    };

    const doInteraction = (e) => {
        if (!isResizing) return;

        const currentY = e.touches[0].clientY;
        const deltaYFromStart = Math.abs(currentY - startY);

        if (deltaYFromStart > tapThreshold) {
            isDragging = true;
            mobilePanel.style.transition = 'none'; // Use direct manipulation for dragging

            // If we start dragging, make sure the panel is visible and positioned correctly for resizing
            if (!mobilePanel.classList.contains('visible')) {
                appContainer.classList.add('panel-visible');
                mobilePanel.classList.add('visible');
            }
        }
        
        if (isDragging) {
            const deltaY = startY - e.touches[0].clientY; // Total change from start
            
            let newPanelHeight = initialPanelHeight + deltaY;
            
            const minHeight = 100;
            const maxHeight = window.innerHeight - toolbarHeight - minHeight;

            newPanelHeight = Math.max(minHeight, Math.min(newPanelHeight, maxHeight));
            
            const newAppContainerHeight = window.innerHeight - toolbarHeight - newPanelHeight;

            mobilePanel.style.height = `${newPanelHeight}px`;
            appContainer.style.height = `${newAppContainerHeight}px`;
        }
    };

    const stopInteraction = (e) => {
        if (!isResizing) return;
        isResizing = false;

        if (!isDragging) { // This was a tap
            const isVisible = mobilePanel.classList.toggle('visible');
            appContainer.classList.toggle('panel-visible', isVisible);
            
            if (!isVisible) {
                // Reset heights when panel is hidden
                appContainer.style.height = '';
                mobilePanel.style.height = '';
            }
             if ('ontouchstart' in window) {
                if (isVisible) startAssetPlaceholderAnimation();
                else stopAssetPlaceholderAnimation();
            }
        }
        
        document.body.style.userSelect = '';
        mobilePanel.style.transition = 'transform 0.3s ease-in-out, height 0s';
    };
    
    if (mobilePanel) {
        const handle = mobilePanel.querySelector('.mobile-resize-handle');
        handle.addEventListener('touchstart', startInteraction, { passive: false });
        window.addEventListener('touchmove', doInteraction, { passive: false });
        window.addEventListener('touchend', stopInteraction);
        window.addEventListener('touchcancel', stopInteraction);

        // Initial setup
        updateMobilePanelContent();
        // Listen for selection changes to update panel content
        const canvas = document.getElementById('editor-canvas');
        canvas.addEventListener('mousemove', () => setTimeout(updateMobilePanelContent, 0));
        canvas.addEventListener('mousemove', () => setTimeout(updateMobilePanelContent, 0));
        document.getElementById('asset-library').addEventListener('click', () => setTimeout(updateMobilePanelContent, 0));
    }
}

