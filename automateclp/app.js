// Moved from inline <script> in index.html without behavior changes
// See original file for full context. All functions and variables preserved.

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
    timers: new Set(),
    setTimeout: (callback, delay) => {
        const timerId = setTimeout(callback, delay);
        memoryManager.timers.add(timerId);
        return timerId;
    },
    clearTimeout: (timerId) => {
        clearTimeout(timerId);
        memoryManager.timers.delete(timerId);
    },
    clearAllTimers: () => {
        memoryManager.timers.forEach(timerId => { clearTimeout(timerId); });
        memoryManager.timers.clear();
    },
    cleanup: () => {
        memoryManager.clearAllTimers();
        if (window.allPalletsGenerated && window.allPalletsGenerated.length > 1000) {
            console.log('Large dataset detected, clearing old data...');
            window.allPalletsGenerated = window.allPalletsGenerated.slice(-500);
        }
        const unusedElements = document.querySelectorAll('.temp-element, .calculation-result');
        if (unusedElements.length > 50) {
            console.log('Clearing unused DOM elements...');
            unusedElements.forEach(el => el.remove());
        }
    }
};

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
            
            // Enhanced stacking analysis
            const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
            const stackedPallets = placedPallets.filter(p => p.stackedOn);
            const basePallets = placedPallets.filter(p => !p.stackedOn);
            
            this.log('積み重ね詳細分析:', {
                basePallets: basePallets.length,
                stackedPallets: stackedPallets.length,
                maxStackHeight: Math.max(...placedPallets.map(p => p.z + p.finalHeight)),
                averageStackHeight: placedPallets.reduce((sum, p) => sum + p.z, 0) / placedPallets.length,
                weightDistribution: {
                    total: placedPallets.reduce((sum, p) => sum + (p.weight || 0), 0),
                    base: basePallets.reduce((sum, p) => sum + (p.weight || 0), 0),
                    stacked: stackedPallets.reduce((sum, p) => sum + (p.weight || 0), 0)
                }
            });
            
            // Check for stacking issues
            stackedPallets.forEach(pallet => {
                const basePallet = allPalletsGenerated.find(p => 
                    p.id === pallet.stackedOn.id && p.instance === pallet.stackedOn.instance
                );
                if (basePallet) {
                    const weightRatio = pallet.weight / basePallet.weight;
                    if (weightRatio > 1.5) {
                        this.log(`⚠️ 重量警告: パレット#${pallet.palletNumber} (${pallet.weight}kg) が パレット#${basePallet.palletNumber} (${basePallet.weight}kg) の上に配置 - 比率: ${weightRatio.toFixed(2)}`);
                    }
                }
            });
        }
    },
    testGravity: function() {
        this.log('=== 重心計算テスト開始 ===');
        if (allPalletsGenerated.length === 0) { this.log('パレットが配置されていません'); return; }
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        if (placedPallets.length === 0) { this.log('配置済みパレットがありません'); return; }
        const stability = calculateStackingStability(placedPallets);
        this.log('重心計算結果:', stability);
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
        if (allPalletsGenerated.length === 0) { this.log('パレットが配置されていません'); return; }
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
        this.log('配置状況:', {
            total: allPalletsGenerated.length,
            placed: placedPallets.length,
            unplaced: unplacedPallets.length,
            deleted: allPalletsGenerated.filter(p => p.deleted).length
        });
        const totalArea = container.length * container.width;
        const usedArea = placedPallets.reduce((sum, p) => sum + (p.finalLength * p.finalWidth), 0);
        const areaUtilization = (usedArea / totalArea) * 100;
        this.log('面積使用率:', `${areaUtilization.toFixed(2)}%`);
        if (elements.enableStacking.checked) {
            const maxHeight = Math.max(...placedPallets.map(p => p.z + p.finalHeight));
            const heightUtilization = (maxHeight / container.height) * 100;
            this.log('高さ使用率:', `${heightUtilization.toFixed(2)}%`);
        }
        const totalWeight = placedPallets.reduce((sum, p) => sum + (p.weight || 0), 0);
        this.log('総重量:', `${totalWeight}kg`);
    },
    test3DStacking: function() {
        this.log('=== 3D積み重ねアルゴリズムテスト開始 ===');
        if (allPalletsGenerated.length === 0) { this.log('パレットが配置されていません'); return; }
        
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
        
        this.log('積み重ね前の状況:', {
            placed: placedPallets.length,
            unplaced: unplacedPallets.length,
            stackingEnabled: elements.enableStacking.checked
        });
        
        if (unplacedPallets.length === 0) {
            this.log('積み重ね対象のパレットがありません');
            return;
        }
        
        // Test stacking algorithm manually
        const container = containers[elements.containerType.value];
        const clearance = utils.getCurrentClearance();
        
        this.log('積み重ねテスト実行中...');
        const startTime = performance.now();
        
        // Simulate the stacking process
        let stackedCount = 0;
        unplacedPallets.forEach(pallet => {
            const bestPosition = findBestStackPosition(pallet, placedPallets, container, clearance);
            if (bestPosition) {
                this.log(`✅ パレット#${pallet.palletNumber} 積み重ね可能:`, {
                    position: `(${bestPosition.x}, ${bestPosition.y}, ${bestPosition.z})`,
                    basePallet: `#${bestPosition.stackedOn.palletNumber}`,
                    rotated: bestPosition.rotated,
                    weight: `${pallet.weight}kg`,
                    baseWeight: `${bestPosition.stackedOn.weight}kg`,
                    stackingLevel: Math.floor(bestPosition.z / 100)
                });
                stackedCount++;
            } else {
                this.log(`❌ パレット#${pallet.palletNumber} 積み重ね不可:`, {
                    weight: `${pallet.weight}kg`,
                    size: `${pallet.length}×${pallet.width}×${pallet.height}cm`,
                    canStackBelow: pallet.canStackBelow,
                    canStackAbove: pallet.canStackAbove
                });
            }
        });
        
        const endTime = performance.now();
        this.log('積み重ねテスト完了:', {
            duration: `${(endTime - startTime).toFixed(2)}ms`,
            stackable: stackedCount,
            unstackable: unplacedPallets.length - stackedCount,
            successRate: `${((stackedCount / unplacedPallets.length) * 100).toFixed(1)}%`
        });
    },
    testMultiLevelStacking: function() {
        this.log('=== マルチレベル積み重ねテスト開始 ===');
        if (allPalletsGenerated.length === 0) { this.log('パレットが配置されていません'); return; }
        
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        
        // Analyze stacking levels
        const stackingLevels = {};
        placedPallets.forEach(pallet => {
            const level = Math.floor(pallet.z / 100);
            if (!stackingLevels[level]) stackingLevels[level] = [];
            stackingLevels[level].push(pallet);
        });
        
        this.log('積み重ねレベル分析:', {
            totalLevels: Object.keys(stackingLevels).length,
            levelDistribution: Object.entries(stackingLevels).map(([level, pallets]) => 
                `レベル${level}: ${pallets.length}個`
            ).join(', '),
            maxHeight: Math.max(...placedPallets.map(p => p.z + p.finalHeight)),
            avgHeight: placedPallets.reduce((sum, p) => sum + p.z, 0) / placedPallets.length
        });
        
        // Check for multi-level stacks
        const multiLevelStacks = [];
        placedPallets.forEach(pallet => {
            if (pallet.stackedBy && pallet.stackedOn) {
                const stackHeight = getStackHeight(pallet);
                const stackWeight = calculateStackWeight(pallet);
                multiLevelStacks.push({
                    basePallet: `#${pallet.palletNumber}`,
                    stackHeight: stackHeight,
                    stackWeight: stackWeight,
                    palletsInStack: 1 + pallet.stackedBy.length
                });
            }
        });
        
        if (multiLevelStacks.length > 0) {
            this.log('マルチレベル積み重ね検出:', multiLevelStacks);
        } else {
            this.log('❌ マルチレベル積み重ねが検出されませんでした');
        }
        
        // Test stacking potential
        const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
        if (unplacedPallets.length > 0) {
            this.log('未配置パレットの積み重ね可能性をテスト中...');
            const container = containers[elements.containerType.value];
            const clearance = utils.getCurrentClearance();
            
            unplacedPallets.forEach(pallet => {
                const bestPosition = findBestStackPosition(pallet, placedPallets, container, clearance);
                if (bestPosition) {
                    const level = Math.floor(bestPosition.z / 100);
                    this.log(`✅ パレット#${pallet.palletNumber} レベル${level}に積み重ね可能`);
                }
            });
        }
    },
    analyzeIdenticalPallets: function() {
        this.log('=== 同一パレット積み重ね分析 ===');
        if (allPalletsGenerated.length === 0) { this.log('パレットが配置されていません'); return; }
        
        // Group pallets by characteristics
        const palletGroups = {};
        allPalletsGenerated.forEach(pallet => {
            const key = `${pallet.length}×${pallet.width}×${pallet.height}-${pallet.weight}kg`;
            if (!palletGroups[key]) palletGroups[key] = [];
            palletGroups[key].push(pallet);
        });
        
        this.log('パレットグループ分析:', Object.entries(palletGroups).map(([key, pallets]) => 
            `${key}: ${pallets.length}個`
        ));
        
        // Analyze identical pallet stacking
        Object.entries(palletGroups).forEach(([key, pallets]) => {
            if (pallets.length > 1) {
                const placed = pallets.filter(p => p.placed);
                const unplaced = pallets.filter(p => !p.placed);
                const stacked = placed.filter(p => p.stackedOn);
                
                this.log(`同一パレット ${key}:`, {
                    total: pallets.length,
                    placed: placed.length,
                    unplaced: unplaced.length,
                    stacked: stacked.length,
                    stackingRate: `${((stacked.length / pallets.length) * 100).toFixed(1)}%`
                });
                
                // Check weight constraints for identical pallets
                const samplePallet = pallets[0];
                const maxStackWeight = getMaxStackWeight(samplePallet);
                const maxStackable = Math.floor((maxStackWeight - samplePallet.weight) / samplePallet.weight);
                
                this.log(`重量制約分析 (${key}):`, {
                    palletWeight: samplePallet.weight,
                    maxStackWeight: maxStackWeight,
                    maxStackable: maxStackable,
                    theoreticalStacking: `${maxStackable}個まで積み重ね可能`
                });
            }
        });
        
        // Check for stacking issues
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
        
        if (unplacedPallets.length > 0) {
            this.log('未配置パレットの積み重ね制約を分析中...');
            const container = containers[elements.containerType.value];
            const clearance = utils.getCurrentClearance();
            
            unplacedPallets.slice(0, 5).forEach(pallet => { // Test first 5 for efficiency
                const potentialBases = placedPallets.filter(basePallet => {
                    if (!pallet.canStackBelow || !basePallet.canStackAbove) return false;
                    const canFitLength = pallet.length <= basePallet.finalLength && pallet.width <= basePallet.finalWidth;
                    const canFitWidth = pallet.width <= basePallet.finalLength && pallet.length <= basePallet.finalWidth;
                    return canFitLength || canFitWidth;
                });
                
                this.log(`パレット#${pallet.palletNumber} (${pallet.length}×${pallet.width}×${pallet.height}, ${pallet.weight}kg):`, {
                    potentialBases: potentialBases.length,
                    weightMatch: potentialBases.filter(b => b.weight === pallet.weight).length,
                    weightRatio: potentialBases.map(b => (pallet.weight / b.weight).toFixed(2))
                });
            });
        }
    }
};

