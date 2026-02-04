-- DROP existing tables to ensure clean schema (WARNING: This resets these specific settings tables)
DROP TABLE IF EXISTS public.site_settings CASCADE;
DROP TABLE IF EXISTS public.site_pages CASCADE;
DROP TABLE IF EXISTS public.navigation_menus CASCADE;
DROP TABLE IF EXISTS public.media_library CASCADE;
DROP TABLE IF EXISTS public.email_templates CASCADE;
DROP TABLE IF EXISTS public.admin_activity_log CASCADE;
DROP TABLE IF EXISTS public.site_announcements CASCADE;

-- Site Settings Table
CREATE TABLE public.site_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  setting_key TEXT UNIQUE NOT NULL,
  setting_value JSONB NOT NULL,
  setting_category TEXT NOT NULL, -- 'branding', 'content', 'seo', 'payment', 'email'
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_by UUID REFERENCES auth.users(id)
);

-- Site Pages Table (for CMS)
CREATE TABLE public.site_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  content JSONB NOT NULL, -- Store rich content
  meta_title TEXT,
  meta_description TEXT,
  is_published BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id),
  updated_by UUID REFERENCES auth.users(id)
);

-- Navigation Menu Table
CREATE TABLE public.navigation_menus (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  menu_name TEXT NOT NULL,
  menu_location TEXT NOT NULL, -- 'header', 'footer', 'sidebar'
  menu_items JSONB NOT NULL, -- Array of menu items with links
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Media Library Table
CREATE TABLE public.media_library (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  file_type TEXT NOT NULL, -- 'image', 'video', 'document'
  file_size INTEGER,
  alt_text TEXT,
  uploaded_by UUID REFERENCES auth.users(id),
  uploaded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Email Templates Table
CREATE TABLE public.email_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT UNIQUE NOT NULL,
  template_subject TEXT NOT NULL,
  template_body TEXT NOT NULL,
  template_variables JSONB, -- Available variables for the template
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin Activity Log
CREATE TABLE public.admin_activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id UUID REFERENCES auth.users(id),
  action_type TEXT NOT NULL, -- 'create', 'update', 'delete', 'login'
  action_description TEXT NOT NULL,
  affected_table TEXT,
  affected_record_id UUID,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Site Announcements Table
CREATE TABLE public.site_announcements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  announcement_type TEXT NOT NULL, -- 'info', 'warning', 'success', 'error'
  target_audience TEXT DEFAULT 'all', -- 'all', 'vendors', 'buyers'
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMP WITH TIME ZONE,
  end_date TIMESTAMP WITH TIME ZONE,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on all tables
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_pages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.navigation_menus ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_library ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.email_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_activity_log ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_announcements ENABLE ROW LEVEL SECURITY;

-- RLS Policies: Public read, admin write
CREATE POLICY "Public can read site settings" ON public.site_settings FOR SELECT USING (true);
CREATE POLICY "Admins can manage site settings" ON public.site_settings FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read published pages" ON public.site_pages FOR SELECT USING (is_published = true);
CREATE POLICY "Admins can manage pages" ON public.site_pages FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read active menus" ON public.navigation_menus FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage menus" ON public.navigation_menus FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read media" ON public.media_library FOR SELECT USING (true);
CREATE POLICY "Admins can manage media" ON public.media_library FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can manage email templates" ON public.email_templates FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Admins can read activity log" ON public.admin_activity_log FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

CREATE POLICY "Public can read active announcements" ON public.site_announcements FOR SELECT 
USING (is_active = true AND (start_date IS NULL OR start_date <= NOW()) AND (end_date IS NULL OR end_date >= NOW()));
CREATE POLICY "Admins can manage announcements" ON public.site_announcements FOR ALL 
USING (EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Insert default site settings
INSERT INTO public.site_settings (setting_key, setting_value, setting_category) VALUES
('site_name', '"Campus Connect Marketplace"', 'branding'),
('site_tagline', '"Your Campus Marketplace"', 'branding'),
('primary_color', '"#10b981"', 'branding'),
('secondary_color', '"#3b82f6"', 'branding'),
('logo_url', '""', 'branding'),
('favicon_url', '""', 'branding'),
('support_email', '"support@campusconnect.com"', 'content'),
('support_phone', '"+1 (555) 123-4567"', 'content'),
('copyright_text', '"© 2024 Campus Connect. All rights reserved."', 'content'),
('meta_title', '"Campus Connect - Your Campus Shopping Destination"', 'seo'),
('meta_description', '"Shop for everything you need on campus"', 'seo'),
('meta_keywords', '"campus marketplace, student shopping"', 'seo'),
('google_analytics_id', '""', 'seo'),
('commission_rate', '5', 'payment'),
('minimum_order_value', '10', 'payment'),
('currency', '"USD"', 'payment'),
('tax_rate', '7.5', 'payment')
ON CONFLICT (setting_key) DO NOTHING;

-- Insert default email templates
INSERT INTO public.email_templates (template_name, template_subject, template_body, template_variables) VALUES
('welcome_email', 'Welcome to Campus Connect!', 
'<h1>Welcome {{user_name}}!</h1><p>Thank you for joining Campus Connect Marketplace...</p>',
'{"user_name": "User''s full name", "email": "User''s email address"}'),
('order_confirmation', 'Order Confirmation #{{order_number}}',
'<h1>Order Confirmed!</h1><p>Thank you for your order #{{order_number}}...</p>',
'{"order_number": "Order ID", "total_amount": "Order total", "items": "Order items list"}'),
('password_reset', 'Reset Your Password',
'<h1>Password Reset</h1><p>Click the link below to reset your password...</p>',
'{"reset_link": "Password reset URL", "user_name": "User''s name"}')
ON CONFLICT (template_name) DO NOTHING;

-- Function to log admin activity
CREATE OR REPLACE FUNCTION log_admin_activity()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.admin_activity_log (admin_id, action_type, action_description, affected_table, affected_record_id)
  VALUES (
    auth.uid(),
    TG_OP,
    TG_TABLE_NAME || ' ' || TG_OP,
    TG_TABLE_NAME,
    COALESCE(NEW.id, OLD.id)
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Add triggers for activity logging
CREATE TRIGGER log_settings_changes AFTER INSERT OR UPDATE OR DELETE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION log_admin_activity();

CREATE TRIGGER log_page_changes AFTER INSERT OR UPDATE OR DELETE ON public.site_pages
FOR EACH ROW EXECUTE FUNCTION log_admin_activity();
