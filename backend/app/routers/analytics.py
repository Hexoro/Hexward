"""
Analytics router for system analytics and reporting
"""
from typing import List, Dict, Any
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database import get_db
from app.models import database_models as db_models
from app.models.schemas import SystemStats, CameraStats, PatientStats
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/system-stats", response_model=SystemStats)
async def get_system_stats(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get overall system statistics"""
    total_patients = db.query(db_models.Patient).count()
    critical_alerts = db.query(db_models.Alert).filter(
        db_models.Alert.alert_type == "critical",
        db_models.Alert.resolved == False
    ).count()
    active_cameras = db.query(db_models.Camera).filter(
        db_models.Camera.status == "active"
    ).count()
    
    # Calculate average response time (mock for now)
    avg_response_time = 2.3  # In real implementation, calculate from alert timestamps
    
    return SystemStats(
        total_patients=total_patients,
        critical_alerts=critical_alerts,
        active_cameras=active_cameras,
        avg_response_time=avg_response_time
    )

@router.get("/camera-stats", response_model=List[CameraStats])
async def get_camera_stats(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get statistics for all cameras"""
    cameras = db.query(db_models.Camera).all()
    stats = []
    
    for camera in cameras:
        detection_count = db.query(db_models.Detection).filter(
            db_models.Detection.camera_id == camera.id
        ).count()
        
        last_detection = db.query(db_models.Detection).filter(
            db_models.Detection.camera_id == camera.id
        ).order_by(db_models.Detection.timestamp.desc()).first()
        
        stats.append(CameraStats(
            camera_id=camera.id,
            room=camera.room,
            detections_count=detection_count,
            last_detection=last_detection.timestamp if last_detection else None
        ))
    
    return stats

@router.get("/patient-stats", response_model=List[PatientStats])
async def get_patient_stats(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get statistics for all patients"""
    patients = db.query(db_models.Patient).all()
    stats = []
    
    for patient in patients:
        events_count = db.query(db_models.PatientEvent).filter(
            db_models.PatientEvent.patient_id == patient.id
        ).count()
        
        alerts_count = db.query(db_models.Alert).filter(
            db_models.Alert.patient_id == patient.id
        ).count()
        
        last_activity = db.query(db_models.PatientEvent).filter(
            db_models.PatientEvent.patient_id == patient.id
        ).order_by(db_models.PatientEvent.timestamp.desc()).first()
        
        stats.append(PatientStats(
            patient_id=patient.id,
            name=patient.name,
            events_count=events_count,
            alerts_count=alerts_count,
            last_activity=last_activity.timestamp if last_activity else None
        ))
    
    return stats

@router.get("/alerts-timeline")
async def get_alerts_timeline(
    days: int = Query(7, description="Number of days to analyze"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get alerts timeline for the specified period"""
    start_date = datetime.utcnow() - timedelta(days=days)
    
    alerts = db.query(
        func.date(db_models.Alert.created_at).label('date'),
        db_models.Alert.alert_type,
        func.count(db_models.Alert.id).label('count')
    ).filter(
        db_models.Alert.created_at >= start_date
    ).group_by(
        func.date(db_models.Alert.created_at),
        db_models.Alert.alert_type
    ).all()
    
    # Format data for charts
    timeline_data = {}
    for alert in alerts:
        date_str = alert.date.strftime('%Y-%m-%d')
        if date_str not in timeline_data:
            timeline_data[date_str] = {'critical': 0, 'warning': 0, 'info': 0}
        timeline_data[date_str][alert.alert_type] = alert.count
    
    return {
        "period_days": days,
        "timeline": timeline_data,
        "total_alerts": sum(sum(day.values()) for day in timeline_data.values())
    }

@router.get("/detection-trends")
async def get_detection_trends(
    camera_id: str = Query(None, description="Filter by specific camera"),
    hours: int = Query(24, description="Number of hours to analyze"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get detection trends for analysis"""
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    query = db.query(
        func.strftime('%Y-%m-%d %H', db_models.Detection.timestamp).label('hour'),
        db_models.Detection.detection_type,
        func.count(db_models.Detection.id).label('count')
    ).filter(
        db_models.Detection.timestamp >= start_time
    )
    
    if camera_id:
        query = query.filter(db_models.Detection.camera_id == camera_id)
    
    detections = query.group_by(
        func.strftime('%Y-%m-%d %H', db_models.Detection.timestamp),
        db_models.Detection.detection_type
    ).all()
    
    # Format data
    trends_data = {}
    for detection in detections:
        hour = detection.hour
        if hour not in trends_data:
            trends_data[hour] = {}
        trends_data[hour][detection.detection_type] = detection.count
    
    return {
        "period_hours": hours,
        "camera_id": camera_id,
        "trends": trends_data
    }

@router.get("/room-activity")
async def get_room_activity(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get activity summary by room"""
    # Get patient count by room
    patient_counts = db.query(
        db_models.Patient.room,
        func.count(db_models.Patient.id).label('patient_count')
    ).group_by(db_models.Patient.room).all()
    
    # Get alert counts by room
    alert_counts = db.query(
        db_models.Alert.room,
        func.count(db_models.Alert.id).label('alert_count')
    ).filter(
        db_models.Alert.resolved == False
    ).group_by(db_models.Alert.room).all()
    
    # Get camera counts by room
    camera_counts = db.query(
        db_models.Camera.room,
        func.count(db_models.Camera.id).label('camera_count')
    ).filter(
        db_models.Camera.status == "active"
    ).group_by(db_models.Camera.room).all()
    
    # Combine data
    room_activity = {}
    
    for room_data in patient_counts:
        room = room_data.room
        room_activity[room] = {
            'patients': room_data.patient_count,
            'alerts': 0,
            'cameras': 0
        }
    
    for room_data in alert_counts:
        room = room_data.room
        if room not in room_activity:
            room_activity[room] = {'patients': 0, 'alerts': 0, 'cameras': 0}
        room_activity[room]['alerts'] = room_data.alert_count
    
    for room_data in camera_counts:
        room = room_data.room
        if room not in room_activity:
            room_activity[room] = {'patients': 0, 'alerts': 0, 'cameras': 0}
        room_activity[room]['cameras'] = room_data.camera_count
    
    return room_activity

@router.get("/performance-metrics")
async def get_performance_metrics(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get system performance metrics"""
    # These would be real performance metrics in production
    return {
        "system_uptime": "99.8%",
        "ai_processing_time": "0.3s",
        "detection_accuracy": "94.2%",
        "alert_response_time": "2.1min",
        "database_performance": {
            "query_time": "12ms",
            "connection_pool": "85% utilized"
        },
        "camera_performance": {
            "frame_rate": "30fps",
            "processing_delay": "150ms",
            "error_rate": "0.1%"
        }
    }

@router.get("/shift-report")
async def generate_shift_report(
    hours: int = Query(8, description="Shift duration in hours"),
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Generate shift handover report"""
    from app.services.gpt_service import GPTService
    
    start_time = datetime.utcnow() - timedelta(hours=hours)
    
    # Get patients
    patients = db.query(db_models.Patient).all()
    
    # Get alerts from this shift
    alerts = db.query(db_models.Alert).filter(
        db_models.Alert.created_at >= start_time
    ).order_by(db_models.Alert.created_at.desc()).all()
    
    # Generate AI summary
    gpt_service = GPTService()
    summary = await gpt_service.generate_shift_summary(patients, alerts, hours)
    
    return {
        "shift_duration_hours": hours,
        "report_generated_at": datetime.utcnow().isoformat(),
        "summary": summary,
        "statistics": {
            "total_patients": len(patients),
            "critical_patients": len([p for p in patients if p.status == "critical"]),
            "total_alerts": len(alerts),
            "critical_alerts": len([a for a in alerts if a.alert_type == "critical"]),
            "unresolved_alerts": len([a for a in alerts if not a.resolved])
        }
    }