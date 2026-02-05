-- Fix security definer views by recreating them with SECURITY INVOKER
DROP VIEW IF EXISTS public.storefront_products_view;
DROP VIEW IF EXISTS public.vendor_dashboard_stats;
DROP VIEW IF EXISTS public.vendor_products_view;
DROP VIEW IF EXISTS public.vendor_orders_view;

-- Recreate storefront_products_view with SECURITY INVOKER
CREATE VIEW public.storefront_products_view 
WITH (security_invoker = true)
AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.original_price,
  p.category,
  p.image_url as image,
  p.stock,
  p.rating,
  p.reviews_count as reviews,
  p.is_active as status,
  p.created_at,
  p.vendor_id,
  COALESCE(pr.store_name, pr.full_name, 'Unknown Vendor') as vendor
FROM public.products p
LEFT JOIN public.profiles pr ON p.vendor_id = pr.user_id
WHERE p.is_active = true;

GRANT SELECT ON public.storefront_products_view TO anon, authenticated;

-- Recreate vendor_dashboard_stats with SECURITY INVOKER
CREATE VIEW public.vendor_dashboard_stats 
WITH (security_invoker = true)
AS
SELECT 
  p.vendor_id,
  COUNT(DISTINCT p.id) as total_products,
  COALESCE(SUM(oi.quantity * oi.price_at_purchase), 0) as total_revenue,
  COUNT(DISTINCT oi.order_id) as total_orders,
  0 as pending_orders
FROM public.products p
LEFT JOIN public.order_items oi ON p.id = oi.product_id
GROUP BY p.vendor_id;

GRANT SELECT ON public.vendor_dashboard_stats TO authenticated;

-- Recreate vendor_products_view with SECURITY INVOKER
CREATE VIEW public.vendor_products_view 
WITH (security_invoker = true)
AS
SELECT 
  p.*,
  COALESCE(pr.store_name, pr.full_name, 'Unknown') as vendor_name
FROM public.products p
LEFT JOIN public.profiles pr ON p.vendor_id = pr.user_id;

GRANT SELECT ON public.vendor_products_view TO authenticated;

-- Recreate vendor_orders_view with SECURITY INVOKER
CREATE VIEW public.vendor_orders_view 
WITH (security_invoker = true)
AS
SELECT 
  o.id as order_id,
  o.buyer_id,
  o.status,
  o.total_amount,
  o.shipping_address,
  o.created_at,
  o.updated_at,
  oi.vendor_id,
  oi.product_id,
  oi.quantity,
  oi.price_at_purchase,
  p.name as product_name,
  p.image_url as product_image,
  pr.full_name as buyer_name,
  pr.phone as buyer_phone
FROM public.orders o
JOIN public.order_items oi ON o.id = oi.order_id
JOIN public.products p ON oi.product_id = p.id
LEFT JOIN public.profiles pr ON o.buyer_id = pr.user_id;

GRANT SELECT ON public.vendor_orders_view TO authenticated;