"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useOptimistic, useRef, useState, useTransition } from "react";
import { ImagePlus, Loader2, Pencil, Plus, Trash2, X } from "lucide-react";
import { deleteGiftSet, saveGiftSet, saveGiftWrapFee, toggleGiftSet } from "@/app/actions/admin";
import { ProductImage } from "@/components/store/ProductImage";
import type { GiftPart, GiftSet } from "@/lib/db/schema";
import { rs } from "@/lib/format";
import { SavedNote, useFlash } from "./FeatureToggle";
import { Toggle } from "./ProductRowActions";
import { Card, inputCls, labelCls } from "./ui";

export type GiftProduct = { id: number; name: string; active: boolean; sizes: { size: string; price: number; stock: number }[] };
type Draft = { id?: number; name: string; description: string; image: string; items: GiftPart[]; price: string; active: boolean };
const BLANK: Draft = { name: "", description: "", image: "", items: [], price: "", active: true };

function SetRow({ g, products, onEdit }: { g: GiftSet; products: GiftProduct[]; onEdit: () => void }) {
  const router = useRouter();
  const [on, setOn] = useOptimistic(!!g.active);
  const [pending, run] = useTransition();
  const [msg, flash] = useFlash();
  const parts = g.items.map((it) => {
    const p = products.find((x) => x.id === it.productId);
    const v = p?.sizes.find((x) => x.size === it.size);
    return { label: p ? `${p.name} ${it.size}` : "Removed perfume", ok: !!p && !!v && p.active, stock: v?.stock ?? 0 };
  });
  const broken = parts.some((x) => !x.ok);
  const soldOut = !broken && parts.some((x) => x.stock < 1);
  return (
    <li className="p-4">
      <div className="flex items-start gap-3">
        <span className="relative h-20 w-16 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-emerald to-forest"><ProductImage src={g.image || null} name={g.name} sizes="64px" /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold">{g.name}</p>
          <p className="text-sm tabular-nums">{rs(g.price)}</p>
          <p className="mt-0.5 text-xs text-muted">Inside: {parts.map((x) => x.label).join(" + ")}</p>
          {broken && <p className="mt-1 text-xs font-semibold text-red-700">A perfume in this set was removed or hidden, so the set is not shown on the website. Edit it to fix.</p>}
          {soldOut && <p className="mt-1 text-xs font-semibold text-amber-700">A perfume inside is out of stock — the set shows as “Sold out”.</p>}
        </div>
      </div>
      <div className="mt-2 flex flex-wrap items-center justify-end gap-x-3 gap-y-1">
        <SavedNote msg={msg} className="mr-auto" />
        <span className={`text-xs font-bold uppercase tracking-wider ${on ? "text-emerald-700" : "text-ink/40"}`}>{on ? "Showing" : "Hidden"}</span>
        <Toggle on={on} label={`${g.name} — ${on ? "hide" : "show"}`} onChange={(v) => run(async () => { setOn(v); await toggleGiftSet(g.id, v); flash("Saved"); })} />
        <button type="button" onClick={onEdit} aria-label={`Edit ${g.name}`} title="Edit" className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-ink"><Pencil className="size-4" /></button>
        <button type="button" disabled={pending} aria-label={`Delete ${g.name}`} title="Delete" onClick={() => confirm(`Delete the gift set "${g.name}"?`) && run(async () => { await deleteGiftSet(g.id); router.refresh(); })} className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 className="size-4" /></button>
      </div>
    </li>
  );
}

