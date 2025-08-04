"""
IP Camera Detection and Management Service
Handles IP camera discovery, connection, and streaming
"""
import asyncio
import ipaddress
import socket
import cv2
import requests
from typing import List, Dict, Optional, Tuple
import subprocess
import re
from dataclasses import dataclass
import logging

logger = logging.getLogger(__name__)

@dataclass
class IPCamera:
    ip: str
    port: int = 554
    brand: str = "unknown"
    model: str = "unknown"
    rtsp_url: str = ""
    http_url: str = ""
    status: str = "detected"
    auth_required: bool = False

class IPCameraDetector:
    """Service for detecting and managing IP cameras"""
    
    def __init__(self):
        self.common_ports = [554, 8080, 80, 8554, 1935, 8081, 8000, 8888]
        self.common_rtsp_paths = [
            "/live/ch0",
            "/cam/realmonitor?channel=1&subtype=0",
            "/videostream.cgi?user=admin&pwd=",
            "/video1",
            "/live",
            "/stream1",
            "/media/video1",
            "/onvif1",
            "/Streaming/Channels/101/",
            "/h264/ch1/main/av_stream",
        ]
        self.detected_cameras: Dict[str, IPCamera] = {}

    async def scan_network_for_cameras(self, network: str = "192.168.1.0/24") -> List[IPCamera]:
        """Scan network for IP cameras"""
        logger.info(f"Scanning network {network} for cameras...")
        cameras = []
        
        try:
            network_obj = ipaddress.IPv4Network(network, strict=False)
            
            # Scan first 50 IPs to avoid long delays
            tasks = []
            for ip in list(network_obj.hosts())[:50]:
                task = asyncio.create_task(self._check_ip_for_camera(str(ip)))
                tasks.append(task)
            
            results = await asyncio.gather(*tasks, return_exceptions=True)
            
            for result in results:
                if isinstance(result, IPCamera):
                    cameras.append(result)
                    self.detected_cameras[result.ip] = result
                    
        except Exception as e:
            logger.error(f"Error scanning network: {e}")
            
        logger.info(f"Found {len(cameras)} cameras")
        return cameras

    async def _check_ip_for_camera(self, ip: str) -> Optional[IPCamera]:
        """Check if an IP address hosts a camera"""
        try:
            # Quick ping check first
            if not await self._ping_host(ip):
                return None
                
            # Check common camera ports
            for port in self.common_ports:
                if await self._check_port(ip, port):
                    camera = IPCamera(ip=ip, port=port)
                    
                    # Try to identify camera brand/model
                    await self._identify_camera(camera)
                    
                    # Generate RTSP URL
                    camera.rtsp_url = self._generate_rtsp_url(camera)
                    
                    # Test RTSP connection
                    if await self._test_rtsp_connection(camera.rtsp_url):
                        camera.status = "active"
                        return camera
                    
        except Exception as e:
            logger.debug(f"Error checking IP {ip}: {e}")
            
        return None

    async def _ping_host(self, ip: str) -> bool:
        """Quick ping check"""
        try:
            proc = await asyncio.create_subprocess_exec(
                'ping', '-c', '1', '-W', '1000', ip,
                stdout=asyncio.subprocess.DEVNULL,
                stderr=asyncio.subprocess.DEVNULL
            )
            await proc.wait()
            return proc.returncode == 0
        except:
            return False

    async def _check_port(self, ip: str, port: int) -> bool:
        """Check if port is open"""
        try:
            future = asyncio.open_connection(ip, port)
            reader, writer = await asyncio.wait_for(future, timeout=2.0)
            writer.close()
            await writer.wait_closed()
            return True
        except:
            return False

    async def _identify_camera(self, camera: IPCamera):
        """Try to identify camera brand and model"""
        try:
            # Try HTTP requests to common camera endpoints
            http_urls = [
                f"http://{camera.ip}:{camera.port}/",
                f"http://{camera.ip}/",
                f"http://{camera.ip}:80/",
            ]
            
            for url in http_urls:
                try:
                    response = requests.get(url, timeout=3)
                    server_header = response.headers.get('Server', '').lower()
                    
                    # Identify by server header
                    if 'hikvision' in server_header:
                        camera.brand = "Hikvision"
                    elif 'dahua' in server_header:
                        camera.brand = "Dahua"
                    elif 'axis' in server_header:
                        camera.brand = "Axis"
                    elif 'foscam' in server_header:
                        camera.brand = "Foscam"
                    
                    # Check HTML content for brand indicators
                    content = response.text.lower()
                    if 'hikvision' in content:
                        camera.brand = "Hikvision"
                    elif 'dahua' in content:
                        camera.brand = "Dahua"
                    elif 'raspberry' in content or 'pi' in content:
                        camera.brand = "Raspberry Pi"
                        camera.model = "Camera Module"
                    
                    camera.http_url = url
                    break
                    
                except:
                    continue
                    
        except Exception as e:
            logger.debug(f"Error identifying camera {camera.ip}: {e}")

    def _generate_rtsp_url(self, camera: IPCamera) -> str:
        """Generate RTSP URL based on camera brand"""
        base_url = f"rtsp://{camera.ip}:{camera.port}"
        
        # Brand-specific RTSP paths
        if camera.brand.lower() == "hikvision":
            return f"{base_url}/Streaming/Channels/101/"
        elif camera.brand.lower() == "dahua":
            return f"{base_url}/cam/realmonitor?channel=1&subtype=0"
        elif camera.brand.lower() == "axis":
            return f"{base_url}/axis-media/media.amp"
        elif camera.brand.lower() == "foscam":
            return f"{base_url}/videoMain"
        elif camera.brand.lower() == "raspberry pi":
            # Common for Raspberry Pi with motion or similar
            return f"http://{camera.ip}:8081/"
        else:
            # Try most common path
            return f"{base_url}/live/ch0"

    async def _test_rtsp_connection(self, rtsp_url: str) -> bool:
        """Test RTSP connection"""
        try:
            # Use OpenCV to test RTSP stream
            cap = cv2.VideoCapture(rtsp_url)
            if cap.isOpened():
                ret, frame = cap.read()
                cap.release()
                return ret and frame is not None
        except:
            pass
        return False

    async def get_camera_info(self, ip: str) -> Optional[Dict]:
        """Get detailed camera information"""
        if ip not in self.detected_cameras:
            return None
            
        camera = self.detected_cameras[ip]
        
        return {
            "ip": camera.ip,
            "port": camera.port,
            "brand": camera.brand,
            "model": camera.model,
            "rtsp_url": camera.rtsp_url,
            "http_url": camera.http_url,
            "status": camera.status,
            "auth_required": camera.auth_required
        }

    async def test_camera_stream(self, rtsp_url: str, username: str = "", password: str = "") -> Tuple[bool, str]:
        """Test camera stream with credentials"""
        try:
            # Add credentials to URL if provided
            if username and password:
                # Parse URL and add credentials
                if "://" in rtsp_url:
                    protocol, rest = rtsp_url.split("://", 1)
                    rtsp_url = f"{protocol}://{username}:{password}@{rest}"
            
            cap = cv2.VideoCapture(rtsp_url)
            if cap.isOpened():
                ret, frame = cap.read()
                cap.release()
                if ret and frame is not None:
                    return True, "Connection successful"
                else:
                    return False, "Failed to read frame"
            else:
                return False, "Failed to open stream"
                
        except Exception as e:
            return False, f"Error: {str(e)}"

    def get_raspberry_pi_setup_guide(self) -> Dict[str, str]:
        """Return setup guide for Raspberry Pi cameras"""
        return {
            "title": "Raspberry Pi Camera Setup",
            "steps": [
                "1. Enable camera interface: sudo raspi-config > Interface Options > Camera",
                "2. Install motion software: sudo apt-get install motion",
                "3. Configure motion: sudo nano /etc/motion/motion.conf",
                "4. Set stream_port 8081 and webcontrol_port 8080",
                "5. Start motion service: sudo systemctl start motion",
                "6. Access stream at http://PI_IP:8081"
            ],
            "stream_url": "http://PI_IP:8081/",
            "config_url": "http://PI_IP:8080/"
        }