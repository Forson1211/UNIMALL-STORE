import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Info, CheckCircle, AlertTriangle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const AdminNotifications = () => {
    // Fetch real notifications from database
    const { data: notifications = [], isLoading } = useQuery({
        queryKey: ['admin-notifications'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('notifications')
                .select('*')
                .order('created_at', { ascending: false });
            if (error) throw error;
            return data;
        },
        refetchInterval: 10000, // Poll every 10s
    });

    return (
        <DashboardLayout type="admin" title="Notifications">
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Notifications
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage system alerts and messages.
                        </p>
                    </div>
                </div>

                <div className="space-y-4">
                    {isLoading ? (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                            <p className="text-muted-foreground">Loading notifications...</p>
                        </div>
                    ) : notifications.length === 0 ? (
                        <div className="text-center py-12 text-muted-foreground border-2 border-dashed rounded-xl">
                            <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                            <p>No notifications found.</p>
                        </div>
                    ) : (
                        notifications.map((notification: any) => (
                            <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.read ? 'border-primary/50 bg-primary/5 shadow-sm' : ''}`}>
                                <CardHeader className="flex flex-row items-start gap-4 pb-2">
                                    <div className={`p-2 rounded-full ${notification.type === 'info' ? 'bg-blue-100 text-blue-600' :
                                        notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                            'bg-yellow-100 text-yellow-600'
                                        }`}>
                                        {notification.type === 'info' ? <Info className="w-5 h-5" /> :
                                            notification.type === 'success' ? <CheckCircle className="w-5 h-5" /> :
                                                <AlertTriangle className="w-5 h-5" />}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-semibold">
                                                {notification.title}
                                            </CardTitle>
                                            <span className="text-xs text-muted-foreground">
                                                {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                            </span>
                                        </div>
                                        <CardDescription className="text-sm">
                                            {notification.message}
                                        </CardDescription>
                                    </div>
                                </CardHeader>
                            </Card>
                        ))
                    )}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminNotifications;

