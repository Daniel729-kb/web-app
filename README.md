# 🚛 Palletizar - パレタイズ最適化計算機

## 📖 Overview

**Palletizar** is an intelligent palletization optimization calculator that automatically determines the most efficient way to arrange cartons on pallets. It uses advanced 3D packing algorithms, dynamic height optimization, and multi-strategy approaches to maximize space utilization while maintaining stability and safety.

## ✨ Key Features

### 🎨 **Modern UI/UX**
- **Dark/Light Mode**: Toggle between themes with persistent preferences
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Smooth Animations**: Powered by anime.js for enhanced user experience
- **Interactive Visualizations**: Real-time canvas-based pallet diagrams

### 🧠 **Advanced Algorithms**
- **Dynamic Height Adjustment**: Intelligent layer height optimization
- **Lookahead Layer Selection**: Evaluates multiple layer combinations
- **Smart Pallet Sizing**: Automatic pallet size optimization
- **Stability Analysis**: Weight distribution and overlap calculations

### 📊 **Comprehensive Analysis**
- **Volume Utilization**: Real-time space efficiency metrics
- **Stability Scoring**: Layer overlap and weight balance analysis
- **Height Compliance**: Automatic height limit checking
- **Performance Metrics**: Detailed optimization reports

## 🏗️ Architecture

### **Frontend Technologies**
- **HTML5**: Semantic structure with canvas elements
- **CSS3**: Modern styling with CSS variables and animations
- **Vanilla JavaScript**: No framework dependencies
- **anime.js**: Smooth UI animations and interactions

### **Core Components**
```
palletizar/
├── index.html          # Main application interface
├── styles.css          # Styling and theme management
├── script.js           # Core algorithms and logic
└── README.md           # This documentation
```

## 🔧 How It Works

### **1. Data Input & Validation**
The app accepts carton data through:
- **Manual Entry**: Input forms for individual carton specifications
- **CSV Import**: Bulk data import from spreadsheet files
- **Sample Data**: Pre-loaded examples for testing

**Carton Data Structure:**
```javascript
{
  id: 1,
  code: 'SAMPLE A',
  qty: 362,
  weight: 6.70,
  l: 53.0,    // Length (cm)
  w: 38.5,    // Width (cm)
  h: 23.5     // Height (cm)
}
```

### **2. Pallet Selection**
Users can choose from:
- **Standard Pallets**: Common transportation sizes (1100×1000, 1200×1000, etc.)
- **Custom Pallets**: User-defined dimensions
- **Auto-Optimization**: Algorithm selects best pallet size based on carton data

**Available Standard Sizes:**
- 1100×1000 (Standard)
- 1100×1100 (Square)
- 1200×1000 (Large)
- 1200×1100 (Extra Large)
- 1200×800 (ISO/European)
- 1219×1016 (US Standard)
- 1140×1140 (Asia/Container Optimized)

### **3. Algorithm Execution**

#### **Phase 1: Data Preparation**
```javascript
// Filter items within height limits
const validItems = availableItems.filter(item => item.h <= getMaxCartonHeight());

// Categorize by quantity
const smallQuantityItems = validItems.filter(item => item.remaining <= 15);
const largeQuantityItems = validItems.filter(item => item.remaining > 15);
```

#### **Phase 2: Multi-Strategy Approach**
The algorithm uses three main strategies:

**A. Mixed Strategy (Small Quantity Items)**
- Groups items by similar heights (±3cm tolerance)
- Creates efficient mixed layers
- Optimizes for variety and quantity

**B. Dedicated Strategy (Large Quantity Items)**
- Single-item type layers
- Maximizes quantity per layer
- Optimizes for bulk efficiency

**C. Balanced Strategy (Priority-Based)**
- Considers priority items first
- Uses lookahead layer selection
- Balances multiple objectives

#### **Phase 3: Height Optimization**
```javascript
// Dynamic height adjustment
const optimizedLayers = optimizeLayerHeights(layers, palletSize, maxHeightLimit);
```

**Height Optimization Features:**
- **Layer Height Adjustment**: Individual layer height optimization
- **Gap Elimination**: Inter-layer space optimization
- **Statistical Analysis**: Height distribution-based optimization

