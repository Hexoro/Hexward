-- Add RLS policies for new tables

-- Consultations policies
CREATE POLICY "Doctors and patients can view their consultations" 
ON public.consultations 
FOR SELECT 
USING (
  auth.uid() = doctor_id OR 
  auth.uid() = patient_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctors can create consultations" 
ON public.consultations 
FOR INSERT 
WITH CHECK (
  auth.uid() = doctor_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctors can update their consultations" 
ON public.consultations 
FOR UPDATE 
USING (
  auth.uid() = doctor_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- AI Detections policies
CREATE POLICY "Staff can view AI detections" 
ON public.ai_detections 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'nurse'::app_role) OR 
  has_role(auth.uid(), 'remote_doctor'::app_role)
);

CREATE POLICY "System can insert AI detections" 
ON public.ai_detections 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Staff can update AI detections" 
ON public.ai_detections 
FOR UPDATE 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'nurse'::app_role)
);

-- Prescriptions policies
CREATE POLICY "Doctors and patients can view prescriptions" 
ON public.prescriptions 
FOR SELECT 
USING (
  auth.uid() = doctor_id OR 
  auth.uid() = patient_id OR 
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'nurse'::app_role)
);

CREATE POLICY "Doctors can manage prescriptions" 
ON public.prescriptions 
FOR ALL 
USING (
  auth.uid() = doctor_id OR 
  has_role(auth.uid(), 'admin'::app_role)
);

-- Patient vitals history policies
CREATE POLICY "Staff can view patient vitals history" 
ON public.patient_vitals_history 
FOR SELECT 
USING (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'nurse'::app_role) OR 
  has_role(auth.uid(), 'remote_doctor'::app_role)
);

CREATE POLICY "Staff can record patient vitals" 
ON public.patient_vitals_history 
FOR INSERT 
WITH CHECK (
  has_role(auth.uid(), 'admin'::app_role) OR 
  has_role(auth.uid(), 'nurse'::app_role) OR 
  auth.uid() = recorded_by
);

-- Video sessions policies
CREATE POLICY "Participants can view their video sessions" 
ON public.video_sessions 
FOR SELECT 
USING (
  auth.uid() IN (
    SELECT jsonb_array_elements_text(participants)::uuid
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Doctors can manage video sessions" 
ON public.video_sessions 
FOR ALL 
USING (
  auth.uid() IN (
    SELECT jsonb_array_elements_text(participants)::uuid
  ) OR 
  has_role(auth.uid(), 'admin'::app_role)
);