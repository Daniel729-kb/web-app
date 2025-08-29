// ====================================
// ALGORITHMS MODULE - Palletization Calculations
// ====================================

import { 
    getMaxHeightLimit, 
    getMaxCartonHeight, 
    getCartonData, 
    getSelectedPalletSizes, 
    setCurrentPallets 
} from './data.js';
import { safeDivide, groupItemsByHeight, createOccupiedGrid, canPlaceAt } from './utils.js';

// === 修正版パレタイズ計算（高さ制限対応） ===
export function calculateImprovedPalletization() {
    const cartonData = getCartonData();
    const selectedPalletSizes = getSelectedPalletSizes();
    const maxHeightLimit = getMaxHeightLimit();
    
    if (cartonData.length === 0) {
        throw new Error('カートンデータがありません。');
    }

    if (selectedPalletSizes.length === 0) {
        throw new Error('パレット種類を選択してください。');
    }

    const pallets = [];
    const remainingStock = cartonData.map(item => ({ ...item, remaining: item.qty }));
    
    let totalProcessed = 0;
    const totalCartons = cartonData.reduce((sum, item) => sum + item.qty, 0);
    let iterations = 0;
    const maxIterations = 1000;

    console.log('=== 高さ制限対応パレタイズ開始 ===');
    console.log(`総カートン数: ${totalCartons}`);
    console.log(`高さ制限: ${maxHeightLimit}cm (カートン配置可能高さ: ${getMaxCartonHeight()}cm)`);
    console.log(`貨物種類: ${cartonData.map(item => `${item.code}(${item.qty}個)`).join(', ')}`);
    console.log(`使用パレット種類: ${selectedPalletSizes.map(p => p.name).join(', ')}`);

    // 🔧 高さ制限チェック
    const oversizedItems = cartonData.filter(item => item.h > getMaxCartonHeight());
    if (oversizedItems.length > 0) {
        const warningMessage = `⚠️ 高さ制限警告: 以下の貨物が設定された高さ制限(${getMaxCartonHeight()}cm)を超えています：\n` +
            oversizedItems.map(item => `${item.code}: ${item.h}cm`).join('\n');
        
        if (!confirm(warningMessage + '\n\nこれらの貨物は配置できません。計算を続行しますか？')) {
            throw new Error('計算が中止されました。');
        }
        
        // 超過アイテムを除外
        oversizedItems.forEach(oversizedItem => {
            const stockItem = remainingStock.find(item => item.code === oversizedItem.code);
            if (stockItem) {
                stockItem.remaining = 0; // 配置不可能に設定
            }
        });
    }

    while (totalProcessed < totalCartons && iterations < maxIterations) {
        iterations++;
        
        const availableItems = remainingStock.filter(item => 
            item.remaining > 0 && item.h <= getMaxCartonHeight()
        );
        if (availableItems.length === 0) break;

        console.log(`\n=== パレット${pallets.length + 1} 計算開始 (高さ制限: ${maxHeightLimit}cm) ===`);
        console.log(`残り貨物: ${availableItems.map(item => `${item.code}(${item.remaining}個)`).join(', ')}`);

        const bestPallet = findOptimalPalletConfiguration(availableItems);
        
        if (!bestPallet || bestPallet.cartons.length === 0) {
            console.log('⚠️ 配置できるカートンがありません');
            break;
        }

        // 高さ制限チェック
        if (bestPallet.height > maxHeightLimit) {
            console.log(`⚠️ パレット高さ制限超過: ${bestPallet.height.toFixed(1)}cm > ${maxHeightLimit}cm`);
            break;
        }

        pallets.push(bestPallet);
        
        // 在庫を更新
        bestPallet.cartons.forEach(carton => {
            const stockItem = remainingStock.find(item => item.code === carton.code);
            if (stockItem && stockItem.remaining > 0) {
                stockItem.remaining--;
                totalProcessed++;
            }
        });

        console.log(`✅ パレット${pallets.length}完了: 高さ${bestPallet.height.toFixed(1)}cm (制限${maxHeightLimit}cm以内)`);
    }

    // 最終結果サマリー
    console.log('\n=== 最終結果サマリー ===');
    console.log(`高さ制限: ${maxHeightLimit}cm`);
    console.log(`総パレット数: ${pallets.length}`);
    console.log(`処理済み: ${totalProcessed}/${totalCartons}個`);

    // 高さ制限による未配置分析
    const unplaced = remainingStock.filter(item => item.remaining > 0);
    const unplacedData = {
        items: unplaced,
        total: unplaced.reduce((sum, item) => sum + item.remaining, 0),
        heightBlocked: unplaced.filter(item => item.h > getMaxCartonHeight())
    };

    setCurrentPallets(pallets);
    
    return {
        pallets,
        totalProcessed,
        totalCartons,
        unplacedData,
        success: totalProcessed === totalCartons
    };
}

