import { useState } from "react";
import { Link } from "react-router-dom";
import Navbar from "@/components/layout/Navbar";
import Footer from "@/components/layout/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card } from "@/components/ui/card";
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
  ChevronRight, Calendar, ShoppingBag, Eye, Star, Share2, Edit3, Award,
  CreditCard, ShieldCheck, MessageCircle, HelpCircle, ArrowUpRight
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const BuyerAccount = () => {
  const { user, profile, role, signOut, updateProfile, isLoading: authLoading } = useAuth();
  const { whatsappNumber } = useSiteSettingsContext();
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  // Fetch real order statistics & list
  const { data: orders = [] } = useQuery({
    queryKey: ["buyer-account-orders", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("id, created_at, total_amount, status")
        .eq("buyer_id", user?.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch real wishlist items count
  const { data: wishlist = [] } = useQuery({
    queryKey: ["buyer-account-wishlist", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("wishlist")
        .select("id")
        .eq("user_id", user?.id);
      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch real reviews count
  const { data: reviews = [] } = useQuery({
    queryKey: ["buyer-account-reviews", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reviews")
        .select("id")
        .eq("user_id", user?.id);
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
        title: "Profile Updated",
        description: "Your account details have been saved successfully.",
      });
      setIsEditDialogOpen(false);
    }
    setIsSaving(false);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#F7F8FA] flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#FF5500] border-t-transparent rounded-none animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-[#F7F8FA]">
        <Navbar />
        <main className="pt-28 pb-16">
          <div className="container mx-auto px-4 max-w-md text-center bg-white p-8 border border-gray-200 rounded-none shadow-xs">
            <User className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <h1 className="text-xl font-bold mb-2">Please Sign In</h1>
            <p className="text-sm text-gray-500 mb-6">
              You need to be signed in to view your profile and order history.
            </p>
            <Button asChild className="bg-[#FF5500] hover:bg-[#e54a00] text-white rounded-none w-full font-bold">
              <Link to="/login">Sign In to Account</Link>
            </Button>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  // Calculate profile completion percentage
  const getProfileCompletion = () => {
    let score = 35; // base score for registered account
    if (profile?.full_name?.trim()) score += 25;
    if (profile?.phone?.trim()) score += 20;
    if (profile?.address?.trim()) score += 20;
    return Math.min(100, score);
  };

  const profileCompletion = getProfileCompletion();

  return (
    <div className="min-h-screen bg-[#F7F8FA] dark:bg-background">
      <Navbar />

      <main className="py-6 md:py-10">
        <div className="max-w-[1280px] mx-auto px-4 xl:px-0">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
            
            {/* ─── LEFT COLUMN: Profile Sidebar Card (No Rounded Edges) ─── */}
            <div className="lg:col-span-4 bg-white dark:bg-card shadow-xs border border-gray-200 dark:border-border rounded-none p-6 flex flex-col relative">
              
              {/* Header Quick Actions (Share, Edit) */}
              <div className="absolute top-5 right-5 flex gap-1.5">
                <button 
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    toast({ title: "Link Copied", description: "Account page link copied to clipboard." });
                  }}
                  className="p-2 border border-gray-200 dark:border-border text-gray-500 hover:text-gray-900 bg-white dark:bg-card hover:bg-gray-50 rounded-none transition-all cursor-pointer"
                  title="Share profile"
                >
                  <Share2 className="w-4 h-4" />
                </button>
                <button 
                  type="button"
                  onClick={() => {
                    setFormData({
                      full_name: profile?.full_name || "",
                      phone: profile?.phone || "",
                      address: profile?.address || "",
                    });
                    setIsEditDialogOpen(true);
                  }}
                  className="p-2 border border-gray-200 dark:border-border text-gray-500 hover:text-gray-900 bg-white dark:bg-card hover:bg-gray-50 rounded-none transition-all cursor-pointer"
                  title="Edit details"
                >
                  <Edit3 className="w-4 h-4" />
                </button>
              </div>

              {/* Avatar Section */}
              <div className="flex flex-col items-center text-center mt-2 mb-4">
                <Avatar className="h-24 w-24 border-4 border-white dark:border-card shadow-md rounded-full">
                  <AvatarFallback className="bg-gradient-to-tr from-[#FF5500] to-orange-400 text-white text-3xl font-black rounded-full">
                    {profile?.full_name?.split(" ").map((n) => n[0]).join("") || user.email?.charAt(0).toUpperCase() || "U"}
                  </AvatarFallback>
                </Avatar>
                <h2 className="text-xl font-extrabold text-gray-900 dark:text-white mt-4 leading-tight">
                  {profile?.full_name || user.email?.split("@")[0] || "Student User"}
                </h2>
                <p className="text-xs text-gray-500 font-bold uppercase tracking-wider mt-1">
                  {user.email}
                </p>
                <div className="mt-2 inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-none bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] text-[11px] font-bold">
                  <span>{role === "vendor" ? "Campus Vendor" : role === "admin" ? "Administrator" : "Campus Buyer"}</span>
                </div>

                <Link to="/orders" className="text-xs text-[#FF5500] font-bold hover:underline mt-4 flex items-center gap-1">
                  <Package className="w-3.5 h-3.5" /> View Order History
                </Link>
              </div>

              {/* Profile Strength Bar */}
              <div className="border-t border-gray-100 dark:border-border/60 pt-5 mt-3">
                <div className="flex justify-between items-baseline text-xs font-bold text-gray-600 dark:text-gray-300 mb-1.5">
                  <span>Profile Completion</span>
                  <span className="text-[#FF5500]">{profileCompletion}%</span>
                </div>
                <div className="h-2 bg-gray-100 dark:bg-muted rounded-none overflow-hidden mb-2.5">
                  <div 
                    className="h-full bg-[#FF5500] rounded-none transition-all duration-500"
                    style={{ width: `${profileCompletion}%` }}
                  />
                </div>
                <p className="text-[11px] text-gray-500 leading-snug">
                  {profileCompletion < 100 
                    ? "Add your campus delivery hall/room and phone number for faster 1-click checkout."
                    : "Your campus profile is fully completed and ready for fast checkout!"}
                </p>
                <Button 
                  type="button"
                  onClick={() => {
                    setFormData({
                      full_name: profile?.full_name || "",
                      phone: profile?.phone || "",
                      address: profile?.address || "",
                    });
                    setIsEditDialogOpen(true);
                  }}
                  className="w-full mt-4 bg-white dark:bg-card text-[#FF5500] hover:bg-orange-50 dark:hover:bg-orange-950/20 border border-[#FF5500] font-bold text-xs h-10 rounded-none cursor-pointer"
                >
                  Edit Profile Details
                </Button>
              </div>

              {/* Seller / Staff / Sign Out links */}
              <div className="border-t border-gray-100 dark:border-border/60 pt-4 mt-5 space-y-2">
                {role === "vendor" ? (
                  <Link to="/vendor" className="flex items-center justify-between p-3 bg-orange-50 dark:bg-orange-950/30 text-[#FF5500] text-xs font-bold rounded-none border border-orange-200/50 hover:bg-orange-100/50 transition-colors">
                    <span>Go to Seller Dashboard</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                ) : (
                  <Link to="/signup?role=vendor" className="flex items-center justify-between p-3 bg-gray-50 dark:bg-muted text-gray-700 dark:text-gray-200 text-xs font-bold rounded-none border border-gray-200 dark:border-border hover:bg-gray-100 transition-colors">
                    <span>Sell on Unimall (Become a Vendor)</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}

                {role === "admin" && (
                  <Link to="/admin" className="flex items-center justify-between p-3 bg-amber-50 text-amber-900 text-xs font-bold rounded-none border border-amber-200 hover:bg-amber-100 transition-colors">
                    <span>Admin Portal</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                )}

                <button 
                  type="button"
                  onClick={signOut}
                  className="w-full flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 text-xs font-bold rounded-none border border-red-200/60 dark:border-red-900/40 hover:bg-red-100/50 transition-colors cursor-pointer"
                >
                  <span>Sign Out Account</span>
                  <LogOut className="w-4 h-4" />
                </button>
              </div>

            </div>

            {/* ─── RIGHT COLUMN: Dashboard & Details (No Rounded Edges) ─── */}
            <div className="lg:col-span-8 space-y-4">
              
              {/* TOP SUMMARY STAT CARDS */}
              <div className="grid grid-cols-3 gap-3">
                <Card className="bg-white dark:bg-card shadow-xs border-gray-200 dark:border-border rounded-none p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] rounded-none flex items-center justify-center shrink-0">
                    <Package className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white block leading-none">{orders.length}</span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1 block">Orders Placed</span>
                  </div>
                </Card>
                
                <Card className="bg-white dark:bg-card shadow-xs border-gray-200 dark:border-border rounded-none p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-pink-50 dark:bg-pink-950/40 text-pink-500 rounded-none flex items-center justify-center shrink-0">
                    <Heart className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white block leading-none">{wishlist.length}</span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1 block">Saved Items</span>
                  </div>
                </Card>

                <Card className="bg-white dark:bg-card shadow-xs border-gray-200 dark:border-border rounded-none p-4 sm:p-5 flex items-center gap-3.5">
                  <div className="w-10 h-10 bg-blue-50 dark:bg-blue-950/40 text-blue-500 rounded-none flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5" />
                  </div>
                  <div>
                    <span className="text-xl font-extrabold text-gray-900 dark:text-white block leading-none">{reviews.length}</span>
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wide mt-1 block">Reviews Left</span>
                  </div>
                </Card>
              </div>

              {/* ABOUT ME & ACCOUNT OVERVIEW */}
              <Card className="bg-white dark:bg-card shadow-xs border-gray-200 dark:border-border rounded-none p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-border/60 pb-3">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                    Account Overview
                  </h3>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold bg-green-50 text-green-600 dark:bg-green-950/40 px-2.5 py-0.5 rounded-none flex items-center gap-1 border border-green-200/60">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                      Active Student
                    </span>
                  </div>
                </div>
                
                {/* Account Details 4-Item Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-1">
                  <div className="flex items-start gap-3 p-3 rounded-none bg-[#F9FAFB] dark:bg-muted/40 border border-gray-100 dark:border-border/40">
                    <MapPin className="w-4.5 h-4.5 text-[#FF5500] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campus Delivery Location</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                        {profile?.address || "No delivery location set"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-none bg-[#F9FAFB] dark:bg-muted/40 border border-gray-100 dark:border-border/40">
                    <Phone className="w-4.5 h-4.5 text-[#FF5500] shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Contact Phone / WhatsApp</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                        {profile?.phone || "No phone number added"}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-none bg-[#F9FAFB] dark:bg-muted/40 border border-gray-100 dark:border-border/40">
                    <Calendar className="w-4.5 h-4.5 text-gray-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Member Since</p>
                      <p className="text-xs font-bold text-gray-800 dark:text-gray-200 mt-0.5">
                        {new Date(user?.created_at || Date.now()).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3 rounded-none bg-[#F9FAFB] dark:bg-muted/40 border border-gray-100 dark:border-border/40">
                    <ShieldCheck className="w-4.5 h-4.5 text-emerald-600 shrink-0 mt-0.5" />
                    <div>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Campus Account Status</p>
                      <p className="text-xs font-bold text-emerald-600 mt-0.5">
                        100% Protected Buyer
                      </p>
                    </div>
                  </div>
                </div>
              </Card>

              {/* RECENT ORDERS CARD */}
              <Card className="bg-white dark:bg-card shadow-xs border-gray-200 dark:border-border rounded-none p-5 sm:p-6 space-y-4">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-border/60 pb-3">
                  <h3 className="text-sm font-extrabold text-gray-900 dark:text-white uppercase tracking-wider">
                    Recent Orders
                  </h3>
                  {orders.length > 0 && (
                    <Link to="/orders" className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1">
                      <span>View All</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                  )}
                </div>
                
                {orders.length > 0 ? (
                  <div className="divide-y divide-gray-100 dark:divide-border/60">
                    {orders.slice(0, 3).map((ord) => (
                      <div key={ord.id} className="py-3 flex items-center justify-between gap-4 first:pt-0 last:pb-0">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-50 dark:bg-muted rounded-none flex items-center justify-center shrink-0 border border-gray-100 dark:border-border">
                            <Package className="w-5 h-5 text-gray-400" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-gray-900 dark:text-white truncate max-w-[180px]">
                              Order #{ord.id.substring(0, 8)}
                            </p>
                            <p className="text-[11px] text-gray-500">
                              {new Date(ord.created_at).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs font-extrabold text-gray-900 dark:text-white">₵ {ord.total_amount?.toFixed(2)}</p>
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-none ${
                            ord.status === "delivered" ? "bg-green-50 text-green-600 dark:bg-green-950/40" : "bg-orange-50 text-[#FF5500] dark:bg-orange-950/40"
                          }`}>
                            {ord.status || "Processing"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Package className="w-10 h-10 text-gray-300 mx-auto mb-2" />
                    <p className="text-xs font-medium text-gray-500">No orders placed yet. Start exploring campus marketplace deals!</p>
                    <Link 
                      to="/products" 
                      className="inline-flex items-center gap-1 text-xs text-[#FF5500] font-bold hover:underline mt-3"
                    >
                      <span>Browse Products</span>
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}
              </Card>

              {/* CAMPUS DELIVERY & SUPPORT QUICK ACCESS */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className="bg-white dark:bg-card shadow-xs border-gray-200 dark:border-border rounded-none p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    <MapPin className="w-4 h-4 text-[#FF5500]" />
                    <span>Default Campus Delivery Address</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    {profile?.address ? (
                      profile.address
                    ) : (
                      "No default address set. Please update your profile to include your campus hall or hostel room."
                    )}
                  </p>
                  {profile?.phone && (
                    <p className="text-xs text-gray-500 font-medium pt-1">
                      Recipient Contact: <span className="font-bold text-gray-700 dark:text-gray-300">{profile.phone}</span>
                    </p>
                  )}
                </Card>

                <Card className="bg-white dark:bg-card shadow-xs border-gray-200 dark:border-border rounded-none p-5 space-y-2.5">
                  <div className="flex items-center gap-2 text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                    <HelpCircle className="w-4 h-4 text-[#FF5500]" />
                    <span>Student Support & Helpdesk</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
                    Have questions about an order or delivery on campus? Chat directly with the Unimall student support team.
                  </p>
                  <div className="pt-1">
                    <a
                      href={`https://wa.me/${(whatsappNumber || "+233241234567").replace(/[^0-9]/g, "")}?text=${encodeURIComponent("Hello Unimall Support, I need help with my account/order.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF5500] hover:underline"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Chat on WhatsApp Support &gt;</span>
                    </a>
                  </div>
                </Card>
              </div>

            </div>

          </div>

        </div>
      </main>

      {/* ─── EDIT PROFILE DIALOG MODAL (No Rounded Edges) ─── */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md rounded-none border border-gray-200 dark:border-border bg-white dark:bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-extrabold text-gray-900 dark:text-white">Edit Profile Details</DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Update your account details and campus delivery location below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-3">
            <div className="space-y-1.5">
              <Label htmlFor="full_name" className="text-xs font-bold text-gray-700 dark:text-gray-300">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="full_name"
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleInputChange}
                  className="pl-9 h-10 rounded-none border-gray-200 dark:border-border text-sm focus:border-[#FF5500]"
                  placeholder="Enter full name"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-xs font-bold text-gray-700 dark:text-gray-300">Phone / WhatsApp Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="pl-9 h-10 rounded-none border-gray-200 dark:border-border text-sm focus:border-[#FF5500]"
                  placeholder="e.g. 055 123 4567"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="address" className="text-xs font-bold text-gray-700 dark:text-gray-300">Campus Delivery Location (Hall / Hostel / Room)</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  id="address"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="pl-9 h-10 rounded-none border-gray-200 dark:border-border text-sm focus:border-[#FF5500]"
                  placeholder="e.g. Jean Nelson Hall, Room B12, Legon"
                />
              </div>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0 border-t border-gray-100 dark:border-border pt-4">
            <DialogClose asChild>
              <Button type="button" variant="outline" className="rounded-none h-10 font-bold text-xs">
                Cancel
              </Button>
            </DialogClose>
            <Button 
              onClick={handleSave} 
              disabled={isSaving} 
              className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs h-10 rounded-none px-6 shadow-xs"
            >
              {isSaving ? "Saving..." : "Save Changes"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default BuyerAccount;
