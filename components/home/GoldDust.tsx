"use client";
import { useEffect, useRef } from "react";

/** Slow rising gold particles — cheap 2D canvas, pauses when off-screen. */
export function GoldDust({ density = 70, className = "" }: { density?: number; className?: string }) {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const cv = ref.current!;
    const ctx = cv.getContext("2d");
    if (!ctx) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const touch = window.matchMedia("(hover: none), (pointer: coarse)").matches;
    let w = 0, h = 0, raf = 0, visible = true, last = 0;
    const dpr = Math.min(touch ? 1.5 : 2, window.devicePixelRatio || 1);
    // one pre-drawn glow sprite, stamped with drawImage: far cheaper than a new gradient per particle per frame
    const S = 32;
    const sprite = document.createElement("canvas");
    sprite.width = sprite.height = S;
    const sc = sprite.getContext("2d")!;
    const sg = sc.createRadialGradient(S / 2, S / 2, 0, S / 2, S / 2, S / 2);
    sg.addColorStop(0, "rgba(255,236,170,1)");
    sg.addColorStop(1, "rgba(212,175,55,0)");
    sc.fillStyle = sg;
    sc.fillRect(0, 0, S, S);
    type P = { x: number; y: number; r: number; vy: number; vx: number; a: number; tw: number };
    let ps: P[] = [];
    const resize = () => {
      // phone toolbars show/hide while scrolling and fire resize; only rebuild for a real size change
      if (w && cv.clientWidth === w && Math.abs(cv.clientHeight - h) < 160) return;
      w = cv.clientWidth; h = cv.clientHeight;
      cv.width = w * dpr; cv.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(((touch ? density * 0.6 : density) * w) / 1400) + (touch ? 10 : 20);
      ps = Array.from({ length: n }, () => ({ x: Math.random() * w, y: Math.random() * h, r: Math.random() * 1.8 + 0.4, vy: -(Math.random() * 0.35 + 0.08), vx: (Math.random() - 0.5) * 0.15, a: Math.random() * 0.6 + 0.2, tw: Math.random() * Math.PI * 2 }));
    };
    const draw = (t: number) => {
      if (!reduce && visible) raf = requestAnimationFrame(draw);
      // phones: ~30fps is plenty for slow drifting dust and halves the work
      if (touch && t - last < 30) return;
      const step = last ? Math.min(3, (t - last) / 16.7) : 1;
      last = t;
      ctx.clearRect(0, 0, w, h);
      for (const p of ps) {
        p.y += p.vy * step; p.x += (p.vx + Math.sin(t / 2000 + p.tw) * 0.12) * step;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        ctx.globalAlpha = p.a * (0.6 + 0.4 * Math.sin(t / 600 + p.tw));
        const d = p.r * 8;
        ctx.drawImage(sprite, p.x - d / 2, p.y - d / 2, d, d);
      }
      ctx.globalAlpha = 1;
    };
    resize();
    const io = new IntersectionObserver(([e]) => {
      visible = e.isIntersecting;
      cancelAnimationFrame(raf);
      last = 0;
      if (visible) raf = requestAnimationFrame(draw);
    });
    io.observe(cv);
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(draw);
    return () => { cancelAnimationFrame(raf); io.disconnect(); window.removeEventListener("resize", resize); };
  }, [density]);
  return <canvas ref={ref} aria-hidden className={`pointer-events-none absolute inset-0 h-full w-full ${className}`} />;
}
