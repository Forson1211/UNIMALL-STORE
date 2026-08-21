import { useState, useRef, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  Star, Zap, ShieldCheck, Truck, Sparkles, ChevronRight, ChevronLeft,
  ArrowRight, Flame, Layers, Radio, Briefcase, Wind,
  Droplets, Clock, Mic, Sun, Feather, Headphones, Package
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";

/* ─────────────────── Helper: Smart Icon Selector for Bullets ─────────────────── */
const getFeatureIcon = (text: string, defaultIdx: number) => {
  const lower = text.toLowerCase();
  if (lower.includes("capacity") || lower.includes("carry") || lower.includes("bag") || lower.includes("pack")) return Briefcase;
  if (lower.includes("breath") || lower.includes("cool") || lower.includes("air") || lower.includes("wind")) return Wind;
  if (lower.includes("water") || lower.includes("liquid") || lower.includes("flush") || lower.includes("drop")) return Droplets;
  if (lower.includes("durab") || lower.includes("time") || lower.includes("hour") || lower.includes("last") || lower.includes("60g")) return Clock;
  if (lower.includes("power") || lower.includes("action") || lower.includes("fast") || lower.includes("charge")) return Zap;
  if (lower.includes("ai") || lower.includes("voice") || lower.includes("mic") || lower.includes("translat") || lower.includes("prompt")) return Mic;
  if (lower.includes("light") || lower.includes("effect") || lower.includes("glow") || lower.includes("sun") || lower.includes("infinite")) return Sun;
  if (lower.includes("soft") || lower.includes("comfort") || lower.includes("insole") || lower.includes("feather") || lower.includes("sole")) return Feather;
  if (lower.includes("layer") || lower.includes("compart") || lower.includes("design") || lower.includes("multi")) return Layers;
  if (lower.includes("bud") || lower.includes("ear") || lower.includes("sound") || lower.includes("audio")) return Headphones;
  return defaultIdx === 0 ? Radio : Layers;
};

/* ─────────────────── Helper: Generate 2 Key Feature Bullet Specs ─────────────────── */
const getProductHighlights = (product: any): { icon: any; text: string }[] => {
  const highlights: { icon: any; text: string }[] = [];

  if (Array.isArray(product.features) && product.features.length > 0) {
    product.features.slice(0, 2).forEach((feat: string, idx: number) => {
      highlights.push({
        icon: getFeatureIcon(feat, idx),
        text: feat,
      });
    });
  } else if (product.description) {
    const lines = product.description
      .split(/\r?\n|•|-|;/)
      .map((s: string) => s.trim())
      .filter((s: string) => s.length > 3 && s.length < 65);

    if (lines.length >= 2) {
      highlights.push({ icon: getFeatureIcon(lines[0], 0), text: lines[0] });
      highlights.push({ icon: getFeatureIcon(lines[1], 1), text: lines[1] });
    } else if (lines.length === 1) {
      highlights.push({ icon: getFeatureIcon(lines[0], 0), text: lines[0] });
      highlights.push({ icon: ShieldCheck, text: "Verified Student Guarantee" });
    }
  }

  if (highlights.length === 0) {
    const cat = (product.category || "").toLowerCase();
    const name = (product.name || "").toLowerCase();

    if (name.includes("carry") || name.includes("bag") || name.includes("backpack")) {
      highlights.push({ icon: Briefcase, text: "wear of carry with large capacity" });
      highlights.push({ icon: Layers, text: "breathable & waterproof multi compartment design" });
    } else if (name.includes("flush") || name.includes("clean") || name.includes("toilet") || cat.includes("home")) {
      highlights.push({ icon: Clock, text: "60g For Lasting Durability" });
      highlights.push({ icon: Zap, text: "Dual Color & Dual Action Power" });
    } else if (name.includes("bud") || name.includes("space") || name.includes("headphone") || name.includes("audio")) {
      highlights.push({ icon: Mic, text: "AI Translation & Voice Prompt" });
      highlights.push({ icon: Sun, text: "Infinite Light Effect" });
    } else if (name.includes("slip") || name.includes("slide") || name.includes("shoe") || name.includes("eva") || name.includes("ripple")) {
      highlights.push({ icon: Wind, text: "breathable & cool" });
      highlights.push({ icon: Feather, text: "detachable insole soft & comfortable" });
    } else if (cat.includes("phone") || cat.includes("tech") || cat.includes("electronic") || cat.includes("comput")) {
      highlights.push({ icon: Zap, text: "High Performance & Tested" });
      highlights.push({ icon: ShieldCheck, text: "Verified Student Warranty" });
    } else if (cat.includes("fashion") || cat.includes("wear")) {
      highlights.push({ icon: Sparkles, text: "Breathable & Ergonomic Comfort" });
      highlights.push({ icon: Layers, text: "Durable All-Day Wear" });
    } else {
      highlights.push({ icon: ShieldCheck, text: "Verified Campus Merchant" });
      highlights.push({ icon: Truck, text: "Instant Campus Pickup & Delivery" });
    }
  } else if (highlights.length === 1) {
    highlights.push({ icon: ShieldCheck, text: "Verified Student Quality Guarantee" });
  }

  return highlights.slice(0, 2);
};

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
    vendor: "Unimall Store",
    vendor_id: "v1",
    created_at: new Date().toISOString(),
    status: true,
    stock: 25,
    isNew: true,
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
    isNew: false, // Card 2 in screenshot has no New Arrival badge
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
];

