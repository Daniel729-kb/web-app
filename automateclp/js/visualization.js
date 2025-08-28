// visualization.js - Container Loading Visualization

class ContainerVisualization {
    constructor() {
        this.workArea = null;
        this.containerFloor = null;
        this.renderConfig = {
            scale: 1,
            containerOffset: { x: CONFIG.RENDER.CONTAINER_OFFSET_X, y: CONFIG.RENDER.CONTAINER_OFFSET_Y },
            containerBounds: null
        };
        this.isDragListenerAttached = false;
        this.activePalletEl = null;
        this.initialMouseX = 0;
        this.initialMouseY = 0;
    }

    // Initialize visualization
    init() {
        this.workArea = document.getElementById('workArea');
        this.containerFloor = document.getElementById('containerFloor');
        
        if (!this.workArea || !this.containerFloor) {
            console.error('Required DOM elements not found');
            return;
        }

        this.setupContainer();
        console.log('Visualization initialized');
    }

    // Setup container display
    setupContainer() {
        const container = CONFIG.CONTAINERS['40ft']; // Default container
        this.updateContainerDisplay(container);
    }

    // Update container display based on selected container type
    updateContainerDisplay(container) {
        this.renderConfig.scale = this.calculateScale(container);
        
        const actualDisplayWidth = container.length * this.renderConfig.scale;
        const actualDisplayHeight = container.width * this.renderConfig.scale;
        
        // Update container floor dimensions
        this.containerFloor.style.width = `${actualDisplayWidth}px`;
        this.containerFloor.style.height = `${actualDisplayHeight}px`;
        this.containerFloor.style.left = `${CONFIG.RENDER.CONTAINER_OFFSET_X}px`;
        this.containerFloor.style.top = `${CONFIG.RENDER.CONTAINER_OFFSET_Y}px`;
        
        // Update work area size
        this.workArea.style.width = `${actualDisplayWidth + CONFIG.RENDER.CONTAINER_OFFSET_X + 50}px`;
        this.workArea.style.height = `${Math.max(actualDisplayHeight + CONFIG.RENDER.CONTAINER_OFFSET_Y + 100, 500)}px`;
        
        // Save container bounds
        this.renderConfig.containerBounds = {
            left: CONFIG.RENDER.CONTAINER_OFFSET_X,
            top: CONFIG.RENDER.CONTAINER_OFFSET_Y,
            width: actualDisplayWidth,
            height: actualDisplayHeight
        };
    }

    // Calculate scale for rendering
    calculateScale(container) {
        const scaleX = CONFIG.RENDER.CONTAINER_DISPLAY_WIDTH / container.length;
        const scaleY = CONFIG.RENDER.CONTAINER_DISPLAY_HEIGHT / container.width;
        return Math.min(scaleX, scaleY);
    }

    // Render all pallets
    renderPallets(pallets, container) {
        // Clear existing pallets
        this.clearPallets();
        
        // Update container display
        this.updateContainerDisplay(container);
        
        // Render each pallet
        pallets.forEach(pallet => {
            if (!pallet.deleted) {
                this.renderPallet(pallet);
            }
        });
        
        // Enable drag and drop
        this.enableDragAndDrop();
        
        console.log(`Rendered ${pallets.filter(p => !p.deleted).length} pallets`);
    }

    // Render individual pallet
    renderPallet(pallet) {
        const palletEl = Utils.dom.createElement('div', 'pallet-2d');
        palletEl.dataset.palletId = pallet.id;
        palletEl.dataset.instance = pallet.instance;
        
        // Set pallet dimensions and position
        const palletWidth = pallet.finalLength * this.renderConfig.scale;
        const palletHeight = pallet.finalWidth * this.renderConfig.scale;
        const palletLeft = (pallet.x * this.renderConfig.scale) + CONFIG.RENDER.CONTAINER_OFFSET_X;
        const palletTop = (pallet.y * this.renderConfig.scale) + CONFIG.RENDER.CONTAINER_OFFSET_Y;
        
        Object.assign(palletEl.style, {
            width: `${palletWidth}px`,
            height: `${palletHeight}px`,
            left: `${palletLeft}px`,
            top: `${palletTop}px`,
            background: pallet.color,
            position: 'absolute'
        });
        
        // Add rotated pattern if applicable
        if (pallet.rotated) {
            palletEl.style.background = `repeating-linear-gradient(45deg, ${pallet.color}, ${pallet.color} 10px, ${Utils.colors.adjustColor(pallet.color, -20)} 10px, ${Utils.colors.adjustColor(pallet.color, -20)} 20px)`;
        }
        
        // Add pallet content
        palletEl.innerHTML = `
            <div class="pallet-label">${pallet.finalLength}×${pallet.finalWidth}${pallet.rotated ? ' ↻' : ''}</div>
            <div class="pallet-controls">
                <button class="rotate-btn" title="回転">↻</button>
                <button class="delete-btn" title="削除">✕</button>
            </div>
        `;
        
        // Add state classes
        this.updatePalletVisualState(palletEl, pallet, container);
        
        // Add to work area
        this.workArea.appendChild(palletEl);
    }

