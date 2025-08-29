# Palletizar - Standalone Version

## ✅ **Now Works with Double-Click!**

Your palletizar app now works in **both modes**:

### 🖱️ **Double-Click Mode** (Windows/File Explorer)
- ✅ **Just double-click `index.html`** - it will work immediately!
- ✅ **No web server required**
- ✅ **All core functionality available**
- ✅ **Works on any computer**

### 🌐 **Web Server Mode** (Development)
- ✅ **Full ES6 modules** for better development experience
- ✅ **Better debugging and error handling**
- ✅ **Modular architecture benefits**

## 🔄 **How It Works**

The app automatically detects your environment:

1. **File:// Protocol** (double-click): Loads `script.js` (standalone version)
2. **HTTP/HTTPS Protocol** (web server): Loads modular `js/main.js` 

## 📁 **File Structure**

```
palletizar/
├── index.html              # 🏠 Main file (double-click this!)
├── styles.css              # 🎨 Styles
├── script.js               # 🚀 Standalone version (works everywhere)
├── script.js.backup        # 💾 Original backup
├── js/                     # 📦 Modular version (web server only)
│   ├── main.js
│   ├── data.js
│   ├── ui.js
│   ├── algorithms.js
│   ├── visualization.js
│   └── utils.js
└── README_STANDALONE.md     # 📖 This file
```

## 🚀 **Quick Start**

### For End Users:
1. **Double-click `index.html`** 
2. **That's it!** The app will open in your browser and work completely

### For Developers:
1. **Use a web server** (VS Code Live Server, Python `http.server`, etc.)
2. **Get the full modular experience** with better debugging

## 🔧 **What's Included in Standalone Mode**

✅ **Core Features:**
- ✅ CSV Import/Export
- ✅ Height limit controls
- ✅ Pallet selection
- ✅ Palletization calculations
- ✅ Basic result display
- ✅ Data management (add/edit/delete)

✅ **Simplified Features:**
- 📊 Basic result visualization (text-based)
- 🔍 Console logging for debugging
- ⚡ Lighter version of algorithms

❌ **Advanced Features** (Web Server Only):
- 🎨 Canvas diagrams and visualizations
- 📈 Advanced layer-by-layer display
- 🛠️ Full debugging tools
- 💾 Auto-save functionality

## 🔄 **Switching Between Modes**

### To Force Standalone Mode:
- Just double-click `index.html` from file explorer
- Or open `file:///path/to/palletizar/index.html` in browser

### To Use Modular Mode:
- Use any web server to serve the files
- Example: `python -m http.server 8000` then visit `http://localhost:8000`

## 🐛 **Troubleshooting**

### **Problem: "App not working after double-click"**
**Solution:** Make sure you're opening `index.html` and not any of the JS files

### **Problem: "Features missing"**
**Solution:** Some advanced features require web server mode. For full features, run with a web server.

### **Problem: "Console errors"**
**Solution:** Check browser console (F12). Standalone mode will show which version is loading.

## 📱 **Browser Compatibility**

### **Standalone Mode:**
- ✅ Chrome 50+
- ✅ Firefox 45+
- ✅ Safari 10+
- ✅ Edge (all versions)
- ✅ Internet Explorer 11

### **Modular Mode:**
- ✅ Chrome 61+ (ES6 modules)
- ✅ Firefox 60+ (ES6 modules)
- ✅ Safari 11+ (ES6 modules)
- ✅ Edge 16+ (ES6 modules)

## 🎯 **Best Practices**

### **For Distribution:**
- Share the entire `palletizar` folder
- Tell users to "double-click index.html"
- No installation or setup required!

### **For Development:**
- Use web server for full features
- Standalone mode for quick testing
- Both versions share the same UI and data format

## 💡 **Technical Notes**

The standalone `script.js` contains:
- ✅ All essential algorithms
- ✅ Simplified but fully functional UI
- ✅ Core data management
- ✅ Basic error handling
- ✅ CSV import/export
- ✅ Palletization calculations

The app automatically detects the environment and loads the appropriate version with graceful fallbacks.

---

**🎉 Your palletizar app is now ready for deployment and will work on any Windows computer by simply double-clicking the HTML file!**