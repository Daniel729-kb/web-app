// ダークモード管理
let isDarkMode = false;
let warehouseMapManager = null;

function initMap() {
    // Initialize manager if not exists
    if (!warehouseMapManager) {
        warehouseMapManager = new WarehouseMapManager();
    }
    warehouseMapManager.initMap();
}

// Cleanup when done
function cleanup() {
    if (warehouseMapManager) {
        warehouseMapManager.cleanup();
        warehouseMapManager = null;
    }
}
function toggleDarkMode() {
    isDarkMode = !isDarkMode;
    document.body.classList.toggle('dark-mode', isDarkMode);
    updateDarkModeIcon();
}

function updateDarkModeIcon() {
    const icon = document.querySelector('.dark-mode-icon');
    if (icon) {
        icon.textContent = isDarkMode ? '☀️' : '🌙';
    }
}

function initializeDarkMode() {
    // デフォルトはライトモード
    document.body.classList.remove('dark-mode');
    isDarkMode = false;
    updateDarkModeIcon();
}

// 既存のJavaScript機能（完全保持）
let map;
let warehouseData = [];
let allWarehouseData = [];
let warehouseMarkers = [];
let selectedCountry = 'all';
let selectedState = 'all';

const cityCoordinates = {
    'ahmedabad': [23.0225, 72.5714], 'sonipat': [28.9931, 76.9981], 'gurgaon': [28.4595, 77.0266], 'bangalore': [12.9716, 77.5946], 'bengaluru': [12.9716, 77.5946], 'pune': [18.5204, 73.8567], 'sri city': [13.6288, 79.9731], 'mumbai': [19.0760, 72.8777], 'chennai': [13.0827, 80.2707], 'delhi': [28.6139, 77.2090], 'kolkata': [22.5726, 88.3639], 'hyderabad': [17.3850, 78.4867], 'kochi': [10.085083, 76.343056], 'visakhapatnam': [17.686816, 83.218482], 'chandigarh': [30.598709, 76.802772], 'mangalore': [12.914142, 74.855957], 'coimbatore': [11.016845, 76.955832], 'kanpur': [26.449923, 80.331871], 'hosur': [12.741667, 77.833056], 'madurai': [9.925201, 78.119775], 'indore': [22.719568, 75.857727], 'bhubaneswar': [20.296059, 85.824539], 'lucknow': [26.846694, 80.946166], 'vadodara': [22.307159, 73.181219], 'tiruchirappalli': [10.790479, 78.704712], 'jaipur': [26.912434, 75.787270], 'rajkot': [22.308155, 70.800705],
    'ho chi minh city': [10.8231, 106.6297], 'ho chi minh': [10.8231, 106.6297], 'di an district': [10.897, 106.759], 'thu dau mot': [11.0825, 106.6806], 'thu dau mot city': [11.0825, 106.6806], 'hanoi': [21.0285, 105.8542], 'da nang': [16.0471, 108.2068], 'haiphong': [20.8449, 106.6881],
    'bangkok': [13.7563, 100.5018], 'chiang mai': [18.7883, 98.9853], 'pattaya': [12.9236, 100.8825], 'phuket': [7.8804, 98.3923],
    'singapore': [1.3521, 103.8198],
    'kuala lumpur': [3.1390, 101.6869], 'johor bahru': [1.4927, 103.7414], 'penang': [5.4164, 100.3327],
    'jakarta': [6.2088, 106.8456], 'surabaya': [7.2575, 112.7521], 'bandung': [6.9175, 107.6191], 'medan': [3.5952, 98.6722],
    'manila': [14.5995, 120.9842], 'cebu': [10.3157, 123.8854], 'davao': [7.1907, 125.4553],
    'beijing': [39.9042, 116.4074], 'shanghai': [31.2304, 121.4737], 'guangzhou': [23.1291, 113.2644], 'shenzhen': [22.5431, 114.0579], 'tianjin': [39.3434, 117.3616], 'wuhan': [30.5928, 114.3055], 'chengdu': [30.5728, 104.0668], 'nanjing': [32.0603, 118.7969], 'xi\'an': [34.3416, 108.9398], 'hangzhou': [30.2741, 120.1551],
    'tokyo': [35.6762, 139.6503], 'osaka': [34.6937, 135.5023], 'yokohama': [35.4437, 139.6380], 'nagoya': [35.1815, 136.9066], 'sapporo': [43.0642, 141.3469], 'fukuoka': [33.5904, 130.4017], 'kobe': [34.6901, 135.1956], 'kyoto': [35.0116, 135.7681],
    'seoul': [37.5665, 126.9780], 'busan': [35.1796, 129.0756], 'incheon': [37.4563, 126.7052], 'daegu': [35.8714, 128.6014],
    'new york': [40.7128, -74.0060], 'los angeles': [34.0522, -118.2437], 'chicago': [41.8781, -87.6298], 'houston': [29.7604, -95.3698], 'phoenix': [33.4484, -112.0740], 'philadelphia': [39.9526, -75.1652], 'san antonio': [29.4241, -98.4936], 'san diego': [32.7157, -117.1611], 'dallas': [32.7767, -96.7970], 'san francisco': [37.7749, -122.4194], 'seattle': [47.6062, -122.3321], 'denver': [39.7392, -104.9903], 'boston': [42.3601, -71.0589], 'atlanta': [33.7490, -84.3880], 'miami': [25.7617, -80.1918],
    'london': [51.5074, -0.1278], 'paris': [48.8566, 2.3522], 'berlin': [52.5200, 13.4050], 'madrid': [40.4168, -3.7038], 'rome': [41.9028, 12.4964], 'amsterdam': [52.3676, 4.9041], 'barcelona': [41.3851, 2.1734], 'vienna': [48.2082, 16.3738], 'prague': [50.0755, 14.4378], 'budapest': [47.4979, 19.0402], 'warsaw': [52.2297, 21.0122], 'stockholm': [59.3293, 18.0686], 'copenhagen': [55.6761, 12.5683], 'oslo': [59.9139, 10.7522], 'helsinki': [60.1699, 24.9384], 'zurich': [47.3769, 8.5417], 'geneva': [46.2044, 6.1432], 'brussels': [50.8503, 4.3517], 'dublin': [53.3498, -6.2603],
    'sydney': [-33.8688, 151.2093], 'melbourne': [-37.8136, 144.9631], 'brisbane': [-27.4698, 153.0251], 'perth': [-31.9505, 115.8605], 'adelaide': [-34.9285, 138.6007], 'auckland': [-36.8485, 174.7633], 'wellington': [-41.2924, 174.7787],
    'dubai': [25.2048, 55.2708], 'abu dhabi': [24.2539, 54.3773], 'doha': [25.2854, 51.5310], 'riyadh': [24.7136, 46.6753], 'kuwait city': [29.3759, 47.9774],
    'cairo': [30.0444, 31.2357], 'lagos': [6.5244, 3.3792], 'johannesburg': [-26.2041, 28.0473], 'cape town': [-33.9249, 18.4241], 'nairobi': [-1.2921, 36.8219],
    'sao paulo': [-23.5558, -46.6396], 'rio de janeiro': [-22.9068, -43.1729], 'buenos aires': [-34.6118, -58.3960], 'lima': [-12.0464, -77.0428], 'bogota': [4.7110, -74.0721],
    'toronto': [43.6532, -79.3832], 'vancouver': [49.2827, -123.1207], 'montreal': [45.5017, -73.5673], 'calgary': [51.0447, -114.0719], 'ottawa': [45.4215, -75.6972],
};

