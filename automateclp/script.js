// 定数の一元管理
const CONSTANTS = {
    CONTAINER_OFFSET_X: 25,
    CONTAINER_OFFSET_Y: 35,
    CONTAINER_DISPLAY_WIDTH: 800,
    CONTAINER_DISPLAY_HEIGHT: 300,
    MIN_DRAG_MARGIN: 10,
    EPSILON: 0.01,
    ANIMATION_DELAY: 500,
    // 3D Stacking Configuration
    STACKING: {
        MAX_STACK_WEIGHT: 2500, // Increased maximum weight a stack can support
        MIN_BASE_WEIGHT: 400,   // Reduced minimum weight for a base pallet
        WEIGHT_RATIO_LIMIT: 3.0, // Increased maximum weight ratio (stacked/base)
        HEIGHT_PREFERENCE: 0.5,  // Increased weight for height preference in scoring
        SIZE_FIT_WEIGHT: 50,     // Weight for size compatibility
        PERFECT_FIT_BONUS: 200,  // Bonus for perfect size match
        CENTER_PENALTY: 0.02,    // Reduced penalty for distance from center
        STACK_HEIGHT_PENALTY: 3, // Reduced penalty for tall stacks (encourages multi-level)
        WEIGHT_BALANCE_PENALTY: 0.05 // Reduced penalty for unbalanced weight distribution
    }
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

// 自動配置機能
function autoPlacePallet(palletEl) {
    const palletData = allPalletsGenerated.find(p =>
        p.id == palletEl.dataset.palletId && p.instance == palletEl.dataset.instance
    );
    if (!palletData) return;

    const container = containers[elements.containerType.value];
    const clearance = utils.getCurrentClearance();
    
    // 配置済みパレットを取得
    const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted && p !== palletData);
    
    // 最適な位置を探索
    let bestPosition = null;
    let bestScore = Infinity;
    
    // グリッドベースで配置位置を探索
    for (let y = 0; y <= container.width - palletData.finalWidth; y += 5) {
        for (let x = 0; x <= container.length - palletData.finalLength; x += 5) {
            if (canPlace2D(x, y, palletData.finalLength, palletData.finalWidth, placedPallets, clearance)) {
                // 左下を優先するスコア計算
                const score = x + y * 2;
                if (score < bestScore) {
                    bestScore = score;
                    bestPosition = { x, y };
                }
            }
        }
    }
    
    if (bestPosition) {
        // パレットを配置
        palletData.x = bestPosition.x;
        palletData.y = bestPosition.y;
        palletData.placed = true;
        
        // UIを更新
        const palletLeft = (palletData.x * renderConfig.scale) + CONSTANTS.CONTAINER_OFFSET_X;
        const palletTop = (palletData.y * renderConfig.scale) + CONSTANTS.CONTAINER_OFFSET_Y;
        
        palletEl.style.left = `${palletLeft}px`;
        palletEl.style.top = `${palletTop}px`;
        
        // 状態を更新
        updatePalletStatus(palletEl);
        updateStats(container);
        
        utils.showSuccess(`パレット#${palletData.palletNumber} を自動配置しました`);
    } else {
        utils.showError('配置可能な位置が見つかりませんでした');
    }
}

