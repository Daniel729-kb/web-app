// 定数の一元管理
const CONSTANTS = {
    CONTAINER_OFFSET_X: 25,
    CONTAINER_OFFSET_Y: 35,
    CONTAINER_DISPLAY_WIDTH: 800,
    CONTAINER_DISPLAY_HEIGHT: 300,
    MIN_DRAG_MARGIN: 10,
    EPSILON: 0.01,
    ANIMATION_DELAY: 500
};

// グローバル変数
let pallets = [];
let allPalletsGenerated = [];
let renderConfig = {
    scale: 1,
    containerOffset: { x: CONSTANTS.CONTAINER_OFFSET_X, y: CONSTANTS.CONTAINER_OFFSET_Y },
    containerBounds: null
};

const containers = {
    '20ft': { length: 589.8, width: 235.0, height: 235.0 },
    '40ft': { length: 1203.2, width: 235.0, height: 235.0 },
    '40HQ': { length: 1203.2, width: 235.0, height: 228.8 }
};

// DOM要素のキャッシュ
const elements = {
    containerType: document.getElementById('containerType'),
    enableStacking: document.getElementById('enableStacking'),
    palletLength: document.getElementById('palletLength'),
    palletWidth: document.getElementById('palletWidth'),
    palletHeight: document.getElementById('palletHeight'),
    palletWeight: document.getElementById('palletWeight'),
    canStackAbove: document.getElementById('canStackAbove'),
    canStackBelow: document.getElementById('canStackBelow'),
    palletQty: document.getElementById('palletQty'),
    clearanceValue: document.getElementById('clearanceValue'),
    addPalletBtn: document.getElementById('addPalletBtn'),
    calculateBtn: document.getElementById('calculateBtn'),
    testBtn: document.getElementById('testBtn'),
    exportBtn: document.getElementById('exportBtn'),
    palletList: document.getElementById('palletList'),
    containerInfo: document.getElementById('containerInfo'),
    loadingAnimation: document.getElementById('loadingAnimation'),
    manualInstructions: document.getElementById('manualInstructions'),
    legend: document.getElementById('legend'),
    unloadedSummary: document.getElementById('unloadedSummary'),
    containerFloor: document.getElementById('containerFloor'),
    stats: document.getElementById('stats'),
    errorMessage: document.getElementById('errorMessage'),
    successMessage: document.getElementById('successMessage'),
    darkModeToggle: document.getElementById('darkModeToggle'),
    debugOutput: document.getElementById('debugOutput')
};

// ダークモード初期化
function initDarkMode() {
    const isDarkMode = localStorage.getItem('darkMode') === 'true';
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
        elements.darkModeToggle.textContent = '☀️';
    } else {
        elements.darkModeToggle.textContent = '🌙';
    }

    elements.darkModeToggle.addEventListener('click', () => {
        document.body.classList.toggle('dark-mode');
        const isDark = document.body.classList.contains('dark-mode');
        localStorage.setItem('darkMode', isDark);
        elements.darkModeToggle.textContent = isDark ? '☀️' : '🌙';
    });
}

// メモリ管理とパフォーマンス最適化
const memoryManager = {
    // タイマーの追跡
    timers: new Set(),
    
    // 安全なタイマー設定
    setTimeout: (callback, delay) => {
        const timerId = setTimeout(callback, delay);
        memoryManager.timers.add(timerId);
        return timerId;
    },
    
    // タイマーのクリア
    clearTimeout: (timerId) => {
        clearTimeout(timerId);
        memoryManager.timers.delete(timerId);
    },
    
    // 全タイマーのクリア
    clearAllTimers: () => {
        memoryManager.timers.forEach(timerId => {
            clearTimeout(timerId);
        });
        memoryManager.timers.clear();
    },
    
    // メモリクリーンアップ
    cleanup: () => {
        memoryManager.clearAllTimers();
        
        // 大きなデータセットのクリア
        if (window.allPalletsGenerated && window.allPalletsGenerated.length > 1000) {
            console.log('Large dataset detected, clearing old data...');
            window.allPalletsGenerated = window.allPalletsGenerated.slice(-500);
        }
        
        // 未使用のDOM要素のクリア
        const unusedElements = document.querySelectorAll('.temp-element, .calculation-result');
        if (unusedElements.length > 50) {
            console.log('Clearing unused DOM elements...');
            unusedElements.forEach(el => el.remove());
        }
    }
};

