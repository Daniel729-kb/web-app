/**
 * Completely Fixed Layout Generator Module
 * Fixes packing algorithm, aisle handling, and dimension calculations
 */
class LayoutGenerator {
    constructor(calculator) {
        this.calculator = calculator;
    }

    generateCanvasLayout(pallets, mode, aisleWidth, palletClearance) {
        try {
            console.log('=== DEBUG: Input Parameters ===');
            console.log('Pallets:', pallets);
            console.log('Aisle Width:', aisleWidth);
            console.log('Clearance:', palletClearance);

            const cargoItems = this.preparePalletItems(pallets, palletClearance);
            
            if (cargoItems.length === 0) {
                return { success: false, message: '配置するパレットがありません' };
            }

            console.log('=== DEBUG: Cargo Items ===');
            console.log('Total stacks needed:', cargoItems.length);

            // Use grid-based packing for better arrangement
            const packingResult = this.gridBasedPacking(cargoItems, aisleWidth, palletClearance);
            
            if (!packingResult.success) {
                return { success: false, message: packingResult.message || 'パッキングに失敗しました' };
            }
            
            const totalAreaMin = cargoItems.reduce((sum, item) => sum + (item.originalWidth * item.originalHeight), 0);
            const actualArea = packingResult.totalWidth * packingResult.totalLength;
            const efficiency = actualArea > 0 ? (totalAreaMin / actualArea * 100) : 0;

            console.log('=== DEBUG: Final Results ===');
            console.log('Total Width:', packingResult.totalWidth);
            console.log('Total Length:', packingResult.totalLength);
            console.log('Efficiency:', efficiency);

            const colors = this.getColorPalette();
            const palletColors = pallets.map((_, index) => colors[index % colors.length]);

            return {
                success: true,
                positions: packingResult.positions,
                binWidth: packingResult.totalWidth,
                totalHeight: packingResult.totalLength,
                efficiency: efficiency,
                colors: palletColors,
                pallets: pallets,
                totalAreaMin: totalAreaMin,
                actualArea: actualArea,
                aislePositions: packingResult.aislePositions || [],
                gridInfo: packingResult.gridInfo
            };
        } catch (error) {
            console.error('Layout generation error:', error);
            return { success: false, message: 'レイアウト生成中にエラーが発生しました: ' + error.message };
        }
    }

    preparePalletItems(pallets, clearance) {
        let items = [];
        
        for (let palletType = 0; palletType < pallets.length; palletType++) {
            const pallet = pallets[palletType];
            const stackingLevels = this.calculator.getStackingLevels(pallet);
            const stacksNeeded = Math.ceil(pallet.quantity / stackingLevels);
            
            console.log(`Pallet ${pallet.name}: ${pallet.quantity} pallets → ${stacksNeeded} stacks (${stackingLevels} levels each)`);
            
            for (let i = 0; i < stacksNeeded; i++) {
                items.push({
                    width: pallet.length,  // Don't add clearance here - handle it in positioning
                    height: pallet.width,
                    originalWidth: pallet.length,
                    originalHeight: pallet.width,
                    palletType: palletType,
                    stackLevel: Math.min(pallet.quantity - (i * stackingLevels), stackingLevels),
                    clearance: clearance
                });
            }
        }
        
        return items;
    }

