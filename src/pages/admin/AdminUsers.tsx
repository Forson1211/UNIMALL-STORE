import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MoreHorizontal, RefreshCw, Eye, UserX, ShieldCheck } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

interface User {
  user_id: string;
  email: string;
  joined_at: string;
  last_sign_in_at: string;
  email_confirmed_at: string;
  full_name: string;
  phone: string;
  address: string;
  store_name: string;
  role: string;
  vendor_status: string;
  total_orders_as_buyer: number;
  total_products_as_vendor: number;
}

const roleStyles: Record<string, string> = {
  admin: "bg-purple-500/10 text-purple-500 border-purple-500/20",
  vendor: "bg-secondary/10 text-secondary border-secondary/20",
  buyer: "bg-primary/10 text-primary border-primary/20",
};

const AdminUsers = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  // Fetch all users
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
  });

  // Suspend user mutation
  const suspendUserMutation = useMutation({
    mutationFn: async (userId: string) => {
      // Update vendor status to suspended
      const { error } = await (supabase
        .from("user_roles")
        .update({ vendor_status: "suspended" } as any)
        .eq("user_id", userId)
        .eq("role", "vendor"));

      if (error) throw error;

      // Log the action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "user_management",
          message: "Admin suspended user",
          metadata: {
            user_id: userId,
          },
        }));
      } catch (logError) {
        console.log("Logging skipped:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Success",
        description: "User suspended successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to suspend user.",
        variant: "destructive",
      });
    },
  });

  // Promote to admin mutation
  const promoteToAdminMutation = useMutation({
    mutationFn: async (userId: string) => {
      const { error } = await supabase
        .from("user_roles")
        .update({ role: "admin" })
        .eq("user_id", userId);

      if (error) throw error;

      // Log the action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "user_management",
          message: "Admin promoted user to admin",
          metadata: {
            user_id: userId,
          },
        }));
      } catch (logError) {
        console.log("Logging skipped:", logError);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
      toast({
        title: "Success",
        description: "User promoted to admin successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message || "Failed to promote user.",
        variant: "destructive",
      });
    },
  });

  const handleSuspendUser = (userId: string) => {
    suspendUserMutation.mutate(userId);
  };

  const handlePromoteToAdmin = (userId: string) => {
    promoteToAdminMutation.mutate(userId);
  };

  const handleViewProfile = (userId: string) => {
    navigate(`/profile/${userId}`);
  };

  const userColumns = [
    {
      key: "full_name",
      header: "User",
      render: (user: User) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {user.full_name?.charAt(0) || user.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{user.full_name || "No Name"}</p>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Role",
      className: "hidden md:table-cell",
      render: (user: User) => (
        <Badge variant="outline" className={roleStyles[user.role] || ""}>
          {user.role}
        </Badge>
      ),
    },
    {
      key: "store_name",
      header: "Store/Info",
      className: "hidden lg:table-cell",
      render: (user: User) => user.store_name || user.address || "—",
    },
    {
      key: "total_orders_as_buyer",
      header: "Orders",
      sortable: true,
      className: "hidden md:table-cell",
    },
    {
      key: "total_products_as_vendor",
      header: "Products",
      sortable: true,
      className: "hidden lg:table-cell",
    },
    {
      key: "vendor_status",
      header: "Vendor Status",
      className: "hidden xl:table-cell",
      render: (user: User) => {
        if (user.role !== "vendor") return "—";
        const statusColors: Record<string, string> = {
          pending: "bg-gold/10 text-gold border-gold/20",
          approved: "bg-primary/10 text-primary border-primary/20",
          suspended: "bg-destructive/10 text-destructive border-destructive/20",
        };
        return (
          <Badge variant="outline" className={statusColors[user.vendor_status] || ""}>
            {user.vendor_status || "—"}
          </Badge>
        );
      },
    },
    {
      key: "joined_at",
      header: "Joined",
      sortable: true,
      className: "hidden lg:table-cell",
      render: (user: User) => new Date(user.joined_at).toLocaleDateString(),
    },
    {
      key: "actions",
      header: "",
      render: (user: User) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => handleViewProfile(user.user_id)}>
              <Eye className="w-4 h-4 mr-2" />
              View Profile
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel className="text-xs text-muted-foreground">
              Admin Actions
            </DropdownMenuLabel>
            {user.role !== "admin" && role === "admin" && (
              <DropdownMenuItem
                onClick={() => handlePromoteToAdmin(user.user_id)}
                className="text-purple-500"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Promote to Admin
              </DropdownMenuItem>
            )}
            {user.role === "vendor" && user.vendor_status !== "suspended" && (
              <DropdownMenuItem
                onClick={() => handleSuspendUser(user.user_id)}
                className="text-destructive"
              >
                <UserX className="w-4 h-4 mr-2" />
                Suspend Vendor
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout type="admin" title="Users">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading users...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="admin" title="Users">
      <DataTable
        title="All Users"
        data={users}
        columns={userColumns}
        searchKey="full_name"
        searchPlaceholder="Search users..."
        actions={
          <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["admin-users"] })}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        }
      />
    </DashboardLayout>
  );
};

export default AdminUsers;
