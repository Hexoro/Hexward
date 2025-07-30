-- Create storage bucket for patient images
INSERT INTO storage.buckets (id, name, public) VALUES ('patient-images', 'patient-images', true);

-- Create storage policies for patient images
CREATE POLICY "Authenticated users can view patient images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'patient-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Staff can upload patient images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'patient-images' AND auth.uid() IS NOT NULL);

CREATE POLICY "Staff can update patient images" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'patient-images' AND auth.uid() IS NOT NULL);

-- Add image_url column to patients table
ALTER TABLE public.patients ADD COLUMN image_url text;

-- Create demo accounts and sample data
-- Insert demo user profiles (these will be created via auth trigger)
INSERT INTO public.profiles (id, email, username, full_name, role, department) VALUES
  ('00000000-0000-0000-0000-000000000001', 'admin@hexward.com', 'admin', 'Dr. Sarah Chen', 'admin', 'Administration'),
  ('00000000-0000-0000-0000-000000000002', 'nurse@hexward.com', 'nurse', 'Emily Rodriguez', 'nurse', 'ICU'),
  ('00000000-0000-0000-0000-000000000003', 'doctor@hexward.com', 'doctor', 'Dr. Michael Kim', 'remote_doctor', 'Cardiology')
ON CONFLICT (id) DO NOTHING;

-- Insert sample patients with various conditions
INSERT INTO public.patients (id, name, age, room, status, conditions, vitals, notes, summary) VALUES
  (gen_random_uuid(), 'John Smith', 45, 'ICU-001', 'critical', ARRAY['Pneumonia', 'Hypertension'], 
   '{"heartRate": 95, "bloodPressure": "140/90", "temperature": 101.2, "oxygenSat": 88}', 
   'Patient requires close monitoring', 'Critical pneumonia case requiring immediate attention'),
  
  (gen_random_uuid(), 'Maria Garcia', 67, 'ICU-002', 'stable', ARRAY['Diabetes', 'Heart Disease'], 
   '{"heartRate": 72, "bloodPressure": "120/80", "temperature": 98.6, "oxygenSat": 95}', 
   'Responding well to treatment', 'Stable condition with controlled diabetes'),
  
  (gen_random_uuid(), 'Robert Johnson', 34, 'WARD-101', 'monitoring', ARRAY['Post-Surgery Recovery'], 
   '{"heartRate": 78, "bloodPressure": "115/75", "temperature": 99.1, "oxygenSat": 97}', 
   'Day 2 post-surgery', 'Recovering well from appendectomy'),
  
  (gen_random_uuid(), 'Lisa Chen', 29, 'WARD-102', 'stable', ARRAY['Pregnancy Complications'], 
   '{"heartRate": 85, "bloodPressure": "110/70", "temperature": 98.4, "oxygenSat": 98}', 
   'High-risk pregnancy monitoring', 'Preeclampsia under control'),
  
  (gen_random_uuid(), 'David Wilson', 78, 'ICU-003', 'critical', ARRAY['Stroke', 'Atrial Fibrillation'], 
   '{"heartRate": 110, "bloodPressure": "160/95", "temperature": 100.8, "oxygenSat": 90}', 
   'Recent stroke patient', 'Acute ischemic stroke requiring intensive care');

-- Insert sample camera feeds
INSERT INTO public.camera_feeds (camera_id, name, room, stream_url, status, ai_monitoring_enabled, recording) VALUES
  ('CAM-ICU-001', 'ICU Room 1 Camera', 'ICU-001', 'rtsp://192.168.1.100/stream1', 'active', true, true),
  ('CAM-ICU-002', 'ICU Room 2 Camera', 'ICU-002', 'rtsp://192.168.1.101/stream1', 'active', true, true),
  ('CAM-ICU-003', 'ICU Room 3 Camera', 'ICU-003', 'rtsp://192.168.1.102/stream1', 'active', true, false),
  ('CAM-WARD-101', 'Ward 101 Camera', 'WARD-101', 'rtsp://192.168.1.110/stream1', 'active', true, false),
  ('CAM-WARD-102', 'Ward 102 Camera', 'WARD-102', 'rtsp://192.168.1.111/stream1', 'active', false, false);

