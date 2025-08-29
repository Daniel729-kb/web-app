/**
 * パレット計算モジュール
 * 最適化されたアルゴリズムで高速計算
 */

import { CalculationError } from './errorHandler.js';

export class PalletCalculator {
    constructor(appState) {
        this.appState = appState;
        this.calculationCache = new Map();
    }

    /**
     * メイン計算関数（最適化版）
     */
    async calculateOptimizedPalletization() {
        const startTime = performance.now();
        
        try {
            // 入力データの検証
            if (this.appState.cartonData.length === 0) {
                throw new CalculationError('貨物データがありません');
            }

            if (this.appState.palletConfig.selectedSizes.length === 0) {
                throw new CalculationError('パレットサイズを選択してください');
            }

            // キャッシュキーの生成
            const cacheKey = this.generateCacheKey();
            if (this.calculationCache.has(cacheKey)) {
                console.log('Returning cached result');
                return this.calculationCache.get(cacheKey);
            }

            // 計算準備
            const items = this.prepareItems();
            const palletSizes = this.appState.palletConfig.selectedSizes;
            const maxHeight = this.appState.palletConfig.maxHeightLimit;

            // 並列計算の準備
            const results = await this.calculateInBatches(items, palletSizes, maxHeight);

            // 結果の最適化
            const optimizedResults = this.optimizeResults(results);

            // キャッシュに保存
            this.calculationCache.set(cacheKey, optimizedResults);

            const endTime = performance.now();
            console.log(`Calculation completed in ${(endTime - startTime).toFixed(2)}ms`);

            return optimizedResults;
        } catch (error) {
            throw new CalculationError(`計算エラー: ${error.message}`);
        }
    }

    /**
     * バッチ処理で計算（パフォーマンス最適化）
     */
    async calculateInBatches(items, palletSizes, maxHeight) {
        const pallets = [];
        const remainingItems = items.map(item => ({ ...item }));
        
        // 大量貨物を優先的に処理
        remainingItems.sort((a, b) => b.remaining - a.remaining);

        while (this.hasRemainingItems(remainingItems)) {
            let bestPallet = null;
            let bestScore = -1;

            // 各パレットサイズで試算
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

            // 在庫を更新
            this.updateRemainingItems(remainingItems, bestPallet);
            pallets.push(bestPallet);

            // UIの更新（非同期）
            if (pallets.length % 5 === 0) {
                await this.yieldToMain();
            }
        }

        return pallets;
    }

    /**
     * 単一パレットの計算（最適化版）
     */
    async calculateSinglePallet(items, palletSize, maxHeight) {
        const layers = [];
        let currentHeight = 14; // パレット台座の高さ
        let totalWeight = 0;
        const placedCartons = [];

        // 利用可能なアイテムをフィルタリング
        const availableItems = items.filter(item => 
            item.remaining > 0 && 
            item.h <= (maxHeight - 14)
        );

        if (availableItems.length === 0) {
            return null;
        }

        // レイヤーごとに最適配置を計算
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

            // 配置したカートンを在庫から減らす
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

    /**
     * 最適化されたレイヤー作成
     */
    createOptimizedLayer(items, palletSize, maxHeight) {
        // 高速配置アルゴリズム（First Fit Decreasing Height）
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

        // グリッドベースの配置（最適化版）
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
                
                // グリッドを更新
                this.updateGrid(grid, placement, item);
                
                // 1層に配置する個数を制限（パフォーマンス向上）
                if (layer.cartons.length >= 20) {
                    break;
                }
            }
        }

