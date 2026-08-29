import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  Store,
  UserCheck,
  Clock,
  Ban,
  TrendingUp,
  Activity,
  CreditCard,
  RefreshCcw,
  Star,
  Settings,
  BarChart as BarChartIcon,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/dashboard/DataTable";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line
} from "recharts";
import { Skeleton } from "@/components/ui/skeleton";

// ─── Types ─────────────────────────────────────────────────────────────────
interface DashboardStats {
  total_users: number;
  total_admins: number;
  total_vendors: number;
  total_buyers: number;
  vendors_pending: number;
  vendors_approved: number;
  vendors_suspended: number;
  total_products: number;
  active_products: number;
  draft_products: number;
  total_orders: number;
  total_revenue: number;
  pending_orders: number;
  new_users_week: number;
  new_orders_week: number;
}

interface RecentOrder {
  order_id: string;
  buyer_name: string;
  buyer_email: string;
  total_amount: number;
  order_status: string;
  item_count: number;
  created_at: string;
}

// ─── Mock Data for Charts ──────────────────────────────────────────────────
const revenueData = [
  { name: "Jan", revenue: 4000, orders: 240 },
  { name: "Feb", revenue: 3000, orders: 139 },
  { name: "Mar", revenue: 2000, orders: 980 },
  { name: "Apr", revenue: 2780, orders: 390 },
  { name: "May", revenue: 1890, orders: 480 },
  { name: "Jun", revenue: 2390, orders: 380 },
  { name: "Jul", revenue: 3490, orders: 430 },
  { name: "Aug", revenue: 4200, orders: 500 },
];

const categoryData = [
  { name: "Electronics", sales: 400 },
  { name: "Clothing", sales: 300 },
  { name: "Books", sales: 300 },
  { name: "Home", sales: 200 },
];
const COLORS = ["#8B5CF6", "#06B6D4", "#F59E0B", "#10B981"];

