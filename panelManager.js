import { startAssetPlaceholderAnimation, stopAssetPlaceholderAnimation } from './promptAnimator.js';
import { getSelectedAsset } from './editor.js';

export function initializePanelManager() {
    const appContainer = document.getElementById('app-container');
    const leftPanel = document.getElementById('left-panel');
    const rightPanel = document.getElementById('right-panel');
    const mobilePanel = document.getElementById('mobile-panel');
    const mobilePanelContent = document.getElementById('mobile-panel-content');

    if (window.innerWidth <= 768) {
        // Move content on mobile
        const leftPanelContent = Array.from(leftPanel.children);
        const rightPanelContent = Array.from(rightPanel.children);
        leftPanelContent.forEach(child => mobilePanelContent.appendChild(child));
        rightPanelContent.forEach(child => mobilePanelContent.appendChild(child));
    }

    const updateMobilePanelContent = () => {
        if (!mobilePanel || window.innerWidth > 768) return;

        const selectedAsset = getSelectedAsset();
        const leftPanelContent = mobilePanelContent.querySelectorAll('#left-panel > *, .control-group, #asset-library');
        const rightPanelContent = mobilePanelContent.querySelectorAll('#right-panel > *, #properties-panel-content');

        if (selectedAsset) {
            // Show properties panel content
            leftPanelContent.forEach(el => el.style.display = 'none');
            rightPanelContent.forEach(el => el.style.display = 'block'); // or 'flex' etc.
            // Also need to show properties panel's inner content
            document.getElementById('properties-panel-content').style.display = 'block';

        } else {
            // Show asset library content
            leftPanelContent.forEach(el => el.style.display = 'flex'); // or 'block'
            rightPanelContent.forEach(el => el.style.display = 'none');
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
        // Only trigger if the touch is on the handle itself
        if (e.target !== e.currentTarget) return;

        e.preventDefault();
        startY = e.touches[0].clientY;
        lastY = startY;
        isResizing = true;
        isDragging = false;
        mobilePanel.style.transition = 'none'; // No transition during interaction
        document.body.style.userSelect = 'none';

        // Store initial height
        const panelRect = mobilePanel.getBoundingClientRect();
        initialPanelHeight = panelRect.height;
    };

    const doInteraction = (e) => {
        if (!isResizing) return;

        const currentY = e.touches[0].clientY;
        const deltaYFromStart = Math.abs(currentY - startY);

        if (deltaYFromStart > tapThreshold) {
            isDragging = true;

            // If we start dragging a hidden panel, make it visible first
            if (!mobilePanel.classList.contains('visible')) {
                appContainer.classList.add('panel-visible');
                mobilePanel.classList.add('visible');
                // Set a sensible starting height when dragging open from collapsed state
                initialPanelHeight = window.innerHeight - startY;
            }
        }
        
        if (isDragging) {
            const deltaY = startY - e.touches[0].clientY; // Total change from start
            
            let newPanelHeight = initialPanelHeight + deltaY;
            
            const minHeight = 100;
            const maxHeight = window.innerHeight - toolbarHeight - 50; // 50px for top scene area

            newPanelHeight = Math.max(minHeight, Math.min(newPanelHeight, maxHeight));
            
            // The app container height is now controlled by CSS flexbox, so we just set panel height.
            mobilePanel.style.height = `${newPanelHeight}px`;

            // We need to adjust the app-container height for the canvas to resize correctly
            const newAppContainerHeight = window.innerHeight - toolbarHeight - newPanelHeight;
            appContainer.style.height = `${newAppContainerHeight}px`;
        }
    };

    const stopInteraction = (e) => {
        if (!isResizing) return;
        
        const wasDragging = isDragging; // Capture state before resetting
        
        isResizing = false;
        isDragging = false;
        document.body.style.userSelect = '';
        mobilePanel.style.transition = 'transform 0.3s ease-out, height 0.3s ease-out';


        if (!wasDragging) { // This was a tap
            const isVisible = mobilePanel.classList.toggle('visible');
            appContainer.classList.toggle('panel-visible', isVisible);
            
            // Reset inline styles on toggle to allow CSS to take over
            appContainer.style.height = ''; 
            mobilePanel.style.height = ''; 
            
             if ('ontouchstart' in window) {
                if (isVisible) startAssetPlaceholderAnimation();
                else stopAssetPlaceholderAnimation();
            }
        } else {
            // After dragging, if the panel is very small, auto-hide it.
            const finalHeight = mobilePanel.getBoundingClientRect().height;
            if (finalHeight < 120) {
                 mobilePanel.classList.remove('visible');
                 appContainer.classList.remove('panel-visible');
                 appContainer.style.height = '';
                 mobilePanel.style.height = '';
            }
        }
        
        document.body.style.userSelect = '';
        mobilePanel.style.transition = 'transform 0.3s ease-out, height 0.3s ease-out';
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

