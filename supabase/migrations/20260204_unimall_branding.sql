-- Update site branding to Unimall
UPDATE public.site_settings 
SET setting_value = '"Unimall"'
WHERE setting_key = 'site_name';

UPDATE public.site_settings 
SET setting_value = '"Your Campus Marketplace"'
WHERE setting_key = 'site_tagline';

-- Add additional customization settings if they don't exist
INSERT INTO public.site_settings (setting_key, setting_value, setting_category) VALUES
('accent_color', '"#f59e0b"', 'theme'),
('background_color', '"#ffffff"', 'theme'),
('header_bg_color', '"#ffffff"', 'theme'),
('footer_bg_color', '"#1f2937"', 'theme'),
('dark_mode_enabled', 'false', 'theme'),
('current_theme', '"default"', 'theme'),
('hero_background_url', '""', 'media'),
('hero_overlay_opacity', '0.5', 'media'),
('container_max_width', '"1280px"', 'layout'),
('border_radius', '"0.5rem"', 'layout'),
('animations_enabled', 'true', 'layout'),
('font_family', '"Inter"', 'typography'),
('font_size', '"16px"', 'typography')
ON CONFLICT (setting_key) DO UPDATE
SET setting_value = EXCLUDED.setting_value,
    setting_category = EXCLUDED.setting_category;

-- Create storage bucket for site assets if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('site-assets', 'site-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Set up storage policies for site-assets bucket
CREATE POLICY "Public can view site assets" ON storage.objects
FOR SELECT USING (bucket_id = 'site-assets');

CREATE POLICY "Admins can upload site assets" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'site-assets' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can update site assets" ON storage.objects
FOR UPDATE USING (
  bucket_id = 'site-assets' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

CREATE POLICY "Admins can delete site assets" ON storage.objects
FOR DELETE USING (
  bucket_id = 'site-assets' AND
  EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin')
);
