import re
import json
from typing import Dict, List, Optional, Tuple
from datetime import datetime

class AICodeAssistant:
    """
    AI-powered code assistant that analyzes HTML content and provides 
    intelligent suggestions and context-aware follow-up questions.
    """
    
    def __init__(self):
        self.website_patterns = {
            'restaurant': ['menu', 'food', 'restaurant', 'cuisine', 'dining', 'chef', 'reservations'],
            'portfolio': ['portfolio', 'work', 'projects', 'skills', 'experience', 'about'],
            'ecommerce': ['shop', 'buy', 'cart', 'product', 'price', 'store', 'checkout'],
            'blog': ['blog', 'article', 'post', 'news', 'read', 'author', 'content'],
            'agency': ['agency', 'services', 'team', 'clients', 'solutions', 'consulting'],
            'landing': ['landing', 'signup', 'subscribe', 'download', 'cta', 'features']
        }
    
    def analyze_website_type(self, html_content: str, prompt: str = "") -> str:
        """Determine the type of website based on content and prompt"""
        combined_text = (html_content + " " + prompt).lower()
        
        scores = {}
        for website_type, keywords in self.website_patterns.items():
            score = sum(1 for keyword in keywords if keyword in combined_text)
            scores[website_type] = score
        
        return max(scores, key=scores.get) if scores else 'general'
    
    def extract_design_elements(self, html_content: str) -> Dict:
        """Extract key design elements from HTML"""
        elements = {
            'colors': self._extract_colors(html_content),
            'fonts': self._extract_fonts(html_content),
            'layout_type': self._detect_layout_type(html_content),
            'sections': self._identify_sections(html_content),
            'interactive_elements': self._find_interactive_elements(html_content)
        }
        return elements
    
    def _extract_colors(self, html_content: str) -> List[str]:
        """Extract color values from HTML/CSS"""
        color_patterns = [
            r'color:\s*([#\w\(\),\s]+)',
            r'background-color:\s*([#\w\(\),\s]+)',
            r'background:\s*([#\w\(\),\s]+)',
            r'#([0-9A-Fa-f]{6}|[0-9A-Fa-f]{3})',
            r'rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)',
            r'rgba\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*,\s*[\d.]+\s*\)'
        ]
        
        colors = []
        for pattern in color_patterns:
            matches = re.findall(pattern, html_content, re.IGNORECASE)
            colors.extend(matches)
        
        return list(set(colors))[:5]  # Return up to 5 unique colors
    
    def _extract_fonts(self, html_content: str) -> List[str]:
        """Extract font families from HTML/CSS"""
        font_pattern = r'font-family:\s*([^;]+)'
        fonts = re.findall(font_pattern, html_content, re.IGNORECASE)
        return list(set(fonts))[:3]  # Return up to 3 unique fonts
    
    def _detect_layout_type(self, html_content: str) -> str:
        """Detect the layout structure"""
        if 'display: grid' in html_content or 'grid-template' in html_content:
            return 'grid'
        elif 'display: flex' in html_content or 'flex-direction' in html_content:
            return 'flexbox'
        elif 'float:' in html_content:
            return 'float'
        else:
            return 'block'
    
    def _identify_sections(self, html_content: str) -> List[str]:
        """Identify main sections of the website"""
        section_patterns = {
            'header': r'<header|class="header|id="header',
            'nav': r'<nav|class="nav|navigation',
            'hero': r'class="hero|id="hero',
            'about': r'class="about|id="about',
            'services': r'class="services|id="services',
            'portfolio': r'class="portfolio|id="portfolio',
            'contact': r'class="contact|id="contact',
            'footer': r'<footer|class="footer|id="footer'
        }
        
        sections = []
        for section, pattern in section_patterns.items():
            if re.search(pattern, html_content, re.IGNORECASE):
                sections.append(section)
        
        return sections
    
    def _find_interactive_elements(self, html_content: str) -> List[str]:
        """Find interactive elements in the HTML"""
        elements = []
        
        interactive_patterns = {
            'buttons': r'<button|type="button"',
            'forms': r'<form',
            'links': r'<a\s+href',
            'inputs': r'<input',
            'modals': r'class="modal|id="modal',
            'carousel': r'class="carousel|swiper|slider'
        }
        
        for element, pattern in interactive_patterns.items():
            if re.search(pattern, html_content, re.IGNORECASE):
                elements.append(element)
        
        return elements
    
    def generate_contextual_suggestions(self, website_type: str, current_elements: Dict, edit_request: str) -> Dict:
        """Generate context-aware suggestions based on website type and current content"""
        
        suggestions = {
            'improvements': [],
            'questions': [],
            'next_steps': []
        }
        
        # Context-specific suggestions based on website type
        if website_type == 'restaurant':
            suggestions['improvements'] = [
                "Add a menu section with appetizing food images",
                "Include reservation system with contact info",
                "Add chef's special or featured dishes section"
            ]
            suggestions['questions'] = [
                "What type of cuisine does your restaurant serve?",
                "Do you want to highlight any signature dishes?",
                "Should we add an online reservation system?"
            ]
        
        elif website_type == 'portfolio':
            suggestions['improvements'] = [
                "Showcase your best work in a project gallery",
                "Add a skills section with visual progress bars",
                "Include client testimonials for credibility"
            ]
            suggestions['questions'] = [
                "What's your primary profession or specialty?",
                "Which projects would you like to highlight?",
                "Do you want to include a downloadable resume?"
            ]
        
        elif website_type == 'ecommerce':
            suggestions['improvements'] = [
                "Add product filtering and search functionality",
                "Include customer reviews and ratings",
                "Implement shopping cart with secure checkout"
            ]
            suggestions['questions'] = [
                "What products are you selling?",
                "Do you need payment integration?",
                "Should we add customer account features?"
            ]
        
        elif website_type == 'blog':
            suggestions['improvements'] = [
                "Add categories and tags for better navigation",
                "Include author bio and social media links",
                "Implement search functionality for posts"
            ]
            suggestions['questions'] = [
                "What topics do you write about?",
                "Do you want to enable comments?",
                "Should we add a newsletter signup?"
            ]
        
        # Analyze the specific edit request for more targeted suggestions
        edit_lower = edit_request.lower()
        
        if 'color' in edit_lower or 'blue' in edit_lower or 'red' in edit_lower:
            suggestions['questions'].append("Would you like me to apply this color consistently across all elements?")
            suggestions['next_steps'].append("Update the color scheme for better visual harmony")
        
        if 'header' in edit_lower:
            suggestions['questions'].append("Should the header be sticky when scrolling?")
            suggestions['next_steps'].append("Consider adding navigation links to the header")
        
        if 'font' in edit_lower or 'text' in edit_lower:
            suggestions['questions'].append("Would you like me to improve the typography hierarchy?")
            suggestions['next_steps'].append("Ensure text is readable across all devices")
        
        return suggestions
    
    def create_intelligent_response(self, html_content: str, edit_request: str, context: Dict = None) -> Dict:
        """Create an intelligent response with suggestions and questions"""
        
        # Analyze the website
        website_type = self.analyze_website_type(html_content, edit_request)
        current_elements = self.extract_design_elements(html_content)
        
        # Generate contextual suggestions
        suggestions = self.generate_contextual_suggestions(website_type, current_elements, edit_request)
        
        # Create response based on edit request
        response = {
            'type': 'confirmation',
            'message': self._generate_confirmation_message(edit_request, website_type),
            'summary': f"Updated {website_type} website based on your request",
            'suggestions': suggestions['improvements'][:2],  # Limit to 2 suggestions
            'follow_up_question': self._select_best_question(suggestions['questions'], edit_request),
            'original_command': edit_request,
            'editable': True,
            'language': 'English',
            'voice_friendly': True,
            'metadata': {
                'website_type': website_type,
                'intent': self._classify_intent(edit_request),
                'confidence': 0.85,
                'context_used': True,
                'timestamp': datetime.now().isoformat()
            }
        }
        
        return response
    
    def _generate_confirmation_message(self, edit_request: str, website_type: str) -> str:
        """Generate a human-like confirmation message"""
        
        templates = [
            f"Perfect! I've updated your {website_type} design.",
            f"Great choice! The changes look fantastic.",
            f"Done! Your {website_type} now has a more professional look.",
            f"Excellent! The update enhances your {website_type}'s appeal.",
            f"Nice! This change improves the overall user experience."
        ]
        
        # Select template based on edit type
        if 'color' in edit_request.lower():
            return f"Perfect! The new color scheme gives your {website_type} a fresh, modern look."
        elif 'header' in edit_request.lower():
            return f"Great! The updated header makes your {website_type} more professional."
        elif 'font' in edit_request.lower():
            return f"Excellent! The new typography improves readability and visual appeal."
        else:
            return templates[0]
    
    def _select_best_question(self, questions: List[str], edit_request: str) -> str:
        """Select the most relevant follow-up question"""
        if not questions:
            return "What other improvements would you like to make?"
        
        # Prioritize questions based on edit request
        if 'color' in edit_request.lower():
            color_questions = [q for q in questions if 'color' in q.lower()]
            if color_questions:
                return color_questions[0]
        
        return questions[0]  # Return the first question as fallback
    
    def _classify_intent(self, edit_request: str) -> str:
        """Classify the intent of the edit request"""
        
        intent_patterns = {
            'styling': ['color', 'font', 'size', 'style', 'background'],
            'layout': ['layout', 'position', 'align', 'center', 'grid'],
            'content': ['add', 'text', 'image', 'section', 'content'],
            'navigation': ['menu', 'nav', 'link', 'header', 'footer'],
            'interactive': ['button', 'form', 'click', 'hover', 'animation']
        }
        
        edit_lower = edit_request.lower()
        for intent, keywords in intent_patterns.items():
            if any(keyword in edit_lower for keyword in keywords):
                return intent
        
        return 'general'

# Initialize the AI assistant
ai_assistant = AICodeAssistant() 