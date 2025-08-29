/**
 * メインアプリケーションモジュール
 * 各モジュールを統合して初期化
 */

import { appState } from './state.js';
import { ErrorHandler } from './errorHandler.js';
import { PalletCalculator } from './palletCalculator.js';
import { UIController } from './uiController.js';
import { ImportExport } from './importExport.js';

class PalletizerApp {
    constructor() {
        this.state = appState;
        this.errorHandler = null;
        this.calculator = null;
        this.uiController = null;
        this.importExport = null;
    }

    /**
     * アプリケーション初期化
     */
    async init() {
        try {
            console.log('Initializing Palletizer App...');

            // エラーハンドラー初期化
            this.errorHandler = new ErrorHandler(this.state);

            // 各モジュール初期化
            this.calculator = new PalletCalculator(this.state);
            this.uiController = new UIController(this.state, this.errorHandler);
            this.importExport = new ImportExport(this.state, this.errorHandler);

            // UI初期化
            this.uiController.init();

            // デフォルトパレットサイズを設定
            this.state.setSelectedPalletSizes(this.state.palletConfig.allSizes);

            // グローバル関数の設定（後方互換性のため）
            this.setupGlobalFunctions();

            // 初期データのロード（あれば）
            this.loadSavedData();

            console.log('Palletizer App initialized successfully');
        } catch (error) {
            console.error('Failed to initialize app:', error);
            this.errorHandler?.handleError(error, 'アプリケーション初期化');
        }
    }

    /**
     * グローバル関数の設定（既存コードとの互換性）
     */
    setupGlobalFunctions() {
        // UIコントローラーを公開
        window.uiController = this.uiController;

        // 計算実行関数
        window.calculateImprovedPalletization = async () => {
            await this.executeCalculation();
        };

        // カートン操作
        window.editCarton = (index) => {
            this.uiController.editCarton(index);
        };

        window.deleteCarton = (index) => {
            this.confirmAndDeleteCarton(index);
        };

        // パレット選択
        window.togglePalletSelection = (index) => {
            this.togglePalletSelection(index);
        };

        // 高さ制限設定
        window.setHeightLimit = (height) => {
            this.state.setMaxHeightLimit(height);
        };

        // パレット結合機能
        window.combinePallets = () => {
            this.combinePallets();
        };

        window.autoOptimizePallets = () => {
            this.autoOptimizePallets();
        };
    }

    /**
     * 計算実行
     */
    async executeCalculation() {
        try {
            // UI状態を更新
            this.state.ui.isCalculating = true;
            this.uiController.showLoading();

            // 計算実行
            const results = await this.calculator.calculateOptimizedPalletization();

            // 結果を状態に保存
            this.state.setCalculationResults(results);

            // 成功通知
            this.state.addNotification(
                `計算完了: ${results.length}枚のパレットを生成しました`,
                'success'
            );

        } catch (error) {
            this.errorHandler.handleError(error, 'パレタイズ計算');
        } finally {
            this.state.ui.isCalculating = false;
            this.uiController.hideLoading();
        }
    }

    /**
     * カートン削除確認
     */
    confirmAndDeleteCarton(index) {
        try {
            const carton = this.state.cartonData[index];
            if (!carton) return;

            const confirmed = confirm(
                `貨物「${carton.code}」（${carton.qty}個）を削除しますか？`
            );

            if (confirmed) {
                this.state.deleteCarton(index);
                this.state.addNotification('貨物を削除しました', 'info');
            }
        } catch (error) {
            this.errorHandler.handleError(error, 'カートン削除');
        }
    }

    /**
     * パレット選択切り替え
     */
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