    gridBasedPacking(items, aisleWidth, clearance) {
        const totalStacks = items.length;
        console.log('=== Grid-Based Packing ===');
        console.log('Total stacks to place:', totalStacks);

        // Find optimal grid arrangement
        const arrangements = this.findOptimalArrangements(totalStacks);
        let bestLayout = null;
        let minArea = Infinity;

        // Get average pallet size
        const avgWidth = items.reduce((sum, item) => sum + item.width, 0) / items.length;
        const avgHeight = items.reduce((sum, item) => sum + item.height, 0) / items.length;

        for (const arr of arrangements) {
            const storageWidth = arr.cols * (avgWidth + clearance);
            const storageLength = arr.rows * (avgHeight + clearance);
            
            // When no aisles, use storage dimensions directly
            const totalWidth = aisleWidth > 0 ? storageWidth + aisleWidth : storageWidth;
            const totalLength = aisleWidth > 0 ? storageLength + aisleWidth : storageLength;
            const area = totalWidth * totalLength;

            console.log(`Trying ${arr.rows}x${arr.cols}: Storage ${storageLength.toFixed(1)}x${storageWidth.toFixed(1)}${aisleWidth > 0 ? ' + Aisle' : ''} → Total ${totalLength.toFixed(1)}x${totalWidth.toFixed(1)} = ${area.toFixed(1)}m²`);

            if (area < minArea) {
                minArea = area;
                bestLayout = {
                    ...arr,
                    storageWidth,
                    storageLength,
                    totalWidth,
                    totalLength
                };
            }
        }

        console.log('Best layout:', bestLayout);

        // Generate positions using the best layout
        const positions = this.generateGridPositions(items, bestLayout, clearance);

        return {
            success: true,
            positions: positions,
            totalWidth: bestLayout.totalWidth,
            totalLength: bestLayout.totalLength,
            gridInfo: bestLayout,
            aislePositions: this.generateAislePositions(bestLayout, aisleWidth)
        };
    }

    findOptimalArrangements(totalStacks) {
        const arrangements = [];
        
        // Try different row/column combinations
        for (let rows = 1; rows <= totalStacks; rows++) {
            const cols = Math.ceil(totalStacks / rows);
            if (rows * cols >= totalStacks) {
                arrangements.push({ rows, cols });
            }
        }

        // Sort by efficiency (how well they fill the grid)
        arrangements.sort((a, b) => {
            const efficiencyA = totalStacks / (a.rows * a.cols);
            const efficiencyB = totalStacks / (b.rows * b.cols);
            return efficiencyB - efficiencyA; // Higher efficiency first
        });

        return arrangements.slice(0, 5); // Return top 5 arrangements
    }

    generateGridPositions(items, layout, clearance) {
        const positions = [];
        let itemIndex = 0;

        for (let row = 0; row < layout.rows && itemIndex < items.length; row++) {
            for (let col = 0; col < layout.cols && itemIndex < items.length; col++) {
                const item = items[itemIndex];
                
                // Calculate position with clearance
                const x = col * (item.width + clearance) + clearance/2;
                const y = row * (item.height + clearance) + clearance/2;

                positions.push([
                    x, y,
                    item.originalWidth,
                    item.originalHeight,
                    item.palletType,
                    item.stackLevel
                ]);

                itemIndex++;
            }
        }

        console.log(`Generated ${positions.length} positions in ${layout.rows}x${layout.cols} grid`);
        return positions;
    }

    generateAislePositions(layout, aisleWidth) {
        // Generate aisle visualization positions
        const aisles = [];
        
        // Right aisle (vertical)
        if (aisleWidth > 0) {
            aisles.push({
                x: layout.storageWidth,
                y: 0,
                width: aisleWidth,
                height: layout.storageLength,
                type: 'vertical'
            });

            // Bottom aisle (horizontal)  
            aisles.push({
                x: 0,
                y: layout.storageLength,
                width: layout.totalWidth,
                height: aisleWidth,
                type: 'horizontal'
            });
        }

        return aisles;
    }

    canPlaceAt(x, y, width, height, existingPositions, clearance) {
        // Check boundaries
        if (x < 0 || y < 0) return false;
        
        // Check collision with existing items
        for (let pos of existingPositions) {
            const [posX, posY, posW, posH] = pos;
            
            // Check if rectangles overlap (with clearance)
            if (!(x >= posX + posW + clearance || 
                  x + width + clearance <= posX || 
                  y >= posY + posH + clearance || 
                  y + height + clearance <= posY)) {
                return false;
            }
        }
        
        return true;
    }

