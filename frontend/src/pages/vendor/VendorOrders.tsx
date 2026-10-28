import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { api } from "@/integrations/api/client";
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
  pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 font-bold",
  processing: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 font-bold",
  confirmed: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 font-bold",
  shipped: "bg-indigo-50 text-indigo-700 border-indigo-200 dark:bg-indigo-950/50 dark:text-indigo-300 font-bold",
  delivered: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 font-bold",
  cancelled: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 font-bold",
};

const VendorOrders = () => {
  const { user, profile } = useAuth();
  const queryClient = useQueryClient();
  const [selectedOrder, setSelectedOrder] = useState<any | null>(null);

  const { data: orders = [], isLoading, error: ordersError, refetch } = useQuery({
    queryKey: ["vendor-orders", user?.id],
    queryFn: () => vendorService.getOrders(user!.id),
    enabled: !!user,
    refetchInterval: 15000,
  });

  const { data: orderItems = [], isLoading: itemsLoading, error: itemsError } = useQuery({
    queryKey: ["vendor-order-items", user?.id, selectedOrder?.order_id],
    queryFn: () => vendorService.getOrderItems(user!.id, selectedOrder.order_id),
    enabled: !!user && !!selectedOrder,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ orderId, newStatus }: { orderId: string; newStatus: string }) => {
      const { error } = await (api as any).rpc("update_order_fulfillment", { _order_id: orderId, _new_status: newStatus });
      if (error) throw error;
    },
    onSuccess: () => {
      for (const key of ["vendor-orders", "vendor-order-items", "vendor-stats", "vendor-balance", "vendor-products", "buyer-orders", "products", "vendor-store-products"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      setSelectedOrder(null);
      toast.success("Order status updated successfully");
    },
    onError: (error: any) => toast.error(error.message),
  });

  const updateOrderStatus = (orderId: string, newStatus: string) => {
    updateStatusMutation.mutate({ orderId, newStatus });
  };

  const orderColumns = [
    {
      key: "order_id",
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
      key: "vendor_total",
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
      key: "created_at",
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
            <Button variant="ghost" size="icon" disabled={updateStatusMutation.isPending} aria-label="Order actions">
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
            {['confirmed', 'processing'].includes(order.order_status) && (
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
            {['pending', 'confirmed', 'processing'].includes(order.order_status) && order.payment_status === 'pending' && (
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

  if (ordersError) return (
    <DashboardLayout type="vendor" title="Orders">
      <div role="alert" className="p-6 space-y-3">
        <p>We could not load your orders. {ordersError.message}</p>
        <Button onClick={() => refetch()}>Try again</Button>
      </div>
    </DashboardLayout>
  );

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
        searchKey="order_id"
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
                <p>{selectedOrder.shipping_details?.phone}</p>
                <p className="mt-2 font-medium">Delivery address</p>
                <p>{selectedOrder.shipping_address}</p>
                <p>{selectedOrder.shipping_details?.digitalAddress}</p>
                <p className="mt-2">Payment: {selectedOrder.payment_method === 'cod' ? 'Cash on delivery' : selectedOrder.payment_method} · {selectedOrder.payment_status}</p>
              </div>
              <div className="border-t pt-4 space-y-2">
                <p className="font-medium">Products to fulfill</p>
                {itemsLoading && <p>Loading products…</p>}
                {itemsError && <p role="alert">Could not load order products. {itemsError.message}</p>}
                {orderItems.map((item: any) => (
                  <div key={item.id} className="flex justify-between gap-3 text-sm">
                    <span>{item.products?.name || 'Product unavailable'} × {item.quantity} ({item.fulfillment_status})</span>
                    <span>GH₵{Number(item.total_price ?? Number(item.price_at_purchase) * Number(item.quantity)).toFixed(2)}</span>
                  </div>
                ))}
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
