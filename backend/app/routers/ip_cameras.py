"""
IP Camera detection and management router
"""
from typing import List, Dict, Optional
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import database_models as db_models
from app.routers.auth import get_current_user
from app.services.ip_camera_service import IPCameraDetector

router = APIRouter()

# Global IP camera detector instance
detector = IPCameraDetector()

class NetworkScanRequest(BaseModel):
    network: str = "192.168.1.0/24"

class CameraTestRequest(BaseModel):
    rtsp_url: str
    username: Optional[str] = ""
    password: Optional[str] = ""

class CameraAddRequest(BaseModel):
    ip: str
    name: str
    room: str
    rtsp_url: str
    username: Optional[str] = ""
    password: Optional[str] = ""

@router.post("/scan")
async def scan_network_for_cameras(
    request: NetworkScanRequest,
    current_user: db_models.User = Depends(get_current_user)
):
    """Scan network for IP cameras"""
    # Only admin can scan for cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can scan for cameras")
    
    try:
        cameras = await detector.scan_network_for_cameras(request.network)
        return {
            "success": True,
            "cameras_found": len(cameras),
            "cameras": [
                {
                    "ip": cam.ip,
                    "port": cam.port,
                    "brand": cam.brand,
                    "model": cam.model,
                    "rtsp_url": cam.rtsp_url,
                    "status": cam.status
                }
                for cam in cameras
            ]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Scan failed: {str(e)}")

@router.get("/info/{ip}")
async def get_camera_info(
    ip: str,
    current_user: db_models.User = Depends(get_current_user)
):
    """Get detailed information about a detected camera"""
    camera_info = await detector.get_camera_info(ip)
    if not camera_info:
        raise HTTPException(status_code=404, detail="Camera not found in scan results")
    
    return camera_info

@router.post("/test")
async def test_camera_stream(
    request: CameraTestRequest,
    current_user: db_models.User = Depends(get_current_user)
):
    """Test camera stream connection"""
    # Only admin can test cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can test cameras")
    
    try:
        success, message = await detector.test_camera_stream(
            request.rtsp_url, 
            request.username, 
            request.password
        )
        return {
            "success": success,
            "message": message
        }
    except Exception as e:
        return {
            "success": False,
            "message": f"Test failed: {str(e)}"
        }

@router.post("/add")
async def add_ip_camera(
    request: CameraAddRequest,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Add an IP camera to the system"""
    # Only admin can add cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can add cameras")
    
    # Test connection first
    success, message = await detector.test_camera_stream(
        request.rtsp_url, 
        request.username, 
        request.password
    )
    
    if not success:
        raise HTTPException(status_code=400, detail=f"Camera connection failed: {message}")
    
    # Create camera in database
    db_camera = db_models.Camera(
        name=request.name,
        room=request.room,
        rtsp_url=request.rtsp_url,
        camera_type="ip",
        status="active"
    )
    
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    
    return {
        "success": True,
        "camera_id": str(db_camera.id),
        "message": "Camera added successfully"
    }

@router.get("/raspberry-pi/setup")
async def get_raspberry_pi_setup():
    """Get Raspberry Pi camera setup guide"""
    return detector.get_raspberry_pi_setup_guide()

@router.get("/supported-brands")
async def get_supported_brands():
    """Get list of supported camera brands"""
    return {
        "brands": [
            {
                "name": "Hikvision",
                "rtsp_path": "/Streaming/Channels/101/",
                "default_port": 554
            },
            {
                "name": "Dahua", 
                "rtsp_path": "/cam/realmonitor?channel=1&subtype=0",
                "default_port": 554
            },
            {
                "name": "Axis",
                "rtsp_path": "/axis-media/media.amp",
                "default_port": 554
            },
            {
                "name": "Foscam",
                "rtsp_path": "/videoMain",
                "default_port": 554
            },
            {
                "name": "Raspberry Pi",
                "rtsp_path": "http://PI_IP:8081/",
                "default_port": 8081,
                "notes": "Requires motion software installation"
            },
            {
                "name": "Generic ONVIF",
                "rtsp_path": "/onvif1",
                "default_port": 554
            }
        ]
    }