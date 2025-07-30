/**
 * Reports and analytics page - connected to Supabase
 */
import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, PieChart, Pie, Cell } from 'recharts';
import { FileText, Download, Calendar, TrendingUp, Users, AlertTriangle, Camera, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const alertsData = [
  { name: 'Mon', critical: 4, warning: 8, info: 12 },
  { name: 'Tue', critical: 3, warning: 6, info: 9 },
  { name: 'Wed', critical: 2, warning: 10, info: 15 },
  { name: 'Thu', critical: 5, warning: 7, info: 11 },
  { name: 'Fri', critical: 3, warning: 9, info: 14 },
  { name: 'Sat', critical: 2, warning: 5, info: 8 },
  { name: 'Sun', critical: 1, warning: 4, info: 7 },
];

const responseTimeData = [
  { time: '00:00', avgResponse: 2.1 },
  { time: '04:00', avgResponse: 1.8 },
  { time: '08:00', avgResponse: 2.5 },
  { time: '12:00', avgResponse: 3.2 },
  { time: '16:00', avgResponse: 2.8 },
  { time: '20:00', avgResponse: 2.3 },
];

const departmentData = [
  { name: 'ICU', patients: 12, color: '#ef4444' },
  { name: 'Emergency', patients: 8, color: '#f59e0b' },
  { name: 'General Ward', patients: 24, color: '#10b981' },
  { name: 'Surgery', patients: 6, color: '#3b82f6' },
];

const systemMetrics = [
  { title: 'Total Patients', value: '50', change: '+3', icon: Users, color: 'text-primary' },
  { title: 'Daily Alerts', value: '27', change: '-5', icon: AlertTriangle, color: 'text-warning' },
  { title: 'Camera Uptime', value: '99.2%', change: '+0.1%', icon: Camera, color: 'text-success' },
  { title: 'Avg Response', value: '2.3min', change: '-0.2min', icon: Clock, color: 'text-primary' },
];

export default function ReportsPage() {
  const [timeRange, setTimeRange] = useState('7d');
  const [reportType, setReportType] = useState('overview');
  const [realSystemMetrics, setRealSystemMetrics] = useState(systemMetrics);
  const [realAlertsData, setRealAlertsData] = useState(alertsData);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  // Fetch real analytics data
  const fetchAnalyticsData = async () => {
    try {
      // Get total patients
      const { count: totalPatients } = await supabase
        .from('patients')
        .select('*', { count: 'exact', head: true });

      // Get alerts count for today
      const today = new Date().toISOString().split('T')[0];
      const { count: dailyAlerts } = await supabase
        .from('alerts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', today);

      // Get camera uptime (mock calculation)
      const { count: activeCameras } = await supabase
        .from('camera_feeds')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      const { count: totalCameras } = await supabase
        .from('camera_feeds')
        .select('*', { count: 'exact', head: true });

      const uptime = totalCameras ? ((activeCameras / totalCameras) * 100).toFixed(1) : '0.0';

      // Update system metrics with real data
      setRealSystemMetrics([
        { title: 'Total Patients', value: totalPatients?.toString() || '0', change: '+3', icon: Users, color: 'text-primary' },
        { title: 'Daily Alerts', value: dailyAlerts?.toString() || '0', change: '-5', icon: AlertTriangle, color: 'text-warning' },
        { title: 'Camera Uptime', value: `${uptime}%`, change: '+0.1%', icon: Camera, color: 'text-success' },
        { title: 'Avg Response', value: '2.3min', change: '-0.2min', icon: Clock, color: 'text-primary' },
      ]);

      // Get alerts trend data (last 7 days)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);
      
      const { data: weeklyAlerts } = await supabase
        .from('alerts')
        .select('type, created_at')
        .gte('created_at', weekAgo.toISOString());

      // Process weekly alerts data for chart
      const alertsByDay = new Array(7).fill(0).map((_, index) => {
        const date = new Date();
        date.setDate(date.getDate() - (6 - index));
        const dayName = date.toLocaleDateString('en', { weekday: 'short' });
        
        const dayAlerts = weeklyAlerts?.filter(alert => {
          const alertDate = new Date(alert.created_at);
          return alertDate.toDateString() === date.toDateString();
        }) || [];

        return {
          name: dayName,
          critical: dayAlerts.filter(a => a.type === 'critical').length,
          warning: dayAlerts.filter(a => a.type === 'warning').length,
          info: dayAlerts.filter(a => a.type === 'info').length,
        };
      });

      setRealAlertsData(alertsByDay);

    } catch (error) {
      console.error('Error fetching analytics data:', error);
      toast({
        title: "Error",
        description: "Failed to fetch analytics data",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    const initAnalytics = async () => {
      setLoading(true);
      await fetchAnalyticsData();
      setLoading(false);
    };

    initAnalytics();
  }, [timeRange]);

  const generateReport = async (type: string) => {
    try {
      console.log(`Generating ${type} report for ${timeRange}`);
      
      // In a real app, this would call a Supabase edge function to generate reports
      toast({
        title: "Report Generated",
        description: `${type.toUpperCase()} report is being prepared for download`,
      });
      
      // Mock report generation
      setTimeout(() => {
        toast({
          title: "Download Ready",
          description: `Your ${reportType} report is ready for download`,
        });
      }, 2000);
      
    } catch (error) {
      console.error('Error generating report:', error);
      toast({
        title: "Error",
        description: "Failed to generate report",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24 Hours</SelectItem>
              <SelectItem value="7d">Last 7 Days</SelectItem>
              <SelectItem value="30d">Last 30 Days</SelectItem>
              <SelectItem value="90d">Last 90 Days</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="overview">System Overview</SelectItem>
              <SelectItem value="patients">Patient Reports</SelectItem>
              <SelectItem value="alerts">Alert Analysis</SelectItem>
              <SelectItem value="performance">Performance Metrics</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-2">
          <Button variant="outline" onClick={() => generateReport('pdf')}>
            <Download className="w-4 h-4 mr-2" />
            Export PDF
          </Button>
          <Button variant="outline" onClick={() => generateReport('csv')}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="dashboard-grid">
        {realSystemMetrics.map((metric, index) => (
          <Card key={index} className="medical-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">{metric.title}</p>
                  <p className="text-3xl font-bold text-foreground">{metric.value}</p>
                  <p className={`text-sm ${metric.color} flex items-center space-x-1`}>
                    <TrendingUp className="w-4 h-4" />
                    <span>{metric.change} from last period</span>
                  </p>
                </div>
                <div className={`p-3 rounded-lg bg-muted ${metric.color}`}>
                  <metric.icon className="w-6 h-6" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts Trend */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Alert Trends</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={realAlertsData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="critical" fill="#ef4444" name="Critical" />
                <Bar dataKey="warning" fill="#f59e0b" name="Warning" />
                <Bar dataKey="info" fill="#3b82f6" name="Info" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Response Time */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Clock className="w-5 h-5" />
              <span>Average Response Time</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="avgResponse" 
                  stroke="#10b981" 
                  strokeWidth={3}
                  name="Response Time (min)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Department Distribution */}
        <Card className="medical-card">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Users className="w-5 h-5" />
              <span>Patient Distribution</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={departmentData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  dataKey="patients"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {departmentData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Recent Reports */}
        <div className="lg:col-span-2">
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <FileText className="w-5 h-5" />
                <span>Recent Reports</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {[
                  { name: 'Daily Patient Summary', date: '2024-01-22', size: '2.4 MB', type: 'PDF' },
                  { name: 'Alert Analysis Report', date: '2024-01-21', size: '1.8 MB', type: 'PDF' },
                  { name: 'System Performance', date: '2024-01-20', size: '892 KB', type: 'CSV' },
                  { name: 'Weekly Overview', date: '2024-01-19', size: '3.1 MB', type: 'PDF' },
                ].map((report, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border border-border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{report.name}</p>
                        <p className="text-sm text-muted-foreground">{report.date} • {report.size} • {report.type}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* System Health */}
      <Card className="medical-card">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TrendingUp className="w-5 h-5" />
            <span>System Health Indicators</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">AI Processing</span>
                <span className="text-sm font-medium text-success">98.5%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '98.5%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Camera Network</span>
                <span className="text-sm font-medium text-success">99.2%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-success h-2 rounded-full" style={{ width: '99.2%' }}></div>
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database Health</span>
                <span className="text-sm font-medium text-warning">94.1%</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2">
                <div className="bg-warning h-2 rounded-full" style={{ width: '94.1%' }}></div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}