import Link from "next/link";

export function PageTitle({ title, sub, action }: { title: string; sub?: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-4 sm:mb-8">
      <div className="min-w-0">
        <h1 className="break-words font-display text-[2.1rem] font-semibold leading-tight sm:text-5xl">{title}</h1>
        {sub && <p className="mt-1 text-sm text-muted">{sub}</p>}
      </div>
      {action}
    </div>
  );
}

export function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`min-w-0 rounded-2xl border border-black/5 bg-white p-4 sm:p-5 shadow-[0_1px_2px_rgba(0,0,0,.04),0_12px_30px_-20px_rgba(6,20,13,.25)] ${className}`}>{children}</div>;
}

export function ButtonLink({ href, children }: { href: string; children: React.ReactNode }) {
  return <Link href={href} className="inline-flex min-h-11 items-center gap-2 rounded-xl bg-emerald px-5 py-3 text-sm font-semibold text-cream shadow-sm transition hover:bg-emerald-2">{children}</Link>;
}

const STATUS_STYLE: Record<string, string> = {
  pending: "bg-amber-100 text-amber-900",
  confirmed: "bg-sky-100 text-sky-900",
  shipped: "bg-violet-100 text-violet-900",
  delivered: "bg-emerald-100 text-emerald-900",
  cancelled: "bg-red-100 text-red-900",
};
const STATUS_DOT: Record<string, string> = { pending: "●", confirmed: "✓", shipped: "➜", delivered: "✔", cancelled: "✕" };

export function StatusBadge({ status }: { status: string }) {
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLE[status] ?? "bg-gray-100"}`}><span aria-hidden>{STATUS_DOT[status]}</span>{status}</span>;
}

export const inputCls = "w-full rounded-xl border border-black/10 bg-white px-3.5 py-2.5 text-sm focus:border-emerald focus:outline-none focus:ring-2 focus:ring-emerald/15";
export const labelCls = "block text-xs font-semibold uppercase tracking-wider text-ink/60";
