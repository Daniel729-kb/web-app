/* logimap-layout.js - Layout Management Functions */

// Layout State Management
let layoutState = {
    sidebarCollapsed: false,
    isMobile: window.innerWidth <= 768
};

// Initialize layout functionality
function initializeLayout() {
    setupSidebarToggle();
    setupResponsiveHandlers();
    setupSectionCollapse();
    setupKeyboardNavigation();
    
    // Set initial state
    checkMobileLayout();
}

// Sidebar Toggle Functionality
function setupSidebarToggle() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    const sidebar = document.querySelector('.input-panel');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (toggleBtn && sidebar) {
        toggleBtn.addEventListener('click', toggleSidebar);
    }
    
    if (overlay) {
        overlay.addEventListener('click', closeSidebar);
    }
    
    // Close sidebar when clicking outside on mobile
    document.addEventListener('click', (e) => {
        if (layoutState.isMobile && 
            !sidebar.contains(e.target) && 
            !toggleBtn.contains(e.target) &&
            !sidebar.classList.contains('collapsed')) {
            closeSidebar();
        }
    });
}

function toggleSidebar() {
    const sidebar = document.querySelector('.input-panel');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (!sidebar) return;
    
    layoutState.sidebarCollapsed = !layoutState.sidebarCollapsed;
    
    sidebar.classList.toggle('collapsed', layoutState.sidebarCollapsed);
    
    if (layoutState.isMobile && overlay) {
        overlay.classList.toggle('active', !layoutState.sidebarCollapsed);
    }
    
    // Update toggle button icon
    updateToggleButtonIcon();
    
    // Save state to localStorage
    localStorage.setItem('logimap-sidebar-collapsed', layoutState.sidebarCollapsed);
}

function closeSidebar() {
    const sidebar = document.querySelector('.input-panel');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (!sidebar) return;
    
    layoutState.sidebarCollapsed = true;
    sidebar.classList.add('collapsed');
    
    if (overlay) {
        overlay.classList.remove('active');
    }
    
    updateToggleButtonIcon();
}

function openSidebar() {
    const sidebar = document.querySelector('.input-panel');
    const overlay = document.querySelector('.mobile-overlay');
    
    if (!sidebar) return;
    
    layoutState.sidebarCollapsed = false;
    sidebar.classList.remove('collapsed');
    
    if (layoutState.isMobile && overlay) {
        overlay.classList.add('active');
    }
    
    updateToggleButtonIcon();
}

function updateToggleButtonIcon() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    if (!toggleBtn) return;
    
    toggleBtn.textContent = layoutState.sidebarCollapsed ? '☰' : '✕';
    toggleBtn.setAttribute('aria-label', 
        layoutState.sidebarCollapsed ? 'Open sidebar' : 'Close sidebar'
    );
}

// Responsive Layout Handlers
function setupResponsiveHandlers() {
    window.addEventListener('resize', debounce(handleResize, 250));
    
    // Initial check
    handleResize();
}

function handleResize() {
    const wasMobile = layoutState.isMobile;
    layoutState.isMobile = window.innerWidth <= 768;
    
    if (wasMobile !== layoutState.isMobile) {
        checkMobileLayout();
    }
    
    // Auto-close sidebar on desktop if it was collapsed
    if (!layoutState.isMobile && layoutState.sidebarCollapsed) {
        const sidebar = document.querySelector('.input-panel');
        const overlay = document.querySelector('.mobile-overlay');
        
        if (sidebar) {
            layoutState.sidebarCollapsed = false;
            sidebar.classList.remove('collapsed');
        }
        
        if (overlay) {
            overlay.classList.remove('active');
        }
        
        updateToggleButtonIcon();
    }
}

function checkMobileLayout() {
    const toggleBtn = document.querySelector('.sidebar-toggle');
    
    if (toggleBtn) {
        toggleBtn.style.display = layoutState.isMobile ? 'block' : 'none';
    }
    
    // On mobile, start with sidebar closed
    if (layoutState.isMobile && !layoutState.sidebarCollapsed) {
        closeSidebar();
    }
}

