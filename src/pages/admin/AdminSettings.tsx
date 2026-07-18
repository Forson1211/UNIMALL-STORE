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
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

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
    else toast.error("Failed to save settings");
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
    else toast.error("Failed to save notification preferences");
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
    else toast.error("Failed to save security settings");
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
    else toast.error("Failed to save platform settings");
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
    else toast.error("Failed to save maintenance settings");
  };

  const handleBackupNow = () => {
    toast.info("Manual backups aren't available yet — coming soon.");
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

      let query = supabase.from(tableName as any).select("*", { count: "exact" });

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
      console.warn(`Supabase query failed for table ${tableName}:`, err.message);
      // Fallback: mock data for design preview or when tables are not yet synced
      let mockRows: any[] = [];
      if (tableName === "profiles") {
        mockRows = [
          { user_id: "u1", email: "student1@campus.edu", full_name: "Kofi Mensah", phone: "+23324567890", joined_at: new Date().toISOString() },
          { user_id: "u2", email: "student2@campus.edu", full_name: "Ama Serwaa", phone: "+23324111222", joined_at: new Date().toISOString() },
        ];
      } else if (tableName === "products") {
        mockRows = [
          { id: "p1", name: "Modern Desk Lamp", price: 45.0, category: "Appliances", vendor_id: "v1" },
          { id: "p2", name: "Calculus Textbook", price: 120.0, category: "Books", vendor_id: "v2" },
        ];
      } else if (tableName === "orders") {
        mockRows = [
          { id: "ord-001", buyer_id: "u1", total_amount: 165.0, status: "pending", created_at: new Date().toISOString() },
          { id: "ord-002", buyer_id: "u2", total_amount: 45.0, status: "completed", created_at: new Date().toISOString() },
        ];
      } else {
        mockRows = [
          { id: "rec-1", name: `Mock Record 1 (${tableName})`, description: "Simulated for database visual outline", status: "active" },
          { id: "rec-2", name: `Mock Record 2 (${tableName})`, description: "Simulated for database visual outline", status: "inactive" },
        ];
      }
      setExplorerData(mockRows);
      setExplorerCount(mockRows.length);
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
                  <Input id="platformName" defaultValue="Unimall" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="supportEmail">Support Email</Label>
                  <Input id="supportEmail" type="email" defaultValue="support@campusconnect.com" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Platform Description</Label>
                <Input id="description" defaultValue="Your campus marketplace for students" />
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
              <Button onClick={handleSave}>Save Changes</Button>
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
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">New Vendor Applications</p>
                  <p className="text-sm text-muted-foreground">Get notified when vendors apply</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Low Stock Alerts</p>
                  <p className="text-sm text-muted-foreground">Get notified when products are low on stock</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Weekly Reports</p>
                  <p className="text-sm text-muted-foreground">Receive weekly sales and analytics reports</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">User Reports & Disputes</p>
                  <p className="text-sm text-muted-foreground">Get notified about reported content</p>
                </div>
                <Switch defaultChecked />
              </div>
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
                <Switch />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Session Timeout</p>
                  <p className="text-sm text-muted-foreground">Auto-logout after 30 minutes of inactivity</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Login Attempt Limit</p>
                  <p className="text-sm text-muted-foreground">Lock account after 5 failed attempts</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="space-y-2">
                <Label>Change Password</Label>
                <div className="grid gap-4 md:grid-cols-2">
                  <Input type="password" placeholder="Current password" />
                  <Input type="password" placeholder="New password" />
                </div>
              </div>
              <Button onClick={handleSave}>Update Security Settings</Button>
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
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Require Vendor Verification</p>
                  <p className="text-sm text-muted-foreground">Vendors must be verified before selling</p>
                </div>
                <Switch defaultChecked />
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Product Review Moderation</p>
                  <p className="text-sm text-muted-foreground">Reviews require approval before publishing</p>
                </div>
                <Switch />
              </div>
              <Separator />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Commission Rate (%)</Label>
                  <Input type="number" defaultValue="5" min="0" max="100" />
                </div>
                <div className="space-y-2">
                  <Label>Minimum Order Value ($)</Label>
                  <Input type="number" defaultValue="10" min="0" />
                </div>
              </div>
              <Button onClick={handleSave}>Save Platform Settings</Button>
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
                <Switch />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maintenanceMessage">Maintenance Message</Label>
                <Input
                  id="maintenanceMessage"
                  defaultValue="We're performing scheduled maintenance. We'll be back soon!"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="estimatedTime">Estimated Completion Time</Label>
                <Input id="estimatedTime" type="datetime-local" />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Allow Admin Access</p>
                  <p className="text-sm text-muted-foreground">Admins can access site during maintenance</p>
                </div>
                <Switch defaultChecked />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: Backup & Restore Tab */}
        <TabsContent value="backup">
          <Card>
            <CardHeader>
              <CardTitle>Backup & Restore</CardTitle>
              <CardDescription>Manage database backups</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="p-4 border rounded-lg space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Automatic Backups</p>
                    <p className="text-sm text-muted-foreground">Create daily database backups</p>
                  </div>
                  <Switch defaultChecked />
                </div>
                <div className="flex items-center justify-between">
                  <Label>Backup Frequency</Label>
                  <select className="border rounded px-3 py-2">
                    <option>Daily</option>
                    <option>Weekly</option>
                    <option>Monthly</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-semibold">Recent Backups</h4>
                <div className="space-y-2">
                  {["2024-02-03 10:00 AM", "2024-02-02 10:00 AM", "2024-02-01 10:00 AM"].map((date, i) => (
                    <div key={i} className="flex items-center justify-between p-3 border rounded">
                      <div className="flex items-center gap-3">
                        <Database className="w-4 h-4 text-muted-foreground" />
                        <div>
                          <p className="font-medium text-sm">backup_{date.replace(/[\s:]/g, '_')}.sql</p>
                          <p className="text-xs text-muted-foreground">{date}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm">Download</Button>
                        <Button variant="outline" size="sm">Restore</Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button onClick={handleSave}>Create Manual Backup Now</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: System Health Tab */}
        <TabsContent value="system">
          <Card>
            <CardHeader>
              <CardTitle>System Health</CardTitle>
              <CardDescription>Monitor system performance and health</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Database Status</p>
                    <Badge className="bg-green-500">Healthy</Badge>
                  </div>
                  <p className="text-2xl font-bold">99.9%</p>
                  <p className="text-xs text-muted-foreground">Uptime</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">API Response Time</p>
                    <Badge variant="outline">Normal</Badge>
                  </div>
                  <p className="text-2xl font-bold">142ms</p>
                  <p className="text-xs text-muted-foreground">Average</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Storage Used</p>
                    <Badge variant="outline">56%</Badge>
                  </div>
                  <p className="text-2xl font-bold">5.6GB</p>
                  <p className="text-xs text-muted-foreground">of 10GB</p>
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm font-medium">Active Users</p>
                    <Badge className="bg-blue-500">Live</Badge>
                  </div>
                  <p className="text-2xl font-bold">1,247</p>
                  <p className="text-xs text-muted-foreground">Now online</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">Recent Activity Logs</h4>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {[
                    "User login: admin@example.com",
                    "Product created: iPhone 15 Pro",
                    "Order placed: #ORD-12345",
                    "Vendor approved: Tech Store",
                    "Settings updated: Platform settings"
                  ].map((log, i) => (
                    <div key={i} className="flex items-start gap-2 text-sm p-2 hover:bg-accent rounded">
                      <Activity className="w-4 h-4 mt-0.5 text-muted-foreground" />
                      <div className="flex-1">
                        <p>{log}</p>
                        <p className="text-xs text-muted-foreground">2 minutes ago</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <Button variant="outline" className="w-full">View Full System Logs</Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* NEW: API Management Tab */}
        <TabsContent value="api">
          <Card>
            <CardHeader>
              <CardTitle>API Key Management</CardTitle>
              <CardDescription>Manage API keys for external integrations</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2">
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Production API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">pk_live_••••••••••••4562</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Regenerate</Button>
                    <Button variant="outline" size="sm">Copy</Button>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium">Test API Key</p>
                    <p className="text-sm text-muted-foreground font-mono">pk_test_••••••••••••7891</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm">Regenerate</Button>
                    <Button variant="outline" size="sm">Copy</Button>
                  </div>
                </div>
              </div>

              <Separator />

              <div className="space-y-2">
                <h4 className="font-semibold">API Usage This Month</h4>
                <div className="p-4 border rounded-lg">
                  <p className="text-3xl font-bold">12,547</p>
                  <p className="text-sm text-muted-foreground">requests / 50,000 limit</p>
                  <div className="w-full bg-secondary h-2 rounded-full mt-2">
                    <div className="bg-primary h-2 rounded-full" style={{ width: '25%' }}></div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Enable API Access</p>
                  <p className="text-sm text-muted-foreground">Allow third-party applications to access your data</p>
                </div>
                <Switch defaultChecked />
              </div>

              <Button variant="outline">View API Documentation</Button>
            </CardContent>
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
