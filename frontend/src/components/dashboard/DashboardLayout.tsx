import { type CSSProperties, ReactNode, useEffect } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, CheckCircle2, Lock, Ban, Home, Mail, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link, useLocation } from "react-router-dom";
import { toast } from "sonner";
import { api } from "@/integrations/api/client";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import "./dashboard.css";

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'admin' | 'vendor';
  title: string;
  userName?: string;
  userRole?: string;
}

export function DashboardLayout({ children, type, title, userName, userRole }: DashboardLayoutProps) {
  const { user, vendorStatus, role, isLoading, refreshProfile } = useAuth();
  const { pathname } = useLocation();
  const { siteName } = useSiteSettingsContext();
  const isVendor = type === 'vendor';
  const isSuspended = vendorStatus === 'suspended';
  const isApproved = role === 'admin' || !isVendor || vendorStatus === 'approved';
  const canPrepareStore = isVendor && role === 'vendor' && vendorStatus === 'pending' && ['/vendor/profile', '/vendor/settings'].includes(pathname);
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
    <SidebarProvider className="dashboard-shell" style={{ "--sidebar-width": "260px", "--sidebar-width-icon": "68px" } as CSSProperties}>
      <div className="flex h-svh w-full overflow-hidden bg-background">
        <DashboardSidebar type={type} />
        <div className="flex min-w-0 flex-1 flex-col h-svh overflow-hidden">
          <DashboardHeader
            title={title}
            userName={userName || (type === 'admin' ? 'Admin User' : 'Vendor User')}
            userRole={userRole || (type === 'admin' ? 'Administrator' : 'Vendor')}
          />
          <main className="min-h-0 flex-1 overflow-x-hidden overflow-y-auto px-4 pb-5 pt-5 lg:px-6 lg:pt-6">
            {!isApproved && !canPrepareStore ? (
              isSuspended ? (
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
                      Your vendor account is awaiting staff approval. Complete your store profile while you wait.
                      Selling tools unlock when staff approve your account.
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
                      Checking approval status automatically...
                    </div>

                    <Button
                      variant="link"
                      onClick={() => refreshProfile()}
                      className="text-muted-foreground hover:text-primary transition-colors"
                    >
                      Check status manually
                    </Button>
                    <Button asChild><Link to="/vendor/profile">Complete store profile</Link></Button>
                  </div>
                </div>
              )
            ) : (
              <>
                {canPrepareStore && <div role="status" className="mb-5 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">Your account is awaiting staff approval. You can save your store details and images now. Publishing and payouts unlock after approval.</div>}
                {children}
              </>
            )}
            <footer className="mt-8 flex flex-wrap items-center justify-between gap-2 border-t border-border/70 pt-4 text-[11px] text-muted-foreground"><span>© {new Date().getFullYear()} {siteName || "Unimall"}. Your campus marketplace.</span><Link to="/contact" className="hover:text-primary">Help & support</Link></footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
