/**
 * Main Calculator Class
 * Coordinates all modules and maintains the main calculator functionality
 */
class SimpleWarehouseCalculator {
    constructor() {
        this.warehouse = {
            name: '倉庫',
            length: 50,
            width: 40,
            height: 9
        };
        this.pallets = [];
        this.lastCalculationResults = null; // Store last calculation results
        this.lastLayoutResult = null; // Store last layout result
        this.lastLayoutParams = null; // Track last layout parameters to avoid unnecessary regeneration
        
        // Initialize modules
        this.inputManager = new InputManager(this);
        this.layoutManager = new LayoutManager(this);
        this.summaryManager = new SummaryManager(this);
        this.layoutGenerator = new LayoutGenerator(this);
        
        this.initializeEventListeners();
        this.setupTabSwitching();
        this.updateWarehouseInfo();
    }

    initializeEventListeners() {
        this.inputManager.initializeEventListeners();
    }

    setupTabSwitching() {
        // Simple tab switching with improved error handling
        const tabButtons = document.querySelectorAll('.main-tab-button');
        const tabContents = document.querySelectorAll('.main-tab-content');

        console.log('Setting up tab switching...', {
            buttons: tabButtons.length,
            contents: tabContents.length
        });

        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                const targetTab = button.getAttribute('data-tab');
                console.log('Tab clicked:', targetTab);
                
                // Remove active class from all buttons and contents
                tabButtons.forEach(btn => btn.classList.remove('active'));
                tabContents.forEach(content => content.classList.remove('active'));
                
                // Add active class to clicked button and corresponding content
                button.classList.add('active');
                const targetContent = document.getElementById(`${targetTab}-tab`);
                
                if (targetContent) {
                    targetContent.classList.add('active');
                    console.log(`Activated ${targetTab} tab`);
                    
                    // Update content when switching tabs
                    // Use setTimeout to ensure DOM is ready
                    setTimeout(() => {
                        if (targetTab === 'summary') {
                            console.log('Updating summary tab...');
                            this.summaryManager.updateSummaryTab();
                        } else if (targetTab === 'layout') {
                            console.log('Auto-generating layout...');
                            this.autoGenerateLayout();
                        }
                    }, 10);
                } else {
                    console.error(`Target content not found: ${targetTab}-tab`);
                }
            });
        });
    }

    updateWarehouseInfo() {
        this.inputManager.updateWarehouseInfo();
    }

    redrawLayoutIfActive() {
        this.layoutManager.redrawLayoutIfActive();
    }

    forceLayoutUpdate() {
        // Force layout update regardless of which tab is active
        // This ensures warehouse dimension changes are always reflected
        this.layoutManager.redrawLayoutIfActive();
    }

    calculateSpace() {
        console.log('Calculate space button clicked');
        
        const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
        const calculationMode = document.getElementById('calculationMode').value;
        
        if (selectedPallets.length === 0) {
            this.showMessage('パレットを選択してください', 'error');
            return;
        }

        const includeAisles = document.getElementById('includeAisles').checked;
        const aisleWidth = includeAisles ? (parseFloat(document.getElementById('aisleWidth').value) || 2.5) : 0;
        const palletClearance = (parseFloat(document.getElementById('palletClearance').value) || 5) / 100;
        const selectedPalletIndices = selectedPallets.map(option => parseInt(option.value));
        const selectedPalletObjects = selectedPalletIndices.map(index => this.pallets[index]).filter(pallet => pallet);

        if (selectedPalletObjects.length === 0) {
            this.showMessage('選択されたパレットが見つかりません', 'error');
            return;
        }

        if (calculationMode === 'combined') {
            this.layoutGenerator.calculateCombined(selectedPalletObjects, aisleWidth, palletClearance);
        } else {
            this.layoutGenerator.calculateSeparate(selectedPalletObjects, aisleWidth, palletClearance);
        }
    }

    updateCalculationDisplay(results) {
        // Update the input tab display
        document.getElementById('requiredArea').textContent = results.requiredArea.toFixed(2);
        document.getElementById('stackingLevels').textContent = results.stackingLevels.toString();
        document.getElementById('palletsPerRow').textContent = results.palletsPerRow.toString();
        document.getElementById('totalRows').textContent = results.totalRows.toString();
        document.getElementById('utilizationRate').textContent = results.utilizationRate.toFixed(1) + '%';
        document.getElementById('efficiency').textContent = results.efficiency.toFixed(1) + '%';
        document.getElementById('efficiencyText').textContent = results.efficiency.toFixed(1) + '%';
        document.getElementById('efficiencyBar').style.width = Math.max(0, Math.min(results.efficiency, 100)) + '%';

        // Show calculation results
        const resultsEl = document.getElementById('calculationResults');
        if (resultsEl) {
            resultsEl.classList.remove('hidden');
        }
        
        // Store calculation results
        this.lastCalculationResults = results;

        // Update other tabs immediately
        this.summaryManager.updateSummaryTab();
        this.layoutManager.updateLayoutTab();
    }

    showMessage(message, type = 'info') {
        const container = document.getElementById('messageContainer');
        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        container.appendChild(messageElement);

        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }

    autoGenerateLayout() {
        this.updateWarehouseInfo();
        
        const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
        const calculationMode = document.getElementById('calculationMode').value;
        const includeAisles = document.getElementById('includeAisles').checked;
        const aisleWidth = includeAisles ? (parseFloat(document.getElementById('aisleWidth').value) || 2.5) : 0;
        const palletClearance = (parseFloat(document.getElementById('palletClearance').value) || 5) / 100;

        if (selectedPallets.length === 0) {
            this.layoutManager.clearLayout();
            this.layoutManager.updateLayoutTab();
            return;
        }

        const selectedPalletIndices = selectedPallets.map(option => parseInt(option.value));
        const pallets = selectedPalletIndices.map(index => this.pallets[index]).filter(Boolean);
        if (pallets.length === 0) {
            this.layoutManager.clearLayout();
            this.layoutManager.updateLayoutTab();
            return;
        }

        // Use stored layout result if available and parameters haven't changed
        let layoutResult = this.lastLayoutResult;
        
        // Check if we need to regenerate (parameters changed)
        if (!layoutResult || this.hasLayoutParametersChanged(layoutResult, calculationMode, aisleWidth, palletClearance)) {
            this.layoutManager.clearLayout();
            layoutResult = this.layoutGenerator.generateCanvasLayout(pallets, calculationMode, aisleWidth, palletClearance);
            this.lastLayoutResult = layoutResult;
        }
        
        if (layoutResult && layoutResult.success) {
            this.layoutManager.renderCanvasLayout(layoutResult);
            this.layoutManager.createLegendWithStacks(pallets, layoutResult.colors, document.getElementById('layoutLegend'));
        } else {
            this.layoutManager.updateLayoutTab();
        }
    }

    hasLayoutParametersChanged(lastResult, mode, aisleWidth, palletClearance) {
        // Compare key parameters to avoid unnecessary regeneration
        const selectedIds = Array.from(document.getElementById('selectedPallets').selectedOptions)
            .map(o => parseInt(o.value));

        const params = {
            mode,
            aisleWidth,
            palletClearance,
            length: this.warehouse.length,
            width: this.warehouse.width,
            pallets: selectedIds.join(',')
        };

        const changed = JSON.stringify(params) !== JSON.stringify(this.lastLayoutParams);
        this.lastLayoutParams = params;
        return changed;
    }

    generateLayout() {
        this.updateWarehouseInfo();
        
        const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
        const calculationMode = document.getElementById('calculationMode').value;
        const includeAisles = document.getElementById('includeAisles').checked;
        const aisleWidth = includeAisles ? (parseFloat(document.getElementById('aisleWidth').value) || 2.5) : 0;
        const palletClearance = (parseFloat(document.getElementById('palletClearance').value) || 5) / 100;

        if (selectedPallets.length === 0) {
            this.showMessage('パレットを選択してください', 'error');
            return;
        }

        const selectedPalletIndices = selectedPallets.map(option => parseInt(option.value));
        const pallets = selectedPalletIndices.map(index => this.pallets[index]).filter(Boolean);
        if (pallets.length === 0) {
            this.showMessage('選択されたパレットが見つかりません', 'error');
            return;
        }

        this.layoutManager.clearLayout();
        
        const layoutResult = this.layoutGenerator.generateCanvasLayout(pallets, calculationMode, aisleWidth, palletClearance);
        
        if (!layoutResult.success) {
            this.showMessage(layoutResult.message, 'error');
            return;
        }

        this.layoutManager.renderCanvasLayout(layoutResult);
        this.layoutManager.createLegendWithStacks(pallets, layoutResult.colors, document.getElementById('layoutLegend'));

        document.getElementById('calculationResults').classList.remove('hidden');
        
        this.summaryManager.updateSummaryTab();
        this.layoutManager.updateLayoutTab();

        this.showMessage('2Dレイアウトを生成しました', 'success');
    }

    clearLayout() {
        this.layoutManager.clearLayout();
    }

    getStackingLevels(pallet) {
        if (!pallet.isStackable) return 1;
        const byHeight = Math.floor(this.warehouse.height / pallet.height);
        const byMax = Math.floor(pallet.maxStackHeight / pallet.height);
        return Math.max(1, Math.min(byHeight, byMax));
    }

    autoCalculateWarehouse() {
        const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
        const selectedPalletIndices = selectedPallets.map(option => parseInt(option.value));
        const selectedPalletObjects = selectedPalletIndices.map(index => this.pallets[index]).filter(pallet => pallet);
        
        if (selectedPalletObjects.length === 0) {
            this.showMessage('パレットを選択してください', 'error');
            return;
        }

        const aisleWidth = parseFloat(document.getElementById('aisleWidth').value) || 2.5;
        const clearance = (parseFloat(document.getElementById('palletClearance').value) || 5) / 100;

        console.log('=== DEBUG: Auto Calculate Input ===');
        console.log('Pallets:', selectedPalletObjects);
        console.log('Aisle Width:', aisleWidth);
        console.log('Clearance:', clearance);

        // Use the layout generator's calculation method
        const result = this.layoutGenerator.calculateMinimumWarehouseDimensions(
            selectedPalletObjects, aisleWidth, clearance
        );

        // Update warehouse dimensions
        document.getElementById('warehouseLength').value = result.minLength;
        document.getElementById('warehouseWidth').value = result.minWidth;
        
        // Update warehouse object
        this.updateWarehouseInfo();
        
        // Show recommendations if any
        this.showWarehouseRecommendations(result);
        
        // Auto-regenerate layout
        this.redrawLayoutIfActive();
        
        this.showMessage(
            `最適な倉庫サイズ: ${result.minLength}m(L) × ${result.minWidth}m(W) (${result.layoutStrategy})`, 
            'success'
        );
    }

    showWarehouseRecommendations(result) {
        const container = document.getElementById('messageContainer');
        
        if (result.recommendations && result.recommendations.length > 0) {
            result.recommendations.forEach(rec => {
                const messageElement = document.createElement('div');
                messageElement.className = `message ${rec.type}`;
                messageElement.textContent = rec.message;
                container.appendChild(messageElement);
                
                setTimeout(() => {
                    if (messageElement.parentNode) {
                        messageElement.remove();
                    }
                }, 8000);
            });
        }
    }
}

// Initialize the calculator
const calculator = new SimpleWarehouseCalculator();
