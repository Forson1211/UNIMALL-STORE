import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Check, X, Banknote } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { toast } from "sonner";

const AdminPayouts = () => {
    const queryClient = useQueryClient();

    const { data: payouts, isLoading } = useQuery({
        queryKey: ['admin-payout-requests'],
        queryFn: adminService.getPayoutRequests,
        refetchInterval: 15000,
    });

    const processMutation = useMutation({
        mutationFn: ({ id, status }: { id: string; status: 'approved' | 'paid' | 'rejected' }) =>
            adminService.processPayoutRequest(id, status),
        onSuccess: (_data, variables) => {
            queryClient.invalidateQueries({ queryKey: ['admin-payout-requests'] });
            queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
            toast.success(`Payout ${variables.status}`);
        },
        onError: (error: any) => {
            toast.error(error.message || "Failed to update payout request");
        }
    });

    const getStatusColor = (status: string) => {
        switch (status) {
            case "paid": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "approved": return "bg-blue-100 text-blue-800 hover:bg-blue-100";
            case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            case "rejected": return "bg-red-100 text-red-800 hover:bg-red-100";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    return (
        <DashboardLayout type="admin" title="Payouts">
            <div className="space-y-6 animate-fade-in">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Vendor Payouts</h1>
                    <p className="text-muted-foreground mt-1">Review and process vendor payout requests.</p>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Payout Requests</CardTitle>
                        <CardDescription>Approve or reject pending withdrawal requests from vendors.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Vendor</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                                        <TableHead className="hidden md:table-cell">Requested</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : payouts?.length === 0 ? (
                                        <TableRow>
                                            <TableCell colSpan={6} className="text-center py-12 text-muted-foreground">
                                                <div className="flex flex-col items-center gap-2">
                                                    <Banknote className="w-8 h-8 opacity-30" />
                                                    No payout requests yet.
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ) : payouts?.map((payout: any) => (
                                        <TableRow key={payout.id}>
                                            <TableCell className="font-medium">
                                                {payout.vendor?.store_name || payout.vendor?.full_name || "Unknown Vendor"}
                                            </TableCell>
                                            <TableCell>GH₵{Number(payout.amount).toFixed(2)}</TableCell>
                                            <TableCell className="hidden md:table-cell capitalize">{payout.payment_method || "—"}</TableCell>
                                            <TableCell className="hidden md:table-cell">{new Date(payout.requested_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(payout.status)} variant="outline">
                                                    {payout.status.charAt(0).toUpperCase() + payout.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                {payout.status === "pending" && (
                                                    <div className="flex justify-end gap-2">
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            className="gap-1"
                                                            disabled={processMutation.isPending}
                                                            onClick={() => processMutation.mutate({ id: payout.id, status: "paid" })}
                                                        >
                                                            <Check className="w-3.5 h-3.5" /> Mark Paid
                                                        </Button>
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            className="gap-1 text-destructive hover:text-destructive"
                                                            disabled={processMutation.isPending}
                                                            onClick={() => processMutation.mutate({ id: payout.id, status: "rejected" })}
                                                        >
                                                            <X className="w-3.5 h-3.5" /> Reject
                                                        </Button>
                                                    </div>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>
        </DashboardLayout>
    );
};

export default AdminPayouts;