// === 最適パレット配置計算（高さ制限対応） ===
export function findOptimalPalletConfiguration(availableItems) {
    const selectedPalletSizes = getSelectedPalletSizes();
    const maxHeightLimit = getMaxHeightLimit();
    
    const remainingCount = availableItems.reduce((sum, item) => sum + item.remaining, 0);
    let bestConfig = null;
    let maxScore = 0;

    console.log(`最適パレット計算: 残り${remainingCount}個 (高さ制限: ${maxHeightLimit}cm)`);

    // 🔧 高さ制限内のアイテムのみを処理
    const validItems = availableItems.filter(item => item.h <= getMaxCartonHeight());
    if (validItems.length === 0) {
        console.log('高さ制限により配置可能なアイテムがありません');
        return null;
    }

    // 少数・大量アイテムの分類
    const smallQuantityItems = validItems.filter(item => item.remaining <= 15);
    const largeQuantityItems = validItems.filter(item => item.remaining > 15);

    console.log(`高さ制限内アイテム: ${validItems.length}種類`);
    console.log(`少数貨物: ${smallQuantityItems.map(item => `${item.code}(${item.remaining}個, ${item.h}cm)`).join(', ')}`);
    console.log(`大量貨物: ${largeQuantityItems.map(item => `${item.code}(${item.remaining}個, ${item.h}cm)`).join(', ')}`);

    // 選択されたパレットサイズのみで最適配置を計算
    for (const palletSize of selectedPalletSizes) {
        // 1. 少数アイテム優先混載配置
        if (smallQuantityItems.length > 0) {
            const mixedConfig = calculateSmallQuantityMixedPallet(validItems, palletSize);
            if (mixedConfig && mixedConfig.cartons.length > 0 && mixedConfig.height <= maxHeightLimit) {
                const score = calculatePalletScore(mixedConfig, validItems);
                console.log(`${palletSize.name} 混載: ${mixedConfig.cartons.length}個, 高さ${mixedConfig.height.toFixed(1)}cm, スコア${score.toFixed(1)}`);
                
                if (score > maxScore) {
                    maxScore = score;
                    bestConfig = mixedConfig;
                }
            }
        }

        // 2. 大量アイテム専用配置
        if (largeQuantityItems.length > 0) {
            const dedicatedConfig = calculateLargeQuantityDedicatedPallet(validItems, palletSize);
            if (dedicatedConfig && dedicatedConfig.cartons.length > 0 && dedicatedConfig.height <= maxHeightLimit) {
                const score = calculatePalletScore(dedicatedConfig, validItems);
                console.log(`${palletSize.name} 専用: ${dedicatedConfig.cartons.length}個, 高さ${dedicatedConfig.height.toFixed(1)}cm, スコア${score.toFixed(1)}`);
                
                if (score > maxScore) {
                    maxScore = score;
                    bestConfig = dedicatedConfig;
                }
            }
        }

        // 3. バランス型配置
        const balancedConfig = calculateBalancedPallet(validItems, palletSize);
        if (balancedConfig && balancedConfig.cartons.length > 0 && balancedConfig.height <= maxHeightLimit) {
            const score = calculatePalletScore(balancedConfig, validItems);
            console.log(`${palletSize.name} バランス: ${balancedConfig.cartons.length}個, 高さ${balancedConfig.height.toFixed(1)}cm, スコア${score.toFixed(1)}`);
            
            if (score > maxScore) {
                maxScore = score;
                bestConfig = balancedConfig;
            }
        }
    }

    if (bestConfig) {
        console.log(`✅ 最適解選択: 高さ${bestConfig.height.toFixed(1)}cm ≤ 制限${maxHeightLimit}cm`);
    }

    return bestConfig;
}

