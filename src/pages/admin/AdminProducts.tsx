import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Package, RefreshCw, Eye, Star, Trash2, CheckCircle, XCircle } from "lucide-react";
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

import { unpackProductMetadata } from "@/services/vendorService";

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
  image_url?: string;
  is_featured: boolean;
}

const statusStyles: Record<string, string> = {
  active: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  draft: "bg-muted text-muted-foreground border-muted",
  out_of_stock: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  inactive: "bg-destructive/10 text-destructive border-destructive/20",
};

const normalizeProduct = (p: any): Product => {
  const unpacked = unpackProductMetadata(p);
  const id = p.id || p.product_id || `prod-${Date.now()}`;
  const name = p.name || p.product_name || "Untitled Product";
  const price = Number(p.price || 0);
  const stock = Number(p.stock !== undefined ? p.stock : (p.stock_quantity ?? 0));
  const isActive = p.is_active !== undefined ? Boolean(p.is_active) : (p.status === "active");
  const status = p.status || (isActive ? (stock > 0 ? "active" : "out_of_stock") : "inactive");
  const vendorName = p.profiles?.full_name || p.vendor_name || p.vendor || "Vendor";
  const vendorStore = p.profiles?.business_name || p.vendor_store || p.profiles?.full_name || "Store";
  const imageUrl = p.image_url || p.image || (unpacked.images && unpacked.images[0]) || "";

  return {
    product_id: id,
    product_name: name,
    description: unpacked.description || p.description || "",
    price,
    stock_quantity: stock,
    category: p.category || "General",
    status,
    vendor_id: p.vendor_id || "",
    vendor_name: vendorName,
    vendor_store: vendorStore,
    total_sales: Number(p.total_sales || 0),
    created_at: p.created_at || new Date().toISOString(),
    image_url: imageUrl,
    is_featured: Boolean(p.is_featured),
  };
};

