"use client";
import { useOptimistic, useTransition } from "react";
import { setOrderStatus } from "@/app/actions/admin";
import { STATUSES } from "@/lib/format";

const CLS: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900", confirmed: "bg-sky-100 text-sky-900", shipped: "bg-violet-100 text-violet-900",
  delivered: "bg-emerald-100 text-emerald-900", cancelled: "bg-red-100 text-red-900",
};

export function StatusSelect({ id, status }: { id: number; status: string }) {
  const [opt, setOpt] = useOptimistic(status);
  const [pending, start] = useTransition();
  return (
    <select
      aria-label="Order status"
      value={opt}
      disabled={pending}
      onChange={(e) => {
        const v = e.target.value;
        if (v === "cancelled" && !confirm("Cancel this order? Its items go back into stock.")) return;
        start(async () => { setOpt(v); await setOrderStatus(id, v); });
      }}
      className={`cursor-pointer rounded-full border-0 px-3 py-1.5 text-xs font-semibold capitalize focus:ring-2 focus:ring-emerald/30 ${CLS[opt]}`}
    >
      {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
    </select>
  );
}
