import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Download, Search, Filter } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import { adminService } from "@/services/adminService";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { toast } from "sonner";

const AdminTransactions = () => {
    const { data: transactions, isLoading } = useQuery({
        queryKey: ['admin-transactions'],
        queryFn: adminService.getTransactions,
        refetchInterval: 15000,
    });
    const [search, setSearch] = useState("");
    const [selectedTrx, setSelectedTrx] = useState<any | null>(null);

    const getStatusColor = (status: string) => {
        switch (status) {
            case "completed": return "bg-green-100 text-green-800 hover:bg-green-100";
            case "pending": return "bg-yellow-100 text-yellow-800 hover:bg-yellow-100";
            case "failed": return "bg-red-100 text-red-800 hover:bg-red-100";
            case "refunded": return "bg-gray-100 text-gray-800 hover:bg-gray-100";
            default: return "bg-gray-100 text-gray-800";
        }
    };

    const filteredTransactions = (transactions || []).filter((trx) => {
        if (!search.trim()) return true;
        const term = search.toLowerCase();
        return (
            trx.id.toLowerCase().includes(term) ||
            (trx.user?.full_name || "").toLowerCase().includes(term)
        );
    });

    const handleExportCsv = () => {
        if (!transactions || transactions.length === 0) {
            toast.error("No transactions to export");
            return;
        }
        const headers = ["Transaction ID", "User", "Amount", "Currency", "Payment Method", "Status", "Date"];
        const rows = transactions.map((trx) => [
            trx.id,
            trx.user?.full_name || "Unknown",
            trx.amount,
            trx.currency,
            trx.payment_method,
            trx.status,
            new Date(trx.created_at).toISOString(),
        ]);
        const csv = [headers, ...rows]
            .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
            .join("\n");
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        toast.success("Transactions exported");
    };

    return (
        <DashboardLayout type="admin" title="Transactions">
            <div className="space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Financial Records</h1>
                        <p className="text-muted-foreground mt-1">View and manage all platform transactions.</p>
                    </div>
                    <Button variant="outline" className="gap-2" onClick={handleExportCsv}>
                        <Download className="w-4 h-4" /> Export CSV
                    </Button>
                </div>

                <div className="flex items-center gap-4 bg-card p-4 rounded-lg border shadow-sm">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search by transaction ID or user..."
                            className="pl-8 bg-background"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                    </div>
                    <Button variant="outline" size="icon">
                        <Filter className="w-4 h-4" />
                    </Button>
                </div>

                <Card>
                    <CardHeader>
                        <CardTitle>Recent Transactions</CardTitle>
                        <CardDescription>A list of recent payments and their status.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="rounded-md border overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Transaction ID</TableHead>
                                        <TableHead>User</TableHead>
                                        <TableHead>Amount</TableHead>
                                        <TableHead className="hidden md:table-cell">Payment Method</TableHead>
                                        <TableHead className="hidden md:table-cell">Date</TableHead>
                                        <TableHead>Status</TableHead>
                                        <TableHead className="text-right">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {isLoading ? (
                                        Array.from({ length: 5 }).map((_, i) => (
                                            <TableRow key={i}>
                                                <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell className="hidden md:table-cell"><Skeleton className="h-4 w-24" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                                                <TableCell><Skeleton className="h-4 w-10" /></TableCell>
                                            </TableRow>
                                        ))
                                    ) : filteredTransactions.map((trx) => (
                                        <TableRow key={trx.id}>
                                            <TableCell className="font-medium">{trx.id}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium">{trx.user?.full_name || 'Unknown'}</span>
                                                    <span className="text-xs text-muted-foreground">{trx.user?.email}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>{trx.currency} {trx.amount.toFixed(2)}</TableCell>
                                            <TableCell className="hidden md:table-cell">{trx.payment_method}</TableCell>
                                            <TableCell className="hidden md:table-cell">{new Date(trx.created_at).toLocaleDateString()}</TableCell>
                                            <TableCell>
                                                <Badge className={getStatusColor(trx.status)} variant="outline">
                                                    {trx.status.charAt(0).toUpperCase() + trx.status.slice(1)}
                                                </Badge>
                                            </TableCell>
                                            <TableCell className="text-right">
                                                <Button variant="ghost" size="sm" onClick={() => setSelectedTrx(trx)}>Details</Button>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>
                        </div>
                    </CardContent>
                </Card>
            </div>

            <Dialog open={!!selectedTrx} onOpenChange={(open) => !open && setSelectedTrx(null)}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Transaction Details</DialogTitle>
                    </DialogHeader>
                    {selectedTrx && (
                        <div className="space-y-3 text-sm">
                            <div className="flex justify-between"><span className="text-muted-foreground">Transaction ID</span><span className="font-medium">{selectedTrx.id}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">User</span><span className="font-medium">{selectedTrx.user?.full_name || "Unknown"}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Amount</span><span className="font-medium">{selectedTrx.currency} {selectedTrx.amount.toFixed(2)}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Type</span><span className="font-medium capitalize">{selectedTrx.type}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Payment Method</span><span className="font-medium">{selectedTrx.payment_method || "—"}</span></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge className={getStatusColor(selectedTrx.status)} variant="outline">{selectedTrx.status}</Badge></div>
                            <div className="flex justify-between"><span className="text-muted-foreground">Date</span><span className="font-medium">{new Date(selectedTrx.created_at).toLocaleString()}</span></div>
                            {selectedTrx.reference_id && (
                                <div className="flex justify-between"><span className="text-muted-foreground">Reference</span><span className="font-medium">{selectedTrx.reference_id}</span></div>
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </DashboardLayout>
    );
};

export default AdminTransactions;
