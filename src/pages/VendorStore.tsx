import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Store, MapPin, Star, ShieldCheck, Phone, Search, ChevronRight,
  Package, ShoppingCart, Info, Check, Heart, HelpCircle
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

const VendorStore = () => {
  const { id } = useParams<{ id: string }>();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFollowing, setIsFollowing] = useState(false);

  // Fetch vendor profile
  const { data: vendor, isLoading: loadingVendor, error } = useQuery({
    queryKey: ["vendor-profile", id],
    queryFn: async () => {
      // Find the profile for this vendor
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", id)
        .single();

      if (error) {
        // Fallback: search in mockVendors if we need to show mock data
        const mockVendors = [
          { 
            user_id: "1", 
            store_name: "TechHub", 
            banner_url: "https://images.unsplash.com/photo-1519389950473-47ba0277781c?q=80&w=800",
            avatar_url: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100", 
            store_description: "Premium campus tech hub. We provide the latest gadgets, repair services, and student essentials with warranty.", 
            campus: "University of Ghana", 
            rating: 4.9, 
            phone: "0302740642",
            verified: true,
            category: "Electronics"
          },
          { 
            user_id: "2", 
            store_name: "BookWorm", 
            banner_url: "https://images.unsplash.com/photo-1497633762265-9d179a990aa6?q=80&w=800",
            avatar_url: "https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=100", 
            store_description: "Academic excellence starts here. Get new and gently used textbooks at prices that won't break the bank.", 
            campus: "KNUST", 
            rating: 4.7, 
            phone: "0244123456",
            verified: true,
            category: "Books"
          },
          { 
            user_id: "3", 
            store_name: "StyleCo", 
            banner_url: "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=800",
            avatar_url: "https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=100", 
            store_description: "Curated fashion for the modern student. Sustainable, trendy, and university-ready apparel.", 
            campus: "University of Ghana", 
            rating: 4.8, 
            phone: "0277987654",
            verified: true,
            category: "Fashion"
          }
        ];
        const mock = mockVendors.find(v => v.user_id === id);
        if (mock) return mock;
        throw error;
      }
      return data;
    },
    enabled: !!id,
  });

  // Fetch vendor products
  const { data: products = [], isLoading: loadingProducts } = useQuery({
    queryKey: ["vendor-store-products", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("storefront_products_view" as any)
        .select("*")
        .eq("vendor_id", id);
      
      if (error) throw error;
      return data || [];
    },
    enabled: !!id,
  });

  const handleAddToCart = (p: any) => {
    addItem({
      id: p.id,
      name: p.name,
      price: p.price,
      image: p.image,
      vendor: vendor?.store_name || vendor?.full_name || "Vendor",
      vendorId: id || "",
    });
    toast({
      title: "Added to cart",
      description: `${p.name} has been added to your cart.`,
    });
  };

  if (loadingVendor) {
    return (
      <div className="min-h-screen bg-[#f1f1f2]">
        <Navbar />
        <div className="pt-32 flex justify-center pb-20">
          <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
        </div>
        <Footer />
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen bg-[#f1f1f2]">
        <Navbar />
        <div className="pt-32 text-center pb-20">
          <h2 className="text-2xl font-bold">Vendor profile not found</h2>
          <Button className="mt-4 bg-[#FF5500] text-white rounded-none" onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
        <Footer />
      </div>
    );
  }

  // Filter products by search query
  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const banner = vendor.banner_url || "https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1200";

  return (
    <div className="min-h-screen bg-[#f1f1f2]">
      <Navbar />

      <main className="py-4">
        <div className="max-w-[1280px] mx-auto px-3">
          
          {/* Breadcrumb */}
          <div className="flex items-center gap-1.5 text-xs text-gray-500 mb-3 overflow-x-auto no-scrollbar whitespace-nowrap">
            <Link to="/" className="hover:text-gray-800 transition-colors">Home</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <Link to="/vendors" className="hover:text-gray-800 transition-colors">Vendors</Link>
            <ChevronRight className="w-3 h-3 text-gray-400" />
            <span className="text-gray-700 font-medium">{vendor.store_name || vendor.full_name || "Vendor Store"}</span>
          </div>

          {/* Vendor Cover Banner */}
          <div className="relative h-48 md:h-64 bg-gray-200 overflow-hidden shadow-sm border border-gray-100 mb-4">
            <img src={banner} alt="" className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/30 to-transparent" />
            
            {/* Overlay Info Block */}
            <div className="absolute bottom-4 left-4 right-4 flex flex-col md:flex-row md:items-end justify-between gap-4 text-white">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-white border-2 border-white shadow-xl flex items-center justify-center text-xl font-bold text-gray-900 shrink-0 overflow-hidden">
                  {vendor.avatar_url ? (
                    <img src={vendor.avatar_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-[#FF5500] text-white flex items-center justify-center text-2xl font-black">
                      {(vendor.store_name || vendor.full_name || "V").charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h1 className="text-xl md:text-3xl font-black">{vendor.store_name || vendor.full_name}</h1>
                    {(vendor.verified || vendor.verified !== false) && (
                      <ShieldCheck className="w-5 h-5 text-blue-400 shrink-0" />
                    )}
                  </div>
                  <p className="text-xs md:text-sm text-white/95 flex items-center gap-1 mt-1 font-medium">
                    <MapPin className="w-3.5 h-3.5" /> {vendor.campus || "Ghana Campuses"}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1 bg-white/20 border border-white/25 px-2.5 py-1 text-sm font-bold">
                  <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  <span>{vendor.rating || "4.8"}</span>
                </div>
                <button 
                  onClick={() => setIsFollowing(!isFollowing)}
                  className={`px-5 py-1.5 font-bold text-xs uppercase tracking-wider transition-all rounded-sm ${
                    isFollowing 
                      ? "bg-white text-gray-900 border border-white"
                      : "bg-[#FF5500] hover:bg-[#e54a00] text-white border border-[#FF5500]"
                  }`}
                >
                  {isFollowing ? "Following" : "Follow Store"}
                </button>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-3 items-start">
            
            {/* SIDEBAR: Vendor info details */}
            <div className="space-y-3 lg:col-span-1">
              <div className="bg-white shadow-sm border border-gray-100 p-4">
                <h3 className="text-xs font-bold text-gray-900 uppercase border-b border-gray-100 pb-2 mb-3">
                  Store Details
                </h3>
                <p className="text-xs text-gray-600 leading-relaxed mb-4">
                  {vendor.store_description || "Welcome to our storefront! We offer premium quality items at competitive campus prices."}
                </p>
                
                <div className="space-y-3.5 border-t border-gray-100 pt-3.5">
                  <div className="flex gap-2.5">
                    <Phone className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 leading-none">PHONE NUMBER</p>
                      <p className="text-xs font-bold text-gray-800 mt-1">{vendor.phone || "0302740642"}</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <Package className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 leading-none">TOTAL PRODUCTS</p>
                      <p className="text-xs font-bold text-gray-800 mt-1">{products.length} Items Listed</p>
                    </div>
                  </div>
                  <div className="flex gap-2.5">
                    <Star className="w-4 h-4 text-gray-400 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 leading-none">SELLER PERFORMANCE</p>
                      <p className="text-xs font-bold text-green-600 mt-1">Excellent (96% Score)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* MAIN PORTAL AREA: Products Grid */}
            <div className="lg:col-span-3 space-y-3">
              
              {/* Filter / Search Bar */}
              <div className="bg-white shadow-sm border border-gray-100 p-3 flex flex-col md:flex-row justify-between items-center gap-3">
                <h2 className="text-sm font-black text-gray-900 uppercase">
                  All Listed Products ({filteredProducts.length})
                </h2>
                
                <div className="relative w-full md:w-64">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search in store..."
                    className="w-full h-8 pl-9 pr-3 text-xs bg-gray-50 border border-gray-200 rounded-sm outline-none focus:bg-white focus:border-[#FF5500] transition-all"
                  />
                </div>
              </div>

              {/* Products List */}
              {filteredProducts.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                  {filteredProducts.map((p) => {
                    const discountPct = p.original_price && p.original_price > p.price
                      ? Math.round((1 - p.price / p.original_price) * 100)
                      : 0;
                    return (
                      <Link 
                        key={p.id}
                        to={`/products/${p.id}`}
                        className="group flex flex-col bg-white overflow-hidden hover:shadow-md transition-all border border-gray-100 hover:border-gray-200"
                      >
                        <div className="relative aspect-square overflow-hidden bg-gray-50 p-2">
                          <img src={p.image} alt={p.name} className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105" />
                          {discountPct > 0 && (
                            <span className="absolute top-1 right-1 bg-[#FF5500] text-white text-[10px] font-black px-1.5 py-0.5 leading-none">
                              -{discountPct}%
                            </span>
                          )}
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              handleAddToCart(p);
                            }}
                            className="absolute bottom-2 right-2 opacity-0 group-hover:opacity-100 bg-[#FF5500] text-white p-1.5 rounded-full shadow-lg transition-all hover:bg-[#e54a00]"
                          >
                            <ShoppingCart className="w-3.5 h-3.5" />
                          </button>
                        </div>
                        <div className="p-2 flex flex-col flex-1">
                          <h4 className="text-xs text-gray-700 font-medium line-clamp-2 leading-snug flex-1 min-h-[32px]">
                            {p.name}
                          </h4>
                          <div className="mt-1">
                            <p className="text-xs font-black text-gray-900">GH₵ {p.price.toLocaleString()}</p>
                            {p.original_price && p.original_price > p.price && (
                              <p className="text-[10px] text-gray-400 line-through">GH₵ {p.original_price.toLocaleString()}</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-white shadow-sm border border-gray-100 p-8 text-center">
                  <Store className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-sm font-semibold text-gray-700">No products found</p>
                  <p className="text-xs text-gray-500 mt-1">This vendor hasn't posted any products matching your query yet.</p>
                </div>
              )}

            </div>

          </div>

        </div>
      </main>

      <Footer />
    </div>
  );
};

export default VendorStore;
