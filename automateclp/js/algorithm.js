// algorithm.js - Advanced Pallet Placement Algorithm

class PalletPlacementAlgorithm {
    constructor() {
        this.iterationCount = 0;
        this.placementHistory = [];
        this.optimizationStats = {
            totalPallets: 0,
            placedPallets: 0,
            efficiency: 0,
            iterations: 0,
            executionTime: 0
        };
    }

    // Main placement algorithm
    placePallets(pallets, container, clearance) {
        const startTime = performance.now();
        this.optimizationStats.totalPallets = pallets.length;
        this.optimizationStats.iterations = 0;

        console.log(`Starting placement algorithm for ${pallets.length} pallets`);
        console.log(`Container: ${container.length}cm × ${container.width}cm`);
        console.log(`Clearance: ${clearance}cm`);

        // Reset state
        this.iterationCount = 0;
        this.placementHistory = [];
        
        // Generate all pallet instances
        const allPallets = this.generatePalletInstances(pallets);
        
        // Sort pallets by area (largest first) for better placement
        allPallets.sort((a, b) => (b.length * b.width) - (a.length * a.width));
        
        // Try different placement strategies
        let bestPlacement = this.tryMultipleStrategies(allPallets, container, clearance);
        
        // Calculate final statistics
        const endTime = performance.now();
        this.optimizationStats.executionTime = endTime - startTime;
        this.optimizationStats.placedPallets = bestPlacement.filter(p => p.placed).length;
        this.optimizationStats.efficiency = this.calculateEfficiency(bestPlacement, container);
        
        console.log(`Algorithm completed in ${this.optimizationStats.executionTime.toFixed(2)}ms`);
        console.log(`Placed ${this.optimizationStats.placedPallets}/${this.optimizationStats.totalPallets} pallets`);
        console.log(`Efficiency: ${(this.optimizationStats.efficiency * 100).toFixed(2)}%`);
        
        return bestPlacement;
    }

    // Generate individual pallet instances from pallet types
    generatePalletInstances(palletTypes) {
        const instances = [];
        palletTypes.forEach(type => {
            for (let i = 0; i < type.qty; i++) {
                instances.push({
                    id: type.id,
                    instance: i,
                    length: type.length,
                    width: type.width,
                    color: type.color,
                    placed: false,
                    deleted: false,
                    x: 0,
                    y: 0,
                    finalLength: type.length,
                    finalWidth: type.width,
                    rotated: false,
                    area: type.length * type.width
                });
            }
        });
        return instances;
    }

    // Try multiple placement strategies and return the best result
    tryMultipleStrategies(pallets, container, clearance) {
        const strategies = [
            () => this.strategyFirstFit(pallets, container, clearance),
            () => this.strategyBestFit(pallets, container, clearance),
            () => this.strategyGuillotineCut(pallets, container, clearance),
            () => this.strategySkylinePlacement(pallets, container, clearance)
        ];

        let bestResult = [];
        let bestScore = 0;

        strategies.forEach((strategy, index) => {
            console.log(`Trying strategy ${index + 1}: ${strategy.name}`);
            
            // Reset pallets for each strategy
            const palletsCopy = JSON.parse(JSON.stringify(pallets));
            
            try {
                const result = strategy.call(this, palletsCopy, container, clearance);
                const score = this.evaluatePlacement(result, container);
                
                if (score > bestScore) {
                    bestScore = score;
                    bestResult = result;
                    console.log(`Strategy ${index + 1} achieved score: ${score.toFixed(2)}`);
                }
            } catch (error) {
                console.warn(`Strategy ${index + 1} failed:`, error);
            }
        });

        return bestResult;
    }

    // First-fit strategy: place pallets in the first available position
    strategyFirstFit(pallets, container, clearance) {
        const placed = [];
        
        pallets.forEach(pallet => {
            const position = this.findFirstFitPosition(pallet, placed, container, clearance);
            if (position) {
                pallet.x = position.x;
                pallet.y = position.y;
                pallet.placed = true;
                placed.push({
                    x: position.x,
                    y: position.y,
                    length: pallet.finalLength,
                    width: pallet.finalWidth
                });
            }
        });

        return pallets;
    }

