# AutomateCLP - 3D Container Loading Planner

A sophisticated web application for optimizing 3D container loading with intelligent pallet stacking algorithms.

## 🚀 Features

### Core Functionality
- **2D Floor Placement**: Intelligent grid-based placement of pallets on container floor
- **3D Stacking Optimization**: Advanced algorithm for stacking pallets vertically
- **Multi-Container Support**: 20ft, 40ft, and 40HQ container types
- **Real-time Visualization**: Interactive 2D layout with stacking indicators
- **Drag & Drop Interface**: Manual pallet adjustment capabilities

### Advanced Stacking System
- **Permission-Based Stacking**: Respects `canStackAbove` and `canStackBelow` constraints
- **Weight Constraint Validation**: Ensures structural integrity with configurable limits
- **Height Limit Compliance**: Prevents exceeding container height restrictions
- **Identical Pallet Optimization**: Prioritizes stacking of same-type pallets
- **Multi-Level Stacking**: Supports complex stacking hierarchies

### Analysis & Debug Tools
- **Stacking Performance Analysis**: Detailed metrics and statistics
- **Permission Compatibility Checking**: Identifies stacking constraint issues
- **Stability Calculations**: Center of gravity and stability analysis
- **Weight Distribution Analysis**: Comprehensive weight constraint evaluation

## 🎯 Quick Start

### 1. Add Pallet Types
```
Length: 100cm
Width: 125cm  
Height: 100cm
Weight: 600kg
Quantity: 40
Stacking: ✓ Above ✓ Below
```

### 2. Configure Container
- Select container type (20ft/40ft/40HQ)
- Set clearance requirements
- Enable 3D stacking

### 3. Calculate Loading
- Click "Calculate Loading" for automatic optimization
- Review stacking results and statistics
- Use debug tools for detailed analysis

## 📊 Algorithm Overview

### 2D Floor Placement
- **Grid Strategy**: Places pallets in organized grid pattern
- **Minimal Placement**: Limits floor pallets to maximize stacking potential
- **Clearance Handling**: Respects spacing requirements between pallets

### 3D Stacking Algorithm
- **Iterative Optimization**: Finds best stacking positions for each pallet
- **Multi-Criteria Scoring**: Evaluates height, weight, and size compatibility
- **Constraint Validation**: Ensures all physical and permission constraints are met
- **Identical Pallet Bonus**: Prioritizes stacking of same-type pallets

### Stacking Permissions
- **上段 (Upper Level)**: Pallet can be stacked on top of others
- **下段 (Lower Level)**: Pallet can support other pallets stacked on top
- **Visual Indicators**: Clear labeling of stacking levels in Japanese

## 🔧 Configuration

### Stacking Parameters
```javascript
MAX_STACK_WEIGHT: 2500kg        // Maximum stack weight
WEIGHT_RATIO_LIMIT: 3.0         // Stacked/base weight ratio
HEIGHT_PREFERENCE: 0.5          // Height preference in scoring
PERFECT_FIT_BONUS: 200          // Bonus for exact size match
```

### Container Types
- **20ft**: 589.8 × 235.0 × 235.0 cm
- **40ft**: 1203.2 × 235.0 × 235.0 cm  
- **40HQ**: 1203.2 × 235.0 × 228.8 cm

## 📈 Performance Metrics

### Algorithm Efficiency
- **Time Complexity**: O(n² × m) for 3D stacking optimization
- **Space Complexity**: O(n) linear storage for pallet data
- **Optimization Strategy**: Greedy approach with multi-criteria scoring

### Typical Results
- **Floor Utilization**: 60-80% depending on pallet sizes
- **Stacking Efficiency**: 70-90% of remaining pallets stacked
- **Multi-Level Stacks**: 2-4 levels common with identical pallets

## 🛠️ Debug & Analysis

### Debug Functions
```javascript
debug.testStacking()              // Basic stacking analysis
debug.analyzeStackingPermissions() // Permission compatibility
debug.analyzeIdenticalPallets()    // Identical pallet analysis
debug.testMultiLevelStacking()     // Multi-level stack analysis
```

