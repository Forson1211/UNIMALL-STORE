export interface Transaction {
    id: string;
    user_id: string;
    amount: number;
    currency: string;
    status: 'pending' | 'completed' | 'failed' | 'refunded';
    type: 'payment' | 'withdrawal' | 'refund';
    payment_method: string;
    reference_id?: string;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
}

export interface Review {
    id: string;
    user_id: string;
    product_id: string;
    rating: number;
    comment: string;
    status: 'pending' | 'approved' | 'flagged' | 'rejected';
    likes_count: number;
    created_at: string;
    user?: {
        full_name: string;
        avatar_url: string;
    };
    product?: {
        name: string;
        image_url: string;
    };
}

export interface Coupon {
    id: string;
    code: string;
    discount_type: 'percentage' | 'fixed_amount';
    discount_value: number;
    status: 'active' | 'expired' | 'disabled';
    usage_count: number;
    usage_limit?: number;
    start_date: string;
    end_date?: string;
    created_by?: string;
    created_at?: string;
}

export interface SupportTicket {
    id: string;
    subject: string;
    description: string;
    status: 'open' | 'in_progress' | 'resolved' | 'closed';
    priority: 'low' | 'medium' | 'high' | 'critical';
    category?: string;
    created_at: string;
    user?: {
        full_name: string;
        email: string;
    };
}

export interface SystemLog {
    id: string;
    type: 'info' | 'success' | 'warning' | 'error' | 'security';
    source: string;
    message: string;
    created_at: string;
}
