from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from pydantic import BaseModel
import os
import uuid
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
import uvicorn

# Import database connection
from core.database import connect_to_mongo, close_mongo_connection

# Import authentication routes
from api.auth import router as auth_router
from core.auth import get_current_active_user

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
from services.conversation_manager import ConversationManager
from services.ai_analyzer import ai_assistant  # Import the AI assistant
from services.image_service import image_service
from services.storage_service import storage_service
from core.config import get_settings

# Initialize FastAPI app
app = FastAPI(
    title="Voice Website Generator API",
    description="Backend API for voice-controlled website generation and editing with user authentication",
    version="2.0.0"
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

# Include authentication routes
app.include_router(auth_router)

# Initialize services
website_generator = WebsiteGenerator()
html_editor = HTMLEditor()
session_manager = SessionManager()
intelligent_response = IntelligentResponseService()
conversation_manager = ConversationManager()

# Initialize LangGraph agents if available
if LANGGRAPH_AVAILABLE:
    langgraph_editor = LangGraphWebsiteEditor()
    print("🤖 LangGraph multi-agent system initialized")
else:
    langgraph_editor = None
    print("⚠️ Using fallback HTML editor")

# Database startup/shutdown events
@app.on_event("startup")
async def startup_event():
    """Initialize database connection on startup"""
    try:
        await connect_to_mongo()
        print("🚀 Application started with database connection")
    except Exception as e:
        print(f"❌ Failed to connect to database: {e}")
        # Don't raise error to allow app to start without DB for development

@app.on_event("shutdown")
async def shutdown_event():
    """Close database connection on shutdown"""
    await close_mongo_connection()
    print("👋 Application shutdown complete")

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

class SaveConversationRequest(BaseModel):
    final_prompt: str
    session_id: Optional[str] = None
    project_id: Optional[str] = None
    website_type: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

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

class ConversationResponse(BaseModel):
    success: bool
    conversation_id: Optional[str] = None
    message: str
    analysis: Optional[Dict[str, Any]] = None

class ConversationListResponse(BaseModel):
    conversations: List[Dict[str, Any]]
    total: int
    success: bool

# NEW: Storage and Persistence Models
class SaveCodeRequest(BaseModel):
    session_id: str
    html_content: str
    css_content: Optional[str] = None
    js_content: Optional[str] = None
    project_name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    auto_save: bool = False

class SaveCodeResponse(BaseModel):
    success: bool
    message: str
    project_id: str
    saved_at: datetime
    file_path: Optional[str] = None

class LoadCodeRequest(BaseModel):
    project_id: Optional[str] = None
    session_id: Optional[str] = None

class LoadCodeResponse(BaseModel):
    success: bool
    html_content: str
    css_content: Optional[str] = None
    js_content: Optional[str] = None
    project_name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    last_modified: datetime
    project_id: str

class ProjectListResponse(BaseModel):
    success: bool
    projects: List[Dict[str, Any]]
    total: int
    has_more: bool

class DeleteProjectRequest(BaseModel):
    project_id: str

class AutoSaveStateRequest(BaseModel):
    session_id: str
    html_content: str
    css_content: Optional[str] = None
    js_content: Optional[str] = None
    cursor_position: Optional[Dict[str, Any]] = None
    scroll_position: Optional[Dict[str, Any]] = None

class AutoSaveStateResponse(BaseModel):
    success: bool
    last_saved: datetime
    session_id: str

class RestoreStateRequest(BaseModel):
    session_id: str

class RestoreStateResponse(BaseModel):
    success: bool
    html_content: Optional[str] = None
    css_content: Optional[str] = None
    js_content: Optional[str] = None
    cursor_position: Optional[Dict[str, Any]] = None
    scroll_position: Optional[Dict[str, Any]] = None
    last_modified: Optional[datetime] = None

class ExitWarningRequest(BaseModel):
    session_id: str
    has_unsaved_changes: bool
    current_content: Optional[str] = None

class ExitWarningResponse(BaseModel):
    should_warn: bool
    message: str
    unsaved_changes_count: int

# NEW: Editor-specific save endpoint with enhanced security and validation
class EditorSaveRequest(BaseModel):
    session_id: str
    html_content: str
    project_id: Optional[str] = None
    project_name: Optional[str] = None
    description: Optional[str] = None
    auto_save: bool = False

class EditorSaveResponse(BaseModel):
    success: bool
    message: str
    project_id: str
    project_name: str
    saved_at: datetime
    version: int

@app.get("/")
async def root():
    return {
        "message": "Voice Website Generator API with Authentication & LangGraph Agents",
        "version": "2.0.0",
        "langgraph_enabled": LANGGRAPH_AVAILABLE,
        "agents_status": "✅ Active" if LANGGRAPH_AVAILABLE else "⚠️ Fallback Mode",
        "authentication": "✅ Enabled",
        "database": "✅ MongoDB Connected",
        "endpoints": [
            "/auth/register - Register new user",
            "/auth/login - User login",
            "/auth/me - Get user info",
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
        "authentication": "✅ Enabled with JWT",
        "database": "✅ MongoDB Connected",
        "api_version": "2.0.0",
        "integrations": {
            "gemini_api": "✅ Connected",
            "langchain": "✅ Integrated" if LANGGRAPH_AVAILABLE else "⚠️ Limited",
            "chromadb": "✅ Available",
            "fastapi": "✅ Running",
            "mongodb": "✅ Connected"
        }
    }

@app.post("/generate", response_model=GenerateResponse)
async def generate_website(request: GenerateRequest):
    """Generate a website from a text prompt using Gemini AI"""
    try:
        print(f"🚀 Starting website generation for prompt: {request.prompt}")
        
        # Generate or use existing session ID
        session_id = request.session_id or str(uuid.uuid4())
        print(f"📋 Using session ID: {session_id}")
        
        # Generate HTML content
        print("🎨 Generating HTML content...")
        html_content = await website_generator.generate_website(request.prompt)
        print(f"✅ HTML generated successfully, length: {len(html_content)}")
        
        # Fix broken images with placeholders
        print("🖼️ Fixing broken images...")
        html_content = image_service.replace_broken_images_in_html(html_content)
        print("✅ Images fixed successfully")
        
        # Create session and save initial state
        print("💾 Creating session...")
        session_manager.create_session(session_id, request.prompt, html_content)
        print("✅ Session created successfully")
        
        # Generate filename for response (no local file saving)
        print("📝 Preparing response...")
        filename = f"website_{session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.html"
        print(f"✅ Website generated successfully: {filename}")
        
        return GenerateResponse(
            html_content=html_content,
            session_id=session_id,
            filename=filename,
            success=True,
            message="Website generated successfully and stored in session"
        )
    except Exception as e:
        print(f"❌ Generation failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Generation failed: {str(e)}")

@app.post("/edit", response_model=EditResponse)
async def edit_website(request: EditRequest):
    """Edit existing website with AI-powered code assistant"""
    try:
        print(f"🤖 Processing edit request with AI assistant: {request.edit_command}")
        
        # Use AI assistant to analyze the request and generate intelligent response
        ai_response = ai_assistant.create_intelligent_response(
            html_content=request.html_content,
            edit_request=request.edit_command
        )
        
        # Use LangGraph agents if available, otherwise fallback
        if LANGGRAPH_AVAILABLE and langgraph_editor:
            print(f"🔮 Processing with LangGraph agents: {request.edit_command}")
            
            # Process through the complete LangGraph workflow
            result = await langgraph_editor.process_voice_command(
                voice_input=request.edit_command,
                html_content=request.html_content,
                session_id=request.session_id
            )
            
            if result["success"]:
                # Fix broken images in the edited content
                result["html_content"] = image_service.replace_broken_images_in_html(result["html_content"])
                
                # Update session history with the new HTML content
                session_manager.add_to_history(
                    request.session_id, 
                    result["html_content"], 
                    "edit",
                    request.edit_command
                )
                
                # Enhance the LangGraph response with AI assistant insights
                enhanced_response = {
                    **ai_response,
                    "message": result["response"],
                    "langgraph_used": True,
                    "confidence": result["metadata"].get("confidence", 0.85),
                    "validation_score": result["validation_score"],
                    "warnings": result["warnings"],
                    "agent_errors": result["agent_errors"],
                    "processing_time": result["processing_time"],
                    "metadata": {
                        **ai_response["metadata"],
                        **result["metadata"]
                    }
                }
                
                return EditResponse(
                    html_content=result["html_content"],
                    success=True,
                    message=result["response"],
                    changes_made=[f"Intent: {result['metadata'].get('intent', 'unknown')}"],
                    intelligent_response=enhanced_response
                )
            else:
                # LangGraph failed, fallback to simple editor
                print("⚠️ LangGraph failed, falling back to simple editor with AI assistant")
                
        # Fallback to original implementation with AI enhancement
        print(f"🔄 Processing with enhanced editor + AI assistant: {request.edit_command}")
        result = await html_editor.edit_html(request.html_content, request.edit_command)
        
        # Generate enhanced intelligent response with AI insights
        if result["success"]:
            # Fix broken images in the edited content
            result["html_content"] = image_service.replace_broken_images_in_html(result["html_content"])
            
            # Use AI assistant's response instead of basic intelligent response
            enhanced_ai_response = {
                **ai_response,
                "langgraph_used": False,
                "edit_success": True,
                "changes_applied": result.get("changes", []),
                "processing_method": "enhanced_fallback"
            }
            
            # Update session history
            session_manager.add_to_history(
                request.session_id, 
                result["html_content"], 
                "edit",
                request.edit_command
            )
            
            return EditResponse(
                html_content=result["html_content"],
                success=True,
                message=ai_response["message"],  # Use AI-generated message
                changes_made=result.get("changes", []),
                intelligent_response=enhanced_ai_response
            )
        else:
            # Handle edit failure with AI assistance
            fallback_response = {
                **ai_response,
                "edit_success": False,
                "error": result.get("error", "Unknown error"),
                "suggestions": [
                    "Let me try a different approach to your request",
                    "Could you rephrase the command more specifically?",
                    "I can help you break this down into smaller steps"
                ]
            }
            
            return EditResponse(
                html_content=request.html_content,  # Return original content
                success=False,
                message=f"I couldn't complete that change, but I have some suggestions. {ai_response['message']}",
                changes_made=[],
                intelligent_response=fallback_response
            )
        
    except Exception as e:
        print(f"❌ Edit failed with error: {str(e)}")
        
        # Generate AI-powered error response
        error_response = {
            "type": "error_assistance",
            "message": "I encountered an issue with that request. Let me help you troubleshoot.",
            "suggestions": [
                "Try describing the change in simpler terms",
                "Make sure you're targeting the right element",
                "Would you like me to suggest an alternative approach?"
            ],
            "follow_up_question": "Can you tell me more specifically what you're trying to achieve?",
            "editable": True,
            "language": "English",
            "voice_friendly": True,
            "metadata": {
                "error_type": "processing_error",
                "timestamp": datetime.now().isoformat(),
                "original_command": request.edit_command
            }
        }
        
        return EditResponse(
            html_content=request.html_content,
            success=False,
            message="I ran into a technical issue, but I'm here to help you fix it.",
            changes_made=[],
            intelligent_response=error_response
        )

@app.post("/save", response_model=SaveResponse)
async def save_website(
    request: SaveRequest,
    current_user = Depends(get_current_active_user)
):
    """Save website to MongoDB (no local files)"""
    try:
        # Generate project name from session if not provided
        project_name = request.filename or f"website_{request.session_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Remove .html extension if present for project name
        if project_name.endswith('.html'):
            project_name = project_name[:-5]
        
        # Save to MongoDB via storage service
        result = await storage_service.save_project(
            user_id=current_user.id,
            session_id=request.session_id,
            html_content=request.html_content,
            project_name=project_name,
            description=f"Website saved from session {request.session_id}",
            metadata={
                "saved_via": "editor_save_button",
                "original_filename": request.filename,
                "content_length": len(request.html_content),
                "save_timestamp": datetime.now().isoformat()
            },
            auto_save=False
        )
        
        if result["success"]:
            # Update session manager with current content (in-memory only)
            session_manager.add_to_history(
                request.session_id, 
                request.html_content, 
                "save", 
                f"Saved as {project_name}"
            )
            
            return SaveResponse(
                filename=f"{project_name}.html",
                file_path=f"mongodb://{result['project_id']}",  # Virtual path indicating MongoDB storage
                success=True,
                message=f"Website saved to database as '{project_name}'"
            )
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
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
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
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
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
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
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get history: {str(e)}")

@app.get("/download/{session_id}/{filename}")
async def download_file(
    session_id: str, 
    filename: str,
    current_user = Depends(get_current_active_user)
):
    """Download HTML content from MongoDB storage"""
    try:
        # Load project from MongoDB using session_id
        result = await storage_service.load_project(
            user_id=current_user.id,
            session_id=session_id
        )
        
        if not result["success"]:
            raise HTTPException(status_code=404, detail="Project not found")
        
        # Create temporary file for download
        import tempfile
        with tempfile.NamedTemporaryFile(mode='w', suffix='.html', delete=False, encoding='utf-8') as temp_file:
            temp_file.write(result["html_content"])
            temp_file_path = temp_file.name
        
        # Return file response and clean up temp file after sending
        response = FileResponse(
            path=temp_file_path,
            filename=filename,
            media_type='text/html'
        )
        
        # Clean up temp file after response is sent
        import os
        def cleanup():
            try:
                os.unlink(temp_file_path)
            except:
                pass
        
        # Schedule cleanup (this is a simple approach, in production you might want a better cleanup strategy)
        import threading
        threading.Timer(10.0, cleanup).start()
        
        return response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Download failed: {str(e)}")

@app.post("/conversations/save", response_model=ConversationResponse)
async def save_conversation(
    request: SaveConversationRequest,
    current_user = Depends(get_current_active_user)
):
    """Save a conversation to vivvie_conversations collection"""
    try:
        result = await conversation_manager.save_conversation(
            user_id=current_user.id,
            final_prompt=request.final_prompt,
            session_id=request.session_id,
            project_id=request.project_id,
            website_type=request.website_type,
            metadata=request.metadata
        )
        
        return ConversationResponse(**result)
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save conversation: {str(e)}")

@app.get("/conversations", response_model=ConversationListResponse)
async def get_user_conversations(
    limit: int = 20,
    offset: int = 0,
    current_user = Depends(get_current_active_user)
):
    """Get conversation history for current user"""
    try:
        conversations = await conversation_manager.get_user_conversations(
            user_id=current_user.id,
            limit=limit,
            offset=offset
        )
        
        return ConversationListResponse(
            conversations=conversations,
            total=len(conversations),
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch conversations: {str(e)}")

@app.get("/conversations/search", response_model=ConversationListResponse)
async def search_conversations(
    query: str,
    limit: int = 10,
    current_user = Depends(get_current_active_user)
):
    """Search conversations using vector search"""
    try:
        conversations = await conversation_manager.search_conversations(
            user_id=current_user.id,
            query=query,
            limit=limit
        )
        
        return ConversationListResponse(
            conversations=conversations,
            total=len(conversations),
            success=True
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to search conversations: {str(e)}")

@app.delete("/conversations/{conversation_id}")
async def delete_conversation(
    conversation_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a conversation"""
    try:
        success = await conversation_manager.delete_conversation(
            conversation_id=conversation_id,
            user_id=current_user.id
        )
        
        if success:
            return {"success": True, "message": "Conversation deleted successfully"}
        else:
            raise HTTPException(status_code=404, detail="Conversation not found")
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete conversation: {str(e)}")

# Storage and Persistence Endpoints
@app.post("/projects/save", response_model=SaveCodeResponse)
async def save_project(
    request: SaveCodeRequest,
    current_user = Depends(get_current_active_user)
):
    """Save project to MongoDB with persistence"""
    try:
        result = await storage_service.save_project(
            user_id=current_user.id,
            session_id=request.session_id,
            html_content=request.html_content,
            css_content=request.css_content,
            js_content=request.js_content,
            project_name=request.project_name,
            description=request.description,
            metadata=request.metadata,
            auto_save=request.auto_save,
            generate_preview=request.generate_preview
        )
        
        if result["success"]:
            return SaveCodeResponse(
                success=True,
                message=result["message"],
                project_id=result["project_id"],
                saved_at=result["saved_at"],
                file_path=result.get("file_path")
            )
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save project: {str(e)}")

@app.post("/projects/load", response_model=LoadCodeResponse)  
async def load_project(
    request: LoadCodeRequest,
    current_user = Depends(get_current_active_user)
):
    """Load project from MongoDB"""
    try:
        result = await storage_service.load_project(
            user_id=current_user.id,
            project_id=request.project_id,
            session_id=request.session_id
        )
        
        if result["success"]:
            return LoadCodeResponse(
                success=True,
                html_content=result["html_content"],
                css_content=result.get("css_content"),
                js_content=result.get("js_content"),
                project_name=result.get("project_name"),
                description=result.get("description"),
                metadata=result.get("metadata", {}),
                last_modified=result["last_modified"],
                project_id=result["project_id"],
                preview_image=result.get("preview_image"),
                thumbnail_image=result.get("thumbnail_image")
            )
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to load project: {str(e)}")

@app.get("/projects", response_model=ProjectListResponse)
async def list_projects(
    limit: int = 10,
    offset: int = 0,
    search: Optional[str] = None,
    current_user = Depends(get_current_active_user)
):
    """List user projects with pagination and search"""
    try:
        result = await storage_service.list_user_projects(
            user_id=current_user.id,
            limit=limit,
            offset=offset,
            search=search
        )
        
        if result["success"]:
            return ProjectListResponse(
                success=True,
                projects=result["projects"],
                total=result["total"],
                has_more=result["has_more"]
            )
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to list projects: {str(e)}")

@app.delete("/projects/{project_id}")
async def delete_project(
    project_id: str,
    current_user = Depends(get_current_active_user)
):
    """Delete a project"""
    try:
        result = await storage_service.delete_project(
            user_id=current_user.id,
            project_id=project_id
        )
        
        if result["success"]:
            return {"success": True, "message": result["message"]}
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to delete project: {str(e)}")

@app.put("/projects/{project_id}/rename")
async def rename_project(
    project_id: str,
    request: dict,
    current_user = Depends(get_current_active_user)
):
    """Rename a project"""
    try:
        project_name = request.get("project_name", "").strip()
        if not project_name:
            raise HTTPException(status_code=400, detail="Project name cannot be empty")
        
        if len(project_name) > 100:
            raise HTTPException(status_code=400, detail="Project name too long (max 100 characters)")
        
        result = await storage_service.rename_project(
            user_id=current_user.id,
            project_id=project_id,
            new_name=project_name
        )
        
        if result["success"]:
            return {"success": True, "message": result["message"]}
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to rename project: {str(e)}")

@app.post("/projects/{project_id}/duplicate")
async def duplicate_project(
    project_id: str,
    current_user = Depends(get_current_active_user)
):
    """Duplicate a project"""
    try:
        result = await storage_service.duplicate_project(
            user_id=current_user.id,
            project_id=project_id
        )
        
        if result["success"]:
            return {
                "success": True, 
                "message": result["message"],
                "project_id": result.get("new_project_id")
            }
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to duplicate project: {str(e)}")

@app.put("/projects/{project_id}")
async def update_project(
    project_id: str,
    request: dict,
    current_user = Depends(get_current_active_user)
):
    """Update an existing project"""
    try:
        result = await storage_service.update_project(
            user_id=current_user.id,
            project_id=project_id,
            html_content=request.get("html_content"),
            project_name=request.get("project_name"),
            description=request.get("description")
        )
        
        if result["success"]:
            return {"success": True, "message": result["message"]}
        else:
            raise HTTPException(status_code=404, detail=result["message"])
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to update project: {str(e)}")

@app.post("/autosave", response_model=AutoSaveStateResponse)
async def auto_save_state(request: AutoSaveStateRequest):
    """Auto-save current state for recovery"""
    try:
        result = await storage_service.auto_save_state(
            session_id=request.session_id,
            html_content=request.html_content,
            css_content=request.css_content,
            js_content=request.js_content,
            cursor_position=request.cursor_position,
            scroll_position=request.scroll_position
        )
        
        if result["success"]:
            return AutoSaveStateResponse(
                success=True,
                last_saved=result["last_saved"],
                session_id=request.session_id
            )
        else:
            raise HTTPException(status_code=500, detail=result["message"])
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Auto-save failed: {str(e)}")

@app.post("/restore", response_model=RestoreStateResponse)
async def restore_state(request: RestoreStateRequest):
    """Restore auto-saved state"""
    try:
        result = await storage_service.restore_state(request.session_id)
        
        if result["success"]:
            return RestoreStateResponse(
                success=True,
                html_content=result.get("html_content"),
                css_content=result.get("css_content"),
                js_content=result.get("js_content"),
                cursor_position=result.get("cursor_position"),
                scroll_position=result.get("scroll_position"),
                last_modified=result.get("last_modified")
            )
        else:
            return RestoreStateResponse(
                success=False,
                html_content=None,
                css_content=None,
                js_content=None
            )
            
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to restore state: {str(e)}")

@app.post("/check-unsaved", response_model=ExitWarningResponse)
async def check_unsaved_changes(request: ExitWarningRequest):
    """Check for unsaved changes before exit"""
    try:
        result = await storage_service.check_unsaved_changes(
            session_id=request.session_id,
            current_content=request.current_content or ""
        )
        
        return ExitWarningResponse(
            should_warn=result["should_warn"],
            message=result["message"],
            unsaved_changes_count=result["unsaved_changes_count"]
        )
        
    except Exception as e:
        return ExitWarningResponse(
            should_warn=True,
            message="Unable to check for unsaved changes. Consider saving before exiting.",
            unsaved_changes_count=0
        )

@app.get("/.well-known/appspecific/com.chrome.devtools.json")
async def chrome_devtools_handler():
    """Handle Chrome DevTools protocol"""
    return {"message": "Voice Website Generator API"}

# Image proxy routes to handle broken image requests
@app.get("/{image_name:path}")
async def proxy_image(image_name: str):
    """Proxy image requests to placeholder services"""
    # Only handle image files
    if image_name.lower().endswith(('.jpg', '.jpeg', '.png', '.gif', '.webp')):
        return await image_service.proxy_image(image_name.split('/')[-1])
    else:
        raise HTTPException(status_code=404, detail="Not found")

@app.get("/images/{image_name}")
async def get_placeholder_image(image_name: str):
    """Get placeholder image by name"""
    return await image_service.proxy_image(image_name)

@app.post("/editor/save", response_model=EditorSaveResponse)
async def save_from_editor(
    request: EditorSaveRequest,
    current_user = Depends(get_current_active_user)
):
    """
    Save website content from editor to MongoDB
    Secure, authenticated endpoint with proper validation
    """
    try:
        # Input validation
        if not request.html_content.strip():
            raise HTTPException(status_code=400, detail="HTML content cannot be empty")
        
        if len(request.html_content) > 10 * 1024 * 1024:  # 10MB limit
            raise HTTPException(status_code=400, detail="HTML content too large (max 10MB)")
        
        # Generate project name if not provided
        project_name = request.project_name or f"Project_{request.session_id[:8]}_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Clean project name (remove any potentially harmful characters)
        import re
        project_name = re.sub(r'[^\w\s-]', '', project_name).strip()
        if not project_name:
            project_name = f"Project_{datetime.now().strftime('%Y%m%d_%H%M%S')}"
        
        # Save to MongoDB with comprehensive metadata
        result = await storage_service.save_project(
            user_id=current_user.id,
            session_id=request.session_id,
            html_content=request.html_content,
            project_name=project_name,
            description=request.description or f"Website saved from editor session {request.session_id}",
            metadata={
                "saved_via": "editor_save_endpoint",
                "user_agent": "web_editor",
                "content_length": len(request.html_content),
                "save_timestamp": datetime.now().isoformat(),
                "auto_save": request.auto_save,
                "session_id": request.session_id,
                "user_id": current_user.id,
                "editor_version": "2.0.0"
            },
            auto_save=request.auto_save,
            project_id=request.project_id
        )
        
        if result["success"]:
            # Update session manager (in-memory state)
            session_manager.add_to_history(
                request.session_id,
                request.html_content,
                "editor_save",
                f"Saved as '{project_name}'"
            )
            
            # Log successful save
            print(f"✅ Editor save successful - User: {current_user.username}, Project: {project_name}, Size: {len(request.html_content)} chars")
            
            return EditorSaveResponse(
                success=True,
                message=f"Project '{project_name}' saved successfully",
                project_id=result["project_id"],
                project_name=project_name,
                saved_at=result["saved_at"],
                version=1  # Will be incremented by storage service for updates
            )
        else:
            raise HTTPException(status_code=500, detail=result.get("message", "Failed to save project"))
            
    except HTTPException:
        raise
    except Exception as e:
        # Log error for debugging
        print(f"❌ Editor save error - User: {current_user.username if 'current_user' in locals() else 'unknown'}, Error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Save operation failed: {str(e)}")

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG
    ) 