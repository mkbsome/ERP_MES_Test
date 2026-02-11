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

echo [2/3] Starting MES UI... (Port 5173)
start "MES UI" cmd /k "cd /d %~dp0ui && npm run dev -- --port 5173"

timeout /t 3 /nobreak > nul

echo [3/3] Starting Scenario Modifier UI... (Port 5174)
start "Scenario Modifier UI" cmd /k "cd /d %~dp0scenario-modifier-ui && npm run dev -- --port 5174"

echo.
echo ========================================
echo   All services started!
echo ========================================
echo.
echo   API Server:           http://localhost:8000
echo   API Docs:             http://localhost:8000/docs
echo   MES UI:               http://localhost:5173
echo   Scenario Modifier:    http://localhost:5174
echo.
echo   Close each window or press Ctrl+C to stop.
echo ========================================

:: Open browser after services are ready
timeout /t 8 /nobreak > nul
start http://localhost:5173
start http://localhost:5174

pause
