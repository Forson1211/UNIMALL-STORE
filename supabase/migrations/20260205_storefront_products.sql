-- Migration: Storefront Products View
-- This view filters products to only show those from approved vendors

CREATE OR REPLACE VIEW public.storefront_products_view AS
SELECT 
  p.id,
  p.name,
  p.description,
  p.price,
  p.category,
  p.image_url as image,
  p.images,
  p.features,
  p.created_at,
  prof.store_name as vendor,
  p.vendor_id,
  p.status,
  p.stock_quantity as stock,
  p.rating,
  p.reviews_count as reviews
FROM public.products p
JOIN public.user_roles ur ON ur.user_id = p.vendor_id
JOIN public.profiles prof ON prof.user_id = p.vendor_id
WHERE ur.role = 'vendor' 
  AND ur.vendor_status = 'approved'
  AND p.status = 'active';

-- Grant access to everyone (including non-logged in users)
GRANT SELECT ON public.storefront_products_view TO anon, authenticated;
