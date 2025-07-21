/**
 * Main dashboard overview with key metrics and live feeds
 */
import { AlertTriangle, Users, Camera, Activity, Clock, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import LiveFeedCard from "./LiveFeedCard";
import AlertsPanel from "./AlertsPanel";
import PatientStatsCard from "./PatientStatsCard";

const mockRooms = [
  { id: 'ICU-001', name: 'ICU Room 1', status: 'active' as const, patients: 2, lastUpdate: new Date() },
  { id: 'ICU-002', name: 'ICU Room 2', status: 'active' as const, patients: 1, lastUpdate: new Date() },
  { id: 'WARD-101', name: 'General Ward 101', status: 'active' as const, patients: 4, lastUpdate: new Date() },
  { id: 'ER-001', name: 'Emergency Room 1', status: 'critical' as const, patients: 3, lastUpdate: new Date() },
];

const mockAlerts = [
  { id: '1', type: 'critical' as const, message: 'Patient fall detected in ICU-001', time: '2 min ago', room: 'ICU-001' },
  { id: '2', type: 'warning' as const, message: 'Medication reminder for John Doe', time: '5 min ago', room: 'WARD-101' },
  { id: '3', type: 'info' as const, message: 'Visitor check-in at ER-001', time: '12 min ago', room: 'ER-001' },
];

const stats = [
  { title: 'Total Patients', value: '24', change: '+2', icon: Users, color: 'text-primary' },
  { title: 'Critical Alerts', value: '3', change: '+1', icon: AlertTriangle, color: 'text-destructive' },
  { title: 'Active Cameras', value: '12', change: '0', icon: Camera, color: 'text-success' },
  { title: 'Response Time', value: '2.3min', change: '-0.5min', icon: Clock, color: 'text-warning' },
];

export default function OverviewPage() {
  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="dashboard-grid">
        {stats.map((stat, index) => (
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
              <CardTitle className="flex items-center space-x-2">
                <Camera className="w-5 h-5" />
                <span>Live Room Monitoring</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {mockRooms.map((room) => (
                  <LiveFeedCard key={room.id} room={room} />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Patient Statistics */}
          <PatientStatsCard />
        </div>

        {/* Alerts & Activity */}
        <div className="space-y-6">
          <AlertsPanel alerts={mockAlerts} />
          
          {/* Recent Activity */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Activity className="w-5 h-5" />
                <span>Recent Activity</span>
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