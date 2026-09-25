import Image from "next/image";
import { Bottle } from "./Bottle";

export function ProductImage({ src, color, shape, name, alt, sizes = "(max-width: 768px) 50vw, 25vw", priority, className = "" }: {
  src?: string | null; color?: string | null; shape?: number | null; name: string; alt?: string; sizes?: string; priority?: boolean; className?: string;
}) {
  if (src) {
    return <Image src={src} alt={alt ?? name} fill sizes={sizes} priority={priority} className={`object-cover ${className}`} />;
  }
  return (
    <div className={`absolute inset-0 flex items-center justify-center ${className}`}>
      <Bottle color={color} shape={shape} name={name} className="h-[78%] w-auto drop-shadow-[0_20px_30px_rgba(0,0,0,.35)]" />
    </div>
  );
}