// ドラッグ＆ドロップ機能
let isDDListenerAttached = false;
function enableDragAndDropAndActions() {
    const workArea = elements.containerFloor.parentElement;
    if (isDDListenerAttached) return;

    let activePalletEl = null;
    let initialMouseX, initialMouseY;

    workArea.addEventListener('mousedown', handleMouseDown);
    workArea.addEventListener('dblclick', handleDoubleClick);
    isDDListenerAttached = true;

    function handleMouseDown(e) {
        const target = e.target;
        if (target.classList.contains('rotate-btn')) {
            e.stopPropagation();
            rotatePallet(target.closest('.pallet-2d'));
        } else if (target.classList.contains('delete-btn')) {
            e.stopPropagation();
            deletePallet(target.closest('.pallet-2d'));
        } else {
            const palletEl = target.classList.contains('pallet-2d') ? target : target.closest('.pallet-2d');
            if (palletEl) {
                dragStart(e, palletEl);
            }
        }
    }

    function handleDoubleClick(e) {
        const target = e.target;
        const palletEl = target.classList.contains('pallet-2d') ? target : target.closest('.pallet-2d');
        
        if (palletEl) {
            e.preventDefault();
            e.stopPropagation();
            autoPlacePallet(palletEl);
        }
    }

    function dragStart(e, palletEl) {
        e.preventDefault();
        activePalletEl = palletEl;
        activePalletEl.classList.add('dragging');
        
        const palletRect = activePalletEl.getBoundingClientRect();
        const workAreaRect = workArea.getBoundingClientRect();
        
        initialMouseX = e.clientX - palletRect.left;
        initialMouseY = e.clientY - palletRect.top;
        
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
    }

    function drag(e) {
        if (!activePalletEl) return;
        e.preventDefault();
        
        const workAreaRect = workArea.getBoundingClientRect();
        let newLeft = e.clientX - workAreaRect.left - initialMouseX;
        let newTop = e.clientY - workAreaRect.top - initialMouseY;
        
        // 作業エリア内に制限
        newLeft = Math.max(CONSTANTS.MIN_DRAG_MARGIN, 
                  Math.min(newLeft, workArea.clientWidth - activePalletEl.clientWidth - CONSTANTS.MIN_DRAG_MARGIN));
        newTop = Math.max(CONSTANTS.MIN_DRAG_MARGIN, 
                 Math.min(newTop, workArea.clientHeight - activePalletEl.clientHeight - CONSTANTS.MIN_DRAG_MARGIN));
        
        activePalletEl.style.left = `${newLeft}px`;
        activePalletEl.style.top = `${newTop}px`;
        
        updatePalletStatus(activePalletEl);
    }

    function dragEnd() {
        if (!activePalletEl) return;
        activePalletEl.classList.remove('dragging');
        updatePalletModel(activePalletEl);
        updateStats(containers[elements.containerType.value]);
        document.removeEventListener('mousemove', drag);
        document.removeEventListener('mouseup', dragEnd);
        activePalletEl = null;
    }

    function rotatePallet(palletEl) {
        if (!palletEl) return;
        
        const palletData = allPalletsGenerated.find(p =>
            p.id == palletEl.dataset.palletId && p.instance == palletEl.dataset.instance
        );
        if (!palletData) return;

        // 寸法を入れ替え
        [palletData.finalLength, palletData.finalWidth] = [palletData.finalWidth, palletData.finalLength];
        palletData.rotated = !palletData.rotated;

        const container = containers[elements.containerType.value];
        palletEl.style.width = `${palletData.finalLength * renderConfig.scale}px`;
        palletEl.style.height = `${palletData.finalWidth * renderConfig.scale}px`;
        palletEl.querySelector('.pallet-label').textContent = 
            `${palletData.finalLength}×${palletData.finalWidth}${palletData.rotated ? ' ↻' : ''}`;
        
        // 背景更新
        if (palletData.rotated) {
            palletEl.style.background = `repeating-linear-gradient(45deg, ${palletData.color}, ${palletData.color} 10px, ${utils.adjustColor(palletData.color, -20)} 10px, ${utils.adjustColor(palletData.color, -20)} 20px)`;
        } else {
            palletEl.style.background = palletData.color;
        }

        // 位置調整
        if (palletEl.offsetLeft + palletEl.offsetWidth > workArea.clientWidth) {
            palletEl.style.left = `${Math.max(0, workArea.clientWidth - palletEl.offsetWidth)}px`;
        }
        if (palletEl.offsetTop + palletEl.offsetHeight > workArea.clientHeight) {
            palletEl.style.top = `${Math.max(0, workArea.clientHeight - palletEl.offsetHeight)}px`;
        }
        
        updatePalletModel(palletEl);
        updatePalletStatus(palletEl);
        updateStats(container);
    }

    function deletePallet(palletEl) {
        if (!palletEl) return;
        
        const palletData = allPalletsGenerated.find(p =>
            p.id == palletEl.dataset.palletId && p.instance == palletEl.dataset.instance
        );
        if (!palletData) return;

        palletData.deleted = true;
        palletEl.remove();
        updateStats(containers[elements.containerType.value]);
        utils.showSuccess('パレットが削除されました');
    }

    function updatePalletStatus(palletEl) {
        const container = containers[elements.containerType.value];
        const palletData = {
            x: (parseFloat(palletEl.style.left) - CONSTANTS.CONTAINER_OFFSET_X) / renderConfig.scale,
            y: (parseFloat(palletEl.style.top) - CONSTANTS.CONTAINER_OFFSET_Y) / renderConfig.scale,
            finalLength: palletEl.clientWidth / renderConfig.scale,
            finalWidth: palletEl.clientHeight / renderConfig.scale
        };

        const isOutside = isOutsideContainer(palletData, container);
        const hasCollision = checkCollision(palletEl);
        
        palletEl.classList.toggle('outside-container', isOutside);
        palletEl.classList.toggle('colliding', hasCollision);
    }

    function checkCollision(draggedEl) {
        const container = containers[elements.containerType.value];
        const clearance = utils.getCurrentClearance();
        
        const draggedRect = {
            x: (draggedEl.offsetLeft - CONSTANTS.CONTAINER_OFFSET_X) / renderConfig.scale,
            y: (draggedEl.offsetTop - CONSTANTS.CONTAINER_OFFSET_Y) / renderConfig.scale,
            length: draggedEl.clientWidth / renderConfig.scale,
            width: draggedEl.clientHeight / renderConfig.scale
        };
        
        return allPalletsGenerated.some(p => {
            if (p.deleted) return false;
            const el = workArea.querySelector(`[data-pallet-id="${p.id}"][data-instance="${p.instance}"]`);
            if (el === draggedEl) return false;
            
            return rectanglesOverlapWithClearance(
                draggedRect,
                { x: p.x, y: p.y, length: p.finalLength, width: p.finalWidth },
                clearance
            );
        });
    }

    function updatePalletModel(el) {
        const palletData = allPalletsGenerated.find(p =>
            p.id == el.dataset.palletId && p.instance == el.dataset.instance
        );
        if (palletData) {
            palletData.x = (parseFloat(el.style.left) - CONSTANTS.CONTAINER_OFFSET_X) / renderConfig.scale;
            palletData.y = (parseFloat(el.style.top) - CONSTANTS.CONTAINER_OFFSET_Y) / renderConfig.scale;
        }
    }
}

