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
    { name: '1200×1100', width: 120.0, depth: 110.0, description: '特大パレット' },
    { name: '1200×800', width: 120.0, depth: 80.0, description: 'ISO標準・欧州' },
    { name: '1219×1016', width: 121.9, depth: 101.6, description: 'US標準・北米' },
    { name: '1140×1140', width: 114.0, depth: 114.0, description: 'アジア・コンテナ最適' }
];

let selectedPalletSizes = allPalletSizes.slice(0, 4); // デフォルトで最初の4つのみ選択

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
        // アクセシビリティのためのアラート
        announceToScreenReader(`高さ制限を${height}cmに設定しました。この値は一般的な輸送制限を超えています。`);
    } else {
        warning.classList.add('hidden');
        announceToScreenReader(`高さ制限を${height}cmに設定しました`);
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
            
            // スクリーンリーダーへの通知
            announceToScreenReader(`高さ制限変更により、${affectedPallets.length}枚のパレットが制限を超過しています`);
        }
    }
    
    // アニメーション効果
    if (window.anime) {
        anime({
            targets: display,
            scale: [1, 1.2, 1],
            duration: 600,
            easing: 'easeOutElastic(1, 0.5)'
        });
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

// === アクセシビリティ機能 ===
function announceToScreenReader(message) {
    // スクリーンリーダー用のアナウンス要素を作成
    const announcement = document.createElement('div');
    announcement.setAttribute('aria-live', 'polite');
    announcement.setAttribute('aria-atomic', 'true');
    announcement.className = 'sr-only';
    announcement.textContent = message;
    
    document.body.appendChild(announcement);
    
    // 少し待ってから削除
    setTimeout(() => {
        document.body.removeChild(announcement);
    }, 1000);
}

// === 初期化 ===
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
    
    // アクセシビリティの初期化
    initializeAccessibility();
});

function initializeHeightLimit() {
    const input = document.getElementById('heightLimitInput');
    if (input) {
        input.addEventListener('input', updateHeightLimitFromInput);
        input.addEventListener('blur', updateHeightLimitFromInput);
    }
}

function initializeAccessibility() {
    // キーボードナビゲーションの改善
    document.addEventListener('keydown', function(e) {
        // Ctrl + Enter で計算実行
        if (e.ctrlKey && e.key === 'Enter') {
            e.preventDefault();
            const calculateBtn = document.getElementById('calculateButton');
            if (calculateBtn && !calculateBtn.disabled) {
                calculateBtn.click();
            }
        }
        
        // Escape でフォームを閉じる
        if (e.key === 'Escape') {
            const addForm = document.getElementById('addForm');
            const importArea = document.getElementById('importArea');
            if (addForm && !addForm.classList.contains('hidden')) {
                cancelAdd();
            }
            if (importArea && !importArea.classList.contains('hidden')) {
                cancelImport();
            }
        }
    });
    
    // フォーカス管理の改善
    document.addEventListener('focusin', function(e) {
        if (e.target.classList.contains('form-input')) {
            e.target.parentElement.classList.add('focused');
        }
    });
    
    document.addEventListener('focusout', function(e) {
        if (e.target.classList.contains('form-input')) {
            e.target.parentElement.classList.remove('focused');
        }
    });
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

    // カスタムパレット機能
    document.getElementById('addCustomPallet').addEventListener('click', addCustomPallet);
    document.getElementById('clearCustomPallet').addEventListener('click', clearCustomPallet);

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
    
    // テーマアイコンの更新
    const themeIcon = document.querySelector('.theme-icon');
    const themeText = document.querySelector('.theme-text');
    
    if (themeIcon && themeText) {
        if (isDark) {
            themeIcon.textContent = '☀️';
            themeText.textContent = 'ライト';
        } else {
            themeIcon.textContent = '🌙';
            themeText.textContent = 'ダーク';
        }
    }
    
    try {
        localStorage.setItem('palletizar_theme', theme);
    } catch (_) {}
    
    // スクリーンリーダーへの通知
    announceToScreenReader(`${theme === 'dark' ? 'ダーク' : 'ライト'}テーマに切り替えました`);
}

function applyTheme(theme) {
    if (theme === 'dark') {
        document.body.classList.add('dark');
        const themeIcon = document.querySelector('.theme-icon');
        const themeText = document.querySelector('.theme-text');
        if (themeIcon) themeIcon.textContent = '☀️';
        if (themeText) themeText.textContent = 'ライト';
    } else {
        document.body.classList.remove('dark');
        const themeIcon = document.querySelector('.theme-icon');
        const themeText = document.querySelector('.theme-text');
        if (themeIcon) themeIcon.textContent = '🌙';
        if (themeText) themeText.textContent = 'ダーク';
    }
}

// === アニメーション機能 ===
function startIntroAnimations() {
    if (!window.anime) return;
    
    // ヘッダーのアニメーション
    anime({
        targets: 'h1',
        opacity: [0, 1],
        translateY: [-20, 0],
        duration: 800,
        easing: 'easeOutQuart'
    });
    
    // サマリーカードのアニメーション
    anime({
        targets: '.summary-card',
        opacity: [0, 1],
        scale: [0.8, 1],
        delay: anime.stagger(200),
        duration: 600,
        easing: 'easeOutBack(1.7)'
    });
    
    // セクションのアニメーション
    anime({
        targets: '.section',
        opacity: [0, 1],
        translateY: [30, 0],
        delay: anime.stagger(150),
        duration: 700,
        easing: 'easeOutQuart'
    });
}

