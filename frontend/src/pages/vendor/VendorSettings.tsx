import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select } from "@/components/ui/select";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import { Store } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { useAuth } from "@/contexts/AuthContext";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { financeRequest, api } from "@/integrations/api/client";
import { vendorService } from "@/services/vendorService";
import { useState, useEffect, useRef } from "react";

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
  customer_messages: false,
  weekly_report: false,
  product_reviews: true,
  two_factor: false,
  login_notifications: false,
};

const VendorSettings = () => {
  const { user, profile, refreshProfile, updateProfile, vendorStatus } = useAuth();
  const canSell = vendorStatus === 'approved';
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
  const { data: finance, error: balanceError } = useQuery({
    queryKey: ["finance-summary", "vendor"],
    queryFn: () => financeRequest<{ eligible_pesewas: number; reserved_pesewas: number; payout_account: { masked_account: string } | null }>("/vendor/finance/summary"),
    enabled: !!user && canSell, refetchInterval: 15000,
  });
  const balance = (finance?.eligible_pesewas || 0) / 100;
  const hasPendingPayout = (finance?.reserved_pesewas || 0) > 0;
  const paymentMethods = finance?.payout_account ? [finance.payout_account] : [];

  const notificationPreferences = {
    ...DEFAULT_NOTIFICATION_PREFERENCES,
    ...(profile?.notification_preferences || {}),
  };

  const initializedFor = useRef<string | null>(null);
  useEffect(() => {
    if (profile && user && initializedFor.current !== user.id) {
      initializedFor.current = user.id;
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
      const { error } = await updateProfile({
          notification_preferences: { ...notificationPreferences, [key]: value },
        });
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
      const { error } = await updateProfile({
          store_name: formData.storeName,
          store_description: formData.description,
          phone: formData.phone,
          campus: formData.campus,
          store_category: formData.category,
          updated_at: new Date().toISOString()
        } as any);

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
    if (passwordForm.next.length < 8) {
      toast.error("New password must be at least 8 characters");
      return;
    }
    if (passwordForm.next !== passwordForm.confirm) {
      toast.error("New passwords do not match");
      return;
    }

    setPasswordLoading(true);
    try {
      const { error: reauthError } = await api.auth.signInWithPassword({
        email: user.email,
        password: passwordForm.current,
      });
      if (reauthError) {
        toast.error("Current password is incorrect");
        return;
      }

      const { error: updateError } = await api.auth.updateUser({ password: passwordForm.next });
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
              <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-orange-200"><Store className="h-4 w-4" /> Seller workspace</div>
              <h1 className="text-3xl font-black tracking-[-0.035em] sm:text-4xl">Earnings & settings</h1>
              <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-200">Keep your campus storefront polished, your payouts ready, and your seller account secure.</p>
            </div>
            <div className="flex items-center gap-3 border border-white/15 bg-slate-950/20 px-4 py-3 text-sm"><span className={`h-2.5 w-2.5 ${profile?.verified ? "bg-emerald-400" : "bg-amber-300"}`} /><span className="font-bold">{profile?.verified ? "Verified seller" : "Verification in progress"}</span></div>
          </div>
          <div className="relative mt-7 grid gap-px overflow-hidden border border-white/10 bg-white/10 sm:grid-cols-3">
            <div className="bg-slate-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Available balance</p><p className="mt-2 text-2xl font-black">GH₵{Number(balance || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</p><p className="mt-1 text-xs text-slate-300">Ready for payout</p></div>
            <div className="bg-slate-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Payment methods</p><p className="mt-2 text-2xl font-black">{paymentMethods.length}</p><p className="mt-1 text-xs text-slate-300">Configured for settlement</p></div>
            <div className="bg-slate-950/20 p-4"><p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-300">Payout status</p><p className="mt-2 text-2xl font-black">{hasPendingPayout ? "Pending" : "Ready"}</p><p className="mt-1 text-xs text-slate-300">{hasPendingPayout ? "Being reviewed by Unimall" : "No pending request"}</p></div>
          </div>
        </section>

        {/* ── Direct Shortcut to Store Profile ── */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/20 border border-orange-200/80 dark:border-orange-900/40">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#FF5500] text-white flex items-center justify-center shrink-0 shadow-sm">
              <Store className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Looking to customize your public storefront?</h3>
              <p className="text-xs text-gray-600 dark:text-gray-400">Edit your store logo, cover banner, description, and WhatsApp contact in the dedicated Store Profile page.</p>
            </div>
          </div>
          <Link to="/vendor/profile">
            <Button className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs h-9 px-4 shrink-0 shadow-sm">
              Go to Store Profile →
            </Button>
          </Link>
        </div>

        <Tabs defaultValue="payments" className="space-y-6">
          <TabsList className="grid h-auto w-full grid-cols-3 gap-1 border border-slate-200 bg-slate-100 p-1">
            <TabsTrigger className="py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm sm:text-sm" value="payments">Payments & Payouts</TabsTrigger>
            <TabsTrigger className="py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm sm:text-sm" value="notifications">Notification Preferences</TabsTrigger>
            <TabsTrigger className="py-2.5 text-xs font-bold data-[state=active]:bg-white data-[state=active]:text-[#FF5500] data-[state=active]:shadow-sm sm:text-sm" value="security">Account & Security</TabsTrigger>
          </TabsList>

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
                  <p className="text-sm text-muted-foreground">Customer messaging alerts are not yet available.</p>
                </div>
                <Switch
                  checked={false}
                  disabled
                />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Sales Report</p>
                  <p className="text-sm text-muted-foreground">Weekly report delivery is not yet available.</p>
                </div>
                <Switch
                  checked={false}
                  disabled
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

        <TabsContent value="payments"><Card><CardHeader><CardTitle>Earnings & Payouts</CardTitle><CardDescription>View pending, eligible and reserved earnings, Friday payout history, and your verified payout account.</CardDescription></CardHeader><CardContent className="space-y-4">
          {balanceError && <p role="alert">{balanceError.message}</p>}
          <p>Eligible earnings: GHS {balance.toFixed(2)}</p><p className="text-sm text-muted-foreground">Minimum GHS 20. Buyer confirmation and the delivery waiting period apply. COD cash is separate from online earnings.</p>
          <Button asChild disabled={!canSell}><Link to="/vendor/finance">Manage earnings and payout account</Link></Button>
        </CardContent></Card></TabsContent>

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
                  <p className="text-sm text-muted-foreground">Authenticator enrollment is not yet available.</p>
                </div>
                <Switch
                  checked={false}
                  disabled
                  aria-label="Two-factor authentication setup is not yet available"
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
                  <p className="text-sm text-muted-foreground">Login email alerts are not yet available.</p>
                </div>
                <Switch
                  checked={false}
                  disabled
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        </Tabs>
      </div>

    </DashboardLayout>
  );
};

export default VendorSettings;
