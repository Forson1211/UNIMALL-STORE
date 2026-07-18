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
    refetchInterval: 30000,
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
    refetchInterval: 30000,
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
    refetchInterval: 300000, // 5 mins
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
    refetchInterval: 300000,
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
    refetchInterval: 60000,
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
      <div className="space-y-6 animate-fade-in">
        
        {/* Header with Refresh */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card p-4 rounded-xl border border-border shadow-sm">
          <div>
            <h2 className="text-xl font-bold tracking-tight">Overview & Analytics</h2>
            <p className="text-sm text-muted-foreground">Monitor your platform's health and sales performance.</p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            disabled={isRefreshing}
            className="w-full sm:w-auto gap-2"
          >
            <RefreshCcw className={`w-4 h-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            {isRefreshing ? 'Refreshing...' : 'Refresh Data'}
          </Button>
        </div>

        {/* Main Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatsCard
            title="Total Revenue"
            value={`GH₵${(stats?.total_revenue || 0).toLocaleString()}`}
            icon={DollarSign}
            variant="primary"
          />
          <StatsCard
            title="Total Orders"
            value={(stats?.total_orders || 0).toLocaleString()}
            description={stats?.new_orders_week ? `+${stats.new_orders_week} this week` : undefined}
            icon={ShoppingCart}
            variant="secondary"
          />
          <StatsCard
            title="Total Products"
            value={(stats?.total_products || 0).toLocaleString()}
            description={`${stats?.active_products || 0} active`}
            icon={Package}
          />
          <StatsCard
            title="Total Users"
            value={(stats?.total_users || 0).toLocaleString()}
            description={stats?.new_users_week ? `+${stats.new_users_week} this week` : undefined}
            icon={Users}
            variant="warning"
          />
        </div>

        {/* Analytics Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue Trend Line Chart */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Weekly Revenue Trend</CardTitle>
              <Activity className="h-4 w-4 text-primary" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueTrendData}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis 
                      stroke="hsl(var(--muted-foreground))" 
                      fontSize={12} 
                      tickLine={false} 
                      axisLine={false}
                      tickFormatter={(value) => `GH₵${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Line type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" strokeWidth={3} dot={{ r: 4, strokeWidth: 2 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Order Volume Area Chart */}
          <Card className="shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-base font-semibold">Orders Volume (Monthly)</CardTitle>
              <ShoppingCart className="h-4 w-4 text-secondary" />
            </CardHeader>
            <CardContent>
              <div className="h-[300px] mt-4">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={activeRevenueData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorOrders" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#06B6D4" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#06B6D4" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }} />
                    <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))' }} />
                    <Area type="monotone" dataKey="orders" stroke="#06B6D4" strokeWidth={2} fillOpacity={1} fill="url(#colorOrders)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Demographics & Status Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* User Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" /> User Roles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={userRolesData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {userRolesData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={ROLE_COLORS[index % ROLE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))' }} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                   <span className="text-3xl font-bold">{stats?.total_users || 0}</span>
                   <span className="text-xs text-muted-foreground">Total Users</span>
                </div>
              </div>
              <div className="flex justify-center gap-4 mt-2">
                 {userRolesData.map((role, i) => (
                   <div key={role.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: ROLE_COLORS[i] }}></div>
                      <span className="text-xs text-muted-foreground">{role.name}: {role.value}</span>
                   </div>
                 ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Status Distribution */}
          <Card className="shadow-sm">
            <CardHeader>
               <CardTitle className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-amber-500" /> Order Status Distribution
              </CardTitle>
            </CardHeader>
            <CardContent>
               <div className="h-[250px] w-full">
                 <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={orderStatusData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        innerRadius={60}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {orderStatusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))' }} />
                      <Legend verticalAlign="bottom" height={36}/>
                    </PieChart>
                 </ResponsiveContainer>
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Vendor Stats row */}
        <h3 className="font-semibold text-lg mt-8 mb-2 flex items-center gap-2">
          <Store className="w-5 h-5 text-emerald-500" /> Vendor Health
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div onClick={() => navigate("/admin/vendors")} className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-primary/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-muted-foreground">Total Vendors</span>
              <Store className="w-4 h-4 text-primary" />
            </div>
            <span className="text-2xl font-bold">{stats?.total_vendors || 0}</span>
          </div>

          <div onClick={() => navigate("/admin/vendors")} className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-emerald-500/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-emerald-600">Approved</span>
              <UserCheck className="w-4 h-4 text-emerald-500" />
            </div>
            <span className="text-2xl font-bold">{stats?.vendors_approved || 0}</span>
          </div>

          <div onClick={() => navigate("/admin/vendors")} className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-gold/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-gold">Pending Review</span>
              <Clock className="w-4 h-4 text-gold" />
            </div>
            <span className="text-2xl font-bold">{stats?.vendors_pending || 0}</span>
          </div>

          <div onClick={() => navigate("/admin/vendors")} className="p-4 rounded-xl border border-border bg-card cursor-pointer hover:border-destructive/50 transition-colors">
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm font-medium text-destructive">Suspended</span>
              <Ban className="w-4 h-4 text-destructive" />
            </div>
            <span className="text-2xl font-bold">{stats?.vendors_suspended || 0}</span>
          </div>
        </div>

        {/* Detailed Sales Analytics */}
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="text-lg font-semibold flex items-center gap-2">
              <BarChartIcon className="w-5 h-5 text-emerald-500" /> Platform Multi-Metric Growth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={activeRevenueData}>
                   <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                   <XAxis dataKey="name" stroke="hsl(var(--muted-foreground))" fontSize={12} tickLine={false} axisLine={false} />
                   <YAxis yAxisId="left" orientation="left" stroke="hsl(var(--primary))" fontSize={12} axisLine={false} tickLine={false} />
                   <YAxis yAxisId="right" orientation="right" stroke="hsl(var(--secondary))" fontSize={12} axisLine={false} tickLine={false} />
                   <Tooltip contentStyle={{ borderRadius: '8px', backgroundColor: 'hsl(var(--card))' }} />
                   <Legend />
                   <Bar yAxisId="left" dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Revenue (GH₵)" />
                   <Bar yAxisId="right" dataKey="orders" fill="hsl(var(--secondary))" radius={[4, 4, 0, 0]} name="Order Volume" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders & Top Vendors */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DataTable
            title="Recent Orders"
            data={recentOrders.slice(0, 5)}
            columns={orderColumns}
            actions={
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate("/admin/orders")}>View All</Button>
            }
          />

          <DataTable
            title="Top Performing Vendors"
            data={topVendors.slice(0, 5)}
            columns={vendorColumns}
            actions={
              <Button variant="ghost" size="sm" className="text-xs h-8" onClick={() => navigate("/admin/vendors")}>View All</Button>
            }
          />
        </div>

      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
