# 3D Container Loading Algorithm Documentation

## Overview
This document describes the 3D container loading optimization algorithm implemented in the AutomateCLP application. The algorithm performs both 2D floor placement and 3D stacking to maximize container utilization while respecting physical constraints and stacking permissions.

## Core Algorithm Components

### 1. 2D Floor Placement (`packPallets2D`)
**Purpose**: Place a minimal number of pallets on the container floor to serve as bases for 3D stacking.

**Algorithm**:
- Uses simple grid placement strategy
- Limits floor placement to maximum 12 pallets to maximize stacking potential
- Calculates grid dimensions based on pallet size and clearance
- Places pallets in row-major order (left to right, top to bottom)

**Key Parameters**:
- `maxFloorPallets = Math.min(palletsToPlace.length, cols * rows, 12)`
- Grid calculation: `cols = Math.floor(container.length / (pallet.length + clearance))`

### 2. 3D Stacking (`perform3DStacking`)
**Purpose**: Stack remaining pallets on top of floor-placed pallets to maximize vertical space utilization.

**Algorithm**:
1. **Initialization**: Separate placed and unplaced pallets
2. **Iterative Stacking**: For each unplaced pallet, find the best base pallet
3. **Scoring System**: Evaluate potential stacking positions based on multiple criteria
4. **Constraint Checking**: Verify stacking permissions, weight limits, and height constraints

**Scoring Criteria**:
```javascript
let score = 1000 - topZ; // Prefer lower positions
if (pallet.weight === basePallet.weight) {
    score += 500; // Bonus for identical weight
}
if (orientation.length === basePallet.finalLength && orientation.width === basePallet.finalWidth) {
    score += 200; // Bonus for perfect fit
}
```

### 3. Stacking Permission System
**Purpose**: Respect pallet-specific stacking constraints.

**Implementation**:
- `canStackAbove`: Boolean indicating if other pallets can be stacked on top
- `canStackBelow`: Boolean indicating if this pallet can be stacked on other pallets
- Both permissions must be true for stacking to occur

**Validation**:
```javascript
if (!pallet.canStackBelow || !basePallet.canStackAbove) {
    continue; // Skip this combination
}
```

### 4. Weight Constraint System
**Purpose**: Ensure structural integrity by limiting stack weight.

**Implementation**:
- `getMaxStackWeight()`: Calculates maximum weight a base pallet can support
- `calculateStackWeight()`: Calculates total weight of existing stack
- Dynamic weight ratio limits for identical pallets

**Weight Calculation**:
```javascript
const totalWeight = calculateStackWeight(basePallet) + pallet.weight;
const maxStackWeight = getMaxStackWeight(basePallet);
if (totalWeight > maxStackWeight) {
    continue; // Skip this combination
}
```

### 5. Height Constraint System
**Purpose**: Ensure pallets fit within container height limits.

**Implementation**:
- `getTopZForBase()`: Calculates the Z-coordinate for the top of a stack
- Container height validation for each stacking attempt

**Height Calculation**:
```javascript
const topZ = getTopZForBase(basePallet);
const totalHeight = topZ + pallet.finalHeight;
if (totalHeight > container.height) {
    continue; // Skip this combination
}
```

## Data Structures

### Pallet Object
```javascript
{
    id: number,                    // Unique pallet type ID
    instance: number,              // Instance number within type
    palletNumber: number,          // Display number
    length: number,                // Length in cm
    width: number,                 // Width in cm
    height: number,                // Height in cm
    weight: number,                // Weight in kg
    canStackAbove: boolean,        // Stacking permission
    canStackBelow: boolean,        // Stacking permission
    color: string,                 // Display color
    placed: boolean,               // Placement status
    deleted: boolean,              // Deletion status
    x: number, y: number, z: number, // 3D coordinates
    finalLength: number,           // Final dimensions after rotation
    finalWidth: number,
    finalHeight: number,
    rotated: boolean,              // Rotation status
    stackedOn: object,             // Reference to base pallet
    stackedBy: array               // References to stacked pallets
}
```

### Container Object
```javascript
{
    length: number,    // Container length in cm
    width: number,     // Container width in cm
    height: number     // Container height in cm
}
```

## Algorithm Flow

### Main Process (`calculateLoading`)
1. **Pallet Generation**: Create individual pallet instances from pallet types
2. **2D Placement**: Place minimal pallets on floor using grid strategy
3. **3D Stacking**: Stack remaining pallets using iterative optimization
4. **Result Rendering**: Display final layout with visual indicators

### Stacking Process
1. **Base Selection**: Find all potential base pallets for each unplaced pallet
2. **Orientation Testing**: Try both normal and rotated orientations
3. **Constraint Validation**: Check permissions, weight, and height limits
4. **Scoring**: Evaluate position using multi-criteria scoring system
5. **Placement**: Place pallet on best-scoring base and update references

## Key Functions

