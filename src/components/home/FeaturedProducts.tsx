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
      description: `${product.name} has been added to your cart.`,
    });
  };

  return (
    <Link
      to={`/products/${product.id}`}
      className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        {showDiscount && product.discount && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-destructive text-destructive-foreground text-xs font-semibold rounded-lg">
            {product.discount}% OFF
          </span>
        )}
        {product.isNew && (
          <span className="absolute top-3 left-3 px-2 py-1 bg-primary text-primary-foreground text-xs font-semibold rounded-lg">
            NEW
          </span>
        )}
        <button
          className="absolute top-3 right-3 w-9 h-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background hover:text-destructive"
          onClick={(e) => e.preventDefault()}
        >
          <Heart className="w-4 h-4" />
        </button>
        <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
          <Button size="sm" className="w-full" onClick={handleAddToCart}>
            <ShoppingCart className="w-4 h-4 mr-2" />
            Add to Cart
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <p className="text-xs text-primary font-medium mb-1">{product.vendor}</p>
        <h3 className="font-semibold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">
          {product.name}
        </h3>
        <div className="flex items-center gap-1 mb-3">
          <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
          <span className="text-sm font-medium">{product.rating || 0}</span>
          <span className="text-xs text-muted-foreground">({product.reviews || 0})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">GH₵{product.price}</span>
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

  // For demonstration, we split the products into the categories
  // In a real app, these would come from specific queries or tags
  const flashSaleProducts = allProducts.slice(0, 4).map(p => ({ ...p, discount: 15 }));
  const topSellingProducts = allProducts.slice(4, 8);
  const newArrivals = allProducts.slice(8, 12).map(p => ({ ...p, isNew: true }));

  if (isLoading) {
    return (
      <div className="py-20 flex justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (allProducts.length === 0) {
    return (
      <section className="py-16 bg-background">
        <div className="container mx-auto px-4 text-center py-20">
          <p className="text-muted-foreground text-lg">No products available yet. Check back soon!</p>
          <Link to="/products" className="mt-4 inline-block">
            <Button variant="outline">Browse Products</Button>
          </Link>
        </div>
      </section>
    );
  }

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-4">
        {/* Flash Sales */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-destructive/10 rounded-xl flex items-center justify-center">
                <Zap className="w-6 h-6 text-destructive" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Flash Sales</h2>
                <div className="flex items-center gap-2 text-muted-foreground text-sm">
                  <Clock className="w-4 h-4" />
                  <span>Ends in 23:45:12</span>
                </div>
              </div>
            </div>
            <Link to="/products?sale=true">
              <Button variant="outline" className="hidden sm:flex">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {flashSaleProducts.map((product) => (
              <ProductCard key={product.id} product={product} showDiscount />
            ))}
          </div>
        </div>

        {/* Top Selling */}
        <div className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">Top Selling</h2>
                <p className="text-muted-foreground text-sm">Most popular products this week</p>
              </div>
            </div>
            <Link to="/products?sort=bestselling">
              <Button variant="outline" className="hidden sm:flex">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {topSellingProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* New Arrivals */}
        <div>
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 bg-accent/10 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-accent" />
              </div>
              <div>
                <h2 className="text-2xl lg:text-3xl font-bold text-foreground">New Arrivals</h2>
                <p className="text-muted-foreground text-sm">Fresh products just added</p>
              </div>
            </div>
            <Link to="/products?sort=newest">
              <Button variant="outline" className="hidden sm:flex">
                View All
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {newArrivals.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>

        {/* CTA */}
        <div className="mt-12 text-center">
          <Link to="/products">
            <Button size="lg" className="px-8">
              Browse All Products
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
