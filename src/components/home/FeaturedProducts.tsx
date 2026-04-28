import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Star, ShoppingCart, ArrowRight, Clock, TrendingUp, Zap, Sparkles, Eye, Package, ChevronRight, Monitor, Smartphone, Shirt, Home as HomeIcon } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { dealService, FlashDeal, TopSeller } from "@/services/dealService";
import { productService } from "@/services/productService";
import { Badge } from "@/components/ui/badge";

const CountdownTimer = ({ endTime, dark = false }: { endTime: string, dark?: boolean }) => {
  const [timeLeft, setTimeLeft] = useState<string>("");

  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = new Date(endTime).getTime() - now;
      if (distance < 0) {
        clearInterval(timer);
        setTimeLeft("00h : 00m : 00s");
        return;
      }
      const hours = Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
      const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((distance % (1000 * 60)) / 1000);
      setTimeLeft(`${hours.toString().padStart(2, '0')}h : ${minutes.toString().padStart(2, '0')}m : ${seconds.toString().padStart(2, '0')}s`);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  return (
    <div className={`flex items-center gap-1.5 font-bold tabular-nums ${dark ? 'text-white' : 'text-primary'}`}>
      <span className="text-[11px] md:text-sm">{timeLeft || "00h : 00m : 00s"}</span>
    </div>
  );
};

const ProductCard = ({ product, badge, badgeColor = "bg-primary" }: { product: any, badge?: string, badgeColor?: string }) => {
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem({
      id: product.id || product.product_id,
      name: product.name || product.product_name,
      price: product.discount_price || product.price,
      image: product.image || product.image_url,
      vendor: product.vendor || product.vendor_name || "Unimall",
      vendorId: product.vendor_id || "",
    });
    toast({ title: "Added to cart", description: `${product.name || product.product_name} is in your bag.` });
  };

  return (
    <Link to={`/products/${product.id || product.product_id}`} className="group flex flex-col bg-white rounded-none overflow-hidden hover:shadow-xl transition-all duration-500 border border-orange-100 hover:border-primary/50 h-full">
      <div className="relative aspect-square overflow-hidden bg-muted/10 m-1 rounded-none">
        <img src={product.image || product.image_url} alt="" className="w-full h-full object-contain transition-transform duration-700 group-hover:scale-105" />
        {badge && (
          <div className="absolute top-1.5 left-1.5 md:top-2 md:left-2">
            <Badge className={`${badgeColor} text-white font-bold rounded-none px-1.5 py-0.5 md:px-2 md:py-0.5 border-none shadow-sm text-xs md:text-sm uppercase tracking-tighter`}>
              {badge}
            </Badge>
          </div>
        )}
      </div>
      <div className="p-2 md:p-3 space-y-1 md:space-y-2 flex-1 flex flex-col">
        <h3 className="text-sm md:text-base font-black text-primary line-clamp-2 leading-snug transition-colors h-10 md:h-12">
          {product.name || product.product_name}
        </h3>
        <div className="mt-auto">
          <span className="text-base md:text-xl font-black text-foreground whitespace-nowrap">GH₵ {product.price.toLocaleString()}</span>
        </div>
      </div>
    </Link>
  );
};

const CategoryRow = ({ title, category, icon: Icon }: { title: string, category: string, icon: any }) => {
  const { data: products = [], isLoading } = useQuery({
    queryKey: ["homepage-category", category],
    queryFn: () => productService.getProducts({ category, limit: 6 }),
  });

  if (isLoading || products.length === 0) return null;

  return (
    <div className="bg-white rounded-none shadow-sm overflow-hidden">
      <div className="px-3 py-2 md:px-4 md:py-3 border-b border-border/40 flex items-center justify-between">
        <h2 className="text-sm md:text-lg font-bold text-foreground/80 tracking-tight flex items-center gap-2">
          <Icon className="w-4 h-4 md:w-5 md:h-5 text-primary" /> {title}
        </h2>
        <Link to={`/products?category=${category}`} className="text-[10px] md:text-xs font-bold text-primary hover:underline flex items-center">
          See All <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-0.5" />
        </Link>
      </div>
      <div className="p-2 md:p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
        {products.map((p) => (
          <ProductCard key={p.id} product={p} />
        ))}
      </div>
    </div>
  );
};

