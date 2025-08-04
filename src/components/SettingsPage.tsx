/**
 * Settings and configuration page
 */
import { useState } from "react";
import { Settings, User, Shield, Bell, Camera, Database, Wifi, Save, RefreshCw } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import CameraSettingsPage from "./CameraSettingsPage";
import BackendStatusIndicator from "./BackendStatusIndicator";

export default function SettingsPage() {
  const [settings, setSettings] = useState({
    // General Settings
    hospitalName: "HexWard General Hospital",
    timezone: "UTC-5",
    language: "en",
    theme: "system",
    
    // AI Settings
    aiProcessingEnabled: true,
    yoloConfidence: 0.8,
    gptSummaryInterval: 60,
    autoAlertGeneration: true,
    
    // Camera Settings
    cameraQuality: "high",
    recordingEnabled: true,
    motionDetection: true,
    nightMode: true,
    
    // Alert Settings
    criticalAlertSound: true,
    emailNotifications: true,
    smsNotifications: false,
    alertRetention: 30,
    
    // Security Settings
    sessionTimeout: 480,
    passwordPolicy: "strong",
    twoFactorAuth: false,
    auditLogging: true,
    
    // Network Settings
    wsConnectionRetries: 5,
    apiTimeout: 30,
    cacheEnabled: true,
    offlineMode: false,
  });

  const handleSettingChange = (key: string, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }));
  };

  const saveSettings = () => {
    console.log('Saving settings:', settings);
    // In real app, would make API call
  };

  const resetToDefaults = () => {
    console.log('Resetting to defaults');
    // In real app, would reset to default values
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Configure HexWard system preferences and behavior</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={resetToDefaults}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Reset to Defaults
          </Button>
          <Button onClick={saveSettings} className="medical-button">
            <Save className="w-4 h-4 mr-2" />
            Save Changes
          </Button>
        </div>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="cameras">Cameras</TabsTrigger>
          <TabsTrigger value="ai">AI & Processing</TabsTrigger>
          <TabsTrigger value="alerts">Alerts</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
        </TabsList>

        {/* Camera Management */}
        <TabsContent value="cameras">
          <div className="space-y-6">
            <CameraSettingsPage />
            <BackendStatusIndicator />
          </div>
        </TabsContent>

        {/* General Settings */}
        <TabsContent value="general">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="w-5 h-5" />
                <span>General Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="hospitalName">Hospital Name</Label>
                  <Input
                    id="hospitalName"
                    value={settings.hospitalName}
                    onChange={(e) => handleSettingChange('hospitalName', e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Select value={settings.timezone} onValueChange={(value) => handleSettingChange('timezone', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UTC-5">UTC-5 (EST)</SelectItem>
                      <SelectItem value="UTC-6">UTC-6 (CST)</SelectItem>
                      <SelectItem value="UTC-7">UTC-7 (MST)</SelectItem>
                      <SelectItem value="UTC-8">UTC-8 (PST)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Select value={settings.language} onValueChange={(value) => handleSettingChange('language', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="es">Spanish</SelectItem>
                      <SelectItem value="fr">French</SelectItem>
                      <SelectItem value="de">German</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="theme">Theme</Label>
                  <Select value={settings.theme} onValueChange={(value) => handleSettingChange('theme', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI Settings */}
        <TabsContent value="ai">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Database className="w-5 h-5" />
                <span>AI & Processing Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Enable AI Processing</Label>
                    <p className="text-sm text-muted-foreground">Enable real-time AI analysis and detection</p>
                  </div>
                  <Switch
                    checked={settings.aiProcessingEnabled}
                    onCheckedChange={(checked) => handleSettingChange('aiProcessingEnabled', checked)}
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="yoloConfidence">YOLO Detection Confidence</Label>
                    <div className="flex items-center space-x-2">
                      <Input
                        id="yoloConfidence"
                        type="number"
                        min="0.1"
                        max="1.0"
                        step="0.1"
                        value={settings.yoloConfidence}
                        onChange={(e) => handleSettingChange('yoloConfidence', parseFloat(e.target.value))}
                      />
                      <span className="text-sm text-muted-foreground">({(settings.yoloConfidence * 100).toFixed(0)}%)</span>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="gptInterval">GPT Summary Interval (minutes)</Label>
                    <Input
                      id="gptInterval"
                      type="number"
                      min="15"
                      max="480"
                      value={settings.gptSummaryInterval}
                      onChange={(e) => handleSettingChange('gptSummaryInterval', parseInt(e.target.value))}
                    />
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Auto Alert Generation</Label>
                    <p className="text-sm text-muted-foreground">Automatically generate alerts based on AI analysis</p>
                  </div>
                  <Switch
                    checked={settings.autoAlertGeneration}
                    onCheckedChange={(checked) => handleSettingChange('autoAlertGeneration', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Camera Settings */}
        <TabsContent value="cameras">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Camera Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="quality">Video Quality</Label>
                  <Select value={settings.cameraQuality} onValueChange={(value) => handleSettingChange('cameraQuality', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low (480p)</SelectItem>
                      <SelectItem value="medium">Medium (720p)</SelectItem>
                      <SelectItem value="high">High (1080p)</SelectItem>
                      <SelectItem value="ultra">Ultra (4K)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Recording Enabled</Label>
                    <p className="text-sm text-muted-foreground">Automatically record video feeds</p>
                  </div>
                  <Switch
                    checked={settings.recordingEnabled}
                    onCheckedChange={(checked) => handleSettingChange('recordingEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Motion Detection</Label>
                    <p className="text-sm text-muted-foreground">Trigger recording on motion detection</p>
                  </div>
                  <Switch
                    checked={settings.motionDetection}
                    onCheckedChange={(checked) => handleSettingChange('motionDetection', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Night Mode</Label>
                    <p className="text-sm text-muted-foreground">Enhance visibility in low light conditions</p>
                  </div>
                  <Switch
                    checked={settings.nightMode}
                    onCheckedChange={(checked) => handleSettingChange('nightMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Alert Settings */}
        <TabsContent value="alerts">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Bell className="w-5 h-5" />
                <span>Alert Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Critical Alert Sound</Label>
                    <p className="text-sm text-muted-foreground">Play sound for critical alerts</p>
                  </div>
                  <Switch
                    checked={settings.criticalAlertSound}
                    onCheckedChange={(checked) => handleSettingChange('criticalAlertSound', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts via email</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => handleSettingChange('emailNotifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>SMS Notifications</Label>
                    <p className="text-sm text-muted-foreground">Send alerts via SMS</p>
                  </div>
                  <Switch
                    checked={settings.smsNotifications}
                    onCheckedChange={(checked) => handleSettingChange('smsNotifications', checked)}
                  />
                </div>

                <Separator />

                <div className="space-y-2">
                  <Label htmlFor="alertRetention">Alert Retention (days)</Label>
                  <Input
                    id="alertRetention"
                    type="number"
                    min="7"
                    max="365"
                    value={settings.alertRetention}
                    onChange={(e) => handleSettingChange('alertRetention', parseInt(e.target.value))}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Shield className="w-5 h-5" />
                <span>Security Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                  <Input
                    id="sessionTimeout"
                    type="number"
                    min="30"
                    max="1440"
                    value={settings.sessionTimeout}
                    onChange={(e) => handleSettingChange('sessionTimeout', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="passwordPolicy">Password Policy</Label>
                  <Select value={settings.passwordPolicy} onValueChange={(value) => handleSettingChange('passwordPolicy', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="basic">Basic</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="strong">Strong</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Two-Factor Authentication</Label>
                    <p className="text-sm text-muted-foreground">Require 2FA for login</p>
                  </div>
                  <Switch
                    checked={settings.twoFactorAuth}
                    onCheckedChange={(checked) => handleSettingChange('twoFactorAuth', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Audit Logging</Label>
                    <p className="text-sm text-muted-foreground">Log all user actions</p>
                  </div>
                  <Switch
                    checked={settings.auditLogging}
                    onCheckedChange={(checked) => handleSettingChange('auditLogging', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Network Settings */}
        <TabsContent value="network">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Wifi className="w-5 h-5" />
                <span>Network Settings</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="wsRetries">WebSocket Connection Retries</Label>
                  <Input
                    id="wsRetries"
                    type="number"
                    min="1"
                    max="10"
                    value={settings.wsConnectionRetries}
                    onChange={(e) => handleSettingChange('wsConnectionRetries', parseInt(e.target.value))}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiTimeout">API Timeout (seconds)</Label>
                  <Input
                    id="apiTimeout"
                    type="number"
                    min="10"
                    max="120"
                    value={settings.apiTimeout}
                    onChange={(e) => handleSettingChange('apiTimeout', parseInt(e.target.value))}
                  />
                </div>
              </div>

              <Separator />

              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Cache Enabled</Label>
                    <p className="text-sm text-muted-foreground">Cache API responses for better performance</p>
                  </div>
                  <Switch
                    checked={settings.cacheEnabled}
                    onCheckedChange={(checked) => handleSettingChange('cacheEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <Label>Offline Mode</Label>
                    <p className="text-sm text-muted-foreground">Allow limited functionality when offline</p>
                  </div>
                  <Switch
                    checked={settings.offlineMode}
                    onCheckedChange={(checked) => handleSettingChange('offlineMode', checked)}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}