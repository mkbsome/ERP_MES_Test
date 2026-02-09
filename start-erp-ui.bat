@echo off
chcp 65001 > nul
title ERP UI - Port 5174

echo ========================================
echo   ERP UI Start
echo ========================================
echo.

cd /d %~dp0erp-ui

echo [INFO] Starting ERP UI...
echo [INFO] http://localhost:5174
echo.

vite --port 5174

pause