// 統計更新
function updateStats(container) {
    const visiblePallets = allPalletsGenerated.filter(p => !p.deleted);
    const insidePallets = visiblePallets.filter(p => !isOutsideContainer(p, container));
    
    const containerArea = (container.length * container.width) / 10000; // m²
    const usedArea = insidePallets.reduce((sum, p) => 
        sum + (p.finalLength * p.finalWidth) / 10000, 0
    );
    
    // 3D積み重ね情報
    let stackingInfo = '';
    if (elements.enableStacking.checked) {
        const stackedPallets = insidePallets.filter(p => p.stackedOn);
        const basePallets = insidePallets.filter(p => p.stackedBy.length > 0);
        const maxHeight = Math.max(...insidePallets.map(p => p.z + p.finalHeight), 0);
        const totalWeight = insidePallets.reduce((sum, p) => sum + (p.weight || 0), 0);
        
        stackingInfo = `
            <div class="stat-card">
                <div class="stat-value">${stackedPallets.length}</div>
                <div class="stat-label">積み重ねパレット</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${maxHeight.toFixed(0)}cm</div>
                <div class="stat-label">最大高さ</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${totalWeight}kg</div>
                <div class="stat-label">総重量</div>
            </div>
        `;
    }
    
    const totalInputPallets = pallets.reduce((sum, p) => sum + p.qty, 0);
    
    document.getElementById('inputPallets').textContent = totalInputPallets;
    document.getElementById('visiblePallets').textContent = visiblePallets.length;
    document.getElementById('loadedPallets').textContent = insidePallets.length;
    document.getElementById('loadingRate').textContent = 
        `${totalInputPallets > 0 ? Math.round((insidePallets.length / totalInputPallets) * 100) : 0}%`;
    document.getElementById('efficiency').textContent = 
        `${containerArea > 0 ? Math.round((usedArea / containerArea) * 100) : 0}%`;
    // Calculate remaining floor area: Container Area - Base Pallets Area
    const basePallets = insidePallets.filter(p => !p.stackedOn);
    const stackedPallets = insidePallets.filter(p => p.stackedOn);
    const baseUsedArea = basePallets.reduce((sum, p) => sum + (p.finalLength * p.finalWidth), 0);
    const baseUsedAreaM2 = baseUsedArea / 10000; // Convert cm² to m²
    const remainingArea = containerArea - baseUsedAreaM2;
    document.getElementById('remainingArea').textContent = `${remainingArea.toFixed(2)}m²`;
    
    // 3D情報を追加
    if (stackingInfo) {
        const statsContainer = document.getElementById('stats');
        const existing3DStats = statsContainer.querySelectorAll('.stat-card:nth-child(n+7)');
        existing3DStats.forEach(el => el.remove());
        statsContainer.insertAdjacentHTML('beforeend', stackingInfo);
    }
    
    elements.stats.style.display = 'grid';
}

function updateLegend() {
    elements.legend.innerHTML = '';
    if (pallets.length === 0) {
        elements.legend.style.display = 'none';
        return;
    }
    
    pallets.forEach(p => {
        elements.legend.innerHTML += `
            <div class="legend-item">
                <div class="legend-color" style="background:${p.color};"></div>
                <span>${p.length}×${p.width}cm (${p.qty}個)</span>
            </div>
        `;
    });
    elements.legend.style.display = 'flex';
}

// 画像エクスポート
function exportLayoutAsImage() {
    const vizArea = document.querySelector('.visualization');
    elements.exportBtn.style.visibility = 'hidden';
    utils.showSuccess('🖼️ 画像を生成中です...');
    
    html2canvas(vizArea, { 
        scale: 2, 
        useCORS: true, 
        backgroundColor: '#ffffff' 
    }).then(canvas => {
        const link = document.createElement('a');
        link.download = `container-loading-plan-${new Date().toISOString().slice(0,10)}.png`;
        link.href = canvas.toDataURL('image/png');
        link.click();
        elements.exportBtn.style.visibility = 'visible';
    }).catch(err => {
        console.error('Image export failed:', err);
        utils.showError('画像の生成に失敗しました。');
        elements.exportBtn.style.visibility = 'visible';
    });
}

// イベントリスナーの設定
function setupEventListeners() {
    elements.addPalletBtn.addEventListener('click', () => palletManager.add());
    elements.calculateBtn.addEventListener('click', calculateLoading);
    elements.testBtn.addEventListener('click', runTestCase);
    elements.exportBtn.addEventListener('click', exportLayoutAsImage);
    elements.containerType.addEventListener('change', () => {
        updateContainerInfo();
        clearResults();
    });
    elements.clearanceValue.addEventListener('input', () => {
        updateContainerInfo();
        clearResults();
    });
    
    // デバッグボタンのイベントリスナー
    document.getElementById('debugStacking').addEventListener('click', () => debug.testStacking());
    document.getElementById('debugGravity').addEventListener('click', () => debug.testGravity());
    document.getElementById('debugLayout').addEventListener('click', () => debug.testLayout());
    document.getElementById('debugClear').addEventListener('click', () => debug.clear());
    
    // Enterキーでの追加
    [elements.palletLength, elements.palletWidth, elements.palletHeight, elements.palletWeight, elements.palletQty].forEach(input => {
        input.addEventListener('keypress', e => {
            if (e.key === 'Enter') palletManager.add();
        });
    });
}

function setupPresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            elements.palletLength.value = this.dataset.length;
            elements.palletWidth.value = this.dataset.width;
            // デフォルトの高さと重量を設定
            elements.palletHeight.value = this.dataset.height || '120';
            elements.palletWeight.value = this.dataset.weight || '500';
            elements.palletQty.focus();
        });
    });
}

// 初期化
function init() {
    initDarkMode();
    setupPresetButtons();
    setupEventListeners();
    updateContainerInfo();
}

document.addEventListener('DOMContentLoaded', init);

// メモリクリーンアップ
window.addEventListener('beforeunload', () => { 
    console.log('Cleaning up before page unload...'); 
    memoryManager.cleanup(); 
});

setInterval(() => { memoryManager.cleanup(); }, 3 * 60 * 1000);

// Missing functions from app.js
function isOutsideContainer(pallet, container) {
    return pallet.x < 0 || pallet.y < 0 || 
           pallet.x + pallet.finalLength > container.length || 
           pallet.y + pallet.finalWidth > container.width;
}

function calculateLoading() {
    if (pallets.length === 0) {
        return utils.showError('少なくとも1つのパレットタイプを追加してください');
    }
    
    const container = containers[elements.containerType.value];
    const clearance = utils.getCurrentClearance();
    elements.loadingAnimation.style.display = 'block';
    elements.exportBtn.style.display = 'none';

    setTimeout(() => {
        allPalletsGenerated = [];
        
        // 全パレットを生成
        pallets.forEach(pt => {
            for (let i = 0; i < pt.qty; i++) {
                allPalletsGenerated.push({
                    id: pt.id,
                    instance: i,
                    palletNumber: pt.palletNumber,
                    length: pt.length,
                    width: pt.width,
                    height: pt.height || 0,
                    weight: pt.weight || 0,
                    canStackAbove: pt.canStackAbove,
                    canStackBelow: pt.canStackBelow,
                    color: pt.color,
                    placed: false,
                    deleted: false,
                    x: 0,
                    y: 0,
                    z: 0, // 3D座標
                    finalLength: pt.length,
                    finalWidth: pt.width,
                    finalHeight: pt.height || 0,
                    rotated: false,
                    stackedOn: null, // 積み重ね先のパレットID
                    stackedBy: [] // このパレットの上に積まれているパレットID
                });
            }
        });
        
        console.log(`生成されたパレット数: ${allPalletsGenerated.length}`);
        console.log(`コンテナサイズ: ${container.length}cm × ${container.width}cm`);
        console.log(`クリアランス: ${clearance}cm`);
        
        // 自動配置
        packPallets2D(allPalletsGenerated.filter(p => !p.deleted), container, clearance);
        
        // 配置済みパレットを中央に移動
        const placedPallets = allPalletsGenerated.filter(p => p.placed);
        if (placedPallets.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            placedPallets.forEach(p => {
                minX = Math.min(minX, p.x);
                minY = Math.min(minY, p.y);
                maxX = Math.max(maxX, p.x + p.finalLength);
                maxY = Math.max(maxY, p.y + p.finalWidth);
            });

            const placementWidth = maxX - minX;
            const placementHeight = maxY - minY;

            const offsetX = (container.length - placementWidth) / 2 - minX;
            const offsetY = (container.width - placementHeight) / 2 - minY;

            placedPallets.forEach(p => {
                p.x += offsetX;
                p.y += offsetY;
            });
        }
        
        const placedCount = allPalletsGenerated.filter(p => p.placed).length;
        const rotatedCount = allPalletsGenerated.filter(p => p.placed && p.rotated).length;
        
        elements.loadingAnimation.style.display = 'none';
        elements.manualInstructions.style.display = 'block';
        elements.exportBtn.style.display = 'block';
        
        renderAllPallets(container);
        updateStats(container);
        updateLegend();

        if (placedCount === allPalletsGenerated.length) {
            utils.showSuccess(`🎉 全${allPalletsGenerated.length}個のパレットが自動配置されました！（回転: ${rotatedCount}個）`);
        } else if (placedCount > 0) {
            utils.showSuccess(`⚡ ${placedCount}/${allPalletsGenerated.length}個を自動配置（回転: ${rotatedCount}個）。残りはマニュアル調整してください。`);
        } else {
            utils.showSuccess(`📦 ${allPalletsGenerated.length}個のパレットを生成しました。マニュアルで配置してください。`);
        }
    }, CONSTANTS.ANIMATION_DELAY);
}

