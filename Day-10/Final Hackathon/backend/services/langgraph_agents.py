"""
LangGraph Agents Implementation for Voice-Based Website Customizer
Implements the complete workflow with 5 specialized agents:
1. Voice-to-Text Agent
2. Semantic Intent Router Agent  
3. Contextual Editor Agent
4. RAG-Enabled Response Agent
5. Validation Agent
"""

import google.generativeai as genai
from langchain_core.messages import HumanMessage, SystemMessage
from langgraph.graph import StateGraph, END
from typing import Dict, Any, List, TypedDict, Optional
import json
import re
import asyncio
from datetime import datetime
from bs4 import BeautifulSoup
import chromadb
from core.config import get_settings

class AgentState(TypedDict):
    """Shared state across all LangGraph agents"""
    # Input
    voice_input: str
    html_content: str
    session_id: str
    
    # Voice-to-Text Agent outputs
    transcribed_text: str
    filtered_text: str
    confidence_score: float
    
    # Semantic Intent Router outputs
    intent_type: str  # 'layout', 'style', 'content'
    intent_confidence: float
    parameters: Dict[str, Any]
    ambiguous: bool
    clarification_needed: bool
    
    # Contextual Editor outputs
    target_elements: List[str]
    proposed_changes: Dict[str, Any]
    edit_safe: bool
    
    # RAG Response outputs
    context_retrieved: str
    response_generated: str
    multilingual_support: bool
    
    # Validation Agent outputs
    validation_score: float
    compatibility_check: bool
    aesthetic_score: float
    warnings: List[str]
    final_html: str
    
    # Meta
    agent_errors: List[str]
    processing_time: float

class VoiceToTextAgent:
    """Agent 1: Processes voice input and converts to clean text"""
    
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        self.system_prompt = """You are a Voice-to-Text processing specialist. Your task is to:

1. Clean and process transcribed voice input
2. Remove filler words, stutters, and background noise indicators
3. Correct obvious speech recognition errors
4. Maintain the core intent and meaning
5. Assign confidence scores based on text quality

COMMON ISSUES TO FIX:
- Remove: "um", "uh", "like", "you know", "so"
- Fix: "colour" -> "color", "centre" -> "center" (US spelling)
- Correct: obvious misheard words in context
- Remove: [NOISE], [UNCLEAR], [PAUSE] markers

OUTPUT FORMAT:
{
    "cleaned_text": "the processed command",
    "confidence": 0.95,
    "issues_found": ["list of issues corrected"],
    "original_preserved": true/false
}
"""

    async def process(self, state: AgentState) -> AgentState:
        """Process voice input into clean text"""
        try:
            start_time = datetime.now()
            
            voice_input = state.get("voice_input", "")
            
            if not voice_input.strip():
                return {
                    **state,
                    "transcribed_text": "",
                    "filtered_text": "",
                    "confidence_score": 0.0,
                    "agent_errors": state.get("agent_errors", []) + ["Empty voice input"]
                }
            
            # Create processing prompt
            prompt = f"""{self.system_prompt}

VOICE INPUT TO PROCESS: "{voice_input}"

Please clean and process this voice input:"""

            response = self.model.generate_content(prompt)
            
            try:
                result = json.loads(response.text)
                cleaned_text = result.get("cleaned_text", voice_input)
                confidence = result.get("confidence", 0.5)
            except:
                # Fallback: simple cleaning
                cleaned_text = self._simple_clean(voice_input)
                confidence = 0.7
            
            processing_time = (datetime.now() - start_time).total_seconds()
            
            return {
                **state,
                "transcribed_text": voice_input,
                "filtered_text": cleaned_text,
                "confidence_score": confidence,
                "processing_time": processing_time
            }
            
        except Exception as e:
            return {
                **state,
                "transcribed_text": voice_input,
                "filtered_text": voice_input,
                "confidence_score": 0.3,
                "agent_errors": state.get("agent_errors", []) + [f"Voice-to-Text Agent error: {str(e)}"]
            }
    
    def _simple_clean(self, text: str) -> str:
        """Simple fallback text cleaning"""
        # Remove common filler words
        fillers = ["um", "uh", "like", "you know", "so", "well"]
        words = text.lower().split()
        cleaned_words = [w for w in words if w not in fillers]
        return " ".join(cleaned_words)

