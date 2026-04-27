import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, MapPin, Star, Package, ExternalLink, ShieldCheck, TrendingUp, Users, ArrowRight, Store } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

const mockVendors = [
  { 
    id: 1, 
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
    id: 2, 
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
    id: 3, 
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
    id: 4, 
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
    id: 5, 
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
    id: 6, 
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

const VendorCard = ({ vendor }: { vendor: typeof mockVendors[0] }) => (
  <div className="group bg-white rounded-none border border-gray-100 overflow-hidden hover:shadow-2xl transition-all duration-500 hover:-translate-y-1">
    {/* Banner Image */}
    <div className="relative h-40 overflow-hidden bg-gray-100">
      <img 
        src={vendor.banner} 
        alt={vendor.name} 
        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
      
      {/* Category Badge */}
      <span className="absolute top-4 right-4 px-3 py-1 bg-white/20 backdrop-blur-md border border-white/30 text-white text-[10px] font-black uppercase tracking-widest rounded-none">
        {vendor.category}
      </span>
    </div>

    <div className="relative px-6 pb-6">
      {/* Avatar (Floating) */}
      <div className="absolute -top-8 left-6 w-16 h-16 rounded-full bg-white p-1 shadow-xl">
        <div className="w-full h-full bg-[#FF5500] rounded-full flex items-center justify-center text-white text-xl font-black">
          {vendor.avatar}
        </div>
      </div>

      <div className="pt-10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <h3 className="font-black text-xl text-gray-900 group-hover:text-[#FF5500] transition-colors">
              {vendor.name}
            </h3>
            {vendor.verified && (
              <ShieldCheck className="w-5 h-5 text-blue-500" />
            )}
          </div>
          <div className="flex items-center gap-1 bg-gray-50 px-2 py-1 rounded-none border border-gray-100">
            <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
            <span className="text-sm font-black">{vendor.rating}</span>
          </div>
        </div>

        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 mb-4">
          <MapPin className="w-3.5 h-3.5" />
          <span>{vendor.campus}</span>
        </div>

        <p className="text-sm text-gray-500 leading-relaxed mb-6 line-clamp-2">
          {vendor.description}
        </p>

        <div className="flex items-center justify-between pt-4 border-t border-gray-50">
          <div className="flex items-center gap-2">
             <div className="w-8 h-8 rounded-full bg-[#FF5500]/5 flex items-center justify-center">
                <Store className="w-4 h-4 text-[#FF5500]" />
             </div>
             <span className="text-[11px] font-black uppercase tracking-wider text-gray-400">{vendor.products} Products</span>
          </div>
          <Link to={`/vendor/${vendor.id}`}>
            <Button variant="ghost" className="text-[#FF5500] font-black text-xs uppercase tracking-widest hover:bg-orange-50 group-hover:gap-3 transition-all">
              Visit Store
              <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  </div>
);

const Vendors = () => {
  const { user, role } = useAuth();

  const isVendor = role === "vendor";
  const isAdmin = role === "admin";
  const showDashboard = user && (isVendor || isAdmin);
  const dashboardLink = isAdmin ? "/admin" : "/vendor";

  const categories = ["All", "Food", "Electronics", "Fashion", "Books", "Stationery", "Services"];

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <Navbar />

      <main className="pb-24">
        {/* Editorial Header */}
        <div className="relative py-24 lg:py-32 bg-white overflow-hidden border-b border-gray-100">
          <div className="absolute top-0 right-0 w-1/3 h-full bg-[#FF5500]/5 -skew-x-12 transform translate-x-20" />
          <div className="container mx-auto px-4 relative">
            <div className="max-w-3xl">
              <div className="inline-flex items-center gap-2 bg-[#FF5500]/10 text-[#FF5500] px-4 py-1.5 rounded-none text-[10px] font-black uppercase tracking-[0.2em] mb-6">
                <Users className="w-3.5 h-3.5" />
                Verified Community
              </div>
              <h1 className="text-5xl lg:text-7xl font-black text-gray-900 leading-[0.9] tracking-tighter mb-8">
                Discover Your <br />
                Campus <span className="text-[#FF5500]">Vendors</span>
              </h1>
              <p className="text-xl text-gray-500 font-medium leading-relaxed max-w-xl mb-12">
                Trade with confidence. Connect with thousands of verified student entrepreneurs across Ghana's top universities.
              </p>
              
              {/* Search Bar */}
              <div className="flex flex-col sm:flex-row gap-3 max-w-2xl">
                <div className="relative flex-1">
                  <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search by vendor name or campus..."
                    className="pl-14 h-16 rounded-none border-gray-200 text-base shadow-sm focus:ring-4 focus:ring-[#FF5500]/5 transition-all"
                  />
                </div>
                <Button className="h-16 px-10 bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-sm uppercase tracking-widest rounded-none shadow-xl shadow-orange-500/20">
                  Search
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-white border-b border-gray-100 sticky top-20 z-30">
          <div className="container mx-auto px-4">
            <div className="flex items-center gap-1 overflow-x-auto py-4 no-scrollbar">
              {categories.map((cat) => (
                <button
                  key={cat}
                  className={`px-6 py-2 text-xs font-black uppercase tracking-widest transition-all rounded-none border-b-2 ${
                    cat === "All" ? "border-[#FF5500] text-gray-900" : "border-transparent text-gray-400 hover:text-gray-600"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="container mx-auto px-4 mt-16">
          <div className="flex items-center justify-between mb-12">
            <h2 className="text-2xl font-black text-gray-900 tracking-tight">Top Rated Vendors</h2>
            <div className="flex items-center gap-2 text-sm font-bold text-gray-400">
              <TrendingUp className="w-4 h-4" />
              <span>Trending in University of Ghana</span>
            </div>
          </div>

          {/* Vendors Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {mockVendors.map((vendor) => (
              <VendorCard key={vendor.id} vendor={vendor} />
            ))}
          </div>

          {/* Premium CTA */}
          <div className="mt-32 bg-gray-900 relative overflow-hidden">
             <div className="absolute top-0 right-0 w-1/2 h-full opacity-20">
                <img 
                  src="https://images.unsplash.com/photo-1556761175-b413da4baf72?q=80&w=2000&auto=format&fit=crop" 
                  className="w-full h-full object-cover"
                />
             </div>
             <div className="relative z-10 p-12 lg:p-20 max-w-2xl text-white">
                <h2 className="text-4xl lg:text-6xl font-black leading-none mb-6">Start Your <br />Entrepreneur Journey.</h2>
                <p className="text-gray-400 text-lg mb-10 leading-relaxed font-medium">
                  Join 200+ student vendors who are already growing their business on Unimall. Professional tools, secure payments, and a massive customer base.
                </p>
                <Link to={showDashboard ? dashboardLink : "/signup?role=vendor"}>
                  <Button size="lg" className="h-16 px-12 bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-sm uppercase tracking-widest rounded-none shadow-2xl">
                    {showDashboard ? "Go to Dashboard" : "Become a Vendor Now"}
                    <ArrowRight className="ml-3 w-5 h-5" />
                  </Button>
                </Link>
             </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Vendors;
