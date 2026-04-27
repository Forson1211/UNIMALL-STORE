import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Star, ShoppingCart, ArrowRight, Clock, TrendingUp, Zap } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";

interface Product extends StorefrontProduct {
  discount?: number;
  isNew?: boolean;
}

const ProductCard = ({ product, showDiscount = false }: { product: Product; showDiscount?: boolean }) => {
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
    toast({
      title: "Added to cart",
      description: `${product.name} added to your cart.`,
    });
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group relative flex flex-col bg-white rounded-none border border-border/40 overflow-hidden hover:shadow-2xl hover:shadow-primary/5 transition-all duration-500 hover:-translate-y-2"
    >
      {/* Premium Image Container */}
      <div className="relative aspect-[1/1.1] overflow-hidden bg-muted/30">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-1000"
        />
        
        {/* Badges */}
        <div className="absolute top-4 left-4 flex flex-col gap-2">
          {showDiscount && product.discount && (
            <span className="px-3 py-1 bg-primary text-white text-[10px] font-black uppercase tracking-widest rounded-none shadow-lg">
              -{product.discount}%
            </span>
          )}
          {product.isNew && (
            <span className="px-3 py-1 bg-foreground text-white text-[10px] font-black uppercase tracking-widest rounded-none shadow-lg">
              New
            </span>
          )}
        </div>

        {/* Quick Actions */}
        <button
          className="absolute top-4 right-4 w-10 h-10 bg-white/80 backdrop-blur-md rounded-none flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 hover:bg-primary hover:text-white"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="w-4 h-4" />
        </button>

        <div className="absolute inset-x-4 bottom-4 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <Button className="w-full h-12 rounded-none bg-foreground text-white font-bold text-xs uppercase tracking-widest hover:bg-primary border-none shadow-xl" onClick={handleAddToCart}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Simplified Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-2">
           <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">{product.vendor}</p>
           <div className="flex items-center gap-1">
              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
              <span className="text-[10px] font-bold">{product.rating || 4.5}</span>
           </div>
        </div>
        <h3 className="font-bold text-foreground mb-3 line-clamp-1 group-hover:text-primary transition-colors tracking-tight">
          {product.name}
        </h3>
        <div className="flex items-center justify-between">
          <span className="text-xl font-black text-foreground">GH₵{product.price}</span>
          <div className="w-8 h-8 rounded-none border border-border flex items-center justify-center group-hover:bg-primary group-hover:border-primary group-hover:text-white transition-all">
             <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </Link>
  );
};

const FeaturedProducts = () => {
  const { data: allProducts = [], isLoading } = useQuery({
    queryKey: ["featured-products"],
    queryFn: () => productService.getProducts({ limit: 12 }),
  });

  const flashSaleProducts = allProducts.slice(0, 4).map(p => ({ ...p, discount: 15 }));
  const topSellingProducts = allProducts.slice(4, 8);

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-none animate-spin" />
      </div>
    );
  }

  return (
    <section className="py-32 bg-white">
      <div className="container mx-auto px-4">
        
        {/* Flash Sales Section */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest mb-4">
                <Zap className="w-3 h-3" />
                Limited Time
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter">Flash Deals</h2>
            </div>
            
            <div className="flex items-center gap-6">
               <div className="flex items-center gap-2 bg-secondary/5 px-4 py-2 rounded-none border border-border/40">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <span className="text-sm font-black tabular-nums">23:45:12</span>
               </div>
               <Link to="/products?sale=true" className="text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
                 View All <ArrowRight className="w-4 h-4" />
               </Link>
            </div>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} showDiscount />
            ))}
          </div>
        </div>

        {/* Popular Section */}
        <div className="mb-32">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-none bg-secondary/10 text-secondary text-[10px] font-black uppercase tracking-widest mb-4">
                <TrendingUp className="w-3 h-3" />
                Community Choice
              </div>
              <h2 className="text-4xl lg:text-5xl font-black text-foreground tracking-tighter">Top Selling</h2>
            </div>
            
            <Link to="/products?sort=bestselling" className="text-sm font-black uppercase tracking-widest text-muted-foreground hover:text-primary transition-colors flex items-center gap-2">
              View All <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            {topSellingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* Global CTA */}
        <div className="bg-mesh rounded-none p-12 lg:p-24 text-center overflow-hidden relative">
           <div className="relative z-10">
              <h2 className="text-4xl lg:text-6xl font-black text-foreground mb-8 tracking-tighter">
                Find exactly what <br /> you need.
              </h2>
              <Link to="/products">
                <Button size="lg" className="h-16 px-10 rounded-none bg-foreground text-white font-black text-sm uppercase tracking-widest hover:bg-primary shadow-2xl transition-all hover:scale-105 active:scale-95">
                  Browse Full Catalog
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
           </div>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
