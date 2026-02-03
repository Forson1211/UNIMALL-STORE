import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { mockOrders } from "@/data/mockDashboardData";
import { Order } from "@/types/dashboard";
import { MoreHorizontal, Eye } from "lucide-react";
import { format } from "date-fns";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const statusStyles: Record<Order['status'], string> = {
  pending: "bg-gold/10 text-gold border-gold/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-emerald/10 text-emerald-dark border-emerald/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const paymentStyles: Record<Order['paymentStatus'], string> = {
  pending: "bg-gold/10 text-gold border-gold/20",
  paid: "bg-primary/10 text-primary border-primary/20",
  refunded: "bg-muted text-muted-foreground",
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
    render: (order: Order) => `${order.items.length} item(s)`,
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
    key: "paymentStatus",
    header: "Payment",
    render: (order: Order) => (
      <Badge variant="outline" className={paymentStyles[order.paymentStatus]}>
        {order.paymentStatus}
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
    render: () => (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon">
            <MoreHorizontal className="w-4 h-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem>
            <Eye className="w-4 h-4 mr-2" />
            View Details
          </DropdownMenuItem>
          <DropdownMenuItem>Update Status</DropdownMenuItem>
          <DropdownMenuItem className="text-destructive">Cancel Order</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    ),
  },
];

const AdminOrders = () => {
  return (
    <DashboardLayout type="admin" title="Orders">
      <DataTable
        title="All Orders"
        data={mockOrders}
        columns={orderColumns}
        searchKey="id"
        searchPlaceholder="Search orders..."
      />
    </DashboardLayout>
  );
};

export default AdminOrders;
