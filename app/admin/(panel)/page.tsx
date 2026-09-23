import Link from "next/link";
import { desc } from "drizzle-orm";
import { AlertTriangle, ArrowRight, Banknote, Package, ShoppingBag, TrendingUp } from "lucide-react";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { getDb, schema as s } from "@/lib/db";
import { rs, STATUSES } from "@/lib/format";

export const metadata = { title: "Dashboard" };

const currentTime = () => Date.now();

export default async function Dashboard() {
  const db = await getDb();
  const [orders, products] = await Promise.all([db.select().from(s.orders).orderBy(desc(s.orders.createdAt)), db.select().from(s.products)]);
  const live = orders.filter((o) => o.status !== "cancelled");
  const revenue = live.reduce((a, o) => a + o.total, 0);
  const DAY = 86400000;
  const now = currentTime();
  const last30 = live.filter((o) => o.createdAt > now - 30 * DAY);
  const prev30 = live.filter((o) => o.createdAt <= now - 30 * DAY && o.createdAt > now - 60 * DAY);
  const r30 = last30.reduce((a, o) => a + o.total, 0);
  const p30 = prev30.reduce((a, o) => a + o.total, 0);
  const change = p30 ? Math.round(((r30 - p30) / p30) * 100) : null;
  const pending = orders.filter((o) => o.status === "pending").length;

  const today = new Date(); today.setHours(0, 0, 0, 0);
  const series = Array.from({ length: 30 }, (_, i) => {
    const start = today.getTime() - (29 - i) * DAY;
    const dayOrders = live.filter((o) => o.createdAt >= start && o.createdAt < start + DAY);
    return { day: String(start), label: new Date(start).toLocaleDateString("en-GB", { day: "numeric", month: "short" }), revenue: dayOrders.reduce((a, o) => a + o.total, 0), orders: dayOrders.length };
  });

  const top = [...products].sort((a, b) => (b.sold ?? 0) - (a.sold ?? 0)).slice(0, 5);
  const topMax = Math.max(1, ...top.map((p) => p.sold ?? 0));
  const low = products.flatMap((p) => p.variants.filter((v) => v.stock <= 5).map((v) => ({ p, v }))).slice(0, 6);
  const byStatus = STATUSES.map((st) => ({ st, n: orders.filter((o) => o.status === st).length }));

  const kpis = [
    { t: "Total revenue", v: rs(revenue), s: "all time, excluding cancelled", I: Banknote },
    { t: "Last 30 days", v: rs(r30), s: change === null ? "no earlier data yet" : `${change >= 0 ? "▲" : "▼"} ${Math.abs(change)}% vs previous 30 days`, I: TrendingUp },
    { t: "Orders", v: String(orders.length), s: `avg. order ${rs(live.length ? revenue / live.length : 0)}`, I: ShoppingBag },
    { t: "Awaiting action", v: String(pending), s: "pending orders to confirm", I: Package, hot: pending > 0 },
  ];

  return (
    <>
      <PageTitle title="Dashboard" sub={`Welcome back — here's how the store is doing. ${orders.some((o) => o.orderNo.startsWith("DEMO-")) ? "(Includes demo orders — remove them in Settings.)" : ""}`} />
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map(({ t, v, s: sub, I, hot }) => (
          <Card key={t} className={hot ? "!bg-emerald text-cream" : ""}>
            <div className="flex items-center justify-between"><p className={`text-sm ${hot ? "text-cream/70" : "text-muted"}`}>{t}</p><I className={`size-5 ${hot ? "text-gold" : "text-gold-3"}`} /></div>
            <p className="mt-3 font-display text-4xl font-semibold tabular-nums">{v}</p>
            <p className={`mt-1 text-xs ${hot ? "text-cream/60" : "text-muted"}`}>{sub}</p>
          </Card>
        ))}
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <p className="font-semibold">Revenue · last 30 days</p>
          <RevenueChart data={series} />
        </Card>
        <Card>
          <p className="font-semibold">Orders by status</p>
          <ul className="mt-4 space-y-3">
            {byStatus.map(({ st, n }) => (
              <li key={st} className="flex items-center justify-between">
                <StatusBadge status={st} />
                <Link href={`/admin/orders?status=${st}`} className="font-semibold tabular-nums hover:text-emerald">{n}</Link>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="mt-6 grid gap-6 xl:grid-cols-[2fr_1fr]">
        <Card>
          <div className="flex items-center justify-between"><p className="font-semibold">Recent orders</p><Link href="/admin/orders" className="flex items-center gap-1 text-sm font-semibold text-emerald">View all <ArrowRight className="size-4" /></Link></div>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full min-w-[520px] text-sm">
              <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="py-2">Order</th><th>Customer</th><th>Status</th><th className="text-right">Total</th></tr></thead>
              <tbody>
                {orders.slice(0, 7).map((o) => (
                  <tr key={o.id} className="border-t border-black/5">
                    <td className="py-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-emerald hover:underline">{o.orderNo}</Link><p className="text-xs text-muted">{new Date(o.createdAt).toLocaleDateString("en-GB")}</p></td>
                    <td>{o.name}<p className="text-xs text-muted">{o.city}</p></td>
                    <td><StatusBadge status={o.status ?? "pending"} /></td>
                    <td className="text-right font-semibold tabular-nums">{rs(o.total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {!orders.length && <p className="py-8 text-center text-muted">No orders yet.</p>}
          </div>
        </Card>
        <div className="space-y-6">
          <Card>
            <p className="font-semibold">Top sellers</p>
            <ul className="mt-4 space-y-3">
              {top.map((p) => (
                <li key={p.id}>
                  <div className="flex justify-between text-sm"><Link href={`/admin/products/${p.id}`} className="hover:text-emerald">{p.name}</Link><span className="tabular-nums text-muted">{p.sold} sold</span></div>
                  <div className="mt-1 h-1.5 rounded-full bg-black/5"><div className="h-full rounded-full bg-emerald" style={{ width: `${((p.sold ?? 0) / topMax) * 100}%` }} /></div>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className="flex items-center gap-2 font-semibold"><AlertTriangle className="size-4 text-amber-600" /> Low stock</p>
            {low.length ? (
              <ul className="mt-3 divide-y divide-black/5 text-sm">
                {low.map(({ p, v }) => <li key={p.id + v.size} className="flex justify-between py-2"><Link href={`/admin/products/${p.id}`} className="hover:text-emerald">{p.name} · {v.size}</Link><span className={`font-semibold ${v.stock === 0 ? "text-red-700" : "text-amber-700"}`}>{v.stock === 0 ? "Out" : `${v.stock} left`}</span></li>)}
              </ul>
            ) : <p className="mt-2 text-sm text-muted">All sizes are well stocked.</p>}
          </Card>
        </div>
      </div>
    </>
  );
}
