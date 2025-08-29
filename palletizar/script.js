// === パレタイズ最適化計算機 - Enhanced UI/UX ===

// グローバル変数の初期化
window.currentPallets = [];

// 高さ制限のグローバル変数
let maxHeightLimit = 158; // デフォルトは158cm（パレット台座14cm含む）

// テーマ管理
let currentTheme = 'light';

// 初期データ（拡張サンプル）
let cartonData = [
    { id: 1, code: 'SAMPLE A', qty: 362, weight: 6.70, l: 53.0, w: 38.5, h: 23.5 },
    { id: 2, code: 'SAMPLE B', qty: 42, weight: 7.60, l: 55.0, w: 40.0, h: 24.0 }
];

const allPalletSizes = [
    { name: '1100×1000', width: 110.0, depth: 100.0, description: '標準パレット' },
    { name: '1100×1100', width: 110.0, depth: 110.0, description: '正方形パレット' },
    { name: '1200×1000', width: 120.0, depth: 100.0, description: '大型パレット' },
    { name: '1200×1100', width: 120.0, depth: 110.0, description: '特大パレット' },
    { name: '1200×800', width: 120.0, depth: 80.0, description: 'ISO標準・欧州' },
    { name: '1219×1016', width: 121.9, depth: 101.6, description: 'US標準・北米' },
    { name: '1140×1140', width: 114.0, depth: 114.0, description: 'アジア・コンテナ最適' }
];

let selectedPalletSizes = allPalletSizes.slice(0, 4); // デフォルトで最初の4つのみ選択

let editingId = null;
let nextId = 7;

// === 初期化関数 ===
document.addEventListener('DOMContentLoaded', function() {
    initializeTheme();
    initializePalletSelection();
    setupEnhancedEventListeners();
    startIntroAnimations();
    observeReveals();
    
    // 初期データ表示
    updateEnhancedDisplay();
});

// === テーマ管理 ===
function initializeTheme() {
    const savedTheme = localStorage.getItem('palletizar-theme') || 'light';
    currentTheme = savedTheme;
    applyTheme(savedTheme);
}

function toggleTheme() {
    currentTheme = currentTheme === 'light' ? 'dark' : 'light';
    applyTheme(currentTheme);
    localStorage.setItem('palletizar-theme', currentTheme);
}

function applyTheme(theme) {
    const body = document.body;
    const themeToggle = document.getElementById('themeToggle');
    if (!themeToggle) return;
    
    const themeIcon = themeToggle.querySelector('.theme-icon');
    const themeText = themeToggle.querySelector('.theme-text');
    
    if (theme === 'dark') {
        body.classList.add('dark');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'ライト';
    } else {
        body.classList.remove('dark');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'ダーク';
    }
}

// === パレット選択初期化 ===
function initializePalletSelection() {
    const palletOptionsContainer = document.getElementById('palletOptions');
    if (!palletOptionsContainer) return;
    
    // 既存のオプションをクリア
    palletOptionsContainer.innerHTML = '';
    
    // 最初の4つのパレットを選択済みにする
    selectedPalletSizes = allPalletSizes.slice(0, 4);
    
    allPalletSizes.forEach((pallet, index) => {
        const palletOption = document.createElement('div');
        palletOption.className = 'pallet-option';
        palletOption.onclick = () => togglePalletSelection(index);
        
        const isSelected = selectedPalletSizes.includes(pallet);
        if (isSelected) {
            palletOption.classList.add('selected');
        }
        
        palletOption.innerHTML = `
            <label>
                <input type="checkbox" ${isSelected ? 'checked' : ''} onchange="togglePalletSelection(${index})">
                <span class="pallet-name">${pallet.name}</span>
                <div class="description">${pallet.description}</div>
            </label>
        `;
        
        palletOptionsContainer.appendChild(palletOption);
    });
    
    updateSelectedPalletsInfo();
}

function togglePalletSelection(index) {
    const pallet = allPalletSizes[index];
    const palletOption = document.querySelectorAll('.pallet-option')[index];
    if (!palletOption) return;
    
    const checkbox = palletOption.querySelector('input[type="checkbox"]');
    
    if (selectedPalletSizes.includes(pallet)) {
        selectedPalletSizes = selectedPalletSizes.filter(p => p !== pallet);
        palletOption.classList.remove('selected');
        checkbox.checked = false;
    } else {
        selectedPalletSizes.push(pallet);
        palletOption.classList.add('selected');
        checkbox.checked = true;
    }
    
    updateSelectedPalletsInfo();
}

