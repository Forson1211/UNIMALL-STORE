import { Link, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { MapPin, Zap, Check, ShoppingBag, ArrowRight, Flame } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const CAMPUSES = [
  { name: "All Campuses", value: "All", path: "/products" },
  { name: "University of Ghana (Legon)", value: "Legon", path: "/products?campus=Legon" },
  { name: "KNUST (Kumasi)", value: "KNUST", path: "/products?campus=KNUST" },
  { name: "University of Cape Coast (UCC)", value: "UCC", path: "/products?campus=UCC" },
  { name: "UPSA (Accra)", value: "UPSA", path: "/products?campus=UPSA" },
  { name: "Accra Technical University (ATU)", value: "ATU", path: "/products?campus=ATU" },
  { name: "GIMPA (Greenhill)", value: "GIMPA", path: "/products?campus=GIMPA" },
  { name: "Ashesi University", value: "Ashesi", path: "/products?campus=Ashesi" },
  { name: "UMaT (Tarkwa)", value: "UMaT", path: "/products?campus=UMaT" },
  { name: "Central University", value: "Central", path: "/products?campus=Central" },
];

const QuickNav = () => {
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const { user, role } = useAuth();

  const currentCampus = searchParams.get("campus") || "All";
  const selectedCampusObj = CAMPUSES.find((c) => c.value.toLowerCase() === currentCampus.toLowerCase()) || CAMPUSES[0];

  const handleSelectCampus = (campusValue: string, path: string) => {
    localStorage.setItem("unimall_selected_campus", campusValue);
    navigate(path);
  };

  const navLinks = [
    { 
      label: "Flash Sales", 
      icon: <Zap className="w-3.5 h-3.5 fill-[#FF5500] text-[#FF5500] inline-block mr-1" />,
      path: "/products?sort=popular", 
      highlight: true,
      active: location.pathname === "/products" && searchParams.get("sort") === "popular"
    },
    { 
      label: "All Products", 
      path: "/products", 
      highlight: false,
      active: location.pathname === "/products" && !searchParams.get("sort") && !searchParams.get("category")
    },
    { 
      label: "New Arrivals", 
      path: "/products?sort=newest", 
      highlight: false,
      active: location.pathname === "/products" && searchParams.get("sort") === "newest"
    },
    { 
      label: "Vendors", 
      path: "/vendors", 
      highlight: false,
      active: location.pathname.startsWith("/vendors")
    },
    { 
      label: "How It Works", 
      path: "/how-it-works", 
      highlight: false,
      active: location.pathname === "/how-it-works"
    },
    { 
      label: "News & Blog", 
      path: "/news", 
      highlight: false,
      active: location.pathname.startsWith("/news")
    },
    { 
      label: "About Us", 
      path: "/about", 
      highlight: false,
      active: location.pathname === "/about"
    },
    { 
      label: "Sell on Unimall", 
      path: role === "vendor" ? "/vendor" : (user ? "/vendor" : "/signup?role=vendor"), 
      highlight: false,
      active: location.pathname.startsWith("/vendor")
    },
    { 
      label: "Track My Order", 
      path: "/account/orders", 
      highlight: false,
      active: location.pathname === "/account/orders"
    },
  ];

  return (
    <div className="hidden md:block max-w-[1280px] mx-auto px-4 xl:px-0 mt-4 mb-2">
      <div className="bg-white dark:bg-card shadow-xs border border-gray-200/80 dark:border-border flex items-stretch h-10 overflow-x-auto no-scrollbar rounded-none justify-between">
        
        {/* ── Left Side: Campus Dropdown + Navigation Links ── */}
        <div className="flex items-stretch flex-1 overflow-x-auto no-scrollbar">
          {/* Select Campus Dropdown Trigger */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0 min-w-[180px] px-4 h-full bg-[#FF5500] hover:bg-[#e54a00] text-white font-black text-xs sm:text-sm flex items-center justify-between gap-2 transition-colors whitespace-nowrap outline-none border-none cursor-pointer">
                <span className="flex items-center gap-1.5 truncate max-w-[140px]">
                  <MapPin className="w-3.5 h-3.5 fill-white/20 shrink-0" />
                  <span>{selectedCampusObj.value === "All" ? "Select Campus" : selectedCampusObj.value}</span>
                </span>
                <span className="text-[9px] opacity-80 shrink-0">▼</span>
              </button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="start" className="w-64 rounded-xl shadow-xl border-gray-200 dark:border-border p-1.5 mt-1 bg-white dark:bg-card z-[999]">
              <div className="px-2.5 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-gray-400 border-b border-gray-100 dark:border-border/60 mb-1">
                Select Campus Hub
              </div>
              {CAMPUSES.map((camp) => {
                const isSelected = selectedCampusObj.value.toLowerCase() === camp.value.toLowerCase();
                return (
                  <DropdownMenuItem
                    key={camp.name}
                    onClick={() => handleSelectCampus(camp.value, camp.path)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                      isSelected 
                        ? "bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] font-black" 
                        : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-muted"
                    }`}
                  >
                    <span className="truncate">{camp.name}</span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-[#FF5500] shrink-0" />}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Secondary Quick Navigation Links */}
          {navLinks.map((link) => (
            <Link
              key={link.label}
              to={link.path}
              className={`px-3.5 lg:px-4 h-full flex items-center text-xs sm:text-[13px] font-semibold border-r border-gray-200 dark:border-border transition-all whitespace-nowrap hover:bg-gray-50 dark:hover:bg-muted/40 ${
                link.active
                  ? "text-[#FF5500] bg-orange-50/50 dark:bg-orange-950/20 font-bold"
                  : link.highlight
                    ? "text-[#FF5500] font-bold hover:text-[#e54a00]"
                    : "text-gray-700 dark:text-gray-200 hover:text-[#FF5500] dark:hover:text-white"
              }`}
            >
              {link.icon}
              {link.label}
            </Link>
          ))}
        </div>

        {/* ── Right End: Product Catalog Direct Shortcut ── */}
        <Link
          to="/products"
          className="hidden xl:flex items-center gap-2 px-4 h-full bg-[#111111] hover:bg-[#FF5500] text-white font-extrabold text-xs uppercase tracking-wider transition-colors shrink-0 group border-l border-gray-200 dark:border-border"
        >
          <ShoppingBag className="w-3.5 h-3.5 text-[#FF5500] group-hover:text-white transition-colors" />
          <span>Explore Products</span>
          <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
        </Link>

      </div>
    </div>
  );
};

export default QuickNav;
