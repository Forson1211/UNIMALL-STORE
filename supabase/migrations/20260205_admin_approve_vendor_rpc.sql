-- Migration: Admin Approve Vendor RPC
-- This creates a specific RPC for vendor approval to match the frontend call.

CREATE OR REPLACE FUNCTION public.admin_approve_vendor(
  _vendor_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can approve vendors
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve vendors';
  END IF;

  -- Update the vendor status to approved
  UPDATE public.user_roles
  SET vendor_status = 'approved'
  WHERE user_id = _vendor_id
    AND role = 'vendor';

  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata, user_id)
  VALUES (
    'security',
    'vendor_management',
    'Vendor account approved',
    jsonb_build_object(
      'vendor_id', _vendor_id,
      'approved_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN TRUE;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION public.admin_approve_vendor TO authenticated;
