import { Bell, Search, LayoutGrid, Store, ShieldCheck, LogOut, UserRound } from "lucide-react";
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
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from 'sonner';
import { api } from "@/integrations/api/client";
import { useNavigate } from "react-router-dom";
import { useState, useRef, useEffect } from "react";
import { ThemeToggle } from "@/components/ThemeToggle";

interface DashboardHeaderProps {
  title: string;
  // Deprecated props, used only as fallbacks if context is missing (though it shouldn't be)
  userName?: string;
  userRole?: string;
}

export function DashboardHeader({ title }: DashboardHeaderProps) {
  const { user, profile, role, signOut } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => { if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); searchRef.current?.focus(); } };
    document.addEventListener("keydown", shortcut); return () => document.removeEventListener("keydown", shortcut);
  }, []);

  // 1. Fetch Real Notifications based on Role
  const { data: notifications = [], error: notificationError } = useQuery({
    queryKey: ["dashboard-notifications", role, user?.id],
    queryFn: async () => {
      const alerts = [];

      if (role === 'admin' || role === 'vendor_manager') {
        // Admin: Check for pending vendors
        try {
          // Casting api to any directly to break deep type instantiation at the root
          const { count } = await (api as any)
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

      const { data, error } = await api.from('notifications').select('id, title, message, link')
        .eq('user_id', user!.id).eq('read', false).order('created_at', { ascending: false }).limit(5);
      if (error) throw error;
      return [...alerts, ...(data || [])];
    },
    enabled: !!user,
    refetchInterval: 15000,
  });

  const openNotification = async (note: { id?: string; link?: string }) => {
    if (note.id) {
      const { error } = await api.from('notifications').update({ read: true }).eq('id', note.id).eq('user_id', user!.id).select('id').single();
      if (error) toast.error('Could not mark this notification as read.');
      else {
        queryClient.invalidateQueries({ queryKey: ['dashboard-notifications'] });
        queryClient.invalidateQueries({ queryKey: ['vendor-notifications'] });
      }
    }
    if (note.link?.startsWith('/') && !note.link.startsWith('//')) navigate(note.link);
  };

  const handleLogout = async () => {
    await signOut();
    navigate("/login");
  };

  const displayName = role === "vendor"
    ? (profile?.store_name || user?.user_metadata?.store_name || profile?.full_name || user?.email?.split('@')[0] || "Vendor")
    : (profile?.full_name || user?.email?.split('@')[0] || "User");
  const displayRole = role ? role.charAt(0).toUpperCase() + role.slice(1) : "Guest";
  const initials = displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();

  return <header className="mx-4 mt-4 flex h-16 shrink-0 items-center justify-between gap-3 rounded-lg border border-border bg-card px-3 shadow-[0_2px_8px_-5px_rgba(47,43,61,0.18)] lg:mx-6 lg:mt-5 lg:px-5">
    <div className="flex min-w-0 flex-1 items-center gap-2">
      <SidebarTrigger className="h-9 w-9 shrink-0 text-muted-foreground" />
      <span className="sr-only">{title}</span>
      <form className="relative flex min-w-0 flex-1 items-center" onSubmit={event => { event.preventDefault(); if (search.trim()) navigate(`/products?search=${encodeURIComponent(search.trim())}`); }}>
        <Search className="pointer-events-none absolute left-1 h-5 w-5 text-muted-foreground" strokeWidth={1.7} />
        <Input ref={searchRef} type="search" aria-label="Search marketplace products" value={search} onChange={event => setSearch(event.target.value)} placeholder="Search marketplace..." className="h-11 min-w-0 border-0 bg-transparent pl-9 pr-3 text-sm shadow-none placeholder:text-muted-foreground/80 focus-visible:ring-0" />
        <kbd className="mr-2 hidden shrink-0 rounded border border-border px-1.5 py-1 font-sans text-[10px] text-muted-foreground md:inline-flex">Ctrl K</kbd>
      </form>
    </div>
    <div className="flex shrink-0 items-center gap-1 sm:gap-2">
      <ThemeToggle />
      <Button variant="ghost" size="icon" aria-label="Open marketplace" onClick={() => navigate("/")} className="hidden h-9 w-9 text-muted-foreground sm:inline-flex"><LayoutGrid className="h-5 w-5" strokeWidth={1.6} /></Button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Notifications" className="relative h-9 w-9 rounded-full text-muted-foreground"><Bell className="h-5 w-5" strokeWidth={1.6} />{notifications.length > 0 && <span className="absolute right-1.5 top-1 h-2 w-2 rounded-full bg-rose-500 ring-2 ring-card" />}</Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-[min(340px,calc(100vw-2rem))] p-1 shadow-lg">
          <DropdownMenuLabel className="flex items-center justify-between px-3 py-3 text-sm font-semibold">Notifications<span className="rounded bg-primary/10 px-2 py-0.5 text-xs text-primary">{notifications.length} new</span></DropdownMenuLabel><DropdownMenuSeparator />
          {notificationError ? <p role="alert" className="p-5 text-sm text-muted-foreground">Could not load notifications.</p> : notifications.length === 0 ? <div className="p-7 text-center text-sm text-muted-foreground"><Bell className="mx-auto mb-2 h-6 w-6 opacity-40" />You're all caught up</div> : notifications.map((note, index) => <DropdownMenuItem key={note.id || index} onClick={() => void openNotification(note)} className="flex cursor-pointer items-start gap-3 rounded-md p-3"><span className="rounded-md bg-primary/10 p-2 text-primary"><Bell className="h-4 w-4" /></span><div><p className="text-xs font-semibold">{note.title}</p><p className="mt-1 text-xs leading-relaxed text-muted-foreground">{note.message}</p></div></DropdownMenuItem>)}
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild><Button variant="ghost" size="icon" aria-label="Account menu" className="relative ml-1 h-10 w-10 rounded-full"><Avatar className="h-9 w-9 ring-2 ring-primary/15"><AvatarImage src={profile?.avatar_url || ""} alt={displayName} /><AvatarFallback className="bg-primary/10 text-xs font-semibold text-primary">{initials}</AvatarFallback></Avatar><span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-card bg-emerald-500" /></Button></DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 p-1 shadow-lg">
          <DropdownMenuLabel className="px-3 py-3"><p className="truncate text-sm font-semibold">{displayName}</p><p className="mt-0.5 text-xs font-normal text-muted-foreground">{displayRole.replace(/_/g, " ")}</p></DropdownMenuLabel><DropdownMenuSeparator />
          {role === "admin" && <DropdownMenuItem onClick={() => navigate("/admin")} className="cursor-pointer gap-2 text-xs"><ShieldCheck className="h-4 w-4" />Admin dashboard</DropdownMenuItem>}
          {["admin", "vendor"].includes(role || "") && <><DropdownMenuItem onClick={() => navigate("/vendor")} className="cursor-pointer gap-2 text-xs"><Store className="h-4 w-4" />Seller Dashboard</DropdownMenuItem><DropdownMenuItem onClick={() => navigate("/vendor/profile")} className="cursor-pointer gap-2 text-xs"><UserRound className="h-4 w-4" />Store profile</DropdownMenuItem></>}
          <DropdownMenuItem onClick={() => navigate("/account")} className="cursor-pointer gap-2 text-xs"><UserRound className="h-4 w-4" />Buyer account</DropdownMenuItem><DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => void handleLogout().catch(() => toast.error("Could not sign out. Please try again."))} className="cursor-pointer gap-2 text-xs text-rose-500"><LogOut className="h-4 w-4" />Sign out</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  </header>;
}
