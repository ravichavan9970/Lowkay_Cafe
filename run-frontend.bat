@echo off
title Lowkey Cafe - Vite React Frontend
echo ========================================================
echo   Starting Lowkey Cafe Frontend Web App (Port 5173)
echo ========================================================
cd /d "%~dp0frontend"
call npm run dev
pause
