import { adminService } from "@/services/adminService";
import { productService } from "@/services/productService";
import { useState } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { DataTable } from "@/components/dashboard/DataTable";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { api } from "@/integrations/api/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  MoreHorizontal,
  CheckCircle,
  XCircle,
  Trash2,
  Store,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
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
  campus?: string;
  verified?: boolean;
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
  const [reviewingVendor, setReviewingVendor] = useState<VendorData | null>(null);

  const { data: vendors = [], isLoading, error: vendorsError, refetch } = useQuery({
    queryKey: ["admin-all-vendors"],
    queryFn: () => adminService.getManagedVendors(),
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
      await adminService.updateVendorStatus(vendorId, newStatus);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-vendors"] });
      productService.bustCache();
      for (const key of ["vendors-list", "vendor-profile", "product-vendor-profile", "vendor-stats", "products", "homepage-pro-sellers", "homepage-bestsellers", "homepage-newarrivals"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
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
      const { data, error } = await (api as any).rpc("delete_vendor_account", { _vendor_id: vendorId });
      if (error) throw error;
      if (data !== true) throw new Error("The server did not confirm account deletion.");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-all-vendors"] });
      productService.bustCache();
      for (const key of ["vendors-list", "vendor-profile", "product-vendor-profile", "vendor-stats", "products", "homepage-pro-sellers", "homepage-bestsellers", "homepage-newarrivals"]) {
        queryClient.invalidateQueries({ queryKey: [key] });
      }
      setDeleteDialogOpen(false);
      setVendorToDelete(null);
      toast({
        title: "Vendor Deactivated",
        description: "The account can no longer sign in or sell. Order history is retained.",
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
  const verificationMutation = useMutation({
    mutationFn: async (vendor: VendorData) => {
      const { data, error } = await api.rpc('set_vendor_verification', { _vendor_id: vendor.user_id, _verified: !vendor.verified });
      if (error) throw error;
      if (data !== true) throw new Error('The server did not confirm verification.');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-all-vendors'] });
      for (const key of ['vendors-list', 'vendor-profile', 'product-vendor-profile', 'products']) queryClient.invalidateQueries({ queryKey: [key] });
      productService.bustCache();
      toast({ title: 'Verification updated' });
    },
    onError: (error: Error) => toast({ title: 'Verification failed', description: error.message, variant: 'destructive' }),
  });

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
            <Button variant="ghost" size="icon" aria-label={`Actions for ${vendor.store_name || vendor.full_name || vendor.email}`} disabled={updateStatusMutation.isPending || verificationMutation.isPending}>
              <MoreHorizontal className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Actions</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => setReviewingVendor(vendor)}>Review vendor profile</DropdownMenuItem>
            
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
            {vendor.vendor_status === 'approved' && <DropdownMenuItem onClick={() => verificationMutation.mutate(vendor)}><ShieldCheck className="w-4 h-4 mr-2" />{vendor.verified ? 'Remove verification' : 'Mark as verified'}</DropdownMenuItem>}

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
                Deactivate Account
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      ),
    },
  ];

  if (vendorsError) return <DashboardLayout type="admin" title="Vendors"><div role="alert" className="p-6 space-y-3"><p>Could not load vendors. {vendorsError.message}</p><Button onClick={() => refetch()}>Try again</Button></div></DashboardLayout>;

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
      <Dialog open={!!reviewingVendor} onOpenChange={open => !open && setReviewingVendor(null)}><DialogContent><DialogHeader><DialogTitle>{reviewingVendor?.store_name || reviewingVendor?.full_name}</DialogTitle><DialogDescription>Review the saved vendor details before approving this account.</DialogDescription></DialogHeader><dl className="space-y-3 text-sm">{[['Email', reviewingVendor?.email], ['Phone', reviewingVendor?.phone], ['Campus', reviewingVendor?.campus], ['Description', reviewingVendor?.store_description], ['Status', reviewingVendor?.vendor_status]].map(([label, value]) => <div key={label}><dt className="font-semibold">{label}</dt><dd className="break-words text-muted-foreground">{value || 'Not supplied'}</dd></div>)}</dl>{reviewingVendor?.vendor_status === 'pending' && <Button disabled={updateStatusMutation.isPending} onClick={() => { handleApprove(reviewingVendor.user_id); setReviewingVendor(null); }}>Approve Vendor</Button>}</DialogContent></Dialog>
      <DashboardLayout type="admin" title="Vendors">
        <DataTable
          title="Vendor Management"
          data={vendors}
          columns={vendorColumns}
          searchKey="email"
          searchPlaceholder="Search vendors..."
          actions={
            <Button onClick={() => refetch()}>
              <RefreshCw className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          }
        />
      </DashboardLayout>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate this vendor?</AlertDialogTitle>
            <AlertDialogDescription>
              The vendor will lose sign-in and selling access, and their listings will be hidden.
              Order and payment records are retained for marketplace history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deactivate Vendor
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default AdminVendors;