    // Bottom-left fill algorithm (more efficient alternative)
    bottomLeftFillPacking(items, binWidth, clearance) {
        let positions = [];
        
        // Sort by area descending, then by width descending
        items.sort((a, b) => {
            const areaA = a.width * a.height;
            const areaB = b.width * b.height;
            if (areaB !== areaA) return areaB - areaA;
            return b.width - a.width;
        });
        
        for (let item of items) {
            let placed = false;
            
            // Try both orientations
            const orientations = [
                { w: item.width, h: item.height },
                { w: item.height, h: item.width }
            ];
            
            for (let orientation of orientations) {
                if (orientation.w > binWidth) continue;
                
                // Find bottom-left position
                const position = this.findBottomLeftPosition(
                    orientation.w, orientation.h, positions, binWidth, clearance
                );
                
                if (position) {
                    positions.push([
                        position.x, position.y, 
                        item.originalWidth, item.originalHeight,
                        item.palletType, item.stackLevel
                    ]);
                    placed = true;
                    break;
                }
            }
            
            if (!placed) {
                return { 
                    success: false, 
                    message: 'パレットの配置に失敗しました。倉庫の設定を確認してください。' 
                };
            }
        }
        
        const totalHeight = positions.length > 0 ? 
            Math.max(...positions.map(p => p[1] + p[3])) + clearance : 0;
        
        return { success: true, positions, totalHeight };
    }

    findBottomLeftPosition(width, height, existingPositions, maxWidth, maxLength) {
        // Try positions starting from bottom-left, going right then up
        const step = 0.1; // 10cm step for precision
        
        for (let y = 0; y <= maxLength - height; y += step) {
            for (let x = 0; x <= maxWidth - width; x += step) {
                if (this.canPlaceAt(x, y, width, height, existingPositions, 0)) {
                    return { x, y };
                }
            }
        }
        return null;
    }

    getColorPalette() {
        return [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
            '#ec4899', '#6366f1', '#14b8a6', '#f97316'
        ];
    }

    // Existing calculation methods with improvements
    calculateCombined(pallets, aisleWidth) {
        console.log('calculateCombined called with:', pallets, aisleWidth);
        
        let totalRequiredArea = 0;
        let totalPallets = 0;
        let maxStackingLevels = 1;
        let totalStacks = 0;

        pallets.forEach(pallet => {
            const stackingLevels = this.calculator.getStackingLevels(pallet);
            const stacksNeeded = Math.ceil(pallet.quantity / stackingLevels);
            const palletArea = pallet.length * pallet.width;
            const requiredArea = stacksNeeded * palletArea;

            totalRequiredArea += requiredArea;
            totalPallets += pallet.quantity;
            maxStackingLevels = Math.max(maxStackingLevels, stackingLevels);
            totalStacks += stacksNeeded;
        });

        const avgPalletLength = pallets.reduce((sum, p) => sum + p.length, 0) / pallets.length;
        const effectiveLength = Math.max(0, this.calculator.warehouse.length - aisleWidth);
        const palletsPerRow = effectiveLength > 0 ? Math.floor(effectiveLength / avgPalletLength) : 0;
        
        if (palletsPerRow <= 0) {
            this.calculator.showMessage('倉庫の長さが不足しています。通路幅を調整してください。', 'error');
            return;
        }

        const totalRows = Math.ceil(totalStacks / palletsPerRow);
        const warehouseArea = this.calculator.warehouse.length * this.calculator.warehouse.width;
        const utilizationRate = warehouseArea > 0 ? (totalRequiredArea / warehouseArea) * 100 : 0;
        const availableArea = effectiveLength * (this.calculator.warehouse.width - aisleWidth);
        const efficiency = availableArea > 0 ? (totalRequiredArea / availableArea) * 100 : 0;

        this.calculator.updateCalculationDisplay({
            requiredArea: totalRequiredArea,
            stackingLevels: maxStackingLevels,
            palletsPerRow: palletsPerRow,
            totalRows: totalRows,
            utilizationRate: utilizationRate,
            efficiency: efficiency,
            totalPallets: totalPallets,
            selectedPallets: pallets
        });

        this.calculator.showMessage(`統合計算完了: ${pallets.length}種類のパレット、合計${totalPallets}個`, 'success');
    }

