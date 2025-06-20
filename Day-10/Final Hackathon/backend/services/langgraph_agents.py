"""
LangGraph Agents Implementation for Voice-Based Website Customizer
Implements the complete workflow with 5 specialized agents using proper LangChain patterns:
1. Voice-to-Text Agent
2. Semantic Intent Router Agent  
3. Contextual Editor Agent
4. RAG-Enabled Response Agent
5. Validation Agent
"""

import google.generativeai as genai
from langchain_core.messages import HumanMessage, SystemMessage, AIMessage
from langchain_core.prompts import ChatPromptTemplate, PromptTemplate
from langchain_core.output_parsers import JsonOutputParser, PydanticOutputParser
from langchain_core.tools import BaseTool
try:
    from langchain_core.memory import ConversationBufferMemory
except ImportError:
    # Fallback for newer LangChain versions
    from langchain.memory import ConversationBufferMemory
from langchain_google_genai import ChatGoogleGenerativeAI
from langgraph.graph import StateGraph, END
from typing import Dict, Any, List, TypedDict, Optional
from pydantic import BaseModel, Field
import json
import re
import asyncio
from datetime import datetime
from bs4 import BeautifulSoup
import chromadb
from core.config import get_settings

# Pydantic models for structured outputs
class VoiceProcessingOutput(BaseModel):
    cleaned_text: str = Field(description="The processed and cleaned text")
    confidence: float = Field(description="Confidence score between 0 and 1")
    issues_found: List[str] = Field(description="List of issues found and corrected")
    original_preserved: bool = Field(description="Whether original meaning was preserved")

class IntentClassificationOutput(BaseModel):
    intent: str = Field(description="Intent type: style, layout, or content")
    confidence: float = Field(description="Confidence score between 0 and 1")
    parameters: Dict[str, Any] = Field(description="Extracted parameters from command")
    ambiguous: bool = Field(description="Whether the command is ambiguous")
    clarification: Optional[str] = Field(description="Clarification question if needed")

class EditorAnalysisOutput(BaseModel):
    target_elements: List[str] = Field(description="HTML elements to be modified")
    proposed_changes: Dict[str, Any] = Field(description="Specific changes to apply")
    edit_safe: bool = Field(description="Whether the edit is safe to perform")
    warnings: List[str] = Field(description="Any warnings about the edit")

class ValidationOutput(BaseModel):
    correctness_score: float = Field(description="HTML correctness score")
    compatibility_score: float = Field(description="Browser compatibility score")
    aesthetic_score: float = Field(description="Visual design score")
    overall_score: float = Field(description="Overall quality score")
    warnings: List[str] = Field(description="Validation warnings")
    approved: bool = Field(description="Whether changes are approved")

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
    memory: Dict[str, Any]

class VoiceToTextTool(BaseTool):
    """LangChain tool for voice text processing"""
    name: str = "voice_text_processor"
    description: str = "Cleans and processes transcribed voice input text"
    
    def _run(self, voice_input: str) -> str:
        """Process voice input synchronously"""
        return self._clean_text(voice_input)
    
    async def _arun(self, voice_input: str) -> str:
        """Process voice input asynchronously"""
        return self._clean_text(voice_input)
    
    def _clean_text(self, text: str) -> str:
        """Clean voice input text"""
        fillers = ["um", "uh", "like", "you know", "so", "well"]
        words = text.lower().split()
        cleaned_words = [w for w in words if w not in fillers]
        return " ".join(cleaned_words)

class HTMLEditorTool(BaseTool):
    """LangChain tool for HTML editing"""
    name: str = "html_editor"
    description: str = "Edits HTML content based on parsed commands"
    
    def _run(self, html: str, changes: Dict[str, Any]) -> str:
        """Edit HTML synchronously"""
        return self._apply_changes(html, changes)
    
    async def _arun(self, html: str, changes: Dict[str, Any]) -> str:
        """Edit HTML asynchronously"""
        return self._apply_changes(html, changes)
    
    def _apply_changes(self, html: str, changes: Dict[str, Any]) -> str:
        """Apply changes to HTML"""
        try:
            soup = BeautifulSoup(html, 'html.parser')
            
            # Apply CSS updates
            css_updates = changes.get("css_updates", {})
            if css_updates:
                style_tag = soup.find('style') or soup.new_tag('style')
                if not soup.find('style'):
                    if soup.head:
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
        except Exception as e:
            print(f"Error applying changes: {e}")
            return html

class VoiceToTextAgent:
    """Agent 1: Processes voice input using proper LangChain patterns"""
    
    def __init__(self):
        self.settings = get_settings()
        
        # Initialize LangChain LLM
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.AI_MODEL,
            google_api_key=self.settings.GEMINI_API_KEY,
            temperature=0.1
        )
        
        # Initialize tools
        self.voice_tool = VoiceToTextTool()
        
        # Initialize output parser
        self.output_parser = PydanticOutputParser(pydantic_object=VoiceProcessingOutput)
        
        # Create prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a Voice-to-Text processing specialist. Your task is to:

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

{format_instructions}"""),
            ("human", "VOICE INPUT TO PROCESS: {voice_input}\n\nPlease clean and process this voice input:")
        ])

    async def process(self, state: AgentState) -> AgentState:
        """Process voice input into clean text using LangChain"""
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
            
            # Use LangChain prompt template and output parser
            prompt = self.prompt_template.format_messages(
                voice_input=voice_input,
                format_instructions=self.output_parser.get_format_instructions()
            )
            
            # Process with LLM
            response = await self.llm.ainvoke(prompt)
            
            try:
                # Parse structured output
                result = self.output_parser.parse(response.content)
                cleaned_text = result.cleaned_text
                confidence = result.confidence
            except:
                # Fallback: use tool for simple cleaning
                cleaned_text = await self.voice_tool._arun(voice_input)
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

class SemanticIntentRouterAgent:
    """Agent 2: Classifies commands using LangChain patterns"""
    
    def __init__(self):
        self.settings = get_settings()
        
        # Initialize LangChain LLM
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.AI_MODEL,
            google_api_key=self.settings.GEMINI_API_KEY,
            temperature=0.1
        )
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True
        )
        
        # Initialize output parser
        self.output_parser = PydanticOutputParser(pydantic_object=IntentClassificationOutput)
        
        # Create prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a Semantic Intent Classification specialist. Analyze user commands and classify them into:

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

{format_instructions}"""),
            ("human", "COMMAND TO CLASSIFY: {filtered_text}\n\nPrevious context: {chat_history}\n\nPlease classify this command:")
        ])

    async def process(self, state: AgentState) -> AgentState:
        """Classify intent using LangChain"""
        try:
            filtered_text = state.get("filtered_text", "")
            
            if not filtered_text.strip():
                return {
                    **state,
                    "intent_type": "unknown",
                    "intent_confidence": 0.0,
                    "parameters": {},
                    "ambiguous": True,
                    "clarification_needed": True,
                    "agent_errors": state.get("agent_errors", []) + ["Empty command text"]
                }
            
            # Get chat history from memory
            chat_history = self.memory.chat_memory.messages if self.memory.chat_memory else []
            
            # Use LangChain prompt template
            prompt = self.prompt_template.format_messages(
                filtered_text=filtered_text,
                chat_history=chat_history,
                format_instructions=self.output_parser.get_format_instructions()
            )
            
            # Process with LLM
            response = await self.llm.ainvoke(prompt)
            
            try:
                # Parse structured output
                result = self.output_parser.parse(response.content)
                
                # Save to memory
                self.memory.chat_memory.add_user_message(filtered_text)
                self.memory.chat_memory.add_ai_message(response.content)
                
                return {
                    **state,
                    "intent_type": result.intent,
                    "intent_confidence": result.confidence,
                    "parameters": result.parameters,
                    "ambiguous": result.ambiguous,
                    "clarification_needed": result.ambiguous,
                }
            except:
                # Fallback classification
                intent, confidence, params = self._simple_classify(filtered_text)
                return {
                    **state,
                    "intent_type": intent,
                    "intent_confidence": confidence,
                    "parameters": params,
                    "ambiguous": confidence < 0.7,
                    "clarification_needed": confidence < 0.5,
                }
            
        except Exception as e:
            return {
                **state,
                "intent_type": "unknown",
                "intent_confidence": 0.0,
                "parameters": {},
                "ambiguous": True,
                "clarification_needed": True,
                "agent_errors": state.get("agent_errors", []) + [f"Intent Router error: {str(e)}"]
            }
    
    def _simple_classify(self, text: str) -> tuple:
        """Simple fallback classification"""
        text_lower = text.lower()
        
        style_keywords = ["color", "font", "size", "bold", "italic", "background"]
        layout_keywords = ["center", "align", "position", "margin", "padding", "layout"]
        content_keywords = ["text", "title", "content", "add", "remove", "change"]
        
        if any(keyword in text_lower for keyword in style_keywords):
            return "style", 0.8, {"type": "style_change"}
        elif any(keyword in text_lower for keyword in layout_keywords):
            return "layout", 0.8, {"type": "layout_change"}
        elif any(keyword in text_lower for keyword in content_keywords):
            return "content", 0.8, {"type": "content_change"}
        else:
            return "unknown", 0.3, {}

