"use client";
import { useSyncExternalStore } from "react";

/** Touch screens and reduced-motion users get the light version of the heavy scroll/pointer effects. */
const QUERY = "(hover: none), (pointer: coarse), (prefers-reduced-motion: reduce)";

const subscribe = (cb: () => void) => {
  const m = window.matchMedia(QUERY);
  m.addEventListener("change", cb);
  return () => m.removeEventListener("change", cb);
};

export function useLite() {
  return useSyncExternalStore(subscribe, () => window.matchMedia(QUERY).matches, () => false);
}

/** Pointer tilt effects follow a mouse only; a finger dragging over a card is a scroll. */
export const isMouse = (e: { pointerType: string }) => e.pointerType === "mouse";
