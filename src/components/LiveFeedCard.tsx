/**
 * Live camera feed card component
 */
import { useState, useEffect } from "react";
import { Camera, Users, Clock, Maximize2 } from "lucide-react";
import { Button } from "@/components/ui/button";

interface Room {
  id: string;
  name: string;
  status: 'active' | 'critical' | 'offline';
  patients: number;
  lastUpdate: Date;
}

interface LiveFeedCardProps {
  room: Room;
}

const statusColors = {
  active: 'bg-success',
  critical: 'bg-destructive',
  offline: 'bg-muted-foreground'
};

export default function LiveFeedCard({ room }: LiveFeedCardProps) {
  const [isLive, setIsLive] = useState(true);

  // Simulate live feed updates
  useEffect(() => {
    const interval = setInterval(() => {
      setIsLive(prev => !prev);
    }, 2000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="room-feed">
      {/* Room Header */}
      <div className="p-3 bg-card border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <div className={`status-indicator ${statusColors[room.status]}`}></div>
            <h3 className="font-medium text-foreground">{room.name}</h3>
          </div>
          <Button variant="ghost" size="sm">
            <Maximize2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Video Feed Area */}
      <div className="relative aspect-video bg-muted flex items-center justify-center">
        {/* Simulated Video Feed */}
        <div className="absolute inset-0 bg-gradient-to-br from-muted via-muted/50 to-muted/80">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-2">
              <Camera className="w-12 h-12 text-muted-foreground mx-auto" />
              <p className="text-sm text-muted-foreground">Live Feed</p>
              <div className={`w-2 h-2 rounded-full mx-auto ${isLive ? 'bg-success animate-pulse' : 'bg-muted-foreground'}`}></div>
            </div>
          </div>
        </div>

        {/* Overlay Info */}
        <div className="absolute top-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {isLive ? 'LIVE' : 'CONNECTING...'}
        </div>

        <div className="absolute bottom-2 right-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
          {new Date().toLocaleTimeString()}
        </div>
      </div>

      {/* Room Stats */}
      <div className="p-3 bg-card">
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">{room.patients} patients</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {room.lastUpdate.toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}