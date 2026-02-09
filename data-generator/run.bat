@echo off
echo ========================================
echo  ERP-MES Data Generator
echo ========================================
echo.
echo  1. Generate All Modules
echo  2. Generate All (Clean existing data)
echo  3. Master Data only
echo  4. HR only
echo  5. Sales only
echo  6. Purchase only
echo  7. Production only
echo  0. Exit
echo.
echo ========================================

set /p choice="Select: "

call venv\Scripts\activate.bat

if "%choice%"=="1" (
    echo.
    echo Generating all modules...
    python main.py
) else if "%choice%"=="2" (
    echo.
    echo Cleaning and generating...
    python main.py --clean
) else if "%choice%"=="3" (
    echo.
    echo Generating master data...
    python main.py -m master
) else if "%choice%"=="4" (
    echo.
    echo Generating HR data...
    python main.py -m hr
) else if "%choice%"=="5" (
    echo.
    echo Generating sales data...
    python main.py -m sales
) else if "%choice%"=="6" (
    echo.
    echo Generating purchase data...
    python main.py -m purchase
) else if "%choice%"=="7" (
    echo.
    echo Generating production data...
    python main.py -m production
) else if "%choice%"=="0" (
    exit /b 0
) else (
    echo Invalid selection.
)

echo.
pause
