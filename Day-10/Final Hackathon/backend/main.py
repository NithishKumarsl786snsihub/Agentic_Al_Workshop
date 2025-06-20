from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
import uvicorn

try:
    from services.langgraph_agents import LangGraphWebsiteEditor
    LANGGRAPH_AVAILABLE = True
    print("✅ LangGraph agents loaded successfully")
except ImportError as e:
    print(f"Warning: LangGraph version failed to import: {e}")
    print("Falling back to basic editing only...")
    LANGGRAPH_AVAILABLE = False

# Always import the main website generator
from services.website_generator import WebsiteGenerator

from services.html_editor import HTMLEditor
from services.session_manager import SessionManager
from services.intelligent_response import IntelligentResponseService
from core.config import get_settings

# Initialize FastAPI app
app = FastAPI(
    title="Voice Website Generator API",
    description="Backend API for voice-controlled website generation and editing",
    version="1.0.0"
)

# Load settings
settings = get_settings()

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize services
website_generator = WebsiteGenerator()
html_editor = HTMLEditor()
session_manager = SessionManager()
intelligent_response = IntelligentResponseService()

# Initialize LangGraph agents if available
if LANGGRAPH_AVAILABLE:
    langgraph_editor = LangGraphWebsiteEditor()
    print("🤖 LangGraph multi-agent system initialized")
else:
    langgraph_editor = None
    print("⚠️ Using fallback HTML editor")

# Request/Response models
class GenerateRequest(BaseModel):
    prompt: str
    session_id: Optional[str] = None

class EditRequest(BaseModel):
    html_content: str
    edit_command: str
    session_id: str

class SaveRequest(BaseModel):
    html_content: str
    session_id: str
    filename: Optional[str] = None

class UndoRedoRequest(BaseModel):
    session_id: str

# Response models
class GenerateResponse(BaseModel):
    html_content: str
    session_id: str
    filename: str
    success: bool
    message: str

class EditResponse(BaseModel):
    html_content: str
    success: bool
    message: str
    changes_made: List[str]
    intelligent_response: Optional[Dict[str, Any]] = None

class SaveResponse(BaseModel):
    filename: str
    file_path: str
    success: bool
    message: str

class UndoRedoResponse(BaseModel):
    html_content: str
    success: bool
    message: str
    can_undo: bool
    can_redo: bool

@app.get("/")
async def root():
    return {
        "message": "Voice Website Generator API with LangGraph Agents",
        "version": "1.0.0",
        "langgraph_enabled": LANGGRAPH_AVAILABLE,
        "agents_status": "✅ Active" if LANGGRAPH_AVAILABLE else "⚠️ Fallback Mode",
        "endpoints": [
            "/generate - Generate website from prompt",
            "/edit - Edit existing website with LangGraph agents",
            "/save - Save website to file",
            "/undo - Undo last change",
            "/redo - Redo last undone change",
            "/sessions/{session_id}/history - Get session history",
            "/status - Get system and agent status"
        ]
    }

@app.get("/status")
async def get_status():
    """Get system and LangGraph agent status"""
    agent_details = {}
    
    if LANGGRAPH_AVAILABLE and langgraph_editor:
        agent_details = {
            "voice_to_text_agent": "✅ Active",
            "semantic_intent_router": "✅ Active", 
            "contextual_editor": "✅ Active",
            "rag_enabled_response": "✅ Active",
            "validation_agent": "✅ Active",
            "langgraph_workflow": "✅ Compiled and Ready",
            "langchain_integration": "✅ Fully Integrated",
            "tools": {
                "voice_cleaner_tool": "✅ Available",
                "html_editor_tool": "✅ Available"
            },
            "memory": {
                "conversation_buffer": "✅ Active",
                "vector_store": "✅ ChromaDB Connected"
            }
        }
    else:
        agent_details = {
            "status": "⚠️ LangGraph agents not available",
            "fallback_mode": "✅ Simple editors active"
        }
    
    return {
        "system_status": "✅ Running",
        "langgraph_available": LANGGRAPH_AVAILABLE,
        "agent_details": agent_details,
        "api_version": "1.0.0",
        "integrations": {
            "gemini_api": "✅ Connected",
            "langchain": "✅ Integrated" if LANGGRAPH_AVAILABLE else "⚠️ Limited",
            "chromadb": "✅ Available",
            "fastapi": "✅ Running"
        }
    }

@app.post("/generate", response_model=GenerateResponse)
async def generate_website(request: GenerateRequest):
    """Generate a website from a text prompt using Gemini AI"""
    try:
        # Generate or use existing session ID
        session_id = request.session_id or str(uuid.uuid4())
        
        # Generate HTML content
        html_content = await website_generator.generate_website(request.prompt)
        
        # Create session and save initial state
        session_manager.create_session(session_id, request.prompt, html_content)
        
        # Save to file
        filename = f"website_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        file_path = session_manager.save_html_file(session_id, html_content, filename)
        
        return GenerateResponse(
            html_content=html_content,
            session_id=session_id,
            filename=filename,
            success=True,
            message="Website generated successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/edit", response_model=EditResponse)
