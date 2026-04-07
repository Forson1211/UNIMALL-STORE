-- Ensure core tables exist or have correct structures for Admin Modules

-- 1. Transactions Table
CREATE TABLE IF NOT EXISTS public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    amount DECIMAL(12,2) NOT NULL,
    currency TEXT DEFAULT 'GH₵',
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    type TEXT DEFAULT 'payment' CHECK (type IN ('payment', 'withdrawal', 'refund')),
    payment_method TEXT,
    reference_id TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Reviews Table (if missing)
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'flagged', 'rejected')),
    likes_count INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Coupons Table
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code TEXT UNIQUE NOT NULL,
    discount_type TEXT NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
    discount_value DECIMAL(12,2) NOT NULL,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'expired', 'disabled')),
    usage_count INTEGER DEFAULT 0,
    usage_limit INTEGER,
    start_date TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    end_date TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. Support Tickets
CREATE TABLE IF NOT EXISTS public.support_tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    subject TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'resolved', 'closed')),
    priority TEXT DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 5. System Logs
CREATE TABLE IF NOT EXISTS public.system_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    type TEXT NOT NULL CHECK (type IN ('info', 'success', 'warning', 'error', 'security', 'admin_action')),
    source TEXT,
    message TEXT NOT NULL,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 6. Notifications
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'info',
    read BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. Admin Users View (for User Management)
CREATE OR REPLACE VIEW public.admin_users_view AS
SELECT 
    p.id as user_id,
    p.full_name,
    p.email,
    p.role,
    p.created_at as joined_at,
    p.avatar_url,
    p.phone_number as phone,
    p.address,
    (SELECT COUNT(*) FROM public.orders WHERE buyer_id = p.id) as total_orders_as_buyer,
    (SELECT COUNT(*) FROM public.products WHERE vendor_id = p.id) as total_products_as_vendor,
    v.status as vendor_status,
    v.store_name
FROM public.profiles p
LEFT JOIN public.vendors v ON p.id = v.id;

-- 8. Updated Admin Dashboard Stats View
CREATE OR REPLACE VIEW public.admin_dashboard_stats AS
SELECT 
    (SELECT COUNT(*) FROM public.profiles) as total_users,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'admin') as total_admins,
    (SELECT COUNT(*) FROM public.vendors) as total_vendors,
    (SELECT COUNT(*) FROM public.profiles WHERE role = 'buyer') as total_buyers,
    (SELECT COUNT(*) FROM public.vendors WHERE status = 'pending') as vendors_pending,
    (SELECT COUNT(*) FROM public.vendors WHERE status = 'approved') as vendors_approved,
    (SELECT COUNT(*) FROM public.vendors WHERE status = 'suspended') as vendors_suspended,
    (SELECT COUNT(*) FROM public.products) as total_products,
    (SELECT COUNT(*) FROM public.products WHERE is_active = true) as active_products,
    (SELECT COUNT(*) FROM public.products WHERE is_active = false) as draft_products,
    (SELECT COUNT(*) FROM public.orders) as total_orders,
    (SELECT COALESCE(SUM(total_amount), 0) FROM public.orders WHERE status != 'cancelled') as total_revenue,
    (SELECT COUNT(*) FROM public.orders WHERE status = 'pending') as pending_orders,
    (SELECT COUNT(*) FROM public.profiles WHERE created_at > now() - interval '7 days') as new_users_week,
    (SELECT COUNT(*) FROM public.orders WHERE created_at > now() - interval '7 days') as new_orders_week;

-- 9. RPC Function for analytical charts
CREATE OR REPLACE FUNCTION public.get_admin_analytics_charts()
RETURNS JSON AS $$
DECLARE
    revenue_chart JSON;
    growth_chart JSON;
BEGIN
    -- Monthly Revenue (Last 6 months)
    SELECT json_agg(t) INTO revenue_chart
    FROM (
        SELECT 
            to_char(date_trunc('month', created_at), 'Mon') as name,
            COALESCE(SUM(total_amount), 0) as revenue,
            COUNT(*) as orders
        FROM public.orders
        WHERE created_at > now() - interval '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;

    -- Growth chart (New users vs Orders)
    SELECT json_agg(t) INTO growth_chart
    FROM (
        SELECT 
            to_char(date_trunc('month', created_at), 'Mon') as name,
            (SELECT COUNT(*) FROM public.profiles p WHERE date_trunc('month', p.created_at) = date_trunc('month', o.created_at)) as users,
            COUNT(*) as orders
        FROM public.orders o
        WHERE created_at > now() - interval '6 months'
        GROUP BY date_trunc('month', created_at)
        ORDER BY date_trunc('month', created_at)
    ) t;

    RETURN json_build_object(
        'revenue_data', COALESCE(revenue_chart, '[{"name":"Jan","revenue":0,"orders":0}]'::json),
        'growth_data', COALESCE(growth_chart, '[{"name":"Jan","users":0,"orders":0}]'::json)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Enable Realtime for key tables
ALTER PUBLICATION supabase_realtime ADD TABLE orders, products, vendors, notifications, system_logs;
