import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowUpRight, Download, RefreshCw, ShoppingBag, Wallet, CircleDollarSign, Truck } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { exportDashboardCsv, money } from "@/lib/dashboardMetrics";
import { chartDate, percentage, type CommerceAnalytics as AnalyticsReport } from "@/lib/commerceAnalytics";
import { MetricItem, OrderStatus, OverviewPanel } from "@/components/dashboard/OverviewWidgets";
import { ActivityHeatmap, CategoryDonut, HealthRings, ProductRevenueChart, SalesTrend, WeekdayRadar } from "@/components/dashboard/AnalyticsCharts";

export default function CommerceAnalytics({ scope }: { scope: "vendor" | "admin" }) {
  const { user, profile } = useAuth();
  const [days, setDays] = useState(30);
  const title = scope === "admin" ? "Marketplace analytics" : "Sales insights";
  const reportQuery = useQuery({ queryKey: ["commerce-analytics", scope, user?.id, days], enabled: !!user, staleTime: 15000, refetchInterval: 30000, queryFn: async () => {
    const { data, error } = await api.rpc(scope === "admin" ? "get_admin_analytics" : "get_vendor_sales_insights", { days });
    if (error) throw error; return data as AnalyticsReport;
  } });
  const report = reportQuery.data;
  const exportReport = () => { if (report) exportDashboardCsv(`unimall-${scope}-analytics-${report.start}-${report.end}.csv`, [
    ["Report", title], ["Start date (Ghana)", report.start], ["End date (Ghana)", report.end], ["Collected sales (GHS)", report.totals.revenue], ["Orders", report.totals.orders],
    [], ["Date", "Orders", "Collected orders", "Collected sales (GHS)", "Non-cancelled order value (GHS)"], ...report.daily.map(day => [day.date, day.orders, day.collected, day.revenue, day.ordered_value]),
    [], ["Category", "Collected sales (GHS)"], ...report.categories.map(category => [category.name, category.value]),
  ]); };
  return <DashboardLayout type={scope} title={title}><div className="mx-auto max-w-[1600px] space-y-5">
    <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="mb-1 text-[11px] text-muted-foreground">Dashboard / Analytics</p><h1 className="text-[23px] font-semibold tracking-[-0.035em]">{title}</h1><p className="mt-1 text-xs text-muted-foreground">{scope === "vendor" ? `${profile?.store_name || "Your store"} / Sales, products and fulfillment` : "Unimall / Sales and activity across your marketplace"}</p></div><div className="flex flex-wrap items-center gap-2"><select aria-label="Reporting period" value={days} onChange={event => setDays(Number(event.target.value))} className="h-9 rounded-md border border-border bg-card px-3 text-xs outline-none focus:ring-2 focus:ring-primary/20"><option value={7}>Last 7 days</option><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last 12 months</option></select><Button variant="outline" size="sm" aria-label="Refresh analytics" disabled={reportQuery.isFetching} onClick={() => reportQuery.refetch()} className="h-9 w-9 rounded-md bg-card p-0"><RefreshCw className={`h-3.5 w-3.5 ${reportQuery.isFetching ? "animate-spin" : ""}`} /></Button><Button size="sm" disabled={!report || reportQuery.isError} onClick={exportReport} className="h-9 gap-2 rounded-md text-xs"><Download className="h-3.5 w-3.5" />Export</Button></div></div>
    {reportQuery.isError ? <div role="alert" className="dashboard-panel p-6"><p className="text-sm">Analytics could not load. {reportQuery.error.message}</p><Button variant="link" onClick={() => reportQuery.refetch()}>Try again</Button></div> : reportQuery.isLoading || !report ? <div role="status" className="grid gap-5 md:grid-cols-2"><span className="sr-only">Loading analytics...</span>{[0, 1, 2, 3].map(index => <div key={index} className="dashboard-panel h-64 animate-pulse bg-muted" />)}</div> : <>
      <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] text-muted-foreground"><span>{chartDate(report.start, { day: "numeric", month: "short", year: "numeric" })} – {chartDate(report.end, { day: "numeric", month: "short", year: "numeric" })} · Ghana time</span><span>Updated {new Date(report.generated_at).toLocaleTimeString("en-GH", { hour: "2-digit", minute: "2-digit", timeZone: "Africa/Accra" })}</span></div>
      <div className="grid gap-5 sm:grid-cols-2 2xl:grid-cols-4">{[
        { icon: Wallet, tone: "orange" as const, label: "Collected sales", value: money(report.totals.revenue, true) },
        { icon: ShoppingBag, tone: "cyan" as const, label: "Orders placed", value: report.totals.orders.toLocaleString() },
        { icon: CircleDollarSign, tone: "purple" as const, label: "Average collected sale", value: money(report.totals.revenue / (report.totals.collected || 1), true) },
        { icon: Truck, tone: "green" as const, label: "Delivery rate", value: `${percentage(report.totals.delivered, report.totals.orders - report.totals.cancelled)}%` },
      ].map(item => <div key={item.label} className="dashboard-panel p-5"><MetricItem {...item} /></div>)}</div>
      <div className="grid gap-5 xl:grid-cols-2"><SalesTrend report={report} /><ProductRevenueChart report={report} /></div>
      <div className="grid items-stretch gap-5 xl:grid-cols-3"><div className="min-w-0 xl:col-span-2"><ActivityHeatmap report={report} /><OverviewPanel title="Order status" description="Current fulfillment status of orders placed in this period" className="mt-5"><div className="flex flex-wrap gap-3">{["pending", "confirmed", "shipped", "delivered", "cancelled"].map(status => <div key={status} className="flex items-center gap-3 rounded-md border border-border px-3 py-2"><OrderStatus status={status} /><span className="text-sm font-semibold">{report.statuses.filter(item => item.name === status || status === "confirmed" && item.name === "processing").reduce((sum, item) => sum + item.value, 0)}</span></div>)}</div></OverviewPanel></div><HealthRings report={report} /></div>
      <div className="grid items-stretch gap-5 xl:grid-cols-2"><WeekdayRadar report={report} /><CategoryDonut report={report} /></div>
      <div className="dashboard-panel flex flex-wrap items-center justify-between gap-4 px-5 py-4"><p className="max-w-3xl text-[11px] leading-relaxed text-muted-foreground">Reports group orders by their creation date. Collected sales include delivered, paid orders after discounts; cancelled items are excluded. Catalog and store approval rates show current status.</p><Button asChild variant="ghost" size="sm" className="text-xs text-primary"><Link to={`/${scope}/orders`}>Manage orders<ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link></Button></div>
    </>}
  </div></DashboardLayout>;
}
