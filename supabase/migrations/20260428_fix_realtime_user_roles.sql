-- Migration: Fix Realtime for Vendor Approval Instant Unlock
-- Safely ensures user_roles is in the realtime publication
-- without dropping it (which would remove other tables).

-- Step 1: Set REPLICA IDENTITY FULL so all columns are available in realtime payloads
-- This allows the filter `user_id=eq.xxx` to work correctly on the client.
ALTER TABLE public.user_roles REPLICA IDENTITY FULL;

-- Step 2: Add user_roles to the supabase_realtime publication (safe: no-op if already added)
DO $$
BEGIN
  -- Try to add table to publication; if already a member it raises an error we catch.
  ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;
EXCEPTION
  WHEN duplicate_object THEN
    NULL; -- Table already in publication, nothing to do
  WHEN undefined_object THEN
    NULL; -- Publication doesn't exist, Supabase manages it
END $$;
