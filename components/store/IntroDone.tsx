"use client";
import { useEffect } from "react";

export function IntroDone() {
  useEffect(() => {
    try {
      // when the layout renders on the client (e.g. a 404 inside the store) the inline script never ran
      const seen = sessionStorage.getItem("hf_intro") || /[?&]intro=skip/.test(location.search) || matchMedia("(prefers-reduced-motion: reduce)").matches;
      if (seen) document.documentElement.classList.add("intro-seen");
      sessionStorage.setItem("hf_intro", "1");
    } catch {}
  }, []);
  return null;
}