// デバッグ機能
const debug = {
    log: function(message, data = null) {
        const timestamp = new Date().toLocaleTimeString();
        let logMessage = `[${timestamp}] ${message}`;
        
        if (data) {
            if (typeof data === 'object') {
                logMessage += '\n' + JSON.stringify(data, null, 2);
            } else {
                logMessage += `: ${data}`;
            }
        }
        
        console.log(logMessage);
        
        // デバッグ出力エリアに表示
        if (elements.debugOutput) {
            elements.debugOutput.style.display = 'block';
            elements.debugOutput.innerHTML += `<div style="margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 3px;">${logMessage.replace(/\n/g, '<br>')}</div>`;
            elements.debugOutput.scrollTop = elements.debugOutput.scrollHeight;
        }
    },
    
    clear: function() {
        if (elements.debugOutput) {
            elements.debugOutput.innerHTML = '';
            elements.debugOutput.style.display = 'none';
        }
        console.clear();
    },
    
    testStacking: function() {
        this.log('=== 積み重ねテスト開始 ===');
        this.log('パレット数:', pallets.length);
        this.log('積み重ね有効:', elements.enableStacking.checked);
        
        pallets.forEach((pallet, index) => {
            this.log(`パレット#${pallet.palletNumber}:`, {
                size: `${pallet.length}×${pallet.width}×${pallet.height}cm`,
                weight: `${pallet.weight}kg`,
                stacking: `${pallet.canStackAbove ? '上積み可' : '上積み不可'}, ${pallet.canStackBelow ? '下積み可' : '下積み不可'}`
            });
        });
        
        if (allPalletsGenerated.length > 0) {
            this.log('生成済みパレット数:', allPalletsGenerated.length);
            this.log('配置済みパレット数:', allPalletsGenerated.filter(p => p.placed).length);
            this.log('積み重ね済みパレット数:', allPalletsGenerated.filter(p => p.stackedOn).length);
        }
    },
    
    testGravity: function() {
        this.log('=== 重心計算テスト開始 ===');
        
        if (allPalletsGenerated.length === 0) {
            this.log('パレットが配置されていません');
            return;
        }
        
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        if (placedPallets.length === 0) {
            this.log('配置済みパレットがありません');
            return;
        }
        
        const stability = calculateStackingStability(placedPallets);
        this.log('重心計算結果:', stability);
        
        // 各パレットの詳細情報
        placedPallets.forEach(pallet => {
            this.log(`パレット#${pallet.palletNumber}:`, {
                position: `(${pallet.x}, ${pallet.y}, ${pallet.z})`,
                size: `${pallet.finalLength}×${pallet.finalWidth}×${pallet.finalHeight}cm`,
                weight: `${pallet.weight}kg`,
                stackedOn: pallet.stackedOn ? `#${pallet.stackedOn.palletNumber}` : 'なし',
                stackedBy: pallet.stackedBy.length > 0 ? pallet.stackedBy.map(s => `#${s.palletNumber}`).join(', ') : 'なし'
            });
        });
    },
    
    testLayout: function() {
        this.log('=== レイアウト解析テスト開始 ===');
        
        const container = containers[elements.containerType.value];
        this.log('コンテナ情報:', {
            type: elements.containerType.value,
            dimensions: `${container.length}×${container.width}×${container.height}cm`,
            clearance: `${utils.getCurrentClearance()}cm`
        });
        
        if (allPalletsGenerated.length === 0) {
            this.log('パレットが配置されていません');
            return;
        }
        
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
        
        this.log('配置状況:', {
            total: allPalletsGenerated.length,
            placed: placedPallets.length,
            unplaced: unplacedPallets.length,
            deleted: allPalletsGenerated.filter(p => p.deleted).length
        });
        
        // 面積使用率計算 - 修正版（積み重ねパレットを除外）
        const totalArea = container.length * container.width;
        const basePallets = placedPallets.filter(p => !p.stackedOn);
        const stackedPallets = placedPallets.filter(p => p.stackedOn);
        const usedArea = basePallets.reduce((sum, p) => sum + (p.finalLength * p.finalWidth), 0);
        const remainingArea = totalArea - usedArea;
        const areaUtilization = (usedArea / totalArea) * 100;
        
        this.log('床面積計算:', {
            basePallets: basePallets.length,
            stackedPallets: stackedPallets.length,
            totalPlaced: placedPallets.length
        });
        this.log('面積使用率:', `${areaUtilization.toFixed(2)}%`);
        this.log('残り床面積:', `${remainingArea.toFixed(2)}cm² (${(remainingArea / 10000).toFixed(2)}m²)`);
        
        // 高さ使用率計算（積み重ね時）
        if (elements.enableStacking.checked) {
            const maxHeight = Math.max(...placedPallets.map(p => p.z + p.finalHeight));
            const heightUtilization = (maxHeight / container.height) * 100;
            this.log('高さ使用率:', `${heightUtilization.toFixed(2)}%`);
        }
        
        // 重量分布
        const totalWeight = placedPallets.reduce((sum, p) => sum + (p.weight || 0), 0);
        this.log('総重量:', `${totalWeight}kg`);
    }
};

