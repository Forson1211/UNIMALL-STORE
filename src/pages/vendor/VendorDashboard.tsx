import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { DollarSign, ShoppingCart, Package, TrendingUp, AlertTriangle } from "lucide-react";

const VendorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

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

  const lowStockProducts = products.filter((p: any) => p.stock < 10);

  if (statsLoading || productsLoading || ordersLoading) {
    return (
      <DashboardLayout type="vendor" title="Dashboard">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="vendor"
      title="Dashboard"
      userName={profile?.store_name || profile?.full_name || "Vendor"}
      userRole="Vendor"
    >
      {/* Stats Grid */}
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
          title="Products"
          value={stats?.total_products || 0}
          icon={Package}
        />
        <StatsCard
          title="Low Stock"
          value={stats?.low_stock_count || 0}
          icon={AlertTriangle}
          variant="warning"
        />
      </div>

      {/* Analytics Group */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SalesChart 
          title="Sales Performance"
          data={[
            { name: "Week 1", sales: (stats?.total_revenue || 0) * 0.2, orders: (stats?.total_orders || 0) * 0.2 },
            { name: "Week 2", sales: (stats?.total_revenue || 0) * 0.35, orders: (stats?.total_orders || 0) * 0.3 },
            { name: "Week 3", sales: (stats?.total_revenue || 0) * 0.15, orders: (stats?.total_orders || 0) * 0.1 },
            { name: "Week 4", sales: (stats?.total_revenue || 0) * 0.3, orders: (stats?.total_orders || 0) * 0.4 },
          ]} 
        />
        <CategoryChart 
          title="Orders by Category"
          data={[
            { name: "Electronics", value: 40, fill: "#8B5CF6" },
            { name: "Clothing", value: 30, fill: "#06B6D4" },
            { name: "Home", value: 20, fill: "#F59E0B" },
            { name: "Others", value: 10, fill: "#10B981" },
          ]}
        />
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
              <div className="space-y-3 scrollbar-hide max-h-[300px] overflow-y-auto">
                {lowStockProducts.map((product: any) => (
                  <div key={product.id} className="flex items-center justify-between p-3 rounded-lg bg-gold/5 border border-gold/20">
                    <div>
                      <p className="font-medium text-sm">{product.name}</p>
                      <p className="text-xs text-muted-foreground">{product.category}</p>
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
          orders={orders.slice(0, 5).map((o: any) => ({
            id: o.order_id.slice(0, 8),
            customerName: o.buyer_name || o.buyer_email,
            customerEmail: o.buyer_email || "",
            date: new Date(o.created_at).toLocaleDateString(),
            total: o.vendor_total,
            status: o.order_status,
            items: [],
            paymentStatus: "paid",
            createdAt: o.created_at
          })) as any}
          title="Recent Orders"
          onViewAll={() => navigate('/vendor/orders')}
        />
      </div>
    </DashboardLayout>
  );
};

export default VendorDashboard;
