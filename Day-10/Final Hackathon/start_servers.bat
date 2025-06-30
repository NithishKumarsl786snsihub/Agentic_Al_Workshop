@echo off
TITLE VoiceWeb Development Servers

ECHO =======================================
ECHO Starting VoiceWeb Servers
ECHO =======================================

REM Get the directory of the batch file
SET "BATCH_DIR=%~dp0"

REM --- Start Backend Server ---
ECHO.
ECHO Starting FastAPI Backend Server...
cd /d "%BATCH_DIR%backend"
START "Backend" cmd /k "python start_server.py"

REM --- Start Frontend Server ---
ECHO.
ECHO Starting Next.js Frontend Server...
cd /d "%BATCH_DIR%frontend"
START "Frontend" cmd /k "npm run dev"

ECHO.
ECHO =======================================
ECHO Servers are starting in new windows.
ECHO =======================================

pause 