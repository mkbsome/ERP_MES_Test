@echo off
echo ========================================
echo  Stopping PostgreSQL (Docker)
echo ========================================
echo.

docker-compose down

echo.
echo Database stopped.
pause
