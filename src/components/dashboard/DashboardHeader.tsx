import { Bell, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

interface DashboardHeaderProps {
  title: string;
  // Deprecated props, used only as fallbacks if context is missing (though it shouldn't be)
  userName?: string;
  userRole?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();

  // 1. Fetch Real Notifications based on Role
  const { data: notifications = [] } = useQuery({
    queryKey: ["dashboard-notifications", role, user?.id],
    queryFn: async () => {
      const alerts = [];

      if (role === 'admin') {
        // Admin: Check for pending vendors
        try {
          // Casting supabase to any directly to break deep type instantiation at the root
          const { count } = await (supabase as any)
            .from('user_roles')
            .select('*', { count: 'exact', head: true })
            .eq('role', 'vendor')
            .eq('vendor_status', 'pending');

          if (count && count > 0) {
            alerts.push({
              title: "Pending Vendors",
              message: `${count} vendor(s) awaiting approval`,
              link: "/admin/vendors",
            });
          }
        } catch (err) {
          console.error("Failed to fetch notifications", err);
        }
      }

      /* Vendor notifications temporarily disabled to simplify type checking until views are generated
      if (role === 'vendor') {
         // Placeholder for future vendor notifications
      } 
      */

      return alerts;
    },
    enabled: !!user,
  });

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = profile?.full_name || user?.email?.split('@')[0] || "User";
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Guest";
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return (
    <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-border bg-background/95 backdrop-blur px-4 lg:px-6">
      <div className="flex items-center gap-4">
        <SidebarTrigger className="lg:hidden" />
        <h1 className="text-xl font-semibold text-foreground">{title}</h1>
      </div>

      <div className="flex items-center gap-4">
        {/* Search */}
        <div className="relative hidden md:block">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            type="text"
            placeholder="Search..."
            className="pl-10 w-64 h-9"
          />
        </div>

        {/* Notifications */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notifications.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-destructive text-[10px] text-destructive-foreground rounded-full flex items-center justify-center">
                  {notifications.length}
                </span>
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-72">
            <DropdownMenuLabel>Notifications</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-4 text-sm text-center text-muted-foreground">
                No new notifications
              </div>
            ) : (
              notifications.map((note, i) => (
                <DropdownMenuItem key={i} className="flex flex-col items-start gap-1 cursor-pointer" onClick={() => note.link && navigate(note.link)}>
                  <span className="font-medium">{note.title}</span>
                  <span className="text-xs text-muted-foreground">{note.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2 px-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={profile?.avatar_url || ""} />
                <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                  {initials}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:flex flex-col items-start">
                <span className="text-sm font-medium">{displayName}</span>
                <span className="text-xs text-muted-foreground">{displayRole}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(role === 'vendor' ? '/vendor/profile' : '/profile')}>
              Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/settings')}>Settings</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
