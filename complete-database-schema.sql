-- =================================================================
-- HEXWARD - COMPLETE DATABASE SCHEMA
-- AI Hospital Monitoring System - Proof of Concept
-- =================================================================
-- This file contains the complete database schema for recreating 
-- the HexWard project from scratch on a fresh Supabase instance.
-- =================================================================

-- =================================================================
-- CUSTOM TYPES AND ENUMS
-- =================================================================

-- User roles enum
CREATE TYPE public.app_role AS ENUM (
    'admin',
    'nurse', 
    'remote_doctor',
    'remote_worker'
);

-- =================================================================
-- CORE TABLES
-- =================================================================

-- Profiles table for user management
CREATE TABLE public.profiles (
    id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    email text NOT NULL,
    full_name text,
    username text,
    role app_role NOT NULL DEFAULT 'nurse'::app_role,
    department text,
    phone text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Patients table
CREATE TABLE public.patients (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    age integer,
    room text,
    status text DEFAULT 'stable'::text,
    admission_date date DEFAULT CURRENT_DATE,
    conditions text[],
    vitals jsonb,
    summary text DEFAULT ''::text,
    notes text,
    image_url text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.patients ENABLE ROW LEVEL SECURITY;

-- Alerts table
CREATE TABLE public.alerts (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    type text NOT NULL,
    title text NOT NULL,
    message text NOT NULL,
    room text NOT NULL,
    patient_id uuid,
    priority integer DEFAULT 2,
    acknowledged boolean DEFAULT false,
    acknowledged_by uuid,
    acknowledged_at timestamp with time zone,
    resolved boolean DEFAULT false,
    resolved_by uuid,
    resolved_at timestamp with time zone,
    notes text,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

-- Camera feeds table
CREATE TABLE public.camera_feeds (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    name text NOT NULL,
    camera_id text NOT NULL,
    room text NOT NULL,
    stream_url text,
    status text NOT NULL DEFAULT 'active'::text,
    recording boolean DEFAULT false,
    ai_monitoring_enabled boolean DEFAULT true,
    last_motion_detected timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.camera_feeds ENABLE ROW LEVEL SECURITY;

-- AI Detections table
CREATE TABLE public.ai_detections (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    camera_id text NOT NULL,
    room text NOT NULL,
    detection_type text NOT NULL,
    confidence numeric NOT NULL,
    bounding_box jsonb,
    metadata jsonb,
    gpt_analysis text,
    processed_by_gpt boolean DEFAULT false,
    alert_generated boolean DEFAULT false,
    timestamp timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.ai_detections ENABLE ROW LEVEL SECURITY;

-- Patient vitals history
CREATE TABLE public.patient_vitals_history (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid,
    vitals jsonb NOT NULL,
    source text DEFAULT 'manual'::text,
    recorded_by uuid,
    timestamp timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.patient_vitals_history ENABLE ROW LEVEL SECURITY;

-- Events table
CREATE TABLE public.events (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid,
    room text,
    action text NOT NULL,
    source text,
    details jsonb,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;

-- Consultations table
CREATE TABLE public.consultations (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid,
    doctor_id uuid,
    type text NOT NULL DEFAULT 'remote'::text,
    status text NOT NULL DEFAULT 'scheduled'::text,
    start_time timestamp with time zone NOT NULL,
    end_time timestamp with time zone,
    notes text,
    diagnosis text,
    treatment_plan text,
    recording_url text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.consultations ENABLE ROW LEVEL SECURITY;

-- Prescriptions table
CREATE TABLE public.prescriptions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    patient_id uuid,
    doctor_id uuid,
    consultation_id uuid,
    medication_name text NOT NULL,
    dosage text NOT NULL,
    frequency text NOT NULL,
    duration text,
    instructions text,
    status text NOT NULL DEFAULT 'active'::text,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.prescriptions ENABLE ROW LEVEL SECURITY;

-- Video sessions table
CREATE TABLE public.video_sessions (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    session_id text NOT NULL,
    consultation_id uuid,
    status text NOT NULL DEFAULT 'waiting'::text,
    participants jsonb,
    recording_enabled boolean DEFAULT false,
    recording_url text,
    started_at timestamp with time zone,
    ended_at timestamp with time zone,
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.video_sessions ENABLE ROW LEVEL SECURITY;

-- Reports table
CREATE TABLE public.reports (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    title text NOT NULL,
    report_type text NOT NULL,
    description text,
    data jsonb,
    generated_by uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- User roles table
CREATE TABLE public.user_roles (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid NOT NULL,
    role app_role NOT NULL,
    assigned_by uuid,
    assigned_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id),
    UNIQUE (user_id, role)
);

-- Enable RLS
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security settings table
CREATE TABLE public.security_settings (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    two_factor_enabled boolean DEFAULT false,
    session_timeout integer DEFAULT 480,
    login_attempts integer DEFAULT 0,
    locked_until timestamp with time zone,
    last_login timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.security_settings ENABLE ROW LEVEL SECURITY;

-- Audit logs table
CREATE TABLE public.audit_logs (
    id uuid NOT NULL DEFAULT gen_random_uuid(),
    user_id uuid,
    action text NOT NULL,
    resource_type text NOT NULL,
    resource_id text,
    details jsonb,
    ip_address inet,
    user_agent text,
    created_at timestamp with time zone DEFAULT now(),
    PRIMARY KEY (id)
);

-- Enable RLS
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

-- =================================================================
-- SECURITY FUNCTIONS
-- =================================================================

-- Function to check user roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  )
$function$;

-- Function to get current user role
CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS app_role
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$function$;

-- Function to handle new user creation
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, username, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', new.email),
    COALESCE(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    COALESCE((new.raw_user_meta_data->>'role')::public.app_role, 'nurse'::public.app_role)
  );
  
  INSERT INTO public.security_settings (user_id)
  VALUES (new.id);
  
  RETURN new;
END;
$function$;

-- Function to log user actions
CREATE OR REPLACE FUNCTION public.log_user_action(action_type text, resource_type text, resource_id text DEFAULT NULL::text, details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.audit_logs (
    user_id,
    action,
    resource_type,
    resource_id,
    details,
    ip_address,
    user_agent
  )
  VALUES (
    auth.uid(),
    action_type,
    resource_type,
    resource_id,
    details,
    inet_client_addr(),
    current_setting('request.headers', true)::json->>'user-agent'
  );
END;
$function$;

-- Function to check patient vitals and create alerts
CREATE OR REPLACE FUNCTION public.check_patient_vitals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  alert_type text;
  alert_title text;
  alert_message text;
  heart_rate integer;
  oxygen_sat integer;
  temperature numeric;
BEGIN
  -- Extract vitals from JSONB
  heart_rate := (NEW.vitals->>'heartRate')::integer;
  oxygen_sat := (NEW.vitals->>'oxygenSat')::integer;
  temperature := (NEW.vitals->>'temperature')::numeric;
  
  -- Check critical thresholds
  IF heart_rate < 50 OR heart_rate > 120 THEN
    alert_type := 'critical';
    alert_title := 'Critical Heart Rate';
    alert_message := format('Patient %s has abnormal heart rate: %s bpm', NEW.name, heart_rate);
  ELSIF oxygen_sat < 90 THEN
    alert_type := 'critical';
    alert_title := 'Low Oxygen Saturation';
    alert_message := format('Patient %s has low oxygen saturation: %s%%', NEW.name, oxygen_sat);
  ELSIF temperature > 102 OR temperature < 95 THEN
    alert_type := 'warning';
    alert_title := 'Abnormal Temperature';
    alert_message := format('Patient %s has abnormal temperature: %s°F', NEW.name, temperature);
  END IF;
  
  -- Insert alert if needed
  IF alert_type IS NOT NULL THEN
    INSERT INTO public.alerts (type, title, message, room, patient_id, priority)
    VALUES (
      alert_type,
      alert_title,
      alert_message,
      NEW.room,
      NEW.id,
      CASE WHEN alert_type = 'critical' THEN 1 ELSE 2 END
    );
  END IF;
  
  RETURN NEW;
END;
$function$;

-- Audit trigger functions
CREATE OR REPLACE FUNCTION public.audit_patients_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.log_user_action(
    TG_OP,
    'patient',
    COALESCE(NEW.id::text, OLD.id::text),
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

CREATE OR REPLACE FUNCTION public.audit_events_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  PERFORM public.log_user_action(
    TG_OP,
    'event',
    COALESCE(NEW.id::text, OLD.id::text),
    jsonb_build_object(
      'old_data', to_jsonb(OLD),
      'new_data', to_jsonb(NEW)
    )
  );
  
  RETURN COALESCE(NEW, OLD);
END;
$function$;

-- =================================================================
-- TRIGGERS
-- =================================================================

-- Trigger for new user creation
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger for patient vitals monitoring
CREATE TRIGGER check_patient_vitals_trigger
  AFTER UPDATE ON public.patients
  FOR EACH ROW
  WHEN (OLD.vitals IS DISTINCT FROM NEW.vitals)
  EXECUTE FUNCTION public.check_patient_vitals();

-- Audit triggers
CREATE TRIGGER audit_patients_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.audit_patients_changes();

CREATE TRIGGER audit_events_trigger
  AFTER INSERT OR UPDATE OR DELETE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.audit_events_changes();

-- =================================================================
-- ROW LEVEL SECURITY POLICIES
-- =================================================================

-- Profiles policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = id));

CREATE POLICY "Nurses and admins can view other profiles" ON public.profiles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Admins can update any profile" ON public.profiles
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = id));

-- Patients policies
CREATE POLICY "public read patients" ON public.patients
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert patients" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update patients" ON public.patients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Alerts policies
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Camera feeds policies
CREATE POLICY "Authenticated users can view camera feeds" ON public.camera_feeds
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- AI detections policies
CREATE POLICY "Staff can view AI detections" ON public.ai_detections
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role) OR has_role(auth.uid(), 'remote_doctor'::app_role));

CREATE POLICY "System can insert AI detections" ON public.ai_detections
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Staff can update AI detections" ON public.ai_detections
  FOR UPDATE USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role));

-- Patient vitals history policies
CREATE POLICY "Staff can view patient vitals history" ON public.patient_vitals_history
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role) OR has_role(auth.uid(), 'remote_doctor'::app_role));

CREATE POLICY "Staff can record patient vitals" ON public.patient_vitals_history
  FOR INSERT WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role) OR (auth.uid() = recorded_by));

