@echo off
chcp 65001 > nul
title Scenario Modifier UI - Port 5174

echo ========================================
echo   Scenario Modifier UI
echo   AI Anomaly Test Tool
echo   Port: 5174
echo ========================================
echo.

cd /d "%~dp0scenario-modifier-ui"

:: Check if node_modules exists
if not exist "node_modules" (
    echo [INFO] Installing dependencies...
    call npm install
)

echo [INFO] Starting Scenario Modifier UI...
echo [INFO] URL: http://localhost:5174
echo.

call npm run dev -- --port 5174

pause
