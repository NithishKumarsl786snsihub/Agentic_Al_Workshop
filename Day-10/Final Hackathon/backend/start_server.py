#!/usr/bin/env python3
"""
Startup script for the Voice Website Generator Backend
"""

import os
import sys
from pathlib import Path
import asyncio

# Fix for NotImplementedError on Windows
if sys.platform == "win32" and sys.version_info >= (3, 8):
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def check_environment():
    """Check if all required environment variables are set"""
    required_vars = ['GEMINI_API_KEY']
    missing_vars = []
    
    # Check for .env file
    env_file = Path('.env')
    if not env_file.exists():
        env_example = Path('env_example')
        if env_example.exists():
            print("⚠️  No .env file found. Please copy env_example to .env and configure it")
        else:
            print("⚠️  No .env file found. Please create one with your environment variables")
        return False
    
    # Load and check environment variables
    from dotenv import load_dotenv
    load_dotenv()
    
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print(f"❌ Missing required environment variables: {', '.join(missing_vars)}")
        print("Please check your .env file and add the missing variables.")
        return False
    
    return True

def install_dependencies():
    """Install required dependencies"""
    import subprocess
    
    try:
        print("📦 Installing dependencies...")
        # Try the main requirements file first
        subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"])
        print("✅ Dependencies installed successfully!")
        return True
    except subprocess.CalledProcessError as e:
        print(f"⚠️  Failed to install main requirements: {e}")
        
        # Try the simple requirements file if main fails
        try:
            print("📦 Trying simplified requirements...")
            subprocess.check_call([sys.executable, "-m", "pip", "install", "-r", "requirements_simple.txt"])
            print("✅ Simplified dependencies installed successfully!")
            print("ℹ️  Note: Running without LangGraph features")
            return True
        except subprocess.CalledProcessError as e2:
            print(f"❌ Failed to install simplified dependencies: {e2}")
            return False

def main():
    print("🚀 Starting Voice Website Generator Backend...")
    print("=" * 50)
    
    # Check environment
    if not check_environment():
        print("\n🔧 Setup required before starting the server.")
        print("1. Copy env_example to .env")
        print("2. Add your Gemini API key to the .env file")
        return
    
    # Install dependencies
    if not install_dependencies():
        return
    
    # Import and start the server
    try:
        import uvicorn
        from core.config import get_settings
        
        settings = get_settings()
        
        print(f"\n🌟 Server starting on http://{settings.HOST}:{settings.PORT}")
        print("📖 API Documentation: http://localhost:8000/docs")
        print("🎤 Ready for voice-controlled website generation!")
        print("\nPress Ctrl+C to stop the server")
        print("=" * 50)
        
        uvicorn.run(
            "main:app",
            host=settings.HOST,
            port=settings.PORT,
            reload=True,
            log_level="info"
        )
        
    except KeyboardInterrupt:
        print("\n👋 Server stopped by user")
    except Exception as e:
        print(f"❌ Failed to start server: {e}")

if __name__ == "__main__":
    main() 