// グローバルデバッグ関数
function debugLog(message, data = null) {
    debug.log(message, data);
}

// ユーティリティ関数
const utils = {
    getCurrentClearance: () => parseFloat(elements.clearanceValue.value) || 1,
    getRandomColor: () => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    showError: (message) => {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
        // 安全なタイマー使用
        const timerId = memoryManager.setTimeout(() => {
            elements.errorMessage.style.display = 'none';
        }, 5000);
    },
    showSuccess: (message) => {
        elements.successMessage.textContent = message;
        elements.successMessage.style.display = 'block';
        // 安全なタイマー使用
        const timerId = memoryManager.setTimeout(() => {
            elements.successMessage.style.display = 'none';
        }, 5000);
    },
    adjustColor: (color, amount) => {
        return '#' + color.replace(/^#/, '').replace(/../g, value => 
            ('0' + Math.min(255, Math.max(0, parseInt(value, 16) + amount)).toString(16)).substr(-2)
        );
    },
    calculateScale: (container) => {
        const scaleX = CONSTANTS.CONTAINER_DISPLAY_WIDTH / container.length;
        const scaleY = CONSTANTS.CONTAINER_DISPLAY_HEIGHT / container.width;
        return Math.min(scaleX, scaleY);
    }
};

// パレット管理
const palletManager = {
    add: function() {
        const length = parseInt(elements.palletLength.value);
        const width = parseInt(elements.palletWidth.value);
        const height = parseInt(elements.palletHeight.value) || 0;
        const weight = parseInt(elements.palletWeight.value) || 0;
        const qty = parseInt(elements.palletQty.value);
        const canStackAbove = elements.canStackAbove.checked;
        const canStackBelow = elements.canStackBelow.checked;
        
        if (!this.validate(length, width, height, weight, qty)) return;
        
        // パレット番号を自動生成
        const palletNumber = this.generatePalletNumber();
        
        pallets.push({
            id: Date.now(),
            palletNumber: palletNumber,
            length,
            width,
            height,
            weight,
            qty,
            canStackAbove,
            canStackBelow,
            color: utils.getRandomColor()
        });
        
        updatePalletList();
        updateContainerInfo();
        clearInputs();
        clearResults();
    },
    
    generatePalletNumber: function() {
        // 既存のパレット番号を取得して次の番号を生成
        const existingNumbers = pallets.map(p => p.palletNumber);
        let nextNumber = 1;
        while (existingNumbers.includes(nextNumber)) {
            nextNumber++;
        }
        return nextNumber;
    },
    
    validate: (length, width, height, weight, qty) => {
        if (!length || !width || !qty || length <= 0 || width <= 0 || qty <= 0) {
            utils.showError('有効なパレット寸法と数量を入力してください');
            return false;
        }
        if (length > 300 || width > 300 || height > 300) {
            utils.showError('パレットサイズは300cm以下にしてください');
            return false;
        }
        if (weight > 2000) {
            utils.showError('パレット重量は2000kg以下にしてください');
            return false;
        }
        if (qty > 100) {
            utils.showError('パレット数量は100個以下にしてください');
            return false;
        }
        return true;
    },
    
    remove: (id) => {
        pallets = pallets.filter(p => p.id !== id);
        updatePalletList();
        updateContainerInfo();
        clearResults();
    }
};

// テストケース
function runTestCase() {
    pallets = [];
    allPalletsGenerated = [];
    elements.containerType.value = '40ft';
    elements.clearanceValue.value = '1';
    elements.enableStacking.checked = true;
    
    const testData = [
        { l: 110, w: 110, h: 120, wt: 800, q: 12, c: '#f39c12', above: true, below: true },  // 黄色
        { l: 100, w: 125, h: 100, wt: 600, q: 8, c: '#3498db', above: true, below: true }    // 青色
    ];
    
    testData.forEach((p, i) => pallets.push({
        id: Date.now() + i,
        palletNumber: i + 1,
        length: p.l,
        width: p.w,
        height: p.h,
        weight: p.wt,
        qty: p.q,
        canStackAbove: p.above,
        canStackBelow: p.below,
        color: p.c
    }));
    
    updatePalletList();
    updateContainerInfo();
    clearResults();
    utils.showSuccess('🎯 3D積み重ねテスト: 110×110×120cm (12個) + 100×125×100cm (8個)');
}

