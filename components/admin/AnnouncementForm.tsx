"use client";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { saveAnnouncement } from "@/app/actions/admin";
import { showDay, windowState } from "@/lib/pricing";
import { SavedNote, useFlash } from "./FeatureToggle";
import { Card, inputCls, labelCls } from "./ui";

export function AnnouncementForm({ messages, start, end }: { messages: string[]; start: string; end: string }) {
  const router = useRouter();
  const [list, setList] = useState(messages.length ? messages : [""]);
  const [from, setFrom] = useState(start);
  const [to, setTo] = useState(end);
  const [pending, run] = useTransition();
  const [msg, flash] = useFlash();
  const save = () => run(async () => {
    const r = await saveAnnouncement({ messages: list, start: from, end: to });
    if (!r.ok) { flash(r.error, true); return; }
    flash("Saved");
    router.refresh();
  });
  const state = windowState(from, to);
  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
      <Card>
        <p className="font-semibold">Messages</p>
        <p className="mb-4 text-sm text-muted">Each message scrolls across the bar one after another.</p>
        <ul className="space-y-2">
          {list.map((m, i) => (
            <li key={i} className="flex items-center gap-2">
              <input aria-label={`Message ${i + 1}`} value={m} maxLength={160} onChange={(e) => setList(list.map((x, k) => (k === i ? e.target.value : x)))} placeholder="e.g. Free delivery on orders above Rs. 5,000" className={inputCls} />
              <button type="button" onClick={() => setList(list.filter((_, k) => k !== i))} disabled={list.length === 1} aria-label={`Remove message ${i + 1}`} className="flex size-11 shrink-0 items-center justify-center rounded-xl text-muted hover:bg-red-50 hover:text-red-700 disabled:opacity-30"><Trash2 className="size-4" /></button>
            </li>
          ))}
        </ul>
        {list.length < 8 && <button type="button" onClick={() => setList([...list, ""])} className="mt-2 flex min-h-11 items-center gap-1.5 text-sm font-semibold text-emerald"><Plus className="size-4" /> Add message</button>}
      </Card>
      <Card className="self-start">
        <p className="font-semibold">Schedule (optional)</p>
        <p className="mb-4 text-sm text-muted">Leave both empty to show the bar all the time. With dates, it appears and disappears by itself.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-1">
          <label className="block min-w-0"><span className={labelCls}>Start date</span><input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className={`${inputCls} mt-1`} /></label>
          <label className="block min-w-0"><span className={labelCls}>End date</span><input type="date" value={to} min={from || undefined} onChange={(e) => setTo(e.target.value)} className={`${inputCls} mt-1`} /></label>
        </div>
        {(from || to) && <button type="button" onClick={() => { setFrom(""); setTo(""); }} className="mt-1 min-h-11 text-sm font-semibold text-muted underline-offset-4 hover:underline">Clear dates</button>}
        <p className="mt-2 rounded-lg bg-black/[.03] p-3 text-sm">
          {state === "none" && "No dates — shows whenever the bar is ON."}
          {state === "live" && `Inside the dates — showing${to ? ` until ${showDay(to)}` : ""}.`}
          {state === "scheduled" && `Will start showing on ${showDay(from)}.`}
          {state === "ended" && `Ended on ${showDay(to)} — the bar is hidden now.`}
        </p>
      </Card>
      <div className="flex items-center gap-4 xl:col-span-2">
        <button type="button" onClick={save} disabled={pending} className="btn-gold min-h-11 rounded-xl px-7 py-2.5 text-sm font-bold disabled:opacity-60">{pending ? "Saving…" : "Save announcement"}</button>
        <SavedNote msg={msg} />
      </div>
    </div>
  );
}
