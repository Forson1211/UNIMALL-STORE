import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Download, RefreshCw, ShoppingCart, Users, Package, Wallet, Store, ArrowUpRight, Clock, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { money, overviewSeries, exportDashboardCsv, type OverviewOrder } from "@/lib/dashboardMetrics";
import { OverviewPanel, OverviewWelcome, MetricItem, Sparkline, ProgressRing, RevenueReport, DistributionChart, OverviewEmpty, OrderStatus } from "@/components/dashboard/OverviewWidgets";

interface DashboardStats {
  total_users: number; total_buyers: number; total_vendors: number; total_admins: number;
  total_products: number; active_products: number; draft_products: number; total_orders: number; total_revenue: number;
  vendors_pending: number; vendors_approved: number; vendors_suspended: number; pending_orders: number; new_users_week: number; new_orders_week: number;
}
interface RecentOrder extends OverviewOrder { order_id: string; buyer_name: string; buyer_email: string; total_amount: number; order_status: string; item_count: number }
interface Merchant { id: string; name: string; campus?: string; avatar_url?: string; total_sales: number; products: number }
const emptyStats: DashboardStats = { total_users: 0, total_buyers: 0, total_vendors: 0, total_admins: 0, total_products: 0, active_products: 0, draft_products: 0, total_orders: 0, total_revenue: 0, vendors_pending: 0, vendors_approved: 0, vendors_suspended: 0, pending_orders: 0, new_users_week: 0, new_orders_week: 0 };

