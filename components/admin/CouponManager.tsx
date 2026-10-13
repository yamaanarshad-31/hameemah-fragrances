"use client";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Pencil, Trash2 } from "lucide-react";
import { deleteCoupon, saveCoupon, toggleCoupon } from "@/app/actions/admin";
import type { Coupon } from "@/lib/db/schema";
import { rs } from "@/lib/format";
import { couponLabel, inWindow, showDay } from "@/lib/pricing";
import { SavedNote, useFlash } from "./FeatureToggle";
import { Toggle } from "./ProductRowActions";
import { Card, inputCls, labelCls } from "./ui";

function CouponRow({ c, onEdit }: { c: Coupon; onEdit: () => void }) {
  const router = useRouter();
  const [on, setOn] = useOptimistic(!!c.active);
  const [pending, run] = useTransition();
  const [msg, flash] = useFlash();
  const expired = !!c.expires && !inWindow("", c.expires);
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 p-4">
      <div className="min-w-0 flex-1 basis-40">
        <p className="truncate font-mono font-bold">{c.code}{expired && <span className="ml-2 rounded-full bg-red-100 px-2 py-0.5 font-sans text-[0.65rem] font-semibold text-red-900">Expired</span>}</p>
        <p className="text-xs text-muted">
          {couponLabel({ percent: c.percent, fixed: c.fixed ?? 0 })}{c.minTotal ? ` · min. order ${rs(c.minTotal)}` : ""}{c.expires ? ` · ${expired ? "expired" : "until"} ${showDay(c.expires)}` : " · no expiry"} · used {c.uses}×
        </p>
      </div>
      <SavedNote msg={msg} />
      <span className={`w-12 text-right text-xs font-bold uppercase tracking-wider ${on ? "text-emerald-700" : "text-ink/40"}`}>{on ? "On" : "Off"}</span>
      <Toggle on={on} label={`${c.code} — turn ${on ? "off" : "on"}`} onChange={(v) => run(async () => { setOn(v); await toggleCoupon(c.id, v); flash("Saved"); })} />
      <button type="button" onClick={onEdit} aria-label={`Edit ${c.code}`} title="Edit" className="flex size-11 items-center justify-center rounded-lg text-muted hover:bg-black/5 hover:text-ink"><Pencil className="size-4" /></button>
      <button type="button" disabled={pending} aria-label={`Delete ${c.code}`} title="Delete" onClick={() => confirm(`Delete ${c.code}?`) && run(async () => { await deleteCoupon(c.id); router.refresh(); })} className="-mr-2 flex size-11 items-center justify-center rounded-lg text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-50"><Trash2 className="size-4" /></button>
    </li>
  );
}

const BLANK = { code: "", kind: "percent", amount: "10", minTotal: "0", expires: "" };

export function CouponManager({ coupons }: { coupons: Coupon[] }) {
  const [state, action, pending] = useActionState(saveCoupon, null);
  const [f, setF] = useState(BLANK);
  const [editing, setEditing] = useState(false);
  const [msg, flash] = useFlash();
  const formRef = useRef<HTMLFormElement>(null);
  const set = (k: keyof typeof BLANK, v: string) => setF((x) => ({ ...x, [k]: v }));
  useEffect(() => {
    if (!state) return;
    if (state.ok) { flash(`Saved ${state.code}`); setF(BLANK); setEditing(false); } // eslint-disable-line react-hooks/set-state-in-effect -- reset the form after a save
    else flash(state.error, true);
  }, [state, flash]);
  const edit = (c: Coupon) => {
    setF({ code: c.code, kind: (c.fixed ?? 0) > 0 ? "fixed" : "percent", amount: String((c.fixed ?? 0) > 0 ? c.fixed : c.percent), minTotal: String(c.minTotal ?? 0), expires: c.expires ?? "" });
    setEditing(true);
    formRef.current?.scrollIntoView({ behavior: "smooth", block: "center" });
  };
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card className="!p-0">
        <ul className="divide-y divide-black/5">{coupons.map((c) => <CouponRow key={c.id} c={c} onEdit={() => edit(c)} />)}</ul>
        {!coupons.length && <p className="py-10 text-center text-muted">No coupon codes yet.</p>}
      </Card>
      <Card className="self-start">
        <p className="font-semibold">{editing ? `Edit ${f.code}` : "Create coupon"}</p>
        <form ref={formRef} action={action} className="mt-4 space-y-3">
          <label className="block"><span className={labelCls}>Code</span><input name="code" required readOnly={editing} value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase())} className={`${inputCls} mt-1 uppercase ${editing ? "bg-black/[.04] text-muted" : ""}`} placeholder="EID20" /></label>
          <div className="flex gap-3">
            <label className="block min-w-0 flex-1"><span className={labelCls}>Type</span>
              <select name="kind" value={f.kind} onChange={(e) => set("kind", e.target.value)} className={`${inputCls} mt-1`}>
                <option value="percent">% off</option>
                <option value="fixed">Rs. off</option>
              </select>
            </label>
            <label className="block min-w-0 flex-1"><span className={labelCls}>{f.kind === "fixed" ? "Amount (Rs.)" : "Percent"}</span><input name="amount" type="number" inputMode="numeric" min={1} max={f.kind === "fixed" ? undefined : 90} required value={f.amount} onChange={(e) => set("amount", e.target.value)} className={`${inputCls} mt-1`} /></label>
          </div>
          <div className="flex gap-3">
            <label className="block min-w-0 flex-1"><span className={labelCls}>Min. order (Rs.)</span><input name="minTotal" type="number" inputMode="numeric" min={0} value={f.minTotal} onChange={(e) => set("minTotal", e.target.value)} className={`${inputCls} mt-1`} /></label>
            <label className="block min-w-0 flex-1"><span className={labelCls}>Expiry (optional)</span><input name="expires" type="date" value={f.expires} onChange={(e) => set("expires", e.target.value)} className={`${inputCls} mt-1`} /></label>
          </div>
          <button disabled={pending} className="btn-gold min-h-11 w-full rounded-xl py-3 text-sm font-bold disabled:opacity-60">{pending ? "Saving…" : editing ? "Save changes" : "Save coupon"}</button>
          {editing && <button type="button" onClick={() => { setF(BLANK); setEditing(false); }} className="min-h-11 w-full text-sm font-semibold text-muted">Cancel editing</button>}
          <SavedNote msg={msg} />
        </form>
      </Card>
    </div>
  );
}
