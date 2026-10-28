import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Search, MapPin, Star, ShieldCheck, TrendingUp, Users, ArrowRight, ChevronRight, 
  ChevronLeft, ChevronDown, Menu, Phone, Store 
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { api } from "@/integrations/api/client";
import { UnimallVerifiedBadge } from "@/components/common/UnimallVerifiedBadge";
import { PRODUCT_CATEGORIES } from "@/lib/categories";


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
  const { user, profile, role, vendorStatus } = useAuth();
  const { getSetting, supportPhone } = useSiteSettingsContext();
  const vendorsCtaImageUrl = getSetting("vendors_cta_image_url", "https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2000") as string;
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";
  

  // Fetch registered vendor profiles dynamically (optimized single query)
  const { data: dbVendors = [], isLoading, error: vendorsError, refetch } = useQuery({
    queryKey: ["vendors-list", user?.id, profile?.store_name, profile?.avatar_url],
    staleTime: 0,
    refetchInterval: 15000,
    refetchOnMount: "always",
    queryFn: async () => {
      const { data, error } = await (api as any).from("public_vendor_directory").select("*").order("name");
      if (error) throw error;
      return Array.isArray(data) ? data : [];
    }
  });

  const allVendors = Array.isArray(dbVendors) ? dbVendors : [];
  const categories = ["All", ...PRODUCT_CATEGORIES.map(category => category.label), ...new Set<string>(allVendors.map((vendor: any) => vendor.category).filter((category: string) => category && !PRODUCT_CATEGORIES.some(item => item.label === category)))];

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
        {/* Full-Bleed Hero Banner (Edge-to-Edge Background with Site-Aligned Content) */}
        <div className="relative w-full bg-[#f4f6fa] border-b border-gray-200/80 shadow-2xs mb-6 overflow-hidden">
          <div className="max-w-[1280px] mx-auto px-4 xl:px-0 relative min-h-[400px] md:min-h-[460px] flex items-center">
            
            {/* Left Nav Arrow Circle Button */}
            <button
              type="button"
              onClick={() => {
                const grid = document.getElementById("vendors-grid");
                grid?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:flex absolute left-3 xl:-left-14 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-gray-400 hover:text-[#FF5500] hover:border-[#FF5500]/50 hover:scale-105 transition-all z-20"
              aria-label="Previous"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {/* Right Nav Arrow Circle Button */}
            <button
              type="button"
              onClick={() => {
                const grid = document.getElementById("vendors-grid");
                grid?.scrollIntoView({ behavior: "smooth" });
              }}
              className="hidden sm:flex absolute right-3 xl:-right-14 top-1/2 -translate-y-1/2 w-9 h-9 md:w-11 md:h-11 rounded-full bg-white shadow-md border border-gray-200 items-center justify-center text-gray-400 hover:text-[#FF5500] hover:border-[#FF5500]/50 hover:scale-105 transition-all z-20"
              aria-label="Next"
            >
              <ChevronRight className="w-5 h-5" />
            </button>

            <div className="w-full flex flex-col md:flex-row items-center justify-between px-10 sm:px-14 xl:px-0 py-8 md:py-6">
              
              {/* Left Column: Aligns with site content line */}
              <div className="w-full md:w-1/2 z-10 text-left py-4 md:py-6">
                {/* Tag */}
                <p className="text-sm md:text-base font-bold text-gray-800 tracking-tight mb-2.5">
                  Trade-in Offer
                </p>

                {/* Main Heading with Site Color Accent */}
                <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-gray-950 tracking-tight leading-[1.08] mb-3">
                  Supper Value <br />
                  Deals <br />
                  <span className="text-[#FF5500]">On All Products</span>
                </h1>

                {/* Subtitle */}
                <p className="text-xs sm:text-sm md:text-base text-gray-500 font-medium mb-7 max-w-md">
                  Save more with coupons &amp; up to 70% off
                </p>

                {/* SHOP NOW Button in Site Color */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      const grid = document.getElementById("vendors-grid");
                      grid?.scrollIntoView({ behavior: "smooth" });
                    }}
                    className="h-11 px-7 bg-[#FF5500] hover:bg-[#e54a00] text-white font-extrabold text-xs uppercase tracking-wider rounded-full shadow-md shadow-orange-500/25 transition-all flex items-center gap-2 group active:scale-95"
                  >
                    <span>SHOP NOW</span>
                    <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                  </button>
                </div>
              </div>

              {/* Right Column: Student with Laptop Cutout (No background box!) */}
              <div className="w-full md:w-1/2 flex justify-center md:justify-end relative mt-6 md:mt-0">
                <div className="relative w-full max-w-[460px] md:max-w-[540px] aspect-[4/3] sm:aspect-[16/10] md:aspect-[16/11] flex items-center justify-center">
                  <img
                    src="/assets/student_laptop_cutout.png"
                    alt="Super Value Deals on All Products"
                    className="w-full h-full object-contain pointer-events-none select-none drop-shadow-md"
                  />
                </div>
              </div>

            </div>

            {/* Bottom Center Indicator Dots in Site Color */}
            <div className="absolute bottom-4 left-1/2 -translate-y-1/2 -translate-x-1/2 flex items-center gap-1.5 z-10 select-none">
              <span className="w-5 h-1.5 rounded-full bg-[#FF5500]" />
              <span className="w-1.5 h-1.5 rounded-full bg-gray-300" />
            </div>

          </div>
        </div>

        <div id="vendors-grid" className="max-w-[1280px] mx-auto px-4 xl:px-0 space-y-6">

          {/* Sticky Tab Category selectors */}
          <div className="bg-white shadow-sm border border-gray-200 p-1 overflow-x-auto no-scrollbar flex gap-1">
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
                Approved Vendors ({filteredVendors.length})
              </h2>
              <div className="flex items-center gap-1.5 text-xs text-gray-500 font-bold">
                <TrendingUp className="w-3.5 h-3.5 text-[#FF5500]" />
                <span>Trending on campus</span>
              </div>
            </div>

            {/* Vendors list grid */}
            {vendorsError ? (
              <div role="alert" className="bg-white border p-6 space-y-3"><p>Could not load stores. {vendorsError.message}</p><Button onClick={() => refetch()}>Try again</Button></div>
            ) : isLoading ? <p role="status" className="bg-white p-6">Loading stores...</p> : filteredVendors.length > 0 ? (
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



        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vendors;
