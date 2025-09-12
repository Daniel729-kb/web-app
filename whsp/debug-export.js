/**
 * Debug Export Module
 * Exports user inputs and processed values for layout generator improvement
 */
class DebugExporter {
    constructor(calculator) {
        this.calculator = calculator;
        this.debugData = {
            timestamp: null,
            userInputs: {},
            processedValues: {},
            layoutResults: {},
            performance: {}
        };
    }

    /**
     * Collect all debug data for export
     */
    collectDebugData() {
        const timestamp = new Date().toISOString();
        this.debugData.timestamp = timestamp;
        
        // Collect user inputs
        this.debugData.userInputs = this.collectUserInputs();
        
        // Collect processed values
        this.debugData.processedValues = this.collectProcessedValues();
        
        // Collect layout results
        this.debugData.layoutResults = this.collectLayoutResults();
        
        // Collect performance data
        this.debugData.performance = this.collectPerformanceData();
        
        console.log('Debug data collected:', this.debugData);
        return this.debugData;
    }

    /**
     * Collect user input values
     */
    collectUserInputs() {
        return {
            warehouse: {
                name: document.getElementById('warehouseName').value || '倉庫',
                length: parseFloat(document.getElementById('warehouseLength').value) || 50,
                width: parseFloat(document.getElementById('warehouseWidth').value) || 40,
                height: parseFloat(document.getElementById('warehouseHeight').value) || 9
            },
            pallets: this.calculator.pallets.map(pallet => ({
                id: pallet.id,
                name: pallet.name,
                length: pallet.length,
                width: pallet.width,
                height: pallet.height,
                quantity: pallet.quantity,
                isStackable: pallet.isStackable,
                maxStackHeight: pallet.maxStackHeight,
                volume: pallet.volume
            })),
            settings: {
                aisleWidth: parseFloat(document.getElementById('aisleWidth').value) || 2.5,
                palletClearance: parseFloat(document.getElementById('palletClearance').value) || 5,
                includeAisles: document.getElementById('includeAisles').checked,
                calculationMode: document.getElementById('calculationMode').value
            },
            selectedPallets: Array.from(document.getElementById('selectedPallets').selectedOptions)
                .map(option => parseInt(option.value))
        };
    }

    /**
     * Collect processed values from layout generator
     */
    collectProcessedValues() {
        const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
        const selectedPalletIndices = selectedPallets.map(option => parseInt(option.value));
        const selectedPalletObjects = selectedPalletIndices.map(index => this.calculator.pallets[index]).filter(pallet => pallet);
        
        if (selectedPalletObjects.length === 0) {
            return { error: 'No pallets selected' };
        }

        const calculationMode = document.getElementById('calculationMode').value;
        const includeAisles = document.getElementById('includeAisles').checked;
        const aisleWidth = includeAisles ? (parseFloat(document.getElementById('aisleWidth').value) || 2.5) : 0;
        const palletClearance = (parseFloat(document.getElementById('palletClearance').value) || 5) / 100;

        // Prepare cargo items (same as layout generator)
        const cargoItems = this.prepareCargoItems(selectedPalletObjects, palletClearance);
        
        // Calculate stacking levels
        const stackingData = selectedPalletObjects.map(pallet => ({
            palletName: pallet.name,
            stackingLevels: this.calculator.getStackingLevels(pallet),
            stacksNeeded: Math.ceil(pallet.quantity / this.calculator.getStackingLevels(pallet)),
            totalVolume: pallet.quantity * pallet.volume,
            stackVolume: this.calculator.getStackingLevels(pallet) * pallet.volume
        }));

        // Calculate area requirements
        const areaData = selectedPalletObjects.map(pallet => {
            const stackingLevels = this.calculator.getStackingLevels(pallet);
            const stacksNeeded = Math.ceil(pallet.quantity / stackingLevels);
            const palletArea = (pallet.length + palletClearance) * (pallet.width + palletClearance);
            return {
                palletName: pallet.name,
                singlePalletArea: pallet.length * pallet.width,
                palletAreaWithClearance: palletArea,
                stacksNeeded: stacksNeeded,
                totalRequiredArea: stacksNeeded * palletArea,
                efficiency: (pallet.length * pallet.width) / palletArea * 100
            };
        });

        return {
            cargoItems: cargoItems,
            stackingData: stackingData,
            areaData: areaData,
            totalStacks: cargoItems.length,
            totalPallets: selectedPalletObjects.reduce((sum, p) => sum + p.quantity, 0),
            averagePalletSize: this.calculateAveragePalletSize(selectedPalletObjects),
            clearance: palletClearance,
            aisleWidth: aisleWidth,
            calculationMode: calculationMode
        };
    }

    /**
     * Collect layout generation results
     */
    collectLayoutResults() {
        if (!this.calculator.lastLayoutResult) {
            return { error: 'No layout result available' };
        }

        const result = this.calculator.lastLayoutResult;
        return {
            success: result.success,
            binWidth: result.binWidth,
            totalHeight: result.totalHeight,
            efficiency: result.efficiency,
            totalAreaMin: result.totalAreaMin,
            actualArea: result.actualArea,
            positions: result.positions ? result.positions.length : 0,
            gridInfo: result.gridInfo,
            aislePositions: result.aislePositions ? result.aislePositions.length : 0,
            colors: result.colors ? result.colors.length : 0
        };
    }

