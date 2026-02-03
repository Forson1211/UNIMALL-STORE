import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { vendorStats, salesData, mockProducts, mockOrders } from "@/data/mockDashboardData";
import { DollarSign, ShoppingCart, TrendingUp, Eye, Package } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts";

const VendorAnalytics = () => {
  const vendorProducts = mockProducts.filter(p => p.vendorId === '1');
  const vendorOrders = mockOrders.filter(o => o.vendorId === '1');

  const productPerformance = vendorProducts.slice(0, 5).map(p => ({
    name: p.name.length > 15 ? p.name.substring(0, 15) + '...' : p.name,
    sales: Math.floor(Math.random() * 100) + 20,
    views: Math.floor(Math.random() * 500) + 100,
  }));

  const weeklyData = [
    { day: 'Mon', orders: 12, revenue: 540 },
    { day: 'Tue', orders: 8, revenue: 320 },
    { day: 'Wed', orders: 15, revenue: 780 },
    { day: 'Thu', orders: 10, revenue: 450 },
    { day: 'Fri', orders: 18, revenue: 920 },
    { day: 'Sat', orders: 22, revenue: 1100 },
    { day: 'Sun', orders: 14, revenue: 680 },
  ];

  return (
    <DashboardLayout type="vendor" title="Analytics" userName="TechHub" userRole="Vendor">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`$${vendorStats.totalRevenue.toLocaleString()}`}
          change={vendorStats.revenueChange}
          icon={DollarSign}
          variant="primary"
        />
        <StatsCard
          title="Total Orders"
          value={vendorStats.totalOrders.toLocaleString()}
          change={vendorStats.ordersChange}
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
        <SalesChart data={salesData} title="Monthly Revenue" />
        
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
                <p className="text-2xl font-bold">$82.50</p>
              </div>
              <div className="p-3 rounded-xl bg-primary/10">
                <DollarSign className="w-6 h-6 text-primary" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Orders This Month</p>
                <p className="text-2xl font-bold">{vendorOrders.length}</p>
              </div>
              <div className="p-3 rounded-xl bg-secondary/10">
                <ShoppingCart className="w-6 h-6 text-secondary" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Products</p>
                <p className="text-2xl font-bold">{vendorProducts.filter(p => p.status === 'active').length}</p>
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
