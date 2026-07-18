-- Adds a "reject" capability to flash deal moderation.
-- Purely additive: does NOT touch `approved_by_admin` or its existing semantics,
-- because a separate view (active_flash_deals, used by the public storefront) reads
-- from `deals` but is defined nowhere in any migration file on disk -- its exact
-- filter logic is unknown, so existing columns must stay untouched to guarantee it
-- keeps working unmodified.

ALTER TABLE public.deals ADD COLUMN IF NOT EXISTS rejected_at TIMESTAMP WITH TIME ZONE;

COMMENT ON COLUMN public.deals.rejected_at IS 'Set when an admin rejects a pending flash deal submission. NULL + approved_by_admin=false means still pending.';
