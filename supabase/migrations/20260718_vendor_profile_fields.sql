-- Vendor store branding fields on profiles.
-- Defensive/idempotent: uses ADD COLUMN IF NOT EXISTS per-column so this is safe to run
-- regardless of the live table's current shape (this schema has significant drift --
-- see migration commit message history).

ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS store_category TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS rating NUMERIC(2,1);
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{
  "new_order": true,
  "low_stock": true,
  "customer_messages": true,
  "weekly_report": false,
  "product_reviews": true,
  "two_factor": false,
  "login_notifications": true
}'::jsonb;

COMMENT ON COLUMN public.profiles.banner_url IS 'Vendor store banner image shown on their public storefront page';
COMMENT ON COLUMN public.profiles.store_category IS 'Primary product category for the vendor''s store, shown on their public storefront page';
COMMENT ON COLUMN public.profiles.verified IS 'Whether this vendor has been verified by an admin (shown as a badge on their storefront)';
COMMENT ON COLUMN public.profiles.rating IS 'Average store rating, 1.0-5.0, computed/updated separately from review aggregation';
COMMENT ON COLUMN public.profiles.notification_preferences IS 'Per-vendor notification toggle preferences (Settings > Notifications tab)';
