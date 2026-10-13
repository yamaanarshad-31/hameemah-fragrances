export function Announcement({ messages }: { messages: string[] }) {
  if (!messages.length) return null;
  // repeated so even one short message fills a wide screen before the loop restarts
  const row = Array.from({ length: Math.max(3, Math.ceil(9 / messages.length)) }, () => messages).flat();
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
