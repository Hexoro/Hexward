-- Create edge function to handle camera operations
-- This replaces the FastAPI backend with Supabase edge functions

-- First, let's create a table to store camera configuration
CREATE TABLE IF NOT EXISTS public.camera_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ip_address INET NOT NULL,
    port INTEGER DEFAULT 554,
    brand TEXT,
    model TEXT,
    rtsp_url TEXT,
    username TEXT,
    password TEXT,
    status TEXT DEFAULT 'inactive',
    room TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(ip_address, port)
);

-- Enable RLS
ALTER TABLE public.camera_config ENABLE ROW LEVEL SECURITY;

-- Create policies for camera_config (admin only)
CREATE POLICY "Only admins can manage cameras"
    ON public.camera_config
    FOR ALL
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_camera_config_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_camera_config_updated_at
    BEFORE UPDATE ON public.camera_config
    FOR EACH ROW
    EXECUTE FUNCTION public.update_camera_config_updated_at();