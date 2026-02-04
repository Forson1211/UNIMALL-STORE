-- Reset site settings to White Mode defaults
UPDATE public.site_settings 
SET setting_value = 'false'
WHERE setting_key = 'dark_mode_enabled';

UPDATE public.site_settings 
SET setting_value = '"#ffffff"'
WHERE setting_key IN ('background_color', 'header_bg_color');

UPDATE public.site_settings 
SET setting_value = '"#1f2937"'
WHERE setting_key = 'footer_bg_color';

UPDATE public.site_settings 
SET setting_value = '"default"'
WHERE setting_key = 'current_theme';
