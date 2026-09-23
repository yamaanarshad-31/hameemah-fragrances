"use client";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useCart } from "./cart";
import { SearchOverlay } from "./SearchOverlay";

type Cat = { name: string; slug: string };

export function Header({ categories }: { categories: Cat[] }) {
  const path = usePathname();
  const { count, setOpen, wishlist } = useCart();
  const [scrolled, setScrolled] = useState(false);
  const [menu, setMenu] = useState(false);
  const [search, setSearch] = useState(false);
  const overHero = path === "/";
  const solid = scrolled || !overHero;

  useEffect(() => {
    const on = () => setScrolled(window.scrollY > 40);
    on();
    window.addEventListener("scroll", on, { passive: true });
    return () => window.removeEventListener("scroll", on);
  }, []);
  // eslint-disable-next-line react-hooks/set-state-in-effect -- close menus on navigation
  useEffect(() => { setMenu(false); setSearch(false); }, [path]);

  const nav = [
    { href: "/shop", label: "Shop All" },
    ...categories.slice(0, 4).map((c) => ({ href: `/collections/${c.slug}`, label: c.name })),
    { href: "/track-order", label: "Track Order" },
  ];

  return (
    <>
      <header
        className={`sticky top-0 z-40 transition-all duration-500 ${
          solid ? "bg-forest/90 shadow-[0_10px_40px_-20px_rgba(0,0,0,.6)] backdrop-blur-xl" : "bg-transparent"
        } ${overHero ? "-mb-[76px] lg:-mb-[88px]" : ""}`}
      >
        <div className="mx-auto flex h-[76px] max-w-7xl items-center justify-between gap-4 px-4 lg:h-[88px] lg:px-8">
          <button onClick={() => setMenu(true)} className="p-2 text-gold-2 lg:hidden" aria-label="Open menu">
            <Menu className="size-6" />
          </button>

          <Link href="/" className="group flex items-center gap-3" aria-label="Fragrances by Hameemah — home">
            <Image src="/brand/logo-mark.png" alt="" style={{ width: "auto" }} width={48} height={61} priority className="h-11 w-auto transition-transform duration-700 group-hover:rotate-[-6deg] group-hover:scale-110 lg:h-13" />
            <span className="hidden flex-col leading-none sm:flex">
              <span className="font-caps text-[1.05rem] tracking-[0.22em] text-gold-shine">FRAGRANCES</span>
              <span className="mt-1 font-caps text-[0.6rem] tracking-[0.42em] text-gold-2/80">BY HAMEEMAH</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-7 lg:flex" aria-label="Main">
            {nav.map((n) => {
              const active = path === n.href || (n.href !== "/shop" && path.startsWith(n.href));
              return (
                <Link key={n.href} href={n.href} className={`group relative py-2 text-[0.78rem] font-medium uppercase tracking-[0.18em] transition-colors ${active ? "text-gold" : "text-cream/85 hover:text-gold-2"}`}>
                  {n.label}
                  <span className={`absolute -bottom-0.5 left-0 h-px bg-gold transition-all duration-500 ${active ? "w-full" : "w-0 group-hover:w-full"}`} />
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-1 text-cream sm:gap-2">
            <button onClick={() => setSearch(true)} className="rounded-full p-2.5 transition hover:bg-white/10 hover:text-gold-2" aria-label="Search">
              <Search className="size-5" />
            </button>
            <Link href="/wishlist" className="relative hidden rounded-full p-2.5 transition hover:bg-white/10 hover:text-gold-2 sm:block" aria-label="Wishlist">
              <Heart className="size-5" />
              {wishlist.length > 0 && <span className="absolute right-1 top-1 size-2 rounded-full bg-gold" />}
            </Link>
            <button onClick={() => setOpen(true)} className="relative rounded-full p-2.5 transition hover:bg-white/10 hover:text-gold-2" aria-label={`Cart, ${count} items`}>
              <ShoppingBag className="size-5" />
              <AnimatePresence>
                {count > 0 && (
                  <motion.span
                    key={count}
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    exit={{ scale: 0 }}
                    className="absolute -right-0.5 -top-0.5 flex size-5 items-center justify-center rounded-full bg-gold text-[0.65rem] font-bold text-ink"
                  >
                    {count}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </header>

      <AnimatePresence>
        {menu && (
          <motion.div className="fixed inset-0 z-50 bg-ink/95 backdrop-blur-xl lg:hidden" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <div className="flex h-[76px] items-center justify-between px-4">
              <Image src="/brand/logo-mark.png" alt="" style={{ width: "auto" }} width={40} height={51} className="h-10 w-auto" />
              <button onClick={() => setMenu(false)} className="p-2 text-gold-2" aria-label="Close menu"><X className="size-7" /></button>
            </div>
            <nav className="flex flex-col gap-1 px-8 pt-6">
              {[{ href: "/", label: "Home" }, ...nav, { href: "/wishlist", label: "Wishlist" }, { href: "/about", label: "Our Story" }, { href: "/contact", label: "Contact" }].map((n, i) => (
                <motion.div key={n.href} initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.05 * i + 0.1 }}>
                  <Link href={n.href} className="block border-b border-gold/15 py-4 font-display text-3xl text-cream hover:text-gold">
                    {n.label}
                  </Link>
                </motion.div>
              ))}
            </nav>
          </motion.div>
        )}
      </AnimatePresence>

      <SearchOverlay open={search} onClose={() => setSearch(false)} />
    </>
  );
}
