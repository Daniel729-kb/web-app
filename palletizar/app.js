// Palletizar Application Main Entry Point
// Coordinates all modules and initializes the application

class PalletizerApp {
    constructor() {
        this.config = PalletizerConfig;
        this.utils = PalletizerUtils;
        this.state = stateManager;
        this.engine = calculationEngine;
        this.ui = uiManager;
        this.initialized = false;
        this.memoryCleanupTimer = null;
    }
    
    // Initialize application
    async init() {
        try {
            this.utils.log.info('Starting Palletizer Application');
            
            // Check browser compatibility
            this.checkBrowserCompatibility();
            
            // Initialize UI
            await this.ui.init();
            
            // Set up memory management
            this.setupMemoryManagement();
            
            // Set up error handling
            this.setupGlobalErrorHandling();
            
            // Load initial data if any
            this.loadInitialData();
            
            // Mark as initialized
            this.initialized = true;
            
            this.utils.log.info('Palletizer Application initialized successfully');
            
            // Show welcome message
            if (this.state.getState().cartons.length === 0) {
                this.showWelcomeMessage();
            }
            
        } catch (error) {
            this.handleInitError(error);
        }
    }
    
    // Check browser compatibility
    checkBrowserCompatibility() {
        const requiredFeatures = [
            'localStorage',
            'sessionStorage',
            'Promise',
            'fetch',
            'Map',
            'Set'
        ];
        
        const missingFeatures = requiredFeatures.filter(feature => {
            try {
                return !window[feature];
            } catch {
                return true;
            }
        });
        
        if (missingFeatures.length > 0) {
            throw new Error(`Your browser is missing required features: ${missingFeatures.join(', ')}`);
        }
        
        this.utils.log.info('Browser compatibility check passed');
    }
    
    // Set up memory management
    setupMemoryManagement() {
        // Clear old cleanup timer if exists
        if (this.memoryCleanupTimer) {
            clearInterval(this.memoryCleanupTimer);
        }
        
        // Set up periodic memory cleanup
        this.memoryCleanupTimer = setInterval(() => {
            this.performMemoryCleanup();
        }, this.config.performance.MEMORY_CLEANUP_INTERVAL);
        
        // Clean up on page unload
        window.addEventListener('beforeunload', () => {
            this.cleanup();
        });
        
        this.utils.log.info('Memory management initialized');
    }
    
    // Perform memory cleanup
    performMemoryCleanup() {
        this.utils.log.debug('Performing memory cleanup');
        
        // Clear calculation cache if too large
        if (this.engine.cache.size > this.config.performance.CACHE_SIZE_LIMIT / 2) {
            this.engine.clearCache();
        }
        
        // Clear old history states
        const state = this.state.getState();
        if (state.history.length > state.maxHistorySize) {
            state.history = state.history.slice(-state.maxHistorySize / 2);
        }
        
        // Check memory usage
        this.utils.performance.checkMemory();
        
        // Force garbage collection if available
        if (window.gc) {
            window.gc();
        }
    }
    
    // Set up global error handling
    setupGlobalErrorHandling() {
        // Handle uncaught errors
        window.addEventListener('error', (event) => {
            this.utils.errorHandler.handle(
                new Error(event.message),
                'Global Error'
            );
            event.preventDefault();
        });
        
        // Handle unhandled promise rejections
        window.addEventListener('unhandledrejection', (event) => {
            this.utils.errorHandler.handle(
                new Error(event.reason),
                'Unhandled Promise Rejection'
            );
            event.preventDefault();
        });
        
        this.utils.log.info('Global error handling initialized');
    }
    
    // Load initial data
    loadInitialData() {
        // Check if we should load sample data
        const urlParams = new URLSearchParams(window.location.search);
        const loadSample = urlParams.get('sample') === 'true';
        
        if (loadSample && this.state.getState().cartons.length === 0) {
            this.loadSampleData();
        }
    }
    
