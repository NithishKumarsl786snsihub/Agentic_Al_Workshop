"""
Script to download and install wkhtmltopdf
"""
import os
import sys
import subprocess
import urllib.request
import zipfile
import shutil

def download_wkhtmltopdf():
    """Download and install wkhtmltopdf"""
    try:
        print("📥 Downloading wkhtmltopdf...")
        
        # Download URL for Windows
        url = "https://github.com/wkhtmltopdf/packaging/releases/download/0.12.6-1/wkhtmltox-0.12.6-1.msvc2015-win64.exe"
        
        # Download the installer
        installer_path = "wkhtmltopdf_installer.exe"
        urllib.request.urlretrieve(url, installer_path)
        
        print("✅ Download complete!")
        print("🔧 Installing wkhtmltopdf...")
        
        # Run the installer silently
        subprocess.run([installer_path, "/S"], check=True)
        
        # Clean up
        os.unlink(installer_path)
        
        print("✅ Installation complete!")
        print("🎉 wkhtmltopdf is now available for screenshot generation.")
        
        # Add to PATH if not already there
        wkhtmltopdf_path = r"C:\Program Files\wkhtmltopdf\bin"
        if wkhtmltopdf_path not in os.environ["PATH"]:
            os.environ["PATH"] += os.pathsep + wkhtmltopdf_path
            print("✅ Added wkhtmltopdf to PATH")
        
        return True
        
    except Exception as e:
        print(f"❌ Failed to install wkhtmltopdf: {e}")
        print("Please install manually from: https://wkhtmltopdf.org/downloads.html")
        return False

if __name__ == "__main__":
    print("🔧 Setting up wkhtmltopdf for screenshot generation...")
    download_wkhtmltopdf() 