    /**
     * Collect performance data
     */
    collectPerformanceData() {
        return {
            palletCount: this.calculator.pallets.length,
            selectedPalletCount: Array.from(document.getElementById('selectedPallets').selectedOptions).length,
            lastCalculationTime: this.calculator.lastCalculationTime || 'N/A',
            layoutGenerationTime: this.calculator.lastLayoutTime || 'N/A',
            memoryUsage: this.estimateMemoryUsage(),
            browserInfo: {
                userAgent: navigator.userAgent,
                language: navigator.language,
                platform: navigator.platform
            }
        };
    }

    /**
     * Prepare cargo items (same logic as layout generator)
     */
    prepareCargoItems(pallets, clearance) {
        let items = [];
        
        for (let palletType = 0; palletType < pallets.length; palletType++) {
            const pallet = pallets[palletType];
            const stackingLevels = this.calculator.getStackingLevels(pallet);
            const stacksNeeded = Math.ceil(pallet.quantity / stackingLevels);
            
            for (let i = 0; i < stacksNeeded; i++) {
                items.push({
                    width: pallet.length,
                    height: pallet.width,
                    originalWidth: pallet.length,
                    originalHeight: pallet.width,
                    palletType: palletType,
                    stackLevel: Math.min(pallet.quantity - (i * stackingLevels), stackingLevels),
                    clearance: clearance,
                    palletName: pallet.name
                });
            }
        }
        
        return items;
    }

    /**
     * Calculate average pallet size
     */
    calculateAveragePalletSize(pallets) {
        if (pallets.length === 0) return { length: 0, width: 0, height: 0 };
        
        const total = pallets.reduce((sum, pallet) => ({
            length: sum.length + pallet.length,
            width: sum.width + pallet.width,
            height: sum.height + pallet.height
        }), { length: 0, width: 0, height: 0 });
        
        return {
            length: total.length / pallets.length,
            width: total.width / pallets.length,
            height: total.height / pallets.length
        };
    }

    /**
     * Estimate memory usage
     */
    estimateMemoryUsage() {
        const palletData = JSON.stringify(this.calculator.pallets).length;
        const layoutData = this.calculator.lastLayoutResult ? 
            JSON.stringify(this.calculator.lastLayoutResult).length : 0;
        return {
            palletDataKB: Math.round(palletData / 1024),
            layoutDataKB: Math.round(layoutData / 1024),
            totalKB: Math.round((palletData + layoutData) / 1024)
        };
    }

    /**
     * Export debug data as CSV
     */
    exportDebugCSV() {
        this.collectDebugData();
        
        const csvData = this.generateCSVData();
        this.downloadCSV(csvData, `whsp-debug-${this.debugData.timestamp.replace(/[:.]/g, '-')}.csv`);
        
        this.calculator.showMessage('デバッグデータをCSVでエクスポートしました', 'success');
    }

