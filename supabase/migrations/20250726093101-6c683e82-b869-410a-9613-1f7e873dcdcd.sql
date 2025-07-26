-- Update app_role enum to include remote_doctor
ALTER TYPE public.app_role ADD VALUE 'remote_doctor';

-- Create consultations table for remote doctor sessions
CREATE TABLE public.consultations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'remote', -- remote, in_person, emergency
  status TEXT NOT NULL DEFAULT 'scheduled', -- scheduled, active, completed, cancelled
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  diagnosis TEXT,
  treatment_plan TEXT,
  recording_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create AI detections table to store computer vision results
CREATE TABLE public.ai_detections (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_id TEXT NOT NULL,
  room TEXT NOT NULL,
  detection_type TEXT NOT NULL, -- person, fall, medical_event, anomaly
  confidence DECIMAL(3,2) NOT NULL,
  bounding_box JSONB, -- {x, y, width, height}
  metadata JSONB, -- additional detection data
  alert_generated BOOLEAN DEFAULT false,
  processed_by_gpt BOOLEAN DEFAULT false,
  gpt_analysis TEXT,
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create prescriptions table for digital prescription management
CREATE TABLE public.prescriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  doctor_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE SET NULL,
  medication_name TEXT NOT NULL,
  dosage TEXT NOT NULL,
  frequency TEXT NOT NULL,
  duration TEXT,
  instructions TEXT,
  status TEXT NOT NULL DEFAULT 'active', -- active, discontinued, completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create patient vitals history for continuous monitoring
CREATE TABLE public.patient_vitals_history (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  patient_id UUID REFERENCES public.patients(id) ON DELETE CASCADE,
  vitals JSONB NOT NULL, -- heart_rate, blood_pressure, temperature, oxygen_sat, etc.
  source TEXT DEFAULT 'manual', -- manual, iot_device, ai_estimation
  recorded_by UUID REFERENCES public.profiles(id),
  timestamp TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create video sessions table for telemedicine records
CREATE TABLE public.video_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  consultation_id UUID REFERENCES public.consultations(id) ON DELETE CASCADE,
  session_id TEXT UNIQUE NOT NULL, -- WebRTC session identifier
  status TEXT NOT NULL DEFAULT 'waiting', -- waiting, active, ended, failed
  participants JSONB, -- array of participant info
  recording_enabled BOOLEAN DEFAULT false,
  recording_url TEXT,
  started_at TIMESTAMP WITH TIME ZONE,
  ended_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all new tables
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_detections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.patient_vitals_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for consultations
CREATE POLICY "Doctors and nurses can view consultations" 
ON public.consultations 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'nurse'::app_role) OR 
  has_role(auth.uid(), 'remote_doctor'::app_role) OR
  doctor_id = auth.uid()
);

CREATE POLICY "Doctors can create consultations" 
ON public.consultations 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'remote_doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctors can update their consultations" 
ON public.consultations 
FOR UPDATE 
USING (
  doctor_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for AI detections
CREATE POLICY "Authenticated users can view AI detections" 
ON public.ai_detections 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert AI detections" 
ON public.ai_detections 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "System can update AI detections" 
ON public.ai_detections 
FOR UPDATE 
USING (true);

-- RLS Policies for prescriptions
CREATE POLICY "Staff can view prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'nurse'::app_role) OR 
  has_role(auth.uid(), 'remote_doctor'::app_role) OR
  doctor_id = auth.uid()
);

CREATE POLICY "Doctors can create prescriptions" 
ON public.prescriptions 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'remote_doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctors can update their prescriptions" 
ON public.prescriptions 
FOR UPDATE 
USING (
  doctor_id = auth.uid() OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- RLS Policies for vitals history
CREATE POLICY "Staff can view vitals history" 
ON public.patient_vitals_history 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Staff can insert vitals" 
ON public.patient_vitals_history 
FOR INSERT 
WITH CHECK (auth.uid() IS NOT NULL);

-- RLS Policies for video sessions
CREATE POLICY "Participants can view video sessions" 
ON public.video_sessions 
FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Doctors can create video sessions" 
ON public.video_sessions 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'remote_doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctors can update video sessions" 
ON public.video_sessions 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'remote_doctor'::app_role) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Add indexes for performance
CREATE INDEX idx_consultations_patient ON public.consultations(patient_id);
CREATE INDEX idx_consultations_doctor ON public.consultations(doctor_id);
CREATE INDEX idx_consultations_time ON public.consultations(start_time);
CREATE INDEX idx_ai_detections_room ON public.ai_detections(room);
CREATE INDEX idx_ai_detections_time ON public.ai_detections(timestamp);
CREATE INDEX idx_prescriptions_patient ON public.prescriptions(patient_id);
CREATE INDEX idx_vitals_history_patient ON public.patient_vitals_history(patient_id);
CREATE INDEX idx_vitals_history_time ON public.patient_vitals_history(timestamp);

-- Create function to automatically update consultation end time
CREATE OR REPLACE FUNCTION public.update_consultation_end_time()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
    NEW.end_time = now();
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for consultation updates
CREATE TRIGGER update_consultations_updated_at
  BEFORE UPDATE ON public.consultations
  FOR EACH ROW
  EXECUTE FUNCTION public.update_consultation_end_time();

-- Create function to log AI detection alerts
CREATE OR REPLACE FUNCTION public.process_ai_detection()
RETURNS TRIGGER AS $$
BEGIN
  -- Generate alert for high-confidence critical detections
  IF NEW.detection_type IN ('fall', 'medical_event') AND NEW.confidence > 0.8 THEN
    INSERT INTO public.alerts (
      type, 
      title, 
      message, 
      room, 
      priority,
      metadata
    ) VALUES (
      'critical',
      'AI Detection Alert',
      format('High confidence %s detected in %s (%.0f%% confidence)', 
        NEW.detection_type, NEW.room, NEW.confidence * 100),
      NEW.room,
      1,
      jsonb_build_object('detection_id', NEW.id, 'ai_generated', true)
    );
    
    NEW.alert_generated = true;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for AI detection processing
CREATE TRIGGER process_ai_detection_alerts
  BEFORE INSERT ON public.ai_detections
  FOR EACH ROW
  EXECUTE FUNCTION public.process_ai_detection();