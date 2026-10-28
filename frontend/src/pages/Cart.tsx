import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { useCart } from "@/contexts/CartContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Minus,
  Plus,
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  ShieldCheck,
  Truck,
  RotateCcw,
  Store,
  Tag,
  CheckCircle2,
  Sparkles,
  Lock,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useCartQuote } from "@/hooks/useCartQuote";
import { orderService } from "@/services/orderService";
import { useQueryClient } from "@tanstack/react-query";

export default function Cart() {
  const { items, totalPrice, updateQuantity, removeItem, clearCart, totalItems, couponCode: savedCoupon, setCouponCode: saveCoupon } = useCart();
  const [couponCode, setCouponCode] = useState("");
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const { data: quote, error: quoteError, isFetching, refetch } = useCartQuote();
  const appliedCoupon = savedCoupon ? { code: savedCoupon } : null;
  const [couponError, setCouponError] = useState("");
  const { toast } = useToast();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleApplyCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    setCouponError("");
    const code = couponCode.trim().toUpperCase();
    if (!code) return;

    setApplyingCoupon(true);
    try {
      const result = await orderService.quote(items, code);
      queryClient.setQueryData(["cart-quote", items.map(({ id, quantity }) => ({ id, quantity })), code], result);
      saveCoupon(code);
      toast({
        title: "Coupon applied!",
        description: `GHS ${result.discount.toFixed(2)} saved on eligible products.`,
      });
      setCouponCode("");
    } catch (error) { setCouponError(error instanceof Error ? error.message : "Could not apply this coupon."); }
    finally { setApplyingCoupon(false); }
  };

  const discountAmount = quote?.discount || 0;
  const finalPrice = quote?.total ?? totalPrice;

  return (
    <div className="min-h-screen bg-[#f8f9fa] dark:bg-background text-foreground flex flex-col">
      <Navbar />

      <main className="flex-1 container max-w-6xl mx-auto px-4 pt-28 pb-20">
        {/* Breadcrumb & Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={() => navigate(-1)}
            className="text-sm font-semibold text-muted-foreground hover:text-foreground -ml-3"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Continue Shopping
          </Button>
          <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
            <Lock className="w-3.5 h-3.5 text-emerald-600" />
            <span>Secure 256-bit Encrypted Checkout</span>
          </div>
        </div>

        {items.length === 0 ? (
          /* Empty Cart State */
          <div className="bg-white dark:bg-card border border-border rounded-3xl p-12 text-center max-w-xl mx-auto shadow-sm my-8">
            <div className="w-24 h-24 rounded-full bg-orange-50 dark:bg-orange-950/20 text-[#FF5500] flex items-center justify-center mx-auto mb-6">
              <ShoppingBag className="w-12 h-12 stroke-[1.5]" />
            </div>
            <h1 className="text-2xl font-black mb-2 text-gray-900 dark:text-foreground">Your shopping cart is empty</h1>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-8">
              Looks like you haven't added anything to your cart yet. Explore hundreds of verified campus deals, gadgets, textbooks, and fashion from student sellers.
            </p>
            <Button
              asChild
              size="lg"
              className="rounded-xl bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold px-8 shadow-md shadow-orange-500/20"
            >
              <Link to="/products">
                Explore Marketplace
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>

            {/* Quick Categories */}
            <div className="mt-12 pt-8 border-t border-border/60">
              <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
                Popular Campus Categories
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {["Tech & Accessories", "Fashion & Wear", "Books & Stationery", "Hostel Essentials"].map((cat) => (
                  <Link
                    key={cat}
                    to={`/products?category=${encodeURIComponent(cat)}`}
                    className="px-3 py-1.5 rounded-full text-xs font-medium bg-muted hover:bg-orange-50 dark:hover:bg-muted/80 hover:text-[#FF5500] transition-colors"
                  >
                    {cat}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* Populated Cart */
          <div>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="text-3xl font-black text-gray-900 dark:text-foreground tracking-tight">Shopping Cart</h1>
                <p className="text-sm text-muted-foreground mt-1">
                  You have <span className="font-bold text-[#FF5500]">{totalItems}</span> item{totalItems === 1 ? "" : "s"} in your cart
                </p>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={clearCart}
                className="text-xs text-muted-foreground hover:text-destructive hover:border-destructive self-start md:self-auto"
              >
                <Trash2 className="w-3.5 h-3.5 mr-1.5" />
                Clear Cart
              </Button>
            </div>

            <div className="grid lg:grid-cols-[1fr_380px] gap-8 items-start">
              {/* Items List */}
              <div className="space-y-4">
                {items.map((item) => (
                  <article
                    key={item.id}
                    className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 sm:p-5 shadow-xs hover:border-border transition-all flex flex-col sm:flex-row items-start sm:items-center gap-4"
                  >
                    {/* Product Image */}
                    <Link
                      to={`/products/${item.id}`}
                      className="w-24 h-24 rounded-xl overflow-hidden bg-gray-50 dark:bg-muted shrink-0 border border-border/60"
                    >
                      <img
                        src={item.image || "/placeholder.svg"}
                        alt={item.name}
                        className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                      />
                    </Link>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <Link
                        to={`/products/${item.id}`}
                        className="font-bold text-sm sm:text-base text-gray-900 dark:text-foreground hover:text-[#FF5500] line-clamp-1 transition-colors"
                      >
                        {item.name}
                      </Link>

                      {item.vendor && (
                        <p className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                          <Store className="w-3.5 h-3.5 text-[#FF5500]" />
                          <span>{item.vendor}</span>
                        </p>
                      )}

                      <div className="mt-2 text-sm font-semibold text-gray-500">
                        Unit Price: <span className="text-gray-900 dark:text-foreground font-bold">GH₵{(quote?.items.find(line => line.id === item.id)?.price ?? item.price).toFixed(2)}</span>
                      </div>
                    </div>

                    {/* Quantity Stepper */}
                    <div className="flex items-center justify-between w-full sm:w-auto sm:justify-start gap-4 pt-3 sm:pt-0 border-t sm:border-t-0 border-border/60">
                      <div className="flex items-center bg-gray-50 dark:bg-muted rounded-full p-1 border border-border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-white dark:hover:bg-card text-gray-600 dark:text-foreground shadow-2xs"
                          aria-label={`Decrease quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                        >
                          <Minus className="w-3.5 h-3.5" />
                        </Button>
                        <span className="w-8 text-center text-xs font-bold select-none" aria-label="Quantity">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 rounded-full hover:bg-white dark:hover:bg-card text-gray-600 dark:text-foreground shadow-2xs"
                          aria-label={`Increase quantity of ${item.name}`}
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </Button>
                      </div>

                      {/* Total for item */}
                      <div className="text-right min-w-20">
                        <span className="font-extrabold text-base text-[#FF5500]">
                          GH₵{(quote?.items.find(line => line.id === item.id)?.total ?? item.price * item.quantity).toFixed(2)}
                        </span>
                      </div>

                      {/* Remove item */}
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive hover:bg-red-50 dark:hover:bg-red-950/20 rounded-full"
                        aria-label={`Remove ${item.name}`}
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </article>
                ))}

                {/* Promo Code Box */}
                <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-5 shadow-xs">
                  <div className="flex items-center gap-2 mb-3">
                    <Tag className="w-4 h-4 text-[#FF5500]" />
                    <h3 className="font-bold text-sm text-gray-900 dark:text-foreground">Have a Campus Promo Code?</h3>
                  </div>
                  <form onSubmit={handleApplyCoupon} className="flex gap-2">
                    <Input
                      placeholder="Enter a store or platform code"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value)}
                      className="h-11 rounded-xl text-sm uppercase tracking-wider font-semibold"
                    />
                    <Button
                      type="submit"
                      disabled={applyingCoupon || !couponCode.trim()}
                      variant="outline"
                      className="h-11 px-6 rounded-xl font-bold border-[#FF5500] text-[#FF5500] hover:bg-orange-50 hover:text-[#e54a00]"
                    >
                      Apply
                    </Button>
                  </form>
                  {couponError && <p className="text-xs text-destructive mt-2">{couponError}</p>}
                  {appliedCoupon && (
                    <div className="flex items-center justify-between mt-3 p-2.5 bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        Code <span className="font-bold">{appliedCoupon.code}</span> {quote?.coupon_code ? "applied" : "selected"}
                      </span>
                      <button
                        type="button"
                        onClick={() => { saveCoupon(""); setCouponError(""); }}
                        className="text-xs text-emerald-700 dark:text-emerald-400 hover:underline font-bold"
                      >
                        Remove
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Order Summary Card */}
              <div className="space-y-4 sticky top-24">
                <div className="bg-white dark:bg-card border border-border rounded-3xl p-6 shadow-sm">
                  <h2 className="font-extrabold text-lg text-gray-900 dark:text-foreground mb-4">Order Summary</h2>
                  {isFetching && <p role="status" className="text-sm mb-3">Checking current prices and stock...</p>}
                  {quoteError && <div role="alert" className="text-sm text-destructive mb-3"><p>{quoteError.message}</p><Button variant="link" onClick={() => refetch()}>Refresh cart</Button></div>}

                  <div className="space-y-3 text-sm border-b border-border pb-4 mb-4">
                    <div className="flex justify-between text-muted-foreground">
                      <span>Items Subtotal</span>
                      <span className="font-bold text-gray-900 dark:text-foreground">GH₵{(quote?.subtotal ?? totalPrice).toFixed(2)}</span>
                    </div>

                    <div className="flex justify-between text-muted-foreground items-center">
                      <span className="flex items-center gap-1.5">
                        Campus Delivery
                        <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-100 text-emerald-800 font-bold uppercase">
                          Free
                        </span>
                      </span>
                      <span className="font-semibold text-emerald-600">GH₵0.00</span>
                    </div>

                    {appliedCoupon && discountAmount > 0 && (
                      <div className="flex justify-between text-emerald-600 font-semibold">
                        <span>Discount ({appliedCoupon.code})</span>
                        <span>-GH₵{discountAmount.toFixed(2)}</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-between items-baseline mb-6">
                    <span className="font-bold text-base text-gray-900 dark:text-foreground">Estimated Total</span>
                    <span className="text-2xl font-black text-[#FF5500]">GH₵{finalPrice.toFixed(2)}</span>
                  </div>

                  <Button
                    disabled={!quote || !!quoteError || isFetching}
                    onClick={() => navigate("/checkout")}
                    size="lg"
                    className="w-full h-12 rounded-xl bg-[#FF5500] hover:bg-[#e54a00] text-white font-extrabold text-sm uppercase tracking-wider shadow-lg shadow-orange-500/25 transition-transform active:scale-[0.99]"
                  >
                      Proceed to Checkout
                      <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>

                  <div className="mt-4 text-center">
                    <p className="text-xs text-muted-foreground flex items-center justify-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-[#FF5500]" />
                      Pay with Cash on Delivery or Mobile Money upon arrival
                    </p>
                  </div>
                </div>

                {/* Trust Badges */}
                <div className="bg-white dark:bg-card border border-border/80 rounded-2xl p-4 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                    <span className="font-medium text-[11px] leading-tight">Buyer Protection</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <Truck className="w-5 h-5 text-[#FF5500]" />
                    <span className="font-medium text-[11px] leading-tight">Campus Delivery</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 text-muted-foreground">
                    <RotateCcw className="w-5 h-5 text-blue-600" />
                    <span className="font-medium text-[11px] leading-tight">Easy Returns</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