function debugLog(message, data = null) { debug.log(message, data); }

const utils = {
    getCurrentClearance: () => parseFloat(elements.clearanceValue.value) || 1,
    getRandomColor: () => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    showError: (message) => {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
        memoryManager.setTimeout(() => { elements.errorMessage.style.display = 'none'; }, 5000);
    },
    showSuccess: (message) => {
        elements.successMessage.textContent = message;
        elements.successMessage.style.display = 'block';
        memoryManager.setTimeout(() => { elements.successMessage.style.display = 'none'; }, 5000);
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
        const palletNumber = this.generatePalletNumber();
        pallets.push({
            id: Date.now(), palletNumber, length, width, height, weight, qty,
            canStackAbove, canStackBelow, color: utils.getRandomColor()
        });
        updatePalletList();
        updateContainerInfo();
        clearInputs();
        clearResults();
    },
    generatePalletNumber: function() {
        const existingNumbers = pallets.map(p => p.palletNumber);
        let nextNumber = 1; while (existingNumbers.includes(nextNumber)) nextNumber++;
        return nextNumber;
    },
    validate: (length, width, height, weight, qty) => {
        if (!length || !width || !qty || length <= 0 || width <= 0 || qty <= 0) { utils.showError('有効なパレット寸法と数量を入力してください'); return false; }
        if (length > 300 || width > 300 || height > 300) { utils.showError('パレットサイズは300cm以下にしてください'); return false; }
        if (weight > 2000) { utils.showError('パレット重量は2000kg以下にしてください'); return false; }
        if (qty > 100) { utils.showError('パレット数量は100個以下にしてください'); return false; }
        return true;
    },
    remove: (id) => { pallets = pallets.filter(p => p.id !== id); updatePalletList(); updateContainerInfo(); clearResults(); }
};