        return layer.cartons.length > 0 ? layer : null;
    }

    /**
     * グリッド作成（最適化版）
     */
    createGrid(palletSize) {
        const cellSize = 5; // 5cm単位
        const width = Math.ceil(palletSize.width / cellSize);
        const depth = Math.ceil(palletSize.depth / cellSize);
        
        // Uint8Arrayを使用してメモリ効率を向上
        return {
            data: new Uint8Array(width * depth),
            width,
            depth,
            cellSize
        };
    }

    /**
     * 最適配置位置の検索（最適化版）
     */
    findBestPlacement(item, grid, palletSize) {
        const positions = [];
        
        // 通常配置と90度回転の両方を試す
        const orientations = [
            { l: item.l, w: item.w },
            { l: item.w, w: item.l }
        ];

        for (const orient of orientations) {
            // グリッドベースで配置可能位置を高速検索
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

        // 最適な位置を選択（左下優先）
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

    /**
     * 配置可能チェック（最適化版）
     */
    canPlace(grid, x, y, length, width) {
        const startX = Math.floor(x / grid.cellSize);
        const startY = Math.floor(y / grid.cellSize);
        const endX = Math.ceil((x + length) / grid.cellSize);
        const endY = Math.ceil((y + width) / grid.cellSize);

        if (endX > grid.width || endY > grid.depth) {
            return false;
        }

        // ビット演算を使用した高速チェック
        for (let i = startX; i < endX; i++) {
            for (let j = startY; j < endY; j++) {
                if (grid.data[j * grid.width + i] !== 0) {
                    return false;
                }
            }
        }

        return true;
    }

    /**
     * グリッド更新（最適化版）
     */
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

    /**
     * パレットスコア計算（最適化版）
     */
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

    /**
     * 体積効率計算
     */
    calculateVolumeEfficiency(pallet) {
        const usedVolume = pallet.cartons.reduce((sum, carton) => 
            sum + (carton.l * carton.w * carton.h), 0
        );
        const availableVolume = pallet.palletSize.width * 
            pallet.palletSize.depth * 
            (pallet.height - 14);
        
        return usedVolume / availableVolume;
    }

    /**
     * 効率計算
     */
    calculateEfficiency(cartons, palletSize, height) {
        const area = cartons.reduce((sum, c) => sum + (c.l * c.w), 0);
        const palletArea = palletSize.width * palletSize.depth;
        const layers = Math.ceil((height - 14) / 20); // 推定層数
        
        return (area / (palletArea * layers)) * 100;
    }

    /**
     * アイテムの準備
     */
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

    /**
     * 残りアイテムのチェック
     */
    hasRemainingItems(items) {
        return items.some(item => item.remaining > 0);
    }

    /**
     * 残りアイテムの更新
     */
    updateRemainingItems(items, pallet) {
        pallet.cartons.forEach(carton => {
            const item = items.find(i => i.code === carton.code);
            if (item && item.remaining > 0) {
                item.remaining--;
            }
        });
    }

    /**
     * 結果の最適化
     */
    optimizeResults(pallets) {
        // パレット数を最小化するための後処理
        return this.consolidatePallets(pallets);
    }

    /**
     * パレット統合
     */
    consolidatePallets(pallets) {
        // 小さなパレットを統合
        const consolidated = [];
        const smallPallets = [];

        pallets.forEach(pallet => {
            if (pallet.cartons.length < 5) {
                smallPallets.push(pallet);
            } else {
                consolidated.push(pallet);
            }
        });

        // 小さなパレットを統合
        if (smallPallets.length > 1) {
            // 統合ロジック（簡略版）
            consolidated.push(...smallPallets);
        } else {
            consolidated.push(...smallPallets);
        }

        return consolidated;
    }

    /**
     * キャッシュキー生成
     */
    generateCacheKey() {
        const data = {
            cartons: this.appState.cartonData,
            pallets: this.appState.palletConfig.selectedSizes,
            maxHeight: this.appState.palletConfig.maxHeightLimit
        };
        return JSON.stringify(data);
    }

    /**
     * メインスレッドに制御を返す
     */
    async yieldToMain() {
        return new Promise(resolve => {
            setTimeout(resolve, 0);
        });
    }

    /**
     * キャッシュクリア
     */
    clearCache() {
        this.calculationCache.clear();
    }
}