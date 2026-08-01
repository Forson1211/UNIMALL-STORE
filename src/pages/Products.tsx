import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Search, Heart, ShoppingCart,
  SlidersHorizontal, ChevronRight, Package, ArrowRight,
  Minus, Plus, Check
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";
import ShopHeroCarousel from "@/components/shop/ShopHeroCarousel";
import ShopQuickLinks from "@/components/shop/ShopQuickLinks";
import ProductShowcaseSection from "@/components/shop/ProductShowcaseSection";
import ShopCategoryBanners from "@/components/shop/ShopCategoryBanners";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

const categories = [
  { label: "All Products", value: "All", icon: Package },
  ...PRODUCT_CATEGORIES.map((cat) => ({ label: cat.label, value: cat.label, icon: cat.icon })),
];

const sortOptions = ["Newest", "Price: Low to High", "Price: High to Low", "Most Popular"];

/* ── MCB Rentals Style Product Card ── */
const MCBProductCard = ({ product }: { product: any }) => {
  const [qty, setQty] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    for (let i = 0; i < qty; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendor: product.vendor,
        vendorId: product.vendorId || "",
      });
    }
    toast({
      title: "Added to Cart",
      description: `${qty}x ${product.name} added to your bag.`,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: product.name,
    });
  };

  const inStock = product.stock == null || product.stock > 0;

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-xl p-3 flex flex-col justify-between hover:shadow-xl transition-all duration-300 relative h-full"
    >
      <div>
        {/* Top Image Box */}
        <div className="relative aspect-square bg-gray-50/70 dark:bg-muted/30 rounded-lg p-3 flex items-center justify-center overflow-hidden mb-3">
          <img
            src={product.image}
            alt={product.name}
            className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
          />
          <button
            type="button"
            onClick={handleWishlist}
            className={`absolute top-2 right-2 w-8 h-8 rounded-full bg-white dark:bg-card shadow-sm border border-gray-100 dark:border-border flex items-center justify-center transition-all ${
              isWishlisted ? "text-red-500 bg-red-50" : "text-gray-400 hover:text-[#FF5500]"
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>
        </div>

        {/* Product Title */}
        <h3 className="font-bold text-xs md:text-sm text-gray-900 dark:text-foreground line-clamp-2 leading-snug hover:text-[#FF5500] transition-colors mb-1">
          {product.name}
        </h3>

        {/* Category / Vendor */}
        <p className="text-[11px] text-gray-400 dark:text-muted-foreground font-medium mb-1.5 truncate">
          {product.vendor || product.category || "Unimall"}
        </p>

        {/* Stock Status */}
        <div className="flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400 mb-2">
          <Check className="w-3.5 h-3.5 stroke-[2.5]" />
          <span>{inStock ? "In stock" : "Out of stock"}</span>
        </div>
      </div>

      {/* Price & MCB Pill Button Bar */}
      <div className="mt-auto pt-1">
        <p className="text-base md:text-lg font-black text-[#FF5500] tracking-tight">
          GH₵ {product.price.toLocaleString()}
          {product.original_price && product.original_price > product.price && (
            <span className="text-xs text-gray-400 line-through font-medium ml-2">
              GH₵ {product.original_price.toLocaleString()}
            </span>
          )}
        </p>

        {/* Combined Pill Action Bar */}
        <div className="mt-2.5 flex items-center bg-[#FF5500] hover:bg-[#e54a00] text-white rounded-full h-9 p-0.5 shadow-md shadow-orange-500/20 transition-colors w-full overflow-hidden">
          {/* Quantity Selector inside Pill */}
          <div
            onClick={(e) => { e.preventDefault(); e.stopPropagation(); }}
            className="bg-black/20 dark:bg-black/40 rounded-full h-full px-1.5 flex items-center gap-0.5 text-xs font-bold shrink-0"
          >
            <button
              type="button"
              onClick={() => setQty((q) => Math.max(1, q - 1))}
              className="w-4.5 h-4.5 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white"
              aria-label="Decrease quantity"
            >
              <Minus className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
            <span className="w-3 text-center font-black select-none text-[11px] text-white">{qty}</span>
            <button
              type="button"
              onClick={() => setQty((q) => q + 1)}
              className="w-4.5 h-4.5 rounded-full flex items-center justify-center hover:bg-white/20 active:scale-90 transition-all text-white"
              aria-label="Increase quantity"
            >
              <Plus className="w-2.5 h-2.5 stroke-[2.5]" />
            </button>
          </div>

          {/* Buy Now / Add to Cart Action Label */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="group/btn flex-1 text-center font-extrabold text-[10px] sm:text-xs uppercase tracking-wider text-white h-full flex items-center justify-center px-1 truncate"
          >
            <span className="group-hover/btn:hidden">BUY NOW</span>
            <span className="hidden group-hover/btn:inline">ADD TO CART</span>
          </button>
        </div>
      </div>
    </Link>
  );
};

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");
  const [sortBy, setSortBy] = useState("Newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "All";
  const campusFilter = searchParams.get("campus") || "All";

  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categoryFilter, searchQuery],
    queryFn: () => productService.getProducts({ category: categoryFilter, search: searchQuery }),
  });

  // Map of vendor names to their campus location (fallback to Legon)
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

  const filteredProducts = products.filter(product => {
    if (campusFilter === "All") return true;
    const vendorName = (product.vendor || "").toLowerCase();
    const vendorCampus = VENDOR_CAMPUS_MAP[vendorName] || "Legon";
    return vendorCampus.toLowerCase() === campusFilter.toLowerCase();
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
    <div className="min-h-screen bg-[#f5f5f5]">
      <Navbar />

      <main className="pb-20">
        {/* Curated Shop Sections */}
        <div className="container mx-auto px-4 pt-4 md:pt-6">
          <ShopHeroCarousel />
          <ShopQuickLinks />
          <ProductShowcaseSection
            id="featured-products"
            title="Featured Products"
            sortBy="rating"
            promo={{
              title: "Trending Now",
              subtitle: "Top rated picks from campus vendors.",
              cta: "Explore",
              gradient: "bg-gradient-to-br from-gray-900 to-gray-700",
            }}
          />
          <ProductShowcaseSection
            id="just-arrived"
            title="Just Arrived"
            sortBy="created_at"
            promo={{
              title: "Just Dropped",
              subtitle: "New listings added by vendors every day.",
              cta: "See New",
              gradient: "bg-gradient-to-br from-primary to-secondary",
            }}
          />
          <ShopCategoryBanners />
        </div>

        {/* Top Header Section */}
        <div id="all-products" className="bg-white border-b border-gray-100 mb-6 py-4 scroll-mt-24">
          <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-black text-gray-900 tracking-tight uppercase">{activeCategory.label}</h1>
                <p className="text-xs md:text-sm text-gray-400 font-bold mt-1 uppercase tracking-widest">
                  {isLoading ? "Fetching catalog..." : `${filteredProducts.length} products available`}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {/* Search Field */}
                <form onSubmit={handleSearch} className="relative flex-1 md:w-64">
                  <input
                    type="text"
                    placeholder="Search in category..."
                    value={localSearch}
                    onChange={(e) => setLocalSearch(e.target.value)}
                    className="w-full h-10 pl-4 pr-10 border border-gray-200 rounded-none text-sm outline-none focus:border-primary"
                  />
                  <button type="submit" className="absolute right-0 top-0 h-10 w-10 flex items-center justify-center text-gray-400 hover:text-primary">
                    <Search className="w-4 h-4" />
                  </button>
                </form>

                <button
                  className="lg:hidden h-10 px-4 border border-gray-200 rounded-none flex items-center gap-2 text-xs font-black uppercase tracking-widest"
                  onClick={() => setSidebarOpen(true)}
                >
                  <SlidersHorizontal className="w-4 h-4" /> Filters
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4">

          <div className="flex flex-col lg:flex-row gap-6">

            {/* ── SIDEBAR ── */}
            {/* Mobile Drawer */}
            <aside className={`
              fixed lg:static inset-0 z-50 lg:z-0 lg:w-64 xl:w-72 flex-shrink-0
              ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
              transition-transform duration-300
            `}>
              {/* Overlay */}
              <div className="absolute inset-0 bg-black/40 lg:hidden" onClick={() => setSidebarOpen(false)} />

              {/* Sidebar Content */}
              <div className="relative w-72 lg:w-full h-full bg-white lg:bg-transparent overflow-y-auto lg:overflow-visible">
                <div className="lg:sticky lg:top-24 flex flex-col gap-4">

                  {/* Categories Card */}
                  <div className="bg-white rounded-none border border-border/40 shadow-sm overflow-hidden">
                    <div className="px-5 py-4 border-b border-gray-100">
                      <h3 className="text-xs font-black uppercase tracking-[0.15em] text-gray-400">Browse Categories</h3>
                    </div>
                    <div className="py-2">
                      {categories.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = categoryFilter === cat.value || (cat.value === "All" && !categoryFilter);
                        return (
                          <button
                            key={cat.value}
                            onClick={() => handleCategoryChange(cat.value)}
                            className={`w-full flex items-center gap-3 px-5 py-3 text-left transition-all group ${isActive
                                ? "bg-primary text-white"
                                : "text-gray-600 hover:bg-gray-50 hover:text-primary"
                              }`}
                          >
                            <Icon className={`w-5 h-5 flex-shrink-0 ${isActive ? "text-white" : "text-gray-400 group-hover:text-primary"}`} />
                            <span className="text-base font-black flex-1">{cat.label}</span>
                            <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? "translate-x-0" : "translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-50"}`} />
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Price Filter Card */}
                  <div className="bg-white rounded-none border border-border/40 shadow-sm p-5">
                    <h3 className="text-xs font-black uppercase tracking-[0.15em] text-gray-400 mb-5">Price Range</h3>
                    <div className="flex items-center gap-2 mb-4">
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Min</span>
                        <input type="number" className="w-full h-10 pl-10 pr-2 border border-gray-200 rounded-none text-sm outline-none focus:border-primary" />
                      </div>
                      <span className="text-gray-300">—</span>
                      <div className="relative flex-1">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">Max</span>
                        <input type="number" className="w-full h-10 pl-10 pr-2 border border-gray-200 rounded-none text-sm outline-none focus:border-primary" />
                      </div>
                    </div>
                    <button className="w-full h-12 bg-primary text-white text-xs font-black uppercase tracking-widest rounded-none hover:bg-black transition-colors shadow-lg shadow-primary/20">
                      Apply Filters
                    </button>
                  </div>

                  {/* Student Deal Banner */}
                  <div className="bg-primary p-6 rounded-none relative overflow-hidden group cursor-pointer">
                    <div className="relative z-10">
                      <p className="text-[10px] font-black uppercase tracking-widest text-white/70 mb-2">Exclusive Offer</p>
                      <h4 className="text-xl font-black text-white leading-tight uppercase mb-4 tracking-tighter">Student <br /> Deals Only</h4>
                      <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-white border-b border-white/40 pb-1 w-fit">
                        Discover Now <ArrowRight className="w-3.5 h-3.5 ml-2" />
                      </div>
                    </div>
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 -translate-y-1/2 translate-x-1/2 rotate-45 transition-transform group-hover:rotate-[60deg]" />
                  </div>
                </div>
              </div>
            </aside>

            {/* ── PRODUCTS GRID ── */}
            <div className="flex-1 min-w-0">
              {isLoading ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {[...Array(8)].map((_, i) => (
                    <div key={i} className="bg-white rounded-none border border-gray-100 overflow-hidden animate-pulse">
                      <div className="aspect-square bg-gray-100" />
                      <div className="p-4 space-y-2">
                        <div className="h-3 bg-gray-100 w-1/2" />
                        <div className="h-4 bg-gray-100 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredProducts.length === 0 ? (
                <div className="bg-white border border-gray-100 flex flex-col items-center justify-center py-32 text-center">
                  <div className="w-20 h-20 bg-gray-50 rounded-none flex items-center justify-center mb-6">
                    <Search className="w-8 h-8 text-gray-200" />
                  </div>
                  <h3 className="text-xl font-black text-gray-900 uppercase mb-2">No products found</h3>
                  <p className="text-gray-400 font-bold text-sm mb-8">Try adjusting your filters or search keywords.</p>
                  <Button onClick={() => setSearchParams({})} className="rounded-none bg-primary hover:bg-black font-black uppercase tracking-widest px-8">
                    Reset All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
                  {filteredProducts.map((product) => (
                    <MCBProductCard key={product.id} product={product} />
                  ))}
                </div>
              )}

              {/* Bottom Load More */}
              {filteredProducts.length > 0 && (
                <div className="mt-8 flex justify-center">
                  <button className="h-16 px-16 bg-white border-2 border-gray-200 text-gray-800 font-black text-sm uppercase tracking-[0.2em] hover:border-primary hover:text-primary transition-all rounded-none">
                    Load More Products
                  </button>
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
