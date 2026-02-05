-- Migration: Add Moderator Role and Permissions

-- 1. ADD 'moderator' TO app_role ENUM
-- Note: 'ALTER TYPE ... ADD VALUE' cannot be run inside a transaction block in some Postgres versions.
-- If this fails, run it separately before the rest of the script.
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';

-- 2. GRANT ACCESS TO ADMIN VIEWS FOR MODERATORS
-- We update the RLS policy for the views (which query underlying tables)
-- Actually, the views rely on the user having access to the underlying data or the view running as owner.
-- The previous views were defined with OWNER TO postgres, so they bypass RLS if the user has permission to select from the view.
-- We just need to check if the user is allowed to "see" the view.
-- The RLS policy "Admins can view dashboard stats" on user_roles needs to be updated.

DROP POLICY IF EXISTS "Admins can view dashboard stats" ON public.user_roles;

CREATE POLICY "Admins and Moderators can view dashboard stats"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role IN ('admin', 'moderator')
    )
  );

-- 3. FUNCTION: MODERATOR-SAFE PRODUCT STATUS UPDATE
-- Moderators can update status (suspend/activate) but CANNOT delete
CREATE OR REPLACE FUNCTION public.moderator_update_product_status(
  _product_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_role public.app_role;
BEGIN
  _user_id := auth.uid();
  
  -- Get user role
  SELECT role INTO _user_role FROM public.user_roles WHERE user_id = _user_id;

  -- Check permissions
  IF _user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Access denied: User is not an admin or moderator';
  END IF;

  -- Update status
  UPDATE public.products
  SET status = _new_status, updated_at = NOW()
  WHERE id = _product_id;

  -- Log action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'product_management',
    'Product status updated by staff',
    json_build_object('product_id', _product_id, 'new_status', _new_status, 'staff_role', _user_role)
  );

  RETURN TRUE;
END;
$$;

-- 4. FUNCTION: MODERATOR-SAFE VENDOR STATUS UPDATE
-- Moderators can suspend/approve but cannot DELETE (which is handled by a separate function already restricted to admins usually)
CREATE OR REPLACE FUNCTION public.moderator_update_vendor_status(
  _vendor_id UUID,
  _new_status public.vendor_status_enum
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _user_id UUID;
  _user_role public.app_role;
BEGIN
  _user_id := auth.uid();
  
  -- Get user role
  SELECT role INTO _user_role FROM public.user_roles WHERE user_id = _user_id;

  -- Check permissions
  IF _user_role NOT IN ('admin', 'moderator') THEN
    RAISE EXCEPTION 'Access denied: User is not an admin or moderator';
  END IF;

  -- Update vendor status
  UPDATE public.user_roles
  SET vendor_status = _new_status
  WHERE user_id = _vendor_id AND role = 'vendor';

  -- Log action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'vendor_management',
    'Vendor status updated by staff',
    json_build_object('vendor_id', _vendor_id, 'new_status', _new_status, 'staff_role', _user_role)
  );

  RETURN TRUE;
END;
$$;

-- 5. UPDATE EXISTING ADMIN DELETE FUNCTIONS TO STRICTLY FORBID MODERATORS
-- Even if RLS prevented it, let's make the function stricter.

CREATE OR REPLACE FUNCTION public.admin_delete_product(_product_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  _admin_id := auth.uid();
  
  -- STRICT CHECK: ADMIN ONLY
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Access denied: Only admins can delete products';
  END IF;
  
  -- Log and Delete
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES ('admin_action', 'product_management', 'Admin deleted product', json_build_object('product_id', _product_id));
  
  DELETE FROM public.products WHERE id = _product_id;
  RETURN TRUE;
END;
$$;

-- 6. GRANT EXECUTE ON NEW FUNCTIONS
GRANT EXECUTE ON FUNCTION public.moderator_update_product_status TO authenticated;
GRANT EXECUTE ON FUNCTION public.moderator_update_vendor_status TO authenticated;

-- 7. UPDATE RLS for System Logs (Allow moderators to insert logs via functions)
-- (The functions are SECURITY DEFINER so they bypass RLS, but if we do direct inserts from client, we need policy)
-- We'll assume logging happens via these secure functions.

-- 8. ALLOW MODERATORS TO VIEW ADMIN VIEWS (Already granted to authenticated, but policies might restrict)
-- The views use 'security definer' behavior or owner permissions usually, but if RLS is enabled on underlying tables, it matters.
-- The previous views were simple views defined by postgres (or admin).
-- We just need to ensure 'admin_dashboard_stats' relies on user_roles policy which we updated in step 2.