// === 少数貨物混載パレット計算（高さ制限対応） ===
export function calculateSmallQuantityMixedPallet(availableItems, palletSize) {
    const maxHeightLimit = getMaxHeightLimit();
    const selectedCartons = [];
    let totalWeight = 0;
    let currentHeight = 14;
    const layers = [];

    console.log(`\n${palletSize.name}パレットで少数貨物混載計算中... (高さ制限: ${maxHeightLimit}cm)`);

    const remainingItems = availableItems.map(item => ({ ...item }));
    const smallItems = remainingItems.filter(item => 
        item.remaining > 0 && 
        item.remaining <= 15 && 
        item.h <= getMaxCartonHeight()
    );

    if (smallItems.length === 0) {
        return null;
    }

    // 🔧 高さグループ別に効率的混載
    while (smallItems.some(item => item.remaining > 0) && currentHeight < maxHeightLimit) {
        const availableHeight = maxHeightLimit - currentHeight;
        
        // 高さが近いアイテムをグループ化（±3cm許容）
        const heightGroups = groupItemsByHeight(smallItems, 3);
        
        let bestLayerGroup = null;
        let bestLayerScore = 0;
        
        for (const [heightKey, groupItems] of Object.entries(heightGroups)) {
            const groupHeight = parseFloat(heightKey);
            if (groupHeight > availableHeight) continue;
            
            const groupItemsWithStock = groupItems.filter(item => item.remaining > 0);
            if (groupItemsWithStock.length === 0) continue;
            
            // 🔧 このグループでの混載効率を評価
            const groupTotalStock = groupItemsWithStock.reduce((sum, item) => sum + item.remaining, 0);
            const multipleTypes = groupItemsWithStock.length > 1;
            const heightEfficient = groupHeight <= availableHeight;
            
            // 複数種類かつ高さ効率的な場合に高スコア
            const groupScore = groupTotalStock * 10 + (multipleTypes ? 50 : 0) + (heightEfficient ? 20 : 0);
            
            if (groupScore > bestLayerScore && groupItemsWithStock.length > 1) {
                bestLayerScore = groupScore;
                bestLayerGroup = { height: groupHeight, items: groupItemsWithStock };
            }
        }
        
        if (!bestLayerGroup) {
            console.log('  効率的な混載グループが見つかりません');
            break;
        }
        
        // 選択されたグループで混載層を作成
        const mixedLayer = createEfficientMixedLayer(bestLayerGroup.items, palletSize, bestLayerGroup.height);
        
        if (!mixedLayer || mixedLayer.cartons.length === 0) {
            console.log('  混載層作成失敗');
            break;
        }

        layers.push(mixedLayer);
        selectedCartons.push(...mixedLayer.cartons);
        totalWeight += mixedLayer.weight;
        currentHeight += mixedLayer.height;

        // 高さ制限チェック
        if (currentHeight > maxHeightLimit) {
            console.log(`  高さ制限超過: ${currentHeight}cm > ${maxHeightLimit}cm`);
            break;
        }

        // 在庫を更新
        mixedLayer.cartons.forEach(carton => {
            const item = smallItems.find(i => i.code === carton.code);
            if (item && item.remaining > 0) {
                item.remaining--;
            }
        });

        console.log(`  混載層${layers.length}: 高さ${currentHeight}cm ≤ 制限${maxHeightLimit}cm`);
    }

    if (selectedCartons.length === 0 || currentHeight > maxHeightLimit) {
        return null;
    }

    console.log(`少数混載パレット完了: ${selectedCartons.length}個, 高さ${currentHeight}cm ≤ 制限${maxHeightLimit}cm`);

    return {
        palletSize,
        cartons: selectedCartons,
        layers: layers,
        height: currentHeight,
        totalWeight,
        safetyWarnings: []
    };
}

