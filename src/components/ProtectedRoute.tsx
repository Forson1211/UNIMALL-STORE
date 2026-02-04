import { ReactNode } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ShieldAlert } from "lucide-react";
import { Link } from "react-router-dom";

interface ProtectedRouteProps {
  children: ReactNode;
  allowedRoles?: ("admin" | "vendor" | "buyer")[];
  requireAuth?: boolean;
}

export function ProtectedRoute({
  children,
  allowedRoles,
  requireAuth = true
}: ProtectedRouteProps) {
  const { user, role, isLoading } = useAuth();
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

  // Check if user has required role
  // Admins can access everything
  if (allowedRoles && role) {
    const hasAccess = role === "admin" || allowedRoles.includes(role);

    if (!hasAccess) {
      // Show access denied page
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
  }

  return <>{children}</>;
}
