export function Announcement({ text }: { text: string }) {
  const parts = text.split("|").map((s) => s.trim()).filter(Boolean);
  const row = [...parts, ...parts, ...parts];
  return (
    <div className="relative z-50 overflow-hidden bg-ink py-2 text-[0.7rem] font-medium uppercase tracking-[0.2em] text-gold-2" style={{ ["--marquee-dur" as string]: "45s" }}>
      <div className="flex w-max animate-marquee">
        {[0, 1].map((k) => (
          <div key={k} className="flex shrink-0" aria-hidden={k === 1}>
            {row.map((p, i) => (
              <span key={i} className="flex items-center whitespace-nowrap px-6">
                <span className="mr-6 text-gold">✦</span>
                {p}
              </span>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
