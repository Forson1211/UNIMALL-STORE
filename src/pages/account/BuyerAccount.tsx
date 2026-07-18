import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import {
  User, Mail, Phone, MapPin, Package, Heart, Settings, LogOut,
  ChevronRight, Calendar, ShoppingBag, Eye, Star, Share2, Edit3, Award, CreditCard
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BuyerAccount = () => {
  const { user, profile, role, signOut, updateProfile, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  // Fetch real order statistics & list
  const { data: orders = [], refetch: refetchOrders } = useQuery({
    queryKey: ["buyer-account-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, order_status")
        .eq("buyer_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
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
    } else {
      toast({
        title: "Profile updated",
        description: "Your changes have been saved successfully.",
      });
      setIsEditDialogOpen(false);
    }
    setIsSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#f1f1f2] flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#f1f1f2]">
        <Navbar />
        <main className="pt-24 pb-16">
          <div className="container mx-auto px-4 max-w-lg text-center bg-white p-8 shadow-sm rounded-none">
            <h1 className="text-2xl font-bold mb-4">Please sign in</h1>
            <p className="text-muted-foreground mb-8">
              You need to be signed in to view your account details.
            </p>
            <Button asChild className="bg-[#FF5500] hover:bg-[#e54a00] text-white rounded-none w-full">
              <Link to="/login">Sign In</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate profile completion percentage based on fields filled
  const getProfileCompletion = () => {
    let score = 30; // base score for having an account
    if (profile?.full_name) score += 25;
    if (profile?.phone) score += 25;
    if (profile?.address) score += 20;
    return score;
  };

  const profileCompletion = getProfileCompletion();

  return (
    <div className="min-h-screen bg-[#f1f1f2]">
      <Navbar />

      <main className="py-4">
        <div className="max-w-[1280px] mx-auto px-3">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-3 items-start">
            
            {/* ─── LEFT COLUMN: Profile Sidebar Card ─── */}
            <div className="lg:col-span-4 bg-white shadow-sm border border-gray-100 p-6 flex flex-col relative">
              {/* Header Action Buttons (Share, Edit) */}
              <div className="absolute top-4 right-4 flex gap-1.5">
                <button 
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Copied!", description: "Account page link copied to clipboard." });
                  }}
                  className="p-1.5 border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-400 bg-white rounded transition-all"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  onClick={() => setIsEditDialogOpen(true)}
                  className="p-1.5 border border-gray-200 text-gray-500 hover:text-gray-800 hover:border-gray-400 bg-white rounded transition-all"
                  title="Edit details"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar section */}
              <div className="flex flex-col items-center text-center mt-2 mb-4">
                <Avatar className="h-24 w-24 border-4 border-gray-50 shadow-md">
                  <AvatarFallback className="bg-gradient-to-tr from-[#FF5500] to-orange-400 text-white text-3xl font-black">
                    {profile?.full_name?.split(" ").map((n) => n[0]).join("") || user.email?.charAt(0).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-black text-gray-900 mt-4 leading-tight">
                  {profile?.full_name || "User"}
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1.5">
                  Buyer @ Unimall
                </p>

                {/* Social Badges */}
                <div className="flex gap-2.5 mt-4">
                  <span className="w-7 h-7 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600 cursor-pointer transition-colors">in</span>
                  <span className="w-7 h-7 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600 cursor-pointer transition-colors">tw</span>
                  <span className="w-7 h-7 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600 cursor-pointer transition-colors">ig</span>
                  <span className="w-7 h-7 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded flex items-center justify-center text-xs font-bold text-gray-600 cursor-pointer transition-colors">fb</span>
                </div>

                <Link to="/account/orders" className="text-xs text-blue-500 font-bold hover:underline mt-4 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> View Active Orders
                </Link>
              </div>

              {/* Progress Completion Bar */}
              <div className="border-t border-gray-100 pt-5 mt-4">
                <div className="flex justify-between items-baseline text-xs font-bold text-gray-500 mb-1.5">
                  <span>Profile Strength</span>
                  <span className="text-[#FF5500]">{profileCompletion}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-orange-500 to-[#FF5500] rounded-full transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  Complete your profile details to unlock custom discount recommendations and faster delivery checkout!
                </p>
                <Button 
                  onClick={() => setIsEditDialogOpen(true)}
                  className="w-full mt-4 bg-white text-[#FF5500] hover:bg-orange-50 border border-[#FF5500] font-bold text-xs h-10 rounded-sm"
                >
                  Edit Profile Settings
                </Button>
              </div>

              {/* Seller / Staff links */}
              <div className="border-t border-gray-100 pt-4 mt-5 space-y-2">
                {role === "vendor" ? (
                  <Link to="/vendor" className="flex items-center justify-between p-2.5 bg-purple-50 text-purple-700 text-xs font-bold rounded-sm border border-purple-100 hover:bg-purple-100 transition-colors">
                    <span>Go to Seller Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link to="/signup?role=vendor" className="flex items-center justify-between p-2.5 bg-gray-50 text-gray-700 text-xs font-bold rounded-sm border border-gray-200 hover:bg-gray-100 transition-colors">
                    <span>Apply as Unimall Seller</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}

                {role === "admin" && (
                  <Link to="/admin" className="flex items-center justify-between p-2.5 bg-amber-50 text-amber-800 text-xs font-bold rounded-sm border border-amber-100 hover:bg-amber-100 transition-colors">
                    <span>Go to Admin Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}

                <button 
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-2.5 bg-red-50 text-red-600 text-xs font-bold rounded-sm border border-red-100 hover:bg-red-100 transition-colors"
                >
                  <span>Sign Out Account</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* ─── RIGHT COLUMN: Dashboard Cards (Stacked) ─── */}
            <div className="lg:col-span-8 space-y-3">
              
              {/* CARD 1: Horizontal Stats Card grid */}
              <div className="grid grid-cols-3 gap-2">
                <Card className="bg-white shadow-sm border-gray-100 rounded-none p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-orange-50 text-[#FF5500] rounded flex items-center justify-center shrink-0">
                    <Package className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-gray-900 block leading-none">{orders.length}</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Orders Placed</span>
                  </div>
                </Card>
                
                <Card className="bg-white shadow-sm border-gray-100 rounded-none p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-pink-50 text-pink-500 rounded flex items-center justify-center shrink-0">
                    <Heart className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-gray-900 block leading-none">3</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Saved Items</span>
                  </div>
                </Card>

                <Card className="bg-white shadow-sm border-gray-100 rounded-none p-4 flex items-center gap-3">
                  <div className="w-9 h-9 bg-blue-50 text-blue-500 rounded flex items-center justify-center shrink-0">
                    <Star className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-lg font-black text-gray-900 block leading-none">0</span>
                    <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">Reviews Left</span>
                  </div>
                </Card>
              </div>

              {/* CARD 2: About me (Personal overview) */}
              <Card className="bg-white shadow-sm border-gray-100 rounded-none p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2.5 mb-4">
                  About Me
                </h3>
                {/* Profile tag highlights */}
                <div className="flex flex-wrap gap-1.5 mb-5">
                  <span className="text-[11px] font-bold bg-gray-50 border border-gray-100 px-2.5 py-1 text-gray-600 rounded">
                    Joined Unimall 2026
                  </span>
                  <span className="text-[11px] font-bold bg-orange-50 border border-orange-100 px-2.5 py-1 text-[#FF5500] rounded">
                    Student Buyer
                  </span>
                  <span className="text-[11px] font-bold bg-green-50 border border-green-100 px-2.5 py-1 text-green-600 rounded">
                    Active Account Status
                  </span>
                </div>
                
                {/* Details layout lists */}
                <div className="grid grid-cols-2 gap-y-3.5 gap-x-4">
                  <div className="flex items-center gap-2.5">
                    <MapPin className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 leading-none">DELIVERY ZONE</p>
                      <p className="text-xs font-semibold text-gray-800 mt-1 truncate max-w-[200px]">
                        {profile?.address || "No address saved"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <Calendar className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 leading-none">MEMBER DURATION</p>
                      <p className="text-xs font-semibold text-gray-800 mt-1">1 year active</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 leading-none">PREFERRED CATEGORY</p>
                      <p className="text-xs font-semibold text-gray-800 mt-1">Electronics & Gadgets</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2.5">
                    <User className="w-4.5 h-4.5 text-gray-400 shrink-0" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 leading-none">ACCOUNT LEVEL</p>
                      <p className="text-xs font-semibold text-gray-800 mt-1 uppercase tracking-wider text-[#FF5500]">Gold Tier</p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* CARD 3: Vibes */}
              <Card className="bg-white shadow-sm border-gray-100 rounded-none p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2.5 mb-4">
                  Shopping Vibes
                </h3>
                <div className="flex flex-wrap gap-2">
                  <span className="text-xs font-medium bg-gray-50 border border-gray-200 px-3 py-1.5 text-gray-700 rounded-full">Bargain Hunter</span>
                  <span className="text-xs font-medium bg-gray-50 border border-gray-200 px-3 py-1.5 text-gray-700 rounded-full">Tech Fanatic</span>
                  <span className="text-xs font-medium bg-gray-50 border border-gray-200 px-3 py-1.5 text-gray-700 rounded-full">Quick Checkout</span>
                  <span className="text-xs font-medium bg-gray-50 border border-gray-200 px-3 py-1.5 text-gray-700 rounded-full">Momo Payer</span>
                </div>
              </Card>

              {/* CARD 4: Experience / Recent Purchases */}
              <Card className="bg-white shadow-sm border-gray-100 rounded-none p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2.5 mb-4">
                  Recent Orders
                </h3>
                
                {orders.length > 0 ? (
                  <div className="divide-y divide-gray-100">
                    {orders.slice(0, 3).map((ord) => (
                      <div key={ord.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 rounded flex items-center justify-center shrink-0 border border-gray-100">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs font-black text-gray-900 truncate max-w-[180px]">Order #{ord.id.substring(0, 8)}</p>
                            <p className="text-[10px] text-gray-500">
                              {new Date(ord.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-black text-gray-900">GH₵ {ord.total_amount.toLocaleString()}</p>
                          <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                            ord.order_status === "delivered" ? "bg-green-50 text-green-600" : "bg-yellow-50 text-yellow-600"
                          }`}>
                            {ord.order_status}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-6">
                    <p className="text-xs text-gray-500">No orders placed yet. Start shopping to build your order history!</p>
                    <Link to="/products" className="text-xs text-[#FF5500] font-bold hover:underline mt-2 block">Browse Products</Link>
                  </div>
                )}
              </Card>

              {/* CARD 5: Two columns (Preferred Categories & Saved Payments) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <Card className="bg-white shadow-sm border-gray-100 rounded-none p-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
                    Preferred Brands
                  </h3>
                  <div className="flex flex-col gap-2">
                    {["Apple", "Bruhm", "Samsung", "Nike", "Sony"].map(brand => (
                      <span key={brand} className="text-xs font-medium text-gray-700 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-sm w-fit">
                        {brand}
                      </span>
                    ))}
                  </div>
                </Card>

                <Card className="bg-white shadow-sm border-gray-100 rounded-none p-5">
                  <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider border-b border-gray-100 pb-2 mb-3">
                    Payment Options
                  </h3>
                  <div className="flex flex-col gap-2">
                    {["MTN Mobile Money", "Telecel Cash", "Debit Card / Visa", "Cash on Delivery"].map(pay => (
                      <span key={pay} className="text-xs font-medium text-gray-700 px-2.5 py-1 bg-gray-50 border border-gray-100 rounded-sm w-fit">
                        {pay}
                      </span>
                    ))}
                  </div>
                </Card>
              </div>

              {/* CARD 6: Address Card */}
              <Card className="bg-white shadow-sm border-gray-100 rounded-none p-5">
                <h3 className="text-sm font-bold text-gray-900 uppercase border-b border-gray-100 pb-2 mb-3">
                  Default Shipping Address
                </h3>
                <div className="flex items-start gap-3 py-2">
                  <div className="w-9 h-9 bg-blue-50 text-blue-600 rounded flex items-center justify-center shrink-0 mt-0.5">
                    <MapPin className="w-4.5 h-4.5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-gray-900">Primary Delivery Address</h4>
                    <p className="text-xs text-gray-600 mt-1 leading-normal">
                      {profile?.address || "Please add a default shipping address to enable quick 1-click checkout."}
                    </p>
                    {profile?.phone && (
                      <p className="text-xs text-gray-500 mt-1 font-medium">Contact: {profile.phone}</p>
                    )}
                  </div>
                </div>
              </Card>

            </div>

          </div>

        </div>
      </main>

      {/* ─── EDIT PROFILE DIALOG MODAL ─── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-none border border-gray-200 bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900">Edit Profile Details</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Update your account details below. Click save to apply your changes.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-bold text-gray-700">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="pl-9 h-10 rounded-none border-gray-200 text-sm focus:border-[#FF5500] outline-none"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-gray-700">Phone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-9 h-10 rounded-none border-gray-200 text-sm focus:border-[#FF5500] outline-none"
                  placeholder="e.g. 055 123 4567"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-gray-700">Delivery Address</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="pl-9 h-10 rounded-none border-gray-200 text-sm focus:border-[#FF5500] outline-none"
                  placeholder="e.g. Hostal Room 204, Campus East"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-gray-100 pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-none h-10 font-bold text-xs">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs h-10 rounded-none px-6"
            >
              {isSaving ? "Saving Changes..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BuyerAccount;
