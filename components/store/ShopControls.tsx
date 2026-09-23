"use client";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { Search, SlidersHorizontal } from "lucide-react";

export function ShopControls({ cats, active, count }: { cats: { name: string; slug: string }[]; active?: string; count: number }) {
  const router = useRouter();
  const path = usePathname();
  const sp = useSearchParams();
  const [q, setQ] = useState(sp.get("q") ?? "");
  const [pending, start] = useTransition();

  const push = (patch: Record<string, string>) => {
    const next = new URLSearchParams(sp.toString());
    for (const [k, v] of Object.entries(patch)) {
      if (v) next.set(k, v);
      else next.delete(k);
    }
    start(() => router.replace(`${path}${next.size ? `?${next}` : ""}`, { scroll: false }));
  };

  useEffect(() => {
    if (q === (sp.get("q") ?? "")) return;
    const t = setTimeout(() => push({ q }), 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const chip = (href: string, label: string, on: boolean) => (
    <Link key={href} href={href} scroll={false} className={`whitespace-nowrap rounded-full border px-5 py-2.5 text-xs font-bold uppercase tracking-[0.14em] transition ${on ? "border-emerald bg-emerald text-cream" : "border-ink/15 text-ink/70 hover:border-emerald hover:text-emerald"}`}>
      {label}
    </Link>
  );

  return (
    <div className="sticky top-[76px] z-30 -mx-5 border-b border-ink/10 bg-cream/90 px-5 py-4 backdrop-blur-xl lg:top-[88px] lg:-mx-8 lg:px-8">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="no-scrollbar -mx-5 flex gap-2 overflow-x-auto px-5 lg:mx-0 lg:px-0">
          {chip("/shop", "All", !active)}
          {cats.map((c) => chip(`/collections/${c.slug}`, c.name, active === c.slug))}
        </div>
        <div className="grid grid-cols-[minmax(0,1fr)_9rem] items-center gap-2 lg:flex">
          <label className="flex min-w-0 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2.5 focus-within:border-emerald lg:w-64 lg:flex-none">
            <Search className="size-4 text-muted" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search perfumes" aria-label="Search perfumes" className="w-full bg-transparent text-sm focus:outline-none" />
          </label>
          <label className="flex min-w-0 items-center gap-2 rounded-full border border-ink/15 bg-white px-4 py-2.5 lg:w-52">
            <SlidersHorizontal className="size-4 text-muted" />
            <select value={sp.get("sort") ?? ""} onChange={(e) => push({ sort: e.target.value })} aria-label="Sort by" className="w-full min-w-0 bg-transparent text-sm focus:outline-none">
              <option value="">Newest</option>
              <option value="popular">Bestselling</option>
              <option value="price-asc">Price: low to high</option>
              <option value="price-desc">Price: high to low</option>
            </select>
          </label>
        </div>
      </div>
      <p className={`mt-3 text-xs uppercase tracking-[0.18em] text-muted transition-opacity ${pending ? "opacity-40" : ""}`}>{pending ? "Updating…" : `${count} fragrance${count === 1 ? "" : "s"}`}</p>
    </div>
  );
}
