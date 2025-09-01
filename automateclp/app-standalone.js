// Standalone version - all modules combined
// Utility functions for AutomateCLP
// Constants and helper functions

const CONSTANTS = {
    CONTAINER_OFFSET_X: 25,
    CONTAINER_OFFSET_Y: 35,
    CONTAINER_DISPLAY_WIDTH: 800,
    CONTAINER_DISPLAY_HEIGHT: 300,
    MIN_DRAG_MARGIN: 10,
    EPSILON: 0.01,
    ANIMATION_DELAY: 500
};

const containers = {
    '20ft': { length: 589.8, width: 235.0, height: 235.0 },
    '40ft': { length: 1203.2, width: 235.0, height: 235.0 },
    '40HQ': { length: 1203.2, width: 235.0, height: 228.8 }
};

const utils = {
    getCurrentClearance: (clearanceValue) => parseFloat(clearanceValue) || 1,
    
    getRandomColor: () => {
        const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12', '#9b59b6', '#1abc9c', '#e67e22'];
        return colors[Math.floor(Math.random() * colors.length)];
    },
    
    showError: (message, errorElement) => {
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => { errorElement.style.display = 'none'; }, 5000);
    },
    
    showSuccess: (message, successElement) => {
        successElement.textContent = message;
        successElement.style.display = 'block';
        setTimeout(() => { successElement.style.display = 'none'; }, 5000);
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

// Memory management utilities
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
};// Algorithms module
// Core algorithms for pallet arrangement and 3D stacking


// 2D placement algorithms
function canPlace2D(x, y, length, width, placed, clearance, container = null) {
    const rect1 = { x, y, length, width };
    const containerTypeElement = document.getElementById('containerType');
    const cont = container || (containerTypeElement ? containers[containerTypeElement.value] : containers['40ft']);
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

function trySpecialPattern100x125(pallets, container, clearance) {
    const placedPallets = []; 
    const areaPlaced = [];
    const topPattern = [true, false, true, false];
    const bottomPattern = [false, true, false, true];
    const startX = 0; 
    const startY = 0; 
    let topX = startX; 
    let colHeights = [];
    
    topPattern.forEach((rotated, col) => {
        if (placedPallets.length >= pallets.length) return;
        const pallet = pallets[placedPallets.length];
        const length = rotated ? 125 : 100; 
        const width = rotated ? 100 : 125; 
        const x = topX; 
        const y = startY;
        if (canPlace2D(x, y, length, width, areaPlaced, clearance, container)) {
            placedPallets.push({ ...pallet, x, y, finalLength: length, finalWidth: width, rotated, placed: true });
            areaPlaced.push({ x, y, length, width }); 
            colHeights[col] = width; 
            topX += length + clearance;
        }
    });
    
    let bottomX = startX;
    bottomPattern.forEach((rotated, col) => {
        if (placedPallets.length >= pallets.length) return;
        const pallet = pallets[placedPallets.length];
        const length = rotated ? 125 : 100; 
        const width = rotated ? 100 : 125; 
        const x = bottomX; 
        const y = startY + (colHeights[col] || 0) + clearance;
        if (y + width <= container.width && canPlace2D(x, y, length, width, areaPlaced, clearance, container)) {
            placedPallets.push({ ...pallet, x, y, finalLength: length, finalWidth: width, rotated, placed: true });
            areaPlaced.push({ x, y, length, width }); 
            bottomX += length + clearance;
        }
    });
    
    return placedPallets;
}

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
                placedPallets.push({ ...pallet, x, y, finalLength: length, finalWidth: width, rotated: false, placed: true });
            }
        }
    }
    
    console.log(`110×110 グリッド配置: ${cols}列×${rows}行で${placedPallets.length}個配置`);
    return placedPallets;
}

