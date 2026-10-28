import { Trophy, Sparkles, Store, BadgePercent } from "lucide-react";

const links = [
  { 
    label: "Best Sellers", 
    sub: "SHOP NOW", 
    icon: Trophy, 
    href: "#all-products",
    bg: "bg-amber-50 dark:bg-amber-950/40",
    color: "text-amber-500",
    fill: "fill-amber-400/30"
  },
  { 
    label: "New Arrivals", 
    sub: "SHOP NOW", 
    icon: Sparkles, 
    href: "#all-products",
    bg: "bg-orange-50 dark:bg-orange-950/40",
    color: "text-[#FF5500]",
    fill: "fill-orange-400/30"
  },
  { 
    label: "Top Vendors", 
    sub: "SHOP NOW", 
    icon: Store, 
    href: "/vendors",
    bg: "bg-blue-50 dark:bg-blue-950/40",
    color: "text-blue-600",
    fill: "fill-blue-400/30"
  },
  { 
    label: "On Sale", 
    sub: "SHOP NOW", 
    icon: BadgePercent, 
    href: "#all-products",
    bg: "bg-rose-50 dark:bg-rose-950/40",
    color: "text-rose-500",
    fill: "fill-rose-400/30"
  },
];

const ShopQuickLinks = () => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
      {links.map((link) => {
        const Icon = link.icon;
        return (
          <a
            key={link.label}
            href={link.href}
            className="flex items-center gap-3.5 bg-white dark:bg-card border border-gray-200/80 dark:border-border p-3.5 rounded-none shadow-2xs hover:border-[#FF5500]/50 hover:shadow-md transition-all group"
          >
            <div className={`w-11 h-11 shrink-0 rounded-full ${link.bg} ${link.color} flex items-center justify-center group-hover:scale-110 transition-transform`}>
              <Icon className={`w-5 h-5 ${link.fill}`} />
            </div>
            <div>
              <p className="text-sm font-extrabold text-gray-900 dark:text-foreground leading-tight group-hover:text-[#FF5500] transition-colors">{link.label}</p>
              <span className="text-[10px] font-black uppercase tracking-wider text-[#FF5500]">{link.sub}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default ShopQuickLinks;
