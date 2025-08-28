// AutomateCLP - Container Loading Planner with 3D Stacking
// Version 2.0.0 - 3D Stacking Features

// ===== CONSTANTS =====
const CONSTANTS = {
    CONTAINER_OFFSET_X: 25,
    CONTAINER_OFFSET_Y: 35,
    CONTAINER_DISPLAY_WIDTH: 800,
    CONTAINER_DISPLAY_HEIGHT: 300,
    MIN_DRAG_MARGIN: 10,
    EPSILON: 0.01,
    ANIMATION_DELAY: 500
};

// ===== GLOBAL VARIABLES =====
let pallets = [];
let allPalletsGenerated = [];
let renderConfig = {
    scale: 1,
    containerOffset: { x: CONSTANTS.CONTAINER_OFFSET_X, y: CONSTANTS.CONTAINER_OFFSET_Y },
    containerBounds: null
};

// ===== CONTAINER DEFINITIONS =====
const containers = {
    '20ft': { length: 589.8, width: 235.2, height: 238.5 },
    '40ft': { length: 1203.2, width: 235.0, height: 238.5 },
    '40HQ': { length: 1203.2, width: 235.0, height: 269.0 }
};

// ===== DOM ELEMENTS CACHE =====
let elements = {};

// ===== INITIALIZATION =====
function initializeElements() {
    elements = {
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
}

// ===== DARK MODE MANAGEMENT =====
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

// ===== MEMORY MANAGEMENT =====
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
        memoryManager.timers.forEach(timerId => {
            clearTimeout(timerId);
        });
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

// ===== UTILITY FUNCTIONS =====
const utils = {
    getCurrentClearance: () => parseFloat(elements.clearanceValue.value) || 1,
    
    calculateScale: (container) => {
        const maxWidth = CONSTANTS.CONTAINER_DISPLAY_WIDTH;
        const maxHeight = CONSTANTS.CONTAINER_DISPLAY_HEIGHT;
        const scaleX = maxWidth / container.length;
        const scaleY = maxHeight / container.width;
        return Math.min(scaleX, scaleY, 1);
    },
    
    getRandomColor: () => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22', '#34495e'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    adjustColor: (color, amount) => {
        const hex = color.replace('#', '');
        const r = Math.max(0, Math.min(255, parseInt(hex.substr(0, 2), 16) + amount));
        const g = Math.max(0, Math.min(255, parseInt(hex.substr(2, 2), 16) + amount));
        const b = Math.max(0, Math.min(255, parseInt(hex.substr(4, 2), 16) + amount));
        return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
    },
    
    showError: (message) => {
        elements.errorMessage.textContent = message;
        elements.errorMessage.style.display = 'block';
        setTimeout(() => {
            elements.errorMessage.style.display = 'none';
        }, 5000);
    },
    
    showSuccess: (message) => {
        elements.successMessage.textContent = message;
        elements.successMessage.style.display = 'block';
        setTimeout(() => {
            elements.successMessage.style.display = 'none';
        }, 5000);
    }
};

// ===== DEBUG FUNCTIONS =====
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
    }
};

// Global debug function
function debugLog(message, data = null) {
    debug.log(message, data);
}

// ===== PALLET MANAGEMENT =====
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

// ===== 3D STACKING ALGORITHMS =====
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
        
        // 高さ制約チェック
        const containerHeight = containers[elements.containerType.value].height;
        const totalHeight = basePallet.z + basePallet.finalHeight + pallet.finalHeight;
        if (totalHeight > containerHeight) return;
        
        // 重量制約チェック（積み重ね制限）
        const totalWeight = calculateStackWeight(basePallet) + pallet.weight;
        if (totalWeight > 2000) return; // 積み重ね重量制限
        
        // 位置計算
        const x = basePallet.x;
        const y = basePallet.y;
        const z = basePallet.z + basePallet.finalHeight;
        
        // スコア計算（重心、重量分布、高さ効率を考慮）
        const score = calculateStackingScore(pallet, basePallet, x, y, z);
        
        if (score > bestScore) {
            bestScore = score;
            bestPosition = { x, y, z, stackedOn: basePallet };
        }
    });
    
    return bestPosition;
}

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

function calculateStackWeight(basePallet) {
    let totalWeight = basePallet.weight || 0;
    
    // このパレットの上に積まれているパレットの重量を加算
    basePallet.stackedBy.forEach(stackedPallet => {
        const pallet = allPalletsGenerated.find(p => 
            p.id === stackedPallet.id && p.instance === stackedPallet.instance
        );
        if (pallet) {
            totalWeight += pallet.weight || 0;
        }
    });
    
    return totalWeight;
}

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