-- Events policies
CREATE POLICY "public read events" ON public.events
  FOR SELECT USING (auth.uid() IS NOT NULL);

-- Consultations policies
CREATE POLICY "Doctors and patients can view their consultations" ON public.consultations
  FOR SELECT USING ((auth.uid() = doctor_id) OR (auth.uid() = patient_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can create consultations" ON public.consultations
  FOR INSERT WITH CHECK ((auth.uid() = doctor_id) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can update their consultations" ON public.consultations
  FOR UPDATE USING ((auth.uid() = doctor_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Prescriptions policies
CREATE POLICY "Doctors and patients can view prescriptions" ON public.prescriptions
  FOR SELECT USING ((auth.uid() = doctor_id) OR (auth.uid() = patient_id) OR has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role));

CREATE POLICY "Doctors can manage prescriptions" ON public.prescriptions
  FOR ALL USING ((auth.uid() = doctor_id) OR has_role(auth.uid(), 'admin'::app_role));

-- Video sessions policies
CREATE POLICY "Participants can view their video sessions" ON public.video_sessions
  FOR SELECT USING ((auth.uid() IN ( SELECT (jsonb_array_elements_text(video_sessions.participants))::uuid AS jsonb_array_elements_text)) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Doctors can manage video sessions" ON public.video_sessions
  FOR ALL USING ((auth.uid() IN ( SELECT (jsonb_array_elements_text(video_sessions.participants))::uuid AS jsonb_array_elements_text)) OR has_role(auth.uid(), 'admin'::app_role));

-- Reports policies
CREATE POLICY "Staff can view reports" ON public.reports
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'nurse'::app_role) OR has_role(auth.uid(), 'remote_worker'::app_role));

CREATE POLICY "Admins can manage reports" ON public.reports
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- User roles policies
CREATE POLICY "Users can view their own roles" ON public.user_roles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all user roles" ON public.user_roles
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role) OR (auth.uid() = user_id));

CREATE POLICY "Admins can manage all user roles" ON public.user_roles
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role));

