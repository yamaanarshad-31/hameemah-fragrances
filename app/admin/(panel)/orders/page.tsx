import Link from "next/link";
import { desc } from "drizzle-orm";
import { Card, PageTitle, StatusBadge } from "@/components/admin/ui";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { getDb, schema as s } from "@/lib/db";
import { rs, STATUSES } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function Orders({ searchParams }: PageProps<"/admin/orders">) {
  const sp = await searchParams;
  const status = typeof sp.status === "string" ? sp.status : "";
  const q = typeof sp.q === "string" ? sp.q.trim().toLowerCase() : "";
  const db = await getDb();
  const all = await db.select().from(s.orders).orderBy(desc(s.orders.createdAt));
  const list = all.filter((o) => (!status || o.status === status) && (!q || [o.orderNo, o.name, o.phone, o.city].some((f) => f.toLowerCase().includes(q))));
  const tab = (st: string, label: string) => {
    const n = st ? all.filter((o) => o.status === st).length : all.length;
    const on = status === st;
    return <Link key={st} href={st ? `/admin/orders?status=${st}` : "/admin/orders"} className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold capitalize transition ${on ? "bg-ink text-cream" : "bg-white text-ink/70 hover:text-ink"}`}>{label} <span className="opacity-60">{n}</span></Link>;
  };
  return (
    <>
      <PageTitle title="Orders" sub="Confirm new orders by phone/WhatsApp, then move them along." />
      <div className="no-scrollbar mb-4 flex gap-2 overflow-x-auto">{tab("", "All")}{STATUSES.map((st) => tab(st, st))}</div>
      <Card className="!p-0">
        <form className="border-b border-black/5 p-4">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" defaultValue={q} placeholder="Search by order no, name, phone or city" aria-label="Search orders" className="w-full max-w-sm rounded-xl border border-black/10 px-3.5 py-2 text-sm focus:border-emerald focus:outline-none" />
        </form>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[860px] text-sm">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="px-4 py-3">Order</th><th>Customer</th><th>Items</th><th>Payment</th><th>Total</th><th>Status</th></tr></thead>
            <tbody>
              {list.map((o) => (
                <tr key={o.id} className="border-t border-black/5 align-top hover:bg-black/[.015]">
                  <td className="px-4 py-3"><Link href={`/admin/orders/${o.id}`} className="font-semibold text-emerald hover:underline">{o.orderNo}</Link><p className="text-xs text-muted">{new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</p></td>
                  <td className="py-3">{o.name}<p className="text-xs text-muted">{o.phone} · {o.city}</p></td>
                  <td className="py-3 text-xs">{o.items.map((i, k) => <p key={k}>{i.qty}× {i.name} <span className="text-muted">({i.size})</span></p>)}</td>
                  <td className="py-3 text-xs uppercase">{o.payment}</td>
                  <td className="py-3 font-semibold tabular-nums">{rs(o.total)}</td>
                  <td className="py-3"><StatusSelect id={o.id} status={o.status ?? "pending"} /></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!list.length && <p className="py-12 text-center text-muted">No orders here yet.</p>}
        </div>
      </Card>
      <p className="mt-3 text-xs text-muted">Status colours: <StatusBadge status="pending" /> <StatusBadge status="confirmed" /> <StatusBadge status="shipped" /> <StatusBadge status="delivered" /> <StatusBadge status="cancelled" /></p>
    </>
  );
}
