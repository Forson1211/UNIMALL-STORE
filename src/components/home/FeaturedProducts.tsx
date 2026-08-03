import { useState } from "react";
import { Link } from "react-router-dom";
import {
  ShoppingCart, Flame, ChevronRight, Monitor, Smartphone, Shirt, Home as HomeIcon,
  Heart, Check, Minus, Plus, ShoppingBag
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService } from "@/services/productService";

/* ─────────────────── MCB Rentals Style Product Card ─────────────────── */
const ProductCard = ({ product, discountPct }: { product: any; discountPct?: number }) => {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { addItem } = useCart();
  const { toast } = useToast();

  const resolvedDiscountPct =
    discountPct ??
    (product.original_price && product.original_price > product.price
      ? Math.round((1 - product.price / product.original_price) * 100)
      : undefined);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id || product.product_id,
      name: product.name || product.product_name,
      price: product.discount_price || product.price,
      image: product.image || product.image_url,
      vendor: product.vendor || product.vendor_name || "Unimall",
      vendorId: product.vendor_id || "",
    });
    toast({
      title: "Added to Cart",
      description: `${product.name || product.product_name} added to your bag.`,
    });
  };

  const handleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsWishlisted((prev) => !prev);
    toast({
      title: isWishlisted ? "Removed from Wishlist" : "Added to Wishlist",
      description: product.name || product.product_name,
    });
  };

  const inStock = (product.items_left ?? product.stock ?? 1) > 0;

  return (
    <Link
      to={`/products/${product.id || product.product_id}`}
      className="group flex flex-col bg-white dark:bg-card rounded-none border border-gray-200/80 dark:border-border p-2.5 hover:shadow-lg transition-all duration-300 relative h-full justify-between"
    >
      <div>
        {/* Top Image Box */}
        <div className="relative aspect-square bg-gray-50/70 dark:bg-muted/30 rounded-none overflow-hidden mb-2">
          <img
            src={product.image || product.image_url}
            alt={product.name || product.product_name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          {resolvedDiscountPct > 0 && (
            <div className="absolute top-1.5 left-1.5 bg-[#FF5500] text-white text-[9px] font-black px-1.5 py-0.5 rounded-none">
              -{resolvedDiscountPct}%
            </div>
          )}
        </div>

        {/* Product Title */}
        <h3 className="font-bold text-xs md:text-sm text-gray-900 dark:text-foreground line-clamp-1 leading-snug hover:text-[#FF5500] transition-colors mb-0.5">
          {product.name || product.product_name}
        </h3>

        {/* Vendor & Stock Status Row */}
        <div className="flex items-center justify-between text-[10px] text-gray-400 dark:text-muted-foreground font-medium mb-1.5">
          <span className="truncate max-w-[65%]">{product.vendor || product.vendor_name || "Unimall"}</span>
          <span className="flex items-center gap-0.5 font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
            <Check className="w-3 h-3 stroke-[2.5]" />
            {inStock ? "In stock" : "Out of stock"}
          </span>
        </div>
      </div>

      {/* Bottom Price & Action Buttons Row (Sharp Edges) */}
      <div className="flex items-center justify-between pt-1.5 mt-auto border-t border-gray-100 dark:border-border">
        <span className="font-black text-xs sm:text-sm text-[#FF5500] tracking-tight">
          GH₵ {(product.discount_price || product.price)?.toLocaleString()}
        </span>

        <div className="flex items-center gap-1">
          {/* Wishlist Button (Sharp Square) */}
          <button
            type="button"
            onClick={handleWishlist}
            className={`w-7 h-7 rounded-none border border-gray-200/80 dark:border-border flex items-center justify-center transition-colors ${
              isWishlisted
                ? "bg-red-50 text-red-500 border-red-100"
                : "bg-gray-50/80 dark:bg-muted/80 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-muted hover:text-[#FF5500]"
            }`}
            aria-label="Wishlist"
          >
            <Heart className={`w-3.5 h-3.5 ${isWishlisted ? "fill-red-500 text-red-500" : ""}`} />
          </button>

          {/* Cart Button (Sharp Square) */}
          <button
            type="button"
            onClick={handleAddToCart}
            className="w-7 h-7 rounded-none bg-[#FF5500] hover:bg-[#e54a00] text-white flex items-center justify-center transition-colors"
            aria-label="Add to Cart"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </Link>
  );
};

/* ─────────────────── Section Header ─────────────────── */
const SectionHeader = ({
  title, icon: Icon, linkTo, linkLabel = "See All"
}: { title: string; icon?: any; linkTo: string; linkLabel?: string }) => (
  <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
    <h2 className="text-sm md:text-base font-black text-gray-900 flex items-center gap-2">
      {Icon && <Icon className="w-4 h-4 text-[#FF5500]" />}
      {title}
    </h2>
    <Link to={linkTo} className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-0.5">
      {linkLabel} <ChevronRight className="w-3.5 h-3.5" />
    </Link>
  </div>
);

/* ─────────────────── Category Row ─────────────────── */
const CategoryRow = ({ title, category, icon: Icon }: { title: string; category: string; icon: any }) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["homepage-category", category],
    queryFn: () => productService.getProducts({ category, limit: 6 }),
  });

  if (isLoading || products.length === 0) return null;

  return (
    <div className="bg-white shadow-sm overflow-hidden">
      <SectionHeader title={title} icon={Icon} linkTo={`/products?category=${encodeURIComponent(category)}`} />
      <div className="p-2 md:p-3 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
        {products.map((p: any) => <ProductCard key={p.id} product={p} />)}
      </div>
    </div>
  );
};

