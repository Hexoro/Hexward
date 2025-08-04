/**
 * Backend API service for connecting to FastAPI backend
 */
import { supabase } from "@/integrations/supabase/client";

const BACKEND_URL = 'http://localhost:8000'; // FastAPI backend URL

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
      
      const response = await fetch(`${BACKEND_URL}${endpoint}`, {
        ...options,
        headers: {
          ...headers,
          ...options.headers
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Unknown error' }));
        return {
          success: false,
          error: errorData.detail || `HTTP ${response.status}`
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
  async scanForCameras(network: string = '192.168.1.0/24') {
    return this.request('/api/ip-cameras/scan', {
      method: 'POST',
      body: JSON.stringify({ network })
    });
  }

  async getCameraInfo(ip: string) {
    return this.request(`/api/ip-cameras/info/${ip}`);
  }

  async testCameraStream(rtspUrl: string, username?: string, password?: string) {
    return this.request('/api/ip-cameras/test', {
      method: 'POST',
      body: JSON.stringify({
        rtsp_url: rtspUrl,
        username,
        password
      })
    });
  }

  async addIpCamera(params: {
    ip: string;
    name: string;
    room: string;
    rtsp_url: string;
    username?: string;
    password?: string;
  }) {
    return this.request('/api/ip-cameras/add', {
      method: 'POST',
      body: JSON.stringify(params)
    });
  }

  async getSupportedBrands() {
    return this.request('/api/ip-cameras/supported-brands');
  }

  async getRaspberryPiSetup() {
    return this.request('/api/ip-cameras/raspberry-pi/setup');
  }

  // Existing Camera API
  async getCameras() {
    return this.request('/api/cameras/');
  }

  async createCamera(camera: any) {
    return this.request('/api/cameras/', {
      method: 'POST',
      body: JSON.stringify(camera)
    });
  }

  async updateCamera(cameraId: string, updates: any) {
    return this.request(`/api/cameras/${cameraId}`, {
      method: 'PUT',
      body: JSON.stringify(updates)
    });
  }

  async deleteCamera(cameraId: string) {
    return this.request(`/api/cameras/${cameraId}`, {
      method: 'DELETE'
    });
  }

  async getCameraFrame(cameraId: string, annotated: boolean = false) {
    return this.request(`/api/cameras/${cameraId}/frame?annotated=${annotated}`);
  }

  async startCamera(cameraId: string) {
    return this.request(`/api/cameras/${cameraId}/start`, {
      method: 'POST'
    });
  }

  async stopCamera(cameraId: string) {
    return this.request(`/api/cameras/${cameraId}/stop`, {
      method: 'POST'
    });
  }

  // System Status
  async getSystemStatus() {
    return this.request('/api/system/status');
  }

  async getCameraStats() {
    return this.request('/api/cameras/stats/summary');
  }

  // AI Services
  async getDetections(cameraId?: string) {
    const endpoint = cameraId 
      ? `/api/cameras/${cameraId}/detections`
      : '/api/ai/detections';
    return this.request(endpoint);
  }

  async processGptAnalysis(detectionId: string) {
    return this.request(`/api/ai/analyze/${detectionId}`, {
      method: 'POST'
    });
  }
}

export const backendApi = new BackendApiService();
