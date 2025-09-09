* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    background-color: #f8fafc;
    color: #1e293b;
    line-height: 1.6;
    padding: 2rem;
}

.container {
    max-width: 1200px;
    margin: 0 auto;
    background: white;
    border-radius: 1rem;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
    overflow: hidden;
}

.header {
    background: linear-gradient(135deg, #3b82f6, #1d4ed8);
    color: white;
    padding: 2rem;
    text-align: center;
}

.header h1 {
    font-size: 2rem;
    margin-bottom: 0.5rem;
}

.header p {
    opacity: 0.9;
}

.content {
    padding: 2rem;
}

/* New two-column layout inspired by reference */
.main-content {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 1.5rem;
}

.input-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

.output-section {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
}

@media (max-width: 992px) {
    .main-content { grid-template-columns: 1fr; }
}

.form-section {
    margin-bottom: 0;
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
}

.form-section h2 {
    color: #1e293b;
    margin-bottom: 1rem;
    font-size: 1.25rem;
}

.form-row {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
    margin-bottom: 1rem;
}

.form-group {
    margin-bottom: 1rem;
}

.form-group label {
    display: block;
    margin-bottom: 0.5rem;
    font-weight: 500;
    color: #374151;
}

.form-input {
    width: 100%;
    padding: 0.75rem;
    border: 1px solid #d1d5db;
    border-radius: 0.5rem;
    font-size: 1rem;
    transition: border-color 0.2s;
}

.form-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}

.form-input[multiple] {
    min-height: 120px;
    padding: 0.5rem;
}

.form-input[multiple] option {
    padding: 0.5rem;
    border-bottom: 1px solid #e5e7eb;
}

.form-input[multiple] option:checked {
    background-color: #3b82f6;
    color: white;
}

.checkbox-group {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    margin-bottom: 1rem;
}

.checkbox-group input[type="checkbox"] {
    width: 1.25rem;
    height: 1.25rem;
}

.btn {
    background: #3b82f6;
    color: white;
    border: none;
    padding: 0.75rem 1.5rem;
    border-radius: 0.5rem;
    font-size: 1rem;
    font-weight: 500;
    cursor: pointer;
    transition: background-color 0.2s;
    width: 100%;
}

.btn:hover {
    background: #2563eb;
}

.btn:active {
    transform: translateY(1px);
}

.results {
    background: #ecfdf5;
    border: 1px solid #a7f3d0;
    border-radius: 0.5rem;
    padding: 1.5rem;
    margin-top: 0;
}

.results h3 {
    color: #065f46;
    margin-bottom: 1rem;
}

.result-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 1rem;
}

.result-item {
    background: white;
    padding: 1rem;
    border-radius: 0.5rem;
    text-align: center;
    border: 1px solid #d1d5db;
}

.result-value {
    font-size: 1.5rem;
    font-weight: 700;
    color: #3b82f6;
    margin-bottom: 0.25rem;
}

.result-label {
    font-size: 0.875rem;
    color: #6b7280;
}

.efficiency-bar {
    background: #e5e7eb;
    height: 1rem;
    border-radius: 0.5rem;
    overflow: hidden;
    margin-top: 0.5rem;
}

