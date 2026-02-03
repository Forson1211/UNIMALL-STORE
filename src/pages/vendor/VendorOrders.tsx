import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockOrders } from "@/data/mockDashboardData";
import { Order } from "@/types/dashboard";
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

const statusStyles: Record<Order['status'], string> = {
  pending: "bg-gold/10 text-gold border-gold/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-emerald/10 text-emerald-dark border-emerald/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const VendorOrders = () => {
  const [orders, setOrders] = useState(mockOrders.filter(o => o.vendorId === '1'));
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const updateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(orders.map(o => 
      o.id === orderId ? { ...o, status: newStatus } : o
    ));
    toast.success(`Order ${orderId} marked as ${newStatus}`);
  };

  const orderColumns = [
    {
      key: "id",
      header: "Order ID",
      render: (order: Order) => (
        <span className="font-mono font-medium">{order.id}</span>
      ),
    },
    {
      key: "customerName",
      header: "Customer",
      render: (order: Order) => (
        <div>
          <p className="font-medium">{order.customerName}</p>
          <p className="text-sm text-muted-foreground">{order.customerEmail}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Items",
      render: (order: Order) => (
        <div>
          <p>{order.items.length} item(s)</p>
          <p className="text-sm text-muted-foreground truncate max-w-[150px]">
            {order.items.map(i => i.productName).join(', ')}
          </p>
        </div>
      ),
    },
    {
      key: "total",
      header: "Total",
      sortable: true,
      render: (order: Order) => (
        <span className="font-semibold">${order.total.toFixed(2)}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (order: Order) => (
        <Badge variant="outline" className={statusStyles[order.status]}>
          {order.status}
        </Badge>
      ),
    },
    {
      key: "createdAt",
      header: "Date",
      sortable: true,
      render: (order: Order) => format(order.createdAt, 'MMM d, yyyy'),
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
            <DropdownMenuItem onClick={() => setSelectedOrder(order)}>
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            {order.status === 'pending' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'confirmed')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Confirm Order
              </DropdownMenuItem>
            )}
            {order.status === 'confirmed' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'shipped')}>
                <Truck className="w-4 h-4 mr-2" />
                Mark as Shipped
              </DropdownMenuItem>
            )}
            {order.status === 'shipped' && (
              <DropdownMenuItem onClick={() => updateOrderStatus(order.id, 'delivered')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Mark as Delivered
              </DropdownMenuItem>
            )}
            {order.status !== 'cancelled' && order.status !== 'delivered' && (
              <DropdownMenuItem 
                className="text-destructive"
                onClick={() => updateOrderStatus(order.id, 'cancelled')}
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

  return (
    <DashboardLayout type="vendor" title="Orders" userName="TechHub" userRole="Vendor">
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
            <DialogTitle>Order {selectedOrder?.id}</DialogTitle>
          </DialogHeader>
          {selectedOrder && (
            <div className="space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className={statusStyles[selectedOrder.status]}>
                  {selectedOrder.status}
                </Badge>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Date</span>
                <span>{format(selectedOrder.createdAt, 'MMM d, yyyy h:mm a')}</span>
              </div>
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Customer</p>
                <p>{selectedOrder.customerName}</p>
                <p className="text-sm text-muted-foreground">{selectedOrder.customerEmail}</p>
              </div>
              <div className="border-t pt-4">
                <p className="font-medium mb-2">Items</p>
                {selectedOrder.items.map((item, i) => (
                  <div key={i} className="flex justify-between py-2">
                    <div>
                      <p>{item.productName}</p>
                      <p className="text-sm text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span>${(item.price * item.quantity).toFixed(2)}</span>
                  </div>
                ))}
              </div>
              <div className="border-t pt-4 flex justify-between font-semibold">
                <span>Total</span>
                <span>${selectedOrder.total.toFixed(2)}</span>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorOrders;
