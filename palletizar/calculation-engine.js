// Calculation Engine for Palletizar
// Core palletization algorithms and optimization logic

class PalletizationEngine {
    constructor() {
        this.config = PalletizerConfig;
        this.utils = PalletizerUtils;
        this.cache = new Map();
    }
    
    // Main calculation entry point
    calculate(cartons, palletSizes, options = {}) {
        return this.utils.errorHandler.wrap(() => {
            // Start performance timer
            this.utils.performance.startTimer('palletization-calculation');
            
            // Validate inputs
            this.validateInputs(cartons, palletSizes, options);
            
            // Get options with defaults
            const calcOptions = {
                heightLimit: options.heightLimit || this.config.constraints.DEFAULT_HEIGHT_LIMIT,
                enableMixedCargo: options.enableMixedCargo !== false,
                optimizationLevel: options.optimizationLevel || 'normal',
                maxCalculationTime: options.maxCalculationTime || this.config.performance.MAX_CALCULATION_TIME
            };
            
            // Check cache
            const cacheKey = this.getCacheKey(cartons, palletSizes, calcOptions);
            if (this.cache.has(cacheKey)) {
                this.utils.log.debug('Using cached calculation result');
                return this.cache.get(cacheKey);
            }
            
            // Perform calculation
            const results = this.performCalculation(cartons, palletSizes, calcOptions);
            
            // Cache results
            this.cacheResult(cacheKey, results);
            
            // End timer
            const duration = this.utils.performance.endTimer('palletization-calculation');
            
            // Add metadata
            results.metadata = {
                calculationTime: duration,
                timestamp: Date.now(),
                options: calcOptions
            };
            
            return results;
        }, 'Palletization Calculation')();
    }
    
    // Validate inputs
    validateInputs(cartons, palletSizes, options) {
        if (!Array.isArray(cartons) || cartons.length === 0) {
            throw new Error('No cartons provided for calculation');
        }
        
        if (!Array.isArray(palletSizes) || palletSizes.length === 0) {
            throw new Error('No pallet sizes selected');
        }
        
        // Validate each carton
        cartons.forEach(carton => {
            if (!this.utils.validation.isValidDimension(carton.l) ||
                !this.utils.validation.isValidDimension(carton.w) ||
                !this.utils.validation.isValidDimension(carton.h)) {
                throw new Error(`Invalid dimensions for carton ${carton.code}`);
            }
            
            if (!this.utils.validation.isValidWeight(carton.weight)) {
                throw new Error(`Invalid weight for carton ${carton.code}`);
            }
            
            if (!this.utils.validation.isValidQuantity(carton.qty)) {
                throw new Error(`Invalid quantity for carton ${carton.code}`);
            }
        });
    }
    
    // Perform main calculation
    performCalculation(cartons, palletSizes, options) {
        const results = [];
        const startTime = Date.now();
        
        // Calculate for each pallet size
        for (const palletSize of palletSizes) {
            // Check time limit
            if (Date.now() - startTime > options.maxCalculationTime) {
                this.utils.log.warn('Calculation time limit reached');
                break;
            }
            
            try {
                // Single cargo optimization
                const singleCargoResults = this.calculateSingleCargoOptimization(
                    cartons, palletSize, options
                );
                results.push(...singleCargoResults);
                
                // Mixed cargo optimization if enabled
                if (options.enableMixedCargo && cartons.length > 1) {
                    const mixedResults = this.calculateMixedCargoOptimization(
                        cartons, palletSize, options
                    );
                    results.push(...mixedResults);
                }
            } catch (error) {
                this.utils.log.error(`Failed to calculate for pallet ${palletSize.name}:`, error);
            }
        }
        
        // Sort by efficiency
        results.sort((a, b) => b.efficiency - a.efficiency);
        
        // Group by pallet type
        const groupedResults = this.groupResultsByPallet(results);
        
        return {
            allResults: results,
            groupedResults,
            bestResult: results[0] || null,
            totalPallets: results.length
        };
    }
    
