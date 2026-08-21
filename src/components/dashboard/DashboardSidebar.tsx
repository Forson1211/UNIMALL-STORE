import * as React from "react";
import { createPortal } from "react-dom";
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
  SearchCheck,
  Sparkles,
  CheckCircle2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
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
  const { state, toggleSidebar, isMobile, setOpenMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const { role } = useAuth();
  const menuItems = type === 'admin' ? adminMenuItems : vendorMenuItems;
  const { siteName, logoUrl, sidebarLogoUrl, footerLogoUrl } = useSiteSettingsContext();

  const isActive = (path: string) => {
    const [pathname, hash] = path.split("#");
    if (pathname === `/${type}`) {
      if (hash) return location.pathname === pathname && location.hash === `#${hash}`;
      return location.pathname === pathname && !location.hash;
    }
    return location.pathname === pathname || location.pathname.startsWith(`${pathname}/`);
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

  const { user } = useAuth();
  const [isProModalOpen, setIsProModalOpen] = React.useState(false);
  const [proPlan, setProPlan] = React.useState<"monthly" | "yearly">("monthly");
  const [momoNetwork, setMomoNetwork] = React.useState<"MTN" | "Telecel" | "AT">("MTN");
  const [momoPhone, setMomoPhone] = React.useState("");
  const [isSubscribing, setIsSubscribing] = React.useState(false);
  const [isProActive, setIsProActive] = React.useState(false);

  React.useEffect(() => {
    if (user?.id) {
      const savedPro = localStorage.getItem(`unimall_vendor_pro_${user.id}`);
      if (savedPro === "true") {
        setIsProActive(true);
      }
    }
  }, [user?.id]);

  const handleActivatePro = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!momoPhone.trim() || momoPhone.replace(/[^0-9]/g, "").length < 9) {
      toast.error("Please enter a valid Ghana Mobile Money number (e.g. 024 123 4567)");
      return;
    }

    setIsSubscribing(true);
    await new Promise((r) => setTimeout(r, 1200));

    if (user?.id) {
      localStorage.setItem(`unimall_vendor_pro_${user.id}`, "true");
      try {
        await supabase.from("profiles").update({
          is_pro: true,
          verified: true,
          pro_plan: proPlan,
          pro_activated_at: new Date().toISOString(),
        } as any).eq("id", user.id);
      } catch (err) {
        console.warn("Error updating pro status in DB:", err);
      }
    }

    setIsProActive(true);
    setIsSubscribing(false);
    setIsProModalOpen(false);

    toast.success("🌟 Pro Subscription Activated!", {
      description: "Your store and listings now have Top Homepage Placement, Verified Pro Badge, and WhatsApp leads enabled!",
    });
  };

  return (
    <>
      <Sidebar className={`${collapsed ? "w-16" : "w-64"} bg-[#0B132B] text-slate-300 border-r border-slate-800/80 transition-all duration-300`} collapsible="icon" data-state={state}>
        {/* Header / Brand Logo */}
        <SidebarHeader className="h-16 flex items-center justify-start border-b border-slate-800/80 px-4 bg-[#0B132B] shrink-0">
        <Link to="/" className="flex items-center justify-start group px-2.5 w-full" onClick={handleMobileClick}>
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
              className="h-10 md:h-11 w-auto max-w-[185px] object-contain object-left drop-shadow-md transition-transform hover:scale-[1.02]" 
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
                      tooltip={collapsed ? (access ? item.title : `${item.title} (Locked)`) : undefined}
                      isActive={active}
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

        {/* Promo / Upgrade Card Widget at Sidebar Bottom */}
        {!collapsed && (
          <div className="mt-6 p-4 rounded-2xl bg-gradient-to-br from-slate-900 via-[#161f36] to-[#0d1527] border border-slate-800 text-white relative overflow-hidden shadow-xl">
            <div className="absolute -right-3 -bottom-3 w-20 h-20 bg-[#FF5500]/15 rounded-full blur-xl pointer-events-none" />
            
            {type === 'vendor' ? (
              isProActive ? (
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="p-1.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-xs">
                      <ShieldCheck className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black text-amber-400">Verified Pro Active</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    Your campus store and products are featured at the top of the homepage.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => setIsProModalOpen(true)}
                    className="w-full h-8 text-xs font-black uppercase tracking-wider bg-slate-800 hover:bg-slate-700 text-white shadow-md border border-slate-700 rounded-xl cursor-pointer"
                  >
                    Manage Pro Pass
                  </Button>
                </>
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span className="p-1.5 rounded-lg bg-gradient-to-r from-[#FF5500] to-[#FF2D55] text-white shadow-xs">
                      <Store className="w-4 h-4" />
                    </span>
                    <span className="text-xs font-black text-white">Vendor Pro Hub</span>
                  </div>
                  <p className="text-[11px] text-slate-300 leading-relaxed mb-3">
                    Feature your products on top of the homepage & get 5x more campus sales.
                  </p>
                  <Button 
                    size="sm" 
                    onClick={() => setIsProModalOpen(true)}
                    className="w-full h-8 text-xs font-black uppercase tracking-wider bg-gradient-to-r from-[#FF5500] to-[#FF2D55] hover:opacity-90 text-white shadow-md border-0 rounded-xl cursor-pointer"
                  >
                    Feature My Store
                  </Button>
                </>
              )
            ) : (
              <>
                <div className="flex items-center gap-2 mb-2">
                  <span className="p-1.5 rounded-lg bg-[#FF5500]/20 text-[#FF5500]">
                    <Zap className="w-4 h-4 fill-[#FF5500]" />
                  </span>
                  <span className="text-xs font-bold text-white">Campus Admin Hub</span>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed mb-3">
                  Real-time analytics & multi-campus store monitoring.
                </p>
                <Link to="/admin/site-customization">
                  <Button size="sm" className="w-full h-8 text-xs font-bold bg-gradient-to-r from-[#FF5500] to-[#FF2D55] hover:opacity-90 text-white shadow-md border-0 rounded-lg">
                    Manage Platform
                  </Button>
                </Link>
              </>
            )}
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

    {/* Vendor Pro & Feature Subscription Modal - Rendered cleanly into document.body */}
    {isProModalOpen && typeof document !== "undefined" && createPortal(
      <div 
        className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
        onClick={(e) => {
          if (e.target === e.currentTarget && !isSubscribing) setIsProModalOpen(false);
        }}
      >
        <div 
          className="relative w-full max-w-lg rounded-3xl border border-slate-800 bg-[#0B132B] text-white p-6 sm:p-7 shadow-2xl animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Close button */}
          <button
            type="button"
            disabled={isSubscribing}
            onClick={() => setIsProModalOpen(false)}
            className="absolute top-5 right-5 w-8 h-8 rounded-full bg-slate-800/80 text-slate-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Header */}
          <div className="text-left space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gradient-to-r from-[#FF5500]/20 to-[#FF2D55]/20 border border-[#FF5500]/30 text-[#FF8A5B] text-xs font-black uppercase tracking-wider w-fit">
              <Sparkles className="w-3.5 h-3.5" /> Vendor Pro Spotlight
            </div>
            <h3 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Feature Your Products on Top
            </h3>
            <p className="text-xs sm:text-sm text-slate-300">
              Upgrade your campus storefront to Pro to secure top placement across homepage carousels and campus search results.
            </p>
          </div>

          <form onSubmit={handleActivatePro} className="space-y-4 mt-4">
            {/* Pricing Selector Tabs */}
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setProPlan("monthly")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                  proPlan === "monthly"
                    ? "border-[#FF5500] bg-[#FF5500]/15 text-white shadow-md ring-1 ring-[#FF5500]/50"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A5B] block">Monthly Boost</span>
                <span className="text-xl font-black text-white block mt-0.5">GH₵ 25 <span className="text-xs font-normal text-slate-400">/ mo</span></span>
                <span className="text-[11px] text-slate-400 block mt-1">Billed monthly</span>
              </button>

              <button
                type="button"
                onClick={() => setProPlan("yearly")}
                className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative overflow-hidden ${
                  proPlan === "yearly"
                    ? "border-[#FF5500] bg-[#FF5500]/15 text-white shadow-md ring-1 ring-[#FF5500]/50"
                    : "border-slate-800 bg-slate-900/40 text-slate-400 hover:border-slate-700"
                }`}
              >
                <span className="absolute top-2 right-2 px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[9px] font-black">SAVE GH₵ 50</span>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#FF8A5B] block">Annual Pass</span>
                <span className="text-xl font-black text-white block mt-0.5">GH₵ 250 <span className="text-xs font-normal text-slate-400">/ yr</span></span>
                <span className="text-[11px] text-slate-400 block mt-1">Billed annually</span>
              </button>
            </div>

            {/* Key Pro Benefits */}
            <div className="space-y-2.5 bg-slate-900/60 p-4 rounded-2xl border border-slate-800/80">
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Top Homepage Placement:</strong> Featured on the homepage hero swiper and top promo showcases.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>5x Campus Search Visibility:</strong> Products rank at the top of category & campus searches.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Verified Pro Seller Badge:</strong> Golden trust shield on your storefront and product cards.</span>
              </div>
              <div className="flex items-start gap-2.5 text-xs text-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <span><strong>Direct WhatsApp Inquiries:</strong> Instant buyer chat button directly to your phone.</span>
              </div>
            </div>

            {/* Mobile Money Payment Inputs */}
            <div className="space-y-3 bg-slate-900/90 p-4 rounded-2xl border border-slate-800">
              <label className="text-xs font-extrabold uppercase tracking-wider text-slate-300 block">
                Select Mobile Money Network
              </label>
              
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "MTN", name: "MTN MoMo", color: "border-amber-500 bg-amber-500/10 text-amber-300" },
                  { id: "Telecel", name: "Telecel Cash", color: "border-rose-500 bg-rose-500/10 text-rose-300" },
                  { id: "AT", name: "AT Money", color: "border-blue-500 bg-blue-500/10 text-blue-300" },
                ].map((net) => (
                  <button
                    key={net.id}
                    type="button"
                    onClick={() => setMomoNetwork(net.id as any)}
                    className={`py-2 px-1 text-center rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                      momoNetwork === net.id 
                        ? `${net.color} shadow-sm ring-1 ring-white/20` 
                        : "border-slate-800 bg-slate-950/40 text-slate-400 hover:text-slate-200"
                    }`}
                  >
                    {net.name}
                  </button>
                ))}
              </div>

              <div className="space-y-1 pt-1">
                <label className="text-[11px] font-bold text-slate-400 block">
                  MoMo Number to Bill (GH₵ {proPlan === "monthly" ? "25.00" : "250.00"})
                </label>
                <input
                  type="tel"
                  placeholder="e.g. 024 123 4567"
                  value={momoPhone}
                  onChange={(e) => setMomoPhone(e.target.value)}
                  required
                  className="w-full h-10 px-3 rounded-xl border border-slate-700 bg-slate-950 text-sm font-semibold text-white focus:outline-none focus:border-[#FF5500]"
                />
              </div>
            </div>

            <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-2 sm:gap-2 pt-2 border-t border-slate-800">
              <Button 
                type="button" 
                variant="ghost" 
                disabled={isSubscribing}
                onClick={() => setIsProModalOpen(false)}
                className="text-slate-400 hover:text-white rounded-xl text-xs font-bold"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubscribing}
                className="bg-gradient-to-r from-[#FF5500] to-[#FF2D55] hover:opacity-90 text-white font-black text-xs uppercase tracking-wider h-11 px-6 rounded-xl shadow-lg cursor-pointer flex items-center justify-center gap-2"
              >
                {isSubscribing ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    <span>Authorizing MoMo...</span>
                  </>
                ) : (
                  <span>Subscribe with Mobile Money</span>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>,
      document.body
    )}
    </>
  );
}
