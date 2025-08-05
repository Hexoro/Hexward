/**
 * Main dashboard overview with key metrics and live feeds - connected to Supabase
 */
import { useState, useEffect } from "react";
import { AlertTriangle, Users, Camera, Activity, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import LiveFeedCard from "./LiveFeedCard";
import AlertsPanel from "./AlertsPanel";
import PatientStatsCard from "./PatientStatsCard";
import RoomTemperatureWidget from "./RoomTemperatureWidget";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DashboardStats {
  totalPatients: number;
  criticalAlerts: number;
  activeCameras: number;
  responseTime: string;
}

interface RecentAlert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  room: string;
}

interface OverviewPageProps {
  onNavigate?: (page: string) => void;
}

export default function OverviewPage({ onNavigate }: OverviewPageProps) {
  const [stats, setStats] = useState<DashboardStats>({
    totalPatients: 0,
    criticalAlerts: 0,
    activeCameras: 0,
    responseTime: '0min'
  });
  const [recentAlerts, setRecentAlerts] = useState<RecentAlert[]>([]);
  const [cameras, setCameras] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch dashboard statistics
  const fetchDashboardStats = async () => {
    try {
      // Get total patients
      const { count: patientsCount } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Get critical alerts
      const { count: alertsCount } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .eq('type', 'critical')
        .eq('acknowledged', false);

      // Get active cameras
      const { count: camerasCount } = await supabase
        .from('camera_feeds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      setStats({
        totalPatients: patientsCount || 0,
        criticalAlerts: alertsCount || 0,
        activeCameras: camerasCount || 0,
        responseTime: '2.3min' // Mock for now
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  // Fetch recent alerts for panel
  const fetchRecentAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('alerts')
        .select('id, type, message, created_at, room')
        .order('created_at', { ascending: false })
        .limit(3);

      if (error) throw error;

      const formattedAlerts: RecentAlert[] = (data || []).map(alert => ({
        id: alert.id,
        type: alert.type as 'critical' | 'warning' | 'info',
        message: alert.message,
        time: formatTimeAgo(alert.created_at),
        room: alert.room
      }));

      setRecentAlerts(formattedAlerts);
    } catch (error) {
      console.error('Error fetching recent alerts:', error);
    }
  };

  // Fetch camera feeds for display
  const fetchCameras = async () => {
    try {
      const { data, error } = await supabase
        .from('camera_feeds')
        .select('*')
        .limit(4)
        .order('name');

      if (error) throw error;
      
      const mappedCameras = (data || []).map(camera => ({
        id: camera.camera_id,
        name: camera.name,
        status: camera.status,
        patients: 0, // Would need actual count
        lastUpdate: new Date(camera.updated_at)
      }));
      
      setCameras(mappedCameras);
    } catch (error) {
      console.error('Error fetching cameras:', error);
    }
  };

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const minutes = Math.floor((Date.now() - date.getTime()) / (1000 * 60));
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  useEffect(() => {
    const initDashboard = async () => {
      setLoading(true);
      await Promise.all([
        fetchDashboardStats(),
        fetchRecentAlerts(),
        fetchCameras()
      ]);
      setLoading(false);
    };

    initDashboard();

    // Set up real-time subscriptions
    const alertsChannel = supabase
      .channel('dashboard-alerts')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'alerts' }, 
        () => {
          fetchDashboardStats();
          fetchRecentAlerts();
        }
      )
      .subscribe();

    const patientsChannel = supabase
      .channel('dashboard-patients')
      .on('postgres_changes', 
        { event: '*', schema: 'public', table: 'patients' }, 
        () => {
          fetchDashboardStats();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(alertsChannel);
      supabase.removeChannel(patientsChannel);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const statsConfig = [
    { title: 'Total Patients', value: stats.totalPatients.toString(), change: '+2', icon: Users, color: 'text-primary' },
    { title: 'Critical Alerts', value: stats.criticalAlerts.toString(), change: '+1', icon: AlertTriangle, color: 'text-destructive' },
    { title: 'Active Cameras', value: stats.activeCameras.toString(), change: '0', icon: Camera, color: 'text-success' },
    { title: 'Response Time', value: stats.responseTime, change: '-0.5min', icon: Clock, color: 'text-warning' },
  ];
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="dashboard-grid">
        {statsConfig.map((stat, index) => (
          <Card key={index} className="medical-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{stat.title}</p>
                  <p className="text-3xl font-bold text-foreground">{stat.value}</p>
                  <p className={`text-sm ${stat.color} flex items-center space-x-1`}>
                    <TrendingUp className="w-4 h-4" />
                    <span>{stat.change} from last hour</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${stat.color}`}>
                  <stat.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Live Room Feeds */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Camera className="w-5 h-5" />
                  <span>Live Room Monitoring</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate?.('feeds')}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {cameras.map((camera) => (
                  <LiveFeedCard key={camera.id} room={camera} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patient Statistics */}
          <div className="space-y-6">
            <Card className="medical-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Users className="w-5 h-5" />
                    <span>Patient Overview</span>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => onNavigate?.('patients')}
                  >
                    View All
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <PatientStatsCard />
              </CardContent>
            </Card>
            
            <RoomTemperatureWidget />
          </div>
        </div>

        {/* Alerts & Activity */}
        <div className="space-y-6">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="w-5 h-5" />
                  <span>Recent Alerts</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate?.('alerts')}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <AlertsPanel alerts={recentAlerts} />
            </CardContent>
          </Card>
          
          {/* Recent Activity */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5" />
                  <span>Recent Activity</span>
                </div>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => onNavigate?.('reports')}
                >
                  View All
                </Button>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="patient-timeline">
                <div className="timeline-item">
                  <div className="timeline-dot"></div>
                  <div className="text-sm">
                    <p className="font-medium">Patient admitted to ICU-001</p>
                    <p className="text-muted-foreground">2 minutes ago</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot bg-warning"></div>
                  <div className="text-sm">
                    <p className="font-medium">Medication administered</p>
                    <p className="text-muted-foreground">15 minutes ago</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot bg-success"></div>
                  <div className="text-sm">
                    <p className="font-medium">Patient vitals stable</p>
                    <p className="text-muted-foreground">32 minutes ago</p>
                  </div>
                </div>
                <div className="timeline-item">
                  <div className="timeline-dot bg-primary"></div>
                  <div className="text-sm">
                    <p className="font-medium">AI summary generated</p>
                    <p className="text-muted-foreground">1 hour ago</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}