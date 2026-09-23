import { GoldDust } from "@/components/home/GoldDust";

export function PageHero({ eyebrow, title, sub, color }: { eyebrow: string; title: string; sub?: string; color?: string | null }) {
  return (
    <section className="grain relative overflow-hidden bg-ink pb-16 pt-20 text-center text-cream lg:pb-20 lg:pt-24">
      <div className="absolute left-1/2 top-0 h-80 w-[50rem] -translate-x-1/2 rounded-full blur-[110px]" style={{ background: `${color || "#0f3d2a"}` }} />
      <GoldDust density={40} />
      <div className="relative mx-auto max-w-3xl px-5">
        <p className="eyebrow text-gold">{eyebrow}</p>
        <h1 className="mt-4 font-display text-5xl leading-tight sm:text-7xl">{title}</h1>
        {sub && <p className="mx-auto mt-4 max-w-xl text-cream/65">{sub}</p>}
      </div>
    </section>
  );
}
