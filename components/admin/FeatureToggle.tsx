"use client";
import { useCallback, useEffect, useOptimistic, useRef, useState, useTransition } from "react";
import { Check } from "lucide-react";
import { setFeature } from "@/app/actions/admin";
import type { Feature } from "@/lib/data";
import { Toggle } from "./ProductRowActions";

/** A message that shows for a moment after a save: `flash("Saved")`, or `flash("…", true)` for an error. */
export function useFlash(ms = 2600) {
  const [msg, setMsg] = useState<{ text: string; bad: boolean } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);
  const flash = useCallback((text: string, bad = false) => {
    clearTimeout(timer.current);
    setMsg({ text, bad });
    timer.current = setTimeout(() => setMsg(null), bad ? ms * 2 : ms);
  }, [ms]);
  return [msg, flash] as const;
}

export function SavedNote({ msg, className = "" }: { msg: { text: string; bad: boolean } | null; className?: string }) {
  return (
    <span role="status" aria-live="polite" className={`inline-flex min-h-6 items-center gap-1 text-sm font-semibold ${msg?.bad ? "text-red-700" : "text-emerald-700"} ${className}`}>
      {msg && <>{!msg.bad && <Check className="size-4" />}{msg.text}</>}
    </span>
  );
}

/** The ON/OFF switch of a store feature. It saves at once and confirms with a small "Saved". */
export function FeatureToggle({ feature, on, name }: { feature: Feature; on: boolean; name: string }) {
  const [opt, setOpt] = useOptimistic(on);
  const [pending, start] = useTransition();
  const [msg, flash] = useFlash();
  const change = (v: boolean) => start(async () => {
    setOpt(v);
    try {
      const r = await setFeature(feature, v);
      flash(r.ok ? "Saved" : "Couldn't save — try again", !r.ok);
    } catch {
      flash("Couldn't save — try again", true);
    }
  });
  return (
    <span className="flex shrink-0 items-center gap-3">
      <SavedNote msg={msg} />
      <span className={`w-7 text-xs font-bold uppercase tracking-wider ${opt ? "text-emerald-700" : "text-ink/40"}`}>{opt ? "On" : "Off"}</span>
      <span className={pending ? "opacity-70" : ""}><Toggle on={opt} label={`${name} — turn ${opt ? "off" : "on"}`} onChange={change} /></span>
    </span>
  );
}