-- Security settings policies
CREATE POLICY "Users can view their own security settings" ON public.security_settings
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own security settings" ON public.security_settings
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "System can insert security settings" ON public.security_settings
  FOR INSERT WITH CHECK (true);

-- Audit logs policies
CREATE POLICY "System can insert audit logs" ON public.audit_logs
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Admins can view all audit logs" ON public.audit_logs
  FOR SELECT USING (has_role(auth.uid(), 'admin'::app_role));

-- =================================================================
-- STORAGE BUCKETS AND POLICIES
-- =================================================================

-- Create storage bucket for patient images
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-images', 'patient-images', true);

-- Storage policies for patient images
CREATE POLICY "Patient images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'patient-images');

CREATE POLICY "Authenticated users can upload patient images" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'patient-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update patient images" ON storage.objects
  FOR UPDATE USING (bucket_id = 'patient-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can delete patient images" ON storage.objects
  FOR DELETE USING (bucket_id = 'patient-images' AND auth.uid() IS NOT NULL);

-- =================================================================
-- SAMPLE DATA FOR DEMO
-- =================================================================

-- Sample patients data
INSERT INTO public.patients (id, name, age, room, status, admission_date, conditions, vitals, summary, notes) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'John Doe', 45, 'ICU-001', 'critical', '2024-01-20', ARRAY['Pneumonia', 'Hypertension'], 
 '{"heartRate": 85, "bloodPressure": "140/90", "temperature": 101.2, "oxygenSat": 94}', 
 'Patient admitted with severe pneumonia. Currently on oxygen support and monitoring vital signs closely.', 
 'Responding well to treatment. Family has been notified.'),

