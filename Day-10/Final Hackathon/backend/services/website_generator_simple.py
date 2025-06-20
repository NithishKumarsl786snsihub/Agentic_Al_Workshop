import google.generativeai as genai
from typing import Dict, Any, List
import json
import re
from core.config import get_settings

class WebsiteGenerator:
    def __init__(self):
        self.settings = get_settings()
        # Configure Gemini
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        # Website generation prompts
        self.system_prompt = """You are an expert web developer and designer. Your task is to generate complete, modern, responsive HTML websites with inline CSS styling based on user prompts.

REQUIREMENTS:
1. Generate ONLY complete HTML with inline CSS (no external files)
2. Make it responsive and mobile-friendly
3. Use modern design principles and attractive styling
4. Include proper semantic HTML structure
5. Add appropriate meta tags
6. Ensure cross-browser compatibility
7. Use attractive color schemes and typography
8. Include hover effects and smooth transitions where appropriate

STYLE GUIDELINES:
- Use modern CSS techniques (flexbox, grid when appropriate)
- Implement responsive design with media queries
- Add subtle animations and transitions
- Use attractive color palettes
- Ensure good contrast and readability
- Include proper spacing and layout

OUTPUT FORMAT:
Return ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>. 
Do not include any explanations or markdown formatting.
"""

    async def generate_website(self, prompt: str) -> str:
        """Generate a complete HTML website from a text prompt"""
        try:
            # Create the generation prompt
            full_prompt = f"{self.system_prompt}\n\nUser Request: {prompt}\n\nGenerate the complete HTML website:"
            
            # Configure generation parameters
            generation_config = {
                'temperature': self.settings.AI_TEMPERATURE,
                'max_output_tokens': 8192,
            }
            
            # Generate content using Gemini
            response = self.model.generate_content(
                full_prompt,
                generation_config=generation_config
            )
            html_content = response.text
            
            # Clean up the response (remove markdown if present)
            html_content = self._clean_html_response(html_content)
            
            # Validate and fix HTML if needed
            html_content = self._validate_and_fix_html(html_content)
            
            return html_content
            
        except Exception as e:
            raise Exception(f"Website generation failed: {str(e)}")
    
    def _clean_html_response(self, content: str) -> str:
        """Clean up the HTML response from Gemini"""
        # Remove markdown code blocks if present
        content = re.sub(r'```html\s*', '', content)
        content = re.sub(r'```\s*$', '', content)
        
        # Remove any leading/trailing whitespace
        content = content.strip()
        
        # Ensure it starts with DOCTYPE
        if not content.lower().startswith('<!doctype'):
            content = '<!DOCTYPE html>\n' + content
        
        return content
    
    def _validate_and_fix_html(self, html_content: str) -> str:
        """Basic HTML validation and fixing"""
        # Ensure basic structure exists
        if '<html' not in html_content.lower():
            html_content = f'<!DOCTYPE html>\n<html lang="en">\n<head>\n<meta charset="UTF-8">\n<meta name="viewport" content="width=device-width, initial-scale=1.0">\n<title>Generated Website</title>\n</head>\n<body>\n{html_content}\n</body>\n</html>'
        
        # Ensure viewport meta tag exists
        if 'viewport' not in html_content:
            html_content = html_content.replace(
                '<head>',
                '<head>\n<meta name="viewport" content="width=device-width, initial-scale=1.0">'
            )
        
        return html_content

    def analyze_prompt(self, prompt: str) -> Dict[str, Any]:
        """Analyze the user prompt to extract key information"""
        analysis = {
            "keywords": self._extract_keywords(prompt),
            "style_preferences": self._extract_style_preferences(prompt),
            "content_type": self._determine_content_type(prompt),
            "complexity": self._assess_complexity(prompt)
        }
        return analysis
    
    def _extract_keywords(self, prompt: str) -> List[str]:
        """Extract keywords from the prompt"""
        # Simple keyword extraction (could be enhanced with NLP)
        words = prompt.lower().split()
        keywords = [word for word in words if len(word) > 3]
        return keywords[:10]  # Limit to top 10
    
    def _extract_style_preferences(self, prompt: str) -> Dict[str, str]:
        """Extract style preferences from prompt"""
        styles = {}
        
        # Color detection
        colors = ['blue', 'red', 'green', 'purple', 'orange', 'yellow', 'pink', 'black', 'white', 'gray', 'dark', 'light']
        for color in colors:
            if color in prompt.lower():
                styles['color_preference'] = color
                break
        
        # Theme detection
        if any(word in prompt.lower() for word in ['modern', 'contemporary', 'sleek']):
            styles['theme'] = 'modern'
        elif any(word in prompt.lower() for word in ['classic', 'traditional', 'vintage']):
            styles['theme'] = 'classic'
        elif any(word in prompt.lower() for word in ['minimal', 'clean', 'simple']):
            styles['theme'] = 'minimal'
        
        return styles
    
    def _determine_content_type(self, prompt: str) -> str:
        """Determine the type of website to generate"""
        if any(word in prompt.lower() for word in ['portfolio', 'resume', 'cv']):
            return 'portfolio'
        elif any(word in prompt.lower() for word in ['business', 'company', 'corporate']):
            return 'business'
        elif any(word in prompt.lower() for word in ['blog', 'article', 'news']):
            return 'blog'
        elif any(word in prompt.lower() for word in ['landing', 'product', 'service']):
            return 'landing'
        else:
            return 'general'
    
    def _assess_complexity(self, prompt: str) -> str:
        """Assess the complexity of the requested website"""
        complexity_indicators = {
            'simple': ['simple', 'basic', 'minimal', 'clean'],
            'medium': ['modern', 'professional', 'business'],
            'complex': ['advanced', 'interactive', 'animation', 'dynamic', 'dashboard']
        }
        
        prompt_lower = prompt.lower()
        
        for level, indicators in complexity_indicators.items():
            if any(indicator in prompt_lower for indicator in indicators):
                return level
        
        return 'medium'  # Default complexity 