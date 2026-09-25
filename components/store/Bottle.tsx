import { useId } from "react";

/** Fits the product name on the 76-unit label: one line if short, otherwise two balanced lines. */
function labelLines(name: string) {
  const n = name.toUpperCase();
  if (n.length <= 13) return [n];
  const words = n.split(" ");
  let best = [n.slice(0, 14), n.slice(14, 28)];
  let bestLen = Infinity;
  for (let i = 1; i < words.length; i++) {
    const a = words.slice(0, i).join(" "), b = words.slice(i).join(" ");
    const worst = Math.max(a.length, b.length);
    if (worst < bestLen) { bestLen = worst; best = [a, b]; }
  }
  return best.map((l) => (l.length > 17 ? l.slice(0, 16) + "…" : l));
}

/**
 * Hand-drawn perfume bottle used whenever a product has no uploaded photo. It follows the
 * shop's real bottle: octagonal glass (a rectangle with cut corners), a flared gold collar
 * and a faceted crystal cap.
 * `color` is the juice colour; `shape` picks one of four variants — standard or wide body,
 * each with the diamond-cut cap or the square crystal cap.
 */
export function Bottle({ color = "#b8860b", shape = 0, name, className }: { color?: string | null; shape?: number | null; name?: string; className?: string }) {
  const id = useId().replace(/:/g, "");
  const c = color || "#b8860b";
  const k = ((shape ?? 0) % 4 + 4) % 4;
  const wide = k >= 2;
  const squareCap = k % 2 === 1;

  // octagonal body
  const L = wide ? 30 : 40, R = 200 - L, T = 118, B = 280, ch = wide ? 16 : 14;
  const body = `M${L + ch} ${T} H${R - ch} L${R} ${T + ch} V${B - ch} L${R - ch} ${B} H${L + ch} L${L} ${B - ch} V${T + ch} Z`;
  const liquidTop = 138;

  return (
    <svg viewBox="0 0 200 300" className={className} role="img" aria-label={name ? `${name} perfume bottle` : "Perfume bottle"}>
      <defs>
        <linearGradient id={`gl${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".55" />
          <stop offset=".12" stopColor="#ffffff" stopOpacity=".1" />
          <stop offset=".85" stopColor="#ffffff" stopOpacity=".04" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".4" />
        </linearGradient>
        <linearGradient id={`lq${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".7" />
          <stop offset="1" stopColor={c} stopOpacity="1" />
        </linearGradient>
        <linearGradient id={`au${id}`} x1="0" x2="1">
          <stop offset="0" stopColor="#8a6a14" />
          <stop offset=".3" stopColor="#f3dc8f" />
          <stop offset=".55" stopColor="#d4af37" />
          <stop offset=".8" stopColor="#fff1b8" />
          <stop offset="1" stopColor="#8a6a14" />
        </linearGradient>
        <linearGradient id={`cr${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity=".75" />
          <stop offset=".45" stopColor="#fff6dc" stopOpacity=".3" />
          <stop offset="1" stopColor="#ffffff" stopOpacity=".55" />
        </linearGradient>
        <clipPath id={`cl${id}`}><path d={body} /></clipPath>
        <radialGradient id={`sh${id}`} cx=".5" cy=".5" r=".5">
          <stop offset="0" stopColor="#000" stopOpacity=".35" />
          <stop offset="1" stopColor="#000" stopOpacity="0" />
        </radialGradient>
      </defs>

      <ellipse cx="100" cy="288" rx="80" ry="9" fill={`url(#sh${id})`} />

      {/* glass */}
      <path d={body} fill="#ffffff" fillOpacity=".16" stroke="#ffffff" strokeOpacity=".55" strokeWidth="1.5" strokeLinejoin="round" />
      <g clipPath={`url(#cl${id})`}>
        <rect x="0" y={liquidTop} width="200" height="200" fill={`url(#lq${id})`} />
        <path d={`M0 ${liquidTop} Q50 ${liquidTop - 5} 100 ${liquidTop} T200 ${liquidTop}`} fill="#fff" fillOpacity=".25" />
        <rect x="0" y="0" width="200" height="300" fill={`url(#gl${id})`} />
        <rect x={L + 7} y={T + 12} width="6" height={B - T - 26} rx="3" fill="#fff" fillOpacity=".35" />
      </g>
      {/* the thick glass shows an inner rounded panel, like the real bottle */}
      <rect x={L + 16} y={T + 22} width={R - L - 32} height={B - T - 42} rx="8" fill="none" stroke="#ffffff" strokeOpacity=".35" strokeWidth="1.2" />
      {/* cut-corner facets */}
      <path d={`M${L} ${T + ch} L${L + 16} ${T + 22} M${R} ${T + ch} L${R - 16} ${T + 22} M${L} ${B - ch} L${L + 16} ${B - 20} M${R} ${B - ch} L${R - 16} ${B - 20}`} stroke="#ffffff" strokeOpacity=".35" strokeWidth="1" />
      {/* dip tube */}
      <path d={`M100 ${T} V${B - 26}`} stroke="#ffffff" strokeOpacity=".3" strokeWidth="2" />

      {/* label */}
      <g transform="translate(100 200)">
        <rect x="-38" y="-30" width="76" height="60" rx="3" fill="#06140d" fillOpacity=".82" stroke={`url(#au${id})`} strokeWidth="1.4" />
        <text y={name && name.length > 13 ? 0 : 4} textAnchor="middle" fontFamily="Georgia, serif" fontSize="26" fill={`url(#au${id})`}>H</text>
        {labelLines(name || "Hameemah").map((line, i, all) => (
          <text key={i} y={all.length > 1 ? 15.5 + i * 7.5 : 21} textAnchor="middle" fontFamily="Georgia, serif" fontSize={all.length > 1 ? 5.4 : 6.2} letterSpacing={all.length > 1 ? 0.9 : 1.4} fill="#f3dc8f">
            {line}
          </text>
        ))}
      </g>

      {/* flared gold collar */}
      <path d="M78 119 L82 106 Q84 100 88 99 H112 Q116 100 118 106 L122 119 Z" fill={`url(#au${id})`} />
      <rect x="84" y="90" width="32" height="10" rx="2" fill={`url(#au${id})`} />
      <path d="M84 95 H116 M81 111 H119" stroke="#7a5c10" strokeOpacity=".45" strokeWidth="1" />

      {/* faceted crystal cap, with the gold stem showing through */}
      <rect x="94" y={squareCap ? 40 : 50} width="12" height={squareCap ? 50 : 40} fill={`url(#au${id})`} opacity=".55" />
      {squareCap ? (
        <g>
          <rect x="68" y="22" width="64" height="68" rx="4" fill={`url(#cr${id})`} stroke="#ffffff" strokeOpacity=".8" strokeWidth="1.3" />
          <rect x="76" y="30" width="48" height="52" rx="2" fill="none" stroke="#ffffff" strokeOpacity=".45" />
          <path d="M68 22 L76 30 M132 22 L124 30 M68 90 L76 82 M132 90 L124 82" stroke="#ffffff" strokeOpacity=".45" />
        </g>
      ) : (
        <g>
          <path d="M72 26 H128 L144 50 L118 90 H82 L56 50 Z" fill={`url(#cr${id})`} stroke="#ffffff" strokeOpacity=".8" strokeWidth="1.3" strokeLinejoin="round" />
          <path d="M72 26 L86 50 L100 26 L114 50 L128 26 M56 50 H144 M86 50 L96 90 M114 50 L104 90 M86 50 L82 90 M114 50 L118 90" fill="none" stroke="#ffffff" strokeOpacity=".5" strokeWidth="1" />
          <path d="M76 30 L84 44" stroke="#ffffff" strokeOpacity=".9" strokeWidth="2" strokeLinecap="round" />
        </g>
      )}
    </svg>
  );
}
