import Image from "next/image";

/**
 * The house bottle, cut out of the brand photo (public/photos/bottle-cutout.webp): faceted
 * crystal cap, gold collar, the monogram on the glass. Used wherever a bottle is shown without
 * a product photo. The cut-out keeps the dark set behind the glass, so it reads best on dark
 * or emerald surfaces. Size it with a height class; the width follows.
 */
export function SignatureBottle({ name, className = "", sizes = "240px", priority }: { name?: string; className?: string; sizes?: string; priority?: boolean }) {
  return (
    <Image
      src="/photos/bottle-cutout.webp"
      alt={name ? `${name} perfume bottle` : "Fragrances by Hameemah perfume bottle"}
      width={469}
      height={900}
      sizes={sizes}
      priority={priority}
      className={`w-auto select-none ${className}`}
      draggable={false}
    />
  );
}
