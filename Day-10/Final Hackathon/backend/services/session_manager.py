import os
import json
import uuid
from datetime import datetime
from typing import Dict, Any, List, Optional
import chromadb
from chromadb.config import Settings as ChromaSettings
from core.config import get_settings

class SessionManager:
    def __init__(self):
        self.settings = get_settings()
        self.sessions: Dict[str, Dict] = {}
        
        # Initialize ChromaDB
        self.chroma_client = chromadb.PersistentClient(
            path=self.settings.CHROMA_DB_PATH,
            settings=ChromaSettings(anonymized_telemetry=False)
        )
        
        # Get or create collection for sessions
        try:
            self.collection = self.chroma_client.get_collection("website_sessions")
        except:
            self.collection = self.chroma_client.create_collection("website_sessions")
    
    def create_session(self, session_id: str, initial_prompt: str, html_content: str) -> Dict[str, Any]:
        """Create a new session"""
        session_data = {
            "session_id": session_id,
            "created_at": datetime.now().isoformat(),
            "initial_prompt": initial_prompt,
            "current_html": html_content,
            "history": [
                {
                    "timestamp": datetime.now().isoformat(),
                    "action": "create",
                    "prompt": initial_prompt,
                    "html_content": html_content
                }
            ],
            "undo_stack": [],
            "redo_stack": [],
            "current_index": 0
        }
        
        self.sessions[session_id] = session_data
        
        # Store in ChromaDB
        self.collection.add(
            documents=[html_content],
            metadatas=[{
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "action": "create",
                "prompt": initial_prompt
            }],
            ids=[f"{session_id}_0"]
        )
        
        return session_data
    
    def add_to_history(self, session_id: str, html_content: str, action: str, prompt: Optional[str] = None) -> None:
        """Add a new state to session history"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        
        # Add current state to undo stack
        session["undo_stack"].append({
            "html_content": session["current_html"],
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "prompt": prompt
        })
        
        # Clear redo stack when new action is performed
        session["redo_stack"] = []
        
        # Update current state
        session["current_html"] = html_content
        session["current_index"] += 1
        
        # Add to history
        history_entry = {
            "timestamp": datetime.now().isoformat(),
            "action": action,
            "html_content": html_content,
            "prompt": prompt
        }
        session["history"].append(history_entry)
        
        # Store in ChromaDB
        self.collection.add(
            documents=[html_content],
            metadatas=[{
                "session_id": session_id,
                "timestamp": datetime.now().isoformat(),
                "action": action,
                "prompt": prompt or ""
            }],
            ids=[f"{session_id}_{session['current_index']}"]
        )
        
        # Limit history size (keep last 50 states)
        if len(session["undo_stack"]) > 50:
            session["undo_stack"] = session["undo_stack"][-50:]
    
    def undo(self, session_id: str) -> Dict[str, Any]:
        """Undo the last action"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        
        if not session["undo_stack"]:
            return {
                "html_content": session["current_html"],
                "can_undo": False,
                "can_redo": len(session["redo_stack"]) > 0
            }
        
        # Move current state to redo stack
        session["redo_stack"].append({
            "html_content": session["current_html"],
            "timestamp": datetime.now().isoformat(),
            "action": "redo_point"
        })
        
        # Restore previous state from undo stack
        previous_state = session["undo_stack"].pop()
        session["current_html"] = previous_state["html_content"]
        
        return {
            "html_content": session["current_html"],
            "can_undo": len(session["undo_stack"]) > 0,
            "can_redo": len(session["redo_stack"]) > 0
        }
    
    def redo(self, session_id: str) -> Dict[str, Any]:
        """Redo the last undone action"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        session = self.sessions[session_id]
        
        if not session["redo_stack"]:
            return {
                "html_content": session["current_html"],
                "can_undo": len(session["undo_stack"]) > 0,
                "can_redo": False
            }
        
        # Move current state to undo stack
        session["undo_stack"].append({
            "html_content": session["current_html"],
            "timestamp": datetime.now().isoformat(),
            "action": "undo_point"
        })
        
        # Restore next state from redo stack
        next_state = session["redo_stack"].pop()
        session["current_html"] = next_state["html_content"]
        
        return {
            "html_content": session["current_html"],
            "can_undo": len(session["undo_stack"]) > 0,
            "can_redo": len(session["redo_stack"]) > 0
        }
    
    def get_session_history(self, session_id: str) -> List[Dict[str, Any]]:
        """Get session history"""
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        return self.sessions[session_id]["history"]
    
    def save_html_file(self, session_id: str, html_content: str, filename: str) -> str:
        """Save HTML content to file"""
        # Create session directory
        session_dir = os.path.join(self.settings.USER_FILES_DIR, session_id)
        os.makedirs(session_dir, exist_ok=True)
        
        # Save file
        file_path = os.path.join(session_dir, filename)
        with open(file_path, 'w', encoding='utf-8') as f:
            f.write(html_content)
        
        return file_path
    
    def load_html_file(self, session_id: str, filename: str) -> str:
        """Load HTML content from file"""
        file_path = os.path.join(self.settings.USER_FILES_DIR, session_id, filename)
        
        if not os.path.exists(file_path):
            raise FileNotFoundError(f"File {filename} not found for session {session_id}")
        
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    
    def list_session_files(self, session_id: str) -> List[str]:
        """List all files for a session"""
        session_dir = os.path.join(self.settings.USER_FILES_DIR, session_id)
        
        if not os.path.exists(session_dir):
            return []
        
        return [f for f in os.listdir(session_dir) if f.endswith('.html')]
    
    def search_sessions(self, query: str, limit: int = 10) -> List[Dict[str, Any]]:
        """Search sessions using ChromaDB"""
        try:
            results = self.collection.query(
                query_texts=[query],
                n_results=limit
            )
            
            return [
                {
                    "session_id": metadata.get("session_id"),
                    "timestamp": metadata.get("timestamp"),
                    "action": metadata.get("action"),
                    "prompt": metadata.get("prompt"),
                    "html_preview": document[:200] + "..." if len(document) > 200 else document
                }
                for metadata, document in zip(results["metadatas"][0], results["documents"][0])
            ]
        except Exception as e:
            print(f"Search error: {e}")
            return []
    
    def get_session_stats(self, session_id: str) -> Dict[str, Any]:
        """Get session statistics"""
        if session_id not in self.sessions:
            return {}
        
        session = self.sessions[session_id]
        
        return {
            "session_id": session_id,
            "created_at": session["created_at"],
            "total_actions": len(session["history"]),
            "can_undo": len(session["undo_stack"]) > 0,
            "can_redo": len(session["redo_stack"]) > 0,
            "current_html_size": len(session["current_html"]),
            "files_saved": len(self.list_session_files(session_id))
        }
    
    def cleanup_old_sessions(self, days_old: int = 30) -> int:
        """Clean up sessions older than specified days"""
        cutoff_date = datetime.now().timestamp() - (days_old * 24 * 60 * 60)
        cleaned_count = 0
        
        sessions_to_remove = []
        
        for session_id, session_data in self.sessions.items():
            created_at = datetime.fromisoformat(session_data["created_at"])
            if created_at.timestamp() < cutoff_date:
                sessions_to_remove.append(session_id)
        
        for session_id in sessions_to_remove:
            # Remove from memory
            del self.sessions[session_id]
            
            # Remove files
            session_dir = os.path.join(self.settings.USER_FILES_DIR, session_id)
            if os.path.exists(session_dir):
                import shutil
                shutil.rmtree(session_dir)
            
            cleaned_count += 1
        
        return cleaned_count 