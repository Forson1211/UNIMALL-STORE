import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  ChevronRight,
  ChevronDown,
  ShieldCheck,
  MapPin,
  Star,
  Phone,
  Package,
  Search,
  Store,
  MessageCircle,
  Share2,
  Heart,
  Truck,
  Sparkles,
  Zap,
  Award,
  Clock,
  Filter,
  Home,
  Users
} from "lucide-react";
import { UnimallVerifiedBadge } from "@/components/common/UnimallVerifiedBadge";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService, unpackProductMetadata } from "@/services/vendorService";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { UnimallProductCard } from "@/components/home/UnimallProductCard";

// Real Official WhatsApp Icon (Exact Replica of User Reference)
const WhatsAppOfficialIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 32 32" className={className} fill="none">
    <circle cx="16" cy="16" r="16" fill="#25D366" />
    <path
      d="M23.5 8.5C21.5 6.5 18.9 5.4 16.1 5.4C10.3 5.4 5.6 10.1 5.6 15.9C5.6 17.8 6.1 19.6 7 21.2L5.4 27.1L11.5 25.5C12.9 26.3 14.5 26.7 16.1 26.7C21.9 26.7 26.6 22 26.6 16.2C26.6 13.4 25.5 10.8 23.5 8.5ZM16.1 24.9C14.7 24.9 13.3 24.5 12.1 23.8L11.8 23.6L8.2 24.5L9.1 21L8.9 20.7C8.1 19.4 7.6 17.9 7.6 16.3C7.6 11.6 11.4 7.8 16.1 7.8C18.4 7.8 20.5 8.7 22.1 10.3C23.7 11.9 24.6 14 24.6 16.3C24.6 21 20.8 24.9 16.1 24.9ZM20.7 18.5C20.4 18.4 19.1 17.8 18.9 17.7C18.7 17.6 18.5 17.6 18.3 17.9C18.1 18.2 17.6 18.8 17.5 19C17.3 19.1 17.2 19.1 16.9 19C15.4 18.3 14.4 17.3 13.7 16.1C13.5 15.8 13.7 15.6 13.8 15.4C13.9 15.3 14.1 15.1 14.2 15C14.3 14.9 14.4 14.8 14.4 14.6C14.5 14.5 14.4 14.3 14.4 14.2C14.3 14.1 13.8 12.8 13.6 12.3C13.4 11.8 13.2 11.9 13.1 11.9C12.9 11.9 12.8 11.9 12.6 11.9C12.4 11.9 12.2 12 12 12.2C11.8 12.4 11.2 13 11.2 14.2C11.2 15.4 12.1 16.6 12.2 16.7C12.4 16.9 14 19.3 16.4 20.3C17.9 20.9 18.5 21 19.3 20.9C19.8 20.8 20.8 20.3 21 19.7C21.2 19.1 21.2 18.6 21.1 18.5C21.1 18.4 20.9 18.4 20.7 18.5Z"
      fill="white"
    />
  </svg>
);

// Real Official Phone Call Wave Icon (High-Fidelity Crisp Vector)
const PhoneCallOfficialIcon = ({ className = "w-5 h-5" }: { className?: string }) => (
  <svg viewBox="0 0 24 24" className={className} fill="none">
    {/* Outer circle */}
    <circle cx="12" cy="12" r="10.5" stroke="currentColor" strokeWidth="1.8" />
    {/* Handset */}
    <path
      d="M7.8 7.8c.4-.4.9-.7 1.4-.4l1.6 1.1c.4.3.5.8.3 1.2l-.7.9c-.2.3-.2.6 0 .9 1 1.6 2.3 2.9 3.9 3.9.3.2.6.2.9 0l.9-.7c.4-.3.9-.2 1.2.2l1.1 1.6c.3.5 0 1-.4 1.4-.7.7-1.6 1.1-2.6.9-2.3-.4-4.5-1.7-6.2-3.4-1.7-1.7-3-3.9-3.4-6.2-.2-1 .2-1.9.9-2.6z"
      fill="currentColor"
    />
    {/* Soundwaves */}
    <path
      d="M13.5 6.5C14.8 7.2 15.8 8.2 16.5 9.5"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
    <path
      d="M15.5 4.5C17.5 5.5 19 7 20 9"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
    />
  </svg>
);