function updateSelectedPalletsInfo() {
    const selectedInfo = document.getElementById('selectedPalletsInfo');
    const selectedList = document.getElementById('selectedPalletsList');
    
    if (!selectedInfo || !selectedList) return;
    
    if (selectedPalletSizes.length > 0) {
        selectedInfo.classList.remove('hidden');
        selectedList.innerHTML = selectedPalletSizes.map(pallet => 
            `<div class="selected-pallet-item">${pallet.name} (${pallet.width}×${pallet.depth}cm)</div>`
        ).join('');
    } else {
        selectedInfo.classList.add('hidden');
    }
}

// === 拡張イベントリスナー設定 ===
function setupEnhancedEventListeners() {
    // テーマ切り替え
    const themeToggle = document.getElementById('themeToggle');
    if (themeToggle) {
        themeToggle.addEventListener('click', toggleTheme);
    }
    
    // カートン追加
    const addCartonBtn = document.getElementById('addCarton');
    if (addCartonBtn) {
        addCartonBtn.addEventListener('click', addCartonEnhanced);
    }
    
    // サンプルデータ読み込み
    const loadSampleBtn = document.getElementById('loadSample');
    if (loadSampleBtn) {
        loadSampleBtn.addEventListener('click', loadSampleDataEnhanced);
    }
    
    // 全削除
    const clearAllBtn = document.getElementById('clearAll');
    if (clearAllBtn) {
        clearAllBtn.addEventListener('click', clearAllCartonsEnhanced);
    }
    
    // 最適化開始
    const startOptimizationBtn = document.getElementById('startOptimization');
    if (startOptimizationBtn) {
        startOptimizationBtn.addEventListener('click', startOptimizationEnhanced);
    }
    
    // 高さ制限変更
    const heightLimitInput = document.getElementById('heightLimitInput');
    if (heightLimitInput) {
        heightLimitInput.addEventListener('input', updateHeightLimitEnhanced);
    }
    
    // カスタムパレット追加
    const addCustomPalletBtn = document.getElementById('addCustomPallet');
    if (addCustomPalletBtn) {
        addCustomPalletBtn.addEventListener('click', addCustomPalletEnhanced);
    }
    
    const clearCustomPalletBtn = document.getElementById('clearCustomPallet');
    if (clearCustomPalletBtn) {
        clearCustomPalletBtn.addEventListener('click', clearCustomPalletEnhanced);
    }
    
    // パレット選択アクション
    const selectAllBtn = document.getElementById('selectAll');
    if (selectAllBtn) {
        selectAllBtn.addEventListener('click', selectAllPallets);
    }
    
    const deselectAllBtn = document.getElementById('deselectAll');
    if (deselectAllBtn) {
        deselectAllBtn.addEventListener('click', deselectAllPallets);
    }
    
    const selectStandardBtn = document.getElementById('selectStandard');
    if (selectStandardBtn) {
        selectStandardBtn.addEventListener('click', selectStandardPallets);
    }
    
    // フォーム入力のリアルタイム検証
    setupFormValidation();
}

// === フォーム検証 ===
function setupFormValidation() {
    const inputs = document.querySelectorAll('.form-input');
    inputs.forEach(input => {
        input.addEventListener('blur', validateInput);
        input.addEventListener('input', clearInputError);
    });
}

function validateInput(event) {
    const input = event.target;
    const value = input.value.trim();
    
    if (input.hasAttribute('required') && !value) {
        showInputError(input, 'この項目は必須です');
        return false;
    }
    
    if (input.type === 'number') {
        const numValue = parseFloat(value);
        if (isNaN(numValue) || numValue < 0) {
            showInputError(input, '有効な数値を入力してください');
            return false;
        }
        
        if (input.hasAttribute('min') && numValue < parseFloat(input.getAttribute('min'))) {
            showInputError(input, `最小値は${input.getAttribute('min')}です`);
            return false;
        }
    }
    
    return true;
}

