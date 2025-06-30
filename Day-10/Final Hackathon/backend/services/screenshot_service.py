"""
Screenshot Service for Project Previews
Uses Selenium for capturing actual webpage screenshots.
"""

import base64
from io import BytesIO
from typing import Dict
import asyncio
import logging
import sys
import tempfile
import os
from selenium import webdriver
from selenium.webdriver.chrome.options import Options

logger = logging.getLogger(__name__)

# Ensure selector event loop policy is set as early as possible (safety net)
if sys.platform == "win32":
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

def _capture_screenshot(html_content: str, width: int, height: int) -> bytes:
    options = Options()
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_argument(f'--window-size={width},{height}')
    
    driver = webdriver.Chrome(options=options)
    
    try:
        # Create temp file to serve HTML
        with tempfile.NamedTemporaryFile('w', suffix='.html', delete=False, encoding='utf-8') as f:
            f.write(html_content)
            temp_path = f.name
        
        try:
            # Load the HTML file
            driver.get(f'file:///{temp_path}')
            # Capture screenshot
            screenshot = driver.get_screenshot_as_png()
            return screenshot
        finally:
            os.unlink(temp_path)
    finally:
        driver.quit()

async def generate_project_previews(html_content: str, project_id: str) -> Dict[str, str]:
    """Async wrapper that offloads blocking sync preview generation to a thread."""
    try:
        loop = asyncio.get_running_loop()
        
        # Capture full preview
        full_screenshot = await loop.run_in_executor(
            None, _capture_screenshot, html_content, 1200, 800)
        
        # Capture thumbnail
        thumb_screenshot = await loop.run_in_executor(
            None, _capture_screenshot, html_content, 600, 400)
        
        return {
            "full": f"data:image/jpeg;base64,{base64.b64encode(full_screenshot).decode()}",
            "thumbnail": f"data:image/jpeg;base64,{base64.b64encode(thumb_screenshot).decode()}"
        }
            
    except Exception as e:
        logger.error(f"Preview generation failed: {e}")
        return {}