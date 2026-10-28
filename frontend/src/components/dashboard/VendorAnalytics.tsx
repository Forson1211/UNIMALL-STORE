import { useId } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Area, AreaChart, Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowUpRight, Banknote, CircleDollarSign, Clock3, Package, ShoppingBag, Star, Truck, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/integrations/api/client";
import { vendorService } from "@/services/vendorService";
import { collectedOrder, money, orderState, orderValue, overviewSeries, type OverviewOrder } from "@/lib/dashboardMetrics";
import { productSales, yearlySales, type SaleLine } from "@/lib/vendorAnalytics";
import { OverviewEmpty, OverviewPanel, Sparkline, toneStyles } from "./OverviewWidgets";

interface Product { id: string; name: string; image_url?: string; category?: string; price: number; stock: number; is_active: boolean }
interface Payout { id: string; amount: number; status: string; requested_at: string }
const tooltipStyle = { background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 7, fontSize: 12 };

export function VendorSalesCards({ orders, products, reviewCount, year, setYear, userId }: { orders: OverviewOrder[]; products: Product[]; reviewCount: number; year: number; setYear: (year: number) => void; userId: string }) {
  const gradient = `weekly-${useId().replace(/:/g, "")}`;
  const weekly = overviewSeries(orders, "week"), yearly = yearlySales(orders, year);
  const weeklyRevenue = weekly.reduce((sum, point) => sum + point.revenue, 0);
  const yearRevenue = yearly.reduce((sum, point) => sum + point.revenue, 0);
  const peak = Math.max(...yearly.map(point => point.revenue));
  const years = [...new Set([new Date().getUTCFullYear(), year, ...orders.map(order => new Date(order.created_at).getUTCFullYear())])].filter(Number.isFinite).sort((a, b) => b - a);
  const payoutsQuery = useQuery({ queryKey: ["vendor-payout-requests", userId], enabled: !!userId, refetchInterval: 15000, queryFn: () => vendorService.getPayoutRequests(userId) as Promise<Payout[]> });
  const collected = orders.filter(collectedOrder);
  const allRevenue = collected.reduce((sum, order) => sum + orderValue(order), 0);
  const payouts = payoutsQuery.data || [];
  const paidOut = payouts.filter(payout => payout.status === "paid").reduce((sum, payout) => sum + Number(payout.amount), 0);
  const reserved = payouts.filter(payout => ["pending", "approved"].includes(payout.status)).reduce((sum, payout) => sum + Number(payout.amount), 0);
  const balance = Math.max(0, Math.round((allRevenue - paidOut - reserved) * 100) / 100);
  return <div className="grid items-stretch gap-5 xl:grid-cols-3">
    <OverviewPanel title="Weekly stats" description="Your last 7 days of sales" className="flex flex-col" action={<span className="rounded bg-primary/10 px-2 py-1 text-[11px] font-medium text-primary">This week</span>} bodyClassName="flex flex-1 flex-col pt-3 sm:pt-3">
      <div className="mb-2 flex items-baseline gap-2"><p className="text-[28px] font-semibold tracking-tight">{money(weeklyRevenue, true)}</p><span className="text-xs text-muted-foreground">collected</span></div>
      <div className="h-[150px] w-full" role="img" aria-label="Weekly collected sales">
        <ResponsiveContainer width="100%" height="100%"><AreaChart data={weekly} margin={{ top: 10, bottom: 0, left: 0, right: 0 }}><defs><linearGradient id={gradient} x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="#ff6b2c" stopOpacity={0.22} /><stop offset="100%" stopColor="#ff6b2c" stopOpacity={0.01} /></linearGradient></defs><XAxis dataKey="name" hide /><Tooltip contentStyle={tooltipStyle} formatter={(value: number) => [money(value), "Collected"]} /><Area type="monotone" dataKey="revenue" stroke="#ff6b2c" strokeWidth={2} fill={`url(#${gradient})`} isAnimationActive={false} /></AreaChart></ResponsiveContainer>
      </div>
      <div className="mt-auto space-y-5 pt-5">{[
        { icon: ShoppingBag, label: "New orders", detail: "Last 7 days", value: weekly.reduce((sum, point) => sum + point.orders, 0), tone: "orange" as const, to: "/vendor/orders" },
        { icon: Package, label: "Ready to sell", detail: "Published and in stock", value: products.filter(product => product.is_active && product.stock > 0).length, tone: "cyan" as const, to: "/vendor/products" },
        { icon: Star, label: "Customer reviews", detail: "Published store feedback", value: reviewCount, tone: "red" as const, to: "/vendor/reviews" },
      ].map(item => <Link key={item.label} to={item.to} className="group flex items-center gap-3"><span className={`rounded-md p-2.5 ${toneStyles[item.tone]}`}><item.icon className="h-[18px] w-[18px]" strokeWidth={1.7} /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-medium group-hover:text-primary">{item.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p></div><span className={`rounded px-2 py-1 text-xs font-medium ${toneStyles[item.tone]}`}>{item.value}</span></Link>)}</div>
    </OverviewPanel>
    <OverviewPanel title="Yearly sales" description="Collected revenue, month by month" className="flex flex-col" action={<select aria-label="Sales year" value={year} onChange={event => setYear(Number(event.target.value))} className="h-8 rounded-md border border-border bg-card px-2 text-xs"><option hidden>Select year</option>{years.map(value => <option key={value} value={value}>{value}</option>)}</select>} bodyClassName="flex flex-1 flex-col pt-3 sm:pt-3">
      <p className="text-[28px] font-semibold tracking-tight">{money(yearRevenue, true)}</p><div className="mt-5 h-[215px] min-w-0 flex-1" role="img" aria-label={`${year} monthly collected sales`}><ResponsiveContainer width="100%" height="100%" minHeight={215}><BarChart data={yearly} margin={{ top: 5, left: 0, right: 0, bottom: 0 }}><XAxis dataKey="name" axisLine={false} tickLine={false} interval={1} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 10 }} dy={8} /><Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={tooltipStyle} formatter={(value: number) => [money(value), "Collected"]} /><Bar dataKey="revenue" radius={[4, 4, 0, 0]} maxBarSize={22} isAnimationActive={false}>{yearly.map(point => <Cell key={point.date} fill={peak > 0 && point.revenue === peak ? "#ff6b2c" : "hsl(var(--primary) / 0.12)"} />)}</Bar></BarChart></ResponsiveContainer></div>
      <div className="mt-6 grid grid-cols-2 gap-4 border-t border-border pt-5"><div className="flex items-center gap-2.5"><span className={`rounded-md p-2 ${toneStyles.orange}`}><CircleDollarSign className="h-4 w-4" /></span><div><p className="text-[11px] text-muted-foreground">Collected orders</p><p className="mt-1 text-sm font-semibold">{yearly.reduce((sum, point) => sum + point.collected, 0)}</p></div></div><div className="flex items-center gap-2.5"><span className={`rounded-md p-2 ${toneStyles.cyan}`}><ShoppingBag className="h-4 w-4" /></span><div><p className="text-[11px] text-muted-foreground">Average sale</p><p className="mt-1 text-sm font-semibold">{money(yearRevenue / (yearly.reduce((sum, point) => sum + point.collected, 0) || 1), true)}</p></div></div></div>
      {!yearRevenue && <p className="mt-4 text-[11px] text-muted-foreground">Delivered, paid orders will build your sales chart.</p>}
    </OverviewPanel>
    <OverviewPanel title="Payments & payouts" description="Your store's money at a glance" className="flex flex-col" bodyClassName="flex flex-1 flex-col">
      {payoutsQuery.error ? <div role="alert" className="text-sm text-muted-foreground">Payout details could not load.<Button variant="link" onClick={() => payoutsQuery.refetch()}>Retry</Button></div> : payoutsQuery.isLoading ? <p role="status" className="text-xs text-muted-foreground">Loading payout details...</p> : <><div className="space-y-6">{[
        { icon: Banknote, label: "Cash on delivery", detail: "Collected sales, all time", value: money(allRevenue, true), tone: "orange" as const },
        { icon: Wallet, label: "Available balance", detail: "After paid and reserved payouts", value: money(balance, true), tone: "cyan" as const },
        { icon: Clock3, label: "Pending payouts", detail: "Requested or approved", value: money(reserved, true), tone: "purple" as const },
        { icon: CircleDollarSign, label: "Paid out", detail: "Completed payout requests", value: money(paidOut, true), tone: "green" as const },
      ].map(item => <div key={item.label} className="flex items-center gap-3"><span className={`rounded-md p-2.5 ${toneStyles[item.tone]}`}><item.icon className="h-5 w-5" strokeWidth={1.6} /></span><div className="min-w-0 flex-1"><p className="text-[13px] font-medium">{item.label}</p><p className="mt-1 text-[11px] text-muted-foreground">{item.detail}</p></div><span className="text-xs font-semibold">{item.value}</span></div>)}</div><p className="mt-6 text-[11px] leading-relaxed text-muted-foreground">Cash on delivery is available for your customers.</p><Button asChild className="mt-auto w-full rounded-md border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold shadow-xs h-9 cursor-pointer"><Link to="/vendor/settings">Manage payouts<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link></Button></>}
    </OverviewPanel>
  </div>;
}

