// utils.js - Utility Functions

const Utils = {
    // Color utilities
    colors: {
        getRandomColor: () => {
            const colors = [
                '#e74c3c', '#3498db', '#2ecc71', '#f39c12', 
                '#9b59b6', '#1abc9c', '#e67e22', '#34495e',
                '#16a085', '#27ae60', '#2980b9', '#8e44ad'
            ];
            return colors[Math.floor(Math.random() * colors.length)];
        },

        adjustColor: (color, amount) => {
            return '#' + color.replace(/^#/, '').replace(/../g, value => 
                ('0' + Math.min(255, Math.max(0, parseInt(value, 16) + amount)).toString(16)
            ).substr(-2);
        },

        getContrastColor: (hexColor) => {
            const r = parseInt(hexColor.substr(1, 2), 16);
            const g = parseInt(hexColor.substr(3, 2), 16);
            const b = parseInt(hexColor.substr(5, 2), 16);
            const brightness = (r * 299 + g * 587 + b * 114) / 1000;
            return brightness > 128 ? '#000000' : '#ffffff';
        }
    },

    // Math utilities
    math: {
        round: (value, decimals = 2) => {
            return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
        },

        clamp: (value, min, max) => {
            return Math.min(Math.max(value, min), max);
        },

        isBetween: (value, min, max) => {
            return value >= min && value <= max;
        }
    },

    // DOM utilities
    dom: {
        createElement: (tag, className, innerHTML = '') => {
            const element = document.createElement(tag);
            if (className) element.className = className;
            if (innerHTML) element.innerHTML = innerHTML;
            return element;
        },

        addClass: (element, className) => {
            if (element && !element.classList.contains(className)) {
                element.classList.add(className);
            }
        },

        removeClass: (element, className) => {
            if (element && element.classList.contains(className)) {
                element.classList.remove(className);
            }
        },

        toggleClass: (element, className) => {
            if (element) {
                element.classList.toggle(className);
            }
        }
    },

    // Validation utilities
    validation: {
        isValidDimension: (value) => {
            return !isNaN(value) && value > 0 && value <= CONFIG.UI.MAX_PALLET_DIMENSION;
        },

        isValidQuantity: (value) => {
            return !isNaN(value) && value > 0 && value <= CONFIG.UI.MAX_PALLET_QUANTITY;
        },

        isValidClearance: (value) => {
            return !isNaN(value) && value >= 0 && value <= 50;
        }
    },

    // Performance utilities
    performance: {
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        },

        throttle: (func, limit) => {
            let inThrottle;
            return function() {
                const args = arguments;
                const context = this;
                if (!inThrottle) {
                    func.apply(context, args);
                    inThrottle = true;
                    setTimeout(() => inThrottle = false, limit);
                }
            };
        }
    },

    // Storage utilities
    storage: {
        set: (key, value) => {
            try {
                localStorage.setItem(key, JSON.stringify(value));
                return true;
            } catch (e) {
                console.warn('Failed to save to localStorage:', e);
                return false;
            }
        },

        get: (key, defaultValue = null) => {
            try {
                const item = localStorage.getItem(key);
                return item ? JSON.parse(item) : defaultValue;
            } catch (e) {
                console.warn('Failed to read from localStorage:', e);
                return defaultValue;
            }
        },

        remove: (key) => {
            try {
                localStorage.removeItem(key);
                return true;
            } catch (e) {
                console.warn('Failed to remove from localStorage:', e);
                return false;
            }
        }
    },

    // Date utilities
    date: {
        formatDate: (date) => {
            return date.toISOString().slice(0, 10);
        },

        getCurrentTimestamp: () => {
            return new Date().toISOString();
        }
    },

    // Error handling
    error: {
        log: (message, error = null) => {
            console.error(`[ERROR] ${message}`, error);
        },

        warn: (message, data = null) => {
            console.warn(`[WARNING] ${message}`, data);
        },

        info: (message, data = null) => {
            console.info(`[INFO] ${message}`, data);
        }
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Utils;
}