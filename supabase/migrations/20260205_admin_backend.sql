-- Admin Backend Analytics and Management Functions
-- This migration adds comprehensive admin analytics and management capabilities

-- ============================================
-- 1. ADMIN ANALYTICS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT
  -- Total counts
  (SELECT COUNT(*) FROM auth.users) as total_users,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'admin') as total_admins,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor') as total_vendors,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'buyer') as total_buyers,
  
  -- Vendor status breakdown
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor' AND vendor_status = 'pending') as vendors_pending,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor' AND vendor_status = 'approved') as vendors_approved,
  (SELECT COUNT(*) FROM public.user_roles WHERE role = 'vendor' AND vendor_status = 'suspended') as vendors_suspended,
  
  -- Product stats
  (SELECT COUNT(*) FROM public.products) as total_products,
  (SELECT COUNT(*) FROM public.products WHERE status = 'active') as active_products,
  (SELECT COUNT(*) FROM public.products WHERE status = 'draft') as draft_products,
  
  -- Order stats  
  (SELECT COUNT(*) FROM public.orders) as total_orders,
  (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders) as total_revenue,
  (SELECT COUNT(*) FROM public.orders WHERE status = 'pending') as pending_orders,
  
  -- Recent activity
  (SELECT COUNT(*) FROM auth.users WHERE created_at > NOW() - INTERVAL '7 days') as new_users_week,
  (SELECT COUNT(*) FROM public.orders WHERE created_at > NOW() - INTERVAL '7 days') as new_orders_week;

-- Grant access to admin users only
ALTER VIEW public.admin_dashboard_stats OWNER TO postgres;

-- ============================================
-- 2. ADMIN PRODUCTS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_products_view AS
SELECT
  p.id as product_id,
  p.name as product_name,
  p.description,
  p.price,
  p.stock_quantity,
  p.category,
  p.status,
  p.created_at,
  p.updated_at,
  p.vendor_id,
  prof.full_name as vendor_name,
  prof.store_name as vendor_store,
  (SELECT COUNT(*) FROM public.order_items WHERE product_id = p.id) as total_sales
FROM public.products p
LEFT JOIN public.profiles prof ON prof.user_id = p.vendor_id
ORDER BY p.created_at DESC;

ALTER VIEW public.admin_products_view OWNER TO postgres;

-- ============================================
-- 3. ADMIN ORDERS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_orders_view AS
SELECT
  o.id as order_id,
  o.buyer_id,
  buyer_prof.full_name as buyer_name,
  buyer_prof.email as buyer_email,
  o.total_amount,
  o.status as order_status,
  o.shipping_address,
  o.created_at,
  o.updated_at,
  (SELECT COUNT(*) FROM public.order_items WHERE order_id = o.id) as item_count,
  (SELECT json_agg(json_build_object(
    'product_id', oi.product_id,
    'product_name', prod.name,
    'vendor_id', oi.vendor_id,
    'vendor_name', vend_prof.store_name,
    'quantity', oi.quantity,
    'price', oi.price_at_purchase
  )) FROM public.order_items oi
  LEFT JOIN public.products prod ON prod.id = oi.product_id
  LEFT JOIN public.profiles vend_prof ON vend_prof.user_id = oi.vendor_id
  WHERE oi.order_id = o.id) as items
FROM public.orders o
LEFT JOIN (
  SELECT u.id, u.email, prof.full_name 
  FROM auth.users u 
  LEFT JOIN public.profiles prof ON prof.user_id = u.id
) buyer_prof ON buyer_prof.id = o.buyer_id
ORDER BY o.created_at DESC;

ALTER VIEW public.admin_orders_view OWNER TO postgres;

-- ============================================
-- 4. ADMIN USERS VIEW
-- ============================================
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT
  u.id as user_id,
  u.email,
  u.created_at as joined_at,
  u.last_sign_in_at,
  u.email_confirmed_at,
  prof.full_name,
  prof.phone,
  prof.address,
  prof.store_name,
  prof.store_description,
  ur.role,
  ur.vendor_status,
  (SELECT COUNT(*) FROM public.orders WHERE buyer_id = u.id) as total_orders_as_buyer,
  (SELECT COUNT(*) FROM public.products WHERE vendor_id = u.id) as total_products_as_vendor
FROM auth.users u
LEFT JOIN public.profiles prof ON prof.user_id = u.id
LEFT JOIN public.user_roles ur ON ur.user_id = u.id
ORDER BY u.created_at DESC;

ALTER VIEW public.admin_users_view OWNER TO postgres;

