/**
 * Backend connection status indicator component
 */
import { useState, useEffect } from 'react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Wifi, 
  WifiOff, 
  Camera, 
  Brain, 
  MessageSquare, 
  RefreshCw,
  AlertCircle,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { useBackendConnection } from '@/hooks/useBackendConnection';

export default function BackendStatusIndicator() {
  const { 
    isConnected, 
    systemStatus, 
    error, 
    loading, 
    wsConnected, 
    checkConnection 
  } = useBackendConnection();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkConnection();
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  if (loading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex items-center justify-center">
            <Loader2 className="w-6 h-6 animate-spin mr-2" />
            <span>Checking backend connection...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Connection Status */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {isConnected ? (
                <CheckCircle className="w-5 h-5 text-green-500" />
              ) : (
                <AlertCircle className="w-5 h-5 text-red-500" />
              )}
              Backend Connection
            </CardTitle>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant={isConnected ? "default" : "destructive"}>
              {isConnected ? "Connected" : "Disconnected"}
            </Badge>
            <Badge variant={wsConnected ? "default" : "secondary"}>
              {wsConnected ? (
                <>
                  <Wifi className="w-3 h-3 mr-1" />
                  WebSocket
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 mr-1" />
                  WebSocket
                </>
              )}
            </Badge>
          </div>
        </CardHeader>

        {error && (
          <CardContent className="pt-0">
            <Alert variant="destructive">
              <AlertCircle className="w-4 h-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </CardContent>
        )}

        {systemStatus && (
          <CardContent className="pt-0">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* AI Monitor Service */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Brain className="w-4 h-4" />
                  <span className="font-medium">AI Monitor</span>
                  <Badge variant={systemStatus.services.ai_monitor.running ? "default" : "destructive"}>
                    {systemStatus.services.ai_monitor.running ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Detections: {systemStatus.services.ai_monitor.detections_count}</div>
                  <div>Last Analysis: {systemStatus.services.ai_monitor.last_analysis || 'None'}</div>
                </div>
              </div>

              {/* Camera Service */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Camera className="w-4 h-4" />
                  <span className="font-medium">Camera Service</span>
                  <Badge variant={systemStatus.services.camera_service.running ? "default" : "destructive"}>
                    {systemStatus.services.camera_service.running ? "Running" : "Stopped"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Active: {systemStatus.services.camera_service.active_cameras}</div>
                  <div>Total: {systemStatus.services.camera_service.total_cameras}</div>
                </div>
              </div>

              {/* GPT Service */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  <span className="font-medium">GPT Service</span>
                  <Badge variant={systemStatus.services.gpt_service.available ? "default" : "destructive"}>
                    {systemStatus.services.gpt_service.available ? "Available" : "Unavailable"}
                  </Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  <div>Last Summary: {systemStatus.services.gpt_service.last_summary || 'None'}</div>
                </div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t">
              <div className="text-sm text-muted-foreground">
                <div>Hospital: {systemStatus.hospital.name}</div>
                <div>Timezone: {systemStatus.hospital.timezone}</div>
                <div>Last Update: {new Date(systemStatus.timestamp).toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Quick Actions */}
      {isConnected && (
        <Card>
          <CardHeader>
            <CardTitle>Backend Integration</CardTitle>
            <CardDescription>
              Connected to FastAPI backend with AI services, camera processing, and real-time communication
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="text-sm text-muted-foreground">
              <ul className="space-y-1">
                <li>✅ IP Camera detection and management</li>
                <li>✅ Real-time AI analysis and object detection</li>
                <li>✅ GPT-powered patient summaries</li>
                <li>✅ WebSocket communication for live updates</li>
                <li>✅ Raspberry Pi camera support</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}