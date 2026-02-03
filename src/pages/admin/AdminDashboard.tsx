import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  adminStats, 
  salesData, 
  categoryData, 
  mockOrders, 
  mockVendors 
} from "@/data/mockDashboardData";
import { 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  Star,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { useNavigate } from "react-router-dom";

const vendorColumns = [
  {
    key: "name",
    header: "Vendor",
    render: (vendor: typeof mockVendors[0]) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {vendor.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <p className="font-medium">{vendor.name}</p>
          <p className="text-sm text-muted-foreground">{vendor.email}</p>
        </div>
      </div>
    ),
  },
  {
    key: "campus",
    header: "Campus",
  },
  {
    key: "products",
    header: "Products",
    sortable: true,
  },
  {
    key: "rating",
    header: "Rating",
    render: (vendor: typeof mockVendors[0]) => (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-gold text-gold" />
        <span>{vendor.rating}</span>
      </div>
    ),
  },
  {
    key: "verified",
    header: "Status",
    render: (vendor: typeof mockVendors[0]) => (
      <div className="flex items-center gap-2">
        {vendor.verified ? (
          <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
            <CheckCircle className="w-3 h-3 mr-1" />
            Verified
          </Badge>
        ) : (
          <Badge variant="outline" className="bg-gold/10 text-gold border-gold/20">
            <XCircle className="w-3 h-3 mr-1" />
            Pending
          </Badge>
        )}
      </div>
    ),
  },
  {
    key: "actions",
    header: "Actions",
    render: () => (
      <Button variant="outline" size="sm">View</Button>
    ),
  },
];

const AdminDashboard = () => {
  const navigate = useNavigate();

  return (
    <DashboardLayout type="admin" title="Dashboard">
      {/* Stats Grid */}
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
          title="Total Products"
          value={adminStats.totalProducts.toLocaleString()}
          icon={Package}
        />
        <StatsCard
          title="Total Customers"
          value={adminStats.totalCustomers.toLocaleString()}
          icon={Users}
          variant="warning"
        />
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <SalesChart data={salesData} />
        <CategoryChart data={categoryData} />
      </div>

      {/* Recent Orders & Top Vendors */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <RecentOrders 
          orders={mockOrders} 
          onViewAll={() => navigate('/admin/orders')}
        />
        <DataTable
          title="Top Vendors"
          data={mockVendors.slice(0, 5)}
          columns={vendorColumns.slice(0, 4)}
          pageSize={5}
        />
      </div>
    </DashboardLayout>
  );
};

export default AdminDashboard;
