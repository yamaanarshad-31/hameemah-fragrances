import type { Metadata } from "next";
import { CheckoutForm } from "@/components/store/CheckoutForm";
import { featuresOf, getSettings } from "@/lib/data";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default async function Checkout() {
  const s = await getSettings();
  const f = featuresOf(s);
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8 lg:py-16">
      <p className="eyebrow text-gold-3">Secure checkout</p>
      <h1 className="mt-2 font-display text-5xl sm:text-6xl">Almost yours</h1>
      <div className="mt-10">
        <CheckoutForm shippingFee={Number(s.shippingFee) || 0} freeOver={Number(s.freeShippingOver) || 0} bank={s.bankDetails ?? ""} coupons={f.sale} gifts={f.gifts} giftWrapFee={Math.max(0, Number(s.giftWrapFee) || 0)} />
      </div>
    </div>
  );
}
