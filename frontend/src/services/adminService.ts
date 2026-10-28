import { api } from "@/integrations/api/client";
import { Transaction, Review, Coupon, SupportTicket, SystemLog } from "@/types/admin";

async function attachProfiles(rows: Record<string, unknown>[]) {
    const ids = [...new Set(rows.map(row => String(row.user_id || "")).filter(Boolean))];
    if (!ids.length) return rows;
    const { data, error } = await api.from("profiles").select("user_id, full_name, avatar_url").in("user_id", ids);
    if (error) throw error;
    const profiles = new Map((data || []).map(profile => [profile.user_id, profile]));
    return rows.map(row => ({ ...row, user: profiles.get(String(row.user_id)) || null }));
}


export const adminService = {
    async getManagedVendors() {
        const { data, error } = await (api as any).rpc("list_managed_vendors");
        if (error) throw error;
        return data || [];
    },

    async updateVendorStatus(vendorId: string, newStatus: "pending" | "approved" | "suspended") {
        const { data, error } = await (api as any).rpc("update_vendor_status", {
            _vendor_id: vendorId, _new_status: newStatus,
        });
        if (error) throw error;
        if (data !== true) throw new Error("The server did not confirm this vendor status change.");
    },

    // --- Audit logging (best-effort, never blocks the primary action) ---
    async logAdminAction(source: string, message: string, metadata: Record<string, any> = {}) {
        try {
            const { data: { user } } = await api.auth.getUser();
            await (api as any).from('system_logs').insert({
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
        const { data, error } = await (api as any)
            .from('transactions')
            .select(`
                *
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return await attachProfiles(data || []) as unknown as Transaction[];
    },

    // --- Reviews ---
    async getReviews(): Promise<Review[]> {
        const { data, error } = await (api as any)
            .from('reviews')
            .select(`
                *,
                product:products(name, image_url)
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return await attachProfiles(data || []) as unknown as Review[];
    },

    async moderateReview(id: string, status: 'approved' | 'rejected') {
        const { error } = await (api as any).from('reviews').update({ status }).eq('id', id);
        if (error) throw error;
        await adminService.logAdminAction('review_moderation', `Review ${status}`, { review_id: id, status });
    },

    // --- Coupons ---
    async getCoupons(): Promise<Coupon[]> {
        const { data, error } = await (api as any)
            .from('coupons')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as Coupon[];
    },

    // --- Payouts ---
    async getPayoutRequests() {
        const { data: payouts, error } = await (api as any)
            .from('payout_requests')
            .select('*')
            .order('requested_at', { ascending: false });

        if (error) throw error;
        if (!payouts || payouts.length === 0) return [];

        const vendorIds = [...new Set<string>(payouts.map((p: { vendor_id: string }) => p.vendor_id))];
        const { data: vendorProfiles } = await api
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
        const { error } = await (api as any).rpc('approve_payout_request', {
            _payout_id: payoutId,
            _new_status: newStatus,
        });

        if (error) throw error;
    },

    // --- Support ---
    async getSupportTickets(): Promise<SupportTicket[]> {
        const { data, error } = await (api as any)
            .from('support_tickets')
            .select(`
                *
            `)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return await attachProfiles(data || []) as unknown as SupportTicket[];
    },

    async updateTicketStatus(id: string, status: 'open' | 'in_progress' | 'resolved' | 'closed') {
        const { error } = await (api as any).from('support_tickets').update({ status }).eq('id', id);
        if (error) throw error;
        await adminService.logAdminAction('support_management', `Ticket status updated to ${status}`, { ticket_id: id, status });
    },

    async createTicket(subject: string, description: string, priority: 'low' | 'medium' | 'high' | 'critical' = 'medium') {
        const { data: { user } } = await api.auth.getUser();
        if (!user) throw new Error("Not authenticated");
        const { error } = await (api as any).from('support_tickets').insert({
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
        const { data, error } = await (api as any).from('system_logs')
            .select('*').order('created_at', { ascending: false }).limit(100);
        if (error) throw error;
        return data as SystemLog[];
    }
};
