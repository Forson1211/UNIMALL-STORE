import { useQuery } from "@tanstack/react-query";
import { useCart } from "@/contexts/CartContext";
import { orderService } from "@/services/orderService";

export function useCartQuote() {
  const { items, couponCode } = useCart();
  const lines = items.map(({ id, quantity }) => ({ id, quantity }));
  return useQuery({
    queryKey: ["cart-quote", lines, couponCode],
    queryFn: () => orderService.quote(lines, couponCode),
    enabled: items.length > 0,
    staleTime: 0,
    refetchOnMount: "always",
    refetchInterval: 15000,
    retry: false,
  });
}
