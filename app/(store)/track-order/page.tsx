import type { Metadata } from "next";
import Link from "next/link";
import { PageHero } from "@/components/store/PageHero";
import { OrderTimeline } from "@/components/store/OrderTimeline";
import { getOrderPublic } from "@/lib/data";
import { rs } from "@/lib/format";
import { pageMeta } from "@/lib/site";

const meta = pageMeta({ title: "Track Your Order", description: "Check the delivery status of your Fragrances by Hameemah order with your order number and mobile number.", path: "/track-order" });

// A looked-up order (?no=&phone=) is personal: never index it.
export async function generateMetadata({ searchParams }: PageProps<"/track-order">): Promise<Metadata> {
  const sp = await searchParams;
  return sp.no || sp.phone ? { ...meta, robots: { index: false, follow: false } } : meta;
}

export default async function Track({ searchParams }: PageProps<"/track-order">) {
  const sp = await searchParams;
  const no = typeof sp.no === "string" ? sp.no.slice(0, 20) : "";
  const phone = typeof sp.phone === "string" ? sp.phone.slice(0, 20) : "";
  const order = no && phone ? await getOrderPublic(no, phone) : null;
  return (
    <>
      <PageHero eyebrow="Order tracking" title="Where's my perfume?" sub="Enter your order number and the mobile number you used at checkout." />
      <div className="mx-auto max-w-2xl px-5 py-14">
        <form className="grid gap-3 rounded-[2rem] bg-white p-6 shadow-[0_30px_70px_-40px_rgba(6,20,13,.5)] sm:grid-cols-[1fr_1fr_auto]">
          <input name="no" defaultValue={no} required placeholder="Order no. e.g. HF-AB12C" aria-label="Order number" className="rounded-xl border border-ink/15 px-4 py-3.5 uppercase focus:border-emerald focus:outline-none" />
          <input name="phone" defaultValue={phone} required type="tel" placeholder="0300 1234567" aria-label="Mobile number" className="rounded-xl border border-ink/15 px-4 py-3.5 focus:border-emerald focus:outline-none" />
          <button className="btn-gold rounded-xl px-6 py-3.5 text-sm font-bold uppercase tracking-widest">Track</button>
        </form>
        {no && phone && !order && <p className="mt-6 rounded-2xl bg-red-50 p-4 text-center text-red-800">We couldn&apos;t find an order with those details. Please check and try again.</p>}
        {order && (
          <div className="mt-8 rounded-[2rem] bg-white p-6 sm:p-8">
            <div className="mb-8 flex flex-wrap items-baseline justify-between gap-2">
              <p className="font-display text-3xl">{order.orderNo}</p>
              <p className="text-sm text-muted">{new Date(order.createdAt).toLocaleDateString("en-PK", { dateStyle: "long" })} · {rs(order.total)}</p>
            </div>
            <OrderTimeline status={order.status ?? "pending"} />
            <Link href={`/order/${order.orderNo}`} className="mt-8 inline-block text-sm font-semibold text-emerald underline-offset-4 hover:underline">View full order →</Link>
          </div>
        )}
      </div>
    </>
  );
}
