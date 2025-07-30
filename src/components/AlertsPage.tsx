/**
 * Alerts and notifications page - connected to Supabase
 */
import { useState, useEffect } from "react";
import { AlertTriangle, Filter, Bell, Check, X, Clock, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  title: string;
  message: string;
  created_at: string;
  room: string;
  patient_id?: string;
  acknowledged: boolean;
  priority: number;
  updated_at: string;
}

interface Patient {
  id: string;
  name: string;
}

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
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [patients, setPatients] = useState<{ [key: string]: Patient }>({});
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<'all' | 'critical' | 'warning' | 'info'>('all');
  const [showAcknowledged, setShowAcknowledged] = useState(true);
  const { toast } = useToast();

  // Fetch alerts from Supabase
  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Type-cast the alerts to fix type mismatch
      const typedAlerts: Alert[] = (data || []).map(alert => ({
        ...alert,
        type: alert.type as 'critical' | 'warning' | 'info'
      }));
      
      setAlerts(typedAlerts);
    } catch (error) {
      console.error('Error fetching alerts:', error);
      toast({
        title: "Error",
        description: "Failed to fetch alerts",
        variant: "destructive",
      });
    }
  };

  // Fetch patients for alert mapping
  const fetchPatients = async () => {
    try {
      const { data, error } = await supabase
        .from('patients')
        .select('id, name');

      if (error) throw error;
      
      const patientsMap = (data || []).reduce((acc, patient) => {
        acc[patient.id] = patient;
        return acc;
      }, {} as { [key: string]: Patient });
      
      setPatients(patientsMap);
    } catch (error) {
      console.error('Error fetching patients:', error);
    }
  };

  // Acknowledge alert
  const acknowledgeAlert = async (id: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .update({ 
          acknowledged: true, 
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "Alert Acknowledged",
        description: "Alert has been marked as acknowledged",
      });

      fetchAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Error acknowledging alert:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge alert",
        variant: "destructive",
      });
    }
  };

  // Acknowledge all alerts
  const acknowledgeAllAlerts = async () => {
    try {
      const unacknowledgedAlerts = filteredAlerts.filter(alert => !alert.acknowledged);
      
      const { error } = await supabase
        .from('alerts')
        .update({ 
          acknowledged: true, 
          acknowledged_at: new Date().toISOString(),
          acknowledged_by: (await supabase.auth.getUser()).data.user?.id
        })
        .in('id', unacknowledgedAlerts.map(alert => alert.id));

      if (error) throw error;

      toast({
        title: "All Alerts Acknowledged",
        description: `${unacknowledgedAlerts.length} alerts have been acknowledged`,
      });

      fetchAlerts(); // Refresh alerts
    } catch (error) {
      console.error('Error acknowledging all alerts:', error);
      toast({
        title: "Error",
        description: "Failed to acknowledge all alerts",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initData = async () => {
      setLoading(true);
      await Promise.all([fetchAlerts(), fetchPatients()]);
      setLoading(false);
    };

    initData();

    // Set up real-time subscription for alerts
    const alertsChannel = supabase
      .channel('alerts-changes')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alerts' }, 
        () => {
          fetchAlerts(); // Refresh alerts on any change
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
    };
  }, []);

  const filteredAlerts = alerts
    .filter(alert => filterType === 'all' || alert.type === filterType)
    .filter(alert => showAcknowledged || !alert.acknowledged)
    .sort((a, b) => {
      if (a.acknowledged !== b.acknowledged) return a.acknowledged ? 1 : -1;
      if (a.priority !== b.priority) return a.priority - b.priority;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    return `${Math.floor(hours / 24)}d ago`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading alerts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Alert Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="medical-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Alerts</p>
                <p className="text-2xl font-bold text-foreground">{alerts.length}</p>
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
                  {alerts.filter(a => a.type === 'critical' && !a.acknowledged).length}
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
                  {alerts.filter(a => a.type === 'warning' && !a.acknowledged).length}
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
            <Button 
              variant="outline" 
              size="sm"
              onClick={acknowledgeAllAlerts}
              disabled={filteredAlerts.filter(a => !a.acknowledged).length === 0}
            >
              <Check className="w-4 h-4 mr-2" />
              Acknowledge All
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {filteredAlerts.map((alert) => {
            const config = alertTypeConfig[alert.type];
            const Icon = config.icon;
            const patient = alert.patient_id ? patients[alert.patient_id] : null;
            
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
                          <span>{formatTimeAgo(alert.created_at)}</span>
                        </div>
                        
                        <span>Room: {alert.room}</span>
                        
                        {patient && (
                          <div className="flex items-center space-x-1">
                            <Users className="w-3 h-3" />
                            <span>{patient.name}</span>
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