.efficiency-fill {
    background: linear-gradient(90deg, #10b981, #059669);
    height: 100%;
    transition: width 0.3s ease;
}

.pallet-list {
    margin-top: 1rem;
}

.pallet-item {
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 0.5rem;
    display: flex;
    justify-content: space-between;
    align-items: center;
}

.pallet-info h4 {
    margin-bottom: 0.25rem;
}

.pallet-info p {
    font-size: 0.875rem;
    color: #6b7280;
}

.pallet-actions {
    display: flex;
    gap: 0.5rem;
}

.btn-sm {
    padding: 0.5rem 1rem;
    font-size: 0.875rem;
    width: auto;
}

.btn-danger {
    background: #ef4444;
}

.btn-danger:hover {
    background: #dc2626;
}

.hidden {
    display: none;
}

.message {
    padding: 1rem;
    border-radius: 0.5rem;
    margin-bottom: 1rem;
}

/* 2D Layout Styles */
.layout-section {
    padding: 1.5rem;
    background: #f8fafc;
    border-radius: 0.5rem;
    border: 1px solid #e2e8f0;
}

.layout-controls {
    display: flex;
    gap: 1rem;
    margin-bottom: 1rem;
}

.layout-container {
    background: white;
    border: 2px solid #e5e7eb;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
    overflow: auto;
    max-height: 500px;
}

.warehouse-layout {
    position: relative;
    background: #ffffff;
    border: 3px solid #1f2937;
    border-radius: 0.5rem;
    margin: 0 auto;
    min-height: 0;
    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

.warehouse-outline {
    position: absolute;
    border: 3px solid #1f2937;
    background: rgba(249, 250, 251, 0.9);
    border-radius: 0.5rem;
    box-shadow: inset 0 2px 4px rgba(0, 0, 0, 0.1);
}

.pallet-area {
    position: absolute;
    border: 2px solid #374151;
    border-radius: 0.25rem;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 0.7rem;
    font-weight: 600;
    color: white;
    text-shadow: 0 1px 3px rgba(0, 0, 0, 0.7);
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);
}

.pallet-area:hover {
    transform: scale(1.08);
    z-index: 10;
    box-shadow: 0 6px 12px rgba(0, 0, 0, 0.3);
    border-color: #fbbf24;
}

.aisle {
    position: absolute;
    background: #f3f4f6;
    border: 2px dashed #9ca3af;
    opacity: 0.8;
}

.aisle.horizontal {
    background: repeating-linear-gradient(
        90deg,
        #f3f4f6 0px,
        #f3f4f6 8px,
        #e5e7eb 8px,
        #e5e7eb 16px
    );
}

.aisle.vertical {
    background: repeating-linear-gradient(
        0deg,
        #f3f4f6 0px,
        #f3f4f6 8px,
        #e5e7eb 8px,
        #e5e7eb 16px
    );
}

.layout-legend {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    margin-top: 1rem;
}

.legend-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.5rem;
    background: white;
    border: 1px solid #e5e7eb;
    border-radius: 0.25rem;
    font-size: 0.875rem;
}

.legend-color {
    width: 20px;
    height: 20px;
    border-radius: 0.125rem;
    border: 1px solid #6b7280;
}

.layout-info {
    background: #f0f9ff;
    border: 1px solid #0ea5e9;
    border-radius: 0.5rem;
    padding: 1rem;
    margin-bottom: 1rem;
}

.layout-info h4 {
    color: #0369a1;
    margin-bottom: 0.5rem;
}

.layout-info p {
    color: #0c4a6e;
    font-size: 0.875rem;
    margin: 0.25rem 0;
}

.message.success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #a7f3d0;
}

.message.error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
}

/* Show a single border: container only */
.warehouse-outline { display: none; }
.warehouse-layout { border: 3px solid #1f2937; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
/* Faint grid background (10px = 1m → grid = 2m) */
.warehouse-layout {
    background-color: #ffffff;
    background-image:
        repeating-linear-gradient(0deg, rgba(229, 231, 235, 0.6) 0, rgba(229, 231, 235, 0.6) 1px, transparent 1px, transparent 20px),
        repeating-linear-gradient(90deg, rgba(229, 231, 235, 0.6) 0, rgba(229, 231, 235, 0.6) 1px, transparent 1px, transparent 20px);
}

/* Dimension label */
.dimension-label {
    display: block;
    margin-top: 6px; /* below the border without causing scrollbars */
    text-align: right;
    padding: 2px 8px;
    font-size: 12px;
    color: #4b5563;
    background: rgba(255,255,255,0.95);
    border: 1px solid #e5e7eb;
    border-radius: 4px;
    pointer-events: none;
}