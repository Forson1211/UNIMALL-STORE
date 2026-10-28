import * as React from "react";
import { createPortal } from "react-dom";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Store,
  BarChart3,
  Settings,
  LogOut,
  ShoppingBag,
  ChevronLeft,
  ChevronRight,
  Palette,
  FileText,
  Bell,
  CreditCard,
  Star,
  Ticket,
  Zap,
  MessageSquare,
  LifeBuoy,
  Scroll,
  Lock,
  Banknote,
  SearchCheck,
  Sparkles,
  CheckCircle2,
  X,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/integrations/api/client";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardSidebarProps {
  type: 'admin' | 'vendor';
}

const adminMenuItems = [
  { 
    title: "Dashboard", 
    url: "/admin", 
    icon: LayoutDashboard,
    allowedRoles: ["admin", "moderator", "vendor_manager", "order_manager", "content_manager", "support_agent"] 
  },
  { 
    title: "Analytics", url: "/admin/analytics", icon: BarChart3, allowedRoles: ["admin", "order_manager"]
  },
  {
    title: "Users", 
    url: "/admin/users", 
    icon: Users,
    allowedRoles: ["admin", "support_agent", "moderator"] 
  },
  { 
    title: "Vendors", 
    url: "/admin/vendors", 
    icon: Store,
    allowedRoles: ["admin", "vendor_manager", "moderator", "support_agent"] 
  },
  { 
    title: "Products", 
    url: "/admin/products", 
    icon: Package,
    allowedRoles: ["admin", "vendor_manager", "moderator", "support_agent"] 
  },
  { 
    title: "Orders", 
    url: "/admin/orders", 
    icon: ShoppingCart,
    allowedRoles: ["admin", "order_manager"] 
  },
  {
    title: "Transactions",
    url: "/admin/transactions",
    icon: CreditCard,
    allowedRoles: ["admin", "order_manager"]
  },
  {
    title: "Payouts",
    url: "/admin/payouts",
    icon: Banknote,
    allowedRoles: ["admin", "order_manager"]
  },
  { 
    title: "Reviews", 
    url: "/admin/reviews", 
    icon: Star,
    allowedRoles: ["admin", "moderator", "content_manager"] 
  },
  { 
    title: "Coupons", 
    url: "/admin/coupons", 
    icon: Ticket,
    allowedRoles: ["admin", "content_manager"] 
  },
  { 
    title: "Flash Deals", 
    url: "/admin/deals", 
    icon: Zap,
    allowedRoles: ["admin", "vendor_manager", "content_manager"] 
  },
  { 
    title: "Messages", 
    url: "/admin/messages", 
    icon: MessageSquare,
    allowedRoles: ["admin", "support_agent"] 
  },
  { 
    title: "Content Management", 
    url: "/admin/content", 
    icon: FileText,
    allowedRoles: ["admin", "content_manager"] 
  },
  { 
    title: "Site Customization", 
    url: "/admin/site-customization", 
    icon: Palette,
    allowedRoles: ["admin", "content_manager"] 
  },
  { 
    title: "Notifications", 
    url: "/admin/notifications", 
    icon: Bell,
    allowedRoles: ["admin", "support_agent", "content_manager"] 
  },
  { 
    title: "Support Tickets", 
    url: "/admin/support", 
    icon: LifeBuoy,
    allowedRoles: ["admin", "support_agent"] 
  },
  { 
    title: "System Logs", 
    url: "/admin/logs", 
    icon: Scroll,
    allowedRoles: ["admin"] 
  },
  { 
    title: "Settings", 
    url: "/admin/settings", 
    icon: Settings,
    allowedRoles: ["admin"] 
  },
];

const vendorMenuItems = [
  { title: "Dashboard", url: "/vendor", icon: LayoutDashboard },
  { title: "Store Profile", url: "/vendor/profile", icon: Store },
  { title: "Products", url: "/vendor/products", icon: Package },
  { title: "Catalog Health", url: "/vendor/catalog-health", icon: SearchCheck },
  { title: "Sales Insights", url: "/vendor/sales-insights", icon: BarChart3 },
  { title: "Orders", url: "/vendor/orders", icon: ShoppingCart },
  { title: "Inventory Priorities", url: "/vendor/inventory", icon: Zap },
  { title: "Campus Offers", url: "/vendor/coupons", icon: Ticket },
  { title: "Customer Trust", url: "/vendor/reviews", icon: Star },
  { title: "Notifications", url: "/vendor/notifications", icon: Bell },
  { title: "Settings & Payouts", url: "/vendor/settings", icon: Settings },
];

