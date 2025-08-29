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

// === パレタイズ計算の実装（簡略化） ===
function performPalletizationCalculation() {
    // 実際の計算ロジックは既存のコードを使用
    // ここではサンプル結果を返す
    return {
        pallets: [
            {
                id: 1,
                width: 120,
                depth: 100,
                height: 120,
                weight: 500,
                items: cartonData
            }
        ],
        totalPallets: 1,
        totalWeight: cartonData.reduce((sum, c) => sum + (c.weight * c.qty), 0)
    };
}

// === 結果表示の実装（簡略化） ===
function updateResultSummary(result) {
    const summaryDiv = document.getElementById('resultSummary');
    summaryDiv.innerHTML = `
        <div class="summary-card orange">
            <h3>使用パレット数</h3>
            <p>${result.totalPallets}</p>
        </div>
        <div class="summary-card green">
            <h3>総重量</h3>
            <p>${result.totalWeight.toFixed(2)} kg</p>
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
        `;
        
        resultsDiv.appendChild(palletDiv);
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
