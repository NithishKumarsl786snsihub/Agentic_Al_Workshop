@echo off
echo 🚀 Starting Voice Website Generator...
echo.

echo 📋 Checking backend status...
cd backend
venv\Scripts\activate
python -c "import requests; print('✅ Backend running on http://localhost:8000' if requests.get('http://localhost:8000/status').status_code == 200 else '❌ Backend not running')" 2>nul || echo "🔄 Starting backend server..."

echo.
echo 🌐 Starting frontend server...
cd ..\frontend
start cmd /k "npm run dev"

echo.
echo ✅ Servers started!
echo 📍 Backend: http://localhost:8000
echo 📍 Frontend: http://localhost:3000
echo.
echo Press any key to open the application in your browser...
pause >nul
start http://localhost:3000 