import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockDashboardData";
import { Product } from "@/types/dashboard";
import { MoreHorizontal, Package, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusStyles: Record<Product['status'], string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground",
  out_of_stock: "bg-destructive/10 text-destructive border-destructive/20",
};

const productColumns = [
  {
    key: "name",
    header: "Product",
    render: (product: Product) => (
      <div className="flex items-center gap-3">
        <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
          <Package className="w-6 h-6 text-muted-foreground" />
        </div>
        <div>
          <p className="font-medium">{product.name}</p>
          <p className="text-sm text-muted-foreground">{product.category}</p>
        </div>
      </div>
    ),
  },
  {
    key: "vendorName",
    header: "Vendor",
    className: "hidden md:table-cell",
  },
  {
    key: "price",
    header: "Price",
    sortable: true,
    render: (product: Product) => `$${product.price.toFixed(2)}`,
  },
  {
    key: "stock",
    header: "Stock",
    sortable: true,
    className: "hidden md:table-cell",
    render: (product: Product) => (
      <span className={product.stock < 10 ? "text-destructive font-medium" : ""}>
        {product.stock}
      </span>
    ),
  },
  {
    key: "status",
    header: "Status",
    className: "hidden sm:table-cell",
    render: (product: Product) => (
      <Badge variant="outline" className={statusStyles[product.status]}>
        {product.status.replace('_', ' ')}
      </Badge>
    ),
  },
  {
    key: "actions",
    header: "",
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>View Product</DropdownMenuItem>
          <DropdownMenuItem>Edit Product</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Delete Product</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const AdminProducts = () => {
  return (
    <DashboardLayout type="admin" title="Products">
      <DataTable
        title="All Products"
        data={mockProducts}
        columns={productColumns}
        searchKey="name"
        searchPlaceholder="Search products..."
        actions={
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        }
      />
    </DashboardLayout>
  );
};

export default AdminProducts;