    // Update pallet visual state
    updatePalletVisualState(palletEl, pallet, container) {
        const isOutside = this.isOutsideContainer(pallet, container);
        const isBottomPlaced = pallet.y > container.width;
        
        Utils.dom.removeClass(palletEl, 'outside-container bottom-placed');
        
        if (isBottomPlaced) {
            Utils.dom.addClass(palletEl, 'bottom-placed');
        } else if (isOutside) {
            Utils.dom.addClass(palletEl, 'outside-container');
        }
    }

    // Check if pallet is outside container
    isOutsideContainer(pallet, container) {
        return pallet.x < 0 || pallet.y < 0 ||
               pallet.x + pallet.finalLength > container.length ||
               pallet.y + pallet.finalWidth > container.width;
    }

    // Clear all pallets
    clearPallets() {
        const existingPallets = this.workArea.querySelectorAll('.pallet-2d');
        existingPallets.forEach(el => el.remove());
    }

    // Enable drag and drop functionality
    enableDragAndDrop() {
        if (this.isDragListenerAttached) return;
        
        this.workArea.addEventListener('mousedown', this.handleMouseDown.bind(this));
        this.isDragListenerAttached = true;
        
        console.log('Drag and drop enabled');
    }

    // Handle mouse down events
    handleMouseDown(e) {
        const target = e.target;
        
        if (target.classList.contains('rotate-btn')) {
            e.stopPropagation();
            this.rotatePallet(target.closest('.pallet-2d'));
        } else if (target.classList.contains('delete-btn')) {
            e.stopPropagation();
            this.deletePallet(target.closest('.pallet-2d'));
        } else {
            const palletEl = target.classList.contains('pallet-2d') ? target : target.closest('.pallet-2d');
            if (palletEl) {
                this.dragStart(e, palletEl);
            }
        }
    }

    // Start dragging
    dragStart(e, palletEl) {
        e.preventDefault();
        this.activePalletEl = palletEl;
        Utils.dom.addClass(this.activePalletEl, 'dragging');
        
        const palletRect = this.activePalletEl.getBoundingClientRect();
        const workAreaRect = this.workArea.getBoundingClientRect();
        
        this.initialMouseX = e.clientX - palletRect.left;
        this.initialMouseY = e.clientY - palletRect.top;
        
        document.addEventListener('mousemove', this.drag.bind(this));
        document.addEventListener('mouseup', this.dragEnd.bind(this));
    }

    // Handle dragging
    drag(e) {
        if (!this.activePalletEl) return;
        e.preventDefault();
        
        const workAreaRect = this.workArea.getBoundingClientRect();
        let newLeft = e.clientX - workAreaRect.left - this.initialMouseX;
        let newTop = e.clientY - workAreaRect.top - this.initialMouseY;
        
        // Constrain to work area
        newLeft = Utils.math.clamp(
            newLeft, 
            CONFIG.RENDER.MIN_DRAG_MARGIN, 
            this.workArea.clientWidth - this.activePalletEl.clientWidth - CONFIG.RENDER.MIN_DRAG_MARGIN
        );
        newTop = Utils.math.clamp(
            newTop, 
            CONFIG.RENDER.MIN_DRAG_MARGIN, 
            this.workArea.clientHeight - this.activePalletEl.clientHeight - CONFIG.RENDER.MIN_DRAG_MARGIN
        );
        
        this.activePalletEl.style.left = `${newLeft}px`;
        this.activePalletEl.style.top = `${newTop}px`;
        
        // Update pallet status
        this.updatePalletStatus(this.activePalletEl);
    }

    // End dragging
    dragEnd() {
        if (!this.activePalletEl) return;
        
        Utils.dom.removeClass(this.activePalletEl, 'dragging');
        
        // Update pallet model
        this.updatePalletModel(this.activePalletEl);
        
        // Remove event listeners
        document.removeEventListener('mousemove', this.drag.bind(this));
        document.removeEventListener('mouseup', this.dragEnd.bind(this));
        
        this.activePalletEl = null;
    }

    // Rotate pallet
    rotatePallet(palletEl) {
        if (!palletEl) return;
        
        const palletId = parseInt(palletEl.dataset.palletId);
        const instance = parseInt(palletEl.dataset.instance);
        
        // Emit rotation event
        const event = new CustomEvent('palletRotated', {
            detail: { palletId, instance }
        });
        document.dispatchEvent(event);
    }

    // Delete pallet
    deletePallet(palletEl) {
        if (!palletEl) return;
        
        const palletId = parseInt(palletEl.dataset.palletId);
        const instance = parseInt(palletEl.dataset.instance);
        
        // Emit deletion event
        const event = new CustomEvent('palletDeleted', {
            detail: { palletId, instance }
        });
        document.dispatchEvent(event);
        
        // Remove from DOM
        palletEl.remove();
    }

