/**
 * Completely Fixed Layout Management Module
 * Fixes canvas sizing, label positioning, and aisle visualization
 */
class LayoutManager {
    constructor(calculator) {
        this.calculator = calculator;
    }

    redrawLayoutIfActive() {
        const layoutTab = document.getElementById('layout-tab');
        const isLayoutTabActive = layoutTab && layoutTab.classList.contains('active');
        
        const selected = Array.from(document.getElementById('selectedPallets').selectedOptions);
        if (selected.length === 0) {
            if (isLayoutTabActive) {
                this.clearLayout();
                this.showEmptyLayoutMessage();
            }
            return;
        }
        
        const mode = document.getElementById('calculationMode').value;
        const includeAisles = document.getElementById('includeAisles').checked;
        const aisleWidth = includeAisles ? (parseFloat(document.getElementById('aisleWidth').value) || 2.5) : 0;
        const palletClearance = (parseFloat(document.getElementById('palletClearance').value) || 5) / 100;
        const indices = selected.map(o => parseInt(o.value));
        const pallets = indices.map(i => this.calculator.pallets[i]).filter(Boolean);
        
        // Always generate layout result for calculations, but only render if layout tab is active
        const layoutResult = this.calculator.layoutGenerator.generateCanvasLayout(pallets, mode, aisleWidth, palletClearance);
        
        if (layoutResult.success) {
            // Store the layout result for when user switches to layout tab
            this.calculator.lastLayoutResult = layoutResult;
            
            // Only render if layout tab is currently active
            if (isLayoutTabActive) {
                this.clearLayout();
                this.renderCanvasLayout(layoutResult);
                this.createLegendWithStacks(pallets, layoutResult.colors, document.getElementById('layoutLegend'));
            }
        } else if (isLayoutTabActive) {
            // Show error message in layout tab
            this.clearLayout();
            this.showLayoutError(layoutResult.message || 'レイアウト生成に失敗しました');
        }
    }

    clearLayout() {
        const canvas = document.getElementById('layoutCanvas');
        const layoutContainer = document.getElementById('warehouseLayout');
        const legendContainer = document.getElementById('layoutLegend');
        
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            canvas.style.display = 'block';
        }
        
        if (layoutContainer) {
            layoutContainer.innerHTML = '';
            layoutContainer.style.width = 'auto';
            layoutContainer.style.height = '300px';
            layoutContainer.style.display = 'none';
            
            const existingLabels = layoutContainer.parentNode.querySelectorAll('.dimension-label');
            existingLabels.forEach(label => label.remove());
        }
        
