import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { supabase } from "@/integrations/supabase/client";
import { Eye, MoreHorizontal, Truck, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const statusStyles: Record<string, string> = {
  pending: "bg-gold/10 text-gold border-gold/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-emerald/10 text-emerald-dark border-emerald/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const VendorOrders = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["vendor-orders", user?.id],
    queryFn: () => vendorService.getOrders(user!.id),
    enabled: !!user,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase.from("orders").update({ status: newStatus }).eq("id", orderId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendor-orders"] });
      toast.success("Order status updated successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus });
  };

  const orderColumns = [
    {
      key: "id",
      header: "Order ID",
      render: (order: any) => (
        <span className="font-mono font-medium">{order.order_id.slice(0, 8)}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (order: any) => (
        <div>
          <p className="font-medium">{order.buyer_name || order.buyer_email}</p>
          <p className="text-sm text-muted-foreground">{order.buyer_email}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (order: any) => (
        <div>
          <p>{order.item_count} item(s)</p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (order: any) => (
        <span className="font-semibold">GH₵{order.vendor_total.toFixed(2)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order: any) => (
        <Badge variant="outline" className={statusStyles[order.order_status]}>
          {order.order_status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (order: any) => format(new Date(order.created_at), 'MMM d, yyyy'),
    },
    {
      key: "actions",
      header: "",
      render: (order: any) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {order.order_status === 'pending' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'confirmed')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Order
              </DropdownMenuItem>
            )}
            {order.order_status === 'confirmed' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'shipped')}>
                <Truck className="w-4 h-4 mr-2" />
                Mark as Shipped
              </DropdownMenuItem>
            )}
            {order.order_status === 'shipped' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(order.order_id, 'delivered')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Delivered
              </DropdownMenuItem>
            )}
            {order.order_status !== 'cancelled' && order.order_status !== 'delivered' && (
              <DropdownMenuItem
                className="text-destructive"
                onClick={() => updateOrderStatus(order.order_id, 'cancelled')}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Cancel Order
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout type="vendor" title="Orders">
        <div className="flex items-center justify-center h-96">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout
      type="vendor"
      title="Orders"
      userName={profile?.store_name || profile?.full_name || "Vendor"}
      userRole="Vendor"
    >
      <DataTable
        title="My Orders"
        data={orders}
        columns={orderColumns}
        searchKey="id"
        searchPlaceholder="Search orders..."
      />

      {/* Order Details Dialog */}
      <Dialog open={!!selectedOrder} onOpenChange={() => setSelectedOrder(null)}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Order {selectedOrder?.order_id.slice(0, 8)}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusStyles[selectedOrder.order_status]}>
                  {selectedOrder.order_status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{format(new Date(selectedOrder.created_at), 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Customer</p>
                <p>{selectedOrder.buyer_name || selectedOrder.buyer_email}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.buyer_email}</p>
              </div>
              <div className="border-t pt-4 flex justify-between font-semibold">
                <span>Vendor Total</span>
                <span>GH₵{selectedOrder.vendor_total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorOrders;
