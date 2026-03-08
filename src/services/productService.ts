import { supabase } from "@/integrations/supabase/client";

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
    async getProducts(filters?: { category?: string; search?: string; limit?: number }) {
        try {
            let query = supabase
                .from("storefront_products_view" as any)
                .select("*");

            if (filters?.category && filters.category !== "All") {
                query = query.eq("category", filters.category);
            }

            if (filters?.search) {
                query = query.ilike("name", `%${filters.search}%`);
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
        } catch (err) {
            console.error("Network error fetching products:", err);
            return [] as StorefrontProduct[];
        }
    },

    async getProductById(id: string) {
        try {
            const { data, error } = await supabase
                .from("storefront_products_view" as any)
                .select("*")
                .eq("id", id)
                .single();

            if (error) throw error;
            return data as unknown as StorefrontProduct;
        } catch (err) {
            throw err;
        }
    }
};