// 3D積み重ね対応の配置アルゴリズム
function packPallets2D(palletsToPlace, container, clearance) {
    const placed = [];
    const stackingEnabled = elements.enableStacking.checked;
    
    // パレットをタイプごとにグループ化
    const groups = {};
    palletsToPlace.forEach(pallet => {
        const key = `${pallet.length}x${pallet.width}`;
        if (!groups[key]) groups[key] = [];
        groups[key].push(pallet);
    });
    
    console.log(`グループ数: ${Object.keys(groups).length}`);
    Object.entries(groups).forEach(([key, pallets]) => {
        console.log(`  ${key}: ${pallets.length}個`);
    });
    
    let specialMaxX = 0;
    
    // 100×125パレットの特殊配置パターン
    if (groups['100x125'] && groups['100x125'].length >= 8) {
        const specialPlaced = trySpecialPattern100x125(groups['100x125'], container, clearance);
        if (specialPlaced.length > 0) {
            console.log(`100×125特殊パターンで ${specialPlaced.length} 個配置成功`);
            // 配置されたパレットの情報を更新
            specialPlaced.forEach(p => {
                const original = allPalletsGenerated.find(pallet => 
                    pallet.id === p.id && pallet.instance === p.instance
                );
                if (original) {
                    original.placed = true;
                    original.x = p.x;
                    original.y = p.y;
                    original.finalLength = p.finalLength;
                    original.finalWidth = p.finalWidth;
                    original.rotated = p.rotated;
                }
                placed.push({
                    x: p.x,
                    y: p.y,
                    length: p.finalLength,
                    width: p.finalWidth
                });
                specialMaxX = Math.max(specialMaxX, p.x + p.finalLength);
            });
        }
    }
    
    // 110×110パレットをグリッド配置
    if (groups['110x110']) {
        const startX = specialMaxX + clearance;
        const gridPlaced = placeGridPattern(groups['110x110'], container, clearance, placed, startX);
        gridPlaced.forEach(p => {
            const original = allPalletsGenerated.find(pallet => 
                pallet.id === p.id && pallet.instance === p.instance
            );
            if (original) {
                original.placed = true;
                original.x = p.x;
                original.y = p.y;
                original.finalLength = p.finalLength;
                original.finalWidth = p.finalWidth;
                original.rotated = p.rotated;
            }
            placed.push({
                x: p.x,
                y: p.y,
                length: p.finalLength,
                width: p.finalWidth
            });
        });
    }
    
    // 残りのパレットを通常配置
    const remainingPallets = palletsToPlace.filter(p => !p.placed);
    console.log(`残りパレット数: ${remainingPallets.length}`);
    
    // パレットをサイズでソート（大きいものから）
    remainingPallets.sort((a, b) => (b.length * b.width) - (a.length * a.width));
    
    remainingPallets.forEach(pallet => {
        let bestPosition = null;
        let bestScore = Infinity;
        let bestRotated = false;
        
        // 通常配置と回転配置の両方を試行
        const orientations = pallet.length !== pallet.width ?
            [[pallet.length, pallet.width, false], [pallet.width, pallet.length, true]] :
            [[pallet.length, pallet.width, false]];
        
        orientations.forEach(([length, width, rotated]) => {
            // グリッドベースで配置位置を探索
            for (let y = 0; y <= container.width - width; y += 5) {
                for (let x = 0; x <= container.length - length; x += 5) {
                    if (canPlace2D(x, y, length, width, placed, clearance)) {
                        // 左下を優先するスコア計算
                        const score = x + y * 2;
                        if (score < bestScore) {
                            bestScore = score;
                            bestPosition = { x, y };
                            bestRotated = rotated;
                        }
                    }
                }
            }
        });
        
        if (bestPosition) {
            pallet.placed = true;
            pallet.x = bestPosition.x;
            pallet.y = bestPosition.y;
            pallet.rotated = bestRotated;
            
            if (bestRotated) {
                pallet.finalLength = pallet.width;
                pallet.finalWidth = pallet.length;
            } else {
                pallet.finalLength = pallet.length;
                pallet.finalWidth = pallet.width;
            }
            
            placed.push({
                x: pallet.x,
                y: pallet.y,
                length: pallet.finalLength,
                width: pallet.finalWidth
            });
        }
    });
    
    console.log(`通常配置で追加配置: ${remainingPallets.filter(p => p.placed).length}個`);
    
    // 3D積み重ね処理
    if (stackingEnabled) {
        console.log('3D積み重ね処理を開始...');
        perform3DStacking(palletsToPlace, container, clearance, placed);
    }
    
    // 未配置パレットの整列
    const unplaced = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    if (unplaced.length > 0) {
        console.log(`未配置パレット: ${unplaced.length}個`);
        let offsetX = 0;
        let offsetY = container.width + 30;
        let currentRowMaxHeight = 0;
        
        unplaced.forEach(pallet => {
            if (offsetX + pallet.finalLength > container.length) {
                offsetX = 0;
                offsetY += currentRowMaxHeight + 10;
                currentRowMaxHeight = 0;
            }
            
            pallet.x = offsetX;
            pallet.y = offsetY;
            
            currentRowMaxHeight = Math.max(currentRowMaxHeight, pallet.finalWidth);
            offsetX += pallet.finalLength + 10;
        });
    }
}

