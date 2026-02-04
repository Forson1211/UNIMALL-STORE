import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, CheckCircle, Info, ShieldAlert, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";

const AdminLogs = () => {
    const { data: logs, isLoading } = useQuery({
        queryKey: ['admin-logs'],
        queryFn: adminService.getSystemLogs,
        refetchInterval: 5000, // Live poll every 5s
    });

    const getIcon = (type: string) => {
        switch (type) {
            case "error": return <AlertCircle className="text-red-500 w-4 h-4" />;
            case "warning": return <AlertCircle className="text-yellow-500 w-4 h-4" />;
            case "success": return <CheckCircle className="text-green-500 w-4 h-4" />;
            case "security": return <ShieldAlert className="text-purple-500 w-4 h-4" />;
            default: return <Info className="text-blue-500 w-4 h-4" />;
        }
    };

    return (
        <DashboardLayout type="admin" title="System Logs">
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">System Logs</h1>
                        <p className="text-muted-foreground mt-1">Audit trail and system events.</p>
                    </div>
                </div>

                <Card className="bg-zinc-950 text-zinc-50 border-zinc-800">
                    <CardHeader className="border-b border-zinc-900 pb-4">
                        <div className="flex items-center justify-between">
                            <CardTitle className="font-mono text-sm uppercase tracking-widest text-zinc-400">Live Console</CardTitle>
                            <div className="flex gap-2">
                                <span className="h-3 w-3 rounded-full bg-red-500"></span>
                                <span className="h-3 w-3 rounded-full bg-yellow-500"></span>
                                <span className="h-3 w-3 rounded-full bg-green-500"></span>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent className="p-0">
                        <ScrollArea className="h-[600px] p-4 font-mono text-sm">
                            {isLoading ? (
                                <div className="flex justify-center items-center h-full text-zinc-500 gap-2">
                                    <Loader2 className="animate-spin w-4 h-4" /> Connecting to stream...
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    {logs?.map((log) => (
                                        <div key={log.id} className="flex items-start gap-4 hover:bg-zinc-900/50 p-2 rounded transition-colors group">
                                            <span className="text-zinc-500 shrink-0 w-40 text-xs mt-0.5">
                                                {new Date(log.created_at).toISOString().replace('T', ' ').substring(0, 19)}
                                            </span>
                                            <div className="shrink-0 mt-0.5">{getIcon(log.type)}</div>
                                            <Badge variant="outline" className="text-xs border-zinc-700 text-zinc-400 w-24 justify-center shrink-0 uppercase">
                                                {log.source || 'SYSTEM'}
                                            </Badge>
                                            <span className={`break-all ${log.type === 'error' ? 'text-red-400' :
                                                    log.type === 'security' ? 'text-purple-400' :
                                                        log.type === 'warning' ? 'text-yellow-400' :
                                                            'text-zinc-300'
                                                }`}>
                                                {log.message}
                                            </span>
                                        </div>
                                    ))}
                                    <div className="h-4 w-2 bg-zinc-500 animate-pulse mt-2"></div>
                                </div>
                            )}
                        </ScrollArea>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminLogs;
