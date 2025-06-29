import google.generativeai as genai
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing import Dict, Any, List, TypedDict
import json
import re
from core.config import get_settings
from services.api_key_manager import api_key_manager

class WebsiteGenerator:
    def __init__(self):
        self.settings = get_settings()
        # API key manager will handle dynamic key switching
        self.api_key_manager = api_key_manager
        
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
9. **ALWAYS use proper placeholder images from reliable sources**

IMAGE REQUIREMENTS:
- **NEVER use broken image paths like "/featured.jpg" or "image1.jpg"**
- **ALWAYS use working placeholder image services:**
  * For photos: https://picsum.photos/800/600 (random photos)
  * For portraits: https://picsum.photos/400/400 (square photos)
  * For banners: https://picsum.photos/1200/400 (wide banners)
  * For thumbnails: https://picsum.photos/300/200 (small images)
- **Add proper alt text for accessibility**
- **Make images responsive with max-width: 100%**

STYLE GUIDELINES:
- Use modern CSS techniques (flexbox, grid when appropriate)
- Implement responsive design with media queries
- Add subtle animations and transitions
- Use attractive color palettes
- Ensure good contrast and readability
- Include proper spacing and layout

EXAMPLE IMAGE USAGE:
<img src="https://picsum.photos/800/600" alt="Beautiful landscape" style="max-width: 100%; height: auto; border-radius: 8px;">

