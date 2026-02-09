@echo off
chcp 65001 > nul
title API Server - Port 8000

echo ========================================
echo   API Server Start
echo ========================================
echo.

cd /d %~dp0

:: Check if virtual environment exists
if exist "venv\Scripts\activate.bat" (
    echo [INFO] Activating virtual environment...
    call venv\Scripts\activate.bat
)

echo [INFO] Starting API Server...
echo [INFO] http://localhost:8000
echo [INFO] API Docs: http://localhost:8000/docs
echo.

python -m uvicorn api.main:app --reload --port 8000

pause
