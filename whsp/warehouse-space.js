// Warehouse Space Management System
class WarehouseSpaceApp {
    constructor() {
        // Core properties
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.warehouse = null;
        this.pallets = [];
        this.placedPallets = [];
        this.isDarkMode = false;
        this.currentPalletId = 0;
        this.lastCalculation = null;

        // Initialize the application
        this.init();
    }

    init() {
        console.log('Initializing Warehouse Space App...');

        // Setup event listeners
        this.setupEventListeners();

        // Initialize dark mode
        this.initializeDarkMode();

        // Initialize 3D scene
        this.init3DScene();

        // Create default warehouse
        this.createDefaultWarehouse();

        // Setup message system
        this.setupMessageSystem();

        console.log('Warehouse Space App initialized successfully');
    }

    setupEventListeners() {
        // Theme toggle
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleDarkMode());

        // Warehouse creation
        document.getElementById('createWarehouse').addEventListener('click', () => this.createWarehouse());

        // Pallet management
        document.getElementById('addPalletBtn').addEventListener('click', () => this.addPallet());

        // Space calculation
        document.getElementById('calculateSpace').addEventListener('click', () => this.calculateSpace());

        // Auto placement
        document.getElementById('autoPlaceBtn').addEventListener('click', () => this.autoPlacePallets());

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());

        // 3D view controls
        document.getElementById('resetView').addEventListener('click', () => this.resetView());
        document.getElementById('topView').addEventListener('click', () => this.setTopView());
        document.getElementById('sideView').addEventListener('click', () => this.setSideView());
        document.getElementById('isoView').addEventListener('click', () => this.setIsoView());

        // Help
        document.getElementById('helpBtn').addEventListener('click', () => this.showHelp());
    }

    initializeDarkMode() {
        this.isDarkMode = localStorage.getItem('darkMode') === 'true';
        if (this.isDarkMode) {
            document.body.classList.add('dark-mode');
            document.getElementById('themeToggle').textContent = '☀️ ライトモード';
        }
        this.updateSceneLighting();
    }

    toggleDarkMode() {
        this.isDarkMode = !this.isDarkMode;
        document.body.classList.toggle('dark-mode', this.isDarkMode);
        localStorage.setItem('darkMode', this.isDarkMode);

        const button = document.getElementById('themeToggle');
        button.textContent = this.isDarkMode ? '☀️ ライトモード' : '🌙 ダークモード';

        this.updateSceneLighting();
    }

    init3DScene() {
        // Get container
        const container = document.getElementById('warehouse3D');

        // Create scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.isDarkMode ? 0x0f172a : 0xf8fafc);

        // Create camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            container.clientWidth / container.clientHeight,
            0.1,
            1000
        );
        this.camera.position.set(30, 25, 30);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(container.clientWidth, container.clientHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        container.appendChild(this.renderer.domElement);

        // Create controls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.target.set(0, 0, 0);

        // Add lighting
        this.setupLighting();

        // Add grid
        this.addGrid();

        // Handle window resize
        window.addEventListener('resize', () => this.onWindowResize());

        // Start animation loop
        this.animate();
    }

    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(
            this.isDarkMode ? 0x404040 : 0x404040,
            0.6
        );
        this.scene.add(ambientLight);

        // Directional light
        const directionalLight = new THREE.DirectionalLight(
            this.isDarkMode ? 0xffffff : 0xffffff,
            0.8
        );
        directionalLight.position.set(50, 50, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);

        // Point light
        const pointLight = new THREE.PointLight(0xffffff, 0.5, 100);
        pointLight.position.set(0, 20, 0);
        this.scene.add(pointLight);
    }

    updateSceneLighting() {
        if (!this.scene) return;

        this.scene.background = new THREE.Color(this.isDarkMode ? 0x0f172a : 0xf8fafc);

        this.scene.traverse((child) => {
            if (child instanceof THREE.Light) {
                if (child.type === 'AmbientLight') {
                    child.color.setHex(this.isDarkMode ? 0x404040 : 0x404040);
                } else if (child.type === 'DirectionalLight') {
                    child.color.setHex(this.isDarkMode ? 0xffffff : 0xffffff);
                }
            }
        });
    }

    addGrid() {
        const gridHelper = new THREE.GridHelper(100, 50, 0x888888, 0xcccccc);
        this.scene.add(gridHelper);
    }

    createDefaultWarehouse() {
        // Create a default warehouse
        this.warehouse = {
            name: 'Default Warehouse',
            length: 50,
            width: 40,
            height: 9,
            totalArea: 50 * 40,
            totalVolume: 50 * 40 * 9
        };

        // Create warehouse structure
        this.createWarehouseStructure();

        // Update UI
        this.updateMetrics();

        this.showMessage('デフォルト倉庫が作成されました', 'success');
    }

    createWarehouse() {
        const length = parseFloat(document.getElementById('warehouseLength').value);
        const width = parseFloat(document.getElementById('warehouseWidth').value);
        const height = parseFloat(document.getElementById('warehouseHeight').value);
        const name = document.getElementById('warehouseName').value || '倉庫';

        if (!length || !width || !height) {
            this.showMessage('倉庫の寸法を正しく入力してください', 'error');
            return;
        }

        this.warehouse = {
            name: name,
            length: length,
            width: width,
            height: height,
            totalArea: length * width,
            totalVolume: length * width * height
        };

        // Clear existing warehouse
        this.clearWarehouse();

        // Create warehouse structure
        this.createWarehouseStructure();

        // Update UI
        this.updateMetrics();

        this.showMessage(`倉庫「${name}」を作成しました (${length}m × ${width}m × ${height}m)`, 'success');
    }

    createWarehouseStructure() {
        if (!this.warehouse) return;

        const { length, width, height } = this.warehouse;

        // Floor
        const floorGeometry = new THREE.PlaneGeometry(length, width);
        const floorMaterial = new THREE.MeshLambertMaterial({
            color: this.isDarkMode ? 0x334155 : 0xf1f5f9,
            transparent: true,
            opacity: 0.8
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.rotation.x = -Math.PI / 2;
        floor.receiveShadow = true;
        floor.userData = { type: 'warehouse-floor' };
        this.scene.add(floor);

        // Walls
        const wallMaterial = new THREE.MeshLambertMaterial({
            color: this.isDarkMode ? 0x475569 : 0xe2e8f0,
            transparent: true,
            opacity: 0.7
        });

        // Back wall
        const backWallGeometry = new THREE.PlaneGeometry(length, height);
        const backWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        backWall.position.set(0, height / 2, -width / 2);
        backWall.userData = { type: 'warehouse-wall' };
        this.scene.add(backWall);

        // Front wall
        const frontWall = new THREE.Mesh(backWallGeometry, wallMaterial);
        frontWall.position.set(0, height / 2, width / 2);
        frontWall.rotation.y = Math.PI;
        frontWall.userData = { type: 'warehouse-wall' };
        this.scene.add(frontWall);

        // Left wall
        const sideWallGeometry = new THREE.PlaneGeometry(width, height);
        const leftWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        leftWall.position.set(-length / 2, height / 2, 0);
        leftWall.rotation.y = Math.PI / 2;
        leftWall.userData = { type: 'warehouse-wall' };
        this.scene.add(leftWall);

        // Right wall
        const rightWall = new THREE.Mesh(sideWallGeometry, wallMaterial);
        rightWall.position.set(length / 2, height / 2, 0);
        rightWall.rotation.y = -Math.PI / 2;
        rightWall.userData = { type: 'warehouse-wall' };
        this.scene.add(rightWall);
    }

    clearWarehouse() {
        if (!this.scene) return;

        // Remove existing warehouse elements
        const objectsToRemove = [];
        this.scene.traverse((child) => {
            if (child.userData && child.userData.type &&
                (child.userData.type.includes('warehouse') ||
                 child.userData.type.includes('pallet') ||
                 child.userData.type === 'aisle')) {
                objectsToRemove.push(child);
            }
        });

        objectsToRemove.forEach(obj => {
            this.scene.remove(obj);
            if (obj.geometry) obj.geometry.dispose();
            if (obj.material) obj.material.dispose();
        });

        // Clear placed pallets
        this.placedPallets = [];

        // Re-add grid
        this.addGrid();
    }

    clearAll() {
        this.clearWarehouse();
        this.pallets = [];
        this.updatePalletList();
        this.updatePalletSelector();
        this.updateMetrics();
        this.hideCalculationResult();

        this.showMessage('すべてクリアしました', 'info');
    }

    // Pallet Management
    addPallet() {
        const palletName = prompt('パレット名を入力してください:');
        if (!palletName) return;

        const length = parseFloat(prompt('長さ (m):', '1.1'));
        if (isNaN(length)) return;

        const width = parseFloat(prompt('幅 (m):', '1.1'));
        if (isNaN(width)) return;

        const height = parseFloat(prompt('高さ (m):', '1.1'));
        if (isNaN(height)) return;

        const pallet = {
            id: ++this.currentPalletId,
            name: palletName,
            length: length,
            width: width,
            height: height,
            volume: length * width * height
        };

        this.pallets.push(pallet);
        this.updatePalletList();
        this.updatePalletSelector();

        this.showMessage(`パレット「${palletName}」を追加しました`, 'success');
    }

    updatePalletList() {
        const container = document.getElementById('palletList');
        container.innerHTML = '';

        if (this.pallets.length === 0) {
            container.innerHTML = '<p class="no-pallets">パレットがありません。追加してください。</p>';
            return;
        }

        this.pallets.forEach((pallet, index) => {
            const palletElement = document.createElement('div');
            palletElement.className = 'pallet-item';

            palletElement.innerHTML = `
                <div class="pallet-info">
                    <h3>${pallet.name}</h3>
                    <p>寸法: ${pallet.length}×${pallet.width}×${pallet.height}m</p>
                    <p>体積: ${pallet.volume.toFixed(2)}m³</p>
                </div>
                <div class="pallet-actions">
                    <button class="btn btn-sm btn-primary" onclick="app.editPallet(${index})">編集</button>
                    <button class="btn btn-sm btn-danger" onclick="app.deletePallet(${index})">削除</button>
                </div>
            `;

            container.appendChild(palletElement);
        });
    }

    editPallet(index) {
        const pallet = this.pallets[index];
        if (!pallet) return;

        const newName = prompt('パレット名:', pallet.name);
        if (!newName) return;

        const newLength = parseFloat(prompt('長さ (m):', pallet.length));
        if (isNaN(newLength)) return;

        const newWidth = parseFloat(prompt('幅 (m):', pallet.width));
        if (isNaN(newWidth)) return;

        const newHeight = parseFloat(prompt('高さ (m):', pallet.height));
        if (isNaN(newHeight)) return;

        pallet.name = newName;
        pallet.length = newLength;
        pallet.width = newWidth;
        pallet.height = newHeight;
        pallet.volume = newLength * newWidth * newHeight;

        this.updatePalletList();
        this.updatePalletSelector();

        this.showMessage(`パレット「${pallet.name}」を更新しました`, 'success');
    }

    deletePallet(index) {
        const pallet = this.pallets[index];
        if (!pallet) return;

        if (confirm(`パレット「${pallet.name}」を削除しますか？`)) {
            this.pallets.splice(index, 1);
            this.updatePalletList();
            this.updatePalletSelector();

            this.showMessage(`パレット「${pallet.name}」を削除しました`, 'success');
        }
    }

    updatePalletSelector() {
        const selector = document.getElementById('selectedPallet');
        selector.innerHTML = '<option value="">パレットを選択</option>';

        this.pallets.forEach((pallet, index) => {
            const option = document.createElement('option');
            option.value = index.toString();
            option.textContent = `${pallet.name} (${pallet.length}×${pallet.width}×${pallet.height}m)`;
            selector.appendChild(option);
        });
    }

    // Space Calculation
    calculateSpace() {
        if (!this.warehouse) {
            this.showMessage('まず倉庫を作成してください', 'error');
            return;
        }

        const selectedPalletIndex = document.getElementById('selectedPallet').value;
        if (selectedPalletIndex === '') {
            this.showMessage('パレットを選択してください', 'error');
            return;
        }

        const pallet = this.pallets[parseInt(selectedPalletIndex)];
        const quantity = parseInt(document.getElementById('palletQuantity').value);
        const stackingMode = document.getElementById('stackingMode').value;
        const maxStackHeight = parseFloat(document.getElementById('maxStackHeight').value);

        if (!pallet) {
            this.showMessage('選択されたパレットが見つかりません', 'error');
            return;
        }

        if (quantity <= 0) {
            this.showMessage('数量は1以上を入力してください', 'error');
            return;
        }

        // Calculate stacking levels
        let stackingLevels = 1;
        if (stackingMode === 'stack' || stackingMode === 'auto') {
            const maxLevelsByHeight = Math.floor(this.warehouse.height / pallet.height);
            const maxLevelsByStackHeight = Math.floor(maxStackHeight / pallet.height);
            stackingLevels = Math.min(maxLevelsByHeight, maxLevelsByStackHeight);

            if (stackingMode === 'auto' && stackingLevels < 2) {
                stackingLevels = 1;
            }
        }

        // Calculate required area
        const palletsPerStack = quantity;
        const stacksNeeded = Math.ceil(palletsPerStack / stackingLevels);
        const palletArea = pallet.length * pallet.width;
        const requiredArea = stacksNeeded * palletArea;

        // Calculate placement efficiency
        const warehouseArea = this.warehouse.length * this.warehouse.width;
        const efficiency = warehouseArea > 0 ? (requiredArea / warehouseArea) * 100 : 0;

        // Store calculation results
        this.lastCalculation = {
            pallet: pallet,
            quantity: quantity,
            stackingLevels: stackingLevels,
            requiredArea: requiredArea,
            stacksNeeded: stacksNeeded,
            efficiency: efficiency
        };

        // Update UI
        document.getElementById('requiredArea').textContent = requiredArea.toFixed(2);
        document.getElementById('stackingLevels').textContent = stackingLevels.toString();
        document.getElementById('placementEfficiency').textContent = efficiency.toFixed(1);
        document.getElementById('calculationResult').style.display = 'block';

        this.showMessage('スペース計算が完了しました', 'success');
    }

    hideCalculationResult() {
        document.getElementById('calculationResult').style.display = 'none';
    }

    // Auto Placement
    autoPlacePallets() {
        if (!this.warehouse) {
            this.showMessage('まず倉庫を作成してください', 'error');
            return;
        }

        if (!this.lastCalculation) {
            this.showMessage('まずスペース計算を実行してください', 'error');
            return;
        }

        const algorithm = document.getElementById('placementAlgorithm').value;
        const aisleWidth = parseFloat(document.getElementById('aisleWidth').value);

        this.showMessage('自動配置を実行中...', 'info');

        // Clear existing placed pallets
        this.clearPlacedPallets();

        // Generate placement positions based on algorithm
        let positions = [];
        switch (algorithm) {
            case 'grid':
                positions = this.calculateGridPlacement(aisleWidth);
                break;
            case 'density':
                positions = this.calculateDensityPlacement(aisleWidth);
                break;
            case 'efficiency':
                positions = this.calculateEfficiencyPlacement(aisleWidth);
                break;
            case 'accessibility':
                positions = this.calculateAccessibilityPlacement(aisleWidth);
                break;
            default:
                positions = this.calculateGridPlacement(aisleWidth);
        }

        // Place pallets at calculated positions
        let placedCount = 0;
        for (const position of positions) {
            if (placedCount >= this.lastCalculation.quantity) break;

            this.placePalletAt(position);
            placedCount++;
        }

        // Create aisles
        this.createAisles(aisleWidth);

        // Update UI
        this.updateMetrics();

        const remaining = this.lastCalculation.quantity - placedCount;
        if (remaining > 0) {
            this.showMessage(`自動配置が完了しました。${placedCount}個配置、${remaining}個が配置できませんでした`, 'warning');
        } else {
            this.showMessage(`自動配置が完了しました。${placedCount}個の全てのパレットを配置しました`, 'success');
        }
    }

    calculateGridPlacement(aisleWidth) {
        const positions = [];
        const palletLength = this.lastCalculation.pallet.length;
        const palletWidth = this.lastCalculation.pallet.width;

        const effectiveLength = this.warehouse.length - aisleWidth;
        const effectiveWidth = this.warehouse.width - aisleWidth;

        const palletsPerRow = Math.floor(effectiveLength / palletLength);
        const palletsPerColumn = Math.floor(effectiveWidth / palletWidth);

        if (palletsPerRow <= 0 || palletsPerColumn <= 0) return positions;

        for (let rowIndex = 0; rowIndex < palletsPerColumn; rowIndex++) {
            const y = -this.warehouse.width / 2 + aisleWidth / 2 + rowIndex * palletWidth + palletWidth / 2;

            for (let colIndex = 0; colIndex < palletsPerRow; colIndex++) {
                const x = -this.warehouse.length / 2 + aisleWidth / 2 + colIndex * palletLength + palletLength / 2;

                positions.push({
                    x: x,
                    y: y,
                    z: this.lastCalculation.pallet.height * this.lastCalculation.stackingLevels / 2
                });
            }
        }

        return positions;
    }

    calculateDensityPlacement(aisleWidth) {
        const positions = [];
        const palletLength = this.lastCalculation.pallet.length;
        const palletWidth = this.lastCalculation.pallet.width;

        const totalLength = this.warehouse.length;
        const totalWidth = this.warehouse.width;

        // Find optimal configuration for maximum density
        let bestConfig = { palletsPerRow: 0, palletsPerColumn: 0 };
        let maxDensity = 0;

        for (let aisleCount = 1; aisleCount <= 5; aisleCount++) {
            const effectiveLength = totalLength - (aisleCount * aisleWidth);
            const effectiveWidth = totalWidth - (aisleCount * aisleWidth);

            const palletsPerRow = Math.floor(effectiveLength / palletLength);
            const palletsPerColumn = Math.floor(effectiveWidth / palletWidth);

            if (palletsPerRow > 0 && palletsPerColumn > 0) {
                const totalPallets = palletsPerRow * palletsPerColumn;
                const density = totalPallets / (totalLength * totalWidth);

                if (density > maxDensity) {
                    maxDensity = density;
                    bestConfig.palletsPerRow = palletsPerRow;
                    bestConfig.palletsPerColumn = palletsPerColumn;
                }
            }
        }

        // Generate positions with optimal spacing
        const aisleSpacing = (this.warehouse.length - bestConfig.palletsPerRow * palletLength) / (bestConfig.palletsPerRow + 1);
        const widthAisleSpacing = (this.warehouse.width - bestConfig.palletsPerColumn * palletWidth) / (bestConfig.palletsPerColumn + 1);

        for (let rowIndex = 0; rowIndex < bestConfig.palletsPerColumn; rowIndex++) {
            const y = -this.warehouse.width / 2 + widthAisleSpacing + rowIndex * (palletWidth + widthAisleSpacing) + palletWidth / 2;

            for (let colIndex = 0; colIndex < bestConfig.palletsPerRow; colIndex++) {
                const x = -this.warehouse.length / 2 + aisleSpacing + colIndex * (palletLength + aisleSpacing) + palletLength / 2;

                positions.push({
                    x: x,
                    y: y,
                    z: this.lastCalculation.pallet.height * this.lastCalculation.stackingLevels / 2
                });
            }
        }

        return positions;
    }

    calculateEfficiencyPlacement(aisleWidth) {
        const positions = this.calculateGridPlacement(aisleWidth);

        // Sort by efficiency (closer to center)
        positions.forEach(pos => {
            const distanceFromCenter = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
            pos.efficiency = 1 / (1 + distanceFromCenter);
        });

        positions.sort((a, b) => b.efficiency - a.efficiency);
        return positions;
    }

    calculateAccessibilityPlacement(aisleWidth) {
        const positions = this.calculateGridPlacement(aisleWidth);

        // Sort by accessibility (closer to entrance at 0,0)
        positions.forEach(pos => {
            pos.distance = Math.sqrt(pos.x * pos.x + pos.y * pos.y);
        });

        positions.sort((a, b) => a.distance - b.distance);
        return positions;
    }

    placePalletAt(position) {
        const pallet = this.lastCalculation.pallet;
        const stackingLevels = this.lastCalculation.stackingLevels;

        // Create group for stacked pallets
        const group = new THREE.Group();

        // Colors for different stacking levels
        const levelColors = [
            0x10b981, // Base level - green
            0x3b82f6, // Level 2 - blue
            0xf59e0b, // Level 3 - yellow
            0xef4444, // Level 4 - red
            0x8b5cf6, // Level 5 - purple
            0x06b6d4  // Level 6+ - cyan
        ];

        // Create individual pallet meshes for each stacking level
        for (let level = 0; level < stackingLevels; level++) {
            const geometry = new THREE.BoxGeometry(
                pallet.length * 0.95,
                pallet.height * 0.9,
                pallet.width * 0.95
            );

            const color = levelColors[Math.min(level, levelColors.length - 1)];
            const material = new THREE.MeshLambertMaterial({
                color: color,
                transparent: true,
                opacity: 0.8
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(0, level * pallet.height, 0);
            mesh.castShadow = true;
            mesh.receiveShadow = true;

            group.add(mesh);
        }

        // Set group position
        group.position.set(position.x, position.z, position.y);

        // Store pallet data
        const palletData = {
            id: Date.now() + Math.random(),
            pallet: pallet,
            position: position,
            stackingLevels: stackingLevels,
            mesh: group
        };

        group.userData = { type: 'placed-pallet', palletData: palletData };

        this.scene.add(group);
        this.placedPallets.push(palletData);
    }

    clearPlacedPallets() {
        this.placedPallets.forEach(palletData => {
            if (palletData.mesh) {
                this.scene.remove(palletData.mesh);
                // Dispose of geometries and materials
                palletData.mesh.traverse((child) => {
                    if (child.geometry) child.geometry.dispose();
                    if (child.material) child.material.dispose();
                });
            }
        });

        this.placedPallets = [];
    }

    createAisles(aisleWidth) {
        // Remove existing aisles
        const existingAisles = [];
        this.scene.traverse((child) => {
            if (child.userData && child.userData.type === 'aisle') {
                existingAisles.push(child);
            }
        });

        existingAisles.forEach(aisle => {
            this.scene.remove(aisle);
            if (aisle.geometry) aisle.geometry.dispose();
            if (aisle.material) aisle.material.dispose();
        });

        if (!this.lastCalculation) return;

        const palletLength = this.lastCalculation.pallet.length;
        const palletWidth = this.lastCalculation.pallet.width;

        const effectiveLength = this.warehouse.length - aisleWidth;
        const effectiveWidth = this.warehouse.width - aisleWidth;

        const palletsPerRow = Math.floor(effectiveLength / palletLength);
        const palletsPerColumn = Math.floor(effectiveWidth / palletWidth);

        // Create aisle material
        const aisleMaterial = new THREE.MeshLambertMaterial({
            color: this.isDarkMode ? 0x4a5568 : 0xe2e8f0,
            transparent: true,
            opacity: 0.6
        });

        // Horizontal aisles
        for (let row = 1; row < palletsPerColumn; row++) {
            const y = -this.warehouse.width / 2 + aisleWidth / 2 + row * palletWidth + (row - 0.5) * aisleWidth + palletWidth / 2;

            const aisleGeometry = new THREE.PlaneGeometry(this.warehouse.length, aisleWidth);
            const aisle = new THREE.Mesh(aisleGeometry, aisleMaterial);
            aisle.rotation.x = -Math.PI / 2;
            aisle.position.set(0, 0.01, y); // Slightly above floor
            aisle.userData = { type: 'aisle' };
            this.scene.add(aisle);
        }

        // Vertical aisles
        for (let col = 1; col < palletsPerRow; col++) {
            const x = -this.warehouse.length / 2 + aisleWidth / 2 + col * palletLength + (col - 0.5) * aisleWidth + palletLength / 2;

            const aisleGeometry = new THREE.PlaneGeometry(aisleWidth, this.warehouse.width);
            const aisle = new THREE.Mesh(aisleGeometry, aisleMaterial);
            aisle.rotation.x = -Math.PI / 2;
            aisle.position.set(x, 0.01, 0); // Slightly above floor
            aisle.userData = { type: 'aisle' };
            this.scene.add(aisle);
        }
    }

    // 3D View Controls
    resetView() {
        if (this.controls) {
            this.camera.position.set(30, 25, 30);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    setTopView() {
        if (this.controls) {
            this.camera.position.set(0, 50, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    setSideView() {
        if (this.controls) {
            this.camera.position.set(50, 15, 0);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    setIsoView() {
        if (this.controls) {
            this.camera.position.set(30, 25, 30);
            this.controls.target.set(0, 0, 0);
            this.controls.update();
        }
    }

    // UI Updates
    updateMetrics() {
        if (!this.warehouse) {
            document.getElementById('totalArea').textContent = '0';
            document.getElementById('usedArea').textContent = '0';
            document.getElementById('utilizationRate').textContent = '0%';
            document.getElementById('placedPallets').textContent = '0';
            return;
        }

        const totalArea = this.warehouse.totalArea;
        const usedArea = this.placedPallets.length * this.lastCalculation?.pallet.length * this.lastCalculation?.pallet.width || 0;
        const utilizationRate = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

        document.getElementById('totalArea').textContent = totalArea.toFixed(1);
        document.getElementById('usedArea').textContent = usedArea.toFixed(1);
        document.getElementById('utilizationRate').textContent = utilizationRate.toFixed(1) + '%';
        document.getElementById('placedPallets').textContent = this.placedPallets.length.toString();
    }

    // Message System
    setupMessageSystem() {
        this.messageContainer = document.getElementById('messageContainer');
    }

    showMessage(message, type = 'info') {
        if (!this.messageContainer) return;

        const messageElement = document.createElement('div');
        messageElement.className = `message ${type}`;
        messageElement.textContent = message;

        this.messageContainer.appendChild(messageElement);

        // Auto remove after 5 seconds
        setTimeout(() => {
            if (messageElement.parentNode) {
                messageElement.remove();
            }
        }, 5000);
    }

    // Help System
    showHelp() {
        const helpContent = `
            <h3>📋 使用方法</h3>
            <ul>
                <li><strong>倉庫作成:</strong> 寸法を入力して倉庫を作成</li>
                <li><strong>パレット管理:</strong> パレットを追加・編集・削除</li>
                <li><strong>スペース計算:</strong> パレットを選択して必要スペースを計算</li>
                <li><strong>自動配置:</strong> アルゴリズムを選択して自動配置</li>
                <li><strong>3D操作:</strong> マウスで視点変更、ホイールでズーム</li>
            </ul>
            <h3>🎯 配置アルゴリズム</h3>
            <ul>
                <li><strong>グリッド:</strong> 規則的な配置</li>
                <li><strong>密度優先:</strong> 最大限のスペース利用</li>
                <li><strong>効率優先:</strong> アクセスしやすさを考慮</li>
                <li><strong>アクセシビリティ:</strong> 入出庫のしやすさ重視</li>
            </ul>
        `;

        const modal = document.createElement('div');
        modal.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-color: rgba(0, 0, 0, 0.5);
            display: flex;
            justify-content: center;
            align-items: center;
            z-index: 10000;
        `;

        modal.innerHTML = `
            <div style="
                background: white;
                padding: 2rem;
                border-radius: 0.5rem;
                max-width: 600px;
                max-height: 80vh;
                overflow-y: auto;
                position: relative;
            ">
                <button style="
                    position: absolute;
                    top: 1rem;
                    right: 1rem;
                    background: none;
                    border: none;
                    font-size: 1.5rem;
                    cursor: pointer;
                " onclick="this.closest('div').parentElement.remove()">×</button>
                ${helpContent}
                <div style="text-align: center; margin-top: 1rem;">
                    <button class="btn btn-primary" onclick="this.closest('div').parentElement.remove()">閉じる</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
    }

    // Animation Loop
    animate() {
        requestAnimationFrame(() => this.animate());

        if (this.controls) {
            this.controls.update();
        }

        if (this.renderer && this.scene && this.camera) {
            this.renderer.render(this.scene, this.camera);
        }
    }

    // Window Resize Handler
    onWindowResize() {
        const container = document.getElementById('warehouse3D');
        if (this.camera && this.renderer) {
            this.camera.aspect = container.clientWidth / container.clientHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(container.clientWidth, container.clientHeight);
        }
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.app = new WarehouseSpaceApp();
});