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
    from services.website_generator import WebsiteGenerator
except ImportError as e:
    print(f"Warning: LangGraph version failed to import: {e}")
    print("Falling back to simple website generator...")
    from services.website_generator_simple import WebsiteGenerator
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
        "message": "Voice Website Generator API",
        "version": "1.0.0",
        "endpoints": [
            "/generate - Generate website from prompt",
            "/edit - Edit existing website",
            "/save - Save website to file",
            "/undo - Undo last change",
            "/redo - Redo last undone change",
            "/sessions/{session_id}/history - Get session history"
        ]
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
    """Edit existing website based on voice command"""
    try:
        # Process the edit command
        result = await html_editor.edit_html(request.html_content, request.edit_command)
        
        # Generate intelligent response
        intelligent_resp = await intelligent_response.generate_confirmation_response(
            command=request.edit_command,
            edit_result=result,
            session_id=request.session_id,
            language="en"  # Could be made configurable
        )
        
        # Update session history
        session_manager.add_to_history(request.session_id, result["html_content"], request.edit_command)
        
        return EditResponse(
            html_content=result["html_content"],
            success=True,
            message=intelligent_resp.get("message", "Website edited successfully"),
            changes_made=result.get("changes", []),
            intelligent_response=intelligent_resp
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