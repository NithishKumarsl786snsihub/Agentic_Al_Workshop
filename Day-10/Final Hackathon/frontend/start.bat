@echo off
echo 🚀 Starting Voice Website Generator Frontend...
echo ================================================

:: Check if Node.js is installed
node --version >nul 2>&1
if errorlevel 1 (
    echo ❌ Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

:: Check if package.json exists
if not exist package.json (
    echo ❌ package.json not found. Please run this script from the frontend directory.
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist node_modules (
    echo 📦 Installing dependencies...
    npm install
    if errorlevel 1 (
        echo ❌ Failed to install dependencies
        pause
        exit /b 1
    )
)

:: Create .env.local if it doesn't exist
if not exist .env.local (
    if exist env_local_example (
        echo 📝 Creating .env.local from template...
        copy env_local_example .env.local
    ) else (
        echo 📝 Creating .env.local...
        echo NEXT_PUBLIC_API_URL=http://localhost:8000 > .env.local
    )
)

echo ✅ Dependencies installed
echo 🌟 Starting development server...
echo 📖 Frontend will be available at: http://localhost:3000
echo 🔌 Make sure the backend is running at: http://localhost:8000
echo.
echo Press Ctrl+C to stop the server
echo ================================================

npm run dev 