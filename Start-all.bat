@echo off
chcp 65001 > nul
title ERP/MES Simulator - All Services

echo ========================================
echo   GreenBoard Electronics ERP/MES Simulator
echo ========================================
echo.

:: Check if Python is available
where python >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Python is not installed.
    pause
    exit /b 1
)

:: Check if Node.js is available
where node >nul 2>nul
if %errorlevel% neq 0 (
    echo [ERROR] Node.js is not installed.
    pause
    exit /b 1
)

echo [1/3] Starting API Server... (Port 8000)
start "API Server" cmd /k "cd /d %~dp0 && python -m uvicorn api.main:app --reload --port 8000"

timeout /t 5 /nobreak > nul

echo [2/3] Starting MES/ERP UI... (Port 4173)
start "MES/ERP UI" cmd /k "cd /d %~dp0ui && npm run dev -- --host --port 4173"

timeout /t 3 /nobreak > nul

echo [3/3] Starting ERP UI (Legacy)... (Port 5174)
start "ERP UI Legacy" cmd /k "cd /d %~dp0erp-ui && npm run dev -- --host"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   API Server:  http://localhost:8000
echo   API Docs:    http://localhost:8000/docs
echo   MES/ERP UI:  http://localhost:4173
echo   ERP UI:      http://localhost:5174
echo.
echo   Close each window or press Ctrl+C to stop.
echo ========================================

:: Open browser after services are ready
timeout /t 10 /nobreak > nul
start http://localhost:4173

pause
