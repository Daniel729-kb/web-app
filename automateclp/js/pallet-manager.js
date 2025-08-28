// pallet-manager.js - Pallet Management and Operations

class PalletManager {
    constructor() {
        this.pallets = [];
        this.allPalletsGenerated = [];
        this.nextId = 1;
        this.loadFromStorage();
    }

    // Add a new pallet type
    add(length, width, qty) {
        // Validate input
        if (!Utils.validation.isValidDimension(length) || 
            !Utils.validation.isValidDimension(width) || 
            !Utils.validation.isValidQuantity(qty)) {
            throw new Error('Invalid pallet dimensions or quantity');
        }

        // Check if we've reached the maximum number of pallet types
        if (this.pallets.length >= CONFIG.UI.MAX_PALLET_TYPES) {
            throw new Error(`Maximum number of pallet types (${CONFIG.UI.MAX_PALLET_TYPES}) reached`);
        }

        // Check if this exact pallet type already exists
        const existingPallet = this.pallets.find(p => 
            p.length === length && p.width === width
        );

        if (existingPallet) {
            existingPallet.qty += qty;
            this.saveToStorage();
            return existingPallet;
        }

        // Create new pallet type
        const newPallet = {
            id: this.nextId++,
            length: parseInt(length),
            width: parseInt(width),
            qty: parseInt(qty),
            color: Utils.colors.getRandomColor(),
            createdAt: new Date().toISOString()
        };

        this.pallets.push(newPallet);
        this.saveToStorage();
        
        console.log(`Added pallet: ${length}×${width}cm (${qty}個)`);
        return newPallet;
    }

    // Remove a pallet type
    remove(id) {
        const index = this.pallets.findIndex(p => p.id === id);
        if (index === -1) {
            throw new Error('Pallet not found');
        }

        const removedPallet = this.pallets.splice(index, 1)[0];
        this.saveToStorage();
        
        console.log(`Removed pallet: ${removedPallet.length}×${removedPallet.width}cm`);
        return removedPallet;
    }

    // Update pallet quantity
    updateQuantity(id, newQty) {
        const pallet = this.pallets.find(p => p.id === id);
        if (!pallet) {
            throw new Error('Pallet not found');
        }

        if (!Utils.validation.isValidQuantity(newQty)) {
            throw new Error('Invalid quantity');
        }

        pallet.qty = parseInt(newQty);
        pallet.updatedAt = new Date().toISOString();
        this.saveToStorage();
        
        console.log(`Updated pallet ${id} quantity to ${newQty}`);
        return pallet;
    }

    // Get all pallet types
    getAll() {
        return [...this.pallets];
    }

    // Get total number of pallets
    getTotalCount() {
        return this.pallets.reduce((sum, p) => sum + p.qty, 0);
    }

    // Get pallet by ID
    getById(id) {
        return this.pallets.find(p => p.id === id);
    }

    // Clear all pallets
    clear() {
        this.pallets = [];
        this.allPalletsGenerated = [];
        this.nextId = 1;
        this.saveToStorage();
        console.log('All pallets cleared');
    }

    // Generate all pallet instances for placement
    generateAllInstances() {
        this.allPalletsGenerated = [];
        
        this.pallets.forEach(palletType => {
            for (let i = 0; i < palletType.qty; i++) {
                this.allPalletsGenerated.push({
                    id: palletType.id,
                    instance: i,
                    length: palletType.length,
                    width: palletType.width,
                    color: palletType.color,
                    placed: false,
                    deleted: false,
                    x: 0,
                    y: 0,
                    finalLength: palletType.length,
                    finalWidth: palletType.width,
                    rotated: false,
                    area: palletType.length * palletType.width
                });
            }
        });

        console.log(`Generated ${this.allPalletsGenerated.length} pallet instances`);
        return this.allPalletsGenerated;
    }

    // Get placed pallets
    getPlacedPallets() {
        return this.allPalletsGenerated.filter(p => p.placed && !p.deleted);
    }

    // Get unplaced pallets
    getUnplacedPallets() {
        return this.allPalletsGenerated.filter(p => !p.placed && !p.deleted);
    }

    // Get deleted pallets
    getDeletedPallets() {
        return this.allPalletsGenerated.filter(p => p.deleted);
    }

    // Mark pallet as placed
    markAsPlaced(id, instance, x, y, length, width, rotated = false) {
        const pallet = this.allPalletsGenerated.find(p => 
            p.id === id && p.instance === instance
        );

        if (pallet) {
            pallet.placed = true;
            pallet.x = x;
            pallet.y = y;
            pallet.finalLength = length;
            pallet.finalWidth = width;
            pallet.rotated = rotated;
        }
    }

