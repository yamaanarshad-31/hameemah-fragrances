"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Banknote, Landmark, Lock, Tag } from "lucide-react";
import { useCart } from "./cart";
import { ProductImage } from "./ProductImage";
import { checkCoupon, placeOrder } from "@/app/actions/public";
import { rs } from "@/lib/format";

const CITIES = ["Karachi", "Lahore", "Islamabad", "Rawalpindi", "Faisalabad", "Multan", "Peshawar", "Quetta", "Hyderabad", "Sialkot", "Gujranwala", "Sargodha", "Bahawalpur", "Abbottabad"];

function Field({ label, name, error, ...rest }: { label: string; name: string; error?: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink/70">{label}</span>
      <input name={name} aria-invalid={!!error} className={`mt-1.5 w-full rounded-xl border bg-white px-4 py-3.5 transition focus:outline-none ${error ? "border-red-600" : "border-ink/15 focus:border-emerald"}`} {...rest} />
      {error && <span className="mt-1 block text-sm text-red-700">{error}</span>}
    </label>
  );
}

export function CheckoutForm({ shippingFee, freeOver, bank }: { shippingFee: number; freeOver: number; bank: string }) {
  const router = useRouter();
  const { lines, subtotal, clear, ready, reprice } = useCart();
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [payment, setPayment] = useState<"cod" | "bank">("cod");
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [couponMsg, setCouponMsg] = useState("");
  const [pending, start] = useTransition();
  const [checking, startCheck] = useTransition();

  // the bag keeps the price from when an item was added; refresh it so the total shown is what gets charged
  const ids = [...new Set(lines.map((l) => l.productId))].join(",");
  useEffect(() => {
    if (!ready || !ids) return;
    fetch(`/api/products?ids=${ids}`).then((r) => r.json()).then((list: { id: number; variants: { size: string; price: number }[] }[]) => {
      const prices: Record<string, number> = {};
      for (const p of list) for (const v of p.variants) prices[`${p.id}|${v.size}`] = v.price;
      reprice(prices);
    }).catch(() => {});
  }, [ready, ids, reprice]);

  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const shipping = freeOver && subtotal - discount >= freeOver ? 0 : shippingFee;
  const total = subtotal - discount + shipping;

  const apply = () => startCheck(async () => {
    const r = await checkCoupon(code, subtotal);
    if (r.ok) { setCoupon({ code: r.code, percent: r.percent }); setCouponMsg(`${r.percent}% off applied ✦`); }
    else { setCoupon(null); setCouponMsg(r.msg); }
  });

  // an error goes away as soon as the shopper edits that field
  const clearError = (name: string) => {
    if (!errors[name]) return;
    setErrors((x) => { const y = { ...x }; delete y[name]; return y; });
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    start(async () => {
    const r = await placeOrder({
      name: String(fd.get("name")), phone: String(fd.get("phone")), email: String(fd.get("email") || ""),
      city: String(fd.get("city")), address: String(fd.get("address")), note: String(fd.get("note") || ""),
      payment, coupon: coupon?.code ?? "",
      items: lines.map((l) => ({ productId: l.productId, size: l.size, qty: l.qty })),
    });
    if (!r.ok) { setErrors(r.errors); window.scrollTo({ top: 0, behavior: "smooth" }); return; }
    clear();
    router.push(`/order/${r.orderNo}?new=1`);
    });
  };

  if (!ready) return <div className="h-96 animate-pulse rounded-[2rem] bg-cream-2/60" />;
  if (!lines.length && !pending)
    return (
      <div className="py-24 text-center">
        <p className="font-display text-4xl">Your bag is empty</p>
        <Link href="/shop" className="btn-gold mt-6 inline-flex rounded-full px-8 py-4 text-sm font-bold uppercase tracking-widest">Explore perfumes</Link>
      </div>
    );

  return (
    <form onSubmit={submit} onChange={(e) => clearError((e.nativeEvent.target as HTMLInputElement).name)} noValidate={false} className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)]">
      <div className="min-w-0 space-y-8">
        {errors.items && <p className="rounded-xl bg-red-50 p-4 text-red-800">{errors.items}</p>}
        <section>
          <h2 className="font-display text-3xl">Delivery details</h2>
          <div className="mt-5 grid gap-4 sm:grid-cols-2">
            <Field label="Full name" name="name" autoComplete="name" required error={errors.name} />
            <Field label="Mobile number" name="phone" type="tel" inputMode="tel" autoComplete="tel" placeholder="0300 1234567" required error={errors.phone} />
            <Field label="Email (optional)" name="email" type="email" autoComplete="email" error={errors.email} />
            <Field label="City" name="city" list="cities" autoComplete="address-level2" required error={errors.city} />
            <datalist id="cities">{CITIES.map((c) => <option key={c} value={c} />)}</datalist>
            <div className="sm:col-span-2"><Field label="Full address" name="address" autoComplete="street-address" placeholder="House #, street, area" required error={errors.address} /></div>
            <label className="block sm:col-span-2">
              <span className="text-xs font-bold uppercase tracking-[0.14em] text-ink/70">Order note (optional)</span>
              <textarea name="note" rows={2} maxLength={300} className="mt-1.5 w-full rounded-xl border border-ink/15 bg-white px-4 py-3 focus:border-emerald focus:outline-none" />
            </label>
          </div>
        </section>

        <section>
          <h2 className="font-display text-3xl">Payment</h2>
          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {([["cod", Banknote, "Cash on delivery", "Pay when your parcel arrives"], ["bank", Landmark, "Bank / JazzCash / Easypaisa", "We'll share details on WhatsApp"]] as const).map(([k, Icon, t, d]) => (
              <button type="button" key={k} onClick={() => setPayment(k)} aria-pressed={payment === k} className={`flex items-start gap-3 rounded-2xl border p-4 text-left transition ${payment === k ? "border-emerald bg-emerald/5 ring-1 ring-emerald" : "border-ink/15 bg-white hover:border-emerald"}`}>
                <Icon className="mt-0.5 size-5 text-gold-3" />
                <span><b className="block">{t}</b><span className="text-sm text-muted">{d}</span></span>
              </button>
            ))}
          </div>
          <AnimatePresence>
            {payment === "bank" && bank && (
              <motion.p initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} className="mt-3 overflow-hidden whitespace-pre-line rounded-xl bg-cream-2/70 p-4 text-sm">{bank}</motion.p>
            )}
          </AnimatePresence>
        </section>
      </div>

      <aside className="min-w-0 lg:sticky lg:top-28 lg:self-start">
        <div className="rounded-[2rem] bg-white p-5 shadow-[0_30px_70px_-40px_rgba(6,20,13,.5)] sm:p-6">
          <h2 className="font-display text-3xl">Order summary</h2>
          <ul className="mt-5 max-h-72 space-y-4 overflow-y-auto overscroll-contain pr-1 pt-1" data-lenis-prevent>
            {lines.map((l) => (
              <li key={l.productId + l.size} className="flex items-center gap-3">
                <div className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-emerald to-forest">
                  <ProductImage src={l.image} color={l.color} shape={l.shape} name={l.name} sizes="56px" />
                  <span className="absolute -right-1 -top-1 flex size-5 items-center justify-center rounded-full bg-gold text-[0.65rem] font-bold">{l.qty}</span>
                </div>
                <div className="min-w-0 flex-1"><p className="truncate font-semibold">{l.name}</p><p className="text-xs text-muted">{l.size}</p></div>
                <p className="whitespace-nowrap font-semibold">{rs(l.price * l.qty)}</p>
              </li>
            ))}
          </ul>
          <div className="mt-5 flex gap-2">
            <label className="flex min-w-0 flex-1 items-center gap-2 rounded-xl border border-ink/15 px-3 focus-within:border-emerald">
              <Tag className="size-4 shrink-0 text-muted" />
              <input value={code} onChange={(e) => { setCode(e.target.value.toUpperCase()); clearError("coupon"); }} placeholder="Discount code" aria-label="Discount code" className="w-full min-w-0 bg-transparent py-3 text-sm uppercase focus:outline-none" />
            </label>
            <button type="button" onClick={apply} disabled={!code || checking} className="min-h-11 shrink-0 rounded-xl bg-ink px-5 text-sm font-bold text-cream disabled:opacity-50">{checking ? "…" : "Apply"}</button>
          </div>
          {(couponMsg || errors.coupon) && <p className={`mt-2 text-sm ${coupon ? "text-emerald" : "text-red-700"}`}>{errors.coupon || couponMsg}</p>}

          <dl className="mt-5 space-y-2 border-t border-ink/10 pt-5 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{rs(subtotal)}</dd></div>
            {discount > 0 && <div className="flex justify-between text-emerald"><dt>Discount ({coupon?.code})</dt><dd>−{rs(discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd>{shipping ? rs(shipping) : <span className="font-semibold text-emerald">FREE</span>}</dd></div>
            <div className="flex justify-between border-t border-ink/10 pt-3 font-display text-2xl"><dt>Total</dt><dd className="font-semibold text-emerald">{rs(total)}</dd></div>
          </dl>
          <button disabled={pending} className="btn-gold mt-6 w-full rounded-full px-4 py-4 text-sm font-bold uppercase tracking-[0.12em] disabled:opacity-60 sm:tracking-[0.2em]">
            {pending ? "Placing order…" : `Place order · ${rs(total)}`}
          </button>
          <p className="mt-3 flex items-center justify-center gap-1.5 text-xs text-muted"><Lock className="size-3.5" /> Your details are safe with us</p>
        </div>
      </aside>
    </form>
  );
}
