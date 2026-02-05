-- Migration: Enable Realtime for Vendor Approval
-- This ensures that the frontend can subscribe to changes in the user_roles table.

-- Add user_roles to the supabase_realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.user_roles;

-- Ensure replica identity is set to DEFAULT or FULL to track changes
ALTER TABLE public.user_roles REPLICA IDENTITY DEFAULT;
