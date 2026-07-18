-- Real daily-granularity revenue for the admin dashboard's "Weekly Revenue Trend"
-- chart, which previously used a hardcoded Mon-Sun mock array. The existing
-- get_admin_analytics_charts() (in the untracked supabase/admin_dashboard_init.sql)
-- only supports monthly granularity, so this fills the gap with a new function
-- rather than editing that untracked file in place.

CREATE OR REPLACE FUNCTION public.get_admin_weekly_revenue()
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _result JSON;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can view platform analytics';
  END IF;

  SELECT COALESCE(json_agg(t), '[]'::json) INTO _result
  FROM (
    SELECT
      to_char(d.day, 'Dy') AS name,
      COALESCE(SUM(o.total_amount), 0) AS revenue
    FROM generate_series(
      date_trunc('day', now()) - interval '6 days',
      date_trunc('day', now()),
      interval '1 day'
    ) AS d(day)
    LEFT JOIN public.orders o
      ON date_trunc('day', o.created_at) = d.day
    GROUP BY d.day
    ORDER BY d.day
  ) t;

  RETURN _result;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_admin_weekly_revenue TO authenticated;

COMMENT ON FUNCTION public.get_admin_weekly_revenue() IS 'Real daily revenue for the last 7 days, admin-only. Backs the admin dashboard Weekly Revenue Trend chart.';
