// logimap-core.js - Core Application Logic

// Global State Management
let globalState = {
    facility1s: new Map(),
    facility2s: new Map(),
    facility3s: new Map(),
    facility4s: new Map(),
    facility5s: new Map(),
    transportRoutes: new Map(),
    nextFacility1Id: 1,
    nextFacility2Id: 1,
    nextFacility3Id: 1,
    nextFacility4Id: 1,
    nextFacility5Id: 1,
    nextTransportId: 1,
    currentLanguage: 'ja'
};

// Translation System
const translations = {
    ja: {
        'app-title': '🚛 ロジスティクスマップジェネレーター',
        'toggle-theme': '🌙 ダークモード',
        'export-image': '📸 画像出力',
        'export-csv': '📊 CSV出力',
        'facility-1': '施設1',
        'facility-2': '施設2',
        'facility-3': '施設3',
        'facility-4': '施設4',
        'facility-5': '施設5',
        'add-facility': '+ 追加',
        'transport-config': '輸送設定',
        'add-transport-route': '+ 輸送追加',
        'from-location': '出発地',
        'to-location': '到着地',
        'select-location': '場所を選択',
        'data-management': 'データ管理',
        'import-csv': 'CSV インポート',
        'select-csv-file': 'CSVファイルを選択',
        'download-template': '📋 サンプルテンプレート',
        'to-warehouse': '倉庫へ',
        'to-destination': '納入先へ',
        'facility-name': '施設名',
        'location-type': '所在地',
        'domestic': '国内',
        'overseas': '海外',
        'country': '国',
        'city': '都市',
        'remove': '削除',
        'is-warehouse': '倉庫',
        'warehouse-type': '倉庫種別',
        'general-warehouse': '一般倉庫',
        'bonded-warehouse': '保税倉庫',
        'operating-entity': '運営主体',
        'own-company': '弊社',
        'other-company': '他社',
        'new': '新規',
        'temperature-control': '温湿度管理',
        'temperature': '温度',
        'humidity': '湿度',
        'work-content': '作業内容',
        'transport-mode': '輸送モード',
        'departure': '出発地',
        'arrival': '到着地',
        'frequency': '頻度',
        'package-type': '荷姿',
        'volume': '数量',
        'truck': 'トラック',
        'ship': '海運',
        'air': '航空',
        'rail': '鉄道',
        'transport-operating-entity': '輸送運営主体',
        'transport-entity-name': '運営主体名',
        'transport-details': '輸送詳細',
        'nx-transport': '弊社輸送',
        'other-transport': '他社輸送',
        'new-transport': '新規',
        'custom-transport': 'カスタム',
        'custom-entity-name': 'カスタム運営主体名',
        'icon': 'アイコン'
    },
    en: {
        'app-title': '🚛 Logistics Map Generator',
        'toggle-theme': '🌙 Dark Mode',
        'export-image': '📸 Export Image',
        'export-csv': '📊 Export CSV',
        'facility-1': 'Facility 1',
        'facility-2': 'Facility 2',
        'facility-3': 'Facility 3',
        'facility-4': 'Facility 4',
        'facility-5': 'Facility 5',
        'add-facility': '+ Add',
        'transport-config': 'Transport Config',
        'add-transport-route': '+ Add Route',
        'from-location': 'From Location',
        'to-location': 'To Location',
        'select-location': 'Select Location',
        'data-management': 'Data Management',
        'import-csv': 'CSV Import',
        'select-csv-file': 'Select CSV File',
        'download-template': '📋 Sample Template',
        'to-warehouse': 'To Warehouse',
        'to-destination': 'To Destination',
        'facility-name': 'Facility Name',
        'location-type': 'Location Type',
        'domestic': 'Domestic',
        'overseas': 'Overseas',
        'country': 'Country',
        'city': 'City',
        'remove': 'Remove',
        'is-warehouse': 'Warehouse',
        'warehouse-type': 'Warehouse Type',
        'general-warehouse': 'General Warehouse',
        'bonded-warehouse': 'Bonded Warehouse',
        'operating-entity': 'Operating Entity',
        'own-company': 'Our Company',
        'other-company': 'Other Company',
        'new': 'New',
        'temperature-control': 'Temperature Control',
        'temperature': 'Temperature',
        'humidity': 'Humidity',
        'work-content': 'Work Content',
        'transport-mode': 'Transport Mode',
        'departure': 'Departure',
        'arrival': 'Arrival',
        'frequency': 'Frequency',
        'package-type': 'Package Type',
        'volume': 'Volume',
        'truck': 'Truck',
        'ship': 'Ship',
        'air': 'Air',
        'rail': 'Rail',
        'transport-operating-entity': 'Transport Entity',
        'transport-entity-name': 'Entity Name',
        'transport-details': 'Transport Details',
        'nx-transport': 'Our Transport',
        'other-transport': 'Other Transport',
        'new-transport': 'New',
        'custom-transport': 'Custom',
        'custom-entity-name': 'Custom Entity Name',
        'icon': 'Icon'
    },
    zh: {
        'app-title': '🚛 物流地图生成器',
        'toggle-theme': '🌙 深色模式',
        'export-image': '📸 导出图片',
        'export-csv': '📊 导出CSV',
        'facility-1': '设施1',
        'facility-2': '设施2',
        'facility-3': '设施3',
        'facility-4': '设施4',
        'facility-5': '设施5',
        'add-facility': '+ 添加',
        'transport-config': '运输配置',
        'add-transport-route': '+ 添加路线',
        'from-location': '出发地',
        'to-location': '目的地',
        'select-location': '选择地点',
        'data-management': '数据管理',
        'import-csv': 'CSV导入',
        'select-csv-file': '选择CSV文件',
        'download-template': '📋 示例模板',
        'to-warehouse': '到仓库',
        'to-destination': '到目的地',
        'facility-name': '设施名称',
        'location-type': '位置类型',
        'domestic': '国内',
        'overseas': '海外',
        'country': '国家',
        'city': '城市',
        'remove': '删除',
        'is-warehouse': '仓库',
        'warehouse-type': '仓库类型',
        'general-warehouse': '普通仓库',
        'bonded-warehouse': '保税仓库',
        'operating-entity': '运营主体',
        'own-company': '我司',
        'other-company': '他营',
        'new': '新建',
        'temperature-control': '温湿度控制',
        'temperature': '温度',
        'humidity': '湿度',
        'work-content': '工作内容',
        'transport-mode': '运输方式',
        'departure': '出发地',
        'arrival': '到达地',
        'frequency': '频率',
        'package-type': '包装类型',
        'volume': '数量',
        'truck': '卡车',
        'ship': '船运',
        'air': '航空',
        'rail': '铁路',
        'transport-operating-entity': '运输主体',
        'transport-entity-name': '主体名称',
        'transport-details': '运输详情',
        'nx-transport': '我司运输',
        'other-transport': '其他运输',
        'new-transport': '新建',
        'custom-transport': '自定义',
        'custom-entity-name': '自定义主体名称',
        'icon': '图标'
    }
};

