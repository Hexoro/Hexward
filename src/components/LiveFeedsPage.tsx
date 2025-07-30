/**
 * Live camera feeds page - connected to Supabase
 */
import { useState, useEffect } from "react";
import { Camera, Grid, Maximize2, Settings, Circle, Volume2, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LiveFeedCard from "./LiveFeedCard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface CameraFeed {
  id: string;
  name: string;
  room: string;
  status: 'active' | 'offline';
  ai_monitoring_enabled: boolean;
  recording: boolean;
  last_motion_detected?: string;
  patients: number;
  lastUpdate: Date;
}

interface Detection {
  id: string;
  detection_type: string;
  confidence: number;
  timestamp: string;
  room: string;
  camera_id: string;
}

export default function LiveFeedsPage() {
  const [selectedView, setSelectedView] = useState<'grid' | 'single'>('grid');
  const [fullscreenFeed, setFullscreenFeed] = useState<string | null>(null);
  const [cameras, setCameras] = useState<CameraFeed[]>([]);
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch camera feeds from Supabase
  const fetchCameras = async () => {
    try {
      const { data, error } = await supabase
        .from('camera_feeds')
        .select('*')
        .order('name');

      if (error) throw error;
      
      const mappedCameras: CameraFeed[] = (data || []).map(camera => ({
        id: camera.camera_id,
        name: camera.name,
        room: camera.room,
        status: camera.status === 'maintenance' ? 'offline' : camera.status as 'active' | 'offline',
        ai_monitoring_enabled: camera.ai_monitoring_enabled,
        recording: camera.recording,
        last_motion_detected: camera.last_motion_detected,
        patients: 0, // Would need to count from patients table
        lastUpdate: new Date(camera.updated_at)
      }));
      
      setCameras(mappedCameras);
    } catch (error) {
      console.error('Error fetching cameras:', error);
      toast({
        title: "Error",
        description: "Failed to fetch camera feeds",
        variant: "destructive",
      });
    }
  };

  // Fetch recent AI detections
  const fetchDetections = async () => {
    try {
      const { data, error } = await supabase
        .from('ai_detections')
        .select('*')
        .order('timestamp', { ascending: false })
        .limit(10);

      if (error) throw error;
      setDetections(data || []);
    } catch (error) {
      console.error('Error fetching detections:', error);
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchCameras(), fetchDetections()]);
      setLoading(false);
    };

    initData();

    // Set up real-time subscription for AI detections
    const detectionsChannel = supabase
      .channel('detections-changes')
      .on('postgres_changes', 
        { event: 'INSERT', schema: 'public', table: 'ai_detections' }, 
        (payload) => {
          setDetections(prev => [payload.new as Detection, ...prev.slice(0, 9)]);
          toast({
            title: "New Detection",
            description: `${payload.new.detection_type} detected in ${payload.new.room}`,
            variant: payload.new.detection_type.includes('fall') ? "destructive" : "default",
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(detectionsChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading camera feeds...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button
            variant={selectedView === 'grid' ? 'default' : 'outline'}
            onClick={() => setSelectedView('grid')}
            size="sm"
          >
            <Grid className="w-4 h-4 mr-2" />
            Grid View
          </Button>
          <Button
            variant={selectedView === 'single' ? 'default' : 'outline'}
            onClick={() => setSelectedView('single')}
            size="sm"
          >
            <Maximize2 className="w-4 h-4 mr-2" />
            Single View
          </Button>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm">
            <Circle className="w-4 h-4 mr-2 text-destructive" />
            Record All
          </Button>
          <Button variant="outline" size="sm">
            <Settings className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {selectedView === 'grid' ? (
        /* Grid View */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cameras.map((camera) => (
            <div key={camera.id} className="relative">
              <LiveFeedCard room={camera} />
              <Button
                variant="ghost"
                size="sm"
                className="absolute top-2 right-2 bg-black/50 text-white hover:bg-black/70"
                onClick={() => setFullscreenFeed(camera.id)}
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
              {!camera.ai_monitoring_enabled && (
                <div className="absolute bottom-2 left-2">
                  <span className="px-2 py-1 bg-warning text-warning-foreground rounded-full text-xs">
                    AI Disabled
                  </span>
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        /* Single View */
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <div className="lg:col-span-3">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>ICU Room 1 - Live Feed</span>
                  <div className="flex items-center space-x-2">
                    <Button variant="outline" size="sm">
                      <Volume2 className="w-4 h-4" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Circle className="w-4 h-4 text-destructive" />
                    </Button>
                    <Button variant="outline" size="sm">
                      <Settings className="w-4 h-4" />
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-muted rounded-lg flex items-center justify-center relative">
                  <div className="text-center space-y-4">
                    <Camera className="w-16 h-16 text-muted-foreground mx-auto" />
                    <div>
                      <p className="text-xl font-medium text-foreground">Live Feed - ICU Room 1</p>
                      <p className="text-muted-foreground">High Quality Stream</p>
                    </div>
                  </div>
                  
                  {/* Live indicator */}
                  <div className="absolute top-4 left-4 bg-destructive text-destructive-foreground px-3 py-1 rounded-full text-sm font-medium">
                    🔴 LIVE
                  </div>
                  
                  {/* Timestamp */}
                  <div className="absolute bottom-4 right-4 bg-black/70 text-white px-3 py-1 rounded">
                    {new Date().toLocaleTimeString()}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Feed Selector */}
          <div>
            <Card className="medical-card">
              <CardHeader>
                <CardTitle>Camera Selection</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {cameras.map((camera) => (
                  <button
                    key={camera.id}
                    className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{camera.name}</p>
                        <p className="text-xs text-muted-foreground">{camera.room}</p>
                      </div>
                      <div className={`w-3 h-3 rounded-full ${
                        camera.status === 'active' ? 'bg-success' : 
                        camera.status === 'offline' ? 'bg-destructive' : 'bg-warning'
                      }`}></div>
                    </div>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      )}

      {/* Camera Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Cameras</p>
                <p className="text-2xl font-bold text-foreground">{cameras.length}</p>
              </div>
              <Camera className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Feeds</p>
                <p className="text-2xl font-bold text-success">{cameras.filter(c => c.status === 'active').length}</p>
              </div>
              <div className="w-8 h-8 bg-success rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">AI Detections</p>
                <p className="text-2xl font-bold text-destructive">{detections.length}</p>
              </div>
              <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recording</p>
                <p className="text-2xl font-bold text-warning">{cameras.filter(c => c.recording).length}</p>
              </div>
              <Circle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}