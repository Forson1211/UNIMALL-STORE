import { useState, useRef, useEffect } from "react";
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

/* ─────────────────── Default Exact Reference Showcase Products ─────────────────── */
const DEFAULT_SHOWCASE_PRODUCTS: (StorefrontProduct & { variants?: any[]; isNew?: boolean })[] = [
  {
    id: "prod-megacarry-1",
    name: "MegaCarry Expandable Waterproof Travel Laptop Backpack",
    description: "wear of carry with large capacity • breathable & waterproof multi compartment design",
    price: 380.00,
    original_price: 430.00,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    features: [
      "wear of carry with large capacity",
      "breathable & waterproof multi compartment design"
    ],
    rating: 4.8,
    reviews: 124,
    vendor: "MegaCarry Official",
    vendor_id: "v1",
    created_at: new Date().toISOString(),
    status: true,
    stock: 25,
    isNew: true,
    is_pro: true,
  },
  {
    id: "prod-freshflush-2",
    name: "FreshFlush Antibacterial Odor Eliminator Toilet Cleaner Rim Block",
    description: "60g For Lasting Durability • Dual Color & Dual Action Power",
    price: 40.00,
    original_price: 50.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80",
    features: [
      "60g For Lasting Durability",
      "Dual Color & Dual Action Power"
    ],
    rating: 4.8,
    reviews: 690,
    vendor: "oraimo home",
    vendor_id: "v2",
    created_at: new Date().toISOString(),
    status: true,
    stock: 50,
    isNew: false,
  },
  {
    id: "prod-spacebuds-3",
    name: "SpaceBuds 2 AI Smart 45hrs Playtime Noise Cancelling Earbuds",
    description: "AI Translation & Voice Prompt • Infinite Light Effect",
    price: 495.00,
    original_price: 550.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    variants: [
      { image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=120&auto=format&fit=crop&q=80", color: "#111827" },
      { image: "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=120&auto=format&fit=crop&q=80", color: "#c7d2fe" }
    ],
    features: [
      "AI Translation & Voice Prompt",
      "Infinite Light Effect"
    ],
    rating: 4.9,
    reviews: 129,
    vendor: "TechHub",
    vendor_id: "v3",
    created_at: new Date().toISOString(),
    status: true,
    stock: 18,
    isNew: true,
    is_featured: true,
  },
  {
    id: "prod-ripplestep-4",
    name: "Ripplestep Soft Comfort EVA Slippers Ergonomic Slides",
    description: "breathable & cool • detachable insole soft & comfortable",
    price: 120.00,
    original_price: 135.00,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&auto=format&fit=crop&q=80",
    variants: [
      { image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=120&auto=format&fit=crop&q=80", color: "#1f2937" },
      { image: "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=120&auto=format&fit=crop&q=80", color: "#e5e7eb" }
    ],
    features: [
      "breathable & cool",
      "detachable insole soft & comfortable"
    ],
    rating: 4.8,
    reviews: 201,
    vendor: "StyleCo",
    vendor_id: "v4",
    created_at: new Date().toISOString(),
    status: true,
    stock: 40,
    isNew: true,
  },
  {
    id: "prod-watch4pro-5",
    name: "Watch 4 Pro 1.43\" AMOLED Stainless Steel Smartwatch With Bluetooth Calling",
    description: "Always-On Display • 100+ Sports Modes & Health Monitoring",
    price: 420.00,
    original_price: 480.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    features: [
      "1.43\" Ultra HD AMOLED Display",
      "Wireless Fast Charging & 7-Day Battery"
    ],
    rating: 4.9,
    reviews: 87,
    vendor: "TechHub",
    vendor_id: "v3",
    created_at: new Date().toISOString(),
    status: true,
    stock: 15,
    isNew: true,
    is_pro: true,
  },
  {
    id: "prod-powermax-6",
    name: "PowerMax 20000mAh 22.5W Two-Way Fast Charging Power Bank",
    description: "Digital LED Power Display • Charge 3 Devices Simultaneously",
    price: 180.00,
    original_price: 210.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&auto=format&fit=crop&q=80",
    features: [
      "22.5W High-Speed PD & QC 3.0",
      "Flight Approved Heavy Duty Polymer"
    ],
    rating: 4.8,
    reviews: 310,
    vendor: "PowerMax Tech",
    vendor_id: "v1",
    created_at: new Date().toISOString(),
    status: true,
    stock: 30,
    isNew: false,
  },
  {
    id: "prod-campusfan-7",
    name: "CampusPro Foldable Ultra-Quiet Rechargeable Desk & Bed Study Fan",
    description: "4-Speed Wind Adjustment • 4000mAh Battery With Night Light",
    price: 95.00,
    original_price: 115.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=600&auto=format&fit=crop&q=80",
    features: [
      "12-Hour Long Lasting Run Time",
      "Whisper Quiet Brushless Motor"
    ],
    rating: 4.7,
    reviews: 145,
    vendor: "oraimo home",
    vendor_id: "v2",
    created_at: new Date().toISOString(),
    status: true,
    stock: 22,
    isNew: true,
  },
  {
    id: "prod-thermolock-8",
    name: "ThermoLock 1000ml Double-Wall Vacuum Insulated Stainless Steel Bottle",
    description: "24h Cold & 12h Hot Retention • Leakproof Straw & Chug Lid",
    price: 85.00,
    original_price: 100.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
    features: [
      "18/8 Food Grade Stainless Steel",
      "BPA Free Sweat-Proof Powder Coating"
    ],
    rating: 4.9,
    reviews: 98,
    vendor: "StyleCo",
    vendor_id: "v4",
    created_at: new Date().toISOString(),
    status: true,
    stock: 45,
    isNew: false,
  },
];

/* ─────────────────── New Arrivals Swiper Carousel ─────────────────── */
const DEFAULT_NEW_ARRIVALS_PRODUCTS: (StorefrontProduct & { variants?: any[]; isNew?: boolean })[] = [
  {
    id: "new-magstand-1",
    name: "MagStand 950 950ml Smart Thermo Bottle With Magnetic Lid",
    description: "Magnetic Lid & Phone Mount 180° Adjustable • Grab & Go Portability",
    price: 260.00,
    original_price: 300.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
    features: [
      "Magnetic Lid & Phone Mount 180° Adjustable",
      "Grab & Go Portability"
    ],
    rating: 4.8,
    reviews: 5,
    vendor: "oraimo home",
    vendor_id: "v-oraimo",
    created_at: new Date().toISOString(),
    status: true,
    stock: 35,
    isNew: true,
  },
  {
    id: "new-heatgrip-2",
    name: "HeatGrip Anti-Skid Multi-Angle Kitchen Pan & Bowl Gripper",
    description: "Heat Resistance From -40°C To 230°C • One-Hand Easy Operation",
    price: 70.00,
    original_price: 80.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1590794056226-79ef3a8147e1?w=600&auto=format&fit=crop&q=80",
    features: [
      "Heat Resistance From -40°C To 230°C",
      "One-Hand Easy Operation"
    ],
    rating: 5.0,
    reviews: 2,
    vendor: "oraimo home",
    vendor_id: "v-oraimo",
    created_at: new Date().toISOString(),
    status: true,
    stock: 45,
    isNew: true,
  },
  {
    id: "new-multicut-3",
    name: "MultiCut Duo Dual-Sided Antibacterial Food Grade Cutting Board Set",
    description: "Double-Sided Design, Separate Raw And Cooked Food • Built In Grinding Area, Multi Functional Use",
    price: 190.00,
    original_price: 220.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1594385208974-2e75f8d7bb48?w=600&auto=format&fit=crop&q=80",
    features: [
      "Double-Sided Design, Separate Raw And Cooked Food",
      "Built In Grinding Area, Multi Functional Use"
    ],
    rating: 5.0,
    reviews: 4,
    vendor: "oraimo home",
    vendor_id: "v-oraimo",
    created_at: new Date().toISOString(),
    status: true,
    stock: 20,
    isNew: true,
  },
  {
    id: "new-watchstrap-4",
    name: "Watch Strap 06 Green Diamond Pattern Waterproof Silicone",
    description: "Silicone Watchband • 22mm Wide Quick Release",
    price: 60.00,
    original_price: 70.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1508685096489-7aacd43bd3b1?w=600&auto=format&fit=crop&q=80",
    features: [
      "Silicone Watchband",
      "22mm Wide"
    ],
    rating: 5.0,
    reviews: 1,
    vendor: "TechGear",
    vendor_id: "v-tech",
    created_at: new Date().toISOString(),
    status: true,
    stock: 50,
    isNew: true,
  },
  {
    id: "new-spacebuds-5",
    name: "SpaceBuds 2 AI Smart 45hrs Playtime Noise Cancelling Earbuds",
    description: "AI Translation & Voice Prompt • Infinite Light Effect",
    price: 495.00,
    original_price: 550.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    features: [
      "AI Translation & Voice Prompt",
      "Infinite Light Effect"
    ],
    rating: 4.9,
    reviews: 129,
    vendor: "TechHub",
    vendor_id: "v-tech",
    created_at: new Date().toISOString(),
    status: true,
    stock: 18,
    isNew: true,
  },
  {
    id: "new-ripplestep-6",
    name: "Ripplestep Soft Comfort EVA Slippers Ergonomic Slides",
    description: "breathable & cool • detachable insole soft & comfortable",
    price: 120.00,
    original_price: 135.00,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&auto=format&fit=crop&q=80",
    features: [
      "breathable & cool",
      "detachable insole soft & comfortable"
    ],
    rating: 4.8,
    reviews: 201,
    vendor: "StyleCo",
    vendor_id: "v-style",
    created_at: new Date().toISOString(),
    status: true,
    stock: 40,
    isNew: true,
  },
  {
    id: "new-megacarry-7",
    name: "MegaCarry Expandable Waterproof Travel Laptop Backpack",
    description: "wear of carry with large capacity • breathable & waterproof multi compartment design",
    price: 380.00,
    original_price: 430.00,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    features: [
      "wear of carry with large capacity",
      "breathable & waterproof multi compartment design"
    ],
    rating: 4.8,
    reviews: 124,
    vendor: "MegaCarry Official",
    vendor_id: "v-megacarry",
    created_at: new Date().toISOString(),
    status: true,
    stock: 25,
    isNew: true,
  },
];

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
  const totalDots = Math.min(Math.max(totalItems, 4), 10);

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

  // Automatic slide movement every 3.5 seconds
  useEffect(() => {
    if (isPaused || products.length <= 1) return;

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
              : container.clientWidth / 2;
          container.scrollBy({ left: scrollStep, behavior: "smooth" });
        }
      }
    }, 3500);

    return () => clearInterval(interval);
  }, [isPaused, products]);

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const container = scrollRef.current;
      const scrollAmount = container.clientWidth * 0.75;
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
      {/* Horizontal Smooth Scroll Track */}
      <div
        ref={scrollRef}
        className="flex gap-3 sm:gap-5 lg:gap-6 overflow-x-auto no-scrollbar scroll-smooth snap-x snap-mandatory py-1 px-0.5"
      >
        {products.map((product, idx) => (
          <div
            key={product.id || idx}
            className="w-[calc(50%-6px)] sm:w-[calc(33.333%-14px)] lg:w-[calc(25%-18px)] shrink-0 snap-start"
          >
            <UnimallProductCard product={product} badgeType={badgeType} />
          </div>
        ))}
      </div>

      {/* Bottom Navigation Controls Bar */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
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

/* ─────────────────── Default Exact Reference Pro Seller Products ─────────────────── */
const DEFAULT_PRO_SELLER_PRODUCTS: (StorefrontProduct & { variants?: any[]; isNew?: boolean })[] = [
  {
    id: "pro-megacarry-1",
    name: "MegaCarry Expandable Waterproof Travel Laptop Backpack",
    description: "wear of carry with large capacity • breathable & waterproof multi compartment design",
    price: 380.00,
    original_price: 430.00,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80",
    features: [
      "wear of carry with large capacity",
      "breathable & waterproof multi compartment design"
    ],
    rating: 4.9,
    reviews: 124,
    vendor: "MegaCarry Official",
    vendor_id: "v1",
    created_at: new Date().toISOString(),
    status: true,
    stock: 25,
    isNew: true,
    is_pro: true,
  },
  {
    id: "pro-spacebuds-2",
    name: "SpaceBuds 2 AI Smart 45hrs Playtime Noise Cancelling Earbuds",
    description: "AI Translation & Voice Prompt • Infinite Light Effect",
    price: 495.00,
    original_price: 550.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    features: [
      "AI Translation & Voice Prompt",
      "Infinite Light Effect"
    ],
    rating: 4.9,
    reviews: 129,
    vendor: "TechHub",
    vendor_id: "v3",
    created_at: new Date().toISOString(),
    status: true,
    stock: 18,
    isNew: true,
    is_pro: true,
  },
  {
    id: "pro-watch4pro-3",
    name: "Watch 4 Pro 1.43\" AMOLED Stainless Steel Smartwatch With Bluetooth Calling",
    description: "Always-On Display • 100+ Sports Modes & Health Monitoring",
    price: 420.00,
    original_price: 480.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80",
    features: [
      "1.43\" Ultra HD AMOLED Display",
      "Wireless Fast Charging & 7-Day Battery"
    ],
    rating: 4.9,
    reviews: 87,
    vendor: "TechHub",
    vendor_id: "v3",
    created_at: new Date().toISOString(),
    status: true,
    stock: 15,
    isNew: true,
    is_pro: true,
  },
  {
    id: "pro-powermax-4",
    name: "PowerMax 20000mAh 22.5W Two-Way Fast Charging Power Bank",
    description: "Digital LED Power Display • Charge 3 Devices Simultaneously",
    price: 180.00,
    original_price: 210.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1609091839311-d5365f9ff1c5?w=600&auto=format&fit=crop&q=80",
    features: [
      "22.5W High-Speed PD & QC 3.0",
      "Flight Approved Heavy Duty Polymer"
    ],
    rating: 4.8,
    reviews: 310,
    vendor: "PowerMax Tech",
    vendor_id: "v1",
    created_at: new Date().toISOString(),
    status: true,
    stock: 30,
    isNew: false,
    is_pro: true,
  },
  {
    id: "pro-ripplestep-5",
    name: "Ripplestep Soft Comfort EVA Slippers Ergonomic Slides",
    description: "breathable & cool • detachable insole soft & comfortable",
    price: 120.00,
    original_price: 135.00,
    category: "Fashion",
    image: "https://images.unsplash.com/photo-1603808033192-082d6919d3e1?w=600&auto=format&fit=crop&q=80",
    features: [
      "breathable & cool",
      "detachable insole soft & comfortable"
    ],
    rating: 4.8,
    reviews: 201,
    vendor: "StyleCo",
    vendor_id: "v4",
    created_at: new Date().toISOString(),
    status: true,
    stock: 40,
    isNew: true,
    is_pro: true,
  },
  {
    id: "pro-campusfan-6",
    name: "CampusPro Foldable Ultra-Quiet Rechargeable Desk & Bed Study Fan",
    description: "4-Speed Wind Adjustment • 4000mAh Battery With Night Light",
    price: 95.00,
    original_price: 115.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1618941716939-553df3c6c278?w=600&auto=format&fit=crop&q=80",
    features: [
      "12-Hour Long Lasting Run Time",
      "Whisper Quiet Brushless Motor"
    ],
    rating: 4.7,
    reviews: 145,
    vendor: "oraimo home",
    vendor_id: "v2",
    created_at: new Date().toISOString(),
    status: true,
    stock: 22,
    isNew: true,
    is_pro: true,
  },
  {
    id: "pro-freshflush-7",
    name: "FreshFlush Antibacterial Odor Eliminator Toilet Cleaner Rim Block",
    description: "60g For Lasting Durability • Dual Color & Dual Action Power",
    price: 40.00,
    original_price: 50.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=600&auto=format&fit=crop&q=80",
    features: [
      "60g For Lasting Durability",
      "Dual Color & Dual Action Power"
    ],
    rating: 4.8,
    reviews: 690,
    vendor: "oraimo home",
    vendor_id: "v2",
    created_at: new Date().toISOString(),
    status: true,
    stock: 50,
    isNew: false,
    is_pro: true,
  },
  {
    id: "pro-thermolock-8",
    name: "ThermoLock 1000ml Double-Wall Vacuum Insulated Stainless Steel Bottle",
    description: "24h Cold & 12h Hot Retention • Leakproof Straw & Chug Lid",
    price: 85.00,
    original_price: 100.00,
    category: "Home",
    image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80",
    features: [
      "18/8 Food Grade Stainless Steel",
      "BPA Free Sweat-Proof Powder Coating"
    ],
    rating: 4.9,
    reviews: 98,
    vendor: "StyleCo",
    vendor_id: "v4",
    created_at: new Date().toISOString(),
    status: true,
    stock: 45,
    isNew: false,
    is_pro: true,
  },
];

/* ─────────────────── Main Featured Showcase Component ─────────────────── */
const FeaturedProducts = () => {
  const cachedProducts = productService.getCachedProducts();

  // Fetch Pro Sellers Products (5-Hour Deterministic Round-Robin Fair Rotation among Subscribed Vendors)
  const { data: dbProSellers = [] } = useQuery({
    queryKey: ["homepage-pro-sellers"],
    queryFn: () => productService.getProSellersRotated(8),
    initialData: DEFAULT_PRO_SELLER_PRODUCTS,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch Best Sellers (Automatically ranked by highest purchases & sales volume)
  const { data: dbBestSellers = [] } = useQuery({
    queryKey: ["homepage-bestsellers"],
    queryFn: () => productService.getBestSellers(12),
    initialData: cachedProducts.length > 0 ? cachedProducts.slice(0, 12) : DEFAULT_SHOWCASE_PRODUCTS,
    staleTime: 1000 * 60 * 5,
  });

  // Fetch New Arrivals (instantly renders in 0ms from cache or showcase defaults)
  const { data: dbNewArrivals = [] } = useQuery({
    queryKey: ["homepage-newarrivals"],
    queryFn: () => productService.getProducts({ sortBy: "created_at", sortOrder: "desc", limit: 12 }),
    initialData: cachedProducts.length > 0 ? cachedProducts.slice(0, 12) : DEFAULT_NEW_ARRIVALS_PRODUCTS,
    staleTime: 1000 * 60 * 5,
  });

  // Use database products if available, otherwise use default exact showcase products
  const proSellers = dbProSellers.length > 0 ? dbProSellers : DEFAULT_PRO_SELLER_PRODUCTS;
  const bestSellers = dbBestSellers.length > 0 ? dbBestSellers : DEFAULT_SHOWCASE_PRODUCTS;
  const newArrivals = dbNewArrivals.length > 0 
    ? [...dbNewArrivals, ...DEFAULT_NEW_ARRIVALS_PRODUCTS] 
    : DEFAULT_NEW_ARRIVALS_PRODUCTS;

  return (
    <section className="py-8 md:py-16 bg-white dark:bg-background">
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
          <ProductSwiperCarousel products={proSellers} badgeType="pro" />
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
