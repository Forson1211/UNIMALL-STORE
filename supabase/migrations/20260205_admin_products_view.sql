-- Migration: Admin Products View
-- This view provides a detailed list of products with vendor info for admins

CREATE OR REPLACE VIEW public.admin_products_view AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.description,
    p.price,
    p.stock_quantity,
    p.category,
    p.status,
    p.vendor_id,
    prof.full_name as vendor_name,
    prof.store_name as vendor_store,
    (SELECT COUNT(*) FROM public.order_items WHERE product_id = p.id) as total_sales,
    p.created_at
FROM public.products p
LEFT JOIN public.profiles prof ON prof.user_id = p.vendor_id;

-- Grant permissions
GRANT SELECT ON public.admin_products_view TO authenticated;
