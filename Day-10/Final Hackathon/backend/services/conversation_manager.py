import json
import uuid
from typing import Dict, List, Any, Optional
from datetime import datetime
import chromadb
from chromadb.config import Settings
from core.database import get_database
from core.config import get_settings
import google.generativeai as genai

class ConversationManager:
    """Service for managing vivvie conversations with MongoDB and ChromaDB integration"""
    
    def __init__(self):
        self.settings = get_settings()
        genai.configure(api_key=self.settings.GEMINI_API_KEY)
        self.model = genai.GenerativeModel(self.settings.AI_MODEL)
        
        # Initialize ChromaDB for conversation vectors
        self.chroma_client = self._get_or_create_chroma_client()
        
        try:
            self.conversations_collection = self.chroma_client.get_collection("vivvie_conversations")
        except:
            self.conversations_collection = self.chroma_client.create_collection("vivvie_conversations")

    def _get_or_create_chroma_client(self):
        """Get or create ChromaDB client with proper error handling"""
        import os
        import time
        
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
                print("ChromaDB settings conflict detected. Creating new conversation database...")
                
                # Try to create a new database path with timestamp
                timestamp = int(time.time())
                new_path = f"./chroma_db_{timestamp}"
                
                try:
                    settings = Settings(
                        anonymized_telemetry=False,
                        allow_reset=True
                    )
                    client = chromadb.PersistentClient(path=new_path, settings=settings)
                    print(f"Created new ChromaDB for conversations at {new_path}")
                    return client
                except Exception as fallback_error:
                    print(f"Fallback conversation database creation failed: {fallback_error}")
                    print("Using in-memory ChromaDB client for conversations")
                    return chromadb.Client()
            else:
                raise e
        except Exception as e:
            print(f"Error initializing conversation ChromaDB: {e}")
            print("Using in-memory ChromaDB client for conversations")
            return chromadb.Client()

    async def save_conversation(
        self,
        user_id: str,
        final_prompt: str,
        session_id: Optional[str] = None,
        project_id: Optional[str] = None,
        website_type: Optional[str] = None,
        metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Save a conversation to both MongoDB and ChromaDB"""
        
        try:
            conversation_id = str(uuid.uuid4())
            timestamp = datetime.utcnow()
            
            # Analyze the prompt for better categorization
            prompt_analysis = await self._analyze_prompt(final_prompt)
            
            # Prepare conversation document for MongoDB
            conversation_doc = {
                "_id": conversation_id,
                "user_id": user_id,
                "session_id": session_id,
                "project_id": project_id,
                "final_prompt": final_prompt,
                "website_type": website_type or prompt_analysis.get("website_type", "general"),
                "created_at": timestamp,
                "updated_at": timestamp,
                "prompt_length": len(final_prompt),
                "word_count": len(final_prompt.split()),
                "analysis": prompt_analysis,
                "metadata": metadata or {},
                "status": "active"
            }
            
            # Save to MongoDB
            db = await get_database()
            await db.vivvie_conversations.insert_one(conversation_doc)
            
            # Save to ChromaDB for vector search
            await self._save_to_chromadb(
                conversation_id,
                final_prompt,
                user_id,
                prompt_analysis,
                timestamp
            )
            
            print(f"✅ Conversation saved: {conversation_id}")
            
            return {
                "success": True,
                "conversation_id": conversation_id,
                "message": "Conversation saved successfully",
                "analysis": prompt_analysis
            }
            
        except Exception as e:
            print(f"❌ Error saving conversation: {e}")
            return {
                "success": False,
                "error": str(e),
                "message": "Failed to save conversation"
            }

    async def _save_to_chromadb(
        self,
        conversation_id: str,
        final_prompt: str,
        user_id: str,
        analysis: Dict[str, Any],
        timestamp: datetime
    ):
        """Save conversation to ChromaDB for vector search"""
        try:
            # Create metadata for ChromaDB
            chroma_metadata = {
                "conversation_id": conversation_id,
                "user_id": user_id,
                "created_at": timestamp.isoformat(),
                "website_type": analysis.get("website_type", "general"),
                "complexity": analysis.get("complexity", "medium"),
                "features": json.dumps(analysis.get("features", [])),
                "word_count": len(final_prompt.split())
            }
            
            # Add to ChromaDB collection
            self.conversations_collection.add(
                documents=[final_prompt],
                metadatas=[chroma_metadata],
                ids=[conversation_id]
            )
            
            print(f"✅ Conversation added to ChromaDB: {conversation_id}")
            
        except Exception as e:
            print(f"⚠️ Warning: Could not save to ChromaDB: {e}")

    async def _analyze_prompt(self, prompt: str) -> Dict[str, Any]:
        """Analyze the prompt to extract insights and categorization"""
        try:
            analysis_prompt = f"""
            Analyze this website creation prompt and provide a JSON response with the following structure:
            {{
                "website_type": "portfolio|business|ecommerce|blog|landing|restaurant|agency|other",
                "complexity": "simple|medium|complex",
                "features": ["list", "of", "requested", "features"],
                "design_style": "modern|classic|minimalist|bold|creative|professional",
                "target_audience": "general|business|personal|creative|technical",
                "estimated_pages": 1-10,
                "special_requirements": ["list", "of", "special", "needs"]
            }}
            
            Prompt to analyze: "{prompt}"
            """
            
            response = await self.model.generate_content_async(analysis_prompt)
            
            # Try to parse JSON response
            try:
                # Extract JSON from response
                response_text = response.text
                start_idx = response_text.find('{')
                end_idx = response_text.rfind('}') + 1
                json_str = response_text[start_idx:end_idx]
                
                analysis = json.loads(json_str)
                return analysis
                
            except (json.JSONDecodeError, ValueError):
                # Fallback analysis based on keywords
                return self._fallback_prompt_analysis(prompt)
                
        except Exception as e:
            print(f"Warning: Could not analyze prompt with AI: {e}")
            return self._fallback_prompt_analysis(prompt)

    def _fallback_prompt_analysis(self, prompt: str) -> Dict[str, Any]:
        """Fallback prompt analysis using keyword matching"""
        prompt_lower = prompt.lower()
        
        # Website type detection
        website_types = {
            "portfolio": ["portfolio", "personal", "showcase", "work", "projects"],
            "business": ["business", "company", "corporate", "professional"],
            "ecommerce": ["shop", "store", "ecommerce", "buy", "sell", "product"],
            "blog": ["blog", "article", "news", "content", "writing"],
            "restaurant": ["restaurant", "food", "menu", "dining", "cafe"],
            "landing": ["landing", "marketing", "campaign", "signup"],
            "agency": ["agency", "creative", "services", "team"]
        }
        
        detected_type = "general"
        for type_name, keywords in website_types.items():
            if any(keyword in prompt_lower for keyword in keywords):
                detected_type = type_name
                break
        
        # Feature detection
        features = []
        feature_keywords = {
            "contact_form": ["contact", "form", "email"],
            "gallery": ["gallery", "photos", "images"],
            "animations": ["animation", "smooth", "interactive"],
            "dark_theme": ["dark", "black", "night"],
            "responsive": ["mobile", "responsive", "device"],
            "social_media": ["social", "facebook", "twitter", "instagram"]
        }
        
        for feature, keywords in feature_keywords.items():
            if any(keyword in prompt_lower for keyword in keywords):
                features.append(feature)
        
        # Complexity assessment
        complexity = "simple"
        if len(features) > 3 or len(prompt.split()) > 50:
            complexity = "complex"
        elif len(features) > 1 or len(prompt.split()) > 25:
            complexity = "medium"
        
        return {
            "website_type": detected_type,
            "complexity": complexity,
            "features": features,
            "design_style": "modern" if "modern" in prompt_lower else "professional",
            "target_audience": "general",
            "estimated_pages": min(5, max(1, len(features))),
            "special_requirements": features
        }

    async def get_user_conversations(
        self,
        user_id: str,
        limit: int = 20,
        offset: int = 0
    ) -> List[Dict[str, Any]]:
        """Get conversation history for a user"""
        try:
            db = await get_database()
            cursor = db.vivvie_conversations.find(
                {"user_id": user_id, "status": "active"},
                {"final_prompt": 1, "website_type": 1, "created_at": 1, "analysis": 1}
            ).sort("created_at", -1).skip(offset).limit(limit)
            
            conversations = await cursor.to_list(length=limit)
            
            return [
                {
                    "id": str(conv["_id"]),
                    "prompt": conv["final_prompt"][:200] + "..." if len(conv["final_prompt"]) > 200 else conv["final_prompt"],
                    "website_type": conv.get("website_type", "general"),
                    "created_at": conv["created_at"].isoformat(),
                    "analysis": conv.get("analysis", {})
                }
                for conv in conversations
            ]
            
        except Exception as e:
            print(f"Error fetching user conversations: {e}")
            return []

    async def search_conversations(
        self,
        user_id: str,
        query: str,
        limit: int = 10
    ) -> List[Dict[str, Any]]:
        """Search conversations using ChromaDB vector search"""
        try:
            # Search in ChromaDB
            results = self.conversations_collection.query(
                query_texts=[query],
                n_results=limit,
                where={"user_id": user_id}
            )
            
            if not results['documents'] or not results['documents'][0]:
                return []
            
            # Get full conversation details from MongoDB
            conversation_ids = results['ids'][0]
            db = await get_database()
            
            conversations = []
            for conv_id in conversation_ids:
                conv = await db.vivvie_conversations.find_one({"_id": conv_id})
                if conv:
                    conversations.append({
                        "id": str(conv["_id"]),
                        "prompt": conv["final_prompt"],
                        "website_type": conv.get("website_type", "general"),
                        "created_at": conv["created_at"].isoformat(),
                        "analysis": conv.get("analysis", {})
                    })
            
            return conversations
            
        except Exception as e:
            print(f"Error searching conversations: {e}")
            return []

    async def delete_conversation(self, conversation_id: str, user_id: str) -> bool:
        """Delete a conversation (soft delete)"""
        try:
            db = await get_database()
            result = await db.vivvie_conversations.update_one(
                {"_id": conversation_id, "user_id": user_id},
                {"$set": {"status": "deleted", "updated_at": datetime.utcnow()}}
            )
            
            return result.modified_count > 0
            
        except Exception as e:
            print(f"Error deleting conversation: {e}")
            return False 
 