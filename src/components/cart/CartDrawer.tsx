import { Link } from "react-router-dom";
import { Minus, Plus, ShoppingCart, Trash2, Store, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { useCart } from "@/contexts/CartContext";

export function CartDrawer() {
  const {
    items,
    removeItem,
    updateQuantity,
    clearCart,
    totalItems,
    totalPrice,
    isOpen,
    closeCart,
  } = useCart();

  return (
    <Sheet open={isOpen} onOpenChange={closeCart}>
      <SheetContent className="flex flex-col w-full sm:max-w-md p-0 gap-0">
        <SheetHeader className="px-6 pt-6 pb-4">
          <SheetTitle className="flex items-center gap-2.5 text-lg">
            <span className="w-9 h-9 rounded-full bg-[#FF5500]/10 flex items-center justify-center shrink-0">
              <ShoppingCart className="h-4 w-4 text-[#FF5500]" />
            </span>
            Your Cart
            <span className="text-sm font-medium text-gray-400">({totalItems})</span>
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6">
            <div className="w-20 h-20 rounded-full bg-[#FF5500]/10 flex items-center justify-center mb-5">
              <ShoppingCart className="w-9 h-9 text-[#FF5500]" />
            </div>
            <h3 className="text-lg font-bold text-gray-900 mb-2">Your cart is empty</h3>
            <p className="text-sm text-gray-400 mb-6">
              Add some products to your cart to continue shopping.
            </p>
            <Button
              onClick={closeCart}
              asChild
              className="rounded-full bg-[#FF5500] hover:bg-[#e54a00] px-6"
            >
              <Link to="/products">
                Browse Products
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="overflow-y-auto px-6" style={{ maxHeight: "min(46vh, 420px)" }}>
              <div className="space-y-3 pb-1">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="relative flex gap-3 p-3 rounded-2xl border border-gray-100 bg-white shadow-[0_2px_10px_-4px_rgba(0,0,0,0.08)]"
                  >
                    <div className="w-20 h-20 rounded-xl overflow-hidden bg-gray-100 border border-gray-100 shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="flex-1 min-w-0 pr-5">
                      <h4 className="font-semibold text-sm text-gray-900 line-clamp-1">
                        {item.name}
                      </h4>
                      {item.vendor && (
                        <p className="flex items-center gap-1 text-xs text-gray-400 mt-0.5 mb-2">
                          <Store className="w-3 h-3" />
                          {item.vendor}
                        </p>
                      )}
                      <div className="flex items-center justify-between mt-2">
                        <span className="font-bold text-[#FF5500]">
                          GH₵{item.price}
                        </span>
                        <div className="flex items-center gap-1 bg-gray-50 rounded-full p-1">
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity - 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:border-[#FF5500] hover:text-[#FF5500] transition-colors"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-gray-900">
                            {item.quantity}
                          </span>
                          <button
                            type="button"
                            onClick={() => updateQuantity(item.id, item.quantity + 1)}
                            className="w-6 h-6 rounded-full flex items-center justify-center bg-white border border-gray-200 text-gray-600 hover:border-[#FF5500] hover:text-[#FF5500] transition-colors"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
                      aria-label="Remove item"
                      className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="px-6 pt-5 pb-6 mt-2 border-t border-gray-100">
              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="text-gray-900 font-medium">GH₵{totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Delivery</span>
                  <span className="text-[#FF5500] font-semibold">Free</span>
                </div>
              </div>
              <div className="h-px bg-gray-100 mb-4" />
              <div className="flex justify-between items-center mb-5">
                <span className="font-bold text-gray-900">Total</span>
                <span className="font-extrabold text-xl text-gray-900">GH₵{totalPrice.toFixed(2)}</span>
              </div>
              <Button
                size="lg"
                asChild
                onClick={closeCart}
                className="w-full rounded-2xl bg-[#FF5500] hover:bg-[#e54a00] h-12"
              >
                <Link to="/checkout">
                  Proceed to Checkout
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full text-center text-xs font-semibold text-gray-400 hover:text-red-500 transition-colors mt-3"
              >
                Clear Cart
              </button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
