-- ============================================================
-- Staff Roles Migration
-- Adds granular staff roles for managing different app sections
-- ============================================================

-- 1. Add new role values to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'moderator';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'vendor_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'order_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'content_manager';
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'support_agent';

-- 2. Function: Admin assigns any role to a user
CREATE OR REPLACE FUNCTION public.admin_assign_role(
  _target_user_id UUID,
  _new_role TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id UUID;
  _role_val public.app_role;
BEGIN
  _caller_id := auth.uid();

  -- Only admins can assign roles
  IF NOT public.has_role(_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can assign roles';
  END IF;

  -- Cast to enum (will raise if invalid value)
  _role_val := _new_role::public.app_role;

  -- Upsert: if the user already has a row, update it; otherwise insert
  INSERT INTO public.user_roles (user_id, role)
  VALUES (_target_user_id, _role_val)
  ON CONFLICT (user_id, role) DO NOTHING;

  -- Remove all OTHER roles (one role per user)
  DELETE FROM public.user_roles
  WHERE user_id = _target_user_id
    AND role != _role_val;

  -- Log
  BEGIN
    INSERT INTO public.system_logs (type, source, message, metadata, user_id)
    VALUES (
      'admin_action', 'user_management', 'Admin assigned role to user',
      jsonb_build_object(
        'target_user_id', _target_user_id,
        'new_role', _new_role,
        'assigned_by', _caller_id
      ),
      _caller_id
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_assign_role TO authenticated;

-- 3. Function: Admin removes a user (soft: just resets role to buyer)
CREATE OR REPLACE FUNCTION public.admin_deactivate_user(_target_user_id UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller_id UUID;
BEGIN
  _caller_id := auth.uid();

  IF NOT public.has_role(_caller_id, 'admin') THEN
    RAISE EXCEPTION 'Only admins can deactivate users';
  END IF;

  -- Reset role to buyer
  UPDATE public.user_roles
  SET role = 'buyer'
  WHERE user_id = _target_user_id;

  BEGIN
    INSERT INTO public.system_logs (type, source, message, metadata, user_id)
    VALUES (
      'admin_action', 'user_management', 'Admin deactivated user (reset to buyer)',
      jsonb_build_object('target_user_id', _target_user_id, 'by', _caller_id),
      _caller_id
    );
  EXCEPTION WHEN OTHERS THEN NULL;
  END;

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.admin_deactivate_user TO authenticated;

-- 4. Update has_role to accept text so moderator checks work easily
-- (existing has_role uses enum, add a text overload)
CREATE OR REPLACE FUNCTION public.has_role_text(_user_id UUID, _role TEXT)
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
      AND role::text = _role
  )
$$;

GRANT EXECUTE ON FUNCTION public.has_role_text TO authenticated;

COMMENT ON FUNCTION public.admin_assign_role IS 'Admin-only: assign any app_role to a target user. Replaces their existing role.';
COMMENT ON FUNCTION public.admin_deactivate_user IS 'Admin-only: reset a user role back to buyer (soft deactivation).';