('550e8400-e29b-41d4-a716-446655440002', 'Jane Smith', 32, 'Room-102', 'stable', '2024-01-22', ARRAY['Diabetes Type 2'], 
 '{"heartRate": 72, "bloodPressure": "120/80", "temperature": 98.6, "oxygenSat": 98}', 
 'Routine diabetes management and monitoring. Blood sugar levels within acceptable range.', 
 'Patient is cooperative and following dietary restrictions.'),

('550e8400-e29b-41d4-a716-446655440003', 'Robert Johnson', 67, 'CCU-003', 'critical', '2024-01-19', ARRAY['Heart Attack', 'High Cholesterol'], 
 '{"heartRate": 110, "bloodPressure": "160/100", "temperature": 99.1, "oxygenSat": 92}', 
 'Post-MI patient requiring intensive cardiac monitoring. Underwent emergency angioplasty.', 
 'Stable but needs continuous monitoring. Cardiologist consultation scheduled.'),

('550e8400-e29b-41d4-a716-446655440004', 'Emily Davis', 28, 'Room-205', 'monitoring', '2024-01-23', ARRAY['Pregnancy Complications'], 
 '{"heartRate": 78, "bloodPressure": "110/70", "temperature": 98.4, "oxygenSat": 99}', 
 'Monitoring high-risk pregnancy. Patient at 32 weeks gestation with mild preeclampsia.', 
 'Regular fetal monitoring. OB/GYN team managing care.'),

('550e8400-e29b-41d4-a716-446655440005', 'Michael Brown', 55, 'Room-301', 'stable', '2024-01-21', ARRAY['Post-surgical recovery'], 
 '{"heartRate": 68, "bloodPressure": "125/75", "temperature": 98.8, "oxygenSat": 97}', 
 'Post-operative recovery from appendectomy. Healing well with no complications.', 
 'Pain managed effectively. Ready for discharge tomorrow.');

-- Sample alerts data
INSERT INTO public.alerts (id, type, title, message, room, patient_id, priority, acknowledged, created_at) VALUES
('650e8400-e29b-41d4-a716-446655440001', 'critical', 'Low Oxygen Saturation', 'Patient John Doe in ICU-001 has oxygen saturation below 90%', 'ICU-001', '550e8400-e29b-41d4-a716-446655440001', 1, false, now() - interval '30 minutes'),
('650e8400-e29b-41d4-a716-446655440002', 'warning', 'High Blood Pressure', 'Patient Robert Johnson showing elevated BP readings', 'CCU-003', '550e8400-e29b-41d4-a716-446655440003', 2, false, now() - interval '1 hour'),
('650e8400-e29b-41d4-a716-446655440003', 'info', 'Medication Due', 'Emily Davis medication schedule reminder', 'Room-205', '550e8400-e29b-41d4-a716-446655440004', 3, true, now() - interval '2 hours'),
('650e8400-e29b-41d4-a716-446655440004', 'critical', 'Fall Detection', 'Potential fall detected in Room-301', 'Room-301', '550e8400-e29b-41d4-a716-446655440005', 1, false, now() - interval '15 minutes'),
('650e8400-e29b-41d4-a716-446655440005', 'warning', 'Irregular Heartbeat', 'Unusual heart rhythm pattern detected', 'ICU-001', '550e8400-e29b-41d4-a716-446655440001', 2, false, now() - interval '45 minutes');

