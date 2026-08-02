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
  const { siteName, logoUrl, sidebarLogoUrl, footerLogoUrl } = useSiteSettingsContext();

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
    <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-[#0B132B] text-slate-300 border-r border-slate-800/80 transition-all duration-300`} collapsible="icon" data-state={state}>
      {/* Header / Brand Logo */}
      <SidebarHeader className="h-16 flex items-center justify-start border-b border-slate-800/80 p-0 px-4 bg-[#0B132B] shrink-0">
        <Link to="/" className="flex items-center group pl-2.5" onClick={handleMobileClick}>
          {collapsed ? (
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#FF5500] to-[#FF007F] p-0.5 flex items-center justify-center shadow-lg shadow-orange-500/20">
              <div className="w-full h-full bg-[#0B132B] rounded-[10px] flex items-center justify-center">
                <img src={sidebarLogoUrl || footerLogoUrl || "/FOOTER LOGO.png"} alt={siteName} className="w-6 h-6 object-contain" />
              </div>
            </div>
          ) : (
            <img 
              src={sidebarLogoUrl || footerLogoUrl || "/FOOTER LOGO.png"} 
              alt={siteName || "UNIMALL"} 
              className="h-8 md:h-9 w-auto max-w-[165px] object-contain drop-shadow-md transition-transform hover:scale-[1.02]" 
            />
          )}
        </Link>
      </SidebarHeader>

      {/* Main Navigation Content */}
      <SidebarContent className="p-0 px-4 py-3 bg-[#0B132B] space-y-4 no-scrollbar" ref={contentRef}>
        <SidebarGroup className="p-0">
          {!collapsed && (
            <SidebarGroupLabel className="text-[10px] font-extrabold tracking-widest text-slate-400 uppercase p-0 px-2.5 mb-2">
              NAVIGATION
            </SidebarGroupLabel>
          )}
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {menuItems.map((item) => {
                const access = hasAccess(item);
                const active = isActive(item.url);
                return (
                  <SidebarMenuItem key={item.title}>
                    <SidebarMenuButton
                      asChild={access}
                      isActive={active}
                      tooltip={collapsed ? (access ? item.title : `${item.title} (Locked)`) : undefined}
                      onClick={access ? handleMobileClick : undefined}
                      className={`w-full flex items-center gap-3 px-2.5 py-2.5 rounded-xl text-xs font-semibold transition-colors duration-150 ${
                        active
                          ? "bg-gradient-to-r from-[#FF5500] to-[#FF2D55] !text-white data-[active=true]:!text-white shadow-lg shadow-orange-500/25 font-bold"
                          : access
                          ? "text-slate-300 hover:text-white hover:bg-slate-800/60"
                          : "opacity-40 cursor-not-allowed text-slate-500"
                      }`}
                      disabled={!access}
                    >
                      {access ? (
                        <Link to={item.url} className={`flex items-center gap-3 w-full ${active ? "!text-white" : ""}`}>
                          <item.icon className={`w-4 h-4 shrink-0 ${active ? "!text-white" : ""}`} />
                          {!collapsed && <span className={`flex-1 ${active ? "!text-white" : ""}`}>{item.title}</span>}
                        </Link>
                      ) : (
                        <div className="flex items-center gap-3 w-full text-slate-500">
                          <item.icon className="w-4 h-4 shrink-0" />
                          {!collapsed && <span className="flex-1">{item.title}</span>}
                          {!collapsed && <Lock className="w-3.5 h-3.5 text-slate-600" />}
                        </div>
                      )}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Promo / Upgrade Card Widget at Sidebar Bottom (TaskHive Style) */}
        {!collapsed && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#161f36] to-[#0d1527] border border-slate-800 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-[#FF5500]/10 rounded-full blur-xl pointer-events-none" />
            <div className="flex items-center gap-2 mb-2">
              <span className="p-1.5 rounded-lg bg-[#FF5500]/20 text-[#FF5500]">
                <Zap className="w-4 h-4 fill-[#FF5500]" />
              </span>
              <span className="text-xs font-bold text-white">Campus Pro Hub</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
              Real-time analytics & multi-campus store monitoring.
            </p>
            <Link to="/admin/site-customization">
              <Button size="sm" className="w-full h-8 text-xs font-bold bg-gradient-to-r from-[#FF5500] to-[#FF2D55] hover:opacity-90 text-white shadow-md border-0 rounded-lg">
                Manage Platform
              </Button>
            </Link>
          </div>
        )}
      </SidebarContent>

      {/* Sidebar Footer */}
      <SidebarFooter className="border-t border-slate-800/80 p-3 bg-[#0B132B]">
        <Button
          variant="ghost"
          size="icon"
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800/60 mb-2 h-8 rounded-lg"
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
        <SidebarMenu className="space-y-1">
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Back to Store" : undefined} onClick={handleMobileClick} className="text-slate-400 hover:text-white hover:bg-slate-800/60 rounded-xl">
              <Link to="/" className="flex items-center gap-3">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-xs font-medium">Back to Store</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip={collapsed ? "Logout" : undefined} onClick={handleMobileClick} className="text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl">
              <Link to="/login" className="flex items-center gap-3">
                <LogOut className="w-4 h-4 shrink-0" />
                {!collapsed && <span className="text-xs font-bold">Logout</span>}
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