// UI更新関数
function updatePalletList() {
    elements.palletList.innerHTML = '';
    
    if (pallets.length === 0) {
        elements.palletList.innerHTML = '<p style="text-align:center;color:#6c757d;font-style:italic;">パレットがありません</p>';
        return;
    }
    
    pallets.forEach(p => {
        const item = document.createElement('div');
        item.className = 'pallet-item';
        const stackInfo = p.canStackAbove && p.canStackBelow ? '積み重ね可' : 
                         p.canStackAbove ? '上積みのみ' : 
                         p.canStackBelow ? '下積みのみ' : '積み重ね不可';
        const weightInfo = p.weight > 0 ? ` ${p.weight}kg` : '';
        const heightInfo = p.height > 0 ? ` H:${p.height}cm` : '';
        item.innerHTML = `
            <div style="flex: 1;">
                <div style="font-weight: bold;">#${p.palletNumber} ${p.length}×${p.width}${heightInfo}${weightInfo}</div>
                <div style="font-size: 12px; color: #6c757d;">${p.qty}個 - ${stackInfo}</div>
            </div>
            <button class="remove-btn">✕</button>
        `;
        item.querySelector('.remove-btn').addEventListener('click', () => palletManager.remove(p.id));
        elements.palletList.appendChild(item);
    });
}

function updateContainerInfo() {
    const container = containers[elements.containerType.value];
    elements.containerInfo.innerHTML = `${elements.containerType.value}内寸: ${(container.length/100).toFixed(3)}m×${(container.width/100).toFixed(3)}m×${(container.height/100).toFixed(3)}m <small>クリアランス: ${utils.getCurrentClearance()}cm</small>`;
}

function clearInputs() {
    elements.palletLength.value = '';
    elements.palletWidth.value = '';
    elements.palletHeight.value = '';
    elements.palletWeight.value = '';
    elements.palletQty.value = '1';
    elements.canStackAbove.checked = true;
    elements.canStackBelow.checked = true;
}

function clearResults() {
    allPalletsGenerated = [];
    const workArea = elements.containerFloor.parentElement;
    workArea.querySelectorAll('.pallet-2d').forEach(el => el.remove());
    
    // レンダリング設定をリセット
    const container = containers[elements.containerType.value];
    renderConfig.scale = utils.calculateScale(container);
    
    elements.containerFloor.style.width = `${container.length * renderConfig.scale}px`;
    elements.containerFloor.style.height = `${container.width * renderConfig.scale}px`;
    elements.containerFloor.style.left = `${CONSTANTS.CONTAINER_OFFSET_X}px`;
    elements.containerFloor.style.top = `${CONSTANTS.CONTAINER_OFFSET_Y}px`;
    
    ['stats', 'legend', 'unloadedSummary', 'exportBtn', 'manualInstructions'].forEach(id => {
        elements[id].style.display = 'none';
    });
}

// 配置アルゴリズム関連
function canPlace2D(x, y, length, width, placed, clearance, container = null) {
    const rect1 = { x, y, length, width };
    const cont = container || containers[elements.containerType.value];
    
    // 境界チェック
    if (x < 0 || y < 0 || x + length > cont.length || y + width > cont.width) {
        return false;
    }
    
    // 衝突チェック
    return !placed.some(rect2 => rectanglesOverlapWithClearance(rect1, rect2, clearance));
}

function rectanglesOverlapWithClearance(r1, r2, clearance) {
    return !(
        r1.x + r1.length + clearance <= r2.x + CONSTANTS.EPSILON ||
        r2.x + r2.length + clearance <= r1.x + CONSTANTS.EPSILON ||
        r1.y + r1.width + clearance <= r2.y + CONSTANTS.EPSILON ||
        r2.y + r2.width + clearance <= r1.y + CONSTANTS.EPSILON
    );
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
    initDarkMode();
    setupEventListeners();
    updateContainerInfo();
});

// メモリクリーンアップ
window.addEventListener('beforeunload', () => { 
    console.log('Cleaning up before page unload...'); 
    memoryManager.cleanup(); 
});

setInterval(() => { memoryManager.cleanup(); }, 3 * 60 * 1000);