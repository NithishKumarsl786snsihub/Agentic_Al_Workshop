#!/usr/bin/env python3
"""
Script to install Playwright browsers
Run this after installing requirements.txt
"""

import subprocess
import sys
import os

def install_playwright_browsers():
    """Install Playwright browsers"""
    try:
        print("🎭 Installing Playwright browsers...")
        
        # Install browsers
        result = subprocess.run([
            sys.executable, "-m", "playwright", "install", "chromium"
        ], check=True, capture_output=True, text=True)
        
        print("✅ Playwright browsers installed successfully!")
        
        # Install system dependencies (Linux only)
        if sys.platform.startswith('linux'):
            try:
                subprocess.run([
                    sys.executable, "-m", "playwright", "install-deps", "chromium"
                ], check=True)
                print("✅ System dependencies installed!")
            except subprocess.CalledProcessError as e:
                print(f"⚠️ Warning: Could not install system dependencies: {e}")
                print("You may need to run: sudo playwright install-deps chromium")
        
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install Playwright browsers: {e}")
        print("Please run manually: python -m playwright install chromium")
        return False
    except FileNotFoundError:
        print("❌ Playwright not found. Please install it first:")
        print("pip install playwright")
        return False
    
    return True

def check_playwright_installation():
    """Check if Playwright is properly installed"""
    try:
        from playwright.async_api import async_playwright
        print("✅ Playwright is installed and importable")
        return True
    except ImportError:
        print("❌ Playwright is not installed or not importable")
        return False

if __name__ == "__main__":
    print("🔧 Setting up Playwright for screenshot generation...")
    
    if not check_playwright_installation():
        print("Please install Playwright first: pip install playwright")
        sys.exit(1)
    
    if install_playwright_browsers():
        print("🎉 Playwright setup complete!")
        print("Screenshot generation is now available for project previews.")
    else:
        print("❌ Playwright setup failed. Check the error messages above.")
        sys.exit(1) 