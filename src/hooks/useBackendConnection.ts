/**
 * Hook for managing backend connection and real-time data
 */
import { useState, useEffect, useCallback } from 'react';
import { backendApi } from '@/services/backendApi';
import { useWebSocket } from './useWebSocket';

interface SystemStatus {
  status: string;
  services: {
    camera_service: string;
    ai_service: string;
    database: string;
    edge_functions?: string;
  };
  timestamp: string;
  error?: string;
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
        setSystemStatus(response.data);
        setIsConnected(true);
        setError(null);
      } else {
        setIsConnected(false);
        const errorMsg = (response as any).error || 'Failed to connect to backend';
        setError(errorMsg);
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

  // Handle WebSocket messages (simplified since we're using Supabase edge functions)
  useEffect(() => {
    if (lastMessage) {
      try {
        const data = JSON.parse(lastMessage.data);
        console.log('WebSocket message received:', data);
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