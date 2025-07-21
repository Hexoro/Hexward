# HexWard Backend - AI Hospital Monitoring System

## 🚀 Complete AI-Powered Backend

This backend provides real-time AI hospital monitoring with:

- **🤖 YOLOv8 Computer Vision** - Real-time object detection and fall detection
- **🧠 GPT Integration** - Intelligent patient analysis and alert generation  
- **📹 Live Camera Processing** - ESP32, webcam, and IP camera support
- **⚡ Real-time WebSockets** - Live updates to frontend
- **🔐 JWT Authentication** - Role-based access control
- **📊 Complete Analytics** - Patient insights and system metrics

## 🛠️ Quick Setup

1. **Install Dependencies**
```bash
pip install -r requirements.txt
```

2. **Configure Environment**
```bash
cp .env.example .env
# Edit .env with your OpenAI API key
```

3. **Run the Server**
```bash
python main.py
```

## 🎥 Camera Setup

**Webcam/USB Camera:**
- Automatically detects camera index 0
- Works with any USB camera or laptop webcam

**ESP32-CAM:**
- Set RTSP URL in camera configuration
- Example: `rtsp://192.168.1.100:8554/stream`

**IP Cameras:**
- Add RTSP URL through the API
- Supports H.264 streams

## 🧠 AI Features

**Computer Vision (YOLOv8):**
- Person detection and tracking
- Fall detection algorithms
- Medical equipment monitoring
- Room occupancy analysis

**GPT Analysis:**
- Patient status summaries
- Alert prioritization
- Shift handover reports
- Care recommendations

## 📡 API Endpoints

- `POST /api/auth/token` - Login
- `GET /api/patients` - Patient management
- `GET /api/cameras/{id}/frame` - Live camera feeds
- `GET /api/alerts` - Alert management
- `WebSocket /ws/{client_id}` - Real-time updates

## 🔧 Hardware Integration

**Supported Hardware:**
- Any USB camera or webcam
- ESP32-CAM modules  
- IP cameras with RTSP
- Raspberry Pi cameras
- USB microphones for audio analysis

## 🐳 Docker Deployment

```bash
docker-compose up --build
```

## 🎯 Production Ready

- JWT authentication with role-based access
- SQLAlchemy database with migrations
- Real-time WebSocket connections
- Comprehensive error handling
- Performance monitoring
- Scalable architecture

The backend is now fully functional with real AI processing!