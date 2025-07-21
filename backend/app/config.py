"""
Configuration management for HexWard backend
"""
import os
from functools import lru_cache
from pydantic_settings import BaseSettings
from typing import Optional

class Settings(BaseSettings):
    """Application settings"""
    
    # Database
    DATABASE_URL: str = "sqlite:///./hexward.db"
    
    # Security
    SECRET_KEY: str = "hexward-secret-key-change-in-production"
    JWT_SECRET_KEY: str = "jwt-secret-key-change-in-production"
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30
    
    # OpenAI
    OPENAI_API_KEY: Optional[str] = None
    
    # Camera Configuration
    DEFAULT_CAMERA_INDEX: int = 0
    CAMERA_RESOLUTION_WIDTH: int = 640
    CAMERA_RESOLUTION_HEIGHT: int = 480
    DETECTION_CONFIDENCE_THRESHOLD: float = 0.5
    
    # WebSocket
    WEBSOCKET_HOST: str = "localhost"
    WEBSOCKET_PORT: int = 8000
    
    # Monitoring
    ALERT_CHECK_INTERVAL: int = 5
    PATIENT_UPDATE_INTERVAL: int = 10
    CAMERA_FRAME_RATE: int = 30
    
    # Hospital
    HOSPITAL_NAME: str = "HexWard Medical Center"
    HOSPITAL_TIMEZONE: str = "UTC"
    
    # AI Models
    YOLO_MODEL_PATH: str = "yolov8n.pt"  # Will download automatically
    WHISPER_MODEL: str = "base"
    
    class Config:
        env_file = ".env"
        case_sensitive = True

@lru_cache()
def get_settings():
    """Get cached settings instance"""
    return Settings()