const AdminProducts = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [deletedProductIds, setDeletedProductIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem("unimall_deleted_product_ids");
      return saved ? new Set(JSON.parse(saved)) : new Set();
    } catch {
      return new Set();
    }
  });

  const markProductAsDeletedLocally = (id: string) => {
    setDeletedProductIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      try {
        localStorage.setItem("unimall_deleted_product_ids", JSON.stringify(Array.from(next)));
      } catch (err) {
        console.warn("Could not save deleted products to localStorage:", err);
      }
      return next;
    });
  };

  // Resilient multi-tier query for admin products
  const {
    data: products = [],
    isLoading,
    isError,
    error,
  } = useQuery<Product[], Error>({
    queryKey: ["admin-products"],
    queryFn: async () => {
      // 1. Try querying products table directly with profiles join
      try {
        const { data, error } = await supabase
          .from("products")
          .select(`
            *,
            profiles:vendor_id (
              full_name,
              business_name
            )
          `)
          .order("created_at", { ascending: false });

        if (!error && Array.isArray(data) && data.length > 0) {
          return data.map(normalizeProduct);
        }
      } catch (err) {
        console.warn("Direct products table join query skipped, falling back:", err);
      }

      // 2. Try admin_products_view
      try {
        const { data: viewData, error: viewError } = await (supabase
          .from("admin_products_view" as any)
          .select("*")
          .order("created_at", { ascending: false }) as any);

        if (!viewError && Array.isArray(viewData) && viewData.length > 0) {
          return viewData.map(normalizeProduct);
        }
      } catch (err) {
        console.warn("admin_products_view query skipped:", err);
      }

      // 3. Try storefront_products_view
      try {
        const { data: storefrontData } = await (supabase
          .from("storefront_products_view" as any)
          .select("*") as any);

        if (Array.isArray(storefrontData) && storefrontData.length > 0) {
          return storefrontData.map(normalizeProduct);
        }
      } catch (err) {
        console.warn("storefront_products_view fallback skipped:", err);
      }

      // 4. Default to standard products select
      const { data: basicData, error: basicError } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });

      if (basicError) {
        console.error("Basic products select error:", basicError);
        return [];
      }

      return (basicData || []).map(normalizeProduct);
    },
    staleTime: 1000 * 60 * 3,
  });

  // Filter out locally deleted products
  const safeProducts = Array.isArray(products) ? products : [];
  const visibleProducts = safeProducts.filter((p) => {
    const id = p.product_id || (p as any).id;
    return id && !deletedProductIds.has(id);
  });

  // Update product status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ productId, isActive }: { productId: string; isActive: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_active: isActive } as any)
        .eq("id", productId);

      if (error) throw error;

      // Log the action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "product_management",
          message: `Admin ${isActive ? 'activated' : 'deactivated'} product`,
          metadata: {
            product_id: productId,
            is_active: isActive,
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

  // Toggle featured mutation
  const toggleFeaturedMutation = useMutation({
    mutationFn: async ({ productId, isFeatured }: { productId: string; isFeatured: boolean }) => {
      const { error } = await supabase
        .from("products")
        .update({ is_featured: isFeatured } as any)
        .eq("id", productId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Success",
        description: "Product featured status updated.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleActivate = (productId: string) => {
    updateStatusMutation.mutate({ productId, isActive: true });
  };

  const handleDeactivate = (productId: string) => {
    updateStatusMutation.mutate({ productId, isActive: false });
  };

  const handleToggleFeatured = (productId: string, currentStatus: boolean) => {
    toggleFeaturedMutation.mutate({ productId, isFeatured: !currentStatus });
  };

  // Delete product mutation (Soft delete so it leaves public site, but vendor sees "Deleted by Admin")
  const deleteProductMutation = useMutation({
    mutationFn: async (productId: string) => {
      // 1. Fetch current description to merge metadata
      let cleanDesc = "";
      let existingMeta: any = {};
      try {
        const { data: prodData } = await supabase
          .from("products")
          .select("description")
          .eq("id", productId)
          .single();

        if (prodData?.description) {
          const metaMatch = prodData.description.match(/<!-- UNIMALL_META:([\s\S]*?)-->/);
          if (metaMatch && metaMatch[1]) {
            try {
              existingMeta = JSON.parse(metaMatch[1]);
            } catch (e) {}
          }
          cleanDesc = prodData.description.replace(/\n\n<!-- UNIMALL_META:[\s\S]*?-->/g, "").trim();
        }
      } catch (fetchErr) {
        console.warn("Could not read product description for meta:", fetchErr);
      }

      const updatedMeta = {
        ...existingMeta,
        status: "deleted_by_admin",
        deleted_by: "admin",
        deleted_at: new Date().toISOString(),
        deleted_reason: "Removed by Marketplace Administrator",
      };

      const newDesc = `${cleanDesc}\n\n<!-- UNIMALL_META:${JSON.stringify(updatedMeta)} -->`;

      // 2. Soft-delete in database: mark inactive and store deleted_by_admin status
      const { error: updateError } = await supabase
        .from("products")
        .update({
          is_active: false,
          description: newDesc,
        } as any)
        .eq("id", productId);

      if (updateError) {
        console.warn("Primary soft-delete failed, applying fallback update:", updateError);
        const { error: fallbackError } = await supabase
          .from("products")
          .update({ is_active: false } as any)
          .eq("id", productId);
        if (fallbackError) throw fallbackError;
      }

      // 3. Clean up active cart & wishlist items so buyers cannot checkout removed product
      try {
        await supabase.from("cart_items" as any).delete().eq("product_id", productId);
        await supabase.from("wishlists" as any).delete().eq("product_id", productId);
      } catch (cleanupErr) {
        console.warn("Buyer cart/wishlist cleanup skipped:", cleanupErr);
      }

      // 4. Log admin action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "product_management",
          message: "Admin removed product from marketplace (marked as deleted for vendor)",
          metadata: {
            product_id: productId,
            action: "admin_soft_delete",
          },
        }));
      } catch (logError) {
        console.log("Logging skipped:", logError);
      }
    },
    onMutate: async (productId: string) => {
      // Mark as deleted locally in state + localStorage immediately
      markProductAsDeletedLocally(productId);

      // Cancel refetches so optimistic update isn't overwritten
      await queryClient.cancelQueries({ queryKey: ["admin-products"] });

      // Save previous state for rollback
      const previousProducts = queryClient.getQueryData<Product[]>(["admin-products"]);

      // Optimistically remove deleted product from UI cache
      queryClient.setQueryData(["admin-products"], (old: Product[] | undefined) => {
        if (!old) return [];
        return old.filter((p) => (p.product_id || (p as any).id) !== productId);
      });

      return { previousProducts };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
      toast({
        title: "Product Deleted",
        description: "The product has been successfully deleted.",
      });
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    },
    onError: (error: Error, _productId, context) => {
      if (context?.previousProducts) {
        queryClient.setQueryData(["admin-products"], context.previousProducts);
      }
      toast({
        title: "Delete Failed",
        description: error.message || "Failed to delete product.",
        variant: "destructive",
      });
    },
  });

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
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
            {product.image_url ? (
              <img 
                src={product.image_url} 
                alt={product.product_name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium">{product.product_name}</p>
              {product.is_featured && (
                <Badge variant="secondary" className="h-4 px-1 text-[8px] bg-amber-100 text-amber-700 border-amber-200">Featured</Badge>
              )}
            </div>
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
      render: (product: Product) => `GH₵${Number(product.price ?? 0).toFixed(2)}`,
    },
    {
      key: "stock_quantity",
      header: "Stock",
      sortable: true,
      className: "hidden md:table-cell",
      render: (product: Product) => (
        <span className={product.stock_quantity < 10 ? "text-destructive font-medium" : ""}>
          {Number(product.stock_quantity ?? 0)}
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
            <DropdownMenuItem onClick={() => window.open(`/products/${product.product_id}`, "_blank")}>
              <Eye className="w-4 h-4 mr-2" />
              View Product
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            
            {/* Featured Toggle */}
            <DropdownMenuItem
              onClick={() => handleToggleFeatured(product.product_id, product.is_featured)}
            >
              <Star className={`w-4 h-4 mr-2 ${product.is_featured ? 'fill-amber-400 text-amber-400' : ''}`} />
              {product.is_featured ? 'Remove from Featured' : 'Mark as Featured'}
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
                className="text-amber-600"
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

  if (isError) {
    return (
      <DashboardLayout type="admin" title="Products">
        <div className="flex min-h-[420px] items-center justify-center p-6">
          <div className="max-w-lg border border-destructive/20 bg-destructive/5 p-8 text-center">
            <Package className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <h2 className="text-xl font-semibold">Products could not be loaded</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              The admin product view is temporarily unavailable. Refresh the page or try again shortly.
            </p>
            {error?.message && (
              <p className="mt-3 break-words text-xs text-destructive/80">{error.message}</p>
            )}
            <Button
              className="mt-6"
              onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-products"] })}
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Try again
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const totalProducts = visibleProducts.length;
  const activeProducts = visibleProducts.filter((p) => p.status === "active").length;
  const outOfStockProducts = visibleProducts.filter((p) => p.status === "out_of_stock" || p.stock_quantity === 0).length;
  const totalValue = visibleProducts.reduce((sum, p) => sum + (p.price * (p.stock_quantity || 1)), 0);

  return (
    <>
      <DashboardLayout type="admin" title="Products">
        <div className="space-y-6">
          {/* Quick Metrics Bar */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 rounded-xl bg-white dark:bg-card border border-gray-200/80 dark:border-border shadow-2xs">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Total Products</p>
              <p className="text-2xl font-black text-foreground mt-1">{totalProducts}</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-card border border-gray-200/80 dark:border-border shadow-2xs">
              <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">Active Listings</p>
              <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">{activeProducts}</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-card border border-gray-200/80 dark:border-border shadow-2xs">
              <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Out of Stock</p>
              <p className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{outOfStockProducts}</p>
            </div>
            <div className="p-4 rounded-xl bg-white dark:bg-card border border-gray-200/80 dark:border-border shadow-2xs">
              <p className="text-xs font-semibold text-[#FF5500] uppercase tracking-wider">Inventory Value</p>
              <p className="text-2xl font-black text-[#FF5500] mt-1">₵{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
            </div>
          </div>

          <DataTable
            title="All Products"
            data={visibleProducts}
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
        </div>
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
