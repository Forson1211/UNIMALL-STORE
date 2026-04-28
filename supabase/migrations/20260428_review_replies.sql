-- Add vendor_reply and vendor_reply_at to reviews table
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS vendor_reply TEXT,
ADD COLUMN IF NOT EXISTS vendor_reply_at TIMESTAMP WITH TIME ZONE;

-- Add RLS policy for vendors to update reviews for their products
-- Note: This is a bit complex because we need to check if the product belongs to the vendor
CREATE POLICY "Vendors can reply to reviews for their products"
ON public.reviews
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = reviews.product_id
    AND products.vendor_id = auth.uid()
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.products
    WHERE products.id = reviews.product_id
    AND products.vendor_id = auth.uid()
  )
);