        if (legendContainer) {
            legendContainer.innerHTML = '';
        }
    }

    showEmptyLayoutMessage() {
        const legendContainer = document.getElementById('layoutLegend');
        if (legendContainer) {
            legendContainer.innerHTML = '<p class="text-center text-gray-500 p-4">パレットを選択してください</p>';
        }
        
        const canvas = document.getElementById('layoutCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#6b7280';
            ctx.font = '16px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('パレットを選択してレイアウトを表示', canvas.width / 2, canvas.height / 2);
        }
    }

    showLayoutError(message) {
        const legendContainer = document.getElementById('layoutLegend');
        if (legendContainer) {
            legendContainer.innerHTML = `<p class="text-center text-red-500 p-4">エラー: ${message}</p>`;
        }
        
        const canvas = document.getElementById('layoutCanvas');
        if (canvas) {
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);
            ctx.fillStyle = '#ef4444';
            ctx.font = '14px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('レイアウト生成エラー', canvas.width / 2, canvas.height / 2 - 10);
            ctx.fillText(message, canvas.width / 2, canvas.height / 2 + 10);
        }
    }

    renderCanvasLayout(layoutResult) {
        const canvas = document.getElementById('layoutCanvas');
        if (!canvas) {
            console.error('Canvas element not found');
            return;
        }
        
        const ctx = canvas.getContext('2d');
        
        // Calculate proper canvas size with padding for labels
        const labelPadding = 80;
        const maxCanvasWidth = 800;
        const maxCanvasHeight = 600;
        
        // Calculate scale to fit the warehouse in the canvas
        const scaleX = (maxCanvasWidth - labelPadding) / layoutResult.binWidth;
        const scaleY = (maxCanvasHeight - labelPadding) / layoutResult.totalHeight;
        const scale = Math.min(scaleX, scaleY, 50); // Cap maximum scale
        
        // Calculate actual canvas size
        const canvasWidth = Math.max(400, layoutResult.binWidth * scale + labelPadding);
        const canvasHeight = Math.max(300, layoutResult.totalHeight * scale + labelPadding);
        
        canvas.width = canvasWidth;
        canvas.height = canvasHeight;
        canvas.style.display = 'block';
        
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        console.log('=== Canvas Rendering ===');
        console.log('Layout size:', layoutResult.binWidth, 'x', layoutResult.totalHeight);
        console.log('Canvas size:', canvasWidth, 'x', canvasHeight);
        console.log('Scale:', scale);
        
        // Calculate warehouse drawing area
        const warehouseX = labelPadding / 2;
        const warehouseY = labelPadding / 2;
        const warehouseWidth = layoutResult.binWidth * scale;
        const warehouseHeight = layoutResult.totalHeight * scale;
        
        // Draw warehouse background
        ctx.fillStyle = '#f8fafc';
        ctx.fillRect(warehouseX, warehouseY, warehouseWidth, warehouseHeight);
        
        // Draw warehouse border
        ctx.strokeStyle = '#374151';
        ctx.lineWidth = 2;
        ctx.strokeRect(warehouseX, warehouseY, warehouseWidth, warehouseHeight);
        
        // Draw aisles first (if any)
        this.drawAisles(ctx, layoutResult, scale, warehouseX, warehouseY);
        
        // Draw pallets
        this.drawPallets(ctx, layoutResult, scale, warehouseX, warehouseY);
        
        // Add labels (fixed positioning)
        this.addCanvasLabels(ctx, layoutResult, canvasWidth, canvasHeight, warehouseWidth, warehouseHeight);
    }

    drawAisles(ctx, layoutResult, scale, offsetX, offsetY) {
        if (!layoutResult.aislePositions || layoutResult.aislePositions.length === 0) {
            return;
        }

        ctx.fillStyle = '#e5e7eb';
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;

        layoutResult.aislePositions.forEach(aisle => {
            const x = aisle.x * scale + offsetX;
            const y = aisle.y * scale + offsetY;
            const width = aisle.width * scale;
            const height = aisle.height * scale;

            // Draw aisle background
            ctx.fillRect(x, y, width, height);
            ctx.strokeRect(x, y, width, height);

            // Add aisle label
            ctx.fillStyle = '#6b7280';
            ctx.font = 'bold 10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText('通路', x + width/2, y + height/2);
            ctx.fillStyle = '#e5e7eb'; // Reset fill style
        });
    }

    drawPallets(ctx, layoutResult, scale, offsetX, offsetY) {
        const colors = layoutResult.colors;
        const positions = layoutResult.positions;
        
        if (!positions || positions.length === 0) {
            console.warn('No positions to draw');
            this.showEmptyLayoutMessage();
            return;
        }
        
        console.log('Drawing', positions.length, 'pallets');
        
        // Group by pallet type for consistent coloring
        const groupedPositions = this.groupPositionsByType(positions, layoutResult.pallets);
        
        let colorIndex = 0;
        for (const [palletTypeName, typePositions] of Object.entries(groupedPositions)) {
            const color = colors[colorIndex % colors.length];
            
            typePositions.forEach((position) => {
                const [x, y, width, height, palletType, stackLevel] = position;
                
                const canvasX = x * scale + offsetX;
                const canvasY = y * scale + offsetY;
                const canvasWidth = width * scale;
                const canvasHeight = height * scale;
                
                this.drawSinglePallet(ctx, canvasX, canvasY, canvasWidth, canvasHeight, color, stackLevel || 1, width, height);
            });
            
            colorIndex++;
        }
    }

    groupPositionsByType(positions, pallets) {
        const grouped = {};
        
        positions.forEach(position => {
            const [x, y, width, height, palletType, stackLevel] = position;
            
            // Handle case where palletType might be undefined (fallback to index)
            let typeName = 'Unknown';
            if (palletType !== undefined && pallets && pallets[palletType]) {
                typeName = pallets[palletType].name;
            } else {
                // Fallback: try to match by dimensions
                const matchingPallet = pallets?.find(p => 
                    Math.abs(p.length - width) < 0.1 && Math.abs(p.width - height) < 0.1
                );
                if (matchingPallet) {
                    typeName = matchingPallet.name;
                }
            }
            
            if (!grouped[typeName]) {
                grouped[typeName] = [];
            }
            grouped[typeName].push(position);
        });
        
        return grouped;
    }

    drawSinglePallet(ctx, x, y, width, height, color, stackLevel, realWidth, realHeight) {
        // Draw main pallet rectangle with no gaps
        ctx.fillStyle = color;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
        
        // Add border
        ctx.strokeStyle = '#1f2937';
        ctx.lineWidth = 1;
        ctx.strokeRect(Math.round(x), Math.round(y), Math.round(width), Math.round(height));
        
        // Draw stacking indicator if multiple levels
        if (stackLevel > 1) {
            this.drawStackingLines(ctx, x, y, width, height, stackLevel);
        }
        
        // Add text label only if there's enough space
        if (width > 25 && height > 15) {
        this.drawPalletLabel(ctx, x, y, width, height, stackLevel, realWidth, realHeight);
        }
    }

    drawStackingLines(ctx, x, y, width, height, stackLevel) {
        ctx.strokeStyle = '#ffffff';
        ctx.lineWidth = 1;
        ctx.setLineDash([3, 3]); // Dashed lines
        
        for (let i = 1; i < stackLevel; i++) {
            const lineY = y + (height / stackLevel) * i;
            ctx.beginPath();
            ctx.moveTo(x + 2, lineY);
            ctx.lineTo(x + width - 2, lineY);
            ctx.stroke();
        }
        
        ctx.setLineDash([]); // Reset line dash
    }

    drawPalletLabel(ctx, x, y, width, height, stackLevel, realWidth, realHeight) {
        const centerX = x + width / 2;
        const centerY = y + height / 2;
        
        ctx.fillStyle = 'white';
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 0.5;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        if (stackLevel > 1) {
            ctx.font = 'bold 8px Arial';
            const text = `${stackLevel}段`;
            ctx.strokeText(text, centerX, centerY);
            ctx.fillText(text, centerX, centerY);
        } else if (width > 40 && height > 25) {
            ctx.font = 'bold 7px Arial';
            const text = `${realWidth.toFixed(1)}×${realHeight.toFixed(1)}`;
            ctx.strokeText(text, centerX, centerY);
            ctx.fillText(text, centerX, centerY);
        }
    }

    addCanvasLabels(ctx, layoutResult, canvasWidth, canvasHeight, warehouseWidth, warehouseHeight) {
        // Clean layout with non-overlapping labels
        ctx.fillStyle = '#1f2937';
        ctx.strokeStyle = 'white';
        ctx.lineWidth = 1;
        
        // Efficiency info (top-left, simplified)
        ctx.textAlign = 'left';
        ctx.font = 'bold 14px Arial';
        ctx.fillText(`配置効率: ${layoutResult.efficiency.toFixed(1)}%`, 10, 20);
        
        // Warehouse dimensions (bottom and left, non-overlapping)
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'center';
        
        // Width label (bottom center)
        const widthText = `必要幅: ${layoutResult.binWidth.toFixed(1)}m`;
        ctx.fillText(widthText, canvasWidth / 2, canvasHeight - 15);
        
        // Length label (left side, rotated)
        const lengthText = `必要長: ${layoutResult.totalHeight.toFixed(1)}m`;
        ctx.save();
        ctx.translate(15, canvasHeight / 2);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(lengthText, 0, 0);
        ctx.restore();
    }

    getColorPalette() {
        return [
            '#3b82f6', '#10b981', '#f59e0b', '#ef4444', 
            '#8b5cf6', '#06b6d4', '#84cc16', '#f97316',
            '#ec4899', '#6366f1', '#14b8a6', '#f97316'
        ];
    }

    updateLayoutTab() {
        console.log('Updating layout tab...');
        
        // Get selected pallets
        const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
        const selectedPalletIndices = selectedPallets.map(option => parseInt(option.value));
        const selectedPalletObjects = selectedPalletIndices.map(index => this.calculator.pallets[index]).filter(pallet => pallet);
        
        const legendEl = document.getElementById('layoutLegend');
        if (legendEl) {
            if (selectedPalletObjects && selectedPalletObjects.length > 0) {
                const colors = this.getColorPalette();
                this.createLegendWithStacks(selectedPalletObjects, colors, legendEl);
            } else {
                legendEl.innerHTML = '<p class="text-center text-gray-500 p-4">パレットを選択してください</p>';
            }
        }
        
        // If we have a stored layout result, render it
        if (this.calculator.lastLayoutResult && this.calculator.lastLayoutResult.success) {
            this.renderCanvasLayout(this.calculator.lastLayoutResult);
        }
        
        console.log('Layout tab updated successfully');
    }

    createLegendWithStacks(pallets, colors, container) {
        container.innerHTML = '';

        // Header section
        const headerSection = document.createElement('div');
        headerSection.style.cssText = 'margin-bottom: 1rem; padding: 1rem; background: linear-gradient(135deg, var(--primary-600) 0%, var(--primary-800) 100%); border-radius: 0.75rem; color: white;';
        
        const totalPallets = pallets.reduce((sum, p) => sum + p.quantity, 0);
        const layoutResult = this.calculator.lastLayoutResult;
        
        let headerHtml = `
            <div style="display: flex; align-items: center; margin-bottom: 0.75rem;">
                <div style="width: 8px; height: 8px; background: white; border-radius: 50%; margin-right: 0.5rem;"></div>
                <h3 style="margin: 0; font-size: 1.1rem; font-weight: bold;">倉庫レイアウト情報</h3>
            </div>
            <div style="font-size: 0.9rem; opacity: 0.9;">
                合計: ${pallets.length}種類のパレット, ${totalPallets}個
            </div>
        `;
        
        if (layoutResult && layoutResult.success) {
            headerHtml += `
                <div style="margin-top: 0.75rem; padding-top: 0.75rem; border-top: 1px solid rgba(255,255,255,0.2); font-size: 0.8rem;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem;">
                        <div>配置効率: <strong>${layoutResult.efficiency.toFixed(1)}%</strong></div>
                        <div>必要面積: <strong>${layoutResult.totalAreaMin.toFixed(1)}m²</strong></div>
                        <div>使用面積: <strong>${layoutResult.actualArea.toFixed(1)}m²</strong></div>
                        <div>配置: <strong>${layoutResult.gridInfo ? layoutResult.gridInfo.rows + '行×' + layoutResult.gridInfo.cols + '列' : 'N/A'}</strong></div>
                    </div>
                </div>
            `;
        }
        
        headerSection.innerHTML = headerHtml;
        container.appendChild(headerSection);

        // Visual legend section
        const legendSection = document.createElement('div');
        legendSection.style.cssText = 'margin-bottom: 1rem;';
        
        const legendTitle = document.createElement('div');
        legendTitle.style.cssText = 'font-weight: bold; margin-bottom: 0.75rem; color: var(--gray-700); font-size: 0.9rem; display: flex; align-items: center;';
        legendTitle.innerHTML = `
            <div style="width: 4px; height: 16px; background: var(--primary-500); margin-right: 0.5rem; border-radius: 2px;"></div>
            凡例
        `;
        legendSection.appendChild(legendTitle);

        // Warehouse boundary legend
        const warehouseInfo = document.createElement('div');
        warehouseInfo.style.cssText = 'display: flex; align-items: center; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 0.5rem; border-left: 3px solid var(--gray-700);';
        warehouseInfo.innerHTML = `
            <div style="width: 16px; height: 16px; background-color: var(--gray-700); border: 1px solid var(--border-color); margin-right: 0.75rem; border-radius: 2px;"></div>
            <span style="font-size: 0.85rem; color: var(--gray-600);">倉庫境界</span>
        `;
        legendSection.appendChild(warehouseInfo);

        // Aisle legend
        const aisleInfo = document.createElement('div');
        aisleInfo.style.cssText = 'display: flex; align-items: center; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 0.5rem; border-left: 3px solid var(--gray-500);';
        aisleInfo.innerHTML = `
            <div style="width: 16px; height: 16px; background-color: var(--gray-200); border: 1px solid var(--border-color); margin-right: 0.75rem; border-radius: 2px;"></div>
            <span style="font-size: 0.85rem; color: var(--gray-600);">通路エリア</span>
        `;
        legendSection.appendChild(aisleInfo);

        // Pallet type legends
        pallets.forEach((pallet, index) => {
            const stacks = Math.ceil(pallet.quantity / this.calculator.getStackingLevels(pallet));
            const stackingLevels = this.calculator.getStackingLevels(pallet);
            
            const legendItem = document.createElement('div');
            legendItem.style.cssText = 'display: flex; align-items: center; margin-bottom: 0.5rem; padding: 0.5rem; background: var(--bg-tertiary); border-radius: 0.5rem; border-left: 3px solid ' + colors[index % colors.length] + ';';
            legendItem.innerHTML = `
                <div style="width: 16px; height: 16px; background-color: ${colors[index % colors.length]}; border: 1px solid var(--border-color); margin-right: 0.75rem; border-radius: 2px;"></div>
                <div style="flex: 1;">
                    <div style="font-size: 0.85rem; font-weight: 500; color: var(--text-primary);">${pallet.name}</div>
                    <div style="font-size: 0.75rem; color: var(--text-secondary);">${stacks}スタック, ${stackingLevels}段積み</div>
                </div>
            `;
            legendSection.appendChild(legendItem);
        });

        container.appendChild(legendSection);

        // Footer with additional info
        const footerSection = document.createElement('div');
        footerSection.style.cssText = 'padding: 0.75rem; background: var(--bg-tertiary); border-radius: 0.5rem; border: 1px solid var(--border-color);';
        footerSection.innerHTML = `
            <div style="font-size: 0.75rem; color: var(--text-tertiary); text-align: center;">
                <div style="margin-bottom: 0.25rem;">📊 リアルタイム配置最適化</div>
                <div>グリッドベース配置アルゴリズム</div>
            </div>
        `;
        container.appendChild(footerSection);
    }
}