// === 大量貨物専用パレット計算（高さ制限対応） ===
export function calculateLargeQuantityDedicatedPallet(availableItems, palletSize) {
    const maxHeightLimit = getMaxHeightLimit();
    const selectedCartons = [];
    let totalWeight = 0;
    let currentHeight = 14;
    const layers = [];

    console.log(`\n${palletSize.name}パレットで大量貨物専用計算中... (高さ制限: ${maxHeightLimit}cm)`);

    const remainingItems = availableItems.map(item => ({ ...item }));
    const largeItems = remainingItems.filter(item => 
        item.remaining > 15 && 
        item.h <= getMaxCartonHeight()
    );

    if (largeItems.length === 0) {
        return null;
    }

    // 最も在庫の多いアイテムを優先
    const primaryItem = largeItems.sort((a, b) => b.remaining - a.remaining)[0];
    
    console.log(`大量専用優先: ${primaryItem.code} (${primaryItem.remaining}個, 高さ${primaryItem.h}cm)`);

    // 専用層を可能な限り作成
    while (primaryItem.remaining > 0 && currentHeight < maxHeightLimit) {
        const availableHeight = maxHeightLimit - currentHeight;
        const dedicatedLayer = createSingleItemLayer(primaryItem, palletSize, availableHeight);
        
        if (!dedicatedLayer || dedicatedLayer.cartons.length === 0) {
            console.log(`  ${primaryItem.code}専用層作成終了`);
            break;
        }

        // 高さ制限チェック
        if (currentHeight + dedicatedLayer.height > maxHeightLimit) {
            console.log(`  高さ制限により層追加不可: ${currentHeight + dedicatedLayer.height}cm > ${maxHeightLimit}cm`);
            break;
        }

        layers.push(dedicatedLayer);
        selectedCartons.push(...dedicatedLayer.cartons);
        totalWeight += dedicatedLayer.weight;
        currentHeight += dedicatedLayer.height;

        // 在庫を更新
        dedicatedLayer.cartons.forEach(() => {
            primaryItem.remaining--;
        });

        console.log(`  ${primaryItem.code}専用層${layers.length}: 高さ${currentHeight}cm ≤ 制限${maxHeightLimit}cm`);
    }

    if (selectedCartons.length === 0) {
        return null;
    }

    console.log(`大量専用パレット完了: ${selectedCartons.length}個, 高さ${currentHeight}cm ≤ 制限${maxHeightLimit}cm`);

    return {
        palletSize,
        cartons: selectedCartons,
        layers: layers,
        height: currentHeight,
        totalWeight,
        safetyWarnings: []
    };
}

// === バランス型パレット計算（高さ制限対応） ===
export function calculateBalancedPallet(availableItems, palletSize) {
    const validItems = availableItems.filter(item => item.h <= getMaxCartonHeight());
    if (validItems.length === 0) return null;
    
    return calculatePalletConfigurationForItem(validItems, palletSize, validItems[0]);
}

