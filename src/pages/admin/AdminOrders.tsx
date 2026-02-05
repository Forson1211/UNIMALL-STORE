import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, Eye, RefreshCw, CheckCircle, XCircle } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface Order {
  order_id: string;
  buyer_id: string;
  buyer_name: string;
  buyer_email: string;
  total_amount: number;
  order_status: string;
  shipping_address: string;
  created_at: string;
  item_count: number;
  items: Array<{
    product_id: string;
    product_name: string;
    vendor_id: string;
    vendor_name: string;
    quantity: number;
    price: number;
  }>;
}

const statusStyles: Record<string, string> = {
  pending: "bg-gold/10 text-gold border-gold/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminOrders = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [detailsDialogOpen, setDetailsDialogOpen] = useState(false);

  // Fetch all orders
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("admin_orders_view" as any)
        .select("*")
        .order("created_at", { ascending: false }) as any);

      if (error) throw error;
      return data as Order[];
    },
  });

  // Update order status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await supabase
        .from("orders")
        .update({ status: newStatus })
        .eq("id", orderId);

      if (error) throw error;

      // Log the action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "order_management",
          message: "Admin updated order status",
          metadata: {
            order_id: orderId,
            new_status: newStatus,
          },
        }));
      } catch (logError) {
        console.log("Logging skipped:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
      toast({
        title: "Success",
        description: "Order status updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update order status.",
        variant: "destructive",
      });
    },
  });

  const handleViewDetails = (order: Order) => {
    setSelectedOrder(order);
    setDetailsDialogOpen(true);
  };

  const handleUpdateStatus = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus });
  };

  const orderColumns = [
    {
      key: "order_id",
      header: "Order ID",
      render: (order: Order) => (
        <span className="font-mono font-medium">{order.order_id.slice(0, 8)}...</span>
      ),
    },
    {
      key: "buyer_name",
      header: "Customer",
      render: (order: Order) => (
        <div>
          <p className="font-medium">{order.buyer_name || "Unknown"}</p>
          <p className="text-sm text-muted-foreground">{order.buyer_email}</p>
        </div>
      ),
    },
    {
      key: "item_count",
      header: "Items",
      render: (order: Order) => `${order.item_count || 0} item(s)`,
    },
    {
      key: "total_amount",
      header: "Total",
      sortable: true,
      render: (order: Order) => (
        <span className="font-semibold">${order.total_amount.toFixed(2)}</span>
      ),
    },
    {
      key: "order_status",
      header: "Status",
      render: (order: Order) => (
        <Badge variant="outline" className={statusStyles[order.order_status] || ""}>
          {order.order_status}
        </Badge>
      ),
    },
    {
      key: "created_at",
      header: "Date",
      sortable: true,
      render: (order: Order) => format(new Date(order.created_at), "MMM d, yyyy"),
    },
    {
      key: "actions",
      header: "",
      render: (order: Order) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewDetails(order)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Update Status
            </DropdownMenuLabel>
            {order.order_status === "pending" && (
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(order.order_id, "confirmed")}
                className="text-primary"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Order
              </DropdownMenuItem>
            )}
            {order.order_status === "confirmed" && (
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(order.order_id, "shipped")}
                className="text-blue-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Shipped
              </DropdownMenuItem>
            )}
            {order.order_status === "shipped" && (
              <DropdownMenuItem
                onClick={() => handleUpdateStatus(order.order_id, "delivered")}
                className="text-emerald-500"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Delivered
              </DropdownMenuItem>
            )}
            {order.order_status !== "cancelled" && order.order_status !== "delivered" && (
              <>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={() => handleUpdateStatus(order.order_id, "cancelled")}
                  className="text-destructive"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Cancel Order
                </DropdownMenuItem>
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout type="admin" title="Orders">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading orders...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout type="admin" title="Orders">
        <DataTable
          title="All Orders"
          data={orders}
          columns={orderColumns}
          searchKey="order_id"
          searchPlaceholder="Search orders..."
          actions={
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-orders"] })}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          }
        />
      </DashboardLayout>

      {/* Order Details Dialog */}
      <Dialog open={detailsDialogOpen} onOpenChange={setDetailsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Order Details</DialogTitle>
            <DialogDescription>
              Order ID: {selectedOrder?.order_id}
            </DialogDescription>
          </DialogHeader>

          {selectedOrder && (
            <div className="space-y-6">
              {/* Customer Info */}
              <div>
                <h3 className="font-semibold mb-2">Customer Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {selectedOrder.buyer_name || "Unknown"}</p>
                  <p><strong>Email:</strong> {selectedOrder.buyer_email}</p>
                  <p><strong>Shipping Address:</strong> {selectedOrder.shipping_address || "Not provided"}</p>
                </div>
              </div>

              {/* Order Info */}
              <div>
                <h3 className="font-semibold mb-2">Order Information</h3>
                <div className="space-y-1 text-sm">
                  <p><strong>Status:</strong> <Badge variant="outline" className={statusStyles[selectedOrder.order_status]}>{selectedOrder.order_status}</Badge></p>
                  <p><strong>Total Amount:</strong> GH₵{selectedOrder.total_amount.toFixed(2)}</p>
                  <p><strong>Order Date:</strong> {format(new Date(selectedOrder.created_at), "PPP")}</p>
                </div>
              </div>

              {/* Order Items */}
              <div>
                <h3 className="font-semibold mb-2">Order Items</h3>
                <div className="border rounded-lg divide-y">
                  {selectedOrder.items && selectedOrder.items.length > 0 ? (
                    selectedOrder.items.map((item, index) => (
                      <div key={index} className="p-3 flex justify-between items-center">
                        <div>
                          <p className="font-medium">{item.product_name}</p>
                          <p className="text-sm text-muted-foreground">
                            Vendor: {item.vendor_name || "Unknown"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            Quantity: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold">GH₵{(item.price * item.quantity).toFixed(2)}</p>
                          <p className="text-sm text-muted-foreground">GH₵{item.price.toFixed(2)} each</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="p-4 text-center text-muted-foreground">
                      No items found
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default AdminOrders;
