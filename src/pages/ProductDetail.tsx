import { useState, useEffect, useRef } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import {
  Heart, Star, Truck, ShieldCheck, CreditCard, ChevronLeft,
  ChevronRight, Lock, Sparkles, Check, Zap, HelpCircle,
  Share2, ArrowRight, ShoppingCart, Store, MessageCircle,
  Phone, MessageSquare, MapPin, CheckCircle2, X, Send,
  Clock, Award, RotateCcw
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";
import { OraimoProductCard } from "@/components/home/FeaturedProducts";

/* ─────────────────── Fallback Rich Products Catalog ─────────────────── */
const MOCK_PRODUCTS_DATA: Record<string, Partial<StorefrontProduct> & {
  gallery?: string[];
  colors?: { name: string; hex: string; img?: string }[];
  bulletFeatures?: string[];
  ranking?: string;
  vendorCampus?: string;
  vendorPhone?: string;
}> = {
  "power-magpower-1": {
    id: "power-magpower-1",
    name: "oraimo MagPower 15 oraimo MagPower 15 10000mAh Wireless Power Bank",
    description: "Strong Magnetic Attachment • 15W Wireless Fast Charge • Foldable Stand • Wide Compatibility",
    price: 280.00,
    original_price: 310.00,
    category: "Power",
    rating: 4.9,
    reviews: 1393,
    ranking: "TOP Power Best Seller #1",
    vendor: "oraimo Official Ghana",
    vendorCampus: "UG Legon & Nationwide Hubs",
    bulletFeatures: [
      "Strong Magnetic Attachment",
      "15W Wireless Charge",
      "Foldable Stand",
      "Wide Compatibility"
    ],
    colors: [
      { name: "Olive Green", hex: "#7E9070" },
      { name: "Sand Gold", hex: "#F3E3B6" },
      { name: "Obsidian Black", hex: "#1A1A1A" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1609592424368-b8084a4a8cb8?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=900&auto=format&fit=crop&q=85",
    ],
  },
  "prod-megacarry-1": {
    id: "prod-megacarry-1",
    name: "MegaCarry Expandable Waterproof Travel Laptop Backpack",
    description: "wear of carry with large capacity • breathable & waterproof multi compartment design",
    price: 380.00,
    original_price: 430.00,
    category: "Fashion",
    rating: 4.8,
    reviews: 124,
    ranking: "TOP Backpacks #1",
    vendor: "Campus Bags & Trends",
    vendorCampus: "UG Legon - Night Market Hub",
    bulletFeatures: [
      "Wear of carry with large capacity",
      "Breathable & waterproof multi compartment design",
      "Anti-Theft Hidden Zipper Pocket",
      "Padded 16\" Laptop Sleeve"
    ],
    colors: [
      { name: "Classic Black", hex: "#111827" },
      { name: "Charcoal Gray", hex: "#4B5563" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=900&auto=format&fit=crop&q=85",
    ],
  },
  "new-magstand-1": {
    id: "new-magstand-1",
    name: "MagStand 950 950ml Smart Thermo Bottle With Magnetic Lid",
    description: "Magnetic Lid & Phone Mount 180° Adjustable • Grab & Go Portability",
    price: 260.00,
    original_price: 300.00,
    category: "Home",
    rating: 4.8,
    reviews: 5,
    ranking: "TOP Campus Living #1",
    vendor: "oraimo home Official",
    vendorCampus: "KNUST & UG Delivery",
    bulletFeatures: [
      "Magnetic Lid & Phone Mount 180° Adjustable",
      "Grab & Go Portability",
      "24-Hour Hot & Cold Temp Lock",
      "BPA Free Stainless Steel"
    ],
    colors: [
      { name: "Stainless Silver", hex: "#D1D5DB" },
      { name: "Forest Green", hex: "#16A34A" },
      { name: "Matte Black", hex: "#1F2937" },
    ],
    gallery: [
      "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=900&auto=format&fit=crop&q=85"
    ],
  },
};

/* ─────────────────── Dynamic Smart Bullets Generator ─────────────────── */
const getSmartFeatures = (prod: Partial<StorefrontProduct>): string[] => {
  if (prod.features && Array.isArray(prod.features) && prod.features.length > 0) {
    return prod.features;
  }

  const name = (prod.name || "").toLowerCase();
  const cat = (prod.category || "").toLowerCase();

  if (name.includes("bag") || name.includes("backpack") || name.includes("handbag") || name.includes("purse") || name.includes("tote")) {
    return [
      "Premium High-Capacity Compartments",
      "Waterproof & Wear-Resistant Fabric",
      "Comfortable Ergonomic Shoulder Straps",
      "Internal Storage Organization Pockets"
    ];
  }
  if (name.includes("shirt") || name.includes("wear") || name.includes("cloth") || name.includes("hoodie") || name.includes("jacket") || cat.includes("fashion")) {
    return [
      "100% Premium Breathable Cotton Fabric",
      "Vibrant Fade-Resistant HD Print",
      "Ergonomic All-Day Campus Fit",
      "Pre-Shrunk & Machine Wash Safe"
    ];
  }
  if (name.includes("bottle") || name.includes("thermo") || name.includes("flask") || name.includes("cup")) {
    return [
      "180° Adjustable Magnetic Phone Mount",
      "24-Hour Hot & Cold Temperature Lock",
      "Food-Grade BPA-Free Stainless Steel",
      "Grab & Go Ergonomic Handle"
    ];
  }
  if (name.includes("bud") || name.includes("earphone") || name.includes("headphone") || name.includes("audio") || name.includes("sound")) {
    return [
      "AI Noise Cancellation & HD Audio",
      "45-Hour Total Playtime Battery",
      "Ultra-Low Latency Media Mode",
      "IPX5 Sweat & Water Resistance"
    ];
  }
  if (name.includes("slide") || name.includes("slipper") || name.includes("shoe") || name.includes("sandals")) {
    return [
      "Ergonomic High-Elasticity EVA Cushioning",
      "Breathable & Odor-Resistant Footbed",
      "Anti-Slip High Traction Outsole",
      "Lightweight All-Day Campus Comfort"
    ];
  }
  if (name.includes("strap") || name.includes("watch") || name.includes("band")) {
    return [
      "Silicone Geometric Diamond Texture",
      "22mm Quick-Release Universal Pins",
      "Sweatproof & Waterproof Durability",
      "Stainless Steel Secure Clasp"
    ];
  }
  if (name.includes("clipper") || name.includes("shav") || name.includes("hair") || name.includes("trimmer")) {
    return [
      "Heavy Duty 10W High-Speed Motor",
      "Self-Sharpening Stainless Steel Blades",
      "240-Minute Long Cordless Runtime",
      "Complete Multi-Length Guard Comb Kit"
    ];
  }
  if (name.includes("power") || name.includes("charge") || name.includes("bank") || name.includes("plug") || name.includes("adapter") || cat.includes("power")) {
    return [
      "Fast Charge PD / QC Multi-Device Output",
      "Smart Overheat & Surge Protection",
      "Compact & Pocket-Friendly Design",
      "LED Battery Level Status Indicator"
    ];
  }

  return [
    "100% Genuine Quality Guaranteed",
    "Verified Campus Merchant Item",
    "Quick Student Pickup & Delivery",
    "Safe Payment & Refund Protection"
  ];
};

/* ─────────────────── Smart Gallery Multi-Angle Resolver ─────────────────── */
const getProductGallery = (prod: Partial<StorefrontProduct>): string[] => {
  // 1. Direct catalog lookup
  if (prod.id && MOCK_PRODUCTS_DATA[prod.id]?.gallery?.length) {
    return MOCK_PRODUCTS_DATA[prod.id]!.gallery!;
  }

  // 2. If DB provided multiple valid images
  if (prod.images && Array.isArray(prod.images) && prod.images.length > 1) {
    const valid = prod.images.filter((img) => typeof img === "string" && img.startsWith("http"));
    if (valid.length > 1) return valid;
  }

  const primaryImage = prod.image || "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=900&auto=format&fit=crop&q=85";
  const name = (prod.name || "").toLowerCase();
  const cat = (prod.category || "").toLowerCase();

  // 3. Category & Keyword specific matching angles (Never mixed random items!)
  if (name.includes("bottle") || name.includes("thermo") || name.includes("flask") || name.includes("cup")) {
    return [
      primaryImage,
      "https://images.unsplash.com/photo-1544816155-12df9643f363?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1570831739435-6601aa3fa4fb?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1523362628745-0c100150b504?w=900&auto=format&fit=crop&q=85"
    ];
  }
  if (name.includes("bag") || name.includes("backpack") || name.includes("carry") || name.includes("pack") || name.includes("handbag") || name.includes("purse") || name.includes("tote")) {
    return [
      primaryImage,
      "https://images.unsplash.com/photo-1622560480605-d83c853bc5c3?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1581605405669-fcdf81165afa?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1546938576-6e6a64f317cc?w=900&auto=format&fit=crop&q=85"
    ];
  }
  if (name.includes("slide") || name.includes("slipper") || name.includes("shoe") || name.includes("sandals")) {
    return [
      primaryImage,
      "https://images.unsplash.com/photo-1560769629-975ec94e6a86?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1595950653106-6c9ebd614d3a?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=85"
    ];
  }
  if (name.includes("bud") || name.includes("earphone") || name.includes("headphone") || name.includes("audio") || name.includes("sound")) {
    return [
      primaryImage,
      "https://images.unsplash.com/photo-1572536147248-ac59a8abfa4b?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1598331668826-20cecc596b86?w=900&auto=format&fit=crop&q=85"
    ];
  }
  if (name.includes("strap") || name.includes("watch") || name.includes("band")) {
    return [
      primaryImage,
      "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1510017803434-a899398421b3?w=900&auto=format&fit=crop&q=85"
    ];
  }
  if (name.includes("power") || name.includes("charge") || name.includes("bank") || name.includes("plug") || name.includes("adapter") || name.includes("cable") || cat.includes("power")) {
    return [
      primaryImage,
      "https://images.unsplash.com/photo-1609592424368-b8084a4a8cb8?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=900&auto=format&fit=crop&q=85",
      "https://images.unsplash.com/photo-1585338107529-13afc5f02586?w=900&auto=format&fit=crop&q=85"
    ];
  }

  return [primaryImage];
};

/* Fallback "You May Also Like" items matching screenshot */
const DEFAULT_RELATED_PRODUCTS: (StorefrontProduct & { isNew?: boolean })[] = [
  {
    id: "rel-powercube-1",
    name: "PowerCube 201 UK Type Plug 20W Fast Charger Adapter",
    description: "Dual Output USB-C & USB-A Fast Charger",
    price: 55.00,
    original_price: 65.00,
    category: "Power",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    features: ["Dual Fast Charge", "Compact Travel Plug"],
    rating: 4.8,
    reviews: 733,
    vendor: "oraimo power",
    vendor_id: "v-oraimo",
    created_at: new Date().toISOString(),
    status: true,
    stock: 50,
  },
  {
    id: "rel-chilldock-2",
    name: "ChillDock Dual USB Ports Laptop Cooling Stand",
    description: "RGB Dual Fans Silent Ultra Cool Stand",
    price: 215.00,
    original_price: 240.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600&auto=format&fit=crop&q=80",
    features: ["Dual High Speed Fans", "Multi-Angle Elevation"],
    rating: 4.8,
    reviews: 149,
    vendor: "TechGear",
    vendor_id: "v-tech",
    created_at: new Date().toISOString(),
    status: true,
    stock: 20,
  },
  {
    id: "rel-opensnap-3",
    name: "OpenSnap N2 Quick Charging Wireless Earbuds",
    description: "Digital Battery Case ANC Clear Voice",
    price: 260.00,
    original_price: 290.00,
    category: "Electronics",
    image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=600&auto=format&fit=crop&q=80",
    features: ["Active Noise Cancellation", "Digital Display Case"],
    rating: 4.8,
    reviews: 348,
    vendor: "SoundHub",
    vendor_id: "v-sound",
    created_at: new Date().toISOString(),
    status: true,
    stock: 35,
    isNew: true,
  },
  {
    id: "rel-easycut-4",
    name: "EasyCut 2 10W Super Powerful Cordless Hair Clipper",
    description: "Self-Sharpening Blade 240min Battery",
    price: 240.00,
    original_price: 270.00,
    category: "Personal Care",
    image: "https://images.unsplash.com/photo-1621607512214-68297480165e?w=600&auto=format&fit=crop&q=80",
    features: ["10W Heavy Duty Motor", "Multiple Guard Combs"],
    rating: 4.8,
    reviews: 140,
    vendor: "GroomingPro",
    vendor_id: "v-groom",
    created_at: new Date().toISOString(),
    status: true,
    stock: 18,
    isNew: true,
  },
  {
    id: "rel-powerjet-5",
    name: "PowerJet 130 27000mAh Ultra Fast Laptop Power Bank",
    description: "130W Dual USB-C Laptop PD Output",
    price: 640.00,
    original_price: 715.00,
    category: "Power",
    image: "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=600&auto=format&fit=crop&q=80",
    features: ["130W High Power Output", "TFT Smart Display"],
    rating: 4.9,
    reviews: 700,
    vendor: "oraimo power",
    vendor_id: "v-oraimo",
    created_at: new Date().toISOString(),
    status: true,
    stock: 12,
  },
];

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { siteName, whatsappNumber, supportPhone } = useSiteSettingsContext();
  const { addItem } = useCart();
  const { toast } = useToast();

  // 1. Fetch live product from DB
  const { data: dbProduct, isLoading } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id!),
    enabled: !!id,
  });

  // 2. Fetch related products from DB
  const { data: dbRelated = [] } = useQuery({
    queryKey: ["related-products", dbProduct?.category],
    queryFn: () => productService.getProducts({ category: dbProduct?.category, limit: 6 }),
    enabled: !!dbProduct?.category,
  });

  // 3. Resolve active product (DB or rich mock)
  const mockFallback = (id && MOCK_PRODUCTS_DATA[id]) || MOCK_PRODUCTS_DATA["power-magpower-1"];
  
  const product: StorefrontProduct = dbProduct || {
    id: id || "power-magpower-1",
    name: mockFallback?.name || "oraimo MagPower 15 10000mAh Wireless Power Bank",
    description: mockFallback?.description || "Strong Magnetic Attachment • 15W Wireless Charge",
    price: mockFallback?.price || 280.00,
    original_price: mockFallback?.original_price || 310.00,
    category: mockFallback?.category || "Power",
    image: mockFallback?.gallery?.[0] || "https://images.unsplash.com/photo-1583863788434-e58a36330cf0?w=900&auto=format&fit=crop&q=85",
    features: mockFallback?.bulletFeatures,
    rating: mockFallback?.rating || 4.9,
    reviews: mockFallback?.reviews || 1393,
    vendor: mockFallback?.vendor || "Campus Merchant Store",
    vendor_id: "v-store",
    created_at: new Date().toISOString(),
    status: true,
    stock: 50,
  };

  // Resolve matching, relevant gallery for THIS product
  const images = getProductGallery(product);

  // Dynamically resolve matching bullet features & ranking badge
  const bulletFeatures = getSmartFeatures(product);
  const rankingBadge = `TOP ${product.category || "Campus"} Best Seller #1`;

  const colors = mockFallback?.colors || [
    { name: "Olive Green", hex: "#7E9070" },
    { name: "Sand Gold", hex: "#F3E3B6" },
    { name: "Obsidian Black", hex: "#1A1A1A" },
  ];

  const vendorName = product.vendor || "Verified Campus Merchant";
  const vendorCampus = mockFallback?.vendorCampus || "University of Ghana, Legon Campus";
  const vendorPhoneNum = whatsappNumber || supportPhone || "+233241234567";

  const relatedProducts = dbRelated.length > 0 ? dbRelated : DEFAULT_RELATED_PRODUCTS;

  // Local interaction states
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [selectedColorIdx, setSelectedColorIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setSelectedImageIdx(0);
    setQuantity(1);
  }, [id]);

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | ${siteName || "Unimall"}`;
      setInquiryMessage(`Hello, I'm interested in buying "${product.name}" (₵${product.price}). Is this still available?`);
    }
  }, [product, siteName]);

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: images[selectedImageIdx] || product.image,
        vendor: product.vendor,
        vendorId: product.vendor_id,
      });
    }
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    handleAddToCart();
    navigate("/cart");
  };

  const handleSendDirectInquiry = (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerContact.trim()) {
      toast({
        title: "Contact Required",
        description: "Please enter your phone number or WhatsApp so the vendor can reach you.",
        variant: "destructive",
      });
      return;
    }

    // Direct WhatsApp redirect with inquiry pre-filled
    const cleanNum = vendorPhoneNum.replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(
      `Hello ${vendorName}, my name is ${buyerName || "a student"}. ${inquiryMessage}\n(My contact: ${buyerContact})`
    );
    window.open(`https://wa.me/${cleanNum}?text=${waText}`, "_blank");

    toast({
      title: "Message Sent!",
      description: `Inquiry sent to ${vendorName}. They will contact you shortly.`,
    });
    setIsMessageModalOpen(false);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center pb-20">
          <div className="w-10 h-10 border-3 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background pb-16">
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 xl:px-0 py-6 md:py-10">
        
        {/* ═══════════════════ MAIN PRODUCT PREVIEW (PERFECTLY BALANCED 2-COLUMN GRID) ═══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-start">
          
          {/* ── LEFT COLUMN: IMAGE GALLERY + VENDOR CARD + CAMPUS GUARANTEE (BALANCED & COMPLETE) ── */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            
            {/* Main Stage Image Box */}
            <div className="relative aspect-square bg-[#F7F8FA] dark:bg-muted/30 rounded-2xl flex items-center justify-center p-6 sm:p-10 overflow-hidden border border-gray-100 dark:border-border/60">
              <img
                src={images[selectedImageIdx] || product.image}
                alt={product.name}
                className="w-full h-full object-contain transition-all duration-300 hover:scale-105"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = product.image;
                }}
              />
            </div>

            {/* ═══════════════════ VENDOR INFORMATION & CONTACT BOX ═══════════════════ */}
            <div className="rounded-2xl border border-gray-200 dark:border-border bg-[#FBFBFC] dark:bg-card/70 p-4 sm:p-5 space-y-4 shadow-2xs">
              
              {/* Vendor Store Header */}
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="relative w-12 h-12 rounded-xl bg-orange-100 dark:bg-orange-950/60 border border-[#FF5500]/20 flex items-center justify-center text-[#FF5500] font-black text-xl shrink-0">
                    <Store className="w-6 h-6" />
                    <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white dark:border-card" title="Online now" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight">
                        {vendorName}
                      </h3>
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" title="Verified Campus Merchant" />
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                      <span>{vendorCampus}</span>
                    </div>
                  </div>
                </div>

                <Link
                  to={`/vendor/${product.vendor_id || "1"}`}
                  className="text-xs font-bold text-[#FF5500] hover:underline shrink-0 pt-1 flex items-center gap-0.5"
                >
                  <span>Visit Store</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Vendor Badges / Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-200/70 dark:border-border/70 text-center">
                <div className="space-y-0.5">
                  <span className="block font-black text-sm text-gray-900 dark:text-white">
                    4.9 ★
                  </span>
                  <span className="block text-[10px] text-gray-500 font-medium">
                    Store Rating
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block font-black text-sm text-emerald-600">
                    ~15 mins
                  </span>
                  <span className="block text-[10px] text-gray-500 font-medium">
                    Fast Reply
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block font-black text-sm text-gray-900 dark:text-white">
                    100% Safe
                  </span>
                  <span className="block text-[10px] text-gray-500 font-medium">
                    Verified Trader
                  </span>
                </div>
              </div>

              {/* Contact Actions Row (WhatsApp & Instant Message) */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {/* WhatsApp Chat Button */}
                <a
                  href={`https://wa.me/${vendorPhoneNum.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${vendorName}, I am interested in "${product.name}" (₵${product.price}) on Unimall. Is it available for campus delivery?`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs"
                >
                  <MessageCircle className="w-4 h-4 fill-white" />
                  <span>Chat on WhatsApp</span>
                </a>

                {/* In-App Direct Message Modal Trigger */}
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(true)}
                  className="py-3 px-3 rounded-xl bg-white dark:bg-card border border-gray-300 dark:border-border hover:bg-gray-50 text-gray-900 dark:text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
                >
                  <MessageSquare className="w-4 h-4 text-[#FF5500]" />
                  <span>Send Message</span>
                </button>
              </div>

            </div>

            {/* ═══════════════════ CAMPUS DELIVERY & PROTECTION BANNER ═══════════════════ */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card/40 flex items-start gap-2.5">
                <Truck className="w-5 h-5 text-[#FF5500] shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-gray-900 dark:text-white block">
                    Campus Delivery
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight block">
                    Fast hostel, hall, & classroom drop-off
                  </span>
                </div>
              </div>

              <div className="p-3.5 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-card/40 flex items-start gap-2.5">
                <RotateCcw className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="space-y-0.5">
                  <span className="font-bold text-xs text-gray-900 dark:text-white block">
                    Buyer Protection
                  </span>
                  <span className="text-[11px] text-gray-500 leading-tight block">
                    Full student refund if item not as described
                  </span>
                </div>
              </div>
            </div>

          </div>

          {/* ── RIGHT COLUMN: SPECIFICATION & PURCHASE CONTROLS ── */}
          <div className="lg:col-span-6 space-y-5 sm:space-y-6">
            
            {/* Product Title & Wishlist Heart */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={() => setIsWishlisted(!isWishlisted)}
                aria-label="Add to wishlist"
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isWishlisted 
                    ? "text-red-500 bg-red-50 dark:bg-red-950/30" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-muted"
                }`}
              >
                <Heart className={`w-6 h-6 stroke-[1.8] ${isWishlisted ? "fill-red-500" : ""}`} />
              </button>
            </div>

            {/* Rating Stars & Review Count */}
            <div className="flex items-center gap-2 text-xs sm:text-sm">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                ({product.reviews || 1393})
              </span>
              <span className="text-gray-300 dark:text-gray-700">•</span>
              <button
                type="button"
                className="text-xs font-semibold text-gray-700 dark:text-gray-300 hover:text-[#FF5500] hover:underline cursor-pointer"
              >
                Add your review &gt;
              </button>
            </div>

            {/* Ranking Pill Badge */}
            <div>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-sm bg-orange-50 dark:bg-orange-950/40 border border-orange-200/60 dark:border-orange-900/50 text-[#FF5500] text-[11px] font-bold uppercase tracking-wider">
                <span className="text-[10px] bg-[#FF5500] text-white px-1 py-0.2 rounded-2xs font-extrabold">TOP</span>
                {rankingBadge} &gt;
              </span>
            </div>

            {/* Price Display */}
            <div className="flex items-baseline gap-3 pt-1">
              <span className="text-3xl sm:text-4xl font-extrabold text-gray-900 dark:text-white tracking-tight">
                ₵ {Number(product.price).toFixed(2)}
              </span>
              {product.original_price && product.original_price > product.price && (
                <span className="text-base sm:text-lg text-gray-400 dark:text-gray-500 line-through font-normal">
                  ₵ {Number(product.original_price).toFixed(2)}
                </span>
              )}
            </div>

            {/* Feature Highlights List with Circular Black Icons */}
            <div className="border-y border-gray-100 dark:border-border/60 py-3.5 space-y-3">
              {bulletFeatures.map((feat, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="w-5 h-5 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center shrink-0">
                    <Zap className="w-2.5 h-2.5 fill-current stroke-[2]" />
                  </div>
                  <span className="text-xs sm:text-sm font-medium text-gray-800 dark:text-gray-200">
                    {feat}
                  </span>
                </div>
              ))}
            </div>

            {/* ── Sub-Previews & Variant Swatch Selector ── */}
            {images && images.length > 0 && (
              <div className="space-y-2 pt-1">
                <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white block">
                  Variant / Preview:{" "}
                  <span className="font-medium text-gray-500 ml-1">
                    Option {selectedImageIdx + 1} of {images.length}
                  </span>
                </span>
                <div className="flex items-center gap-2.5 flex-wrap">
                  {images.map((imgUrl, idx) => {
                    const isSelected = selectedImageIdx === idx;
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setSelectedImageIdx(idx)}
                        onMouseEnter={() => setSelectedImageIdx(idx)}
                        className={`relative w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#F7F8FA] dark:bg-muted/30 overflow-hidden p-0.5 transition-all cursor-pointer ${
                          isSelected
                            ? "border-2 border-black dark:border-white ring-2 ring-black/10 scale-105 shadow-xs"
                            : "border border-gray-200 dark:border-border/80 hover:border-gray-400 opacity-80 hover:opacity-100 hover:scale-105"
                        }`}
                        title={`Preview ${idx + 1}`}
                      >
                        <img
                          src={imgUrl}
                          alt={`Variant ${idx + 1}`}
                          className="w-full h-full object-contain rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = product.image;
                          }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quantity Selector */}
            <div className="space-y-2 pt-1">
              <span className="text-xs sm:text-sm font-bold text-gray-900 dark:text-white block">
                Qty
              </span>
              <div className="inline-flex items-center border border-gray-200 dark:border-border bg-[#F7F8FA] dark:bg-card rounded-none h-10 px-2">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  disabled={quantity <= 1}
                  className="w-8 h-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-black disabled:opacity-30 cursor-pointer font-bold"
                >
                  &lt;
                </button>
                <span className="w-10 text-center font-bold text-sm text-gray-900 dark:text-white">
                  {quantity}
                </span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.min(product.stock || 99, q + 1))}
                  disabled={quantity >= (product.stock || 99)}
                  className="w-8 h-full flex items-center justify-center text-gray-600 dark:text-gray-300 hover:text-black disabled:opacity-30 cursor-pointer font-bold"
                >
                  &gt;
                </button>
              </div>
            </div>

            {/* Desktop Action Buttons: Add to Cart & Buy It Now */}
            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleAddToCart}
                className="flex-1 py-3.5 px-6 rounded-full border-2 border-black dark:border-white bg-white dark:bg-card text-black dark:text-white hover:bg-black hover:text-white dark:hover:bg-white dark:hover:text-black font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-xs cursor-pointer text-center"
              >
                Add to Cart
              </button>
              <button
                type="button"
                onClick={handleBuyNow}
                className="flex-1 py-3.5 px-6 rounded-full bg-black hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 text-white font-extrabold text-xs sm:text-sm uppercase tracking-wider transition-all duration-200 shadow-xs cursor-pointer text-center"
              >
                Buy It Now
              </button>
            </div>

            {/* Trust & Safety 3-Column Strip */}
            <div className="grid grid-cols-3 border border-gray-200/80 dark:border-border/80 rounded-none divide-x divide-gray-200/80 dark:divide-border/80 bg-[#FAFAFA] dark:bg-card/50 py-3 text-center text-gray-600 dark:text-gray-300">
              <div className="flex flex-col items-center justify-center gap-1 px-2">
                <CreditCard className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-[10px] sm:text-[11px] font-medium leading-tight">
                  Payment Safety <HelpCircle className="w-2.5 h-2.5 inline opacity-60" />
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 px-2">
                <Truck className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-[10px] sm:text-[11px] font-medium leading-tight">
                  Secure Logistics <HelpCircle className="w-2.5 h-2.5 inline opacity-60" />
                </span>
              </div>
              <div className="flex flex-col items-center justify-center gap-1 px-2">
                <ShieldCheck className="w-4 h-4 text-gray-700 dark:text-gray-300" />
                <span className="text-[10px] sm:text-[11px] font-medium leading-tight">
                  Privacy Protection <HelpCircle className="w-2.5 h-2.5 inline opacity-60" />
                </span>
              </div>
            </div>

          </div>

        </div>

        {/* ═══════════════════ PART 2: YOU MAY ALSO LIKE ═══════════════════ */}
        <div className="mt-16 sm:mt-24 space-y-6 pt-10 border-t border-gray-100 dark:border-border">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            You May Also Like
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {relatedProducts.slice(0, 5).map((item, idx) => (
              <OraimoProductCard
                key={item.id || idx}
                product={item}
                badgeType={idx % 2 === 0 ? "new" : "none"}
              />
            ))}
          </div>
        </div>

      </main>

      {/* ═══════════════════ IN-APP MESSAGE / INQUIRY MODAL ═══════════════════ */}
      {isMessageModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-card border border-gray-200 dark:border-border rounded-2xl max-w-md w-full p-6 space-y-5 shadow-2xl animate-in fade-in zoom-in-95 duration-200">
            
            {/* Modal Header */}
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-border">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-lg bg-orange-100 dark:bg-orange-950/60 text-[#FF5500] flex items-center justify-center">
                  <Store className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-extrabold text-base text-gray-900 dark:text-white">
                    Contact {vendorName}
                  </h3>
                  <p className="text-xs text-gray-500 truncate max-w-[240px]">
                    Product Inquiry: {product.name}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsMessageModalOpen(false)}
                className="text-gray-400 hover:text-gray-700 dark:hover:text-white p-1 rounded-full hover:bg-gray-100 dark:hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSendDirectInquiry} className="space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Your Full Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kwesi Mensah"
                  value={buyerName}
                  onChange={(e) => setBuyerName(e.target.value)}
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-border bg-[#F9FAFB] dark:bg-muted text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF5500]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Your Phone / WhatsApp Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 024 123 4567"
                  value={buyerContact}
                  onChange={(e) => setBuyerContact(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-lg border border-gray-200 dark:border-border bg-[#F9FAFB] dark:bg-muted text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF5500]"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                  Inquiry Message
                </label>
                <textarea
                  rows={3}
                  value={inquiryMessage}
                  onChange={(e) => setInquiryMessage(e.target.value)}
                  className="w-full p-3 rounded-lg border border-gray-200 dark:border-border bg-[#F9FAFB] dark:bg-muted text-sm focus:outline-hidden focus:ring-2 focus:ring-[#FF5500] resize-none"
                />
              </div>

              <div className="pt-2 flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsMessageModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-gray-300 dark:border-border text-gray-700 dark:text-gray-300 font-bold text-xs hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 rounded-xl bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Send Message</span>
                </button>
              </div>
            </form>

          </div>
        </div>
      )}

      {/* ═══════════════════ FIXED MOBILE BOTTOM ACTION BAR ═══════════════════ */}
      <div className="lg:hidden fixed bottom-0 inset-x-0 bg-white/95 dark:bg-card/95 backdrop-blur-md border-t border-gray-200 dark:border-border p-3 z-40 flex items-center gap-2 shadow-lg">
        <button
          type="button"
          onClick={handleAddToCart}
          className="flex-1 py-3 px-3 rounded-full border border-black dark:border-white bg-white dark:bg-card text-black dark:text-white font-bold text-xs uppercase tracking-wider shadow-xs"
        >
          Add to Cart
        </button>
        <button
          type="button"
          onClick={handleBuyNow}
          className="flex-1 py-3 px-3 rounded-full bg-black text-white dark:bg-white dark:text-black font-bold text-xs uppercase tracking-wider shadow-xs"
        >
          Buy It Now
        </button>
      </div>

      <Footer />
    </div>
  );
};

export default ProductDetail;
