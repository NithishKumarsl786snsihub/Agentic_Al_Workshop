"""
Storage Service for Code Persistence and Project Management
Handles MongoDB operations, auto-save, and state management
"""
import os
import uuid
import json
from datetime import datetime, timedelta
from typing import Optional, List, Dict, Any
from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase
from core.database import get_database
from services.session_manager import SessionManager
import asyncio

class StorageService:
    """Comprehensive storage service for code persistence"""
    
    def __init__(self):
        self.session_manager = SessionManager()
        self.auto_save_interval = 30  # seconds
        self.auto_save_tasks = {}  # Track active auto-save tasks
        
    async def get_database(self) -> AsyncIOMotorDatabase:
        """Get database connection"""
        return await get_database()
    
    async def save_project(self, 
                          user_id: str,
                          session_id: str, 
                          html_content: str,
                          css_content: Optional[str] = None,
                          js_content: Optional[str] = None,
                          project_name: Optional[str] = None,
                          description: Optional[str] = None,
                          metadata: Optional[Dict[str, Any]] = None,
                          auto_save: bool = False,
                          project_id: Optional[str] = None) -> Dict[str, Any]:
        """Save project to MongoDB"""
        try:
            db = await self.get_database()
            collection = db.user_projects
            
            now = datetime.utcnow()
            
            # Generate project_id if not provided (new project)
            if not project_id:
                project_id = str(uuid.uuid4())
                is_new_project = True
            else:
                is_new_project = False
            
            # Prepare project data
            project_data = {
                "project_id": project_id,
                "user_id": user_id,
                "session_id": session_id,
                "project_name": project_name or f"Project_{session_id[:8]}",
                "description": description or "",
                "html_content": html_content,
                "css_content": css_content or "",
                "js_content": js_content or "",
                "metadata": metadata or {},
                "is_auto_save": auto_save,
                "last_modified": now,
                "version": 1,
                "file_size": len(html_content) + len(css_content or "") + len(js_content or ""),
                "tags": self._extract_tags_from_content(html_content),
                "status": "active"
            }
            
            if is_new_project:
                project_data["created_at"] = now
                project_data["created_by"] = user_id
                
                # Insert new project
                result = await collection.insert_one(project_data)
                
                # Also save to file system for backup
                file_path = await self._save_to_file_system(project_id, html_content, css_content, js_content)
                
                return {
                    "success": True,
                    "message": "Project saved successfully",
                    "project_id": project_id,
                    "saved_at": now,
                    "file_path": file_path,
                    "is_new": True
                }
            else:
                # Update existing project
                update_data = {
                    "$set": project_data,
                    "$inc": {"version": 1}
                }
                
                result = await collection.update_one(
                    {"project_id": project_id, "user_id": user_id},
                    update_data
                )
                
                if result.modified_count > 0:
                    # Update file system backup
                    file_path = await self._save_to_file_system(project_id, html_content, css_content, js_content)
                    
                    return {
                        "success": True,
                        "message": "Project updated successfully",
                        "project_id": project_id,
                        "saved_at": now,
                        "file_path": file_path,
                        "is_new": False
                    }
                else:
                    return {
                        "success": False,
                        "message": "Project not found or no changes made",
                        "project_id": project_id
                    }
                    
        except Exception as e:
            print(f"❌ Error saving project: {e}")
            return {
                "success": False,
                "message": f"Failed to save project: {str(e)}",
                "project_id": project_id or "unknown"
            }
    
    async def load_project(self, 
                          user_id: str, 
                          project_id: Optional[str] = None,
                          session_id: Optional[str] = None) -> Dict[str, Any]:
        """Load project from MongoDB"""
        try:
            db = await self.get_database()
            collection = db.user_projects
            
            # Build query
            query = {"user_id": user_id, "status": "active"}
            if project_id:
                query["project_id"] = project_id
            elif session_id:
                query["session_id"] = session_id
            else:
                return {"success": False, "message": "Either project_id or session_id must be provided"}
            
            # Find project
            project = await collection.find_one(query, sort=[("last_modified", -1)])
            
            if not project:
                return {"success": False, "message": "Project not found"}
            
            return {
                "success": True,
                "html_content": project.get("html_content", ""),
                "css_content": project.get("css_content", ""),
                "js_content": project.get("js_content", ""),
                "project_name": project.get("project_name", ""),
                "description": project.get("description", ""),
                "metadata": project.get("metadata", {}),
                "last_modified": project.get("last_modified"),
                "project_id": project.get("project_id"),
                "version": project.get("version", 1)
            }
            
        except Exception as e:
            print(f"❌ Error loading project: {e}")
            return {"success": False, "message": f"Failed to load project: {str(e)}"}
    
    async def list_user_projects(self, 
                                user_id: str,
                                limit: int = 10,
                                offset: int = 0,
                                search: Optional[str] = None) -> Dict[str, Any]:
        """List user projects with pagination and search"""
        try:
            db = await self.get_database()
            collection = db.user_projects
            
            # Build query
            query = {"user_id": user_id, "status": "active"}
            
            if search:
                query["$or"] = [
                    {"project_name": {"$regex": search, "$options": "i"}},
                    {"description": {"$regex": search, "$options": "i"}},
                    {"tags": {"$in": [search]}}
                ]
            
            # Get total count
            total = await collection.count_documents(query)
            
            # Get projects with pagination
            cursor = collection.find(query, {
                "project_id": 1,
                "project_name": 1,
                "description": 1,
                "created_at": 1,
                "last_modified": 1,
                "file_size": 1,
                "version": 1,
                "tags": 1,
                "is_auto_save": 1
            }).sort("last_modified", -1).skip(offset).limit(limit)
            
            projects = await cursor.to_list(length=limit)
            
            # Format response
            formatted_projects = []
            for project in projects:
                formatted_projects.append({
                    "project_id": project["project_id"],
                    "project_name": project["project_name"],
                    "description": project["description"],
                    "created_at": project["created_at"],
                    "last_modified": project["last_modified"],
                    "file_size": project["file_size"],
                    "version": project["version"],
                    "tags": project.get("tags", []),
                    "is_auto_save": project.get("is_auto_save", False)
                })
            
            return {
                "success": True,
                "projects": formatted_projects,
                "total": total,
                "has_more": (offset + limit) < total
            }
            
        except Exception as e:
            print(f"❌ Error listing projects: {e}")
            return {"success": False, "message": f"Failed to list projects: {str(e)}"}
    
    async def delete_project(self, user_id: str, project_id: str) -> Dict[str, Any]:
        """Delete project (soft delete)"""
        try:
            db = await self.get_database()
            collection = db.user_projects
            
            result = await collection.update_one(
                {"project_id": project_id, "user_id": user_id},
                {"$set": {"status": "deleted", "deleted_at": datetime.utcnow()}}
            )
            
            if result.modified_count > 0:
                return {"success": True, "message": "Project deleted successfully"}
            else:
                return {"success": False, "message": "Project not found"}
                
        except Exception as e:
            print(f"❌ Error deleting project: {e}")
            return {"success": False, "message": f"Failed to delete project: {str(e)}"}
    
    async def auto_save_state(self,
                             session_id: str,
                             html_content: str,
                             css_content: Optional[str] = None,
                             js_content: Optional[str] = None,
                             cursor_position: Optional[Dict[str, Any]] = None,
                             scroll_position: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        """Auto-save current state for recovery"""
        try:
            db = await self.get_database()
            collection = db.auto_save_states
            
            now = datetime.utcnow()
            
            # Prepare auto-save data
            auto_save_data = {
                "session_id": session_id,
                "html_content": html_content,
                "css_content": css_content or "",
                "js_content": js_content or "",
                "cursor_position": cursor_position or {},
                "scroll_position": scroll_position or {},
                "saved_at": now,
                "expires_at": now + timedelta(hours=24)  # Auto-save expires after 24 hours
            }
            
            # Upsert auto-save state
            await collection.replace_one(
                {"session_id": session_id},
                auto_save_data,
                upsert=True
            )
            
            return {
                "success": True,
                "last_saved": now,
                "session_id": session_id
            }
            
        except Exception as e:
            print(f"❌ Error auto-saving state: {e}")
            return {"success": False, "message": f"Auto-save failed: {str(e)}"}
    
    async def restore_state(self, session_id: str) -> Dict[str, Any]:
        """Restore auto-saved state"""
        try:
            db = await self.get_database()
            collection = db.auto_save_states
            
            # Find auto-save state
            state = await collection.find_one({
                "session_id": session_id,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            if not state:
                return {"success": False, "message": "No auto-save state found"}
            
            return {
                "success": True,
                "html_content": state.get("html_content"),
                "css_content": state.get("css_content"),
                "js_content": state.get("js_content"),
                "cursor_position": state.get("cursor_position"),
                "scroll_position": state.get("scroll_position"),
                "last_modified": state.get("saved_at")
            }
            
        except Exception as e:
            print(f"❌ Error restoring state: {e}")
            return {"success": False, "message": f"Failed to restore state: {str(e)}"}
    
    async def check_unsaved_changes(self, session_id: str, current_content: str) -> Dict[str, Any]:
        """Check if there are unsaved changes"""
        try:
            db = await self.get_database()
            
            # Check last saved project
            projects_collection = db.user_projects
            last_project = await projects_collection.find_one({
                "session_id": session_id,
                "status": "active"
            }, sort=[("last_modified", -1)])
            
            # Check auto-save state
            auto_save_collection = db.auto_save_states
            auto_save = await auto_save_collection.find_one({
                "session_id": session_id,
                "expires_at": {"$gt": datetime.utcnow()}
            })
            
            has_unsaved_changes = True
            unsaved_changes_count = 0
            
            if last_project:
                last_saved_content = last_project.get("html_content", "")
                if last_saved_content == current_content:
                    has_unsaved_changes = False
                else:
                    # Count approximate changes
                    unsaved_changes_count = abs(len(current_content) - len(last_saved_content))
            
            if auto_save and has_unsaved_changes:
                auto_save_content = auto_save.get("html_content", "")
                if auto_save_content == current_content:
                    has_unsaved_changes = False
            
            return {
                "should_warn": has_unsaved_changes,
                "message": "You have unsaved changes. Do you want to save before exiting?" if has_unsaved_changes else "No unsaved changes",
                "unsaved_changes_count": unsaved_changes_count
            }
            
        except Exception as e:
            print(f"❌ Error checking unsaved changes: {e}")
            return {
                "should_warn": True,
                "message": "Unable to check for unsaved changes. Consider saving before exiting.",
                "unsaved_changes_count": 0
            }
    
    def start_auto_save(self, session_id: str, get_content_callback):
        """Start auto-save for a session"""
        if session_id in self.auto_save_tasks:
            return  # Already running
        
        async def auto_save_loop():
            while session_id in self.auto_save_tasks:
                try:
                    # Get current content from callback
                    content = await get_content_callback()
                    if content:
                        await self.auto_save_state(
                            session_id=session_id,
                            html_content=content.get("html_content", ""),
                            css_content=content.get("css_content"),
                            js_content=content.get("js_content"),
                            cursor_position=content.get("cursor_position"),
                            scroll_position=content.get("scroll_position")
                        )
                        print(f"💾 Auto-saved session {session_id}")
                    
                    await asyncio.sleep(self.auto_save_interval)
                    
                except Exception as e:
                    print(f"❌ Auto-save error for session {session_id}: {e}")
                    await asyncio.sleep(self.auto_save_interval)
        
        # Start auto-save task
        task = asyncio.create_task(auto_save_loop())
        self.auto_save_tasks[session_id] = task
        print(f"🚀 Started auto-save for session {session_id}")
    
    def stop_auto_save(self, session_id: str):
        """Stop auto-save for a session"""
        if session_id in self.auto_save_tasks:
            task = self.auto_save_tasks[session_id]
            task.cancel()
            del self.auto_save_tasks[session_id]
            print(f"🛑 Stopped auto-save for session {session_id}")
    
    async def _save_to_file_system(self, 
                                  project_id: str, 
                                  html_content: str,
                                  css_content: Optional[str] = None,
                                  js_content: Optional[str] = None) -> str:
        """Save project to file system as backup"""
        try:
            # Create project directory
            project_dir = os.path.join("user_files", "projects", project_id)
            os.makedirs(project_dir, exist_ok=True)
            
            # Save HTML file
            html_file = os.path.join(project_dir, "index.html")
            with open(html_file, "w", encoding="utf-8") as f:
                f.write(html_content)
            
            # Save CSS file if provided
            if css_content:
                css_file = os.path.join(project_dir, "style.css")
                with open(css_file, "w", encoding="utf-8") as f:
                    f.write(css_content)
            
            # Save JS file if provided
            if js_content:
                js_file = os.path.join(project_dir, "script.js")
                with open(js_file, "w", encoding="utf-8") as f:
                    f.write(js_content)
            
            # Save metadata
            metadata_file = os.path.join(project_dir, "metadata.json")
            metadata = {
                "project_id": project_id,
                "saved_at": datetime.utcnow().isoformat(),
                "files": {
                    "html": "index.html",
                    "css": "style.css" if css_content else None,
                    "js": "script.js" if js_content else None
                }
            }
            with open(metadata_file, "w", encoding="utf-8") as f:
                json.dump(metadata, f, indent=2)
            
            return project_dir
            
        except Exception as e:
            print(f"❌ Error saving to file system: {e}")
            return ""
    
    def _extract_tags_from_content(self, html_content: str) -> List[str]:
        """Extract tags from HTML content for search"""
        tags = []
        
        # Basic tag extraction
        if "bootstrap" in html_content.lower():
            tags.append("bootstrap")
        if "react" in html_content.lower():
            tags.append("react")
        if "vue" in html_content.lower():
            tags.append("vue")
        if "angular" in html_content.lower():
            tags.append("angular")
        if "portfolio" in html_content.lower():
            tags.append("portfolio")
        if "landing" in html_content.lower():
            tags.append("landing")
        if "business" in html_content.lower():
            tags.append("business")
        if "blog" in html_content.lower():
            tags.append("blog")
        
        return tags

# Global storage service instance
storage_service = StorageService() 