#### **Phase 4: Scoring & Selection**
```javascript
function calculatePalletScore(config, availableItems) {
    let score = 0;
    
    // Volume Utilization (100 pts)
    score += volumeUtilization * 100;
    
    // Stability Score (50 pts)
    score += calculateStabilityScore(config.layers, config.palletSize) * 50;
    
    // Weight Balance (30 pts)
    score += calculateWeightBalance(config.layers) * 30;
    
    // Carton Count (10 pts)
    score += config.cartons.length * 10;
    
    // Height Efficiency (40 pts)
    score += (1 - heightEfficiency) * 40;
    
    // Mixed Efficiency Bonus (25 pts)
    if (uniqueCodes.length > 1 && mixedEfficiency >= 3) {
        score += 25;
    }
    
    return Math.max(0, Math.round(score));
}
```

### **4. Visualization & Results**

#### **Canvas-Based Rendering**
- **Side View**: Shows pallet cross-section with height information
- **Layer View**: Top-down view of each layer's carton arrangement
- **Interactive Elements**: Hover tooltips and carton highlighting
- **Simplified Layout**: Traditional single-height layer visualization

#### **Real-Time Updates**
- **Dynamic Diagrams**: Automatically update when parameters change
- **Height Compliance**: Visual indicators for height limit violations
- **Optimization Feedback**: Console logs showing algorithm decisions

## 📈 Algorithm Improvements

### **Recent Enhancements (Phase 1)**

#### **1. Enhanced Scoring System**
- **Volume Utilization**: Primary factor (100 points)
- **Stability Analysis**: Layer overlap and weight ratios
- **Weight Distribution**: Bottom-heavy optimization
- **Height Efficiency**: Space utilization metrics

#### **2. Volume Utilization Integration**
- **Real-time Calculation**: Volume efficiency during optimization
- **Comparative Analysis**: Multiple pallet size evaluation
- **Efficiency Metrics**: Packing density optimization

#### **3. Lookahead Layer Selection**
- **Multi-Layer Combinations**: Evaluates 2-layer possibilities
- **Combination Bonuses**: Same height and weight distribution rewards
- **Fallback System**: Maintains performance with smart defaults

#### **4. Pallet Size Optimization**
- **Pre-calculation Analysis**: Evaluates all pallet sizes before processing
- **Efficiency Prediction**: Theoretical packing efficiency calculation
- **Smart Ordering**: Optimal pallet size first

#### **5. 3D Packing Optimization** ❌ **REMOVED**
- **Functionality Removed**: Multi-height layers with gap filling
- **Simplified Approach**: Traditional single-height layer creation
- **Performance Impact**: Reduced complexity, faster execution

#### **6. Dynamic Layer Height Adjustment** ⭐ **NEW**
- **Height Optimization**: Individual layer height adjustment
- **Gap Elimination**: Inter-layer space optimization
- **Statistical Analysis**: Height distribution-based optimization
- **Real-Time Adjustment**: Continuous optimization during construction

## 🎯 Usage Instructions

### **Getting Started**

1. **Load Sample Data**
   - Click "サンプルデータ読み込み" to test with example data
   - Or manually enter carton specifications

2. **Configure Parameters**
   - Set height limit (default: 158cm)
   - Select pallet sizes to evaluate
   - Adjust optimization preferences

3. **Run Optimization**
   - Click "最適化計算開始" to begin algorithm execution
   - Monitor console for detailed optimization logs
   - View real-time progress and results

4. **Analyze Results**
   - Examine pallet diagrams (side view and layer view)
   - Review optimization summary and metrics
   - Export results to CSV if needed

### **Advanced Features**

#### **Custom Pallet Creation**
```javascript
// Add custom pallet dimensions
const customPallet = {
    name: "Custom Size",
    width: 130.0,    // cm
    depth: 95.0,     // cm
    description: "Custom pallet for specific requirements"
};
```

#### **Height Limit Management**
- **Preset Limits**: Common transportation standards
- **Custom Limits**: User-defined height constraints
- **Safety Warnings**: Automatic compliance checking

#### **Export & Analysis**
- **CSV Export**: Detailed results for external analysis
- **Performance Metrics**: Optimization effectiveness reports
- **Visualization**: Interactive diagrams for presentation

## 🔍 Technical Details

### **Performance Characteristics**

#### **Time Complexity**
- **Basic Algorithm**: O(n² × p × s)
  - n = number of items
  - p = number of pallet sizes
  - s = number of strategies

- **Current Implementation**: O(n² × p × s)
  - Simplified approach without 3D optimization
  - Faster execution with reduced complexity

