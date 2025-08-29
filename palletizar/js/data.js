// ====================================
// DATA MODULE - Data Management
// ====================================

import { parseCSV, generateCSV, downloadFile, getTimestampedFileName, showErrors } from './utils.js';

// Global data storage
export let cartonData = [
    { id: 1, code: 'SAMPLE A', qty: 362, weight: 6.70, l: 53.0, w: 38.5, h: 23.5 },
    { id: 2, code: 'SAMPLE B', qty: 42, weight: 7.60, l: 55.0, w: 40.0, h: 24.0 }
];

export let nextId = 7;
export let editingId = null;

// Pallet size definitions
export const allPalletSizes = [
    { name: '1100×1000', width: 110.0, depth: 100.0, description: '標準パレット' },
    { name: '1100×1100', width: 110.0, depth: 110.0, description: '正方形パレット' },
    { name: '1200×1000', width: 120.0, depth: 100.0, description: '大型パレット' },
    { name: '1200×1100', width: 120.0, depth: 110.0, description: '特大パレット' }
];

export let selectedPalletSizes = [...allPalletSizes]; // デフォルトで全選択

// Height limit management
export let maxHeightLimit = 158; // デフォルトは158cm（パレット台座14cm含む）

// Current pallets for global access
export let currentPallets = [];

// Set current pallets
export function setCurrentPallets(pallets) {
    currentPallets = pallets;
    window.currentPallets = pallets; // For backward compatibility
}

// Get current pallets
export function getCurrentPallets() {
    return currentPallets;
}

// Height limit functions
export function setMaxHeightLimit(height) {
    maxHeightLimit = height;
}

export function getMaxHeightLimit() {
    return maxHeightLimit;
}

export function getMaxCartonHeight() {
    return maxHeightLimit - 14; // パレット台座の高さを除く
}

export function getMaxTotalHeight() {
    return maxHeightLimit;
}

// Data manipulation functions
export function addCartonData(carton) {
    const newCarton = {
        id: nextId++,
        code: carton.code,
        qty: carton.qty,
        weight: carton.weight,
        l: carton.l,
        w: carton.w,
        h: carton.h
    };
    cartonData.push(newCarton);
    return newCarton;
}

export function updateCartonData(id, updatedCarton) {
    const index = cartonData.findIndex(item => item.id === id);
    if (index !== -1) {
        cartonData[index] = {
            id: id,
            code: updatedCarton.code,
            qty: updatedCarton.qty,
            weight: updatedCarton.weight,
            l: updatedCarton.l,
            w: updatedCarton.w,
            h: updatedCarton.h
        };
        return true;
    }
    return false;
}

export function deleteCartonData(id) {
    const index = cartonData.findIndex(item => item.id === id);
    if (index !== -1) {
        cartonData.splice(index, 1);
        return true;
    }
    return false;
}

export function clearAllCartonData() {
    cartonData.length = 0;
}

export function getCartonData() {
    return [...cartonData]; // Return copy to prevent direct modification
}

export function findCartonByCode(code) {
    return cartonData.find(item => item.code === code);
}

export function getCartonSummary() {
    const totalCartons = cartonData.reduce((sum, item) => sum + item.qty, 0);
    const totalWeight = cartonData.reduce((sum, item) => sum + (item.qty * item.weight), 0);
    const itemCount = cartonData.length;
    
    return { totalCartons, totalWeight, itemCount };
}

// Pallet selection management
export function setSelectedPalletSizes(pallets) {
    selectedPalletSizes = [...pallets];
}

export function getSelectedPalletSizes() {
    return [...selectedPalletSizes];
}

export function togglePalletSize(index) {
    const pallet = allPalletSizes[index];
    if (!pallet) return;
    
    const existingIndex = selectedPalletSizes.findIndex(p => p.name === pallet.name);
    if (existingIndex >= 0) {
        selectedPalletSizes.splice(existingIndex, 1);
    } else {
        selectedPalletSizes.push(pallet);
    }
}

export function selectAllPalletSizes() {
    selectedPalletSizes = [...allPalletSizes];
}

export function deselectAllPalletSizes() {
    selectedPalletSizes = [];
}

