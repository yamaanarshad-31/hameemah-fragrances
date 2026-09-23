"use client";
import { useEffect } from "react";

export function IntroDone() {
  useEffect(() => {
    try { sessionStorage.setItem("hf_intro", "1"); } catch {}
  }, []);
  return null;
}

/** Seconds to hold hero animations so they play after the intro curtain opens. */
export function introDelay() {
  if (typeof document === "undefined") return 0;
  if (document.documentElement.classList.contains("intro-seen")) return 0;
  return Math.max(0, 2.6 - performance.now() / 1000);
}
