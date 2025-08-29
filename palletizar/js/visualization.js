// ====================================
// VISUALIZATION MODULE - Canvas Drawing and Results Display
// ====================================

import { getCurrentPallets } from './data.js';
import { generateColors, safeDivide, scrollToPallet } from './utils.js';

// Show diagram view for specific pallet
export function showDiagramView(palletIndex, viewType = 'layers') {
    const currentPallets = getCurrentPallets();
    if (!currentPallets || palletIndex >= currentPallets.length) return;
    
    const pallet = currentPallets[palletIndex];
    
    // Update active view buttons
    document.querySelectorAll(`#pallet-${palletIndex} .view-btn`).forEach(btn => {
        btn.classList.remove('active');
    });
    
    const activeBtn = document.querySelector(`#pallet-${palletIndex} .view-btn[onclick*="${viewType}"]`);
    if (activeBtn) {
        activeBtn.classList.add('active');
    }
    
    const container = document.getElementById(`diagram-${palletIndex}`);
    if (!container) return;
    
    if (viewType === 'side') {
        drawSideView(palletIndex);
    } else {
        drawLayersDetail(palletIndex);
    }
}

// Draw pallet diagram (main overview)
export function drawPalletDiagram(palletIndex, pallet) {
    const canvas = document.getElementById(`canvas-${palletIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const margin = 30;
    const maxWidth = canvas.width - 2 * margin;
    const maxHeight = canvas.height - 2 * margin;
    
    const scaleX = maxWidth / pallet.palletSize.width;
    const scaleY = maxHeight / pallet.palletSize.depth;
    const scale = Math.min(scaleX, scaleY);
    
    const palletW = pallet.palletSize.width * scale;
    const palletD = pallet.palletSize.depth * scale;
    const startX = (canvas.width - palletW) / 2;
    const startY = (canvas.height - palletD) / 2;
    
    // パレット枠を描画
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(startX, startY, palletW, palletD);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, palletW, palletD);
    
    // パレット寸法ラベル
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${pallet.palletSize.width}cm`, startX + palletW / 2, startY - 5);
    ctx.save();
    ctx.translate(startX - 15, startY + palletD / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${pallet.palletSize.depth}cm`, 0, 0);
    ctx.restore();
    
    // カートンカウント
    const cartonCounts = {};
    pallet.cartons.forEach(carton => {
        cartonCounts[carton.code] = (cartonCounts[carton.code] || 0) + 1;
    });
    
    // 色マップ生成
    const codes = Object.keys(cartonCounts);
    const colors = generateColors(codes.length);
    const colorMap = {};
    codes.forEach((code, index) => {
        colorMap[code] = colors[index];
    });
    
    // カートンを描画（層別に色分け）
    pallet.layers.forEach((layer, layerIndex) => {
        const layerAlpha = 0.7 + (layerIndex * 0.3 / pallet.layers.length);
        
        layer.cartons.forEach(carton => {
            if (carton.position) {
                const color = colorMap[carton.code];
                const boxX = startX + carton.position.x * scale;
                const boxY = startY + carton.position.y * scale;
                const boxW = carton.position.width * scale;
                const boxH = carton.position.depth * scale;
                
                // 色にアルファ値を適用
                const rgba = hexToRgba(color, layerAlpha);
                ctx.fillStyle = rgba;
                ctx.fillRect(boxX, boxY, boxW, boxH);
                
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.strokeRect(boxX, boxY, boxW, boxH);
                
                // テキストラベル
                if (boxW > 25 && boxH > 15) {
                    ctx.fillStyle = '#000';
                    ctx.font = `${Math.min(9, boxW / 8)}px Arial`;
                    ctx.textAlign = 'center';
                    const shortCode = carton.code.length > 8 ? carton.code.substring(0, 8) + '...' : carton.code;
                    ctx.fillText(shortCode, boxX + boxW / 2, boxY + boxH / 2);
                }
            }
        });
    });
    
    // 凡例を描画
    let legendY = startY + palletD + 20;
    let legendX = startX;
    ctx.font = '11px Arial';
    ctx.textAlign = 'left';
    
    Object.entries(cartonCounts).forEach(([code, count], index) => {
        const color = colorMap[code];
        const rectSize = 12;
        
        // 色付きの四角
        ctx.fillStyle = color;
        ctx.fillRect(legendX, legendY, rectSize, rectSize);
        ctx.strokeStyle = '#333';
        ctx.lineWidth = 1;
        ctx.strokeRect(legendX, legendY, rectSize, rectSize);
        
        // テキスト
        ctx.fillStyle = '#333';
        ctx.fillText(`${code}: ${count}個`, legendX + rectSize + 5, legendY + rectSize - 2);
        
        legendX += 150;
        if (legendX > canvas.width - 100) {
            legendX = startX;
            legendY += 18;
        }
    });
}

// Draw side view of pallet
export function drawSideView(palletIndex) {
    const currentPallets = getCurrentPallets();
    const pallet = currentPallets[palletIndex];
    const container = document.getElementById(`diagram-${palletIndex}`);
    
    const codes = [...new Set(pallet.cartons.map(c => c.code))];
    const colors = generateColors(codes.length);
    const colorMap = {};
    codes.forEach((code, index) => {
        colorMap[code] = colors[index];
    });
    
    let html = `<div style="margin-bottom: 15px; padding: 10px; background-color: ${pallet.height <= pallet.maxHeightLimit ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">`;
    html += `<strong>パレット側面図</strong> - 高さ: ${pallet.height.toFixed(1)}cm`;
    html += `</div>`;
    
    // 側面図キャンバス
    html += `<div style="text-align: center; margin-bottom: 20px;">`;
    html += `<canvas id="sideCanvas_${palletIndex}" width="600" height="400" style="border: 1px solid #ccc; background-color: white;"></canvas>`;
    html += `</div>`;
    
    // 層別詳細情報
    html += `<div style="display: grid; gap: 15px;">`;
    pallet.layers.forEach((layer, layerIndex) => {
        const layerCounts = layer.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        html += `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: #f8f9fa;">
                <h5 style="margin: 0 0 10px 0;">第${layerIndex + 1}層 - 高さ${layer.height}cm</h5>
                <div style="display: flex; flex-wrap: wrap; gap: 10px;">
                    ${Object.entries(layerCounts).map(([code, count]) => 
                        `<span style="display: inline-block; padding: 4px 8px; background-color: ${colorMap[code]}; 
                         border-radius: 12px; font-size: 12px; color: white;">${code}: ${count}個</span>`
                    ).join('')}
                </div>
            </div>
        `;
    });
    html += `</div>`;
    
    container.innerHTML = html;
    
    // 側面図を描画
    setTimeout(() => {
        drawSideViewCanvas(palletIndex, pallet, colorMap);
    }, 100);
}

// Draw side view canvas
function drawSideViewCanvas(palletIndex, pallet, colorMap) {
    const canvas = document.getElementById(`sideCanvas_${palletIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const margin = 50;
    const maxWidth = canvas.width - 2 * margin;
    const maxHeight = canvas.height - 2 * margin;
    
    // スケール計算
    const widthScale = maxWidth / pallet.palletSize.width;
    const heightScale = maxHeight / pallet.height;
    const scale = Math.min(widthScale, heightScale);
    
    const palletW = pallet.palletSize.width * scale;
    const palletH = pallet.height * scale;
    const startX = (canvas.width - palletW) / 2;
    const startY = canvas.height - margin - palletH;
    
    // パレット台座
    const baseHeight = 14 * scale;
    ctx.fillStyle = '#8B4513';
    ctx.fillRect(startX, startY + palletH - baseHeight, palletW, baseHeight);
    ctx.strokeStyle = '#654321';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY + palletH - baseHeight, palletW, baseHeight);
    
    // 各層を描画
    let currentLayerY = startY + palletH - baseHeight;
    
    pallet.layers.forEach((layer, layerIndex) => {
        const layerHeight = layer.height * scale;
        currentLayerY -= layerHeight;
        
        // 層の背景
        const layerCounts = layer.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        // 各貨物種類の割合で色分け
        const totalCartons = layer.cartons.length;
        let currentX = startX;
        
        Object.entries(layerCounts).forEach(([code, count]) => {
            const segmentWidth = (count / totalCartons) * palletW;
            
            ctx.fillStyle = colorMap[code];
            ctx.fillRect(currentX, currentLayerY, segmentWidth, layerHeight);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(currentX, currentLayerY, segmentWidth, layerHeight);
            
            // ラベル
            if (segmentWidth > 30) {
                ctx.fillStyle = '#000';
                ctx.font = '10px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(`${code}`, currentX + segmentWidth / 2, currentLayerY + layerHeight / 2);
                ctx.fillText(`${count}個`, currentX + segmentWidth / 2, currentLayerY + layerHeight / 2 + 12);
            }
            
            currentX += segmentWidth;
        });
        
        // 層番号
        ctx.fillStyle = '#666';
        ctx.font = 'bold 12px Arial';
        ctx.textAlign = 'left';
        ctx.fillText(`L${layerIndex + 1}`, startX - 25, currentLayerY + layerHeight / 2 + 5);
    });
    
    // 寸法ライン
    ctx.strokeStyle = '#666';
    ctx.lineWidth = 1;
    ctx.setLineDash([5, 5]);
    
    // 幅寸法
    ctx.beginPath();
    ctx.moveTo(startX, startY + palletH + 10);
    ctx.lineTo(startX + palletW, startY + palletH + 10);
    ctx.stroke();
    
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${pallet.palletSize.width}cm`, startX + palletW / 2, startY + palletH + 25);
    
    // 高さ寸法
    ctx.beginPath();
    ctx.moveTo(startX + palletW + 10, startY);
    ctx.lineTo(startX + palletW + 10, startY + palletH);
    ctx.stroke();
    
    ctx.save();
    ctx.translate(startX + palletW + 25, startY + palletH / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${pallet.height.toFixed(1)}cm`, 0, 0);
    ctx.restore();
    
    ctx.setLineDash([]);
}

