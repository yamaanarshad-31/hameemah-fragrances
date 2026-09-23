import { useId } from "react";

/**
 * Hand-drawn perfume bottle used whenever a product has no uploaded photo.
 * `color` is the juice colour, `shape` picks one of four silhouettes.
 */
export function Bottle({ color = "#b8860b", shape = 0, name, className }: { color?: string | null; shape?: number | null; name?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const c = color || "#b8860b";
  const k = ((shape ?? 0) % 4 + 4) % 4;

  const body = [
    // 0 faceted square flacon
    "M40 118 L52 104 H148 L160 118 V262 L148 276 H52 L40 262 Z",
    // 1 tall slim rectangle
    "M58 96 Q58 88 66 88 H134 Q142 88 142 96 V270 Q142 280 132 280 H68 Q58 280 58 270 Z",
    // 2 round flacon
    "M100 104 C150 104 172 150 172 192 C172 244 140 280 100 280 C60 280 28 244 28 192 C28 150 50 104 100 104 Z",
    // 3 arched wide
    "M34 150 Q34 104 100 104 Q166 104 166 150 V266 Q166 280 152 280 H48 Q34 280 34 266 Z",
  ][k];
  const liquidTop = [132, 118, 150, 142][k];
  const neckY = [88, 72, 88, 88][k];

  return (
    <svg viewBox="0 0 200 300" className={className} role="img" aria-label={name ? `${name} perfume bottle` : "Perfume bottle"}>
      <defs>
        <linearGradient id={`gl${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
          <stop offset=".18" stopColor="#ffffff" stopOpacity=".08" />
          <stop offset=".8" stopColor="#ffffff" stopOpacity=".04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".35" />
        </linearGradient>
        <linearGradient id={`lq${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".75" />
          <stop offset="1" stopColor={c} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`au${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a14" />
          <stop offset=".3" stopColor="#f3dc8f" />
          <stop offset=".55" stopColor="#d4af37" />
          <stop offset=".8" stopColor="#fff1b8" />
          <stop offset="1" stopColor="#8a6a14" />
        </linearGradient>
        <clipPath id={`cl${id}`}><path d={body} /></clipPath>
        <radialGradient id={`sh${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="288" rx="78" ry="9" fill={`url(#sh${id})`} />

      {/* glass */}
      <path d={body} fill="#ffffff" fillOpacity=".16" stroke="#ffffff" strokeOpacity=".5" strokeWidth="1.5" />
      <g clipPath={`url(#cl${id})`}>
        <rect x="0" y={liquidTop} width="200" height="200" fill={`url(#lq${id})`} />
        <path d={`M0 ${liquidTop} Q50 ${liquidTop - 5} 100 ${liquidTop} T200 ${liquidTop}`} fill="#fff" fillOpacity=".25" />
        <rect x="0" y="0" width="200" height="300" fill={`url(#gl${id})`} />
        <rect x={k === 1 ? 70 : 52} y="110" width="7" height="160" rx="3.5" fill="#fff" fillOpacity=".35" />
      </g>

      {/* label */}
      <g transform={`translate(100 ${k === 2 ? 204 : 200})`}>
        <rect x="-38" y="-30" width="76" height="60" rx="3" fill="#06140d" fillOpacity=".82" stroke={`url(#au${id})`} strokeWidth="1.4" />
        <text y="4" textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" fill={`url(#au${id})`}>H</text>
        <text y="21" textAnchor="middle" fontFamily="Georgia, serif" fontSize="6.2" letterSpacing="1.4" fill="#f3dc8f">
          {(name || "HAMEEMAH").toUpperCase().slice(0, 18)}
        </text>
      </g>

      {/* neck + cap */}
      <rect x="84" y={neckY + 8} width="32" height={104 - neckY - 6} fill={`url(#au${id})`} />
      {k === 0 && (
        <g>
          <path d="M70 52 H130 L140 66 L100 98 L60 66 Z" fill={`url(#au${id})`} />
          <path d="M70 52 L85 66 H115 L130 52 M60 66 H140 M85 66 L100 98 L115 66" stroke="#7a5c10" strokeOpacity=".55" fill="none" />
          <path d="M100 20 C92 32 92 42 100 50 C108 42 108 32 100 20 Z" fill={`url(#au${id})`} />
        </g>
      )}
      {k === 1 && <rect x="74" y="22" width="52" height="54" rx="4" fill={`url(#au${id})`} />}
      {k === 2 && <circle cx="100" cy="62" r="30" fill={`url(#au${id})`} />}
      {k === 3 && <path d="M66 88 L78 40 H122 L134 88 Z" fill={`url(#au${id})`} />}
    </svg>
  );
}
