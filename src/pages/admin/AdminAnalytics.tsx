import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { adminStats, salesData, categoryData, mockOrders, mockVendors } from "@/data/mockDashboardData";
import { DollarSign, ShoppingCart, TrendingUp, Users, Package, Store } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const topVendorsData = mockVendors.slice(0, 5).map(v => ({
  name: v.name,
  sales: v.totalSales,
}));

const AdminAnalytics = () => {
  return (
    <DashboardLayout type="admin" title="Analytics">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <StatsCard
          title="Total Revenue"
          value={`$${adminStats.totalRevenue.toLocaleString()}`}
          change={adminStats.revenueChange}
          icon={DollarSign}
          variant="primary"
        />
        <StatsCard
          title="Total Orders"
          value={adminStats.totalOrders.toLocaleString()}
          change={adminStats.ordersChange}
          icon={ShoppingCart}
          variant="secondary"
        />
        <StatsCard
          title="Active Vendors"
          value={mockVendors.filter(v => v.status === 'active').length}
          icon={Store}
        />
        <StatsCard
          title="Conversion Rate"
          value="3.2%"
          change={0.5}
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SalesChart data={salesData} title="Revenue Trend" />
        <CategoryChart data={categoryData} title="Sales by Category" />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        {/* Top Vendors */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Vendors by Sales</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topVendorsData} layout="vertical" margin={{ left: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    stroke="hsl(var(--muted-foreground))" 
                    fontSize={12} 
                    width={80}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`$${value.toLocaleString()}`, 'Sales']}
                  />
                  <Bar dataKey="sales" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Order Status Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'].map((status) => {
                const count = mockOrders.filter(o => o.status === status).length;
                const percentage = (count / mockOrders.length) * 100;
                return (
                  <div key={status} className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="capitalize font-medium">{status}</span>
                      <span className="text-muted-foreground">{count} orders ({percentage.toFixed(0)}%)</span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary rounded-full transition-all"
                        style={{ width: `${percentage}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10">
              <Package className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminStats.totalProducts}</p>
              <p className="text-sm text-muted-foreground">Total Products</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-secondary/10">
              <Users className="w-5 h-5 text-secondary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{adminStats.totalCustomers}</p>
              <p className="text-sm text-muted-foreground">Total Customers</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-gold/10">
              <DollarSign className="w-5 h-5 text-gold" />
            </div>
            <div>
              <p className="text-2xl font-bold">$74.50</p>
              <p className="text-sm text-muted-foreground">Avg. Order Value</p>
            </div>
          </div>
        </Card>
        <Card className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald/10">
              <TrendingUp className="w-5 h-5 text-emerald-dark" />
            </div>
            <div>
              <p className="text-2xl font-bold">89%</p>
              <p className="text-sm text-muted-foreground">Fulfillment Rate</p>
            </div>
          </div>
        </Card>
      </div>
    </DashboardLayout>
  );
};

export default AdminAnalytics;
