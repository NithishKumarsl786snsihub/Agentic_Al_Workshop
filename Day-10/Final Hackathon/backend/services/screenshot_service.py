"""
Screenshot Service for Project Previews
Uses Pillow for generating simple preview images.
"""

import base64
from io import BytesIO
from typing import Dict
import asyncio
import logging
import sys
from PIL import Image, ImageDraw, ImageFont
import textwrap
import hashlib

logger = logging.getLogger(__name__)

# Ensure selector event loop policy is set as early as possible (safety net)
if sys.platform == "win32":
    try:
        asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())
    except Exception as e:
        logger.warning(f"Failed to set Windows event loop policy: {e}")

def _create_preview_image(text: str, width: int, height: int, bg_color=(245, 246, 250)) -> Image.Image:
    """Create a preview image with text content"""
    # Create base image
    image = Image.new('RGB', (width, height), bg_color)
    draw = ImageDraw.Draw(image)
    
    try:
        # Try to use a nice font, fall back to default if not available
        try:
            font = ImageFont.truetype("arial.ttf", 24)
        except:
            font = ImageFont.load_default()
        
        # Extract title from HTML
        import re
        title_match = re.search(r'<title>(.*?)</title>', text, re.IGNORECASE)
        title = title_match.group(1) if title_match else "Website Preview"
        
        # Draw title
        title_x = width // 20
        title_y = height // 20
        draw.text((title_x, title_y), title, fill=(33, 33, 33), font=font)
        
        # Draw a simple layout representation
        margin = width // 10
        
        # Header
        draw.rectangle([margin, margin, width - margin, margin + 50], 
                      fill=(235, 236, 240), outline=(200, 200, 200))
        
        # Content blocks
        block_height = 80
        spacing = 20
        y_position = margin + 80
        
        for i in range(3):
            draw.rectangle([margin, y_position, width - margin, y_position + block_height],
                         fill=(240, 241, 245), outline=(210, 210, 210))
            y_position += block_height + spacing
        
        # Add some visual elements
        circle_radius = 30
        draw.ellipse([width - margin - circle_radius, margin + 10, 
                     width - margin, margin + 10 + circle_radius],
                    fill=(200, 200, 210))
        
        # Add a watermark
        watermark = "Preview"
        draw.text((width - 100, height - 30), watermark, 
                 fill=(180, 180, 180), font=font)
        
    except Exception as e:
        logger.warning(f"Error adding text to preview: {e}")
    
    return image

def _generate_previews_sync(html_content: str) -> Dict[str, str]:
    """Generate preview images using Pillow"""
    try:
        # Generate a unique hash for the content
        content_hash = hashlib.md5(html_content.encode()).hexdigest()[:8]
        
        # Create full preview
        full_image = _create_preview_image(html_content, 1200, 800)
        
        # Get full preview bytes
        full_buffer = BytesIO()
        full_image.save(full_buffer, format='JPEG', quality=90, optimize=True)
        screenshot_bytes = full_buffer.getvalue()
        
        # Create thumbnail
        thumb_width = 600
        thumb_height = 400
        thumbnail = _create_preview_image(html_content, thumb_width, thumb_height)
        
        # Get thumbnail bytes
        thumb_buffer = BytesIO()
        thumbnail.save(thumb_buffer, format='JPEG', quality=85, optimize=True)
        thumb_bytes = thumb_buffer.getvalue()
        
        return {
            "full": f"data:image/jpeg;base64,{base64.b64encode(screenshot_bytes).decode('utf-8')}",
            "thumbnail": f"data:image/jpeg;base64,{base64.b64encode(thumb_bytes).decode('utf-8')}"
        }
        
    except Exception as e:
        logger.error(f"Preview generation failed: {str(e)}", exc_info=True)
        return {}

async def generate_project_previews(html_content: str, project_id: str) -> Dict[str, str]:
    """Async wrapper that offloads blocking sync preview generation to a thread."""
    try:
        loop = asyncio.get_running_loop()
        previews = await loop.run_in_executor(None, _generate_previews_sync, html_content)
        
        if not previews:
            logger.warning(f"⚠️ Preview generation failed for project {project_id}")
            return {}
            
        logger.info(f"✅ Successfully generated previews for project {project_id}")
        return previews
        
    except Exception as e:
        logger.error(f"Failed to generate previews for project {project_id}: {e}", exc_info=True)
        return {}