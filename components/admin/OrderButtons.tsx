"use client";
import { Printer, Trash2 } from "lucide-react";
import { useTransition } from "react";
import { deleteOrder } from "@/app/actions/admin";

export function PrintButton() {
  return <button onClick={() => window.print()} className="flex min-h-10 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 py-2 text-sm font-semibold"><Printer className="size-4" /> Print slip</button>;
}

export function DeleteOrderButton({ id }: { id: number }) {
  const [pending, start] = useTransition();
  return (
    <button disabled={pending} onClick={() => confirm("Delete this order permanently? (To keep records, cancel it instead.)") && start(() => deleteOrder(id))} className="flex min-h-11 items-center gap-2 text-sm font-semibold text-red-700 disabled:opacity-50">
      <Trash2 className="size-4" /> Delete order
    </button>
  );
}
