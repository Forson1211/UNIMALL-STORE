import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Heart, ArrowLeft, ShoppingCart, Trash2, Star } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useCart } from "@/contexts/CartContext";
import { useToast } from "@/hooks/use-toast";
import { useWishlist, WishlistItem } from "@/hooks/useWishlist";

const BuyerWishlist = () => {
  const { user } = useAuth();
  const { addItem } = useCart();
  const { toast } = useToast();
  const { items: wishlist, isLoading, error, refetch, setSaved, isSaving } = useWishlist();

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: item.id,
      name: item.name,
      price: item.price,
      image: item.image,
      vendor: item.vendor,
      vendorId: item.vendorId,
    });
    toast({
      title: "Added to cart",
      description: `${item.name} has been added to your cart.`,
    });
  };

  const handleRemove = async (id: string) => {
    try {
    await setSaved(id, false);
    toast({
      title: "Removed from wishlist",
      description: "Item has been removed from your wishlist.",
    });
    } catch (error) {
      toast({ title: "Unable to remove item", description: (error as Error).message, variant: "destructive" });
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
            <p className="text-muted-foreground mb-8">
              You need to be signed in to view your wishlist.
            </p>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/account">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account
            </Link>
          </Button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Heart className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Wishlist</h1>
              <p className="text-muted-foreground">{wishlist.length} items saved</p>
            </div>
          </div>

          {/* Wishlist Items */}
          {isLoading ? <p role="status">Loading your wishlist...</p> : error ? <div role="alert"><p>Unable to load your wishlist.</p><Button onClick={() => refetch()}>Try again</Button></div> : wishlist.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <Heart className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Your wishlist is empty</h3>
              <p className="text-muted-foreground mb-6">
                Save items you love for later by clicking the heart icon.
              </p>
              <Button asChild>
                <Link to="/products">Browse Products</Link>
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {wishlist.map((item) => (
                <div
                  key={item.id}
                  className="group bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-all"
                >
                  <div className="relative aspect-square overflow-hidden bg-muted">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                    <button
                      aria-label={`Remove ${item.name} from wishlist`}
                      disabled={isSaving}
                      onClick={() => handleRemove(item.id)}
                      className="absolute top-3 right-3 w-9 h-9 bg-background/90 backdrop-blur-sm rounded-full flex items-center justify-center text-destructive hover:bg-destructive hover:text-destructive-foreground transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="p-4">
                    <p className="text-xs text-primary font-medium mb-1">{item.vendor}</p>
                    <h3 className="font-semibold text-foreground mb-2 line-clamp-2">
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1 mb-3">
                      <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                      <span className="text-sm font-medium">{item.rating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-lg font-bold text-foreground">GH₵{item.price}</span>
                      <Button size="sm" disabled={item.stock <= 0} onClick={() => handleAddToCart(item)}>
                        <ShoppingCart className="w-4 h-4 mr-2" />
                        Add to Cart
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BuyerWishlist;
