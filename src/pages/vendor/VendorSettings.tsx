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
import { toast } from "sonner";
import { CheckCircle, Upload } from "lucide-react";

import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { PRODUCT_CATEGORIES } from "@/lib/categories";

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
      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList>
          <TabsTrigger value="profile">Store Profile</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
          <TabsTrigger value="payments">Payments</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Store Profile</CardTitle>
              <CardDescription>Manage your store information visible to customers</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Store Avatar */}
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20">
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
                      className="h-9"
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
                  <p className="text-xs text-muted-foreground">Recommended: 200x200px, PNG or JPG (Max 1MB)</p>
                </div>
              </div>

              {/* Store Banner */}
              <div className="space-y-3">
                <Label>Store Banner</Label>
                <div className="h-32 rounded-lg overflow-hidden bg-muted border">
                  {profile?.banner_url ? (
                    <img src={profile.banner_url} alt="Store banner" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">
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
                <p className="text-xs text-muted-foreground">Shown at the top of your public store page. Recommended: 1200x400px.</p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
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
                  <Label htmlFor="storeName">Store Name</Label>
                  <Input
                    id="storeName"
                    value={formData.storeName}
                    onChange={(e) => setFormData({ ...formData, storeName: e.target.value })}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Contact Email (Linked to account)</Label>
                  <Input id="email" type="email" value={formData.email} disabled />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Store Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="campus">Campus</Label>
                  <Input
                    id="campus"
                    value={formData.campus}
                    onChange={(e) => setFormData({ ...formData, campus: e.target.value })}
                  />
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
              <Button onClick={handleSave} disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
              </Button>
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
                  <span className="text-2xl font-bold">GH₵0.00</span>
                </div>
                <Button className="w-full" disabled>Request Payout</Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Payout Method</Label>
                <div className="grid gap-3">
                  <div className="p-4 rounded-lg border-2 border-primary bg-primary/5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                        💳
                      </div>
                      <div>
                        <p className="font-medium">Mobile Money</p>
                        <p className="text-sm text-muted-foreground">MTN - **** 4567</p>
                      </div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="mt-2">Add Payment Method</Button>
              </div>

              <Separator />

              <div className="space-y-2">
                <Label>Payout Schedule</Label>
                <p className="text-sm text-muted-foreground">Payouts are processed weekly on Fridays</p>
              </div>
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
    </DashboardLayout>
  );
};

export default VendorSettings;
