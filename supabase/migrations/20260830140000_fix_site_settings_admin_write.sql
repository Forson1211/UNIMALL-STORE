-- Fix: site_settings upserts were denied because the application recognizes
-- bootstrap admins by email while the database policy only recognizes rows in
-- user_roles. This migration aligns the database role and policy paths.

-- Ensure the two existing bootstrap admin accounts have database admin roles.
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'admin'::public.app_role
FROM auth.users
WHERE lower(email) IN ('forsonodonkor1211@gmail.com', 'admin@unimall.com')
ON CONFLICT (user_id, role) DO NOTHING;

-- Use a SECURITY DEFINER lookup so policies on other tables do not recursively
-- evaluate user_roles RLS.
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role public.app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  );
$$;

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Enable all access for site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings rows" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can delete site settings" ON public.site_settings;

CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
TO anon, authenticated
USING (true);

CREATE POLICY "Admins can insert site settings"
ON public.site_settings FOR INSERT
TO authenticated
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can update site settings rows"
ON public.site_settings FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE POLICY "Admins can delete site settings"
ON public.site_settings FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::public.app_role));
