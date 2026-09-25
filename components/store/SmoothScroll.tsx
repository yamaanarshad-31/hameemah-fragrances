"use client";
import { useEffect } from "react";
import Lenis from "lenis";
import { usePathname } from "next/navigation";

let lenis: Lenis | null = null;
export const getLenis = () => lenis;

export function SmoothScroll() {
  const path = usePathname();
  useEffect(() => {
    // Phones and tablets keep their own native momentum scrolling; wheel smoothing is for mouse/trackpad only.
    if (window.matchMedia("(prefers-reduced-motion: reduce), (hover: none), (pointer: coarse)").matches) return;
    lenis = new Lenis({ duration: 1.1, smoothWheel: true, syncTouch: false, autoRaf: true });
    return () => {
      lenis?.destroy();
      lenis = null;
    };
  }, []);
  useEffect(() => {
    if (lenis) lenis.scrollTo(0, { immediate: true });
  }, [path]);
  return null;
}
