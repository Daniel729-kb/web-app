# Layout Debugging Guide

## Common Issues and How to Debug

### 1. **Check Console for Errors**
```javascript
// Add to your browser console to debug
console.log('Layout Result:', calculator.lastLayoutResult);
console.log('Selected Pallets:', calculator.pallets);
console.log('Canvas Element:', document.getElementById('layoutCanvas'));
```

### 2. **Test Layout Generation Step by Step**
```javascript
// Test the layout generator directly
const testPallets = [{
    name: 'Test',
    length: 1.2,
    width: 1.0,
    height: 1.5,
    quantity: 4,
    isStackable: true,
    maxStackHeight: 3.0
}];

const result = calculator.layoutGenerator.generateCanvasLayout(
    testPallets, 'combined', 2.5, 0.05
);
console.log('Test Result:', result);
```

### 3. **Verify Position Format**
```javascript
// Check if positions have the correct format
if (result.success && result.positions) {
    result.positions.forEach((pos, i) => {
        console.log(`Position ${i}:`, pos);
        // Should be: [x, y, width, height, palletType, stackLevel]
        if (pos.length !== 6) {
            console.error(`Invalid position format at index ${i}`);
        }
    });
}
```

### 4. **Canvas Rendering Debug**
```javascript
// Add to renderCanvasLayout method for debugging
console.log('Canvas dimensions:', canvas.width, 'x', canvas.height);
console.log('Scale factor:', scale);
console.log('Warehouse size:', layoutResult.binWidth, 'x', layoutResult.totalHeight);
```

### 5. **Check Warehouse Constraints**
```javascript
// Verify warehouse settings are reasonable
const warehouse = calculator.warehouse;
console.log('Warehouse:', warehouse);

// Check if pallets fit
const selectedPallets = Array.from(document.getElementById('selectedPallets').selectedOptions);
selectedPallets.forEach(option => {
    const pallet = calculator.pallets[parseInt(option.value)];
    if (pallet.length > warehouse.length || pallet.width > warehouse.width) {
        console.error(`Pallet ${pallet.name} is too large for warehouse`);
    }
});
```

## Visual Debugging

### Add Debug Overlays
```javascript
// Add to drawPallets method
function drawDebugInfo(ctx, positions) {
    positions.forEach((pos, i) => {
        const [x, y, w, h] = pos;
        // Draw position numbers
        ctx.fillStyle = 'red';
        ctx.font = '12px Arial';
        ctx.fillText(i.toString(), x * scale + offsetX + 5, y * scale + offsetY + 15);
    });
}
```

### Color Coding Issues
```javascript
// Debug color assignment
function debugColors(positions, colors) {
    console.log('Color assignments:');
    positions.forEach((pos, i) => {
        const palletType = pos[4] || 'unknown';
        const color = colors[palletType % colors.length];
        console.log(`Position ${i}: Type ${palletType}, Color ${color}`);
    });
}
```

## Performance Monitoring

### Timing Layout Generation
```javascript
console.time('Layout Generation');
const result = calculator.layoutGenerator.generateCanvasLayout(pallets, mode, aisleWidth, clearance);
console.timeEnd('Layout Generation');
```

### Memory Usage
```javascript
// Monitor position array size
console.log('Position count:', result.positions?.length || 0);
console.log('Memory estimate:', (result.positions?.length || 0) * 6 * 8, 'bytes');
```

## Testing Scenarios

### 1. **Empty Warehouse**
- No pallets selected
- Should show empty message

### 2. **Single Pallet**
- One pallet, small quantity
- Should place in bottom-left

### 3. **Multiple Pallet Types**
- Different sizes and quantities
- Should use different colors

### 4. **Oversized Pallets**
- Pallets larger than warehouse
- Should show error message

### 5. **High Quantity**
- Many pallets, limited space
- Should pack efficiently or show overflow

## Quick Fixes

### If Canvas is Blank
```javascript
// Check canvas context
const canvas = document.getElementById('layoutCanvas');
const ctx = canvas.getContext('2d');
console.log('Canvas context:', ctx);
console.log('Canvas size:', canvas.width, canvas.height);
```

### If Colors are Wrong
```javascript
// Reset color assignments
const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
console.log('Using colors:', colors);
```

### If Layout Doesn't Update
```javascript
// Force update
calculator.redrawLayoutIfActive();
// Or directly
calculator.layoutManager.updateLayoutTab();
```