// Transport Icons and Configuration
const transportIcons = {
    truck: '🚛',
    ship: '🚢',
    air: '✈️',
    rail: '🚆'
};

const facilityIcons = ['🏭', '🏢', '🏪', '🏛️', '🏬', '🏗️', '🏠', '🏥', '📦', '🚚', '🚢', '✈️', '🚆', '🛳️', '🛒', '🛍️', '🦽'];

// Language Switching
function switchLanguage(lang, buttonElement) {
    globalState.currentLanguage = lang;
    
    // Update active button
    document.querySelectorAll('.language-btn').forEach(btn => btn.classList.remove('active'));
    buttonElement.classList.add('active');
    
    // Update all translatable elements
    updateTranslations();
    
    showDebugMessage(`Language switched to ${lang}`);
}

function updateTranslations() {
    const currentTranslations = translations[globalState.currentLanguage];
    document.querySelectorAll('[data-translate]').forEach(element => {
        const key = element.getAttribute('data-translate');
        if (currentTranslations[key]) {
            if (element.tagName === 'INPUT' && element.type === 'button') {
                element.value = currentTranslations[key];
            } else {
                element.textContent = currentTranslations[key];
            }
        }
    });
}

// Theme Management
function toggleDarkMode() {
    const body = document.body;
    const currentTheme = body.getAttribute('data-theme');
    const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
    body.setAttribute('data-theme', newTheme);
    
    const themeButton = document.querySelector('.theme-toggle');
    themeButton.textContent = newTheme === 'dark' ? '☀️ ライトモード' : '🌙 ダークモード';
    
    showDebugMessage(`Theme switched to ${newTheme} mode`);
}

// Common Facility Management
function addFacility(facilityType) {
    const nextIdKey = `nextFacility${facilityType}Id`;
    const facilityId = globalState[nextIdKey]++;
    const defaultIcon = facilityType === 1 ? '🏭' : facilityType === 2 ? '🏢' : facilityType === 3 ? '🏪' : facilityType === 4 ? '🏛️' : '🏬';
    const facilityData = {
        id: facilityId,
        name: '',
        locationType: 'domestic',
        country: '',
        city: '',
        icon: defaultIcon,
        isWarehouse: false,
        warehouseType: 'general',
        operatingEntity: 'own',
        hasTemperatureControl: false,
        temperature: '',
        humidity: '',
        workContent: ''
    };
    
    globalState[`facility${facilityType}s`].set(facilityId, facilityData);
    renderFacilityForm(facilityType, facilityData);
    generateMap();
}

function renderFacilityForm(facilityType, facilityData) {
    const container = document.getElementById(`facility${facilityType}sContainer`);
    const facilityDiv = document.createElement('div');
    facilityDiv.className = `location-box location-box--${facilityData.locationType}`;
    facilityDiv.id = `facility${facilityType}-${facilityData.id}`;
    
    facilityDiv.innerHTML = `
        <div class="location-box__header">
            <span class="location-box__title" data-translate="facility-${facilityType}">施設${facilityType}</span>
            <button class="btn btn--small btn--danger" onclick="removeFacility(${facilityType}, ${facilityData.id})" data-translate="remove">削除</button>
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="facility-name">施設名</label>
            <input type="text" class="form-input" value="${facilityData.name}"
                   oninput="updateFacilityData(${facilityType}, ${facilityData.id}, 'name', this.value)">
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="location-type">所在地</label>
            <select class="form-select" onchange="updateFacilityData(${facilityType}, ${facilityData.id}, 'locationType', this.value)">
                <option value="domestic" ${facilityData.locationType === 'domestic' ? 'selected' : ''} data-translate="domestic">国内</option>
                <option value="overseas" ${facilityData.locationType === 'overseas' ? 'selected' : ''} data-translate="overseas">海外</option>
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="country">国</label>
            <input type="text" class="form-input" value="${facilityData.country}"
                   oninput="updateFacilityData(${facilityType}, ${facilityData.id}, 'country', this.value)">
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="city">都市</label>
            <input type="text" class="form-input" value="${facilityData.city}"
                   oninput="updateFacilityData(${facilityType}, ${facilityData.id}, 'city', this.value)">
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="icon">アイコン</label>
            <select class="form-select" onchange="updateFacilityData(${facilityType}, ${facilityData.id}, 'icon', this.value)">
                ${facilityIcons.map(icon => `<option value="${icon}" ${facilityData.icon === icon ? 'selected' : ''}>${icon}</option>`).join('')}
            </select>
        </div>
        <div class="checkbox-group">
            <input type="checkbox" id="isWarehouse-${facilityType}-${facilityData.id}" ${facilityData.isWarehouse ? 'checked' : ''}
                   onchange="toggleWarehouseOptions(${facilityType}, ${facilityData.id})">
            <label for="isWarehouse-${facilityType}-${facilityData.id}" data-translate="is-warehouse">倉庫</label>
        </div>
        <div class="warehouse-options ${facilityData.isWarehouse ? 'warehouse-options--visible' : ''}" id="warehouseOptions-${facilityType}-${facilityData.id}">
            <div class="form-group">
                <label class="form-label" data-translate="warehouse-type">倉庫種別</label>
                <div class="btn-group warehouse-type-selector">
                    <button class="btn btn--small ${facilityData.warehouseType === 'general' ? 'active' : ''}"
                            onclick="updateFacilityData(${facilityType}, ${facilityData.id}, 'warehouseType', 'general')" data-translate="general-warehouse">一般倉庫</button>
                    <button class="btn btn--small ${facilityData.warehouseType === 'bonded' ? 'active' : ''}"
                            onclick="updateFacilityData(${facilityType}, ${facilityData.id}, 'warehouseType', 'bonded')" data-translate="bonded-warehouse">保税倉庫</button>
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" data-translate="operating-entity">運営主体</label>
                <div class="btn-group operating-entity-selector">
                    <button class="btn btn--small entity-btn--own ${facilityData.operatingEntity === 'own' ? 'active' : ''}"
                            onclick="updateFacilityData(${facilityType}, ${facilityData.id}, 'operatingEntity', 'own')" data-translate="own-company">弊社</button>
                    <button class="btn btn--small entity-btn--other ${facilityData.operatingEntity === 'other' ? 'active' : ''}"
                            onclick="updateFacilityData(${facilityType}, ${facilityData.id}, 'operatingEntity', 'other')" data-translate="other-company">他社</button>
                    <button class="btn btn--small entity-btn--new ${facilityData.operatingEntity === 'new' ? 'active' : ''}"
                            onclick="updateFacilityData(${facilityType}, ${facilityData.id}, 'operatingEntity', 'new')" data-translate="new">新規</button>
                </div>
            </div>
            <div class="checkbox-group">
                <input type="checkbox" id="tempControl-${facilityType}-${facilityData.id}" ${facilityData.hasTemperatureControl ? 'checked' : ''}
                       onchange="toggleTempControl(${facilityType}, ${facilityData.id})">
                <label for="tempControl-${facilityType}-${facilityData.id}" data-translate="temperature-control">温湿度管理</label>
            </div>
            <div class="temp-options ${facilityData.hasTemperatureControl ? 'temp-options--visible' : ''}" id="tempOptions-${facilityType}-${facilityData.id}">
                <div class="form-group">
                    <label class="form-label" data-translate="temperature">温度</label>
                    <input type="text" class="form-input" value="${facilityData.temperature}"
                           oninput="updateFacilityData(${facilityType}, ${facilityData.id}, 'temperature', this.value)" placeholder="15-25°C">
                </div>
                <div class="form-group">
                    <label class="form-label" data-translate="humidity">湿度</label>
                    <input type="text" class="form-input" value="${facilityData.humidity}"
                           oninput="updateFacilityData(${facilityType}, ${facilityData.id}, 'humidity', this.value)" placeholder="40-60%">
                </div>
            </div>
            <div class="form-group">
                <label class="form-label" data-translate="work-content">作業内容</label>
                <textarea class="form-textarea" oninput="updateFacilityData(${facilityType}, ${facilityData.id}, 'workContent', this.value)">${facilityData.workContent}</textarea>
            </div>
        </div>
    `;
    
    container.appendChild(facilityDiv);
    updateTranslations();
}

