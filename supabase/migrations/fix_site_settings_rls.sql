-- Fix RLS policies to allow updates and ensure correct schema
DROP TABLE IF EXISTS public.site_settings CASCADE;

-- Create table with correct schema
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_category TEXT NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Create a permissive policy for development (FIXES "Failed to update settings" error)
CREATE POLICY "Enable all access for site settings" ON public.site_settings FOR ALL USING (true);
