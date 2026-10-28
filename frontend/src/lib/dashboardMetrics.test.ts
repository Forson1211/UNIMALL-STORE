import { collectedOrder, orderValue, overviewSeries } from "./dashboardMetrics";

const now = new Date("2026-10-27T12:00:00Z");
it("reports collected net vendor revenue and still counts uncollected orders", () => {
  const data = overviewSeries([
    { created_at: "2026-10-27T00:00:00Z", order_status: "delivered", payment_status: "paid", vendor_total: 29.99, total_amount: 100 },
    { created_at: "2026-10-27T08:00:00Z", order_status: "delivered", payment_status: "pending", vendor_total: 50 },
    { created_at: "2026-10-27T09:00:00Z", order_status: "cancelled", payment_status: "pending", vendor_total: 0 },
  ], "week", now);
  expect(data[data.length - 1]).toMatchObject({ name: "Tue", date: "2026-10-27", orders: 3, collected: 1, revenue: 29.99 });
});
it("uses Ghana day boundaries and excludes orders outside the displayed week", () => {
  const data = overviewSeries([
    { created_at: "2026-10-20T23:59:59Z", status: "delivered", payment_status: "paid", total_amount: 5 },
    { created_at: "2026-10-21T00:00:00Z", status: "delivered", payment_status: "paid", total_amount: 7 },
    { created_at: "2026-10-28T00:00:00Z", status: "delivered", payment_status: "paid", total_amount: 9 },
  ], "week", now);
  expect(data[0]).toMatchObject({ date: "2026-10-21", revenue: 7 });
  expect(data.reduce((sum, point) => sum + point.orders, 0)).toBe(1);
});
it("keeps empty stores at zero and groups the last six calendar months", () => {
  const data = overviewSeries([], "month", now);
  expect(data.map(point => point.name)).toEqual(["May", "Jun", "Jul", "Aug", "Sept", "Oct"]);
  expect(data.every(point => point.orders === 0 && point.revenue === 0 && point.collected === 0)).toBe(true);
  expect(collectedOrder({ created_at: now.toISOString(), status: "shipped", payment_status: "paid" })).toBe(false);
  expect(orderValue({ created_at: now.toISOString(), vendor_total: 0, total_amount: 25 })).toBe(0);
});
