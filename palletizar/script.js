// グローバル変数の初期化
window.currentPallets = [];

// 高さ制限のグローバル変数
let maxHeightLimit = 158; // デフォルトは158cm（パレット台座14cm含む）

// 初期データ（拡張サンプル）
let cartonData = [
    { id: 1, code: 'SAMPLE A', qty: 362, weight: 6.70, l: 53.0, w: 38.5, h: 23.5 },
    { id: 2, code: 'SAMPLE B', qty: 42, weight: 7.60, l: 55.0, w: 40.0, h: 24.0 }
];

const allPalletSizes = [
    { name: '1100×1000', width: 110.0, depth: 100.0, description: '標準パレット' },
    { name: '1100×1100', width: 110.0, depth: 110.0, description: '正方形パレット' },
    { name: '1200×1000', width: 120.0, depth: 100.0, description: '大型パレット' },
    { name: '1200×1100', width: 120.0, depth: 110.0, description: '特大パレット' }
];

let selectedPalletSizes = [...allPalletSizes]; // デフォルトで全選択

let editingId = null;
let nextId = 7;

// Helper function for safe division
function safeDivide(a, b, defaultValue = 0) {
    return b !== 0 ? a / b : defaultValue;
}

// === 高さ制限設定機能 ===
function setHeightLimit(height) {
    const input = document.getElementById('heightLimitInput');
    const display = document.getElementById('heightLimitDisplay');
    const warning = document.getElementById('heightWarning');
    
    // 値を更新
    input.value = height;
    maxHeightLimit = height;
    display.textContent = height;
    
    // プリセットボタンの状態更新
    document.querySelectorAll('.height-preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    event.target.classList.add('active');
    
    // 警告表示の判定
    if (height > 180) {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
    
    console.log(`高さ制限を${height}cmに設定しました`);
    
    // 既に計算結果がある場合は影響を通知
    if (window.currentPallets && window.currentPallets.length > 0) {
        const affectedPallets = window.currentPallets.filter(pallet => pallet.height > height);
        if (affectedPallets.length > 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning';
            alertDiv.innerHTML = `⚠️ 高さ制限変更: ${affectedPallets.length}枚のパレットが新しい制限(${height}cm)を超過しています。再計算を推奨します。`;
            document.getElementById('errors').appendChild(alertDiv);
        }
    }
}

function updateHeightLimitFromInput() {
    const input = document.getElementById('heightLimitInput');
    const display = document.getElementById('heightLimitDisplay');
    const warning = document.getElementById('heightWarning');
    
    let height = parseInt(input.value);
    
    // バリデーション
    if (isNaN(height) || height < 50) {
        height = 50;
        input.value = 50;
    } else if (height > 300) {
        height = 300;
        input.value = 300;
    }
    
    maxHeightLimit = height;
    display.textContent = height;
    
    // プリセットボタンの状態更新（該当する値の場合）
    document.querySelectorAll('.height-preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    const matchingPreset = document.querySelector(`[onclick="setHeightLimit(${height})"]`);
    if (matchingPreset) {
        matchingPreset.classList.add('active');
    }
    
    // 警告表示の判定
    if (height > 180) {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
    
    console.log(`高さ制限を${height}cmに更新しました`);
}

// 高さ制限を取得する関数（カートン配置可能高さ）
function getMaxCartonHeight() {
    return maxHeightLimit - 14; // パレット台座14cmを除いたカートン配置可能高さ
}

// 高さ制限を取得する関数（総高さ）
function getMaxTotalHeight() {
    return maxHeightLimit;
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    updateTable();
    updateSummary();
    setupEventListeners();
    initializePalletSelection();
    initializeHeightLimit();
});

function initializeHeightLimit() {
    const input = document.getElementById('heightLimitInput');
    if (input) {
        input.addEventListener('input', updateHeightLimitFromInput);
        input.addEventListener('blur', updateHeightLimitFromInput);
    }
}

function setupEventListeners() {
    document.getElementById('addButton').addEventListener('click', toggleAddForm);
    document.getElementById('saveAddButton').addEventListener('click', addCarton);
    document.getElementById('cancelAddButton').addEventListener('click', cancelAdd);
    document.getElementById('calculateButton').addEventListener('click', calculateImprovedPalletization);
    
    // インポート機能
    document.getElementById('downloadTemplateButton').addEventListener('click', downloadCSVTemplate);
    document.getElementById('importButton').addEventListener('click', toggleImportArea);
    document.getElementById('executeImportButton').addEventListener('click', executeImport);
    document.getElementById('cancelImportButton').addEventListener('click', cancelImport);
    
    // 一括削除機能
    document.getElementById('clearAllButton').addEventListener('click', clearAllCartons);
    
    // Export機能
    const exportBtn = document.getElementById('exportButton');
    if (exportBtn) exportBtn.addEventListener('click', exportSummaryCsv);
    
    // パレット結合機能
    document.getElementById('combineButton').addEventListener('click', combinePallets);
    document.getElementById('autoOptimizeButton').addEventListener('click', autoOptimizePallets);
    document.getElementById('analyzeButton').addEventListener('click', analyzeSelectedPallets);
    document.getElementById('pallet1Select').addEventListener('change', updateCombinePreview);
    document.getElementById('pallet2Select').addEventListener('change', updateCombinePreview);

    // パレット選択機能
    document.getElementById('selectAllPallets').addEventListener('click', selectAllPallets);
    document.getElementById('deselectAllPallets').addEventListener('click', deselectAllPallets);
}

// === パレット選択機能 ===
function initializePalletSelection() {
    const palletOptions = document.getElementById('palletOptions');
    palletOptions.innerHTML = '';

    allPalletSizes.forEach((pallet, index) => {
        const option = document.createElement('div');
        option.className = 'pallet-option selected';
        option.onclick = () => togglePalletSelection(index);
        
        option.innerHTML = `
            <input type="checkbox" class="pallet-checkbox" checked>
            <div class="pallet-option-info">
                <div class="pallet-option-name">${pallet.name}</div>
                <div class="pallet-option-size">${pallet.description} - ${pallet.width}cm × ${pallet.depth}cm</div>
            </div>
        `;
        
        palletOptions.appendChild(option);
    });

    updateSelectedPalletsInfo();
}

function togglePalletSelection(index) {
    const option = document.querySelectorAll('.pallet-option')[index];
    const checkbox = option.querySelector('.pallet-checkbox');
    
    if (option.classList.contains('selected')) {
        option.classList.remove('selected');
        checkbox.checked = false;
    } else {
        option.classList.add('selected');
        checkbox.checked = true;
    }
    
    updateSelectedPalletSizes();
    updateSelectedPalletsInfo();
}

function selectAllPallets() {
    document.querySelectorAll('.pallet-option').forEach((option, index) => {
        option.classList.add('selected');
        option.querySelector('.pallet-checkbox').checked = true;
    });
    updateSelectedPalletSizes();
    updateSelectedPalletsInfo();
}

function deselectAllPallets() {
    document.querySelectorAll('.pallet-option').forEach((option, index) => {
        option.classList.remove('selected');
        option.querySelector('.pallet-checkbox').checked = false;
    });
    updateSelectedPalletSizes();
    updateSelectedPalletsInfo();
}

function updateSelectedPalletSizes() {
    selectedPalletSizes = [];
    document.querySelectorAll('.pallet-option').forEach((option, index) => {
        if (option.classList.contains('selected')) {
            selectedPalletSizes.push(allPalletSizes[index]);
        }
    });
}

function updateSelectedPalletsInfo() {
    const info = document.getElementById('selectedPalletsInfo');
    const count = selectedPalletSizes.length;
    
    if (count === 0) {
        info.textContent = '⚠️ パレット種類を選択してください';
        info.style.color = '#dc2626';
    } else if (count === allPalletSizes.length) {
        info.textContent = `✅ 全${count}種類のパレットで最適化計算`;
        info.style.color = '#16a34a';
    } else {
        info.textContent = `✅ ${count}種類のパレットで最適化計算`;
        info.style.color = '#2563eb';
    }
}

// === パレット番号クリック機能 ===
function scrollToPallet(palletIndex) {
    const palletCard = document.getElementById(`pallet-${palletIndex}`);
    if (palletCard) {
        palletCard.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // ハイライト効果
        palletCard.style.boxShadow = '0 0 20px rgba(37, 99, 235, 0.3)';
        palletCard.style.transform = 'scale(1.02)';
        palletCard.style.transition = 'all 0.3s ease';
        
        setTimeout(() => {
            palletCard.style.boxShadow = '';
            palletCard.style.transform = '';
        }, 2000);
    }
}

function clearAllCartons() {
    if (cartonData.length === 0) {
        alert('削除するデータがありません。');
        return;
    }
    
    const totalCartons = cartonData.reduce((sum, item) => sum + item.qty, 0);
    const confirmMessage = `本当にすべての貨物データを削除しますか？\n\n削除されるデータ：\n・貨物種類: ${cartonData.length}種類\n・総カートン数: ${totalCartons}個\n\nこの操作は取り消せません。`;
    
    if (confirm(confirmMessage)) {
        if (confirm('⚠️ 最終確認 ⚠️\n\nすべての貨物データが完全に削除されます。\n本当に実行しますか？')) {
            cartonData.length = 0;
            updateTable();
            updateSummary();
            
            const results = document.getElementById('results');
            results.classList.add('hidden');
            
            document.getElementById('errors').innerHTML = '';
            
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success';
            successDiv.innerHTML = `✅ すべての貨物データを削除しました。`;
            document.getElementById('errors').appendChild(successDiv);
            
            console.log('すべての貨物データが削除されました');
        }
    }
}

function downloadCSVTemplate() {
    const template = [
        ['貨物コード', '数量', '重量(kg)', '長さ(cm)', '幅(cm)', '高さ(cm)'],
        ['a', '620', '6.70', '53.0', '38.5', '23.5'],
        ['b', '44', '7.60', '55.0', '40.0', '24.0']
    ];
    
    const csvContent = template.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', 'importtemplate.csv');
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

function toggleImportArea() {
    const importArea = document.getElementById('importArea');
    const addForm = document.getElementById('addForm');
    
    addForm.classList.add('hidden');
    importArea.classList.toggle('hidden');
}

function toggleAddForm() {
    const form = document.getElementById('addForm');
    const importArea = document.getElementById('importArea');
    
    importArea.classList.add('hidden');
    form.classList.toggle('hidden');
}

function executeImport() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        alert('CSVファイルを選択してください。');
        return;
    }
    
    if (!file.name.toLowerCase().endsWith('.csv')) {
        alert('CSVファイル(.csv)を選択してください。');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        try {
            parseAndImportCSV(csvText);
        } catch (error) {
            showErrors(['CSVファイルの読み込みに失敗しました: ' + error.message]);
        }
    };
    
    reader.readAsText(file, 'UTF-8');
}

function parseAndImportCSV(csvText) {
    if (csvText.charCodeAt(0) === 0xFEFF) {
        csvText = csvText.substr(1);
    }
    
    const lines = csvText.split(/\r?\n/).filter(line => line.trim());
    
    if (lines.length < 2) {
        showErrors(['CSVファイルにデータが含まれていません。']);
        return;
    }
    
    const errors = [];
    const tempCartons = {};
    let processedLines = 0;
    let combinedItems = 0;
    
    for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim();
        if (!line) continue;
        
        let columns = line.split(',');
        if (columns.length < 6) {
            columns = line.split('\t');
        }
        if (columns.length < 6) {
            columns = line.split(';');
        }
        
        columns = columns.map(col => col.trim().replace(/['"]/g, ''));
        
        if (columns.length < 6) {
            errors.push(`行${i + 1}: 列数が不足しています (${columns.length}列)`);
            continue;
        }
        
        const [code, qtyStr, weightStr, lStr, wStr, hStr] = columns;
        
        if (!code) {
            errors.push(`行${i + 1}: 貨物コードが入力されていません`);
            continue;
        }
        
        const qty = parseInt(qtyStr);
        const weight = parseFloat(weightStr);
        const l = parseFloat(lStr);
        const w = parseFloat(wStr);
        const h = parseFloat(hStr);
        
        if (isNaN(qty) || qty <= 0) {
            errors.push(`行${i + 1}: 数量が無効です (${qtyStr})`);
            continue;
        }
        
        if (isNaN(weight) || weight <= 0) {
            errors.push(`行${i + 1}: 重量が無効です (${weightStr})`);
            continue;
        }
        
        if (isNaN(l) || l <= 0 || l > 500) {
            errors.push(`行${i + 1}: 長さが無効です (${lStr})`);
            continue;
        }
        
        if (isNaN(w) || w <= 0 || w > 500) {
            errors.push(`行${i + 1}: 幅が無効です (${wStr})`);
            continue;
        }
        
        if (isNaN(h) || h <= 0 || h > 200) {
            errors.push(`行${i + 1}: 高さが無効です (${hStr})`);
            continue;
        }
        
        if (tempCartons[code]) {
            tempCartons[code].qty += qty;
            combinedItems++;
        } else {
            tempCartons[code] = {
                code: code,
                qty: qty,
                weight: weight,
                l: l,
                w: w,
                h: h
            };
        }
        
        processedLines++;
    }
    
    const newCartons = [];
    let duplicatesWithExisting = [];
    
    for (const [code, item] of Object.entries(tempCartons)) {
        const existing = cartonData.find(existingItem => existingItem.code === code);
        if (existing) {
            duplicatesWithExisting.push(`${code} (新規: ${item.qty}個, 既存: ${existing.qty}個)`);
            continue;
        }
        
        newCartons.push({
            id: nextId++,
            code: item.code,
            qty: item.qty,
            weight: item.weight,
            l: item.l,
            w: item.w,
            h: item.h
        });
    }
    
    if (duplicatesWithExisting.length > 0) {
        errors.push(`既存データと重複する貨物コード: ${duplicatesWithExisting.join(', ')}`);
    }
    
    if (errors.length > 0) {
        showErrors(errors);
    }
    
    if (newCartons.length > 0) {
        cartonData.push(...newCartons);
        updateTable();
        updateSummary();
        
        let successMessage = `✅ ${newCartons.length}件のデータを正常にインポートしました。`;
        if (combinedItems > 0) {
            successMessage += `<br>📊 ${combinedItems}件の重複行を自動的に合計しました。`;
        }
        if (duplicatesWithExisting.length > 0) {
            successMessage += `<br>⚠️ ${duplicatesWithExisting.length}件は既存データと重複のためスキップしました。`;
        }
        
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.innerHTML = successMessage;
        document.getElementById('errors').appendChild(successDiv);
        
        cancelImport();
    } else if (newCartons.length === 0 && errors.length === 0) {
        showErrors(['インポート可能な新規データがありません。']);
    }
}

function cancelImport() {
    document.getElementById('importArea').classList.add('hidden');
    document.getElementById('csvFileInput').value = '';
}

function addCarton() {
    const code = document.getElementById('newCode').value.trim();
    const qty = parseInt(document.getElementById('newQty').value) || 0;
    const weight = parseFloat(document.getElementById('newWeight').value) || 0;
    const l = parseFloat(document.getElementById('newL').value) || 0;
    const w = parseFloat(document.getElementById('newW').value) || 0;
    const h = parseFloat(document.getElementById('newH').value) || 0;

    if (!code || qty <= 0 || weight <= 0 || l <= 0 || w <= 0 || h <= 0) {
        alert('すべての項目を正しく入力してください。');
        return;
    }

    const existing = cartonData.find(item => item.code === code);
    if (existing) {
        alert(`貨物コード "${code}" は既に存在します。`);
        return;
    }

    cartonData.push({
        id: nextId++,
        code: code,
        qty: qty,
        weight: weight,
        l: l,
        w: w,
        h: h
    });

    clearAddForm();
    updateTable();
    updateSummary();
}

function cancelAdd() {
    clearAddForm();
}

function clearAddForm() {
    document.getElementById('newCode').value = '';
    document.getElementById('newQty').value = '';
    document.getElementById('newWeight').value = '';
    document.getElementById('newL').value = '';
    document.getElementById('newW').value = '';
    document.getElementById('newH').value = '';
    document.getElementById('addForm').classList.add('hidden');
}

function updateTable() {
    const tbody = document.getElementById('cartonTableBody');
    tbody.innerHTML = '';

    if (cartonData.length === 0) {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td colspan="8" style="text-align: center; padding: 40px; color: #666; font-style: italic;">
                貨物データがありません。<br>
                <small style="margin-top: 10px; display: block;">
                    「📄 CSVインポート」でデータを一括追加するか、「➕ 新規追加」で個別に追加してください。
                </small>
            </td>
        `;
        tbody.appendChild(row);
        return;
    }

    cartonData.forEach(item => {
        const volume = (item.l * item.w * item.h) / 1000000;
        const row = document.createElement('tr');
        
        if (editingId === item.id) {
            row.innerHTML = `
                <td><input type="text" value="${item.code}" id="edit-code-${item.id}" class="form-input" style="width: 100%;"></td>
                <td class="center"><input type="number" value="${item.qty}" id="edit-qty-${item.id}" class="form-input" style="width: 80px;"></td>
                <td class="center"><input type="number" value="${item.weight}" step="0.1" id="edit-weight-${item.id}" class="form-input" style="width: 80px;"></td>
                <td class="center"><input type="number" value="${item.l}" step="0.1" id="edit-l-${item.id}" class="form-input" style="width: 80px;"></td>
                <td class="center"><input type="number" value="${item.w}" step="0.1" id="edit-w-${item.id}" class="form-input" style="width: 80px;"></td>
                <td class="center"><input type="number" value="${item.h}" step="0.1" id="edit-h-${item.id}" class="form-input" style="width: 80px;"></td>
                <td class="center">${volume.toFixed(3)}</td>
                <td class="center">
                    <div class="action-buttons">
                        <button onclick="saveEdit(${item.id})" class="btn btn-success btn-sm">💾</button>
                        <button onclick="cancelEdit()" class="btn btn-secondary btn-sm">❌</button>
                    </div>
                </td>
            `;
        } else {
            row.innerHTML = `
                <td class="mono">${item.code}</td>
                <td class="center">${item.qty}</td>
                <td class="center">${item.weight}</td>
                <td class="center">${item.l}</td>
                <td class="center">${item.w}</td>
                <td class="center">${item.h}</td>
                <td class="center">${volume.toFixed(3)}</td>
                <td class="center">
                    <div class="action-buttons">
                        <button onclick="startEdit(${item.id})" class="btn btn-primary btn-sm">✏️</button>
                        <button onclick="deleteCarton(${item.id})" class="btn btn-danger btn-sm">🗑️</button>
                    </div>
                </td>
            `;
        }
        tbody.appendChild(row);
    });
}

function updateSummary() {
    const totalCartons = cartonData.reduce((sum, item) => sum + item.qty, 0);
    const totalWeight = cartonData.reduce((sum, item) => sum + (item.qty * item.weight), 0);
    const itemCount = cartonData.length;

    document.getElementById('totalCartons').textContent = `${totalCartons} 個`;
    document.getElementById('totalWeight').textContent = `${totalWeight.toFixed(1)} kg`;
    document.getElementById('itemCount').textContent = `${itemCount} 種類`;
    
    const clearAllButton = document.getElementById('clearAllButton');
    if (clearAllButton) {
        clearAllButton.disabled = cartonData.length === 0;
        clearAllButton.title = cartonData.length === 0 ? '削除するデータがありません' : `${itemCount}種類の貨物データを一括削除`;
    }
}

function startEdit(id) {
    editingId = id;
    updateTable();
}

function saveEdit(id) {
    const code = document.getElementById(`edit-code-${id}`).value.trim();
    const qty = parseInt(document.getElementById(`edit-qty-${id}`).value) || 0;
    const weight = parseFloat(document.getElementById(`edit-weight-${id}`).value) || 0;
    const l = parseFloat(document.getElementById(`edit-l-${id}`).value) || 0;
    const w = parseFloat(document.getElementById(`edit-w-${id}`).value) || 0;
    const h = parseFloat(document.getElementById(`edit-h-${id}`).value) || 0;

    if (!code || qty <= 0 || weight <= 0 || l <= 0 || w <= 0 || h <= 0) {
        alert('すべての項目を正しく入力してください。');
        return;
    }

    const itemIndex = cartonData.findIndex(item => item.id === id);
    if (itemIndex !== -1) {
        cartonData[itemIndex] = {
            id: id,
            code: code,
            qty: qty,
            weight: weight,
            l: l,
            w: w,
            h: h
        };
    }

    editingId = null;
    updateTable();
    updateSummary();
}

function cancelEdit() {
    editingId = null;
    updateTable();
}

function deleteCarton(id) {
    if (confirm('このカートンを削除しますか？')) {
        const index = cartonData.findIndex(item => item.id === id);
        if (index !== -1) {
            cartonData.splice(index, 1);
            updateTable();
            updateSummary();
        }
    }
}

function showErrors(errors) {
    const errorsDiv = document.getElementById('errors');
    errorsDiv.innerHTML = '';
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.innerHTML = `⚠️ ${error}`;
        errorsDiv.appendChild(errorDiv);
    });
}