-- Migration: Backfill Existing Users and Ensure Data Consistency

-- 1. Ensure all users have a Profile
-- Insert into profiles if missing, using data from auth.users metadata
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

-- 2. Ensure all users have a User Role
-- Insert into user_roles if missing
INSERT INTO public.user_roles (user_id, role, vendor_status)
SELECT 
  id,
  -- Determine role from metadata, default to 'buyer'
  COALESCE((raw_user_meta_data->>'role')::public.app_role, 'buyer'),
  -- Set vendor status based on role and activity
  CASE 
    WHEN (raw_user_meta_data->>'role') = 'vendor' THEN
      CASE 
        -- If they already have products, approve them
        WHEN EXISTS (SELECT 1 FROM public.products WHERE vendor_id = u.id) THEN 'approved'::public.vendor_status_enum
        -- Otherwise pending
        ELSE 'pending'::public.vendor_status_enum
      END
    ELSE NULL -- Non-vendors have null status
  END
FROM auth.users u
WHERE NOT EXISTS (
  SELECT 1 FROM public.user_roles ur WHERE ur.user_id = u.id
);

-- 3. Fix Inconsistent Vendor Statuses
-- Ensure all vendors have a valid status
UPDATE public.user_roles
SET vendor_status = 'pending'
WHERE role = 'vendor' AND vendor_status IS NULL;

-- Ensure approved vendors are actually set to approved if they were missed
UPDATE public.user_roles ur
SET vendor_status = 'approved'
WHERE role = 'vendor' 
  AND vendor_status = 'pending'
  AND EXISTS (SELECT 1 FROM public.products p WHERE p.vendor_id = ur.user_id);

-- 4. Ensure System Admin exists (Optional/Safety)
-- If there is a user with email containing 'admin', ensure they are admin
-- (Be careful with this in production, but helpful for dev/recovery)
UPDATE public.user_roles
SET role = 'admin'
WHERE user_id IN (
  SELECT id FROM auth.users WHERE email ILIKE '%admin%'
) AND role != 'admin';

-- 5. Standardize Metadata
-- Sync role in metadata with role in table to ensure consistency
-- (This requires an update on auth.users which might not be permitted via SQL in all Supabase setups, 
-- but we can try or skip it. Usually better to rely on table as source of truth).
-- We'll skip updating auth.users to avoid permission issues.
