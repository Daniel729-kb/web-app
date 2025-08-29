// UI Manager for Palletizar
// Handles all UI interactions and updates

class PalletizerUI {
    constructor() {
        this.config = PalletizerConfig;
        this.utils = PalletizerUtils;
        this.state = stateManager;
        this.engine = calculationEngine;
        this.elements = {};
        this.initialized = false;
    }
    
    // Initialize UI
    init() {
        return this.utils.errorHandler.wrap(() => {
            if (this.initialized) return;
            
            this.utils.log.info('Initializing Palletizer UI');
            
            // Cache DOM elements
            this.cacheElements();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Initialize components
            this.initializeDarkMode();
            this.initializePalletSelection();
            this.initializeHeightLimit();
            
            // Subscribe to state changes
            this.subscribeToStateChanges();
            
            // Initial render
            this.render();
            
            this.initialized = true;
            this.utils.log.info('Palletizer UI initialized successfully');
        }, 'UI Initialization')();
    }
    
    // Cache DOM elements
    cacheElements() {
        this.elements = {
            // Main containers
            container: document.querySelector('.container'),
            cartonTableBody: document.getElementById('cartonTableBody'),
            resultsContainer: document.getElementById('resultsContainer'),
            
            // Forms
            addForm: document.getElementById('addForm'),
            importArea: document.getElementById('importArea'),
            
            // Input fields
            cartonCode: document.getElementById('cartonCode'),
            cartonQty: document.getElementById('cartonQty'),
            cartonWeight: document.getElementById('cartonWeight'),
            cartonLength: document.getElementById('cartonLength'),
            cartonWidth: document.getElementById('cartonWidth'),
            cartonHeight: document.getElementById('cartonHeight'),
            heightLimitInput: document.getElementById('heightLimitInput'),
            heightLimitDisplay: document.getElementById('heightLimitDisplay'),
            heightWarning: document.getElementById('heightWarning'),
            
            // Buttons
            addButton: document.getElementById('addButton'),
            saveAddButton: document.getElementById('saveAddButton'),
            cancelAddButton: document.getElementById('cancelAddButton'),
            calculateButton: document.getElementById('calculateButton'),
            clearAllButton: document.getElementById('clearAllButton'),
            exportButton: document.getElementById('exportButton'),
            importButton: document.getElementById('importButton'),
            
            // Summary elements
            totalCartons: document.getElementById('totalCartons'),
            totalWeight: document.getElementById('totalWeight'),
            itemCount: document.getElementById('itemCount'),
            
            // Pallet selection
            palletOptions: document.getElementById('palletOptions'),
            selectedPalletsInfo: document.getElementById('selectedPalletsInfo'),
            
            // Dark mode
            darkModeIcon: document.querySelector('.dark-mode-icon')
        };
    }
    
    // Set up event listeners
    setupEventListeners() {
        // Add/Edit form
        this.addClickListener('addButton', () => this.toggleAddForm());
        this.addClickListener('saveAddButton', () => this.saveCarton());
        this.addClickListener('cancelAddButton', () => this.cancelAdd());
        
        // Calculation
        this.addClickListener('calculateButton', () => this.calculate());
        
        // Import/Export
        this.addClickListener('exportButton', () => this.exportData());
        this.addClickListener('importButton', () => this.toggleImportArea());
        this.addClickListener('clearAllButton', () => this.clearAll());
        
        // Height limit
        if (this.elements.heightLimitInput) {
            this.elements.heightLimitInput.addEventListener('input', 
                this.utils.debounce(() => this.updateHeightLimit(), 300)
            );
        }
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();
    }
    
    // Add click listener with error handling
    addClickListener(elementId, handler) {
        const element = this.elements[elementId];
        if (element) {
            element.addEventListener('click', 
                this.utils.errorHandler.wrap(handler.bind(this), `${elementId} click`)
            );
        }
    }
    
    // Setup keyboard shortcuts
    setupKeyboardShortcuts() {
        if (!this.config.ui.ENABLE_KEYBOARD_SHORTCUTS) return;
        
        document.addEventListener('keydown', (e) => {
            // Ctrl+S: Save/Calculate
            if (e.ctrlKey && e.key === 's') {
                e.preventDefault();
                this.calculate();
            }
            
            // Ctrl+N: New carton
            if (e.ctrlKey && e.key === 'n') {
                e.preventDefault();
                this.toggleAddForm();
            }
            
            // Ctrl+E: Export
            if (e.ctrlKey && e.key === 'e') {
                e.preventDefault();
                this.exportData();
            }
            
            // Ctrl+Z: Undo
            if (e.ctrlKey && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                this.state.undo();
                this.render();
            }
            
            // Ctrl+Shift+Z or Ctrl+Y: Redo
            if ((e.ctrlKey && e.shiftKey && e.key === 'z') || (e.ctrlKey && e.key === 'y')) {
                e.preventDefault();
                this.state.redo();
                this.render();
            }
            
            // Escape: Cancel current operation
            if (e.key === 'Escape') {
                this.cancelCurrentOperation();
            }
        });
    }
    
