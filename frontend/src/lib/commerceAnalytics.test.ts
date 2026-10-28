import { filledDays, percentage, trendPoints, weekdayActivity, type CommerceAnalytics } from "./commerceAnalytics";

const report = {
  days: 7, start: "2026-10-21", end: "2026-10-27",
  daily: [{ date: "2026-10-21", orders: 3, collected: 1, revenue: 19.99, ordered_value: 29.99 }, { date: "2026-10-27", orders: 2, collected: 1, revenue: 5.01, ordered_value: 10 }],
} as CommerceAnalytics;
it("keeps zero activity days and displays Ghana date labels", () => {
  const days = filledDays(report);
  expect(days).toHaveLength(7);
  expect(days[1]).toEqual({ date: "2026-10-22", orders: 0, collected: 0, revenue: 0, ordered_value: 0 });
  expect(trendPoints(report)[6]).toMatchObject({ name: "27 Oct", revenue: 5.01 });
});
it("uses true order counts for weekday comparisons and empty rates", () => {
  const weekdays = weekdayActivity(report);
  expect(weekdays[1]).toEqual({ name: "Tue", orders: 2, collected: 1 });
  expect(weekdays[2]).toEqual({ name: "Wed", orders: 3, collected: 1 });
  expect(percentage(0, 0)).toBe(0);
  expect(percentage(1, 3)).toBe(33);
});
it("aggregates annual charts without losing money at month boundaries", () => {
  const annual = { ...report, days: 365, start: "2025-10-28", daily: [
    { date: "2026-01-31", orders: 1, collected: 1, revenue: 0.1, ordered_value: 0.1 },
    { date: "2026-01-30", orders: 1, collected: 1, revenue: 0.2, ordered_value: 0.2 },
    { date: "2026-02-01", orders: 1, collected: 1, revenue: 9, ordered_value: 9 },
  ] };
  const points = trendPoints(annual);
  expect(points.find(point => point.date.startsWith("2026-01"))).toMatchObject({ revenue: 0.3, collected: 2 });
  expect(points.find(point => point.date.startsWith("2026-02"))).toMatchObject({ revenue: 9, collected: 1 });
  expect(points.reduce((sum, point) => sum + point.orders, 0)).toBe(3);
});
