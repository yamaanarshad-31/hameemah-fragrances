"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { ArrowLeft, ArrowRight, ExternalLink, ImagePlus, Loader2, Plus, Trash2, X } from "lucide-react";
import { deleteProduct, saveProduct } from "@/app/actions/admin";
import { Bottle } from "@/components/store/Bottle";
import { Card, inputCls, labelCls } from "./ui";
import { Toggle } from "./ProductRowActions";
import type { Variant } from "@/lib/db/schema";

type Cat = { id: number; name: string };
export type Init = {
  id?: number; name: string; slug: string; tagline: string; description: string; categoryId: number | null; concentration: string;
  topNotes: string; heartNotes: string; baseNotes: string; longevity: number; sillage: number; variants: Variant[]; images: string[];
  color: string; shape: number; featured: boolean; bestseller: boolean; isNew: boolean; active: boolean;
};

const EMPTY: Init = {
  name: "", slug: "", tagline: "", description: "", categoryId: null, concentration: "Eau de Parfum",
  topNotes: "", heartNotes: "", baseNotes: "", longevity: 4, sillage: 3,
  variants: [{ size: "50ml", price: 2990, compareAt: null, stock: 20 }, { size: "100ml", price: 4490, compareAt: null, stock: 20 }], images: [], color: "#b8860b", shape: 0,
  featured: false, bestseller: false, isNew: true, active: true,
};

const SWATCHES = ["#5a2d0c", "#8a1f11", "#b0415b", "#e8c7c1", "#c47a12", "#d9b43a", "#0f5132", "#1d5f8a", "#3b2a5c", "#2b1d14", "#e9dcc0", "#0f3d2a"];