function getWarehouseCoordinates(warehouse, index = 0) {
    if (warehouse.Latitude && warehouse.Longitude && warehouse.Latitude !== 0 && warehouse.Longitude !== 0) {
        return [warehouse.Latitude, warehouse.Longitude];
    }
    const city = warehouse.City ? warehouse.City.toLowerCase().trim() : '';
    const coords = cityCoordinates[city];
    if (coords) {
        const offsetLat = (Math.random() - 0.5) * 0.02;
        const offsetLng = (Math.random() - 0.5) * 0.02;
        return [coords[0] + offsetLat, coords[1] + offsetLng];
    }
    console.warn(`City not found: ${city} for warehouse: ${warehouse["Warehouse name"]}`);
    return [20, 0];
}

function initMap() {
    if (map) map.remove();
    map = L.map('map').setView([20, 0], 2);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(map);
}

function createWarehouseChart(warehouse) {
    const totalArea = warehouse["Warehouse floor space (m2)"] || 0;
    const availableArea = warehouse["Available storage space (m2)"] || 0;
    const canvas = document.createElement('canvas');
    canvas.width = 180; canvas.height = 100;
    const ctx = canvas.getContext('2d');
    const barWidth = 40, barSpacing = 20, chartHeight = 60, chartTop = 20;
    const maxValue = Math.max(totalArea, 1);
    const totalHeight = (totalArea / maxValue) * chartHeight;
    const availableHeight = (availableArea / maxValue) * chartHeight;

    // ダークモード対応の背景色
    const bgColor = isDarkMode ? '#1e293b' : '#f8f9fa';
    ctx.fillStyle = bgColor;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    ctx.fillStyle = '#2193b0'; ctx.fillRect(30, chartTop + chartHeight - totalHeight, barWidth, totalHeight);
    ctx.fillStyle = '#6dd5ed'; ctx.fillRect(30 + barWidth + barSpacing, chartTop + chartHeight - availableHeight, barWidth, availableHeight);
    
    // ダークモード対応のテキスト色
    const textColor = isDarkMode ? '#e2e8f0' : '#333';
    ctx.fillStyle = textColor;
    ctx.font = '10px Arial'; ctx.textAlign = 'center';
    ctx.fillText('全体', 50, chartTop + chartHeight + 15);
    ctx.fillText('販売可能', 110, chartTop + chartHeight + 15);
    ctx.font = '8px Arial';
    ctx.fillText(`${totalArea.toLocaleString()}`, 50, chartTop + chartHeight + 25);
    ctx.fillText(`${availableArea.toLocaleString()}`, 110, chartTop + chartHeight + 25);
    return canvas;
}

