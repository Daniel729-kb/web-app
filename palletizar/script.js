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
    initializeTheme();
    try { startIntroAnimations(); } catch(_) {}
    try { setupInteractionAnimations(); } catch(_) {}
    try { observeReveals(); } catch(_) {}
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

    // テーマ切替
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', (e) => {
            toggleTheme();
            if (window.anime) {
                anime({ targets: e.currentTarget, scale: [1, 1.1, 1], duration: 300, easing: 'easeOutQuad' });
            }
        });
    }
}

function initializeTheme() {
    try {
        const stored = localStorage.getItem('palletizar_theme');
        const theme = stored || 'light';
        applyTheme(theme);
    } catch (_) {
        applyTheme('light');
    }
}

function toggleTheme() {
    const isDark = document.body.classList.toggle('dark');
    const theme = isDark ? 'dark' : 'light';
    applyTheme(theme);
    try { localStorage.setItem('palletizar_theme', theme); } catch (_) {}
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = '☀️ ライト';
    } else {
        document.body.classList.remove('dark');
        const btn = document.getElementById('themeToggle');
        if (btn) btn.textContent = '🌙 ダーク';
    }
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
    
    if (window.anime) {
        anime({ targets: option, scale: [1, 1.05, 1], duration: 250, easing: 'easeOutQuad' });
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

    if (window.anime) {
        anime({ targets: info, opacity: [0.6, 1], duration: 250, easing: 'easeOutQuad' });
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

// === 修正版パレタイズ計算（高さ制限対応） ===
function calculateImprovedPalletization() {
    if (cartonData.length === 0) {
        alert('カートンデータがありません。');
        return;
    }

    if (selectedPalletSizes.length === 0) {
        alert('パレット種類を選択してください。');
        return;
    }

    const loading = document.getElementById('loading');
    const calculateButton = document.getElementById('calculateButton');
    const results = document.getElementById('results');
    
    loading.classList.add('show');
    calculateButton.disabled = true;
    results.classList.add('hidden');
    showErrors([]);

    setTimeout(() => {
        try {
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
                    return;
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
            if (unplaced.length > 0) {
                const unplacedTotal = unplaced.reduce((sum, item) => sum + item.remaining, 0);
                const heightBlocked = unplaced.filter(item => item.h > getMaxCartonHeight());
                
                console.log(`\n⚠️ 未配置: ${unplacedTotal}個`);
                unplaced.forEach(item => {
                    const reason = item.h > getMaxCartonHeight() ? 
                        `高さ制限超過(${item.h}cm > ${getMaxCartonHeight()}cm)` : '配置効率制限';
                    console.log(`  ${item.code}: ${item.remaining}個 - ${reason}`);
                });

                if (heightBlocked.length > 0) {
                    const heightBlockedTotal = heightBlocked.reduce((sum, item) => sum + item.remaining, 0);
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'alert alert-warning';
                    warningDiv.innerHTML = `⚠️ 高さ制限により${heightBlockedTotal}個のカートンが未配置です。<br>` +
                        `制限を${Math.max(...heightBlocked.map(item => item.h)) + 14}cm以上に設定すると配置可能になります。`;
                    document.getElementById('errors').appendChild(warningDiv);
                }
            } else {
                console.log('\n🎉 全カートンを配置完了！');
                const successDiv = document.createElement('div');
                successDiv.className = 'alert alert-success';
                successDiv.innerHTML = `🎉 高さ制限${maxHeightLimit}cm以内で全カートンの配置が完了しました！`;
                document.getElementById('errors').appendChild(successDiv);
            }

            window.currentPallets = pallets;
            displayResults(pallets);
            buildSummaryTable(pallets);
            
        } catch (error) {
            console.error('計算エラー:', error);
            showErrors(['計算中にエラーが発生しました: ' + error.message]);
        } finally {
            loading.classList.remove('show');
            calculateButton.disabled = false;
        }
    }, 1000);
}

// === 最適パレット配置計算（高さ制限対応） ===
function findOptimalPalletConfiguration(availableItems) {
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
function calculateSmallQuantityMixedPallet(availableItems, palletSize) {
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

        // 🔧 安定性チェックを追加（安全な改善）
        const previousLayer = layers.length > 0 ? layers[layers.length - 1] : null;
        if (!canAddLayerSafely(mixedLayer, currentHeight, maxHeightLimit, previousLayer, palletSize)) {
            console.log('  安定性チェック失敗: この層は追加できません');
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
function calculateLargeQuantityDedicatedPallet(availableItems, palletSize) {
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

        // 🔧 安定性チェックを追加（安全な改善）
        const previousLayer = layers.length > 0 ? layers[layers.length - 1] : null;
        if (!canAddLayerSafely(dedicatedLayer, currentHeight, maxHeightLimit, previousLayer, palletSize)) {
            console.log(`  ${primaryItem.code}専用層: 安定性チェック失敗`);
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
function calculateBalancedPallet(availableItems, palletSize) {
    const validItems = availableItems.filter(item => item.h <= getMaxCartonHeight());
    if (validItems.length === 0) return null;
    
    return calculatePalletConfigurationForItem(validItems, palletSize, validItems[0]);
}

// === 特定貨物コード優先パレット配置（高さ制限対応） ===
function calculatePalletConfigurationForItem(availableItems, palletSize, priorityItem) {
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
        
        // 🔧 安定性のため重量・面積・高さ順でソート（重い・大きいものを優先）
        const sortedPlaceable = sortItemsForStability(placeable);
        
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
        sortedPlaceable.forEach(item => {
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

        // 🔧 安定性チェックを追加（安全な改善）
        const previousLayer = layers.length > 0 ? layers[layers.length - 1] : null;
        if (!canAddLayerSafely(bestLayer, currentHeight, maxHeightLimit, previousLayer, palletSize)) {
            console.log('安定性チェック失敗: この層は追加できません');
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

        console.log(`層${layers.length}完了: 高さ${currentHeight}cm ≤ 制限${maxHeightLimit}cm`);
    }

    if (selectedCartons.length === 0) {
        console.log('❌ 配置結果: カートンなし');
        return null;
    }

    console.log(`\n✅ パレット配置完了: 高さ${currentHeight}cm ≤ 制限${maxHeightLimit}cm`);

    return {
        palletSize,
        cartons: selectedCartons,
        layers: layers,
        height: currentHeight,
        totalWeight,
        safetyWarnings: []
    };
}

// === 高さベース混載層作成（高さ制限対応） ===
function createHeightBasedMixedLayer(remainingItems, palletSize, maxHeight) {
    const layerCartons = [];
    let layerWeight = 0;
    
    // 利用可能なアイテムを取得（高さ制限考慮）
    const availableItems = remainingItems.filter(item => 
        item.remaining > 0 && 
        item.h <= maxHeight &&
        item.h <= getMaxCartonHeight()
    );
    
    if (availableItems.length === 0) {
        return null;
    }

    // 高さでグループ化（±2cm許容）
    const heightGroups = {};
    availableItems.forEach(item => {
        let groupFound = false;
        
        for (const [groupHeight, groupItems] of Object.entries(heightGroups)) {
            if (Math.abs(item.h - parseFloat(groupHeight)) <= 2) {
                groupItems.push(item);
                groupFound = true;
                break;
            }
        }
        
        if (!groupFound) {
            heightGroups[item.h.toString()] = [item];
        }
    });

    // 混載に最適なグループを選択
    let bestGroup = null;
    let bestGroupScore = 0;
    
    for (const [groupHeight, groupItems] of Object.entries(heightGroups)) {
        const multipleTypes = groupItems.length > 1;
        const smallQuantities = groupItems.every(item => item.remaining <= 4);
        const totalQuantity = groupItems.reduce((sum, item) => sum + item.remaining, 0);
        
        if (multipleTypes && smallQuantities && totalQuantity >= 3) {
            const groupScore = totalQuantity * 10 + (multipleTypes ? 20 : 0);
            if (groupScore > bestGroupScore) {
                bestGroupScore = groupScore;
                bestGroup = groupItems;
                layerHeight = parseFloat(groupHeight);
            }
        }
    }
    
    if (!bestGroup) {
        return null;
    }

    console.log(`  高さベース混載層: ${layerHeight}cm, 候補${bestGroup.length}種類`);

    // バランスの取れた混載配置
    const occupiedGrid = createOccupiedGrid(palletSize, []);
    const sortedItems = bestGroup.sort((a, b) => a.remaining - b.remaining);
    
    for (const item of sortedItems) {
        if (item.remaining <= 0) continue;

        const maxPlace = Math.min(item.remaining, 6);
        let placedCount = 0;
        
        for (let i = 0; i < maxPlace; i++) {
            const additionalPlacements = findAdditionalPlacements(item, palletSize, occupiedGrid);
            
            if (additionalPlacements.length > 0) {
                layerCartons.push({
                    code: item.code,
                    weight: item.weight,
                    l: item.l,
                    w: item.w,
                    h: item.h,
                    position: additionalPlacements[0]
                });
                layerWeight += item.weight;
                placedCount++;
            } else {
                break;
            }
        }
    }

    if (layerCartons.length === 0) {
        return null;
    }

    const area = layerCartons.reduce((sum, carton) => sum + (carton.l * carton.w), 0);
    const codeCounts = layerCartons.reduce((acc, carton) => {
        acc[carton.code] = (acc[carton.code] || 0) + 1;
        return acc;
    }, {});

    const uniqueCodes = Object.keys(codeCounts);
    const isActuallyMixed = uniqueCodes.length > 1;

    return {
        cartons: layerCartons,
        height: layerHeight,
        weight: layerWeight,
        area: area,
        type: isActuallyMixed ? 'mixed' : 'single',
        pattern: `高さベース混載: ${Object.entries(codeCounts).map(([code, count]) => `${code}×${count}`).join('+')}`
    };
}

// === 層スコア計算 ===
function calculateLayerScore(layer, palletSize, isPriority = false) {
    const palletArea = palletSize.width * palletSize.depth;
    const areaUtilization = layer.area / palletArea;
    const cartonCount = layer.cartons.length;
    
    let score = areaUtilization * 40 + cartonCount * 10;
    
    const uniqueCodes = [...new Set(layer.cartons.map(c => c.code))];
    const isActuallyMixed = uniqueCodes.length > 1;
    
    if (isActuallyMixed) {
        const avgPerCode = cartonCount / uniqueCodes.length;
        if (avgPerCode <= 4) {
            score += 30;
        }
    }
    
    if (cartonCount <= 3 && !isActuallyMixed) {
        score -= 20;
    }
    
    if (isPriority) {
        score += 10;
    }
    
    return Math.max(0, score);
}

// === 単一貨物コード専用層作成（高さ制限対応） ===
function createSingleItemLayer(item, palletSize, maxHeight) {
    if (item.remaining <= 0 || item.h > maxHeight || item.h > getMaxCartonHeight()) {
        return null;
    }

    const layerCartons = [];
    let layerWeight = 0;
    const layerHeight = item.h;
    
    const placementResult = calculateOptimalPlacement(item, palletSize);
    
    if (placementResult.positions.length === 0) {
        return null;
    }

    const placeCount = Math.min(item.remaining, placementResult.positions.length);
    const palletArea = palletSize.width * palletSize.depth;
    const itemArea = item.l * item.w;
    const areaUtilization = (placeCount * itemArea) / palletArea;
    
    if (placeCount <= 3 && areaUtilization < 0.3) {
        console.log(`  ${item.code}専用層: ${placeCount}個では効率不良 → 混載推奨`);
        return null;
    }
    
    for (let i = 0; i < placeCount; i++) {
        layerCartons.push({
            code: item.code,
            weight: item.weight,
            l: item.l,
            w: item.w,
            h: item.h,
            position: placementResult.positions[i]
        });
        layerWeight += item.weight;
    }

    const area = layerCartons.reduce((sum, carton) => sum + (carton.l * carton.w), 0);

    return {
        cartons: layerCartons,
        height: layerHeight,
        weight: layerWeight,
        area: area,
        type: 'single',
        pattern: `${item.code}専用層: ${placeCount}個`
    };
}

// === 最適配置計算 ===
function calculateOptimalPlacement(item, palletSize) {
    const positions = [];
    
    const normalFitsX = Math.floor(palletSize.width / item.l);
    const normalFitsY = Math.floor(palletSize.depth / item.w);
    const rotatedFitsX = Math.floor(palletSize.width / item.w);
    const rotatedFitsY = Math.floor(palletSize.depth / item.l);
    
    let useRotation = false;
    let fitsX = normalFitsX;
    let fitsY = normalFitsY;
    let boxW = item.l;
    let boxD = item.w;
    
    if (rotatedFitsX * rotatedFitsY > normalFitsX * normalFitsY) {
        useRotation = true;
        fitsX = rotatedFitsX;
        fitsY = rotatedFitsY;
        boxW = item.w;
        boxD = item.l;
    }
    
    for (let row = 0; row < fitsY; row++) {
        for (let col = 0; col < fitsX; col++) {
            positions.push({
                x: col * boxW,
                y: row * boxD,
                width: boxW,
                depth: boxD,
                rotated: useRotation
            });
        }
    }
    
    return {
        positions: positions,
        rotated: useRotation,
        pattern: `${fitsX}×${fitsY}配置${useRotation ? '（回転）' : ''}`
    };
}

// === パレットスコア計算 ===
function calculatePalletScore(config, availableItems) {
    let score = 0;
    
    // 基本スコア: 配置されたカートン数
    score += config.cartons.length * 10;
    
    // 高さ効率スコア
    const heightEfficiency = config.height / maxHeightLimit;
    score += (1 - heightEfficiency) * 50;
    
    // 重量効率スコア
    const weightEfficiency = config.totalWeight / (config.palletSize.width * config.palletSize.depth * config.height * 0.001);
    score += weightEfficiency * 30;
    
    return score;
}

// === 安定性・重量順序ヘルパー（安全な改善） ===
function sortItemsForStability(items) {
    // 重量降順 → 面積降順 → 高さ降順でソート（重い・大きいものを下に）
    return [...items].sort((a, b) => {
        const weightDiff = b.weight - a.weight;
        if (Math.abs(weightDiff) > 0.1) return weightDiff;
        
        const areaA = a.l * a.w;
        const areaB = b.l * b.w;
        const areaDiff = areaB - areaA;
        if (Math.abs(areaDiff) > 1) return areaDiff;
        
        return b.h - a.h;
    });
}

function checkLayerStability(newLayer, previousLayer, palletSize) {
    if (!previousLayer) return true; // 最初の層は常に安定
    
    // 簡易安定性チェック: 前の層との重なり面積比率
    const newLayerArea = newLayer.cartons.reduce((sum, c) => sum + (c.position ? c.position.width * c.position.depth : c.l * c.w), 0);
    const palletArea = palletSize.width * palletSize.depth;
    const overlapRatio = newLayerArea / palletArea;
    
    // 重なりが60%以上なら安定とみなす
    return overlapRatio >= 0.6;
}

function canAddLayerSafely(newLayer, currentHeight, maxHeight, previousLayer, palletSize) {
    // 高さ制限チェック
    if (currentHeight + newLayer.height > maxHeight) return false;
    
    // 安定性チェック
    if (!checkLayerStability(newLayer, previousLayer, palletSize)) {
        console.log('  ⚠️ 安定性不足: 前の層との重なりが不十分');
        return false;
    }
    
    return true;
}

// === 高さグループ化 ===
function groupItemsByHeight(items, tolerance) {
    const groups = {};
    
    items.forEach(item => {
        if (item.remaining <= 0 || item.h > getMaxCartonHeight()) return;
        
        let groupFound = false;
        for (const [groupHeight, groupItems] of Object.entries(groups)) {
            if (Math.abs(item.h - parseFloat(groupHeight)) <= tolerance) {
                groupItems.push(item);
                groupFound = true;
                break;
            }
        }
        
        if (!groupFound) {
            groups[item.h.toString()] = [item];
        }
    });
    
    return groups;
}

// === 効率的混載層作成 ===
function createEfficientMixedLayer(groupItems, palletSize, targetHeight) {
    const layerCartons = [];
    let layerWeight = 0;
    
    console.log(`  効率的混載層作成: 高さ${targetHeight}cm`);

    const occupiedGrid = createOccupiedGrid(palletSize, []);
    const sortedItems = groupItems.sort((a, b) => a.remaining - b.remaining);
    
    for (const item of sortedItems) {
        if (item.remaining <= 0) continue;

        const maxPlace = Math.min(item.remaining, 10);
        let placedCount = 0;
        
        for (let i = 0; i < maxPlace; i++) {
            const additionalPlacements = findAdditionalPlacements(item, palletSize, occupiedGrid);
            
            if (additionalPlacements.length > 0) {
                layerCartons.push({
                    code: item.code,
                    weight: item.weight,
                    l: item.l,
                    w: item.w,
                    h: item.h,
                    position: additionalPlacements[0]
                });
                layerWeight += item.weight;
                placedCount++;
            } else {
                break;
            }
        }
    }

    if (layerCartons.length === 0) {
        return null;
    }

    const area = layerCartons.reduce((sum, carton) => sum + (carton.l * carton.w), 0);
    const codeCounts = layerCartons.reduce((acc, carton) => {
        acc[carton.code] = (acc[carton.code] || 0) + 1;
        return acc;
    }, {});

    return {
        cartons: layerCartons,
        height: targetHeight,
        weight: layerWeight,
        area: area,
        type: 'mixed',
        pattern: `効率混載: ${Object.entries(codeCounts).map(([code, count]) => `${code}×${count}`).join('+')}`
    };
}

// === 占有グリッド作成 ===
function createOccupiedGrid(palletSize, cartons) {
    const gridSize = 5;
    const gridWidth = Math.ceil(palletSize.width / gridSize);
    const gridDepth = Math.ceil(palletSize.depth / gridSize);
    const grid = Array(gridDepth).fill().map(() => Array(gridWidth).fill(false));
    
    cartons.forEach(carton => {
        const pos = carton.position;
        const startX = Math.floor(pos.x / gridSize);
        const endX = Math.ceil((pos.x + pos.width) / gridSize);
        const startY = Math.floor(pos.y / gridSize);
        const endY = Math.ceil((pos.y + pos.depth) / gridSize);
        
        for (let y = startY; y < endY && y < gridDepth; y++) {
            for (let x = startX; x < endX && x < gridWidth; x++) {
                grid[y][x] = true;
            }
        }
    });
    
    return grid;
}

// === 追加配置の検索 ===
function findAdditionalPlacements(item, palletSize, occupiedGrid) {
    const positions = [];
    const gridSize = 5;
    const gridWidth = occupiedGrid[0].length;
    const gridDepth = occupiedGrid.length;
    
    const orientations = [
        { w: Math.ceil(item.l / gridSize), d: Math.ceil(item.w / gridSize), 
          actualW: item.l, actualD: item.w, rotated: false },
        { w: Math.ceil(item.w / gridSize), d: Math.ceil(item.l / gridSize), 
          actualW: item.w, actualD: item.l, rotated: true }
    ];

    for (const orientation of orientations) {
        for (let y = 0; y <= gridDepth - orientation.d; y++) {
            for (let x = 0; x <= gridWidth - orientation.w; x++) {
                if (canPlaceAt(occupiedGrid, x, y, orientation.w, orientation.d)) {
                    positions.push({
                        x: x * gridSize,
                        y: y * gridSize,
                        width: orientation.actualW,
                        depth: orientation.actualD,
                        rotated: orientation.rotated
                    });
                    
                    for (let dy = 0; dy < orientation.d; dy++) {
                        for (let dx = 0; dx < orientation.w; dx++) {
                            occupiedGrid[y + dy][x + dx] = true;
                        }
                    }
                    
                    return positions;
                }
            }
        }
    }
    
    return positions;
}

// === 配置可能性チェック ===
function canPlaceAt(grid, x, y, width, depth) {
    for (let dy = 0; dy < depth; dy++) {
        for (let dx = 0; dx < width; dx++) {
            if (y + dy >= grid.length || x + dx >= grid[0].length) {
                return false;
            }
            if (grid[y + dy][x + dx]) {
                return false;
            }
        }
    }
    return true;
}

// === 結果表示関数（高さ制限表示付き） ===
function displayResults(pallets) {
    const results = document.getElementById('results');
    const resultSummary = document.getElementById('resultSummary');
    const palletResults = document.getElementById('palletResults');
    
    results.classList.remove('hidden');
    if (window.anime) {
        anime({ targets: results, opacity: [0,1], translateY: [12,0], duration: 500, easing: 'easeOutQuad' });
    }
    
    // サマリーカードを作成
    const totalPallets = pallets.length;
    const totalProcessed = pallets.reduce((sum, pallet) => sum + pallet.cartons.length, 0);
    const totalWeight = pallets.reduce((sum, pallet) => sum + pallet.totalWeight, 0);
    const averageHeight = pallets.reduce((sum, pallet) => sum + pallet.height, 0) / totalPallets;
    const maxPalletHeight = Math.max(...pallets.map(p => p.height));
    const heightCompliance = maxPalletHeight <= maxHeightLimit;
    
    resultSummary.innerHTML = `
        <div class="summary-card blue">
            <h3>総パレット数</h3>
            <p>${totalPallets} 枚</p>
        </div>
        <div class="summary-card green">
            <h3>処理済みカートン</h3>
            <p>${totalProcessed} 個</p>
        </div>
        <div class="summary-card purple">
            <h3>総重量</h3>
            <p>${totalWeight.toFixed(1)} kg</p>
        </div>
        <div class="summary-card orange">
            <h3>最大高さ / 制限</h3>
            <p style="color: ${heightCompliance ? '#16a34a' : '#dc2626'}">${maxPalletHeight.toFixed(1)} / ${maxHeightLimit}cm</p>
        </div>
    `;
    
    // 高さ制限コンプライアンス表示
    if (!heightCompliance) {
        const warningDiv = document.createElement('div');
        warningDiv.className = 'alert alert-error';
        warningDiv.innerHTML = `⚠️ 高さ制限違反: パレット最大高さ${maxPalletHeight.toFixed(1)}cmが制限${maxHeightLimit}cmを超過しています。`;
        document.getElementById('errors').appendChild(warningDiv);
    }
    
    // パレット詳細を表示
    palletResults.innerHTML = '';
    
    pallets.forEach((pallet, index) => {
        const palletCard = document.createElement('div');
        palletCard.className = 'pallet-card';
        palletCard.id = `pallet-${index}`;
        
        const cartonCounts = pallet.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        const uniqueCodes = Object.keys(cartonCounts);
        const isMixed = uniqueCodes.length > 1;
        const mixedBadge = isMixed ? '<span class="cargo-badge mixed">混載</span>' : '<span class="cargo-badge">単一</span>';
        const heightStatus = pallet.height <= maxHeightLimit ? '✅' : '❌';
        
        palletCard.innerHTML = `
            <h3>🚛 パレット ${index + 1} ${mixedBadge} ${heightStatus}</h3>
            
            <div class="pallet-grid">
                <div class="pallet-stat">
                    <p>パレットサイズ</p>
                    <p>${pallet.palletSize.name} cm</p>
                </div>
                <div class="pallet-stat">
                    <p>カートン数</p>
                    <p>${pallet.cartons.length} 個</p>
                </div>
                <div class="pallet-stat">
                    <p>総重量</p>
                    <p>${pallet.totalWeight.toFixed(1)} kg</p>
                </div>
                <div class="pallet-stat">
                    <p>高さ / 制限</p>
                    <p style="color: ${pallet.height <= maxHeightLimit ? '#16a34a' : '#dc2626'}">${pallet.height.toFixed(1)} / ${maxHeightLimit}cm</p>
                </div>
                <div class="pallet-stat">
                    <p>層数</p>
                    <p>${pallet.layers.length} 層</p>
                </div>
                <div class="pallet-stat">
                    <p>貨物種類</p>
                    <p>${uniqueCodes.length} 種類</p>
                </div>
            </div>
            
            <div class="pallet-details">
                <p>📦 貨物構成</p>
                <div class="cargo-list">
                    ${Object.entries(cartonCounts).map(([code, count]) => `
                        <div class="cargo-item">
                            <span class="cargo-code">${code}</span>
                            <span>${count} 個</span>
                        </div>
                    `).join('')}
                </div>
                
                <div class="layer-info">
                    <strong>📋 層別詳細 (高さ制限: ${maxHeightLimit}cm)</strong>
                    ${pallet.layers.map((layer, layerIndex) => {
                        const layerCounts = layer.cartons.reduce((acc, carton) => {
                            acc[carton.code] = (acc[carton.code] || 0) + 1;
                            return acc;
                        }, {});
                        const layerCodes = Object.keys(layerCounts);
                        const isLayerMixed = layerCodes.length > 1;
                        return `
                            <div class="layer-item ${isLayerMixed ? 'mixed' : ''}">
                                第${layerIndex + 1}層: ${Object.entries(layerCounts).map(([code, count]) => `${code}×${count}`).join(', ')} 
                                (高さ: ${layer.height}cm, 重量: ${layer.weight.toFixed(1)}kg)
                            </div>
                        `;
                    }).join('')}
                </div>
            </div>
        `;
        
        // 高さ制限超過の警告
        if (pallet.height > maxHeightLimit) {
            const warningDiv = document.createElement('div');
            warningDiv.className = 'safety-warning';
            warningDiv.innerHTML = `
                <strong>⚠️ 高さ制限超過警告</strong>
                このパレットの高さ(${pallet.height.toFixed(1)}cm)が設定された制限(${maxHeightLimit}cm)を超過しています。
                輸送制限や安全基準を確認してください。
            `;
            palletCard.appendChild(warningDiv);
        }
        
        // 配置図を追加
        const diagramContainer = drawPalletDiagram(index, pallet);
        palletCard.appendChild(diagramContainer);
        
        palletResults.appendChild(palletCard);
    });
    
    // 配置図の描画
    setTimeout(() => {
        pallets.forEach((pallet, index) => {
            drawSideView(index);
            drawLayersDetail(index);
        });
    }, 100);
    
    // パレット結合機能のセレクターを更新
    updatePalletSelectors();
}

// === サマリーテーブル構築（高さ制限表示付き） ===
function buildSummaryTable(pallets) {
    const summarySection = document.getElementById('summarySection');
    const summaryBody = document.getElementById('summaryBody');
    
    if (!summarySection || !summaryBody) return;
    
    summarySection.classList.remove('hidden');
    summaryBody.innerHTML = '';
    
    pallets.forEach((pallet, palletIndex) => {
        const cartonCounts = pallet.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        const palletSize = `${pallet.palletSize.width}×${pallet.palletSize.depth}`;
        const heightCompliantIcon = pallet.height <= maxHeightLimit ? '✅' : '❌';
        const weight = pallet.totalWeight.toFixed(1);
        const codes = Object.keys(cartonCounts).join(', ');
        const quantities = Object.values(cartonCounts).join(', ');
        
        
        const row = document.createElement('tr');
        row.innerHTML = `
            <td><span class="pallet-link" onclick="scrollToPallet(${palletIndex})">${palletIndex + 1} ${heightCompliantIcon}</span></td>
            <td>${palletSize}</td>
            <td>${weight}</td>
            <td>${codes}</td>
            <td>${quantities}</td>
        `;
        
        if (pallet.height > maxHeightLimit) {
            row.style.backgroundColor = '#fef2f2';
        }
        
        summaryBody.appendChild(row);
    });
}

// === CSV エクスポート（高さ制限情報付き） ===
function exportSummaryCsv() {
    if (!window.currentPallets || window.currentPallets.length === 0) {
        alert('エクスポートするデータがありません。');
        return;
    }
    
    const headers = ['パレットNo', '寸法(cm)', '重量(kg)', '貨物コード', '数量'];
    const rows = [headers];
    
    window.currentPallets.forEach((pallet, palletIndex) => {
        const cartonCounts = pallet.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        const palletSize = `${pallet.palletSize.width}×${pallet.palletSize.depth}`;
        const heightCompliantIcon = pallet.height <= maxHeightLimit ? '✅' : '❌';
        const weight = pallet.totalWeight.toFixed(1);
        const codes = Object.keys(cartonCounts).join(', ');
        const quantities = Object.values(cartonCounts).join(', ');
        
        
        rows.push([
            `${palletIndex + 1} ${heightCompliantIcon}`,
            palletSize,
            weight,
            codes,
            quantities
        ]);
    });
    
    // ヘッダーに高さ制限情報を追加
    rows.unshift([`パレタイズ結果 (高さ制限: ${maxHeightLimit}cm)`]);
    rows.unshift([]);
    
    const csvContent = rows.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    
    if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        
        const now = new Date();
        const dateStr = now.getFullYear() + 
            String(now.getMonth() + 1).padStart(2, '0') + 
            String(now.getDate()).padStart(2, '0') + '_' +
            String(now.getHours()).padStart(2, '0') + 
            String(now.getMinutes()).padStart(2, '0');
        
        link.setAttribute('download', `palletization_result_${dateStr}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}

// === 図表表示切り替え ===
function showDiagramView(palletIndex, viewType) {
    const tabs = document.querySelectorAll(`#palletResults .pallet-card:nth-child(${palletIndex + 1}) .diagram-tab`);
    tabs.forEach(tab => tab.classList.remove('active'));
    
    const activeTab = Array.from(tabs).find(tab => 
        (viewType === 'side' && tab.textContent.includes('側面図')) ||
        (viewType === 'layers' && tab.textContent.includes('層別配置'))
    );
    if (activeTab) activeTab.classList.add('active');
    
    const sideView = document.getElementById(`sideView_${palletIndex}`);
    const layersView = document.getElementById(`layersView_${palletIndex}`);
    
    if (sideView && layersView) {
        sideView.classList.remove('active');
        layersView.classList.remove('active');
        
        if (viewType === 'side') {
            sideView.classList.add('active');
            setTimeout(() => drawSideView(palletIndex), 50);
        } else if (viewType === 'layers') {
            layersView.classList.add('active');
            setTimeout(() => drawLayersDetail(palletIndex), 50);
        }
    }
}

// === 色生成 ===
function generateColors(count) {
    const baseColors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#AED6F1', '#A3E4D7'
    ];
    
    if (count <= baseColors.length) {
        return baseColors.slice(0, count);
    }
    
    const colors = [...baseColors];
    for (let i = baseColors.length; i < count; i++) {
        const hue = (i * 360 / count) % 360;
        const saturation = 65 + (i % 3) * 10;
        const lightness = 55 + (i % 2) * 10;
        colors.push(`hsl(${hue}, ${saturation}%, ${lightness}%)`);
    }
    return colors;
}

// === 配置図描画（高さ制限表示付き） ===
function drawPalletDiagram(palletIndex, pallet) {
    const diagramContainer = document.createElement('div');
    diagramContainer.className = 'diagram-container';
    
    const uniqueCodes = [...new Set(pallet.cartons.map(c => c.code))];
    const colors = generateColors(uniqueCodes.length);
    const colorMap = {};
    uniqueCodes.forEach((code, index) => {
        colorMap[code] = colors[index];
    });
    
    const heightStatus = pallet.height <= maxHeightLimit ? '✅' : '⚠️';
    
    diagramContainer.innerHTML = `
        <div class="diagram-tabs">
            <button class="diagram-tab active" onclick="showDiagramView(${palletIndex}, 'side')">側面図</button>
            <button class="diagram-tab" onclick="showDiagramView(${palletIndex}, 'layers')">層別配置</button>
        </div>
        <div class="diagram-content">
            <div id="sideView_${palletIndex}" class="diagram-view active">
                <div class="canvas-container">
                    <div class="canvas-title">パレット側面図 (全${pallet.layers.length}層) ${heightStatus}</div>
                    <canvas id="sideCanvas_${palletIndex}" class="pallet-canvas" width="500" height="400"></canvas>
                </div>
            </div>
            <div id="layersView_${palletIndex}" class="diagram-view">
                <div class="canvas-title">層別配置詳細</div>
                <div id="layersDetail_${palletIndex}"></div>
            </div>
        </div>
    `;
    
    const legend = document.createElement('div');
    legend.className = 'legend';
    uniqueCodes.forEach((code, index) => {
        const legendItem = document.createElement('div');
        legendItem.className = 'legend-item';
        legendItem.innerHTML = `
            <div class="legend-color" style="background-color: ${colors[index]};"></div>
            <span>${code}</span>
        `;
        legend.appendChild(legendItem);
    });
    diagramContainer.appendChild(legend);
    
    const dimensionsInfo = document.createElement('div');
    dimensionsInfo.className = 'dimensions-info';
    dimensionsInfo.innerHTML = `
        <strong>パレット寸法:</strong> ${pallet.palletSize.width}cm × ${pallet.palletSize.depth}cm × ${pallet.height.toFixed(1)}cm<br>
        <strong>高さ制限:</strong> ${pallet.height.toFixed(1)}cm / ${maxHeightLimit}cm ${heightStatus}<br>
        <strong>総重量:</strong> ${pallet.totalWeight.toFixed(1)}kg<br>
        <strong>層数:</strong> ${pallet.layers.length}層
    `;
    diagramContainer.appendChild(dimensionsInfo);
    
    // 高さ制限警告
    if (pallet.height > maxHeightLimit) {
        const warningInfo = document.createElement('div');
        warningInfo.className = 'safety-warning';
        warningInfo.innerHTML = `
            <strong>⚠️ 高さ制限超過</strong>
            このパレットは設定された高さ制限(${maxHeightLimit}cm)を${(pallet.height - maxHeightLimit).toFixed(1)}cm超過しています。
        `;
        diagramContainer.appendChild(warningInfo);
    }
    
    return diagramContainer;
}

// === 側面図描画（高さ制限線付き） ===
function drawSideView(palletIndex) {
    const canvas = document.getElementById(`sideCanvas_${palletIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const pallet = window.currentPallets[palletIndex];
    if (!pallet) return;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const margin = 60;
    const maxWidth = canvas.width - 2 * margin;
    const maxHeight = canvas.height - 2 * margin;
    
    const scaleX = maxWidth / pallet.palletSize.width;
    const scaleY = maxHeight / maxHeightLimit; // 高さ制限でスケール調整
    const scale = Math.min(scaleX, scaleY);
    
    const palletW = pallet.palletSize.width * scale;
    const limitH = maxHeightLimit * scale;
    const actualH = pallet.height * scale;
    const startX = (canvas.width - palletW) / 2;
    const startY = (canvas.height - limitH) / 2;
    
    // 高さ制限線を描画
    ctx.strokeStyle = '#dc2626';
    ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]);
    ctx.beginPath();
    ctx.moveTo(startX - 10, startY);
    ctx.lineTo(startX + palletW + 10, startY);
    ctx.stroke();
    ctx.setLineDash([]);
    
    // 制限線ラベル
    ctx.fillStyle = '#dc2626';
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'right';
    ctx.fillText(`制限 ${maxHeightLimit}cm`, startX - 15, startY + 5);
    
    // パレット台座
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(startX, startY + limitH - 14 * scale, palletW, 14 * scale);
    
    // 実際のパレット高さ背景
    if (actualH > limitH) {
        // 制限超過部分を赤で表示
        ctx.fillStyle = 'rgba(220, 38, 38, 0.3)';
        ctx.fillRect(startX, startY + limitH - actualH, palletW, actualH - limitH);
    }
    
    // 各層を描画
    let currentY = startY + limitH - 14 * scale;
    const uniqueCodes = [...new Set(pallet.cartons.map(c => c.code))];
    const colors = generateColors(uniqueCodes.length);
    const colorMap = {};
    uniqueCodes.forEach((code, index) => {
        colorMap[code] = colors[index];
    });
    
    for (let i = 0; i < pallet.layers.length; i++) {
        const layer = pallet.layers[i];
        const layerH = layer.height * scale;
        currentY -= layerH;
        
        // 層の背景
        ctx.fillStyle = layer.type === 'mixed' ? '#fff3cd' : '#e8f5e8';
        ctx.fillRect(startX, currentY, palletW, layerH);
        
        // 層の境界線
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 2;
        ctx.strokeRect(startX, currentY, palletW, layerH);
        
        // 商品を色分けして表示
        const layerCounts = layer.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        let segmentStart = startX;
        const totalCartons = layer.cartons.length;
        
        for (const [code, count] of Object.entries(layerCounts)) {
            const segmentWidth = (count / totalCartons) * palletW;
            const color = colorMap[code];
            
            ctx.fillStyle = color;
            ctx.fillRect(segmentStart, currentY, segmentWidth, layerH);
            
            if (segmentWidth > 40 && layerH > 15) {
                ctx.fillStyle = '#000';
                ctx.font = 'bold 10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(code.substring(0, 8), segmentStart + segmentWidth/2, currentY + layerH/2 - 5);
                ctx.font = '9px Arial';
                ctx.fillText(`${count}個`, segmentStart + segmentWidth/2, currentY + layerH/2 + 5);
            }
            
            segmentStart += segmentWidth;
        }
        
        // 層番号
        ctx.fillStyle = '#333';
        ctx.font = 'bold 11px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`第${i + 1}層`, startX - 55, currentY + layerH/2 - 5);
        ctx.font = '9px Arial';
        ctx.fillText(`${layer.height}cm`, startX - 55, currentY + layerH/2 + 5);
    }
    
    // タイトルと高さ情報
    ctx.fillStyle = '#333';
    ctx.font = 'bold 16px Arial';
    ctx.textAlign = 'center';
    const heightStatus = pallet.height <= maxHeightLimit ? '✅' : '⚠️';
    ctx.fillText(`パレット${palletIndex + 1} - 側面図 ${heightStatus}`, canvas.width / 2, 25);
    
    ctx.font = '12px Arial';
    const heightColor = pallet.height <= maxHeightLimit ? '#16a34a' : '#dc2626';
    ctx.fillStyle = heightColor;
    ctx.fillText(`実際高さ: ${pallet.height.toFixed(1)}cm / 制限: ${maxHeightLimit}cm`, canvas.width / 2, canvas.height - 15);
    
    ctx.fillStyle = '#333';
    ctx.fillText(`${pallet.palletSize.width}cm × ${pallet.palletSize.depth}cm`, canvas.width / 2, canvas.height - 5);

    // ベースイメージをキャッシュ（ホバーアウトライン用）
    try {
        const img = new Image();
        img.src = canvas.toDataURL();
        canvas._baseImage = img;
    } catch (_) {}

    // 側面図ホバーイベントをバインド
    bindSideCanvasEvents(canvas, palletIndex);
}

// === 層別詳細描画（高さ制限情報付き） ===
function drawLayersDetail(palletIndex) {
    const container = document.getElementById(`layersDetail_${palletIndex}`);
    if (!container) return;
    
    const pallet = window.currentPallets[palletIndex];
    if (!pallet) return;
    
    const uniqueCodes = [...new Set(pallet.cartons.map(c => c.code))];
    const colors = generateColors(uniqueCodes.length);
    const colorMap = {};
    uniqueCodes.forEach((code, index) => {
        colorMap[code] = colors[index];
    });
    
    const palletArea = pallet.palletSize.width * pallet.palletSize.depth;
    
    let html = `<div style="margin-bottom: 15px; padding: 10px; background-color: ${pallet.height <= maxHeightLimit ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">`;
    html += `<strong>高さ制限チェック:</strong> ${pallet.height.toFixed(1)}cm / ${maxHeightLimit}cm `;
    html += pallet.height <= maxHeightLimit ? '✅ 適合' : '❌ 超過';
    html += `</div>`;
    
    html += '<div style="display: grid; gap: 20px;">';
    
    pallet.layers.forEach((layer, layerIndex) => {
        const layerCounts = layer.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        const layerTypeText = layer.type === 'mixed' ? '混載層' : '';
        const layerColor = layer.type === 'mixed' ? '#fff3cd' : '#e8f5e8';
        const areaUtilization = safeDivide(layer.area, palletArea, 0) * 100;
        
        html += `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: ${layerColor};">
                <h4 style="margin: 0 0 10px 0; color: #333;">第${layerIndex + 1}層 ${layerTypeText}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div>
                        <strong>層情報:</strong><br>
                        高さ: ${layer.height}cm<br>
                        重量: ${layer.weight.toFixed(1)}kg<br>
                        カートン数: ${layer.cartons.length}個<br>
                        <strong style="color: #2563eb;">占有面積: ${layer.area.toFixed(0)}cm² (${areaUtilization.toFixed(1)}%)</strong>
                    </div>
                    <div>
                        <strong>貨物構成:</strong><br>
                        ${Object.entries(layerCounts).map(([code, count]) => {
                            const carton = layer.cartons.find(c => c.code === code);
                            const sizeInfo = carton ? `${carton.l}×${carton.w}×${carton.h}cm` : '';
                            return `<div style="margin: 2px 0;"><span style="display: inline-block; margin-right: 8px; padding: 2px 8px; background-color: ${colorMap[code]}; border-radius: 12px; font-size: 12px; color: white;">${code}: ${count}個</span><small style="color: #666;">${sizeInfo}</small></div>`
                        }).join('')}
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <canvas id="layerCanvas_${palletIndex}_${layerIndex}" width="400" height="250" style="border: 1px solid #ccc; background-color: white; border-radius: 5px;"></canvas>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    setTimeout(() => {
        pallet.layers.forEach((layer, layerIndex) => {
            drawSingleLayer(palletIndex, layerIndex, layer, pallet.palletSize, colorMap);
            const canvas = document.getElementById(`layerCanvas_${palletIndex}_${layerIndex}`);
            if (canvas && window.layerCanvasHitmaps && window.layerCanvasHitmaps[canvas.id]) {
                bindLayerCanvasEvents(canvas, window.layerCanvasHitmaps[canvas.id]);
            }
        });
    }, 100);
}

// === 単一層描画 ===
function drawSingleLayer(palletIndex, layerIndex, layer, palletSize, colorMap) {
    const canvas = document.getElementById(`layerCanvas_${palletIndex}_${layerIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const margin = 30;
    const maxWidth = canvas.width - 2 * margin;
    const maxHeight = canvas.height - 2 * margin;
    
    const scaleX = maxWidth / palletSize.width;
    const scaleY = maxHeight / palletSize.depth;
    const scale = Math.min(scaleX, scaleY);
    
    const palletW = palletSize.width * scale;
    const palletD = palletSize.depth * scale;
    const startX = (canvas.width - palletW) / 2;
    const startY = (canvas.height - palletD) / 2;
    
    // パレット枠
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(startX, startY, palletW, palletD);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, palletW, palletD);
    
    // パレット寸法ラベル
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${palletSize.width}cm`, startX + palletW / 2, startY - 5);
    ctx.save();
    ctx.translate(startX - 15, startY + palletD / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${palletSize.depth}cm`, 0, 0);
    ctx.restore();
    
    // ヒットマップ初期化
    if (!window.layerCanvasHitmaps) window.layerCanvasHitmaps = {};
    const canvasId = `layerCanvas_${palletIndex}_${layerIndex}`;
    window.layerCanvasHitmaps[canvasId] = [];
    
    // カートンを描画
    layer.cartons.forEach((carton, index) => {
        if (carton.position) {
            const color = colorMap[carton.code];
            const boxX = startX + carton.position.x * scale;
            const boxY = startY + carton.position.y * scale;
            const boxW = carton.position.width * scale;
            const boxH = carton.position.depth * scale;
            
            ctx.fillStyle = color;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, boxW, boxH);
            
            // ヒットマップ登録
            window.layerCanvasHitmaps[canvasId].push({
                x: boxX,
                y: boxY,
                w: boxW,
                h: boxH,
                carton
            });
            
            if (boxW > 25 && boxH > 15) {
                ctx.fillStyle = '#000';
                ctx.font = `${Math.min(9, boxW / 8)}px Arial`;
                ctx.textAlign = 'center';
                const shortCode = carton.code.length > 8 ? carton.code.substring(0, 8) + '...' : carton.code;
                ctx.fillText(shortCode, boxX + boxW / 2, boxY + boxH / 2);
            }
        }
    });
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`第${layerIndex + 1}層 - ${layer.cartons.length}個`, canvas.width / 2, 20);

    // ベースイメージをキャッシュ（ホバー描画用のオーバーレイに利用）
    try {
        const img = new Image();
        img.src = canvas.toDataURL();
        canvas._baseImage = img;
    } catch (_) {}
}

// === ツールチップユーティリティ ===
function ensureTooltip() {
    let tip = document.getElementById('globalCanvasTooltip');
    if (!tip) {
        tip = document.createElement('div');
        tip.id = 'globalCanvasTooltip';
        tip.className = 'tooltip';
        tip.style.display = 'none';
        document.body.appendChild(tip);
    }
    return tip;
}

function showTooltip(x, y, html) {
    const tip = ensureTooltip();
    tip.innerHTML = html;
    tip.style.left = `${x}px`;
    tip.style.top = `${y}px`;
    if (tip.style.display !== 'block') {
        tip.style.opacity = '0';
        tip.style.transform = 'translate(8px, 8px) scale(0.98)';
        tip.style.display = 'block';
    }
    if (window.anime) {
        anime.remove(tip);
        anime({
            targets: tip,
            opacity: 1,
            translateX: 8,
            translateY: 8,
            scale: 1,
            duration: 160,
            easing: 'easeOutQuad'
        });
    }
}

function hideTooltip() {
    const tip = ensureTooltip();
    if (window.anime) {
        anime.remove(tip);
        anime({
            targets: tip,
            opacity: 0,
            translateY: 12,
            duration: 140,
            easing: 'easeOutQuad',
            complete: () => { tip.style.display = 'none'; tip.style.transform = 'translate(8px, 8px)'; }
        });
    } else {
        tip.style.display = 'none';
    }
}

function bindLayerCanvasEvents(canvas, hitmap) {
    const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        // 検出
        let found = null;
        let foundRaw = null;
        for (let i = 0; i < hitmap.length; i++) {
            const r = hitmap[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                found = r.carton;
                foundRaw = r;
                break;
            }
        }
        if (found) {
            const content = `
                <div style="font-weight:bold; margin-bottom:4px;">${found.code}</div>
                <div>サイズ: ${found.l}×${found.w}×${found.h}cm</div>
                <div>重量: ${typeof found.weight === 'number' ? found.weight.toFixed(2) : found.weight}kg</div>
            `;
            showTooltip(e.clientX + 8, e.clientY + 8, content);

            // カートンのアウトラインをパルス表示
            if (foundRaw) animateCartonHover(canvas, foundRaw);
        } else {
            hideTooltip();
            clearCartonHover(canvas);
        }

        // パララックス無効化（削除要求）
    };
    const onLeave = () => {
        hideTooltip();
        clearCartonHover(canvas, true);
        // パララックス無効化（削除要求）
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
}

// === ホバー用アウトライン描画 ===
function drawHoverOutline(canvas, r, t) {
    if (!canvas || !canvas._baseImage) return;
    const ctx = canvas.getContext('2d');
    // ベース再描画
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(canvas._baseImage, 0, 0);

    // パルス値（0..1）から太さと透明度を計算
    const pulse = 0.5 + 0.5 * Math.sin(t * Math.PI * 2);
    const lineW = 2 + 2 * pulse;
    const alpha = 0.35 + 0.45 * pulse;

    ctx.save();
    ctx.strokeStyle = `rgba(96,165,250,${alpha})`;
    ctx.lineWidth = lineW;
    ctx.shadowColor = 'rgba(96,165,250,0.35)';
    ctx.shadowBlur = 12 * pulse + 6;
    ctx.strokeRect(r.x, r.y, r.w, r.h);
    ctx.restore();
}

function animateCartonHover(canvas, rect) {
    if (!window.anime) return;
    if (canvas._hoverRect && canvas._hoverRect === rect && canvas._hoverAnim) return; // 既存維持
    canvas._hoverRect = rect;
    if (canvas._hoverAnim) { try { canvas._hoverAnim.pause(); } catch(_) {} }
    canvas._hoverAnim = anime({
        targets: { p: 0 },
        p: 1,
        duration: 900,
        easing: 'linear',
        loop: true,
        update: a => {
            const t = a.animations[0].currentValue;
            drawHoverOutline(canvas, rect, t);
        }
    });
}

function clearCartonHover(canvas, restoreBase = false) {
    if (canvas && canvas._hoverAnim) {
        try { canvas._hoverAnim.pause(); } catch(_) {}
        canvas._hoverAnim = null;
    }
    if (restoreBase && canvas && canvas._baseImage) {
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(canvas._baseImage, 0, 0);
    }
    canvas._hoverRect = null;
}

// === パララックス（平行移動 + ズーム） ===
function applyCanvasParallax(canvas, e) {
    if (!window.anime) return;
    const rect = canvas.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    const dx = (e.clientX - cx) / rect.width;  // -0.5..0.5
    const dy = (e.clientY - cy) / rect.height; // -0.5..0.5
    const tx = dx * 8; // 最大8px平行移動
    const ty = dy * 8;
    anime.remove(canvas);
    anime({ targets: canvas, translateX: tx, translateY: ty, scale: 1.03, duration: 180, easing: 'easeOutQuad' });
}

function resetCanvasParallax(canvas) {
    if (!window.anime) return;
    anime.remove(canvas);
    anime({ targets: canvas, translateX: 0, translateY: 0, scale: 1, duration: 220, easing: 'easeOutQuad' });
}

// === 側面図ホバーイベント ===
function bindSideCanvasEvents(canvas, palletIndex) {
    const pallet = window.currentPallets[palletIndex];
    if (!pallet) return;
    const regions = buildSideRegions(canvas, pallet);

    const onMove = (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        let found = null;
        for (let i = 0; i < regions.length; i++) {
            const r = regions[i];
            if (x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h) {
                found = r;
                break;
            }
        }
        if (found) {
            const c = found.carton;
            const content = `
                <div style="font-weight:bold; margin-bottom:4px;">${c.code}</div>
                <div>層: 第${found.layer + 1}層</div>
                <div>高さ: ${c.h}cm</div>
            `;
            showTooltip(e.clientX + 8, e.clientY + 8, content);
            animateCartonHover(canvas, found);
            // パララックス無効化（削除要求）
        } else {
            hideTooltip();
            clearCartonHover(canvas, true);
            // パララックス無効化（削除要求）
        }
    };
    const onLeave = () => {
        hideTooltip();
        clearCartonHover(canvas, true);
        resetCanvasParallax(canvas);
    };
    canvas.addEventListener('mousemove', onMove);
    canvas.addEventListener('mouseleave', onLeave);
}

function buildSideRegions(canvas, pallet) {
    const margin = 60;
    const maxWidth = canvas.width - 2 * margin;
    const maxHeight = canvas.height - 2 * margin;
    const scaleX = maxWidth / pallet.palletSize.width;
    const scaleY = maxHeight / maxHeightLimit;
    const scale = Math.min(scaleX, scaleY);
    const palletW = pallet.palletSize.width * scale;
    const limitH = maxHeightLimit * scale;
    const startX = (canvas.width - palletW) / 2;
    let currentY = (canvas.height - limitH) / 2 + limitH - 14 * scale;
    const regions = [];
    for (let i = 0; i < pallet.layers.length; i++) {
        const layer = pallet.layers[i];
        const layerH = layer.height * scale;
        currentY -= layerH;
        // 層内のセグメント幅を配分
        const total = layer.cartons.length;
        let segStart = startX;
        const counts = layer.cartons.reduce((a,c)=>{a[c.code]=(a[c.code]||0)+1;return a;},{});
        for (const [code, count] of Object.entries(counts)) {
            const segW = (count / total) * palletW;
            regions.push({ x: segStart, y: currentY, w: segW, h: layerH, carton: { code, h: layer.height }, layer: i });
            segStart += segW;
        }
    }
    return regions;
}

// グローバル関数として定義
window.showDiagramView = showDiagramView;
window.scrollToPallet = scrollToPallet;
window.setHeightLimit = setHeightLimit;

// === パレット結合用セレクター更新 ===
function updatePalletSelectors() {
    const select1 = document.getElementById('pallet1Select');
    const select2 = document.getElementById('pallet2Select');
    if (!select1 || !select2) return;

    // 既存オプションをクリア
    const resetOptions = (sel) => {
        while (sel.firstChild) sel.removeChild(sel.firstChild);
        const opt = document.createElement('option');
        opt.value = '';
        opt.textContent = '選択...';
        sel.appendChild(opt);
    };
    resetOptions(select1);
    resetOptions(select2);

    // 現在のパレットから選択肢を生成
    if (Array.isArray(window.currentPallets)) {
        window.currentPallets.forEach((pallet, idx) => {
            const label = `${idx + 1}: ${pallet.palletSize.width}×${pallet.palletSize.depth} / 高さ ${pallet.height.toFixed(1)}cm / ${pallet.cartons.length}個`;
            const o1 = document.createElement('option');
            o1.value = String(idx);
            o1.textContent = label;
            select1.appendChild(o1);

            const o2 = document.createElement('option');
            o2.value = String(idx);
            o2.textContent = label;
            select2.appendChild(o2);
        });
    }

    updateCombinePreview();
}

// === 結合プレビュー更新 ===
function updateCombinePreview() {
    const preview = document.getElementById('combinePreview');
    const s1 = document.getElementById('pallet1Select');
    const s2 = document.getElementById('pallet2Select');
    if (!preview || !s1 || !s2) return;

    const i1 = s1.value === '' ? null : parseInt(s1.value, 10);
    const i2 = s2.value === '' ? null : parseInt(s2.value, 10);

    if (i1 == null || i2 == null || i1 === i2) {
        preview.textContent = '2つの異なるパレットを選択してください。';
        return;
    }

    const p1 = window.currentPallets[i1];
    const p2 = window.currentPallets[i2];
    if (!p1 || !p2) {
        preview.textContent = '';
        return;
    }

    const totalWeight = (p1.totalWeight + p2.totalWeight).toFixed(1);
    const items = p1.cartons.length + p2.cartons.length;
    preview.innerHTML = `
        選択: パレット${i1 + 1} と パレット${i2 + 1} / 合計${items}個・総重量${totalWeight}kg。サイズ互換性や高さは実行時に検証します。`;
}

// === パレット結合機能（プレースホルダー） ===
function combinePallets() {
    const s1 = document.getElementById('pallet1Select');
    const s2 = document.getElementById('pallet2Select');
    const i1 = s1 && s1.value !== '' ? parseInt(s1.value, 10) : null;
    const i2 = s2 && s2.value !== '' ? parseInt(s2.value, 10) : null;
    if (i1 == null || i2 == null || i1 === i2) {
        alert('2つの異なるパレットを選択してください。');
        return;
    }
    console.log('combinePallets: not implemented yet', { i1, i2 });
    alert('パレット結合は未実装です（プレビューのみ）。');
}

function autoOptimizePallets() {
    console.log('autoOptimizePallets: not implemented yet');
    alert('自動最適化は未実装です。');
}

function analyzeSelectedPallets() {
    console.log('analyzeSelectedPallets: not implemented yet');
    alert('詳細分析は未実装です。');
}

// グローバルに公開（イベントリスナー参照用）
window.updatePalletSelectors = updatePalletSelectors;
window.updateCombinePreview = updateCombinePreview;
window.combinePallets = combinePallets;
window.autoOptimizePallets = autoOptimizePallets;
window.analyzeSelectedPallets = analyzeSelectedPallets;

// === UI Animations with anime.js ===
function startIntroAnimations() {
    if (!window.anime) return;
    try {
        anime.timeline()
            .add({ targets: '.header-row h1', opacity: [0,1], translateY: [20,0], duration: 600, easing: 'easeOutQuad' })
            .add({ targets: '.improvement-note', opacity: [0,1], translateY: [12,0], duration: 500, easing: 'easeOutQuad', offset: '-=250' })
            .add({ targets: '.summary-card', opacity: [0,1], translateY: [16,0], duration: 500, delay: anime.stagger(80), easing: 'easeOutQuad', offset: '-=200' })
            .add({ targets: '.section-header', opacity: [0,1], translateY: [12,0], duration: 450, easing: 'easeOutQuad', offset: '-=200' });
    } catch (_) {}
}

function setupInteractionAnimations() {
    if (!window.anime) return;
    document.addEventListener('click', function(e) {
        const btn = e.target.closest('.btn');
        if (!btn) return;
        const rect = btn.getBoundingClientRect();
        const ripple = document.createElement('span');
        const size = Math.max(rect.width, rect.height);
        ripple.style.width = ripple.style.height = size + 'px';
        ripple.style.left = (e.clientX - rect.left - size / 2) + 'px';
        ripple.style.top = (e.clientY - rect.top - size / 2) + 'px';
        ripple.style.position = 'absolute';
        ripple.style.borderRadius = '50%';
        ripple.style.background = 'rgba(255,255,255,0.35)';
        ripple.style.transform = 'scale(0)';
        ripple.style.pointerEvents = 'none';
        ripple.style.overflow = 'hidden';
        ripple.style.mixBlendMode = 'screen';
        btn.style.position = 'relative';
        btn.appendChild(ripple);
        anime({ targets: ripple, scale: [0, 2.2], opacity: [0.5, 0], duration: 500, easing: 'easeOutQuart', complete: () => ripple.remove() });
    });
}

function observeReveals() {
    if (!window.anime || !window.MutationObserver) return;
    const observer = new MutationObserver(mutations => {
        mutations.forEach(m => {
            if (m.type === 'attributes' && m.attributeName === 'class') {
                const el = m.target;
                if (el instanceof HTMLElement) {
                    if (!el.classList.contains('hidden')) {
                        anime({ targets: el, opacity: [0, 1], translateY: [8, 0], duration: 400, easing: 'easeOutQuad' });
                    }
                }
            }
        });
    });
    observer.observe(document.body, { attributes: true, subtree: true, attributeFilter: ['class'] });
}