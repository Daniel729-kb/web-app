// Core algorithms for pallet arrangement and 3D stacking
import { CONSTANTS, containers, utils } from './utils.js';

// 2D placement algorithms
export function canPlace2D(x, y, length, width, placed, clearance, container = null) {
    const rect1 = { x, y, length, width };
    const containerTypeElement = document.getElementById('containerType');
    const cont = container || (containerTypeElement ? containers[containerTypeElement.value] : containers['40ft']);
    if (x < 0 || y < 0 || x + length > cont.length || y + width > cont.width) return false;
    return !placed.some(rect2 => rectanglesOverlapWithClearance(rect1, rect2, clearance));
}

export function rectanglesOverlapWithClearance(r1, r2, clearance) {
    return !(
        r1.x + r1.length + clearance <= r2.x + CONSTANTS.EPSILON ||
        r2.x + r2.length + clearance <= r1.x + CONSTANTS.EPSILON ||
        r1.y + r1.width + clearance <= r2.y + CONSTANTS.EPSILON ||
        r2.y + r2.width + clearance <= r1.y + CONSTANTS.EPSILON
    );
}

export function trySpecialPattern100x125(pallets, container, clearance) {
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

export function placeGridPattern(pallets, container, clearance, alreadyPlaced, startX) {
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

export function tryAreaDivisionPlacement(groups, container, clearance) {
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

export function calculateOptimalGroupWidth(samplePallet, container, clearance) {
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

export function placeGroupInArea(group, area, clearance, allowMixedOrientation) {
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
export function findBestStackPosition(pallet, placedPallets, container, clearance) {
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

export function calculateStackingScore(pallet, basePallet, x, y, z) {
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

export function calculateStackWeight(basePallet) {
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

export function getTopZForBase(basePallet) {
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

export function calculateStackingStability(placedPallets) {
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
}