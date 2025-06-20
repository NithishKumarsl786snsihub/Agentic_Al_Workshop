import json
import re
from typing import Dict, List, Any, Optional, Tuple
from datetime import datetime
import chromadb
from chromadb.config import Settings
import google.generativeai as genai
from core.config import get_settings

class IntelligentResponseService:
    """Service for generating intelligent, contextual confirmation and clarification messages"""
    
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        # Initialize ChromaDB for historical context with consistent settings
        self.chroma_client = self._get_or_create_chroma_client()
        
        try:
            self.context_collection = self.chroma_client.get_collection("command_context")
        except:
            self.context_collection = self.chroma_client.create_collection("command_context")
        
        # Common FAQs and responses
        self.faq_responses = {
            "color": {
                "follow_up": "Would you like to adjust the text color to match, or change any other colors?",
                "suggestions": ["Adjust text color for better contrast", "Apply color to other elements", "Change hover effects"]
            },
            "typography": {
                "follow_up": "Should I also adjust the font size or weight for better readability?",
                "suggestions": ["Increase font size", "Make text bold", "Change font family"]
            },
            "layout": {
                "follow_up": "Would you like me to adjust spacing or alignment for better visual balance?",
                "suggestions": ["Add padding", "Center content", "Adjust margins"]
            },
            "content": {
                "follow_up": "Should I update any related text or add more content sections?",
                "suggestions": ["Add more paragraphs", "Update navigation links", "Add call-to-action buttons"]
            }
        }
        
        # Ambiguity patterns for clarification requests
        self.ambiguity_patterns = {
            "header": ["main header", "page header", "section header", "subheader"],
            "button": ["submit button", "navigation button", "call-to-action button", "menu button"],
            "text": ["body text", "heading text", "button text", "link text"],
            "color": ["background color", "text color", "border color", "accent color"],
            "size": ["font size", "element size", "image size", "container size"]
        }

    def _get_or_create_chroma_client(self):
        """Get or create ChromaDB client with proper error handling"""
        import os
        import shutil
        import time
        import tempfile
        
        try:
            # Create consistent settings
            settings = Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
            
            # Try to create client with consistent settings
            return chromadb.PersistentClient(path="./chroma_db", settings=settings)
            
        except ValueError as e:
            if "different settings" in str(e):
                print("ChromaDB settings conflict detected. Attempting database reset...")
                
                # Try to create a new database path with timestamp
                timestamp = int(time.time())
                new_path = f"./chroma_db_{timestamp}"
                
                try:
                    settings = Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                    client = chromadb.PersistentClient(path=new_path, settings=settings)
                    print(f"Created new ChromaDB at {new_path}")
                    return client
                except Exception as fallback_error:
                    print(f"Fallback database creation failed: {fallback_error}")
                    # Use in-memory client as last resort
                    print("Using in-memory ChromaDB client")
                    return chromadb.Client()
            else:
                raise e
        except Exception as e:
            print(f"Error initializing ChromaDB: {e}")
            # Fallback to in-memory client if persistent fails
            print("Using in-memory ChromaDB client")
            return chromadb.Client()

    async def generate_confirmation_response(
        self, 
        command: str, 
        edit_result: Dict[str, Any], 
        session_id: str,
        language: str = "en"
    ) -> Dict[str, Any]:
        """Generate intelligent confirmation response with context and suggestions"""
        
        try:
            # Retrieve historical context
            context = await self._get_session_context(session_id, command)
            
            # Analyze the command and result
            intent_analysis = self._analyze_command_intent(command)
            change_summary = self._extract_change_summary(edit_result)
            
            # Check for ambiguity
            clarification_needed = self._check_ambiguity(command)
            
            if clarification_needed:
                return await self._generate_clarification_request(command, intent_analysis, language)
            
            # Generate main confirmation message
            confirmation = await self._generate_confirmation_message(
                command, change_summary, context, intent_analysis, language
            )
            
            # Generate follow-up suggestions
            suggestions = self._generate_smart_suggestions(intent_analysis, edit_result, context)
            
            # Store interaction for future context
            await self._store_interaction(session_id, command, confirmation, edit_result)
            
            return {
                "type": "confirmation",
                "message": confirmation,
                "summary": change_summary,
                "suggestions": suggestions,
                "follow_up_question": self._get_follow_up_question(intent_analysis),
                "editable": True,
                "language": language,
                "voice_friendly": True,
                "metadata": {
                    "intent": intent_analysis["primary_intent"],
                    "confidence": intent_analysis["confidence"],
                    "context_used": len(context) > 0
                }
            }
            
        except Exception as e:
            # Fallback response
            return {
                "type": "confirmation",
                "message": f"Successfully applied: {command}",
                "summary": "Changes applied to your website",
                "suggestions": [],
                "follow_up_question": None,
                "editable": True,
                "language": language,
                "voice_friendly": True,
                "metadata": {"error": str(e)}
            }

    async def _get_session_context(self, session_id: str, current_command: str) -> List[str]:
        """Retrieve relevant historical context from the session"""
        try:
            results = self.context_collection.query(
                query_texts=[current_command],
                n_results=5,
                where={"session_id": session_id}
            )
            
            if results['documents'] and results['documents'][0]:
                return results['documents'][0]
            return []
        except:
            return []

    def _analyze_command_intent(self, command: str) -> Dict[str, Any]:
        """Analyze the command to understand user intent"""
        command_lower = command.lower()
        
        # Intent categories and keywords
        intent_keywords = {
            "color": ["color", "colour", "background", "foreground", "theme"],
            "typography": ["font", "text", "size", "bold", "italic", "heading"],
            "layout": ["layout", "position", "align", "center", "margin", "padding"],
            "content": ["add", "remove", "change", "text", "content", "words"],
            "style": ["style", "css", "appearance", "look", "design"],
            "responsive": ["mobile", "responsive", "breakpoint", "device"],
            "animation": ["animate", "animation", "transition", "effect"],
            "form": ["form", "input", "button", "submit", "field"]
        }
        
        # Calculate intent scores
        intent_scores = {}
        for intent, keywords in intent_keywords.items():
            score = sum(1 for keyword in keywords if keyword in command_lower)
            if score > 0:
                intent_scores[intent] = score / len(keywords)
        
        # Get primary intent
        primary_intent = max(intent_scores.items(), key=lambda x: x[1]) if intent_scores else ("general", 0.5)
        
        # Extract specific elements mentioned
        elements = self._extract_mentioned_elements(command_lower)
        
        return {
            "primary_intent": primary_intent[0],
            "confidence": primary_intent[1],
            "secondary_intents": sorted(intent_scores.items(), key=lambda x: x[1], reverse=True)[1:3],
            "mentioned_elements": elements,
            "command_complexity": len(command.split())
        }

    def _extract_mentioned_elements(self, command: str) -> List[str]:
        """Extract specific HTML elements or design elements mentioned in the command"""
        elements = []
        element_keywords = {
            "header": ["header", "title", "heading", "h1", "h2"],
            "button": ["button", "btn", "click", "submit"],
            "text": ["text", "paragraph", "content", "words"],
            "image": ["image", "img", "picture", "photo"],
            "link": ["link", "anchor", "href", "navigation"],
            "form": ["form", "input", "field", "textarea"],
            "footer": ["footer", "bottom", "contact"],
            "sidebar": ["sidebar", "side", "navigation", "menu"]
        }
        
        for element, keywords in element_keywords.items():
            if any(keyword in command for keyword in keywords):
                elements.append(element)
        
        return elements

    def _extract_change_summary(self, edit_result: Dict[str, Any]) -> str:
        """Extract a human-readable summary of changes made"""
        changes = edit_result.get("changes", [])
        if isinstance(changes, list) and changes:
            return ", ".join(changes)
        elif edit_result.get("success"):
            return "Visual and content updates applied"
        else:
            return "No changes were made"

    def _check_ambiguity(self, command: str) -> bool:
        """Check if the command is ambiguous and needs clarification"""
        command_lower = command.lower()
        
        # Common ambiguous terms
        ambiguous_terms = [
            ("header", ["main header", "page header", "section header"]),
            ("button", ["submit button", "navigation button", "menu button"]),
            ("text", ["heading text", "body text", "button text"]),
            ("color", ["background color", "text color", "border color"])
        ]
        
        for term, options in ambiguous_terms:
            if term in command_lower and len(options) > 1:
                # Check if the command doesn't specify which type
                if not any(option.replace(term, "").strip() in command_lower for option in options):
                    return True
        
        return False

    async def _generate_clarification_request(
        self, 
        command: str, 
        intent_analysis: Dict[str, Any], 
        language: str
    ) -> Dict[str, Any]:
        """Generate a clarification request for ambiguous commands"""
        
        mentioned_elements = intent_analysis.get("mentioned_elements", [])
        primary_intent = intent_analysis.get("primary_intent", "general")
        
        clarification_prompt = f"""Generate a polite clarification question for this ambiguous command:

COMMAND: "{command}"
INTENT: {primary_intent}
MENTIONED ELEMENTS: {mentioned_elements}

The user's command is unclear. Ask for clarification to help them achieve their goal.
Be specific about the options available. Keep it conversational and helpful.

Respond in {language} language."""

        try:
            response = self.model.generate_content(clarification_prompt)
            clarification_text = response.text.strip()
            
            # Generate specific options based on ambiguity
            options = self._generate_clarification_options(command, intent_analysis)
            
            return {
                "type": "clarification",
                "message": clarification_text,
                "summary": "Clarification needed",
                "options": options,
                "original_command": command,
                "editable": True,
                "language": language,
                "voice_friendly": True,
                "metadata": {
                    "clarification_needed": True,
                    "intent": primary_intent
                }
            }
        except:
            # Fallback clarification
            return {
                "type": "clarification",
                "message": f"Could you be more specific about which part you'd like to change? I heard '{command}' but need more details.",
                "summary": "Clarification needed",
                "options": ["Main header", "Page content", "Button styles", "Color scheme"],
                "original_command": command,
                "editable": True,
                "language": language,
                "voice_friendly": True
            }

    def _generate_clarification_options(self, command: str, intent_analysis: Dict[str, Any]) -> List[str]:
        """Generate specific clarification options based on the ambiguous command"""
        command_lower = command.lower()
        options = []
        
        # Check for specific ambiguous terms and provide relevant options
        for term, term_options in self.ambiguity_patterns.items():
            if term in command_lower:
                options.extend(term_options[:3])  # Limit to 3 options
                break
        
        # If no specific patterns match, provide general options
        if not options:
            intent = intent_analysis.get("primary_intent", "general")
            general_options = {
                "color": ["Background color", "Text color", "Accent color"],
                "typography": ["Heading font", "Body text", "Button text"],
                "layout": ["Main content", "Header section", "Footer area"],
                "content": ["Page title", "Main text", "Button labels"]
            }
            options = general_options.get(intent, ["Main content", "Header area", "Footer section"])
        
        return options[:4]  # Limit to 4 options maximum

    async def _generate_confirmation_message(
        self, 
        command: str, 
        change_summary: str, 
        context: List[str], 
        intent_analysis: Dict[str, Any],
        language: str
    ) -> str:
        """Generate the main confirmation message"""
        
        context_text = "\n".join(context[-3:]) if context else "No previous context"
        
        confirmation_prompt = f"""Generate a friendly, professional confirmation message for this website edit:

COMMAND: "{command}"
CHANGES MADE: {change_summary}
INTENT: {intent_analysis['primary_intent']}
RECENT CONTEXT: {context_text}

Create a confirmation that:
1. Clearly states what was changed
2. Uses friendly, conversational tone
3. Is suitable for both text and voice output
4. References the specific change made
5. Is approximately 1-2 sentences

Respond in {language} language."""

        try:
            response = self.model.generate_content(confirmation_prompt)
            return response.text.strip()
        except:
            # Fallback confirmation
            return f"✅ {change_summary} - Your website has been updated successfully!"

    def _generate_smart_suggestions(
        self, 
        intent_analysis: Dict[str, Any], 
        edit_result: Dict[str, Any], 
        context: List[str]
    ) -> List[str]:
        """Generate smart follow-up suggestions based on the edit"""
        
        primary_intent = intent_analysis.get("primary_intent", "general")
        suggestions = []
        
        # Get base suggestions from FAQ
        if primary_intent in self.faq_responses:
            suggestions.extend(self.faq_responses[primary_intent]["suggestions"][:2])
        
        # Add context-aware suggestions
        mentioned_elements = intent_analysis.get("mentioned_elements", [])
        
        if "header" in mentioned_elements:
            suggestions.append("Update navigation menu to match")
        if "button" in mentioned_elements:
            suggestions.append("Apply similar styling to all buttons")
        if "color" in primary_intent:
            suggestions.append("Adjust contrast for accessibility")
        
        # Remove duplicates and limit to 3
        return list(dict.fromkeys(suggestions))[:3]

    def _get_follow_up_question(self, intent_analysis: Dict[str, Any]) -> Optional[str]:
        """Get appropriate follow-up question based on intent"""
        primary_intent = intent_analysis.get("primary_intent", "general")
        
        if primary_intent in self.faq_responses:
            return self.faq_responses[primary_intent]["follow_up"]
        
        return None

    async def _store_interaction(
        self, 
        session_id: str, 
        command: str, 
        response: str, 
        edit_result: Dict[str, Any]
    ):
        """Store the interaction for future context retrieval"""
        try:
            document = f"Command: {command}\nResponse: {response}\nResult: {edit_result.get('success', False)}"
            
            self.context_collection.add(
                documents=[document],
                metadatas=[{
                    "session_id": session_id,
                    "timestamp": datetime.now().isoformat(),
                    "command_type": "edit",
                    "success": edit_result.get("success", False)
                }],
                ids=[f"{session_id}_{datetime.now().timestamp()}"]
            )
        except Exception as e:
            print(f"Warning: Failed to store interaction context: {e}")

    def get_voice_friendly_response(self, response_data: Dict[str, Any]) -> str:
        """Convert response to voice-friendly format for TTS"""
        message = response_data.get("message", "")
        
        # Remove markdown and special characters for voice
        voice_text = re.sub(r'[*_`#]', '', message)
        voice_text = re.sub(r'✅|🎨|🔧|⚡', '', voice_text)
        
        # Add pause indicators for natural speech
        voice_text = voice_text.replace('. ', '. ... ')
        voice_text = voice_text.replace('! ', '! ... ')
        voice_text = voice_text.replace('? ', '? ... ')
        
        return voice_text.strip() 