    // Calculate single cargo optimization
    calculateSingleCargoOptimization(cartons, palletSize, options) {
        const results = [];
        const maxHeight = options.heightLimit - this.config.constraints.PALLET_BASE_HEIGHT;
        
        for (const carton of cartons) {
            const orientations = this.generateOrientations(carton);
            
            for (const orientation of orientations) {
                if (orientation.h > maxHeight) continue;
                
                const layout = this.calculateOptimalLayout(
                    orientation, palletSize, maxHeight, carton.qty
                );
                
                if (layout && layout.quantity > 0) {
                    const result = this.createPalletResult(
                        carton, palletSize, orientation, layout
                    );
                    
                    if (result.efficiency >= this.config.efficiency.MIN_EFFICIENCY_THRESHOLD) {
                        results.push(result);
                    }
                }
            }
        }
        
        return results;
    }
    
    // Calculate mixed cargo optimization
    calculateMixedCargoOptimization(cartons, palletSize, options) {
        const results = [];
        const maxHeight = options.heightLimit - this.config.constraints.PALLET_BASE_HEIGHT;
        
        // Try different cargo combinations (limit to pairs for performance)
        for (let i = 0; i < cartons.length - 1; i++) {
            for (let j = i + 1; j < cartons.length; j++) {
                const result = this.calculateMixedCargoPallet(
                    cartons[i], cartons[j], palletSize, maxHeight
                );
                
                if (result && result.efficiency >= this.config.efficiency.MIN_EFFICIENCY_THRESHOLD) {
                    results.push(result);
                }
            }
        }
        
        return results;
    }
    
    // Generate all possible orientations for a carton
    generateOrientations(carton) {
        const orientations = [
            { l: carton.l, w: carton.w, h: carton.h, description: '長さ×幅×高さ' },
            { l: carton.l, w: carton.h, h: carton.w, description: '長さ×高さ×幅' },
            { l: carton.w, w: carton.l, h: carton.h, description: '幅×長さ×高さ' },
            { l: carton.w, w: carton.h, h: carton.l, description: '幅×高さ×長さ' },
            { l: carton.h, w: carton.l, h: carton.w, description: '高さ×長さ×幅' },
            { l: carton.h, w: carton.w, h: carton.l, description: '高さ×幅×長さ' }
        ];
        
        // Remove duplicates
        const unique = [];
        const seen = new Set();
        
        for (const orient of orientations) {
            const key = `${orient.l}-${orient.w}-${orient.h}`;
            if (!seen.has(key)) {
                seen.add(key);
                unique.push(orient);
            }
        }
        
        return unique;
    }
    
    // Calculate optimal layout for given orientation
    calculateOptimalLayout(orientation, palletSize, maxHeight, maxQuantity) {
        const xCount = Math.floor(palletSize.width / orientation.l);
        const yCount = Math.floor(palletSize.depth / orientation.w);
        const maxLayers = Math.floor(maxHeight / orientation.h);
        
        if (xCount <= 0 || yCount <= 0 || maxLayers <= 0) {
            return null;
        }
        
        const itemsPerLayer = xCount * yCount;
        const maxCapacity = itemsPerLayer * maxLayers;
        const actualQuantity = Math.min(maxCapacity, maxQuantity);
        const actualLayers = Math.ceil(actualQuantity / itemsPerLayer);
        
        return {
            x: xCount,
            y: yCount,
            layers: actualLayers,
            itemsPerLayer,
            quantity: actualQuantity,
            totalCapacity: maxCapacity
        };
    }
    
