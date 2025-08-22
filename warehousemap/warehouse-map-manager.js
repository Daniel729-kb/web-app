// =================================================================
// MEMORY LEAK FIXES FOR WAREHOUSE MAP COMPONENT
// =================================================================

// 1. CREATE A COMPONENT MANAGER CLASS
class WarehouseMapManager {
    constructor() {
        this.map = null;
        this.warehouseMarkers = [];
        this.eventListeners = [];
        this.timers = [];
        this.observers = [];
        this.isDestroyed = false;
        
        // Bind methods to preserve context
        this.updateVisibleWarehouses = this.updateVisibleWarehouses.bind(this);
        this.handleResize = this.handleResize.bind(this);
        this.handleBeforeUnload = this.handleBeforeUnload.bind(this);
    }

    // 2. IMPROVED INITIALIZATION WITH CLEANUP TRACKING
    initMap() {
        // Clean up any existing map first
        this.cleanup();
        
        try {
            this.map = L.map('map').setView([20, 0], 2);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);

            // Track map events for cleanup
            this.addEventListenerTracked(this.map, 'moveend', this.updateVisibleWarehouses);
            this.addEventListenerTracked(this.map, 'zoomend', this.updateVisibleWarehouses);
            
            // Track window events
            this.addEventListenerTracked(window, 'resize', this.handleResize);
            this.addEventListenerTracked(window, 'beforeunload', this.handleBeforeUnload);
            
            console.log('Map initialized successfully');
        } catch (error) {
            console.error('Failed to initialize map:', error);
            this.cleanup();
        }
    }

    // 3. TRACKED EVENT LISTENER MANAGEMENT
    addEventListenerTracked(target, event, handler, options = false) {
        if (this.isDestroyed) return;
        
        target.addEventListener(event, handler, options);
        this.eventListeners.push({
            target,
            event,
            handler,
            options
        });
    }

    // 4. TIMER MANAGEMENT WITH CLEANUP
    setTimeoutTracked(callback, delay) {
        if (this.isDestroyed) return null;
        
        const timerId = setTimeout(() => {
            // Remove from tracking array when executed
            this.timers = this.timers.filter(id => id !== timerId);
            if (!this.isDestroyed) {
                callback();
            }
        }, delay);
        
        this.timers.push(timerId);
        return timerId;
    }

    setIntervalTracked(callback, interval) {
        if (this.isDestroyed) return null;
        
        const timerId = setInterval(() => {
            if (!this.isDestroyed) {
                callback();
            }
        }, interval);
        
        this.timers.push(timerId);
        return timerId;
    }

    // 5. IMPROVED MARKER CREATION WITH MEMORY MANAGEMENT
    createWarehouseMarkers(warehouseData) {
        // Clear existing markers first
        this.clearMarkers();
        
        if (!this.map || this.isDestroyed) return;
        
        warehouseData.forEach((warehouse, index) => {
            try {
                const [lat, lng] = this.getCoordinates(warehouse);
                const isEstimated = !warehouse.Latitude || !warehouse.Longitude || 
                                  warehouse.Latitude === 0 || warehouse.Longitude === 0;
                
                const totalArea = warehouse["Warehouse floor space (m2)"] || 0;
                const availableArea = warehouse["Available storage space (m2)"] || 0;
                const usageRate = totalArea > 0 ? ((totalArea - availableArea) / totalArea) * 100 : 0;
                
                const color = this.getUsageColor(usageRate);
                
                const marker = L.circleMarker([lat, lng], {
                    radius: Math.max(5, Math.min(15, Math.sqrt(totalArea / 1000))),
                    fillColor: color,
                    color: isEstimated ? '#ffd43b' : '#fff',
                    weight: isEstimated ? 3 : 2,
                    opacity: 1,
                    fillOpacity: isEstimated ? 0.7 : 0.8
                });
                
                // Store minimal data reference (avoid circular references)
                marker.warehouseData = {
                    id: warehouse["Warehouse name"] || `warehouse_${index}`,
                    name: warehouse["Warehouse name"],
                    city: warehouse.City,
                    country: warehouse.Country,
                    totalArea,
                    availableArea,
                    coordinates: [lat, lng]
                };
                
                // Add to map and track
                marker.addTo(this.map);
                this.warehouseMarkers.push(marker);
                
                // Create popup content without storing large objects
                const popupContent = this.createPopupContent(marker.warehouseData, isEstimated, usageRate);
                marker.bindPopup(popupContent, { 
                    maxWidth: 300,
                    closeOnClick: true,
                    autoClose: true
                });
                
            } catch (error) {
                console.warn(`Failed to create marker for warehouse ${index}:`, error);
            }
        });
        
        console.log(`Created ${this.warehouseMarkers.length} warehouse markers`);
    }

    // 6. MARKER CLEANUP
    clearMarkers() {
        this.warehouseMarkers.forEach(marker => {
            try {
                // Clear popup content
                if (marker.getPopup()) {
                    marker.unbindPopup();
                }
                
                // Remove from map
                if (this.map && marker._map) {
                    this.map.removeLayer(marker);
                }
                
                // Clear data references
                marker.warehouseData = null;
            } catch (error) {
                console.warn('Error removing marker:', error);
            }
        });
        
        this.warehouseMarkers = [];
    }

    // 7. OPTIMIZED VISIBLE WAREHOUSES UPDATE
    updateVisibleWarehouses() {
        if (!this.map || this.isDestroyed) return;
        
        // Debounce this operation to prevent excessive calls
        clearTimeout(this._updateTimeout);
        this._updateTimeout = this.setTimeoutTracked(() => {
            try {
                const bounds = this.map.getBounds();
                const visibleMarkers = this.warehouseMarkers.filter(marker => {
                    return marker.warehouseData && 
                           bounds.contains(marker.warehouseData.coordinates);
                });
                
                // Update UI with minimal data
                this.displayWarehouseList(visibleMarkers.map(m => m.warehouseData));
            } catch (error) {
                console.warn('Error updating visible warehouses:', error);
            }
        }, 250);
    }

    // 8. MEMORY-EFFICIENT POPUP CREATION
    createPopupContent(warehouseData, isEstimated, usageRate) {
        const div = document.createElement('div');
        div.className = 'warehouse-popup';
        
        const coordinateInfo = isEstimated ? 
            '<div style="color: #f76707; font-size: 12px; margin-bottom: 5px;">📍 推定座標</div>' :
            '<div style="color: #51cf66; font-size: 12px; margin-bottom: 5px;">📍 GPS座標</div>';
        
        div.innerHTML = `
            ${coordinateInfo}
            <div class="popup-header">${warehouseData.name || 'Unknown'}</div>
            <div class="popup-detail">
                <span>🏙️ 場所:</span> <span>${warehouseData.city}, ${warehouseData.country}</span>
            </div>
            <div class="popup-detail">
                <span>🏢 全体面積:</span> <strong>${warehouseData.totalArea.toLocaleString()} m²</strong>
            </div>
            <div class="popup-detail">
                <span>📦 販売可能:</span> <strong>${warehouseData.availableArea.toLocaleString()} m²</strong>
            </div>
            <div class="popup-detail">
                <span>📊 使用率:</span> <strong>${Math.round(usageRate)}%</strong>
            </div>
        `;
        
        return div;
    }

    // 9. RESIZE HANDLER WITH DEBOUNCING
    handleResize() {
        if (!this.map || this.isDestroyed) return;
        
        clearTimeout(this._resizeTimeout);
        this._resizeTimeout = this.setTimeoutTracked(() => {
            try {
                this.map.invalidateSize();
            } catch (error) {
                console.warn('Error handling resize:', error);
            }
        }, 250);
    }

    // 10. BEFOREUNLOAD HANDLER
    handleBeforeUnload() {
        this.cleanup();
    }

    // 11. COMPREHENSIVE CLEANUP METHOD
    cleanup() {
        console.log('Starting warehouse map cleanup...');
        this.isDestroyed = true;
        
        // Clear all timers
        this.timers.forEach(timerId => {
            clearTimeout(timerId);
            clearInterval(timerId);
        });
        this.timers = [];
        
        // Remove all event listeners
        this.eventListeners.forEach(({ target, event, handler, options }) => {
            try {
                target.removeEventListener(event, handler, options);
            } catch (error) {
                console.warn('Error removing event listener:', error);
            }
        });
        this.eventListeners = [];
        
        // Clear markers
        this.clearMarkers();
        
        // Destroy map instance
        if (this.map) {
            try {
                this.map.remove();
                this.map = null;
            } catch (error) {
                console.warn('Error destroying map:', error);
            }
        }
        
        // Clear observers
        this.observers.forEach(observer => {
            try {
                observer.disconnect();
            } catch (error) {
                console.warn('Error disconnecting observer:', error);
            }
        });
        this.observers = [];
        
        console.log('Warehouse map cleanup completed');
    }

    // 12. UTILITY METHODS
    getUsageColor(usageRate) {
        if (usageRate >= 80) return '#22c55e';
        if (usageRate >= 60) return '#84cc16';
        if (usageRate >= 40) return '#eab308';
        if (usageRate >= 20) return '#f97316';
        return '#ef4444';
    }

    getCoordinates(warehouse) {
        // Implement your coordinate logic here
        // Return [lat, lng] array
        return [warehouse.Latitude || 0, warehouse.Longitude || 0];
    }

    displayWarehouseList(warehouseData) {
        // Implement your list display logic here
        console.log(`Displaying ${warehouseData.length} warehouses`);
    }
}

// =================================================================
// USAGE EXAMPLE
// =================================================================

// Global manager instance
let warehouseMapManager = null;

// Initialize the warehouse map
function initializeWarehouseMap() {
    // Clean up existing instance
    if (warehouseMapManager) {
        warehouseMapManager.cleanup();
    }
    
    warehouseMapManager = new WarehouseMapManager();
    warehouseMapManager.initMap();
}

// Clean up when leaving page
function cleanupWarehouseMap() {
    if (warehouseMapManager) {
        warehouseMapManager.cleanup();
        warehouseMapManager = null;
    }
}

// Export for use in your application
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { WarehouseMapManager, initializeWarehouseMap, cleanupWarehouseMap };
}