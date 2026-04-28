import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { User, Mail, Phone, MapPin, Package, Heart, Settings, LogOut, ShieldAlert, Store, Truck, LayoutDashboard } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

const BuyerAccount = () => {
  const { user, profile, role, signOut, updateProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await updateProfile(formData);
    if (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
    setIsSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-4 border-primary border-t-transparent animate-spin" />
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
              You need to be signed in to view your account.
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
          {/* Header */}
          {/* Header */}
          <div className="flex flex-col items-center justify-center text-center gap-4 mb-8">
            <Avatar className="h-24 w-24 border-4 border-background shadow-xl">
              <AvatarFallback className="bg-primary text-primary-foreground text-3xl font-bold">
                {profile?.full_name?.split(" ").map((n) => n[0]).join("") || "U"}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-1">
              <h1 className="text-3xl font-bold tracking-tight">{profile?.full_name || "User"}</h1>
              <p className="text-muted-foreground font-medium">{user.email}</p>
            </div>
          </div>

          {/* Quick Links */}
          {/* Quick Links */}
          <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6 mb-8">
            <Link to="/account/orders">
              <Card className="hover:border-primary transition-all duration-300 cursor-pointer h-full group hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-primary/10 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300 flex items-center justify-center mb-1 sm:mb-2">
                    <Package className="w-5 h-5 sm:w-8 sm:h-8 text-primary group-hover:text-primary-foreground transition-colors" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="font-bold text-base sm:text-lg group-hover:text-primary transition-colors">My Orders</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">View and manage orders</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/account/orders?tab=tracking">
              <Card className="hover:border-blue-500 transition-all duration-300 cursor-pointer h-full group hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-blue-500/10 group-hover:bg-blue-500 group-hover:text-white transition-all duration-300 flex items-center justify-center mb-1 sm:mb-2">
                    <Truck className="w-5 h-5 sm:w-8 sm:h-8 text-blue-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="font-bold text-base sm:text-lg group-hover:text-blue-500 transition-colors">Track Order</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Live shipment updates</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            <Link to="/account/wishlist">
              <Card className="hover:border-pink-500 transition-all duration-300 cursor-pointer h-full group hover:shadow-lg hover:-translate-y-1">
                <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-4">
                  <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-pink-500/10 group-hover:bg-pink-500 group-hover:text-white transition-all duration-300 flex items-center justify-center mb-1 sm:mb-2">
                    <Heart className="w-5 h-5 sm:w-8 sm:h-8 text-pink-500 group-hover:text-white transition-colors" />
                  </div>
                  <div className="space-y-0.5 sm:space-y-1">
                    <p className="font-bold text-base sm:text-lg group-hover:text-pink-500 transition-colors">Wishlist</p>
                    <p className="text-xs sm:text-sm text-muted-foreground">Your saved items</p>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {(role === "admin" || role === "moderator" || role === "vendor_manager" || role === "order_manager" || role === "content_manager" || role === "support_agent") && (
              <Link to="/admin">
                <Card className="border-amber-500/50 hover:border-amber-500 transition-all duration-300 cursor-pointer h-full bg-amber-500/5 group hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-4">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-amber-500/20 group-hover:bg-amber-500 group-hover:text-white transition-all duration-300 flex items-center justify-center mb-1 sm:mb-2">
                      <LayoutDashboard className="w-5 h-5 sm:w-8 sm:h-8 text-amber-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="font-bold text-base sm:text-lg text-amber-700 group-hover:text-amber-600 transition-colors">
                        {role === "admin" ? "Admin Dashboard" : "Staff Panel"}
                      </p>
                      <p className="text-xs sm:text-sm text-muted-foreground capitalize">{role?.replace("_", " ")}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            {role === "vendor" && (
              <Link to="/vendor">
                <Card className="border-purple-500/50 hover:border-purple-500 transition-all duration-300 cursor-pointer h-full bg-purple-500/5 group hover:shadow-lg hover:-translate-y-1">
                  <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-4">
                    <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-purple-500/20 group-hover:bg-purple-500 group-hover:text-white transition-all duration-300 flex items-center justify-center mb-1 sm:mb-2">
                      <Store className="w-5 h-5 sm:w-8 sm:h-8 text-purple-600 group-hover:text-white transition-colors" />
                    </div>
                    <div className="space-y-0.5 sm:space-y-1">
                      <p className="font-bold text-base sm:text-lg text-purple-700 group-hover:text-purple-600 transition-colors">Vendor Portal</p>
                      <p className="text-xs sm:text-sm text-muted-foreground">Manage your store</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            )}

            <Card
              className="hover:border-destructive transition-all duration-300 cursor-pointer group hover:shadow-lg hover:-translate-y-1"
              onClick={signOut}
            >
              <CardContent className="p-4 sm:p-6 flex flex-col items-center text-center gap-2 sm:gap-4">
                <div className="w-10 h-10 sm:w-16 sm:h-16 rounded-full bg-destructive/10 group-hover:bg-destructive group-hover:text-white transition-all duration-300 flex items-center justify-center mb-1 sm:mb-2">
                  <LogOut className="w-5 h-5 sm:w-8 sm:h-8 text-destructive group-hover:text-white transition-colors" />
                </div>
                <div className="space-y-0.5 sm:space-y-1">
                  <p className="font-bold text-base sm:text-lg text-destructive group-hover:text-destructive-foreground transition-colors">Sign Out</p>
                  <p className="text-xs sm:text-sm text-muted-foreground">Log out of account</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Account Settings
              </CardTitle>
              <CardDescription>
                Manage your account details and preferences
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="full_name">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="full_name"
                        name="full_name"
                        value={formData.full_name}
                        onChange={handleInputChange}
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="email"
                        value={user.email}
                        className="pl-10"
                        disabled
                      />
                    </div>
                  </div>
                </div>
                <div className="grid sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Phone Number</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        placeholder="0XX XXX XXXX"
                        className="pl-10"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="address">Delivery Address</Label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        id="address"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        placeholder="Your default delivery address"
                        className="pl-10"
                      />
                    </div>
                  </div>
                </div>
                <Button onClick={handleSave} disabled={isSaving}>
                  {isSaving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default BuyerAccount;
