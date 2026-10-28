import { productSales, yearlySales } from "./vendorAnalytics";

const orders = [
  { order_id: "sale", created_at: "2026-01-01T00:00:00Z", order_status: "delivered", payment_status: "paid", vendor_total: 18 },
  { order_id: "pending", created_at: "2026-01-10T00:00:00Z", order_status: "pending", payment_status: "pending", vendor_total: 30 },
  { order_id: "old", created_at: "2025-12-31T23:59:59Z", order_status: "delivered", payment_status: "paid", vendor_total: 10 },
];
it("groups only the selected year's collected revenue, retaining empty months", () => {
  const data = yearlySales(orders, 2026);
  expect(data).toHaveLength(12);
  expect(data[0]).toMatchObject({ name: "Jan", orders: 2, collected: 1, revenue: 18 });
  expect(data.slice(1).every(point => point.revenue === 0)).toBe(true);
});
it("uses discounted line totals and excludes uncollected, cancelled and other-year lines", () => {
  const result = productSales([
    { order_id: "sale", product_id: "a", quantity: 2, price_at_purchase: 10, total_price: 18 },
    { order_id: "sale", product_id: "b", quantity: 1, price_at_purchase: 10, fulfillment_status: "cancelled" },
    { order_id: "pending", product_id: "a", quantity: 3, price_at_purchase: 10 },
    { order_id: "old", product_id: "a", quantity: 1, price_at_purchase: 10 },
  ], orders, 2026);
  expect(result.get("a")).toEqual({ units: 2, revenue: 18, monthly: [18, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0] });
  expect(result.has("b")).toBe(false);
});
