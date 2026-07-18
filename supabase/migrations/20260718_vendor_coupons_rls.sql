-- Ensure vendors can manage their own coupons.
-- No migration file on disk grants this explicitly (only "Admins manage coupons" and
-- "Public can read active coupons" policies were found) -- added defensively here
-- regardless of whether an equivalent policy already exists live, following the same
-- pattern as 20260205_vendor_approval_system.sql / 20260428_review_replies.sql.

DROP POLICY IF EXISTS "Vendors can manage their own coupons" ON public.coupons;

CREATE POLICY "Vendors can manage their own coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (created_by = auth.uid() AND public.is_vendor_approved(auth.uid()))
  WITH CHECK (created_by = auth.uid() AND public.is_vendor_approved(auth.uid()));
