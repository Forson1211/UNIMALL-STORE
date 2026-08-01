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
      <SheetContent side="right" className="flex flex-col w-[72%] sm:w-[70%] max-w-[275px] sm:max-w-sm p-0 gap-0 bg-white dark:bg-card border-l border-gray-200 dark:border-border">
        {/* Cart Drawer Header */}
        <SheetHeader className="px-5 py-4 border-b border-gray-100 dark:border-border flex flex-row items-center justify-between space-y-0 bg-gray-50/50 dark:bg-muted/30">
          <SheetTitle className="text-base font-bold text-gray-900 dark:text-foreground flex items-center gap-2">
            Shopping cart
            {totalItems > 0 && (
              <span className="text-xs font-semibold text-gray-500 dark:text-muted-foreground">({totalItems})</span>
            )}
          </SheetTitle>
        </SheetHeader>

        {items.length === 0 ? (
          /* Empty Cart View */
          <div className="flex-1 flex flex-col items-center justify-center text-center px-6 py-12">
            <div className="w-24 h-24 rounded-full bg-gray-50 dark:bg-muted flex items-center justify-center mb-6 border border-gray-100 dark:border-border">
              <ShoppingCart className="w-12 h-12 text-gray-300 dark:text-gray-600 stroke-[1.5]" />
            </div>
            <h3 className="text-sm font-bold text-gray-900 dark:text-foreground mb-4">No products in the cart.</h3>
            <Button
              onClick={closeCart}
              asChild
              className="rounded-full bg-[#FF5500] hover:bg-[#e54a00] text-white px-8 py-2.5 h-auto text-xs font-extrabold uppercase tracking-wider shadow-md shadow-orange-500/20"
            >
              <Link to="/products">
                RETURN TO SHOP
              </Link>
            </Button>
          </div>
        ) : (
          /* Items List View */
          <>
            <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="relative flex gap-3 p-3 rounded-xl border border-gray-100 dark:border-border bg-white dark:bg-muted/40 shadow-xs"
                >
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-gray-50 dark:bg-muted border border-gray-100 dark:border-border shrink-0">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0 pr-6">
                    <h4 className="font-bold text-xs text-gray-900 dark:text-foreground line-clamp-1">
                      {item.name}
                    </h4>
                    {item.vendor && (
                      <p className="flex items-center gap-1 text-[10px] text-gray-400 dark:text-muted-foreground mt-0.5 mb-1">
                        <Store className="w-3 h-3" />
                        {item.vendor}
                      </p>
                    )}
                    <div className="flex items-center justify-between gap-2 mt-2">
                      <span className="font-extrabold text-xs text-[#FF5500] shrink-0">
                        GH₵ {item.price.toLocaleString()}
                      </span>
                      <div className="flex items-center bg-gray-100/90 dark:bg-muted/80 rounded-full p-0.5 border border-gray-200/80 dark:border-border shadow-2xs shrink-0">
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-5 h-5 rounded-full flex items-center justify-center bg-white dark:bg-card border border-gray-200/60 dark:border-border text-gray-700 dark:text-foreground hover:bg-[#FF5500] hover:text-white hover:border-[#FF5500] active:scale-90 transition-all shadow-2xs"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="h-2.5 w-2.5 stroke-[2.5]" />
                        </button>
                        <span className="w-5 text-center text-[11px] font-black text-gray-900 dark:text-foreground select-none">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-5 h-5 rounded-full flex items-center justify-center bg-white dark:bg-card border border-gray-200/60 dark:border-border text-gray-700 dark:text-foreground hover:bg-[#FF5500] hover:text-white hover:border-[#FF5500] active:scale-90 transition-all shadow-2xs"
                          aria-label="Increase quantity"
                        >
                          <Plus className="h-2.5 w-2.5 stroke-[2.5]" />
                        </button>
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    aria-label="Remove item"
                    className="absolute top-2 right-2 p-1 rounded hover:bg-red-50 dark:hover:bg-red-950/20 text-gray-300 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Cart Footer */}
            <div className="px-5 pt-4 pb-6 border-t border-gray-100 dark:border-border bg-gray-50/50 dark:bg-muted/30">
              <div className="space-y-1.5 mb-4">
                <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-muted-foreground">
                  <span>Subtotal</span>
                  <span className="text-gray-900 dark:text-foreground font-bold">GH₵{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs font-medium text-gray-500 dark:text-muted-foreground">
                  <span>Delivery</span>
                  <span className="text-[#FF5500] font-bold">Free</span>
                </div>
                <div className="pt-2 border-t border-gray-200 dark:border-border flex justify-between items-center">
                  <span className="font-extrabold text-sm text-gray-900 dark:text-foreground uppercase">Total</span>
                  <span className="font-black text-lg text-gray-900 dark:text-foreground">GH₵{totalPrice.toLocaleString()}</span>
                </div>
              </div>

              <Button
                size="lg"
                asChild
                onClick={closeCart}
                className="w-full rounded bg-[#FF5500] hover:bg-[#e54a00] text-white font-extrabold h-11 text-xs uppercase tracking-wider shadow-md shadow-orange-500/20"
              >
                <Link to="/checkout">
                  PROCEED TO CHECKOUT
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <button
                type="button"
                onClick={clearCart}
                className="w-full text-center text-xs font-bold text-gray-400 hover:text-red-500 transition-colors mt-3 uppercase tracking-wider"
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
