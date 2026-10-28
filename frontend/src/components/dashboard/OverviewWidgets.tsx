import { type ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowUpRight, Package, ShoppingBag, type LucideIcon } from "lucide-react";
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { money, type OverviewPoint } from "@/lib/dashboardMetrics";

export const DASHBOARD_COLORS = ["#ff6b2c", "#00b7c7", "#29b77e", "#ffb547", "#8b7cf8", "#ea5971"];
export const toneStyles = {
  orange: "bg-orange-100/80 text-[#f26932] dark:bg-orange-500/15",
  cyan: "bg-cyan-100/80 text-cyan-600 dark:bg-cyan-500/15",
  green: "bg-emerald-100/80 text-emerald-600 dark:bg-emerald-500/15",
  purple: "bg-violet-100/80 text-violet-500 dark:bg-violet-500/15",
  red: "bg-rose-100/80 text-rose-500 dark:bg-rose-500/15",
} as const;

export function OverviewPanel({ title, description, action, children, className, bodyClassName }: { title: string; description?: string; action?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string }) {
  return <section className={cn("dashboard-panel min-w-0", className)}>
    <div className="flex items-start justify-between gap-3 px-5 pt-5 sm:px-6 sm:pt-6">
      <div className="min-w-0"><h2 className="text-[17px] font-semibold tracking-[-0.02em] text-foreground">{title}</h2>{description && <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">{description}</p>}</div>{action}
    </div>
    <div className={cn("p-5 sm:p-6", bodyClassName)}>{children}</div>
  </section>;
}

export function MetricItem({ label, value, icon: Icon, tone = "orange", note }: { label: string; value: ReactNode; icon: LucideIcon; tone?: keyof typeof toneStyles; note?: string }) {
  return <div className="flex min-w-0 items-center gap-3">
    <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-md", toneStyles[tone])}><Icon className="h-[23px] w-[23px]" strokeWidth={1.7} /></span>
    <div className="min-w-0"><p className="break-words text-[21px] font-semibold leading-tight tracking-[-0.03em] text-foreground">{value}</p><p className="mt-1 text-[13px] text-muted-foreground">{label}</p>{note && <p className="mt-1 text-xs text-muted-foreground">{note}</p>}</div>
  </div>;
}

export function OverviewWelcome({ name, subtitle, value, detail, to, cta }: { name: string; subtitle: string; value: string; detail: string; to: string; cta: string }) {
  return <section className="dashboard-panel relative min-h-[198px] overflow-hidden p-5 sm:p-6">
    <div className="relative z-10 max-w-[72%]"><h2 className="text-[18px] font-semibold tracking-[-0.03em]">Welcome back, {name}</h2><p className="mt-1 text-[13px] text-muted-foreground">{subtitle}</p><p className="mt-4 text-[26px] font-semibold leading-tight tracking-[-0.04em] text-primary">{value}</p><p className="mb-4 mt-1 text-xs text-muted-foreground">{detail}</p><Button asChild size="sm" className="rounded-md px-4 shadow-sm"><Link to={to}>{cta}<ArrowUpRight className="ml-1.5 h-3.5 w-3.5" /></Link></Button></div>
    <div aria-hidden="true" className="absolute -bottom-7 -right-6 h-44 w-44 rounded-full bg-primary/[0.05]" />
    <div aria-hidden="true" className="absolute bottom-8 right-5 flex h-24 w-24 -rotate-6 items-center justify-center rounded-[24px] border border-orange-200/70 bg-gradient-to-br from-orange-50 to-orange-100/80 shadow-[0_12px_24px_-12px_rgba(249,115,22,0.35)] dark:border-orange-500/20 dark:from-orange-500/10 dark:to-orange-500/20"><ShoppingBag className="h-12 w-12 text-primary" strokeWidth={1.2} /><span className="absolute -right-1 -top-1 h-5 w-5 rounded-full border-4 border-card bg-emerald-400" /></div>
  </section>;
}

export function Sparkline({ values, color = "#00b7c7" }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1), min = Math.min(...values, 0);
  const points = values.map((value, i) => `${8 + i * 164 / Math.max(values.length - 1, 1)},${60 - (value - min) / (max - min || 1) * 46}`).join(" ");
  return <svg viewBox="0 0 180 72" className="mt-3 h-[78px] w-full" aria-label="Recent activity trend" role="img"><path d="M8 10V64M49 10V64M90 10V64M131 10V64M172 10V64" stroke="currentColor" className="text-border" strokeDasharray="3 5" /><polyline points={points} fill="none" stroke={color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />{values.map((value, i) => <circle key={i} cx={8 + i * 164 / Math.max(values.length - 1, 1)} cy={60 - (value - min) / (max - min || 1) * 46} r={3} fill={color} />)}</svg>;
}

export function ProgressRing({ value, label, color = "#ff9f43", semicircle = false }: { value: number; label?: string; color?: string; semicircle?: boolean }) {
  const normalized = Math.min(100, Math.max(0, value));
  return <div className={cn("relative mx-auto w-28 max-w-full", semicircle ? "h-20 overflow-hidden" : "h-28")}>
    <svg viewBox="0 0 120 120" className="h-full w-full -rotate-90" aria-hidden="true"><circle cx="60" cy="60" r="47" fill="none" stroke="currentColor" strokeWidth="9" className="text-muted" /><circle cx="60" cy="60" r="47" fill="none" stroke={color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${normalized / 100 * 295.31} 295.31`} /></svg>
    <div className="absolute inset-0 flex flex-col items-center justify-center"><span className="text-[25px] font-semibold tracking-tight">{Math.round(normalized)}%</span>{label && <span className="text-[11px] text-muted-foreground">{label}</span>}</div>
  </div>;
}

export function RevenueReport({ data, total, summary, action }: { data: OverviewPoint[]; total: number; summary: { label: string; value: string }[]; action?: ReactNode }) {
  const hasRevenue = data.some(point => point.revenue > 0);
  return <OverviewPanel title="Revenue report" description="Collected revenue from delivered orders" className="flex h-full flex-col" action={<span className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground"><span className="h-2.5 w-2.5 rounded-full bg-primary" />Revenue</span>} bodyClassName="flex flex-1 flex-col pb-0 sm:pb-0">
    <div className="grid min-w-0 flex-1 lg:grid-cols-[minmax(0,1fr)_180px]">
      <div className="min-w-0 pb-5 lg:pr-5"><div className="h-[250px] w-full" role="img" aria-label="Collected revenue chart">
        <ResponsiveContainer width="100%" height="100%"><BarChart data={data} margin={{ top: 15, left: -20, right: 5, bottom: 0 }}>
          <CartesianGrid vertical={false} stroke="hsl(var(--border))" strokeDasharray="3 4" /><XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} dy={8} /><YAxis axisLine={false} tickLine={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }} domain={[0, "auto"]} allowDecimals={false} />
          <Tooltip cursor={{ fill: "hsl(var(--muted))" }} contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} formatter={(value: number) => [money(value), "Revenue"]} />
          <Bar dataKey="revenue" fill="#ff6b2c" maxBarSize={22} radius={[5, 5, 0, 0]} isAnimationActive={false} />
        </BarChart></ResponsiveContainer>
      </div>{!hasRevenue && <p className="mt-1 text-center text-xs text-muted-foreground">Collected sales will appear here after delivery.</p>}</div>
      <div className="border-t border-border py-5 lg:border-l lg:border-t-0 lg:pl-5"><p className="text-xs text-muted-foreground">Selected period</p><p className="mt-2 break-words text-[25px] font-semibold tracking-[-0.04em]">{money(total, true)}</p><div className="my-5 space-y-3">{summary.map(item => <div key={item.label}><p className="text-xs text-muted-foreground">{item.label}</p><p className="mt-1 text-sm font-semibold">{item.value}</p></div>)}</div>{action}</div>
    </div>
  </OverviewPanel>;
}

export function DistributionChart({ data, title, description, centerLabel }: { data: { name: string; value: number; color?: string }[]; title: string; description?: string; centerLabel: string }) {
  const nonzero = data.filter(item => item.value > 0), total = nonzero.reduce((sum, item) => sum + item.value, 0);
  return <OverviewPanel title={title} description={description}><div className="flex flex-col items-center gap-3 sm:flex-row xl:flex-col 2xl:flex-row">
    <div className="relative h-[165px] w-[165px] shrink-0" role="img" aria-label={`${title}: ${total} total`}>
      <ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={nonzero.length ? nonzero : [{ name: "No data", value: 1 }]} dataKey="value" innerRadius={59} outerRadius={76} strokeWidth={0} paddingAngle={nonzero.length > 1 ? 3 : 0} isAnimationActive={false}>{(nonzero.length ? nonzero : [{ value: 1 }]).map((item, i) => <Cell key={i} fill={nonzero.length ? ("color" in item && item.color || DASHBOARD_COLORS[i % DASHBOARD_COLORS.length]) : "hsl(var(--muted))"} />)}</Pie>{nonzero.length > 0 && <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: 8, fontSize: 12 }} />}</PieChart></ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center"><span className="text-2xl font-semibold">{total.toLocaleString()}</span><span className="text-[11px] text-muted-foreground">{centerLabel}</span></div>
    </div>
    <div className="w-full min-w-0 space-y-3">{data.map((item, index) => <div key={item.name} className="flex items-center gap-2 text-xs"><span className="h-2 w-2 shrink-0 rounded-full" style={{ background: item.color || DASHBOARD_COLORS[index % DASHBOARD_COLORS.length] }} /><span className="flex-1 text-muted-foreground">{item.name}</span><span className="font-semibold">{item.value.toLocaleString()}</span></div>)}</div>
  </div></OverviewPanel>;
}

export function OverviewEmpty({ title, description, action }: { title: string; description: string; action?: ReactNode }) {
  return <div className="flex min-h-[170px] flex-col items-center justify-center px-3 py-5 text-center"><span className="mb-3 rounded-lg bg-muted p-3 text-muted-foreground"><Package className="h-6 w-6" strokeWidth={1.5} /></span><p className="text-sm font-medium">{title}</p><p className="mt-1 max-w-xs text-xs leading-relaxed text-muted-foreground">{description}</p>{action && <div className="mt-4">{action}</div>}</div>;
}

export function OrderStatus({ status }: { status: string }) {
  const colors: Record<string, string> = { pending: "bg-amber-500/10 text-amber-600", confirmed: "bg-cyan-500/10 text-cyan-600", processing: "bg-cyan-500/10 text-cyan-600", shipped: "bg-violet-500/10 text-violet-600", delivered: "bg-emerald-500/10 text-emerald-600", cancelled: "bg-rose-500/10 text-rose-600" };
  return <span className={cn("inline-flex rounded px-2 py-1 text-[11px] font-medium capitalize", colors[status] || "bg-muted text-muted-foreground")}>{status.replace(/_/g, " ")}</span>;
}