    // Best-fit strategy: find the most efficient position for each pallet
    strategyBestFit(pallets, container, clearance) {
        const placed = [];
        
        pallets.forEach(pallet => {
            const position = this.findBestFitPosition(pallet, placed, container, clearance);
            if (position) {
                pallet.x = position.x;
                pallet.y = position.y;
                pallet.placed = true;
                placed.push({
                    x: position.x,
                    y: position.y,
                    length: pallet.finalLength,
                    width: pallet.finalWidth
                });
            }
        });

        return pallets;
    }

    // Guillotine cut strategy: divide container into rectangles
    strategyGuillotineCut(pallets, container, clearance) {
        const placed = [];
        const freeRects = [{ x: 0, y: 0, width: container.length, height: container.width }];
        
        pallets.forEach(pallet => {
            const position = this.findGuillotinePosition(pallet, freeRects, clearance);
            if (position) {
                pallet.x = position.x;
                pallet.y = position.y;
                pallet.placed = true;
                placed.push({
                    x: position.x,
                    y: position.y,
                    length: pallet.finalLength,
                    width: pallet.finalWidth
                });
                
                // Update free rectangles
                this.updateFreeRectangles(freeRects, position, pallet.finalLength, pallet.finalWidth);
            }
        });

        return pallets;
    }

    // Skyline placement strategy: maintain a skyline of placed pallets
    strategySkylinePlacement(pallets, container, clearance) {
        const placed = [];
        const skyline = [{ x: 0, y: 0, width: container.length }];
        
        pallets.forEach(pallet => {
            const position = this.findSkylinePosition(pallet, skyline, container, clearance);
            if (position) {
                pallet.x = position.x;
                pallet.y = position.y;
                pallet.placed = true;
                placed.push({
                    x: position.x,
                    y: position.y,
                    length: pallet.finalLength,
                    width: pallet.finalWidth
                });
                
                // Update skyline
                this.updateSkyline(skyline, position, pallet.finalLength, pallet.finalWidth);
            }
        });

        return pallets;
    }

    // Find first available position for a pallet
    findFirstFitPosition(pallet, placed, container, clearance) {
        const orientations = this.getPalletOrientations(pallet);
        
        for (const [length, width, rotated] of orientations) {
            for (let y = 0; y <= container.width - width; y += CONFIG.ALGORITHM.GRID_STEP) {
                for (let x = 0; x <= container.length - length; x += CONFIG.ALGORITHM.GRID_STEP) {
                    if (this.canPlacePallet(x, y, length, width, placed, clearance, container)) {
                        pallet.finalLength = length;
                        pallet.finalWidth = width;
                        pallet.rotated = rotated;
                        return { x, y };
                    }
                }
            }
        }
        
        return null;
    }

    // Find best position for a pallet (minimize waste)
    findBestFitPosition(pallet, placed, container, clearance) {
        const orientations = this.getPalletOrientations(pallet);
        let bestPosition = null;
        let bestScore = Infinity;
        
        for (const [length, width, rotated] of orientations) {
            for (let y = 0; y <= container.width - width; y += CONFIG.ALGORITHM.GRID_STEP) {
                for (let x = 0; x <= container.length - length; x += CONFIG.ALGORITHM.GRID_STEP) {
                    if (this.canPlacePallet(x, y, length, width, placed, clearance, container)) {
                        const score = this.calculatePlacementScore(x, y, length, width, container);
                        if (score < bestScore) {
                            bestScore = score;
                            bestPosition = { x, y };
                            pallet.finalLength = length;
                            pallet.finalWidth = width;
                            pallet.rotated = rotated;
                        }
                    }
                }
            }
        }
        
        return bestPosition;
    }

