/**
 * パレタイザーアプリケーション バンドル版
 * すべてのモジュールを単一ファイルに統合
 */

// ==================== 状態管理モジュール ====================
class AppState {
    constructor() {
        this.reset();
    }

    reset() {
        // 貨物データ
        this.cartonData = [];
        
        // パレット設定
        this.palletConfig = {
            selectedSizes: [],
            allSizes: [
                { name: 'T11', width: 110, depth: 110, description: 'JIS T11型' },
                { name: 'T12', width: 100, depth: 120, description: 'JIS T12型' },
                { name: 'EUR', width: 120, depth: 80, description: 'ユーロパレット' },
                { name: 'US48', width: 121.9, depth: 101.6, description: '米国標準 48×40' },
                { name: 'US42', width: 106.7, depth: 106.7, description: '米国標準 42×42' }
            ],
            maxHeightLimit: 158
        };
        
        // 計算結果
        this.results = {
            currentPallets: [],
            lastCalculation: null
        };
        
        // UI状態
        this.ui = {
            isCalculating: false,
            currentView: 'input',
            errors: [],
            notifications: []
        };
    }

    // 貨物データ操作
    addCarton(carton) {
        const validated = this.validateCarton(carton);
        if (validated.error) {
            throw new Error(validated.error);
        }
        
        this.cartonData.push(validated.data);
        this.notifyChange('cartonData');
    }

    updateCarton(index, carton) {
        if (index < 0 || index >= this.cartonData.length) {
            throw new Error('Invalid carton index');
        }
        
        const validated = this.validateCarton(carton);
        if (validated.error) {
            throw new Error(validated.error);
        }
        
        this.cartonData[index] = validated.data;
        this.notifyChange('cartonData');
    }

    deleteCarton(index) {
        if (index < 0 || index >= this.cartonData.length) {
            throw new Error('Invalid carton index');
        }
        
        this.cartonData.splice(index, 1);
        this.notifyChange('cartonData');
    }

    clearAllCartons() {
        this.cartonData = [];
        this.results.currentPallets = [];
        this.notifyChange('cartonData');
    }

    setSelectedPalletSizes(sizes) {
        this.palletConfig.selectedSizes = sizes;
        this.notifyChange('palletConfig');
    }

    setMaxHeightLimit(height) {
        const validated = Math.max(50, Math.min(300, height));
        this.palletConfig.maxHeightLimit = validated;
        this.notifyChange('palletConfig');
    }

    setCalculationResults(pallets) {
        this.results.currentPallets = pallets;
        this.results.lastCalculation = new Date();
        this.notifyChange('results');
    }

    validateCarton(carton) {
        const errors = [];
        
        if (!carton.code || carton.code.trim() === '') {
            errors.push('貨物コードは必須です');
        }
        
        if (!carton.qty || carton.qty <= 0 || carton.qty > 10000) {
            errors.push('数量は1〜10000の範囲で入力してください');
        }
        
        if (!carton.weight || carton.weight <= 0 || carton.weight > 1000) {
            errors.push('重量は0.1〜1000kgの範囲で入力してください');
        }
        
        if (!carton.l || carton.l <= 0 || carton.l > 500) {
            errors.push('長さは1〜500cmの範囲で入力してください');
        }
        
        if (!carton.w || carton.w <= 0 || carton.w > 500) {
            errors.push('幅は1〜500cmの範囲で入力してください');
        }
        
        if (!carton.h || carton.h <= 0 || carton.h > 200) {
            errors.push('高さは1〜200cmの範囲で入力してください');
        }
        
        if (errors.length > 0) {
            return { error: errors.join(', ') };
        }
        
        return {
            data: {
                code: carton.code.trim(),
                qty: parseInt(carton.qty),
                weight: parseFloat(carton.weight),
                l: parseFloat(carton.l),
                w: parseFloat(carton.w),
                h: parseFloat(carton.h)
            }
        };
    }

    getStatistics() {
        const totalCartons = this.cartonData.reduce((sum, item) => sum + item.qty, 0);
        const totalWeight = this.cartonData.reduce((sum, item) => sum + (item.qty * item.weight), 0);
        const itemCount = this.cartonData.length;
        
        return {
            totalCartons,
            totalWeight,
            itemCount
        };
    }

