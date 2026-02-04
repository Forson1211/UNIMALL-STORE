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
  Palette
} from "lucide-react";

const AdminSettings = () => {
  const handleSave = () => {
    toast.success("Settings saved successfully");
  };

  return (
    <DashboardLayout type="admin" title="Settings">
      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:grid-cols-8 gap-2">
          <TabsTrigger value="general">
            <Settings className="w-4 h-4 mr-2" />
            General
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="w-4 h-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="security">
            <Shield className="w-4 h-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="platform">
            <Globe className="w-4 h-4 mr-2" />
            Platform
          </TabsTrigger>
          <TabsTrigger value="maintenance">
            <Wrench className="w-4 h-4 mr-2" />
            Maintenance
          </TabsTrigger>
          <TabsTrigger value="backup">
            <Database className="w-4 h-4 mr-2" />
            Backup
          </TabsTrigger>
          <TabsTrigger value="system">
            <Activity className="w-4 h-4 mr-2" />
            System
          </TabsTrigger>
          <TabsTrigger value="api">
            <Key className="w-4 h-4 mr-2" />
            API
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
      </Tabs>
    </DashboardLayout>
  );
};

export default AdminSettings;
