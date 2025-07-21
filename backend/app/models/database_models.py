"""
SQLAlchemy database models for HexWard
"""
from sqlalchemy import Column, Integer, String, Float, DateTime, Boolean, Text, ForeignKey, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base
import uuid

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String, unique=True, index=True, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False)  # doctor, nurse, admin
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

class Patient(Base):
    __tablename__ = "patients"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    age = Column(Integer)
    room = Column(String, nullable=False, index=True)
    status = Column(String, default="stable")  # stable, critical, monitoring
    admission_date = Column(DateTime(timezone=True), server_default=func.now())
    conditions = Column(JSON)  # List of medical conditions
    vitals = Column(JSON)  # Current vital signs
    ai_summary = Column(Text)  # GPT-generated summary
    last_updated = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    events = relationship("PatientEvent", back_populates="patient", cascade="all, delete-orphan")
    alerts = relationship("Alert", back_populates="patient")

class PatientEvent(Base):
    __tablename__ = "patient_events"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    patient_id = Column(String, ForeignKey("patients.id"), nullable=False)
    event_type = Column(String, nullable=False)  # medication, vitals, movement, etc.
    description = Column(Text)
    metadata = Column(JSON)  # Additional event data
    source = Column(String)  # camera, manual, sensor, etc.
    confidence = Column(Float)  # AI confidence score
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="events")

class Camera(Base):
    __tablename__ = "cameras"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    name = Column(String, nullable=False)
    room = Column(String, nullable=False, index=True)
    camera_index = Column(Integer)  # For local cameras
    rtsp_url = Column(String)  # For IP cameras
    status = Column(String, default="active")  # active, offline, maintenance
    last_frame_time = Column(DateTime(timezone=True))
    detection_enabled = Column(Boolean, default=True)
    recording_enabled = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    detections = relationship("Detection", back_populates="camera")

class Detection(Base):
    __tablename__ = "detections"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    camera_id = Column(String, ForeignKey("cameras.id"), nullable=False)
    detection_type = Column(String, nullable=False)  # person, fall, medical_event, etc.
    confidence = Column(Float, nullable=False)
    bounding_box = Column(JSON)  # x, y, width, height
    frame_path = Column(String)  # Path to saved frame
    metadata = Column(JSON)  # Additional detection data
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    camera = relationship("Camera", back_populates="detections")

class Alert(Base):
    __tablename__ = "alerts"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    alert_type = Column(String, nullable=False)  # critical, warning, info
    title = Column(String, nullable=False)
    message = Column(Text, nullable=False)
    patient_id = Column(String, ForeignKey("patients.id"), nullable=True)
    room = Column(String, nullable=False)
    priority = Column(Integer, default=2)  # 1=critical, 2=warning, 3=info
    acknowledged = Column(Boolean, default=False)
    acknowledged_by = Column(String, ForeignKey("users.id"), nullable=True)
    acknowledged_at = Column(DateTime(timezone=True))
    resolved = Column(Boolean, default=False)
    resolved_by = Column(String, ForeignKey("users.id"), nullable=True)
    resolved_at = Column(DateTime(timezone=True))
    metadata = Column(JSON)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    patient = relationship("Patient", back_populates="alerts")

class SystemLog(Base):
    __tablename__ = "system_logs"
    
    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    level = Column(String, nullable=False)  # INFO, WARNING, ERROR, CRITICAL
    service = Column(String, nullable=False)  # ai_monitor, camera_service, etc.
    message = Column(Text, nullable=False)
    metadata = Column(JSON)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())