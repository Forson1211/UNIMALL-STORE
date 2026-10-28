import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Link } from "react-router-dom";
import {
  Settings,
  Bell,
  Shield,
  Globe,
  Database,
  Activity,
  Key,
  Wrench,
  Palette,
  Eye,
  RefreshCw,
  Search,
  Loader2
} from "lucide-react";
import { api } from "@/integrations/api/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { exportMarketplaceData } from "@/services/dataExportService";

const AdminSettings = () => {
  const { getSetting, updateSettings } = useSiteSettingsContext();

  // General tab
  const [platformName, setPlatformName] = useState(() => getSetting("site_name", "Unimall"));
  const [supportEmail, setSupportEmail] = useState(() => getSetting("support_email", ""));
  const [siteDescription, setSiteDescription] = useState(() => getSetting("site_description", ""));
  const [isSavingGeneral, setIsSavingGeneral] = useState(false);

  // Notifications tab
  const [notifyNewOrders, setNotifyNewOrders] = useState(() => getSetting("notify_new_orders", true));
  const [notifyVendorApplications, setNotifyVendorApplications] = useState(() => getSetting("notify_vendor_applications", true));
  const [notifyLowStock, setNotifyLowStock] = useState(() => getSetting("notify_low_stock", true));
  const [notifyWeeklyReports, setNotifyWeeklyReports] = useState(() => getSetting("notify_weekly_reports", false));
  const [notifyUserReports, setNotifyUserReports] = useState(() => getSetting("notify_user_reports", true));
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);

  // Security tab (toggles only -- password change is a separate auth action, not a site setting)
  const [require2fa, setRequire2fa] = useState(() => getSetting("require_2fa_admin", false));
  const [sessionTimeoutEnabled, setSessionTimeoutEnabled] = useState(() => getSetting("session_timeout_enabled", true));
  const [loginAttemptLimitEnabled, setLoginAttemptLimitEnabled] = useState(() => getSetting("login_attempt_limit_enabled", true));
  const [isSavingSecurity, setIsSavingSecurity] = useState(false);

  // Platform tab
  const [allowVendorRegistration, setAllowVendorRegistration] = useState(() => getSetting("allow_vendor_registration", true));
  const [requireVendorVerification, setRequireVendorVerification] = useState(() => getSetting("require_vendor_verification", true));
  const [reviewModerationEnabled, setReviewModerationEnabled] = useState(() => getSetting("review_moderation_enabled", false));
  const [commissionRate, setCommissionRate] = useState(() => String(getSetting("commission_rate", 10)));
  const [minimumOrderValue, setMinimumOrderValue] = useState(() => String(getSetting("minimum_order_value", 10)));
  const [isSavingPlatform, setIsSavingPlatform] = useState(false);

  // Maintenance tab
  const [maintenanceMode, setMaintenanceMode] = useState(() => getSetting("maintenance_mode", false));
  const [maintenanceMessage, setMaintenanceMessage] = useState(() => getSetting("maintenance_message", "We're performing scheduled maintenance. We'll be back soon!"));
  const [maintenanceEstimatedTime, setMaintenanceEstimatedTime] = useState(() => getSetting("maintenance_estimated_completion", ""));
  const [maintenanceAllowAdminAccess, setMaintenanceAllowAdminAccess] = useState(() => getSetting("maintenance_allow_admin_access", true));
  const [isSavingMaintenance, setIsSavingMaintenance] = useState(false);

  const handleSaveGeneral = async () => {
    setIsSavingGeneral(true);
    const result = await updateSettings({
      site_name: { value: platformName, category: "general" },
      support_email: { value: supportEmail, category: "general" },
      site_description: { value: siteDescription, category: "general" },
    });
    setIsSavingGeneral(false);
    if (result?.success !== false) toast.success("Settings saved successfully");
  };

  const handleSaveNotifications = async () => {
    setIsSavingNotifications(true);
    const result = await updateSettings({
      notify_new_orders: { value: notifyNewOrders, category: "notifications" },
      notify_vendor_applications: { value: notifyVendorApplications, category: "notifications" },
      notify_low_stock: { value: notifyLowStock, category: "notifications" },
      notify_weekly_reports: { value: notifyWeeklyReports, category: "notifications" },
      notify_user_reports: { value: notifyUserReports, category: "notifications" },
    });
    setIsSavingNotifications(false);
    if (result?.success !== false) toast.success("Notification preferences saved");
  };

  const handleSaveSecurity = async () => {
    setIsSavingSecurity(true);
    const result = await updateSettings({
      require_2fa_admin: { value: require2fa, category: "security" },
      session_timeout_enabled: { value: sessionTimeoutEnabled, category: "security" },
      login_attempt_limit_enabled: { value: loginAttemptLimitEnabled, category: "security" },
    });
    setIsSavingSecurity(false);
    if (result?.success !== false) toast.success("Security settings saved successfully");
  };

  const handleSavePlatform = async () => {
    setIsSavingPlatform(true);
    const result = await updateSettings({
      allow_vendor_registration: { value: allowVendorRegistration, category: "platform" },
      require_vendor_verification: { value: requireVendorVerification, category: "platform" },
      review_moderation_enabled: { value: reviewModerationEnabled, category: "platform" },
      commission_rate: { value: Number(commissionRate) || 0, category: "platform" },
      minimum_order_value: { value: Number(minimumOrderValue) || 0, category: "platform" },
    });
    setIsSavingPlatform(false);
    if (result?.success !== false) toast.success("Platform settings saved successfully");
  };

  const handleSaveMaintenance = async () => {
    setIsSavingMaintenance(true);
    const result = await updateSettings({
      maintenance_mode: { value: maintenanceMode, category: "maintenance" },
      maintenance_message: { value: maintenanceMessage, category: "maintenance" },
      maintenance_estimated_completion: { value: maintenanceEstimatedTime, category: "maintenance" },
      maintenance_allow_admin_access: { value: maintenanceAllowAdminAccess, category: "maintenance" },
    });
    setIsSavingMaintenance(false);
    if (result?.success !== false) toast.success("Maintenance settings saved successfully");
  };

  const [isExporting, setIsExporting] = useState(false);
  const [lastExport, setLastExport] = useState<string | null>(null);
  const handleBackupNow = async () => {
    if (isExporting) return;
    setIsExporting(true);
    try { setLastExport(await exportMarketplaceData()); toast.success("Marketplace data exported."); }
    catch (error) { toast.error((error as Error).message); }
    finally { setIsExporting(false); }
  };

  // Database Explorer State
  const [explorerTable, setExplorerTable] = useState("profiles");
  const [explorerData, setExplorerData] = useState<any[]>([]);
  const [explorerCount, setExplorerCount] = useState<number | null>(null);
  const [isExplorerLoading, setIsExplorerLoading] = useState(false);
  const [explorerSearch, setExplorerSearch] = useState("");
  const [selectedRowJson, setSelectedRowJson] = useState<any | null>(null);
  const [isRowModalOpen, setIsRowModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  const fetchExplorerData = async (tableName: string, page: number, search: string) => {
    setIsExplorerLoading(true);
    try {
      const from = (page - 1) * itemsPerPage;
      const to = from + itemsPerPage - 1;

      let query = api.from(tableName as any).select("*", { count: "exact" });

      // Apply search filters depending on the table structure
      if (search.trim()) {
        const queryTerm = `%${search.trim()}%`;
        if (tableName === "profiles") {
          query = query.or(`email.ilike.${queryTerm},full_name.ilike.${queryTerm}`);
        } else if (tableName === "products") {
          query = query.or(`name.ilike.${queryTerm},category.ilike.${queryTerm}`);
        } else if (tableName === "orders") {
          query = query.or(`status.ilike.${queryTerm}`);
        } else if (tableName === "campus_news") {
          query = query.or(`title.ilike.${queryTerm},category.ilike.${queryTerm}`);
        } else if (tableName === "user_roles") {
          query = query.or(`role.ilike.${queryTerm}`);
        } else if (tableName === "support_tickets") {
          query = query.or(`subject.ilike.${queryTerm},status.ilike.${queryTerm}`);
        } else if (tableName === "coupons") {
          query = query.or(`code.ilike.${queryTerm}`);
        }
      }

      const { data, count, error } = await query.range(from, to);

      if (error) throw error;

      setExplorerData(data || []);
      setExplorerCount(count);
    } catch (err: any) {
      console.warn(`API query failed for resource ${tableName}:`, err.message);
      setExplorerData([]);
      setExplorerCount(null);
      toast.error("Unable to load " + tableName + ": " + err.message);
    } finally {
      setIsExplorerLoading(false);
    }
  };

  useEffect(() => {
    fetchExplorerData(explorerTable, currentPage, explorerSearch);
  }, [explorerTable, currentPage]);

  const handleExplorerSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchExplorerData(explorerTable, 1, explorerSearch);
  };

  const getTableColumns = (tableName: string) => {
    switch (tableName) {
      case "profiles":
        return ["user_id", "email", "full_name", "phone"];
      case "products":
        return ["id", "name", "price", "category", "vendor_id"];
      case "orders":
        return ["id", "buyer_id", "total_amount", "status"];
      case "order_items":
        return ["id", "order_id", "product_id", "quantity", "price_at_purchase"];
      case "campus_news":
        return ["id", "title", "category", "is_published"];
      case "user_roles":
        return ["user_id", "role", "vendor_status"];
      case "support_tickets":
        return ["id", "subject", "status", "priority"];
      case "system_logs":
        return ["id", "type", "source", "message"];
      case "reviews":
        return ["id", "product_id", "rating", "comment"];
      case "coupons":
        return ["id", "code", "discount_value", "is_active"];
      default:
        if (explorerData.length > 0) {
          return Object.keys(explorerData[0]).slice(0, 5);
        }
        return ["id"];
    }
  };

  return (
    <DashboardLayout type="admin" title="Settings">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="flex flex-wrap h-auto w-full gap-2 p-1 bg-muted/20">
          <TabsTrigger value="general" className="flex-1 min-w-[120px]">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex-1 min-w-[140px]">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security" className="flex-1 min-w-[120px]">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="platform" className="flex-1 min-w-[120px]">
            <Globe className="w-4 h-4 mr-2" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="maintenance" className="flex-1 min-w-[140px]">
            <Wrench className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="backup" className="flex-1 min-w-[120px]">
            <Database className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="system" className="flex-1 min-w-[120px]">
            <Activity className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="api" className="flex-1 min-w-[100px]">
            <Key className="w-4 h-4 mr-2" />
            API
          </TabsTrigger>
          <TabsTrigger value="database" className="flex-1 min-w-[160px]">
            <Database className="w-4 h-4 mr-2" />
            Database Explorer
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>Manage your platform's general configuration</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="platformName">Platform Name</Label>
                  <Input id="platformName" value={platformName} onChange={(e) => setPlatformName(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" value={supportEmail} onChange={(e) => setSupportEmail(e.target.value)} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Platform Description</Label>
                <Input id="description" value={siteDescription} onChange={(e) => setSiteDescription(e.target.value)} />
              </div>

              <Separator />

              <div className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="p-2 bg-primary/10 rounded-lg">
                    <Palette className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium">Site Customization</p>
                    <p className="text-sm text-muted-foreground">
                      Customize branding, colors, and content
                    </p>
                  </div>
                </div>
                <Link to="/admin/site-customization">
                  <Button variant="outline">
                    Customize Site
                  </Button>
                </Link>
              </div>

              <Separator />
              <Button onClick={handleSaveGeneral} disabled={isSavingGeneral}>
                {isSavingGeneral ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
              <CardDescription>Configure how you receive notifications</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Order Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when new orders are placed</p>
                </div>
                <Switch checked={notifyNewOrders} onCheckedChange={setNotifyNewOrders} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Vendor Applications</p>
                  <p className="text-sm text-muted-foreground">Get notified when vendors apply</p>
                </div>
                <Switch checked={notifyVendorApplications} onCheckedChange={setNotifyVendorApplications} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when products are low on stock</p>
                </div>
                <Switch checked={notifyLowStock} onCheckedChange={setNotifyLowStock} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Receive weekly sales and analytics reports</p>
                </div>
                <Switch checked={notifyWeeklyReports} onCheckedChange={setNotifyWeeklyReports} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">User Reports & Disputes</p>
                  <p className="text-sm text-muted-foreground">Get notified about reported content</p>
                </div>
                <Switch checked={notifyUserReports} onCheckedChange={setNotifyUserReports} />
              </div>
              <Separator />
              <Button onClick={handleSaveNotifications} disabled={isSavingNotifications}>
                {isSavingNotifications ? "Saving..." : "Save Notification Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="security">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>Manage platform security options</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Two-Factor Authentication</p>
                  <p className="text-sm text-muted-foreground">Require 2FA for admin accounts</p>
                </div>
                <Switch checked={require2fa} onCheckedChange={setRequire2fa} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
                </div>
                <Switch checked={sessionTimeoutEnabled} onCheckedChange={setSessionTimeoutEnabled} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Attempt Limit</p>
                  <p className="text-sm text-muted-foreground">Lock account after 5 failed attempts</p>
                </div>
                <Switch checked={loginAttemptLimitEnabled} onCheckedChange={setLoginAttemptLimitEnabled} />
              </div>
              <Separator />
              <Button onClick={handleSaveSecurity} disabled={isSavingSecurity}>
                {isSavingSecurity ? "Saving..." : "Update Security Settings"}
              </Button>
              <Separator />
              <div className="space-y-2">
                <Label>Change Password</Label>
                <p className="text-xs text-muted-foreground">Not yet available here — admins can reset their password from the standard login flow.</p>
                <div className="grid gap-4 md:grid-cols-2 opacity-50 pointer-events-none">
                  <Input type="password" placeholder="Current password" disabled />
                  <Input type="password" placeholder="New password" disabled />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="platform">
          <Card>
            <CardHeader>
              <CardTitle>Platform Settings</CardTitle>
              <CardDescription>Configure platform-wide settings</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Vendor Registration</p>
                  <p className="text-sm text-muted-foreground">Allow new vendors to register</p>
                </div>
                <Switch checked={allowVendorRegistration} onCheckedChange={setAllowVendorRegistration} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Vendor Verification</p>
                  <p className="text-sm text-muted-foreground">Vendors must be verified before selling</p>
                </div>
                <Switch checked={requireVendorVerification} onCheckedChange={setRequireVendorVerification} />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Product Review Moderation</p>
                  <p className="text-sm text-muted-foreground">Reviews require approval before publishing</p>
                </div>
                <Switch checked={reviewModerationEnabled} onCheckedChange={setReviewModerationEnabled} />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input type="number" value={commissionRate} onChange={(e) => setCommissionRate(e.target.value)} min="0" max="100" />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order Value (GH₵)</Label>
                  <Input type="number" value={minimumOrderValue} onChange={(e) => setMinimumOrderValue(e.target.value)} min="0" />
                </div>
              </div>
              <Button onClick={handleSavePlatform} disabled={isSavingPlatform}>
                {isSavingPlatform ? "Saving..." : "Save Platform Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: Maintenance Mode Tab */}
        <TabsContent value="maintenance">
          <Card>
            <CardHeader>
              <CardTitle>Maintenance Mode</CardTitle>
              <CardDescription>Control site accessibility for maintenance</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between p-4 border-2 border-dashed rounded-lg">
                <div>
                  <p className="font-medium">Enable Maintenance Mode</p>
                  <p className="text-sm text-muted-foreground">Site will show maintenance page to visitors</p>
                </div>
                <Switch checked={maintenanceMode} onCheckedChange={setMaintenanceMode} />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Input
                  id="maintenanceMessage"
                  value={maintenanceMessage}
                  onChange={(e) => setMaintenanceMessage(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Completion Time</Label>
                <Input
                  id="estimatedTime"
                  type="datetime-local"
                  value={maintenanceEstimatedTime}
                  onChange={(e) => setMaintenanceEstimatedTime(e.target.value)}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Admin Access</p>
                  <p className="text-sm text-muted-foreground">Admins can access site during maintenance</p>
                </div>
                <Switch checked={maintenanceAllowAdminAccess} onCheckedChange={setMaintenanceAllowAdminAccess} />
              </div>
              <Separator />
              <Button onClick={handleSaveMaintenance} disabled={isSavingMaintenance}>
                {isSavingMaintenance ? "Saving..." : "Save Maintenance Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="backup">
          <Card><CardHeader><CardTitle>Marketplace data export</CardTitle><CardDescription>Download your application records as JSON.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">Includes profiles, catalog, orders, payments, reviews, coupons, support and site content. Exported records reflect your current account permissions. Manage full database backups and restoration through your MongoDB administrator.</p>
              <Button onClick={handleBackupNow} disabled={isExporting}>{isExporting ? "Exporting..." : "Download data export"}</Button>
              {lastExport && <p role="status" className="text-sm text-muted-foreground">Last export: {new Date(lastExport).toLocaleString("en-GH", { timeZone: "Africa/Accra" })}</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="system">
          <Card><CardHeader><CardTitle>System activity</CardTitle><CardDescription>Review database records and audit events.</CardDescription></CardHeader>
            <CardContent className="flex gap-3 flex-wrap"><Button asChild variant="outline"><Link to="/admin/logs">View system logs</Link></Button><Button asChild variant="outline"><a href="https://cloud.mongodb.com/" target="_blank" rel="noopener noreferrer">MongoDB Atlas</a></Button></CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="api">
          <Card><CardHeader><CardTitle>Backend connection</CardTitle><CardDescription>Marketplace data is served by the Unimall API.</CardDescription></CardHeader>
            <CardContent className="space-y-4"><p className="text-sm break-all">API: {import.meta.env.VITE_API_URL || "/api"}</p><p className="text-sm text-muted-foreground">Database credentials are managed on the server.</p><Button asChild variant="outline"><a href="https://cloud.mongodb.com/" target="_blank" rel="noopener noreferrer">Open MongoDB Atlas</a></Button></CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="database">
          <Card>
            <CardHeader>
              <CardTitle>Database Explorer</CardTitle>
              <CardDescription>Live read-only access to system tables and records</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="w-full sm:w-[240px]">
                  <Label htmlFor="table-select" className="sr-only">Table</Label>
                  <select
                    id="table-select"
                    value={explorerTable}
                    onChange={(e) => {
                      setExplorerTable(e.target.value);
                      setCurrentPage(1);
                      setExplorerSearch("");
                    }}
                    className="w-full h-10 px-3 py-2 text-sm bg-background border border-input rounded-md focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="profiles">profiles</option>
                    <option value="products">products</option>
                    <option value="orders">orders</option>
                    <option value="order_items">order_items</option>
                    <option value="user_roles">user_roles</option>
                    <option value="campus_news">campus_news</option>
                    <option value="support_tickets">support_tickets</option>
                    <option value="system_logs">system_logs</option>
                    <option value="reviews">reviews</option>
                    <option value="coupons">coupons</option>
                    <option value="site_settings">site_settings</option>
                  </select>
                </div>

                <form onSubmit={handleExplorerSearch} className="flex-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search records..."
                      value={explorerSearch}
                      onChange={(e) => setExplorerSearch(e.target.value)}
                      className="pl-9 h-10"
                    />
                  </div>
                  <Button type="submit">Search</Button>
                </form>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => fetchExplorerData(explorerTable, currentPage, explorerSearch)}
                  disabled={isExplorerLoading}
                  className="h-10 w-10 shrink-0"
                >
                  <RefreshCw className={`w-4 h-4 ${isExplorerLoading ? 'animate-spin' : ''}`} />
                </Button>
              </div>

              <div className="border rounded-lg overflow-x-auto">
                <table className="w-full text-sm text-left border-collapse">
                  <thead className="bg-muted/50 border-b text-xs font-semibold uppercase text-muted-foreground">
                    <tr>
                      {getTableColumns(explorerTable).map((col) => (
                        <th key={col} className="p-3 font-medium">
                          {col.replace(/_/g, " ")}
                        </th>
                      ))}
                      <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {isExplorerLoading ? (
                      <tr>
                        <td colSpan={getTableColumns(explorerTable).length + 1} className="p-8 text-center text-muted-foreground">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                          Loading table records...
                        </td>
                      </tr>
                    ) : explorerData.length === 0 ? (
                      <tr>
                        <td colSpan={getTableColumns(explorerTable).length + 1} className="p-8 text-center text-muted-foreground">
                          No records found in this table.
                        </td>
                      </tr>
                    ) : (
                      explorerData.map((row, idx) => {
                        const cols = getTableColumns(explorerTable);
                        return (
                          <tr key={idx} className="border-b hover:bg-muted/30 transition-colors">
                            {cols.map((col) => {
                              const val = row[col];
                              let displayVal = "";
                              if (val === null || val === undefined) {
                                displayVal = "-";
                              } else if (typeof val === "object") {
                                displayVal = JSON.stringify(val);
                              } else if (typeof val === "boolean") {
                                displayVal = val ? "true" : "false";
                              } else {
                                displayVal = String(val);
                              }
                              return (
                                <td key={col} className="p-3 max-w-[200px] truncate text-muted-foreground font-mono text-xs">
                                  {displayVal}
                                </td>
                              );
                            })}
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setSelectedRowJson(row);
                                  setIsRowModalOpen(true);
                                }}
                                className="h-8 gap-1.5"
                              >
                                <Eye className="w-3.5 h-3.5" />
                                Inspect
                              </Button>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {explorerCount !== null && explorerCount > itemsPerPage && (
                <div className="flex items-center justify-between pt-2">
                  <p className="text-xs text-muted-foreground">
                    Showing {(currentPage - 1) * itemsPerPage + 1} - {Math.min(currentPage * itemsPerPage, explorerCount)} of {explorerCount} records
                  </p>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage === 1}
                      onClick={() => setCurrentPage((c) => c - 1)}
                    >
                      Previous
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      disabled={currentPage * itemsPerPage >= explorerCount}
                      onClick={() => setCurrentPage((c) => c + 1)}
                    >
                      Next
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={isRowModalOpen} onOpenChange={setIsRowModalOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Inspect Record ({explorerTable})</DialogTitle>
            <DialogDescription>Full JSON representation of the database record</DialogDescription>
          </DialogHeader>
          {selectedRowJson && (
            <div className="mt-4">
              <pre className="p-4 bg-zinc-950 text-zinc-100 rounded-lg overflow-x-auto text-xs font-mono border leading-relaxed">
                {JSON.stringify(selectedRowJson, null, 2)}
              </pre>
            </div>
          )}
          <div className="flex justify-end mt-4">
            <Button onClick={() => setIsRowModalOpen(false)}>Close Inspector</Button>
          </div>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default AdminSettings;
