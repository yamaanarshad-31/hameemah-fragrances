"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { ExternalLink, FolderTree, LayoutDashboard, LogOut, Menu, MessageSquareQuote, Package, Settings, ShoppingCart, TicketPercent, X } from "lucide-react";
import { logout } from "@/app/actions/admin";

const NAV = [
  { href: "/admin", label: "Dashboard", I: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", I: ShoppingCart, badge: "pending" },
  { href: "/admin/products", label: "Products", I: Package },
  { href: "/admin/categories", label: "Categories", I: FolderTree },
  { href: "/admin/reviews", label: "Reviews", I: MessageSquareQuote, badge: "reviews" },
  { href: "/admin/coupons", label: "Coupons", I: TicketPercent },
  { href: "/admin/settings", label: "Settings", I: Settings },
] as const;

export function Sidebar({ pending, reviews }: { pending: number; reviews: number }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  const counts = { pending, reviews };
  const current = NAV.find(({ href }) => (href === "/admin" ? path === "/admin" : path.startsWith(href)));
  const alerts = pending + reviews;
  useEffect(() => {
    if (!open) return;
    const html = document.documentElement;
    html.style.overflow = "hidden";
    const esc = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", esc);
    return () => { html.style.overflow = ""; window.removeEventListener("keydown", esc); };
  }, [open]);
  const nav = (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto overscroll-contain px-3" aria-label="Admin">
      {NAV.map(({ href, label, I, ...rest }) => {
        const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
        const n = "badge" in rest ? counts[rest.badge] : 0;
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} aria-current={on ? "page" : undefined} className={`group flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm font-medium transition ${on ? "bg-gold text-ink shadow-[0_8px_20px_-8px_rgba(212,175,55,.7)]" : "text-cream/70 hover:bg-white/5 hover:text-cream"}`}>
            <I className="size-[18px]" />
            <span className="flex-1">{label}</span>
            {n > 0 && <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${on ? "bg-ink text-gold" : "bg-gold/20 text-gold-2"}`}>{n}</span>}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 pb-[calc(1rem+env(safe-area-inset-bottom))] pt-6">
        <a href="/" target="_blank" className="flex min-h-11 items-center gap-3 rounded-xl px-3 text-sm text-cream/60 hover:bg-white/5 hover:text-cream"><ExternalLink className="size-[18px]" /> View store</a>
        <form action={logout}><button className="flex min-h-11 w-full items-center gap-3 rounded-xl px-3 text-sm text-cream/60 hover:bg-white/5 hover:text-red-300"><LogOut className="size-[18px]" /> Sign out</button></form>
      </div>
    </nav>
  );
  const brand = (
    <Link href="/admin" className="flex items-center gap-3 px-6 py-6">
      <Image src="/brand/logo-mark.png" alt="" style={{ width: "auto" }} width={34} height={40} className="h-10 w-auto" />
      <span className="leading-tight"><span className="block font-caps text-sm tracking-[0.2em] text-gold-2">HAMEEMAH</span><span className="text-[0.65rem] uppercase tracking-[0.3em] text-cream/40">Admin</span></span>
    </Link>
  );
  return (
    <>
      <aside className="fixed inset-y-0 left-0 z-40 hidden w-64 flex-col bg-ink lg:flex">{brand}{nav}</aside>
      <div className="sticky top-0 z-40 flex h-14 items-center gap-2 bg-ink pl-1 pr-3 pt-[env(safe-area-inset-top)] lg:hidden print:hidden">
        <button onClick={() => setOpen(true)} className="relative flex size-11 items-center justify-center rounded-full text-cream" aria-label="Open menu" aria-expanded={open}>
          <Menu className="size-6" />
          {alerts > 0 && <span className="absolute right-2 top-2 size-2 rounded-full bg-gold" />}
        </button>
        <span className="flex-1 truncate font-semibold text-cream">{current?.label ?? "Admin"}</span>
        <Link href="/admin" className="flex items-center gap-2" aria-label="Admin dashboard"><Image src="/brand/logo-mark.png" alt="" style={{ width: "auto" }} width={28} height={33} className="h-8 w-auto" /><span className="font-caps text-xs tracking-[0.2em] text-gold-2">ADMIN</span></Link>
      </div>
      <AnimatePresence>
        {open && (
          <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Admin menu">
            <motion.div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
            <motion.aside className="absolute inset-y-0 left-0 flex h-dvh w-[82%] max-w-72 flex-col bg-ink pt-[env(safe-area-inset-top)] shadow-2xl" initial={{ x: "-100%" }} animate={{ x: 0 }} exit={{ x: "-100%" }} transition={{ type: "spring", damping: 32, stiffness: 320 }}>
              <button onClick={() => setOpen(false)} className="absolute right-2 top-[calc(1.25rem+env(safe-area-inset-top))] flex size-11 items-center justify-center rounded-full text-cream" aria-label="Close menu"><X className="size-6" /></button>
              {brand}{nav}
            </motion.aside>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