function displayWarehouses() {
    warehouseMarkers.forEach(marker => map.removeLayer(marker));
    warehouseMarkers = [];

    warehouseData.forEach((warehouse, index) => {
        const [lat, lng] = getWarehouseCoordinates(warehouse, index);
        const totalArea = warehouse["Warehouse floor space (m2)"] || 0;
        const availableArea = warehouse["Available storage space (m2)"] || 0;
        const isEstimated = !warehouse.Latitude || !warehouse.Longitude || warehouse.Latitude === 0 || warehouse.Longitude === 0;
        const iconSize = Math.max(8, Math.min(25, Math.sqrt(totalArea) / 12));
        const usageRate = totalArea > 0 ? (totalArea - availableArea) / totalArea : 0;
        let fillColor;
        if (usageRate >= 0.8) fillColor = '#22c55e';
        else if (usageRate >= 0.6) fillColor = '#84cc16';
        else if (usageRate >= 0.4) fillColor = '#eab308';
        else if (usageRate >= 0.2) fillColor = '#f97316';
        else fillColor = '#ef4444';

        const marker = L.circleMarker([lat, lng], {
            radius: iconSize,
            fillColor: fillColor,
            color: isEstimated ? '#ffd43b' : '#fff',
            weight: isEstimated ? 3 : 2,
            opacity: 1,
            fillOpacity: isEstimated ? 0.7 : 0.8
        }).addTo(map);

        marker.warehouseData = warehouse;
        warehouseMarkers.push(marker);

        const popupContent = document.createElement('div');
        popupContent.className = 'warehouse-popup';
        const coordinateInfo = isEstimated ? `<div style="color: #f76707; font-size: 12px; margin-bottom: 5px;">📍 都市座標使用</div>` : `<div style="color: #51cf66; font-size: 12px; margin-bottom: 5px;">📍 GPS座標</div>`;
        const usagePercentage = totalArea > 0 ? Math.round(((totalArea - availableArea) / totalArea) * 100) : 0;
        popupContent.innerHTML = coordinateInfo + `
            <div class="popup-header">${warehouse["Warehouse name"] || 'Unknown'}</div>
            <div class="popup-detail"><span>🏙️ 場所:</span> <span>${warehouse.City}, ${warehouse.Country}</span></div>
            <div class="popup-detail"><span>🏢 全体面積:</span> <strong>${totalArea.toLocaleString()} m²</strong></div>
            <div class="popup-detail"><span>📦 販売可能:</span> <strong>${availableArea.toLocaleString()} m²</strong></div>
            <div class="popup-detail"><span>📊 使用率:</span> <strong>${usagePercentage}%</strong></div>
        `;
        const chartContainer = document.createElement('div');
        chartContainer.className = 'chart-container';
        chartContainer.appendChild(createWarehouseChart(warehouse));
        popupContent.appendChild(chartContainer);
        marker.bindPopup(popupContent, { maxWidth: 300 });
    });
    displayWarehouseList();
}

