-- Migration: Add Campus to Profiles
-- Adds the campus column to the profiles table to allow users to specify their location.

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'profiles' AND column_name = 'campus'
  ) THEN
    ALTER TABLE public.profiles 
    ADD COLUMN campus TEXT;
  END IF;
END $$;

-- Update existing profiles with campus from user meta data if available
UPDATE public.profiles p
SET campus = u.raw_user_meta_data->>'campus'
FROM auth.users u
WHERE p.user_id = u.id AND p.campus IS NULL;
