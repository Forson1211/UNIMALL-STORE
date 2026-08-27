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
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Enable all access for site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Public can read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Admins can manage site settings" ON public.site_settings;

CREATE POLICY "Public can read site settings"
ON public.site_settings FOR SELECT
USING (true);

CREATE POLICY "Admins can manage site settings"
ON public.site_settings FOR ALL
USING (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
))
WITH CHECK (EXISTS (
  SELECT 1 FROM public.user_roles
  WHERE user_id = auth.uid() AND role = 'admin'
));

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