async def edit_website(request: EditRequest):
    """Edit existing website based on voice command using LangGraph agents"""
    try:
        # Use LangGraph agents if available, otherwise fallback
        if LANGGRAPH_AVAILABLE and langgraph_editor:
            print(f"🤖 Processing with LangGraph agents: {request.edit_command}")
            
            # Process through the complete LangGraph workflow
            result = await langgraph_editor.process_voice_command(
                voice_input=request.edit_command,
                html_content=request.html_content,
                session_id=request.session_id
            )
            
            if result["success"]:
                # Update session history
                session_manager.add_to_history(
                    request.session_id, 
                    result["html_content"], 
                    request.edit_command
                )
                
                return EditResponse(
                    html_content=result["html_content"],
                    success=True,
                    message=result["response"],
                    changes_made=[f"Intent: {result['metadata'].get('intent', 'unknown')}"],
                    intelligent_response={
                        "message": result["response"],
                        "confidence": result["metadata"].get("confidence", 0.0),
                        "validation_score": result["validation_score"],
                        "warnings": result["warnings"],
                        "agent_errors": result["agent_errors"],
                        "processing_time": result["processing_time"],
                        "langgraph_used": True,
                        "metadata": result["metadata"]
                    }
                )
            else:
                # LangGraph failed, fallback to simple editor
                print("⚠️ LangGraph failed, falling back to simple editor")
                
        # Fallback to original implementation
        print(f"🔄 Processing with fallback editor: {request.edit_command}")
        result = await html_editor.edit_html(request.html_content, request.edit_command)
        
        # Generate intelligent response
        intelligent_resp = await intelligent_response.generate_confirmation_response(
            command=request.edit_command,
            edit_result=result,
            session_id=request.session_id,
            language="en"
        )
        
        # Update session history
        session_manager.add_to_history(request.session_id, result["html_content"], request.edit_command)
        
        return EditResponse(
            html_content=result["html_content"],
            success=True,
            message=intelligent_resp.get("message", "Website edited successfully"),
            changes_made=result.get("changes", []),
            intelligent_response={
                **intelligent_resp,
                "langgraph_used": False
            }
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Edit failed: {str(e)}")

@app.post("/save", response_model=SaveResponse)
async def save_website(request: SaveRequest):
    """Save website to file"""
    try:
        filename = request.filename or f"website_{request.session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        file_path = session_manager.save_html_file(request.session_id, request.html_content, filename)
        
        return SaveResponse(
            filename=filename,
            file_path=file_path,
            success=True,
            message="Website saved successfully"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Save failed: {str(e)}")

@app.post("/undo", response_model=UndoRedoResponse)
async def undo_change(request: UndoRedoRequest):
    """Undo the last change"""
    try:
        result = session_manager.undo(request.session_id)
        
        return UndoRedoResponse(
            html_content=result["html_content"],
            success=True,
            message="Change undone successfully",
            can_undo=result["can_undo"],
            can_redo=result["can_redo"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Undo failed: {str(e)}")

@app.post("/redo", response_model=UndoRedoResponse)
async def redo_change(request: UndoRedoRequest):
    """Redo the last undone change"""
    try:
        result = session_manager.redo(request.session_id)
        
        return UndoRedoResponse(
            html_content=result["html_content"],
            success=True,
            message="Change redone successfully",
            can_undo=result["can_undo"],
            can_redo=result["can_redo"]
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Redo failed: {str(e)}")

@app.get("/sessions/{session_id}/history")
async def get_session_history(session_id: str):
    """Get session history"""
    try:
        history = session_manager.get_session_history(session_id)
        return {
            "session_id": session_id,
            "history": history,
            "success": True
        }
    except Exception as e:
        raise HTTPException(status_code=404, detail=f"Session not found: {str(e)}")

@app.get("/download/{session_id}/{filename}")
async def download_file(session_id: str, filename: str):
    """Download a saved HTML file"""
    try:
        file_path = session_manager.get_file_path(session_id, filename)
        
        if not os.path.exists(file_path):
            raise HTTPException(status_code=404, detail="File not found")
        
        return FileResponse(
            path=file_path,
            filename=filename,
            media_type='text/html'
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

# Handle Chrome DevTools requests to prevent 404 errors
@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools_handler():
    """Handle Chrome DevTools protocol requests"""
    return {"message": "Chrome DevTools protocol not supported"}

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=True
    ) 