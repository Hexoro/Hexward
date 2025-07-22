#!/usr/bin/env python3
"""
Generate mock data for HexWard testing and demonstration
"""
import asyncio
import random
import json
from datetime import datetime, timedelta
from pathlib import Path
import sys
import os

# Add parent directory to path to import app modules
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app.database import get_db, engine
from app.models.database_models import Patient, Alert, Camera, Detection, PatientEvent, User
from sqlalchemy.orm import Session

class MockDataGenerator:
    """Generate realistic mock data for HexWard system"""
    
    def __init__(self):
        self.first_names = [
            "John", "Jane", "Michael", "Sarah", "David", "Emily", "Robert", "Lisa",
            "James", "Maria", "William", "Jennifer", "Richard", "Patricia", "Charles"
        ]
        
        self.last_names = [
            "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller",
            "Davis", "Rodriguez", "Martinez", "Hernandez", "Lopez", "Gonzalez"
        ]
        
        self.medical_conditions = [
            "Hypertension", "Diabetes Type 2", "Heart Disease", "Pneumonia",
            "Stroke Recovery", "Post-Surgery Recovery", "Chronic Pain",
            "Respiratory Issues", "Cardiac Arrhythmia", "Kidney Disease"
        ]
        
        self.rooms = [
            "ICU-001", "ICU-002", "ICU-003", "ER-001", "ER-002",
            "WARD-101", "WARD-102", "WARD-103", "WARD-201", "WARD-202",
            "SURGERY-A", "SURGERY-B", "RECOVERY-1", "RECOVERY-2"
        ]

    def generate_user_data(self, count: int = 10) -> list:
        """Generate mock user accounts"""
        users = []
        roles = ["doctor", "nurse", "admin"]
        
        for i in range(count):
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            role = random.choice(roles)
            
            user = {
                "username": f"{first_name.lower()}.{last_name.lower()}",
                "email": f"{first_name.lower()}.{last_name.lower()}@hexward.hospital",
                "hashed_password": "hashed_password_123",  # In real app, would be properly hashed
                "role": role,
                "is_active": True
            }
            users.append(user)
        
        return users

    def generate_patient_data(self, count: int = 25) -> list:
        """Generate mock patient data"""
        patients = []
        
        for i in range(count):
            first_name = random.choice(self.first_names)
            last_name = random.choice(self.last_names)
            
            # Generate realistic vitals
            vitals = {
                "heartRate": random.randint(60, 120),
                "bloodPressure": f"{random.randint(110, 160)}/{random.randint(70, 100)}",
                "temperature": round(random.uniform(97.0, 102.0), 1),
                "oxygenSat": random.randint(90, 100)
            }
            
            patient = {
                "name": f"{first_name} {last_name}",
                "age": random.randint(18, 85),
                "room": random.choice(self.rooms),
                "status": random.choice(["stable", "critical", "monitoring"]),
                "admission_date": datetime.now() - timedelta(days=random.randint(1, 30)),
                "conditions": random.sample(self.medical_conditions, random.randint(1, 3)),
                "vitals": vitals,
                "ai_summary": self.generate_ai_summary()
            }
            patients.append(patient)
        
        return patients

    def generate_ai_summary(self) -> str:
        """Generate AI-like patient summary"""
        summaries = [
            "Patient showing stable vital signs with good response to treatment.",
            "Monitoring required due to elevated blood pressure readings.",
            "Recovery progressing well, patient is alert and responsive.",
            "Critical condition stabilizing, continue current treatment protocol.",
            "Patient experiencing mild discomfort, pain management adjusted.",
            "Excellent progress in rehabilitation, mobility improving.",
            "Vital signs within normal range, discharge planning initiated."
        ]
        return random.choice(summaries)

    def generate_camera_data(self) -> list:
        """Generate mock camera data"""
        cameras = []
        
        for room in self.rooms:
            camera = {
                "name": f"Camera {room}",
                "room": room,
                "camera_index": random.randint(0, 10),
                "rtsp_url": f"rtsp://camera-{room.lower()}.local:554/stream",
                "status": random.choice(["active", "offline", "maintenance"]),
                "last_frame_time": datetime.now() - timedelta(minutes=random.randint(0, 30)),
                "detection_enabled": True,
                "recording_enabled": random.choice([True, False])
            }
            cameras.append(camera)
        
        return cameras

    def generate_alert_data(self, patient_ids: list, count: int = 15) -> list:
        """Generate mock alert data"""
        alerts = []
        
        alert_types = [
            ("critical", "Patient Fall Detected", "Motion sensors detected sudden fall"),
            ("critical", "Vital Signs Critical", "Heart rate below safe threshold"),
            ("critical", "Emergency Button Pressed", "Patient pressed emergency call button"),
            ("warning", "Medication Overdue", "Scheduled medication not administered"),
            ("warning", "Equipment Maintenance", "Medical equipment requires service"),
            ("warning", "Visitor Alert", "Unauthorized visitor detected"),
            ("info", "Patient Movement", "Patient is mobile and active"),
            ("info", "Visitor Check-in", "Authorized visitor registered"),
            ("info", "Medication Administered", "Medication given as scheduled")
        ]
        
        for i in range(count):
            alert_type, title, base_message = random.choice(alert_types)
            patient_id = random.choice(patient_ids) if patient_ids else None
            room = random.choice(self.rooms)
            
            alert = {
                "alert_type": alert_type,
                "title": title,
                "message": f"{base_message} in {room}",
                "patient_id": patient_id,
                "room": room,
                "priority": 1 if alert_type == "critical" else 2 if alert_type == "warning" else 3,
                "acknowledged": random.choice([True, False]),
                "resolved": random.choice([True, False]),
                "created_at": datetime.now() - timedelta(hours=random.randint(0, 48))
            }
            alerts.append(alert)
        
        return alerts

    def generate_patient_events(self, patient_ids: list, count: int = 50) -> list:
        """Generate mock patient events"""
        events = []
        
        event_types = [
            ("vitals_check", "Vital signs recorded"),
            ("medication", "Medication administered"),
            ("movement", "Patient movement detected"),
            ("visitor", "Visitor interaction"),
            ("meal", "Meal served"),
            ("treatment", "Medical treatment performed"),
            ("exercise", "Physical therapy session"),
            ("consultation", "Doctor consultation")
        ]
        
        for i in range(count):
            event_type, description = random.choice(event_types)
            patient_id = random.choice(patient_ids) if patient_ids else None
            
            event = {
                "patient_id": patient_id,
                "event_type": event_type,
                "description": description,
                "metadata": self.generate_event_metadata(event_type),
                "source": random.choice(["camera", "manual", "sensor", "ai"]),
                "confidence": random.uniform(0.7, 1.0) if random.choice([True, False]) else None,
                "timestamp": datetime.now() - timedelta(hours=random.randint(0, 72))
            }
            events.append(event)
        
        return events

    def generate_event_metadata(self, event_type: str) -> dict:
        """Generate metadata for specific event types"""
        if event_type == "vitals_check":
            return {
                "heart_rate": random.randint(60, 120),
                "blood_pressure": f"{random.randint(110, 160)}/{random.randint(70, 100)}",
                "temperature": round(random.uniform(97.0, 102.0), 1),
                "oxygen_saturation": random.randint(90, 100)
            }
        elif event_type == "medication":
            medications = ["Painkiller", "Antibiotic", "Blood Thinner", "Heart Medication"]
            return {
                "medication": random.choice(medications),
                "dosage": f"{random.randint(1, 10)}mg",
                "route": random.choice(["oral", "IV", "injection"])
            }
        elif event_type == "movement":
            return {
                "activity": random.choice(["walking", "sitting_up", "lying_down", "standing"]),
                "duration": f"{random.randint(5, 60)}_minutes"
            }
        else:
            return {}

    def generate_detection_data(self, camera_ids: list, count: int = 30) -> list:
        """Generate mock detection data"""
        detections = []
        
        detection_types = [
            "person", "fall_detection", "medical_equipment", "visitor",
            "staff_member", "wheelchair", "bed_movement", "emergency_gesture"
        ]
        
        for i in range(count):
            camera_id = random.choice(camera_ids) if camera_ids else None
            
            detection = {
                "camera_id": camera_id,
                "detection_type": random.choice(detection_types),
                "confidence": round(random.uniform(0.6, 0.99), 2),
                "bounding_box": {
                    "x": random.randint(0, 640),
                    "y": random.randint(0, 480),
                    "width": random.randint(50, 200),
                    "height": random.randint(80, 300)
                },
                "frame_path": f"/frames/{datetime.now().strftime('%Y%m%d')}/frame_{i:06d}.jpg",
                "metadata": {"frame_quality": "high", "lighting": "normal"},
                "timestamp": datetime.now() - timedelta(minutes=random.randint(0, 1440))
            }
            detections.append(detection)
        
        return detections

    async def populate_database(self):
        """Populate database with mock data"""
        print("🔄 Generating mock data for HexWard...")
        
        # Get database session
        db = next(get_db())
        
        try:
            # Generate and insert users
            print("👥 Creating users...")
            users_data = self.generate_user_data(10)
            user_ids = []
            for user_data in users_data:
                user = User(**user_data)
                db.add(user)
                db.flush()  # Get the ID
                user_ids.append(user.id)
            
            # Generate and insert patients
            print("🏥 Creating patients...")
            patients_data = self.generate_patient_data(25)
            patient_ids = []
            for patient_data in patients_data:
                patient = Patient(**patient_data)
                db.add(patient)
                db.flush()  # Get the ID
                patient_ids.append(patient.id)
            
            # Generate and insert cameras
            print("📹 Creating cameras...")
            cameras_data = self.generate_camera_data()
            camera_ids = []
            for camera_data in cameras_data:
                camera = Camera(**camera_data)
                db.add(camera)
                db.flush()  # Get the ID
                camera_ids.append(camera.id)
            
            # Generate and insert alerts
            print("🚨 Creating alerts...")
            alerts_data = self.generate_alert_data(patient_ids, 20)
            for alert_data in alerts_data:
                alert = Alert(**alert_data)
                db.add(alert)
            
            # Generate and insert patient events
            print("📝 Creating patient events...")
            events_data = self.generate_patient_events(patient_ids, 75)
            for event_data in events_data:
                event = PatientEvent(**event_data)
                db.add(event)
            
            # Generate and insert detections
            print("🔍 Creating detections...")
            detections_data = self.generate_detection_data(camera_ids, 50)
            for detection_data in detections_data:
                detection = Detection(**detection_data)
                db.add(detection)
            
            # Commit all changes
            db.commit()
            print("✅ Mock data generation complete!")
            
            # Print summary
            print(f"\n📊 Generated Data Summary:")
            print(f"   • {len(users_data)} Users")
            print(f"   • {len(patients_data)} Patients")
            print(f"   • {len(cameras_data)} Cameras")
            print(f"   • {len(alerts_data)} Alerts")
            print(f"   • {len(events_data)} Patient Events")
            print(f"   • {len(detections_data)} Detections")
            
        except Exception as e:
            db.rollback()
            print(f"❌ Error generating mock data: {e}")
            raise
        finally:
            db.close()

    def export_sample_data(self, filename: str = "sample_data.json"):
        """Export sample data to JSON file for frontend testing"""
        print(f"📄 Exporting sample data to {filename}...")
        
        sample_data = {
            "patients": self.generate_patient_data(10),
            "cameras": self.generate_camera_data()[:6],
            "alerts": self.generate_alert_data(["1", "2", "3"], 10),
            "events": self.generate_patient_events(["1", "2", "3"], 20),
            "detections": self.generate_detection_data(["1", "2", "3"], 15)
        }
        
        # Convert datetime objects to strings for JSON serialization
        def convert_datetime(obj):
            if isinstance(obj, datetime):
                return obj.isoformat()
            elif isinstance(obj, dict):
                return {k: convert_datetime(v) for k, v in obj.items()}
            elif isinstance(obj, list):
                return [convert_datetime(item) for item in obj]
            return obj
        
        sample_data = convert_datetime(sample_data)
        
        with open(filename, 'w') as f:
            json.dump(sample_data, f, indent=2)
        
        print(f"✅ Sample data exported to {filename}")

async def main():
    """Main function to run mock data generation"""
    generator = MockDataGenerator()
    
    # Generate database data
    await generator.populate_database()
    
    # Export sample data for frontend
    generator.export_sample_data("../src/data/sample_data.json")
    
    print("\n🎉 Mock data generation complete! HexWard is ready for testing.")

if __name__ == "__main__":
    asyncio.run(main())