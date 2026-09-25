import type { Metadata } from "next";
import { PageHero } from "@/components/store/PageHero";
import { getSettings } from "@/lib/data";
import { pageMeta } from "@/lib/site";

export const metadata: Metadata = pageMeta({ title: "Shipping, Returns & Privacy", description: "Delivery in 2–4 working days all over Pakistan, cash on delivery, 7-day exchange on sealed bottles and our privacy policy.", path: "/policies" });

export default async function Policies() {
  const s = await getSettings();
  const fee = Number(s.shippingFee).toLocaleString();
  const free = Number(s.freeShippingOver).toLocaleString();
  const sections = [
    { id: "shipping", t: "Shipping & delivery", p: [`We deliver all over Pakistan. Orders are usually dispatched within 24 hours and arrive in 2–4 working days.`, `Delivery costs Rs. ${fee}. Orders above Rs. ${free} ship free.`, "You'll receive a call or WhatsApp to confirm your order before dispatch."] },
    { id: "returns", t: "Returns & exchange", p: ["If your parcel arrives damaged or you receive the wrong item, contact us within 48 hours with a photo and we'll send a replacement free of charge.", "Unused, sealed bottles can be exchanged within 7 days of delivery. For hygiene reasons, opened perfumes can't be returned.", "Please open and check your parcel in front of the rider where possible."] },
    { id: "payment", t: "Payment", p: ["Cash on delivery is available nationwide. You can also pay in advance by bank transfer, JazzCash or Easypaisa — we'll share the details after you order."] },
    { id: "privacy", t: "Privacy policy", p: ["We only collect the details needed to deliver your order (name, phone, address and optional email).", "We never sell or share your information with anyone except the courier delivering your parcel.", "If you join our newsletter you can unsubscribe at any time."] },
  ];
  return (
    <>
      <PageHero eyebrow="The small print" title="Policies" />
      <div className="mx-auto max-w-3xl space-y-14 px-5 py-20">
        {sections.map((x) => (
          <section key={x.id} id={x.id} className="scroll-mt-32">
            <h2 className="font-display text-4xl">{x.t}</h2>
            <div className="mt-4 space-y-3 leading-relaxed text-ink/80">{x.p.map((t, i) => <p key={i}>{t}</p>)}</div>
          </section>
        ))}
      </div>
    </>
  );
}
