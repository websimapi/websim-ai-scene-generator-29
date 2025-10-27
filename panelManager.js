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
    let initialPanelHeight = 0; // Store initial height on drag start

    const startInteraction = (e) => {
        e.preventDefault();
        startY = e.touches[0].clientY;
        lastY = startY;
        startTime = Date.now();
        isResizing = true;
        isDragging = false;
        mobilePanel.style.transition = 'none'; // Use direct manipulation, no animations
        document.body.style.userSelect = 'none';

        // Store initial height
        const panelRect = mobilePanel.getBoundingClientRect();
        if (!mobilePanel.classList.contains('visible')) {
             initialPanelHeight = window.innerHeight * 0.5; // Default to 50vh
        } else {
             initialPanelHeight = panelRect.height;
        }
    };

    const doInteraction = (e) => {
        if (!isResizing) return;

        const currentY = e.touches[0].clientY;
        const deltaY = startY - currentY; // Upward movement is positive

        // Any movement is considered a drag
        if (Math.abs(currentY - startY) > 5) { // Small threshold to prevent accidental drags
            isDragging = true;
        }

        if (isDragging) {
            if (!mobilePanel.classList.contains('visible')) {
                // If panel is hidden, we translate it up first.
                const handleHeight = 30; // From CSS
                let translateY = Math.max(0, initialPanelHeight - handleHeight - deltaY);
                
                if (translateY === 0) {
                    // Transitioned from translating to resizing
                    mobilePanel.classList.add('visible');
                    appContainer.classList.add('panel-visible');
                    mobilePanel.style.transform = ''; // Clear transform
                    // Adjust startY to correctly calculate height from this point
                    startY = currentY;
                    initialPanelHeight = handleHeight;
                } else {
                     mobilePanel.style.transform = `translateY(${translateY}px)`;
                }

            } else {
                // Panel is visible, resize its height
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

        if (isDragging) { // This was a drag
            const endY = e.changedTouches[0].clientY;
            const deltaTime = Date.now() - startTime;
            const deltaY = endY - startY;
            const velocityY = deltaTime > 0 ? deltaY / deltaTime : 0; // pixels per millisecond

            const currentPanelHeight = mobilePanel.offsetHeight;
            const isFastSwipeDown = velocityY > 0.7; // A reasonably fast downward flick
            const isDraggedDownFar = currentPanelHeight < (window.innerHeight * 0.25) && mobilePanel.classList.contains('visible');
            const isStillMostlyHidden = !mobilePanel.classList.contains('visible');

            if (isFastSwipeDown || isDraggedDownFar || isStillMostlyHidden) {
                // Hide panel
                mobilePanel.style.transition = 'transform 0.3s ease-in-out, height 0s';
                mobilePanel.classList.remove('visible');
                appContainer.classList.remove('panel-visible');
                appContainer.style.height = '';
                mobilePanel.style.height = '';
                mobilePanel.style.transform = '';

                if ('ontouchstart' in window) {
                    stopAssetPlaceholderAnimation();
                }
            }
            // Otherwise, leave the panel at its new height/position
        }
        // No 'else' block, so taps do nothing.
        
        document.body.style.userSelect = '';
        setTimeout(() => {
             mobilePanel.style.transition = 'transform 0.3s ease-in-out, height 0s';
        }, 50);
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