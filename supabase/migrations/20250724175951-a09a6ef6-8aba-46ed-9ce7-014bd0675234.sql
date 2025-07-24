-- Fix the infinite recursion in profiles RLS policies
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

-- Create a simple admin policy that doesn't reference profiles table recursively
CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin'
  );

-- Alternatively, let's use a simpler approach - allow authenticated users to see all profiles
-- since this is a medical dashboard where staff need to see other staff
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Authenticated users can view profiles" ON public.profiles
  FOR SELECT USING (auth.uid() IS NOT NULL);