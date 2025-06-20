#!/bin/bash

echo "🚀 Starting Voice Website Generator Frontend..."
echo "================================================"

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js from https://nodejs.org/"
    exit 1
fi

echo "✅ Node.js version: $(node --version)"

# Check if package.json exists
if [ ! -f "package.json" ]; then
    echo "❌ package.json not found. Please run this script from the frontend directory."
    exit 1
fi

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📦 Installing dependencies..."
    npm install
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install dependencies"
        exit 1
    fi
fi

# Create .env.local if it doesn't exist
if [ ! -f ".env.local" ]; then
    if [ -f "env_local_example" ]; then
        echo "📝 Creating .env.local from template..."
        cp env_local_example .env.local
    else
        echo "📝 Creating .env.local..."
        echo "NEXT_PUBLIC_API_URL=http://localhost:8000" > .env.local
    fi
fi

echo "✅ Dependencies installed"
echo "🌟 Starting development server..."
echo "📖 Frontend will be available at: http://localhost:3000"
echo "🔌 Make sure the backend is running at: http://localhost:8000"
echo ""
echo "Press Ctrl+C to stop the server"
echo "================================================"

npm run dev 