// CSV import/export functions
export function parseAndImportCSV(csvText) {
    const { data, errors } = parseCSV(csvText);
    
    if (errors.length > 0) {
        return { errors, newCartons: [] };
    }
    
    const newCartons = [];
    const duplicateErrors = [];
    
    data.forEach(item => {
        const existing = cartonData.find(existing => existing.code === item.code);
        if (existing) {
            duplicateErrors.push(`貨物コード "${item.code}" は既に存在します。`);
        } else {
            const newCarton = addCartonData(item);
            newCartons.push(newCarton);
        }
    });
    
    return { 
        errors: duplicateErrors, 
        newCartons,
        totalImported: newCartons.length 
    };
}

export function generateCSVTemplate() {
    const templateData = [
        { code: 'SAMPLE', qty: 209, weight: 6.70, l: 53.0, w: 38.5, h: 23.5 }
    ];
    
    const headers = ['code', 'qty', 'weight', 'l', 'w', 'h'];
    const csvContent = generateCSV(templateData, headers);
    
    // Add header row with Japanese labels
    const headerRow = '貨物コード,数量,重量(kg),長さ(cm),幅(cm),高さ(cm)';
    const fullContent = headerRow + '\n' + csvContent;
    
    return fullContent;
}

export function downloadCSVTemplate() {
    const content = generateCSVTemplate();
    const filename = 'palletizar_template.csv';
    downloadFile(content, filename, 'text/csv;charset=utf-8;');
}

export function exportCartonDataCSV() {
    if (cartonData.length === 0) {
        showErrors(['エクスポートするデータがありません。']);
        return;
    }
    
    const headers = ['code', 'qty', 'weight', 'l', 'w', 'h'];
    const csvContent = generateCSV(cartonData, headers);
    
    // Add header row with Japanese labels
    const headerRow = '貨物コード,数量,重量(kg),長さ(cm),幅(cm),高さ(cm)';
    const fullContent = headerRow + '\n' + csvContent;
    
    const filename = getTimestampedFileName('carton_data', 'csv');
    downloadFile(fullContent, filename, 'text/csv;charset=utf-8;');
}

// Editing state management
export function setEditingId(id) {
    editingId = id;
}

export function getEditingId() {
    return editingId;
}

export function clearEditingId() {
    editingId = null;
}

// Data validation
export function validateCartonData(carton) {
    const errors = [];
    
    if (!carton.code || !carton.code.trim()) {
        errors.push('貨物コードは必須です');
    }
    
    if (!carton.qty || carton.qty <= 0) {
        errors.push('数量は1以上である必要があります');
    }
    
    if (!carton.weight || carton.weight <= 0) {
        errors.push('重量は0より大きい値である必要があります');
    }
    
    if (!carton.l || carton.l <= 0) {
        errors.push('長さは0より大きい値である必要があります');
    }
    
    if (!carton.w || carton.w <= 0) {
        errors.push('幅は0より大きい値である必要があります');
    }
    
    if (!carton.h || carton.h <= 0) {
        errors.push('高さは0より大きい値である必要があります');
    }
    
    return errors;
}

// Local storage functions
export function saveToLocalStorage() {
    try {
        const data = {
            cartonData,
            maxHeightLimit,
            selectedPalletSizes,
            nextId
        };
        localStorage.setItem('palletizar_data', JSON.stringify(data));
        return true;
    } catch (error) {
        console.error('Failed to save to localStorage:', error);
        return false;
    }
}

export function loadFromLocalStorage() {
    try {
        const saved = localStorage.getItem('palletizar_data');
        if (saved) {
            const data = JSON.parse(saved);
            if (data.cartonData) cartonData = data.cartonData;
            if (data.maxHeightLimit) maxHeightLimit = data.maxHeightLimit;
            if (data.selectedPalletSizes) selectedPalletSizes = data.selectedPalletSizes;
            if (data.nextId) nextId = data.nextId;
            return true;
        }
    } catch (error) {
        console.error('Failed to load from localStorage:', error);
    }
    return false;
}

export function clearLocalStorage() {
    try {
        localStorage.removeItem('palletizar_data');
        return true;
    } catch (error) {
        console.error('Failed to clear localStorage:', error);
        return false;
    }
}