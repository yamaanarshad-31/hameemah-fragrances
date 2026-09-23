"use client";
import { useOptimistic, useTransition } from "react";
import { toggleProduct } from "@/app/actions/admin";

export function Toggle({ on, onChange, label }: { on: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={on} aria-label={label} onClick={() => onChange(!on)} className={`relative h-6 w-11 rounded-full transition ${on ? "bg-emerald" : "bg-black/15"}`}>
      <span className={`absolute top-0.5 size-5 rounded-full bg-white shadow transition-all ${on ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

export function ProductRowActions({ id, active }: { id: number; active: boolean; slug: string }) {
  const [opt, setOpt] = useOptimistic(active);
  const [, start] = useTransition();
  return <Toggle on={opt} label="Visible on store" onChange={(v) => start(async () => { setOpt(v); await toggleProduct(id, "active", v); })} />;
}
