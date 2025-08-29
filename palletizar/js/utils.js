// ====================================
// UTILS MODULE - Utility Functions
// ====================================

// Helper function for safe division
export function safeDivide(a, b, defaultValue = 0) {
    return b !== 0 ? a / b : defaultValue;
}

// Generate colors for visualization
export function generateColors(count) {
    const colors = [
        '#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7',
        '#DDA0DD', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E9',
        '#F8C471', '#82E0AA', '#F1948A', '#85929E', '#D7BDE2',
        '#A3E4D7', '#FAD7A0', '#D5A6BD', '#AED6F1', '#F9E79F'
    ];
    
    const result = [];
    for (let i = 0; i < count; i++) {
        result.push(colors[i % colors.length]);
    }
    return result;
}

// Show error messages in UI
export function showErrors(errors) {
    const errorsDiv = document.getElementById('errors');
    errorsDiv.innerHTML = '';
    
    errors.forEach(error => {
        const errorDiv = document.createElement('div');
        errorDiv.className = 'alert alert-error';
        errorDiv.innerHTML = `⚠️ ${error}`;
        errorsDiv.appendChild(errorDiv);
    });
}

// Scroll to specific pallet in results
export function scrollToPallet(palletIndex) {
    const element = document.getElementById(`pallet-${palletIndex}`);
    if (element) {
        element.scrollIntoView({ 
            behavior: 'smooth', 
            block: 'start' 
        });
        
        // Highlight effect
        element.style.backgroundColor = '#fff3cd';
        element.style.border = '2px solid #ffc107';
        
        setTimeout(() => {
            element.style.backgroundColor = '';
            element.style.border = '';
        }, 2000);
    }
}

// Group items by height with tolerance
export function groupItemsByHeight(items, tolerance) {
    const groups = {};
    
    items.forEach(item => {
        let foundGroup = false;
        
        for (const [heightKey, groupItems] of Object.entries(groups)) {
            const groupHeight = parseFloat(heightKey);
            if (Math.abs(item.h - groupHeight) <= tolerance) {
                groupItems.push(item);
                foundGroup = true;
                break;
            }
        }
        
        if (!foundGroup) {
            groups[item.h.toString()] = [item];
        }
    });
    
    return groups;
}

// Check if a box can be placed at specific position
export function canPlaceAt(grid, x, y, width, depth) {
    for (let i = x; i < x + width; i++) {
        for (let j = y; j < y + depth; j++) {
            if (i >= grid.length || j >= grid[0].length || grid[i][j]) {
                return false;
            }
        }
    }
    return true;
}

// Create occupied grid for collision detection
export function createOccupiedGrid(palletSize, cartons) {
    const grid = Array(Math.ceil(palletSize.width)).fill(null)
        .map(() => Array(Math.ceil(palletSize.depth)).fill(false));
    
    cartons.forEach(carton => {
        if (carton.position) {
            const startX = Math.floor(carton.position.x);
            const startY = Math.floor(carton.position.y);
            const endX = Math.min(Math.ceil(carton.position.x + carton.position.width), grid.length);
            const endY = Math.min(Math.ceil(carton.position.y + carton.position.depth), grid[0].length);
            
            for (let x = startX; x < endX; x++) {
                for (let y = startY; y < endY; y++) {
                    if (x >= 0 && y >= 0) {
                        grid[x][y] = true;
                    }
                }
            }
        }
    });
    
    return grid;
}

// Format file name with timestamp
export function getTimestampedFileName(baseName, extension) {
    const now = new Date();
    const dateStr = 
        now.getFullYear() + 
        String(now.getMonth() + 1).padStart(2, '0') + 
        String(now.getDate()).padStart(2, '0') + '_' +
        String(now.getHours()).padStart(2, '0') + 
        String(now.getMinutes()).padStart(2, '0');
    
    return `${baseName}_${dateStr}.${extension}`;
}

// Parse CSV text with error handling
export function parseCSV(csvText) {
    const lines = csvText.trim().split('\n');
    const result = [];
    const errors = [];
    
    lines.forEach((line, index) => {
        const lineNumber = index + 1;
        const cleanLine = line.trim();
        
        if (!cleanLine) return; // Skip empty lines
        
        const columns = cleanLine.split(',').map(col => col.trim());
        
        if (columns.length !== 6) {
            errors.push(`行${lineNumber}: 列数が正しくありません（6列必要、${columns.length}列検出）`);
            return;
        }
        
        const [code, qtyStr, weightStr, lStr, wStr, hStr] = columns;
        
        // Validation
        if (!code) {
            errors.push(`行${lineNumber}: 貨物コードが空です`);
            return;
        }
        
        const qty = parseInt(qtyStr);
        const weight = parseFloat(weightStr);
        const l = parseFloat(lStr);
        const w = parseFloat(wStr);
        const h = parseFloat(hStr);
        
        if (isNaN(qty) || qty <= 0) {
            errors.push(`行${lineNumber}: 数量が無効です（${qtyStr}）`);
            return;
        }
        
        if (isNaN(weight) || weight <= 0) {
            errors.push(`行${lineNumber}: 重量が無効です（${weightStr}）`);
            return;
        }
        
        if (isNaN(l) || l <= 0) {
            errors.push(`行${lineNumber}: 長さが無効です（${lStr}）`);
            return;
        }
        
        if (isNaN(w) || w <= 0) {
            errors.push(`行${lineNumber}: 幅が無効です（${wStr}）`);
            return;
        }
        
        if (isNaN(h) || h <= 0) {
            errors.push(`行${lineNumber}: 高さが無効です（${hStr}）`);
            return;
        }
        
        result.push({ code, qty, weight, l, w, h });
    });
    
    return { data: result, errors };
}

// Generate CSV content
export function generateCSV(data, headers) {
    const csvContent = [
        headers.join(','),
        ...data.map(row => headers.map(header => row[header] || '').join(','))
    ].join('\n');
    
    return csvContent;
}

// Download file helper
export function downloadFile(content, filename, mimeType = 'text/plain') {
    const blob = new Blob([content], { type: mimeType });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}