    calculateSeparate(pallets, aisleWidth) {
        // Fallback to combined calculation for now
        this.calculateCombined(pallets, aisleWidth);
    }

    /**
     * Calculate minimum warehouse dimensions needed for given pallets
     * @param {Array} pallets - Array of pallet objects
     * @param {number} aisleWidth - Width of aisles
     * @param {number} clearance - Clearance between pallets
     * @returns {Object} Minimum warehouse dimensions and efficiency info
     */
    calculateMinimumWarehouseDimensions(pallets, aisleWidth, clearance) {
        if (!pallets || pallets.length === 0) {
            return {
                minLength: 10,
                minWidth: 10,
                totalPalletArea: 0,
                efficiency: 0,
                recommendations: []
            };
        }

        console.log('=== Auto-Calculate Warehouse Dimensions ===');

        let totalStacks = 0;
        let avgPalletWidth = 0;
        let avgPalletLength = 0;
        
        // Calculate requirements
        pallets.forEach(pallet => {
            const stackingLevels = this.calculator.getStackingLevels(pallet);
            const stacksNeeded = Math.ceil(pallet.quantity / stackingLevels);
            totalStacks += stacksNeeded;
            avgPalletWidth += pallet.width * stacksNeeded;
            avgPalletLength += pallet.length * stacksNeeded;
        });

        avgPalletWidth /= totalStacks;
        avgPalletLength /= totalStacks;

        console.log(`Total stacks: ${totalStacks}`);
        console.log(`Avg pallet size: ${avgPalletLength.toFixed(2)}m x ${avgPalletWidth.toFixed(2)}m`);

        // Find optimal arrangement
        const arrangements = this.findOptimalArrangements(totalStacks);
        const bestArrangement = arrangements[0]; // Most efficient

        // Calculate dimensions including clearance and aisle
        const storageWidth = bestArrangement.cols * (avgPalletLength + clearance);
        const storageLength = bestArrangement.rows * (avgPalletWidth + clearance);
        
        // When no aisles, use storage dimensions directly
        const totalWidth = aisleWidth > 0 ? storageWidth + aisleWidth : storageWidth;
        const totalLength = aisleWidth > 0 ? storageLength + aisleWidth : storageLength;

        console.log(`Optimal arrangement: ${bestArrangement.rows}x${bestArrangement.cols}`);
        console.log(`Storage area: ${storageLength.toFixed(1)}m x ${storageWidth.toFixed(1)}m`);
        console.log(`${aisleWidth > 0 ? 'With aisle' : 'No aisle'}: ${totalLength.toFixed(1)}m x ${totalWidth.toFixed(1)}m`);

        return {
            minLength: Math.ceil(totalLength),
            minWidth: Math.ceil(totalWidth),
            totalPalletArea: totalStacks * avgPalletLength * avgPalletWidth,
            efficiency: (totalStacks / (bestArrangement.rows * bestArrangement.cols)) * 100,
            layoutStrategy: `${bestArrangement.rows}×${bestArrangement.cols} Grid`,
            recommendations: []
        };
    }

