import type { Metadata } from "next";
import Link from "next/link";
import { SignatureBottle } from "@/components/store/SignatureBottle";

export const metadata: Metadata = { title: "Page not found" };

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-5 py-20 text-center">
      <div className="flex size-56 items-center justify-center rounded-full bg-[radial-gradient(circle_at_50%_40%,#1f5a3f,#06140d_70%)] ring-1 ring-gold/30">
        <SignatureBottle className="h-40 animate-float drop-shadow-[0_20px_25px_rgba(0,0,0,.5)]" />
      </div>
      <p className="eyebrow mt-8 text-gold-3">Error 404</p>
      <h1 className="mt-3 font-display text-5xl sm:text-6xl">This scent has evaporated</h1>
      <p className="mt-3 text-muted">The page you&apos;re looking for doesn&apos;t exist or has moved.</p>
      <Link href="/shop" className="btn-gold mt-8 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.2em]">Back to the shop</Link>
    </div>
  );
}
