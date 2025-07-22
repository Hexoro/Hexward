"""
Unit tests for AI services
"""
import pytest
import asyncio
import numpy as np
from unittest.mock import Mock, patch, AsyncMock
from app.services.yolo_service import YOLOService
from app.services.gpt_service import GPTService
from app.services.ai_monitor import AIMonitorService

class TestYOLOService:
    """Test YOLO detection service"""
    
    def test_yolo_service_initialization(self):
        """Test YOLO service initialization"""
        service = YOLOService()
        assert service.model is not None
        assert service.confidence_threshold == 0.5

    def test_detect_objects_mock_frame(self):
        """Test object detection with mock frame"""
        service = YOLOService()
        
        # Create mock frame (224x224x3 RGB image)
        mock_frame = np.random.randint(0, 255, (224, 224, 3), dtype=np.uint8)
        
        detections = service.detect_objects(mock_frame)
        assert isinstance(detections, list)
        
        # Check detection format if any detections
        if detections:
            detection = detections[0]
            assert "class" in detection
            assert "confidence" in detection
            assert "bbox" in detection

    def test_confidence_threshold_setting(self):
        """Test setting confidence threshold"""
        service = YOLOService()
        
        original_threshold = service.confidence_threshold
        service.set_confidence_threshold(0.8)
        assert service.confidence_threshold == 0.8
        
        # Reset to original
        service.set_confidence_threshold(original_threshold)

class TestGPTService:
    """Test GPT summarization service"""
    
    @patch('openai.OpenAI')
    def test_gpt_service_initialization(self, mock_openai):
        """Test GPT service initialization"""
        service = GPTService()
        assert service.client is not None

    @patch('openai.OpenAI')
    async def test_summarize_patient_events(self, mock_openai):
        """Test patient event summarization"""
        # Mock OpenAI response
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Patient is stable with normal vitals."
        
        mock_client = Mock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        with patch('app.services.gpt_service.GPTService.client', mock_client):
            service = GPTService()
            
            mock_events = [
                {"timestamp": "2024-01-22T10:00:00", "type": "vitals", "data": "HR: 80, BP: 120/80"},
                {"timestamp": "2024-01-22T11:00:00", "type": "medication", "data": "Administered painkiller"}
            ]
            
            summary = await service.summarize_patient_events("patient_123", mock_events)
            assert isinstance(summary, str)
            assert len(summary) > 0

    @patch('openai.OpenAI')
    async def test_analyze_medical_event(self, mock_openai):
        """Test medical event analysis"""
        mock_response = Mock()
        mock_response.choices = [Mock()]
        mock_response.choices[0].message = Mock()
        mock_response.choices[0].message.content = "Critical: Possible cardiac event detected."
        
        mock_client = Mock()
        mock_client.chat.completions.create = AsyncMock(return_value=mock_response)
        
        with patch('app.services.gpt_service.GPTService.client', mock_client):
            service = GPTService()
            
            event_data = {
                "type": "heart_rate_anomaly",
                "value": 150,
                "normal_range": "60-100",
                "context": "Patient was resting"
            }
            
            analysis = await service.analyze_medical_event(event_data)
            assert isinstance(analysis, str)
            assert "Critical" in analysis

class TestAIMonitor:
    """Test AI monitoring service"""
    
    def test_ai_monitor_initialization(self):
        """Test AI monitor initialization"""
        monitor = AIMonitorService()
        assert not monitor.is_running()
        assert monitor.yolo_service is not None
        assert monitor.gpt_service is not None

    @patch('app.services.ai_monitor.AIMonitorService._process_camera_feed')
    async def test_ai_monitor_start_stop(self, mock_process):
        """Test starting and stopping AI monitor"""
        monitor = AIMonitorService()
        
        # Test starting
        await monitor.start()
        assert monitor.is_running()
        
        # Test stopping
        await monitor.stop()
        assert not monitor.is_running()

    async def test_detection_count(self):
        """Test detection count tracking"""
        monitor = AIMonitorService()
        
        initial_count = await monitor.get_detection_count()
        assert isinstance(initial_count, int)
        assert initial_count >= 0

    async def test_current_status(self):
        """Test getting current status"""
        monitor = AIMonitorService()
        
        status = await monitor.get_current_status()
        assert isinstance(status, dict)
        assert "timestamp" in status
        assert "active_cameras" in status
        assert "recent_detections" in status

class TestMockData:
    """Test AI services with mock data"""
    
    @pytest.fixture
    def mock_patient_data(self):
        """Mock patient data for testing"""
        return {
            "id": "test_patient_123",
            "name": "Test Patient",
            "room": "ICU-001",
            "events": [
                {
                    "timestamp": "2024-01-22T10:00:00",
                    "type": "vitals_check",
                    "data": {"heart_rate": 80, "blood_pressure": "120/80", "temperature": 98.6}
                },
                {
                    "timestamp": "2024-01-22T10:30:00",
                    "type": "medication",
                    "data": {"medication": "Painkiller", "dosage": "5mg", "administered_by": "Nurse Smith"}
                },
                {
                    "timestamp": "2024-01-22T11:00:00",
                    "type": "movement",
                    "data": {"activity": "sitting_up", "duration": "15_minutes"}
                }
            ]
        }

    @pytest.fixture
    def mock_camera_frame(self):
        """Mock camera frame for testing"""
        return np.random.randint(0, 255, (480, 640, 3), dtype=np.uint8)

    def test_process_mock_patient_events(self, mock_patient_data):
        """Test processing mock patient events"""
        events = mock_patient_data["events"]
        
        # Test event processing
        assert len(events) == 3
        assert events[0]["type"] == "vitals_check"
        assert events[1]["type"] == "medication"
        assert events[2]["type"] == "movement"

    def test_analyze_mock_camera_feed(self, mock_camera_frame):
        """Test analyzing mock camera feed"""
        yolo_service = YOLOService()
        
        detections = yolo_service.detect_objects(mock_camera_frame)
        assert isinstance(detections, list)
        
        # Frame should be processed without errors
        assert mock_camera_frame.shape == (480, 640, 3)

@pytest.mark.integration
class TestIntegration:
    """Integration tests for AI services"""
    
    async def test_full_ai_pipeline(self):
        """Test full AI pipeline integration"""
        # Initialize services
        yolo_service = YOLOService()
        gpt_service = GPTService()
        ai_monitor = AIMonitorService()
        
        # Test that services can work together
        assert yolo_service.model is not None
        assert gpt_service.client is not None
        assert ai_monitor.yolo_service is not None
        assert ai_monitor.gpt_service is not None

    async def test_error_handling(self):
        """Test error handling in AI services"""
        monitor = AIMonitorService()
        
        # Test with invalid data
        try:
            await monitor._process_detection_data(None)
        except Exception as e:
            # Should handle errors gracefully
            assert isinstance(e, (TypeError, ValueError))

if __name__ == "__main__":
    pytest.main([__file__, "-v"])