function updateFacilityData(facilityType, id, field, value) {
    const facility = globalState[`facility${facilityType}s`].get(id);
    if (facility) {
        facility[field] = value;
        
        // Update border color based on location type
        const facilityDiv = document.getElementById(`facility${facilityType}-${id}`);
        facilityDiv.className = `location-box location-box--${facility.locationType}`;
        
        // Update button states if applicable
        if (field === 'warehouseType') {
            facilityDiv.querySelectorAll('.warehouse-type-selector .btn').forEach(btn => btn.classList.remove('active'));
            facilityDiv.querySelector(`[onclick*="'${value}'"]`).classList.add('active');
        } else if (field === 'operatingEntity') {
            facilityDiv.querySelectorAll('.operating-entity-selector .btn').forEach(btn => btn.classList.remove('active'));
            facilityDiv.querySelector(`[onclick*="'${value}'"]`).classList.add('active');
        }
        
        generateMap();
        validateInput(`facility${facilityType}`, id);
    }
}

function toggleWarehouseOptions(facilityType, id) {
    const facility = globalState[`facility${facilityType}s`].get(id);
    if (facility) {
        facility.isWarehouse = !facility.isWarehouse;
        const warehouseOptions = document.getElementById(`warehouseOptions-${facilityType}-${id}`);
        warehouseOptions.classList.toggle('warehouse-options--visible', facility.isWarehouse);
        generateMap();
    }
}

function toggleTempControl(facilityType, id) {
    const facility = globalState[`facility${facilityType}s`].get(id);
    if (facility) {
        facility.hasTemperatureControl = !facility.hasTemperatureControl;
        const tempOptions = document.getElementById(`tempOptions-${facilityType}-${id}`);
        tempOptions.classList.toggle('temp-options--visible', facility.hasTemperatureControl);
        generateMap();
    }
}

function removeFacility(facilityType, id) {
    globalState[`facility${facilityType}s`].delete(id);
    const facilityDiv = document.getElementById(`facility${facilityType}-${id}`);
    facilityDiv.remove();
    generateMap();
}

// Wrapper functions for each facility type
function addFacility1() { addFacility(1); }
function addFacility2() { addFacility(2); }
function addFacility3() { addFacility(3); }
function addFacility4() { addFacility(4); }
function addFacility5() { addFacility(5); }

// Map Generation
function generateMap() {
    const facility1sColumn = document.getElementById('facility1sColumn');
    const facility2sColumn = document.getElementById('facility2sColumn');
    const facility3sColumn = document.getElementById('facility3sColumn');
    const facility4sColumn = document.getElementById('facility4sColumn');
    const facility5sColumn = document.getElementById('facility5sColumn');
    const mapFlow = document.getElementById('mapFlow');
    
    // Clear existing content
    facility1sColumn.innerHTML = '';
    facility2sColumn.innerHTML = '';
    facility3sColumn.innerHTML = '';
    facility4sColumn.innerHTML = '';
    facility5sColumn.innerHTML = '';
    
    // Remove existing transport arrows and containers
    mapFlow.querySelectorAll('.transport-arrow, .transport-arrows-container').forEach(element => element.remove());
    
    // Add facility1s
    globalState.facility1s.forEach(facility => {
        const facilityItem = createLocationItem('facility1', facility);
        facility1sColumn.appendChild(facilityItem);
    });
    
    // Add facility2s
    globalState.facility2s.forEach(facility => {
        const facilityItem = createLocationItem('facility2', facility);
        facility2sColumn.appendChild(facilityItem);
    });
    
    // Add facility3s
    globalState.facility3s.forEach(facility => {
        const facilityItem = createLocationItem('facility3', facility);
        facility3sColumn.appendChild(facilityItem);
    });
    
    // Add facility4s
    globalState.facility4s.forEach(facility => {
        const facilityItem = createLocationItem('facility4', facility);
        facility4sColumn.appendChild(facilityItem);
    });
    
    // Add facility5s
    globalState.facility5s.forEach(facility => {
        const facilityItem = createLocationItem('facility5', facility);
        facility5sColumn.appendChild(facilityItem);
    });
    
    // Add individual transport arrows for each route
    addIndividualTransportArrows();
    
    updateTranslations();
    generateTransportForms();
    
    // Update layout manager
    if (window.layoutManager) {
        window.layoutManager.optimizeMapLayout();
    }
}

