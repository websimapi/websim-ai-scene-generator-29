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
    let startTime = 0; // To calculate velocity
    const toolbarHeight = 60; // From CSS
    const tapThreshold = 10; // Max pixels moved for a tap
    let initialPanelHeight = 0; // Store initial height on drag start
    const handleHeight = 30; // From CSS

    const startInteraction = (e) => {
        e.preventDefault();
        startY = e.touches[0].clientY;
        lastY = startY;
        startTime = Date.now();
        isResizing = true;
        isDragging = false;
        mobilePanel.style.transition = 'none'; // Direct manipulation
        document.body.style.userSelect = 'none';

        const panelRect = mobilePanel.getBoundingClientRect();
        initialPanelHeight = panelRect.height;
    };

    const doInteraction = (e) => {
        if (!isResizing) return;

        const currentY = e.touches[0].clientY;
        const deltaYFromStart = currentY - startY;

        if (Math.abs(deltaYFromStart) > tapThreshold) {
            isDragging = true;
        }
        
        if (isDragging) {
             // If panel is hidden, we control transform. If visible, we control height.
            if (!mobilePanel.classList.contains('visible')) {
                const maxTranslate = window.innerHeight - handleHeight;
                // Dragging up from bottom (deltaY will be negative)
                let newTranslate = maxTranslate + deltaYFromStart;
                
                // Clamp translation
                newTranslate = Math.max(window.innerHeight - initialPanelHeight, newTranslate);
                newTranslate = Math.min(maxTranslate, newTranslate);
                
                mobilePanel.style.transform = `translateY(${newTranslate}px)`;
                
                const visiblePortion = window.innerHeight - newTranslate;
                const newAppHeight = window.innerHeight - toolbarHeight - visiblePortion;
                appContainer.style.height = `${newAppHeight}px`;

            } else { // Panel is already visible, so we are resizing height
                const deltaY = startY - e.touches[0].clientY; // Total change from start
                let newPanelHeight = initialPanelHeight + deltaY;
                
                const minHeight = 100;
                const maxHeight = window.innerHeight - toolbarHeight - minHeight;

                newPanelHeight = Math.max(minHeight, Math.min(newPanelHeight, maxHeight));
                
                const newAppContainerHeight = window.innerHeight - toolbarHeight - newPanelHeight;

                mobilePanel.style.height = `${newPanelHeight}px`;
                appContainer.style.height = `${newAppContainerHeight}px`;
            }
        }
    };

    const stopInteraction = (e) => {
        if (!isResizing) return;
        isResizing = false;
        mobilePanel.style.transition = 'transform 0.3s ease-in-out, height 0.3s ease-in-out';

        if (isDragging) { // This was a drag
            const endY = e.changedTouches[0].clientY;
            const deltaTime = Date.now() - startTime;
            const deltaY = endY - startY;
            const velocityY = deltaTime > 0 ? deltaY / deltaTime : 0;

            if (mobilePanel.classList.contains('visible')) {
                // Logic for an already open panel
                const currentPanelHeight = mobilePanel.offsetHeight;
                const isFastSwipeDown = velocityY > 0.7;
                const isDraggedDownFar = currentPanelHeight < (window.innerHeight * 0.25);

                if (isFastSwipeDown || isDraggedDownFar) {
                    mobilePanel.classList.remove('visible');
                    appContainer.classList.remove('panel-visible');
                    appContainer.style.height = '';
                    mobilePanel.style.height = '';
                    mobilePanel.style.transform = '';
                    if ('ontouchstart' in window) {
                        stopAssetPlaceholderAnimation();
                    }
                }
            } else {
                 // Logic for a hidden panel being dragged open
                const panelRect = mobilePanel.getBoundingClientRect();
                const visibleHeight = window.innerHeight - panelRect.top;
                
                // Open if dragged more than 20% of its height, or a fast swipe up
                if (visibleHeight > initialPanelHeight * 0.2 || velocityY < -0.5) {
                    mobilePanel.classList.add('visible');
                    appContainer.classList.add('panel-visible');
                    mobilePanel.style.transform = '';
                    mobilePanel.style.height = `${initialPanelHeight}px`;
                    appContainer.style.height = `${window.innerHeight - toolbarHeight - initialPanelHeight}px`;
                    if ('ontouchstart' in window) {
                        startAssetPlaceholderAnimation();
                    }
                } else {
                    // Didn't drag far enough, snap back
                    appContainer.style.height = '';
                    mobilePanel.style.transform = '';
                }
            }
        } else { // This was a tap, do nothing
            // Snap back if it was hidden and not dragged far
             if (!mobilePanel.classList.contains('visible')) {
                mobilePanel.style.transform = '';
            }
        }
        
        document.body.style.userSelect = '';
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