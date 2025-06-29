"""
Smart API Key Manager for handling multiple Gemini API keys with automatic failover
"""
import time
from typing import List, Optional, Dict
import google.generativeai as genai
from langchain_google_genai import ChatGoogleGenerativeAI
from core.config import get_settings

class APIKeyManager:
    """Manages multiple API keys with automatic failover on quota exhaustion"""
    
    def __init__(self):
        self.settings = get_settings()
        self.available_keys = self.settings.get_available_api_keys()
        self.current_key_index = 0
        self.failed_keys = set()  # Track keys that have failed recently
        self.key_failure_times = {}  # Track when keys failed
        self.failure_cooldown = 300  # 5 minutes cooldown for failed keys
        
        print(f"🔑 APIKeyManager initialized with {len(self.available_keys)} keys")
        
    def get_current_api_key(self) -> Optional[str]:
        """Get the current working API key"""
        if not self.available_keys:
            return None
            
        # Clean up expired failures
        self._cleanup_expired_failures()
        
        # Find next working key
        for i in range(len(self.available_keys)):
            key_index = (self.current_key_index + i) % len(self.available_keys)
            key = self.available_keys[key_index]
            
            if key not in self.failed_keys:
                self.current_key_index = key_index
                return key
        
        # All keys failed, reset and try again
        print("⚠️ All API keys failed, resetting failure tracking...")
        self.failed_keys.clear()
        self.key_failure_times.clear()
        return self.available_keys[0] if self.available_keys else None
    
    def mark_key_as_failed(self, api_key: str, error_message: str = ""):
        """Mark an API key as failed due to quota or other issues"""
        if api_key in self.available_keys:
            self.failed_keys.add(api_key)
            self.key_failure_times[api_key] = time.time()
            
            key_index = self.available_keys.index(api_key) + 1
            print(f"🚫 API Key #{key_index} marked as failed: {error_message}")
            
            # Move to next key
            self._switch_to_next_key()
    
    def _switch_to_next_key(self):
        """Switch to the next available API key"""
        if len(self.available_keys) <= 1:
            return
            
        original_index = self.current_key_index
        
        for i in range(1, len(self.available_keys)):
            next_index = (self.current_key_index + i) % len(self.available_keys)
            next_key = self.available_keys[next_index]
            
            if next_key not in self.failed_keys:
                self.current_key_index = next_index
                print(f"🔄 Switched to API Key #{next_index + 1}")
                return
        
        print("⚠️ No working API keys available, staying with current key")
    
    def _cleanup_expired_failures(self):
        """Remove keys from failed list if cooldown period has passed"""
        current_time = time.time()
        expired_keys = []
        
        for key, failure_time in self.key_failure_times.items():
            if current_time - failure_time > self.failure_cooldown:
                expired_keys.append(key)
        
        for key in expired_keys:
            self.failed_keys.discard(key)
            del self.key_failure_times[key]
            key_index = self.available_keys.index(key) + 1
            print(f"✅ API Key #{key_index} cooldown expired, available again")
    
    def get_langchain_llm(self, **kwargs) -> Optional[ChatGoogleGenerativeAI]:
        """Get a LangChain LLM instance with current working API key"""
        api_key = self.get_current_api_key()
        if not api_key:
            return None
            
        try:
            return ChatGoogleGenerativeAI(
                model=self.settings.AI_MODEL,
                google_api_key=api_key,
                temperature=kwargs.get('temperature', self.settings.AI_TEMPERATURE),
                **kwargs
            )
        except Exception as e:
            print(f"❌ Error creating LangChain LLM: {e}")
            return None
    
    def get_genai_model(self, **kwargs):
        """Get a Google GenAI model with current working API key"""
        api_key = self.get_current_api_key()
        if not api_key:
            return None
            
        try:
            genai.configure(api_key=api_key)
            return genai.GenerativeModel(
                self.settings.AI_MODEL,
                **kwargs
            )
        except Exception as e:
            print(f"❌ Error creating GenAI model: {e}")
            return None
    
    def handle_api_error(self, error: Exception, api_key: str = None) -> bool:
        """Handle API errors and switch keys if needed. Returns True if should retry."""
        error_str = str(error).lower()
        
        # Check if it's a quota error
        if "429" in error_str or "quota" in error_str or "exceeded" in error_str:
            current_key = api_key or self.get_current_api_key()
            if current_key:
                self.mark_key_as_failed(current_key, "Quota exceeded")
                
                # Check if we have another key to try
                next_key = self.get_current_api_key()
                if next_key and next_key != current_key:
                    print(f"🔄 Retrying with backup API key...")
                    return True
        
        return False
    
    def get_status(self) -> Dict:
        """Get current status of all API keys"""
        status = {
            "total_keys": len(self.available_keys),
            "current_key_index": self.current_key_index + 1,
            "failed_keys": len(self.failed_keys),
            "available_keys": len(self.available_keys) - len(self.failed_keys),
            "keys_status": []
        }
        
        for i, key in enumerate(self.available_keys):
            key_status = {
                "key_number": i + 1,
                "is_current": i == self.current_key_index,
                "is_failed": key in self.failed_keys,
                "last_4_chars": key[-4:] if key else "None"
            }
            
            if key in self.key_failure_times:
                time_since_failure = time.time() - self.key_failure_times[key]
                key_status["time_since_failure"] = f"{int(time_since_failure)}s"
                key_status["cooldown_remaining"] = max(0, int(self.failure_cooldown - time_since_failure))
            
            status["keys_status"].append(key_status)
        
        return status

# Global API key manager instance
api_key_manager = APIKeyManager() 