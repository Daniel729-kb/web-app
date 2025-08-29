// State Management Module for Palletizar
// Centralized state management with event-driven updates

class PalletizerState {
    constructor() {
        this.state = {
            // Carton data
            cartons: [],
            nextCartonId: 1,
            editingCartonId: null,
            
            // Pallet data
            selectedPalletSizes: [],
            calculatedPallets: [],
            
            // UI state
            isDarkMode: false,
            isCalculating: false,
            isImporting: false,
            activeView: 'input', // 'input', 'results', 'analysis'
            
            // Settings
            heightLimit: PalletizerConfig.constraints.DEFAULT_HEIGHT_LIMIT,
            enableMixedCargo: PalletizerConfig.features.ENABLE_MIXED_CARGO,
            
            // Cache
            calculationCache: new Map(),
            
            // History for undo/redo
            history: [],
            historyIndex: -1,
            maxHistorySize: 50,
            
            // Validation state
            validationErrors: {},
            
            // Performance metrics
            lastCalculationTime: 0,
            totalCalculations: 0
        };
        
        // Event listeners
        this.listeners = new Map();
        
        // Initialize with default pallet sizes
        this.state.selectedPalletSizes = [...PalletizerConfig.palletSizes];
        
        // Load saved state if available
        this.loadState();
    }
    
    // Get current state
    getState() {
        return { ...this.state };
    }
    
    // Update state with validation
    setState(updates, saveToHistory = true) {
        try {
            // Validate updates
            this.validateStateUpdate(updates);
            
            // Save current state to history if needed
            if (saveToHistory) {
                this.saveToHistory();
            }
            
            // Apply updates
            const oldState = { ...this.state };
            this.state = { ...this.state, ...updates };
            
            // Emit change events
            this.emitChange('stateChanged', {
                oldState,
                newState: this.state,
                changes: updates
            });
            
            // Auto-save to localStorage
            this.saveState();
            
            return true;
        } catch (error) {
            this.handleError('State update failed', error);
            return false;
        }
    }
    
    // Add carton with validation
    addCarton(cartonData) {
        try {
            // Validate carton data
            const validation = this.validateCarton(cartonData);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            const newCarton = {
                id: this.state.nextCartonId++,
                code: cartonData.code || `CARTON-${this.state.nextCartonId}`,
                qty: parseInt(cartonData.qty) || 1,
                weight: parseFloat(cartonData.weight) || 0,
                l: parseFloat(cartonData.l) || 0,
                w: parseFloat(cartonData.w) || 0,
                h: parseFloat(cartonData.h) || 0,
                createdAt: Date.now()
            };
            
            const newCartons = [...this.state.cartons, newCarton];
            this.setState({ 
                cartons: newCartons,
                nextCartonId: this.state.nextCartonId
            });
            
            this.emitChange('cartonAdded', newCarton);
            return newCarton;
        } catch (error) {
            this.handleError('Failed to add carton', error);
            return null;
        }
    }
    
    // Update carton
    updateCarton(id, updates) {
        try {
            const cartonIndex = this.state.cartons.findIndex(c => c.id === id);
            if (cartonIndex === -1) {
                throw new Error('Carton not found');
            }
            
            const updatedCarton = { ...this.state.cartons[cartonIndex], ...updates };
            
            // Validate updated carton
            const validation = this.validateCarton(updatedCarton);
            if (!validation.isValid) {
                throw new Error(validation.errors.join(', '));
            }
            
            const newCartons = [...this.state.cartons];
            newCartons[cartonIndex] = updatedCarton;
            
            this.setState({ cartons: newCartons });
            this.emitChange('cartonUpdated', updatedCarton);
            return updatedCarton;
        } catch (error) {
            this.handleError('Failed to update carton', error);
            return null;
        }
    }
    
    // Remove carton
    removeCarton(id) {
        try {
            const newCartons = this.state.cartons.filter(c => c.id !== id);
            this.setState({ cartons: newCartons });
            this.emitChange('cartonRemoved', { id });
            return true;
        } catch (error) {
            this.handleError('Failed to remove carton', error);
            return false;
        }
    }
    
    // Clear all cartons
    clearAllCartons() {
        try {
            this.setState({ 
                cartons: [],
                calculatedPallets: [],
                calculationCache: new Map()
            });
            this.emitChange('cartonsCleared');
            return true;
        } catch (error) {
            this.handleError('Failed to clear cartons', error);
            return false;
        }
    }
    
    // Validate carton data
    validateCarton(carton) {
        const errors = [];
        const config = PalletizerConfig;
        
        // Validate code
        if (!carton.code || carton.code.trim().length === 0) {
            errors.push('カートンコードは必須です');
        } else if (carton.code.length > config.validation.CARTON_CODE_MAX_LENGTH) {
            errors.push(`カートンコードは${config.validation.CARTON_CODE_MAX_LENGTH}文字以内にしてください`);
        }
        
        // Validate quantity
        if (carton.qty < config.validation.MIN_QUANTITY || carton.qty > config.validation.MAX_QUANTITY) {
            errors.push(`数量は${config.validation.MIN_QUANTITY}から${config.validation.MAX_QUANTITY}の間にしてください`);
        }
        
        // Validate weight
        if (carton.weight <= 0 || carton.weight > config.constraints.MAX_CARTON_WEIGHT) {
            errors.push(`重量は0から${config.constraints.MAX_CARTON_WEIGHT}kgの間にしてください`);
        }
        
        // Validate dimensions
        const dims = [carton.l, carton.w, carton.h];
        dims.forEach((dim, index) => {
            const dimName = ['長さ', '幅', '高さ'][index];
            if (dim < config.constraints.MIN_CARTON_DIMENSION || dim > config.constraints.MAX_CARTON_DIMENSION) {
                errors.push(`${dimName}は${config.constraints.MIN_CARTON_DIMENSION}から${config.constraints.MAX_CARTON_DIMENSION}cmの間にしてください`);
            }
        });
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }
    
