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
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-100 dark:border-border bg-white/95 dark:bg-card/95 backdrop-blur-md px-4 lg:px-6 shadow-sm">
      <div className="flex items-center gap-3">
        <SidebarTrigger className="lg:hidden p-2 hover:bg-gray-100 rounded-lg" />
        <h1 className="text-lg font-bold text-gray-900 dark:text-white tracking-tight">{title}</h1>
      </div>

      <div className="flex items-center gap-3">
        {/* Search Input with Shortcut Badge */}
        <div className="relative hidden md:block w-72">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Search projects, products, vendors..."
            className="pl-10 pr-10 h-9 text-xs rounded-full bg-gray-50 dark:bg-muted border-gray-200 dark:border-border focus-visible:ring-[#FF5500]"
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-semibold text-gray-400 bg-white dark:bg-card px-1.5 py-0.5 rounded border border-gray-200 shadow-2xs">
            ⌘K
          </span>
        </div>

        {/* Date Filter Pill */}
        <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-muted border border-gray-200 dark:border-border rounded-full text-xs font-semibold text-gray-600 dark:text-gray-300">
          <span>📅</span>
          <span>{new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
        </div>

        {/* Notifications Bell */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="relative w-9 h-9 rounded-full hover:bg-gray-100 dark:hover:bg-muted">
              <Bell className="h-4 h-4 text-gray-600 dark:text-gray-300" />
              {notifications.length > 0 && (
                <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-[#FF5500] rounded-full ring-2 ring-white dark:ring-card animate-pulse" />
              )}
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80 p-1 shadow-xl border-gray-100">
            <DropdownMenuLabel className="px-3 py-2 text-xs font-bold text-gray-500 uppercase tracking-wider">
              Notifications ({notifications.length})
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            {notifications.length === 0 ? (
              <div className="p-6 text-xs text-center text-gray-400">
                No new notifications
              </div>
            ) : (
              notifications.map((note, i) => (
                <DropdownMenuItem key={i} className="p-3 rounded-lg flex flex-col items-start gap-1 cursor-pointer hover:bg-orange-50/50" onClick={() => note.link && navigate(note.link)}>
                  <span className="font-bold text-xs text-gray-900">{note.title}</span>
                  <span className="text-xs text-gray-500">{note.message}</span>
                </DropdownMenuItem>
              ))
            )}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* User Profile Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-2.5 pl-2 pr-3 py-1.5 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-muted">
              <div className="relative">
                <Avatar className="h-8 w-8 ring-2 ring-orange-500/20">
                  <AvatarImage src={profile?.avatar_url || ""} />
                  <AvatarFallback className="bg-gradient-to-br from-[#FF5500] to-[#FF2D55] text-white text-xs font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-white dark:border-card rounded-full" />
              </div>
              <div className="hidden md:flex flex-col items-start text-left">
                <span className="text-xs font-bold text-gray-900 dark:text-white leading-tight">{displayName}</span>
                <span className="text-[10px] font-semibold text-gray-400 leading-tight">{displayRole}</span>
              </div>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52 shadow-xl border-gray-100">
            <DropdownMenuLabel className="font-bold text-xs text-gray-700">Account Actions</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate(role === 'vendor' ? '/vendor/profile' : '/profile')}>
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/admin/site-customization')}>
              Site Customization
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-rose-600 font-bold" onClick={handleLogout}>
              Logout
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