-- Insert sample alerts
INSERT INTO public.alerts (type, title, message, room, patient_id, priority, acknowledged, resolved) 
SELECT 
  'critical', 
  'Low Oxygen Saturation', 
  'Patient ' || p.name || ' in room ' || p.room || ' has oxygen saturation below 90%',
  p.room,
  p.id,
  1,
  false,
  false
FROM public.patients p 
WHERE p.name = 'John Smith';

INSERT INTO public.alerts (type, title, message, room, patient_id, priority, acknowledged, resolved) 
SELECT 
  'warning', 
  'High Heart Rate', 
  'Patient ' || p.name || ' in room ' || p.room || ' has elevated heart rate',
  p.room,
  p.id,
  2,
  false,
  false
FROM public.patients p 
WHERE p.name = 'David Wilson';

INSERT INTO public.alerts (type, title, message, room, priority, acknowledged, resolved) VALUES
  ('info', 'Shift Change', 'Night shift staff has arrived', 'All', 3, true, true),
  ('warning', 'Equipment Maintenance', 'Camera CAM-ICU-003 requires maintenance', 'ICU-003', 2, false, false);

-- Insert sample AI detections
INSERT INTO public.ai_detections (detection_type, room, camera_id, confidence, metadata, gpt_analysis, processed_by_gpt, alert_generated) VALUES
  ('person_fall_detected', 'ICU-001', 'CAM-ICU-001', 0.87, 
   '{"bbox": [120, 150, 80, 200], "movement_pattern": "sudden_drop"}', 
   'Potential fall detected. Patient appears to have slipped from bed. Immediate medical attention required.', 
   true, true),
  
  ('person_stationary_extended', 'ICU-002', 'CAM-ICU-002', 0.92, 
   '{"bbox": [200, 100, 90, 180], "duration_minutes": 45}', 
   'Patient has remained motionless for extended period. Vital signs should be checked.', 
   true, false),
  
  ('equipment_disconnected', 'WARD-101', 'CAM-WARD-101', 0.95, 
   '{"equipment_type": "iv_line", "confidence": 0.95}', 
   'IV line appears to be disconnected. Nursing staff should investigate immediately.', 
   true, true);

-- Insert sample patient vitals history
INSERT INTO public.patient_vitals_history (patient_id, vitals, source, recorded_by)
SELECT 
  p.id,
  '{"heartRate": 88, "bloodPressure": "135/85", "temperature": 100.8, "oxygenSat": 89}',
  'automatic',
  '00000000-0000-0000-0000-000000000002'
FROM public.patients p 
WHERE p.name = 'John Smith';

-- Insert sample consultations
INSERT INTO public.consultations (patient_id, doctor_id, start_time, end_time, type, status, notes, diagnosis)
SELECT 
  p.id,
  '00000000-0000-0000-0000-000000000003',
  NOW() + INTERVAL '1 hour',
  NOW() + INTERVAL '2 hours',
  'remote',
  'scheduled',
  'Routine follow-up for pneumonia treatment',
  'Pneumonia - responding to antibiotics'
FROM public.patients p 
WHERE p.name = 'John Smith';

-- Insert sample reports
INSERT INTO public.reports (title, description, report_type, data, generated_by) VALUES
  ('Daily Patient Summary', 'Summary of all patients and their current status', 'daily_summary', 
   '{"total_patients": 5, "critical": 2, "stable": 2, "monitoring": 1, "alerts_count": 4}', 
   '00000000-0000-0000-0000-000000000001'),
  
  ('Weekly AI Detection Report', 'Analysis of AI detection patterns and accuracy', 'ai_analysis', 
   '{"total_detections": 15, "accuracy_rate": 0.87, "false_positives": 2, "critical_events": 3}', 
   '00000000-0000-0000-0000-000000000001');