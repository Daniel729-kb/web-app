// SVG Generator App
class SVGGeneratorApp {
    constructor() {
        this.svgGenerator = new SVGLayoutGenerator();
        this.currentFile = null;
        this.currentSheet = null;
        this.isHeatmapShown = false;
        
        this.initializeElements();
        this.attachEventListeners();
        // Initialize UI language to match default
        this.updateLanguage();
    }

    initializeElements() {
        // Tab elements
        this.tabButtons = document.querySelectorAll('.tab-button');
        this.tabPanels = document.querySelectorAll('.tab-panel');
        
        // Heatmap tab elements
        this.heatmapSection = document.getElementById('heatmapSection');
        this.heatmapInfo = document.getElementById('heatmapInfo');
        this.heatmapControls = document.getElementById('heatmapControls');
        this.heatmapSvgSection = document.getElementById('heatmapSvgSection');
        this.heatmapSvgDisplay = document.getElementById('heatmapSvgDisplay');
        this.heatmapLegend = document.getElementById('heatmapLegend');
        this.heatmapDetailsCard = document.getElementById('heatmapDetailsCard');
        this.heatmapDetails = document.getElementById('heatmapDetails');
        this.heatmapScaleFactor = document.getElementById('heatmapScaleFactor');
        this.heatmapScaleValue = document.getElementById('heatmapScaleValue');
        this.heatmapCellSize = document.getElementById('heatmapCellSize');
        this.heatmapShowGrid = document.getElementById('heatmapShowGrid');
        this.heatmapShowTitle = document.getElementById('heatmapShowTitle');
        this.heatmapGenerateBtn = document.getElementById('heatmapGenerateBtn');
        this.heatmapDownloadBtn = document.getElementById('heatmapDownloadBtn');
        this.heatmapToggleBtn = document.getElementById('heatmapToggleBtn');
        
        // Language switcher
        this.langSwitch = document.getElementById('langSwitch');
        this.currentLanguage = 'ja'; // Default to Japanese
        
        // File upload elements
        this.fileUploadArea = document.getElementById('fileUploadArea');
        this.fileInput = document.getElementById('fileInput');
        
        // Shipping file upload elements
        this.shippingFileUploadArea = document.getElementById('shippingFileUploadArea');
        this.shippingFileInput = document.getElementById('shippingFileInput');
        this.shippingInfoSection = document.getElementById('shippingInfoSection');
        this.shippingInfo = document.getElementById('shippingInfo');
        this.shippingPreviewSection = document.getElementById('shippingPreviewSection');
        this.shippingPreview = document.getElementById('shippingPreview');
        // Mapping elements
        this.shippingMappingCard = document.getElementById('shippingMappingCard');
        this.locationColumnSelect = document.getElementById('locationColumnSelect');
        this.volumeColumnSelect = document.getElementById('volumeColumnSelect');
        this.itemColumnSelect = document.getElementById('itemColumnSelect');
        this.locationStartChar = document.getElementById('locationStartChar');
        this.locationEndChar = document.getElementById('locationEndChar');
        this.applyMappingBtn = document.getElementById('applyMappingBtn');
        
        // Control elements
        this.controlsSection = document.getElementById('controlsSection');
        this.sheetSelect = document.getElementById('sheetSelect');
        this.scaleFactor = document.getElementById('scaleFactor');
        this.scaleValue = document.getElementById('scaleValue');
        this.cellSize = document.getElementById('cellSize');
        this.showGrid = document.getElementById('showGrid');
        this.showTitle = document.getElementById('showTitle');
        // Horizontal scroll controls removed
        
        // Range control elements
        this.startRow = document.getElementById('startRow');
        this.endRow = document.getElementById('endRow');
        this.startCol = document.getElementById('startCol');
        this.endCol = document.getElementById('endCol');
        this.applyRangeBtn = document.getElementById('applyRangeBtn');
        this.resetRangeBtn = document.getElementById('resetRangeBtn');
        
        // Action buttons
        this.generateBtn = document.getElementById('generateBtn');
        this.downloadBtn = document.getElementById('downloadBtn');
        this.resetBtn = document.getElementById('resetBtn');
        
        // Display elements
        this.infoSection = document.getElementById('infoSection');
        this.sheetInfo = document.getElementById('sheetInfo');
        this.svgSection = document.getElementById('svgSection');
        this.svgDisplay = document.getElementById('svgDisplay');
        this.errorSection = document.getElementById('errorSection');
        this.errorText = document.getElementById('errorText');
    }

    attachEventListeners() {
        // Tab switching events (click + keyboard)
        this.tabButtons.forEach(button => {
            button.addEventListener('click', (e) => this.switchTab(e.currentTarget.dataset.tab));
            button.addEventListener('keydown', (e) => {
                const currentIndex = Array.from(this.tabButtons).indexOf(e.currentTarget);
                if (e.key === 'ArrowRight') {
                    const next = this.tabButtons[(currentIndex + 1) % this.tabButtons.length];
                    next.focus();
                } else if (e.key === 'ArrowLeft') {
                    const prev = this.tabButtons[(currentIndex - 1 + this.tabButtons.length) % this.tabButtons.length];
                    prev.focus();
                } else if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    this.switchTab(e.currentTarget.dataset.tab);
                }
            });
        });
        
        // Heatmap tab controls
        this.heatmapScaleFactor.addEventListener('input', () => {
            this.heatmapScaleValue.textContent = this.heatmapScaleFactor.value;
            this.syncHeatmapControls();
        });
        
        this.heatmapGenerateBtn.addEventListener('click', () => this.generateHeatmap());
        this.heatmapDownloadBtn.addEventListener('click', () => this.downloadHeatmap());
        this.heatmapToggleBtn.addEventListener('click', () => this.toggleHeatmapView());
        
        // Language switcher
        this.langSwitch.addEventListener('click', () => this.switchLanguage());
        
