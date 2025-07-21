/**
 * Live camera feeds page
 */
import { useState } from "react";
import { Camera, Grid, Maximize2, Settings, Circle, Volume2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LiveFeedCard from "./LiveFeedCard";

const mockCameras = [
  { id: 'ICU-001', name: 'ICU Room 1', status: 'active' as const, patients: 2, lastUpdate: new Date() },
  { id: 'ICU-002', name: 'ICU Room 2', status: 'active' as const, patients: 1, lastUpdate: new Date() },
  { id: 'WARD-101', name: 'General Ward 101', status: 'active' as const, patients: 4, lastUpdate: new Date() },
  { id: 'ER-001', name: 'Emergency Room 1', status: 'critical' as const, patients: 3, lastUpdate: new Date() },
  { id: 'LOBBY-001', name: 'Main Lobby', status: 'active' as const, patients: 0, lastUpdate: new Date() },
  { id: 'HALL-A', name: 'Hallway A', status: 'active' as const, patients: 0, lastUpdate: new Date() },
];

export default function LiveFeedsPage() {
  const [selectedView, setSelectedView] = useState<'grid' | 'single'>('grid');
  const [fullscreenFeed, setFullscreenFeed] = useState<string | null>(null);

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
          {mockCameras.map((camera) => (
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
                {mockCameras.map((camera) => (
                  <button
                    key={camera.id}
                    className="w-full p-3 text-left border border-border rounded-lg hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-foreground">{camera.name}</p>
                        <p className="text-xs text-muted-foreground">{camera.id}</p>
                      </div>
                      <div className={`status-indicator ${
                        camera.status === 'active' ? 'bg-success' : 
                        camera.status === 'critical' ? 'bg-destructive' : 'bg-muted-foreground'
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
                <p className="text-2xl font-bold text-foreground">{mockCameras.length}</p>
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
                <p className="text-2xl font-bold text-success">{mockCameras.filter(c => c.status === 'active').length}</p>
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
                <p className="text-sm text-muted-foreground">Critical Alerts</p>
                <p className="text-2xl font-bold text-destructive">{mockCameras.filter(c => c.status === 'critical').length}</p>
              </div>
              <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full animate-pulse"></div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Recording</p>
                <p className="text-2xl font-bold text-warning">2</p>
              </div>
              <Circle className="w-8 h-8 text-warning" />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}