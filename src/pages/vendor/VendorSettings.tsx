import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { ArrowUpRight, CheckCircle, CreditCard, ShieldCheck, Sparkles, Upload, Smartphone, Landmark, Trash2, WalletCards } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { supabase } from "@/integrations/supabase/client";
import { vendorService } from "@/services/vendorService";
import { useState, useEffect } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

const CAMPUS_OPTIONS = [
  "University of Ghana",
  "KNUST",
  "University of Cape Coast",
  "University for Development Studies",
  "Ashesi University",
  "Ghana Communication Technology University",
  "Other Ghana campus",
];
const DEFAULT_CAMPUS_DIRECTORY = CAMPUS_OPTIONS.map((name, index) => ({ id: `default-${index}`, name, shortName: name, city: "Ghana", active: true }));

const DEFAULT_NOTIFICATION_PREFERENCES = {
  new_order: true,
  low_stock: true,
  customer_messages: true,
  weekly_report: false,
  product_reviews: true,
  two_factor: false,
  login_notifications: true,
};

const VendorSettings = () => {
  const { user, profile, refreshProfile } = useAuth();
  const { getSetting } = useSiteSettingsContext();
  const campusDirectory = (getSetting("campus_directory", DEFAULT_CAMPUS_DIRECTORY) as typeof DEFAULT_CAMPUS_DIRECTORY).filter((campus) => campus.active && campus.name?.trim());
  const [loading, setLoading] = useState(false);
  const [bannerLoading, setBannerLoading] = useState(false);
  const [formData, setFormData] = useState({
    storeName: "",
    email: "",
    description: "",
    phone: "",
    campus: "",
    category: ""
  });
  const [passwordForm, setPasswordForm] = useState({ current: "", next: "", confirm: "" });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [isAddPaymentOpen, setIsAddPaymentOpen] = useState(false);
  const [paymentMethodForm, setPaymentMethodForm] = useState({ type: "momo" as "momo" | "bank", label: "", accountNumber: "" });
  const queryClient = useQueryClient();

  const { data: balance } = useQuery({
    queryKey: ["vendor-balance", user?.id],
    queryFn: () => vendorService.getAvailableBalance(user!.id),
    enabled: !!user,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["vendor-payment-methods", user?.id],
    queryFn: () => vendorService.getPaymentMethods(user!.id),
    enabled: !!user,
  });

  const { data: payoutRequests = [] } = useQuery({
    queryKey: ["vendor-payout-requests", user?.id],
    queryFn: () => vendorService.getPayoutRequests(user!.id),
    enabled: !!user,
  });

  const hasPendingPayout = (payoutRequests || []).some((p: any) => p.status === "pending");

  const requestPayoutMutation = useMutation({
    mutationFn: () => {
      const method = paymentMethods.find((m: any) => m.is_default) || paymentMethods[0];
      if (!method) throw new Error("Add a payment method first");
      return vendorService.requestPayout(user!.id, balance?.balance || 0, method.type, method.details);
    },
    onSuccess: () => {
      toast.success("Payout requested! We'll process it shortly.");
      queryClient.invalidateQueries({ queryKey: ["vendor-payout-requests"] });
    },
    onError: (error: any) => toast.error(error.message || "Failed to request payout"),
  });

  const addPaymentMethodMutation = useMutation({
    mutationFn: () => vendorService.addPaymentMethod(user!.id, {
      type: paymentMethodForm.type,
      label: paymentMethodForm.label,
      details: { accountNumber: paymentMethodForm.accountNumber },
    }),
    onSuccess: () => {
      toast.success("Payment method added");
      queryClient.invalidateQueries({ queryKey: ["vendor-payment-methods"] });
      setIsAddPaymentOpen(false);
      setPaymentMethodForm({ type: "momo", label: "", accountNumber: "" });
    },
    onError: (error: any) => toast.error(error.message || "Failed to add payment method"),
  });

  const deletePaymentMethodMutation = useMutation({
    mutationFn: (id: string) => vendorService.deletePaymentMethod(id),
    onSuccess: () => {
      toast.success("Payment method removed");
      queryClient.invalidateQueries({ queryKey: ["vendor-payment-methods"] });
    },
    onError: (error: any) => toast.error(error.message || "Failed to remove payment method"),
  });

  const notificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(profile?.notification_preferences || {}),
  };

  useEffect(() => {
    if (profile) {
      setFormData({
        storeName: profile.store_name || "",
        email: user?.email || "",
        description: profile.store_description || "",
        phone: profile.phone || "",
        campus: profile.campus || "",
        category: profile.store_category || ""
      });
    }
  }, [profile, user]);

  const updateNotificationPreference = async (key: keyof typeof DEFAULT_NOTIFICATION_PREFERENCES, value: boolean) => {
    if (!user) return;
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          notification_preferences: { ...notificationPreferences, [key]: value },
        } as any)
        .eq("user_id", user.id);
      if (error) throw error;
      await refreshProfile();
    } catch (error: any) {
      toast.error(error.message || "Failed to update preference");
    }
  };

  const handleSave = async () => {
    if (!user) return;
    if (!formData.campus) {
      toast.error("Select your campus location so buyers know where to find you.");
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          store_name: formData.storeName,
          store_description: formData.description,
          phone: formData.phone,
          campus: formData.campus,
          store_category: formData.category,
          updated_at: new Date().toISOString()
        } as any)
        .eq("user_id", user.id);

      if (error) throw error;
      await refreshProfile();
      toast.success("Settings saved successfully");
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user?.email) return;

    if (!passwordForm.current || !passwordForm.next || !passwordForm.confirm) {
      toast.error("Please fill in all password fields");
      return;
    }
    if (passwordForm.next.length < 6) {
      toast.error("New password must be at least 6 characters");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: reauthError } = await supabase.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.current,
      });
      if (reauthError) {
        toast.error("Current password is incorrect");
        return;
      }

      const { error: updateError } = await supabase.auth.updateUser({ password: passwordForm.next });
      if (updateError) throw updateError;

      toast.success("Password updated successfully");
      setPasswordForm({ current: "", next: "", confirm: "" });
    } catch (error: any) {
      toast.error(error.message || "Failed to update password");
    } finally {
      setPasswordLoading(false);
    }
  };

  return (
    <DashboardLayout
      type="vendor"
      title="Settings"
      userName={profile?.store_name || profile?.full_name || "Vendor"}
      userRole="Vendor"
    >
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="relative overflow-hidden border border-slate-200 bg-gradient-to-br from-[#17233D] via-[#1D2B49] to-[#294365] p-5 text-white shadow-[0_18px_45px_rgba(15,23,42,0.14)] sm:p-7">
          <div className="absolute -right-16 -top-20 h-56 w-56 border border-white/10 bg-white/[0.04]" />
          <div className="relative flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
            <div>
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200"><Sparkles className="h-4 w-4" /> Seller workspace</div>
              <h1 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Earnings & settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Keep your campus storefront polished, your payouts ready, and your seller account secure.</p>
            </div>
            <div className="flex items-center gap-3 border border-white/15 bg-slate-950/20 px-4 py-3 text-sm"><span className={`h-2.5 w-2.5 ${profile?.verified ? "bg-emerald-400" : "bg-amber-300"}`} /><span className="font-bold">{profile?.verified ? "Verified seller" : "Verification in progress"}</span></div>
          </div>
          <div className="relative mt-7 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
            <div className="bg-slate-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Available balance</p><p className="mt-2 text-2xl font-black">GH₵{Number(balance?.balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-slate-300">Ready for payout</p></div>
            <div className="bg-slate-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Payment methods</p><p className="mt-2 text-2xl font-black">{paymentMethods.length}</p><p className="mt-1 text-xs text-slate-300">Configured for settlement</p></div>
            <div className="bg-slate-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Payout status</p><p className="mt-2 text-2xl font-black">{hasPendingPayout ? "Pending" : "Ready"}</p><p className="mt-1 text-xs text-slate-300">{hasPendingPayout ? "Being reviewed by Unimall" : "No pending request"}</p></div>
          </div>
        </section>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-2 gap-1 border border-slate-200 bg-slate-100 p-1 sm:grid-cols-4">
            <TabsTrigger className="py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm sm:text-sm" value="profile">Store Profile</TabsTrigger>
            <TabsTrigger className="py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm sm:text-sm" value="notifications">Notifications</TabsTrigger>
            <TabsTrigger className="py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm sm:text-sm" value="payments">Payments</TabsTrigger>
            <TabsTrigger className="py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm sm:text-sm" value="security">Security</TabsTrigger>
          </TabsList>

        <TabsContent value="profile">
          <Card className="overflow-hidden border-slate-200 bg-white shadow-[0_16px_45px_rgba(15,23,42,0.08)]">
            <CardHeader className="border-b border-slate-200 bg-gradient-to-r from-slate-50 to-white px-6 py-6 sm:px-8">
              <div className="flex flex-col justify-between gap-3 sm:flex-row sm:items-end">
                <div><p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#FF5500]">Public storefront</p><CardTitle className="mt-2 text-2xl font-black tracking-tight text-slate-950">Store Profile</CardTitle><CardDescription className="mt-1 text-sm text-slate-500">Shape the storefront students see when they discover your campus business.</CardDescription></div>
                <div className="flex items-center gap-2 text-xs font-bold text-slate-500"><span className={`h-2 w-2 ${profile?.verified ? "bg-emerald-500" : "bg-amber-400"}`} />{profile?.verified ? "Verified profile" : "Profile under review"}</div>
              </div>
            </CardHeader>
            <CardContent className="space-y-8 p-6 sm:p-8">
              {/* Store Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24 border-4 border-orange-100 bg-orange-50 shadow-sm">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <AvatarFallback className="bg-primary/10 text-primary text-2xl font-bold">
                      {formData.storeName?.charAt(0) || "V"}
                    </AvatarFallback>
                  )}
                </Avatar>
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <Button 
                      variant="outline" 
                      className="h-10 border-[#FF5500] font-bold text-[#FF5500] hover:bg-orange-50"
                      onClick={() => document.getElementById('logo-upload')?.click()}
                      disabled={loading}
                    >
                      <Upload className="w-4 h-4 mr-2" />
                      {loading ? "Uploading..." : "Upload Logo"}
                    </Button>
                    <input 
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file || !user) return;
                        
                        setLoading(true);
                        try {
                          const fileExt = file.name.split('.').pop();
                          const fileName = `${user.id}_logo_${Math.random()}.${fileExt}`;
                          const filePath = `vendors/${fileName}`;

                          const { error: uploadError } = await supabase.storage
                            .from('site-assets')
                            .upload(filePath, file);

                          if (uploadError) throw uploadError;

                          const { data: { publicUrl } } = supabase.storage
                            .from('site-assets')
                            .getPublicUrl(filePath);

                          const { error: updateError } = await supabase
                            .from('profiles')
                            .update({ avatar_url: publicUrl } as any)
                            .eq('user_id', user.id);

                          if (updateError) throw updateError;
                          
                          await refreshProfile();
                          toast.success("Logo updated successfully!");
                        } catch (error: any) {
                          toast.error(`Upload failed: ${error.message}`);
                        } finally {
                          setLoading(false);
                        }
                      }}
                    />
                    {profile?.avatar_url && (
                      <Button 
                        variant="ghost" 
                        className="h-9 text-destructive hover:text-destructive"
                        onClick={async () => {
                          if (!user) return;
                          setLoading(true);
                          try {
                            const { error } = await supabase
                              .from('profiles')
                              .update({ avatar_url: null } as any)
                              .eq('user_id', user.id);
                            if (error) throw error;
                            await refreshProfile();
                            toast.success("Logo removed");
                          } catch (error: any) {
                            toast.error(error.message);
                          } finally {
                            setLoading(false);
                          }
                        }}
                      >
                        Remove
                      </Button>
                    )}
                  </div>
                  <p className="text-xs leading-5 text-slate-500">Use a clear square logo so buyers can recognize your store at a glance. PNG or JPG, max 1MB.</p>
                </div>
              </div>

              {/* Store Banner */}
              <div className="space-y-3">
                <Label>Store Banner</Label>
                <div className="h-36 overflow-hidden border border-slate-200 bg-slate-50 shadow-inner sm:h-40">
                  {profile?.banner_url ? (
                    <img src={profile.banner_url} alt="Store banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,#f8fafc_25%,#eef2f7_25%,#eef2f7_50%,#f8fafc_50%,#f8fafc_75%,#eef2f7_75%)] bg-[length:24px_24px] text-sm font-medium text-slate-500">
                      No banner uploaded yet
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    className="h-9"
                    onClick={() => document.getElementById('banner-upload')?.click()}
                    disabled={bannerLoading}
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {bannerLoading ? "Uploading..." : "Upload Banner"}
                  </Button>
                  <input
                    id="banner-upload"
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={async (e) => {
                      const file = e.target.files?.[0];
                      if (!file || !user) return;

                      setBannerLoading(true);
                      try {
                        const fileExt = file.name.split('.').pop();
                        const fileName = `${user.id}_banner_${Math.random()}.${fileExt}`;
                        const filePath = `vendors/${fileName}`;

                        const { error: uploadError } = await supabase.storage
                          .from('site-assets')
                          .upload(filePath, file);

                        if (uploadError) throw uploadError;

                        const { data: { publicUrl } } = supabase.storage
                          .from('site-assets')
                          .getPublicUrl(filePath);

                        const { error: updateError } = await supabase
                          .from('profiles')
                          .update({ banner_url: publicUrl } as any)
                          .eq('user_id', user.id);

                        if (updateError) throw updateError;

                        await refreshProfile();
                        toast.success("Banner updated successfully!");
                      } catch (error: any) {
                        toast.error(`Upload failed: ${error.message}`);
                      } finally {
                        setBannerLoading(false);
                      }
                    }}
                  />
                  {profile?.banner_url && (
                    <Button
                      variant="ghost"
                      className="h-9 text-destructive hover:text-destructive"
                      onClick={async () => {
                        if (!user) return;
                        setBannerLoading(true);
                        try {
                          const { error } = await supabase
                            .from('profiles')
                            .update({ banner_url: null } as any)
                            .eq('user_id', user.id);
                          if (error) throw error;
                          await refreshProfile();
                          toast.success("Banner removed");
                        } catch (error: any) {
                          toast.error(error.message);
                        } finally {
                          setBannerLoading(false);
                        }
                      }}
                    >
                      Remove
                    </Button>
                  )}
                </div>
                <p className="text-xs leading-5 text-slate-500">Shown at the top of your public store page. Recommended size: 1200 × 400px.</p>
              </div>

              <div className="flex flex-wrap items-center gap-2 border-b border-slate-100 pb-8">
                {profile?.verified ? (
                  <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Verified Vendor
                  </Badge>
                ) : (
                  <Badge variant="outline" className="text-muted-foreground">
                    Not yet verified
                  </Badge>
                )}
                {profile?.rating != null && (
                  <Badge variant="outline">★ {profile.rating.toFixed(1)}</Badge>
                )}
              </div>

              <Separator />

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600" htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label className="text-xs font-bold text-slate-600" htmlFor="email">Contact Email (Linked to account)</Label>
                  <Input id="email" type="email" value={formData.email} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs font-bold text-slate-600" htmlFor="description">Store Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campus">Campus location <span className="text-[#FF5500]">*</span></Label>
                  <Select value={formData.campus} onValueChange={(value) => setFormData({ ...formData, campus: value })}>
                    <SelectTrigger id="campus"><SelectValue placeholder="Select the campus you serve" /></SelectTrigger>
                    <SelectContent>
                      {campusDirectory.map((campus) => <SelectItem key={campus.id} value={campus.name}>{campus.name}{campus.city ? ` · ${campus.city}` : ""}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">Buyers will see this location on your public store.</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone Number</Label>
                  <Input
                    id="phone"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="category">Store Category</Label>
                <Select value={formData.category} onValueChange={(val) => setFormData({ ...formData, category: val })}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select your store's primary category" />
                  </SelectTrigger>
                  <SelectContent>
                    {PRODUCT_CATEGORIES.map((cat) => (
                      <SelectItem key={cat.label} value={cat.label}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />
              <div className="flex flex-col justify-between gap-4 border-t border-slate-200 pt-6 sm:flex-row sm:items-center"><p className="text-xs leading-5 text-slate-500">Your changes update the public storefront after saving.</p><Button onClick={handleSave} disabled={loading} className="h-11 bg-[#FF5500] px-6 font-black text-white shadow-sm hover:bg-[#e54a00]">{loading ? "Saving..." : "Save Store Profile"}</Button></div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Preferences</CardTitle>
              <CardDescription>Choose how you want to be notified</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Order Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when you receive a new order</p>
                </div>
                <Switch
                  checked={notificationPreferences.new_order}
                  onCheckedChange={(v) => updateNotificationPreference("new_order", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when products are running low</p>
                </div>
                <Switch
                  checked={notificationPreferences.low_stock}
                  onCheckedChange={(v) => updateNotificationPreference("low_stock", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Customer Messages</p>
                  <p className="text-sm text-muted-foreground">Get notified when customers message you</p>
                </div>
                <Switch
                  checked={notificationPreferences.customer_messages}
                  onCheckedChange={(v) => updateNotificationPreference("customer_messages", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Sales Report</p>
                  <p className="text-sm text-muted-foreground">Receive a weekly summary of your sales</p>
                </div>
                <Switch
                  checked={notificationPreferences.weekly_report}
                  onCheckedChange={(v) => updateNotificationPreference("weekly_report", v)}
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Product Reviews</p>
                  <p className="text-sm text-muted-foreground">Get notified when customers leave reviews</p>
                </div>
                <Switch
                  checked={notificationPreferences.product_reviews}
                  onCheckedChange={(v) => updateNotificationPreference("product_reviews", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="payments">
          <Card>
            <CardHeader>
              <CardTitle>Payment Settings</CardTitle>
              <CardDescription>Manage your payout preferences</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-muted-foreground">Available Balance</span>
                  <span className="text-2xl font-bold">GH₵{(balance?.balance || 0).toFixed(2)}</span>
                </div>
                <Button
                  className="w-full"
                  disabled={!balance?.balance || hasPendingPayout || paymentMethods.length === 0 || requestPayoutMutation.isPending}
                  onClick={() => requestPayoutMutation.mutate()}
                >
                  {hasPendingPayout ? "Payout Pending" : requestPayoutMutation.isPending ? "Requesting..." : "Request Payout"}
                </Button>
                {paymentMethods.length === 0 && (
                  <p className="text-xs text-muted-foreground mt-2">Add a payment method below before requesting a payout.</p>
                )}
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Payout Method</Label>
                <div className="grid gap-3">
                  {paymentMethods.length === 0 ? (
                    <p className="text-sm text-muted-foreground">No payment methods added yet.</p>
                  ) : (
                    paymentMethods.map((method: any) => (
                      <div key={method.id} className={`p-4 rounded-lg border-2 ${method.is_default ? "border-primary bg-primary/5" : "border-border"}`}>
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center text-primary">
                              {method.type === "momo" ? <Smartphone className="w-5 h-5" /> : <Landmark className="w-5 h-5" />}
                            </div>
                            <div>
                              <p className="font-medium">{method.label}</p>
                              <p className="text-sm text-muted-foreground">
                                {method.type === "momo" ? "Mobile Money" : "Bank Account"} · **** {String(method.details?.accountNumber || "").slice(-4)}
                              </p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => deletePaymentMethodMutation.mutate(method.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
                <Button variant="outline" className="mt-2" onClick={() => setIsAddPaymentOpen(true)}>Add Payment Method</Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Payout Schedule</Label>
                <p className="text-sm text-muted-foreground">Payouts are reviewed and processed by the Unimall team, typically within a few business days.</p>
              </div>

              {payoutRequests.length > 0 && (
                <>
                  <Separator />
                  <div className="space-y-2">
                    <Label>Recent Payout Requests</Label>
                    <div className="space-y-2">
                      {payoutRequests.slice(0, 5).map((p: any) => (
                        <div key={p.id} className="flex items-center justify-between text-sm p-3 rounded-lg bg-muted/30">
                          <div>
                            <p className="font-medium">GH₵{Number(p.amount).toFixed(2)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(p.requested_at).toLocaleDateString()}</p>
                          </div>
                          <Badge
                            variant="outline"
                            className={
                              p.status === "paid" ? "bg-primary/10 text-primary border-primary/20" :
                              p.status === "rejected" ? "bg-destructive/10 text-destructive border-destructive/20" :
                              "bg-muted text-muted-foreground"
                            }
                          >
                            {p.status}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage your account security</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Add an extra layer of security</p>
                </div>
                <Switch
                  checked={notificationPreferences.two_factor}
                  onCheckedChange={(v) => updateNotificationPreference("two_factor", v)}
                />
              </div>
              <Separator />
              <div className="space-y-4">
                <Label>Change Password</Label>
                <div className="space-y-3">
                  <Input
                    type="password"
                    placeholder="Current password"
                    value={passwordForm.current}
                    onChange={(e) => setPasswordForm({ ...passwordForm, current: e.target.value })}
                  />
                  <Input
                    type="password"
                    placeholder="New password"
                    value={passwordForm.next}
                    onChange={(e) => setPasswordForm({ ...passwordForm, next: e.target.value })}
                  />
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={passwordForm.confirm}
                    onChange={(e) => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={passwordLoading}>
                  {passwordLoading ? "Updating..." : "Update Password"}
                </Button>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Notifications</p>
                  <p className="text-sm text-muted-foreground">Get notified of new login attempts</p>
                </div>
                <Switch
                  checked={notificationPreferences.login_notifications}
                  onCheckedChange={(v) => updateNotificationPreference("login_notifications", v)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

      <Dialog open={isAddPaymentOpen} onOpenChange={setIsAddPaymentOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Payment Method</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={paymentMethodForm.type}
                onValueChange={(val: "momo" | "bank") => setPaymentMethodForm({ ...paymentMethodForm, type: val })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="momo">Mobile Money</SelectItem>
                  <SelectItem value="bank">Bank Account</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-label">Label (e.g. MTN MoMo, GCB Bank)</Label>
              <Input
                id="pm-label"
                value={paymentMethodForm.label}
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, label: e.target.value })}
                placeholder="MTN MoMo"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="pm-account">{paymentMethodForm.type === "momo" ? "Mobile Money Number" : "Account Number"}</Label>
              <Input
                id="pm-account"
                value={paymentMethodForm.accountNumber}
                onChange={(e) => setPaymentMethodForm({ ...paymentMethodForm, accountNumber: e.target.value })}
                placeholder="024XXXXXXX"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPaymentOpen(false)}>Cancel</Button>
            <Button
              disabled={!paymentMethodForm.label || !paymentMethodForm.accountNumber || addPaymentMethodMutation.isPending}
              onClick={() => addPaymentMethodMutation.mutate()}
            >
              {addPaymentMethodMutation.isPending ? "Saving..." : "Add Method"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorSettings;
