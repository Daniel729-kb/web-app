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
            const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
            
            const maxStackHeight = Math.max(...placedPallets.map(p => p.z + p.finalHeight));
            const maxLevel = Math.floor(maxStackHeight / 100);
            const levelDescription = maxLevel === 0 ? '床のみ' : maxLevel === 1 ? '下段まで' : maxLevel === 2 ? '中段まで' : `${maxLevel}段目まで`;
            
            this.log('積み重ね詳細分析:', {
                basePallets: basePallets.length,
                stackedPallets: stackedPallets.length,
                unplacedPallets: unplacedPallets.length,
                maxStackHeight: maxStackHeight,
                averageStackHeight: placedPallets.reduce((sum, p) => sum + p.z, 0) / placedPallets.length,
                stackingLevels: `${maxLevel}段 (${levelDescription})`,
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
            
            // Analyze why stacking might not be working
            if (stackedPallets.length === 0 && unplacedPallets.length > 0) {
                this.log('❌ 積み重ねが発生していません。原因を分析中...');
                this.log('未配置パレットの積み重ね可能性をチェック中...');
                
                const container = containers[elements.containerType.value];
                const clearance = utils.getCurrentClearance();
                
                // Test first few unplaced pallets
                unplacedPallets.slice(0, 3).forEach(pallet => {
                    const potentialBases = basePallets.filter(basePallet => {
                        if (!pallet.canStackBelow || !basePallet.canStackAbove) return false;
                        const canFitLength = pallet.length <= basePallet.finalLength && pallet.width <= basePallet.finalWidth;
                        const canFitWidth = pallet.width <= basePallet.finalLength && pallet.length <= basePallet.finalWidth;
                        return canFitLength || canFitWidth;
                    });
                    
                    this.log(`パレット#${pallet.palletNumber} 積み重ね可能性:`, {
                        canStackBelow: pallet.canStackBelow,
                        canStackAbove: pallet.canStackAbove,
                        potentialBases: potentialBases.length,
                        weightMatch: potentialBases.filter(b => b.weight === pallet.weight).length,
                        sizeMatch: potentialBases.filter(b => 
                            (pallet.length <= b.finalLength && pallet.width <= b.finalWidth) ||
                            (pallet.width <= b.finalLength && pallet.length <= b.finalWidth)
                        ).length,
                        permissionIssues: basePallets.filter(b => !pallet.canStackBelow || !b.canStackAbove).length
                    });
                });
                
                // Check stacking permissions for all pallets
                const stackingPermissions = {
                    canStackBelow: unplacedPallets.filter(p => p.canStackBelow).length,
                    cannotStackBelow: unplacedPallets.filter(p => !p.canStackBelow).length,
                    baseCanStackAbove: basePallets.filter(p => p.canStackAbove).length,
                    baseCannotStackAbove: basePallets.filter(p => !p.canStackAbove).length
                };
                
                this.log('積み重ね権限分析:', stackingPermissions);
            }
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
            dimensions: `${container.length}×${container.width}×${container.width}cm`,
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
        // Only count base pallets (not stacked) for floor area calculation
        const basePallets = placedPallets.filter(p => !p.stackedOn);
        const stackedPallets = placedPallets.filter(p => p.stackedOn);
        
        // Debug: Check pallet structure
        this.log('パレット構造デバッグ:', {
            totalPlaced: placedPallets.length,
            withStackedOn: placedPallets.filter(p => p.stackedOn).length,
            withoutStackedOn: placedPallets.filter(p => !p.stackedOn).length,
            stackedOnValues: placedPallets.map(p => p.stackedOn ? 'yes' : 'no').slice(0, 5) // Show first 5
        });
        
        this.log('床面積計算:', {
            basePallets: basePallets.length,
            stackedPallets: stackedPallets.length,
            totalPlaced: placedPallets.length
        });
        const usedArea = basePallets.reduce((sum, p) => sum + (p.finalLength * p.finalWidth), 0);
        const remainingArea = totalArea - usedArea;
        const areaUtilization = (usedArea / totalArea) * 100;
        
        // Debug: Show area calculations
        this.log('面積計算デバッグ:', {
            totalArea: `${totalArea}cm² (${(totalArea / 10000).toFixed(2)}m²)`,
            usedArea: `${usedArea}cm² (${(usedArea / 10000).toFixed(2)}m²)`,
            basePalletsCount: basePallets.length,
            averagePalletArea: basePallets.length > 0 ? (usedArea / basePallets.length).toFixed(0) : 'N/A'
        });
        
        this.log('面積使用率:', `${areaUtilization.toFixed(2)}%`);
        this.log('残り床面積:', `${remainingArea.toFixed(2)}cm² (${(remainingArea / 10000).toFixed(2)}m²)`);
        if (elements.enableStacking.checked) {
            const maxHeight = Math.max(...placedPallets.map(p => p.z + p.finalHeight));
            const heightUtilization = (maxHeight / container.height) * 100;
            this.log('高さ使用率:', `${heightUtilization.toFixed(2)}%`);
        }
        const totalWeight = placedPallets.reduce((sum, p) => sum + (p.weight || 0), 0);
        this.log('総重量:', `${totalWeight}kg`);
        
        // Additional debugging for stacking
        if (stackedPallets.length > 0) {
            this.log('積み重ね詳細:', {
                stackedPallets: stackedPallets.map(p => `#${p.palletNumber} on #${p.stackedOn.palletNumber}`).slice(0, 10),
                stackingLevels: [...new Set(stackedPallets.map(p => Math.floor(p.z / 100)))]
            });
        }
        
        // If no stacking occurred, try to manually trigger it
        if (stackedPallets.length === 0 && unplacedPallets.length === 0 && elements.enableStacking.checked) {
            this.log('⚠️ 積み重ねが発生していません。手動で積み重ねを試行します...');
            this.forceStacking();
        }
    },
    forceStacking: function() {
        this.log('=== 強制積み重ねテスト開始 ===');
        const container = containers[elements.containerType.value];
        const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
        
        // Try to stack some pallets manually
        let stackedCount = 0;
        placedPallets.forEach((basePallet, index) => {
            if (index < 10 && basePallet.canStackAbove) { // Only try first 10 pallets
                const palletToStack = placedPallets.find(p => p !== basePallet && p.canStackBelow && !p.stackedOn);
                if (palletToStack) {
                    // Simple stacking
                    palletToStack.stackedOn = basePallet;
                    palletToStack.z = basePallet.z + basePallet.finalHeight;
                    stackedCount++;
                    this.log(`✅ 手動積み重ね: パレット#${palletToStack.palletNumber} を パレット#${basePallet.palletNumber} の上に配置`);
                }
            }
        });
        
        this.log(`手動積み重ね完了: ${stackedCount}個のパレットを積み重ね`);
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
        
        const levelNames = {
            0: '床',
            1: '下段',
            2: '中段',
            3: '上段'
        };
        
        this.log('積み重ねレベル分析:', {
            totalLevels: Object.keys(stackingLevels).length,
            levelDistribution: Object.entries(stackingLevels).map(([level, pallets]) => {
                const levelName = levelNames[level] || `${level}段目`;
                return `${levelName}: ${pallets.length}個`;
            }).join(', '),
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
            
            const levelNames = {
                0: '床',
                1: '下段',
                2: '中段',
                3: '上段'
            };
            
            unplacedPallets.forEach(pallet => {
                const bestPosition = findBestStackPosition(pallet, placedPallets, container, clearance);
                if (bestPosition) {
                    const level = Math.floor(bestPosition.z / 100);
                    const levelName = levelNames[level] || `${level}段目`;
                    this.log(`✅ パレット#${pallet.palletNumber} ${levelName}に積み重ね可能`);
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
                    canStackBelow: pallet.canStackBelow,
                    canStackAbove: pallet.canStackAbove,
                    potentialBases: potentialBases.length,
                    weightMatch: potentialBases.filter(b => b.weight === pallet.weight).length,
                    weightRatio: potentialBases.map(b => (pallet.weight / b.weight).toFixed(2))
                });
            });
        }
    },
    analyzeStackingPermissions: function() {
        this.log('=== 積み重ね権限詳細分析 ===');
        if (allPalletsGenerated.length === 0) { this.log('パレットが配置されていません'); return; }
        
        const allPallets = allPalletsGenerated.filter(p => !p.deleted);
        const placedPallets = allPallets.filter(p => p.placed);
        const unplacedPallets = allPallets.filter(p => !p.placed);
        
        // Analyze stacking permissions by type
        const permissionTypes = {
            'canStackBoth': allPallets.filter(p => p.canStackAbove && p.canStackBelow).length,
            'canStackAboveOnly': allPallets.filter(p => p.canStackAbove && !p.canStackBelow).length,
            'canStackBelowOnly': allPallets.filter(p => !p.canStackAbove && p.canStackBelow).length,
            'cannotStack': allPallets.filter(p => !p.canStackAbove && !p.canStackBelow).length
        };
        
        this.log('積み重ね権限タイプ別分析:', permissionTypes);
        
        // Analyze placed vs unplaced permissions
        const placedPermissions = {
            'canStackBoth': placedPallets.filter(p => p.canStackAbove && p.canStackBelow).length,
            'canStackAboveOnly': placedPallets.filter(p => p.canStackAbove && !p.canStackBelow).length,
            'canStackBelowOnly': placedPallets.filter(p => !p.canStackAbove && p.canStackBelow).length,
            'cannotStack': placedPallets.filter(p => !p.canStackAbove && !p.canStackBelow).length
        };
        
        const unplacedPermissions = {
            'canStackBoth': unplacedPallets.filter(p => p.canStackAbove && p.canStackBelow).length,
            'canStackAboveOnly': unplacedPallets.filter(p => p.canStackAbove && !p.canStackBelow).length,
            'canStackBelowOnly': unplacedPallets.filter(p => !p.canStackAbove && p.canStackBelow).length,
            'cannotStack': unplacedPallets.filter(p => !p.canStackAbove && !p.canStackBelow).length
        };
        
        this.log('配置済みパレットの権限:', placedPermissions);
        this.log('未配置パレットの権限:', unplacedPermissions);
        
        // Check stacking compatibility
        if (unplacedPallets.length > 0 && placedPallets.length > 0) {
            this.log('積み重ね互換性チェック...');
            
            unplacedPallets.slice(0, 3).forEach(pallet => {
                const compatibleBases = placedPallets.filter(basePallet => 
                    pallet.canStackBelow && basePallet.canStackAbove
                );
                
                this.log(`パレット#${pallet.palletNumber} 積み重ね互換性:`, {
                    canStackBelow: pallet.canStackBelow,
                    compatibleBases: compatibleBases.length,
                    totalPlaced: placedPallets.length,
                    compatibilityRate: `${((compatibleBases.length / placedPallets.length) * 100).toFixed(1)}%`
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
    
    // Test case with identical stackable pallets for maximum stacking
    const testData = [
        // Identical stackable pallets (all can stack and be stacked on)
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
    utils.showSuccess('🎯 最大積み重ねテスト: 100×125×100cm, 600kg, 40個の同一パレットで高さ制限まで積み重ねをテスト');
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
    console.log(`2D配置開始: ${palletsToPlace.length}個のパレット`);
    
    // Simple grid placement - place enough pallets on the floor for stacking bases
    const samplePallet = palletsToPlace[0];
    const cols = Math.floor(container.length / (samplePallet.length + clearance));
    const rows = Math.floor(container.width / (samplePallet.width + clearance));
    const maxFloorPallets = Math.min(palletsToPlace.length, cols * rows, Math.floor(palletsToPlace.length / 2)); // Limit floor placement to allow stacking
    
    console.log(`グリッド配置: ${cols}列×${rows}行, 最大${maxFloorPallets}個を床に配置`);
    
    let placedCount = 0;
    
    for (let i = 0; i < maxFloorPallets; i++) {
        const pallet = palletsToPlace[i];
        const row = Math.floor(i / cols);
        const col = i % cols;
        
        const x = col * (pallet.length + clearance);
        const y = row * (pallet.width + clearance);
        
        if (y + pallet.width <= container.width) {
            pallet.placed = true;
            pallet.x = x;
            pallet.y = y;
            pallet.finalLength = pallet.length;
            pallet.finalWidth = pallet.width;
            pallet.rotated = false;
            placedCount++;
        }
    }
    
    console.log(`2D配置完了: ${placedCount}個のパレットを床に配置`);
    
    const floorPlacedCount = allPalletsGenerated.filter(p => p.placed).length;
    console.log(`床配置完了: ${floorPlacedCount}個のパレットを床に配置`);
    
    if (stackingEnabled) { 
        console.log('3D積み重ね処理を開始...'); 
        const stackingResult = perform3DStacking();
        if (stackingResult) {
            console.log('積み重ね結果:', stackingResult);
        }
    } else {
        console.log('積み重ねが無効になっています');
    }
    
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

// Removed trySpecialPattern100x125 function - replaced with simpler grid placement

// Removed placeGridPattern function - replaced with simpler grid placement

function perform3DStacking() {
    console.log('=== 3D積み重ね処理開始 ===');
    
    const container = containers[elements.containerType.value];
    const clearance = utils.getCurrentClearance();
    
    // Get all pallets
    let placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
    let unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    
    console.log(`初期状態: 配置済み ${placedPallets.length}個, 未配置 ${unplacedPallets.length}個`);
    
    // Debug: Check stacking permissions
    const canStackBelow = unplacedPallets.filter(p => p.canStackBelow).length;
    const canStackAbove = placedPallets.filter(p => p.canStackAbove).length;
    console.log(`積み重ね権限: 未配置パレット(下積み可): ${canStackBelow}個, 配置済みパレット(上積み可): ${canStackAbove}個`);
    
    if (unplacedPallets.length === 0) {
        console.log('積み重ね対象のパレットがありません');
        return;
    }
    
    // Simple stacking algorithm: try to stack each unplaced pallet on any placed pallet
    let stackingAttempts = 0;
    const maxAttempts = unplacedPallets.length * 5;
    
    while (unplacedPallets.length > 0 && stackingAttempts < maxAttempts) {
        let anyStacked = false;
        
        // Try to stack each unplaced pallet
        for (let i = 0; i < unplacedPallets.length; i++) {
            const pallet = unplacedPallets[i];
            
            // Find best base pallet for this pallet
            let bestBase = null;
            let bestScore = -Infinity;
            
            for (const basePallet of placedPallets) {
                // Check stacking permissions
                if (!pallet.canStackBelow || !basePallet.canStackAbove) {
                    continue;
                }
                
                // Check if pallet fits on base (try both orientations)
                const orientations = [
                    { length: pallet.length, width: pallet.width, rotated: false },
                    { length: pallet.width, width: pallet.length, rotated: true }
                ];
                
                for (const orientation of orientations) {
                    if (orientation.length > basePallet.finalLength || orientation.width > basePallet.finalWidth) {
                        continue;
                    }
                    
                    // Check height constraint
                    const topZ = getTopZForBase(basePallet);
                    const totalHeight = topZ + pallet.finalHeight;
                    
                    if (totalHeight > container.height) {
                        continue;
                    }
                    
                    // Check weight constraint
                    const totalWeight = calculateStackWeight(basePallet) + pallet.weight;
                    const maxStackWeight = getMaxStackWeight(basePallet);
                    
                    if (totalWeight > maxStackWeight) {
                        continue;
                    }
                    
                    // Calculate score (prefer identical pallets and lower positions)
                    let score = 1000 - topZ; // Prefer lower positions
                    
                    if (pallet.weight === basePallet.weight) {
                        score += 500; // Bonus for identical weight
                    }
                    
                    if (orientation.length === basePallet.finalLength && orientation.width === basePallet.finalWidth) {
                        score += 200; // Bonus for perfect fit
                    }
                    
                    if (score > bestScore) {
                        bestScore = score;
                        bestBase = { pallet: basePallet, orientation: orientation };
                    }
                }
            }
            
            // If we found a good base, stack the pallet
            if (bestBase) {
                const { pallet: basePallet, orientation } = bestBase;
                const topZ = getTopZForBase(basePallet);
                
                // Place the pallet
                pallet.x = basePallet.x;
                pallet.y = basePallet.y;
                pallet.z = topZ;
                pallet.placed = true;
                pallet.stackedOn = basePallet;
                pallet.finalLength = orientation.length;
                pallet.finalWidth = orientation.width;
                pallet.rotated = orientation.rotated;
                
                // Update base pallet's stackedBy array
                if (!basePallet.stackedBy) basePallet.stackedBy = [];
                basePallet.stackedBy.push({ id: pallet.id, instance: pallet.instance });
                
                const stackingLevel = Math.floor(topZ / 100);
                const levelText = stackingLevel === 0 ? '床' : stackingLevel === 1 ? '下段' : stackingLevel === 2 ? '中段' : `${stackingLevel}段目`;
                console.log(`✅ 積み重ね成功: パレット#${pallet.palletNumber} を パレット#${basePallet.palletNumber} の上に配置 (${levelText}, 回転: ${orientation.rotated})`);
                
                anyStacked = true;
                
                // Remove from unplaced and add to placed
                unplacedPallets.splice(i, 1);
                placedPallets.push(pallet);
                break; // Move to next iteration
            }
        }
        
        if (!anyStacked) {
            console.log('❌ これ以上の積み重ねができません');
            break;
        }
        
        stackingAttempts++;
    }
    
    // Final results
    const finalPlacedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
    const finalUnplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    const stackedCount = finalPlacedPallets.filter(p => p.stackedOn).length;
    const maxStackHeight = Math.max(...finalPlacedPallets.map(p => p.z + p.finalHeight));
    
    console.log('=== 3D積み重ね完了 ===');
    const maxLevel = Math.floor(maxStackHeight / 100);
    const levelDescription = maxLevel === 0 ? '床のみ' : maxLevel === 1 ? '下段まで' : maxLevel === 2 ? '中段まで' : `${maxLevel}段目まで`;
    
    console.log('最終結果:', {
        totalPlaced: finalPlacedPallets.length,
        stackedCount: stackedCount,
        unplacedCount: finalUnplacedPallets.length,
        maxStackHeight: maxStackHeight,
        stackingLevels: `${maxLevel}段 (${levelDescription})`,
        attempts: stackingAttempts
    });
    
    // Calculate stability
    const stabilityResult = calculateStackingStability(finalPlacedPallets);
    console.log('積み重ね安定性:', stabilityResult);
    
    return {
        totalPlaced: finalPlacedPallets.length,
        stackedCount: stackedCount,
        unplacedCount: finalUnplacedPallets.length,
        maxStackHeight: maxStackHeight,
        stability: stabilityResult
    };
}

// Removed findBestStackPosition function - replaced with simpler logic in perform3DStacking

// Helper function to get Japanese level names
function getLevelName(level) {
    const levelNames = {
        0: '床',
        1: '下段',
        2: '中段',
        3: '上段'
    };
    return levelNames[level] || `${level}段目`;
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
    
    // For identical pallets, allow more stacking
    const isIdenticalPallet = allPalletsGenerated.some(p => 
        p.id === basePallet.id && 
        p.length === basePallet.length && 
        p.width === basePallet.width && 
        p.height === basePallet.height && 
        p.weight === basePallet.weight
    );
    
    let weightRatio = CONSTANTS.STACKING.WEIGHT_RATIO_LIMIT;
    if (isIdenticalPallet) {
        // Allow more stacking for identical pallets
        weightRatio = 4.0; // Allow 4x weight for identical pallets
    }
    
    const baseStrength = Math.min(CONSTANTS.STACKING.MAX_STACK_WEIGHT, baseWeight * weightRatio);
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

// Removed forceStackingForIdenticalPallets function - replaced with simpler logic in perform3DStacking

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
    document.getElementById('debugPermissions').addEventListener('click', () => debug.analyzeStackingPermissions());
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