// === 特定貨物コード優先パレット配置（高さ制限対応） ===
export function calculatePalletConfigurationForItem(availableItems, palletSize, priorityItem) {
    const maxHeightLimit = getMaxHeightLimit();
    const selectedCartons = [];
    let totalWeight = 0;
    let currentHeight = 14; // パレット高さ
    const layers = [];

    console.log(`\n🔧 ${palletSize.name}パレットで${priorityItem ? priorityItem.code : '汎用'}優先配置中... (高さ制限: ${maxHeightLimit}cm)`);

    const remainingItems = availableItems.map(item => ({ ...item }));
    const priorityRemaining = priorityItem ? remainingItems.find(item => item.code === priorityItem.code) : null;

    if (priorityRemaining && priorityRemaining.remaining <= 0) {
        console.log(`優先アイテム${priorityItem.code}の在庫なし`);
        return null;
    }

    // 理論配置数チェック
    console.log(`\n📊 理論配置数チェック (カートン配置可能高さ: ${getMaxCartonHeight()}cm):`);
    let theoreticalTotal = 0;
    remainingItems.forEach(item => {
        if (item.remaining <= 0 || item.h > getMaxCartonHeight()) return;
        
        const normalFits = Math.floor(palletSize.width / item.l) * Math.floor(palletSize.depth / item.w);
        const rotatedFits = Math.floor(palletSize.width / item.w) * Math.floor(palletSize.depth / item.l);
        const maxPerLayer = Math.max(normalFits, rotatedFits);
        const maxLayers = Math.floor(getMaxCartonHeight() / item.h);
        const theoreticalMax = maxPerLayer * maxLayers;
        const canPlace = Math.min(item.remaining, theoreticalMax);
        
        theoreticalTotal += canPlace;
        
        console.log(`  ${item.code}: 理論最大${theoreticalMax}個 (${maxPerLayer}個/層 × ${maxLayers}層)`);
    });
    
    console.log(`理論配置総数: ${theoreticalTotal}個`);

    // 段階的配置戦略
    let iterations = 0;
    const maxIterations = 50;
    
    while (remainingItems.some(item => item.remaining > 0) && currentHeight < maxHeightLimit && iterations < maxIterations) {
        iterations++;
        const availableHeight = maxHeightLimit - currentHeight;
        
        console.log(`\n--- 層${iterations}作成 (高さ${currentHeight}cm, 残り${availableHeight}cm) ---`);
        
        // 配置可能なアイテムを確認（高さ制限考慮）
        const placeable = remainingItems.filter(item => 
            item.remaining > 0 && 
            item.h <= availableHeight &&
            item.h <= getMaxCartonHeight()
        );
        
        if (placeable.length === 0) {
            console.log('配置可能なアイテムなし');
            break;
        }
        
        // 最適層を選択
        let bestLayer = null;
        let bestScore = 0;
        
        // 優先アイテムの専用層
        if (priorityRemaining && priorityRemaining.remaining > 0 && priorityRemaining.h <= availableHeight) {
            const priorityLayer = createSingleItemLayer(priorityRemaining, palletSize, availableHeight);
            if (priorityLayer && priorityLayer.cartons.length > 0) {
                const priorityScore = calculateLayerScore(priorityLayer, palletSize, true);
                if (priorityScore > bestScore) {
                    bestScore = priorityScore;
                    bestLayer = priorityLayer;
                }
            }
        }
        
        // 各アイテムの専用層
        placeable.forEach(item => {
            if (item === priorityRemaining) return;
            
            const singleLayer = createSingleItemLayer(item, palletSize, availableHeight);
            if (singleLayer && singleLayer.cartons.length > 0) {
                const score = calculateLayerScore(singleLayer, palletSize, false);
                if (score > bestScore) {
                    bestScore = score;
                    bestLayer = singleLayer;
                }
            }
        });
        
        // 混載層
        const mixedLayer = createHeightBasedMixedLayer(remainingItems, palletSize, availableHeight);
        if (mixedLayer && mixedLayer.cartons.length > 0) {
            const mixedScore = calculateLayerScore(mixedLayer, palletSize, false);
            if (mixedScore > bestScore) {
                bestScore = mixedScore;
                bestLayer = mixedLayer;
            }
        }
        
        if (!bestLayer) {
            console.log('これ以上配置できません');
            break;
        }

        // 高さ制限チェック
        if (currentHeight + bestLayer.height > maxHeightLimit) {
            console.log(`高さ制限により層追加不可: ${currentHeight + bestLayer.height}cm > ${maxHeightLimit}cm`);
            break;
        }

        layers.push(bestLayer);
        selectedCartons.push(...bestLayer.cartons);
        totalWeight += bestLayer.weight;
        currentHeight += bestLayer.height;

        // 在庫を更新
        bestLayer.cartons.forEach(carton => {
            const item = remainingItems.find(i => i.code === carton.code);
            if (item && item.remaining > 0) {
                item.remaining--;
            }
        });

        console.log(`層${iterations}追加: ${bestLayer.cartons.length}個, 累計高さ${currentHeight}cm ≤ 制限${maxHeightLimit}cm`);
    }

    if (selectedCartons.length === 0) {
        return null;
    }

    return {
        palletSize,
        cartons: selectedCartons,
        layers: layers,
        height: currentHeight,
        totalWeight,
        safetyWarnings: []
    };
}

