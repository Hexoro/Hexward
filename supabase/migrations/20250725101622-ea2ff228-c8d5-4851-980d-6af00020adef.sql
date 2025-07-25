-- Create admin user with hashed password (admin123)
-- Note: This will be handled through Supabase auth, but we need to create the profile
-- We'll use a trigger or direct insert after the auth user is created

-- Insert admin user into auth.users (this needs to be done via Supabase Auth API)
-- For now, we'll create a function to handle this

-- Function to create admin user programmatically
CREATE OR REPLACE FUNCTION public.create_admin_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $function$
DECLARE
  admin_user_id uuid;
BEGIN
  -- This function will be called after manually creating the auth user
  -- Insert the admin profile
  INSERT INTO public.profiles (id, email, full_name, username, role)
  SELECT 
    id,
    email,
    'System Administrator',
    'admin',
    'admin'::public.app_role
  FROM auth.users 
  WHERE email = 'admin@hexward.com'
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin'::public.app_role,
    username = 'admin',
    full_name = 'System Administrator';

  -- Ensure security settings exist
  INSERT INTO public.security_settings (user_id)
  SELECT id FROM auth.users WHERE email = 'admin@hexward.com'
  ON CONFLICT (user_id) DO NOTHING;
END;
$function$;

-- Update RLS policies to ensure admin has full access to everything
-- Admin can view all profiles
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.uid() = id);

-- Admin can update any profile
DROP POLICY IF EXISTS "Admins can update any profile" ON public.profiles;
CREATE POLICY "Admins can update any profile" 
ON public.profiles 
FOR UPDATE 
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.uid() = id);

-- Admin can view all audit logs
CREATE POLICY "Admins can view all audit logs" 
ON public.audit_logs 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin can view all user roles
CREATE POLICY "Admins can view all user roles" 
ON public.user_roles 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.uid() = user_id);

-- Admin can manage all user roles
CREATE POLICY "Admins can manage all user roles" 
ON public.user_roles 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Admin can view all security settings
CREATE POLICY "Admins can view all security settings" 
ON public.security_settings 
FOR SELECT 
USING (public.has_role(auth.uid(), 'admin'::public.app_role) OR auth.uid() = user_id);

-- Ensure nurses can access reports (create reports table if it doesn't exist)
CREATE TABLE IF NOT EXISTS public.reports (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  report_type text NOT NULL, -- daily, weekly, monthly, incident
  data jsonb,
  generated_by uuid REFERENCES auth.users(id),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Reports policies - nurses and admins can view reports
CREATE POLICY "Staff can view reports" 
ON public.reports 
FOR SELECT 
USING (
  public.has_role(auth.uid(), 'admin'::public.app_role) OR 
  public.has_role(auth.uid(), 'nurse'::public.app_role) OR 
  public.has_role(auth.uid(), 'doctor'::public.app_role)
);

-- Only admins can create/update reports
CREATE POLICY "Admins can manage reports" 
ON public.reports 
FOR ALL 
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- Insert some sample reports
INSERT INTO public.reports (title, description, report_type, data) VALUES
('Daily Patient Summary', 'Summary of all patient activities for today', 'daily', '{"total_patients": 15, "critical_alerts": 3, "routine_checks": 42}'),
('Weekly Incident Report', 'Summary of incidents and alerts from this week', 'weekly', '{"total_incidents": 12, "resolved": 10, "pending": 2}'),
('Monthly Analytics', 'Monthly analytics and trends', 'monthly', '{"patient_satisfaction": 95, "response_time": "2.3 min", "efficiency": 98}');