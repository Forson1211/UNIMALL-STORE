-- Migration: Secure Realtime for User Roles
-- Set REPLICA IDENTITY FULL to ensure all columns are available for realtime filtering.

ALTER TABLE public.user_roles REPLICA IDENTITY FULL;

-- Re-verify publication
DROP PUBLICATION IF EXISTS supabase_realtime;
CREATE PUBLICATION supabase_realtime FOR TABLE public.user_roles;
-- Note: In Supabase, usually there is a central 'supabase_realtime' publication.
-- If it already exists, we just add the table.
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
  ELSE
    CREATE PUBLICATION supabase_realtime FOR TABLE public.user_roles;
  END IF;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Already in publication
END $$;