    // Subscribe to state changes
    subscribeToStateChanges() {
        this.state.on('stateChanged', () => this.render());
        this.state.on('cartonAdded', () => this.updateTable());
        this.state.on('cartonUpdated', () => this.updateTable());
        this.state.on('cartonRemoved', () => this.updateTable());
        this.state.on('cartonsCleared', () => this.updateTable());
        this.state.on('error', (error) => this.showError(error.message));
    }
    
    // Main render function
    render() {
        this.updateTable();
        this.updateSummary();
        this.updatePalletSelection();
        this.updateHeightDisplay();
    }
    
    // Update carton table
    updateTable() {
        const tbody = this.elements.cartonTableBody;
        if (!tbody) return;
        
        const cartons = this.state.getState().cartons;
        tbody.innerHTML = '';
        
        cartons.forEach(carton => {
            const row = this.createCartonRow(carton);
            tbody.appendChild(row);
        });
        
        this.updateSummary();
    }
    
    // Create carton table row
    createCartonRow(carton) {
        const row = document.createElement('tr');
        const volume = this.utils.calculation.calculateVolume(
            carton.l, carton.w, carton.h, carton.qty
        );
        
        row.innerHTML = `
            <td>${this.utils.validation.sanitizeInput(carton.code)}</td>
            <td class="center">${this.utils.format.number(carton.qty)}</td>
            <td class="center mono">${this.utils.format.weight(carton.weight)}</td>
            <td class="center mono">${this.utils.format.dimension(carton.l)}</td>
            <td class="center mono">${this.utils.format.dimension(carton.w)}</td>
            <td class="center mono">${this.utils.format.dimension(carton.h)}</td>
            <td class="center mono">${this.utils.format.volume(volume)}</td>
            <td class="center">
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" data-action="edit" data-id="${carton.id}">✏️</button>
                    <button class="btn btn-sm btn-danger" data-action="remove" data-id="${carton.id}">🗑️</button>
                </div>
            </td>
        `;
        
        // Add event listeners to action buttons
        row.querySelector('[data-action="edit"]').addEventListener('click', () => {
            this.editCarton(carton.id);
        });
        
        row.querySelector('[data-action="remove"]').addEventListener('click', () => {
            this.removeCarton(carton.id);
        });
        
        return row;
    }
    
    // Update summary
    updateSummary() {
        const stats = this.state.getStatistics();
        
        if (this.elements.totalCartons) {
            this.elements.totalCartons.textContent = this.utils.format.number(stats.totalCartons);
        }
        
        if (this.elements.totalWeight) {
            this.elements.totalWeight.textContent = this.utils.format.weight(stats.totalWeight);
        }
        
        if (this.elements.itemCount) {
            this.elements.itemCount.textContent = `${stats.itemCount} 種類`;
        }
    }
    
    // Toggle add form
    toggleAddForm() {
        const form = this.elements.addForm;
        if (!form) return;
        
        const isVisible = form.style.display !== 'none';
        form.style.display = isVisible ? 'none' : 'block';
        
        if (!isVisible) {
            this.clearForm();
            this.elements.cartonCode?.focus();
        }
    }
    
    // Save carton
    saveCarton() {
        const cartonData = {
            code: this.elements.cartonCode?.value || '',
            qty: parseInt(this.elements.cartonQty?.value) || 0,
            weight: parseFloat(this.elements.cartonWeight?.value) || 0,
            l: parseFloat(this.elements.cartonLength?.value) || 0,
            w: parseFloat(this.elements.cartonWidth?.value) || 0,
            h: parseFloat(this.elements.cartonHeight?.value) || 0
        };
        
        const editingId = this.state.getState().editingCartonId;
        
        if (editingId) {
            // Update existing carton
            const result = this.state.updateCarton(editingId, cartonData);
            if (result) {
                this.utils.ui.showNotification('カートンを更新しました', 'success');
                this.cancelAdd();
            }
        } else {
            // Add new carton
            const result = this.state.addCarton(cartonData);
            if (result) {
                this.utils.ui.showNotification('カートンを追加しました', 'success');
                this.clearForm();
            }
        }
    }
    
