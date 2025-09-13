// Heatmap Generator - Handles heatmap creation and display
class HeatmapGenerator {
    constructor() {
        this.currentHeatmapData = null;
        this.currentLocationItems = null;
        this.currentLocationGroups = null;
        this.currentHeatmapOptions = null;
    }

    generateHeatmap(layoutProcessor, shippingData, options = {}) {
        if (!layoutProcessor || !layoutProcessor.currentSheetData) {
            throw new Error('No layout data available. Please import a layout first.');
        }

        if (!shippingData || !shippingData.heatmapData) {
            throw new Error('No shipping data available. Please import shipping data first.');
        }

        // Store the data for later use
        this.currentHeatmapData = shippingData.heatmapData;
        this.currentLocationItems = shippingData.locationItems;
        this.currentLocationGroups = shippingData.locationGroups;
        this.currentHeatmapOptions = options;

        // Generate SVG with heatmap overlay
        const svg = layoutProcessor.generateSVGWithHeatmap(shippingData.heatmapData, options);
        
        if (!svg) {
            throw new Error('Failed to generate heatmap SVG.');
        }

        return svg;
    }

    bindHeatmapClickHandlers(heatmapSvgDisplay) {
        const svgRoot = heatmapSvgDisplay.querySelector('svg');
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
        html += `<p><strong>Location:</strong> ${this.escapeHtml(location)}</p>`;
        html += `<p><strong>Total Volume:</strong> ${Number(total).toLocaleString()}</p>`;
        
        if (groups && groups.size > 0) {
            html += `<p><strong>By Full Location:</strong></p>`;
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
            html += `<p><strong>Items:</strong></p>`;
            html += '<ul>';
            const sorted = Array.from(itemsMap.entries()).sort((a,b) => b[1]-a[1]);
            for (const [name, qty] of sorted) {
                html += `<li>${this.escapeHtml(name)}: ${Number(qty).toLocaleString()}</li>`;
            }
            html += '</ul>';
        } else {
            html += `<p class="muted">No detailed data available.</p>`;
        }
        
        return html;
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
        
        return `
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

    getHeatmapLegend() {
        return `
            <div class="legend-items">
                <div class="legend-item">
                    <div class="legend-color heat-0"></div>
                    <span>No activity (0%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-1"></div>
                    <span>Very low (bottom 5%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-2"></div>
                    <span>Low (5-10%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-3"></div>
                    <span>Low-medium (10-15%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-4"></div>
                    <span>Medium-low (15-20%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-5"></div>
                    <span>Medium (20-30%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-6"></div>
                    <span>Medium-high (30-40%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-7"></div>
                    <span>High (40-50%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-8"></div>
                    <span>Very high (50-60%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-9"></div>
                    <span>Extremely high (60-70%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-10"></div>
                    <span>Maximum-high (70-80%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-11"></div>
                    <span>Critical (80-90%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-12"></div>
                    <span>Maximum (90-95%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-13"></div>
                    <span>Peak (95-98%)</span>
                </div>
                <div class="legend-item">
                    <div class="legend-color heat-14"></div>
                    <span>Extreme (top 2%)</span>
                </div>
            </div>
            <div class="legend-note">
                <p><em>💡 Tip: Hover over cells to see exact activity values. The scale automatically adapts to your data range for optimal visualization.</em></p>
            </div>
        `;
    }

    downloadHeatmap(svgContent, filename = 'warehouse-heatmap.svg') {
        if (!svgContent) {
            throw new Error('No heatmap SVG to download.');
        }
        
        const blob = new Blob([svgContent], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    getCurrentHeatmapData() {
        return this.currentHeatmapData;
    }

    getCurrentLocationItems() {
        return this.currentLocationItems;
    }

    getCurrentLocationGroups() {
        return this.currentLocationGroups;
    }
}