### Analysis Features
- **Stacking Level Distribution**: Shows pallets by stacking level
- **Weight Distribution**: Analyzes weight constraints and ratios
- **Permission Analysis**: Identifies stacking permission issues
- **Stability Metrics**: Calculates center of gravity and stability

## 🎨 User Interface

### Visual Features
- **Color-Coded Pallets**: Different colors for different pallet types
- **Stacking Indicators**: Clear visual markers for stacked pallets
- **Level Labels**: Japanese labels (上段/下段) for stacking levels
- **Interactive Controls**: Rotate and delete pallets with ease

### Dark Mode Support
- **Automatic Theme Detection**: Respects system preferences
- **Manual Toggle**: Easy switching between light and dark themes
- **Consistent Styling**: Maintains readability in both modes

## 📋 Usage Examples

### Basic Loading Scenario
1. Add pallet type: 100×125×100cm, 600kg, 40 pieces
2. Select 40ft container
3. Enable 3D stacking
4. Calculate loading
5. Review results: ~12 floor pallets, ~28 stacked pallets

### Complex Multi-Type Loading
1. Add multiple pallet types with different dimensions
2. Configure stacking permissions for each type
3. Set appropriate weight constraints
4. Run optimization and analyze results

### Debug Analysis
1. Run basic stacking test
2. Check permission compatibility
3. Analyze identical pallet performance
4. Review stability calculations

## 🔍 Technical Details

### Data Structures
- **Pallet Objects**: Complete 3D positioning and stacking information
- **Container Objects**: Standard container dimensions and constraints
- **Stacking References**: Bidirectional relationships between stacked pallets

### Algorithm Components
- **Grid Placement**: Efficient 2D floor utilization
- **Scoring System**: Multi-criteria evaluation for stacking positions
- **Constraint Validation**: Comprehensive checking of all limits
- **Reference Management**: Maintains stacking relationships

## 🚧 Limitations

### Current Constraints
- **Greedy Algorithm**: May not find global optimum
- **Single Iteration**: No backtracking or re-optimization
- **Fixed Parameters**: Limited dynamic adjustment

### Physical Constraints
- **Container Dimensions**: Hard limits on container size
- **Pallet Properties**: Fixed dimensions and weight
- **Stacking Permissions**: Pallet-specific constraints

## 🔮 Future Enhancements

### Planned Improvements
- **Multi-Objective Optimization**: Balance multiple optimization goals
- **Backtracking Algorithm**: Allow re-optimization of placements
- **Genetic Algorithm**: Evolutionary approach for better solutions
- **Machine Learning**: Learn from historical loading patterns

### Performance Optimizations
- **Spatial Indexing**: Faster neighbor finding
- **Parallel Processing**: Concurrent stacking attempts
- **Caching**: Optimize constraint calculations
- **Early Termination**: Stop at optimal solutions

## 📚 Documentation

For detailed technical documentation, see:
- [Algorithm Documentation](ALGORITHM_DOCUMENTATION.md) - Comprehensive algorithm analysis
- [API Reference](API_REFERENCE.md) - Function documentation
- [Configuration Guide](CONFIGURATION.md) - Parameter tuning guide

## 🤝 Contributing

### Development Setup
1. Clone the repository
2. Open `index.html` in a modern web browser
3. Use browser developer tools for debugging
4. Test with various pallet configurations

### Testing
- Use the built-in test cases for validation
- Test with different container types and pallet configurations
- Verify stacking permissions and constraints
- Check performance with large pallet quantities

## 📄 License

This project is open source and available under the MIT License.

## 🆘 Support

For issues and questions:
1. Check the debug tools for detailed analysis
2. Review the algorithm documentation
3. Test with simplified configurations
4. Verify all constraints and permissions

---

**AutomateCLP** - Optimizing container loading through intelligent 3D stacking algorithms.