/* ─────────────────── Main Component ─────────────────── */
const FeaturedProducts = () => {
  const { data: deals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ["homepage-deals"],
    queryFn: () => productService.getDeals(6),
  });

  const { data: topRated = [], isLoading: loadingTopRated } = useQuery({
    queryKey: ["homepage-top-rated"],
    queryFn: () => productService.getProducts({ sortBy: "rating", sortOrder: "desc", limit: 6 }),
  });

  const { data: bigDeals = [], isLoading: loadingBigDeals } = useQuery({
    queryKey: ["homepage-big-deals"],
    queryFn: async () => {
      const discounted = await productService.getDeals(12);
      if (discounted.length >= 6) return discounted;
      const fallback = await productService.getProducts({ sortBy: "created_at", sortOrder: "desc", limit: 12 });
      const seen = new Set(discounted.map((p) => p.id));
      return [...discounted, ...fallback.filter((p) => !seen.has(p.id))].slice(0, 12);
    },
  });

  return (
    <section className="py-3 bg-[#f1f1f2]">
      <div className="max-w-[1280px] mx-auto px-4 xl:px-0 space-y-3">

        {/* ── DEALS OF THE DAY ── */}
        {deals.length > 0 && (
          <div className="bg-white shadow-sm overflow-hidden">
            {/* Red Header Bar */}
            <div className="bg-[#DC143C] px-4 py-2.5 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wide">Deals of the Day</h2>
              </div>
              <Link to="/products" className="text-xs font-bold text-white hover:underline flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            {/* Products */}
            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {deals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── PROMO BANNER TILES ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          {[
            { src: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?q=80&w=600", label: "Top Phones" },
            { src: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=600", label: "Watches" },
            { src: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=600", label: "Sneakers" },
            { src: "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?q=80&w=600", label: "Cameras" },
          ].map((tile, i) => (
            <Link key={i} to="/products" className="relative aspect-square bg-white shadow-sm overflow-hidden group block">
              <img src={tile.src} alt={tile.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-black/30 flex items-end p-2">
                <span className="text-white text-xs font-black uppercase tracking-wide">{tile.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── PROMO BANNERS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="relative aspect-[21/9] md:aspect-[3/1] bg-white shadow-sm overflow-hidden group cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1000&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Electronics Showcase"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-700/80 to-transparent flex items-center px-6">
              <div>
                <h3 className="text-white text-lg md:text-2xl font-black uppercase leading-tight">Electronics<br />Showcase</h3>
                <p className="text-yellow-300 text-xs font-bold uppercase mt-1">Starting GH₵ 1,200</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-[21/9] md:aspect-[3/1] bg-white shadow-sm overflow-hidden group cursor-pointer">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
              alt="Fashion Week Sale"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-[#FF5500]/80 to-transparent flex items-center px-6">
              <div>
                <h3 className="text-white text-lg md:text-2xl font-black uppercase leading-tight">Fashion<br />Week Sale</h3>
                <p className="text-yellow-300 text-xs font-bold uppercase mt-1">Up to 60% OFF</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── TOP RATED ── */}
        {topRated.length > 0 && (
          <div className="bg-white shadow-sm overflow-hidden">
            <SectionHeader title="Top Rated" linkTo="/products" />
            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {topRated.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

        {/* ── CATEGORY ROWS ── */}
        <CategoryRow title="Phones & Accessories" category="Phones & Accessories" icon={Smartphone} />
        <CategoryRow title="Electronics" category="Electronics" icon={Monitor} />
        <CategoryRow title="Fashion" category="Fashion" icon={Shirt} />
        <CategoryRow title="Home & Office" category="Home & Office" icon={HomeIcon} />

        {/* ── SMALL AD GRID ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-3">
          {[
            { src: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=800", label: "Headphones" },
            { src: "https://images.unsplash.com/photo-1491553895911-0055eca6402d?q=80&w=800", label: "Sport Shoes" },
            { src: "https://images.unsplash.com/photo-1434493789847-2f02dc6ca35d?q=80&w=800", label: "Smart Watches" },
            { src: "https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?q=80&w=800", label: "Laptops" },
          ].map((tile, i) => (
            <Link key={i} to="/products" className="relative aspect-[3/2] bg-white shadow-sm overflow-hidden group block">
              <img src={tile.src} alt={tile.label} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent flex items-end p-3">
                <span className="text-white text-xs font-black uppercase tracking-wide">{tile.label}</span>
              </div>
            </Link>
          ))}
        </div>

        {/* ── DEALS YOU DON'T WANT TO MISS ── */}
        {bigDeals.length > 0 && (
          <div className="bg-white shadow-sm overflow-hidden">
            <div className="bg-[#FF5500] px-4 py-2.5 flex items-center justify-between">
              <h2 className="text-sm md:text-base font-black text-white uppercase tracking-wide">Deals You Don't Want To Miss</h2>
              <Link to="/products" className="text-xs font-bold text-white hover:underline flex items-center gap-0.5">
                See All <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="p-2 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2">
              {bigDeals.map((p) => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}

      </div>
    </section>
  );
};

export default FeaturedProducts;
