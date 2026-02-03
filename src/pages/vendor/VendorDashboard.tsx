import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { vendorStats, salesData, categoryData, mockOrders, mockProducts } from "@/data/mockDashboardData";
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";

const VendorDashboard = () => {
  const navigate = useNavigate();
  const vendorOrders = mockOrders.filter(o => o.vendorId === '1');
  const vendorProducts = mockProducts.filter(p => p.vendorId === '1');
  const lowStockProducts = vendorProducts.filter(p => p.stock < 10);

  return (
    <DashboardLayout type="vendor" title="Dashboard" userName="TechHub" userRole="Vendor">
      {/* Stats Grid */}
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
          title="Products"
          value={vendorStats.totalProducts}
          icon={Package}
        />
        <StatsCard
          title="Conversion Rate"
          value="4.8%"
          change={2.1}
          icon={TrendingUp}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SalesChart data={salesData} title="Your Sales" />
        <CategoryChart data={categoryData} title="Sales by Category" />
      </div>

      {/* Low Stock Alert & Recent Orders */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Low Stock Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-gold" />
            <CardTitle className="text-lg font-semibold">Low Stock Alert</CardTitle>
          </CardHeader>
          <CardContent>
            {lowStockProducts.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">All products are well stocked!</p>
            ) : (
              <div className="space-y-3">
                {lowStockProducts.map((product) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold/20">
                    <div>
                      <p className="font-medium">{product.name}</p>
                      <p className="text-sm text-muted-foreground">{product.category}</p>
                    </div>
                    <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">
                      {product.stock} left
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <RecentOrders 
          orders={vendorOrders} 
          title="Recent Orders"
          onViewAll={() => navigate('/vendor/orders')}
        />
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
