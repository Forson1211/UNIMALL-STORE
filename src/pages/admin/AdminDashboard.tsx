import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import {
  DollarSign,
  ShoppingCart,
  Package,
  Users,
  TrendingUp,
  TrendingDown,
  Store,
  UserCheck,
  Clock,
  Ban,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { DataTable } from "@/components/dashboard/DataTable";

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

const AdminDashboard = () => {
  const { toast } = useToast();
  const navigate = useNavigate();

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["admin-dashboard-stats"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("admin_dashboard_stats" as any)
        .select("*")
        .single() as any);

      if (error) throw error;
      return data as DashboardStats;
    },
  });

  // Fetch recent orders
  const { data: recentOrders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["admin-recent-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("admin_orders_view" as any)
        .select("*")
        .order("created_at", { ascending: false })
        .limit(10) as any);

      if (error) throw error;
      return data as RecentOrder[];
    },
  });

  // Fetch top vendors
  const { data: topVendors = [], isLoading: vendorsLoading } = useQuery({
    queryKey: ["admin-top-vendors"],
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
  });

  const orderColumns = [
    {
      key: "order_id",
      header: "Order ID",
      render: (order: RecentOrder) => (
        <span className="font-mono text-sm">{order.order_id.slice(0, 8)}...</span>
      ),
    },
    {
      key: "buyer_name",
      header: "Customer",
      render: (order: RecentOrder) => (
        <div>
          <p className="font-medium">{order.buyer_name || "Unknown"}</p>
          <p className="text-xs text-muted-foreground">{order.buyer_email}</p>
        </div>
      ),
    },
    {
      key: "total_amount",
      header: "Amount",
      render: (order: RecentOrder) => (
        <span className="font-semibold">GH₵{order.total_amount.toFixed(2)}</span>
      ),
    },
    {
      key: "order_status",
      header: "Status",
      render: (order: RecentOrder) => {
        const statusColors: Record<string, string> = {
          pending: "bg-gold/10 text-gold border-gold/20",
          confirmed: "bg-primary/10 text-primary border-primary/20",
          shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
          delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
          cancelled: "bg-destructive/10 text-destructive border-destructive/20",
        };
        return (
          <Badge variant="outline" className={statusColors[order.order_status] || ""}>
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
            <p className="text-xs text-muted-foreground">{vendor.product_count} products</p>
          </div>
        </div>
      ),
    },
    {
      key: "total_sales",
      header: "Sales",
      render: (vendor: any) => (
        <span className="font-semibold">{vendor.total_sales || 0}</span>
      ),
    },
  ];

  if (statsLoading) {
    return (
      <DashboardLayout type="admin" title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading dashboard...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin" title="Dashboard">
      {/* Main Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
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

      {/* Vendor Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <div
          className="p-4 rounded-xl border bg-card cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/vendors")}
        >
          <div className="flex items-center justify-between mb-2">
            <Store className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold text-primary">{stats?.total_vendors || 0}</span>
          </div>
          <p className="text-sm font-medium">Total Vendors</p>
        </div>

        <div
          className="p-4 rounded-xl border bg-card cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/vendors")}
        >
          <div className="flex items-center justify-between mb-2">
            <UserCheck className="w-5 h-5 text-emerald-500" />
            <span className="text-2xl font-bold text-emerald-500">{stats?.vendors_approved || 0}</span>
          </div>
          <p className="text-sm font-medium">Approved Vendors</p>
        </div>

        <div
          className="p-4 rounded-xl border bg-card cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/vendors")}
        >
          <div className="flex items-center justify-between mb-2">
            <Clock className="w-5 h-5 text-gold" />
            <span className="text-2xl font-bold text-gold">{stats?.vendors_pending || 0}</span>
          </div>
          <p className="text-sm font-medium">Pending Approval</p>
        </div>

        <div
          className="p-4 rounded-xl border bg-card cursor-pointer hover:shadow-md transition-shadow"
          onClick={() => navigate("/admin/vendors")}
        >
          <div className="flex items-center justify-between mb-2">
            <Ban className="w-5 h-5 text-destructive" />
            <span className="text-2xl font-bold text-destructive">{stats?.vendors_suspended || 0}</span>
          </div>
          <p className="text-sm font-medium">Suspended</p>
        </div>
      </div>

      {/* User Breakdown */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between mb-2">
            <Users className="w-5 h-5 text-purple-500" />
            <span className="text-2xl font-bold">{stats?.total_admins || 0}</span>
          </div>
          <p className="text-sm font-medium">Admins</p>
        </div>

        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between mb-2">
            <Store className="w-5 h-5 text-secondary" />
            <span className="text-2xl font-bold">{stats?.total_vendors || 0}</span>
          </div>
          <p className="text-sm font-medium">Vendors</p>
        </div>

        <div className="p-4 rounded-xl border bg-card">
          <div className="flex items-center justify-between mb-2">
            <ShoppingCart className="w-5 h-5 text-primary" />
            <span className="text-2xl font-bold">{stats?.total_buyers || 0}</span>
          </div>
          <p className="text-sm font-medium">Buyers</p>
        </div>
      </div>

      {/* Recent Orders & Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <DataTable
          title="Recent Orders"
          data={recentOrders}
          columns={orderColumns}
          pageSize={5}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/orders")}>
              View All
            </Button>
          }
        />

        <DataTable
          title="Top Vendors"
          data={topVendors}
          columns={vendorColumns}
          pageSize={5}
          actions={
            <Button variant="outline" size="sm" onClick={() => navigate("/admin/vendors")}>
              View All
            </Button>
          }
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
