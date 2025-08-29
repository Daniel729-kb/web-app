// Palletizar Configuration File
// All configuration constants in one place for easy maintenance

const PalletizerConfig = {
    // Debug mode - set to false for production
    DEBUG_MODE: false,
    
    // Physical constraints
    constraints: {
        MAX_PALLET_WEIGHT: 1000, // kg
        PALLET_BASE_HEIGHT: 14, // cm
        DEFAULT_HEIGHT_LIMIT: 158, // cm (including pallet base)
        MIN_HEIGHT_LIMIT: 50, // cm
        MAX_HEIGHT_LIMIT: 250, // cm
        MAX_CARTON_WEIGHT: 50, // kg per carton
        MIN_CARTON_DIMENSION: 1, // cm
        MAX_CARTON_DIMENSION: 200 // cm
    },
    
    // Pallet sizes configuration
    palletSizes: [
        { 
            name: '1100×1000', 
            width: 110.0, 
            depth: 100.0, 
            description: '標準パレット',
            maxWeight: 1000
        },
        { 
            name: '1100×1100', 
            width: 110.0, 
            depth: 110.0, 
            description: '正方形パレット',
            maxWeight: 1000
        },
        { 
            name: '1200×1000', 
            width: 120.0, 
            depth: 100.0, 
            description: '大型パレット',
            maxWeight: 1200
        },
        { 
            name: '1200×1100', 
            width: 120.0, 
            depth: 110.0, 
            description: '特大パレット',
            maxWeight: 1200
        }
    ],
    
    // Performance settings
    performance: {
        MEMORY_CLEANUP_INTERVAL: 300000, // 5 minutes in ms
        CACHE_SIZE_LIMIT: 100, // Maximum cached calculations
        DEBOUNCE_DELAY: 300, // ms
        MAX_CALCULATION_TIME: 5000, // ms before showing warning
        MAX_CARTONS_PER_BATCH: 100, // For performance optimization
        ENABLE_WEB_WORKERS: false // Future enhancement
    },
    
    // UI Settings
    ui: {
        ANIMATION_DURATION: 300, // ms
        TOAST_DURATION: 3000, // ms
        AUTO_SAVE_INTERVAL: 30000, // 30 seconds
        ENABLE_DARK_MODE: true,
        DEFAULT_LANGUAGE: 'ja',
        SHOW_TOOLTIPS: true,
        ENABLE_KEYBOARD_SHORTCUTS: true
    },
    
    // Calculation weights for efficiency scoring
    efficiency: {
        VOLUME_WEIGHT: 0.5, // 50%
        WEIGHT_EFFICIENCY_WEIGHT: 0.3, // 30%
        STABILITY_WEIGHT: 0.2, // 20%
        MIN_EFFICIENCY_THRESHOLD: 60, // Minimum acceptable efficiency %
        OPTIMAL_EFFICIENCY_THRESHOLD: 85 // Optimal efficiency %
    },
    
    // Export settings
    export: {
        CSV_DELIMITER: ',',
        CSV_ENCODING: 'UTF-8',
        INCLUDE_HEADERS: true,
        DATE_FORMAT: 'YYYY-MM-DD',
        DECIMAL_PLACES: 2,
        ENABLE_PDF_EXPORT: false // Future enhancement
    },
    
    // Validation rules
    validation: {
        CARTON_CODE_MAX_LENGTH: 50,
        CARTON_CODE_PATTERN: /^[A-Za-z0-9\s\-_]+$/,
        MIN_QUANTITY: 1,
        MAX_QUANTITY: 9999,
        DECIMAL_PRECISION: 2
    },
    
    // Feature flags
    features: {
        ENABLE_MIXED_CARGO: true,
        ENABLE_AUTO_OPTIMIZATION: true,
        ENABLE_3D_VISUALIZATION: false, // Future enhancement
        ENABLE_COST_CALCULATION: false, // Future enhancement
        ENABLE_MULTI_CONTAINER: false, // Future enhancement
        ENABLE_AI_SUGGESTIONS: false // Future enhancement
    },
    
    // Messages and labels (for internationalization)
    messages: {
        errors: {
            INVALID_INPUT: '入力値が無効です',
            CALCULATION_FAILED: '計算中にエラーが発生しました',
            NO_SOLUTION: '最適な配置が見つかりませんでした',
            WEIGHT_EXCEEDED: '重量制限を超えています',
            HEIGHT_EXCEEDED: '高さ制限を超えています',
            INVALID_DIMENSIONS: '寸法が無効です',
            NETWORK_ERROR: 'ネットワークエラーが発生しました',
            STORAGE_ERROR: 'データの保存に失敗しました'
        },
        warnings: {
            LARGE_DATASET: '大量のデータを処理中です',
            SLOW_CALCULATION: '計算に時間がかかっています',
            LOW_EFFICIENCY: '効率が低い配置です',
            UNSTABLE_STACKING: '不安定な積み重ねの可能性があります'
        },
        success: {
            CALCULATION_COMPLETE: '計算が完了しました',
            DATA_SAVED: 'データを保存しました',
            DATA_LOADED: 'データを読み込みました',
            EXPORT_COMPLETE: 'エクスポートが完了しました',
            IMPORT_COMPLETE: 'インポートが完了しました'
        }
    }
};

// Freeze configuration to prevent accidental modifications
Object.freeze(PalletizerConfig);
Object.freeze(PalletizerConfig.constraints);
Object.freeze(PalletizerConfig.performance);
Object.freeze(PalletizerConfig.ui);
Object.freeze(PalletizerConfig.efficiency);
Object.freeze(PalletizerConfig.export);
Object.freeze(PalletizerConfig.validation);
Object.freeze(PalletizerConfig.features);
Object.freeze(PalletizerConfig.messages);
PalletizerConfig.palletSizes.forEach(size => Object.freeze(size));

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PalletizerConfig;
}