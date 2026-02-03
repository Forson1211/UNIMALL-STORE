import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockProducts } from "@/data/mockDashboardData";
import { Product } from "@/types/dashboard";
import { MoreHorizontal, Package, Plus, Pencil, Trash2, Eye } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const statusStyles: Record<Product['status'], string> = {
  active: "bg-primary/10 text-primary border-primary/20",
  draft: "bg-muted text-muted-foreground",
  out_of_stock: "bg-destructive/10 text-destructive border-destructive/20",
};

const VendorProducts = () => {
  const [products, setProducts] = useState(mockProducts.filter(p => p.vendorId === '1'));
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | undefined>();

  const handleAddProduct = () => {
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleDeleteProduct = (productId: string) => {
    setProducts(products.filter(p => p.id !== productId));
    toast.success("Product deleted successfully");
  };

  const handleSaveProduct = (productData: Partial<Product>) => {
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id ? { ...p, ...productData } : p
      ));
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productData.name || '',
        description: productData.description || '',
        price: productData.price || 0,
        category: productData.category || '',
        stock: productData.stock || 0,
        vendorId: '1',
        vendorName: 'TechHub',
        status: productData.status || 'draft',
        createdAt: new Date(),
      };
      setProducts([newProduct, ...products]);
    }
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
      key: "price",
      header: "Price",
      sortable: true,
      render: (product: Product) => `$${product.price.toFixed(2)}`,
    },
    {
      key: "stock",
      header: "Stock",
      sortable: true,
      render: (product: Product) => (
        <span className={product.stock < 10 ? "text-destructive font-medium" : ""}>
          {product.stock}
        </span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (product: Product) => (
        <Badge variant="outline" className={statusStyles[product.status]}>
          {product.status.replace('_', ' ')}
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
            <DropdownMenuItem>
              <Eye className="w-4 h-4 mr-2" />
              View
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleEditProduct(product)}>
              <Pencil className="w-4 h-4 mr-2" />
              Edit
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

  return (
    <DashboardLayout type="vendor" title="Products" userName="TechHub" userRole="Vendor">
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

      <ProductForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
      />
    </DashboardLayout>
  );
};

export default VendorProducts;
