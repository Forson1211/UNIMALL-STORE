import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { dealService } from "@/services/dealService";
import { Check, X, Clock, Zap, Package, Store } from "lucide-react";
import { toast } from "sonner";

const AdminDeals = () => {
  const queryClient = useQueryClient();

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["pending-deals"],
    queryFn: () => dealService.getPendingDeals(),
  });

  const approveMutation = useMutation({
    mutationFn: (id: string) => dealService.approveDeal(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pending-deals"] });
      queryClient.invalidateQueries({ queryKey: ["active-flash-deals"] });
      toast.success("Flash deal approved and live!");
    },
  });

  const dealColumns = [
    {
      key: "product",
      header: "Product",
      render: (deal: any) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded bg-muted flex items-center justify-center overflow-hidden border">
            <img src={deal.product.image_url} alt="" className="w-full h-full object-cover" />
          </div>
          <div>
            <p className="font-medium text-sm">{deal.product.name}</p>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="line-through">GH₵{deal.product.price}</span>
                <span className="text-primary font-bold">→ GH₵{deal.discount_price}</span>
            </div>
          </div>
        </div>
      ),
    },
    {
      key: "vendor",
      header: "Vendor",
      render: (deal: any) => (
        <div className="flex items-center gap-2 text-sm">
          <Store className="w-3.5 h-3.5 text-muted-foreground" />
          {deal.vendor?.store_name || "Unknown"}
        </div>
      ),
    },
    {
      key: "timing",
      header: "Event Window",
      render: (deal: any) => (
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-[10px]">
            <Badge variant="outline" className="h-4 text-[8px] uppercase">Start</Badge>
            <span className="font-medium">{new Date(deal.start_time).toLocaleString()}</span>
          </div>
          <div className="flex items-center gap-2 text-[10px]">
            <Badge variant="outline" className="h-4 text-[8px] uppercase">End</Badge>
            <span className="font-medium">{new Date(deal.end_time).toLocaleString()}</span>
          </div>
        </div>
      ),
    },
    {
      key: "actions",
      header: "Approval",
      render: (deal: any) => (
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            className="h-8 bg-green-600 hover:bg-green-700 text-white"
            onClick={() => approveMutation.mutate(deal.id)}
            disabled={approveMutation.isPending}
          >
            <Check className="w-3.5 h-3.5 mr-1" /> Approve
          </Button>
          <Button 
            size="sm" 
            variant="outline" 
            className="h-8 text-destructive border-destructive/20 hover:bg-destructive/5"
          >
            <X className="w-3.5 h-3.5 mr-1" /> Reject
          </Button>
        </div>
      ),
    },
  ];

  return (
    <DashboardLayout type="admin" title="Flash Deal Approvals">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
            <div>
                <h1 className="text-2xl font-bold tracking-tight">Flash Deal Management</h1>
                <p className="text-sm text-muted-foreground">Review and approve time-sensitive vendor promotions.</p>
            </div>
            <div className="flex gap-2">
                <Badge variant="secondary" className="bg-primary/10 text-primary border-primary/20">
                    {deals.length} Pending Requests
                </Badge>
            </div>
        </div>

        <DataTable
          title="Pending Approvals"
          data={deals}
          columns={dealColumns}
          searchKey="product.name"
          searchPlaceholder="Search products..."
        />

        {deals.length === 0 && !isLoading && (
            <div className="flex flex-col items-center justify-center p-20 bg-muted/20 border-2 border-dashed rounded-xl gap-4">
                <Zap className="w-12 h-12 text-muted-foreground/20" />
                <div className="text-center">
                    <p className="font-bold text-muted-foreground">No pending deals</p>
                    <p className="text-sm text-muted-foreground">When vendors submit flash deals, they will appear here for review.</p>
                </div>
            </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AdminDeals;