function tryAreaDivisionPlacement(groups, container, clearance) {
    const placedPallets = [];
    const groupKeys = Object.keys(groups);
    
    if (groupKeys.length !== 2) return placedPallets;
    
    // 2つのグループのパレットサイズを取得
    const group1 = groups[groupKeys[0]];
    const group2 = groups[groupKeys[1]];
    
    console.log(`エリア分割配置: ${groupKeys[0]} (${group1.length}個) と ${groupKeys[1]} (${group2.length}個)`);
    
    // 各グループの最適な配置幅を計算
    const result1 = calculateOptimalGroupWidth(group1[0], container, clearance);
    const result2 = calculateOptimalGroupWidth(group2[0], container, clearance);
    
    // コンテナを左右に分割する最適な位置を探索
    let bestDivision = null;
    let maxPallets = 0;
    
    // 100x125と110x110の特殊ケース
    if (groupKeys.includes('100x125') && groupKeys.includes('110x110')) {
        const leftArea = { x: 0, y: 0, width: 500, height: container.width };
        const rightArea = { x: 500, y: 0, width: container.length - 500, height: container.width };
        
        const leftPlaced = placeGroupInArea(group1, leftArea, clearance, true);
        const rightPlaced = placeGroupInArea(group2, rightArea, clearance, false);
        
        if (leftPlaced.length + rightPlaced.length > maxPallets) {
            maxPallets = leftPlaced.length + rightPlaced.length;
            bestDivision = { left: leftPlaced, right: rightPlaced };
        }
    }
    
    if (bestDivision) {
        placedPallets.push(...bestDivision.left, ...bestDivision.right);
        console.log(`エリア分割配置成功: ${placedPallets.length}個配置`);
    }
    
    return placedPallets;
}

function calculateOptimalGroupWidth(samplePallet, container, clearance) {
    const orientations = samplePallet.length !== samplePallet.width ?
        [[samplePallet.length, samplePallet.width], [samplePallet.width, samplePallet.length]] :
        [[samplePallet.length, samplePallet.width]];
    
    let minWidth = Infinity;
    let maxCols = 0;
    
    orientations.forEach(([length, width]) => {
        const cols = Math.floor(container.length / (length + clearance));
        if (cols > 0) {
            const requiredWidth = cols * (length + clearance) - clearance;
            minWidth = Math.min(minWidth, length + clearance);
            maxCols = Math.max(maxCols, cols);
        }
    });
    
    return { minWidth, maxCols };
}

function placeGroupInArea(group, area, clearance, allowMixedOrientation) {
    const placed = [];
    const areaPlaced = [];
    
    // エリア内での最適な配置を計算
    const samplePallet = group[0];
    const orientations = samplePallet.length !== samplePallet.width ?
        [[samplePallet.length, samplePallet.width, false], [samplePallet.width, samplePallet.length, true]] :
        [[samplePallet.length, samplePallet.width, false]];
    
    let palletIndex = 0;
    
    // 混合配置を許可する場合（左側エリア）
    if (allowMixedOrientation && orientations.length > 1) {
        // 100×125パレットの特殊配置パターン
        if (samplePallet.length === 100 && samplePallet.width === 125) {
            // 上部に横向き（125×100）を2列
            let currentY = area.y;
            
            // 1列目：横向き2個
            for (let i = 0; i < 2 && palletIndex < group.length; i++) {
                const pallet = group[palletIndex++];
                const x = area.x + i * (125 + clearance);
                const y = currentY;
                
                if (x + 125 <= area.x + area.width && y + 100 <= area.y + area.height) {
                    placed.push({ ...pallet, x, y, finalLength: 125, finalWidth: 100, rotated: true, placed: true });
                    areaPlaced.push({ x, y, length: 125, width: 100 });
                }
            }
            
            currentY += 100 + clearance;
            
            // 2列目：縦向き2個
            for (let i = 0; i < 2 && palletIndex < group.length; i++) {
                const pallet = group[palletIndex++];
                const x = area.x + i * (100 + clearance);
                const y = currentY;
                
                if (x + 100 <= area.x + area.width && y + 125 <= area.y + area.height) {
                    placed.push({ ...pallet, x, y, finalLength: 100, finalWidth: 125, rotated: false, placed: true });
                    areaPlaced.push({ x, y, length: 100, width: 125 });
                }
            }
        }
    } else {
        // 通常のグリッド配置
        const [length, width] = orientations[0];
        const cols = Math.floor(area.width / (length + clearance));
        const rows = Math.floor(area.height / (width + clearance));
        
        for (let row = 0; row < rows && palletIndex < group.length; row++) {
            for (let col = 0; col < cols && palletIndex < group.length; col++) {
                const pallet = group[palletIndex++];
                const x = area.x + col * (length + clearance);
                const y = area.y + row * (width + clearance);
                
                placed.push({ ...pallet, x, y, finalLength: length, finalWidth: width, rotated: orientations[0][2], placed: true });
                areaPlaced.push({ x, y, length, width });
            }
        }
    }
    
    return placed;
}