function createLocationItem(type, data) {
    const item = document.createElement('div');
    item.className = `location-item location-item--${type}`;
    item.id = `map-${type}-${data.id}`;
    
    let icon = data.icon;
    let statusBadge = '';
    let details = `${data.country || ''} ${data.city || ''}`.trim();
    
    // Overseas badge on left top
    let overseasBadge = '';
    if (data.locationType === 'overseas') {
        overseasBadge = '<div class="status-badge status-badge--overseas" style="top: -8px;">海外</div>';
    }
    
    if (data.isWarehouse) {
        // Operating entity badge
        if (data.operatingEntity) {
            const entityText = translations[globalState.currentLanguage][data.operatingEntity + '-company'] || data.operatingEntity;
            statusBadge = `<div class="status-badge status-badge--${data.operatingEntity}">${entityText}</div>`;
        }
        
        // Bonded warehouse badge
        if (data.warehouseType === 'bonded') {
            statusBadge += '<div class="status-badge status-badge--bonded" style="top: 20px;">保税</div>';
        }
        
        // Warehouse type indicator
        const warehouseTypeText = data.warehouseType === 'bonded' ?
            (translations[globalState.currentLanguage]['bonded-warehouse'] || '保税倉庫') :
            (translations[globalState.currentLanguage]['general-warehouse'] || '一般倉庫');
        details += `<br>🏷️ ${warehouseTypeText}`;
        
        // Enhanced details for warehouse
        if (data.hasTemperatureControl && data.temperature) {
            details += `<br>🌡️ ${data.temperature}`;
            if (data.humidity) details += `  <br>💧 ${data.humidity}`;
        }
        
        if (data.workContent && data.workContent.trim()) {
            details += `<br>📋 ${data.workContent}`;
        }
    }
    
    item.innerHTML = `
        ${overseasBadge}${statusBadge}
        <div class="location-item__header">
            <span class="location-item__icon">${icon}</span>
            <span class="location-item__title">${data.name || `${type} ${data.id}`}</span>
        </div>
        <div class="location-item__details">${details}</div>
    `;
    
    return item;
}

// Transport Management Functions
function addTransportRoute() {
    const container = document.getElementById('transportContainer');
    const routeId = globalState.nextTransportId++;
    
    // Create new transport route data
    const transportData = {
        id: routeId,
        fromType: '',
        fromId: '',
        toType: '',
        toId: '',
        mode: 'truck',
        operatingEntity: 'nx',
        customEntityName: '',
        departure: '',
        arrival: '',
        frequency: '',
        packageType: '',
        volume: ''
    };
    
    globalState.transportRoutes.set(routeId, transportData);
    
    const routeDiv = createManualTransportRoute(transportData);
    container.appendChild(routeDiv);
    updateTranslations();
}

function createManualTransportRoute(transportData) {
    const routeDiv = document.createElement('div');
    routeDiv.className = 'transport-route';
    routeDiv.id = `transport-route-${transportData.id}`;
    
    routeDiv.innerHTML = `
        <div class="transport-route__header">
            <span>${transportIcons[transportData.mode]}</span>
            <span id="route-title-${transportData.id}">新規輸送ルート</span>
            <button class="btn btn--small btn--danger" onclick="removeTransportRoute(${transportData.id})" data-translate="remove">削除</button>
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="from-location">出発地</label>
            <select class="form-select" onchange="updateTransportLocation(${transportData.id}, 'from', this.value)">
                <option value="" data-translate="select-location">場所を選択</option>
                ${generateLocationOptions('from')}
            </select>
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="to-location">到着地</label>
            <select class="form-select" onchange="updateTransportLocation(${transportData.id}, 'to', this.value)">
                <option value="" data-translate="select-location">場所を選択</option>
                ${generateLocationOptions('to')}
            </select>
        </div>
        <div class="btn-group transport-mode-selector">
            ${Object.entries(transportIcons).map(([mode, icon]) => `
                <button class="btn btn--small transport-mode-btn ${mode === transportData.mode ? 'active' : ''}"
                        onclick="selectTransportMode(this, '${mode}', ${transportData.id})">${icon}</button>
            `).join('')}
        </div>
        <div class="form-group">
            <label class="form-label" data-translate="transport-operating-entity">輸送運営主体</label>
            <select class="form-select" onchange="updateTransportEntityType(${transportData.id}, this.value)">
                <option value="nx" ${transportData.operatingEntity === 'nx' ? 'selected' : ''} data-translate="nx-transport">弊社輸送</option>
                <option value="other" ${transportData.operatingEntity === 'other' ? 'selected' : ''} data-translate="other-transport">他社輸送</option>
                <option value="new" ${transportData.operatingEntity === 'new' ? 'selected' : ''} data-translate="new-transport">新規</option>
                <option value="custom" ${transportData.operatingEntity === 'custom' ? 'selected' : ''} data-translate="custom-transport">カスタム</option>
            </select>
        </div>
        <div class="custom-entity-input ${transportData.operatingEntity === 'custom' ? 'custom-entity-input--visible' : ''}" id="custom-entity-${transportData.id}">
            <div class="form-group">
                <label class="form-label" data-translate="custom-entity-name">カスタム運営主体名</label>
                <input type="text" class="form-input" placeholder="カスタム運営主体名を入力" value="${transportData.customEntityName || ''}"
                       oninput="updateTransportData(${transportData.id}, 'customEntityName', this.value)">
            </div>
        </div>
        <div class="route-details">
            <div class="form-group">
                <label class="form-label" data-translate="departure">出発地</label>
                <input type="text" class="form-input" placeholder="Port/Station" value="${transportData.departure}"
                       oninput="updateTransportData(${transportData.id}, 'departure', this.value)">
            </div>
            <div class="form-group">
                <label class="form-label" data-translate="arrival">到着地</label>
                <input type="text" class="form-input" placeholder="Port/Station" value="${transportData.arrival}"
                       oninput="updateTransportData(${transportData.id}, 'arrival', this.value)">
            </div>
            <div class="form-group">
                <label class="form-label" data-translate="frequency">頻度</label>
                <input type="text" class="form-input" placeholder="Daily/Weekly" value="${transportData.frequency}"
                       oninput="updateTransportData(${transportData.id}, 'frequency', this.value)">
            </div>
            <div class="form-group">
                <label class="form-label" data-translate="package-type">荷姿</label>
                <input type="text" class="form-input" placeholder="Container/Pallet" value="${transportData.packageType}"
                       oninput="updateTransportData(${transportData.id}, 'packageType', this.value)">
            </div>
            <div class="form-group">
                <label class="form-label" data-translate="volume">数量</label>
                <input type="text" class="form-input" placeholder="Volume/Weight" value="${transportData.volume}"
                       oninput="updateTransportData(${transportData.id}, 'volume', this.value)">
            </div>
        </div>
    `;
    
    return routeDiv;
}

