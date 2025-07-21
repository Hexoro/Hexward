"""
GPT Service for intelligent analysis and summarization
"""
import asyncio
import json
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Any
import openai
from openai import AsyncOpenAI

from app.config import get_settings
from app.models.schemas import Patient, PatientEvent, Alert, Detection

settings = get_settings()

class GPTService:
    """Service for GPT-powered analysis and summarization"""
    
    def __init__(self):
        self.client = None
        self.is_initialized = False
        self.last_summary_time = None
        
        if settings.OPENAI_API_KEY:
            self.client = AsyncOpenAI(api_key=settings.OPENAI_API_KEY)
            self.is_initialized = True
    
    def is_available(self) -> bool:
        """Check if GPT service is available"""
        return self.is_initialized and self.client is not None
    
    async def get_last_summary_time(self) -> Optional[datetime]:
        """Get timestamp of last summary generation"""
        return self.last_summary_time
    
    async def analyze_patient_data(self, patient: Patient, events: List[PatientEvent]) -> str:
        """Generate AI summary of patient status and recent events"""
        if not self.is_available():
            return "AI analysis unavailable - OpenAI API key not configured"
        
        try:
            # Prepare context for GPT
            patient_context = self._build_patient_context(patient, events)
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an AI medical assistant analyzing patient data in a hospital monitoring system. 
                        Provide concise, professional medical summaries focused on:
                        1. Current patient status and trends
                        2. Notable events and patterns
                        3. Potential concerns or recommendations
                        4. Keep it brief (3-4 bullet points max)
                        5. Use medical terminology appropriately"""
                    },
                    {
                        "role": "user",
                        "content": f"Analyze this patient data and provide a medical summary:\n\n{patient_context}"
                    }
                ],
                max_tokens=200,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            self.last_summary_time = datetime.utcnow()
            
            return summary
            
        except Exception as e:
            print(f"GPT analysis error: {e}")
            return f"AI analysis temporarily unavailable: {str(e)}"
    
    async def analyze_detection_events(self, detections: List[Detection], room: str) -> Dict[str, Any]:
        """Analyze computer vision detections for potential alerts"""
        if not self.is_available():
            return {"alert_needed": False, "reason": "AI unavailable"}
        
        try:
            # Build detection context
            detection_context = self._build_detection_context(detections, room)
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an AI system analyzing hospital camera detections. 
                        Determine if any detections require immediate alerts based on:
                        1. Patient falls or emergencies
                        2. Unusual activity patterns
                        3. Medical equipment issues
                        4. Security concerns
                        
                        Respond with JSON: {"alert_needed": boolean, "alert_type": "critical/warning/info", "reason": "explanation", "recommendations": ["action1", "action2"]}"""
                    },
                    {
                        "role": "user",
                        "content": f"Analyze these camera detections:\n\n{detection_context}"
                    }
                ],
                max_tokens=150,
                temperature=0.2
            )
            
            result = response.choices[0].message.content.strip()
            
            try:
                analysis = json.loads(result)
                return analysis
            except json.JSONDecodeError:
                return {"alert_needed": False, "reason": "Analysis parsing error"}
                
        except Exception as e:
            print(f"Detection analysis error: {e}")
            return {"alert_needed": False, "reason": f"Analysis error: {str(e)}"}
    
    async def generate_shift_summary(self, patients: List[Patient], alerts: List[Alert], timeframe_hours: int = 8) -> str:
        """Generate summary for nursing shift handover"""
        if not self.is_available():
            return "Shift summary unavailable - AI service not configured"
        
        try:
            summary_context = self._build_shift_context(patients, alerts, timeframe_hours)
            
            response = await self.client.chat.completions.create(
                model="gpt-4",
                messages=[
                    {
                        "role": "system",
                        "content": """You are creating a nursing shift handover summary. Focus on:
                        1. Critical patients and their status changes
                        2. Important alerts and incidents
                        3. Medications and treatments
                        4. Areas requiring attention
                        Keep it professional, concise, and actionable."""
                    },
                    {
                        "role": "user",
                        "content": f"Generate a shift handover summary:\n\n{summary_context}"
                    }
                ],
                max_tokens=400,
                temperature=0.3
            )
            
            summary = response.choices[0].message.content.strip()
            self.last_summary_time = datetime.utcnow()
            
            return summary
            
        except Exception as e:
            print(f"Shift summary error: {e}")
            return f"Shift summary error: {str(e)}"
    
    async def suggest_patient_actions(self, patient: Patient, recent_events: List[PatientEvent]) -> List[str]:
        """Generate AI suggestions for patient care"""
        if not self.is_available():
            return ["AI suggestions unavailable"]
        
        try:
            context = self._build_patient_context(patient, recent_events)
            
            response = await self.client.chat.completions.create(
                model="gpt-3.5-turbo",
                messages=[
                    {
                        "role": "system",
                        "content": """You are an AI assistant suggesting patient care actions. 
                        Provide 2-3 specific, actionable recommendations based on patient data.
                        Focus on monitoring, medication timing, mobility, and comfort measures.
                        Keep suggestions brief and practical."""
                    },
                    {
                        "role": "user",
                        "content": f"Suggest care actions for this patient:\n\n{context}"
                    }
                ],
                max_tokens=100,
                temperature=0.4
            )
            
            suggestions_text = response.choices[0].message.content.strip()
            
            # Parse suggestions into list
            suggestions = [s.strip() for s in suggestions_text.split('\n') if s.strip()]
            return suggestions[:3]  # Limit to 3 suggestions
            
        except Exception as e:
            print(f"Suggestions error: {e}")
            return [f"Suggestion generation error: {str(e)}"]
    
    def _build_patient_context(self, patient: Patient, events: List[PatientEvent]) -> str:
        """Build context string for patient analysis"""
        context = f"""
Patient: {patient.name}, Age: {patient.age}, Room: {patient.room}
Status: {patient.status}
Admission Date: {patient.admission_date}
Conditions: {', '.join(patient.conditions) if patient.conditions else 'None listed'}

Current Vitals:
"""
        
        if patient.vitals:
            vitals = patient.vitals
            if isinstance(vitals, dict):
                context += f"- Heart Rate: {vitals.get('heart_rate', 'N/A')} bpm\n"
                context += f"- Blood Pressure: {vitals.get('blood_pressure', 'N/A')}\n"
                context += f"- Temperature: {vitals.get('temperature', 'N/A')}°F\n"
                context += f"- Oxygen Saturation: {vitals.get('oxygen_saturation', 'N/A')}%\n"
        
        context += f"\nRecent Events ({len(events)} total):\n"
        for event in events[-10:]:  # Last 10 events
            context += f"- {event.timestamp.strftime('%H:%M')}: {event.description} ({event.event_type})\n"
        
        return context
    
    def _build_detection_context(self, detections: List[Detection], room: str) -> str:
        """Build context for detection analysis"""
        context = f"Room: {room}\nDetections in last few minutes:\n"
        
        for detection in detections[-20:]:  # Last 20 detections
            context += f"- {detection.timestamp.strftime('%H:%M:%S')}: {detection.detection_type} "
            context += f"(confidence: {detection.confidence:.2f})\n"
        
        return context
    
    def _build_shift_context(self, patients: List[Patient], alerts: List[Alert], timeframe_hours: int) -> str:
        """Build context for shift summary"""
        context = f"Shift Summary - Last {timeframe_hours} hours\n\n"
        
        # Critical patients
        critical_patients = [p for p in patients if p.status == "critical"]
        context += f"Critical Patients ({len(critical_patients)}):\n"
        for patient in critical_patients:
            context += f"- {patient.name} in {patient.room}: {patient.ai_summary or 'No recent summary'}\n"
        
        # Recent alerts
        context += f"\nAlerts ({len(alerts)} total):\n"
        for alert in alerts[-10:]:
            context += f"- {alert.created_at.strftime('%H:%M')}: {alert.title} ({alert.alert_type})\n"
        
        return context