@echo off
echo ========================================
echo    AutomateCLP Local Server Starter
echo ========================================
echo.
echo Starting local web server...
echo.
echo The app will be available at:
echo http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo.
echo ========================================

REM Try Python 3 first
python -m http.server 8000 2>nul
if %errorlevel% neq 0 (
    echo Python not found, trying Python 3...
    python3 -m http.server 8000 2>nul
    if %errorlevel% neq 0 (
        echo.
        echo ERROR: Python not found!
        echo.
        echo Please install Python from: https://python.org
        echo Or use one of these alternatives:
        echo - Node.js: npm install -g http-server && http-server -p 8000
        echo - PHP: php -S localhost:8000
        echo.
        pause
    )
)