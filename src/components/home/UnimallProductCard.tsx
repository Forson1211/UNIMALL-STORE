import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Star, Zap, ShieldCheck, Truck, Sparkles,
  Layers, Radio, Briefcase, Wind,
  Droplets, Clock, Mic, Sun, Feather, Headphones
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { StorefrontProduct } from "@/services/productService";
import { UnimallVerifiedBadge } from "@/components/common/UnimallVerifiedBadge";

/* ─────────────────── Helper: Smart Icon Selector for Bullets ─────────────────── */
export const getFeatureIcon = (text: string, defaultIdx: number) => {
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
export const getProductHighlights = (product: any): { icon: any; text: string }[] => {
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

/* ─────────────────── Unimall Reference-Style Product Card ─────────────────── */
export const UnimallProductCard = ({
  product,
  badgeType = "new",
}: {
  product: StorefrontProduct | any;
  badgeType?: "new" | "bestseller" | "pro" | "deal" | "none";
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

  // ── 7-Day Automatic Expiration for "New Arrival" Tag ──
  // Products display "New Arrival" only for 7 days (7 * 24 * 60 * 60 * 1000 ms) after creation.
  const isWithin7Days = (() => {
    if (!product.created_at) {
      return product.isNew === true;
    }
    const createdTime = new Date(product.created_at).getTime();
    if (isNaN(createdTime) || createdTime <= 0) {
      return product.isNew === true;
    }
    const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;
    return (Date.now() - createdTime) <= SEVEN_DAYS_MS;
  })();

  // Show "New Arrival" badge if (badgeType === "new" or product.isNew is true) AND within 7-day window
  const showNewBadge = (badgeType === "new" || product.isNew === true) && product.isNew !== false && isWithin7Days;

  // Check if product belongs to a verified / pro merchant
  const isVerifiedVendor = Boolean(
    product.is_pro || 
    product.vendor_verified || 
    (product.vendor_id && localStorage.getItem(`unimall_vendor_pro_${product.vendor_id}`) === "true") ||
    ["unimall store", "techhub", "styleco", "bookworm", "oraimo home", "studymart"].some((v) => (product.vendor || "").toLowerCase().includes(v))
  );

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
        {/* ── 1. Top Image Box (Clean flat container, no rounded light-gray peeking) ── */}
        <div className="relative aspect-square bg-transparent dark:bg-muted/10 rounded-none flex items-center justify-center overflow-hidden border border-gray-100 dark:border-border/60">
          
          {/* Top-Left Pill Badge: "PRO SELLER" / "BEST SELLER (⚡)" / "New Arrival" */}
          {badgeType === "pro" || (badgeType !== "bestseller" && (product.is_pro || (product.vendor_id && localStorage.getItem(`unimall_vendor_pro_${product.vendor_id}`) === "true"))) ? (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-none text-[9px] sm:text-[10px] font-black bg-gradient-to-r from-amber-500 via-orange-500 to-[#FF5500] text-white shadow-xs tracking-tight">
                <ShieldCheck className="w-3 h-3 fill-white/20 stroke-[2.5]" /> PRO SELLER
              </span>
            </div>
          ) : badgeType === "bestseller" ? (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
              <span className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-0.5 rounded-none text-[9px] sm:text-[10px] font-black bg-[#FF5500] text-white shadow-xs tracking-tight">
                <Zap className="w-3 h-3 fill-white text-white" /> BEST SELLER
              </span>
            </div>
          ) : showNewBadge ? (
            <div className="absolute top-2 left-2 sm:top-3 sm:left-3 z-10">
              <span className="inline-flex items-center px-2 sm:px-2.5 py-0.5 rounded-none text-[9.5px] sm:text-[11px] font-bold bg-[#FF5500] text-white shadow-xs tracking-tight">
                New Arrival
              </span>
            </div>
          ) : null}

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
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 rounded-none"
              loading="lazy"
            />
          </div>

          {/* Bottom-Left Floating Rating Pill */}
          <div className="absolute bottom-2 left-2 sm:bottom-3 sm:left-3 bg-white/95 dark:bg-card/95 backdrop-blur-xs px-1.5 sm:px-2.5 py-0.5 rounded-none shadow-xs border border-gray-100/60 dark:border-border/60 flex items-center gap-0.5 sm:gap-1">
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
          className="font-semibold text-xs sm:text-[13.5px] text-gray-900 dark:text-foreground line-clamp-2 mt-2 sm:mt-2.5 mb-1 leading-snug min-h-[32px] sm:min-h-[36px] group-hover:text-[#FF5500] transition-colors"
          title={product.name}
        >
          {product.name}
        </h3>

        {/* Vendor Row with Verified Badge */}
        <div className="flex items-center gap-1 mb-1.5 text-[11px] text-gray-500 dark:text-gray-400 font-medium">
          <span className="truncate max-w-[130px]">{product.vendor || "Unimall Store"}</span>
          {isVerifiedVendor && (
            <UnimallVerifiedBadge size={13} color="#FF5500" className="inline-block shrink-0" title="Verified Campus Merchant" />
          )}
        </div>

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

export default UnimallProductCard;