export function ProductForm({ initial, cats }: { initial?: Init; cats: Cat[] }) {
  const router = useRouter();
  const [p, setP] = useState<Init>(initial ?? EMPTY);
  const [err, setErr] = useState("");
  const [saved, setSaved] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [drag, setDrag] = useState(false);
  const [pending, start] = useTransition();
  const fileRef = useRef<HTMLInputElement>(null);
  const set = <K extends keyof Init>(k: K, v: Init[K]) => { setP((x) => ({ ...x, [k]: v })); setSaved(false); };
  const setV = (i: number, patch: Partial<Variant>) => set("variants", p.variants.map((v, k) => (k === i ? { ...v, ...patch } : v)));

  const upload = async (files: FileList | File[]) => {
    const list = Array.from(files).filter((f) => f.type.startsWith("image/"));
    if (!list.length) return;
    setUploading(true); setErr("");
    const fd = new FormData();
    list.slice(0, 8).forEach((f) => fd.append("files", f));
    try {
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error);
      setP((x) => ({ ...x, images: [...x.images, ...j.urls].slice(0, 8) })); setSaved(false);
    } catch (e) { setErr((e as Error).message || "Upload failed"); }
    setUploading(false);
  };
  const move = (i: number, d: number) => { const a = [...p.images]; const j = i + d; if (j < 0 || j >= a.length) return; [a[i], a[j]] = [a[j], a[i]]; set("images", a); };

  const save = () => start(async () => {
    setErr("");
    const r = await saveProduct(p);
    if (!r.ok) { setErr(r.error); return; }
    setSaved(true);
    if (!p.id) router.replace(`/admin/products/${r.id}`);
    else { set("slug", r.slug); setSaved(true); router.refresh(); }
  });
  const remove = () => {
    if (!p.id || !confirm(`Delete "${p.name}" permanently? Its reviews will be deleted too.`)) return;
    start(async () => { await deleteProduct(p.id!); router.replace("/admin/products"); });
  };

  return (
    <div className="grid gap-6 pb-28 xl:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        <Card>
          <p className="mb-4 font-semibold">Basics</p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="sm:col-span-2"><span className={labelCls}>Product name *</span><input className={`${inputCls} mt-1.5`} value={p.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Emerald Noir" /></label>
            <label className="sm:col-span-2"><span className={labelCls}>Short tagline</span><input className={`${inputCls} mt-1.5`} value={p.tagline ?? ""} onChange={(e) => set("tagline", e.target.value)} placeholder="Fresh green vetiver, dark and magnetic" /></label>
            <label><span className={labelCls}>Category</span>
              <select className={`${inputCls} mt-1.5`} value={p.categoryId ?? ""} onChange={(e) => set("categoryId", e.target.value ? Number(e.target.value) : null)}>
                <option value="">— None —</option>{cats.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </label>
            <label><span className={labelCls}>Type</span>
              <input className={`${inputCls} mt-1.5`} list="conc" value={p.concentration ?? ""} onChange={(e) => set("concentration", e.target.value)} />
              <datalist id="conc">{["Eau de Parfum", "Extrait de Parfum", "Eau de Toilette", "Body Mist"].map((c) => <option key={c} value={c} />)}</datalist>
            </label>
            <label className="sm:col-span-2"><span className={labelCls}>Description</span><textarea rows={4} className={`${inputCls} mt-1.5`} value={p.description ?? ""} onChange={(e) => set("description", e.target.value)} placeholder="Describe how it smells and when to wear it…" /></label>
            <label className="sm:col-span-2"><span className={labelCls}>URL (leave empty to generate from name)</span>
              <div className="mt-1.5 flex items-center rounded-xl border border-black/10 bg-black/[.02] pl-3 text-sm text-muted">/product/<input className="w-full bg-transparent px-1 py-2.5 text-ink focus:outline-none" value={p.slug ?? ""} onChange={(e) => set("slug", e.target.value)} /></div>
            </label>
          </div>
        </Card>

        <Card>
          <p className="font-semibold">Photos</p>
          <p className="mb-4 text-sm text-muted">The first photo is the main image. No photos? The store shows a drawn bottle in the colour you pick on the right.</p>
          <div
            onDragOver={(e) => { e.preventDefault(); setDrag(true); }} onDragLeave={() => setDrag(false)}
            onDrop={(e) => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files); }}
            className={`grid grid-cols-3 gap-3 rounded-2xl border-2 border-dashed p-3 transition sm:grid-cols-4 ${drag ? "border-emerald bg-emerald/5" : "border-black/10"}`}
          >
            {p.images.map((src, i) => (
              <div key={src} className="group relative aspect-square overflow-hidden rounded-xl bg-black/5">
                <Image src={src} alt="" fill sizes="160px" className="object-cover" />
                {i === 0 && <span className="absolute left-1.5 top-1.5 rounded-full bg-gold px-2 py-0.5 text-[0.6rem] font-bold uppercase">Main</span>}
                <div className="absolute inset-x-0 bottom-0 flex justify-between bg-gradient-to-t from-black/70 p-1.5 opacity-100 transition sm:opacity-0 sm:group-hover:opacity-100">
                  <span className="flex gap-1">
                    <button type="button" onClick={() => move(i, -1)} className="rounded bg-white/90 p-1" aria-label="Move left"><ArrowLeft className="size-3.5" /></button>
                    <button type="button" onClick={() => move(i, 1)} className="rounded bg-white/90 p-1" aria-label="Move right"><ArrowRight className="size-3.5" /></button>
                  </span>
                  <button type="button" onClick={() => set("images", p.images.filter((_, k) => k !== i))} className="rounded bg-white/90 p-1 text-red-700" aria-label="Remove photo"><X className="size-3.5" /></button>
                </div>
              </div>
            ))}
            {p.images.length < 8 && (
              <button type="button" onClick={() => fileRef.current?.click()} className="flex aspect-square flex-col items-center justify-center gap-1 rounded-xl bg-black/[.03] text-sm text-muted transition hover:bg-emerald/5 hover:text-emerald">
                {uploading ? <Loader2 className="size-6 animate-spin" /> : <ImagePlus className="size-6" />}
                <span className="text-xs">{uploading ? "Uploading…" : "Add / drop"}</span>
              </button>
            )}
          </div>
          <input ref={fileRef} type="file" accept="image/*" multiple hidden onChange={(e) => e.target.files && upload(e.target.files)} />
        </Card>

        <Card>
          <p className="font-semibold">Sizes, prices & stock</p>
          <p className="mb-4 text-sm text-muted">&quot;Was price&quot; is optional — fill it to show a sale badge.</p>
          <div className="space-y-3">
            <div className="hidden grid-cols-[1fr_1fr_1fr_1fr_36px] gap-2 text-xs font-semibold uppercase tracking-wider text-ink/50 sm:grid"><span>Size</span><span>Price (Rs.)</span><span>Was price</span><span>Stock</span><span /></div>
            {p.variants.map((v, i) => (
              <div key={i} className="grid grid-cols-2 gap-2 rounded-xl bg-black/[.02] p-2 sm:grid-cols-[1fr_1fr_1fr_1fr_36px] sm:bg-transparent sm:p-0">
                <input aria-label="Size" className={inputCls} value={v.size} onChange={(e) => setV(i, { size: e.target.value })} placeholder="50ml" />
                <input aria-label="Price" type="number" min={0} className={inputCls} value={v.price} onChange={(e) => setV(i, { price: Number(e.target.value) })} />
                <input aria-label="Was price" type="number" min={0} className={inputCls} value={v.compareAt ?? ""} onChange={(e) => setV(i, { compareAt: e.target.value ? Number(e.target.value) : null })} placeholder="—" />
                <input aria-label="Stock" type="number" min={0} className={inputCls} value={v.stock} onChange={(e) => setV(i, { stock: Number(e.target.value) })} />
                <button type="button" disabled={p.variants.length === 1} onClick={() => set("variants", p.variants.filter((_, k) => k !== i))} className="flex items-center justify-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-30" aria-label="Remove size"><Trash2 className="size-4" /></button>
              </div>
            ))}
            <button type="button" onClick={() => set("variants", [...p.variants, { size: ["50ml", "100ml"].find((z) => !p.variants.some((v) => v.size === z)) ?? "", price: 0, compareAt: null, stock: 0 }])} className="flex items-center gap-1.5 text-sm font-semibold text-emerald"><Plus className="size-4" /> Add size</button>
          </div>
        </Card>

        <Card>
          <p className="mb-4 font-semibold">Scent profile</p>
          <div className="grid gap-4 sm:grid-cols-3">
            {(["topNotes", "heartNotes", "baseNotes"] as const).map((k) => (
              <label key={k}><span className={labelCls}>{k.replace("Notes", "")} notes</span><input className={`${inputCls} mt-1.5`} value={p[k] ?? ""} onChange={(e) => set(k, e.target.value)} placeholder="Rose, Saffron" /></label>
            ))}
            {(["longevity", "sillage"] as const).map((k) => (
              <label key={k} className="sm:col-span-1">
                <span className={labelCls}>{k === "longevity" ? "Longevity" : "Projection"}: {p[k]}/5</span>
                <input type="range" min={1} max={5} value={Number(p[k])} onChange={(e) => set(k, Number(e.target.value))} className="mt-3 w-full accent-[#0f3d2a]" />
              </label>
            ))}
          </div>
        </Card>
      </div>

      <div className="space-y-6">
        <Card>
          <p className="mb-4 font-semibold">Visibility</p>
          {([["active", "Visible on store"], ["featured", "Featured on home page"], ["bestseller", "Bestseller"], ["isNew", "New arrival"]] as const).map(([k, l]) => (
            <div key={k} className="flex items-center justify-between py-2"><span className="text-sm">{l}</span><Toggle on={!!p[k]} label={l} onChange={(v) => set(k, v)} /></div>
          ))}
        </Card>
        <Card>
          <p className="font-semibold">Bottle look</p>
          <p className="mb-3 text-sm text-muted">Used when there is no photo.</p>
          <div className="relative mx-auto flex h-52 items-center justify-center rounded-xl bg-gradient-to-b from-emerald-2 to-ink">
            <Bottle color={p.color} shape={p.shape} name={p.name || "Your perfume"} className="h-44 w-auto" />
          </div>
          <div className="mt-4 flex flex-wrap gap-2">
            {SWATCHES.map((c) => <button type="button" key={c} onClick={() => set("color", c)} aria-label={`Colour ${c}`} className={`size-7 rounded-full ring-offset-2 ${p.color === c ? "ring-2 ring-emerald" : ""}`} style={{ background: c }} />)}
            <input type="color" aria-label="Custom colour" value={p.color ?? "#b8860b"} onChange={(e) => set("color", e.target.value)} className="size-7 cursor-pointer rounded-full" />
          </div>
          <div className="mt-4 grid grid-cols-4 gap-2">
            {[0, 1, 2, 3].map((k) => (
              <button type="button" key={k} onClick={() => set("shape", k)} aria-label={`Bottle shape ${k + 1}`} className={`flex h-16 items-center justify-center rounded-xl border ${p.shape === k ? "border-emerald bg-emerald/5" : "border-black/10"}`}>
                <Bottle color={p.color} shape={k} className="h-12 w-auto" />
              </button>
            ))}
          </div>
        </Card>
        {p.id && (
          <Card>
            <a href={`/product/${p.slug}`} target="_blank" className="flex items-center gap-2 text-sm font-semibold text-emerald"><ExternalLink className="size-4" /> View on store</a>
            <button type="button" onClick={remove} className="mt-3 flex items-center gap-2 text-sm font-semibold text-red-700"><Trash2 className="size-4" /> Delete product</button>
          </Card>
        )}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/90 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 py-3 sm:px-6 lg:px-10">
          {err && <p className="mr-auto text-sm font-medium text-red-700" role="alert">{err}</p>}
          {saved && !err && <p className="mr-auto text-sm font-medium text-emerald">✓ Saved — live on the store</p>}
          <button type="button" onClick={() => router.push("/admin/products")} className="rounded-xl px-4 py-2.5 text-sm font-semibold text-muted hover:text-ink">Cancel</button>
          <button type="button" onClick={save} disabled={pending || uploading} className="btn-gold rounded-xl px-7 py-2.5 text-sm font-bold disabled:opacity-60">{pending ? "Saving…" : p.id ? "Save changes" : "Create product"}</button>
        </div>
      </div>
    </div>
  );
}