    /**
     * Generate CSV data
     */
    generateCSVData() {
        const lines = [];
        
        // Header
        lines.push('WHSP Debug Export Data');
        lines.push(`Generated: ${this.debugData.timestamp}`);
        lines.push('');
        
        // User Inputs Section
        lines.push('=== USER INPUTS ===');
        lines.push('Section,Field,Value');
        
        // Warehouse inputs
        Object.entries(this.debugData.userInputs.warehouse).forEach(([key, value]) => {
            lines.push(`Warehouse,${key},"${value}"`);
        });
        
        // Settings inputs
        Object.entries(this.debugData.userInputs.settings).forEach(([key, value]) => {
            lines.push(`Settings,${key},"${value}"`);
        });
        
        // Pallet inputs
        lines.push('');
        lines.push('=== PALLET INPUTS ===');
        lines.push('PalletID,Name,Length,Width,Height,Quantity,IsStackable,MaxStackHeight,Volume');
        this.debugData.userInputs.pallets.forEach(pallet => {
            lines.push(`${pallet.id},"${pallet.name}",${pallet.length},${pallet.width},${pallet.height},${pallet.quantity},${pallet.isStackable},${pallet.maxStackHeight},${pallet.volume}`);
        });
        
        // Processed Values Section
        lines.push('');
        lines.push('=== PROCESSED VALUES ===');
        
        if (this.debugData.processedValues.error) {
            lines.push('Error,Message,"' + this.debugData.processedValues.error + '"');
        } else {
            // Cargo items
            lines.push('CargoItemID,PalletName,Width,Height,OriginalWidth,OriginalHeight,PalletType,StackLevel,Clearance');
            this.debugData.processedValues.cargoItems.forEach((item, index) => {
                lines.push(`${index},"${item.palletName}",${item.width},${item.height},${item.originalWidth},${item.originalHeight},${item.palletType},${item.stackLevel},${item.clearance}`);
            });
            
            // Stacking data
            lines.push('');
            lines.push('=== STACKING ANALYSIS ===');
            lines.push('PalletName,StackingLevels,StacksNeeded,TotalVolume,StackVolume');
            this.debugData.processedValues.stackingData.forEach(data => {
                lines.push(`"${data.palletName}",${data.stackingLevels},${data.stacksNeeded},${data.totalVolume},${data.stackVolume}`);
            });
            
            // Area data
            lines.push('');
            lines.push('=== AREA ANALYSIS ===');
            lines.push('PalletName,SinglePalletArea,PalletAreaWithClearance,StacksNeeded,TotalRequiredArea,Efficiency');
            this.debugData.processedValues.areaData.forEach(data => {
                lines.push(`"${data.palletName}",${data.singlePalletArea},${data.palletAreaWithClearance},${data.stacksNeeded},${data.totalRequiredArea},${data.efficiency}`);
            });
            
            // Summary
            lines.push('');
            lines.push('=== PROCESSED SUMMARY ===');
            lines.push('Metric,Value');
            lines.push(`TotalStacks,${this.debugData.processedValues.totalStacks}`);
            lines.push(`TotalPallets,${this.debugData.processedValues.totalPallets}`);
            lines.push(`AveragePalletLength,${this.debugData.processedValues.averagePalletSize.length}`);
            lines.push(`AveragePalletWidth,${this.debugData.processedValues.averagePalletSize.width}`);
            lines.push(`AveragePalletHeight,${this.debugData.processedValues.averagePalletSize.height}`);
            lines.push(`Clearance,${this.debugData.processedValues.clearance}`);
            lines.push(`AisleWidth,${this.debugData.processedValues.aisleWidth}`);
            lines.push(`CalculationMode,"${this.debugData.processedValues.calculationMode}"`);
        }
        
        // Layout Results Section
        lines.push('');
        lines.push('=== LAYOUT RESULTS ===');
        
        if (this.debugData.layoutResults.error) {
            lines.push('Error,Message,"' + this.debugData.layoutResults.error + '"');
        } else {
            lines.push('Metric,Value');
            lines.push(`Success,${this.debugData.layoutResults.success}`);
            lines.push(`BinWidth,${this.debugData.layoutResults.binWidth}`);
            lines.push(`TotalHeight,${this.debugData.layoutResults.totalHeight}`);
            lines.push(`Efficiency,${this.debugData.layoutResults.efficiency}`);
            lines.push(`TotalAreaMin,${this.debugData.layoutResults.totalAreaMin}`);
            lines.push(`ActualArea,${this.debugData.layoutResults.actualArea}`);
            lines.push(`PositionCount,${this.debugData.layoutResults.positions}`);
            lines.push(`AislePositionCount,${this.debugData.layoutResults.aislePositions}`);
            lines.push(`ColorCount,${this.debugData.layoutResults.colors}`);
            
            if (this.debugData.layoutResults.gridInfo) {
                lines.push(`GridRows,${this.debugData.layoutResults.gridInfo.rows}`);
                lines.push(`GridCols,${this.debugData.layoutResults.gridInfo.cols}`);
                lines.push(`StorageWidth,${this.debugData.layoutResults.gridInfo.storageWidth}`);
                lines.push(`StorageLength,${this.debugData.layoutResults.gridInfo.storageLength}`);
            }
        }
        
        // Performance Section
        lines.push('');
        lines.push('=== PERFORMANCE DATA ===');
        lines.push('Metric,Value');
        lines.push(`PalletCount,${this.debugData.performance.palletCount}`);
        lines.push(`SelectedPalletCount,${this.debugData.performance.selectedPalletCount}`);
        lines.push(`LastCalculationTime,"${this.debugData.performance.lastCalculationTime}"`);
        lines.push(`LayoutGenerationTime,"${this.debugData.performance.lastLayoutTime}"`);
        lines.push(`PalletDataKB,${this.debugData.performance.memoryUsage.palletDataKB}`);
        lines.push(`LayoutDataKB,${this.debugData.performance.memoryUsage.layoutDataKB}`);
        lines.push(`TotalMemoryKB,${this.debugData.performance.memoryUsage.totalKB}`);
        lines.push(`UserAgent,"${this.debugData.performance.browserInfo.userAgent}"`);
        lines.push(`Language,"${this.debugData.performance.browserInfo.language}"`);
        lines.push(`Platform,"${this.debugData.performance.browserInfo.platform}"`);
        
        return lines.join('\n');
    }

    /**
     * Download CSV file
     */
    downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    }

    /**
     * Export raw JSON data for advanced analysis
     */
    exportDebugJSON() {
        this.collectDebugData();
        
        const jsonData = JSON.stringify(this.debugData, null, 2);
        this.downloadCSV(jsonData, `whsp-debug-${this.debugData.timestamp.replace(/[:.]/g, '-')}.json`);
        
        this.calculator.showMessage('デバッグデータをJSONでエクスポートしました', 'success');
    }
}



