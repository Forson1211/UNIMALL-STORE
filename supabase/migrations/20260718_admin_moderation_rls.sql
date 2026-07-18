-- Admin moderation: reviews, support tickets, coupons.
-- Defensive/idempotent throughout given confirmed schema drift (conflicting CREATE
-- TABLE definitions across earlier migration files for these exact tables).

-- ── Reviews ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can moderate reviews" ON public.reviews;
CREATE POLICY "Admins can moderate reviews"
  ON public.reviews FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Two conflicting reviews.status CHECK constraints exist across earlier migration
-- files -- one omits 'rejected' entirely. Force it to the value the frontend
-- (src/types/admin.ts Review.status) actually uses.
DO $$
DECLARE
  _constraint_name TEXT;
BEGIN
  SELECT conname INTO _constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.reviews'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF _constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.reviews DROP CONSTRAINT %I', _constraint_name);
  END IF;

  ALTER TABLE public.reviews
    ADD CONSTRAINT reviews_status_check
    CHECK (status IN ('pending', 'approved', 'flagged', 'rejected'));
END $$;


-- ── Support tickets ──────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage all tickets" ON public.support_tickets;
CREATE POLICY "Admins can manage all tickets"
  ON public.support_tickets FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Users can create tickets" ON public.support_tickets;
CREATE POLICY "Users can create tickets"
  ON public.support_tickets FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);


-- ── Coupons ──────────────────────────────────────────────────────────────
DROP POLICY IF EXISTS "Admins can manage coupons" ON public.coupons;
CREATE POLICY "Admins can manage coupons"
  ON public.coupons FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Same drift problem as reviews.status: coupons.status CHECK disagrees across
-- migration files ('paused' vs 'disabled'). Force it to what the frontend uses.
DO $$
DECLARE
  _constraint_name TEXT;
BEGIN
  SELECT conname INTO _constraint_name
  FROM pg_constraint
  WHERE conrelid = 'public.coupons'::regclass
    AND contype = 'c'
    AND pg_get_constraintdef(oid) ILIKE '%status%';

  IF _constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE public.coupons DROP CONSTRAINT %I', _constraint_name);
  END IF;

  ALTER TABLE public.coupons
    ADD CONSTRAINT coupons_status_check
    CHECK (status IN ('active', 'expired', 'disabled'));
END $$;