function generateLocationOptions(direction) {
    let options = '';
    
    // Add facility1s
    globalState.facility1s.forEach(facility => {
        options += `<option value="facility1-${facility.id}">施設1: ${facility.name || `施設1 ${facility.id}`}</option>`;
    });
    
    // Add facility2s
    globalState.facility2s.forEach(facility => {
        options += `<option value="facility2-${facility.id}">施設2: ${facility.name || `施設2 ${facility.id}`}</option>`;
    });
    
    // Add facility3s
    globalState.facility3s.forEach(facility => {
        options += `<option value="facility3-${facility.id}">施設3: ${facility.name || `施設3 ${facility.id}`}</option>`;
    });
    
    // Add facility4s
    globalState.facility4s.forEach(facility => {
        options += `<option value="facility4-${facility.id}">施設4: ${facility.name || `施設4 ${facility.id}`}</option>`;
    });
    
    // Add facility5s
    globalState.facility5s.forEach(facility => {
        options += `<option value="facility5-${facility.id}">施設5: ${facility.name || `施設5 ${facility.id}`}</option>`;
    });
    
    return options;
}

function updateTransportLocation(routeId, direction, locationValue) {
    const transportData = globalState.transportRoutes.get(routeId);
    if (!transportData || !locationValue) return;
    
    const [locationType, locationId] = locationValue.split('-');
    
    if (direction === 'from') {
        transportData.fromType = locationType;
        transportData.fromId = parseInt(locationId);
    } else {
        transportData.toType = locationType;
        transportData.toId = parseInt(locationId);
    }
    
    // Update route title
    updateRouteTitle(routeId);
    generateMap();
}

function updateTransportEntityType(routeId, entityType) {
    const transportData = globalState.transportRoutes.get(routeId);
    if (!transportData) return;
    
    transportData.operatingEntity = entityType;
    
    // Show/hide custom input field
    const customInput = document.getElementById(`custom-entity-${routeId}`);
    if (customInput) {
        customInput.classList.toggle('custom-entity-input--visible', entityType === 'custom');
    }
    
    generateMap();
}

function updateRouteTitle(routeId) {
    const transportData = globalState.transportRoutes.get(routeId);
    if (!transportData) return;
    
    let fromName = '未選択';
    let toName = '未選択';
    
    // Get from location name
    if (transportData.fromType && transportData.fromId) {
        const fromData = globalState[`${transportData.fromType}s`].get(transportData.fromId);
        if (fromData) {
            fromName = fromData.name || `${transportData.fromType} ${transportData.fromId}`;
        }
    }
    
    // Get to location name
    if (transportData.toType && transportData.toId) {
        const toData = globalState[`${transportData.toType}s`].get(transportData.toId);
        if (toData) {
            toName = toData.name || `${transportData.toType} ${transportData.toId}`;
        }
    }
    
    const titleElement = document.getElementById(`route-title-${routeId}`);
    if (titleElement) {
        titleElement.textContent = `${fromName} → ${toName}`;
    }
}

function removeTransportRoute(routeId) {
    globalState.transportRoutes.delete(routeId);
    const routeDiv = document.getElementById(`transport-route-${routeId}`);
    if (routeDiv) {
        routeDiv.remove();
    }
    generateMap();
}

function generateTransportForms() {
    const container = document.getElementById('transportContainer');
    
    // Keep manually added routes, only remove auto-generated ones
    const manualRoutes = Array.from(container.querySelectorAll('.transport-route')).filter(route =>
        route.id.startsWith('transport-route-')
    );
    
    // Update location options in existing manual routes
    container.querySelectorAll('select').forEach(select => {
        const currentValue = select.value;
        const isFromSelect = select.getAttribute('onchange').includes("'from'");
        const isLocationSelect = select.getAttribute('onchange').includes('updateTransportLocation');
        
        if (isLocationSelect) {
            select.innerHTML = `<option value="" data-translate="select-location">場所を選択</option>` +
                             generateLocationOptions(isFromSelect ? 'from' : 'to');
            select.value = currentValue;
        }
    });
    
    updateTranslations();
}

function selectTransportMode(button, mode, routeId) {
    const container = button.parentElement;
    container.querySelectorAll('.transport-mode-btn').forEach(btn => btn.classList.remove('active'));
    button.classList.add('active');
    
    // Update header icon
    const header = container.closest('.transport-route').querySelector('.transport-route__header span:first-child');
    if (header) {
        header.textContent = transportIcons[mode];
    }
    
    // Update transport data
    if (routeId) {
        updateTransportData(routeId, 'mode', mode);
    }
}

function updateTransportData(routeId, field, value) {
    const transportData = globalState.transportRoutes.get(routeId);
    if (transportData) {
        transportData[field] = value;
        
        // Refresh map display to show updated transport details
        generateMap();
    }
}

