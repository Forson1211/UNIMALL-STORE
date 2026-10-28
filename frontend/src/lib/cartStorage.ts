import type { CartItem } from "@/contexts/CartContext";

export function readCart(): CartItem[] {
  try {
    const saved: unknown = JSON.parse(localStorage.getItem("cart") || "[]");
    if (!Array.isArray(saved)) return [];
    const seen = new Set<string>();
    return saved.filter((item): item is CartItem => {
      if (!item || typeof item.id !== "string" || !item.id || seen.has(item.id) ||
          typeof item.name !== "string" || typeof item.vendorId !== "string" ||
          typeof item.image !== "string" || typeof item.vendor !== "string" ||
          !Number.isFinite(item.price) || item.price < 0 ||
          !Number.isSafeInteger(item.quantity) || item.quantity < 1 || item.quantity > 99) return false;
      seen.add(item.id);
      return true;
    });
  } catch { return []; }
}

export function writeCart(items: CartItem[]) {
  try { localStorage.setItem("cart", JSON.stringify(items)); } catch { /* Keep the in-memory cart when storage is full or blocked. */ }
}
