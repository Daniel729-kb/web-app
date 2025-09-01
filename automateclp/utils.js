// Utility functions for AutomateCLP
// Constants and helper functions

export const CONSTANTS = {
    CONTAINER_OFFSET_X: 25,
    CONTAINER_OFFSET_Y: 35,
    CONTAINER_DISPLAY_WIDTH: 800,
    CONTAINER_DISPLAY_HEIGHT: 300,
    MIN_DRAG_MARGIN: 10,
    EPSILON: 0.01,
    ANIMATION_DELAY: 500
};

export const containers = {
    '20ft': { length: 589.8, width: 235.0, height: 235.0 },
    '40ft': { length: 1203.2, width: 235.0, height: 235.0 },
    '40HQ': { length: 1203.2, width: 235.0, height: 228.8 }
};

export const utils = {
    getCurrentClearance: (clearanceValue) => parseFloat(clearanceValue) || 1,
    
    getRandomColor: () => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    showError: (message, errorElement) => {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => { errorElement.style.display = 'none'; }, 5000);
    },
    
    showSuccess: (message, successElement) => {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => { successElement.style.display = 'none'; }, 5000);
    },
    
    adjustColor: (color, amount) => {
        return '#' + color.replace(/^#/, '').replace(/../g, value => 
            ('0' + Math.min(255, Math.max(0, parseInt(value, 16) + amount)).toString(16)).substr(-2)
        );
    },
    
    calculateScale: (container) => {
        const scaleX = CONSTANTS.CONTAINER_DISPLAY_WIDTH / container.length;
        const scaleY = CONSTANTS.CONTAINER_DISPLAY_HEIGHT / container.width;
        return Math.min(scaleX, scaleY);
    }
};

// Memory management utilities
export const memoryManager = {
    timers: new Set(),
    setTimeout: (callback, delay) => {
        const timerId = setTimeout(callback, delay);
        memoryManager.timers.add(timerId);
        return timerId;
    },
    clearTimeout: (timerId) => {
        clearTimeout(timerId);
        memoryManager.timers.delete(timerId);
    },
    clearAllTimers: () => {
        memoryManager.timers.forEach(timerId => { clearTimeout(timerId); });
        memoryManager.timers.clear();
    },
    cleanup: () => {
        memoryManager.clearAllTimers();
        if (window.allPalletsGenerated && window.allPalletsGenerated.length > 1000) {
            console.log('Large dataset detected, clearing old data...');
            window.allPalletsGenerated = window.allPalletsGenerated.slice(-500);
        }
        const unusedElements = document.querySelectorAll('.temp-element, .calculation-result');
        if (unusedElements.length > 50) {
            console.log('Clearing unused DOM elements...');
            unusedElements.forEach(el => el.remove());
        }
    }
};