/**
 * Alerts panel component
 */
import { AlertTriangle, Info, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Alert {
  id: string;
  type: 'critical' | 'warning' | 'info';
  message: string;
  time: string;
  room: string;
}

interface AlertsPanelProps {
  alerts: Alert[];
}

const alertStyles = {
  critical: 'border-l-4 border-destructive bg-destructive/5',
  warning: 'border-l-4 border-warning bg-warning/5',
  info: 'border-l-4 border-primary bg-primary/5'
};

const alertIcons = {
  critical: AlertTriangle,
  warning: AlertTriangle,
  info: Info
};

const alertColors = {
  critical: 'text-destructive',
  warning: 'text-warning',
  info: 'text-primary'
};

export default function AlertsPanel({ alerts }: AlertsPanelProps) {
  return (
    <Card className="medical-card">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-5 h-5" />
            <span>Active Alerts</span>
          </div>
          <Button variant="outline" size="sm">
            View All
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {alerts.map((alert) => {
          const Icon = alertIcons[alert.type];
          return (
            <div
              key={alert.id}
              className={`p-3 rounded-lg ${alertStyles[alert.type]}`}
            >
              <div className="flex items-start space-x-3">
                <Icon className={`w-5 h-5 mt-0.5 ${alertColors[alert.type]}`} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {alert.message}
                  </p>
                  <div className="flex items-center justify-between mt-1">
                    <p className="text-xs text-muted-foreground">{alert.room}</p>
                    <div className="flex items-center space-x-1 text-xs text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span>{alert.time}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
        
        {alerts.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            <AlertTriangle className="w-12 h-12 mx-auto mb-2 opacity-50" />
            <p>No active alerts</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}