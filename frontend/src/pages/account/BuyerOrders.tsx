import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Package, ArrowLeft, Check, Search } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { api } from "@/integrations/api/client";
import { matchesOrder, ORDER_STEPS, orderProgress, orderStatusMessage } from "@/lib/orderTracking";
import { toast } from "sonner";
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

interface BuyerOrder {
  id: string; created_at: string; updated_at: string; status: string; total_amount: number;
  shipping_address: string | null; payment_status: string; payment_method: string;
  shipping_details: { fullName?: string; phone?: string; email?: string };
  trackingNumber: string;
  coupon_code?: string; discount_amount?: number;
  order_items: { quantity: number; price_at_purchase: number; total_price?: number; discount_amount?: number; fulfillment_status?: string; products: { id: string; name: string; image_url: string } | null }[];
}
const date = (value: string) => new Date(value).toLocaleString("en-GH", { timeZone: "Africa/Accra", dateStyle: "medium", timeStyle: "short" });
export default function BuyerOrders() {
  const { user } = useAuth();
  const [params, setParams] = useSearchParams();
  const tab = params.get("tab") === "tracking" ? "tracking" : "all";
  const [trackingId, setTrackingId] = useState(params.get("order") || "");
  const [selectedId, setSelectedId] = useState(params.get("order") || "");
  const [trackingError, setTrackingError] = useState("");
  const client = useQueryClient();
  const { data: orders = [], isLoading, error, refetch } = useQuery({
    queryKey: ["buyer-orders", user?.id], enabled: !!user,
    refetchOnMount: true, refetchOnWindowFocus: true,
    queryFn: async (): Promise<BuyerOrder[]> => {
      const { data, error } = await api.from("orders")
        .select("*, order_items(quantity, price_at_purchase, total_price, discount_amount, fulfillment_status, products(id, name, image_url))")
        .eq("buyer_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []).map(order => ({
        ...order, total_amount: Number(order.total_amount),
        trackingNumber: "UM-" + order.id.slice(0, 8).toUpperCase() + "-GH",
      })) as unknown as BuyerOrder[];
    },
  });
  useEffect(() => {
    if (!user) return;
    const channel = api.channel("buyer-orders-" + user.id)
      .on("postgres_changes", { event: "*", schema: "public", table: "orders", filter: "buyer_id=eq." + user.id },
        () => { void client.invalidateQueries({ queryKey: ["buyer-orders", user.id] }); }).subscribe();
    return () => { void api.removeChannel(channel); };
  }, [user?.id, client]);
  const selected = orders.find(order => order.id === selectedId);
  const cancel = useMutation({
    mutationFn: async (id: string) => { const { error } = await api.rpc("cancel_buyer_order", { _order_id: id }); if (error) throw error; },
    onSuccess: () => { void client.invalidateQueries({ queryKey: ["buyer-orders", user?.id] }); toast.success("Order cancelled. Reserved stock has been restored."); },
    onError: (error: Error) => { toast.error(error.message); void refetch(); },
  });
  const changeTab = (value: string) => {
    const next = new URLSearchParams(params); next.set("tab", value); setParams(next);
  };
  const track = (order: BuyerOrder) => {
    setSelectedId(order.id); setTrackingId(order.trackingNumber); setTrackingError("");
    const next = new URLSearchParams(params); next.set("tab", "tracking"); next.set("order", order.id); setParams(next);
  };
  const search = (event: React.FormEvent) => {
    event.preventDefault();
    const found = orders.find(order => matchesOrder(order, trackingId));
    if (found) track(found);
    else { setSelectedId(""); setTrackingError("No matching order in your account. Check the order ID or tracking number."); }
  };
  return <div className="min-h-screen bg-background"><Navbar />
    <main className="container max-w-5xl mx-auto px-4 pt-28 pb-24">
      <Button variant="ghost" asChild className="mb-6"><Link to="/account"><ArrowLeft className="w-4 h-4 mr-2" />Back to account</Link></Button>
      <div className="flex items-center gap-4 mb-8"><Package className="text-primary w-10 h-10" /><div><h1 className="text-3xl font-bold">Order Center</h1><p className="text-muted-foreground">Manage and track your campus purchases</p></div></div>
      {isLoading ? <p role="status">Loading orders...</p> : error ? <Card><CardContent className="p-8"><p role="alert" className="mb-4">Unable to load your orders. Please try again.</p><Button onClick={() => refetch()}>Retry</Button></CardContent></Card> :
      <Tabs value={tab} onValueChange={changeTab}>
        <TabsList className="mb-6"><TabsTrigger value="all">My Orders</TabsTrigger><TabsTrigger value="tracking">Track Order</TabsTrigger></TabsList>
        <TabsContent value="all" className="space-y-6">
          {!orders.length ? <Card><CardContent className="text-center p-12"><h2 className="font-semibold text-xl mb-2">No orders yet</h2><p className="text-muted-foreground mb-6">Find something you love in the campus marketplace.</p><Button asChild><Link to="/products">Start shopping</Link></Button></CardContent></Card>
          : orders.map(order => <Card key={order.id}>
            <CardHeader className="flex sm:flex-row justify-between gap-4 bg-muted/30">
              <div><CardTitle className="text-lg">Order {order.id.slice(0, 8).toUpperCase()}</CardTitle><p className="text-sm text-muted-foreground mt-1">{date(order.created_at)}</p><p className="text-xs text-muted-foreground mt-1">{order.trackingNumber}</p></div>
              <div className="space-y-2"><Badge variant={["delivered", "completed"].includes(order.status) ? "default" : "secondary"}>{order.status}</Badge><p className="font-bold">GH₵{order.total_amount.toFixed(2)}</p></div>
            </CardHeader>
            <CardContent className="p-6"><div className="space-y-3 mb-5">{order.order_items.map((item, index) => <div key={index} className="flex items-center gap-4"><img src={item.products?.image_url || "/placeholder.svg"} alt={item.products?.name || "Purchased product"} className="w-14 h-14 rounded-lg object-cover" /><div className="flex-1">{item.products ? <Link className="font-semibold hover:text-primary" to={"/products/" + item.products.id}>{item.products.name}</Link> : <p>Product no longer listed</p>}<p className="text-sm text-muted-foreground">Qty: {item.quantity} · GH₵{Number(item.price_at_purchase).toFixed(2)}</p></div></div>)}</div>
              {!!order.discount_amount && <p className="text-sm text-emerald-700 mb-3">Coupon {order.coupon_code}: GHS {order.discount_amount.toFixed(2)} saved at checkout.</p>}
              <div className="flex justify-between items-center gap-4 flex-wrap"><p className="text-sm text-muted-foreground">{orderStatusMessage(order.status)}</p><div className="flex flex-wrap gap-2"><Button variant="outline" onClick={() => track(order)}>Details & tracking</Button>
                {order.payment_status === "pending" && ["pending", "confirmed", "processing"].includes(order.status) && !order.order_items.some(item => ["shipped", "delivered"].includes(item.fulfillment_status || "")) && <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={cancel.isPending}>Cancel order</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Cancel this order?</AlertDialogTitle><AlertDialogDescription>This cancels all items before dispatch and returns them to the sellers' stock.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Keep order</AlertDialogCancel><AlertDialogAction onClick={() => cancel.mutate(order.id)}>Cancel order</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>}
              </div></div>
            </CardContent>
          </Card>)}
        </TabsContent>
        <TabsContent value="tracking" className="space-y-6">
          <Card><CardHeader><CardTitle>Find your order</CardTitle></CardHeader><CardContent><form onSubmit={search} className="flex gap-3 flex-wrap"><Input aria-label="Order ID or tracking number" placeholder="Order ID or tracking number" value={trackingId} onChange={event => setTrackingId(event.target.value)} className="flex-1 min-w-48" required /><Button type="submit"><Search className="w-4 h-4 mr-2" />Track order</Button></form>{trackingError && <p role="alert" className="text-destructive text-sm mt-3">{trackingError}</p>}</CardContent></Card>
          {selected ? <Card>
            <CardHeader><CardTitle>Order {selected.id.slice(0, 8).toUpperCase()}</CardTitle><p className="text-muted-foreground">{orderStatusMessage(selected.status)}</p></CardHeader>
            <CardContent className="space-y-8">
              {!["cancelled", "canceled"].includes(selected.status) && <ol className="grid grid-cols-2 sm:grid-cols-4 gap-4">{ORDER_STEPS.map((label, index) => <li key={label} className="flex items-center gap-2"><span className={"w-8 h-8 shrink-0 rounded-full flex items-center justify-center " + (index <= orderProgress(selected.status) ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}>{index <= orderProgress(selected.status) ? <Check className="w-4 h-4" /> : index + 1}</span><span className="text-sm font-medium">{label}</span></li>)}</ol>}
              <div className="grid sm:grid-cols-2 gap-6"><div><h3 className="font-semibold mb-2">Delivery details</h3><p>{selected.shipping_details?.fullName || ""}</p><p className="text-muted-foreground">{selected.shipping_address || "Contact the vendor to arrange delivery."}</p><p>{selected.shipping_details?.phone || ""}</p></div><div><h3 className="font-semibold mb-2">Payment</h3><p>{selected.payment_method === "cod" ? "Cash on delivery" : selected.payment_method}</p><p className="capitalize">{selected.payment_status || "pending"}</p><p className="font-bold mt-2">GH₵{selected.total_amount.toFixed(2)}</p></div></div>
              <p className="text-sm text-muted-foreground">Last updated: {date(selected.updated_at || selected.created_at)}</p><Button asChild variant="outline"><Link to="/contact">Contact support</Link></Button>
            </CardContent>
          </Card> : !trackingError && <p className="text-muted-foreground">Select an order from My Orders or enter its tracking number.</p>}
        </TabsContent>
      </Tabs>}
    </main><Footer /></div>;
}
