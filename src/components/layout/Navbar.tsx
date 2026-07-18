import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  X, ShoppingCart, Store, Search, Heart, ChevronDown, User, ShoppingBag,
  Zap, Phone, Truck
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useSearch } from "@/contexts/SearchContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import BottomTabBar from "@/components/layout/BottomTabBar";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

const categoryLinks = PRODUCT_CATEGORIES.map((cat) => ({
  name: cat.label,
  icon: cat.icon,
  path: `/products?category=${encodeURIComponent(cat.label)}`,
}));

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const { totalItems, openCart } = useCart();
  const { openSearch } = useSearch();
  const { siteName } = useSiteSettingsContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    document.body.classList.add("has-bottom-tabbar");
    return () => document.body.classList.remove("has-bottom-tabbar");
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      {/* ── TIER 1: Top Announcement Bar ── */}
      <div className="hidden md:block bg-[#FF5500] text-white text-xs">
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0 flex items-center justify-between h-8">
          <Link to="/vendor" className="flex items-center gap-1.5 font-bold hover:underline">
            <Store className="w-3.5 h-3.5" />
            Sell on {siteName || "Unimall"}
          </Link>
          <div className="flex items-center gap-6 text-white/90">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 fill-yellow-300 text-yellow-300" /> Flash Deals Daily</span>
            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Free Delivery over GH₵ 100</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 0302740642</span>
          </div>
        </div>
      </div>

      {/* ── TIER 2: Main Header ── */}
      <header className={`sticky-header sticky top-0 z-50 w-full transition-all duration-300 ${scrolled ? "shadow-md" : ""} bg-white border-b border-gray-200`}>
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0">
          <div className="flex items-center gap-4 h-[68px]">

            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src="/LOGO.png" alt={siteName || "Unimall"} className="h-10 w-auto object-contain" />
            </Link>

            {/* Wide Search Bar */}
            <form onSubmit={handleSearch} className="flex-1 flex items-center h-10 max-w-2xl">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products, brands and categories"
                className="hidden md:block flex-1 h-full border border-gray-300 border-r-0 rounded-l-sm px-4 text-sm outline-none focus:border-[#FF5500] transition-colors bg-white"
              />
              <button
                type="submit"
                className="hidden md:flex h-full items-center gap-2 bg-[#FF5500] hover:bg-[#e54a00] text-white px-5 rounded-r-sm font-bold text-sm transition-colors shrink-0"
              >
                <Search className="w-4 h-4" />
                Search
              </button>
              {/* Mobile search icon */}
              <button
                type="button"
                onClick={openSearch}
                className="md:hidden p-2 text-gray-600 hover:text-[#FF5500] transition-colors"
              >
                <Search className="w-5 h-5" />
              </button>
            </form>

            {/* Right Actions */}
            <div className="flex items-center gap-1 shrink-0">
              {/* Account dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="hidden md:flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 transition-colors group text-sm">
                    <User className="w-4 h-4 text-gray-600" />
                    <span className="font-bold text-gray-700">
                      {user ? (profile?.full_name?.split(" ")[0] || "Account") : "Account"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded shadow-xl border-gray-100 p-2 mt-1">
                  {!user ? (
                    <div className="p-2 pb-3 border-b border-gray-100 mb-2">
                      <Link to="/login">
                        <Button className="w-full bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold h-10 rounded text-sm">
                          Sign In / Register
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-2 pb-3 border-b border-gray-100 mb-2 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        <AvatarFallback className="bg-[#FF5500] text-white font-bold text-xs">
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold">{profile?.full_name || "User"}</p>
                        <p className="text-xs text-gray-500 capitalize">{role || "Buyer"}</p>
                      </div>
                    </div>
                  )}
                  <Link to="/account" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 rounded transition-colors">
                    <User className="w-4 h-4 text-gray-400" /> My Account
                  </Link>
                  <Link to="/account/orders" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 rounded transition-colors">
                    <ShoppingBag className="w-4 h-4 text-gray-400" /> Orders
                  </Link>
                  <Link to="/account/wishlist" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 text-sm text-gray-700 rounded transition-colors">
                    <Heart className="w-4 h-4 text-gray-400" /> Wishlist
                  </Link>
                  {user && (
                    <>
                      <DropdownMenuSeparator className="my-1" />
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 text-sm text-red-500 font-bold rounded transition-colors"
                      >
                        <X className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Help */}
              <Link to="/faqs" className="hidden lg:flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 transition-colors text-sm text-gray-700 font-bold">
                Help
                <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
              </Link>

              {/* Cart */}
              <button
                onClick={openCart}
                className="flex items-center gap-2 px-3 py-2 rounded hover:bg-gray-50 transition-colors relative"
              >
                <div className="relative">
                  <ShoppingCart className="w-5 h-5 text-gray-600" />
                  {totalItems > 0 && (
                    <span className="absolute -top-2 -right-2 w-4 h-4 bg-[#FF5500] text-[10px] text-white rounded-full flex items-center justify-center font-bold">
                      {totalItems}
                    </span>
                  )}
                </div>
                <span className="hidden md:block font-bold text-sm text-gray-700">Cart</span>
              </button>

              {/* Sell CTA — mobile only */}
              <Link to="/vendor" className="md:hidden">
                <Button className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold rounded text-xs px-3 h-8">
                  SELL
                </Button>
              </Link>
            </div>
          </div>
        </div>

      </header>

      <BottomTabBar />
    </>
  );
};

export default Navbar;