    // Create pallet result object
    createPalletResult(carton, palletSize, orientation, layout) {
        const totalHeight = (layout.layers * orientation.h) + this.config.constraints.PALLET_BASE_HEIGHT;
        const totalWeight = layout.quantity * carton.weight;
        
        // Calculate efficiencies
        const palletVolume = palletSize.width * palletSize.depth * 
                           (this.config.constraints.DEFAULT_HEIGHT_LIMIT - this.config.constraints.PALLET_BASE_HEIGHT);
        const cartonVolume = layout.quantity * orientation.l * orientation.w * orientation.h;
        
        const volumeEfficiency = this.utils.calculation.calculateEfficiency(cartonVolume, palletVolume);
        const weightEfficiency = this.calculateWeightEfficiency(totalWeight);
        const stabilityEfficiency = this.calculateStabilityEfficiency(orientation, layout);
        
        // Calculate overall efficiency
        const efficiency = this.calculateOverallEfficiency(
            volumeEfficiency, weightEfficiency, stabilityEfficiency
        );
        
        // Generate layers detail
        const layers = this.generateLayers(orientation, layout, carton);
        
        return {
            id: this.generateResultId(),
            carton: {
                ...carton,
                orientation,
                orientationDesc: orientation.description
            },
            palletSize,
            layout,
            quantity: layout.quantity,
            efficiency,
            volumeEfficiency,
            weightEfficiency,
            stabilityEfficiency,
            height: totalHeight,
            weight: totalWeight,
            volume: cartonVolume / 1000000, // Convert to m³
            layers,
            centerOfGravity: this.calculateCenterOfGravity(layers),
            isStable: stabilityEfficiency >= 70,
            warnings: this.checkWarnings(totalHeight, totalWeight, stabilityEfficiency)
        };
    }
    
    // Calculate weight efficiency
    calculateWeightEfficiency(totalWeight) {
        const maxWeight = this.config.constraints.MAX_PALLET_WEIGHT;
        if (totalWeight > maxWeight) return 0;
        
        // Linear decrease from 100% at 0kg to 50% at max weight
        return Math.max(50, 100 - (totalWeight / maxWeight * 50));
    }
    
    // Calculate stability efficiency
    calculateStabilityEfficiency(orientation, layout) {
        // Base stability on aspect ratios and layer count
        const aspectRatio = Math.max(orientation.l, orientation.w) / 
                          Math.min(orientation.l, orientation.w);
        const heightRatio = (layout.layers * orientation.h) / 
                          Math.max(orientation.l, orientation.w);
        
        let stability = 100;
        
        // Penalize high aspect ratios
        if (aspectRatio > 2) {
            stability -= (aspectRatio - 2) * 10;
        }
        
        // Penalize tall stacks
        if (heightRatio > 1.5) {
            stability -= (heightRatio - 1.5) * 20;
        }
        
        // Penalize many layers
        if (layout.layers > 10) {
            stability -= (layout.layers - 10) * 5;
        }
        
        return Math.max(0, Math.min(100, stability));
    }
    
    // Calculate overall efficiency
    calculateOverallEfficiency(volumeEff, weightEff, stabilityEff) {
        const weights = this.config.efficiency;
        return volumeEff * weights.VOLUME_WEIGHT +
               weightEff * weights.WEIGHT_EFFICIENCY_WEIGHT +
               stabilityEff * weights.STABILITY_WEIGHT;
    }
    
    // Generate layer details
    generateLayers(orientation, layout, carton) {
        const layers = [];
        let remainingQty = layout.quantity;
        
        for (let i = 0; i < layout.layers; i++) {
            const layerQty = Math.min(layout.itemsPerLayer, remainingQty);
            
            layers.push({
                layerNumber: i + 1,
                quantity: layerQty,
                height: orientation.h,
                weight: layerQty * carton.weight,
                arrangement: {
                    x: layout.x,
                    y: layout.y
                }
            });
            
            remainingQty -= layerQty;
        }
        
        return layers;
    }
    
