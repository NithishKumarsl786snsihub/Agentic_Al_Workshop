#!/usr/bin/env python3
"""
Step-by-step package installation script to resolve dependency conflicts
"""

import subprocess
import sys

def install_package(package):
    """Install a single package with error handling"""
    try:
        print(f"Installing {package}...")
        result = subprocess.run([sys.executable, "-m", "pip", "install", package, "--no-cache-dir"], 
                              check=True, capture_output=True, text=True)
        print(f"✅ Successfully installed {package}")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install {package}")
        print(f"Error: {e.stderr}")
        return False

def main():
    """Install packages in order of dependency priority"""
    
    # Core packages first
    core_packages = [
        "fastapi==0.104.1",
        "uvicorn[standard]==0.24.0",
        "requests==2.31.0", 
        "beautifulsoup4>=4.12.3,<5.0.0",
        "python-dotenv==1.0.0",
        "validators==0.22.0",
        "pydantic>=2.5.0,<3.0.0",
        "python-multipart==0.0.6"
    ]
    
    # OpenAI and Google packages
    ai_packages = [
        "openai>=1.0.0",
        "google-generativeai>=0.7.0,<2.0.0"
    ]
    
    # Browser automation
    browser_packages = [
        "selenium>=4.18.1,<5.0.0",
        "webdriver-manager==4.0.1"
    ]
    
    # LangChain packages (install in specific order)
    langchain_packages = [
        "langchain>=0.1.0,<1.0.0",
        "langchain-community>=0.0.20,<1.0.0",
        "langchain-google-genai>=1.0.0,<2.0.0"
    ]
    
    # Database packages
    db_packages = [
        "chromadb>=0.4.22,<1.0.0"
    ]
    
    # Tool packages
    tool_packages = [
        "duckduckgo-search>=5.0.0,<6.0.0"
    ]
    
    # CrewAI packages (most problematic, install last)
    crewai_packages = [
        "embedchain>=0.1.114,<1.0.0",
        "crewai>=0.28.8,<1.0.0",
        "crewai-tools>=0.8.0,<1.0.0"
    ]
    
    all_package_groups = [
        ("Core packages", core_packages),
        ("AI packages", ai_packages), 
        ("Browser automation", browser_packages),
        ("LangChain packages", langchain_packages),
        ("Database packages", db_packages),
        ("Tool packages", tool_packages),
        ("CrewAI packages", crewai_packages)
    ]
    
    failed_packages = []
    
    for group_name, packages in all_package_groups:
        print(f"\n🔧 Installing {group_name}...")
        for package in packages:
            if not install_package(package):
                failed_packages.append(package)
    
    if failed_packages:
        print(f"\n❌ Failed to install the following packages:")
        for package in failed_packages:
            print(f"  - {package}")
        print("\nTry installing these manually or check for alternative versions.")
    else:
        print(f"\n✅ All packages installed successfully!")
    
    # Test imports
    print(f"\n🧪 Testing key imports...")
    test_imports = [
        "fastapi",
        "uvicorn", 
        "requests",
        "bs4",
        "google.generativeai",
        "openai",
        "selenium",
        "langchain",
        "chromadb"
    ]
    
    for module in test_imports:
        try:
            __import__(module)
            print(f"✅ {module} import successful")
        except ImportError as e:
            print(f"❌ {module} import failed: {e}")

if __name__ == "__main__":
    main() 