// 100×125パレットの特殊配置パターン
function trySpecialPattern100x125(pallets, container, clearance) {
    const placedPallets = [];
    const areaPlaced = [];
    
    const topPattern = [true, false, true, false]; // rotated for top row
    const bottomPattern = [false, true, false, true]; // rotated for bottom row
    
    const startX = 0;
    const startY = 0;
    
    let topX = startX;
    let colHeights = [];
    
    // Place top row
    topPattern.forEach((rotated, col) => {
        if (placedPallets.length >= pallets.length) return;
        
        const pallet = pallets[placedPallets.length];
        const length = rotated ? 125 : 100;
        const width = rotated ? 100 : 125;
        const x = topX;
        const y = startY;
        
        if (canPlace2D(x, y, length, width, areaPlaced, clearance, container)) {
            placedPallets.push({
                ...pallet,
                x,
                y,
                finalLength: length,
                finalWidth: width,
                rotated,
                placed: true
            });
            
            areaPlaced.push({ x, y, length, width });
            colHeights[col] = width;
            topX += length + clearance;
        }
    });
    
    // Place bottom row
    let bottomX = startX;
    bottomPattern.forEach((rotated, col) => {
        if (placedPallets.length >= pallets.length) return;
        
        const pallet = pallets[placedPallets.length];
        const length = rotated ? 125 : 100;
        const width = rotated ? 100 : 125;
        const x = bottomX;
        const y = startY + (colHeights[col] || 0) + clearance;
        
        if (y + width <= container.width && canPlace2D(x, y, length, width, areaPlaced, clearance, container)) {
            placedPallets.push({
                ...pallet,
                x,
                y,
                finalLength: length,
                finalWidth: width,
                rotated,
                placed: true
            });
            
            areaPlaced.push({ x, y, length, width });
            bottomX += length + clearance;
        }
    });
    
    return placedPallets;
}

// グリッドパターン配置（110×110用）
function placeGridPattern(pallets, container, clearance, alreadyPlaced, startX) {
    const placedPallets = [];
    const length = 110;
    const width = 110;
    
    const cols = Math.floor((container.length - startX) / (length + clearance));
    const rows = Math.floor(container.width / (width + clearance));
    
    let palletIndex = 0;
    
    for (let row = 0; row < rows && palletIndex < pallets.length; row++) {
        for (let col = 0; col < cols && palletIndex < pallets.length; col++) {
            const x = startX + col * (length + clearance);
            const y = row * (width + clearance);
            
            if (canPlace2D(x, y, length, width, alreadyPlaced, clearance)) {
                const pallet = pallets[palletIndex++];
                placedPallets.push({
                    ...pallet,
                    x: x,
                    y: y,
                    finalLength: length,
                    finalWidth: width,
                    rotated: false,
                    placed: true
                });
            }
        }
    }
    
    console.log(`110×110 グリッド配置: ${cols}列×${rows}行で${placedPallets.length}個配置`);
    
    return placedPallets;
}

// 3D積み重ね処理
function perform3DStacking(palletsToPlace, container, clearance, placed2D) {
    console.log('3D積み重ね処理を実行中...');
    
    // 配置済みパレットを取得
    const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
    const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    
    if (unplacedPallets.length === 0) {
        console.log('積み重ね対象のパレットがありません');
        return;
    }
    
    // パレットを重量と高さでソート（重いもの、高いものを優先）
    unplacedPallets.sort((a, b) => {
        const weightDiff = (b.weight || 0) - (a.weight || 0);
        if (weightDiff !== 0) return weightDiff;
        return (b.height || 0) - (a.height || 0);
    });
    
    console.log(`積み重ね対象パレット: ${unplacedPallets.length}個`);
    
    // 各未配置パレットに対して積み重ね可能な位置を探索
    unplacedPallets.forEach(pallet => {
        if (pallet.placed) return;
        
        const bestStackPosition = findBestStackPosition(pallet, placedPallets, container, clearance);
        if (bestStackPosition) {
            // 積み重ね配置
            pallet.x = bestStackPosition.x;
            pallet.y = bestStackPosition.y;
            pallet.z = bestStackPosition.z;
            pallet.placed = true;
            pallet.stackedOn = bestStackPosition.stackedOn;
            
            // 積み重ね関係を更新
            if (bestStackPosition.stackedOn) {
                const basePallet = allPalletsGenerated.find(p => 
                    p.id === bestStackPosition.stackedOn.id && 
                    p.instance === bestStackPosition.stackedOn.instance
                );
                if (basePallet) {
                    basePallet.stackedBy.push({
                        id: pallet.id,
                        instance: pallet.instance
                    });
                }
            }
            
            console.log(`パレット#${pallet.palletNumber} を積み重ね配置: (${pallet.x}, ${pallet.y}, ${pallet.z})`);
        }
    });
    
    // 重心計算と安定性チェック
    const stabilityResult = calculateStackingStability(placedPallets);
    console.log('積み重ね安定性:', stabilityResult);
    
    // デバッグ出力
    debugLog('3D積み重ね完了', {
        totalPlaced: placedPallets.length + unplacedPallets.filter(p => p.placed).length,
        stackedCount: unplacedPallets.filter(p => p.placed && p.stackedOn).length,
        stability: stabilityResult
    });
}