    // Load sample data for testing
    loadSampleData() {
        const sampleCartons = [
            { code: 'SAMPLE-A', qty: 362, weight: 6.70, l: 53.0, w: 38.5, h: 23.5 },
            { code: 'SAMPLE-B', qty: 42, weight: 7.60, l: 55.0, w: 40.0, h: 24.0 }
        ];
        
        sampleCartons.forEach(carton => {
            this.state.addCarton(carton);
        });
        
        this.utils.ui.showNotification('サンプルデータを読み込みました', 'info');
    }
    
    // Show welcome message
    showWelcomeMessage() {
        const message = `
            <div style="text-align: center; padding: 20px;">
                <h2>パレタイザーへようこそ！</h2>
                <p>カートンデータを追加して、最適なパレット配置を計算しましょう。</p>
                <p style="margin-top: 10px;">
                    <small>ヒント: Ctrl+N で新規カートン追加、Ctrl+S で計算実行</small>
                </p>
            </div>
        `;
        
        const container = document.getElementById('resultsContainer');
        if (container) {
            container.innerHTML = message;
        }
    }
    
    // Handle initialization error
    handleInitError(error) {
        console.error('Failed to initialize application:', error);
        
        const errorMessage = `
            <div style="text-align: center; padding: 50px; color: #dc2626;">
                <h2>アプリケーションの初期化に失敗しました</h2>
                <p>${error.message}</p>
                <p style="margin-top: 20px;">
                    <button onclick="location.reload()" class="btn btn-primary">
                        ページを再読み込み
                    </button>
                </p>
            </div>
        `;
        
        document.body.innerHTML = errorMessage;
    }
    
    // Clean up resources
    cleanup() {
        this.utils.log.info('Cleaning up application resources');
        
        // Clear timers
        if (this.memoryCleanupTimer) {
            clearInterval(this.memoryCleanupTimer);
        }
        
        // Save state
        this.state.saveState();
        
        // Clear cache
        this.engine.clearCache();
        
        this.utils.log.info('Application cleanup completed');
    }
    
    // Public API methods for external use
    
    // Get application version
    getVersion() {
        return '2.0.0';
    }
    
    // Get application status
    getStatus() {
        return {
            initialized: this.initialized,
            cartonCount: this.state.getState().cartons.length,
            cacheSize: this.engine.cache.size,
            isDarkMode: this.state.getState().isDarkMode
        };
    }
    
    // Export application state
    exportState() {
        return this.state.getState();
    }
    
    // Import application state
    importState(stateData) {
        try {
            // Validate state data
            if (!stateData || typeof stateData !== 'object') {
                throw new Error('Invalid state data');
            }
            
            // Import cartons
            if (Array.isArray(stateData.cartons)) {
                this.state.clearAllCartons();
                stateData.cartons.forEach(carton => {
                    this.state.addCarton(carton);
                });
            }
            
            // Import settings
            if (stateData.heightLimit) {
                this.state.setState({ heightLimit: stateData.heightLimit });
            }
            
            this.utils.ui.showNotification('データをインポートしました', 'success');
            return true;
        } catch (error) {
            this.utils.errorHandler.handle(error, 'State Import');
            return false;
        }
    }
}

// Create and initialize application
const palletizerApp = new PalletizerApp();

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        palletizerApp.init();
    });
} else {
    palletizerApp.init();
}

// Export for debugging and testing
window.PalletizerApp = palletizerApp;

// Add console message for developers
if (PalletizerConfig.DEBUG_MODE) {
    console.log('%c Palletizer Debug Mode ', 'background: #2563eb; color: white; padding: 5px 10px; border-radius: 3px;');
    console.log('Available commands:');
    console.log('- PalletizerApp.getStatus() - Get application status');
    console.log('- PalletizerApp.exportState() - Export current state');
    console.log('- PalletizerApp.importState(data) - Import state data');
}