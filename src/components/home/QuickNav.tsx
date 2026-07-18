import { Link, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const QuickNav = () => {
  const [searchParams] = useSearchParams();

  return (
    <div className="hidden md:block max-w-[1280px] mx-auto px-4 xl:px-0 mt-2">
      <div className="bg-white shadow-sm border border-gray-100 flex items-stretch h-10 overflow-x-auto no-scrollbar">
        {/* Select Campus dropdown trigger */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="shrink-0 w-[230px] flex items-center justify-between px-4 h-full bg-[#FF5500] text-white font-bold text-sm hover:bg-[#e54a00] transition-colors whitespace-nowrap outline-none border-none">
              <span className="flex items-center gap-1.5">
                <MapPin className="w-4 h-4 fill-white/20" />
                {searchParams.get("campus") ? `Campus: ${searchParams.get("campus")}` : "Select Campus"}
              </span>
              <span className="text-[10px] opacity-75">▼</span>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56 rounded-none shadow-xl border-gray-200 p-1 mt-0">
            {[
              { name: "All Campuses", value: "All", path: "/products" },
              { name: "University of Ghana", value: "Legon", path: "/products?campus=Legon" },
              { name: "KNUST", value: "KNUST", path: "/products?campus=KNUST" },
              { name: "UCC", value: "UCC", path: "/products?campus=UCC" },
              { name: "UPSA", value: "UPSA", path: "/products?campus=UPSA" }
            ].map((camp) => (
              <Link
                key={camp.name}
                to={camp.path}
                className={`flex items-center gap-3 px-3 py-2 hover:bg-orange-50 hover:text-[#FF5500] text-sm transition-colors rounded-none
                  ${(searchParams.get("campus") || "All") === camp.value ? "bg-orange-50 text-[#FF5500] font-black" : "text-gray-700 font-medium"}`}
              >
                <span>{camp.name}</span>
              </Link>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Distinct quick-links — NOT categories */}
        {[
          { label: "⚡ Flash Sales",     path: "/products#featured-products", highlight: true  },
          { label: "New Arrivals",        path: "/products#just-arrived",      highlight: false },
          { label: "Vendors",             path: "/vendors",                    highlight: false },
          { label: "How It Works",        path: "/how-it-works",               highlight: false },
          { label: "News & Blog",         path: "/news",                       highlight: false },
          { label: "About Us",            path: "/about",                      highlight: false },
          { label: "Sell on Unimall",     path: "/vendor",                     highlight: false },
          { label: "Track My Order",      path: "/account/orders",             highlight: false },
        ].map((link) => (
          <Link
            key={link.label}
            to={link.path}
            className={`shrink-0 px-4 h-full flex items-center text-sm font-bold border-r border-gray-100 transition-colors whitespace-nowrap last:border-0
              ${link.highlight
                ? "text-[#FF5500] hover:text-[#e54a00]"
                : "text-gray-600 hover:text-[#FF5500]"
              }`}
          >
            {link.label}
          </Link>
        ))}
      </div>
    </div>
  );
};

export default QuickNav;