class ContextualEditorAgent:
    """Agent 3: Edits HTML using LangChain tools"""
    
    def __init__(self):
        self.settings = get_settings()
        
        # Initialize LangChain LLM
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.AI_MODEL,
            google_api_key=self.settings.GEMINI_API_KEY,
            temperature=0.2
        )
        
        # Initialize tools
        self.html_tool = HTMLEditorTool()
        
        # Initialize output parser
        self.output_parser = PydanticOutputParser(pydantic_object=EditorAnalysisOutput)
        
        # Create prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a Contextual HTML Editor specialist. Your task is to:

1. Analyze existing HTML structure
2. Identify target elements for modification
3. Generate safe, specific changes based on user intent
4. Ensure changes don't break website functionality

ANALYSIS REQUIREMENTS:
- Identify specific HTML elements to modify
- Determine exact CSS/HTML changes needed
- Assess safety of proposed changes
- Provide clear warnings for risky operations

{format_instructions}"""),
            ("human", """HTML CONTENT:
{html_content}

INTENT: {intent_type}
CONFIDENCE: {intent_confidence}
PARAMETERS: {parameters}

Please analyze and propose specific changes:""")
        ])

    async def process(self, state: AgentState) -> AgentState:
        """Analyze HTML and propose changes using LangChain"""
        try:
            html_content = state.get("html_content", "")
            intent_type = state.get("intent_type", "")
            intent_confidence = state.get("intent_confidence", 0.0)
            parameters = state.get("parameters", {})
            
            if not html_content or not intent_type:
                return {
                    **state,
                    "target_elements": [],
                    "proposed_changes": {},
                    "edit_safe": False,
                    "agent_errors": state.get("agent_errors", []) + ["Missing HTML content or intent"]
                }
            
            # Use LangChain prompt template
            prompt = self.prompt_template.format_messages(
                html_content=html_content[:2000],  # Limit for context
                intent_type=intent_type,
                intent_confidence=intent_confidence,
                parameters=parameters,
                format_instructions=self.output_parser.get_format_instructions()
            )
            
            # Process with LLM
            response = await self.llm.ainvoke(prompt)
            
            try:
                # Parse structured output
                result = self.output_parser.parse(response.content)
                
                return {
                    **state,
                    "target_elements": result.target_elements,
                    "proposed_changes": result.proposed_changes,
                    "edit_safe": result.edit_safe,
                    "warnings": result.warnings
                }
            except:
                # Fallback analysis
                target_elements, changes, safe = self._simple_analysis(html_content, intent_type, parameters)
                return {
                    **state,
                    "target_elements": target_elements,
                    "proposed_changes": changes,
                    "edit_safe": safe,
                    "warnings": ["Fallback analysis used"]
                }
            
        except Exception as e:
            return {
                **state,
                "target_elements": [],
                "proposed_changes": {},
                "edit_safe": False,
                "agent_errors": state.get("agent_errors", []) + [f"Editor Agent error: {str(e)}"]
            }
    
    def _simple_analysis(self, html: str, intent: str, params: dict) -> tuple:
        """Simple fallback analysis"""
        if intent == "style":
            return ["body"], {"css_updates": {"color": "blue"}}, True
        elif intent == "content":
            return ["h1"], {"content_updates": {"text": "Updated Title"}}, True
        else:
            return [], {}, False

class RAGEnabledResponseAgent:
    """Agent 4: Uses RAG with LangChain memory"""
    
    def __init__(self):
        self.settings = get_settings()
        
        # Initialize LangChain LLM
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.AI_MODEL,
            google_api_key=self.settings.GEMINI_API_KEY,
            temperature=0.3
        )
        
        # Initialize memory
        self.memory = ConversationBufferMemory(
            memory_key="chat_history",
            return_messages=True,
            max_token_limit=2000
        )
        
        # Initialize ChromaDB
        self.chroma_client = self._get_chroma_client()
        
        # Create prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a RAG-Enhanced Response specialist. Your task is to:

1. Use retrieved context to enhance responses
2. Provide helpful suggestions and examples
3. Generate contextual responses based on changes made
4. Maintain conversation continuity

Use the retrieved context and conversation history to provide a comprehensive response."""),
            ("human", """COMMAND: {command}
CHANGES MADE: {changes}
RETRIEVED CONTEXT: {context}
CHAT HISTORY: {chat_history}

Generate an enhanced response explaining what was done and any suggestions:""")
        ])

    def _get_chroma_client(self):
        """Initialize ChromaDB client"""
        try:
            import chromadb
            from chromadb.config import Settings
            
            settings = Settings(
                persist_directory="./chroma_db",
                anonymized_telemetry=False
            )
            
            client = chromadb.PersistentClient(settings=settings)
            
            # Get or create collection
            try:
                collection = client.get_collection("website_knowledge")
            except:
                collection = client.create_collection(
                    name="website_knowledge",
                    metadata={"description": "Website design knowledge base"}
                )
                
                # Add some initial knowledge
                initial_docs = [
                    "When changing colors, ensure good contrast for accessibility",
                    "Use responsive design principles for mobile compatibility",
                    "Center elements using CSS flexbox or grid for better control",
                    "Always test changes across different browsers"
                ]
                
                collection.add(
                    documents=initial_docs,
                    ids=[f"doc_{i}" for i in range(len(initial_docs))]
                )
            
            return collection
            
        except Exception as e:
            print(f"ChromaDB initialization error: {e}")
            return None

    async def process(self, state: AgentState) -> AgentState:
        """Generate enhanced response using RAG"""
        try:
            command = state.get("filtered_text", "")
            changes = state.get("proposed_changes", {})
            session_id = state.get("session_id", "")
            
            # Retrieve relevant context
            context = await self._retrieve_context(command, session_id)
            
            # Get chat history
            chat_history = self.memory.chat_memory.messages if self.memory.chat_memory else []
            
            # Generate enhanced response using LangChain
            prompt = self.prompt_template.format_messages(
                command=command,
                changes=changes,
                context=context,
                chat_history=chat_history
            )
            
            response = await self.llm.ainvoke(prompt)
            response_text = response.content
            
            # Store interaction in memory
            await self._store_interaction(session_id, command, response_text)
            
            return {
                **state,
                "context_retrieved": context,
                "response_generated": response_text,
                "multilingual_support": True
            }
            
        except Exception as e:
            return {
                **state,
                "context_retrieved": "",
                "response_generated": f"Changes applied successfully. {str(e)}",
                "multilingual_support": False,
                "agent_errors": state.get("agent_errors", []) + [f"RAG Agent error: {str(e)}"]
            }

    async def _retrieve_context(self, query: str, session_id: str) -> str:
        """Retrieve relevant context from knowledge base"""
        try:
            if self.chroma_client:
                results = self.chroma_client.query(
                    query_texts=[query],
                    n_results=3
                )
                
                if results['documents'] and results['documents'][0]:
                    return " ".join(results['documents'][0])
            
            return "No specific context retrieved."
        except:
            return "Context retrieval failed."

    async def _store_interaction(self, session_id: str, command: str, response: str):
        """Store interaction in memory"""
        try:
            self.memory.chat_memory.add_user_message(command)
            self.memory.chat_memory.add_ai_message(response)
        except Exception as e:
            print(f"Memory storage error: {e}")

