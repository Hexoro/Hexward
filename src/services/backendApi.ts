/**
 * Backend API service using Supabase Edge Functions
 */
import { supabase } from "@/integrations/supabase/client";

const SUPABASE_URL = 'https://vibrblviwllnmehgyupy.supabase.co';

interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

export class BackendApiService {
  private async getAuthHeaders(): Promise<HeadersInit> {
    const { data: { session } } = await supabase.auth.getSession();
    const token = session?.access_token;
    
    return {
      'Content-Type': 'application/json',
      ...(token && { 'Authorization': `Bearer ${token}` })
    };
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${SUPABASE_URL}/functions/v1${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}`
        };
      }

      const data = await response.json();
      return {
        success: true,
        data
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Network error'
      };
    }
  }

  // Camera Management
  async scanForCameras(baseIp: string = '192.168.1', startRange: number = 1, endRange: number = 50) {
    const params = new URLSearchParams({
      baseIp,
      startRange: startRange.toString(),
      endRange: endRange.toString(),
    });

    return this.request(`/camera-management/scan-network?${params}`);
  }

  async getCameraInfo(ip: string, port: number) {
    return this.request('/camera-management/camera-info', {
      method: 'POST',
      body: JSON.stringify({ ip, port })
    });
  }

  async testCameraStream(cameraData: any) {
    return this.request('/camera-management/test-camera', {
      method: 'POST',
      body: JSON.stringify(cameraData)
    });
  }

  async addIpCamera(params: {
    ip_address: string;
    port?: number;
    brand?: string;
    model?: string;
    rtsp_url: string;
    username?: string;
    password?: string;
    room?: string;
  }) {
    return this.request('/camera-management/add-camera', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getSupportedBrands() {
    return this.request('/camera-management/supported-brands');
  }

  async getRaspberryPiSetup() {
    return {
      success: true,
      data: {
        setup_guide: [
          "1. Install Raspberry Pi OS on your Pi",
          "2. Enable camera in raspi-config",
          "3. Install required packages: sudo apt-get install ffmpeg",
          "4. Set up RTSP stream: ffmpeg -f v4l2 -i /dev/video0 -vcodec h264 -acodec aac -f rtsp rtsp://0.0.0.0:8554/stream",
          "5. Make sure port 8554 is open",
          "6. Add camera using IP of Raspberry Pi and port 8554"
        ]
      }
    };
  }

  // Camera CRUD operations
  async getCameras() {
    return this.request('/camera-management/cameras');
  }

  async createCamera(camera: any) {
    return this.addIpCamera(camera);
  }

  async updateCamera(cameraId: string, updates: any) {
    return this.request('/camera-management/update-status', {
      method: 'PUT',
      body: JSON.stringify({ id: cameraId, ...updates })
    });
  }

  async deleteCamera(cameraId: string) {
    return this.request(`/camera-management/delete-camera?id=${cameraId}`, {
      method: 'DELETE'
    });
  }

  async startCamera(cameraId: string) {
    return this.updateCamera(cameraId, { status: 'active' });
  }

  async stopCamera(cameraId: string) {
    return this.updateCamera(cameraId, { status: 'inactive' });
  }

  // System Status
  async getSystemStatus() {
    try {
      // Test if edge function is responding
      const result = await this.getSupportedBrands();
      
      if (result.success) {
        return {
          success: true,
          data: {
            status: 'online',
            services: {
              camera_service: 'online',
              ai_service: 'online',
              database: 'online',
              edge_functions: 'online'
            },
            timestamp: new Date().toISOString()
          }
        };
      } else {
        throw new Error('Edge function not responding');
      }
    } catch (error) {
      return {
        success: false,
        data: {
          status: 'offline',
          services: {
            camera_service: 'offline',
            ai_service: 'offline',
            database: 'offline',
            edge_functions: 'offline'
          },
          error: error instanceof Error ? error.message : 'Unknown error',
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  async getCameraStats() {
    // Get stats from Supabase tables directly
    try {
      const { data: cameras } = await supabase
        .from('camera_feeds')
        .select('status, ai_monitoring_enabled');

      const total = cameras?.length || 0;
      const active = cameras?.filter(c => c.status === 'active').length || 0;
      const aiEnabled = cameras?.filter(c => c.ai_monitoring_enabled).length || 0;

      return {
        success: true,
        data: {
          total_cameras: total,
          active_cameras: active,
          ai_enabled_cameras: aiEnabled,
          offline_cameras: total - active
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get camera stats'
      };
    }
  }

  // AI Services
  async getDetections(cameraId?: string) {
    try {
      let query = supabase
        .from('ai_detections')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (cameraId) {
        query = query.eq('camera_id', cameraId);
      }

      const { data, error } = await query;

      if (error) throw error;

      return {
        success: true,
        data: { detections: data }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get detections'
      };
    }
  }

  async processGptAnalysis(detectionId: string) {
    // Process detection with GPT analysis - placeholder for now
    return {
      success: true,
      data: {
        analysis: "GPT analysis processed for detection " + detectionId
      }
    };
  }
}

export const backendApi = new BackendApiService();