function addIndividualTransportArrows() {
    const mapFlow = document.getElementById('mapFlow');
    const facility2sColumn = document.getElementById('facility2sColumn');
    const facility3sColumn = document.getElementById('facility3sColumn');
    const facility4sColumn = document.getElementById('facility4sColumn');
    const facility5sColumn = document.getElementById('facility5sColumn');
    
    // Group routes by direction for vertical stacking
    const facility1To2Routes = [];
    const facility2To3Routes = [];
    const facility3To4Routes = [];
    const facility4To5Routes = [];
    const otherRoutes = [];
    
    globalState.transportRoutes.forEach(route => {
        if (route.fromType && route.toType && route.fromId && route.toId) {
            if (route.fromType === 'facility1' && route.toType === 'facility2') {
                facility1To2Routes.push(route);
            } else if (route.fromType === 'facility2' && route.toType === 'facility3') {
                facility2To3Routes.push(route);
            } else if (route.fromType === 'facility3' && route.toType === 'facility4') {
                facility3To4Routes.push(route);
            } else if (route.fromType === 'facility4' && route.toType === 'facility5') {
                facility4To5Routes.push(route);
            } else {
                otherRoutes.push(route);
            }
        }
    });
    
    // Create vertical container for facility1 to facility2 routes
    if (facility1To2Routes.length > 0) {
        const container = createTransportArrowsContainer();
        facility1To2Routes.forEach(route => {
            const arrow = createIndividualTransportArrow(route);
            container.appendChild(arrow);
        });
        mapFlow.insertBefore(container, facility2sColumn);
    }
    
    // Create vertical container for facility2 to facility3 routes
    if (facility2To3Routes.length > 0) {
        const container = createTransportArrowsContainer();
        facility2To3Routes.forEach(route => {
            const arrow = createIndividualTransportArrow(route);
            container.appendChild(arrow);
        });
        mapFlow.insertBefore(container, facility3sColumn);
    }
    
    // Create vertical container for facility3 to facility4 routes
    if (facility3To4Routes.length > 0) {
        const container = createTransportArrowsContainer();
        facility3To4Routes.forEach(route => {
            const arrow = createIndividualTransportArrow(route);
            container.appendChild(arrow);
        });
        mapFlow.insertBefore(container, facility4sColumn);
    }
    
    // Create vertical container for facility4 to facility5 routes
    if (facility4To5Routes.length > 0) {
        const container = createTransportArrowsContainer();
        facility4To5Routes.forEach(route => {
            const arrow = createIndividualTransportArrow(route);
            container.appendChild(arrow);
        });
        mapFlow.insertBefore(container, facility5sColumn);
    }
    
    // Add other routes at the end
    otherRoutes.forEach(route => {
        const container = createTransportArrowsContainer();
        const arrow = createIndividualTransportArrow(route);
        container.appendChild(arrow);
        mapFlow.appendChild(container);
    });
}

function createTransportArrowsContainer() {
    const container = document.createElement('div');
    container.className = 'transport-arrows-container';
    return container;
}

function createIndividualTransportArrow(route) {
    const arrow = document.createElement('div');
    arrow.className = 'transport-arrow';
    
    const transportIcon = transportIcons[route.mode] || '🚛';
    
    // Build transport info for this specific route
    let transportInfo = '';
    let entityBadge = '';
    
    // Handle different entity types
    if (route.operatingEntity) {
        let entityText = route.operatingEntity;
        if (route.operatingEntity === 'nx') {
            entityText = translations[globalState.currentLanguage]['nx-transport'] || '弊社輸送';
        } else if (route.operatingEntity === 'other') {
            entityText = translations[globalState.currentLanguage]['other-transport'] || '他社輸送';
        } else if (route.operatingEntity === 'new') {
            entityText = translations[globalState.currentLanguage]['new-transport'] || '新規';
        } else if (route.operatingEntity === 'custom' && route.customEntityName) {
            entityText = route.customEntityName;
        }
        
        entityBadge = `<div class="transport-entity-badge">${entityText}</div>`;
    }
    
    const details = [];
    if (route.departure) details.push(`📍 ${route.departure}`);
    if (route.arrival) details.push(`🎯 ${route.arrival}`);
    if (route.frequency) details.push(`📅 ${route.frequency}`);
    if (route.packageType) details.push(`📦 ${route.packageType}`);
    if (route.volume) details.push(`📊 ${route.volume}`);
    
    if (details.length > 0) {
        transportInfo = details.join('<br>');
    } else {
        // Fallback for empty routes
        transportInfo = translations[globalState.currentLanguage]['transport-details'] || '輸送詳細';
    }
    
    // Get route names for display
    let fromName = '出発地';
    let toName = '到着地';
    
    if (route.fromType && route.fromId) {
        const fromData = globalState[`${route.fromType}s`].get(route.fromId);
        if (fromData) {
            fromName = fromData.name || `${route.fromType} ${route.fromId}`;
        }
    }
    
    if (route.toType && route.toId) {
        const toData = globalState[`${route.toType}s`].get(route.toId);
        if (toData) {
            toName = toData.name || `${route.toType} ${route.toId}`;
        }
    }
    
    arrow.innerHTML = `
        <div class="arrow-line"></div>
        <div class="transport-icon">${transportIcon}</div>
        <div class="transport-details">
            ${entityBadge}
            <div class="transport-route-title">${fromName} → ${toName}</div>
            <div class="transport-info">${transportInfo}</div>
        </div>
    `;
    
    return arrow;
}

// Data Import/Export Functions
function exportDataAsCSV() {
    const data = [];
    
    // Add facilities
    ['1', '2', '3', '4', '5'].forEach(type => {
        globalState[`facility${type}s`].forEach(facility => {
            data.push(getFacilityCSVRow(`facility${type}`, facility));
        });
    });
    
    // Add transport routes
    globalState.transportRoutes.forEach(route => {
        data.push({
            type: 'transport',
            id: route.id,
            fromType: route.fromType,
            fromId: route.fromId,
            toType: route.toType,
            toId: route.toId,
            mode: route.mode,
            operatingEntity: route.operatingEntity,
            customEntityName: route.customEntityName,
            departure: route.departure,
            arrival: route.arrival,
            frequency: route.frequency,
            packageType: route.packageType,
            volume: route.volume
        });
    });
    
    const csv = convertToCSV(data);
    downloadFile(csv, 'logistics-map-data.csv', 'text/csv');
    showDebugMessage('Data exported to CSV successfully');
}

function getFacilityCSVRow(type, facility) {
    return {
        type: type,
        id: facility.id,
        name: facility.name,
        locationType: facility.locationType,
        country: facility.country,
        city: facility.city,
        icon: facility.icon,
        isWarehouse: facility.isWarehouse,
        warehouseType: facility.warehouseType,
        operatingEntity: facility.operatingEntity,
        hasTemperatureControl: facility.hasTemperatureControl,
        temperature: facility.temperature,
        humidity: facility.humidity,
        workContent: facility.workContent
    };
}