function WrapFee({ fee }: { fee: number }) {
  const [v, setV] = useState(String(fee));
  const [pending, run] = useTransition();
  const [msg, flash] = useFlash();
  const save = () => run(async () => {
    const r = await saveGiftWrapFee(v.trim() === "" ? NaN : Number(v));
    flash(r.ok ? "Saved" : r.error, !r.ok);
  });
  return (
    <Card>
      <p className="font-semibold">Gift wrapping at checkout</p>
      <p className="mt-1 text-sm text-muted">Customers can tick “gift wrapping” and write a gift message on any order. Set 0 to offer wrapping for free.</p>
      <div className="mt-4 flex items-end gap-3">
        <label className="block min-w-0 flex-1"><span className={labelCls}>Wrapping charge (Rs.)</span><input type="number" inputMode="numeric" min={0} value={v} onChange={(e) => setV(e.target.value)} className={`${inputCls} mt-1`} /></label>
        <button type="button" onClick={save} disabled={pending} className="min-h-11 rounded-xl bg-emerald px-5 text-sm font-semibold text-cream disabled:opacity-60">{pending ? "Saving…" : "Save"}</button>
      </div>
      <SavedNote msg={msg} className="mt-2" />
    </Card>
  );
}

export function GiftManager({ sets, products, wrapFee }: { sets: GiftSet[]; products: GiftProduct[]; wrapFee: number }) {
  const router = useRouter();
  const [d, setD] = useState<Draft>(BLANK);
  const [uploading, setUploading] = useState(false);
  const [pending, run] = useTransition();
  const [msg, flash] = useFlash();
  const fileRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLDivElement>(null);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setD((x) => ({ ...x, [k]: v }));
  const pickable = products.filter((p) => p.active && p.sizes.length);
  const sizesOf = (id: number) => products.find((p) => p.id === id)?.sizes ?? [];
  const worth = d.items.reduce((a, it) => a + (sizesOf(it.productId).find((v) => v.size === it.size)?.price ?? 0), 0);

  const upload = async (file?: File) => {
    if (!file) return;
    setUploading(true);
    const fd = new FormData();
    fd.append("files", file);
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      set("image", j.urls[0]);
    } catch (e) { flash((e as Error).message || "Upload failed", true); }
    setUploading(false);
    if (fileRef.current) fileRef.current.value = "";
  };
  const addItem = () => { const p = pickable[0]; if (p) set("items", [...d.items, { productId: p.id, size: p.sizes[0].size }]); };
  const setItem = (i: number, patch: Partial<GiftPart>) => set("items", d.items.map((it, k) => {
    if (k !== i) return it;
    const next = { ...it, ...patch };
    // a different perfume may not come in the size that was picked
    if (!sizesOf(next.productId).some((v) => v.size === next.size)) next.size = sizesOf(next.productId)[0]?.size ?? "";
    return next;
  }));
  const save = () => run(async () => {
    const r = await saveGiftSet({ ...d, price: Number(d.price) || 0 });
    if (!r.ok) { flash(r.error, true); return; }
    flash(d.id ? "Saved" : "Gift set created");
    setD(BLANK);
    router.refresh();
  });
  const edit = (g: GiftSet) => {
    setD({ id: g.id, name: g.name, description: g.description ?? "", image: g.image ?? "", items: g.items, price: String(g.price), active: !!g.active });
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-6">
        <Card className="!p-0">
          <p className="border-b border-black/5 p-4 font-semibold">Your gift sets ({sets.length})</p>
          <ul className="divide-y divide-black/5">{sets.map((g) => <SetRow key={g.id} g={g} products={products} onEdit={() => edit(g)} />)}</ul>
          {!sets.length && <p className="px-4 py-10 text-center text-muted">No gift sets yet — create your first one{" "}<span className="xl:hidden">below</span><span className="hidden xl:inline">on the right</span>.</p>}
        </Card>
        <WrapFee fee={wrapFee} />
      </div>

      <div ref={formRef} className="min-w-0 scroll-mt-20">
        <Card>
          <p className="font-semibold">{d.id ? `Edit “${d.name}”` : "Create a gift set"}</p>
          <div className="mt-4 space-y-4">
            <label className="block"><span className={labelCls}>Name *</span><input value={d.name} maxLength={80} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Eid Gift Box" className={`${inputCls} mt-1.5`} /></label>
            <label className="block"><span className={labelCls}>Short description</span><textarea rows={2} value={d.description} maxLength={600} onChange={(e) => set("description", e.target.value)} placeholder="Two bestsellers in a ribboned box." className={`${inputCls} mt-1.5`} /></label>

            <div>
              <span className={labelCls}>Photo</span>
              <div className="mt-1.5 flex items-center gap-3">
                <span className="relative h-24 w-20 shrink-0 overflow-hidden rounded-xl bg-gradient-to-b from-emerald to-forest">
                  {d.image ? <Image src={d.image} alt="" fill sizes="80px" className="object-cover" /> : <ProductImage src={null} name="Gift set" sizes="80px" />}
                </span>
                <div className="flex flex-wrap gap-2">
                  <button type="button" onClick={() => fileRef.current?.click()} disabled={uploading} className="flex min-h-11 items-center gap-2 rounded-xl border border-black/10 px-4 text-sm font-semibold hover:border-emerald">{uploading ? <Loader2 className="size-4 animate-spin" /> : <ImagePlus className="size-4" />}{uploading ? "Uploading…" : d.image ? "Change photo" : "Upload photo"}</button>
                  {d.image && <button type="button" onClick={() => set("image", "")} className="flex min-h-11 items-center gap-1 rounded-xl px-3 text-sm font-semibold text-muted hover:text-red-700"><X className="size-4" /> Remove</button>}
                </div>
              </div>
              <p className="mt-1 text-xs text-muted">No photo? The website shows your house bottle instead.</p>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => upload(e.target.files?.[0])} />
            </div>

            <div>
              <span className={labelCls}>Perfumes inside *</span>
              <ul className="mt-1.5 space-y-2">
                {d.items.map((it, i) => (
                  <li key={i} className="grid grid-cols-[minmax(0,1fr)_6.5rem_2.75rem] gap-2">
                    <select aria-label={`Perfume ${i + 1}`} value={it.productId} onChange={(e) => setItem(i, { productId: Number(e.target.value) })} className={inputCls}>
                      {!pickable.some((p) => p.id === it.productId) && <option value={it.productId}>(removed perfume)</option>}
                      {pickable.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                    </select>
                    <select aria-label={`Size of perfume ${i + 1}`} value={it.size} onChange={(e) => setItem(i, { size: e.target.value })} className={inputCls}>
                      {sizesOf(it.productId).map((v) => <option key={v.size} value={v.size}>{v.size}</option>)}
                    </select>
                    <button type="button" onClick={() => set("items", d.items.filter((_, k) => k !== i))} aria-label={`Remove perfume ${i + 1}`} className="flex size-11 items-center justify-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700"><Trash2 className="size-4" /></button>
                  </li>
                ))}
              </ul>
              {pickable.length === 0 ? <p className="mt-1 text-sm text-muted">Add a product first — gift sets are made from your perfumes.</p>
                : d.items.length < 10 && <button type="button" onClick={addItem} className="mt-1 flex min-h-11 items-center gap-1.5 text-sm font-semibold text-emerald"><Plus className="size-4" /> Add perfume</button>}
            </div>

            <label className="block"><span className={labelCls}>Gift set price (Rs.) *</span><input type="number" inputMode="numeric" min={1} value={d.price} onChange={(e) => set("price", e.target.value)} placeholder={worth ? String(worth) : "4990"} className={`${inputCls} mt-1.5`} />
              {worth > 0 && <span className="mt-1 block text-xs text-muted">Bought one by one these cost {rs(worth)}.{Number(d.price) > 0 && Number(d.price) < worth ? ` Customers save ${rs(worth - Number(d.price))}.` : ""}</span>}
            </label>
            <div className="flex min-h-11 items-center justify-between gap-3"><span className="text-sm">Show this set on the website</span><Toggle on={d.active} label="Show this set on the website" onChange={(v) => set("active", v)} /></div>
            <button type="button" onClick={save} disabled={pending || uploading} className="btn-gold min-h-11 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60">{pending ? "Saving…" : d.id ? "Save changes" : "Create gift set"}</button>
            {d.id && <button type="button" onClick={() => setD(BLANK)} className="min-h-11 w-full text-sm font-semibold text-muted">Cancel editing</button>}
            <SavedNote msg={msg} />
          </div>
        </Card>
      </div>
    </div>
  );
}
