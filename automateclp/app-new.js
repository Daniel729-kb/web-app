// Main application logic for AutomateCLP
import { CONSTANTS, containers, utils, memoryManager } from './utils.js';
import { 
    canPlace2D, rectanglesOverlapWithClearance, trySpecialPattern100x125, 
    placeGridPattern, tryAreaDivisionPlacement, findBestStackPosition, 
    calculateStackingStability, perform3DStacking 
} from './algorithms.js';
import { 
    getElements, initDarkMode, updatePalletList, updateContainerInfo, 
    renderAllPallets, updateStats, updateLegend, exportLayoutAsImage 
} from './ui.js';

// Global variables
let pallets = [];
let allPalletsGenerated = [];
let renderConfig = {
    scale: 1,
    containerOffset: { x: CONSTANTS.CONTAINER_OFFSET_X, y: CONSTANTS.CONTAINER_OFFSET_Y },
    containerBounds: null
};

// Debug functionality
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
        const elements = getElements();
        if (elements.debugOutput) {
            elements.debugOutput.style.display = 'block';
            elements.debugOutput.innerHTML += `<div style="margin-bottom: 5px; border-bottom: 1px solid #eee; padding-bottom: 3px;">${logMessage.replace(/\n/g, '<br>')}</div>`;
            elements.debugOutput.scrollTop = elements.debugOutput.scrollHeight;
        }
    },
    clear: function() {
        const elements = getElements();
        if (elements.debugOutput) {
            elements.debugOutput.innerHTML = '';
            elements.debugOutput.style.display = 'none';
        }
        console.clear();
    },
    testStacking: function() {
        this.log('=== 積み重ねテスト開始 ===');
        this.log('パレット数:', pallets.length);
        const elements = getElements();
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
        const elements = getElements();
        const container = containers[elements.containerType.value];
        this.log('コンテナ情報:', {
            type: elements.containerType.value,
            dimensions: `${container.length}×${container.width}×${container.height}cm`,
            clearance: `${utils.getCurrentClearance(elements.clearanceValue.value)}cm`
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
    }
};

function debugLog(message, data = null) { debug.log(message, data); }

// Pallet management
const palletManager = {
    add: function() {
        const elements = getElements();
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
            id: Date.now(), 
            palletNumber, 
            length, 
            width, 
            height, 
            weight, 
            qty,
            canStackAbove, 
            canStackBelow, 
            color: utils.getRandomColor()
        });
        
        updatePalletList(pallets);
        updateContainerInfo();
        clearInputs();
        clearResults();
    },
    
    generatePalletNumber: function() {
        const existingNumbers = pallets.map(p => p.palletNumber);
        let nextNumber = 1; 
        while (existingNumbers.includes(nextNumber)) nextNumber++;
        return nextNumber;
    },
    
    validate: (length, width, height, weight, qty) => {
        const elements = getElements();
        if (!length || !width || !qty || length <= 0 || width <= 0 || qty <= 0) { 
            utils.showError('有効なパレット寸法と数量を入力してください', elements.errorMessage); 
            return false; 
        }
        if (length > 300 || width > 300 || height > 300) { 
            utils.showError('パレットサイズは300cm以下にしてください', elements.errorMessage); 
            return false; 
        }
        if (weight > 2000) { 
            utils.showError('パレット重量は2000kg以下にしてください', elements.errorMessage); 
            return false; 
        }
        if (qty > 100) { 
            utils.showError('パレット数量は100個以下にしてください', elements.errorMessage); 
            return false; 
        }
        return true;
    },
    
    remove: (id) => { 
        pallets = pallets.filter(p => p.id !== id); 
        updatePalletList(pallets); 
        updateContainerInfo(); 
        clearResults(); 
    }
};

