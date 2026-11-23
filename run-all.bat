@echo off
title Lowkey Cafe - Full Stack Launcher
echo ========================================================
echo   Launching Lowkey Cafe Smart Restaurant Management
echo ========================================================
echo.
echo 1. Launching Spring Boot Java 21 Backend (Port 8080)...
start "Lowkey Cafe Backend" cmd /c "cd /d "%~dp0backend" && mvn spring-boot:run"
echo.
echo 2. Waiting 5 seconds before starting Frontend...
timeout /t 5 /nobreak >nul
echo.
echo 3. Launching React TypeScript Tailwind Frontend (Port 5173)...
start "Lowkey Cafe Frontend" cmd /c "cd /d "%~dp0frontend" && npm run dev"
echo.
echo ========================================================
echo   Lowkey Cafe is launching!
echo   Customer Website:       http://localhost:5173/table/5
echo   Kitchen Display (KDS):  http://localhost:5173/kds
echo   Waiter Floor View:      http://localhost:5173/waiter
echo   Admin Dashboard:        http://localhost:5173/admin
echo   Backend REST APIs:      http://localhost:8080/api
echo ========================================================
pause
