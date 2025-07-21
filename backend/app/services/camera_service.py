"""
Camera Service for video capture and real-time processing
"""
import asyncio
import cv2
import base64
import io
import os
from datetime import datetime
from typing import Dict, List, Optional, Tuple
import numpy as np
from PIL import Image

from app.config import get_settings
from app.models.schemas import Camera, Detection, BoundingBox
from app.services.yolo_service import YOLOService

settings = get_settings()

class CameraService:
    """Service for camera management and video processing"""
    
    def __init__(self):
        self.active_cameras: Dict[str, cv2.VideoCapture] = {}
        self.camera_configs: Dict[str, Camera] = {}
        self.is_running_flag = False
        self.processing_tasks: Dict[str, asyncio.Task] = {}
        self.yolo_service = YOLOService()
        self.frame_save_dir = "static/frames"
        
        # Create directories
        os.makedirs(self.frame_save_dir, exist_ok=True)
        os.makedirs("static/detections", exist_ok=True)
    
    async def start(self):
        """Start camera service"""
        print("🎥 Starting Camera Service...")
        self.is_running_flag = True
        
        # Initialize YOLO
        await self.yolo_service.initialize()
        
        # Start with default camera if available
        await self.add_default_camera()
        
        print("✅ Camera Service started")
    
    async def stop(self):
        """Stop camera service"""
        print("🔄 Stopping Camera Service...")
        self.is_running_flag = False
        
        # Stop all processing tasks
        for task in self.processing_tasks.values():
            task.cancel()
        
        # Release all cameras
        for cap in self.active_cameras.values():
            cap.release()
        
        self.active_cameras.clear()
        self.processing_tasks.clear()
        
        print("✅ Camera Service stopped")
    
    def is_running(self) -> bool:
        """Check if service is running"""
        return self.is_running_flag
    
    async def get_active_camera_count(self) -> int:
        """Get number of active cameras"""
        return len(self.active_cameras)
    
    async def get_total_camera_count(self) -> int:
        """Get total registered cameras"""
        return len(self.camera_configs)
    
    async def add_camera(self, camera: Camera) -> bool:
        """Add and start a new camera"""
        try:
            if camera.camera_index is not None:
                # Local camera (webcam, USB camera)
                cap = cv2.VideoCapture(camera.camera_index)
            elif camera.rtsp_url:
                # IP camera
                cap = cv2.VideoCapture(camera.rtsp_url)
            else:
                print(f"❌ No camera source specified for {camera.name}")
                return False
            
            # Test camera connection
            ret, frame = cap.read()
            if not ret:
                print(f"❌ Failed to connect to camera {camera.name}")
                cap.release()
                return False
            
            # Configure camera
            cap.set(cv2.CAP_PROP_FRAME_WIDTH, settings.CAMERA_RESOLUTION_WIDTH)
            cap.set(cv2.CAP_PROP_FRAME_HEIGHT, settings.CAMERA_RESOLUTION_HEIGHT)
            cap.set(cv2.CAP_PROP_FPS, settings.CAMERA_FRAME_RATE)
            
            # Store camera
            self.active_cameras[camera.id] = cap
            self.camera_configs[camera.id] = camera
            
            # Start processing task
            if camera.detection_enabled:
                task = asyncio.create_task(self._process_camera_feed(camera.id))
                self.processing_tasks[camera.id] = task
            
            print(f"✅ Camera {camera.name} added successfully")
            return True
            
        except Exception as e:
            print(f"❌ Error adding camera {camera.name}: {e}")
            return False
    
    async def remove_camera(self, camera_id: str) -> bool:
        """Remove a camera"""
        try:
            # Stop processing task
            if camera_id in self.processing_tasks:
                self.processing_tasks[camera_id].cancel()
                del self.processing_tasks[camera_id]
            
            # Release camera
            if camera_id in self.active_cameras:
                self.active_cameras[camera_id].release()
                del self.active_cameras[camera_id]
            
            # Remove config
            if camera_id in self.camera_configs:
                del self.camera_configs[camera_id]
            
            print(f"✅ Camera {camera_id} removed")
            return True
            
        except Exception as e:
            print(f"❌ Error removing camera {camera_id}: {e}")
            return False
    
    async def get_camera_frame(self, camera_id: str, encode_base64: bool = True) -> Optional[str]:
        """Get current frame from camera"""
        if camera_id not in self.active_cameras:
            return None
        
        try:
            cap = self.active_cameras[camera_id]
            ret, frame = cap.read()
            
            if not ret:
                return None
            
            if encode_base64:
                # Encode frame as base64 JPEG
                _, buffer = cv2.imencode('.jpg', frame, [cv2.IMWRITE_JPEG_QUALITY, 80])
                frame_b64 = base64.b64encode(buffer).decode('utf-8')
                return frame_b64
            else:
                return frame
                
        except Exception as e:
            print(f"Error getting frame from camera {camera_id}: {e}")
            return None
    
    async def get_camera_frame_with_detections(self, camera_id: str) -> Optional[Tuple[str, List[Detection]]]:
        """Get frame with AI detections overlaid"""
        if camera_id not in self.active_cameras:
            return None, []
        
        try:
            cap = self.active_cameras[camera_id]
            ret, frame = cap.read()
            
            if not ret:
                return None, []
            
            # Run YOLO detection
            detections = await self.yolo_service.detect_objects(frame)
            
            # Draw detections on frame
            annotated_frame = self._draw_detections(frame, detections)
            
            # Encode as base64
            _, buffer = cv2.imencode('.jpg', annotated_frame, [cv2.IMWRITE_JPEG_QUALITY, 85])
            frame_b64 = base64.b64encode(buffer).decode('utf-8')
            
            return frame_b64, detections
            
        except Exception as e:
            print(f"Error getting annotated frame from camera {camera_id}: {e}")
            return None, []
    
    async def _process_camera_feed(self, camera_id: str):
        """Background task to process camera feed"""
        print(f"🎥 Starting processing for camera {camera_id}")
        
        while self.is_running_flag and camera_id in self.active_cameras:
            try:
                # Get frame
                cap = self.active_cameras[camera_id]
                ret, frame = cap.read()
                
                if not ret:
                    print(f"⚠️ No frame from camera {camera_id}")
                    await asyncio.sleep(1)
                    continue
                
                # Run object detection
                detections = await self.yolo_service.detect_objects(frame)
                
                # Process significant detections
                significant_detections = [
                    d for d in detections 
                    if d.confidence > settings.DETECTION_CONFIDENCE_THRESHOLD
                ]
                
                if significant_detections:
                    # Save frame with detections
                    frame_path = await self._save_detection_frame(frame, significant_detections, camera_id)
                    
                    # Here you would typically:
                    # 1. Save detections to database
                    # 2. Trigger alerts if needed
                    # 3. Send real-time updates via WebSocket
                    
                    print(f"🔍 {len(significant_detections)} detections in {camera_id}")
                
                # Control frame rate
                await asyncio.sleep(1.0 / settings.CAMERA_FRAME_RATE)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error processing camera {camera_id}: {e}")
                await asyncio.sleep(1)
        
        print(f"🔄 Stopped processing camera {camera_id}")
    
    async def _save_detection_frame(self, frame: np.ndarray, detections: List[Detection], camera_id: str) -> str:
        """Save frame with detections for later analysis"""
        try:
            timestamp = datetime.utcnow().strftime("%Y%m%d_%H%M%S")
            filename = f"{camera_id}_{timestamp}_detections.jpg"
            filepath = os.path.join("static/detections", filename)
            
            # Draw detections
            annotated_frame = self._draw_detections(frame, detections)
            
            # Save frame
            cv2.imwrite(filepath, annotated_frame)
            
            return filepath
            
        except Exception as e:
            print(f"Error saving detection frame: {e}")
            return ""
    
    def _draw_detections(self, frame: np.ndarray, detections: List[Detection]) -> np.ndarray:
        """Draw detection bounding boxes and labels on frame"""
        annotated_frame = frame.copy()
        
        for detection in detections:
            bbox = detection.bounding_box
            
            # Convert normalized coordinates to pixel coordinates
            h, w = frame.shape[:2]
            x1 = int(bbox.x * w)
            y1 = int(bbox.y * h)
            x2 = int((bbox.x + bbox.width) * w)
            y2 = int((bbox.y + bbox.height) * h)
            
            # Choose color based on detection type
            if detection.detection_type == "person":
                color = (0, 255, 0)  # Green
            elif "fall" in detection.detection_type.lower():
                color = (0, 0, 255)  # Red
            else:
                color = (255, 0, 0)  # Blue
            
            # Draw bounding box
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            
            # Draw label
            label = f"{detection.detection_type}: {detection.confidence:.2f}"
            cv2.putText(
                annotated_frame, label, (x1, y1 - 10),
                cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2
            )
        
        return annotated_frame
    
    async def add_default_camera(self):
        """Add default camera (index 0) if available"""
        try:
            # Test if default camera exists
            test_cap = cv2.VideoCapture(settings.DEFAULT_CAMERA_INDEX)
            ret, _ = test_cap.read()
            test_cap.release()
            
            if ret:
                from app.models.schemas import Camera, CameraStatus
                default_camera = Camera(
                    id="default_camera",
                    name="Default Camera",
                    room="GENERAL",
                    camera_index=settings.DEFAULT_CAMERA_INDEX,
                    status=CameraStatus.ACTIVE,
                    detection_enabled=True,
                    recording_enabled=False,
                    created_at=datetime.utcnow()
                )
                
                await self.add_camera(default_camera)
                print("✅ Default camera added")
            else:
                print("ℹ️ No default camera available")
                
        except Exception as e:
            print(f"ℹ️ Could not add default camera: {e}")
    
    async def get_all_cameras(self) -> List[Camera]:
        """Get all registered cameras"""
        return list(self.camera_configs.values())
    
    async def update_camera_status(self, camera_id: str, status: str) -> bool:
        """Update camera status"""
        if camera_id in self.camera_configs:
            self.camera_configs[camera_id].status = status
            return True
        return False