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
    },

    async getAvailableBalance(vendorId: string) {
        const { data: orderItems, error: oiError } = await (supabase
            .from("order_items")
            .select("price_at_purchase, quantity, orders!inner(status)")
            .eq("vendor_id", vendorId)
            .eq("orders.status", "delivered") as any);

        if (oiError) throw oiError;
        const earned = (orderItems || []).reduce(
            (sum: number, item: any) => sum + item.price_at_purchase * item.quantity,
            0
        );

        const { data: payouts, error: poError } = await (supabase as any)
            .from("payout_requests")
            .select("amount, status")
            .eq("vendor_id", vendorId)
            .in("status", ["approved", "paid"]);

        if (poError) throw poError;
        const paidOut = (payouts || []).reduce((sum: number, p: any) => sum + Number(p.amount), 0);

        return { earned, paidOut, balance: Math.max(0, earned - paidOut) };
    },

    async getPayoutRequests(vendorId: string) {
        const { data, error } = await (supabase as any)
            .from("payout_requests")
            .select("*")
            .eq("vendor_id", vendorId)
            .order("requested_at", { ascending: false });

        if (error) throw error;
        return data;
    },

    async requestPayout(vendorId: string, amount: number, paymentMethod: string, paymentDetails: any) {
        const { error } = await (supabase as any).from("payout_requests").insert({
            vendor_id: vendorId,
            amount,
            payment_method: paymentMethod,
            payment_details: paymentDetails,
        });

        if (error) throw error;
    },

    async getPaymentMethods(vendorId: string) {
        const { data, error } = await (supabase as any)
            .from("vendor_payment_methods")
            .select("*")
            .eq("vendor_id", vendorId)
            .order("created_at", { ascending: false });

        if (error) throw error;
        return data;
    },

    async addPaymentMethod(vendorId: string, method: { type: string; label: string; details: any }) {
        const { error } = await (supabase as any).from("vendor_payment_methods").insert({
            vendor_id: vendorId,
            ...method,
        });

        if (error) throw error;
    },

    async deletePaymentMethod(id: string) {
        const { error } = await (supabase as any).from("vendor_payment_methods").delete().eq("id", id);
        if (error) throw error;
    }
};