// Section Collapse Functionality
function setupSectionCollapse() {
    const sectionHeaders = document.querySelectorAll('.section__header');
    
    sectionHeaders.forEach(header => {
        header.addEventListener('click', () => {
            const section = header.closest('.section');
            if (section) {
                toggleSection(section);
            }
        });
        
        // Add toggle icon if not present
        if (!header.querySelector('.toggle-icon')) {
            const toggleIcon = document.createElement('span');
            toggleIcon.className = 'toggle-icon';
            toggleIcon.textContent = '▼';
            toggleIcon.style.fontSize = '0.8rem';
            toggleIcon.style.transition = 'transform 0.3s ease';
            header.appendChild(toggleIcon);
        }
    });
}

function toggleSection(section) {
    const isCollapsed = section.classList.contains('collapsed');
    const content = section.querySelector('.section__content');
    const toggleIcon = section.querySelector('.toggle-icon');
    
    if (!content) return;
    
    if (isCollapsed) {
        // Expand
        section.classList.remove('collapsed');
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Reset max-height after animation
        setTimeout(() => {
            content.style.maxHeight = 'none';
        }, 300);
    } else {
        // Collapse
        content.style.maxHeight = content.scrollHeight + 'px';
        
        // Force reflow then collapse
        requestAnimationFrame(() => {
            content.style.maxHeight = '0';
            section.classList.add('collapsed');
        });
    }
    
    // Save collapsed state
    saveSectionStates();
}

function saveSectionStates() {
    const sections = document.querySelectorAll('.section');
    const states = {};
    
    sections.forEach((section, index) => {
        const header = section.querySelector('.section__header span:first-child');
        if (header) {
            const key = header.textContent.trim();
            states[key] = section.classList.contains('collapsed');
        }
    });
    
    localStorage.setItem('logimap-section-states', JSON.stringify(states));
}

function restoreSectionStates() {
    const saved = localStorage.getItem('logimap-section-states');
    if (!saved) return;
    
    try {
        const states = JSON.parse(saved);
        const sections = document.querySelectorAll('.section');
        
        sections.forEach(section => {
            const header = section.querySelector('.section__header span:first-child');
            if (header) {
                const key = header.textContent.trim();
                if (states[key] === true) {
                    section.classList.add('collapsed');
                    const content = section.querySelector('.section__content');
                    if (content) {
                        content.style.maxHeight = '0';
                    }
                }
            }
        });
    } catch (e) {
        console.warn('Failed to restore section states:', e);
    }
}

// Keyboard Navigation
function setupKeyboardNavigation() {
    document.addEventListener('keydown', (e) => {
        // Toggle sidebar with Ctrl/Cmd + B
        if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
            e.preventDefault();
            toggleSidebar();
        }
        
        // Close sidebar with Escape
        if (e.key === 'Escape' && !layoutState.sidebarCollapsed) {
            closeSidebar();
        }
    });
}

// Utility Functions
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Auto-save layout preferences
function saveLayoutPreferences() {
    const preferences = {
        sidebarCollapsed: layoutState.sidebarCollapsed,
        darkMode: document.body.getAttribute('data-theme') === 'dark'
    };
    
    localStorage.setItem('logimap-layout-preferences', JSON.stringify(preferences));
}

function restoreLayoutPreferences() {
    const saved = localStorage.getItem('logimap-layout-preferences');
    if (!saved) return;
    
    try {
        const preferences = JSON.parse(saved);
        
        // Restore sidebar state (only on desktop)
        if (!layoutState.isMobile && preferences.sidebarCollapsed) {
            layoutState.sidebarCollapsed = true;
            const sidebar = document.querySelector('.input-panel');
            if (sidebar) {
                sidebar.classList.add('collapsed');
            }
            updateToggleButtonIcon();
        }
        
        // Restore dark mode
        if (preferences.darkMode) {
            document.body.setAttribute('data-theme', 'dark');
            const themeButton = document.querySelector('.theme-toggle');
            if (themeButton) {
                themeButton.textContent = '☀️ ライトモード';
            }
        }
    } catch (e) {
        console.warn('Failed to restore layout preferences:', e);
    }
}

