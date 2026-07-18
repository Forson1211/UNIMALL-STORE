import { useEffect, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Store, ShoppingCart, User } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";

const BottomTabBar = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { totalItems, isOpen: isCartOpen, openCart } = useCart();
  const [pop, setPop] = useState<string | null>(null);

  // Define tabs in order
  const tabs = [
    { key: "home", name: "Home", path: "/", icon: Home, type: "link", badge: false },
    { key: "shop", name: "Shop", path: "/products", icon: Store, type: "link", badge: false },
    { key: "cart", name: "Cart", icon: ShoppingCart, type: "button", action: openCart, badge: true },
    { key: "account", name: "Account", path: "/account", icon: User, type: "link", badge: false },
  ] as const;

  // Find active tab index
  const getActiveIndex = () => {
    if (isCartOpen) return 2;

    const path = location.pathname;
    if (path === "/") return 0;
    if (path.startsWith("/products") || path.startsWith("/vendors") || path.startsWith("/news")) return 1;
    if (path.startsWith("/account") || path.startsWith("/login")) return 3;

    return 0; // Default fallback to Home
  };

  const activeIndex = getActiveIndex();

  const triggerPop = (key: string) => {
    setPop(key);
    window.setTimeout(() => setPop((p) => (p === key ? null : p)), 450);
  };

  // Pop active tab icon on path change
  useEffect(() => {
    const activeTab = tabs[activeIndex];
    if (activeTab) {
      triggerPop(activeTab.key);
    }
  }, [location.pathname, isCartOpen]);

  return (
    <div 
      className="lg:hidden fixed inset-x-0 z-50 flex justify-center animate-tab-bar-in pointer-events-none"
      style={{ bottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      {/* Floating pill wrapper with drop shadow */}
      <div 
        className="relative w-[88vw] max-w-[360px] h-[60px] pointer-events-auto"
        style={{ filter: "drop-shadow(0 8px 24px rgba(0, 0, 0, 0.13))" }}
      >
        {/* Background rounded pill container (clipping background components) */}
        <div className="absolute inset-0 rounded-[30px] overflow-hidden bg-transparent pointer-events-none">
          {/* Left Block */}
          <div 
            className="absolute left-0 top-0 bottom-0 bg-card transition-all duration-350 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
            style={{ 
              right: `calc(100% - (21% * ${activeIndex} + 18.5%) + 42.5px)`
            }} 
          />
          {/* SVG Notch Column */}
          <div 
            className="absolute h-full w-[88px] transition-all duration-350 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
            style={{ 
              left: `calc((21% * ${activeIndex} + 18.5%) - 44px)`,
              top: 0,
              bottom: 0
            }}
          >
            <svg 
              className="w-full h-full text-card fill-current" 
              viewBox="0 0 88 60" 
              preserveAspectRatio="none"
            >
              <path d="M 0 0 C 17 0, 24 27, 44 27 C 64 27, 71 0, 88 0 L 88 60 L 0 60 Z" />
            </svg>
          </div>
          {/* Right Block */}
          <div 
            className="absolute right-0 top-0 bottom-0 bg-card transition-all duration-350 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
            style={{ 
              left: `calc((21% * ${activeIndex} + 18.5%) + 42.5px)`
            }} 
          />
        </div>

        {/* Sliding Active FAB */}
        <div 
          className="absolute top-[-18px] h-[50px] w-[50px] rounded-full bg-gradient-to-tr from-[#FF3300] via-[#FF5500] to-[#FF007F] flex items-center justify-center shadow-[0_6px_18px_rgba(255,85,0,0.40)] transition-all duration-350 ease-[cubic-bezier(0.175,0.885,0.32,1.275)]"
          style={{ left: `calc((21% * ${activeIndex} + 18.5%) - 25px)` }}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            {tabs.map((tab, idx) => {
              const Icon = tab.icon;
              const isIconActive = activeIndex === idx;
              return (
                <div
                  key={`active-icon-${tab.key}`}
                  className={`absolute flex items-center justify-center transition-all duration-300 ${
                    isIconActive 
                      ? `opacity-100 scale-100 rotate-0 ${pop === tab.key ? "animate-tab-pop" : ""}` 
                      : "opacity-0 scale-50 -rotate-45 pointer-events-none"
                  }`}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2.5} />
                  {tab.badge && totalItems > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-white text-[#FF5500] text-[9px] rounded-full flex items-center justify-center font-black shadow-sm border border-[#FF5500]/10 animate-scale-in">
                      {totalItems}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Foreground Links/Buttons Grid (with 8% left/right padding to keep outer tabs away from edges) */}
        <div className="absolute inset-0 flex items-center z-10 pl-[8%] pr-[8%]">
          {tabs.map((tab, idx) => {
            const Icon = tab.icon;
            const isActive = activeIndex === idx;
            
            return (
              <div key={tab.key} className="flex-1 h-full flex items-center justify-center">
                {tab.type === "link" ? (
                  <Link 
                    to={tab.key === "account" && !user ? "/login" : tab.path}
                    className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <div className={`transition-all duration-300 ${isActive ? "opacity-0 scale-50 translate-y-[-10px]" : "opacity-100 scale-100 translate-y-0"}`}>
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                    </div>
                    <span className={`text-[10px] font-semibold transition-all duration-300 ${isActive ? "opacity-0 scale-50 translate-y-3" : "opacity-100 scale-100 translate-y-0"}`}>
                      {tab.name}
                    </span>
                  </Link>
                ) : (
                  <button 
                    onClick={tab.action}
                    className="w-full h-full flex flex-col items-center justify-center gap-1 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <div className={`relative transition-all duration-300 ${isActive ? "opacity-0 scale-50 translate-y-[-10px]" : "opacity-100 scale-100 translate-y-0"}`}>
                      <Icon className="w-5 h-5" strokeWidth={1.8} />
                      {tab.badge && totalItems > 0 && (
                        <span className="absolute -top-1 -right-2.5 w-4 h-4 bg-[#FF5500] text-white text-[9px] rounded-full flex items-center justify-center font-bold">
                          {totalItems}
                        </span>
                      )}
                    </div>
                    <span className={`text-[10px] font-semibold transition-all duration-300 ${isActive ? "opacity-0 scale-50 translate-y-3" : "opacity-100 scale-100 translate-y-0"}`}>
                      {tab.name}
                    </span>
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default BottomTabBar;
