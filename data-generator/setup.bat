@echo off
echo ========================================
echo  ERP-MES Data Generator Setup
echo ========================================
echo.

REM Check Python
python --version > nul 2>&1
if errorlevel 1 (
    echo [ERROR] Python is not installed.
    pause
    exit /b 1
)

echo [1/2] Creating virtual environment...
if not exist "venv" (
    python -m venv venv
)

echo [2/2] Installing packages...
call venv\Scripts\activate.bat
pip install -r requirements.txt -q

echo.
echo ========================================
echo  Setup Complete!
echo  Run: run.bat
echo ========================================
pause