// Map layout helpers
function optimizeMapLayout() {
    const mapFlow = document.querySelector('.map-flow');
    const locationColumns = document.querySelectorAll('.location-column');
    
    if (!mapFlow || locationColumns.length === 0) return;
    
    // Auto-adjust map flow based on content
    const hasContent = Array.from(locationColumns).some(col => 
        col.children.length > 0
    );
    
    if (!hasContent) {
        showEmptyMapState();
    } else {
        hideEmptyMapState();
        adjustMapSpacing();
    }
}

function showEmptyMapState() {
    const mapDisplay = document.querySelector('.map-display');
    if (!mapDisplay) return;
    
    let emptyState = mapDisplay.querySelector('.map-empty-state');
    
    if (!emptyState) {
        emptyState = document.createElement('div');
        emptyState.className = 'map-empty-state';
        emptyState.innerHTML = `
            <div class="map-empty-state__icon">🗺️</div>
            <div class="map-empty-state__title">Start Building Your Logistics Map</div>
            <div class="map-empty-state__description">
                Add your first facility using the sidebar to begin creating your logistics flow diagram.
            </div>
        `;
        mapDisplay.appendChild(emptyState);
    }
    
    emptyState.style.display = 'flex';
}

function hideEmptyMapState() {
    const emptyState = document.querySelector('.map-empty-state');
    if (emptyState) {
        emptyState.style.display = 'none';
    }
}

function adjustMapSpacing() {
    const mapFlow = document.querySelector('.map-flow');
    const transportContainers = document.querySelectorAll('.transport-arrows-container');
    
    if (!mapFlow) return;
    
    // Auto-adjust spacing based on number of transport routes
    transportContainers.forEach(container => {
        const routeCount = container.children.length;
        if (routeCount > 3) {
            container.style.gap = '0.5rem';
        } else {
            container.style.gap = '1rem';
        }
    });
}

// Focus management for accessibility
function manageFocus() {
    const sidebar = document.querySelector('.input-panel');
    const mapPanel = document.querySelector('.map-panel');
    
    if (!sidebar || !mapPanel) return;
    
    // Trap focus in sidebar when open on mobile
    if (layoutState.isMobile && !layoutState.sidebarCollapsed) {
        trapFocusInElement(sidebar);
    }
}

function trapFocusInElement(element) {
    const focusableElements = element.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length === 0) return;
    
    const firstFocusable = focusableElements[0];
    const lastFocusable = focusableElements[focusableElements.length - 1];
    
    element.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
            if (e.shiftKey) {
                if (document.activeElement === firstFocusable) {
                    e.preventDefault();
                    lastFocusable.focus();
                }
            } else {
                if (document.activeElement === lastFocusable) {
                    e.preventDefault();
                    firstFocusable.focus();
                }
            }
        }
    });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    initializeLayout();
    restoreLayoutPreferences();
    restoreSectionStates();
    optimizeMapLayout();
    
    // Set up auto-save
    window.addEventListener('beforeunload', saveLayoutPreferences);
    
    // Watch for map changes
    const observer = new MutationObserver(optimizeMapLayout);
    const mapFlow = document.querySelector('.map-flow');
    if (mapFlow) {
        observer.observe(mapFlow, { childList: true, subtree: true });
    }
});

// Export functions for use by other scripts
window.layoutManager = {
    toggleSidebar,
    closeSidebar,
    openSidebar,
    toggleSection,
    optimizeMapLayout,
    manageFocus
};
