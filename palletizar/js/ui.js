// ====================================
// UI MODULE - DOM Manipulation and User Interface
// ====================================

import { 
    cartonData, 
    addCartonData, 
    updateCartonData, 
    deleteCartonData, 
    clearAllCartonData,
    getCartonData,
    getCartonSummary,
    setEditingId,
    getEditingId,
    clearEditingId,
    validateCartonData,
    parseAndImportCSV,
    downloadCSVTemplate,
    setMaxHeightLimit,
    getMaxHeightLimit,
    getMaxCartonHeight,
    allPalletSizes,
    selectedPalletSizes,
    togglePalletSize,
    selectAllPalletSizes,
    deselectAllPalletSizes,
    getSelectedPalletSizes,
    getCurrentPallets
} from './data.js';
import { showErrors, generateCSV, downloadFile, getTimestampedFileName } from './utils.js';
import { calculateImprovedPalletization } from './algorithms.js';
import { drawPalletDiagram } from './visualization.js';

// === 高さ制限設定機能 ===
export function setHeightLimit(height) {
    const input = document.getElementById('heightLimitInput');
    const display = document.getElementById('heightLimitDisplay');
    const warning = document.getElementById('heightWarning');
    
    // 値を更新
    input.value = height;
    setMaxHeightLimit(height);
    display.textContent = height;
    
    // プリセットボタンの状態更新
    document.querySelectorAll('.height-preset-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    if (event && event.target) {
        event.target.classList.add('active');
    }
    
    // 警告表示の判定
    if (height > 180) {
        warning.classList.remove('hidden');
    } else {
        warning.classList.add('hidden');
    }
    
    console.log(`高さ制限を${height}cmに設定しました`);
    
    // 既に計算結果がある場合は影響を通知
    const currentPallets = getCurrentPallets();
    if (currentPallets && currentPallets.length > 0) {
        const affectedPallets = currentPallets.filter(pallet => pallet.height > height);
        if (affectedPallets.length > 0) {
            const alertDiv = document.createElement('div');
            alertDiv.className = 'alert alert-warning';
            alertDiv.innerHTML = `⚠️ 高さ制限変更: ${affectedPallets.length}枚のパレットが新しい制限(${height}cm)を超過しています。再計算を推奨します。`;
            document.getElementById('errors').appendChild(alertDiv);
        }
    }
}

export function updateHeightLimitFromInput() {
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
    
    setMaxHeightLimit(height);
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

// === パレット選択機能 ===
export function initializePalletSelection() {
    const container = document.getElementById('palletOptions');
    container.innerHTML = '';
    
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
        container.appendChild(option);
    });
    
    updateSelectedPalletsInfo();
}

export function togglePalletSelection(index) {
    const option = document.querySelectorAll('.pallet-option')[index];
    const checkbox = option.querySelector('.pallet-checkbox');
    
    if (option.classList.contains('selected')) {
        option.classList.remove('selected');
        checkbox.checked = false;
    } else {
        option.classList.add('selected');
        checkbox.checked = true;
    }
    
    togglePalletSize(index);
    updateSelectedPalletsInfo();
}

export function selectAllPallets() {
    selectAllPalletSizes();
    document.querySelectorAll('.pallet-option').forEach(option => {
        option.classList.add('selected');
        option.querySelector('.pallet-checkbox').checked = true;
    });
    updateSelectedPalletsInfo();
}

export function deselectAllPallets() {
    deselectAllPalletSizes();
    document.querySelectorAll('.pallet-option').forEach(option => {
        option.classList.remove('selected');
        option.querySelector('.pallet-checkbox').checked = false;
    });
    updateSelectedPalletsInfo();
}

export function updateSelectedPalletsInfo() {
    const selected = getSelectedPalletSizes();
    const infoElement = document.getElementById('selectedPalletsInfo');
    
    if (selected.length === 0) {
        infoElement.textContent = '⚠️ パレットが選択されていません';
        infoElement.style.color = '#dc2626';
    } else {
        infoElement.textContent = `${selected.length}種類のパレットが選択されています`;
        infoElement.style.color = '#666';
    }
}

