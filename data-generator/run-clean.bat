@echo off
echo ========================================
echo  ERP-MES Clean and Generate
echo ========================================
echo.
echo [WARNING] All existing data will be deleted!
echo.
set /p confirm="Continue? (Y/N): "

if /i "%confirm%"=="Y" (
    call venv\Scripts\activate.bat
    python main.py --clean
) else (
    echo Cancelled.
)

echo.
pause
