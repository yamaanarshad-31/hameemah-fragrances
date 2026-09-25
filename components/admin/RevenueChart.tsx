"use client";
import { useEffect, useRef, useState } from "react";
import { rs } from "@/lib/format";

type Pt = { day: string; label: string; revenue: number; orders: number };

/** Single-series area chart with a crosshair tooltip. */
export function RevenueChart({ data }: { data: Pt[] }) {
  const [hover, setHover] = useState<number | null>(null);
  const [table, setTable] = useState(false);
  // draw at the real pixel width so the axis text stays readable on a phone instead of shrinking with the SVG
  const box = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(720);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.max(260, Math.round(e.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, [table]);
  const narrow = W < 480;
  const H = narrow ? 200 : 240, L = narrow ? 40 : 56, R = 12, T = 12, B = 28;
  const every = narrow ? 7 : 5;
  const max = Math.max(1000, ...data.map((d) => d.revenue));
  const nice = Math.ceil(max / Math.pow(10, Math.floor(Math.log10(max)))) * Math.pow(10, Math.floor(Math.log10(max)));
  const x = (i: number) => L + (i * (W - L - R)) / Math.max(1, data.length - 1);
  const y = (v: number) => T + (H - T - B) * (1 - v / nice);
  const line = data.map((d, i) => `${i ? "L" : "M"}${x(i)},${y(d.revenue)}`).join("");
  const area = `${line}L${x(data.length - 1)},${y(0)}L${x(0)},${y(0)}Z`;
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((f) => f * nice);
  const h = hover !== null ? data[hover] : null;

  return (
    <div>
      <div className="mb-2 flex justify-end">
        <button onClick={() => setTable((t) => !t)} className="-my-2 min-h-11 px-1 text-xs font-semibold text-emerald underline-offset-4 hover:underline">{table ? "Show chart" : "Show as table"}</button>
      </div>
      {table ? (
        <div className="max-h-64 overflow-y-auto text-sm">
          <table className="w-full"><thead><tr className="text-left text-xs uppercase text-muted"><th className="py-1">Day</th><th>Orders</th><th className="text-right">Revenue</th></tr></thead>
            <tbody>{data.map((d) => <tr key={d.day} className="border-t border-black/5"><td className="py-1.5">{d.label}</td><td>{d.orders}</td><td className="text-right tabular-nums">{rs(d.revenue)}</td></tr>)}</tbody></table>
        </div>
      ) : (
        <div ref={box} className="relative">
          <svg viewBox={`0 0 ${W} ${H}`} className="w-full touch-pan-y" role="img" aria-label="Revenue per day, last 30 days" onPointerLeave={() => setHover(null)}
            onPointerDown={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const px = ((e.clientX - r.left) / r.width) * W;
              setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - L) / (W - L - R)) * (data.length - 1)))));
            }}
            onPointerMove={(e) => {
              const r = e.currentTarget.getBoundingClientRect();
              const px = ((e.clientX - r.left) / r.width) * W;
              setHover(Math.max(0, Math.min(data.length - 1, Math.round(((px - L) / (W - L - R)) * (data.length - 1)))));
            }}>
            <defs>
              <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0f3d2a" stopOpacity=".28" /><stop offset="1" stopColor="#0f3d2a" stopOpacity="0" /></linearGradient>
            </defs>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={L} x2={W - R} y1={y(t)} y2={y(t)} stroke="#000" strokeOpacity=".06" />
                <text x={L - 8} y={y(t) + 4} textAnchor="end" fontSize="11" fill="#6f7a72">{t >= 1000 ? `${Math.round(t / 1000)}k` : t}</text>
              </g>
            ))}
            {data.map((d, i) => {
              const last = i === data.length - 1;
              if (!last && (i % every !== 0 || data.length - 1 - i < every / 2)) return null;
              return <text key={d.day} x={last ? x(i) + R : x(i)} y={H - 8} textAnchor={last ? "end" : "middle"} fontSize="11" fill="#6f7a72">{d.label}</text>;
            })}
            <path d={area} fill="url(#rev)" />
            <path d={line} fill="none" stroke="#0f3d2a" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
            {h && hover !== null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={T} y2={y(0)} stroke="#0f3d2a" strokeOpacity=".3" strokeDasharray="3 3" />
                <circle cx={x(hover)} cy={y(h.revenue)} r="5" fill="#d4af37" stroke="#fff" strokeWidth="2" />
              </g>
            )}
          </svg>
          {h && hover !== null && (
            <div className="pointer-events-none absolute top-0 rounded-xl bg-ink px-3 py-2 text-xs text-cream shadow-lg" style={{ left: `clamp(0px, calc(${(x(hover) / W) * 100}% - 60px), calc(100% - 130px))` }}>
              <p className="text-cream/60">{h.label}</p>
              <p className="text-sm font-semibold tabular-nums">{rs(h.revenue)}</p>
              <p className="text-cream/60">{h.orders} order{h.orders === 1 ? "" : "s"}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