// === データ管理UI ===
export function clearAllCartons() {
    if (confirm('すべてのカートンデータを削除しますか？この操作は取り消せません。')) {
        clearAllCartonData();
        updateTable();
        updateSummary();
        
        // 結果も非表示にする
        document.getElementById('results').classList.add('hidden');
        document.getElementById('summarySection').classList.add('hidden');
        
        // 成功メッセージ
        const successDiv = document.createElement('div');
        successDiv.className = 'alert alert-success';
        successDiv.innerHTML = '✅ すべてのカートンデータを削除しました。';
        document.getElementById('errors').appendChild(successDiv);
        
        setTimeout(() => {
            successDiv.remove();
        }, 3000);
    }
}

export function toggleImportArea() {
    const importArea = document.getElementById('importArea');
    importArea.classList.toggle('hidden');
    
    if (!importArea.classList.contains('hidden')) {
        document.getElementById('addForm').classList.add('hidden');
    }
}

export function toggleAddForm() {
    const addForm = document.getElementById('addForm');
    addForm.classList.toggle('hidden');
    
    if (!addForm.classList.contains('hidden')) {
        document.getElementById('importArea').classList.add('hidden');
        document.getElementById('newCode').focus();
    }
}

export function executeImport() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showErrors(['CSVファイルを選択してください。']);
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const csvText = e.target.result;
        const result = parseAndImportCSV(csvText);
        
        if (result.errors.length > 0) {
            showErrors(result.errors);
        }
        
        if (result.newCartons.length > 0) {
            updateTable();
            updateSummary();
            
            const successMessage = `✅ ${result.totalImported}件のカートンデータをインポートしました。`;
            const successDiv = document.createElement('div');
            successDiv.className = 'alert alert-success';
            successDiv.innerHTML = successMessage;
            document.getElementById('errors').appendChild(successDiv);
            
            cancelImport();
        } else if (result.newCartons.length === 0 && result.errors.length === 0) {
            showErrors(['インポート可能な新規データがありません。']);
        }
    };
    
    reader.readAsText(file);
}

export function cancelImport() {
    document.getElementById('importArea').classList.add('hidden');
    document.getElementById('csvFileInput').value = '';
}

export function addCarton() {
    const code = document.getElementById('newCode').value.trim();
    const qty = parseInt(document.getElementById('newQty').value) || 0;
    const weight = parseFloat(document.getElementById('newWeight').value) || 0;
    const l = parseFloat(document.getElementById('newL').value) || 0;
    const w = parseFloat(document.getElementById('newW').value) || 0;
    const h = parseFloat(document.getElementById('newH').value) || 0;

    const cartonData = { code, qty, weight, l, w, h };
    const validationErrors = validateCartonData(cartonData);
    
    if (validationErrors.length > 0) {
        showErrors(validationErrors);
        return;
    }

    const cartonDataArray = getCartonData();
    const existing = cartonDataArray.find(item => item.code === code);
    if (existing) {
        showErrors([`貨物コード "${code}" は既に存在します。`]);
        return;
    }

    addCartonData(cartonData);
    clearAddForm();
    updateTable();
    updateSummary();
}

export function cancelAdd() {
    clearAddForm();
}

export function clearAddForm() {
    document.getElementById('newCode').value = '';
    document.getElementById('newQty').value = '';
    document.getElementById('newWeight').value = '';
    document.getElementById('newL').value = '';
    document.getElementById('newW').value = '';
    document.getElementById('newH').value = '';
    document.getElementById('addForm').classList.add('hidden');
}

