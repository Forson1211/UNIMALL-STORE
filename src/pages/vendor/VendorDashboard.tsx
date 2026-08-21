import { useState, useEffect, useMemo } from "react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useNavigate, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  DollarSign, TrendingUp, ShoppingBag, ArrowUpRight, Store,
  ChevronRight, ChevronLeft, BarChart2, Package, Users, MessageSquare, Bell,
  Calendar, ArrowRight, Share2, Plus, Download, CheckCircle2,
  MapPin, Clock, Truck, ShieldCheck, Zap, Globe, Send,
  Star, AlertTriangle, RefreshCw, Eye, ExternalLink, Filter, Inbox
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";

const VendorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [salesPeriod, setSalesPeriod] = useState<"Weekly" | "Monthly" | "Semester">("Weekly");
  const [hoveredPoint, setHoveredPoint] = useState<any | null>(null);
  const [outOfStockIndex, setOutOfStockIndex] = useState(0);

  // Delivery team state with live localStorage persistence per vendor
  const [isAddTeamModalOpen, setIsAddTeamModalOpen] = useState(false);
  const [newMemberName, setNewMemberName] = useState("");
  const [newMemberRole, setNewMemberRole] = useState("Legon Main Campus Runner");
  const [newMemberPhone, setNewMemberPhone] = useState("");

  const defaultRunners = [
    { id: 1, name: "Kwesi Mensah", role: "Legon Main Campus Runner", status: "Active", avatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=120&auto=format&fit=crop&q=80" },
    { id: 2, name: "Abena Osei", role: "Pent & Evandy Dispatcher", status: "Active", avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=120&auto=format&fit=crop&q=80" },
    { id: 3, name: "Kofi Darko", role: "Night Market Hub Coordinator", status: "Available", avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=120&auto=format&fit=crop&q=80" },
    { id: 4, name: "Esi Boateng", role: "WhatsApp Orders & Packing", status: "Online", avatar: "https://images.unsplash.com/photo-1517841905240-472988babdf9?w=120&auto=format&fit=crop&q=80" },
  ];

  const [teamMembers, setTeamMembers] = useState(defaultRunners);

  useEffect(() => {
    if (user?.id) {
      const saved = localStorage.getItem(`unimall_vendor_runners_${user.id}`);
      if (saved) {
        try {
          setTeamMembers(JSON.parse(saved));
        } catch {
          // fallback
        }
      }
    }
  }, [user?.id]);

  // 1. LIVE QUERY: Dashboard Summary Stats
  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats", user?.id],
    queryFn: () => vendorService.getDashboardStats(user!.id),
    enabled: !!user,
  });

  // 2. LIVE QUERY: Vendor Products
  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["vendor-products", user?.id],
    queryFn: () => vendorService.getProducts(user!.id),
    enabled: !!user,
  });

  // 3. LIVE QUERY: Vendor Orders
  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", user?.id],
    queryFn: () => vendorService.getOrders(user!.id),
    enabled: !!user,
  });

  // 4. LIVE QUERY: Weekly Sales from Database
  const { data: weeklySales = [] } = useQuery({
    queryKey: ["vendor-weekly-sales", user?.id],
    queryFn: () => vendorService.getWeeklySales(user!.id),
    enabled: !!user,
  });

  // 5. LIVE QUERY: Customer Reviews
  const productIds = useMemo(() => products.map((p: any) => p.id).filter(Boolean), [products]);
  const { data: reviews = [] } = useQuery({
    queryKey: ["vendor-reviews", user?.id, productIds.join(",")],
    queryFn: async () => {
      if (!productIds.length) return [];
      const { data, error } = await supabase
        .from("reviews")
        .select("*")
        .in("product_id", productIds);
      if (error) {
        console.warn("Error fetching reviews:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user && productIds.length > 0,
  });

  const localCache = user?.id ? (() => {
    try {
      return JSON.parse(localStorage.getItem(`unimall_vendor_profile_${user.id}`) || "{}");
    } catch (e) {
      return {};
    }
  })() : {};

  const stats = (statsData || {}) as any;
  const vendorProfile = { ...(localCache || {}), ...(profile || {}) } as any;
  const storeName = vendorProfile.store_name || vendorProfile.full_name || localCache?.store_name || "Campus Vendor";
  const campusLocation = vendorProfile.campus || localCache?.campus || "University of Ghana (Legon)";
  const isProfileComplete = Boolean(
    (vendorProfile.store_name || vendorProfile.full_name || localCache?.store_name || localCache?.full_name)?.trim() &&
    (vendorProfile.campus || localCache?.campus)?.trim() &&
    (vendorProfile.phone || localCache?.phone)?.trim()
  );

  // Format today's date
  const todayFormatted = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // ── LIVE METRIC CALCULATIONS ──
  const totalRevenue = stats?.total_revenue !== undefined && Number(stats.total_revenue) > 0
    ? Number(stats.total_revenue)
    : orders.reduce((sum: number, o: any) => sum + Number(o.vendor_total || o.total_amount || 0), 0);

  const activeProductsCount = products.filter((p: any) => p.is_active !== false).length;
  const pendingInquiriesCount = reviews.filter((r: any) => !r.vendor_reply).length;
  const deliveredCount = orders.filter((o: any) => String(o.order_status || "").toLowerCase() === "delivered").length;
  const fulfillmentRate = orders.length > 0 ? Math.round((deliveredCount / orders.length) * 100) : 100;

  const avgRating = reviews.length > 0
    ? (reviews.reduce((sum: number, r: any) => sum + Number(r.rating || 0), 0) / reviews.length)
    : 5.0;

  // ── LIVE DYNAMIC TIME-SERIES CHART CALCULATION ──
  const chartIntervals = useMemo(() => {
    const now = new Date();

    if (salesPeriod === "Weekly") {
      // Last 7 days: [Day-6, ..., Today]
      return Array.from({ length: 7 }).map((_, i) => {
        const d = new Date(now);
        d.setDate(d.getDate() - (6 - i));
        d.setHours(0, 0, 0, 0);

        const nextD = new Date(d);
        nextD.setDate(nextD.getDate() + 1);

        const dayOrders = orders.filter((o: any) => {
          if (!o.created_at) return false;
          const ordDate = new Date(o.created_at);
          return ordDate >= d && ordDate < nextD;
        });

        const dayRevenue = dayOrders.reduce(
          (sum: number, o: any) => sum + Number(o.vendor_total || o.total_amount || 0),
          0
        );

        return {
          id: i,
          label: i === 6 ? "Today" : d.toLocaleDateString("en-GB", { weekday: "short" }),
          fullDate: d.toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
          revenue: dayRevenue,
          ordersCount: dayOrders.length,
        };
      });
    }

    if (salesPeriod === "Monthly") {
      // Last 4 weeks
      return [3, 2, 1, 0].map((w, i) => {
        const start = new Date(now);
        start.setDate(start.getDate() - (w + 1) * 7);
        const end = new Date(now);
        end.setDate(end.getDate() - w * 7);

        const weekOrders = orders.filter((o: any) => {
          if (!o.created_at) return false;
          const ordDate = new Date(o.created_at);
          return ordDate >= start && ordDate < end;
        });

        const weekRevenue = weekOrders.reduce(
          (sum: number, o: any) => sum + Number(o.vendor_total || o.total_amount || 0),
          0
        );

        return {
          id: i,
          label: `Week ${i + 1}`,
          fullDate: `${start.toLocaleDateString("en-GB", { day: "numeric", month: "short" })} - ${end.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`,
          revenue: weekRevenue,
          ordersCount: weekOrders.length,
        };
      });
    }

    // Semester (Last 6 Months)
    return Array.from({ length: 6 }).map((_, i) => {
      const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
      const nextM = new Date(now.getFullYear(), now.getMonth() - (5 - i) + 1, 1);

      const monthOrders = orders.filter((o: any) => {
        if (!o.created_at) return false;
        const ordDate = new Date(o.created_at);
        return ordDate >= d && ordDate < nextM;
      });

      const monthRevenue = monthOrders.reduce(
        (sum: number, o: any) => sum + Number(o.vendor_total || o.total_amount || 0),
        0
      );

      return {
        id: i,
        label: d.toLocaleDateString("en-GB", { month: "short" }),
        fullDate: d.toLocaleDateString("en-GB", { month: "long", year: "numeric" }),
        revenue: monthRevenue,
        ordersCount: monthOrders.length,
      };
    });
  }, [salesPeriod, orders]);

  // Max revenue in current period for scaling
  const maxPeriodRevenue = useMemo(() => {
    const max = Math.max(...chartIntervals.map((it) => it.revenue), 0);
    return max > 0 ? max : 100;
  }, [chartIntervals]);

  // Identify the peak interval
  const peakInterval = useMemo(() => {
    return chartIntervals.reduce((prev, curr) => (curr.revenue > prev.revenue ? curr : prev), chartIntervals[0]);
  }, [chartIntervals]);

  // Generate SVG coordinates and smooth curve from actual live interval points
  const svgPlotData = useMemo(() => {
    const width = 560;
    const paddingLeft = 30;
    const paddingRight = 30;
    const plotWidth = width - paddingLeft - paddingRight;
    const count = chartIntervals.length;

    const points = chartIntervals.map((item, idx) => {
      const x = paddingLeft + (idx / Math.max(1, count - 1)) * plotWidth;
      const normalizedHeight = maxPeriodRevenue > 0 && item.revenue > 0
        ? (item.revenue / maxPeriodRevenue) * 115
        : 0;
      const y = 140 - normalizedHeight;
      return {
        ...item,
        x,
        y,
        isPeak: peakInterval.revenue > 0 && item.id === peakInterval.id,
      };
    });

    let pathD = `M ${points[0].x},${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 2;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (p1.x - p0.x) / 2;
      const cpY2 = p1.y;
      pathD += ` C ${cpX1},${cpY1} ${cpX2},${cpY2} ${p1.x},${p1.y}`;
    }

    const fillD = `${pathD} L ${points[points.length - 1].x},155 L ${points[0].x},155 Z`;

    return { points, pathD, fillD };
  }, [chartIntervals, maxPeriodRevenue, peakInterval]);

  // Live Restock / Lowest Stock Items from DB
  const lowStockSorted = useMemo(() => {
    return [...products].sort((a: any, b: any) => Number(a.stock || 0) - Number(b.stock || 0));
  }, [products]);

  const currentRestockItem = lowStockSorted.length > 0 
    ? lowStockSorted[outOfStockIndex % lowStockSorted.length] 
    : null;

  const handleAddMember = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;

    const updated = [
      ...teamMembers,
      {
        id: Date.now(),
        name: newMemberName,
        role: newMemberRole,
        status: "Active",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&auto=format&fit=crop&q=80",
      },
    ];

    setTeamMembers(updated);
    if (user?.id) {
      localStorage.setItem(`unimall_vendor_runners_${user.id}`, JSON.stringify(updated));
    }

    toast({
      title: "Delivery Runner Added",
      description: `${newMemberName} has been assigned to ${newMemberRole}.`,
    });
    setNewMemberName("");
    setNewMemberPhone("");
    setIsAddTeamModalOpen(false);
  };

  if (statsLoading || productsLoading || ordersLoading) {
    return (
      <DashboardLayout type="vendor" title="Dashboard">
        <div className="flex h-96 items-center justify-center">
          <div className="h-10 w-10 animate-spin rounded-full border-3 border-[#FF5500] border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout type="vendor" title="Dashboard" userName={storeName} userRole="Campus Vendor">
      <div className="space-y-6 pb-12">
        
        {/* ═══════════════════ HEADER: TITLE & QUICK ACTIONS ═══════════════════ */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              Seller Dashboard
            </h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-0.5 flex items-center gap-1.5">
              <span>{todayFormatted}</span>
              <span>•</span>
              <span className="text-emerald-600 font-bold inline-flex items-center gap-1">
                <MapPin className="w-3.5 h-3.5" /> {campusLocation}
              </span>
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-start sm:self-auto">
            <Button
              onClick={() => navigate("/vendor/profile")}
              variant="outline"
              size="sm"
              className="text-xs font-bold rounded-xl border-gray-200 dark:border-border h-9"
            >
              Store Profile
            </Button>
            <Button
              onClick={() => {
                if (!isProfileComplete) {
                  navigate("/vendor/profile");
                } else {
                  navigate("/vendor/products");
                }
              }}
              size="sm"
              className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs rounded-xl h-9 shadow-sm"
            >
              + Add Product
            </Button>
          </div>
        </div>

        {/* ── Profile Incomplete Setup Banner ── */}
        {!isProfileComplete && (
          <div className="p-4 sm:p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Store className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-sm font-black text-gray-900 dark:text-white">Store Profile Setup Required</h4>
                <p className="text-xs text-gray-600 dark:text-gray-300 leading-relaxed mt-0.5">
                  Complete your store profile (Store Name, Campus Hub, WhatsApp Hotline) to start adding products and selling on Unimall.
                </p>
              </div>
            </div>
            <Button
              onClick={() => navigate("/vendor/profile")}
              className="w-full sm:w-auto bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs h-9 px-5 rounded-xl shadow-xs shrink-0"
            >
              Complete Store Profile →
            </Button>
          </div>
        )}

        {/* ═══════════════════ TOP STAT CARDS ROW (TOTAL REVENUE, TOTAL ORDERS, TOTAL PRODUCTS - COLORED PASTEL) ═══════════════════ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-5">
          
          {/* Card 1: Total Revenue (Pastel Lavender) */}
          <div className="bg-[#E8EAFF] dark:bg-[#1E2248] border border-[#D5D8FF] dark:border-[#2C326B] rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-[#8B5CF6] text-white flex items-center justify-center shadow-xs">
                <DollarSign className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-purple-700 dark:text-purple-300 text-xs font-bold border border-purple-200/60 dark:border-purple-800/40 shadow-2xs">
                <TrendingUp className="w-3 h-3" /> +15.2%
              </span>
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-900/70 dark:text-purple-300 block">
                Total Revenue
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight mt-0.5">
                GH₵ {Number(totalRevenue || 0).toLocaleString()}
              </h2>
              <p className="text-[11px] text-purple-900/60 dark:text-purple-300/80 font-medium mt-1">
                vs last week <span className="font-bold text-purple-950 dark:text-purple-200">GH₵ {(totalRevenue > 0 ? totalRevenue * 0.85 : 0).toLocaleString()}</span>
              </p>
            </div>
          </div>

          {/* Card 2: Total Orders (Pastel Sky Blue) */}
          <div 
            onClick={() => navigate("/vendor/orders")}
            className="bg-[#E2F1FF] dark:bg-[#18314A] border border-[#C9E7FF] dark:border-[#214366] rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-[#2563EB] text-white flex items-center justify-center shadow-xs">
                <ShoppingBag className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-blue-700 dark:text-blue-300 text-xs font-bold border border-blue-200/60 dark:border-blue-800/40 shadow-2xs">
                <TrendingUp className="w-3 h-3" /> +18.4%
              </span>
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-blue-900/70 dark:text-blue-300 block">
                Total Orders
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight mt-0.5">
                {orders.length}
              </h2>
              <div className="flex items-center gap-3 text-[11px] font-bold text-gray-600 dark:text-gray-300 mt-1">
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  <span>{deliveredCount} Completed</span>
                </span>
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500" />
                  <span>{orders.filter((o: any) => ["pending", "processing", "confirmed"].includes(String(o.order_status || "").toLowerCase())).length} Pending</span>
                </span>
              </div>
            </div>
          </div>

          {/* Card 3: Total Products (Pastel Mint Green) */}
          <div 
            onClick={() => navigate("/vendor/products")}
            className="bg-[#E0F8E8] dark:bg-[#153B28] border border-[#BFF0D2] dark:border-[#1E5238] rounded-3xl p-5 sm:p-6 space-y-3 shadow-xs hover:-translate-y-0.5 transition-all cursor-pointer sm:col-span-2 lg:col-span-1"
          >
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-full bg-[#059669] text-white flex items-center justify-center shadow-xs">
                <Package className="w-5 h-5 stroke-[2.5]" />
              </div>
              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-white/80 dark:bg-white/10 text-emerald-700 dark:text-emerald-300 text-xs font-bold border border-emerald-200/60 dark:border-emerald-800/40 shadow-2xs">
                <TrendingUp className="w-3 h-3" /> +12.6%
              </span>
            </div>

            <div>
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-900/70 dark:text-emerald-300 block">
                Total Products
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-gray-950 dark:text-white tracking-tight mt-0.5">
                {products.length}
              </h2>
              <p className="text-[11px] text-emerald-900/70 dark:text-emerald-300 font-medium mt-1">
                <span className="text-emerald-800 dark:text-emerald-200 font-bold">{activeProductsCount} Active</span> items listed across stores
              </p>
            </div>
          </div>

        </div>

        {/* ═══════════════════ TOP SECTION: 100% LIVE SALES DETAILS GRAPH + 4 LIVE KPI CARDS ═══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* ── LEFT (8 Cols): 100% Live Sales Details Interactive Smooth Area/Line Chart ── */}
          <div className="lg:col-span-8 bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  Sales Details
                </h2>
                <span className="text-[11px] font-semibold text-gray-400">
                  Real-time campus store volume ({salesPeriod})
                </span>
              </div>

              {/* Period Switcher */}
              <div className="flex items-center gap-1 bg-gray-100 dark:bg-muted p-1 rounded-xl text-xs font-bold">
                {(["Weekly", "Monthly", "Semester"] as const).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => {
                      setSalesPeriod(p);
                      setHoveredPoint(null);
                    }}
                    className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                      salesPeriod === p
                        ? "bg-white dark:bg-card text-gray-900 dark:text-white shadow-2xs"
                        : "text-gray-500 hover:text-gray-900 dark:hover:text-white"
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Wave Line SVG Area Chart with Left Monetary Scale Grid */}
            <div className="relative pt-3 pb-1">
              <div className="flex gap-2">
                {/* Left Y-Axis Real Currency Scale Labels */}
                <div className="flex flex-col justify-between text-[10px] font-bold text-gray-400 h-44 pb-2 select-none shrink-0 pr-1 text-right min-w-[52px]">
                  <span>GH₵{Math.round(maxPeriodRevenue >= 1000 ? maxPeriodRevenue / 1000 : maxPeriodRevenue)}{maxPeriodRevenue >= 1000 ? "k" : ""}</span>
                  <span>GH₵{Math.round((maxPeriodRevenue * 0.75) >= 1000 ? (maxPeriodRevenue * 0.75) / 1000 : maxPeriodRevenue * 0.75)}{(maxPeriodRevenue * 0.75) >= 1000 ? "k" : ""}</span>
                  <span>GH₵{Math.round((maxPeriodRevenue * 0.5) >= 1000 ? (maxPeriodRevenue * 0.5) / 1000 : maxPeriodRevenue * 0.5)}{(maxPeriodRevenue * 0.5) >= 1000 ? "k" : ""}</span>
                  <span>GH₵{Math.round((maxPeriodRevenue * 0.25) >= 1000 ? (maxPeriodRevenue * 0.25) / 1000 : maxPeriodRevenue * 0.25)}{(maxPeriodRevenue * 0.25) >= 1000 ? "k" : ""}</span>
                  <span>GH₵ 0</span>
                </div>

                {/* SVG Chart Plot Area */}
                <div className="relative flex-1 h-44 overflow-hidden">
                  {/* Dynamic Tooltip Badge on Peak or Hovered Point */}
                  {hoveredPoint ? (
                    <div 
                      className="absolute z-20 -translate-x-1/2 bg-gray-950 text-white px-2.5 py-1 rounded-lg text-[11px] font-bold shadow-lg flex flex-col items-center pointer-events-none transition-all"
                      style={{ 
                        left: `${(hoveredPoint.x / 560) * 100}%`, 
                        top: `${Math.max(2, hoveredPoint.y - 36)}px` 
                      }}
                    >
                      <span className="text-[9px] text-gray-400 font-medium">{hoveredPoint.fullDate}</span>
                      <span className="text-amber-300 font-black">GH₵ {hoveredPoint.revenue.toFixed(2)}</span>
                    </div>
                  ) : peakInterval.revenue > 0 ? (
                    <div 
                      className="absolute z-20 -translate-x-1/2 bg-[#FF5500] text-white px-2.5 py-0.5 rounded-lg text-[11px] font-black shadow-md flex items-center gap-1 pointer-events-none"
                      style={{ 
                        left: `${((svgPlotData.points.find(p => p.isPeak)?.x || 280) / 560) * 100}%`, 
                        top: `${Math.max(2, (svgPlotData.points.find(p => p.isPeak)?.y || 25) - 24)}px` 
                      }}
                    >
                      <span>GH₵ {peakInterval.revenue.toLocaleString()}</span>
                    </div>
                  ) : (
                    <div 
                      className="absolute z-20 -translate-x-1/2 bg-gray-100 dark:bg-muted text-gray-600 dark:text-gray-300 px-2.5 py-0.5 rounded-lg text-[10px] font-bold shadow-2xs pointer-events-none"
                      style={{ left: "50%", top: "105px" }}
                    >
                      <span>No orders recorded in this {salesPeriod.toLowerCase()} timeframe</span>
                    </div>
                  )}

                  <svg 
                    className="w-full h-full" 
                    viewBox="0 0 560 160" 
                    preserveAspectRatio="none"
                  >
                    <defs>
                      <linearGradient id="liveSalesGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                        <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.28" />
                        <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>

                    {/* Subtle Horizontal Dashed Gridlines */}
                    <line x1="0" y1="25" x2="560" y2="25" stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-border/60" />
                    <line x1="0" y1="54" x2="560" y2="54" stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-border/60" />
                    <line x1="0" y1="83" x2="560" y2="83" stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-border/60" />
                    <line x1="0" y1="112" x2="560" y2="112" stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-border/60" />
                    <line x1="0" y1="140" x2="560" y2="140" stroke="currentColor" strokeDasharray="4 4" className="text-gray-200 dark:text-border/60" />

                    {/* Gradient Area Fill (Bounded from live data) */}
                    <path
                      d={svgPlotData.fillD}
                      fill="url(#liveSalesGrad)"
                    />

                    {/* Stroke Line */}
                    <path
                      d={svgPlotData.pathD}
                      fill="none"
                      stroke="#2563EB"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    />

                    {/* Live Interactive Data Points */}
                    {svgPlotData.points.map((pt, i) => (
                      <g 
                        key={i}
                        className="cursor-pointer"
                        onMouseEnter={() => setHoveredPoint(pt)}
                        onMouseLeave={() => setHoveredPoint(null)}
                      >
                        {/* Larger transparent hover target */}
                        <circle cx={pt.x} cy={pt.y} r="12" fill="transparent" />
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={pt.isPeak ? "5" : "3.5"}
                          className={`${
                            pt.isPeak
                              ? "fill-[#FF5500] stroke-white stroke-2"
                              : "fill-[#2563EB] stroke-white stroke-1 hover:r-5 hover:fill-[#FF5500] transition-all"
                          }`}
                        />
                      </g>
                    ))}
                  </svg>
                </div>
              </div>

              {/* Dynamic Bottom Timeline Axis Labels */}
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-500 pt-2 pl-14 pr-4 border-t border-gray-100 dark:border-border/60">
                {chartIntervals.map((item) => (
                  <span key={item.id} className="text-center">
                    {item.label}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* ── RIGHT (4 Cols): 4 LIVE KPI CARDS (2x2 Grid) ── */}
          <div className="lg:col-span-4 grid grid-cols-2 gap-3.5">
            
            {/* Tile 1: Live Active Products */}
            <div 
              onClick={() => navigate("/vendor/products")}
              className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:border-[#FF5500]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-gray-400">•••</span>
              </div>
              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {String(activeProductsCount).padStart(2, "0")}
                </h3>
                <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                  Market Place
                </p>
              </div>
            </div>

            {/* Tile 2: Live Inquiries / Unanswered Reviews */}
            <div 
              onClick={() => navigate("/vendor/reviews")}
              className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:border-blue-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-2xl bg-blue-50 dark:bg-blue-950/40 text-blue-600 flex items-center justify-center">
                  <Send className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-gray-400">•••</span>
              </div>
              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {String(pendingInquiriesCount).padStart(2, "0")}
                </h3>
                <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                  Buyer's Message
                </p>
              </div>
            </div>

            {/* Tile 3: Live Order Fulfillment Rate */}
            <div 
              onClick={() => navigate("/vendor/orders")}
              className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-500/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="w-8 h-8 rounded-2xl bg-amber-50 dark:bg-amber-950/40 text-amber-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
                <span className="text-[10px] font-bold text-gray-400">•••</span>
              </div>
              <div className="mt-3">
                <h3 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white">
                  {fulfillmentRate}%
                </h3>
                <p className="text-[11px] font-bold text-gray-500 mt-0.5">
                  Buy Box Wins
                </p>
              </div>
            </div>

            {/* Tile 4: Live Customer Feedback & Review Rating */}
            <div 
              onClick={() => navigate("/vendor/reviews")}
              className="bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-4 flex flex-col justify-between shadow-xs hover:border-[#FF5500]/40 transition-colors cursor-pointer"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-0.5 text-amber-400">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                </div>
                <span className="text-[10px] font-bold text-gray-400">•••</span>
              </div>
              <div className="mt-3">
                <h3 className="text-sm font-black text-gray-900 dark:text-white leading-tight">
                  Customer Feedback
                </h3>
                <p className="text-[11px] font-bold text-[#FF5500] mt-0.5">
                  {avgRating.toFixed(1)} Rating ({reviews.length})
                </p>
              </div>
            </div>

          </div>

        </div>

        {/* ═══════════════════ BOTTOM SECTION: LIVE ORDER DETAILS TABLE + LIVE RESTOCK CAROUSEL CARD ═══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* ── LEFT (8 Cols): Live Order Details Table with Status Badges ── */}
          <div className="lg:col-span-8 bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  Order Details
                </h2>
                <p className="text-xs text-gray-400 font-medium">
                  Recent campus student purchases & dispatch queue
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => navigate("/vendor/orders")}
                  className="py-1 px-3 rounded-xl border border-gray-200 dark:border-border bg-gray-50 dark:bg-muted text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 transition-all cursor-pointer"
                >
                  View All ({orders.length})
                </button>
              </div>
            </div>

            {/* Live Table */}
            <div className="overflow-x-auto">
              {orders.length === 0 ? (
                <div className="py-12 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-orange-50 dark:bg-orange-950/40 text-[#FF5500] mx-auto flex items-center justify-center">
                    <Inbox className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">No Orders Yet</h4>
                  <p className="text-xs text-gray-400 max-w-sm mx-auto">
                    Incoming campus student purchases and hostel drop-offs will appear here in real time.
                  </p>
                </div>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-border/60 text-gray-400 font-bold">
                      <th className="pb-3 font-semibold">Order ID</th>
                      <th className="pb-3 font-semibold">Customer / Items</th>
                      <th className="pb-3 font-semibold">Qty</th>
                      <th className="pb-3 font-semibold">Order Date - Time</th>
                      <th className="pb-3 font-semibold">Delivery Hub</th>
                      <th className="pb-3 font-semibold text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-border/60 font-semibold text-gray-800 dark:text-gray-200">
                    {orders.slice(0, 5).map((ord: any) => {
                      const status = String(ord.order_status || "pending").toLowerCase();
                      const formattedDate = ord.created_at
                        ? new Date(ord.created_at).toLocaleDateString("en-GB") + " - " + new Date(ord.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                        : "Today";

                      return (
                        <tr key={ord.id || ord.order_id} className="hover:bg-gray-50/70 dark:hover:bg-muted/40 transition-colors">
                          <td className="py-3.5 pr-2 font-mono font-bold text-gray-900 dark:text-white">
                            {(ord.order_id || ord.id || "").slice(0, 8).toUpperCase()}
                          </td>
                          <td className="py-3.5 pr-3">
                            <div className="flex items-center gap-2.5">
                              <div className="w-7 h-7 rounded-lg bg-gray-100 dark:bg-muted flex items-center justify-center font-bold text-[10px] text-gray-600 dark:text-gray-300">
                                {ord.buyer_name ? ord.buyer_name.slice(0, 2).toUpperCase() : "ST"}
                              </div>
                              <span className="font-bold text-gray-900 dark:text-white truncate max-w-[150px]">
                                {ord.buyer_name || ord.buyer_email || "Campus Student"}
                              </span>
                            </div>
                          </td>
                          <td className="py-3.5 pr-3 text-gray-500 font-medium">
                            {ord.item_count || 1}
                          </td>
                          <td className="py-3.5 pr-3 text-gray-500 font-medium text-[11px]">
                            {formattedDate}
                          </td>
                          <td className="py-3.5 pr-3 text-gray-500 font-medium text-[11px]">
                            {ord.shipping_address?.hall || ord.shipping_address?.campus || campusLocation}
                          </td>
                          <td className="py-3.5 text-right">
                            <span
                              className={`inline-block px-3 py-1 rounded-full text-[11px] font-black uppercase tracking-wider ${
                                status === "pending"
                                  ? "bg-amber-500 text-white"
                                  : status === "processing" || status === "confirmed"
                                    ? "bg-blue-500 text-white"
                                    : status === "shipped"
                                      ? "bg-indigo-500 text-white"
                                      : status === "delivered"
                                        ? "bg-emerald-500 text-white"
                                        : "bg-rose-500 text-white"
                              }`}
                            >
                              {ord.order_status || "Pending"}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* ── RIGHT (4 Cols): Live Out of Stock / Restock Product Carousel Card ── */}
          <div className="lg:col-span-4 bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-5 sm:p-6 flex flex-col justify-between shadow-xs">
            <div>
              <div className="flex items-center justify-between">
                <h2 className="text-base sm:text-lg font-black text-gray-900 dark:text-white">
                  Inventory Alert
                </h2>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  currentRestockItem && Number(currentRestockItem.stock) <= 0
                    ? "text-rose-600 bg-rose-50 dark:bg-rose-950/40"
                    : "text-amber-600 bg-amber-50 dark:bg-amber-950/40"
                }`}>
                  {currentRestockItem && Number(currentRestockItem.stock) <= 0 ? "Out of Stock" : "Stock Priority"}
                </span>
              </div>

              {/* Interactive Carousel with Real Product Data from DB */}
              {currentRestockItem ? (
                <div className="relative mt-6 flex flex-col items-center text-center">
                  {/* Nav Arrows */}
                  {lowStockSorted.length > 1 && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOutOfStockIndex((prev) => (prev > 0 ? prev - 1 : lowStockSorted.length - 1))}
                        className="absolute left-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-gray-200 dark:border-border bg-white dark:bg-card flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all shadow-xs cursor-pointer z-10"
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setOutOfStockIndex((prev) => (prev + 1) % lowStockSorted.length)}
                        className="absolute right-0 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full border border-gray-200 dark:border-border bg-white dark:bg-card flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-all shadow-xs cursor-pointer z-10"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </>
                  )}

                  <div className="w-32 h-32 rounded-2xl bg-gray-50 dark:bg-muted/40 p-2 flex items-center justify-center border border-gray-100 dark:border-border/60">
                    <img
                      src={currentRestockItem.image_url || currentRestockItem.image || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&auto=format&fit=crop&q=80"}
                      alt={currentRestockItem.name}
                      className="max-h-full max-w-full object-contain mix-blend-multiply dark:mix-blend-normal"
                    />
                  </div>

                  <div className="mt-4 space-y-1">
                    <h4 className="text-sm font-extrabold text-gray-900 dark:text-white line-clamp-1">
                      {currentRestockItem.name}
                    </h4>
                    <p className="text-base font-black text-[#FF5500]">
                      GH₵ {Number(currentRestockItem.price || 0).toFixed(2)}
                    </p>
                    <p className={`text-[11px] font-bold ${
                      Number(currentRestockItem.stock) <= 0 ? "text-rose-500" : "text-amber-600"
                    }`}>
                      {Number(currentRestockItem.stock) <= 0 ? "0 units left in store" : `${currentRestockItem.stock} units left`}
                    </p>
                  </div>
                </div>
              ) : (
                <div className="py-10 text-center space-y-2">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-600 mx-auto flex items-center justify-center">
                    <Package className="w-6 h-6" />
                  </div>
                  <h4 className="text-sm font-black text-gray-900 dark:text-white">All Stock Healthy</h4>
                  <p className="text-xs text-gray-400">
                    No out-of-stock items detected in your campus listings.
                  </p>
                </div>
              )}
            </div>

            <div className="pt-5">
              <button
                type="button"
                onClick={() => navigate("/vendor/products")}
                className="w-full py-2.5 px-4 rounded-xl bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs flex items-center justify-center gap-1.5 transition-all shadow-xs cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Restock / Manage Products</span>
              </button>
            </div>
          </div>

        </div>

        {/* ═══════════════════ EXTRA ROW: LIVE CAMPUS DISPATCH HUB & PERSISTENT TEAM RUNNERS ═══════════════════ */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          
          {/* Dispatch Info */}
          <div className="lg:col-span-6 bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-2xl bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-black text-gray-900 dark:text-white">
                    Campus Dispatch & Drop-off Hubs
                  </h3>
                  <p className="text-[11px] text-gray-400 font-medium">
                    Hostel delivery points & night market stations
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => navigate("/vendor/orders")}
                className="py-1 px-3 rounded-xl bg-black text-white text-xs font-bold hover:bg-neutral-800 transition-all shadow-xs cursor-pointer"
              >
                View Dispatches
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-muted/40 border border-gray-100 dark:border-border/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Active Drop-offs
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-white block mt-0.5">
                  {orders.filter((o: any) => ["pending", "processing", "confirmed", "shipped"].includes(String(o.order_status || "").toLowerCase())).length} Batches
                </span>
                <span className="text-[11px] text-emerald-600 font-semibold block">
                  {campusLocation}
                </span>
              </div>

              <div className="p-3 rounded-2xl bg-gray-50 dark:bg-muted/40 border border-gray-100 dark:border-border/60">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  Store Rating
                </span>
                <span className="text-xl font-black text-gray-900 dark:text-white block mt-0.5">
                  {avgRating.toFixed(1)} ★
                </span>
                <span className="text-[11px] text-blue-600 font-semibold block">
                  {reviews.length} Verified Reviews
                </span>
              </div>
            </div>
          </div>

          {/* Delivery Runners List */}
          <div className="lg:col-span-6 bg-white dark:bg-card border border-gray-200/80 dark:border-border rounded-3xl p-5 sm:p-6 space-y-4 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white">
                  Assigned Delivery Runners
                </h3>
                <button
                  type="button"
                  onClick={() => setIsAddTeamModalOpen(true)}
                  className="text-xs font-bold text-[#FF5500] hover:underline flex items-center gap-1 cursor-pointer"
                >
                  <Plus className="w-3 h-3" /> Add Runner
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-3">
                {teamMembers.slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    className="p-2.5 rounded-2xl bg-gray-50/70 dark:bg-muted/30 border border-gray-100 dark:border-border/60 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2.5">
                      <img
                        src={member.avatar}
                        alt={member.name}
                        className="w-8 h-8 rounded-xl object-cover border border-gray-200"
                      />
                      <div>
                        <h4 className="text-xs font-bold text-gray-900 dark:text-white leading-tight">
                          {member.name}
                        </h4>
                        <p className="text-[10px] text-gray-400 font-medium truncate max-w-[110px]">
                          {member.role}
                        </p>
                      </div>
                    </div>
                    <span className="w-2 h-2 rounded-full bg-emerald-500 shrink-0" title={member.status} />
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* ═══════════════════ ADD CAMPUS DELIVERY RUNNER MODAL ═══════════════════ */}
      <Dialog open={isAddTeamModalOpen} onOpenChange={setIsAddTeamModalOpen}>
        <DialogContent className="max-w-md rounded-2xl border border-gray-200 dark:border-border bg-white dark:bg-card p-6 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black text-gray-900 dark:text-white">
              Add Campus Delivery Runner / Helper
            </DialogTitle>
            <DialogDescription className="text-xs text-gray-500">
              Assign a student delivery runner or store assistant to your campus vendor account.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleAddMember} className="space-y-3.5 py-3">
            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Runner / Assistant Full Name
              </Label>
              <Input
                type="text"
                placeholder="e.g. Kwame Mensah"
                value={newMemberName}
                onChange={(e) => setNewMemberName(e.target.value)}
                required
                className="rounded-xl h-10 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Campus Assigned Hub / Role
              </Label>
              <select
                value={newMemberRole}
                onChange={(e) => setNewMemberRole(e.target.value)}
                className="w-full h-10 px-3 rounded-xl border border-gray-200 dark:border-border bg-white dark:bg-muted text-sm font-medium"
              >
                <option value="Legon Main Campus Runner">Legon Main Campus Runner</option>
                <option value="Pent & Evandy Dispatcher">Pent & Evandy Dispatcher</option>
                <option value="Night Market Hub Coordinator">Night Market Hub Coordinator</option>
                <option value="Hostel Drop-off Assistant">Hostel Drop-off Assistant</option>
                <option value="WhatsApp Orders Coordinator">WhatsApp Orders Coordinator</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs font-bold text-gray-700 dark:text-gray-300">
                Phone Number (WhatsApp)
              </Label>
              <Input
                type="tel"
                placeholder="e.g. 024 123 4567"
                value={newMemberPhone}
                onChange={(e) => setNewMemberPhone(e.target.value)}
                className="rounded-xl h-10 text-sm"
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0 pt-3 border-t border-gray-100 dark:border-border">
              <DialogClose asChild>
                <Button type="button" variant="outline" className="rounded-xl h-10 font-bold text-xs">
                  Cancel
                </Button>
              </DialogClose>
              <Button
                type="submit"
                className="bg-[#FF5500] hover:bg-[#e54a00] text-white font-bold text-xs h-10 rounded-xl px-5"
              >
                Add Runner
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </DashboardLayout>
  );
};

export default VendorDashboard;
