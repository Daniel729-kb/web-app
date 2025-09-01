#!/bin/bash

echo "========================================"
echo "   AutomateCLP Local Server Starter"
echo "========================================"
echo ""
echo "Starting local web server..."
echo ""
echo "The app will be available at:"
echo "http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""
echo "========================================"

# Try Python 3 first, then Python 2
if command -v python3 &> /dev/null; then
    python3 -m http.server 8000
elif command -v python &> /dev/null; then
    python -m http.server 8000
else
    echo ""
    echo "ERROR: Python not found!"
    echo ""
    echo "Please install Python or use one of these alternatives:"
    echo "- Node.js: npm install -g http-server && http-server -p 8000"
    echo "- PHP: php -S localhost:8000"
    echo ""
    read -p "Press Enter to continue..."
fi