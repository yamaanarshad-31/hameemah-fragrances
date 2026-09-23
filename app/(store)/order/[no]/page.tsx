import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CheckCircle2 } from "lucide-react";
import { Confetti } from "@/components/store/Confetti";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import { ProductImage } from "@/components/store/ProductImage";
import { getOrderPublic, getSettings } from "@/lib/data";
import { rs } from "@/lib/format";

export const metadata: Metadata = { title: "Your order", robots: { index: false } };

export default async function OrderPage({ params, searchParams }: PageProps<"/order/[no]">) {
  const { no } = await params;
  const isNew = (await searchParams).new === "1";
  const [o, s] = await Promise.all([getOrderPublic(no), getSettings()]);
  if (!o) notFound();
  const msg = `Hi! I just placed order ${o.orderNo} for ${rs(o.total)}. Please confirm.`;
  return (
    <div className="mx-auto max-w-3xl px-5 py-14 lg:py-20">
      {isNew && <Confetti />}
      <div className="text-center">
        <CheckCircle2 className="mx-auto size-16 text-emerald" strokeWidth={1.2} />
        <p className="eyebrow mt-4 text-gold-3">{isNew ? "Thank you" : "Order status"}</p>
        <h1 className="mt-2 font-display text-5xl sm:text-6xl">{isNew ? "Your order is placed!" : `Order ${o.orderNo}`}</h1>
        {isNew && <p className="mx-auto mt-3 max-w-md text-muted">We&apos;ll call or WhatsApp you shortly to confirm. Keep your order number handy: <b className="text-ink">{o.orderNo}</b></p>}
      </div>

      <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(6,20,13,.5)] sm:p-8">
        <OrderTimeline status={o.status ?? "pending"} />
        <ul className="mt-8 space-y-4 border-t border-ink/10 pt-6">
          {o.items.map((l, i) => (
            <li key={i} className="flex items-center gap-4">
              <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-emerald to-forest"><ProductImage src={l.image} color={l.color} shape={l.shape} name={l.name} sizes="56px" /></div>
              <div className="flex-1"><p className="font-semibold">{l.name}</p><p className="text-xs text-muted">{l.size} × {l.qty}</p></div>
              <p className="font-semibold">{rs(l.price * l.qty)}</p>
            </li>
          ))}
        </ul>
        <dl className="mt-6 space-y-2 border-t border-ink/10 pt-5 text-sm">
          <div className="flex justify-between"><dt>Subtotal</dt><dd>{rs(o.subtotal)}</dd></div>
          {!!o.discount && <div className="flex justify-between text-emerald"><dt>Discount</dt><dd>−{rs(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt>Delivery</dt><dd>{o.shipping ? rs(o.shipping) : "FREE"}</dd></div>
          <div className="flex justify-between font-display text-2xl"><dt>Total</dt><dd className="font-semibold text-emerald">{rs(o.total)}</dd></div>
          <div className="flex justify-between pt-2 text-muted"><dt>Payment</dt><dd>{o.payment === "bank" ? "Bank transfer / wallet" : "Cash on delivery"}</dd></div>
          <div className="flex justify-between text-muted"><dt>Delivering to</dt><dd>{o.city}</dd></div>
        </dl>
      </div>
      <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
        <a href={`https://wa.me/${s.whatsapp}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="rounded-full bg-[#25D366] px-7 py-4 text-center text-sm font-bold uppercase tracking-[0.16em] text-white">Confirm on WhatsApp</a>
        <Link href="/shop" className="btn-gold rounded-full px-7 py-4 text-center text-sm font-bold uppercase tracking-[0.16em]">Continue shopping</Link>
      </div>
    </div>
  );
}