### `perform3DStacking()`
- Main 3D stacking algorithm
- Returns stacking statistics and stability analysis
- Handles iterative stacking with attempt limits

### `getMaxStackWeight(basePallet)`
- Calculates maximum weight a pallet can support
- Uses configurable weight ratios and limits
- Special handling for identical pallets

### `calculateStackWeight(basePallet)`
- Recursively calculates total weight of a stack
- Includes base pallet and all stacked pallets

### `getTopZForBase(basePallet)`
- Calculates Z-coordinate for top of existing stack
- Considers all pallets in the stack hierarchy

### `calculateStackingStability(placedPallets)`
- Calculates center of gravity and stability metrics
- Returns stability score and center of gravity coordinates

## Configuration Constants

```javascript
const CONSTANTS = {
    STACKING: {
        MAX_STACK_WEIGHT: 2500,        // Maximum stack weight in kg
        MIN_BASE_WEIGHT: 400,          // Minimum base pallet weight
        WEIGHT_RATIO_LIMIT: 3.0,       // Maximum weight ratio (stacked/base)
        HEIGHT_PREFERENCE: 0.5,        // Height preference in scoring
        SIZE_FIT_WEIGHT: 50,           // Size compatibility weight
        PERFECT_FIT_BONUS: 200,        // Perfect fit bonus
        CENTER_PENALTY: 0.02,          // Distance from center penalty
        STACK_HEIGHT_PENALTY: 3,       // Tall stack penalty
        WEIGHT_BALANCE_PENALTY: 0.05   // Weight distribution penalty
    }
};
```

## Debug and Analysis Tools

### Debug Functions
- `debug.testStacking()`: Basic stacking analysis
- `debug.analyzeStackingPermissions()`: Permission analysis
- `debug.analyzeIdenticalPallets()`: Identical pallet analysis
- `debug.testMultiLevelStacking()`: Multi-level stacking analysis

### Analysis Features
- Stacking level distribution
- Weight distribution analysis
- Permission compatibility checking
- Stability calculations
- Performance metrics

## Performance Characteristics

### Time Complexity
- **2D Placement**: O(n) where n is number of pallets
- **3D Stacking**: O(n² × m) where n is unplaced pallets, m is placed pallets
- **Overall**: O(n² × m) dominated by 3D stacking

### Space Complexity
- **Pallet Storage**: O(n) for all pallet instances
- **Stacking References**: O(n) for stacking relationships
- **Overall**: O(n) linear space complexity

## Optimization Strategies

### 1. Minimal Floor Placement
- Places only necessary pallets on floor to maximize stacking potential
- Uses grid strategy for efficient floor utilization

### 2. Identical Pallet Prioritization
- Gives bonus scores for stacking identical pallets
- Allows higher weight ratios for identical pallets

### 3. Multi-Criteria Scoring
- Balances height preference, weight compatibility, and size fit
- Prefers lower positions and perfect fits

### 4. Iterative Optimization
- Multiple stacking attempts with different pallet orders
- Continues until no more stacking is possible

## Limitations and Constraints

### Physical Constraints
- Container dimensions (length, width, height)
- Pallet dimensions and weight
- Clearance requirements between pallets

### Stacking Constraints
- Pallet-specific stacking permissions
- Weight limits and ratios
- Height limits within container

### Algorithm Constraints
- Greedy approach may not find global optimum
- Limited to single pallet placement per iteration
- No backtracking or re-optimization

## Future Improvements

### Potential Enhancements
1. **Multi-objective optimization**: Balance weight, height, and stability
2. **Backtracking algorithm**: Allow re-optimization of previous placements
3. **Genetic algorithm**: Use evolutionary approach for better solutions
4. **Machine learning**: Learn optimal stacking patterns from historical data
5. **Real-time optimization**: Dynamic re-optimization during loading

### Performance Optimizations
1. **Spatial indexing**: Use spatial data structures for faster neighbor finding
2. **Parallel processing**: Parallelize stacking attempts
3. **Caching**: Cache constraint calculations
4. **Early termination**: Stop when optimal solution is found

## Usage Examples

### Basic Usage
```javascript
// Generate pallets
const pallets = [
    { length: 100, width: 125, height: 100, weight: 600, qty: 40, canStackAbove: true, canStackBelow: true }
];

// Calculate loading
calculateLoading();

// Check results
const placedPallets = allPalletsGenerated.filter(p => p.placed);
const stackedPallets = placedPallets.filter(p => p.stackedOn);
console.log(`Placed: ${placedPallets.length}, Stacked: ${stackedPallets.length}`);
```

### Debug Analysis
```javascript
// Analyze stacking performance
debug.testStacking();

// Check stacking permissions
debug.analyzeStackingPermissions();

// Analyze identical pallets
debug.analyzeIdenticalPallets();
```

This algorithm provides a robust foundation for 3D container loading optimization while maintaining flexibility for different pallet types and constraints.