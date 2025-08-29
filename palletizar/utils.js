// Utility Functions for Palletizar
// Common helper functions and error handling

const PalletizerUtils = {
    // Logging wrapper - only logs in debug mode
    log: {
        info: function(message, ...args) {
            if (PalletizerConfig.DEBUG_MODE) {
                console.log(`[INFO] ${message}`, ...args);
            }
        },
        
        warn: function(message, ...args) {
            if (PalletizerConfig.DEBUG_MODE) {
                console.warn(`[WARN] ${message}`, ...args);
            }
        },
        
        error: function(message, ...args) {
            if (PalletizerConfig.DEBUG_MODE) {
                console.error(`[ERROR] ${message}`, ...args);
            }
        },
        
        debug: function(message, ...args) {
            if (PalletizerConfig.DEBUG_MODE) {
                console.debug(`[DEBUG] ${message}`, ...args);
            }
        },
        
        time: function(label) {
            if (PalletizerConfig.DEBUG_MODE) {
                console.time(label);
            }
        },
        
        timeEnd: function(label) {
            if (PalletizerConfig.DEBUG_MODE) {
                console.timeEnd(label);
            }
        }
    },
    
    // Error handling with user-friendly messages
    errorHandler: {
        handle: function(error, context = '') {
            const errorInfo = {
                message: error.message || 'Unknown error',
                context,
                timestamp: new Date().toISOString(),
                stack: PalletizerConfig.DEBUG_MODE ? error.stack : undefined
            };
            
            // Log error in debug mode
            PalletizerUtils.log.error(`Error in ${context}:`, errorInfo);
            
            // Show user-friendly message
            const userMessage = this.getUserMessage(error, context);
            PalletizerUtils.ui.showNotification(userMessage, 'error');
            
            // Emit error event for monitoring
            if (window.stateManager) {
                stateManager.emitChange('error', errorInfo);
            }
            
            return errorInfo;
        },
        
        getUserMessage: function(error, context) {
            // Map technical errors to user-friendly messages
            const errorMap = {
                'Network': PalletizerConfig.messages.errors.NETWORK_ERROR,
                'Invalid': PalletizerConfig.messages.errors.INVALID_INPUT,
                'Weight': PalletizerConfig.messages.errors.WEIGHT_EXCEEDED,
                'Height': PalletizerConfig.messages.errors.HEIGHT_EXCEEDED,
                'Storage': PalletizerConfig.messages.errors.STORAGE_ERROR
            };
            
            for (const [key, message] of Object.entries(errorMap)) {
                if (error.message.includes(key)) {
                    return message;
                }
            }
            
            return context ? 
                `${context}で${PalletizerConfig.messages.errors.CALCULATION_FAILED}` :
                PalletizerConfig.messages.errors.CALCULATION_FAILED;
        },
        
        // Wrap function with error handling
        wrap: function(fn, context = '') {
            return function(...args) {
                try {
                    const result = fn.apply(this, args);
                    if (result instanceof Promise) {
                        return result.catch(error => {
                            PalletizerUtils.errorHandler.handle(error, context);
                            throw error;
                        });
                    }
                    return result;
                } catch (error) {
                    PalletizerUtils.errorHandler.handle(error, context);
                    throw error;
                }
            };
        }
    },
    
    // UI utilities
    ui: {
        showNotification: function(message, type = 'info', duration = PalletizerConfig.ui.TOAST_DURATION) {
            const notification = document.createElement('div');
            notification.className = `notification notification--${type}`;
            notification.innerHTML = `
                <div class="notification__content">
                    <span class="notification__icon">${this.getNotificationIcon(type)}</span>
                    <span class="notification__message">${message}</span>
                </div>
            `;
            
            // Apply styles
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 16px 20px;
                background: ${this.getNotificationColor(type)};
                color: white;
                border-radius: 8px;
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
                z-index: 10000;
                animation: slideIn 0.3s ease;
                max-width: 400px;
                display: flex;
                align-items: center;
                gap: 12px;
            `;
            
            document.body.appendChild(notification);
            
            // Auto remove
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => {
                    document.body.removeChild(notification);
                }, 300);
            }, duration);
        },
        
        getNotificationIcon: function(type) {
            const icons = {
                'success': '✅',
                'error': '❌',
                'warning': '⚠️',
                'info': 'ℹ️'
            };
            return icons[type] || icons.info;
        },
        
        getNotificationColor: function(type) {
            const colors = {
                'success': '#10b981',
                'error': '#ef4444',
                'warning': '#f59e0b',
                'info': '#3b82f6'
            };
            return colors[type] || colors.info;
        },
        
        showLoading: function(message = '処理中...') {
            const loader = document.createElement('div');
            loader.id = 'global-loader';
            loader.className = 'loader-overlay';
            loader.innerHTML = `
                <div class="loader-content">
                    <div class="loader-spinner"></div>
                    <div class="loader-message">${message}</div>
                </div>
            `;
            
            loader.style.cssText = `
                position: fixed;
                top: 0;
                left: 0;
                right: 0;
                bottom: 0;
                background: rgba(0, 0, 0, 0.5);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 9999;
            `;
            
            document.body.appendChild(loader);
        },
        
        hideLoading: function() {
            const loader = document.getElementById('global-loader');
            if (loader) {
                loader.remove();
            }
        }
    },
    
    // Validation utilities
    validation: {
        isNumber: function(value) {
            return !isNaN(value) && isFinite(value);
        },
        
        isPositiveNumber: function(value) {
            return this.isNumber(value) && value > 0;
        },
        
        isInRange: function(value, min, max) {
            return this.isNumber(value) && value >= min && value <= max;
        },
        
        isValidDimension: function(value) {
            return this.isInRange(
                value,
                PalletizerConfig.constraints.MIN_CARTON_DIMENSION,
                PalletizerConfig.constraints.MAX_CARTON_DIMENSION
            );
        },
        
        isValidWeight: function(value) {
            return this.isPositiveNumber(value) && 
                   value <= PalletizerConfig.constraints.MAX_CARTON_WEIGHT;
        },
        
        isValidQuantity: function(value) {
            return Number.isInteger(value) && 
                   this.isInRange(
                       value,
                       PalletizerConfig.validation.MIN_QUANTITY,
                       PalletizerConfig.validation.MAX_QUANTITY
                   );
        },
        
        sanitizeInput: function(value, type = 'string') {
            if (type === 'number') {
                const num = parseFloat(value);
                return this.isNumber(num) ? num : 0;
            } else if (type === 'integer') {
                const int = parseInt(value);
                return this.isNumber(int) ? int : 0;
            } else {
                return String(value).trim();
            }
        }
    },
    
    // Calculation utilities
    calculation: {
        roundTo: function(value, decimals = PalletizerConfig.validation.DECIMAL_PRECISION) {
            return Math.round(value * Math.pow(10, decimals)) / Math.pow(10, decimals);
        },
        
        calculateVolume: function(l, w, h, quantity = 1) {
            return (l * w * h * quantity) / 1000000; // Convert to m³
        },
        
        calculateEfficiency: function(usedVolume, totalVolume) {
            if (totalVolume === 0) return 0;
            return this.roundTo((usedVolume / totalVolume) * 100);
        },
        
        calculateCenterOfGravity: function(items) {
            let totalWeight = 0;
            let weightedX = 0;
            let weightedY = 0;
            let weightedZ = 0;
            
            items.forEach(item => {
                const weight = item.weight * item.quantity;
                totalWeight += weight;
                weightedX += weight * (item.x || 0);
                weightedY += weight * (item.y || 0);
                weightedZ += weight * (item.z || 0);
            });
            
            if (totalWeight === 0) {
                return { x: 0, y: 0, z: 0 };
            }
            
            return {
                x: this.roundTo(weightedX / totalWeight),
                y: this.roundTo(weightedY / totalWeight),
                z: this.roundTo(weightedZ / totalWeight)
            };
        }
    },
    
    // Debounce function for performance
    debounce: function(func, wait = PalletizerConfig.performance.DEBOUNCE_DELAY) {
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
    
    // Format utilities
    format: {
        number: function(value, decimals = 0) {
            return value.toLocaleString('ja-JP', {
                minimumFractionDigits: decimals,
                maximumFractionDigits: decimals
            });
        },
        
        weight: function(value) {
            return `${this.number(value, 1)} kg`;
        },
        
        dimension: function(value) {
            return `${this.number(value, 1)} cm`;
        },
        
        volume: function(value) {
            return `${this.number(value, 3)} m³`;
        },
        
        percentage: function(value) {
            return `${this.number(value, 1)}%`;
        },
        
        date: function(timestamp) {
            const date = new Date(timestamp);
            return date.toLocaleDateString('ja-JP') + ' ' + date.toLocaleTimeString('ja-JP');
        }
    },
    
    // CSV utilities
    csv: {
        export: function(data, filename = 'palletizer-export.csv') {
            try {
                const csv = this.convertToCSV(data);
                const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
                const link = document.createElement('a');
                const url = URL.createObjectURL(blob);
                
                link.setAttribute('href', url);
                link.setAttribute('download', filename);
                link.style.visibility = 'hidden';
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                PalletizerUtils.ui.showNotification(
                    PalletizerConfig.messages.success.EXPORT_COMPLETE,
                    'success'
                );
            } catch (error) {
                PalletizerUtils.errorHandler.handle(error, 'CSV Export');
            }
        },
        
        convertToCSV: function(data) {
            if (!Array.isArray(data) || data.length === 0) {
                return '';
            }
            
            const headers = Object.keys(data[0]);
            const csvHeaders = headers.join(PalletizerConfig.export.CSV_DELIMITER);
            
            const csvRows = data.map(row => {
                return headers.map(header => {
                    const value = row[header];
                    // Escape quotes and wrap in quotes if contains delimiter
                    const escaped = String(value).replace(/"/g, '""');
                    return escaped.includes(PalletizerConfig.export.CSV_DELIMITER) ? 
                           `"${escaped}"` : escaped;
                }).join(PalletizerConfig.export.CSV_DELIMITER);
            });
            
            return [csvHeaders, ...csvRows].join('\n');
        },
        
        parse: function(csvText) {
            try {
                const lines = csvText.split('\n').filter(line => line.trim());
                if (lines.length < 2) {
                    throw new Error('CSV file is empty or invalid');
                }
                
                const headers = lines[0].split(PalletizerConfig.export.CSV_DELIMITER)
                                       .map(h => h.trim());
                
                const data = [];
                for (let i = 1; i < lines.length; i++) {
                    const values = lines[i].split(PalletizerConfig.export.CSV_DELIMITER)
                                          .map(v => v.trim());
                    
                    const row = {};
                    headers.forEach((header, index) => {
                        row[header] = values[index] || '';
                    });
                    data.push(row);
                }
                
                return data;
            } catch (error) {
                throw new Error(`CSV parsing failed: ${error.message}`);
            }
        }
    },
    
    // Performance monitoring
    performance: {
        startTimer: function(label) {
            if (PalletizerConfig.DEBUG_MODE) {
                performance.mark(`${label}-start`);
            }
        },
        
        endTimer: function(label) {
            if (PalletizerConfig.DEBUG_MODE) {
                performance.mark(`${label}-end`);
                performance.measure(label, `${label}-start`, `${label}-end`);
                const measure = performance.getEntriesByName(label)[0];
                PalletizerUtils.log.debug(`${label} took ${measure.duration.toFixed(2)}ms`);
                return measure.duration;
            }
            return 0;
        },
        
        checkMemory: function() {
            if (PalletizerConfig.DEBUG_MODE && performance.memory) {
                const used = performance.memory.usedJSHeapSize / 1048576;
                const total = performance.memory.totalJSHeapSize / 1048576;
                PalletizerUtils.log.debug(`Memory: ${used.toFixed(2)}MB / ${total.toFixed(2)}MB`);
            }
        }
    }
};

// Add CSS for notifications if not already present
if (!document.getElementById('palletizer-utils-styles')) {
    const style = document.createElement('style');
    style.id = 'palletizer-utils-styles';
    style.textContent = `
        @keyframes slideIn {
            from {
                transform: translateX(100%);
                opacity: 0;
            }
            to {
                transform: translateX(0);
                opacity: 1;
            }
        }
        
        @keyframes slideOut {
            from {
                transform: translateX(0);
                opacity: 1;
            }
            to {
                transform: translateX(100%);
                opacity: 0;
            }
        }
        
        .loader-spinner {
            width: 50px;
            height: 50px;
            border: 5px solid #f3f3f3;
            border-top: 5px solid #3498db;
            border-radius: 50%;
            animation: spin 1s linear infinite;
        }
        
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
        
        .loader-content {
            background: white;
            padding: 30px;
            border-radius: 10px;
            display: flex;
            flex-direction: column;
            align-items: center;
            gap: 20px;
        }
        
        .loader-message {
            font-size: 16px;
            color: #333;
        }
    `;
    document.head.appendChild(style);
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PalletizerUtils;
}