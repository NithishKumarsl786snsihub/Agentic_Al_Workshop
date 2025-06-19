#!/bin/bash

# AI-Powered Website Compliance Auditor Startup Script

echo "🔍 Starting AI-Powered Website Compliance Auditor..."

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
NC='\033[0m' # No Color

# Function to check if a command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

if ! command_exists python3; then
    echo -e "${RED}❌ Python 3 is not installed${NC}"
    exit 1
fi

if ! command_exists node; then
    echo -e "${RED}❌ Node.js is not installed${NC}"
    exit 1
fi

if ! command_exists npm; then
    echo -e "${RED}❌ npm is not installed${NC}"
    exit 1
fi

echo -e "${GREEN}✅ All prerequisites are installed${NC}"

# Setup backend
echo -e "${PURPLE}🐍 Setting up Python backend...${NC}"

cd backend

# Check if virtual environment exists, create if not
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
source venv/bin/activate

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Check if .env exists
if [ ! -f ".env" ]; then
    echo "Creating .env file from template..."
    cp env.example .env
    echo -e "${BLUE}⚠️  Please edit backend/.env with your Gemini API key${NC}"
fi

# Start backend in background
echo -e "${GREEN}🚀 Starting backend server...${NC}"
python main.py &
BACKEND_PID=$!

cd ..

# Setup frontend
echo -e "${PURPLE}⚛️  Setting up Next.js frontend...${NC}"

# Check if node_modules exists
if [ ! -d "node_modules" ]; then
    echo "Installing Node.js dependencies..."
    npm install
fi

# Check if .env.local exists
if [ ! -f ".env.local" ]; then
    echo "Creating .env.local file..."
    cat > .env.local << EOL
NEXT_PUBLIC_API_URL=http://localhost:3000/api
BACKEND_URL=http://localhost:8000
EOL
fi

# Start frontend
echo -e "${GREEN}🚀 Starting frontend server...${NC}"
npm run dev &
FRONTEND_PID=$!

# Display startup information
echo ""
echo -e "${GREEN}🎉 Application started successfully!${NC}"
echo ""
echo -e "${BLUE}📊 Backend API:${NC} http://localhost:8000"
echo -e "${PURPLE}🌐 Frontend App:${NC} http://localhost:3000"
echo -e "${BLUE}📚 API Documentation:${NC} http://localhost:8000/api/docs"
echo ""
echo -e "${PURPLE}Press Ctrl+C to stop all services${NC}"
echo ""

# Wait for user to stop services
trap 'echo -e "\n${RED}🛑 Stopping services...${NC}"; kill $BACKEND_PID $FRONTEND_PID; exit' INT

# Keep script running
wait 