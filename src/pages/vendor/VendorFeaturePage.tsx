import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, BarChart3, CheckCircle2, Package, SearchCheck, TrendingUp, AlertTriangle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";

type Feature = "catalog" | "sales" | "inventory";

const copy: Record<Feature, { title: string; eyebrow: string; description: string }> = {
  catalog: { title: "Catalog Health", eyebrow: "Seller readiness", description: "Keep every listing clear, complete, and ready for campus shoppers." },
  sales: { title: "Sales Insights", eyebrow: "Marketplace performance", description: "Understand your weekly momentum and where your store is growing." },
  inventory: { title: "Inventory Priorities", eyebrow: "Stock control", description: "Spot products that need attention before students find them unavailable." },
};

export default function VendorFeaturePage({ feature }: { feature: Feature }) {
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { data: products = [], isLoading: productsLoading } = useQuery({ queryKey: ["vendor-feature-products", user?.id], queryFn: () => vendorService.getProducts(user!.id), enabled: !!user });
  const { data: orders = [], isLoading: ordersLoading } = useQuery({ queryKey: ["vendor-feature-orders", user?.id], queryFn: () => vendorService.getOrders(user!.id), enabled: !!user });
  const { data: weeklySales = [] } = useQuery({ queryKey: ["vendor-feature-sales", user?.id], queryFn: () => vendorService.getWeeklySales(user!.id), enabled: !!user });
  const content = copy[feature];

  const active = products.filter((p: any) => p.is_active !== false).length;
  const missingImages = products.filter((p: any) => !p.image && !p.image_url).length;
  const inventoryIssues = products.filter((p: any) => Number(p.stock ?? 0) <= 5).sort((a: any, b: any) => Number(a.stock ?? 0) - Number(b.stock ?? 0));
  const totalRevenue = orders.reduce((sum: number, order: any) => sum + Number(order.vendor_total ?? order.total ?? 0), 0);
  const recentRevenue = weeklySales.reduce((sum: number, week: any) => sum + Number(week.revenue ?? 0), 0);
  const readiness = products.length ? Math.round(((active + (products.length - missingImages)) / (products.length * 2)) * 100) : 0;
  const topCategories = useMemo(() => Object.entries(products.reduce((acc: Record<string, number>, product: any) => { const key = product.category || "Other"; acc[key] = (acc[key] || 0) + 1; return acc; }, {})).sort(([, a], [, b]) => Number(b) - Number(a)).slice(0, 5), [products]);

  const loading = productsLoading || ordersLoading;
  return (
    <DashboardLayout type="vendor" title={content.title} userName={profile?.store_name || profile?.full_name || "Vendor"} userRole="Vendor">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="rounded-2xl bg-[#0B132B] p-6 text-white shadow-xl sm:p-8">
          <p className="text-xs font-black uppercase tracking-[0.22em] text-[#FF8A5B]">{content.eyebrow}</p>
          <div className="mt-3 flex flex-col justify-between gap-5 lg:flex-row lg:items-end">
            <div><h1 className="text-3xl font-black tracking-tight sm:text-4xl">{content.title}</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{content.description}</p></div>
            <Button onClick={() => navigate("/vendor")} className="bg-gradient-to-r from-[#FF5500] to-[#FF2D55] font-bold text-white hover:opacity-90"><ArrowRight className="mr-2 h-4 w-4 rotate-180" /> Back to dashboard</Button>
          </div>
        </div>

        {loading ? <div className="flex min-h-48 items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-4 border-[#FF5500] border-t-transparent" /></div> : (
          <>
            {feature === "catalog" && <div className="grid gap-4 md:grid-cols-3"><Metric icon={SearchCheck} label="Readiness score" value={`${readiness}%`} detail="Listing quality" /><Metric icon={Package} label="Active products" value={`${active}`} detail={`${products.length} total listings`} /><Metric icon={AlertTriangle} label="Missing images" value={`${missingImages}`} detail="Listings to improve" /></div>}
            {feature === "sales" && <div className="grid gap-4 md:grid-cols-3"><Metric icon={TrendingUp} label="All-time sales" value={`GH₵${totalRevenue.toLocaleString()}`} detail={`${orders.length} orders`} /><Metric icon={BarChart3} label="Recent revenue" value={`GH₵${recentRevenue.toLocaleString()}`} detail="From weekly sales data" /><Metric icon={CheckCircle2} label="Delivered orders" value={`${orders.filter((o: any) => o.order_status === "delivered" || o.status === "delivered").length}`} detail="Completed purchases" /></div>}
            {feature === "inventory" && <div className="grid gap-4 md:grid-cols-3"><Metric icon={AlertTriangle} label="Needs attention" value={`${inventoryIssues.length}`} detail="At or below 5 units" /><Metric icon={Package} label="Total products" value={`${products.length}`} detail="Across your catalog" /><Metric icon={CheckCircle2} label="Healthy listings" value={`${Math.max(products.length - inventoryIssues.length, 0)}`} detail="Above reorder point" /></div>}

            <Card><CardHeader><CardTitle className="flex items-center gap-2 text-lg font-black text-slate-900">{feature === "catalog" ? <SearchCheck className="h-5 w-5 text-[#FF5500]" /> : feature === "sales" ? <BarChart3 className="h-5 w-5 text-[#FF5500]" /> : <AlertTriangle className="h-5 w-5 text-[#FF5500]" />}{feature === "catalog" ? "Catalog checklist" : feature === "sales" ? "Weekly sales activity" : "Restock priorities"}</CardTitle></CardHeader><CardContent>
              {feature === "catalog" && <div className="space-y-3">{[{ label: "Active listings", value: `${active}/${products.length}`, done: active === products.length }, { label: "Product images", value: `${products.length - missingImages}/${products.length}`, done: missingImages === 0 }, { label: "Store category coverage", value: `${topCategories.length} categories`, done: topCategories.length > 0 }].map((item) => <div key={item.label} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><div className="flex items-center gap-3"><CheckCircle2 className={`h-5 w-5 ${item.done ? "text-emerald-500" : "text-amber-500"}`} /><span className="text-sm font-bold text-slate-700">{item.label}</span></div><Badge variant="outline">{item.value}</Badge></div>)}</div>}
              {feature === "sales" && <div className="space-y-3">{weeklySales.length ? weeklySales.map((week: any) => <div key={week.week_start} className="flex items-center justify-between rounded-xl bg-slate-50 p-4"><span className="text-sm font-bold text-slate-700">Week of {new Date(week.week_start).toLocaleDateString()}</span><span className="font-black text-[#FF5500]">GH₵{Number(week.revenue || 0).toLocaleString()} · {week.orders || 0} orders</span></div>) : <Empty text="Weekly sales data will appear as orders come in." />}</div>}
              {feature === "inventory" && <div className="space-y-3">{inventoryIssues.length ? inventoryIssues.map((product: any) => <div key={product.id} className="flex items-center justify-between rounded-xl border border-amber-100 bg-amber-50/60 p-4"><div><p className="font-bold text-slate-900">{product.name}</p><p className="text-xs text-slate-500">{product.category || "Uncategorized"}</p></div><Badge className="bg-amber-100 text-amber-700">{Number(product.stock ?? 0) <= 0 ? "Out of stock" : `${product.stock} left`}</Badge></div>) : <Empty text="Your inventory is healthy. Keep your best sellers available." />}</div>}
            </CardContent></Card>
            <div className="flex flex-wrap gap-3"><Button onClick={() => navigate("/vendor/products")} className="bg-[#FF5500] font-bold text-white hover:bg-[#e54a00]">Manage products</Button><Button variant="outline" onClick={() => navigate("/vendor/profile")} className="font-bold">Update store profile</Button></div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
}

function Metric({ icon: Icon, label, value, detail }: { icon: any; label: string; value: string; detail: string }) { return <Card><CardContent className="p-5"><Icon className="h-5 w-5 text-[#FF5500]" /><p className="mt-4 text-2xl font-black text-slate-950">{value}</p><p className="mt-1 text-sm font-bold text-slate-700">{label}</p><p className="mt-1 text-xs text-slate-500">{detail}</p></CardContent></Card>; }
function Empty({ text }: { text: string }) { return <div className="rounded-xl bg-slate-50 p-5 text-sm font-medium text-slate-500">{text}</div>; }
