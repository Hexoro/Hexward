/**
 * Camera Settings and Management Page
 */
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useToast } from '@/components/ui/use-toast';
import { 
  Camera, 
  Search, 
  Wifi, 
  Monitor, 
  Settings, 
  Play, 
  Square, 
  Trash2,
  AlertCircle,
  CheckCircle,
  Loader2,
  Eye,
  Plus
} from 'lucide-react';
import { backendApi } from '@/services/backendApi';

interface DetectedCamera {
  ip: string;
  port: number;
  brand: string;
  model: string;
  rtsp_url: string;
  status: string;
}

interface CameraConfig {
  id: string;
  name: string;
  room: string;
  rtsp_url: string;
  status: string;
  camera_type: string;
}

export default function CameraSettingsPage() {
  const { toast } = useToast();
  const [scanning, setScanning] = useState(false);
  const [detectedCameras, setDetectedCameras] = useState<DetectedCamera[]>([]);
  const [configuredCameras, setCamerasConfig] = useState<CameraConfig[]>([]);
  const [loading, setLoading] = useState(false);
  const [supportedBrands, setSupportedBrands] = useState<any[]>([]);
  const [networkRange, setNetworkRange] = useState('192.168.1.0/24');
  
  // Add camera form state
  const [addCameraForm, setAddCameraForm] = useState({
    ip: '',
    name: '',
    room: '',
    rtsp_url: '',
    username: '',
    password: ''
  });

  useEffect(() => {
    loadConfiguredCameras();
    loadSupportedBrands();
  }, []);

  const loadConfiguredCameras = async () => {
    setLoading(true);
    try {
      const response = await backendApi.getCameras();
      if (response.success && response.data) {
        const data = response.data as CameraConfig[];
        // Ensure we always set an array
        setCamerasConfig(Array.isArray(data) ? data : []);
      } else {
        // Set empty array on failure
        setCamerasConfig([]);
        toast({
          title: "Error",
          description: "Failed to load camera configurations",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('Error loading cameras:', error);
      // Set empty array on error
      setCamerasConfig([]);
    } finally {
      setLoading(false);
    }
  };

  const loadSupportedBrands = async () => {
    try {
      const response = await backendApi.getSupportedBrands();
      if (response.success && response.data) {
        setSupportedBrands((response.data as any).brands || []);
      }
    } catch (error) {
      console.error('Error loading supported brands:', error);
    }
  };

  const scanForCameras = async () => {
    setScanning(true);
    setDetectedCameras([]);
    
    try {
      toast({
        title: "Scanning Network",
        description: `Searching for cameras on ${networkRange}...`
      });

      const response = await backendApi.scanForCameras(networkRange);
      
      if (response.success && response.data) {
        const scanData = response.data as any;
        setDetectedCameras(scanData.cameras || []);
        toast({
          title: "Scan Complete",
          description: `Found ${scanData.cameras_found || 0} cameras`
        });
      } else {
        toast({
          title: "Scan Failed",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Network scan failed",
        variant: "destructive"
      });
    } finally {
      setScanning(false);
    }
  };

  const testCamera = async (camera: DetectedCamera) => {
    try {
      const response = await backendApi.testCameraStream(camera.rtsp_url);
      
      if (response.success) {
        toast({
          title: "Camera Test Successful",
          description: `Camera at ${camera.ip} is working`
        });
      } else {
        toast({
          title: "Camera Test Failed",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Camera test failed",
        variant: "destructive"
      });
    }
  };

  const addCamera = async (camera: DetectedCamera) => {
    try {
      const response = await backendApi.addIpCamera({
        ip_address: camera.ip,
        port: camera.port,
        brand: camera.brand,
        rtsp_url: camera.rtsp_url,
        room: 'General Ward'
      });

      if (response.success) {
        toast({
          title: "Camera Added",
          description: `Camera ${camera.ip} added successfully`
        });
        loadConfiguredCameras();
      } else {
        toast({
          title: "Failed to Add Camera",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add camera",
        variant: "destructive"
      });
    }
  };

  const addCustomCamera = async () => {
    if (!addCameraForm.name || !addCameraForm.rtsp_url) {
      toast({
        title: "Missing Information",
        description: "Please fill in camera name and RTSP URL",
        variant: "destructive"
      });
      return;
    }

    try {
      const response = await backendApi.addIpCamera({
        ip_address: addCameraForm.ip,
        rtsp_url: addCameraForm.rtsp_url,
        username: addCameraForm.username,
        password: addCameraForm.password,
        room: addCameraForm.room
      });

      if (response.success) {
        toast({
          title: "Camera Added",
          description: `${addCameraForm.name} added successfully`
        });
        setAddCameraForm({
          ip: '',
          name: '',
          room: '',
          rtsp_url: '',
          username: '',
          password: ''
        });
        loadConfiguredCameras();
      } else {
        toast({
          title: "Failed to Add Camera",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to add camera",
        variant: "destructive"
      });
    }
  };

  const controlCamera = async (cameraId: string, action: 'start' | 'stop') => {
    try {
      const response = action === 'start' 
        ? await backendApi.startCamera(cameraId)
        : await backendApi.stopCamera(cameraId);

      if (response.success) {
        toast({
          title: "Camera Control",
          description: `Camera ${action}ed successfully`
        });
        loadConfiguredCameras();
      } else {
        toast({
          title: "Control Failed",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} camera`,
        variant: "destructive"
      });
    }
  };

  const deleteCamera = async (cameraId: string) => {
    try {
      const response = await backendApi.deleteCamera(cameraId);

      if (response.success) {
        toast({
          title: "Camera Deleted",
          description: "Camera removed successfully"
        });
        loadConfiguredCameras();
      } else {
        toast({
          title: "Delete Failed",
          description: response.error,
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete camera",
        variant: "destructive"
      });
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Camera Management</h1>
          <p className="text-muted-foreground">Configure and manage IP cameras and Raspberry Pi modules</p>
        </div>
        <Badge variant="outline" className="flex items-center gap-2">
          <Camera className="w-4 h-4" />
          {configuredCameras.length} Cameras
        </Badge>
      </div>

      <Tabs defaultValue="scan" className="space-y-6">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="scan">Network Scan</TabsTrigger>
          <TabsTrigger value="configured">Configured Cameras</TabsTrigger>
          <TabsTrigger value="manual">Manual Setup</TabsTrigger>
          <TabsTrigger value="guides">Setup Guides</TabsTrigger>
        </TabsList>

        <TabsContent value="scan" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Network Camera Detection
              </CardTitle>
              <CardDescription>
                Automatically scan your network for IP cameras and Raspberry Pi modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-4">
                <div className="flex-1">
                  <Label htmlFor="network">Network Range</Label>
                  <Input
                    id="network"
                    value={networkRange}
                    onChange={(e) => setNetworkRange(e.target.value)}
                    placeholder="192.168.1.0/24"
                  />
                </div>
                <div className="flex items-end">
                  <Button 
                    onClick={scanForCameras}
                    disabled={scanning}
                    className="flex items-center gap-2"
                  >
                    {scanning ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Search className="w-4 h-4" />
                    )}
                    {scanning ? 'Scanning...' : 'Scan Network'}
                  </Button>
                </div>
              </div>

              {scanning && (
                <Alert>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <AlertDescription>
                    Scanning network for cameras... This may take a few minutes.
                  </AlertDescription>
                </Alert>
              )}

              {detectedCameras.length > 0 && (
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Detected Cameras</h3>
                  <div className="grid gap-4">
                    {detectedCameras.map((camera, index) => (
                      <Card key={index}>
                        <CardContent className="pt-6">
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <Wifi className="w-4 h-4" />
                                <span className="font-medium">{camera.ip}:{camera.port}</span>
                                <Badge variant="secondary">{camera.brand}</Badge>
                                <Badge 
                                  variant={camera.status === 'active' ? 'default' : 'secondary'}
                                >
                                  {camera.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground">
                                RTSP: {camera.rtsp_url}
                              </p>
                            </div>
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => testCamera(camera)}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Test
                              </Button>
                              <Button
                                size="sm"
                                onClick={() => addCamera(camera)}
                              >
                                <Plus className="w-4 h-4 mr-1" />
                                Add
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="configured" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Configured Cameras
              </CardTitle>
              <CardDescription>
                Manage your existing camera configurations
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 animate-spin" />
                </div>
              ) : configuredCameras.length === 0 ? (
                <div className="text-center py-8">
                  <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No cameras configured</p>
                </div>
              ) : (
                <div className="grid gap-4">
                  {configuredCameras.map((camera) => (
                    <Card key={camera.id}>
                      <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                          <div className="space-y-1">
                            <div className="flex items-center gap-2">
                              <Camera className="w-4 h-4" />
                              <span className="font-medium">{camera.name}</span>
                              <Badge variant="secondary">{camera.room}</Badge>
                              <Badge 
                                variant={camera.status === 'active' ? 'default' : 'secondary'}
                              >
                                {camera.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              {camera.rtsp_url}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            {camera.status === 'active' ? (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => controlCamera(camera.id, 'stop')}
                              >
                                <Square className="w-4 h-4 mr-1" />
                                Stop
                              </Button>
                            ) : (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => controlCamera(camera.id, 'start')}
                              >
                                <Play className="w-4 h-4 mr-1" />
                                Start
                              </Button>
                            )}
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => deleteCamera(camera.id)}
                            >
                              <Trash2 className="w-4 h-4 mr-1" />
                              Delete
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="manual" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Manual Camera Setup
              </CardTitle>
              <CardDescription>
                Add cameras manually with custom RTSP URLs
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="camera-name">Camera Name</Label>
                  <Input
                    id="camera-name"
                    value={addCameraForm.name}
                    onChange={(e) => setAddCameraForm(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="ICU Camera 1"
                  />
                </div>
                <div>
                  <Label htmlFor="room">Room</Label>
                  <Select 
                    value={addCameraForm.room} 
                    onValueChange={(value) => setAddCameraForm(prev => ({ ...prev, room: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select room" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="ICU">ICU</SelectItem>
                      <SelectItem value="Emergency">Emergency</SelectItem>
                      <SelectItem value="General Ward">General Ward</SelectItem>
                      <SelectItem value="Operating Room">Operating Room</SelectItem>
                      <SelectItem value="Recovery">Recovery</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="rtsp-url">RTSP URL</Label>
                <Input
                  id="rtsp-url"
                  value={addCameraForm.rtsp_url}
                  onChange={(e) => setAddCameraForm(prev => ({ ...prev, rtsp_url: e.target.value }))}
                  placeholder="rtsp://192.168.1.100:554/live/ch0"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="username">Username (Optional)</Label>
                  <Input
                    id="username"
                    value={addCameraForm.username}
                    onChange={(e) => setAddCameraForm(prev => ({ ...prev, username: e.target.value }))}
                    placeholder="admin"
                  />
                </div>
                <div>
                  <Label htmlFor="password">Password (Optional)</Label>
                  <Input
                    id="password"
                    type="password"
                    value={addCameraForm.password}
                    onChange={(e) => setAddCameraForm(prev => ({ ...prev, password: e.target.value }))}
                    placeholder="••••••••"
                  />
                </div>
              </div>

              <Button onClick={addCustomCamera} className="w-full">
                Add Camera
              </Button>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Supported Camera Brands</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {supportedBrands.map((brand, index) => (
                  <div key={index} className="space-y-2">
                    <div className="font-medium">{brand.name}</div>
                    <div className="text-sm text-muted-foreground">
                      RTSP Path: {brand.rtsp_path}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Default Port: {brand.default_port}
                    </div>
                    {brand.notes && (
                      <div className="text-sm text-orange-600">
                        Note: {brand.notes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="guides" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Monitor className="w-5 h-5" />
                Raspberry Pi Camera Setup
              </CardTitle>
              <CardDescription>
                Step-by-step guide to set up Raspberry Pi camera modules
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Alert>
                <AlertCircle className="w-4 h-4" />
                <AlertDescription>
                  Follow these steps on your Raspberry Pi to enable camera streaming
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="font-medium">1. Enable Camera Interface</div>
                <code className="block bg-muted p-2 rounded text-sm">
                  sudo raspi-config
                </code>
                <p className="text-sm text-muted-foreground">
                  Navigate to Interface Options → Camera → Enable
                </p>

                <Separator />

                <div className="font-medium">2. Install Motion Software</div>
                <code className="block bg-muted p-2 rounded text-sm">
                  sudo apt-get update && sudo apt-get install motion
                </code>

                <Separator />

                <div className="font-medium">3. Configure Motion</div>
                <code className="block bg-muted p-2 rounded text-sm">
                  sudo nano /etc/motion/motion.conf
                </code>
                <p className="text-sm text-muted-foreground">
                  Set stream_port to 8081 and webcontrol_port to 8080
                </p>

                <Separator />

                <div className="font-medium">4. Start Motion Service</div>
                <code className="block bg-muted p-2 rounded text-sm">
                  sudo systemctl start motion<br />
                  sudo systemctl enable motion
                </code>

                <Separator />

                <div className="font-medium">5. Access Stream</div>
                <p className="text-sm">
                  Stream URL: <code className="bg-muted px-1 rounded">http://PI_IP:8081/</code>
                </p>
                <p className="text-sm">
                  Config URL: <code className="bg-muted px-1 rounded">http://PI_IP:8080/</code>
                </p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Common RTSP URLs</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <div className="font-medium">Hikvision</div>
                  <code className="text-sm">rtsp://IP:554/Streaming/Channels/101/</code>
                </div>
                <div>
                  <div className="font-medium">Dahua</div>
                  <code className="text-sm">rtsp://IP:554/cam/realmonitor?channel=1&subtype=0</code>
                </div>
                <div>
                  <div className="font-medium">Axis</div>
                  <code className="text-sm">rtsp://IP:554/axis-media/media.amp</code>
                </div>
                <div>
                  <div className="font-medium">Generic ONVIF</div>
                  <code className="text-sm">rtsp://IP:554/onvif1</code>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}