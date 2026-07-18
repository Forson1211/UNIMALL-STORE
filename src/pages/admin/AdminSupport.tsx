import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";
import type { SupportTicket } from "@/types/admin";

const STATUS_OPTIONS: SupportTicket["status"][] = ["open", "in_progress", "resolved", "closed"];

const AdminSupport = () => {
    const queryClient = useQueryClient();
    const { data: tickets, isLoading } = useQuery({
        queryKey: ['admin-support'],
        queryFn: adminService.getSupportTickets,
        refetchInterval: 15000,
    });
    const [statusFilter, setStatusFilter] = useState("all");
    const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
    const [isCreateOpen, setIsCreateOpen] = useState(false);
    const [newTicket, setNewTicket] = useState({ subject: "", description: "", priority: "medium" as SupportTicket["priority"] });

    const openCount = tickets?.filter(t => t.status === 'open').length || 0;
    const inProgressCount = tickets?.filter(t => t.status === 'in_progress').length || 0;
    const resolvedCount = tickets?.filter(t => t.status === 'resolved').length || 0;

    const filteredTickets = (tickets || []).filter((t) => statusFilter === "all" || t.status === statusFilter);

    const statusMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: SupportTicket["status"] }) =>
            adminService.updateTicketStatus(id, status),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-support'] });
            toast.success(`Ticket marked ${variables.status.replace('_', ' ')}`);
            setSelectedTicket((prev) => prev ? { ...prev, status: variables.status } : prev);
        },
        onError: (error: any) => toast.error(error.message || "Failed to update ticket"),
    });

    const createMutation = useMutation({
        mutationFn: () => adminService.createTicket(newTicket.subject, newTicket.description, newTicket.priority),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['admin-support'] });
            toast.success("Ticket created");
            setIsCreateOpen(false);
            setNewTicket({ subject: "", description: "", priority: "medium" });
        },
        onError: (error: any) => toast.error(error.message || "Failed to create ticket"),
    });

    return (
        <DashboardLayout type="admin" title="Support Tickets">
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Support Desk</h1>
                        <p className="text-muted-foreground mt-1">Manage and resolve user inquiries.</p>
                    </div>
                    <Button onClick={() => setIsCreateOpen(true)}>Create Ticket</Button>
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
                            <Select value={statusFilter} onValueChange={setStatusFilter}>
                                <SelectTrigger className="w-[180px]">
                                    <SelectValue placeholder="Filter by status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Tickets</SelectItem>
                                    <SelectItem value="open">Open</SelectItem>
                                    <SelectItem value="in_progress">In Progress</SelectItem>
                                    <SelectItem value="resolved">Resolved</SelectItem>
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
                                ) : filteredTickets.length === 0 ? (
                                    <TableRow>
                                        <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                                            No tickets match this filter.
                                        </TableCell>
                                    </TableRow>
                                ) : filteredTickets.map((ticket) => (
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
                                            <Button variant="ghost" size="sm" onClick={() => setSelectedTicket(ticket)}>View</Button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>

            {/* View / Update Ticket Dialog */}
            <Dialog open={!!selectedTicket} onOpenChange={(open) => !open && setSelectedTicket(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{selectedTicket?.subject}</DialogTitle>
                    </DialogHeader>
                    {selectedTicket && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{selectedTicket.user?.full_name || "User"}</span>
                                <span>·</span>
                                <span>{new Date(selectedTicket.created_at).toLocaleString()}</span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{selectedTicket.description}</p>
                            <div className="space-y-2">
                                <Label>Status</Label>
                                <div className="flex flex-wrap gap-2">
                                    {STATUS_OPTIONS.map((status) => (
                                        <Button
                                            key={status}
                                            size="sm"
                                            variant={selectedTicket.status === status ? "default" : "outline"}
                                            disabled={statusMutation.isPending}
                                            onClick={() => statusMutation.mutate({ id: selectedTicket.id, status })}
                                        >
                                            {status.replace('_', ' ')}
                                        </Button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    )}
                </DialogContent>
            </Dialog>

            {/* Create Ticket Dialog */}
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Create Support Ticket</DialogTitle>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        <div className="space-y-2">
                            <Label htmlFor="subject">Subject</Label>
                            <Input
                                id="subject"
                                value={newTicket.subject}
                                onChange={(e) => setNewTicket({ ...newTicket, subject: e.target.value })}
                                placeholder="Brief summary of the issue"
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="description">Description</Label>
                            <Textarea
                                id="description"
                                value={newTicket.description}
                                onChange={(e) => setNewTicket({ ...newTicket, description: e.target.value })}
                                rows={4}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label>Priority</Label>
                            <Select value={newTicket.priority} onValueChange={(val: SupportTicket["priority"]) => setNewTicket({ ...newTicket, priority: val })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="low">Low</SelectItem>
                                    <SelectItem value="medium">Medium</SelectItem>
                                    <SelectItem value="high">High</SelectItem>
                                    <SelectItem value="critical">Critical</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
                        <Button
                            disabled={!newTicket.subject || !newTicket.description || createMutation.isPending}
                            onClick={() => createMutation.mutate()}
                        >
                            {createMutation.isPending ? "Creating..." : "Create Ticket"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AdminSupport;
