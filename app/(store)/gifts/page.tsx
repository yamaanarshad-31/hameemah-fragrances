import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { PageHero } from "@/components/store/PageHero";
import { GiftCard } from "@/components/store/GiftCard";
import { getFeatures, getGiftSets, getSettings } from "@/lib/data";
import { rs } from "@/lib/format";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({
  title: "Perfume Gift Sets in Pakistan",
  description: "Perfume gift sets from Fragrances by Hameemah — ready-to-give boxes with gift wrapping and a personal message, delivered across Pakistan with cash on delivery.",
  path: "/gifts",
});

export default async function Gifts() {
  // the page exists only while the Gifts feature is on (Admin → Store Features)
  if (!(await getFeatures()).gifts) notFound();
  const [sets, st] = await Promise.all([getGiftSets(), getSettings()]);
  const wrap = Number(st.giftWrapFee) || 0;
  return (
    <>
      <PageHero eyebrow="Made to be given" title="Gifts" sub="Ready-to-give perfume sets — add gift wrapping and a personal message at checkout." color="#6b2138" />
      <div className="mx-auto max-w-7xl px-5 pb-20 lg:px-8">
        {sets.length ? (
          <div className="grid grid-cols-1 gap-6 py-10 sm:grid-cols-2 lg:grid-cols-3">
            {sets.map((g, i) => <GiftCard key={g.id} g={g} index={i} />)}
          </div>
        ) : (
          <div className="py-24 text-center">
            <p className="font-display text-4xl">Gift sets are coming soon</p>
            <p className="mt-2 text-muted">Meanwhile, any perfume can be gift wrapped at checkout.</p>
            <Link href="/shop" className="btn-gold mt-6 inline-flex rounded-full px-7 py-3 text-sm font-bold uppercase tracking-widest">View all perfumes</Link>
          </div>
        )}
        <p className="mx-auto max-w-xl rounded-3xl border border-ink/10 bg-white p-5 text-center text-sm text-ink/80">
          <b>Sending a gift?</b> Any order can be gift wrapped ({wrap ? rs(wrap) : "free"}) with a hand-written message — just tick the option at checkout.
        </p>
      </div>
    </>
  );
}
