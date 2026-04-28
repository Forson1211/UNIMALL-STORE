import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, Store, Search, Heart, ChevronDown, User, ShoppingBag } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useSearch } from "@/contexts/SearchContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const location = useLocation();
  const { user, profile, role, signOut, isLoading } = useAuth();
  const { totalItems, openCart } = useCart();
  const { openSearch } = useSearch();
  const { siteName, logoUrl } = useSiteSettingsContext();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { name: "Home", path: "/" },
    { name: "Shop", path: "/products" },
    { name: "Vendors", path: "/vendors" },
    { name: "News", path: "/news" },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className={`sticky top-0 left-0 right-0 z-50 transition-all duration-300 ${scrolled ? "bg-white/95 shadow-sm backdrop-blur-md" : "bg-white border-b border-gray-100"}`}>
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-20 gap-8">
          
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src="/LOGO.png" alt={siteName || "Unimall"} className="h-10 md:h-14 w-auto object-contain" />
          </Link>

          {/* Centered Navigation Links */}
          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`px-4 py-2 rounded-none text-base font-bold transition-all ${isActive(link.path) ? "text-[#FF5500] bg-orange-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section: Search & Actions */}
          <div className="flex items-center gap-1 md:gap-3">
            {/* Minimal Search */}
            <div className="hidden md:flex items-center relative group">
              <Search className="absolute left-3 w-4 h-4 text-gray-400 group-focus-within:text-[#FF5500] transition-colors" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-40 lg:w-60 h-10 pl-10 pr-4 bg-gray-50 border border-transparent rounded-none text-sm outline-none focus:bg-white focus:border-orange-200 focus:ring-4 focus:ring-orange-500/5 transition-all"
              />
            </div>

            {/* Search - Mobile */}
            <button onClick={openSearch} className="lg:hidden p-1.5 text-gray-500 hover:text-gray-900 transition-colors rounded-none">
              <Search className="w-5 h-5" />
            </button>

            {/* Cart */}
            <button onClick={openCart} className="relative p-1.5 md:p-2.5 text-gray-500 hover:text-gray-900 transition-colors rounded-none">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF5500] text-[11px] text-white rounded-none flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User / Auth Dropdown */}
            <div className="h-8 w-px bg-gray-100 mx-1 hidden sm:block" />
            
            <div className="hidden lg:block">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 py-2 px-4 rounded-none hover:bg-gray-100 transition-all bg-gray-50 border border-transparent hover:border-gray-200 group">
                    <User className="w-5 h-5 text-gray-700 group-hover:text-primary transition-colors" />
                    <span className="text-base font-bold text-gray-700">Account</span>
                    <ChevronDown className="w-4 h-4 text-gray-400 group-hover:text-primary transition-all" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-none shadow-[0_20px_50px_rgba(0,0,0,0.15)] border-gray-100 p-5 mt-2">
                  {!user ? (
                    <div className="pb-4 border-b border-gray-100 mb-4">
                      <Link to="/login">
                        <Button className="w-full bg-[#FF5500] hover:bg-[#e54a00] text-white font-black h-12 rounded-none shadow-lg shadow-orange-500/20 text-base uppercase tracking-widest">
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="pb-4 border-b border-gray-100 mb-4 flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-primary text-white font-black text-sm">
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-gray-900 leading-tight">{profile?.full_name || "User"}</span>
                        <span className="text-[10px] text-gray-500 font-bold uppercase tracking-wider">{role || "Buyer"}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1">
                    <Link to="/account" className="flex items-center gap-4 p-3 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all group">
                      <User className="w-5 h-5 text-gray-400 group-hover:text-primary" /> 
                      My Account
                    </Link>
                    <Link to="/account/orders" className="flex items-center gap-4 p-3 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all group">
                      <ShoppingBag className="w-5 h-5 text-gray-400 group-hover:text-primary" /> 
                      Orders
                    </Link>
                    <Link to="/account/wishlist" className="flex items-center gap-4 p-3 hover:bg-gray-50 text-gray-700 font-bold text-sm transition-all group">
                      <Heart className="w-5 h-5 text-gray-400 group-hover:text-primary" /> 
                      Wishlist
                    </Link>
                  </div>

                  {user && (
                    <div className="mt-4 pt-4 border-t border-gray-100">
                      <button 
                        onClick={signOut} 
                        className="w-full flex items-center justify-between p-3 hover:bg-red-50 text-red-500 font-black text-xs uppercase tracking-widest transition-all"
                      >
                        Sign out
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            <Link to="/vendor" className="hidden sm:block">
              <Button className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold rounded-none px-6 shadow-lg shadow-orange-500/20">
                SELL
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-1.5 text-gray-500 rounded-none">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-4 animate-fade-in shadow-xl">
          {/* Mobile Profile Section */}
          {user && (
            <div className="flex items-center gap-3 p-4 bg-orange-50/50 rounded-none border border-orange-100">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="bg-orange-500 text-white text-lg font-bold">
                  {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col">
                <span className="text-base font-bold text-gray-900">{profile?.full_name || "User"}</span>
                <span className="text-sm text-gray-500 truncate max-w-[180px]">{user.email}</span>
              </div>
            </div>
          )}

          <div className="space-y-1">
            {navLinks.map((link) => (
              <Link 
                key={link.path} 
                to={link.path} 
                onClick={() => setIsOpen(false)} 
                className={`block px-4 py-3 rounded-none text-base font-bold transition-all ${isActive(link.path) ? "text-[#FF5500] bg-orange-50" : "text-gray-600 hover:bg-gray-50 hover:text-[#FF5500]"}`}
              >
                {link.name}
              </Link>
            ))}
          </div>
          
          <div className="pt-4 border-t border-gray-100 space-y-3">
            {user ? (
              <div className="space-y-1 bg-gray-50 p-2 border border-gray-100">
                <Link to="/account" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-none text-sm font-black text-gray-700 uppercase tracking-widest hover:bg-white transition-all">
                  <User className="w-5 h-5 text-primary" /> Profile
                </Link>
                <Link to="/account/orders" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-none text-sm font-black text-gray-700 uppercase tracking-widest hover:bg-white transition-all">
                  <ShoppingBag className="w-5 h-5 text-primary" /> Orders
                </Link>
                <Link to="/account/wishlist" onClick={() => setIsOpen(false)} className="flex items-center gap-4 px-4 py-4 rounded-none text-sm font-black text-gray-700 uppercase tracking-widest hover:bg-white transition-all">
                  <Heart className="w-5 h-5 text-primary" /> Wishlist
                </Link>
                <button 
                  onClick={() => { signOut(); setIsOpen(false); }} 
                  className="flex items-center justify-between w-full px-4 py-4 rounded-none text-sm font-black text-red-500 uppercase tracking-widest hover:bg-red-50 transition-all border-t border-gray-200 mt-2"
                >
                  Sign out
                  <X className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <Link to="/login" onClick={() => setIsOpen(false)}>
                  <Button className="w-full bg-[#FF5500] text-white py-6 rounded-none font-black text-sm uppercase tracking-widest shadow-xl shadow-orange-500/20">
                    Sign In / Register
                  </Button>
                </Link>
                <div className="grid grid-cols-3 gap-2">
                   <Link to="/account" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 gap-2">
                      <User className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Account</span>
                   </Link>
                   <Link to="/account/orders" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 gap-2">
                      <ShoppingBag className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Orders</span>
                   </Link>
                   <Link to="/account/wishlist" onClick={() => setIsOpen(false)} className="flex flex-col items-center justify-center p-4 bg-gray-50 border border-gray-100 gap-2">
                      <Heart className="w-5 h-5 text-gray-400" />
                      <span className="text-[10px] font-black uppercase tracking-tighter">Wishlist</span>
                   </Link>
                </div>
              </div>
            )}
            <Link to="/vendor" onClick={() => setIsOpen(false)} className="block w-full bg-[#FF5500] text-white text-center py-4 rounded-none font-black shadow-lg shadow-orange-500/20">
              START SELLING
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
