"use client";
import { useEffect } from "react";
import { getLenis } from "./SmoothScroll";

/** Freeze the page behind an open drawer or overlay (native scroll on phones, lenis on desktop). */
export function useScrollLock(on: boolean) {
  useEffect(() => {
    if (!on) return;
    const lenis = getLenis();
    const html = document.documentElement;
    const prev = html.style.overflow;
    lenis?.stop();
    html.style.overflow = "hidden";
    return () => { lenis?.start(); html.style.overflow = prev; };
  }, [on]);
}
