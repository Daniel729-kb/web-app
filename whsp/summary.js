/**
 * Summary Management Module
 * Handles summary tab updates and detailed pallet information display
 */
class SummaryManager {
    constructor(calculator) {
        this.calculator = calculator;
    }

    updateSummaryTab() {
        console.log('Updating summary tab...');
        
        // Update warehouse information
        const warehouseNameEl = document.getElementById('summaryWarehouseName');
        const warehouseDimensionsEl = document.getElementById('summaryWarehouseDimensions');
        const warehouseAreaEl = document.getElementById('summaryWarehouseArea');
        
        if (warehouseNameEl) {
            warehouseNameEl.textContent = this.calculator.warehouse.name;
        }
        if (warehouseDimensionsEl) {
            warehouseDimensionsEl.textContent = `${this.calculator.warehouse.length}×${this.calculator.warehouse.width}×${this.calculator.warehouse.height}m`;
        }
        if (warehouseAreaEl) {
            warehouseAreaEl.textContent = `${(this.calculator.warehouse.length * this.calculator.warehouse.width).toFixed(1)}m²`;
        }

        // Get selected pallets
        const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
        const selectedPalletIndices = selectedPallets.map(option => parseInt(option.value));
        const selectedPalletObjects = selectedPalletIndices.map(index => this.calculator.pallets[index]).filter(pallet => pallet);

        // Update pallet information
        const palletTypesEl = document.getElementById('summaryPalletTypes');
        const totalPalletsEl = document.getElementById('summaryTotalPallets');
        const calculationModeEl = document.getElementById('summaryCalculationMode');
        
        if (palletTypesEl) palletTypesEl.textContent = selectedPalletObjects.length.toString();
        if (totalPalletsEl) totalPalletsEl.textContent = selectedPalletObjects.reduce((sum, p) => sum + p.quantity, 0).toString();
        if (calculationModeEl) calculationModeEl.textContent = document.getElementById('calculationMode').value === 'combined' ? '統合計算' : '個別計算';

        // Update space calculation results
        const summaryRequiredAreaEl = document.getElementById('summaryRequiredArea');
        const summaryMaxStackingEl = document.getElementById('summaryMaxStacking');
        const summaryEfficiencyEl = document.getElementById('summaryEfficiency');
        
        if (this.calculator.lastCalculationResults) {
            if (summaryRequiredAreaEl) {
                summaryRequiredAreaEl.textContent = this.calculator.lastCalculationResults.requiredArea.toFixed(2) + 'm²';
            }
            if (summaryMaxStackingEl) {
                summaryMaxStackingEl.textContent = this.calculator.lastCalculationResults.stackingLevels.toString() + '段';
            }
            if (summaryEfficiencyEl) {
                summaryEfficiencyEl.textContent = this.calculator.lastCalculationResults.efficiency.toFixed(1) + '%';
            }
        } else {
            // Fallback to reading from DOM if results are available
            const requiredAreaEl = document.getElementById('requiredArea');
            const stackingLevelsEl = document.getElementById('stackingLevels');
            const efficiencyEl = document.getElementById('efficiency');
            
            if (requiredAreaEl && summaryRequiredAreaEl && requiredAreaEl.textContent !== '0') {
                summaryRequiredAreaEl.textContent = requiredAreaEl.textContent + 'm²';
            }
            if (stackingLevelsEl && summaryMaxStackingEl && stackingLevelsEl.textContent !== '1') {
                summaryMaxStackingEl.textContent = stackingLevelsEl.textContent + '段';
            }
            if (efficiencyEl && summaryEfficiencyEl && efficiencyEl.textContent !== '0%') {
                summaryEfficiencyEl.textContent = efficiencyEl.textContent;
            }
        }

        // Update settings
        const aisleWidthEl = document.getElementById('aisleWidth');
        const clearanceEl = document.getElementById('palletClearance');
        const includeAislesEl = document.getElementById('includeAisles');

        const summaryAisleWidthEl = document.getElementById('summaryAisleWidth');
        const summaryClearanceEl = document.getElementById('summaryClearance');
        const summaryIncludeAislesEl = document.getElementById('summaryIncludeAisles');
        
        if (aisleWidthEl && summaryAisleWidthEl) summaryAisleWidthEl.textContent = aisleWidthEl.value + 'm';
        if (clearanceEl && summaryClearanceEl) summaryClearanceEl.textContent = clearanceEl.value + 'cm';
        if (includeAislesEl && summaryIncludeAislesEl) summaryIncludeAislesEl.textContent = includeAislesEl.checked ? 'はい' : 'いいえ';

        // Update detailed pallet information
        this.updateSummaryPalletDetails(selectedPalletObjects);
        
        console.log('Summary tab updated successfully');
    }

    updateSummaryPalletDetails(pallets) {
        const container = document.getElementById('summaryPalletDetails');
        container.innerHTML = '';

        if (pallets.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 1rem;">パレットが選択されていません</p>';
            return;
        }

        pallets.forEach((pallet, index) => {
            const stacks = Math.ceil(pallet.quantity / this.calculator.getStackingLevels(pallet));
            const palletCard = document.createElement('div');
            palletCard.style.cssText = 'background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.5rem;';
            
            palletCard.innerHTML = `
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                    <h5 style="margin: 0; color: #1e293b;">${pallet.name}</h5>
                    <span style="background: #3b82f6; color: white; padding: 0.25rem 0.5rem; border-radius: 0.25rem; font-size: 0.75rem;">${stacks}スタック</span>
                </div>
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; font-size: 0.875rem;">
                    <div><span style="color: #6b7280;">寸法:</span> ${pallet.length}×${pallet.width}×${pallet.height}m</div>
                    <div><span style="color: #6b7280;">数量:</span> ${pallet.quantity}個</div>
                    <div><span style="color: #6b7280;">段積み:</span> ${pallet.isStackable ? '可能' : '不可'}</div>
                    <div><span style="color: #6b7280;">最大高さ:</span> ${pallet.maxStackHeight}m</div>
                </div>
            `;
            container.appendChild(palletCard);
        });
    }
}