/* ─────────────────── Exact Reference-Style Product Card ─────────────────── */
export const OraimoProductCard = ({
  product,
  badgeType = "new",
}: {
  product: StorefrontProduct | any;
  badgeType?: "new" | "bestseller" | "deal" | "none";
}) => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const { addItem } = useCart();
  const { toast } = useToast();

  const price = product.price || 0;
  const originalPrice = product.original_price;
  const hasDiscount = Boolean(originalPrice && originalPrice > price);

  const idStr = String(product.id || "");
  const rating = product.rating || (4.7 + ((idStr.charCodeAt(0) || 0) % 3) * 0.1);
  const reviewsCount = product.reviews || (80 + ((idStr.charCodeAt(Math.max(0, idStr.length - 1)) || 0) % 150));
  const highlights = getProductHighlights(product);

  const displayImage = selectedImage || product.image || "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600";

  // Check if variant images or swatches exist
  const variants = product.variants || (product.images && product.images.length > 1 ? product.images.map((img: string) => ({ image: img })) : null);

  // Show "New Arrival" badge if badgeType === 'new' or product.isNew is true
  const showNewBadge = (badgeType === "new" || product.isNew === true) && product.isNew !== false;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: Number(product.price),
      image: displayImage || product.image,
      vendor: product.vendor || "Unimall",
      vendorId: product.vendor_id || "",
    });
    toast({
      title: "Added to Cart",
      description: `${product.name} added to your cart.`,
    });
  };

  return (
    <div className="group flex flex-col justify-between h-full bg-transparent transition-all duration-300 relative">
      <Link to={`/products/${product.id}`} className="block flex-1">
        {/* ── 1. Top Image Box (Clean rounded light-gray container) ── */}
        <div className="relative aspect-square bg-[#F7F8FA] dark:bg-muted/30 rounded-xl sm:rounded-2xl flex items-center justify-center p-3 sm:p-5 overflow-hidden">
          
          {/* Top-Left Pill Badge: "New Arrival" */}
          {showNewBadge && (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-full text-[9.5px] sm:text-[11px] font-bold bg-[#FF5500] text-white shadow-xs tracking-tight">
                New Arrival
              </span>
            </div>
          )}

          {/* Top-Right Variant Thumbnails Stack */}
          {variants && variants.length > 0 && (
            <div 
              className="absolute top-2 right-2 sm:top-3 sm:right-3 z-10 flex flex-col gap-1 sm:gap-1.5"
              onClick={(e) => e.stopPropagation()}
            >
              {variants.slice(0, 3).map((v: any, idx: number) => {
                const imgUrl = typeof v === "string" ? v : v.image;
                const isSelected = selectedImage === imgUrl || (!selectedImage && idx === 0);
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setSelectedImage(imgUrl);
                    }}
                    onMouseEnter={() => setSelectedImage(imgUrl)}
                    className={`w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-white dark:bg-card border ${
                      isSelected ? "border-gray-900 dark:border-white ring-1 ring-black/10" : "border-gray-200 dark:border-border"
                    } shadow-2xs overflow-hidden p-0.5 flex items-center justify-center cursor-pointer transition-all hover:scale-110`}
                    title="Color variant"
                  >
                    {imgUrl ? (
                      <img src={imgUrl} alt="variant" className="w-full h-full object-cover rounded-full" />
                    ) : (
                      <span className="w-full h-full rounded-full" style={{ backgroundColor: v.color || "#333" }} />
                    )}
                  </button>
                );
              })}
            </div>
          )}

          {/* Main Centered Product Image */}
          <div className="w-full h-full flex items-center justify-center">
            <img
              src={displayImage}
              alt={product.name}
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-500"
              loading="lazy"
            />
          </div>

          {/* Bottom-Left Floating Rating Pill: e.g. "4.8 ★ (124)" */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-white dark:bg-card/95 backdrop-blur-xs px-1.5 sm:px-2.5 py-0.5 rounded-md sm:rounded-lg shadow-xs border border-gray-100/60 dark:border-border/60 flex items-center gap-0.5 sm:gap-1">
            <span className="font-bold text-[11px] sm:text-xs text-gray-900 dark:text-white">
              {Number(rating).toFixed(1)}
            </span>
            <Star className="w-2.5 h-2.5 sm:w-3 sm:h-3 fill-amber-400 text-amber-400" />
            <span className="text-gray-400 dark:text-gray-400 text-[10px] sm:text-[11px] font-normal">
              ({reviewsCount})
            </span>
          </div>
        </div>

        {/* ── 2. Product Title (2 lines on mobile, single line / 2 lines formatted cleanly) ── */}
        <h3
          className="font-semibold text-xs sm:text-[13.5px] text-gray-900 dark:text-foreground line-clamp-2 mt-2 sm:mt-3 mb-1.5 sm:mb-2 leading-snug min-h-[32px] sm:min-h-[36px] group-hover:text-[#FF5500] transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* ── 3. Feature Bullet Highlights (2 Lines, No dividing line between bullets) ── */}
        <div className="space-y-1 sm:space-y-1.5 mb-2 sm:mb-2.5">
          {highlights.map((item, idx) => (
            <div key={idx} className="flex items-center gap-1.5">
              <span className="w-3.5 h-3.5 sm:w-4 sm:h-4 rounded-full border border-gray-900 dark:border-gray-100 flex items-center justify-center shrink-0 text-gray-900 dark:text-gray-100">
                <item.icon className="w-2 h-2 sm:w-2.5 sm:h-2.5 stroke-[2.2]" />
              </span>
              <span className="text-[10.5px] sm:text-xs text-gray-800 dark:text-gray-300 font-normal truncate leading-tight">
                {item.text}
              </span>
            </div>
          ))}
        </div>
      </Link>

      {/* ── 4. Subtle Divider & Bottom Row (Price swaps with Learn More & Add to Cart on hover) ── */}
      <div className="pt-1.5 sm:pt-2 border-t border-gray-100 dark:border-border/60 mt-auto relative min-h-[34px] sm:min-h-[38px] flex items-center">
        {/* Default Price Row: Visible normally, smooth fade/slide out on hover */}
        <div className="flex items-baseline gap-1.5 sm:gap-2 w-full transition-all duration-300 ease-out group-hover:opacity-0 group-hover:-translate-y-1.5 group-hover:pointer-events-none">
          <span className="font-bold text-xs sm:text-base text-gray-900 dark:text-white tracking-tight">
            ₵ {Number(price).toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-[10px] sm:text-xs text-gray-400 dark:text-gray-500 line-through font-normal">
              ₵ {Number(originalPrice).toFixed(2)}
            </span>
          )}
        </div>

        {/* Hover Action Buttons: "Learn More" & "Add to Cart" pills appearing dynamically on hover */}
        <div className="absolute inset-x-0 bottom-0 top-1.5 sm:top-2 flex items-center gap-1 sm:gap-2 opacity-0 translate-y-1.5 group-hover:opacity-100 group-hover:translate-y-0 pointer-events-none group-hover:pointer-events-auto transition-all duration-300 ease-out invisible group-hover:visible">
          <Link
            to={`/products/${product.id}`}
            className="flex-1 py-1 sm:py-1.5 px-1.5 sm:px-2 text-center rounded-full border border-black dark:border-white text-black dark:text-white bg-white dark:bg-card hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black text-[10px] sm:text-xs font-semibold transition-all duration-200 truncate"
          >
            Learn More
          </Link>
          <button
            type="button"
            onClick={handleAddToCart}
            className="flex-1 py-1 sm:py-1.5 px-1.5 sm:px-2 text-center rounded-full bg-[#111111] hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white text-[10px] sm:text-xs font-semibold transition-all duration-200 shadow-xs truncate cursor-pointer"
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─────────────────── Top 4 High-Clarity Category Showcase Banners ─────────────────── */
const CATEGORY_SHOWCASE = {
  hero: {
    title: "Audio",
    link: "/products?category=Electronics",
    // Studio-grade headphones, perfectly centered and crisp
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=1400&auto=format&fit=crop&q=85",
  },
  tiles: [
    {
      title: "Power",
      link: "/products?category=Electronics",
      // Modern powerbank & fast charging gear
      image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=800&auto=format&fit=crop&q=85",
    },
    {
      title: "Smart & Office",
      link: "/products?category=Electronics",
      // Premium smartwatch / wearables
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=85",
    },
    {
      title: "Personal Care",
      link: "/products?category=Health+%26+Beauty",
      // Professional grooming clipper / wellness
      image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=800&auto=format&fit=crop&q=85",
    },
  ],
};

