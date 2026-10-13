import Link from "next/link";
import { count, eq } from "drizzle-orm";
import { ArrowRight, Droplets, Gift, Megaphone, Percent } from "lucide-react";
import { Card, PageTitle } from "@/components/admin/ui";
import { FeatureToggle } from "@/components/admin/FeatureToggle";
import { ATTAR_SLUG, featuresOf, getSettings, splitMessages, type Feature } from "@/lib/data";
import { getDb, schema as s } from "@/lib/db";
import { hasSale, showDay, windowState } from "@/lib/pricing";

export const metadata = { title: "Store Features" };

export default async function Features() {
  const db = await getDb();
  const [st, prods, [coupons], [sets], cats] = await Promise.all([
    getSettings(),
    db.select({ categoryId: s.products.categoryId, variants: s.products.variants, salePercent: s.products.salePercent }).from(s.products),
    db.select({ n: count() }).from(s.coupons).where(eq(s.coupons.active, true)),
    db.select({ n: count() }).from(s.giftSets),
    db.select().from(s.categories),
  ]);
  const f = featuresOf(st);
  const attarId = cats.find((c) => c.slug === ATTAR_SLUG)?.id;
  const n = (k: number, one: string, many = `${one}s`) => `${k} ${k === 1 ? one : many}`;
  const msgs = splitMessages(st.announcement).length;
  const when = windowState(st.announcementStart, st.announcementEnd);
  const schedule = { none: "", live: st.announcementEnd ? ` · until ${showDay(st.announcementEnd)}` : "", scheduled: ` · starts ${showDay(st.announcementStart)}`, ended: ` · ended ${showDay(st.announcementEnd)}` }[when];

  const cards: { feature: Feature; I: typeof Gift; title: string; text: string; info: string; warn?: string }[] = [
    { feature: "announcement", I: Megaphone, title: "Announcement Bar", text: "The moving strip of messages at the very top of the website.", info: `${n(msgs, "message")}${schedule}`, warn: f.announcement && when === "scheduled" ? "On, but waiting for its start date" : f.announcement && when === "ended" ? "On, but its end date has passed — it is hidden" : undefined },
    { feature: "sale", I: Percent, title: "Sale / Discount", text: "Sale prices with a crossed-out old price and a “-20%” badge, a Sale page, and coupon codes.", info: `${n(prods.filter(hasSale).length, "product")} with a sale · ${n(coupons.n, "active coupon")}` },
    { feature: "gifts", I: Gift, title: "Gifts", text: "Gift sets with their own page and menu link, plus gift wrapping and a gift message at checkout.", info: `${n(sets.n, "gift set")} · wrapping Rs. ${Number(st.giftWrapFee) || 0}` },
    { feature: "attar", I: Droplets, title: "Attar", text: "An “Attar” collection with its own products (6ml, 12ml…), menu link and page.", info: n(attarId ? prods.filter((p) => p.categoryId === attarId).length : 0, "attar product") },
  ];

  return (
    <>
      <PageTitle title="Store Features" sub="Switch a feature on or off — the website changes straight away. Turning one off only hides it; everything you saved stays here." />
      <div className="grid grid-cols-1 gap-4 sm:gap-6 xl:grid-cols-2">
        {cards.map(({ feature, I, title, text, info, warn }) => (
          <Card key={feature} className="flex flex-col">
            <div className="flex items-start gap-3">
              <span className={`flex size-11 shrink-0 items-center justify-center rounded-xl ${f[feature] ? "bg-gold/25 text-ink" : "bg-black/5 text-ink/40"}`}><I className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-semibold leading-tight">{title}</h2>
                <p className="mt-1 text-sm text-muted">{text}</p>
              </div>
            </div>
            <div className="mt-4 flex min-h-11 items-center justify-between gap-3 rounded-xl bg-black/[.03] px-3.5 py-2">
              <span className="text-sm font-medium">{f[feature] ? "Showing on the website" : "Hidden from the website"}</span>
              <FeatureToggle feature={feature} on={f[feature]} name={title} />
            </div>
            {warn && <p className="mt-2 text-sm font-medium text-amber-700">{warn}</p>}
            <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-4">
              <p className="text-xs text-muted">{info}</p>
              <Link href={`/admin/features/${feature}`} className="inline-flex min-h-11 items-center gap-1.5 rounded-xl bg-emerald px-4 text-sm font-semibold text-cream transition hover:bg-emerald-2">Manage <ArrowRight className="size-4" /></Link>
            </div>
          </Card>
        ))}
      </div>
    </>
  );
}
