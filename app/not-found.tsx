import Link from "next/link";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh flex-col items-center justify-center bg-ink px-5 text-center text-cream">
      <p className="eyebrow text-gold">Error 404</p>
      <h1 className="mt-3 font-display text-5xl">This scent has evaporated</h1>
      <p className="mt-3 text-cream/60">The page you&apos;re looking for doesn&apos;t exist.</p>
      <Link href="/" className="btn-gold mt-8 rounded-full px-8 py-4 text-sm font-bold uppercase tracking-[0.2em]">Go home</Link>
    </main>
  );
}
