import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Grid3X3, LayoutList, Heart, Star, ShoppingCart,
  SlidersHorizontal, ChevronRight, Laptop, Smartphone, Shirt,
  BookOpen, Utensils, Headphones, Gift, Dumbbell, Package, X
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";

const categories = [
  { label: "All Products", value: "All", icon: Package },
  { label: "Computers", value: "Computers", icon: Laptop },
  { label: "Phones & Accessories", value: "Phones & Accessories", icon: Smartphone },
  { label: "Fashion", value: "Fashion", icon: Shirt },
  { label: "Books & Notes", value: "Books & Notes", icon: BookOpen },
  { label: "Food & Snacks", value: "Food & Snacks", icon: Utensils },
  { label: "Electronics", value: "Electronics", icon: Headphones },
  { label: "Sports", value: "Sports", icon: Dumbbell },
  { label: "Gifts", value: "Gifts", icon: Gift },
  { label: "Others", value: "Others", icon: Package },
];

const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low", "Most Popular"];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("Newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "All";

  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categoryFilter, searchQuery],
    queryFn: () => productService.getProducts({ category: categoryFilter, search: searchQuery }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (localSearch) prev.set("search", localSearch);
      else prev.delete("search");
      return prev;
    });
  };

  const handleCategoryChange = (category: string) => {
    setSearchParams((prev) => {
      if (category === "All") prev.delete("category");
      else prev.set("category", category);
      return prev;
    });
    setSidebarOpen(false);
  };

  const handleAddToCart = (product: StorefrontProduct, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      vendor: product.vendor,
      vendorId: product.vendor_id,
    });
    toast({ title: "Added to cart", description: `${product.name} added to your cart.` });
  };

  const activeCategory = categories.find(c => c.value === categoryFilter) || categories[0];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <main className="pt-[130px] pb-20">
        {/* Top Search Bar */}
        <div className="bg-white border-b border-gray-100 sticky top-[130px] z-30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-4 h-16">
              {/* Mobile sidebar toggle */}
              <button
                className="lg:hidden flex items-center gap-2 text-sm font-bold text-gray-700 border border-gray-200 px-4 py-2 rounded-none hover:bg-gray-50"
                onClick={() => setSidebarOpen(!sidebarOpen)}
              >
                <SlidersHorizontal className="w-4 h-4" />
                Filters
              </button>

              {/* Search */}
              <form onSubmit={handleSearch} className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full h-10 pl-11 pr-4 bg-gray-50 border border-gray-200 rounded-none text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/10 transition-all"
                />
              </form>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="hidden md:block h-10 px-4 bg-gray-50 border border-gray-200 rounded-none text-sm text-gray-700 font-medium outline-none focus:border-primary cursor-pointer"
              >
                {sortOptions.map(opt => <option key={opt}>{opt}</option>)}
              </select>

              {/* View toggle */}
              <div className="hidden md:flex items-center gap-1 bg-gray-100 p-1 rounded-none">
                <button
                  onClick={() => setViewMode("grid")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "grid" ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setViewMode("list")}
                  className={`p-2 rounded-lg transition-all ${viewMode === "list" ? "bg-white shadow-sm text-primary" : "text-gray-400 hover:text-gray-600"}`}
                >
                  <LayoutList className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-8">
          <div className="flex gap-8">

            {/* ── LEFT SIDEBAR ── */}
            {/* Mobile overlay */}
            {sidebarOpen && (
              <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
            )}

            <aside className={`
              fixed lg:static top-0 left-0 h-full lg:h-auto w-72 lg:w-64 xl:w-72
              bg-white lg:bg-transparent
              z-50 lg:z-auto
              transform transition-transform duration-300
              ${sidebarOpen ? "translate-x-0 shadow-2xl" : "-translate-x-full lg:translate-x-0"}
              flex-shrink-0
            `}>
              <div className="lg:sticky lg:top-48 p-6 lg:p-0">
                {/* Mobile close */}
                <div className="flex items-center justify-between mb-6 lg:hidden">
                  <span className="font-black text-lg text-gray-900">Filters</span>
                  <button onClick={() => setSidebarOpen(false)}>
                    <X className="w-5 h-5 text-gray-400" />
                  </button>
                </div>

                {/* Categories */}
                <div className="bg-white rounded-none border border-gray-100 shadow-sm overflow-hidden">
                  <div className="px-5 py-4 border-b border-gray-50">
                    <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Browse Categories</h3>
                  </div>
                  <div className="p-2">
                    {categories.map((cat) => {
                      const Icon = cat.icon;
                      const isActive = categoryFilter === cat.value || (cat.value === "All" && !categoryFilter);
                      return (
                        <button
                          key={cat.value}
                          onClick={() => handleCategoryChange(cat.value)}
                          className={`w-full flex items-center gap-3 px-4 py-3 rounded-none text-left transition-all group ${
                            isActive
                              ? "bg-primary text-white shadow-lg shadow-primary/20"
                              : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                          }`}
                        >
                          <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-primary"}`} />
                          <span className="text-sm font-semibold flex-1">{cat.label}</span>
                          {isActive && <ChevronRight className="w-3 h-3 text-white/70" />}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Price Range Card */}
                <div className="bg-white rounded-none border border-gray-100 shadow-sm p-5 mt-4">
                  <h3 className="text-xs font-black uppercase tracking-widest text-gray-400 mb-4">Price Range</h3>
                  <div className="flex items-center gap-3">
                    <input type="number" placeholder="Min" className="w-full h-10 px-3 border border-gray-200 rounded-none text-sm outline-none focus:border-primary" />
                    <span className="text-gray-300 font-bold">—</span>
                    <input type="number" placeholder="Max" className="w-full h-10 px-3 border border-gray-200 rounded-none text-sm outline-none focus:border-primary" />
                  </div>
                  <button className="w-full mt-3 h-10 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-none hover:bg-primary/90 transition-colors">
                    Apply
                  </button>
                </div>

                {/* Promo Banner */}
                <div className="mt-4 rounded-none overflow-hidden bg-gradient-to-br from-primary to-[#FF5500] p-5 text-white">
                  <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-1">Student Deal</p>
                  <p className="text-2xl font-black leading-tight mb-3">Up to 40% Off Today</p>
                  <Link to="/products?sale=true" className="inline-flex items-center gap-2 bg-white text-primary text-xs font-black uppercase tracking-wider px-4 py-2 rounded-none">
                    Shop Sale <ChevronRight className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            </aside>

            {/* ── RIGHT: PRODUCTS ── */}
            <div className="flex-1 min-w-0">
              {/* Results header */}
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h1 className="text-2xl font-black text-gray-900 tracking-tight">{activeCategory.label}</h1>
                  <p className="text-sm text-gray-400 font-medium mt-0.5">
                    {isLoading ? "Loading..." : `${products.length} products found`}
                  </p>
                </div>
                {categoryFilter !== "All" && categoryFilter && (
                  <button
                    onClick={() => handleCategoryChange("All")}
                    className="flex items-center gap-2 text-xs font-bold text-gray-500 border border-gray-200 px-3 py-1.5 rounded-none hover:border-red-300 hover:text-red-500 transition-colors"
                  >
                    Clear <X className="w-3 h-3" />
                  </button>
                )}
              </div>

              {/* Loading */}
              {isLoading ? (
                <div className={`grid gap-5 ${viewMode === "grid" ? "grid-cols-2 md:grid-cols-3 xl:grid-cols-4" : "grid-cols-1"}`}>
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-none border border-gray-100 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-100 rounded-none w-1/2" />
                        <div className="h-4 bg-gray-100 rounded-none w-3/4" />
                        <div className="h-5 bg-gray-100 rounded-none w-1/3" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : products.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 text-center">
                  <div className="w-20 h-20 bg-gray-100 rounded-none flex items-center justify-center mb-4">
                    <Search className="w-9 h-9 text-gray-300" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 mb-2">No products found</h3>
                  <p className="text-gray-400 font-medium mb-6 max-w-sm">Try adjusting your search or browse another category.</p>
                  <button onClick={() => setSearchParams({})} className="h-11 px-8 bg-primary text-white font-black text-xs uppercase tracking-widest rounded-none hover:bg-primary/90 transition-colors">
                    Clear Filters
                  </button>
                </div>
              ) : (
                <>
                  {/* Grid View */}
                  {viewMode === "grid" ? (
                    <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-5">
                      {products.map((product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.id}`}
                          className="group bg-white rounded-none border border-gray-100 overflow-hidden hover:shadow-xl hover:shadow-gray-200/80 hover:-translate-y-1 transition-all duration-300"
                        >
                          <div className="relative aspect-square overflow-hidden bg-gray-50">
                            <img
                              src={product.image}
                              alt={product.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <button
                              onClick={(e) => e.preventDefault()}
                              className="absolute top-3 right-3 w-8 h-8 bg-white rounded-none flex items-center justify-center opacity-0 group-hover:opacity-100 shadow-md transition-all hover:text-red-500"
                            >
                              <Heart className="w-4 h-4" />
                            </button>
                            <div className="absolute inset-x-3 bottom-3 opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                              <button
                                onClick={(e) => handleAddToCart(product, e)}
                                className="w-full h-9 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-none flex items-center justify-center gap-2 shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                              </button>
                            </div>
                          </div>
                          <div className="p-4">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">{product.vendor}</p>
                            <h3 className="text-sm font-bold text-gray-900 line-clamp-2 mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                            <div className="flex items-center justify-between">
                              <span className="text-lg font-black text-gray-900">GH₵{product.price}</span>
                              <div className="flex items-center gap-1">
                                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                                <span className="text-xs font-bold text-gray-500">{product.rating || 4.5}</span>
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    /* List View */
                    <div className="flex flex-col gap-4">
                      {products.map((product) => (
                        <Link
                          key={product.id}
                          to={`/products/${product.id}`}
                          className="group flex gap-5 bg-white rounded-none border border-gray-100 overflow-hidden hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 p-4"
                        >
                          <div className="relative w-32 h-32 flex-shrink-0 rounded-none overflow-hidden bg-gray-50">
                            <img src={product.image} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/70 mb-1">{product.vendor}</p>
                            <h3 className="font-bold text-gray-900 mb-2 group-hover:text-primary transition-colors">{product.name}</h3>
                            <div className="flex items-center gap-1 mb-3">
                              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                              <span className="text-xs font-bold text-gray-500">{product.rating || 4.5}</span>
                              <span className="text-xs text-gray-300">({product.reviews || 0} reviews)</span>
                            </div>
                            <div className="flex items-center gap-4">
                              <span className="text-xl font-black text-gray-900">GH₵{product.price}</span>
                              <button
                                onClick={(e) => handleAddToCart(product, e)}
                                className="h-9 px-5 bg-primary text-white text-xs font-black uppercase tracking-wider rounded-none flex items-center gap-2 hover:bg-primary/90 transition-colors shadow-md shadow-primary/20"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" /> Add to Cart
                              </button>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Load More */}
                  <div className="text-center mt-12">
                    <button className="h-12 px-10 bg-white border-2 border-gray-200 text-gray-700 font-black text-xs uppercase tracking-widest rounded-none hover:border-primary hover:text-primary transition-all">
                      Load More Products
                    </button>
                  </div>
                </>
              )}
            </div>

          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