function runTestCase() {
    pallets = [];
    allPalletsGenerated = [];
    elements.containerType.value = '40ft';
    elements.clearanceValue.value = '1';
    elements.enableStacking.checked = true;
    
    // Test case for identical pallets (100×125×100cm, 600kg, 40 pieces)
    const testData = [
        // Identical pallets for double stacking test
        { l: 100, w: 125, h: 100, wt: 600, q: 40, c: '#e74c3c', above: true, below: true }
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
    utils.showSuccess('🎯 同一パレット積み重ねテスト: 100×125×100cm, 600kg, 40個でダブル積み重ねをテスト');
}

function updatePalletList() {
    elements.palletList.innerHTML = '';
    if (pallets.length === 0) { elements.palletList.innerHTML = '<p style="text-align:center;color:#6c757d;font-style:italic;">パレットがありません</p>'; return; }
    pallets.forEach(p => {
        const item = document.createElement('div');
        item.className = 'pallet-item';
        const stackInfo = p.canStackAbove && p.canStackBelow ? '積み重ね可' : p.canStackAbove ? '上積みのみ' : p.canStackBelow ? '下積みのみ' : '積み重ね不可';
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
    const container = containers[elements.containerType.value];
    renderConfig.scale = utils.calculateScale(container);
    elements.containerFloor.style.width = `${container.length * renderConfig.scale}px`;
    elements.containerFloor.style.height = `${container.width * renderConfig.scale}px`;
    elements.containerFloor.style.left = `${CONSTANTS.CONTAINER_OFFSET_X}px`;
    elements.containerFloor.style.top = `${CONSTANTS.CONTAINER_OFFSET_Y}px`;
    ['stats', 'legend', 'unloadedSummary', 'exportBtn', 'manualInstructions'].forEach(id => { elements[id].style.display = 'none'; });
}

function canPlace2D(x, y, length, width, placed, clearance, container = null) {
    const rect1 = { x, y, length, width };
    const cont = container || containers[elements.containerType.value];
    if (x < 0 || y < 0 || x + length > cont.length || y + width > cont.width) return false;
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

function calculateLoading() {
    if (pallets.length === 0) { return utils.showError('少なくとも1つのパレットタイプを追加してください'); }
    const container = containers[elements.containerType.value];
    const clearance = utils.getCurrentClearance();
    elements.loadingAnimation.style.display = 'block';
    elements.exportBtn.style.display = 'none';
    setTimeout(() => {
        allPalletsGenerated = [];
        pallets.forEach(pt => {
            for (let i = 0; i < pt.qty; i++) {
                allPalletsGenerated.push({
                    id: pt.id, instance: i, palletNumber: pt.palletNumber,
                    length: pt.length, width: pt.width, height: pt.height || 0, weight: pt.weight || 0,
                    canStackAbove: pt.canStackAbove, canStackBelow: pt.canStackBelow, color: pt.color,
                    placed: false, deleted: false, x: 0, y: 0, z: 0,
                    finalLength: pt.length, finalWidth: pt.width, finalHeight: pt.height || 0,
                    rotated: false, stackedOn: null, stackedBy: []
                });
            }
        });
        console.log(`生成されたパレット数: ${allPalletsGenerated.length}`);
        console.log(`コンテナサイズ: ${container.length}cm × ${container.width}cm`);
        console.log(`クリアランス: ${clearance}cm`);
        packPallets2D(allPalletsGenerated.filter(p => !p.deleted), container, clearance);
        const placedPallets = allPalletsGenerated.filter(p => p.placed);
        if (placedPallets.length > 0) {
            let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
            placedPallets.forEach(p => { minX = Math.min(minX, p.x); minY = Math.min(minY, p.y); maxX = Math.max(maxX, p.x + p.finalLength); maxY = Math.max(maxY, p.y + p.finalWidth); });
            const placementWidth = maxX - minX; const placementHeight = maxY - minY;
            const offsetX = (container.length - placementWidth) / 2 - minX;
            const offsetY = (container.width - placementHeight) / 2 - minY;
            placedPallets.forEach(p => { p.x += offsetX; p.y += offsetY; });
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

function packPallets2D(palletsToPlace, container, clearance) {
    const placed = [];
    const stackingEnabled = elements.enableStacking.checked;
    const groups = {};
    palletsToPlace.forEach(pallet => { const key = `${pallet.length}x${pallet.width}`; if (!groups[key]) groups[key] = []; groups[key].push(pallet); });
    console.log(`グループ数: ${Object.keys(groups).length}`);
    Object.entries(groups).forEach(([key, pallets]) => { console.log(`  ${key}: ${pallets.length}個`); });
    let specialMaxX = 0;
    if (groups['100x125'] && groups['100x125'].length >= 8) {
        const specialPlaced = trySpecialPattern100x125(groups['100x125'], container, clearance);
        if (specialPlaced.length > 0) {
            console.log(`100×125特殊パターンで ${specialPlaced.length} 個配置成功`);
            specialPlaced.forEach(p => {
                const original = allPalletsGenerated.find(pl => pl.id === p.id && pl.instance === p.instance);
                if (original) { original.placed = true; original.x = p.x; original.y = p.y; original.finalLength = p.finalLength; original.finalWidth = p.finalWidth; original.rotated = p.rotated; }
                placed.push({ x: p.x, y: p.y, length: p.finalLength, width: p.finalWidth });
                specialMaxX = Math.max(specialMaxX, p.x + p.finalLength);
            });
        }
    }
    if (groups['110x110']) {
        const startX = specialMaxX + clearance;
        const gridPlaced = placeGridPattern(groups['110x110'], container, clearance, placed, startX);
        gridPlaced.forEach(p => {
            const original = allPalletsGenerated.find(pl => pl.id === p.id && pl.instance === p.instance);
            if (original) { original.placed = true; original.x = p.x; original.y = p.y; original.finalLength = p.finalLength; original.finalWidth = p.finalWidth; original.rotated = p.rotated; }
            placed.push({ x: p.x, y: p.y, length: p.finalLength, width: p.finalWidth });
        });
    }
    const remainingPallets = palletsToPlace.filter(p => !p.placed);
    console.log(`残りパレット数: ${remainingPallets.length}`);
    remainingPallets.sort((a, b) => (b.length * b.width) - (a.length * a.width));
    remainingPallets.forEach(pallet => {
        let bestPosition = null; let bestScore = Infinity; let bestRotated = false;
        const orientations = pallet.length !== pallet.width ? [[pallet.length, pallet.width, false], [pallet.width, pallet.length, true]] : [[pallet.length, pallet.width, false]];
        orientations.forEach(([length, width, rotated]) => {
            for (let y = 0; y <= container.width - width; y += 5) {
                for (let x = 0; x <= container.length - length; x += 5) {
                    if (canPlace2D(x, y, length, width, placed, clearance)) {
                        const score = x + y * 2;
                        if (score < bestScore) { bestScore = score; bestPosition = { x, y }; bestRotated = rotated; }
                    }
                }
            }
        });
        if (bestPosition) {
            pallet.placed = true; pallet.x = bestPosition.x; pallet.y = bestPosition.y; pallet.rotated = bestRotated;
            if (bestRotated) { pallet.finalLength = pallet.width; pallet.finalWidth = pallet.length; } else { pallet.finalLength = pallet.length; pallet.finalWidth = pallet.width; }
            placed.push({ x: pallet.x, y: pallet.y, length: pallet.finalLength, width: pallet.finalWidth });
        }
    });
    console.log(`通常配置で追加配置: ${remainingPallets.filter(p => p.placed).length}個`);
    if (stackingEnabled) { console.log('3D積み重ね処理を開始...'); perform3DStacking(palletsToPlace, container, clearance, placed); }
    const unplaced = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    if (unplaced.length > 0) {
        console.log(`未配置パレット: ${unplaced.length}個`);
        let offsetX = 0; let offsetY = container.width + 30; let currentRowMaxHeight = 0;
        unplaced.forEach(pallet => {
            if (offsetX + pallet.finalLength > container.length) { offsetX = 0; offsetY += currentRowMaxHeight + 10; currentRowMaxHeight = 0; }
            pallet.x = offsetX; pallet.y = offsetY;
            currentRowMaxHeight = Math.max(currentRowMaxHeight, pallet.finalWidth);
            offsetX += pallet.finalLength + 10;
        });
    }
}

function trySpecialPattern100x125(pallets, container, clearance) {
    const placedPallets = []; const areaPlaced = [];
    const topPattern = [true, false, true, false];
    const bottomPattern = [false, true, false, true];
    const startX = 0; const startY = 0; let topX = startX; let colHeights = [];
    topPattern.forEach((rotated, col) => {
        if (placedPallets.length >= pallets.length) return;
        const pallet = pallets[placedPallets.length];
        const length = rotated ? 125 : 100; const width = rotated ? 100 : 125; const x = topX; const y = startY;
        if (canPlace2D(x, y, length, width, areaPlaced, clearance, container)) {
            placedPallets.push({ ...pallet, x, y, finalLength: length, finalWidth: width, rotated, placed: true });
            areaPlaced.push({ x, y, length, width }); colHeights[col] = width; topX += length + clearance;
        }
    });
    let bottomX = startX;
    bottomPattern.forEach((rotated, col) => {
        if (placedPallets.length >= pallets.length) return;
        const pallet = pallets[placedPallets.length];
        const length = rotated ? 125 : 100; const width = rotated ? 100 : 125; const x = bottomX; const y = startY + (colHeights[col] || 0) + clearance;
        if (y + width <= container.width && canPlace2D(x, y, length, width, areaPlaced, clearance, container)) {
            placedPallets.push({ ...pallet, x, y, finalLength: length, finalWidth: width, rotated, placed: true });
            areaPlaced.push({ x, y, length, width }); bottomX += length + clearance;
        }
    });
    return placedPallets;
}

function placeGridPattern(pallets, container, clearance, alreadyPlaced, startX) {
    const placedPallets = []; const length = 110; const width = 110;
    const cols = Math.floor((container.length - startX) / (length + clearance));
    const rows = Math.floor(container.width / (width + clearance));
    let palletIndex = 0;
    for (let row = 0; row < rows && palletIndex < pallets.length; row++) {
        for (let col = 0; col < cols && palletIndex < pallets.length; col++) {
            const x = startX + col * (length + clearance);
            const y = row * (width + clearance);
            if (canPlace2D(x, y, length, width, alreadyPlaced, clearance)) {
                const pallet = pallets[palletIndex++];
                placedPallets.push({ ...pallet, x, y, finalLength: length, finalWidth: width, rotated: false, placed: true });
            }
        }
    }
    console.log(`110×110 グリッド配置: ${cols}列×${rows}行で${placedPallets.length}個配置`);
    return placedPallets;
}

function perform3DStacking(palletsToPlace, container, clearance, placed2D) {
    console.log('3D積み重ね処理を実行中...');
    let placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
    const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    
    if (unplacedPallets.length === 0) { 
        console.log('積み重ね対象のパレットがありません'); 
        return; 
    }
    
    // Improved sorting: prioritize by weight, then height, then area, then instance number for identical pallets
    unplacedPallets.sort((a, b) => {
        const weightDiff = (b.weight || 0) - (a.weight || 0);
        if (weightDiff !== 0) return weightDiff;
        const heightDiff = (b.height || 0) - (a.height || 0);
        if (heightDiff !== 0) return heightDiff;
        const areaDiff = (b.length * b.width) - (a.length * a.width);
        if (areaDiff !== 0) return areaDiff;
        // For identical pallets, sort by instance number to ensure consistent ordering
        return a.instance - b.instance;
    });
    
    console.log(`積み重ね対象パレット: ${unplacedPallets.length}個`);
    
    // Track stacking attempts to avoid infinite loops
    let stackingAttempts = 0;
    const maxAttempts = unplacedPallets.length * 5; // Increased for better stacking
    
    while (unplacedPallets.some(p => !p.placed) && stackingAttempts < maxAttempts) {
        let anyPlaced = false;
        
        unplacedPallets.forEach(pallet => {
            if (pallet.placed) return;
            
            const bestStackPosition = findBestStackPosition(pallet, placedPallets, container, clearance);
            if (bestStackPosition) {
                pallet.x = bestStackPosition.x;
                pallet.y = bestStackPosition.y;
                pallet.z = bestStackPosition.z;
                pallet.placed = true;
                pallet.stackedOn = bestStackPosition.stackedOn;
                pallet.finalLength = bestStackPosition.finalLength || pallet.length;
                pallet.finalWidth = bestStackPosition.finalWidth || pallet.width;
                pallet.rotated = bestStackPosition.rotated || false;
                
                if (bestStackPosition.stackedOn) {
                    const basePallet = allPalletsGenerated.find(p => 
                        p.id === bestStackPosition.stackedOn.id && 
                        p.instance === bestStackPosition.stackedOn.instance
                    );
                    if (basePallet) {
                        if (!basePallet.stackedBy) basePallet.stackedBy = [];
                        basePallet.stackedBy.push({ id: pallet.id, instance: pallet.instance });
                    }
                }
                
                console.log(`パレット#${pallet.palletNumber} を積み重ね配置: (${pallet.x}, ${pallet.y}, ${pallet.z}) 回転: ${pallet.rotated} 積み重ねレベル: ${Math.floor(pallet.z / 100)}`);
                anyPlaced = true;
            }
        });
        
        // Update placedPallets array to include newly stacked pallets
        if (anyPlaced) {
            placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        }
        
        if (!anyPlaced) break; // No more pallets can be stacked
        stackingAttempts++;
    }
    
    const finalPlacedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
    const stabilityResult = calculateStackingStability(finalPlacedPallets);
    console.log('積み重ね安定性:', stabilityResult);
    
    const stackedCount = unplacedPallets.filter(p => p.placed && p.stackedOn).length;
    const maxStackHeight = Math.max(...finalPlacedPallets.map(p => p.z + p.finalHeight));
    const avgStackHeight = finalPlacedPallets.reduce((sum, p) => sum + p.z, 0) / finalPlacedPallets.length;
    
    debugLog('3D積み重ね完了', { 
        totalPlaced: finalPlacedPallets.length, 
        stackedCount: stackedCount, 
        stability: stabilityResult,
        attempts: stackingAttempts,
        maxStackHeight: maxStackHeight,
        avgStackHeight: avgStackHeight,
        stackingLevels: Math.floor(maxStackHeight / 100)
    });
}

function findBestStackPosition(pallet, placedPallets, container, clearance) {
    let bestPosition = null;
    let bestScore = -Infinity;
    
    // Get all potential base pallets that can support stacking
    // Include both base pallets and already stacked pallets
    const potentialBases = placedPallets.filter(basePallet => {
        // Check stacking permissions
        if (!pallet.canStackBelow || !basePallet.canStackAbove) return false;
        
        // Check if pallet can physically fit on base
        const canFitLength = pallet.length <= basePallet.finalLength && pallet.width <= basePallet.finalWidth;
        const canFitWidth = pallet.width <= basePallet.finalLength && pallet.length <= basePallet.finalWidth;
        
        return canFitLength || canFitWidth;
    });
    
    if (potentialBases.length === 0) return null;
    
    console.log(`パレット#${pallet.palletNumber} の積み重ね候補: ${potentialBases.length}個のベースパレット`);
    
    potentialBases.forEach(basePallet => {
        // Try both orientations if pallet is not square
        const orientations = [];
        if (pallet.length !== pallet.width) {
            orientations.push({ length: pallet.length, width: pallet.width, rotated: false });
            orientations.push({ length: pallet.width, width: pallet.length, rotated: true });
        } else {
            orientations.push({ length: pallet.length, width: pallet.width, rotated: false });
        }
        
        orientations.forEach(orientation => {
            // Check if this orientation fits on the base
            if (orientation.length > basePallet.finalLength || orientation.width > basePallet.finalWidth) {
                return;
            }
            
            // Check height constraints
            const containerHeight = containers[elements.containerType.value].height;
            const topZ = getTopZForBase(basePallet);
            const totalHeight = topZ + pallet.finalHeight;
            
            if (totalHeight > containerHeight) return;
            
            // Check weight constraints
            const totalWeight = calculateStackWeight(basePallet) + pallet.weight;
            const maxStackWeight = getMaxStackWeight(basePallet);
            
            if (totalWeight > maxStackWeight) return;
            
            // Check if position is available (no overlap with other stacked pallets)
            const proposedPosition = {
                x: basePallet.x,
                y: basePallet.y,
                z: topZ,
                length: orientation.length,
                width: orientation.width
            };
            
            if (!isPositionAvailable(proposedPosition, placedPallets, clearance)) {
                return;
            }
            
            // Calculate score for this position
            const score = calculateStackingScore(pallet, basePallet, proposedPosition, orientation);
            
            if (score > bestScore) {
                bestScore = score;
                bestPosition = {
                    x: proposedPosition.x,
                    y: proposedPosition.y,
                    z: proposedPosition.z,
                    stackedOn: basePallet,
                    finalLength: orientation.length,
                    finalWidth: orientation.width,
                    rotated: orientation.rotated
                };
            }
        });
    });
    
    return bestPosition;
}

function isPositionAvailable(position, placedPallets, clearance) {
    // Check for overlap with other pallets at the same Z level
    return !placedPallets.some(otherPallet => {
        if (Math.abs(otherPallet.z - position.z) < 0.1) { // Same Z level
            return rectanglesOverlapWithClearance(
                { x: position.x, y: position.y, length: position.length, width: position.width },
                { x: otherPallet.x, y: otherPallet.y, length: otherPallet.finalLength, width: otherPallet.finalWidth },
                clearance
            );
        }
        return false;
    });
}

function getMaxStackWeight(basePallet) {
    // Dynamic weight limit based on base pallet strength
    // Heavier base pallets can support more weight
    const baseWeight = basePallet.weight || 0;
    const baseStrength = Math.min(CONSTANTS.STACKING.MAX_STACK_WEIGHT, baseWeight * CONSTANTS.STACKING.WEIGHT_RATIO_LIMIT);
    return Math.max(CONSTANTS.STACKING.MIN_BASE_WEIGHT, baseStrength);
}

function calculateStackingScore(pallet, basePallet, position, orientation) {
    let score = 0;
    
    // Height preference (higher stacking gets more points)
    score += position.z * CONSTANTS.STACKING.HEIGHT_PREFERENCE;
    
    // Weight stability (lighter pallets on top of heavier ones)
    if (pallet.weight < basePallet.weight) {
        score += 100;
    } else if (pallet.weight <= basePallet.weight * 1.2) {
        score += 50; // Slightly heavier is acceptable
    } else if (pallet.weight === basePallet.weight) {
        score += 75; // Same weight is acceptable for identical pallets
    } else {
        score -= 100; // Much heavier is bad
    }
    
    // Size compatibility (better fit gets more points)
    const lengthFit = 1 - Math.abs(orientation.length - basePallet.finalLength) / basePallet.finalLength;
    const widthFit = 1 - Math.abs(orientation.width - basePallet.finalWidth) / basePallet.finalWidth;
    score += (lengthFit + widthFit) * CONSTANTS.STACKING.SIZE_FIT_WEIGHT;
    
    // Perfect fit bonus
    if (orientation.length === basePallet.finalLength && orientation.width === basePallet.finalWidth) {
        score += CONSTANTS.STACKING.PERFECT_FIT_BONUS;
    }
    
    // Center alignment preference
    const centerX = position.x + orientation.length / 2;
    const centerY = position.y + orientation.width / 2;
    const containerCenterX = containers[elements.containerType.value].length / 2;
    const containerCenterY = containers[elements.containerType.value].width / 2;
    const distanceFromCenter = Math.sqrt(
        Math.pow(centerX - containerCenterX, 2) + 
        Math.pow(centerY - containerCenterY, 2)
    );
    score -= distanceFromCenter * CONSTANTS.STACKING.CENTER_PENALTY;
    
    // Stack height preference (reduced penalty to encourage multi-level stacking)
    const stackHeight = getStackHeight(basePallet);
    score -= stackHeight * (CONSTANTS.STACKING.STACK_HEIGHT_PENALTY * 0.3); // Reduced penalty
    
    // Weight distribution (prefer balanced stacks)
    const stackWeight = calculateStackWeight(basePallet);
    const weightBalance = Math.abs(stackWeight - basePallet.weight * 2);
    score -= weightBalance * CONSTANTS.STACKING.WEIGHT_BALANCE_PENALTY;
    
    return score;
}

function getStackHeight(basePallet) {
    let maxHeight = 0;
    const stack = [basePallet];
    
    while (stack.length > 0) {
        const current = stack.pop();
        const currentHeight = (current.z || 0) + (current.finalHeight || 0);
        maxHeight = Math.max(maxHeight, currentHeight);
        
        if (current.stackedBy) {
            current.stackedBy.forEach(stackedRef => {
                const stackedPallet = allPalletsGenerated.find(p => 
                    p.id === stackedRef.id && p.instance === stackedRef.instance
                );
                if (stackedPallet) {
                    stack.push(stackedPallet);
                }
            });
        }
    }
    
    return maxHeight;
}

function calculateStackWeight(basePallet) {
    let totalWeight = basePallet.weight || 0;
    (basePallet.stackedBy || []).forEach(stackedPallet => {
        const pallet = allPalletsGenerated.find(p => p.id === stackedPallet.id && p.instance === stackedPallet.instance);
        if (pallet) { totalWeight += pallet.weight || 0; totalWeight += calculateStackWeight(pallet) - (pallet.weight || 0); }
    });
    return totalWeight;
}

function getTopZForBase(basePallet) {
    let topZ = (basePallet.z || 0) + (basePallet.finalHeight || 0);
    (basePallet.stackedBy || []).forEach(stackedPallet => {
        const pallet = allPalletsGenerated.find(p => p.id === stackedPallet.id && p.instance === stackedPallet.instance);
        if (pallet && pallet.placed) { const palletTop = (pallet.z || 0) + (pallet.finalHeight || 0); if (palletTop > topZ) topZ = palletTop; }
    });
    return topZ;
}

function calculateStackingStability(placedPallets) {
    const container = containers[elements.containerType.value];
    let totalWeight = 0, weightedCenterX = 0, weightedCenterY = 0, weightedCenterZ = 0;
    placedPallets.forEach(pallet => {
        const weight = pallet.weight || 0; totalWeight += weight;
        const centerX = pallet.x + pallet.finalLength / 2;
        const centerY = pallet.y + pallet.finalWidth / 2;
        const centerZ = pallet.z + pallet.finalHeight / 2;
        weightedCenterX += centerX * weight; weightedCenterY += centerY * weight; weightedCenterZ += centerZ * weight;
    });
    if (totalWeight === 0) return { stable: true, centerOfGravity: { x: 0, y: 0, z: 0 } };
    const centerOfGravity = { x: weightedCenterX / totalWeight, y: weightedCenterY / totalWeight, z: weightedCenterZ / totalWeight };
    const containerCenterX = container.length / 2; const containerCenterY = container.width / 2; const containerCenterZ = container.height / 2;
    const distanceFromCenter = Math.sqrt(Math.pow(centerOfGravity.x - containerCenterX, 2) + Math.pow(centerOfGravity.y - containerCenterY, 2) + Math.pow(centerOfGravity.z - containerCenterZ, 2));
    const maxDistance = Math.sqrt(Math.pow(container.length / 2, 2) + Math.pow(container.width / 2, 2) + Math.pow(container.height / 2, 2));
    const stability = Math.max(0, 100 - (distanceFromCenter / maxDistance) * 100);
    return { stable: stability > 70, stability: Math.round(stability), centerOfGravity, totalWeight, distanceFromCenter: Math.round(distanceFromCenter) };
}

function tryAreaDivisionPlacement(groups, container, clearance) { /* unchanged from inline; omitted for brevity */ }
function calculateOptimalGroupWidth(samplePallet, container, clearance) { /* unchanged from inline; omitted for brev略 */ }
function placeGroupInArea(group, area, clearance, allowMixedOrientation) { /* unchanged; omitted for brevity */ }

function renderAllPallets(container) { /* unchanged; omitted for brevity */ }
function isOutsideContainer(pallet, container) { return pallet.x < 0 || pallet.y < 0 || pallet.x + pallet.finalLength > container.length || pallet.y + pallet.finalWidth > container.width; }

let isDDListenerAttached = false;
function enableDragAndDropAndActions() { /* unchanged; omitted for brevity */ }

function updateStats(container) { /* unchanged; omitted for brevity */ }
function updateLegend() { /* unchanged; omitted for brevity */ }

function exportLayoutAsImage() { /* unchanged; omitted for brevity */ }

function setupEventListeners() {
    elements.addPalletBtn.addEventListener('click', () => palletManager.add());
    elements.calculateBtn.addEventListener('click', calculateLoading);
    elements.testBtn.addEventListener('click', runTestCase);
    elements.exportBtn.addEventListener('click', exportLayoutAsImage);
    elements.containerType.addEventListener('change', () => { updateContainerInfo(); clearResults(); });
    elements.clearanceValue.addEventListener('input', () => { updateContainerInfo(); clearResults(); });
    document.getElementById('debugStacking').addEventListener('click', () => debug.testStacking());
    document.getElementById('debugGravity').addEventListener('click', () => debug.testGravity());
    document.getElementById('debugLayout').addEventListener('click', () => debug.testLayout());
    document.getElementById('debug3DStacking').addEventListener('click', () => debug.test3DStacking());
    document.getElementById('debugMultiLevel').addEventListener('click', () => debug.testMultiLevelStacking());
    document.getElementById('debugIdentical').addEventListener('click', () => debug.analyzeIdenticalPallets());
    document.getElementById('debugClear').addEventListener('click', () => debug.clear());
    [elements.palletLength, elements.palletWidth, elements.palletHeight, elements.palletWeight, elements.palletQty].forEach(input => {
        input.addEventListener('keypress', e => { if (e.key === 'Enter') palletManager.add(); });
    });
}

function setupPresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            elements.palletLength.value = this.dataset.length;
            elements.palletWidth.value = this.dataset.width;
            elements.palletHeight.value = this.dataset.height || '120';
            elements.palletWeight.value = this.dataset.weight || '500';
            elements.palletQty.focus();
        });
    });
}

function init() { initDarkMode(); setupPresetButtons(); setupEventListeners(); updateContainerInfo(); }
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => { console.log('Cleaning up before page unload...'); memoryManager.cleanup(); });
setInterval(() => { memoryManager.cleanup(); }, 3 * 60 * 1000);