// Test case function
function runTestCase() {
    pallets = [];
    allPalletsGenerated = [];
    const elements = getElements();
    elements.containerType.value = '40ft';
    elements.clearanceValue.value = '1';
    elements.enableStacking.checked = true;
    
    const testData = [
        { l: 110, w: 110, h: 120, wt: 800, q: 12, c: '#f39c12', above: true, below: true },
        { l: 100, w: 125, h: 100, wt: 600, q: 8, c: '#3498db', above: true, below: true }
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
    
    updatePalletList(pallets); 
    updateContainerInfo(); 
    clearResults(); 
    utils.showSuccess('🎯 3D積み重ねテスト: 110×110×120cm (12個) + 100×125×100cm (8個)', elements.successMessage);
}

// Input and result management
function clearInputs() {
    const elements = getElements();
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
    const elements = getElements();
    const workArea = elements.containerFloor.parentElement;
    workArea.querySelectorAll('.pallet-2d').forEach(el => el.remove());
    
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

// Main calculation function
function calculateLoading() {
    if (pallets.length === 0) { 
        const elements = getElements();
        return utils.showError('少なくとも1つのパレットタイプを追加してください', elements.errorMessage); 
    }
    
    const elements = getElements();
    const container = containers[elements.containerType.value];
    const clearance = utils.getCurrentClearance(elements.clearanceValue.value);
    
    elements.loadingAnimation.style.display = 'block';
    elements.exportBtn.style.display = 'none';
    
    setTimeout(() => {
        allPalletsGenerated = [];
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
                    z: 0,
                    finalLength: pt.length, 
                    finalWidth: pt.width, 
                    finalHeight: pt.height || 0,
                    rotated: false, 
                    stackedOn: null, 
                    stackedBy: []
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
        
        renderAllPallets(container, allPalletsGenerated, renderConfig);
        updateStats(container, allPalletsGenerated);
        updateLegend(pallets);
        
        if (placedCount === allPalletsGenerated.length) {
            utils.showSuccess(`🎉 全${allPalletsGenerated.length}個のパレットが自動配置されました！（回転: ${rotatedCount}個）`, elements.successMessage);
        } else if (placedCount > 0) {
            utils.showSuccess(`⚡ ${placedCount}/${allPalletsGenerated.length}個を自動配置（回転: ${rotatedCount}個）。残りはマニュアル調整してください。`, elements.successMessage);
        } else {
            utils.showSuccess(`📦 ${allPalletsGenerated.length}個のパレットを生成しました。マニュアルで配置してください。`, elements.successMessage);
        }
    }, CONSTANTS.ANIMATION_DELAY);
}

// 2D packing algorithm
function packPallets2D(palletsToPlace, container, clearance) {
    const placed = [];
    const elements = getElements();
    const stackingEnabled = elements.enableStacking.checked;
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
    
    // 100x125特殊パターン
    if (groups['100x125'] && groups['100x125'].length >= 8) {
        const specialPlaced = trySpecialPattern100x125(groups['100x125'], container, clearance);
        if (specialPlaced.length > 0) {
            console.log(`100×125特殊パターンで ${specialPlaced.length} 個配置成功`);
            specialPlaced.forEach(p => {
                const original = allPalletsGenerated.find(pl => pl.id === p.id && pl.instance === p.instance);
                if (original) { 
                    original.placed = true; 
                    original.x = p.x; 
                    original.y = p.y; 
                    original.finalLength = p.finalLength; 
                    original.finalWidth = p.finalWidth; 
                    original.rotated = p.rotated; 
                }
                placed.push({ x: p.x, y: p.y, length: p.finalLength, width: p.finalWidth });
                specialMaxX = Math.max(specialMaxX, p.x + p.finalLength);
            });
        }
    }
    
    // 110x110グリッド配置
    if (groups['110x110']) {
        const startX = specialMaxX + clearance;
        const gridPlaced = placeGridPattern(groups['110x110'], container, clearance, placed, startX);
        gridPlaced.forEach(p => {
            const original = allPalletsGenerated.find(pl => pl.id === p.id && pl.instance === p.instance);
            if (original) { 
                original.placed = true; 
                original.x = p.x; 
                original.y = p.y; 
                original.finalLength = p.finalLength; 
                original.finalWidth = p.finalWidth; 
                original.rotated = p.rotated; 
            }
            placed.push({ x: p.x, y: p.y, length: p.finalLength, width: p.finalWidth });
        });
    }
    
    // 残りのパレットを通常配置
    const remainingPallets = palletsToPlace.filter(p => !p.placed);
    console.log(`残りパレット数: ${remainingPallets.length}`);
    
    remainingPallets.sort((a, b) => (b.length * b.width) - (a.length * a.width));
    
    remainingPallets.forEach(pallet => {
        let bestPosition = null; 
        let bestScore = Infinity; 
        let bestRotated = false;
        
        const orientations = pallet.length !== pallet.width ? 
            [[pallet.length, pallet.width, false], [pallet.width, pallet.length, true]] : 
            [[pallet.length, pallet.width, false]];
        
        orientations.forEach(([length, width, rotated]) => {
            for (let y = 0; y <= container.width - width; y += 5) {
                for (let x = 0; x <= container.length - length; x += 5) {
                    if (canPlace2D(x, y, length, width, placed, clearance)) {
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
            placed.push({ x: pallet.x, y: pallet.y, length: pallet.finalLength, width: pallet.finalWidth });
        }
    });
    
    console.log(`通常配置で追加配置: ${remainingPallets.filter(p => p.placed).length}個`);
    
    // 3D積み重ね処理
    if (stackingEnabled) { 
        console.log('3D積み重ね処理を開始...'); 
        perform3DStacking(palletsToPlace, container, clearance, placed); 
    }
    
    // 未配置パレットの処理
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

// 3D stacking implementation
function perform3DStacking(palletsToPlace, container, clearance, placed2D) {
    console.log('3D積み重ね処理を実行中...');
    const placedPallets = allPalletsGenerated.filter(p => p.placed && !p.deleted);
    const unplacedPallets = allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    
    if (unplacedPallets.length === 0) { 
        console.log('積み重ね対象のパレットがありません'); 
        return; 
    }
    
    unplacedPallets.sort((a, b) => { 
        const wd = (b.weight || 0) - (a.weight || 0); 
        if (wd !== 0) return wd; 
        return (b.height || 0) - (a.height || 0); 
    });
    
    console.log(`積み重ね対象パレット: ${unplacedPallets.length}個`);
    
    unplacedPallets.forEach(pallet => {
        if (pallet.placed) return;
        
        const bestStackPosition = findBestStackPosition(pallet, placedPallets, container, clearance);
        if (bestStackPosition) {
            pallet.x = bestStackPosition.x; 
            pallet.y = bestStackPosition.y; 
            pallet.z = bestStackPosition.z;
            pallet.placed = true; 
            pallet.stackedOn = bestStackPosition.stackedOn;
            
            if (bestStackPosition.stackedOn) {
                const basePallet = allPalletsGenerated.find(p => 
                    p.id === bestStackPosition.stackedOn.id && 
                    p.instance === bestStackPosition.stackedOn.instance
                );
                if (basePallet) { 
                    basePallet.stackedBy.push({ id: pallet.id, instance: pallet.instance }); 
                }
            }
            
            console.log(`パレット#${pallet.palletNumber} を積み重ね配置: (${pallet.x}, ${pallet.y}, ${pallet.z})`);
        }
    });
    
    const stabilityResult = calculateStackingStability(placedPallets);
    console.log('積み重ね安定性:', stabilityResult);
    debugLog('3D積み重ね完了', { 
        totalPlaced: placedPallets.length + unplacedPallets.filter(p => p.placed).length, 
        stackedCount: unplacedPallets.filter(p => p.placed && p.stackedOn).length, 
        stability: stabilityResult 
    });
}

// Event listeners setup
function setupEventListeners() {
    const elements = getElements();
    
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
    
    document.getElementById('debugStacking').addEventListener('click', () => debug.testStacking());
    document.getElementById('debugGravity').addEventListener('click', () => debug.testGravity());
    document.getElementById('debugLayout').addEventListener('click', () => debug.testLayout());
    document.getElementById('debugClear').addEventListener('click', () => debug.clear());
    
    [elements.palletLength, elements.palletWidth, elements.palletHeight, elements.palletWeight, elements.palletQty].forEach(input => {
        input.addEventListener('keypress', e => { 
            if (e.key === 'Enter') palletManager.add(); 
        });
    });
}

function setupPresetButtons() {
    document.querySelectorAll('.preset-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const elements = getElements();
            elements.palletLength.value = this.dataset.length;
            elements.palletWidth.value = this.dataset.width;
            elements.palletHeight.value = this.dataset.height || '120';
            elements.palletWeight.value = this.dataset.weight || '500';
            elements.palletQty.focus();
        });
    });
}

// Initialize the application
function init() {
    initDarkMode();
    setupPresetButtons();
    setupEventListeners();
    updateContainerInfo();
    
    // Make palletManager globally accessible for UI callbacks
    window.palletManager = palletManager;
    window.allPalletsGenerated = allPalletsGenerated;
}

// Start the application
document.addEventListener('DOMContentLoaded', init);
window.addEventListener('beforeunload', () => { 
    console.log('Cleaning up before page unload...'); 
    memoryManager.cleanup(); 
});
setInterval(() => { memoryManager.cleanup(); }, 3 * 60 * 1000);