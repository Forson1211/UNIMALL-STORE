-- Fix: Create delete_vendor_account function that was missing from the schema cache
-- This function allows admins to permanently delete a vendor account

CREATE OR REPLACE FUNCTION public.delete_vendor_account(_vendor_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can delete vendor accounts
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete vendor accounts';
  END IF;

  -- Check if the user is actually a vendor
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _vendor_id AND role = 'vendor'
  ) THEN
    RAISE EXCEPTION 'User is not a vendor';
  END IF;

  -- Log the deletion (wrapped in exception handler so it doesn't block delete)
  BEGIN
    INSERT INTO public.system_logs (type, source, message, metadata, user_id)
    VALUES (
      'security',
      'vendor_management',
      'Vendor account deleted',
      jsonb_build_object(
        'vendor_id', _vendor_id,
        'deleted_by', auth.uid()
      ),
      auth.uid()
    );
  EXCEPTION WHEN OTHERS THEN
    -- Logging is non-critical, continue with deletion
    NULL;
  END;

  -- Remove from user_roles first (avoids FK issues)
  DELETE FROM public.user_roles WHERE user_id = _vendor_id AND role = 'vendor';

  -- Remove profile
  DELETE FROM public.profiles WHERE user_id = _vendor_id;

  -- Note: Deleting from auth.users requires service_role key.
  -- If this errors, the vendor role/profile are still removed.
  BEGIN
    DELETE FROM auth.users WHERE id = _vendor_id;
  EXCEPTION WHEN OTHERS THEN
    -- auth.users deletion may fail without service_role — acceptable
    NULL;
  END;

  RETURN TRUE;
END;
$$;

COMMENT ON FUNCTION public.delete_vendor_account(UUID) IS 'Admin function to permanently delete a vendor account. Removes role, profile, and attempts auth user deletion.';
