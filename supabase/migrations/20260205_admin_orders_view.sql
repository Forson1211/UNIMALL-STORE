-- Migration: Admin Orders View
-- This view provides a detailed list of orders with buyer and items summary for admins

CREATE OR REPLACE VIEW public.admin_orders_view AS
SELECT 
    o.id as order_id,
    p.full_name as buyer_name,
    u.email as buyer_email,
    o.total_amount,
    o.status as order_status,
    o.payment_status,
    o.payment_method,
    o.created_at,
    (SELECT COUNT(*) FROM public.order_items WHERE order_id = o.id) as item_count,
    (
      SELECT jsonb_agg(
        jsonb_build_object(
          'product_id', oi.product_id,
          'product_name', pr.name,
          'vendor_id', oi.vendor_id,
          'vendor_name', v.store_name,
          'quantity', oi.quantity,
          'price', oi.unit_price
        )
      )
      FROM public.order_items oi
      JOIN public.products pr ON pr.id = oi.product_id
      JOIN public.profiles v ON v.user_id = oi.vendor_id
      WHERE oi.order_id = o.id
    ) as items
FROM public.orders o
JOIN auth.users u ON u.id = o.buyer_id
LEFT JOIN public.profiles p ON p.user_id = o.buyer_id;

-- Grant permissions
GRANT SELECT ON public.admin_orders_view TO authenticated;