    // Get possible orientations for a pallet
    getPalletOrientations(pallet) {
        if (!CONFIG.ALGORITHM.ROTATION_ENABLED || pallet.length === pallet.width) {
            return [[pallet.length, pallet.width, false]];
        }
        return [
            [pallet.length, pallet.width, false],
            [pallet.width, pallet.length, true]
        ];
    }

    // Check if a pallet can be placed at given position
    canPlacePallet(x, y, length, width, placed, clearance, container) {
        // Check container boundaries
        if (x < 0 || y < 0 || x + length > container.length || y + width > container.width) {
            return false;
        }
        
        // Check collision with other pallets
        return !placed.some(rect => 
            this.rectanglesOverlap(
                { x, y, length, width },
                rect,
                clearance
            )
        );
    }

    // Check if two rectangles overlap (with clearance)
    rectanglesOverlap(rect1, rect2, clearance) {
        return !(
            rect1.x + rect1.length + clearance <= rect2.x + CONFIG.RENDER.EPSILON ||
            rect2.x + rect2.length + clearance <= rect1.x + CONFIG.RENDER.EPSILON ||
            rect1.y + rect1.width + clearance <= rect2.y + CONFIG.RENDER.EPSILON ||
            rect2.y + rect2.width + clearance <= rect1.y + CONFIG.RENDER.EPSILON
        );
    }

    // Calculate placement score (lower is better)
    calculatePlacementScore(x, y, length, width, container) {
        // Prefer positions closer to origin (left-bottom)
        const distanceFromOrigin = Math.sqrt(x * x + y * y);
        
        // Prefer positions that don't leave small gaps
        const rightEdge = x + length;
        const topEdge = y + width;
        const gapToRight = container.length - rightEdge;
        const gapToTop = container.width - topEdge;
        
        // Penalize small gaps
        const gapPenalty = (gapToRight < 50 ? gapToRight * 2 : 0) + 
                          (gapToTop < 50 ? gapToTop * 2 : 0);
        
        return distanceFromOrigin + gapPenalty;
    }

    // Evaluate overall placement quality
    evaluatePlacement(pallets, container) {
        const placedPallets = pallets.filter(p => p.placed);
        if (placedPallets.length === 0) return 0;
        
        const totalArea = container.length * container.width;
        const usedArea = placedPallets.reduce((sum, p) => sum + (p.finalLength * p.finalWidth), 0);
        const areaEfficiency = usedArea / totalArea;
        
        // Consider compactness (how close pallets are to each other)
        const compactness = this.calculateCompactness(placedPallets);
        
        return areaEfficiency * 0.7 + compactness * 0.3;
    }

    // Calculate how compact the placement is
    calculateCompactness(pallets) {
        if (pallets.length < 2) return 1;
        
        let totalDistance = 0;
        let comparisons = 0;
        
        for (let i = 0; i < pallets.length; i++) {
            for (let j = i + 1; j < pallets.length; j++) {
                const p1 = pallets[i];
                const p2 = pallets[j];
                const distance = Math.sqrt(
                    Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2)
                );
                totalDistance += distance;
                comparisons++;
            }
        }
        
        const avgDistance = totalDistance / comparisons;
        const maxPossibleDistance = Math.sqrt(Math.pow(1200, 2) + Math.pow(300, 2));
        
        return 1 - (avgDistance / maxPossibleDistance);
    }

    // Calculate efficiency percentage
    calculateEfficiency(pallets, container) {
        const placedPallets = pallets.filter(p => p.placed);
        if (placedPallets.length === 0) return 0;
        
        const totalArea = container.length * container.width;
        const usedArea = placedPallets.reduce((sum, p) => sum + (p.finalLength * p.finalWidth), 0);
        
        return usedArea / totalArea;
    }

    // Get algorithm statistics
    getStats() {
        return { ...this.optimizationStats };
    }

    // Reset algorithm state
    reset() {
        this.iterationCount = 0;
        this.placementHistory = [];
        this.optimizationStats = {
            totalPallets: 0,
            placedPallets: 0,
            efficiency: 0,
            iterations: 0,
            executionTime: 0
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PalletPlacementAlgorithm;
}