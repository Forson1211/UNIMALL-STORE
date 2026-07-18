-- Real notifications table.
-- src/pages/admin/AdminNotifications.tsx already queries a live `notifications` table
-- (columns: id, type, title, message, read, created_at) with no corresponding
-- CREATE TABLE anywhere in this migrations folder -- another out-of-band table, like
-- `coupons`/`reviews`. This migration matches that proven shape defensively (safe to
-- run whether or not the table already exists) and adds what vendor-scoped
-- notifications need: `user_id` + `link`.

CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'info',
  title TEXT NOT NULL,
  message TEXT,
  read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Self-healing: add any of these columns individually in case the table already
-- existed live with only a subset of them.
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS type TEXT NOT NULL DEFAULT 'info';
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS read BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS link TEXT;
ALTER TABLE public.notifications ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
CREATE POLICY "Users can view their own notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
CREATE POLICY "Users can update their own notifications"
  ON public.notifications FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins can view all notifications" ON public.notifications;
CREATE POLICY "Admins can view all notifications"
  ON public.notifications FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id, created_at DESC);

-- Notify a vendor when one of their products receives a new order line item.
CREATE OR REPLACE FUNCTION public.notify_vendor_new_order()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.notifications (user_id, type, title, message, link)
  VALUES (
    NEW.vendor_id,
    'success',
    'New Order Received',
    'You have a new order for your items.',
    '/vendor/orders'
  );
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_vendor_new_order ON public.order_items;
CREATE TRIGGER trg_notify_vendor_new_order
  AFTER INSERT ON public.order_items
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_new_order();

-- Notify a vendor when one of their products receives a new review.
CREATE OR REPLACE FUNCTION public.notify_vendor_new_review()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _vendor_id UUID;
  _product_name TEXT;
BEGIN
  SELECT vendor_id, name INTO _vendor_id, _product_name
  FROM public.products
  WHERE id = NEW.product_id;

  IF _vendor_id IS NOT NULL THEN
    INSERT INTO public.notifications (user_id, type, title, message, link)
    VALUES (
      _vendor_id,
      'info',
      'New Review Posted',
      'Someone rated ' || COALESCE(_product_name, 'your product') || ' ' || NEW.rating || ' stars.',
      '/vendor/reviews'
    );
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notify_vendor_new_review ON public.reviews;
CREATE TRIGGER trg_notify_vendor_new_review
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_vendor_new_review();

COMMENT ON TABLE public.notifications IS 'Per-user notification feed (vendors, and system-wide notifications read by admins).';
