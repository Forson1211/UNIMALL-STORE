import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, ShieldCheck, TrendingUp, Users, ArrowRight, ChevronRight, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { UnimallVerifiedBadge } from "@/components/common/UnimallVerifiedBadge";

const mockVendors = [
  { 
    id: "1", 
    name: "TechHub", 
    banner: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800&auto=format&fit=crop",
    avatar: "T", 
    description: "Premium campus tech hub. We provide the latest gadgets, repair services, and student essentials with warranty.", 
    campus: "University of Ghana", 
    rating: 4.9, 
    products: 45, 
    verified: true,
    category: "Electronics"
  },
  { 
    id: "2", 
    name: "BookWorm", 
    banner: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800&auto=format&fit=crop",
    avatar: "B", 
    description: "Academic excellence starts here. Get new and gently used textbooks at prices that won't break the bank.", 
    campus: "KNUST", 
    rating: 4.7, 
    products: 120, 
    verified: true,
    category: "Books"
  },
  { 
    id: "3", 
    name: "StyleCo", 
    banner: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800&auto=format&fit=crop",
    avatar: "S", 
    description: "Curated fashion for the modern student. Sustainable, trendy, and university-ready apparel.", 
    campus: "University of Ghana", 
    rating: 4.8, 
    products: 89, 
    verified: true,
    category: "Fashion"
  },
  { 
    id: "4", 
    name: "HealthyBites", 
    banner: "https://images.unsplash.com/photo-1547592166-23ac45744acd?q=80&w=800&auto=format&fit=crop",
    avatar: "H", 
    description: "Fuel your studies with organic snacks, healthy meal preps, and natural energy bars delivered on campus.", 
    campus: "UCC", 
    rating: 4.6, 
    products: 34, 
    verified: false,
    category: "Food"
  },
  { 
    id: "5", 
    name: "StudyMart", 
    banner: "https://images.unsplash.com/photo-1456735190827-d1262f71b8a3?q=80&w=800&auto=format&fit=crop",
    avatar: "M", 
    description: "Everything you need for your desk. High-quality stationery, art supplies, and organizational tools.", 
    campus: "Ashesi", 
    rating: 4.8, 
    products: 67, 
    verified: true,
    category: "Stationery"
  },
  { 
    id: "6", 
    name: "FitZone", 
    banner: "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=800&auto=format&fit=crop",
    avatar: "F", 
    description: "Your campus fitness partner. Professional gym wear, yoga equipment, and supplements.", 
    campus: "KNUST", 
    rating: 4.5, 
    products: 28, 
    verified: false,
    category: "Sports"
  },
];

