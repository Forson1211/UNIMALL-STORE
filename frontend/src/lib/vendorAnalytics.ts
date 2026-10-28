import { collectedOrder, type OverviewOrder, type OverviewPoint } from "./dashboardMetrics";

export interface SaleLine {
  order_id: string;
  product_id: string;
  quantity: number;
  price_at_purchase: number;
  total_price?: number;
  fulfillment_status?: string;
}

export function yearlySales(orders: OverviewOrder[], year: number): OverviewPoint[] {
  return Array.from({ length: 12 }, (_, month) => {
    const date = new Date(Date.UTC(year, month, 1));
    const matching = orders.filter(order => {
      const created = new Date(order.created_at);
      return created.getUTCFullYear() === year && created.getUTCMonth() === month;
    });
    const collected = matching.filter(collectedOrder);
    return {
      name: date.toLocaleDateString("en-GB", { month: "short", timeZone: "Africa/Accra" }),
      date: date.toISOString().slice(0, 10), orders: matching.length, collected: collected.length,
      revenue: Math.round(collected.reduce((sum, order) => sum + Number(order.vendor_total ?? order.total_amount ?? 0), 0) * 100) / 100,
    };
  });
}

export function productSales(lines: SaleLine[], orders: OverviewOrder[], year: number) {
  const collected = new Map(orders.filter(collectedOrder).map(order => [order.order_id || order.id, order]));
  const result = new Map<string, { units: number; revenue: number; monthly: number[] }>();
  for (const line of lines) {
    const order = collected.get(line.order_id);
    if (!order || line.fulfillment_status === "cancelled") continue;
    const date = new Date(order.created_at);
    if (date.getUTCFullYear() !== year) continue;
    const value = Number(line.total_price ?? Number(line.price_at_purchase) * Number(line.quantity));
    const entry = result.get(line.product_id) || { units: 0, revenue: 0, monthly: Array(12).fill(0) as number[] };
    entry.units += Number(line.quantity);
    entry.revenue = Math.round((entry.revenue + value) * 100) / 100;
    entry.monthly[date.getUTCMonth()] += value;
    result.set(line.product_id, entry);
  }
  return result;
}
