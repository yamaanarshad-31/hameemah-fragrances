import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { ArrowLeft, MessageCircle, Phone } from "lucide-react";
import { Card, PageTitle } from "@/components/admin/ui";
import { StatusSelect } from "@/components/admin/StatusSelect";
import { PrintButton, DeleteOrderButton } from "@/components/admin/OrderButtons";
import { ProductImage } from "@/components/store/ProductImage";
import { getDb, schema as s } from "@/lib/db";
import { rs } from "@/lib/format";

export const metadata = { title: "Order" };

export default async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const db = await getDb();
  const [o] = await db.select().from(s.orders).where(eq(s.orders.id, id));
  if (!o) notFound();
  const wa = o.phone.replace(/\D/g, "").replace(/^0/, "92");
  const msg = `Assalam o Alaikum ${o.name}! Thank you for ordering from Fragrances by Hameemah. Your order ${o.orderNo} of ${rs(o.total)} is ${o.status}.`;
  return (
    <>
      <Link href="/admin/orders" className="mb-2 inline-flex min-h-11 items-center gap-1 text-sm text-muted hover:text-ink print:hidden"><ArrowLeft className="size-4" /> All orders</Link>
      <PageTitle title={o.orderNo} sub={new Date(o.createdAt).toLocaleString("en-GB", { dateStyle: "full", timeStyle: "short" })} action={<div className="flex items-center gap-2 print:hidden"><StatusSelect id={o.id} status={o.status ?? "pending"} /><PrintButton /></div>} />
      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <Card>
          <p className="font-semibold">Items</p>
          <ul className="mt-4 divide-y divide-black/5">
            {o.items.map((i, k) => (
              <li key={k} className="flex items-center gap-3 py-3 sm:gap-4">
                <span className="relative h-16 w-14 shrink-0 overflow-hidden rounded-lg bg-gradient-to-b from-emerald to-forest"><ProductImage src={i.image} color={i.color} shape={i.shape} name={i.name} sizes="56px" /></span>
                <div className="min-w-0 flex-1"><p className="font-semibold">{i.name}</p><p className="text-sm text-muted">{i.size} · {rs(i.price)} × {i.qty}</p></div>
                <p className="whitespace-nowrap font-semibold tabular-nums">{rs(i.price * i.qty)}</p>
              </li>
            ))}
          </ul>
          <dl className="mt-4 space-y-1.5 border-t border-black/5 pt-4 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd className="tabular-nums">{rs(o.subtotal)}</dd></div>
            {!!o.discount && <div className="flex justify-between text-emerald"><dt>Discount {o.coupon && `(${o.coupon})`}</dt><dd className="tabular-nums">−{rs(o.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Delivery</dt><dd className="tabular-nums">{o.shipping ? rs(o.shipping) : "Free"}</dd></div>
            <div className="flex justify-between pt-2 text-lg font-bold"><dt>Total</dt><dd className="tabular-nums">{rs(o.total)}</dd></div>
            <div className="flex justify-between text-muted"><dt>Payment</dt><dd>{o.payment === "bank" ? "Bank / wallet transfer" : "Cash on delivery"}</dd></div>
          </dl>
        </Card>
        <div className="space-y-6">
          <Card>
            <p className="font-semibold">Customer</p>
            <p className="mt-3 text-lg">{o.name}</p>
            <p className="break-words text-sm text-muted">{o.phone}{o.email ? ` · ${o.email}` : ""}</p>
            <p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Deliver to</p>
            <p className="mt-1 text-sm">{o.address}<br />{o.city}</p>
            {o.note && <><p className="mt-3 text-xs font-semibold uppercase tracking-wider text-muted">Note</p><p className="mt-1 rounded-lg bg-amber-50 p-2 text-sm">{o.note}</p></>}
            <div className="mt-5 grid grid-cols-2 gap-2 print:hidden">
              <a href={`https://wa.me/${wa}?text=${encodeURIComponent(msg)}`} target="_blank" rel="noopener noreferrer" className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-[#25D366] py-2.5 text-sm font-semibold text-white"><MessageCircle className="size-4" /> WhatsApp</a>
              <a href={`tel:${o.phone}`} className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-ink py-2.5 text-sm font-semibold text-cream"><Phone className="size-4" /> Call</a>
            </div>
          </Card>
          <Card className="print:hidden"><DeleteOrderButton id={o.id} /></Card>
        </div>
      </div>
    </>
  );
}