    calculateLayoutStrategies(pallets, aisleWidth, clearance, totalStacks) {
        const strategies = [];
        
        // Strategy 1: Square-ish layout
        const sqrtStacks = Math.ceil(Math.sqrt(totalStacks));
        const avgPalletSize = this.getAveragePalletSize(pallets, clearance);
        
        strategies.push({
            name: 'Square Layout',
            length: sqrtStacks * avgPalletSize.length + aisleWidth,
            width: sqrtStacks * avgPalletSize.width + aisleWidth,
            efficiency: this.estimateEfficiency(sqrtStacks, sqrtStacks, totalStacks)
        });

        // Strategy 2: Long and narrow (maximize length utilization)
        const maxPalletsPerRow = Math.floor(totalStacks / 2);
        strategies.push({
            name: 'Long Layout',
            length: maxPalletsPerRow * avgPalletSize.length + aisleWidth,
            width: Math.ceil(totalStacks / maxPalletsPerRow) * avgPalletSize.width + aisleWidth,
            efficiency: this.estimateEfficiency(maxPalletsPerRow, Math.ceil(totalStacks / maxPalletsPerRow), totalStacks)
        });

        // Strategy 3: Wide and short (maximize width utilization)
        const maxRows = Math.floor(totalStacks / 2);
        strategies.push({
            name: 'Wide Layout',
            length: Math.ceil(totalStacks / maxRows) * avgPalletSize.length + aisleWidth,
            width: maxRows * avgPalletSize.width + aisleWidth,
            efficiency: this.estimateEfficiency(Math.ceil(totalStacks / maxRows), maxRows, totalStacks)
        });

        // Strategy 4: Optimized based on largest pallet
        const largestPallet = this.getLargestPallet(pallets, clearance);
        const optimalRows = Math.ceil(Math.sqrt(totalStacks * (largestPallet.length / largestPallet.width)));
        const optimalCols = Math.ceil(totalStacks / optimalRows);
        
        strategies.push({
            name: 'Optimized Layout',
            length: optimalCols * avgPalletSize.length + aisleWidth,
            width: optimalRows * avgPalletSize.width + aisleWidth,
            efficiency: this.estimateEfficiency(optimalCols, optimalRows, totalStacks)
        });

        return strategies;
    }

    getAveragePalletSize(pallets, clearance) {
        let totalLength = 0;
        let totalWidth = 0;
        let totalStacks = 0;

        pallets.forEach(pallet => {
            const stackingLevels = this.calculator.getStackingLevels(pallet);
            const stacksNeeded = Math.ceil(pallet.quantity / stackingLevels);
            
            totalLength += stacksNeeded * (pallet.length + clearance);
            totalWidth += stacksNeeded * (pallet.width + clearance);
            totalStacks += stacksNeeded;
        });

        return {
            length: totalLength / totalStacks,
            width: totalWidth / totalStacks
        };
    }

    getLargestPallet(pallets, clearance) {
        return pallets.reduce((largest, pallet) => {
            const area = (pallet.length + clearance) * (pallet.width + clearance);
            const largestArea = (largest.length + clearance) * (largest.width + clearance);
            return area > largestArea ? pallet : largest;
        }, pallets[0]);
    }

    estimateEfficiency(cols, rows, totalStacks) {
        const usedCells = totalStacks;
        const totalCells = cols * rows;
        return (usedCells / totalCells) * 100;
    }

    generateRecommendations(strategies, pallets, aisleWidth, clearance) {
        const recommendations = [];
        
        // Check current warehouse size vs minimum needed
        const currentArea = this.calculator.warehouse.length * this.calculator.warehouse.width;
        const bestStrategy = strategies.reduce((best, current) => 
            current.efficiency > best.efficiency ? current : best
        );
        const minNeededArea = bestStrategy.length * bestStrategy.width;
        
        if (currentArea < minNeededArea) {
            recommendations.push({
                type: 'warning',
                message: `現在の倉庫面積（${currentArea.toFixed(1)}m²）は最小必要面積（${minNeededArea.toFixed(1)}m²）より小さいです。`
            });
        }
        
        if (aisleWidth > 3.0) {
            recommendations.push({
                type: 'suggestion',
                message: '通路幅が広すぎる可能性があります。2.5-3.0mに調整することで効率が向上します。'
            });
        }
        
        if (clearance > 0.15) {
            recommendations.push({
                type: 'suggestion',
                message: 'クリアランスが大きすぎる可能性があります。5-10cmに調整することでスペース効率が向上します。'
            });
        }

        // Check if stacking can be improved
        const unstackablePallets = pallets.filter(p => !p.isStackable);
        if (unstackablePallets.length > 0) {
            recommendations.push({
                type: 'info',
                message: `${unstackablePallets.length}種類のパレットが段積み不可です。段積み可能にすることで面積を削減できます。`
            });
        }

        return recommendations;
    }
}