/**
 * Five stars as one masked element instead of five inline SVGs:
 * the review wall alone used to ship ~70 KB of star markup.
 */
export function Stars({ value, size = 16, className = "", label = true }: { value: number; size?: number; className?: string; label?: boolean }) {
  const filled = Math.max(0, Math.min(5, Math.round(value)));
  return (
    <span
      role={label ? "img" : undefined}
      aria-label={label ? `${filled} out of 5 stars` : undefined}
      aria-hidden={label ? undefined : true}
      className={`stars ${className}`}
      style={{ ["--s" as string]: `${size}px`, ["--pct" as string]: `${filled * 20}%` }}
    />
  );
}
