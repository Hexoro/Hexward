"""
YOLO Service for real-time object detection using YOLOv8
"""
import asyncio
import numpy as np
from typing import List, Optional
from datetime import datetime
import cv2

try:
    from ultralytics import YOLO
    YOLO_AVAILABLE = True
except ImportError:
    YOLO_AVAILABLE = False
    print("⚠️ Ultralytics YOLO not available. Install with: pip install ultralytics")

from app.config import get_settings
from app.models.schemas import Detection, BoundingBox

settings = get_settings()

class YOLOService:
    """Service for YOLOv8 object detection"""
    
    def __init__(self):
        self.model = None
        self.is_initialized = False
        self.detection_classes = [
            "person", "bicycle", "car", "motorcycle", "airplane", "bus", "train", "truck", "boat",
            "traffic light", "fire hydrant", "stop sign", "parking meter", "bench", "bird", "cat",
            "dog", "horse", "sheep", "cow", "elephant", "bear", "zebra", "giraffe", "backpack",
            "umbrella", "handbag", "tie", "suitcase", "frisbee", "skis", "snowboard", "sports ball",
            "kite", "baseball bat", "baseball glove", "skateboard", "surfboard", "tennis racket",
            "bottle", "wine glass", "cup", "fork", "knife", "spoon", "bowl", "banana", "apple",
            "sandwich", "orange", "broccoli", "carrot", "hot dog", "pizza", "donut", "cake",
            "chair", "couch", "potted plant", "bed", "dining table", "toilet", "tv", "laptop",
            "mouse", "remote", "keyboard", "cell phone", "microwave", "oven", "toaster", "sink",
            "refrigerator", "book", "clock", "vase", "scissors", "teddy bear", "hair drier", "toothbrush"
        ]
    
    async def initialize(self):
        """Initialize YOLO model"""
        if not YOLO_AVAILABLE:
            print("❌ YOLO initialization failed - ultralytics not available")
            return False
        
        try:
            print("🤖 Initializing YOLO model...")
            
            # Load YOLOv8 model (will download if not present)
            self.model = YOLO(settings.YOLO_MODEL_PATH)
            
            # Warm up the model with a dummy image
            dummy_image = np.zeros((640, 640, 3), dtype=np.uint8)
            _ = self.model(dummy_image, verbose=False)
            
            self.is_initialized = True
            print("✅ YOLO model initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ YOLO initialization error: {e}")
            return False
    
    def is_available(self) -> bool:
        """Check if YOLO service is available"""
        return self.is_initialized and self.model is not None
    
    async def detect_objects(self, frame: np.ndarray) -> List[Detection]:
        """Detect objects in a frame using YOLO"""
        if not self.is_available():
            return []
        
        try:
            # Run YOLO inference
            results = self.model(frame, verbose=False)
            
            detections = []
            
            for result in results:
                boxes = result.boxes
                if boxes is not None:
                    for box in boxes:
                        # Extract detection data
                        x1, y1, x2, y2 = box.xyxy[0].cpu().numpy()
                        confidence = float(box.conf[0].cpu().numpy())
                        class_id = int(box.cls[0].cpu().numpy())
                        
                        # Skip low confidence detections
                        if confidence < settings.DETECTION_CONFIDENCE_THRESHOLD:
                            continue
                        
                        # Get class name
                        class_name = self.detection_classes[class_id] if class_id < len(self.detection_classes) else "unknown"
                        
                        # Convert to normalized coordinates
                        h, w = frame.shape[:2]
                        norm_x = x1 / w
                        norm_y = y1 / h
                        norm_width = (x2 - x1) / w
                        norm_height = (y2 - y1) / h
                        
                        # Create detection object
                        detection = Detection(
                            id="",  # Will be set when saved to database
                            camera_id="",  # Will be set by caller
                            detection_type=self._classify_detection(class_name, confidence),
                            confidence=confidence,
                            bounding_box=BoundingBox(
                                x=norm_x,
                                y=norm_y,
                                width=norm_width,
                                height=norm_height
                            ),
                            metadata={
                                "yolo_class": class_name,
                                "yolo_class_id": class_id,
                                "bbox_pixels": [int(x1), int(y1), int(x2), int(y2)]
                            },
                            timestamp=datetime.utcnow()
                        )
                        
                        detections.append(detection)
            
            return detections
            
        except Exception as e:
            print(f"Error in YOLO detection: {e}")
            return []
    
    async def detect_medical_events(self, frame: np.ndarray, previous_detections: List[Detection] = None) -> List[Detection]:
        """Specialized detection for medical events (falls, emergencies)"""
        if not self.is_available():
            return []
        
        try:
            # Get standard detections
            detections = await self.detect_objects(frame)
            
            # Filter for people
            person_detections = [d for d in detections if "person" in d.detection_type]
            
            medical_events = []
            
            for detection in person_detections:
                # Analyze person position and movement
                bbox = detection.bounding_box
                
                # Simple fall detection based on aspect ratio
                aspect_ratio = bbox.width / bbox.height
                
                if aspect_ratio > 1.5:  # Person is more horizontal than vertical
                    fall_detection = Detection(
                        id="",
                        camera_id="",
                        detection_type="fall_detected",
                        confidence=detection.confidence * 0.8,  # Reduce confidence for derived detection
                        bounding_box=bbox,
                        metadata={
                            "event_type": "potential_fall",
                            "aspect_ratio": aspect_ratio,
                            "base_detection": detection.metadata
                        },
                        timestamp=datetime.utcnow()
                    )
                    medical_events.append(fall_detection)
                
                # Check for stationary person (possible collapse)
                if previous_detections:
                    # Simple implementation - in production would track across frames
                    stationary_detection = Detection(
                        id="",
                        camera_id="",
                        detection_type="person_stationary",
                        confidence=detection.confidence,
                        bounding_box=bbox,
                        metadata={
                            "event_type": "stationary_monitoring",
                            "duration_estimate": "unknown"
                        },
                        timestamp=datetime.utcnow()
                    )
                    medical_events.append(stationary_detection)
            
            return medical_events
            
        except Exception as e:
            print(f"Error in medical event detection: {e}")
            return []
    
    def _classify_detection(self, yolo_class: str, confidence: float) -> str:
        """Classify YOLO detection into medical context"""
        if yolo_class == "person":
            if confidence > 0.8:
                return "person_high_confidence"
            else:
                return "person_detected"
        elif yolo_class in ["chair", "bed", "couch"]:
            return f"furniture_{yolo_class}"
        elif yolo_class in ["bottle", "cup", "bowl"]:
            return f"medical_item_{yolo_class}"
        else:
            return f"object_{yolo_class}"
    
    async def analyze_room_occupancy(self, frame: np.ndarray) -> dict:
        """Analyze room occupancy and activity level"""
        detections = await self.detect_objects(frame)
        
        person_count = len([d for d in detections if "person" in d.detection_type])
        
        # Calculate activity level based on number and type of detections
        activity_score = min(len(detections) / 10.0, 1.0)  # Normalize to 0-1
        
        return {
            "person_count": person_count,
            "total_objects": len(detections),
            "activity_level": activity_score,
            "objects_detected": [d.detection_type for d in detections]
        }