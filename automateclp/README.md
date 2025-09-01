# AutomateCLP - Container Loading Planner

A web application for automatically arranging pallets in 20ft/40ft containers with 3D stacking capabilities.

## 🚀 Quick Start

### Option 1: Use the provided scripts (Easiest)

**Windows:**
```bash
# Double-click start-server.bat
# OR run in command prompt:
start-server.bat
```

**Mac/Linux:**
```bash
# Run in terminal:
./start-server.sh
```

Then open: http://localhost:8000

### Option 2: Manual server start

**Python (Recommended):**
```bash
cd automateclp
python3 -m http.server 8000
# OR
python -m http.server 8000
```

**Node.js:**
```bash
npm install -g http-server
http-server -p 8000
```

**PHP:**
```bash
php -S localhost:8000
```

## ⚠️ Important: Why you need a web server

This app uses ES6 modules (import/export) which require a web server to work. **Opening the HTML file directly in a browser won't work** due to CORS restrictions.

## 🔧 Troubleshooting

### "Module not found" errors
- Make sure you're running through a web server (http://localhost:8000)
- Don't open the file directly (file:// protocol won't work)
- Check that all .js files are in the same directory

### Port already in use
- Try a different port: `python3 -m http.server 8001`
- Or kill the process using the port

### Browser cache issues
- Hard refresh: Ctrl+F5 (Windows) or Cmd+Shift+R (Mac)

## 📁 File Structure

```
automateclp/
├── index.html              # Main application
├── app.js                  # Main application logic
├── utils.js                # Utilities and constants
├── algorithms.js           # Core algorithms
├── ui.js                   # UI management
├── styles.css              # Styling
├── start-server.bat        # Windows server starter
├── start-server.sh         # Mac/Linux server starter
├── run-locally.html        # Help page
└── old/                    # Archive folder
```

## 🎯 Features

- ✅ 2D pallet arrangement algorithms
- ✅ 3D stacking with stability calculations
- ✅ Drag & drop manual adjustment
- ✅ Multiple container types (20ft, 40ft, 40HQ)
- ✅ Real-time visualization
- ✅ Export functionality
- ✅ Debug tools
- ✅ Dark mode support

## 📖 Documentation

- `README-IMPROVEMENTS.md` - Detailed improvement documentation
- `CURRENT-STATE.md` - Current project status
- `old/README.md` - Archive documentation

---

**Need help?** Open `run-locally.html` in your browser for detailed instructions!