function convertToCSV(data) {
    if (data.length === 0) return '';
    
    // Collect all unique headers from all rows
    const allHeaders = new Set();
    data.forEach(row => {
        Object.keys(row).forEach(key => allHeaders.add(key));
    });
    const headers = Array.from(allHeaders);
    
    const csvHeaders = headers.join(',');
    
    const csvRows = data.map(row => {
        return headers.map(header => {
            const value = row[header] ?? '';
            return `"${value.toString().replace(/"/g, '""')}"`;
        }).join(',');
    });
    
    return [csvHeaders, ...csvRows].join('\n');
}

function downloadFile(content, filename, contentType = 'text/plain') {
    const blob = new Blob([content], { type: contentType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
}

function downloadSampleTemplate() {
    const sampleData = [
        {
            type: 'facility1',
            id: 1,
            name: 'Supplier A',
            locationType: 'overseas',
            country: 'China',
            city: 'Shanghai',
            icon: '🏭',
            isWarehouse: false,
            warehouseType: 'general',
            operatingEntity: 'own',
            hasTemperatureControl: false,
            temperature: '',
            humidity: '',
            workContent: ''
        },
        {
            type: 'facility2',
            id: 1,
            name: 'Main Warehouse',
            locationType: 'domestic',
            country: 'Japan',
            city: 'Tokyo',
            icon: '🏢',
            isWarehouse: true,
            warehouseType: 'general',
            operatingEntity: 'own',
            hasTemperatureControl: true,
            temperature: '15-25°C',
            humidity: '40-60%',
            workContent: 'Storage and distribution'
        }
    ];
    
    const csv = convertToCSV(sampleData);
    downloadFile(csv, 'logistics-map-template.csv', 'text/csv');
    showDebugMessage('Sample template downloaded');
}

function importDataFromCSV(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = function(e) {
        try {
            const csv = e.target.result;
            const data = parseCSV(csv);
            applyImportedData(data);
            showDebugMessage('CSV data imported successfully');
        } catch (error) {
            showDebugMessage('Error importing CSV: ' + error.message, true);
        }
    };
    reader.readAsText(file, 'UTF-8');
}

function parseCSV(csv) {
    const headers = csv.split('\n')[0].split(',').map(h => h.replace(/"/g, '').trim());
    const data = [];
    const rows = csv.split('\n').slice(1);
    rows.forEach(row => {
        if (row.trim()) {
            const values = parseCSVRow(row);
            const obj = {};
            headers.forEach((header, index) => {
                obj[header] = values[index] || '';
            });
            data.push(obj);
        }
    });
    return data;
}

function parseCSVRow(row) {
    const values = [];
    let current = '';
    let inQuotes = false;
    let i = 0;
    while (i < row.length) {
        const char = row[i];
        if (char === '"' && !inQuotes) {
            inQuotes = true;
        } else if (char === '"' && inQuotes) {
            if (i + 1 < row.length && row[i + 1] === '"') {
                current += '"';
                i++;
            } else {
                inQuotes = false;
            }
        } else if (char === ',' && !inQuotes) {
            values.push(current.trim());
            current = '';
        } else {
            current += char;
        }
        i++;
    }
    if (current) values.push(current.trim());
    return values;
}

function applyImportedData(data) {
    // Clear existing data
    ['1', '2', '3', '4', '5'].forEach(type => globalState[`facility${type}s`].clear());
    globalState.transportRoutes.clear();
    
    // Clear forms
    ['1', '2', '3', '4', '5'].forEach(type => document.getElementById(`facility${type}sContainer`).innerHTML = '');
    document.getElementById('transportContainer').innerHTML = '';
    
    // Reset ID counters
    ['1', '2', '3', '4', '5'].forEach(type => globalState[`nextFacility${type}Id`] = 1);
    globalState.nextTransportId = 1;
    
    // Import data
    data.forEach(row => {
        if (row.type.startsWith('facility')) {
            const facilityType = row.type.replace('facility', '');
            const facilityData = {
                id: globalState[`nextFacility${facilityType}Id`]++,
                name: row.name || '',
                locationType: row.locationType || 'domestic',
                country: row.country || '',
                city: row.city || '',
                icon: row.icon || facilityIcons[facilityType - 1] || '🏭',
                isWarehouse: row.isWarehouse === 'true' || row.isWarehouse === true,
                warehouseType: row.warehouseType || 'general',
                operatingEntity: row.operatingEntity || 'own',
                hasTemperatureControl: row.hasTemperatureControl === 'true' || row.hasTemperatureControl === true,
                temperature: row.temperature || '',
                humidity: row.humidity || '',
                workContent: row.workContent || ''
            };
            globalState[`facility${facilityType}s`].set(facilityData.id, facilityData);
            renderFacilityForm(facilityType, facilityData);
        }
    });
    
    generateMap();
    updateTranslations();
}

// Image Export
function exportAsImage() {
    // Show loading message
    const exportBtn = document.querySelector('.export-btn[onclick="exportAsImage()"]');
    const originalBtnText = exportBtn.textContent;
    exportBtn.textContent = '📸 エクスポート中...';
    exportBtn.disabled = true;
    
    showDebugMessage('画像エクスポートを準備中...', false);
    
    const mapPanel = document.querySelector('.map-panel');
    const mapDisplay = document.getElementById('mapDisplay');
    const mapFlow = document.getElementById('mapFlow');
    
    // Save original styles
    const originalPanelOverflow = mapPanel.style.overflow;
    const originalDisplayOverflow = mapDisplay.style.overflow;
    
    // Get all transport arrows to fix transparency
    const transportArrows = document.querySelectorAll('.transport-arrow');
    const originalArrowStyles = [];
    
    // Make everything visible for capture and fix transparency issues
    mapPanel.style.overflow = 'visible';
    mapDisplay.style.overflow = 'visible';
    
    // Temporarily adjust container for full capture
    const originalMapFlowStyle = mapFlow.style.cssText;
    mapFlow.style.width = 'auto';
    mapFlow.style.height = 'auto';
    mapFlow.style.overflow = 'visible';
    mapFlow.style.position = 'relative';
    
    // Apply export-ready classes to fix transparency
    transportArrows.forEach((arrow, index) => {
        originalArrowStyles[index] = {
            classList: Array.from(arrow.classList)
        };
        
        arrow.classList.add('export-ready');
    });
    
    // Get transport details and icons for solid backgrounds
    const transportDetails = document.querySelectorAll('.transport-details');
    const transportIcons = document.querySelectorAll('.transport-icon');
    
    // Temporarily add exporting class for all export-specific styles
    mapFlow.classList.add('exporting');
    
    // Force reflow and wait for layout to settle
    mapFlow.offsetHeight;
    setTimeout(() => {
        // Continue with export after layout settles
        performExport();
    }, 100);
    
    function performExport() {
    
    // Calculate proper dimensions - use mapFlow for full content capture
    const mapRect = mapFlow.getBoundingClientRect();
    
    // Get all child elements to calculate total dimensions
    const allColumns = mapFlow.querySelectorAll('.location-column, .transport-arrows-container');
    let totalWidth = 0;
    let totalHeight = 0;
    
    allColumns.forEach(column => {
        const rect = column.getBoundingClientRect();
        totalWidth += rect.width;
        totalHeight = Math.max(totalHeight, rect.height);
    });
    
    // Add some padding for better export
    totalWidth += 40; // 20px padding on each side
    totalHeight += 40;
    
    const options = {
        useCORS: true,
        allowTaint: true,
        scale: 2,
        backgroundColor: document.body.getAttribute('data-theme') === 'dark' ? '#1a202c' : '#ffffff',
        width: totalWidth,
        height: totalHeight,
        logging: false,
        removeContainer: false,
        windowWidth: totalWidth,
        windowHeight: totalHeight,
        scrollX: 0,
        scrollY: 0
    };
    
    html2canvas(mapFlow, options).then(canvas => {
        canvas.toBlob(blob => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = 'logistics-map.png';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
            
            showDebugMessage('マップが正常に画像として出力されました！');
        }, 'image/png');
    }).catch(error => {
        showDebugMessage('画像エクスポートエラー: ' + error.message, true);
        // Restore export button on error
        exportBtn.textContent = originalBtnText;
        exportBtn.disabled = false;
    }).finally(() => {
        // Restore original styles
        mapPanel.style.overflow = originalPanelOverflow;
        mapDisplay.style.overflow = originalDisplayOverflow;
        mapFlow.style.cssText = originalMapFlowStyle;
        
        // Restore transport arrow classes
        transportArrows.forEach((arrow, index) => {
            const original = originalArrowStyles[index];
            arrow.className = '';
            original.classList.forEach(className => {
                arrow.classList.add(className);
            });
        });
        
        // Remove exporting class
        mapFlow.classList.remove('exporting');
        
        // Restore export button
        exportBtn.textContent = originalBtnText;
        exportBtn.disabled = false;
    });
    }
}

// Validation System
function validateInput(type, id) {
    const data = globalState[`${type}s`].get(id);
    const element = document.getElementById(`${type}-${id}`);
    
    if (!data || !element) return;
    
    const isValid = data.name && data.name.trim() !== '';
    const nameInput = element.querySelector('input[type="text"]');
    
    if (nameInput) {
        nameInput.classList.toggle('error', !isValid);
    }
    
    return isValid;
}

// Debug and User Feedback
function showDebugMessage(message, isError = false) {
    // Remove existing debug messages
    document.querySelectorAll('.debug-message').forEach(msg => msg.remove());
    
    const debugDiv = document.createElement('div');
    debugDiv.className = `debug-message debug-message--${isError ? 'error' : 'success'}`;
    debugDiv.textContent = message;
    
    document.body.appendChild(debugDiv);
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
        debugDiv.remove();
    }, 3000);
    
    console.log(`[${isError ? 'ERROR' : 'INFO'}] ${message}`);
}

// Section management functions
function collapseAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (!section.classList.contains('collapsed')) {
            if (window.layoutManager) {
                window.layoutManager.toggleSection(section);
            }
        }
    });
}

