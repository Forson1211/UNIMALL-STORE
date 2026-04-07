import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";

const AdminSupport = () => {
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin-support'],
        queryFn: adminService.getSupportTickets,
        refetchInterval: 15000,
    });

    const openCount = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressCount = tickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolvedCount = tickets?.filter(t => t.status === 'resolved').length || 0;

    return (
        <DashboardLayout type="admin" title="Support Tickets">
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Support Desk</h1>
                        <p className="text-muted-foreground mt-1">Manage and resolve user inquiries.</p>
                    </div>
                    <Button>Create Ticket</Button>
                </div>

                <div className="grid gap-4 md:grid-cols-4">
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Open Tickets</CardDescription>
                            <CardTitle className="text-2xl">{isLoading ? "..." : openCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>In Progress</CardDescription>
                            <CardTitle className="text-2xl text-yellow-600">{isLoading ? "..." : inProgressCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Resolved</CardDescription>
                            <CardTitle className="text-2xl text-green-600">{isLoading ? "..." : resolvedCount}</CardTitle>
                        </CardHeader>
                    </Card>
                    <Card>
                        <CardHeader className="pb-2">
                            <CardDescription>Avg Response Time</CardDescription>
                            <CardTitle className="text-2xl">2h</CardTitle>
                        </CardHeader>
                    </Card>
                </div>

                <Card>
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <CardTitle>Recent Tickets</CardTitle>
                            <Select defaultValue="all">
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tickets</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Ticket ID</TableHead>
                                    <TableHead>Subject</TableHead>
                                    <TableHead>User</TableHead>
                                    <TableHead>Priority</TableHead>
                                    <TableHead>Status</TableHead>
                                    <TableHead>Date</TableHead>
                                    <TableHead className="text-right">Action</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <TableRow key={i}>
                                            <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-48" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                                            <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                        </TableRow>
                                    ))
                                ) : tickets?.map((ticket) => (
                                    <TableRow key={ticket.id}>
                                        <TableCell className="font-medium text-xs font-mono">{ticket.id.substring(0, 8)}</TableCell>
                                        <TableCell>{ticket.subject}</TableCell>
                                        <TableCell>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{ticket.user?.full_name || 'User'}</span>
                                                <span className="text-xs text-muted-foreground">{ticket.user?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="outline" className={
                                                ticket.priority === 'critical' ? 'bg-red-100 text-red-800 border-red-200' :
                                                    ticket.priority === 'high' ? 'bg-orange-100 text-orange-800 border-orange-200' :
                                                        ticket.priority === 'medium' ? 'bg-blue-100 text-blue-800 border-blue-200' :
                                                            'bg-gray-100 text-gray-800 border-gray-200'
                                            }>
                                                {ticket.priority.toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="secondary">
                                                {ticket.status.replace('_', ' ').toUpperCase()}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-muted-foreground text-sm">{new Date(ticket.created_at).toLocaleDateString()}</TableCell>
                                        <TableCell className="text-right">
                                            <Button variant="ghost" size="sm">View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminSupport;
