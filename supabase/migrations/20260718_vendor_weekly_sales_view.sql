-- Vendor weekly sales analytics view
-- Real per-week revenue/order data for the vendor dashboard sales chart,
-- replacing the previous client-side fabricated percentage split.
-- Uses only columns confirmed present on order_items (price_at_purchase, quantity,
-- created_at, vendor_id) -- avoids the unconfirmed total_price/unit_price columns
-- referenced elsewhere in this migrations folder.

CREATE OR REPLACE VIEW public.vendor_weekly_sales
WITH (security_invoker = true)
AS
SELECT
  oi.vendor_id,
  date_trunc('week', oi.created_at) AS week_start,
  COALESCE(SUM(oi.price_at_purchase * oi.quantity), 0) AS revenue,
  COUNT(DISTINCT oi.order_id) AS orders
FROM public.order_items oi
WHERE oi.created_at >= (now() - interval '4 weeks')
GROUP BY oi.vendor_id, date_trunc('week', oi.created_at);

GRANT SELECT ON public.vendor_weekly_sales TO authenticated;

COMMENT ON VIEW public.vendor_weekly_sales IS 'Per-vendor revenue and order counts bucketed by week, last 4 weeks. Backs the vendor dashboard sales chart.';