// 最適な積み重ね位置を探索
function findBestStackPosition(pallet, placedPallets, container, clearance) {
    let bestPosition = null;
    let bestScore = -Infinity;
    
    // 各配置済みパレットの上に積み重ねを試行
    placedPallets.forEach(basePallet => {
        // 積み重ね制約チェック
        if (!pallet.canStackBelow || !basePallet.canStackAbove) return;
        
        // サイズ制約チェック
        if (pallet.finalLength > basePallet.finalLength || 
            pallet.finalWidth > basePallet.finalWidth) return;
        
        // 高さ制約チェック（既存スタックの最上面を考慮）
        const containerHeight = containers[elements.containerType.value].height;
        const topZ = getTopZForBase(basePallet);
        const totalHeight = topZ + pallet.finalHeight;
        if (totalHeight > containerHeight) return;
        
        // 重量制約チェック（積み重ね制限）
        const totalWeight = calculateStackWeight(basePallet) + pallet.weight;
        if (totalWeight > 2000) return; // 積み重ね重量制限
        
        // 位置計算
        const x = basePallet.x;
        const y = basePallet.y;
        const z = topZ;
        
        // スコア計算（重心、重量分布、高さ効率を考慮）
        const score = calculateStackingScore(pallet, basePallet, x, y, z);
        
        if (score > bestScore) {
            bestScore = score;
            bestPosition = { x, y, z, stackedOn: basePallet };
        }
    });
    
    return bestPosition;
}

// 積み重ねスコア計算
function calculateStackingScore(pallet, basePallet, x, y, z) {
    let score = 0;
    
    // 高さ効率（高いほど良い）
    score += z * 0.1;
    
    // 重量分布（軽いものを上に）
    if (pallet.weight < basePallet.weight) score += 50;
    
    // サイズ適合度（ぴったり合うほど良い）
    const lengthFit = 1 - Math.abs(pallet.finalLength - basePallet.finalLength) / basePallet.finalLength;
    const widthFit = 1 - Math.abs(pallet.finalWidth - basePallet.finalWidth) / basePallet.finalWidth;
    score += (lengthFit + widthFit) * 25;
    
    // 重心安定性
    const centerX = (basePallet.x + basePallet.finalLength / 2 + pallet.finalLength / 2) / 2;
    const centerY = (basePallet.y + basePallet.finalWidth / 2 + pallet.finalWidth / 2) / 2;
    const containerCenterX = containers[elements.containerType.value].length / 2;
    const containerCenterY = containers[elements.containerType.value].width / 2;
    
    const distanceFromCenter = Math.sqrt(
        Math.pow(centerX - containerCenterX, 2) + 
        Math.pow(centerY - containerCenterY, 2)
    );
    score -= distanceFromCenter * 0.01; // 中心に近いほど良い
    
    return score;
}

// 積み重ね重量計算
function calculateStackWeight(basePallet) {
    let totalWeight = basePallet.weight || 0;
    
    // このパレットの上に積まれているパレットの重量（再帰的）を加算
    (basePallet.stackedBy || []).forEach(stackedPallet => {
        const pallet = allPalletsGenerated.find(p => 
            p.id === stackedPallet.id && p.instance === stackedPallet.instance
        );
        if (pallet) {
            totalWeight += pallet.weight || 0;
            totalWeight += calculateStackWeight(pallet) - (pallet.weight || 0);
        }
    });
    
    return totalWeight;
}

// 基底パレットの現在の最上面Z座標（z + height）の取得
function getTopZForBase(basePallet) {
    let topZ = (basePallet.z || 0) + (basePallet.finalHeight || 0);
    
    (basePallet.stackedBy || []).forEach(stackedPallet => {
        const pallet = allPalletsGenerated.find(p => 
            p.id === stackedPallet.id && p.instance === stackedPallet.instance
        );
        if (pallet && pallet.placed) {
            const palletTop = (pallet.z || 0) + (pallet.finalHeight || 0);
            if (palletTop > topZ) topZ = palletTop;
        }
    });
    
    return topZ;
}

// 積み重ね安定性計算
function calculateStackingStability(placedPallets) {
    const container = containers[elements.containerType.value];
    let totalWeight = 0;
    let weightedCenterX = 0;
    let weightedCenterY = 0;
    let weightedCenterZ = 0;
    
    placedPallets.forEach(pallet => {
        const weight = pallet.weight || 0;
        totalWeight += weight;
        
        const centerX = pallet.x + pallet.finalLength / 2;
        const centerY = pallet.y + pallet.finalWidth / 2;
        const centerZ = pallet.z + pallet.finalHeight / 2;
        
        weightedCenterX += centerX * weight;
        weightedCenterY += centerY * weight;
        weightedCenterZ += centerZ * weight;
    });
    
    if (totalWeight === 0) return { stable: true, centerOfGravity: { x: 0, y: 0, z: 0 } };
    
    const centerOfGravity = {
        x: weightedCenterX / totalWeight,
        y: weightedCenterY / totalWeight,
        z: weightedCenterZ / totalWeight
    };
    
    // 重心がコンテナ中心に近いほど安定
    const containerCenterX = container.length / 2;
    const containerCenterY = container.width / 2;
    const containerCenterZ = container.height / 2;
    
    const distanceFromCenter = Math.sqrt(
        Math.pow(centerOfGravity.x - containerCenterX, 2) + 
        Math.pow(centerOfGravity.y - containerCenterY, 2) + 
        Math.pow(centerOfGravity.z - containerCenterZ, 2)
    );
    
    const maxDistance = Math.sqrt(
        Math.pow(container.length / 2, 2) + 
        Math.pow(container.width / 2, 2) + 
        Math.pow(container.height / 2, 2)
    );
    
    const stability = Math.max(0, 100 - (distanceFromCenter / maxDistance) * 100);
    
    return {
        stable: stability > 70,
        stability: Math.round(stability),
        centerOfGravity,
        totalWeight,
        distanceFromCenter: Math.round(distanceFromCenter)
    };
}

