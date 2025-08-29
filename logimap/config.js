// LogiMap Configuration File
// Centralized configuration for better maintainability

const LogiMapConfig = {
    // Application Settings
    app: {
        version: '2.0.0',
        name: 'LogiMap - Logistics Map Generator',
        debugMode: false,
        autoSaveInterval: 30000, // 30 seconds
        maxFacilities: 50,
        maxTransportRoutes: 100
    },

    // Performance Settings
    performance: {
        debounceDelay: 300,
        animationDuration: 300,
        maxUndoStates: 50,
        enableCaching: true,
        lazyLoadThreshold: 20
    },

    // UI Settings
    ui: {
        defaultTheme: 'light',
        defaultLanguage: 'ja',
        enableAnimations: true,
        showTooltips: true,
        compactMode: false
    },

    // Map Visualization Settings
    map: {
        defaultZoom: 1,
        minZoom: 0.5,
        maxZoom: 3,
        gridSize: 150,
        connectionStyle: 'curved', // 'straight', 'curved', 'stepped'
        showGrid: false,
        snapToGrid: true
    },

    // Facility Types Configuration
    facilityTypes: {
        1: {
            name: 'Supplier',
            defaultIcon: '🏭',
            color: '#3B82F6',
            allowedConnections: [2, 3, 4, 5]
        },
        2: {
            name: 'Manufacturer',
            defaultIcon: '🏢',
            color: '#10B981',
            allowedConnections: [1, 3, 4, 5]
        },
        3: {
            name: 'Warehouse',
            defaultIcon: '🏪',
            color: '#F59E0B',
            allowedConnections: [1, 2, 4, 5]
        },
        4: {
            name: 'Distribution Center',
            defaultIcon: '🏛️',
            color: '#EF4444',
            allowedConnections: [1, 2, 3, 5]
        },
        5: {
            name: 'Retail/Customer',
            defaultIcon: '🏬',
            color: '#8B5CF6',
            allowedConnections: [1, 2, 3, 4]
        }
    },

    // Transport Modes Configuration
    transportModes: {
        truck: {
            icon: '🚛',
            name: 'Truck',
            speed: 60, // km/h average
            costPerKm: 2.5,
            co2PerKm: 0.12
        },
        ship: {
            icon: '🚢',
            name: 'Ship',
            speed: 30,
            costPerKm: 0.5,
            co2PerKm: 0.03
        },
        air: {
            icon: '✈️',
            name: 'Air',
            speed: 800,
            costPerKm: 10,
            co2PerKm: 0.5
        },
        rail: {
            icon: '🚆',
            name: 'Rail',
            speed: 80,
            costPerKm: 1.5,
            co2PerKm: 0.05
        }
    },

    // Validation Rules
    validation: {
        facilityName: {
            minLength: 1,
            maxLength: 100,
            required: true
        },
        country: {
            minLength: 2,
            maxLength: 50,
            required: false
        },
        city: {
            minLength: 2,
            maxLength: 50,
            required: false
        },
        temperature: {
            min: -50,
            max: 50,
            unit: '°C'
        },
        humidity: {
            min: 0,
            max: 100,
            unit: '%'
        }
    },

    // Export Settings
    export: {
        image: {
            format: 'png',
            quality: 0.95,
            backgroundColor: '#ffffff',
            padding: 20
        },
        csv: {
            delimiter: ',',
            encoding: 'UTF-8',
            includeHeaders: true
        }
    },

    // API Endpoints (for future use)
    api: {
        baseUrl: '',
        endpoints: {
            saveFacility: '/api/facilities',
            loadFacilities: '/api/facilities',
            saveTransport: '/api/transport',
            loadTransport: '/api/transport',
            geocoding: '/api/geocode'
        }
    },

    // Feature Flags
    features: {
        enableRealTimeCollaboration: false,
        enableAdvancedAnalytics: false,
        enableAIOptimization: false,
        enableCustomIcons: true,
        enableBulkOperations: true,
        enableVersionControl: false
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(LogiMapConfig);
Object.freeze(LogiMapConfig.app);
Object.freeze(LogiMapConfig.performance);
Object.freeze(LogiMapConfig.ui);
Object.freeze(LogiMapConfig.map);
Object.freeze(LogiMapConfig.facilityTypes);
Object.freeze(LogiMapConfig.transportModes);
Object.freeze(LogiMapConfig.validation);
Object.freeze(LogiMapConfig.export);
Object.freeze(LogiMapConfig.api);
Object.freeze(LogiMapConfig.features);

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = LogiMapConfig;
}