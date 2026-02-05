-- Migration: Vendor Views and Functions
-- This provides necessary views and functions for the Vendor Dashboard

-- 1. Vendor Stats View (Aggregated per vendor)
CREATE OR REPLACE VIEW public.vendor_dashboard_stats AS
SELECT 
    v.user_id as vendor_id,
    COALESCE(SUM(oi.total_price), 0) as total_revenue,
    COUNT(DISTINCT oi.order_id) as total_orders,
    (SELECT COUNT(*) FROM public.products p WHERE p.vendor_id = v.user_id) as total_products,
    (SELECT COUNT(*) FROM public.products p WHERE p.vendor_id = v.user_id AND p.stock_quantity < 10) as low_stock_count
FROM public.user_roles v
LEFT JOIN public.order_items oi ON oi.vendor_id = v.user_id
WHERE v.role = 'vendor'
GROUP BY v.user_id;

-- 2. Vendor Products View (with sales info)
CREATE OR REPLACE VIEW public.vendor_products_view AS
SELECT 
    p.id,
    p.name,
    p.description,
    p.price,
    p.stock_quantity as stock,
    p.category,
    p.status,
    p.vendor_id,
    p.image_url as image,
    p.created_at,
    COALESCE(SUM(oi.quantity), 0) as total_sold
FROM public.products p
LEFT JOIN public.order_items oi ON oi.product_id = p.id
GROUP BY p.id;

-- 3. Vendor Orders View
CREATE OR REPLACE VIEW public.vendor_orders_view AS
SELECT 
    oi.order_id,
    oi.vendor_id,
    o.created_at,
    o.status as order_status,
    o.total_amount as order_total, -- This is the full order total, maybe redundant
    SUM(oi.total_price) as vendor_total,
    COUNT(oi.product_id) as item_count,
    prof.full_name as buyer_name,
    u.email as buyer_email
FROM public.order_items oi
JOIN public.orders o ON o.id = oi.order_id
JOIN auth.users u ON u.id = o.buyer_id
LEFT JOIN public.profiles prof ON prof.user_id = o.buyer_id
GROUP BY oi.order_id, oi.vendor_id, o.created_at, o.status, o.total_amount, prof.full_name, u.email;

-- Grant permissions (RLS will still apply to the underlying tables if enabled)
GRANT SELECT ON public.vendor_dashboard_stats TO authenticated;
GRANT SELECT ON public.vendor_products_view TO authenticated;
GRANT SELECT ON public.vendor_orders_view TO authenticated;
