import { Award, Sparkles, Store, Tag } from "lucide-react";

const links = [
  { label: "Best Sellers", sub: "Shop Now", icon: Award, href: "#featured-products" },
  { label: "New Arrivals", sub: "Shop Now", icon: Sparkles, href: "#just-arrived" },
  { label: "Top Vendors", sub: "Shop Now", icon: Store, href: "/vendors" },
  { label: "On Sale", sub: "Shop Now", icon: Tag, href: "#all-products" },
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
            className="flex items-center gap-3 bg-white border border-gray-100 shadow-sm px-4 py-3.5 hover:border-primary/40 hover:shadow-md transition-all group"
          >
            <div className="w-11 h-11 flex-shrink-0 rounded-full bg-orange-50 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-white transition-colors">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-black text-gray-900 leading-tight">{link.label}</p>
              <span className="text-[10px] font-black uppercase tracking-widest text-primary">{link.sub}</span>
            </div>
          </a>
        );
      })}
    </div>
  );
};

export default ShopQuickLinks;
