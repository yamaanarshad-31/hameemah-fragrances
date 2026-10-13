"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { clearProductSale, setProductSale } from "@/app/actions/admin";
import { ProductImage } from "@/components/store/ProductImage";
import type { Variant } from "@/lib/db/schema";
import { rs } from "@/lib/format";
import { hasSale, pricedVariants, showDay, windowState } from "@/lib/pricing";
import { SavedNote, useFlash } from "./FeatureToggle";
import { inputCls, labelCls } from "./ui";

export type SaleRow = { id: number; name: string; image: string | null; active: boolean; variants: Variant[]; salePercent: number; saleStart: string; saleEnd: string };

function Row({ p }: { p: SaleRow }) {
  const router = useRouter();
  const [pct, setPct] = useState(p.salePercent ? String(p.salePercent) : "");
  const [from, setFrom] = useState(p.saleStart);
  const [to, setTo] = useState(p.saleEnd);
  const [pending, run] = useTransition();
  const [msg, flash] = useFlash();
  const on = hasSale(p);
  // products at their regular price stay one line tall until "Add sale" is pressed
  const [open, setOpen] = useState(on);
  const perSize = !p.salePercent && on;
  const state = windowState(p.saleStart, p.saleEnd);
  // what shoppers would pay once this sale is live (ignores the master switch and the dates)
  const live = pricedVariants({ ...p, saleStart: "", saleEnd: "" }, true);
  const save = () => run(async () => {
    const n = Number(pct) || 0;
    if (!n && !perSize) { flash("Type a % first, e.g. 20", true); return; }
    const r = await setProductSale(p.id, { percent: n, start: from, end: to });
    if (!r.ok) { flash(r.error, true); return; }
    flash("Saved");
    router.refresh();
  });
  const clear = () => run(async () => {
    const r = await clearProductSale(p.id);
    if (!r.ok) { flash(r.error, true); return; }
    setPct(""); setFrom(""); setTo(""); setOpen(false);
    flash("Sale removed");
    router.refresh();
  });
  return (
    <li className="p-4">
      <div className="flex items-center gap-3">
        <span className="relative h-14 w-12 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-emerald to-forest"><ProductImage src={p.image} name={p.name} sizes="48px" /></span>
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{p.name}{!p.active && <span className="ml-2 text-xs font-normal text-muted">(hidden product)</span>}</p>
          <p className="text-xs text-muted">
            {p.variants.map((v, i) => {
              const now = live[i];
              return <span key={v.size} className="mr-3 inline-block whitespace-nowrap">{v.size}: {now.compareAt ? <><s>{rs(v.price)}</s> <b className="text-ink">{rs(now.price)}</b></> : rs(v.price)}</span>;
            })}
          </p>
        </div>
        {on && (
          <span className={`shrink-0 rounded-full px-2.5 py-1 text-xs font-semibold ${state === "scheduled" ? "bg-sky-100 text-sky-900" : state === "ended" ? "bg-black/5 text-muted" : "bg-emerald-100 text-emerald-900"}`}>
            {state === "scheduled" ? `Starts ${showDay(p.saleStart)}` : state === "ended" ? "Ended" : p.salePercent ? `-${p.salePercent}%` : "On sale"}
          </span>
        )}
        {!open && <button type="button" onClick={() => setOpen(true)} aria-label={`Add sale to ${p.name}`} className="min-h-11 shrink-0 rounded-xl border border-black/10 px-4 text-sm font-semibold hover:border-emerald">Add sale</button>}
      </div>
      {!open && <SavedNote msg={msg} className="mt-1" />}
      {open && <>
      <div className="mt-3 grid grid-cols-2 items-end gap-2 sm:grid-cols-[6.5rem_1fr_1fr_auto]">
        <label className="col-span-2 min-w-0 sm:col-span-1"><span className={labelCls}>% off</span><input type="number" inputMode="numeric" min={0} max={90} value={pct} onChange={(e) => setPct(e.target.value)} placeholder={perSize ? "—" : "20"} aria-label={`${p.name} — % off`} className={`${inputCls} mt-1`} /></label>
        <label className="min-w-0"><span className={labelCls}>Start (optional)</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label={`${p.name} — sale start`} className={`${inputCls} mt-1`} /></label>
        <label className="min-w-0"><span className={labelCls}>End (optional)</span><input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} aria-label={`${p.name} — sale end`} className={`${inputCls} mt-1`} /></label>
        <button type="button" onClick={save} disabled={pending} className="col-span-2 min-h-11 rounded-xl bg-emerald px-5 text-sm font-semibold text-cream disabled:opacity-60 sm:col-span-1">{pending ? "Saving…" : "Save"}</button>
      </div>
      <div className="mt-1 flex min-h-11 flex-wrap items-center gap-x-4 text-sm">
        <Link href={`/admin/products/${p.id}#sale`} className="inline-flex min-h-11 items-center font-semibold text-emerald underline-offset-4 hover:underline">{perSize ? "Edit sale price per size" : "Or set a sale price per size"}</Link>
        {on && <button type="button" onClick={clear} disabled={pending} className="min-h-11 font-semibold text-red-700 underline-offset-4 hover:underline disabled:opacity-50">Remove sale</button>}
        {!on && <button type="button" onClick={() => setOpen(false)} className="min-h-11 font-semibold text-muted underline-offset-4 hover:underline">Cancel</button>}
        <SavedNote msg={msg} className="ml-auto" />
      </div>
      </>}
    </li>
  );
}

export function SaleManager({ products }: { products: SaleRow[] }) {
  const [q, setQ] = useState("");
  const term = q.trim().toLowerCase();
  const list = products.filter((p) => !term || p.name.toLowerCase().includes(term));
  const onSale = list.filter(hasSale);
  const rest = list.filter((p) => !hasSale(p));
  return (
    <>
      <div className="border-b border-black/5 p-4">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search products…" aria-label="Search products" className="min-h-11 w-full max-w-xs rounded-xl border border-black/10 px-3.5 py-2 text-sm focus:border-emerald focus:outline-none" />
      </div>
      {onSale.length > 0 && <p className="bg-black/[.03] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink/60">With a sale ({onSale.length})</p>}
      <ul className="divide-y divide-black/5">{onSale.map((p) => <Row key={p.id} p={p} />)}</ul>
      {rest.length > 0 && <p className="bg-black/[.03] px-4 py-2 text-xs font-semibold uppercase tracking-wider text-ink/60">Regular price ({rest.length})</p>}
      <ul className="divide-y divide-black/5">{rest.map((p) => <Row key={p.id} p={p} />)}</ul>
      {!list.length && <p className="py-10 text-center text-muted">No products found.</p>}
    </>
  );
}
