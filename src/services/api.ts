/**
 * API service for backend communication
 */

const API_BASE_URL = 'http://localhost:8000/api';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

class ApiService {
  private token: string | null = null;

  setAuthToken(token: string) {
    this.token = token;
    localStorage.setItem('hexward_token', token);
  }

  getAuthToken(): string | null {
    if (!this.token) {
      this.token = localStorage.getItem('hexward_token');
    }
    return this.token;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const headers = {
        'Content-Type': 'application/json',
        ...options.headers,
      };

      if (this.token) {
        headers['Authorization'] = `Bearer ${this.token}`;
      }

      const response = await fetch(url, {
        ...options,
        headers,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      console.error(`API request failed for ${endpoint}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  // Authentication
  async login(username: string, password: string, role: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ username, password, role })
    });
  }

  async logout() {
    const result = await this.request('/auth/logout', { method: 'POST' });
    this.token = null;
    localStorage.removeItem('hexward_token');
    return result;
  }

  // Patients
  async getPatients() {
    return this.request('/patients');
  }

  async getPatient(id: string) {
    return this.request(`/patients/${id}`);
  }

  async createPatient(patient: any) {
    return this.request('/patients', {
      method: 'POST',
      body: JSON.stringify(patient)
    });
  }

  async updatePatient(id: string, patient: any) {
    return this.request(`/patients/${id}`, {
      method: 'PUT',
      body: JSON.stringify(patient)
    });
  }

  // Alerts
  async getAlerts() {
    return this.request('/alerts');
  }

  async acknowledgeAlert(id: string) {
    return this.request(`/alerts/${id}/acknowledge`, { method: 'POST' });
  }

  async createAlert(alert: any) {
    return this.request('/alerts', {
      method: 'POST',
      body: JSON.stringify(alert)
    });
  }

  // Cameras
  async getCameras() {
    return this.request('/cameras');
  }

  async getCameraFeed(id: string) {
    return this.request(`/cameras/${id}/feed`);
  }

  async updateCameraSettings(id: string, settings: any) {
    return this.request(`/cameras/${id}`, {
      method: 'PUT',
      body: JSON.stringify(settings)
    });
  }

  // Analytics
  async getAnalytics(timeRange: string = '24h') {
    return this.request(`/analytics?range=${timeRange}`);
  }

  async getSystemStatus() {
    return this.request('/status');
  }

  // Events
  async getPatientEvents(patientId: string) {
    return this.request(`/patients/${patientId}/events`);
  }

  async createEvent(event: any) {
    return this.request('/events', {
      method: 'POST',
      body: JSON.stringify(event)
    });
  }
}

export const apiService = new ApiService();