function showInputError(input, message) {
    clearInputError(input);
    input.classList.add('error');
    
    const errorDiv = document.createElement('div');
    errorDiv.className = 'input-error';
    errorDiv.textContent = message;
    errorDiv.style.color = 'var(--text-danger)';
    errorDiv.style.fontSize = '0.875rem';
    errorDiv.style.marginTop = '0.25rem';
    
    input.parentNode.appendChild(errorDiv);
}

function clearInputError(input) {
    input.classList.remove('error');
    const errorDiv = input.parentNode.querySelector('.input-error');
    if (errorDiv) {
        errorDiv.remove();
    }
}

// === 拡張カートン管理 ===
function addCartonEnhanced() {
    const code = document.getElementById('cartonCode')?.value?.trim();
    const qty = parseInt(document.getElementById('cartonQty')?.value);
    const weight = parseFloat(document.getElementById('cartonWeight')?.value);
    const length = parseFloat(document.getElementById('cartonLength')?.value);
    const width = parseFloat(document.getElementById('cartonWidth')?.value);
    const height = parseFloat(document.getElementById('cartonHeight')?.value);
    
    // バリデーション
    if (!code || !qty || !weight || !length || !width || !height) {
        showAlert('すべての項目を入力してください', 'error');
        return;
    }
    
    if (qty <= 0 || weight <= 0 || length <= 0 || width <= 0 || height <= 0) {
        showAlert('すべての値は0より大きい必要があります', 'error');
        return;
    }
    
    const carton = {
        id: Date.now(),
        code: code,
        qty: qty,
        weight: weight,
        l: length,
        w: width,
        h: height
    };
    
    cartonData.push(carton);
    clearCartonForm();
    updateEnhancedDisplay();
    showAlert('カートンが追加されました', 'success');
    
    // アニメーション効果
    animateCartonAddition();
}

