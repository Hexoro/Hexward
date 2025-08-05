/**
 * Patient vitals history viewer dialog
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Heart, Thermometer, Activity, Droplets, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface VitalsHistory {
  id: string;
  vitals: any;
  timestamp: string;
  source: string;
  recorded_by?: string;
}

interface PatientVitalsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  patientId: string;
  patientName: string;
}

export default function PatientVitalsDialog({ isOpen, onClose, patientId, patientName }: PatientVitalsDialogProps) {
  const [vitalsHistory, setVitalsHistory] = useState<VitalsHistory[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchVitalsHistory = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('patient_vitals_history')
        .select('*')
        .eq('patient_id', patientId)
        .order('timestamp', { ascending: false })
        .limit(20);

      if (error) throw error;
      setVitalsHistory(data || []);
    } catch (error) {
      console.error('Error fetching vitals history:', error);
      toast.error('Failed to load vitals history');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientId) {
      fetchVitalsHistory();
    }
  }, [isOpen, patientId]);

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getVitalStatus = (vital: number, type: string) => {
    if (type === 'heartRate') {
      if (vital < 60 || vital > 100) return 'text-destructive';
      return 'text-success';
    }
    if (type === 'temperature') {
      if (vital < 97 || vital > 99.5) return 'text-warning';
      return 'text-success';
    }
    if (type === 'oxygenSat') {
      if (vital < 95) return 'text-destructive';
      return 'text-success';
    }
    return 'text-foreground';
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Heart className="w-5 h-5" />
            <span>Vitals History - {patientName}</span>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : vitalsHistory.length === 0 ? (
          <div className="text-center py-8">
            <Heart className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">No vitals history found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {vitalsHistory.map((record) => (
              <Card key={record.id} className="medical-card">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-medium">
                      {formatDateTime(record.timestamp)}
                    </CardTitle>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-muted-foreground">
                        Source: {record.source}
                      </span>
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {record.vitals.heartRate && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-destructive/10 rounded-lg">
                          <Heart className="w-4 h-4 text-destructive" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Heart Rate</p>
                          <p className={`font-medium ${getVitalStatus(record.vitals.heartRate, 'heartRate')}`}>
                            {record.vitals.heartRate} bpm
                          </p>
                        </div>
                      </div>
                    )}

                    {record.vitals.bloodPressure && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-primary/10 rounded-lg">
                          <Activity className="w-4 h-4 text-primary" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Blood Pressure</p>
                          <p className="font-medium text-foreground">{record.vitals.bloodPressure}</p>
                        </div>
                      </div>
                    )}

                    {record.vitals.temperature && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-warning/10 rounded-lg">
                          <Thermometer className="w-4 h-4 text-warning" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Temperature</p>
                          <p className={`font-medium ${getVitalStatus(record.vitals.temperature, 'temperature')}`}>
                            {record.vitals.temperature}°F
                          </p>
                        </div>
                      </div>
                    )}

                    {record.vitals.oxygenSat && (
                      <div className="flex items-center space-x-3">
                        <div className="p-2 bg-success/10 rounded-lg">
                          <Droplets className="w-4 h-4 text-success" />
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Oxygen Sat</p>
                          <p className={`font-medium ${getVitalStatus(record.vitals.oxygenSat, 'oxygenSat')}`}>
                            {record.vitals.oxygenSat}%
                          </p>
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        <div className="flex justify-end pt-4">
          <Button onClick={onClose}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}