function setupInteractionAnimations() {
    if (!window.anime) return;
    
    // ボタンホバーアニメーション
    document.querySelectorAll('.btn').forEach(btn => {
        btn.addEventListener('mouseenter', function() {
            anime({
                targets: this,
                scale: 1.05,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
        
        btn.addEventListener('mouseleave', function() {
            anime({
                targets: this,
                scale: 1,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
    });
    
    // フォーム入力アニメーション
    document.querySelectorAll('.form-input').forEach(input => {
        input.addEventListener('focus', function() {
            anime({
                targets: this,
                scale: 1.02,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
        
        input.addEventListener('blur', function() {
            anime({
                targets: this,
                scale: 1,
                duration: 200,
                easing: 'easeOutQuad'
            });
        });
    });
}

function observeReveals() {
    if (!window.IntersectionObserver) return;
    
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('revealed');
                if (window.anime) {
                    anime({
                        targets: entry.target,
                        opacity: [0, 1],
                        translateY: [30, 0],
                        duration: 600,
                        easing: 'easeOutQuart'
                    });
                }
                observer.unobserve(entry.target);
            }
        });
    }, {
        threshold: 0.1,
        rootMargin: '0px 0px -50px 0px'
    });
    
    // アニメーション対象の要素を監視
    document.querySelectorAll('.section, .pallet-card, .summary-card').forEach(el => {
        observer.observe(el);
    });
}

// === フォーム機能の改善 ===
function toggleAddForm() {
    const addForm = document.getElementById('addForm');
    const importArea = document.getElementById('importArea');
    
    if (addForm.classList.contains('hidden')) {
        addForm.classList.remove('hidden');
        importArea.classList.add('hidden');
        
        // フォーカスを最初の入力フィールドに移動
        setTimeout(() => {
            document.getElementById('newCode').focus();
        }, 100);
        
        // アニメーション
        if (window.anime) {
            anime({
                targets: addForm,
                opacity: [0, 1],
                translateY: [-20, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
        
        announceToScreenReader('新規追加フォームが開きました');
    } else {
        addForm.classList.add('hidden');
        announceToScreenReader('新規追加フォームを閉じました');
    }
}

function toggleImportArea() {
    const importArea = document.getElementById('importArea');
    const addForm = document.getElementById('addForm');
    
    if (importArea.classList.contains('hidden')) {
        importArea.classList.remove('hidden');
        addForm.classList.add('hidden');
        
        // フォーカスをファイル入力に移動
        setTimeout(() => {
            document.getElementById('csvFileInput').focus();
        }, 100);
        
        // アニメーション
        if (window.anime) {
            anime({
                targets: importArea,
                opacity: [0, 1],
                translateY: [-20, 0],
                duration: 300,
                easing: 'easeOutQuad'
            });
        }
        
        announceToScreenReader('CSVインポートエリアが開きました');
    } else {
        importArea.classList.add('hidden');
        announceToScreenReader('CSVインポートエリアを閉じました');
    }
}

function cancelAdd() {
    const addForm = document.getElementById('addForm');
    addForm.classList.add('hidden');
    
    // フォームをクリア
    document.getElementById('newCode').value = '';
    document.getElementById('newQty').value = '';
    document.getElementById('newWeight').value = '';
    document.getElementById('newL').value = '';
    document.getElementById('newW').value = '';
    document.getElementById('newH').value = '';
    
    announceToScreenReader('新規追加フォームをキャンセルしました');
}

function cancelImport() {
    const importArea = document.getElementById('importArea');
    importArea.classList.add('hidden');
    
    // ファイル入力をクリア
    document.getElementById('csvFileInput').value = '';
    
    announceToScreenReader('CSVインポートをキャンセルしました');
}

// === エラーハンドリングの改善 ===
function showError(message, type = 'error') {
    const errorsDiv = document.getElementById('errors');
    const alertDiv = document.createElement('div');
    
    alertDiv.className = `alert alert-${type}`;
    alertDiv.innerHTML = message;
    
    // 既存のエラーをクリア
    errorsDiv.innerHTML = '';
    errorsDiv.appendChild(alertDiv);
    
    // スクリーンリーダーへの通知
    announceToScreenReader(`エラー: ${message}`);
    
    // 自動で消える
    setTimeout(() => {
        if (alertDiv.parentNode) {
            alertDiv.remove();
        }
    }, 5000);
    
    // アニメーション
    if (window.anime) {
        anime({
            targets: alertDiv,
            opacity: [0, 1],
            translateX: [-20, 0],
            duration: 300,
            easing: 'easeOutQuad'
        });
    }
}

function showSuccess(message) {
    showError(message, 'success');
    announceToScreenReader(`成功: ${message}`);
}

function showWarning(message) {
    showError(message, 'warning');
    announceToScreenReader(`警告: ${message}`);
}

// === データ管理の改善 ===
function addCarton() {
    const code = document.getElementById('newCode').value.trim();
    const qty = parseInt(document.getElementById('newQty').value);
    const weight = parseFloat(document.getElementById('newWeight').value);
    const l = parseFloat(document.getElementById('newL').value);
    const w = parseFloat(document.getElementById('newW').value);
    const h = parseFloat(document.getElementById('newH').value);
    
    // バリデーション
    if (!code || !qty || !weight || !l || !w || !h) {
        showError('すべてのフィールドを入力してください');
        return;
    }
    
    if (qty <= 0 || weight <= 0 || l <= 0 || w <= 0 || h <= 0) {
        showError('すべての値は0より大きい必要があります');
        return;
    }
    
    if (h > getMaxCartonHeight()) {
        showWarning(`高さ${h}cmは設定された制限${getMaxCartonHeight()}cmを超えています`);
    }
    
    const newCarton = {
        id: nextId++,
        code: code,
        qty: qty,
        weight: weight,
        l: l,
        w: w,
        h: h
    };
    
    cartonData.push(newCarton);
    updateTable();
    updateSummary();
    
    // フォームを閉じる
    cancelAdd();
    
    showSuccess(`貨物コード ${code} を追加しました`);
    
    // アニメーション
    if (window.anime) {
        anime({
            targets: '.summary-card',
            scale: [1, 1.1, 1],
            duration: 600,
            easing: 'easeOutElastic(1, 0.5)'
        });
    }
}

function clearAllCartons() {
    if (cartonData.length === 0) {
        showWarning('削除するデータがありません');
        return;
    }
    
    if (confirm('すべての貨物データを削除しますか？この操作は元に戻せません。')) {
        cartonData = [];
        updateTable();
        updateSummary();
        
        showSuccess('すべての貨物データを削除しました');
        announceToScreenReader('すべての貨物データを削除しました');
        
        // 結果表示をクリア
        const results = document.getElementById('results');
        if (results) {
            results.classList.add('hidden');
        }
    }
}

// === パレット選択機能の改善 ===
function initializePalletSelection() {
    const palletOptions = document.getElementById('palletOptions');
    palletOptions.innerHTML = '';
    
    allPalletSizes.forEach((pallet, index) => {
        const option = document.createElement('div');
        option.className = 'pallet-option';
        if (selectedPalletSizes.includes(pallet)) {
            option.classList.add('selected');
        }
        
        option.innerHTML = `
            <input type="checkbox" class="pallet-checkbox" 
                   id="pallet-${index}" 
                   ${selectedPalletSizes.includes(pallet) ? 'checked' : ''}>
            <div class="pallet-option-info">
                <div class="pallet-option-name">${pallet.name}</div>
                <div class="pallet-option-size">${pallet.description}</div>
            </div>
        `;
        
        option.addEventListener('click', function(e) {
            if (e.target.type !== 'checkbox') {
                const checkbox = this.querySelector('.pallet-checkbox');
                checkbox.checked = !checkbox.checked;
            }
            
            const checkbox = this.querySelector('.pallet-checkbox');
            if (checkbox.checked) {
                this.classList.add('selected');
                if (!selectedPalletSizes.includes(pallet)) {
                    selectedPalletSizes.push(pallet);
                }
            } else {
                this.classList.remove('selected');
                selectedPalletSizes = selectedPalletSizes.filter(p => p !== pallet);
            }
            
            updateSelectedPalletsInfo();
            
            // アニメーション
            if (window.anime) {
                anime({
                    targets: this,
                    scale: [1, 1.05, 1],
                    duration: 300,
                    easing: 'easeOutQuad'
                });
            }
        });
        
        palletOptions.appendChild(option);
    });
    
    updateSelectedPalletsInfo();
}

function updateSelectedPalletsInfo() {
    const info = document.getElementById('selectedPalletsInfo');
    if (info) {
        info.textContent = `${selectedPalletSizes.length}種類のパレットが選択されています`;
    }
}

function selectAllPallets() {
    selectedPalletSizes = [...allPalletSizes];
    document.querySelectorAll('.pallet-option').forEach(option => {
        option.classList.add('selected');
        option.querySelector('.pallet-checkbox').checked = true;
    });
    updateSelectedPalletsInfo();
    showSuccess('すべてのパレットを選択しました');
}

function deselectAllPallets() {
    selectedPalletSizes = [];
    document.querySelectorAll('.pallet-option').forEach(option => {
        option.classList.remove('selected');
        option.querySelector('.pallet-checkbox').checked = false;
    });
    updateSelectedPalletsInfo();
    showSuccess('すべてのパレットの選択を解除しました');
}

// === カスタムパレット機能 ===
function addCustomPallet() {
    const name = document.getElementById('customPalletName').value.trim();
    const width = parseFloat(document.getElementById('customPalletWidth').value);
    const depth = parseFloat(document.getElementById('customPalletDepth').value);
    const desc = document.getElementById('customPalletDesc').value.trim();
    
    if (!name || !width || !depth) {
        showError('パレット名、幅、奥行は必須です');
        return;
    }
    
    if (width <= 0 || depth <= 0) {
        showError('幅と奥行は0より大きい必要があります');
        return;
    }
    
    const customPallet = {
        name: name,
        width: width,
        depth: depth,
        description: desc || 'カスタムパレット'
    };
    
    allPalletSizes.push(customPallet);
    selectedPalletSizes.push(customPallet);
    
    // パレット選択を再初期化
    initializePalletSelection();
    
    // フォームをクリア
    clearCustomPallet();
    
    showSuccess(`カスタムパレット ${name} を追加しました`);
}

function clearCustomPallet() {
    document.getElementById('customPalletName').value = '';
    document.getElementById('customPalletWidth').value = '';
    document.getElementById('customPalletDepth').value = '';
    document.getElementById('customPalletDesc').value = '';
}

// === 計算機能の改善 ===
function calculateImprovedPalletization() {
    if (cartonData.length === 0) {
        showError('貨物データがありません。まず貨物データを追加してください。');
        return;
    }
    
    if (selectedPalletSizes.length === 0) {
        showError('パレットサイズが選択されていません。パレットサイズを選択してください。');
        return;
    }
    
    // ローディング表示
    const loading = document.getElementById('loading');
    loading.classList.add('show');
    
    // 計算ボタンを無効化
    const calculateBtn = document.getElementById('calculateButton');
    calculateBtn.disabled = true;
    calculateBtn.textContent = '計算中...';
    
    // 非同期で計算を実行（UIブロッキングを防ぐ）
    setTimeout(() => {
        try {
            const result = performPalletizationCalculation();
            displayResults(result);
            
            showSuccess('パレタイズ計算が完了しました');
            announceToScreenReader('パレタイズ計算が完了しました');
            
            // 結果表示のアニメーション
            if (window.anime) {
                anime({
                    targets: '#results',
                    opacity: [0, 1],
                    translateY: [30, 0],
                    duration: 600,
                    easing: 'easeOutQuart'
                });
            }
        } catch (error) {
            console.error('計算エラー:', error);
            showError('計算中にエラーが発生しました: ' + error.message);
        } finally {
            // ローディングを非表示
            loading.classList.remove('show');
            
            // 計算ボタンを有効化
            calculateBtn.disabled = false;
            calculateBtn.textContent = '🔢 パレタイズ計算を実行';
        }
    }, 100);
}

// === 結果表示の改善 ===
function displayResults(result) {
    const resultsDiv = document.getElementById('results');
    resultsDiv.classList.remove('hidden');
    
    // 結果サマリーの更新
    updateResultSummary(result);
    
    // パレット結果の表示
    displayPalletResults(result.pallets);
    
    // パレット結合機能の表示
    if (result.pallets.length > 1) {
        displayCombineSection(result.pallets);
    }
    
    // サマリーテーブルの表示
    displaySummaryTable(result.pallets);
    
    // 結果セクションにスクロール
    resultsDiv.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

// === その他の機能 ===
function downloadCSVTemplate() {
    const csvContent = '貨物コード,数量,重量(kg),長さ(cm),幅(cm),高さ(cm)\nSAMPLE,100,5.5,50.0,30.0,20.0';
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = 'palletizar_template.csv';
    link.click();
    
    showSuccess('CSVテンプレートをダウンロードしました');
}

function executeImport() {
    const fileInput = document.getElementById('csvFileInput');
    const file = fileInput.files[0];
    
    if (!file) {
        showError('ファイルが選択されていません');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const lines = csv.split('\n');
            const importedData = [];
            
            for (let i = 1; i < lines.length; i++) { // ヘッダーをスキップ
                const line = lines[i].trim();
                if (line) {
                    const values = line.split(',');
                    if (values.length >= 6) {
                        const carton = {
                            id: nextId++,
                            code: values[0].trim(),
                            qty: parseInt(values[1]),
                            weight: parseFloat(values[2]),
                            l: parseFloat(values[3]),
                            w: parseFloat(values[4]),
                            h: parseFloat(values[5])
                        };
                        
                        if (carton.qty > 0 && carton.weight > 0 && carton.l > 0 && carton.w > 0 && carton.h > 0) {
                            importedData.push(carton);
                        }
                    }
                }
            }
            
            if (importedData.length > 0) {
                cartonData = [...cartonData, ...importedData];
                updateTable();
                updateSummary();
                
                showSuccess(`${importedData.length}件のデータをインポートしました`);
                announceToScreenReader(`${importedData.length}件のデータをインポートしました`);
                
                // インポートエリアを閉じる
                cancelImport();
            } else {
                showError('有効なデータが見つかりませんでした');
            }
        } catch (error) {
            console.error('インポートエラー:', error);
            showError('CSVファイルの読み込みに失敗しました');
        }
    };
    
    reader.readAsText(file);
}

// === テーブル更新 ===
function updateTable() {
    const tbody = document.getElementById('cartonTableBody');
    tbody.innerHTML = '';
    
    cartonData.forEach(carton => {
        const row = document.createElement('tr');
        const volume = (carton.l * carton.w * carton.h) / 1000000; // cm³ to m³
        
        row.innerHTML = `
            <td class="mono">${carton.code}</td>
            <td class="center">${carton.qty}</td>
            <td class="center">${carton.weight.toFixed(2)}</td>
            <td class="center">${carton.l.toFixed(1)}</td>
            <td class="center">${carton.w.toFixed(1)}</td>
            <td class="center">${carton.h.toFixed(1)}</td>
            <td class="center mono">${volume.toFixed(3)}</td>
            <td class="center">
                <div class="action-buttons">
                    <button class="btn btn-secondary btn-sm" onclick="editCarton(${carton.id})" aria-label="編集">
                        ✏️
                    </button>
                    <button class="btn btn-danger btn-sm" onclick="deleteCarton(${carton.id})" aria-label="削除">
                        🗑️
                    </button>
                </div>
            </td>
        `;
        
        tbody.appendChild(row);
    });
}

// === サマリー更新 ===
function updateSummary() {
    const totalCartons = cartonData.reduce((sum, carton) => sum + carton.qty, 0);
    const totalWeight = cartonData.reduce((sum, carton) => sum + (carton.weight * carton.qty), 0);
    const itemCount = cartonData.length;
    
    document.getElementById('totalCartons').textContent = totalCartons.toLocaleString();
    document.getElementById('totalWeight').textContent = totalWeight.toFixed(2) + ' kg';
    document.getElementById('itemCount').textContent = itemCount;
    
    // アクセシビリティのためのaria-label更新
    document.getElementById('totalCartons').setAttribute('aria-label', `総カートン数: ${totalCartons.toLocaleString()}`);
    document.getElementById('totalWeight').setAttribute('aria-label', `総重量: ${totalWeight.toFixed(2)} kg`);
    document.getElementById('itemCount').setAttribute('aria-label', `品目数: ${itemCount}`);
}

// === 編集・削除機能 ===
function editCarton(id) {
    const carton = cartonData.find(c => c.id === id);
    if (!carton) return;
    
    editingId = id;
    
    // フォームに値を設定
    document.getElementById('newCode').value = carton.code;
    document.getElementById('newQty').value = carton.qty;
    document.getElementById('newWeight').value = carton.weight;
    document.getElementById('newL').value = carton.l;
    document.getElementById('newW').value = carton.w;
    document.getElementById('newH').value = carton.h;
    
    // フォームを開く
    toggleAddForm();
    
    // ボタンテキストを変更
    const saveBtn = document.getElementById('saveAddButton');
    saveBtn.textContent = '💾 更新';
    
    announceToScreenReader(`貨物コード ${carton.code} を編集モードにしました`);
}

function deleteCarton(id) {
    const carton = cartonData.find(c => c.id === id);
    if (!carton) return;
    
    if (confirm(`貨物コード ${carton.code} を削除しますか？`)) {
        cartonData = cartonData.filter(c => c.id !== id);
        updateTable();
        updateSummary();
        
        showSuccess(`貨物コード ${carton.code} を削除しました`);
        announceToScreenReader(`貨物コード ${carton.code} を削除しました`);
    }
}

// === パレタイズ計算の実装（完全版） ===
function performPalletizationCalculation() {
    console.log('パレタイズ計算開始...');
    
    // 貨物データの前処理
    const processedCartons = preprocessCartonData(cartonData);
    console.log('前処理済み貨物データ:', processedCartons);
    
    // パレットサイズごとの最適化計算
    const palletResults = [];
    
    selectedPalletSizes.forEach(palletSize => {
        console.log(`${palletSize.name}での計算開始...`);
        
        const result = findOptimalPalletConfiguration(
            processedCartons,
            palletSize,
            maxHeightLimit
        );
        
        if (result && result.pallets.length > 0) {
            palletResults.push({
                palletSize: palletSize,
                result: result
            });
        }
    });
    
    // 最適な結果を選択
    const bestResult = selectBestResult(palletResults);
    
    if (!bestResult) {
        throw new Error('有効なパレット配置が見つかりませんでした');
    }
    
    console.log('最適な結果:', bestResult);
    return bestResult;
}

// === 貨物データの前処理 ===
function preprocessCartonData(cartons) {
    return cartons.map(carton => ({
        ...carton,
        volume: carton.l * carton.w * carton.h,
        area: carton.l * carton.w,
        aspectRatio: Math.max(carton.l, carton.w) / Math.min(carton.l, carton.w)
    }));
}

// === 最適なパレット配置の検索 ===
function findOptimalPalletConfiguration(cartons, palletSize, maxHeight) {
    const results = [];
    
    // 小数量混合パレットの計算
    const smallQuantityResult = calculateSmallQuantityMixedPallet(cartons, palletSize, maxHeight);
    if (smallQuantityResult) {
        results.push({
            type: 'small_quantity_mixed',
            score: calculatePalletScore(smallQuantityResult),
            result: smallQuantityResult
        });
    }
    
    // 大数量専用パレットの計算
    const largeQuantityResult = calculateLargeQuantityDedicatedPallet(cartons, palletSize, maxHeight);
    if (largeQuantityResult) {
        results.push({
            type: 'large_quantity_dedicated',
            score: calculatePalletScore(largeQuantityResult),
            result: largeQuantityResult
        });
    }
    
    // バランス型パレットの計算
    const balancedResult = calculateBalancedPallet(cartons, palletSize, maxHeight);
    if (balancedResult) {
        results.push({
            type: 'balanced',
            score: calculatePalletScore(balancedResult),
            result: balancedResult
        });
    }
    
    // 最高スコアの結果を返す
    if (results.length === 0) return null;
    
    const bestResult = results.reduce((best, current) => 
        current.score > best.score ? current : best
    );
    
    return bestResult.result;
}

// === 小数量混合パレットの計算 ===
function calculateSmallQuantityMixedPallet(cartons, palletSize, maxHeight) {
    const pallets = [];
    let remainingCartons = [...cartons];
    
    while (remainingCartons.length > 0) {
        const pallet = {
            id: pallets.length + 1,
            width: palletSize.width,
            depth: palletSize.depth,
            height: 0,
            weight: 0,
            items: [],
            layers: []
        };
        
        let currentHeight = 0;
        let currentLayer = [];
        let layerHeight = 0;
        
        // 貨物を1つずつ配置
        for (let i = 0; i < remainingCartons.length; i++) {
            const carton = remainingCartons[i];
            
            if (currentHeight + carton.h <= maxHeight) {
                // レイヤー内での配置チェック
                if (canFitInLayer(currentLayer, carton, palletSize)) {
                    currentLayer.push(carton);
                    layerHeight = Math.max(layerHeight, carton.h);
                    currentHeight += carton.h;
                    
                    // 貨物を削除
                    remainingCartons.splice(i, 1);
                    i--;
                }
            }
        }
        
        if (currentLayer.length > 0) {
            pallet.layers.push({
                items: currentLayer,
                height: layerHeight
            });
            pallet.height = currentHeight;
            pallet.weight = currentLayer.reduce((sum, c) => sum + (c.weight * c.qty), 0);
            pallet.items = currentLayer;
            pallets.push(pallet);
        }
    }
    
    return pallets.length > 0 ? { pallets, totalPallets: pallets.length } : null;
}

// === 大数量専用パレットの計算 ===
function calculateLargeQuantityDedicatedPallet(cartons, palletSize, maxHeight) {
    const pallets = [];
    
    cartons.forEach(carton => {
        if (carton.qty >= 100) { // 大数量の閾値
            const palletsNeeded = Math.ceil(carton.qty / 50); // 1パレットあたり50個
            
            for (let i = 0; i < palletsNeeded; i++) {
                const pallet = {
                    id: pallets.length + 1,
                    width: palletSize.width,
                    depth: palletSize.depth,
                    height: carton.h,
                    weight: carton.weight * Math.min(50, carton.qty - i * 50),
                    items: [carton],
                    layers: [{
                        items: [carton],
                        height: carton.h
                    }]
                };
                pallets.push(pallet);
            }
        }
    });
    
    return pallets.length > 0 ? { pallets, totalPallets: pallets.length } : null;
}

// === バランス型パレットの計算 ===
function calculateBalancedPallet(cartons, palletSize, maxHeight) {
    const pallets = [];
    let remainingCartons = [...cartons];
    
    while (remainingCartons.length > 0) {
        const pallet = {
            id: pallets.length + 1,
            width: palletSize.width,
            depth: palletSize.depth,
            height: 0,
            weight: 0,
            items: [],
            layers: []
        };
        
        let currentHeight = 0;
        let currentLayer = [];
        let layerHeight = 0;
        
        // 貨物を効率的に配置
        const sortedCartons = remainingCartons.sort((a, b) => b.volume - a.volume);
        
        for (let i = 0; i < sortedCartons.length; i++) {
            const carton = sortedCartons[i];
            
            if (currentHeight + carton.h <= maxHeight) {
                if (canFitInLayer(currentLayer, carton, palletSize)) {
                    currentLayer.push(carton);
                    layerHeight = Math.max(layerHeight, carton.h);
                    currentHeight += carton.h;
                    
                    // 貨物を削除
                    remainingCartons = remainingCartons.filter(c => c !== carton);
                    break;
                }
            }
        }
        
        if (currentLayer.length > 0) {
            pallet.layers.push({
                items: currentLayer,
                height: layerHeight
            });
            pallet.height = currentHeight;
            pallet.weight = currentLayer.reduce((sum, c) => sum + (c.weight * c.qty), 0);
            pallet.items = currentLayer;
            pallets.push(pallet);
        }
    }
    
    return pallets.length > 0 ? { pallets, totalPallets: pallets.length } : null;
}

// === レイヤー内での配置チェック ===
function canFitInLayer(layer, carton, palletSize) {
    // 簡易的な配置チェック（実際の実装ではより複雑なアルゴリズムが必要）
    const totalArea = layer.reduce((sum, c) => sum + c.area, 0) + carton.area;
    const palletArea = palletSize.width * palletSize.depth;
    
    return totalArea <= palletArea * 0.9; // 90%の面積使用率
}

// === パレットスコアの計算 ===
function calculatePalletScore(result) {
    if (!result || !result.pallets) return 0;
    
    let score = 0;
    
    result.pallets.forEach(pallet => {
        // 高さ効率
        const heightEfficiency = pallet.height / maxHeightLimit;
        score += heightEfficiency * 10;
        
        // 重量効率
        const weightEfficiency = pallet.weight / 1000; // 1トン基準
        score += Math.min(weightEfficiency, 1) * 5;
        
        // 貨物数効率
        const itemEfficiency = pallet.items.length / 10; // 10個基準
        score += Math.min(itemEfficiency, 1) * 3;
    });
    
    // パレット数が少ないほど高スコア
    score += (10 - result.totalPallets) * 2;
    
    return score;
}

// === 最適な結果の選択 ===
function selectBestResult(results) {
    if (results.length === 0) return null;
    
    // スコアが最も高い結果を選択
    const bestResult = results.reduce((best, current) => {
        const currentScore = current.result.score || 0;
        const bestScore = best.result.score || 0;
        return currentScore > bestScore ? current : best;
    });
    
    return bestResult.result;
}

// === 結果表示の実装（完全版） ===
function updateResultSummary(result) {
    const summaryDiv = document.getElementById('resultSummary');
    
    // 総重量の計算
    const totalWeight = result.pallets.reduce((sum, pallet) => sum + pallet.weight, 0);
    
    summaryDiv.innerHTML = `
        <div class="summary-card orange">
            <h3>使用パレット数</h3>
            <p>${result.totalPallets}</p>
        </div>
        <div class="summary-card green">
            <h3>総重量</h3>
            <p>${totalWeight.toFixed(2)} kg</p>
        </div>
        <div class="summary-card blue">
            <h3>平均高さ</h3>
            <p>${(result.pallets.reduce((sum, p) => sum + p.height, 0) / result.pallets.length).toFixed(1)} cm</p>
        </div>
    `;
}

function displayPalletResults(pallets) {
    const resultsDiv = document.getElementById('palletResults');
    resultsDiv.innerHTML = '';
    
    pallets.forEach((pallet, index) => {
        const palletDiv = document.createElement('div');
        palletDiv.className = 'pallet-card';
        palletDiv.id = `pallet-${pallet.id}`;
        
        palletDiv.innerHTML = `
            <h3>パレット ${pallet.id}</h3>
            <div class="pallet-grid">
                <div class="pallet-stat">
                    <p>寸法</p>
                    <p>${pallet.width} × ${pallet.depth} × ${pallet.height} cm</p>
                </div>
                <div class="pallet-stat">
                    <p>重量</p>
                    <p>${pallet.weight.toFixed(2)} kg</p>
                </div>
                <div class="pallet-stat">
                    <p>品目数</p>
                    <p>${pallet.items.length}</p>
                </div>
            </div>
            <div class="pallet-details">
                <p>積載貨物:</p>
                <div class="cargo-list">
                    ${pallet.items.map(item => `
                        <div class="cargo-item">
                            <span class="cargo-code">${item.code}</span>
                            <span>${item.qty}個</span>
                        </div>
                    `).join('')}
                </div>
            </div>
            
            <!-- パレット図面セクション -->
            <div class="diagram-container">
                <div class="diagram-tabs">
                    <button class="diagram-tab active" onclick="switchDiagramTab(this, 'top-${pallet.id}')">上面図</button>
                    <button class="diagram-tab" onclick="switchDiagramTab(this, 'side-${pallet.id}')">側面図</button>
                    <button class="diagram-tab" onclick="switchDiagramTab(this, 'detail-${pallet.id}')">レイヤー詳細</button>
                </div>
                
                <div class="diagram-content">
                    <canvas id="top-${pallet.id}" class="pallet-canvas active"></canvas>
                    <canvas id="side-${pallet.id}" class="pallet-canvas"></canvas>
                    <canvas id="detail-${pallet.id}" class="pallet-canvas"></canvas>
                </div>
            </div>
        `;
        
        resultsDiv.appendChild(palletDiv);
        
        // 図面の描画
        setTimeout(() => {
            drawPalletDiagram(pallet, `top-${pallet.id}`);
            drawSideView(pallet, `side-${pallet.id}`);
            drawLayersDetail(pallet, `detail-${pallet.id}`);
            
            // キャンバスイベントの設定
            bindLayerCanvasEvents(`detail-${pallet.id}`);
            applyCanvasParallax(`detail-${pallet.id}`);
        }, 100);
    });
}

function displayCombineSection(pallets) {
    const combineSection = document.getElementById('combineSection');
    if (combineSection) {
        combineSection.classList.remove('hidden');
        
        // セレクトボックスの更新
        const pallet1Select = document.getElementById('pallet1Select');
        const pallet2Select = document.getElementById('pallet2Select');
        
        pallet1Select.innerHTML = '<option value="">選択...</option>';
        pallet2Select.innerHTML = '<option value="">選択...</option>';
        
        pallets.forEach(pallet => {
            const option1 = document.createElement('option');
            option1.value = pallet.id;
            option1.textContent = `パレット ${pallet.id}`;
            pallet1Select.appendChild(option1);
            
            const option2 = document.createElement('option');
            option2.value = pallet.id;
            option2.textContent = `パレット ${pallet.id}`;
            pallet2Select.appendChild(option2);
        });
    }
}

function displaySummaryTable(pallets) {
    const summarySection = document.getElementById('summarySection');
    const summaryBody = document.getElementById('summaryBody');
    
    if (summarySection && summaryBody) {
        summarySection.classList.remove('hidden');
        summaryBody.innerHTML = '';
        
        pallets.forEach(pallet => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td><span class="pallet-link" onclick="scrollToPallet(${pallet.id})">パレット ${pallet.id}</span></td>
                <td>${pallet.width} × ${pallet.depth} × ${pallet.height}</td>
                <td>${pallet.weight.toFixed(2)}</td>
                <td>${pallet.items.map(item => item.code).join(', ')}</td>
                <td>${pallet.items.reduce((sum, item) => sum + item.qty, 0)}</td>
            `;
            summaryBody.appendChild(row);
        });
    }
}

// === パレット結合機能 ===
function combinePallets() {
    const pallet1Id = document.getElementById('pallet1Select').value;
    const pallet2Id = document.getElementById('pallet2Select').value;
    
    if (!pallet1Id || !pallet2Id) {
        showError('2つのパレットを選択してください');
        return;
    }
    
    if (pallet1Id === pallet2Id) {
        showError('異なるパレットを選択してください');
        return;
    }
    
    showSuccess('パレット結合機能は開発中です');
}

function autoOptimizePallets() {
    showSuccess('自動最適化機能は開発中です');
}

function analyzeSelectedPallets() {
    const pallet1Id = document.getElementById('pallet1Select').value;
    const pallet2Id = document.getElementById('pallet2Select').value;
    
    if (!pallet1Id || !pallet2Id) {
        showError('2つのパレットを選択してください');
        return;
    }
    
    showSuccess('詳細分析機能は開発中です');
}

function updateCombinePreview() {
    const pallet1Id = document.getElementById('pallet1Select').value;
    const pallet2Id = document.getElementById('pallet2Select').value;
    const preview = document.getElementById('combinePreview');
    
    if (pallet1Id && pallet2Id) {
        preview.textContent = `パレット ${pallet1Id} と パレット ${pallet2Id} の結合を分析中...`;
    } else {
        preview.textContent = '';
    }
}

// === ユーティリティ関数 ===
function scrollToPallet(palletId) {
    const palletElement = document.getElementById(`pallet-${palletId}`);
    if (palletElement) {
        palletElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        
        // ハイライト効果
        if (window.anime) {
            anime({
                targets: palletElement,
                backgroundColor: ['rgba(96, 165, 250, 0.2)', 'rgba(96, 165, 250, 0)'],
                duration: 2000,
                easing: 'easeOutQuad'
            });
        }
    }
}

function exportSummaryCsv() {
    if (!window.currentPallets || window.currentPallets.length === 0) {
        showError('エクスポートするデータがありません');
        return;
    }
    
    let csvContent = 'パレットNo,寸法(cm),重量(kg),貨物コード,数量\n';
    
    window.currentPallets.forEach(pallet => {
        pallet.items.forEach(item => {
            csvContent += `${pallet.id},${pallet.width}×${pallet.depth}×${pallet.height},${pallet.weight.toFixed(2)},${item.code},${item.qty}\n`;
        });
    });
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `palletizar_results_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    
    showSuccess('結果をCSVでエクスポートしました');
}

// === パレット図面描画機能 ===
function drawPalletDiagram(pallet, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    // キャンバスのサイズ設定
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    // 背景をクリア
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // パレットの基本寸法
    const palletWidth = canvas.width * 0.8;
    const palletHeight = canvas.height * 0.6;
    const startX = (canvas.width - palletWidth) / 2;
    const startY = (canvas.height - palletHeight) / 2;
    
    // パレットの描画
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(startX, startY, palletWidth, palletHeight);
    
    // 貨物の描画
    let currentY = startY;
    pallet.layers.forEach((layer, layerIndex) => {
        const layerHeight = (layer.height / pallet.height) * palletHeight;
        
        layer.items.forEach((item, itemIndex) => {
            const itemWidth = (item.l / pallet.width) * palletWidth;
            const itemHeight = (item.h / pallet.height) * palletHeight;
            const itemX = startX + (itemIndex * itemWidth * 0.1);
            const itemY = currentY;
            
            // 貨物の色をランダムに設定
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
            ctx.fillStyle = colors[itemIndex % colors.length];
            
            ctx.fillRect(itemX, itemY, itemWidth, itemHeight);
            
            // 貨物のラベル
            ctx.fillStyle = '#000';
            ctx.font = '12px Arial';
            ctx.fillText(item.code, itemX + 5, itemY + 15);
            ctx.fillText(`${item.qty}個`, itemX + 5, itemY + 30);
        });
        
        currentY += layerHeight;
    });
    
    // パレットのラベル
    ctx.fillStyle = '#000';
    ctx.font = '14px Arial';
    ctx.fillText(`パレット ${pallet.id}`, startX, startY - 10);
    ctx.fillText(`${pallet.width} × ${pallet.depth} × ${pallet.height} cm`, startX, startY + palletHeight + 20);
}

// === 側面図の描画 ===
function drawSideView(pallet, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const viewWidth = canvas.width * 0.8;
    const viewHeight = canvas.height * 0.7;
    const startX = (canvas.width - viewWidth) / 2;
    const startY = (canvas.height - viewHeight) / 2;
    
    // パレットの側面
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(startX, startY + viewHeight - 20, viewWidth, 20);
    
    // 貨物の積層
    let currentY = startY + viewHeight - 20;
    pallet.layers.forEach((layer, layerIndex) => {
        const layerHeight = (layer.height / pallet.height) * viewHeight;
        currentY -= layerHeight;
        
        ctx.fillStyle = '#FF6B6B';
        ctx.fillRect(startX, currentY, viewWidth, layerHeight);
        
        // レイヤー情報
        ctx.fillStyle = '#000';
        ctx.font = '12px Arial';
        ctx.fillText(`レイヤー ${layerIndex + 1}: ${layer.height}cm`, startX + 5, currentY + 15);
    });
    
    // 寸法線
    ctx.strokeStyle = '#000';
    ctx.lineWidth = 1;
    
    // 高さの寸法線
    ctx.beginPath();
    ctx.moveTo(startX - 10, startY);
    ctx.lineTo(startX - 10, startY + viewHeight);
    ctx.stroke();
    
    ctx.fillText(`${pallet.height} cm`, startX - 50, startY + viewHeight / 2);
}

// === レイヤー詳細の描画 ===
function drawLayersDetail(pallet, canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    const rect = canvas.getBoundingClientRect();
    
    canvas.width = rect.width;
    canvas.height = rect.height;
    
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const itemSize = 40;
    const startX = 20;
    const startY = 20;
    
    let currentX = startX;
    let currentY = startY;
    
    pallet.layers.forEach((layer, layerIndex) => {
        // レイヤーラベル
        ctx.fillStyle = '#333';
        ctx.font = '14px Arial';
        ctx.fillText(`レイヤー ${layerIndex + 1}`, currentX, currentY - 5);
        
        layer.items.forEach((item, itemIndex) => {
            const x = currentX + (itemIndex * (itemSize + 10));
            const y = currentY;
            
            // 貨物の描画
            const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7'];
            ctx.fillStyle = colors[itemIndex % colors.length];
            ctx.fillRect(x, y, itemSize, itemSize);
            
            // 貨物情報
            ctx.fillStyle = '#000';
            ctx.font = '10px Arial';
            ctx.fillText(item.code, x + 2, y + 12);
            ctx.fillText(`${item.qty}個`, x + 2, y + 25);
            ctx.fillText(`${item.l}×${item.w}`, x + 2, y + 38);
        });
        
        currentY += itemSize + 30;
    });
}

// === キャンバスイベントの設定 ===
function bindLayerCanvasEvents(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    let isHovering = false;
    let hoveredItem = null;
    
    canvas.addEventListener('mousemove', (e) => {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        
        // 貨物のホバー検出（簡易版）
        if (x > 20 && x < 60 && y > 20 && y < 60) {
            if (!isHovering) {
                isHovering = true;
                canvas.style.cursor = 'pointer';
                animateCartonHover(canvas, true);
            }
        } else {
            if (isHovering) {
                isHovering = false;
                canvas.style.cursor = 'default';
                animateCartonHover(canvas, false);
            }
        }
    });
    
    canvas.addEventListener('click', (e) => {
        if (isHovering) {
            // 貨物の詳細情報を表示
            showCartonDetails(hoveredItem);
        }
    });
}

// === 貨物ホバーアニメーション ===
function animateCartonHover(canvas, isHovering) {
    if (!window.anime) return;
    
    anime({
        targets: canvas,
        scale: isHovering ? 1.05 : 1,
        duration: 200,
        easing: 'easeOutQuad'
    });
}

// === 貨物詳細表示 ===
function showCartonDetails(carton) {
    if (!carton) return;
    
    const detailsDiv = document.createElement('div');
    detailsDiv.className = 'carton-details-modal';
    detailsDiv.innerHTML = `
        <div class="modal-content">
            <h3>貨物詳細: ${carton.code}</h3>
            <p>数量: ${carton.qty}個</p>
            <p>重量: ${carton.weight} kg</p>
            <p>寸法: ${carton.l} × ${carton.w} × ${carton.h} cm</p>
            <button onclick="this.parentElement.parentElement.remove()">閉じる</button>
        </div>
    `;
    
    document.body.appendChild(detailsDiv);
}

// === 図面タブ切替機能 ===
function switchDiagramTab(button, canvasId) {
    // タブのアクティブ状態を更新
    const tabContainer = button.parentElement;
    tabContainer.querySelectorAll('.diagram-tab').forEach(tab => {
        tab.classList.remove('active');
    });
    button.classList.add('active');
    
    // キャンバスの表示/非表示を切り替え
    const canvasContainer = button.parentElement.nextElementSibling;
    canvasContainer.querySelectorAll('.pallet-canvas').forEach(canvas => {
        canvas.classList.remove('active');
    });
    
    const targetCanvas = document.getElementById(canvasId);
    if (targetCanvas) {
        targetCanvas.classList.add('active');
    }
}

// === キャンバスパララックス効果 ===
function applyCanvasParallax(canvasId) {
    const canvas = document.getElementById(canvasId);
    if (!canvas) return;
    
    let isMoving = false;
    let lastX = 0;
    let lastY = 0;
    
    canvas.addEventListener('mousedown', (e) => {
        isMoving = true;
        lastX = e.clientX;
        lastY = e.clientY;
    });
    
    canvas.addEventListener('mousemove', (e) => {
        if (!isMoving) return;
        
        const deltaX = e.clientX - lastX;
        const deltaY = e.clientY - lastY;
        
        // パララックス効果（簡易版）
        const items = canvas.querySelectorAll('.cargo-item');
        items.forEach((item, index) => {
            const speed = 0.1 + (index * 0.05);
            item.style.transform = `translate(${deltaX * speed}px, ${deltaY * speed}px)`;
        });
        
        lastX = e.clientX;
        lastY = e.clientY;
    });
    
    canvas.addEventListener('mouseup', () => {
        isMoving = false;
    });
}

// === 高度なパレタイズアルゴリズム ===
function advancedPalletizationAlgorithm(cartons, palletSize, constraints) {
    // 3Dビンパッキングアルゴリズムの実装
    const pallets = [];
    let remainingCartons = [...cartons];
    
    // 貨物を体積順にソート
    remainingCartons.sort((a, b) => b.volume - a.volume);
    
    while (remainingCartons.length > 0) {
        const pallet = createEmptyPallet(palletSize);
        
        // 最適な配置を探索
        const placement = findOptimalPlacement(remainingCartons, pallet, constraints);
        
        if (placement.success) {
            pallet.items = placement.items;
            pallet.layers = placement.layers;
            pallet.height = placement.height;
            pallet.weight = placement.weight;
            pallets.push(pallet);
            
            // 配置された貨物を削除
            placement.items.forEach(item => {
                const index = remainingCartons.findIndex(c => c.id === item.id);
                if (index !== -1) {
                    remainingCartons.splice(index, 1);
                }
            });
        } else {
            // 配置できない貨物がある場合は単独でパレットを作成
            const singleCarton = remainingCartons.shift();
            const singlePallet = createSingleCartonPallet(singleCarton, palletSize);
            pallets.push(singlePallet);
        }
    }
    
    return { pallets, totalPallets: pallets.length };
}

// === 最適配置の探索 ===
function findOptimalPlacement(cartons, pallet, constraints) {
    // 貪欲アルゴリズムによる最適配置
    let bestPlacement = null;
    let bestScore = -1;
    
    // 配置パターンの生成
    const patterns = generatePlacementPatterns(cartons, pallet);
    
    patterns.forEach(pattern => {
        if (isValidPlacement(pattern, pallet, constraints)) {
            const score = calculatePlacementScore(pattern, pallet);
            if (score > bestScore) {
                bestScore = score;
                bestPlacement = pattern;
            }
        }
    });
    
    return bestPlacement || { success: false };
}

// === 配置パターンの生成 ===
function generatePlacementPatterns(cartons, pallet) {
    const patterns = [];
    
    // 単純な配置パターン
    cartons.forEach(carton => {
        patterns.push({
            items: [carton],
            layers: [{ items: [carton], height: carton.h }],
            height: carton.h,
            weight: carton.weight * carton.qty,
            success: true
        });
    });
    
    // 複数貨物の配置パターン
    if (cartons.length > 1) {
        const combinations = generateCombinations(cartons, 2);
        combinations.forEach(combo => {
            if (canFitTogether(combo, pallet)) {
                patterns.push({
                    items: combo,
                    layers: [{ items: combo, height: Math.max(...combo.map(c => c.h)) }],
                    height: Math.max(...combo.map(c => c.h)),
                    weight: combo.reduce((sum, c) => sum + (c.weight * c.qty), 0),
                    success: true
                });
            }
        });
    }
    
    return patterns;
}

// === 貨物の組み合わせ生成 ===
function generateCombinations(cartons, size) {
    const combinations = [];
    
    function backtrack(start, current) {
        if (current.length === size) {
            combinations.push([...current]);
            return;
        }
        
        for (let i = start; i < cartons.length; i++) {
            current.push(cartons[i]);
            backtrack(i + 1, current);
            current.pop();
        }
    }
    
    backtrack(0, []);
    return combinations;
}

// === 貨物の同時配置可能性チェック ===
function canFitTogether(cartons, pallet) {
    const totalArea = cartons.reduce((sum, c) => sum + (c.l * c.w), 0);
    const palletArea = pallet.width * pallet.depth;
    
    return totalArea <= palletArea * 0.95; // 95%の面積使用率
}

// === 配置の妥当性チェック ===
function isValidPlacement(placement, pallet, constraints) {
    // 高さ制限チェック
    if (placement.height > constraints.maxHeight) {
        return false;
    }
    
    // 重量制限チェック
    if (placement.weight > constraints.maxWeight) {
        return false;
    }
    
    // パレットサイズ制限チェック
    const maxLength = Math.max(...placement.items.map(c => c.l));
    const maxWidth = Math.max(...placement.items.map(c => c.w));
    
    if (maxLength > pallet.width || maxWidth > pallet.depth) {
        return false;
    }
    
    return true;
}

// === 配置スコアの計算 ===
function calculatePlacementScore(placement, pallet) {
    let score = 0;
    
    // 高さ効率
    const heightEfficiency = placement.height / pallet.height;
    score += heightEfficiency * 10;
    
    // 重量効率
    const weightEfficiency = placement.weight / 1000; // 1トン基準
    score += Math.min(weightEfficiency, 1) * 5;
    
    // 貨物数効率
    const itemEfficiency = placement.items.length / 5; // 5個基準
    score += Math.min(itemEfficiency, 1) * 3;
    
    // 面積効率
    const totalArea = placement.items.reduce((sum, c) => sum + (c.l * c.w), 0);
    const palletArea = pallet.width * pallet.depth;
    const areaEfficiency = totalArea / palletArea;
    score += areaEfficiency * 8;
    
    return score;
}

// === 空のパレット作成 ===
function createEmptyPallet(palletSize) {
    return {
        id: Date.now(),
        width: palletSize.width,
        depth: palletSize.depth,
        height: 0,
        weight: 0,
        items: [],
        layers: []
    };
}

// === 単一貨物パレット作成 ===
function createSingleCartonPallet(carton, palletSize) {
    return {
        id: Date.now(),
        width: palletSize.width,
        depth: palletSize.depth,
        height: carton.h,
        weight: carton.weight * carton.qty,
        items: [carton],
        layers: [{
            items: [carton],
            height: carton.h
        }]
    };
}
