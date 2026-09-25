"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
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
  const nav = (
    <nav className="flex flex-1 flex-col gap-1 px-3">
      {NAV.map(({ href, label, I, ...rest }) => {
        const on = href === "/admin" ? path === "/admin" : path.startsWith(href);
        const n = "badge" in rest ? counts[rest.badge] : 0;
        return (
          <Link key={href} href={href} onClick={() => setOpen(false)} className={`group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${on ? "bg-gold text-ink shadow-[0_8px_20px_-8px_rgba(212,175,55,.7)]" : "text-cream/70 hover:bg-white/5 hover:text-cream"}`}>
            <I className="size-[18px]" />
            <span className="flex-1">{label}</span>
            {n > 0 && <span className={`rounded-full px-2 py-0.5 text-[0.65rem] font-bold ${on ? "bg-ink text-gold" : "bg-gold/20 text-gold-2"}`}>{n}</span>}
          </Link>
        );
      })}
      <div className="mt-auto space-y-1 pb-4 pt-6">
        <a href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/60 hover:bg-white/5 hover:text-cream"><ExternalLink className="size-[18px]" /> View store</a>
        <form action={logout}><button className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-cream/60 hover:bg-white/5 hover:text-red-300"><LogOut className="size-[18px]" /> Sign out</button></form>
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
      <div className="sticky top-0 z-40 flex items-center justify-between bg-ink px-4 py-3 lg:hidden">
        <Link href="/admin" className="flex items-center gap-2"><Image src="/brand/logo-mark.png" alt="" style={{ width: "auto" }} width={28} height={33} className="h-8 w-auto" /><span className="font-caps text-sm tracking-[0.2em] text-gold-2">ADMIN</span></Link>
        <button onClick={() => setOpen(true)} className="p-1 text-cream" aria-label="Open menu"><Menu className="size-6" /></button>
      </div>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 flex w-72 flex-col bg-ink">
            <button onClick={() => setOpen(false)} className="absolute right-3 top-5 p-1 text-cream" aria-label="Close menu"><X className="size-6" /></button>
            {brand}{nav}
          </aside>
        </div>
      )}
    </>
  );
}