function populateCountrySelector() {
    const countrySelect = document.getElementById('country-select');
    const countries = [...new Set(allWarehouseData.map(row => row.Country))].filter(Boolean).sort();
    countrySelect.innerHTML = `<option value="all">全ての国 (${allWarehouseData.length}棟)</option>`;
    countries.forEach(country => {
        const count = allWarehouseData.filter(row => row.Country === country).length;
        const option = document.createElement('option');
        option.value = country;
        option.textContent = `${country} (${count}棟)`;
        countrySelect.appendChild(option);
    });
    countrySelect.addEventListener('change', (e) => {
        selectedCountry = e.target.value;
        selectedState = 'all'; // 国を変更したら州をリセット
        populateStateSelector();
        filterAndDisplayData();
    });
}

function populateStateSelector() {
    const stateSelect = document.getElementById('state-select');
    
    // 現在選択されている国のデータを取得
    const currentCountryData = selectedCountry === 'all' 
        ? allWarehouseData 
        : allWarehouseData.filter(row => row.Country === selectedCountry);
    
    // 州・県のフィールドを特定（State, Prefecture, Province等）
    const stateFields = ['State', 'Prefecture', 'Province', 'Region'];
    let availableStateField = null;
    
    for (const field of stateFields) {
        if (currentCountryData.some(row => row[field])) {
            availableStateField = field;
            break;
        }
    }
    
    if (!availableStateField) {
        // 州・県データがない場合は非表示
        document.querySelector('.state-selector').style.display = 'none';
        return;
    }
    
    // 州・県セレクターを表示
    document.querySelector('.state-selector').style.display = 'flex';
    
    const states = [...new Set(currentCountryData.map(row => row[availableStateField]))].filter(Boolean).sort();
    const totalCount = currentCountryData.length;
    
    stateSelect.innerHTML = `<option value="all">全ての州・県 (${totalCount}棟)</option>`;
    states.forEach(state => {
        const count = currentCountryData.filter(row => row[availableStateField] === state).length;
        const option = document.createElement('option');
        option.value = state;
        option.textContent = `${state} (${count}棟)`;
        stateSelect.appendChild(option);
    });
    
    // 既存のイベントリスナーを削除して新しいものを追加
    const newStateSelect = stateSelect.cloneNode(true);
    stateSelect.parentNode.replaceChild(newStateSelect, stateSelect);
    
    newStateSelect.addEventListener('change', (e) => {
        selectedState = e.target.value;
        filterAndDisplayData();
    });
    
    // 現在の選択状態を設定
    newStateSelect.value = selectedState;
}

function filterAndDisplayData() {
    // 国でフィルタリング
    let filteredData = selectedCountry === 'all' 
        ? allWarehouseData 
        : allWarehouseData.filter(row => row.Country === selectedCountry);
    
    // 州・県でフィルタリング
    if (selectedState !== 'all') {
        const stateFields = ['State', 'Prefecture', 'Province', 'Region'];
        for (const field of stateFields) {
            if (filteredData.some(row => row[field])) {
                filteredData = filteredData.filter(row => row[field] === selectedState);
                break;
            }
        }
    }
    
    warehouseData = filteredData;
    
    // リストタイトルを更新
    const listTitle = document.querySelector('.warehouse-list h3');
    let titleText = '📦 空きが多い順リスト';
    if (selectedCountry !== 'all') {
        titleText += `（${selectedCountry}`;
        if (selectedState !== 'all') {
            titleText += ` - ${selectedState}`;
        }
        titleText += '）';
    } else {
        titleText += '（全世界）';
    }
    listTitle.textContent = titleText;

    displayWarehouses();
    updateStats();
    if (warehouseData.length > 0) {
        fitMapToData();
    }
}

function fitMapToData() {
    const validCoords = warehouseData.map((w, i) => getWarehouseCoordinates(w, i));
    if (validCoords.length > 0) {
        const group = new L.featureGroup(validCoords.map(coord => L.marker(coord)));
        if (validCoords.length === 1) {
            map.setView(validCoords[0], 10);
        } else {
            map.fitBounds(group.getBounds().pad(0.1));
        }
    }
}

