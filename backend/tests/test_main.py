"""
Unit tests for HexWard backend
"""
import pytest
import asyncio
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.database import Base, get_db
from app.main import app

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_hexward.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db
Base.metadata.create_all(bind=engine)

client = TestClient(app)

class TestMain:
    """Test main application endpoints"""
    
    def test_health_check(self):
        """Test root endpoint health check"""
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "HexWard AI Hospital Monitoring System"
        assert data["version"] == "1.0.0"
        assert data["status"] == "operational"
        assert "services" in data

    def test_system_status(self):
        """Test system status endpoint"""
        response = client.get("/api/status")
        assert response.status_code == 200
        data = response.json()
        assert "timestamp" in data
        assert "services" in data
        assert "hospital" in data

class TestPatients:
    """Test patient management endpoints"""
    
    def test_get_patients_empty(self):
        """Test getting patients when none exist"""
        response = client.get("/api/patients")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_patient(self):
        """Test creating a new patient"""
        patient_data = {
            "name": "Test Patient",
            "age": 45,
            "room": "TEST-001",
            "conditions": ["Test Condition"],
            "vitals": {
                "heartRate": 80,
                "bloodPressure": "120/80",
                "temperature": 98.6,
                "oxygenSat": 98
            }
        }
        response = client.post("/api/patients", json=patient_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == patient_data["name"]
        assert data["room"] == patient_data["room"]
        assert "id" in data

    def test_get_patient_by_id(self):
        """Test getting a specific patient"""
        # First create a patient
        patient_data = {
            "name": "Test Patient 2",
            "age": 30,
            "room": "TEST-002",
            "conditions": [],
            "vitals": {}
        }
        create_response = client.post("/api/patients", json=patient_data)
        patient_id = create_response.json()["id"]
        
        # Then get the patient
        response = client.get(f"/api/patients/{patient_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == patient_id
        assert data["name"] == patient_data["name"]

class TestAlerts:
    """Test alert management endpoints"""
    
    def test_get_alerts_empty(self):
        """Test getting alerts when none exist"""
        response = client.get("/api/alerts")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_alert(self):
        """Test creating a new alert"""
        alert_data = {
            "alert_type": "critical",
            "title": "Test Alert",
            "message": "This is a test alert",
            "room": "TEST-001",
            "priority": 1
        }
        response = client.post("/api/alerts", json=alert_data)
        assert response.status_code == 200
        data = response.json()
        assert data["title"] == alert_data["title"]
        assert data["alert_type"] == alert_data["alert_type"]
        assert "id" in data

class TestCameras:
    """Test camera management endpoints"""
    
    def test_get_cameras_empty(self):
        """Test getting cameras when none exist"""
        response = client.get("/api/cameras")
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, list)

    def test_create_camera(self):
        """Test creating a new camera"""
        camera_data = {
            "name": "Test Camera",
            "room": "TEST-001",
            "camera_index": 0,
            "detection_enabled": True
        }
        response = client.post("/api/cameras", json=camera_data)
        assert response.status_code == 200
        data = response.json()
        assert data["name"] == camera_data["name"]
        assert data["room"] == camera_data["room"]
        assert "id" in data

class TestAnalytics:
    """Test analytics endpoints"""
    
    def test_get_analytics(self):
        """Test getting analytics data"""
        response = client.get("/api/analytics")
        assert response.status_code == 200
        data = response.json()
        assert "patient_count" in data
        assert "alert_count" in data
        assert "camera_count" in data

class TestAuth:
    """Test authentication endpoints"""
    
    def test_login_invalid_credentials(self):
        """Test login with invalid credentials"""
        login_data = {
            "username": "invalid_user",
            "password": "wrong_password"
        }
        response = client.post("/api/auth/token", data=login_data)
        assert response.status_code == 401

@pytest.mark.asyncio
class TestServices:
    """Test background services"""
    
    async def test_ai_monitor_service(self):
        """Test AI monitor service initialization"""
        from app.services.ai_monitor import AIMonitorService
        
        monitor = AIMonitorService()
        assert not monitor.is_running()
        
        # Test starting and stopping
        await monitor.start()
        assert monitor.is_running()
        
        await monitor.stop()
        assert not monitor.is_running()

    async def test_camera_service(self):
        """Test camera service initialization"""
        from app.services.camera_service import CameraService
        
        service = CameraService()
        assert not service.is_running()
        
        # Test starting and stopping
        await service.start()
        assert service.is_running()
        
        await service.stop()
        assert not service.is_running()

    async def test_gpt_service(self):
        """Test GPT service functionality"""
        from app.services.gpt_service import GPTService
        
        service = GPTService()
        # Test without API key (should return False)
        assert not service.is_available()

class TestUtilities:
    """Test utility functions"""
    
    def test_config_loading(self):
        """Test configuration loading"""
        from app.config import get_settings
        
        settings = get_settings()
        assert settings.HOSPITAL_NAME
        assert settings.HOSPITAL_TIMEZONE

    def test_database_connection(self):
        """Test database connection"""
        from app.database import engine
        
        # Test that we can connect to the database
        connection = engine.connect()
        assert connection is not None
        connection.close()

if __name__ == "__main__":
    pytest.main([__file__, "-v"])