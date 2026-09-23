import type { Metadata } from "next";
import Image from "next/image";
import { LoginForm } from "@/components/admin/LoginForm";

export const metadata: Metadata = { title: "Admin login", robots: { index: false, follow: false } };

export default function Login() {
  return (
    <main className="grain relative flex min-h-dvh items-center justify-center overflow-hidden bg-ink px-5">
      <div className="absolute left-1/2 top-1/3 size-[40rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald blur-[140px]" />
      <div className="relative w-full max-w-sm">
        <Image src="/brand/logo-full.png" alt="Fragrances by Hameemah" width={180} height={198} priority className="mx-auto h-40 w-auto" />
        <div className="mt-8 rounded-3xl border border-gold/20 bg-white/5 p-7 backdrop-blur-xl">
          <h1 className="text-center font-display text-3xl text-cream">Admin panel</h1>
          <p className="mt-1 text-center text-sm text-cream/50">Sign in to manage your store</p>
          <LoginForm />
        </div>
      </div>
    </main>
  );
}
