import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Star, ShoppingCart, ChevronRight } from "lucide-react";
import { productService, StorefrontProduct } from "@/services/productService";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

interface PromoTile {
  title: string;
  subtitle: string;
  cta: string;
  gradient: string;
}

interface ProductShowcaseSectionProps {
  id: string;
  title: string;
  sortBy: "created_at" | "rating";
  viewAllLink?: string;
  promo: PromoTile;
}

const ShowcaseCard = ({ product }: { product: StorefrontProduct }) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id,
      name: product.name,
      price: product.price,
      image: product.image,
      vendor: product.vendor,
      vendorId: product.vendor_id,
    });
    toast({ title: "Added to cart", description: `${product.name} added to your cart.` });
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group flex flex-col bg-white border border-gray-100 hover:border-primary/40 hover:shadow-xl transition-all duration-300"
    >
      <div className="relative aspect-square overflow-hidden bg-[#fafafa]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-contain p-3 transition-transform duration-500 group-hover:scale-105"
        />
        <button
          onClick={handleAddToCart}
          className="absolute bottom-2 right-2 w-8 h-8 bg-white shadow-lg flex items-center justify-center opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all hover:bg-primary hover:text-white"
        >
          <ShoppingCart className="w-4 h-4" />
        </button>
      </div>
      <div className="p-3 flex flex-col gap-1">
        <h3 className="text-sm font-black text-gray-900 line-clamp-1">{product.name}</h3>
        {product.rating > 0 && (
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
            <span className="text-[11px] font-bold text-gray-400">{product.rating.toFixed(1)}</span>
          </div>
        )}
        <span className="text-base font-black text-gray-900">GH₵ {product.price.toLocaleString()}</span>
      </div>
    </Link>
  );
};

const ProductShowcaseSection = ({ id, title, sortBy, viewAllLink = "/products", promo }: ProductShowcaseSectionProps) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["shop-showcase", sortBy],
    queryFn: () => productService.getProducts({ sortBy, sortOrder: "desc", limit: 4 }),
  });

  if (!isLoading && products.length === 0) return null;

  return (
    <section id={id} className="mb-8 scroll-mt-24">
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-lg md:text-xl font-black text-gray-900 uppercase tracking-tight">{title}</h2>
        <Link to={viewAllLink} className="flex items-center gap-1 text-xs font-black uppercase tracking-widest text-primary hover:underline">
          View All <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4">
        {isLoading
          ? [...Array(4)].map((_, i) => (
              <div key={i} className="bg-white border border-gray-100 aspect-square animate-pulse" />
            ))
          : products.map((product) => <ShowcaseCard key={product.id} product={product} />)}

        {/* Promo tile */}
        <Link
          to={viewAllLink}
          className={`relative col-span-2 md:col-span-1 min-h-[200px] rounded-none overflow-hidden flex flex-col justify-end p-5 group ${promo.gradient}`}
        >
          <div className="absolute inset-0 bg-black/10 group-hover:bg-black/0 transition-colors" />
          <div className="relative z-10">
            <h3 className="text-white text-xl font-black tracking-tighter leading-none uppercase mb-2">{promo.title}</h3>
            <p className="text-white/80 text-xs font-bold mb-4">{promo.subtitle}</p>
            <span className="inline-block bg-white text-black text-[10px] font-black uppercase tracking-widest px-4 py-2 group-hover:bg-black group-hover:text-white transition-colors">
              {promo.cta}
            </span>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default ProductShowcaseSection;