    // Mark pallet as deleted
    markAsDeleted(id, instance) {
        const pallet = this.allPalletsGenerated.find(p => 
            p.id === id && p.instance === instance
        );

        if (pallet) {
            pallet.deleted = true;
        }
    }

    // Update pallet position
    updatePosition(id, instance, x, y) {
        const pallet = this.allPalletsGenerated.find(p => 
            p.id === id && p.instance === instance
        );

        if (pallet) {
            pallet.x = x;
            pallet.y = y;
        }
    }

    // Rotate pallet
    rotatePallet(id, instance) {
        const pallet = this.allPalletsGenerated.find(p => 
            p.id === id && p.instance === instance
        );

        if (pallet) {
            [pallet.finalLength, pallet.finalWidth] = [pallet.finalWidth, pallet.finalLength];
            pallet.rotated = !pallet.rotated;
        }
    }

    // Get pallet statistics
    getStats() {
        const totalPallets = this.getTotalCount();
        const placedPallets = this.getPlacedPallets().length;
        const unplacedPallets = this.getUnplacedPallets().length;
        const deletedPallets = this.getDeletedPallets().length;

        return {
            totalPallets,
            placedPallets,
            unplacedPallets,
            deletedPallets,
            placementRate: totalPallets > 0 ? (placedPallets / totalPallets) * 100 : 0
        };
    }

    // Get pallet area statistics
    getAreaStats(container) {
        const placedPallets = this.getPlacedPallets();
        const containerArea = (container.length * container.width) / 10000; // m²
        const usedArea = placedPallets.reduce((sum, p) => 
            sum + (p.finalLength * p.finalWidth) / 10000, 0
        );

        return {
            containerArea: Utils.math.round(containerArea, 2),
            usedArea: Utils.math.round(usedArea, 2),
            remainingArea: Utils.math.round(containerArea - usedArea, 2),
            efficiency: containerArea > 0 ? Utils.math.round((usedArea / containerArea) * 100, 1) : 0
        };
    }

    // Export pallet data
    exportData() {
        return {
            pallets: this.getAll(),
            generated: this.allPalletsGenerated,
            stats: this.getStats(),
            exportDate: Utils.date.getCurrentTimestamp()
        };
    }

    // Import pallet data
    importData(data) {
        try {
            if (data.pallets && Array.isArray(data.pallets)) {
                this.pallets = data.pallets;
                this.nextId = Math.max(...this.pallets.map(p => p.id), 0) + 1;
            }
            
            if (data.generated && Array.isArray(data.generated)) {
                this.allPalletsGenerated = data.generated;
            }
            
            this.saveToStorage();
            console.log('Pallet data imported successfully');
            return true;
        } catch (error) {
            console.error('Failed to import pallet data:', error);
            return false;
        }
    }

    // Save to localStorage
    saveToStorage() {
        Utils.storage.set('automateclp_pallets', this.pallets);
        Utils.storage.set('automateclp_nextId', this.nextId);
    }

    // Load from localStorage
    loadFromStorage() {
        try {
            const savedPallets = Utils.storage.get('automateclp_pallets', []);
            const savedNextId = Utils.storage.get('automateclp_nextId', 1);
            
            this.pallets = savedPallets;
            this.nextId = savedNextId;
            
            console.log(`Loaded ${this.pallets.length} pallet types from storage`);
        } catch (error) {
            console.warn('Failed to load pallets from storage:', error);
            this.pallets = [];
            this.nextId = 1;
        }
    }

    // Validate pallet configuration
    validateConfiguration() {
        const errors = [];
        
        if (this.pallets.length === 0) {
            errors.push('No pallet types defined');
        }
        
        this.pallets.forEach((pallet, index) => {
            if (!Utils.validation.isValidDimension(pallet.length)) {
                errors.push(`Pallet ${index + 1}: Invalid length (${pallet.length})`);
            }
            if (!Utils.validation.isValidDimension(pallet.width)) {
                errors.push(`Pallet ${index + 1}: Invalid width (${pallet.width})`);
            }
            if (!Utils.validation.isValidQuantity(pallet.qty)) {
                errors.push(`Pallet ${index + 1}: Invalid quantity (${pallet.qty})`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors: errors
        };
    }

    // Get pallet type summary
    getTypeSummary() {
        return this.pallets.map(p => ({
            id: p.id,
            dimensions: `${p.length}×${p.width}cm`,
            quantity: p.qty,
            color: p.color,
            area: p.length * p.width
        }));
    }

    // Reset all generated pallets
    resetGenerated() {
        this.allPalletsGenerated = [];
        console.log('Generated pallets reset');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PalletManager;
}