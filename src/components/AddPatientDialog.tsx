import { useState } from "react";
import { Plus, User, Calendar, MapPin, Activity } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface AddPatientDialogProps {
  onPatientAdded?: () => void;
}

export default function AddPatientDialog({ onPatientAdded }: AddPatientDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    room: '',
    status: 'stable' as 'stable' | 'critical' | 'monitoring',
    conditions: '',
    heartRate: '',
    bloodPressure: '',
    temperature: '',
    oxygenSat: '',
    notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const conditions = formData.conditions
        .split(',')
        .map(c => c.trim())
        .filter(c => c.length > 0);

      const vitals = {
        heartRate: parseInt(formData.heartRate) || 0,
        bloodPressure: formData.bloodPressure || '',
        temperature: parseFloat(formData.temperature) || 0,
        oxygenSat: parseInt(formData.oxygenSat) || 0
      };

      const { error } = await supabase
        .from('patients')
        .insert({
          name: formData.name,
          age: parseInt(formData.age),
          room: formData.room,
          status: formData.status,
          conditions: conditions,
          vitals: vitals,
          notes: formData.notes,
          summary: ''
        });

      if (error) throw error;

      toast.success('Patient added successfully');
      setOpen(false);
      setFormData({
        name: '',
        age: '',
        room: '',
        status: 'stable',
        conditions: '',
        heartRate: '',
        bloodPressure: '',
        temperature: '',
        oxygenSat: '',
        notes: ''
      });

      if (onPatientAdded) onPatientAdded();
    } catch (error) {
      console.error('Error adding patient:', error);
      toast.error('Failed to add patient');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="medical-button">
          <Plus className="w-4 h-4 mr-2" />
          Add Patient
        </Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <User className="w-5 h-5" />
            <span>Add New Patient</span>
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <User className="w-4 h-4" />
              <span>Basic Information</span>
            </h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Enter patient name"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="age">Age *</Label>
                <Input
                  id="age"
                  type="number"
                  value={formData.age}
                  onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                  placeholder="Age"
                  min="0"
                  max="150"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="room">Room *</Label>
                <Input
                  id="room"
                  value={formData.room}
                  onChange={(e) => setFormData({ ...formData, room: e.target.value })}
                  placeholder="e.g., ICU-001, WARD-101"
                  required
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status *</Label>
                <Select value={formData.status} onValueChange={(value: any) => setFormData({ ...formData, status: value })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stable">Stable</SelectItem>
                    <SelectItem value="monitoring">Monitoring</SelectItem>
                    <SelectItem value="critical">Critical</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Medical Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Medical Information</span>
            </h3>
            
            <div className="space-y-2">
              <Label htmlFor="conditions">Conditions/Diagnoses</Label>
              <Input
                id="conditions"
                value={formData.conditions}
                onChange={(e) => setFormData({ ...formData, conditions: e.target.value })}
                placeholder="Separate multiple conditions with commas"
              />
              <p className="text-xs text-muted-foreground">e.g., Pneumonia, Hypertension, Diabetes</p>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="heartRate">Heart Rate (bpm)</Label>
                <Input
                  id="heartRate"
                  type="number"
                  value={formData.heartRate}
                  onChange={(e) => setFormData({ ...formData, heartRate: e.target.value })}
                  placeholder="e.g., 72"
                  min="0"
                  max="300"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="bloodPressure">Blood Pressure</Label>
                <Input
                  id="bloodPressure"
                  value={formData.bloodPressure}
                  onChange={(e) => setFormData({ ...formData, bloodPressure: e.target.value })}
                  placeholder="e.g., 120/80"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="temperature">Temperature (°F)</Label>
                <Input
                  id="temperature"
                  type="number"
                  step="0.1"
                  value={formData.temperature}
                  onChange={(e) => setFormData({ ...formData, temperature: e.target.value })}
                  placeholder="e.g., 98.6"
                  min="80"
                  max="110"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="oxygenSat">Oxygen Saturation (%)</Label>
                <Input
                  id="oxygenSat"
                  type="number"
                  value={formData.oxygenSat}
                  onChange={(e) => setFormData({ ...formData, oxygenSat: e.target.value })}
                  placeholder="e.g., 98"
                  min="0"
                  max="100"
                />
              </div>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="notes">Additional Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                placeholder="Any additional notes or observations..."
                rows={3}
              />
            </div>
          </div>

          {/* Submit */}
          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="medical-button">
              {loading ? 'Adding...' : 'Add Patient'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}