    // Edit carton
    editCarton(id) {
        const cartons = this.state.getState().cartons;
        const carton = cartons.find(c => c.id === id);
        
        if (!carton) return;
        
        // Populate form
        if (this.elements.cartonCode) this.elements.cartonCode.value = carton.code;
        if (this.elements.cartonQty) this.elements.cartonQty.value = carton.qty;
        if (this.elements.cartonWeight) this.elements.cartonWeight.value = carton.weight;
        if (this.elements.cartonLength) this.elements.cartonLength.value = carton.l;
        if (this.elements.cartonWidth) this.elements.cartonWidth.value = carton.w;
        if (this.elements.cartonHeight) this.elements.cartonHeight.value = carton.h;
        
        // Show form
        this.toggleAddForm();
        
        // Set editing state
        this.state.setState({ editingCartonId: id }, false);
    }
    
    // Remove carton
    removeCarton(id) {
        if (confirm('このカートンを削除してもよろしいですか？')) {
            const result = this.state.removeCarton(id);
            if (result) {
                this.utils.ui.showNotification('カートンを削除しました', 'success');
            }
        }
    }
    
    // Clear form
    clearForm() {
        const inputs = ['cartonCode', 'cartonQty', 'cartonWeight', 
                       'cartonLength', 'cartonWidth', 'cartonHeight'];
        
        inputs.forEach(id => {
            if (this.elements[id]) {
                this.elements[id].value = '';
            }
        });
        
        this.state.setState({ editingCartonId: null }, false);
    }
    
    // Cancel add/edit
    cancelAdd() {
        this.clearForm();
        this.toggleAddForm();
    }
    
    // Cancel current operation
    cancelCurrentOperation() {
        if (this.elements.addForm?.style.display !== 'none') {
            this.cancelAdd();
        }
        if (this.elements.importArea?.style.display !== 'none') {
            this.toggleImportArea();
        }
    }
    
    // Calculate palletization
    async calculate() {
        const state = this.state.getState();
        
        if (state.cartons.length === 0) {
            this.utils.ui.showNotification('計算するカートンがありません', 'warning');
            return;
        }
        
        if (state.selectedPalletSizes.length === 0) {
            this.utils.ui.showNotification('パレットサイズを選択してください', 'warning');
            return;
        }
        
        try {
            // Show loading
            this.utils.ui.showLoading('パレット配置を計算中...');
            this.state.setState({ isCalculating: true }, false);
            
            // Perform calculation
            const results = await this.performCalculation(state);
            
            // Update state
            this.state.setState({ 
                calculatedPallets: results.allResults,
                isCalculating: false 
            }, false);
            
            // Display results
            this.displayResults(results);
            
            // Show success message
            this.utils.ui.showNotification(
                this.config.messages.success.CALCULATION_COMPLETE,
                'success'
            );
        } catch (error) {
            this.utils.errorHandler.handle(error, 'Calculation');
        } finally {
            this.utils.ui.hideLoading();
            this.state.setState({ isCalculating: false }, false);
        }
    }
    
    // Perform calculation (can be async for web workers in future)
    async performCalculation(state) {
        return new Promise((resolve) => {
            // Simulate async for future web worker implementation
            setTimeout(() => {
                const results = this.engine.calculate(
                    state.cartons,
                    state.selectedPalletSizes,
                    {
                        heightLimit: state.heightLimit,
                        enableMixedCargo: state.enableMixedCargo
                    }
                );
                resolve(results);
            }, 100);
        });
    }
    
    // Display calculation results
    displayResults(results) {
        const container = this.elements.resultsContainer;
        if (!container) return;
        
        container.innerHTML = '';
        
        if (!results.bestResult) {
            container.innerHTML = '<p class="no-results">最適な配置が見つかりませんでした</p>';
            return;
        }
        
        // Display best result prominently
        const bestCard = this.createResultCard(results.bestResult, true);
        container.appendChild(bestCard);
        
        // Display other results
        results.allResults.slice(1, 10).forEach(result => {
            const card = this.createResultCard(result, false);
            container.appendChild(card);
        });
    }
    