    // Validate state update
    validateStateUpdate(updates) {
        if (updates.heightLimit !== undefined) {
            const limit = updates.heightLimit;
            if (limit < PalletizerConfig.constraints.MIN_HEIGHT_LIMIT || 
                limit > PalletizerConfig.constraints.MAX_HEIGHT_LIMIT) {
                throw new Error(`高さ制限は${PalletizerConfig.constraints.MIN_HEIGHT_LIMIT}から${PalletizerConfig.constraints.MAX_HEIGHT_LIMIT}cmの間にしてください`);
            }
        }
    }
    
    // History management
    saveToHistory() {
        // Remove any states after current index
        this.state.history = this.state.history.slice(0, this.state.historyIndex + 1);
        
        // Add current state
        const stateSnapshot = {
            cartons: [...this.state.cartons],
            selectedPalletSizes: [...this.state.selectedPalletSizes],
            heightLimit: this.state.heightLimit,
            timestamp: Date.now()
        };
        
        this.state.history.push(stateSnapshot);
        
        // Limit history size
        if (this.state.history.length > this.state.maxHistorySize) {
            this.state.history.shift();
        } else {
            this.state.historyIndex++;
        }
    }
    
    // Undo action
    undo() {
        if (this.state.historyIndex > 0) {
            this.state.historyIndex--;
            const previousState = this.state.history[this.state.historyIndex];
            this.setState(previousState, false);
            this.emitChange('undoPerformed');
            return true;
        }
        return false;
    }
    
    // Redo action
    redo() {
        if (this.state.historyIndex < this.state.history.length - 1) {
            this.state.historyIndex++;
            const nextState = this.state.history[this.state.historyIndex];
            this.setState(nextState, false);
            this.emitChange('redoPerformed');
            return true;
        }
        return false;
    }
    
    // Event management
    on(event, callback) {
        if (!this.listeners.has(event)) {
            this.listeners.set(event, []);
        }
        this.listeners.get(event).push(callback);
    }
    
    off(event, callback) {
        if (this.listeners.has(event)) {
            const callbacks = this.listeners.get(event);
            const index = callbacks.indexOf(callback);
            if (index > -1) {
                callbacks.splice(index, 1);
            }
        }
    }
    
    emitChange(event, data) {
        if (this.listeners.has(event)) {
            this.listeners.get(event).forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`Error in event listener for ${event}:`, error);
                }
            });
        }
    }
    
    // Persistence
    saveState() {
        try {
            const stateToSave = {
                cartons: this.state.cartons,
                selectedPalletSizes: this.state.selectedPalletSizes,
                heightLimit: this.state.heightLimit,
                isDarkMode: this.state.isDarkMode,
                enableMixedCargo: this.state.enableMixedCargo
            };
            localStorage.setItem('palletizer-state', JSON.stringify(stateToSave));
        } catch (error) {
            this.handleError('Failed to save state', error);
        }
    }
    
    loadState() {
        try {
            const savedState = localStorage.getItem('palletizer-state');
            if (savedState) {
                const parsed = JSON.parse(savedState);
                this.state = { ...this.state, ...parsed };
                
                // Restore nextCartonId
                if (this.state.cartons.length > 0) {
                    const maxId = Math.max(...this.state.cartons.map(c => c.id));
                    this.state.nextCartonId = maxId + 1;
                }
            }
        } catch (error) {
            this.handleError('Failed to load state', error);
        }
    }
    
    // Error handling
    handleError(message, error) {
        const errorMessage = `${message}: ${error.message}`;
        
        if (PalletizerConfig.DEBUG_MODE) {
            console.error(errorMessage, error);
        }
        
        this.emitChange('error', {
            message: errorMessage,
            error,
            timestamp: Date.now()
        });
    }
    
    // Get statistics
    getStatistics() {
        const totalCartons = this.state.cartons.reduce((sum, c) => sum + c.qty, 0);
        const totalWeight = this.state.cartons.reduce((sum, c) => sum + (c.weight * c.qty), 0);
        const totalVolume = this.state.cartons.reduce((sum, c) => 
            sum + (c.l * c.w * c.h * c.qty / 1000000), 0);
        
        return {
            itemCount: this.state.cartons.length,
            totalCartons,
            totalWeight,
            totalVolume,
            averageWeight: totalCartons > 0 ? totalWeight / totalCartons : 0,
            palletCount: this.state.calculatedPallets.length
        };
    }
}

// Create singleton instance
const stateManager = new PalletizerState();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = stateManager;
}