export function VendorPerformance({ products, orders, userId, year }: { products: Product[]; orders: OverviewOrder[]; userId: string; year: number }) {
  const itemsQuery = useQuery({ queryKey: ["vendor-performance-items", userId], enabled: !!userId, refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await api.from("order_items").select("order_id, product_id, quantity, price_at_purchase, total_price, fulfillment_status").eq("vendor_id", userId);
    if (error) throw error; return (data || []) as SaleLine[];
  } });
  const sales = productSales(itemsQuery.data || [], orders, year);
  const ranked = [...products].sort((a, b) => (sales.get(b.id)?.revenue || 0) - (sales.get(a.id)?.revenue || 0)).slice(0, 5);
  const total = [...sales.values()].reduce((sum, entry) => sum + entry.revenue, 0);
  return <div className="grid items-stretch gap-5 xl:grid-cols-3">
    <OverviewPanel title="Recent transactions" description="Latest orders and their payment status" action={<Clock3 className="h-4 w-4 text-muted-foreground" />}>
      {!orders.length ? <OverviewEmpty title="Your sales story starts here" description="New orders and collected payments will appear in this timeline." action={<Button asChild size="sm" className="rounded-md border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold shadow-xs cursor-pointer"><Link to="/vendor/products">Manage products</Link></Button>} /> : <ol className="space-y-0">{orders.slice(0, 5).map((order, index) => <li key={order.order_id || order.id} className="relative flex gap-3 pb-7 last:pb-0"><div className="w-12 shrink-0 pt-0.5 text-[10px] leading-5 text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-GH", { month: "short", day: "numeric", timeZone: "Africa/Accra" })}</div><div className="relative flex w-3 shrink-0 justify-center"><span className={`relative z-10 mt-1.5 h-2.5 w-2.5 rounded-full border-2 bg-card ${collectedOrder(order) ? "border-emerald-400" : orderState(order) === "cancelled" ? "border-rose-400" : "border-primary"}`} />{index < Math.min(orders.length, 5) - 1 && <span className="absolute bottom-[-6px] top-4 w-px bg-border" />}</div><div className="min-w-0"><p className="text-xs font-medium">{collectedOrder(order) ? "Sale collected" : orderState(order) === "cancelled" ? "Order cancelled" : "Order received"}</p><p className="mt-1 text-[11px] text-muted-foreground">{money(orderValue(order))}<span className="mx-1">/</span><span className="capitalize">{orderState(order)}</span></p><Link to="/vendor/orders" className="mt-1 inline-block text-[11px] text-primary">#{(order.order_id || order.id || "").slice(0, 8)}</Link></div></li>)}</ol>}
      <Button asChild variant="ghost" size="sm" className="mt-5 w-full text-xs text-primary"><Link to="/vendor/orders">View all orders<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link></Button>
    </OverviewPanel>
    <OverviewPanel title="Product performance" description={`Collected product sales in ${year}`} className="xl:col-span-2" bodyClassName="px-0 pb-2 sm:px-0 sm:pb-2" action={<Button asChild size="sm" variant="ghost" className="h-7 text-xs text-primary"><Link to="/vendor/products">View products<ArrowUpRight className="ml-1 h-3.5 w-3.5" /></Link></Button>}>
      {itemsQuery.error ? <p role="alert" className="px-6 text-xs text-muted-foreground">Product sales could not load.<Button variant="link" onClick={() => itemsQuery.refetch()}>Retry</Button></p> : itemsQuery.isLoading ? <p role="status" className="px-6 py-10 text-xs text-muted-foreground">Loading product performance...</p> : !products.length ? <OverviewEmpty title="Make room for your best sellers" description="Add a product to start tracking its stock and sales." action={<Button asChild size="sm"><Link to="/vendor/products">Add product</Link></Button>} /> : <><div className="overflow-x-auto"><table className="dashboard-table"><thead><tr><th>Product</th><th>Sales share</th><th>Stock</th><th>Revenue</th><th>Trend</th></tr></thead><tbody>{ranked.map(product => {
        const sale = sales.get(product.id), share = total ? (sale?.revenue || 0) / total * 100 : 0;
        const stockLabel = !product.is_active ? "Draft" : product.stock === 0 ? "Out of stock" : product.stock <= 3 ? "Low stock" : "In stock";
        return <tr key={product.id}><td><Link to="/vendor/products" className="flex min-w-[175px] items-center gap-3"><span className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-md bg-muted/50">{product.image_url ? <img src={product.image_url} alt="" className="h-full w-full object-contain" /> : <Package className="h-5 w-5 text-muted-foreground" />}</span><span className="min-w-0"><span className="line-clamp-1 text-xs font-medium">{product.name}</span><span className="mt-1 block text-[10px] text-muted-foreground">{product.category} / {sale?.units || 0} sold</span></span></Link></td><td className="min-w-[100px]"><span className="text-xs">{share.toFixed(1)}%</span><div className="mt-2 h-1 w-16 rounded-full bg-muted"><div className="h-1 rounded-full bg-primary" style={{ width: `${share}%` }} /></div></td><td><span className={`whitespace-nowrap rounded px-2 py-1 text-[10px] ${!product.is_active ? "bg-muted text-muted-foreground" : product.stock <= 3 ? "bg-orange-500/10 text-primary" : "bg-emerald-500/10 text-emerald-600"}`}>{stockLabel}</span><p className="mt-1.5 text-[10px] text-muted-foreground">{product.stock} available</p></td><td className="whitespace-nowrap text-xs font-medium">{money(sale?.revenue || 0)}</td><td className="min-w-[110px]"><Sparkline values={sale?.monthly || Array(12).fill(0)} color="#ff6b2c" /></td></tr>;
      })}</tbody></table></div>{!total && <p className="px-6 pb-4 pt-3 text-[11px] text-muted-foreground">Sales shares and trends will update as paid orders are delivered.</p>}</>}
    </OverviewPanel>
  </div>;
}