function displayWarehouseList() {
    const container = document.getElementById('warehouse-items');
    container.innerHTML = '';
    const sorted = [...warehouseData].sort((a, b) => {
        const rateA = (a["Available storage space (m2)"] || 0) / (a["Warehouse floor space (m2)"] || 1);
        const rateB = (b["Available storage space (m2)"] || 0) / (b["Warehouse floor space (m2)"] || 1);
        return rateB - rateA;
    });

    sorted.forEach(w => {
        const total = w["Warehouse floor space (m2)"] || 0;
        const avail = w["Available storage space (m2)"] || 0;
        const availRate = total > 0 ? Math.round((avail / total) * 100) : 0;
        const usageRate = 100 - availRate;
        let color;
        if (usageRate >= 80) color = '#22c55e';
        else if (usageRate >= 60) color = '#84cc16';
        else if (usageRate >= 40) color = '#eab308';
        else if (usageRate >= 20) color = '#f97316';
        else color = '#ef4444';

        const item = document.createElement('div');
        item.className = 'warehouse-item';
        item.innerHTML = `
            <div class="warehouse-name">${w["Warehouse name"] || 'Unknown'}</div>
            <div class="warehouse-details">${w.City}, ${w.Country}</div>
            <div class="warehouse-stats">
                <span>全体: ${total.toLocaleString()}m²</span>
                <span>販売可能: ${avail.toLocaleString()}m²</span>
                <span style="color: ${color}; font-weight: bold;">${availRate}%空き</span>
            </div>
            <div class="availability-bar">
                <div class="availability-fill" style="width: ${availRate}%; background-color: ${color};"></div>
            </div>
        `;
        item.addEventListener('click', () => focusOnWarehouse(w));
        container.appendChild(item);
    });
}

function focusOnWarehouse(targetWarehouse) {
    const marker = warehouseMarkers.find(m => m.warehouseData["Warehouse name"] === targetWarehouse["Warehouse name"]);
    if (marker) {
        map.setView(marker.getLatLng(), Math.max(map.getZoom(), 10));
        marker.openPopup();
        marker.setStyle({ weight: 5, color: '#ff4757', fillOpacity: 1 });
        setTimeout(() => {
            const isEst = !targetWarehouse.Latitude || !targetWarehouse.Longitude || targetWarehouse.Latitude === 0 || targetWarehouse.Longitude === 0;
            marker.setStyle({ weight: isEst ? 3 : 2, color: isEst ? '#ffd43b' : '#fff', fillOpacity: isEst ? 0.7 : 0.8 });
        }, 2000);
    }
}

function updateStats() {
    const totalWarehouses = warehouseData.length;
    const totalArea = warehouseData.reduce((sum, w) => sum + (w["Warehouse floor space (m2)"] || 0), 0);
    const availableArea = warehouseData.reduce((sum, w) => sum + (w["Available storage space (m2)"] || 0), 0);
    const usageRates = warehouseData.map(w => {
        const total = w["Warehouse floor space (m2)"] || 0;
        const available = w["Available storage space (m2)"] || 0;
        return total > 0 ? ((total - available) / total) * 100 : 0;
    });
    const avgUsage = usageRates.length > 0 ? Math.round(usageRates.reduce((a, b) => a + b, 0) / usageRates.length) : 0;
    const withGPS = warehouseData.filter(w => w.Latitude && w.Longitude && w.Latitude !== 0 && w.Longitude !== 0).length;
    const withCityCoords = totalWarehouses - withGPS;

    document.getElementById('warehouse-count').textContent = `${totalWarehouses} (GPS: ${withGPS}, 都市: ${withCityCoords})`;
    document.getElementById('total-area').textContent = totalArea.toLocaleString();
    document.getElementById('available-area').textContent = availableArea.toLocaleString();
    document.getElementById('avg-usage').textContent = avgUsage;
}

function showMessage(message, type = 'success') {
    const section = document.querySelector('.upload-section');
    const existing = section.querySelector('.message');
    if (existing) existing.remove();
    
    const div = document.createElement('div');
    div.className = `message ${type}`;
    div.textContent = message;
    section.appendChild(div);
}

