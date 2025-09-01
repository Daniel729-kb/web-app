// UI management and rendering functions
import { CONSTANTS, utils } from './utils.js';

// DOM element cache
export function getElements() {
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
export function initDarkMode() {
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
export function updatePalletList(pallets) {
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

export function updateContainerInfo() {
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
export function renderAllPallets(container, allPalletsGenerated, renderConfig) {
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

export function isOutsideContainer(pallet, container) {
    return pallet.x < 0 || pallet.y < 0 || 
           pallet.x + pallet.finalLength > container.length || 
           pallet.y + pallet.finalWidth > container.width;
}

// Drag and drop functionality
let isDDListenerAttached = false;

export function enableDragAndDropAndActions() {
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
export function updateStats(container, allPalletsGenerated) {
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

export function updateLegend(pallets) {
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
export function exportLayoutAsImage() {
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
        console.error('Image export failed:', err);
        utils.showError('画像の生成に失敗しました。', elements.errorMessage);
        elements.exportBtn.style.visibility = 'visible';
    });
}