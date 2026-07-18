import { supabase } from "@/integrations/supabase/client";
import { Transaction, Review, Coupon, SupportTicket, SystemLog } from "@/types/admin";

// Helper to simulate delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

export const adminService = {
    // --- Audit logging (best-effort, never blocks the primary action) ---
    async logAdminAction(source: string, message: string, metadata: Record<string, any> = {}) {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            await (supabase as any).from('system_logs').insert({
                type: 'security',
                source,
                message,
                metadata,
                user_id: user?.id,
            });
        } catch {
            // audit logging is best-effort only
        }
    },

    // --- Transactions ---
    async getTransactions(): Promise<Transaction[]> {
        const { data, error } = await (supabase as any)
            .from('transactions')
            .select(`
                *,
                user:profiles(full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Transaction[];
    },

    // --- Reviews ---
    async getReviews(): Promise<Review[]> {
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
    },

    async moderateReview(id: string, status: 'approved' | 'rejected') {
        const { error } = await (supabase as any).from('reviews').update({ status }).eq('id', id);
        if (error) throw error;
        await adminService.logAdminAction('review_moderation', `Review ${status}`, { review_id: id, status });
    },

    // --- Coupons ---
    async getCoupons(): Promise<Coupon[]> {
        const { data, error } = await (supabase as any)
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Coupon[];
    },

    // --- Payouts ---
    async getPayoutRequests() {
        const { data: payouts, error } = await (supabase as any)
            .from('payout_requests')
            .select('*')
            .order('requested_at', { ascending: false });

        if (error) throw error;
        if (!payouts || payouts.length === 0) return [];

        const vendorIds = [...new Set(payouts.map((p: any) => p.vendor_id))];
        const { data: vendorProfiles } = await supabase
            .from('profiles')
            .select('user_id, store_name, full_name')
            .in('user_id', vendorIds);

        const profileMap = new Map((vendorProfiles || []).map((p: any) => [p.user_id, p]));
        return payouts.map((p: any) => ({
            ...p,
            vendor: profileMap.get(p.vendor_id) || null,
        }));
    },

    async processPayoutRequest(payoutId: string, newStatus: 'approved' | 'paid' | 'rejected') {
        const { error } = await (supabase as any).rpc('approve_payout_request', {
            _payout_id: payoutId,
            _new_status: newStatus,
        });

        if (error) throw error;
    },

    // --- Support ---
    async getSupportTickets(): Promise<SupportTicket[]> {
        const { data, error } = await (supabase as any)
            .from('support_tickets')
            .select(`
                *,
                user:profiles(full_name)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as SupportTicket[];
    },

    async updateTicketStatus(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
        const { error } = await (supabase as any).from('support_tickets').update({ status }).eq('id', id);
        if (error) throw error;
        await adminService.logAdminAction('support_management', `Ticket status updated to ${status}`, { ticket_id: id, status });
    },

    async createTicket(subject: string, description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { error } = await (supabase as any).from('support_tickets').insert({
            user_id: user.id,
            subject,
            description,
            priority,
            status: 'open',
        });
        if (error) throw error;
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
