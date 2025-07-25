-- Fix function search path security warnings
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles WHERE id = _user_id AND role = _role
  )
$$;

CREATE OR REPLACE FUNCTION public.get_current_user_role()
RETURNS public.app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.profiles WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.log_user_action(action_type text, resource_type text, resource_id text DEFAULT NULL::text, details jsonb DEFAULT NULL::jsonb)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.audit_patients_changes()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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
SET search_path = public
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

CREATE OR REPLACE FUNCTION public.check_patient_vitals()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
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