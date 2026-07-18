import { supabase } from "@/integrations/supabase/client";

export const vendorService = {
    async getDashboardStats(vendorId: string) {
        const { data, error } = await (supabase
            .from("vendor_dashboard_stats" as any)
            .select("*")
            .eq("vendor_id", vendorId)
            .single() as any);

        if (error) {
            if (error.code === "PGRST116") {
                return {
                    total_revenue: 0,
                    total_orders: 0,
                    total_products: 0,
                    low_stock_count: 0,
                };
            }
            throw error;
        }
        return data;
    },

    async getProducts(vendorId: string) {
        const { data, error } = await (supabase
            .from("vendor_products_view" as any)
            .select("*")
            .eq("vendor_id", vendorId)
            .order("created_at", { ascending: false }) as any);

        if (error) throw error;
        return data;
    },

    async getOrders(vendorId: string) {
        const { data, error } = await (supabase
            .from("vendor_orders_view" as any)
            .select("*")
            .eq("vendor_id", vendorId)
            .order("created_at", { ascending: false }) as any);

        if (error) throw error;
        return data;
    },

    async getWeeklySales(vendorId: string) {
        const { data, error } = await (supabase
            .from("vendor_weekly_sales" as any)
            .select("*")
            .eq("vendor_id", vendorId)
            .order("week_start", { ascending: true }) as any);

        if (error) {
            // View may not exist yet if the migration hasn't been run
            console.error("Error fetching weekly sales:", error);
            return [];
        }
        return data as { week_start: string; revenue: number; orders: number }[];
    },

    async createProduct(product: any) {
        const { data, error } = await supabase
            .from("products")
            .insert(product)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async updateProduct(id: string, updates: any) {
        const { data, error } = await supabase
            .from("products")
            .update(updates)
            .eq("id", id)
            .select()
            .single();

        if (error) throw error;
        return data;
    },

    async deleteProduct(id: string) {
        const { error } = await supabase
            .from("products")
            .delete()
            .eq("id", id);

        if (error) throw error;
    }
};
