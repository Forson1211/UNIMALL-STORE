import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heart, Star, ShoppingCart, Minus, Plus, Truck, Shield, RotateCcw, Store, ChevronLeft } from "lucide-react";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";

// Mock product data
const mockProducts: Record<string, {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  rating: number;
  reviews: number;
  vendor: string;
  vendorId: string;
  category: string;
  image: string;
  images: string[];
  stock: number;
  features: string[];
}> = {
  "1": { id: "1", name: "Wireless Earbuds Pro", description: "Experience premium sound quality with our Wireless Earbuds Pro. Featuring active noise cancellation, 30-hour battery life, and ergonomic design for all-day comfort. Perfect for students who want to focus on their studies or enjoy music between classes.", price: 85, originalPrice: 120, rating: 4.8, reviews: 124, vendor: "TechHub", vendorId: "v1", category: "Electronics", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800", images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800", "https://images.unsplash.com/photo-1606220588913-b3aacb4d2f46?w=800"], stock: 25, features: ["Active Noise Cancellation", "30-hour Battery Life", "IPX5 Water Resistant", "Touch Controls"] },
  "fs1": { id: "fs1", name: "Wireless Earbuds Pro", description: "Experience premium sound quality with our Wireless Earbuds Pro. Featuring active noise cancellation, 30-hour battery life, and ergonomic design for all-day comfort.", price: 65, originalPrice: 120, rating: 4.8, reviews: 124, vendor: "TechHub", vendorId: "v1", category: "Electronics", image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800", images: ["https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800"], stock: 15, features: ["Active Noise Cancellation", "30-hour Battery Life", "IPX5 Water Resistant"] },
  "ts1": { id: "ts1", name: "Campus Hoodie - Navy", description: "Stay cozy and stylish with our premium Campus Hoodie. Made from soft, sustainable cotton blend that's perfect for those chilly lecture halls or late-night study sessions.", price: 45, rating: 4.9, reviews: 512, vendor: "StyleCo", vendorId: "v3", category: "Fashion", image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800", images: ["https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800"], stock: 50, features: ["100% Organic Cotton", "Pre-shrunk", "Machine Washable", "Unisex Fit"] },
};

// Default product for unknown IDs
const defaultProduct = {
  id: "default",
  name: "Sample Product",
  description: "This is a sample product description. The actual product details will be loaded from the database.",
  price: 50,
  originalPrice: undefined as number | undefined,
  rating: 4.5,
  reviews: 100,
  vendor: "Unimall Store",
  vendorId: "v0",
  category: "General",
  image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800",
  images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800"],
  stock: 10,
  features: ["High Quality", "Fast Shipping", "Great Value"],
};

const ProductDetail = () => {
  const { id } = useParams<{ id: string }>();
  const product = mockProducts[id || ""] || defaultProduct;
  
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  
  const { addItem } = useCart();
  const { toast } = useToast();

  const handleAddToCart = () => {
    for (let i = 0; i < quantity; i++) {
      addItem({
        id: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        vendor: product.vendor,
        vendorId: product.vendorId,
      });
    }
    toast({
      title: "Added to cart",
      description: `${quantity}x ${product.name} has been added to your cart.`,
    });
  };

  const incrementQuantity = () => {
    if (quantity < product.stock) {
      setQuantity(quantity + 1);
    }
  };

  const decrementQuantity = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Breadcrumb */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <Link to="/products" className="flex items-center gap-1 hover:text-foreground transition-colors">
              <ChevronLeft className="w-4 h-4" />
              Back to Products
            </Link>
            <span>/</span>
            <span>{product.category}</span>
            <span>/</span>
            <span className="text-foreground">{product.name}</span>
          </div>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12">
            {/* Images */}
            <div className="space-y-4">
              <div className="aspect-square rounded-2xl overflow-hidden bg-muted">
                <img
                  src={product.images[selectedImage] || product.image}
                  alt={product.name}
                  className="w-full h-full object-cover"
                />
              </div>
              {product.images.length > 1 && (
                <div className="flex gap-3">
                  {product.images.map((img, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedImage(index)}
                      className={`w-20 h-20 rounded-lg overflow-hidden border-2 transition-colors ${
                        selectedImage === index ? "border-primary" : "border-transparent"
                      }`}
                    >
                      <img src={img} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Details */}
            <div>
              {/* Vendor */}
              <Link to={`/vendors/${product.vendorId}`} className="inline-flex items-center gap-2 text-sm text-primary hover:underline mb-2">
                <Store className="w-4 h-4" />
                {product.vendor}
              </Link>

              {/* Title */}
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
                {product.name}
              </h1>

              {/* Rating */}
              <div className="flex items-center gap-3 mb-6">
                <div className="flex items-center gap-1">
                  {[...Array(5)].map((_, i) => (
                    <Star
                      key={i}
                      className={`w-5 h-5 ${
                        i < Math.floor(product.rating)
                          ? "fill-yellow-500 text-yellow-500"
                          : "fill-muted text-muted"
                      }`}
                    />
                  ))}
                </div>
                <span className="font-medium">{product.rating}</span>
                <span className="text-muted-foreground">({product.reviews} reviews)</span>
              </div>

              {/* Price */}
              <div className="flex items-center gap-4 mb-6">
                <span className="text-4xl font-bold text-foreground">GH₵{product.price}</span>
                {product.originalPrice && (
                  <>
                    <span className="text-xl text-muted-foreground line-through">GH₵{product.originalPrice}</span>
                    <Badge variant="destructive" className="text-sm">
                      {Math.round((1 - product.price / product.originalPrice) * 100)}% OFF
                    </Badge>
                  </>
                )}
              </div>

              {/* Description */}
              <p className="text-muted-foreground mb-6 leading-relaxed">
                {product.description}
              </p>

              {/* Features */}
              <div className="mb-6">
                <h3 className="font-semibold mb-3">Features:</h3>
                <ul className="grid grid-cols-2 gap-2">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                      {feature}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Stock */}
              <div className="mb-6">
                {product.stock > 0 ? (
                  <Badge variant="secondary" className="bg-green-500/10 text-green-600">
                    In Stock ({product.stock} available)
                  </Badge>
                ) : (
                  <Badge variant="destructive">Out of Stock</Badge>
                )}
              </div>

              {/* Quantity & Add to Cart */}
              <div className="flex flex-col sm:flex-row gap-4 mb-8">
                <div className="flex items-center border border-border rounded-lg">
                  <button
                    onClick={decrementQuantity}
                    disabled={quantity <= 1}
                    className="p-3 hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Minus className="w-5 h-5" />
                  </button>
                  <span className="w-12 text-center font-medium">{quantity}</span>
                  <button
                    onClick={incrementQuantity}
                    disabled={quantity >= product.stock}
                    className="p-3 hover:bg-muted transition-colors disabled:opacity-50"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
                <Button size="lg" className="flex-1" onClick={handleAddToCart} disabled={product.stock === 0}>
                  <ShoppingCart className="w-5 h-5 mr-2" />
                  Add to Cart
                </Button>
                <Button size="lg" variant="outline">
                  <Heart className="w-5 h-5" />
                </Button>
              </div>

              {/* Benefits */}
              <div className="grid grid-cols-3 gap-4 p-4 bg-muted/50 rounded-xl">
                <div className="text-center">
                  <Truck className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Campus Delivery</p>
                </div>
                <div className="text-center">
                  <Shield className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Secure Payment</p>
                </div>
                <div className="text-center">
                  <RotateCcw className="w-6 h-6 mx-auto mb-2 text-primary" />
                  <p className="text-xs text-muted-foreground">Easy Returns</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default ProductDetail;
