@echo off
chcp 65001 > nul
title MES UI - Port 5173

echo ========================================
echo   MES UI Start
echo ========================================
echo.

cd /d %~dp0ui

echo [INFO] Starting MES UI...
echo [INFO] http://localhost:5173
echo.

vite --port 5173

pause
