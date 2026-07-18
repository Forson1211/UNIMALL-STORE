import { supabase } from "@/integrations/supabase/client";
import { withRetry } from "@/lib/dbUtils";

export interface StorefrontProduct {
    id: string;
    name: string;
    description: string;
    price: number;
    original_price: number | null;
    category: string;
    image: string;
    images?: string[];
    features?: string[];
    created_at: string;
    vendor: string;
    vendor_id: string;
    status: string | boolean;
    stock: number;
    rating: number;
    reviews: number;
}

export const productService = {
    async getProducts(filters?: {
        category?: string;
        search?: string;
        limit?: number;
        sortBy?: "created_at" | "rating" | "price";
        sortOrder?: "asc" | "desc";
    }) {
        return withRetry(async () => {
            let query = supabase
                .from("storefront_products_view" as any)
                .select("*");

            if (filters?.category && filters.category !== "All") {
                query = query.eq("category", filters.category);
            }
            if (filters?.search) {
                query = query.ilike("name", `%${filters.search}%`);
            }
            if (filters?.sortBy) {
                query = query.order(filters.sortBy, { ascending: filters.sortOrder === "asc" });
            }
            if (filters?.limit) {
                query = query.limit(filters.limit);
            }

            const { data, error } = await query;
            if (error) {
                console.error("Error fetching products:", error);
                return [] as StorefrontProduct[];
            }
            return (data ?? []) as unknown as StorefrontProduct[];
        }, [] as StorefrontProduct[]);
    },

    // Products with a real discount (original_price > price), ranked by discount %.
    // original_price isn't reliably filterable at the query level across environments,
    // so we fetch a batch with a plain select and rank client-side.
    async getDeals(limit = 6) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from("storefront_products_view" as any)
                .select("*")
                .limit(50);

            if (error) {
                console.error("Error fetching deals:", error);
                return [] as StorefrontProduct[];
            }

            const products = (data ?? []) as unknown as StorefrontProduct[];
            return products
                .filter((p) => p.original_price && p.original_price > p.price)
                .sort((a, b) => (1 - b.price / b.original_price!) - (1 - a.price / a.original_price!))
                .slice(0, limit);
        }, [] as StorefrontProduct[]);
    },

    async getProductById(id: string) {
        return withRetry(async () => {
            const { data, error } = await supabase
                .from("storefront_products_view" as any)
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as unknown as StorefrontProduct;
        }, null as unknown as StorefrontProduct, { retries: 2 });
    }
};
