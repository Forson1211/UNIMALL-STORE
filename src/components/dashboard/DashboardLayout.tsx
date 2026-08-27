import { ReactNode, useEffect, useRef } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, CheckCircle2, Lock, Ban, Home, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'admin' | 'vendor';
  title: string;
  userName?: string;
  userRole?: string;
}

export function DashboardLayout({ children, type, title, userName, userRole }: DashboardLayoutProps) {
  const { user, vendorStatus, role, isLoading, refreshProfile } = useAuth();
  const isVendor = type === 'vendor';
  const localStatus = user?.id ? localStorage.getItem(`unimall_vendor_status_${user.id}`) : null;
  // isSuspended: trust both AuthContext state AND localStorage (monitor updates localStorage first)
  const isSuspended = vendorStatus === 'suspended' || localStatus === 'suspended';
  // isApproved: NEVER use localStatus=approved to override — only trust vendorStatus from AuthContext (set by DB)
  // Use localStatus=approved only as a fast-path while vendorStatus is still null (loading)
  const isStatusLoaded = vendorStatus !== null;
  const isApproved = role === 'admin' || (!isVendor ? true : (
    !isSuspended && (
      vendorStatus === 'approved' ||
      (!isStatusLoaded && localStatus === 'approved')  // only while loading
    )
  ));
  // Status transition toast (only fires on actual state changes, never on page routing)
  useEffect(() => {
    if (!user?.id || !isVendor) return;

    const prevStatus = sessionStorage.getItem(`unimall_prev_vendor_status_${user.id}`);

    if (prevStatus === "pending" && vendorStatus === "approved") {
      toast.success("🎉 Store Approved!", {
        description: "Your vendor dashboard and product manager are fully unlocked.",
      });
    } else if (prevStatus === "approved" && (vendorStatus === "suspended" || isSuspended)) {
      toast.error("⚠️ Account Suspended", {
        description: "Your vendor store has been suspended by an administrator.",
      });
    }

    if (vendorStatus) {
      sessionStorage.setItem(`unimall_prev_vendor_status_${user.id}`, vendorStatus);
    }
  }, [vendorStatus, isSuspended, user?.id, isVendor]);

  // Universal status monitor — detects both approval AND suspension in real-time
  useEffect(() => {
    if (!isVendor || !user?.id || role === "admin") return;

    let lastCheckedRole: string | null = null;

    const checkStatus = async () => {
      // 1. Check local storage first
      const local = localStorage.getItem(`unimall_vendor_status_${user.id}`);
      if (local === "suspended" && vendorStatus !== "suspended") {
        refreshProfile();
        return;
      }
      if (local === "approved" && vendorStatus !== "approved") {
        refreshProfile();
        return;
      }

      // 2. Direct query on user_roles
      try {
        const { data: roleRow } = await supabase
          .from("user_roles")
          .select("role, vendor_status")
          .eq("user_id", user.id)
          .maybeSingle();

        if (roleRow?.vendor_status === "suspended") {
          localStorage.setItem(`unimall_vendor_status_${user.id}`, "suspended");
          refreshProfile();
          return;
        }
        if (roleRow?.vendor_status === "approved" && vendorStatus !== "approved") {
          localStorage.setItem(`unimall_vendor_status_${user.id}`, "approved");
          refreshProfile();
          return;
        }
      } catch (e) {}

      // 3. Direct query on profiles
      try {
        const { data: pData } = await (supabase
          .from("profiles" as any)
          .select("vendor_status, verified")
          .or(`id.eq.${user.id},user_id.eq.${user.id}`)
          .maybeSingle() as any);

        if (pData?.vendor_status === "suspended") {
          localStorage.setItem(`unimall_vendor_status_${user.id}`, "suspended");
          refreshProfile();
          return;
        }
      } catch (e) {}

      // 4. RPC role check
      try {
        const { data: currentVendorStatus } = await (supabase.rpc as any)("get_vendor_status", { _user_id: user.id });
        if (!currentVendorStatus) return;

        const roleChanged = currentVendorStatus !== lastCheckedRole;
        lastCheckedRole = currentVendorStatus;

        if (roleChanged || currentVendorStatus !== vendorStatus) {
          localStorage.setItem(`unimall_vendor_status_${user.id}`, currentVendorStatus);
          refreshProfile();
        }
      } catch (e) {}
    };

    // Run immediately on mount to catch suspended state before first interval
    checkStatus();
    const timer = setInterval(checkStatus, 3000);
    return () => clearInterval(timer);
  }, [isVendor, user?.id, role, refreshProfile]);

  useEffect(() => {
    const rootEl = document.getElementById("root");
    if (rootEl) {
      rootEl.classList.add("full-screen-dashboard");
    }
    return () => {
      if (rootEl) {
        rootEl.classList.remove("full-screen-dashboard");
      }
    };
  }, []);

  if (isLoading && !role) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-10 h-10 border-3 border-[#FF5500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <DashboardSidebar type={type} />
        <div className="flex min-w-0 flex-1 flex-col h-svh overflow-hidden">
          <DashboardHeader
            title={title}
            userName={userName || (type === 'admin' ? 'Admin User' : 'Vendor User')}
            userRole={userRole || (type === 'admin' ? 'Administrator' : 'Vendor')}
          />
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto p-4 lg:p-6">
            {!isApproved ? (
              (vendorStatus === 'suspended' || isSuspended || localStatus === 'suspended') ? (
                <div className="flex flex-col items-center justify-center h-[70vh] max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                    <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center relative z-10">
                      <Ban className="w-12 h-12 text-destructive" />
                    </div>
                    <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight text-destructive">Account Suspended</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Your vendor store has been suspended by an administrator.
                      Please contact Unimall support if you believe this is a mistake or to appeal this decision.
                    </p>
                  </div>

                  <div className="flex gap-4">
                    <Link to="/">
                      <Button variant="outline" className="gap-2">
                        <Home className="w-4 h-4" />
                        Back to Home
                      </Button>
                    </Link>
                    <Link to="/contact">
                      <Button className="gap-2">
                        <Mail className="w-4 h-4" />
                        Contact Support
                      </Button>
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-[70vh] max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                    <div className="w-24 h-24 bg-gold/10 rounded-full flex items-center justify-center relative z-10">
                      <Clock className="w-12 h-12 text-gold animate-pulse" />
                    </div>
                    <div className="absolute inset-0 bg-gold/20 rounded-full blur-2xl animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight">Approval Pending</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Your store profile is currently being reviewed by our team.
                      This usually takes 24-48 hours. Once approved, your dashboard will unlock automatically.
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full pt-8">
                    <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center gap-2">
                      <ShieldAlert className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Secure Review</span>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center gap-2">
                      <Lock className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Locked Features</span>
                    </div>
                    <div className="p-4 rounded-xl border border-border bg-card flex flex-col items-center gap-2">
                      <CheckCircle2 className="w-6 h-6 text-primary" />
                      <span className="text-sm font-medium">Auto-Unlock</span>
                    </div>
                  </div>

                  <div className="flex flex-col items-center gap-4 mt-8">
                    <div className="flex items-center gap-3 px-6 py-3 bg-primary/5 border border-primary/10 rounded-full text-primary font-medium animate-bounce">
                      <div className="w-2 h-2 bg-primary rounded-full animate-ping" />
                      Listening for real-time approval...
                    </div>

                    <Button
                      variant="link"
                      onClick={() => refreshProfile()}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Check status manually
                    </Button>
                  </div>
                </div>
              )
            ) : (
              children
            )}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
