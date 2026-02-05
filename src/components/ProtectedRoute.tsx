import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert, Clock, Ban } from "lucide-react";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("admin" | "moderator" | "vendor" | "buyer")[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, role, vendorStatus, isLoading } = useAuth();
  const location = useLocation();

  // Show loading while checking auth
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Check if user is authenticated
  if (requireAuth && !user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Check vendor status for vendor routes (only for actual vendors, not admins/moderators)
  if (allowedRoles && allowedRoles.includes("vendor") && role === "vendor") {
    // We delegate specific status UI (pending/suspended) to the DashboardLayout
    // so we can have real-time listeners and manual refresh buttons there.
    // We just ensure they are a vendor to enter this block.
  }

  // Check if user has required role
  if (allowedRoles && role) {
    // Admin (superuser) has access to everything
    if (role === "admin") {
      return <>{children}</>;
    }

    // Moderator has access to admin routes
    if (role === "moderator" && allowedRoles.includes("admin")) {
      return <>{children}</>;
    }

    // Normal role check
    if (allowedRoles.includes(role)) {
      return <>{children}</>;
    }

    // Access Denied
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center max-w-md px-4">
          <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-6">
            <ShieldAlert className="w-10 h-10 text-destructive" />
          </div>
          <h1 className="text-3xl font-bold mb-2">Access Denied</h1>
          <p className="text-muted-foreground mb-6">
            You don't have permission to access this page. This area is restricted to {allowedRoles.join(" and ")} users only.
          </p>
          <div className="flex gap-3 justify-center">
            <Link to="/">
              <Button variant="outline">Go Home</Button>
            </Link>
            <Link to={role === "vendor" ? "/vendor" : "/account"}>
              <Button>Go to Dashboard</Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
