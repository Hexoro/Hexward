"""
Cameras router for camera management and live feeds
"""
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Response
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import database_models as db_models
from app.models.schemas import Camera, CameraCreate, CameraUpdate, Detection, LiveFeedData
from app.routers.auth import get_current_user

router = APIRouter()

# Global camera service reference (will be injected)
camera_service = None

def get_camera_service():
    """Get camera service instance"""
    global camera_service
    if camera_service is None:
        from app.services.camera_service import CameraService
        camera_service = CameraService()
    return camera_service

@router.get("/", response_model=List[Camera])
async def get_cameras(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get all cameras"""
    cameras = db.query(db_models.Camera).offset(skip).limit(limit).all()
    return cameras

@router.post("/", response_model=Camera)
async def create_camera(
    camera: CameraCreate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Create a new camera"""
    # Only admin can create cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can create cameras")
    
    db_camera = db_models.Camera(
        name=camera.name,
        room=camera.room,
        camera_index=camera.camera_index,
        rtsp_url=camera.rtsp_url
    )
    
    db.add(db_camera)
    db.commit()
    db.refresh(db_camera)
    
    # Add to camera service
    camera_svc = get_camera_service()
    success = await camera_svc.add_camera(db_camera)
    
    if not success:
        # Rollback database if camera service failed
        db.delete(db_camera)
        db.commit()
        raise HTTPException(status_code=400, detail="Failed to initialize camera")
    
    return db_camera

@router.get("/{camera_id}", response_model=Camera)
async def get_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get a specific camera"""
    camera = db.query(db_models.Camera).filter(db_models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    return camera

@router.put("/{camera_id}", response_model=Camera)
async def update_camera(
    camera_id: str,
    camera_update: CameraUpdate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Update a camera"""
    # Only admin can update cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can update cameras")
    
    camera = db.query(db_models.Camera).filter(db_models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Update fields
    update_data = camera_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        setattr(camera, field, value)
    
    db.commit()
    db.refresh(camera)
    
    # Update camera service if needed
    camera_svc = get_camera_service()
    await camera_svc.update_camera_status(camera_id, camera.status)
    
    return camera

@router.delete("/{camera_id}")
async def delete_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Delete a camera"""
    # Only admin can delete cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can delete cameras")
    
    camera = db.query(db_models.Camera).filter(db_models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    # Remove from camera service
    camera_svc = get_camera_service()
    await camera_svc.remove_camera(camera_id)
    
    # Delete from database
    db.delete(camera)
    db.commit()
    
    return {"message": "Camera deleted successfully"}

@router.get("/{camera_id}/frame")
async def get_camera_frame(
    camera_id: str,
    annotated: bool = False,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get current frame from camera"""
    # Verify camera exists
    camera = db.query(db_models.Camera).filter(db_models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    camera_svc = get_camera_service()
    
    if annotated:
        frame_data, detections = await camera_svc.get_camera_frame_with_detections(camera_id)
        if frame_data is None:
            raise HTTPException(status_code=503, detail="Camera not available")
        
        return {
            "camera_id": camera_id,
            "frame_data": frame_data,
            "detections": [d.dict() for d in detections],
            "timestamp": camera.last_frame_time
        }
    else:
        frame_data = await camera_svc.get_camera_frame(camera_id)
        if frame_data is None:
            raise HTTPException(status_code=503, detail="Camera not available")
        
        return {
            "camera_id": camera_id,
            "frame_data": frame_data,
            "timestamp": camera.last_frame_time
        }

@router.get("/{camera_id}/detections", response_model=List[Detection])
async def get_camera_detections(
    camera_id: str,
    skip: int = 0,
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get recent detections from a camera"""
    detections = db.query(db_models.Detection).filter(
        db_models.Detection.camera_id == camera_id
    ).order_by(db_models.Detection.timestamp.desc()).offset(skip).limit(limit).all()
    
    return detections

@router.post("/{camera_id}/start")
async def start_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Start camera processing"""
    # Only admin can control cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can control cameras")
    
    camera = db.query(db_models.Camera).filter(db_models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    camera_svc = get_camera_service()
    success = await camera_svc.add_camera(camera)
    
    if success:
        camera.status = "active"
        db.commit()
        return {"message": "Camera started successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to start camera")

@router.post("/{camera_id}/stop")
async def stop_camera(
    camera_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Stop camera processing"""
    # Only admin can control cameras
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can control cameras")
    
    camera = db.query(db_models.Camera).filter(db_models.Camera.id == camera_id).first()
    if camera is None:
        raise HTTPException(status_code=404, detail="Camera not found")
    
    camera_svc = get_camera_service()
    success = await camera_svc.remove_camera(camera_id)
    
    if success:
        camera.status = "offline"
        db.commit()
        return {"message": "Camera stopped successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to stop camera")

@router.get("/room/{room_name}")
async def get_room_cameras(
    room_name: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get all cameras in a specific room"""
    cameras = db.query(db_models.Camera).filter(db_models.Camera.room == room_name).all()
    return cameras

@router.get("/stats/summary")
async def get_camera_stats(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get camera statistics summary"""
    total_cameras = db.query(db_models.Camera).count()
    active_cameras = db.query(db_models.Camera).filter(db_models.Camera.status == "active").count()
    offline_cameras = db.query(db_models.Camera).filter(db_models.Camera.status == "offline").count()
    
    camera_svc = get_camera_service()
    processing_cameras = await camera_svc.get_active_camera_count()
    
    return {
        "total_cameras": total_cameras,
        "active_cameras": active_cameras,
        "offline_cameras": offline_cameras,
        "processing_cameras": processing_cameras
    }