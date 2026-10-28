export interface AnalyticsDay { date: string; orders: number; collected: number; revenue: number; ordered_value: number }
export interface CommerceAnalytics {
  scope: "admin" | "vendor"; days: number; start: string; end: string; generated_at: string;
  totals: { orders: number; delivered: number; collected: number; cancelled: number; revenue: number; ordered_value: number };
  daily: AnalyticsDay[];
  hourly: { weekday: number; hour: number; orders: number; revenue: number }[];
  statuses: { name: string; value: number }[];
  categories: { name: string; value: number }[];
  products: { id: string; name: string; units: number; value: number }[];
  catalog: { total: number; published: number; in_stock: number; low_stock: number };
  vendors: { total: number; approved: number } | null;
}
const dayMs = 86400000;
export const chartDate = (date: string, options: Intl.DateTimeFormatOptions = { day: "numeric", month: "short" }) => new Date(date + "T00:00:00Z").toLocaleDateString("en-GH", { ...options, timeZone: "Africa/Accra" });
export function filledDays(report: CommerceAnalytics): AnalyticsDay[] {
  const values = new Map(report.daily.map(day => [day.date, day]));
  const start = Date.parse(report.start + "T00:00:00Z");
  return Array.from({ length: report.days }, (_, index) => {
    const date = new Date(start + index * dayMs).toISOString().slice(0, 10);
    return values.get(date) || { date, orders: 0, collected: 0, revenue: 0, ordered_value: 0 };
  });
}
export function trendPoints(report: CommerceAnalytics) {
  const days = filledDays(report);
  if (report.days <= 90) return days.map(day => ({ ...day, name: chartDate(day.date) }));
  const months = new Map<string, AnalyticsDay & { name: string }>();
  for (const day of days) {
    const key = day.date.slice(0, 7);
    const entry = months.get(key) || { date: day.date, name: chartDate(day.date, { month: "short", year: "2-digit" }), orders: 0, collected: 0, revenue: 0, ordered_value: 0 };
    entry.orders += day.orders; entry.collected += day.collected;
    entry.revenue = Math.round((entry.revenue + day.revenue) * 100) / 100;
    entry.ordered_value = Math.round((entry.ordered_value + day.ordered_value) * 100) / 100;
    months.set(key, entry);
  }
  return [...months.values()];
}
export function weekdayActivity(report: CommerceAnalytics) {
  const weekdays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map(name => ({ name, orders: 0, collected: 0 }));
  for (const day of report.daily) {
    const index = (new Date(day.date + "T00:00:00Z").getUTCDay() + 6) % 7;
    weekdays[index].orders += day.orders; weekdays[index].collected += day.collected;
  }
  return weekdays;
}
export const percentage = (numerator: number, denominator: number) => denominator > 0 ? Math.min(100, Math.round(numerator / denominator * 100)) : 0;
