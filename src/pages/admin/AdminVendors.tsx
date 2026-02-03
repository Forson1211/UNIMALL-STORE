import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { mockVendors } from "@/data/mockDashboardData";
import { Vendor } from "@/types/dashboard";
import { MoreHorizontal, Store, Star, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusStyles: Record<Vendor['status'], string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-gold/10 text-gold border-gold/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

const vendorColumns = [
  {
    key: "name",
    header: "Vendor",
    render: (vendor: Vendor) => (
      <div className="flex items-center gap-3">
        <Avatar className="h-10 w-10">
          <AvatarFallback className="bg-primary/10 text-primary font-medium">
            {vendor.name.charAt(0)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-2">
            <p className="font-medium">{vendor.name}</p>
            {vendor.verified && (
              <CheckCircle className="w-4 h-4 text-primary" />
            )}
          </div>
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
    key: "totalSales",
    header: "Total Sales",
    sortable: true,
    render: (vendor: Vendor) => `$${vendor.totalSales.toLocaleString()}`,
  },
  {
    key: "rating",
    header: "Rating",
    render: (vendor: Vendor) => (
      <div className="flex items-center gap-1">
        <Star className="w-4 h-4 fill-gold text-gold" />
        <span>{vendor.rating}</span>
      </div>
    ),
  },
  {
    key: "status",
    header: "Status",
    render: (vendor: Vendor) => (
      <Badge variant="outline" className={statusStyles[vendor.status]}>
        {vendor.status}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "",
    render: (vendor: Vendor) => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Store</DropdownMenuItem>
          <DropdownMenuItem>Edit Vendor</DropdownMenuItem>
          {!vendor.verified && (
            <DropdownMenuItem className="text-primary">Verify Vendor</DropdownMenuItem>
          )}
          <DropdownMenuItem className="text-destructive">Suspend Vendor</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const AdminVendors = () => {
  return (
    <DashboardLayout type="admin" title="Vendors">
      <DataTable
        title="All Vendors"
        data={mockVendors}
        columns={vendorColumns}
        searchKey="name"
        searchPlaceholder="Search vendors..."
        actions={
          <Button>
            <Store className="w-4 h-4 mr-2" />
            Add Vendor
          </Button>
        }
      />
    </DashboardLayout>
  );
};

export default AdminVendors;