export default function AdminDashboard() {
  const { user, profile, role } = useAuth();
  const canSeeOrders = ["admin", "order_manager"].includes(role || "");
  const canSeeRevenue = ["admin", "moderator", "order_manager"].includes(role || "");
  const canManageVendors = ["admin", "vendor_manager"].includes(role || "");
  const canManageProducts = ["admin", "moderator"].includes(role || "");
  const statsQuery = useQuery({ queryKey: ["admin-dashboard-stats-main", user?.id], enabled: !!user, staleTime: 15000, refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await api.from("admin_dashboard_stats").select("*").single(); if (error) throw error; return data as DashboardStats;
  } });
  const ordersQuery = useQuery({ queryKey: ["admin-all-orders-main", user?.id], enabled: !!user && canSeeOrders, refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await api.from("admin_orders_secure").select("*").order("created_at", { ascending: false }).limit(100); if (error) throw error; return (data || []) as RecentOrder[];
  } });
  const revenueQuery = useQuery({ queryKey: ["admin-weekly-revenue", user?.id], enabled: !!user && canSeeRevenue, refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await api.rpc("get_admin_weekly_revenue"); if (error) throw error; return data as { name: string; revenue: number }[];
  } });
  const vendorsQuery = useQuery({ queryKey: ["admin-top-vendors-main", user?.id], enabled: !!user && canManageVendors, refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await api.from("vendor_management_view").select("*").eq("vendor_status", "approved").order("total_sales", { ascending: false }).limit(5); if (error) throw error; return (data || []) as Merchant[];
  } });
  const stats = statsQuery.data || emptyStats, orders = ordersQuery.data || [], vendors = vendorsQuery.data || [];
  const series = overviewSeries(orders, "week").map((point, index) => ({ ...point, revenue: revenueQuery.data?.[index]?.revenue || 0 }));
  const periodRevenue = series.reduce((sum, point) => sum + point.revenue, 0);
  const approvedRate = stats.total_vendors ? stats.vendors_approved / stats.total_vendors * 100 : 0;
  const updated = statsQuery.dataUpdatedAt ? new Date(statsQuery.dataUpdatedAt).toLocaleTimeString("en-GH", { timeZone: "Africa/Accra", hour: "2-digit", minute: "2-digit" }) : "Loading";
  const refreshing = statsQuery.isFetching || ordersQuery.isFetching || revenueQuery.isFetching || vendorsQuery.isFetching;
  const refresh = () => { void statsQuery.refetch(); if (canSeeOrders) void ordersQuery.refetch(); if (canSeeRevenue) void revenueQuery.refetch(); if (canManageVendors) void vendorsQuery.refetch(); };
  const name = profile?.store_name || (profile?.full_name || "Admin").trim().split(" ")[0];
  const primaryRoute = canManageVendors ? "/admin/vendors" : canSeeOrders ? "/admin/orders" : role === "content_manager" ? "/admin/content" : role === "support_agent" ? "/admin/support" : "/admin/products";
  const error = statsQuery.error;
  return <DashboardLayout type="admin" title="Marketplace overview">
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="mb-0.5 text-xs font-semibold text-primary">Dashboard / Overview</p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground flex items-center gap-2">
            Welcome back, {name} <span className="inline-block">👋</span>
          </h1>
          <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
            Here is what is happening across your campus marketplace today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            onClick={refresh} 
            disabled={refreshing} 
            className="h-9 gap-2 rounded-md border-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs font-semibold shadow-none cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => exportDashboardCsv("unimall-marketplace-overview.csv", [["Metric", "Value"], ["Collected revenue (GHS)", stats.total_revenue], ["Orders", stats.total_orders], ["Products", stats.total_products], ["Buyers", stats.total_buyers], ["Approved vendors", stats.vendors_approved], ["Pending vendors", stats.vendors_pending]])} disabled={!statsQuery.data} className="h-9 gap-2 rounded-md border-0 text-xs">
            <Download className="h-3.5 w-3.5" />
            Export report
          </Button>
        </div>
      </div>
      {error && <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Could not load marketplace statistics. {error.message}<Button variant="link" onClick={refresh}>Try again</Button></div>}
      {statsQuery.isLoading ? <div role="status" className="grid gap-5 lg:grid-cols-3">{[0, 1, 2].map(index => <div key={index} className="dashboard-panel h-48 animate-pulse bg-muted" />)}<span className="sr-only">Loading marketplace overview...</span></div> : <>
      <div aria-label="Marketplace statistics" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* 1. Purple Card: Collected Revenue */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#7042F4] via-[#7B4FF8] to-[#8C62FC] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {money(stats.total_revenue, true)}
            </span>
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Collected revenue</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">Campus wide sales</p>
          </div>
          <svg viewBox="0 0 144 24" fill="none" className="absolute -bottom-0.5 left-0 right-0 w-full h-5 text-white/30 stroke-current pointer-events-none" strokeWidth="2">
            <path d="M0 16 Q 36 4, 72 16 T 144 16" />
          </svg>
        </div>

        {/* 2. Blue Card: Total Orders */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0091FF] via-[#00A3FF] to-[#33B5FF] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {stats.total_orders.toLocaleString()}
            </span>
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Total orders</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">All campus orders</p>
          </div>
          <svg viewBox="0 0 144 24" fill="none" className="absolute -bottom-0.5 left-0 right-0 w-full h-5 text-white/30 stroke-current pointer-events-none" strokeWidth="2">
            <path d="M0 16 Q 36 4, 72 16 T 144 16" />
          </svg>
        </div>

        {/* 3. Orange Card: Products */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FF8C00] via-[#FFA01C] to-[#FFB340] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {stats.total_products.toLocaleString()}
            </span>
            <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Total products</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">Listed campus catalog</p>
          </div>
          <svg viewBox="0 0 100 20" fill="currentColor" className="absolute bottom-0 left-2 right-2 h-5 text-white/25 pointer-events-none">
            <rect x="0" y="12" width="4" height="8" rx="1" />
            <rect x="8" y="6" width="4" height="14" rx="1" />
            <rect x="16" y="14" width="4" height="6" rx="1" />
            <rect x="24" y="4" width="4" height="16" rx="1" />
            <rect x="32" y="8" width="4" height="12" rx="1" />
            <rect x="40" y="2" width="4" height="18" rx="1" />
            <rect x="48" y="10" width="4" height="10" rx="1" />
            <rect x="56" y="6" width="4" height="14" rx="1" />
            <rect x="64" y="14" width="4" height="6" rx="1" />
            <rect x="72" y="2" width="4" height="18" rx="1" />
            <rect x="80" y="8" width="4" height="12" rx="1" />
            <rect x="88" y="12" width="4" height="8" rx="1" />
            <rect x="96" y="6" width="4" height="14" rx="1" />
          </svg>
        </div>

        {/* 4. Pink/Rose Card: Customers */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FF2D6C] via-[#FF3B7A] to-[#FF5E94] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {stats.total_buyers.toLocaleString()}
            </span>
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Total buyers</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">Campus student buyers</p>
          </div>
          <svg viewBox="0 0 144 24" fill="none" className="absolute -bottom-0.5 left-0 right-0 w-full h-5 text-white/30 stroke-current pointer-events-none" strokeWidth="2">
            <path d="M0 16 Q 36 4, 72 16 T 144 16" />
          </svg>
        </div>
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        <div className="grid grid-cols-2 gap-5">
          <OverviewPanel title="Orders" description="Recent activity" bodyClassName="pt-1 sm:pt-1"><Sparkline values={series.map(point => point.orders)} /><p className="mt-3 text-[27px] font-semibold tracking-tight">{stats.new_orders_week.toLocaleString()}</p><p className="mt-1 text-[11px] text-muted-foreground">New this week</p></OverviewPanel>
          <OverviewPanel title="Store approvals" description="Approved vendors" bodyClassName="pt-3 sm:pt-3"><ProgressRing value={approvedRate} color="#ff9f43" /><p className="mt-1 text-center text-[11px] text-muted-foreground">{stats.vendors_approved} of {stats.total_vendors} stores</p></OverviewPanel>
          <OverviewPanel title="Community" description="Customers and merchants" className="col-span-2" bodyClassName="flex items-center justify-between gap-4 py-4 sm:py-4"><div><p className="text-[29px] font-semibold tracking-tight">{stats.total_users.toLocaleString()}</p><p className="mt-1 text-xs text-emerald-600">+{stats.new_users_week.toLocaleString()} new accounts this week</p></div><div className="flex h-16 w-16 items-center justify-center rounded-full border-[7px] border-cyan-500/15 text-cyan-500"><Users className="h-6 w-6" strokeWidth={1.5} /></div></OverviewPanel>
        </div>
        <div className="min-w-0 xl:col-span-2">{canSeeRevenue ? revenueQuery.error ? <OverviewPanel title="Revenue report"><p role="alert" className="text-sm text-muted-foreground">Revenue could not load. <Button variant="link" onClick={() => revenueQuery.refetch()}>Try again</Button></p></OverviewPanel> : <RevenueReport data={series} total={periodRevenue} summary={[{ label: "Lifetime collected", value: money(stats.total_revenue, true) }, { label: "Orders this week", value: stats.new_orders_week.toLocaleString() }]} action={canSeeOrders ? <Button asChild size="sm" className="rounded-md text-xs"><Link to="/admin/orders">View orders</Link></Button> : undefined} /> : <OverviewPanel title="Your workspace" description="Tools available for your staff role"><OverviewEmpty title="Everything in one place" description="Use the navigation to manage your part of the Unimall marketplace." action={<Button asChild size="sm"><Link to={primaryRoute}>Open workspace</Link></Button>} /></OverviewPanel>}</div>
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        <OverviewPanel title="Catalog overview" description="Product publishing across stores" className="lg:col-span-2" action={canManageProducts ? <Button asChild variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary"><Link to="/admin/products">Manage catalog<ArrowUpRight className="h-3.5 w-3.5" /></Link></Button> : undefined}>
          <div className="grid gap-4 sm:grid-cols-3">{[{ label: "Published", value: stats.active_products, icon: CheckCircle2, color: "bg-emerald-500/10 text-emerald-600" }, { label: "Drafts", value: stats.draft_products, icon: Package, color: "bg-orange-500/10 text-primary" }, { label: "Pending orders", value: stats.pending_orders, icon: Clock, color: "bg-violet-500/10 text-violet-500" }].map(item => <div key={item.label} className="rounded-md border border-dashed border-border p-4"><span className={`mb-3 inline-flex rounded-md p-2 ${item.color}`}><item.icon className="h-5 w-5" strokeWidth={1.6} /></span><p className="text-[25px] font-semibold tracking-tight">{item.value.toLocaleString()}</p><p className="mt-1 text-xs text-muted-foreground">{item.label}</p></div>)}</div>
          <div className="mt-6 flex items-center justify-between text-xs"><span className="text-muted-foreground">Catalog publishing rate</span><span className="font-semibold">{stats.total_products ? Math.round(stats.active_products / stats.total_products * 100) : 0}%</span></div><div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-primary" style={{ width: `${stats.total_products ? stats.active_products / stats.total_products * 100 : 0}%` }} /></div>
        </OverviewPanel>
        <DistributionChart title="Store status" description="Vendor account approvals" centerLabel="stores" data={[{ name: "Approved", value: stats.vendors_approved, color: "#29b77e" }, { name: "Pending", value: stats.vendors_pending, color: "#ff9f43" }, { name: "Suspended", value: stats.vendors_suspended, color: "#ea5971" }]} />
      </div>
      <div className="grid gap-5 xl:grid-cols-3">
        {canSeeOrders && <OverviewPanel title="Recent orders" description="The latest purchases in your marketplace" className="xl:col-span-2" bodyClassName="px-0 sm:px-0 pb-0 sm:pb-0" action={<Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary"><Link to="/admin/orders">View all</Link></Button>}>
          {ordersQuery.error ? <p role="alert" className="px-6 pb-6 text-sm text-muted-foreground">Orders could not load. <Button variant="link" onClick={() => ordersQuery.refetch()}>Retry</Button></p> : !orders.length ? <OverviewEmpty title="No orders yet" description="New campus purchases will appear here as customers check out." /> : <div className="overflow-x-auto"><table className="dashboard-table"><thead><tr><th>Order</th><th>Customer</th><th>Total</th><th>Status</th></tr></thead><tbody>{orders.slice(0, 6).map(order => <tr key={order.order_id}><td><Link to="/admin/orders" className="font-medium text-primary">#{order.order_id.slice(0, 8)}</Link><p className="mt-1 text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-GH", { timeZone: "Africa/Accra", day: "numeric", month: "short" })}</p></td><td className="min-w-[140px]"><p className="font-medium">{order.buyer_name || "Campus buyer"}</p><p className="mt-1 text-[10px] text-muted-foreground">{order.item_count} item{order.item_count === 1 ? "" : "s"}</p></td><td className="whitespace-nowrap font-medium">{money(order.total_amount)}</td><td><OrderStatus status={order.order_status} /></td></tr>)}</tbody></table></div>}
        </OverviewPanel>}
        {canManageVendors && <OverviewPanel title="Top stores" description="Ranked by collected sales" className={canSeeOrders ? undefined : "xl:col-span-3"} action={<Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary"><Link to="/admin/vendors">View all</Link></Button>}>
          {vendorsQuery.error ? <p role="alert" className="text-sm text-muted-foreground">Stores could not load. <Button variant="link" onClick={() => vendorsQuery.refetch()}>Retry</Button></p> : !vendors.length ? <OverviewEmpty title="A growing marketplace" description="Approved vendors will appear here when their stores are ready." action={<Button asChild size="sm" className="rounded-md border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold shadow-xs cursor-pointer"><Link to="/admin/vendors">Manage vendors</Link></Button>} /> : <div className="space-y-5">{vendors.map(vendor => <Link key={vendor.id} to="/admin/vendors" className="flex items-center gap-3"><Avatar className="h-9 w-9 rounded-md"><AvatarImage src={vendor.avatar_url || ""} /><AvatarFallback className="rounded-md bg-primary/10 text-xs text-primary">{(vendor.name || "S").slice(0, 2).toUpperCase()}</AvatarFallback></Avatar><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{vendor.name}</p><p className="mt-1 truncate text-[10px] text-muted-foreground">{vendor.campus || "Campus store"}</p></div><span className="text-xs font-medium">{money(Number(vendor.total_sales || 0), true)}</span></Link>)}</div>}
        </OverviewPanel>}
      </div>
      </>}
    </div>
  </DashboardLayout>;
}