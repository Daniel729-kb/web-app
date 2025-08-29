/**
 * UIコントローラーモジュール
 * DOM操作を効率的に管理
 */

import { ValidationError } from './errorHandler.js';

export class UIController {
    constructor(appState, errorHandler) {
        this.appState = appState;
        this.errorHandler = errorHandler;
        this.domCache = new Map();
        this.updateQueue = [];
        this.isUpdating = false;
    }

    /**
     * 初期化
     */
    init() {
        this.cacheElements();
        this.setupEventListeners();
        this.subscribeToStateChanges();
        this.updateAll();
    }

    /**
     * DOM要素のキャッシュ
     */
    cacheElements() {
        const elementIds = [
            'totalCartons', 'totalWeight', 'itemCount',
            'cartonTableBody', 'addForm', 'importArea',
            'results', 'palletResults', 'summaryBody',
            'errors', 'heightLimitInput', 'heightLimitDisplay',
            'palletOptions', 'selectedPalletsInfo'
        ];

        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.domCache.set(id, element);
            }
        });
    }

    /**
     * イベントリスナーの設定
     */
    setupEventListeners() {
        // ボタンイベント
        this.addClickListener('addButton', () => this.toggleAddForm());
        this.addClickListener('saveAddButton', () => this.saveCarton());
        this.addClickListener('cancelAddButton', () => this.cancelAdd());
        this.addClickListener('calculateButton', () => this.startCalculation());
        this.addClickListener('clearAllButton', () => this.clearAllCartons());
        this.addClickListener('importButton', () => this.toggleImportArea());
        this.addClickListener('executeImportButton', () => this.executeImport());
        this.addClickListener('cancelImportButton', () => this.cancelImport());
        this.addClickListener('downloadTemplateButton', () => this.downloadTemplate());
        this.addClickListener('exportButton', () => this.exportResults());

        // 高さ制限入力
        const heightInput = this.getElement('heightLimitInput');
        if (heightInput) {
            heightInput.addEventListener('input', (e) => {
                this.appState.setMaxHeightLimit(parseInt(e.target.value));
            });
        }

        // パレット選択
        this.addClickListener('selectAllPallets', () => this.selectAllPallets());
        this.addClickListener('deselectAllPallets', () => this.deselectAllPallets());
    }

    /**
     * 状態変更の購読
     */
    subscribeToStateChanges() {
        this.appState.subscribe('cartonData', () => {
            this.queueUpdate('table');
            this.queueUpdate('summary');
        });

        this.appState.subscribe('palletConfig', () => {
            this.queueUpdate('palletSelection');
            this.queueUpdate('heightLimit');
        });

        this.appState.subscribe('results', () => {
            this.queueUpdate('results');
        });

        this.appState.subscribe('error', (error) => {
            if (error) {
                this.displayError(error);
            }
        });
    }

    /**
     * 更新をキューに追加（バッチ処理）
     */
    queueUpdate(type) {
        if (!this.updateQueue.includes(type)) {
            this.updateQueue.push(type);
        }

        if (!this.isUpdating) {
            this.processUpdateQueue();
        }
    }

    /**
     * 更新キューの処理
     */
    async processUpdateQueue() {
        this.isUpdating = true;

        while (this.updateQueue.length > 0) {
            const type = this.updateQueue.shift();
            
            try {
                switch (type) {
                    case 'table':
                        this.updateTable();
                        break;
                    case 'summary':
                        this.updateSummary();
                        break;
                    case 'palletSelection':
                        this.updatePalletSelection();
                        break;
                    case 'heightLimit':
                        this.updateHeightLimit();
                        break;
                    case 'results':
                        this.updateResults();
                        break;
                }
            } catch (error) {
                console.error(`Error updating ${type}:`, error);
            }

            // フレームごとに処理を分割
            await this.nextFrame();
        }

        this.isUpdating = false;
    }

    /**
     * 次のフレームまで待機
     */
    nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }

    /**
     * テーブル更新（効率化版）
     */
    updateTable() {
        const tbody = this.getElement('cartonTableBody');
        if (!tbody) return;

        // DocumentFragmentを使用して効率化
        const fragment = document.createDocumentFragment();
        
        this.appState.cartonData.forEach((item, index) => {
            const row = this.createTableRow(item, index);
            fragment.appendChild(row);
        });

        // 一括更新
        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    }

    /**
     * テーブル行作成
     */
    createTableRow(item, index) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${this.escapeHtml(item.code)}</td>
            <td class="center">${item.qty}</td>
            <td class="center">${item.weight}</td>
            <td class="center mono">${item.l} × ${item.w} × ${item.h}</td>
            <td class="center">
                <div class="action-buttons">
                    <button class="btn btn-sm btn-primary" onclick="uiController.editCarton(${index})">編集</button>
                    <button class="btn btn-sm btn-danger" onclick="uiController.deleteCarton(${index})">削除</button>
                </div>
            </td>
        `;
        return row;
    }

    /**
     * サマリー更新
     */
    updateSummary() {
        const stats = this.appState.getStatistics();
        
        this.setTextContent('totalCartons', stats.totalCartons.toLocaleString());
        this.setTextContent('totalWeight', `${stats.totalWeight.toFixed(1)} kg`);
        this.setTextContent('itemCount', stats.itemCount.toLocaleString());
    }

    /**
     * パレット選択UI更新
     */
    updatePalletSelection() {
        const container = this.getElement('palletOptions');
        if (!container) return;

        const fragment = document.createDocumentFragment();
        
        this.appState.palletConfig.allSizes.forEach((pallet, index) => {
            const isSelected = this.appState.palletConfig.selectedSizes.includes(pallet);
            const option = this.createPalletOption(pallet, index, isSelected);
            fragment.appendChild(option);
        });

        container.innerHTML = '';
        container.appendChild(fragment);

        this.updateSelectedPalletsInfo();
    }

    /**
     * パレットオプション作成
     */
    createPalletOption(pallet, index, isSelected) {
        const div = document.createElement('div');
        div.className = `pallet-option ${isSelected ? 'selected' : ''}`;
        div.onclick = () => this.togglePalletSelection(index);
        
        div.innerHTML = `
            <input type="checkbox" class="pallet-checkbox" ${isSelected ? 'checked' : ''}>
            <div class="pallet-option-info">
                <div class="pallet-option-name">${this.escapeHtml(pallet.name)}</div>
                <div class="pallet-option-size">
                    ${this.escapeHtml(pallet.description)} - 
                    ${pallet.width}cm × ${pallet.depth}cm
                </div>
            </div>
        `;
        
        return div;
    }

    /**
     * 高さ制限表示更新
     */
    updateHeightLimit() {
        const limit = this.appState.palletConfig.maxHeightLimit;
        this.setTextContent('heightLimitDisplay', limit);
        
        const input = this.getElement('heightLimitInput');
        if (input && input.value !== limit.toString()) {
            input.value = limit;
        }
    }

    /**
     * 結果表示更新（最適化版）
     */
    updateResults() {
        const results = this.appState.results.currentPallets;
        if (!results || results.length === 0) {
            this.hideResults();
            return;
        }

        this.showResults();
        
        // パレット結果の表示
        const container = this.getElement('palletResults');
        if (container) {
            const fragment = document.createDocumentFragment();
            
            results.forEach((pallet, index) => {
                const card = this.createPalletCard(pallet, index);
                fragment.appendChild(card);
            });

            container.innerHTML = '';
            container.appendChild(fragment);
        }

        // サマリーテーブルの更新
        this.updateSummaryTable(results);
    }

    /**
     * パレットカード作成
     */
    createPalletCard(pallet, index) {
        const card = document.createElement('div');
        card.className = 'pallet-card';
        card.id = `pallet-${index}`;
        
        const heightStatus = pallet.height <= this.appState.palletConfig.maxHeightLimit ? '✅' : '⚠️';
        const cartonCounts = this.getCartonCounts(pallet.cartons);
        
        card.innerHTML = `
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
                ${this.createSimpleVisualization(pallet)}
            </div>
        `;
        
        return card;
    }

    /**
     * カートン数カウント
     */
    getCartonCounts(cartons) {
        const counts = {};
        cartons.forEach(carton => {
            counts[carton.code] = (counts[carton.code] || 0) + 1;
        });
        return counts;
    }

    /**
     * カートン数フォーマット
     */
    formatCartonCounts(counts) {
        return Object.entries(counts)
            .map(([code, count]) => `${this.escapeHtml(code)}: ${count}個`)
            .join(', ');
    }

    /**
     * 簡易ビジュアライゼーション
     */
    createSimpleVisualization(pallet) {
        // 簡略化された視覚表現
        const layers = pallet.layers || [];
        return `
            <div class="layers-view">
                ${layers.map((layer, i) => `
                    <div class="layer">
                        層${i + 1}: ${layer.cartons.length}個 (${layer.height.toFixed(1)}cm)
                    </div>
                `).join('')}
            </div>
        `;
    }

    /**
     * サマリーテーブル更新
     */
    updateSummaryTable(pallets) {
        const tbody = this.getElement('summaryBody');
        if (!tbody) return;

        const fragment = document.createDocumentFragment();
        
        pallets.forEach((pallet, index) => {
            const row = this.createSummaryRow(pallet, index);
            fragment.appendChild(row);
        });

        tbody.innerHTML = '';
        tbody.appendChild(fragment);
    }

    /**
     * サマリー行作成
     */
    createSummaryRow(pallet, index) {
        const row = document.createElement('tr');
        const counts = this.getCartonCounts(pallet.cartons);
        const heightOk = pallet.height <= this.appState.palletConfig.maxHeightLimit;
        
        row.innerHTML = `
            <td>${index + 1} ${heightOk ? '✅' : '⚠️'}</td>
            <td>${pallet.palletSize.width}×${pallet.palletSize.depth}×${pallet.height.toFixed(1)}</td>
            <td>${pallet.totalWeight.toFixed(1)}</td>
            <td>${Object.keys(counts).join(', ')}</td>
            <td>${Object.values(counts).join(', ')}</td>
        `;
        
        if (!heightOk) {
            row.style.backgroundColor = '#fef2f2';
        }
        
        return row;
    }

    /**
     * フォーム表示切り替え
     */
    toggleAddForm() {
        const form = this.getElement('addForm');
        if (form) {
            form.classList.toggle('hidden');
        }
    }

    /**
     * インポートエリア表示切り替え
     */
    toggleImportArea() {
        const area = this.getElement('importArea');
        if (area) {
            area.classList.toggle('hidden');
        }
    }

    /**
     * カートン保存
     */
    async saveCarton() {
        try {
            const formData = this.getFormData();
            this.appState.addCarton(formData);
            this.clearForm();
            this.toggleAddForm();
            this.showNotification('貨物を追加しました', 'success');
        } catch (error) {
            this.errorHandler.handleError(error, '貨物追加');
        }
    }

    /**
     * フォームデータ取得
     */
    getFormData() {
        return {
            code: document.getElementById('addCode')?.value || '',
            qty: document.getElementById('addQty')?.value || 0,
            weight: document.getElementById('addWeight')?.value || 0,
            l: document.getElementById('addLength')?.value || 0,
            w: document.getElementById('addWidth')?.value || 0,
            h: document.getElementById('addHeight')?.value || 0
        };
    }

    /**
     * フォームクリア
     */
    clearForm() {
        ['addCode', 'addQty', 'addWeight', 'addLength', 'addWidth', 'addHeight']
            .forEach(id => {
                const element = document.getElementById(id);
                if (element) element.value = '';
            });
    }

    /**
     * 通知表示
     */
    showNotification(message, type = 'info') {
        this.appState.addNotification(message, type);
    }

    /**
     * エラー表示
     */
    displayError(error) {
        const container = this.getElement('errors');
        if (!container) return;

        const alert = document.createElement('div');
        alert.className = `alert alert-${error.severity || 'error'}`;
        alert.textContent = error.message || error;
        
        container.appendChild(alert);
        
        setTimeout(() => {
            alert.remove();
        }, 5000);
    }

    /**
     * 結果を非表示
     */
    hideResults() {
        const results = this.getElement('results');
        if (results) {
            results.classList.add('hidden');
        }
    }

    /**
     * 結果を表示
     */
    showResults() {
        const results = this.getElement('results');
        if (results) {
            results.classList.remove('hidden');
        }
    }

    /**
     * ヘルパー関数
     */
    getElement(id) {
        return this.domCache.get(id) || document.getElementById(id);
    }

    setTextContent(id, text) {
        const element = this.getElement(id);
        if (element) {
            element.textContent = text;
        }
    }

    addClickListener(id, handler) {
        const element = document.getElementById(id);
        if (element) {
            element.addEventListener('click', handler);
        }
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * 全更新
     */
    updateAll() {
        this.updateTable();
        this.updateSummary();
        this.updatePalletSelection();
        this.updateHeightLimit();
        this.updateResults();
    }

    /**
     * ローディング表示
     */
    showLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.classList.add('show');
        }
    }

    /**
     * ローディング非表示
     */
    hideLoading() {
        const loading = document.getElementById('loadingIndicator');
        if (loading) {
            loading.classList.remove('show');
        }
    }

    /**
     * カートン編集
     */
    editCarton(index) {
        try {
            const carton = this.appState.cartonData[index];
            if (!carton) return;

            // フォームに値を設定
            document.getElementById('addCode').value = carton.code;
            document.getElementById('addQty').value = carton.qty;
            document.getElementById('addWeight').value = carton.weight;
            document.getElementById('addLength').value = carton.l;
            document.getElementById('addWidth').value = carton.w;
            document.getElementById('addHeight').value = carton.h;

            // 編集モードフラグ
            this.editingIndex = index;
            
            // フォーム表示
            this.toggleAddForm();
        } catch (error) {
            this.errorHandler.handleError(error, 'カートン編集');
        }
    }

    /**
     * カートン削除
     */
    deleteCarton(index) {
        try {
            this.appState.deleteCarton(index);
            this.showNotification('貨物を削除しました', 'info');
        } catch (error) {
            this.errorHandler.handleError(error, 'カートン削除');
        }
    }

    /**
     * 全カートン削除
     */
    clearAllCartons() {
        if (this.appState.cartonData.length === 0) {
            this.showNotification('削除するデータがありません', 'warning');
            return;
        }

        const totalCartons = this.appState.cartonData.reduce((sum, item) => sum + item.qty, 0);
        const confirmMessage = `本当にすべての貨物データを削除しますか？\n\n` +
            `削除されるデータ：\n` +
            `・貨物種類: ${this.appState.cartonData.length}種類\n` +
            `・総カートン数: ${totalCartons}個\n\n` +
            `この操作は取り消せません。`;

        if (confirm(confirmMessage)) {
            this.appState.clearAllCartons();
            this.hideResults();
            this.showNotification('すべての貨物データを削除しました', 'success');
        }
    }

    /**
     * パレット選択切り替え
     */
    togglePalletSelection(index) {
        const pallet = this.appState.palletConfig.allSizes[index];
        const selected = [...this.appState.palletConfig.selectedSizes];
        
        const existingIndex = selected.findIndex(p => p.name === pallet.name);
        
        if (existingIndex >= 0) {
            selected.splice(existingIndex, 1);
        } else {
            selected.push(pallet);
        }
        
        this.appState.setSelectedPalletSizes(selected);
    }

    /**
     * 全パレット選択
     */
    selectAllPallets() {
        this.appState.setSelectedPalletSizes([...this.appState.palletConfig.allSizes]);
    }

    /**
     * 全パレット選択解除
     */
    deselectAllPallets() {
        this.appState.setSelectedPalletSizes([]);
    }

    /**
     * 選択パレット情報更新
     */
    updateSelectedPalletsInfo() {
        const info = this.getElement('selectedPalletsInfo');
        const count = this.appState.palletConfig.selectedSizes.length;
        
        if (!info) return;
        
        if (count === 0) {
            info.textContent = '⚠️ パレット種類を選択してください';
            info.style.color = '#dc2626';
        } else if (count === this.appState.palletConfig.allSizes.length) {
            info.textContent = `✅ 全${count}種類のパレットで最適化計算`;
            info.style.color = '#16a34a';
        } else {
            info.textContent = `✅ ${count}種類のパレットで最適化計算`;
            info.style.color = '#2563eb';
        }
    }

    /**
     * 計算開始
     */
    async startCalculation() {
        // app.jsのexecuteCalculationを呼び出す
        if (window.calculateImprovedPalletization) {
            await window.calculateImprovedPalletization();
        }
    }

    /**
     * CSVテンプレートダウンロード
     */
    downloadTemplate() {
        if (window.palletizerApp?.importExport) {
            window.palletizerApp.importExport.downloadTemplate();
        }
    }

    /**
     * CSVインポート実行
     */
    async executeImport() {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput?.files[0];
        
        if (!file) {
            this.showNotification('ファイルを選択してください', 'warning');
            return;
        }

        try {
            if (window.palletizerApp?.importExport) {
                await window.palletizerApp.importExport.importCSV(file);
                this.cancelImport();
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'CSVインポート');
        }
    }

    /**
     * インポートキャンセル
     */
    cancelImport() {
        const area = this.getElement('importArea');
        if (area) {
            area.classList.add('hidden');
        }
        const fileInput = document.getElementById('csvFileInput');
        if (fileInput) {
            fileInput.value = '';
        }
    }

    /**
     * 追加キャンセル
     */
    cancelAdd() {
        this.clearForm();
        this.toggleAddForm();
        this.editingIndex = null;
    }

    /**
     * 結果エクスポート
     */
    exportResults() {
        if (window.palletizerApp?.importExport) {
            window.palletizerApp.importExport.exportResults();
        }
    }
}