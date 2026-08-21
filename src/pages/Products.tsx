import { useState, useMemo } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Heart, ShoppingCart, ShoppingBag,
  SlidersHorizontal, ChevronRight, Package, ArrowRight,
  Minus, Plus, Check, Filter, ChevronDown
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";
import ShopHeroCarousel from "@/components/shop/ShopHeroCarousel";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { UnimallProductCard } from "@/components/home/UnimallProductCard";

const categories = [
  { label: "All Products", value: "All", icon: Package },
  ...PRODUCT_CATEGORIES.map((cat) => ({ label: cat.label, value: cat.label, icon: cat.icon })),
];

const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low", "Most Popular"];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("newest");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Collapsible accordion states
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);
  const [campusOpen, setCampusOpen] = useState(true);

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "All";
  const campusFilter = searchParams.get("campus") || "All";

  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categoryFilter, searchQuery],
    queryFn: () => productService.getProducts({ category: categoryFilter, search: searchQuery }),
    placeholderData: (prev) => prev || (categoryFilter === "All" && !searchQuery ? productService.getCachedProducts() : undefined),
    staleTime: 1000 * 60 * 5,
  });

  // Map of vendor names to their campus location
  const VENDOR_CAMPUS_MAP: Record<string, string> = {
    "techhub": "Legon",
    "bookworm": "KNUST",
    "styleco": "Legon",
    "fitzone": "UCC",
    "megamart": "UPSA",
    "freshfoods": "KNUST",
    "stationeryexpress": "UCC",
    "artvibes": "UPSA"
  };

  const processedProducts = useMemo(() => {
    let list = [...products];

    // 1. Campus filter
    if (campusFilter !== "All") {
      list = list.filter(product => {
        const vendorName = (product.vendor || "").toLowerCase();
        const vendorCampus = VENDOR_CAMPUS_MAP[vendorName] || "Legon";
        return vendorCampus.toLowerCase() === campusFilter.toLowerCase();
      });
    }

    // 2. Preset Price Range
    if (priceRange === "below-200") {
      list = list.filter(p => p.price < 200);
    } else if (priceRange === "200-500") {
      list = list.filter(p => p.price >= 200 && p.price <= 500);
    } else if (priceRange === "500-800") {
      list = list.filter(p => p.price >= 500 && p.price <= 800);
    } else if (priceRange === "800-1000") {
      list = list.filter(p => p.price >= 800 && p.price <= 1000);
    } else if (priceRange === "1000-plus") {
      list = list.filter(p => p.price > 1000);
    }

    // 3. Custom min/max price
    if (minPrice) {
      list = list.filter(p => p.price >= parseFloat(minPrice));
    }
    if (maxPrice) {
      list = list.filter(p => p.price <= parseFloat(maxPrice));
    }

    // 4. Sorting: Verified Vendors ALWAYS on top, followed by user sort preference / newest
    const isProductVerified = (p: any) => {
      if (p.is_pro || p.vendor_verified) return true;
      const trusted = ["unimall store", "techhub", "styleco", "bookworm", "oraimo home", "studymart"];
      return trusted.some((t) => (p.vendor || "").toLowerCase().includes(t));
    };

    list.sort((a, b) => {
      const aVer = isProductVerified(a) ? 1 : 0;
      const bVer = isProductVerified(b) ? 1 : 0;

      // Verified vendor products ALWAYS on top
      if (aVer !== bVer) {
        return bVer - aVer;
      }

      if (sortBy === "price-low") {
        return a.price - b.price;
      } else if (sortBy === "price-high") {
        return b.price - a.price;
      } else if (sortBy === "rating") {
        return (b.rating || 5) - (a.rating || 5);
      } else {
        return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return list;
  }, [products, campusFilter, priceRange, minPrice, maxPrice, sortBy]);

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

  const activeCategory = categories.find(c => c.value === categoryFilter) || categories[0];

  return (
    <div className="min-h-screen bg-white dark:bg-background">
      <Navbar />

      <main className="pb-20">
        {/* Curated Shop Top Header */}
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0 pt-4 md:pt-6">
          <ShopHeroCarousel />
        </div>

        {/* ── MAIN PRODUCT CATALOG & FILTER AREA ── */}
        <div id="all-products" className="max-w-[1280px] mx-auto px-4 xl:px-0 py-6 scroll-mt-24">
          
          {/* Top Filter Header Bar (Matching Reference Screenshot) */}
          <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border p-4 mb-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
            {/* Left: Breadcrumbs & Results Count */}
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-muted-foreground font-medium mb-1">
                <Link to="/" className="hover:text-primary transition-colors">Categories</Link>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <span className="font-bold text-gray-900 dark:text-foreground">{activeCategory.label}</span>
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                {isLoading ? "Loading items..." : `Showing all ${processedProducts.length} items results`}
              </p>
            </div>

            {/* Right: Search, Filter Toggle & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Instant Search Bar */}
              <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={localSearch}
                  onChange={(e) => setLocalSearch(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 border border-gray-200 dark:border-border rounded-none text-xs outline-none focus:border-[#FF5500] bg-gray-50/50 dark:bg-muted/40"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </form>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="h-9 px-3 border border-gray-200 dark:border-border bg-white dark:bg-card text-xs font-bold text-gray-700 dark:text-foreground rounded-none outline-none focus:border-[#FF5500] cursor-pointer"
              >
                <option value="newest">Sort By: Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>

              {/* Mobile Filter Toggle */}
              <button
                className="lg:hidden h-9 px-4 border border-gray-200 dark:border-border rounded-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white dark:bg-card text-gray-800 dark:text-foreground"
                onClick={() => setSidebarOpen(true)}
              >
                <Filter className="w-3.5 h-3.5 text-[#FF5500]" /> Filters
              </button>
            </div>
          </div>

          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── LEFT FILTER SIDEBAR ── */}
            <aside className={`
              fixed lg:static inset-0 z-50 lg:z-0 lg:w-64 xl:w-72 flex-shrink-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              transition-transform duration-300
            `}>
              {/* Mobile Backdrop */}
              <div className="absolute inset-0 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />

              <div className="relative w-72 lg:w-full h-full bg-white dark:bg-card lg:bg-transparent overflow-y-auto lg:overflow-visible p-4 lg:p-0 space-y-4">
                
                {/* 1. Categories Accordion Box */}
                <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-none shadow-2xs overflow-hidden">
                  <button 
                    onClick={() => setCatOpen(!catOpen)}
                    className="w-full px-4 py-3 border-b border-gray-100 dark:border-border flex items-center justify-between text-xs font-bold text-gray-900 dark:text-foreground hover:bg-gray-50/50"
                  >
                    <span>Categories</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${catOpen ? "rotate-180" : ""}`} />
                  </button>
                  {catOpen && (
                    <div className="p-2 space-y-0.5">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = categoryFilter === cat.value || (cat.value === "All" && !categoryFilter);
                        return (
                          <button
                            key={cat.value}
                            onClick={() => handleCategoryChange(cat.value)}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all text-xs rounded-none ${
                              isActive
                                ? "bg-[#FF5500] text-white font-bold"
                                : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-muted hover:text-[#FF5500]"
                            }`}
                          >
                            <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-white" : "text-gray-400"}`} />
                            <span className="flex-1 truncate">{cat.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* 2. Product Price Ranges Accordion Box */}
                <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-none shadow-2xs p-4 space-y-4">
                  <button 
                    onClick={() => setPriceOpen(!priceOpen)}
                    className="w-full flex items-center justify-between border-b border-gray-100 dark:border-border pb-2 text-xs font-bold text-gray-900 dark:text-foreground"
                  >
                    <span>Product Price</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${priceOpen ? "rotate-180" : ""}`} />
                  </button>

                  {priceOpen && (
                    <>
                      {/* Radio Price Options */}
                      <div className="space-y-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                        {[
                          { id: "all", label: "All Price" },
                          { id: "below-200", label: "Below GH₵ 200" },
                          { id: "200-500", label: "GH₵ 200 - GH₵ 500" },
                          { id: "500-800", label: "GH₵ 500 - GH₵ 800" },
                          { id: "800-1000", label: "GH₵ 800 - GH₵ 1,000" },
                          { id: "1000-plus", label: "GH₵ 1,000+" },
                        ].map((opt) => (
                          <label key={opt.id} className="flex items-center gap-2.5 cursor-pointer hover:text-[#FF5500] transition-colors">
                            <input
                              type="radio"
                              name="priceRange"
                              checked={priceRange === opt.id}
                              onChange={() => setPriceRange(opt.id)}
                              className="accent-[#FF5500] w-3.5 h-3.5 cursor-pointer"
                            />
                            <span>{opt.label}</span>
                          </label>
                        ))}
                      </div>

                      {/* Custom Price Range Inputs */}
                      <div className="pt-2 border-t border-gray-100 dark:border-border space-y-2">
                        <p className="text-[11px] font-bold text-gray-900 dark:text-foreground">Custom Price Range:</p>
                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">GH₵</span>
                            <input
                              type="number"
                              placeholder="Min"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              className="w-full h-8 pl-9 pr-2 border border-gray-200 dark:border-border rounded-none text-xs outline-none focus:border-[#FF5500] bg-gray-50/50 dark:bg-muted/40"
                            />
                          </div>
                          <span className="text-gray-400 text-xs">—</span>
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">GH₵</span>
                            <input
                              type="number"
                              placeholder="Max"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              className="w-full h-8 pl-9 pr-2 border border-gray-200 dark:border-border rounded-none text-xs outline-none focus:border-[#FF5500] bg-gray-50/50 dark:bg-muted/40"
                            />
                          </div>
                        </div>
                      </div>

                      {/* Apply Button */}
                      <button 
                        onClick={() => setSidebarOpen(false)}
                        className="w-full h-10 bg-[#FF5500] hover:bg-[#e54a00] text-white text-xs font-bold uppercase tracking-wider rounded-none transition-colors shadow-md shadow-orange-500/20"
                      >
                        Apply Filter
                      </button>
                    </>
                  )}
                </div>

                {/* 3. Campus Location Accordion Box */}
                <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-none shadow-2xs p-4 space-y-3">
                  <button 
                    onClick={() => setCampusOpen(!campusOpen)}
                    className="w-full flex items-center justify-between border-b border-gray-100 dark:border-border pb-2 text-xs font-bold text-gray-900 dark:text-foreground"
                  >
                    <span>Campus Location</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${campusOpen ? "rotate-180" : ""}`} />
                  </button>
                  {campusOpen && (
                    <div className="space-y-1.5 text-xs font-medium text-gray-700 dark:text-gray-300">
                      {["All", "Legon", "KNUST", "UCC", "UPSA"].map((campus) => (
                        <button
                          key={campus}
                          onClick={() => {
                            setSearchParams(prev => {
                              if (campus === "All") prev.delete("campus");
                              else prev.set("campus", campus);
                              return prev;
                            });
                          }}
                          className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-none text-left transition-colors ${
                            (searchParams.get("campus") || "All") === campus
                              ? "bg-orange-50 dark:bg-orange-950/30 text-[#FF5500] font-bold"
                              : "hover:bg-gray-50 dark:hover:bg-muted"
                          }`}
                        >
                          <span>{campus} Campus</span>
                          {(searchParams.get("campus") || "All") === campus && <Check className="w-3.5 h-3.5 text-[#FF5500]" />}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

              </div>
            </aside>

            {/* ── PRODUCTS GRID MAIN DISPLAY ── */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-card h-[320px] sm:h-[380px] animate-pulse space-y-3">
                      <div className="aspect-square bg-gray-100 dark:bg-muted rounded-xl sm:rounded-2xl" />
                      <div className="h-4 bg-gray-100 dark:bg-muted rounded w-3/4" />
                      <div className="h-6 bg-gray-100 dark:bg-muted rounded w-full" />
                    </div>
                  ))}
                </div>
              ) : processedProducts.length === 0 ? (
                <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border p-12 text-center rounded-none">
                  <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 text-[#FF5500] rounded-none flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-foreground mb-1">No products match your filter</h3>
                  <p className="text-xs text-gray-400 font-medium mb-6">Try clearing your price range or category search.</p>
                  <Button 
                    onClick={() => {
                      setSearchParams({});
                      setPriceRange("all");
                      setMinPrice("");
                      setMaxPrice("");
                    }} 
                    className="rounded-none bg-[#FF5500] hover:bg-[#e54a00] font-bold text-xs px-6 h-9 uppercase tracking-wider"
                  >
                    Reset All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                  {processedProducts.map((product) => (
                    <UnimallProductCard key={product.id} product={product} />
                  ))}
                </div>
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
