@echo off
title Lowkey Cafe - Spring Boot Backend Server
echo ========================================================
echo   Starting Lowkey Cafe Spring Boot Backend (Port 8080)
echo ========================================================
cd /d "%~dp0backend"
call mvn spring-boot:run
pause
