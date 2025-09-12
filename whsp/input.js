/**
 * Input Management Module
 * Handles pallet management, form handling, and input validation
 */
class InputManager {
    constructor(calculator) {
        this.calculator = calculator;
        this.currentPalletId = 0;
    }

    initializeEventListeners() {
        // Warehouse settings
        document.getElementById('warehouseLength').addEventListener('input', () => { 
            this.calculator.updateWarehouseInfo(); 
            this.calculator.forceLayoutUpdate(); 
        });
        document.getElementById('warehouseWidth').addEventListener('input', () => { 
            this.calculator.updateWarehouseInfo(); 
            this.calculator.forceLayoutUpdate(); 
        });
        document.getElementById('warehouseHeight').addEventListener('input', () => { 
            this.calculator.updateWarehouseInfo(); 
            this.calculator.forceLayoutUpdate(); 
        });
        document.getElementById('warehouseName').addEventListener('input', () => this.calculator.updateWarehouseInfo());

        // Pallet management
        document.getElementById('addPalletBtn').addEventListener('click', () => this.addPallet());
        
        // Calculation
        document.getElementById('calculateBtn').addEventListener('click', () => this.calculator.calculateSpace());
        
        // Auto-calculate warehouse size
        document.getElementById('autoCalculateWarehouseBtn').addEventListener('click', () => this.calculator.autoCalculateWarehouse());
        
        // Debug export buttons
        document.getElementById('exportDebugCSVBtn').addEventListener('click', () => this.calculator.debugExporter.exportDebugCSV());
        document.getElementById('exportDebugJSONBtn').addEventListener('click', () => this.calculator.debugExporter.exportDebugJSON());
        
        // Layout generation buttons removed - now auto-generated

        // Dynamic redraw inputs
        document.getElementById('aisleWidth').addEventListener('input', () => this.calculator.redrawLayoutIfActive());
        document.getElementById('palletClearance').addEventListener('input', () => this.calculator.redrawLayoutIfActive());
        document.getElementById('includeAisles').addEventListener('change', () => this.calculator.redrawLayoutIfActive());
        document.getElementById('calculationMode').addEventListener('change', () => this.calculator.redrawLayoutIfActive());
        document.getElementById('selectedPallets').addEventListener('change', () => this.calculator.redrawLayoutIfActive());
    }

    addPallet() {
        const name = document.getElementById('palletName').value.trim() || 'A';
        const length = parseFloat(document.getElementById('palletLength').value);
        const width = parseFloat(document.getElementById('palletWidth').value);
        const height = parseFloat(document.getElementById('palletHeight').value);
        const quantity = parseInt(document.getElementById('palletQuantity').value);
        const isStackable = document.getElementById('isStackable').checked;
        const maxStackHeight = parseFloat(document.getElementById('maxStackHeight').value);

        if (!length || !width || !height || !quantity) {
            this.calculator.showMessage('寸法と数量を入力してください', 'error');
            return;
        }

        const pallet = {
            id: ++this.currentPalletId,
            name: name,
            length: length,
            width: width,
            height: height,
            quantity: quantity,
            isStackable: isStackable,
            maxStackHeight: maxStackHeight,
            volume: length * width * height
        };

        this.calculator.pallets.push(pallet);
        this.updatePalletList();
        this.updatePalletSelector();
        this.clearPalletForm();

        this.calculator.showMessage(`パレット「${name}」を追加しました`, 'success');
    }

    updatePalletList() {
        const container = document.getElementById('palletList');
        container.innerHTML = '';

        if (this.calculator.pallets.length === 0) {
            container.innerHTML = '<p style="text-align: center; color: #6b7280; padding: 1rem;">パレットがありません</p>';
            return;
        }

        this.calculator.pallets.forEach((pallet, index) => {
            const palletElement = document.createElement('div');
            palletElement.className = 'pallet-item';
            palletElement.innerHTML = `
                <div class="pallet-info">
                    <h4>${pallet.name}</h4>
                    <p>寸法: ${pallet.length}×${pallet.width}×${pallet.height}m | 数量: ${pallet.quantity}個 | 段積み: ${pallet.isStackable ? '可能' : '不可'}</p>
                </div>
                <div class="pallet-actions">
                    <button class="btn btn-sm" onclick="calculator.inputManager.editPallet(${index})">編集</button>
                    <button class="btn btn-sm btn-danger" onclick="calculator.inputManager.deletePallet(${index})">削除</button>
                </div>
            `;
            container.appendChild(palletElement);
        });
    }

    updatePalletSelector() {
        const selector = document.getElementById('selectedPallets');
        selector.innerHTML = '';

        this.calculator.pallets.forEach((pallet, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = `${pallet.name} (${pallet.length}×${pallet.width}×${pallet.height}m, ${pallet.quantity}個)`;
            option.selected = true;
            selector.appendChild(option);
        });
    }

    clearPalletForm() {
        document.getElementById('palletName').value = '';
        document.getElementById('palletLength').value = '1.1';
        document.getElementById('palletWidth').value = '1.1';
        document.getElementById('palletHeight').value = '1.1';
        document.getElementById('palletQuantity').value = '10';
        document.getElementById('isStackable').checked = true;
        document.getElementById('maxStackHeight').value = '3.0';
    }

    editPallet(index) {
        const pallet = this.calculator.pallets[index];
        if (!pallet) return;

        document.getElementById('palletName').value = pallet.name;
        document.getElementById('palletLength').value = pallet.length;
        document.getElementById('palletWidth').value = pallet.width;
        document.getElementById('palletHeight').value = pallet.height;
        document.getElementById('palletQuantity').value = pallet.quantity;
        document.getElementById('isStackable').checked = pallet.isStackable;
        document.getElementById('maxStackHeight').value = pallet.maxStackHeight;

        this.calculator.pallets.splice(index, 1);
        this.updatePalletList();
        this.updatePalletSelector();
        this.calculator.showMessage(`パレット「${pallet.name}」を編集モードにしました`, 'success');
    }

    deletePallet(index) {
        if (confirm('このパレットを削除しますか？')) {
            this.calculator.pallets.splice(index, 1);
            this.updatePalletList();
            this.updatePalletSelector();
            this.calculator.showMessage('パレットを削除しました', 'success');
        }
    }

    updateWarehouseInfo() {
        this.calculator.warehouse.name = document.getElementById('warehouseName').value || '倉庫';
        this.calculator.warehouse.length = parseFloat(document.getElementById('warehouseLength').value) || 50;
        this.calculator.warehouse.width = parseFloat(document.getElementById('warehouseWidth').value) || 40;
        this.calculator.warehouse.height = parseFloat(document.getElementById('warehouseHeight').value) || 9;
    }
}
