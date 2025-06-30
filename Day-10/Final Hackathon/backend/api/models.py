from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from datetime import datetime

# Existing models
class UserCreate(BaseModel):
    username: str = Field(..., min_length=3, max_length=50)
    email: str = Field(..., regex=r'^[^@]+@[^@]+\.[^@]+$')
    password: str = Field(..., min_length=6)
    full_name: Optional[str] = None

class UserLogin(BaseModel):
    username: str
    password: str

class UserResponse(BaseModel):
    id: str
    username: str
    email: str
    full_name: Optional[str] = None
    created_at: datetime
    is_active: bool = True

class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"

class TokenData(BaseModel):
    username: Optional[str] = None

# NEW: Code Storage Models
class SaveCodeRequest(BaseModel):
    session_id: str
    html_content: str
    css_content: Optional[str] = None
    js_content: Optional[str] = None
    project_name: Optional[str] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None
    auto_save: bool = False
    generate_preview: bool = True  # Whether to generate preview images

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
    preview_image: Optional[str] = None  # Base64 full preview image
    thumbnail_image: Optional[str] = None  # Base64 thumbnail image

class ProjectListRequest(BaseModel):
    limit: int = 10
    offset: int = 0
    search: Optional[str] = None

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

# Exit Warning Models
class ExitWarningRequest(BaseModel):
    session_id: str
    has_unsaved_changes: bool
    current_content: Optional[str] = None

class ExitWarningResponse(BaseModel):
    should_warn: bool
    message: str
    unsaved_changes_count: int 