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