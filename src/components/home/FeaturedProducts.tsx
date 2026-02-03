import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Heart, Star, ShoppingCart, ArrowRight, Clock, TrendingUp, Zap } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

// Mock featured products data
const flashSaleProducts = [
  { id: "fs1", name: "Wireless Earbuds Pro", price: 65, originalPrice: 120, rating: 4.8, reviews: 124, vendor: "TechHub", vendorId: "v1", category: "Electronics", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400", discount: 46 },
  { id: "fs2", name: "Smart Watch Series X", price: 149, originalPrice: 299, rating: 4.7, reviews: 89, vendor: "TechHub", vendorId: "v1", category: "Electronics", image: "https://images.unsplash.com/photo-1546868871-7041f2a55e12?w=400", discount: 50 },
  { id: "fs3", name: "Bluetooth Speaker Mini", price: 35, originalPrice: 75, rating: 4.5, reviews: 156, vendor: "AudioMax", vendorId: "v7", category: "Electronics", image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=400", discount: 53 },
  { id: "fs4", name: "USB-C Hub 7-in-1", price: 28, originalPrice: 55, rating: 4.6, reviews: 234, vendor: "TechHub", vendorId: "v1", category: "Electronics", image: "https://images.unsplash.com/photo-1625723044792-44de16ccb4e9?w=400", discount: 49 },
];

const topSellingProducts = [
  { id: "ts1", name: "Campus Hoodie - Navy", price: 45, rating: 4.9, reviews: 512, vendor: "StyleCo", vendorId: "v3", category: "Fashion", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400" },
  { id: "ts2", name: "Laptop Stand Adjustable", price: 55, rating: 4.8, reviews: 398, vendor: "TechHub", vendorId: "v1", category: "Electronics", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400" },
  { id: "ts3", name: "Canvas Tote Bag", price: 22, rating: 4.9, reviews: 623, vendor: "StyleCo", vendorId: "v3", category: "Fashion", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400" },
  { id: "ts4", name: "Study Desk Lamp LED", price: 38, rating: 4.7, reviews: 287, vendor: "HomeLite", vendorId: "v8", category: "Electronics", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400" },
];

const newArrivals = [
  { id: "na1", name: "Organic Energy Bars (12pk)", price: 18, rating: 4.7, reviews: 67, vendor: "HealthyBites", vendorId: "v4", category: "Food", image: "https://images.unsplash.com/photo-1622484212850-eb596d769eab?w=400", isNew: true },
  { id: "na2", name: "Yoga Mat Premium", price: 38, rating: 4.9, reviews: 89, vendor: "FitZone", vendorId: "v6", category: "Sports", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400", isNew: true },
  { id: "na3", name: "Water Bottle Insulated", price: 25, rating: 4.8, reviews: 145, vendor: "FitZone", vendorId: "v6", category: "Sports", image: "https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=400", isNew: true },
  { id: "na4", name: "Desk Organizer Set", price: 32, rating: 4.6, reviews: 98, vendor: "StudyMart", vendorId: "v5", category: "Stationery", image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400", isNew: true },
];

interface Product {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  vendor: string;
  vendorId: string;
  category: string;
  image: string;
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
      vendorId: product.vendorId,
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
          <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
          <span className="text-sm font-medium">{product.rating}</span>
          <span className="text-xs text-muted-foreground">({product.reviews})</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-lg font-bold text-foreground">GH₵{product.price}</span>
          {product.originalPrice && (
            <span className="text-sm text-muted-foreground line-through">GH₵{product.originalPrice}</span>
          )}
        </div>
      </div>
    </Link>
  );
};

const FeaturedProducts = () => {
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
              <div className="w-12 h-12 bg-green-500/10 rounded-xl flex items-center justify-center">
                <Star className="w-6 h-6 text-green-500" />
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
