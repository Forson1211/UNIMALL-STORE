import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Order } from "@/types/dashboard";
import { Eye } from "lucide-react";
import { format } from "date-fns";

interface RecentOrdersProps {
  orders: Order[];
  title?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
}

const statusStyles: Record<Order['status'], string> = {
  pending: "bg-gold/10 text-gold border-gold/20",
  confirmed: "bg-primary/10 text-primary border-primary/20",
  shipped: "bg-blue-500/10 text-blue-500 border-blue-500/20",
  delivered: "bg-emerald/10 text-emerald-dark border-emerald/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export function RecentOrders({ orders, title = "Recent Orders", showViewAll = true, onViewAll }: RecentOrdersProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg font-semibold">{title}</CardTitle>
        {showViewAll && (
          <Button variant="ghost" size="sm" onClick={onViewAll}>
            View All
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {orders.slice(0, 5).map((order) => (
            <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-medium text-sm">{order.id}</span>
                  <Badge variant="outline" className={statusStyles[order.status]}>
                    {order.status}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{order.customerName}</p>
                <p className="text-xs text-muted-foreground">{format(order.createdAt, 'MMM d, yyyy')}</p>
              </div>
              <div className="text-right ml-4">
                <p className="font-semibold text-foreground">${order.total.toFixed(2)}</p>
                <p className="text-xs text-muted-foreground">{order.items.length} item(s)</p>
              </div>
              <Button variant="ghost" size="icon" className="ml-2">
                <Eye className="w-4 h-4" />
              </Button>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
