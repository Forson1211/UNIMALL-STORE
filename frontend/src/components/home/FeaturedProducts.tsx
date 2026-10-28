import { useState, useRef, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Star, Zap, ShieldCheck, Truck, Sparkles, ChevronRight, ChevronLeft,
  ArrowRight, Flame, Layers, Radio, Briefcase, Wind,
  Droplets, Clock, Mic, Sun, Feather, Headphones, MessageCircle
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";
import { UnimallProductCard } from "./UnimallProductCard";
import { UnimallVerifiedBadge } from "@/components/common/UnimallVerifiedBadge";
export { UnimallProductCard };
import { REAL_VENDOR_PRODUCTS } from "@/data/realVendorProducts";

/* ─────────────────── Default Real Products ─────────────────── */
const DEFAULT_SHOWCASE_PRODUCTS = REAL_VENDOR_PRODUCTS;
const DEFAULT_NEW_ARRIVALS_PRODUCTS = REAL_VENDOR_PRODUCTS;
const DEFAULT_PRO_SELLER_PRODUCTS = REAL_VENDOR_PRODUCTS;

/* ─────────────────── Product Swiper Carousel ─────────────────── */
const ProductSwiperCarousel = ({ 
  products, 
  badgeType = "new" 
}: { 
  products: any[]; 
  badgeType?: "new" | "pro" | "bestseller" 
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const totalItems = products.length;
  const totalDots = Math.min(Math.max(Math.ceil(totalItems / 2), 3), 8);

  const updateScrollState = () => {
    if (scrollRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
      setCanScrollLeft(scrollLeft > 10);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

      const maxScroll = scrollWidth - clientWidth;
      if (maxScroll > 0) {
        const progress = scrollLeft / maxScroll;
        const idx = Math.round(progress * (totalDots - 1));
        setActiveIndex(Math.min(Math.max(idx, 0), totalDots - 1));
      }
    }
  };

  useEffect(() => {
    updateScrollState();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener("scroll", updateScrollState, { passive: true });
      window.addEventListener("resize", updateScrollState);
      return () => {
        el.removeEventListener("scroll", updateScrollState);
        window.removeEventListener("resize", updateScrollState);
      };
    }
  }, [products]);

  // Automatic slide movement every 3.5 seconds (Smooth 2-item advance on mobile)
  useEffect(() => {
    if (isPaused || products.length <= 2) return;

    const interval = setInterval(() => {
      if (scrollRef.current) {
        const container = scrollRef.current;
        const maxScroll = container.scrollWidth - container.clientWidth;

        if (container.scrollLeft >= maxScroll - 25) {
          container.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          const scrollStep = container.clientWidth >= 1024 
            ? container.clientWidth / 4 
            : container.clientWidth >= 640 
              ? container.clientWidth / 3 
              : container.clientWidth;
          container.scrollBy({ left: scrollStep, behavior: "smooth" });
        }
      }
    }, 3800);

    return () => clearInterval(interval);
  }, [isPaused, products]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const isMobile = container.clientWidth < 640;
      const scrollAmount = isMobile 
        ? container.clientWidth 
        : container.clientWidth * 0.75;
      container.scrollBy({
        left: direction === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const scrollToDot = (dotIdx: number) => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const maxScroll = container.scrollWidth - container.clientWidth;
      const targetLeft = (dotIdx / (totalDots - 1)) * maxScroll;
      container.scrollTo({
        left: targetLeft,
        behavior: "smooth",
      });
    }
  };

  return (
    <div 
      className="relative group/swiper"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={() => setIsPaused(true)}
      onTouchEnd={() => setIsPaused(false)}
    >
      {/* Horizontal Smooth Scroll Track: Exactly 2 Items per View on Mobile */}
      <div
        ref={scrollRef}
        className="flex gap-2.5 sm:gap-5 lg:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5"
        style={{
          WebkitOverflowScrolling: "touch",
          scrollBehavior: "smooth",
          overscrollBehaviorX: "contain",
        }}
      >
        {products.map((product, idx) => (
          <div
            key={product.id || idx}
            className="w-[calc(50%-5px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-18px)] shrink-0 snap-start"
          >
            <UnimallProductCard product={product} badgeType={badgeType} />
          </div>
        ))}
      </div>

      {/* Bottom Navigation Controls Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-5 sm:mt-6">
        <button
          type="button"
          onClick={() => scroll("left")}
          aria-label="Previous items"
          disabled={!canScrollLeft}
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-border bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-muted flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4 stroke-[2.2]" />
        </button>

        {/* Bottom Pagination Dots with Active Orange Pill */}
        <div className="flex items-center gap-1.5 sm:gap-2">
          {Array.from({ length: totalDots }).map((_, i) => (
            <button
              key={i}
              onClick={() => scrollToDot(i)}
              aria-label={`Go to slide ${i + 1}`}
              className={`h-1 sm:h-1.5 transition-all duration-300 rounded-full cursor-pointer ${
                i === activeIndex
                  ? "w-5 sm:w-7 bg-[#FF5500]"
                  : "w-1.5 sm:w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => scroll("right")}
          aria-label="Next items"
          disabled={!canScrollRight}
          className="w-8 h-8 rounded-full border border-gray-200 dark:border-border bg-white dark:bg-card hover:bg-gray-50 dark:hover:bg-muted flex items-center justify-center text-gray-700 dark:text-gray-300 disabled:opacity-30 disabled:pointer-events-none transition-all shadow-2xs cursor-pointer"
        >
          <ChevronRight className="w-4 h-4 stroke-[2.2]" />
        </button>
      </div>
    </div>
  );
};

/* ─────────────────── Main Featured Showcase Component ─────────────────── */
const FeaturedProducts = () => {
  const cachedProducts = useMemo(() => productService.getCachedProducts(), []);

  // Fetch all homepage products in a single unified ultra-fast query
  const { data: allProducts = cachedProducts } = useQuery({
    queryKey: ["homepage-products"],
    queryFn: () => productService.getProducts({ limit: 50 }),
    initialData: cachedProducts.length > 0 ? cachedProducts : undefined,
    staleTime: 1000 * 30,
  });

  // 1. Pro Sellers Products (5-Hour Deterministic Round-Robin Fair Rotation among Verified Vendors)
  const proSellers = useMemo(() => {
    const list = allProducts && allProducts.length > 0 ? allProducts : cachedProducts;
    const proList = list.filter((p) => p.is_pro || p.vendor_verified);
    if (proList.length === 0) return list.slice(0, 8);

    const vendorGroups: Record<string, StorefrontProduct[]> = {};
    proList.forEach((prod) => {
      const vKey = prod.vendor_id || prod.vendor || "unimall";
      if (!vendorGroups[vKey]) vendorGroups[vKey] = [];
      vendorGroups[vKey].push(prod);
    });

    const FIVE_HOURS_MS = 5 * 60 * 60 * 1000;
    const currentSlot = Math.floor(Date.now() / FIVE_HOURS_MS);
    const vendorKeys = Object.keys(vendorGroups);
    if (vendorKeys.length <= 1) return proList.slice(0, 8);

    const shift = currentSlot % vendorKeys.length;
    const rotatedVendorKeys = [...vendorKeys.slice(shift), ...vendorKeys.slice(0, shift)];

    const rotated: StorefrontProduct[] = [];
    const maxProductsPerVendor = Math.max(...vendorKeys.map((k) => vendorGroups[k].length));

    for (let i = 0; i < maxProductsPerVendor; i++) {
      for (const vKey of rotatedVendorKeys) {
        if (vendorGroups[vKey][i]) {
          rotated.push(vendorGroups[vKey][i]);
        }
      }
    }
    return rotated.slice(0, 8);
  }, [allProducts, cachedProducts]);

  // 2. Best Sellers (Automatically ranked by reviews & ratings score)
  const bestSellers = useMemo(() => {
    const list = allProducts && allProducts.length > 0 ? allProducts : cachedProducts;
    return [...list].sort((a, b) => {
      const scoreA = (a.reviews || 0) * 10 + (a.rating || 5);
      const scoreB = (b.reviews || 0) * 10 + (b.rating || 5);
      return scoreB - scoreA;
    }).slice(0, 12);
  }, [allProducts, cachedProducts]);

  // 3. New Arrivals (Sorted newest first)
  const newArrivals = useMemo(() => {
    const list = allProducts && allProducts.length > 0 ? allProducts : cachedProducts;
    return [...list].sort((a, b) => {
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    }).slice(0, 12);
  }, [allProducts, cachedProducts]);

  return (
    <section className="pt-2 sm:pt-3 md:pt-4 pb-8 sm:pb-12 md:pb-14 bg-white dark:bg-background">
      <div className="max-w-[1280px] mx-auto px-4 xl:px-0 space-y-10 sm:space-y-14 md:space-y-16">

        {/* ── 0. PRO SELLERS SECTION (STRICTLY VERIFIED VENDORS ONLY WITH 5-HR ROTATION SWIPER) ── */}
        <div id="pro-sellers" className="space-y-5 sm:space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-gray-100 dark:border-border pb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-2.5">
                <span>Pro Sellers</span>
                <UnimallVerifiedBadge size={28} color="#FF5500" className="inline-block shrink-0 drop-shadow-xs" />
              </h2>
            </div>
            <Link
              to="/vendors"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-[#FF5500] transition-colors group"
            >
              See All Verified Vendors
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Product Swiper Carousel (Rotated Verified Pro Vendors) */}
          <ProductSwiperCarousel products={proSellers} badgeType="new" />
        </div>

        {/* ── 1. BEST SELLERS SECTION ── */}
        <div id="best-sellers" className="space-y-5 sm:space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-gray-100 dark:border-border pb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-2.5">
                <span>Best Sellers</span>
                <Zap className="w-6 h-6 sm:w-7 sm:h-7 fill-[#FF5500] text-[#FF5500] inline-block shrink-0 drop-shadow-xs" />
              </h2>
            </div>
            <Link
              to="/products?sort=popular"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-[#FF5500] transition-colors group"
            >
              See All Best Sellers
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Product Grid (2 columns on mobile, 3 on tablet, 4 on desktop - Multiple Rows) */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
            {bestSellers.slice(0, 8).map((product, idx) => (
              <UnimallProductCard 
                key={product.id || idx} 
                product={product} 
                badgeType="bestseller" 
              />
            ))}
          </div>
        </div>

        {/* ── 2. PROMOTIONAL FEATURE BANNERS ── */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
          {/* Banner 1 */}
          <div className="relative rounded-none overflow-hidden shadow-xs group bg-gradient-to-r from-gray-950 via-gray-900 to-gray-800 min-h-[200px] sm:min-h-[220px] flex items-center p-5 sm:p-8">
            <img
              src="https://images.unsplash.com/photo-1505740420928-5e560c06d30e?q=80&w=1000&auto=format&fit=crop"
              alt="Audio & Tech"
              className="absolute right-0 top-0 w-1/2 h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity"
            />
            <div className="relative z-10 max-w-[65%] space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-none bg-[#FF5500] text-white text-[10px] font-bold uppercase tracking-wider">
                Sound & Electronics
              </span>
              <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
                Immersive Audio & Smart Gear
              </h3>
              <p className="text-xs text-gray-300 font-medium leading-relaxed">
                Premium earbuds, headphones, and portable speakers engineered for students.
              </p>
              <Link
                to="/products?category=Electronics"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-white bg-white/20 hover:bg-white hover:text-gray-900 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-none transition-all backdrop-blur-xs"
              >
                Shop Sound <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* Banner 2 */}
          <div className="relative rounded-none overflow-hidden shadow-xs group bg-gradient-to-r from-emerald-900 via-teal-900 to-slate-900 min-h-[200px] sm:min-h-[220px] flex items-center p-5 sm:p-8">
            <img
              src="https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=1000&auto=format&fit=crop"
              alt="Campus Lifestyle"
              className="absolute right-0 top-0 w-1/2 h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700 mix-blend-luminosity"
            />
            <div className="relative z-10 max-w-[65%] space-y-2">
              <span className="inline-block px-2.5 py-0.5 rounded-none bg-black text-white text-[10px] font-bold uppercase tracking-wider">
                Campus Trends
              </span>
              <h3 className="text-lg sm:text-2xl font-extrabold text-white leading-tight">
                Daily Essentials & Wear
              </h3>
              <p className="text-xs text-emerald-100 font-medium leading-relaxed">
                Footwear, smart wearables & accessories tailored for your university journey.
              </p>
              <Link
                to="/products"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-900 bg-white hover:bg-gray-100 px-3.5 py-1.5 sm:px-4 sm:py-2 rounded-none transition-all shadow-xs"
              >
                Explore Trends <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {/* ── 3. NEW ARRIVALS SECTION (SWIPER CAROUSEL) ── */}
        <div id="new-arrivals" className="space-y-5 sm:space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-gray-100 dark:border-border pb-3">
            <div className="flex items-center gap-2 sm:gap-2.5">
              <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight flex items-center gap-2 sm:gap-2.5">
                <span>New Arrivals</span>
                <Sparkles className="w-6 h-6 sm:w-7 sm:h-7 fill-[#FF5500] text-[#FF5500] inline-block shrink-0 drop-shadow-xs" />
              </h2>
            </div>
            <Link
              to="/products?sort=newest"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-gray-900 dark:text-gray-100 hover:text-[#FF5500] transition-colors group"
            >
              See All New Arrivals
              <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          {/* Swiper Carousel */}
          <ProductSwiperCarousel products={newArrivals} badgeType="new" />
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;
