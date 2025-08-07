/**
 * Backend Status Indicator Component
 * Shows real-time connection status and service health
 */
import { useState } from "react";
import { useBackendConnection } from "@/hooks/useBackendConnection";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { 
  Activity, 
  AlertCircle, 
  CheckCircle, 
  RefreshCw, 
  Server, 
  Database,
  Camera,
  Brain,
  Zap
} from "lucide-react";

export default function BackendStatusIndicator() {
  const { 
    isConnected, 
    systemStatus, 
    error, 
    loading, 
    checkConnection 
  } = useBackendConnection();

  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await checkConnection();
    setIsRefreshing(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return 'text-green-600';
      case 'offline':
      case 'inactive':
        return 'text-red-600';
      case 'warning':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
      case 'active':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'offline':
      case 'inactive':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Activity className="w-4 h-4 text-gray-600" />;
    }
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          {loading ? (
            <RefreshCw className="w-4 h-4 animate-spin" />
          ) : isConnected ? (
            <CheckCircle className="w-4 h-4 text-green-600" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600" />
          )}
          <span className="hidden sm:inline">
            {loading ? 'Checking...' : isConnected ? 'Backend Online' : 'Backend Offline'}
          </span>
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80" align="end">
        <Card className="border-0 shadow-none">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">System Status</CardTitle>
              <Button
                variant="ghost"
                size="sm"
                onClick={handleRefresh}
                disabled={isRefreshing}
              >
                <RefreshCw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
              </Button>
            </div>
            {error && (
              <div className="text-sm text-destructive bg-destructive/10 p-2 rounded">
                {error}
              </div>
            )}
          </CardHeader>
          
          <CardContent className="space-y-4">
            {/* Connection Status */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Server className="w-4 h-4" />
                <span className="font-medium">Connection</span>
              </div>
              <Badge variant={isConnected ? "default" : "destructive"}>
                {isConnected ? "Online" : "Offline"}
              </Badge>
            </div>

            {systemStatus && (
              <>
                <Separator />
                
                {/* Overall System Status */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <span className="font-medium">System</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(systemStatus.status)}
                    <span className={`text-sm font-medium ${getStatusColor(systemStatus.status)}`}>
                      {systemStatus.status}
                    </span>
                  </div>
                </div>

                <Separator />

                {/* Services Status */}
                <div className="space-y-3">
                  <h4 className="font-medium text-sm">Services</h4>
                  
                  {/* Camera Service */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Camera className="w-3 h-3" />
                      <span>Camera Service</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(systemStatus.services.camera_service)}
                      <span className={getStatusColor(systemStatus.services.camera_service)}>
                        {systemStatus.services.camera_service}
                      </span>
                    </div>
                  </div>

                  {/* AI Service */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Brain className="w-3 h-3" />
                      <span>AI Service</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(systemStatus.services.ai_service)}
                      <span className={getStatusColor(systemStatus.services.ai_service)}>
                        {systemStatus.services.ai_service}
                      </span>
                    </div>
                  </div>

                  {/* Database */}
                  <div className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <Database className="w-3 h-3" />
                      <span>Database</span>
                    </div>
                    <div className="flex items-center gap-1">
                      {getStatusIcon(systemStatus.services.database)}
                      <span className={getStatusColor(systemStatus.services.database)}>
                        {systemStatus.services.database}
                      </span>
                    </div>
                  </div>

                  {/* Edge Functions */}
                  {systemStatus.services.edge_functions && (
                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Zap className="w-3 h-3" />
                        <span>Edge Functions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        {getStatusIcon(systemStatus.services.edge_functions)}
                        <span className={getStatusColor(systemStatus.services.edge_functions)}>
                          {systemStatus.services.edge_functions}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Timestamp */}
                {systemStatus.timestamp && (
                  <>
                    <Separator />
                    <div className="text-xs text-muted-foreground">
                      Last updated: {new Date(systemStatus.timestamp).toLocaleTimeString()}
                    </div>
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </PopoverContent>
    </Popover>
  );
}