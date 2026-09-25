import { GoldDust } from "@/components/home/GoldDust";

export function PageHero({ eyebrow, title, sub, color }: { eyebrow: string; title: string; sub?: string; color?: string | null }) {
  return (
    <section className="grain relative overflow-hidden bg-ink pb-14 pt-16 text-center text-cream sm:pb-16 sm:pt-20 lg:pb-20 lg:pt-24">
      <div className="absolute left-1/2 top-[-12rem] h-[36rem] w-[64rem] -translate-x-1/2 rounded-full" style={{ background: `radial-gradient(ellipse, ${color || "#0f3d2a"} 0%, transparent 65%)` }} />
      <GoldDust density={40} />
      <div className="relative mx-auto max-w-3xl px-5">
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-4 text-balance font-display text-[2.75rem] leading-[1.1] sm:text-7xl sm:leading-tight">{title}</h1>
        {sub && <p className="mx-auto mt-4 max-w-xl text-cream/65">{sub}</p>}
      </div>
    </section>
  );
}