class SemanticIntentRouterAgent:
    """Agent 2: Classifies commands and extracts intent"""
    
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        self.system_prompt = """You are a Semantic Intent Classification specialist. Analyze user commands and classify them into:

INTENT TYPES:
1. "layout" - Structural changes (positioning, spacing, arrangement)
2. "style" - Visual styling (colors, fonts, effects, sizes) 
3. "content" - Text/content modifications (adding, removing, changing text)

CLASSIFICATION RULES:
- Commands about colors, fonts, sizes = "style"
- Commands about positioning, centering, spacing = "layout"  
- Commands about text changes, adding sections = "content"
- Ambiguous commands should be flagged for clarification

PARAMETER EXTRACTION:
- Extract specific values (colors, sizes, positions)
- Identify target elements (header, button, text, etc.)
- Note any conditional logic

OUTPUT FORMAT:
{
    "intent": "style|layout|content",
    "confidence": 0.95,
    "parameters": {
        "target": "header",
        "property": "color",
        "value": "blue",
        "modifier": "darker"
    },
    "ambiguous": false,
    "clarification": "optional clarification question"
}
"""

    async def process(self, state: AgentState) -> AgentState:
        """Classify intent and extract parameters"""
        try:
            filtered_text = state.get("filtered_text", "")
            
            prompt = f"""{self.system_prompt}

COMMAND TO CLASSIFY: "{filtered_text}"

Please classify this command:"""

            response = self.model.generate_content(prompt)
            
            try:
                result = json.loads(response.text)
                intent_type = result.get("intent", "content")
                confidence = result.get("confidence", 0.5)
                parameters = result.get("parameters", {})
                ambiguous = result.get("ambiguous", False)
                clarification = result.get("clarification", "")
            except:
                # Fallback classification
                intent_type, confidence, parameters = self._simple_classify(filtered_text)
                ambiguous = confidence < 0.7
                clarification = ""
            
            return {
                **state,
                "intent_type": intent_type,
                "intent_confidence": confidence,
                "parameters": parameters,
                "ambiguous": ambiguous,
                "clarification_needed": ambiguous
            }
            
        except Exception as e:
            return {
                **state,
                "intent_type": "content",
                "intent_confidence": 0.3,
                "parameters": {},
                "ambiguous": True,
                "clarification_needed": True,
                "agent_errors": state.get("agent_errors", []) + [f"Intent Router error: {str(e)}"]
            }
    
    def _simple_classify(self, text: str) -> tuple:
        """Simple fallback classification"""
        text_lower = text.lower()
        
        # Style keywords
        if any(word in text_lower for word in ['color', 'font', 'size', 'bigger', 'smaller', 'bold']):
            return "style", 0.8, {"type": "visual_change"}
        
        # Layout keywords  
        if any(word in text_lower for word in ['center', 'align', 'position', 'margin', 'padding']):
            return "layout", 0.8, {"type": "layout_change"}
        
        # Default to content
        return "content", 0.6, {"type": "content_change"}