class ValidationAgent:
    """Agent 5: Validates changes using LangChain"""
    
    def __init__(self):
        self.settings = get_settings()
        
        # Initialize LangChain LLM
        self.llm = ChatGoogleGenerativeAI(
            model=self.settings.AI_MODEL,
            google_api_key=self.settings.GEMINI_API_KEY,
            temperature=0.1
        )
        
        # Initialize tools
        self.html_tool = HTMLEditorTool()
        
        # Initialize output parser
        self.output_parser = PydanticOutputParser(pydantic_object=ValidationOutput)
        
        # Create prompt template
        self.prompt_template = ChatPromptTemplate.from_messages([
            ("system", """You are a Validation specialist. Your task is to:

1. Validate HTML changes for correctness and safety
2. Check browser compatibility
3. Assess visual design quality
4. Provide overall quality scores
5. Generate appropriate warnings

VALIDATION CRITERIA:
- HTML syntax and structure
- CSS compatibility across browsers
- Accessibility standards
- Visual design principles
- Performance considerations

{format_instructions}"""),
            ("human", """HTML TO VALIDATE:
{html_content}

PROPOSED CHANGES:
{proposed_changes}

Please validate these changes and provide scores:""")
        ])

    async def process(self, state: AgentState) -> AgentState:
        """Validate changes using LangChain"""
        try:
            html_content = state.get("html_content", "")
            proposed_changes = state.get("proposed_changes", {})
            
            # Apply changes using tool
            modified_html = await self.html_tool._arun(html_content, proposed_changes)
            
            # Validate using LLM
            prompt = self.prompt_template.format_messages(
                html_content=modified_html[:1500],
                proposed_changes=proposed_changes,
                format_instructions=self.output_parser.get_format_instructions()
            )
            
            response = await self.llm.ainvoke(prompt)
            
            try:
                # Parse structured output
                result = self.output_parser.parse(response.content)
                
                return {
                    **state,
                    "validation_score": result.overall_score,
                    "compatibility_check": result.compatibility_score > 0.7,
                    "aesthetic_score": result.aesthetic_score,
                    "warnings": result.warnings,
                    "final_html": modified_html if result.approved else html_content
                }
            except:
                # Fallback validation
                return {
                    **state,
                    "validation_score": 0.7,
                    "compatibility_check": True,
                    "aesthetic_score": 0.7,
                    "warnings": ["Basic validation applied"],
                    "final_html": modified_html
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

class LangGraphWebsiteEditor:
    """Main LangGraph workflow orchestrating all agents with proper LangChain integration"""
    
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
        graph.add_edge("voice_to_text", "intent_router")
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
            "processing_time": 0.0,
            "memory": {}
        }
        
        try:
            # Run the complete workflow
            final_state = await self.graph.ainvoke(initial_state)
            
            return {
                "success": True,
                "html_content": final_state.get("final_html", html_content),
                "response": final_state.get("response_generated", "Changes applied successfully"),
                "validation_score": final_state.get("validation_score", 0.7),
                "warnings": final_state.get("warnings", []),
                "agent_errors": final_state.get("agent_errors", []),
                "processing_time": final_state.get("processing_time", 0.0),
                "metadata": {
                    "intent": final_state.get("intent_type", "unknown"),
                    "confidence": final_state.get("intent_confidence", 0.0),
                    "compatibility": final_state.get("compatibility_check", False),
                    "aesthetic_score": final_state.get("aesthetic_score", 0.0),
                    "target_elements": final_state.get("target_elements", []),
                    "context_retrieved": final_state.get("context_retrieved", "")
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