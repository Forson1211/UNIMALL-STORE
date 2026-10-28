import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import {
  Heart, Star, Truck, ShieldCheck, CreditCard, ChevronLeft,
  ChevronRight, Lock, Sparkles, Check, Zap, HelpCircle,
  Share2, ArrowRight, ShoppingCart, Store, MessageCircle,
  Phone, MessageSquare, MapPin, CheckCircle2, X, Send,
  Clock, Award, RotateCcw, ArrowLeft
} from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useWishlist } from "@/hooks/useWishlist";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { productService, StorefrontProduct } from "@/services/productService";
import { UnimallProductCard } from "@/components/home/UnimallProductCard";
import { UnimallVerifiedBadge } from "@/components/common/UnimallVerifiedBadge";
import { Users, User, ThumbsUp, PenSquare } from "lucide-react";

import { REAL_VENDOR_PRODUCTS } from "@/data/realVendorProducts";

/* ─────────────────── Fallback Real Products Catalog ─────────────────── */
const MOCK_PRODUCTS_DATA: Record<string, Partial<StorefrontProduct> & {
  gallery?: string[];
  colors?: { name: string; hex: string; img?: string }[];
  bulletFeatures?: string[];
  ranking?: string;
  vendorCampus?: string;
  vendorPhone?: string;
}> = REAL_VENDOR_PRODUCTS.reduce((acc, p) => {
  acc[p.id] = {
    ...p,
    ranking: `TOP ${p.category} #1`,
    vendorCampus: "UG Legon & Nationwide Delivery",
    gallery: p.image ? [p.image] : [],
    bulletFeatures: p.features || [],
  };
  return acc;
}, {} as Record<string, any>);

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

  // 2. If DB provided multiple valid images or gallery array
  const rawList = (prod.images && Array.isArray(prod.images) && prod.images.length > 0) 
    ? prod.images 
    : ((prod as any).gallery && Array.isArray((prod as any).gallery) && (prod as any).gallery.length > 0)
      ? (prod as any).gallery
      : [];

  if (rawList.length > 0) {
    const valid = rawList.filter((img: any) => typeof img === "string" && (img.startsWith("http") || img.startsWith("data:image")));
    if (valid.length > 0) return valid;
  }

  const primaryImage = prod.image_url || prod.image || (Array.isArray(prod.images) && prod.images.length > 0 ? prod.images[0] : "") || "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=900&auto=format&fit=crop&q=85";
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

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { siteName, whatsappNumber, supportPhone } = useSiteSettingsContext();
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();

  // 1. Fetch live product from DB with instant cache pre-hydration
  const cachedProds = useMemo(() => productService.getCachedProducts(), []);
  const cachedCurrentProduct = useMemo(() => {
    if (!id) return null;
    try {
      const activeRaw = sessionStorage.getItem(`unimall_active_product_${id}`);
      if (activeRaw) return JSON.parse(activeRaw);
    } catch (e) {}

    const targetId = String(id).trim().toLowerCase();
    return cachedProds.find((p: any) => {
      const pid = String(p.id || p.product_id || "").trim().toLowerCase();
      return pid === targetId;
    }) || null;
  }, [id, cachedProds]);

  const { data: dbProduct, isLoading: isLoadingProduct } = useQuery({
    queryKey: ["product", id],
    staleTime: 0, refetchOnMount: "always", refetchInterval: 15000,
    queryFn: () => productService.getProductById(id!),
    initialData: cachedCurrentProduct || undefined,
    enabled: !!id,
  });

  // 3. Resolve active product

  
  const product: StorefrontProduct = dbProduct || {
    id: id || "item",
    name: "Loading Product...",
    description: "",
    price: 0,
    original_price: null,
    category: "General",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    features: [],
    rating: 0,
    reviews: 0,
    vendor: "Campus Merchant",
    vendor_id: "v-store",
    created_at: new Date().toISOString(),
    status: true,
    stock: 0,
  };

  // 2. Fetch related products from DB & synchronous real products cache (NO dummy items)
  const cachedRelatedProducts = useMemo(() => {
    if (!cachedProds || cachedProds.length === 0) return [];
    const filtered = cachedProds.filter((p: any) => String(p.id || p.product_id) !== String(id));
    const sameCat = filtered.filter((p: any) => !product.category || p.category?.toLowerCase() === product.category?.toLowerCase());
    return (sameCat.length > 0 ? sameCat : filtered).slice(0, 5);
  }, [cachedProds, id, product.category]);

  const { data: dbRelated = cachedRelatedProducts } = useQuery({
    queryKey: ["related-products", product.category, id],
    queryFn: async () => {
      const prods = await productService.getProducts({ category: product.category, limit: 8 });
      const filtered = prods.filter((p: any) => String(p.id || p.product_id) !== String(id));
      return filtered.length > 0 ? filtered.slice(0, 5) : [];
    },
    initialData: cachedRelatedProducts.length > 0 ? cachedRelatedProducts : undefined,
    enabled: true,
  });

  const relatedProducts = (dbRelated && dbRelated.length > 0) ? dbRelated : cachedRelatedProducts;

  // 4. Fetch REAL vendor profile who owns this product
  const vendorId = product.vendor_id || (product as any).vendorId;
  const { data: dbVendorProfile, refetch: refreshVendor } = useQuery({
    queryKey: ["product-vendor-profile", vendorId, product.vendor, user?.id],
    staleTime: 0, refetchInterval: 15000,
    queryFn: async () => {
      if (!vendorId && !product.vendor) return null;
      let query = (api as any).from("public_vendor_directory").select("*");
      query = vendorId ? query.eq("id", vendorId) : query.eq("name", product.vendor);
      const { data, error } = await query.maybeSingle();
      if (error) throw error;
      return data ? { ...data, user_id: data.id, store_name: data.name, verified: data.verified === true } : null;
    },
    enabled: !!vendorId || !!product.vendor,
  });

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
  const rawVendorName = dbVendorProfile?.store_name || dbVendorProfile?.full_name || product.vendor || "";
  const cleanVendorName = (!rawVendorName || isUUID(rawVendorName) || rawVendorName === "Store") ? "Campus Merchant" : rawVendorName;

  const vendorData = {
    id: vendorId || dbVendorProfile?.user_id || dbVendorProfile?.id || cleanVendorName,
    name: cleanVendorName,
    campus: dbVendorProfile?.campus || "University campus",
    avatar_url: dbVendorProfile?.avatar_url || "",
    phone: dbVendorProfile?.phone || "",
    is_pro: dbVendorProfile?.verified === true,
  };

  const vendorPhoneDigits = vendorData.phone.replace(/[^0-9]/g, "");
  const vendorWhatsApp = vendorPhoneDigits.startsWith("0") ? `233${vendorPhoneDigits.slice(1)}` : vendorPhoneDigits;

  const isFollowingVendor = dbVendorProfile?.is_following === true;
  const vendorFollowersCount = Number(dbVendorProfile?.followers || 0);
  const [followingBusy, setFollowingBusy] = useState(false);
  const handleToggleFollowVendor = async () => {
    if (!user) { navigate('/login', { state: { from: { pathname: '/products/' + product.id } } }); return; }
    if (followingBusy || !dbVendorProfile?.id) return;
    setFollowingBusy(true);
    const query = api.from('vendor_follows');
    const { error } = await (isFollowingVendor ? query.delete().eq('vendor_id', dbVendorProfile.id).eq('user_id', user.id) : query.insert({ vendor_id: dbVendorProfile.id }));
    if (error) toast({ title: 'Could not update followed stores', description: error.message, variant: 'destructive' });
    else { await refreshVendor(); toast({ title: isFollowingVendor ? 'Store unfollowed' : 'Store followed' }); }
    setFollowingBusy(false);
  };

  // 6. Live Interactive Reviews System
  const { data: dbReviews = [], refetch: refetchReviews } = useQuery<any[]>({
    queryKey: ["product-reviews", product.id],
    staleTime: 0, refetchInterval: 15000,
    queryFn: async () => {
      if (!product.id) return [];
    const { data, error } = await (api as any).from("reviews")
        .select("*").eq("product_id", product.id).eq("status", "approved")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!product.id,
  });

  const liveReviewsCount = dbReviews.length;
  const liveAvgRating = liveReviewsCount > 0
    ? (dbReviews.reduce((sum: number, r: any) => sum + Number(r.rating || 5), 0) / liveReviewsCount).toFixed(1)
    : (product.rating ? Number(product.rating).toFixed(1) : "5.0");

  // Review Form State (inline, no modal)
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reviewComment.trim()) {
      toast({
        title: "Review Comment Required",
        description: "Please share your experience with this item.",
        variant: "destructive",
      });
      return;
    }

    if (!user) { navigate("/login", { state: { from: { pathname: "/products/" + product.id } } }); return; }
    if (isSubmittingReview) return;
    setIsSubmittingReview(true);
    try {
      const { error } = await api.from("reviews").insert({
        product_id: product.id, user_id: user.id, rating: reviewRating,
        comment: reviewComment.trim(), status: "pending",
      });
      if (error) throw error;
      setIsReviewOpen(false); setReviewComment(""); setReviewRating(5);
      await refetchReviews();
      toast({ title: "Review submitted", description: "Your review will appear after moderation." });
    } catch (error) {
      toast({ title: "Unable to submit review", description: (error as Error).message, variant: "destructive" });
    } finally { setIsSubmittingReview(false); }
  };

  const [reviewStarFilter, setReviewStarFilter] = useState<string>('all');
  const [reviewSort, setReviewSort] = useState<'newest' | 'highest'>('newest');

  const handleShareReview = (rev: any) => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Link Copied!",
        description: "Review URL copied to clipboard.",
      });
    }
  };

  const filteredAndSortedReviews = useMemo(() => {
    let list = [...dbReviews];

    if (reviewStarFilter !== "all") {
      const starNum = Number(reviewStarFilter);
      list = list.filter((r) => Math.round(Number(r.rating || 5)) === starNum);
    }

    if (reviewSort === "highest") {
      list.sort((a, b) => Number(b.rating || 5) - Number(a.rating || 5));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return list;
  }, [dbReviews, reviewStarFilter, reviewSort]);

  // Resolve matching, relevant gallery for THIS product
  const images = getProductGallery(product);

  // Dynamically resolve matching bullet features & ranking badge
  const bulletFeatures = getSmartFeatures(product);
  const rankingBadge = product.category || "Campus marketplace";

  // Local interaction states
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const { isSaved, setSaved, isSaving: isSavingWishlist } = useWishlist();
  const isWishlisted = isSaved(product.id);
  const toggleWishlist = async () => {
    if (!user) { navigate("/login", { state: { from: { pathname: `/products/${product.id}` } } }); return; }
    try {
      await setSaved(product.id, !isWishlisted);
      toast({ title: isWishlisted ? "Removed from wishlist" : "Saved to wishlist" });
    } catch (error) { toast({ title: "Unable to update wishlist", description: (error as Error).message, variant: "destructive" }); }
  };
  const [isMessageModalOpen, setIsMessageModalOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerContact, setBuyerContact] = useState("");
  const [inquiryMessage, setInquiryMessage] = useState("");

  useEffect(() => {
    window.scrollTo(0, 0);
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
    if (product.stock <= 0 || quantity > product.stock) { toast({ title: "Insufficient stock", description: "Choose an available quantity.", variant: "destructive" }); return false; }
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: images[selectedImageIdx] || product.image,
        vendor: vendorData.name,
        vendorId: vendorData.id,
      });
    }
    toast({
      title: "Added to Cart",
      description: `${quantity}x ${product.name} added to your cart.`,
    });
  };

  const handleBuyNow = () => {
    if (handleAddToCart() === false) return;
    navigate("/checkout");
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

    if (!vendorWhatsApp) {
      toast({ title: "Seller contact unavailable", description: "This store has not provided a contact number.", variant: "destructive" });
      return;
    }
    const cleanNum = vendorWhatsApp;
    const waText = encodeURIComponent(
      `Hello ${vendorData.name}, my name is ${buyerName || "a student"}. ${inquiryMessage}\n(My contact: ${buyerContact})`
    );
    window.open(`https://wa.me/${cleanNum}?text=${waText}`, "_blank");

    toast({
      title: "WhatsApp opened",
      description: "Send your prepared message in WhatsApp to contact the seller.",
    });
    setIsMessageModalOpen(false);
  };

  if (!dbProduct) {
    return <div className="min-h-screen bg-background"><Navbar /><main className="container mx-auto px-4 py-24 text-center"><h1 className="text-2xl font-bold mb-4">{isLoadingProduct ? "Loading product..." : "Product unavailable"}</h1><p className="text-muted-foreground mb-6">{isLoadingProduct ? "Please wait while we load this product." : "This product may have been removed or is no longer available."}</p><Link to="/products" className="text-primary underline">Browse products</Link></main><Footer /></div>;
  }

  return (
    <div className="min-h-screen bg-white dark:bg-background pb-16">
      <Navbar />

      <main className="max-w-[1280px] mx-auto px-4 xl:px-0 py-4 sm:py-6 md:py-8">
        
        {/* Back Navigation Button */}
        <div className="mb-3 sm:mb-4">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-extrabold text-gray-600 dark:text-gray-300 hover:text-[#FF5500] dark:hover:text-[#FF5500] transition-colors group cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
            <span>Back</span>
          </button>
        </div>

        {/* ═══════════════════ MAIN PRODUCT PREVIEW (3-COLUMN STAGE: IMAGE | SPECS | REVIEWS) ═══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 items-start">
          
          {/* ── LEFT COLUMN: IMAGE GALLERY + VENDOR CARD + CAMPUS GUARANTEE ── */}
          <div className="lg:col-span-5 space-y-5">
            
            {/* Main Stage Image Box */}
            <div className="relative aspect-square bg-transparent dark:bg-muted/10 rounded-none flex items-center justify-center p-4 sm:p-6 overflow-hidden border border-gray-100 dark:border-border/60">
              <img
                src={images[selectedImageIdx] || product.image}
                alt={product.name}
                className="w-full h-full object-contain transition-all duration-300 hover:scale-105 rounded-none"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = product.image;
                }}
              />
            </div>

            {/* ═══════════════════ VENDOR INFORMATION & CONTACT BOX ═══════════════════ */}
            <div className="rounded-2xl border border-gray-200 dark:border-border bg-[#FBFBFC] dark:bg-card/70 p-4 sm:p-5 space-y-4 shadow-2xs">
              
              {/* Vendor Store Header */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between gap-2.5">
                  {/* Left: Avatar + Store Name */}
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    <div className="relative w-11 h-11 sm:w-12 sm:h-12 shrink-0">
                      <div className="w-full h-full rounded-full bg-orange-100 dark:bg-orange-950/60 border border-[#FF5500]/20 overflow-hidden flex items-center justify-center text-[#FF5500] font-black text-xl">
                        {vendorData.avatar_url ? (
                          <img src={vendorData.avatar_url} alt={vendorData.name} className="w-full h-full object-cover" />
                        ) : (
                          <Store className="w-6 h-6" />
                        )}
                      </div>
                      <span
                        className="absolute bottom-0 right-0 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white dark:border-card shadow-xs"
                        title="Online now"
                      />
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <h3 className="font-extrabold text-base text-gray-900 dark:text-white leading-tight truncate">
                          {vendorData.name}
                        </h3>
                        {vendorData.is_pro && (
                          <UnimallVerifiedBadge size={16} color="#FF5500" title="Verified Pro Merchant" className="shrink-0" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Follow Button & Visit Store Link */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleToggleFollowVendor}
                      disabled={followingBusy || user?.id === vendorData.id}
                      className={`px-2.5 sm:px-3 py-1.5 rounded-md text-xs font-black transition-all flex items-center gap-1 shadow-2xs cursor-pointer ${
                        isFollowingVendor
                          ? "bg-white dark:bg-card text-gray-900 dark:text-white border border-gray-300 dark:border-border"
                          : "bg-[#FF5500] hover:bg-[#e54a00] text-white"
                      }`}
                    >
                      <Heart className={`w-3 h-3 ${isFollowingVendor ? "fill-red-500 text-red-500" : ""}`} />
                      <span>{isFollowingVendor ? `Following (${vendorFollowersCount})` : `Follow (${vendorFollowersCount})`}</span>
                    </button>

                    <Link
                      to={`/vendor/${vendorData.id}`}
                      className="text-xs font-bold text-gray-700 dark:text-gray-200 hover:text-[#FF5500] px-2 sm:px-2.5 py-1.5 border border-gray-200 dark:border-border rounded-md bg-white dark:bg-card flex items-center gap-0.5 transition-colors shrink-0"
                    >
                      <span>Store</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                </div>

                {/* Sub-row: Full-Width Location and Followers Badges (Never Squished on Mobile) */}
                <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 dark:text-gray-300 pt-1 border-t border-gray-100 dark:border-border/60 flex-wrap font-medium">
                  <span className="flex items-center gap-1 whitespace-nowrap">
                    <MapPin className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />
                    <span className="truncate max-w-[180px] sm:max-w-none">{vendorData.campus}</span>
                  </span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <span className="flex items-center gap-1 font-semibold text-blue-600 dark:text-blue-400 whitespace-nowrap">
                    <Users className="w-3.5 h-3.5 shrink-0" />
                    <span>{vendorFollowersCount} {vendorFollowersCount === 1 ? "Follower" : "Followers"}</span>
                  </span>
                  <span className="text-gray-300 dark:text-gray-700">•</span>
                  <span className="flex items-center gap-1 font-semibold text-amber-600 dark:text-amber-400 whitespace-nowrap">
                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400 shrink-0" />
                    <span>5.0 Store Rating</span>
                  </span>
                </div>
              </div>

              {/* Vendor Badges / Metrics */}
              <div className="grid grid-cols-3 gap-2 py-2.5 border-y border-gray-200/70 dark:border-border/70 text-center">
                <div className="space-y-0.5">
                  <span className="block font-black text-sm text-gray-900 dark:text-white">
                    5.0 ★
                  </span>
                  <span className="block text-[10px] text-gray-500 font-medium">
                    Store Rating
                  </span>
                </div>
                <div className="space-y-0.5">
                  <span className="block font-black text-sm text-emerald-600">
                    ~10 mins
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
                    {vendorData.is_pro ? "Verified Trader" : "Campus seller"}
                  </span>
                </div>
              </div>

              {/* Contact Actions Row (WhatsApp & Instant Message) */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {/* WhatsApp Chat Button */}
                <a
                  aria-disabled={!vendorWhatsApp}
                  onClick={event => { if (!vendorWhatsApp) event.preventDefault(); }}
                  href={vendorWhatsApp ? `https://wa.me/${vendorWhatsApp}?text=${encodeURIComponent(`Hello ${vendorData.name}, I am interested in "${product.name}" (₵${product.price}) on Unimall. Is it available for campus delivery?`)}` : undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="py-3 px-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-bold text-xs sm:text-sm flex items-center justify-center gap-2 transition-all shadow-2xs cursor-pointer"
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

          {/* ── MIDDLE COLUMN: SPECIFICATION & PURCHASE CONTROLS ── */}
          <div className="lg:col-span-4 space-y-4 sm:space-y-5">
            
            {/* Product Title & Wishlist Heart */}
            <div className="flex items-start justify-between gap-4">
              <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight leading-tight">
                {product.name}
              </h1>
              <button
                type="button"
                onClick={toggleWishlist}
                disabled={isSavingWishlist}
                aria-pressed={isWishlisted}
                aria-label={isWishlisted ? "Remove from wishlist" : "Add to wishlist"}
                className={`p-2 rounded-full transition-all cursor-pointer ${
                  isWishlisted 
                    ? "text-red-500 bg-red-50 dark:bg-red-950/30" 
                    : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-muted"
                }`}
              >
                <Heart className={`w-6 h-6 stroke-[1.8] ${isWishlisted ? "fill-red-500" : ""}`} />
              </button>
            </div>

            {/* Live Rating Stars & Review Count */}
            <div className="flex items-center gap-2 text-xs sm:text-sm flex-wrap">
              <div className="flex items-center gap-0.5 text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star 
                    key={i} 
                    className={`w-4 h-4 ${i < Math.round(Number(liveAvgRating)) ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`} 
                  />
                ))}
              </div>
              <span className="font-bold text-gray-900 dark:text-white">
                {liveAvgRating}
              </span>
              <span className="font-semibold text-gray-500 dark:text-gray-400">
                ({liveReviewsCount} {liveReviewsCount === 1 ? "review" : "reviews"})
              </span>
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

          {/* ── RIGHT COLUMN: LIVE INTERACTIVE REVIEWS PANEL ── */}
          <div className="lg:col-span-3 space-y-0" id="reviews-section">
            <div className="rounded-none border border-gray-200 dark:border-border bg-white dark:bg-card shadow-xs sticky top-24">
              
              {/* Reviews Panel Header */}
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-border">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-full bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center">
                    <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-gray-900 dark:text-white leading-tight">Student Reviews</h3>
                    <span className="text-[11px] text-gray-500">{liveReviewsCount} {liveReviewsCount === 1 ? "rating" : "ratings"}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setIsReviewOpen((o) => !o)}
                  className="flex items-center gap-1 text-[11px] font-extrabold text-[#FF5500] hover:underline cursor-pointer"
                >
                  <PenSquare className="w-3 h-3" />
                  {isReviewOpen ? "Cancel" : "Write"}
                </button>
              </div>

              {/* Score Breakdown */}
              <div className="p-4 bg-orange-50/40 dark:bg-orange-950/20 space-y-2.5 border-b border-gray-100 dark:border-border">
                <div className="flex items-center justify-between">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black text-gray-900 dark:text-white">{liveAvgRating}</span>
                    <span className="text-xs text-gray-400 font-bold">/5</span>
                  </div>
                  <div className="flex gap-0.5">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={`w-3.5 h-3.5 ${i < Math.round(Number(liveAvgRating)) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                    ))}
                  </div>
                </div>
                <div className="space-y-1">
                  {[5, 4, 3, 2, 1].map((stars) => {
                    const cnt = dbReviews.filter((r: any) => Math.round(Number(r.rating || 5)) === stars).length;
                    const pct = liveReviewsCount > 0 ? (cnt / liveReviewsCount) * 100 : (stars === 5 ? 100 : 0);
                    return (
                      <div key={stars} className="flex items-center gap-1.5 text-[10px]">
                        <span className="w-4 text-right shrink-0 text-gray-500 font-semibold">{stars}★</span>
                        <div className="flex-1 h-1.5 bg-gray-200 dark:bg-muted rounded-none overflow-hidden">
                          <div className="h-full bg-amber-400 rounded-none transition-all duration-500" style={{ width: `${pct}%` }} />
                        </div>
                        <span className="w-3 text-right text-gray-400">{cnt}</span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Filter Pills */}
              <div className="flex gap-1 p-3 border-b border-gray-100 dark:border-border overflow-x-auto scrollbar-none">
                <button
                  type="button"
                  onClick={() => setReviewStarFilter("all")}
                  className={`px-2.5 py-1 rounded-none text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                    reviewStarFilter === "all"
                      ? "bg-black text-white dark:bg-white dark:text-black"
                      : "bg-gray-100 dark:bg-muted text-gray-600 dark:text-gray-300"
                  }`}
                >
                  All
                </button>
                {[5, 4, 3, 2, 1].map((stars) => (
                  <button
                    key={stars}
                    type="button"
                    onClick={() => setReviewStarFilter(String(stars))}
                    className={`px-2.5 py-1 rounded-none text-[10px] font-bold whitespace-nowrap cursor-pointer transition-all ${
                      reviewStarFilter === String(stars)
                        ? "bg-amber-400 text-black"
                        : "bg-gray-100 dark:bg-muted text-gray-600 dark:text-gray-300"
                    }`}
                  >
                    {stars}★
                  </button>
                ))}
              </div>

              {/* Reviews Feed */}
              <div className="max-h-[480px] overflow-y-auto divide-y divide-gray-100 dark:divide-border">
                {filteredAndSortedReviews.length === 0 ? (
                  <div className="py-8 text-center space-y-2 p-4">
                    <Star className="w-8 h-8 text-amber-300/50 mx-auto" />
                    <p className="text-xs font-bold text-gray-800 dark:text-white">
                      {dbReviews.length === 0 ? "No reviews yet" : "No match"}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      {dbReviews.length === 0 ? "Be the first to review!" : "Try a different filter."}
                    </p>
                    <button
                      type="button"
                      onClick={() => dbReviews.length === 0 ? setIsReviewOpen(true) : setReviewStarFilter("all")}
                      className="text-xs font-bold text-[#FF5500] hover:underline cursor-pointer"
                    >
                      {dbReviews.length === 0 ? "+ Add First Review" : "Show all"}
                    </button>
                  </div>
                ) : (
                  filteredAndSortedReviews.map((rev: any, idx: number) => {
                    const reviewDate = rev.created_at
                      ? new Date(rev.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })
                      : "Recently";
                    return (
                      <div key={rev.id || idx} className="p-4 space-y-2.5">
                        {/* Reviewer */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF5500] to-orange-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(rev.user?.full_name || "B").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                                  {rev.user?.full_name || "Campus buyer"}
                                </span>
                                <span className="px-1.5 py-0.5 rounded-none bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 text-emerald-600 text-[9px] font-bold shrink-0">
                                  ✓ Buyer
                                </span>
                              </div>
                              <span className="text-[10px] text-gray-400 truncate block">{rev.campus || "Campus Student"}</span>
                            </div>
                          </div>
                          <div className="flex flex-col items-end shrink-0">
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, i) => (
                                <Star key={i} className={`w-2.5 h-2.5 ${i < Number(rev.rating || 5) ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
                              ))}
                            </div>
                            <span className="text-[9px] text-gray-400 mt-0.5">{reviewDate}</span>
                          </div>
                        </div>

                        {/* Review Text */}
                        <p className="text-xs text-gray-700 dark:text-gray-300 leading-relaxed pl-9">
                          {rev.comment || rev.review_text || "Great product!"}
                        </p>

                        {rev.vendor_reply && (
                          <div className="ml-9 border-l-2 border-primary pl-3 py-2 text-xs">
                            <p className="font-bold">Seller response</p>
                            <p className="mt-1 whitespace-pre-wrap">{rev.vendor_reply}</p>
                          </div>
                        )}

                        <button type="button" onClick={() => handleShareReview(rev)} className="ml-9 text-xs text-muted-foreground hover:underline">Share review</button>
                      </div>
                    );
                  })
                )}
              </div>

              {/* Inline Write Review Compose Form */}
              {isReviewOpen && (
                <div className="border-t border-gray-100 dark:border-border p-4 bg-orange-50/30 dark:bg-orange-950/10 space-y-3">
                  {/* Reviewer Identity (auto, read-only) */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF5500] to-orange-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                      {(user?.user_metadata?.full_name || user?.email || "S").charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-xs font-extrabold text-gray-900 dark:text-white">
                        {user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Campus Student"}
                      </p>
                      <p className="text-[10px] text-gray-400">Reviewing as registered buyer</p>
                    </div>
                  </div>

                  {/* Star Rating Picker */}
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className="p-0.5 hover:scale-125 transition-transform cursor-pointer"
                      >
                        <Star className={`w-5 h-5 ${star <= reviewRating ? "fill-amber-400 text-amber-400" : "text-gray-300 dark:text-gray-600"}`} />
                      </button>
                    ))}
                    <span className="ml-1 text-[11px] text-gray-500 font-semibold">{reviewRating}/5</span>
                  </div>

                  {/* Comment Textarea */}
                  <textarea
                    rows={3}
                    placeholder="Share your experience — quality, delivery, campus pickup..."
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    className="w-full p-2.5 rounded-none border border-gray-300 dark:border-border bg-white dark:bg-card text-xs focus:outline-none focus:ring-2 focus:ring-[#FF5500] resize-none"
                  />

                  {/* Submit / Cancel */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => { setIsReviewOpen(false); setReviewComment(""); setReviewRating(5); }}
                      className="flex-1 py-2 rounded-none border border-gray-300 dark:border-border text-xs font-bold text-gray-600 hover:bg-gray-50 cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      type="button"
                      disabled={isSubmittingReview || !reviewComment.trim()}
                      onClick={(e) => handleReviewSubmit(e as any)}
                      className="flex-1 py-2 rounded-none bg-[#FF5500] hover:bg-[#e54a00] text-white text-xs font-extrabold flex items-center justify-center gap-1 cursor-pointer disabled:opacity-50 transition-all"
                    >
                      <Send className="w-3 h-3" />
                      {isSubmittingReview ? "Posting..." : "Post Review"}
                    </button>
                  </div>
                </div>
              )}

              {/* Write Review CTA Button (shown when form is closed) */}
              {!isReviewOpen && (
                <div className="p-3 border-t border-gray-100 dark:border-border">
                  <button
                    type="button"
                    onClick={() => setIsReviewOpen(true)}
                    className="w-full py-2.5 rounded-none bg-[#FF5500] hover:bg-[#e54a00] text-white font-extrabold text-xs flex items-center justify-center gap-1.5 cursor-pointer transition-all"
                  >
                    <PenSquare className="w-3.5 h-3.5" />
                    Write a Student Review
                  </button>
                </div>
              )}
            </div>
          </div>

        </div>


        {/* ═══════════════════ PART 3: YOU MAY ALSO LIKE ═══════════════════ */}
        <div className="mt-6 sm:mt-8 space-y-4 pt-6 border-t border-gray-100 dark:border-border">
          <h2 className="text-xl sm:text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            You May Also Like
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
            {relatedProducts.slice(0, 5).map((item, idx) => (
              <UnimallProductCard
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
                    Contact {vendorData.name}
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
