"""
HexWard Backend - AI Hospital Monitoring System
FastAPI server with real-time AI processing, computer vision, and GPT integration
"""
import asyncio
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.staticfiles import StaticFiles
import uvicorn

from app.config import get_settings
from app.database import engine, Base, get_db
from app.routers import patients, alerts, cameras, auth, analytics, ip_cameras
from app.services.ai_monitor import AIMonitorService
from app.services.websocket_manager import WebSocketManager
from app.services.camera_service import CameraService
from app.services.gpt_service import GPTService
from app.models.schemas import Token

settings = get_settings()

# Create database tables
Base.metadata.create_all(bind=engine)

# Initialize services
websocket_manager = WebSocketManager()
ai_monitor = AIMonitorService()
camera_service = CameraService()
gpt_service = GPTService()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan management"""
    print("🏥 Starting HexWard AI Hospital Monitoring System...")
    
    # Start background services
    await ai_monitor.start()
    await camera_service.start()
    
    print("✅ All services started successfully!")
    yield
    
    # Cleanup
    print("🔄 Shutting down services...")
    await ai_monitor.stop()
    await camera_service.stop()
    print("✅ Shutdown complete!")

# Create FastAPI app
app = FastAPI(
    title="HexWard API",
    description="AI-Powered Hospital Monitoring System",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# OAuth2 scheme
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="auth/token")

# Include routers
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(patients.router, prefix="/api/patients", tags=["Patients"])
app.include_router(alerts.router, prefix="/api/alerts", tags=["Alerts"])
app.include_router(cameras.router, prefix="/api/cameras", tags=["Cameras"])
app.include_router(ip_cameras.router, prefix="/api/ip-cameras", tags=["IP Cameras"])
app.include_router(analytics.router, prefix="/api/analytics", tags=["Analytics"])

# Serve static files (for uploaded images, etc.)
os.makedirs("static", exist_ok=True)
app.mount("/static", StaticFiles(directory="static"), name="static")

@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "message": "HexWard AI Hospital Monitoring System",
        "version": "1.0.0",
        "status": "operational",
        "services": {
            "ai_monitor": ai_monitor.is_running(),
            "camera_service": camera_service.is_running(),
            "gpt_service": gpt_service.is_available(),
            "websocket": True
        }
    }

@app.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    """WebSocket endpoint for real-time communication"""
    await websocket_manager.connect(websocket, client_id)
    try:
        while True:
            # Keep connection alive and handle incoming messages
            data = await websocket.receive_text()
            
            # Process incoming commands
            if data == "ping":
                await websocket_manager.send_personal_message("pong", client_id)
            elif data == "get_live_data":
                # Send current live data
                live_data = await ai_monitor.get_current_status()
                await websocket_manager.send_personal_message(live_data, client_id)
                
    except WebSocketDisconnect:
        websocket_manager.disconnect(client_id)

@app.get("/api/status")
async def get_system_status():
    """Get comprehensive system status"""
    return {
        "timestamp": ai_monitor.get_current_time(),
        "services": {
            "ai_monitor": {
                "running": ai_monitor.is_running(),
                "detections_count": await ai_monitor.get_detection_count(),
                "last_analysis": await ai_monitor.get_last_analysis_time()
            },
            "camera_service": {
                "running": camera_service.is_running(),
                "active_cameras": await camera_service.get_active_camera_count(),
                "total_cameras": await camera_service.get_total_camera_count()
            },
            "gpt_service": {
                "available": gpt_service.is_available(),
                "last_summary": await gpt_service.get_last_summary_time()
            }
        },
        "hospital": {
            "name": settings.HOSPITAL_NAME,
            "timezone": settings.HOSPITAL_TIMEZONE
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )