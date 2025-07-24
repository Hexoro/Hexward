-- Create alerts table
CREATE TABLE public.alerts (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL CHECK (type IN ('critical', 'warning', 'info')),
  title text NOT NULL,
  message text NOT NULL,
  room text NOT NULL,
  patient_id uuid REFERENCES public.patients(id) ON DELETE SET NULL,
  acknowledged boolean DEFAULT false,
  acknowledged_by uuid,
  acknowledged_at timestamp with time zone,
  priority integer DEFAULT 2 CHECK (priority BETWEEN 1 AND 3),
  notes text,
  resolved boolean DEFAULT false,
  resolved_by uuid,
  resolved_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create camera_feeds table
CREATE TABLE public.camera_feeds (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  camera_id text UNIQUE NOT NULL,
  name text NOT NULL,
  room text NOT NULL,
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'maintenance', 'critical')),
  stream_url text,
  recording boolean DEFAULT false,
  last_motion_detected timestamp with time zone,
  ai_monitoring_enabled boolean DEFAULT true,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Update patients table to allow INSERT/UPDATE operations
ALTER TABLE public.patients 
  ADD COLUMN IF NOT EXISTS age integer,
  ADD COLUMN IF NOT EXISTS admission_date date DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS conditions text[],
  ADD COLUMN IF NOT EXISTS vitals jsonb,
  ADD COLUMN IF NOT EXISTS notes text;

-- Enable RLS on new tables
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.camera_feeds ENABLE ROW LEVEL SECURITY;

-- RLS policies for alerts
CREATE POLICY "Authenticated users can view alerts" ON public.alerts
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can insert alerts" ON public.alerts
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- RLS policies for camera_feeds  
CREATE POLICY "Authenticated users can view camera feeds" ON public.camera_feeds
  FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "Admins can manage camera feeds" ON public.camera_feeds
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- RLS policies for patients to allow operations
CREATE POLICY "Authenticated users can insert patients" ON public.patients
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update patients" ON public.patients
  FOR UPDATE USING (auth.uid() IS NOT NULL);

-- Insert sample camera feeds
INSERT INTO public.camera_feeds (camera_id, name, room, status, ai_monitoring_enabled) VALUES
  ('ICU-001', 'ICU Room 1', 'ICU-001', 'active', true),
  ('ICU-002', 'ICU Room 2', 'ICU-002', 'active', true),
  ('WARD-101', 'General Ward 101', 'WARD-101', 'active', true),
  ('ER-001', 'Emergency Room 1', 'ER-001', 'critical', true),
  ('LOBBY-001', 'Main Lobby', 'LOBBY-001', 'active', false),
  ('HALL-A', 'Hallway A', 'HALL-A', 'active', false);

-- Create function to automatically generate alerts based on patient vitals
CREATE OR REPLACE FUNCTION public.check_patient_vitals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
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
$$;

-- Create trigger for automatic alert generation
CREATE TRIGGER patient_vitals_check_trigger
  AFTER INSERT OR UPDATE ON public.patients
  FOR EACH ROW EXECUTE FUNCTION public.check_patient_vitals();