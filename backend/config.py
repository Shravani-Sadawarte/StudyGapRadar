from pydantic_settings import BaseSettings
from typing import List
import os

class Settings(BaseSettings):
    PROJECT_NAME: str = "StudyGapRadar API"
    VERSION: str = "1.0.0"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = "studygapradar-secure-academic-secret-key-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days
    
    # Database
    DATABASE_URL: str = "sqlite:///./studygapradar.db"
    
    # CORS
    CORS_ORIGINS: List[str] = [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000"
    ]
    
    # AI / LLM Integration
    OPENAI_API_KEY: str = os.getenv("OPENAI_API_KEY", "")
    OPENAI_MODEL: str = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
    
    # Upload limits
    MAX_UPLOAD_SIZE_MB: int = 25
    
    class Config:
        env_file = ".env"
        extra = "allow"

settings = Settings()
