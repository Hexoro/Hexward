/**
 * Dialog for recording patient vitals
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Activity } from "lucide-react";

interface VitalsRecordingDialogProps {
  patientId: string;
  patientName: string;
  onVitalsRecorded?: () => void;
}

interface VitalSigns {
  heartRate: number;
  bloodPressureSystolic: number;
  bloodPressureDiastolic: number;
  oxygenSat: number;
  temperature: number;
  respiratoryRate: number;
}

export default function VitalsRecordingDialog({ 
  patientId, 
  patientName, 
  onVitalsRecorded 
}: VitalsRecordingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [source, setSource] = useState<'manual' | 'sensor'>('manual');
  const [vitals, setVitals] = useState<VitalSigns>({
    heartRate: 0,
    bloodPressureSystolic: 0,
    bloodPressureDiastolic: 0,
    oxygenSat: 0,
    temperature: 0,
    respiratoryRate: 0,
  });

  const { toast } = useToast();

  const handleVitalChange = (field: keyof VitalSigns, value: string) => {
    const numValue = parseFloat(value) || 0;
    setVitals(prev => ({ ...prev, [field]: numValue }));
  };

  const recordVitals = async () => {
    try {
      setLoading(true);

      // Record vitals history
      const { error: historyError } = await supabase
        .from('patient_vitals_history')
        .insert({
          patient_id: patientId,
          vitals: vitals as any, // Type cast for JSON
          source: source,
          recorded_by: (await supabase.auth.getUser()).data.user?.id
        });

      if (historyError) throw historyError;

      // Update patient's current vitals
      const { error: updateError } = await supabase
        .from('patients')
        .update({ vitals: vitals as any }) // Type cast for JSON
        .eq('id', patientId);

      if (updateError) throw updateError;

      toast({
        title: "Vitals Recorded",
        description: `Successfully recorded vitals for ${patientName}`,
      });

      setOpen(false);
      onVitalsRecorded?.();
      
      // Reset form
      setVitals({
        heartRate: 0,
        bloodPressureSystolic: 0,
        bloodPressureDiastolic: 0,
        oxygenSat: 0,
        temperature: 0,
        respiratoryRate: 0,
      });

    } catch (error) {
      console.error('Error recording vitals:', error);
      toast({
        title: "Error",
        description: "Failed to record vitals",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Activity className="w-4 h-4 mr-2" />
          Record Vitals
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Record Vital Signs</DialogTitle>
          <DialogDescription>
            Record vital signs for {patientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="source">Data Source</Label>
            <Select value={source} onValueChange={(value: 'manual' | 'sensor') => setSource(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="manual">Manual Entry</SelectItem>
                <SelectItem value="sensor">Sensor Reading</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
              <Input
                id="heartRate"
                type="number"
                value={vitals.heartRate || ''}
                onChange={(e) => handleVitalChange('heartRate', e.target.value)}
                placeholder="72"
              />
            </div>
            <div>
              <Label htmlFor="oxygenSat">Oxygen Saturation (%)</Label>
              <Input
                id="oxygenSat"
                type="number"
                value={vitals.oxygenSat || ''}
                onChange={(e) => handleVitalChange('oxygenSat', e.target.value)}
                placeholder="98"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="systolic">BP Systolic (mmHg)</Label>
              <Input
                id="systolic"
                type="number"
                value={vitals.bloodPressureSystolic || ''}
                onChange={(e) => handleVitalChange('bloodPressureSystolic', e.target.value)}
                placeholder="120"
              />
            </div>
            <div>
              <Label htmlFor="diastolic">BP Diastolic (mmHg)</Label>
              <Input
                id="diastolic"
                type="number"
                value={vitals.bloodPressureDiastolic || ''}
                onChange={(e) => handleVitalChange('bloodPressureDiastolic', e.target.value)}
                placeholder="80"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="temperature">Temperature (°F)</Label>
              <Input
                id="temperature"
                type="number"
                step="0.1"
                value={vitals.temperature || ''}
                onChange={(e) => handleVitalChange('temperature', e.target.value)}
                placeholder="98.6"
              />
            </div>
            <div>
              <Label htmlFor="respiratoryRate">Respiratory Rate (bpm)</Label>
              <Input
                id="respiratoryRate"
                type="number"
                value={vitals.respiratoryRate || ''}
                onChange={(e) => handleVitalChange('respiratoryRate', e.target.value)}
                placeholder="16"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={recordVitals}
            disabled={loading}
          >
            {loading ? "Recording..." : "Record Vitals"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}