    // Update pallet status (collision detection, etc.)
    updatePalletStatus(palletEl) {
        const palletId = parseInt(palletEl.dataset.palletId);
        const instance = parseInt(palletEl.dataset.instance);
        
        // Emit status update event
        const event = new CustomEvent('palletStatusUpdated', {
            detail: { palletId, instance }
        });
        document.dispatchEvent(event);
    }

    // Update pallet model with new position
    updatePalletModel(palletEl) {
        const palletId = parseInt(palletEl.dataset.palletId);
        const instance = parseInt(palletEl.dataset.instance);
        
        const x = (parseFloat(palletEl.style.left) - CONFIG.RENDER.CONTAINER_OFFSET_X) / this.renderConfig.scale;
        const y = (parseFloat(palletEl.style.top) - CONFIG.RENDER.CONTAINER_OFFSET_Y) / this.renderConfig.scale;
        
        // Emit position update event
        const event = new CustomEvent('palletPositionUpdated', {
            detail: { palletId, instance, x, y }
        });
        document.dispatchEvent(event);
    }

    // Update legend
    updateLegend(pallets) {
        const legend = document.getElementById('legend');
        if (!legend) return;
        
        legend.innerHTML = '';
        
        if (pallets.length === 0) {
            legend.style.display = 'none';
            return;
        }
        
        pallets.forEach(p => {
            const legendItem = Utils.dom.createElement('div', 'legend-item');
            legendItem.innerHTML = `
                <div class="legend-color" style="background:${p.color};"></div>
                <span>${p.length}×${p.width}cm (${p.qty}個)</span>
            `;
            legend.appendChild(legendItem);
        });
        
        legend.style.display = 'flex';
    }

    // Update statistics display
    updateStats(stats) {
        const elements = {
            inputPallets: document.getElementById('inputPallets'),
            visiblePallets: document.getElementById('visiblePallets'),
            loadedPallets: document.getElementById('loadedPallets'),
            loadingRate: document.getElementById('loadingRate'),
            efficiency: document.getElementById('efficiency'),
            remainingArea: document.getElementById('remainingArea')
        };
        
        if (elements.inputPallets) elements.inputPallets.textContent = stats.totalPallets || 0;
        if (elements.visiblePallets) elements.visiblePallets.textContent = stats.visiblePallets || 0;
        if (elements.loadedPallets) elements.loadedPallets.textContent = stats.loadedPallets || 0;
        if (elements.loadingRate) elements.loadingRate.textContent = `${stats.loadingRate || 0}%`;
        if (elements.efficiency) elements.efficiency.textContent = `${stats.efficiency || 0}%`;
        if (elements.remainingArea) elements.remainingArea.textContent = `${stats.remainingArea || 0}m²`;
        
        // Show stats container
        const statsContainer = document.getElementById('stats');
        if (statsContainer) {
            statsContainer.style.display = 'grid';
        }
    }

    // Export layout as image
    exportLayoutAsImage() {
        const vizArea = document.querySelector('.visualization');
        if (!vizArea) return;
        
        // Hide export button temporarily
        const exportBtn = document.getElementById('exportBtn');
        if (exportBtn) exportBtn.style.visibility = 'hidden';
        
        // Show success message
        this.showNotification('🖼️ 画像を生成中です...', 'success');
        
        html2canvas(vizArea, { 
            scale: 2, 
            useCORS: true, 
            backgroundColor: '#ffffff' 
        }).then(canvas => {
            const link = document.createElement('a');
            link.download = `container-loading-plan-${Utils.date.formatDate(new Date())}.png`;
            link.href = canvas.toDataURL('image/png');
            link.click();
            
            // Restore export button
            if (exportBtn) exportBtn.style.visibility = 'visible';
            
            this.showNotification('画像のエクスポートが完了しました', 'success');
        }).catch(err => {
            console.error('Image export failed:', err);
            this.showNotification('画像の生成に失敗しました', 'error');
            
            // Restore export button
            if (exportBtn) exportBtn.style.visibility = 'visible';
        });
    }

    // Show notification
    showNotification(message, type = 'info') {
        const container = document.getElementById('notificationContainer');
        if (!container) return;
        
        const notification = Utils.dom.createElement('div', `notification ${type}`);
        notification.textContent = message;
        
        container.appendChild(notification);
        
        // Auto-remove after timeout
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, CONFIG.UI.NOTIFICATION_TIMEOUT);
    }

    // Get current scale
    getScale() {
        return this.renderConfig.scale;
    }

    // Get container bounds
    getContainerBounds() {
        return this.renderConfig.containerBounds;
    }

    // Cleanup
    cleanup() {
        if (this.isDragListenerAttached) {
            this.workArea.removeEventListener('mousedown', this.handleMouseDown.bind(this));
            this.isDragListenerAttached = false;
        }
        
        document.removeEventListener('mousemove', this.drag.bind(this));
        document.removeEventListener('mouseup', this.dragEnd.bind(this));
        
        console.log('Visualization cleaned up');
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ContainerVisualization;
}