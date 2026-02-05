-- Vendor Approval System Migration
-- This adds vendor status management and approval workflow

-- Create enum for vendor status
CREATE TYPE public.vendor_status_enum AS ENUM ('pending', 'approved', 'suspended');

-- Add vendor_status column to user_roles table
ALTER TABLE public.user_roles
ADD COLUMN vendor_status public.vendor_status_enum DEFAULT 'pending';

-- Update existing vendor users to 'approved' by default (for backwards compatibility)
UPDATE public.user_roles
SET vendor_status = 'approved'
WHERE role = 'vendor';

-- Create function to get vendor status
CREATE OR REPLACE FUNCTION public.get_vendor_status(_user_id UUID)
RETURNS TEXT
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT vendor_status::text
  FROM public.user_roles
  WHERE user_id = _user_id
    AND role = 'vendor'
  LIMIT 1
$$;

-- Create function for admins to update vendor status
CREATE OR REPLACE FUNCTION public.update_vendor_status(
  _vendor_id UUID,
  _new_status public.vendor_status_enum
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Only admins can update vendor status
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can update vendor status';
  END IF;

  -- Update the vendor status
  UPDATE public.user_roles
  SET vendor_status = _new_status
  WHERE user_id = _vendor_id
    AND role = 'vendor';

  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata, user_id)
  VALUES (
    'security',
    'vendor_management',
    'Vendor status updated',
    jsonb_build_object(
      'vendor_id', _vendor_id,
      'new_status', _new_status::text,
      'updated_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN TRUE;
END;
$$;

-- Create function to check if vendor is approved
CREATE OR REPLACE FUNCTION public.is_vendor_approved(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = 'vendor'
      AND vendor_status = 'approved'
  )
$$;

-- Update the handle_new_user function to set vendor_status for new vendors
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role app_role;
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, full_name, store_name)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data ->> 'full_name',
    NEW.raw_user_meta_data ->> 'store_name'
  );
  
  -- Get the role from metadata or default to buyer
  user_role := COALESCE((NEW.raw_user_meta_data ->> 'role')::app_role, 'buyer');
  
  -- Assign role with appropriate vendor_status
  IF user_role = 'vendor' THEN
    -- New vendors start as pending
    INSERT INTO public.user_roles (user_id, role, vendor_status)
    VALUES (NEW.id, user_role, 'pending');
  ELSE
    -- Non-vendors don't need vendor_status (it stays as default)
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, user_role);
  END IF;
  
  RETURN NEW;
END;
$$;

-- Add RLS policy for vendors to view their own status
CREATE POLICY "Vendors can view their own vendor status"
  ON public.user_roles FOR SELECT
  USING (
    auth.uid() = user_id 
    AND role = 'vendor'
  );

-- Update products RLS to check vendor approval status
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.products;

CREATE POLICY "Approved vendors can manage their products"
  ON public.products FOR ALL
  USING (
    auth.uid() = vendor_id 
    AND public.is_vendor_approved(auth.uid())
  );

-- Admins can still manage all products
-- (This policy already exists, no changes needed)

-- Add index for faster vendor status lookups
CREATE INDEX IF NOT EXISTS idx_user_roles_vendor_status 
  ON public.user_roles(user_id, role, vendor_status);

-- Create view for admin to manage vendors
CREATE OR REPLACE VIEW public.vendor_management_view AS
SELECT 
  u.id as user_id,
  u.email,
  p.full_name,
  p.store_name,
  p.store_description,
  p.avatar_url,
  p.phone,
  ur.vendor_status,
  ur.created_at as vendor_since,
  (SELECT COUNT(*) FROM public.products WHERE vendor_id = u.id) as product_count,
  (SELECT COUNT(*) FROM public.order_items WHERE vendor_id = u.id) as total_sales
FROM auth.users u
JOIN public.user_roles ur ON ur.user_id = u.id
JOIN public.profiles p ON p.user_id = u.id
WHERE ur.role = 'vendor'
ORDER BY ur.created_at DESC;

-- Grant access to the view for admins only
ALTER VIEW public.vendor_management_view OWNER TO postgres;

-- Create RLS policy for the view
CREATE POLICY "Admins can view vendor management"
  ON public.vendor_management_view FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'));

-- Create function to delete vendor account (for admins)
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

  -- Log the deletion
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

  -- Delete the user (CASCADE will handle related records)
  DELETE FROM auth.users WHERE id = _vendor_id;

  RETURN TRUE;
END;
$$;

COMMENT ON COLUMN public.user_roles.vendor_status IS 'Status of vendor accounts: pending (awaiting approval), approved (can access vendor dashboard), suspended (access revoked)';
COMMENT ON FUNCTION public.get_vendor_status(UUID) IS 'Returns the vendor status for a given user ID';
COMMENT ON FUNCTION public.update_vendor_status(UUID, public.vendor_status_enum) IS 'Admin function to approve, suspend, or reactivate vendor accounts';
COMMENT ON FUNCTION public.is_vendor_approved(UUID) IS 'Checks if a vendor is approved and can access vendor features';
COMMENT ON FUNCTION public.delete_vendor_account(UUID) IS 'Admin function to permanently delete a vendor account';