const OraimoCategoryBanners = () => {
  return (
    <div className="space-y-3 sm:space-y-4">
      {/* Top Wide Banner: Audio (Sharp Square Edges) */}
      <Link
        to={CATEGORY_SHOWCASE.hero.link}
        className="group relative block w-full h-[150px] sm:h-[200px] md:h-[240px] rounded-none overflow-hidden shadow-xs border border-gray-100 dark:border-border/40 bg-gray-100 dark:bg-muted"
      >
        <img
          src={CATEGORY_SHOWCASE.hero.image}
          alt={CATEGORY_SHOWCASE.hero.title}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
        <span className="absolute top-3.5 left-4 sm:top-5 sm:left-6 z-10 text-sm sm:text-base md:text-lg font-extrabold text-white tracking-wide drop-shadow-md">
          {CATEGORY_SHOWCASE.hero.title}
        </span>
      </Link>

      {/* 3 Prominent Sub-Category Cards Below (Sharp Square Edges) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {CATEGORY_SHOWCASE.tiles.map((tile, idx) => (
          <Link
            key={idx}
            to={tile.link}
            className="group relative block w-full h-[110px] sm:h-[140px] md:h-[165px] rounded-none overflow-hidden shadow-xs border border-gray-100 dark:border-border/40 bg-gray-100 dark:bg-muted"
          >
            <img
              src={tile.image}
              alt={tile.title}
              className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 ease-out"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/20 to-transparent pointer-events-none" />
            <span className="absolute top-3 left-3.5 sm:top-3.5 sm:left-4 z-10 text-xs sm:text-sm md:text-base font-extrabold text-white tracking-wide drop-shadow-md">
              {tile.title}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
};

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
    vendor: "Unimall Store",
    vendor_id: "v-unimall",
    created_at: new Date().toISOString(),
    status: true,
    stock: 25,
    isNew: true,
  },
];

const NewArrivalsSwiper = ({ products }: { products: any[] }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);

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
    <div className="relative group/swiper">
      {/* Left Navigation Arrow */}
      <button
        type="button"
        onClick={() => scroll("left")}
        aria-label="Scroll left"
        disabled={!canScrollLeft}
        className={`absolute -left-2 sm:-left-4 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-xs shadow-md border border-gray-200/80 dark:border-border text-gray-800 dark:text-white flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer`}
      >
        <ChevronLeft className="w-5 h-5 stroke-[2.2]" />
      </button>

      {/* Right Navigation Arrow */}
      <button
        type="button"
        onClick={() => scroll("right")}
        aria-label="Scroll right"
        disabled={!canScrollRight}
        className={`absolute -right-2 sm:-right-4 top-[38%] -translate-y-1/2 z-20 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-white/90 dark:bg-card/90 backdrop-blur-xs shadow-md border border-gray-200/80 dark:border-border text-gray-800 dark:text-white flex items-center justify-center transition-all duration-200 hover:bg-white hover:scale-110 active:scale-95 disabled:opacity-0 disabled:pointer-events-none cursor-pointer`}
      >
        <ChevronRight className="w-5 h-5 stroke-[2.2]" />
      </button>

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
            <OraimoProductCard product={product} badgeType="new" />
          </div>
        ))}
      </div>

      {/* Bottom Pagination Dots with Active Pill */}
      <div className="flex items-center justify-center gap-1.5 sm:gap-2 mt-6">
        {Array.from({ length: totalDots }).map((_, i) => (
          <button
            key={i}
            onClick={() => scrollToDot(i)}
            aria-label={`Go to slide ${i + 1}`}
            className={`h-1 sm:h-1.5 transition-all duration-300 rounded-full ${
              i === activeIndex
                ? "w-5 sm:w-7 bg-[#FF5500]"
                : "w-1.5 sm:w-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

/* ─────────────────── Main Featured Showcase Component ─────────────────── */
const FeaturedProducts = () => {
  // Fetch Best Sellers
  const { data: dbBestSellers = [], isLoading: loadingBestSellers } = useQuery({
    queryKey: ["homepage-bestsellers"],
    queryFn: () => productService.getProducts({ sortBy: "rating", sortOrder: "desc", limit: 8 }),
  });

  // Fetch New Arrivals
  const { data: dbNewArrivals = [], isLoading: loadingNewArrivals } = useQuery({
    queryKey: ["homepage-newarrivals"],
    queryFn: () => productService.getProducts({ sortBy: "created_at", sortOrder: "desc", limit: 12 }),
  });

  // Use database products if available, otherwise use default exact showcase products
  const bestSellers = dbBestSellers.length > 0 ? dbBestSellers : DEFAULT_SHOWCASE_PRODUCTS;
  const newArrivals = dbNewArrivals.length > 0 
    ? [...dbNewArrivals, ...DEFAULT_NEW_ARRIVALS_PRODUCTS] 
    : DEFAULT_NEW_ARRIVALS_PRODUCTS;

  return (
    <section className="py-8 md:py-16 bg-white dark:bg-background">
      <div className="max-w-[1280px] mx-auto px-4 xl:px-0 space-y-10 sm:space-y-14 md:space-y-16">

        {/* ── 0. TOP COMPACT CATEGORY SHOWCASE (AUDIO / POWER / SMART / ETC) ── */}
        <OraimoCategoryBanners />

        {/* ── 1. BEST SELLERS SECTION ── */}
        <div id="best-sellers" className="space-y-5 sm:space-y-6">
          {/* Section Header */}
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3 sm:gap-4 border-b border-gray-100 dark:border-border pb-3">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
                <Flame className="w-3.5 h-3.5 fill-[#FF5500]" />
                Top Campus Picks
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                Best Sellers
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

          {/* Product Grid (2 columns on mobile, 3 on tablet, 4 on desktop) */}
          {loadingBestSellers && dbBestSellers.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white dark:bg-card h-[320px] sm:h-[380px] animate-pulse space-y-3">
                  <div className="aspect-square bg-gray-100 dark:bg-muted rounded-xl sm:rounded-2xl" />
                  <div className="h-4 bg-gray-100 dark:bg-muted rounded w-3/4" />
                  <div className="h-6 bg-gray-100 dark:bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {bestSellers.slice(0, 4).map((product, idx) => (
                <OraimoProductCard 
                  key={product.id || idx} 
                  product={product} 
                  badgeType={idx === 1 ? "none" : "new"} 
                />
              ))}
            </div>
          )}
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
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] text-[11px] sm:text-xs font-bold uppercase tracking-wider mb-1.5">
                <Sparkles className="w-3.5 h-3.5 fill-[#FF5500]" />
                Just Dropped
              </div>
              <h2 className="text-xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                New Arrivals
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
          {loadingNewArrivals && dbNewArrivals.length === 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="bg-white dark:bg-card h-[320px] sm:h-[380px] animate-pulse space-y-3">
                  <div className="aspect-square bg-gray-100 dark:bg-muted rounded-xl sm:rounded-2xl" />
                  <div className="h-4 bg-gray-100 dark:bg-muted rounded w-3/4" />
                  <div className="h-6 bg-gray-100 dark:bg-muted rounded w-full" />
                </div>
              ))}
            </div>
          ) : (
            <NewArrivalsSwiper products={newArrivals} />
          )}
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;
