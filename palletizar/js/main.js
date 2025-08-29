// ====================================
// MAIN MODULE - Application Initialization and Orchestration
// ====================================

import { 
    loadFromLocalStorage, 
    saveToLocalStorage,
    getMaxHeightLimit,
    setMaxHeightLimit 
} from './data.js';
import { 
    setupEventListeners, 
    initializePalletSelection, 
    updateTable, 
    updateSummary,
    updateHeightLimitFromInput 
} from './ui.js';

// Application initialization
function initializeApp() {
    console.log('🚀 Palletizar アプリケーション初期化開始');
    
    // Load saved data from localStorage
    const dataLoaded = loadFromLocalStorage();
    if (dataLoaded) {
        console.log('📂 ローカルストレージからデータを復元しました');
    }
    
    // Initialize height limit settings
    initializeHeightLimit();
    
    // Initialize pallet selection UI
    initializePalletSelection();
    
    // Update table and summary with current data
    updateTable();
    updateSummary();
    
    // Setup all event listeners
    setupEventListeners();
    
    // Setup auto-save
    setupAutoSave();
    
    // Setup error handling
    setupErrorHandling();
    
    // Show welcome message
    showWelcomeMessage();
    
    console.log('✅ Palletizar アプリケーション初期化完了');
}

// Initialize height limit UI
function initializeHeightLimit() {
    const input = document.getElementById('heightLimitInput');
    const display = document.getElementById('heightLimitDisplay');
    const currentLimit = getMaxHeightLimit();
    
    if (input && display) {
        input.value = currentLimit;
        display.textContent = currentLimit;
        
        // Set active preset button
        const activePreset = document.querySelector(`[onclick="setHeightLimit(${currentLimit})"]`);
        if (activePreset) {
            activePreset.classList.add('active');
        }
        
        // Show warning if necessary
        const warning = document.getElementById('heightWarning');
        if (warning && currentLimit > 180) {
            warning.classList.remove('hidden');
        }
    }
}

// Setup auto-save functionality
function setupAutoSave() {
    // Save data when the page is about to unload
    window.addEventListener('beforeunload', () => {
        saveToLocalStorage();
    });
    
    // Auto-save every 30 seconds
    setInterval(() => {
        const saved = saveToLocalStorage();
        if (saved) {
            console.log('💾 データを自動保存しました');
        }
    }, 30000);
    
    // Save on visibility change (tab switch, minimize, etc.)
    document.addEventListener('visibilitychange', () => {
        if (document.hidden) {
            saveToLocalStorage();
        }
    });
}

// Setup global error handling
function setupErrorHandling() {
    // Handle uncaught errors
    window.addEventListener('error', (event) => {
        console.error('予期しないエラーが発生しました:', event.error);
        showErrorNotification('システムエラーが発生しました。ページを再読み込みしてください。');
    });
    
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
        console.error('未処理のPromiseエラー:', event.reason);
        showErrorNotification('処理中にエラーが発生しました。');
        event.preventDefault();
    });
}

// Show welcome message for new users
function showWelcomeMessage() {
    const hasShownWelcome = localStorage.getItem('palletizar_welcome_shown');
    
    if (!hasShownWelcome) {
        setTimeout(() => {
            const welcomeDiv = document.createElement('div');
            welcomeDiv.className = 'alert alert-info';
            welcomeDiv.innerHTML = `
                🎉 <strong>Palletizar へようこそ！</strong><br>
                このアプリケーションは貨物の最適なパレット配置を計算します。<br>
                <small>まずは「📄 CSVインポート」でデータを追加するか、「➕ 新規追加」で個別に貨物を登録してください。</small>
                <button onclick="this.parentElement.remove()" style="float: right; background: none; border: none; font-size: 16px; cursor: pointer;">×</button>
            `;
            
            const errorsDiv = document.getElementById('errors');
            if (errorsDiv) {
                errorsDiv.appendChild(welcomeDiv);
            }
            
            localStorage.setItem('palletizar_welcome_shown', 'true');
        }, 1000);
    }
}

// Show error notification
function showErrorNotification(message) {
    const errorDiv = document.createElement('div');
    errorDiv.className = 'alert alert-error';
    errorDiv.innerHTML = `⚠️ ${message}`;
    
    const errorsDiv = document.getElementById('errors');
    if (errorsDiv) {
        errorsDiv.appendChild(errorDiv);
        
        // Auto-remove after 5 seconds
        setTimeout(() => {
            if (errorDiv.parentElement) {
                errorDiv.remove();
            }
        }, 5000);
    }
}

// Handle performance monitoring
function setupPerformanceMonitoring() {
    // Monitor calculation performance
    const originalCalculate = window.calculateImprovedPalletization;
    if (originalCalculate) {
        window.calculateImprovedPalletization = function() {
            const startTime = performance.now();
            const result = originalCalculate.apply(this, arguments);
            const endTime = performance.now();
            
            console.log(`⏱️ パレタイズ計算時間: ${(endTime - startTime).toFixed(2)}ms`);
            
            return result;
        };
    }
}

// Application health check
function healthCheck() {
    const checks = [
        { name: 'DOM要素', test: () => document.getElementById('container') !== null },
        { name: 'データモジュール', test: () => typeof loadFromLocalStorage === 'function' },
        { name: 'UIモジュール', test: () => typeof setupEventListeners === 'function' },
        { name: 'ローカルストレージ', test: () => {
            try {
                localStorage.setItem('test', 'test');
                localStorage.removeItem('test');
                return true;
            } catch (e) {
                return false;
            }
        }}
    ];
    
    const results = checks.map(check => ({
        name: check.name,
        passed: check.test()
    }));
    
    const allPassed = results.every(result => result.passed);
    
    console.log('🔍 アプリケーション健全性チェック:', results);
    
    if (!allPassed) {
        const failedChecks = results.filter(r => !r.passed).map(r => r.name);
        showErrorNotification(`システムの一部に問題があります: ${failedChecks.join(', ')}`);
    }
    
    return allPassed;
}

// Export utility functions for debugging
window.palletizerDebug = {
    healthCheck,
    saveToLocalStorage,
    loadFromLocalStorage,
    reinitialize: initializeApp
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Run health check first
        const isHealthy = healthCheck();
        
        if (isHealthy) {
            initializeApp();
            setupPerformanceMonitoring();
        } else {
            console.error('❌ 健全性チェックに失敗しました');
            showErrorNotification('アプリケーションの初期化に失敗しました。ページを再読み込みしてください。');
        }
    } catch (error) {
        console.error('❌ 初期化エラー:', error);
        showErrorNotification('アプリケーションの開始に失敗しました。');
    }
});

// Legacy support - maintain backward compatibility
window.addEventListener('load', function() {
    // Ensure all legacy global functions are available
    const legacyFunctions = [
        'setHeightLimit',
        'togglePalletSelection', 
        'startEdit',
        'saveEdit',
        'cancelEdit',
        'deleteCarton',
        'showDiagramView',
        'scrollToPallet'
    ];
    
    legacyFunctions.forEach(funcName => {
        if (typeof window[funcName] !== 'function') {
            console.warn(`⚠️ Legacy function ${funcName} not found`);
        }
    });
});

// Service Worker registration (for future PWA support)
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        // Uncomment when service worker is implemented
        // navigator.serviceWorker.register('/sw.js')
        //     .then(registration => console.log('SW registered: ', registration))
        //     .catch(registrationError => console.log('SW registration failed: ', registrationError));
    });
}

export { initializeApp, healthCheck, showErrorNotification };