export function updateTable() {
    const tbody = document.getElementById('cartonTableBody');
    tbody.innerHTML = '';
    
    const cartonDataArray = getCartonData();

    if (cartonDataArray.length === 0) {
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

    cartonDataArray.forEach(item => {
        const volume = (item.l * item.w * item.h) / 1000000;
        const row = document.createElement('tr');
        
        const editingId = getEditingId();
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

export function updateSummary() {
    const summary = getCartonSummary();

    document.getElementById('totalCartons').textContent = `${summary.totalCartons} 個`;
    document.getElementById('totalWeight').textContent = `${summary.totalWeight.toFixed(1)} kg`;
    document.getElementById('itemCount').textContent = `${summary.itemCount} 種類`;
    
    const clearAllButton = document.getElementById('clearAllButton');
    if (clearAllButton) {
        clearAllButton.disabled = summary.itemCount === 0;
        clearAllButton.title = summary.itemCount === 0 ? 
            '削除するデータがありません' : 
            `${summary.itemCount}種類の貨物データを一括削除`;
    }
}

export function startEdit(id) {
    setEditingId(id);
    updateTable();
}

export function saveEdit(id) {
    const code = document.getElementById(`edit-code-${id}`).value.trim();
    const qty = parseInt(document.getElementById(`edit-qty-${id}`).value) || 0;
    const weight = parseFloat(document.getElementById(`edit-weight-${id}`).value) || 0;
    const l = parseFloat(document.getElementById(`edit-l-${id}`).value) || 0;
    const w = parseFloat(document.getElementById(`edit-w-${id}`).value) || 0;
    const h = parseFloat(document.getElementById(`edit-h-${id}`).value) || 0;

    const cartonData = { code, qty, weight, l, w, h };
    const validationErrors = validateCartonData(cartonData);
    
    if (validationErrors.length > 0) {
        showErrors(validationErrors);
        return;
    }

    const success = updateCartonData(id, cartonData);
    if (success) {
        clearEditingId();
        updateTable();
        updateSummary();
    } else {
        showErrors(['データの更新に失敗しました。']);
    }
}

export function cancelEdit() {
    clearEditingId();
    updateTable();
}

export function deleteCarton(id) {
    if (confirm('このカートンを削除しますか？')) {
        const success = deleteCartonData(id);
        if (success) {
            updateTable();
            updateSummary();
        } else {
            showErrors(['データの削除に失敗しました。']);
        }
    }
}

// === 計算実行UI ===
export function executeCalculation() {
    const cartonDataArray = getCartonData();
    const selectedPallets = getSelectedPalletSizes();
    
    if (cartonDataArray.length === 0) {
        showErrors(['カートンデータがありません。']);
        return;
    }

    if (selectedPallets.length === 0) {
        showErrors(['パレット種類を選択してください。']);
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
            const result = calculateImprovedPalletization();
            
            // 結果表示
            displayResults(result.pallets);
            buildSummaryTable(result.pallets);
            
            // 未配置分析の表示
            if (result.unplacedData.total > 0) {
                const heightBlocked = result.unplacedData.heightBlocked;
                if (heightBlocked.length > 0) {
                    const heightBlockedTotal = heightBlocked.reduce((sum, item) => sum + item.remaining, 0);
                    const warningDiv = document.createElement('div');
                    warningDiv.className = 'alert alert-warning';
                    warningDiv.innerHTML = `⚠️ 高さ制限により${heightBlockedTotal}個のカートンが未配置です。<br>` +
                        `制限を${Math.max(...heightBlocked.map(item => item.h)) + 14}cm以上に設定すると配置可能になります。`;
                    document.getElementById('errors').appendChild(warningDiv);
                }
            } else {
                const successDiv = document.createElement('div');
                successDiv.className = 'alert alert-success';
                successDiv.innerHTML = `🎉 高さ制限${getMaxHeightLimit()}cm以内で全カートンの配置が完了しました！`;
                document.getElementById('errors').appendChild(successDiv);
            }
            
        } catch (error) {
            console.error('計算エラー:', error);
            showErrors(['計算中にエラーが発生しました: ' + error.message]);
        } finally {
            loading.classList.remove('show');
            calculateButton.disabled = false;
        }
    }, 1000);
}

// === 結果表示UI ===
export function displayResults(pallets) {
    const resultsDiv = document.getElementById('results');
    const palletResultsDiv = document.getElementById('palletResults');
    const combineSection = document.getElementById('combineSection');
    
    resultsDiv.classList.remove('hidden');
    combineSection.classList.remove('hidden');
    
    // サマリー情報
    const summary = getCartonData().reduce((acc, item) => {
        acc.totalCartons += item.qty;
        acc.totalWeight += item.qty * item.weight;
        return acc;
    }, { totalCartons: 0, totalWeight: 0 });
    
    const placedCartons = pallets.reduce((sum, pallet) => sum + pallet.cartons.length, 0);
    const totalPalletWeight = pallets.reduce((sum, pallet) => sum + pallet.totalWeight, 0);
    
    const summaryHtml = `
        <div class="summary-card blue">
            <h3>必要パレット数</h3>
            <p>${pallets.length} 枚</p>
        </div>
        <div class="summary-card green">
            <h3>配置済み</h3>
            <p>${placedCartons}/${summary.totalCartons} 個</p>
        </div>
        <div class="summary-card purple">
            <h3>総重量</h3>
            <p>${totalPalletWeight.toFixed(1)} kg</p>
        </div>
        <div class="summary-card orange">
            <h3>効率</h3>
            <p>${((placedCartons / summary.totalCartons) * 100).toFixed(1)}%</p>
        </div>
    `;
    
    document.getElementById('resultSummary').innerHTML = summaryHtml;
    
    // 各パレットの詳細
    let palletHtml = '';
    pallets.forEach((pallet, index) => {
        const cartonCounts = pallet.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        const heightStatus = pallet.height <= getMaxHeightLimit() ? 
            '<span style="color: #16a34a;">✅ 適合</span>' : 
            '<span style="color: #dc2626;">❌ 超過</span>';
        
        palletHtml += `
            <div id="pallet-${index}" class="pallet-card">
                <div class="pallet-header">
                    <h3>パレット ${index + 1}</h3>
                    <div class="view-buttons">
                        <button class="view-btn active" onclick="showDiagramView(${index}, 'layers')">層別表示</button>
                        <button class="view-btn" onclick="showDiagramView(${index}, 'side')">側面図</button>
                    </div>
                </div>
                
                <div class="pallet-info">
                    <div class="info-grid">
                        <div><strong>パレットサイズ:</strong> ${pallet.palletSize.name}</div>
                        <div><strong>総重量:</strong> ${pallet.totalWeight.toFixed(1)} kg</div>
                        <div><strong>高さ:</strong> ${pallet.height.toFixed(1)} cm ${heightStatus}</div>
                        <div><strong>カートン数:</strong> ${pallet.cartons.length} 個</div>
                    </div>
                    
                    <div class="carton-summary">
                        <strong>貨物構成:</strong>
                        ${Object.entries(cartonCounts).map(([code, count]) => 
                            `<span class="carton-tag">${code}: ${count}個</span>`
                        ).join('')}
                    </div>
                </div>
                
                <div class="pallet-overview">
                    <canvas id="canvas-${index}" width="400" height="300"></canvas>
                </div>
                
                <div id="diagram-${index}" class="pallet-diagram">
                    <!-- 詳細図はJavaScriptで生成 -->
                </div>
            </div>
        `;
    });
    
    palletResultsDiv.innerHTML = palletHtml;
    
    // パレット結合用のセレクトボックスを更新
    updateCombineSelects(pallets);
    
    // キャンバスを描画
    setTimeout(() => {
        pallets.forEach((pallet, index) => {
            drawPalletDiagram(index, pallet);
        });
    }, 100);
}

export function buildSummaryTable(pallets) {
    const summarySection = document.getElementById('summarySection');
    const summaryBody = document.getElementById('summaryBody');
    
    summarySection.classList.remove('hidden');
    summaryBody.innerHTML = '';
    
    pallets.forEach((pallet, index) => {
        const cartonCounts = pallet.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(cartonCounts).forEach(([code, count]) => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td onclick="scrollToPallet(${index})" style="cursor: pointer; color: #2563eb; text-decoration: underline;">
                    パレット${index + 1}
                </td>
                <td>${pallet.palletSize.name}</td>
                <td>${pallet.totalWeight.toFixed(1)}</td>
                <td>${code}</td>
                <td>${count}</td>
            `;
            summaryBody.appendChild(row);
        });
    });
}

export function exportSummaryCsv() {
    const currentPallets = getCurrentPallets();
    if (!currentPallets || currentPallets.length === 0) {
        showErrors(['エクスポートする結果がありません。']);
        return;
    }
    
    const csvData = [];
    
    currentPallets.forEach((pallet, index) => {
        const cartonCounts = pallet.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        Object.entries(cartonCounts).forEach(([code, count]) => {
            csvData.push({
                palletNo: `パレット${index + 1}`,
                size: pallet.palletSize.name,
                weight: pallet.totalWeight.toFixed(1),
                code: code,
                qty: count
            });
        });
    });
    
    const headers = ['palletNo', 'size', 'weight', 'code', 'qty'];
    const csvContent = generateCSV(csvData, headers);
    
    // Add header row with Japanese labels
    const headerRow = 'パレットNo,寸法,重量(kg),貨物コード,数量';
    const fullContent = headerRow + '\n' + csvContent;
    
    const filename = getTimestampedFileName('palletization_result', 'csv');
    downloadFile(fullContent, filename, 'text/csv;charset=utf-8;');
}

// === パレット結合機能UI ===
function updateCombineSelects(pallets) {
    const pallet1Select = document.getElementById('pallet1Select');
    const pallet2Select = document.getElementById('pallet2Select');
    
    pallet1Select.innerHTML = '<option value="">選択...</option>';
    pallet2Select.innerHTML = '<option value="">選択...</option>';
    
    pallets.forEach((pallet, index) => {
        const option1 = document.createElement('option');
        option1.value = index;
        option1.textContent = `パレット${index + 1}`;
        pallet1Select.appendChild(option1);
        
        const option2 = document.createElement('option');
        option2.value = index;
        option2.textContent = `パレット${index + 1}`;
        pallet2Select.appendChild(option2);
    });
}

export function updateCombinePreview() {
    const pallet1Index = document.getElementById('pallet1Select').value;
    const pallet2Index = document.getElementById('pallet2Select').value;
    const previewDiv = document.getElementById('combinePreview');
    
    if (!pallet1Index || !pallet2Index || pallet1Index === pallet2Index) {
        previewDiv.innerHTML = '';
        return;
    }
    
    const currentPallets = getCurrentPallets();
    const pallet1 = currentPallets[parseInt(pallet1Index)];
    const pallet2 = currentPallets[parseInt(pallet2Index)];
    
    const combinedWeight = pallet1.totalWeight + pallet2.totalWeight;
    const combinedCartons = pallet1.cartons.length + pallet2.cartons.length;
    const maxHeight = Math.max(pallet1.height, pallet2.height);
    
    previewDiv.innerHTML = `
        <strong>結合プレビュー:</strong>
        重量: ${combinedWeight.toFixed(1)}kg, 
        カートン数: ${combinedCartons}個, 
        想定高さ: ~${maxHeight.toFixed(1)}cm
    `;
}

// === イベントリスナー設定 ===
export function setupEventListeners() {
    // 高さ制限
    const heightInput = document.getElementById('heightLimitInput');
    if (heightInput) {
        heightInput.addEventListener('input', updateHeightLimitFromInput);
        heightInput.addEventListener('blur', updateHeightLimitFromInput);
    }
    
    // カートン管理
    document.getElementById('addButton').addEventListener('click', toggleAddForm);
    document.getElementById('saveAddButton').addEventListener('click', addCarton);
    document.getElementById('cancelAddButton').addEventListener('click', cancelAdd);
    document.getElementById('calculateButton').addEventListener('click', executeCalculation);
    
    // インポート機能
    document.getElementById('downloadTemplateButton').addEventListener('click', downloadCSVTemplate);
    document.getElementById('importButton').addEventListener('click', toggleImportArea);
    document.getElementById('executeImportButton').addEventListener('click', executeImport);
    document.getElementById('cancelImportButton').addEventListener('click', cancelImport);
    
    // その他
    document.getElementById('clearAllButton').addEventListener('click', clearAllCartons);
    
    // エクスポート（動的に追加される場合があるので安全にチェック）
    const exportBtn = document.getElementById('exportButton');
    if (exportBtn) exportBtn.addEventListener('click', exportSummaryCsv);
    
    // パレット結合機能
    document.getElementById('pallet1Select').addEventListener('change', updateCombinePreview);
    document.getElementById('pallet2Select').addEventListener('change', updateCombinePreview);
    
    // パレット選択
    document.getElementById('selectAllPallets').addEventListener('click', selectAllPallets);
    document.getElementById('deselectAllPallets').addEventListener('click', deselectAllPallets);
}

// グローバル関数として公開（HTMLから直接呼ばれる関数）
window.setHeightLimit = setHeightLimit;
window.togglePalletSelection = togglePalletSelection;
window.startEdit = startEdit;
window.saveEdit = saveEdit;
window.cancelEdit = cancelEdit;
window.deleteCarton = deleteCarton;