-- First add the new enum value in a separate transaction
DO $$
BEGIN
  -- Check if the enum value already exists to avoid duplicate errors
  IF NOT EXISTS (SELECT 1 FROM pg_enum WHERE enumlabel = 'remote_doctor' AND enumtypid = 'public.app_role'::regtype) THEN
    ALTER TYPE public.app_role ADD VALUE 'remote_doctor';
  END IF;
END $$;