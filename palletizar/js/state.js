/**
 * アプリケーション状態管理モジュール
 * グローバル変数を削減し、単一の状態オブジェクトで管理
 */

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
            maxHeightLimit: 158 // デフォルト高さ制限
        };
        
        // 計算結果
        this.results = {
            currentPallets: [],
            lastCalculation: null
        };
        
        // UI状態
        this.ui = {
            isCalculating: false,
            currentView: 'input', // 'input' | 'results'
            errors: [],
            notifications: []
        };
    }

    // 貨物データ操作
    addCarton(carton) {
        // 入力検証
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

    // パレット設定操作
    setSelectedPalletSizes(sizes) {
        this.palletConfig.selectedSizes = sizes;
        this.notifyChange('palletConfig');
    }

    setMaxHeightLimit(height) {
        const validated = Math.max(50, Math.min(300, height));
        this.palletConfig.maxHeightLimit = validated;
        this.notifyChange('palletConfig');
    }

    // 結果操作
    setCalculationResults(pallets) {
        this.results.currentPallets = pallets;
        this.results.lastCalculation = new Date();
        this.notifyChange('results');
    }

    // 検証
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

    // 統計情報
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

    // 変更通知（Observer パターン）
    listeners = new Map();

    subscribe(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
        
        // Unsubscribe関数を返す
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

    // エラー管理
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

    // 通知管理
    addNotification(message, type = 'info') {
        const notification = {
            message,
            type,
            timestamp: new Date(),
            id: Date.now()
        };
        this.ui.notifications.push(notification);
        this.notifyChange('notification', notification);
        
        // 5秒後に自動削除
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

    // データのエクスポート/インポート
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

// シングルトンインスタンスをエクスポート
export const appState = new AppState();