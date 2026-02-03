import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Package, ArrowLeft, Eye, Truck, Check, Clock, ShoppingBag } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

// Mock orders data
const mockOrders = [
  {
    id: "ORD-001",
    date: "2025-02-01",
    status: "delivered",
    total: 127.00,
    items: [
      { name: "Wireless Earbuds Pro", quantity: 1, price: 85, image: "https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=100" },
      { name: "Laptop Stand", quantity: 1, price: 42, image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100" },
    ],
  },
  {
    id: "ORD-002",
    date: "2025-01-28",
    status: "shipped",
    total: 45.00,
    items: [
      { name: "Campus Hoodie - Navy", quantity: 1, price: 45, image: "https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=100" },
    ],
  },
  {
    id: "ORD-003",
    date: "2025-01-25",
    status: "processing",
    total: 63.00,
    items: [
      { name: "Yoga Mat Premium", quantity: 1, price: 38, image: "https://images.unsplash.com/photo-1601925260368-ae2f83cf8b7f?w=100" },
      { name: "Canvas Tote Bag", quantity: 1, price: 22, image: "https://images.unsplash.com/photo-1544816155-12df9643f363?w=100" },
    ],
  },
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "delivered":
      return <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20"><Check className="w-3 h-3 mr-1" />Delivered</Badge>;
    case "shipped":
      return <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20"><Truck className="w-3 h-3 mr-1" />Shipped</Badge>;
    case "processing":
      return <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20"><Clock className="w-3 h-3 mr-1" />Processing</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
};

const BuyerOrders = () => {
  const { user } = useAuth();

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
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Back Button */}
          <Button variant="ghost" asChild className="mb-6">
            <Link to="/account">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Account
            </Link>
          </Button>

          {/* Header */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-full bg-accent flex items-center justify-center">
              <Package className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">My Orders</h1>
              <p className="text-muted-foreground">{mockOrders.length} orders</p>
            </div>
          </div>

          {/* Orders List */}
          {mockOrders.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                <ShoppingBag className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-semibold mb-2">No orders yet</h3>
              <p className="text-muted-foreground mb-6">
                When you place your first order, it will appear here.
              </p>
              <Button asChild>
                <Link to="/products">Start Shopping</Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {mockOrders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="p-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
                      <div>
                        <p className="font-semibold">{order.id}</p>
                        <p className="text-sm text-muted-foreground">
                          Placed on {new Date(order.date).toLocaleDateString("en-US", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        {getStatusBadge(order.status)}
                        <Button variant="outline" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View Details
                        </Button>
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-3 mb-4">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex items-center gap-3 bg-muted/50 rounded-lg p-2 pr-4">
                          <img
                            src={item.image}
                            alt={item.name}
                            className="w-12 h-12 rounded-lg object-cover"
                          />
                          <div>
                            <p className="text-sm font-medium line-clamp-1">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                          </div>
                        </div>
                      ))}
                    </div>

                    <div className="flex justify-between items-center pt-4 border-t border-border">
                      <span className="text-muted-foreground">Total</span>
                      <span className="font-semibold text-lg">GH₵{order.total.toFixed(2)}</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BuyerOrders;
