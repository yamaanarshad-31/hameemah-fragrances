"use client";
import { useActionState } from "react";
import { ArrowRight } from "lucide-react";
import { subscribe } from "@/app/actions/public";

export function Newsletter() {
  const [state, action, pending] = useActionState(subscribe, null);
  return (
    <form action={action} className="w-full max-w-md">
      <div className="flex overflow-hidden rounded-full border border-gold/40 bg-white/5 focus-within:border-gold">
        <input name="email" type="email" required placeholder="Your email address" aria-label="Email address" className="min-w-0 flex-1 bg-transparent px-5 py-3.5 text-sm text-cream placeholder:text-cream/40 focus:outline-none" />
        <button disabled={pending} className="btn-gold m-1 flex items-center gap-2 rounded-full px-5 text-xs font-bold uppercase tracking-widest disabled:opacity-60">
          {pending ? "…" : "Join"} <ArrowRight className="size-4" />
        </button>
      </div>
      {state && <p className={`mt-2 text-sm ${state.ok ? "text-gold-2" : "text-red-300"}`}>{state.msg}</p>}
    </form>
  );
}
