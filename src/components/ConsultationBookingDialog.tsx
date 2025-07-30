/**
 * Dialog for booking remote consultations
 */
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Video, Calendar } from "lucide-react";

interface ConsultationBookingDialogProps {
  patientId: string;
  patientName: string;
  onConsultationBooked?: () => void;
}

export default function ConsultationBookingDialog({ 
  patientId, 
  patientName, 
  onConsultationBooked 
}: ConsultationBookingDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    doctorId: '',
    startTime: '',
    type: 'remote' as 'remote' | 'in_person',
    notes: '',
  });

  const { toast } = useToast();

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const bookConsultation = async () => {
    try {
      setLoading(true);

      const { error } = await supabase
        .from('consultations')
        .insert({
          patient_id: patientId,
          doctor_id: formData.doctorId || (await supabase.auth.getUser()).data.user?.id,
          start_time: formData.startTime,
          type: formData.type,
          status: 'scheduled',
          notes: formData.notes,
        });

      if (error) throw error;

      toast({
        title: "Consultation Booked",
        description: `Remote consultation scheduled for ${patientName}`,
      });

      setOpen(false);
      onConsultationBooked?.();
      
      // Reset form
      setFormData({
        doctorId: '',
        startTime: '',
        type: 'remote',
        notes: '',
      });

    } catch (error) {
      console.error('Error booking consultation:', error);
      toast({
        title: "Error",
        description: "Failed to book consultation",
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
          <Video className="w-4 h-4 mr-2" />
          Book Consultation
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Book Remote Consultation</DialogTitle>
          <DialogDescription>
            Schedule a remote consultation for {patientName}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label htmlFor="type">Consultation Type</Label>
            <Select value={formData.type} onValueChange={(value) => handleInputChange('type', value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="remote">Remote Video Call</SelectItem>
                <SelectItem value="in_person">In-Person Visit</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="startTime">Date & Time</Label>
            <Input
              id="startTime"
              type="datetime-local"
              value={formData.startTime}
              onChange={(e) => handleInputChange('startTime', e.target.value)}
              min={new Date().toISOString().slice(0, 16)}
            />
          </div>

          <div>
            <Label htmlFor="doctorId">Doctor ID (Optional)</Label>
            <Input
              id="doctorId"
              type="text"
              value={formData.doctorId}
              onChange={(e) => handleInputChange('doctorId', e.target.value)}
              placeholder="Leave empty to assign to current user"
            />
          </div>

          <div>
            <Label htmlFor="notes">Additional Notes</Label>
            <Textarea
              id="notes"
              value={formData.notes}
              onChange={(e) => handleInputChange('notes', e.target.value)}
              placeholder="Reason for consultation, special requirements, etc."
              rows={3}
            />
          </div>
        </div>
        <DialogFooter>
          <Button
            type="button"
            onClick={bookConsultation}
            disabled={loading || !formData.startTime}
          >
            {loading ? "Booking..." : "Book Consultation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}