// Draw layers detail view
export function drawLayersDetail(palletIndex) {
    const currentPallets = getCurrentPallets();
    const pallet = currentPallets[palletIndex];
    const container = document.getElementById(`diagram-${palletIndex}`);
    
    const codes = [...new Set(pallet.cartons.map(c => c.code))];
    const colors = generateColors(codes.length);
    const colorMap = {};
    codes.forEach((code, index) => {
        colorMap[code] = colors[index];
    });
    
    const palletArea = pallet.palletSize.width * pallet.palletSize.depth;
    
    let html = `<div style="margin-bottom: 15px; padding: 10px; background-color: ${pallet.height <= pallet.maxHeightLimit ? '#d4edda' : '#f8d7da'}; border-radius: 5px;">`;
    html += `<strong>高さ制限チェック:</strong> ${pallet.height.toFixed(1)}cm / ${pallet.maxHeightLimit || 200}cm `;
    html += pallet.height <= (pallet.maxHeightLimit || 200) ? '✅ 適合' : '❌ 超過';
    html += `</div>`;
    
    html += '<div style="display: grid; gap: 20px;">';
    
    pallet.layers.forEach((layer, layerIndex) => {
        const layerCounts = layer.cartons.reduce((acc, carton) => {
            acc[carton.code] = (acc[carton.code] || 0) + 1;
            return acc;
        }, {});
        
        const layerTypeText = layer.type === 'mixed' ? '混載層' : '';
        const layerColor = layer.type === 'mixed' ? '#fff3cd' : '#e8f5e8';
        const areaUtilization = safeDivide(layer.area, palletArea, 0) * 100;
        
        html += `
            <div style="border: 1px solid #ddd; border-radius: 8px; padding: 15px; background-color: ${layerColor};">
                <h4 style="margin: 0 0 10px 0; color: #333;">第${layerIndex + 1}層 ${layerTypeText}</h4>
                <div style="display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 15px;">
                    <div>
                        <strong>層情報:</strong><br>
                        高さ: ${layer.height}cm<br>
                        重量: ${layer.weight.toFixed(1)}kg<br>
                        カートン数: ${layer.cartons.length}個<br>
                        <strong style="color: #2563eb;">占有面積: ${layer.area.toFixed(0)}cm² (${areaUtilization.toFixed(1)}%)</strong>
                    </div>
                    <div>
                        <strong>貨物構成:</strong><br>
                        ${Object.entries(layerCounts).map(([code, count]) => {
                            const carton = layer.cartons.find(c => c.code === code);
                            const sizeInfo = carton ? `${carton.l}×${carton.w}×${carton.h}cm` : '';
                            return `<div style="margin: 2px 0;"><span style="display: inline-block; margin-right: 8px; padding: 2px 8px; background-color: ${colorMap[code]}; border-radius: 12px; font-size: 12px; color: white;">${code}: ${count}個</span><small style="color: #666;">${sizeInfo}</small></div>`
                        }).join('')}
                    </div>
                </div>
                <div style="margin-top: 15px;">
                    <canvas id="layerCanvas_${palletIndex}_${layerIndex}" width="400" height="250" style="border: 1px solid #ccc; background-color: white; border-radius: 5px;"></canvas>
                </div>
            </div>
        `;
    });
    
    html += '</div>';
    container.innerHTML = html;
    
    setTimeout(() => {
        pallet.layers.forEach((layer, layerIndex) => {
            drawSingleLayer(palletIndex, layerIndex, layer, pallet.palletSize, colorMap);
        });
    }, 100);
}

