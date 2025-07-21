"""
AI Monitor Service - Orchestrates all AI services and real-time monitoring
"""
import asyncio
from datetime import datetime, timedelta
from typing import Dict, List, Optional
import json

from app.config import get_settings
from app.services.gpt_service import GPTService
from app.services.camera_service import CameraService
from app.services.websocket_manager import WebSocketManager
from app.models.schemas import Alert, Patient, Detection, AlertType

settings = get_settings()

class AIMonitorService:
    """Main AI monitoring service that coordinates all AI operations"""
    
    def __init__(self):
        self.is_running_flag = False
        self.gpt_service = GPTService()
        self.camera_service = None  # Will be injected
        self.websocket_manager = None  # Will be injected
        
        # Monitoring state
        self.detection_count = 0
        self.last_analysis_time = None
        self.active_alerts: Dict[str, Alert] = {}
        self.patient_summaries: Dict[str, str] = {}
        
        # Background tasks
        self.monitoring_task = None
        self.analysis_task = None
    
    async def start(self):
        """Start AI monitoring service"""
        print("🧠 Starting AI Monitor Service...")
        self.is_running_flag = True
        
        # Start background monitoring tasks
        self.monitoring_task = asyncio.create_task(self._monitoring_loop())
        self.analysis_task = asyncio.create_task(self._analysis_loop())
        
        print("✅ AI Monitor Service started")
    
    async def stop(self):
        """Stop AI monitoring service"""
        print("🔄 Stopping AI Monitor Service...")
        self.is_running_flag = False
        
        # Cancel background tasks
        if self.monitoring_task:
            self.monitoring_task.cancel()
        if self.analysis_task:
            self.analysis_task.cancel()
        
        print("✅ AI Monitor Service stopped")
    
    def is_running(self) -> bool:
        """Check if service is running"""
        return self.is_running_flag
    
    async def get_detection_count(self) -> int:
        """Get total detection count"""
        return self.detection_count
    
    async def get_last_analysis_time(self) -> Optional[datetime]:
        """Get last analysis timestamp"""
        return self.last_analysis_time
    
    def get_current_time(self) -> datetime:
        """Get current timestamp"""
        return datetime.utcnow()
    
    async def get_current_status(self) -> dict:
        """Get current system status for real-time updates"""
        return {
            "timestamp": datetime.utcnow().isoformat(),
            "is_running": self.is_running_flag,
            "detection_count": self.detection_count,
            "active_alerts": len(self.active_alerts),
            "last_analysis": self.last_analysis_time.isoformat() if self.last_analysis_time else None,
            "services": {
                "gpt_available": self.gpt_service.is_available(),
                "camera_service": self.camera_service is not None,
                "websocket_manager": self.websocket_manager is not None
            }
        }
    
    async def process_detection(self, detection: Detection, camera_id: str) -> Optional[Alert]:
        """Process a new detection and potentially generate alerts"""
        self.detection_count += 1
        
        try:
            # Analyze detection with GPT
            analysis = await self.gpt_service.analyze_detection_events([detection], detection.camera_id)
            
            if analysis.get("alert_needed", False):
                # Create alert
                alert = Alert(
                    id=f"alert_{datetime.utcnow().timestamp()}",
                    alert_type=AlertType(analysis.get("alert_type", "warning")),
                    title=f"AI Detection Alert",
                    message=analysis.get("reason", "AI detected concerning activity"),
                    room=detection.camera_id,
                    priority=1 if analysis.get("alert_type") == "critical" else 2,
                    acknowledged=False,
                    resolved=False,
                    metadata={
                        "detection_id": detection.id,
                        "ai_analysis": analysis,
                        "detection_type": detection.detection_type,
                        "confidence": detection.confidence
                    },
                    created_at=datetime.utcnow()
                )
                
                # Store alert
                self.active_alerts[alert.id] = alert
                
                # Send real-time notification
                if self.websocket_manager:
                    await self.websocket_manager.broadcast({
                        "type": "new_alert",
                        "alert": alert.dict(),
                        "timestamp": datetime.utcnow().isoformat()
                    })
                
                print(f"🚨 Alert generated: {alert.title}")
                return alert
            
            return None
            
        except Exception as e:
            print(f"Error processing detection: {e}")
            return None
    
    async def update_patient_summary(self, patient: Patient, events: List = None) -> str:
        """Update AI summary for a patient"""
        try:
            if events is None:
                events = []  # In real implementation, fetch from database
            
            summary = await self.gpt_service.analyze_patient_data(patient, events)
            
            # Store summary
            self.patient_summaries[patient.id] = summary
            self.last_analysis_time = datetime.utcnow()
            
            # Send real-time update
            if self.websocket_manager:
                await self.websocket_manager.broadcast({
                    "type": "patient_summary_updated",
                    "patient_id": patient.id,
                    "summary": summary,
                    "timestamp": datetime.utcnow().isoformat()
                })
            
            print(f"📋 Updated summary for patient {patient.name}")
            return summary
            
        except Exception as e:
            print(f"Error updating patient summary: {e}")
            return "Summary update failed"
    
    async def check_patient_vitals(self, patient: Patient) -> Optional[Alert]:
        """Analyze patient vitals and generate alerts if needed"""
        try:
            if not patient.vitals:
                return None
            
            vitals = patient.vitals
            alerts_needed = []
            
            # Check heart rate
            if isinstance(vitals, dict) and vitals.get("heart_rate"):
                hr = vitals["heart_rate"]
                if hr < 50 or hr > 120:
                    alerts_needed.append(f"Heart rate abnormal: {hr} bpm")
            
            # Check temperature
            if isinstance(vitals, dict) and vitals.get("temperature"):
                temp = vitals["temperature"]
                if temp < 96.0 or temp > 102.0:
                    alerts_needed.append(f"Temperature abnormal: {temp}°F")
            
            # Check oxygen saturation
            if isinstance(vitals, dict) and vitals.get("oxygen_saturation"):
                o2 = vitals["oxygen_saturation"]
                if o2 < 90:
                    alerts_needed.append(f"Low oxygen saturation: {o2}%")
            
            if alerts_needed:
                alert = Alert(
                    id=f"vitals_alert_{datetime.utcnow().timestamp()}",
                    alert_type=AlertType.CRITICAL if len(alerts_needed) > 1 else AlertType.WARNING,
                    title="Vital Signs Alert",
                    message="; ".join(alerts_needed),
                    room=patient.room,
                    patient_id=patient.id,
                    priority=1 if len(alerts_needed) > 1 else 2,
                    acknowledged=False,
                    resolved=False,
                    metadata={
                        "vitals": vitals,
                        "alert_triggers": alerts_needed
                    },
                    created_at=datetime.utcnow()
                )
                
                self.active_alerts[alert.id] = alert
                
                # Send real-time notification
                if self.websocket_manager:
                    await self.websocket_manager.broadcast({
                        "type": "vitals_alert",
                        "alert": alert.dict(),
                        "patient": patient.dict()
                    })
                
                return alert
            
            return None
            
        except Exception as e:
            print(f"Error checking patient vitals: {e}")
            return None
    
    async def _monitoring_loop(self):
        """Background monitoring loop"""
        print("🔄 Starting monitoring loop...")
        
        while self.is_running_flag:
            try:
                # Here you would typically:
                # 1. Check for new detections from cameras
                # 2. Monitor patient vitals
                # 3. Generate alerts
                # 4. Update real-time data
                
                # For now, just maintain heartbeat
                current_status = await self.get_current_status()
                
                if self.websocket_manager:
                    await self.websocket_manager.broadcast({
                        "type": "system_heartbeat",
                        "status": current_status
                    })
                
                # Sleep for configured interval
                await asyncio.sleep(settings.ALERT_CHECK_INTERVAL)
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in monitoring loop: {e}")
                await asyncio.sleep(5)
        
        print("🔄 Monitoring loop stopped")
    
    async def _analysis_loop(self):
        """Background analysis loop for patient summaries"""
        print("🔄 Starting analysis loop...")
        
        while self.is_running_flag:
            try:
                # Here you would typically:
                # 1. Update patient summaries periodically
                # 2. Generate shift reports
                # 3. Analyze trends
                # 4. Optimize AI models
                
                # Update analysis timestamp
                self.last_analysis_time = datetime.utcnow()
                
                # Sleep for configured interval
                await asyncio.sleep(settings.PATIENT_UPDATE_INTERVAL * 60)  # Convert to minutes
                
            except asyncio.CancelledError:
                break
            except Exception as e:
                print(f"Error in analysis loop: {e}")
                await asyncio.sleep(30)
        
        print("🔄 Analysis loop stopped")
    
    def set_camera_service(self, camera_service):
        """Inject camera service dependency"""
        self.camera_service = camera_service
    
    def set_websocket_manager(self, websocket_manager):
        """Inject websocket manager dependency"""
        self.websocket_manager = websocket_manager