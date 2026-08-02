import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  X, ShoppingCart, Store, Heart, ChevronDown, User, ShoppingBag,
  Zap, Phone, Truck, Search, Menu, LogOut, HelpCircle, MessageSquare, MessageCircle
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { PRODUCT_CATEGORIES } from "@/lib/categories";
import { SearchSuggestions } from "@/components/search/SearchSuggestions";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import MCBCartIcon from "@/components/common/MCBCartIcon";

const Navbar = () => {
  const [scrolled, setScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [drawerTab, setDrawerTab] = useState<"menu" | "categories">("menu");
  const searchWrapperRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile, role, signOut } = useAuth();
  const { totalItems, openCart } = useCart();
  const { siteName, logoUrl, announcementEnabled, announcementText, supportPhone, whatsappNumber } = useSiteSettingsContext();

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 10);
    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);


  useEffect(() => {
    document.body.classList.add("has-bottom-tabbar");
    return () => document.body.classList.remove("has-bottom-tabbar");
  }, []);

  // Listen to mobile menu toggle events from BottomTabBar or header
  useEffect(() => {
    const handleToggle = () => setIsMobileMenuOpen((prev) => !prev);
    const handleOpen = () => setIsMobileMenuOpen(true);
    const handleClose = () => setIsMobileMenuOpen(false);

    window.addEventListener("toggle-mobile-menu", handleToggle);
    window.addEventListener("open-mobile-menu", handleOpen);
    window.addEventListener("close-mobile-menu", handleClose);

    return () => {
      window.removeEventListener("toggle-mobile-menu", handleToggle);
      window.removeEventListener("open-mobile-menu", handleOpen);
      window.removeEventListener("close-mobile-menu", handleClose);
    };
  }, []);

  // Close drawer when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setShowSuggestions(false);
      setIsMobileMenuOpen(false);
    }
  };

  const isActive = (path: string) => location.pathname === path;

  return (
    <>
      {/* ── TIER 1: Top Announcement Bar (Desktop) ── */}
      <div className="hidden md:block bg-gray-50 text-gray-600 text-xs border-b border-gray-200">
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0 flex items-center justify-between h-8">
          <Link to="/vendor" className="flex items-center gap-1.5 font-bold text-gray-700 hover:text-[#FF5500] hover:underline transition-colors">
            <Store className="w-3.5 h-3.5" />
            Sell on {siteName || "Unimall"}
          </Link>
          <div className="flex items-center gap-6 text-gray-500">
            <span className="flex items-center gap-1"><Zap className="w-3 h-3 fill-[#FF5500] text-[#FF5500]" /> Flash Deals Daily</span>
            <span className="flex items-center gap-1"><Truck className="w-3 h-3" /> Free Delivery over GH₵ 100</span>
            <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> 0302740642</span>
          </div>
        </div>
      </div>

      <header className={`sticky-header sticky top-0 z-40 w-full transition-shadow duration-300 ${scrolled ? "shadow-md" : ""} bg-white dark:bg-card border-b border-gray-200 dark:border-border`}>
        {/* ── TIER 2: Main Header (Desktop + Mobile Header) ── */}
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0">

          {/* DESKTOP HEADER (md and up) */}
          <div className="hidden md:flex items-center justify-between gap-4 h-[68px]">
            {/* Logo */}
            <Link to="/" className="shrink-0">
              <img src="/LOGO.png" alt={siteName || "Unimall"} className="h-10 w-auto object-contain" />
            </Link>

            {/* Search Bar */}
            <div ref={searchWrapperRef} className="relative w-full max-w-md mx-4 lg:mx-8">
              <form onSubmit={handleSearch} className="relative flex items-center h-10 w-full">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setShowSuggestions(true)}
                  placeholder="Search products, brands and categories"
                  className="w-full h-full rounded-full border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted pl-11 pr-24 text-sm outline-none focus:border-[#FF5500] focus:bg-white dark:focus:bg-card transition-colors text-gray-800 dark:text-foreground"
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-1 top-1/2 -translate-y-1/2 px-5 h-8 rounded-full bg-[#FF5500] hover:bg-[#e54a00] text-white flex items-center justify-center font-bold text-xs transition-colors shrink-0 shadow-sm"
                >
                  Search
                </button>
              </form>
              {showSuggestions && (
                <SearchSuggestions query={searchQuery} onNavigate={() => setShowSuggestions(false)} />
              )}
            </div>

            {/* Right Actions */}
            <div className="flex items-center gap-2 lg:gap-4 shrink-0">
              {/* Help Dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-1.5 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-muted transition-colors text-sm font-bold text-gray-700 dark:text-foreground group">
                    <HelpCircle className="w-5 h-5 text-gray-700 dark:text-foreground stroke-[1.8]" />
                    <span className="font-bold text-gray-700 dark:text-foreground">Help</span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400 transition-transform duration-200 group-data-[state=open]:rotate-180" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72 rounded-none shadow-2xl border-gray-100 dark:border-border p-3 mt-1.5 bg-white dark:bg-card space-y-1 z-50">
                  <Link to="/faqs" className="block px-3.5 py-2.5 rounded-none text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-muted hover:text-[#FF5500] transition-colors">
                    Help Center
                  </Link>
                  <Link to="/how-it-works" className="block px-3.5 py-2.5 rounded-none text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-muted hover:text-[#FF5500] transition-colors">
                    Place an Order
                  </Link>
                  <Link to="/how-it-works#payment" className="block px-3.5 py-2.5 rounded-none text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-muted hover:text-[#FF5500] transition-colors">
                    Pay for Your Order
                  </Link>
                  <Link to="/account/orders" className="block px-3.5 py-2.5 rounded-none text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-muted hover:text-[#FF5500] transition-colors">
                    Delivery Timelines & Track your order
                  </Link>
                  <Link to="/how-it-works#cancellation" className="block px-3.5 py-2.5 rounded-none text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-muted hover:text-[#FF5500] transition-colors">
                    Cancel an Order
                  </Link>
                  <Link to="/how-it-works#refunds" className="block px-3.5 py-2.5 rounded-none text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-100/80 dark:hover:bg-muted hover:text-[#FF5500] transition-colors">
                    Returns & Refunds
                  </Link>

                  <DropdownMenuSeparator className="my-2 border-gray-100 dark:border-border" />

                  {/* Help Action Buttons: Live Chat & WhatsApp */}
                  <div className="space-y-2 pt-1">
                    <Link to="/how-it-works" className="w-full bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold h-10 rounded-none flex items-center justify-center gap-2 text-xs shadow-md shadow-orange-500/20 transition-all">
                      <MessageSquare className="w-4 h-4 fill-white text-[#FF5500]" />
                      <span>Live Chat</span>
                    </Link>

                    <a 
                      href={whatsappNumber ? `https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}` : "https://wa.me/233241234567"} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="w-full bg-white dark:bg-card hover:bg-green-50 dark:hover:bg-green-950/20 text-[#25D366] border-2 border-[#25D366] font-extrabold h-10 rounded-none flex items-center justify-center gap-2 text-xs transition-all"
                    >
                      <MessageCircle className="w-4.5 h-4.5 fill-[#25D366] text-white" />
                      <span>WhatsApp</span>
                    </a>
                  </div>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Cart */}
              <button
                onClick={openCart}
                className="flex items-center gap-2 px-3 py-2 rounded-none hover:bg-gray-50 dark:hover:bg-muted transition-colors relative"
              >
                <MCBCartIcon count={totalItems} iconClassName="w-6 h-6 text-gray-800 dark:text-white" />
                <span className="hidden md:block font-bold text-sm text-gray-700 dark:text-foreground">Cart</span>
              </button>

              {/* Account Dropdown */}
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 px-3 py-2 rounded-none hover:bg-gray-50 dark:hover:bg-muted transition-colors group text-sm">
                    <User className="w-5 h-5 text-gray-700 dark:text-foreground stroke-[1.8]" />
                    <span className="font-bold text-gray-700 dark:text-foreground">
                      {user ? (profile?.full_name?.split(" ")[0] || "Account") : "My account"}
                    </span>
                    <ChevronDown className="w-3.5 h-3.5 text-gray-400" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64 rounded-none shadow-xl border-gray-100 dark:border-border p-2 mt-1">
                  {!user ? (
                    <div className="p-2 pb-3 border-b border-gray-100 dark:border-border mb-2">
                      <Link to="/login">
                        <Button className="w-full bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold h-10 rounded-none text-sm">
                          Sign In / Register
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <div className="p-2 pb-3 border-b border-gray-100 dark:border-border mb-2 flex items-center gap-2">
                      <Avatar className="h-8 w-8">
                        {profile?.avatar_url && <AvatarImage src={profile.avatar_url} alt={profile?.full_name || "Profile"} />}
                        <AvatarFallback className="bg-[#FF5500] text-white font-bold text-xs">
                          {profile?.full_name?.charAt(0) || user.email?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-foreground">{profile?.full_name || "User"}</p>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground capitalize">{role || "Buyer"}</p>
                      </div>
                    </div>
                  )}
                  <Link to="/account" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-muted text-sm text-gray-700 dark:text-foreground rounded transition-colors">
                    <User className="w-4 h-4 text-gray-400" /> My Account
                  </Link>
                  <Link to="/account/orders" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-muted text-sm text-gray-700 dark:text-foreground rounded transition-colors">
                    <ShoppingBag className="w-4 h-4 text-gray-400" /> Orders
                  </Link>
                  <Link to="/account/wishlist" className="flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-muted text-sm text-gray-700 dark:text-foreground rounded transition-colors">
                    <Heart className="w-4 h-4 text-gray-400" /> Wishlist
                  </Link>
                  {user && (
                    <>
                      <DropdownMenuSeparator className="my-1 border-gray-100 dark:border-border" />
                      <button
                        onClick={signOut}
                        className="w-full flex items-center gap-3 px-3 py-2 hover:bg-red-50 dark:hover:bg-red-950/30 text-sm text-red-500 font-bold rounded transition-colors"
                      >
                        <X className="w-4 h-4" /> Sign Out
                      </button>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              <Link to="/vendor">
                <Button className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold rounded-none text-xs px-4 h-9">
                  SELL
                </Button>
              </Link>
            </div>
          </div>

          {/* MOBILE HEADER (md:hidden) — MCB RENTALS STYLE */}
          <div className="flex md:hidden items-center justify-between h-12 relative px-0">
            {/* Left: Hamburger Button */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-1.5 -ml-1.5 text-gray-700 dark:text-foreground hover:text-[#FF5500] transition-colors focus:outline-none"
              aria-label="Open mobile menu"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Center: Brand Logo */}
            <Link to="/" className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center">
              <img src="/LOGO.png" alt={siteName || "Unimall"} className="h-8 w-auto object-contain" />
            </Link>

            {/* Right: Cart Button with Badge */}
            <button
              onClick={openCart}
              className="relative p-1.5 -mr-1.5 text-gray-700 dark:text-foreground hover:text-[#FF5500] transition-colors focus:outline-none"
              aria-label="View Shopping Cart"
            >
              <MCBCartIcon count={totalItems} iconClassName="w-5 h-5 text-gray-800 dark:text-white" />
            </button>
          </div>

        </div>
      </header>

      {/* ── MOBILE SIDE DRAWER (SHEET - EXACT MCB RENTALS STYLE) ── */}
      <Sheet
        open={isMobileMenuOpen}
        onOpenChange={(open) => {
          setIsMobileMenuOpen(open);
          if (!open) {
            window.dispatchEvent(new CustomEvent("close-mobile-menu"));
          }
        }}
      >
        <SheetContent
          side="left"
          onOpenAutoFocus={(e) => e.preventDefault()}
          className="w-[72%] sm:w-[70%] max-w-[275px] p-0 bg-white dark:bg-card border-r border-gray-200 dark:border-border flex flex-col justify-between [&>button]:hidden"
        >
          <div className="overflow-y-auto flex-1">
            {/* Top Search Input & Close Header Bar (MCB Rentals style) */}
            <div className="p-3 border-b border-gray-200 dark:border-border bg-white dark:bg-card flex items-center gap-2">
              <form onSubmit={handleSearch} className="flex-1 relative flex items-center border border-gray-200 dark:border-border rounded-full bg-gray-50/70 dark:bg-muted px-3.5 h-10">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for products"
                  className="w-full h-full bg-transparent text-xs outline-none text-gray-800 dark:text-foreground placeholder-gray-400 font-medium pr-6"
                />
                <button type="submit" className="absolute right-2.5 text-gray-400 hover:text-[#FF5500]" aria-label="Search">
                  <Search className="w-4 h-4" />
                </button>
              </form>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 dark:hover:text-foreground transition-colors shrink-0"
                aria-label="Close menu"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dual Tabs Header: MENU vs CATEGORIES */}
            <div className="grid grid-cols-2 bg-[#F5F5F5] dark:bg-muted border-b border-gray-200 dark:border-border">
              <button
                onClick={() => setDrawerTab("menu")}
                className={`py-3.5 text-center text-xs font-semibold uppercase tracking-wide transition-all relative ${drawerTab === "menu"
                  ? "bg-[#EFEFEF] dark:bg-card text-gray-900 dark:text-foreground border-b-2 border-[#FF5500]"
                  : "text-gray-500 dark:text-muted-foreground hover:text-gray-700"
                  }`}
              >
                MENU
              </button>
              <button
                onClick={() => setDrawerTab("categories")}
                className={`py-3.5 text-center text-xs font-semibold uppercase tracking-wide transition-all relative ${drawerTab === "categories"
                  ? "bg-[#EFEFEF] dark:bg-card text-gray-900 dark:text-foreground border-b-2 border-[#FF5500]"
                  : "text-gray-500 dark:text-muted-foreground hover:text-gray-700"
                  }`}
              >
                CATEGORIES
              </button>
            </div>

            {/* TAB CONTENT: MENU */}
            {drawerTab === "menu" ? (
              <div className="divide-y divide-gray-200/90 dark:divide-border border-b border-gray-200 dark:border-border">
                <Link
                  to="/"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3.5 text-xs font-medium uppercase tracking-wide transition-colors ${isActive("/") ? "text-[#FF5500] font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#FF5500]"
                    }`}
                >
                  HOME
                </Link>

                <Link
                  to="/products"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3.5 text-xs font-medium uppercase tracking-wide transition-colors ${isActive("/products") ? "text-[#FF5500] font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#FF5500]"
                    }`}
                >
                  SHOP
                </Link>

                <Link
                  to="/vendors"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3.5 text-xs font-medium uppercase tracking-wide transition-colors ${isActive("/vendors") ? "text-[#FF5500] font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#FF5500]"
                    }`}
                >
                  VENDORS
                </Link>

                <Link
                  to="/news"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3.5 text-xs font-medium uppercase tracking-wide transition-colors ${isActive("/news") ? "text-[#FF5500] font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#FF5500]"
                    }`}
                >
                  NEWS
                </Link>

                <Link
                  to="/how-it-works"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3.5 text-xs font-medium uppercase tracking-wide transition-colors ${isActive("/how-it-works") ? "text-[#FF5500] font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#FF5500]"
                    }`}
                >
                  HOW IT WORKS
                </Link>

                <Link
                  to="/faqs"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3.5 text-xs font-medium uppercase tracking-wide transition-colors ${isActive("/faqs") ? "text-[#FF5500] font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#FF5500]"
                    }`}
                >
                  FAQ
                </Link>

                <Link
                  to="/about"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className={`block px-4 py-3.5 text-xs font-medium uppercase tracking-wide transition-colors ${isActive("/about") ? "text-[#FF5500] font-semibold" : "text-gray-700 dark:text-gray-300 hover:text-[#FF5500]"
                    }`}
                >
                  ABOUT US
                </Link>

                <Link
                  to="/account/wishlist"
                  onClick={() => setIsMobileMenuOpen(false)}
                  className="flex items-center gap-2.5 px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-[#FF5500] transition-colors"
                >
                  <Heart className="w-4 h-4 text-gray-400 stroke-[1.8]" />
                  <span>WISHLIST</span>
                </Link>

                {user ? (
                  <Link
                    to="/account"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-[#FF5500] transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400 stroke-[1.8]" />
                    <span>MY ACCOUNT</span>
                  </Link>
                ) : (
                  <Link
                    to="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-[#FF5500] transition-colors"
                  >
                    <User className="w-4 h-4 text-gray-400 stroke-[1.8]" />
                    <span>LOGIN / REGISTER</span>
                  </Link>
                )}
              </div>
            ) : (
              /* TAB CONTENT: CATEGORIES */
              <div className="divide-y divide-gray-200/90 dark:divide-border border-b border-gray-200 dark:border-border">
                {PRODUCT_CATEGORIES.map((cat) => {
                  const CatIcon = cat.icon;
                  return (
                    <Link
                      key={cat.label}
                      to={`/products?category=${encodeURIComponent(cat.label)}`}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="flex items-center gap-3 px-4 py-3.5 text-xs font-medium uppercase tracking-wide text-gray-700 dark:text-gray-300 hover:text-[#FF5500] transition-colors"
                    >
                      <CatIcon className="w-4 h-4 text-gray-400 shrink-0 stroke-[1.8]" />
                      <span>{cat.label}</span>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>

          {/* Drawer Footer CTA */}
          <div className="p-4 border-t border-gray-200 dark:border-border bg-gray-50/50 dark:bg-muted/30 space-y-2">
            <Link
              to="/vendor"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full bg-[#FF5500] text-white text-center py-3 rounded-none font-bold text-xs uppercase tracking-wider shadow-md shadow-orange-500/20"
            >
              Sell on Unimall
            </Link>

            {user && (
              <button
                onClick={() => { signOut(); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 rounded transition-colors uppercase tracking-wider"
              >
                <LogOut className="w-4 h-4" /> Sign Out
              </button>
            )}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
};

export default Navbar;
