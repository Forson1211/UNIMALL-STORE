import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { SalesChart } from "@/components/dashboard/SalesChart";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { RecentOrders } from "@/components/dashboard/RecentOrders";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { supabase } from "@/integrations/supabase/client";
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  BarChart3,
  CheckCircle2,
  CircleDollarSign,
  Clock3,
  Eye,
  Image as ImageIcon,
  MessageSquare,
  Package,
  Plus,
  ReceiptText,
  SearchCheck,
  ShoppingCart,
  Sparkles,
  Store,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";

const VendorDashboard = () => {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["vendor-stats", user?.id],
    queryFn: () => vendorService.getDashboardStats(user!.id),
    enabled: !!user,
  });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ["vendor-products", user?.id],
    queryFn: () => vendorService.getProducts(user!.id),
    enabled: !!user,
  });

  const { data: orders = [], isLoading: ordersLoading } = useQuery({
    queryKey: ["vendor-orders", user?.id],
    queryFn: () => vendorService.getOrders(user!.id),
    enabled: !!user,
  });

  const { data: weeklySales = [] } = useQuery({
    queryKey: ["vendor-weekly-sales", user?.id],
    queryFn: () => vendorService.getWeeklySales(user!.id),
    enabled: !!user,
  });

  const { data: balanceData } = useQuery({
    queryKey: ["vendor-balance", user?.id],
    queryFn: () => vendorService.getAvailableBalance(user!.id),
    enabled: !!user,
  });

  const productIds = products.map((product: any) => product.id).filter(Boolean);
  const { data: reviews = [] } = useQuery({
    queryKey: ["vendor-review-summary", user?.id, productIds.join(",")],
    queryFn: async () => {
      if (!productIds.length) return [];
      const { data, error } = await supabase.from("reviews").select("rating, vendor_reply").in("product_id", productIds);
      if (error) {
        console.warn("Unable to load vendor review summary:", error);
        return [];
      }
      return data || [];
    },
    enabled: !!user && productIds.length > 0,
  });

  const stats = (statsData || {}) as any;
  const balance = (balanceData || { balance: 0, earned: 0, paidOut: 0 }) as any;
  const vendorProfile = (profile || {}) as any;
  const storeName = vendorProfile.store_name || vendorProfile.full_name || "Vendor";
  const profileFields = [vendorProfile.store_name, vendorProfile.store_description, vendorProfile.campus, vendorProfile.banner_url].filter(Boolean).length;
  const profileCompletion = Math.round((profileFields / 4) * 100);

  const salesChartData = (() => {
    const weeks: { name: string; sales: number; orders: number }[] = [];
    for (let i = 3; i >= 0; i--) {
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay() - i * 7);
      weekStart.setHours(0, 0, 0, 0);
      const match = weeklySales.find((w) => new Date(w.week_start).toDateString() === weekStart.toDateString());
      weeks.push({ name: `Week ${4 - i}`, sales: match?.revenue || 0, orders: match?.orders || 0 });
    }
    return weeks;
  })();

  const lowStockProducts = products.filter((p: any) => Number(p.stock) > 0 && Number(p.stock) < 10);
  const outOfStockProducts = products.filter((p: any) => Number(p.stock) <= 0);
  const missingImages = products.filter((p: any) => !p.image_url && !p.image).length;
  const activeProducts = products.filter((p: any) => p.is_active !== false).length;
  const pendingOrders = orders.filter((o: any) => ["pending", "processing", "confirmed"].includes(String(o.order_status || "").toLowerCase())).length;
  const shippedOrders = orders.filter((o: any) => ["shipped", "out_for_delivery"].includes(String(o.order_status || "").toLowerCase())).length;
  const deliveredOrders = orders.filter((o: any) => String(o.order_status || "").toLowerCase() === "delivered").length;
  const averageRating = reviews.length ? reviews.reduce((sum: number, review: any) => sum + Number(review.rating || 0), 0) / reviews.length : 0;
  const unansweredReviews = reviews.filter((review: any) => !review.vendor_reply).length;
  const catalogScore = Math.max(0, Math.min(100, 100 - (outOfStockProducts.length * 15) - (missingImages * 8)));
  const inventoryPriorities = [...outOfStockProducts, ...lowStockProducts].slice(0, 3);

  const growthChecklist = [
    { label: "Complete your store profile", done: profileCompletion === 100, action: () => navigate("/vendor/settings") },
    { label: "Publish your first products", done: products.length > 0, action: () => navigate("/vendor/products") },
    { label: "Create a campus offer", done: false, action: () => navigate("/vendor/coupons") },
    { label: "Reply to customer reviews", done: reviews.length > 0 && unansweredReviews === 0, action: () => navigate("/vendor/reviews") },
  ];

  if (statsLoading || productsLoading || ordersLoading) {
    return <DashboardLayout type="vendor" title="Dashboard"><div className="flex h-96 items-center justify-center"><div className="h-12 w-12 animate-spin rounded-full border-4 border-[#FF5500] border-t-transparent" /></div></DashboardLayout>;
  }

  return (
    <DashboardLayout type="vendor" title="Dashboard" userName={storeName} userRole="Vendor">
      <section className="relative mb-6 overflow-hidden border border-slate-800/80 border-l-4 border-l-[#FF5500] bg-gradient-to-br from-[#17233D] via-[#1D2B49] to-[#253A5A] shadow-[0_18px_45px_rgba(15,23,42,0.16)]">
        <div className="relative flex flex-col gap-4 px-4 py-4 text-white sm:gap-7 sm:px-8 sm:py-7 lg:flex-row lg:items-center lg:justify-between lg:gap-10">
          <div className="max-w-3xl"><div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-orange-200 sm:mb-3 sm:text-[11px] sm:tracking-[0.24em]"><Sparkles className="h-4 w-4" /> Seller success center</div><h1 className="text-2xl font-black tracking-[-0.035em] text-white sm:text-4xl">Keep {storeName} moving forward.</h1><p className="mt-2 max-w-2xl text-xs leading-5 text-slate-200 sm:mt-3 sm:text-sm sm:leading-6">Manage your campus storefront, respond to orders quickly, and build the trust that keeps students coming back.</p></div>
          <div className="w-full max-w-none border border-white/20 border-t-[#FF8A5B] bg-slate-950/20 p-3 shadow-inner sm:max-w-[280px] sm:p-4"><div className="mb-2 flex items-center justify-between text-[11px] font-bold text-slate-200 sm:mb-3 sm:text-xs"><span>Store profile</span><span className="text-[#FF8A5B]">{profileCompletion}%</span></div><div className="h-2 overflow-hidden bg-white/10"><div className="h-full bg-gradient-to-r from-[#FF5500] to-[#FF2D55] transition-all" style={{ width: `${profileCompletion}%` }} /></div><Button variant="link" className="mt-2 h-auto p-0 text-[11px] font-bold text-white hover:text-orange-200 sm:mt-3 sm:text-xs" onClick={() => navigate("/vendor/settings")}>{profileCompletion === 100 ? "Review store settings" : "Complete your store profile"}<ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></div>
        </div>
      </section>

      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"><StatsCard title="Total Revenue" value={`GH₵${(stats?.total_revenue || 0).toLocaleString()}`} icon={CircleDollarSign} variant="primary" /><StatsCard title="Total Orders" value={(stats?.total_orders || 0).toLocaleString()} icon={ShoppingCart} variant="secondary" /><StatsCard title="Active Products" value={activeProducts} icon={Package} /><StatsCard title="Needs Attention" value={lowStockProducts.length + outOfStockProducts.length + pendingOrders + unansweredReviews} icon={AlertTriangle} variant="warning" /></div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card className="border-orange-100 bg-gradient-to-br from-orange-50 to-white shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-black text-slate-900"><Wallet className="h-5 w-5 text-[#FF5500]" /> Available balance</CardTitle></CardHeader><CardContent><p className="text-3xl font-black tracking-tight text-slate-950">GH₵{Number(balance.balance || 0).toLocaleString()}</p><p className="mt-1 text-xs font-medium text-slate-500">From delivered orders and cleared sales</p><div className="mt-5 grid grid-cols-2 gap-3 border-t border-orange-100 pt-4 text-xs"><div><p className="text-slate-400">Earned</p><p className="mt-1 font-black text-slate-900">GH₵{Number(balance.earned || 0).toLocaleString()}</p></div><div><p className="text-slate-400">Paid out</p><p className="mt-1 font-black text-slate-900">GH₵{Number(balance.paidOut || 0).toLocaleString()}</p></div></div><Button className="mt-5 h-10 w-full bg-[#FF5500] text-xs font-black uppercase tracking-wider hover:bg-[#e54a00]" onClick={() => navigate("/vendor/settings")}>Manage payouts <ArrowUpRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>
        <Card className="lg:col-span-2 shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-black text-slate-900"><ReceiptText className="h-5 w-5 text-[#FF5500]" /> Order pipeline</CardTitle></CardHeader><CardContent className="grid grid-cols-2 gap-3 sm:grid-cols-4">{[{ label: "To fulfill", value: pendingOrders, icon: Clock3, tone: "text-amber-600 bg-amber-50" }, { label: "In transit", value: shippedOrders, icon: ShoppingCart, tone: "text-blue-600 bg-blue-50" }, { label: "Delivered", value: deliveredOrders, icon: CheckCircle2, tone: "text-emerald-600 bg-emerald-50" }, { label: "All orders", value: orders.length, icon: ReceiptText, tone: "text-[#FF5500] bg-orange-50" }].map((item) => <button key={item.label} type="button" onClick={() => navigate("/vendor/orders")} className="rounded-xl border border-slate-100 p-4 text-left transition hover:border-orange-200 hover:bg-orange-50/40"><div className={`mb-3 flex h-9 w-9 items-center justify-center rounded-lg ${item.tone}`}><item.icon className="h-4 w-4" /></div><p className="text-2xl font-black text-slate-950">{item.value}</p><p className="mt-1 text-xs font-bold text-slate-400">{item.label}</p></button>)}</CardContent></Card>
      </div>

      <div id="sales-insights" className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3 scroll-mt-6"><SalesChart title="Sales Performance (Last 4 Weeks)" data={salesChartData} /><CategoryChart title="Product Distribution" data={(() => { const counts: Record<string, number> = {}; products.forEach((p: any) => { counts[p.category] = (counts[p.category] || 0) + 1; }); const colors = ["#FF5500", "#0F172A", "#F59E0B", "#10B981", "#64748B", "#94A3B8"]; return Object.entries(counts).map(([name, value], i) => ({ name, value, fill: colors[i % colors.length] })); })()} /></div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3">
        <Card id="catalog-readiness" className="shadow-sm scroll-mt-6"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-black text-slate-900"><SearchCheck className="h-5 w-5 text-[#FF5500]" /> Catalog readiness</CardTitle></CardHeader><CardContent><div className="flex items-end justify-between"><div><p className="text-3xl font-black text-slate-950">{catalogScore}%</p><p className="mt-1 text-xs font-medium text-slate-500">Ready for campus shoppers</p></div><div className="flex h-14 w-14 items-center justify-center rounded-full border-4 border-orange-100 text-sm font-black text-[#FF5500]">{catalogScore}</div></div><div className="mt-5 space-y-3 text-xs font-semibold"><div className="flex items-center justify-between"><span className="text-slate-500">Active listings</span><span className="text-slate-900">{activeProducts}/{products.length}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Images added</span><span className={missingImages ? "text-amber-600" : "text-emerald-600"}>{products.length - missingImages}/{products.length}</span></div><div className="flex items-center justify-between"><span className="text-slate-500">Out of stock</span><span className={outOfStockProducts.length ? "text-red-600" : "text-emerald-600"}>{outOfStockProducts.length}</span></div></div><Button variant="outline" className="mt-5 h-10 w-full text-xs font-bold" onClick={() => navigate("/vendor/products")}>Improve catalog <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>
        <Card className="shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-black text-slate-900"><MessageSquare className="h-5 w-5 text-[#FF5500]" /> Customer trust</CardTitle></CardHeader><CardContent><div className="flex items-center gap-4"><div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-orange-50 text-2xl font-black text-[#FF5500]">{averageRating ? averageRating.toFixed(1) : "—"}</div><div><div className="flex items-center gap-1 text-[#FF5500]">{"★★★★★"}</div><p className="mt-1 text-xs font-medium text-slate-500">{reviews.length} customer review{reviews.length === 1 ? "" : "s"}</p></div></div><div className="mt-6 rounded-xl bg-slate-50 p-4"><p className="text-sm font-bold text-slate-900">{unansweredReviews ? `${unansweredReviews} review${unansweredReviews === 1 ? "" : "s"} waiting for a reply` : "Your customers feel heard"}</p><p className="mt-1 text-xs leading-5 text-slate-500">Thoughtful replies turn one-time campus shoppers into loyal customers.</p></div><Button variant="outline" className="mt-4 h-10 w-full text-xs font-bold" onClick={() => navigate("/vendor/reviews")}>Manage reviews <ArrowRight className="ml-2 h-4 w-4" /></Button></CardContent></Card>
        <Card className="shadow-sm"><CardHeader className="pb-3"><CardTitle className="flex items-center gap-2 text-base font-black text-slate-900"><BarChart3 className="h-5 w-5 text-[#FF5500]" /> Growth checklist</CardTitle></CardHeader><CardContent className="space-y-2">{growthChecklist.map((item) => <button key={item.label} type="button" onClick={item.action} className="flex w-full items-center gap-3 rounded-xl p-2 text-left transition hover:bg-orange-50"><span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full ${item.done ? "bg-emerald-100 text-emerald-600" : "bg-orange-100 text-[#FF5500]"}`}>{item.done ? <CheckCircle2 className="h-4 w-4" /> : <ArrowRight className="h-4 w-4" />}</span><span className={`text-xs font-bold ${item.done ? "text-slate-400 line-through" : "text-slate-700"}`}>{item.label}</span></button>)}</CardContent></Card>
      </div>

      <div className="mb-6 grid grid-cols-1 gap-6 lg:grid-cols-3"><Card className="lg:col-span-1 shadow-sm"><CardHeader><CardTitle className="flex items-center gap-2 text-base font-black text-slate-900"><TrendingUp className="h-5 w-5 text-[#FF5500]" /> Quick actions</CardTitle></CardHeader><CardContent className="grid gap-2.5"><Button className="h-11 w-full justify-start gap-3 bg-[#FF5500] text-xs font-black uppercase tracking-wider hover:bg-[#e54a00]" onClick={() => navigate("/vendor/products")}><Plus className="h-4 w-4" /> Add new product</Button><Button variant="outline" className="h-11 w-full justify-start gap-3 text-xs font-bold" onClick={() => navigate("/vendor/orders")}><Package className="h-4 w-4 text-[#FF5500]" /> Review orders <Badge className="ml-auto bg-orange-50 text-[#FF5500]">{pendingOrders}</Badge></Button><Button variant="outline" className="h-11 w-full justify-start gap-3 text-xs font-bold" onClick={() => navigate("/vendor/coupons")}><Ticket className="h-4 w-4 text-[#FF5500]" /> Create a campus offer</Button><Button variant="outline" className="h-11 w-full justify-start gap-3 text-xs font-bold" onClick={() => navigate("/vendor/settings")}><Store className="h-4 w-4 text-[#FF5500]" /> Update store profile</Button><Button variant="ghost" className="h-10 w-full justify-start gap-3 text-xs font-bold text-slate-500 hover:text-[#FF5500]" onClick={() => window.open(`/vendors/${user?.id}`, "_blank")}><Eye className="h-4 w-4" /> View my public store</Button></CardContent></Card><div className="lg:col-span-2"><RecentOrders orders={orders.slice(0, 5).map((o: any) => ({ id: o.order_id.slice(0, 8), customerName: o.buyer_name || o.buyer_email, customerEmail: o.buyer_email || "", date: new Date(o.created_at).toLocaleDateString(), total: o.vendor_total, status: o.order_status, items: [], paymentStatus: "paid", createdAt: o.created_at })) as any} title="Recent orders" onViewAll={() => navigate("/vendor/orders")} /></div></div>

      <Card id="inventory-health" className="shadow-sm scroll-mt-6"><CardHeader className="flex flex-row items-center justify-between"><div className="flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-amber-500" /><CardTitle className="text-base font-black text-slate-900">Inventory health</CardTitle></div><Button variant="link" className="text-xs font-bold text-[#FF5500]" onClick={() => navigate("/vendor/products")}>Manage products <ArrowRight className="ml-1 h-3.5 w-3.5" /></Button></CardHeader><CardContent>{inventoryPriorities.length === 0 ? <div className="flex items-center gap-3 rounded-xl bg-emerald-50 p-4 text-sm font-semibold text-emerald-700"><CheckCircle2 className="h-5 w-5" /> All products are well stocked. Keep your best sellers available for students.</div> : <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{inventoryPriorities.map((product: any) => <div key={product.id} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 p-3"><div className="min-w-0"><p className="truncate text-sm font-bold text-slate-900">{product.name}</p><p className="text-xs text-slate-500">{Number(product.stock) <= 0 ? "Out of stock" : `${product.stock} left`} · {product.category}</p></div><Badge variant="outline" className="ml-3 shrink-0 border-amber-200 bg-white text-amber-700">Restock</Badge></div>)}</div>}</CardContent></Card>
    </DashboardLayout>
  );
};

export default VendorDashboard;