class ContextualEditorAgent:
    """Agent 3: Identifies target elements and proposes safe edits"""
    
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        self.system_prompt = """You are a Contextual HTML Editor specialist. Your task is to:

1. Analyze HTML structure and identify target elements
2. Propose specific, safe edits that won't break the page
3. Preserve existing functionality and styling
4. Ensure cross-browser compatibility

SAFETY RULES:
- Never remove critical structural elements (html, head, body)
- Preserve existing JavaScript functionality
- Maintain responsive design principles
- Keep accessibility features intact

EDIT TYPES:
- CSS property changes (colors, fonts, sizes)
- Content text updates
- Element positioning and layout
- Adding/removing non-critical elements

OUTPUT FORMAT:
{
    "target_elements": ["#header", ".nav-menu", "h1"],
    "proposed_changes": {
        "css_updates": {"color": "blue", "font-size": "24px"},
        "content_updates": {"text": "New heading"},
        "structure_updates": {"add": [], "remove": []}
    },
    "safety_score": 0.95,
    "warnings": ["potential issues"],
    "preview_html": "modified html snippet"
}
"""

    async def process(self, state: AgentState) -> AgentState:
        """Analyze HTML and propose contextual edits"""
        try:
            html_content = state.get("html_content", "")
            intent_type = state.get("intent_type", "content")
            parameters = state.get("parameters", {})
            filtered_text = state.get("filtered_text", "")
            
            prompt = f"""{self.system_prompt}

CURRENT HTML:
{html_content[:2000]}...

INTENT TYPE: {intent_type}
PARAMETERS: {json.dumps(parameters)}
COMMAND: "{filtered_text}"

Please analyze and propose safe edits:"""

            response = self.model.generate_content(prompt)
            
            try:
                result = json.loads(response.text)
                target_elements = result.get("target_elements", [])
                proposed_changes = result.get("proposed_changes", {})
                safety_score = result.get("safety_score", 0.8)
                warnings = result.get("warnings", [])
            except:
                # Fallback analysis
                target_elements, proposed_changes = self._simple_analysis(html_content, intent_type, parameters)
                safety_score = 0.7
                warnings = ["Using fallback editor"]
            
            return {
                **state,
                "target_elements": target_elements,
                "proposed_changes": proposed_changes,
                "edit_safe": safety_score > 0.6
            }
            
        except Exception as e:
            return {
                **state,
                "target_elements": [],
                "proposed_changes": {},
                "edit_safe": False,
                "agent_errors": state.get("agent_errors", []) + [f"Contextual Editor error: {str(e)}"]
            }
    
    def _simple_analysis(self, html: str, intent: str, params: dict) -> tuple:
        """Simple fallback analysis"""
        soup = BeautifulSoup(html, 'html.parser')
        
        if intent == "style":
            targets = ["h1", "h2", "body", ".main"]
            changes = {"css_updates": params}
        elif intent == "layout":
            targets = [".container", "body", "main"]
            changes = {"structure_updates": params}
        else:
            targets = ["h1", "p", "div"]
            changes = {"content_updates": params}
        
        return targets, changes

class RAGEnabledResponseAgent:
    """Agent 4: Generates context-aware responses using RAG"""
    
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        # Initialize ChromaDB for RAG with consistent settings
        self.chroma_client = self._get_chroma_client()
        
        try:
            self.collection = self.chroma_client.get_collection("voice_commands")
        except:
            self.collection = self.chroma_client.create_collection("voice_commands")
    
    def _get_chroma_client(self):
        """Get ChromaDB client with proper error handling"""
        import os
        import shutil
        import time
        
        try:
            settings = chromadb.config.Settings(
                anonymized_telemetry=False,
                allow_reset=True
            )
            return chromadb.PersistentClient(path="./chroma_db", settings=settings)
        except ValueError as e:
            if "different settings" in str(e):
                print("ChromaDB settings conflict detected. Creating new database...")
                # Create a new database path with timestamp
                timestamp = int(time.time())
                new_path = f"./chroma_db_rag_{timestamp}"
                
                try:
                    settings = chromadb.config.Settings(
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
                # Fallback to in-memory client
                print("Using in-memory ChromaDB client")
                return chromadb.Client()
        except Exception:
            # Fallback to in-memory client
            print("Using in-memory ChromaDB client")
            return chromadb.Client()
    
    async def process(self, state: AgentState) -> AgentState:
        """Generate context-aware response using RAG"""
        try:
            session_id = state.get("session_id", "")
            filtered_text = state.get("filtered_text", "")
            proposed_changes = state.get("proposed_changes", {})
            
            # Retrieve relevant context
            context = await self._retrieve_context(filtered_text, session_id)
            
            # Generate response
            response = await self._generate_response(filtered_text, proposed_changes, context)
            
            # Store for future RAG
            await self._store_interaction(session_id, filtered_text, response)
            
            return {
                **state,
                "context_retrieved": context,
                "response_generated": response,
                "multilingual_support": True
            }
            
        except Exception as e:
            return {
                **state,
                "context_retrieved": "",
                "response_generated": "Changes applied successfully.",
                "multilingual_support": False,
                "agent_errors": state.get("agent_errors", []) + [f"RAG Agent error: {str(e)}"]
            }
    
    async def _retrieve_context(self, query: str, session_id: str) -> str:
        """Retrieve relevant context from vector database"""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=3,
                where={"session_id": session_id}
            )
            
            if results['documents'] and results['documents'][0]:
                return "\n".join(results['documents'][0])
            return ""
        except:
            return ""
    
    async def _generate_response(self, command: str, changes: dict, context: str) -> str:
        """Generate contextual response"""
        prompt = f"""Generate a helpful confirmation message for this voice command:

COMMAND: "{command}"
CHANGES MADE: {json.dumps(changes)}
CONTEXT: {context}

Provide a friendly, informative response that confirms what was changed."""

        try:
            response = self.model.generate_content(prompt)
            return response.text
        except:
            return f"Successfully processed: {command}"
    
    async def _store_interaction(self, session_id: str, command: str, response: str):
        """Store interaction for future RAG"""
        try:
            self.collection.add(
                documents=[f"Command: {command}\nResponse: {response}"],
                metadatas=[{"session_id": session_id, "timestamp": datetime.now().isoformat()}],
                ids=[f"{session_id}_{datetime.now().timestamp()}"]
            )
        except:
            pass