const VendorCard = ({ vendor }: { vendor: any }) => (
  <div className="group bg-white rounded-none border border-gray-200 overflow-hidden hover:shadow-md transition-all duration-300 flex flex-col h-full">
    {/* Banner Image */}
    <div className="relative h-32 md:h-36 overflow-hidden bg-slate-900 shrink-0">
      {vendor.banner ? (
        <img 
          src={vendor.banner} 
          alt={vendor.name} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" 
        />
      ) : (
        <div className="w-full h-full bg-gradient-to-br from-[#0B132B] via-[#1C2541] to-[#3A506B] flex items-center justify-center">
          <div className="absolute inset-0 bg-[radial-gradient(#FF5500_1px,transparent_1px)] [background-size:16px_16px] opacity-15" />
          <Store className="w-10 h-10 text-white/20" />
        </div>
      )}
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Category Badge */}
      <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/40 backdrop-blur-sm border border-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-none">
        {vendor.category || "General"}
      </span>
    </div>

    <div className="relative px-4 pb-4 flex-1 flex flex-col">
      {/* Avatar (Floating) */}
      <div className="absolute -top-7 left-4 w-14 h-14 rounded-full bg-white p-0.5 shadow-md overflow-hidden">
        {vendor.avatar_url ? (
          <img 
            src={vendor.avatar_url} 
            alt={vendor.name} 
            className="w-full h-full rounded-full object-cover" 
          />
        ) : (
          <div className="w-full h-full bg-[#FF5500] rounded-full flex items-center justify-center text-white text-lg font-black uppercase">
            {typeof vendor.avatar === "string" && vendor.avatar.length > 0
              ? vendor.avatar.charAt(0).toUpperCase()
              : (vendor.name || "V").charAt(0).toUpperCase()}
          </div>
        )}
      </div>

      <div className="pt-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-black text-base text-gray-900 group-hover:text-[#FF5500] transition-colors truncate">
              {vendor.name}
            </h3>
            {vendor.verified && (
              <UnimallVerifiedBadge size={16} color="#FF5500" title="Verified Pro Merchant" />
            )}
          </div>
          <div className="flex items-center gap-0.5 bg-gray-50 px-1.5 py-0.5 rounded-none border border-gray-100 shrink-0">
            <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
            <span className="text-xs font-black">{vendor.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-gray-400 mb-3">
          <MapPin className="w-3 h-3" />
          <span className="truncate">{vendor.campus}</span>
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-4 line-clamp-2">
          {vendor.description}
        </p>

        <div className="flex items-center justify-between pt-3.5 border-t border-gray-100 mt-auto">
          <div className="flex items-center gap-1.5">
             <div className="w-6.5 h-6.5 rounded-full bg-[#FF5500]/5 flex items-center justify-center">
                <Store className="w-3.5 h-3.5 text-[#FF5500]" />
             </div>
             <span className="text-[10px] font-black uppercase tracking-wider text-gray-400">{vendor.products} Products</span>
          </div>
          <Link to={`/vendors/${vendor.id}`}>
            <Button variant="ghost" className="text-[#FF5500] font-black text-[11px] uppercase tracking-wider h-8 p-0 hover:bg-transparent hover:underline hover:text-[#e54a00] flex items-center gap-0.5">
              Visit Store
              <ChevronRight className="w-3.5 h-3.5" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const Vendors = () => {
  const { user, profile, role } = useAuth();
  const { getSetting } = useSiteSettingsContext();
  const vendorsCtaImageUrl = getSetting("vendors_cta_image_url", "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2000") as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";
  
  const categories = ["All", "Food", "Electronics", "Fashion", "Books", "Stationery", "Sports"];

  // Fetch registered vendor profiles dynamically (optimized single query)
  const { data: dbVendors = [], isLoading } = useQuery({
    queryKey: ["vendors-list", user?.id, profile?.store_name, profile?.avatar_url],
    staleTime: 1000 * 60 * 5,
    queryFn: async () => {
      const publicVendorsMap = new Map<string, any>();

      // 1. Fetch vendor profiles with explicit lightweight column projection
      try {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, user_id, store_name, full_name, avatar_url, banner_url, campus, store_description, verified, rating, store_category, role, vendor_status")
          .or("role.eq.vendor,vendor_status.eq.approved,store_name.not.is.null")
          .limit(60);

        if (!error && data) {
          data.forEach((p: any) => {
            const uid = p.user_id || p.id;
            const sName = p.store_name || p.full_name || "Campus Merchant";
            publicVendorsMap.set(uid, {
              id: uid,
              name: sName,
              banner: p.banner_url || "",
              avatar: sName.charAt(0).toUpperCase(),
              avatar_url: p.avatar_url || null,
              description: p.store_description || "Official campus merchant storefront on Unimall.",
              campus: p.campus || "University Campus",
              rating: Number(p.rating) || 5.0,
              products: 5,
              verified: p.verified !== false,
              is_pro: p.verified !== false,
              category: p.store_category || "General",
            });
          });
        }
      } catch (e) {}

      // 2. Scan local storage for any custom vendor profiles
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("unimall_vendor_profile_")) {
            const uid = key.replace("unimall_vendor_profile_", "");
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.store_name) {
                const sName = parsed.store_name || parsed.full_name || "Campus Merchant";
                publicVendorsMap.set(uid, {
                  id: uid,
                  name: sName,
                  banner: parsed.banner_url || "",
                  avatar: sName.charAt(0).toUpperCase(),
                  avatar_url: parsed.avatar_url || null,
                  description: parsed.store_description || "Official campus merchant storefront on Unimall.",
                  campus: parsed.campus || "University Campus",
                  rating: 5.0,
                  products: 5,
                  verified: true,
                  is_pro: true,
                  category: parsed.store_category || "General",
                });
              }
            }
          }
        }
      } catch (e) {}

      const list = Array.from(publicVendorsMap.values());
      return list;
    }
  });

  const allVendors = dbVendors;

  // Filter vendors based on query and category selection
  const filteredVendors = allVendors.filter(vendor => {
    const nameStr = vendor?.name || "";
    const campusStr = vendor?.campus || "";
    const descStr = vendor?.description || "";
    
    const matchesSearch = 
      nameStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      campusStr.toLowerCase().includes(searchQuery.toLowerCase()) ||
      descStr.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesCategory = 
      selectedCategory === "All" || 
      vendor?.category?.toLowerCase() === selectedCategory.toLowerCase();

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f1f1f2] dark:bg-background">
      <Navbar />

      <main className="pb-16">
        {/* Full-Bleed Header Banner (100% Screen Width) with Photographic Background */}
        <div className="relative w-full bg-slate-950 shadow-md py-12 md:py-16 text-white overflow-hidden mb-6 group">
          {/* Bright, Vivid Background Image with Clean Left-Sided Text Contrast Gradient */}
          <img 
            src={vendorsCtaImageUrl || "https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?q=80&w=2000&auto=format&fit=crop"} 
            alt="Campus Stores" 
            className="absolute inset-0 w-full h-full object-cover opacity-75 group-hover:scale-105 transition-transform duration-1000"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/90 via-black/55 to-black/15 z-0" />
          
          <div className="max-w-[1280px] mx-auto px-4 xl:px-0 relative z-10">
            <div className="max-w-2xl">
              <span className="bg-white/20 backdrop-blur-sm border border-white/10 text-white text-[9.5px] font-black uppercase tracking-wider px-2.5 py-0.5 rounded-none inline-block">
                Verified Campus Sellers
              </span>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-black uppercase tracking-tight mt-3 mb-2 text-white drop-shadow-sm">
                Discover Campus Stores
              </h1>
              <p className="text-xs md:text-sm text-gray-200 font-medium mb-6 leading-relaxed max-w-lg">
                Trade safely with verified student-run ventures on your campus. Connect directly, order online, and pickup locally.
              </p>

              {/* Boxed Search */}
              <div className="flex gap-2 max-w-md bg-white p-1 rounded-none shadow-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vendor or campus..."
                    className="w-full h-9 pl-9 pr-3 text-xs bg-transparent text-gray-900 outline-none placeholder-gray-400"
                  />
                </div>
                <button className="h-9 px-6 bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs uppercase tracking-wider rounded-none transition-colors shrink-0">
                  Search
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-[1280px] mx-auto px-4 xl:px-0 space-y-6">

          {/* Sticky Tab Category selectors */}
          <div className="bg-white shadow-sm border border-gray-100 p-1 overflow-x-auto no-scrollbar flex gap-1">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-5 py-2 text-xs font-black uppercase tracking-wider shrink-0 transition-colors ${
                  selectedCategory === cat 
                    ? "bg-[#FF5500] text-white" 
                    : "text-gray-500 hover:text-gray-800 hover:bg-gray-50"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Main Content Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black text-gray-900 uppercase">
                Active Verified Vendors ({filteredVendors.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Trending on campus</span>
              </div>
            </div>

            {/* Vendors list grid */}
            {filteredVendors.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {filteredVendors.map((vendor) => (
                  <VendorCard key={vendor.id} vendor={vendor} />
                ))}
              </div>
            ) : (
              <div className="bg-white shadow-sm p-12 text-center border border-gray-150">
                <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="text-sm font-bold text-gray-800">No vendors found</p>
                <p className="text-xs text-gray-500 mt-1">Try adjusting your filters or search keywords.</p>
              </div>
            )}
          </div>

          {/* Bottom Call-to-action banner card */}
          <div className="relative bg-gray-900 shadow-sm p-8 md:p-12 overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
              <img 
                src={vendorsCtaImageUrl} 
                className="w-full h-full object-cover" 
                alt=""
              />
            </div>
            
            <div className="relative z-10 text-white max-w-xl text-center md:text-left">
              <h2 className="text-xl md:text-3xl font-black leading-tight">
                LAUNCH YOUR CAMPUS VENTURE
              </h2>
              <p className="text-xs md:text-sm text-gray-400 mt-2 font-medium">
                Join 200+ verified student vendors who sell products directly to students at Ghana's top universities. Setup your storefront inside 5 minutes!
              </p>
            </div>
            
            <Link to={showDashboard ? dashboardLink : "/signup?role=vendor"} className="relative z-10 shrink-0">
              <Button className="h-12 px-8 bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs uppercase tracking-wider rounded-sm shadow-lg shadow-orange-500/10">
                {showDashboard ? "Go to seller portal" : "Become a vendor now"}
                <ArrowRight className="ml-2 w-4 h-4" />
              </Button>
            </Link>
          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vendors;
