import { asc, desc } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { FeatureHeader } from "@/components/admin/FeatureHeader";
import { GiftManager, type GiftProduct } from "@/components/admin/GiftManager";
import { featuresOf, getSettings } from "@/lib/data";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "Gifts" };

export default async function GiftsFeature() {
  const db = await getDb();
  const [st, sets, prods] = await Promise.all([getSettings(), db.select().from(s.giftSets).orderBy(desc(s.giftSets.createdAt)), db.select().from(s.products).orderBy(asc(s.products.name))]);
  const f = featuresOf(st);
  const products: GiftProduct[] = prods.map((p) => ({ id: p.id, name: p.name, active: !!p.active, sizes: p.variants.map((v) => ({ size: v.size, price: v.price, stock: v.stock })) }));
  return (
    <>
      <FeatureHeader feature="gifts" on={f.gifts} title="Gifts" sub="Gift sets, the Gifts page and menu link, and gift wrapping at checkout." offNote="The Gifts page, its menu link and the gift options at checkout are hidden. Your gift sets are kept." />
      {f.gifts && <a href="/gifts" target="_blank" className="-mt-3 mb-3 inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-emerald underline-offset-4 hover:underline"><ExternalLink className="size-4" /> View Gifts page</a>}
      <GiftManager sets={sets} products={products} wrapFee={Number(st.giftWrapFee) || 0} />
    </>
  );
}
