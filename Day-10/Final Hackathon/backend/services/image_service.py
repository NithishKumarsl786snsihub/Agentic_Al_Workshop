"""
Image Service for handling placeholder images and image proxying
"""
import requests
import hashlib
from typing import Optional
from fastapi import HTTPException
from fastapi.responses import StreamingResponse
import io

class ImageService:
    """Service for handling placeholder images and image proxying"""
    
    def __init__(self):
        self.default_images = {
            'featured': 'https://picsum.photos/800/600',
            'article1': 'https://picsum.photos/600/400', 
            'article2': 'https://picsum.photos/600/400',
            'banner': 'https://picsum.photos/1200/400',
            'profile': 'https://picsum.photos/300/300',
            'thumbnail': 'https://picsum.photos/200/150',
            'hero': 'https://picsum.photos/1200/600',
            'background': 'https://picsum.photos/1920/1080'
        }
        
        # Alternative image services for diversity
        self.image_services = [
            'https://picsum.photos/{width}/{height}',
            'https://source.unsplash.com/{width}x{height}/?sig={seed}',
            'https://picsum.photos/seed/{seed}/{width}/{height}'
        ]
    
    def get_placeholder_image_url(self, 
                                 width: int = 800, 
                                 height: int = 600, 
                                 category: str = 'general',
                                 seed: Optional[str] = None) -> str:
        """Get a placeholder image URL"""
        
        # If it's a known category, use predefined URL
        if category in self.default_images:
            return self.default_images[category]
        
        # Generate seed for consistent images
        if not seed:
            seed = str(abs(hash(f"{category}_{width}_{height}")) % 1000)
        
        # Use Picsum with seed for consistent images
        return f"https://picsum.photos/seed/{seed}/{width}/{height}"
    
    def get_image_for_content(self, content_type: str, width: int = 800, height: int = 600) -> str:
        """Get appropriate image based on content type"""
        content_mapping = {
            'tech': 'technology',
            'business': 'business',
            'nature': 'nature',
            'food': 'food',
            'travel': 'travel',
            'people': 'people',
            'abstract': 'abstract',
            'architecture': 'architecture'
        }
        
        category = content_mapping.get(content_type.lower(), 'general')
        seed = str(abs(hash(category)) % 1000)
        
        return f"https://picsum.photos/seed/{seed}/{width}/{height}"
    
    async def proxy_image(self, image_name: str) -> StreamingResponse:
        """Proxy image requests to placeholder services"""
        try:
            # Handle common broken image requests
            if image_name in self.default_images:
                image_url = self.default_images[image_name]
            else:
                # Generate based on image name
                seed = str(abs(hash(image_name)) % 1000)
                
                # Determine dimensions based on name
                if 'banner' in image_name.lower() or 'hero' in image_name.lower():
                    width, height = 1200, 400
                elif 'thumb' in image_name.lower():
                    width, height = 300, 200
                elif 'profile' in image_name.lower() or 'avatar' in image_name.lower():
                    width, height = 300, 300
                else:
                    width, height = 800, 600
                
                image_url = f"https://picsum.photos/seed/{seed}/{width}/{height}"
            
            # Fetch the image
            response = requests.get(image_url, timeout=10)
            response.raise_for_status()
            
            # Return as streaming response
            return StreamingResponse(
                io.BytesIO(response.content),
                media_type="image/jpeg",
                headers={
                    "Cache-Control": "public, max-age=3600",
                    "Access-Control-Allow-Origin": "*"
                }
            )
            
        except Exception as e:
            # Return a simple placeholder if everything fails
            fallback_url = "https://via.placeholder.com/800x600/cccccc/666666?text=Image+Not+Found"
            
            try:
                response = requests.get(fallback_url, timeout=5)
                return StreamingResponse(
                    io.BytesIO(response.content),
                    media_type="image/png"
                )
            except:
                raise HTTPException(status_code=404, detail="Image not found")
    
    def replace_broken_images_in_html(self, html_content: str) -> str:
        """Replace broken image paths in HTML with working placeholder URLs"""
        import re
        
        # Common broken image patterns
        broken_patterns = [
            r'src=["\']\/[^"\']*\.jpg["\']',
            r'src=["\']\/[^"\']*\.png["\']',
            r'src=["\']\/[^"\']*\.gif["\']',
            r'src=["\']\/[^"\']*\.jpeg["\']',
            r'src=["\'][^"\']*\.jpg["\'](?![^<]*https?://)',
            r'src=["\'][^"\']*\.png["\'](?![^<]*https?://)',
            r'src=["\'][^"\']*\.gif["\'](?![^<]*https?://)',
            r'src=["\'][^"\']*\.jpeg["\'](?![^<]*https?://)'
        ]
        
        def replace_image(match):
            # Extract the image name/path
            full_match = match.group(0)
            
            # Try to extract meaningful name
            path_match = re.search(r'["\']([^"\']*)["\']', full_match)
            if path_match:
                image_path = path_match.group(1)
                image_name = image_path.split('/')[-1].replace('.jpg', '').replace('.png', '').replace('.gif', '').replace('.jpeg', '')
                
                # Generate appropriate placeholder
                if not image_name:
                    image_name = 'placeholder'
                
                placeholder_url = self.get_placeholder_image_url(category=image_name)
                return f'src="{placeholder_url}"'
            
            # Fallback
            return f'src="https://picsum.photos/800/600"'
        
        # Replace all broken image patterns
        for pattern in broken_patterns:
            html_content = re.sub(pattern, replace_image, html_content)
        
        return html_content

# Global image service instance
image_service = ImageService() 