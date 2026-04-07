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
  MessageSquare,
  LifeBuoy,
  Scroll,
} from "lucide-react";
import { useSiteSettingsContext } from "@/contexts/SiteSettingsContext";

interface DashboardSidebarProps {
  type: 'admin' | 'vendor';
}

const adminMenuItems = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Users", url: "/admin/users", icon: Users },
  { title: "Vendors", url: "/admin/vendors", icon: Store },
  { title: "Products", url: "/admin/products", icon: Package },
  { title: "Orders", url: "/admin/orders", icon: ShoppingCart },
  { title: "Transactions", url: "/admin/transactions", icon: CreditCard },
  { title: "Reviews", url: "/admin/reviews", icon: Star },
  { title: "Coupons", url: "/admin/coupons", icon: Ticket },
  { title: "Messages", url: "/admin/messages", icon: MessageSquare },
  { title: "Content Management", url: "/admin/content", icon: FileText },
  { title: "Site Customization", url: "/admin/site-customization", icon: Palette },
  { title: "Notifications", url: "/admin/notifications", icon: Bell },
  { title: "Support Tickets", url: "/admin/support", icon: LifeBuoy },
  { title: "System Logs", url: "/admin/logs", icon: Scroll },
  { title: "Settings", url: "/admin/settings", icon: Settings },
];

const vendorMenuItems = [
  { title: "Dashboard", url: "/vendor", icon: LayoutDashboard },
  { title: "Products", url: "/vendor/products", icon: Package },
  { title: "Orders", url: "/vendor/orders", icon: ShoppingCart },
  { title: "Settings", url: "/vendor/settings", icon: Settings },
];

export function DashboardSidebar({ type }: DashboardSidebarProps) {
  const location = useLocation();
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
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
        <Link to="/" className="flex items-center gap-2" onClick={handleMobileClick}>
          {logoUrl ? (
            <img src={logoUrl} alt={siteName} className="w-10 h-10 rounded-xl object-contain bg-background" />
          ) : (
            <div className="w-10 h-10 rounded-xl bg-gradient-primary flex items-center justify-center shadow-md shrink-0">
              <ShoppingBag className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          {!collapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-bold text-gradient-primary">{siteName}</span>
              <span className="text-xs text-muted-foreground capitalize">{type} Portal</span>
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
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive(item.url)}
                    tooltip={collapsed ? item.title : undefined}
                    onClick={handleMobileClick}
                  >
                    <Link to={item.url} className="flex items-center gap-3">
                      <item.icon className="w-5 h-5 shrink-0" />
                      {!collapsed && <span>{item.title}</span>}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
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
