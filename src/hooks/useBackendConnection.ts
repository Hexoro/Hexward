/**
 * Hook for managing backend connection and real-time data
 */
import { useState, useEffect, useCallback } from 'react';
import { backendApi } from '@/services/backendApi';
import { useWebSocket } from './useWebSocket';

interface SystemStatus {
  timestamp: string;
  services: {
    ai_monitor: {
      running: boolean;
      detections_count: number;
      last_analysis: string;
    };
    camera_service: {
      running: boolean;
      active_cameras: number;
      total_cameras: number;
    };
    gpt_service: {
      available: boolean;
      last_summary: string;
    };
  };
  hospital: {
    name: string;
    timezone: string;
  };
}

export const useBackendConnection = () => {
  const [isConnected, setIsConnected] = useState(false);
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // WebSocket connection for real-time updates
  const { 
    isConnected: wsConnected, 
    lastMessage, 
    sendMessage 
  } = useWebSocket('ws://localhost:8000/ws/frontend');

  // Check backend connection
  const checkConnection = useCallback(async () => {
    try {
      const response = await backendApi.getSystemStatus();
      if (response.success && response.data) {
        setSystemStatus(response.data as SystemStatus);
        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
        setError(response.error || 'Failed to connect to backend');
      }
    } catch (err) {
      setIsConnected(false);
      setError('Backend connection failed');
    } finally {
      setLoading(false);
    }
  }, []);

  // Get camera statistics
  const getCameraStats = useCallback(async () => {
    try {
      const response = await backendApi.getCameraStats();
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to get camera stats:', error);
      return null;
    }
  }, []);

  // Get AI detections
  const getDetections = useCallback(async (cameraId?: string) => {
    try {
      const response = await backendApi.getDetections(cameraId);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to get detections:', error);
      return null;
    }
  }, []);

  // Process GPT analysis
  const processGptAnalysis = useCallback(async (detectionId: string) => {
    try {
      const response = await backendApi.processGptAnalysis(detectionId);
      return response.success ? response.data : null;
    } catch (error) {
      console.error('Failed to process GPT analysis:', error);
      return null;
    }
  }, []);

  useEffect(() => {
    checkConnection();
    
    // Set up periodic connection check
    const interval = setInterval(checkConnection, 30000); // Check every 30 seconds
    
    return () => clearInterval(interval);
  }, [checkConnection]);

  // Handle WebSocket messages
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        
        // Handle different message types
        switch (data.type) {
          case 'detection':
            // New AI detection
            console.log('New detection:', data);
            break;
          case 'alert':
            // New alert generated
            console.log('New alert:', data);
            break;
          case 'system_status':
            // System status update
            setSystemStatus(data.status);
            break;
          default:
            console.log('Unknown message type:', data);
        }
      } catch (error) {
        console.error('Failed to parse WebSocket message:', error);
      }
    }
  }, [lastMessage]);

  return {
    isConnected,
    systemStatus,
    error,
    loading,
    wsConnected,
    checkConnection,
    getCameraStats,
    getDetections,
    processGptAnalysis,
    sendMessage
  };
};