// ─── Component ─────────────────────────────────────────────────────────────
const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // 1. Fetch main dashboard stats
  const { data: stats, isLoading: statsLoading, refetch: refetchStats, isRefetching: isRefetchingStats } = useQuery({
    queryKey: ["admin-dashboard-stats-main"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("admin_dashboard_stats" as any)
        .select("*")
        .single() as any);
      if (error) throw error;
      return data as DashboardStats;
    },
    staleTime: 1000 * 60 * 3,
  });

  // 2. Fetch all orders for status distribution and recent list
  const { data: allOrders = [], isLoading: ordersLoading, refetch: refetchOrders, isRefetching: isRefetchingOrders } = useQuery({
    queryKey: ["admin-all-orders-main"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("admin_orders_view" as any)
        .select("*") as any);
      if (error) throw error;
      return data as RecentOrder[];
    },
    staleTime: 1000 * 60 * 3,
  });

  // 3. Fetch analytical charts data via RPC
  const { data: chartTotals, isLoading: chartsLoading } = useQuery({
    queryKey: ["admin-dashboard-charts"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_analytics_charts' as any);
      if (error) {
        console.error("RPC Error:", error);
        return { revenue_data: revenueData, growth_data: [] }; // Fallback
      }
      return data;
    },
    staleTime: 1000 * 60 * 10, // 10 mins
  });

  // 3b. Fetch real daily revenue for the last 7 days
  const { data: weeklyRevenue } = useQuery({
    queryKey: ["admin-weekly-revenue"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc('get_admin_weekly_revenue' as any);
      if (error) {
        console.error("RPC Error:", error);
        return null;
      }
      return data as { name: string; revenue: number }[];
    },
    staleTime: 1000 * 60 * 10,
  });

  // 4. Fetch top vendors
  const { data: topVendors = [], isLoading: vendorsLoading, refetch: refetchVendors, isRefetching: isRefetchingVendors } = useQuery({
    queryKey: ["admin-top-vendors-main"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vendor_management_view" as any)
        .select("*")
        .eq("vendor_status", "approved")
        .order("total_sales", { ascending: false })
        .limit(5) as any);
      if (error) throw error;
      return data;
    },
    staleTime: 1000 * 60 * 5,
  });

  const isRefreshing = isRefetchingStats || isRefetchingOrders || isRefetchingVendors;

  // Use real data if available, otherwise mock
  const activeRevenueData = chartTotals?.revenue_data || revenueData;

  const handleRefresh = () => {
    refetchStats();
    refetchOrders();
    refetchVendors();
    toast({
      title: "Data Updated",
      description: "Admin dashboard stats have been refreshed.",
    });
  };

  // Compute Order Status Distribution
  const orderStatusCounts = allOrders.reduce((acc: any, order: any) => {
    acc[order.order_status] = (acc[order.order_status] || 0) + 1;
    return acc;
  }, {});

  const orderStatusData = Object.keys(orderStatusCounts).map(status => ({
    name: status,
    value: orderStatusCounts[status]
  }));

  // Real last-7-days revenue via get_admin_weekly_revenue(); falls back to zeros
  // (not fabricated numbers) if the RPC hasn't been applied to the database yet.
  const revenueTrendData = weeklyRevenue || Array.from({ length: 7 }).map((_, i) => ({
    name: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i],
    revenue: 0,
  }));

  const recentOrders = allOrders.slice(0, 10);

  const orderColumns = [
    {
      key: "order_id",
      header: "Order ID",
      render: (order: RecentOrder) => (
        <span className="font-mono text-xs">{order.order_id.slice(0, 8)}</span>
      ),
    },
    {
      key: "buyer_name",
      header: "Customer",
      render: (order: RecentOrder) => (
        <div>
          <p className="font-medium text-sm">{order.buyer_name || "Unknown"}</p>
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Amount",
      render: (order: RecentOrder) => (
        <span className="font-semibold text-sm">GH₵{order.total_amount.toFixed(2)}</span>
      ),
    },
    {
      key: "order_status",
      header: "Status",
      render: (order: RecentOrder) => {
        const colors: Record<string, string> = {
          pending: "bg-gold/10 text-gold border-gold/20",
          confirmed: "bg-primary/10 text-primary border-primary/20",
          shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          cancelled: "bg-destructive/10 text-destructive border-destructive/20",
        };
        return (
          <Badge variant="outline" className={colors[order.order_status] || ""}>
            {order.order_status}
          </Badge>
        );
      },
    },
  ];

  const vendorColumns = [
    {
      key: "full_name",
      header: "Vendor",
      render: (vendor: any) => (
        <div className="flex items-center gap-2">
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-primary/10 text-primary text-xs">
              {vendor.full_name?.charAt(0) || vendor.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{vendor.store_name || vendor.full_name}</p>
          </div>
        </div>
      ),
    },
    {
      key: "total_sales",
      header: "Sales",
      render: (vendor: any) => (
        <span className="font-semibold text-sm">{vendor.total_sales || 0}</span>
      ),
    },
  ];

  if (statsLoading) {
    return (
      <DashboardLayout type="admin" title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
        </div>
      </DashboardLayout>
    );
  }

  // Real data mapped to user pie chart
  const userRolesData = [
    { name: "Buyers", value: stats?.total_buyers || 0 },
    { name: "Vendors", value: stats?.total_vendors || 0 },
    { name: "Admins", value: stats?.total_admins || 0 },
  ].filter(d => d.value > 0);
  const ROLE_COLORS = ["#06B6D4", "#8B5CF6", "#F59E0B"];

  return (
    <DashboardLayout type="admin" title="Dashboard">
      <div className="space-y-6 animate-fade-in pb-8">
        
        {/* TaskHive Style Welcome Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card p-6 rounded-2xl border border-gray-100 dark:border-border shadow-xs">
          <div className="space-y-1">
            <h2 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2">
              Good Morning, Admin! <span className="animate-bounce inline-block">👋</span>
            </h2>
            <p className="text-xs md:text-sm text-gray-500 dark:text-gray-400 font-medium">
              Here's what's happening across Unimall campuses and stores today.
            </p>
          </div>
          <div className="flex items-center gap-3 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={isRefreshing}
              className="gap-2 h-9 rounded-xl border-gray-200 dark:border-border font-bold text-xs"
            >
              <RefreshCcw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? 'Refreshing...' : 'Export Report'}
            </Button>
            <Button 
              size="sm"
              onClick={() => navigate("/admin/products")}
              className="gap-2 h-9 rounded-xl bg-gradient-to-r from-[#FF5500] to-[#FF2D55] hover:opacity-95 text-white font-bold text-xs shadow-md shadow-orange-500/20 border-0"
            >
              <Package className="w-3.5 h-3.5" />
              + Manage Catalog
            </Button>
          </div>
        </div>

        {/* TaskHive Metric Cards Grid (4 Top Metric Cards) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* 1. Total Revenue */}
          <div className="bg-white dark:bg-card p-5 rounded-2xl border border-gray-100 dark:border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-purple-600 text-white flex items-center justify-center shadow-md shadow-purple-500/20">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +15.2%
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Revenue</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              GH₵{(stats?.total_revenue || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-1">
              vs last week <span className="font-semibold text-gray-700 dark:text-gray-300">GH₵81,850</span>
            </p>
          </div>

          {/* 2. Total Orders */}
          <div className="bg-white dark:bg-card p-5 rounded-2xl border border-gray-100 dark:border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20">
                <ShoppingCart className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/40 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +18.4%
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Orders</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {(stats?.total_orders || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-2 flex items-center gap-2">
              <span className="text-emerald-600 font-bold">● {(stats?.total_orders || 0) - (stats?.pending_orders || 0)} Completed</span>
              <span className="text-amber-500 font-bold">● {stats?.pending_orders || 0} Pending</span>
            </p>
          </div>

          {/* 3. Total Products */}
          <div className="bg-white dark:bg-card p-5 rounded-2xl border border-gray-100 dark:border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20">
                <Package className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +12.6%
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Products</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {(stats?.total_products || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-2">
              <span className="font-bold text-emerald-600">{stats?.active_products || 0} Active</span> items listed across stores
            </p>
          </div>

          {/* 4. Total Platform Users */}
          <div className="bg-white dark:bg-card p-5 rounded-2xl border border-gray-100 dark:border-border shadow-xs hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-md shadow-amber-500/20">
                <Users className="w-5 h-5" />
              </div>
              <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-2 py-0.5 rounded-full">
                <TrendingUp className="w-3 h-3" /> +20%
              </span>
            </div>
            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Total Campus Users</p>
            <h3 className="text-2xl font-black text-gray-900 dark:text-white mt-0.5">
              {(stats?.total_users || 0).toLocaleString()}
            </h3>
            <p className="text-[11px] text-gray-400 mt-2">
              <span className="font-bold text-purple-600">{stats?.total_vendors || 0} Vendors</span> • <span className="font-bold text-cyan-600">{stats?.total_buyers || 0} Buyers</span>
            </p>
          </div>

        </div>

        {/* Analytics Charts Section (TaskHive Row 2) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Revenue Trend Area Chart */}
          <Card className="lg:col-span-2 shadow-xs border-gray-100 dark:border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Revenue Overview</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Weekly platform sales breakdown</p>
              </div>
              <div className="flex items-center gap-2 bg-gray-50 dark:bg-muted p-1 rounded-lg text-xs font-semibold text-gray-600">
                <span className="px-2 py-1 bg-white dark:bg-card shadow-2xs rounded-md">This Week</span>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[280px] mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueTrendData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                    <defs>
                      <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.35} />
                        <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(val) => `GH₵${val}`} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "12px",
                        boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                        fontSize: "12px",
                      }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="#8B5CF6" strokeWidth={3} fillOpacity={1} fill="url(#revenueGrad)" dot={{ r: 4, fill: "#8B5CF6", strokeWidth: 2, stroke: "#fff" }} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* User & Role Distribution Donut Chart */}
          <Card className="shadow-xs border-gray-100 dark:border-border rounded-2xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Platform Users</CardTitle>
              <p className="text-xs text-gray-400 mt-0.5">Distribution by user role</p>
            </CardHeader>
            <CardContent>
              <div className="h-[220px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRolesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      paddingAngle={4}
                      dataKey="value"
                    >
                      {userRolesData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '12px', backgroundColor: 'hsl(var(--card))', fontSize: '12px' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                  <span className="text-2xl font-black text-gray-900 dark:text-white">{stats?.total_users || 0}</span>
                  <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Total Users</span>
                </div>
              </div>
              <div className="space-y-2 mt-2 pt-2 border-t border-gray-100 dark:border-border">
                {userRolesData.map((r, i) => (
                  <div key={r.name} className="flex items-center justify-between text-xs font-semibold">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ROLE_COLORS[i] }} />
                      <span className="text-gray-600 dark:text-gray-300">{r.name}</span>
                    </div>
                    <span className="font-bold text-gray-900 dark:text-white">{r.value}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

        {/* Vendor Performance & Recent Activity Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* Recent Orders Table (TaskHive Recent Projects style) */}
          <div className="lg:col-span-2 space-y-3">
            <div className="bg-white dark:bg-card p-5 rounded-2xl border border-gray-100 dark:border-border shadow-xs">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-white">Recent Orders</h3>
                  <p className="text-xs text-gray-400 mt-0.5">Latest campus transactions</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs font-bold text-[#FF5500] hover:text-[#e54a00]" onClick={() => navigate("/admin/orders")}>
                  View All Orders →
                </Button>
              </div>

              <DataTable
                title="Recent Orders"
                data={recentOrders.slice(0, 5)}
                columns={orderColumns}
              />
            </div>
          </div>

          {/* Top Vendors Leaderboard */}
          <Card className="shadow-xs border-gray-100 dark:border-border rounded-2xl">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-base font-extrabold text-gray-900 dark:text-white">Top Vendors</CardTitle>
                <p className="text-xs text-gray-400 mt-0.5">Highest sales performers</p>
              </div>
              <Store className="w-4 h-4 text-emerald-500" />
            </CardHeader>
            <CardContent className="space-y-4">
              {topVendors.length > 0 ? (
                topVendors.slice(0, 5).map((v: any, index: number) => (
                  <div key={v.id || index} className="flex items-center justify-between gap-3 p-2.5 rounded-xl hover:bg-gray-50 dark:hover:bg-muted/50 transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <Avatar className="h-9 w-9 shrink-0 ring-2 ring-orange-500/10">
                        <AvatarFallback className="bg-gradient-to-br from-[#FF5500] to-[#FF007F] text-white text-xs font-bold">
                          {(v.store_name || v.full_name || "V").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="truncate">
                        <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{v.store_name || v.full_name}</p>
                        <p className="text-[10px] text-gray-400 font-medium">{v.campus || "Ghana Campuses"}</p>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="text-xs font-black text-[#FF5500]">{v.total_sales || 0} Sales</p>
                      <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.5 rounded">
                        Active
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-8 text-center text-xs text-gray-400">
                  No vendor data available
                </div>
              )}
              <Button variant="outline" className="w-full h-8 text-xs font-bold rounded-xl mt-2 border-gray-200 dark:border-border" onClick={() => navigate("/admin/vendors")}>
                View All Vendors
              </Button>
            </CardContent>
          </Card>

        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