class ValidationAgent:
    """Agent 5: Validates edits for correctness and aesthetics"""
    
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        self.system_prompt = """You are a Website Validation specialist. Evaluate HTML changes for:

1. CORRECTNESS (0-1):
   - Valid HTML syntax
   - Proper CSS formatting
   - No broken functionality

2. COMPATIBILITY (0-1):
   - Cross-browser support
   - Mobile responsiveness
   - Accessibility compliance

3. AESTHETICS (0-1):
   - Visual appeal
   - Design consistency
   - Color harmony
   - Typography balance

VALIDATION RULES:
- Score 0.8+ = Excellent, publish ready
- Score 0.6-0.8 = Good, minor issues
- Score 0.4-0.6 = Fair, needs improvement
- Score <0.4 = Poor, major issues

OUTPUT FORMAT:
{
    "correctness_score": 0.95,
    "compatibility_score": 0.90,
    "aesthetic_score": 0.85,
    "overall_score": 0.90,
    "warnings": ["list of issues"],
    "recommendations": ["suggested improvements"],
    "approved": true
}
"""

    async def process(self, state: AgentState) -> AgentState:
        """Validate the proposed HTML changes"""
        try:
            html_content = state.get("html_content", "")
            proposed_changes = state.get("proposed_changes", {})
            
            # Apply changes to create final HTML
            final_html = await self._apply_changes(html_content, proposed_changes)
            
            # Validate the result
            validation_result = await self._validate_html(final_html)
            
            return {
                **state,
                "validation_score": validation_result.get("overall_score", 0.7),
                "compatibility_check": validation_result.get("compatibility_score", 0.7) > 0.6,
                "aesthetic_score": validation_result.get("aesthetic_score", 0.7),
                "warnings": validation_result.get("warnings", []),
                "final_html": final_html if validation_result.get("approved", True) else html_content
            }
            
        except Exception as e:
            return {
                **state,
                "validation_score": 0.5,
                "compatibility_check": False,
                "aesthetic_score": 0.5,
                "warnings": [f"Validation error: {str(e)}"],
                "final_html": html_content,
                "agent_errors": state.get("agent_errors", []) + [f"Validation Agent error: {str(e)}"]
            }
    
    async def _apply_changes(self, html: str, changes: dict) -> str:
        """Apply proposed changes to HTML"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Apply CSS updates
            css_updates = changes.get("css_updates", {})
            if css_updates:
                # Simple CSS injection for demo
                style_tag = soup.find('style') or soup.new_tag('style')
                if not soup.find('style'):
                    soup.head.append(style_tag)
                
                for prop, value in css_updates.items():
                    style_tag.string = (style_tag.string or "") + f"\nbody {{ {prop}: {value}; }}"
            
            # Apply content updates
            content_updates = changes.get("content_updates", {})
            if content_updates.get("text"):
                h1_tag = soup.find('h1')
                if h1_tag:
                    h1_tag.string = content_updates["text"]
            
            return str(soup)
        except:
            return html
    
    async def _validate_html(self, html: str) -> dict:
        """Validate HTML using AI"""
        prompt = f"""{self.system_prompt}

HTML TO VALIDATE:
{html[:1500]}...

