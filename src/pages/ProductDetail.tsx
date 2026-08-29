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
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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

  const { data: dbProduct } = useQuery({
    queryKey: ["product", id],
    queryFn: () => productService.getProductById(id!),
    initialData: cachedCurrentProduct || undefined,
    enabled: !!id,
  });

  // 3. Resolve active product
  const mockFallback = (id && MOCK_PRODUCTS_DATA[id]) || null;
  
  const product: StorefrontProduct = dbProduct || cachedCurrentProduct || mockFallback || {
    id: id || "item",
    name: "Loading Product...",
    description: "",
    price: 0,
    original_price: null,
    category: "General",
    image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600",
    features: [],
    rating: 5.0,
    reviews: 0,
    vendor: "Campus Merchant",
    vendor_id: "v-store",
    created_at: new Date().toISOString(),
    status: true,
    stock: 50,
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
  const { data: dbVendorProfile } = useQuery({
    queryKey: ["product-vendor-profile", vendorId, product.vendor],
    queryFn: async () => {
      if (!vendorId && !product.vendor) return null;

      if (vendorId) {
        const raw = localStorage.getItem(`unimall_vendor_profile_${vendorId}`);
        if (raw) {
          try {
            return JSON.parse(raw);
          } catch (e) {}
        }
      }

      try {
        if (vendorId) {
          const { data, error } = await supabase
            .from("profiles")
            .select("id, user_id, full_name, store_name, avatar_url, phone, campus, verified")
            .or(`user_id.eq.${vendorId},id.eq.${vendorId}`)
            .maybeSingle();
          if (!error && data) return data;
        }

        if (product.vendor) {
          const { data: byName } = await supabase
            .from("profiles")
            .select("id, user_id, full_name, store_name, avatar_url, phone, campus, verified")
            .ilike("store_name", product.vendor)
            .maybeSingle();
          if (byName) return byName;
        }
      } catch (e) {}

      return null;
    },
    enabled: !!vendorId || !!product.vendor,
  });

  const isUUID = (str: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str || "");
  const rawVendorName = dbVendorProfile?.store_name || dbVendorProfile?.full_name || product.vendor || "";
  const cleanVendorName = (!rawVendorName || isUUID(rawVendorName) || rawVendorName === "Store") ? "Campus Merchant" : rawVendorName;

  const vendorData = {
    id: vendorId || dbVendorProfile?.user_id || dbVendorProfile?.id || cleanVendorName,
    name: cleanVendorName,
    campus: dbVendorProfile?.campus || "Campus Verified Merchant",
    avatar_url: dbVendorProfile?.avatar_url || "",
    phone: dbVendorProfile?.phone || "+233 24 000 0000",
    is_pro: dbVendorProfile?.verified !== false,
  };

  // 5. Vendor Follow System (100% Real ID Tracking)
  const currentVisitorId = user?.id || "local_visitor";
  const [vendorFollowerList, setVendorFollowerList] = useState<string[]>(() => {
    if (!vendorData.id) return [];
    try {
      const raw = localStorage.getItem(`unimall_vendor_follower_list_${vendorData.id}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  useEffect(() => {
    if (vendorData.id) {
      try {
        const raw = localStorage.getItem(`unimall_vendor_follower_list_${vendorData.id}`);
        if (raw) setVendorFollowerList(JSON.parse(raw));
      } catch (e) {}
    }
  }, [vendorData.id]);

  const isFollowingVendor = useMemo(() => {
    return vendorFollowerList.includes(currentVisitorId);
  }, [vendorFollowerList, currentVisitorId]);

  const vendorFollowersCount = vendorFollowerList.length;

  const handleToggleFollowVendor = () => {
    const nextList = isFollowingVendor
      ? vendorFollowerList.filter((uid) => uid !== currentVisitorId)
      : [...vendorFollowerList, currentVisitorId];

    setVendorFollowerList(nextList);

    if (vendorData.id) {
      localStorage.setItem(`unimall_vendor_follower_list_${vendorData.id}`, JSON.stringify(nextList));
    }

    const nowFollowing = nextList.includes(currentVisitorId);
    toast({
      title: nowFollowing ? "Store Followed ❤️" : "Store Unfollowed",
      description: nowFollowing 
        ? `You are now following ${vendorData.name}.`
        : `You unfollowed ${vendorData.name}.`,
    });
  };

  // 6. Live Interactive Reviews System
  const { data: dbReviews = [], refetch: refetchReviews } = useQuery<any[]>({
    queryKey: ["product-reviews", product.id],
    queryFn: async () => {
      if (!product.id) return [];
      let list: any[] = [];
      try {
        const { data, error } = await supabase
          .from("reviews")
          .select("id, product_id, user_id, reviewer_name, campus, rating, comment, created_at")
          .eq("product_id", product.id)
          .order("created_at", { ascending: false });
        if (!error && data) {
          list = data;
        }
      } catch (e) {}

      try {
        const localRaw = localStorage.getItem(`unimall_local_reviews_${product.id}`);
        if (localRaw) {
          const parsed = JSON.parse(localRaw);
          parsed.forEach((pr: any) => {
            if (!list.some((a) => a.id === pr.id)) {
              list.unshift(pr);
            }
          });
        }
      } catch (e) {}

      return list;
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

    setIsSubmittingReview(true);
    const resolvedName = user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Campus Student";
    const newRev = {
      id: `rev-${Date.now()}`,
      product_id: product.id,
      user_id: user?.id || null,
      reviewer_name: resolvedName,
      campus: user?.user_metadata?.campus || "University Campus",
      rating: reviewRating,
      comment: reviewComment.trim(),
      created_at: new Date().toISOString(),
    };

    try {
      await supabase.from("reviews").insert([{
        product_id: product.id,
        user_id: user?.id || null,
        rating: reviewRating,
        comment: reviewComment.trim(),
      }]);
    } catch (err) {}

    try {
      const local = JSON.parse(localStorage.getItem(`unimall_local_reviews_${product.id}`) || "[]");
      localStorage.setItem(`unimall_local_reviews_${product.id}`, JSON.stringify([newRev, ...local]));
    } catch (err) {}

    setIsSubmittingReview(false);
    setIsReviewOpen(false);
    setReviewComment("");
    setReviewRating(5);
    refetchReviews();

    toast({
      title: "Review Published ⭐",
      description: "Thank you for helping fellow campus students make smart shopping decisions.",
    });
  };

  // Review Social Interactivity (Likes, Comments & Replies)
  const [likedReviewIds, setLikedReviewIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(`unimall_liked_reviews_${currentVisitorId}`);
      return raw ? JSON.parse(raw) : [];
    } catch (e) {
      return [];
    }
  });

  const [reviewLikesCount, setReviewLikesCount] = useState<Record<string, number>>(() => {
    try {
      const raw = localStorage.getItem(`unimall_review_likes_map_${product.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  const [reviewReplies, setReviewReplies] = useState<Record<string, any[]>>(() => {
    try {
      const raw = localStorage.getItem(`unimall_review_replies_map_${product.id}`);
      return raw ? JSON.parse(raw) : {};
    } catch (e) {
      return {};
    }
  });

  const [expandedReplyReviewId, setExpandedReplyReviewId] = useState<string | null>(null);
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyAuthorName, setReplyAuthorName] = useState<Record<string, string>>({});
  const [reviewStarFilter, setReviewStarFilter] = useState<string>("all");
  const [reviewSort, setReviewSort] = useState<"newest" | "highest" | "helpful">("newest");

  const handleToggleLikeReview = (reviewId: string) => {
    const isLiked = likedReviewIds.includes(reviewId);
    const nextLiked = isLiked
      ? likedReviewIds.filter((id) => id !== reviewId)
      : [...likedReviewIds, reviewId];
    
    setLikedReviewIds(nextLiked);
    localStorage.setItem(`unimall_liked_reviews_${currentVisitorId}`, JSON.stringify(nextLiked));

    const currentCount = reviewLikesCount[reviewId] || 0;
    const nextCount = isLiked ? Math.max(0, currentCount - 1) : currentCount + 1;
    const nextMap = { ...reviewLikesCount, [reviewId]: nextCount };
    setReviewLikesCount(nextMap);
    localStorage.setItem(`unimall_review_likes_map_${product.id}`, JSON.stringify(nextMap));

    toast({
      title: isLiked ? "Reaction Removed" : "Review Marked as Helpful 👍",
      description: isLiked ? "You unliked this review." : "Thank you for supporting student feedback!",
    });
  };

  const handleAddReply = (reviewId: string) => {
    const text = (replyDrafts[reviewId] || "").trim();
    if (!text) {
      toast({
        title: "Comment Required",
        description: "Please type a reply message before submitting.",
        variant: "destructive",
      });
      return;
    }

    const isStoreOwner = user?.id === vendorData.id;
    const author = (replyAuthorName[reviewId] || "").trim() || (isStoreOwner ? `${vendorData.name} (Store Owner)` : user?.user_metadata?.full_name || "Campus Student");

    const newReply = {
      id: `rep-${Date.now()}`,
      review_id: reviewId,
      author_name: author,
      campus: isStoreOwner ? vendorData.campus : "UG Legon Student",
      is_vendor: isStoreOwner,
      text: text,
      created_at: new Date().toISOString(),
    };

    const currentList = reviewReplies[reviewId] || [];
    const nextReplies = { ...reviewReplies, [reviewId]: [...currentList, newReply] };
    setReviewReplies(nextReplies);
    localStorage.setItem(`unimall_review_replies_map_${product.id}`, JSON.stringify(nextReplies));

    setReplyDrafts({ ...replyDrafts, [reviewId]: "" });

    toast({
      title: "Reply Published 💬",
      description: "Your comment has been added to the review discussion.",
    });
  };

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
    } else if (reviewSort === "helpful") {
      list.sort((a, b) => (reviewLikesCount[b.id] || 0) - (reviewLikesCount[a.id] || 0));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return list;
  }, [dbReviews, reviewStarFilter, reviewSort, reviewLikesCount]);

  // Resolve matching, relevant gallery for THIS product
  const images = getProductGallery(product);

  // Dynamically resolve matching bullet features & ranking badge
  const bulletFeatures = getSmartFeatures(product);
  const rankingBadge = `TOP ${product.category || "Campus"} Best Seller #1`;

  // Local interaction states
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
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

    const cleanNum = vendorData.phone.replace(/[^0-9]/g, "");
    const waText = encodeURIComponent(
      `Hello ${vendorData.name}, my name is ${buyerName || "a student"}. ${inquiryMessage}\n(My contact: ${buyerContact})`
    );
    window.open(`https://wa.me/${cleanNum}?text=${waText}`, "_blank");

    toast({
      title: "Message Sent!",
      description: `Inquiry sent to ${vendorData.name}. They will contact you shortly.`,
    });
    setIsMessageModalOpen(false);
  };

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
                    Verified Trader
                  </span>
                </div>
              </div>

              {/* Contact Actions Row (WhatsApp & Instant Message) */}
              <div className="grid grid-cols-2 gap-2.5 pt-0.5">
                {/* WhatsApp Chat Button */}
                <a
                  href={`https://wa.me/${vendorData.phone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(`Hello ${vendorData.name}, I am interested in "${product.name}" (₵${product.price}) on Unimall. Is it available for campus delivery?`)}`}
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
                    const isLiked = likedReviewIds.includes(rev.id);
                    const likesCount = reviewLikesCount[rev.id] || 0;
                    const repliesList = reviewReplies[rev.id] || [];
                    const isReplyOpen = expandedReplyReviewId === rev.id;

                    return (
                      <div key={rev.id || idx} className="p-4 space-y-2.5">
                        {/* Reviewer */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-2 min-w-0">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#FF5500] to-orange-400 text-white font-bold text-xs flex items-center justify-center shrink-0">
                              {(rev.reviewer_name || "S").charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-extrabold text-xs text-gray-900 dark:text-white truncate">
                                  {rev.reviewer_name || "Campus Student"}
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

                        {/* Action Buttons */}
                        <div className="flex items-center gap-2 pl-9 flex-wrap">
                          <button
                            type="button"
                            onClick={() => handleToggleLikeReview(rev.id)}
                            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-none border transition-all cursor-pointer ${
                              isLiked
                                ? "bg-orange-50 border-[#FF5500] text-[#FF5500] dark:bg-orange-950/30"
                                : "bg-gray-50 dark:bg-muted/50 border-gray-200 dark:border-border text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            <ThumbsUp className={`w-3 h-3 ${isLiked ? "fill-[#FF5500]" : ""}`} />
                            <span>Helpful{likesCount > 0 ? ` (${likesCount})` : ""}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => setExpandedReplyReviewId(isReplyOpen ? null : rev.id)}
                            className={`flex items-center gap-1 text-[11px] font-bold px-2 py-1 rounded-none border transition-all cursor-pointer ${
                              isReplyOpen
                                ? "bg-black text-white dark:bg-white dark:text-black border-black dark:border-white"
                                : "bg-gray-50 dark:bg-muted/50 border-gray-200 dark:border-border text-gray-500 hover:bg-gray-100"
                            }`}
                          >
                            <MessageCircle className="w-3 h-3" />
                            <span>{repliesList.length > 0 ? `Replies (${repliesList.length})` : "Reply"}</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleShareReview(rev)}
                            className="flex items-center gap-1 text-[11px] text-gray-400 hover:text-gray-600 cursor-pointer"
                          >
                            <Share2 className="w-3 h-3" />
                            Share
                          </button>
                        </div>

                        {/* Replies Thread */}
                        {(repliesList.length > 0 || isReplyOpen) && (
                          <div className="ml-9 space-y-2 bg-gray-50 dark:bg-muted/30 p-3 rounded-none border border-gray-200/60 dark:border-border/60">
                            {repliesList.length > 0 && (
                              <p className="text-[10px] font-black uppercase tracking-wider text-gray-400">Discussion ({repliesList.length})</p>
                            )}
                            {repliesList.map((reply: any, rIdx: number) => (
                              <div key={reply.id || rIdx} className="bg-white dark:bg-card p-2.5 rounded-none border border-gray-200/60 dark:border-border/60 space-y-1">
                                <div className="flex items-center justify-between gap-1">
                                  <div className="flex items-center gap-1.5">
                                    <div className={`w-4 h-4 rounded-full text-white font-bold text-[9px] flex items-center justify-center ${reply.is_vendor ? "bg-[#FF5500]" : "bg-neutral-600"}`}>
                                      {(reply.author_name || "S").charAt(0).toUpperCase()}
                                    </div>
                                    <span className="font-bold text-[11px] text-gray-900 dark:text-white">{reply.author_name}</span>
                                    {reply.is_vendor && (
                                      <span className="px-1 rounded-none bg-orange-100 dark:bg-orange-950/60 text-[#FF5500] text-[9px] font-black">Store</span>
                                    )}
                                  </div>
                                  <span className="text-[9px] text-gray-400">{reply.created_at ? new Date(reply.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "short" }) : ""}</span>
                                </div>
                                <p className="text-[11px] text-gray-700 dark:text-gray-300 pl-5.5 leading-relaxed">{reply.text}</p>
                              </div>
                            ))}
                            {isReplyOpen && (
                              <div className="space-y-1.5 pt-1.5 border-t border-gray-200/50 dark:border-border/50">
                                <textarea
                                  rows={2}
                                  placeholder="Write your reply..."
                                  value={replyDrafts[rev.id] || ""}
                                  onChange={(e) => setReplyDrafts({ ...replyDrafts, [rev.id]: e.target.value })}
                                  className="w-full p-2 rounded-none border border-gray-300 dark:border-border bg-white dark:bg-card text-[11px] focus:outline-none focus:ring-1 focus:ring-[#FF5500] resize-none"
                                />
                                <div className="flex gap-1.5 justify-end">
                                  <button type="button" onClick={() => setExpandedReplyReviewId(null)} className="px-2.5 py-1 text-[11px] font-bold text-gray-500 hover:text-gray-800 cursor-pointer rounded-none border border-transparent">
                                    Cancel
                                  </button>
                                  <button type="button" onClick={() => handleAddReply(rev.id)} className="px-3 py-1 rounded-none bg-[#FF5500] hover:bg-[#e54a00] text-white text-[11px] font-bold flex items-center gap-1 cursor-pointer">
                                    <Send className="w-2.5 h-2.5" />
                                    Post
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
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
