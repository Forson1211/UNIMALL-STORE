import { useState, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ProductForm } from "@/components/dashboard/ProductForm";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { dealService } from "@/services/dealService";
import { 
  Package, 
  Plus, 
  Pencil, 
  Trash2, 
  Eye, 
  Zap, 
  Loader2, 
  Store, 
  CheckCircle2, 
  AlertCircle, 
  Search,
  LayoutGrid,
  List,
  TrendingUp,
  AlertTriangle,
  Layers,
  ChevronRight,
  ExternalLink,
  Tag,
  Truck,
  Sparkles,
  DollarSign,
  ArrowUpRight,
  MoreVertical,
  Minus
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

export const VendorProducts = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | undefined>();
  const [isProfileGateModalOpen, setIsProfileGateModalOpen] = useState(false);
  
  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "draft" | "out_of_stock" | "deleted">("all");
  const [viewMode, setViewMode] = useState<"table" | "grid">("table");

  // Local storage profile check for instant selling access
  const localCache = user?.id ? (() => {
    try {
      return JSON.parse(localStorage.getItem(`unimall_vendor_profile_${user.id}`) || "{}");
    } catch (e) {
      return {};
    }
  })() : {};

  const isProfileComplete = Boolean(
    (profile?.store_name || localCache?.store_name || profile?.full_name || localCache?.full_name)?.trim() &&
    (profile?.campus || localCache?.campus)?.trim() &&
    (profile?.phone || localCache?.phone)?.trim()
  );

  const storeName = profile?.store_name || localCache?.store_name || profile?.full_name || "Campus Vendor";

  // Flash Deal State
  const [isDealModalOpen, setIsDealModalOpen] = useState(false);
  const [dealingProduct, setDealingProduct] = useState<any | undefined>();
  const [dealForm, setDealForm] = useState({
    discountPrice: "",
    startTime: "",
    endTime: "",
  });

  // Fetch Vendor Products
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["vendor-products", user?.id],
    queryFn: () => vendorService.getProducts(user!.id),
    enabled: !!user,
  });

  // Mutations
  const createMutation = useMutation({
    mutationFn: (data: any) => vendorService.createProduct({ ...data, vendor_id: user!.id }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Product created and published!");
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      console.error("Product create error:", error);
      toast.error(error.message || "Failed to create product");
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, updates }: { id: string; updates: any }) => vendorService.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      toast.success("Product updated successfully");
      setIsFormOpen(false);
    },
    onError: (error: any) => {
      console.error("Product update error:", error);
      toast.error(error.message || "Failed to update product");
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => vendorService.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("Product removed from listing");
    },
    onError: (error: any) => {
      console.error("Product delete error:", error);
      toast.error(error.message || "Failed to delete product");
    },
  });

  const submitDealMutation = useMutation({
    mutationFn: (dealData: any) => dealService.createDeal(dealData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["deals"] });
      queryClient.invalidateQueries({ queryKey: ["vendor-products"] });
      toast.success("🔥 Flash Deal launched on homepage!");
      setIsDealModalOpen(false);
      setDealForm({ discountPrice: "", startTime: "", endTime: "" });
    },
    onError: (error: any) => {
      console.error("Deal submission error:", error);
      toast.error(error.message || "Failed to submit deal");
    },
  });

  const handleAddProduct = () => {
    if (!isProfileComplete) {
      setIsProfileGateModalOpen(true);
      return;
    }
    setEditingProduct(undefined);
    setIsFormOpen(true);
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct(product);
    setIsFormOpen(true);
  };

  const handleSaveProduct = (productData: any) => {
    if (editingProduct) {
      updateMutation.mutate({ id: editingProduct.id, updates: productData });
    } else {
      createMutation.mutate(productData);
    }
  };

  const handleDeleteProduct = (id: string) => {
    if (window.confirm("Are you sure you want to delete this listing?")) {
      deleteMutation.mutate(id);
    }
  };

  const handleQuickStockChange = async (product: any, delta: number) => {
    const currentStock = Number(product.stock) || 0;
    const newStock = Math.max(0, currentStock + delta);
    if (newStock === currentStock) return;

    try {
      await updateMutation.mutateAsync({
        id: product.id,
        updates: { stock: newStock },
      });
      toast.success(`Stock updated to ${newStock}`);
    } catch (err) {
      toast.error("Failed to update stock");
    }
  };

  const handleDealSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealingProduct || !user) return;

    const originalPrice = Number(dealingProduct.price);
    const discountPrice = Number(dealForm.discountPrice);

    if (discountPrice >= originalPrice) {
      toast.error("Deal price must be lower than the current price!");
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

  // ── Metrics Calculations ──
  const metrics = useMemo(() => {
    const totalCount = products.length;
    const isDeleted = (p: any) => p.status === "deleted_by_admin" || p.status === "deleted";
    const activeCount = products.filter((p: any) => (p.status === "active" || p.is_active === true) && !isDeleted(p)).length;
    const deletedCount = products.filter(isDeleted).length;
    const totalInventoryValue = products
      .filter((p: any) => !isDeleted(p))
      .reduce((sum: number, p: any) => sum + (Number(p.price || 0) * Number(p.stock || 0)), 0);
    const lowStockCount = products.filter((p: any) => !isDeleted(p) && Number(p.stock || 0) > 0 && Number(p.stock || 0) <= 3).length;
    const outOfStockCount = products.filter((p: any) => !isDeleted(p) && (Number(p.stock || 0) === 0 || p.status === "out_of_stock")).length;

    // Top Category
    const catMap: Record<string, number> = {};
    products.forEach((p: any) => {
      const c = p.category || "General";
      catMap[c] = (catMap[c] || 0) + 1;
    });
    let topCategory = "None";
    let maxCatCount = 0;
    Object.entries(catMap).forEach(([cat, count]) => {
      if (count > maxCatCount) {
        maxCatCount = count;
        topCategory = cat;
      }
    });

    return { totalCount, activeCount, deletedCount, totalInventoryValue, lowStockCount, outOfStockCount, topCategory };
  }, [products]);

  // ── Filtered Products List ──
  const filteredProducts = useMemo(() => {
    return products.filter((product: any) => {
      const matchesSearch = 
        product.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.category?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchQuery.toLowerCase());

      const matchesCat = selectedCategory === "All" || product.category === selectedCategory;

      const isDeletedProd = product.status === "deleted_by_admin" || product.status === "deleted";
      let matchesStatus = true;
      if (statusFilter === "active") {
        matchesStatus = (product.status === "active" || product.is_active === true) && !isDeletedProd;
      } else if (statusFilter === "draft") {
        matchesStatus = product.status === "draft" && !isDeletedProd;
      } else if (statusFilter === "out_of_stock") {
        matchesStatus = (product.status === "out_of_stock" || Number(product.stock || 0) === 0) && !isDeletedProd;
      } else if (statusFilter === "deleted") {
        matchesStatus = isDeletedProd;
      }

      return matchesSearch && matchesCat && matchesStatus;
    });
  }, [products, searchQuery, selectedCategory, statusFilter]);

  const categoriesList = ["All", ...PRODUCT_CATEGORIES.map(c => c.label)];

  if (isLoading) {
    return (
      <DashboardLayout type="vendor" title="Products">
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <div className="w-10 h-10 border-3 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading Inventory...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="vendor"
      title="Products"
      userName={storeName}
      userRole="Campus Vendor"
    >
      <div className="space-y-6 pb-12">
        
        {/* ── Header: Title, Description & Main Action ── */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-card p-6 border border-gray-100 dark:border-slate-800 shadow-xs">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight">
                Products & Inventory
              </h1>
              <span className="px-2.5 py-0.5 bg-orange-100 dark:bg-orange-950/60 text-[#FF5500] text-xs font-black rounded-full">
                {products.length} Items
              </span>
            </div>
            <p className="text-xs sm:text-sm text-gray-500 font-medium mt-1">
              Manage your live campus catalog, stock quantities, promotional discounts, and delivery badges.
            </p>
          </div>

          <div className="flex items-center gap-3 self-start md:self-auto">
            {user?.id && (
              <Link to={`/vendors/${user.id}`} target="_blank">
                <Button 
                  variant="outline" 
                  size="sm"
                  className="rounded-xl font-bold text-xs h-10 border-gray-200 dark:border-slate-700 hover:border-[#FF5500] hover:text-[#FF5500] flex items-center gap-1.5"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  View Storefront
                </Button>
              </Link>
            )}

            <Button 
              onClick={handleAddProduct} 
              className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs h-10 px-5 rounded-xl shadow-md shadow-orange-500/20 uppercase tracking-wider flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              Add Product
            </Button>
          </div>
        </div>

        {/* ── Incomplete Profile Warning Banner ── */}
        {!isProfileComplete && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-300 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs font-black">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white">Store Profile Setup Required</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5">
                  Complete your store profile (Store Name, Campus Hub, WhatsApp Hotline) to start adding products and selling on Unimall.
                </p>
              </div>
            </div>
            <Link to="/vendor/profile" className="shrink-0 w-full sm:w-auto">
              <Button className="w-full sm:w-auto bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs h-9 px-5 rounded-xl shadow-xs uppercase tracking-wider">
                Complete Store Profile →
              </Button>
            </Link>
          </div>
        )}

        {/* ── 4 Pastel Analytics Metric Cards ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* Active Listings */}
          <div className="p-4 sm:p-5 rounded-2xl bg-orange-50/60 dark:bg-orange-950/20 border border-orange-100 dark:border-orange-900/30 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-orange-600 dark:text-orange-400">
                Active Listings
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{metrics.activeCount}</h3>
                <span className="text-xs text-gray-400 font-bold">/ {metrics.totalCount} Total</span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-orange-500 text-white flex items-center justify-center shadow-xs">
              <Package className="w-5 h-5" />
            </div>
          </div>

          {/* Inventory Value */}
          <div className="p-4 sm:p-5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/30 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                Stock Retail Value
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  GH₵{metrics.totalInventoryValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </h3>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-emerald-500 text-white flex items-center justify-center shadow-xs">
              <DollarSign className="w-5 h-5" />
            </div>
          </div>

          {/* Low Stock Alert */}
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50/60 dark:bg-amber-950/20 border border-amber-100 dark:border-amber-900/30 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-amber-600 dark:text-amber-400">
                Restock Needed
              </p>
              <div className="flex items-baseline gap-2 mt-1">
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {metrics.lowStockCount + metrics.outOfStockCount}
                </h3>
                <span className="text-[11px] text-amber-700 dark:text-amber-400 font-bold">
                  ({metrics.outOfStockCount} Out of stock)
                </span>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-amber-500 text-white flex items-center justify-center shadow-xs">
              <AlertTriangle className="w-5 h-5" />
            </div>
          </div>

          {/* Top Category */}
          <div className="p-4 sm:p-5 rounded-2xl bg-blue-50/60 dark:bg-blue-950/20 border border-blue-100 dark:border-blue-900/30 flex items-center justify-between shadow-xs">
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-blue-600 dark:text-blue-400">
                Leading Category
              </p>
              <div className="flex items-baseline gap-1 mt-1">
                <h3 className="text-lg font-black text-gray-900 dark:text-white truncate max-w-[140px]">
                  {metrics.topCategory}
                </h3>
              </div>
            </div>
            <div className="w-11 h-11 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-xs">
              <Layers className="w-5 h-5" />
            </div>
          </div>

        </div>

        {/* ── Control Bar: Search, Category Pills, Status Tabs & View Switcher ── */}
        <div className="bg-white dark:bg-card p-4 rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            
            {/* Search Input */}
            <div className="relative w-full md:w-80">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <Input
                placeholder="Search products by title, category, description..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-10 rounded-xl border-gray-200 dark:border-slate-700 bg-gray-50/60 focus:bg-white text-xs font-medium"
              />
            </div>

            {/* Status Pills */}
            <div className="flex items-center gap-1.5 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl w-full md:w-auto overflow-x-auto">
              {(["all", "active", "draft", "out_of_stock", "deleted"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setStatusFilter(tab)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap flex items-center gap-1.5 ${
                    statusFilter === tab 
                      ? "bg-white dark:bg-card text-gray-900 dark:text-white shadow-xs" 
                      : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                  }`}
                >
                  {tab === "all" ? "All Items" : tab === "deleted" ? "Removed by Admin" : tab.replace('_', ' ')}
                  {tab === "deleted" && metrics.deletedCount > 0 && (
                    <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-red-500 text-white font-black">
                      {metrics.deletedCount}
                    </span>
                  )}
                </button>
              ))}
            </div>

            {/* View Mode Toggle */}
            <div className="flex items-center gap-1 p-1 bg-gray-100 dark:bg-slate-800 rounded-xl shrink-0 self-end md:self-auto">
              <button
                onClick={() => setViewMode("table")}
                className={`p-2 rounded-lg text-xs transition-all ${
                  viewMode === "table" ? "bg-white dark:bg-card text-[#FF5500] shadow-xs" : "text-gray-400 hover:text-gray-700"
                }`}
                title="Table View"
              >
                <List className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 rounded-lg text-xs transition-all ${
                  viewMode === "grid" ? "bg-white dark:bg-card text-[#FF5500] shadow-xs" : "text-gray-400 hover:text-gray-700"
                }`}
                title="Grid Cards View"
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Horizontal Category Filter Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 pt-1 no-scrollbar">
            <span className="text-[10px] font-black uppercase text-gray-400 shrink-0">Category:</span>
            {categoriesList.slice(0, 8).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-bold transition-all whitespace-nowrap shrink-0 ${
                  selectedCategory === cat
                    ? "bg-[#FF5500] text-white shadow-xs"
                    : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* ── Main Inventory Listing Section ── */}
        {filteredProducts.length === 0 ? (
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-slate-800 p-12 text-center shadow-xs">
            <div className="w-16 h-16 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] mx-auto flex items-center justify-center mb-4">
              <Package className="w-8 h-8" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white">No products found</h3>
            <p className="text-xs text-gray-500 max-w-sm mx-auto mt-1 mb-6">
              {searchQuery || selectedCategory !== "All" || statusFilter !== "all"
                ? "Try adjusting your search criteria or category filter to view other items."
                : "You haven't added any products to your catalog yet. Click below to add your first product."}
            </p>
            <Button
              onClick={handleAddProduct}
              className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs h-10 px-6 rounded-xl shadow-md uppercase tracking-wider"
            >
              <Plus className="w-4 h-4 mr-1.5" />
              Add First Campus Product
            </Button>
          </div>
        ) : viewMode === "table" ? (
          
          /* ══════════════════════ TABLE VIEW ══════════════════════ */
          <div className="bg-white dark:bg-card rounded-2xl border border-gray-100 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50/80 dark:bg-slate-900/50 border-b border-gray-100 dark:border-slate-800 text-[11px] font-black uppercase tracking-wider text-gray-500">
                    <th className="py-3.5 px-5">Product Details</th>
                    <th className="py-3.5 px-4">Price (GH₵)</th>
                    <th className="py-3.5 px-4">Inventory Stock</th>
                    <th className="py-3.5 px-4">Logistics & Badges</th>
                    <th className="py-3.5 px-4">Status</th>
                    <th className="py-3.5 px-5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-slate-800/60 text-xs">
                  {filteredProducts.map((product: any) => {
                    const price = Number(product.price) || 0;
                    const originalPrice = product.original_price ? Number(product.original_price) : 0;
                    const hasDiscount = originalPrice > price;
                    const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
                    const stock = Number(product.stock) || 0;
                    const imagesList = Array.isArray(product.images) ? product.images : [product.image_url || product.image].filter(Boolean);
                    const imageCount = imagesList.length;
                    const isDeletedByAdmin = product.status === "deleted_by_admin" || product.status === "deleted";

                    return (
                      <tr 
                        key={product.id}
                        className={`transition-colors group ${
                          isDeletedByAdmin 
                            ? "bg-red-50/20 dark:bg-red-950/10 hover:bg-red-50/40" 
                            : "hover:bg-gray-50/50 dark:hover:bg-slate-800/30"
                        }`}
                      >
                        {/* Product info */}
                        <td className="py-4 px-5">
                          <div className="flex items-center gap-3.5">
                            <div className="relative w-14 h-14 rounded-xl bg-gray-100 dark:bg-slate-800 border border-gray-200 dark:border-slate-700 flex items-center justify-center overflow-hidden shrink-0 group-hover:shadow-xs transition-shadow">
                              {(product.image_url || product.image) ? (
                                <img 
                                  src={product.image_url || product.image} 
                                  alt={product.name} 
                                  className={`w-full h-full object-cover ${isDeletedByAdmin ? "opacity-50 grayscale" : ""}`}
                                />
                              ) : (
                                <Package className="w-6 h-6 text-gray-400" />
                              )}
                              {imageCount > 1 && (
                                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-white text-[8px] font-black px-1 rounded-sm">
                                  {imageCount}P
                                </span>
                              )}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-black text-gray-900 dark:text-white group-hover:text-[#FF5500] transition-colors truncate max-w-xs sm:max-w-md text-sm">
                                {product.name}
                              </h4>
                              {isDeletedByAdmin && (
                                <div className="mt-1">
                                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black bg-red-100 text-red-700 dark:bg-red-950/80 dark:text-red-300 border border-red-200 dark:border-red-900/60">
                                    <AlertTriangle className="w-3 h-3 text-red-600 shrink-0" />
                                    Removed from live marketplace by Admin
                                  </span>
                                </div>
                              )}
                              <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                                <span className="px-2 py-0.5 bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-300 text-[10px] font-black uppercase rounded-md">
                                  {product.category || "General"}
                                </span>
                                {product.condition && (
                                  <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-md">
                                    {product.condition}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>

                        {/* Price */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div>
                            <span className="font-black text-sm text-gray-900 dark:text-white">
                              GH₵{price.toFixed(2)}
                            </span>
                            {hasDiscount && (
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[11px] line-through text-gray-400">
                                  GH₵{originalPrice.toFixed(2)}
                                </span>
                                <span className="text-[10px] font-black text-emerald-600">
                                  -{discountPercent}%
                                </span>
                              </div>
                            )}
                          </div>
                        </td>

                        {/* Stock Quantity with Quick Stepper */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          {isDeletedByAdmin ? (
                            <span className="text-xs font-bold text-gray-400">Inactive ({stock})</span>
                          ) : (
                            <div className="flex items-center gap-2">
                              <div className="flex items-center border border-gray-200 dark:border-slate-700 rounded-lg overflow-hidden bg-gray-50/50">
                                <button
                                  onClick={() => handleQuickStockChange(product, -1)}
                                  className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                  title="Decrease stock"
                                >
                                  <Minus className="w-3 h-3" />
                                </button>
                                <span className="w-8 text-center font-black text-xs">
                                  {stock}
                                </span>
                                <button
                                  onClick={() => handleQuickStockChange(product, +1)}
                                  className="w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 dark:hover:bg-slate-700 transition-colors"
                                  title="Increase stock"
                                >
                                  <Plus className="w-3 h-3" />
                                </button>
                              </div>

                              <span className={`px-2 py-0.5 text-[10px] font-bold rounded-md ${
                                stock === 0 
                                  ? "bg-red-50 text-red-600 dark:bg-red-950/40" 
                                  : stock <= 3 
                                    ? "bg-amber-50 text-amber-600 dark:bg-amber-950/40" 
                                    : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/40"
                              }`}>
                                {stock === 0 ? "Out of stock" : stock <= 3 ? "Low stock" : "In stock"}
                              </span>
                            </div>
                          )}
                        </td>

                        {/* Logistics Badges */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <div className="flex flex-col gap-1 items-start">
                            {product.same_day_delivery && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-600">
                                <Truck className="w-3 h-3" /> Same-Day Dropoff
                              </span>
                            )}
                            {product.is_negotiable && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-blue-600">
                                <Tag className="w-3 h-3" /> Negotiable
                              </span>
                            )}
                            {product.highlight && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-purple-600">
                                <Sparkles className="w-3 h-3" /> {product.highlight}
                              </span>
                            )}
                            {!product.same_day_delivery && !product.is_negotiable && !product.highlight && (
                              <span className="text-[11px] text-gray-400">Standard Campus</span>
                            )}
                          </div>
                        </td>

                        {/* Status */}
                        <td className="py-4 px-4 whitespace-nowrap">
                          <span className={`px-2.5 py-1 text-xs font-black uppercase rounded-full ${
                            isDeletedByAdmin
                              ? "bg-red-100 dark:bg-red-950/70 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800"
                              : product.status === "active" || product.is_active === true
                                ? "bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300"
                                : product.status === "out_of_stock" || stock === 0
                                  ? "bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300"
                                  : "bg-gray-100 dark:bg-slate-800 text-gray-600 dark:text-gray-400"
                          }`}>
                            {isDeletedByAdmin ? "Removed by Admin" : stock === 0 ? "Out of stock" : (product.status || "active").replace('_', ' ')}
                          </span>
                        </td>

                        {/* Actions */}
                        <td className="py-4 px-5 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-1.5">
                            {!isDeletedByAdmin && (
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleEditProduct(product)}
                                className="h-8 px-2.5 rounded-lg text-xs font-bold text-gray-600 hover:text-[#FF5500] hover:bg-orange-50 dark:hover:bg-slate-800"
                              >
                                <Pencil className="w-3.5 h-3.5 mr-1" /> Edit
                              </Button>
                            )}

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-lg">
                                  <MoreVertical className="w-4 h-4 text-gray-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="rounded-xl p-1.5 min-w-[170px] shadow-lg">
                                {!isDeletedByAdmin && (
                                  <>
                                    <DropdownMenuItem 
                                      onClick={() => window.open(`/product/${product.id}`, "_blank")}
                                      className="text-xs font-bold cursor-pointer rounded-lg"
                                    >
                                      <Eye className="w-4 h-4 mr-2 text-gray-500" />
                                      View on Marketplace
                                    </DropdownMenuItem>

                                    <DropdownMenuItem 
                                      onClick={() => {
                                        setDealingProduct(product);
                                        setIsDealModalOpen(true);
                                      }}
                                      className="text-xs font-bold cursor-pointer text-[#FF5500] rounded-lg"
                                    >
                                      <Zap className="w-4 h-4 mr-2" />
                                      Create Flash Deal
                                    </DropdownMenuItem>

                                    <DropdownMenuSeparator />
                                  </>
                                )}

                                <DropdownMenuItem
                                  className="text-xs font-bold text-red-600 dark:text-red-400 cursor-pointer rounded-lg hover:bg-red-50"
                                  onClick={() => handleDeleteProduct(product.id)}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  {isDeletedByAdmin ? "Remove from List" : "Delete Listing"}
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>

                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

        ) : (

          /* ══════════════════════ E-COMMERCE GRID VIEW ══════════════════════ */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {filteredProducts.map((product: any) => {
              const price = Number(product.price) || 0;
              const originalPrice = product.original_price ? Number(product.original_price) : 0;
              const hasDiscount = originalPrice > price;
              const discountPercent = hasDiscount ? Math.round(((originalPrice - price) / originalPrice) * 100) : 0;
              const stock = Number(product.stock) || 0;
              const isDeletedByAdmin = product.status === "deleted_by_admin" || product.status === "deleted";

              return (
                <div 
                  key={product.id}
                  className={`group bg-white dark:bg-card rounded-2xl border overflow-hidden shadow-xs hover:shadow-md transition-all duration-300 flex flex-col ${
                    isDeletedByAdmin ? "border-red-200 dark:border-red-900/60 opacity-80" : "border-gray-100 dark:border-slate-800"
                  }`}
                >
                  {/* Photo Container */}
                  <div className="relative aspect-square bg-gray-100 dark:bg-slate-800 overflow-hidden">
                    <img 
                      src={product.image_url || product.image || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500&auto=format&fit=crop&q=80"} 
                      alt={product.name}
                      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${isDeletedByAdmin ? "grayscale opacity-50" : ""}`}
                    />

                    {isDeletedByAdmin ? (
                      <div className="absolute inset-0 bg-black/60 backdrop-blur-xs flex flex-col items-center justify-center p-3 text-center z-10">
                        <div className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center mb-1 shadow-md">
                          <AlertTriangle className="w-4 h-4" />
                        </div>
                        <span className="text-white font-black text-xs uppercase tracking-wider">Removed by Admin</span>
                        <span className="text-white/80 text-[10px] mt-0.5">Not live on site</span>
                      </div>
                    ) : (
                      <>
                        {hasDiscount && (
                          <span className="absolute top-2.5 left-2.5 bg-[#FF5500] text-white text-[10px] font-black px-2 py-0.5 rounded-md shadow-xs">
                            -{discountPercent}% OFF
                          </span>
                        )}

                        <span className="absolute top-2.5 right-2.5 px-2 py-0.5 bg-black/60 backdrop-blur-xs text-white text-[9px] font-black uppercase rounded-md">
                          {product.category || "General"}
                        </span>

                        {/* Stock pill overlay */}
                        <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                          <span className={`px-2 py-0.5 text-[10px] font-black rounded-md shadow-xs ${
                            stock === 0 
                              ? "bg-red-500 text-white" 
                              : stock <= 3 
                                ? "bg-amber-500 text-white" 
                                : "bg-emerald-600 text-white"
                          }`}>
                            {stock === 0 ? "Out of Stock" : `${stock} in stock`}
                          </span>

                          <Button
                            size="sm"
                            onClick={() => handleEditProduct(product)}
                            className="h-7 px-2.5 rounded-lg bg-white/90 hover:bg-white text-gray-900 text-xs font-bold shadow-xs"
                          >
                            <Pencil className="w-3 h-3 mr-1 text-[#FF5500]" /> Edit
                          </Button>
                        </div>
                      </>
                    )}
                  </div>

                  {/* Body Content */}
                  <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                    <div>
                      <h4 className="font-black text-sm text-gray-900 dark:text-white line-clamp-1 group-hover:text-[#FF5500] transition-colors">
                        {product.name}
                      </h4>
                      {isDeletedByAdmin && (
                        <p className="text-[10px] font-black text-red-600 dark:text-red-400 mt-1">
                          ⚠️ Removed from marketplace by administrator
                        </p>
                      )}
                      <p className="text-xs text-gray-500 line-clamp-2 mt-1 leading-relaxed">
                        {product.description || "No description provided."}
                      </p>
                    </div>

                    <div className="pt-2 border-t border-gray-100 dark:border-slate-800 flex items-center justify-between">
                      <div>
                        <span className="font-black text-base text-gray-900 dark:text-white">
                          GH₵{price.toFixed(2)}
                        </span>
                        {hasDiscount && (
                          <span className="block text-[10px] line-through text-gray-400">
                            GH₵{originalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-1">
                        {!isDeletedByAdmin && (
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => window.open(`/product/${product.id}`, "_blank")}
                            className="h-8 w-8 rounded-lg text-gray-400 hover:text-gray-700"
                            title="View on site"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDeleteProduct(product.id)}
                          className="h-8 w-8 rounded-lg text-red-500 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* ── Add / Edit Product Modal ── */}
      <ProductForm
        open={isFormOpen}
        onClose={() => setIsFormOpen(false)}
        product={editingProduct}
        onSave={handleSaveProduct}
        isSubmitting={createMutation.isPending || updateMutation.isPending}
      />

      {/* ── Profile Gate Required Modal ── */}
      <Dialog open={isProfileGateModalOpen} onOpenChange={setIsProfileGateModalOpen}>
        <DialogContent className="sm:max-w-md rounded-none border border-slate-300 dark:border-slate-700 p-6 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-none bg-orange-100 dark:bg-orange-950/60 text-[#FF5500] mx-auto flex items-center justify-center mb-3 shadow-inner">
            <Store className="w-7 h-7" />
          </div>
          <DialogHeader>
            <DialogTitle className="text-xl font-black text-center uppercase tracking-wider">Complete Store Profile to Sell</DialogTitle>
            <DialogDescription className="text-xs text-center text-gray-500 mt-1">
              To protect campus students and ensure smooth order deliveries, please finish your basic store profile setup before creating product listings.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-2.5 py-4 text-left text-xs bg-slate-50 dark:bg-muted/40 p-4 rounded-none border border-gray-200 dark:border-border">
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">Store Business Name</span>
              <span className={`font-black flex items-center gap-1 ${(profile?.store_name || localCache?.store_name || profile?.full_name) ? "text-emerald-600" : "text-amber-600"}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${(profile?.store_name || localCache?.store_name || profile?.full_name) ? "text-emerald-500" : "text-gray-300"}`} />
                {(profile?.store_name || localCache?.store_name || profile?.full_name) ? "Completed" : "Required"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">Campus Hub Location</span>
              <span className={`font-black flex items-center gap-1 ${(profile?.campus || localCache?.campus) ? "text-emerald-600" : "text-amber-600"}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${(profile?.campus || localCache?.campus) ? "text-emerald-500" : "text-gray-300"}`} />
                {(profile?.campus || localCache?.campus) ? "Completed" : "Required"}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-bold text-gray-700 dark:text-gray-300">WhatsApp / Phone Contact</span>
              <span className={`font-black flex items-center gap-1 ${(profile?.phone || localCache?.phone) ? "text-emerald-600" : "text-amber-600"}`}>
                <CheckCircle2 className={`w-3.5 h-3.5 ${(profile?.phone || localCache?.phone) ? "text-emerald-500" : "text-gray-300"}`} />
                {(profile?.phone || localCache?.phone) ? "Completed" : "Required"}
              </span>
            </div>
          </div>

          <DialogFooter className="flex flex-col sm:flex-row gap-2 mt-1">
            <Button
              onClick={() => {
                setIsProfileGateModalOpen(false);
                navigate("/vendor/profile");
              }}
              className="w-full bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs h-10 rounded-none shadow-md uppercase tracking-wider"
            >
              Complete Store Profile Now →
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Flash Deal Creation Modal ── */}
      <Dialog open={isDealModalOpen} onOpenChange={setIsDealModalOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-2xl border border-gray-100 dark:border-slate-800 shadow-2xl p-6">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-base font-black uppercase tracking-wider text-gray-900 dark:text-white">
              <Zap className="w-5 h-5 text-[#FF5500]" />
              Create Flash Deal
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Submit a time-limited student discount to be featured on the homepage Flash Sales banner.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmitDeal} className="space-y-4 py-2">
            {dealingProduct && (
              <div className="bg-orange-50/50 dark:bg-orange-950/20 p-3 rounded-xl border border-orange-100 dark:border-orange-900/30 flex items-center gap-3">
                <div className="w-11 h-11 rounded-lg bg-white flex items-center justify-center overflow-hidden border border-gray-100 shrink-0">
                   <img src={dealingProduct.image_url || dealingProduct.image} alt="" className="w-full h-full object-cover" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-black text-gray-900 dark:text-white truncate">{dealingProduct.name}</p>
                  <p className="text-[11px] text-gray-500 font-bold">Standard Price: GH₵{Number(dealingProduct.price).toFixed(2)}</p>
                </div>
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="discountPrice" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                Flash Sale Price (GH₵) *
              </Label>
              <Input
                id="discountPrice"
                type="number"
                step="0.01"
                required
                placeholder="e.g. 75.00"
                className="rounded-xl h-10 text-xs font-black"
                value={dealForm.discountPrice}
                onChange={(e) => setDealForm({ ...dealForm, discountPrice: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="startTime" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                  Start Time *
                </Label>
                <Input
                  id="startTime"
                  type="datetime-local"
                  required
                  className="rounded-xl h-10 text-xs"
                  value={dealForm.startTime}
                  onChange={(e) => setDealForm({ ...dealForm, startTime: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="endTime" className="text-xs font-black uppercase text-gray-700 dark:text-gray-300">
                  End Time *
                </Label>
                <Input
                  id="endTime"
                  type="datetime-local"
                  required
                  className="rounded-xl h-10 text-xs"
                  value={dealForm.endTime}
                  onChange={(e) => setDealForm({ ...dealForm, endTime: e.target.value })}
                />
              </div>
            </div>

            <DialogFooter className="pt-3 border-t border-gray-100 dark:border-slate-800 flex gap-2">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDealModalOpen(false)} 
                className="rounded-xl text-xs font-bold uppercase h-10 flex-1"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitDealMutation.isPending} 
                className="rounded-xl bg-[#FF5500] hover:bg-[#e54a00] text-white text-xs font-black uppercase h-10 flex-1 shadow-md"
              >
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
