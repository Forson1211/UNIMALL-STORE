import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Bell, ShoppingCart, Star, Loader2, Check, AlertTriangle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

interface VendorNotification {
    id: string;
    type: string;
    title: string;
    message: string | null;
    read: boolean;
    link: string | null;
    created_at: string;
}

const iconFor = (type: string) => {
    switch (type) {
        case "success": return { icon: ShoppingCart, color: "text-blue-500", bgColor: "bg-blue-50" };
        case "warning": return { icon: AlertTriangle, color: "text-amber-500", bgColor: "bg-amber-50" };
        case "info":
        default: return { icon: Star, color: "text-yellow-500", bgColor: "bg-yellow-50" };
    }
};

const VendorNotifications = () => {
    const { user } = useAuth();
    const queryClient = useQueryClient();

    const { data: notifications, isLoading } = useQuery({
        queryKey: ['vendor-notifications', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await (supabase as any)
                .from('notifications')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(50);

            if (error) throw error;
            return data as VendorNotification[];
        },
        enabled: !!user,
    });

    const markAllReadMutation = useMutation({
        mutationFn: async () => {
            if (!user) return;
            const { error } = await (supabase as any)
                .from('notifications')
                .update({ read: true })
                .eq('user_id', user.id)
                .eq('read', false);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-notifications'] });
            toast.success("All notifications marked as read");
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to mark notifications as read");
        }
    });

    const markReadMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('notifications')
                .update({ read: true })
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['vendor-notifications'] });
        }
    });

    const hasUnread = (notifications || []).some((n) => !n.read);

    return (
        <DashboardLayout type="vendor" title="Notifications">
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
                        <p className="text-muted-foreground mt-1">Stay updated with your store activity.</p>
                    </div>
                    <Button
                        variant="outline"
                        className="gap-2"
                        onClick={() => markAllReadMutation.mutate()}
                        disabled={!hasUnread || markAllReadMutation.isPending}
                    >
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
                        {notifications?.map((notif) => {
                            const { icon: Icon, color, bgColor } = iconFor(notif.type);
                            return (
                                <Card
                                    key={notif.id}
                                    className={`hover:bg-muted/30 transition-colors cursor-pointer ${!notif.read ? "border-primary/50 bg-primary/5" : ""}`}
                                    onClick={() => !notif.read && markReadMutation.mutate(notif.id)}
                                >
                                    <CardContent className="p-4 sm:p-6">
                                        <div className="flex gap-4 sm:gap-6">
                                            <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full ${bgColor} flex items-center justify-center shrink-0`}>
                                                <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${color}`} />
                                            </div>
                                            <div className="flex-1 space-y-1">
                                                <div className="flex justify-between items-start gap-2">
                                                    <h3 className="font-semibold text-sm sm:text-base flex items-center gap-2">
                                                        {notif.title}
                                                        {!notif.read && <span className="w-2 h-2 rounded-full bg-primary shrink-0" />}
                                                    </h3>
                                                    <span className="text-[10px] sm:text-xs text-muted-foreground whitespace-nowrap">
                                                        {new Date(notif.created_at).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                                                    {notif.message}
                                                </p>
                                            </div>
                                        </div>
                                    </CardContent>
                                </Card>
                            );
                        })}
                    </div>
                )}
            </div>
        </DashboardLayout>
    );
};

export default VendorNotifications;
