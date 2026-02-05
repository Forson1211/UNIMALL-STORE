import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Store,
  RefreshCw,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { format } from "date-fns";
import { useAuth } from "@/contexts/AuthContext";

interface VendorData {
  user_id: string;
  email: string;
  full_name: string | null;
  store_name: string | null;
  store_description: string | null;
  avatar_url: string | null;
  phone: string | null;
  vendor_status: "pending" | "approved" | "suspended";
  vendor_since: string;
  product_count: number;
  total_sales: number;
}

const statusStyles = {
  approved: "bg-primary/10 text-primary border-primary/20",
  pending: "bg-gold/10 text-gold border-gold/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminVendors = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  // Fetch vendors using the new view
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["vendors"],
    queryFn: async () => {
      const { data, error } = await (supabase
        .from("vendor_management_view" as any)
        .select("*")
        .order("vendor_status", { ascending: false })
        .order("vendor_since", { ascending: false }) as any);

      if (error) throw error;
      return data as VendorData[];
    },
  });

  // Update vendor status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      vendorId,
      newStatus,
    }: {
      vendorId: string;
      newStatus: "pending" | "approved" | "suspended";
    }) => {
      // For approval, use our secure RPC function
      if (newStatus === 'approved') {
        const { error } = await (supabase.rpc as any)("admin_approve_vendor", {
          _vendor_id: vendorId,
        });
        if (error) throw error;
      } else {
        // Use direct update for other statuses
        const { error } = await (supabase
          .from("user_roles")
          .update({ vendor_status: newStatus } as any)
          .eq("user_id", vendorId)
          .eq("role", "vendor"));
        if (error) throw error;
      }

      // Log the action (handled in RPC for approval)
      if (newStatus !== 'approved') {
        try {
          await (supabase.from("system_logs" as any).insert({
            type: "admin_action",
            source: "vendor_management",
            message: `Admin updated vendor status to ${newStatus}`,
            metadata: { vendor_id: vendorId, new_status: newStatus },
          }));
        } catch (logError) {
          console.log("Logging skipped");
        }
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      toast({
        title: "Status Updated",
        description: "Vendor status has been updated successfully.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Delete vendor mutation
  const deleteVendorMutation = useMutation({
    mutationFn: async (vendorId: string) => {
      // Use RPC if available, or fall back to admin delete
      // Since we don't have service role here, we rely on RLS or specific function
      // For now, we'll try the RPC function generated in the migration
      const { error } = await (supabase.rpc as any)("delete_vendor_account", {
        _vendor_id: vendorId,
      });

      if (error) throw error;

      // Log the action
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "vendor_management",
          message: "Admin deleted vendor account",
          metadata: {
            vendor_id: vendorId,
          },
        }));
      } catch (logError) {
        console.log("Logging skipped");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["vendors"] });
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
      toast({
        title: "Vendor Deleted",
        description: "Vendor account has been permanently deleted.",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleApprove = (id: string) => {
    updateStatusMutation.mutate({ vendorId: id, newStatus: "approved" });
  };

  const handleSuspend = (id: string) => {
    updateStatusMutation.mutate({ vendorId: id, newStatus: "suspended" });
  };

  const handleReactivate = (id: string) => {
    updateStatusMutation.mutate({ vendorId: id, newStatus: "approved" });
  };

  const handleDeleteClick = (id: string) => {
    setVendorToDelete(id);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = () => {
    if (vendorToDelete) {
      deleteVendorMutation.mutate(vendorToDelete);
    }
  };

  const vendorColumns = [
    {
      key: "full_name",
      header: "Vendor",
      render: (vendor: VendorData) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-primary/10 text-primary font-medium">
              {vendor.store_name?.charAt(0) || vendor.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium">{vendor.store_name || vendor.full_name || "Unknown"}</p>
            <p className="text-sm text-muted-foreground">{vendor.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "product_count",
      header: "Products",
      sortable: true,
      className: "hidden sm:table-cell",
      render: (vendor: VendorData) => (
        <div className="flex items-center gap-1">
          <Store className="w-4 h-4 text-muted-foreground" />
          <span>{vendor.product_count || 0}</span>
        </div>
      ),
    },
    {
      key: "total_sales",
      header: "Sales",
      sortable: true,
      className: "hidden md:table-cell",
      render: (vendor: VendorData) => (
        <span className="font-medium">{vendor.total_sales || 0}</span>
      ),
    },
    {
      key: "vendor_since",
      header: "Joined",
      sortable: true,
      className: "hidden lg:table-cell",
      render: (vendor: VendorData) =>
        vendor.vendor_since
          ? format(new Date(vendor.vendor_since), "MMM d, yyyy")
          : "-",
    },
    {
      key: "vendor_status",
      header: "Status",
      render: (vendor: VendorData) => (
        <Badge variant="outline" className={statusStyles[vendor.vendor_status]}>
          {vendor.vendor_status.charAt(0).toUpperCase() +
            vendor.vendor_status.slice(1)}
        </Badge>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (vendor: VendorData) => (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(vendor.email)}
            >
              Copy Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {vendor.vendor_status === "pending" && (
              <DropdownMenuItem
                onClick={() => handleApprove(vendor.user_id)}
                className="text-primary focus:text-primary"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve Vendor
              </DropdownMenuItem>
            )}

            {vendor.vendor_status === "approved" && (
              <DropdownMenuItem
                onClick={() => handleSuspend(vendor.user_id)}
                className="text-destructive focus:text-destructive"
              >
                <XCircle className="w-4 h-4 mr-2" />
                Suspend Vendor
              </DropdownMenuItem>
            )}

            {vendor.vendor_status === "suspended" && (
              <DropdownMenuItem
                onClick={() => handleReactivate(vendor.user_id)}
                className="text-primary focus:text-primary"
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Reactivate Vendor
              </DropdownMenuItem>
            )}

            <DropdownMenuSeparator />
            {role === "admin" && (
              <DropdownMenuItem
                onClick={() => handleDeleteClick(vendor.user_id)}
                className="text-destructive focus:text-destructive"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete Account
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout type="admin" title="Vendors">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <p className="text-muted-foreground">Loading vendors...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <>
      <DashboardLayout type="admin" title="Vendors">
        <DataTable
          title="Vendor Management"
          data={vendors}
          columns={vendorColumns}
          searchKey="email"
          searchPlaceholder="Search vendors..."
          actions={
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ["vendors"] })}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          }
        />
      </DashboardLayout>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the vendor
              account and remove their data from our servers.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminVendors;