function clearCartonForm() {
    const fields = ['cartonCode', 'cartonQty', 'cartonWeight', 'cartonLength', 'cartonWidth', 'cartonHeight'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

function loadSampleDataEnhanced() {
    cartonData = [
        { id: 1, code: 'SAMPLE A', qty: 362, weight: 6.70, l: 53.0, w: 38.5, h: 23.5 },
        { id: 2, code: 'SAMPLE B', qty: 209, weight: 8.50, l: 45.0, w: 35.0, h: 28.0 },
        { id: 3, code: 'SAMPLE C', qty: 150, weight: 12.30, l: 60.0, w: 40.0, h: 30.0 },
        { id: 4, code: 'SAMPLE D', qty: 89, weight: 15.80, l: 55.0, w: 42.0, h: 25.0 }
    ];
    
    updateEnhancedDisplay();
    showAlert('サンプルデータが読み込まれました', 'success');
    
    // アニメーション効果
    animateSampleDataLoad();
}

function clearAllCartonsEnhanced() {
    if (cartonData.length === 0) {
        showAlert('削除するデータがありません', 'warning');
        return;
    }
    
    if (confirm('すべてのカートンデータを削除しますか？')) {
        cartonData = [];
        updateEnhancedDisplay();
        showAlert('すべてのデータが削除されました', 'success');
    }
}

// === 拡張高さ制限管理 ===
function updateHeightLimitEnhanced() {
    const input = document.getElementById('heightLimitInput');
    const display = document.getElementById('heightLimitDisplay');
    const warning = document.getElementById('heightWarning');
    
    if (!input || !display) return;
    
    const newLimit = parseInt(input.value);
    if (newLimit >= 50 && newLimit <= 300) {
        maxHeightLimit = newLimit;
        display.textContent = newLimit;
        
        // 警告表示
        if (warning) {
            if (newLimit > 180) {
                warning.classList.remove('hidden');
            } else {
                warning.classList.add('hidden');
            }
        }
        
        // プリセットボタンの状態更新
        updateHeightPresetButtons(newLimit);
    }
}

function updateHeightPresetButtons(currentHeight) {
    const buttons = document.querySelectorAll('.height-preset-btn');
    buttons.forEach(btn => {
        btn.classList.remove('active');
        const heightMatch = btn.textContent.match(/\d+/);
        if (heightMatch && parseInt(heightMatch[0]) === currentHeight) {
            btn.classList.add('active');
        }
    });
}

// === 拡張カスタムパレット管理 ===
function addCustomPalletEnhanced() {
    const name = document.getElementById('customPalletName')?.value?.trim();
    const width = parseFloat(document.getElementById('customPalletWidth')?.value);
    const depth = parseFloat(document.getElementById('customPalletDepth')?.value);
    const description = document.getElementById('customPalletDesc')?.value?.trim();
    
    if (!name || !width || !depth) {
        showAlert('パレット名、幅、奥行は必須です', 'error');
        return;
    }
    
    if (width <= 0 || depth <= 0) {
        showAlert('幅と奥行は0より大きい必要があります', 'error');
        return;
    }
    
    const customPallet = {
        name: name,
        width: width,
        depth: depth,
        description: description || 'カスタムパレット'
    };
    
    allPalletSizes.push(customPallet);
    
    // UI更新
    const palletOptionsContainer = document.getElementById('palletOptions');
    if (palletOptionsContainer) {
        const index = allPalletSizes.length - 1;
        
        const palletOption = document.createElement('div');
        palletOption.className = 'pallet-option';
        palletOption.onclick = () => togglePalletSelection(index);
        
        palletOption.innerHTML = `
            <label>
                <input type="checkbox" onchange="togglePalletSelection(${index})">
                <span class="pallet-name">${customPallet.name}</span>
                <div class="description">${customPallet.description} (${customPallet.width}×${customPallet.depth}cm)</div>
            </label>
        `;
        
        palletOptionsContainer.appendChild(palletOption);
    }
    
    clearCustomPalletForm();
    showAlert('カスタムパレットが追加されました', 'success');
}

function clearCustomPalletEnhanced() {
    clearCustomPalletForm();
    showAlert('カスタムパレットフォームがクリアされました', 'info');
}

function clearCustomPalletForm() {
    const fields = ['customPalletName', 'customPalletWidth', 'customPalletDepth', 'customPalletDesc'];
    fields.forEach(fieldId => {
        const field = document.getElementById(fieldId);
        if (field) field.value = '';
    });
}

// === パレット選択アクション ===
function selectAllPallets() {
    selectedPalletSizes = [...allPalletSizes];
    updatePalletSelectionUI();
    showAlert('すべてのパレットが選択されました', 'success');
}

function deselectAllPallets() {
    selectedPalletSizes = [];
    updatePalletSelectionUI();
    showAlert('すべてのパレットの選択が解除されました', 'info');
}

function selectStandardPallets() {
    selectedPalletSizes = allPalletSizes.slice(0, 4);
    updatePalletSelectionUI();
    showAlert('標準サイズのパレットが選択されました', 'success');
}

function updatePalletSelectionUI() {
    const palletOptions = document.querySelectorAll('.pallet-option');
    palletOptions.forEach((option, index) => {
        const pallet = allPalletSizes[index];
        if (!pallet) return;
        
        const checkbox = option.querySelector('input[type="checkbox"]');
        
        if (selectedPalletSizes.includes(pallet)) {
            option.classList.add('selected');
            if (checkbox) checkbox.checked = true;
        } else {
            option.classList.remove('selected');
            if (checkbox) checkbox.checked = false;
        }
    });
    
    updateSelectedPalletsInfo();
}

// === 拡張最適化開始 ===
function startOptimizationEnhanced() {
    if (cartonData.length === 0) {
        showAlert('カートンデータがありません', 'error');
        return;
    }
    
    if (selectedPalletSizes.length === 0) {
        showAlert('パレットサイズが選択されていません', 'error');
        return;
    }
    
    // ローディング表示
    const loadingIndicator = document.getElementById('loadingIndicator');
    if (loadingIndicator) {
        loadingIndicator.classList.remove('hidden');
    }
    
    // 最適化計算（非同期で実行）
    setTimeout(() => {
        try {
            const results = findOptimalPalletConfiguration(cartonData);
            displayResults(results);
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
            showAlert('最適化計算が完了しました', 'success');
        } catch (error) {
            console.error('最適化計算エラー:', error);
            showAlert('最適化計算中にエラーが発生しました', 'error');
            if (loadingIndicator) {
                loadingIndicator.classList.add('hidden');
            }
        }
    }, 1000);
}

// === 拡張表示更新 ===
function updateEnhancedDisplay() {
    updateEnhancedCartonTable();
    updateEnhancedSummaryCards();
}

function updateEnhancedCartonTable() {
    const tbody = document.getElementById('cartonTableBody');
    if (!tbody) return;
    
    tbody.innerHTML = '';
    
    cartonData.forEach(carton => {
        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${carton.code}</td>
            <td>${carton.qty}</td>
            <td>${carton.weight.toFixed(2)}</td>
            <td>${carton.l} × ${carton.w} × ${carton.h}</td>
            <td>
                <button onclick="deleteCartonEnhanced(${carton.id})" class="btn btn-danger btn-sm">🗑️</button>
            </td>
        `;
        tbody.appendChild(row);
    });
}

function updateEnhancedSummaryCards() {
    const summaryContainer = document.getElementById('resultSummary');
    if (!summaryContainer) return;
    
    if (cartonData.length === 0) {
        summaryContainer.innerHTML = '<p class="text-center">データがありません</p>';
        return;
    }
    
    const totalCartons = cartonData.reduce((sum, carton) => sum + carton.qty, 0);
    const totalWeight = cartonData.reduce((sum, carton) => sum + (carton.weight * carton.qty), 0);
    const itemCount = cartonData.length;
    
    summaryContainer.innerHTML = `
        <div class="summary-card">
            <h3>総カートン数</h3>
            <p>${totalCartons.toLocaleString()}</p>
        </div>
        <div class="summary-card">
            <h3>総重量</h3>
            <p>${totalWeight.toFixed(1)} kg</p>
        </div>
        <div class="summary-card">
            <h3>品目数</h3>
            <p>${itemCount}</p>
        </div>
    `;
}

// === 拡張アラート表示 ===
function showAlert(message, type = 'info') {
    const alertContainer = document.getElementById('errors');
    if (!alertContainer) return;
    
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = `
        <span class="alert-icon">${getAlertIcon(type)}</span>
        ${message}
    `;
    
    alertContainer.appendChild(alertDiv);
    
    // 自動削除
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
    
    // アニメーション効果
    if (typeof anime !== 'undefined') {
        anime({
            targets: alertDiv,
            opacity: [0, 1],
            translateY: [-20, 0],
            duration: 300,
            easing: 'easeOutQuad'
        });
    }
}

function getAlertIcon(type) {
    const icons = {
        success: '✅',
        error: '❌',
        warning: '⚠️',
        info: 'ℹ️'
    };
    return icons[type] || icons.info;
}

// === アニメーション効果 ===
function startIntroAnimations() {
    if (typeof anime === 'undefined') return;
    
    // ヘッダーアニメーション
    anime({
        targets: '.header-row',
        opacity: [0, 1],
        translateY: [-30, 0],
        duration: 800,
        easing: 'easeOutQuad'
    });
    
    // カードアニメーション
    anime({
        targets: '.card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutQuad'
    });
}

function observeReveals() {
    if (typeof IntersectionObserver === 'undefined') return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('fade-in-up');
            }
        });
    }, { threshold: 0.1 });
    
    document.querySelectorAll('.card, .pallet-option, .summary-card').forEach(el => {
        observer.observe(el);
    });
}

function animateCartonAddition() {
    const lastRow = document.querySelector('#cartonTableBody tr:last-child');
    if (lastRow && typeof anime !== 'undefined') {
        anime({
            targets: lastRow,
            backgroundColor: ['rgba(59, 130, 246, 0.2)', 'transparent'],
            duration: 1000,
            easing: 'easeOutQuad'
        });
    }
}

function animateSampleDataLoad() {
    if (typeof anime === 'undefined') return;
    
    anime({
        targets: '#cartonTableBody tr',
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 400,
        delay: anime.stagger(100),
        easing: 'easeOutQuad'
    });
}

// === 拡張ユーティリティ関数 ===
function deleteCartonEnhanced(id) {
    cartonData = cartonData.filter(carton => carton.id !== id);
    updateEnhancedDisplay();
    showAlert('カートンが削除されました', 'success');
}

// Helper function for safe division