    // Observer パターン
    listeners = new Map();

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        return () => {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        };
    }

    notifyChange(event, data = null) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in state listener for ${event}:`, error);
                }
            });
        }
    }

    addError(error) {
        this.ui.errors.push({
            message: error,
            timestamp: new Date()
        });
        this.notifyChange('error', error);
    }

    clearErrors() {
        this.ui.errors = [];
        this.notifyChange('error', null);
    }

    addNotification(message, type = 'info') {
        const notification = {
            message,
            type,
            timestamp: new Date(),
            id: Date.now()
        };
        this.ui.notifications.push(notification);
        this.notifyChange('notification', notification);
        
        setTimeout(() => {
            this.removeNotification(notification.id);
        }, 5000);
    }

    removeNotification(id) {
        const index = this.ui.notifications.findIndex(n => n.id === id);
        if (index > -1) {
            this.ui.notifications.splice(index, 1);
            this.notifyChange('notification', null);
        }
    }

    exportData() {
        return {
            cartonData: this.cartonData,
            palletConfig: this.palletConfig,
            timestamp: new Date().toISOString()
        };
    }

    importData(data) {
        try {
            if (data.cartonData) {
                this.cartonData = data.cartonData;
            }
            if (data.palletConfig) {
                this.palletConfig = { ...this.palletConfig, ...data.palletConfig };
            }
            this.notifyChange('import', data);
            return { success: true };
        } catch (error) {
            return { success: false, error: error.message };
        }
    }
}

// ==================== エラーハンドリングモジュール ====================
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}

class CalculationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'CalculationError';
    }
}

class ImportError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ImportError';
    }
}

class ErrorHandler {
    constructor(appState) {
        this.appState = appState;
        this.setupGlobalErrorHandlers();
    }

    setupGlobalErrorHandlers() {
        window.addEventListener('error', (event) => {
            console.error('Global error:', event.error);
            this.handleError(event.error, 'システムエラー');
            event.preventDefault();
        });

        window.addEventListener('unhandledrejection', (event) => {
            console.error('Unhandled promise rejection:', event.reason);
            this.handleError(event.reason, '非同期処理エラー');
            event.preventDefault();
        });
    }

    handleError(error, context = '') {
        let userMessage = '';
        let technicalDetails = '';
        let severity = 'error';

        if (error instanceof ValidationError) {
            userMessage = error.message;
            severity = 'warning';
        } else if (error instanceof CalculationError) {
            userMessage = `計算エラー: ${error.message}`;
            severity = 'error';
        } else if (error instanceof ImportError) {
            userMessage = `インポートエラー: ${error.message}`;
            severity = 'warning';
        } else if (error instanceof Error) {
            userMessage = this.getUserFriendlyMessage(error.message);
            technicalDetails = error.stack;
        } else if (typeof error === 'string') {
            userMessage = error;
        } else {
            userMessage = '予期しないエラーが発生しました';
            technicalDetails = JSON.stringify(error);
        }

        if (context) {
            userMessage = `${context}: ${userMessage}`;
        }

        this.logError(error, context, technicalDetails);
        this.displayError(userMessage, severity);

        this.appState.addError({
            message: userMessage,
            severity,
            context,
            timestamp: new Date(),
            technical: technicalDetails
        });

        return {
            handled: true,
            userMessage,
            severity
        };
    }

    getUserFriendlyMessage(technicalMessage) {
        const messageMap = {
            'Network error': 'ネットワークエラーが発生しました。接続を確認してください。',
            'Invalid input': '入力値が正しくありません。確認してください。',
            'Calculation failed': '計算処理に失敗しました。データを確認してください。',
            'Memory limit exceeded': 'メモリ不足です。データ量を減らしてください。',
            'Invalid carton index': '指定された貨物が見つかりません。',
            'No pallets available': '利用可能なパレットがありません。',
            'Height limit exceeded': '高さ制限を超えています。設定を確認してください。'
        };

        for (const [key, value] of Object.entries(messageMap)) {
            if (technicalMessage.toLowerCase().includes(key.toLowerCase())) {
                return value;
            }
        }

        return '処理中にエラーが発生しました。もう一度お試しください。';
    }

    displayError(message, severity = 'error') {
        const existingAlerts = document.querySelectorAll('.error-alert');
        existingAlerts.forEach(alert => {
            if (alert.dataset.autoRemove === 'true') {
                alert.remove();
            }
        });

        const errorContainer = document.getElementById('errors') || this.createErrorContainer();
        
        const alertDiv = document.createElement('div');
        alertDiv.className = `alert alert-${severity} error-alert`;
        alertDiv.dataset.autoRemove = 'true';
        
        const icon = this.getIconForSeverity(severity);
        const closeButton = '<button class="close-alert" onclick="this.parentElement.remove()">×</button>';
        
        alertDiv.innerHTML = `
            <div class="alert-content">
                <span class="alert-icon">${icon}</span>
                <span class="alert-message">${this.escapeHtml(message)}</span>
                ${closeButton}
            </div>
        `;
        
        errorContainer.appendChild(alertDiv);

        if (severity !== 'error') {
            setTimeout(() => {
                if (alertDiv.parentElement) {
                    alertDiv.style.opacity = '0';
                    setTimeout(() => alertDiv.remove(), 300);
                }
            }, 5000);
        }
    }

    createErrorContainer() {
        const container = document.createElement('div');
        container.id = 'errors';
        container.className = 'error-container';
        document.body.insertBefore(container, document.body.firstChild);
        return container;
    }

    getIconForSeverity(severity) {
        const icons = {
            info: 'ℹ️',
            warning: '⚠️',
            error: '❌',
            success: '✅'
        };
        return icons[severity] || icons.info;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    logError(error, context, details) {
        const logEntry = {
            timestamp: new Date().toISOString(),
            context,
            message: error?.message || error,
            stack: error?.stack,
            details,
            userAgent: navigator.userAgent
        };

        console.error('Error Log:', logEntry);

        try {
            const logs = JSON.parse(localStorage.getItem('errorLogs') || '[]');
            logs.unshift(logEntry);
            if (logs.length > 10) {
                logs.length = 10;
            }
            localStorage.setItem('errorLogs', JSON.stringify(logs));
        } catch (e) {
            console.error('Failed to save error log:', e);
        }
    }
}

// ==================== パレット計算モジュール（簡略版） ====================
class PalletCalculator {
    constructor(appState) {
        this.appState = appState;
        this.calculationCache = new Map();
    }

    async calculateOptimizedPalletization() {
        const startTime = performance.now();
        
        try {
            if (this.appState.cartonData.length === 0) {
                throw new CalculationError('貨物データがありません');
            }

            if (this.appState.palletConfig.selectedSizes.length === 0) {
                throw new CalculationError('パレットサイズを選択してください');
            }

            const items = this.prepareItems();
            const palletSizes = this.appState.palletConfig.selectedSizes;
            const maxHeight = this.appState.palletConfig.maxHeightLimit;

            const results = await this.calculateInBatches(items, palletSizes, maxHeight);

            const endTime = performance.now();
            console.log(`Calculation completed in ${(endTime - startTime).toFixed(2)}ms`);

            return results;
        } catch (error) {
            throw new CalculationError(`計算エラー: ${error.message}`);
        }
    }

    async calculateInBatches(items, palletSizes, maxHeight) {
        const pallets = [];
        const remainingItems = items.map(item => ({ ...item }));
        
        remainingItems.sort((a, b) => b.remaining - a.remaining);

        while (this.hasRemainingItems(remainingItems)) {
            let bestPallet = null;
            let bestScore = -1;

            for (const palletSize of palletSizes) {
                const pallet = await this.calculateSinglePallet(
                    remainingItems, 
                    palletSize, 
                    maxHeight
                );
                
                if (pallet) {
                    const score = this.calculatePalletScore(pallet);
                    if (score > bestScore) {
                        bestScore = score;
                        bestPallet = pallet;
                    }
                }
            }

            if (!bestPallet) {
                console.warn('No more pallets can be created');
                break;
            }

            this.updateRemainingItems(remainingItems, bestPallet);
            pallets.push(bestPallet);
        }

        return pallets;
    }

    async calculateSinglePallet(items, palletSize, maxHeight) {
        const layers = [];
        let currentHeight = 14;
        let totalWeight = 0;
        const placedCartons = [];

        const availableItems = items.filter(item => 
            item.remaining > 0 && 
            item.h <= (maxHeight - 14)
        );

        if (availableItems.length === 0) {
            return null;
        }

        while (currentHeight < maxHeight && availableItems.some(item => item.remaining > 0)) {
            const availableHeight = maxHeight - currentHeight;
            const layer = this.createOptimizedLayer(
                availableItems, 
                palletSize, 
                availableHeight
            );

            if (!layer || layer.cartons.length === 0) {
                break;
            }

            layers.push(layer);
            placedCartons.push(...layer.cartons);
            totalWeight += layer.weight;
            currentHeight += layer.height;

            layer.cartons.forEach(carton => {
                const item = availableItems.find(i => i.code === carton.code);
                if (item) {
                    item.remaining--;
                }
            });
        }

        if (placedCartons.length === 0) {
            return null;
        }

        return {
            palletSize,
            cartons: placedCartons,
            layers,
            height: currentHeight,
            totalWeight,
            efficiency: this.calculateEfficiency(placedCartons, palletSize, currentHeight)
        };
    }

    createOptimizedLayer(items, palletSize, maxHeight) {
        const sortedItems = items
            .filter(item => item.remaining > 0 && item.h <= maxHeight)
            .sort((a, b) => b.h - a.h);

        if (sortedItems.length === 0) {
            return null;
        }

        const layer = {
            cartons: [],
            height: 0,
            weight: 0
        };

        const grid = this.createGrid(palletSize);
        
        for (const item of sortedItems) {
            if (item.remaining === 0) continue;

            const placement = this.findBestPlacement(item, grid, palletSize);
            if (placement) {
                layer.cartons.push({
                    code: item.code,
                    weight: item.weight,
                    l: item.l,
                    w: item.w,
                    h: item.h,
                    position: placement
                });
                
                layer.height = Math.max(layer.height, item.h);
                layer.weight += item.weight;
                
                this.updateGrid(grid, placement, item);
                
                if (layer.cartons.length >= 20) {
                    break;
                }
            }
        }

        return layer.cartons.length > 0 ? layer : null;
    }

    createGrid(palletSize) {
        const cellSize = 5;
        const width = Math.ceil(palletSize.width / cellSize);
        const depth = Math.ceil(palletSize.depth / cellSize);
        
        return {
            data: new Array(width * depth).fill(0),
            width,
            depth,
            cellSize
        };
    }

    findBestPlacement(item, grid, palletSize) {
        const positions = [];
        
        const orientations = [
            { l: item.l, w: item.w },
            { l: item.w, w: item.l }
        ];

        for (const orient of orientations) {
            for (let x = 0; x <= palletSize.width - orient.l; x += 5) {
                for (let y = 0; y <= palletSize.depth - orient.w; y += 5) {
                    if (this.canPlace(grid, x, y, orient.l, orient.w)) {
                        positions.push({
                            x,
                            y,
                            rotated: orient.l !== item.l
                        });
                    }
                }
            }
        }

        if (positions.length > 0) {
            positions.sort((a, b) => {
                const scoreA = a.x + a.y;
                const scoreB = b.x + b.y;
                return scoreA - scoreB;
            });
            return positions[0];
        }

        return null;
    }

    canPlace(grid, x, y, length, width) {
        const startX = Math.floor(x / grid.cellSize);
        const startY = Math.floor(y / grid.cellSize);
        const endX = Math.ceil((x + length) / grid.cellSize);
        const endY = Math.ceil((y + width) / grid.cellSize);

        if (endX > grid.width || endY > grid.depth) {
            return false;
        }

        for (let i = startX; i < endX; i++) {
            for (let j = startY; j < endY; j++) {
                if (grid.data[j * grid.width + i] !== 0) {
                    return false;
                }
            }
        }

        return true;
    }

    updateGrid(grid, placement, item) {
        const length = placement.rotated ? item.w : item.l;
        const width = placement.rotated ? item.l : item.w;
        
        const startX = Math.floor(placement.x / grid.cellSize);
        const startY = Math.floor(placement.y / grid.cellSize);
        const endX = Math.ceil((placement.x + length) / grid.cellSize);
        const endY = Math.ceil((placement.y + width) / grid.cellSize);

        for (let i = startX; i < endX; i++) {
            for (let j = startY; j < endY; j++) {
                grid.data[j * grid.width + i] = 1;
            }
        }
    }

    calculatePalletScore(pallet) {
        const volumeEfficiency = this.calculateVolumeEfficiency(pallet);
        const heightEfficiency = (pallet.height / this.appState.palletConfig.maxHeightLimit);
        const itemDiversity = new Set(pallet.cartons.map(c => c.code)).size;
        
        return (
            volumeEfficiency * 100 +
            heightEfficiency * 50 +
            itemDiversity * 10 +
            pallet.cartons.length * 5
        );
    }

    calculateVolumeEfficiency(pallet) {
        const usedVolume = pallet.cartons.reduce((sum, carton) => 
            sum + (carton.l * carton.w * carton.h), 0
        );
        const availableVolume = pallet.palletSize.width * 
            pallet.palletSize.depth * 
            (pallet.height - 14);
        
        return usedVolume / availableVolume;
    }

    calculateEfficiency(cartons, palletSize, height) {
        const area = cartons.reduce((sum, c) => sum + (c.l * c.w), 0);
        const palletArea = palletSize.width * palletSize.depth;
        const layers = Math.ceil((height - 14) / 20);
        
        return (area / (palletArea * layers)) * 100;
    }

    prepareItems() {
        return this.appState.cartonData.map(item => ({
            code: item.code,
            weight: item.weight,
            l: item.l,
            w: item.w,
            h: item.h,
            remaining: item.qty
        }));
    }

    hasRemainingItems(items) {
        return items.some(item => item.remaining > 0);
    }

    updateRemainingItems(items, pallet) {
        pallet.cartons.forEach(carton => {
            const item = items.find(i => i.code === carton.code);
            if (item && item.remaining > 0) {
                item.remaining--;
            }
        });
    }
}

// ==================== メインアプリケーション ====================
class PalletizerApp {
    constructor() {
        this.state = new AppState();
        this.errorHandler = new ErrorHandler(this.state);
        this.calculator = new PalletCalculator(this.state);
        this.uiController = null;
    }

    async init() {
        try {
            console.log('Initializing Palletizer App v2.0...');

            // UI初期化
            this.setupUI();

            // デフォルトパレットサイズを設定
            this.state.setSelectedPalletSizes(this.state.palletConfig.allSizes);

            // グローバル関数の設定
            this.setupGlobalFunctions();

            // 初期データのロード
            this.loadSavedData();

            console.log('Palletizer App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.errorHandler?.handleError(error, 'アプリケーション初期化');
        }
    }

    setupUI() {
        // イベントリスナーの設定
        document.getElementById('addButton')?.addEventListener('click', () => this.toggleAddForm());
        document.getElementById('saveAddButton')?.addEventListener('click', () => this.saveCarton());
        document.getElementById('cancelAddButton')?.addEventListener('click', () => this.cancelAdd());
        document.getElementById('calculateButton')?.addEventListener('click', () => this.executeCalculation());
        document.getElementById('clearAllButton')?.addEventListener('click', () => this.clearAllCartons());
        document.getElementById('importButton')?.addEventListener('click', () => this.toggleImportArea());
        document.getElementById('executeImportButton')?.addEventListener('click', () => this.executeImport());
        document.getElementById('cancelImportButton')?.addEventListener('click', () => this.cancelImport());
        document.getElementById('downloadTemplateButton')?.addEventListener('click', () => this.downloadTemplate());
        document.getElementById('exportButton')?.addEventListener('click', () => this.exportResults());
        document.getElementById('selectAllPallets')?.addEventListener('click', () => this.selectAllPallets());
        document.getElementById('deselectAllPallets')?.addEventListener('click', () => this.deselectAllPallets());

        // 高さ制限入力
        const heightInput = document.getElementById('heightLimitInput');
        if (heightInput) {
            heightInput.addEventListener('input', (e) => {
                this.state.setMaxHeightLimit(parseInt(e.target.value));
                this.updateHeightDisplay();
            });
        }

        // 状態変更の購読
        this.state.subscribe('cartonData', () => {
            this.updateTable();
            this.updateSummary();
        });

        this.state.subscribe('palletConfig', () => {
            this.updatePalletSelection();
            this.updateHeightDisplay();
        });

        this.state.subscribe('results', () => {
            this.updateResults();
        });

        // 初期表示更新
        this.updateAll();
    }

    setupGlobalFunctions() {
        window.palletizerApp = this;
        window.setHeightLimit = (height) => {
            this.state.setMaxHeightLimit(height);
            this.updateHeightDisplay();
        };
    }

    async executeCalculation() {
        try {
            this.showLoading();
            const results = await this.calculator.calculateOptimizedPalletization();
            this.state.setCalculationResults(results);
            this.state.addNotification(
                `計算完了: ${results.length}枚のパレットを生成しました`,
                'success'
            );
        } catch (error) {
            this.errorHandler.handleError(error, 'パレタイズ計算');
        } finally {
            this.hideLoading();
        }
    }

    // UI更新メソッド
    updateTable() {
        const tbody = document.getElementById('cartonTableBody');
        if (!tbody) return;

        tbody.innerHTML = this.state.cartonData.map((item, index) => `
            <tr>
                <td>${this.escapeHtml(item.code)}</td>
                <td class="center">${item.qty}</td>
                <td class="center">${item.weight}</td>
                <td class="center mono">${item.l} × ${item.w} × ${item.h}</td>
                <td class="center">
                    <div class="action-buttons">
                        <button class="btn btn-sm btn-primary" onclick="palletizerApp.editCarton(${index})">編集</button>
                        <button class="btn btn-sm btn-danger" onclick="palletizerApp.deleteCarton(${index})">削除</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    updateSummary() {
        const stats = this.state.getStatistics();
        
        const totalCartons = document.getElementById('totalCartons');
        if (totalCartons) totalCartons.textContent = stats.totalCartons.toLocaleString();
        
        const totalWeight = document.getElementById('totalWeight');
        if (totalWeight) totalWeight.textContent = `${stats.totalWeight.toFixed(1)} kg`;
        
        const itemCount = document.getElementById('itemCount');
        if (itemCount) itemCount.textContent = stats.itemCount.toLocaleString();
    }

    updatePalletSelection() {
        const container = document.getElementById('palletOptions');
        if (!container) return;

        container.innerHTML = this.state.palletConfig.allSizes.map((pallet, index) => {
            const isSelected = this.state.palletConfig.selectedSizes.includes(pallet);
            return `
                <div class="pallet-option ${isSelected ? 'selected' : ''}" onclick="palletizerApp.togglePalletSelection(${index})">
                    <input type="checkbox" class="pallet-checkbox" ${isSelected ? 'checked' : ''}>
                    <div class="pallet-option-info">
                        <div class="pallet-option-name">${this.escapeHtml(pallet.name)}</div>
                        <div class="pallet-option-size">
                            ${this.escapeHtml(pallet.description)} - 
                            ${pallet.width}cm × ${pallet.depth}cm
                        </div>
                    </div>
                </div>
            `;
        }).join('');

        this.updateSelectedPalletsInfo();
    }

    updateSelectedPalletsInfo() {
        const info = document.getElementById('selectedPalletsInfo');
        const count = this.state.palletConfig.selectedSizes.length;
        
        if (!info) return;
        
        if (count === 0) {
            info.textContent = '⚠️ パレット種類を選択してください';
            info.style.color = '#dc2626';
        } else if (count === this.state.palletConfig.allSizes.length) {
            info.textContent = `✅ 全${count}種類のパレットで最適化計算`;
            info.style.color = '#16a34a';
        } else {
            info.textContent = `✅ ${count}種類のパレットで最適化計算`;
            info.style.color = '#2563eb';
        }
    }

    updateHeightDisplay() {
        const limit = this.state.palletConfig.maxHeightLimit;
        const display = document.getElementById('heightLimitDisplay');
        if (display) display.textContent = limit;
        
        const available = document.getElementById('availableHeight');
        if (available) available.textContent = limit - 14;
        
        const input = document.getElementById('heightLimitInput');
        if (input && input.value !== limit.toString()) {
            input.value = limit;
        }

        // プリセットボタンの更新
        document.querySelectorAll('.height-preset-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        
        const activeBtn = document.querySelector(`[onclick="setHeightLimit(${limit})"]`);
        if (activeBtn) {
            activeBtn.classList.add('active');
        }

        // 警告表示
        const warning = document.getElementById('heightWarning');
        if (warning) {
            if (limit > 180) {
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        }
    }

    updateResults() {
        const results = this.state.results.currentPallets;
        const resultsDiv = document.getElementById('results');
        
        if (!results || results.length === 0) {
            if (resultsDiv) resultsDiv.classList.add('hidden');
            return;
        }

        if (resultsDiv) resultsDiv.classList.remove('hidden');
        
        // パレット結果の表示
        const container = document.getElementById('palletResults');
        if (container) {
            container.innerHTML = results.map((pallet, index) => {
                const heightStatus = pallet.height <= this.state.palletConfig.maxHeightLimit ? '✅' : '⚠️';
                const cartonCounts = this.getCartonCounts(pallet.cartons);
                
                return `
                    <div class="pallet-card" id="pallet-${index}">
                        <div class="pallet-header">
                            <h3>パレット ${index + 1} ${heightStatus}</h3>
                            <span class="pallet-type">${this.escapeHtml(pallet.palletSize.name)}</span>
                        </div>
                        <div class="pallet-info">
                            <div>📦 ${pallet.cartons.length}個</div>
                            <div>📏 ${pallet.height.toFixed(1)}cm</div>
                            <div>⚖️ ${pallet.totalWeight.toFixed(1)}kg</div>
                        </div>
                        <div class="pallet-items">
                            ${this.formatCartonCounts(cartonCounts)}
                        </div>
                        <div class="pallet-visualization">
                            <div class="layers-view">
                                ${pallet.layers.map((layer, i) => `
                                    <div class="layer">
                                        層${i + 1}: ${layer.cartons.length}個 (${layer.height.toFixed(1)}cm)
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // サマリーテーブルの更新
        this.updateSummaryTable(results);
    }

    updateSummaryTable(pallets) {
        const tbody = document.getElementById('summaryBody');
        if (!tbody) return;

        tbody.innerHTML = pallets.map((pallet, index) => {
            const counts = this.getCartonCounts(pallet.cartons);
            const heightOk = pallet.height <= this.state.palletConfig.maxHeightLimit;
            
            return `
                <tr ${!heightOk ? 'style="background-color: #fef2f2;"' : ''}>
                    <td>${index + 1} ${heightOk ? '✅' : '⚠️'}</td>
                    <td>${pallet.palletSize.width}×${pallet.palletSize.depth}×${pallet.height.toFixed(1)}</td>
                    <td>${pallet.totalWeight.toFixed(1)}</td>
                    <td>${Object.keys(counts).join(', ')}</td>
                    <td>${Object.values(counts).join(', ')}</td>
                </tr>
            `;
        }).join('');
    }

    getCartonCounts(cartons) {
        const counts = {};
        cartons.forEach(carton => {
            counts[carton.code] = (counts[carton.code] || 0) + 1;
        });
        return counts;
    }

    formatCartonCounts(counts) {
        return Object.entries(counts)
            .map(([code, count]) => `${this.escapeHtml(code)}: ${count}個`)
            .join(', ');
    }

    updateAll() {
        this.updateTable();
        this.updateSummary();
        this.updatePalletSelection();
        this.updateHeightDisplay();
        this.updateResults();
    }

    // UI操作メソッド
    toggleAddForm() {
        const form = document.getElementById('addForm');
        if (form) form.classList.toggle('hidden');
    }

    toggleImportArea() {
        const area = document.getElementById('importArea');
        if (area) area.classList.toggle('hidden');
    }

    async saveCarton() {
        try {
            const formData = {
                code: document.getElementById('addCode')?.value || '',
                qty: document.getElementById('addQty')?.value || 0,
                weight: document.getElementById('addWeight')?.value || 0,
                l: document.getElementById('addLength')?.value || 0,
                w: document.getElementById('addWidth')?.value || 0,
                h: document.getElementById('addHeight')?.value || 0
            };
            
            this.state.addCarton(formData);
            this.clearForm();
            this.toggleAddForm();
            this.state.addNotification('貨物を追加しました', 'success');
        } catch (error) {
            this.errorHandler.handleError(error, '貨物追加');
        }
    }

    cancelAdd() {
        this.clearForm();
        this.toggleAddForm();
    }

    clearForm() {
        ['addCode', 'addQty', 'addWeight', 'addLength', 'addWidth', 'addHeight']
            .forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
    }

    editCarton(index) {
        const carton = this.state.cartonData[index];
        if (!carton) return;

        document.getElementById('addCode').value = carton.code;
        document.getElementById('addQty').value = carton.qty;
        document.getElementById('addWeight').value = carton.weight;
        document.getElementById('addLength').value = carton.l;
        document.getElementById('addWidth').value = carton.w;
        document.getElementById('addHeight').value = carton.h;

        this.editingIndex = index;
        this.toggleAddForm();
    }

    deleteCarton(index) {
        if (confirm('この貨物を削除しますか？')) {
            this.state.deleteCarton(index);
            this.state.addNotification('貨物を削除しました', 'info');
        }
    }

    clearAllCartons() {
        if (this.state.cartonData.length === 0) {
            alert('削除するデータがありません');
            return;
        }

        if (confirm('すべての貨物データを削除しますか？')) {
            this.state.clearAllCartons();
            document.getElementById('results')?.classList.add('hidden');
            this.state.addNotification('すべての貨物データを削除しました', 'success');
        }
    }

    togglePalletSelection(index) {
        const pallet = this.state.palletConfig.allSizes[index];
        const selected = [...this.state.palletConfig.selectedSizes];
        
        const existingIndex = selected.findIndex(p => p.name === pallet.name);
        
        if (existingIndex >= 0) {
            selected.splice(existingIndex, 1);
        } else {
            selected.push(pallet);
        }
        
        this.state.setSelectedPalletSizes(selected);
    }

    selectAllPallets() {
        this.state.setSelectedPalletSizes([...this.state.palletConfig.allSizes]);
    }

    deselectAllPallets() {
        this.state.setSelectedPalletSizes([]);
    }

    downloadTemplate() {
        const template = [
            ['貨物コード', '数量', '重量(kg)', '長さ(cm)', '幅(cm)', '高さ(cm)'],
            ['SAMPLE-A', '100', '5.5', '40.0', '30.0', '25.0'],
            ['SAMPLE-B', '50', '7.2', '45.0', '35.0', '20.0']
        ];
        
        const csvContent = template.map(row => row.join(',')).join('\n');
        this.downloadFile(csvContent, 'palletizer_template.csv', 'text/csv');
        
        this.state.addNotification('テンプレートをダウンロードしました', 'success');
    }

    async executeImport() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput?.files[0];
        
        if (!file) {
            alert('ファイルを選択してください');
            return;
        }

        try {
            const text = await this.readFileAsText(file);
            const data = this.parseCSV(text);
            
            if (data.length === 0) {
                throw new ImportError('有効なデータが含まれていません');
            }

            data.forEach(item => {
                this.state.addCarton(item);
            });

            this.state.addNotification(`${data.length}件のデータをインポートしました`, 'success');
            this.cancelImport();
        } catch (error) {
            this.errorHandler.handleError(error, 'CSVインポート');
        }
    }

    cancelImport() {
        const area = document.getElementById('importArea');
        if (area) area.classList.add('hidden');
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) fileInput.value = '';
    }

    parseCSV(text) {
        if (text.charCodeAt(0) === 0xFEFF) {
            text = text.substr(1);
        }

        const lines = text.split(/\r?\n/).filter(line => line.trim());
        
        if (lines.length < 2) {
            throw new ImportError('CSVファイルにデータが含まれていません');
        }

        const data = [];
        
        for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',').map(col => col.trim());
            
            if (columns.length < 6) continue;
            
            const [code, qtyStr, weightStr, lStr, wStr, hStr] = columns;
            
            data.push({
                code: code,
                qty: parseInt(qtyStr),
                weight: parseFloat(weightStr),
                l: parseFloat(lStr),
                w: parseFloat(wStr),
                h: parseFloat(hStr)
            });
        }

        return data;
    }

    exportResults() {
        const pallets = this.state.results.currentPallets;
        
        if (!pallets || pallets.length === 0) {
            alert('エクスポートするデータがありません');
            return;
        }

        const data = [
            [`パレタイズ結果 (高さ制限: ${this.state.palletConfig.maxHeightLimit}cm)`],
            [],
            ['パレットNo', 'サイズ(cm)', '高さ(cm)', '重量(kg)', 'カートン数']
        ];
        
        pallets.forEach((pallet, index) => {
            data.push([
                index + 1,
                `${pallet.palletSize.width}×${pallet.palletSize.depth}`,
                pallet.height.toFixed(1),
                pallet.totalWeight.toFixed(1),
                pallet.cartons.length
            ]);
        });
        
        const csvContent = data.map(row => row.join(',')).join('\n');
        const timestamp = new Date().toISOString().slice(0, 19).replace(/:/g, '-');
        this.downloadFile(csvContent, `palletization_${timestamp}.csv`, 'text/csv');
        
        this.state.addNotification('結果をエクスポートしました', 'success');
    }

    downloadFile(content, filename, mimeType) {
        const bom = '\uFEFF';
        const blob = new Blob([bom + content], { type: `${mimeType};charset=utf-8;` });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        
        link.href = url;
        link.download = filename;
        link.style.display = 'none';
        
        document.body.appendChild(link);
        link.click();
        
        setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        }, 100);
    }

    readFileAsText(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => resolve(e.target.result);
            reader.onerror = (e) => reject(new Error('ファイル読み込みエラー'));
            reader.readAsText(file, 'UTF-8');
        });
    }

    showLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.classList.add('show');
    }

    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) loading.classList.remove('show');
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    loadSavedData() {
        try {
            const saved = localStorage.getItem('palletizerData');
            if (saved) {
                const data = JSON.parse(saved);
                this.state.importData(data);
                console.log('Loaded saved data');
            }
        } catch (error) {
            console.error('Failed to load saved data:', error);
        }
    }

    saveData() {
        try {
            const data = this.state.exportData();
            localStorage.setItem('palletizerData', JSON.stringify(data));
            console.log('Data saved');
        } catch (error) {
            console.error('Failed to save data:', error);
        }
    }
}

// アプリケーションの起動
document.addEventListener('DOMContentLoaded', async () => {
    const app = new PalletizerApp();
    await app.init();
    window.palletizerApp = app;
});