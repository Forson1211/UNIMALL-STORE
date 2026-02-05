-- Migration: Fix Schema and Backfill Users
-- This migration ensures the schema is correct before attempting to backfill.

-- 1. Ensure Vendor Status Enum Exists
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'vendor_status_enum') THEN
    CREATE TYPE public.vendor_status_enum AS ENUM ('pending', 'approved', 'suspended');
  END IF;
END $$;

-- 2. Ensure Vendor Status Column Exists in user_roles
DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'user_roles' AND column_name = 'vendor_status'
  ) THEN
    ALTER TABLE public.user_roles 
    ADD COLUMN vendor_status public.vendor_status_enum DEFAULT 'pending';
  END IF;
END $$;

-- 3. Ensure Profiles Table Exists
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT,
  store_name TEXT,
  store_description TEXT,
  avatar_url TEXT,
  phone TEXT,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

-- 4. NOW RUN BACKFILL (Safe to run)

-- A. Backfill Profiles
INSERT INTO public.profiles (user_id, full_name, store_name, avatar_url)
SELECT 
  id,
  COALESCE(raw_user_meta_data->>'full_name', raw_user_meta_data->>'name', email),
  raw_user_meta_data->>'store_name',
  raw_user_meta_data->>'avatar_url'
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.profiles p WHERE p.user_id = u.id
);

-- B. Backfill User Roles
INSERT INTO public.user_roles (user_id, role, vendor_status)
SELECT 
  id,
  COALESCE((raw_user_meta_data->>'role')::public.app_role, 'buyer'),
  CASE 
    WHEN (raw_user_meta_data->>'role') = 'vendor' THEN
      CASE 
        WHEN EXISTS (SELECT 1 FROM public.products WHERE vendor_id = u.id) THEN 'approved'::public.vendor_status_enum
        ELSE 'pending'::public.vendor_status_enum
      END
    ELSE NULL
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- C. Fix Inconsistent Statuses for Existing Records
UPDATE public.user_roles
SET vendor_status = 'pending'
WHERE role = 'vendor' AND vendor_status IS NULL;

-- D. Auto-approve existing vendors with products
UPDATE public.user_roles ur
SET vendor_status = 'approved'
WHERE role = 'vendor' 
  AND vendor_status = 'pending'
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.vendor_id = ur.user_id);

-- E. Ensure Admin Role for 'admin' emails
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%admin%'
) AND role != 'admin';
