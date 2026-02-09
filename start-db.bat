@echo off
echo ========================================
echo  Starting PostgreSQL (Docker)
echo ========================================
echo.

docker-compose up -d

echo.
echo Waiting for database to be ready...
timeout /t 10 /nobreak > nul

echo.
echo ========================================
echo  PostgreSQL is running!
echo  Host: localhost
echo  Port: 5432
echo  Database: erp_mes_db
echo  User: postgres
echo  Password: postgres
echo ========================================
echo.
pause
