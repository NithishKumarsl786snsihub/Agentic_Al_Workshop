import os
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import Optional

load_dotenv()

class Settings(BaseModel):
    """Application settings"""
    
    # API Configuration
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    FRONTEND_URL: str = os.getenv("FRONTEND_URL", "http://localhost:3000")
    BACKEND_URL: str = os.getenv("BACKEND_URL", "http://localhost:8000")
    
    # Application Configuration
    APP_NAME: str = "AI-Powered Website Compliance Auditor"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = os.getenv("DEBUG", "False").lower() == "true"
    
    # Database Configuration (for ChromaDB)
    CHROMA_DB_PATH: str = os.getenv("CHROMA_DB_PATH", "./chroma_db")
    
    # Multi-Agent Configuration
    ENABLE_MULTI_AGENT: bool = os.getenv("ENABLE_MULTI_AGENT", "True").lower() == "true"
    
    # Rate Limiting
    RATE_LIMIT_REQUESTS: int = int(os.getenv("RATE_LIMIT_REQUESTS", "100"))
    RATE_LIMIT_WINDOW: int = int(os.getenv("RATE_LIMIT_WINDOW", "3600"))  # 1 hour
    
    # Scraping Configuration
    REQUEST_TIMEOUT: int = int(os.getenv("REQUEST_TIMEOUT", "10"))
    MAX_CONTENT_LENGTH: int = int(os.getenv("MAX_CONTENT_LENGTH", "5000"))
    
    # AI Configuration
    AI_MODEL: str = os.getenv("AI_MODEL", "gemini-1.5-flash")
    AI_TEMPERATURE: float = float(os.getenv("AI_TEMPERATURE", "0.1"))

# Create settings instance
settings = Settings() 