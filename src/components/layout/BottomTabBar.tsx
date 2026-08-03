import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, ShoppingBag, Search, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import MCBCartIcon from "@/components/common/MCBCartIcon";

const BottomTabBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { totalItems, isOpen: isCartOpen, openCart } = useCart();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleToggle = () => setIsMenuOpen((prev) => !prev);
    const handleOpen = () => setIsMenuOpen(true);
    const handleClose = () => setIsMenuOpen(false);

    window.addEventListener("toggle-mobile-menu", handleToggle);
    window.addEventListener("open-mobile-menu", handleOpen);
    window.addEventListener("close-mobile-menu", handleClose);

    return () => {
      window.removeEventListener("toggle-mobile-menu", handleToggle);
      window.removeEventListener("open-mobile-menu", handleOpen);
      window.removeEventListener("close-mobile-menu", handleClose);
    };
  }, []);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [location.pathname]);

  // Hide on dashboard shells and auth screens
  const isDashboardOrAuth =
    location.pathname.startsWith("/admin") ||
    location.pathname === "/vendor" ||
    location.pathname.startsWith("/vendor/");

  if (isDashboardOrAuth) return null;

  const path = location.pathname;
  const isHomeActive = path === "/";
  const isShopActive = path.startsWith("/products") || path.startsWith("/vendors");
  const isAccountActive = path.startsWith("/account") || path === "/login" || path === "/signup";

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-card border-t border-gray-200 dark:border-border shadow-[0_-4px_16px_rgba(0,0,0,0.06)] h-[58px] pt-1.5 pb-1 px-1 flex items-center justify-around">
      {/* 1. Home */}
      <Link
        to="/"
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10.5px] font-bold transition-colors ${
          isHomeActive ? "text-[#FF5500]" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <Home className="w-[19px] h-[19px]" strokeWidth={1.8} />
        <span>Home</span>
      </Link>

      {/* 2. Shop */}
      <Link
        to="/products"
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10.5px] font-bold transition-colors ${
          isShopActive ? "text-[#FF5500]" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <ShoppingBag className="w-[19px] h-[19px]" strokeWidth={1.8} />
        <span>Shop</span>
      </Link>

      {/* 3. Search */}
      <button
        onClick={() => window.dispatchEvent(new CustomEvent("open-mobile-search"))}
        className="flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10.5px] font-bold text-gray-600 dark:text-gray-400 hover:text-[#FF5500] dark:hover:text-white transition-colors focus:outline-none"
        aria-label="Search"
      >
        <Search className="w-[19px] h-[19px]" strokeWidth={1.8} />
        <span>Search</span>
      </button>

      {/* 4. Cart */}
      <button
        onClick={openCart}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10.5px] font-bold transition-colors focus:outline-none relative ${
          isCartOpen ? "text-[#FF5500]" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <MCBCartIcon
          count={totalItems}
          iconClassName="w-[19px] h-[19px] text-current"
        />
        <span>Cart</span>
      </button>

      {/* 5. My account */}
      <Link
        to={user ? "/account" : "/login"}
        className={`flex flex-col items-center justify-center gap-1 flex-1 h-full text-[10.5px] font-bold transition-colors ${
          isAccountActive ? "text-[#FF5500]" : "text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
        }`}
      >
        <User className="w-[19px] h-[19px]" strokeWidth={1.8} />
        <span>My account</span>
      </Link>
    </div>
  );
};

export default BottomTabBar;