    // Create result card
    createResultCard(result, isBest = false) {
        const card = document.createElement('div');
        card.className = `pallet-card ${isBest ? 'best-result' : ''}`;
        
        const efficiencyClass = result.efficiency >= this.config.efficiency.OPTIMAL_EFFICIENCY_THRESHOLD ? 
                              'excellent' : result.efficiency >= 70 ? 'good' : 'fair';
        
        card.innerHTML = `
            <div class="pallet-header">
                <h3>${isBest ? '🏆 最適解' : 'パレット案'} - ${result.palletSize.name}</h3>
                <span class="efficiency-badge ${efficiencyClass}">
                    効率: ${this.utils.format.percentage(result.efficiency)}
                </span>
            </div>
            <div class="pallet-body">
                <div class="pallet-info">
                    <div class="info-item">
                        <span class="label">カートン:</span>
                        <span class="value">${result.carton.code}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">配置:</span>
                        <span class="value">${result.carton.orientationDesc}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">数量:</span>
                        <span class="value">${result.quantity} / ${result.carton.qty}</span>
                    </div>
                    <div class="info-item">
                        <span class="label">層数:</span>
                        <span class="value">${result.layout.layers}層</span>
                    </div>
                    <div class="info-item">
                        <span class="label">高さ:</span>
                        <span class="value ${result.height > this.state.getState().heightLimit ? 'warning' : ''}">
                            ${this.utils.format.dimension(result.height)}
                        </span>
                    </div>
                    <div class="info-item">
                        <span class="label">重量:</span>
                        <span class="value">${this.utils.format.weight(result.weight)}</span>
                    </div>
                </div>
                ${this.createEfficiencyDetails(result)}
                ${this.createWarnings(result.warnings)}
            </div>
        `;
        
        return card;
    }
    
    // Create efficiency details
    createEfficiencyDetails(result) {
        return `
            <div class="efficiency-details">
                <div class="efficiency-item">
                    <span class="efficiency-label">体積効率:</span>
                    <span class="efficiency-value">${this.utils.format.percentage(result.volumeEfficiency)}</span>
                </div>
                <div class="efficiency-item">
                    <span class="efficiency-label">重量効率:</span>
                    <span class="efficiency-value">${this.utils.format.percentage(result.weightEfficiency)}</span>
                </div>
                <div class="efficiency-item">
                    <span class="efficiency-label">安定性:</span>
                    <span class="efficiency-value">${this.utils.format.percentage(result.stabilityEfficiency)}</span>
                </div>
            </div>
        `;
    }
    
    // Create warnings display
    createWarnings(warnings) {
        if (!warnings || warnings.length === 0) return '';
        
        const warningHtml = warnings.map(w => `
            <div class="warning-item warning-${w.severity}">
                ${w.message}
            </div>
        `).join('');
        
        return `<div class="warnings">${warningHtml}</div>`;
    }
    
    // Initialize dark mode
    initializeDarkMode() {
        const isDarkMode = localStorage.getItem('palletizer-dark-mode') === 'true';
        
        if (isDarkMode) {
            document.body.classList.add('dark-mode');
            this.state.setState({ isDarkMode: true }, false);
        }
        
        if (this.elements.darkModeIcon) {
            this.elements.darkModeIcon.addEventListener('click', () => {
                this.toggleDarkMode();
            });
            this.updateDarkModeIcon();
        }
    }
    
    // Toggle dark mode
    toggleDarkMode() {
        const isDarkMode = !this.state.getState().isDarkMode;
        
        document.body.classList.toggle('dark-mode', isDarkMode);
        this.state.setState({ isDarkMode }, false);
        localStorage.setItem('palletizer-dark-mode', isDarkMode);
        
        this.updateDarkModeIcon();
    }
    
    // Update dark mode icon
    updateDarkModeIcon() {
        if (this.elements.darkModeIcon) {
            const isDarkMode = this.state.getState().isDarkMode;
            this.elements.darkModeIcon.textContent = isDarkMode ? '☀️' : '🌙';
        }
    }
    
    // Initialize pallet selection
    initializePalletSelection() {
        const container = this.elements.palletOptions;
        if (!container) return;
        
        container.innerHTML = '';
        
        this.config.palletSizes.forEach((pallet, index) => {
            const option = this.createPalletOption(pallet, index);
            container.appendChild(option);
        });
        
        this.updatePalletSelection();
    }
    
    // Create pallet option
    createPalletOption(pallet, index) {
        const option = document.createElement('div');
        option.className = 'pallet-option selected';
        option.dataset.index = index;
        
        option.innerHTML = `
            <input type="checkbox" class="pallet-checkbox" checked>
            <div class="pallet-option-info">
                <div class="pallet-option-name">${pallet.name}</div>
                <div class="pallet-option-size">${pallet.description} - ${pallet.width}cm × ${pallet.depth}cm</div>
            </div>
        `;
        
        option.addEventListener('click', () => {
            this.togglePalletSelection(index);
        });
        
        return option;
    }
    
