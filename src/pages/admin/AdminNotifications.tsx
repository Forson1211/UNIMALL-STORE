import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Info, CheckCircle, AlertTriangle, Trash2, Plus, Send, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const AdminNotifications = () => {
    const queryClient = useQueryClient();
    const [recipientType, setRecipientType] = useState<"individual" | "all_vendors" | "all_users">("individual");
    const [targetUserId, setTargetUserId] = useState("");
    const [title, setTitle] = useState("");
    const [message, setMessage] = useState("");
    const [type, setType] = useState("info");
    const [isDialogOpen, setIsDialogOpen] = useState(false);

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
        refetchInterval: 10000,
    });

    // Fetch profiles for target selector
    const { data: profiles = [] } = useQuery<any[]>({
        queryKey: ['profiles-list-for-notifications'],
        queryFn: async () => {
            const { data, error } = await (supabase as any)
                .from('admin_users_view')
                .select('user_id, email, full_name');
            if (error) throw error;
            return data || [];
        }
    });

    // Send Alert Mutation
    const sendNotificationMutation = useMutation({
        mutationFn: async () => {
            if (!title.trim()) throw new Error("Title is required");

            let targetUserIds: string[] = [];

            if (recipientType === "individual") {
                if (!targetUserId) throw new Error("Please select a recipient");
                targetUserIds = [targetUserId];
            } else if (recipientType === "all_vendors") {
                const { data: vendorRoles, error } = await supabase
                    .from('user_roles')
                    .select('user_id')
                    .eq('role', 'vendor');
                if (error) throw error;
                targetUserIds = (vendorRoles || []).map(vr => vr.user_id);
            } else {
                const { data: allProfiles, error } = await supabase
                    .from('profiles')
                    .select('user_id');
                if (error) throw error;
                targetUserIds = (allProfiles || []).map(p => p.user_id);
            }

            if (targetUserIds.length === 0) {
                throw new Error("No recipients found for the selected option");
            }

            const inserts = targetUserIds.map(uid => ({
                user_id: uid,
                title,
                message,
                type,
                read: false
            }));

            const { error: insertError } = await (supabase as any)
                .from('notifications')
                .insert(inserts);

            if (insertError) throw insertError;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            toast.success("Notification sent successfully!");
            setIsDialogOpen(false);
            setTitle("");
            setMessage("");
            setTargetUserId("");
        },
        onError: (err: any) => {
            toast.error(`Failed to send notification: ${err.message}`);
        }
    });

    // Delete Notification Mutation
    const deleteNotificationMutation = useMutation({
        mutationFn: async (id: string) => {
            const { error } = await (supabase as any)
                .from('notifications')
                .delete()
                .eq('id', id);
            if (error) throw error;
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-notifications'] });
            toast.success("Notification deleted successfully");
        },
        onError: (err: any) => {
            toast.error(`Failed to delete notification: ${err.message}`);
        }
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "error": return <AlertTriangle className="text-red-500 w-5 h-5" />;
            case "warning": return <AlertTriangle className="text-yellow-500 w-5 h-5" />;
            case "success": return <CheckCircle className="text-green-500 w-5 h-5" />;
            default: return <Info className="text-blue-500 w-5 h-5" />;
        }
    };

    return (
        <DashboardLayout type="admin" title="Notifications">
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                            Notifications
                        </h1>
                        <p className="text-muted-foreground mt-2">
                            Manage and broadcast system alerts.
                        </p>
                    </div>

                    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                        <DialogTrigger asChild>
                            <Button className="gap-2">
                                <Plus className="w-4 h-4" /> Send Alert
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-md">
                            <DialogHeader>
                                <DialogTitle>Send System Alert</DialogTitle>
                                <DialogDescription>Broadcast a notification to users or vendors.</DialogDescription>
                            </DialogHeader>

                            <div className="space-y-4 pt-4">
                                <div className="space-y-2">
                                    <Label>Recipient Option</Label>
                                    <select
                                        value={recipientType}
                                        onChange={(e: any) => setRecipientType(e.target.value)}
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="individual">Specific User</option>
                                        <option value="all_vendors">All Vendors</option>
                                        <option value="all_users">All Users</option>
                                    </select>
                                </div>

                                {recipientType === "individual" && (
                                    <div className="space-y-2">
                                        <Label>Select User</Label>
                                        <select
                                            value={targetUserId}
                                            onChange={(e) => setTargetUserId(e.target.value)}
                                            className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                        >
                                            <option value="">-- Choose User --</option>
                                            {profiles.map(p => (
                                                <option key={p.user_id} value={p.user_id}>
                                                    {p.full_name || p.email} ({p.email})
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <Label>Alert Type</Label>
                                    <select
                                        value={type}
                                        onChange={(e: any) => setType(e.target.value)}
                                        className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                                    >
                                        <option value="info">Info (Blue)</option>
                                        <option value="success">Success (Green)</option>
                                        <option value="warning">Warning (Yellow)</option>
                                        <option value="error">Error/Danger (Red)</option>
                                    </select>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="title">Title</Label>
                                    <Input
                                        id="title"
                                        value={title}
                                        onChange={(e) => setTitle(e.target.value)}
                                        placeholder="e.g. System Scheduled Maintenance"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="message">Message</Label>
                                    <Textarea
                                        id="message"
                                        value={message}
                                        onChange={(e) => setMessage(e.target.value)}
                                        placeholder="e.g. We will be performing server updates tonight..."
                                        rows={3}
                                    />
                                </div>

                                <div className="flex justify-end gap-2 pt-2">
                                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                                    <Button
                                        onClick={() => sendNotificationMutation.mutate()}
                                        disabled={sendNotificationMutation.isPending}
                                        className="gap-2"
                                    >
                                        {sendNotificationMutation.isPending ? (
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                        ) : (
                                            <Send className="w-4 h-4" />
                                        )}
                                        Send Alert
                                    </Button>
                                </div>
                            </div>
                        </DialogContent>
                    </Dialog>
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
                                    <div className={`p-2 rounded-full ${
                                        notification.type === 'success' ? 'bg-green-100 text-green-600' :
                                        notification.type === 'warning' ? 'bg-yellow-100 text-yellow-600' :
                                        notification.type === 'error' ? 'bg-red-100 text-red-600' :
                                        'bg-blue-100 text-blue-600'
                                    }`}>
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 space-y-1">
                                        <div className="flex items-center justify-between">
                                            <CardTitle className="text-base font-semibold">
                                                {notification.title}
                                            </CardTitle>
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs text-muted-foreground">
                                                    {formatDistanceToNow(new Date(notification.created_at), { addSuffix: true })}
                                                </span>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    className="h-7 w-7 text-destructive hover:bg-destructive/10 hover:text-destructive shrink-0"
                                                    onClick={() => deleteNotificationMutation.mutate(notification.id)}
                                                    disabled={deleteNotificationMutation.isPending}
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </Button>
                                            </div>
                                        </div>
                                        <CardDescription className="text-sm text-foreground/90">
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

