import { Check, Package, PartyPopper, Truck, X } from "lucide-react";

const STEPS = [
  { k: "pending", t: "Order placed", I: Package },
  { k: "confirmed", t: "Confirmed", I: Check },
  { k: "shipped", t: "On the way", I: Truck },
  { k: "delivered", t: "Delivered", I: PartyPopper },
];

export function OrderTimeline({ status }: { status: string }) {
  if (status === "cancelled")
    return <p className="flex items-center gap-2 rounded-2xl bg-red-50 p-4 font-semibold text-red-800"><X className="size-5" /> This order was cancelled.</p>;
  const at = STEPS.findIndex((s) => s.k === status);
  return (
    <ol className="grid grid-cols-4 gap-2">
      {STEPS.map(({ k, t, I }, i) => (
        <li key={k} className="relative flex flex-col items-center text-center">
          {i > 0 && <span className={`absolute right-1/2 top-5 h-0.5 w-full -translate-y-1/2 ${i <= at ? "bg-gold" : "bg-ink/10"}`} />}
          <span className={`relative flex size-10 items-center justify-center rounded-full ${i <= at ? "bg-emerald text-gold" : "bg-cream-2 text-ink/30"} ${i === at ? "ring-4 ring-gold/30" : ""}`}><I className="size-5" /></span>
          <span className={`mt-2 text-xs font-semibold ${i <= at ? "text-ink" : "text-ink/40"}`}>{t}</span>
        </li>
      ))}
    </ol>
  );
}