        // File upload events
        this.fileUploadArea.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => this.handleFileUpload(e));
        
        // Shipping file upload events
        this.shippingFileUploadArea.addEventListener('click', () => this.shippingFileInput.click());
        this.shippingFileInput.addEventListener('change', (e) => this.handleShippingFileUpload(e));
        this.applyMappingBtn.addEventListener('click', () => this.applyShippingMapping());
        this.toggleHeatmapBtn.addEventListener('click', () => this.toggleHeatmapView());
        
        // Drag and drop events
        this.fileUploadArea.addEventListener('dragover', (e) => this.handleDragOver(e));
        this.fileUploadArea.addEventListener('dragleave', (e) => this.handleDragLeave(e));
        this.fileUploadArea.addEventListener('drop', (e) => this.handleDrop(e));
        
        // Sheet selection
        this.sheetSelect.addEventListener('change', (e) => this.handleSheetSelection(e));
        
        // Scale factor slider
        this.scaleFactor.addEventListener('input', (e) => {
            this.scaleValue.textContent = parseFloat(e.target.value).toFixed(1);
        });
        
        // Horizontal scroll controls removed
        
        // Range control buttons
        this.applyRangeBtn.addEventListener('click', () => this.applyRange());
        this.resetRangeBtn.addEventListener('click', () => this.resetRange());
        
        // Action buttons
        this.generateBtn.addEventListener('click', () => this.generateSVG());
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        this.resetBtn.addEventListener('click', () => this.resetApp());
    }

    async handleShippingFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
            const name = file.name.toLowerCase();
            if (name.endsWith('.csv')) {
                await this.processShippingCSV(file);
            } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
                await this.processShippingXLSX(file);
            } else if (name.endsWith('.md')) {
                await this.processShippingMD(file);
            } else {
                this.showError('Unsupported file type. Please upload CSV, XLSX/XLS, or MD.');
                return;
            }

            this.shippingInfoSection.style.display = 'block';
        } catch (err) {
            console.error('Error processing shipping file:', err);
            this.showError(`Error processing shipping file: ${err.message}`);
        }
    }

    async processShippingCSV(file) {
        const text = await file.text();
        const rows = this.parseCSV(text);
        const headers = rows.length > 0 ? rows[0] : [];
        const dataRows = rows.slice(1);
        this.lastShippingHeaders = headers;
        this.lastShippingRows = dataRows;
        this.renderShippingInfo({ type: 'CSV', name: file.name, size: file.size, rows: dataRows.length, cols: headers.length });
        this.renderShippingPreviewTable(headers, dataRows);
        this.populateShippingMapping(headers);
    }

    async processShippingXLSX(file) {
        const arrayBuffer = await file.arrayBuffer();
        const workbook = XLSX.read(new Uint8Array(arrayBuffer), { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[firstSheetName];
        const json = XLSX.utils.sheet_to_json(sheet, { header: 1 });
        const headers = json.length > 0 ? json[0] : [];
        const dataRows = json.slice(1);
        this.lastShippingHeaders = headers;
        this.lastShippingRows = dataRows;
        this.renderShippingInfo({ type: 'XLSX', name: file.name, size: file.size, rows: dataRows.length, cols: headers.length, sheet: firstSheetName });
        this.renderShippingPreviewTable(headers, dataRows);
        this.populateShippingMapping(headers);
    }

    async processShippingMD(file) {
        const text = await file.text();
        this.renderShippingInfo({ type: 'Markdown', name: file.name, size: file.size });
        this.shippingPreviewSection.style.display = 'block';
        this.shippingPreview.innerHTML = `<div class="md-preview">${this.escapeHtml(text).replace(/\n/g, '<br>')}</div>`;
    }

    renderShippingInfo(info) {
        const parts = [
            `<div class="info-item"><strong>File Name:</strong><span>${this.escapeHtml(info.name || '')}</span></div>`,
            `<div class="info-item"><strong>Type:</strong><span>${info.type}</span></div>`
        ];
        if (info.size !== undefined) parts.push(`<div class="info-item"><strong>Size:</strong><span>${(info.size/1024).toFixed(1)} KB</span></div>`);
        if (info.rows !== undefined) parts.push(`<div class="info-item"><strong>Rows:</strong><span>${info.rows}</span></div>`);
        if (info.cols !== undefined) parts.push(`<div class="info-item"><strong>Columns:</strong><span>${info.cols}</span></div>`);
        if (info.sheet) parts.push(`<div class="info-item"><strong>Sheet:</strong><span>${this.escapeHtml(info.sheet)}</span></div>`);
        this.shippingInfo.innerHTML = parts.join('');
    }

    renderShippingPreviewTable(headers, rows) {
        this.shippingPreviewSection.style.display = 'block';
        const maxRows = 30;
        const limitedRows = rows.slice(0, maxRows);
        const thead = `<thead><tr>${headers.map(h => `<th>${this.escapeHtml(String(h))}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${limitedRows.map(r => `<tr>${(r || []).map(c => `<td>${this.escapeHtml(c === undefined ? '' : String(c))}</td>`).join('')}</tr>`).join('')}</tbody>`;
        this.shippingPreview.innerHTML = `<div class="data-preview"><table>${thead}${tbody}</table></div>`;
    }

    populateShippingMapping(headers) {
        // Populate dropdowns with header names
        const options = headers.map((h, idx) => `<option value="${idx}">${this.escapeHtml(String(h || `Column ${idx+1}`))}</option>`).join('');
        this.locationColumnSelect.innerHTML = options;
        this.volumeColumnSelect.innerHTML = options;
        if (this.itemColumnSelect) this.itemColumnSelect.innerHTML = `<option value="">${this.currentLanguage === 'ja' ? '未選択' : 'Not set'}</option>` + options;
        // Try to auto-detect common names
        const lower = headers.map(h => String(h || '').toLowerCase());
        const locIdx = lower.findIndex(h => /(loc|location|bin|slot|shelf|rack)/.test(h));
        const volIdx = lower.findIndex(h => /(qty|quantity|volume|ship|units|count)/.test(h));
        if (locIdx >= 0) this.locationColumnSelect.value = String(locIdx);
        if (volIdx >= 0) this.volumeColumnSelect.value = String(volIdx);
        
        // Add event listeners for location mapping preview
        this.locationColumnSelect.addEventListener('change', () => this.updateLocationMappingPreview());
        this.locationStartChar.addEventListener('input', () => this.updateLocationMappingPreview());
        this.locationEndChar.addEventListener('input', () => this.updateLocationMappingPreview());
        
        this.shippingMappingCard.style.display = 'block';
        // Bring mapping into view and focus for immediate selection
        this.shippingMappingCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            this.locationColumnSelect?.focus();
            this.updateLocationMappingPreview(); // Show initial preview
        }, 0);
    }

    updateLocationMappingPreview() {
        const locIdx = parseInt(this.locationColumnSelect.value);
        if (isNaN(locIdx) || !Array.isArray(this.lastShippingRows) || this.lastShippingRows.length === 0) {
            return;
        }
        
        const startChar = parseInt(this.locationStartChar.value) || 1;
        const endChar = parseInt(this.locationEndChar.value);
        
        // Get first few sample locations to show preview
        const samples = [];
        for (let i = 0; i < Math.min(5, this.lastShippingRows.length); i++) {
            const row = this.lastShippingRows[i];
            const loc = row?.[locIdx];
            if (loc !== undefined && loc !== null && String(loc).trim() !== '') {
                const originalLoc = String(loc).trim();
                let mappedLoc = originalLoc;
                
                if (startChar > 1 || endChar) {
                    const start = Math.max(0, startChar - 1);
                    const end = endChar ? Math.min(originalLoc.length, endChar) : originalLoc.length;
                    mappedLoc = originalLoc.substring(start, end);
                }
                
                samples.push({
                    original: originalLoc,
                    mapped: mappedLoc
                });
            }
        }
        
        // Update the example text
        const exampleElement = document.querySelector('.mapping-example');
        if (exampleElement && samples.length > 0) {
            const sample = samples[0];
            exampleElement.innerHTML = `
                <strong>Preview:</strong> "${sample.original}" → "${sample.mapped}" 
                ${samples.length > 1 ? `<br><small>(${samples.length} samples shown)</small>` : ''}
            `;
        }
    }

    applyShippingMapping() {
        const locIdx = parseInt(this.locationColumnSelect.value);
        const volIdx = parseInt(this.volumeColumnSelect.value);
        if (isNaN(locIdx) || isNaN(volIdx)) {
            this.showError('Please select both location and shipping volume columns.');
            return;
        }
        if (!Array.isArray(this.lastShippingRows)) {
            this.showError('No shipping data available. Please import a file.');
            return;
        }
        
        // Get location character mapping settings
        const startChar = parseInt(this.locationStartChar.value) || 1;
        const endChar = parseInt(this.locationEndChar.value);
        
        // Build aggregation:
        // heatmapData: mappedLoc -> total volume
        // locationItems: mappedLoc -> (itemName -> total volume)
        // locationGroups: mappedLoc -> (fullLoc -> { total, items: Map(itemName -> total) })
        const heatmapData = new Map();
        const locationItems = new Map();
        const locationGroups = new Map();
        const itemIdx = this.itemColumnSelect && this.itemColumnSelect.value !== '' ? parseInt(this.itemColumnSelect.value) : null;
        for (const row of this.lastShippingRows) {
            const loc = row?.[locIdx];
            const valRaw = row?.[volIdx];
            if (loc === undefined || loc === null || String(loc).trim() === '') continue;
            
            // Apply character mapping to location
            const originalLoc = String(loc).trim();
            let mappedLoc = originalLoc;
            
            if (startChar > 1 || endChar) {
                const start = Math.max(0, startChar - 1); // Convert to 0-based index
                const end = endChar ? Math.min(originalLoc.length, endChar) : originalLoc.length;
                mappedLoc = originalLoc.substring(start, end);
            }
            
            const value = Number(valRaw);
            const numeric = isNaN(value) ? 0 : value;
            heatmapData.set(mappedLoc, (heatmapData.get(mappedLoc) || 0) + numeric);

            // Aggregate items per location (optional)
            if (itemIdx !== null) {
                const item = row?.[itemIdx];
                const itemName = item === undefined || item === null ? '' : String(item).trim();
                if (!locationItems.has(mappedLoc)) locationItems.set(mappedLoc, new Map());
                const itemMap = locationItems.get(mappedLoc);
                const key = itemName || (this.currentLanguage === 'ja' ? '（不明品目）' : '(Unknown Item)');
                itemMap.set(key, (itemMap.get(key) || 0) + numeric);
            }

            // Aggregate by full original location under the mapped location
            if (!locationGroups.has(mappedLoc)) locationGroups.set(mappedLoc, new Map());
            const groupMap = locationGroups.get(mappedLoc);
            if (!groupMap.has(originalLoc)) groupMap.set(originalLoc, { total: 0, items: new Map() });
            const group = groupMap.get(originalLoc);
            group.total += numeric;
            if (itemIdx !== null) {
                const item = row?.[itemIdx];
                const itemName = item === undefined || item === null ? '' : String(item).trim();
                const nameKey = itemName || (this.currentLanguage === 'ja' ? '（不明品目）' : '(Unknown Item)');
                group.items.set(nameKey, (group.items.get(nameKey) || 0) + numeric);
            }
        }

        // If a layout is loaded, render heatmap overlay using existing generator
        if (this.svgGenerator && this.svgGenerator.currentSheetData) {
            // Use the same options as the current layout to maintain consistency
            const options = {
                scaleFactor: parseFloat(this.scaleFactor.value),
                showGrid: this.showGrid.checked,
                showTitle: this.showTitle.checked,
                cellSize: this.cellSize.value ? parseInt(this.cellSize.value) : null
            };
            
            const svg = this.svgGenerator.generateSVGWithHeatmap(heatmapData, options);
            if (svg) {
                // Store the heatmap data, items, and options
                this.currentHeatmapData = heatmapData;
                this.currentLocationItems = locationItems;
                this.currentHeatmapOptions = options;
                this.currentLocationGroups = locationGroups;
                
                // Switch to heatmap tab and display the heatmap
                this.switchTab('heatmap');
                this.displayHeatmap(svg);
                this.updateHeatmapInfo(heatmapData);
                this.bindHeatmapClickHandlers();
                this.showSuccess('Applied mapping and generated heatmap.');
            } else {
                this.showError('Failed to generate heatmap.');
            }
        } else {
            this.showSuccess('Mapping applied. Import a layout to generate heatmap.');
        }
    }

    toggleHeatmapView() {
        if (!this.currentHeatmapData || !this.svgGenerator || !this.svgGenerator.currentSheetData) {
            this.showError('No heatmap data available.');
            return;
        }

        const isShowingHeatmap = this.heatmapToggleBtn.textContent === '元のレイアウト表示' || this.heatmapToggleBtn.textContent === 'Show Original Layout';
        
        if (isShowingHeatmap) {
            // Show original layout
            const options = {
                scaleFactor: parseFloat(this.scaleFactor.value),
                showGrid: this.showGrid.checked,
                showTitle: this.showTitle.checked,
                cellSize: this.cellSize.value ? parseInt(this.cellSize.value) : null
            };
            const svg = this.svgGenerator.generateSVGLayout(options);
            if (svg) {
                this.displaySVG(svg);
                this.heatmapToggleBtn.textContent = this.currentLanguage === 'ja' ? 'ヒートマップ表示' : 'Show Heatmap';
            }
        } else {
            // Show heatmap
            const options = {
                scaleFactor: parseFloat(this.scaleFactor.value),
                showGrid: this.showGrid.checked,
                showTitle: this.showTitle.checked,
                cellSize: this.cellSize.value ? parseInt(this.cellSize.value) : null
            };
            const svg = this.svgGenerator.generateSVGWithHeatmap(this.currentHeatmapData, options);
            if (svg) {
                this.displaySVG(svg);
                this.heatmapToggleBtn.textContent = this.currentLanguage === 'ja' ? '元のレイアウト表示' : 'Show Original Layout';
            }
        }
    }

    parseCSV(text) {
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const rows = [];
        for (const line of lines) {
            if (line === '') continue;
            rows.push(this.splitCSVLine(line));
        }
        return rows;
    }

    splitCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (inQuotes) {
                if (ch === '"') {
                    if (i + 1 < line.length && line[i + 1] === '"') { // escaped quote
                        current += '"';
                        i++;
                    } else {
                        inQuotes = false;
                    }
                } else {
                    current += ch;
                }
            } else {
                if (ch === '"') {
                    inQuotes = true;
                } else if (ch === ',') {
                    result.push(current);
                    current = '';
                } else {
                    current += ch;
                }
            }
        }
        result.push(current);
        return result;
    }

    switchTab(tabName) {
        // Update buttons
        this.tabButtons.forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            
            // Manage tabindex for accessibility
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Update panels
        this.tabPanels.forEach(panel => {
            const isActive = panel.id === `${tabName}-tab`;
            panel.classList.toggle('active', isActive);
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            if (isActive) {
                // Scroll to top of the tab content container to show upload first
                const tabContent = document.querySelector('.tab-content');
                if (tabContent) {
                    tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
        
        // Show/hide heatmap section based on tab
        if (tabName === 'heatmap') {
            this.heatmapSection.style.display = 'block';
            // Sync controls when switching to heatmap tab
            this.syncHeatmapControls();
        } else {
            this.heatmapSection.style.display = 'none';
        }
    }

    handleDragOver(e) {
        e.preventDefault();
        this.fileUploadArea.classList.add('dragover');
    }

    handleDragLeave(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
    }

    handleDrop(e) {
        e.preventDefault();
        this.fileUploadArea.classList.remove('dragover');
        
        const files = e.dataTransfer.files;
        if (files.length > 0) {
            this.fileInput.files = files;
            this.handleFileUpload({ target: { files: files } });
        }
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        // SVG passthrough support
        const isSVG = /\.svg$/i.test(file.name);
        if (isSVG) {
            try {
                const svgText = await file.text();
                this.displaySVG(svgText);
                this.controlsSection.style.display = 'none';
                this.infoSection.style.display = 'none';
                this.svgSection.style.display = 'block';
                this.showSuccess(this.currentLanguage === 'ja' ? 'SVGを読み込みました。' : 'SVG imported.');
            } catch (err) {
                console.error('Error reading SVG:', err);
                this.showError(this.currentLanguage === 'ja' ? 'SVGの読み込みに失敗しました。' : 'Failed to import SVG.');
            }
            return;
        }

        // Validate Excel file type
        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel'
        ];
        if (!validTypes.includes(file.type) && !file.name.match(/\.(xlsx|xls)$/i)) {
            this.showError(this.currentLanguage === 'ja' ? '有効なExcelファイル（.xlsx または .xls）を選択してください' : 'Please select a valid Excel file (.xlsx or .xls)');
            return;
        }

        this.currentFile = file;
        this.hideError();
        this.showLoading();

        try {
            // Process the Excel file
            await this.svgGenerator.processExcelFile(file);
            
            // Populate sheet selector
            this.populateSheetSelector();
            
            // Show controls
            this.controlsSection.style.display = 'block';
            
            this.hideLoading();
        } catch (error) {
            console.error('Error processing file:', error);
            this.showError(`Error processing file: ${error.message}`);
            this.hideLoading();
        }
    }

    populateSheetSelector() {
        const sheetNames = this.svgGenerator.getSheetNames();
        this.sheetSelect.innerHTML = '<option value="">Choose a sheet...</option>';
        
        sheetNames.forEach(sheetName => {
            const option = document.createElement('option');
            option.value = sheetName;
            option.textContent = sheetName;
            this.sheetSelect.appendChild(option);
        });
        
        // Auto-select the first sheet if available
        if (sheetNames.length > 0) {
            this.sheetSelect.value = sheetNames[0];
            this.handleSheetSelection({ target: { value: sheetNames[0] } });
        }
    }

    async handleSheetSelection(event) {
        const sheetName = event.target.value;
        if (!sheetName) {
            this.hideInfo();
            this.hideSVG();
            return;
        }

        try {
            this.currentSheet = this.svgGenerator.selectSheet(sheetName);
            // Snapshot original cells for safe range filtering
            this.originalCells = Array.isArray(this.currentSheet?.cells)
                ? this.currentSheet.cells.slice()
                : [];
            this.displaySheetInfo();
            this.infoSection.style.display = 'block';
            this.populateRangeDefaults();
            // Auto-generate layout once sheet is selected
            await this.generateSVG();
        } catch (error) {
            console.error('Error selecting sheet:', error);
            this.showError(`Error selecting sheet: ${error.message}`);
        }
    }

    populateRangeDefaults() {
        if (!this.currentSheet) return;
        
        const range = this.currentSheet.range;
        // Set default values based on the detected range
        this.startRow.value = range.s.r + 1; // Convert from 0-based to 1-based
        this.endRow.value = range.e.r + 1;
        this.startCol.value = this.numberToColumn(range.s.c);
        this.endCol.value = this.numberToColumn(range.e.c);
    }

    numberToColumn(num) {
        let result = '';
        while (num >= 0) {
            result = String.fromCharCode(65 + (num % 26)) + result;
            num = Math.floor(num / 26) - 1;
        }
        return result;
    }

    columnToNumber(str) {
        let result = 0;
        for (let i = 0; i < str.length; i++) {
            result = result * 26 + (str.charCodeAt(i) - 64);
        }
        return result - 1; // Convert to 0-based
    }

    applyRange() {
        if (!this.currentSheet) {
            this.showError('Please select a sheet first');
            return;
        }

        try {
            const startRow = parseInt(this.startRow.value) - 1; // Convert to 0-based
            const endRow = parseInt(this.endRow.value) - 1;
            const startCol = this.columnToNumber(this.startCol.value.toUpperCase());
            const endCol = this.columnToNumber(this.endCol.value.toUpperCase());

            // Validate range
            if (startRow < 0 || endRow < startRow || startCol < 0 || endCol < startCol) {
                this.showError('Invalid range. Please check your input.');
                return;
            }

            // Create custom range
            const customRange = {
                s: { r: startRow, c: startCol },
                e: { r: endRow, c: endCol }
            };

            // Apply the custom range to the current sheet data
            this.currentSheet.range = customRange;

            // Filter cells from the original snapshot, not cumulatively
            const sourceCells = Array.isArray(this.originalCells) ? this.originalCells : this.currentSheet.cells;
            this.currentSheet.cells = sourceCells.filter(cell => 
                cell.row >= startRow && cell.row <= endRow &&
                cell.col >= startCol && cell.col <= endCol
            );

            this.displaySheetInfo();
            this.showSuccess('Range applied successfully!');
            // Regenerate SVG to reflect the new range
            this.generateSVG();
        } catch (error) {
            console.error('Error applying range:', error);
            this.showError(`Error applying range: ${error.message}`);
        }
    }

    resetRange() {
        if (!this.currentSheet) return;
        
        // Reset to original full range
        this.currentSheet.range = this.currentSheet.fullRange;
        
        // Restore all cells from snapshot
        if (Array.isArray(this.originalCells)) {
            this.currentSheet.cells = this.originalCells.slice();
        }
        this.populateRangeDefaults();
        this.displaySheetInfo();
        this.showSuccess('Range reset to full sheet');
        // Regenerate SVG to reflect reset
        this.generateSVG();
    }

    showSuccess(message) {
        // Create a temporary success message
        const successDiv = document.createElement('div');
        successDiv.className = 'success-message';
        successDiv.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: #d4edda;
            color: #155724;
            padding: 15px 20px;
            border-radius: 8px;
            border: 1px solid #c3e6cb;
            z-index: 1000;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        `;
        successDiv.textContent = message;
        document.body.appendChild(successDiv);
        
        // Remove after 3 seconds
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
    }

    displayHeatmap(svg) {
        this.heatmapSvgDisplay.innerHTML = svg;
        this.heatmapSvgSection.style.display = 'block';
        this.heatmapControls.style.display = 'block';
        this.heatmapLegend.style.display = 'block';
        this.heatmapDownloadBtn.disabled = false;
        this.heatmapToggleBtn.style.display = 'inline-block';
        this.heatmapToggleBtn.textContent = this.currentLanguage === 'ja' ? '元のレイアウト表示' : 'Show Original Layout';
        this.bindHeatmapClickHandlers();
    }

    updateHeatmapInfo(heatmapData) {
        const totalLocations = heatmapData.size;
        const totalVolume = Array.from(heatmapData.values()).reduce((sum, vol) => sum + vol, 0);
        const maxVolume = Math.max(...Array.from(heatmapData.values()));
        const avgVolume = totalVolume / totalLocations;
        
        // Calculate scale ranges for better understanding
        const volumes = Array.from(heatmapData.values()).sort((a, b) => a - b);
        const minVolume = Math.min(...volumes);
        const q1 = volumes[Math.floor(volumes.length * 0.25)];
        const median = volumes[Math.floor(volumes.length * 0.5)];
        const q3 = volumes[Math.floor(volumes.length * 0.75)];
        
        this.heatmapInfo.innerHTML = `
            <p><strong>Heatmap Statistics:</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Total locations with activity: ${totalLocations}</li>
                <li>Total shipping volume: ${totalVolume.toLocaleString()}</li>
                <li>Volume range: ${minVolume.toLocaleString()} - ${maxVolume.toLocaleString()}</li>
                <li>Average volume per location: ${avgVolume.toFixed(1)}</li>
                <li>Median volume: ${median.toFixed(1)}</li>
            </ul>
            <p><strong>Scale Information:</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Low activity (Green): Bottom 50% of locations</li>
                <li>Medium activity (Yellow): 50-80% percentile</li>
                <li>High activity (Red): Top 20% of locations</li>
            </ul>
            <p><strong>Actual Value Ranges:</strong></p>
            <ul style="margin: 8px 0; padding-left: 20px;">
                <li>Low activity: ${minVolume.toLocaleString()} - ${q1.toFixed(0)}</li>
                <li>Medium activity: ${q1.toFixed(0)} - ${q3.toFixed(0)}</li>
                <li>High activity: ${q3.toFixed(0)} - ${maxVolume.toLocaleString()}</li>
            </ul>
        `;
    }

    bindHeatmapClickHandlers() {
        const svgRoot = this.heatmapSvgDisplay.querySelector('svg');
        if (!svgRoot) return;
        const clickable = svgRoot.querySelectorAll('.warehouse-cell');
        clickable.forEach(el => {
            el.addEventListener('click', () => {
                const location = el.getAttribute('data-location') || '';
                const activity = el.getAttribute('data-activity');
                this.showLocationDetails(location, activity);
            });
        });
    }

    showLocationDetails(location, activity) {
        if (!location) return;
        const total = this.currentHeatmapData ? (this.currentHeatmapData.get(location) || 0) : (activity ? Number(activity) : 0);
        const itemsMap = this.currentLocationItems ? this.currentLocationItems.get(location) : null;
        const groups = this.currentLocationGroups ? this.currentLocationGroups.get(location) : null;
        let html = '';
        html += `<p><strong>${this.currentLanguage === 'ja' ? 'ロケーション' : 'Location'}:</strong> ${this.escapeHtml(location)}</p>`;
        html += `<p><strong>${this.currentLanguage === 'ja' ? '合計量' : 'Total Volume'}:</strong> ${Number(total).toLocaleString()}</p>`;
        if (groups && groups.size > 0) {
            html += `<p><strong>${this.currentLanguage === 'ja' ? 'フルロケーション別' : 'By Full Location'}:</strong></p>`;
            html += '<ul>';
            const sortedGroups = Array.from(groups.entries()).sort((a,b) => b[1].total - a[1].total);
            for (const [fullLoc, info] of sortedGroups) {
                html += `<li><strong>${this.escapeHtml(fullLoc)}</strong>: ${Number(info.total).toLocaleString()}`;
                if (info.items && info.items.size > 0) {
                    const itemsSorted = Array.from(info.items.entries()).sort((a,b) => b[1]-a[1]);
                    html += '<ul>';
                    for (const [name, qty] of itemsSorted) {
                        html += `<li>${this.escapeHtml(name)}: ${Number(qty).toLocaleString()}</li>`;
                    }
                    html += '</ul>';
                }
                html += '</li>';
            }
            html += '</ul>';
        } else if (itemsMap && itemsMap.size > 0) {
            html += `<p><strong>${this.currentLanguage === 'ja' ? '品目内訳' : 'Items'}:</strong></p>`;
            html += '<ul>';
            const sorted = Array.from(itemsMap.entries()).sort((a,b) => b[1]-a[1]);
            for (const [name, qty] of sorted) {
                html += `<li>${this.escapeHtml(name)}: ${Number(qty).toLocaleString()}</li>`;
            }
            html += '</ul>';
        } else {
            html += `<p class="muted">${this.currentLanguage === 'ja' ? '詳細データはありません。' : 'No detailed data.'}</p>`;
        }
        this.heatmapDetails.innerHTML = html;
        this.heatmapDetailsCard.style.display = 'block';
        this.heatmapDetailsCard.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    syncHeatmapControls() {
        // Sync heatmap controls with main layout controls
        this.heatmapCellSize.value = this.cellSize.value;
        this.heatmapShowGrid.checked = this.showGrid.checked;
        this.heatmapShowTitle.checked = this.showTitle.checked;
    }

    generateHeatmap() {
        if (!this.currentHeatmapData || !this.svgGenerator || !this.svgGenerator.currentSheetData) {
            this.showError('No heatmap data available. Please import layout and shipping data first.');
            return;
        }
        
        const options = {
            scaleFactor: parseFloat(this.heatmapScaleFactor.value),
            showGrid: this.heatmapShowGrid.checked,
            showTitle: this.heatmapShowTitle.checked,
            cellSize: this.heatmapCellSize.value ? parseInt(this.heatmapCellSize.value) : null
        };
        
        const svg = this.svgGenerator.generateSVGWithHeatmap(this.currentHeatmapData, options);
        if (svg) {
            this.displayHeatmap(svg);
            this.currentHeatmapOptions = options;
            this.showSuccess('Heatmap regenerated with new settings.');
        } else {
            this.showError('Failed to generate heatmap.');
        }
    }

    downloadHeatmap() {
        if (!this.currentHeatmapData) {
            this.showError('No heatmap data available to download.');
            return;
        }
        
        const svgContent = this.heatmapSvgDisplay.innerHTML;
        if (!svgContent) {
            this.showError('No heatmap SVG to download.');
            return;
        }
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'warehouse-heatmap.svg';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        this.showSuccess('Heatmap downloaded successfully.');
    }

    toggleHeatmapView() {
        if (!this.currentHeatmapData || !this.svgGenerator || !this.svgGenerator.currentSheetData) {
            this.showError('No heatmap data available.');
            return;
        }
        
        const isShowingHeatmap = this.heatmapToggleBtn.textContent === '元のレイアウト表示' || this.heatmapToggleBtn.textContent === 'Show Original Layout';
        
        if (isShowingHeatmap) {
            // Show original layout
            const options = this.currentHeatmapOptions || {
                scaleFactor: parseFloat(this.heatmapScaleFactor.value),
                showGrid: this.heatmapShowGrid.checked,
                showTitle: this.heatmapShowTitle.checked,
                cellSize: this.heatmapCellSize.value ? parseInt(this.heatmapCellSize.value) : null
            };
            
            const svg = this.svgGenerator.generateSVGLayout(options);
            if (svg) {
                this.displayHeatmap(svg);
                this.heatmapToggleBtn.textContent = this.currentLanguage === 'ja' ? 'ヒートマップ表示' : 'Show Heatmap';
                this.heatmapLegend.style.display = 'none';
            }
        } else {
            // Show heatmap
            const options = this.currentHeatmapOptions || {
                scaleFactor: parseFloat(this.heatmapScaleFactor.value),
                showGrid: this.heatmapShowGrid.checked,
                showTitle: this.heatmapShowTitle.checked,
                cellSize: this.heatmapCellSize.value ? parseInt(this.heatmapCellSize.value) : null
            };
            
            const svg = this.svgGenerator.generateSVGWithHeatmap(this.currentHeatmapData, options);
            if (svg) {
                this.displayHeatmap(svg);
                this.heatmapToggleBtn.textContent = this.currentLanguage === 'ja' ? '元のレイアウト表示' : 'Show Original Layout';
                this.heatmapLegend.style.display = 'block';
            }
        }
    }

    switchLanguage() {
        this.currentLanguage = this.currentLanguage === 'ja' ? 'en' : 'ja';
        this.updateLanguage();
    }

    updateLanguage() {
        const translations = {
            ja: {
                title: '倉庫ヒートマップ生成器',
                description: 'ファイルをアップロードして倉庫レイアウトのヒートマップ可視化を生成',
                langButton: 'English',
                tabs: {
                    layout: 'レイアウトインポート',
                    shipping: '出荷情報',
                    heatmap: 'ヒートマップ表示'
                },
                upload: {
                    layout: 'Excelファイルをここにドロップするかクリックして参照',
                    shipping: '出荷データファイルをここにドロップするかクリックして参照',
                    formats: '対応形式: .xlsx, .xls'
                },
                controls: {
                    sheetSelect: 'シート選択',
                    scaleFactor: 'スケール係数',
                    cellSize: 'セルサイズ',
                    showGrid: 'グリッド表示',
                    showTitle: 'タイトル表示',
                    generate: 'SVG生成',
                    download: 'SVGダウンロード',
                    reset: 'リセット'
                },
                range: {
                    title: 'データ範囲選択',
                    startRow: '開始行',
                    endRow: '終了行',
                    startCol: '開始列',
                    endCol: '終了列',
                    apply: '範囲適用',
                    autoArrange: '自動配置'
                },
                info: {
                    sheet: 'シート情報',
                    shipping: '出荷データ情報',
                    preview: 'データプレビュー'
                },
                mapping: {
                    title: '列マッピング',
                    location: 'ロケーション列',
                    volume: '出荷量列',
                    charMapping: 'ロケーション文字マッピング',
                    charDescription: '出荷データのロケーションからどの文字をレイアウトのロケーションと一致させるかを指定します。',
                    example: '例: 出荷データ: "C-02-03" → レイアウト: "C-02" (文字1-4)',
                    startChar: '開始文字位置',
                    endChar: '終了文字位置',
                    apply: 'マッピング適用'
                },
                heatmap: {
                    title: '倉庫ヒートマップ可視化',
                    noData: 'ヒートマップデータがありません。まずレイアウトと出荷データをインポートしてください。',
                    generate: 'ヒートマップ生成',
                    download: 'ヒートマップダウンロード',
                    toggle: '元のレイアウト表示',
                    legend: 'アクティビティレベル凡例',
                    colorScale: 'カラースケール: グレー = アクティビティなし、緑 = 低アクティビティ、黄 = 中アクティビティ、赤 = 高アクティビティ。',
                    percentileScale: 'パーセンタイルスケール: 色はデータのパーセンタイルランキングに基づきます（下位5%から上位2%）。',
                    tip: '💡 ヒント: セルにマウスを重ねると正確なアクティビティ値が表示されます。スケールは最適な可視化のためにデータ範囲に自動的に適応します。'
                }
            },
            en: {
                title: 'Warehouse Heatmap Generator',
                description: 'Upload files to generate warehouse layout heatmap visualizations',
                langButton: '日本語',
                tabs: {
                    layout: 'Layout Import',
                    shipping: 'Shipping Information',
                    heatmap: 'Heatmap View'
                },
                upload: {
                    layout: 'Drop Excel file here or click to browse',
                    shipping: 'Drop shipping data file here or click to browse',
                    formats: 'Supported formats: .xlsx, .xls'
                },
                controls: {
                    sheetSelect: 'Select Sheet:',
                    scaleFactor: 'Scale Factor:',
                    cellSize: 'Cell Size:',
                    showGrid: 'Show Grid',
                    showTitle: 'Show Title',
                    generate: 'Generate SVG',
                    download: 'Download SVG',
                    reset: 'Reset'
                },
                range: {
                    title: 'Data Range Selection',
                    startRow: 'Start Row:',
                    endRow: 'End Row:',
                    startCol: 'Start Column:',
                    endCol: 'End Column:',
                    apply: 'Apply Range',
                    autoArrange: 'Auto Arrange'
                },
                info: {
                    sheet: 'Sheet Information',
                    shipping: 'Shipping Data Information',
                    preview: 'Data Preview'
                },
                mapping: {
                    title: 'Column Mapping',
                    location: 'Location Column',
                    volume: 'Shipping Volume Column',
                    charMapping: 'Location Character Mapping',
                    charDescription: 'Specify which characters from the shipping location should match the layout location.',
                    example: 'Example: Shipping data: "C-02-03" → Layout: "C-02" (characters 1-4)',
                    startChar: 'Start Character Position:',
                    endChar: 'End Character Position:',
                    apply: 'Apply Mapping'
                },
                heatmap: {
                    title: 'Warehouse Heatmap Visualization',
                    noData: 'No heatmap data available. Please import layout and shipping data first.',
                    generate: 'Generate Heatmap',
                    download: 'Download Heatmap',
                    toggle: 'Show Original Layout',
                    legend: 'Activity Level Legend',
                    colorScale: 'Color Scale: Gray = No activity, Green = Low activity, Yellow = Medium activity, Red = High activity.',
                    percentileScale: 'Percentile Scale: Colors are based on percentile ranking of your data (bottom 5% to top 2%).',
                    tip: '💡 Tip: Hover over cells to see exact activity values. The scale automatically adapts to your data range for optimal visualization.'
                }
            }
        };

        const t = translations[this.currentLanguage];
        
        // Update document title and header
        document.title = t.title;
        document.querySelector('h1').textContent = t.title;
        document.querySelector('header p').textContent = t.description;
        this.langSwitch.textContent = t.langButton;
        
        // Update tab buttons
        document.querySelector('[data-tab="layout"]').textContent = t.tabs.layout;
        document.querySelector('[data-tab="shipping"]').textContent = t.tabs.shipping;
        document.querySelector('[data-tab="heatmap"]').textContent = t.tabs.heatmap;
        
        // Update upload areas
        document.querySelector('#fileUploadArea h3').textContent = t.upload.layout;
        document.querySelector('#shippingFileUploadArea h3').textContent = t.upload.shipping;
        document.querySelector('#fileUploadArea p').textContent = t.upload.formats;
        document.querySelector('#shippingFileUploadArea p').textContent = '.csv, .xlsx, .xls, .md';
        
        // Update controls
        document.querySelector('label[for="sheetSelect"]').textContent = t.controls.sheetSelect;
        document.querySelector('label[for="scaleFactor"]').textContent = t.controls.scaleFactor;
        document.querySelector('label[for="cellSize"]').textContent = t.controls.cellSize;
        document.querySelector('label[for="showGrid"]').textContent = t.controls.showGrid;
        document.querySelector('label[for="showTitle"]').textContent = t.controls.showTitle;
        document.getElementById('generateBtn').textContent = t.controls.generate;
        document.getElementById('downloadBtn').textContent = t.controls.download;
        document.getElementById('resetBtn').textContent = t.controls.reset;
        
        // Update range controls
        document.querySelector('.range-controls h4').textContent = t.range.title;
        document.querySelector('label[for="startRow"]').textContent = t.range.startRow;
        document.querySelector('label[for="endRow"]').textContent = t.range.endRow;
        document.querySelector('label[for="startCol"]').textContent = t.range.startCol;
        document.querySelector('label[for="endCol"]').textContent = t.range.endCol;
        document.getElementById('applyRangeBtn').textContent = t.range.apply;
        document.getElementById('resetRangeBtn').textContent = t.range.autoArrange;
        
        // Update info sections
        document.querySelector('#infoSection h3').textContent = t.info.sheet;
        document.querySelector('#shippingInfoSection h3').textContent = t.info.shipping;
        document.querySelector('#shippingPreviewSection h3').textContent = t.info.preview;
        
        // Update mapping section
        document.querySelector('#shippingMappingCard h3').textContent = t.mapping.title;
        document.querySelector('label[for="locationColumnSelect"]').textContent = t.mapping.location;
        document.querySelector('label[for="volumeColumnSelect"]').textContent = t.mapping.volume;
        document.querySelector('.location-mapping-section h4').textContent = t.mapping.charMapping;
        document.querySelector('.mapping-description').textContent = t.mapping.charDescription;
        document.querySelector('.mapping-example').innerHTML = `<strong>${t.mapping.example.split(':')[0]}:</strong> ${t.mapping.example.split(':')[1]}`;
        document.querySelector('label[for="locationStartChar"]').textContent = t.mapping.startChar;
        document.querySelector('label[for="locationEndChar"]').textContent = t.mapping.endChar;
        document.getElementById('applyMappingBtn').textContent = t.mapping.apply;
        
        // Update heatmap section
        document.querySelector('#heatmapSection h3').textContent = t.heatmap.title;
        document.querySelector('#heatmapInfo p').textContent = t.heatmap.noData;
        document.querySelector('label[for="heatmapScaleFactor"]').textContent = t.controls.scaleFactor;
        document.querySelector('label[for="heatmapCellSize"]').textContent = t.controls.cellSize;
        document.querySelector('label[for="heatmapShowGrid"]').textContent = t.controls.showGrid;
        document.querySelector('label[for="heatmapShowTitle"]').textContent = t.controls.showTitle;
        document.getElementById('heatmapGenerateBtn').textContent = t.heatmap.generate;
        document.getElementById('heatmapDownloadBtn').textContent = t.heatmap.download;
        document.getElementById('heatmapToggleBtn').textContent = t.heatmap.toggle;
        document.querySelector('#heatmapSvgSection h3').textContent = t.heatmap.title;
        document.querySelector('#heatmapLegend h4').textContent = t.heatmap.legend;
        document.querySelector('.legend-description p:first-child').innerHTML = `<strong>${t.heatmap.colorScale.split(':')[0]}:</strong> ${t.heatmap.colorScale.split(':')[1]}`;
        document.querySelector('.legend-description p:last-child').innerHTML = `<strong>${t.heatmap.percentileScale.split(':')[0]}:</strong> ${t.heatmap.percentileScale.split(':')[1]}`;
        document.querySelector('.legend-note p').innerHTML = `<em>${t.heatmap.tip}</em>`;
        
        // Update document language attribute
        document.documentElement.lang = this.currentLanguage;
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    displaySheetInfo() {
        if (!this.currentSheet) return;

        const info = this.svgGenerator.getSheetInfo();
        this.sheetInfo.innerHTML = `
            <div class="info-item">
                <strong>Sheet Name:</strong>
                <span>${info.name}</span>
            </div>
            <div class="info-item">
                <strong>Size:</strong>
                <span>${info.size}</span>
            </div>
            <div class="info-item">
                <strong>Cells with Data:</strong>
                <span>${info.cellsWithData}</span>
            </div>
            <div class="info-item">
                <strong>Merged Regions:</strong>
                <span>${info.mergedRegions}</span>
            </div>
        `;
    }

    async generateSVG() {
        if (!this.currentSheet) {
            this.showError('Please select a sheet first');
            return;
        }

        this.showLoading();
        this.hideError();

        try {
            const options = {
                scaleFactor: parseFloat(this.scaleFactor.value),
                showGrid: this.showGrid.checked,
                showTitle: this.showTitle.checked,
                cellSize: this.cellSize.value ? parseInt(this.cellSize.value) : null
            };

            const svg = this.svgGenerator.generateSVGLayout(options);
            
            if (svg) {
                this.displaySVG(svg);
                this.downloadBtn.disabled = false;
            } else {
                this.showError('Failed to generate SVG');
            }
        } catch (error) {
            console.error('Error generating SVG:', error);
            this.showError(`Error generating SVG: ${error.message}`);
        } finally {
            this.hideLoading();
        }
    }

    displaySVG(svgString) {
        this.svgDisplay.innerHTML = svgString;
        this.svgSection.style.display = 'block';
        
        // Scroll to SVG section
        this.svgSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Horizontal scroll controls removed

    downloadSVG() {
        if (this.svgGenerator.generatedSVG) {
            this.svgGenerator.downloadSVG();
        }
    }

    resetApp() {
        // Reset form
        this.fileInput.value = '';
        this.sheetSelect.innerHTML = '<option value="">Choose a sheet...</option>';
        this.scaleFactor.value = 0.5;
        this.scaleValue.textContent = '0.5';
        this.cellSize.value = 20;
        this.showGrid.checked = true;
        this.showTitle.checked = true;
        // Reset range controls
        this.startRow.value = 1;
        this.endRow.value = '';
        this.startCol.value = 'A';
        this.endCol.value = '';
        
        // Hide sections
        this.controlsSection.style.display = 'none';
        this.infoSection.style.display = 'none';
        this.svgSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        
        // Reset state
        this.currentFile = null;
        this.currentSheet = null;
        this.downloadBtn.disabled = true;
        
        // Reset SVG generator
        this.svgGenerator = new SVGLayoutGenerator();
    }

    showError(message) {
        this.errorText.textContent = message;
        this.errorSection.style.display = 'block';
        this.errorSection.scrollIntoView({ behavior: 'smooth' });
    }

    hideError() {
        this.errorSection.style.display = 'none';
    }

    showLoading() {
        this.generateBtn.innerHTML = '<span class="loading"></span> Generating...';
        this.generateBtn.disabled = true;
    }

    hideLoading() {
        this.generateBtn.innerHTML = 'Generate SVG';
        this.generateBtn.disabled = false;
    }

    hideInfo() {
        this.infoSection.style.display = 'none';
    }

    hideSVG() {
        this.svgSection.style.display = 'none';
        this.downloadBtn.disabled = true;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new SVGGeneratorApp();
});
