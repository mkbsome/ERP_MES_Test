@echo off
chcp 65001 > nul
title ERP/MES Simulator - Install Dependencies

echo ========================================
echo   Install Dependencies
echo ========================================
echo.

cd /d %~dp0

:: Python dependencies
echo [1/3] Installing Python dependencies...
if exist "requirements.txt" (
    pip install -r requirements.txt
) else (
    pip install fastapi uvicorn sqlalchemy asyncpg psycopg2-binary pydantic python-dateutil faker numpy pandas
)
echo.

:: MES UI dependencies
echo [2/3] Installing MES UI dependencies...
cd /d %~dp0ui
if exist "package.json" (
    call npm install
)
echo.

:: ERP UI dependencies
echo [3/3] Installing ERP UI dependencies...
cd /d %~dp0erp-ui
if exist "package.json" (
    call npm install
)
echo.

echo ========================================
echo   Installation Complete!
echo ========================================
echo.
echo   Run start-all.bat to start servers.
echo.

pause
