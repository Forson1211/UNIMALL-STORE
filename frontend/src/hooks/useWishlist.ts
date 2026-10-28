import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { unpackProductMetadata } from "@/services/vendorService";
import { CartItem } from "@/contexts/CartContext";

export type WishlistItem = Omit<CartItem, "quantity"> & { rating: number; stock: number };
export function useWishlist() {
  const { user } = useAuth();
  const client = useQueryClient();
  const key = ["wishlist", user?.id];
  const query = useQuery({
    queryKey: key,
    enabled: !!user,
    queryFn: async (): Promise<WishlistItem[]> => {
      const { data, error } = await (api as any).from("wishlists")
        .select("product_id, products(*)").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).filter((row: any) => row.products).map((row: any) => {
        const p = unpackProductMetadata(row.products);
        return { id: row.product_id, name: p.name, price: Number(p.price),
          image: p.image || p.image_url || "/placeholder.svg", vendor: p.vendor || "Campus Merchant",
          vendorId: p.vendor_id, rating: Number(p.rating || 0), stock: Number(p.stock ?? p.stock_quantity ?? 0) };
      });
    },
  });
  const mutation = useMutation({
    mutationFn: async ({ id, saved }: { id: string; saved: boolean }) => {
      if (!user) throw new Error("Sign in to save products to your wishlist.");
      const result = saved
        ? await (api as any).from("wishlists").upsert({ user_id: user.id, product_id: id }, { onConflict: "user_id,product_id" })
        : await (api as any).from("wishlists").delete().eq("user_id", user.id).eq("product_id", id);
      if (result.error) throw result.error;
    },
    onSuccess: () => client.invalidateQueries({ queryKey: key }),
  });
  return { items: query.data || [], isLoading: query.isLoading, error: query.error,
    refetch: query.refetch, isSaving: mutation.isPending,
    isSaved: (id: string) => (query.data || []).some(item => item.id === id),
    setSaved: (id: string, saved: boolean) => mutation.mutateAsync({ id, saved }) };
}
