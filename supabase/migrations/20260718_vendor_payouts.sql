-- Vendor payouts: request + admin approval, feeding into the existing transactions ledger.
-- Defensive/idempotent throughout given confirmed schema drift in this migrations folder.

CREATE TABLE IF NOT EXISTS public.vendor_payment_methods (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN ('momo', 'bank')),
  label TEXT NOT NULL,
  details JSONB NOT NULL DEFAULT '{}'::jsonb,
  is_default BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS type TEXT;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS label TEXT;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS details JSONB NOT NULL DEFAULT '{}'::jsonb;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS is_default BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE public.vendor_payment_methods ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();

ALTER TABLE public.vendor_payment_methods ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors manage their own payment methods" ON public.vendor_payment_methods;
CREATE POLICY "Vendors manage their own payment methods"
  ON public.vendor_payment_methods FOR ALL
  TO authenticated
  USING (vendor_id = auth.uid())
  WITH CHECK (vendor_id = auth.uid());


CREATE TABLE IF NOT EXISTS public.payout_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vendor_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'paid', 'rejected')),
  payment_method TEXT,
  payment_details JSONB DEFAULT '{}'::jsonb,
  requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  processed_at TIMESTAMP WITH TIME ZONE
);

ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS vendor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS amount DECIMAL(10,2);
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'pending';
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS payment_method TEXT;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS payment_details JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS requested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now();
ALTER TABLE public.payout_requests ADD COLUMN IF NOT EXISTS processed_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE public.payout_requests ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Vendors view and create their own payout requests" ON public.payout_requests;
CREATE POLICY "Vendors view and create their own payout requests"
  ON public.payout_requests FOR SELECT
  TO authenticated
  USING (vendor_id = auth.uid());

DROP POLICY IF EXISTS "Vendors can request payouts" ON public.payout_requests;
CREATE POLICY "Vendors can request payouts"
  ON public.payout_requests FOR INSERT
  TO authenticated
  WITH CHECK (vendor_id = auth.uid() AND public.is_vendor_approved(auth.uid()));

DROP POLICY IF EXISTS "Admins manage all payout requests" ON public.payout_requests;
CREATE POLICY "Admins manage all payout requests"
  ON public.payout_requests FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE INDEX IF NOT EXISTS idx_payout_requests_vendor ON public.payout_requests(vendor_id, requested_at DESC);
CREATE INDEX IF NOT EXISTS idx_payout_requests_status ON public.payout_requests(status);


-- Admin approve/reject a payout request. On approval, also writes a row into the
-- existing `transactions` table (type 'withdrawal') so it appears in the existing
-- AdminTransactions.tsx ledger, keeping the two systems consistent rather than
-- building a second, disconnected financial view. Follows the exact pattern of
-- admin_approve_vendor (role check, system_logs audit entry, RETURN BOOLEAN).
CREATE OR REPLACE FUNCTION public.approve_payout_request(
  _payout_id UUID,
  _new_status TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _payout RECORD;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can process payout requests';
  END IF;

  IF _new_status NOT IN ('approved', 'paid', 'rejected') THEN
    RAISE EXCEPTION 'Invalid status: %', _new_status;
  END IF;

  SELECT * INTO _payout FROM public.payout_requests WHERE id = _payout_id;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payout request not found';
  END IF;

  UPDATE public.payout_requests
  SET status = _new_status,
      processed_at = now()
  WHERE id = _payout_id;

  IF _new_status = 'paid' THEN
    INSERT INTO public.transactions (user_id, amount, currency, status, type, payment_method, reference_id)
    VALUES (
      _payout.vendor_id,
      _payout.amount,
      'GHS',
      'completed',
      'withdrawal',
      _payout.payment_method,
      _payout.id
    );
  END IF;

  INSERT INTO public.system_logs (type, source, message, metadata, user_id)
  VALUES (
    'security',
    'payout_management',
    'Payout request ' || _new_status,
    jsonb_build_object(
      'payout_id', _payout_id,
      'vendor_id', _payout.vendor_id,
      'amount', _payout.amount,
      'new_status', _new_status,
      'processed_by', auth.uid()
    ),
    auth.uid()
  );

  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.approve_payout_request TO authenticated;

COMMENT ON TABLE public.payout_requests IS 'Vendor payout/withdrawal requests, approved or rejected by admins via approve_payout_request().';
COMMENT ON TABLE public.vendor_payment_methods IS 'Vendor-saved payout destinations (mobile money / bank).';
COMMENT ON FUNCTION public.approve_payout_request(UUID, TEXT) IS 'Admin function to approve, mark paid, or reject a vendor payout request; on paid also records a withdrawal transaction.';