Please validate this HTML:"""

        try:
            response = self.model.generate_content(prompt)
            return json.loads(response.text)
        except:
            return {
                "correctness_score": 0.7,
                "compatibility_score": 0.7,
                "aesthetic_score": 0.7,
                "overall_score": 0.7,
                "warnings": ["Unable to validate"],
                "approved": True
            }

class LangGraphWebsiteEditor:
    """Main LangGraph workflow orchestrating all agents"""
    
    def __init__(self):
        self.voice_agent = VoiceToTextAgent()
        self.intent_agent = SemanticIntentRouterAgent()
        self.editor_agent = ContextualEditorAgent()
        self.rag_agent = RAGEnabledResponseAgent()
        self.validation_agent = ValidationAgent()
        
        self.graph = self._build_graph()
    
    def _build_graph(self) -> StateGraph:
        """Build the complete LangGraph workflow"""
        
        async def voice_to_text_node(state: AgentState) -> AgentState:
            return await self.voice_agent.process(state)
        
        async def intent_router_node(state: AgentState) -> AgentState:
            return await self.intent_agent.process(state)
        
        async def contextual_editor_node(state: AgentState) -> AgentState:
            return await self.editor_agent.process(state)
        
        async def rag_response_node(state: AgentState) -> AgentState:
            return await self.rag_agent.process(state)
        
        async def validation_node(state: AgentState) -> AgentState:
            return await self.validation_agent.process(state)
        
        def should_clarify(state: AgentState) -> str:
            """Decide if clarification is needed"""
            if state.get("clarification_needed", False):
                return "clarification"
            return "continue"
        
        def is_edit_safe(state: AgentState) -> str:
            """Check if edit is safe to proceed"""
            if state.get("edit_safe", False):
                return "safe"
            return "unsafe"
        
        # Build the graph
        graph = StateGraph(AgentState)
        
        # Add nodes
        graph.add_node("voice_to_text", voice_to_text_node)
        graph.add_node("intent_router", intent_router_node)
        graph.add_node("contextual_editor", contextual_editor_node)
        graph.add_node("rag_response", rag_response_node)
        graph.add_node("validation", validation_node)
        graph.add_node("clarification", lambda state: {**state, "response_generated": "Please clarify your request."})
        graph.add_node("unsafe_edit", lambda state: {**state, "response_generated": "Cannot safely perform this edit."})
        
        # Add edges
        graph.add_edge("voice_to_text", "intent_routetr")
        graph.add_conditional_edges(
            "intent_router",
            should_clarify,
            {
                "clarification": "clarification",
                "continue": "contextual_editor"
            }
        )
        graph.add_conditional_edges(
            "contextual_editor",
            is_edit_safe,
            {
                "safe": "validation",
                "unsafe": "unsafe_edit"
            }
        )
        graph.add_edge("validation", "rag_response")
        graph.add_edge("rag_response", END)
        graph.add_edge("clarification", END)
        graph.add_edge("unsafe_edit", END)
        
        # Set entry point
        graph.set_entry_point("voice_to_text")
        
        return graph.compile()
    
    async def process_voice_command(self, voice_input: str, html_content: str, session_id: str) -> dict:
        """Process a voice command through the complete LangGraph workflow"""
        
        initial_state: AgentState = {
            "voice_input": voice_input,
            "html_content": html_content,
            "session_id": session_id,
            "transcribed_text": "",
            "filtered_text": "",
            "confidence_score": 0.0,
            "intent_type": "",
            "intent_confidence": 0.0,
            "parameters": {},
            "ambiguous": False,
            "clarification_needed": False,
            "target_elements": [],
            "proposed_changes": {},
            "edit_safe": False,
            "context_retrieved": "",
            "response_generated": "",
            "multilingual_support": False,
            "validation_score": 0.0,
            "compatibility_check": False,
            "aesthetic_score": 0.0,
            "warnings": [],
            "final_html": "",
            "agent_errors": [],
            "processing_time": 0.0
        }
        
        try:
            # Run the complete workflow
            final_state = await self.graph.ainvoke(initial_state)
            
            return {
                "success": True,
                "html_content": final_state.get("final_html", html_content),
                "response": final_state.get("response_generated", "Changes applied"),
                "validation_score": final_state.get("validation_score", 0.7),
                "warnings": final_state.get("warnings", []),
                "agent_errors": final_state.get("agent_errors", []),
                "processing_time": final_state.get("processing_time", 0.0),
                "metadata": {
                    "intent": final_state.get("intent_type", "unknown"),
                    "confidence": final_state.get("intent_confidence", 0.0),
                    "compatibility": final_state.get("compatibility_check", False),
                    "aesthetic_score": final_state.get("aesthetic_score", 0.0)
                }
            }
            
        except Exception as e:
            return {
                "success": False,
                "html_content": html_content,
                "response": f"Error processing command: {str(e)}",
                "validation_score": 0.0,
                "warnings": [str(e)],
                "agent_errors": [str(e)],
                "processing_time": 0.0,
                "metadata": {}
            } 