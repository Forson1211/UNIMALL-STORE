# Unimall dashboards and analytics

The dashboard shell uses Unimall branding, a light sidebar, a compact search header, bordered white cards, and responsive navigation. The vendor overview uses a separate sales-focused layout with weekly stats, yearly sales, payout balances, a transaction timeline, and product performance. The admin overview focuses on marketplace totals, vendor approvals, recent orders, and top stores.

The chart layouts take visual inspiration from the supplied [Vuexy chart reference](https://demos.pixinvent.com/vuexy-html-admin-template/html/vertical-menu-template-bordered/charts-chartjs.html). They are implemented with the project's existing React, Tailwind, and Recharts components.

## Pages

- `/vendor/sales-insights`: charts for the signed-in seller's own orders and products.
- `/admin/analytics`: marketplace charts, available to administrators and order managers.

Both include sales trends, best sellers, an hourly order heatmap, fulfillment and payment rings, weekday comparisons, category revenue, current order statuses, period filters, refresh, and CSV export. Empty stores show zero values and useful empty states. No traffic, expenses, profit, or payment-provider figures are fabricated.

## Report definitions

Periods cover the latest 7, 30, 90, or 365 Ghana calendar days, including today. Orders are grouped by creation date. Collected sales include delivered orders marked paid/completed, using discounted totals and excluding cancelled lines. Vendor totals/statuses are calculated from that seller's lines before aggregation, so mixed-store orders remain private and correctly attributed. Category names come from the current product catalog, falling back to Other for missing products. Archived product sales remain in historical totals.

Delivery rate uses non-cancelled orders as its denominator. Collection rate uses delivered orders. Current catalog publishing and vendor approval rates are labeled separately from the selected order period. Available vendor balance subtracts pending, approved, and paid payouts from collected earnings, matching the existing payout rules.

`backend/analytics.mjs` aggregates data inside MongoDB without the query API's 500-record display limit. The endpoints return chart aggregates and product summaries, with no buyer contact details. Vendor identity comes from the authenticated session; request parameters cannot select another seller. Pending/suspended sellers cannot fetch sales insights.

## Validation

- `npm run typecheck`
- `npm run build`
- `npm test`
- `npm run test:server`
- `npm run test:analytics` — uses the configured Atlas URI, creates a uniquely named `analytics_test_*` database, verifies more than 500 orders, seller isolation, discounted mixed-store orders, cancellation, date boundaries, heatmap buckets, and private output; drops that temporary database afterward.

Local browser checks cover desktop, tablet, and mobile layouts; sidebar behavior; search shortcut; date filters; CSV downloads; and browser errors. Preview screenshots are kept in ignored `.local/dashboard-preview/`.
