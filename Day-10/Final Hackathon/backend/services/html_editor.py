import google.generativeai as genai
from bs4 import BeautifulSoup
import re
from typing import Dict, Any, List
from core.config import get_settings

class HTMLEditor:
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        self.system_prompt = """You are an expert HTML/CSS editor. Your task is to modify existing HTML code based on user voice commands.

RULES:
1. Analyze the user's editing command carefully
2. Identify what changes need to be made to the HTML/CSS
3. Make ONLY the requested changes - don't modify other parts
4. Preserve the overall structure and existing styling unless specifically asked to change it
5. Ensure the modified HTML remains valid and functional
6. If the command is unclear, make the most reasonable interpretation

COMMON EDIT TYPES:
- Color changes: "change header color to blue", "make background red"
- Text changes: "change title to...", "update the heading"
- Layout changes: "make it centered", "add padding"
- Style changes: "make text bigger", "add shadows"
- Content changes: "add a new section", "remove this paragraph"

OUTPUT FORMAT:
Return ONLY the complete modified HTML code. Do not include explanations or markdown formatting.
If you cannot make the requested change, return the original HTML unchanged.
"""

    async def edit_html(self, html_content: str, edit_command: str) -> Dict[str, Any]:
        """Edit HTML content based on voice command"""
        try:
            # Parse the HTML to understand structure
            soup = BeautifulSoup(html_content, 'html.parser')
            
            # Create edit prompt
            edit_prompt = f"""{self.system_prompt}

CURRENT HTML:
{html_content}

USER COMMAND: {edit_command}

Please modify the HTML according to the user's command and return the complete updated HTML:"""

            # Configure generation parameters
            generation_config = {
                'temperature': self.settings.AI_TEMPERATURE,
                'max_output_tokens': 8192,
            }
            
            # Get AI response
            response = self.model.generate_content(
                edit_prompt,
                generation_config=generation_config
            )
            modified_html = response.text
            
            # Clean up response
            modified_html = self._clean_html_response(modified_html)
            
            # Validate the changes
            if self._is_valid_html(modified_html):
                changes = self._detect_changes(html_content, modified_html)
                return {
                    "html_content": modified_html,
                    "changes": changes,
                    "success": True
                }
            else:
                # If invalid, return original
                return {
                    "html_content": html_content,
                    "changes": [],
                    "success": False,
                    "error": "Generated HTML is invalid"
                }
            
        except Exception as e:
            return {
                "html_content": html_content,
                "changes": [],
                "success": False,
                "error": str(e)
            }

    def _clean_html_response(self, content: str) -> str:
        """Clean up the HTML response from AI"""
        # Remove markdown code blocks if present
        content = re.sub(r'```html\s*', '', content)
        content = re.sub(r'```\s*$', '', content)
        content = content.strip()
        
        return content

    def _is_valid_html(self, html_content: str) -> bool:
        """Basic HTML validation"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            return bool(soup.find('html') or soup.find('body') or len(soup.get_text().strip()) > 0)
        except:
            return False

    def _detect_changes(self, original: str, modified: str) -> List[str]:
        """Detect what changes were made"""
        changes = []
        
        try:
            orig_soup = BeautifulSoup(original, 'html.parser')
            mod_soup = BeautifulSoup(modified, 'html.parser')
            
            # Simple change detection
            if orig_soup.get_text() != mod_soup.get_text():
                changes.append("Text content modified")
            
            # Check for style changes
            orig_styles = self._extract_styles(original)
            mod_styles = self._extract_styles(modified)
            
            if orig_styles != mod_styles:
                changes.append("Styling modified")
            
            # Check for structural changes
            orig_tags = [tag.name for tag in orig_soup.find_all()]
            mod_tags = [tag.name for tag in mod_soup.find_all()]
            
            if len(orig_tags) != len(mod_tags):
                changes.append("HTML structure modified")
            
            if not changes:
                changes.append("HTML updated")
            
        except:
            changes = ["HTML modified"]
        
        return changes

    def _extract_styles(self, html_content: str) -> str:
        """Extract inline styles and style tags"""
        soup = BeautifulSoup(html_content, 'html.parser')
        
        styles = ""
        
        # Extract style tags
        for style_tag in soup.find_all('style'):
            styles += style_tag.get_text()
        
        # Extract inline styles
        for tag in soup.find_all(style=True):
            styles += tag.get('style', '')
        
        return styles

class VoiceCommandParser:
    """Parse and categorize voice commands for HTML editing"""
    
    def __init__(self):
        self.command_patterns = {
            'color_change': [
                r'change.*color.*to\s+(\w+)',
                r'make.*(\w+)\s+color',
                r'set.*color.*(\w+)'
            ],
            'text_change': [
                r'change.*text.*to\s+(.+)',
                r'update.*title.*to\s+(.+)',
                r'modify.*heading.*to\s+(.+)'
            ],
            'style_change': [
                r'make.*bigger',
                r'make.*smaller',
                r'add.*shadow',
                r'center.*',
                r'align.*'
            ],
            'layout_change': [
                r'add.*padding',
                r'remove.*margin',
                r'make.*responsive'
            ]
        }
    
    def parse_command(self, command: str) -> Dict[str, Any]:
        """Parse voice command and extract intent and parameters"""
        command = command.lower().strip()
        
        result = {
            'command': command,
            'intent': 'general_edit',
            'parameters': {},
            'confidence': 0.5
        }
        
        # Check for specific patterns
        for intent, patterns in self.command_patterns.items():
            for pattern in patterns:
                match = re.search(pattern, command)
                if match:
                    result['intent'] = intent
                    result['confidence'] = 0.8
                    if match.groups():
                        result['parameters']['value'] = match.group(1)
                    break
            if result['confidence'] > 0.5:
                break
        
        return result 