// 3D Stacking algorithms
function findBestStackPosition(pallet, placedPallets, container, clearance) {
    let bestPosition = null; 
    let bestScore = -Infinity;
    
    placedPallets.forEach(basePallet => {
        if (!pallet.canStackBelow || !basePallet.canStackAbove) return;
        if (pallet.finalLength > basePallet.finalLength || pallet.finalWidth > basePallet.finalWidth) return;
        
        const containerTypeElement = document.getElementById('containerType');
        const containerHeight = (containerTypeElement ? containers[containerTypeElement.value] : containers['40ft']).height;
        const topZ = getTopZForBase(basePallet);
        const totalHeight = topZ + pallet.finalHeight;
        if (totalHeight > containerHeight) return;
        
        const totalWeight = calculateStackWeight(basePallet) + pallet.weight;
        if (totalWeight > 2000) return;
        
        const x = basePallet.x; 
        const y = basePallet.y; 
        const z = topZ;
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
    score += z * 0.1; 
    if (pallet.weight < basePallet.weight) score += 50;
    
    const lengthFit = 1 - Math.abs(pallet.finalLength - basePallet.finalLength) / basePallet.finalLength;
    const widthFit = 1 - Math.abs(pallet.finalWidth - basePallet.finalWidth) / basePallet.finalWidth;
    score += (lengthFit + widthFit) * 25;
    
    const centerX = (basePallet.x + basePallet.finalLength / 2 + pallet.finalLength / 2) / 2;
    const centerY = (basePallet.y + basePallet.finalWidth / 2 + pallet.finalWidth / 2) / 2;
    const containerTypeElement = document.getElementById('containerType');
    const currentContainer = containerTypeElement ? containers[containerTypeElement.value] : containers['40ft'];
    const containerCenterX = currentContainer.length / 2;
    const containerCenterY = currentContainer.width / 2;
    const distanceFromCenter = Math.sqrt(Math.pow(centerX - containerCenterX, 2) + Math.pow(centerY - containerCenterY, 2));
    score -= distanceFromCenter * 0.01; 
    
    return score;
}

function calculateStackWeight(basePallet) {
    let totalWeight = basePallet.weight || 0;
    (basePallet.stackedBy || []).forEach(stackedPallet => {
        const pallet = window.allPalletsGenerated.find(p => p.id === stackedPallet.id && p.instance === stackedPallet.instance);
        if (pallet) { 
            totalWeight += pallet.weight || 0; 
            totalWeight += calculateStackWeight(pallet) - (pallet.weight || 0); 
        }
    });
    return totalWeight;
}

function getTopZForBase(basePallet) {
    let topZ = (basePallet.z || 0) + (basePallet.finalHeight || 0);
    (basePallet.stackedBy || []).forEach(stackedPallet => {
        const pallet = window.allPalletsGenerated.find(p => p.id === stackedPallet.id && p.instance === stackedPallet.instance);
        if (pallet && pallet.placed) { 
            const palletTop = (pallet.z || 0) + (pallet.finalHeight || 0); 
            if (palletTop > topZ) topZ = palletTop; 
        }
    });
    return topZ;
}

function calculateStackingStability(placedPallets) {
    const containerTypeElement = document.getElementById('containerType');
    const container = containerTypeElement ? containers[containerTypeElement.value] : containers['40ft'];
    let totalWeight = 0, weightedCenterX = 0, weightedCenterY = 0, weightedCenterZ = 0;
    
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
}// UI module
// UI management and rendering functions


// DOM element cache
function getElements() {
    return {
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

// Dark mode functionality
function initDarkMode() {
    const elements = getElements();
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

// Pallet list management
function updatePalletList(pallets) {
    const elements = getElements();
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
        
        item.querySelector('.remove-btn').addEventListener('click', () => {
            // This will be handled by the main app
            window.palletManager?.remove(p.id);
        });
        
        elements.palletList.appendChild(item);
    });
}

function updateContainerInfo() {
    const elements = getElements();
    const containers = {
        '20ft': { length: 589.8, width: 235.0, height: 235.0 },
        '40ft': { length: 1203.2, width: 235.0, height: 235.0 },
        '40HQ': { length: 1203.2, width: 235.0, height: 228.8 }
    };
    
    const container = containers[elements.containerType.value];
    elements.containerInfo.innerHTML = `${elements.containerType.value}内寸: ${(container.length/100).toFixed(3)}m×${(container.width/100).toFixed(3)}m×${(container.height/100).toFixed(3)}m <small>クリアランス: ${utils.getCurrentClearance(elements.clearanceValue.value)}cm</small>`;
}

// Rendering functions
function renderAllPallets(container, allPalletsGenerated, renderConfig) {
    const elements = getElements();
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
            p.y + p.finalWidth + 50
        ));
        maxBottomY = Math.max(maxBottomY, bottomMostY);
    }
    
    workArea.style.minHeight = `${maxBottomY + 50}px`;
    
    // 既存のパレット要素をクリア
    workArea.querySelectorAll('.pallet-2d').forEach(el => el.remove());
    
    // パレットを描画
    allPalletsGenerated.forEach(pallet => {
        if (pallet.deleted) return;
        
        const palletEl = document.createElement('div');
        palletEl.className = 'pallet-2d';
        palletEl.dataset.palletId = pallet.id;
        palletEl.dataset.instance = pallet.instance;
        
        // 位置とサイズの設定
        const displayX = pallet.x * renderConfig.scale + CONSTANTS.CONTAINER_OFFSET_X;
        const displayY = pallet.y * renderConfig.scale + CONSTANTS.CONTAINER_OFFSET_Y;
        const displayWidth = pallet.finalLength * renderConfig.scale;
        const displayHeight = pallet.finalWidth * renderConfig.scale;
        
        palletEl.style.left = `${displayX}px`;
        palletEl.style.top = `${displayY}px`;
        palletEl.style.width = `${displayWidth}px`;
        palletEl.style.height = `${displayHeight}px`;
        palletEl.style.backgroundColor = pallet.color;
        
        // 積み重ね状態の表示
        if (pallet.stackedOn) {
            palletEl.classList.add('stacked');
        }
        if (pallet.stackedBy && pallet.stackedBy.length > 0) {
            palletEl.classList.add('base-pallet');
        }
        
        // コンテナ外のパレット
        if (isOutsideContainer(pallet, container)) {
            palletEl.classList.add('outside-container');
        }
        
        // パレットラベル
        const label = document.createElement('div');
        label.className = 'pallet-label';
        const heightInfo = pallet.finalHeight > 0 ? `\nH:${pallet.finalHeight}cm` : '';
        const weightInfo = pallet.weight > 0 ? `\n${pallet.weight}kg` : '';
        const stackInfo = pallet.stackedOn ? `\n↑${pallet.stackedOn.palletNumber}` : '';
        
        label.textContent = `#${pallet.palletNumber}${heightInfo}${weightInfo}${stackInfo}`;
        palletEl.appendChild(label);
        
        // コントロールボタン
        const controls = document.createElement('div');
        controls.className = 'pallet-controls';
        
        const rotateBtn = document.createElement('button');
        rotateBtn.className = 'rotate-btn';
        rotateBtn.textContent = '↻';
        rotateBtn.title = '回転';
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-btn';
        deleteBtn.textContent = '×';
        deleteBtn.title = '削除';
        
        controls.appendChild(rotateBtn);
        controls.appendChild(deleteBtn);
        palletEl.appendChild(controls);
        
        workArea.appendChild(palletEl);
    });
    
    // ドラッグ&ドロップを有効化
    enableDragAndDropAndActions();
}

