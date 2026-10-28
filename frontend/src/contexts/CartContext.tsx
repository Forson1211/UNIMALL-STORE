import { createContext, useContext, useState, ReactNode, useEffect } from "react";
import { readCart, writeCart } from "@/lib/cartStorage";

export interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image: string;
  vendor: string;
  vendorId: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  totalItems: number;
  totalPrice: number;
  couponCode: string;
  setCouponCode: (code: string) => void;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(readCart);
  const [isOpen, setIsOpen] = useState(false);
  const [couponCode, setCouponCode] = useState(() => { try { return sessionStorage.getItem("unimall_cart_coupon") || ""; } catch { return ""; } });
  useEffect(() => { try { sessionStorage.setItem("unimall_cart_coupon", couponCode); } catch { /* Storage can be unavailable. */ } }, [couponCode]);

  useEffect(() => {
    writeCart(items);
  }, [items]);

  const addItem = (newItem: Omit<CartItem, "quantity">) => {
    if (!Number.isFinite(newItem.price) || newItem.price < 0 || !newItem.id) return;
    setItems((prev) => {
      const existing = prev.find((item) => item.id === newItem.id);
      if (existing) {
        return prev.map((item) =>
          item.id === newItem.id
            ? { ...newItem, quantity: Math.min(99, item.quantity + 1) }
            : item
        );
      }
      return [...prev, { ...newItem, quantity: 1 }];
    });
    // Don't auto-open cart drawer when adding items
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((item) => item.id !== id));
  };

  const updateQuantity = (id: string, quantity: number) => {
    if (!Number.isSafeInteger(quantity)) return;
    if (quantity <= 0) {
      removeItem(id);
      return;
    }
    setItems((prev) =>
      prev.map((item) => (item.id === id ? { ...item, quantity: Math.min(99, quantity) } : item))
    );
  };

  const clearCart = () => {
    setItems([]);
    setCouponCode("");
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
  const totalPrice = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const openCart = () => setIsOpen(true);
  const closeCart = () => setIsOpen(false);

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        removeItem,
        updateQuantity,
        clearCart,
        totalItems,
        totalPrice,
        couponCode,
        setCouponCode,
        isOpen,
        openCart,
        closeCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}
