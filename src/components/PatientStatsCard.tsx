/**
 * Patient statistics card with charts
 */
import { TrendingUp, Users, Heart, Activity } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const patientData = [
  { status: 'Stable', count: 18, color: 'bg-success', percentage: 75 },
  { status: 'Critical', count: 3, color: 'bg-destructive', percentage: 12.5 },
  { status: 'Monitoring', count: 3, color: 'bg-warning', percentage: 12.5 }
];

const vitalTrends = [
  { metric: 'Heart Rate', avg: '72 bpm', trend: '+2%', status: 'normal' },
  { metric: 'Blood Pressure', avg: '120/80', trend: '-1%', status: 'normal' },
  { metric: 'Temperature', avg: '98.6°F', trend: '0%', status: 'normal' },
  { metric: 'Oxygen Sat', avg: '98%', trend: '+1%', status: 'normal' }
];

export default function PatientStatsCard() {
  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Users className="w-5 h-5" />
          <span>Patient Statistics</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Patient Status Distribution */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Status Distribution</h4>
          <div className="space-y-3">
            {patientData.map((item, index) => (
              <div key={index} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
                  <span className="text-sm text-foreground">{item.status}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={`h-full ${item.color} transition-all duration-500`}
                      style={{ width: `${item.percentage}%` }}
                    ></div>
                  </div>
                  <span className="text-sm font-medium text-foreground w-8">{item.count}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Vital Signs Trends */}
        <div>
          <h4 className="text-sm font-medium text-foreground mb-3">Average Vitals</h4>
          <div className="grid grid-cols-2 gap-3">
            {vitalTrends.map((vital, index) => (
              <div key={index} className="p-3 bg-muted rounded-lg">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs text-muted-foreground">{vital.metric}</p>
                  <div className={`flex items-center space-x-1 text-xs ${
                    vital.trend.startsWith('+') ? 'text-success' : 
                    vital.trend.startsWith('-') ? 'text-destructive' : 'text-muted-foreground'
                  }`}>
                    <TrendingUp className="w-3 h-3" />
                    <span>{vital.trend}</span>
                  </div>
                </div>
                <p className="text-sm font-medium text-foreground">{vital.avg}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Actions */}
        <div className="flex space-x-2">
          <button className="flex-1 flex items-center justify-center space-x-2 p-2 bg-primary/10 text-primary rounded-lg hover:bg-primary/20 transition-colors">
            <Heart className="w-4 h-4" />
            <span className="text-sm">Vitals</span>
          </button>
          <button className="flex-1 flex items-center justify-center space-x-2 p-2 bg-warning/10 text-warning rounded-lg hover:bg-warning/20 transition-colors">
            <Activity className="w-4 h-4" />
            <span className="text-sm">Reports</span>
          </button>
        </div>
      </CardContent>
    </Card>
  );
}