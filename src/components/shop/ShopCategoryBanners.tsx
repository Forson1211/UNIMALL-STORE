import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Headphones, Smartphone, Shirt, LucideIcon } from "lucide-react";
import { productService } from "@/services/productService";

interface BannerConfig {
  category: string;
  label: string;
  icon: LucideIcon;
  bg: string;
}

const banners: BannerConfig[] = [
  { category: "Electronics", label: "Electronics", icon: Headphones, bg: "bg-gray-900" },
  { category: "Phones & Accessories", label: "Phones & Accessories", icon: Smartphone, bg: "bg-primary" },
  { category: "Fashion", label: "Fashion", icon: Shirt, bg: "bg-gray-700" },
];

const CategoryBanner = ({ config }: { config: BannerConfig }) => {
  const { data: products = [] } = useQuery({
    queryKey: ["shop-category-banner", config.category],
    queryFn: () => productService.getProducts({ category: config.category, sortBy: "price", sortOrder: "asc", limit: 1 }),
  });

  const Icon = config.icon;
  const cheapest = products[0];

  return (
    <Link
      to={`/products?category=${encodeURIComponent(config.category)}`}
      className={`relative flex items-center gap-4 p-6 overflow-hidden group ${config.bg}`}
    >
      <div className="w-14 h-14 flex-shrink-0 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
        <Icon className="w-7 h-7 text-white" />
      </div>
      <div>
        <h3 className="text-white text-lg font-black tracking-tight">{config.label}</h3>
        <p className="text-white/60 text-xs font-bold uppercase tracking-widest mt-1">
          {cheapest ? `From GH₵ ${cheapest.price.toLocaleString()}` : "Shop Now"}
        </p>
      </div>
    </Link>
  );
};

const ShopCategoryBanners = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 mb-8">
      {banners.map((b) => (
        <CategoryBanner key={b.category} config={b} />
      ))}
    </div>
  );
};

export default ShopCategoryBanners;
