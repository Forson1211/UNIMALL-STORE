import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  RefreshCw,
  Search,
  Shield,
  ShieldCheck,
  ShieldAlert,
  ShieldOff,
  Users,
  Store,
  Package,
  ShoppingCart,
  FileText,
  MessageSquare,
  BarChart3,
  ChevronDown,
  UserX,
  Crown,
  Headphones,
  Tag,
  Info,
  Check,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────────────────

interface User {
  user_id: string;
  email: string;
  joined_at: string;
  full_name: string | null;
  phone: string | null;
  address: string | null;
  store_name: string | null;
  role: string;
  vendor_status: string | null;
  total_orders_as_buyer: number;
  total_products_as_vendor: number;
}

// ─── Role Definitions ────────────────────────────────────────────────────────

const ROLE_CONFIG: Record<
  string,
  {
    label: string;
    description: string;
    icon: React.ElementType;
    color: string;
    bgColor: string;
    borderColor: string;
    permissions: string[];
  }
> = {
  admin: {
    label: "Admin",
    description: "Full control over the entire platform",
    icon: Crown,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
    borderColor: "border-purple-500/30",
    permissions: [
      "All permissions",
      "User & role management",
      "Platform settings",
      "Financial data",
      "Delete operations",
    ],
  },
  moderator: {
    label: "Moderator",
    description: "Reviews content and manages community standards",
    icon: ShieldCheck,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
    borderColor: "border-blue-500/30",
    permissions: [
      "View all sections",
      "Approve/reject content",
      "Suspend vendors",
      "Manage reviews",
      "View reports",
    ],
  },
  vendor_manager: {
    label: "Vendor Manager",
    description: "Handles vendor onboarding, approvals & store health",
    icon: Store,
    color: "text-amber-600",
    bgColor: "bg-amber-500/10",
    borderColor: "border-amber-500/30",
    permissions: [
      "Vendor approval/suspension",
      "View vendor profiles",
      "Manage vendor products",
      "Vendor analytics",
    ],
  },
  order_manager: {
    label: "Order Manager",
    description: "Manages orders, fulfilment and transaction records",
    icon: ShoppingCart,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
    borderColor: "border-green-500/30",
    permissions: [
      "View & manage orders",
      "Update order status",
      "View transactions",
      "Process refunds",
    ],
  },
  content_manager: {
    label: "Content Manager",
    description: "Manages news, coupons, banners and site content",
    icon: FileText,
    color: "text-pink-600",
    bgColor: "bg-pink-500/10",
    borderColor: "border-pink-500/30",
    permissions: [
      "Content management",
      "Create/edit news",
      "Manage coupons",
      "Site customization",
    ],
  },
  support_agent: {
    label: "Support Agent",
    description: "Handles customer messages and support tickets",
    icon: Headphones,
    color: "text-cyan-600",
    bgColor: "bg-cyan-500/10",
    borderColor: "border-cyan-500/30",
    permissions: [
      "View messages",
      "Reply to customers",
      "Manage support tickets",
      "View user profiles",
    ],
  },
  vendor: {
    label: "Vendor",
    description: "Sells products through the marketplace",
    icon: Package,
    color: "text-orange-600",
    bgColor: "bg-orange-500/10",
    borderColor: "border-orange-500/30",
    permissions: [
      "Manage own products",
      "View own orders",
      "Vendor analytics",
      "Store settings",
    ],
  },
  buyer: {
    label: "Buyer",
    description: "Standard marketplace customer account",
    icon: ShoppingCart,
    color: "text-slate-600",
    bgColor: "bg-slate-500/10",
    borderColor: "border-slate-500/30",
    permissions: [
      "Browse products",
      "Place orders",
      "Manage wishlist",
      "Write reviews",
    ],
  },
};

const STAFF_ROLES = [
  "admin",
  "moderator",
  "vendor_manager",
  "order_manager",
  "content_manager",
  "support_agent",
];
const ALL_ROLES = [...STAFF_ROLES, "vendor", "buyer"];

// ─── Helpers ─────────────────────────────────────────────────────────────────

