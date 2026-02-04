import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bell, Info, CheckCircle, AlertTriangle } from "lucide-react";

const AdminNotifications = () => {
    // Mock notifications for now
    const notifications = [
        {
            id: 1,
            title: "New Vendor Application",
            message: "A new vendor 'Campus Books' has applied to join.",
            time: "2 hours ago",
            type: "info",
            read: false,
        },
        {
            id: 2,
            title: "System Update",
            message: "The system was successfully updated to v2.0.",
            time: "1 day ago",
            type: "success",
            read: true,
        },
        {
            id: 3,
            title: "Server Load Warning",
            message: "High traffic detected on the main server.",
            time: "2 days ago",
            type: "warning",
            read: true,
        },
    ];

    return (
        <DashboardLayout type="admin" title="Notifications">
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                        Notifications
                    </h1>
                    <p className="text-muted-foreground mt-2">
                        Manage system alerts and messages.
                    </p>
                </div>

                <div className="space-y-4">
                    {notifications.map((notification) => (
                        <Card key={notification.id} className={`transition-all hover:shadow-md ${!notification.read ? 'border-primary/50 bg-primary/5' : ''}`}>
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
                                        <span className="text-xs text-muted-foreground">{notification.time}</span>
                                    </div>
                                    <CardDescription>
                                        {notification.message}
                                    </CardDescription>
                                </div>
                            </CardHeader>
                        </Card>
                    ))}
                </div>
            </div>
        </DashboardLayout>
    );
};

export default AdminNotifications;
