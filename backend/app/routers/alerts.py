"""
Alerts router for alert management endpoints
"""
from typing import List, Optional
from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import database_models as db_models
from app.models.schemas import Alert, AlertCreate, AlertUpdate, AlertType
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Alert])
async def get_alerts(
    skip: int = 0,
    limit: int = 100,
    alert_type: Optional[AlertType] = None,
    acknowledged: Optional[bool] = None,
    resolved: Optional[bool] = None,
    room: Optional[str] = None,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get alerts with optional filtering"""
    query = db.query(db_models.Alert)
    
    if alert_type:
        query = query.filter(db_models.Alert.alert_type == alert_type.value)
    if acknowledged is not None:
        query = query.filter(db_models.Alert.acknowledged == acknowledged)
    if resolved is not None:
        query = query.filter(db_models.Alert.resolved == resolved)
    if room:
        query = query.filter(db_models.Alert.room == room)
    
    alerts = query.order_by(db_models.Alert.created_at.desc()).offset(skip).limit(limit).all()
    return alerts

@router.post("/", response_model=Alert)
async def create_alert(
    alert: AlertCreate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Create a new alert"""
    db_alert = db_models.Alert(
        alert_type=alert.alert_type.value,
        title=alert.title,
        message=alert.message,
        room=alert.room,
        patient_id=alert.patient_id,
        priority=alert.priority,
        metadata=alert.metadata
    )
    
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    
    # TODO: Send real-time notification via WebSocket
    
    return db_alert

@router.get("/{alert_id}", response_model=Alert)
async def get_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get a specific alert"""
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    return alert

@router.put("/{alert_id}", response_model=Alert)
async def update_alert(
    alert_id: str,
    alert_update: AlertUpdate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Update an alert (acknowledge or resolve)"""
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    # Update acknowledgment
    if alert_update.acknowledged is not None and alert_update.acknowledged != alert.acknowledged:
        alert.acknowledged = alert_update.acknowledged
        if alert_update.acknowledged:
            alert.acknowledged_by = current_user.id
            alert.acknowledged_at = datetime.utcnow()
        else:
            alert.acknowledged_by = None
            alert.acknowledged_at = None
    
    # Update resolution
    if alert_update.resolved is not None and alert_update.resolved != alert.resolved:
        alert.resolved = alert_update.resolved
        if alert_update.resolved:
            alert.resolved_by = current_user.id
            alert.resolved_at = datetime.utcnow()
        else:
            alert.resolved_by = None
            alert.resolved_at = None
    
    db.commit()
    db.refresh(alert)
    
    return alert

@router.delete("/{alert_id}")
async def delete_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Delete an alert"""
    # Only admin can delete alerts
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can delete alerts")
    
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    db.delete(alert)
    db.commit()
    
    return {"message": "Alert deleted successfully"}

@router.post("/{alert_id}/acknowledge")
async def acknowledge_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Acknowledge an alert"""
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if alert.acknowledged:
        raise HTTPException(status_code=400, detail="Alert already acknowledged")
    
    alert.acknowledged = True
    alert.acknowledged_by = current_user.id
    alert.acknowledged_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    
    return {"message": "Alert acknowledged", "alert": alert}

@router.post("/{alert_id}/resolve")
async def resolve_alert(
    alert_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Resolve an alert"""
    alert = db.query(db_models.Alert).filter(db_models.Alert.id == alert_id).first()
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    if alert.resolved:
        raise HTTPException(status_code=400, detail="Alert already resolved")
    
    # Auto-acknowledge if not already acknowledged
    if not alert.acknowledged:
        alert.acknowledged = True
        alert.acknowledged_by = current_user.id
        alert.acknowledged_at = datetime.utcnow()
    
    alert.resolved = True
    alert.resolved_by = current_user.id
    alert.resolved_at = datetime.utcnow()
    
    db.commit()
    db.refresh(alert)
    
    return {"message": "Alert resolved", "alert": alert}

@router.get("/room/{room_name}", response_model=List[Alert])
async def get_room_alerts(
    room_name: str,
    active_only: bool = True,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get alerts for a specific room"""
    query = db.query(db_models.Alert).filter(db_models.Alert.room == room_name)
    
    if active_only:
        query = query.filter(db_models.Alert.resolved == False)
    
    alerts = query.order_by(db_models.Alert.created_at.desc()).all()
    return alerts

@router.get("/stats/summary")
async def get_alert_stats(
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get alert statistics summary"""
    total_alerts = db.query(db_models.Alert).count()
    active_alerts = db.query(db_models.Alert).filter(db_models.Alert.resolved == False).count()
    critical_alerts = db.query(db_models.Alert).filter(
        db_models.Alert.alert_type == "critical",
        db_models.Alert.resolved == False
    ).count()
    warning_alerts = db.query(db_models.Alert).filter(
        db_models.Alert.alert_type == "warning",
        db_models.Alert.resolved == False
    ).count()
    unacknowledged_alerts = db.query(db_models.Alert).filter(
        db_models.Alert.acknowledged == False
    ).count()
    
    return {
        "total_alerts": total_alerts,
        "active_alerts": active_alerts,
        "critical_alerts": critical_alerts,
        "warning_alerts": warning_alerts,
        "unacknowledged_alerts": unacknowledged_alerts
    }