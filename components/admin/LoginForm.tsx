"use client";
import { useActionState } from "react";
import { login } from "@/app/actions/admin";

export function LoginForm() {
  const [state, action, pending] = useActionState(login, null);
  const cls = "mt-1.5 w-full rounded-xl border border-gold/25 bg-ink/60 px-4 py-3 text-cream placeholder:text-cream/30 focus:border-gold focus:outline-none";
  return (
    <form action={action} className="mt-6 space-y-4">
      <label className="block text-xs font-semibold uppercase tracking-widest text-gold-2/80">Email<input name="email" type="email" required autoComplete="username" className={cls} /></label>
      <label className="block text-xs font-semibold uppercase tracking-widest text-gold-2/80">Password<input name="password" type="password" required autoComplete="current-password" className={cls} /></label>
      {state?.error && <p className="text-sm text-red-300" role="alert">{state.error}</p>}
      <button disabled={pending} className="btn-gold w-full rounded-xl py-3.5 text-sm font-bold uppercase tracking-[0.2em] disabled:opacity-60">{pending ? "Signing in…" : "Sign in"}</button>
    </form>
  );
}
