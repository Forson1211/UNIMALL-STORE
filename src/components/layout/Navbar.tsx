import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Menu, X, ShoppingCart, Store, Search, Heart, ChevronDown, User } from "lucide-react";
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
                className={`px-4 py-2 rounded-none text-sm font-bold transition-all ${isActive(link.path) ? "text-[#FF5500] bg-orange-50" : "text-gray-500 hover:text-gray-900 hover:bg-gray-50"}`}
              >
                {link.name}
              </Link>
            ))}
          </div>

          {/* Right Section: Search & Actions */}
          <div className="flex items-center gap-3">
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

            {/* Cart */}
            <button onClick={openCart} className="relative p-2.5 text-gray-500 hover:text-gray-900 transition-colors">
              <ShoppingCart className="w-5 h-5" />
              {totalItems > 0 && (
                <span className="absolute top-1.5 right-1.5 w-4 h-4 bg-[#FF5500] text-[10px] text-white rounded-none flex items-center justify-center font-bold">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User / Auth */}
            <div className="h-8 w-px bg-gray-100 mx-1 hidden sm:block" />
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 p-1 pl-1 pr-3 rounded-none hover:bg-gray-50 transition-all border border-transparent hover:border-gray-100">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-orange-500 text-white text-xs font-bold">
                        {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <span className="text-sm font-bold text-gray-700 hidden lg:block">{profile?.full_name?.split(" ")[0] || "User"}</span>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56 rounded-none shadow-xl border-gray-100">
                  <DropdownMenuLabel className="font-bold">My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild><Link to="/account">Profile</Link></DropdownMenuItem>
                  <DropdownMenuItem asChild><Link to="/account/orders">Orders</Link></DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem className="text-red-500 font-bold" onClick={signOut}>Sign out</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Link to="/login" className="hidden sm:block">
                <Button variant="ghost" className="text-sm font-bold text-gray-600 hover:text-[#FF5500]">Login</Button>
              </Link>
            )}

            <Link to="/vendor">
              <Button className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold rounded-none px-6 shadow-lg shadow-orange-500/20">
                SELL
              </Button>
            </Link>

            {/* Mobile Menu Toggle */}
            <button onClick={() => setIsOpen(!isOpen)} className="lg:hidden p-2 text-gray-500">
              {isOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {isOpen && (
        <div className="lg:hidden bg-white border-t border-gray-100 p-4 space-y-2 animate-fade-in shadow-xl">
          {navLinks.map((link) => (
            <Link key={link.path} to={link.path} onClick={() => setIsOpen(false)} className="block px-4 py-3 rounded-none text-base font-bold text-gray-600 hover:bg-gray-50 hover:text-[#FF5500]">
              {link.name}
            </Link>
          ))}
          
          <div className="pt-4 border-t border-gray-50 space-y-3">
            {!user && (
              <Link to="/login" onClick={() => setIsOpen(false)} className="block w-full text-center py-4 rounded-none font-bold text-gray-700 border border-gray-200">
                LOG IN / REGISTER
              </Link>
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