    /**
     * パレット結合
     */
    async combinePallets() {
        try {
            // 結合ロジックの実装
            const pallet1Index = parseInt(document.getElementById('pallet1Select')?.value);
            const pallet2Index = parseInt(document.getElementById('pallet2Select')?.value);
            
            if (isNaN(pallet1Index) || isNaN(pallet2Index) || pallet1Index === pallet2Index) {
                throw new Error('異なる2つのパレットを選択してください');
            }

            const pallets = this.state.results.currentPallets;
            const pallet1 = pallets[pallet1Index];
            const pallet2 = pallets[pallet2Index];

            // 結合処理（簡略版）
            const combinedCartons = [...pallet1.cartons, ...pallet2.cartons];
            
            // 新しいパレットを計算
            const tempState = {
                cartonData: this.convertCartonsToItems(combinedCartons),
                palletConfig: this.state.palletConfig
            };

            // 計算実行
            const calculator = new PalletCalculator(tempState);
            const results = await calculator.calculateOptimizedPalletization();

            if (results && results.length > 0) {
                // 元のパレットを削除
                const newPallets = pallets.filter((_, i) => i !== pallet1Index && i !== pallet2Index);
                newPallets.push(results[0]);
                
                this.state.setCalculationResults(newPallets);
                this.state.addNotification('パレットを結合しました', 'success');
            } else {
                throw new Error('パレット結合に失敗しました');
            }

        } catch (error) {
            this.errorHandler.handleError(error, 'パレット結合');
        }
    }

    /**
     * 自動最適化
     */
    async autoOptimizePallets() {
        try {
            const pallets = this.state.results.currentPallets;
            
            if (!pallets || pallets.length < 2) {
                throw new Error('最適化には2枚以上のパレットが必要です');
            }

            // 最適化候補を探す
            const candidates = this.findOptimizationCandidates(pallets);
            
            if (candidates.length === 0) {
                this.state.addNotification('最適化候補が見つかりませんでした', 'info');
                return;
            }

            // 最適な候補を選択
            const best = candidates[0];
            
            const confirmed = confirm(
                `パレット${best.index1 + 1}と${best.index2 + 1}を結合して最適化しますか？\n` +
                `効率: ${best.efficiency.toFixed(1)}%向上`
            );

            if (confirmed) {
                // 結合実行
                document.getElementById('pallet1Select').value = best.index1;
                document.getElementById('pallet2Select').value = best.index2;
                await this.combinePallets();
            }

        } catch (error) {
            this.errorHandler.handleError(error, '自動最適化');
        }
    }

    /**
     * 最適化候補を探す
     */
    findOptimizationCandidates(pallets) {
        const candidates = [];
        const maxHeight = this.state.palletConfig.maxHeightLimit;

        for (let i = 0; i < pallets.length; i++) {
            for (let j = i + 1; j < pallets.length; j++) {
                const p1 = pallets[i];
                const p2 = pallets[j];
                
                // 結合可能性をチェック
                const totalCartons = p1.cartons.length + p2.cartons.length;
                const estimatedHeight = Math.max(p1.height, p2.height) * 1.2;
                
                if (estimatedHeight <= maxHeight && totalCartons <= 50) {
                    const efficiency = (totalCartons / 50) * 100;
                    candidates.push({
                        index1: i,
                        index2: j,
                        efficiency,
                        totalCartons
                    });
                }
            }
        }

        // 効率でソート
        candidates.sort((a, b) => b.efficiency - a.efficiency);
        return candidates;
    }

    /**
     * カートンをアイテムに変換
     */
    convertCartonsToItems(cartons) {
        const itemMap = new Map();
        
        cartons.forEach(carton => {
            if (itemMap.has(carton.code)) {
                itemMap.get(carton.code).qty++;
            } else {
                itemMap.set(carton.code, {
                    code: carton.code,
                    qty: 1,
                    weight: carton.weight,
                    l: carton.l,
                    w: carton.w,
                    h: carton.h
                });
            }
        });
        
        return Array.from(itemMap.values());
    }

    /**
     * 保存データのロード
     */
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

    /**
     * データの保存
     */
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
    
    // グローバルに公開（デバッグ用）
    window.palletizerApp = app;
});