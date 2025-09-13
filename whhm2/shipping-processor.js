// Shipping Processor - Handles shipping data files
class ShippingProcessor {
    constructor() {
        this.lastShippingHeaders = null;
        this.lastShippingRows = null;
        this.currentLanguage = 'ja';
    }

    async processShippingFile(file) {
        const name = file.name.toLowerCase();
        if (name.endsWith('.csv')) {
            return await this.processShippingCSV(file);
        } else if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
            return await this.processShippingXLSX(file);
        } else if (name.endsWith('.md')) {
            return await this.processShippingMD(file);
        } else {
            throw new Error('Unsupported file type. Please upload CSV, XLSX/XLS, or MD.');
        }
    }

    async processShippingCSV(file) {
        const text = await file.text();
        const rows = this.parseCSV(text);
        const headers = rows.length > 0 ? rows[0] : [];
        const dataRows = rows.slice(1);
        this.lastShippingHeaders = headers;
        this.lastShippingRows = dataRows;
        
        return {
            type: 'CSV',
            name: file.name,
            size: file.size,
            rows: dataRows.length,
            cols: headers.length,
            headers,
            dataRows
        };
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
        
        return {
            type: 'XLSX',
            name: file.name,
            size: file.size,
            rows: dataRows.length,
            cols: headers.length,
            sheet: firstSheetName,
            headers,
            dataRows
        };
    }

    async processShippingMD(file) {
        const text = await file.text();
        return {
            type: 'Markdown',
            name: file.name,
            size: file.size,
            content: text
        };
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

    renderShippingInfo(info) {
        const parts = [
            `<div class="info-item"><strong>File Name:</strong><span>${this.escapeHtml(info.name || '')}</span></div>`,
            `<div class="info-item"><strong>Type:</strong><span>${info.type}</span></div>`
        ];
        if (info.size !== undefined) parts.push(`<div class="info-item"><strong>Size:</strong><span>${(info.size/1024).toFixed(1)} KB</span></div>`);
        if (info.rows !== undefined) parts.push(`<div class="info-item"><strong>Rows:</strong><span>${info.rows}</span></div>`);
        if (info.cols !== undefined) parts.push(`<div class="info-item"><strong>Columns:</strong><span>${info.cols}</span></div>`);
        if (info.sheet) parts.push(`<div class="info-item"><strong>Sheet:</strong><span>${this.escapeHtml(info.sheet)}</span></div>`);
        return parts.join('');
    }

    renderShippingPreviewTable(headers, rows) {
        const maxRows = 30;
        const limitedRows = rows.slice(0, maxRows);
        const thead = `<thead><tr>${headers.map(h => `<th>${this.escapeHtml(String(h))}</th>`).join('')}</tr></thead>`;
        const tbody = `<tbody>${limitedRows.map(r => `<tr>${(r || []).map(c => `<td>${this.escapeHtml(c === undefined ? '' : String(c))}</td>`).join('')}</tr>`).join('')}</tbody>`;
        return `<div class="data-preview"><table>${thead}${tbody}</table></div>`;
    }

    populateShippingMapping(headers) {
        // Populate dropdowns with header names
        const options = headers.map((h, idx) => `<option value="${idx}">${this.escapeHtml(String(h || `Column ${idx+1}`))}</option>`).join('');
        
        // Try to auto-detect common names
        const lower = headers.map(h => String(h || '').toLowerCase());
        const locIdx = lower.findIndex(h => /(loc|location|bin|slot|shelf|rack)/.test(h));
        const volIdx = lower.findIndex(h => /(qty|quantity|volume|ship|units|count)/.test(h));
        
        return {
            locationOptions: options,
            volumeOptions: options,
            itemOptions: `<option value="">${this.currentLanguage === 'ja' ? '未選択' : 'Not set'}</option>` + options,
            autoDetectedLocation: locIdx >= 0 ? String(locIdx) : '',
            autoDetectedVolume: volIdx >= 0 ? String(volIdx) : ''
        };
    }

    updateLocationMappingPreview(locationColumnSelect, locationStartChar, locationEndChar, lastShippingRows) {
        const locIdx = parseInt(locationColumnSelect.value);
        if (isNaN(locIdx) || !Array.isArray(lastShippingRows) || lastShippingRows.length === 0) {
            return '';
        }
        
        const startChar = parseInt(locationStartChar.value) || 1;
        const endChar = parseInt(locationEndChar.value);
        
        // Get first few sample locations to show preview
        const samples = [];
        for (let i = 0; i < Math.min(5, lastShippingRows.length); i++) {
            const row = lastShippingRows[i];
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
        
        if (samples.length > 0) {
            const sample = samples[0];
            return `
                <strong>Preview:</strong> "${sample.original}" → "${sample.mapped}" 
                ${samples.length > 1 ? `<br><small>(${samples.length} samples shown)</small>` : ''}
            `;
        }
        return '';
    }

    applyShippingMapping(locationColumnSelect, volumeColumnSelect, itemColumnSelect, locationStartChar, locationEndChar) {
        const locIdx = parseInt(locationColumnSelect.value);
        const volIdx = parseInt(volumeColumnSelect.value);
        if (isNaN(locIdx) || isNaN(volIdx)) {
            throw new Error('Please select both location and shipping volume columns.');
        }
        if (!Array.isArray(this.lastShippingRows)) {
            throw new Error('No shipping data available. Please import a file.');
        }
        
        // Get location character mapping settings
        const startChar = parseInt(locationStartChar.value) || 1;
        const endChar = parseInt(locationEndChar.value);
        
        // Build aggregation:
        // heatmapData: mappedLoc -> total volume
        // locationItems: mappedLoc -> (itemName -> total volume)
        // locationGroups: mappedLoc -> (fullLoc -> { total, items: Map(itemName -> total) })
        const heatmapData = new Map();
        const locationItems = new Map();
        const locationGroups = new Map();
        const itemIdx = itemColumnSelect && itemColumnSelect.value !== '' ? parseInt(itemColumnSelect.value) : null;
        
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

        return {
            heatmapData,
            locationItems,
            locationGroups
        };
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    setLanguage(language) {
        this.currentLanguage = language;
    }
}