function expandAllSections() {
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        if (section.classList.contains('collapsed')) {
            if (window.layoutManager) {
                window.layoutManager.toggleSection(section);
            }
        }
    });
}



// Initialize Application
function initializeApp() {
    // Add default data for demonstration
    addFacility1();
    addFacility2();
    addFacility3();
    
    // Set sample data for clarity
    const facility1 = globalState.facility1s.get(1);
    facility1.name = '調達先A (海外)';
    facility1.locationType = 'overseas';
    facility1.country = '中国';
    facility1.city = '上海';
    facility1.icon = '🏭';
    
    const facility2 = globalState.facility2s.get(1);
    facility2.name = '倉庫B';
    facility2.locationType = 'domestic';
    facility2.country = '日本';
    facility2.city = '東京';
    facility2.icon = '🏢';
    facility2.isWarehouse = true;
    facility2.warehouseType = 'general';
    facility2.operatingEntity = 'own';
    facility2.hasTemperatureControl = true;
    facility2.temperature = '15-25°C';
    facility2.humidity = '40-60%';
    facility2.workContent = '保管・配送';
    
    const facility3 = globalState.facility3s.get(1);
    facility3.name = '納入先C';
    facility3.locationType = 'domestic';
    facility3.country = '日本';
    facility3.city = '大阪';
    facility3.icon = '🏪';
    
    // Add sample transport route
    addTransportRoute();
    const firstRoute = Array.from(globalState.transportRoutes.values())[0];
    if (firstRoute) {
        firstRoute.fromType = 'facility1';
        firstRoute.fromId = 1;
        firstRoute.toType = 'facility2';
        firstRoute.toId = 1;
        firstRoute.mode = 'air';
        firstRoute.operatingEntity = 'nx';
        firstRoute.departure = '上海港';
        firstRoute.arrival = '成田空港';
        firstRoute.frequency = '毎日';
        firstRoute.packageType = 'コンテナ';
        firstRoute.volume = '500kg';
        
        updateRouteTitle(firstRoute.id);
    }
    
    generateMap();
    updateTranslations();
    
    if (window.layoutManager) {
        window.layoutManager.optimizeMapLayout();
    }
    
    showDebugMessage('Logistics Map Generator initialized successfully!');
}

// Initialize when DOM is ready - let layout.js handle the timing
// document.addEventListener('DOMContentLoaded', initializeApp);
