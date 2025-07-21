/**
 * Alerts and notifications page
 */
import { useState } from "react";
import { AlertTriangle, Filter, Bell, Check, X, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  room: string;
  patient?: string;
  acknowledged: boolean;
  priority: number;
}

const mockAlerts: Alert[] = [
  {
    id: '1',
    type: 'critical',
    title: 'Patient Fall Detected',
    message: 'Motion sensors detected a sudden fall in ICU-001. Immediate attention required.',
    timestamp: new Date(Date.now() - 2 * 60 * 1000),
    room: 'ICU-001',
    patient: 'John Doe',
    acknowledged: false,
    priority: 1
  },
  {
    id: '2',
    type: 'critical',
    title: 'Vital Signs Critical',
    message: 'Heart rate dropped below threshold (45 bpm) for patient in ER-001.',
    timestamp: new Date(Date.now() - 8 * 60 * 1000),
    room: 'ER-001',
    patient: 'Maria Garcia',
    acknowledged: false,
    priority: 1
  },
  {
    id: '3',
    type: 'warning',
    title: 'Medication Overdue',
    message: 'Scheduled medication for 14:00 has not been administered.',
    timestamp: new Date(Date.now() - 15 * 60 * 1000),
    room: 'WARD-101',
    patient: 'Jane Smith',
    acknowledged: true,
    priority: 2
  },
  {
    id: '4',
    type: 'warning',
    title: 'Equipment Maintenance',
    message: 'Ventilator in ICU-002 requires scheduled maintenance check.',
    timestamp: new Date(Date.now() - 30 * 60 * 1000),
    room: 'ICU-002',
    acknowledged: false,
    priority: 2
  },
  {
    id: '5',
    type: 'info',
    title: 'Visitor Check-in',
    message: 'Visitor registered at main desk for patient in WARD-103.',
    timestamp: new Date(Date.now() - 45 * 60 * 1000),
    room: 'WARD-103',
    patient: 'Robert Johnson',
    acknowledged: true,
    priority: 3
  }
];

const alertTypeConfig = {
  critical: {
    color: 'border-l-destructive bg-destructive/5 text-destructive',
    icon: AlertTriangle,
    bgClass: 'bg-destructive'
  },
  warning: {
    color: 'border-l-warning bg-warning/5 text-warning',
    icon: AlertTriangle,
    bgClass: 'bg-warning'
  },
  info: {
    color: 'border-l-primary bg-primary/5 text-primary',
    icon: Bell,
    bgClass: 'bg-primary'
  }
};

export default function AlertsPage() {
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(true);

  const filteredAlerts = mockAlerts
    .filter(alert => filterType === 'all' || alert.type === filterType)
    .filter(alert => showAcknowledged || !alert.acknowledged)
    .sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return b.timestamp.getTime() - a.timestamp.getTime();
    });

  const acknowledgeAlert = (id: string) => {
    // In real app, would make API call
    console.log('Acknowledging alert:', id);
  };

  const formatTimeAgo = (date: Date) => {
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold text-foreground">{mockAlerts.length}</p>
              </div>
              <Bell className="w-8 h-8 text-primary" />
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Critical</p>
                <p className="text-2xl font-bold text-destructive">
                  {mockAlerts.filter(a => a.type === 'critical' && !a.acknowledged).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-destructive rounded-full flex items-center justify-center animate-pulse">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Warnings</p>
                <p className="text-2xl font-bold text-warning">
                  {mockAlerts.filter(a => a.type === 'warning' && !a.acknowledged).length}
                </p>
              </div>
              <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center">
                <AlertTriangle className="w-4 h-4 text-white" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Response Time</p>
                <p className="text-2xl font-bold text-success">2.3min</p>
              </div>
              <Clock className="w-8 h-8 text-success" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">Filter by:</span>
          
          {['all', 'critical', 'warning', 'info'].map((type) => (
            <Button
              key={type}
              variant={filterType === type ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(type as any)}
              className="capitalize"
            >
              {type}
            </Button>
          ))}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => setShowAcknowledged(!showAcknowledged)}
        >
          {showAcknowledged ? 'Hide' : 'Show'} Acknowledged
        </Button>
      </div>

      {/* Alerts List */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Active Alerts ({filteredAlerts.length})</span>
            <Button variant="outline" size="sm">
              <Check className="w-4 h-4 mr-2" />
              Acknowledge All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAlerts.map((alert) => {
            const config = alertTypeConfig[alert.type];
            const Icon = config.icon;
            
            return (
              <div
                key={alert.id}
                className={`border-l-4 rounded-lg p-4 ${config.color} ${
                  alert.acknowledged ? 'opacity-60' : ''
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start space-x-3">
                    <div className={`p-2 rounded-full ${config.bgClass}`}>
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <h4 className="font-medium text-foreground">{alert.title}</h4>
                        {alert.acknowledged && (
                          <span className="px-2 py-1 bg-success text-success-foreground rounded-full text-xs">
                            Acknowledged
                          </span>
                        )}
                      </div>
                      
                      <p className="text-sm text-muted-foreground mb-2">{alert.message}</p>
                      
                      <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                        <div className="flex items-center space-x-1">
                          <Clock className="w-3 h-3" />
                          <span>{formatTimeAgo(alert.timestamp)}</span>
                        </div>
                        
                        <span>Room: {alert.room}</span>
                        
                        {alert.patient && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{alert.patient}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    {!alert.acknowledged && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => acknowledgeAlert(alert.id)}
                        className="text-success hover:bg-success hover:text-success-foreground"
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-muted-foreground hover:bg-destructive hover:text-destructive-foreground"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            );
          })}
          
          {filteredAlerts.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <Bell className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No alerts match your current filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}