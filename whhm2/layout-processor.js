// Layout Processor - Handles Excel layout files
class LayoutProcessor {
    constructor() {
        this.workbookData = null;
        this.currentSheetData = null;
        this.generatedSVG = null;
        
        // Default Excel column width and row height (in Excel units)
        this.DEFAULT_COLUMN_WIDTH = 64; // Excel units
        this.DEFAULT_ROW_HEIGHT = 15;   // Excel units
        this.EXCEL_UNIT_TO_PX = 1.33;   // Better conversion factor (Excel units to pixels)
    }

    async processExcelFile(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const data = new Uint8Array(e.target.result);
                    const workbook = XLSX.read(data, {
                        type: 'array',
                        cellStyles: true,
                        cellFormulas: true,
                        cellDates: true,
                        cellNF: true,
                        sheetStubs: true,
                        bookVBA: true
                    });
                    
                    this.workbookData = workbook;
                    resolve(workbook);
                } catch (error) {
                    reject(error);
                }
            };
            reader.onerror = () => reject(new Error('Failed to read Excel file'));
            reader.readAsArrayBuffer(file);
        });
    }

    getSheetNames() {
        return this.workbookData ? this.workbookData.SheetNames : [];
    }

    selectSheet(sheetName) {
        if (!this.workbookData) return null;
        
        const worksheet = this.workbookData.Sheets[sheetName];
        
        if (!worksheet['!ref']) {
            throw new Error('Empty worksheet');
        }
        
        const range = XLSX.utils.decode_range(worksheet['!ref']);
        const cells = [];
        const mergedCells = worksheet['!merges'] || [];
        
        // Get column widths and row heights
        const colWidths = this.getColumnWidths(worksheet, range);
        const rowHeights = this.getRowHeights(worksheet, range);
        
        // Find the actual data range (cells with borders or data)
        const dataRange = this.findDataRange(worksheet, range);
        
        console.log(`Original range: ${XLSX.utils.encode_range(range)}`);
        console.log(`Data range: ${XLSX.utils.encode_range(dataRange)}`);
        console.log(`Column range: ${XLSX.utils.encode_col(dataRange.s.c)} to ${XLSX.utils.encode_col(dataRange.e.c)}`);
        console.log(`Row range: ${dataRange.s.r + 1} to ${dataRange.e.r + 1}`);
        console.log(`Processing ${(dataRange.e.r - dataRange.s.r + 1) * (dataRange.e.c - dataRange.s.c + 1)} cells instead of ${(range.e.r - range.s.r + 1) * (range.e.c - range.s.c + 1)} cells`);
        
        // Process only cells within the data range
        for (let r = dataRange.s.r; r <= dataRange.e.r; r++) {
            for (let c = dataRange.s.c; c <= dataRange.e.c; c++) {
                const cellAddress = XLSX.utils.encode_cell({r, c});
                const cell = worksheet[cellAddress];
                
                // Check if this cell is part of a merge
                const mergeInfo = this.getMergeInfo(r, c, mergedCells);
                
                // Process cells that have data, are part of a merge, or are within the data range
                const cellInfo = {
                    address: cellAddress,
                    row: r,
                    col: c,
                    value: cell ? cell.v : '',
                    text: cell ? (cell.w || (cell.v ? String(cell.v) : '')) : '',
                    type: cell ? cell.t : 's',
                    width: colWidths[c] || (this.DEFAULT_COLUMN_WIDTH * 7),
                    height: rowHeights[r] || (this.DEFAULT_ROW_HEIGHT * 1.33),
                    mergeInfo: mergeInfo,
                    hasData: !!cell,
                    // Extract alignment information from cell styles
                    textAlign: this.getTextAlignment(cell),
                    verticalAlign: this.getVerticalAlignment(cell)
                };
                
                cells.push(cellInfo);
            }
        }
        
        this.currentSheetData = {
            name: sheetName,
            range: dataRange, // Use the detected data range instead of full range
            fullRange: range, // Keep the original full range for reference
            cells,
            mergedCells,
            colWidths,
            rowHeights
        };
        
        return this.currentSheetData;
    }

    getColumnWidths(worksheet, range) {
        const colWidths = {};
        
        // Get column info from !cols property
        if (worksheet['!cols']) {
            worksheet['!cols'].forEach((col, index) => {
                if (col && col.width) {
                    // Excel column width is in character units, convert to pixels
                    // Excel uses 7 pixels per character unit for default font
                    colWidths[range.s.c + index] = col.width * 7;
                }
            });
        }
        
        // Fill missing columns with default width
        for (let c = range.s.c; c <= range.e.c; c++) {
            if (!colWidths[c]) {
                colWidths[c] = this.DEFAULT_COLUMN_WIDTH * 7; // 7 pixels per character unit
            }
        }
        
        return colWidths;
    }

    getRowHeights(worksheet, range) {
        const rowHeights = {};
        
        // Get row info from !rows property
        if (worksheet['!rows']) {
            worksheet['!rows'].forEach((row, index) => {
                if (row && row.hpt) { // height in points
                    rowHeights[range.s.r + index] = row.hpt * 1.33; // Convert points to pixels
                }
            });
        }
        
        // Fill missing rows with default height
        for (let r = range.s.r; r <= range.e.r; r++) {
            if (!rowHeights[r]) {
                rowHeights[r] = this.DEFAULT_ROW_HEIGHT * 1.33; // Convert points to pixels
            }
        }
        
        return rowHeights;
    }

    getMergeInfo(row, col, mergedCells) {
        for (let merge of mergedCells) {
            if (row >= merge.s.r && row <= merge.e.r && 
                col >= merge.s.c && col <= merge.e.c) {
                return {
                    isStart: row === merge.s.r && col === merge.s.c,
                    startRow: merge.s.r,
                    startCol: merge.s.c,
                    endRow: merge.e.r,
                    endCol: merge.e.c,
                    rowSpan: merge.e.r - merge.s.r + 1,
                    colSpan: merge.e.c - merge.s.c + 1
                };
            }
        }
        return null;
    }

    getTextAlignment(cell) {
        if (!cell || !cell.s || !cell.s.alignment) {
            return 'center'; // Default alignment
        }
        
        const alignment = cell.s.alignment.horizontal;
        switch (alignment) {
            case 'left':
                return 'left';
            case 'right':
                return 'right';
            case 'center':
                return 'center';
            case 'justify':
                return 'justify';
            default:
                return 'center';
        }
    }

    getVerticalAlignment(cell) {
        if (!cell || !cell.s || !cell.s.alignment) {
            return 'middle'; // Default vertical alignment
        }
        
        const alignment = cell.s.alignment.vertical;
        switch (alignment) {
            case 'top':
                return 'top';
            case 'middle':
            case 'center':
                return 'middle';
            case 'bottom':
                return 'bottom';
            default:
                return 'middle';
        }
    }

    getTextAnchor(textAlign) {
        switch (textAlign) {
            case 'left':
                return 'start';
            case 'right':
                return 'end';
            case 'center':
                return 'middle';
            case 'justify':
                return 'middle'; // Justify is handled by text wrapping
            default:
                return 'middle';
        }
    }

    getDominantBaseline(verticalAlign) {
        switch (verticalAlign) {
            case 'top':
                return 'text-before-edge';
            case 'middle':
                return 'central';
            case 'bottom':
                return 'text-after-edge';
            default:
                return 'central';
        }
    }

    calculateTextPosition(x, y, width, height, textAlign, verticalAlign, lines, lineHeight) {
        let textX, textY;
        
        // Calculate horizontal position
        switch (textAlign) {
            case 'left':
                textX = x + 5; // Small padding from left edge
                break;
            case 'right':
                textX = x + width - 5; // Small padding from right edge
                break;
            case 'center':
            case 'justify':
            default:
                textX = x + width / 2;
                break;
        }
        
        // Calculate vertical position
        const totalTextHeight = lines.length * lineHeight;
        switch (verticalAlign) {
            case 'top':
                textY = y + lineHeight; // Start from top with line height offset
                break;
            case 'bottom':
                textY = y + height - (lines.length - 1) * lineHeight; // Align to bottom
                break;
            case 'middle':
            default:
                textY = y + height / 2 - (lines.length - 1) * lineHeight / 2; // Center vertically
                break;
        }
        
        return { x: textX, y: textY };
    }

    // Find the actual data range by detecting cells with borders or data
    findDataRange(worksheet, fullRange) {
        let minRow = fullRange.e.r;
        let maxRow = fullRange.s.r;
        let minCol = fullRange.e.c;
        let maxCol = fullRange.s.c;
        
        // Check all cells in the full range to find the actual data boundaries
        for (let r = fullRange.s.r; r <= fullRange.e.r; r++) {
            for (let c = fullRange.s.c; c <= fullRange.e.c; c++) {
                const cellAddress = XLSX.utils.encode_cell({r, c});
                const cell = worksheet[cellAddress];
                
                // Check if cell has data, formatting, or is part of a merge
                const hasData = cell && (cell.v !== undefined && cell.v !== null && cell.v !== '');
                const hasFormatting = cell && (cell.s || cell.f || cell.c); // Has style, formula, or comment
                const isInMerge = this.getMergeInfo(r, c, worksheet['!merges'] || []);
                
                if (hasData || hasFormatting || isInMerge) {
                    minRow = Math.min(minRow, r);
                    maxRow = Math.max(maxRow, r);
                    minCol = Math.min(minCol, c);
                    maxCol = Math.max(maxCol, c);
                }
            }
        }
        
        // Add padding to ensure we capture all relevant cells
        // Add more rows and columns to catch border cells and ensure complete coverage
        const rowPadding = 2;  // Reduced rows back to original
        const colPadding = 5;  // Moderate column padding
        minRow = Math.max(fullRange.s.r, minRow - rowPadding);
        maxRow = Math.min(fullRange.e.r, maxRow + rowPadding);
        minCol = Math.max(fullRange.s.c, minCol - colPadding);
        maxCol = Math.min(fullRange.e.c, maxCol + colPadding);
        
        // If we didn't find any data, fall back to a reasonable default range
        if (minRow > maxRow || minCol > maxCol) {
            console.log('No data found, using fallback range');
            return {
                s: { r: fullRange.s.r, c: fullRange.s.c },
                e: { r: Math.min(fullRange.s.r + 20, fullRange.e.r), c: Math.min(fullRange.s.c + 20, fullRange.e.c) }
            };
        }
        
        // Additional check: if the detected range seems too small, expand it more aggressively
        const detectedCols = maxCol - minCol + 1;
        const detectedRows = maxRow - minRow + 1;
        const totalCols = fullRange.e.c - fullRange.s.c + 1;
        const totalRows = fullRange.e.r - fullRange.s.r + 1;
        
        // Force include more columns - be more aggressive about horizontal range
        console.log('Forcing wider column range...');
        minCol = fullRange.s.c;
        maxCol = Math.min(fullRange.e.c, fullRange.s.c + 100); // Force at least 100 columns
        
        // Keep rows reasonable
        if (detectedRows < totalRows * 0.3) { // Less than 30% of available rows
            console.log('Detected range seems too small, expanding rows...');
            minRow = fullRange.s.r;
            maxRow = Math.min(fullRange.e.r, fullRange.s.r + Math.max(detectedRows * 2, 50));
        }
        
        // Return the detected data range with padding
        return {
            s: { r: minRow, c: minCol },
            e: { r: maxRow, c: maxCol }
        };
    }

    generateSVGLayout(options = {}, heatmapData = null) {
        if (!this.currentSheetData) return null;
        
        const {
            scaleFactor = 1.0,
            showGrid = true,
            showTitle = true,
            padding = 20,
            cellSize = null,
            maxWidth = null,
            maxHeight = null
        } = options;
        
        const range = this.currentSheetData.range;
        
        // Use provided cell size or detected dimensions
        const colWidths = {};
        const rowHeights = {};
        
        for (let c = range.s.c; c <= range.e.c; c++) {
            colWidths[c] = cellSize || this.currentSheetData.colWidths[c] || 80;
        }
        
        for (let r = range.s.r; r <= range.e.r; r++) {
            rowHeights[r] = cellSize || this.currentSheetData.rowHeights[r] || 20;
        }
        
        // Calculate cumulative positions for columns and rows
        const colPositions = {};
        const rowPositions = {};
        
        let xPos = padding;
        for (let c = range.s.c; c <= range.e.c; c++) {
            colPositions[c] = xPos;
            xPos += colWidths[c] * scaleFactor;
        }
        
        let yPos = padding + (showTitle ? 40 : 0);
        for (let r = range.s.r; r <= range.e.r; r++) {
            rowPositions[r] = yPos;
            yPos += rowHeights[r] * scaleFactor;
        }
        
        const svgWidth = xPos + padding;
        const svgHeight = yPos + padding;
        
        // Generate CSS styles based on whether heatmap data is provided
        const heatmapStyles = heatmapData ? `
                /* Heatmap colors - Gray to Green to Yellow to Red progression */
                .heat-0 { fill: #f5f5f5; } /* No activity - Light gray */
                .heat-1 { fill: #e8f5e8; } /* Very low - Light green */
                .heat-2 { fill: #c8e6c9; } /* Low - Green */
                .heat-3 { fill: #a5d6a7; } /* Low-medium - Medium green */
                .heat-4 { fill: #81c784; } /* Medium-low - Stronger green */
                .heat-5 { fill: #66bb6a; } /* Medium - Primary green */
                .heat-6 { fill: #4caf50; } /* Medium-high - Dark green */
                .heat-7 { fill: #8bc34a; } /* High - Yellow-green */
                .heat-8 { fill: #cddc39; } /* Very high - Yellow */
                .heat-9 { fill: #ffeb3b; } /* Extremely high - Bright yellow */
                .heat-10 { fill: #ffc107; } /* Maximum-high - Orange-yellow */
                .heat-11 { fill: #ff9800; } /* Critical - Orange */
                .heat-12 { fill: #ff5722; } /* Maximum - Red-orange */
                .heat-13 { fill: #f44336; } /* Peak - Red */
                .heat-14 { fill: #d32f2f; } /* Extreme - Dark red */
            ` : '';

        let svg = `<svg width="${svgWidth}" height="${svgHeight}" xmlns="http://www.w3.org/2000/svg">
            <style>
                .cell-text { 
                    font-family: Arial, sans-serif; 
                    font-size: ${Math.max(8, 10 * scaleFactor)}px; 
                    fill: #000000;
                }
                .title { 
                    font-family: Arial, sans-serif; 
                    font-size: 16px; 
                    font-weight: bold; 
                    text-anchor: middle;
                    fill: #000000;
                }
                .cell-border {
                    fill: none;
                    stroke: ${showGrid ? '#cccccc' : 'none'};
                    stroke-width: 0.5;
                }
                .merged-cell {
                    fill: none;
                    stroke: #666666;
                    stroke-width: 1;
                }
                .warehouse-cell {
                    cursor: pointer;
                    transition: all 0.2s ease;
                }
                .warehouse-cell:hover {
                    stroke: #007bff;
                    stroke-width: 2;
                }
                ${heatmapStyles}
            </style>
            
            <!-- Background -->
            <rect width="${svgWidth}" height="${svgHeight}" fill="#ffffff"/>
            
            ${showTitle ? `<text x="${svgWidth/2}" y="25" class="title">Warehouse Layout - ${this.currentSheetData.name}</text>` : ''}
            
        `;

        // Track processed merged cells to avoid duplicates
        const processedMerges = new Set();

        // Create cells and merged regions
        this.currentSheetData.cells.forEach(cell => {
            
            const x = colPositions[cell.col];
            const y = rowPositions[cell.row];
            const width = colWidths[cell.col] * scaleFactor;
            const height = rowHeights[cell.row] * scaleFactor;
            
            // Get heatmap data for this cell if provided
            let heatLevel = 0;
            let activity = 0;
            if (heatmapData) {
                activity = heatmapData.get(cell.text) || 0;
                if (activity > 0) {
                    // Calculate heat level based on percentile ranking of activity
                    const activities = Array.from(heatmapData.values()).sort((a, b) => a - b);
                    const minActivity = Math.min(...activities);
                    const maxActivity = Math.max(...activities);
                    
                    // Find percentile rank of this activity
                    const rank = activities.findIndex(val => val >= activity);
                    const percentile = rank / (activities.length - 1);
                    
                    // Map percentile to heat levels (0-14) to ensure full color spectrum
                    if (percentile <= 0.05) heatLevel = 1;      // Very low (5th percentile)
                    else if (percentile <= 0.1) heatLevel = 2;   // Low (10th percentile)
                    else if (percentile <= 0.15) heatLevel = 3;  // Low-medium (15th percentile)
                    else if (percentile <= 0.2) heatLevel = 4;   // Medium-low (20th percentile)
                    else if (percentile <= 0.3) heatLevel = 5;     // Medium (30th percentile)
                    else if (percentile <= 0.4) heatLevel = 6;    // Medium-high (40th percentile)
                    else if (percentile <= 0.5) heatLevel = 7;    // High (50th percentile - yellow-green)
                    else if (percentile <= 0.6) heatLevel = 8;   // Very high (60th percentile - yellow)
                    else if (percentile <= 0.7) heatLevel = 9;   // Extremely high (70th percentile - bright yellow)
                    else if (percentile <= 0.8) heatLevel = 10;   // Maximum-high (80th percentile - orange-yellow)
                    else if (percentile <= 0.9) heatLevel = 11;   // Critical (90th percentile - orange)
                    else if (percentile <= 0.95) heatLevel = 12;  // Maximum (95th percentile - red-orange)
                    else if (percentile <= 0.98) heatLevel = 13;  // Peak (98th percentile - red)
                    else heatLevel = 14;                          // Extreme (top 2% - dark red)
                }
            }
            
            if (cell.mergeInfo && cell.mergeInfo.isStart) {
                // Handle merged cell
                const mergeKey = `${cell.mergeInfo.startRow}-${cell.mergeInfo.startCol}-${cell.mergeInfo.endRow}-${cell.mergeInfo.endCol}`;
                
                if (!processedMerges.has(mergeKey)) {
                    processedMerges.add(mergeKey);
                    
                    // Calculate merged cell dimensions
                    let mergeWidth = 0;
                    let mergeHeight = 0;
                    
                    for (let c = cell.mergeInfo.startCol; c <= cell.mergeInfo.endCol; c++) {
                        mergeWidth += colWidths[c] * scaleFactor;
                    }
                    
                    for (let r = cell.mergeInfo.startRow; r <= cell.mergeInfo.endRow; r++) {
                        mergeHeight += rowHeights[r] * scaleFactor;
                    }
                    
                    // Draw merged cell rectangle only if it has text
                    if (cell.text && cell.text.trim()) {
                        const heatClass = heatmapData ? ` heat-${heatLevel}` : '';
                        svg += `<rect x="${x}" y="${y}" width="${mergeWidth}" height="${mergeHeight}" 
                                 class="merged-cell warehouse-cell${heatClass}" data-location="${cell.text}" data-row="${cell.row}" data-col="${cell.col}"${heatmapData ? ` data-activity="${activity}"` : ''}/>`;
                    }
                    
                    // Add text in merged cell with proper alignment
                    if (cell.text && cell.text.trim()) {
                        const fontSize = Math.max(8, 10 * scaleFactor);
                        const lines = this.wrapText(cell.text, mergeWidth, fontSize);
                        const lineHeight = fontSize * 1.2;
                        
                        // Calculate text position based on alignment
                        const textPos = this.calculateTextPosition(x, y, mergeWidth, mergeHeight, cell.textAlign, cell.verticalAlign, lines, lineHeight);
                        
                        lines.forEach((line, index) => {
                            const textAnchor = this.getTextAnchor(cell.textAlign);
                            const dominantBaseline = this.getDominantBaseline(cell.verticalAlign);
                            
                            svg += `<text x="${textPos.x}" y="${textPos.y + index * lineHeight}" 
                                     class="cell-text" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${this.escapeHtml(line)}</text>`;
                        });
                    }
                }
            } else if (!cell.mergeInfo || (cell.mergeInfo && !cell.mergeInfo.isStart)) {
                // Regular cell (not merged or not the starting cell of a merge)
                if (!cell.mergeInfo) {
                    // Only draw border and background for cells with data AND text
                    if (cell.hasData && cell.text && cell.text.trim()) {
                        const heatClass = heatmapData ? ` heat-${heatLevel}` : '';
                        svg += `<rect x="${x}" y="${y}" width="${width}" height="${height}" 
                                 class="cell-border warehouse-cell${heatClass}" data-location="${cell.text}" data-row="${cell.row}" data-col="${cell.col}"${heatmapData ? ` data-activity="${activity}"` : ''}/>`;
                        
                        // Add text with proper alignment
                        const fontSize = Math.max(8, 10 * scaleFactor);
                        const lines = this.wrapText(cell.text, width, fontSize);
                        const lineHeight = fontSize * 1.2;
                        
                        // Calculate text position based on alignment
                        const textPos = this.calculateTextPosition(x, y, width, height, cell.textAlign, cell.verticalAlign, lines, lineHeight);
                        
                        lines.forEach((line, index) => {
                            const textAnchor = this.getTextAnchor(cell.textAlign);
                            const dominantBaseline = this.getDominantBaseline(cell.verticalAlign);
                            
                            svg += `<text x="${textPos.x}" y="${textPos.y + index * lineHeight}" 
                                     class="cell-text" text-anchor="${textAnchor}" dominant-baseline="${dominantBaseline}">${this.escapeHtml(line)}</text>`;
                        });
                    }
                }
            }
        });

        svg += '</svg>';
        
        this.generatedSVG = svg;
        return svg;
    }

    generateSVGWithHeatmap(heatmapData, options = {}) {
        // Convenience method that calls the unified generateSVGLayout with heatmap data
        return this.generateSVGLayout(options, heatmapData);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // Split text into lines that fit within the cell width
    wrapText(text, maxWidth, fontSize = 10) {
        if (!text) return [''];
        
        const words = String(text).split(/\s+/);
        const lines = [];
        let currentLine = '';
        
        // Approximate character width (this is a rough estimate)
        const charWidth = fontSize * 0.6;
        const maxCharsPerLine = Math.floor(maxWidth / charWidth);
        
        for (const word of words) {
            const testLine = currentLine ? `${currentLine} ${word}` : word;
            
            if (testLine.length <= maxCharsPerLine) {
                currentLine = testLine;
            } else {
                if (currentLine) {
                    lines.push(currentLine);
                    currentLine = word;
                } else {
                    // Word is too long, split it
                    lines.push(word.substring(0, maxCharsPerLine));
                    currentLine = word.substring(maxCharsPerLine);
                }
            }
        }
        
        if (currentLine) {
            lines.push(currentLine);
        }
        
        return lines.length > 0 ? lines : [''];
    }

    downloadSVG(filename = null) {
        if (!this.generatedSVG) return;
        
        const blob = new Blob([this.generatedSVG], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename || `${this.currentSheetData.name}_layout.svg`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    getSheetInfo() {
        if (!this.currentSheetData) return null;
        
        return {
            name: this.currentSheetData.name,
            size: `${this.currentSheetData.range.e.c + 1} columns × ${this.currentSheetData.range.e.r + 1} rows`,
            cellsWithData: this.currentSheetData.cells.filter(c => c.hasData).length,
            mergedRegions: this.currentSheetData.mergedCells.length
        };
    }

    // Convert to layout data format compatible with existing heatmap system
    convertToLayoutData() {
        if (!this.currentSheetData) return null;
        
        const locations = [];
        const range = this.currentSheetData.range;
        
        // Process all cells to extract location data
        for (let r = range.s.r; r <= range.e.r; r++) {
            for (let c = range.s.c; c <= range.e.c; c++) {
                const cell = this.currentSheetData.cells.find(cell => cell.row === r && cell.col === c);
                if (cell) {
                    // Extract text content more robustly
                    let cellText = '';
                    if (cell.text && cell.text.trim()) {
                        cellText = cell.text.trim();
                    } else if (cell.value !== undefined && cell.value !== null && cell.value !== '') {
                        cellText = String(cell.value).trim();
                    }
                    
                    // Include cells with any meaningful content
                    if (cellText) {
                        locations.push({
                            row: r,
                            col: c,
                            id: cellText,
                            x: c,
                            y: r,
                            width: cell.width,
                            height: cell.height,
                            isMerged: !!cell.mergeInfo,
                            mergeInfo: cell.mergeInfo,
                            hasData: cell.hasData,
                            originalValue: cell.value,
                            originalText: cell.text
                        });
                    }
                }
            }
        }
        
        return {
            locations,
            dimensions: {rows: range.e.r + 1, cols: range.e.c + 1},
            colWidths: this.currentSheetData.colWidths,
            rowHeights: this.currentSheetData.rowHeights,
            mergedCells: this.currentSheetData.mergedCells
        };
    }

    // Debug method to help identify cell extraction issues
    debugCellExtraction() {
        if (!this.currentSheetData) {
            console.log('No sheet data available for debugging');
            return;
        }

        console.log('=== Cell Extraction Debug ===');
        console.log('Sheet:', this.currentSheetData.name);
        console.log('Range:', this.currentSheetData.range);
        console.log('Total cells processed:', this.currentSheetData.cells.length);
        
        // Show cells with data
        const cellsWithData = this.currentSheetData.cells.filter(c => c.hasData);
        console.log('Cells with data:', cellsWithData.length);
        
        // Show cells with text content
        const cellsWithText = this.currentSheetData.cells.filter(c => c.text && c.text.trim());
        console.log('Cells with text:', cellsWithText.length);
        
        // Show cells with values
        const cellsWithValue = this.currentSheetData.cells.filter(c => c.value !== undefined && c.value !== null && c.value !== '');
        console.log('Cells with values:', cellsWithValue.length);
        
        // Show first 10 cells for inspection
        console.log('First 10 cells:');
        this.currentSheetData.cells.slice(0, 10).forEach((cell, index) => {
            console.log(`${index + 1}. Row:${cell.row}, Col:${cell.col}, Text:"${cell.text}", Value:"${cell.value}", Width:${cell.width}, Height:${cell.height}, HasData:${cell.hasData}`);
        });
        
        // Show column widths
        console.log('Column widths:');
        Object.entries(this.currentSheetData.colWidths).forEach(([col, width]) => {
            console.log(`Col ${col}: ${width}px`);
        });
        
        // Show row heights
        console.log('Row heights:');
        Object.entries(this.currentSheetData.rowHeights).forEach(([row, height]) => {
            console.log(`Row ${row}: ${height}px`);
        });
        
        // Look for specific cells H and W
        const hCells = this.currentSheetData.cells.filter(c => c.text && c.text.includes('H'));
        const wCells = this.currentSheetData.cells.filter(c => c.text && c.text.includes('W'));
        console.log('Cells containing "H":', hCells.length);
        console.log('Cells containing "W":', wCells.length);
        
        if (hCells.length > 0) {
            console.log('H cells found:', hCells.map(c => `Row:${c.row}, Col:${c.col}, Text:"${c.text}"`));
        }
        if (wCells.length > 0) {
            console.log('W cells found:', wCells.map(c => `Row:${c.row}, Col:${c.col}, Text:"${c.text}"`));
        }
        
        // Show converted layout data
        const layoutData = this.convertToLayoutData();
        console.log('Converted layout locations:', layoutData.locations.length);
        console.log('Location IDs:', layoutData.locations.map(l => l.id));
    }
}

