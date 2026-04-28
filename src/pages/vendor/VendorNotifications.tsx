import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Bell, ShoppingCart, MessageSquare, Star, Loader2, Check } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const VendorNotifications = () => {
    const { user } = useAuth();

    const { data: notifications, isLoading, refetch } = useQuery({
        queryKey: ['vendor-notifications', user?.id],
        queryFn: async () => {
            if (!user) return [];
            // In a real app, you'd have a notifications table. 
            // Here we'll fetch recent relevant events (new orders, new reviews)
            
            // Fetch recent orders
            const { data: orders } = await supabase
                .from('order_items')
                .select('id, created_at, orders(buyer_id)')
                .eq('vendor_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            // Fetch recent reviews
            const { data: reviews } = await supabase
                .from('reviews')
                .select('id, created_at, rating, product:products!inner(name, vendor_id)')
                .eq('product.vendor_id', user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            const events = [
                ...(orders || []).map(o => ({
                    id: o.id,
                    type: 'order',
                    title: 'New Order Received',
                    description: `You have a new order for your items.`,
                    time: o.created_at,
                    icon: ShoppingCart,
                    color: 'text-blue-500',
                    bgColor: 'bg-blue-50'
                })),
                ...(reviews || []).map(r => ({
                    id: r.id,
                    type: 'review',
                    title: 'New Review Posted',
                    description: `Someone rated your product ${r.product?.name} ${r.rating} stars.`,
                    time: r.created_at,
                    icon: Star,
                    color: 'text-yellow-500',
                    bgColor: 'bg-yellow-50'
                }))
            ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

            return events;
        },
        enabled: !!user,
    });

    const markAllRead = () => {
        toast.success("All notifications marked as read");
    };

    return (
        <DashboardLayout type="vendor" title="Notifications">
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground mt-1">Stay updated with your store activity.</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={markAllRead}>
                        <Check className="w-4 h-4" /> Mark all as read
                    </Button>
                </div>

                {isLoading ? (
                    <div className="flex justify-center p-12"><Loader2 className="animate-spin w-8 h-8 text-primary" /></div>
                ) : notifications?.length === 0 ? (
                    <Card className="p-12 text-center text-muted-foreground">
                        <div className="flex flex-col items-center gap-4">
                            <Bell className="w-12 h-12 opacity-20" />
                            <p>No new notifications at the moment.</p>
                        </div>
                    </Card>
                ) : (
                    <div className="space-y-4">
                        {notifications?.map((notif) => (
                            <Card key={notif.id} className="hover:bg-muted/30 transition-colors cursor-pointer">
                                <CardContent className="p-4 sm:p-6">
                                    <div className="flex gap-4 sm:gap-6">
                                        <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${notif.bgColor} flex items-center justify-center shrink-0`}>
                                            <notif.icon className={`w-5 h-5 sm:w-6 sm:h-6 ${notif.color}`} />
                                        </div>
                                        <div className="flex-1 space-y-1">
                                            <div className="flex justify-between items-start gap-2">
                                                <h3 className="font-semibold text-sm sm:text-base">{notif.title}</h3>
                                                <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                                    {new Date(notif.time).toLocaleDateString()}
                                                </span>
                                            </div>
                                            <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                {notif.description}
                                            </p>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default VendorNotifications;