    // Toggle pallet selection
    togglePalletSelection(index) {
        const option = this.elements.palletOptions.children[index];
        const checkbox = option.querySelector('.pallet-checkbox');
        const isSelected = option.classList.contains('selected');
        
        if (isSelected) {
            option.classList.remove('selected');
            checkbox.checked = false;
        } else {
            option.classList.add('selected');
            checkbox.checked = true;
        }
        
        this.updateSelectedPallets();
    }
    
    // Update selected pallets
    updateSelectedPallets() {
        const selected = [];
        
        this.elements.palletOptions.querySelectorAll('.pallet-option').forEach((option, index) => {
            if (option.classList.contains('selected')) {
                selected.push(this.config.palletSizes[index]);
            }
        });
        
        this.state.setState({ selectedPalletSizes: selected }, false);
        this.updatePalletSelection();
    }
    
    // Update pallet selection display
    updatePalletSelection() {
        const info = this.elements.selectedPalletsInfo;
        if (!info) return;
        
        const count = this.state.getState().selectedPalletSizes.length;
        const total = this.config.palletSizes.length;
        
        if (count === 0) {
            info.textContent = '⚠️ パレット種類を選択してください';
            info.className = 'warning';
        } else if (count === total) {
            info.textContent = `✅ 全${count}種類のパレットで最適化計算`;
            info.className = 'success';
        } else {
            info.textContent = `✅ ${count}種類のパレットで最適化計算`;
            info.className = 'info';
        }
    }
    
    // Initialize height limit
    initializeHeightLimit() {
        const input = this.elements.heightLimitInput;
        if (!input) return;
        
        const currentLimit = this.state.getState().heightLimit;
        input.value = currentLimit;
        
        this.updateHeightDisplay();
    }
    
    // Update height limit
    updateHeightLimit() {
        const input = this.elements.heightLimitInput;
        if (!input) return;
        
        const value = parseFloat(input.value);
        
        if (this.utils.validation.isInRange(
            value,
            this.config.constraints.MIN_HEIGHT_LIMIT,
            this.config.constraints.MAX_HEIGHT_LIMIT
        )) {
            this.state.setState({ heightLimit: value });
            this.updateHeightDisplay();
        } else {
            this.utils.ui.showNotification(
                `高さ制限は${this.config.constraints.MIN_HEIGHT_LIMIT}から${this.config.constraints.MAX_HEIGHT_LIMIT}cmの間にしてください`,
                'warning'
            );
            input.value = this.state.getState().heightLimit;
        }
    }
    
    // Update height display
    updateHeightDisplay() {
        const display = this.elements.heightLimitDisplay;
        const warning = this.elements.heightWarning;
        const limit = this.state.getState().heightLimit;
        
        if (display) {
            display.textContent = `${limit}cm`;
        }
        
        if (warning) {
            if (limit > 180) {
                warning.classList.remove('hidden');
                warning.textContent = '⚠️ 高さ制限が180cmを超えています。安定性にご注意ください。';
            } else {
                warning.classList.add('hidden');
            }
        }
    }
    
    // Export data
    exportData() {
        const state = this.state.getState();
        const stats = this.state.getStatistics();
        
        const exportData = state.cartons.map(carton => ({
            'カートンコード': carton.code,
            '数量': carton.qty,
            '重量(kg)': carton.weight,
            '長さ(cm)': carton.l,
            '幅(cm)': carton.w,
            '高さ(cm)': carton.h,
            '体積(m³)': this.utils.calculation.calculateVolume(carton.l, carton.w, carton.h, carton.qty)
        }));
        
        // Add summary row
        exportData.push({
            'カートンコード': '合計',
            '数量': stats.totalCartons,
            '重量(kg)': stats.totalWeight,
            '長さ(cm)': '',
            '幅(cm)': '',
            '高さ(cm)': '',
            '体積(m³)': stats.totalVolume
        });
        
        const filename = `palletizer-export-${this.utils.format.date(Date.now()).replace(/[: ]/g, '-')}.csv`;
        this.utils.csv.export(exportData, filename);
    }
    
    // Toggle import area
    toggleImportArea() {
        const area = this.elements.importArea;
        if (!area) return;
        
        const isVisible = area.style.display !== 'none';
        area.style.display = isVisible ? 'none' : 'block';
    }
    
    // Clear all cartons
    clearAll() {
        if (confirm('すべてのカートンデータを削除してもよろしいですか？')) {
            const result = this.state.clearAllCartons();
            if (result) {
                this.utils.ui.showNotification('すべてのデータをクリアしました', 'success');
            }
        }
    }
    
    // Show error
    showError(message) {
        this.utils.ui.showNotification(message, 'error');
    }
}

// Create singleton instance
const uiManager = new PalletizerUI();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = uiManager;
}