function isOutsideContainer(pallet, container) {
    return pallet.x < 0 || pallet.y < 0 || 
           pallet.x + pallet.finalLength > container.length || 
           pallet.y + pallet.finalWidth > container.width;
}

// Drag and drop functionality
let isDDListenerAttached = false;

function enableDragAndDropAndActions() {
    const elements = getElements();
    const workArea = elements.containerFloor.parentElement;
    if (isDDListenerAttached) return;

    let activePalletEl = null;
    let initialMouseX, initialMouseY;

    workArea.addEventListener('mousedown', handleMouseDown);
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
                activePalletEl = palletEl;
                palletEl.classList.add('dragging');
                
                const rect = palletEl.getBoundingClientRect();
                const workAreaRect = workArea.getBoundingClientRect();
                initialMouseX = e.clientX - rect.left;
                initialMouseY = e.clientY - rect.top;
                
                e.preventDefault();
            }
        }
    }

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    function handleMouseMove(e) {
        if (!activePalletEl) return;
        
        const workAreaRect = workArea.getBoundingClientRect();
        const newX = e.clientX - workAreaRect.left - initialMouseX;
        const newY = e.clientY - workAreaRect.top - initialMouseY;
        
        activePalletEl.style.left = `${newX}px`;
        activePalletEl.style.top = `${newY}px`;
        
        // 衝突検出
        checkCollisions(activePalletEl);
    }

    function handleMouseUp(e) {
        if (!activePalletEl) return;
        
        activePalletEl.classList.remove('dragging');
        
        // パレットの位置を更新
        updatePalletPosition(activePalletEl);
        
        activePalletEl = null;
    }

    function checkCollisions(palletEl) {
        const allPallets = workArea.querySelectorAll('.pallet-2d:not(.dragging)');
        let hasCollision = false;
        
        allPallets.forEach(otherPallet => {
            if (palletEl === otherPallet) return;
            
            const rect1 = palletEl.getBoundingClientRect();
            const rect2 = otherPallet.getBoundingClientRect();
            
            if (rectsOverlap(rect1, rect2)) {
                hasCollision = true;
            }
        });
        
        if (hasCollision) {
            palletEl.classList.add('colliding');
        } else {
            palletEl.classList.remove('colliding');
        }
    }

    function rectsOverlap(rect1, rect2) {
        return !(rect1.right < rect2.left || 
                rect2.right < rect1.left || 
                rect1.bottom < rect2.top || 
                rect2.bottom < rect1.top);
    }

    function updatePalletPosition(palletEl) {
        const palletId = palletEl.dataset.palletId;
        const instance = parseInt(palletEl.dataset.instance);
        
        // パレットの実際の位置を計算
        const elements = getElements();
        const containers = {
            '20ft': { length: 589.8, width: 235.0, height: 235.0 },
            '40ft': { length: 1203.2, width: 235.0, height: 235.0 },
            '40HQ': { length: 1203.2, width: 235.0, height: 228.8 }
        };
        const container = containers[elements.containerType.value] || containers['40ft'];
        const scale = utils.calculateScale(container);
        
        const newX = (parseFloat(palletEl.style.left) - CONSTANTS.CONTAINER_OFFSET_X) / scale;
        const newY = (parseFloat(palletEl.style.top) - CONSTANTS.CONTAINER_OFFSET_Y) / scale;
        
        // グローバル配列を更新
        const pallet = window.allPalletsGenerated.find(p => p.id === palletId && p.instance === instance);
        if (pallet) {
            pallet.x = newX;
            pallet.y = newY;
        }
    }

    function rotatePallet(palletEl) {
        const palletId = palletEl.dataset.palletId;
        const instance = parseInt(palletEl.dataset.instance);
        
        const pallet = window.allPalletsGenerated.find(p => p.id === palletId && p.instance === instance);
        if (pallet) {
            // 回転
            const tempLength = pallet.finalLength;
            pallet.finalLength = pallet.finalWidth;
            pallet.finalWidth = tempLength;
            pallet.rotated = !pallet.rotated;
            
            // 再描画
            const containers = {
                '20ft': { length: 589.8, width: 235.0, height: 235.0 },
                '40ft': { length: 1203.2, width: 235.0, height: 235.0 },
                '40HQ': { length: 1203.2, width: 235.0, height: 228.8 }
            };
            const elements = getElements();
            const container = containers[elements.containerType.value] || containers['40ft'];
            const renderConfig = { scale: utils.calculateScale(container) };
            
            renderAllPallets(container, window.allPalletsGenerated, renderConfig);
        }
    }

    function deletePallet(palletEl) {
        const palletId = palletEl.dataset.palletId;
        const instance = parseInt(palletEl.dataset.instance);
        
        const pallet = window.allPalletsGenerated.find(p => p.id === palletId && p.instance === instance);
        if (pallet) {
            pallet.deleted = true;
            palletEl.classList.add('deleted');
            
            // 統計を更新
            const containers = {
                '20ft': { length: 589.8, width: 235.0, height: 235.0 },
                '40ft': { length: 1203.2, width: 235.0, height: 235.0 },
                '40HQ': { length: 1203.2, width: 235.0, height: 228.8 }
            };
            const elements = getElements();
            const container = containers[elements.containerType.value] || containers['40ft'];
            updateStats(container, window.allPalletsGenerated);
        }
    }
}