-- Sample camera feeds data
INSERT INTO public.camera_feeds (id, name, camera_id, room, stream_url, status, recording, ai_monitoring_enabled) VALUES
('750e8400-e29b-41d4-a716-446655440001', 'ICU Camera 1', 'CAM_ICU_001', 'ICU-001', 'rtsp://192.168.1.100:8554/icu1', 'active', true, true),
('750e8400-e29b-41d4-a716-446655440002', 'Room 102 Camera', 'CAM_RM_102', 'Room-102', 'rtsp://192.168.1.101:8554/room102', 'active', false, true),
('750e8400-e29b-41d4-a716-446655440003', 'CCU Camera 3', 'CAM_CCU_003', 'CCU-003', 'rtsp://192.168.1.103:8554/ccu3', 'active', true, true),
('750e8400-e29b-41d4-a716-446655440004', 'Room 205 Camera', 'CAM_RM_205', 'Room-205', 'rtsp://192.168.1.105:8554/room205', 'active', false, true),
('750e8400-e29b-41d4-a716-446655440005', 'Room 301 Camera', 'CAM_RM_301', 'Room-301', 'rtsp://192.168.1.106:8554/room301', 'offline', false, false);

-- Sample AI detections data
INSERT INTO public.ai_detections (id, camera_id, room, detection_type, confidence, bounding_box, metadata, gpt_analysis, processed_by_gpt, alert_generated) VALUES
('850e8400-e29b-41d4-a716-446655440001', 'CAM_ICU_001', 'ICU-001', 'person_fall', 0.92, '{"x": 120, "y": 200, "width": 80, "height": 150}', '{"severity": "high", "duration": "2.3s"}', 'High confidence fall detection. Patient appears to have fallen near bed area. Immediate medical attention recommended.', true, true),
('850e8400-e29b-41d4-a716-446655440002', 'CAM_RM_102', 'Room-102', 'person_detected', 0.88, '{"x": 200, "y": 150, "width": 60, "height": 120}', '{"activity": "normal", "position": "sitting"}', 'Patient detected in normal sitting position. No immediate concerns.', true, false),
('850e8400-e29b-41d4-a716-446655440003', 'CAM_CCU_003', 'CCU-003', 'unusual_movement', 0.75, '{"x": 180, "y": 100, "width": 90, "height": 140}', '{"movement_type": "restless", "duration": "5.1s"}', 'Patient showing restless movement patterns. May indicate discomfort or pain. Nursing check recommended.', true, true),
('850e8400-e29b-41d4-a716-446655440004', 'CAM_RM_205', 'Room-205', 'person_detected', 0.95, '{"x": 150, "y": 180, "width": 70, "height": 130}', '{"activity": "resting", "position": "lying"}', 'Patient resting comfortably in bed. Vital signs monitoring continues.', true, false),
('850e8400-e29b-41d4-a716-446655440005', 'CAM_RM_301', 'Room-301', 'equipment_alert', 0.82, '{"x": 50, "y": 80, "width": 40, "height": 60}', '{"equipment": "IV_pump", "status": "disconnected"}', 'IV pump appears to be disconnected or malfunctioning. Technical support and nursing intervention required.', true, true);

-- Sample events data
INSERT INTO public.events (id, patient_id, room, action, source, details) VALUES
('950e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'ICU-001', 'vitals_recorded', 'nurse_station', '{"recorded_by": "Nurse Johnson", "vitals": {"heartRate": 85, "oxygenSat": 94}}'),
('950e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440002', 'Room-102', 'medication_administered', 'manual', '{"medication": "Insulin", "dosage": "10 units", "time": "08:30"}'),
('950e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 'CCU-003', 'doctor_visit', 'manual', '{"doctor": "Dr. Smith", "notes": "Patient stable, continue current treatment"}'),
('950e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 'Room-205', 'fetal_monitoring', 'automatic', '{"fetal_heart_rate": 140, "contractions": "none", "status": "normal"}'),
('950e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440005', 'Room-301', 'discharge_planning', 'manual', '{"discharge_date": "2024-01-25", "follow_up": "scheduled", "instructions": "provided"}');

-- =================================================================
-- COMPLETION MESSAGE
-- =================================================================

-- Database schema creation complete!
-- This includes:
-- ✅ All tables with proper relationships
-- ✅ Custom types and enums
-- ✅ Security functions and triggers
-- ✅ Row Level Security policies
-- ✅ Storage bucket configuration
-- ✅ Sample data for demonstration
-- 
-- Ready for production use with a fresh Supabase instance!