"""
WebSocket Manager for real-time communication
"""
import json
from typing import Dict, List
from fastapi import WebSocket
import asyncio

class WebSocketManager:
    """Manages WebSocket connections for real-time updates"""
    
    def __init__(self):
        self.active_connections: Dict[str, WebSocket] = {}
    
    async def connect(self, websocket: WebSocket, client_id: str):
        """Accept a new WebSocket connection"""
        await websocket.accept()
        self.active_connections[client_id] = websocket
        print(f"🔌 WebSocket client {client_id} connected")
        
        # Send welcome message
        await self.send_personal_message({
            "type": "connection_established",
            "client_id": client_id,
            "message": "Connected to HexWard AI Monitor"
        }, client_id)
    
    def disconnect(self, client_id: str):
        """Remove a WebSocket connection"""
        if client_id in self.active_connections:
            del self.active_connections[client_id]
            print(f"🔌 WebSocket client {client_id} disconnected")
    
    async def send_personal_message(self, data: dict, client_id: str):
        """Send message to specific client"""
        if client_id in self.active_connections:
            try:
                websocket = self.active_connections[client_id]
                message = json.dumps(data) if isinstance(data, dict) else str(data)
                await websocket.send_text(message)
            except Exception as e:
                print(f"Error sending message to {client_id}: {e}")
                self.disconnect(client_id)
    
    async def broadcast(self, data: dict):
        """Broadcast message to all connected clients"""
        if not self.active_connections:
            return
        
        message = json.dumps(data) if isinstance(data, dict) else str(data)
        disconnected_clients = []
        
        for client_id, websocket in self.active_connections.items():
            try:
                await websocket.send_text(message)
            except Exception as e:
                print(f"Error broadcasting to {client_id}: {e}")
                disconnected_clients.append(client_id)
        
        # Clean up disconnected clients
        for client_id in disconnected_clients:
            self.disconnect(client_id)
    
    async def send_live_feed(self, camera_id: str, frame_data: str, detections: List = None):
        """Send live camera feed to connected clients"""
        data = {
            "type": "live_feed",
            "camera_id": camera_id,
            "frame_data": frame_data,
            "detections": [d.dict() if hasattr(d, 'dict') else d for d in (detections or [])],
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.broadcast(data)
    
    async def send_alert(self, alert: dict):
        """Send alert to all connected clients"""
        data = {
            "type": "alert",
            "alert": alert,
            "timestamp": asyncio.get_event_loop().time()
        }
        await self.broadcast(data)
    
    def get_connected_clients(self) -> List[str]:
        """Get list of connected client IDs"""
        return list(self.active_connections.keys())
    
    def get_connection_count(self) -> int:
        """Get number of active connections"""
        return len(self.active_connections)