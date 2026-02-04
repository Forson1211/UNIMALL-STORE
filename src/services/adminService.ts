import { supabase } from "@/integrations/supabase/client";
import { Transaction, Review, Coupon, SupportTicket, SystemLog } from "@/types/admin";

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const adminService = {
    // --- Transactions ---
    async getTransactions(): Promise<Transaction[]> {
        try {
            // Cast supabase to any to bypass strict table typing until types are generated
            const { data, error } = await (supabase as any)
                .from('transactions')
                .select(`
          *,
          user:profiles(full_name)
        `)
                .order('created_at', { ascending: false });

            if (error) {
                console.warn("Supabase transactions fetch failed, using mock data:", error);
                throw error;
            }
            return data as Transaction[];
        } catch (e) {
            // Mock Data Fallback
            return [
                { id: "TRX-9871", user_id: "1", amount: 120.00, currency: "USD", status: "completed", type: "payment", payment_method: "Credit Card", created_at: "2024-03-15", user: { full_name: "Alice Johnson", email: "alice@example.com" } },
                { id: "TRX-9872", user_id: "2", amount: 45.50, currency: "USD", status: "pending", type: "payment", payment_method: "PayPal", created_at: "2024-03-15", user: { full_name: "Bob Smith", email: "bob@example.com" } },
                { id: "TRX-9875", user_id: "3", amount: 85.00, currency: "USD", status: "completed", type: "payment", payment_method: "Credit Card", created_at: "2024-03-13", user: { full_name: "Eva Davis", email: "eva@example.com" } }
            ] as unknown as Transaction[];
        }
    },

    // --- Reviews ---
    async getReviews(): Promise<Review[]> {
        try {
            const { data, error } = await (supabase as any)
                .from('reviews')
                .select(`
          *,
          user:profiles(full_name, avatar_url),
          product:products(name, image_url)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Review[];
        } catch (e) {
            return [
                { id: "1", user_id: "1", product_id: "101", rating: 5, comment: "Great lamp!", status: "pending", likes_count: 12, created_at: "2024-03-15", user: { full_name: "Alice Johnson", avatar_url: "" }, product: { name: "Modern Desk Lamp", image_url: "" } },
                { id: "2", user_id: "2", product_id: "102", rating: 2, comment: "Not meant for me.", status: "flagged", likes_count: 3, created_at: "2024-03-14", user: { full_name: "Mark Wilson", avatar_url: "" }, product: { name: "Headphones", image_url: "" } }
            ] as unknown as Review[];
        }
    },

    // --- Coupons ---
    async getCoupons(): Promise<Coupon[]> {
        try {
            const { data, error } = await (supabase as any)
                .from('coupons')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as Coupon[];
        } catch (e) {
            return [
                { id: "1", code: "WELCOME20", discount_type: "percentage", discount_value: 20, status: "active", usage_count: 45, usage_limit: 100, start_date: "2024-01-01" },
                { id: "2", code: "FREESHIP", discount_type: "fixed_amount", discount_value: 0, status: "active", usage_count: 120, usage_limit: 500, start_date: "2024-01-01", end_date: "2024-06-30" }
            ] as unknown as Coupon[];
        }
    },

    // --- Support ---
    async getSupportTickets(): Promise<SupportTicket[]> {
        try {
            const { data, error } = await (supabase as any)
                .from('support_tickets')
                .select(`
          *,
          user:profiles(full_name)
        `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data as SupportTicket[];
        } catch (e) {
            return [
                { id: "TKT-2024", subject: "Image Upload Error", description: "Fails partway", status: "open", priority: "high", created_at: "2024-03-15", user: { full_name: "Vendor TechStore", email: "tech@store.com" } },
                { id: "TKT-2023", subject: "Refund Request", description: "Order #9921", status: "in_progress", priority: "medium", created_at: "2024-03-15", user: { full_name: "John Doe", email: "john@doe.com" } }
            ] as unknown as SupportTicket[];
        }
    },

    // --- Logs ---
    async getSystemLogs(): Promise<SystemLog[]> {
        try {
            const { data, error } = await (supabase as any)
                .from('system_logs')
                .select('*')
                .order('created_at', { ascending: false })
                .limit(100);

            if (error) throw error;
            return data as SystemLog[];
        } catch (e) {
            return [
                { id: "1", type: "error", source: "System", message: "Database connection timeout", created_at: "2024-03-15T10:30:45Z" },
                { id: "2", type: "success", source: "Backup", message: "Backup completed", created_at: "2024-03-15T09:00:00Z" }
            ] as unknown as SystemLog[];
        }
    }
};
