import * as React from "react";
import { Link, useLocation } from "react-router-dom";
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
} from "lucide-react";
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
  { title: "Products", url: "/vendor/products", icon: Package },
  { title: "Orders", url: "/vendor/orders", icon: ShoppingCart },
  { title: "Coupons", url: "/vendor/coupons", icon: Ticket },
  { title: "Reviews", url: "/vendor/reviews", icon: Star },
  { title: "Notifications", url: "/vendor/notifications", icon: Bell },
  { title: "Settings", url: "/vendor/settings", icon: Settings },
];

export function DashboardSidebar({ type }: DashboardSidebarProps) {
  const location = useLocation();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { role } = useAuth();
  const menuItems = type === 'admin' ? adminMenuItems : vendorMenuItems;
  const { siteName, logoUrl } = useSiteSettingsContext();

  const isActive = (path: string) => {
    if (path === `/${type}`) {
      // Exact match only for dashboard home
      return location.pathname === path;
    }
    // For others, check for exact match OR sub-route match (if path ends in /)
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const hasAccess = (item: any) => {
    if (!item.allowedRoles) return true;
    if (role === 'admin') return true;
    return item.allowedRoles.includes(role);
  };

  // Scroll Restoration for Sidebar
  const contentRef = React.useRef<HTMLDivElement>(null);
  
  React.useEffect(() => {
    const savedScrollPos = sessionStorage.getItem(`sidebar-scroll-${type}`);
    if (savedScrollPos && contentRef.current) {
      contentRef.current.scrollTop = parseInt(savedScrollPos, 10);
    }

    const handleScroll = () => {
      if (contentRef.current) {
        sessionStorage.setItem(`sidebar-scroll-${type}`, contentRef.current.scrollTop.toString());
      }
    };

    const currentRef = contentRef.current;
    if (currentRef) {
      currentRef.addEventListener('scroll', handleScroll);
    }
    return () => {
      if (currentRef) {
        currentRef.removeEventListener('scroll', handleScroll);
      }
    };
  }, [type]);

  const handleMobileClick = () => {
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Sidebar className={collapsed ? "w-16" : "w-64"} collapsible="icon" data-state={state}>
      <SidebarHeader className="border-b border-sidebar-border p-4">
        <Link to="/" className="flex items-center" onClick={handleMobileClick}>
          {collapsed ? (
            <img src={logoUrl || "/LOGO.png"} alt={siteName} className="w-10 h-10 rounded-md object-contain bg-white border border-gray-100" />
          ) : (
            <div className="flex flex-col items-start gap-1">
              <img src={logoUrl || "/LOGO.png"} alt={siteName} className="h-10 w-auto object-contain" />
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider pl-0.5">{type} Portal</span>
            </div>
          )}
        </Link>
      </SidebarHeader>

      <SidebarContent className="p-2" ref={contentRef}>
        <SidebarGroup>
          <SidebarGroupLabel className={collapsed ? "sr-only" : ""}>
            Menu
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => {
                const access = hasAccess(item);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={access}
                      isActive={isActive(item.url)}
                      tooltip={collapsed ? (access ? item.title : `${item.title} (Locked)`) : undefined}
                      onClick={access ? handleMobileClick : undefined}
                      className={!access ? "opacity-50 cursor-not-allowed" : ""}
                      disabled={!access}
                    >
                      {access ? (
                        <Link to={item.url} className="flex items-center gap-3 w-full">
                          <item.icon className="w-5 h-5 shrink-0" />
                          {!collapsed && <span className="flex-1">{item.title}</span>}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 w-full text-muted-foreground">
                          <item.icon className="w-5 h-5 shrink-0" />
                          {!collapsed && <span className="flex-1">{item.title}</span>}
                          {!collapsed && <Lock className="w-3.5 h-3.5 text-muted-foreground/60" />}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center mb-2"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Back to Store" : undefined} onClick={handleMobileClick}>
              <Link to="/" className="flex items-center gap-3 text-muted-foreground">
                <ShoppingBag className="w-5 h-5 shrink-0" />
                {!collapsed && <span>Back to Store</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Logout" : undefined} onClick={handleMobileClick}>
              <Link to="/login" className="flex items-center gap-3 text-destructive">
                <LogOut className="w-5 h-5 shrink-0" />
                {!collapsed && <span>Logout</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
