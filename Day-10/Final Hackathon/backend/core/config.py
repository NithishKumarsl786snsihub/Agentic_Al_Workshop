import os
from typing import List
from pydantic_settings import BaseSettings
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

class Settings(BaseSettings):
    # API Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Server Configuration
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    HOST: str = os.getenv("HOST", "localhost")
    PORT: int = int(os.getenv("PORT", "8000"))
    
    # AI Model Configuration
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.1"))
    
    # Multi-Agent Configuration
    ENABLE_MULTI_AGENT: bool = os.getenv("ENABLE_MULTI_AGENT", "true").lower() == "true"
    
    # Development Configuration
    DEBUG: bool = os.getenv("DEBUG", "true").lower() == "true"
    
    # Storage Configuration
    USER_FILES_DIR: str = os.getenv("USER_FILES_DIR", "./user_files")
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./chroma_db")
    CHROMA_DB_DIR: str = os.getenv("CHROMA_DB_DIR", "./chroma_db")
    
    # LangGraph Configuration
    MAX_ITERATIONS: int = int(os.getenv("MAX_ITERATIONS", "10"))
    TEMPERATURE: float = float(os.getenv("TEMPERATURE", "0.7"))
    
    class Config:
        env_file = ".env"
        case_sensitive = True
        extra = "allow"  # Allow extra fields from environment

    def __init__(self, **kwargs):
        super().__init__(**kwargs)
        
        # Parse CORS origins from environment variable (handled separately from pydantic)
        cors_origins_str = os.getenv("CORS_ORIGINS", "http://localhost:3000,http://127.0.0.1:3000")
        self.CORS_ORIGINS = [origin.strip() for origin in cors_origins_str.split(",") if origin.strip()]
        
        # Create directories if they don't exist
        os.makedirs(self.USER_FILES_DIR, exist_ok=True)
        os.makedirs(self.CHROMA_DB_DIR, exist_ok=True)
    
    @property
    def cors_origins(self) -> List[str]:
        """Get CORS origins as a list."""
        return self.CORS_ORIGINS

# Global settings instance
_settings = None

def get_settings() -> Settings:
    global _settings
    if _settings is None:
        _settings = Settings()
    return _settings 