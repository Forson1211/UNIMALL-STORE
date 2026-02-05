import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { DollarSign, ShoppingCart, TrendingUp, Eye, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const VendorAnalytics = () => {
  const { user, profile } = useAuth();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats", user?.id],
    queryFn: () => vendorService.getDashboardStats(user!.id),
    enabled: !!user,
  });

  const stats = statsData as any;

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["vendor-products", user?.id],
    queryFn: () => vendorService.getProducts(user!.id),
    enabled: !!user,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", user?.id],
    queryFn: () => vendorService.getOrders(user!.id),
    enabled: !!user,
  });

  const productPerformance = products.slice(0, 5).map((p: any) => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    sales: p.total_sold || 0,
    views: Math.floor(Math.random() * 100) + 10, // Mocked views
  }));

  const weeklyData = [
    { name: 'Mon', orders: 0, sales: 0 },
    { name: 'Tue', orders: 0, sales: 0 },
    { name: 'Wed', orders: 0, sales: 0 },
    { name: 'Thu', orders: 0, sales: 0 },
    { name: 'Fri', orders: 0, sales: 0 },
    { name: 'Sat', orders: 0, sales: 0 },
    { name: 'Sun', orders: 0, sales: 0 },
  ];

  if (statsLoading || productsLoading || ordersLoading) {
    return (
      <DashboardLayout type="vendor" title="Analytics">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="vendor"
      title="Analytics"
      userName={profile?.store_name || profile?.full_name || "Vendor"}
      userRole="Vendor"
    >
      {/* Stats Overview */}
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
          icon={ShoppingCart}
          variant="secondary"
        />
        <StatsCard
          title="Store Views"
          value="2,847"
          change={12.3}
          icon={Eye}
        />
        <StatsCard
          title="Conversion Rate"
          value="4.8%"
          change={2.1}
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Main Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SalesChart data={weeklyData} title="Weekly Revenue" />

        {/* Weekly Performance */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">This Week</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="orders"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Product Performance */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Product Performance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={productPerformance} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis
                    dataKey="name"
                    type="category"
                    stroke="hsl(var(--muted-foreground))"
                    fontSize={11}
                    width={100}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} name="Sales" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Key Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Key Metrics</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Order Value</p>
                <p className="text-2xl font-bold">GH₵{(stats?.total_revenue / (stats?.total_orders || 1)).toFixed(2)}</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Orders</p>
                <p className="text-2xl font-bold">{orders.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <ShoppingCart className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">{products.filter((p: any) => p.status === 'active').length}</p>
              </div>
              <div className="p-3 rounded-xl bg-emerald/10">
                <Package className="w-6 h-6 text-emerald-dark" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Return Rate</p>
                <p className="text-2xl font-bold">1.2%</p>
              </div>
              <div className="p-3 rounded-xl bg-gold/10">
                <TrendingUp className="w-6 h-6 text-gold" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default VendorAnalytics;