OUTPUT FORMAT:
Return ONLY the complete HTML code, starting with <!DOCTYPE html> and ending with </html>. 
Do not include any explanations or markdown formatting.
"""

    async def generate_website(self, prompt: str) -> str:
        """Generate a complete HTML website from a text prompt with smart fallback"""
        try:
            # Try Gemini API first (with timeout to avoid hanging)
            import asyncio
            html_content = await asyncio.wait_for(self._generate_with_gemini(prompt), timeout=15.0)
            return html_content
            
        except Exception as e:
            print(f"⚠️ Gemini API failed ({str(e)}), using smart template fallback...")
            # Use smart template-based fallback
            return self._generate_with_template(prompt)
    
    async def _generate_with_gemini(self, prompt: str) -> str:
        """Generate website using Gemini API with automatic key switching"""
        # Create the generation prompt
        full_prompt = f"{self.system_prompt}\n\nUser Request: {prompt}\n\nGenerate the complete HTML website:"
        
        # Configure generation parameters
        generation_config = {
            'temperature': self.settings.AI_TEMPERATURE,
            'max_output_tokens': 8192,
        }
        
        max_retries = len(self.api_key_manager.available_keys)
        
        for attempt in range(max_retries):
            try:
                # Get current working model
                model = self.api_key_manager.get_genai_model()
                if not model:
                    raise Exception("No API keys available")
                
                current_key = self.api_key_manager.get_current_api_key()
                print(f"🎯 Using API Key #{self.api_key_manager.current_key_index + 1} for generation...")
                
                # Generate content using Gemini
                response = model.generate_content(
                    full_prompt,
                    generation_config=generation_config
                )
                html_content = response.text
                
                # Clean up the response (remove markdown if present)
                html_content = self._clean_html_response(html_content)
                
                # Validate and fix HTML if needed
                html_content = self._validate_and_fix_html(html_content)
                
                print(f"✅ Website generated successfully with API Key #{self.api_key_manager.current_key_index + 1}")
                return html_content
                
            except Exception as e:
                current_key = self.api_key_manager.get_current_api_key()
                
                # Handle API error and potentially switch keys
                should_retry = self.api_key_manager.handle_api_error(e, current_key)
                
                if should_retry and attempt < max_retries - 1:
                    print(f"🔄 Retrying with next API key (attempt {attempt + 2}/{max_retries})...")
                    continue
                else:
                    # If this was the last attempt or no retry needed, re-raise
                    raise e
        
        raise Exception("All API keys exhausted")
    
    def _generate_with_template(self, prompt: str) -> str:
        """Generate website using smart templates when API is unavailable"""
        
        # Analyze prompt to choose appropriate template
        prompt_lower = prompt.lower()
        
        # Determine website type
        if any(word in prompt_lower for word in ['portfolio', 'resume', 'cv', 'personal']):
            return self._create_portfolio_template(prompt)
        elif any(word in prompt_lower for word in ['business', 'company', 'corporate', 'service']):
            return self._create_business_template(prompt)
        elif any(word in prompt_lower for word in ['blog', 'article', 'news', 'content']):
            return self._create_blog_template(prompt)
        elif any(word in prompt_lower for word in ['landing', 'product', 'marketing', 'sales']):
            return self._create_landing_template(prompt)
        elif any(word in prompt_lower for word in ['restaurant', 'food', 'menu', 'cafe']):
            return self._create_restaurant_template(prompt)
        else:
            return self._create_generic_template(prompt)
    
    def _create_portfolio_template(self, prompt: str) -> str:
        """Create a professional portfolio template"""
        return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Professional Portfolio</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 60px 0; text-align: center; }
        h1 { font-size: 3em; margin-bottom: 10px; }
        .subtitle { font-size: 1.2em; opacity: 0.9; }
        
        /* Navigation */
        nav { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
        nav ul { display: flex; justify-content: center; list-style: none; padding: 20px 0; }
        nav li { margin: 0 30px; }
        nav a { text-decoration: none; color: #333; font-weight: 500; transition: color 0.3s; }
        nav a:hover { color: #667eea; }
        
        /* Sections */
        section { padding: 80px 0; }
        .section-title { text-align: center; font-size: 2.5em; margin-bottom: 50px; color: #333; }
        
        /* About */
        .about-content { display: grid; grid-template-columns: 1fr 2fr; gap: 50px; align-items: center; }
        .profile-img { width: 300px; height: 300px; border-radius: 50%; object-fit: cover; }
        
        /* Skills */
        .skills-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(250px, 1fr)); gap: 30px; }
        .skill-card { background: white; padding: 30px; border-radius: 10px; box-shadow: 0 5px 15px rgba(0,0,0,0.1); text-align: center; }
        
        /* Projects */
        .projects-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(350px, 1fr)); gap: 30px; }
        .project-card { background: white; border-radius: 10px; overflow: hidden; box-shadow: 0 5px 15px rgba(0,0,0,0.1); transition: transform 0.3s; }
        .project-card:hover { transform: translateY(-5px); }
        .project-img { width: 100%; height: 200px; object-fit: cover; }
        .project-content { padding: 25px; }
        
        /* Contact */
        .contact-form { max-width: 600px; margin: 0 auto; }
        .form-group { margin-bottom: 20px; }
        .form-group input, .form-group textarea { width: 100%; padding: 15px; border: 1px solid #ddd; border-radius: 5px; font-size: 16px; }
        .btn { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; transition: opacity 0.3s; }
        .btn:hover { opacity: 0.9; }
        
        /* Footer */
        footer { background: #333; color: white; text-align: center; padding: 40px 0; }
        
        /* Responsive */
        @media (max-width: 768px) {
            .about-content { grid-template-columns: 1fr; text-align: center; }
            h1 { font-size: 2em; }
            nav ul { flex-direction: column; }
            nav li { margin: 10px 0; }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>John Doe</h1>
            <p class="subtitle">Full Stack Developer & UI/UX Designer</p>
        </div>
    </header>
    
    <nav>
        <ul>
            <li><a href="#about">About</a></li>
            <li><a href="#skills">Skills</a></li>
            <li><a href="#projects">Projects</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
    
    <section id="about">
        <div class="container">
            <h2 class="section-title">About Me</h2>
            <div class="about-content">
                <img src="https://picsum.photos/300/300" alt="Profile" class="profile-img">
                <div>
                    <p>I'm a passionate full-stack developer with 5+ years of experience creating beautiful, functional web applications. I love turning complex problems into simple, beautiful solutions.</p>
                    <br>
                    <p>When I'm not coding, you can find me exploring new technologies, contributing to open source projects, or enjoying a good cup of coffee.</p>
                </div>
            </div>
        </div>
    </section>
    
    <section id="skills" style="background-color: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">Skills</h2>
            <div class="skills-grid">
                <div class="skill-card">
                    <h3>Frontend Development</h3>
                    <p>React, Vue.js, JavaScript, HTML5, CSS3, TypeScript</p>
                </div>
                <div class="skill-card">
                    <h3>Backend Development</h3>
                    <p>Node.js, Python, Express, Django, REST APIs</p>
                </div>
                <div class="skill-card">
                    <h3>Database & Tools</h3>
                    <p>MongoDB, PostgreSQL, Git, Docker, AWS</p>
                </div>
            </div>
        </div>
    </section>
    
    <section id="projects">
        <div class="container">
            <h2 class="section-title">Featured Projects</h2>
            <div class="projects-grid">
                <div class="project-card">
                    <img src="https://picsum.photos/350/200" alt="Project 1" class="project-img">
                    <div class="project-content">
                        <h3>E-Commerce Platform</h3>
                        <p>A full-featured e-commerce platform built with React and Node.js, featuring user authentication, payment processing, and admin dashboard.</p>
                    </div>
                </div>
                <div class="project-card">
                    <img src="https://picsum.photos/seed/project2/350/200" alt="Project 2" class="project-img">
                    <div class="project-content">
                        <h3>Task Management App</h3>
                        <p>A collaborative task management application with real-time updates, built using Vue.js and Firebase.</p>
                    </div>
                </div>
                <div class="project-card">
                    <img src="https://picsum.photos/seed/project3/350/200" alt="Project 3" class="project-img">
                    <div class="project-content">
                        <h3>Weather Dashboard</h3>
                        <p>A responsive weather dashboard that provides detailed forecasts and interactive maps using React and weather APIs.</p>
                    </div>
                </div>
            </div>
        </div>
    </section>
    
    <section id="contact" style="background-color: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">Get In Touch</h2>
            <form class="contact-form">
                <div class="form-group">
                    <input type="text" placeholder="Your Name" required>
                </div>
                <div class="form-group">
                    <input type="email" placeholder="Your Email" required>
                </div>
                <div class="form-group">
                    <textarea rows="5" placeholder="Your Message" required></textarea>
                </div>
                <button type="submit" class="btn">Send Message</button>
            </form>
        </div>
    </section>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 John Doe. All rights reserved.</p>
        </div>
    </footer>
 </body>
 </html>'''
    
    def _create_generic_template(self, prompt: str) -> str:
        """Create a generic modern template"""
        return '''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Modern Website</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; }
        .container { max-width: 1200px; margin: 0 auto; padding: 0 20px; }
        
        /* Header */
        header { background: linear-gradient(135deg, #ff6b6b 0%, #4ecdc4 100%); color: white; padding: 100px 0; text-align: center; }
        h1 { font-size: 3.5em; margin-bottom: 20px; }
        .hero-text { font-size: 1.3em; opacity: 0.9; }
        
        /* Navigation */
        nav { background: white; box-shadow: 0 2px 10px rgba(0,0,0,0.1); position: sticky; top: 0; z-index: 100; }
        nav ul { display: flex; justify-content: center; list-style: none; padding: 20px 0; }
        nav li { margin: 0 30px; }
        nav a { text-decoration: none; color: #333; font-weight: 500; transition: color 0.3s; }
        nav a:hover { color: #ff6b6b; }
        
        /* Sections */
        section { padding: 80px 0; }
        .section-title { text-align: center; font-size: 2.5em; margin-bottom: 50px; color: #333; }
        
        /* Features */
        .features-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 40px; }
        .feature-card { background: white; padding: 40px; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.1); text-align: center; transition: transform 0.3s; }
        .feature-card:hover { transform: translateY(-10px); }
        .feature-icon { font-size: 3em; margin-bottom: 20px; }
        
        /* CTA Section */
        .cta { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-align: center; }
        .btn { background: white; color: #667eea; padding: 15px 30px; border: none; border-radius: 50px; font-size: 18px; font-weight: 600; cursor: pointer; transition: transform 0.3s; }
        .btn:hover { transform: scale(1.05); }
        
        /* Footer */
        footer { background: #333; color: white; text-align: center; padding: 40px 0; }
        
        /* Responsive */
        @media (max-width: 768px) {
            h1 { font-size: 2.5em; }
            nav ul { flex-direction: column; }
            nav li { margin: 10px 0; }
        }
    </style>
</head>
<body>
    <header>
        <div class="container">
            <h1>Welcome to Our Website</h1>
            <p class="hero-text">Discover amazing features and beautiful design</p>
        </div>
    </header>
    
    <nav>
        <ul>
            <li><a href="#features">Features</a></li>
            <li><a href="#about">About</a></li>
            <li><a href="#contact">Contact</a></li>
        </ul>
    </nav>
    
    <section id="features">
        <div class="container">
            <h2 class="section-title">Amazing Features</h2>
            <div class="features-grid">
                <div class="feature-card">
                    <div class="feature-icon">🚀</div>
                    <h3>Fast & Reliable</h3>
                    <p>Lightning-fast performance with 99.9% uptime guarantee. Your website will always be ready for your visitors.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🎨</div>
                    <h3>Beautiful Design</h3>
                    <p>Modern, responsive design that looks great on all devices. Impress your visitors with stunning visuals.</p>
                </div>
                <div class="feature-card">
                    <div class="feature-icon">🔒</div>
                    <h3>Secure & Safe</h3>
                    <p>Enterprise-grade security features to keep your data safe and your visitors' information protected.</p>
                </div>
            </div>
        </div>
    </section>
    
    <section id="about" style="background-color: #f8f9fa;">
        <div class="container">
            <h2 class="section-title">About Us</h2>
            <div style="max-width: 800px; margin: 0 auto; text-align: center;">
                <img src="https://picsum.photos/800/400" alt="About Us" style="width: 100%; border-radius: 10px; margin-bottom: 30px;">
                <p style="font-size: 1.2em; line-height: 1.8;">We are passionate about creating exceptional digital experiences. Our team of experts works tirelessly to deliver innovative solutions that exceed expectations and drive results.</p>
            </div>
        </div>
    </section>
    
    <section class="cta">
        <div class="container">
            <h2 style="margin-bottom: 20px;">Ready to Get Started?</h2>
            <p style="font-size: 1.2em; margin-bottom: 30px;">Join thousands of satisfied customers who trust us with their digital presence.</p>
            <button class="btn">Get Started Today</button>
        </div>
    </section>
    
    <footer>
        <div class="container">
            <p>&copy; 2024 Modern Website. All rights reserved.</p>
        </div>
    </footer>
</body>
</html>'''
    
    def _create_business_template(self, prompt: str) -> str:
        """Create a professional business template"""
        return self._create_generic_template(prompt).replace(
            "Modern Website", "Professional Business"
        ).replace(
            "Welcome to Our Website", "Your Business Name"
        ).replace(
            "Discover amazing features and beautiful design", "Professional Services & Solutions"
        )
    
    def _create_landing_template(self, prompt: str) -> str:
        """Create a landing page template"""
        return self._create_generic_template(prompt).replace(
            "Modern Website", "Product Landing"
        ).replace(
            "Welcome to Our Website", "Amazing Product"
        ).replace(
            "Discover amazing features and beautiful design", "Transform your life with our innovative solution"
        )
    
    def _create_blog_template(self, prompt: str) -> str:
        """Create a blog template"""
        return self._create_generic_template(prompt).replace(
            "Modern Website", "Blog & Articles"
        ).replace(
            "Welcome to Our Website", "Our Blog"
        ).replace(
            "Discover amazing features and beautiful design", "Stay updated with our latest articles and insights"
        )
    
    def _create_restaurant_template(self, prompt: str) -> str:
        """Create a restaurant template"""
        return self._create_generic_template(prompt).replace(
            "Modern Website", "Restaurant"
        ).replace(
            "Welcome to Our Website", "Delicious Dining"
        ).replace(
            "Discover amazing features and beautiful design", "Experience exceptional cuisine in a warm atmosphere"
        ).replace(
            "🚀", "🍽️"
        ).replace(
            "🎨", "🍕"
        ).replace(
            "🔒", "🍷"
        )
    
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

class GenerationState(TypedDict):
    prompt: str
    keywords: List[str]
    style_preferences: Dict[str, str]
    content_type: str
    structure_ready: bool
    content_ready: bool
    styling_complete: bool
    html_content: str

class WebsiteGeneratorGraph:
    """LangGraph implementation for website generation workflow"""
    
    def __init__(self):
        self.generator = WebsiteGenerator()
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow for website generation"""
        
        def parse_prompt(state: GenerationState) -> GenerationState:
            """Parse and analyze the user prompt"""
            prompt = state["prompt"]
            
            # Extract key elements from prompt
            keywords = self._extract_keywords(prompt)
            style_preferences = self._extract_style_preferences(prompt)
            content_type = self._determine_content_type(prompt)
            
            return {
                **state,
                "keywords": keywords,
                "style_preferences": style_preferences,
                "content_type": content_type,
                "structure_ready": False,
                "content_ready": False,
                "styling_complete": False,
                "html_content": ""
            }
        
        def generate_structure(state: GenerationState) -> GenerationState:
            """Generate the basic HTML structure"""
            # This would use Gemini to generate the structure
            return {
                **state,
                "structure_ready": True,
            }
        
        def generate_content(state: GenerationState) -> GenerationState:
            """Generate the actual content"""
            # This would use Gemini to generate content
            return {
                **state,
                "content_ready": True,
            }
        
        def apply_styling(state: GenerationState) -> GenerationState:
            """Apply CSS styling"""
            # For now, fall back to direct generation
            try:
                # Use sync version of generate_website for the graph
                import asyncio
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                html_content = loop.run_until_complete(self.generator.generate_website(state["prompt"]))
                loop.close()
            except Exception as e:
                print(f"Error in apply_styling: {e}")
                html_content = f"<html><body><h1>Error generating website</h1><p>{str(e)}</p></body></html>"
            
            return {
                **state,
                "styling_complete": True,
                "html_content": html_content
            }
        
        # Build the graph
        graph = StateGraph(GenerationState)
        
        # Add nodes
        graph.add_node("parse_prompt", parse_prompt)
        graph.add_node("generate_structure", generate_structure)
        graph.add_node("generate_content", generate_content)
        graph.add_node("apply_styling", apply_styling)
        
        # Add edges
        graph.add_edge("parse_prompt", "generate_structure")
        graph.add_edge("generate_structure", "generate_content")
        graph.add_edge("generate_content", "apply_styling")
        graph.add_edge("apply_styling", END)
        
        # Set entry point
        graph.set_entry_point("parse_prompt")
        
        return graph.compile()
    
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
    
    async def generate(self, prompt: str) -> str:
        """Generate website using the graph workflow"""
        initial_state: GenerationState = {
            "prompt": prompt,
            "keywords": [],
            "style_preferences": {},
            "content_type": "general",
            "structure_ready": False,
            "content_ready": False,
            "styling_complete": False,
            "html_content": ""
        }
        
        try:
            result = self.graph.invoke(initial_state)
            return result.get("html_content", "")
        except Exception as e:
            # Fall back to direct generation if graph fails
            print(f"Graph generation failed: {e}, falling back to direct generation")
            return await self.generator.generate_website(prompt) 