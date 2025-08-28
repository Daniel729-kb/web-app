// app.js - Main Application Controller

class AutomateCLPApp {
    constructor() {
        this.palletManager = new PalletManager();
        this.algorithm = new PalletPlacementAlgorithm();
        this.visualization = new ContainerVisualization();
        this.currentContainer = CONFIG.CONTAINERS['40ft'];
        this.currentClearance = CONFIG.ALGORITHM.CLEARANCE_DEFAULT;
        this.isCalculating = false;
        
        this.elements = {};
        this.init();
    }

    // Initialize the application
    init() {
        console.log('Initializing AutomateCLP Application...');
        
        this.cacheElements();
        this.setupEventListeners();
        this.setupCustomEvents();
        this.initializeDarkMode();
        this.updateContainerInfo();
        this.updatePalletList();
        
        // Initialize visualization
        this.visualization.init();
        
        console.log('Application initialized successfully');
    }

    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Form elements
            palletLength: document.getElementById('palletLength'),
            palletWidth: document.getElementById('palletWidth'),
            palletQty: document.getElementById('palletQty'),
            containerType: document.getElementById('containerType'),
            clearanceValue: document.getElementById('clearanceValue'),
            
            // Buttons
            addPalletBtn: document.getElementById('addPalletBtn'),
            calculateBtn: document.getElementById('calculateBtn'),
            testBtn: document.getElementById('calculateBtn'),
            exportBtn: document.getElementById('exportBtn'),
            darkModeToggle: document.getElementById('darkModeToggle'),
            
