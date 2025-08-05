/**
 * Medication scheduling and reminder system
 */
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Bell, Clock, Pill, Plus, Trash2, Calendar } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface MedicationAlert {
  id: string;
  patient_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  next_dose_time: string;
  instructions?: string;
  status: 'active' | 'completed' | 'paused';
  created_at: string;
}

interface MedicationScheduleDialogProps {
  patientId: string;
  patientName: string;
  trigger?: React.ReactNode;
}

export default function MedicationScheduleDialog({ patientId, patientName, trigger }: MedicationScheduleDialogProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [medications, setMedications] = useState<MedicationAlert[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    medication_name: '',
    dosage: '',
    frequency: '',
    start_time: '',
    instructions: ''
  });

  const fetchMedications = async () => {
    if (!patientId) return;
    
    setLoading(true);
    try {
      // For now, we'll store medication alerts in the alerts table with a specific type
      const { data, error } = await supabase
        .from('alerts')
        .select('*')
        .eq('patient_id', patientId)
        .eq('type', 'medication')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Transform alerts to medication format
      const meds: MedicationAlert[] = (data || []).map(alert => ({
        id: alert.id,
        patient_id: alert.patient_id!,
        medication_name: alert.title.replace('Medication: ', ''),
        dosage: 'As prescribed', // Would be in alert details
        frequency: 'Daily', // Would be in alert details
        next_dose_time: alert.created_at,
        instructions: alert.message,
        status: alert.acknowledged ? 'completed' : 'active',
        created_at: alert.created_at
      }));
      
      setMedications(meds);
    } catch (error) {
      console.error('Error fetching medications:', error);
      toast.error('Failed to load medication schedule');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen && patientId) {
      fetchMedications();
    }
  }, [isOpen, patientId]);

  const calculateNextDoseTime = (frequency: string, startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    
    let intervalHours = 24; // Default daily
    
    switch (frequency) {
      case 'every_4_hours':
        intervalHours = 4;
        break;
      case 'every_6_hours':
        intervalHours = 6;
        break;
      case 'every_8_hours':
        intervalHours = 8;
        break;
      case 'twice_daily':
        intervalHours = 12;
        break;
      case 'three_times_daily':
        intervalHours = 8;
        break;
      case 'daily':
        intervalHours = 24;
        break;
    }
    
    // Find next dose time
    let nextDose = new Date(start);
    while (nextDose <= now) {
      nextDose.setHours(nextDose.getHours() + intervalHours);
    }
    
    return nextDose.toISOString();
  };

  const handleScheduleMedication = async () => {
    if (!formData.medication_name || !formData.dosage || !formData.frequency || !formData.start_time) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      const nextDoseTime = calculateNextDoseTime(formData.frequency, formData.start_time);
      
      const { error } = await supabase
        .from('alerts')
        .insert({
          type: 'medication',
          title: `Medication: ${formData.medication_name}`,
          message: `${formData.dosage} - ${formData.instructions || 'As prescribed'}`,
          room: 'Pharmacy', // Could be patient room
          patient_id: patientId,
          priority: 2,
          acknowledged: false,
          notes: JSON.stringify({
            medication_name: formData.medication_name,
            dosage: formData.dosage,
            frequency: formData.frequency,
            next_dose_time: nextDoseTime,
            instructions: formData.instructions
          })
        });

      if (error) throw error;
      
      toast.success('Medication scheduled successfully');
      setFormData({
        medication_name: '',
        dosage: '',
        frequency: '',
        start_time: '',
        instructions: ''
      });
      fetchMedications();
    } catch (error) {
      console.error('Error scheduling medication:', error);
      toast.error('Failed to schedule medication');
    }
  };

  const handleDeleteMedication = async (medicationId: string) => {
    try {
      const { error } = await supabase
        .from('alerts')
        .delete()
        .eq('id', medicationId);

      if (error) throw error;
      
      toast.success('Medication schedule removed');
      fetchMedications();
    } catch (error) {
      console.error('Error deleting medication:', error);
      toast.error('Failed to remove medication schedule');
    }
  };

  const formatDateTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleString();
  };

  const getFrequencyLabel = (frequency: string) => {
    switch (frequency) {
      case 'every_4_hours': return 'Every 4 hours';
      case 'every_6_hours': return 'Every 6 hours';
      case 'every_8_hours': return 'Every 8 hours';
      case 'twice_daily': return 'Twice daily';
      case 'three_times_daily': return 'Three times daily';
      case 'daily': return 'Once daily';
      default: return frequency;
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <Bell className="w-4 h-4 mr-2" />
            Medication Schedule
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Pill className="w-5 h-5" />
            <span>Medication Schedule - {patientName}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Add New Medication */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Plus className="w-5 h-5" />
                <span>Schedule New Medication</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="medication_name">Medication Name *</Label>
                <Input
                  id="medication_name"
                  value={formData.medication_name}
                  onChange={(e) => setFormData({ ...formData, medication_name: e.target.value })}
                  placeholder="e.g., Aspirin, Insulin"
                />
              </div>

              <div>
                <Label htmlFor="dosage">Dosage *</Label>
                <Input
                  id="dosage"
                  value={formData.dosage}
                  onChange={(e) => setFormData({ ...formData, dosage: e.target.value })}
                  placeholder="e.g., 100mg, 2 tablets"
                />
              </div>

              <div>
                <Label htmlFor="frequency">Frequency *</Label>
                <Select value={formData.frequency} onValueChange={(value) => setFormData({ ...formData, frequency: value })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select frequency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="every_4_hours">Every 4 hours</SelectItem>
                    <SelectItem value="every_6_hours">Every 6 hours</SelectItem>
                    <SelectItem value="every_8_hours">Every 8 hours</SelectItem>
                    <SelectItem value="twice_daily">Twice daily</SelectItem>
                    <SelectItem value="three_times_daily">Three times daily</SelectItem>
                    <SelectItem value="daily">Once daily</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="start_time">First Dose Time *</Label>
                <Input
                  id="start_time"
                  type="datetime-local"
                  value={formData.start_time}
                  onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="instructions">Instructions</Label>
                <Textarea
                  id="instructions"
                  value={formData.instructions}
                  onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                  placeholder="Special instructions, warnings, etc."
                  rows={3}
                />
              </div>

              <Button onClick={handleScheduleMedication} className="w-full">
                <Clock className="w-4 h-4 mr-2" />
                Schedule Medication
              </Button>
            </CardContent>
          </Card>

          {/* Current Medications */}
          <Card className="medical-card">
            <CardHeader>
              <CardTitle className="text-lg flex items-center space-x-2">
                <Calendar className="w-5 h-5" />
                <span>Current Schedule ({medications.length})</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
              ) : medications.length === 0 ? (
                <div className="text-center py-8">
                  <Pill className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <p className="text-muted-foreground">No medications scheduled</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {medications.map((medication) => (
                    <div key={medication.id} className="p-4 border border-border rounded-lg">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">{medication.medication_name}</h4>
                          <p className="text-sm text-muted-foreground">{medication.dosage}</p>
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded ${
                            medication.status === 'active' ? 'bg-success/10 text-success' :
                            medication.status === 'completed' ? 'bg-muted text-muted-foreground' :
                            'bg-warning/10 text-warning'
                          }`}>
                            {medication.status}
                          </span>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteMedication(medication.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Frequency:</span>
                          <span>{getFrequencyLabel(medication.frequency)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-muted-foreground">Next Dose:</span>
                          <span>{formatDateTime(medication.next_dose_time)}</span>
                        </div>
                        {medication.instructions && (
                          <div className="mt-2">
                            <p className="text-muted-foreground">Instructions:</p>
                            <p className="text-sm bg-muted/50 p-2 rounded mt-1">{medication.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-end pt-4">
          <Button onClick={() => setIsOpen(false)}>Close</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}