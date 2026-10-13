import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { ExternalLink, Plus } from "lucide-react";
import { ButtonLink, Card } from "@/components/admin/ui";
import { FeatureHeader } from "@/components/admin/FeatureHeader";
import { ProductRowActions } from "@/components/admin/ProductRowActions";
import { ProductImage } from "@/components/store/ProductImage";
import { ATTAR_SLUG, getFeatures } from "@/lib/data";
import { getDb, schema as s } from "@/lib/db";
import { rs } from "@/lib/format";

export const metadata = { title: "Attar" };

export default async function AttarFeature() {
  const db = await getDb();
  const [f, [cat]] = await Promise.all([getFeatures(), db.select().from(s.categories).where(eq(s.categories.slug, ATTAR_SLUG))]);
  const list = cat ? await db.select().from(s.products).where(eq(s.products.categoryId, cat.id)).orderBy(desc(s.products.createdAt)) : [];
  return (
    <>
      <FeatureHeader feature="attar" on={f.attar} title="Attar" sub="An “Attar” collection with its own products, menu link and page." offNote="The Attar menu link, its page and every attar product are hidden from the website. Your attar products are kept." />
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <div><h2 className="text-xl font-semibold">Attar products ({list.length})</h2><p className="text-sm text-muted">Every product in the “{cat?.name ?? "Attar"}” category. Sizes can be anything — 3ml, 6ml, 12ml…</p></div>
        <div className="flex flex-wrap items-center gap-3">
          {f.attar && <a href={`/collections/${ATTAR_SLUG}`} target="_blank" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-emerald underline-offset-4 hover:underline"><ExternalLink className="size-4" /> View Attar page</a>}
          <ButtonLink href="/admin/products/new?attar=1"><Plus className="size-4" /> Add attar product</ButtonLink>
        </div>
      </div>
      <Card className="!p-0">
        <ul className="divide-y divide-black/5">
          {list.map((p) => {
            const stock = p.variants.reduce((a, v) => a + v.stock, 0);
            return (
              <li key={p.id} className="flex items-center gap-3 p-4">
                <Link href={`/admin/products/${p.id}`} className="flex min-w-0 flex-1 items-center gap-3">
                  <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-emerald to-forest"><ProductImage src={p.images[0]} color={p.color} shape={p.shape} name={p.name} sizes="56px" /></span>
                  <span className="min-w-0">
                    <span className="block truncate font-semibold">{p.name}</span>
                    <span className="block text-xs text-muted">{p.variants.map((v) => `${v.size} ${rs(v.price)}`).join(" · ")}</span>
                    <span className={`block text-xs ${stock === 0 ? "font-semibold text-red-700" : "text-muted"}`}>{stock} in stock · {p.sold} sold</span>
                  </span>
                </Link>
                <span className="flex min-h-11 shrink-0 items-center gap-2"><span className="hidden text-xs text-muted sm:inline">Visible</span><ProductRowActions id={p.id} active={!!p.active} slug={p.slug} /></span>
              </li>
            );
          })}
        </ul>
        {!list.length && <p className="px-4 py-12 text-center text-muted">No attar products yet. Press “Add attar product” to create the first one.</p>}
      </Card>
      {!f.attar && list.length > 0 && <p className="mt-3 text-sm text-muted">These products are saved but hidden, because Attar is OFF.</p>}
    </>
  );
}
