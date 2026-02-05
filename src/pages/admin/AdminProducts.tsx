import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Package, RefreshCw, Eye, Edit, Trash2, CheckCircle, XCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useAuth } from "@/contexts/AuthContext";

interface Product {
  product_id: string;
  product_name: string;
  description: string;
  price: number;
  stock_quantity: number;
  category: string;
  status: string;
  vendor_id: string;
  vendor_name: string;
  vendor_store: string;
  total_sales: number;
  created_at: string;
}

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground border-muted",
  inactive: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminProducts = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  // Fetch all products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("admin_products_view" as any)
        .select("*")
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;
      return data as Product[];
    },
  });

  // Update product status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ productId, newStatus }: { productId: string; newStatus: string }) => {
      // Use direct table update since the RPC function may not be in types yet
      const { error } = await supabase
        .from("products")
        .update({ status: newStatus } as any)
        .eq("id", productId);

      if (error) throw error;

      // Log the action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "product_management",
          message: "Admin updated product status",
          metadata: {
            product_id: productId,
            new_status: newStatus,
          },
        }));
      } catch (logError) {
        console.log("Logging skipped:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Success",
        description: "Product status updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update product status.",
        variant: "destructive",
      });
    },
  });

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      const { error } = await supabase.from("products").delete().eq("id", productId);

      if (error) throw error;

      // Log the action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "product_management",
          message: "Admin deleted product",
          metadata: {
            product_id: productId,
          },
        }));
      } catch (logError) {
        console.log("Logging skipped:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Success",
        description: "Product deleted successfully.",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

  const handleActivate = (productId: string) => {
    updateStatusMutation.mutate({ productId, newStatus: "active" });
  };

  const handleDeactivate = (productId: string) => {
    updateStatusMutation.mutate({ productId, newStatus: "inactive" });
  };

  const handleDeleteClick = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (productToDelete) {
      deleteProductMutation.mutate(productToDelete);
    }
  };

  const productColumns = [
    {
      key: "product_name",
      header: "Product",
      render: (product: Product) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center">
            <Package className="w-6 h-6 text-muted-foreground" />
          </div>
          <div>
            <p className="font-medium">{product.product_name}</p>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "vendor_store",
      header: "Vendor",
      className: "hidden md:table-cell",
      render: (product: Product) => product.vendor_store || product.vendor_name || "—",
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (product: Product) => `GH₵${product.price.toFixed(2)}`,
    },
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      className: "hidden md:table-cell",
      render: (product: Product) => (
        <span className={product.stock_quantity < 10 ? "text-destructive font-medium" : ""}>
          {product.stock_quantity}
        </span>
      ),
    },
    {
      key: "total_sales",
      header: "Sales",
      sortable: true,
      className: "hidden lg:table-cell",
    },
    {
      key: "status",
      header: "Status",
      className: "hidden sm:table-cell",
      render: (product: Product) => (
        <Badge variant="outline" className={statusStyles[product.status] || ""}>
          {product.status}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (product: Product) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => window.open(`/product/${product.product_id}`, "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              View Product
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {product.status !== "active" && (
              <DropdownMenuItem
                onClick={() => handleActivate(product.product_id)}
                className="text-primary"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Activate Product
              </DropdownMenuItem>
            )}
            {product.status === "active" && (
              <DropdownMenuItem
                onClick={() => handleDeactivate(product.product_id)}
                className="text-gold"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Deactivate Product
              </DropdownMenuItem>
            )}
            {role === "admin" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleDeleteClick(product.product_id)}
                  className="text-destructive"
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete Product
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout type="admin" title="Products">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading products...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout type="admin" title="Products">
        <DataTable
          title="All Products"
          data={products}
          columns={productColumns}
          searchKey="product_name"
          searchPlaceholder="Search products..."
          actions={
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-products"] })}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          }
        />
      </DashboardLayout>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the product from the platform.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Product
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminProducts;