export function DashboardSidebar({ type }: DashboardSidebarProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const { role, profile, signOut } = useAuth();
  const { siteName, logoUrl, sidebarLogoUrl } = useSiteSettingsContext();
  const collapsed = state === "collapsed" && !isMobile;
  const [signingOut, setSigningOut] = React.useState(false);
  const contentRef = React.useRef<HTMLDivElement>(null);
  React.useEffect(() => {
    try { if (contentRef.current) contentRef.current.scrollTop = Number(sessionStorage.getItem(`sidebar-scroll-${type}`) || 0); } catch { /* Storage may be unavailable. */ }
  }, [type]);
  const availableItems: { title: string; url: string; icon: typeof Store; allowedRoles?: string[] }[] = type === "admin" ? adminMenuItems : vendorMenuItems;
  const menuItems = availableItems.filter(item => !item.allowedRoles || role === "admin" || item.allowedRoles.includes(role || ""));
  const sections = type === "admin" ? [
    { label: "Overview", paths: ["/admin", "/admin/analytics"] },
    { label: "Marketplace", paths: ["/admin/users", "/admin/vendors", "/admin/products", "/admin/orders", "/admin/reviews", "/admin/coupons", "/admin/deals"] },
    { label: "Operations", paths: ["/admin/transactions", "/admin/payouts", "/admin/messages", "/admin/support", "/admin/notifications"] },
    { label: "Website & settings", paths: ["/admin/content", "/admin/site-customization", "/admin/logs", "/admin/settings"] },
  ] : [
    { label: "Overview", paths: ["/vendor", "/vendor/sales-insights"] },
    { label: "Store management", paths: ["/vendor/products", "/vendor/orders", "/vendor/catalog-health", "/vendor/inventory", "/vendor/coupons", "/vendor/reviews"] },
    { label: "Your account", paths: ["/vendor/profile", "/vendor/notifications", "/vendor/settings"] },
  ];
  const closeMobile = () => { if (isMobile) setOpenMobile(false); };
  const logout = async () => {
    setSigningOut(true);
    try { await signOut(); closeMobile(); navigate("/login"); }
    catch { toast.error("Could not sign out. Please try again."); }
    finally { setSigningOut(false); }
  };
  return <Sidebar collapsible="icon" className="border-r border-sidebar-border bg-sidebar text-sidebar-foreground">
    <SidebarHeader className="h-[84px] flex-row items-center justify-between gap-2 px-5 py-5 group-data-[collapsible=icon]:px-3">
      <Link to="/" aria-label={`${siteName || "Unimall"} home`} onClick={closeMobile} className="flex min-w-0 items-center gap-2">
        {collapsed ? <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary"><ShoppingBag className="h-6 w-6" /></span> : <img src={logoUrl || sidebarLogoUrl || "/LOGO.png"} alt={siteName || "Unimall"} className="h-9 w-auto max-w-[154px] object-contain object-left" />}
      </Link>
      {!collapsed && <button type="button" onClick={toggleSidebar} aria-label={isMobile ? "Close navigation" : "Collapse navigation"} className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground">{isMobile ? <X className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}</button>}
    </SidebarHeader>
    <SidebarContent ref={contentRef} className="gap-1 px-3 pb-4" onScroll={event => { try { sessionStorage.setItem(`sidebar-scroll-${type}`, String(event.currentTarget.scrollTop)); } catch { /* Storage may be unavailable. */ } }}>
      {sections.map(section => {
        const links = menuItems.filter(item => section.paths.includes(item.url));
        if (!links.length) return null;
        return <SidebarGroup key={section.label} className="px-0 py-1">
          <SidebarGroupLabel className="mb-1 mt-2 h-7 px-3 text-[10px] font-medium uppercase tracking-[0.11em] text-muted-foreground/80">{section.label}</SidebarGroupLabel>
          <SidebarGroupContent><SidebarMenu className="gap-1">{links.map(item => {
            const active = location.pathname === item.url || (item.url !== `/${type}` && location.pathname.startsWith(item.url + "/"));
            return <SidebarMenuItem key={item.url}><SidebarMenuButton asChild tooltip={item.title} isActive={active} className="h-[41px] rounded-md px-3 text-[13px] font-medium text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground data-[active=true]:bg-primary data-[active=true]:font-medium data-[active=true]:text-white data-[active=true]:shadow-[0_3px_8px_-3px_hsl(var(--primary)/0.5)] group-data-[collapsible=icon]:!h-10 group-data-[collapsible=icon]:!w-10">
              <Link to={item.url} onClick={closeMobile} aria-current={active ? "page" : undefined}><item.icon className="!h-[19px] !w-[19px] shrink-0" strokeWidth={1.6} /><span className="ml-1 truncate">{item.title}</span>{active && !collapsed && <span className="ml-auto h-1.5 w-1.5 rounded-full bg-white/80" />}</Link>
            </SidebarMenuButton></SidebarMenuItem>;
          })}</SidebarMenu></SidebarGroupContent>
        </SidebarGroup>;
      })}
    </SidebarContent>
    <SidebarFooter className="gap-1 border-t border-sidebar-border px-3 py-3">
      {!collapsed && type === "vendor" && <div className="mb-2 rounded-md border border-border bg-muted/40 px-3 py-2.5"><p className="truncate text-xs font-semibold">{profile?.store_name || "Your Unimall store"}</p><p className="mt-1 text-[11px] text-muted-foreground">{profile?.verified ? "Verified merchant" : "Your campus business"}</p></div>}
      <SidebarMenu>
        {role === "admin" && <SidebarMenuItem><SidebarMenuButton asChild tooltip={type === "admin" ? "Seller Dashboard" : "Admin Hub"} className="h-9 rounded-md px-3 text-xs"><Link to={type === "admin" ? "/vendor" : "/admin"} onClick={closeMobile}>{type === "admin" ? <Store className="h-4 w-4" /> : <ShieldCheck className="h-4 w-4" />}<span>{type === "admin" ? "Seller Dashboard" : "Admin Hub"}</span></Link></SidebarMenuButton></SidebarMenuItem>}
        <SidebarMenuItem><SidebarMenuButton asChild tooltip="Back to marketplace" className="h-9 rounded-md px-3 text-xs"><Link to="/" onClick={closeMobile}><ShoppingBag className="h-4 w-4" /><span>Back to marketplace</span></Link></SidebarMenuButton></SidebarMenuItem>
        <SidebarMenuItem><SidebarMenuButton onClick={logout} disabled={signingOut} tooltip="Sign out" className="h-9 rounded-md px-3 text-xs text-rose-500 hover:bg-rose-500/5 hover:text-rose-600"><LogOut className="h-4 w-4" /><span>{signingOut ? "Signing out..." : "Sign out"}</span></SidebarMenuButton></SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  </Sidebar>;
}
