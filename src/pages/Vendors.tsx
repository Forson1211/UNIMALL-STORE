import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, ShieldCheck, TrendingUp, Users, ArrowRight, ChevronRight, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

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
    <div className="relative h-32 md:h-36 overflow-hidden bg-gray-100 shrink-0">
      <img 
        src={vendor.banner} 
        alt={vendor.name} 
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
      
      {/* Category Badge */}
      <span className="absolute top-3 right-3 px-2 py-0.5 bg-black/30 border border-white/20 text-white text-[9px] font-black uppercase tracking-widest rounded-none">
        {vendor.category}
      </span>
    </div>

    <div className="relative px-4 pb-4 flex-1 flex flex-col">
      {/* Avatar (Floating) */}
      <div className="absolute -top-7 left-4 w-14 h-14 rounded-full bg-white p-0.5 shadow-md">
        <div className="w-full h-full bg-[#FF5500] rounded-full flex items-center justify-center text-white text-lg font-black uppercase">
          {vendor.avatar.substring(0, 1)}
        </div>
      </div>

      <div className="pt-8 flex-1 flex flex-col">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1.5 min-w-0">
            <h3 className="font-black text-base text-gray-900 group-hover:text-[#FF5500] transition-colors truncate">
              {vendor.name}
            </h3>
            {vendor.verified && (
              <ShieldCheck className="w-4 h-4 text-blue-500 shrink-0" />
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
  const { user, role } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";

  const categories = ["All", "Food", "Electronics", "Fashion", "Books", "Stationery", "Sports"];

  // Fetch registered vendor profiles dynamically
  const { data: dbVendors = [], isLoading } = useQuery({
    queryKey: ["vendors-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .not("store_name", "is", null);
      if (error) throw error;
      return data || [];
    }
  });

  // Combine database vendors and fallback mock vendors
  const allVendors = [
    ...(dbVendors || []).map((v: any) => ({
      id: v?.user_id || v?.id || "unknown",
      name: v?.store_name || v?.full_name || "Vendor Store",
      banner: v?.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800",
      avatar: (v?.store_name || v?.full_name || "V").charAt(0).toUpperCase(),
      description: v?.store_description || "Welcome to our storefront! We offer premium quality items at competitive campus prices.",
      campus: v?.campus || "University of Ghana",
      rating: 4.8,
      products: 10,
      verified: true,
      category: "General"
    })),
    ...mockVendors.filter(mv => !(dbVendors || []).some((dv: any) => dv?.store_name?.toLowerCase() === mv.name.toLowerCase()))
  ];

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
      vendor?.category === selectedCategory || 
      (selectedCategory === "General" && vendor?.category === "General");

    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-[#f1f1f2]">
      <Navbar />

      <main className="py-3">
        <div className="max-w-[1280px] mx-auto px-3 space-y-3">
          
          {/* Header Banner - Sleek card in gradient */}
          <div className="relative bg-gradient-to-r from-gray-900 via-gray-800 to-[#FF5500] shadow-sm p-6 md:p-10 flex flex-col justify-center text-white overflow-hidden">
            <div className="absolute right-0 top-0 w-1/3 h-full opacity-10 pointer-events-none transform skew-x-12 translate-x-12">
              <Store className="w-full h-full text-white" />
            </div>
            
            <div className="relative z-10 max-w-2xl">
              <span className="bg-white/20 backdrop-blur-sm border border-white/10 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm">
                Verified Campus Sellers
              </span>
              <h1 className="text-2xl md:text-4xl font-black uppercase tracking-tight mt-3 mb-2">
                Discover Campus Stores
              </h1>
              <p className="text-xs md:text-sm text-gray-200 font-medium mb-6 leading-relaxed max-w-lg">
                Trade safely with verified student-run ventures on your campus. Connect directly, order online, and pickup locally.
              </p>

              {/* Boxed Search */}
              <div className="flex gap-2 max-w-md bg-white p-1 rounded-sm shadow-lg">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search vendor or campus..."
                    className="w-full h-9 pl-9 pr-3 text-xs bg-transparent text-gray-850 outline-none placeholder-gray-400"
                  />
                </div>
                <button className="h-9 px-5 bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs uppercase tracking-wider rounded-sm transition-colors shrink-0">
                  Search
                </button>
              </div>
            </div>
          </div>

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
                src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2000" 
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
