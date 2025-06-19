@echo off
setlocal

REM AI-Powered Website Compliance Auditor Startup Script for Windows

echo 🔍 Starting AI-Powered Website Compliance Auditor...

REM Check if Python is installed
python --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Python is not installed or not in PATH
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed or not in PATH
    pause
    exit /b 1
)

echo ✅ All prerequisites are installed

REM Setup backend
echo 🐍 Setting up Python backend...
cd backend

REM Check if virtual environment exists
if not exist "venv" (
    echo Creating virtual environment...
    python -m venv venv
)

REM Activate virtual environment
call venv\Scripts\activate.bat

REM Install Python dependencies
echo Installing Python dependencies...
pip install -r requirements.txt

REM Check if .env exists
if not exist ".env" (
    echo Creating .env file from template...
    copy env.example .env
    echo ⚠️  Please edit backend\.env with your Gemini API key
)

REM Start backend in new window
echo 🚀 Starting backend server...
start "Backend Server" cmd /k "call venv\Scripts\activate.bat && python main.py"

cd ..

REM Setup frontend
echo ⚛️  Setting up Next.js frontend...

REM Check if node_modules exists
if not exist "node_modules" (
    echo Installing Node.js dependencies...
    npm install
)

REM Check if .env.local exists
if not exist ".env.local" (
    echo Creating .env.local file...
    (
        echo NEXT_PUBLIC_API_URL=http://localhost:3000/api
        echo BACKEND_URL=http://localhost:8000
    ) > .env.local
)

REM Start frontend in new window
echo 🚀 Starting frontend server...
start "Frontend Server" cmd /k "npm run dev"

echo.
echo 🎉 Application started successfully!
echo.
echo 📊 Backend API: http://localhost:8000
echo 🌐 Frontend App: http://localhost:3000
echo 📚 API Documentation: http://localhost:8000/api/docs
echo.
echo Both servers are running in separate windows.
echo Close those windows to stop the services.
echo.
pause 