            // Display elements
            palletList: document.getElementById('palletList'),
            containerInfo: document.getElementById('containerInfo'),
            legend: document.getElementById('legend'),
            stats: document.getElementById('stats')
        };
    }

    // Setup event listeners
    setupEventListeners() {
        // Form submission
        this.elements.addPalletBtn.addEventListener('click', () => this.addPallet());
        
        // Calculation and actions
        this.elements.calculateBtn.addEventListener('click', () => this.calculateLoading());
        this.elements.testBtn.addEventListener('click', () => this.runTestCase());
        this.elements.exportBtn.addEventListener('click', () => this.exportLayout());
        
        // Container and clearance changes
        this.elements.containerType.addEventListener('change', () => this.onContainerTypeChange());
        this.elements.clearanceValue.addEventListener('input', () => this.onClearanceChange());
        
        // Dark mode toggle
        this.elements.darkModeToggle.addEventListener('click', () => this.toggleDarkMode());
        
        // Enter key support for form inputs
        [this.elements.palletLength, this.elements.palletWidth, this.elements.palletQty].forEach(input => {
            input.addEventListener('keypress', e => {
                if (e.key === 'Enter') this.addPallet();
            });
        });
        
        // Preset buttons
        this.setupPresetButtons();
        
        console.log('Event listeners setup complete');
    }

    // Setup custom events for communication between components
    setupCustomEvents() {
        // Pallet rotation
        document.addEventListener('palletRotated', (e) => {
            const { palletId, instance } = e.detail;
            this.handlePalletRotation(palletId, instance);
        });
        
        // Pallet deletion
        document.addEventListener('palletDeleted', (e) => {
            const { palletId, instance } = e.detail;
            this.handlePalletDeletion(palletId, instance);
        });
        
        // Pallet position update
        document.addEventListener('palletPositionUpdated', (e) => {
            const { palletId, instance, x, y } = e.detail;
            this.handlePalletPositionUpdate(palletId, instance, x, y);
        });
        
        // Pallet status update
        document.addEventListener('palletStatusUpdated', (e) => {
            const { palletId, instance } = e.detail;
            this.handlePalletStatusUpdate(palletId, instance);
        });
        
        console.log('Custom events setup complete');
    }

    // Setup preset buttons
    setupPresetButtons() {
        document.querySelectorAll('.preset-btn').forEach(btn => {
            btn.addEventListener('click', function() {
                const length = this.dataset.length;
                const width = this.dataset.width;
                
                this.elements.palletLength.value = length;
                this.elements.palletWidth.value = width;
                this.elements.palletQty.focus();
            }.bind(this));
        });
    }

    // Add a new pallet
    addPallet() {
        try {
            const length = parseInt(this.elements.palletLength.value);
            const width = parseInt(this.elements.palletWidth.value);
            const qty = parseInt(this.elements.palletQty.value);
            
            // Validate input
            if (!Utils.validation.isValidDimension(length) || 
                !Utils.validation.isValidDimension(width) || 
                !Utils.validation.isValidQuantity(qty)) {
                this.showNotification('有効なパレット寸法と数量を入力してください', 'error');
                return;
            }
            
            // Add pallet
            const pallet = this.palletManager.add(length, width, qty);
            
            // Update UI
            this.updatePalletList();
            this.updateContainerInfo();
            this.clearInputs();
            this.clearResults();
            
            this.showNotification(`パレット ${length}×${width}cm (${qty}個) を追加しました`, 'success');
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Remove a pallet
    removePallet(id) {
        try {
            this.palletManager.remove(id);
            this.updatePalletList();
            this.updateContainerInfo();
            this.clearResults();
            
            this.showNotification('パレットを削除しました', 'success');
            
        } catch (error) {
            this.showNotification(error.message, 'error');
        }
    }

    // Calculate loading plan
    async calculateLoading() {
        if (this.isCalculating) {
            this.showNotification('計算中です。しばらくお待ちください。', 'warning');
            return;
        }
        
        if (this.palletManager.getAll().length === 0) {
            this.showNotification('少なくとも1つのパレットタイプを追加してください', 'error');
            return;
        }
        
        this.isCalculating = true;
        this.elements.calculateBtn.disabled = true;
        this.elements.calculateBtn.innerHTML = '<span class="btn-icon">⏳</span>計算中...';
        
        try {
            this.showNotification('🧮 最適な積載プランを計算中...', 'info');
            
            // Generate pallet instances
            const pallets = this.palletManager.generateAllInstances();
            
            // Run placement algorithm
            const result = await this.runPlacementAlgorithm(pallets);
            
            // Render results
            this.renderResults(result);
            
            // Update statistics
            this.updateStatistics();
            
            this.showNotification('🎉 積載計算が完了しました！', 'success');
            
        } catch (error) {
            console.error('Calculation failed:', error);
            this.showNotification('計算中にエラーが発生しました: ' + error.message, 'error');
        } finally {
            this.isCalculating = false;
            this.elements.calculateBtn.disabled = false;
            this.elements.calculateBtn.innerHTML = '<span class="btn-icon">🧮</span>積載計算';
        }
    }

    // Run placement algorithm
    async runPlacementAlgorithm(pallets) {
        return new Promise((resolve) => {
            // Use setTimeout to prevent blocking the UI
            setTimeout(() => {
                const result = this.algorithm.placePallets(
                    pallets, 
                    this.currentContainer, 
                    this.currentClearance
                );
                resolve(result);
            }, 100);
        });
    }

    // Render calculation results
    renderResults(pallets) {
        // Update pallet manager with results
        this.palletManager.allPalletsGenerated = pallets;
        
        // Render visualization
        this.visualization.renderPallets(pallets, this.currentContainer);
        
        // Update legend
        this.visualization.updateLegend(this.palletManager.getAll());
        
        // Show export button
        this.elements.exportBtn.style.display = 'block';
    }

    // Update statistics
    updateStatistics() {
        const palletStats = this.palletManager.getStats();
        const areaStats = this.palletManager.getAreaStats(this.currentContainer);
        
        const stats = {
            totalPallets: palletStats.totalPallets,
            visiblePallets: palletStats.totalPallets - palletStats.deletedPallets,
            loadedPallets: palletStats.placedPallets,
            loadingRate: palletStats.placementRate,
            efficiency: areaStats.efficiency,
            remainingArea: areaStats.remainingArea
        };
        
        this.visualization.updateStats(stats);
    }

    // Run test case
    runTestCase() {
        try {
            // Clear existing pallets
            this.palletManager.clear();
            
            // Set test configuration
            this.elements.containerType.value = '40ft';
            this.elements.clearanceValue.value = '5';
            this.onContainerTypeChange();
            this.onClearanceChange();
            
            // Add test pallets
            const testData = [
                { l: 110, w: 110, q: 12, c: '#f39c12' },
                { l: 100, w: 125, q: 8, c: '#3498db' }
            ];
            
            testData.forEach((p, i) => {
                this.palletManager.add(p.l, p.w, p.q);
            });
            
            // Update UI
            this.updatePalletList();
            this.updateContainerInfo();
            this.clearResults();
            
            this.showNotification('🎯 テストケースが実行されました: 110×110 (12個) + 100×125 (8個)', 'success');
            
        } catch (error) {
            this.showNotification('テストケースの実行に失敗しました: ' + error.message, 'error');
        }
    }

    // Export layout as image
    exportLayout() {
        this.visualization.exportLayoutAsImage();
    }

    // Handle container type change
    onContainerTypeChange() {
        const containerType = this.elements.containerType.value;
        this.currentContainer = CONFIG.CONTAINERS[containerType];
        
        this.updateContainerInfo();
        this.clearResults();
        
        console.log(`Container changed to: ${containerType}`);
    }

    // Handle clearance change
    onClearanceChange() {
        const clearance = parseFloat(this.elements.clearanceValue.value);
        if (Utils.validation.isValidClearance(clearance)) {
            this.currentClearance = clearance;
            this.updateContainerInfo();
            this.clearResults();
        }
    }

    // Handle pallet rotation
    handlePalletRotation(palletId, instance) {
        this.palletManager.rotatePallet(palletId, instance);
        this.updateStatistics();
        this.showNotification('パレットが回転されました', 'info');
    }

    // Handle pallet deletion
    handlePalletDeletion(palletId, instance) {
        this.palletManager.markAsDeleted(palletId, instance);
        this.updateStatistics();
        this.showNotification('パレットが削除されました', 'success');
    }

    // Handle pallet position update
    handlePalletPositionUpdate(palletId, instance, x, y) {
        this.palletManager.updatePosition(palletId, instance, x, y);
        this.updateStatistics();
    }

    // Handle pallet status update
    handlePalletStatusUpdate(palletId, instance) {
        // Update visual state if needed
        const pallet = this.palletManager.allPalletsGenerated.find(p => 
            p.id === palletId && p.instance === instance
        );
        
        if (pallet) {
            const palletEl = document.querySelector(`[data-pallet-id="${palletId}"][data-instance="${instance}"]`);
            if (palletEl) {
                this.visualization.updatePalletVisualState(palletEl, pallet, this.currentContainer);
            }
        }
    }

    // Update pallet list display
    updatePalletList() {
        const pallets = this.palletManager.getAll();
        const container = this.elements.palletList;
        
        if (pallets.length === 0) {
            container.innerHTML = '<p style="text-align:center;color:var(--text-secondary);font-style:italic;">パレットがまだ追加されていません</p>';
            return;
        }
        
        container.innerHTML = '';
        pallets.forEach(pallet => {
            const item = Utils.dom.createElement('div', 'pallet-item');
            item.innerHTML = `
                <span>${pallet.length}×${pallet.width}cm (${pallet.qty}個)</span>
                <button class="remove-btn" onclick="app.removePallet(${pallet.id})">✕</button>
            `;
            container.appendChild(item);
        });
    }

    // Update container information
    updateContainerInfo() {
        const container = this.currentContainer;
        const clearance = this.currentClearance;
        
        this.elements.containerInfo.innerHTML = `
            <strong>${container.name}</strong><br>
            内寸: ${(container.length/100).toFixed(3)}m × ${(container.width/100).toFixed(3)}m<br>
            <small>クリアランス: ${clearance}cm</small>
        `;
    }

    // Clear form inputs
    clearInputs() {
        this.elements.palletLength.value = '';
        this.elements.palletWidth.value = '';
        this.elements.palletQty.value = '1';
    }

    // Clear results
    clearResults() {
        this.palletManager.resetGenerated();
        this.visualization.clearPallets();
        
        // Hide elements
        ['stats', 'legend', 'exportBtn'].forEach(id => {
            const element = document.getElementById(id);
            if (element) element.style.display = 'none';
        });
    }

    // Initialize dark mode
    initializeDarkMode() {
        const isDarkMode = Utils.storage.get('darkMode', false);
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            this.elements.darkModeToggle.textContent = '☀️';
        }
    }

    // Toggle dark mode
    toggleDarkMode() {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        
        Utils.storage.set('darkMode', isDark);
        this.elements.darkModeToggle.textContent = isDark ? '☀️' : '🌙';
        
        this.showNotification(
            isDark ? 'ダークモードに切り替えました' : 'ライトモードに切り替えました', 
            'info'
        );
    }

    // Show notification
    showNotification(message, type = 'info') {
        this.visualization.showNotification(message, type);
    }

    // Get application state
    getState() {
        return {
            pallets: this.palletManager.getAll(),
            container: this.currentContainer,
            clearance: this.currentClearance,
            algorithm: this.algorithm.getStats(),
            darkMode: document.body.classList.contains('dark-mode')
        };
    }

    // Cleanup application
    cleanup() {
        this.visualization.cleanup();
        console.log('Application cleanup completed');
    }
}

// Global app instance
let app;

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    app = new AutomateCLPApp();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (app) {
        app.cleanup();
    }
});

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AutomateCLPApp;
}