    // Calculate center of gravity
    calculateCenterOfGravity(layers) {
        let totalWeight = 0;
        let weightedHeight = 0;
        let currentHeight = this.config.constraints.PALLET_BASE_HEIGHT;
        
        layers.forEach(layer => {
            const layerCenterHeight = currentHeight + (layer.height / 2);
            weightedHeight += layer.weight * layerCenterHeight;
            totalWeight += layer.weight;
            currentHeight += layer.height;
        });
        
        return {
            x: 50, // Center of pallet width (%)
            y: 50, // Center of pallet depth (%)
            z: totalWeight > 0 ? this.utils.calculation.roundTo(weightedHeight / totalWeight) : 0
        };
    }
    
    // Check for warnings
    checkWarnings(height, weight, stability) {
        const warnings = [];
        
        if (height > this.config.constraints.DEFAULT_HEIGHT_LIMIT) {
            warnings.push({
                type: 'height',
                message: this.config.messages.warnings.HEIGHT_EXCEEDED,
                severity: 'error'
            });
        }
        
        if (weight > this.config.constraints.MAX_PALLET_WEIGHT * 0.9) {
            warnings.push({
                type: 'weight',
                message: '重量が制限に近づいています',
                severity: 'warning'
            });
        }
        
        if (stability < 70) {
            warnings.push({
                type: 'stability',
                message: this.config.messages.warnings.UNSTABLE_STACKING,
                severity: 'warning'
            });
        }
        
        return warnings;
    }
    
    // Calculate mixed cargo pallet
    calculateMixedCargoPallet(carton1, carton2, palletSize, maxHeight) {
        // Simplified mixed cargo calculation
        // In production, this would be more sophisticated
        
        const orient1 = this.generateOrientations(carton1)[0];
        const orient2 = this.generateOrientations(carton2)[0];
        
        if (orient1.h + orient2.h > maxHeight) {
            return null;
        }
        
        // Try stacking carton1 on bottom, carton2 on top
        const layout1 = this.calculateOptimalLayout(orient1, palletSize, orient1.h, carton1.qty);
        const layout2 = this.calculateOptimalLayout(orient2, palletSize, orient2.h, carton2.qty);
        
        if (!layout1 || !layout2) {
            return null;
        }
        
        const totalHeight = orient1.h + orient2.h + this.config.constraints.PALLET_BASE_HEIGHT;
        const totalWeight = (layout1.quantity * carton1.weight) + (layout2.quantity * carton2.weight);
        
        if (totalWeight > this.config.constraints.MAX_PALLET_WEIGHT) {
            return null;
        }
        
        // Create mixed result
        return {
            id: this.generateResultId(),
            type: 'mixed',
            cartons: [carton1, carton2],
            palletSize,
            layouts: [layout1, layout2],
            quantity: layout1.quantity + layout2.quantity,
            height: totalHeight,
            weight: totalWeight,
            efficiency: 75, // Simplified efficiency
            isMixed: true
        };
    }
    
    // Group results by pallet
    groupResultsByPallet(results) {
        const grouped = {};
        
        results.forEach(result => {
            const palletName = result.palletSize.name;
            if (!grouped[palletName]) {
                grouped[palletName] = [];
            }
            grouped[palletName].push(result);
        });
        
        return grouped;
    }
    
    // Generate cache key
    getCacheKey(cartons, palletSizes, options) {
        const cartonKey = cartons.map(c => 
            `${c.code}-${c.qty}-${c.l}-${c.w}-${c.h}-${c.weight}`
        ).join('|');
        
        const palletKey = palletSizes.map(p => p.name).join('|');
        const optionsKey = `${options.heightLimit}-${options.enableMixedCargo}`;
        
        return `${cartonKey}::${palletKey}::${optionsKey}`;
    }
    
    // Cache result
    cacheResult(key, result) {
        // Limit cache size
        if (this.cache.size >= this.config.performance.CACHE_SIZE_LIMIT) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(key, result);
    }
    
    // Clear cache
    clearCache() {
        this.cache.clear();
        this.utils.log.debug('Calculation cache cleared');
    }
    
    // Generate unique result ID
    generateResultId() {
        return `result-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    }
}

// Create singleton instance
const calculationEngine = new PalletizationEngine();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = calculationEngine;
}