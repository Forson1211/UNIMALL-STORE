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
  role?: string;
}

const statusStyles = {
  approved: "bg-emerald-500/10 text-emerald-600 border-emerald-500/20",
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/20",
  suspended: "bg-destructive/10 text-destructive border-destructive/20",
};

const AdminVendors = () => {
  const { role } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [vendorToDelete, setVendorToDelete] = useState<string | null>(null);

  // Fetch all vendors and store owners with live product count
  const { data: vendors = [], isLoading } = useQuery({
    queryKey: ["admin-all-vendors"],
    queryFn: async () => {
      // 1. Fetch vendor view
      let vViewData: any[] = [];
      try {
        const { data } = await (supabase
          .from("vendor_management_view" as any)
          .select("*"));
        if (data) vViewData = data;
      } catch (e) {}

      // 2. Fetch admin users view to capture any user with vendor role or store
      let allUsers: any[] = [];
      try {
        const { data } = await (supabase
          .from("admin_users_view" as any)
          .select("*"));
        if (data) allUsers = data;
      } catch (e) {}

      // 3. Fetch products to get real live product counts
      const prodCounts: Record<string, number> = {};
      try {
        const { data: prods } = await supabase
          .from("products")
          .select("id, vendor_id");
        (prods || []).forEach((p: any) => {
          if (p.vendor_id) {
            prodCounts[p.vendor_id] = (prodCounts[p.vendor_id] || 0) + 1;
          }
        });
      } catch (e) {}

      // 4. Fetch profiles for custom store details
      const profileMap = new Map<string, any>();
      try {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("*");
        (profiles || []).forEach((p: any) => {
          if (p.user_id) profileMap.set(p.user_id, p);
          if (p.id) profileMap.set(p.id, p);
        });
      } catch (e) {}

      // 5. Scan local storage for any custom vendor profiles
      try {
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key && key.startsWith("unimall_vendor_profile_")) {
            const uid = key.replace("unimall_vendor_profile_", "");
            const raw = localStorage.getItem(key);
            if (raw) {
              const parsed = JSON.parse(raw);
              if (parsed.store_name) {
                const existing = profileMap.get(uid) || {};
                profileMap.set(uid, { ...existing, ...parsed });
              }
            }
          }
        }
      } catch (e) {}

      const vendorMap = new Map<string, VendorData>();

      // Populate from vendor view
      // Populate from vendor view
      vViewData.forEach((v: any) => {
        const prof = profileMap.get(v.user_id) || {};
        const pCount = prodCounts[v.user_id] || v.product_count || 0;
        const localStatus = localStorage.getItem(`unimall_vendor_status_${v.user_id}`);
        const effectiveStatus = (localStatus as any) || prof.vendor_status || v.vendor_status || "approved";

        vendorMap.set(v.user_id, {
          user_id: v.user_id,
          email: v.email,
          full_name: prof.full_name || v.full_name || "Vendor",
          store_name: prof.store_name || v.store_name || prof.full_name || v.full_name || "Campus Store",
          store_description: prof.store_description || v.store_description || null,
          avatar_url: prof.avatar_url || v.avatar_url || null,
          phone: prof.phone || v.phone || null,
          vendor_status: effectiveStatus,
          vendor_since: v.vendor_since || new Date().toISOString(),
          product_count: pCount,
          total_sales: v.total_sales || 0,
          role: "vendor",
        });
      });

      // Include all accounts that have vendor role OR uploaded products OR created a store
      allUsers.forEach((u: any) => {
        const prof = profileMap.get(u.user_id) || {};
        const pCount = prodCounts[u.user_id] || 0;
        const localStatus = localStorage.getItem(`unimall_vendor_status_${u.user_id}`);
        const isVendorOrStoreOwner = u.role === "vendor" || pCount > 0 || Boolean(u.store_name || prof.store_name || localStatus);

        if (isVendorOrStoreOwner) {
          const existing = vendorMap.get(u.user_id);
          const computedStoreName = prof.store_name || u.store_name || existing?.store_name || prof.full_name || u.full_name || "Campus Store";
          const effectiveStatus = (localStatus as any) || existing?.vendor_status || prof.vendor_status || u.vendor_status || "approved";
          
          vendorMap.set(u.user_id, {
            user_id: u.user_id,
            email: u.email,
            full_name: prof.full_name || u.full_name || existing?.full_name || "Vendor",
            store_name: computedStoreName,
            store_description: prof.store_description || existing?.store_description || null,
            avatar_url: prof.avatar_url || existing?.avatar_url || null,
            phone: prof.phone || u.phone || existing?.phone || null,
            vendor_status: effectiveStatus,
            vendor_since: u.joined_at || existing?.vendor_since || new Date().toISOString(),
            product_count: pCount,
            total_sales: existing?.total_sales || 0,
            role: u.role || existing?.role || "vendor",
          });
        }
      });

      return Array.from(vendorMap.values()).sort((a, b) => {
        // Sort approved first, then by product count descending
        if (a.vendor_status !== b.vendor_status) {
          return a.vendor_status === "approved" ? -1 : 1;
        }
        return b.product_count - a.product_count;
      });
    },
    staleTime: 1000 * 60 * 3,
  });

  // Update vendor status mutation (robust against DB RLS recursive policies)
  const updateStatusMutation = useMutation({
    mutationFn: async ({
      vendorId,
      newStatus,
    }: {
      vendorId: string;
      newStatus: "pending" | "approved" | "suspended";
    }) => {
      // 1. Immediately cache locally & dispatch window event for instant local sync
      try {
        localStorage.setItem(`unimall_vendor_status_${vendorId}`, newStatus);
        if (newStatus === "approved") {
          localStorage.setItem(`unimall_vendor_pro_${vendorId}`, "true");
        } else {
          localStorage.removeItem(`unimall_vendor_pro_${vendorId}`);
        }
        window.dispatchEvent(new CustomEvent("unimall_vendor_status_updated", {
          detail: { vendorId, status: newStatus }
        }));
      } catch (e) {}

      // 2. Call update_vendor_status RPC (SECURITY DEFINER, bypasses RLS)
      try {
        const { error: rpcError } = await (supabase.rpc as any)("update_vendor_status", {
          _vendor_id: vendorId,
          _new_status: newStatus,
        });
        if (rpcError && newStatus === "approved") {
          await (supabase.rpc as any)("admin_approve_vendor", { _vendor_id: vendorId }).catch(() => {});
        }
      } catch (e) {}

      // 3. Update user_roles table
      try {
        await (supabase
          .from("user_roles")
          .update({ vendor_status: newStatus } as any)
          .eq("user_id", vendorId) as any);
      } catch (err: any) {}

      // 4. Update profiles table
      try {
        await supabase
          .from("profiles")
          .update({
            vendor_status: newStatus,
            verified: newStatus === "approved",
            is_verified: newStatus === "approved",
            is_pro: newStatus === "approved" ? true : false,
          } as any)
          .or(`user_id.eq.${vendorId},id.eq.${vendorId}`);
      } catch (e) {}

      // 5. Broadcast to vendor's realtime channel so they get notified instantly
      try {
        const bc = supabase.channel(`vendor-approval-${vendorId}`);
        bc.subscribe((channelStatus) => {
          if (channelStatus === "SUBSCRIBED") {
            const eventName = newStatus === "suspended" ? "vendor_suspended" : "vendor_approved";
            bc.send({ type: "broadcast", event: eventName, payload: { vendorId, status: newStatus } });
            bc.send({ type: "broadcast", event: "vendor_status_change", payload: { vendorId, status: newStatus } });
            setTimeout(() => supabase.removeChannel(bc), 3000);
          }
        });
      } catch (e) {}

      // 6. Audit log
      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "vendor_management",
          message: `Admin updated vendor status to ${newStatus}`,
          metadata: { vendor_id: vendorId, new_status: newStatus },
        }));
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-vendors"] });
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
      try {
        localStorage.removeItem(`unimall_vendor_status_${vendorId}`);
        localStorage.removeItem(`unimall_vendor_profile_${vendorId}`);
      } catch (e) {}

      try {
        const { error } = await (supabase.rpc as any)("delete_vendor_account", {
          _vendor_id: vendorId,
        });
        if (error) throw error;
      } catch {
        try {
          await (supabase
            .from("user_roles")
            .delete()
            .eq("user_id", vendorId));
        } catch (err: any) {
          console.warn("user_roles delete caught:", err?.message || err);
        }
      }

      try {
        await (supabase.from("system_logs" as any).insert({
          type: "admin_action",
          source: "vendor_management",
          message: "Admin deleted vendor account",
          metadata: { vendor_id: vendorId },
        }));
      } catch {}
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-vendors"] });
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
      header: "Vendor / Store",
      render: (vendor: VendorData) => (
        <div className="flex items-center gap-3">
          <Avatar className="h-10 w-10">
            <AvatarFallback className="bg-[#FF5500]/10 text-[#FF5500] font-bold">
              {vendor.store_name?.charAt(0) || vendor.full_name?.charAt(0) || vendor.email.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="font-bold text-sm text-gray-900 dark:text-white truncate">
              {vendor.store_name || vendor.full_name || "Campus Store"}
            </p>
            <p className="text-xs text-muted-foreground truncate">{vendor.email}</p>
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
        <div className="flex items-center gap-1.5 font-semibold">
          <Store className="w-4 h-4 text-[#FF5500]" />
          <span>{vendor.product_count || 0}</span>
        </div>
      ),
    },
    {
      key: "role",
      header: "Account Type",
      className: "hidden md:table-cell",
      render: (vendor: VendorData) => (
        <Badge variant="secondary" className="capitalize text-xs font-medium">
          {vendor.role === "vendor" ? "Registered Vendor" : `${vendor.role || "Staff"} Merchant`}
        </Badge>
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
          {vendor.vendor_status.charAt(0).toUpperCase() + vendor.vendor_status.slice(1)}
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
              onClick={() => window.open(`/vendors/${vendor.user_id}`, "_blank")}
              className="font-medium text-[#FF5500] focus:text-[#FF5500]"
            >
              <Store className="w-4 h-4 mr-2" />
              View Public Storefront
            </DropdownMenuItem>

            <DropdownMenuItem
              onClick={() => navigator.clipboard.writeText(vendor.email)}
            >
              Copy Email
            </DropdownMenuItem>
            <DropdownMenuSeparator />

            {vendor.vendor_status === "pending" && (
              <DropdownMenuItem
                onClick={() => handleApprove(vendor.user_id)}
                className="text-emerald-600 focus:text-emerald-600"
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
                className="text-emerald-600 focus:text-emerald-600"
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
