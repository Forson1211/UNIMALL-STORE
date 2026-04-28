import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { dealService } from "@/services/dealService";
import { MoreHorizontal, Package, Plus, Pencil, Trash2, Eye, Zap, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground",
  out_of_stock: "bg-destructive/10 text-destructive border-destructive/20",
};

const VendorProducts = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | undefined>();
  
  // Flash Deal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealingProduct, setDealingProduct] = useState<any | undefined>();
  const [dealForm, setDealForm] = useState({
    discountPrice: "",
    startTime: "",
    endTime: "",
  });

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["vendor-products", user?.id],
    queryFn: () => vendorService.getProducts(user!.id),
    enabled: !!user,
  });

  const createMutation = useMutation({
    mutationFn: (data: any) => vendorService.createProduct({ ...data, vendor_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Product created successfully");
      setIsFormOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => vendorService.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Product updated successfully");
      setIsFormOpen(false);
    },
    onError: (error: any) => toast.error(error.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Product deleted successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const submitDealMutation = useMutation({
    mutationFn: (data: any) => dealService.submitDeal(data),
    onSuccess: () => {
      toast.success("Flash deal submitted for admin approval!");
      setIsDealModalOpen(false);
      setDealForm({ discountPrice: "", startTime: "", endTime: "" });
    },
    onError: (error: any) => toast.error(error.message),
  });

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    if (confirm("Are you sure you want to delete this product?")) {
      deleteMutation.mutate(productId);
    }
  };

  const handleSaveProduct = (productData: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, updates: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleSubmitDeal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealingProduct || !user) return;

    const discountPrice = parseFloat(dealForm.discountPrice);
    if (discountPrice >= dealingProduct.price) {
      toast.error("Discount price must be lower than original price");
      return;
    }

    submitDealMutation.mutate({
      product_id: dealingProduct.id,
      vendor_id: user.id,
      discount_price: discountPrice,
      start_time: new Date(dealForm.startTime).toISOString(),
      end_time: new Date(dealForm.endTime).toISOString(),
    });
  };

  const productColumns = [
    {
      key: "name",
      header: "Product",
      render: (product: any) => (
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-lg bg-muted flex items-center justify-center overflow-hidden border">
            {(product.image_url || product.image) ? (
              <img 
                src={product.image_url || product.image} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
            ) : (
              <Package className="w-6 h-6 text-muted-foreground" />
            )}
          </div>
          <div>
            <p className="font-medium">{product.name}</p>
            <p className="text-sm text-muted-foreground">{product.category}</p>
          </div>
        </div>
      ),
    },
    {
      key: "price",
      header: "Price",
      sortable: true,
      render: (product: any) => `GH₵${product.price.toFixed(2)}`,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      render: (product: any) => (
        <span className={product.stock < 10 ? "text-destructive font-medium" : ""}>
          {product.stock}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product: any) => (
        <Badge variant="outline" className={statusStyles[product.status]}>
          {product.status.replace('_', ' ')}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (product: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => {
              setDealingProduct(product);
              setIsDealModalOpen(true);
            }}>
              <Zap className="w-4 h-4 mr-2 text-primary" />
              Create Flash Deal
            </DropdownMenuItem>
            <DropdownMenuItem
              className="text-destructive"
              onClick={() => handleDeleteProduct(product.id)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout type="vendor" title="Products">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="vendor"
      title="Products"
      userName={profile?.store_name || profile?.full_name || "Vendor"}
      userRole="Vendor"
    >
      <DataTable
        title="My Products"
        data={products}
        columns={productColumns}
        searchKey="name"
        searchPlaceholder="Search products..."
        actions={
          <Button onClick={handleAddProduct}>
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        }
      />

      {/* Product Form Modal */}
      <ProductForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />

      {/* Flash Deal Modal */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Create Flash Deal
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmitDeal} className="space-y-4 py-4">
            {dealingProduct && (
              <div className="bg-muted/50 p-3 rounded-lg border flex items-center gap-3">
                <div className="w-10 h-10 rounded bg-white flex items-center justify-center overflow-hidden border">
                   <img src={dealingProduct.image_url || dealingProduct.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div>
                  <p className="text-sm font-bold">{dealingProduct.name}</p>
                  <p className="text-xs text-muted-foreground">Normal Price: GH₵{dealingProduct.price}</p>
                </div>
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="discountPrice">Flash Sale Price (GH₵)</Label>
              <Input
                id="discountPrice"
                type="number"
                step="0.01"
                required
                value={dealForm.discountPrice}
                onChange={(e) => setDealForm({ ...dealForm, discountPrice: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startTime">Start Time</Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  required
                  value={dealForm.startTime}
                  onChange={(e) => setDealForm({ ...dealForm, startTime: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endTime">End Time</Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  required
                  value={dealForm.endTime}
                  onChange={(e) => setDealForm({ ...dealForm, endTime: e.target.value })}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDealModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={submitDealMutation.isPending}>
                {submitDealMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Submit for Approval"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorProducts;