const FeaturedProducts = () => {
  const { data: flashDeals = [], isLoading: loadingDeals } = useQuery({
    queryKey: ["active-flash-deals"],
    queryFn: () => dealService.getActiveFlashDeals(),
  });

  const { data: topSellers = [], isLoading: loadingSellers } = useQuery({
    queryKey: ["top-selling-products"],
    queryFn: () => dealService.getTopSellingProducts(6),
  });



  return (
    <section className="py-4 md:py-8 bg-[#f1f1f2]">
      <div className="container mx-auto px-2 md:px-4 space-y-4 md:space-y-6">

        {/* FLASH SALES SECTION */}
        {flashDeals.length > 0 && (
          <div className="bg-white rounded-none shadow-sm overflow-hidden">
            {/* Header */}
            <div className="bg-[#e61601] px-3 py-2 md:px-4 md:py-2.5 flex items-center justify-between text-white">
              <div className="flex items-center gap-3 md:gap-6">
                <div className="flex items-center gap-1.5 md:gap-2">
                  <Zap className="w-4 h-4 md:w-5 md:h-5 fill-yellow-400 text-yellow-400" />
                  <h2 className="text-xs md:text-lg font-black uppercase tracking-tight">Flash Sales</h2>
                </div>
                <div className="flex items-center gap-2 md:gap-3 border-l border-white/20 pl-2 md:pl-6">
                  <span className="text-xs md:text-sm font-medium opacity-90 hidden xs:inline">Time Left:</span>
                  <CountdownTimer endTime={flashDeals[0].end_time} dark />
                </div>
              </div>
              <Link to="/products" className="text-xs md:text-sm font-bold flex items-center hover:underline group whitespace-nowrap">
                See All <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-0.5 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </div>

            {/* Products Grid - 2 columns on mobile */}
            <div className="p-2 md:p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-3">
              {flashDeals.map((deal) => (
                <Link key={deal.id} to={`/products/${deal.product_id}`} className="group flex flex-col bg-white p-2 rounded-none hover:shadow-xl transition-all duration-300 border border-orange-100 hover:border-border/20">
                  <div className="relative aspect-square mb-2">
                    <img src={deal.image} alt="" className="w-full h-full object-contain" />
                    <div className="absolute top-0 right-0 bg-orange-100 text-orange-600 font-bold text-xs md:text-sm px-1 md:px-1.5 py-0.5 rounded-none">
                      -{Math.round((1 - deal.discount_price / deal.original_price) * 100)}%
                    </div>
                  </div>
                  <h3 className="text-xs md:text-sm font-black line-clamp-1 mb-1 text-primary uppercase leading-tight">{deal.name}</h3>
                  <div className="mt-auto">
                    <p className="font-black text-sm md:text-base tracking-tighter text-foreground">GH₵ {deal.discount_price.toLocaleString()}</p>
                    <p className="text-[10px] md:text-xs text-muted-foreground line-through font-bold">GH₵ {deal.original_price.toLocaleString()}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* SPLIT PROMO BANNERS - Stacks on mobile */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
          <div className="relative aspect-[21/9] md:aspect-[3/1] bg-white rounded-none shadow-sm overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1550009158-9ebf69173e03?q=80&w=1000&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              alt="Electronics Promo"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-600/80 to-transparent flex items-center px-6 md:px-12">
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-white text-lg md:text-3xl font-black tracking-tight leading-none uppercase">Electronics <br /> Showcase</h3>
                <p className="text-yellow-400 text-xs md:text-sm font-bold uppercase tracking-widest">Starting GH₵ 1,200</p>
              </div>
            </div>
          </div>
          <div className="relative aspect-[21/9] md:aspect-[3/1] bg-white rounded-none shadow-sm overflow-hidden group">
            <img
              src="https://images.unsplash.com/photo-1441986300917-64674bd600d8?q=80&w=1000&auto=format&fit=crop"
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
              alt="Fashion Promo"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-orange-600/80 to-transparent flex items-center px-6 md:px-12">
              <div className="space-y-1 md:space-y-2">
                <h3 className="text-white text-lg md:text-3xl font-black tracking-tight leading-none uppercase">Fashion <br /> Week Sale</h3>
                <p className="text-yellow-400 text-xs md:text-sm font-bold uppercase tracking-widest">Up to 60% OFF</p>
              </div>
            </div>
          </div>
        </div>

        {/* TOP SELLING SECTION */}
        <div className="bg-white rounded-none shadow-sm overflow-hidden">
          <div className="px-3 py-2 md:px-4 md:py-3 border-b border-border/40 flex items-center justify-between">
            <h2 className="text-sm md:text-lg font-bold text-foreground/80 tracking-tight flex items-center gap-2">
              <TrendingUp className="w-4 h-4 md:w-5 md:h-5 text-primary" /> Top selling items
            </h2>
            <Link to="/products" className="text-[10px] md:text-xs font-bold text-primary hover:underline flex items-center">
              See All <ChevronRight className="w-3 h-3 md:w-4 md:h-4 ml-0.5" />
            </Link>
          </div>
          <div className="p-2 md:p-3 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 md:gap-4">
            {topSellers.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </div>

        {/* DYNAMIC CATEGORY ROWS */}
        <CategoryRow title="Phones & Tablets" category="Phones & Tablets" icon={Smartphone} />
        <CategoryRow title="Electronics" category="Electronics" icon={Monitor} />
        <CategoryRow title="Fashion" category="Fashion" icon={Shirt} />
        <CategoryRow title="Home & Office" category="Home & Office" icon={HomeIcon} />

        {/* AD BANNER ROW - 2 columns on mobile */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-2 md:gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="aspect-[3/2] md:aspect-[3/1] bg-white rounded-none shadow-sm overflow-hidden relative group cursor-pointer border border-border/40">
              <img
                src={`https://images.unsplash.com/photo-${1500000000000 + i * 100000}?q=80&w=800&auto=format&fit=crop`}
                className="w-full h-full object-cover transition-transform group-hover:scale-105"
                alt="Promo"
              />
              <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                <div className="bg-white/90 px-2 py-0.5 md:px-3 md:py-1 text-xs md:text-sm font-black uppercase tracking-widest shadow-xl rounded-none">
                  Offer
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default FeaturedProducts;
