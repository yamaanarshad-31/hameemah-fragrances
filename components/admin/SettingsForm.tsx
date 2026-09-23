"use client";
import { useActionState } from "react";
import { saveSettings } from "@/app/actions/admin";
import { Card, inputCls, labelCls } from "./ui";

type S = Record<string, string>;

function F({ s, k, label, hint, area, type = "text" }: { s: S; k: string; label: string; hint?: string; area?: boolean; type?: string }) {
  return (
    <label className="block">
      <span className={labelCls}>{label}</span>
      {area ? <textarea name={k} defaultValue={s[k]} rows={3} className={`${inputCls} mt-1.5`} /> : <input name={k} type={type} defaultValue={s[k]} className={`${inputCls} mt-1.5`} />}
      {hint && <span className="mt-1 block text-xs text-muted">{hint}</span>}
    </label>
  );
}

export function SettingsForm({ s }: { s: S }) {
  const [state, action, pending] = useActionState(saveSettings, null);
  return (
    <form action={action} className="space-y-6 pb-24">
      <Card>
        <p className="mb-4 font-semibold">Home page</p>
        <div className="space-y-4">
          <F s={s} k="announcement" label="Announcement bar" hint="Separate messages with a | (vertical bar)." area />
          <F s={s} k="heroTitle" label="Hero headline" hint="The last two words are shown in gold." />
          <F s={s} k="heroSubtitle" label="Hero sub-text" area />
        </div>
      </Card>
      <Card>
        <p className="mb-4 font-semibold">Contact & social</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <F s={s} k="whatsapp" label="WhatsApp number" hint="e.g. 03001234567 — used for all WhatsApp buttons." />
          <F s={s} k="phone" label="Phone (as shown)" />
          <F s={s} k="email" label="Email" type="email" />
          <F s={s} k="city" label="Delivery area text" hint={'Shown as “Delivering all over …”'} />
          <F s={s} k="instagram" label="Instagram URL" />
          <F s={s} k="facebook" label="Facebook URL" />
          <F s={s} k="tiktok" label="TikTok URL" />
        </div>
      </Card>
      <Card>
        <p className="mb-4 font-semibold">Delivery & payment</p>
        <div className="grid gap-4 sm:grid-cols-2">
          <F s={s} k="shippingFee" label="Delivery charge (Rs.)" type="number" />
          <F s={s} k="freeShippingOver" label="Free delivery above (Rs.)" type="number" hint="Set 0 to turn off free delivery." />
          <div className="sm:col-span-2"><F s={s} k="bankDetails" label="Bank / JazzCash / Easypaisa details" hint="Shown at checkout when the customer picks bank transfer." area /></div>
        </div>
      </Card>
      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-black/5 bg-white/90 backdrop-blur lg:left-64">
        <div className="mx-auto flex max-w-7xl items-center justify-end gap-4 px-4 py-3 sm:px-6 lg:px-10">
          {state?.ok && <p className="mr-auto text-sm font-medium text-emerald">✓ Saved — the store is updated</p>}
          <button disabled={pending} className="btn-gold rounded-xl px-7 py-2.5 text-sm font-bold disabled:opacity-60">{pending ? "Saving…" : "Save settings"}</button>
        </div>
      </div>
    </form>
  );
}