// Statistics and legend
function updateStats(container, allPalletsGenerated) {
    const elements = getElements();
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
                <div class="stat-value">${basePallets.length}</div>
                <div class="stat-label">ベースパレット</div>
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
    
    elements.stats.innerHTML = `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-value">${insidePallets.length}</div>
                <div class="stat-label">配置済みパレット</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${visiblePallets.length - insidePallets.length}</div>
                <div class="stat-label">未配置パレット</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${((usedArea / containerArea) * 100).toFixed(1)}%</div>
                <div class="stat-label">面積使用率</div>
            </div>
            <div class="stat-card">
                <div class="stat-value">${usedArea.toFixed(1)}m²</div>
                <div class="stat-label">使用面積</div>
            </div>
            ${stackingInfo}
        </div>
    `;
    elements.stats.style.display = 'block';
}

function updateLegend(pallets) {
    const elements = getElements();
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

// Export functionality
function exportLayoutAsImage() {
    const elements = getElements();
    const vizArea = document.querySelector('.visualization');
    elements.exportBtn.style.visibility = 'hidden';
    utils.showSuccess('🖼️ 画像を生成中です...', elements.successMessage);
    
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
        console.error('Image failed:', err);
        utils.showError('画像の生成に失敗しました。', elements.errorMessage);
        elements.exportBtn.style.visibility = 'visible';
    });
}// Main app module
// Main application logic for AutomateCLP

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