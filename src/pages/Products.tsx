import { useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Grid3X3, LayoutList, Heart, Star, ShoppingCart } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { productService, StorefrontProduct } from "@/services/productService";

const categories = [
  "All",
  "Birthday Flyers",
  "Church Flyers",
  "Business Flyers",
  "Social Media Templates",
  "Funeral Flyers",
  "Festival Flyers",
  "Tech Accessories",
  "Stationery",
  "Services",
  "Others"
];

const Products = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [localSearch, setLocalSearch] = useState(searchParams.get("search") || "");

  const searchQuery = searchParams.get("search") || "";
  const categoryFilter = searchParams.get("category") || "All";

  const { addItem } = useCart();
  const { toast } = useToast();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ["products", categoryFilter, searchQuery],
    queryFn: () => productService.getProducts({
      category: categoryFilter,
      search: searchQuery
    }),
  });

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setSearchParams((prev) => {
      if (localSearch) {
        prev.set("search", localSearch);
      } else {
        prev.delete("search");
      }
      return prev;
    });
  };

  const handleCategoryChange = (category: string) => {
    setSearchParams((prev) => {
      if (category === "All") {
        prev.delete("category");
      } else {
        prev.set("category", category);
      }
      return prev;
    });
  };

  const handleAddToCart = (product: StorefrontProduct) => {
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
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-20 pb-20">
        {/* Modern Header Section */}
        <section className="relative py-16 lg:py-24 overflow-hidden mb-12">
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 to-secondary" />
          <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/2" />

          <div className="container mx-auto px-4 relative z-10">
            <h1 className="text-4xl lg:text-6xl font-extrabold text-white mb-4 tracking-tight animate-fade-in-up">
              {searchQuery ? `Results for "${searchQuery}"` : "Explore All Products"}
            </h1>
            <p className="text-xl text-white/80 font-medium animate-fade-in-up" style={{ animationDelay: "0.1s" }}>
              {products.length} premium products found across your campus
            </p>
          </div>
        </section>

        <div className="container mx-auto px-4">

          {/* Filters Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-8 p-4 bg-card rounded-2xl border border-border">
            {/* Search */}
            <form onSubmit={handleSearch} className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search products..."
                className="pl-10 h-11 bg-muted/50 border-0"
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
              />
            </form>

            {/* Category Filter */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 lg:pb-0">
              {categories.map((cat) => (
                <Button
                  key={cat}
                  variant={categoryFilter === cat || (cat === "All" && !categoryFilter) ? "default" : "outline"}
                  size="sm"
                  className="shrink-0"
                  onClick={() => handleCategoryChange(cat)}
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
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Search className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                Try adjusting your search or filter to find what you're looking for.
              </p>
              <Button onClick={() => setSearchParams({})}>Clear Filters</Button>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 lg:gap-6">
              {products.map((product) => (
                <Link
                  to={`/products/${product.id}`}
                  key={product.id}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/20 transition-all duration-300"
                >
                  {/* Image */}
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      className="absolute top-3 right-3 w-9 h-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 hover:bg-background hover:text-destructive"
                      onClick={(e) => e.preventDefault()}
                    >
                      <Heart className="w-4 h-4" />
                    </button>
                    <div className="absolute bottom-3 left-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Button size="sm" className="w-full" onClick={(e) => { e.preventDefault(); handleAddToCart(product); }}>
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
                      <span className="text-sm font-medium">{product.rating || 0}</span>
                      <span className="text-xs text-muted-foreground">({product.reviews || 0})</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-bold text-foreground">GH₵{product.price}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {/* Load More */}
          {products.length > 0 && (
            <div className="text-center mt-12">
              <Button variant="outline" size="lg">
                Load More Products
              </Button>
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Products;
