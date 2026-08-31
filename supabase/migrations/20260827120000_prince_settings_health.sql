-- Prince Developer 1: admin settings synchronization and system health telemetry.

-- Keep the settings contract consistent across the historical migrations used by this project.
ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS setting_category TEXT;

ALTER TABLE public.site_settings
  ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

UPDATE public.site_settings
SET setting_category = 'general'
WHERE setting_category IS NULL;

ALTER TABLE public.site_settings
  ALTER COLUMN setting_category SET DEFAULT 'general',
  ALTER COLUMN setting_category SET NOT NULL;

ALTER TABLE public.site_settings
  ALTER COLUMN created_at SET DEFAULT timezone('utc'::text, now());

CREATE OR REPLACE FUNCTION public.set_site_settings_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = timezone('utc'::text, now());
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_site_settings_updated_at ON public.site_settings;
CREATE TRIGGER set_site_settings_updated_at
BEFORE UPDATE ON public.site_settings
FOR EACH ROW EXECUTE FUNCTION public.set_site_settings_updated_at();

-- Public users may read settings, but only admins may write them.
-- The role lookup is SECURITY DEFINER so evaluating a site_settings policy does
-- not recursively evaluate user_roles RLS policies.
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

ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can update site settings" ON public.site_settings;

CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (public.has_role(auth.uid(), 'admin'))
WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- One row represents one browser session. Rows are considered active when their
-- heartbeat is newer than the health monitor's activity window.
CREATE TABLE IF NOT EXISTS public.active_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  last_seen_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now()),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS active_sessions_last_seen_at_idx
  ON public.active_sessions (last_seen_at DESC);

CREATE INDEX IF NOT EXISTS active_sessions_user_id_idx
  ON public.active_sessions (user_id);

ALTER TABLE public.active_sessions ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can insert their active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users can update their active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Users can delete their active sessions" ON public.active_sessions;
DROP POLICY IF EXISTS "Admins can read active sessions" ON public.active_sessions;

CREATE POLICY "Users can insert their active sessions"
ON public.active_sessions FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their active sessions"
ON public.active_sessions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their active sessions"
ON public.active_sessions FOR DELETE
USING (auth.uid() = user_id);

