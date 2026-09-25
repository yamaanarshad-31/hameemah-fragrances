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
    return <Link key={st} href={st ? `/admin/orders?status=${st}` : "/admin/orders"} className={`flex min-h-10 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full px-4 text-sm font-semibold capitalize transition ${on ? "bg-ink text-cream" : "bg-white text-ink/70 hover:text-ink"}`}>{label} <span className="opacity-60">{n}</span></Link>;
  };
  return (
    <>
      <PageTitle title="Orders" sub="Confirm new orders by phone/WhatsApp, then move them along." />
      <div className="scroll-row -mx-4 mb-4 flex scroll-px-4 gap-2 px-4 sm:mx-0 sm:px-0">{tab("", "All")}{STATUSES.map((st) => tab(st, st))}</div>
      <Card className="!p-0">
        <form className="border-b border-black/5 p-4">
          {status && <input type="hidden" name="status" value={status} />}
          <input name="q" type="search" enterKeyHint="search" defaultValue={q} placeholder="Search order no, name, phone, city" aria-label="Search orders" className="min-h-11 w-full max-w-sm rounded-xl border border-black/10 px-3.5 py-2 text-sm focus:border-emerald focus:outline-none" />
        </form>
        {/* phones and tablets: cards with the key facts and the status control; the full table on desktop */}
        <ul className="divide-y divide-black/5 lg:hidden">
          {list.map((o) => (
            <li key={o.id} className="p-4">
              <div className="flex items-start justify-between gap-3">
                <Link href={`/admin/orders/${o.id}`} className="min-w-0">
                  <span className="block font-semibold text-emerald">{o.orderNo}</span>
                  <span className="block text-xs text-muted">{new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })}</span>
                </Link>
                <span className="shrink-0 text-right font-semibold tabular-nums">{rs(o.total)}<span className="block text-[0.65rem] font-normal uppercase text-muted">{o.payment}</span></span>
              </div>
              <Link href={`/admin/orders/${o.id}`} className="mt-2 block text-sm">
                {o.name} <span className="text-muted">· {o.phone} · {o.city}</span>
                <span className="mt-1 block text-xs text-muted">{o.items.map((i) => `${i.qty}× ${i.name} (${i.size})`).join(", ")}</span>
              </Link>
              <div className="mt-3 flex items-center justify-between gap-3">
                <StatusSelect id={o.id} status={o.status ?? "pending"} />
                <Link href={`/admin/orders/${o.id}`} className="flex min-h-10 items-center text-sm font-semibold text-emerald">Open →</Link>
              </div>
            </li>
          ))}
        </ul>
        <div className="hidden overflow-x-auto lg:block">
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
        </div>
        {!list.length && <p className="py-12 text-center text-muted">No orders here yet.</p>}
      </Card>
      <p className="mt-3 hidden text-xs text-muted sm:block">Status colours: <StatusBadge status="pending" /> <StatusBadge status="confirmed" /> <StatusBadge status="shipped" /> <StatusBadge status="delivered" /> <StatusBadge status="cancelled" /></p>
    </>
  );
}