-- ============================================
-- 5. ADMIN FUNCTION: UPDATE PRODUCT STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_product_status(
  _product_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update product status';
  END IF;
  
  -- Update the product status
  UPDATE public.products
  SET status = _new_status, updated_at = NOW()
  WHERE id = _product_id;
  
  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'product_management',
    'Admin updated product status',
    json_build_object(
      'product_id', _product_id,
      'new_status', _new_status,
      'admin_id', _admin_id
    )
  );
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 6. ADMIN FUNCTION: DELETE PRODUCT
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_delete_product(
  _product_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can delete products';
  END IF;
  
  -- Log the action before deletion
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'product_management',
    'Admin deleted product',
    json_build_object(
      'product_id', _product_id,
      'admin_id', _admin_id
    )
  );
  
  -- Delete the product (cascades to order_items handled by FK)
  DELETE FROM public.products
  WHERE id = _product_id;
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 7. ADMIN FUNCTION: UPDATE ORDER STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_order_status(
  _order_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update order status';
  END IF;
  
  -- Update the order status
  UPDATE public.orders
  SET status = _new_status, updated_at = NOW()
  WHERE id = _order_id;
  
  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'order_management',
    'Admin updated order status',
    json_build_object(
      'order_id', _order_id,
      'new_status', _new_status,
      'admin_id', _admin_id
    )
  );
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 8. ADMIN FUNCTION: UPDATE USER STATUS
-- ============================================
CREATE OR REPLACE FUNCTION public.admin_update_user_status(
  _user_id UUID,
  _new_role TEXT DEFAULT NULL,
  _suspend BOOLEAN DEFAULT FALSE
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can update user status';
  END IF;
  
  -- Update role if provided
  IF _new_role IS NOT NULL THEN
    UPDATE public.user_roles
    SET role = _new_role::app_role
    WHERE user_id = _user_id;
  END IF;
  
  -- Suspend vendor if requested
  IF _suspend AND EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _user_id AND role = 'vendor'
  ) THEN
    UPDATE public.user_roles
    SET vendor_status = 'suspended'
    WHERE user_id = _user_id AND role = 'vendor';
  END IF;
  
  -- Log the action
  INSERT INTO public.system_logs (type, source, message, metadata)
  VALUES (
    'admin_action',
    'user_management',
    'Admin updated user status',
    json_build_object(
      'user_id', _user_id,
      'new_role', _new_role,
      'suspended', _suspend,
      'admin_id', _admin_id
    )
  );
  
  RETURN TRUE;
END;
$$;

-- ============================================
-- 9. RLS POLICIES FOR ADMIN VIEWS
-- ============================================

-- Admin Dashboard Stats
CREATE POLICY "Admins can view dashboard stats"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.user_roles
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Grant permissions
GRANT SELECT ON public.admin_dashboard_stats TO authenticated;
GRANT SELECT ON public.admin_products_view TO authenticated;
GRANT SELECT ON public.admin_orders_view TO authenticated;
GRANT SELECT ON public.admin_users_view TO authenticated;

-- ============================================
-- 10. ADMIN ANALYTICS FUNCTION
-- ============================================
CREATE OR REPLACE FUNCTION public.get_admin_analytics(
  _days_back INTEGER DEFAULT 30
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _admin_id UUID;
  _result JSON;
BEGIN
  -- Get the current user
  _admin_id := auth.uid();
  
  -- Check if user is admin
  IF NOT EXISTS (
    SELECT 1 FROM public.user_roles 
    WHERE user_id = _admin_id AND role = 'admin'
  ) THEN
    RAISE EXCEPTION 'Only admins can view analytics';
  END IF;
  
  -- Build analytics JSON
  SELECT json_build_object(
    'daily_orders', (
      SELECT json_agg(
        json_build_object(
          'date', date::DATE,
          'count', order_count,
          'revenue', total_revenue
        ) ORDER BY date DESC
      )
      FROM (
        SELECT 
          DATE_TRUNC('day', created_at) as date,
          COUNT(*) as order_count,
          COALESCE(SUM(total_amount), 0) as total_revenue
        FROM public.orders
        WHERE created_at > NOW() - INTERVAL '1 day' * _days_back
        GROUP BY DATE_TRUNC('day', created_at)
      ) daily_stats
    ),
    'top_products', (
      SELECT json_agg(
        json_build_object(
          'product_id', p.id,
          'product_name', p.name,
          'sales_count', COALESCE(sales.count, 0)
        )
      )
      FROM public.products p
      LEFT JOIN (
        SELECT product_id, COUNT(*) as count
        FROM public.order_items
        GROUP BY product_id
      ) sales ON sales.product_id = p.id
      ORDER BY sales.count DESC NULLS LAST
      LIMIT 10
    ),
    'top_vendors', (
      SELECT json_agg(
        json_build_object(
          'vendor_id', vendor_id,
          'vendor_name', store_name,
          'sales_count', sales_count,
          'revenue', revenue
        )
      )
      FROM (
        SELECT 
          oi.vendor_id,
          p.store_name,
          COUNT(*) as sales_count,
          COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) as revenue
        FROM public.order_items oi
        LEFT JOIN public.profiles p ON p.user_id = oi.vendor_id
        GROUP BY oi.vendor_id, p.store_name
        ORDER BY sales_count DESC
        LIMIT 10
      ) vendor_stats
    )
  ) INTO _result;
  
  RETURN _result;
END;
$$;

COMMENT ON FUNCTION public.get_admin_analytics IS 'Get comprehensive admin analytics including daily orders, top products, and top vendors';
