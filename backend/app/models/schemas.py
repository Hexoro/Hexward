"""
Pydantic schemas for API request/response models
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum

# Authentication Schemas
class UserRole(str, Enum):
    DOCTOR = "doctor"
    NURSE = "nurse"
    ADMIN = "admin"

class UserBase(BaseModel):
    username: str
    email: str
    role: UserRole

class UserCreate(UserBase):
    password: str

class User(UserBase):
    id: str
    is_active: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

# Patient Schemas
class PatientStatus(str, Enum):
    STABLE = "stable"
    CRITICAL = "critical"
    MONITORING = "monitoring"

class VitalSigns(BaseModel):
    heart_rate: Optional[int] = None
    blood_pressure: Optional[str] = None
    temperature: Optional[float] = None
    oxygen_saturation: Optional[int] = None
    respiratory_rate: Optional[int] = None

class PatientBase(BaseModel):
    name: str
    age: Optional[int] = None
    room: str
    conditions: Optional[List[str]] = []
    vitals: Optional[VitalSigns] = None

class PatientCreate(PatientBase):
    pass

class PatientUpdate(BaseModel):
    name: Optional[str] = None
    age: Optional[int] = None
    room: Optional[str] = None
    status: Optional[PatientStatus] = None
    conditions: Optional[List[str]] = None
    vitals: Optional[VitalSigns] = None

class Patient(PatientBase):
    id: str
    status: PatientStatus
    admission_date: datetime
    ai_summary: Optional[str] = None
    last_updated: datetime
    
    class Config:
        from_attributes = True

# Event Schemas
class EventType(str, Enum):
    MEDICATION = "medication"
    VITALS = "vitals"
    MOVEMENT = "movement"
    FALL = "fall"
    VISITOR = "visitor"
    SYSTEM = "system"

class PatientEventBase(BaseModel):
    event_type: EventType
    description: str
    metadata: Optional[Dict[str, Any]] = {}
    source: Optional[str] = "manual"
    confidence: Optional[float] = None

class PatientEventCreate(PatientEventBase):
    patient_id: str

class PatientEvent(PatientEventBase):
    id: str
    patient_id: str
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Camera Schemas
class CameraStatus(str, Enum):
    ACTIVE = "active"
    OFFLINE = "offline"
    MAINTENANCE = "maintenance"

class CameraBase(BaseModel):
    name: str
    room: str
    camera_index: Optional[int] = None
    rtsp_url: Optional[str] = None

class CameraCreate(CameraBase):
    pass

class CameraUpdate(BaseModel):
    name: Optional[str] = None
    room: Optional[str] = None
    status: Optional[CameraStatus] = None
    detection_enabled: Optional[bool] = None
    recording_enabled: Optional[bool] = None

class Camera(CameraBase):
    id: str
    status: CameraStatus
    last_frame_time: Optional[datetime] = None
    detection_enabled: bool
    recording_enabled: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# Detection Schemas
class BoundingBox(BaseModel):
    x: float
    y: float
    width: float
    height: float

class DetectionBase(BaseModel):
    detection_type: str
    confidence: float
    bounding_box: BoundingBox
    metadata: Optional[Dict[str, Any]] = {}

class DetectionCreate(DetectionBase):
    camera_id: str
    frame_path: Optional[str] = None

class Detection(DetectionBase):
    id: str
    camera_id: str
    frame_path: Optional[str] = None
    timestamp: datetime
    
    class Config:
        from_attributes = True

# Alert Schemas
class AlertType(str, Enum):
    CRITICAL = "critical"
    WARNING = "warning"
    INFO = "info"

class AlertBase(BaseModel):
    alert_type: AlertType
    title: str
    message: str
    room: str
    patient_id: Optional[str] = None
    priority: int = Field(default=2, ge=1, le=3)
    metadata: Optional[Dict[str, Any]] = {}

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    acknowledged: Optional[bool] = None
    resolved: Optional[bool] = None

class Alert(AlertBase):
    id: str
    acknowledged: bool
    acknowledged_by: Optional[str] = None
    acknowledged_at: Optional[datetime] = None
    resolved: bool
    resolved_by: Optional[str] = None
    resolved_at: Optional[datetime] = None
    created_at: datetime
    
    class Config:
        from_attributes = True

# Analytics Schemas
class SystemStats(BaseModel):
    total_patients: int
    critical_alerts: int
    active_cameras: int
    avg_response_time: float

class CameraStats(BaseModel):
    camera_id: str
    room: str
    detections_count: int
    last_detection: Optional[datetime] = None

class PatientStats(BaseModel):
    patient_id: str
    name: str
    events_count: int
    alerts_count: int
    last_activity: Optional[datetime] = None

# Live Data Schemas
class LiveFeedData(BaseModel):
    camera_id: str
    room: str
    image_data: Optional[str] = None  # Base64 encoded image
    detections: List[Detection] = []
    timestamp: datetime

class LiveSystemStatus(BaseModel):
    timestamp: datetime
    patients: List[Patient]
    cameras: List[Camera]
    recent_alerts: List[Alert]
    system_stats: SystemStats