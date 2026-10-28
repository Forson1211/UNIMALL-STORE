import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { ShoppingCart, Users, Package, Wallet, Download, RefreshCw, Plus, ArrowUpRight, Star, Phone, Trash2, CheckCircle2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { vendorService } from "@/services/vendorService";
import { api } from "@/integrations/api/client";
import { toast } from "sonner";
import { calculateVendorProfileCompleteness } from "@/lib/vendorProfileUtils";
import { collectedOrder, exportDashboardCsv, money, orderState, orderValue, type OverviewOrder } from "@/lib/dashboardMetrics";
import { MetricItem, OrderStatus, OverviewEmpty, OverviewPanel } from "@/components/dashboard/OverviewWidgets";

import { VendorSalesCards, VendorPerformance } from "@/components/dashboard/VendorAnalytics";
import { yearlySales } from "@/lib/vendorAnalytics";

interface VendorOrder extends OverviewOrder { order_id: string; buyer_name?: string; buyer_email?: string; buyer_id?: string; vendor_total: number; item_count: number }
interface Contact { id: string; name: string; phone: string; role: string }

export default function VendorDashboard() {
  const { user, profile } = useAuth();
  const client = useQueryClient();
  const [year, setYear] = useState(new Date().getUTCFullYear());
  const [contactOpen, setContactOpen] = useState(false);
  const [contact, setContact] = useState({ name: "", phone: "", role: "Campus Delivery Runner" });
  const productsQuery = useQuery({ queryKey: ["vendor-products", user?.id], enabled: !!user, refetchInterval: 15000, queryFn: () => vendorService.getProducts(user!.id) });
  const ordersQuery = useQuery({ queryKey: ["vendor-orders", user?.id], enabled: !!user, refetchInterval: 15000, queryFn: async () => await vendorService.getOrders(user!.id) as VendorOrder[] });
  const contactsQuery = useQuery({ queryKey: ["vendor-delivery-contacts", user?.id], enabled: !!user, refetchInterval: 15000, queryFn: async () => await vendorService.getDeliveryContacts() as Contact[] });
  const products = productsQuery.data || [], orders = ordersQuery.data || [];
  const productIds = products.map(product => product.id);
  const reviewsQuery = useQuery({ queryKey: ["vendor-reviews", user?.id, productIds.join(",")], enabled: !!user && productIds.length > 0, refetchInterval: 15000, queryFn: async () => {
    const { data, error } = await api.from("reviews").select("*").in("product_id", productIds); if (error) throw error; return data || [];
  } });
  const addContact = useMutation({ mutationFn: () => vendorService.addDeliveryContact({ name: contact.name.trim(), phone: contact.phone.trim(), role: contact.role }), onSuccess: () => { void client.invalidateQueries({ queryKey: ["vendor-delivery-contacts"] }); setContactOpen(false); setContact({ name: "", phone: "", role: "Campus Delivery Runner" }); toast.success("Delivery contact saved"); }, onError: (error: Error) => toast.error(error.message) });
  const removeContact = useMutation({ mutationFn: (id: string) => vendorService.removeDeliveryContact(id), onSuccess: () => { void client.invalidateQueries({ queryKey: ["vendor-delivery-contacts"] }); }, onError: (error: Error) => toast.error(error.message) });
  const reviews = reviewsQuery.data || [], approvedReviews = reviews.filter(review => review.status === "approved");
  const contacts = contactsQuery.data || [];
  const series = yearlySales(orders, year);
  const collected = orders.filter(collectedOrder), revenue = collected.reduce((sum, order) => sum + orderValue(order), 0);
  const activeProducts = products.filter(product => product.is_active && product.stock > 0);
  const lowStock = products.filter(product => product.is_active && product.stock <= 3);
  const customers = new Set(orders.map(order => order.buyer_id || order.buyer_email).filter(Boolean)).size;
  const delivered = orders.filter(order => orderState(order) === "delivered").length;
  const eligibleOrders = orders.filter(order => orderState(order) !== "cancelled");
  const fulfillmentRate = eligibleOrders.length ? delivered / eligibleOrders.length * 100 : 0;
  const completion = calculateVendorProfileCompleteness(profile);
  const storeName = profile?.store_name || profile?.full_name || "Your store";
  const rating = approvedReviews.length ? approvedReviews.reduce((sum, review) => sum + Number(review.rating), 0) / approvedReviews.length : 0;
  const pendingReplies = reviews.filter(review => !review.vendor_reply).length;
  const loading = productsQuery.isLoading || ordersQuery.isLoading;
  const error = productsQuery.error || ordersQuery.error;
  const refreshing = productsQuery.isFetching || ordersQuery.isFetching;
  const refresh = () => { void productsQuery.refetch(); void ordersQuery.refetch(); void contactsQuery.refetch(); void client.invalidateQueries({ queryKey: ["vendor-payout-requests", user?.id] }); void client.invalidateQueries({ queryKey: ["vendor-performance-items", user?.id] }); if (productIds.length) void reviewsQuery.refetch(); };
  return <DashboardLayout type="vendor" title="Store overview">
    <div className="mx-auto max-w-[1600px] space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-3"><div><p className="mb-1 text-[11px] text-muted-foreground">Dashboard / eCommerce</p><h1 className="text-[23px] font-semibold tracking-[-0.035em]">Store overview</h1><p className="mt-1 text-xs text-muted-foreground">{storeName} {profile?.campus ? `· ${profile.campus}` : "· Your campus business"}</p></div><div className="flex items-center gap-2"><Button size="sm" onClick={refresh} disabled={refreshing} className="h-9 w-9 rounded-md border-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 p-0 shadow-none cursor-pointer" aria-label="Refresh store overview"><RefreshCw className={`h-3.5 w-3.5 ${refreshing ? "animate-spin" : ""}`} /></Button><Button size="sm" className="hidden h-9 gap-2 rounded-md border-0 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 text-xs sm:inline-flex shadow-none cursor-pointer" onClick={() => exportDashboardCsv(`unimall-store-${year}.csv`, [["Period", "Collected revenue (GHS)", "Orders", "Collected orders"], ...series.map(point => [point.date, point.revenue, point.orders, point.collected])])} disabled={loading}><Download className="h-3.5 w-3.5" />Export</Button><Button asChild size="sm" className="h-9 gap-1.5 rounded-md text-xs"><Link to="/vendor/products"><Plus className="h-3.5 w-3.5" />Add product</Link></Button></div></div>
      {error && <div role="alert" className="rounded-md border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">Your store data could not load. {error.message}<Button variant="link" onClick={refresh}>Try again</Button></div>}
      {loading ? <div role="status" className="grid gap-5 lg:grid-cols-3">{[0, 1, 2].map(index => <div key={index} className="dashboard-panel h-48 animate-pulse bg-muted" />)}<span className="sr-only">Loading store overview...</span></div> : !error && <>
      <div aria-label="Store statistics" className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-2 xl:grid-cols-4">
        {/* 1. Purple Card: Collected Sales */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#7042F4] via-[#7B4FF8] to-[#8C62FC] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {money(revenue, true)}
            </span>
            <Wallet className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Collected sales</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">Your campus directory</p>
          </div>
          <svg viewBox="0 0 144 24" fill="none" className="absolute -bottom-0.5 left-0 right-0 w-full h-5 text-white/30 stroke-current pointer-events-none" strokeWidth="2">
            <path d="M0 16 Q 36 4, 72 16 T 144 16" />
          </svg>
        </div>

        {/* 2. Blue Card: Total Orders */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#0091FF] via-[#00A3FF] to-[#33B5FF] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {orders.length.toLocaleString()}
            </span>
            <ShoppingCart className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Total orders</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">Ready for your review</p>
          </div>
          <svg viewBox="0 0 144 24" fill="none" className="absolute -bottom-0.5 left-0 right-0 w-full h-5 text-white/30 stroke-current pointer-events-none" strokeWidth="2">
            <path d="M0 16 Q 36 4, 72 16 T 144 16" />
          </svg>
        </div>

        {/* 3. Orange Card: Products */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FF8C00] via-[#FFA01C] to-[#FFB340] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {products.length.toLocaleString()}
            </span>
            <Package className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Products</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">Store items in catalog</p>
          </div>
          <svg viewBox="0 0 100 20" fill="currentColor" className="absolute bottom-0 left-2 right-2 h-5 text-white/25 pointer-events-none">
            <rect x="0" y="12" width="4" height="8" rx="1" />
            <rect x="8" y="6" width="4" height="14" rx="1" />
            <rect x="16" y="14" width="4" height="6" rx="1" />
            <rect x="24" y="4" width="4" height="16" rx="1" />
            <rect x="32" y="8" width="4" height="12" rx="1" />
            <rect x="40" y="2" width="4" height="18" rx="1" />
            <rect x="48" y="10" width="4" height="10" rx="1" />
            <rect x="56" y="6" width="4" height="14" rx="1" />
            <rect x="64" y="14" width="4" height="6" rx="1" />
            <rect x="72" y="2" width="4" height="18" rx="1" />
            <rect x="80" y="8" width="4" height="12" rx="1" />
            <rect x="88" y="12" width="4" height="8" rx="1" />
            <rect x="96" y="6" width="4" height="14" rx="1" />
          </svg>
        </div>

        {/* 4. Pink/Rose Card: Customers */}
        <div className="relative overflow-hidden p-4 sm:p-5 rounded-2xl bg-gradient-to-br from-[#FF2D6C] via-[#FF3B7A] to-[#FF5E94] text-white shadow-sm flex flex-col justify-between min-h-[135px] sm:min-h-[145px]">
          <div className="flex items-start justify-between gap-2 relative z-10">
            <span className="text-2xl sm:text-3xl md:text-4xl font-extrabold tracking-tight leading-none">
              {customers.toLocaleString()}
            </span>
            <Users className="h-6 w-6 sm:h-7 sm:w-7 text-white/90 stroke-[1.8] shrink-0" />
          </div>
          <div className="relative z-10 mt-3 sm:mt-4">
            <p className="text-xs sm:text-sm font-bold leading-tight">Customers</p>
            <p className="text-[10px] sm:text-xs text-white/80 font-normal mt-0.5 line-clamp-1">Shoppers on your store</p>
          </div>
          <svg viewBox="0 0 144 24" fill="none" className="absolute -bottom-0.5 left-0 right-0 w-full h-5 text-white/30 stroke-current pointer-events-none" strokeWidth="2">
            <path d="M0 16 Q 36 4, 72 16 T 144 16" />
          </svg>
        </div>
      </div>
      <VendorSalesCards orders={orders} products={products} reviewCount={approvedReviews.length} year={year} setYear={setYear} userId={user!.id} />
      <VendorPerformance orders={orders} products={products} year={year} userId={user!.id} />
      <div className="dashboard-panel flex flex-wrap items-center justify-between gap-5 px-5 py-4 sm:px-6"><div className="flex items-center gap-3"><span className="rounded-md bg-emerald-500/10 p-2.5 text-emerald-600"><CheckCircle2 className="h-5 w-5" /></span><div><p className="text-sm font-medium">Store readiness <span className="ml-2 text-xs text-emerald-600">{completion.score}% complete</span></p><p className="mt-1 text-xs text-muted-foreground">{activeProducts.length} ready to sell / {lowStock.length} low stock / {Math.round(fulfillmentRate)}% of eligible orders delivered</p></div></div><Button asChild size="sm" className="rounded-md border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold shadow-xs cursor-pointer"><Link to={completion.isComplete ? "/vendor/catalog-health" : "/vendor/profile"}>{completion.isComplete ? "Check catalog health" : "Complete store profile"}<ArrowUpRight className="ml-2 h-3.5 w-3.5" /></Link></Button></div>
      <div className="grid gap-5 xl:grid-cols-3">
        <OverviewPanel title="Recent orders" description="Your latest customer purchases" className="xl:col-span-2" bodyClassName="px-0 pb-0 sm:px-0 sm:pb-0" action={<Button asChild variant="ghost" size="sm" className="h-7 text-xs text-primary"><Link to="/vendor/orders">View all</Link></Button>}>
          {!orders.length ? <OverviewEmpty title="Your first order starts here" description="Publish your products and share your store link with customers." action={<Button asChild size="sm" className="rounded-md border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold shadow-xs cursor-pointer"><Link to="/vendor/products">View products</Link></Button>} /> : <div className="overflow-x-auto"><table className="dashboard-table"><thead><tr><th>Order</th><th>Customer</th><th>Your total</th><th>Status</th></tr></thead><tbody>{orders.slice(0, 6).map(order => <tr key={order.order_id}><td><Link to="/vendor/orders" className="font-medium text-primary">#{order.order_id.slice(0, 8)}</Link><p className="mt-1 text-[10px] text-muted-foreground">{new Date(order.created_at).toLocaleDateString("en-GH", { timeZone: "Africa/Accra", day: "numeric", month: "short" })}</p></td><td className="min-w-[140px]"><p className="font-medium">{order.buyer_name || "Campus buyer"}</p><p className="mt-1 text-[10px] text-muted-foreground">{order.item_count} item{order.item_count === 1 ? "" : "s"}</p></td><td className="whitespace-nowrap font-medium">{money(orderValue(order))}</td><td><OrderStatus status={orderState(order)} /></td></tr>)}</tbody></table></div>}
        </OverviewPanel>
        <OverviewPanel title="Customer trust" description="Feedback from your store's customers" action={<Star className="mt-1 h-4 w-4 text-amber-400" />}>
          {reviewsQuery.error ? <p role="alert" className="text-xs text-muted-foreground">Reviews could not load. <Button variant="link" onClick={() => reviewsQuery.refetch()}>Retry</Button></p> : <><p className="text-[36px] font-semibold tracking-[-0.04em]">{rating.toFixed(1)}<span className="ml-1 text-base font-normal text-muted-foreground">/ 5</span></p><div className="mt-2 flex gap-1">{[1, 2, 3, 4, 5].map(star => <Star key={star} className={`h-4 w-4 ${star <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-border"}`} />)}</div><p className="mt-3 text-xs text-muted-foreground">{approvedReviews.length} published review{approvedReviews.length === 1 ? "" : "s"}</p><div className="mt-6 flex items-center justify-between border-t border-border pt-4"><span className="text-xs text-muted-foreground">Awaiting your reply</span><span className="rounded bg-primary/10 px-2 py-1 text-xs font-medium text-primary">{pendingReplies}</span></div><Button asChild size="sm" className="mt-4 w-full rounded-md border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold shadow-xs cursor-pointer"><Link to="/vendor/reviews">Manage reviews</Link></Button></>}
        </OverviewPanel>
      </div>
      <div className="grid gap-5">
        <OverviewPanel title="Delivery contacts" description="Your campus runners and helpers" action={<Button size="icon" variant="ghost" aria-label="Add delivery contact" onClick={() => setContactOpen(true)} className="h-7 w-7 text-muted-foreground"><Plus className="h-4 w-4" /></Button>}>
          {contactsQuery.error ? <p role="alert" className="text-xs text-muted-foreground">Contacts could not load. <Button variant="link" onClick={() => contactsQuery.refetch()}>Retry</Button></p> : !contacts.length ? <OverviewEmpty title="Keep your team close" description="Save the people who help deliver your orders. Contacts do not grant dashboard access." action={<Button size="sm" onClick={() => setContactOpen(true)} className="rounded-md border-0 bg-[#FF5500] hover:bg-[#E04B00] text-white text-xs font-semibold shadow-xs cursor-pointer">Add contact</Button>} /> : <div className="space-y-5">{contacts.map(member => <div key={member.id} className="flex items-start gap-3"><span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-cyan-500/10 text-xs font-medium text-cyan-600">{member.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><p className="truncate text-xs font-medium">{member.name}</p><p className="mt-1 text-[10px] text-muted-foreground">{member.role}</p><a href={`tel:${member.phone}`} className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-primary"><Phone className="h-3 w-3" />{member.phone}</a></div><Button variant="ghost" size="icon" aria-label={`Remove contact ${member.name}`} disabled={removeContact.isPending} onClick={() => removeContact.mutate(member.id)} className="h-7 w-7 text-muted-foreground hover:text-rose-500"><Trash2 className="h-3.5 w-3.5" /></Button></div>)}</div>}
        </OverviewPanel>
      </div>
      </>}
    </div>
    <Dialog open={contactOpen} onOpenChange={setContactOpen}><DialogContent className="max-w-md rounded-lg"><DialogHeader><DialogTitle>Add delivery contact</DialogTitle><DialogDescription>Save someone who helps with your store deliveries. This does not grant account access.</DialogDescription></DialogHeader><form className="space-y-4 pt-2" onSubmit={event => { event.preventDefault(); if (!contact.name.trim() || !/^\+?[0-9\s-]{9,20}$/.test(contact.phone.trim())) { toast.error("Enter a name and a valid contact phone number."); return; } addContact.mutate(); }}><div className="space-y-2"><Label htmlFor="contact-name">Full name</Label><Input id="contact-name" placeholder="e.g. Kwame Mensah" value={contact.name} onChange={event => setContact({ ...contact, name: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="contact-role">Role</Label><Input id="contact-role" value={contact.role} onChange={event => setContact({ ...contact, role: event.target.value })} required /></div><div className="space-y-2"><Label htmlFor="contact-phone">Phone number</Label><Input id="contact-phone" type="tel" placeholder="e.g. 024 123 4567" value={contact.phone} onChange={event => setContact({ ...contact, phone: event.target.value })} required /></div><DialogFooter><Button type="button" variant="outline" onClick={() => setContactOpen(false)}>Cancel</Button><Button type="submit" disabled={addContact.isPending}>{addContact.isPending ? "Saving..." : "Save contact"}</Button></DialogFooter></form></DialogContent></Dialog>
  </DashboardLayout>;
}