/**
 * Room temperature monitoring widget
 */
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Thermometer, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RoomTemperature {
  room: string;
  temperature: number;
  humidity: number;
  timestamp: string;
  status: 'normal' | 'warning' | 'critical';
}

interface RoomTemperatureWidgetProps {
  room?: string;
  className?: string;
}

export default function RoomTemperatureWidget({ room, className }: RoomTemperatureWidgetProps) {
  const [roomData, setRoomData] = useState<RoomTemperature[]>([]);
  const [loading, setLoading] = useState(true);

  // Mock data for demonstration - in real app would come from sensors
  const generateMockRoomData = (): RoomTemperature[] => {
    const rooms = room ? [room] : ['ICU-001', 'ICU-002', 'ER-001', 'Ward-A1'];
    
    return rooms.map(roomName => {
      const baseTemp = 72 + Math.random() * 4; // 72-76°F
      const humidity = 40 + Math.random() * 20; // 40-60%
      
      let status: 'normal' | 'warning' | 'critical' = 'normal';
      if (baseTemp < 68 || baseTemp > 78) status = 'warning';
      if (baseTemp < 65 || baseTemp > 82) status = 'critical';
      
      return {
        room: roomName,
        temperature: Math.round(baseTemp * 10) / 10,
        humidity: Math.round(humidity),
        timestamp: new Date().toISOString(),
        status
      };
    });
  };

  useEffect(() => {
    // In a real implementation, this would connect to actual sensor data
    const mockData = generateMockRoomData();
    setRoomData(mockData);
    setLoading(false);

    // Simulate real-time updates
    const interval = setInterval(() => {
      const updatedData = generateMockRoomData();
      setRoomData(updatedData);
    }, 30000); // Update every 30 seconds

    return () => clearInterval(interval);
  }, [room]);

  const getTemperatureColor = (status: string) => {
    switch (status) {
      case 'critical': return 'text-destructive';
      case 'warning': return 'text-warning';
      default: return 'text-success';
    }
  };

  const getTemperatureIcon = (temperature: number) => {
    const ideal = 72; // Ideal room temperature
    if (temperature > ideal + 2) return <TrendingUp className="w-4 h-4 text-destructive" />;
    if (temperature < ideal - 2) return <TrendingDown className="w-4 h-4 text-primary" />;
    return <Thermometer className="w-4 h-4 text-success" />;
  };

  if (loading) {
    return (
      <Card className={`medical-card ${className}`}>
        <CardContent className="p-4">
          <div className="animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
            <div className="h-6 bg-muted rounded w-1/2"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (room) {
    // Single room view
    const data = roomData[0];
    if (!data) return null;

    return (
      <Card className={`medical-card ${className}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium flex items-center space-x-2">
            <Thermometer className="w-4 h-4" />
            <span>Room Environment</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Temperature</span>
              <div className="flex items-center space-x-2">
                {getTemperatureIcon(data.temperature)}
                <span className={`font-medium ${getTemperatureColor(data.status)}`}>
                  {data.temperature}°F
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Humidity</span>
              <span className="font-medium text-foreground">{data.humidity}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Status</span>
              <span className={`text-xs px-2 py-1 rounded ${
                data.status === 'normal' ? 'bg-success/10 text-success' :
                data.status === 'warning' ? 'bg-warning/10 text-warning' :
                'bg-destructive/10 text-destructive'
              }`}>
                {data.status}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Multiple rooms view
  return (
    <Card className={`medical-card ${className}`}>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Thermometer className="w-5 h-5" />
          <span>Room Temperatures</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {roomData.map((data) => (
            <div key={data.room} className="p-3 border border-border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="font-medium text-foreground">{data.room}</span>
                <span className={`text-xs px-2 py-1 rounded ${
                  data.status === 'normal' ? 'bg-success/10 text-success' :
                  data.status === 'warning' ? 'bg-warning/10 text-warning' :
                  'bg-destructive/10 text-destructive'
                }`}>
                  {data.status}
                </span>
              </div>
              <div className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Temp</span>
                  <div className="flex items-center space-x-1">
                    {getTemperatureIcon(data.temperature)}
                    <span className={getTemperatureColor(data.status)}>
                      {data.temperature}°F
                    </span>
                  </div>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Humidity</span>
                  <span className="text-foreground">{data.humidity}%</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}