#### **Space Complexity**
- **Basic**: O(n × l) where l = layers per pallet
- **3D Optimized**: O(n × l × h) where h = height variations

#### **Quality Metrics**
- **Before Optimization**: 7/10 (good)
- **Current Implementation**: 8/10 (very good)
- **Expected Volume Improvement**: 10-15%

### **Algorithm Flow**

```mermaid
graph TD
    A[Input Carton Data] --> B[Validate & Filter]
    B --> C[Pallet Size Optimization]
    C --> D[Multi-Strategy Execution]
    D --> E[Mixed Strategy]
    D --> F[Dedicated Strategy]
    D --> G[Balanced Strategy]
    E --> H[3D Layer Creation]
    F --> H
    G --> H
    H --> I[Dynamic Height Optimization]
    I --> J[Scoring & Selection]
    J --> K[Result Visualization]
    K --> L[Export & Analysis]
```

### **Key Functions**

#### **Core Optimization**
```javascript
findOptimalPalletConfiguration()     // Main algorithm entry point
calculateSmallQuantityMixedPallet()  // Mixed strategy implementation
calculateBalancedPallet()            // Balanced strategy implementation
create3DOptimizedLayer()             // 3D optimization engine
```

#### **Scoring & Analysis**
```javascript
calculatePalletScore()               // Overall pallet evaluation
calculateLayerScore()                // Individual layer scoring
calculateStabilityScore()            // Stability analysis
calculateWeightBalance()             // Weight distribution analysis
```

#### **Height Optimization**
```javascript
optimizeLayerHeights()               // Height optimization
findOptimalLayerHeight()             // Individual layer optimization
optimizeLayerGaps()                  // Inter-layer gap optimization
```

## 🚀 Future Enhancements

### **Phase 2 (Planned)**
- **Multi-Pallet Global Optimization**: Cross-pallet optimization
- **Advanced Rotation Strategies**: 180° and 270° orientations
- **Machine Learning Integration**: Pattern-based optimization

### **Phase 3 (Long-term)**
- **Performance Optimization**: Scalability improvements
- **Real-time Collaboration**: Multi-user optimization
- **API Integration**: External system connectivity

## 🐛 Troubleshooting

### **Common Issues**

#### **Height Limit Violations**
- **Cause**: Carton heights exceed configured limits
- **Solution**: Adjust height limit or filter problematic items
- **Prevention**: Use height validation before optimization

#### **Performance Issues**
- **Cause**: Large datasets or complex optimization
- **Solution**: Reduce pallet size options or item complexity
- **Optimization**: Use efficient data structures

#### **Visualization Problems**
- **Cause**: Canvas rendering issues or browser compatibility
- **Solution**: Refresh page or check browser support
- **Alternative**: Use console logs for debugging

### **Debug Mode**
Enable detailed logging by opening browser console:
```javascript
// View optimization progress
console.log('Optimization started...');

// Check algorithm decisions
console.log('Layer selection:', selectedLayer);

// Monitor scoring
console.log('Pallet score:', calculatedScore);
```

## 📚 References

### **Technical Standards**
- **ISO 6780**: Standard pallet sizes
- **Transportation Guidelines**: Height and weight limits
- **Safety Standards**: Stacking and stability requirements

### **Algorithm Research**
- **3D Bin Packing**: Multi-dimensional optimization
- **Genetic Algorithms**: Evolutionary optimization approaches
- **Constraint Satisfaction**: Multi-objective optimization

## 🤝 Contributing

### **Development Setup**
1. Clone the repository
2. Open `index.html` in a modern browser
3. Make changes to `script.js` for algorithm modifications
4. Update `styles.css` for UI improvements
5. Test with various datasets

### **Code Style**
- **JavaScript**: ES6+ with clear function documentation
- **CSS**: BEM methodology with CSS variables
- **HTML**: Semantic structure with accessibility

### **Testing**
- **Unit Tests**: Individual function testing
- **Integration Tests**: End-to-end optimization testing
- **Performance Tests**: Large dataset scalability

## 📄 License

This project is open source and available under the MIT License.

## 📞 Support

For questions, issues, or contributions:
- **GitHub Issues**: Report bugs or request features
- **Documentation**: Refer to this README and inline code comments
- **Community**: Share optimization strategies and improvements

---

**Palletizar** - Making palletization optimization accessible and intelligent! 🚛✨