function RoleBadge({ role, size = "sm" }: { role: string; size?: "sm" | "lg" }) {
  const config = ROLE_CONFIG[role] ?? ROLE_CONFIG["buyer"];
  const Icon = config.icon;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border font-medium",
        config.bgColor,
        config.borderColor,
        config.color,
        size === "sm" ? "px-2.5 py-0.5 text-xs" : "px-3 py-1 text-sm"
      )}
    >
      <Icon className={size === "sm" ? "w-3 h-3" : "w-4 h-4"} />
      {config.label}
    </span>
  );
}

// ─── Role Assign Dialog ───────────────────────────────────────────────────────

function RoleAssignDialog({
  open,
  onClose,
  user,
  onAssign,
  isPending,
}: {
  open: boolean;
  onClose: () => void;
  user: User | null;
  onAssign: (userId: string, role: string) => void;
  isPending: boolean;
}) {
  const [selected, setSelected] = useState<string>(user?.role ?? "buyer");

  if (!user) return null;

  const selectedConfig = ROLE_CONFIG[selected] ?? ROLE_CONFIG["buyer"];
  const SelectedIcon = selectedConfig.icon;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-xl flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary" />
            Assign Role
          </DialogTitle>
          <DialogDescription>
            Choose a role for{" "}
            <span className="font-semibold text-foreground">
              {user.full_name || user.email}
            </span>
            . This controls which parts of the admin panel they can access.
          </DialogDescription>
        </DialogHeader>

        {/* User info strip */}
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-xl border border-border">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
              {(user.full_name || user.email).charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <p className="font-medium text-sm truncate">{user.full_name || "No Name"}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <RoleBadge role={user.role} />
        </div>

        {/* Role Grid */}
        <div className="space-y-2">
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">
            Select Role
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {ALL_ROLES.map((r) => {
              const cfg = ROLE_CONFIG[r]!;
              const Icon = cfg.icon;
              const isSelected = selected === r;
              const isCurrent = user.role === r;
              return (
                <button
                  key={r}
                  onClick={() => setSelected(r)}
                  className={cn(
                    "flex items-start gap-3 p-3 rounded-xl border text-left transition-all duration-200",
                    isSelected
                      ? `${cfg.bgColor} ${cfg.borderColor} ring-2 ring-primary/20`
                      : "bg-card border-border hover:bg-muted/50"
                  )}
                >
                  <div
                    className={cn(
                      "mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center shrink-0",
                      cfg.bgColor
                    )}
                  >
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{cfg.label}</span>
                      {isCurrent && (
                        <span className="text-xs bg-primary/10 text-primary px-1.5 py-0.5 rounded-full">
                          Current
                        </span>
                      )}
                      {isSelected && !isCurrent && (
                        <Check className="w-3.5 h-3.5 text-primary ml-auto" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-snug">
                      {cfg.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Permissions preview */}
        <div
          className={cn(
            "rounded-xl border p-4 space-y-3 transition-all",
            selectedConfig.bgColor,
            selectedConfig.borderColor
          )}
        >
          <div className="flex items-center gap-2">
            <SelectedIcon className={cn("w-4 h-4", selectedConfig.color)} />
            <span className={cn("text-sm font-semibold", selectedConfig.color)}>
              {selectedConfig.label} Permissions
            </span>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedConfig.permissions.map((perm) => (
              <span
                key={perm}
                className={cn(
                  "inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-background/60 border",
                  selectedConfig.borderColor,
                  selectedConfig.color
                )}
              >
                <Check className="w-3 h-3" />
                {perm}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-2 pt-2">
          <Button variant="outline" onClick={onClose} disabled={isPending}>
            Cancel
          </Button>
          <Button
            onClick={() => onAssign(user.user_id, selected)}
            disabled={isPending || selected === user.role}
            className="gap-2"
          >
            {isPending ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Shield className="w-4 h-4" />
            )}
            {isPending ? "Assigning..." : "Assign Role"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

const AdminUsers = () => {
  const { role: currentUserRole } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState("");
  const [filterRole, setFilterRole] = useState<string>("all");
  const [roleDialogUser, setRoleDialogUser] = useState<User | null>(null);

  // Fetch users
  const { data: users = [], isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("admin_users_view" as any)
        .select("*")
        .order("joined_at", { ascending: false }) as any);
      if (error) throw error;
      return data as User[];
    },
    refetchInterval: 30000,
  });

  // Assign role mutation
  const assignRoleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: string }) => {
      const { error } = await (supabase.rpc as any)("admin_assign_role", {
        _target_user_id: userId,
        _new_role: newRole,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      setRoleDialogUser(null);
      toast({
        title: "Role Updated",
        description: "The user's role has been successfully updated.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message || "Failed to update role.",
        variant: "destructive",
      });
    },
  });

  // Deactivate user mutation (reset to buyer)
  const deactivateMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await (supabase.rpc as any)("admin_deactivate_user", {
        _target_user_id: userId,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "User Deactivated",
        description: "User role has been reset to Buyer.",
      });
    },
    onError: (err: Error) => {
      toast({
        title: "Error",
        description: err.message,
        variant: "destructive",
      });
    },
  });

  // Filtered + searched users
  const filtered = users.filter((u) => {
    const matchSearch =
      !search ||
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = filterRole === "all" || u.role === filterRole;
    return matchSearch && matchRole;
  });

  // Stats
  const roleCounts = users.reduce<Record<string, number>>((acc, u) => {
    acc[u.role] = (acc[u.role] ?? 0) + 1;
    return acc;
  }, {});

  if (isLoading) {
    return (
      <DashboardLayout type="admin" title="Users">
        <div className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin" title="Users">
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold">User Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Assign staff roles to control access to each section of the admin panel
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}
            className="gap-2 self-start"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>

        {/* Role stats cards */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-3">
          {STAFF_ROLES.map((r) => {
            const cfg = ROLE_CONFIG[r]!;
            const Icon = cfg.icon;
            const count = roleCounts[r] ?? 0;
            return (
              <button
                key={r}
                onClick={() => setFilterRole(filterRole === r ? "all" : r)}
                className={cn(
                  "p-3 rounded-xl border text-left transition-all duration-200 hover:shadow-sm",
                  filterRole === r
                    ? `${cfg.bgColor} ${cfg.borderColor} ring-2 ring-primary/20`
                    : "bg-card border-border hover:bg-muted/40"
                )}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", cfg.bgColor)}>
                    <Icon className={cn("w-3.5 h-3.5", cfg.color)} />
                  </div>
                  <span className={cn("text-lg font-bold", cfg.color)}>{count}</span>
                </div>
                <p className="text-xs font-medium leading-tight">{cfg.label}</p>
              </button>
            );
          })}
        </div>

        {/* Search + Filter bar */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2 shrink-0">
                <Shield className="w-4 h-4" />
                {filterRole === "all" ? "All Roles" : ROLE_CONFIG[filterRole]?.label ?? filterRole}
                <ChevronDown className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <DropdownMenuItem onClick={() => setFilterRole("all")}>
                <Users className="w-4 h-4 mr-2" />
                All Roles
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Staff</DropdownMenuLabel>
              {STAFF_ROLES.map((r) => {
                const cfg = ROLE_CONFIG[r]!;
                const Icon = cfg.icon;
                return (
                  <DropdownMenuItem key={r} onClick={() => setFilterRole(r)}>
                    <Icon className={cn("w-4 h-4 mr-2", cfg.color)} />
                    {cfg.label}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs text-muted-foreground">Marketplace</DropdownMenuLabel>
              {["vendor", "buyer"].map((r) => {
                const cfg = ROLE_CONFIG[r]!;
                const Icon = cfg.icon;
                return (
                  <DropdownMenuItem key={r} onClick={() => setFilterRole(r)}>
                    <Icon className={cn("w-4 h-4 mr-2", cfg.color)} />
                    {cfg.label}
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Users table */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden shadow-sm">
          {/* Table header */}
          <div className="px-4 py-3 border-b border-border bg-muted/30 flex items-center justify-between">
            <p className="text-sm font-medium text-muted-foreground">
              {filtered.length} {filtered.length === 1 ? "user" : "users"}
              {filterRole !== "all" && ` · ${ROLE_CONFIG[filterRole]?.label ?? filterRole}`}
            </p>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Info className="w-3.5 h-3.5" />
              Click "Assign Role" to manage access
            </div>
          </div>

          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-14 h-14 bg-muted rounded-full flex items-center justify-center mb-4">
                <Users className="w-7 h-7 text-muted-foreground" />
              </div>
              <p className="font-medium">No users found</p>
              <p className="text-sm text-muted-foreground mt-1">
                Try adjusting your search or filters
              </p>
            </div>
          ) : (
            <div className="divide-y divide-border">
              {filtered.map((user) => {
                const cfg = ROLE_CONFIG[user.role] ?? ROLE_CONFIG["buyer"];
                const Icon = cfg.icon;
                const isStaff = STAFF_ROLES.includes(user.role);
                return (
                  <div
                    key={user.user_id}
                    className="flex items-center gap-4 px-4 py-3.5 hover:bg-muted/30 transition-colors"
                  >
                    {/* Avatar */}
                    <Avatar className="h-10 w-10 shrink-0">
                      <AvatarFallback
                        className={cn("font-semibold text-sm", cfg.bgColor, cfg.color)}
                      >
                        {(user.full_name || user.email).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>

                    {/* Name / email */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-medium text-sm truncate">
                          {user.full_name || "No Name"}
                        </p>
                        {isStaff && (
                          <span className="hidden sm:inline-flex items-center gap-1 text-xs text-primary bg-primary/10 px-1.5 py-0.5 rounded-full">
                            <ShieldCheck className="w-3 h-3" />
                            Staff
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                    </div>

                    {/* Role badge */}
                    <div className="hidden sm:block shrink-0">
                      <RoleBadge role={user.role} />
                    </div>

                    {/* Stats */}
                    <div className="hidden lg:flex items-center gap-4 text-xs text-muted-foreground shrink-0">
                      {user.role === "vendor" && (
                        <span className="flex items-center gap-1">
                          <Package className="w-3.5 h-3.5" />
                          {user.total_products_as_vendor ?? 0} products
                        </span>
                      )}
                      {(user.role === "buyer" || user.role === "vendor") && (
                        <span className="flex items-center gap-1">
                          <ShoppingCart className="w-3.5 h-3.5" />
                          {user.total_orders_as_buyer ?? 0} orders
                        </span>
                      )}
                    </div>

                    {/* Joined */}
                    <div className="hidden md:block text-xs text-muted-foreground shrink-0 w-20 text-right">
                      {user.joined_at
                        ? format(new Date(user.joined_at), "MMM d, yyyy")
                        : "—"}
                    </div>

                    {/* Actions */}
                    {currentUserRole === "admin" && (
                      <div className="flex items-center gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          className="gap-1.5 text-xs h-8"
                          onClick={() => setRoleDialogUser(user)}
                        >
                          <Shield className="w-3.5 h-3.5" />
                          Assign Role
                        </Button>
                        {user.role !== "buyer" && user.role !== "admin" && (
                          <Button
                            size="sm"
                            variant="ghost"
                            className="gap-1.5 text-xs h-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                            onClick={() => deactivateMutation.mutate(user.user_id)}
                            disabled={deactivateMutation.isPending}
                          >
                            <UserX className="w-3.5 h-3.5" />
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Role guide */}
        <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-sm">Role Permissions Guide</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
            {STAFF_ROLES.map((r) => {
              const cfg = ROLE_CONFIG[r]!;
              const Icon = cfg.icon;
              return (
                <div
                  key={r}
                  className={cn(
                    "rounded-xl border p-3 space-y-2",
                    cfg.bgColor,
                    cfg.borderColor
                  )}
                >
                  <div className="flex items-center gap-2">
                    <Icon className={cn("w-4 h-4", cfg.color)} />
                    <span className={cn("text-sm font-semibold", cfg.color)}>{cfg.label}</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{cfg.description}</p>
                  <div className="flex flex-wrap gap-1">
                    {cfg.permissions.map((p) => (
                      <span
                        key={p}
                        className="text-xs px-1.5 py-0.5 rounded bg-background/70 border border-border/50 text-foreground/70"
                      >
                        {p}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Role Dialog */}
      <RoleAssignDialog
        open={!!roleDialogUser}
        onClose={() => setRoleDialogUser(null)}
        user={roleDialogUser}
        onAssign={(userId, newRole) =>
          assignRoleMutation.mutate({ userId, newRole })
        }
        isPending={assignRoleMutation.isPending}
      />
    </DashboardLayout>
  );
};

export default AdminUsers;
