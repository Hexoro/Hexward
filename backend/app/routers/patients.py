"""
Patients router for patient management endpoints
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import database_models as db_models
from app.models.schemas import Patient, PatientCreate, PatientUpdate, PatientEvent, PatientEventCreate
from app.routers.auth import get_current_user

router = APIRouter()

@router.get("/", response_model=List[Patient])
async def get_patients(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get all patients"""
    patients = db.query(db_models.Patient).offset(skip).limit(limit).all()
    return patients

@router.post("/", response_model=Patient)
async def create_patient(
    patient: PatientCreate, 
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Create a new patient"""
    db_patient = db_models.Patient(
        name=patient.name,
        age=patient.age,
        room=patient.room,
        conditions=patient.conditions,
        vitals=patient.vitals.dict() if patient.vitals else None
    )
    
    db.add(db_patient)
    db.commit()
    db.refresh(db_patient)
    
    return db_patient

@router.get("/{patient_id}", response_model=Patient)
async def get_patient(
    patient_id: str, 
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get a specific patient"""
    patient = db.query(db_models.Patient).filter(db_models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    return patient

@router.put("/{patient_id}", response_model=Patient)
async def update_patient(
    patient_id: str, 
    patient_update: PatientUpdate, 
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Update a patient"""
    patient = db.query(db_models.Patient).filter(db_models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Update fields if provided
    update_data = patient_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field == "vitals" and value:
            setattr(patient, field, value.dict())
        else:
            setattr(patient, field, value)
    
    db.commit()
    db.refresh(patient)
    
    return patient

@router.delete("/{patient_id}")
async def delete_patient(
    patient_id: str, 
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Delete a patient"""
    # Only admin can delete patients
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Only administrators can delete patients")
    
    patient = db.query(db_models.Patient).filter(db_models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db.delete(patient)
    db.commit()
    
    return {"message": "Patient deleted successfully"}

@router.get("/{patient_id}/events", response_model=List[PatientEvent])
async def get_patient_events(
    patient_id: str, 
    skip: int = 0, 
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get events for a specific patient"""
    events = db.query(db_models.PatientEvent).filter(
        db_models.PatientEvent.patient_id == patient_id
    ).order_by(db_models.PatientEvent.timestamp.desc()).offset(skip).limit(limit).all()
    
    return events

@router.post("/{patient_id}/events", response_model=PatientEvent)
async def create_patient_event(
    patient_id: str,
    event: PatientEventCreate,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Create a new event for a patient"""
    # Verify patient exists
    patient = db.query(db_models.Patient).filter(db_models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    db_event = db_models.PatientEvent(
        patient_id=patient_id,
        event_type=event.event_type,
        description=event.description,
        metadata=event.metadata,
        source=event.source,
        confidence=event.confidence
    )
    
    db.add(db_event)
    db.commit()
    db.refresh(db_event)
    
    return db_event

@router.post("/{patient_id}/summary")
async def generate_patient_summary(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Generate AI summary for a patient"""
    # Import here to avoid circular imports
    from app.services.ai_monitor import AIMonitorService
    from app.services.gpt_service import GPTService
    
    patient = db.query(db_models.Patient).filter(db_models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get recent events
    events = db.query(db_models.PatientEvent).filter(
        db_models.PatientEvent.patient_id == patient_id
    ).order_by(db_models.PatientEvent.timestamp.desc()).limit(20).all()
    
    # Generate summary
    gpt_service = GPTService()
    summary = await gpt_service.analyze_patient_data(patient, events)
    
    # Update patient record
    patient.ai_summary = summary
    db.commit()
    
    return {"summary": summary, "generated_at": patient.last_updated}

@router.get("/{patient_id}/suggestions")
async def get_patient_suggestions(
    patient_id: str,
    db: Session = Depends(get_db),
    current_user: db_models.User = Depends(get_current_user)
):
    """Get AI suggestions for patient care"""
    from app.services.gpt_service import GPTService
    
    patient = db.query(db_models.Patient).filter(db_models.Patient.id == patient_id).first()
    if patient is None:
        raise HTTPException(status_code=404, detail="Patient not found")
    
    # Get recent events
    events = db.query(db_models.PatientEvent).filter(
        db_models.PatientEvent.patient_id == patient_id
    ).order_by(db_models.PatientEvent.timestamp.desc()).limit(10).all()
    
    # Generate suggestions
    gpt_service = GPTService()
    suggestions = await gpt_service.suggest_patient_actions(patient, events)
    
    return {"suggestions": suggestions, "patient_id": patient_id}