// ダークモード管理
let isDarkMode = false;

// DOM要素のキャッシュ（パフォーマンス向上のため）
const domElements = {
    heightLimitInput: null,
    heightLimitDisplay: null,
    heightWarning: null,
    darkModeIcon: null
};

// DOM要素の初期化（DOMContentLoaded後に実行）
function initializeDOMElements() {
    domElements.heightLimitInput = document.getElementById('heightLimitInput');
    domElements.heightLimitDisplay = document.getElementById('heightLimitDisplay');
    domElements.heightWarning = document.getElementById('heightWarning');
    domElements.darkModeIcon = document.querySelector('.dark-mode-icon');
}

function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    if (domElements.darkModeIcon) {
        domElements.darkModeIcon.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

// 初期化時にダークモードを無効化（ライトモードをデフォルトに）
function initializeDarkMode() {
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    updateDarkModeIcon();
}

// グローバル変数の初期化
window.currentPallets = [];

// 高さ制限のグローバル変数
let maxHeightLimit = 158; // デフォルトは158cm（パレット台座14cm含む）

// === パフォーマンス最適化とメモリ管理 ===
function optimizePerformance() {
    // 大きなデータセットの場合の処理
    if (cartonData.length > 100) {
        console.log('Large dataset detected, applying performance optimizations...');
        
        // データを効率性でソート（上位100件のみ処理）
        const sortedData = [...cartonData].sort((a, b) => {
            const efficiencyA = (a.l * a.w * a.h) / a.weight;
            const efficiencyB = (b.l * b.w * b.h) / b.weight;
            return efficiencyB - efficiencyA;
        });
        
        return sortedData.slice(0, 100);
    }
    
    return cartonData;
}

// === メモリクリーンアップの改善 ===
function cleanupMemory() {
    // 大きなデータセットのクリア
    if (window.currentPallets && window.currentPallets.length > 1000) {
        console.log('Large dataset detected, clearing old data...');
        window.currentPallets = window.currentPallets.slice(-500); // 最新500件のみ保持
    }
    
    // 未使用のDOM要素のクリア
    const unusedElements = document.querySelectorAll('.temp-element, .calculation-result');
    if (unusedElements.length > 50) {
        console.log('Clearing unused DOM elements...');
        unusedElements.forEach(el => el.remove());
    }
    
    // ガベージコレクションの促進
    if (window.gc) {
        window.gc();
    }
}

// === 計算結果のキャッシュ管理 ===
const calculationCache = new Map();

function getCacheKey(cartonData, palletSizes, maxHeight) {
    const dataHash = JSON.stringify(cartonData.map(c => ({ l: c.l, w: c.w, h: c.h, weight: c.weight, qty: c.qty })));
    const palletHash = JSON.stringify(palletSizes.map(p => ({ width: p.width, depth: p.depth })));
    return `${dataHash}_${palletHash}_${maxHeight}`;
}

function getCachedResult(cacheKey) {
    return calculationCache.get(cacheKey);
}

function setCachedResult(cacheKey, result) {
    // キャッシュサイズを制限（最大100件）
    if (calculationCache.size > 100) {
        const firstKey = calculationCache.keys().next().value;
        calculationCache.delete(firstKey);
    }
    calculationCache.set(cacheKey, result);
}

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

// === 高さ制限設定機能 ===
function setHeightLimit(height) {
    // キャッシュされたDOM要素を使用
    if (!domElements.heightLimitInput || !domElements.heightLimitDisplay || !domElements.heightWarning) {
        console.warn('DOM elements not initialized yet');
        return;
    }
    
    // 値を更新
    domElements.heightLimitInput.value = height;
    maxHeightLimit = height;
    domElements.heightLimitDisplay.textContent = height;
    
    // プリセットボタンの状態更新
    document.querySelectorAll('.height-preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // 警告表示の判定
    if (height > 180) {
        domElements.heightWarning.classList.remove('hidden');
    } else {
        domElements.heightWarning.classList.add('hidden');
    }
    
    console.log(`高さ制限を${height}cmに設定しました`);
    
    // 既に計算結果がある場合は影響を通知
    if (window.currentPallets && window.currentPallets.length > 0) {
        const affectedPallets = window.currentPallets.filter(pallet => pallet.height > height);
        if (affectedPallets.length > 0) {
            showAlert(`⚠️ 高さ制限変更: ${affectedPallets.length}枚のパレットが新しい制限(${height}cm)を超過しています。再計算を推奨します。`, 'warning');
        }
    }
}

function updateHeightLimitFromInput() {
    // キャッシュされたDOM要素を使用
    if (!domElements.heightLimitInput || !domElements.heightLimitDisplay || !domElements.heightWarning) {
        console.warn('DOM elements not initialized yet');
        return;
    }
    
    let height = parseInt(domElements.heightLimitInput.value);
    
    // バリデーション
    if (isNaN(height) || height < 50) {
        height = 50;
        domElements.heightLimitInput.value = 50;
    } else if (height > 300) {
        height = 300;
        domElements.heightLimitInput.value = 300;
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

// === 最大カートン高さの取得 ===
function getMaxCartonHeight() {
    if (cartonData.length === 0) return 0;
    return maxHeightLimit - 14; // パレット台座14cmを除いたカートン配置可能高さ
}

// === 最大カートン寸法の取得 ===
function getMaxCartonDimensions() {
    if (cartonData.length === 0) return { l: 0, w: 0, h: 0 };
    return {
        l: Math.max(...cartonData.map(c => c.l)),
        w: Math.max(...cartonData.map(c => c.w)),
        h: Math.max(...cartonData.map(c => c.h))
    };
}

// === 高さ制限を取得する関数（総高さ） ===
function getMaxTotalHeight() {
    return maxHeightLimit;
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    initializeDarkMode();
    updateTable();
    updateSummary();
    setupEventListeners();
    initializePalletSelection();
    initializeHeightLimit();
    initializeDOMElements(); // DOM要素の初期化を追加
    
    // 定期的なメモリクリーンアップ（5分ごと）
    window.memoryCleanupTimer = setInterval(cleanupMemory, 5 * 60 * 1000);
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

// テーブル更新
function updateTable() {
    const tbody = document.getElementById('cartonTableBody');
    tbody.innerHTML = '';
    
    cartonData.forEach(carton => {
        const row = document.createElement('tr');
        const volume = (carton.l * carton.w * carton.h * carton.qty / 1000000).toFixed(3);
        
        row.innerHTML = `
            <td>${carton.code}</td>
            <td class="center">${carton.qty}</td>
            <td class="center mono">${carton.weight.toFixed(2)}</td>
            <td class="center mono">${carton.l.toFixed(1)}</td>
            <td class="center mono">${carton.w.toFixed(1)}</td>
            <td class="center mono">${carton.h.toFixed(1)}</td>
            <td class="center mono">${volume}</td>
            <td class="center">
                <div class="action-buttons">
                    <button class="btn btn-sm btn-secondary" onclick="editCarton(${carton.id})">✏️</button>
                    <button class="btn btn-sm btn-danger" onclick="removeCarton(${carton.id})">🗑️</button>
                </div>
            </td>
        `;
        tbody.appendChild(row);
    });
}

// サマリー更新
function updateSummary() {
    const totalCartons = cartonData.reduce((sum, c) => sum + c.qty, 0);
    const totalWeight = cartonData.reduce((sum, c) => sum + (c.weight * c.qty), 0);
    const itemCount = cartonData.length;
    
    document.getElementById('totalCartons').textContent = totalCartons.toLocaleString();
    document.getElementById('totalWeight').textContent = totalWeight.toFixed(1) + ' kg';
    document.getElementById('itemCount').textContent = itemCount + ' 種類';
}

// フォーム表示切替
function toggleAddForm() {
    const form = document.getElementById('addForm');
    const importArea = document.getElementById('importArea');
    form.classList.toggle('hidden');
    importArea.classList.add('hidden');
    if (!form.classList.contains('hidden')) {
        document.getElementById('newCode').focus();
    }
}

function toggleImportArea() {
    const form = document.getElementById('addForm');
    const importArea = document.getElementById('importArea');
    importArea.classList.toggle('hidden');
    form.classList.add('hidden');
}

// カートン追加・編集
function addCarton() {
    try {
        const code = document.getElementById('newCode').value.trim();
        const qty = parseInt(document.getElementById('newQty').value);
        const weight = parseFloat(document.getElementById('newWeight').value);
        const l = parseFloat(document.getElementById('newL').value);
        const w = parseFloat(document.getElementById('newW').value);
        const h = parseFloat(document.getElementById('newH').value);
        
        if (!code || !qty || !weight || !l || !w || !h) {
            alert('全ての項目を入力してください');
            return;
        }
        
        // Validation for positive numbers
        if (qty <= 0 || weight <= 0 || l <= 0 || w <= 0 || h <= 0) {
            alert('数値は正の値を入力してください');
            return;
        }
        
        // Validation for reasonable ranges
        if (qty > 10000) {
            alert('数量は10,000個以下で入力してください');
            return;
        }
        
        if (weight > 1000) {
            alert('重量は1,000kg以下で入力してください');
            return;
        }
        
        if (l > 500 || w > 500 || h > 500) {
            alert('寸法は500cm以下で入力してください');
            return;
        }
        
        if (editingId) {
            // 編集モード
            const index = cartonData.findIndex(c => c.id === editingId);
            if (index !== -1) {
                cartonData[index] = { id: editingId, code, qty, weight, l, w, h };
            }
            editingId = null;
        } else {
            // 新規追加
            cartonData.push({
                id: nextId++,
                code, qty, weight, l, w, h
            });
        }
        
        clearInputs();
        updateTable();
        updateSummary();
        document.getElementById('addForm').classList.add('hidden');
    } catch (error) {
        console.error('Error adding carton:', error);
        alert('カートンの追加中にエラーが発生しました');
    }
}

function clearInputs() {
    ['newCode', 'newQty', 'newWeight', 'newL', 'newW', 'newH'].forEach(id => {
        document.getElementById(id).value = '';
    });
}

function cancelAdd() {
    clearInputs();
    editingId = null;
    document.getElementById('addForm').classList.add('hidden');
}

function cancelImport() {
    document.getElementById('csvFileInput').value = '';
    document.getElementById('importArea').classList.add('hidden');
}

// カートン編集・削除
function editCarton(id) {
    const carton = cartonData.find(c => c.id === id);
    if (carton) {
        document.getElementById('newCode').value = carton.code;
        document.getElementById('newQty').value = carton.qty;
        document.getElementById('newWeight').value = carton.weight;
        document.getElementById('newL').value = carton.l;
        document.getElementById('newW').value = carton.w;
        document.getElementById('newH').value = carton.h;
        editingId = id;
        document.getElementById('addForm').classList.remove('hidden');
        document.getElementById('importArea').classList.add('hidden');
    }
}

function removeCarton(id) {
    if (confirm('このカートンを削除しますか？')) {
        cartonData = cartonData.filter(c => c.id !== id);
        updateTable();
        updateSummary();
    }
}

function clearAllCartons() {
    if (cartonData.length === 0) {
        alert('削除するデータがありません');
        return;
    }
    
    if (confirm('全てのカートンデータを削除しますか？')) {
        cartonData = [];
        updateTable();
        updateSummary();
        clearResults();
    }
}

function clearResults() {
    document.getElementById('results').classList.add('hidden');
    document.getElementById('summarySection').classList.add('hidden');
    window.currentPallets = [];
}

// CSV機能
function downloadCSVTemplate() {
    const csvContent = 'コード,数量,重量(kg),長さ(cm),幅(cm),高さ(cm)\nSAMPLE A,362,6.70,53.0,38.5,23.5\nSAMPLE B,42,7.60,55.0,40.0,24.0';
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'パレタイズ計算_テンプレート.csv';
    link.click();
}

function executeImport() {
    try {
        const fileInput = document.getElementById('csvFileInput');
        const file = fileInput.files[0];
        
        if (!file) {
            alert('CSVファイルを選択してください');
            return;
        }
        
        // File size validation (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            alert('ファイルサイズが大きすぎます（5MB以下）');
            return;
        }
        
        // File type validation
        if (!file.name.toLowerCase().endsWith('.csv')) {
            alert('CSVファイルを選択してください');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                const lines = content.split('\n');
                const importedData = [];
                
                if (lines.length < 2) {
                    alert('CSVファイルにデータが含まれていません');
                    return;
                }
                
                // ヘッダー行をスキップ
                for (let i = 1; i < lines.length; i++) {
                    const line = lines[i].trim();
                    if (!line) continue;
                    
                    const values = line.split(',').map(v => v.trim());
                    if (values.length >= 6) {
                        const qty = parseInt(values[1]) || 0;
                        const weight = parseFloat(values[2]) || 0;
                        const l = parseFloat(values[3]) || 0;
                        const w = parseFloat(values[4]) || 0;
                        const h = parseFloat(values[5]) || 0;
                        
                        // Skip invalid data
                        if (qty <= 0 || weight <= 0 || l <= 0 || w <= 0 || h <= 0) {
                            console.warn(`Skipping invalid row ${i + 1}:`, values);
                            continue;
                        }
                        
                        importedData.push({
                            id: nextId++,
                            code: values[0],
                            qty: qty,
                            weight: weight,
                            l: l,
                            w: w,
                            h: h
                        });
                    }
                }
                
                if (importedData.length > 0) {
                    cartonData.push(...importedData);
                    updateTable();
                    updateSummary();
                    cancelImport();
                    alert(`${importedData.length}件のデータをインポートしました`);
                } else {
                    alert('有効なデータが見つかりませんでした');
                }
            } catch (error) {
                console.error('CSV parsing error:', error);
                alert('CSVファイルの読み込みに失敗しました: ' + error.message);
            }
        };
        
        reader.onerror = function() {
            alert('ファイルの読み込みに失敗しました');
        };
        
        reader.readAsText(file, 'UTF-8');
    } catch (error) {
        console.error('Error in executeImport:', error);
        alert('インポート処理中にエラーが発生しました');
    }
}

// === パレタイズ計算（メイン処理） ===
function calculateImprovedPalletization() {
    clearErrors();
    
    if (cartonData.length === 0) {
        showAlert('計算するカートンデータがありません', 'error');
        return;
    }
    
    if (selectedPalletSizes.length === 0) {
        showAlert('使用するパレットを選択してください', 'error');
        return;
    }

    // データの妥当性チェック
    const validationResult = validateCartonData();
    if (!validationResult.isValid) {
        showAlert(`データエラー: ${validationResult.message}`, 'error');
        return;
    }

    showLoading(true);
    
    setTimeout(() => {
        try {
            const results = performOptimizedPalletization();
            if (!results || results.length === 0) {
                showAlert('計算結果が生成されませんでした。データを確認してください。', 'warning');
                showLoading(false);
                return;
            }
            displayResults(results);
            showLoading(false);
        } catch (error) {
            console.error('計算エラー:', error);
            showAlert('計算中にエラーが発生しました: ' + error.message, 'error');
            showLoading(false);
        }
    }, 100);
}

// === カートンデータの妥当性チェック ===
function validateCartonData() {
    for (let i = 0; i < cartonData.length; i++) {
        const carton = cartonData[i];
        
        // 必須フィールドのチェック
        if (!carton.code || !carton.qty || !carton.weight || !carton.l || !carton.w || !carton.h) {
            return {
                isValid: false,
                message: `カートン${i + 1}に必須データが不足しています`
            };
        }
        
        // 数値の妥当性チェック
        if (carton.qty <= 0 || carton.weight <= 0 || carton.l <= 0 || carton.w <= 0 || carton.h <= 0) {
            return {
                isValid: false,
                message: `カートン${i + 1}の数値が不正です（正の値を入力してください）`
            };
        }
        
        // 高さ制限チェック
        if (carton.h > maxHeightLimit - 14) {
            return {
                isValid: false,
                message: `カートン${i + 1}の高さ(${carton.h}cm)が制限(${maxHeightLimit - 14}cm)を超過しています`
            };
        }
        
        // 重量制限チェック（単一カートン）
        if (carton.weight > 100) {
            return {
                isValid: false,
                message: `カートン${i + 1}の重量(${carton.weight}kg)が制限(100kg)を超過しています`
            };
        }
    }
    
    return { isValid: true, message: 'OK' };
}

// === 最適化計算の実行 ===
function performOptimizedPalletization() {
    const maxCartonHeight = getMaxCartonHeight();
    
    // キャッシュチェック
    const cacheKey = getCacheKey(cartonData, selectedPalletSizes, maxCartonHeight);
    const cachedResult = getCachedResult(cacheKey);
    if (cachedResult) {
        console.log('Using cached calculation result');
        return cachedResult;
    }
    
    // パフォーマンス最適化
    const optimizedData = optimizePerformance();
    const results = [];
    
    // 単一貨物での最適配置を計算
    selectedPalletSizes.forEach(palletSize => {
        optimizedData.forEach(carton => {
            const singleResult = calculateSingleCartonPallet(carton, palletSize, maxCartonHeight);
            if (singleResult && singleResult.quantity > 0) {
                results.push(singleResult);
            }
        });
    });
    
    // 混合貨物での最適配置を計算
    if (optimizedData.length > 1) {
        selectedPalletSizes.forEach(palletSize => {
            const mixedResults = calculateMixedCargoPallets(palletSize, maxCartonHeight);
            if (mixedResults && mixedResults.length > 0) {
                results.push(...mixedResults);
            }
        });
    }
    
    // 効率性でソート（効率の高い順）
    results.sort((a, b) => b.efficiency - a.efficiency);
    
    // 上位結果を選択（最大15件）
    const finalResults = results.slice(0, 15);
    
    // 結果をキャッシュに保存
    setCachedResult(cacheKey, finalResults);
    
    return finalResults;
}

// === 単一カートン種類でのパレット計算（改善版） ===
function calculateSingleCartonPallet(carton, palletSize, maxHeight) {
    try {
        // Input validation
        if (!carton || !palletSize || maxHeight <= 0) {
            console.warn('Invalid input parameters for pallet calculation');
            return null;
        }
        
        if (!carton.l || !carton.w || !carton.h || carton.l <= 0 || carton.w <= 0 || carton.h <= 0) {
            console.warn('Invalid carton dimensions:', carton);
            return null;
        }

        // 6つの3D回転パターンを考慮
        const orientations = [
            { l: carton.l, w: carton.w, h: carton.h, weight: carton.weight, code: carton.code, rotated: 'none', description: '標準配置' },
            { l: carton.l, w: carton.h, h: carton.w, weight: carton.weight, code: carton.code, rotated: 'height', description: '高さ回転' },
            { l: carton.w, w: carton.l, h: carton.h, weight: carton.weight, code: carton.code, rotated: 'width', description: '幅回転' },
            { l: carton.w, w: carton.h, h: carton.l, weight: carton.weight, code: carton.code, rotated: 'both', description: '幅高さ回転' },
            { l: carton.h, w: carton.l, h: carton.w, weight: carton.weight, code: carton.code, rotated: 'depth', description: '奥行回転' },
            { l: carton.h, w: carton.w, h: carton.l, weight: carton.weight, code: carton.code, rotated: 'all', description: '全軸回転' }
        ];
        
        let bestResult = null;
        let maxEfficiency = 0;
        
        orientations.forEach(orientation => {
            if (orientation.h <= maxHeight) {
                // 各層での配置数を計算
                const xCount = Math.floor(palletSize.width / orientation.l);
                const yCount = Math.floor(palletSize.depth / orientation.w);
                const maxLayers = Math.floor(maxHeight / orientation.h);
                
                if (xCount > 0 && yCount > 0 && maxLayers > 0) {
                    const maxQuantity = xCount * yCount * maxLayers;
                    const actualQuantity = Math.min(maxQuantity, carton.qty);
                    
                    if (actualQuantity > 0) {
                        // 実際の配置層数を計算
                        const actualLayers = Math.ceil(actualQuantity / (xCount * yCount));
                        const actualHeight = actualLayers * orientation.h + 14; // パレット台座14cm含む
                        
                        // 重量制限チェック（パレット最大重量: 1000kg）
                        const totalWeight = actualQuantity * carton.weight;
                        if (totalWeight > 1000) {
                            return; // 重量制限超過
                        }
                        
                        // パレット使用可能体積
                        const palletVolume = palletSize.width * palletSize.depth * maxHeight;
                        // カートン使用体積
                        const cartonVolume = actualQuantity * orientation.l * orientation.w * orientation.h;
                        
                        // 改善された効率計算（重量分布と安定性を考慮）
                        const volumeEfficiency = (cartonVolume / palletVolume) * 100;
                        const weightEfficiency = Math.max(0, 100 - (totalWeight / 10)); // 重量効率
                        const stabilityEfficiency = calculateStabilityEfficiency(orientation, xCount, yCount, actualLayers);
                        
                        // 総合効率（体積50% + 重量30% + 安定性20%）
                        const totalEfficiency = (volumeEfficiency * 0.5) + (weightEfficiency * 0.3) + (stabilityEfficiency * 0.2);
                        
                        if (totalEfficiency > maxEfficiency) {
                            maxEfficiency = totalEfficiency;
                            
                            bestResult = {
                                carton: carton,
                                palletSize: palletSize,
                                orientation: orientation,
                                layout: { x: xCount, y: yCount, layers: actualLayers },
                                quantity: actualQuantity,
                                totalQuantity: maxQuantity,
                                efficiency: totalEfficiency,
                                volumeEfficiency: volumeEfficiency,
                                weightEfficiency: weightEfficiency,
                                stabilityEfficiency: stabilityEfficiency,
                                height: actualHeight,
                                weight: totalWeight,
                                volume: cartonVolume / 1000000, // 立方メートル
                                layers: generateLayers(orientation, xCount, yCount, actualLayers, carton, actualQuantity),
                                centerOfGravity: calculateCenterOfGravity(orientation, xCount, yCount, actualLayers),
                                weightDistribution: calculateWeightDistribution(orientation, xCount, yCount, actualLayers, carton.weight)
                            };
                        }
                    }
                }
            }
        });
        
        return bestResult;
    } catch (error) {
        console.error('Error in calculateSingleCartonPallet:', error);
        return null;
    }
}

// === 混合貨物でのパレット計算 ===
function calculateMixedCargoPallets(palletSize, maxHeight) {
    const results = [];
    
    // 2種類の貨物の組み合わせを試行
    for (let i = 0; i < cartonData.length - 1; i++) {
        for (let j = i + 1; j < cartonData.length; j++) {
            const carton1 = cartonData[i];
            const carton2 = cartonData[j];
            
            const mixedResult = calculateMixedCargoPallet(carton1, carton2, palletSize, maxHeight);
            if (mixedResult) {
                results.push(mixedResult);
            }
        }
    }
    
    return results;
}

// === 混合貨物パレット計算 ===
function calculateMixedCargoPallet(carton1, carton2, palletSize, maxHeight) {
    try {
        // 両方の貨物が高さ制限内かチェック
        if (carton1.h > maxHeight || carton2.h > maxHeight) {
            return null;
        }
        
        // 重量制限チェック
        const maxWeight = 1000; // パレット最大重量
        const maxQty1 = Math.floor(maxWeight / carton1.weight);
        const maxQty2 = Math.floor(maxWeight / carton2.weight);
        
        // 各貨物の最大配置数を計算
        const orientations1 = generateAllOrientations(carton1);
        const orientations2 = generateAllOrientations(carton2);
        
        let bestResult = null;
        let maxEfficiency = 0;
        
        orientations1.forEach(orient1 => {
            orientations2.forEach(orient2 => {
                // 層別配置を試行
                const result = tryMixedLayerLayout(orient1, orient2, palletSize, maxHeight, maxQty1, maxQty2);
                if (result && result.efficiency > maxEfficiency) {
                    maxEfficiency = result.efficiency;
                    bestResult = result;
                }
            });
        });
        
        return bestResult;
    } catch (error) {
        console.error('Error in calculateMixedCargoPallet:', error);
        return null;
    }
}

// === 混合層配置の試行 ===
function tryMixedLayerLayout(orient1, orient2, palletSize, maxHeight, maxQty1, maxQty2) {
    // 貨物1を下層、貨物2を上層に配置
    const maxLayers1 = Math.floor(maxHeight / orient1.h);
    const maxLayers2 = Math.floor((maxHeight - (maxLayers1 * orient1.h)) / orient2.h);
    
    if (maxLayers1 <= 0 || maxLayers2 <= 0) {
        return null;
    }
    
    const xCount1 = Math.floor(palletSize.width / orient1.l);
    const yCount1 = Math.floor(palletSize.depth / orient1.w);
    const xCount2 = Math.floor(palletSize.width / orient2.l);
    const yCount2 = Math.floor(palletSize.depth / orient2.w);
    
    if (xCount1 <= 0 || yCount1 <= 0 || xCount2 <= 0 || yCount2 <= 0) {
        return null;
    }
    
    const maxQty1PerLayer = xCount1 * yCount1;
    const maxQty2PerLayer = xCount2 * yCount2;
    
    const actualLayers1 = Math.min(maxLayers1, Math.ceil(maxQty1 / maxQty1PerLayer));
    const actualLayers2 = Math.min(maxLayers2, Math.ceil(maxQty2 / maxQty2PerLayer));
    
    const actualQty1 = Math.min(actualLayers1 * maxQty1PerLayer, maxQty1);
    const actualQty2 = Math.min(actualLayers2 * maxQty2PerLayer, maxQty2);
    
    if (actualQty1 <= 0 || actualQty2 <= 0) {
        return null;
    }
    
    const totalHeight = (actualLayers1 * orient1.h) + (actualLayers2 * orient2.h) + 14;
    const totalWeight = (actualQty1 * orient1.weight) + (actualQty2 * orient2.weight);
    
    if (totalWeight > 1000) {
        return null;
    }
    
    // 効率計算
    const palletVolume = palletSize.width * palletSize.depth * maxHeight;
    const cartonVolume = (actualQty1 * orient1.l * orient1.w * orient1.h) + 
                         (actualQty2 * orient2.l * orient2.w * orient2.h);
    
    const volumeEfficiency = (cartonVolume / palletVolume) * 100;
    const weightEfficiency = Math.max(0, 100 - (totalWeight / 10));
    const stabilityEfficiency = calculateMixedStabilityEfficiency(orient1, orient2, actualLayers1, actualLayers2);
    
    const totalEfficiency = (volumeEfficiency * 0.5) + (weightEfficiency * 0.3) + (stabilityEfficiency * 0.2);
    
    return {
        carton: [orient1, orient2],
        palletSize: palletSize,
        orientation: { mixed: true, description: '混合配置' },
        layout: { 
            x: Math.max(xCount1, xCount2), 
            y: Math.max(yCount1, yCount2), 
            layers: actualLayers1 + actualLayers2 
        },
        quantity: actualQty1 + actualQty2,
        efficiency: totalEfficiency,
        volumeEfficiency: volumeEfficiency,
        weightEfficiency: weightEfficiency,
        stabilityEfficiency: stabilityEfficiency,
        height: totalHeight,
        weight: totalWeight,
        volume: cartonVolume / 1000000,
        layers: generateMixedLayers(orient1, orient2, actualLayers1, actualLayers2, actualQty1, actualQty2),
        centerOfGravity: calculateMixedCenterOfGravity(orient1, orient2, actualLayers1, actualLayers2),
        weightDistribution: calculateMixedWeightDistribution(orient1, orient2, actualLayers1, actualLayers2)
    };
}

// === 全方向の生成 ===
function generateAllOrientations(carton) {
    return [
        { l: carton.l, w: carton.w, h: carton.h, weight: carton.weight, code: carton.code, rotated: 'none', description: '標準配置' },
        { l: carton.l, w: carton.h, h: carton.w, weight: carton.weight, code: carton.code, rotated: 'height', description: '高さ回転' },
        { l: carton.w, w: carton.l, h: carton.h, weight: carton.weight, code: carton.code, rotated: 'width', description: '幅回転' },
        { l: carton.w, w: carton.h, h: carton.l, weight: carton.weight, code: carton.code, rotated: 'both', description: '幅高さ回転' },
        { l: carton.h, w: carton.l, h: carton.w, weight: carton.weight, code: carton.code, rotated: 'depth', description: '奥行回転' },
        { l: carton.h, w: carton.w, h: carton.l, weight: carton.weight, code: carton.code, rotated: 'all', description: '全軸回転' }
    ];
}

// === 安定性効率の計算 ===
function calculateStabilityEfficiency(orientation, xCount, yCount, layers) {
    // 重心の中心からの距離を考慮
    const centerX = (xCount * orientation.l) / 2;
    const centerY = (yCount * orientation.w) / 2;
    const centerZ = (layers * orientation.h) / 2;
    
    // 重心が中心に近いほど高効率
    const maxDimension = Math.max(centerX, centerY, centerZ);
    const centerDistance = Math.sqrt(centerX * centerX + centerY * centerY + centerZ * centerZ);
    
    return Math.max(0, 100 - (centerDistance / maxDimension) * 50);
}

// === 混合安定性効率の計算 ===
function calculateMixedStabilityEfficiency(orient1, orient2, layers1, layers2) {
    const totalLayers = layers1 + layers2;
    const centerZ1 = (layers1 * orient1.h) / 2;
    const centerZ2 = layers1 * orient1.h + (layers2 * orient2.h) / 2;
    
    const avgCenterZ = (centerZ1 + centerZ2) / 2;
    const maxZ = totalLayers * Math.max(orient1.h, orient2.h);
    
    return Math.max(0, 100 - (Math.abs(avgCenterZ - maxZ / 2) / maxZ) * 100);
}

// === 重心の計算 ===
function calculateCenterOfGravity(orientation, xCount, yCount, layers) {
    const centerX = (xCount * orientation.l) / 2;
    const centerY = (yCount * orientation.w) / 2;
    const centerZ = (layers * orientation.h) / 2 + 7; // パレット台座の中心
    
    return { x: centerX, y: centerY, z: centerZ };
}

// === 混合重心の計算 ===
function calculateMixedCenterOfGravity(orient1, orient2, layers1, layers2) {
    const centerX = 0; // パレット中心
    const centerY = 0; // パレット中心
    const centerZ = ((layers1 * orient1.h) + (layers2 * orient2.h)) / 2 + 7;
    
    return { x: centerX, y: centerY, z: centerZ };
}

// === 重量分布の計算 ===
function calculateWeightDistribution(orientation, xCount, yCount, layers, unitWeight) {
    const totalWeight = xCount * yCount * layers * unitWeight;
    const distribution = {
        frontLeft: totalWeight * 0.25,
        frontRight: totalWeight * 0.25,
        backLeft: totalWeight * 0.25,
        backRight: totalWeight * 0.25,
        center: totalWeight * 0.5
    };
    
    return distribution;
}

// === 混合重量分布の計算 ===
function calculateMixedWeightDistribution(orient1, orient2, layers1, layers2) {
    const weight1 = layers1 * orient1.weight;
    const weight2 = layers2 * orient2.weight;
    const totalWeight = weight1 + weight2;
    
    return {
        bottom: weight1,
        top: weight2,
        total: totalWeight,
        ratio: weight1 / totalWeight
    };
}

// 層データの生成
function generateLayers(orientation, xCount, yCount, layerCount, carton, totalQuantity) {
    const layers = [];
    let remainingQuantity = totalQuantity;
    
    for (let layer = 0; layer < layerCount && remainingQuantity > 0; layer++) {
        const layerCartons = [];
        const layerMax = Math.min(xCount * yCount, remainingQuantity);
        
        let count = 0;
        for (let y = 0; y < yCount && count < layerMax; y++) {
            for (let x = 0; x < xCount && count < layerMax; x++) {
                layerCartons.push({
                    code: carton.code,
                    position: {
                        x: x * orientation.l,
                        y: y * orientation.w,
                        width: orientation.l,
                        depth: orientation.w,
                        height: orientation.h
                    }
                });
                count++;
            }
        }
        
        layers.push({
            cartons: layerCartons,
            height: orientation.h,
            weight: layerCartons.length * carton.weight,
            type: 'single',
            cargoType: carton.code
        });
        
        remainingQuantity -= layerCartons.length;
    }
    
    return layers;
}

// 混合層データの生成
function generateMixedLayers(orient1, orient2, layers1, layers2, qty1, qty2) {
    const layers = [];
    let remainingQty1 = qty1;
    let remainingQty2 = qty2;
    
    // パレットサイズを取得（グローバル変数から）
    const palletSize = selectedPalletSizes[0]; // デフォルトで最初のパレットサイズを使用
    
    // 貨物1の層を生成
    for (let layer = 0; layer < layers1 && remainingQty1 > 0; layer++) {
        const layerCartons = [];
        const xCount = Math.floor(palletSize.width / orient1.l);
        const yCount = Math.floor(palletSize.depth / orient1.w);
        const layerMax = Math.min(xCount * yCount, remainingQty1);
        
        let count = 0;
        for (let y = 0; y < yCount && count < layerMax; y++) {
            for (let x = 0; x < xCount && count < layerMax; x++) {
                layerCartons.push({
                    code: orient1.code,
                    position: {
                        x: x * orient1.l,
                        y: y * orient1.w,
                        width: orient1.l,
                        depth: orient1.w,
                        height: orient1.h
                    }
                });
                count++;
            }
        }
        
        remainingQty1 -= count;
        
        layers.push({
            cartons: layerCartons,
            height: orient1.h,
            weight: count * orient1.weight,
            type: 'single',
            cargoType: orient1.code
        });
    }
    
    // 貨物2の層を生成
    for (let layer = 0; layer < layers2 && remainingQty2 > 0; layer++) {
        const layerCartons = [];
        const xCount = Math.floor(palletSize.width / orient2.l);
        const yCount = Math.floor(palletSize.depth / orient2.w);
        const layerMax = Math.min(xCount * yCount, remainingQty2);
        
        let count = 0;
        for (let y = 0; y < yCount && count < layerMax; y++) {
            for (let x = 0; x < xCount && count < layerMax; x++) {
                layerCartons.push({
                    code: orient2.code,
                    position: {
                        x: x * orient2.l,
                        y: y * orient2.w,
                        width: orient2.l,
                        depth: orient2.w,
                        height: orient2.h
                    }
                });
                count++;
            }
        }
        
        remainingQty2 -= count;
        
        layers.push({
            cartons: layerCartons,
            height: orient2.h,
            weight: count * orient2.weight,
            type: 'single',
            cargoType: orient2.code
        });
    }
    
    return layers;
}

// 結果表示
function displayResults(results) {
    window.currentPallets = results;
    
    document.getElementById('results').classList.remove('hidden');
    document.getElementById('summarySection').classList.remove('hidden');
    document.getElementById('combineSection').classList.remove('hidden');
    
    // 結果サマリー表示
    displayResultSummary(results);
    
    // パレット詳細表示
    displayPalletResults(results);
    
    // サマリーテーブル表示
    updateSummaryTable(results);
    
    // パレット結合セレクター更新
    updateCombineSelectors(results);
}

function displayResultSummary(results) {
    const summaryGrid = document.getElementById('resultSummary');
    const totalQuantity = results.reduce((sum, r) => sum + r.quantity, 0);
    const totalWeight = results.reduce((sum, r) => sum + r.weight, 0);
    const avgEfficiency = results.reduce((sum, r) => sum + r.efficiency, 0) / results.length;
    const avgVolumeEfficiency = results.reduce((sum, r) => sum + (r.volumeEfficiency || 0), 0) / results.length;
    const avgWeightEfficiency = results.reduce((sum, r) => sum + (r.weightEfficiency || 0), 0) / results.length;
    const avgStabilityEfficiency = results.reduce((sum, r) => sum + (r.stabilityEfficiency || 0), 0) / results.length;
    
    summaryGrid.innerHTML = `
        <div class="summary-card blue">
            <h3>最適パレット数</h3>
            <p>${results.length}</p>
        </div>
        <div class="summary-card green">
            <h3>総合効率</h3>
            <p>${avgEfficiency.toFixed(1)}%</p>
        </div>
        <div class="summary-card orange">
            <h3>総積載量</h3>
            <p>${totalQuantity}個</p>
        </div>
        <div class="summary-card purple">
            <h3>総重量</h3>
            <p>${totalWeight.toFixed(1)}kg</p>
        </div>
        <div class="summary-card teal">
            <h3>体積効率</h3>
            <p>${avgVolumeEfficiency.toFixed(1)}%</p>
        </div>
        <div class="summary-card indigo">
            <h3>重量効率</h3>
            <p>${avgWeightEfficiency.toFixed(1)}%</p>
        </div>
        <div class="summary-card pink">
            <h3>安定性効率</h3>
            <p>${avgStabilityEfficiency.toFixed(1)}%</p>
        </div>
    `;
}

function displayPalletResults(results) {
    const palletResults = document.getElementById('palletResults');
    palletResults.innerHTML = results.map((result, index) => createPalletCard(result, index + 1)).join('');
    
    // 配置図を描画
    setTimeout(() => {
        results.forEach((result, index) => {
            drawPalletDiagram(index + 1, result);
            drawLayersDetail(index + 1, result);
        });
    }, 100);
}

function createPalletCard(result, palletNumber) {
    const heightStatus = result.height <= maxHeightLimit ? '✅' : '⚠️';
    const heightColor = result.height <= maxHeightLimit ? '#16a34a' : '#dc2626';
    
    // 貨物情報の表示
    let cargoInfo = '';
    if (Array.isArray(result.carton)) {
        // 混合貨物の場合
        cargoInfo = result.carton.map(c => `${c.code} (${c.rotated})`).join(' + ');
    } else {
        // 単一貨物の場合
        cargoInfo = `${result.carton.code} ${result.orientation.rotated !== 'none' ? `(${result.orientation.description})` : ''}`;
    }
    
    // 効率詳細の表示
    const efficiencyDetails = `
        <div class="efficiency-details">
            <div class="efficiency-item">
                <span class="efficiency-label">体積効率:</span>
                <span class="efficiency-value">${(result.volumeEfficiency || 0).toFixed(1)}%</span>
            </div>
            <div class="efficiency-item">
                <span class="efficiency-label">重量効率:</span>
                <span class="efficiency-value">${(result.weightEfficiency || 0).toFixed(1)}%</span>
            </div>
            <div class="efficiency-item">
                <span class="efficiency-label">安定性効率:</span>
                <span class="efficiency-value">${(result.stabilityEfficiency || 0).toFixed(1)}%</span>
            </div>
        </div>
    `;
    
    return `
        <div class="pallet-card" id="pallet-${palletNumber}">
            <h3>パレット ${palletNumber} - ${result.palletSize.name} ${heightStatus}</h3>
            <div class="pallet-grid">
                <div class="pallet-stat">
                    <p>寸法 (cm)</p>
                    <p>${result.palletSize.width}×${result.palletSize.depth}×${result.height.toFixed(1)}</p>
                </div>
                <div class="pallet-stat">
                    <p>積載数量</p>
                    <p>${result.quantity}個</p>
                </div>
                <div class="pallet-stat">
                    <p>総合効率</p>
                    <p>${result.efficiency.toFixed(1)}%</p>
                </div>
                <div class="pallet-stat">
                    <p>重量</p>
                    <p>${result.weight.toFixed(1)}kg</p>
                </div>
            </div>
            <div class="pallet-details">
                <p><strong>貨物:</strong> ${cargoInfo}</p>
                <div class="cargo-list">
                    ${Array.isArray(result.carton) ? 
                        result.carton.map(c => `
                            <div class="cargo-item">
                                <span class="cargo-code">${c.code}</span>
                                <span class="cargo-badge">${c.rotated}</span>
                            </div>
                        `).join('') :
                        `<div class="cargo-item">
                            <span class="cargo-code">${result.carton.code}</span>
                            <span class="cargo-badge">${result.orientation.description}</span>
                        </div>`
                    }
                </div>
                <div class="layer-info">
                    <strong>配置詳細:</strong>
                    <div class="layer-item">
                        ${result.layout.x}列 × ${result.layout.y}行 × ${result.layout.layers}層
                        ${result.orientation.mixed ? ' (混合配置)' : ''}
                    </div>
                </div>
                ${efficiencyDetails}
                <div class="safety-warning" style="background-color: ${result.height <= maxHeightLimit ? '#d4edda' : '#f8d7da'}; color: ${heightColor}; margin-top: 15px;">
                    <strong>高さ制限チェック:</strong>
                    実際高さ ${result.height.toFixed(1)}cm / 制限 ${maxHeightLimit}cm
                    ${result.height <= maxHeightLimit ? ' ✅ 適合' : ' ❌ 超過'}
                </div>
                ${result.centerOfGravity ? `
                <div class="center-of-gravity" style="background-color: #e3f2fd; color: #1976d2; margin-top: 15px; padding: 10px; border-radius: 4px;">
                    <strong>重心位置:</strong>
                    X: ${result.centerOfGravity.x.toFixed(1)}cm, 
                    Y: ${result.centerOfGravity.y.toFixed(1)}cm, 
                    Z: ${result.centerOfGravity.z.toFixed(1)}cm
                </div>
                ` : ''}
            </div>
            <div class="diagram-container">
                <div class="diagram-tabs">
                    <button class="diagram-tab active" onclick="showDiagramView(${palletNumber}, 'side')">側面図</button>
                    <button class="diagram-tab" onclick="showDiagramView(${palletNumber}, 'layers')">層別配置</button>
                </div>
                <div class="diagram-content">
                    <div id="diagram-${palletNumber}-side" class="diagram-view active">
                        <div class="canvas-container">
                            <canvas id="canvas-${palletNumber}-side" class="pallet-canvas" width="500" height="300"></canvas>
                        </div>
                    </div>
                    <div id="diagram-${palletNumber}-layers" class="diagram-view">
                        <div id="layersDetail_${palletNumber}">
                            <!-- 層別詳細はJavaScriptで生成 -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// 配置図表示切り替え
function showDiagramView(palletNumber, viewType) {
    // タブの切り替え
    document.querySelectorAll(`#pallet-${palletNumber} .diagram-tab`).forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelector(`#pallet-${palletNumber} .diagram-tab[onclick*="${viewType}"]`).classList.add('active');
    
    // ビューの切り替え
    document.querySelectorAll(`#pallet-${palletNumber} .diagram-view`).forEach(view => {
        view.classList.remove('active');
    });
    document.getElementById(`diagram-${palletNumber}-${viewType}`).classList.add('active');
    
    // 必要に応じて描画を実行
    if (viewType === 'side') {
        const result = window.currentPallets[palletNumber - 1];
        if (result) {
            drawPalletDiagram(palletNumber, result);
        }
    } else if (viewType === 'layers') {
        const result = window.currentPallets[palletNumber - 1];
        if (result) {
            drawLayersDetail(palletNumber, result);
        }
    }
}

// 側面図描画
function drawPalletDiagram(palletNumber, pallet) {
    const canvas = document.getElementById(`canvas-${palletNumber}-side`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const margin = 50;
    const maxWidth = canvas.width - 2 * margin;
    const maxHeight = canvas.height - 2 * margin;
    
    // スケール計算
    const palletDepth = pallet.palletSize.depth;
    const totalHeight = pallet.height;
    const scaleX = maxWidth / palletDepth;
    const scaleY = maxHeight / Math.max(totalHeight, maxHeightLimit);
    const scale = Math.min(scaleX, scaleY);
    
    const palletW = palletDepth * scale;
    const palletH = 14 * scale; // パレット台座高さ
    const startX = (canvas.width - palletW) / 2;
    const startY = canvas.height - margin;
    
    // パレット台座
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(startX, startY - palletH, palletW, palletH);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY - palletH, palletW, palletH);
    
    // カートン層を描画
    let currentY = startY - palletH;
    const colors = generateColors(1);
    
    pallet.layers.forEach((layer, layerIndex) => {
        const layerH = layer.height * scale;
        ctx.fillStyle = colors[0];
        ctx.fillRect(startX, currentY - layerH, palletW, layerH);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(startX, currentY - layerH, palletW, layerH);
        
        // 層ラベル
        if (layerH > 15) {
            ctx.fillStyle = '#fff';
            ctx.font = '10px Arial';
            ctx.textAlign = 'center';
            ctx.fillText(`層${layerIndex + 1}`, startX + palletW / 2, currentY - layerH / 2);
        }
        
        currentY -= layerH;
    });
    
    // 高さ制限線
    const limitLineY = startY - maxHeightLimit * scale;
    if (limitLineY > margin) {
        ctx.strokeStyle = pallet.height <= maxHeightLimit ? '#16a34a' : '#dc2626';
        ctx.lineWidth = 2;
        ctx.setLineDash([5, 5]);
        ctx.beginPath();
        ctx.moveTo(startX - 20, limitLineY);
        ctx.lineTo(startX + palletW + 20, limitLineY);
        ctx.stroke();
        ctx.setLineDash([]);
        
        // 制限線ラベル
        ctx.fillStyle = pallet.height <= maxHeightLimit ? '#16a34a' : '#dc2626';
        ctx.font = '12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`制限: ${maxHeightLimit}cm`, startX + palletW + 25, limitLineY + 4);
    }
    
    // 寸法ラベル
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    const heightStatus = pallet.height <= maxHeightLimit ? '✅' : '⚠️';
    ctx.fillText(`パレット${palletNumber} - 側面図 ${heightStatus}`, canvas.width / 2, 25);
    
    ctx.font = '12px Arial';
    const heightColor = pallet.height <= maxHeightLimit ? '#16a34a' : '#dc2626';
    ctx.fillStyle = heightColor;
    ctx.fillText(`実際高さ: ${pallet.height.toFixed(1)}cm / 制限: ${maxHeightLimit}cm`, canvas.width / 2, canvas.height - 15);
    
    ctx.fillStyle = '#333';
    ctx.fillText(`${pallet.palletSize.width}cm × ${pallet.palletSize.depth}cm`, canvas.width / 2, canvas.height - 5);
}

// 層別詳細描画
function drawLayersDetail(palletNumber, pallet) {
    const container = document.getElementById(`layersDetail_${palletNumber}`);
    if (!container) return;
    
    const uniqueCodes = [...new Set(pallet.layers.flatMap(layer => layer.cartons.map(c => c.code)))];
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
        
        html += `
            <div style="border: 1px solid #ccc; border-radius: 8px; padding: 15px; background-color: white;">
                <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 10px;">
                    <h4 style="margin: 0; color: #374151;">第${layerIndex + 1}層</h4>
                    <div style="font-size: 0.9rem; color: #666;">
                        高さ: ${layer.height.toFixed(1)}cm | 重量: ${layer.weight.toFixed(1)}kg | 個数: ${layer.cartons.length}個
                    </div>
                </div>
                <div style="margin-bottom: 10px;">
                    <div style="display: flex; flex-wrap: wrap; gap: 5px;">
                        ${Object.entries(layerCounts).map(([code, count]) => {
                            const carton = cartonData.find(c => c.code === code);
                            const sizeInfo = carton ? `${carton.l}×${carton.w}×${carton.h}cm` : '';
                            return `<div style="margin: 2px 0;"><span style="display: inline-block; margin-right: 8px; padding: 2px 8px; background-color: ${colorMap[code]}; border-radius: 12px; font-size: 12px; color: white;">${code}: ${count}個</span><small style="color: #666;">${sizeInfo}</small></div>`
                        }).join('')}
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <canvas id="layerCanvas_${palletNumber}_${layerIndex}" width="400" height="250" style="border: 1px solid #ccc; background-color: white; border-radius: 5px;"></canvas>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    setTimeout(() => {
        pallet.layers.forEach((layer, layerIndex) => {
            drawSingleLayer(palletNumber, layerIndex, layer, pallet.palletSize, colorMap);
        });
    }, 100);
}

// 単一層描画
function drawSingleLayer(palletNumber, layerIndex, layer, palletSize, colorMap) {
    const canvas = document.getElementById(`layerCanvas_${palletNumber}_${layerIndex}`);
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
}

// 色生成
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

// サマリーテーブル更新
function updateSummaryTable(results) {
    const tbody = document.getElementById('summaryBody');
    tbody.innerHTML = results.map((result, index) => {
        // 貨物情報の取得
        let cargoInfo = '';
        if (Array.isArray(result.carton)) {
            cargoInfo = result.carton.map(c => c.code).join(' + ');
        } else {
            cargoInfo = result.carton.code;
        }
        
        // 効率情報の取得
        const volumeEfficiency = result.volumeEfficiency || 0;
        const weightEfficiency = result.weightEfficiency || 0;
        const stabilityEfficiency = result.stabilityEfficiency || 0;
        
        return `
            <tr>
                <td><span class="pallet-link" onclick="scrollToPallet(${index + 1})">${index + 1}</span></td>
                <td>${result.palletSize.width}×${result.palletSize.depth}×${result.height.toFixed(1)}</td>
                <td>${result.weight.toFixed(1)}</td>
                <td>${cargoInfo}</td>
                <td>${result.quantity}</td>
                <td>${result.efficiency.toFixed(1)}%</td>
                <td>${volumeEfficiency.toFixed(1)}%</td>
                <td>${weightEfficiency.toFixed(1)}%</td>
                <td>${stabilityEfficiency.toFixed(1)}%</td>
                <td>${result.height <= maxHeightLimit ? '✅' : '⚠️'}</td>
            </tr>
        `;
    }).join('');
}

// パレット番号クリック機能
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

// パレット結合セレクター更新
function updateCombineSelectors(results) {
    const selectors = ['pallet1Select', 'pallet2Select'];
    selectors.forEach(id => {
        const select = document.getElementById(id);
        if (select) {
            select.innerHTML = '<option value="">選択...</option>' + 
                results.map((result, index) => {
                    let cargoInfo = '';
                    if (Array.isArray(result.carton)) {
                        cargoInfo = result.carton.map(c => c.code).join('+');
                    } else {
                        cargoInfo = result.carton.code;
                    }
                    return `<option value="${index + 1}">パレット ${index + 1} (${cargoInfo})</option>`;
                }).join('');
        }
    });
}

// パレット結合機能（改善版）
function combinePallets() {
    const pallet1Index = parseInt(document.getElementById('pallet1Select').value);
    const pallet2Index = parseInt(document.getElementById('pallet2Select').value);
    
    if (!pallet1Index || !pallet2Index || pallet1Index === pallet2Index) {
        alert('異なる2つのパレットを選択してください');
        return;
    }
    
    const p1 = window.currentPallets[pallet1Index - 1];
    const p2 = window.currentPallets[pallet2Index - 1];
    
    if (!p1 || !p2) {
        alert('パレットデータが見つかりません');
        return;
    }
    
    // 結合可能性の分析
    const analysis = analyzePalletCombination(p1, p2);
    alert(analysis);
}

// パレット結合可能性の分析
function analyzePalletCombination(p1, p2) {
    const totalWeight = p1.weight + p2.weight;
    const maxHeight = Math.max(p1.height, p2.height);
    const combinedVolume = p1.volume + p2.volume;
    
    let analysis = `【パレット結合分析結果】\n\n`;
    analysis += `パレット${p1.id || '1'}:\n`;
    analysis += `- 貨物: ${Array.isArray(p1.carton) ? p1.carton.map(c => c.code).join('+') : p1.carton.code}\n`;
    analysis += `- 効率: ${p1.efficiency.toFixed(1)}%\n`;
    analysis += `- 重量: ${p1.weight.toFixed(1)}kg\n`;
    analysis += `- 高さ: ${p1.height.toFixed(1)}cm\n\n`;
    
    analysis += `パレット${p2.id || '2'}:\n`;
    analysis += `- 貨物: ${Array.isArray(p2.carton) ? p2.carton.map(c => c.code).join('+') : p2.carton.code}\n`;
    analysis += `- 効率: ${p2.efficiency.toFixed(1)}%\n`;
    analysis += `- 重量: ${p2.weight.toFixed(1)}kg\n`;
    analysis += `- 高さ: ${p2.height.toFixed(1)}cm\n\n`;
    
    analysis += `結合可能性:\n`;
    analysis += `- 総重量: ${totalWeight.toFixed(1)}kg ${totalWeight <= 1000 ? '✅' : '❌'}\n`;
    analysis += `- 最大高さ: ${maxHeight.toFixed(1)}cm ${maxHeight <= maxHeightLimit ? '✅' : '❌'}\n`;
    analysis += `- 総体積: ${combinedVolume.toFixed(3)}m³\n`;
    
    if (totalWeight <= 1000 && maxHeight <= maxHeightLimit) {
        analysis += `\n✅ 結合可能です！`;
    } else {
        analysis += `\n❌ 結合できません（重量または高さ制限超過）`;
    }
    
    return analysis;
}

function autoOptimizePallets() {
    if (!window.currentPallets || window.currentPallets.length === 0) {
        alert('最適化するパレットデータがありません');
        return;
    }
    
    // 現在の結果を再計算
    calculateImprovedPalletization();
}

function analyzeSelectedPallets() {
    const pallet1Index = parseInt(document.getElementById('pallet1Select').value);
    const pallet2Index = parseInt(document.getElementById('pallet2Select').value);
    
    if (!pallet1Index || !pallet2Index) {
        alert('分析する2つのパレットを選択してください');
        return;
    }
    
    const p1 = window.currentPallets[pallet1Index - 1];
    const p2 = window.currentPallets[pallet2Index - 1];
    
    if (!p1 || !p2) {
        alert('パレットデータが見つかりません');
        return;
    }
    
    const analysis = `
【パレット詳細分析結果】

パレット${pallet1Index}:
- 貨物: ${Array.isArray(p1.carton) ? p1.carton.map(c => c.code).join('+') : p1.carton.code}
- 総合効率: ${p1.efficiency.toFixed(1)}%
- 体積効率: ${(p1.volumeEfficiency || 0).toFixed(1)}%
- 重量効率: ${(p1.weightEfficiency || 0).toFixed(1)}%
- 安定性効率: ${(p1.stabilityEfficiency || 0).toFixed(1)}%
- 重量: ${p1.weight.toFixed(1)}kg
- 高さ: ${p1.height.toFixed(1)}cm

パレット${pallet2Index}:
- 貨物: ${Array.isArray(p2.carton) ? p2.carton.map(c => c.code).join('+') : p2.carton.code}
- 総合効率: ${p2.efficiency.toFixed(1)}%
- 体積効率: ${(p2.volumeEfficiency || 0).toFixed(1)}%
- 重量効率: ${(p2.weightEfficiency || 0).toFixed(1)}%
- 安定性効率: ${(p2.stabilityEfficiency || 0).toFixed(1)}%
- 重量: ${p2.weight.toFixed(1)}kg
- 高さ: ${p2.height.toFixed(1)}cm

比較分析:
- 効率差: ${Math.abs(p1.efficiency - p2.efficiency).toFixed(1)}%
- 重量差: ${Math.abs(p1.weight - p2.weight).toFixed(1)}kg
- 高さ差: ${Math.abs(p1.height - p2.height).toFixed(1)}cm
            `;
    
    alert(analysis);
}

function updateCombinePreview() {
    const preview = document.getElementById('combinePreview');
    if (!preview) return;
    
    const pallet1Index = parseInt(document.getElementById('pallet1Select').value);
    const pallet2Index = parseInt(document.getElementById('pallet2Select').value);
    
    if (pallet1Index && pallet2Index && pallet1Index !== pallet2Index) {
        const p1 = window.currentPallets[pallet1Index - 1];
        const p2 = window.currentPallets[pallet2Index - 1];
        
        if (p1 && p2) {
            const totalWeight = p1.weight + p2.weight;
            const maxHeight = Math.max(p1.height, p2.height);
            
            let status = '';
            if (totalWeight <= 1000 && maxHeight <= maxHeightLimit) {
                status = '✅ 結合可能';
            } else {
                status = '❌ 結合不可';
            }
            
            preview.textContent = `結合予測: ${Array.isArray(p1.carton) ? p1.carton.map(c => c.code).join('+') : p1.carton.code} + ${Array.isArray(p2.carton) ? p2.carton.map(c => c.code).join('+') : p2.carton.code} → ${status}`;
        }
    } else {
        preview.textContent = '2つのパレットを選択してください';
    }
}

// CSVエクスポート
function exportSummaryCsv() {
    if (!window.currentPallets || window.currentPallets.length === 0) {
        alert('エクスポートするデータがありません');
        return;
    }
    
    const headers = ['パレットNo', '寸法(cm)', '重量(kg)', '貨物コード', '数量', '効率(%)', '高さ制限適合'];
    const rows = window.currentPallets.map((result, index) => [
        index + 1,
        `${result.palletSize.width}×${result.palletSize.depth}×${result.height.toFixed(1)}`,
        result.weight.toFixed(1),
        result.carton.code,
        result.quantity,
        result.efficiency.toFixed(1),
        result.height <= maxHeightLimit ? '適合' : '超過'
    ]);
    
    const csvContent = [headers, ...rows].map(row => row.join(',')).join('\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `パレタイズ結果_${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
}

// ユーティリティ関数
function showLoading(show) {
    const loading = document.getElementById('loading');
    loading.style.display = show ? 'flex' : 'none';
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.textContent = message;
    alertDiv.style.margin = '10px 0';
    alertDiv.style.padding = '12px';
    alertDiv.style.borderRadius = '6px';
    alertDiv.style.fontWeight = '500';
    
    const colors = {
        error: { bg: '#fef2f2', border: '#fecaca', text: '#dc2626' },
        warning: { bg: '#fffbeb', border: '#fed7aa', text: '#d97706' },
        success: { bg: '#f0fdf4', border: '#bbf7d0', text: '#16a34a' },
        info: { bg: '#eff6ff', border: '#bfdbfe', text: '#2563eb' }
    };
    
    const color = colors[type] || colors.info;
    alertDiv.style.backgroundColor = color.bg;
    alertDiv.style.borderLeft = `4px solid ${color.border}`;
    alertDiv.style.color = color.text;
    
    document.getElementById('errors').appendChild(alertDiv);
    
    // 5秒後に自動削除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.parentNode.removeChild(alertDiv);
        }
    }, 5000);
}

function clearErrors() {
    document.getElementById('errors').innerHTML = '';
}

// グローバル関数として定義
window.showDiagramView = showDiagramView;
window.scrollToPallet = scrollToPallet;
window.setHeightLimit = setHeightLimit;
window.editCarton = editCarton;
window.removeCarton = removeCarton;

// ページ離脱時のクリーンアップ
window.addEventListener('beforeunload', function() {
    // タイマーのクリア
    if (window.memoryCleanupTimer) {
        clearInterval(window.memoryCleanupTimer);
    }
    
    // 大きなデータセットのクリア
    if (window.currentPallets && window.currentPallets.length > 0) {
        console.log('Cleaning up pallet data before page unload...');
        window.currentPallets = [];
    }
    
    // 未使用のDOM要素のクリア
    cleanupMemory();
});

// === プログレス表示の改善 ===
function showProgress(message, percentage = 0) {
    const progressDiv = document.getElementById('progress');
    if (!progressDiv) return;
    
    if (percentage === 0) {
        progressDiv.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar">
                    <div class="progress-fill" style="width: 0%"></div>
                </div>
                <div class="progress-text">${message}</div>
            </div>
        `;
        progressDiv.style.display = 'block';
    } else {
        const progressFill = progressDiv.querySelector('.progress-fill');
        const progressText = progressDiv.querySelector('.progress-text');
        if (progressFill) progressFill.style.width = `${percentage}%`;
        if (progressText) progressText.textContent = `${message} (${percentage}%)`;
    }
}

function hideProgress() {
    const progressDiv = document.getElementById('progress');
    if (progressDiv) {
        progressDiv.style.display = 'none';
    }
}

// === エラーハンドリングの改善 ===
function handleCalculationError(error, context = '') {
    console.error(`Calculation error in ${context}:`, error);
    
    let userMessage = '計算中にエラーが発生しました';
    
    if (error.message.includes('weight')) {
        userMessage = '重量制限を超過しています。カートンの重量を確認してください。';
    } else if (error.message.includes('height')) {
        userMessage = '高さ制限を超過しています。カートンの高さを確認してください。';
    } else if (error.message.includes('dimension')) {
        userMessage = '寸法データに問題があります。カートンの寸法を確認してください。';
    } else if (error.message.includes('memory')) {
        userMessage = 'メモリ不足です。データ量を減らして再試行してください。';
    }
    
    showAlert(userMessage, 'error');
    hideProgress();
}

// === 計算結果の品質評価 ===
function evaluateResultQuality(results) {
    if (!results || results.length === 0) {
        return { quality: 'poor', message: '結果が生成されませんでした' };
    }
    
    const avgEfficiency = results.reduce((sum, r) => sum + r.efficiency, 0) / results.length;
    const avgVolumeEfficiency = results.reduce((sum, r) => sum + (r.volumeEfficiency || 0), 0) / results.length;
    const avgWeightEfficiency = results.reduce((sum, r) => sum + (r.weightEfficiency || 0), 0) / results.length;
    
    let quality = 'good';
    let message = '良好な結果が得られました';
    
    if (avgEfficiency < 60) {
        quality = 'poor';
        message = '効率が低いです。パレットサイズやカートン配置を見直してください。';
    } else if (avgEfficiency < 80) {
        quality = 'fair';
        message = '効率は中程度です。さらなる最適化の余地があります。';
    }
    
    if (avgVolumeEfficiency < 50) {
        message += ' 体積効率が低いです。';
    }
    
    if (avgWeightEfficiency < 70) {
        message += ' 重量効率が低いです。';
    }
    
    return { quality, message, metrics: { avgEfficiency, avgVolumeEfficiency, avgWeightEfficiency } };
}