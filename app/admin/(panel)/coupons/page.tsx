import { desc } from "drizzle-orm";
import { Trash2 } from "lucide-react";
import { Card, PageTitle, inputCls, labelCls } from "@/components/admin/ui";
import { ActionButton } from "@/components/admin/Confirm";
import { deleteCoupon, saveCoupon, toggleCoupon } from "@/app/actions/admin";
import { getDb, schema as s } from "@/lib/db";
import { rs } from "@/lib/format";

export const metadata = { title: "Coupons" };

export default async function Coupons() {
  const db = await getDb();
  const rows = await db.select().from(s.coupons).orderBy(desc(s.coupons.id));
  return (
    <>
      <PageTitle title="Discount codes" sub="Customers enter these at checkout. Tip: put an active code in the announcement bar." />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card className="!p-0">
          <ul className="divide-y divide-black/5 sm:hidden">
            {rows.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4">
                <div className="min-w-0 flex-1">
                  <p className="truncate font-mono font-bold">{c.code}</p>
                  <p className="text-xs text-muted">{c.percent}% off{c.minTotal ? ` · min. ${rs(c.minTotal)}` : ""} · used {c.uses}×</p>
                </div>
                <ActionButton action={toggleCoupon.bind(null, c.id, !c.active)} className={`min-h-10 rounded-full px-3.5 text-xs font-semibold ${c.active ? "bg-emerald-100 text-emerald-900" : "bg-black/5 text-muted"}`}>{c.active ? "Active" : "Paused"}</ActionButton>
                <ActionButton action={deleteCoupon.bind(null, c.id)} label={`Delete ${c.code}`} confirmText={`Delete ${c.code}?`} className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></ActionButton>
              </li>
            ))}
          </ul>
          <table className="hidden w-full text-sm sm:table">
            <thead><tr className="text-left text-xs uppercase tracking-wider text-muted"><th className="px-4 py-3">Code</th><th>Discount</th><th>Min. order</th><th>Used</th><th>Status</th><th /></tr></thead>
            <tbody>
              {rows.map((c) => (
                <tr key={c.id} className="border-t border-black/5">
                  <td className="px-4 py-3 font-mono font-bold">{c.code}</td>
                  <td>{c.percent}%</td>
                  <td>{c.minTotal ? rs(c.minTotal) : "—"}</td>
                  <td className="tabular-nums">{c.uses}</td>
                  <td><ActionButton action={toggleCoupon.bind(null, c.id, !c.active)} className={`rounded-full px-3 py-1 text-xs font-semibold ${c.active ? "bg-emerald-100 text-emerald-900" : "bg-black/5 text-muted"}`}>{c.active ? "Active" : "Paused"}</ActionButton></td>
                  <td className="pr-4 text-right"><ActionButton action={deleteCoupon.bind(null, c.id)} label={`Delete ${c.code}`} confirmText={`Delete ${c.code}?`} className="rounded-lg p-2 text-muted hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></ActionButton></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!rows.length && <p className="py-10 text-center text-muted">No codes yet.</p>}
        </Card>
        <Card className="self-start">
          <p className="font-semibold">Create code</p>
          <form action={saveCoupon} className="mt-4 space-y-3">
            <label className="block"><span className={labelCls}>Code</span><input name="code" required className={`${inputCls} mt-1 uppercase`} placeholder="EID20" /></label>
            <div className="flex gap-3">
              <label className="block min-w-0 flex-1"><span className={labelCls}>% off</span><input name="percent" type="number" min={1} max={90} required defaultValue={10} className={`${inputCls} mt-1`} /></label>
              <label className="block min-w-0 flex-1"><span className={labelCls}>Min. order (Rs.)</span><input name="minTotal" type="number" min={0} defaultValue={0} className={`${inputCls} mt-1`} /></label>
            </div>
            <button className="btn-gold min-h-11 w-full rounded-xl py-3 text-sm font-bold">Save code</button>
          </form>
        </Card>
      </div>
    </>
  );
}