// === 層作成ヘルパー関数群 ===

// 高さベース混載層作成
export function createHeightBasedMixedLayer(remainingItems, palletSize, maxHeight) {
    const validItems = remainingItems.filter(item => 
        item.remaining > 0 && item.h <= maxHeight && item.h <= getMaxCartonHeight()
    );
    
    if (validItems.length === 0) return null;

    // 高さでグループ化
    const heightGroups = groupItemsByHeight(validItems, 2);
    
    for (const [heightKey, groupItems] of Object.entries(heightGroups)) {
        const groupHeight = parseFloat(heightKey);
        if (groupHeight > maxHeight) continue;
        
        const mixedLayer = createEfficientMixedLayer(groupItems, palletSize, groupHeight);
        if (mixedLayer && mixedLayer.cartons.length > 1) {
            return mixedLayer;
        }
    }
    
    return null;
}

// 効率的混載層作成
export function createEfficientMixedLayer(groupItems, palletSize, targetHeight) {
    const selectedCartons = [];
    let totalWeight = 0;
    let totalArea = 0;
    const occupiedGrid = createOccupiedGrid(palletSize, []);

    console.log(`\n🔄 効率的混載層作成 (目標高さ: ${targetHeight}cm)`);

    // アイテムを重量効率でソート
    const sortedItems = groupItems
        .filter(item => item.remaining > 0 && item.h <= targetHeight)
        .sort((a, b) => {
            const aEfficiency = a.weight / (a.l * a.w * a.h);
            const bEfficiency = b.weight / (b.l * b.w * b.h);
            return bEfficiency - aEfficiency;
        });

    for (const item of sortedItems) {
        if (item.remaining <= 0) continue;

        // 最適配置を計算
        const placement = calculateOptimalPlacement(item, palletSize);
        if (!placement) continue;

        // 配置可能性チェック
        if (canPlaceAt(occupiedGrid, 
            Math.floor(placement.x), 
            Math.floor(placement.y), 
            Math.ceil(placement.width), 
            Math.ceil(placement.depth)
        )) {
            // カートンを配置
            const carton = {
                ...item,
                position: placement
            };
            
            selectedCartons.push(carton);
            totalWeight += item.weight;
            totalArea += placement.width * placement.depth;

            // グリッドを更新
            const startX = Math.floor(placement.x);
            const startY = Math.floor(placement.y);
            const endX = Math.min(Math.ceil(placement.x + placement.width), occupiedGrid.length);
            const endY = Math.min(Math.ceil(placement.y + placement.depth), occupiedGrid[0].length);
            
            for (let x = startX; x < endX; x++) {
                for (let y = startY; y < endY; y++) {
                    if (x >= 0 && y >= 0) {
                        occupiedGrid[x][y] = true;
                    }
                }
            }

            console.log(`  配置: ${item.code} at (${placement.x}, ${placement.y})`);
        }
    }

    if (selectedCartons.length === 0) {
        return null;
    }

    return {
        height: targetHeight,
        cartons: selectedCartons,
        weight: totalWeight,
        area: totalArea,
        type: 'mixed'
    };
}

