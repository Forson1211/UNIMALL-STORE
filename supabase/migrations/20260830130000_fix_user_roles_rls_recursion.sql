-- Fix: prevent user_roles RLS policies from querying user_roles recursively.
-- Run this migration against databases where Admin Settings updates fail with:
-- infinite recursion detected in policy for relation "user_roles"

CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all roles" ON public.user_roles;
DROP POLICY IF EXISTS "Admins can manage roles" ON public.user_roles;
DROP POLICY IF EXISTS "Public can view vendor roles" ON public.user_roles;

CREATE POLICY "Admins can view all roles"
ON public.user_roles FOR SELECT
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can manage roles"
ON public.user_roles FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view vendor roles"
ON public.user_roles FOR SELECT
TO anon, authenticated
USING (
  role = 'vendor'
  OR auth.uid() = user_id
  OR public.has_role(auth.uid(), 'admin')
);

-- Replace historical site_settings policies that queried user_roles directly.
DROP POLICY IF EXISTS "Enable all access for site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
TO authenticated
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));
