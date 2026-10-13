import { desc } from "drizzle-orm";
import { ExternalLink } from "lucide-react";
import { Card } from "@/components/admin/ui";
import { FeatureHeader } from "@/components/admin/FeatureHeader";
import { SaleManager, type SaleRow } from "@/components/admin/SaleManager";
import { CouponManager } from "@/components/admin/CouponManager";
import { getFeatures } from "@/lib/data";
import { getDb, schema as s } from "@/lib/db";

export const metadata = { title: "Sale / Discount" };

export default async function SaleFeature() {
  const db = await getDb();
  const [f, prods, coupons] = await Promise.all([getFeatures(), db.select().from(s.products).orderBy(desc(s.products.createdAt)), db.select().from(s.coupons).orderBy(desc(s.coupons.id))]);
  const rows: SaleRow[] = prods.map((p) => ({ id: p.id, name: p.name, image: p.images[0] ?? null, active: !!p.active, variants: p.variants, salePercent: p.salePercent ?? 0, saleStart: p.saleStart ?? "", saleEnd: p.saleEnd ?? "" }));
  return (
    <>
      <FeatureHeader feature="sale" on={f.sale} title="Sale / Discount" sub="Sale prices on products, the Sale page and coupon codes." offNote="Every product shows its regular price, the Sale page is hidden and coupon codes are not accepted. Your sale prices and coupons are kept." />
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <div><h2 className="text-xl font-semibold">Product sales</h2><p className="text-sm text-muted">Type a % next to a product and press Save. The old price is crossed out and a “-20%” badge appears.</p></div>
        {f.sale && <a href="/sale" target="_blank" className="inline-flex min-h-11 items-center gap-1.5 text-sm font-semibold text-emerald underline-offset-4 hover:underline"><ExternalLink className="size-4" /> View Sale page</a>}
      </div>
      <Card className="!p-0"><SaleManager products={rows} /></Card>
      <div id="coupons" className="mb-3 mt-10 scroll-mt-20">
        <h2 className="text-xl font-semibold">Coupon codes</h2>
        <p className="text-sm text-muted">Customers type these at checkout. Each code has its own ON/OFF switch.</p>
      </div>
      <CouponManager coupons={coupons} />
    </>
  );
}
