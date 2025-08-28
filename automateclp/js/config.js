// config.js - Application Configuration and Constants

const CONFIG = {
    // Container dimensions (in cm)
    CONTAINERS: {
        '20ft': { length: 589.8, width: 235.2, name: '20ft コンテナ' },
        '40ft': { length: 1203.2, width: 235.0, name: '40ft コンテナ' },
        '40ftHC': { length: 1203.2, width: 269.0, name: '40ft ハイキューブ' }
    },

    // Rendering constants
    RENDER: {
        CONTAINER_OFFSET_X: 25,
        CONTAINER_OFFSET_Y: 35,
        CONTAINER_DISPLAY_WIDTH: 800,
        CONTAINER_DISPLAY_HEIGHT: 300,
        MIN_DRAG_MARGIN: 10,
        EPSILON: 0.01,
        ANIMATION_DELAY: 500
    },

    // Algorithm settings
    ALGORITHM: {
        GRID_STEP: 5,           // Grid search step size
        MAX_ITERATIONS: 1000,   // Maximum iterations for placement
        OPTIMIZATION_LEVEL: 2,  // 1: Basic, 2: Advanced, 3: Expert
        ROTATION_ENABLED: true, // Enable pallet rotation
        CLEARANCE_DEFAULT: 5    // Default clearance in cm
    },

    // UI settings
    UI: {
        NOTIFICATION_TIMEOUT: 5000,
        MAX_PALLET_TYPES: 10,
        MAX_PALLET_QUANTITY: 100,
        MAX_PALLET_DIMENSION: 1000
    },

    // Performance settings
    PERFORMANCE: {
        MEMORY_CLEANUP_INTERVAL: 3 * 60 * 1000, // 3 minutes
        MAX_PALLETS_IN_MEMORY: 1000,
        BATCH_SIZE: 50
    }
};

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CONFIG;
}