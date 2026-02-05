import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Package, ArrowLeft, Eye, Truck, Check, Clock, ShoppingBag, Search, MapPin, Calendar, Smartphone } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";

import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  image: string;
}

interface Order {
  id: string;
  date: string;
  status: string;
  total: number;
  trackingNumber: string;
  items: OrderItem[];
}

const getStatusBadge = (status: string) => {
  switch (status) {
    case "delivered":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20"><Check className="w-3 h-3 mr-1" />Delivered</Badge>;
    case "shipped":
      return <Badge className="bg-blue-500/10 text-blue-600 border-blue-500/20"><Truck className="w-3 h-3 mr-1" />Shipped</Badge>;
    case "processing":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const BuyerOrders = () => {
  const { user } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const activeTab = searchParams.get("tab") || "all";
  const [trackingId, setTrackingId] = useState("");

  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["buyer-orders", user?.id],
    queryFn: async () => {
      // We'll fetch from a view or join. For now, let's use a RPC or specialized view
      // But let's keep it simple with a direct query if possible, or use the admin view if allowed
      const { data, error } = await supabase
        .from("orders")
        .select(`
          id,
          created_at,
          status,
          total_amount,
          order_items (
            quantity,
            unit_price,
            products (
              name,
              image_url
            )
          )
        `)
        .eq("buyer_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return (data as any[]).map(order => ({
        id: order.id.slice(0, 8).toUpperCase(),
        date: order.created_at,
        status: order.status,
        total: order.total_amount,
        trackingNumber: `UM-${order.id.slice(0, 6).toUpperCase()}-GH`,
        items: order.order_items.map((item: any) => ({
          name: item.products.name,
          quantity: item.quantity,
          price: item.unit_price,
          image: item.products.image_url
        }))
      })) as Order[];
    },
    enabled: !!user,
  });

  const handleTabChange = (value: string) => {
    setSearchParams({ tab: value });
  };

  const trackingSteps = [
    { label: "Ordered", date: "Feb 01, 10:30 AM", status: "completed", icon: Check },
    { label: "Processing", date: "Feb 01, 02:45 PM", status: "completed", icon: Clock },
    { label: "Shipped", date: "Feb 02, 09:15 AM", status: "current", icon: Truck },
    { label: "Delivered", date: "Estimated Feb 04", status: "upcoming", icon: Package },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="pt-32 flex justify-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-lg text-center">
            <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
            <p className="text-muted-foreground mb-8">
              You need to be signed in to view your orders.
            </p>
            <Button asChild>
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4 max-w-5xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6 hover:bg-accent transition-colors">
            <Link to="/account">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account
            </Link>
          </Button>

          {/* Header */}
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center border border-primary/20 shadow-sm">
                <Package className="w-7 h-7 text-primary" />
              </div>
              <div>
                <h1 className="text-3xl font-bold tracking-tight">Order Center</h1>
                <p className="text-muted-foreground font-medium">Manage and track your campus purchases</p>
              </div>
            </div>

            <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full md:w-auto">
              <TabsList className="grid w-full grid-cols-2 lg:w-[400px] h-11 p-1 bg-muted/50">
                <TabsTrigger value="all" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  My Orders
                </TabsTrigger>
                <TabsTrigger value="tracking" className="rounded-md data-[state=active]:bg-background data-[state=active]:shadow-sm">
                  Track Order
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
            <TabsContent value="all" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              {orders.length === 0 ? (
                <Card className="border-dashed py-16">
                  <CardContent className="flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                      <ShoppingBag className="w-10 h-10 text-muted-foreground" />
                    </div>
                    <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
                    <p className="text-muted-foreground mb-6 max-w-sm">
                      Hungry for more? Explore the marketplace and find amazing deals on your campus.
                    </p>
                    <Button asChild size="lg" className="rounded-xl">
                      <Link to="/products">Start Shopping</Link>
                    </Button>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-6">
                  {orders.map((order) => (
                    <Card key={order.id} className="overflow-hidden border-border/60 hover:border-primary/50 transition-all duration-300 hover:shadow-md">
                      <CardContent className="p-0">
                        {/* Order Meta Header */}
                        <div className="bg-muted/30 p-4 sm:p-6 border-b border-border/50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div className="flex flex-wrap items-center gap-x-6 gap-y-2">
                            <div>
                              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Order ID</p>
                              <p className="font-bold text-primary">{order.id} <span className="text-xs text-muted-foreground ml-1 font-normal opacity-70">| {order.trackingNumber}</span></p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Date</p>
                              <p className="font-semibold text-sm">
                                {new Date(order.date).toLocaleDateString("en-US", {
                                  year: "numeric",
                                  month: "short",
                                  day: "numeric",
                                })}
                              </p>
                            </div>
                            <div>
                              <p className="text-xs uppercase tracking-wider font-bold text-muted-foreground mb-1">Total</p>
                              <p className="font-bold text-sm">GH₵{order.total.toFixed(2)}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3">
                            {getStatusBadge(order.status)}
                            <Button variant="outline" size="sm" className="bg-background hover:bg-muted font-bold rounded-lg px-4 h-9">
                              <Eye className="w-4 h-4 mr-2" />
                              Details
                            </Button>
                          </div>
                        </div>

                        {/* Order Items Summary */}
                        <div className="p-4 sm:p-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <p className="text-sm font-bold text-muted-foreground uppercase tracking-widest mb-2">Purchased Items</p>
                              {order.items.map((item, idx) => (
                                <div key={idx} className="flex items-center gap-4 bg-muted/10 border border-border/30 rounded-xl p-3 pr-4 hover:bg-muted/20 transition-colors group">
                                  <div className="relative overflow-hidden rounded-lg w-14 h-14 bg-muted group-hover:scale-105 transition-transform duration-300">
                                    <img
                                      src={item.image}
                                      alt={item.name}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-foreground line-clamp-1">{item.name}</p>
                                    <p className="text-xs text-muted-foreground flex items-center gap-1.5 pt-1">
                                      <span className="font-bold text-primary/80 bg-primary/5 px-1.5 py-0.5 rounded">Qty: {item.quantity}</span>
                                      <span>•</span>
                                      <span className="font-medium">GH₵{item.price.toFixed(2)}</span>
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>

                            {/* Fast Actions / Status Summary for the order */}
                            <div className="flex flex-col justify-center bg-accent/5 rounded-2xl p-6 border border-accent/10">
                              <div className="flex items-start gap-4 mb-4">
                                <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                                  <Truck className="w-5 h-5 text-blue-600" />
                                </div>
                                <div>
                                  <p className="font-bold text-sm">Last Update</p>
                                  <p className="text-sm text-muted-foreground">Parcel is being sorted at the central campus terminal.</p>
                                </div>
                              </div>
                              <Button variant="secondary" className="w-full h-11 font-bold rounded-xl" onClick={() => handleTabChange("tracking")}>
                                Track Parcel
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="tracking" className="mt-0 animate-in fade-in slide-in-from-bottom-2 duration-300">
              <div className="grid lg:grid-cols-3 gap-8">
                {/* Tracking Search Input */}
                <div className="lg:col-span-1 space-y-6">
                  <Card className="border-primary/20 bg-primary/5 shadow-sm overflow-hidden">
                    <CardHeader className="pb-3 border-b border-primary/10 bg-primary/10">
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Search className="w-5 h-5 text-primary" />
                        Quick Tracking
                      </CardTitle>
                      <CardDescription className="text-primary/70 font-medium">Find your order anywhere on campus</CardDescription>
                    </CardHeader>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <label className="text-xs font-bold uppercase tracking-widest text-primary/60">Tracking ID / Order ID</label>
                          <div className="relative">
                            <Input
                              placeholder="e.g. UM-883011-GH"
                              className="h-12 pl-12 rounded-xl border-primary/20 focus:ring-primary/30"
                              value={trackingId}
                              onChange={(e) => setTrackingId(e.target.value)}
                            />
                            <Package className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary/40" />
                          </div>
                        </div>
                        <Button className="w-full h-12 font-bold rounded-xl shadow-lg shadow-primary/20">
                          Track Now
                        </Button>
                      </div>
                    </CardContent>
                  </Card>

                  {/* Recent Activity Mini-Feed */}
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Recent Updates</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {[1, 2, 3].map((i) => (
                        <div key={i} className="flex gap-4 relative pb-4 border-l-2 border-muted pl-6 last:pb-0 last:border-0 ml-2">
                          <div className="absolute -left-[9px] top-0 w-4 h-4 rounded-full bg-background border-2 border-primary" />
                          <div className="space-y-1">
                            <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Today, 2:30 PM</p>
                            <p className="text-sm font-semibold">Reached Main University Terminal</p>
                          </div>
                        </div>
                      ))}
                    </CardContent>
                  </Card>
                </div>

                {/* Tracking Status Visualizer */}
                <div className="lg:col-span-2 space-y-6">
                  <Card className="overflow-hidden border-border/70 shadow-xl">
                    <div className="bg-gradient-to-r from-primary to-primary/80 px-6 py-8 text-white relative overflow-hidden">
                      {/* Abstract Background pattern */}
                      <div className="absolute inset-0 opacity-10 pointer-events-none">
                        <div className="absolute -right-20 -top-20 w-64 h-64 bg-white rounded-full blur-3xl" />
                        <div className="absolute -left-10 bottom-0 w-40 h-40 bg-white rounded-full blur-2xl" />
                      </div>

                      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 bg-white/20 backdrop-blur-md rounded-full px-4 py-1.5 w-fit border border-white/20">
                            <Truck className="w-4 h-4 animate-pulse" />
                            <span className="text-xs font-bold uppercase tracking-widest">In Transit</span>
                          </div>
                          <h2 className="text-3xl font-black tracking-tighter">ORD-002</h2>
                          <div className="flex items-center gap-4 text-white/80 text-sm font-medium">
                            <span className="flex items-center gap-1.5"><MapPin className="w-3.5 h-3.5" /> North Campus Gate</span>
                            <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                            <span className="flex items-center gap-1.5"><Calendar className="w-3.5 h-3.5" /> Est: Feb 04</span>
                          </div>
                        </div>
                        <div className="bg-white text-primary p-4 rounded-2xl shadow-2xl flex flex-col items-center min-w-[120px]">
                          <span className="text-[10px] font-black uppercase tracking-tighter text-primary/60 mb-1">Status</span>
                          <span className="text-xl font-black">75%</span>
                          <span className="text-[10px] font-bold text-muted-foreground">Completed</span>
                        </div>
                      </div>
                    </div>

                    <CardContent className="p-8 sm:p-12">
                      <div className="relative">
                        {/* Vertical Connector Line for Mobile, Horizontal for Desktop */}
                        <div className="absolute left-[19px] top-0 bottom-0 w-0.5 bg-muted md:hidden" />
                        <div className="absolute left-0 right-0 top-[23px] h-1 bg-muted hidden md:block" />

                        <div className="flex flex-col md:flex-row justify-between relative z-10 gap-10 md:gap-4">
                          {trackingSteps.map((step, idx) => {
                            const Icon = step.icon;
                            return (
                              <div key={idx} className="flex md:flex-col items-start md:items-center text-left md:text-center group flex-1">
                                <div className={`
                                  w-10 h-10 sm:w-12 sm:h-12 rounded-full flex items-center justify-center shrink-0 
                                  transition-all duration-500 border-4 border-background shadow-lg
                                  ${step.status === "completed" ? "bg-primary text-primary-foreground scale-110" :
                                    step.status === "current" ? "bg-blue-600 text-white animate-pulse ring-4 ring-blue-500/20" :
                                      "bg-muted text-muted-foreground opacity-60"}
                                `}>
                                  <Icon className="w-4 h-4 sm:w-5 h-5" />
                                </div>
                                <div className="ml-4 md:ml-0 md:mt-4 space-y-1">
                                  <p className={`text-sm font-bold ${step.status === "upcoming" ? "text-muted-foreground" : "text-foreground"}`}>
                                    {step.label}
                                  </p>
                                  <p className="text-[10px] sm:text-xs font-bold text-muted-foreground uppercase tracking-widest leading-tight">
                                    {step.date}
                                  </p>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      <div className="mt-16 bg-muted/20 rounded-2xl p-6 border border-border/50">
                        <div className="grid sm:grid-cols-2 gap-8">
                          <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <MapPin className="w-4 h-4 text-primary" /> Delivery Contact
                            </h4>
                            <div className="space-y-2">
                              <p className="font-bold text-base">Forson Odonkor</p>
                              <p className="text-sm text-muted-foreground leading-relaxed flex items-center gap-2">
                                <Smartphone className="w-4 h-4" /> +233 24 000 0000
                              </p>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                Room 402, Hall 7, KNUST Main Campus, Kumasi
                              </p>
                            </div>
                          </div>
                          <div className="space-y-4">
                            <h4 className="font-bold text-sm uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                              <Smartphone className="w-4 h-4 text-primary" /> Support Details
                            </h4>
                            <div className="bg-background rounded-xl p-4 border border-border/40 shadow-sm flex items-center justify-between">
                              <div className="space-y-0.5">
                                <p className="text-sm font-bold">Issues with parcel?</p>
                                <p className="text-xs text-muted-foreground">Live chat with support</p>
                              </div>
                              <Button variant="outline" size="sm" className="font-bold">Chat</Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BuyerOrders;