// Draw single layer
export function drawSingleLayer(palletIndex, layerIndex, layer, palletSize, colorMap) {
    const canvas = document.getElementById(`layerCanvas_${palletIndex}_${layerIndex}`);
    if (!canvas) return;
    
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    const margin = 30;
    const maxWidth = canvas.width - 2 * margin;
    const maxHeight = canvas.height - 2 * margin;
    
    const scaleX = maxWidth / palletSize.width;
    const scaleY = maxHeight / palletSize.depth;
    const scale = Math.min(scaleX, scaleY);
    
    const palletW = palletSize.width * scale;
    const palletD = palletSize.depth * scale;
    const startX = (canvas.width - palletW) / 2;
    const startY = (canvas.height - palletD) / 2;
    
    // パレット枠
    ctx.fillStyle = '#f8f8f8';
    ctx.fillRect(startX, startY, palletW, palletD);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 2;
    ctx.strokeRect(startX, startY, palletW, palletD);
    
    // パレット寸法ラベル
    ctx.fillStyle = '#666';
    ctx.font = '12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`${palletSize.width}cm`, startX + palletW / 2, startY - 5);
    ctx.save();
    ctx.translate(startX - 15, startY + palletD / 2);
    ctx.rotate(-Math.PI / 2);
    ctx.fillText(`${palletSize.depth}cm`, 0, 0);
    ctx.restore();
    
    // カートンを描画
    layer.cartons.forEach((carton, index) => {
        if (carton.position) {
            const color = colorMap[carton.code];
            const boxX = startX + carton.position.x * scale;
            const boxY = startY + carton.position.y * scale;
            const boxW = carton.position.width * scale;
            const boxH = carton.position.depth * scale;
            
            ctx.fillStyle = color;
            ctx.fillRect(boxX, boxY, boxW, boxH);
            ctx.strokeStyle = '#333';
            ctx.lineWidth = 1;
            ctx.strokeRect(boxX, boxY, boxW, boxH);
            
            if (boxW > 25 && boxH > 15) {
                ctx.fillStyle = '#000';
                ctx.font = `${Math.min(9, boxW / 8)}px Arial`;
                ctx.textAlign = 'center';
                const shortCode = carton.code.length > 8 ? carton.code.substring(0, 8) + '...' : carton.code;
                ctx.fillText(shortCode, boxX + boxW / 2, boxY + boxH / 2);
            }
        }
    });
    
    ctx.fillStyle = '#333';
    ctx.font = 'bold 14px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(`第${layerIndex + 1}層 - ${layer.cartons.length}個`, canvas.width / 2, 20);
}

// Helper function to convert hex to rgba
function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

// Export functions for global access
window.showDiagramView = showDiagramView;
window.scrollToPallet = scrollToPallet;