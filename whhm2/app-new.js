// Main WHHM App - Coordinates between processors
class WHHMApp {
    constructor() {
        this.layoutProcessor = new LayoutProcessor();
        this.shippingProcessor = new ShippingProcessor();
        this.heatmapGenerator = new HeatmapGenerator();
        this.currentLanguage = 'ja';
        
        this.initializeElements();
        this.attachEventListeners();
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
        // Tab switching events
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
        
        // Range control buttons
        this.applyRangeBtn.addEventListener('click', () => this.applyRange());
        this.resetRangeBtn.addEventListener('click', () => this.resetRange());
        
        // Action buttons
        this.generateBtn.addEventListener('click', () => this.generateSVG());
        this.downloadBtn.addEventListener('click', () => this.downloadSVG());
        this.resetBtn.addEventListener('click', () => this.resetApp());
    }

    // Layout Processing Methods
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

        this.hideError();
        this.showLoading();

        try {
            // Process the Excel file using LayoutProcessor
            await this.layoutProcessor.processExcelFile(file);
            
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
        const sheetNames = this.layoutProcessor.getSheetNames();
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
            this.layoutProcessor.selectSheet(sheetName);
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

    displaySheetInfo() {
        const info = this.layoutProcessor.getSheetInfo();
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
        if (!this.layoutProcessor.currentSheetData) {
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

            const svg = this.layoutProcessor.generateSVGLayout(options);
            
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
        this.svgSection.scrollIntoView({ behavior: 'smooth' });
    }

    downloadSVG() {
        if (this.layoutProcessor.generatedSVG) {
            this.layoutProcessor.downloadSVG();
        }
    }

    // Shipping Processing Methods
    async handleShippingFileUpload(event) {
        const file = event.target.files && event.target.files[0];
        if (!file) return;

        try {
            const shippingData = await this.shippingProcessor.processShippingFile(file);
            this.shippingProcessor.setLanguage(this.currentLanguage);
            
            this.shippingInfo.innerHTML = this.shippingProcessor.renderShippingInfo(shippingData);
            this.shippingInfoSection.style.display = 'block';
            
            if (shippingData.headers && shippingData.dataRows) {
                this.shippingPreview.innerHTML = this.shippingProcessor.renderShippingPreviewTable(shippingData.headers, shippingData.dataRows);
                this.shippingPreviewSection.style.display = 'block';
                
                const mappingData = this.shippingProcessor.populateShippingMapping(shippingData.headers);
                this.setupShippingMapping(mappingData);
            } else if (shippingData.content) {
                this.shippingPreviewSection.style.display = 'block';
                this.shippingPreview.innerHTML = `<div class="md-preview">${this.escapeHtml(shippingData.content).replace(/\n/g, '<br>')}</div>`;
            }
        } catch (err) {
            console.error('Error processing shipping file:', err);
            this.showError(`Error processing shipping file: ${err.message}`);
        }
    }

    setupShippingMapping(mappingData) {
        this.locationColumnSelect.innerHTML = mappingData.locationOptions;
        this.volumeColumnSelect.innerHTML = mappingData.volumeOptions;
        if (this.itemColumnSelect) this.itemColumnSelect.innerHTML = mappingData.itemOptions;
        
        // Set auto-detected values
        if (mappingData.autoDetectedLocation) this.locationColumnSelect.value = mappingData.autoDetectedLocation;
        if (mappingData.autoDetectedVolume) this.volumeColumnSelect.value = mappingData.autoDetectedVolume;
        
        // Add event listeners for location mapping preview
        this.locationColumnSelect.addEventListener('change', () => this.updateLocationMappingPreview());
        this.locationStartChar.addEventListener('input', () => this.updateLocationMappingPreview());
        this.locationEndChar.addEventListener('input', () => this.updateLocationMappingPreview());
        
        this.shippingMappingCard.style.display = 'block';
        this.shippingMappingCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setTimeout(() => {
            this.locationColumnSelect?.focus();
            this.updateLocationMappingPreview();
        }, 0);
    }

    updateLocationMappingPreview() {
        const preview = this.shippingProcessor.updateLocationMappingPreview(
            this.locationColumnSelect,
            this.locationStartChar,
            this.locationEndChar,
            this.shippingProcessor.lastShippingRows
        );
        
        const exampleElement = document.querySelector('.mapping-example');
        if (exampleElement && preview) {
            exampleElement.innerHTML = preview;
        }
    }

    applyShippingMapping() {
        try {
            const shippingData = this.shippingProcessor.applyShippingMapping(
                this.locationColumnSelect,
                this.volumeColumnSelect,
                this.itemColumnSelect,
                this.locationStartChar,
                this.locationEndChar
            );

            // If a layout is loaded, generate heatmap
            if (this.layoutProcessor && this.layoutProcessor.currentSheetData) {
                const options = {
                    scaleFactor: parseFloat(this.scaleFactor.value),
                    showGrid: this.showGrid.checked,
                    showTitle: this.showTitle.checked,
                    cellSize: this.cellSize.value ? parseInt(this.cellSize.value) : null
                };
                
                const svg = this.heatmapGenerator.generateHeatmap(this.layoutProcessor, shippingData, options);
                if (svg) {
                    // Switch to heatmap tab and display the heatmap
                    this.switchTab('heatmap');
                    this.displayHeatmap(svg);
                    this.updateHeatmapInfo(shippingData.heatmapData);
                    this.bindHeatmapClickHandlers();
                    this.showSuccess('Applied mapping and generated heatmap.');
                } else {
                    this.showError('Failed to generate heatmap.');
                }
            } else {
                this.showSuccess('Mapping applied. Import a layout to generate heatmap.');
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    // Heatmap Methods
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
        this.heatmapInfo.innerHTML = this.heatmapGenerator.updateHeatmapInfo(heatmapData);
    }

    bindHeatmapClickHandlers() {
        this.heatmapGenerator.bindHeatmapClickHandlers(this.heatmapSvgDisplay);
    }

    generateHeatmap() {
        if (!this.heatmapGenerator.getCurrentHeatmapData() || !this.layoutProcessor || !this.layoutProcessor.currentSheetData) {
            this.showError('No heatmap data available. Please import layout and shipping data first.');
            return;
        }
        
        const options = {
            scaleFactor: parseFloat(this.heatmapScaleFactor.value),
            showGrid: this.heatmapShowGrid.checked,
            showTitle: this.heatmapShowTitle.checked,
            cellSize: this.heatmapCellSize.value ? parseInt(this.heatmapCellSize.value) : null
        };
        
        try {
            const shippingData = {
                heatmapData: this.heatmapGenerator.getCurrentHeatmapData(),
                locationItems: this.heatmapGenerator.getCurrentLocationItems(),
                locationGroups: this.heatmapGenerator.getCurrentLocationGroups()
            };
            
            const svg = this.heatmapGenerator.generateHeatmap(this.layoutProcessor, shippingData, options);
            if (svg) {
                this.displayHeatmap(svg);
                this.showSuccess('Heatmap regenerated with new settings.');
            } else {
                this.showError('Failed to generate heatmap.');
            }
        } catch (error) {
            this.showError(error.message);
        }
    }

    downloadHeatmap() {
        const svgContent = this.heatmapSvgDisplay.innerHTML;
        if (!svgContent) {
            this.showError('No heatmap SVG to download.');
            return;
        }
        
        try {
            this.heatmapGenerator.downloadHeatmap(svgContent);
            this.showSuccess('Heatmap downloaded successfully.');
        } catch (error) {
            this.showError(error.message);
        }
    }

    toggleHeatmapView() {
        if (!this.heatmapGenerator.getCurrentHeatmapData() || !this.layoutProcessor || !this.layoutProcessor.currentSheetData) {
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
            const svg = this.layoutProcessor.generateSVGLayout(options);
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
            
            const shippingData = {
                heatmapData: this.heatmapGenerator.getCurrentHeatmapData(),
                locationItems: this.heatmapGenerator.getCurrentLocationItems(),
                locationGroups: this.heatmapGenerator.getCurrentLocationGroups()
            };
            
            const svg = this.heatmapGenerator.generateHeatmap(this.layoutProcessor, shippingData, options);
            if (svg) {
                this.displaySVG(svg);
                this.heatmapToggleBtn.textContent = this.currentLanguage === 'ja' ? '元のレイアウト表示' : 'Show Original Layout';
            }
        }
    }

    syncHeatmapControls() {
        // Sync heatmap controls with main layout controls
        this.heatmapCellSize.value = this.cellSize.value;
        this.heatmapShowGrid.checked = this.showGrid.checked;
        this.heatmapShowTitle.checked = this.showTitle.checked;
    }

    // Utility Methods
    switchTab(tabName) {
        // Update buttons
        this.tabButtons.forEach(btn => {
            const isActive = btn.dataset.tab === tabName;
            btn.classList.toggle('active', isActive);
            btn.setAttribute('aria-selected', isActive ? 'true' : 'false');
            btn.setAttribute('tabindex', isActive ? '0' : '-1');
        });

        // Update panels
        this.tabPanels.forEach(panel => {
            const isActive = panel.id === `${tabName}-tab`;
            panel.classList.toggle('active', isActive);
            panel.setAttribute('aria-hidden', isActive ? 'false' : 'true');
            if (isActive) {
                const tabContent = document.querySelector('.tab-content');
                if (tabContent) {
                    tabContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            }
        });
        
        // Show/hide heatmap section based on tab
        if (tabName === 'heatmap') {
            this.heatmapSection.style.display = 'block';
            this.syncHeatmapControls();
        } else {
            this.heatmapSection.style.display = 'none';
        }
    }

    switchLanguage() {
        this.currentLanguage = this.currentLanguage === 'ja' ? 'en' : 'ja';
        this.shippingProcessor.setLanguage(this.currentLanguage);
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
        document.querySelector('input[id="showGrid"]').parentElement.textContent = t.controls.showGrid;
        document.querySelector('input[id="showTitle"]').parentElement.textContent = t.controls.showTitle;
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
        document.querySelector('input[id="heatmapShowGrid"]').parentElement.textContent = t.controls.showGrid;
        document.querySelector('input[id="heatmapShowTitle"]').parentElement.textContent = t.controls.showTitle;
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

    // Range control methods
    populateRangeDefaults() {
        if (!this.layoutProcessor.currentSheetData) return;
        
        const range = this.layoutProcessor.currentSheetData.range;
        this.startRow.value = range.s.r + 1;
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
        return result - 1;
    }

    applyRange() {
        if (!this.layoutProcessor.currentSheetData) {
            this.showError('Please select a sheet first');
            return;
        }

        try {
            const startRow = parseInt(this.startRow.value) - 1;
            const endRow = parseInt(this.endRow.value) - 1;
            const startCol = this.columnToNumber(this.startCol.value.toUpperCase());
            const endCol = this.columnToNumber(this.endCol.value.toUpperCase());

            if (startRow < 0 || endRow < startRow || startCol < 0 || endCol < startCol) {
                this.showError('Invalid range. Please check your input.');
                return;
            }

            const customRange = {
                s: { r: startRow, c: startCol },
                e: { r: endRow, c: endCol }
            };

            this.layoutProcessor.currentSheetData.range = customRange;
            this.displaySheetInfo();
            this.showSuccess('Range applied successfully!');
            this.generateSVG();
        } catch (error) {
            console.error('Error applying range:', error);
            this.showError(`Error applying range: ${error.message}`);
        }
    }

    resetRange() {
        if (!this.layoutProcessor.currentSheetData) return;
        
        this.layoutProcessor.currentSheetData.range = this.layoutProcessor.currentSheetData.fullRange;
        this.populateRangeDefaults();
        this.displaySheetInfo();
        this.showSuccess('Range reset to full sheet');
        this.generateSVG();
    }

    // Drag and drop methods
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

    // UI helper methods
    showSuccess(message) {
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
        
        setTimeout(() => {
            document.body.removeChild(successDiv);
        }, 3000);
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

    resetApp() {
        // Reset form
        this.fileInput.value = '';
        this.shippingFileInput.value = '';
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
        this.shippingInfoSection.style.display = 'none';
        this.shippingPreviewSection.style.display = 'none';
        this.shippingMappingCard.style.display = 'none';
        this.heatmapSection.style.display = 'none';
        this.errorSection.style.display = 'none';
        
        // Reset state
        this.downloadBtn.disabled = true;
        this.heatmapDownloadBtn.disabled = true;
        
        // Reset processors
        this.layoutProcessor = new LayoutProcessor();
        this.shippingProcessor = new ShippingProcessor();
        this.heatmapGenerator = new HeatmapGenerator();
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new WHHMApp();
});