// 単一アイテム層作成
export function createSingleItemLayer(item, palletSize, maxHeight) {
    if (item.remaining <= 0 || item.h > maxHeight) {
        return null;
    }

    const placement = calculateOptimalPlacement(item, palletSize);
    if (!placement) return null;

    // 配置可能数を計算
    const fitsX = Math.floor(palletSize.width / placement.width);
    const fitsY = Math.floor(palletSize.depth / placement.depth);
    const maxCanPlace = fitsX * fitsY;
    const actualPlace = Math.min(maxCanPlace, item.remaining);

    if (actualPlace === 0) return null;

    const selectedCartons = [];
    let totalWeight = 0;

    // カートンを配置
    for (let i = 0; i < actualPlace; i++) {
        const row = Math.floor(i / fitsX);
        const col = i % fitsX;
        
        const carton = {
            ...item,
            position: {
                x: col * placement.width,
                y: row * placement.depth,
                width: placement.width,
                depth: placement.depth
            }
        };
        
        selectedCartons.push(carton);
        totalWeight += item.weight;
    }

    return {
        height: item.h,
        cartons: selectedCartons,
        weight: totalWeight,
        area: actualPlace * placement.width * placement.depth,
        type: 'single'
    };
}

// 最適配置計算
export function calculateOptimalPlacement(item, palletSize) {
    // 通常配置と回転配置を比較
    const normalFits = {
        width: item.l,
        depth: item.w,
        count: Math.floor(palletSize.width / item.l) * Math.floor(palletSize.depth / item.w)
    };

    const rotatedFits = {
        width: item.w,
        depth: item.l,
        count: Math.floor(palletSize.width / item.w) * Math.floor(palletSize.depth / item.l)
    };

    // より多く配置できる方を選択
    const optimal = normalFits.count >= rotatedFits.count ? normalFits : rotatedFits;
    
    if (optimal.count === 0) return null;

    return {
        x: 0,
        y: 0,
        width: optimal.width,
        depth: optimal.depth
    };
}

// 層スコア計算
export function calculateLayerScore(layer, palletSize, isPriority = false) {
    const palletArea = palletSize.width * palletSize.depth;
    const utilization = safeDivide(layer.area, palletArea, 0);
    const weightDensity = safeDivide(layer.weight, layer.area, 0);
    const cartonCount = layer.cartons.length;

    let score = utilization * 100 + weightDensity * 10 + cartonCount * 5;

    if (isPriority) {
        score *= 1.5; // 優先アイテムにボーナス
    }

    if (layer.type === 'mixed') {
        score *= 1.2; // 混載にボーナス
    }

    return score;
}

// パレットスコア計算
export function calculatePalletScore(config, availableItems) {
    const palletArea = config.palletSize.width * config.palletSize.depth;
    const totalWeight = config.totalWeight;
    const cartonCount = config.cartons.length;
    const heightUtilization = safeDivide(config.height, getMaxHeightLimit(), 0);
    
    // 基本スコア
    let score = cartonCount * 10 + totalWeight * 2 + heightUtilization * 20;
    
    // ボーナス計算
    const hasMultipleTypes = new Set(config.cartons.map(c => c.code)).size > 1;
    if (hasMultipleTypes) score += 30;
    
    // 面積効率
    const totalCartonArea = config.cartons.reduce((sum, carton) => {
        return sum + (carton.position ? carton.position.width * carton.position.depth : 0);
    }, 0);
    const areaUtilization = safeDivide(totalCartonArea, palletArea, 0);
    score += areaUtilization * 50;
    
    return score;
}

// その他のヘルパー関数
export function findAdditionalPlacements(item, palletSize, occupiedGrid) {
    const placements = [];
    const placement = calculateOptimalPlacement(item, palletSize);
    
    if (!placement) return placements;
    
    // グリッド内で配置可能な位置を探索
    for (let x = 0; x <= palletSize.width - placement.width; x += 5) {
        for (let y = 0; y <= palletSize.depth - placement.depth; y += 5) {
            if (canPlaceAt(occupiedGrid, Math.floor(x), Math.floor(y), 
                Math.ceil(placement.width), Math.ceil(placement.depth))) {
                placements.push({
                    x: x,
                    y: y,
                    width: placement.width,
                    depth: placement.depth
                });
            }
        }
    }
    
    return placements;
}