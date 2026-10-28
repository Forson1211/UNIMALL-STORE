export interface OverviewOrder {
  id?: string; order_id?: string; created_at: string;
  status?: string; order_status?: string; payment_status?: string;
  total_amount?: number; vendor_total?: number;
}
export type ChartPeriod = "week" | "month";
export interface OverviewPoint { name: string; date: string; revenue: number; orders: number; collected: number }
export const money = (value: number, compact = false) => new Intl.NumberFormat("en-GH", {
  style: "currency", currency: "GHS", maximumFractionDigits: compact ? 0 : 2,
  ...(compact && value >= 100000 ? { notation: "compact" as const } : {}),
}).format(Number.isFinite(value) ? value : 0);
export const orderState = (order: OverviewOrder) => order.order_status || order.status || "pending";
export const collectedOrder = (order: OverviewOrder) => orderState(order) === "delivered" && ["paid", "completed"].includes(order.payment_status || "");
export const orderValue = (order: OverviewOrder) => Number(order.vendor_total ?? order.total_amount ?? 0);

export function overviewSeries(orders: OverviewOrder[], period: ChartPeriod, now = new Date()): OverviewPoint[] {
  return Array.from({ length: period === "week" ? 7 : 6 }, (_, index) => {
    const start = period === "week" ? new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() - 6 + index)) : new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() - 5 + index, 1));
    const end = new Date(start);
    if (period === "week") end.setUTCDate(end.getUTCDate() + 1); else end.setUTCMonth(end.getUTCMonth() + 1);
    const matching = orders.filter(order => { const date = new Date(order.created_at); return date >= start && date < end; });
    return {
      name: start.toLocaleDateString("en-GB", { [period === "week" ? "weekday" : "month"]: "short", timeZone: "Africa/Accra" }),
      date: start.toISOString().slice(0, 10), orders: matching.length, collected: matching.filter(collectedOrder).length,
      revenue: Math.round(matching.filter(collectedOrder).reduce((sum, order) => sum + orderValue(order), 0) * 100) / 100,
    };
  });
}

export function exportDashboardCsv(filename: string, rows: (string | number)[][]) {
  const csv = rows.map(row => row.map(value => {
    const text = String(value); return '"' + (/^[=+\-@\t\r]/.test(text) ? "'" + text : text).replace(/"/g, '""') + '"';
  }).join(",")).join("\r\n");
  const url = URL.createObjectURL(new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" }));
  const link = document.createElement("a"); link.href = url; link.download = filename; link.click(); URL.revokeObjectURL(url);
}