// レンダリング関数
function renderAllPallets(container) {
    const containerFloor = elements.containerFloor;
    const workArea = containerFloor.parentElement;
    
    renderConfig.scale = utils.calculateScale(container);
    const actualDisplayWidth = container.length * renderConfig.scale;
    const actualDisplayHeight = container.width * renderConfig.scale;
    
    // コンテナの表示設定
    containerFloor.style.width = `${actualDisplayWidth}px`;
    containerFloor.style.height = `${actualDisplayHeight}px`;
    containerFloor.style.position = 'absolute';
    containerFloor.style.left = `${CONSTANTS.CONTAINER_OFFSET_X}px`;
    containerFloor.style.top = `${CONSTANTS.CONTAINER_OFFSET_Y}px`;
    
    // 作業エリアのサイズ計算
    const unplacedPallets = allPalletsGenerated.filter(p => !p.deleted && !p.placed);
    let maxBottomY = actualDisplayHeight + CONSTANTS.CONTAINER_OFFSET_Y;
    
    if (unplacedPallets.length > 0) {
        const bottomMostY = Math.max(...unplacedPallets.map(p => 
            ((p.y + p.finalWidth) * renderConfig.scale) + CONSTANTS.CONTAINER_OFFSET_Y
        ));
        maxBottomY = Math.max(maxBottomY, bottomMostY + 50);
    }
    
    workArea.style.width = `${actualDisplayWidth + CONSTANTS.CONTAINER_OFFSET_X + 50}px`;
    workArea.style.height = `${Math.max(maxBottomY, 400 + CONSTANTS.CONTAINER_OFFSET_Y)}px`;
    workArea.style.position = 'relative';
    
    // 既存のパレットを削除
    workArea.querySelectorAll('.pallet-2d').forEach(el => el.remove());
    
    // パレットを描画
    allPalletsGenerated.forEach(pallet => {
        if (pallet.deleted) return;
        
        const el = document.createElement('div');
        el.className = 'pallet-2d';
        el.dataset.palletId = pallet.id;
        el.dataset.instance = pallet.instance;
        
        const palletWidth = pallet.finalLength * renderConfig.scale;
        const palletHeight = pallet.finalWidth * renderConfig.scale;
        const palletLeft = (pallet.x * renderConfig.scale) + CONSTANTS.CONTAINER_OFFSET_X;
        const palletTop = (pallet.y * renderConfig.scale) + CONSTANTS.CONTAINER_OFFSET_Y;
        
        Object.assign(el.style, {
            width: `${palletWidth}px`,
            height: `${palletHeight}px`,
            left: `${palletLeft}px`,
            top: `${palletTop}px`,
            background: pallet.color,
            position: 'absolute'
        });
        
        if (pallet.rotated) {
            el.style.background = `repeating-linear-gradient(45deg, ${pallet.color}, ${pallet.color} 10px, ${utils.adjustColor(pallet.color, -20)} 10px, ${utils.adjustColor(pallet.color, -20)} 20px)`;
        }
        
        // 状態に応じたクラス付与
        const isOutside = isOutsideContainer(pallet, container);
        const isBottomPlaced = pallet.y > container.width;
        
        if (isBottomPlaced) {
            el.classList.add('bottom-placed');
        } else if (isOutside) {
            el.classList.add('outside-container');
        }
        
        // 3D積み重ねクラス付与
        if (elements.enableStacking.checked) {
            if (pallet.stackedOn) {
                el.classList.add('stacked');
            } else if (pallet.stackedBy.length > 0) {
                el.classList.add('base-pallet');
            }
        }
        
        // 3D情報を表示
        let stackInfo = '';
        if (elements.enableStacking.checked && pallet.stackedOn) {
            stackInfo = `<div style="font-size: 10px; color: #e74c3c; font-weight: bold; background: rgba(255,255,255,0.9); padding: 1px 3px; border-radius: 2px; border: 1px solid #e74c3c;">上段</div>`;
        } else if (elements.enableStacking.checked && pallet.stackedBy.length > 0) {
            stackInfo = `<div style="font-size: 10px; color: #27ae60; font-weight: bold; background: rgba(255,255,255,0.9); padding: 1px 3px; border-radius: 2px; border: 1px solid #27ae60;">下段</div>`;
        }
        
        const heightInfo = pallet.finalHeight > 0 ? ` H:${pallet.finalHeight}` : '';
        const weightInfo = pallet.weight > 0 ? ` ${pallet.weight}kg` : '';
        
        el.innerHTML = `
            <div class="pallet-label">#${pallet.palletNumber} ${pallet.finalLength}×${pallet.finalWidth}${heightInfo}${weightInfo}${pallet.rotated ? ' ↻' : ''}</div>
            ${stackInfo}
            <div class="pallet-controls">
                <button class="rotate-btn" title="回転">↻</button>
                <button class="delete-btn" title="削除">✕</button>
            </div>
        `;
        
        workArea.appendChild(el);
    });
    
    // レンダリング設定を保存
    renderConfig.containerBounds = {
        left: CONSTANTS.CONTAINER_OFFSET_X,
        top: CONSTANTS.CONTAINER_OFFSET_Y,
        width: actualDisplayWidth,
        height: actualDisplayHeight
    };
    
    enableDragAndDropAndActions();
}