function processCSVFile(file) {
    try {
        if (!file.name.toLowerCase().endsWith('.csv')) {
            showMessage('CSVファイルを選択してください。', 'error');
            return;
        }
        
        // File size validation (max 10MB)
        if (file.size > 10 * 1024 * 1024) {
            showMessage('ファイルサイズが大きすぎます（10MB以下）', 'error');
            return;
        }

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const csv = e.target.result;
                
                if (!csv || csv.trim().length === 0) {
                    showMessage('CSVファイルが空です。', 'error');
                    return;
                }

                Papa.parse(csv, {
                    header: true,
                    dynamicTyping: true,
                    skipEmptyLines: true,
                    delimitersToGuess: [',', '\t', '|', ';'],
                    complete: function(results) {
                        try {
                            if (!results.data || results.data.length === 0) {
                                showMessage('CSVファイルにデータが含まれていません。', 'error');
                                return;
                            }
                            
                            allWarehouseData = results.data.filter(row =>
                                row.Country &&
                                row["Warehouse floor space (m2)"] > 0
                            );

                            if (allWarehouseData.length === 0) {
                                showMessage('有効な倉庫データが見つかりませんでした。CSVファイルの内容を確認してください。', 'error');
                                return;
                            }

                            warehouseData = allWarehouseData;
                            selectedCountry = 'all';
                            selectedState = 'all';

                            const countriesCount = [...new Set(allWarehouseData.map(row => row.Country))].length;
                            const hongKongCount = allWarehouseData.filter(row => row.Country === "Hong Kong").length;
                            const chinaCount = allWarehouseData.filter(row => row.Country === "China").length;
                            
                            let message = `${allWarehouseData.length}件の倉庫データを${countriesCount}カ国から読み込みました。`;
                            if (hongKongCount > 0) {
                                message += ` 香港: ${hongKongCount}件`;
                                if (chinaCount > 0) {
                                    message += `, 中国: ${chinaCount}件`;
                                }
                            }
                            
                            showMessage(message, 'success');

                            document.getElementById('controls').style.display = 'flex';
                            document.getElementById('map').style.display = 'block';
                            document.getElementById('warehouse-list').style.display = 'flex';
                            document.querySelector('.loading').style.display = 'none';

                            initMap();
                            populateCountrySelector();
                            populateStateSelector();
                            displayWarehouses();
                            updateStats();
                            fitMapToData();

                        } catch (error) {
                            console.error('Data processing error:', error);
                            showMessage('データの処理中にエラーが発生しました: ' + error.message, 'error');
                        }
                    },
                    error: function(error) {
                        console.error('CSV parsing error:', error);
                        showMessage('CSVファイルの読み込みエラー: ' + error.message, 'error');
                    }
                });
            } catch (error) {
                console.error('File reading error:', error);
                showMessage('ファイルの読み込み中にエラーが発生しました。', 'error');
            }
        };
        
        reader.onerror = function(error) {
            console.error('FileReader error:', error);
            showMessage('ファイルの読み込みに失敗しました。', 'error');
        };
        
        reader.readAsText(file);
    } catch (error) {
        console.error('Error in processCSVFile:', error);
        showMessage('ファイル処理中にエラーが発生しました。', 'error');
    }
}

function setupFileUpload() {
    const fileInput = document.getElementById('file-input');
    const uploadArea = document.querySelector('.upload-area');
    fileInput.addEventListener('change', e => e.target.files.length && processCSVFile(e.target.files[0]));
    ['dragover', 'dragleave', 'drop'].forEach(eventName => uploadArea.addEventListener(eventName, e => {
        e.preventDefault();
        e.stopPropagation();
        if (eventName === 'dragover') uploadArea.classList.add('dragover');
        if (eventName === 'dragleave' || eventName === 'drop') uploadArea.classList.remove('dragover');
        if (eventName === 'drop' && e.dataTransfer.files.length) processCSVFile(e.dataTransfer.files[0]);
    }));
}

// 初期化
document.addEventListener('DOMContentLoaded', function() {
    try {
        initializeDarkMode();
        setupFileUpload();
        
        // Add cleanup on page unload
        window.addEventListener('beforeunload', cleanup);
        window.addEventListener('unload', cleanup);
    } catch (error) {
        console.error('Initialization error:', error);
    }
});