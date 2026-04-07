import { ReactNode } from "react";
import { SidebarProvider } from "@/components/ui/sidebar";
import { DashboardSidebar } from "./DashboardSidebar";
import { DashboardHeader } from "./DashboardHeader";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Clock, ShieldAlert, CheckCircle2, Lock, Ban, Home, Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface DashboardLayoutProps {
  children: ReactNode;
  type: 'admin' | 'vendor';
  title: string;
  userName?: string;
  userRole?: string;
}

export function DashboardLayout({ children, type, title, userName, userRole }: DashboardLayoutProps) {
  const { vendorStatus, role, isLoading, refreshProfile } = useAuth();
  const isVendor = type === 'vendor';
  const isApproved = role === 'admin' || !isVendor || vendorStatus === 'approved';

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background overflow-x-hidden">
        <DashboardSidebar type={type} />
        <div className="flex-1 flex flex-col min-h-screen">
          <DashboardHeader
            title={title}
            userName={userName || (type === 'admin' ? 'Admin User' : 'Vendor User')}
            userRole={userRole || (type === 'admin' ? 'Administrator' : 'Vendor')}
          />
          <main className="flex-1 p-4 lg:p-6 overflow-auto">
            {!isApproved ? (
              vendorStatus === 'suspended' ? (
                <div className="flex flex-col items-center justify-center h-[70vh] max-w-2xl mx-auto text-center space-y-8 animate-in fade-in zoom-in duration-500">
                  <div className="relative">
                    <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center relative z-10">
                      <Ban className="w-12 h-12 text-destructive" />
                    </div>
                    <div className="absolute inset-0 bg-destructive/20 rounded-full blur-2xl animate-pulse" />
                  </div>

                  <div className="space-y-4">
                    <h2 className="text-3xl font-bold tracking-tight">Account Suspended</h2>
                    <p className="text-lg text-muted-foreground leading-relaxed">
                      Your vendor account has been suspended by an administrator.
                      Please contact support if you believe this is a mistake.
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
