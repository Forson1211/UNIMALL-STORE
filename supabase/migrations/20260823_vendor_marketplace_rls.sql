-- ============================================================================
-- Vendor Marketplace RLS & Permissions Migration
-- ============================================================================

-- 1. PROFILES TABLE RLS
-- Enable RLS on profiles if not already enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Allow everyone (anonymous visitors & authenticated users) to view public profiles
-- This ensures buyers can view vendor storefronts, store names, campuses, and avatars
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;

CREATE POLICY "Public profiles are viewable by everyone"
  ON public.profiles FOR SELECT
  USING (true);

-- Ensure users can only insert their own profile
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Ensure users can only update their own profile (or admins)
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- 2. PRODUCTS TABLE RLS
-- Enable RLS on products if not already enabled
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active products" ON public.products;
DROP POLICY IF EXISTS "Approved vendors can manage their products" ON public.products;
DROP POLICY IF EXISTS "Vendors can manage their own products" ON public.products;
DROP POLICY IF EXISTS "Admins can manage all products" ON public.products;
DROP POLICY IF EXISTS "Vendors can view their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can insert their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can update their own products" ON public.products;
DROP POLICY IF EXISTS "Vendors can delete their own products" ON public.products;

-- Anyone can view active products; vendors can also see their own inactive/draft products; admins see all
CREATE POLICY "Anyone can view active products"
  ON public.products FOR SELECT
  USING (
    is_active = true 
    OR auth.uid() = vendor_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Only authenticated vendors/admins can create products under their own vendor_id
CREATE POLICY "Vendors can insert their own products"
  ON public.products FOR INSERT
  WITH CHECK (
    auth.uid() = vendor_id 
    AND (
      public.has_role(auth.uid(), 'vendor') 
      OR public.has_role(auth.uid(), 'admin')
    )
  );

-- Vendors can update only their own products; admins can update all
CREATE POLICY "Vendors can update their own products"
  ON public.products FOR UPDATE
  USING (
    auth.uid() = vendor_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- Vendors can delete only their own products; admins can delete all
CREATE POLICY "Vendors can delete their own products"
  ON public.products FOR DELETE
  USING (
    auth.uid() = vendor_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- 3. USER_ROLES TABLE RLS
-- Allow public select for vendor role check so buyer marketplace can identify active vendors
DROP POLICY IF EXISTS "Public can view vendor roles" ON public.user_roles;
CREATE POLICY "Public can view vendor roles"
  ON public.user_roles FOR SELECT
  USING (
    role = 'vendor' 
    OR auth.uid() = user_id 
    OR public.has_role(auth.uid(), 'admin')
  );

-- 4. GRANT PERMISSIONS
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT SELECT ON public.products TO anon, authenticated;
GRANT SELECT ON public.user_roles TO anon, authenticated;