CREATE POLICY "Admins can read active sessions"
ON public.active_sessions FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime')
     AND NOT EXISTS (
       SELECT 1
       FROM pg_publication_tables
       WHERE pubname = 'supabase_realtime'
         AND schemaname = 'public'
         AND tablename = 'active_sessions'
     ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.active_sessions;
  END IF;
END;
$$;

-- Enforce vendor registration and verification settings in the auth trigger.
-- Defaults preserve the existing behavior when a setting row is not present.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
  vendor_registration_enabled BOOLEAN := true;
  verification_required BOOLEAN := true;
BEGIN
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'buyer');

  IF user_role = 'vendor' THEN
    SELECT COALESCE((setting_value #>> '{}')::boolean, true)
    INTO vendor_registration_enabled
    FROM public.site_settings
    WHERE setting_key = 'allow_vendor_registration';

    SELECT COALESCE((setting_value #>> '{}')::boolean, true)
    INTO verification_required
    FROM public.site_settings
    WHERE setting_key = 'require_vendor_verification';

    IF NOT vendor_registration_enabled THEN
      RAISE EXCEPTION 'Vendor registration is currently disabled';
    END IF;
  END IF;

  INSERT INTO public.profiles (user_id, full_name, store_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'store_name'
  )
  ON CONFLICT (user_id) DO NOTHING;

  IF user_role = 'vendor' THEN
    INSERT INTO public.user_roles (user_id, role, vendor_status)
    VALUES (
      NEW.id,
      user_role,
      CASE WHEN verification_required THEN 'pending' ELSE 'approved' END
    )
    ON CONFLICT (user_id, role) DO NOTHING;
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role)
    ON CONFLICT (user_id, role) DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Ensure the review moderation setting is enforced server-side for every new review.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

UPDATE public.reviews
SET status = 'approved'
WHERE status IS NULL;

CREATE OR REPLACE FUNCTION public.enforce_review_moderation_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  moderation_enabled BOOLEAN := false;
BEGIN
  IF public.has_role(auth.uid(), 'admin') THEN
    RETURN NEW;
  END IF;

  SELECT COALESCE((setting_value #>> '{}')::boolean, false)
  INTO moderation_enabled
  FROM public.site_settings
  WHERE setting_key = 'review_moderation_enabled';

  NEW.status := CASE WHEN moderation_enabled THEN 'pending' ELSE 'approved' END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS enforce_review_moderation_status ON public.reviews;
CREATE TRIGGER enforce_review_moderation_status
BEFORE INSERT OR UPDATE OF status ON public.reviews
FOR EACH ROW EXECUTE FUNCTION public.enforce_review_moderation_status();

-- Backend security routines for configurable session, login, and password policies.
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  succeeded BOOLEAN NOT NULL DEFAULT false,
  attempted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX IF NOT EXISTS login_attempts_email_attempted_at_idx
  ON public.login_attempts (email, attempted_at DESC);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.get_security_config()
RETURNS JSONB
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT jsonb_build_object(
    'session_timeout_enabled', COALESCE((SELECT (setting_value #>> '{}')::boolean FROM public.site_settings WHERE setting_key = 'session_timeout_enabled'), true),
    'session_timeout_minutes', COALESCE((SELECT (setting_value #>> '{}')::integer FROM public.site_settings WHERE setting_key = 'session_timeout_minutes'), 30),
    'login_attempt_limit_enabled', COALESCE((SELECT (setting_value #>> '{}')::boolean FROM public.site_settings WHERE setting_key = 'login_attempt_limit_enabled'), true),
    'max_failed_login_attempts', COALESCE((SELECT (setting_value #>> '{}')::integer FROM public.site_settings WHERE setting_key = 'max_failed_login_attempts'), 5),
    'password_update_enabled', COALESCE((SELECT (setting_value #>> '{}')::boolean FROM public.site_settings WHERE setting_key = 'password_update_enabled'), true),
    'password_min_length', COALESCE((SELECT (setting_value #>> '{}')::integer FROM public.site_settings WHERE setting_key = 'password_min_length'), 8)
  );
$$;

CREATE OR REPLACE FUNCTION public.check_login_allowed(_email TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email TEXT := lower(trim(_email));
  is_limit_enabled BOOLEAN;
  max_attempts INTEGER;
  failed_attempts INTEGER;
BEGIN
  SELECT COALESCE((setting_value #>> '{}')::boolean, true)
  INTO is_limit_enabled
  FROM public.site_settings
  WHERE setting_key = 'login_attempt_limit_enabled';

  SELECT COALESCE((setting_value #>> '{}')::integer, 5)
  INTO max_attempts
  FROM public.site_settings
  WHERE setting_key = 'max_failed_login_attempts';

  IF NOT COALESCE(is_limit_enabled, true) THEN
    RETURN jsonb_build_object('allowed', true, 'retry_after_seconds', 0);
  END IF;

  SELECT COUNT(*)
  INTO failed_attempts
  FROM public.login_attempts
  WHERE email = normalized_email
    AND succeeded = false
    AND attempted_at > timezone('utc'::text, now()) - interval '15 minutes';

  IF failed_attempts >= COALESCE(max_attempts, 5) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'retry_after_seconds', 900,
      'failed_attempts', failed_attempts
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'retry_after_seconds', 0,
    'failed_attempts', failed_attempts
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(_email TEXT, _succeeded BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  normalized_email TEXT := lower(trim(_email));
BEGIN
  IF _succeeded THEN
    DELETE FROM public.login_attempts
    WHERE email = normalized_email AND succeeded = false;
  END IF;

  INSERT INTO public.login_attempts (email, succeeded)
  VALUES (normalized_email, _succeeded);

  DELETE FROM public.login_attempts
  WHERE attempted_at < timezone('utc'::text, now()) - interval '30 days';
END;
$$;

CREATE OR REPLACE FUNCTION public.validate_password_update(_password_length INTEGER)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  updates_enabled BOOLEAN;
  minimum_length INTEGER;
BEGIN
  SELECT COALESCE((setting_value #>> '{}')::boolean, true)
  INTO updates_enabled
  FROM public.site_settings
  WHERE setting_key = 'password_update_enabled';

  SELECT COALESCE((setting_value #>> '{}')::integer, 8)
  INTO minimum_length
  FROM public.site_settings
  WHERE setting_key = 'password_min_length';

  IF NOT COALESCE(updates_enabled, true) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'minimum_length', COALESCE(minimum_length, 8),
      'message', 'Password updates are currently disabled by an administrator.'
    );
  END IF;

  IF _password_length < COALESCE(minimum_length, 8) THEN
    RETURN jsonb_build_object(
      'allowed', false,
      'minimum_length', COALESCE(minimum_length, 8),
      'message', format('New password must be at least %s characters.', COALESCE(minimum_length, 8))
    );
  END IF;

  RETURN jsonb_build_object(
    'allowed', true,
    'minimum_length', COALESCE(minimum_length, 8),
    'message', NULL
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.record_password_update()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Authentication required';
  END IF;

  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'security',
    'password_update',
    'Password updated successfully',
    jsonb_build_object('user_id', auth.uid())
  );
END;
$$;

REVOKE ALL ON FUNCTION public.get_security_config() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_security_config() TO anon, authenticated;
REVOKE ALL ON FUNCTION public.check_login_allowed(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.check_login_allowed(TEXT) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_login_attempt(TEXT, BOOLEAN) TO anon, authenticated;
REVOKE ALL ON FUNCTION public.validate_password_update(INTEGER) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_password_update(INTEGER) TO authenticated;
REVOKE ALL ON FUNCTION public.record_password_update() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.record_password_update() TO authenticated;

-- Persist the defaults used by the frontend and backend security routines.
INSERT INTO public.site_settings (setting_key, setting_value, setting_category)
VALUES
  ('require_2fa_admin', 'false'::jsonb, 'security'),
  ('session_timeout_enabled', 'true'::jsonb, 'security'),
  ('session_timeout_minutes', '30'::jsonb, 'security'),
  ('login_attempt_limit_enabled', 'true'::jsonb, 'security'),
  ('max_failed_login_attempts', '5'::jsonb, 'security'),
  ('password_update_enabled', 'true'::jsonb, 'security'),
  ('password_min_length', '8'::jsonb, 'security')
ON CONFLICT (setting_key) DO NOTHING;

-- Repair historical user_roles policies that queried user_roles directly from
-- inside user_roles policies, which causes PostgreSQL infinite-recursion errors.
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
