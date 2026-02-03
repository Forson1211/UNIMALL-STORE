import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Filter, Grid3X3, LayoutList, Heart, Star, ShoppingCart } from "lucide-react";

// Mock product data
const mockProducts = [
  { id: 1, name: "Wireless Earbuds Pro", price: 85, originalPrice: 120, rating: 4.8, reviews: 124, vendor: "TechHub", category: "Electronics", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400" },
  { id: 2, name: "Introduction to Psychology", price: 35, rating: 4.6, reviews: 89, vendor: "BookWorm", category: "Books", image: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400" },
  { id: 3, name: "Campus Hoodie - Navy", price: 45, rating: 4.9, reviews: 256, vendor: "StyleCo", category: "Fashion", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=400" },
  { id: 4, name: "Organic Energy Bars (12pk)", price: 18, rating: 4.7, reviews: 67, vendor: "HealthyBites", category: "Food", image: "https://images.unsplash.com/photo-1622484212850-eb596d769eab?w=400" },
  { id: 5, name: "Laptop Stand Adjustable", price: 55, rating: 4.5, reviews: 198, vendor: "TechHub", category: "Electronics", image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=400" },
  { id: 6, name: "Canvas Tote Bag", price: 22, rating: 4.8, reviews: 312, vendor: "StyleCo", category: "Fashion", image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=400" },
  { id: 7, name: "Scientific Calculator", price: 28, rating: 4.6, reviews: 145, vendor: "StudyMart", category: "Electronics", image: "https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=400" },
  { id: 8, name: "Yoga Mat Premium", price: 38, rating: 4.9, reviews: 89, vendor: "FitZone", category: "Sports", image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=400" },
];

const ProductCard = ({ product }: { product: typeof mockProducts[0] }) => (
  <div className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300">
    {/* Image */}
    <div className="relative aspect-square overflow-hidden bg-muted">
      <img
        src={product.image}
        alt={product.name}
        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
      />
      {product.originalPrice && (
        <span className="absolute top-3 left-3 px-2 py-1 bg-coral text-secondary-foreground text-xs font-semibold rounded-lg">
          {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
        </span>
      )}
      <button className="absolute top-3 right-3 w-9 h-9 bg-white/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-white hover:text-coral">
        <Heart className="w-4 h-4" />
      </button>
      <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <Button size="sm" className="w-full">
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
        <Star className="w-4 h-4 fill-gold text-gold" />
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
  </div>
);

const Products = () => {
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">All Products</h1>
            <p className="text-muted-foreground">Discover amazing products from campus vendors</p>
          </div>

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-8 p-4 bg-card rounded-2xl border border-border">
            {/* Search */}
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10 h-11 bg-muted/50 border-0"
              />
            </div>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
              {["All", "Electronics", "Books", "Fashion", "Food", "Sports"].map((cat) => (
                <Button
                  key={cat}
                  variant={cat === "All" ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                >
                  {cat}
                </Button>
              ))}
            </div>

            {/* View Toggle */}
            <div className="flex items-center gap-2 border-l border-border pl-4">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid3X3 className="w-4 h-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <LayoutList className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {/* Products Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
            {mockProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>

          {/* Load More */}
          <div className="text-center mt-12">
            <Button variant="outline" size="lg">
              Load More Products
            </Button>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