interface VendorData {
  user_id?: string;
  id?: string;
  store_name?: string;
  full_name?: string;
  banner_url?: string;
  avatar_url?: string;
  store_description?: string;
  campus?: string;
  rating?: number;
  phone?: string;
  verified?: boolean;
  is_pro?: boolean;
  category?: string;
  created_at?: string;
  [key: string]: unknown;
}

const VendorStore = () => {
  const { id } = useParams<{ id: string }>();
  const { user, profile: authProfile } = useAuth();
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [priceRange, setPriceRange] = useState<string>("all");
  const [minPrice, setMinPrice] = useState<string>("");
  const [maxPrice, setMaxPrice] = useState<string>("");
  const [sortBy, setSortBy] = useState<"newest" | "price-low" | "price-high" | "rating">("newest");
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Followers management (100% Live Real ID tracking - starts at 0)
  const currentUserId = user?.id || "local_visitor";
  
  const [followerList, setFollowerList] = useState<string[]>(() => {
    if (!id) return [];
    try {
      // Clear legacy dummy keys from storage
      localStorage.removeItem(`unimall_vendor_followers_${id}`);
      const raw = localStorage.getItem(`unimall_vendor_follower_list_${id}`);
      if (raw) return JSON.parse(raw);
    } catch (e) {}
    return [];
  });

  const isFollowing = useMemo(() => {
    return followerList.includes(currentUserId);
  }, [followerList, currentUserId]);

  const followersCount = followerList.length;

  // Accordion toggle states
  const [catOpen, setCatOpen] = useState(true);
  const [priceOpen, setPriceOpen] = useState(true);

  // Fetch vendor profile with multi-layer hydration (supports UUIDs, store names, and usernames)
  const { data: vendor, isLoading: loadingVendor, error } = useQuery<VendorData>({
    queryKey: ["vendor-profile", id, authProfile?.store_name, authProfile?.avatar_url, authProfile?.banner_url, authProfile?.campus],
    queryFn: async () => {
      let cached: any = null;
      if (id) {
        const raw = localStorage.getItem(`unimall_vendor_profile_${id}`);
        if (raw) {
          try {
            cached = JSON.parse(raw);
          } catch (e) {}
        }
      }

      // If viewing current vendor's own store
      if (user?.id && (id === user.id || (authProfile?.store_name && id?.toLowerCase() === authProfile.store_name.toLowerCase()))) {
        const proSaved = localStorage.getItem(`unimall_vendor_pro_${user.id}`) === "true";
        const hasSub = Boolean((authProfile as any).is_pro || (authProfile as any).is_subscribed || authProfile.verified || proSaved);
        return {
          user_id: user.id,
          id: authProfile.id || user.id,
          store_name: cached?.store_name || authProfile.store_name || authProfile.full_name || id || "My Campus Store",
          full_name: authProfile.full_name,
          banner_url: cached?.banner_url || authProfile.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200",
          avatar_url: cached?.avatar_url || authProfile.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          store_description: cached?.store_description || authProfile.store_description || "Welcome to our official campus store! Order student essentials, gadgets, and quality products with same-day delivery.",
          campus: cached?.campus || authProfile.campus || "University of Ghana (Legon)",
          rating: 5.0,
          phone: cached?.phone || authProfile.phone || "",
          verified: hasSub,
          is_pro: hasSub,
          category: authProfile.store_category || "General",
        } as VendorData;
      }

      // Query Supabase profiles table (Robust UUID and Name matching)
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
        let query = supabase.from("profiles").select("*");

        if (isUUID) {
          query = query.or(`user_id.eq.${id},id.eq.${id}`);
        } else {
          query = query.or(`store_name.ilike.${id},full_name.ilike.${id}`);
        }

        const { data, error: profileErr } = await query.maybeSingle();

        if (data) {
          const profileData = data as any;
          const profileUserId = profileData.user_id || profileData.id;
          const proSaved = profileUserId ? localStorage.getItem(`unimall_vendor_pro_${profileUserId}`) === "true" : false;
          const hasSub = Boolean(profileData.is_pro || profileData.is_subscribed || profileData.is_verified || profileData.role === "vendor" || proSaved);
          return {
            ...profileData,
            user_id: profileUserId,
            id: profileUserId,
            avatar_url: cached?.avatar_url || profileData.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
            banner_url: cached?.banner_url || profileData.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200",
            store_name: profileData.store_name || profileData.full_name || cached?.store_name || id,
            campus: profileData.campus || cached?.campus || "University of Ghana (Legon)",
            store_description: profileData.store_description || profileData.bio || cached?.store_description || "Welcome to our store! Browse our featured items and order directly with fast campus delivery.",
            phone: profileData.phone || cached?.phone || "",
            rating: 5.0,
            verified: hasSub,
            is_pro: hasSub,
          } as VendorData;
        }
      } catch (e) {
        console.warn("Error fetching profile from Supabase:", e);
      }

      if (cached) {
        const proSaved = id ? localStorage.getItem(`unimall_vendor_pro_${id}`) === "true" : false;
        return {
          user_id: id,
          id: id,
          store_name: cached.store_name || id || "Campus Merchant",
          phone: cached.phone,
          campus: cached.campus || "University of Ghana (Legon)",
          store_description: cached.store_description || "Welcome to our store! Browse our campus products.",
          banner_url: cached.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200",
          avatar_url: cached.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80",
          verified: proSaved,
          is_pro: proSaved,
          rating: 5.0,
        } as VendorData;
      }

      // Safe Fallback for store name
      return {
        user_id: id,
        id: id,
        store_name: id || "Campus Merchant Store",
        campus: "University of Ghana (Legon)",
        store_description: "Welcome to our campus shop! Browse our quality products and reach out on WhatsApp.",
        rating: 5.0,
        verified: true,
        is_pro: true,
      } as VendorData;
    },
    enabled: !!id,
  });

  // Fetch vendor products with comprehensive multi-identifier matching
  const { data: products = [], isLoading: loadingProducts } = useQuery<any[]>({
    queryKey: ["vendor-store-products", id, vendor?.user_id, vendor?.id, vendor?.store_name],
    queryFn: async () => {
      const vendorUserId = vendor?.user_id || vendor?.id;
      const vendorStoreName = vendor?.store_name || vendor?.full_name || id;
      const allFound: any[] = [];

      // 1. Try vendorService with vendorUserId or id
      if (vendorUserId) {
        try {
          const vendorProds = await vendorService.getProducts(vendorUserId);
          if (vendorProds && vendorProds.length > 0) {
            allFound.push(...vendorProds);
          }
        } catch (e) {}
      }

      // 2. Direct products table query checking vendor_id and vendor name
      try {
        const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id || "");
        const orConditions: string[] = [];
        
        if (vendorUserId) orConditions.push(`vendor_id.eq.${vendorUserId}`);
        if (id && isUUID && id !== vendorUserId) orConditions.push(`vendor_id.eq.${id}`);
        if (vendorStoreName) {
          orConditions.push(`vendor.ilike.%${vendorStoreName}%`);
        }

        if (orConditions.length > 0) {
          const { data: directData, error: directErr } = await supabase
            .from("products")
            .select("*")
            .or(orConditions.join(","))
            .order("created_at", { ascending: false });

          if (!directErr && directData && directData.length > 0) {
            allFound.push(...directData.map(unpackProductMetadata));
          }
        }
      } catch (e) {}

      // 3. Check storefront_products_view
      try {
        if (vendorStoreName) {
          const { data: viewData } = await supabase
            .from("storefront_products_view" as any)
            .select("*")
            .or(`vendor.ilike.%${vendorStoreName}%${vendorUserId ? `,vendor_id.eq.${vendorUserId}` : ""}`)
            .order("created_at", { ascending: false });

          if (viewData && viewData.length > 0) {
            allFound.push(...viewData.map(unpackProductMetadata));
          }
        }
      } catch (e) {}

      // Deduplicate products by id
      const seen = new Set<string>();
      const deduped = allFound.filter((p: any) => {
        const pid = String(p.id || p.product_id || "");
        if (!pid || seen.has(pid)) return false;
        seen.add(pid);
        return true;
      });

      return deduped;
    },
    enabled: !!id || !!vendor,
  });

  // Fetch live reviews for vendor's products
  const productIds = useMemo(() => products.map((p: any) => p.id).filter(Boolean), [products]);
  const { data: reviews = [] } = useQuery<any[]>({
    queryKey: ["vendor-store-reviews", id, productIds.join(",")],
    queryFn: async () => {
      if (!productIds.length) return [];
      try {
        const { data } = await supabase
          .from("reviews")
          .select("*")
          .in("product_id", productIds);
        return data || [];
      } catch (e) {
        return [];
      }
    },
    enabled: productIds.length > 0,
  });

  const ratingSummary = useMemo(() => {
    if (!reviews || reviews.length === 0) {
      return { rating: "5.0", label: "New Merchant" };
    }
    const avg = (reviews.reduce((sum, r) => sum + Number(r.rating || 5), 0) / reviews.length).toFixed(1);
    return { rating: avg, label: `${reviews.length} ${reviews.length === 1 ? "review" : "reviews"}` };
  }, [reviews]);

  // Build category list matching Products.tsx
  const categoriesList = useMemo(() => {
    const defaultCats = [
      { label: "All Products", value: "All", icon: Package },
      ...PRODUCT_CATEGORIES.map((cat) => ({ label: cat.label, value: cat.label, icon: cat.icon })),
    ];
    return defaultCats;
  }, []);

  // Filter and Sort Products
  const processedProducts = useMemo(() => {
    let list = [...products];

    // 1. Search Query Filter
    if (searchQuery) {
      list = list.filter((p) => {
        return (
          p.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          p.category?.toLowerCase().includes(searchQuery.toLowerCase())
        );
      });
    }

    // 2. Category Filter
    if (selectedCategory !== "All") {
      list = list.filter((p) => p.category?.toLowerCase() === selectedCategory.toLowerCase());
    }

    // 3. Price Preset Filter
    if (priceRange === "below-200") {
      list = list.filter((p) => Number(p.price) < 200);
    } else if (priceRange === "200-500") {
      list = list.filter((p) => Number(p.price) >= 200 && Number(p.price) <= 500);
    } else if (priceRange === "500-800") {
      list = list.filter((p) => Number(p.price) >= 500 && Number(p.price) <= 800);
    } else if (priceRange === "800-1000") {
      list = list.filter((p) => Number(p.price) >= 800 && Number(p.price) <= 1000);
    } else if (priceRange === "1000-plus") {
      list = list.filter((p) => Number(p.price) > 1000);
    }

    // 4. Custom Min/Max Price Filter
    if (minPrice) {
      list = list.filter((p) => Number(p.price) >= parseFloat(minPrice));
    }
    if (maxPrice) {
      list = list.filter((p) => Number(p.price) <= parseFloat(maxPrice));
    }

    // 5. Sorting (Newest always on top by default)
    if (sortBy === "price-low") {
      list.sort((a, b) => Number(a.price) - Number(b.price));
    } else if (sortBy === "price-high") {
      list.sort((a, b) => Number(b.price) - Number(a.price));
    } else if (sortBy === "rating") {
      list.sort((a, b) => Number(b.rating || 5) - Number(a.rating || 5));
    } else {
      list.sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime());
    }

    return list;
  }, [products, searchQuery, selectedCategory, priceRange, minPrice, maxPrice, sortBy]);

  const handleShareStore = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: "Store Link Copied! 🔗",
        description: "Share this storefront link with fellow students.",
      });
    }
  };

  const handleFollowToggle = () => {
    const nextList = isFollowing
      ? followerList.filter((uid) => uid !== currentUserId)
      : [...followerList, currentUserId];

    setFollowerList(nextList);

    if (id) {
      localStorage.setItem(`unimall_vendor_follower_list_${id}`, JSON.stringify(nextList));
      localStorage.removeItem(`unimall_vendor_followers_${id}`);
    }

    const nowFollowing = nextList.includes(currentUserId);
    toast({
      title: nowFollowing ? "Store Followed ❤️" : "Store Unfollowed",
      description: nowFollowing 
        ? `You are now following ${vendor?.store_name || "this store"}.`
        : "You have unfollowed this store.",
    });
  };

  if (loadingVendor) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <Navbar />
        <div className="pt-36 flex flex-col items-center justify-center pb-24 gap-3">
          <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
          <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Loading Campus Storefront...</p>
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-white dark:bg-background">
        <Navbar />
        <div className="pt-36 text-center pb-24 max-w-md mx-auto px-4">
          <Store className="w-16 h-16 text-gray-300 mx-auto mb-3" />
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Vendor Store Not Found</h2>
          <p className="text-xs text-gray-500 mt-1 mb-6">The campus merchant you are looking for does not exist or has moved.</p>
          <Button className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs h-10 px-6 rounded-none uppercase tracking-wider" onClick={() => window.history.back()}>
            Return to Vendors Directory
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  const rawPhone = vendor.phone?.replace(/[^0-9+]/g, "") || "";
  const whatsappUrl = rawPhone 
    ? `https://wa.me/${rawPhone.startsWith("0") ? "233" + rawPhone.slice(1) : rawPhone}?text=${encodeURIComponent(`Hi ${vendor.store_name || "Merchant"}, I found your store on Unimall and would like to make an inquiry.`)}`
    : "";

  return (
    <div className="min-h-screen bg-white dark:bg-background text-gray-900 dark:text-slate-100 font-sans">
      <Navbar />

      <main className="pt-3 pb-20">
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0">
          
          {/* ══════════════════════ TOP STORE NAVIGATION (HOME, PRODUCTS, VENDORS) ══════════════════════ */}
          <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border p-2.5 sm:px-4 mb-4 shadow-2xs rounded-none flex items-center justify-between gap-3 flex-wrap">
            {/* Left: Interactive Navigation Links */}
            <div className="flex items-center gap-2 sm:gap-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 flex-wrap">
              <Link 
                to="/" 
                className="flex items-center gap-1.5 hover:text-[#FF5500] transition-colors py-0.5"
              >
                <Home className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Home</span>
              </Link>

              <ChevronRight className="w-3 h-3 text-gray-400" />

              <Link 
                to="/products" 
                className="flex items-center gap-1.5 hover:text-[#FF5500] transition-colors py-0.5"
              >
                <Package className="w-3.5 h-3.5 text-gray-500" />
                <span>Products</span>
              </Link>

              <ChevronRight className="w-3 h-3 text-gray-400" />

              <Link 
                to="/vendors" 
                className="flex items-center gap-1.5 hover:text-[#FF5500] transition-colors py-0.5"
              >
                <Store className="w-3.5 h-3.5 text-gray-500" />
                <span>Vendors</span>
              </Link>

              <ChevronRight className="w-3 h-3 text-gray-400" />

              <span className="text-[#FF5500] font-black bg-orange-50 dark:bg-orange-950/40 px-2.5 py-0.5 border border-orange-200 dark:border-orange-900 rounded-md truncate max-w-[140px] sm:max-w-[220px]">
                {vendor.store_name || vendor.full_name || "Vendor"}
              </span>
            </div>

            {/* Right: Quick Link to Explore Marketplace */}
            <div className="hidden sm:flex items-center gap-2 text-xs font-bold text-gray-500">
              <Link to="/vendors" className="hover:text-[#FF5500] transition-colors flex items-center gap-1">
                <span>All Campus Merchants</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          </div>

          {/* ══════════════════════ STORE HERO BANNER & PROFILE (NO OVERLAP) ══════════════════════ */}
          <div className="rounded-none !rounded-none overflow-hidden shadow-2xs border border-gray-200/80 dark:border-border bg-white dark:bg-card mb-6">
            
            {/* 1. Dedicated Top Cover Banner (100% Uncovered) */}
            <div className="relative h-44 sm:h-56 md:h-64 w-full overflow-hidden bg-slate-900">
              <img 
                src={
                  vendor.banner_url && vendor.banner_url !== vendor.avatar_url
                    ? vendor.banner_url
                    : "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200"
                } 
                alt="Store Banner" 
                className="w-full h-full object-cover" 
              />
              <div className="absolute inset-0 bg-black/20" />

              {/* Banner Top Right Actions */}
              <div className="absolute top-3.5 right-3.5 flex items-center gap-2">
                <button
                  onClick={handleShareStore}
                  className="px-3 py-1.5 rounded-none bg-black/60 hover:bg-black/80 backdrop-blur-md text-white text-xs font-bold transition-all flex items-center gap-1.5 border border-white/20 shadow-sm cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span>Share</span>
                </button>

                <button
                  onClick={handleFollowToggle}
                  className={`px-3.5 py-1.5 rounded-none text-xs font-black transition-all flex items-center gap-1.5 shadow-sm cursor-pointer ${
                    isFollowing
                      ? "bg-white text-gray-900 border border-gray-300"
                      : "bg-[#FF5500] hover:bg-[#e54a00] text-white"
                  }`}
                >
                  <Heart className={`w-3.5 h-3.5 ${isFollowing ? "fill-red-500 text-red-500" : ""}`} />
                  <span>{isFollowing ? `Following (${followersCount})` : `Follow (${followersCount})`}</span>
                </button>
              </div>
            </div>

            {/* 2. Dedicated Profile Bar (Below Banner) */}
            <div className="p-4 sm:p-5 md:p-6 bg-white dark:bg-card">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                
                {/* Left: Avatar + Store Name & Badges */}
                <div className="flex items-start sm:items-center gap-4">
                  
                  {/* Avatar (Round with accurately positioned online status badge) */}
                  <div className="relative -mt-12 sm:-mt-14 shrink-0 w-20 h-20 sm:w-24 sm:h-24">
                    <div className="w-full h-full rounded-full bg-white dark:bg-card p-1 shadow-md overflow-hidden border-2 border-gray-200 dark:border-border">
                      <img 
                        src={vendor.avatar_url || "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80"} 
                        alt={vendor.store_name || "Vendor"} 
                        className="w-full h-full object-cover rounded-full"
                      />
                    </div>
                    <span 
                      className="absolute bottom-1 right-1 sm:bottom-1.5 sm:right-1.5 w-4.5 h-4.5 sm:w-5 sm:h-5 rounded-full bg-emerald-500 border-2 border-white dark:border-card flex items-center justify-center shadow-md z-10" 
                      title="Online Now"
                    >
                      <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
                    </span>
                  </div>

                  {/* Store Name, Campus, Reviews, Followers */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h1 className="text-xl sm:text-2xl md:text-3xl font-black tracking-tight text-gray-900 dark:text-white">
                        {vendor.store_name || vendor.full_name}
                      </h1>
                      {Boolean(vendor.is_pro || vendor.verified) && (
                        <UnimallVerifiedBadge size={20} color="#00A3FF" title="Verified Pro Merchant" />
                      )}
                    </div>

                    <div className="flex items-center gap-2 sm:gap-3 text-xs text-gray-600 dark:text-slate-300 flex-wrap font-medium">
                      <span className="flex items-center gap-1 bg-gray-100 dark:bg-muted px-2.5 py-0.5 rounded-md border border-gray-200 dark:border-border text-gray-700 dark:text-gray-300 font-bold">
                        <MapPin className="w-3.5 h-3.5 text-[#FF5500]" />
                        {vendor.campus || "University Campus Hub"}
                      </span>

                      <span className="flex items-center gap-1 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-0.5 rounded-md border border-amber-200 dark:border-amber-800 text-amber-700 dark:text-amber-400 font-bold">
                        <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                        {ratingSummary.rating} ({ratingSummary.label})
                      </span>

                      <span className="flex items-center gap-1 bg-blue-50 dark:bg-blue-950/40 px-2.5 py-0.5 rounded-md border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-400 font-bold">
                        <Users className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        {followersCount} {followersCount === 1 ? "Follower" : "Followers"}
                      </span>

                      <span className="flex items-center gap-1 bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 font-bold">
                        <Package className="w-3.5 h-3.5" />
                        {products.length} Products Listed
                      </span>
                    </div>
                  </div>

                </div>

                {/* Right: Contact & WhatsApp Action CTAs */}
                <div className="flex items-center gap-2.5 self-start md:self-auto shrink-0 flex-wrap pt-2 md:pt-0">
                  {whatsappUrl && (
                    <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-[#25D366] hover:bg-[#20bd5a] text-white font-black text-xs h-9.5 px-5 rounded-none shadow-xs uppercase tracking-wider flex items-center gap-2 cursor-pointer border border-[#20bd5a]">
                        <WhatsAppOfficialIcon className="w-5 h-5 shrink-0" />
                        Chat on WhatsApp
                      </Button>
                    </a>
                  )}

                  {vendor.phone && (
                    <a href={`tel:${vendor.phone}`}>
                      <Button variant="outline" className="border-gray-300 dark:border-border text-gray-800 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-muted font-bold text-xs h-9.5 px-4 rounded-none flex items-center gap-2 cursor-pointer">
                        <PhoneCallOfficialIcon className="w-4.5 h-4.5 text-[#FF5500] shrink-0" />
                        Call Hotline
                      </Button>
                    </a>
                  )}
                </div>

              </div>
            </div>

          </div>

          {/* ══════════════════════ TOP FILTER HEADER BAR (MATCHES PRODUCTS PAGE) ══════════════════════ */}
          <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border p-4 mb-6 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-none">
            {/* Left: Breadcrumbs & Results Count */}
            <div>
              <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-muted-foreground font-medium mb-1">
                <span className="text-gray-500">Categories</span>
                <ChevronRight className="w-3 h-3 text-gray-400" />
                <span className="font-bold text-gray-900 dark:text-foreground">{selectedCategory === "All" ? "All Products" : selectedCategory}</span>
              </div>
              <p className="text-xs text-gray-400 font-semibold">
                {loadingProducts ? "Loading items..." : `Showing all ${processedProducts.length} items results`}
              </p>
            </div>

            {/* Right: Search, Filter Toggle & Sort Dropdown */}
            <div className="flex flex-wrap items-center gap-3">
              {/* Instant Search Bar */}
              <div className="relative flex-1 md:w-64">
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full h-9 pl-9 pr-4 border border-gray-200 dark:border-border rounded-none text-xs outline-none focus:border-[#FF5500] bg-gray-50/50 dark:bg-muted/40"
                />
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              </div>

              {/* Sort By Dropdown */}
              <select
                value={sortBy}
                onChange={(e: any) => setSortBy(e.target.value)}
                className="h-9 px-3 border border-gray-200 dark:border-border bg-white dark:bg-card text-xs font-bold text-gray-700 dark:text-foreground rounded-none outline-none focus:border-[#FF5500] cursor-pointer"
              >
                <option value="newest">Sort By: Newest</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="rating">Top Rated</option>
              </select>

              {/* Mobile Filter Toggle */}
              <button
                className="lg:hidden h-9 px-4 border border-gray-200 dark:border-border rounded-none flex items-center gap-2 text-xs font-bold uppercase tracking-wider bg-white dark:bg-card text-gray-800 dark:text-foreground cursor-pointer"
                onClick={() => setSidebarOpen(true)}
              >
                <Filter className="w-3.5 h-3.5 text-[#FF5500]" /> Filters
              </button>
            </div>
          </div>

          {/* ══════════════════════ 2-COLUMN CATALOG (MATCHES PRODUCTS.TSX EXACTLY) ══════════════════════ */}
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
                    className="w-full px-4 py-3 border-b border-gray-100 dark:border-border flex items-center justify-between text-xs font-bold text-gray-900 dark:text-foreground hover:bg-gray-50/50 cursor-pointer"
                  >
                    <span>Categories</span>
                    <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${catOpen ? "rotate-180" : ""}`} />
                  </button>
                  {catOpen && (
                    <div className="p-2 space-y-0.5">
                      {categoriesList.map((cat) => {
                        const Icon = cat.icon;
                        const isActive = selectedCategory === cat.value;
                        return (
                          <button
                            key={cat.value}
                            onClick={() => {
                              setSelectedCategory(cat.value);
                              setSidebarOpen(false);
                            }}
                            className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-all text-xs rounded-none cursor-pointer ${
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
                    className="w-full flex items-center justify-between border-b border-gray-100 dark:border-border pb-2 text-xs font-bold text-gray-900 dark:text-foreground cursor-pointer"
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
                            <Input
                              type="number"
                              placeholder="Min"
                              value={minPrice}
                              onChange={(e) => setMinPrice(e.target.value)}
                              className="h-8 pl-8 text-xs rounded-none border-gray-200 dark:border-border bg-gray-50/50"
                            />
                          </div>
                          <span className="text-gray-400 text-xs">-</span>
                          <div className="relative flex-1">
                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-gray-400">GH₵</span>
                            <Input
                              type="number"
                              placeholder="Max"
                              value={maxPrice}
                              onChange={(e) => setMaxPrice(e.target.value)}
                              className="h-8 pl-8 text-xs rounded-none border-gray-200 dark:border-border bg-gray-50/50"
                            />
                          </div>
                        </div>
                      </div>
                    </>
                  )}
                </div>

                {/* 3. Store Bio / Details Box */}
                <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-none shadow-2xs p-4 space-y-3">
                  <h4 className="text-xs font-black uppercase text-gray-900 dark:text-white flex items-center gap-2 border-b border-gray-100 dark:border-border pb-2">
                    <Store className="w-3.5 h-3.5 text-[#FF5500]" />
                    About This Store
                  </h4>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {vendor.store_description || "Verified student seller on Unimall."}
                  </p>
                  <div className="pt-2 border-t border-gray-100 dark:border-border text-[11px] space-y-1 text-gray-500">
                    <p className="flex items-center justify-between">
                      <span>Campus:</span> <strong className="text-gray-800 dark:text-gray-200">{vendor.campus || "University"}</strong>
                    </p>
                    {vendor.phone && (
                      <p className="flex items-center justify-between">
                        <span>Contact:</span> <strong className="text-[#FF5500]">{vendor.phone}</strong>
                      </p>
                    )}
                  </div>
                </div>

              </div>
            </aside>

            {/* ── MAIN PRODUCTS GRID DISPLAY (USES UNIMALLPRODUCTCARD) ── */}
            <div className="flex-1 min-w-0">
              {loadingProducts ? (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                  {[...Array(6)].map((_, i) => (
                    <div key={i} className="bg-white dark:bg-card h-[320px] sm:h-[380px] animate-pulse space-y-3 border border-gray-100 dark:border-border p-3">
                      <div className="aspect-square bg-gray-100 dark:bg-muted rounded-none" />
                      <div className="h-4 bg-gray-100 dark:bg-muted rounded-none w-3/4" />
                      <div className="h-6 bg-gray-100 dark:bg-muted rounded-none w-full" />
                    </div>
                  ))}
                </div>
              ) : processedProducts.length === 0 ? (
                <div className="bg-white dark:bg-card border border-gray-200/80 dark:border-border p-12 text-center rounded-none shadow-2xs">
                  <div className="w-16 h-16 bg-orange-50 dark:bg-orange-950/30 text-[#FF5500] rounded-none flex items-center justify-center mx-auto mb-4">
                    <Search className="w-7 h-7" />
                  </div>
                  <h3 className="text-base font-extrabold text-gray-900 dark:text-foreground mb-1">No products match your filter</h3>
                  <p className="text-xs text-gray-400 font-medium mb-6">Try clearing your price range or category search.</p>
                  <Button 
                    onClick={() => {
                      setSelectedCategory("All");
                      setSearchQuery("");
                      setPriceRange("all");
                      setMinPrice("");
                      setMaxPrice("");
                    }} 
                    className="rounded-none bg-[#FF5500] hover:bg-[#e54a00] font-bold text-xs px-6 h-9 uppercase tracking-wider cursor-pointer"
                  >
                    Reset All Filters
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-5 lg:gap-6">
                  {processedProducts.map((product) => {
                    const cardProduct = {
                      ...product,
                      image: product.image_url || product.image || (Array.isArray(product.images) && product.images[0]) || "https://images.unsplash.com/photo-1526170375885-4d8ecf77b99f?w=500",
                      vendor: vendor.store_name || vendor.full_name || "Vendor",
                      vendorId: id || "",
                    };
                    return (
                      <UnimallProductCard 
                        key={product.id} 
                        product={cardProduct} 
                      />
                    );
                  })}
                </div>
              )}
            </div>

          </div>

          {/* ══════════════════════ 4 TRUST VALUE PILLARS (BOTTOM OF STORE) ══════════════════════ */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-10">
            <div className="p-3.5 rounded-none bg-white dark:bg-card border border-gray-200/80 dark:border-border flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-none bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] flex items-center justify-center shrink-0">
                <Truck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">Campus Delivery</h4>
                <p className="text-[10px] text-gray-500 font-medium truncate">Hostel & Hall Dropoffs</p>
              </div>
            </div>

            <div className="p-3.5 rounded-none bg-white dark:bg-card border border-gray-200/80 dark:border-border flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-none bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">Buyer Protection</h4>
                <p className="text-[10px] text-gray-500 font-medium truncate">Inspect before payment</p>
              </div>
            </div>

            <div className="p-3.5 rounded-none bg-white dark:bg-card border border-gray-200/80 dark:border-border flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-none bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center shrink-0">
                <Zap className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">Fast Response</h4>
                <p className="text-[10px] text-gray-500 font-medium truncate">Replies in &lt; 15 mins</p>
              </div>
            </div>

            <div className="p-3.5 rounded-none bg-white dark:bg-card border border-gray-200/80 dark:border-border flex items-center gap-3 shadow-2xs">
              <div className="w-9 h-9 rounded-none bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center shrink-0">
                <Award className="w-4.5 h-4.5" />
              </div>
              <div className="min-w-0">
                <h4 className="text-xs font-black text-gray-900 dark:text-white truncate">Verified Merchant</h4>
                <p className="text-[10px] text-gray-500 font-medium truncate">Active student business</p>
              </div>
            </div>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VendorStore;
