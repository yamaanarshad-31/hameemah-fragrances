import Link from "next/link";
import type { SeoCopy as Copy } from "@/lib/seo-copy";

/** Short intro text under a product grid, for shoppers and search engines alike. */
export function SeoCopy({ copy, links }: { copy: Copy; links?: { name: string; href: string }[] }) {
  return (
    <section className="mx-auto max-w-3xl border-t border-ink/10 px-5 py-16 lg:py-20">
      <h2 className="font-display text-4xl">{copy.heading}</h2>
      <div className="mt-4 space-y-3 leading-relaxed text-ink/80">{copy.body.map((t, i) => <p key={i}>{t}</p>)}</div>
      {links && links.length > 0 && (
        <p className="mt-6 text-sm text-muted">
          Explore:{" "}
          {links.map((l, i) => (
            <span key={l.href}>{i > 0 && " · "}<Link href={l.href} className="text-emerald underline-offset-4 hover:underline">{l.name}</Link></span>
          ))}
        </p>
      )}
    </section>
  );
}
